# Template-based static binding

Below is a translated version of the original docs by Incanta Games. The translation is mainly done with Google Translate, but then modified by hand to try to make sense of what Google Translate is missing.

## Overview

This document describes the ordinary C++ class/struct, Or UCLASS, unchecked the properties of UPPROPERTY, UFUNCTION, and calls.

This document also applies to non-UE environments (such as servers, unity, etc.), C++ class/struct access.

Support features:

- Constructor
- Static function
- Member variables
- Member function
- Constructor / static function / member function supports overload
- Support inheritance
- Generate TypeScript declaration
- The UE type is not marked `UPROPERTY`. After the `UFUNCTION` member declares, it will seamlessly appear in the original category.
- Support JS object mapping to C++ `JSObject`, `JSObject` can get/set the properties, call the JS function.
- Support JS function mapping to `std::function`
- Support custom converter

## Important Notes

If you want to use this feature outside of the `JsEnv` module itself, such as another game module, you'll need to do the following:

- Use dynamic library version `V8` libraries, switching methods:
    - To the Puerts official website download and Puerts supporting `V8` library, and unzip it to `Plugins/Puerts/ThirdParty/` (or respective folder)
    - Find the `JsEnv.Build.cs` file and change `UseNewV8` to `true`
- In the module's `*.Build.cs`
    - Add a dependency to the `JsEnv` module
    - Set `bEnableUndefinedIdentifierWarnings` to `false`

## Examples

### Hello World

With a simplest common C++ class as an example

``` cpp
// Calc.h
class Calc
{
public:
    static int32_t Add(int32_t a, int32_t b)
    {
        return a + b;
    }
};
```

We declare as follows

``` cpp
#include "Calc.h"
#include "Binding.hpp"

// A macro defined in Binding.hpp which
// creates a converter (either V8 or Pesapi) for your class
// which helps build the translation layer
UsingCppType(Calc);

struct AutoRegisterForCPP
{
    AutoRegisterForCPP()
    {
        puerts::DefineClass<Calc>()
            .Function("Add", MakeFunction(&Calc::Add)) // There's also `.Method(...)` and `.Property(...)`
            .Register();
    }
};

// Completes the automatic registration with puerts. When this calls
// when the module is loaded, it will call the constructor defined above,
// executing the registration with puerts
AutoRegisterForCPP _AutoRegisterForCPP__;
```

Compile the C++, open the Unreal editor, and generate TypeScript definitions (either with the button or command) to call in TypeScript. Then in TypeScript you can do:

``` typescript
import * as cpp from 'cpp'

let Calc = cpp.Calc;

// static function
console.log(Calc.Add(12, 34));
```

### Static function declaration

The presentation is a static function, `.Function(Name, <function reference>)`. To register a static function, there are several ways to reference:

- The function is not overloaded: `MakeFunction(&Calc::Add)`
- The function is not overloaded, but you want to verify the parameters: `MakeCheckFunction(&Calc::Add)`
- The function is overloaded, but you just want to choose one of them: `SelectFunction(float (*)(float, float), &Calc::Add)`
- The function is overloaded, and you want multiple overloads available:

``` c++
CombineOverloads(
    MakeOverload(void(*)(), &TestClass::Overload),
    MakeOverload(void(*)(int32_t), &TestClass::Overload),
    MakeOverload(void(*)(int32_t, int32_t), &TestClass::Overload),
    MakeOverload(void(*)(std::string, int32_t), &TestClass::Overload)
    )
```

### Member variables

``` c++
class TestClass
{
public:
    int32_t X;
    int32_t Y;
};
```

Statement

``` c++
puerts::DefineClass<TestClass>()
    .Property("X", MakeProperty(&TestClass::X))
    .Property("Y", MakeProperty(&TestClass::Y))
    .Register();
```

### Constructor

``` c++
class TestClass
{
public:
    TestClass();

    TestClass(int32_t InX, int32_t InY);
};
```

Statement

``` c++
puerts::DefineClass<TestClass>()
    .Constructor(CombineConstructors(
        MakeConstructor(TestClass, int32_t, int32_t),
        MakeConstructor(TestClass)
        ))
    .Register();
```

If there is only one constructor, you can simplify to

``` c++
puerts::DefineClass<AdvanceTestClass>()
    .Constructor<int>() // if only one Constructor
    .Register();
```

### Member function

``` c++
class TestClass
{
public:
    int32_t OverloadMethod();

    int32_t OverloadMethod(int32_t a);

    uint32_t OverloadMethod(uint32_t a);

    int64_t OverloadMethod(int64_t a);

    TestClass *GetSelf();
};
```

Statement

``` c++
puerts::DefineClass<TestClass>()
    .Method("OverloadMethod", CombineOverloads(
        MakeOverload(int32_t(TestClass::*)(), &TestClass::OverloadMethod),
        MakeOverload(int32_t(TestClass::*)(int32_t), &TestClass::OverloadMethod),
        MakeOverload(uint32_t(TestClass::*)(uint32_t), &TestClass::OverloadMethod),
        MakeOverload(int64_t(TestClass::*)(int64_t), &TestClass::OverloadMethod)
        ))
    .Method("GetSelf", MakeFunction(&TestClass::GetSelf))
    .Register();
```

