#if WITH_WASM
#include <array>
#include <tuple>
#include "WasmRuntime.h"
#include "WasmModule.h"
#include "WasmFunction.h"
#include "WasmStaticLink.h"
#include "CoreMinimal.h"

bool AActor_K2_SetActorLocation(AActor* Actor, const FVector& NewLocation)
{
    return Actor->SetActorLocation(NewLocation);
}

FVector AActor_K2_GetActorLocation(AActor* Actor)
{
    return Actor->GetActorLocation();
}

FRotator FVector_Rotation(const FVector& InVector)
{
    return InVector.Rotation();
}

FVector FRotator_Vector(const FRotator& InRotator)
{
    return InRotator.Vector();
}

WASM_BEGIN_LINK_GLOBAL(AActor, 0)
WASM_LINK_GLOBAL(AActor_K2_SetActorLocation)
WASM_LINK_GLOBAL(AActor_K2_GetActorLocation)
WASM_END_LINK_GLOBAL(AActor, 0)

WASM_BEGIN_LINK_GLOBAL(FVector, 0)
WASM_LINK_GLOBAL(FVector_Rotation)
WASM_LINK_GLOBAL(FRotator_Vector)
WASM_END_LINK_GLOBAL(FVector, 0)
#endif