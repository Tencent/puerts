/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "WasmCore.h"
#include "WasmEnv.h"
#include "WasmRuntime.h"
#include "WasmModuleInstance.h"
#include "WasmFunction.h"

#define LOCTEXT_NAMESPACE "WasmCoreModule"

void WasmCoreModule::StartupModule()
{
    /*if (false)
    {
        WasmEnv* Env = new WasmEnv();
        WasmRuntime* Runtime = new WasmRuntime(Env);
        {
            TArray<uint8> Data;
            if (FFileHelper::LoadFileToArray(Data, *(FPaths::ProjectContentDir() / TEXT("JavaScript/wasm/main.wasm"))))
            {
                WasmModuleInstance* Instance = new WasmModuleInstance(Data);
                if (!Instance->ParseModule(Env) || !Instance->LoadModule(Runtime, 0))
                {
                    delete Instance;
                }
            }
        }

        {
            TArray<uint8> Data;
            if (FFileHelper::LoadFileToArray(Data, *(FPaths::ProjectContentDir() / TEXT("JavaScript/wasm/testvector.wasm"))))
            {
                WasmModuleInstance* Instance = new WasmModuleInstance(Data);
                if (Instance->ParseModule(Env) && Instance->LoadModule(Runtime, 0))
                {
                    float a = Instance->GetAllExportFunctions()[TEXT("TestVector")]->Call<float, FVector>(FVector(1, 2, 3));
                    UE_LOG(LogTemp, Warning, TEXT("sss %f"), a);
                }
                else
                {
                    delete Instance;
                }
            }
        }
        delete Runtime;
        delete Env;
    }*/
}

void WasmCoreModule::ShutdownModule()
{
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(WasmCoreModule, WasmCore)