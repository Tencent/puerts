/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JsEnvImpl.h"
#include "JsEnvModule.h"
#include "DynamicDelegateProxy.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "StructWrapper.h"
#include "DelegateWrapper.h"
#include "ContainerWrapper.h"
#include "V8Utils.h"
#include "Engine/Engine.h"
#include "ObjectMapper.h"
#include "JSLogger.h"
#include "TickerDelegateWrapper.h"
#include "Async/Async.h"
#include "JSGeneratedClass.h"
#include "JSAnimGeneratedClass.h"
#include "JSWidgetGeneratedClass.h"
#include "JSGeneratedFunction.h"
#include "JSClassRegister.h"
#include "PromiseRejectCallback.hpp"
#include "TypeScriptObject.h"
#include "TypeScriptGeneratedClass.h"
#include "ContainerMeta.h"
#include "Engine/UserDefinedEnum.h"

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "V8InspectorImpl.h"

#if !defined(WITH_NODEJS)

#if V8_MAJOR_VERSION < 8

#if PLATFORM_WINDOWS
#include "Blob/Win64/NativesBlob.h"
#include "Blob/Win64/SnapshotBlob.h"
#elif PLATFORM_ANDROID_ARM
#include "Blob/Android/armv7a/NativesBlob.h"
#include "Blob/Android/armv7a/SnapshotBlob.h"
#elif PLATFORM_ANDROID_ARM64
#include "Blob/Android/arm64/NativesBlob.h"
#include "Blob/Android/arm64/SnapshotBlob.h"
#elif PLATFORM_MAC
#include "Blob/macOS/NativesBlob.h"
#include "Blob/macOS/SnapshotBlob.h"
#elif PLATFORM_IOS
#include "Blob/iOS/arm64/NativesBlob.h"
#include "Blob/iOS/arm64/SnapshotBlob.h"
#elif PLATFORM_LINUX
#include "Blob/Linux/NativesBlob.h"
#include "Blob/Linux/SnapshotBlob.h"
#endif

#else

#if PLATFORM_WINDOWS
#include "Blob/Win64MD/SnapshotBlob.h"
#elif PLATFORM_ANDROID_ARM
#include "Blob/Android/armv7a/SnapshotBlob.h"
#elif PLATFORM_ANDROID_ARM64
#include "Blob/Android/arm64/SnapshotBlob.h"
#elif PLATFORM_MAC
#include "Blob/macOS/SnapshotBlob.h"
#elif PLATFORM_IOS
#include "Blob/iOS/arm64/SnapshotBlob.h"
#elif PLATFORM_LINUX
#include "Blob/Linux/SnapshotBlob.h"
#endif

#endif

#endif

namespace puerts
{

FJsEnvImpl::FJsEnvImpl(const FString &ScriptRoot):FJsEnvImpl(std::make_shared<DefaultJSModuleLoader>(ScriptRoot), std::make_shared<FDefaultLogger>(), -1, nullptr, nullptr)
{
}

FJsEnvImpl::FJsEnvImpl(std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InDebugPort,
    void* InExternalRuntime, void* InExternalContext)
{
    GUObjectArray.AddUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));

#if PLATFORM_IOS
    std::string Flags = "--jitless";
    v8::V8::SetFlagsFromString(Flags.c_str(), static_cast<int>(Flags.size()));
#endif

    Started = false;
    Inspector = nullptr;
    InspectorChannel = nullptr;

    ModuleLoader = std::move(InModuleLoader);
    Logger = InLogger;
#if !defined(WITH_NODEJS)
#if V8_MAJOR_VERSION < 8
    std::unique_ptr<v8::StartupData> NativesBlob;
    if (!NativesBlob)
    {
        NativesBlob = std::make_unique<v8::StartupData>();
        NativesBlob->data = (const char *)NativesBlobCode;
        NativesBlob->raw_size = sizeof(NativesBlobCode);
    }
    v8::V8::SetNativesDataBlob(NativesBlob.get());
#endif
    std::unique_ptr<v8::StartupData> SnapshotBlob;
    if (!SnapshotBlob)
    {
        SnapshotBlob = std::make_unique<v8::StartupData>();
        SnapshotBlob->data = (const char *)SnapshotBlobCode;
        SnapshotBlob->raw_size = sizeof(SnapshotBlobCode);
    }

    // 初始化Isolate和DefaultContext
    v8::V8::SetSnapshotDataBlob(SnapshotBlob.get());

    CreateParams.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
#if WITH_QUICKJS
    MainIsolate = InExternalRuntime ? v8::Isolate::New(InExternalRuntime) : v8::Isolate::New(CreateParams);
#else
    check(!InExternalRuntime && !InExternalContext);
    MainIsolate = v8::Isolate::New(CreateParams);
#endif
    auto Isolate = MainIsolate;
    Isolate->SetData(0, static_cast<IObjectMapper*>(this));//直接传this会有问题，强转后地址会变

    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);

#if WITH_QUICKJS
    v8::Local<v8::Context> Context = (InExternalRuntime && InExternalContext) ? v8::Context::New(Isolate, InExternalContext) : v8::Context::New(Isolate);
#else
    v8::Local<v8::Context> Context = v8::Context::New(Isolate);
#endif
#else
    int Argc = 1;
    const char* Argv[] = {"puerts"};
    std::vector<std::string> Args(Argv, Argv + Argc);
    std::vector<std::string> ExecArgs;
    std::vector<std::string> Errors;

    const int Ret = uv_loop_init(&NodeUVLoop);
    if (Ret != 0)
    {
        Logger->Error(FString::Printf(TEXT("Failed to initialize loop: %s\n"),
                UTF8_TO_TCHAR(uv_err_name(Ret))));
        return;
    }

    CreateParams.array_buffer_allocator = nullptr;
    NodeArrayBufferAllocator = node::ArrayBufferAllocator::Create();

    auto Platform = static_cast<node::MultiIsolatePlatform*>(IJsEnvModule::Get().GetV8Platform());
    MainIsolate = node::NewIsolate(NodeArrayBufferAllocator.get(), &NodeUVLoop,
        Platform);

    auto Isolate = MainIsolate;
    Isolate->SetData(0, static_cast<IObjectMapper*>(this));//直接传this会有问题，强转后地址会变

    //v8::Locker locker(Isolate);
    //difference from embedding example, if lock, blow check fail:  
    //Utils::ApiCheck(
    //!v8::Locker::IsActive() ||
    //    internal_isolate->thread_manager()->IsLockedByCurrentThread() ||
    //    internal_isolate->serializer_enabled(),
    //"HandleScope::HandleScope",
    //"Entering the V8 API without proper locking in place");

    v8::Isolate::Scope Isolatescope(Isolate);

    NodeIsolateData = node::CreateIsolateData(Isolate, &NodeUVLoop, Platform, NodeArrayBufferAllocator.get()); // node::FreeIsolateData

    v8::HandleScope HandleScope(Isolate);

    v8::Local<v8::Context> Context = node::NewContext(Isolate);
    
#endif

    DefaultContext.Reset(Isolate, Context);

    v8::Context::Scope ContextScope(Context);

#if defined(WITH_NODEJS)
    //kDefaultFlags = kOwnsProcessState | kOwnsInspector, if kOwnsInspector set, inspector_agent.cc:681 CHECK_EQ(start_io_thread_async_initialized.exchange(true), false) fail!
    NodeEnv = CreateEnvironment(NodeIsolateData, Context, Args, ExecArgs, node::EnvironmentFlags::kOwnsProcessState);

    v8::MaybeLocal<v8::Value> LoadenvRet = node::LoadEnvironment(
        NodeEnv,
        "const publicRequire ="
        "  require('module').createRequire(process.cwd() + '/');"
        "globalThis.require = publicRequire;"
        "globalThis.embedVars = { nön_ascıı: '🏳️‍🌈' };"
        "require('vm').runInThisContext(process.argv[1]);");

    if (LoadenvRet.IsEmpty())  // There has been a JS exception.
    {
        return;
    }

    //the same as raw v8
    Isolate->SetMicrotasksPolicy(v8::MicrotasksPolicy::kAuto);
#endif
    
    v8::Local<v8::Object> Global = Context->Global();

    v8::Local<v8::Object> PuertsObj = v8::Object::New(Isolate);
    Global->Set(Context, FV8Utils::InternalString(Isolate, "puerts"), PuertsObj)
        .Check();

    auto This = v8::External::New(Isolate, this);

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsEvalScript"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->EvalScript(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsLog"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->Log(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsLoadModule"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->LoadModule(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsLoadUEType"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->LoadUEType(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsLoadCDataType"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->CppObjectMapper.LoadCppType(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsUEClassToJSClass"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->UEClassToJSClass(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsNewContainer"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->NewContainer(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsMergeObject"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->MergeObject(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsNewObject"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->NewObjectByClass(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsNewStruct"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->NewStructByScriptStruct(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsMakeUClass"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->MakeUClass(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsFindModule"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->FindModule(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsSetInspectorCallback"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->SetInspectorCallback(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsDispatchProtocolMessage"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->DispatchProtocolMessage(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Isolate->SetPromiseRejectCallback(&PromiseRejectCallback<FJsEnvImpl>);
    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsSetPromiseRejectCallback"), v8::FunctionTemplate::New(Isolate, &SetPromiseRejectCallback<FJsEnvImpl>)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "setTimeout"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->SetTimeout(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "clearTimeout"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->ClearInterval(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "setInterval"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->SetInterval(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "clearInterval"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->ClearInterval(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "dumpStatisticsLog"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->DumpStatisticsLog(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    PuertsObj->Set(Context, FV8Utils::ToV8String(Isolate, "releaseManualReleaseDelegate"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = static_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->ReleaseManualReleaseDelegate(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    ArrayTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FScriptArrayWrapper::ToFunctionTemplate(Isolate));

    SetTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FScriptSetWrapper::ToFunctionTemplate(Isolate));

    MapTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FScriptMapWrapper::ToFunctionTemplate(Isolate));

    FixSizeArrayTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FFixSizeArrayWrapper::ToFunctionTemplate(Isolate));

    CppObjectMapper.Initialize(Isolate, Context);
    
    DelegateTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FDelegateWrapper::ToFunctionTemplate(Isolate));

    MulticastDelegateTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FMulticastDelegateWrapper::ToFunctionTemplate(Isolate));

    DynamicInvoker = MakeShared<DynamicInvokerImpl>(this);
    TsDynamicInvoker = MakeShared<TsDynamicInvokerImpl>(this);

    Inspector = CreateV8Inspector(InDebugPort, &Context);

    ExecuteModule("puerts/first_run.js");
#if !defined(WITH_NODEJS)
    ExecuteModule("puerts/polyfill.js");
#endif
    ExecuteModule("puerts/log.js");
    ExecuteModule("puerts/modular.js");
    ExecuteModule("puerts/uelazyload.js");
    ExecuteModule("puerts/events.js");
    ExecuteModule("puerts/promises.js");
    ExecuteModule("puerts/argv.js");
    ExecuteModule("puerts/jit_stub.js");
    ExecuteModule("puerts/hot_reload.js");

    Require.Reset(Isolate, PuertsObj->Get(Context, FV8Utils::ToV8String(Isolate, "__require")).ToLocalChecked().As<v8::Function>());

    ReloadJs.Reset(Isolate, PuertsObj->Get(Context, FV8Utils::ToV8String(Isolate, "__reload")).ToLocalChecked().As<v8::Function>());

    DelegateProxysCheckerHandler = FTicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateRaw(this, &FJsEnvImpl::CheckDelegateProxys), 1);

#if defined(WITH_NODEJS)
    UVLoopCallbackHandler = FTicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateLambda([this](float) -> bool
    {
        uv_run(&this->NodeUVLoop, UV_RUN_NOWAIT);
        return true;
    }), UV_LOOP_DELAY);
#endif

    ManualReleaseCallbackMap.Reset(Isolate, v8::Map::New(Isolate));

    AsyncLoadingFlushUpdateHandle = FCoreDelegates::OnAsyncLoadingFlushUpdate.AddRaw(this, &FJsEnvImpl::OnAsyncLoadingFlushUpdate);

    UserObjectRetainer.SetName(TEXT("Puerts_UserObjectRetainer"));
    SysObjectRetainer.SetName(TEXT("Puerts_SysObjectRetainer"));
}

