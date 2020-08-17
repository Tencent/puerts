/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <memory>
#include <vector>

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "PropertyTranslator.h"
#include "FunctionTranslator.h"
#include "JSClassRegister.h"

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

namespace puerts
{
class FStructWrapper
{
public:
    explicit FStructWrapper(UStruct* InStruct): ExternalInitialize(nullptr), Struct(InStruct){}

    void AddExtensionMethods(std::vector<UFunction*> InExtensionMethods);

protected:
    std::vector<std::unique_ptr<FPropertyTranslator>> Properties;

    std::vector<std::unique_ptr<FFunctionTranslator>> Functions;

    void InitTemplateProperties(v8::Isolate* Isolate, UStruct *InStruct, v8::Local<v8::FunctionTemplate> Template);

    v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate, v8::FunctionCallback Construtor);

    std::vector<UFunction*> ExtensionMethods;

    InitializeFunc ExternalInitialize;
             
    union
    {
        UStruct *Struct;
        UClass *Class;
        UScriptStruct *ScriptStruct;
    };

    static void StaticClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Find(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Load(const v8::FunctionCallbackInfo<v8::Value>& Info);
};

class FScriptStructWrapper : public FStructWrapper
{
public:
    explicit FScriptStructWrapper(UScriptStruct *InScriptStruct) : FStructWrapper(InScriptStruct){}

    v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

    static void OnGarbageCollectedWithFree(const v8::WeakCallbackInfo<UScriptStruct>& Data);

    static void OnGarbageCollected(const v8::WeakCallbackInfo<UScriptStruct>& Data);

    static void *Alloc(UScriptStruct *InScriptStruct);
private:
        

private:
    static void New(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void New(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info);
};

class FClassWrapper : public FStructWrapper
{
public:
    explicit FClassWrapper(UClass *InClass) : FStructWrapper(InClass) {}

    v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

    static void OnGarbageCollected(const v8::WeakCallbackInfo<UClass>& Data);

private:
    static void New(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void New(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info);
};
}