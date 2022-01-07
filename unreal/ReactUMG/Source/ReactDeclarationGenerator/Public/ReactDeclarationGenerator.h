// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CodeGenerator.h"

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "ReactDeclarationGenerator.generated.h"

/**
 *
 */
UCLASS()
class REACTDECLARATIONGENERATOR_API UReactDeclarationGenerator : public UObject, public ICodeGenerator
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintNativeEvent)
    void Gen() const;

    virtual void Gen_Implementation() const override;
};
