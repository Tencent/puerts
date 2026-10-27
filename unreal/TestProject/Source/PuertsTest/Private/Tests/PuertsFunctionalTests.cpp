#include "Misc/AutomationTest.h"
#include "PuertsTestRunner.h"
#include "PuertsTestTypes.h"

#if WITH_DEV_AUTOMATION_TESTS

#define PUERTS_TEST_FLAGS (EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

using PuertsTest::EBackend;

namespace
{
bool Finish(FAutomationTestBase& Test, UPuertsTestReporter* Reporter)
{
    if (Reporter)
    {
        Reporter->RemoveFromRoot();
    }
    return !Test.HasAnyErrors();
}

bool RunPlain(FAutomationTestBase& Test, EBackend Backend, const TCHAR* Module, const TCHAR* Name)
{
    return Finish(Test, PuertsTest::RunScript(Test, Backend, Module, Name));
}

bool RunWebSocket(FAutomationTestBase& Test, EBackend Backend)
{
    // no baseline, tests/websocket.js only checks WebSocketPP when the plugin is built with WITH_WEBSOCKET
    return Finish(Test, PuertsTest::RunScript(Test, Backend, TEXT("tests/websocket"), FString()));
}

bool RunTimers(FAutomationTestBase& Test, EBackend Backend)
{
    // tests/timers.js throws in a timer callback on purpose, and registers a string callback which the js
    // wrapper of setTimeout only rejects when the timer fires, the env logs both as errors
    Test.AddExpectedError(TEXT("Exception in Timer Callback"), EAutomationExpectedErrorFlags::Contains, 2);
    return Finish(Test, PuertsTest::RunScript(Test, Backend, TEXT("tests/timers"), TEXT("Timers")));
}

bool RunMakeUClass(FAutomationTestBase& Test, EBackend Backend)
{
    // tests/make_uclass.js throws in an override once, and in a Constructor which runs for the CDO and one instance
    Test.AddExpectedError(TEXT("makeuclass boom"), EAutomationExpectedErrorFlags::Contains, 1);
    Test.AddExpectedError(TEXT("makeuclass ctor boom"), EAutomationExpectedErrorFlags::Contains, 2);
    return Finish(Test, PuertsTest::RunScript(Test, Backend, TEXT("tests/make_uclass"), TEXT("MakeUClass")));
}

bool RunTsClass(FAutomationTestBase& Test, EBackend Backend)
{
    // tests/ts_class.js throws in a ts override once
    Test.AddExpectedError(TEXT("tsclass boom"), EAutomationExpectedErrorFlags::Contains, 1);
    return Finish(Test, PuertsTest::RunScript(Test, Backend, TEXT("tests/ts_class"), TEXT("TsClass"), true));
}

bool RunJsObject(FAutomationTestBase& Test, EBackend Backend)
{
    // tests/js_object.js calls a non function object once and a throwing function twice
    Test.AddExpectedError(TEXT("call a non-function object!"), EAutomationExpectedErrorFlags::Contains, 1);
    Test.AddExpectedError(TEXT("jsobject boom"), EAutomationExpectedErrorFlags::Contains, 2);
    // the holder outlives the env: GetInt, CopyAndRead (two reads) and CallFunc
    Test.AddExpectedError(TEXT("JsEnv associated had release!"), EAutomationExpectedErrorFlags::Contains, 4);
    UPuertsTestReporter* Reporter = PuertsTest::RunScript(Test, Backend, TEXT("tests/js_object"), FString());
    if (!Reporter)
    {
        return false;
    }

    UPuertsTestJsObjectHolder* Holder = Cast<UPuertsTestJsObjectHolder>(Reporter->Holder);
    if (Test.TestNotNull(TEXT("holder kept by the reporter"), Holder))
    {
        Test.TestEqual(TEXT("Get after the env is destroyed"), Holder->GetInt(TEXT("x")), 0);
        Test.TestEqual(TEXT("copies after the env is destroyed"), Holder->CopyAndRead(TEXT("x")), 0);
        Test.TestEqual(TEXT("Func after the env is destroyed"), Holder->CallFunc(1, 2), 0);
        FJsObject Copied = Holder->GetValue();
        Copied = FJsObject();
    }
    // the holder (and the FJsObject in it) is destroyed after the env
    Reporter->Holder = nullptr;
    Reporter->RemoveFromRoot();
    PuertsTest::CollectAllGarbage();
    return !Test.HasAnyErrors();
}
}    // namespace

// every test is registered as Puerts.Functional.<Backend>.<Name>
#define PUERTS_BACKEND_TEST(Backend, Name, Body)                                                                                 \
    IMPLEMENT_SIMPLE_AUTOMATION_TEST(FPuertsTest_##Backend##_##Name, "Puerts.Functional." #Backend "." #Name, PUERTS_TEST_FLAGS) \
    bool FPuertsTest_##Backend##_##Name::RunTest(const FString& Parameters)                                                      \
    {                                                                                                                            \
        const EBackend B = EBackend::Backend;                                                                                    \
        return Body;                                                                                                             \
    }

#define PUERTS_TEST(Name, Body)         \
    PUERTS_BACKEND_TEST(V8, Name, Body) \
    PUERTS_BACKEND_TEST(Quickjs, Name, Body)

#define PUERTS_SCRIPT_TEST(Name, Module) PUERTS_TEST(Name, RunPlain(*this, B, TEXT(Module), TEXT(#Name)))

PUERTS_SCRIPT_TEST(Properties, "tests/properties")
PUERTS_SCRIPT_TEST(Functions, "tests/functions")
PUERTS_SCRIPT_TEST(Containers, "tests/containers")
PUERTS_SCRIPT_TEST(Delegates, "tests/delegates")
PUERTS_SCRIPT_TEST(Lifecycle, "tests/lifecycle")
PUERTS_SCRIPT_TEST(Mixin, "tests/mixin")
PUERTS_SCRIPT_TEST(CppBinding, "tests/cpp_binding")
PUERTS_SCRIPT_TEST(Errors, "tests/errors")
PUERTS_SCRIPT_TEST(Modules, "tests/modules")
PUERTS_SCRIPT_TEST(Objects, "tests/objects")
PUERTS_SCRIPT_TEST(Reflection, "tests/reflection")
PUERTS_SCRIPT_TEST(ModuleLoader, "tests/module_loader")
PUERTS_SCRIPT_TEST(Promises, "tests/promises")

PUERTS_TEST(WebSocket, RunWebSocket(*this, B))
PUERTS_TEST(Timers, RunTimers(*this, B))
PUERTS_TEST(MakeUClass, RunMakeUClass(*this, B))
PUERTS_TEST(TsClass, RunTsClass(*this, B))
PUERTS_TEST(JsObject, RunJsObject(*this, B))

#endif
