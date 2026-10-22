#pragma once

#include <string>
#include <functional>
#include <Binding.hpp>

class AdvanceTestClass
{
public:
    AdvanceTestClass(int A);

    int A;

    // std::function argument, the js function is wrapped by pesapi
    int StdFunctionTest(std::function<int(int, int)> Func);

    // puerts::Function (PesapiObject.hpp)
    int FunctionTest(puerts::Function Func);

    // puerts::Object (PesapiObject.hpp), reads obj.x and writes obj.y = x * 2
    int ObjectTest(puerts::Object Obj);
};
