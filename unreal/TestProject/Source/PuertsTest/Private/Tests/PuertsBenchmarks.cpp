#include "Misc/AutomationTest.h"
#include "PuertsTestRunner.h"
#include "PuertsTestTypes.h"
#include "Dom/JsonObject.h"
#include "HAL/FileManager.h"
#include "HAL/PlatformMisc.h"
#include "Misc/CommandLine.h"
#include "Misc/DateTime.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"

#if WITH_DEV_AUTOMATION_TESTS

// Benchmarks are kept out of the Puerts.Functional group so that functional runs stay fast.
// Results: Saved/PuertsBench/<label>.json (label from -PuertsBenchLabel=, defaults to "latest").
IMPLEMENT_SIMPLE_AUTOMATION_TEST(
    FPuertsBench_All, "Puerts.Bench.All", EAutomationTestFlags::EditorContext | EAutomationTestFlags::PerfFilter)

bool FPuertsBench_All::RunTest(const FString& Parameters)
{
    // tsclass.* needs TypeScript generated classes bound
    UPuertsTestReporter* Reporter = PuertsTest::RunScript(*this, PuertsTest::EBackend::V8, TEXT("tests/bench"), FString(), true);
    if (!Reporter)
    {
        return false;
    }

    TSharedRef<FJsonObject> Root = MakeShared<FJsonObject>();
    Root->SetStringField(TEXT("time"), FDateTime::UtcNow().ToIso8601());
#if UE_BUILD_DEBUG
    Root->SetStringField(TEXT("config"), TEXT("Debug"));
#elif UE_BUILD_DEVELOPMENT
    Root->SetStringField(TEXT("config"), TEXT("Development"));
#else
    Root->SetStringField(TEXT("config"), TEXT("Other"));
#endif
    Root->SetStringField(TEXT("cpu"), FPlatformMisc::GetCPUBrand().TrimStartAndEnd());

    TArray<TSharedPtr<FJsonValue>> Items;
    for (const FPuertsTestMetric& M : Reporter->Metrics)
    {
        TSharedRef<FJsonObject> Item = MakeShared<FJsonObject>();
        Item->SetStringField(TEXT("name"), M.Name);
        Item->SetNumberField(TEXT("value"), M.Value);
        Item->SetStringField(TEXT("unit"), M.Unit);
        Items.Add(MakeShared<FJsonValueObject>(Item));
        AddInfo(FString::Printf(TEXT("%-40s %12.2f %s"), *M.Name, M.Value, *M.Unit));
    }
    Root->SetArrayField(TEXT("metrics"), Items);
    Reporter->RemoveFromRoot();

    FString Label = TEXT("latest");
    FParse::Value(FCommandLine::Get(), TEXT("PuertsBenchLabel="), Label);
    const FString Dir = FPaths::ProjectSavedDir() / TEXT("PuertsBench");
    IFileManager::Get().MakeDirectory(*Dir, true);
    FString Json;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&Json);
    FJsonSerializer::Serialize(Root, Writer);
    const FString File = Dir / (Label + TEXT(".json"));
    FFileHelper::SaveStringToFile(Json, *File, FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
    AddInfo(FString::Printf(TEXT("benchmark result written: %s"), *File));

    return !HasAnyErrors();
}

#endif
