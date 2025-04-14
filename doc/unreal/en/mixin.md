# Blueprint Mixin

This feature allows you to mix a TypeScript class (e.g., class `A`) into a Blueprint class (e.g., class `B`). Key capabilities include:

- If both classes have the same function, the logic in `A` will override the one in `B`.
- Supports Unreal Engine (UE) events (e.g., `ReceiveBeginPlay`).
- Allows adding new methods and fields.

## Key Features

- **Safe**: If the TypeScript class and Blueprint class have functions with the same name, their compatibility will be checked (according to TypeScript's covariance and contravariance rules).
- **Efficient**: TypeScript classes can call methods from Blueprint classes with full code completion support.
- **Powerful**:
  - You can add methods via TypeScript (not visible in Blueprint).
  - You can add fields via TypeScript (not visible in Blueprint).
  - Supports mixing in network-related (RPC) methods.
  - Supports mixing in events and receiving callbacks.
  - Supports object lifecycle control from both script and engine sides.
  - Supports mixin for `BlueprintNativeEvent` and `BlueprintImplementableEvent` methods from native classes.

## Notes

- When overriding UE events, make sure the mixin class defines the corresponding event (even if the logic is empty), otherwise the TypeScript logic might not be called. See: [Issue #1762](https://github.com/Tencent/puerts/issues/1762)

---

## Basic Usage

For a complete example, see the [UsingMixin.ts file](https://github.com/chexiongsheng/puerts_unreal_demo/blob/master/TypeScript/UsingMixin.ts). Replace the `Start` script with `UsingMixin` to run it.

### Load the Blueprint Class to be Mixed In

```typescript
let ucls = UE.Class.Load('/Game/StarterContent/MixinTest.MixinTest_C');
const MixinTest = blueprint.tojs<typeof UE.Game.StarterContent.MixinTest.MixinTest_C>(ucls);
```

### Write the TypeScript Extension

```typescript
interface Loggable extends UE.Game.StarterContent.MixinTest.MixinTest_C {};

class Loggable {
    // Overrides a Blueprint method. If the signature is incompatible with the one in MixinTest_C, an error is thrown.
    Log(msg: string): void {
        console.log(this.GetName(), msg);
        console.log(`1 + 3 = ${this.TsAdd(1, 3)}`);
    }

    // Pure TypeScript method not present in the Blueprint
    TsAdd(x: number, y: number): number {
        console.log(`Ts Add(${x}, ${y})`);
        return x + y;
    }
}
```

### Apply the Mixin

```typescript
const MixinTestWithMixin = blueprint.mixin(MixinTest, Loggable);
```

### Use the New Class

The `MixinTestWithMixin` is now the new class with extended logic.

```typescript
world.SpawnActor(MixinTestWithMixin.StaticClass(), undefined, UE.ESpawnActorCollisionHandlingMethod.Undefined, undefined, undefined) as Loggable;
```

---

## Advanced Usage

### Background

When a UE object is passed to TypeScript, a corresponding "stub" object is created in TypeScript. Calls made to this stub are forwarded to the actual native UE object. There are two lifecycle management modes in puerts:

1. **Stub Object Owns UE Object** (`objectTakeByNative = false`):
   - The stub is managed by JavaScript's GC and holds a strong reference to the UE object.
   - If the stub has no references, it is garbage collected, and the UE object may also be released.

2. **UE Object Owns Stub Object** (`objectTakeByNative = true`):
   - The UE object is managed by the UE engine's GC and holds a strong reference to the stub.
   - If the UE object has no references, it is garbage collected, and the stub may also be released.

### `blueprint.mixin` Third Parameter

You can pass an optional configuration object:

```typescript
type MixinConfig = { objectTakeByNative?: boolean, inherit?: boolean, generatedClass?: Class };
```

- `objectTakeByNative` (default `false`):  
  - `false`: Stub owns UE object.
  - `true`: UE object owns stub.

- `inherit` and `generatedClass` (default `false`):  
  - If `true`, a subclass of the original Blueprint class is dynamically generated and used for the mixin.  
  - The generated class can be retrieved through the `generatedClass` field.

### `super` Keyword Usage

If you want to override a method on a Blueprint subclass and still call the parent class's method, `super` won’t work directly in a mixin class that doesn’t extend any class. For example:

```typescript
class DerivedClassMixin {
    Foo(): void {
        console.log("I am a TypeScript mixin");
        super.Foo();  // This will cause a syntax error
    }
}
```

To resolve this, use an intermediary class:

```typescript
interface MixinSuperTestBasePlaceHolder extends UE.Game.StarterContent.MixinSuperTestBase.MixinSuperTestBase_C {};
class MixinSuperTestBasePlaceHolder {}
Object.setPrototypeOf(MixinSuperTestBasePlaceHolder.prototype, MixinSuperTestBase.prototype);

class DerivedClassMixin extends MixinSuperTestBasePlaceHolder {
    Foo(): void {
        console.log("I am a TypeScript mixin");
        super.Foo();  // This now works
    }
}
```

---

## Adding New Fields

New fields are stored in the stub object. Therefore:

- If `objectTakeByNative` is `false`, you must keep a reference to the stub object. Otherwise, the data may be lost when the stub is garbage collected and a new one is created for the UE object.
- If `objectTakeByNative` is `true`, you don’t need to retain a stub reference. But don’t rely on it to retain the UE object—it must be managed by the engine.

---

## Mixin with Native Classes

Only `BlueprintNativeEvent` and `BlueprintImplementableEvent` functions are supported. For example, in C++:

```cpp
class UMainObject : public UObject {
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintNativeEvent)
    int32 Mult(int32 a, int32 b) const;

    UFUNCTION(BlueprintImplementableEvent)
    int32 Div(int32 a, int32 b) const;

    int32 Mult_Implementation(int32 a, int32 b) const {
        UE_LOG(LogTemp, Warning, TEXT("wrong implementation div %d %d"), a, b);
        return a + b;
    }
};
```

In TypeScript:

```typescript
let obj = new UE.MainObject();

console.log('before mixin start....');
obj.Mult(1, 2);
obj.Div(4, 5);
console.log('before mixin end....');

class Calc {
    Mult(x: number, y: number): number {
        console.log(`Ts Mult(${x}, ${y})`);
        return x * y;
    }

    Div(x: number, y: number): number {
        console.log(`Ts Div(${x}, ${y})`);
        return x / y;
    }
}

interface Calc extends UE.MainObject {};

blueprint.mixin(UE.MainObject, Calc);

console.log('after mixin start....');
obj.Mult(1, 2);
obj.Div(4, 5);
console.log('after mixin end....');
```

**Expected Output:**

```bash
before mixin start....
wrong implementation div 1 2
before mixin end....
after mixin start....
Ts Mult(1, 2)
Ts Div(4, 5)
after mixin end....
```

As you can see, even for already instantiated objects, the mixin overrides the method behavior successfully.

---

## Fixing Bugs in `BlueprintNativeEvent` C++ Functions

If your C++ function declared with `BlueprintNativeEvent` has a bug, you can use this mixin approach to override it with the correct logic from TypeScript.