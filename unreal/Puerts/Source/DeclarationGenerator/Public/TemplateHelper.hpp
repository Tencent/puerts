#pragma once

#include "CoreMinimal.h"
#include "JsonObjectConverter.h"
#include "HAL/PlatformMisc.h"
// cpp standard
#include <typeinfo>
#include <cctype>
#include <algorithm>
#include <string>

namespace PuertTemplateHelper
{
template <typename TStructType>
static bool TSerializeStructAsJsonObject(const TStructType& InStruct, TSharedPtr<FJsonObject>& OutJsonObject)
{
    SCOPED_NAMED_EVENT_TEXT("TSerializeStructAsJsonObject", FColor::Red);
    if (!OutJsonObject.IsValid())
    {
        OutJsonObject = MakeShareable(new FJsonObject);
    }
    bool bStatus =
        FJsonObjectConverter::UStructToJsonObject(TStructType::StaticStruct(), &InStruct, OutJsonObject.ToSharedRef(), 0, 0);
    return bStatus;
}

template <typename TStructType>
static bool TDeserializeJsonObjectAsStruct(const TSharedPtr<FJsonObject>& OutJsonObject, TStructType& InStruct)
{
    SCOPED_NAMED_EVENT_TEXT("TDeserializeJsonObjectAsStruct", FColor::Red);
    bool bStatus = false;
    if (OutJsonObject.IsValid())
    {
        bStatus =
            FJsonObjectConverter::JsonObjectToUStruct(OutJsonObject.ToSharedRef(), TStructType::StaticStruct(), &InStruct, 0, 0);
    }
    return bStatus;
}

template <typename TStructType>
static bool TSerializeStructAsJsonString(const TStructType& InStruct, FString& OutJsonString)
{
    SCOPED_NAMED_EVENT_TEXT("TSerializeStructAsJsonString", FColor::Red);
    bool bRunStatus = false;

    {
        TSharedPtr<FJsonObject> JsonObject;
        if (PuertTemplateHelper::TSerializeStructAsJsonObject<TStructType>(InStruct, JsonObject) && JsonObject.IsValid())
        {
            auto JsonWriter = TJsonWriterFactory<>::Create(&OutJsonString);
            FJsonSerializer::Serialize(JsonObject.ToSharedRef(), JsonWriter);
            bRunStatus = true;
        }
    }
    return bRunStatus;
}

template <typename TStructType>
static bool TDeserializeJsonStringAsStruct(const FString& InJsonString, TStructType& OutStruct)
{
    SCOPED_NAMED_EVENT_TEXT("TDeserializeJsonStringAsStruct", FColor::Red);
    bool bRunStatus = false;
    TSharedRef<TJsonReader<TCHAR>> JsonReader = TJsonReaderFactory<TCHAR>::Create(InJsonString);
    TSharedPtr<FJsonObject> DeserializeJsonObject;
    if (FJsonSerializer::Deserialize(JsonReader, DeserializeJsonObject))
    {
        bRunStatus = PuertTemplateHelper::TDeserializeJsonObjectAsStruct<TStructType>(DeserializeJsonObject, OutStruct);
    }
    return bRunStatus;
}

static FString PathNormalize(const FString& PathIn)
{
    TArray<FString> PathFrags;
    PathIn.ParseIntoArray(PathFrags, TEXT("/"));
    Algo::Reverse(PathFrags);
    TArray<FString> NewPathFrags;
    bool FromRoot = PathIn.StartsWith(TEXT("/"));
    while (PathFrags.Num() > 0)
    {
        FString E = PathFrags.Pop();
        if (E != TEXT("") && E != TEXT("."))
        {
            if (E == TEXT("..") && NewPathFrags.Num() > 0 && NewPathFrags.Last() != TEXT(".."))
            {
                NewPathFrags.Pop();
            }
            else
            {
                NewPathFrags.Push(E);
            }
        }
    }
    if (FromRoot)
    {
        return TEXT("/") + FString::Join(NewPathFrags, TEXT("/"));
    }
    else
    {
        return FString::Join(NewPathFrags, TEXT("/"));
    }
}

static bool CheckExists(const FString& PathIn, FString& Path, FString& AbsolutePath)
{
    IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
    FString NormalizedPath = PathNormalize(PathIn);
    if (PlatformFile.FileExists(*NormalizedPath))
    {
        AbsolutePath = IFileManager::Get().ConvertToAbsolutePathForExternalAppForRead(*NormalizedPath);
        Path = NormalizedPath;
        return true;
    }
    return false;
}
}    // namespace PuertTemplateHelper