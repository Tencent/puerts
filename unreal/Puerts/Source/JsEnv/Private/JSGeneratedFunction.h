/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <memory>

#pragma warning(push, 0)
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "NamespaceDef.h"

#include "DynamicInvoker.h"
#include "FunctionTranslator.h"

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "JSGeneratedFunction.generated.h"

/**
 *
 */
UCLASS()
class UJSGeneratedFunction : public UFunction
{
    GENERATED_BODY()

public:
    DECLARE_FUNCTION(execCallJS);

    DECLARE_FUNCTION(execCallMixin);

    v8::UniquePersistent<v8::Function> JsFunction;

    TWeakPtr<puerts::IDynamicInvoker, ESPMode::ThreadSafe> DynamicInvoker;

    std::unique_ptr<puerts::FFunctionTranslator> FunctionTranslator;

    bool TakeJsObjectRef;

    UFunction* Original = nullptr;

    FNativeFuncPtr OriginalFunc = nullptr;

    EFunctionFlags OriginalFunctionFlags;

    static constexpr uint8 GEN_FUNC_MAGIC = 107;

    FORCEINLINE static void SetJSGeneratedFunctionToScript(UFunction* InFunc, UJSGeneratedFunction* JsGenFunc)
    {
        JsGenFunc->Script = InFunc->Script;
        InFunc->Script.Empty();
        InFunc->Script.AddUninitialized(3 + sizeof(int64));
        uint8* Code = InFunc->Script.GetData();
        *(Code++) = EX_ByteConst;
        *(Code++) = GEN_FUNC_MAGIC;
        *(Code++) = EX_Int64Const;
        FPlatformMemory::WriteUnaligned<UJSGeneratedFunction*>(Code, JsGenFunc);
    }

    FORCEINLINE static UJSGeneratedFunction* GetJSGeneratedFunctionFromScript(UFunction* InFunc)
    {
        const uint8* Code = InFunc->Script.GetData();
        if (Code && InFunc->Script.Num() >= (3 + sizeof(int64)) && EX_ByteConst == Code[0] && GEN_FUNC_MAGIC == Code[1] &&
            EX_Int64Const == Code[2])
        {
            return FPlatformMemory::ReadUnaligned<UJSGeneratedFunction*>(&Code[3]);
        }
        return nullptr;
    }
};
