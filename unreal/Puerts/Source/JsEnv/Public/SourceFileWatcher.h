/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once
#if WITH_EDITOR
#include "CoreMinimal.h"
#include "IDirectoryWatcher.h"
#include "Misc/SecureHash.h"
#include <functional>
#include "PuertsNamespaceDef.h"

namespace PUERTS_NAMESPACE
{
class JSENV_API FSourceFileWatcher
{
public:
    FSourceFileWatcher(std::function<void(const FString&)> InOnWatchedFileChanged);

    ~FSourceFileWatcher();

    void OnSourceLoaded(const FString& InPath);

    void OnDirectoryChanged(const TArray<FFileChangeData>& FileChanges);

private:
    TMap<FString, FDelegateHandle> WatchedDirs;

    TMap<FString, TMap<FString, FMD5Hash>> WatchedFiles;

    FCriticalSection SourceFileWatcherCritical;

    std::function<void(const FString&)> OnWatchedFileChanged;
};
}    // namespace PUERTS_NAMESPACE
#endif