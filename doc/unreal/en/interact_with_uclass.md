# TypeScript and engine interaction

Below is a translated version of the original docs by Incanta Games. The translation is mainly done with Google Translate, but then modified by hand to try to make sense of what Google Translate is missing.

All C++/blueprints of type `UCLASS`, `UPROPERTY`, `UFUNCTION`, `USTRUCT`, `UENUM`, can be accessed directly with TypeScript.

However, for any C++ constructs (attributes, methods, classes, structs, enums) not marked with the associated `UXXXXX` described above, you'll need follow the instructions in [template_binding.md](./template_binding.md).

## Generate TypeScript declaration files

- C++/blueprints are called by TypeScript, in addition to the C++ class is a resident memory, the blueprint requires manual loading, the method/attribute access on other objects, etc.
- Click the following button to make a declaration
![puerts_gen_dts.png](../../../doc/pic/puerts_gen_dts.png)
- Alternatively, a declaration file can also be generated with the console command: `Puerts.Gen`
    - The plugin doesn't support the button being shown for UE5 EA currently, so you'll have to use the console command regardless.

## Members and functions

``` typescript
// Object construct
let obj = new UE.MainObject();

// Member visit
console.log("before set", obj.MyString)
obj.MyString = "PPPPP";
console.log("after set", obj.MyString)

// Simple type parameter function
let sum = obj.Add(100, 300);
console.log('sum', sum)

// Complex type parameter function
obj.Bar(new UE.Vector(1, 2, 3));

// Quote type parameter function
let vectorRef = $ref(new UE.Vector(1, 2, 3))
obj.Bar2(vectorRef);
obj.Bar($unref(vectorRef));

// Static function
let str1 = UE.JSBlueprintFunctionLibrary.GetName();
let str2 = UE.JSBlueprintFunctionLibrary.Concat(', ', str1);
UE.JSBlueprintFunctionLibrary.Hello(str2);

// enumerate
obj.EnumTest(UE.EToTest.V1);
```

## Blueprint & Other Resources Load

``` typescript
// Load a blueprint class
let bpClass = UE.Class.Load('/Game/StarterContent/TestBlueprint.TestBlueprint_C');
// UE.XXX.Load is equivalent to writing LoadObject<XXX> in C++, so UE.Class.Load is equivalent to C++'s LoadObject<UCLASS>()
let bpActor = world.SpawnActor(bpClass, undefined, UE.ESpawnActorCollisionHandlingMethod.Undefined, undefined, undefined) as UE.TestBlueprint_C;

// Load a particle system
let bulletImpact = UE.ParticleSystem.Load("/Game/BlockBreaker/ParticleSystems/PS_BulletImpact");

// Load a static mesh
let rifle = UE.StaticMesh.Load("/Game/BlockBreaker/Meshes/SM_Rifle");
```

## TArray, TSet, TMap

### Create

``` typescript
// TArray<int>
let a2 = UE.NewArray(UE.BuiltinInt);

// TArray<FString>
let a3 = UE.NewArray(UE.BuiltinString);

// TArray<UActor>
let a4 = UE.NewArray(UE.Actor);

// TArray<FVector>
let a5 = UE.NewArray(UE.Vector);

// TSet<FString>
let s1 = UE.NewSet(UE.BuiltinString);

// TMap<FString, int>
let m1 = UE.NewMap(UE.BuiltinString, UE.BuiltinInt);
```

### Access, press the automatic prompt of the IDE to access the container (Incanta here: not quite sure what this Google Translate means, but it looks like there's just some demonstration of using the objects generated in the above examples)

``` typescript
a2.Add(888);
a2.Set(0, 7);
console.log(a2.Num());
m1.Add("John", 0)
m1.Add("Che", 1)
console.log(m1.Get("John"))
```

## ArrayBuffer

Handling network messages need this

### Access a C++ FArrayBuffer in TypeScript

If you have the following C++ code:

``` c++
UPROPERTY()
FArrayBuffer ArrayBuffer;

// Set content
ArrayBuffer.Data = "hello";
ArrayBuffer.Length = 5;
```

Here's how you would access with the `ArrayBuffer` in TypeScript:

``` typescript
let ab = obj.ArrayBuffer;
let u8a1 = new Uint8Array(ab);
for (var i = 0; i < u8a1.length; i++) {
    console.log(i, u8a1[i]);
}
```

## TypeScript Passing FArrayBuffer to C++

