/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "PuertsModule.h"
#include "JsEnv.h"
#include "JsEnvGroup.h"
#include "PuertsSetting.h"
#if WITH_EDITOR
#include "Editor.h"
#include "ISettingsModule.h"
#include "ISettingsSection.h"
#endif

DEFINE_LOG_CATEGORY_STATIC(PuertsModule, Log, All);

#define LOCTEXT_NAMESPACE "FPuertsModule"

class FPuertsModule : public IPuertsModule, public FUObjectArray::FUObjectCreateListener, public FUObjectArray::FUObjectDeleteListener
{
    /** IModuleInterface implementation */
    void StartupModule() override;
    void ShutdownModule() override;

public:
    virtual void NotifyUObjectCreated(const class UObjectBase *InObject, int32 Index) override;
    virtual void NotifyUObjectDeleted(const class UObjectBase *InObject, int32 Index) override;

#if ENGINE_MINOR_VERSION > 22
    virtual void OnUObjectArrayShutdown() override;
#endif

#if WITH_EDITOR
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

    void ReloadModule(FName ModuleName, const FString& JsSource) override
    {
        if (Enabled)
        {
            if (JsEnv.IsValid())
            {
                //UE_LOG(PuertsModule, Warning, TEXT("Normal Mode ReloadModule"));
                JsEnv->ReloadModule(ModuleName, JsSource);
            }
            else if (NumberOfJsEnv > 1 && JsEnvGroup.IsValid())
            {
                //UE_LOG(PuertsModule, Warning, TEXT("Group Mode ReloadModule"));
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

	void MakeSharedJsEnv()
	{
		const UPuertsSetting& Settings = *GetDefault<UPuertsSetting>();

        JsEnv.Reset();
        JsEnvGroup.Reset();

        NumberOfJsEnv = (Settings.NumberOfJsEnv > 1 && Settings.NumberOfJsEnv < 10) ? Settings.NumberOfJsEnv : 1;

        if (NumberOfJsEnv > 1)
        {
            if (Settings.DebugEnable)
            {
                JsEnvGroup = MakeShared<puerts::FJsEnvGroup>(NumberOfJsEnv, std::make_unique<puerts::DefaultJSModuleLoader>(TEXT("JavaScript")), std::make_shared<puerts::FDefaultLogger>(), Settings.DebugPort);
            }
            else
            {
                JsEnvGroup = MakeShared<puerts::FJsEnvGroup>(NumberOfJsEnv);
            }

            if (Selector)
            {
                JsEnvGroup->SetJsEnvSelector(Selector);
            }

            //这种不支持等待
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
                JsEnv = MakeShared<puerts::FJsEnv>(std::make_unique<puerts::DefaultJSModuleLoader>(TEXT("JavaScript")), std::make_shared<puerts::FDefaultLogger>(), Settings.DebugPort);
            }
            else
            {
                JsEnv = MakeShared<puerts::FJsEnv>();
            }

            if (Settings.WaitDebugger)
            {
                JsEnv->WaitDebugger();
            }

            JsEnv->RebindJs();
            UE_LOG(PuertsModule, Log, TEXT("Normal Mode started!"));
        }
	}

private:
    TSharedPtr<puerts::FJsEnv> JsEnv;

    bool Enabled = false;

    int32 NumberOfJsEnv = 1;

    TSharedPtr<puerts::FJsEnvGroup> JsEnvGroup;
};

IMPLEMENT_MODULE( FPuertsModule, Puerts)

void FPuertsModule::NotifyUObjectCreated(const class UObjectBase *InObject, int32 Index) 
{
    if (Enabled)
    {
        if (JsEnv.IsValid())
        {
            //UE_LOG(PuertsModule, Warning, TEXT("Normal Mode TryBindJs"));
            JsEnv->TryBindJs(InObject);
        }
        else if (NumberOfJsEnv > 1 && JsEnvGroup.IsValid())
        {
            //UE_LOG(PuertsModule, Warning, TEXT("Group Mode TryBindJs"));
            JsEnvGroup->TryBindJs(InObject);
        }
    }
}

void FPuertsModule::NotifyUObjectDeleted(const class UObjectBase *InObject, int32 Index) 
{
    //UE_LOG(PuertsModule, Warning, TEXT("NotifyUObjectDeleted, %p"), InObject);
}

#if ENGINE_MINOR_VERSION > 22
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
void FPuertsModule::EndPIE(bool bIsSimulating)
{
    if (Enabled)
    {
        MakeSharedJsEnv();
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
    const FString PuertsConfigIniPath = FPaths::SourceConfigDir().Append(TEXT("DefaultPuerts.ini"));
    if (GConfig->DoesSectionExist(SectionName, PuertsConfigIniPath))
    {
        GConfig->GetBool(SectionName, TEXT("Enable"), Settings.Enable, PuertsConfigIniPath);
        GConfig->GetBool(SectionName, TEXT("DebugEnable"), Settings.DebugEnable, PuertsConfigIniPath);
        GConfig->GetBool(SectionName, TEXT("WaitDebugger"), Settings.WaitDebugger, PuertsConfigIniPath);
        if (!GConfig->GetInt(SectionName, TEXT("DebugPort"), Settings.DebugPort, PuertsConfigIniPath))
        {
            Settings.DebugPort = 8080;
        }
        if (!GConfig->GetInt(SectionName, TEXT("NumberOfJsEnv"), Settings.NumberOfJsEnv, PuertsConfigIniPath))
        {
            Settings.NumberOfJsEnv = 1;
        }
    }
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
#if WITH_EDITOR
    FEditorDelegates::EndPIE.AddRaw(this, &FPuertsModule::EndPIE);
    RegisterSettings();
#endif
    const UPuertsSetting& Settings = *GetDefault<UPuertsSetting>();

    if (Settings.Enable)
    {
        Enable();
    }

    //SetJsEnvSelector([this](UObject* Obj, int Size){
    //    return 1;
    //    });
}

void FPuertsModule::Enable()
{
    Enabled = true;
    MakeSharedJsEnv();
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

    if (Settings.Enable != Enabled)
    {
        if (Settings.Enable)
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
#endif
    if (Enabled)
    {
        Disable();
    }
}

