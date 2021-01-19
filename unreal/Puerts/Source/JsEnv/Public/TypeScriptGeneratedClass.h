// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "DynamicInvoker.h"

#include "CoreMinimal.h"
#include "Engine/BlueprintGeneratedClass.h"
#include "TypeScriptGeneratedClass.generated.h"

/**
 * 
 */
UCLASS()
class JSENV_API UTypeScriptGeneratedClass : public UBlueprintGeneratedClass
{
	GENERATED_BODY()

public:
    v8::UniquePersistent<v8::Function> Constructor;

    v8::UniquePersistent<v8::Object> Prototype;

    TWeakPtr<IDynamicInvoker> DynamicInvoker;

    bool ReBind = false;

    static void StaticConstructor(const FObjectInitializer& ObjectInitializer);

    void ObjectInitialize(const FObjectInitializer& ObjectInitializer);

    void Bind() override;
};
