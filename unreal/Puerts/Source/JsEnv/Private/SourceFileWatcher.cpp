/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */
#if WITH_EDITOR
#include "SourceFileWatcher.h"
#include "DirectoryWatcherModule.h"
#include "Modules/ModuleManager.h"
#include "JSLogger.h"
#include "Misc/ScopeLock.h"

namespace PUERTS_NAMESPACE
{
FSourceFileWatcher::FSourceFileWatcher(std::function<void(const FString&)> InOnWatchedFileChanged)
    : OnWatchedFileChanged(InOnWatchedFileChanged)
{
}

FString FSourceFileWatcher::FindCommonParentDir(const FString& PathA, const FString& PathB)
{
    TArray<FString> PartsA, PartsB;
    PathA.ParseIntoArray(PartsA, TEXT("/"), true);
    PathB.ParseIntoArray(PartsB, TEXT("/"), true);

    FString CommonParent;
    int32 MinLen = FMath::Min(PartsA.Num(), PartsB.Num());
    for (int32 i = 0; i < MinLen; ++i)
    {
        if (PartsA[i].Equals(PartsB[i], ESearchCase::IgnoreCase))
        {
            if (CommonParent.IsEmpty())
            {
                CommonParent = PartsA[i];
            }
            else
            {
                CommonParent = CommonParent / PartsA[i];
            }
        }
        else
        {
            break;
        }
    }
    return CommonParent;
}

void FSourceFileWatcher::OnSourceLoaded(const FString& InPath)
{
    FString Dir = FPaths::GetPath(InPath);
    FString FileName = FPaths::GetCleanFilename(InPath);

    FScopeLock ScopeLock(&SourceFileWatcherCritical);

    if (WatchedRootDir.IsEmpty())
    {
        FDirectoryWatcherModule& DirectoryWatcherModule =
            FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
        IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();

        DirectoryWatcher->RegisterDirectoryChangedCallback_Handle(Dir,
            IDirectoryWatcher::FDirectoryChanged::CreateRaw(this, &FSourceFileWatcher::OnDirectoryChanged), WatchedRootDirHandle,
            IDirectoryWatcher::IncludeDirectoryChanges);
        WatchedRootDir = Dir;
        UE_LOG(Puerts, Log, TEXT("add watched root dir: %s"), *Dir);
    }
    else if (!Dir.StartsWith(WatchedRootDir))
    {
        FString NewRootDir = FindCommonParentDir(WatchedRootDir, Dir);
        if (!NewRootDir.IsEmpty() && NewRootDir != WatchedRootDir)
        {
            FDirectoryWatcherModule& DirectoryWatcherModule =
                FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
            IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();

            DirectoryWatcher->UnregisterDirectoryChangedCallback_Handle(WatchedRootDir, WatchedRootDirHandle);
            DirectoryWatcher->RegisterDirectoryChangedCallback_Handle(NewRootDir,
                IDirectoryWatcher::FDirectoryChanged::CreateRaw(this, &FSourceFileWatcher::OnDirectoryChanged), WatchedRootDirHandle,
                IDirectoryWatcher::IncludeDirectoryChanges);
            WatchedRootDir = NewRootDir;
            UE_LOG(Puerts, Log, TEXT("update watched root dir to: %s"), *NewRootDir);
        }
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
        if (!Change.Filename.EndsWith(TEXT(".js")))
            continue;

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

        if (!WatchedFiles.Contains(Dir))
        {
            continue;
        }

        if (Change.Action == FFileChangeData::FCA_Modified)
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
        else if (Change.Action == FFileChangeData::FCA_Removed)
        {
            if (WatchedFiles[Dir].Contains(FileName))
            {
                FString NotifyPath = Dir + Splitter + FileName;
                UE_LOG(Puerts, Log, TEXT("watched file removed: %s"), *NotifyPath);
                WatchedFiles[Dir].Remove(FileName);
            }
        }
        else if (Change.Action == FFileChangeData::FCA_Added)
        {
            if (!WatchedFiles[Dir].Contains(FileName))
            {
                FString NotifyPath = Dir + Splitter + FileName;
                FMD5Hash Hash = FMD5Hash::HashFile(*NotifyPath);
                if (Hash.IsValid())
                {
                    WatchedFiles[Dir].Add(FileName, Hash);
                    UE_LOG(Puerts, Log, TEXT("watched file added: %s"), *NotifyPath);
                    OnWatchedFileChanged(NotifyPath);
                }
            }
        }
    }
}

FSourceFileWatcher::~FSourceFileWatcher()
{
    if (WatchedRootDirHandle.IsValid())
    {
        FDirectoryWatcherModule& DirectoryWatcherModule =
            FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
        IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();

        FScopeLock ScopeLock(&SourceFileWatcherCritical);
        DirectoryWatcher->UnregisterDirectoryChangedCallback_Handle(WatchedRootDir, WatchedRootDirHandle);
    }
}
}    // namespace PUERTS_NAMESPACE
#endif