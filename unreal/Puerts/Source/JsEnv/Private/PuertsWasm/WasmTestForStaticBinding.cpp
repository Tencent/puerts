#if WITH_WASM
#include <array>
#include <tuple>
#include "WasmRuntime.h"
#include "WasmModule.h"
#include "WasmFunction.h"
#include "WasmStaticLink.h"
#include "CoreMinimal.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"

class TestFunction
{
public:
    static FVector Test_GetActorLocation(AActor* Actor)
    {
        return Actor->K2_GetActorLocation();
    }

    static int Test_Fib(int a)
    {
        if (a <= 2)
            return 1;
        return Test_Fib(a - 1) + Test_Fib(a - 2);
    }

    static float Test_DistanceSqr(const FVector& InVector)
    {
        return InVector.X * InVector.X + InVector.Y * InVector.Y + InVector.Z * InVector.Z;
    }
};

UsingCppType(TestFunction);
UsingUStruct(FVector);
UsingUClass(AActor);

struct AutoRegisterForUEExtension11
{
    AutoRegisterForUEExtension11()
    {
        {
            puerts::DefineClass<TestFunction>()
                .Function("Test_GetActorLocation", MakeFunction(&TestFunction::Test_GetActorLocation))
                .Function("Test_Fib", MakeFunction(&TestFunction::Test_Fib))
                .Function("Test_DistanceSqr", MakeFunction(&TestFunction::Test_DistanceSqr))
                .Register();
        }
    }
};
AutoRegisterForUEExtension11 _AutoRegisterForUEExtension1__;
#endif