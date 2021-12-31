#pragma once

#include "Commandlets/Commandlet.h"
#include "ExportDTSCommandlet.generated.h"

UCLASS()
class UExportDTSCommandlet : public UCommandlet
{
    GENERATED_BODY()

    virtual int32 Main(const FString& Params) override;
};