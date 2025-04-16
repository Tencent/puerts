# Template-Based Static Binding
Unreal has a lot of C++ functions and classes without reflection tags. In order to access them within TypeScript, Template-based static binding should be used.

Supported features:
- Constructor
- Static function
- Member variables
- Member function
- Constructor / static function / member function supports overload
- Inheritance
- The UE type is not marked `UPROPERTY`. After the `UFUNCTION` member declares, it will seamlessly appear in the original category.
- Support JS object mapping to C++ `JSObject`, `JSObject` can get/set the properties, call the JS function.
- Support JS function mapping to `std::function`
- Support custom converter

## Table Of Contents
- [Setup](#setup)
- [Usage](#usage)
- [API Reference](#api-reference)

## Setup
1. Use dynamic library version `V8` libraries, switching methods:
    - To the Puerts official website download and Puerts supporting `V8` library, and unzip it to `Plugins/Puerts/ThirdParty/` (or respective folder)
    - Find the `JsEnv.Build.cs` file and change `UseNewV8` to `true`
2. In the module's `*.Build.cs`
    - Add a dependency to the `JsEnv` module

## Usage
### Unreal Engine UCLASS
##### C++
``` c++
// UObject_Binding.h
#include "CoreMinimal.h"
#include "Binding.hpp"
#include "UEDataBinding.hpp"

UsingUClass(UObject)
UsingUClass(UWorld)
UsingUClass(UClass)

puerts::DefineClass<UObject>()
    .Method("GetClass", MakeFunction(&UObject::GetClass))
    .Method("GetWorld", MakeFunction(&UObject::GetWorld))
    .Register();
```

### Regular C++ Class
##### C++
``` cpp
// ExampleClass.h
class ExampleClass
{
// Static
public:
    static int32_t StaticAdd(int32_t a, int32_t b)
    {
        return a + b;
    }

    static int StaticInt;

// Non-Static
public:
    int32_t GetRegularInt()
	{
		return RegularInt;
	}

    int32_t RegularInt{1337};
};
```
``` c++
// ExampleClass_Binding.h
#include "Binding.hpp"

UsingCppType(ExampleClass);

struct AutoRegisterForCPP
{
    AutoRegisterForCPP()
    {
        puerts::DefineClass<ExampleClass>()
            .Function("StaticAdd", MakeFunction(&ExampleClass::StaticAdd))          // Static Function
            .Variable("StaticInt", MakeVariable(&ExampleClass::StaticInt))          // Static Variable
            .Method("GetRegularInt", MakeFunction(&ExampleClass::GetRegularInt))    // Member Function
            .Property("RegularInt", MakeProperty(&ExampleClass::RegularInt))        // Member Variable
            .Register();
    }
};

AutoRegisterForCPP _AutoRegisterForCPP__;
```
##### TypeScript
``` typescript
import * as cpp from 'cpp'

const AddedResult = cpp.Calc.Add(12, 34);
console.log(AddedResult);
```

**Note: Compile the C++, open the Unreal editor, and generate TypeScript definitions (either with the button or command) to call in TypeScript.**

## API Reference
### Constructor
##### C++
``` cpp
class Calc
{
public:
    Calc() { }
    Calc(int32_t InRegularInt, int32_t InPrivateIntVariable)
    {
        RegularInt = InRegularInt;
        PrivateIntVariable = InPrivateIntVariable;
    }
}
```
##### TypeScript
``` cpp
.Constructor()
```
``` cpp
.Constructor(
    CombineConstructors(
        MakeConstructor(Calc),
        MakeConstructor(Calc, int32_t, int32_t)
    ))
```

### Function Decaleration
| Function | Description |
| -------- | ----------- |
| `.Method(Name, Function Reference)` | Exposes a member function to TypeScript |
| `.Function(Name, Function Reference)` | Exposes a static function to TypeScript |

### Function Referencing
| Function | Description |
| -------- | ----------- |
| `MakeFunction(Reference To Function)` | Creates a member function reference |
| `MakeCheckFunction(Reference To Function)` | Creates a member function reference with parameter varification |
| `SelectFunction(ReturnType... (ClassName::*)(Parameters...), Reference To Function)` | Creates a member function reference based on a single function overload |

If the function has multiple overloads:
##### C++
``` c++
CombineOverloads(
    MakeOverload(void (ExampleClass::*)(), &ExampleClass::ExampleFunction),
    // More Overloads...
    )
```

### Variable Deceleration
| Function | Description |
| -------- | ----------- |
| `.Property(Name, Variable Reference)` | Exposes a member variable to TypeScript |
| `.Variable(Name, Variable Reference)` | Exposes a static variable to TypeScript |

### Variable Referencing
| Function | Description |
| -------- | ----------- |
| `MakeProperty(Reference To Variable)` | Creates a member variable reference |
| `MakeVariable(Reference To Variable)` | Creates a static variable reference |

### Getters and setters
##### C++
``` c++
.Property("IntVariable", MakePropertyByGetterSetter(&Calc::GetPrivateIntVariable, nullptr))
```

### Function Overloads
##### C++
``` c++
.Method("Add", CombineOverloads(
    MakeOverload(int32_t(Calc::*)(int32_t, int32_t), &Calc::OverloadedAdd),
    MakeOverload(int64_t(Calc::*)(int64_t, int64_t), &Calc::OverloadedAdd),
    ))
```

### Inheritance
##### C++
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
``` c++
puerts::DefineClass<BaseClass>()
    .Method("Foo", MakeFunction(&BaseClass::Foo))
    .Register();

puerts::DefineClass<TestClass>()
    .Extends<BaseClass>()
    .Register();
```

### JS object is mapped to JsObject and get/set the JS object properties
##### C++
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
##### TypeScript
``` typescript
import * as cpp from 'cpp'

// js object
let obj  = new cpp.AdvanceTestClass(100);
let j:any = {p:100};
obj.JsObjectTest(j);
console.log(j.q);
```

### JS function mapping JsObject and callback
##### C++
``` c++
// class decl ...
void AdvanceTestClass::CallJsObjectTest(FJsObject Object)
{
    auto Ret = Object.Func<float>(1024, "che");
    UE_LOG(LogTemp, Warning, TEXT("AdvanceTestClass::CallJsObjectTest Callback Ret %f"), Ret);
}

```
##### TypeScript
``` typescript
let obj  = new cpp.AdvanceTestClass(100);
obj.CallJsObjectTest((i, str) => {
    console.log(i, str);
    return 1.01;
})
```

### JS function mapping to `std::function`
##### C++
``` c++
//class decl ...
void AdvanceTestClass::StdFunctionTest(std::function<int(int, int)> Func)
{
    int Ret = Func(88, 99);
    UE_LOG(LogTemp, Warning, TEXT("AdvanceTestClass::StdFunctionTest Callback Ret %d"), Ret);
}
```
##### TypeScript
``` typescript
let obj  = new cpp.AdvanceTestClass(100);
obj.StdFunctionTest((x:number, y:number) => {
    console.log('x=' + x + ",y=" + y);
    return x + y;
})
```