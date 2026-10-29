/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <deque>
#include <memory>
#include <string>
#include <vector>
#include <map>

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "PropertyTranslator.h"
#include "FunctionTranslator.h"
#include "JSClassRegister.h"
#include "PapiDataTransfer.h"
#include "NamespaceDef.h"

// 1: a new UStruct with the same full name (e.g. a regenerated class) keeps the js class of the env (the template is reused,
// only the translators are refreshed). 0: the js class is rebuilt (pesapi invalidate_class) when the type is used again
// after its template info is released (TryReleaseType)
#ifndef PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE
#define PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE 1
#endif

namespace PUERTS_NAMESPACE
{
// finalizer of a UScriptStruct registered by static binding (pesapi style)
struct FExternalFinalizer
{
    pesapi_finalize Finalize = nullptr;
    void* ClassData = nullptr;

    FORCEINLINE bool IsSet() const
    {
        return Finalize != nullptr;
    }

    FORCEINLINE void Reset()
    {
        Finalize = nullptr;
        ClassData = nullptr;
    }

    // may be called in a v8 worker thread (ArrayBuffer deleter), env private data is not available
    void operator()(void* Ptr) const;
};

// class definition of a UClass / UScriptStruct, the arrays and names are owned here, Definition points to them
struct FReflectedClass
{
    JSClassDefinition Definition = JSClassEmptyDefinition;

    // the UStruct this definition is built for
    TWeakObjectPtr<UStruct> Struct;

    std::string ClassName;

    // a deque does not move its elements, so the c strings of the names stay valid while names are added
    std::deque<std::string> Names;

    std::vector<JSFunctionInfo> Methods;

    std::vector<JSFunctionInfo> Functions;

    std::vector<JSPropertyInfo> Properties;

    std::vector<JSPropertyInfo> Variables;

    const char* AddName(const FString& Name)
    {
        Names.emplace_back(TCHAR_TO_UTF8(*Name));
        return Names.back().c_str();
    }

    const char* AddName(const char* Name)
    {
        Names.emplace_back(Name);
        return Names.back().c_str();
    }
};

// FStructWrapper (and the translators it owns) is shared by all js envs in the process, keyed by the full name of the
// UStruct, it only holds engine side data.
// The js class of a UStruct is described by a class definition (FReflectedClass) whose type id is the wrapper, the templates
// are created from it by the CppObjectMapper of each env. Since the wrapper is kept for a full name, a new UStruct with the
// same full name (e.g. a regenerated class) keeps the js class of the env (the template is cached by type id) unless
// PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE is 0, only the translators are refreshed.
// Only the current definition is held by the wrapper, the envs hold the definitions their templates are built from.
// The type tag is the first base, so a type id (the wrapper) can be checked to be a UClass one (FReflectedTypeTag::IsUClass)
// without a lookup.
class FStructWrapper : public FReflectedTypeTag
{
public:
    explicit FStructWrapper(UStruct* InStruct) : ExternalInitialize(nullptr), Struct(InStruct)
    {
        // the entries are copied into the class definitions, the userdata is the wrapper
        StaticClassInfo.Callback = &StaticClass;
        StaticClassInfo.Data = this;
        FindInfo.Callback = &Find;
        FindInfo.Data = this;
        LoadInfo.Callback = &Load;
        LoadInfo.Data = this;
    }

    // find (and point it to InStruct) or create the process wide wrapper of InStruct
    static std::shared_ptr<FStructWrapper> FindOrAdd(UStruct* InStruct);

    // called when the module shuts down
    static void ReleaseAll();

    // (re)scan the extension methods (static functions of UExtensionMethods subclasses), they are added to the class
    // definitions built afterwards
    static void InitExtensionMethodsMap();

    // the class definition of InStruct (this wrapper must be the one returned by FindOrAdd(InStruct)), built on first use
    // or when the wrapper is pointed to a new UStruct. With Refresh an existing definition is kept and only the translators
    // are re-pointed to the current properties / functions (by name)
    const JSClassDefinition* GetClassDefinition(UStruct* InStruct, bool Refresh);

    // the holder of the current class definition (the last one returned by GetClassDefinition), may be null
    const std::shared_ptr<FReflectedClass>& GetCurrentClass() const
    {
        return CurrentClass;
    }

    // the wrapper if TypeId is the type id of a reflected class (UClass / UScriptStruct), otherwise nullptr
    static FStructWrapper* FromTypeId(const void* TypeId);

    UStruct* GetStruct() const
    {
        return Struct.Get();
    }

protected:
    std::vector<std::shared_ptr<FPropertyTranslator>> Properties;

