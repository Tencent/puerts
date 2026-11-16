#include "PuertsTestTypes.h"
#include "UEDataBinding.hpp"
#include "HAL/PlatformTime.h"
#include "UObject/Package.h"

int32 UPuertsTestObject::LiveCount = 0;

UPuertsTestObject::UPuertsTestObject()
{
    bBitA = false;
    bBitB = false;
    FixedInts[0] = FixedInts[1] = FixedInts[2] = 0;
    if (!HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject))
    {
        ++LiveCount;
    }
}

void UPuertsTestObject::BeginDestroy()
{
    if (!HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject))
    {
        --LiveCount;
    }
    Super::BeginDestroy();
}

int32 UPuertsTestObject::Add(int32 A, int32 B)
{
    return A + B;
}

int32 UPuertsTestObject::StaticAdd(int32 A, int32 B)
{
    return A + B;
}

FString UPuertsTestObject::Concat(const FString& A, const FString& B)
{
    return A + B;
}

FPuertsTestStruct UPuertsTestObject::MakeStruct(int32 X, const FString& S)
{
    FPuertsTestStruct Ret;
    Ret.X = X;
    Ret.S = S;
    Ret.Arr = {X, X + 1, X + 2};
    return Ret;
}

int32 UPuertsTestObject::StructSum(const FPuertsTestStruct& In)
{
    int32 Sum = In.X;
    for (int32 V : In.Arr)
    {
        Sum += V;
    }
    return Sum;
}

void UPuertsTestObject::OutParams(int32& OutInt, FString& OutStr, FPuertsTestStruct& OutStruct)
{
    OutInt = 7;
    OutStr = TEXT("out");
    OutStruct.X = 9;
    OutStruct.S = TEXT("outstruct");
}

void UPuertsTestObject::IncRef(int32& Value)
{
    ++Value;
}

int32 UPuertsTestObject::DefaultParam(int32 A, int32 B)
{
    return A * 100 + B;
}

FString UPuertsTestObject::DefaultParams(FString Str, int32 I, FVector Vec)
{
    return FString::Printf(TEXT("Str=%s I=%d Vec=(%.1f,%.1f,%.1f)"), *Str, I, Vec.X, Vec.Y, Vec.Z);
}

FString UPuertsTestObject::DefaultParamsNoMeta(FString Str, int32 I)
{
    return FString::Printf(TEXT("Str=%s I=%d"), *Str, I);
}

FVector UPuertsTestObject::VectorRef(FVector& V)
{
    V.X = 1024;
    return V + 1;
}

UPuertsTestObject* UPuertsTestObject::GetSelf()
{
    return this;
}

UPuertsTestObject* UPuertsTestObject::CreateChild()
{
    return NewObject<UPuertsTestObject>(this);
}

int32 UPuertsTestObject::SumArray(const TArray<int32>& Values)
{
    int32 Sum = 0;
    for (int32 V : Values)
    {
        Sum += V;
    }
    return Sum;
}

void UPuertsTestObject::FillArray(TArray<int32>& Out, int32 N)
{
    Out.Reset();
    for (int32 i = 0; i < N; ++i)
    {
        Out.Add(i);
    }
}

TMap<FString, int32> UPuertsTestObject::MakeMap(int32 N)
{
    TMap<FString, int32> Ret;
    for (int32 i = 0; i < N; ++i)
    {
        Ret.Add(FString::Printf(TEXT("k%d"), i), i);
    }
    return Ret;
}

EPuertsTestEnum UPuertsTestObject::NextEnum(EPuertsTestEnum In)
{
    switch (In)
    {
        case EPuertsTestEnum::A:
            return EPuertsTestEnum::B;
        case EPuertsTestEnum::B:
            return EPuertsTestEnum::C;
        default:
            return EPuertsTestEnum::A;
    }
}

FText UPuertsTestObject::MakeText(const FString& S)
{
    return FText::FromString(S);
}

int32 UPuertsTestObject::CallIntDelegate(int32 Value)
{
    return IntDelegate.IsBound() ? IntDelegate.Execute(Value) : -1;
}

void UPuertsTestObject::SetIntDelegate(FPuertsTestIntDelegate InDelegate)
{
    IntDelegate = InDelegate;
}

