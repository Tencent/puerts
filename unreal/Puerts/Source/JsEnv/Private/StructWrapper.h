/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <memory>
#include <vector>
#include <map>

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "PropertyTranslator.h"
#include "FunctionTranslator.h"
#include "JSClassRegister.h"
#include "NamespaceDef.h"

#define PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE 1

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

// FStructWrapper (and the translators it owns) is shared by all js envs in the process, keyed by the full name of the
// UStruct, it only holds engine side data, js templates are cached by each env.
class FStructWrapper
{
public:
    explicit FStructWrapper(UStruct* InStruct) : ExternalInitialize(nullptr), Struct(InStruct)
    {
        // the entries are referenced by the function templates, so they are filled once and never move
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

    FORCEINLINE void Init(UStruct* InStruct, bool IsReuseTemplate)
    {
        Struct = InStruct;
        if (!IsReuseTemplate)
        {
            ExternalInitialize = nullptr;
            ExternalFinalize.Reset();
            // translators are kept in PropertiesMap (templates of other envs may still reference them), Properties is
            // refilled in InitTemplateProperties
            Properties.clear();
        }
    }

    void AddExtensionMethods(const std::vector<UFunction*>& InExtensionMethods);

protected:
    std::vector<std::shared_ptr<FPropertyTranslator>> Properties;

    TMap<FName, std::shared_ptr<FPropertyTranslator>> PropertiesMap;

    std::shared_ptr<FPropertyTranslator> GetPropertyTranslator(PropertyMacro* InProperty);

    TMap<FName, std::shared_ptr<FFunctionTranslator>> FunctionsMap;

    TMap<FName, std::shared_ptr<FFunctionTranslator>> MethodsMap;

    std::shared_ptr<FFunctionTranslator> GetFunctionTranslator(UFunction* InFunction);

    std::shared_ptr<FFunctionTranslator> GetMethodTranslator(UFunction* InFunction, bool IsExtension);

    void RefreshMethod(UFunction* InFunction);

    void InitTemplateProperties(
        v8::Isolate* Isolate, UStruct* InStruct, v8::Local<v8::FunctionTemplate> Template, bool IsReuseTemplate);

    // Cache is the template slot of the calling env, an existing template in it is reused (only the translators are refreshed)
    v8::Local<v8::FunctionTemplate> ToFunctionTemplate(
        v8::Isolate* Isolate, v8::FunctionCallback Construtor, v8::UniquePersistent<v8::FunctionTemplate>& Cache);

    std::vector<UFunction*> ExtensionMethods;

    pesapi_constructor ExternalInitialize;

    FExternalFinalizer ExternalFinalize;

    TWeakObjectPtr<UStruct> Struct;

    JSFunctionInfo StaticClassInfo;

    JSFunctionInfo FindInfo;

    JSFunctionInfo LoadInfo;

    static void StaticClass(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Find(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    static void Load(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    friend class FJsEnvImpl;
};

class FScriptStructWrapper : public FStructWrapper
{
public:
    explicit FScriptStructWrapper(UScriptStruct* InScriptStruct) : FStructWrapper(InScriptStruct)
    {
    }

    static void OnGarbageCollectedWithFree(const v8::WeakCallbackInfo<FScriptStructWrapper>& Data);

    static void OnGarbageCollected(const v8::WeakCallbackInfo<FScriptStructWrapper>& Data);

    static void* Alloc(UScriptStruct* InScriptStruct);

    static void Free(TWeakObjectPtr<UStruct> InStruct, const FExternalFinalizer& InExternalFinalize, void* Ptr);

    void Free(void* Ptr)
    {
        Free(Struct, ExternalFinalize, Ptr);
    }

    static void New(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void New(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info);
};

class FClassWrapper : public FStructWrapper
{
public:
    explicit FClassWrapper(UClass* InClass) : FStructWrapper(InClass)
    {
    }

    static void OnGarbageCollected(const v8::WeakCallbackInfo<UClass>& Data);

    static void New(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void New(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info);
};
}    // namespace PUERTS_NAMESPACE