/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "UObject/Object.h"
#include "DeclarationGeneratorSetting.generated.h"

// settings of the d.ts generator, stored in Config/DefaultPuerts.ini, section
// [/Script/DeclarationGenerator.DeclarationGeneratorSetting], editable in Project Settings -> Plugins -> Puerts
UCLASS(config = Puerts, defaultconfig, meta = (DisplayName = "Puerts"))
class UDeclarationGeneratorSetting : public UObject
{
    GENERATED_BODY()
public:
    UPROPERTY(config, EditAnywhere, Category = "Declaration Generator", meta = (DisplayName = "D.ts Ignore Class Name List"))
    TArray<FString> IgnoreClassListOnDTS;

    UPROPERTY(config, EditAnywhere, Category = "Declaration Generator", meta = (DisplayName = "D.ts Ignore Struct Name List"))
    TArray<FString> IgnoreStructListOnDTS;
};
