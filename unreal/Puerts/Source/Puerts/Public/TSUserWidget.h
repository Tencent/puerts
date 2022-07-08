
#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "TSUserWidget.generated.h"

class UTSWidgetPrivate;

/**
 * BASE CLASS
 */
UCLASS()
class MYPROJECT_API UTSUserWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	UTSUserWidget(const FObjectInitializer& ObjectInitializer);

	UFUNCTION()
	virtual void NativeConstruct()override;
	virtual void NativeDestruct() override;
	virtual void NativePreConstruct()override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

	void PostEditChangeProperty(struct FPropertyChangedEvent& PropertyChangedEvent);

private:
	void CreateTSScript();

public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TSubclassOf<UTSWidgetPrivate> TSClass;

private:
	UPROPERTY()
	UTSWidgetPrivate* UMGTypeScript;

};
