/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PuertsModule.h"
#include "JsEnv.h"
#include "JsEnvGroup.h"
#include "PuertsSetting.h"
#if WITH_EDITOR
#include "Editor.h"
#include "ISettingsModule.h"
#include "ISettingsSection.h"
#include "Internationalization/Regex.h"
#include "LevelEditor.h"
#include "Misc/HotReloadInterface.h"
#include "GameDelegates.h"
#endif
#include "Commandlets/Commandlet.h"
#include "TypeScriptGeneratedClass.h"
#include "Runtime/Launch/Resources/Version.h"
#include "Misc/Paths.h"
#include "Misc/CommandLine.h"
#include "Misc/ConfigCacheIni.h"

DEFINE_LOG_CATEGORY_STATIC(PuertsModule, Log, All);

#define LOCTEXT_NAMESPACE "FPuertsModule"

class FPuertsModule : public IPuertsModule,
                      public FUObjectArray::FUObjectCreateListener,
                      public FUObjectArray::FUObjectDeleteListener
{
    /** IModuleInterface implementation */
    void StartupModule() override;
    void ShutdownModule() override;

public:
    virtual void NotifyUObjectCreated(const class UObjectBase* InObject, int32 Index) override;
    virtual void NotifyUObjectDeleted(const class UObjectBase* InObject, int32 Index) override;

#if ENGINE_MINOR_VERSION > 22 || ENGINE_MAJOR_VERSION > 4
    virtual void OnUObjectArrayShutdown() override;
#endif

#if WITH_EDITOR
    bool bIsInPIE = false;

    virtual bool IsInPIE() override
    {
        return bIsInPIE;
    }

    void PreBeginPIE(bool bIsSimulating);
    void EndPIE(bool bIsSimulating);
    bool HandleSettingsSaved();
#endif

    void RegisterSettings();

    void UnregisterSettings();

    void Enable();

    void Disable();

    virtual bool IsEnabled() override
    {
        return Enabled;
    }

    virtual bool IsWatchEnabled() override
    {
        return Enabled && WatchEnabled;
    }

    void ReloadModule(FName ModuleName, const FString& JsSource) override
    {
        if (Enabled)
        {
            if (JsEnv.IsValid())
            {
                // UE_LOG(PuertsModule, Warning, TEXT("Normal Mode ReloadModule"));
                JsEnv->ReloadModule(ModuleName, JsSource);
            }
            else if (NumberOfJsEnv > 1 && JsEnvGroup.IsValid())
            {
                // UE_LOG(PuertsModule, Warning, TEXT("Group Mode ReloadModule"));
                JsEnvGroup->ReloadModule(ModuleName, JsSource);
            }
        }
    }

    void InitExtensionMethodsMap() override
    {
        if (Enabled)
        {
            if (JsEnv.IsValid())
            {
                JsEnv->InitExtensionMethodsMap();
            }
            else if (NumberOfJsEnv > 1 && JsEnvGroup.IsValid())
            {
                JsEnvGroup->InitExtensionMethodsMap();
            }
        }
    }

    std::function<int(UObject*, int)> Selector;

    void SetJsEnvSelector(std::function<int(UObject*, int)> InSelector) override
    {
        if (Enabled && NumberOfJsEnv > 1 && JsEnvGroup.IsValid())
        {
            JsEnvGroup->SetJsEnvSelector(InSelector);
        }
        Selector = InSelector;
    }

    int32 GetDebuggerPortFromCommandLine()
    {
        int32 Result = -1;

        /**
         * get command line
         */
        TArray<FString> OutTokens;
        TArray<FString> OutSwitches;
        TMap<FString, FString> OutParams;
        UCommandlet::ParseCommandLine(FCommandLine::Get(), OutTokens, OutSwitches, OutParams);

#if WITH_EDITOR
        static const auto GetPIEInstanceID = [](const TArray<FString>& InTokens) -> int32
        {
            static const int32 Start = FString{TEXT("PIEGameUserSettings")}.Len();
            static const int32 BaseCount = FString{TEXT("PIEGameUserSettings.ini")}.Len();

            const FString* TokenPtr =
                InTokens.FindByPredicate([](const FString& InToken) { return InToken.StartsWith(TEXT("GameUserSettingsINI=")); });
            if (TokenPtr == nullptr)
            {
                return INDEX_NONE;
            }

            const FRegexPattern GameUserSettingsPattern{TEXT("PIEGameUserSettings[0-9]+\\.ini")};
            FRegexMatcher GameUserSettingsMatcher{GameUserSettingsPattern, *TokenPtr};
            if (GameUserSettingsMatcher.FindNext())
            {
                const FString GameUserSettingsFile = GameUserSettingsMatcher.GetCaptureGroup(0);
                return FCString::Atoi(*GameUserSettingsFile.Mid(Start, GameUserSettingsFile.Len() - BaseCount));
            }

            return INDEX_NONE;
        };

        const bool bPIEGame = OutSwitches.Find(TEXT("PIEVIACONSOLE")) != INDEX_NONE && OutSwitches.Find(TEXT("game")) != INDEX_NONE;
        if (bPIEGame)
        {
            const int32 Index = GetPIEInstanceID(OutTokens);
            if (OutSwitches.Find(TEXT("server")) != INDEX_NONE)
            {
                Result += 999;    // for server, we add 999, 8080 -> 9079
            }
            else
            {
                Result += 10 * (Index + 1);    //  for client, we add 10 for each new process, 8080 -> 8090, 8100, 8110
            }
        }
#endif

        // we can also specify the debug port via command line, -JsEnvDebugPort

        static const FString DebugPortParam{TEXT("JsEnvDebugPort")};
        if (OutParams.Contains(DebugPortParam))
        {
            Result = FCString::Atoi(*OutParams[DebugPortParam]);
        }

        return Result;
    }

    virtual void MakeSharedJsEnv() override
    {
        const UPuertsSetting& Settings = *GetDefault<UPuertsSetting>();

        JsEnv.Reset();
        JsEnvGroup.Reset();

        NumberOfJsEnv = (Settings.NumberOfJsEnv > 1 && Settings.NumberOfJsEnv < 10) ? Settings.NumberOfJsEnv : 1;

        if (NumberOfJsEnv > 1)
        {
            if (Settings.DebugEnable)
            {
                JsEnvGroup = MakeShared<PUERTS_NAMESPACE::FJsEnvGroup>(NumberOfJsEnv,
                    std::make_shared<PUERTS_NAMESPACE::DefaultJSModuleLoader>(Settings.RootPath),
                    std::make_shared<PUERTS_NAMESPACE::FDefaultLogger>(),
                    DebuggerPortFromCommandLine < 0 ? Settings.DebugPort : DebuggerPortFromCommandLine);
            }
            else
            {
                JsEnvGroup = MakeShared<PUERTS_NAMESPACE::FJsEnvGroup>(NumberOfJsEnv, Settings.RootPath);
            }

            if (Selector)
            {
                JsEnvGroup->SetJsEnvSelector(Selector);
            }

            // 这种不支持等待
            if (Settings.WaitDebugger)
            {
                UE_LOG(PuertsModule, Warning, TEXT("Do not support WaitDebugger in Group Mode!"));
            }

            JsEnvGroup->RebindJs();
            UE_LOG(PuertsModule, Log, TEXT("Group Mode started! Number of JsEnv is %d"), NumberOfJsEnv);
        }
        else
        {
            if (Settings.DebugEnable)
            {
                JsEnv = MakeShared<PUERTS_NAMESPACE::FJsEnv>(
                    std::make_shared<PUERTS_NAMESPACE::DefaultJSModuleLoader>(Settings.RootPath),
                    std::make_shared<PUERTS_NAMESPACE::FDefaultLogger>(),
                    DebuggerPortFromCommandLine < 0 ? Settings.DebugPort : DebuggerPortFromCommandLine);
            }
            else
            {
                JsEnv = MakeShared<PUERTS_NAMESPACE::FJsEnv>(Settings.RootPath);
            }

            if (Settings.WaitDebugger)
            {
                JsEnv->WaitDebugger(Settings.WaitDebuggerTimeout);
            }

            JsEnv->RebindJs();
            UE_LOG(PuertsModule, Log, TEXT("Normal Mode started!"));
        }
    }

    virtual const TArray<FString>& GetIgnoreClassListOnDTS()
    {
        return GetDefault<UPuertsSetting>()->IgnoreClassListOnDTS;
    }

    virtual const TArray<FString>& GetIgnoreStructListOnDTS()
    {
        return GetDefault<UPuertsSetting>()->IgnoreStructListOnDTS;
    }

private:
    TSharedPtr<PUERTS_NAMESPACE::FJsEnv> JsEnv;

    bool Enabled = false;

    bool WatchEnabled = true;

    int32 NumberOfJsEnv = 1;

    TSharedPtr<PUERTS_NAMESPACE::FJsEnvGroup> JsEnvGroup;

    int32 DebuggerPortFromCommandLine = -1;
};

