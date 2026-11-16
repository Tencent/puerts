/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "DeclarationGeneratorUtils.h"
#ifdef PUERTS_WITH_SOURCE_CONTROL
#include "HAL/PlatformFileManager.h"
#include "SourceControlHelpers.h"
#endif

namespace PuertsDeclarationGenerator
{
void MakeFileWritable(const FString& FilePath)
{
#ifdef PUERTS_WITH_SOURCE_CONTROL
    if (SourceControlHelpers::IsAvailable() && FPlatformFileManager::Get().GetPlatformFile().FileExists(*FilePath))
    {
        FPlatformFileManager::Get().GetPlatformFile().SetReadOnly(*FilePath, false);
    }
#endif
}
}    // namespace PuertsDeclarationGenerator
