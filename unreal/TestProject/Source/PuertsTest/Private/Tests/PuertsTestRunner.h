#pragma once

#include "CoreMinimal.h"
#include "Misc/AutomationTest.h"

class UPuertsTestReporter;

namespace PuertsTest
{
// the script backend a test runs with, every functional test is registered once for each
enum class EBackend
{
    V8,
    Quickjs,
    // lua (PapiLua), runs the lua test modules (Content/JavaScript/tests/lua/*.lua) only
    Lua,
    // python (PapiPython), runs the python test modules (Content/JavaScript/tests/python/*.py) only
    Python
};

const TCHAR* BackendName(EBackend Backend);

// Runs a JS test module (Content/JavaScript/<Module>.js) in a fresh FScriptEnv of the backend.
// The script receives a UPuertsTestReporter as argv "Reporter". Between steps C++ runs a JS full GC and a UE GC,
// then calls Reporter.OnStep(step). Failures reported by the script become automation errors.
// Notes reported by the script are compared with Baseline/<BaselineName>.txt (written instead when running with
// -PuertsUpdateBaseline or when the file does not exist yet). A backend other than v8 compares with
// Baseline/<Backend>/<BaselineName>.txt if it exists (the notes differ by the engine), else with the shared one; updating
// writes the backend file only when the notes differ from the shared baseline. Lua and Python (other languages) only use
// Baseline/<Backend>/<BaselineName>.txt.
// Returns the reporter (rooted, caller must call RemoveFromRoot) or nullptr.
UPuertsTestReporter* RunScript(FAutomationTestBase& Test, EBackend Backend, const FString& Module, const FString& BaselineName);

void CollectAllGarbage();
}    // namespace PuertsTest
