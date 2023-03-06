// Fill out your copyright notice in the Description page of Project Settings.

#include "FileSystemOperation.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"
#include "HAL/PlatformFilemanager.h"
#include "PuertsModule.h"
#include "Misc/SecureHash.h"
#ifdef PUERTS_WITH_SOURCE_CONTROL
#include "SourceControlHelpers.h"
#endif

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
        const bool Success = FileHandle->Read(Content.GetData(), len);
        delete FileHandle;

        if (Success)
        {
            FFileHelper::BufferToString(Data, Content.GetData(), Content.Num());
        }

        return Success;
    }
    return false;
}

void UFileSystemOperation::WriteFile(FString Path, FString Data)
{
#ifdef PUERTS_WITH_SOURCE_CONTROL
    PuertsSourceControlUtils::CheckoutSourceControlFile(Path);
#endif
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

#ifdef PUERTS_WITH_SOURCE_CONTROL
namespace PuertsSourceControlUtils
{
bool MakeSourceControlFileWritable(const FString& InFileToMakeWritable)
{
    if (SourceControlHelpers::IsAvailable() && FPlatformFileManager::Get().GetPlatformFile().FileExists(*InFileToMakeWritable))
    {
        return FPlatformFileManager::Get().GetPlatformFile().SetReadOnly(*InFileToMakeWritable, false);
    }
    return true;
}

bool CheckoutSourceControlFile(const FString& InFileToCheckout)
{
    if (SourceControlHelpers::IsAvailable())
    {
        const FSourceControlState FileState = SourceControlHelpers::QueryFileState(InFileToCheckout);
        if (FileState.bIsValid && FileState.bIsSourceControlled && !FileState.bCanEdit)
        {
            return SourceControlHelpers::CheckOutFile(InFileToCheckout);
        }
    }
    return true;
}
}    // namespace PuertsSourceControlUtils
#endif