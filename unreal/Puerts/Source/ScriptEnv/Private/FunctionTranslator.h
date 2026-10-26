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
#include <functional>

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "PropertyTranslator.h"

#include "NamespaceDef.h"

namespace PUERTS_NAMESPACE
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

    // registry style entry of this function (used by the class definition of the owner), the userdata is the translator
    JSFunctionInfo CallbackInfo;

    // papi entries

    void CallJs(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value JsFunction, pesapi_value This, void* Params);

    void CallJs(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_value JsFunction, pesapi_value This, UObject* ContextObject,
        FFrame& Stack, void* RESULT_PARAM);

    void Call(struct pesapi_ffi* Apis, pesapi_callback_info Info, std::function<void(void*)> OnCall);

    bool IsValid() const;

protected:
    FORCEINLINE bool Call_ProcessParams(
        struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, void* Params, int StartPos)
    {
        if (Return)
        {
            Return->Property->InitializeValue_InContainer(Params);
        }

        for (int i = StartPos; i < Arguments.size(); ++i)
        {
            Arguments[i]->Property->InitializeValue_InContainer(Params);

            pesapi_value Arg = Apis->get_arg(Info, i - StartPos);
            if (UNLIKELY(ArgumentDefaultValues && Apis->is_undefined(Env, Arg)))
            {
                Arguments[i]->Property->CopyCompleteValue_InContainer(Params, ArgumentDefaultValues);
            }
            else if (!Arguments[i]->JsToUEInContainer(Apis, Env, Arg, Params, false))
            {
                return false;
            }
        }
        return true;
    }

    FORCEINLINE void Call_ProcessReturnAndOutParams(
        struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, void* Params, int StartPos)
    {
        if (Return)
        {
            Apis->add_return(Info, Return->UEToJsInContainer(Apis, Env, Params));
            Return->Property->DestroyValue_InContainer(Params);
        }

        for (int i = StartPos; i < Arguments.size(); ++i)
        {
            Arguments[i]->UEOutToJsInContainer(Apis, Env, Apis->get_arg(Info, i - StartPos), Params, false);
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
    static void CallThunk(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void Call(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void SlowCall(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, UObject* CallObject, UFunction* CallFunction,
        void* Params);

    void FastCall(struct pesapi_ffi* Apis, pesapi_env Env, pesapi_callback_info Info, UObject* CallObject, UFunction* CallFunction,
        void* Params);

    void Init(UFunction* InFunction, bool IsDelegate);

    friend class FStructWrapper;
    friend class FScriptEnvImpl;
};

class FExtensionMethodTranslator : public FFunctionTranslator
{
public:
    explicit FExtensionMethodTranslator(UFunction* InFunction);

private:
    static void CallExtensionThunk(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    void CallExtension(struct pesapi_ffi* Apis, pesapi_callback_info Info);

    bool IsUObject;
};
}    // namespace PUERTS_NAMESPACE
