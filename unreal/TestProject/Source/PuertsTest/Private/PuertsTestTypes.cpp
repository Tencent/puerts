#include "PuertsTestTypes.h"
#include "HAL/PlatformTime.h"
#include "Engine/Blueprint.h"
#include "Misc/Paths.h"
#include "TypeScriptGeneratedClass.h"
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

FString UPuertsTestMakeClassTarget::NativeEvent_Implementation(const FString& S)
{
    return TEXT("native:") + S;
}

int32 UPuertsTestMakeClassTarget::CallImplEvent(int32 Value)
{
    return ImplEvent(Value);
}

FString UPuertsTestMakeClassTarget::CallNativeEvent(const FString& S)
{
    return NativeEvent(S);
}

int32 UPuertsTestMakeClassTarget::LoopImplEvent(int32 Count)
{
    int32 Sum = 0;
    for (int32 i = 0; i < Count; ++i)
    {
        Sum += ImplEvent(i);
    }
    return Sum;
}

FString UPuertsTestTsTarget::NativeEvent_Implementation(const FString& S)
{
    return TEXT("native:") + S;
}

int32 UPuertsTestTsTarget::CallImplEvent(int32 Value)
{
    return ImplEvent(Value);
}

FString UPuertsTestTsTarget::CallNativeEvent(const FString& S)
{
    return NativeEvent(S);
}

int32 UPuertsTestTsTarget::LoopImplEvent(int32 Count)
{
    int32 Sum = 0;
    for (int32 i = 0; i < Count; ++i)
    {
        Sum += ImplEvent(i);
    }
    return Sum;
}

UClass* UPuertsTestTsTarget::CreateTsClass(const FString& Module)
{
    // the env finds the js module from the package path, see FJsEnvImpl::MakeSureInject
    const FString PackageName = FString(TEXT("/Game" TS_BLUEPRINT_PATH)) + Module;
    UPackage* Package = CreatePackage(*PackageName);
    Package->SetFlags(RF_Transient);

    UClass* Parent = UPuertsTestTsTarget::StaticClass();
    const FName ClassName = MakeUniqueObjectName(
        Package, UTypeScriptGeneratedClass::StaticClass(), FName(*(FPaths::GetBaseFilename(Module) + TEXT("_C"))));
    auto Class = NewObject<UTypeScriptGeneratedClass>(Package, ClassName, RF_Public | RF_Transient);
    Class->HasConstructor = false;

#if ENGINE_MAJOR_VERSION < 5 || WITH_EDITOR
    auto Blueprint = NewObject<UBlueprint>(Package, NAME_None, RF_Transient);
    Blueprint->GeneratedClass = Class;
    Class->ClassGeneratedBy = Blueprint;
#endif

    Class->PropertyLink = Parent->PropertyLink;
    Class->ClassWithin = Parent->ClassWithin;
    Class->ClassConfigName = Parent->ClassConfigName;
    Class->SetSuperStruct(Parent);
    Class->ClassFlags |= (Parent->ClassFlags & (CLASS_Inherit | CLASS_ScriptInherit)) | CLASS_CompiledFromBlueprint;
    Class->ClassCastFlags |= Parent->ClassCastFlags;

    // a compiled blueprint declares the events it implements in its own class
    for (const TCHAR* Name : {TEXT("ImplEvent"), TEXT("NativeEvent")})
    {
        UFunction* Super = Parent->FindFunctionByName(Name);
        check(Super);
        if (Super->HasAnyFunctionFlags(FUNC_Native))
        {
            // the duplicate is bound while still native, give it something to bind to
            Class->AddNativeFunction(Name, Super->GetNativeFunc());
        }
        UFunction* Function =
            CastChecked<UFunction>(StaticDuplicateObject(Super, Class, Super->GetFName(), RF_Transient, UFunction::StaticClass()));
        Function->ClearInternalFlags(EInternalObjectFlags::Native);
        Function->FunctionFlags &= ~FUNC_Native;
        Function->SetSuperStruct(Super);
        Function->Next = Class->Children;
        Class->Children = Function;
        Function->Bind();
        Function->StaticLink(true);
        Class->AddFunctionToFunctionMap(Function, Function->GetFName());
    }

    Class->Bind();
    Class->StaticLink(true);

    // creating the CDO lets the env take over the class (TryBindJs) and load the js module (TsConstruct)
    (void) Class->GetDefaultObject();
    // what the blueprint compiler does after the CDO is made, InitPropertiesFromCustomList ensures it for instances
    Class->UpdateCustomPropertyListForPostConstruction();
    return Class;
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
        Obj->MarkAsGarbage();
    }
}

bool UPuertsTestReporter::IsAlive(UObject* Obj)
{
    return IsValid(Obj);
}
