/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "PuertsModule.h"
#include "JsEnv.h"
#if WITH_EDITOR
#include "Editor.h"
#endif

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
#endif

    virtual bool IsEnabled() override 
    {
        return Enabled;
    }

    void ReloadJsModule(FName ModuleName) override 
    {
        if (JsEnv.IsValid())
        {
            JsEnv->ReloadModule(ModuleName);
        }
    }

private:
    TSharedPtr<puerts::FJsEnv> JsEnv;

    bool Enabled = false;
};

IMPLEMENT_MODULE( FPuertsModule, Puerts)

void FPuertsModule::NotifyUObjectCreated(const class UObjectBase *InObject, int32 Index) 
{
    if (Enabled)
    {
        JsEnv->TryBindJs(InObject);
    }
}

void FPuertsModule::NotifyUObjectDeleted(const class UObjectBase *InObject, int32 Index) 
{
    //UE_LOG(LogTemp, Warning, TEXT("NotifyUObjectDeleted, %p"), InObject);
}

#if ENGINE_MINOR_VERSION > 22
void FPuertsModule::OnUObjectArrayShutdown()
{
    if (Enabled)
    {
        GUObjectArray.RemoveUObjectCreateListener(static_cast<FUObjectArray::FUObjectCreateListener*>(this));
        GUObjectArray.RemoveUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
    }
}
#endif

#if WITH_EDITOR
void FPuertsModule::EndPIE(bool bIsSimulating)
{
    //if (Enabled)
    //{
        //UE_LOG(LogTemp, Error, TEXT("Reload All Module "));
        //JsEnv->ReloadModule(NAME_None);

        //JsEnv.Reset();
        //JsEnv = MakeShared<puerts::FJsEnv>();
        //JsEnv->RebindJs();
    //}
}
#endif

void FPuertsModule::StartupModule()
{
#if WITH_EDITOR
    FEditorDelegates::EndPIE.AddRaw(this, &FPuertsModule::EndPIE);
#endif
    if (Enabled)
    {
        JsEnv = MakeShared<puerts::FJsEnv>();
        GUObjectArray.AddUObjectCreateListener(static_cast<FUObjectArray::FUObjectCreateListener*>(this));
        GUObjectArray.AddUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
    }
}


void FPuertsModule::ShutdownModule()
{
    if (Enabled)
    {
        JsEnv.Reset();
    }
}