    TMap<FName, std::shared_ptr<FPropertyTranslator>> PropertiesMap;

    std::shared_ptr<FPropertyTranslator> GetPropertyTranslator(PropertyMacro* InProperty);

    TMap<FName, std::shared_ptr<FFunctionTranslator>> FunctionsMap;

    TMap<FName, std::shared_ptr<FFunctionTranslator>> MethodsMap;

    std::shared_ptr<FFunctionTranslator> GetFunctionTranslator(UFunction* InFunction);

    std::shared_ptr<FFunctionTranslator> GetMethodTranslator(UFunction* InFunction, bool IsExtension);

    void RefreshMethod(UFunction* InFunction);

    void AddExtensionMethods(const std::vector<UFunction*>& InExtensionMethods);

    // refresh the translators of InStruct, and fill the members of Out if it is not null
    void CollectMembers(UStruct* InStruct, FReflectedClass* Out);

    // Initialize of the class definitions, the object is created and bound by the wrapper, so nullptr is returned
    static void* ReflectedConstruct(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    std::vector<UFunction*> ExtensionMethods;

    pesapi_constructor ExternalInitialize;

    FExternalFinalizer ExternalFinalize;

    TWeakObjectPtr<UStruct> Struct;

    JSFunctionInfo StaticClassInfo;

    JSFunctionInfo FindInfo;

    JSFunctionInfo LoadInfo;

    // the current definition, the templates (and js functions) created from a definition reference it, so the env that
    // creates a template holds the definition (see GetCurrentClass) until the env is disposed
    std::shared_ptr<FReflectedClass> CurrentClass;

    static void StaticClass(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Find(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Load(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    friend class FScriptEnvImpl;
};

class FScriptStructWrapper : public FStructWrapper
{
public:
    explicit FScriptStructWrapper(UScriptStruct* InScriptStruct) : FStructWrapper(InScriptStruct)
    {
        Magic = FReflectedTypeTag::UScriptStructMagic;
    }

    // the wrapper if TypeId is the type id of a UScriptStruct value (see FReflectedTypeTag), otherwise nullptr
    FORCEINLINE static const FScriptStructWrapper* FromStructTypeId(const void* TypeId)
    {
        return FReflectedTypeTag::IsUScriptStruct(TypeId)
                   ? static_cast<const FScriptStructWrapper*>(static_cast<const FReflectedTypeTag*>(TypeId))
                   : nullptr;
    }

    // Finalize of the class definitions of UScriptStructs, the memory of an object owned by js is freed by the
    // CppObjectMapper through it
    static void ReflectedFinalize(struct pesapi_ffi* Apis, void* Ptr, void* ClassData, void* EnvPrivate);

    static void* Alloc(UScriptStruct* InScriptStruct);

    static void Free(TWeakObjectPtr<UStruct> InStruct, const FExternalFinalizer& InExternalFinalize, void* Ptr);

    void Free(void* Ptr)
    {
        Free(Struct, ExternalFinalize, Ptr);
    }

    // the constructor (called by FStructWrapper::ReflectedConstruct), returns the memory for the backend to bind (freed by
    // ReflectedFinalize), or nullptr if the object is bound already (IObjectMapper::TryBindOwnedStruct) or on failure
    void* New(struct pesapi_ffi* Apis, pesapi_callback_info Info);
};

class FClassWrapper : public FStructWrapper
{
public:
    explicit FClassWrapper(UClass* InClass) : FStructWrapper(InClass)
    {
        check(static_cast<FReflectedTypeTag*>(this) == static_cast<void*>(static_cast<FStructWrapper*>(this)));
        Magic = FReflectedTypeTag::UClassMagic;
    }

    // OnEnter / OnExit of the class definitions of UClasses: the native pointer of a UObject wrapper is the UObject itself,
    // it is not owned by js (no finalize), the env (IObjectMapper, the env private) keeps it alive while it is bound
    static void* ReflectedOnEnter(void* Ptr, void* ClassData, void* EnvPrivate);

    // may be called when the UObject is being destroyed (IObjectMapper::UnBind), the object must not be dereferenced
    static void ReflectedOnExit(void* Ptr, void* ClassData, void* EnvPrivate, void* UserData);

    // the constructor (called by FStructWrapper::ReflectedConstruct), returns the new UObject for the backend to bind, or
    // nullptr on failure
    void* New(struct pesapi_ffi* Apis, pesapi_callback_info Info);
};
}    // namespace PUERTS_NAMESPACE
