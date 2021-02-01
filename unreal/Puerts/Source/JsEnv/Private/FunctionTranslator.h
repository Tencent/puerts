/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <memory>
#include <vector>
#include <functional>

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "PropertyTranslator.h"

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

namespace puerts
{
class FFunctionTranslator
{
public:
    explicit FFunctionTranslator(UFunction *InFunction);

    virtual ~FFunctionTranslator() {}

    virtual v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

    void CallJs(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Function> JsFunction, v8::Local<v8::Value> This, void *Params);

    void CallJs(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Function> JsFunction, v8::Local<v8::Value> This, UObject *ContextObject, FFrame &Stack, void *RESULT_PARAM);

    void Call(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info, std::function<void(void *)> OnCall);

protected:
    std::vector<std::unique_ptr<FPropertyTranslator>> Arguments;

    std::unique_ptr<FPropertyTranslator> Return;

    UFunction *Function;

    bool IsInterfaceFunction;

    UObject *BindObject;

    uint32 ParamsBufferSize;

private:
    static void Call(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void Call(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info);
};

class FExtensionMethodTranslator : public FFunctionTranslator
{
public:
    explicit FExtensionMethodTranslator(UFunction *InFunction);

    v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate) override;

private:
    static void CallExtension(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void CallExtension(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info);

    bool IsUObject;
};
}