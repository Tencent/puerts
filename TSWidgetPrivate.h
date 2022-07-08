#pragma once

#include "CoreMinimal.h"
#include "Tickable.h"
#include "TSWidgetPrivate.generated.h"

UCLASS()
class MYPROJECT_API UTSWidgetPrivate : public UObject, public FTickableGameObject
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintImplementableEvent)
	void Tick(float DeltaTime);

	virtual TStatId GetStatId() const;

	UFUNCTION(BlueprintImplementableEvent)
	void SetupUI(UUserWidget* ui);
};
