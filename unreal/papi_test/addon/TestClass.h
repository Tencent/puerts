#pragma once

#include <string>
#include <cstdio>
#include <cstdint>

class BaseClass
{
public:
    int A;
    int B;

    void Foo(int p);
};

class NoDeleteClass
{
public:
    NoDeleteClass()
    {
        printf("NoDeleteClass\n");
    }
    ~NoDeleteClass() = delete;
};

class TestClass : public BaseClass
{
public:
    int32_t X;
    int32_t Y;

    TestClass();

    TestClass(int32_t InX, int32_t InY);

    static int32_t Add(int32_t a, int32_t b);

    static int32_t Overload();

    static int32_t Overload(int32_t a);

    static int32_t Overload(int32_t a, int32_t b);

    static int32_t Overload(std::string a, int32_t b);

    int32_t OverloadMethod();

    int32_t OverloadMethod(int32_t a);

    uint32_t OverloadMethod(uint32_t a);

    int64_t OverloadMethod(int64_t a);

    TestClass* GetSelf();

    static int32_t PrintInfo(TestClass*);

    int Ref(int32_t& a);

    void StrRef(std::string& str);

    bool NoEmptyRef(NoDeleteClass& o) const
    {
        // the reference may be null if not passed by $ref, read through volatile so the check is not optimized away
        const void* volatile p = &o;
        printf("NoEmptyRef %p\n", p);
        return p != nullptr;
    }

    int Ptr(int32_t* a);

    const char* CStr(const char* str);

    void StrPtr(std::string* str);

    int32_t ConstRef(const int32_t& a);

    static int StaticInt;

    static const float Ten;
};

// used to check that finalize is called when js object is collected
class LifeCycleClass
{
public:
    LifeCycleClass();

    ~LifeCycleClass();

    static int AliveCount;

    static int GetAliveCount();
};
