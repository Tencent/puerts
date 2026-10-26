#include "Misc/AutomationTest.h"
#include "PuertsTestRunner.h"
#include "PuertsTestTypes.h"

#if WITH_DEV_AUTOMATION_TESTS

#define PUERTS_TEST_FLAGS (EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

#define PUERTS_SCRIPT_TEST(Name, Module)                                                                \
    IMPLEMENT_SIMPLE_AUTOMATION_TEST(FPuertsTest_##Name, "Puerts.Functional." #Name, PUERTS_TEST_FLAGS) \
    bool FPuertsTest_##Name::RunTest(const FString& Parameters)                                         \
    {                                                                                                   \
        UPuertsTestReporter* Reporter = PuertsTest::RunScript(*this, TEXT(Module), TEXT(#Name));        \
        Reporter->RemoveFromRoot();                                                                     \
        return !HasAnyErrors();                                                                         \
    }

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

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FPuertsTest_WebSocket, "Puerts.Functional.WebSocket", PUERTS_TEST_FLAGS)
bool FPuertsTest_WebSocket::RunTest(const FString& Parameters)
{
    // no baseline, tests/websocket.js only checks WebSocketPP when the plugin is built with WITH_WEBSOCKET
    UPuertsTestReporter* Reporter = PuertsTest::RunScript(*this, TEXT("tests/websocket"), FString());
    Reporter->RemoveFromRoot();
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FPuertsTest_Timers, "Puerts.Functional.Timers", PUERTS_TEST_FLAGS)
bool FPuertsTest_Timers::RunTest(const FString& Parameters)
{
    // tests/timers.js throws in a timer callback on purpose, and registers a string callback which the js
    // wrapper of setTimeout only rejects when the timer fires, the env logs both as errors
    AddExpectedError(TEXT("Exception in Timer Callback"), EAutomationExpectedErrorFlags::Contains, 2);
    UPuertsTestReporter* Reporter = PuertsTest::RunScript(*this, TEXT("tests/timers"), TEXT("Timers"));
    Reporter->RemoveFromRoot();
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FPuertsTest_MakeUClass, "Puerts.Functional.MakeUClass", PUERTS_TEST_FLAGS)
bool FPuertsTest_MakeUClass::RunTest(const FString& Parameters)
{
    // tests/make_uclass.js throws in an override once, and in a Constructor which runs for the CDO and one instance
    AddExpectedError(TEXT("makeuclass boom"), EAutomationExpectedErrorFlags::Contains, 1);
    AddExpectedError(TEXT("makeuclass ctor boom"), EAutomationExpectedErrorFlags::Contains, 2);
    UPuertsTestReporter* Reporter = PuertsTest::RunScript(*this, TEXT("tests/make_uclass"), TEXT("MakeUClass"));
    Reporter->RemoveFromRoot();
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FPuertsTest_TsClass, "Puerts.Functional.TsClass", PUERTS_TEST_FLAGS)
bool FPuertsTest_TsClass::RunTest(const FString& Parameters)
{
    // tests/ts_class.js throws in a ts override once
    AddExpectedError(TEXT("tsclass boom"), EAutomationExpectedErrorFlags::Contains, 1);
    UPuertsTestReporter* Reporter = PuertsTest::RunScript(*this, TEXT("tests/ts_class"), TEXT("TsClass"), true);
    Reporter->RemoveFromRoot();
    return !HasAnyErrors();
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FPuertsTest_JsObject, "Puerts.Functional.JsObject", PUERTS_TEST_FLAGS)
bool FPuertsTest_JsObject::RunTest(const FString& Parameters)
{
    // tests/js_object.js calls a non function object once and a throwing function twice
    AddExpectedError(TEXT("call a non-function object!"), EAutomationExpectedErrorFlags::Contains, 1);
    AddExpectedError(TEXT("jsobject boom"), EAutomationExpectedErrorFlags::Contains, 2);
    // the holder outlives the env: GetInt, CopyAndRead (two reads) and CallFunc
    AddExpectedError(TEXT("JsEnv associated had release!"), EAutomationExpectedErrorFlags::Contains, 4);
    UPuertsTestReporter* Reporter = PuertsTest::RunScript(*this, TEXT("tests/js_object"), FString());

    UPuertsTestJsObjectHolder* Holder = Cast<UPuertsTestJsObjectHolder>(Reporter->Holder);
    if (TestNotNull(TEXT("holder kept by the reporter"), Holder))
    {
        TestEqual(TEXT("Get after the env is destroyed"), Holder->GetInt(TEXT("x")), 0);
        TestEqual(TEXT("copies after the env is destroyed"), Holder->CopyAndRead(TEXT("x")), 0);
        TestEqual(TEXT("Func after the env is destroyed"), Holder->CallFunc(1, 2), 0);
        FJsObject Copied = Holder->GetValue();
        Copied = FJsObject();
    }
    // the holder (and the FJsObject in it) is destroyed after the env
    Reporter->Holder = nullptr;
    Reporter->RemoveFromRoot();
    PuertsTest::CollectAllGarbage();
    return !HasAnyErrors();
}

#endif
