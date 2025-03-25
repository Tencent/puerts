# Automatic Binding Mode

Puerts allows users to define and extend Unreal Engine classes inside of TypeScript.

Through a self-starting virtual machine, launched by `PuertsModule`, automatic binding mode supports special features such as:
- Automatic blueprint binding
- Incremental code compilation
- Hot-reload

## Table Of Contents
- [Setup](#setup)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Starting A New Virtual Machine](#starting-a-new-virtual-machine)

## Setup
To get started, execute the following NodeJS command inside of the puerts plugin directory. (`YourProject/Plugins/Puerts`)

This will install all relevant dependencies and update any configuration files required for automatic binding to function.

``` shell
node enable_puerts_module.js
```

## Usage
Create a new file in `YourProject/TypeScript` and define a new class that extends your desired class (e.g ACharacter, AActor, e.t.c)

Supported features are as follows:
- Constructor definition
- Overriding blueprint events and functions
- Input axis mapping
- Action events (e.g BeginPlay, Tick)
- RPC functions (Requires `experimentalDecorators`)

##### TypeScript
``` typescript
// YourProject/TypeScript/TS_Player

import * as UE from 'ue'

class TS_Player extends UE.Character {
    Constructor() {
        //...
    }

    ReceiveBeginPlay(): void {
        //...
    }
    ReceiveTick(InDeltaSeconds: number): void {
        //...
    }
    //...
}

export default TS_Player;
```

Now it should be available inside of Unreal Engine!

![select_character.png](../..//pic/select_character.png)

**Note: The file name, class name and default export all need to match for it to be registered with Unreal Engine. (See [Format](#format))**

## API Reference

### Table Of Contents
- [Format](#format)
- [Constructor](#constructor)
- [Data Types](#data-types)
- [Annotations](#annotations)
- [Decorators](#decorators)

### Format
For a TypeScript class to be recognized by Unreal Engine it must meet the following requirements:

- The class extends a U.E class (e.g UE.Character, UE.Actor, e.t.c)
- The file name, class name and default export must all match (e.g TS_Player)
- The file name must have no suffix (e.g remove `.ts`)

### Constructor
When defining a class inside of TypeScript, it is possible to define the constructor for the new U.E object.

Unlike the standard TypeScript `constructor`, automatic binding mode overrides the blueprint Construction event inside of Unreal Engine.

``` typescript
import * as UE from 'ue'

class MyTestActor extends UE.Actor {
    Mesh: UE.StaticMeshComponent;
    TickEnabled: boolean = true;

    Constructor() {
        this.PrimaryActorTick.bCanEverTick = TickEnabled;

        this.Mesh = this.CreateDefaultSubObject<UE.StaticMeshComponent>("Mesh");
        this.SetRootComponent(this.Mesh);
        //...
    }
}

export default MyTestActor;
```

#### Notes
- Some inherited U.E functions, such as `CreateDefaultSubObject` must be called in the constructor.
- If a TypeScript class overrides the Constructor, initialization of any U.E supported member variables will be taken over by TypeScript. Changing them inside of the editor will not take effect.
- Initialization of variables not recognized by U.E is not supported within the overrided Constructor. This includes variables annotated with `@no-blueprint`. ([Supported Types](#data-types))
- You cannot reserve new JS resources, such as creating a lambda closure, within the Constructor. It will overload the virtual machine and cause unexpected resource issues.

### Data Types
The list of data types recognized by Unreal Engine are as follows:

| Type |
| :---: |
| `void` |
| `number` |
| `string` |
| `bigint` |
| `boolean` |
| `Enumerations` |
| `Any UObject within the UE module. (e.g UE.Actor)` |
| `Any UStruct within the UE module. (e.g UE.Vector)` |
| `TArray` |
| `TSet` |
| `TMap` |
| `TSubclassOf (Class reference)` |
| `TSoftObjectPtr (Soft object reference）` |
| `TSoftClassPtr (Soft class reference）` |

**Note: All functions must return one of the above types. If a function does not declare a return type, it is equivalent to returning `any` which is not supported.**

### Annotations
Data annotations help to fine-tune the translation between TypeScript and C++. 

Since Unreal Engine has more descriptive types compared to TypeScript (i.e. `number` represents the same logical ideas as `byte`, `int`, `float`, and `double`), is it necessary that Puerts can appropriately translate the correct types into C++.

``` typescript
import * as UE from 'ue'

class TsTestActor extends UE.Actor {
    //@cpp:text
    ReturnFText(): string {
        return "hello";
    }

    IntegerArgument(p1:number/*@cpp:int*/): void {
        //...
    }

    //@no-blueprint
    TsOnlyMethod():void {
        //...
    }

    //@cpp:name
    FieldOfTypeFName: string;

    //@no-blueprint
    TsOnlyVariable: number;
}

export default MyTestActor;
```

| Annotation | Description |
| :---: | --- |
| `@cpp:text` | Equivalent to `FText` |
| `@cpp:name` | Equivalent to `FName` |
| `@cpp:int` | Equivalent to `int` |
| `@cpp:byte` | Equivalent to `byte` |
| `@no-blueprint` | Indicates that a method or field is not accessible in U.E (TypeScript only) |

### Decorators
Decorators allow TypeScript to define certain pre-processor definitions much like C++.

Use cases for this include:
- Specifying UFUNCTION parameters (e.g BlueprintCallable)
- Defining RPC functions (e.g Server, Client, NetMulticast)
- Specifying replication conditions for member variables (e.g SimulatedOnly, AutonomousOnly)

#### Setup
To enable TypeScript decorators:

1. Locate or create 'tsconfig.json' in your Unreal Engine projects directory. (`YourProject/tsconfig.json`)
2. Set `experimentalDecorators` to `true`

##### Example tsconfig.json
``` javascript
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "experimentalDecorators": true, // Update 'false' -> 'true'
    "jsx": "react",
    "sourceMap": true,
    "typeRoots": [
      "Typing",
      "./node_modules/@types"
    ],
    "outDir": "Content/JavaScript"
  },
  "include": [
    "TypeScript/**/*",
  ]
}
```

#### Function Flags
``` typescript
import * as UE from 'ue'

class MyTestActor extends UE.Actor {
    @UE.set_flags(UE.FunctionFlags.FUNC_BlueprintCallable) // UFUNCTION(BlueprintCallable)
    Add(InA: number, InB: number): number {
        return InA + InB;
    }
}

export default MyTestActor;
```

| Function Flags | Description |
| :---: | --- |
| `FUNC_Final` | Function is final (prebindable, non-overridable function) |
| `FUNC_RequiredAPI` | Indicates this function is DLL exported/imported |
| `FUNC_BlueprintAuthorityOnly` | Function will only run if the object has network authority |
| `FUNC_BlueprintCosmetic` | Function is cosmetic in nature and should not be invoked on dedicated servers |
| `FUNC_Net` | Function is network-replicated |
| `FUNC_NetReliable` | Function should be sent reliably on the network |
| `FUNC_NetRequest` | Function is sent to a net service |
| `FUNC_Exec` | Executable from command line |
| `FUNC_Native` | Native function |
| `FUNC_Event` | Event function |
| `FUNC_NetResponse` | Function response from a net service |
| `FUNC_Static` | Static function |
| `FUNC_NetMulticast` | Function is networked multicasted from the server to all clients (if applicable) |
| `FUNC_UbergraphFunction` | Function is used as the merge 'ubergraph' for a blueprint, only assigned when using the persistent 'ubergraph' frame |
| `FUNC_MulticastDelegate` | Function is a multi-cast delegate signature (also requires FUNC_Delegate to be set!) |
| `FUNC_Public` | Function is accessible in all classes (if overridden, parameters must remain unchanged) |
| `FUNC_Private` | Function is accessible only in the class it is defined in (cannot be overridden, but function name may be reused in subclasses.  IOW: if overridden, parameters don't need to match, and Super.Func() cannot be accessed| since it's private.) |
| `FUNC_Protected` | Function is accessible only in the class it is defined in and subclasses (if overridden, parameters much remain unchanged) |
| `FUNC_Delegate`	| Function is delegate signature (either single-cast or multi-cast, depending on whether FUNC_MulticastDelegate is set.) |
| `FUNC_NetServer` | Function is executed on server (if applicable) |
| `FUNC_HasOutParms` | Function has out (pass by reference) parameters |
| `FUNC_HasDefaults` | Function has structs that contain defaults |
| `FUNC_NetClient` | Function is executed on clients |
| `FUNC_DLLImport` | Function is imported from a DLL |
| `FUNC_BlueprintCallable` | Function can be called from blueprint code |
| `FUNC_BlueprintEvent` | Function can be overridden/implemented from a blueprint |
| `FUNC_BlueprintPure` | Function can be called from blueprint code, and is also pure (produces no side effects). If you set this, you should set FUNC_BlueprintCallable as well |
| `FUNC_EditorOnly` | Function can only be called from an editor script |
| `FUNC_Const` | Function can be called from blueprint code, and only reads state (never writes state) |
| `FUNC_NetValidate` | Function must supply a _Validate implementation |

#### RPC
``` typescript
import * as UE from 'ue'

class MyTestActor extends UE.Actor {
    @UE.rpc.flags(UE.rpc.PropertyFlags.CPF_Net | UE.rpc.PropertyFlags.CPF_RepNotify)
    @UE.rpc.condition(UE.rpc.ELifetimeCondition.COND_AutonomousOnly)
    ReplicatedInt: number;

    // If the field sets CPF_RepNotify, you need to add `OnRep_fieldname()` method.
    OnRep_ReplicatedInt(): void {
        //...
    }

    @UE.rpc.flags(UE.rpc.FunctionFlags.FUNC_Net | UE.rpc.FunctionFlags.FUNC_NetClient)
    Client_Test(): void {
        //...
    }

    @UE.rpc.flags(UE.rpc.FunctionFlags.FUNC_Net | UE.rpc.FunctionFlags.FUNC_NetServer | UE.rpc.FunctionFlags.FUNC_NetReliable)
    Server_Test(): void {
        //...
    }
}

export default MyTestActor;
```

| Function Flags | Description |
| :---: | --- |
| `FUNC_Net` | Function is network-replicated |
| `FUNC_NetReliable`  | Function should be sent reliably on the network |
| `FUNC_NetMulticast` | Function is networked multicasted from the server to all clients (if applicable) |
| `FUNC_NetServer`	| Function is executed on server (if applicable) |
| `FUNC_NetClient`	| Function is executed on clients | 

| Property Flags | Description |
| :---: | --- |
| `CPF_Net` | Property is relevant to network replication |
| `CPF_RepNotify` | Notify actors when a property is replicated |

| Replication Conditions | Description |
| :---: | --- |
| `COND_InitialOnly` | This property will only attempt to send on the initial bunch |
| `COND_OwnerOnly` | This property will only send to the actor's owner |
| `COND_SkipOwner` | This property send to every connection EXCEPT the owner |
| `COND_SimulatedOnly` | This property will only send to simulated actors |
| `COND_AutonomousOnly` | This property will only send to autonomous actors |
| `COND_SimulatedOrPhysics` | This property will send to simulated OR bRepPhysics actors |
| `COND_InitialOrOwner` | This property will send on the initial packet, or to the actors owner |
| `COND_Custom` | This property has no particular condition, but wants the ability to toggle on/off via SetCustomIsActiveOverride |
| `COND_ReplayOrOwner` | This property will only send to the replay connection, or to the actors owner |
| `COND_ReplayOnly` | This property will only send to the replay connection |
| `COND_SimulatedOnlyNoReplay` | This property will send to actors only, but not to replay connections |
| `COND_SimulatedOrPhysicsNoReplay` | This property will send to simulated Or bRepPhysics actors, but not to replay connections |
| `COND_SkipReplay` | This property will not send to the replay connection |
| `COND_Never` | This property will never be replicated |

## Starting A New Virtual Machine
Now that automatic binding mode has been set up, it's important to know how to [start your own JavaScript virtual machine](./start_a_virtual_machine.md).