IMPLEMENT_MODULE(FPuertsModule, Puerts)

void FPuertsModule::NotifyUObjectCreated(const class UObjectBase* InObject, int32 Index)
{
    if (Enabled)
    {
        if (JsEnv.IsValid())
        {
            // UE_LOG(PuertsModule, Warning, TEXT("Normal Mode TryBindJs"));
            JsEnv->TryBindJs(InObject);
        }
        else if (NumberOfJsEnv > 1 && JsEnvGroup.IsValid())
        {
            // UE_LOG(PuertsModule, Warning, TEXT("Group Mode TryBindJs"));
            JsEnvGroup->TryBindJs(InObject);
        }
    }
}

void FPuertsModule::NotifyUObjectDeleted(const class UObjectBase* InObject, int32 Index)
{
    // UE_LOG(PuertsModule, Warning, TEXT("NotifyUObjectDeleted, %p"), InObject);
}

#if ENGINE_MINOR_VERSION > 22 || ENGINE_MAJOR_VERSION > 4
void FPuertsModule::OnUObjectArrayShutdown()
{
    if (Enabled)
    {
        GUObjectArray.RemoveUObjectCreateListener(static_cast<FUObjectArray::FUObjectCreateListener*>(this));
        GUObjectArray.RemoveUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
        Enabled = false;
    }
}
#endif

