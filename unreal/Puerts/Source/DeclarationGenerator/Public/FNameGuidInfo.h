#pragma once

#include "CoreMinimal.h"
#include "AssetData.h"
// #include "FlibAssetManageHelper.h"
#include "UObject/NameTypes.h"
#include "FNameGuidInfo.generated.h"

USTRUCT(BlueprintType)
struct DECLARATIONGENERATOR_API FNameGuidInfo
{
    GENERATED_USTRUCT_BODY()
    FNameGuidInfo() = default;
    FNameGuidInfo(FName PackageN, FString ClassN, FName Gui, bool isNeed)
        : PackageName(PackageN), ClassName(ClassN), Guid(Gui), isNeedReload(isNeed)
    {
    }
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName PackageName;
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString ClassName;
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName Guid;
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FName> DependClass;
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool isNeedReload;
};