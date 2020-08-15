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
#include "Animation/AnimBlueprintGeneratedClass.h"
#include "JSAnimGeneratedClass.generated.h"

/**
 * 
 */
UCLASS()
class UJSAnimGeneratedClass : public UAnimBlueprintGeneratedClass
{
	GENERATED_BODY()
	
public:

    void InitPropertiesFromCustomList(uint8* DataPtr, const uint8* DefaultDataPtr) override;

    void Release();

    static void StaticConstructor(const FObjectInitializer& ObjectInitializer);

public:

    v8::UniquePersistent<v8::Function> Constructor;

    v8::UniquePersistent<v8::Object> Prototype;

    TWeakPtr<IDynamicInvoker> DynamicInvoker;
};
