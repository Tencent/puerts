// Fill out your copyright notice in the Description page of Project Settings.

#include "FileSystemOperation.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"
#include "HAL/PlatformFileManager.h"

bool UFileSystemOperation::ReadFile(FString Path, FString &Data)
{
    return (FPaths::FileExists(Path) && FFileHelper::LoadFileToString(Data, *Path));
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
    return FPaths::ProjectDir();
}

TArray<FString> UFileSystemOperation::GetDirectories(FString Path) 
{
    IFileManager& FileManager = IFileManager::Get();
    TArray<FString> Dirs;
    if (!Path.EndsWith(TEXT("/"))) Path = Path + TEXT("/");
    Path = Path + "*";
    FileManager.FindFiles(Dirs, *Path, false, true);
    return Dirs;
}

TArray<FString> UFileSystemOperation::GetFiles(FString Path)
{
    IFileManager& FileManager = IFileManager::Get();
    TArray<FString> Dirs;
    if (!Path.EndsWith(TEXT("/"))) Path = Path + TEXT("/");
    Path = Path + "*";
    FileManager.FindFiles(Dirs, *Path, true, false);
    return Dirs;
}

//TArray<FString> UFileSystemOperation::ReadDirectory(FString Path, TArray<FString> Extensions, TArray<FString> exclude, int32 Depth)
//{
//
//}