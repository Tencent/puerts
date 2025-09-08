# Engine (or pure C++) calling TypeScript
Useful when Unreal Engine needs to execute certain functionality inside of TypeScript.

## Table Of Contents
- [Dynamic Delegates](#dynamic_delegate)
- [Defining Delegates From TypeScript](#defining-delegates-from-typescript)
- [Using JsObject Types](#using-jsobject-types)
- [Binding To std::function](#binding-to-stdfunction)

### Dynamic Delegates
TypeScript logic can be executed from within UObjects by binding to DYNAMIC_DELEGATE and DYNAMIC_MULTICAST_DELEGATE.

Example use-cases include:
* Exporting TypeScript functions to C++.
* UI actions (e.g OnPressed) and network messages that bind to TypeScript functionality.

##### C++
~~~c++
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "DemoActor.generated.h"

DECLARE_DYNAMIC_DELEGATE(FBasicNotify);
DECLARE_DYNAMIC_DELEGATE_OneParam(FNotifyWithRefString, FString&, InStringRef);
DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam(FString, FNotifyWithStringRet, FString, InString);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FMulticastNotifyWithInt, int32, InInt);

UCLASS()
class ADemoActor : public AActor
{
	GENERATED_BODY()
	
public:	
	virtual void BeginPlay() override {
		// DECLARE_DYNAMIC_DELEGATE
		BasicNotify.ExecuteIfBound();

		// DECLARE_DYNAMIC_DELEGATE_OneParam
		if (NotifyWithRefString.IsBound())
		{
			FString StringReference = "Example String...";
			NotifyWithRefString.Execute(StringReference);
		}

		// DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam
		if (NotifyWithStringRet.IsBound())
		{
			FString ReturnedString = NotifyWithStringRet.Execute("Example string");
			UE_LOG(LogTemp, Warning, TEXT("ReturnedString: %s"), *ReturnedString); // "Example string" + " with some extra characters"
		}

		// DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam
		MulticastNotifyWithInt.Broadcast(1337);
	}

    UFUNCTION()
	static void PassJsFunctionAsDelegate(FBasicNotify Callback)
	{
		Callback.ExecuteIfBound();
	}

public:
	UPROPERTY()
	FBasicNotify BasicNotify;

	UPROPERTY()
	FNotifyWithRefString NotifyWithRefString;

	UPROPERTY()
	FNotifyWithStringRet NotifyWithStringRet;
	
	UPROPERTY()
	FMulticastNotifyWithInt MulticastNotifyWithInt;
};
~~~

**Note: `UPROPERTY()` exposes the delegate variable to puerts**

##### TypeScript
~~~typescript
// DECLARE_DYNAMIC_DELEGATE

function OnNotifyBasic(): void {
    console.warn("BasicNotify Callback Executed.");
}
DemoActor.BasicNotify.Bind(OnNotifyBasic);
~~~

~~~typescript
// DECLARE_DYNAMIC_DELEGATE_OneParam

import {$unref, $set} from 'puerts';

DemoActor.NotifyWithRefString.Bind((InStringRef) => {
    console.warn("NotifyWithRefString: " + $unref(InStringRef)); // Print the value

    $set(InStringRef, "Some new string!"); // Update the value by reference
});
~~~

~~~typescript
// DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam

DemoActor.NotifyWithStringRet.Bind((InString) => {
    return InString + " with some extra characters.";
});
~~~

~~~typescript
// DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam

function OnMulticast(InInt: number): void {
    console.warn("Multicast Callback 1: " + InInt);
}
DemoActor.MulticastNotifyWithInt.Add(OnMulticast);
DemoActor.MulticastNotifyWithInt.Add((InInt: number) => {
    console.warn("Multicast Callback 2: " + InInt);
});
~~~

### Defining Delegates From TypeScript
Instead of directly binding to DYNAMIC_DELEGATE inside of a UObject, new delegates can be constructed from within TypeScript.

Example use-cases include:
* Passing delegates as parameters to C++
* Manual control over delegate handles and their lifetime

##### TypeScript
~~~typescript
// Delegate handle owned by UObject

import {toDelegate} from 'puerts';

function PrintHelloWorld() : void {
    console.warn("Hello World!");
}

const NewDelegate = toDelegate(DemoActor, PrintHelloWorld); // toDelegate(owOwnerner: UE.Object, Func:Function)
DemoActor.PassJsFunctionAsDelegate(NewDelegate);
~~~

~~~typescript
// Delegate handle with no owner (Manual Cleanup)

import {toManualReleaseDelegate, releaseManualReleaseDelegate} from 'puerts';

function PrintHelloWorld() : void {
    console.warn("Hello World!");
}

const NewManualReleaseDelegate = toManualReleaseDelegate(PrintHelloWorld); // toManualReleaseDelegate(Func:Function)
DemoActor.PassJsFunctionAsDelegate(NewManualReleaseDelegate);

releaseManualReleaseDelegate(PrintHelloWorld); // Release to prevent memory leak
~~~

### Using JsObject Types
Aside from delegates, JsObjects can be used within C++ to execute functions, access variables, e.t.c
##### C++
``` c++
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "JsObject.h"
#include "DemoActor.generated.h"

UCLASS()
class ADemoActor : public AActor
{
	GENERATED_BODY()
	
public:	
	UFUNCTION()
	static void CalculateAge(FJsObject InPerson)
	{
		const int BirthYear = InPerson.Get<int>("BirthYear");
		InPerson.Set<int>("Age", 2025 - BirthYear);
	}

	UFUNCTION()
	static void ExecuteJsFunctionObject(FJsObject InJsFunctionObject)
	{
		UE_LOG(LogTemp, Warning, TEXT("ADemoActor:ExecuteJsFunctionObject() = %i"), InJsFunctionObject.Func<int>());
	}
};
```
##### TypeScript
``` typescript
import * as UE from 'ue'

let John = {BirthYear:1999, Age: -1};
UE.DemoActor.CalculateAge(John);
console.warn("John is aged " + John.Age);

UE.DemoActor.ExecuteJsFunctionObject(() => {
    return 1337;
});
```

### Binding To std::function
Inside of a standard C++ environment, `std::function` is the preferred method for passing around function pointers. Puerts supports this as well.

##### C++
~~~c++
static void PassJsFunctionWithStd(std::function<int(int, int)> InFunction)
{
	int ReturnValue = InFunction(88, 99);
	UE_LOG(LogTemp, Warning, TEXT("ADemoActor:PassJsFunctionWithStd() | 89 + 99 = %i"), ReturnValue);
}
~~~

##### TypeScript
~~~typescript
import * as UE from 'ue'

UE.DemoActor.PassJsFunctionWithStd((InA: number, InB: number) => {
    return InA + InB;
});
~~~