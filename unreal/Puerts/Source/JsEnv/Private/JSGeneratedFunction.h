/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <memory>

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

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

    v8::UniquePersistent<v8::Function> JsFunction;

    TWeakPtr<IDynamicInvoker> DynamicInvoker;

    std::unique_ptr<puerts::FFunctionTranslator> FunctionTranslator;
};
