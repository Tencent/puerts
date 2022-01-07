// Fill out your copyright notice in the Description page of Project Settings.

#include "PEDirectoryWatcher.h"
#include "DirectoryWatcherModule.h"
#include "Modules/ModuleManager.h"
#include "HAL/FileManager.h"
#include "Misc/SecureHash.h"

UPEDirectoryWatcher::UPEDirectoryWatcher()
{
    this->AddToRoot();
}

bool UPEDirectoryWatcher::Watch(const FString& InDirectory)
{
    Directory = FPaths::IsRelative(InDirectory) ? FPaths::ConvertRelativePathToFull(InDirectory) : InDirectory;
    // UE_LOG(LogTemp, Warning, TEXT("PEDirectoryWatcher::Watch: %s"), *InDirectory);
    if (IFileManager::Get().DirectoryExists(*Directory))
    {
        auto Changed = IDirectoryWatcher::FDirectoryChanged::CreateLambda(
            [&](const TArray<FFileChangeData>& FileChanges)
            {
                TArray<FString> Added;
                TArray<FString> Modified;
                TArray<FString> Removed;

                for (auto Change : FileChanges)
                {
                    //因为要算md5，所有过滤掉不关心的
                    if (!Change.Filename.EndsWith(TEXT(".ts")) && !Change.Filename.EndsWith(TEXT(".tsx")) &&
                        !Change.Filename.EndsWith(TEXT(".json")) && !Change.Filename.EndsWith(TEXT(".js")))
                    {
                        continue;
                    }
                    FPaths::NormalizeFilename(Change.Filename);
                    Change.Filename = FPaths::ConvertRelativePathToFull(Change.Filename);
                    switch (Change.Action)
                    {
                        case FFileChangeData::FCA_Added:
                            if (Added.Contains(Change.Filename))
                                continue;
                            Added.Add(Change.Filename);
                            break;
                        case FFileChangeData::FCA_Modified:
                            if (Modified.Contains(Change.Filename))
                                continue;
                            Modified.Add(Change.Filename);
                            break;
                        case FFileChangeData::FCA_Removed:
                            if (Removed.Contains(Change.Filename))
                                continue;
                            Removed.Add(Change.Filename);
                            break;
                        default:
                            continue;
                    }
                }
                OnChanged.Broadcast(Added, Modified, Removed);
            });
        FDirectoryWatcherModule& DirectoryWatcherModule =
            FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
        IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();
        DirectoryWatcher->RegisterDirectoryChangedCallback_Handle(
            Directory, Changed, DelegateHandle, IDirectoryWatcher::IncludeDirectoryChanges);
        return true;
    }
    return false;
}

void UPEDirectoryWatcher::UnWatch()
{
    if (DelegateHandle.IsValid())
    {
        FDirectoryWatcherModule& DirectoryWatcherModule =
            FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
        IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();

        DirectoryWatcher->UnregisterDirectoryChangedCallback_Handle(Directory, DelegateHandle);
        Directory = TEXT("");
    }
}

UPEDirectoryWatcher::~UPEDirectoryWatcher()
{
    UnWatch();
}
