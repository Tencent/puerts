/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "CoreMinimal.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"

UsingUClass(UObject)
UsingUClass(UWorld) // for return type
UsingUClass(UClass)

struct AutoRegisterForUObject
{
    AutoRegisterForUObject()
    {
        puerts::DefineClass<UObject>()
#if ENGINE_MAJOR_VERSION >= 4 && ENGINE_MINOR_VERSION >= 23
			.Method("CreateDefaultSubobject", SelectFunction(UObject* (UObject::*)(FName, UClass*, UClass*, bool , bool), &UObject::CreateDefaultSubobject))
#else
			.Method("CreateDefaultSubobject", SelectFunction(UObject* (UObject::*)(FName, UClass*, UClass*, bool, bool, bool), &UObject::CreateDefaultSubobject))
#endif
			.Method("GetName", SelectFunction(FString (UObjectBaseUtility::*)() const, &UObjectBaseUtility::GetName))
            .Method("GetOuter", MakeFunction(&UObject::GetOuter))
            .Method("GetClass", MakeFunction(&UObject::GetClass))
            .Method("GetWorld", MakeFunction(&UObject::GetWorld))
            .RegisterUEType();
    }
};

AutoRegisterForUObject _AutoRegisterForUObject__;

