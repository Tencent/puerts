# Getting Started
Now that puerts is installed and your TypeScript development environment has been setup, its time to get started!

## Table Of Contents
- [Manually Starting A JavaScript Virtual Machine](#starting-a-new-javascript-virtual-machine-more-info)
- [User Manual](#user-manual)

## Starting A New JavaScript Virtual Machine ([More Info](./start_a_virtual_machine.md))

Starting your own virtual machine is essential for executing traditional JavaScript code within puerts.

Example use cases include:
- Executing a one-time script (e.g Printing 'Hello World!')
- Starting an entry point for a complex event loop (Similar to a `main` function)

### Usage
To start a new JavaScript virtual environment, a suitable entry point should be identified.

#### Example 1 - One-Time Script
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

#### Example 2 - Example Event Loop Entry Point
##### C++
``` c++
#pragma once

#include "CoreMinimal.h"
#include "Engine/GameInstance.h"
#include "JsEnv.h"
#include "DemoGameInstance.generated.h"

UCLASS()
class UDemoGameInstance : public UGameInstance
{
    GENERATED_BODY()

public:
    virtual void OnStart() override {
        Super::OnStart();
        JsEnv = MakeShared<puerts::FJsEnv>();

        JsEnv->Start("Entry.js", 
        {
            TPair<FString, UObject*>("GameInstance", this)
        });
    }

    virtual void Shutdown() override {
        Super::Shutdown();
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

console.warn("JavaScript Entry Point Started!");
//...
```

**Note: If multiple virtual machines are started, these virtual machines are isolated from each other and do not share the same memory scope. (See [JavaScript Environment](./start_a_virtual_machine.md/#javascript-environment))**

## User Manual
Now that things are all setup and fully functional, its time to [familiarise yourself with everything else puerts has to offer.](./manual.md)