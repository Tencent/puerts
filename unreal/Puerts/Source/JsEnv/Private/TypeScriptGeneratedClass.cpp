// Fill out your copyright notice in the Description page of Project Settings.


#include "TypeScriptGeneratedClass.h"

void UTypeScriptGeneratedClass::StaticConstructor(const FObjectInitializer& ObjectInitializer)
{
    auto Class = ObjectInitializer.GetClass();
    auto Object = ObjectInitializer.GetObj();
    Class->GetSuperClass()->ClassConstructor(ObjectInitializer);

    //UE_LOG(LogTemp, Error, TEXT("UTypeScriptGeneratedClass::StaticConstructor"));
    if (auto TypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(Class))
    {
        auto PinedDynamicInvoker = TypeScriptGeneratedClass->DynamicInvoker.Pin();
        if (PinedDynamicInvoker)
        {
            PinedDynamicInvoker->Construct(TypeScriptGeneratedClass, Object, TypeScriptGeneratedClass->Constructor, TypeScriptGeneratedClass->Prototype);
        }
    }
}