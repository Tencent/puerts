#pragma once

#include "CoreMinimal.h"
#include "Misc/AutomationTest.h"

class UPuertsTestReporter;

namespace PuertsTest
{
// Runs a JS test module (Content/JavaScript/<Module>.js) in a fresh FJsEnv.
// The script receives a UPuertsTestReporter as argv "Reporter". Between steps C++ runs a JS full GC and a UE GC,
// then calls Reporter.OnStep(step). Failures reported by the script become automation errors.
// Notes reported by the script are compared with Baseline/<BaselineName>.txt (written instead when running with
// -PuertsUpdateBaseline or when the file does not exist yet).
// Returns the reporter (rooted, caller must call RemoveFromRoot) or nullptr.
UPuertsTestReporter* RunScript(FAutomationTestBase& Test, const FString& Module, const FString& BaselineName);

void CollectAllGarbage();
}    // namespace PuertsTest
