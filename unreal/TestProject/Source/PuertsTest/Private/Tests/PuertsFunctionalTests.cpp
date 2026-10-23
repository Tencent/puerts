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

#endif