// #lizard forgives
FJsEnvImpl::~FJsEnvImpl()
{
    FCoreDelegates::OnAsyncLoadingFlushUpdate.Remove(AsyncLoadingFlushUpdateHandle);

    for(int i = 0; i < ManualReleaseCallbackList.size(); i++)
    {
        if (ManualReleaseCallbackList[i].IsValid())
        {
            ManualReleaseCallbackList[i].Get()->JsFunction.Reset();
        }
    }
    ManualReleaseCallbackMap.Reset();
    InspectorMessageHandler.Reset();
    Require.Reset();
    ReloadJs.Reset();
    JsPromiseRejectCallback.Reset();

#if defined(WITH_NODEJS)
    FTicker::GetCoreTicker().RemoveTicker(UVLoopCallbackHandler);
#endif

    FTicker::GetCoreTicker().RemoveTicker(DelegateProxysCheckerHandler);

    {
        auto Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        for (auto Iter = ClassToTemplateMap.begin(); Iter != ClassToTemplateMap.end(); Iter++)
        {
            Iter->second.Reset();
        }

        CppObjectMapper.UnInitialize(Isolate);

        for (auto Iter = ObjectMap.begin(); Iter != ObjectMap.end(); Iter++)
        {
            Iter->second.Reset();
        }

        for (auto Iter = GeneratedObjectMap.begin(); Iter != GeneratedObjectMap.end(); Iter++)
        {
            Iter->second.Reset();
        }
        GeneratedObjectMap.clear();

        for (auto Iter = StructMap.begin(); Iter != StructMap.end(); Iter++)
        {
            Iter->second.Reset();
        }

        for (auto Iter = ScriptStructTypeMap.begin(); Iter != ScriptStructTypeMap.end(); Iter++)
        {
            if (Iter->second.IsValid())
            {
                Iter->second.Get()->DestroyStruct(Iter->first);
                FMemory::Free(Iter->first);
            }
        }

        for (auto Iter = DelegateMap.begin(); Iter != DelegateMap.end(); Iter++)
        {
            Iter->second.JSObject.Reset();
            if (Iter->second.Proxy.IsValid())
            {
                Iter->second.Proxy->JsFunction.Reset();
            }
            for (auto ProxyIter = Iter->second.Proxys.CreateIterator(); ProxyIter; ++ProxyIter)
            {
                if (!(*ProxyIter).IsValid()) { continue; }
                (*ProxyIter)->JsFunction.Reset();
            }
            if (!Iter->second.PassByPointer)
            {
                delete ((FScriptDelegate *)Iter->first);
            }
        }

        for (auto Iter = TsFunctionMap.begin(); Iter != TsFunctionMap.end(); Iter++)
        {
            Iter->second.JsFunction.Reset();
        }

        TsDynamicInvoker.Reset();
        for (auto Iter = BindInfoMap.begin(); Iter != BindInfoMap.end(); Iter++)
        {
            Iter->second.Constructor.Reset();
            Iter->second.Prototype.Reset();
        }
        BindInfoMap.clear();

        for (auto& Pair : TickerDelegateHandleMap)
        {
            FTicker::GetCoreTicker().RemoveTicker(*(Pair.first));
            delete Pair.first;
            delete Pair.second;
        }
        TickerDelegateHandleMap.clear();

        for (auto&  GeneratedClass : GeneratedClasses)
        {
            if (auto JSGeneratedClass = Cast< UJSGeneratedClass>(GeneratedClass))
            {
                if (JSGeneratedClass->IsValidLowLevelFast() && !JSGeneratedClass->IsPendingKill())
                {
                    JSGeneratedClass->Release();
                }
            }
            else if (auto JSWidgetGeneratedClass = Cast<UJSWidgetGeneratedClass>(GeneratedClass))
            {
                if (JSWidgetGeneratedClass->IsValidLowLevelFast() && !JSWidgetGeneratedClass->IsPendingKill())
                {
                    JSWidgetGeneratedClass->Release();
                }
            }
            else if (auto JSAnimGeneratedClass = Cast< UJSAnimGeneratedClass>(GeneratedClass))
            {
                if (JSWidgetGeneratedClass->IsValidLowLevelFast() && !JSWidgetGeneratedClass->IsPendingKill())
                {
                    JSAnimGeneratedClass->Release();
                }
            }
        }

#if defined(WITH_NODEJS)
        node::EmitExit(NodeEnv);
        node::Stop(NodeEnv);
        node::FreeEnvironment(NodeEnv);
        node::FreeIsolateData(NodeIsolateData);

        auto Platform = static_cast<node::MultiIsolatePlatform*>(IJsEnvModule::Get().GetV8Platform());
        Platform->UnregisterIsolate(Isolate);
#endif
    }

    if (InspectorChannel)
    {
        delete InspectorChannel;
        InspectorChannel = nullptr;
    }

    if (Inspector)
    {
        delete Inspector;
        Inspector = nullptr;
    }
        
    DynamicInvoker.Reset();

    MulticastDelegateTemplate.Reset();
    DelegateTemplate.Reset();
    FixSizeArrayTemplate.Reset();
    MapTemplate.Reset();
    SetTemplate.Reset();
    ArrayTemplate.Reset();
    DefaultContext.Reset();
    MainIsolate->Dispose();
    MainIsolate = nullptr;
    delete CreateParams.array_buffer_allocator;

    GUObjectArray.RemoveUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
}

void FJsEnvImpl::InitExtensionMethodsMap()
{
    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        if (Class->IsChildOf<UExtensionMethods>() && Class->IsNative())
        {
            for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
            {
                UFunction* Function = *FuncIt;

                if (Function->HasAnyFunctionFlags(FUNC_Static))
                {
                    TFieldIterator<PropertyMacro> ParamIt(Function);
                    if (ParamIt && ((ParamIt->PropertyFlags & (CPF_Parm | CPF_ReturnParm)) == CPF_Parm))// has at least one param
                    {
                        UStruct* Struct = nullptr;
                        if (auto ObjectPropertyBase = CastFieldMacro<ObjectPropertyBaseMacro>(*ParamIt))
                        {
                            Struct = ObjectPropertyBase->PropertyClass;
                        }
                        else if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(*ParamIt))
                        {
                            Struct = StructProperty->Struct;
                        }
                        if (Struct)
                        {
                            if (ExtensionMethodsMap.find(Struct) == ExtensionMethodsMap.end())
                            {
                                ExtensionMethodsMap[Struct] = std::vector<UFunction*>();
                            }
                            auto Iter = ExtensionMethodsMap.find(Struct);
                            
                            if (std::find(Iter->second.begin(), Iter->second.end(), Function) == Iter->second.end())
                            {
                                Iter->second.push_back(Function);
                            }
                        }
                    }
                }
            }
        }
    }
    ExtensionMethodsMapInited = true;
}

std::unique_ptr<FJsEnvImpl::ObjectMerger>& FJsEnvImpl::GetObjectMerger(UStruct * Struct)
{
    if (ObjectMergers.find(Struct) == ObjectMergers.end())
    {
        ObjectMergers[Struct] = std::make_unique<ObjectMerger>(this, Struct);
    }
    return ObjectMergers[Struct];
}

void FJsEnvImpl::Merge(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Src, UStruct* DesType, void* Des)
{
    GetObjectMerger(DesType)->Merge(Isolate, Context, Src, Des);
}

void FJsEnvImpl::MergeObject(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(Object, Object);

    auto Des = Info[0]->ToObject(Context).ToLocalChecked();
    auto Src = Info[1]->ToObject(Context).ToLocalChecked();
    if (FV8Utils::GetPointerFast<void>(Des, 1)) //struct
    {
        auto Struct = Cast<UScriptStruct>(FV8Utils::GetUObject(Des, 1));
        if (Struct)
        {
            Merge(Isolate, Context, Src, Struct, FV8Utils::GetPointer(Des));
            return;
        }
    }
    else // class
    {
        auto Object = FV8Utils::GetUObject(Des);
        if (Object)
        {
            Merge(Isolate, Context, Src, Object->GetClass(), Object);
            return;
        }
    }
    FV8Utils::ThrowException(Isolate, "Bad parameters #1, expect a native object.");
}

void FJsEnvImpl::NewObjectByClass(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    UObject* Outer = GetTransientPackage();
    FName Name = NAME_None;
    EObjectFlags ObjectFlags = RF_NoFlags;

    UClass *Class = Cast<UClass>(FV8Utils::GetUObject(Context, Info[0]));

    if (Class)
    {
        if (Info.Length() > 1)
        {
            Outer = FV8Utils::GetUObject(Context, Info[1]);
        }
        if (Info.Length() > 2)
        {
            Name = FName(*FV8Utils::ToFString(Isolate, Info[2]));
        }
        if (Info.Length() > 3)
        {
            ObjectFlags = (EObjectFlags)(Info[3]->Int32Value(Context).ToChecked());
        }
        UObject *Object = NewObject<UObject>(Outer, Class, Name, ObjectFlags);

        auto Result = FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, Object->GetClass(), Object);
        Info.GetReturnValue().Set(Result);
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "invalid argument");
    }
}

void FJsEnvImpl::NewStructByScriptStruct(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    UObject* Outer = GetTransientPackage();
    FName Name = NAME_None;
    EObjectFlags ObjectFlags = RF_NoFlags;

    UScriptStruct *ScriptStruct = Cast<UScriptStruct>(FV8Utils::GetUObject(Context, Info[0]));

    if (ScriptStruct)
    {
        void *Ptr = FScriptStructWrapper::Alloc(ScriptStruct);

        Info.GetReturnValue().Set(FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddStruct(Isolate, Context, ScriptStruct, Ptr, false));
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "invalid argument");
    }
}

void FJsEnvImpl::LowMemoryNotification()
{
    MainIsolate->LowMemoryNotification();
}

