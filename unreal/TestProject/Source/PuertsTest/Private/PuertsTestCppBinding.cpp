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
        ++CopyCount;
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

    // std::function with reference parameters: the object and the container are passed without copying (modified in
    // place), the int and the FString are passed as $ref and written back after the call
    static FString CallRefCallback(std::function<void(FPuertsTestCppClass&, TArray<int>&, int&, FString&)> Callback)
    {
        FPuertsTestCppClass Obj(1, 2);
        TArray<int> Arr = {1, 2, 3};
        int I = 5;
        FString S = TEXT("s");
        const int InstancesBefore = InstanceCount;
        Callback(Obj, Arr, I, S);
        // copies of Obj made for the call (all released by now unless still held by js)
        const int Copies = CopyCount;
        CopyCount = 0;
        FString ArrStr;
        for (int V : Arr)
        {
            ArrStr += FString::Printf(TEXT("%s%d"), ArrStr.IsEmpty() ? TEXT("") : TEXT("|"), V);
        }
        return FString::Printf(TEXT("obj=(%d,%d),arr=%s,i=%d,s=%s,copies=%d,leaked=%d"), Obj.X, Obj.Y, *ArrStr, I, *S, Copies,
            InstanceCount - InstancesBefore);
    }

    // std::function with a return value and a reference parameter, returns Ret * 100 + I
    static int CallRefFunc(std::function<int(int&)> Callback)
    {
        int I = 3;
        int Ret = Callback(I);
        return Ret * 100 + I;
    }

    static int CopyCount;
};

int FPuertsTestCppClass::InstanceCount = 0;
int FPuertsTestCppClass::CopyCount = 0;

UsingCppType(FPuertsTestCppClass);
UsingUClass(UPuertsTestObject);
UsingContainer(TArray<int>);

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
            .Function("CallRefCallback", MakeFunction(&FPuertsTestCppClass::CallRefCallback))
            .Function("CallRefFunc", MakeFunction(&FPuertsTestCppClass::CallRefFunc))
            .Register();
        RegisterTArray(int);
    }
};

FAutoRegisterPuertsTestCppClass GAutoRegisterPuertsTestCppClass;
}    // namespace
