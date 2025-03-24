# Puerts - Unreal Engine User Manual

Puerts has two main modes, both of which can coexist in isolation.

[Automatic binding mode](#automatic-binding-mode-more-info)

[Manually starting a JavasScript virtual machine](#starting-a-new-javascript-virtual-machine-more-info)

## Automatic Binding Mode ([More Info](./automatic_binding_mode.md))

Puerts allows users to define and extend Unreal Engine classes inside of TypeScript.

Through a self-starting virtual machine, launched by `PuertsModule`, automatic binding mode supports features such as:
- Automatic blueprint generation
- Incremental code compilation
- Hot-reload

### Setup
To get started, execute the following NodeJS command inside of the puerts plugin directory. (`YourProject/Plugins/Puerts`)

This will install all relevant dependencies and update any configuration files required for automatic binding to function.

``` shell
node enable_puerts_module.js
```

### Usage
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

**Note: The file name, class name and default export all need to match for it to be registered with Unreal Engine. (See [Format](./automatic_binding_mode.md/#format))**

## Starting a new JavaScript virtual machine ([More Info](./start_a_virtual_machine.md))

Starting your own virtual machine is essential for executing traditional JavaScript code within puerts.

Example use cases include:
- Executing a one-time script (e.g Printing 'Hello World!')
- Starting an entry point for a complex event loop (Similar to a `main` function)

### Setup (Optional)
Puerts is designed to be used with TypeScript however the virtual environment still executes traditional JavaScript files. As such, setting up a working TypeScript environment and then compiling any scripts into JavaScript is highly recommended.

1. Install Node.JS

[![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/en/download)

2. Install TypeScript inside of your project using npm

`npm install typescript`

3. Create a tsconfig.json in your project directory

``` javascript
// Myproject/tsconfig.json

{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "experimentalDecorators": true,
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

4. Create a `TypeScript` folder inside of your project directory to store script files (`MyProject/TypeScript`)

**Note: Compile TypeScript files into usable JavaScript by executing `npx tsc`**

### Usage
To start a new JavaScript virtual environment, a suitable entry point should be identified.

#### Example 1 - One-Time Script
##### C++
``` c++
#include "JsEnv.h"

UCLASS()
class PUERTS_UNREAL_DEMO_API APlayerCharacter : public ACharacter
{
public:
    virtual void BeginPlay() override {
        auto JsEnv = MakeShared<puerts::FJsEnv>();

        JsEnv->Start("PrintHelloWorld.js");
    }
};
```
##### TypeScript
``` typescript
// MyProject/TypeScript/PrintHelloWorld.ts

console.warn("Hello World!");
```

#### Example 2 - Example Event Loop Entry Point
##### C++
``` c++
#include "JsEnv.h"

UCLASS()
class PUERTS_UNREAL_DEMO_API UDemoGameInstance : public UGameInstance
{
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
// MyProject/TypeScript/Entry.ts

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