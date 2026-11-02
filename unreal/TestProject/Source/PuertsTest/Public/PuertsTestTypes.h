#pragma once

#include "CoreMinimal.h"
#include "UObject/Object.h"
#include "UObject/SoftObjectPtr.h"
#include "ExtensionMethods.h"
#include "JsObject.h"
#include "ArrayBuffer.h"
#include "PuertsTestTypes.generated.h"

UENUM(BlueprintType)
enum class EPuertsTestEnum : uint8
{
    A,
    B,
    C = 10
};

// enums with non uint8 underlying types, used as container elements
UENUM()
enum class EPuertsTestEnumInt32 : int32
{
    VM1 = -1,
    V0 = 0,
    V1 = 1,
    V2 = 2,
    V3 = 3
};

UENUM()
enum class EPuertsTestEnumInt8Min : int8
{
    VINT8_MIN = -128
};

UENUM()
enum class EPuertsTestEnumInt8Max : int8
{
    VINT8_MAX = 127
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

// counts its live instances, used by the struct lifetime tests
USTRUCT(BlueprintType)
struct PUERTSTEST_API FPuertsTestCountedStruct
{
    GENERATED_BODY()

    FPuertsTestCountedStruct()
    {
        ++LiveCount;
    }

    FPuertsTestCountedStruct(const FPuertsTestCountedStruct& Other) : V(Other.V)
    {
        ++LiveCount;
    }

    FPuertsTestCountedStruct& operator=(const FPuertsTestCountedStruct& Other) = default;

    ~FPuertsTestCountedStruct()
    {
        --LiveCount;
    }

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 V = 0;

    static int32 LiveCount;
};

DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam(int32, FPuertsTestIntDelegate, int32, Value);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FPuertsTestMulticastDelegate, const FString&, Msg);
DECLARE_DYNAMIC_DELEGATE_OneParam(FPuertsTestStepDelegate, int32, Step);
DECLARE_DYNAMIC_DELEGATE_OneParam(FPuertsTestRefStringDelegate, FString&, Str);
DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam(FString, FPuertsTestStringRetDelegate, const FString&, In);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FPuertsTestIntMulticastDelegate, int32, Value);

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

    // not BlueprintReadWrite: blueprint does not support double before UE5 (puerts exposes it via reflection anyway)
    UPROPERTY()
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
    UPuertsTestObject* ObjectValue = nullptr;

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

    // several defaults of string / int / struct type
    UFUNCTION(BlueprintCallable)
    FString DefaultParams(FString Str = TEXT("i am default"), int32 I = 10, FVector Vec = FVector(1.1, 2.2, 3.3));

    // same defaults without BlueprintCallable: UHT keeps no CPP_Default_ metadata, the defaults are invisible to scripts
    UFUNCTION()
    FString DefaultParamsNoMeta(FString Str = TEXT("i am default"), int32 I = 10);

    // ref struct param: sets X to 1024 and returns the modified value + 1
    UFUNCTION(BlueprintCallable)
    FVector VectorRef(UPARAM(ref) FVector& V);

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

    UPROPERTY()
    FPuertsTestRefStringDelegate RefStringDelegate;

    UPROPERTY()
    FPuertsTestStringRetDelegate StringRetDelegate;

    UPROPERTY(BlueprintAssignable)
    FPuertsTestIntMulticastDelegate IntMulticast;

    // executes RefStringDelegate with a copy of In and returns the value written back by the delegate
    UFUNCTION(BlueprintCallable)
    FString CallRefStringDelegate(const FString& In);

    UFUNCTION(BlueprintCallable)
    FString CallStringRetDelegate(const FString& In);

    UFUNCTION(BlueprintCallable)
    void BroadcastInt(int32 Value);

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

    // ---------- struct lifetime helpers ----------
    UFUNCTION(BlueprintCallable)
    FPuertsTestCountedStruct MakeCounted(int32 V);

    UFUNCTION(BlueprintCallable)
    static int32 GetCountedLiveCount();
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

UINTERFACE(BlueprintType)
class PUERTSTEST_API UPuertsTestInterface : public UInterface
{
    GENERATED_BODY()
};

class PUERTSTEST_API IPuertsTestInterface
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, BlueprintNativeEvent)
    int32 InterfacePing(int32 Value);
};

