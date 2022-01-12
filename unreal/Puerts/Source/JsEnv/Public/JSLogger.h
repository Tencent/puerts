/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"

JSENV_API DECLARE_LOG_CATEGORY_EXTERN(Puerts, Log, All);

namespace puerts
{
class JSENV_API ILogger
{
public:
    virtual void Log(const FString& Message) const = 0;
    virtual void Info(const FString& Message) const = 0;
    virtual void Warn(const FString& Message) const = 0;
    virtual void Error(const FString& Message) const = 0;
};

class JSENV_API FDefaultLogger : public ILogger
{
public:
    virtual ~FDefaultLogger()
    {
    }
    void Log(const FString& Message) const override;
    void Info(const FString& Message) const override;
    void Warn(const FString& Message) const override;
    void Error(const FString& Message) const override;
};
}    // namespace puerts
