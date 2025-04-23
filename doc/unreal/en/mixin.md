# Blueprint Mixin

Mixin allows developers to combine TypeScript and U.E Classes seamlessly. 

Example use cases include:
- Overriding existing blueprint and C++ methods within TypeScript
- Extending classes with new TypeScript methods and fields

## Table Of Contents
- [Usage](#usage)
    - [Mixin With C++ Class](#mixin-with-c-class)
    - [Mixin With Blueprint Class](#mixin-with-blueprint-class)
- [API Reference](#api-reference)
- [Notes](#notes)

## Usage
### Mixin With C++ Class
##### C++
```cpp
// ExampleMixinActor.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ExampleMixinActor.generated.h"

UCLASS()
class AExampleMixinActor : public AActor
{
	GENERATED_BODY()
	
public:
	UFUNCTION(BlueprintNativeEvent)
	void ExampleFunction();
	void ExampleFunction_Implementation()
	{
		UE_LOG(LogTemp, Warning, TEXT("AExampleMixinActor::ExampleFunction() Executed"));
	}
};
```
##### TypeScript
```typescript
// MixinExample.ts
import * as UE from 'ue'
import * as Puerts from 'puerts'

const GameInstance = Puerts.argv.getByName("GameInstance") as UE.GameInstance;
const World = GameInstance?.GetWorld();

interface ExtendedMixinActor extends UE.ExampleMixinActor {};
class ExtendedMixinActor implements ExtendedMixinActor {
    ExampleFunction(): void 
    {
        console.warn("ExtendedMixinActor::ExampleFunction() Executed");
    }
}

// Generate The Mixin Class
const GeneratedClass = Puerts.blueprint.mixin(UE.ExampleMixinActor, ExtendedMixinActor, {
    inherit: true // 'true' generated a new class object instead of applying mixin globally
}).StaticClass();

// Spawn the actor from mixin class
const SpawnedActor = UE.GameplayStatics.BeginDeferredActorSpawnFromClass(World, GeneratedClass, UE.Transform.Identity) as ExtendedMixinActor;
UE.GameplayStatics.FinishSpawningActor(SpawnedActor, UE.Transform.Identity);

SpawnedActor?.ExampleFunction();
```

### Mixin With Blueprint Class
##### TypeScript
```typescript
// MixinExample.ts
import * as UE from 'ue'
import * as Puerts from 'puerts'

const GameInstance = Puerts.argv.getByName("GameInstance") as UE.GameInstance;
const World = GameInstance?.GetWorld();

interface ExtendedMixinBlueprint extends UE.Game.ExampleMixinBlueprint.ExampleMixinBlueprint_C {};
class ExtendedMixinBlueprint implements ExtendedMixinBlueprint {
    ExampleBlueprintFunction(): void {
        console.warn("ExtendedMixinBlueprint::ExampleBlueprintFunction() Executed");
    }
}

// Load In The Class To Extend
let BlueprintClass = UE.Class.Load('/Game/ExampleMixinBlueprint.ExampleMixinBlueprint_C');
const InterperatedBlueprintClass = Puerts.blueprint.tojs(BlueprintClass);

// Generate The Mixin Class
const GeneratedClass = Puerts.blueprint.mixin(InterperatedBlueprintClass, ExtendedMixinBlueprint, {
    inherit: true // 'true' generated a new class object instead of applying mixin globally
}).StaticClass();

// Spawn the actor from mixin class
const SpawnedActor = UE.GameplayStatics.BeginDeferredActorSpawnFromClass(World, GeneratedClass, UE.Transform.Identity) as ExtendedMixinBlueprint;
UE.GameplayStatics.FinishSpawningActor(SpawnedActor, UE.Transform.Identity);

SpawnedActor?.ExampleBlueprintFunction();
```

## API Reference
### Mixin Config
You can pass an optional configuration object:

##### TypeScript
```typescript
type MixinConfig = { objectTakeByNative?: boolean, inherit?: boolean, generatedClass?: Class };
```
```typescript
// MixinExample.ts
const GeneratedClass = Puerts.blueprint.mixin(A, B, {
			objectTakeByNative: true, // `true` = UE object owns the garbage collection
			inherit: true // 'true' generated a new class object instead of applying mixin globally
}).StaticClass();
```

| Parameter Name | Description |
| :------------: | ----------- |
| `objectTakeByNative` | Should the lifetime of the mixin functions return object be handled by UE or JavaScript garbage collection. (True for UE) |
| `inherit` | Should the mixin function generate a new class object or apply globally. (True for new class object) |
| `generatedClass` | An output variable used to gather the generated class object. (Deprecated due to .StaticClass()) |

### Using the `super` keyword
If you wish to use the `super` keyword in your mixin overrides, an intermediary class is required.
##### TypeScript
```typescript
// MixinExample.ts
import * as UE from 'ue'
import * as Puerts from 'puerts'

const GameInstance = Puerts.argv.getByName("GameInstance") as UE.GameInstance;
const World = GameInstance?.GetWorld();

// Define intermediary class
interface ExampleMixinActor extends UE.ExampleMixinActor {};
class ExampleMixinActor implements ExampleMixinActor {}
Object.setPrototypeOf(ExampleMixinActor.prototype, UE.ExampleMixinActor.prototype);

// Define Mixin Override Class
class ExtendedMixinActor extends ExampleMixinActor {
    ExampleFunction(): void 
    {
        console.warn("ExtendedMixinActor: Attempting to call Super.ExampleFunction()");
        super.ExampleFunction();
    }
}

// Generate The Mixin Class
const GeneratedClass = Puerts.blueprint.mixin(UE.ExampleMixinActor, ExtendedMixinActor, {
    inherit: true // 'true' generated a new class object instead of applying mixin globally
}).StaticClass();

// Spawn the actor from mixin class
const SpawnedActor = UE.GameplayStatics.BeginDeferredActorSpawnFromClass(World, GeneratedClass, UE.Transform.Identity) as ExtendedMixinActor;
UE.GameplayStatics.FinishSpawningActor(SpawnedActor, UE.Transform.Identity);

SpawnedActor?.ExampleFunction();
```

## Notes
### Limited function override support
All functions and events defined in blueprint are supported. C++ functions must be tagged as `BlueprintNativeEvent` or `BlueprintImplementableEvent`. 