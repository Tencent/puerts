#pragma once

#include "CoreMinimal.h"
#include "UObject/Object.h"
#include "UObject/SoftObjectPtr.h"
#include "PuertsTestTypes.generated.h"

UENUM(BlueprintType)
enum class EPuertsTestEnum : uint8
{
    A,
    B,
    C = 10
};

USTRUCT(BlueprintType)
struct PUERTSTEST_API FPuertsTestStruct
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 X = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString S;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<int32> Arr;
};

DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam(int32, FPuertsTestIntDelegate, int32, Value);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FPuertsTestMulticastDelegate, const FString&, Msg);
DECLARE_DYNAMIC_DELEGATE_OneParam(FPuertsTestStepDelegate, int32, Step);

UCLASS(BlueprintType, Blueprintable)
class PUERTSTEST_API UPuertsTestObject : public UObject
{
    GENERATED_BODY()

public:
    UPuertsTestObject();

    virtual void BeginDestroy() override;

    // ---------- properties ----------
    UPROPERTY(BlueprintReadWrite)
    bool BoolValue = false;

    UPROPERTY(BlueprintReadWrite)
    uint8 bBitA : 1;

    UPROPERTY(BlueprintReadWrite)
    uint8 bBitB : 1;

    UPROPERTY(BlueprintReadWrite)
    uint8 ByteValue = 0;

    UPROPERTY(BlueprintReadWrite)
    int32 IntValue = 0;

    UPROPERTY(BlueprintReadWrite)
    int64 Int64Value = 0;

    UPROPERTY(BlueprintReadWrite)
    float FloatValue = 0.f;

    UPROPERTY(BlueprintReadWrite)
    double DoubleValue = 0.0;

    UPROPERTY(BlueprintReadWrite)
    FString StringValue;

    UPROPERTY(BlueprintReadWrite)
    FName NameValue;

    UPROPERTY(BlueprintReadWrite)
    FText TextValue;

    UPROPERTY(BlueprintReadWrite)
    EPuertsTestEnum EnumValue = EPuertsTestEnum::A;

    UPROPERTY(BlueprintReadWrite)
    FVector VectorValue = FVector::ZeroVector;

    UPROPERTY(BlueprintReadWrite)
    FPuertsTestStruct StructValue;

    UPROPERTY(BlueprintReadWrite)
    TObjectPtr<UPuertsTestObject> ObjectValue;

    UPROPERTY(BlueprintReadWrite)
    TSubclassOf<UObject> ClassValue;

    UPROPERTY(BlueprintReadWrite)
    TWeakObjectPtr<UObject> WeakObject;

    UPROPERTY(BlueprintReadWrite)
    TSoftObjectPtr<UObject> SoftObject;

    UPROPERTY(BlueprintReadWrite)
    TArray<int32> IntArray;

    UPROPERTY(BlueprintReadWrite)
    TArray<FString> StringArray;

    UPROPERTY(BlueprintReadWrite)
    TArray<FPuertsTestStruct> StructArray;

    UPROPERTY(BlueprintReadWrite)
    TSet<FString> StringSet;

    UPROPERTY(BlueprintReadWrite)
    TMap<FString, int32> StringIntMap;

    UPROPERTY()
    int32 FixedInts[3];

    UPROPERTY()
    FPuertsTestIntDelegate IntDelegate;

    UPROPERTY(BlueprintAssignable)
    FPuertsTestMulticastDelegate Multicast;

    // ---------- functions ----------
    UFUNCTION(BlueprintCallable)
    int32 Add(int32 A, int32 B);

    UFUNCTION(BlueprintCallable)
    static int32 StaticAdd(int32 A, int32 B);

    UFUNCTION(BlueprintCallable)
    FString Concat(const FString& A, const FString& B);

    UFUNCTION(BlueprintCallable)
    FPuertsTestStruct MakeStruct(int32 X, const FString& S);

    UFUNCTION(BlueprintCallable)
    int32 StructSum(const FPuertsTestStruct& In);

    UFUNCTION(BlueprintCallable)
    void OutParams(int32& OutInt, FString& OutStr, FPuertsTestStruct& OutStruct);

    UFUNCTION(BlueprintCallable)
    void IncRef(UPARAM(ref) int32& Value);

    UFUNCTION(BlueprintCallable)
    int32 DefaultParam(int32 A, int32 B = 5);

    UFUNCTION(BlueprintCallable)
    UPuertsTestObject* GetSelf();

    UFUNCTION(BlueprintCallable)
    UPuertsTestObject* CreateChild();

    UFUNCTION(BlueprintCallable)
    int32 SumArray(const TArray<int32>& Values);

    UFUNCTION(BlueprintCallable)
    void FillArray(TArray<int32>& Out, int32 N);

    UFUNCTION(BlueprintCallable)
    TMap<FString, int32> MakeMap(int32 N);

    UFUNCTION(BlueprintCallable)
    EPuertsTestEnum NextEnum(EPuertsTestEnum In);

    UFUNCTION(BlueprintCallable)
    FText MakeText(const FString& S);

    UFUNCTION(BlueprintCallable)
    int32 CallIntDelegate(int32 Value);

    // a js function argument becomes a delegate bound to a manual release proxy, [Owner, Function] binds to Owner
    UFUNCTION(BlueprintCallable)
    void SetIntDelegate(FPuertsTestIntDelegate InDelegate);

    // returned by value: the js side gets a copy (PassByPointer == false)
    UFUNCTION(BlueprintCallable)
    FPuertsTestIntDelegate GetIntDelegate();

