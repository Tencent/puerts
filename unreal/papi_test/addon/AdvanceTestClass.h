#pragma once

#include <string>
#include <functional>
#include <Binding.hpp>

// counts copies, used to check that an object passed by reference to a js callback is not copied
class CopyCountClass
{
public:
    CopyCountClass() = default;
    CopyCountClass(const CopyCountClass& Other) : Value(Other.Value)
    {
        ++CopyCount;
    }
    CopyCountClass& operator=(const CopyCountClass& Other) = default;

    int Value = 0;

    static int CopyCount;
};

class AdvanceTestClass
{
public:
    AdvanceTestClass(int A);

    int A;

    // std::function argument, the js function is wrapped by pesapi
    int StdFunctionTest(std::function<int(int, int)> Func);

    // std::function with reference parameters: the object is passed without copying (modified in place), the int and
    // the string are passed as $ref and written back after the call. returns "obj=..,i=..,s=..,copies=.."
    std::string StdFunctionRefTest(std::function<void(CopyCountClass&, int&, std::string&)> Func);

    // std::function with a return value and a reference parameter, returns Ret * 100 + I
    int StdFunctionRefRetTest(std::function<int(int&)> Func);

    // std::function with a const reference / by value object parameter (passed as copies), returns the callback result
    int StdFunctionConstRefTest(std::function<int(const CopyCountClass&, CopyCountClass)> Func);

    // puerts::Function (PesapiObject.hpp)
    int FunctionTest(puerts::Function Func);

    // puerts::Object (PesapiObject.hpp), reads obj.x and writes obj.y = x * 2
    int ObjectTest(puerts::Object Obj);
};