If you have the C++ function that accepts a `FArrayBuffer`, like below:

``` c++
void UMainObject::ArrayBufferTest(const FArrayBuffer& Ab) const
{
    UE_LOG(LogTemp, Warning, TEXT("Ab(%p, %d)"), Ab.Data, Ab.Length);
}
```

You can call this function/emulate the `FArrayBuffer` in TypeScript witha `Uint8Array`:

``` typescript
var arr = new Uint8Array([21,31]);
obj.ArrayBufferTest(arr);
```

## Callback

C++ engine code/modules can actively call TypeScript via `Dynamic_Delegate` and `Dynamic_Multicast_Delegate`, similarly how C++ can call/trigger function/events in Blueprints.

- UI user action, web messages can be notified to TypeScript
- If you want to export a TypeScript function to C++ call, you can also use this

Here's the C++ declaration

``` c++
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FNotifyWithInt, int32, A);
DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam(FString, FNotifyWithStringRet, FString, A);
DECLARE_DYNAMIC_DELEGATE_OneParam(FNotifyWithRefString, FString&, A);

UCLASS()
class PUERTS_UNREAL_DEMO_API AMyActor : public AActor
{
    GENERATED_BODY()

public:
    UPROPERTY()
    FNotifyWithInt NotifyWithInt;

    UPROPERTY()
    FNotifyWithRefString NotifyWithRefString;

    UPROPERTY()
    FNotifyWithStringRet NotifyWithStringRet;
    //...
};

```

This is how you bind TypeScript to be called when the C++ functions trigger the delegates

``` typescript
function MutiCast1(i) {
    console.warn("MutiCast1<<<", i);
}

function MutiCast2(i) {
    console.warn("MutiCast2>>>", i);
}

actor.NotifyWithInt.Add(MutiCast1);
actor.NotifyWithInt.Add(MutiCast2);

actor.NotifyWithRefString.Bind((strRef) => {
    console.log("NotifyWithRefString", $unref(strRef));
    $set(strRef, "out to NotifyWithRefString"); // Reference parameter output
});

actor.NotifyWithStringRet.Bind((inStr) => {
    return "////" + inStr;
});
```

The below C++ code triggers the events to call the bound functions in TypeScript

``` c++
NotifyWithInt.Broadcast(0);
NotifyWithStringRet.ExecuteIfBound("hi...");
if (NotifyWithRefString.IsBound())
{
    FString Str = TEXT("hello john che ");

    NotifyWithRefString.Execute(Str);
    UE_LOG(LogTemp, Warning, TEXT("NotifyWithRefString out ? %s"), -Str);
}
```

## Extend function

Unreal has a lot of C++ functions without `UFUNCTION` tags; here are tw, how do this API call?There are two ways:

- Extension functions (recommended)
- Generate a wrap code with Puerts an unpublished code generator (Incanta here, not sure what the Google Translate here means, but I concur the below example is the recommended method)

Take `UObject::GetClass` and `UObject::FindFunction` as an example. Basically the below code is just creating C++ wrappers around the the function and exposing them to Blueprints/TypeScript.

C++ extension

``` c++
// ObjectExtension.h
UCLASS()
class UObjectExtension : public UExtensionMethods
{
    GENERATED_BODY()

    UFUNCTION(BlueprintCallable, Category = "ObjectExtension")
    static UClass * GetClass(UObject * Object);

    UFUNCTION(BlueprintCallable, Category = "ObjectExtension")
    static UFunction * FindFunction(UObject * Object, FName InName);
};
```

``` c++
// ObjectExtension.cpp
#include "ObjectExtension.h"

UClass * UObjectExtension::GetClass(UObject * Object)
{
    return Object->GetClass();
}

UFunction * UObjectExtension::FindFunction(UObject * Object, FName InName)
{
    return Object->FindFunction(InName);
}
```

Important:

- Newly built a class inheritance from `UExtensionMethods`
    - Incanta here. This is a class built into Puerts that extends the `UBlueprintFunctionLibrary` class. I'm assuming Puerts does some extra processing on child classes of `UExtensionMethods` to allow you do to the fancy `obj.GetClass()` syntax in the below TypeScript example. Pretty cool feature.
- The first argument of the function is the expanded class

When TypeScript is accessed, the member method of accessing an object is similar.

**NOTE:** You need to regenerate TypeScript declaration files for the new C++ extension functions.

``` typescript
let cls = obj.GetClass();
let func = obj.FindFunction("Func");
```
