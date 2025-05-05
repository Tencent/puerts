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
    - [Format](#format)
    - [Constructor](#constructor)
    - [Data Types](#data-types)
    - [Annotations](#annotations)
    - [Decorators](#decorators)
        - [Enable Decorators](#enable-decorators)
        - [Class Flags](#class-flags)
        - [Function Flags](#function-flags)
        - [Property Flags](#property-flags)
        - [RPC Flags](#rpc)
- [Starting A New Virtual Machine](#starting-a-new-virtual-machine)

## Setup
To get started, with the editor closed, execute the following NodeJS command inside of the puerts plugin directory. (`YourProject/Plugins/Puerts`)

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
// YourProject/TypeScript/TS_Player.ts

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

Now regenerate the deceleration files and the class should be available inside of Unreal Engine!

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

### Constructor
When defining a class inside of TypeScript, it is possible to define the constructor for the new U.E object.

Unlike the standard TypeScript `constructor`, automatic binding mode overrides the blueprint Construction event inside of Unreal Engine.

``` typescript
// YourProject/TypeScript/MyTestActor.ts

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
// YourProject/TypeScript/MyTestActor.ts

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

## Table Of Contents
- [Enable Decorators](#enable-decorators)
- [Class Flags](#class-flags)
- [Function Flags](#function-flags)
- [Property Flags](#property-flags)
- [RPC Flags](#rpc)

#### Enable Decorators
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

#### Class Flags
``` typescript
// YourProject/TypeScript/MyTestActor.ts

import * as UE from 'ue'

@UE.uclass.umeta(UE.uclass.DisplayName="CustomDisplayName...")
@UE.uclass.uclass(UE.uclass.Blueprintable)
class MyTestActor extends UE.Actor {
    // ...
}

export default MyTestActor;
```

| Class Specifiers           | Description                                                                 |
| :-----------------------: | --------------------------------------------------------------------------- |
| `BlueprintType`           | Exposes this class as a type that can be used for variables in blueprints.  |
| `Blueprintable`           | Exposes this class as an acceptable base class for creating blueprints.     |
| `NotBlueprintable`        | Specifies that this class is *NOT* an acceptable base class for creating blueprints. |
| `Const`                   | All properties and functions in this class are const and should be exported as const. |
| `Abstract`                | Class is abstract and can't be instantiated directly.                       |
| `deprecated`              | This class is deprecated and objects of this class won't be saved when serializing. |
| `ComponentWrapperClass`   | Indicates that this class is a wrapper class for a component with little intrinsic functionality. |
| `hideCategories`          | Hides the specified categories in a property viewer.                        |
| `hideFunctions`           | Hides the specified function in a property viewer.                          |
| `AdvancedClassDisplay`    | All properties of the class are hidden in the main display and shown only in the advanced details section. |
| `ConversionRoot`          | A root convert limits a subclass to only be able to convert to child classes of the first root class going up the hierarchy. |
| `Experimental`            | Marks this class as 'experimental' (an unsupported prototype).             |
| `EarlyAccessPreview`      | Marks this class as an 'early access' preview, a step beyond 'experimental'. |
| `SparseClassDataType`     | Some properties are stored once per class in a sidecar structure and not on instances of the class. |

| Class Metadata                 | Description                                                                 |
| :-----------------------------: | --------------------------------------------------------------------------- |
| `ToolTip`                       | Overrides the automatically generated tooltip from the class comment.        |
| `ShortTooltip`                  | A short tooltip that is used in some contexts where the full tooltip might be overwhelming. |
| `DocumentationPolicy`           | A setting to determine validation of tooltips and comments. Needs to be set to "Strict". |
| `BlueprintSpawnableComponent`   | Used for Actor Component classes. Indicates it can be spawned by a Blueprint. |
| `ChildCanTick`                  | Used for Actor and Component classes. Allows Blueprint-generated classes to override bCanEverTick flag. |
| `ChildCannotTick`               | Used for Actor and Component classes. Prevents Blueprint-generated classes from ticking. |
| `IgnoreCategoryKeywordsInSubclasses` | Makes the first subclass of a class ignore inherited showCategories and hideCategories commands. |
| `DeprecatedNode`                | Used to indicate that the class is deprecated and will show a warning when compiled. |
| `DeprecationMessage`            | Customizes the warning message displayed for deprecated elements.            |
| `DisplayName`                   | The name to display for this class, property, or function instead of auto-generating it. |
| `ScriptName`                    | The name to use when exporting this class, property, or function to a scripting language. |
| `IsBlueprintBase`               | Specifies that this class is an acceptable base class for creating blueprints. |
| `KismetHideOverrides`           | A comma delimited list of blueprint events that cannot be overridden in classes of this type. |
| `ProhibitedInterfaces`          | Specifies interfaces that are not compatible with the class.                |
| `RestrictedToClasses`           | Restricts the graphs the functions in this library can be used in to the classes specified. |
| `ShowWorldContextPin`           | Indicates that the hidden world context pin should be visible in Blueprint graphs. |
| `DontUseGenericSpawnObject`     | Prevents spawning an object of the class using the Generic Create Object node in Blueprint. |
| `ExposedAsyncProxy`             | Exposes a proxy object of this class in Async Task node.                    |
| `BlueprintThreadSafe`           | Marks functions in a Blueprint Function Library as callable on non-game threads in Animation Blueprint. |
| `UsesHierarchy`                 | Indicates the class uses hierarchical data, enabling hierarchical editing features in details panels. |


#### Function Flags
// YourProject/TypeScript/MyTestActor.ts

``` typescript
import * as UE from 'ue'

class MyTestActor extends UE.Actor {   
    @UE.ufunction.umeta(UE.ufunction.ToolTip="Adds two numbers")
    @UE.ufunction.ufunction(UE.ufunction.BlueprintCallable, UE.ufunction.Category="Demo Catergory")
    Add(InA: number, InB: number): number {
        return InA + InB;
    }
}

export default MyTestActor;
```

| Function Flags                 | Description                                                                 |
| :-----------------------------: | --------------------------------------------------------------------------- |
| `BlueprintImplementableEvent`   | This function is designed to be overridden by a blueprint. No body should be provided; autogenerated code will call ProcessEvent. |
| `BlueprintNativeEvent`          | This function is designed to be overridden by a blueprint, but also has a native implementation. Use [FunctionName]_Implementation for the body. |
| `SealedEvent`                   | This function is sealed and cannot be overridden in subclasses. Valid only for events. |
| `Exec`                          | This function is executable from the command line.                         |
| `BlueprintPure`                 | This function fulfills a contract of producing no side effects and implies BlueprintCallable. |
| `BlueprintCallable`             | This function can be called from blueprint code and should be exposed to blueprint editing tools. |
| `BlueprintAuthorityOnly`        | This function will not execute from blueprint code if running on something without network authority. |
| `BlueprintCosmetic`             | This function is cosmetic and will not run on dedicated servers. |
| `CallInEditor`                  | This function can be called in the editor on selected instances via a button in the details panel. |
| `Category`                      | Specifies the category of the function when displayed in blueprint editing tools. |

| Function Metadata                      | Description                                                                 |
| :----------------------------------: | --------------------------------------------------------------------------- |
| `ToolTip`                            | Overrides the automatically generated tooltip from the class comment.      |
| `CompactNodeTitle`                   | For BlueprintCallable functions, indicates that the function should be displayed in compact display mode and the name to use in that mode. |
| `Keywords`                           | For BlueprintCallable functions, provides additional keywords to be associated with the function for search purposes. |

#### Property Flags

``` typescript
// YourProject/TypeScript/MyTestActor.ts

import * as UE from 'ue'

class MyTestActor extends UE.Actor { 
    @UE.uproperty.umeta(UE.uproperty.ToolTip="Test Value")
    @UE.uproperty.uproperty(UE.uproperty.BlueprintReadOnly, UE.uproperty.Category="Demo Catergory")
    SomeVariable: number;
}

export default MyTestActor;
```

| Property Flags                     | Description                                                                 |
| :----------------------------------: | --------------------------------------------------------------------------- |
| `Const`                             | This property is const and should be exported as const.                    |
| `Config`                            | Property should be loaded/saved to ini file as permanent profile.          |
| `GlobalConfig`                      | Same as above but load config from base class, not subclass.               |
| `Localized`                         | Property should be loaded as localizable text. Implies ReadOnly.           |
| `Transient`                         | Property is transient: shouldn't be saved, zero-filled at load time.       |
| `DuplicateTransient`                | Property should always be reset to the default value during any duplication (copy/paste, binary duplication, etc.) |
| `NonPIEDuplicateTransient`          | Property should always be reset to the default value unless it's being duplicated for a PIE session. |
| `Export`                            | Object property can be exported with its owner.                            |
| `NoClear`                           | Hide clear (and browse) button in the editor.                              |
| `EditFixedSize`                     | Indicates that elements of an array can be modified, but its size cannot be changed. |
| `Replicated`                        | Property is relevant to network replication.                               |
| `ReplicatedUsing`                   | Property is relevant to network replication. Notify actors when a property is replicated (usage: ReplicatedUsing=FunctionName). |
| `NotReplicated`                     | Skip replication (only for struct members and parameters in service request functions). |
| `Interp`                            | Interpolatable property for use with matinee. Always user-settable in the editor. |
| `NonTransactional`                  | Property isn't transacted.                                                  |
| `Instanced`                         | Property is a component reference. Implies EditInline and Export.         |
| `BlueprintAssignable`               | MC Delegates only. Property should be exposed for assigning in blueprints. |
| `Category`                          | Specifies the category of the property. Usage: Category=CategoryName.      |
| `SimpleDisplay`                     | Properties appear visible by default in a details panel.                   |
| `AdvancedDisplay`                   | Properties are in the advanced dropdown in a details panel.                |
| `EditAnywhere`                       | Indicates that this property can be edited by property windows in the editor. |
| `EditInstanceOnly`                  | Indicates that this property can be edited by property windows, but only on instances, not on archetypes. |
| `EditDefaultsOnly`                  | Indicates that this property can be edited by property windows, but only on archetypes. |
| `VisibleAnywhere`                   | Indicates that this property is visible in property windows, but cannot be edited at all. |
| `VisibleInstanceOnly`               | Indicates that this property is only visible in property windows for instances, not for archetypes, and cannot be edited. |
| `VisibleDefaultsOnly`               | Indicates that this property is only visible in property windows for archetypes, and cannot be edited. |
| `BlueprintReadOnly`                 | This property can be read by blueprints, but not modified.                 |
| `BlueprintGetter`                   | This property has an accessor to return the value. Implies BlueprintReadOnly if BlueprintSetter or BlueprintReadWrite is not specified. (usage: BlueprintGetter=FunctionName). |
| `BlueprintReadWrite`                | This property can be read or written from a blueprint.                     |
| `BlueprintSetter`                   | This property has an accessor to set the value. Implies BlueprintReadWrite. (usage: BlueprintSetter=FunctionName). |
| `AssetRegistrySearchable`           | The AssetRegistrySearchable keyword indicates that this property and its value will be automatically added to the asset registry for any asset class instances containing this as a member variable. |
| `SaveGame`                          | Property should be serialized for save games. This is only checked for game-specific archives with ArIsSaveGame set. |
| `BlueprintCallable`                 | MC Delegates only. Property should be exposed for calling in blueprint code. |
| `BlueprintAuthorityOnly`            | MC Delegates only. This delegate accepts (only in blueprint) only events with BlueprintAuthorityOnly. |
| `TextExportTransient`               | Property shouldn't be exported to text format (e.g., copy/paste).           |
| `SkipSerialization`                 | Property shouldn't be serialized, can still be exported to text.           |
| `HideSelfPin`                       | If true, the self pin should not be shown or connectable regardless of purity, const, etc. similar to InternalUseParam. |

| Property Metadata                | Description                                                                                                                                                                       |
| :----------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ToolTip`                   | Overrides the automatically generated tooltip from the class comment                                                                                                                     |
| `ShortTooltip`              | A short tooltip that is used in some contexts where the full tooltip might be overwhelming (e.g., parent class picker dialog)                                                            |
| `DocumentationPolicy`       | A setting to determine validation of tooltips and comments. Needs to be set to "Strict"                                                                                                  |
| `AllowAbstract`             | Used for Subclass and SoftClass properties. Indicates whether abstract class types should be shown in the class picker                                                                  |
| `AllowAnyActor`             | Used for ComponentReference properties. Indicates whether other actors that are not in the property outer hierarchy should be shown in the component picker                               |
| `AllowedClasses`            | Used for FSoftObjectPath, ComponentReference, and UClass properties. Comma delimited list indicating the class types of assets to display in asset picker, component picker, or class viewer |
| `AllowPreserveRatio`       | Used for FVector properties. Causes a ratio lock when displaying the property in details panels                                                                                          |
| `AllowPrivateAccess`        | Indicates that a private member marked as BlueprintReadOnly or BlueprintReadWrite should be accessible from blueprints                                                                 |
| `ArrayClamp`                | Used for integer properties. Clamps the valid values in the UI between 0 and the length of the specified array                                                                         |
| `AssetBundles`              | Used for SoftObjectPtr/SoftObjectPath properties. Comma-separated list of Bundle names used inside PrimaryDataAssets to specify bundles this reference is part of                        |
| `BlueprintBaseOnly`         | Used for Subclass and SoftClass properties. Indicates whether only blueprint classes should be shown in the class picker                                                                |
| `BlueprintCompilerGeneratedDefaults` | Property defaults are generated by the Blueprint compiler and will not be copied when CopyPropertiesForUnrelatedObjects is called post-compile                                    |
| `ClampMin`                  | Used for float and integer properties. Specifies the minimum value for the property                                                                                                      |
| `ClampMax`                  | Used for float and integer properties. Specifies the maximum value for the property                                                                                                      |
| `ConfigHierarchyEditable`   | Property is serialized to config and editable anywhere along the config hierarchy                                                                                                        |
| `ContentDir`                | Used by FDirectoryPath properties. Indicates that the path will be picked using the Slate-style directory picker inside the game Content directory                                       |
| `DisallowedClasses`         | Used for FSoftObjectPath, ActorComponentReference, and UClass properties. Comma-delimited list indicating classes not displayed in the asset picker or component picker                  |
| `DisplayAfter`              | Indicates that the property should be displayed immediately after the property named in the metadata                                                                                     |
| `DisplayPriority`           | Specifies the relative order within its category that the property should be displayed in, with lower values sorted first                                                               |
| `DisplayThumbnail`          | Indicates that the property is an asset type and should display the thumbnail of the selected asset                                                                                     |
| `EditCondition`             | Specifies whether editing of this property is disabled                                                                                                                                    |
| `EditFixedOrder`            | Keeps the elements of an array from being reordered by dragging                                                                                                                           |
| `ExactClass`                | Used for FSoftObjectPath properties in conjunction with AllowedClasses. Indicates whether only the exact classes in AllowedClasses are valid                                              |
| `ExposeFunctionCategories`  | Specifies a list of categories whose functions should be exposed when building a function list in the Blueprint Editor                                                                  |
| `ExposeOnSpawn`             | Specifies whether the property should be exposed on a Spawn Actor for the class type                                                                                                     |
| `FilePathFilter`            | Used by FFilePath properties. Specifies the path filter to display in the file picker                                                                                                    |
| `RelativeToGameDir`         | Used by FFilePath properties. Specifies that the FilePicker dialog will output a relative path when setting the property                                                                 |
| `ForceShowEngineContent`    | Used by asset properties. Indicates that the asset pickers should always show engine content                                                                                             |
| `ForceShowPluginContent`    | Used by asset properties. Indicates that the asset pickers should always show plugin content                                                                                             |
| `HideAlphaChannel`          | Used for FColor and FLinearColor properties. Hides the Alpha property when displaying the property widget                                                                               |
| `HideInDetailPanel`         | Indicates that the property should be hidden in the details panel. Currently only used by events                                                                                        |
| `HideViewOptions`           | Used for Subclass and SoftClass properties. Hides the ability to change view options in the class picker                                                                                  |
| `IgnoreForMemberInitializationTest` | Bypasses property initialization tests when the property cannot be safely tested in a deterministic fashion (e.g., random numbers, GUIDs)                                          |
| `InlineEditConditionToggle` | Signifies that the bool property is only displayed inline as an edit condition toggle and should not be shown on its own row                                                            |
| `LongPackageName`           | Used by FDirectoryPath properties. Converts the path to a long package name                                                                                                              |
| `MakeEditWidget`            | Used for Transform/Rotator properties (also works on arrays). Indicates that the property should be exposed in the viewport as a movable widget                                          |
| `MakeStructureDefaultValue` | For properties in a structure, indicates the default value of the property in a blueprint make structure node                                                                            |
| `MetaClass`                 | Used for FSoftClassPath properties. Specifies the parent class used in filtering which classes to display in the class picker                                                           |
| `MustImplement`             | Used for Subclass and SoftClass properties. Indicates the selected class must implement a specific interface                                                                             |
| `Multiple`                  | Used for numeric properties. Specifies that the value must be a multiple of the metadata value                                                                                            |
| `MultiLine`                 | Used for FString and FText properties. Specifies that the edit field should be multi-line, allowing entry of newlines                                                                   |
| `PasswordField`             | Used for FString and FText properties. Specifies that the edit field is a secret field, and entered text will be replaced with dots                                                     |
| `NoElementDuplicate`        | Used for array properties. Indicates that the duplicate icon should not be shown for entries of this array in the property panel                                                         |
| `NoResetToDefault`          | Property won't have a 'reset to default' button when displayed in property windows                                                                                                       |
| `NoSpinbox`                 | Used for integer and float properties. Indicates that the spin box element of the number editing widget should not be displayed                                                           |
| `OnlyPlaceable`             | Used for Subclass properties. Indicates whether only placeable classes should be shown in the class picker                                                                               |
| `RelativePath`              | Used by FDirectoryPath properties. Indicates that the directory dialog will output a relative path when setting the property                                                              |
| `RelativeToGameContentDir`  | Used by FDirectoryPath properties. Indicates that the directory dialog will output a path relative to the game content directory when setting the property                               |
| `ScriptNoExport`            | Flag set on a property or function to prevent it from being exported to a scripting language                                                                                             |
| `ShowOnlyInnerProperties`   | Used by struct properties. Indicates that inner properties will not be shown inside an expandable struct, but promoted up a level                                                         |
| `ShowTreeView`              | Used for Subclass and SoftClass properties. Displays the picker as a tree view instead of a list                                                                                         |
| `SliderExponent`            | Used by numeric properties. Indicates how rapidly the value will grow when moving an unbounded slider                                                                                     |
| `TitleProperty`             | Used by arrays of structs. Indicates a single property inside of the struct that should be used as a title summary when the array entry is collapsed                                    |
| `UIMin`                     | Used for float and integer properties. Specifies the lowest value that the value slider should represent                                                                                 |
| `UIMax`                     | Used for float and integer properties. Specifies the highest value that the value slider should represent                                                                                |
| `Untracked`                 | Used for SoftObjectPtr/SoftObjectPath properties. Specifies that a reference should not be tracked. This reference won't be automatically cooked or saved into the asset registry           |
| `DevelopmentOnly`           | Used for functions that should be compiled in development mode only                                                                                                                     |
| `NeedsLatentFixup`          | Used for latent action manager to fix up a latent action with the VM                                                                                                                     |
| `LatentCallbackTarget`      | Used for latent action manager to track where its re-entry should be                                                                                                                     |
| `GetOptions`                | Causes FString and FName properties to have a limited set of options generated dynamically (e.g., meta=(GetOptions="FuncName"))                                                           |
| `Bitmask`                   | Metadata that identifies an integral property as a bitmask                                                                                                                               |
| `BitmaskEnum`               | Metadata that associates a bitmask property with a bitflag enum                                                                                                                           |

#### RPC
``` typescript
// YourProject/TypeScript/MyTestActor.ts

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