// Used only by FJsObject tests (tests/js_object.js and FPuertsTest_JsObject).
UCLASS(BlueprintType)
class PUERTSTEST_API UPuertsTestJsObjectHolder : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadWrite)
    FJsObject Value;

    UFUNCTION(BlueprintCallable)
    void SetValue(const FJsObject& In);

    UFUNCTION(BlueprintCallable)
    FJsObject GetValue() const;

    UFUNCTION(BlueprintCallable)
    int32 GetInt(const FString& Key) const;

    UFUNCTION(BlueprintCallable)
    FString GetString(const FString& Key) const;

    UFUNCTION(BlueprintCallable)
    FJsObject GetObject(const FString& Key) const;

    UFUNCTION(BlueprintCallable)
    void SetInt(const FString& Key, int32 V) const;

    UFUNCTION(BlueprintCallable)
    int32 CallFunc(int32 A, int32 B) const;

    UFUNCTION(BlueprintCallable)
    void CallAction(const FString& S) const;

    // reads Key through a copy constructed and a copy assigned FJsObject, returns the sum
    UFUNCTION(BlueprintCallable)
    int32 CopyAndRead(const FString& Key) const;
};

// Used only by reflection binding tests: implements an interface, extension methods are declared in UPuertsTestExtension.
UCLASS(BlueprintType)
class PUERTSTEST_API UPuertsTestReflectTarget : public UObject, public IPuertsTestInterface
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadWrite)
    int32 Value = 1;

    virtual int32 InterfacePing_Implementation(int32 InValue) override;
};

UCLASS()
class PUERTSTEST_API UPuertsTestExtension : public UExtensionMethods
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable)
    static int32 ExtTriple(UPuertsTestReflectTarget* Target);

    UFUNCTION(BlueprintCallable)
    static int32 ExtStructDouble(const FPuertsTestStruct& S);
};

// Used only by tests/array_buffer.js.
UCLASS(BlueprintType)
class PUERTSTEST_API UPuertsTestArrayBufferHolder : public UObject
{
    GENERATED_BODY()

public:
    UPuertsTestArrayBufferHolder();

    virtual void BeginDestroy() override;

    // C++ owned memory (bCopy == false), initialized to 2, 4, ..., 20
    UPROPERTY()
    FArrayBuffer Buffer;

    UFUNCTION()
    int32 BufferSum() const;

    UFUNCTION()
    int32 Sum(const FArrayBuffer& Ab) const;

    // a view of Ab without the first byte (bCopy == false)
    UFUNCTION()
    FArrayBuffer SkipFirst(const FArrayBuffer& Ab) const;

    // same as SkipFirst but bCopy == true
    UFUNCTION()
    FArrayBuffer SkipFirstCopy(const FArrayBuffer& Ab) const;

    UFUNCTION()
    int32 ValueSum(const FArrayBufferValue& Ab) const;

    UFUNCTION()
    FArrayBufferValue MakeValue(int32 N) const;
};

// Used only by tests/container_element_types.js: one container per element type.
UCLASS(BlueprintType)
class PUERTSTEST_API UPuertsTestContainerElements : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY()
    TArray<int32> Int32Array;

    UPROPERTY()
    TArray<uint32> UInt32Array;

    UPROPERTY()
    TArray<int64> Int64Array;

    UPROPERTY()
    TArray<uint64> UInt64Array;

    UPROPERTY()
    TArray<float> FloatArray;

    UPROPERTY()
    TArray<double> DoubleArray;

    UPROPERTY()
    TArray<bool> BoolArray;

    UPROPERTY()
    TArray<EPuertsTestEnumInt32> EnumInt32Array;

    UPROPERTY()
    TArray<EPuertsTestEnumInt8Min> EnumInt8MinArray;

    UPROPERTY()
    TArray<EPuertsTestEnumInt8Max> EnumInt8MaxArray;

    UPROPERTY()
    TArray<FString> StringArray;

    UPROPERTY()
    TArray<FText> TextArray;

    UPROPERTY()
    TArray<FName> NameArray;

    UPROPERTY()
    TArray<FVector> VectorArray;

    UPROPERTY()
    TArray<UObject*> ObjectArray;

    UPROPERTY()
    TArray<UClass*> ClassArray;
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
    UObject* Holder = nullptr;

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

    // double functions are not BlueprintCallable: blueprint does not support double before UE5
    UFUNCTION()
    void Metric(const FString& Name, double Value, const FString& Unit);

    // free-form observation that becomes part of the baseline (e.g. an exception message)
    UFUNCTION(BlueprintCallable)
    void Note(const FString& Text);

    UFUNCTION()
    static double NowSeconds();

    // simulates an explicit destroy (Actor::Destroy, level unload): object becomes garbage on the next UE GC
    UFUNCTION(BlueprintCallable)
    static void MarkGarbage(UObject* Obj);

    UFUNCTION(BlueprintCallable)
    static bool IsAlive(UObject* Obj);
};
