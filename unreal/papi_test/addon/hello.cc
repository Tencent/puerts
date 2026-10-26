#include <pesapi.h>
#include <Binding.hpp>
#include "TestClass.h"
#include "AdvanceTestClass.h"

UsingCppType(NoDeleteClass);
UsingCppType(BaseClass);
UsingCppType(TestClass);
UsingCppType(AdvanceTestClass);
UsingCppType(LifeCycleClass);

static void Init()
{
    puerts::DefineClass<NoDeleteClass>().Constructor().Register();

    puerts::DefineClass<BaseClass>()
        .Property("A", MakeProperty(&BaseClass::A))
        .Method("Foo", MakeFunction(&BaseClass::Foo))
        .Register();

    puerts::DefineClass<TestClass>()
        .Extends<BaseClass>()
        .Constructor(CombineConstructors(MakeConstructor(TestClass, int32_t, int32_t), MakeConstructor(TestClass)))
        .Property("X", MakeProperty(&TestClass::X))
        .Property("Y", MakeProperty(&TestClass::Y))
        .Variable("StaticInt", MakeVariable(&TestClass::StaticInt))
        .Variable("Ten", MakeReadonlyVariable(&TestClass::Ten))
        .Function("Add", MakeFunction(&TestClass::Add))
        .Function("PrintInfo", MakeFunction(&TestClass::PrintInfo))
        .Method("GetSelf", MakeFunction(&TestClass::GetSelf))
        .Method("NoEmptyRef", MakeFunction(&TestClass::NoEmptyRef))
        .Method("Ref", MakeFunction(&TestClass::Ref))
        .Method("StrRef", MakeFunction(&TestClass::StrRef))
        .Method("Ptr", MakeFunction(&TestClass::Ptr))
        .Method("CStr", MakeFunction(&TestClass::CStr))
        .Method("StrPtr", MakeFunction(&TestClass::StrPtr))
        .Method("ConstRef", MakeFunction(&TestClass::ConstRef))
        .Function("Overload", CombineOverloads(MakeOverload(int32_t(*)(), &TestClass::Overload),
                                  MakeOverload(int32_t(*)(int32_t), &TestClass::Overload),
                                  MakeOverload(int32_t(*)(int32_t, int32_t), &TestClass::Overload),
                                  MakeOverload(int32_t(*)(std::string, int32_t), &TestClass::Overload)))
        .Method("OverloadMethod", CombineOverloads(MakeOverload(int32_t(TestClass::*)(), &TestClass::OverloadMethod),
                                      MakeOverload(int32_t(TestClass::*)(int32_t), &TestClass::OverloadMethod),
                                      MakeOverload(uint32_t(TestClass::*)(uint32_t), &TestClass::OverloadMethod),
                                      MakeOverload(int64_t(TestClass::*)(int64_t), &TestClass::OverloadMethod)))
        .Register();

    puerts::DefineClass<AdvanceTestClass>()
        .Constructor<int>()    // if only one Constructor
        .Property("A", MakeProperty(&AdvanceTestClass::A))
        .Method("StdFunctionTest", MakeFunction(&AdvanceTestClass::StdFunctionTest))
        .Method("FunctionTest", MakeFunction(&AdvanceTestClass::FunctionTest))
        .Method("ObjectTest", MakeFunction(&AdvanceTestClass::ObjectTest))
        .Register();

    puerts::DefineClass<LifeCycleClass>()
        .Constructor()
        .Function("GetAliveCount", MakeFunction(&LifeCycleClass::GetAliveCount))
        .Register();
}

// the same for all builds: a pesapi addon (papi_test_host), or linked into the host with the pesapi_impl binding
// (papi_test_host_static) or the v8_impl binding (papi_test_host_v8)
PUERTS_PESAPI_MODULE(hello, Init)
