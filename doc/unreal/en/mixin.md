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
##### TypeScript
```typescript
interface Calc extends UE.MainObject {};
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

puerts.blueprint.mixin(UE.MainObject, Calc);
```

### Mixin With Blueprint Class
##### TypeScript
```typescript
interface Loggable extends UE.Game.StarterContent.MixinTest.MixinTest_C {};
class Loggable {
    // Overrides the blueprint method "Log"
    Log(msg: string): void {
        console.log(this.GetName(), msg);
        console.log(`1 + 3 = ${this.TsAdd(1, 3)}`);
    }
}

// Load In The Class To Extend
let ucls = UE.Class.Load('/Game/StarterContent/MixinTest.MixinTest_C');
const MixinTest = puerts.blueprint.tojs<typeof UE.Game.StarterContent.MixinTest.MixinTest_C>(ucls);

// Generate The Mixin Class
const GeneratedClass = puerts.blueprint.mixin(MixinTest, Loggable).StaticClass();
```

## API Reference
### Mixin Config
You can pass an optional configuration object:

##### TypeScript
```typescript
type MixinConfig = { objectTakeByNative?: boolean, inherit?: boolean, generatedClass?: Class };
```
```typescript
const GeneratedClass = puerts.blueprint.mixin(MixinTest, Loggable, {
			objectTakeByNative: true, // `true` = UE object owns the garbage collection
			inherit: true // 'true' generated a new class object instead of applying mixin globally
}).StaticClass();
```

### Using the `super` keyword
If you want to override a method on a Blueprint subclass and still call the parent class's method, `super` won’t work directly in a mixin class that doesn’t extend any class. For example:
##### TypeScript
```typescript
class DerivedClassMixin {
    Foo(): void {
        console.log("I am a TypeScript mixin");
        super.Foo();  // This will cause a syntax error
    }
}
```

To resolve this, an intermediary class is required:
##### TypeScript
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

## Notes
### Limited function override support
Only `BlueprintNativeEvent` and `BlueprintImplementableEvent` functions are supported when overriding with TypeScript.

### Adding New Fields
New fields are stored in the stub object. Therefore:

- If `objectTakeByNative` is `false`, you must keep a reference to the stub object. Otherwise, the data may be lost when the stub is garbage collected and a new one is created for the UE object.
- If `objectTakeByNative` is `true`, you don’t need to retain a stub reference. But don’t rely on it to retain the UE object—it must be managed by the engine.

### Background
When a UE object is passed to TypeScript, a corresponding "stub" object is created in TypeScript. Calls made to this stub are forwarded to the actual native UE object. There are two lifecycle management modes in puerts:

1. **Stub Object Owns UE Object** (`objectTakeByNative = false`):
   - The stub is managed by JavaScript's GC and holds a strong reference to the UE object.
   - If the stub has no references, it is garbage collected, and the UE object may also be released.

2. **UE Object Owns Stub Object** (`objectTakeByNative = true`):
   - The UE object is managed by the UE engine's GC and holds a strong reference to the stub.
   - If the UE object has no references, it is garbage collected, and the stub may also be released.