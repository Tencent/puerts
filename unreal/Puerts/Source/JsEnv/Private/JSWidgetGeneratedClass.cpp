/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JSWidgetGeneratedClass.h"
#include "JSGeneratedFunction.h"

void UJSWidgetGeneratedClass::StaticConstructor(const FObjectInitializer& ObjectInitializer)
{
    auto Class = static_cast<UJSWidgetGeneratedClass*>(ObjectInitializer.GetClass());
    auto Object = ObjectInitializer.GetObj();
    Class->GetSuperClass()->ClassConstructor(ObjectInitializer);

    auto PinedDynamicInvoker = Class->DynamicInvoker.Pin();
    if (PinedDynamicInvoker)
    {
        PinedDynamicInvoker->Construct(Class, Object, Class->Constructor, Class->Prototype);
    }
}


void UJSWidgetGeneratedClass::InitPropertiesFromCustomList(uint8* DataPtr, const uint8* DefaultDataPtr)
{
    if (const FCustomPropertyListNode* CustomPropertyList = GetCustomPropertyListForPostConstruction())
    {
        UBlueprintGeneratedClass::InitPropertiesFromCustomList(CustomPropertyList, this, DataPtr, DefaultDataPtr);
    }
}

void UJSWidgetGeneratedClass::Release()
{
    for (TFieldIterator<UFunction> It(this, EFieldIteratorFlags::IncludeSuper, EFieldIteratorFlags::ExcludeDeprecated, EFieldIteratorFlags::IncludeInterfaces); It; ++It)
    {
        if (auto Function = Cast<UJSGeneratedFunction>(*It))
        {
            //UE_LOG(LogTemp, Warning, TEXT("release: %s"), *Function->GetName());
            Function->JsFunction.Reset();
        }
    }

    Constructor.Reset();
    Prototype.Reset();
}
