/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JsEnvModule.h"
//#include "TGameJSCorePCH.h"


#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
#pragma warning(push, 0)     
#include "v8.h"
#include "libplatform/libplatform.h"
#pragma warning(pop)
#endif

//DEFINE_LOG_CATEGORY(Javascript)

class FJsEnvModule : public IJsEnvModule
{
    /** IModuleInterface implementation */
    void StartupModule() override;
    void ShutdownModule() override;

#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
public:
    void* GetV8Platform() override;

private:
    std::unique_ptr<v8::Platform> platform_;
#endif
};

IMPLEMENT_MODULE( FJsEnvModule, JsEnv)



void FJsEnvModule::StartupModule()
{
    // This code will execute after your module is loaded into memory (but after global variables are initialized, of course.)
#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
    platform_ = v8::platform::NewDefaultPlatform();
    v8::V8::InitializePlatform(platform_.get());
    v8::V8::Initialize();
#endif
}


void FJsEnvModule::ShutdownModule()
{
    // This function may be called during shutdown to clean up your module.  For modules that support dynamic reloading,
    // we call this function before unloading the module.
#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
    v8::V8::Dispose();
    v8::V8::ShutdownPlatform();
#endif
}

#if PLATFORM_ANDROID || PLATFORM_WINDOWS || PLATFORM_IOS || PLATFORM_MAC || PLATFORM_LINUX
void* FJsEnvModule::GetV8Platform()
{
    return reinterpret_cast<void*>(platform_.get());
}
#endif