FPuertsTestIntDelegate UPuertsTestObject::GetIntDelegate()
{
    return IntDelegate;
}

void UPuertsTestObject::SetStepDelegate(FPuertsTestStepDelegate InDelegate)
{
    StepDelegate = InDelegate;
}

bool UPuertsTestObject::CallStepDelegate(int32 Step)
{
    return StepDelegate.ExecuteIfBound(Step);
}

void UPuertsTestObject::BroadcastMulticast(const FString& Msg)
{
    Multicast.Broadcast(Msg);
}

FString UPuertsTestObject::CallRefStringDelegate(const FString& In)
{
    FString S = In;
    RefStringDelegate.ExecuteIfBound(S);
    return S;
}

FString UPuertsTestObject::CallStringRetDelegate(const FString& In)
{
    return StringRetDelegate.IsBound() ? StringRetDelegate.Execute(In) : TEXT("unbound");
}

void UPuertsTestObject::BroadcastInt(int32 Value)
{
    IntMulticast.Broadcast(Value);
}

FString UPuertsTestObject::NativeEvent_Implementation(const FString& S)
{
    return TEXT("native:") + S;
}

int32 UPuertsTestObject::CallImplEvent(int32 Value)
{
    return ImplEvent(Value);
}

FString UPuertsTestObject::CallNativeEvent(const FString& S)
{
    return NativeEvent(S);
}

void UPuertsTestObject::Noop()
{
}

int32 UPuertsTestObject::Identity(int32 V)
{
    return V;
}

void UPuertsTestObject::ThreeArgs(int32 A, float B, const FString& C)
{
}

FString UPuertsTestObject::ReturnString()
{
    return TEXT("hello puerts");
}

void UPuertsTestObject::StaticNoop()
{
}

int32 UPuertsTestObject::LoopIntDelegate(int32 Count)
{
    int32 Sum = 0;
    for (int32 i = 0; i < Count; ++i)
    {
        Sum += IntDelegate.Execute(i);
    }
    return Sum;
}

int32 UPuertsTestObject::GetLiveCount()
{
    return LiveCount;
}

int32 FPuertsTestCountedStruct::LiveCount = 0;

FPuertsTestCountedStruct UPuertsTestObject::MakeCounted(int32 V)
{
    FPuertsTestCountedStruct Ret;
    Ret.V = V;
    return Ret;
}

int32 UPuertsTestObject::GetCountedLiveCount()
{
    return FPuertsTestCountedStruct::LiveCount;
}

FString UPuertsTestDerived::WhoAmI()
{
    return TEXT("Derived");
}

FString UPuertsTestMixinTarget::NativeEvent_Implementation(const FString& S)
{
    return TEXT("native:") + S;
}

int32 UPuertsTestMixinTarget::CallImplEvent(int32 Value)
{
    return ImplEvent(Value);
}

FString UPuertsTestMixinTarget::CallNativeEvent(const FString& S)
{
    return NativeEvent(S);
}

int32 UPuertsTestMixinTarget::LoopImplEvent(int32 Count)
{
    int32 Sum = 0;
    for (int32 i = 0; i < Count; ++i)
    {
        Sum += ImplEvent(i);
    }
    return Sum;
}

void UPuertsTestReporter::Pass(const FString& Name)
{
    Passed.Add(Name);
}

void UPuertsTestReporter::Fail(const FString& Name, const FString& Message)
{
    Failed.Add({Name, Message});
}

void UPuertsTestReporter::Metric(const FString& Name, double Value, const FString& Unit)
{
    FPuertsTestMetric M;
    M.Name = Name;
    M.Value = Value;
    M.Unit = Unit;
    Metrics.Add(M);
}

void UPuertsTestReporter::Note(const FString& Text)
{
    Notes.Add(Text);
}

double UPuertsTestReporter::NowSeconds()
{
    return FPlatformTime::Seconds();
}

void UPuertsTestReporter::MarkGarbage(UObject* Obj)
{
    if (IsValid(Obj))
    {
#if ENGINE_MAJOR_VERSION >= 5
        Obj->MarkAsGarbage();
#else
        Obj->MarkPendingKill();
#endif
    }
}

bool UPuertsTestReporter::IsAlive(UObject* Obj)
{
    return IsValid(Obj);
}

int32 UPuertsTestReflectTarget::InterfacePing_Implementation(int32 InValue)
{
    return InValue + Value;
}

