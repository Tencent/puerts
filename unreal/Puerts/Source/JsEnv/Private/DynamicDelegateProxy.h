/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "DynamicInvoker.h"

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "DynamicDelegateProxy.generated.h"

/**
 * 
 */
UCLASS()
class UDynamicDelegateProxy : public UObject
{
	GENERATED_BODY()
public:
    UFUNCTION(BlueprintCallable, Category = "TGameJS")
    void Fire();

    void ProcessEvent(UFunction*, void* Parms) override;

    TWeakPtr<IDynamicInvoker> DynamicInvoker;

    UFunction* SignatureFunction;

    //So, only uobject's delelgate is supported!
    TWeakObjectPtr<UObject> Owner;

    v8::UniquePersistent<v8::Function> JsFunction;
};
