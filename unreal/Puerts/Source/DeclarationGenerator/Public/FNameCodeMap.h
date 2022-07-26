#pragma once

#include "CoreMinimal.h"
#include "Containers/Map.h"
#include "FNameCodeMap.generated.h"

USTRUCT(BlueprintType)
struct DECLARATIONGENERATOR_API FNameCodeMap
{
	GENERATED_USTRUCT_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TMap<FName, FString> CodeMap;
	inline void clear() {
		CodeMap.Empty();
	}
};