static void FinishInjection(UClass* InClass)
{
    while (InClass && !InClass->IsNative())
    {
        auto TempTypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(InClass);
        if (TempTypeScriptGeneratedClass && TempTypeScriptGeneratedClass->InjectNotFinished) //InjectNotFinished状态下，其子类的CDO对象构建，把UFunction设置为Native
            {
            for (TFieldIterator<UFunction> FuncIt(TempTypeScriptGeneratedClass, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
            {
                auto Function = *FuncIt;
                Function->FunctionFlags |= FUNC_BlueprintCallable | FUNC_BlueprintEvent | FUNC_Public | FUNC_Native;
            }
            TempTypeScriptGeneratedClass->InjectNotFinished = false;
            }
        InClass = InClass->GetSuperClass();
    }
}

void FJsEnvImpl::MakeSureInject(UTypeScriptGeneratedClass* TypeScriptGeneratedClass, bool ForceReinject, bool RebindObject)
{
    auto Iter = BindInfoMap.find(TypeScriptGeneratedClass);

    if (Iter == BindInfoMap.end() || ForceReinject)//create and link
    {
        auto Package = Cast<UPackage>(TypeScriptGeneratedClass->GetOuter());
        if (!Package)
        {
            return;
        }

        auto PackageName = Package->GetName();

        static FString PackageNamePrefix(TEXT("/Game/Blueprints/TypeScript/"));
;
        if (PackageName.StartsWith(PackageNamePrefix))
        {
            auto SuperClass = Cast<UTypeScriptGeneratedClass>(TypeScriptGeneratedClass->GetSuperClass());
            if (SuperClass && SuperClass->GetName().StartsWith(TEXT("REINST_")))
            {
                //中间状态，父类修改，子类可能有个中间状态，其父类可能被修改为一个REINST_前缀的临时类
                return;
            }
            if (SuperClass)
            {
                MakeSureInject(SuperClass, false, RebindObject);
            }
            FString ModuleName = PackageName.Mid(PackageNamePrefix.Len());
            Logger->Info(FString::Printf(TEXT("Bind module [%s] "), *ModuleName));

            auto Isolate = MainIsolate;
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            auto Context = DefaultContext.Get(Isolate);
            v8::Context::Scope ContextScope(Context);
            auto LocalRequire = Require.Get(Isolate);

            if (Iter == BindInfoMap.end())
            {
                FBindInfo BindInfo;
                BindInfo.Name = *ModuleName;
                BindInfo.Prototype.Reset(Isolate, v8::Object::New(Isolate));
                BindInfoMap[TypeScriptGeneratedClass] = std::move(BindInfo);
            }

            v8::TryCatch TryCatch(Isolate);

            v8::Local<v8::Value > Args[] = { FV8Utils::ToV8String(Isolate, ModuleName)};

            auto MaybeRet = LocalRequire->Call(Context, v8::Undefined(Isolate), 1, Args);

            if (TryCatch.HasCaught())
            {
                Logger->Error(FString::Printf(TEXT("load module [%s] exception %s"), *ModuleName, *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
                return;
            }

            if (!MaybeRet.IsEmpty())
            {
                auto Ret = MaybeRet.ToLocalChecked().As<v8::Object>();

                auto MaybeFunc = Ret->Get(Context, FV8Utils::ToV8String(Isolate, "default"));
                v8::Local<v8::Value> Val;
                if (MaybeFunc.ToLocal(&Val) && Val->IsFunction())
                {
                    auto Func = Val.As<v8::Function>();
                    v8::Local<v8::Value> VProto;
                    //UE_LOG(LogTemp, Error, TEXT("found function for , %s"), *ModuleName);

                    if (Func->Get(Context, FV8Utils::ToV8String(Isolate, "prototype")).ToLocal(&VProto) && VProto->IsObject())
                    {
                        
                        //UE_LOG(LogTemp, Error, TEXT("found proto for , %s"), *ModuleName);
                        v8::Local<v8::Object> Proto = VProto.As<v8::Object>();

                        TypeScriptGeneratedClass->DynamicInvoker = TsDynamicInvoker;
                        //BindInfo.Prototype.Reset(Isolate, Proto);
                        TypeScriptGeneratedClass->ClassConstructor = &UTypeScriptGeneratedClass::StaticConstructor;
                        //BindInfo.Rebind = false;

                        v8::Local<v8::Value> VCtor;
                        if (Proto->Get(Context, FV8Utils::ToV8String(Isolate, "Constructor")).ToLocal(&VCtor) && VCtor->IsFunction())
                        {
                            //UE_LOG(LogTemp, Error, TEXT("found ctor for , %s"), *ModuleName);
                            BindInfoMap[TypeScriptGeneratedClass].Constructor.Reset(Isolate, VCtor.As<v8::Function>());
                            //BindInfo.Prototype.Reset(Isolate, Proto);
                        }
                        
                        //SysObjectRetainer.Retain(Class);

                        //implement by js
                        TSet<FName> overrided;

                        for (TFieldIterator<UFunction> It(TypeScriptGeneratedClass, EFieldIteratorFlags::ExcludeSuper, EFieldIteratorFlags::ExcludeDeprecated, EFieldIteratorFlags::ExcludeInterfaces); It; ++It)
                        {
                            UFunction *Function = *It;
                            auto FunctionFName = Function->GetFName();
                            FString FunctionName = Function->GetName();

                            //FString::Printf(TEXT("InpAxisEvt_%s_%s"), *InputAxisName.ToString(), *GetName())
                            static FString AxisPrefix(TEXT("InpAxisEvt_"));
                            if (FunctionName.StartsWith(AxisPrefix))
                            {
                                auto FunctionNameWithoutPrefix = FunctionName.Mid(AxisPrefix.Len());
                                int32 SubPos;
                                if (FunctionNameWithoutPrefix.FindChar('_', SubPos))
                                {
                                    FunctionName = FunctionNameWithoutPrefix.Mid(0, SubPos);
                                }
                            }
                            static FString ActionPrefix(TEXT("InpActEvt_"));
                            if (FunctionName.StartsWith(ActionPrefix))
                            {
                                auto FunctionNameWithoutPrefix = FunctionName.Mid(ActionPrefix.Len());
                                int32 SubPos;
                                if (FunctionNameWithoutPrefix.FindChar('_', SubPos))
                                {
                                    FunctionName = FunctionNameWithoutPrefix.Mid(0, SubPos);
                                }
                            }
                            auto V8Name = FV8Utils::ToV8String(Isolate, FunctionName);
                            v8::Local<v8::Object> FuncsObj = Function->HasAnyFunctionFlags(FUNC_Static) ? static_cast<v8::Local<v8::Object>>(Func) : Proto;
                            if (!overrided.Contains(FunctionFName) && FuncsObj->HasOwnProperty(Context, V8Name).ToChecked() && 
                                (Function->HasAnyFunctionFlags(FUNC_BlueprintEvent)))
                            {
                                auto MaybeValue = FuncsObj->Get(Context, V8Name);
                                if (!MaybeValue.IsEmpty() && MaybeValue.ToLocalChecked()->IsFunction())
                                {
                                    //Logger->Warn(FString::Printf(TEXT("override: %s:%s"), *TypeScriptGeneratedClass->GetName(), *Function->GetName()));
                                    //UJSGeneratedClass::Override(Isolate, TypeScriptGeneratedClass, Function, v8::Local<v8::Function>::Cast(MaybeValue.ToLocalChecked()), DynamicInvoker, false);
                                    TsFunctionMap.erase(Function);
                                    TsFunctionMap[Function] = {
                                        v8::UniquePersistent<v8::Function>(Isolate, v8::Local<v8::Function>::Cast(MaybeValue.ToLocalChecked())),
                                        std::make_unique<puerts::FFunctionTranslator>(Function, false)
                                    };
                                    TypeScriptGeneratedClass->RedirectToTypeScript(Function);
                                    overrided.Add(FunctionFName);
                                }
                            }
                        }

                        TryReleaseType(TypeScriptGeneratedClass);
                        auto NativeCtor = GetJsClass(TypeScriptGeneratedClass, Context);
                        v8::Local<v8::Value> VNativeProto;
                        if (NativeCtor->Get(Context, FV8Utils::ToV8String(Isolate, "prototype")).ToLocal(&VNativeProto) && VNativeProto->IsObject())
                        {
                            //{} -> Native Prototype -> Js Prototype -> Super Prototype
                            v8::Local<v8::Object> NativeProto = VNativeProto.As<v8::Object>();
                            __USE(BindInfoMap[TypeScriptGeneratedClass].Prototype.Get(Isolate)->SetPrototype(Context, NativeProto));
                            if (SuperClass)
                            {
                                __USE(Proto->SetPrototype(Context, BindInfoMap[SuperClass].Prototype.Get(Isolate)));
                            }
                            else
                            {
                                __USE(Proto->SetPrototype(Context, NativeProto->GetPrototype()));
                            }
                            __USE(NativeProto->SetPrototype(Context, Proto));
                        }
                        else
                        {
                            __USE(BindInfoMap[TypeScriptGeneratedClass].Prototype.Get(Isolate)->SetPrototype(Context, Proto));
                        }

                        if (RebindObject)
                        {
                            for (FObjectIterator It(TypeScriptGeneratedClass); It; ++It)
                            {
                                auto Object = *It;
                                if (Object->GetClass() != TypeScriptGeneratedClass) continue;
                                //在编辑器下重启虚拟机，如果TS带构造函数，不重新执行的话，新虚拟机上逻辑上少执行了逻辑（比如对js对象一些字段的初始化）
                                //执行的话，对CreateDefaultSubobject这类UE逻辑又不允许执行多次（会崩溃），两者相较取其轻
                                //后面看是否能参照蓝图的组件初始化进行改造
                                //TsConstruct(TypeScriptGeneratedClass, Object);
                                auto JSObject = FindOrAdd(Isolate, Context, Object->GetClass(), Object)->ToObject(Context).ToLocalChecked();
                                GeneratedObjectMap[Object] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
                                UnBind(TypeScriptGeneratedClass, Object);
                            }
                        }

                        if (TypeScriptGeneratedClass->IsChildOf(UBlueprintFunctionLibrary::StaticClass()))
                        {
                            FinishInjection(TypeScriptGeneratedClass);
                        }
                    }
                }
            }
            else
            {
                Logger->Error(FString::Printf(TEXT("module [%s] invalid"), *ModuleName));
            }
        }
        else
        {
            Logger->Warn(FString::Printf(TEXT("not find module info for [%s]"), *TypeScriptGeneratedClass->GetName()));
        }
    }
}

void FJsEnvImpl::JsHotReload(FName ModuleName, const FString& JsSource)
{
    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    auto LocalReloadJs = ReloadJs.Get(Isolate);

    FString OutPath, OutDebugPath;

    if (ModuleLoader->Search(TEXT(""), ModuleName.ToString(), OutPath, OutDebugPath))
    {
        OutPath = FPaths::ConvertRelativePathToFull(OutPath);
        Logger->Info(FString::Printf(TEXT("reload js module [%s]"), *OutPath));
        v8::TryCatch TryCatch(Isolate);
        v8::Handle<v8::Value> Args[] = {
            FV8Utils::ToV8String(Isolate, ModuleName),
            FV8Utils::ToV8String(Isolate, OutPath),
            FV8Utils::ToV8String(Isolate, JsSource) };

        auto MaybeRet = LocalReloadJs->Call(Context, v8::Undefined(Isolate), 3, Args);

        if (TryCatch.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("reload module exception %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
        }
    }
    else
    {
        Logger->Warn(FString::Printf(TEXT("not find js module [%s]"), *ModuleName.ToString()));
        return;
    }
}

void FJsEnvImpl::ReloadModule(FName ModuleName, const FString& JsSource)
{
    //Logger->Info(FString::Printf(TEXT("start reload js module [%s]"), *ModuleName.ToString()));
    JsHotReload(ModuleName, JsSource);
}

void FJsEnvImpl::TryBindJs(const class UObjectBase *InObject)
{
    UObjectBaseUtility *Object = (UObjectBaseUtility*)InObject;

    bool IsCDO = Object->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject);

    //if (!Object->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject))
    {
        check(!Object->IsPendingKill());

        UClass *Class = InObject->GetClass();

        auto TypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(Class);

        if (UNLIKELY(TypeScriptGeneratedClass))
        {
            if (UNLIKELY(TypeScriptGeneratedClass->InjectNotFinished))
            {
                if (IsCDO)
                {
                    //MakeSureInject(TypeScriptGeneratedClass, true, true);
                    TypeScriptGeneratedClass->DynamicInvoker = TsDynamicInvoker;
                }
                else //InjectNotFinished状态下非CDO对象构建，把UFunction设置为Native
                {
                    FinishInjection(TypeScriptGeneratedClass);
                }
            }
        }
        else if (UNLIKELY(IsCDO && !Class->IsNative()))
        {
            FinishInjection(Class->GetSuperClass());
        }
        //else if (UNLIKELY(Class == UTypeScriptGeneratedClass::StaticClass()))
        //{
        //    ((UTypeScriptGeneratedClass *)InObject)->DynamicInvoker = TsDynamicInvoker;
        //}
        
    }
}

void FJsEnvImpl::RebindJs()
{
    for (TObjectIterator<UTypeScriptGeneratedClass> It; It; ++It)
    {
        UTypeScriptGeneratedClass* Class = *It;
        
        if (!Class->NotSupportInject())
        {
            MakeSureInject(Class, false, true);
        }
    }
}

FString FJsEnvImpl::CurrentStackTrace()
{
#ifndef WITH_QUICKJS
    v8::Isolate* Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);

    std::string StackTrace = StackTraceToString(Isolate,
        v8::StackTrace::CurrentStackTrace(Isolate, 10, v8::StackTrace::kDetailed));
    return UTF8_TO_TCHAR(StackTrace.c_str());
#else
    return TEXT("");
#endif
}

void FJsEnvImpl::Bind(UClass *Class, UObject *UEObject, v8::Local<v8::Object> JSObject) // Just call in FClassReflection::Call, new a Object
{
    UserObjectRetainer.Retain(UEObject);
    DataTransfer::SetPointer(MainIsolate, JSObject, UEObject, 0);
    DataTransfer::SetPointer(MainIsolate, JSObject, nullptr, 1);
    ObjectMap[UEObject] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
    ObjectMap[UEObject].SetWeak<UClass>(Class, FClassWrapper::OnGarbageCollected, v8::WeakCallbackType::kInternalFields);
}

void FJsEnvImpl::UnBind(UClass *Class, UObject *UEObject, bool ResetPointer)
{
    auto Iter = ObjectMap.find(UEObject);
    if (Iter != ObjectMap.end())
    {
        if (ResetPointer)
        {
            auto Isolate = MainIsolate;
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            auto Context = DefaultContext.Get(Isolate);
            v8::Context::Scope ContextScope(Context);

            DataTransfer::SetPointer(MainIsolate, Iter->second.Get(Isolate).As<v8::Object>(), RELEASED_UOBJECT, 0);
        }
        ObjectMap.erase(UEObject);
        UserObjectRetainer.Release(UEObject);
    }
}

void FJsEnvImpl::UnBind(UClass *Class, UObject *UEObject)
{
    UnBind(Class, UEObject, false);
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAdd(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UClass *Class, UObject *UEObject)
{
    if (!UEObject)
    {
        return v8::Undefined(Isolate);
    }

    auto Iter = ObjectMap.find(UEObject);
    if (Iter == ObjectMap.end())//create and link
    {
        auto Iter2 = GeneratedObjectMap.find(UEObject);
        if (Iter2 != GeneratedObjectMap.end()) //TODO: 后续尝试改为新建一个对象，这个对象持有UObject的引用，并且把调用转发到Iter2->second
        {
            return v8::Local<v8::Value>::New(Isolate, Iter2->second);
        }
        auto BindTo = v8::External::New(Context->GetIsolate(), UEObject);
        v8::Handle<v8::Value> Args[] = { BindTo };
        return GetJsClass(Class, Context)->NewInstance(Context, 1, Args).ToLocalChecked();
    }
    else
    {
        return v8::Local<v8::Value>::New(Isolate, Iter->second);
    }
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddStruct(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UScriptStruct* ScriptStruct, void *Ptr, bool PassByPointer)
{
    check(Ptr);//must not null

    //查询历史记录，当初这么改是因为一个结构体如果其第一个成员也是结构体，这个结构体的指针将和这个第一个成员的指针值一样，导致访问该成员也会返回外层结构体
    //但问题是目前看，这部分是多余代码了，如果不是传指针才查，但不是传指针每次都是new堆内存，实际上是不可能查找到的，还是走到后面的逻辑
    //另外，这有没更好的解决办法呢？记录下ScriptStruct，如果类型不一致才new？
    if (!PassByPointer)
    {
        auto Iter = StructMap.find(Ptr);
        if (Iter != StructMap.end())
        {
            return v8::Local<v8::Value>::New(Isolate, Iter->second);
        }
    }

    //create and link
    auto BindTo = v8::External::New(Context->GetIsolate(), Ptr);
    v8::Handle<v8::Value> Args[] = { BindTo, v8::Boolean::New(Isolate, PassByPointer) };
    return GetJsClass(ScriptStruct, Context)->NewInstance(Context, 2, Args).ToLocalChecked();
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddCppObject(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const char* CDataName, void *Ptr, bool PassByPointer)
{
    return CppObjectMapper.FindOrAddCppObject(Isolate, Context, CDataName, Ptr, PassByPointer);
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UObject* Owner, PropertyMacro* Property, void *DelegatePtr, bool PassByPointer)
{
    check(DelegatePtr);//must not null

    if (PassByPointer)
    {
        auto Iter = DelegateMap.find(DelegatePtr);
        if (Iter != DelegateMap.end())
        {
            if (Iter->second.Owner.IsValid())
            {
                return Iter->second.JSObject.Get(Isolate);
            }
            else
            {
                ClearDelegate(Isolate, Context, DelegatePtr);
            }
        }
    }
    else
    {
        if (CastFieldMacro<DelegatePropertyMacro>(Property))
        {
            auto NewDelegatePtr = new FScriptDelegate;
            *NewDelegatePtr = *static_cast<FScriptDelegate *>(DelegatePtr);
            DelegatePtr = NewDelegatePtr;
        }
        else // do not support MulticastDelegate
        {
            return v8::Undefined(Isolate);
        }
    }

    {
        //UE_LOG(LogTemp, Warning, TEXT("FindOrAddDelegate -- new %s"), *Property->GetName());
        auto Constructor = (Property->IsA<DelegatePropertyMacro>() ? DelegateTemplate : MulticastDelegateTemplate).Get(Isolate)->GetFunction(Context).ToLocalChecked();
        auto JSObject = Constructor->NewInstance(Context).ToLocalChecked();
        DataTransfer::SetPointer(Isolate, JSObject, DelegatePtr, 0);
        auto ReturnVal = JSObject->Set(Context, 0, v8::Map::New(Isolate));
        UFunction *Function = nullptr;
        DelegatePropertyMacro *DelegateProperty = CastFieldMacro<DelegatePropertyMacro>(Property);
        MulticastDelegatePropertyMacro *MulticastDelegateProperty = CastFieldMacro<MulticastDelegatePropertyMacro>(Property);
        if (DelegateProperty)
        {
            Function = DelegateProperty->SignatureFunction;
        }
        else if (MulticastDelegateProperty)
        {
            Function = MulticastDelegateProperty->SignatureFunction;
        }
        DelegateMap[DelegatePtr] = {
            v8::UniquePersistent<v8::Object>(Isolate, JSObject),
            TWeakObjectPtr<UObject>(Owner),
            DelegateProperty,
            MulticastDelegateProperty,
            Function,
            PassByPointer,
            nullptr
        };
        return JSObject;
    }
}

v8::Local<v8::Value> FJsEnvImpl::CreateArray(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, FPropertyTranslator* Property, void* ArrayPtr)
{
    auto Array = FixSizeArrayTemplate.Get(Isolate)->GetFunction(Context).ToLocalChecked()->NewInstance(Context).ToLocalChecked();
    DataTransfer::SetPointer(Isolate, Array, ArrayPtr, 0);
    DataTransfer::SetPointer(Isolate, Array, Property, 1);
    return Array;
}

void FJsEnvImpl::InvokeJsCallback(UDynamicDelegateProxy* Proxy, void* Parms)
{
    auto SignatureFunction = Proxy->SignatureFunction;
    auto Iter = JsCallbackPrototypeMap.find(SignatureFunction);
    if (Iter == JsCallbackPrototypeMap.end())
    {
        JsCallbackPrototypeMap[SignatureFunction] = std::make_unique<FFunctionTranslator>(Proxy->SignatureFunction, true);
    }
    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::TryCatch TryCatch(Isolate);

    JsCallbackPrototypeMap[SignatureFunction]->CallJs(Isolate, Context, Proxy->JsFunction.Get(Isolate), Context->Global(), Parms);

    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("js callback exception %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
    }
}

void FJsEnvImpl::Construct(UClass* Class, UObject* Object, const v8::UniquePersistent<v8::Function> &Constructor, const v8::UniquePersistent<v8::Object> &Prototype)
{
    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::TryCatch TryCatch(Isolate);

    auto JSObject = FindOrAdd(Isolate, Context, Class, Object)->ToObject(Context).ToLocalChecked();
    GeneratedObjectMap[Object] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
    UnBind(Class, Object);

    if (!Prototype.IsEmpty())
    {
        auto ReturnVal1 = JSObject->SetPrototype(Context, Prototype.Get(Isolate));
    }

    if (!Constructor.IsEmpty())
    {
        auto ReturnVal2 = Constructor.Get(Isolate)->Call(Context, JSObject, 0, nullptr);
    }

    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("js callback exception %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
    }
}

void FJsEnvImpl::TsConstruct(UTypeScriptGeneratedClass* Class, UObject* Object)
{
    //蓝图类的CDO会在后台线程构造, 需要将其延迟到主线程执行
    if (!IsInGameThread())
    {
        if (Object->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject))
        {
            FScopeLock Lock(&PendingConstructLock);
            PendingConstructObjects.AddUnique(Object);
        }
        else
        {
            Logger->Error(FString::Printf(TEXT("Construct TypeScript Object %s(%p) on illegal thread!"), *Object->GetName(), (void*)Object));
        }
        return;
    }
    
    if (BindInfoMap.find(Class) == BindInfoMap.end())
    {
        //保证CDO先完成构造, 这样MakeSureInject也只需要在构造CDO时执行
        UObject* CDO = Class->GetDefaultObject(false);
        if (Object != CDO)
        {
            bool bPending = false;
            {
                FScopeLock Lock(&PendingConstructLock);
                bPending = PendingConstructObjects.RemoveSingle(CDO) > 0;
            }
            if (bPending)
            {
                ConstructPendingObject(CDO);
            }
        }
        else
        {
            MakeSureInject(Class, true, false);
        }
    }

    auto Iter = BindInfoMap.find(Class);
    if (Iter != BindInfoMap.end())
    {
        auto Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = DefaultContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);

        v8::TryCatch TryCatch(Isolate);

        v8::Local<v8::Object> JSObject;
        auto Iter2 = GeneratedObjectMap.find(Object);
        if (Iter2 == GeneratedObjectMap.end())
        {
            JSObject = FindOrAdd(Isolate, Context, Object->GetClass(), Object)->ToObject(Context).ToLocalChecked();
            GeneratedObjectMap[Object] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
            UnBind(Class, Object);
        }
        else
        {
            JSObject = Iter2->second.Get(Isolate).As<v8::Object>();
        }

        //假如是UTypeScriptGeneratedClass的对象，设置成间接Prototype，后续刷新代码对象会自动更新
        if (Object->GetClass() == Class && !Iter->second.Prototype.IsEmpty())
        {
            __USE(JSObject->SetPrototype(Context, Iter->second.Prototype.Get(Isolate)));
        }

        if (!Iter->second.Constructor.IsEmpty())
        {
            __USE(Iter->second.Constructor.Get(Isolate)->Call(Context, JSObject, 0, nullptr));
        }
        if (TryCatch.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("js callback exception %s"), *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
        }
    }
    else if (!Object->HasAnyFlags(RF_ClassDefaultObject | RF_ArchetypeObject))
    {
        Logger->Error(FString::Printf(TEXT("Construct TypeScript Object fail for %s"), *Class->GetName()));
    }
}

void FJsEnvImpl::NotifyUObjectDeleted(const class UObjectBase *ObjectBase, int32 Index)
{
    auto Iter = GeneratedObjectMap.find(ObjectBase);
    if (Iter != GeneratedObjectMap.end())
    {
        //UE_LOG(LogTemp, Warning, TEXT("NotifyUObjectDeleted: %s(%p)"), *ObjectBase->GetClass()->GetName(), Object);
        auto Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = v8::Local<v8::Context>::New(Isolate, DefaultContext);
        v8::Context::Scope ContextScope(Context);

        auto JSObject = Iter->second.Get(Isolate)->ToObject(Context).ToLocalChecked();
        DataTransfer::SetPointer(Isolate, JSObject, nullptr, 0);
        DataTransfer::SetPointer(Isolate, JSObject, nullptr, 1);
        GeneratedObjectMap.erase(ObjectBase);
    }
    
    TryReleaseType((UStruct*)ObjectBase);

    UTypeScriptGeneratedClass *GeneratedClass = (UTypeScriptGeneratedClass*)ObjectBase;
    auto IterBIM = BindInfoMap.find(GeneratedClass);
    if (IterBIM != BindInfoMap.end())
    {
        BindInfoMap.erase(IterBIM);
    }

    UnBind(nullptr, (UObject*)ObjectBase, true);

    UClass *Class = (UClass *)ObjectBase;
    if (GeneratedClasses.Contains(Class))
    {
        GeneratedClasses.Remove(Class);
    }

    TsFunctionMap.erase((UFunction*)ObjectBase);
}

void FJsEnvImpl::TryReleaseType(UStruct *Struct) 
{
    if (ClassToTemplateMap.find(Struct) != ClassToTemplateMap.end())
    {
        //Logger->Warn(FString::Printf(TEXT("release class: %s"), *Struct->GetName()));
        ClassToTemplateMap[Struct].Reset();
        ClassToTemplateMap.erase(Struct);
        TypeReflectionMap.erase(Struct);
    }
}

void FJsEnvImpl::InvokeJsMethod(UObject *ContextObject, UJSGeneratedFunction* Function, FFrame &Stack, void *RESULT_PARAM)
{
    if (GeneratedObjectMap.find(ContextObject) == GeneratedObjectMap.end())
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Object"), *ContextObject->GetClass()->GetName(),
            *Function->GetName(), ContextObject));
        return;
    }
    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::TryCatch TryCatch(Isolate);

    Function->FunctionTranslator->CallJs(Isolate, Context, Function->JsFunction.Get(Isolate),
        GeneratedObjectMap[ContextObject].Get(Isolate), ContextObject, Stack, RESULT_PARAM);

    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: %s"), *ContextObject->GetClass()->GetName(),
            *Function->GetName(), ContextObject, *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
    }
}