### Inheritance

``` c++
class BaseClass
{
public:
    void Foo(int p);
};

class TestClass : public BaseClass
{
public:
};
```

Statement

``` c++
puerts::DefineClass<BaseClass>()
    .Method("Foo", MakeFunction(&BaseClass::Foo))
    .Register();

puerts::DefineClass<TestClass>()
    .Extends<BaseClass>()
    .Register();
```

### JS object is mapped to JsObject and get/set the JS object properties

``` c++
#include "JsObject.h"

class AdvanceTestClass
{
public:
    AdvanceTestClass(int A);

    void JsObjectTest(FJsObject Object);
};

void AdvanceTestClass::JsObjectTest(FJsObject Object)
{
    auto P = Object.Get<int>("p");
    UE_LOG(LogTemp, Warning, TEXT("AdvanceTestClass::JsObjectTest({p:%d})"), P);
    Object.Set<std::string>("q", "john");
}
```

Use in TypeScript

``` typescript
import * as cpp from 'cpp'

// js object
let obj  = new cpp.AdvanceTestClass(100);
let j:any = {p:100};
obj.JsObjectTest(j);
console.log(j.q);
```

### JS function mapping JsObject and callback

``` c++
// class decl ...
void AdvanceTestClass::CallJsObjectTest(FJsObject Object)
{
    auto Ret = Object.Func<float>(1024, "che");
    UE_LOG(LogTemp, Warning, TEXT("AdvanceTestClass::CallJsObjectTest Callback Ret %f"), Ret);
}

```

Use in TypeScript

``` typescript
let obj  = new cpp.AdvanceTestClass(100);
obj.CallJsObjectTest((i, str) => {
    console.log(i, str);
    return 1.01;
})
```

### JS function mapping to `std::function`

``` c++
//class decl ...
void AdvanceTestClass::StdFunctionTest(std::function<int(int, int)> Func)
{
    int Ret = Func(88, 99);
    UE_LOG(LogTemp, Warning, TEXT("AdvanceTestClass::StdFunctionTest Callback Ret %d"), Ret);
}
```

Use in TypeScript

``` typescript
let obj  = new cpp.AdvanceTestClass(100);
obj.StdFunctionTest((x:number, y:number) => {
    console.log('x=' + x + ",y=" + y);
    return x + y;
})
```

### Supplement Engine Classes

This is if you want to supplement existing classes like `UObject` which has method like `CreateDefaultSubobject`, `GetName`, `GetOuter`, `GetClass`, `GetWorld` which don't have the `UFUNCTION` modifier.

To achieve this, add the C++:

``` c++
#include "CoreMinimal.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"

UsingUClass(UObject)
UsingUClass(UWorld) // for return type
UsingUClass(UClass)
UsingUClass(USceneComponent)

puerts::DefineClass<UObject>()
#if ENGINE_MAJOR_VERSION >= 4 && ENGINE_MINOR_VERSION >= 23
    .Method("CreateDefaultSubobject", SelectFunction(UObject* (UObject::*)(FName, UClass*, UClass*, bool , bool), &UObject::CreateDefaultSubobject))
#else
    .Method("CreateDefaultSubobject", SelectFunction(UObject* (UObject::*)(FName, UClass*, UClass*, bool, bool, bool), &UObject::CreateDefaultSubobject))
#endif
    .Method("GetName", SelectFunction(FString (UObjectBaseUtility::*)() const, &UObjectBaseUtility::GetName))
    .Method("GetOuter", MakeFunction(&UObject::GetOuter))
    .Method("GetClass", MakeFunction(&UObject::GetClass))
    .Method("GetWorld", MakeFunction(&UObject::GetWorld))
    .Register();
```

Note: Ordinary C++ class is different (i.e. not a descendent of `UObject`/`UClass`), like specified earlier in this file. If you're modifying something that is a descendent of `UClass`, you meed to use the `UsingUClass` macro as shown above. Similarly if you're supplementing a `UStruct`, you need to use `UsingUStruct`.

After regenerating `ue.d.ts`, it can be seen that the above methods have been added to `UE.Object`'s type declaration:

``` typescript
class Object {
    constructor(Outer?: Object, Name?: string, ObjectFlags?: number);
    ExecuteUbergraph(EntryPoint: number): void;
    CreateDefaultSubobject(p0: string, p1: $Nullable<Class>, p2: $Nullable<Class>, p3: boolean, p4: boolean) : Object;
    GetName() : string;
    GetOuter() : Object;
    GetClass() : Class;
    GetWorld() : World;
    static StaticClass(): Class;
    static Find(OrigInName: string, Outer?: Object): Object;
    static Load(InName: string): Object;
}
```

Subsequent use of the above method can be used directly on the `Object` object.
