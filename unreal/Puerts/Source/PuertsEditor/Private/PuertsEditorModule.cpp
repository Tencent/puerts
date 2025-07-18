/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
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
#include "Binding.hpp"
#include "UEDataBinding.hpp"
#include "Object.hpp"
#include "PString.h"

class FPuertsEditorModule : public IPuertsEditorModule
{
    /** IModuleInterface implementation */
    void StartupModule() override;
    void ShutdownModule() override;

    void SetCmdImpl(std::function<void(const FString&, const FString&)> Func) override
    {
        CmdImpl = Func;
    }

public:
    static void SetCmdCallback(std::function<void(const FString&, const FString&)> Func)
    {
        Get().SetCmdImpl(Func);
    }

private:
    //
    void PreBeginPIE(bool bIsSimulating);

    void EndPIE(bool bIsSimulating);

    void OnPostEngineInit();

    TSharedPtr<PUERTS_NAMESPACE::FJsEnv> JsEnv;

    TSharedPtr<PUERTS_NAMESPACE::FSourceFileWatcher> SourceFileWatcher;

    bool Enabled = false;

    std::function<void(const FString&, const FString&)> CmdImpl;

    TUniquePtr<FAutoConsoleCommand> ConsoleCommand;
};

UsingCppType(FPuertsEditorModule);

struct AutoRegisterForPEM
{
    AutoRegisterForPEM()
    {
        PUERTS_NAMESPACE::DefineClass<FPuertsEditorModule>()
            .Function("SetCmdCallback", MakeFunction(&FPuertsEditorModule::SetCmdCallback))
            .Register();
    }
};

AutoRegisterForPEM _AutoRegisterForPEM__;

IMPLEMENT_MODULE(FPuertsEditorModule, PuertsEditor)

void FPuertsEditorModule::StartupModule()
{
    Enabled = IPuertsModule::Get().IsWatchEnabled() && !IsRunningCommandlet();

    FEditorDelegates::PreBeginPIE.AddRaw(this, &FPuertsEditorModule::PreBeginPIE);
    FEditorDelegates::EndPIE.AddRaw(this, &FPuertsEditorModule::EndPIE);

    ConsoleCommand = MakeUnique<FAutoConsoleCommand>(TEXT("Puerts"), TEXT("Puerts action"),
        FConsoleCommandWithArgsDelegate::CreateLambda(
            [this](const TArray<FString>& Args)
            {
                if (CmdImpl)
                {
                    FString CmdForJs = TEXT("");
                    FString ArgsForJs = TEXT("");

                    if (Args.Num() > 0)
                    {
                        CmdForJs = Args[0];
                    }
                    if (Args.Num() > 1)
                    {
                        ArgsForJs = Args[1];
                    }
                    CmdImpl(CmdForJs, ArgsForJs);
                }
                else
                {
                    UE_LOG(Puerts, Error, TEXT("Puerts command not initialized"));
                }
            }));
    this->OnPostEngineInit();
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

        SourceFileWatcher = MakeShared<PUERTS_NAMESPACE::FSourceFileWatcher>(
            [this](const FString& InPath)
            {
                if (JsEnv.IsValid())
                {
                    TArray<uint8> Source;
                    if (FFileHelper::LoadFileToArray(Source, *InPath))
                    {
                        JsEnv->ReloadSource(InPath, puerts::PString((const char*) Source.GetData(), Source.Num()));
                    }
                    else
                    {
                        UE_LOG(Puerts, Error, TEXT("read file fail for %s"), *InPath);
                    }
                }
            });
        JsEnv = MakeShared<PUERTS_NAMESPACE::FJsEnv>(
            std::make_shared<PUERTS_NAMESPACE::DefaultJSModuleLoader>(TEXT("JavaScript")),
            std::make_shared<PUERTS_NAMESPACE::FDefaultLogger>(), -1,
            [this](const FString& InPath)
            {
                if (SourceFileWatcher.IsValid())
                {
                    SourceFileWatcher->OnSourceLoaded(InPath);
                }
            },
            TEXT("--max-old-space-size=2048"));

        JsEnv->Start("PuertsEditor/CodeAnalyze");
    }
}

void FPuertsEditorModule::ShutdownModule()
{
    CmdImpl = nullptr;
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