void UPuertsTestJsObjectHolder::SetValue(const FJsObject& In)
{
    Value = In;
}

FJsObject UPuertsTestJsObjectHolder::GetValue() const
{
    return Value;
}

int32 UPuertsTestJsObjectHolder::GetInt(const FString& Key) const
{
    return Value.Get<int32>(TCHAR_TO_UTF8(*Key));
}

FString UPuertsTestJsObjectHolder::GetString(const FString& Key) const
{
    return Value.Get<FString>(TCHAR_TO_UTF8(*Key));
}

FJsObject UPuertsTestJsObjectHolder::GetObject(const FString& Key) const
{
    return Value.Get<FJsObject>(TCHAR_TO_UTF8(*Key));
}

void UPuertsTestJsObjectHolder::SetInt(const FString& Key, int32 V) const
{
    Value.Set<int32>(TCHAR_TO_UTF8(*Key), V);
}

int32 UPuertsTestJsObjectHolder::CallFunc(int32 A, int32 B) const
{
    return Value.Func<int32>(A, B);
}

void UPuertsTestJsObjectHolder::CallAction(const FString& S) const
{
    Value.Action(S);
}

int32 UPuertsTestJsObjectHolder::CopyAndRead(const FString& Key) const
{
    FJsObject Copied(Value);
    FJsObject Assigned;
    Assigned = Copied;
    const FJsObject& Self = Assigned;
    Assigned = Self;
    return Copied.Get<int32>(TCHAR_TO_UTF8(*Key)) + Assigned.Get<int32>(TCHAR_TO_UTF8(*Key));
}

int32 UPuertsTestExtension::ExtTriple(UPuertsTestReflectTarget* Target)
{
    return Target ? Target->Value * 3 : -1;
}

int32 UPuertsTestExtension::ExtStructDouble(const FPuertsTestStruct& S)
{
    return S.X * 2;
}

UPuertsTestArrayBufferHolder::UPuertsTestArrayBufferHolder()
{
    Buffer.Data = nullptr;
    Buffer.Length = 0;
    if (!HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject))
    {
        Buffer.Length = 10;
        Buffer.Data = FMemory::Malloc(Buffer.Length);
        uint8* Data = static_cast<uint8*>(Buffer.Data);
        for (size_t i = 0; i < Buffer.Length; ++i)
        {
            Data[i] = static_cast<uint8>(2 * (i + 1));
        }
    }
}

void UPuertsTestArrayBufferHolder::BeginDestroy()
{
    if (Buffer.Data)
    {
        FMemory::Free(Buffer.Data);
        Buffer.Data = nullptr;
        Buffer.Length = 0;
    }
    Super::BeginDestroy();
}

int32 UPuertsTestArrayBufferHolder::BufferSum() const
{
    return Sum(Buffer);
}

int32 UPuertsTestArrayBufferHolder::Sum(const FArrayBuffer& Ab) const
{
    int32 Ret = 0;
    const uint8* Data = static_cast<const uint8*>(Ab.Data);
    for (size_t i = 0; Data && i < Ab.Length; ++i)
    {
        Ret += Data[i];
    }
    return Ret;
}

FArrayBuffer UPuertsTestArrayBufferHolder::SkipFirst(const FArrayBuffer& Ab) const
{
    if (Ab.Length > 0)
    {
        return FArrayBuffer{static_cast<uint8*>(Ab.Data) + 1, Ab.Length - 1};
    }
    return Ab;
}

FArrayBuffer UPuertsTestArrayBufferHolder::SkipFirstCopy(const FArrayBuffer& Ab) const
{
    FArrayBuffer Ret = SkipFirst(Ab);
    Ret.bCopy = true;
    return Ret;
}

int32 UPuertsTestArrayBufferHolder::ValueSum(const FArrayBufferValue& Ab) const
{
    int32 Ret = 0;
    for (uint8 B : Ab.Data)
    {
        Ret += B;
    }
    return Ret;
}

FArrayBufferValue UPuertsTestArrayBufferHolder::MakeValue(int32 N) const
{
    FArrayBufferValue Ret;
    for (int32 i = 0; i < N; ++i)
    {
        Ret.Data.Add(static_cast<uint8>(i + 1));
    }
    return Ret;
}
