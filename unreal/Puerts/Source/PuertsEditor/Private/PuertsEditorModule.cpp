/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PuertsEditorModule.h"
#include "JsEnv.h"
#include "Editor.h"
#include "Misc/FileHelper.h"
#include "PuertsModule.h"
#include "TypeScriptCompilerContext.h"
#include "TypeScriptBlueprint.h"
#include "SourceFileWatcher.h"
#include "JSLogger.h"
#include "JSModuleLoader.h"

class FPuertsEditorModule : public IPuertsEditorModule
{
    /** IModuleInterface implementation */
    void StartupModule() override;
    void ShutdownModule() override;

private:
    //
    void PreBeginPIE(bool bIsSimulating);

    void EndPIE(bool bIsSimulating);

    void OnPostEngineInit();

    TSharedPtr<puerts::FJsEnv> JsEnv;

    TSharedPtr<puerts::FSourceFileWatcher> SourceFileWatcher;

    bool Enabled = false;
};

IMPLEMENT_MODULE(FPuertsEditorModule, PuertsEditor)

void FPuertsEditorModule::StartupModule()
{
    Enabled = IPuertsModule::Get().IsWatchEnabled();

    FEditorDelegates::PreBeginPIE.AddRaw(this, &FPuertsEditorModule::PreBeginPIE);
    FEditorDelegates::EndPIE.AddRaw(this, &FPuertsEditorModule::EndPIE);
    FCoreDelegates::OnPostEngineInit.AddRaw(this, &FPuertsEditorModule::OnPostEngineInit);
}

TSharedPtr<FKismetCompilerContext> MakeCompiler(
    UBlueprint* InBlueprint, FCompilerResultsLog& InMessageLog, const FKismetCompilerOptions& InCompileOptions)
{
    return MakeShared<FTypeScriptCompilerContext>(CastChecked<UTypeScriptBlueprint>(InBlueprint), InMessageLog, InCompileOptions);
}

void FPuertsEditorModule::OnPostEngineInit()
{
    if (Enabled)
    {
        FKismetCompilerContext::RegisterCompilerForBP(UTypeScriptBlueprint::StaticClass(), &MakeCompiler);

        SourceFileWatcher = MakeShared<puerts::FSourceFileWatcher>(
            [this](const FString& InPath)
            {
                if (JsEnv.IsValid())
                {
                    TArray<uint8> Source;
                    if (FFileHelper::LoadFileToArray(Source, *InPath))
                    {
                        JsEnv->ReloadSource(InPath, std::string((const char*) Source.GetData(), Source.Num()));
                    }
                    else
                    {
                        UE_LOG(Puerts, Error, TEXT("read file fail for %s"), *InPath);
                    }
                }
            });
        JsEnv = MakeShared<puerts::FJsEnv>(std::make_shared<puerts::DefaultJSModuleLoader>(TEXT("JavaScript")),
            std::make_shared<puerts::FDefaultLogger>(), -1,
            [this](const FString& InPath)
            {
                if (SourceFileWatcher.IsValid())
                {
                    SourceFileWatcher->OnSourceLoaded(InPath);
                }
            });

        JsEnv->Start("PuertsEditor/CodeAnalyze");
    }
}

void FPuertsEditorModule::ShutdownModule()
{
    if (JsEnv.IsValid())
    {
        JsEnv.Reset();
    }
    if (SourceFileWatcher.IsValid())
    {
        SourceFileWatcher.Reset();
    }
}

void FPuertsEditorModule::PreBeginPIE(bool bIsSimulating)
{
    if (Enabled)
    {
    }
}

void FPuertsEditorModule::EndPIE(bool bIsSimulating)
{
}
