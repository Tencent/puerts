#include "Misc/AutomationTest.h"
#include "PapiBackendPython.h"
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

bool RunPython(FAutomationTestBase& Test, const TCHAR* Module, const TCHAR* Name)
{
    if (!PUERTS_NAMESPACE::FPapiBackendPython::IsAvailable())
    {
        Test.AddWarning(TEXT("python backend is not available (needs the Python3 module with python 3.9+), skipped"));
        return true;
    }
    return RunPlain(Test, EBackend::Python, Module, Name);
}

bool RunWebSocket(FAutomationTestBase& Test, EBackend Backend)
{
    // no baseline, tests/websocket.js only checks WebSocketPP when the plugin is built with WITH_WEBSOCKET
    return Finish(Test, PuertsTest::RunScript(Test, Backend, TEXT("tests/websocket"), FString()));
}

bool RunTimers(FAutomationTestBase& Test, EBackend Backend)
{
    // tests/timers.js throws in a timer callback on purpose, puerts/timer.js logs it and goes on with the other timers
    Test.AddExpectedError(TEXT("Exception in Timer Callback"), EAutomationExpectedErrorFlags::Contains, 1);
    return Finish(Test, PuertsTest::RunScript(Test, Backend, TEXT("tests/timers"), TEXT("Timers")));
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
// blueprints and user defined structs changed and recompiled, needs the editor
PUERTS_SCRIPT_TEST(Blueprint, "tests/blueprint")

PUERTS_TEST(WebSocket, RunWebSocket(*this, B))
PUERTS_TEST(Timers, RunTimers(*this, B))
PUERTS_TEST(JsObject, RunJsObject(*this, B))

// the lua tests (tests/lua/*.lua) run with the lua backend only, baselines are Baseline/Lua/<Name>.txt
#define PUERTS_LUA_TEST(Name, Module) PUERTS_BACKEND_TEST(Lua, Name, RunPlain(*this, B, TEXT(Module), TEXT(#Name)))

PUERTS_LUA_TEST(Properties, "tests/lua/properties")
PUERTS_LUA_TEST(Functions, "tests/lua/functions")
PUERTS_LUA_TEST(Containers, "tests/lua/containers")
PUERTS_LUA_TEST(Delegates, "tests/lua/delegates")
PUERTS_LUA_TEST(Lifecycle, "tests/lua/lifecycle")
PUERTS_LUA_TEST(Modules, "tests/lua/modules")
PUERTS_LUA_TEST(Errors, "tests/lua/errors")
PUERTS_LUA_TEST(Blueprint, "tests/lua/blueprint")

// the python tests (tests/python/*.py) run with the python backend only, baselines are Baseline/Python/<Name>.txt; skipped
// (with a warning) if python is not available, e.g. UE4 (python 3.7) or an engine without the Python3 module
#define PUERTS_PYTHON_TEST(Name, Module) PUERTS_BACKEND_TEST(Python, Name, RunPython(*this, TEXT(Module), TEXT(#Name)))

PUERTS_PYTHON_TEST(Properties, "tests/python/properties")
PUERTS_PYTHON_TEST(Functions, "tests/python/functions")
PUERTS_PYTHON_TEST(Containers, "tests/python/containers")
PUERTS_PYTHON_TEST(Delegates, "tests/python/delegates")
PUERTS_PYTHON_TEST(Lifecycle, "tests/python/lifecycle")
PUERTS_PYTHON_TEST(Modules, "tests/python/modules")
PUERTS_PYTHON_TEST(Errors, "tests/python/errors")
PUERTS_PYTHON_TEST(Blueprint, "tests/python/blueprint")

#endif
