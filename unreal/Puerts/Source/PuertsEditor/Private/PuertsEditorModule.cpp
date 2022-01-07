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
#include "PuertsModule.h"
#include "FileHelpers.h"
#include "TypeScriptCompilerContext.h"
#include "TypeScriptBlueprint.h"

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

        JsEnv = MakeShared<puerts::FJsEnv>();
        TArray<TPair<FString, UObject*>> Arguments;
        JsEnv->Start("PuertsEditor/CodeAnalyze", Arguments);
    }
}

void FPuertsEditorModule::ShutdownModule()
{
    if (JsEnv.IsValid())
    {
        JsEnv.Reset();
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
