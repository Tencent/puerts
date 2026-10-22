#include "PuertsTestRunner.h"

#include "JsEnv.h"
#include "PuertsTestTypes.h"
#include "HAL/FileManager.h"
#include "Misc/CommandLine.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "UObject/UObjectGlobals.h"

namespace PuertsTest
{
void CollectAllGarbage()
{
    CollectGarbage(GARBAGE_COLLECTION_KEEPFLAGS, true);
}

static void FullGC(PUERTS_NAMESPACE::FJsEnv& Env)
{
    // RequestFullGarbageCollectionForTesting requires --expose-gc which the plugin does not enable,
    // LowMemoryNotification performs a full (non-incremental) GC as well.
    Env.LowMemoryNotification();
    CollectAllGarbage();
    Env.LowMemoryNotification();
    CollectAllGarbage();
}

static void CompareBaseline(FAutomationTestBase& Test, const FString& BaselineName, const TArray<FString>& Notes)
{
    const FString Dir = FPaths::ProjectDir() / TEXT("Baseline");
    const FString File = Dir / (BaselineName + TEXT(".txt"));
    const FString Actual = FString::Join(Notes, TEXT("\n")) + TEXT("\n");

    const bool bUpdate = FParse::Param(FCommandLine::Get(), TEXT("PuertsUpdateBaseline"));
    FString Expected;
    if (bUpdate || !FFileHelper::LoadFileToString(Expected, *File))
    {
        IFileManager::Get().MakeDirectory(*Dir, true);
        FFileHelper::SaveStringToFile(Actual, *File, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
        Test.AddInfo(FString::Printf(TEXT("baseline written: %s"), *File));
        return;
    }

    Expected.ReplaceInline(TEXT("\r\n"), TEXT("\n"));
    if (Expected == Actual)
    {
        return;
    }

    TArray<FString> ExpectedLines;
    Expected.ParseIntoArray(ExpectedLines, TEXT("\n"), false);
    if (ExpectedLines.Num() > 0 && ExpectedLines.Last().IsEmpty())
    {
        ExpectedLines.Pop();
    }
    const int32 Count = FMath::Max(ExpectedLines.Num(), Notes.Num());
    int32 Reported = 0;
    for (int32 i = 0; i < Count && Reported < 20; ++i)
    {
        const FString E = ExpectedLines.IsValidIndex(i) ? ExpectedLines[i] : TEXT("<missing>");
        const FString A = Notes.IsValidIndex(i) ? Notes[i] : TEXT("<missing>");
        if (E != A)
        {
            Test.AddError(FString::Printf(
                TEXT("baseline mismatch [%s] line %d\n  expected: %s\n  actual:   %s"), *BaselineName, i + 1, *E, *A));
            ++Reported;
        }
    }
    const FString ActualFile = FPaths::ProjectSavedDir() / TEXT("PuertsTest") / (BaselineName + TEXT(".actual.txt"));
    FFileHelper::SaveStringToFile(Actual, *ActualFile, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
    Test.AddInfo(FString::Printf(TEXT("actual notes saved to %s"), *ActualFile));
}

UPuertsTestReporter* RunScript(FAutomationTestBase& Test, const FString& Module, const FString& BaselineName)
{
    UPuertsTestReporter* Reporter = NewObject<UPuertsTestReporter>();
    Reporter->AddToRoot();

    {
        auto Env = MakeUnique<PUERTS_NAMESPACE::FJsEnv>();
        TArray<TPair<FString, UObject*>> Arguments;
        Arguments.Add(TPair<FString, UObject*>(TEXT("Reporter"), Reporter));
        Env->Start(Module, Arguments);

        for (int32 Step = 1; Step < Reporter->StepCount; ++Step)
        {
            FullGC(*Env);
            if (!Reporter->OnStep.IsBound())
            {
                Test.AddError(FString::Printf(TEXT("%s: StepCount=%d but OnStep is not bound"), *Module, Reporter->StepCount));
                break;
            }
            Reporter->OnStep.Execute(Step);
        }

        Reporter->OnStep.Clear();
        Env.Reset();
    }
    CollectAllGarbage();

    if (Reporter->FinishedSteps != Reporter->StepCount)
    {
        Test.AddError(FString::Printf(TEXT("%s: script finished %d of %d steps (load failure or uncaught exception, see log)"),
            *Module, Reporter->FinishedSteps, Reporter->StepCount));
    }

    for (const FPuertsTestFailure& F : Reporter->Failed)
    {
        Test.AddError(FString::Printf(TEXT("[%s] %s"), *F.Name, *F.Message));
    }
    Test.AddInfo(FString::Printf(TEXT("%s: %d passed, %d failed"), *Module, Reporter->Passed.Num(), Reporter->Failed.Num()));

    if (!BaselineName.IsEmpty())
    {
        CompareBaseline(Test, BaselineName, Reporter->Notes);
    }
    return Reporter;
}
}    // namespace PuertsTest
