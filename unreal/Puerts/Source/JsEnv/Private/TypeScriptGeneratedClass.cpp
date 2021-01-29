// Fill out your copyright notice in the Description page of Project Settings.


#include "TypeScriptGeneratedClass.h"

void UTypeScriptGeneratedClass::StaticConstructor(const FObjectInitializer& ObjectInitializer)
{
    auto Class = ObjectInitializer.GetClass();

    //UE_LOG(LogTemp, Error, TEXT("UTypeScriptGeneratedClass::StaticConstructor"));
    if (auto TypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(Class))
    {
        TypeScriptGeneratedClass->ObjectInitialize(ObjectInitializer);
    }
    else if (auto SuperTypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(Class->GetSuperClass()))
    {
        SuperTypeScriptGeneratedClass->ObjectInitialize(ObjectInitializer);
    }
    else
    {
        Class->GetSuperClass()->ClassConstructor(ObjectInitializer);
    }
}

void UTypeScriptGeneratedClass::ObjectInitialize(const FObjectInitializer& ObjectInitializer)
{
    auto Object = ObjectInitializer.GetObj();
    if (auto SuperTypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(GetSuperClass()))
    {
        SuperTypeScriptGeneratedClass->ObjectInitialize(ObjectInitializer);
    }
    else
    {
        GetSuperClass()->ClassConstructor(ObjectInitializer);
    }

    auto PinedDynamicInvoker = DynamicInvoker.Pin();
    if (PinedDynamicInvoker)
    {
        PinedDynamicInvoker->Construct(this, Object, Constructor, Prototype);
    }
}

void UTypeScriptGeneratedClass::Bind()
{
    Super::Bind();
    ReBind = true;
}