#if WITH_EDITOR
void FPuertsModule::PreBeginPIE(bool bIsSimulating)
{
    bIsInPIE = true;
    if (Enabled)
    {
        MakeSharedJsEnv();
        UE_LOG(PuertsModule, Display, TEXT("JsEnv created"));
    }
}
void FPuertsModule::EndPIE(bool bIsSimulating)
{
    bIsInPIE = false;
    if (Enabled)
    {
        JsEnv.Reset();
        for (TObjectIterator<UClass> It; It; ++It)
        {
            UClass* Class = *It;
            if (auto TsClass = Cast<UTypeScriptGeneratedClass>(Class))
            {
                TsClass->CancelRedirection();
                TsClass->DynamicInvoker.Reset();
            }
            if (Class->ClassConstructor == UTypeScriptGeneratedClass::StaticConstructor)
            {
                auto SuperClass = Class->GetSuperClass();
                while (SuperClass)
                {
                    if (SuperClass->ClassConstructor != UTypeScriptGeneratedClass::StaticConstructor)
                    {
                        Class->ClassConstructor = SuperClass->ClassConstructor;
                        break;
                    }
                    SuperClass = SuperClass->GetSuperClass();
                }
                if (Class->ClassConstructor == UTypeScriptGeneratedClass::StaticConstructor)
                {
                    Class->ClassConstructor = nullptr;
                }
            }
        }
        UE_LOG(PuertsModule, Display, TEXT("JsEnv reset"));
    }
}
#endif

void FPuertsModule::RegisterSettings()
{
#if WITH_EDITOR
    if (ISettingsModule* SettingsModule = FModuleManager::GetModulePtr<ISettingsModule>("Settings"))
    {
        auto SettingsSection = SettingsModule->RegisterSettings("Project", "Plugins", "Puerts",
            LOCTEXT("TileSetEditorSettingsName", "Puerts Settings"),
            LOCTEXT("TileSetEditorSettingsDescription", "Configure the setting of Puerts plugin."),
            GetMutableDefault<UPuertsSetting>());

        SettingsSection->OnModified().BindRaw(this, &FPuertsModule::HandleSettingsSaved);
    }
#endif
    UPuertsSetting& Settings = *GetMutableDefault<UPuertsSetting>();
    const TCHAR* SectionName = TEXT("/Script/Puerts.PuertsSetting");
#if (ENGINE_MAJOR_VERSION == 5 && ENGINE_MINOR_VERSION >= 1) || ENGINE_MAJOR_VERSION > 5
    const FString PuertsConfigIniPath =
        FConfigCacheIni::NormalizeConfigIniPath(FPaths::SourceConfigDir().Append(TEXT("DefaultPuerts.ini")));
#else
    const FString PuertsConfigIniPath = FPaths::SourceConfigDir().Append(TEXT("DefaultPuerts.ini"));
#endif
    if (GConfig->DoesSectionExist(SectionName, PuertsConfigIniPath))
    {
        GConfig->GetBool(SectionName, TEXT("AutoModeEnable"), Settings.AutoModeEnable, PuertsConfigIniPath);
        FString Text;
        GConfig->GetBool(SectionName, TEXT("DebugEnable"), Settings.DebugEnable, PuertsConfigIniPath);
        GConfig->GetBool(SectionName, TEXT("WaitDebugger"), Settings.WaitDebugger, PuertsConfigIniPath);
        GConfig->GetDouble(SectionName, TEXT("WaitDebuggerTimeout"), Settings.WaitDebuggerTimeout, PuertsConfigIniPath);
        if (!GConfig->GetInt(SectionName, TEXT("DebugPort"), Settings.DebugPort, PuertsConfigIniPath))
        {
            Settings.DebugPort = 8080;
        }
        if (!GConfig->GetInt(SectionName, TEXT("NumberOfJsEnv"), Settings.NumberOfJsEnv, PuertsConfigIniPath))
        {
            Settings.NumberOfJsEnv = 1;
        }
        GConfig->GetBool(SectionName, TEXT("WatchDisable"), Settings.WatchDisable, PuertsConfigIniPath);
    }

    DebuggerPortFromCommandLine = GetDebuggerPortFromCommandLine();
}