    UPROPERTY()
    FPuertsTestStepDelegate StepDelegate;

    UFUNCTION(BlueprintCallable)
    void SetStepDelegate(FPuertsTestStepDelegate InDelegate);

    UFUNCTION(BlueprintCallable)
    bool CallStepDelegate(int32 Step);

    UFUNCTION(BlueprintCallable)
    void BroadcastMulticast(const FString& Msg);

    UFUNCTION(BlueprintImplementableEvent)
    int32 ImplEvent(int32 Value);

    UFUNCTION(BlueprintNativeEvent)
    FString NativeEvent(const FString& S);

    UFUNCTION(BlueprintCallable)
    int32 CallImplEvent(int32 Value);

    UFUNCTION(BlueprintCallable)
    FString CallNativeEvent(const FString& S);

    // ---------- benchmark helpers ----------
    UFUNCTION(BlueprintCallable)
    void Noop();

    UFUNCTION(BlueprintCallable)
    int32 Identity(int32 V);

    UFUNCTION(BlueprintCallable)
    void ThreeArgs(int32 A, float B, const FString& C);

    UFUNCTION(BlueprintCallable)
    FString ReturnString();

    UFUNCTION(BlueprintCallable)
    static void StaticNoop();

    // C++ -> JS call loop (delegate bound to a JS function)
    UFUNCTION(BlueprintCallable)
    int32 LoopIntDelegate(int32 Count);

    UFUNCTION(BlueprintCallable)
    static int32 GetLiveCount();

    static int32 LiveCount;
};

UCLASS(BlueprintType, Blueprintable)
class PUERTSTEST_API UPuertsTestDerived : public UPuertsTestObject
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadWrite)
    int32 DerivedValue = 42;

    UFUNCTION(BlueprintCallable)
    FString WhoAmI();
};

// A separate class used only by mixin tests so that mixin does not affect other cases.
UCLASS(BlueprintType, Blueprintable)
class PUERTSTEST_API UPuertsTestMixinTarget : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadWrite)
    int32 Base = 100;

    UFUNCTION(BlueprintImplementableEvent)
    int32 ImplEvent(int32 Value);

    UFUNCTION(BlueprintNativeEvent)
    FString NativeEvent(const FString& S);

    UFUNCTION(BlueprintCallable)
    int32 CallImplEvent(int32 Value);

    UFUNCTION(BlueprintCallable)
    FString CallNativeEvent(const FString& S);

    // C++ -> JS call loop through a mixin override
    UFUNCTION(BlueprintCallable)
    int32 LoopImplEvent(int32 Count);
};

// A separate class used only by makeUClass tests.
UCLASS(BlueprintType, Blueprintable)
class PUERTSTEST_API UPuertsTestMakeClassTarget : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadWrite)
    int32 Base = 100;

    UFUNCTION(BlueprintImplementableEvent)
    int32 ImplEvent(int32 Value);

    UFUNCTION(BlueprintNativeEvent)
    FString NativeEvent(const FString& S);

    UFUNCTION(BlueprintCallable)
    int32 CallImplEvent(int32 Value);

    UFUNCTION(BlueprintCallable)
    FString CallNativeEvent(const FString& S);

    // C++ -> JS call loop through a makeUClass override
    UFUNCTION(BlueprintCallable)
    int32 LoopImplEvent(int32 Count);
};

USTRUCT()
struct FPuertsTestFailure
{
    GENERATED_BODY()

    UPROPERTY()
    FString Name;

    UPROPERTY()
    FString Message;
};

USTRUCT()
struct FPuertsTestMetric
{
    GENERATED_BODY()

    UPROPERTY()
    FString Name;

    UPROPERTY()
    double Value = 0;

    UPROPERTY()
    FString Unit;
};

// Bridge between JS test scripts and C++ automation tests.
UCLASS()
class PUERTSTEST_API UPuertsTestReporter : public UObject
{
    GENERATED_BODY()

public:
    // number of steps the script wants; C++ runs a GC between steps and calls OnStep(i) for i in [1, StepCount)
    UPROPERTY(BlueprintReadWrite)
    int32 StepCount = 1;

    UPROPERTY()
    FPuertsTestStepDelegate OnStep;

    // set by the JS framework after each step completes, used by C++ to detect scripts that failed to load / threw
    UPROPERTY(BlueprintReadWrite)
    int32 FinishedSteps = 0;

    // lets scripts keep objects alive from the C++ side across steps
    UPROPERTY(BlueprintReadWrite)
    TObjectPtr<UObject> Holder;

    UPROPERTY()
    TArray<FString> Passed;

    UPROPERTY()
    TArray<FPuertsTestFailure> Failed;

    UPROPERTY()
    TArray<FPuertsTestMetric> Metrics;

    UPROPERTY()
    TArray<FString> Notes;

    UFUNCTION(BlueprintCallable)
    void Pass(const FString& Name);

    UFUNCTION(BlueprintCallable)
    void Fail(const FString& Name, const FString& Message);

    UFUNCTION(BlueprintCallable)
    void Metric(const FString& Name, double Value, const FString& Unit);

    // free-form observation that becomes part of the baseline (e.g. an exception message)
    UFUNCTION(BlueprintCallable)
    void Note(const FString& Text);

    UFUNCTION(BlueprintCallable)
    static double NowSeconds();

    // simulates an explicit destroy (Actor::Destroy, level unload): object becomes garbage on the next UE GC
    UFUNCTION(BlueprintCallable)
    static void MarkGarbage(UObject* Obj);

    UFUNCTION(BlueprintCallable)
    static bool IsAlive(UObject* Obj);
};
