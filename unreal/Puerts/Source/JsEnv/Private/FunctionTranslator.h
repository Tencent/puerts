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
    explicit FFunctionTranslator(UFunction* InFunction, bool IsDelegate);

    virtual ~FFunctionTranslator()
    {
        if (ArgumentDefaultValues)
        {
            FMemory::Free(ArgumentDefaultValues);
        }
    }

    virtual v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

    void CallJs(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Function> JsFunction,
        v8::Local<v8::Value> This, void* Params);

    void CallJs(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Function> JsFunction,
        v8::Local<v8::Value> This, UObject* ContextObject, FFrame& Stack, void* RESULT_PARAM);

    void Call(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info,
        std::function<void(void*)> OnCall);

    bool IsValid() const;

protected:
    FORCEINLINE bool Call_ProcessParams(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
        const v8::FunctionCallbackInfo<v8::Value>& Info, void* Params, int StartPos)
    {
        if (Return)
        {
            Return->Property->InitializeValue_InContainer(Params);
        }

        for (int i = StartPos; i < Arguments.size(); ++i)
        {
            Arguments[i]->Property->InitializeValue_InContainer(Params);

            if (UNLIKELY(ArgumentDefaultValues && Info[i - StartPos]->IsUndefined()))
            {
                Arguments[i]->Property->CopyCompleteValue_InContainer(Params, ArgumentDefaultValues);
            }
            else if (!Arguments[i]->JsToUEInContainer(Isolate, Context, Info[i - StartPos], Params, false))
            {
                return false;
            }
        }
        return true;
    }

    FORCEINLINE void Call_ProcessReturnAndOutParams(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
        const v8::FunctionCallbackInfo<v8::Value>& Info, void* Params, int StartPos)
    {
        if (Return)
        {
            Info.GetReturnValue().Set(Return->UEToJsInContainer(Isolate, Context, Params));
            Return->Property->DestroyValue_InContainer(Params);
        }

        for (int i = StartPos; i < Arguments.size(); ++i)
        {
            Arguments[i]->UEOutToJsInContainer(Isolate, Context, Info[i - StartPos], Params, false);
            if (Arguments[i]->ParamShallowCopySize == 0)
            {
                Arguments[i]->Property->DestroyValue_InContainer(Params);
            }
        }
    }

    std::vector<std::unique_ptr<FPropertyTranslator>> Arguments;

    std::unique_ptr<FPropertyTranslator> Return;

    TWeakObjectPtr<UFunction> Function;

    bool IsInterfaceFunction;

    TWeakObjectPtr<UObject> BindObject;

    bool IsStatic;

    bool SkipWorldContextInArg0;

    uint32 ParamsBufferSize;

    void* ArgumentDefaultValues;
#if WITH_EDITOR
    FName FunctionName;
#endif
private:
    static void Call(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void Call(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info);

    void SlowCall(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info,
        UObject* CallObject, UFunction* CallFunction, void* Params);

    void FastCall(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info,
        UObject* CallObject, UFunction* CallFunction, void* Params);

    void Init(UFunction* InFunction, bool IsDelegate);

    friend class FStructWrapper;
    friend class FJsEnvImpl;
};

class FExtensionMethodTranslator : public FFunctionTranslator
{
public:
    explicit FExtensionMethodTranslator(UFunction* InFunction);

    v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate) override;

private:
    static void CallExtension(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void CallExtension(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info);

    bool IsUObject;
};
}    // namespace puerts