void FJsEnvImpl::InvokeTsMethod(UObject *ContextObject, UFunction *Function, FFrame &Stack, void *RESULT_PARAM)
{
    auto FuncIter = TsFunctionMap.find(Function);
    if (FuncIter == TsFunctionMap.end())
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Function"), *ContextObject->GetClass()->GetName(),
            *Function->GetName(), ContextObject));
        return;
    }
    else 
    {
        auto Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = DefaultContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        
        v8::Local<v8::Value> ThisObj = v8::Undefined(Isolate);

        if (!Function->HasAnyFunctionFlags(FUNC_Static))
        {
            const auto ObjIter = GeneratedObjectMap.find(ContextObject);
            if (ObjIter == GeneratedObjectMap.end())
            {
                Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: can not find Binded JavaScript Object"), *ContextObject->GetClass()->GetName(),
                    *Function->GetName(), ContextObject));
                return;
            }
            ThisObj = ObjIter->second.Get(Isolate);
        }

        v8::TryCatch TryCatch(Isolate);

        FuncIter->second.FunctionTranslator->CallJs(Isolate, Context, FuncIter->second.JsFunction.Get(Isolate),
            ThisObj, ContextObject, Stack, RESULT_PARAM);

        if (TryCatch.HasCaught())
        {
            Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: %s"), *ContextObject->GetClass()->GetName(),
                *Function->GetName(), ContextObject, *FV8Utils::TryCatchToString(Isolate, &TryCatch)));
        }
    }
}

