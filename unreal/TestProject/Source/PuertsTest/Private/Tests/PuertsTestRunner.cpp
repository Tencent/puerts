#include "PuertsTestRunner.h"

#include "ScriptEnv.h"
#include "PapiBackendV8.h"
#include "PapiBackendQuickjs.h"
#include "PapiBackendLua.h"
#include "PuertsTestTypes.h"
#include "Containers/Ticker.h"
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

static void FullGC(PUERTS_NAMESPACE::FScriptEnv& Env)
{
    // RequestFullGarbageCollectionForTesting requires --expose-gc which the plugin does not enable,
    // LowMemoryNotification performs a full (non-incremental) GC as well.
    Env.LowMemoryNotification();
    CollectAllGarbage();
    Env.LowMemoryNotification();
    CollectAllGarbage();
}

static void CompareBaseline(FAutomationTestBase& Test, EBackend Backend, const FString& BaselineName, const TArray<FString>& Notes)
{
    const FString Dir = FPaths::ProjectDir() / TEXT("Baseline");
    // the lua tests are other scripts, they have their own baselines only
    const FString SharedFile =
        Backend == EBackend::Lua ? Dir / BackendName(Backend) / (BaselineName + TEXT(".txt")) : Dir / (BaselineName + TEXT(".txt"));
    const FString BackendFile = Backend == EBackend::V8 || Backend == EBackend::Lua
                                    ? SharedFile
                                    : Dir / BackendName(Backend) / (BaselineName + TEXT(".txt"));
    const FString Actual = FString::Join(Notes, TEXT("\n")) + TEXT("\n");

    const bool bUpdate = FParse::Param(FCommandLine::Get(), TEXT("PuertsUpdateBaseline"));
    FString Expected;
    FString File = BackendFile;
    bool bLoaded = FFileHelper::LoadFileToString(Expected, *BackendFile);
    if (!bLoaded && BackendFile != SharedFile)
    {
        File = SharedFile;
        bLoaded = FFileHelper::LoadFileToString(Expected, *SharedFile);
    }
    if (bUpdate || !bLoaded)
    {
        FString Shared;
        if (BackendFile != SharedFile && FFileHelper::LoadFileToString(Shared, *SharedFile) &&
            Shared.Replace(TEXT("\r\n"), TEXT("\n")) == Actual)
        {
            // the same as the shared baseline
            IFileManager::Get().Delete(*BackendFile, false, false, true);
            return;
        }
        File = BackendFile.IsEmpty() ? SharedFile : BackendFile;
        IFileManager::Get().MakeDirectory(*FPaths::GetPath(File), true);
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
                TEXT("baseline mismatch [%s] (%s) line %d\n  expected: %s\n  actual:   %s"), *BaselineName, *File, i + 1, *E, *A));
            ++Reported;
        }
    }
    const FString ActualFile =
        FPaths::ProjectSavedDir() / TEXT("PuertsTest") / BackendName(Backend) / (BaselineName + TEXT(".actual.txt"));
    FFileHelper::SaveStringToFile(Actual, *ActualFile, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
    Test.AddInfo(FString::Printf(TEXT("actual notes saved to %s"), *ActualFile));
}

struct FTsBindListener : public FUObjectArray::FUObjectCreateListener
{
    PUERTS_NAMESPACE::FScriptEnv* Env = nullptr;

    virtual void NotifyUObjectCreated(const UObjectBase* Object, int32 Index) override
    {
        if (Env)
        {
            Env->TryBindJs(Object);
        }
    }

    virtual void OnUObjectArrayShutdown() override
    {
        GUObjectArray.RemoveUObjectCreateListener(this);
    }
};

const TCHAR* BackendName(EBackend Backend)
{
    switch (Backend)
    {
        case EBackend::V8:
            return TEXT("V8");
        case EBackend::Quickjs:
            return TEXT("Quickjs");
        case EBackend::Lua:
            return TEXT("Lua");
    }
    return TEXT("?");
}

static PUERTS_NAMESPACE::FPapiBackendFactory BackendFactory(EBackend Backend)
{
    switch (Backend)
    {
        case EBackend::Quickjs:
            return &PUERTS_NAMESPACE::FPapiBackendQuickjs::Create;
        case EBackend::Lua:
            return &PUERTS_NAMESPACE::FPapiBackendLua::Create;
        default:
            return &PUERTS_NAMESPACE::FPapiBackendV8::Create;
    }
}

UPuertsTestReporter* RunScript(
    FAutomationTestBase& Test, EBackend Backend, const FString& Module, const FString& BaselineName, bool bBindTsClasses)
{
    UPuertsTestReporter* Reporter = NewObject<UPuertsTestReporter>();
    Reporter->AddToRoot();

    {
        auto Env = MakeUnique<PUERTS_NAMESPACE::FScriptEnv>(BackendFactory(Backend));
        FTsBindListener TsBindListener;
        if (bBindTsClasses)
        {
            TsBindListener.Env = Env.Get();
            GUObjectArray.AddUObjectCreateListener(&TsBindListener);
        }
        TArray<TPair<FString, UObject*>> Arguments;
        Arguments.Add(TPair<FString, UObject*>(TEXT("Reporter"), Reporter));
        Env->Start(Module, Arguments);

        for (int32 Step = 1; Step < Reporter->StepCount; ++Step)
        {
            // timers (puerts/timer.js) are js, checked against Date.now() on the tick of the env (a core ticker delegate),
            // wait a little real time (more than the 10ms minimum of setInterval) and tick, so they fire before the next step
            FPlatformProcess::Sleep(0.05f);
            FTSTicker::GetCoreTicker().Tick(0.1f);
            FullGC(*Env);
            if (!Reporter->OnStep.IsBound())
            {
                Test.AddError(FString::Printf(TEXT("%s: StepCount=%d but OnStep is not bound"), *Module, Reporter->StepCount));
                break;
            }
            Reporter->OnStep.Execute(Step);
        }

        Reporter->OnStep.Clear();
        if (bBindTsClasses)
        {
            GUObjectArray.RemoveUObjectCreateListener(&TsBindListener);
        }
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
        CompareBaseline(Test, Backend, BaselineName, Reporter->Notes);
    }
    return Reporter;
}
}    // namespace PuertsTest
