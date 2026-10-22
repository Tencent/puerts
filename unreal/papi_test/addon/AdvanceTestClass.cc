#include "AdvanceTestClass.h"
#include <cstdio>

AdvanceTestClass::AdvanceTestClass(int InA) : A(InA)
{
    printf("AdvanceTestClass::AdvanceTestClass(%d)\n", InA);
}

int AdvanceTestClass::StdFunctionTest(std::function<int(int, int)> Func)
{
    int Ret = Func(88, 99);
    printf("AdvanceTestClass::StdFunctionTest Callback Ret %d\n", Ret);
    return Ret;
}

int AdvanceTestClass::FunctionTest(puerts::Function Func)
{
    int Ret = Func.Func<int>(A, 1);
    printf("AdvanceTestClass::FunctionTest Callback Ret %d\n", Ret);
    return Ret;
}

int AdvanceTestClass::ObjectTest(puerts::Object Obj)
{
    int X = Obj.Get<int>("x");
    Obj.Set<int>("y", X * 2);
    printf("AdvanceTestClass::ObjectTest x = %d\n", X);
    return X;
}
