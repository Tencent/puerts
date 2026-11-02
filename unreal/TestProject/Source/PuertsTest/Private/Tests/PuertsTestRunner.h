#pragma once

#include "CoreMinimal.h"
#include "Misc/AutomationTest.h"

class UPuertsTestReporter;

namespace PuertsTest
{
// the script backend a test runs with. unreal-2.0.x selects the js engine at compile time (JsEnv.Build.cs), the tests run
// with v8, the default one
enum class EBackend
{
    V8
};

const TCHAR* BackendName(EBackend Backend);

// Runs a JS test module (Content/JavaScript/<Module>.js) in a fresh FJsEnv.
// The script receives a UPuertsTestReporter as argv "Reporter". Between steps C++ runs a JS full GC and a UE GC,
// then calls Reporter.OnStep(step). Failures reported by the script become automation errors.
// Notes reported by the script are compared with Baseline/<BaselineName>.txt (written instead when running with
// -PuertsUpdateBaseline or when the file does not exist yet).
// Returns the reporter (rooted, caller must call RemoveFromRoot) or nullptr.
UPuertsTestReporter* RunScript(FAutomationTestBase& Test, EBackend Backend, const FString& Module, const FString& BaselineName);

void CollectAllGarbage();
}    // namespace PuertsTest