void FJsEnvImpl::NotifyReBind(UTypeScriptGeneratedClass* Class)
{
    if (IsInGameThread())
    {
        MakeSureInject(Class, true, false);
    }
    else
    {
        //蓝图类加载时会在后台线程Bind, 此时只接管其ClassConstructor即可, 在其初次构造时再Inject
        Class->ClassConstructor = &UTypeScriptGeneratedClass::StaticConstructor;
    }
}

void FJsEnvImpl::OnAsyncLoadingFlushUpdate()
{
    TArray<UObject*> ReadiedObjects;
    {
        FScopeLock Lock(&PendingConstructLock);
        for (auto i = PendingConstructObjects.Num() - 1; i >= 0; --i)
        {
            if (PendingConstructObjects[i].IsValid())
            {
                auto PendingObject = PendingConstructObjects[i].Get();
                if (!PendingObject->HasAnyFlags(RF_NeedPostLoad)
                    && !PendingObject->HasAnyInternalFlags(EInternalObjectFlags::AsyncLoading))
                {
                    auto Class = PendingObject->GetClass();
                    if (!Class->HasAnyFlags(RF_NeedPostLoad)
                        && !Class->HasAnyInternalFlags(EInternalObjectFlags::AsyncLoading))
                    {
                        ReadiedObjects.Add(PendingObject);
                        PendingConstructObjects.RemoveAt(i);
                    }
                }
            }
        }
    }

    for (auto i = ReadiedObjects.Num() - 1; i >= 0; --i)
    {
        ConstructPendingObject(ReadiedObjects[i]);
    }
}

void FJsEnvImpl::ConstructPendingObject(UObject* PendingObject)
{
    TArray<UTypeScriptGeneratedClass*> SuperClasses;
    UClass* Class = PendingObject->GetClass();
    while (Class != nullptr)
    {
        if (auto TypeScriptGeneratedClass = Cast<UTypeScriptGeneratedClass>(Class))
        {
            SuperClasses.Add(TypeScriptGeneratedClass);
        }
        Class = Class->GetSuperClass();
    }

    //从基类到派生类依次构造
    for (int32 i = SuperClasses.Num() - 1; i >= 0; --i)
    {
        TsConstruct(SuperClasses[i], PendingObject);
    }
}

void FJsEnvImpl::ExecuteDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info, void *DelegatePtr)
{
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        FV8Utils::ThrowException(Isolate, "can not find the delegate!");
    }
    auto SignatureFunction = Iter->second.SignatureFunction;
    if (JsCallbackPrototypeMap.find(SignatureFunction) == JsCallbackPrototypeMap.end())
    {
        JsCallbackPrototypeMap[SignatureFunction] = std::make_unique<FFunctionTranslator>(SignatureFunction, true);
    }

    if (Iter->second.DelegateProperty)
    {
        JsCallbackPrototypeMap[SignatureFunction]->Call(Isolate, Context, Info, [ScriptDelegate = static_cast<FScriptDelegate *>(DelegatePtr)] (void* Params){
            ScriptDelegate->ProcessDelegate<UObject>(Params);
        });
    }
    else
    {
        JsCallbackPrototypeMap[SignatureFunction]->Call(Isolate, Context, Info, [MulticastScriptDelegate = static_cast<FMulticastScriptDelegate *>(DelegatePtr)](void* Params){
            MulticastScriptDelegate->ProcessMulticastDelegate<UObject>(Params);
        });
    }
}

static FName NAME_Fire("Fire");

bool FJsEnvImpl::AddToDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void *DelegatePtr, v8::Local<v8::Function> JsFunction)
{
    //UE_LOG(LogTemp, Warning, TEXT("add delegate proxy"));
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return false;
    }
    if (!Iter->second.Owner.IsValid())
    {
        Logger->Warn("try to bind a delegate with invalid owner!");
        ClearDelegate(Isolate, Context, DelegatePtr);
        if (!Iter->second.PassByPointer)
        {
            delete ((FScriptDelegate *)Iter->first);
        }
        DelegateMap.erase(Iter);
        return false;
    }
    if (Iter->second.Proxy.IsValid())
    {
        ClearDelegate(Isolate, Context, DelegatePtr);
    }
    auto JSObject = Iter->second.JSObject.Get(Isolate);
    auto Map = v8::Local<v8::Map>::Cast(JSObject->Get(Context, 0).ToLocalChecked());
    auto MaybeProxy = Map->Get(Context, JsFunction);
    UDynamicDelegateProxy *DelegateProxy = nullptr;
    if (MaybeProxy.IsEmpty() || !MaybeProxy.ToLocalChecked()->IsExternal())
    {
        //UE_LOG(LogTemp, Warning, TEXT("new delegate proxy"));
        DelegateProxy = NewObject<UDynamicDelegateProxy>();
        DelegateProxy->Owner = Iter->second.Owner;
        DelegateProxy->SignatureFunction = Iter->second.SignatureFunction;
        DelegateProxy->DynamicInvoker = DynamicInvoker;
        DelegateProxy->JsFunction = v8::UniquePersistent<v8::Function>(Isolate, JsFunction);
            
        SysObjectRetainer.Retain(DelegateProxy);
        auto ReturnVal = Map->Set(Context, JsFunction, v8::External::New(Context->GetIsolate(), DelegateProxy));
    }
    else
    {
        //UE_LOG(LogTemp, Warning, TEXT("find delegate proxy"));
        DelegateProxy = Cast<UDynamicDelegateProxy>(static_cast<UObject*>(v8::Local<v8::External>::Cast(MaybeProxy.ToLocalChecked())->Value()));
    }

    FScriptDelegate Delegate;
    Delegate.BindUFunction(DelegateProxy, NAME_Fire);

    if (Iter->second.DelegateProperty)
    {
        //UE_LOG(LogTemp, Warning, TEXT("bind to delegate"));
        Iter->second.Proxy = DelegateProxy;
        *(static_cast<FScriptDelegate*>(DelegatePtr)) = Delegate;
    }
    else if (Iter->second.MulticastDelegateProperty)
    {
        //UE_LOG(LogTemp, Warning, TEXT("add to multicast delegate, proxy: %p to:%p"), DelegateProxy, DelegatePtr);
        Iter->second.Proxys.Add(DelegateProxy);
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
        if (Iter->second.MulticastDelegateProperty->IsA<MulticastSparseDelegatePropertyMacro>())
        {
            Iter->second.MulticastDelegateProperty->AddDelegate(MoveTemp(Delegate), Iter->second.Owner.Get(), DelegatePtr);
        }
        else
#endif
        {
            static_cast<FMulticastScriptDelegate*>(DelegatePtr)->AddUnique(Delegate);
        }
    }
    return true;
}

PropertyMacro *FJsEnvImpl::FindDelegateProperty(void *DelegatePtr)
{
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return nullptr;
    }
    return Iter->second.DelegateProperty ? (PropertyMacro *)Iter->second.DelegateProperty : (PropertyMacro *)Iter->second.MulticastDelegateProperty;
}

FScriptDelegate FJsEnvImpl::NewManualReleaseDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Function> JsFunction, UFunction* SignatureFunction)
{
    auto CallbacksMap = ManualReleaseCallbackMap.Get(Isolate);
    auto MaybeProxy = CallbacksMap->Get(Context, JsFunction);
    UDynamicDelegateProxy *DelegateProxy = nullptr;
    if (MaybeProxy.IsEmpty() || !MaybeProxy.ToLocalChecked()->IsExternal())
    {
        DelegateProxy = NewObject<UDynamicDelegateProxy>();
        DelegateProxy->Owner = DelegateProxy;
        DelegateProxy->SignatureFunction = SignatureFunction;
        DelegateProxy->DynamicInvoker = DynamicInvoker;
        DelegateProxy->JsFunction = v8::UniquePersistent<v8::Function>(Isolate, JsFunction);
            
        SysObjectRetainer.Retain(DelegateProxy);
        __USE(CallbacksMap->Set(Context, JsFunction, v8::External::New(Context->GetIsolate(), DelegateProxy)));

        ManualReleaseCallbackList.push_back(DelegateProxy);
    }
    else
    {
        DelegateProxy = Cast<UDynamicDelegateProxy>(static_cast<UObject*>(v8::Local<v8::External>::Cast(MaybeProxy.ToLocalChecked())->Value()));
    }

    FScriptDelegate Delegate;
    Delegate.BindUFunction(DelegateProxy, NAME_Fire);
    return Delegate;
}

void FJsEnvImpl::ReleaseManualReleaseDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(Function);

    auto CallbacksMap = ManualReleaseCallbackMap.Get(Isolate);
    auto MaybeProxy = CallbacksMap->Get(Context, Info[0]);
    if (!MaybeProxy.IsEmpty() && MaybeProxy.ToLocalChecked()->IsExternal())
    {
        __USE(CallbacksMap->Set(Context, Info[0], v8::Undefined(Isolate)));
        auto DelegateProxy = Cast<UDynamicDelegateProxy>(static_cast<UObject*>(v8::Local<v8::External>::Cast(MaybeProxy.ToLocalChecked())->Value()));
        for ( auto it = ManualReleaseCallbackList.begin(); it != ManualReleaseCallbackList.end(); )
        {
            if (!it->IsValid())
            {
                it = ManualReleaseCallbackList.erase(it);
            } else if (it->Get() == DelegateProxy) {
                DelegateProxy->JsFunction.Reset();
                it = ManualReleaseCallbackList.erase(it);
            } else {
                ++it;
            }
        }
    }
}

