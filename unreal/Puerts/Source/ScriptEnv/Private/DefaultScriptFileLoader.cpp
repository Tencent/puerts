/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "ScriptFileLoader.h"
#include "GenericPlatform/GenericPlatformFile.h"
#include "HAL/FileManager.h"
#include "Misc/Paths.h"
#include "Runtime/Launch/Resources/Version.h"
#if (ENGINE_MAJOR_VERSION >= 5)
#include "HAL/PlatformFileManager.h"
#else
#include "HAL/PlatformFilemanager.h"
#endif

namespace PUERTS_NAMESPACE
{
bool FDefaultScriptFileLoader::ReadFileByFullPath(const FString& FullPath, TArray<uint8>& OutContent, FString& OutDebugPath)
{
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    IFileHandle* FileHandle = PlatformFile.OpenRead(*FullPath);
    if (!FileHandle)
    {
        return false;
    }
    int64 Len = FileHandle->Size();
    OutContent.Reset(Len + 2);
    OutContent.AddUninitialized(Len);
    const bool Success = FileHandle->Read(OutContent.GetData(), Len);
    delete FileHandle;
    if (Success)
    {
        OutDebugPath = IFileManager::Get().ConvertToAbsolutePathForExternalAppForRead(*FullPath);
    }
    return Success;
}

bool FDefaultScriptFileLoader::ReadFile(const FString& Path, TArray<uint8>& OutContent, FString& OutDebugPath)
{
    return ReadFileByFullPath(FPaths::ProjectContentDir() / ScriptRoot / Path, OutContent, OutDebugPath) ||
           (ScriptRoot != TEXT("JavaScript") &&
               ReadFileByFullPath(FPaths::ProjectContentDir() / TEXT("JavaScript") / Path, OutContent, OutDebugPath));
}

}    // namespace PUERTS_NAMESPACE
