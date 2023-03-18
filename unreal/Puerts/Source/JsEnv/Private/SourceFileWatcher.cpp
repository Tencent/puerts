/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */
#if WITH_EDITOR
#include "SourceFileWatcher.h"
#include "DirectoryWatcherModule.h"
#include "Modules/ModuleManager.h"
#include "JSLogger.h"

namespace puerts
{
FSourceFileWatcher::FSourceFileWatcher(std::function<void(const FString&)> InOnWatchedFileChanged)
    : OnWatchedFileChanged(InOnWatchedFileChanged)
{
}

void FSourceFileWatcher::OnSourceLoaded(const FString& InPath)
{
    FString Dir = FPaths::GetPath(InPath);
    FString FileName = FPaths::GetCleanFilename(InPath);

    FScopeLock ScopeLock(&SourceFileWatcherCritical);
    if (!WatchedDirs.Contains(Dir))
    {
        FDirectoryWatcherModule& DirectoryWatcherModule =
            FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
        IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();
        FDelegateHandle DelegateHandle;
        DirectoryWatcher->RegisterDirectoryChangedCallback_Handle(Dir,
            IDirectoryWatcher::FDirectoryChanged::CreateRaw(this, &FSourceFileWatcher::OnDirectoryChanged), DelegateHandle,
            IDirectoryWatcher::IgnoreChangesInSubtree);
        WatchedDirs.Emplace(Dir, DelegateHandle);
        UE_LOG(Puerts, Log, TEXT("add watched dir: %s"), *Dir);
    }
    if (!WatchedFiles.Contains(Dir))
    {
        WatchedFiles.Emplace(Dir, TMap<FString, FMD5Hash>());
    }
    if (!WatchedFiles[Dir].Contains(FileName))
    {
        UE_LOG(Puerts, Log, TEXT("add watched file: %s"), *InPath);
        FMD5Hash Hash = FMD5Hash::HashFile(*InPath);
        WatchedFiles[Dir].Add(FileName, Hash);
    }
}

void FSourceFileWatcher::OnDirectoryChanged(const TArray<FFileChangeData>& FileChanges)
{
    FScopeLock ScopeLock(&SourceFileWatcherCritical);
    if (!OnWatchedFileChanged)
        return;
    for (auto Change : FileChanges)
    {
        if (Change.Action == FFileChangeData::FCA_Modified && Change.Filename.EndsWith(TEXT(".js")))
        {
            FPaths::NormalizeFilename(Change.Filename);
            Change.Filename = FPaths::ConvertRelativePathToFull(Change.Filename);
            FString Dir = FPaths::GetPath(Change.Filename);
            FString FileName = FPaths::GetCleanFilename(Change.Filename);
            FString Splitter = TEXT("/");
            if (!WatchedFiles.Contains(Dir))
            {
                Dir = Dir.Replace(TEXT("/"), TEXT("\\"));
                Splitter = TEXT("\\");
            }
            if (WatchedFiles.Contains(Dir))
            {
                if (WatchedFiles[Dir].Contains(FileName))
                {
                    FString NotifyPath = Dir + Splitter + FileName;
                    FMD5Hash Hash = FMD5Hash::HashFile(*NotifyPath);
                    if (WatchedFiles[Dir][FileName] != Hash)
                    {
                        OnWatchedFileChanged(NotifyPath);
                        WatchedFiles[Dir][FileName] = Hash;
                    }
                }
            }
            else
            {
                UE_LOG(Puerts, Error, TEXT("callback with unwatched dir: %s"), *Dir);
            }
        }
    }
}

FSourceFileWatcher::~FSourceFileWatcher()
{
    FDirectoryWatcherModule& DirectoryWatcherModule =
        FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
    IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();

    FScopeLock ScopeLock(&SourceFileWatcherCritical);
    for (auto KV : WatchedDirs)
    {
        DirectoryWatcher->UnregisterDirectoryChangedCallback_Handle(KV.Key, KV.Value);
    }
}
}    // namespace puerts
#endif