bool FJsEnvImpl::RemoveFromDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void *DelegatePtr, v8::Local<v8::Function> JsFunction)
{
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return false;
    }

    FScriptDelegate Delegate;

    if (Iter->second.DelegateProperty)
    {
        return ClearDelegate(Isolate, Context, DelegatePtr);
    }
    else if (Iter->second.MulticastDelegateProperty)
    {
        auto JSObject = Iter->second.JSObject.Get(Isolate);
        auto Map = v8::Local<v8::Map>::Cast(JSObject->Get(Context, 0).ToLocalChecked());
        auto MaybeValue = Map->Get(Context, JsFunction);

        if (MaybeValue.IsEmpty())
        {
            return false;
        }

        auto MaybeProxy = MaybeValue.ToLocalChecked();
        if (!MaybeProxy->IsExternal())
        {
            return false;
        }

        auto DelegateProxy = Cast<UDynamicDelegateProxy>(static_cast<UObject*>(v8::Local<v8::External>::Cast(MaybeProxy)->Value()));

        Delegate.BindUFunction(DelegateProxy, NAME_Fire);

#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
        if (Iter->second.MulticastDelegateProperty->IsA<MulticastSparseDelegatePropertyMacro>())
        {
            Iter->second.MulticastDelegateProperty->RemoveDelegate(Delegate, Iter->second.Owner.Get(), DelegatePtr);
        }
        else
#endif
        {
            static_cast<FMulticastScriptDelegate*>(DelegatePtr)->Remove(Delegate);
        }
            
        auto ReturnVal = Map->Set(Context, JsFunction, v8::Undefined(Isolate));

        Iter->second.Proxys.Remove(DelegateProxy);
        SysObjectRetainer.Release(DelegateProxy);
        DelegateProxy->JsFunction.Reset();
    }

    return true;
}

bool FJsEnvImpl::ClearDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void *DelegatePtr)
{
    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())
    {
        return false;
    }

    auto JSObject = Iter->second.JSObject.Get(Isolate);
    auto Map = v8::Local<v8::Map>::Cast(JSObject->Get(Context, 0).ToLocalChecked());
    Map->Clear();

    if (Iter->second.DelegateProperty)
    {
        if (Iter->second.Proxy.IsValid())
        {
            if (Iter->second.Owner.IsValid())
            {
                FScriptDelegate Delegate;
                *(static_cast<FScriptDelegate*>(DelegatePtr)) = Delegate;
            }

            SysObjectRetainer.Release(Iter->second.Proxy.Get());
            Iter->second.Proxy->JsFunction.Reset();
            Iter->second.Proxy.Reset();
        }
    }
    else if (Iter->second.MulticastDelegateProperty)
    {
        if (Iter->second.Owner.IsValid())
        {
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
            if (Iter->second.MulticastDelegateProperty->IsA<MulticastSparseDelegatePropertyMacro>())
            {
                Iter->second.MulticastDelegateProperty->ClearDelegate(Iter->second.Owner.Get(), DelegatePtr);
            }
            else
#endif
            {
                static_cast<FMulticastScriptDelegate*>(DelegatePtr)->Clear();
            }
        }

        for (auto ProxyIter = Iter->second.Proxys.CreateIterator(); ProxyIter; ++ProxyIter)
        {
            if (!(*ProxyIter).IsValid()) { continue; }
            (*ProxyIter)->JsFunction.Reset();
            SysObjectRetainer.Release((*ProxyIter).Get());
        }
        Iter->second.Proxys.Empty();
    }

    return true;
}

bool FJsEnvImpl::CheckDelegateProxys(float tick)
{
    std::vector<void*> PendingToRemove;
    for (auto &KV : DelegateMap)
    {
        if (!KV.second.Owner.IsValid())
        {
            PendingToRemove.push_back(KV.first);
        }
    }
    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    for (int i = 0; i < PendingToRemove.size(); ++i)
    {
        ClearDelegate(Isolate, Context, PendingToRemove[i]);
        if (!DelegateMap[PendingToRemove[i]].PassByPointer)
        {
            delete ((FScriptDelegate *)PendingToRemove[i]);
        }
        DelegateMap.erase(PendingToRemove[i]);
    }
    return true;
}

FPropertyTranslator* FJsEnvImpl::GetContainerPropertyTranslator(PropertyMacro* Property)
{
    auto Iter = ContainerPropertyMap.find(Property);
    //TODO: 如果脚本一直持有蓝图里头的Map，还是有可能有问题的，需要统筹考虑一套机制解决这类问题
    if (Iter == ContainerPropertyMap.end() || !Iter->second.PropertyWeakPtr.IsValid())
    {
        ContainerPropertyInfo Temp {Property, FPropertyTranslator::Create(Property)};
        ContainerPropertyMap[Property] = std::move(Temp);
#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
        if (!Property->IsNative())
        {
            SysObjectRetainer.Retain(Property);
        }
#endif
        return ContainerPropertyMap[Property].PropertyTranslator.get();
    }
    else
    {
        return Iter->second.PropertyTranslator.get();
    }
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Function> Constructor, PropertyMacro* Property1, PropertyMacro* Property2, void *Ptr, bool PassByPointer)
{
    check(Ptr);//must not null

    if (!PassByPointer)
    {
        auto Iter = StructMap.find(Ptr);
        if (Iter != StructMap.end())
        {
            return v8::Local<v8::Value>::New(Isolate, Iter->second);
        }
    }

    auto BindTo = v8::External::New(Context->GetIsolate(), Ptr);
    v8::Handle<v8::Value> Args[] = { BindTo, v8::Boolean::New(Isolate, PassByPointer) };
    auto Result = Constructor->NewInstance(Context, 2, Args).ToLocalChecked();
    DataTransfer::SetPointer(Isolate, Result, GetContainerPropertyTranslator(Property1), 1);
    if (Property2) DataTransfer::SetPointer(Isolate, Result, GetContainerPropertyTranslator(Property2), 2);
    return Result;
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property, FScriptArray *Ptr, bool PassByPointer)
{
    return FindOrAddContainer(Isolate, Context, ArrayTemplate.Get(Isolate)->GetFunction(Context).ToLocalChecked(), Property, nullptr, Ptr, PassByPointer);
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property, FScriptSet *Ptr, bool PassByPointer)
{
    return FindOrAddContainer(Isolate, Context, SetTemplate.Get(Isolate)->GetFunction(Context).ToLocalChecked(), Property, nullptr, Ptr, PassByPointer);
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, FScriptMap *Ptr, bool PassByPointer)
{
    return FindOrAddContainer(Isolate, Context, MapTemplate.Get(Isolate)->GetFunction(Context).ToLocalChecked(), KeyProperty, ValueProperty, Ptr, PassByPointer);
}

void FJsEnvImpl::BindStruct(UScriptStruct* ScriptStruct, void *Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer)
{
    DataTransfer::SetPointer(MainIsolate, JSObject, Ptr, 0);
    DataTransfer::SetPointer(MainIsolate, JSObject, ScriptStruct, 1);// add type info
        
    if (!PassByPointer)
    {
        StructMap[Ptr] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
        ScriptStructTypeMap[Ptr] = ScriptStruct;
        StructMap[Ptr].SetWeak<UScriptStruct>(ScriptStruct, FScriptStructWrapper::OnGarbageCollectedWithFree, v8::WeakCallbackType::kInternalFields);
    }
}

void FJsEnvImpl::BindCppObject(v8::Isolate* InIsolate, JSClassDefinition* ClassDefinition, void *Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer)
{
    CppObjectMapper.BindCppObject(InIsolate, ClassDefinition, Ptr, JSObject, PassByPointer);
}

void FJsEnvImpl::UnBindStruct(UScriptStruct* ScriptStruct, void *Ptr)
{
    ScriptStructTypeMap.erase(Ptr);
    StructMap.erase(Ptr);
}

void FJsEnvImpl::UnBindCppObject(JSClassDefinition* ClassDefinition, void *Ptr)
{
    CppObjectMapper.UnBindCppObject(ClassDefinition, Ptr);
}

void FJsEnvImpl::BindContainer(void* Ptr, v8::Local<v8::Object> JSObject, void(*Callback)(const v8::WeakCallbackInfo<void>& data))
{
    DataTransfer::SetPointer(MainIsolate, JSObject, Ptr, 0);
    StructMap[Ptr] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
    StructMap[Ptr].SetWeak<void>(nullptr, Callback, v8::WeakCallbackType::kInternalFields);
}

void FJsEnvImpl::UnBindContainer(void* Ptr)
{
    StructMap.erase(Ptr);
}

v8::Local<v8::FunctionTemplate> FJsEnvImpl::GetTemplateOfClass(UStruct *InStruct, bool &Existed)
{
    auto Isolate = MainIsolate;
    auto Iter = ClassToTemplateMap.find(InStruct);
    if (Iter == ClassToTemplateMap.end())
    {
        if (!ExtensionMethodsMapInited)
        {
            InitExtensionMethodsMap();
        }
        v8::EscapableHandleScope HandleScope(Isolate);
        v8::Local<v8::FunctionTemplate> Template;

        auto ExtensionMethodsIter = ExtensionMethodsMap.find(InStruct);

        if (auto ScriptStruct = Cast<UScriptStruct>(InStruct))
        {
            //Logger->Warn(FString::Printf(TEXT("UScriptStruct: %s"), *InStruct->GetName()));
            auto ScriptStructReflection = std::make_unique<FScriptStructWrapper>(ScriptStruct);
            if (ExtensionMethodsIter != ExtensionMethodsMap.end())
            {
                ScriptStructReflection->AddExtensionMethods(ExtensionMethodsIter->second);
                ExtensionMethodsMap.erase(ExtensionMethodsIter);
            }
            Template = ScriptStructReflection->ToFunctionTemplate(Isolate);
            TypeReflectionMap[InStruct] = std::pair<std::unique_ptr<FStructWrapper>, int>((std::move(ScriptStructReflection)), 0);
            if (!ScriptStruct->IsNative())//非原生的结构体，可能在实例没有的时候会释放
            {
                SysObjectRetainer.Retain(ScriptStruct);
            }

            auto SuperStruct = ScriptStruct->GetSuperStruct();
            if (SuperStruct)
            {
                bool Dummy;
                Template->Inherit(GetTemplateOfClass(SuperStruct, Dummy));
            }
        }
        else
        {
            auto Class = Cast<UClass>(InStruct);
            check(Class);
            auto ClassReflection = std::make_unique<FClassWrapper>(Class);
            if (ExtensionMethodsIter != ExtensionMethodsMap.end())
            {
                ClassReflection->AddExtensionMethods(ExtensionMethodsIter->second);
                ExtensionMethodsMap.erase(ExtensionMethodsIter);
            }
            Template = ClassReflection->ToFunctionTemplate(Isolate);
            TypeReflectionMap[InStruct] = std::pair<std::unique_ptr<FStructWrapper>, int>((std::move(ClassReflection)), 0);

            auto SuperClass = Class->GetSuperClass();
            if (SuperClass)
            {
                bool Dummy;
                Template->Inherit(GetTemplateOfClass(SuperClass, Dummy));
            }
        }
            
        ClassToTemplateMap[InStruct] = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, Template);

        Existed = false;
        return HandleScope.Escape(Template);
    }
    else
    {
        Existed = true;
        return v8::Local<v8::FunctionTemplate>::New(Isolate, Iter->second);
    }
}


v8::Local<v8::Function> FJsEnvImpl::GetJsClass(UStruct *InStruct, v8::Local<v8::Context> Context)
{
    bool Existed;
    auto Ret = GetTemplateOfClass(InStruct, Existed)->GetFunction(Context).ToLocalChecked();

    if (UNLIKELY(!Existed)) //first create
    {
        auto Class = Cast<UClass>(InStruct);
        if (Class && !Class->IsNative() && !InStruct->IsA<UTypeScriptGeneratedClass>())
        {
            auto SuperClass = Cast<UTypeScriptGeneratedClass>(Class->GetSuperClass());
            if (SuperClass)
            {
                MakeSureInject(SuperClass, false, false);
                v8::Local<v8::Value> VProto;
                if (Ret->Get(Context, FV8Utils::ToV8String(MainIsolate, "prototype")).ToLocal(&VProto) && VProto->IsObject())
                {
                    v8::Local<v8::Object> Proto = VProto.As<v8::Object>();
                    __USE(Proto->SetPrototype(Context, BindInfoMap[SuperClass].Prototype.Get(MainIsolate)));
                }
            }
        }
    }

    return Ret;
}

