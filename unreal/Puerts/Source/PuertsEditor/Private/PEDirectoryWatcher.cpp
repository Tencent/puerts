// Fill out your copyright notice in the Description page of Project Settings.


#include "PEDirectoryWatcher.h"
#include "DirectoryWatcherModule.h"
#include "Modules/ModuleManager.h"
#include "HAL/FileManager.h"
#include "Misc/SecureHash.h"

bool UPEDirectoryWatcher::Watch(const FString& InDirectory)
{
    Directory = FPaths::IsRelative(InDirectory) ? FPaths::ConvertRelativePathToFull(InDirectory) : InDirectory;
    //UE_LOG(LogTemp, Warning, TEXT("PEDirectoryWatcher::Watch: %s"), *InDirectory);
    if (IFileManager::Get().DirectoryExists(*Directory))
    {
        auto Changed = IDirectoryWatcher::FDirectoryChanged::CreateLambda([&](const TArray<FFileChangeData>& FileChanges) {
            TArray<FString> Added;
            TArray<FString> Modified;
            TArray<FString> Removed;

            for (auto Change : FileChanges)
            {
                //��ΪҪ��md5�����й��˵������ĵ�
                if (!Change.Filename.EndsWith(TEXT(".ts")) && !Change.Filename.EndsWith(TEXT(".json")) && !Change.Filename.EndsWith(TEXT(".js")))
                {
                    continue;
                }
                FPaths::NormalizeFilename(Change.Filename);
                switch (Change.Action)
                {
                case FFileChangeData::FCA_Added:
                    if (Added.Contains(Change.Filename)) continue;
                    Added.Add(Change.Filename);
                    break;
                case FFileChangeData::FCA_Modified:
                    if (Modified.Contains(Change.Filename)) continue;
                    Modified.Add(Change.Filename);
                    break;
                case FFileChangeData::FCA_Removed:
                    if (Removed.Contains(Change.Filename)) continue;
                    Removed.Add(Change.Filename);
                    break;
                default:
                    continue;
                }

                if (Change.Action == FFileChangeData::FCA_Added || Change.Action == FFileChangeData::FCA_Modified)
                {
                    FMD5Hash Hash = FMD5Hash::HashFile(*Change.Filename);
                    MD5Map.Emplace(Change.Filename, LexToString(Hash));
                }
            }
            OnChanged.Broadcast(Added, Modified, Removed);
        });
        FDirectoryWatcherModule& DirectoryWatcherModule = FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
        IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();
        DirectoryWatcher->RegisterDirectoryChangedCallback_Handle(Directory, Changed, DelegateHandle, true);
        return true;
    }
    return false;
}

void UPEDirectoryWatcher::UnWatch()
{
    if (DelegateHandle.IsValid())
    {
        FDirectoryWatcherModule& DirectoryWatcherModule = FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
        IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();

        DirectoryWatcher->UnregisterDirectoryChangedCallback_Handle(Directory, DelegateHandle);
        Directory = TEXT("");
    }
}

UPEDirectoryWatcher::~UPEDirectoryWatcher()
{
    UnWatch();
}
