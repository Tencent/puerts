/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "ObjectExtension.h"

UObject* UObjectExtension::CreateDefaultSubobject(UObject *Object, FName SubobjectFName, UClass* ReturnType,
    UClass* ClassToCreateByDefault, bool bIsRequired, bool bAbstract, bool bIsTransient)
{
    return Object->CreateDefaultSubobject(SubobjectFName, ReturnType, ClassToCreateByDefault, bIsRequired, bAbstract, bIsTransient);
}

FString UObjectExtension::GetName(UObject *Object)
{
    return Object->GetName();
}

bool UObjectExtension::IsValid(UObject *Object)
{
    return ::IsValid(Object);
}

UObject * UObjectExtension::GetOuter(UObject *Object)
{
    return Object->GetOuter();
}

UClass * UObjectExtension::GetClass(UObject *Object)
{
    return Object->GetClass();
}

UWorld * UObjectExtension::GetWorld(UObject *Object)
{
    return Object->GetWorld();
}