bool FJsEnvImpl::IsInstanceOf(UStruct *Struct, v8::Local<v8::Object> JsObject)
{
    bool Dummy;
    return GetTemplateOfClass(Struct, Dummy)->HasInstance(JsObject);
}

bool FJsEnvImpl::IsInstanceOfCppObject(const char* CDataName, v8::Local<v8::Object> JsObject)
{
    return CppObjectMapper.IsInstanceOfCppObject(CDataName, JsObject);
}

void FJsEnvImpl::LoadUEType(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(String);

    FString TypeName = FV8Utils::ToFString(Isolate, Info[0]);

    UObject* ClassPackage = ANY_PACKAGE;
    UField* Type = FindObject<UClass>(ClassPackage, *TypeName);

    if (!Type)
    {
        Type = FindObject<UScriptStruct>(ClassPackage, *TypeName);
    }

    if (!Type)
    {
        Type = FindObject<UEnum>(ClassPackage, *TypeName);
    }

    if (!Type)
    {
        Type = LoadObject<UClass>(nullptr, *TypeName);
    }

    if (!Type)
    {
        Type = LoadObject<UScriptStruct>(nullptr, *TypeName);
    }

    if (!Type)
    {
        Type = LoadObject<UEnum>(nullptr, *TypeName);
    }

    if (auto Struct = Cast<UStruct>(Type))
    {
        if (!Struct->IsNative())
        {
            FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("%s is blueprint type, load it using UE.Class.Load('path/to/your/blueprint/file')."), *TypeName));
            return;
        }
        Info.GetReturnValue().Set(GetJsClass(Struct, Context));
    }
    else if (auto Enum = Cast<UEnum>(Type))
    {
        auto Result = v8::Object::New(Isolate);
        for (int i = 0; i < Enum->NumEnums(); ++i)
        {
            auto Name = Enum->IsA<UUserDefinedEnum>() ? 
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                Enum->GetAuthoredNameStringByIndex(i)
#else
                Enum->GetDisplayNameTextByIndex(i).ToString()
#endif
                : Enum->GetNameStringByIndex(i);
            auto Value = Enum->GetValueByIndex(i);
            auto ReturnVal = Result->Set(Context, FV8Utils::ToV8String(Isolate, Name), v8::Number::New(Isolate, Value));
        }
        Info.GetReturnValue().Set(Result);
    }
    else
    {
        FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("can not find type:%s"), *TypeName));
    }
}

void FJsEnvImpl::UEClassToJSClass(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(Object);

    auto Struct = Cast<UStruct>(FV8Utils::GetUObject(Context, Info[0]));

    if (Struct)
    {
        Info.GetReturnValue().Set(GetJsClass(Struct, Context));
    }
    else
    {
        FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("argument #0 expect a UStruct")));
    }
}

bool FJsEnvImpl::GetContainerTypeProperty(v8::Local<v8::Context> Context, v8::Local<v8::Value> Value, PropertyMacro ** PropertyPtr)
{
    if (Value->IsInt32())
    {
        int Type = Value->Int32Value(Context).ToChecked();
        if (Type >= MaxBuiltinType)
        {
            *PropertyPtr = nullptr;
            return false;
        }
        *PropertyPtr = ContainerMeta.GetBuiltinProperty((BuiltinType)Type);
        return true;
    }
    else if (auto Struct = Cast<UStruct>(FV8Utils::GetUObject(Context, Value)))
    {
        *PropertyPtr = ContainerMeta.GetObjectProperty(Struct);
        return *PropertyPtr != nullptr;
    }
    else
    {
        *PropertyPtr = nullptr;
        return false;
    }
}

void FJsEnvImpl::NewContainer(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(Int32);

    int ContainerType = Info[0]->Int32Value(Context).ToChecked();

    PropertyMacro * Property1 = nullptr;
    PropertyMacro * Property2 = nullptr;
    FScriptArray * ScriptArray = nullptr;
    FScriptSet * ScriptSet = nullptr;
    FScriptMap * ScriptMap = nullptr;

    if (!GetContainerTypeProperty(Context, Info[1], &Property1))
    {
        FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("can not get first type for %d"), ContainerType));
        return;
    }

    switch (ContainerType)
    {
    case 0://Array
        ScriptArray = new FScriptArray;
        //Logger->Info(FString::Printf(TEXT("Array %s"), *Property1->GetClass()->GetName()));
        Info.GetReturnValue().Set(FindOrAddContainer(Isolate, Context, Property1, ScriptArray, false));
        break;
    case 1://Set
        ScriptSet = new FScriptSet;
        //Logger->Info(FString::Printf(TEXT("Set %s"), *Property1->GetClass()->GetName()));
        Info.GetReturnValue().Set(FindOrAddContainer(Isolate, Context, Property1, ScriptSet, false));
        break;
    case 2://Map
        if (!GetContainerTypeProperty(Context, Info[2], &Property2))
        {
            FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("can not get second type for %d"), ContainerType));
            return;
        }
        //Logger->Info(FString::Printf(TEXT("Map %s %s"), *Property1->GetClass()->GetName(), *Property2->GetClass()->GetName()));
        ScriptMap = new FScriptMap;
        Info.GetReturnValue().Set(FindOrAddContainer(Isolate, Context, Property1, Property2, ScriptMap, false));
        break;
    default:
        FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("invalid container type %d"), ContainerType));
    }
}

void FJsEnvImpl::Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>> &Arguments)
{
    if (Started)
    {
        Logger->Error("Started yet!");
        return;
    }

    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = v8::Local<v8::Context>::New(Isolate, DefaultContext);
    v8::Context::Scope ContextScope(Context);

    auto MaybeTGameTGJS = Context->Global()->Get(Context, FV8Utils::ToV8String(Isolate, "puerts"));

    if (MaybeTGameTGJS.IsEmpty() || !MaybeTGameTGJS.ToLocalChecked()->IsObject())
    {
        Logger->Error("global.puerts not found!");
        return;
    }

    auto TGJS = MaybeTGameTGJS.ToLocalChecked()->ToObject(Context).ToLocalChecked();

    auto MaybeArgv = TGJS->Get(Context, FV8Utils::ToV8String(Isolate, "argv"));

    if (MaybeArgv.IsEmpty() || !MaybeArgv.ToLocalChecked()->IsObject())
    {
        Logger->Error("global.puerts.argv not found!");
        return;
    }

    auto Argv = MaybeArgv.ToLocalChecked()->ToObject(Context).ToLocalChecked();

    auto MaybeArgvAdd = Argv->Get(Context, FV8Utils::ToV8String(Isolate, "add"));

    if (MaybeArgvAdd.IsEmpty() || !MaybeArgvAdd.ToLocalChecked()->IsFunction())
    {
        Logger->Error("global.puerts.argv.add not found!");
        return;
    }

    auto ArgvAdd = MaybeArgvAdd.ToLocalChecked().As<v8::Function>();

    for (int i = 0; i < Arguments.Num(); i++)
    {
        auto Object = Arguments[i].Value;
        v8::Local<v8::Value> Args[2] = { FV8Utils::ToV8String(Isolate, Arguments[i].Key), FindOrAdd(Isolate, Context, Object->GetClass(), Object) };
        auto Result = ArgvAdd->Call(Context, Argv, 2, Args);
    }

    ExecuteModule(ModuleName, [](const FString& Script, const FString& Path)
    {
        auto PathInJs = Path.Replace(TEXT("\\"), TEXT("\\\\"));
        auto DirInJs = FPaths::GetPath(Path).Replace(TEXT("\\"), TEXT("\\\\"));
        return FString::Printf(TEXT("(function() { var __filename = '%s', __dirname = '%s', exports ={}, module =  { exports : exports, filename : __filename }; (function (exports, require, console, prompt) { %s\n})(exports, puerts.genRequire('%s'), puerts.console);})()"), *PathInJs, *DirInJs, *Script, *DirInJs);
    });
    Started = true;
}

bool FJsEnvImpl::LoadFile(const FString& RequiringDir, const FString& ModuleName, FString& OutPath, FString& OutDebugPath, TArray<uint8>& Data, FString &ErrInfo)
{
    if (ModuleLoader->Search(RequiringDir, ModuleName, OutPath, OutDebugPath)) 
    {
        if (!ModuleLoader->Load(OutPath, Data))
        {
            ErrInfo = FString::Printf(TEXT("can not load [%s]"), *ModuleName);
            return false;
        }
    }
    else 
    {
        ErrInfo = FString::Printf(TEXT("can not find [%s]"), *ModuleName);
        return false;
    }
    return true;
}

void FJsEnvImpl::ExecuteModule(const FString& ModuleName, std::function<FString(const FString&, const FString&)> Preprocessor)
{
    FString OutPath;
    FString DebugPath;
    TArray<uint8> Data;

    FString ErrInfo;
    if (!LoadFile(TEXT(""), ModuleName, OutPath, DebugPath, Data, ErrInfo))
    {
        Logger->Error(ErrInfo);
        return;
    }

// #if UE_BUILD_DEBUG || UE_BUILD_DEVELOPMENT
//     if (!DebugPath.IsEmpty())
//         OutPath = DebugPath;
// #endif

    FString Script;
    FFileHelper::BufferToString(Script, Data.GetData(), Data.Num());

    if (Preprocessor) Script = Preprocessor(Script, OutPath);

    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = v8::Local<v8::Context>::New(Isolate, DefaultContext);
    v8::Context::Scope ContextScope(Context);
    {
#if PLATFORM_MAC
        FString FormattedScriptUrl = DebugPath;
#else
        // 修改URL分隔符格式，否则无法匹配Inspector协议在打断点时发送的正则表达式，导致断点失败
        FString FormattedScriptUrl = DebugPath.Replace(TEXT("/"), TEXT("\\"));
#endif
        v8::Local<v8::String> Name = FV8Utils::ToV8String(Isolate, FormattedScriptUrl);
        v8::ScriptOrigin Origin(Name);
        v8::Local<v8::String> Source = FV8Utils::ToV8String(Isolate, Script);
        v8::TryCatch TryCatch(Isolate);

        auto CompiledScript = v8::Script::Compile(Context, Source, &Origin);
        if (CompiledScript.IsEmpty())
        {
            Logger->Error(FV8Utils::TryCatchToString(Isolate, &TryCatch));
            return;
        }
        auto ReturnVal = CompiledScript.ToLocalChecked()->Run(Context);
        if (TryCatch.HasCaught())
        {
            Logger->Error(FV8Utils::TryCatchToString(Isolate, &TryCatch));
            return;
        }
    }
}

void FJsEnvImpl::EvalScript(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(String, String);

    v8::Local<v8::String> Source = Info[0]->ToString(Context).ToLocalChecked();

    v8::String::Utf8Value UrlArg(Isolate, Info[1]);
    FString ScriptUrl = UTF8_TO_TCHAR(*UrlArg);
#if PLATFORM_MAC
    FString FormattedScriptUrl = ScriptUrl;
#else
    // 修改URL分隔符格式，否则无法匹配Inspector协议在打断点时发送的正则表达式，导致断点失败
    FString FormattedScriptUrl = ScriptUrl.Replace(TEXT("/"), TEXT("\\"));
#endif
    v8::Local<v8::String> Name = FV8Utils::ToV8String(Isolate,FormattedScriptUrl);
    v8::ScriptOrigin Origin(Name);
    auto Script = v8::Script::Compile(Context, Source, &Origin);
    if (Script.IsEmpty())
    {
        return;
    }
    auto Result = Script.ToLocalChecked()->Run(Context);
    if (Result.IsEmpty())
    {
        return;
    }
    Info.GetReturnValue().Set(Result.ToLocalChecked());
}

