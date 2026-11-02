// Template (static) binding test types, exercised by tests/cpp_binding.js through the 'cpp' builtin module.
#include "CoreMinimal.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"
#include "PuertsTestTypes.h"

#include <string>

class FPuertsTestCppClass
{
public:
    static int InstanceCount;

    int X = 0;
    int Y = 0;

    FPuertsTestCppClass()
    {
        ++InstanceCount;
    }

    FPuertsTestCppClass(int InX, int InY) : X(InX), Y(InY)
    {
        ++InstanceCount;
    }

    FPuertsTestCppClass(const FPuertsTestCppClass& Other) : X(Other.X), Y(Other.Y)
    {
        ++InstanceCount;
    }

    FPuertsTestCppClass& operator=(const FPuertsTestCppClass& Other) = default;

    ~FPuertsTestCppClass()
    {
        --InstanceCount;
    }

    int Add(int V) const
    {
        return X + Y + V;
    }

    int Over(int A)
    {
        return A;
    }

    int Over(int A, int B)
    {
        return A * B;
    }

    std::string Name() const
    {
        return "cpp:" + std::to_string(X);
    }

    FString Describe(const FString& Prefix) const
    {
        return Prefix + FString::Printf(TEXT("(%d,%d)"), X, Y);
    }

    int ReadObject(UPuertsTestObject* Obj) const
    {
        return Obj ? Obj->IntValue : -1;
    }

    void Noop()
    {
    }

    static int StaticMul(int A, int B)
    {
        return A * B;
    }

    static int GetInstanceCount()
    {
        return InstanceCount;
    }

    static FPuertsTestCppClass* CreateRaw(int InX)
    {
        static FPuertsTestCppClass Shared;
        Shared.X = InX;
        return &Shared;
    }

    static int ReadJsObjectX(FJsObject Obj)
    {
        return Obj.Get<int>("x");
    }

    static FJsObject EchoJsObject(FJsObject Obj)
    {
        return Obj;
    }
};

int FPuertsTestCppClass::InstanceCount = 0;

UsingCppType(FPuertsTestCppClass);
UsingUClass(UPuertsTestObject);

namespace
{
struct FAutoRegisterPuertsTestCppClass
{
    FAutoRegisterPuertsTestCppClass()
    {
        PUERTS_NAMESPACE::DefineClass<FPuertsTestCppClass>()
            .Constructor(CombineConstructors(MakeConstructor(FPuertsTestCppClass, int, int), MakeConstructor(FPuertsTestCppClass)))
            .Property("X", MakeProperty(&FPuertsTestCppClass::X))
            .Property("Y", MakeProperty(&FPuertsTestCppClass::Y))
            .Method("Add", MakeFunction(&FPuertsTestCppClass::Add))
            .Method("Over", CombineOverloads(MakeOverload(int (FPuertsTestCppClass::*)(int), &FPuertsTestCppClass::Over),
                                MakeOverload(int (FPuertsTestCppClass::*)(int, int), &FPuertsTestCppClass::Over)))
            .Method("Name", MakeFunction(&FPuertsTestCppClass::Name))
            .Method("Describe", MakeFunction(&FPuertsTestCppClass::Describe))
            .Method("ReadObject", MakeFunction(&FPuertsTestCppClass::ReadObject))
            .Method("Noop", MakeFunction(&FPuertsTestCppClass::Noop))
            .Function("StaticMul", MakeFunction(&FPuertsTestCppClass::StaticMul))
            .Function("GetInstanceCount", MakeFunction(&FPuertsTestCppClass::GetInstanceCount))
            .Function("CreateRaw", MakeFunction(&FPuertsTestCppClass::CreateRaw))
            .Function("ReadJsObjectX", MakeFunction(&FPuertsTestCppClass::ReadJsObjectX))
            .Function("EchoJsObject", MakeFunction(&FPuertsTestCppClass::EchoJsObject))
            .Register();
    }
};

FAutoRegisterPuertsTestCppClass GAutoRegisterPuertsTestCppClass;
}    // namespace
