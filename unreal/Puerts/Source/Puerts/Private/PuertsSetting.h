/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "PuertsSetting.generated.h"

UCLASS(config = Puerts, defaultconfig, meta = (DisplayName = "Puerts"))
class UPuertsSetting : public UObject
{
    GENERATED_BODY()
public:
    UPROPERTY(config, EditAnywhere, Category = "Engine Class Extends Mode",
        meta = (defaultValue = "JavaScript", Tooltip = "JavaScript Source Code Root Path", DisplayName = "JavaScript Root"))
    FString RootPath = "JavaScript";

    UPROPERTY(config, EditAnywhere, Category = "Engine Class Extends Mode", meta = (DisplayName = "Enable", defaultValue = false))
    bool AutoModeEnable = false;

    UPROPERTY(
        config, EditAnywhere, Category = "Engine Class Extends Mode", meta = (DisplayName = "Debug Enable", defaultValue = false))
    bool DebugEnable = false;

    UPROPERTY(
        config, EditAnywhere, Category = "Engine Class Extends Mode", meta = (DisplayName = "Debug Port", defaultValue = 8080))
    int32 DebugPort = 8080;

    UPROPERTY(
        config, EditAnywhere, Category = "Engine Class Extends Mode", meta = (DisplayName = "Wait Debugger", defaultValue = false))
    bool WaitDebugger = false;

    UPROPERTY(config, EditAnywhere, Category = "Engine Class Extends Mode",
        meta = (DisplayName = "Wait Debugger Timeout", defaultValue = 0))
    double WaitDebuggerTimeout = 0;

    UPROPERTY(config, EditAnywhere, Category = "Engine Class Extends Mode",
        meta = (DisplayName = "Number of JavaScript Env", defaultValue = 1))
    int32 NumberOfJsEnv = 1;

    UPROPERTY(config, EditAnywhere, Category = "Engine Class Extends Mode",
        meta = (DisplayName = "Disable TypeScript Watch", defaultValue = false))
    bool WatchDisable = false;

    UPROPERTY(config, EditAnywhere, Category = "Declaration Generator", meta = (DisplayName = "D.ts Ignore Class Name List"))
    TArray<FString> IgnoreClassListOnDTS;

    UPROPERTY(config, EditAnywhere, Category = "Declaration Generator", meta = (DisplayName = "D.ts Ignore Struct Name List"))
    TArray<FString> IgnoreStructListOnDTS;
};