void FJsEnvImpl::Log(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(Int32, String);
        
    auto Level = Info[0]->Int32Value(Context).ToChecked();

    FString Msg = FV8Utils::ToFString(Isolate, Info[1]);
    switch (Level)
    {
    case 1:
        Logger->Info(Msg);
        break;
    case 2:
        Logger->Warn(Msg);
        break;
    case 3:
        Logger->Error(Msg);
        break;
    default:
        Logger->Log(Msg);
        break;
    }
}

void FJsEnvImpl::LoadModule(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(String, String);

    FString ModuleName = FV8Utils::ToFString(Isolate, Info[0]);
    FString RequiringDir = FV8Utils::ToFString(Isolate, Info[1]);

    FString OutPath;
    FString OutDebugPath;
    TArray<uint8> Data;
    FString ErrInfo;
    if(!LoadFile(RequiringDir, ModuleName, OutPath, OutDebugPath, Data, ErrInfo))
    {
        FV8Utils::ThrowException(Isolate, TCHAR_TO_UTF8(*ErrInfo));
        return;
    }
    FString Script;
    FFileHelper::BufferToString(Script, Data.GetData(), Data.Num());

    FString Result = FString::Printf(TEXT("%s\n%s\n%s"), *OutPath, *OutDebugPath, *Script);
    Info.GetReturnValue().Set(FV8Utils::ToV8String(Isolate, TCHAR_TO_UTF8(*Result)));
}

void FJsEnvImpl::SetTimeout(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(Function, Number);

    SetFTickerDelegate(Info, false);
}

void FJsEnvImpl::SetFTickerDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info, bool Continue)
{
    using std::placeholders::_1;
    using std::placeholders::_2;
    std::function<void(const JSError*, std::shared_ptr<ILogger>&)> ExceptionLog = [](const JSError* Exception, std::shared_ptr<ILogger>& InLogger)
    {
        FString Message = FString::Printf(TEXT("JS Execution Exception: %s"), *(Exception->Message));
        InLogger->Warn(Message);
    };
    std::function<void(const JSError*)> ExceptionLogWrapper = std::bind(ExceptionLog, _1, Logger);
    std::function<void(v8::Isolate*, v8::TryCatch*)> ExecutionExceptionHandler =
        std::bind(&FJsEnvImpl::ReportExecutionException, this, _1, _2, ExceptionLogWrapper);
    std::function<void(FDelegateHandle*)> DelegateHandleCleaner =
        std::bind(&FJsEnvImpl::RemoveFTickerDelegateHandle, this, _1);

    FTickerDelegateWrapper* DelegateWrapper = new FTickerDelegateWrapper(Continue);
    DelegateWrapper->Init(Info, ExecutionExceptionHandler, DelegateHandleCleaner);
    FTickerDelegate Delegate = FTickerDelegate::CreateRaw(DelegateWrapper, &FTickerDelegateWrapper::CallFunction);

    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    float Millisecond = Info[1]->NumberValue(Context).ToChecked();
    float Delay = Millisecond / 1000.f;

    // TODO - 如果实现多线程，这里应该加锁阻止定时回调的执行，直到DelegateWrapper设置好handle
    FDelegateHandle* DelegateHandle = new FDelegateHandle(FTicker::GetCoreTicker().AddTicker(Delegate, Delay));
    DelegateWrapper->SetDelegateHandle(DelegateHandle);
    TickerDelegateHandleMap[DelegateHandle] = DelegateWrapper;

    Info.GetReturnValue().Set(v8::External::New(Info.GetIsolate(), DelegateHandle));
}

void FJsEnvImpl::ReportExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch, std::function<void(const JSError*)> CompletionHandler)
{
    const JSError Error(FV8Utils::TryCatchToString(Isolate, TryCatch));
    if (CompletionHandler)
    {
        CompletionHandler(&Error);
    }
}

void FJsEnvImpl::RemoveFTickerDelegateHandle(FDelegateHandle* Handle)
{
    // TODO - 如果实现多线程，FTicker所在主线程和当前线程释放handle可能有竞争
    auto Iterator = std::find_if(TickerDelegateHandleMap.begin(), TickerDelegateHandleMap.end(), [&](auto& Pair) {
        return Pair.first == Handle;
    });
    if (Iterator != TickerDelegateHandleMap.end())
    {
        //call clearTimeout in setTimeout callback
        if (Iterator->second->IsCalling)
        {
            Iterator->second->FunctionContinue = false;
            return;
        }
        FTicker::GetCoreTicker().RemoveTicker(*(Iterator->first));
        delete Iterator->first;
        delete Iterator->second;
        TickerDelegateHandleMap.erase(Iterator);
    }
}

void FJsEnvImpl::ClearInterval(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);
        
    // todo - mocha 7.0.1，当reporter为JSON，调用clearTimeout时，可能不传值，或传Null、Undefined过来。暂将其忽略
    if (Info.Length() == 0)
    {
        Logger->Warn(TEXT("Calling ClearInterval with 0 argument."));
    }
    else if (Info[0]->IsNullOrUndefined())
    {
        // 屏蔽这条只在mocha中出现的警告
        // Logger->Warn(TEXT("Calling ClearInterval with a Null or Undefined."));
    }
    else
    {
        CHECK_V8_ARGS(External);
        v8::Local<v8::External> Arg = v8::Local<v8::External>::Cast(Info[0]);
        FDelegateHandle* Handle = static_cast<FDelegateHandle*>(Arg->Value());
        RemoveFTickerDelegateHandle(Handle);
    }
}

void FJsEnvImpl::SetInterval(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(Function, Number);

    SetFTickerDelegate(Info, true);
}

void FJsEnvImpl::MakeUClass(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(Function, Object, String, Object, Object);

    auto Constructor = v8::Local<v8::Function>::Cast(Info[0]);
    auto Prototype = Info[1]->ToObject(Context).ToLocalChecked();
    auto ClassName = FV8Utils::ToFString(Isolate, Info[2]);
    auto Methods = Info[3]->ToObject(Context).ToLocalChecked();
    auto ParentUClass = Cast<UClass>(FV8Utils::GetUObject(Context, Info[4]));

    if (!ParentUClass)
    {
        FV8Utils::ThrowException(Isolate, "#4 parameter expect a UClass object");
        return;
    }

    UObject* ClassPackage = ANY_PACKAGE;

    FString GenClassName;
    int i = 0;
    while(true)
    {
        GenClassName = FString::Printf(TEXT("%s%d"), *ClassName, i);
        if (!FindObject<UClass>(ClassPackage, *GenClassName)) break;
        i++;
    }

    auto Class = UJSGeneratedClass::Create(GenClassName, ParentUClass, DynamicInvoker, Isolate, Constructor, Prototype);

    TSet<FName> overrided;

    for (TFieldIterator<UFunction> It(ParentUClass, EFieldIteratorFlags::IncludeSuper, EFieldIteratorFlags::ExcludeDeprecated, EFieldIteratorFlags::IncludeInterfaces); It; ++It)
    {
        UFunction *Function = *It;
        auto FunctionFName = Function->GetFName();
        if (!overrided.Contains(FunctionFName) && Function->HasAnyFunctionFlags(FUNC_BlueprintEvent))
        {
            auto MaybeValue = Methods->Get(Context, FV8Utils::ToV8String(Isolate, Function->GetName()));
            if (!MaybeValue.IsEmpty() && MaybeValue.ToLocalChecked()->IsFunction())
            {
                //Logger->Warn(FString::Printf(TEXT("override: %s"), *Function->GetName()));
                UJSGeneratedClass::Override(Isolate, Class, Function, v8::Local<v8::Function>::Cast(MaybeValue.ToLocalChecked()), DynamicInvoker, true);
                overrided.Add(FunctionFName);
            }
        }
    }

    Class->Bind();
    Class->StaticLink(true);

    // Make sure CDO is ready for use
    Class->GetDefaultObject();

#if ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION > 12
    // Assemble reference token stream for garbage collection/ RTGC.
    if (!Class->HasAnyClassFlags(CLASS_TokenStreamAssembled))
    {
        Class->AssembleReferenceTokenStream();
    }
#endif
    if (!GeneratedClasses.Contains(Class))
    {
        GeneratedClasses.Add(Class);
    }
    SysObjectRetainer.Retain(Class);

    auto Result = FindOrAdd(Isolate, Context, Class->GetClass(), Class);
    Info.GetReturnValue().Set(Result);
}

void FJsEnvImpl::FindModule(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(String);

    std::string Name = *(v8::String::Utf8Value(Isolate, Info[0]));

    auto Func = FindAddonRegisterFunc(Name);

    if (Func)
    {
        auto Exports = v8::Object::New(Isolate);
        Func(Context, Exports);
        Info.GetReturnValue().Set(Exports);
    }
}

void FJsEnvImpl::SetInspectorCallback(const v8::FunctionCallbackInfo<v8::Value> &Info)
{
#ifndef WITH_QUICKJS
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (!Inspector) return;

    CHECK_V8_ARGS(Function);

    if (!InspectorChannel)
    {
        InspectorChannel = Inspector->CreateV8InspectorChannel();
        InspectorChannel->OnMessage([this](std::string Message)
            {
                //UE_LOG(LogTemp, Warning, TEXT("<-- %s"), UTF8_TO_TCHAR(Message.c_str()));
                v8::Isolate::Scope Isolatescope(MainIsolate);
                v8::HandleScope HandleScope(MainIsolate);
                v8::Local<v8::Context> ContextInner = DefaultContext.Get(MainIsolate);
                v8::Context::Scope ContextScope(ContextInner);

                auto Handler = InspectorMessageHandler.Get(MainIsolate);

                v8::Local<v8::Value > Args[] = { FV8Utils::ToV8String(MainIsolate, Message.c_str()) };

                v8::TryCatch TryCatch(MainIsolate);
                __USE(Handler->Call(ContextInner, ContextInner->Global(), 1, Args));
                if (TryCatch.HasCaught())
                {
                    Logger->Error(FString::Printf(TEXT("inspector callback exception %s"), *FV8Utils::TryCatchToString(MainIsolate, &TryCatch)));
                }
            });
    }

    InspectorMessageHandler.Reset(Isolate, v8::Local<v8::Function>::Cast(Info[0]));
#endif // !WITH_QUICKJS
}

void FJsEnvImpl::DispatchProtocolMessage(const v8::FunctionCallbackInfo<v8::Value> &Info)
{
#ifndef WITH_QUICKJS
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(String);

    if (InspectorChannel)
    {
        FString Message = FV8Utils::ToFString(Isolate, Info[0]);
        //UE_LOG(LogTemp, Warning, TEXT("--> %s"), *Message);
        InspectorChannel->DispatchProtocolMessage(TCHAR_TO_UTF8(*Message));
    }
#endif // !WITH_QUICKJS
}

void FJsEnvImpl::DumpStatisticsLog(const v8::FunctionCallbackInfo<v8::Value> &Info)
{
#ifndef WITH_QUICKJS
    v8::HeapStatistics Statistics;

    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    Isolate->GetHeapStatistics(&Statistics);

    FString StatisticsLog = FString::Printf(TEXT(
        "------------------------\n"
        "Dump Statistics of V8:\n"
        "total_heap_size: %u\n"
        "total_heap_size_executable: %u\n"
        "total_physical_size: %u\n"
        "total_available_size: %u\n"
        "used_heap_size: %u\n"
        "heap_size_limit: %u\n"
        "malloced_memory: %u\n"
        "external_memory: %u\n"
        "peak_malloced_memory: %u\n"
        "number_of_native_contexts: %u\n"
        "number_of_detached_contexts: %u\n"
        "does_zap_garbage: %u\n"
        "------------------------\n"),
        Statistics.total_heap_size(),
        Statistics.total_heap_size_executable(),
        Statistics.total_physical_size(),
        Statistics.total_available_size(),
        Statistics.used_heap_size(),
        Statistics.heap_size_limit(),
        Statistics.malloced_memory(),
        Statistics.external_memory(),
        Statistics.peak_malloced_memory(),
        Statistics.number_of_native_contexts(),
        Statistics.number_of_detached_contexts(),
        Statistics.does_zap_garbage()
    );

    Logger->Info(StatisticsLog);
#endif // !WITH_QUICKJS
}
}

