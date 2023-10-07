#include "ExportDTSCommandlet.h"
#include "Engine.h"
#include "Kismet/KismetSystemLibrary.h"

int32 UExportDTSCommandlet::Main(const FString& Params)
{
    UKismetSystemLibrary::ExecuteConsoleCommand(this, "Puerts.Gen", 0);
    return 0;
}