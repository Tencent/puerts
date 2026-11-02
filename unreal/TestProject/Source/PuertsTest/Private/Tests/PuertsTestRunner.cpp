#include "PuertsTestRunner.h"

#include "JsEnv.h"
#include "PuertsTestTypes.h"
#include "Containers/Ticker.h"
#include "UECompatible.h"
#include "HAL/FileManager.h"
#include "Misc/CommandLine.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "UObject/UObjectArray.h"
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

// the first line of a failure message, with the script root replaced as normalizePath of framework.js does
static FString FailureLine(const FPuertsTestFailure& F)
{
    FString Message = F.Message;
    int32 Pos;
    if (Message.FindChar(TEXT('\n'), Pos))
    {
        Message.LeftInline(Pos);
    }
    FString Root = FPaths::ConvertRelativePathToFull(FPaths::ProjectContentDir() / TEXT("JavaScript"));
    Message.ReplaceInline(*Root, TEXT("<js-root>"));
    Message.ReplaceInline(*Root.Replace(TEXT("/"), TEXT("\\")), TEXT("<js-root>"));
    return FString::Printf(TEXT("<failed> [%s] %s"), *F.Name, *Message.TrimEnd());
}

// The scripts and the baselines (Baseline/<Name>.txt) are shared with the unreal-3.0 branch. A script with known
// behavior differences on this branch has its own baseline Baseline/UE2/<Name>.txt (written by -PuertsUpdateBaseline
// when the result differs from the shared one), the failed tests are recorded in it too (e.g. the dynamic import, a
// feature of 3.0 only). Returns true if the failed tests are expected by the baseline.
static bool CompareBaseline(FAutomationTestBase& Test, EBackend Backend, const FString& BaselineName, const TArray<FString>& Notes,
    const TArray<FPuertsTestFailure>& Failed)
{
    const FString Dir = FPaths::ProjectDir() / TEXT("Baseline");
    const FString SharedFile = Dir / (BaselineName + TEXT(".txt"));
    const FString BranchFile = Dir / TEXT("UE2") / (BaselineName + TEXT(".txt"));

    TArray<FString> NotesWithFailures = Notes;
    for (const FPuertsTestFailure& F : Failed)
    {
        NotesWithFailures.Add(FailureLine(F));
    }
    const FString Actual = FString::Join(Notes, TEXT("\n")) + TEXT("\n");

    const bool bUpdate = FParse::Param(FCommandLine::Get(), TEXT("PuertsUpdateBaseline"));
    FString Shared;
    const bool bHasShared = FFileHelper::LoadFileToString(Shared, *SharedFile);
    Shared.ReplaceInline(TEXT("\r\n"), TEXT("\n"));
    if (!bHasShared)
    {
        // a new script
        IFileManager::Get().MakeDirectory(*Dir, true);
        FFileHelper::SaveStringToFile(Actual, *SharedFile, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
        Test.AddInfo(FString::Printf(TEXT("baseline written: %s"), *SharedFile));
        return false;
    }
    if (bUpdate)
    {
        if (Failed.Num() == 0 && Shared == Actual)
        {
            // the same as the shared baseline
            IFileManager::Get().Delete(*BranchFile, false, false, true);
            return false;
        }
        IFileManager::Get().MakeDirectory(*FPaths::GetPath(BranchFile), true);
        FFileHelper::SaveStringToFile(FString::Join(NotesWithFailures, TEXT("\n")) + TEXT("\n"), *BranchFile,
            FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
        Test.AddInfo(FString::Printf(TEXT("baseline written: %s"), *BranchFile));
        return true;
    }

    FString Expected;
    const bool bBranch = FFileHelper::LoadFileToString(Expected, *BranchFile);
    const FString& File = bBranch ? BranchFile : SharedFile;
    const TArray<FString>& ActualLines = bBranch ? NotesWithFailures : Notes;
    if (bBranch)
    {
        Expected.ReplaceInline(TEXT("\r\n"), TEXT("\n"));
    }
    else
    {
        Expected = Shared;
    }
    const FString ActualText = FString::Join(ActualLines, TEXT("\n")) + TEXT("\n");
    if (Expected == ActualText)
    {
        return bBranch;
    }

    TArray<FString> ExpectedLines;
    Expected.ParseIntoArray(ExpectedLines, TEXT("\n"), false);
    if (ExpectedLines.Num() > 0 && ExpectedLines.Last().IsEmpty())
    {
        ExpectedLines.Pop();
    }
    const int32 Count = FMath::Max(ExpectedLines.Num(), ActualLines.Num());
    int32 Reported = 0;
    for (int32 i = 0; i < Count && Reported < 20; ++i)
    {
        const FString E = ExpectedLines.IsValidIndex(i) ? ExpectedLines[i] : TEXT("<missing>");
        const FString A = ActualLines.IsValidIndex(i) ? ActualLines[i] : TEXT("<missing>");
        if (E != A)
        {
            Test.AddError(FString::Printf(
                TEXT("baseline mismatch [%s] (%s) line %d\n  expected: %s\n  actual:   %s"), *BaselineName, *File, i + 1, *E, *A));
            ++Reported;
        }
    }
    const FString ActualFile =
        FPaths::ProjectSavedDir() / TEXT("PuertsTest") / BackendName(Backend) / (BaselineName + TEXT(".actual.txt"));
    FFileHelper::SaveStringToFile(ActualText, *ActualFile, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
    Test.AddInfo(FString::Printf(TEXT("actual notes saved to %s"), *ActualFile));
    // the failures are reported as baseline mismatches
    return bBranch;
}

const TCHAR* BackendName(EBackend Backend)
{
    return TEXT("V8");
}

UPuertsTestReporter* RunScript(FAutomationTestBase& Test, EBackend Backend, const FString& Module, const FString& BaselineName)
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
            // timers are checked on the tick of the env (a core ticker delegate), wait a little real time (more than the 10ms
            // minimum of setInterval) and tick, so they fire before the next step
            FPlatformProcess::Sleep(0.05f);
            FUETicker::GetCoreTicker().Tick(0.1f);
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

    const bool bFailuresInBaseline =
        !BaselineName.IsEmpty() && CompareBaseline(Test, Backend, BaselineName, Reporter->Notes, Reporter->Failed);
    for (const FPuertsTestFailure& F : Reporter->Failed)
    {
        if (bFailuresInBaseline)
        {
            Test.AddInfo(FString::Printf(TEXT("[%s] (expected on this branch) %s"), *F.Name, *F.Message));
        }
        else
        {
            Test.AddError(FString::Printf(TEXT("[%s] %s"), *F.Name, *F.Message));
        }
    }
    Test.AddInfo(FString::Printf(TEXT("%s: %d passed, %d failed"), *Module, Reporter->Passed.Num(), Reporter->Failed.Num()));
    return Reporter;
}
}    // namespace PuertsTest