void FPuertsModule::UnregisterSettings()
{
#if WITH_EDITOR
    if (ISettingsModule* SettingsModule = FModuleManager::GetModulePtr<ISettingsModule>("Settings"))
    {
        SettingsModule->UnregisterSettings("Project", "Plugins", "Puerts");
    }
#endif
}

void FPuertsModule::StartupModule()
{
    // NonPak Game 打包下, Puerts ini的加载时间晚于模块加载, 因此依然要显式的执行ini的读入, 去保证CDO里的值是正确的
    RegisterSettings();

    const UPuertsSetting& Settings = *GetDefault<UPuertsSetting>();

#if WITH_EDITOR
    if (!IsRunningGame())
    {
        FEditorDelegates::PreBeginPIE.AddRaw(this, &FPuertsModule::PreBeginPIE);
        FEditorDelegates::EndPIE.AddRaw(this, &FPuertsModule::EndPIE);

        // FEditorSupportDelegates::CleanseEditor.AddRaw(this, &FPuertsModule::CleanseEditor);
        // FLevelEditorModule& LevelEditor = FModuleManager::LoadModuleChecked<FLevelEditorModule>("LevelEditor");
        // LevelEditor.OnMapChanged().AddRaw(this, &FPuertsModule::HandleMapChanged);
    }
#endif

#if WITH_HOT_RELOAD
#if ENGINE_MAJOR_VERSION >= 5
    FCoreUObjectDelegates::ReloadCompleteDelegate.AddLambda(
        [&](EReloadCompleteReason)
#else
    IHotReloadInterface& HotReloadSupport = FModuleManager::LoadModuleChecked<IHotReloadInterface>("HotReload");
    HotReloadSupport.OnHotReload().AddLambda(
        [&](bool)
#endif
        {
            if (Enabled)
            {
                MakeSharedJsEnv();
            }
        });
#endif

    if (Settings.AutoModeEnable)
    {
        Enable();
    }

    WatchEnabled = !Settings.WatchDisable;

    // SetJsEnvSelector([this](UObject* Obj, int Size){
    //    return 1;
    //    });
}

void FPuertsModule::Enable()
{
    Enabled = true;

#if WITH_EDITOR
    if (IsRunningGame())
    {
        // 处理 Standalone 模式的情况
        MakeSharedJsEnv();
    }
#else
    MakeSharedJsEnv();
#endif

    GUObjectArray.AddUObjectCreateListener(static_cast<FUObjectArray::FUObjectCreateListener*>(this));
    GUObjectArray.AddUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
}

void FPuertsModule::Disable()
{
    Enabled = false;
    JsEnv.Reset();
    JsEnvGroup.Reset();
    GUObjectArray.RemoveUObjectCreateListener(static_cast<FUObjectArray::FUObjectCreateListener*>(this));
    GUObjectArray.RemoveUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
}

#if WITH_EDITOR
bool FPuertsModule::HandleSettingsSaved()
{
    const UPuertsSetting& Settings = *GetDefault<UPuertsSetting>();

    if (Settings.AutoModeEnable != Enabled)
    {
        if (Settings.AutoModeEnable)
        {
            Enable();
        }
        else
        {
            Disable();
        }
    }
    return true;
}
#endif

void FPuertsModule::ShutdownModule()
{
#if WITH_EDITOR
    UnregisterSettings();
    if (FLevelEditorModule* LevelEditor = FModuleManager::GetModulePtr<FLevelEditorModule>("LevelEditor"))
    {
        LevelEditor->OnMapChanged().RemoveAll(this);
    }
#endif
    if (Enabled)
    {
        Disable();
    }
}
