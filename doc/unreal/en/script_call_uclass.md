# Interacting With C++ From TypeScript

When it comes to interacting with C++ from TypeScript, there is one main question to consider;

Are the C++ members reflected inside of Unreal Engine?

## Table Of Contents
- [Interacting With Reflected API](#interacting-with-reflected-api)
- [Interacting With Non-Reflected API](#interacting-with-non-reflected-api)

## Interacting With Reflected API
If the API in question is marked for reflection inside of Unreal Engine (i.e. `UCLASS`, `UPROPERTY`, `UFUNCTION`, `USTRUCT`, `UENUM`) then it will auomatically be recognised by puerts.

### Table Of Contents
- [Arrays, Maps And Sets](#arrays-maps-and-sets)
- [ArrayBuffers](#arraybuffers)
- [Combining TypeScript and C++ Classes With Mixin](#combining-typescript-and-c-classes-with-mixin)

### Usage
##### C++
``` c++
#include "JsEnv.h"

UCLASS()
class UDemoGameInstance : public UGameInstance
{
    GENERATED_BODY()

public:
    virtual void OnStart() override {
        MakeShared<puerts::FJsEnv>()->Start("Entry.js", 
        {
            TPair<FString, UObject*>("GameInstance", this)
        });
    }

public:
    UFUNCTION()
    void PrintExampleVariable()
    {
        UE_LOG(LogTemp, Warning, TEXT("%s"), *ExampleVariable);
    }

protected:
    UPROPERTY()
    FString ExampleVariable{};

};
```
##### TypeScript
``` typescript
// YourProject/TypeScript/Entry.ts

import * as UE from 'ue'
import { argv } from "puerts";

const DemoGameInstance = argv.getByName("GameInstance") as UE.DemoGameInstance;
const World = DemoGameInstance.GetWorld();

// Interact with reflected UObject (DemoGameInstance) and its members (UFUNCTION, UPROPERTY)
if (DemoGameInstance)
{
    DemoGameInstance.ExampleVariable = "Hello World!";
    DemoGameInstance.PrintExampleVariable();    // Prints "Hello World!" to U.E console
}

// Interact with static UObject members
if (World)
{
    // Access UClass:Load static function to get blueprint generated class
    let BlueprintGeneratedClass = UE.Class.Load('/Game/DemoBlueprint.DemoBlueprint_C');

    // Spawn an actor from the class
    if (BlueprintGeneratedClass)
    {
        const NewActor = UE.GameplayStatics.BeginDeferredActorSpawnFromClass(World, BlueprintGeneratedClass, null);       
        UE.GameplayStatics.FinishSpawningActor(NewActor, new UE.Transform(new UE.Vector(0, 0, 0)));
    }
}
```

### Arrays, Maps And Sets
##### TypeScript
``` typescript
import * as UE from 'ue'

// TArray<int>
const IntArray = UE.NewArray(UE.BuiltinInt);

// TArray<FString>
const StringArray = UE.NewArray(UE.BuiltinString);

// TArray<AActor>
const UObjectArray = UE.NewArray(UE.Actor);

// TArray<FVector>
const UStructArray = UE.NewArray(UE.Vector);

// TSet<FString>
const StringSet = UE.NewSet(UE.BuiltinString);

// TMap<FString, int>
const StringIntMap = UE.NewMap(UE.BuiltinString, UE.BuiltinInt);
```

### ArrayBuffers
##### C++
``` c++
void UMyObject::ArrayBufferTest(const FArrayBuffer& InArrayBuffer) const
{
    UE_LOG(LogTemp, Warning, TEXT("InArrayBuffer length = %i"), Ab.Length);
}
```
##### TypeScript
``` typescript
const NewArrayBuffer = new Uint8Array([21,31]);
MyUObj.ArrayBufferTest(NewArrayBuffer);
```

### Combining TypeScript and C++ Classes With Mixin
Puerts has to the ability to combine TypeScript and C++ classes together, allowing users to override reflected API logic. To get started, see [using mixin](./mixin.md).

## Interacting With Non-Reflected API
Unreal has a lot of C++ functions and classes without reflection tags. In order to access them within TypeScript, [Template-based static binding should be used](./template_binding.md).