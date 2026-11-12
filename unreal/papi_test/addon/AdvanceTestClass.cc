#include "AdvanceTestClass.h"
#include <cstdio>

int CopyCountClass::CopyCount = 0;

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

std::string AdvanceTestClass::StdFunctionRefTest(std::function<void(CopyCountClass&, int&, std::string&)> Func)
{
    CopyCountClass Obj;
    Obj.Value = 1;
    int I = 2;
    std::string S = "s";
    CopyCountClass::CopyCount = 0;
    Func(Obj, I, S);
    int Copies = CopyCountClass::CopyCount;
    std::string Ret = "obj=" + std::to_string(Obj.Value) + ",i=" + std::to_string(I) + ",s=" + S +
                      ",copies=" + std::to_string(Copies);
    printf("AdvanceTestClass::StdFunctionRefTest %s\n", Ret.c_str());
    return Ret;
}

int AdvanceTestClass::StdFunctionRefRetTest(std::function<int(int&)> Func)
{
    int I = 3;
    int Ret = Func(I);
    printf("AdvanceTestClass::StdFunctionRefRetTest Ret %d, I %d\n", Ret, I);
    return Ret * 100 + I;
}

int AdvanceTestClass::StdFunctionConstRefTest(std::function<int(const CopyCountClass&, CopyCountClass)> Func)
{
    CopyCountClass Obj1;
    Obj1.Value = 10;
    CopyCountClass Obj2;
    Obj2.Value = 20;
    CopyCountClass::CopyCount = 0;
    int Ret = Func(Obj1, Obj2);
    printf("AdvanceTestClass::StdFunctionConstRefTest Ret %d, copies %d\n", Ret, CopyCountClass::CopyCount);
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
