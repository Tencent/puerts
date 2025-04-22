# Engine (or pure C++) calling TypeScript
Useful when Unreal Engine needs to execute certain functionality inside of TypeScript.

## Table Of Contents
- [Dynamic Delegates](#dynamic_delegate)
- [Defining Delegates From TypeScript](#defining-delegates-from-typescript)
- [Binding To std::function](#binding-to-stdfunction)

### Dynamic Delegates
TypeScript logic can be executed from within UObjects by binding to DYNAMIC_DELEGATE and DYNAMIC_MULTICAST_DELEGATE.

Example use-cases include:
* Exporting TypeScript functions to C++.
* UI actions (e.g OnPressed) and network messages that bind to TypeScript functionality.

##### C++
~~~c++
DECLARE_DYNAMIC_DELEGATE(FBasicNotify);
DECLARE_DYNAMIC_DELEGATE_OneParam(FNotifyWithRefString, FString&, InStringRef);
DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam(FString, FNotifyWithStringRet, FString, InString);

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FMulticastNotifyWithInt, int32, InInt);

UCLASS()
class AMyActor : public AActor
{
	GENERATED_BODY()

protected:
    virtual void BeginPlay() override {
        // DECLARE_DYNAMIC_DELEGATE
        BasicNotify.ExecuteIfBound();

        // DECLARE_DYNAMIC_DELEGATE_OneParam
        if (NotifyWithRefString.IsBound())
        {
            FString StringReference = "Input String";
            NotifyWithRefString.Execute(StringReference);
            UE_LOG(LogTemp, Warning, TEXT("StringReference new value: %s"), *StringReference);
        }

        // DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam
        if (NotifyWithStringRet.IsBound())
        {
            FString ReturnedString = NotifyWithStringRet.Execute("Some string");
            UE_LOG(LogTemp, Warning, TEXT("ReturnedString: %s"), *ReturnedString); // "Some string" + " with some extra characters"
        }

        // DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam
        MulticastNotifyWithInt.Broadcast(1337);
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


    UPROPERTY()
    class UButton* ExampleButtonWidget;
};
~~~

**Note: `UPROPERTY()` exposes the delegate variable to puerts**

##### TypeScript
~~~typescript
// DECLARE_DYNAMIC_DELEGATE

function OnNotifyBasic(): void {
   console.warn("BasicNotify callback executed");
}

Actor.BasicNotify.Bind(OnNotifyBasic);
~~~

~~~typescript
// DECLARE_DYNAMIC_DELEGATE_OneParam

import {$unref, $set} from 'puerts';

Actor.NotifyWithRefString.Bind((InStringRef) => {
    console.warn("NotifyWithRefString", $unref(InStringRef)); // Print the value

    $set(InStringRef, "Some new string!"); // Update the value by reference
});
~~~

~~~typescript
// DECLARE_DYNAMIC_DELEGATE_RetVal_OneParam

Actor.NotifyWithStringRet.Bind((InString) => {
    return InString + " with some extra characters";
});
~~~

~~~typescript
// DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam

function OnMulticast(InInt: number): void {
    console.warn("Multicast Callback 1: ", InInt);
}

Actor.MulticastNotifyWithInt.Add(OnMulticast);
Actor.MulticastNotifyWithInt.Add((InInt: number) => {
    console.warn("Multicast Callback 2:", InInt);
});
~~~

~~~typescript
// Binding to button "OnPressed"

function OnButtonPressed(): void {
    console.warn("Button Pressed!");
}

Actor.ExampleButtonWidget.OnPressed.Add(OnButtonPressed);
~~~

### Defining Delegates From TypeScript
Instead of directly binding to DYNAMIC_DELEGATE inside of a UObject, new delegates can be constructed from within TypeScript.

Example use-cases include:
* Passing delegates as parameters to C++
* Manual control over delegate handles and their lifetime

##### C++
~~~c++
DECLARE_DYNAMIC_DELEGATE(FBasicNotify);

void UMyObject::PassJsFunctionAsDelegate(FBasicNotify Callback)
{
    auto ReturnValue = Callback.Execute("Some Example String...");
    UE_LOG(LogTemp, Warning, TEXT("%d"), ReturnValue);
}
~~~

##### TypeScript
~~~typescript
// Delegate handle owned by UObject

import {toDelegate} from 'puerts';

function GetStringLength(InString:string) : number {
    return InString.length;
}

const NewDelegate = toDelegate(MyUObj, GetStringLength); // toDelegate(owOwnerner: UE.Object, Func:Function)
MyUObj.PassJsFunctionAsDelegate(NewDelegate);
~~~

~~~typescript
// Delegate handle with no owner (Manual Cleanup)

import {toManualReleaseDelegate, releaseManualReleaseDelegate} from 'puerts';

function GetStringLength(InString:string) : number {
    return InString.length;
}

const NewManualReleaseDelegate = toManualReleaseDelegate(GetStringLength); // toManualReleaseDelegate(Func:Function)
MyUObj.PassJsFunctionAsDelegate(NewManualReleaseDelegate);

releaseManualReleaseDelegate(GetStringLength); // Release to prevent memory leak
~~~
~~~typescript
// Delegate function is a UFunction of UObject

import {toDelegate} from 'puerts';

const NewDelegate = toDelegate(MyUObj, "SomeUFunction"); // toDelegate(Owner: UE.Object, UFuncName: string)
MyUObj.PassJsFunctionAsDelegate(toDelegate(NewDelegate));
~~~

### Using JsObject Types
Aside from delegates, JsObjects can be used within C++ to execute functions, access variables, e.t.c
##### C++
``` c++
// ExampleClass.h
#include "JsObject.h"

class ExampleClass
{
    //...
public:
    static void CalculateAge(FJsObject InPerson)
    {
        int BirthYear = InPerson.Get<int>("BirthYear");
        InPerson.Set<int>("Age", 2025 - BirthYear);
    }

    static void ExecuteJsFunctionObject(FJsObject InJsFunctionObject)
    {
        InJsFunctionObject.Func<void>();
    }
};
```
##### TypeScript
``` typescript
import * as Cpp from 'cpp'

let John = {BirthYear:1999};
Cpp.ExampleClass.CalculateAge(John);
console.warn("John is aged " + John.Age);

Cpp.ExampleClass.ExecuteJsFunctionObject(() => {
    console.warn("JavaScript Function Object Executed!");
});
```

### Binding To std::function
Inside of a standard C++ environment, `std::function` is the preferred method for passing around function pointers. Puerts supports this as well.

##### C++
~~~c++
void MyClass::PassJsFunctionWithStd(std::function<int(int, int)> InFunction)
{
    int ReturnValue = InFunction(88, 99);
    UE_LOG(LogTemp, Warning, TEXT("%i"), ReturnValue);
}
~~~

##### TypeScript
~~~typescript
MyObj.PassJsFunctionWithStd((A: number, B: number) => {
    const Sum = A + B;
    console.warn(A + '+' + B + "= " + Sum);

    return Sum;
})
~~~