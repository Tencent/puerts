/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
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

#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#define PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE 1

namespace puerts
{
class FStructWrapper
{
public:
    explicit FStructWrapper(UStruct* InStruct) : ExternalInitialize(nullptr), ExternalFinalize(nullptr), Struct(InStruct)
    {
    }

    FORCEINLINE void Init(UStruct* InStruct, bool IsReuseTemplate)
    {
        Struct = InStruct;
        if (!IsReuseTemplate)
        {
            ExternalInitialize = nullptr;
            ExternalFinalize = nullptr;
            Properties.clear();
            ExtensionMethods.clear();
#if PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE
            CachedFunctionTemplate.Reset();
#endif
        }
    }

    void AddExtensionMethods(const std::vector<UFunction*>& InExtensionMethods);

#if PUERTS_REUSE_STRUCTWRAPPER_FUNCTIONTEMPLATE
    v8::UniquePersistent<v8::FunctionTemplate> CachedFunctionTemplate;
#endif

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

    v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate, v8::FunctionCallback Construtor);

    std::vector<UFunction*> ExtensionMethods;

    InitializeFunc ExternalInitialize;

    FinalizeFunc ExternalFinalize;

    TWeakObjectPtr<UStruct> Struct;

    bool IsNativeTakeJsRef = false;

    bool IsTypeScriptGeneratedClass = false;

    static void StaticClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Find(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Load(const v8::FunctionCallbackInfo<v8::Value>& Info);

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

    static void Free(TWeakObjectPtr<UStruct> InStruct, FinalizeFunc InExternalFinalize, void* Ptr);

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
}    // namespace puerts