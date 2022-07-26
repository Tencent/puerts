#pragma once

#include "CoreMinimal.h"
#include "Containers/Map.h"
#include "FNameGuidInfo.h"
#include "FDtsAssetMap.generated.h"

USTRUCT(BlueprintType)
struct DECLARATIONGENERATOR_API FDtsAssetMap
{
	GENERATED_USTRUCT_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TMap<FName, FNameGuidInfo> AssetMap;
	inline void clear() {
		AssetMap.Empty();
	}


	//void AddNameGuidInfo(const FNameGuidInfo& info);
	//bool HasAsset(const FString& InAssetPackageName) const;
};

