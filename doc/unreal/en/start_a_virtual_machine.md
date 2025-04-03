# Starting A New JavaScript Virtual Machine

Starting your own virtual machine is essential for executing traditional JavaScript code within puerts.

Example use cases include:
- Executing a one-time script (e.g Printing 'Hello World!')
- Starting an entry point for a complex event loop (Similar to a `main` function in C)

## Table Of Contents
- [Usage](#usage)
- [API Reference](#api-reference)
- [Automatic Binding Mode](#automatic-binding-mode)

## Usage
To start a new JavaScript virtual environment, a suitable entry point should be identified.

### Example 1 - One-Time Script
##### C++
``` c++
#include "JsEnv.h"

UCLASS()
class APlayerCharacter : public ACharacter
{
    GENERATED_BODY()
    
public:
    virtual void BeginPlay() override {
        auto JsEnv = MakeShared<puerts::FJsEnv>();

        JsEnv->Start("PrintHelloWorld.js");
    }
};
```
##### TypeScript
``` typescript
// YourProject/TypeScript/PrintHelloWorld.ts

console.warn("Hello World!");
```

### Example 2 - Example Event Loop Entry Point
##### C++
``` c++
#include "JsEnv.h"

UCLASS()
class UDemoGameInstance : public UGameInstance
{
    GENERATED_BODY()

public:
    virtual void OnStart() override {
        JsEnv = MakeShared<puerts::FJsEnv>();

        JsEnv->Start("Entry.js", 
        {
            TPair<FString, UObject*>("GameInstance", this)
        });
    }

    virtual void Shutdown() override {
        JsEnv.Reset();
    }

protected:
    TSharedPtr<puerts::FJsEnv> JsEnv;
};
```
##### TypeScript
``` typescript
// YourProject/TypeScript/Entry.ts

import * as UE from 'ue'
import { argv } from "puerts";

const GameInstance = argv.getByName("GameInstance") as UE.GameInstance;
const World = GameInstance?.GetWorld();
const LocalPlayerController = UE.GameplayStatics.GetPlayerController(World, 0);

LocalPlayerController?.OnEndPlay.Add(() => {
    console.warn("Called at the end of play loop...")
});

console.warn("JavaScript Entry Point Started!");
//...
```

**Note: If multiple virtual machines are started, these virtual machines are isolated from each other and do not share the same memory scope.**

## API Reference
### Table Of Contents
- [JavaScript Environment](#javascript-environment)
- [Debugging](#debugging-more-info)

### JavaScript Environment
When starting a new JavaScript virtual machine, an instance of FJsEnv is the main object responsible for looking after the whole environment (including memory).

It contains three noteworthy functions:
| Name | Arguments | Return | Description |
| :---: | :---: | :---: | --- |
| `Start` | `FString`, `TArray<TPair<FString, UObject*>` | `void` | Starts a new JavaScript virtual machine and executes the specified module / script, passing through any specified parameters into 'argv' |
| `WaitDebugger` | `double` | `void` | Halts the main thread to wait for a debugger attachment. Times out after some specified milliseconds |
| `CurrentStackTrace` | `void` | `FString` | Returns the current stack trace as a string |

When passing in parameters to the FJsEnv, there are a couple of things to note:
* Parameters must be instances of UObject (or a derivative)
* It works like a map. Specify the name of the parameter and assign it a value

Parameters can then be accessed from ***anywhere*** inside of the JavaScript environment through `argv`. (Including imported modules)
##### C++
``` c++
JsEnv->Start("ArgvExample.js", 
{
    TPair<FString, UObject*>("World", GetWorld()),
    //...
});
```
##### TypeScript
``` typescript
// YourProject/TypeScript/ArgvExample.ts

import * as UE from 'ue'
import { argv } from "puerts";

const World = argv.getByName("World") as UE.World;

if (World)
    console.warn("World passed in as a parameter!");
```

### Debugging ([More Info](./vscode_debug.md))
Upon creating an instance of FJSEnv, there are a couple of extra parameters we can specify to start the virtual machine in debug mode.

##### C++
``` c++
auto JsEnv = MakeShared<puerts::FJsEnv>(
  std::make_unique<puerts::DefaultJSModuleLoader>(TEXT("JavaScript")), // Specifies the default script location (Default: "Content/JavaScript")
  std::make_shared<puerts::FDefaultLogger>(), // A logger object to catch console.log
  8080 // The port to start the debugger on (i.e. Attach to this with VSCode)
);

// Optionally wait for the debugger to attach
JsEnv->WaitDebugger();

// Start the JavaScript virtual environment
JsEnv->Start(/*...*/);
```

**Note: If you do not wait for the debugger, breakpoints will be skipped prior to attachment.**

## Automatic Binding Mode
Now that you know how to start your own JavaScript virtual machine, it's important to know how to [define and extend Unreal Engine classes inside of TypeScript](./automatic_binding_mode.md).