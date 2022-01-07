// Fill out your copyright notice in the Description page of Project Settings.

#include "FileSystemOperation.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"
#include "HAL/PlatformFilemanager.h"
#include "PuertsModule.h"
#include "Misc/SecureHash.h"

bool UFileSystemOperation::ReadFile(FString Path, FString& Data)
{
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    IFileHandle* FileHandle = PlatformFile.OpenRead(*Path);
    if (FileHandle)
    {
        int len = FileHandle->Size();
        TArray<uint8> Content;
        Content.Reset(len + 2);
        Content.AddUninitialized(len);
        FileHandle->Read(Content.GetData(), len);
        delete FileHandle;
        FFileHelper::BufferToString(Data, Content.GetData(), Content.Num());

        return true;
    }
    return false;
}

void UFileSystemOperation::WriteFile(FString Path, FString Data)
{
    FFileHelper::SaveStringToFile(Data, *Path, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
}

FString UFileSystemOperation::ResolvePath(FString Path)
{
    return IFileManager::Get().ConvertToAbsolutePathForExternalAppForRead(*Path);
}

bool UFileSystemOperation::FileExists(FString Path)
{
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    return PlatformFile.FileExists(*Path);
}

bool UFileSystemOperation::DirectoryExists(FString Path)
{
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    return PlatformFile.DirectoryExists(*Path);
}

void UFileSystemOperation::CreateDirectory(FString Path)
{
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    PlatformFile.CreateDirectory(*Path);
}

FString UFileSystemOperation::GetCurrentDirectory()
{
    return FPaths::ConvertRelativePathToFull(FPaths::ProjectDir());
}

TArray<FString> UFileSystemOperation::GetDirectories(FString Path)
{
    IFileManager& FileManager = IFileManager::Get();
    TArray<FString> Dirs;
    if (!Path.EndsWith(TEXT("/")))
        Path = Path + TEXT("/");
    Path = Path + "*";
    FileManager.FindFiles(Dirs, *Path, false, true);
    return Dirs;
}

TArray<FString> UFileSystemOperation::GetFiles(FString Path)
{
    IFileManager& FileManager = IFileManager::Get();
    TArray<FString> Dirs;
    if (!Path.EndsWith(TEXT("/")))
        Path = Path + TEXT("/");
    Path = Path + "*";
    FileManager.FindFiles(Dirs, *Path, true, false);
    return Dirs;
}

void UFileSystemOperation::PuertsNotifyChange(FString Path, FString Source)
{
    IPuertsModule::Get().ReloadModule(*Path, Source);
}

FString UFileSystemOperation::FileMD5Hash(FString Path)
{
    FMD5Hash Hash = FMD5Hash::HashFile(*Path);
    return LexToString(Hash);
}

// TArray<FString> UFileSystemOperation::ReadDirectory(FString Path, TArray<FString> Extensions, TArray<FString> exclude, int32
// Depth)
//{
//
//}