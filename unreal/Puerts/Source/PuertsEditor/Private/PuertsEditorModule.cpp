/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "PuertsEditorModule.h"
#include "JsEnv.h"
#include "Editor.h"
#include "PuertsModule.h"

class FPuertsEditorModule : public IPuertsEditorModule
{
    /** IModuleInterface implementation */
    void StartupModule() override;
    void ShutdownModule() override;

private:
    //
    void PreBeginPIE(bool bIsSimulating);

    void EndPIE(bool bIsSimulating);

    TSharedPtr<puerts::FJsEnv> JsEnv;

    bool Enabled = false;
};

IMPLEMENT_MODULE(FPuertsEditorModule, PuertsEditor)

void FPuertsEditorModule::StartupModule()
{
    Enabled  = IPuertsModule::Get().IsEnabled();

    FEditorDelegates::PreBeginPIE.AddRaw(this, &FPuertsEditorModule::PreBeginPIE);
    FEditorDelegates::EndPIE.AddRaw(this, &FPuertsEditorModule::EndPIE);

    //if (Enabled)
    //{

    //}
}


void FPuertsEditorModule::ShutdownModule()
{
    //if (Enabled)
    //{
        
    //}
}

void FPuertsEditorModule::PreBeginPIE(bool bIsSimulating)
{
    if (Enabled)
    {
        //JsEnv = MakeShared<puerts::FJsEnv>();
        //TArray<TPair<FString, UObject*>> Arguments;
        //JsEnv->Start("PuertsEditor/CodeAnalyze", Arguments);
    }
}

void FPuertsEditorModule::EndPIE(bool bIsSimulating)
{
    if (JsEnv.IsValid())
    {
        JsEnv.Reset();
    }
}

