# Puerts - Unreal User Manual

Below is a translated version of the original docs by Incanta Games. The translation is mainly done with Google Translate, but then modified by hand to try to make sense of what Google Translate is missing.

## Get started using with one of two methods

- [Method 1: Start the virtual machine yourself](#method-1-start-the-virtual-machine-yourself)
- [Method 2: Automatic binding mode](#method-2-automatic-binding-mode)

### Method 1: Start the virtual machine yourself

- Start one or more virtual machines as needed (such as `GameInstance`)
    - If multiple virtual machines are started, these virtual machines are isolated from each other.
- Start a script with the `Start` function, as the entry point of the script logic (Similar to the `main` function)
    - `Start` can be passed to some data as a parameter for the script acquisition
- The script in the virtual machine can be interactive according to the rule of puerts (later chapter) and engine

``` c++
UCLASS()
class PUERTS_UNREAL_DEMO_API UTsGameInstance : public UGameInstance
{
public:
    TSharedPtr<puerts::FJsEnv> JsEnv;

    virtual void OnStart() override {
        JsEnv = MakeShared<puerts::FJsEnv>();
        TArray<TPair<FString, UObject*>> Arguments;
        Arguments.Add(TPair<FString, UObject*>(TEXT("GameInstance"), this));
        JsEnv->Start("QuickStart", Arguments);
    }

    virtual void Shutdown() override {
        JsEnv.Reset();
    }
};
```

### Method 2: Automatic binding mode

The advantage of this mode is that the class can be identified by the UE editor.

- Command line to enter `Plugins/Puerts` Directory, execute the following command to complete the opening and dependence installation of this mode

``` shell
node enable_puerts_module.js
```

For example, such a class:

``` typescript
import * as UE from 'ue'

class TS_Player extends UE.Character {
}

export default TS_Player;
```

Then you can choose it in the UE editor.

![select_character.png](../../../doc/pic/select_character.png)

- Can be identified by the UE, support constructor, support Override Blueprint Override method, support axial map Axis, Action event, support RPC

``` typescript
class TS_Player extends UE.Character {
    FpsCamera: UE.CameraComponent;
    //...

    Constructor() {
        let FpsCamera = this.CreateDefaultSubobjectGeneric<UE.CameraComponent>("FpsCamera", UE.CameraComponent.StaticClass());
        FpsCamera.SetupAttachment(this.CapsuleComponent, "FpsCamera");
        //...
    }

    MoveForward(axisValue: number): void {
        this.AddMovementInput(this.GetActorForwardVector(), axisValue, false);
    }

    MoveRight(axisValue: number): void {
        this.AddMovementInput(this.GetActorRightVector(), axisValue, false);
    }

    ReceiveBeginPlay(): void {
        //...
    }
    //...
}
```

### The relationship between two modes

- Automatic binding mode is based on the self-starting virtual machine mode, `PuertsModule` launches a virtual machine, then do some automatic binding blueprint, code increment compilation, incremental refresh feature
- Both can be coexist, but you must keep in mind your own manually started virtual machine, and `PuertsModule`'s virtual machine is not the same, they are isolated from each other.

## Automatic binding mode

### Format

A TypeScript satisfies three points below, a class can be identified by the UE editor

- This class inherits the class of the UE or the class of the other inheritance UE;
- The name of the file name and remove the `.ts` suffix;
- Put this class export default。

### Constructor

Unlike the standard TypeScript `constructor`, the automatic binding mode is mainly written by the constructor of the UE initialization, that is, `Constructor`

``` typescript
class TsTestActor extends UE.Actor {
    tickCount: number;

    // Note that inheriting the JS class of the UE class, the constructor must be capitalized
    Constructor() {
        this.PrimaryActorTick.bCanEverTick = true;
        tickCount = 0;
    }
}
```

- Some UEs can be called in the constructor, such as `CreateDefaultSubobject`, which must be called in the constructor.
- If a class defines a constructor, the initialization of the member variable will be taken over by TypeScript, then the value you set under the UE editor will be invalid.
- If the constructor is not defined, support to manually set member variables in the UE editor.
- Constructor is a constructor called by the UE, only as the initialization of the UE member.
    - Can't do JS initialization work in this function, such as the initialization of variables for no-blueprint labels
    - You cannot apply for JS resources in this function, such as creating a closure function, because these resources will fail after overloading the virtual machine, however the constructor will not re-execute
- Currently, it is not supported to modify the properties of the Component in an Actor, because `SpawnActor` has a reset to Component after constructing the object.: [Constructor Settings component attribute is invalid](https://github.com/Tencent/puerts/issues/287)

### Automatic binding mode supported data type

Only the fields and methods supported by the type declared by the automatic binding mode can be identified by the UE

**Type directly mapped**

- void
- number
- string
- bigint
- boolean
- UObject derived class under the UE module
- enumerate
- UStruct
- TArray
- TSet
- TMap
- TSubclassOf (class reference)
- TSoftObjectPtr (soft object reference）
- TSoftClassPtr (soft class reference）

Note: A function return type declares that the `void` is no return value. If a function does not declare the return type, it is equivalent to returning an `any` type, and the automatic semi-butam mode does not support the `any` type.

The following is a few fields and methods:

``` typescript
class TsTestActor extends UE.Actor {
    tickCount: number;

    actor: UE.Actor;

    map: UE.TMap<string, number>;

    arr: UE.TArray<UE.Object>;

    set: UE.TSet<string>;

    Add(a: number, b: number): number {
        return a + b;
    }

    e: UE.ETickingGroup;

    clsOfWidget: UE.TSubclassOf<UE.Widget>;

    softObject: UE.TSoftObjectPtr<UE.Actor>;

    softClass: UE.TSoftClassPtr<UE.Actor>;
}
```

**Type annotation**

Since Unreal has more fine-tuned types than TypeScript (i.e. TypeScript's `number` represent's the same logical ideas as `byte`, `int`, `float`, and `double` that would be in UE), there needs to be supplemental annotations so Puerts can translate the types appropriately to C++. Here are some examples:

``` typescript
class TsTestActor extends UE.Actor {
    //@cpp:text
    Foo(): string {
        return "hello";
    }

    Bar(p1:number/*@cpp:int*/): void {
    }

    //@cpp:name
    Field: string;
}
```

- `Foo` return value is `FText`
- `Bar`'s parameters are `int`
- `Field` is of type `FName`
- Currently supported type annotations are:
    - `text`
    - `name`
    - `int`
    - `byte`

### Other annotations

In addition to type annotations, Puerts also supports other annotations

- `@no-blueprint` indicates that a method or field is not available for UE blueprints to use

``` typescript
class TsTestActor extends UE.Actor {
    //@no-blueprint
    TsOnlyMethod():void {

    }

    //@no-blueprint
    TsOnlyField: number;
}
```

### `rpc`

You can set the RPC property of the method and fields with decorator.

Note: TypeScript decorators are not enabled by default; you need to set the `experimentalDecorators` property to `true` in `tsconfig.json`

- `rpc.flags` is used for setting flags for fields and methods
- `rpc.condition` is used to set the replication condition for fields

``` typescript
class TsTestActor extends UE.Actor {
    @rpc.flags(rpc.PropertyFlags.CPF_Net | rpc.PropertyFlags.CPF_RepNotify)
    @rpc.condition(rpc.ELifetimeCondition.COND_InitialOrOwner)
    dint: number;

    @rpc.flags(rpc.FunctionFlags.FUNC_Net | rpc.FunctionFlags.FUNC_NetClient)
    Fire(): void {

    }

    @rpc.flags(rpc.FunctionFlags.FUNC_Net | rpc.FunctionFlags.FUNC_NetServer | rpc.FunctionFlags.FUNC_NetReliable)
    FireServer(): void {

    }

    // If the field sets CPF_RepNotify, you need to add `OnRep_fieldname()` method.
    OnRep_dint(): void {

    }
}
```

## Virtual machine switching

Puerts supports both `V8` and `quickjs` two virtual machines, and `V8` currently has two versions.

- For UE 4.24 and below, the Android platform uses `V8` version `7.4.288`, and other platforms version `7.7.299`
- For UE 4.25 and above, each platform can use `V8` version `8.4.371.19`
- For the size and demanding scenes, `quickjs` can be selected (Incanta here, I believe the translation here is meaning "if you want to reduce package size and need scalable performance" rather than "demanding")

The first `V8` version provided by default.

If you want to use `V8` version `8.4.371.19`, navigate to [the V8 GitHub Actions](https://github.com/Tencent/puerts/actions/workflows/build_v8.yml) and download the latest `build V8` artifact. Extract the contents to `Plugins/Puerts/ThirdParty` (or appropriate location). Then in the [JsEnv.Build.cs](../../../unreal/Puerts/Source/JsEnv/JsEnv.Build.cs) file, set `UseNewV8` to `true`.

If you want to use `quickjs`, navigate to [the quickjs GitHub Actions](https://github.com/Tencent/puerts/actions/workflows/build_quickjs.yml), download compiled `quickjs`, extract to `Plugins/Puerts/ThirdParty` (or appropriate location), and set `UseQuickJs` to `true` in the [JsEnv.Build.cs](../../../unreal/Puerts/Source/JsEnv/JsEnv.Build.cs) file.
