/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JSLogger.h"

DEFINE_LOG_CATEGORY(Puerts);

namespace PUERTS_NAMESPACE
{
void FDefaultLogger::Log(const FString& Message) const
{
    UE_LOG(Puerts, Log, TEXT("(0x%p) %s"), this, *Message);
}

void FDefaultLogger::Info(const FString& Message) const
{
    UE_LOG(Puerts, Display, TEXT("(0x%p) %s"), this, *Message);
}

void FDefaultLogger::Warn(const FString& Message) const
{
    UE_LOG(Puerts, Warning, TEXT("(0x%p) %s"), this, *Message);
}

void FDefaultLogger::Error(const FString& Message) const
{
    UE_LOG(Puerts, Error, TEXT("(0x%p) %s"), this, *Message);
}

}    // namespace PUERTS_NAMESPACE