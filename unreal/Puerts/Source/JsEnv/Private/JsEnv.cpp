/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JsEnv.h"
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
#include "JitScript.h"
#include "Async/Async.h"
#include "JSGeneratedClass.h"
#include "JSAnimGeneratedClass.h"
#include "JSWidgetGeneratedClass.h"
#include "JSGeneratedFunction.h"
#include "JSClassRegister.h"

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "V8InspectorImpl.h"

#if PLATFORM_WINDOWS
#include "Blob/Win64/NativesBlob.h"
#include "Blob/Win64/SnapshotBlob.h"
#elif PLATFORM_ANDROID_ARM
#if ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION == 25
#include "Blob/Android/armv7a/8.4.371.19/SnapshotBlob.h"
#elif ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION < 25
#include "Blob/Android/armv7a/7.4.288/NativesBlob.h"
#include "Blob/Android/armv7a/7.4.288/SnapshotBlob.h"
#endif
#elif PLATFORM_ANDROID_ARM64
#if ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION == 25
#include "Blob/Android/arm64/8.4.371.19/SnapshotBlob.h"
#elif ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION < 25
#include "Blob/Android/arm64/7.4.288/NativesBlob.h"
#include "Blob/Android/arm64/7.4.288/SnapshotBlob.h"
#endif
#elif PLATFORM_MAC
#include "Blob/macOS/NativesBlob.h"
#include "Blob/macOS/SnapshotBlob.h"
#elif PLATFORM_IOS
#include "Blob/iOS/arm64/NativesBlob.h"
#include "Blob/iOS/arm64/SnapshotBlob.h"
#endif

namespace puerts
{

static void PointerNew(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    //do nothing
}

class FJsEnvImpl : public IJsEnv, IObjectMapper, public FUObjectArray::FUObjectDeleteListener
{
public:
    explicit FJsEnvImpl(const FString &ScriptRoot);

    FJsEnvImpl(std::unique_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int Port);

    ~FJsEnvImpl() override;

    void Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>> &Arguments) override;

    void LowMemoryNotification() override;

    void WaitDebugger() override
    {
        while(Inspector && !Inspector->Tick()){}
    }

public:
    void Bind(UClass *Class, UObject *UEObject, v8::Local<v8::Object> JSObject) override;

    void UnBind(UClass *Class, UObject *UEObject) override;

    v8::Local<v8::Value> FindOrAdd(v8::Isolate* InIsolate, v8::Local<v8::Context>& Context, UClass *Class, UObject *UEObject) override;

    void BindStruct(UScriptStruct* ScriptStruct, void *Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer) override;

    void UnBindStruct(UScriptStruct* ScriptStruct, void *Ptr) override;

    void UnBindCData(JSClassDefinition* ClassDefinition, void *Ptr) override;

    v8::Local<v8::Value> FindOrAddStruct(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UScriptStruct* ScriptStruct, void *Ptr, bool PassByPointer) override;

    void BindCData(JSClassDefinition* ClassDefinition, void *Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer) override;

    v8::Local<v8::Value> FindOrAddCData(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const char* CDataName, void *Ptr, bool PassByPointer) override;

    void Merge(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Src, UStruct* DesType, void* Des) override;

    void BindContainer(void* Ptr, v8::Local<v8::Object> JSObject, void(*Callback)(const v8::WeakCallbackInfo<void>& data)) override;

    void UnBindContainer(void* Ptr) override;

    v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, v8::Local<v8::Function> Constructor, PropertyMacro* Property1, PropertyMacro* Property2, void *Ptr, bool PassByPointer);

    v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property, FScriptArray *Ptr, bool PassByPointer) override;

    v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property, FScriptSet *Ptr, bool PassByPointer) override;

    v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, FScriptMap *Ptr, bool PassByPointer) override;

    v8::Local<v8::Value> FindOrAddDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UObject* Owner, PropertyMacro* Property, void *DelegatePtr) override;

    bool AddToDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void *DelegatePtr, v8::Local<v8::Function> JsFunction) override;

    bool RemoveFromDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void *DelegatePtr, v8::Local<v8::Function> JsFunction) override;

    bool ClearDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void *DelegatePtr) override;

    void ExecuteDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info, void *DelegatePtr) override;

    bool IsInstanceOf(UStruct *Struct, v8::Local<v8::Object> JsObject) override;

    bool IsInstanceOf(const char* CDataName, v8::Local<v8::Object> JsObject) override;

    bool CheckDelegateProxys(float tick);

    v8::Local<v8::Value> CreateArray(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, FPropertyTranslator* Property, void* ArrayPtr) override;

    void InvokeJsCallabck(UDynamicDelegateProxy* Proxy, void* Parms);

    void Construct(UClass* Class, UObject* Object, const v8::UniquePersistent<v8::Function> &Constructor, const v8::UniquePersistent<v8::Object> &Prototype);

    void InvokeJsMethod(UJSGeneratedFunction* Function, FFrame &Stack, void *RESULT_PARAM);

public:
#if ENGINE_MINOR_VERSION > 22
    void OnUObjectArrayShutdown() override
    {
        GUObjectArray.RemoveUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
    }
#endif
    void NotifyUObjectDeleted(const class UObjectBase *Object, int32 Index) override;

private:
    FString GetExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch);

    void LoadFile(const FString& RequiringDir, const FString& ModuleName, FString& OutPath, FString& OutDebugPath, TArray<uint8>& Data);

    void ExecuteModule(const FString& ModuleName, std::function<FString(const FString&, const FString&)> Preprocessor = nullptr);

    void EvalScript(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void Log(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void LoadModule(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void LoadUEType(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void LoadCDataType(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void UEClassToJSClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    v8::Local<v8::FunctionTemplate> GetTemplateOfClass(UStruct *Class);

    v8::Local<v8::FunctionTemplate> GetTemplateOfClass(const JSClassDefinition* ClassDefinition);

    void IncTypeRef(UStruct* Struct);

    void DecClassRef(UStruct* Struct);

    void DecScriptStructRef(UScriptStruct* ScriptStruct);

    FPropertyTranslator* GetContainerPropertyTranslator(PropertyMacro* Property);

    void InitExtensionMethodsMap();

    void SetTimeout(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void SetFTickerDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info, bool Continue);

    void ReportExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch, std::function<void(const JSError*)> CompletionHandler);

    void RemoveFTickerDelegateHandle(FDelegateHandle* Handle);

    void SetInterval(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void ClearInterval(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void MergeObject(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void NewObjectByClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void MakeUClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void FindModule(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void DumpStatisticsLog(const v8::FunctionCallbackInfo<v8::Value> &Info);

    struct ObjectMerger;

    std::unique_ptr<ObjectMerger>& GetObjectMerger(UStruct * Struct);

    struct ObjectMerger
    {
        std::map<std::string, std::unique_ptr<FPropertyTranslator>> Fields;
        UStruct *Struct;
        FJsEnvImpl* Parent;

        ObjectMerger(FJsEnvImpl* InParent, UStruct *InStruct)
        {
            Parent = InParent;
            Struct = InStruct;
            for (TFieldIterator<PropertyMacro> It(Struct); It; ++It)
            {
                PropertyMacro *Property = *It;
                TStringConversion<TStringConvert<TCHAR, ANSICHAR>> Name(*Property->GetName());
                Fields[Name.Get()] = FPropertyTranslator::Create(Property);
            }
        }

        void Merge(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> JsObject, void* Ptr)
        {
            if (auto Class = Cast<UClass>(Struct))
            {
                UObject *Object = reinterpret_cast<UObject *>(Ptr);
                if (!Object->IsValidLowLevel() || Object->IsPendingKill() || Object->GetClass() != Class || FV8Utils::GetPoninter(JsObject))
                {
                    return;
                }
            }
            auto Keys = JsObject->GetOwnPropertyNames(Context).ToLocalChecked();
            for (decltype(Keys->Length()) i = 0; i < Keys->Length(); ++i)
            {
                auto Key = Keys->Get(Context, i).ToLocalChecked();
                auto Iter = Fields.find(*v8::String::Utf8Value(Isolate, Key));
                if (Iter != Fields.end())
                {
                    auto MaybeValue = JsObject->Get(Context, Key);
                    if (!MaybeValue.IsEmpty())
                    {
                        auto Value = MaybeValue.ToLocalChecked();
                        if (Value->IsObject())
                        {
                            auto JsObjectField = Value->ToObject(Context).ToLocalChecked();
                            if (!FV8Utils::GetPoninterFast<void>(JsObjectField))
                            {
                                UStruct *FieldStruct = nullptr;
                                if (auto ObjectPropertyBase = CastFieldMacro<ObjectPropertyBaseMacro>(Iter->second->Property))
                                {
                                    FieldStruct = ObjectPropertyBase->PropertyClass;
                                }
                                else if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(Iter->second->Property))
                                {
                                    FieldStruct = StructProperty->Struct;
                                }
                                if (FieldStruct)
                                {
                                    Parent->GetObjectMerger(FieldStruct)->Merge(Isolate, Context, JsObjectField, Iter->second->Property->ContainerPtrToValuePtr<void>(Ptr));
                                }
                                continue;
                            }
                        }
                        if (!Value->IsUndefined())Iter->second->JsToUEInContainer(Isolate, Context, Value, Ptr, true);
                    }
                }
            }
        }
    };

        
    friend ObjectMerger;

private:
    puerts::FObjectRetainer UserObjectRetainer;

    puerts::FObjectRetainer SysObjectRetainer;

    std::unique_ptr<IJSModuleLoader> ModuleLoader;

    std::shared_ptr<ILogger> Logger;

    bool Started;

private:
    v8::Isolate::CreateParams CreateParams;

    v8::Isolate* MainIsolate;

    v8::Global<v8::Context> DefaultContext;

    std::map<UStruct*, v8::UniquePersistent<v8::FunctionTemplate>> ClassToTemplateMap;

    std::map<const void*, v8::UniquePersistent<v8::FunctionTemplate>> CDataNameToTemplateMap;

    std::map<UStruct*, std::pair<std::unique_ptr<FStructWrapper>, int>> TypeReflectionMap;

    std::map<UObject*, v8::UniquePersistent<v8::Value> > ObjectMap;
    std::map<const class UObjectBase*, v8::UniquePersistent<v8::Value> > GeneratedObjectMap;

    std::map<void*, v8::UniquePersistent<v8::Value> > StructMap;
    std::map<void*, v8::UniquePersistent<v8::Value> > CDataMap;

    std::map<void*, FinalizeFunc > CDataFinalizeMap;
    std::map<void*, UScriptStruct* > ScriptStructTypeMap;

    v8::UniquePersistent<v8::FunctionTemplate> ArrayTemplate;

    v8::UniquePersistent<v8::FunctionTemplate> SetTemplate;

    v8::UniquePersistent<v8::FunctionTemplate> MapTemplate;

    v8::UniquePersistent<v8::FunctionTemplate> FixSizeArrayTemplate;

    v8::UniquePersistent<v8::Function> PointerConstrutor;

    std::map<PropertyMacro*, std::unique_ptr<FPropertyTranslator>> ContainerPropertyMap;

    std::map<UFunction*, std::unique_ptr<FFunctionTranslator>> JsCallbackPrototypeMap;

    std::map<UStruct *, std::unique_ptr<ObjectMerger>> ObjectMergers;

    struct DelegateObjectInfo
    {
        v8::UniquePersistent<v8::Object> JSObject;//function to proxy save here
        TWeakObjectPtr<UObject> Owner;//可用于自动清理
        DelegatePropertyMacro *DelegateProperty;
        MulticastDelegatePropertyMacro *MulticastDelegateProperty;
        UFunction *SignatureFunction;
        UDynamicDelegateProxy *Proxy;//for delegate
        TSet<UDynamicDelegateProxy*> Proxys; // for MulticastDelegate
    };

    class DynamicInvokerImpl : public IDynamicInvoker
    {
    public:
        DynamicInvokerImpl() :Parent(nullptr) {}

        void InvokeJsCallabck(UDynamicDelegateProxy* Proxy, void* Parms) override
        {
            if (Parent) Parent->InvokeJsCallabck(Proxy, Parms);
        }

        void Construct(UClass* Class, UObject* Object, const v8::UniquePersistent<v8::Function> &Constructor, const v8::UniquePersistent<v8::Object> &Prototype) override
        {
            if (Parent) Parent->Construct(Class, Object, Constructor, Prototype);
        }

        void InvokeJsMethod(UJSGeneratedFunction* Function, FFrame &Stack, void *RESULT_PARAM) override
        {
            if (Parent) Parent->InvokeJsMethod(Function, Stack, RESULT_PARAM);
        }

        FJsEnvImpl *Parent;
    };

    TSharedPtr<DynamicInvokerImpl> DynamicInvoker;

    TArray<UClass *> GeneratedClassList;

    v8::UniquePersistent<v8::FunctionTemplate> DelegateTemplate;

    v8::UniquePersistent<v8::FunctionTemplate> MulticastDelegateTemplate;

    std::map<void*, DelegateObjectInfo> DelegateMap;

    std::map<UStruct*, std::vector<UFunction*>> ExtensionMethodsMap;

    std::map<FDelegateHandle*, FTickerDelegateWrapper*> TickerDelegateHandleMap;

    FDelegateHandle DelegateProxysCheckerHandler;

    V8Inspector* Inspector;

private:
    std::shared_ptr<FJitScript> JitScript;

    uint64 AllocRequestId;

    std::map<uint64, v8::UniquePersistent<v8::Function>> PendingRequests;

    void RequestJitModuleMethod(const v8::FunctionCallbackInfo<v8::Value>& Info);
};

FJsEnv::FJsEnv(const FString &ScriptRoot)
{
    GameScript = std::make_unique<FJsEnvImpl>(ScriptRoot);
}

FJsEnv::FJsEnv(std::unique_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InDebugPort)
{
    GameScript = std::make_unique<FJsEnvImpl>(std::move(InModuleLoader), InLogger, InDebugPort);
}

void FJsEnv::Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>> &Arguments)
{
    GameScript->Start(ModuleName, Arguments);
}

void FJsEnv::LowMemoryNotification()
{
    GameScript->LowMemoryNotification();
}

void FJsEnv::WaitDebugger()
{
    GameScript->WaitDebugger();
}

FJsEnvImpl::FJsEnvImpl(const FString &ScriptRoot):FJsEnvImpl(std::make_unique<DefaultJSModuleLoader>(ScriptRoot), std::make_shared<FDefaultLogger>(), -1)
{
}

FJsEnvImpl::FJsEnvImpl(std::unique_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InDebugPort)
{
    GUObjectArray.AddUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));

#if PLATFORM_IOS
    std::string Flags = "--jitless";
    v8::V8::SetFlagsFromString(Flags.c_str(), static_cast<int>(Flags.size()));
#endif

#if PLATFORM_ANDROID
    std::string Flags = "--trace-gc-object-stats";
    v8::V8::SetFlagsFromString(Flags.c_str(), static_cast<int>(Flags.size()));
#endif

    Started = false;
    Inspector = nullptr;

    ModuleLoader = std::move(InModuleLoader);
    Logger = InLogger;
#if !PLATFORM_ANDROID || \
    (PLATFORM_ANDROID && ENGINE_MAJOR_VERSION == 4 && ENGINE_MINOR_VERSION < 25)
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
    MainIsolate = v8::Isolate::New(CreateParams);
    auto Isolate = MainIsolate;
    Isolate->SetData(0, static_cast<IObjectMapper*>(this));//直接传this会有问题，强转后地址会变

    v8::Isolate::Scope Isolatescope(Isolate);
    v8::HandleScope HandleScope(Isolate);

    v8::Local<v8::Context> Context = v8::Context::New(Isolate);
    DefaultContext.Reset(Isolate, Context);

    v8::Context::Scope ContextScope(Context);
    v8::Local<v8::Object> Global = Context->Global();
    Global->Set(Context, FV8Utils::InternalString(Isolate, "global"), Global)
        .Check();

    Global->Set(Context, FV8Utils::InternalString(Isolate, "puerts"), v8::Object::New(Isolate))
        .Check();

    auto This = v8::External::New(Isolate, this);

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsEvalScript"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->EvalScript(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsLog"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->Log(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsLoadModule"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->LoadModule(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsLoadUEType"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->LoadUEType(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsLoadCDataType"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->LoadCDataType(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsUEClassToJSClass"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->UEClassToJSClass(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsMergeObject"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->MergeObject(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsNewObject"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->NewObjectByClass(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsRequestJitModuleMethod"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->RequestJitModuleMethod(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsMakeUClass"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->MakeUClass(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "__tgjsFindModule"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->FindModule(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "setTimeout"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->SetTimeout(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "clearTimeout"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->ClearInterval(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "setInterval"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->SetInterval(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "clearInterval"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->ClearInterval(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    Global->Set(Context, FV8Utils::ToV8String(Isolate, "dumpStatisticsLog"), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        auto Self = reinterpret_cast<FJsEnvImpl*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        Self->DumpStatisticsLog(Info);
    }, This)->GetFunction(Context).ToLocalChecked()).Check();

    ArrayTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FScriptArrayWrapper::ToFunctionTemplate(Isolate));

    SetTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FScriptSetWrapper::ToFunctionTemplate(Isolate));

    MapTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FScriptMapWrapper::ToFunctionTemplate(Isolate));

    FixSizeArrayTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FFixSizeArrayWrapper::ToFunctionTemplate(Isolate));

    auto LocalTemplate = v8::FunctionTemplate::New(Isolate, PointerNew);
    LocalTemplate->InstanceTemplate()->SetInternalFieldCount(4);//0 Ptr, 1, CDataName
    PointerConstrutor = v8::UniquePersistent<v8::Function>(Isolate, LocalTemplate->GetFunction(Context).ToLocalChecked());
    
    DelegateTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FDelegateWrapper::ToFunctionTemplate(Isolate));

    MulticastDelegateTemplate = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, FMulticastDelegateWrapper::ToFunctionTemplate(Isolate));

    DynamicInvoker = MakeShared<DynamicInvokerImpl>();
    DynamicInvoker->Parent = this;

    InitExtensionMethodsMap();

    if (InDebugPort >= 0)
    {
        Inspector = CreateV8Inspector(InDebugPort, &Context);
    }

    ExecuteModule("puerts/first_run.js");
    ExecuteModule("puerts/polyfill.js");
    ExecuteModule("puerts/log.js");
    ExecuteModule("puerts/modular.js");
    ExecuteModule("puerts/uelazyload.js");
    ExecuteModule("puerts/argv.js");
    ExecuteModule("puerts/jit_stub.js");

    DelegateProxysCheckerHandler = FTicker::GetCoreTicker().AddTicker(TBaseDelegate<bool, float>::CreateRaw(this, &FJsEnvImpl::CheckDelegateProxys), 1);
}

// #lizard forgives
FJsEnvImpl::~FJsEnvImpl()
{
    if (JitScript)
    {
        JitScript->Close();

        for (auto Iter = PendingRequests.begin(); Iter != PendingRequests.end(); Iter++)
        {
            Iter->second.Reset();
        }
        PendingRequests.clear();
    }

    FTicker::GetCoreTicker().RemoveTicker(DelegateProxysCheckerHandler);
    {
        auto Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        for (auto Iter = ClassToTemplateMap.begin(); Iter != ClassToTemplateMap.end(); Iter++)
        {
            Iter->second.Reset();
        }

        for (auto Iter = CDataNameToTemplateMap.begin(); Iter != CDataNameToTemplateMap.end(); Iter++)
        {
            Iter->second.Reset();
        }

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

        for (auto Iter = CDataMap.begin(); Iter != CDataMap.end(); Iter++)
        {
            Iter->second.Reset();
        }

        for (auto Iter = CDataFinalizeMap.begin(); Iter != CDataFinalizeMap.end(); Iter++)
        {
            if(Iter->second) Iter->second(Iter->first);
        }

        for (auto Iter = ScriptStructTypeMap.begin(); Iter != ScriptStructTypeMap.end(); Iter++)
        {
            if (Iter->second && Iter->second->IsValidLowLevelFast() && !Iter->second->IsPendingKill())
            {
                Iter->second->DestroyStruct(Iter->first);
                FMemory::Free(Iter->first);
            }
        }

        for (auto Iter = DelegateMap.begin(); Iter != DelegateMap.end(); Iter++)
        {
            Iter->second.JSObject.Reset();
            if (Iter->second.Proxy)
            {
                Iter->second.Proxy->JsFunction.Reset();
            }
            for (auto ProxyIter = Iter->second.Proxys.CreateIterator(); ProxyIter; ++ProxyIter)
            {
                (*ProxyIter)->JsFunction.Reset();
            }
        }

        for (auto& Pair : TickerDelegateHandleMap)
        {
            FTicker::GetCoreTicker().RemoveTicker(*(Pair.first));
            delete Pair.first;
            delete Pair.second;
        }
        TickerDelegateHandleMap.clear();

        for (int i = 0; i < GeneratedClassList.Num(); ++i)
        {
            if (auto JSGeneratedClass = Cast< UJSGeneratedClass>(GeneratedClassList[i]))
            {
                JSGeneratedClass->Release();
            }
            else if (auto JSWidgetGeneratedClass = Cast<UJSWidgetGeneratedClass>(GeneratedClassList[i]))
            {
                JSWidgetGeneratedClass->Release();
            }
            else if (auto JSAnimGeneratedClass = Cast< UJSAnimGeneratedClass>(GeneratedClassList[i]))
            {
                JSAnimGeneratedClass->Release();
            }
        }
    }

    if (Inspector)
    {
        delete Inspector;
        Inspector = nullptr;
    }
        
    DynamicInvoker->Parent = nullptr;
    DynamicInvoker.Reset();

    MulticastDelegateTemplate.Reset();
    DelegateTemplate.Reset();
    PointerConstrutor.Reset();
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
        if (Class->IsChildOf<UExtensionMethods>())
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
                            ExtensionMethodsMap[Struct].push_back(Function);
                        }
                    }
                }
            }
        }
    }
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
    if (FV8Utils::GetPoninterFast<void>(Des, 1)) //struct
    {
        auto Struct = Cast<UScriptStruct>(FV8Utils::GetUObject(Des, 1));
        if (Struct)
        {
            Merge(Isolate, Context, Src, Struct, FV8Utils::GetPoninter(Des));
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

void FJsEnvImpl::LowMemoryNotification()
{
    MainIsolate->LowMemoryNotification();
}

void FJsEnvImpl::IncTypeRef(UStruct* Struct)
{
    if (!Struct->IsNative())
    {
        ++TypeReflectionMap[Struct].second; //ref count
    }
}

void FJsEnvImpl::DecClassRef(UStruct* Struct)
{
    if (!Struct->IsNative())
    {
        if (--TypeReflectionMap[Struct].second == 0)
        {
            //Logger->Warn(FString::Printf(TEXT("release class: %s"), *Struct->GetName()));
            ClassToTemplateMap[Struct].Reset();
            ClassToTemplateMap.erase(Struct);
            TypeReflectionMap.erase(Struct);
        }
    }
}

void FJsEnvImpl::DecScriptStructRef(UScriptStruct* ScriptStruct)
{
    if (!ScriptStruct->IsNative())
    {
        if (--TypeReflectionMap[ScriptStruct].second == 0)
        {
            //Logger->Warn(FString::Printf(TEXT("release class: %s"), *Struct->GetName()));
            ClassToTemplateMap[ScriptStruct].Reset();
            ClassToTemplateMap.erase(ScriptStruct);
            TypeReflectionMap.erase(ScriptStruct);
            SysObjectRetainer.Release(ScriptStruct);
        }
    }
}

void FJsEnvImpl::Bind(UClass *Class, UObject *UEObject, v8::Local<v8::Object> JSObject) // Just call in FClassReflection::Call, new a Object
{
    UserObjectRetainer.Retain(UEObject);
    FV8Utils::SetPointer(MainIsolate, JSObject, UEObject, 0);
    FV8Utils::SetPointer(MainIsolate, JSObject, nullptr, 1);
    ObjectMap[UEObject] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
    ObjectMap[UEObject].SetWeak<UClass>(Class, FClassWrapper::OnGarbageCollected, v8::WeakCallbackType::kInternalFields);
    IncTypeRef(Class);
}

void FJsEnvImpl::UnBind(UClass *Class, UObject *UEObject)
{
    ObjectMap.erase(UEObject);
    UserObjectRetainer.Release(UEObject);
    DecClassRef(Class);
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
        return GetTemplateOfClass(Class)->GetFunction(Context).ToLocalChecked()->NewInstance(Context, 1, Args).ToLocalChecked();
    }
    else
    {
        return v8::Local<v8::Value>::New(Isolate, Iter->second);
    }
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddStruct(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UScriptStruct* ScriptStruct, void *Ptr, bool PassByPointer)
{
    check(Ptr);//must not null

    if (ScriptStruct == FArrayBuffer::StaticStruct())
    {
        FArrayBuffer * ArrayBuffer = static_cast<FArrayBuffer *>(Ptr);
        v8::Local<v8::ArrayBuffer> Ab = v8::ArrayBuffer::New(Isolate, ArrayBuffer->Data, ArrayBuffer->Length);
        return Ab;
    }

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
    return GetTemplateOfClass(ScriptStruct)->GetFunction(Context).ToLocalChecked()->NewInstance(Context, 2, Args).ToLocalChecked();
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddCData(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const char* CDataName, void *Ptr, bool PassByPointer)
{
    if (Ptr == nullptr)
    {
        return v8::Undefined(Isolate);
    }

    if (!PassByPointer)
    {
        auto Iter = CDataMap.find(Ptr);
        if (Iter != CDataMap.end())
        {
            return v8::Local<v8::Value>::New(Isolate, Iter->second);
        }
    }

    //create and link
    auto BindTo = v8::External::New(Context->GetIsolate(), Ptr);
    v8::Handle<v8::Value> Args[] = { BindTo, v8::Boolean::New(Isolate, PassByPointer) };
    auto ClassDefinition = FindClassByID(CDataName);
    if (ClassDefinition)
    {
        return GetTemplateOfClass(ClassDefinition)->GetFunction(Context).ToLocalChecked()->NewInstance(Context, 2, Args).ToLocalChecked();
    }
    else
    {
        auto Result = PointerConstrutor.Get(Isolate)->NewInstance(Context, 0, nullptr).ToLocalChecked();
        FV8Utils::SetPointer(Isolate, Result, Ptr, 0);
        FV8Utils::SetPointer(Isolate, Result, const_cast<char*>(CDataName), 1);
        return Result;
    }
}

v8::Local<v8::Value> FJsEnvImpl::FindOrAddDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UObject* Owner, PropertyMacro* Property, void *DelegatePtr)
{
    check(DelegatePtr);//must not null

    auto Iter = DelegateMap.find(DelegatePtr);
    if (Iter == DelegateMap.end())//create and link
    {
        //UE_LOG(LogTemp, Warning, TEXT("FindOrAddDelegate -- new %s"), *Property->GetName());
        auto Constructor = (Property->IsA<DelegatePropertyMacro>() ? DelegateTemplate : MulticastDelegateTemplate).Get(Isolate)->GetFunction(Context).ToLocalChecked();
        auto JSObject = Constructor->NewInstance(Context).ToLocalChecked();
        FV8Utils::SetPointer(Isolate, JSObject, DelegatePtr, 0);
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
            nullptr
        };
        return JSObject;
    }
    else
    {
        //UE_LOG(LogTemp, Warning, TEXT("FindOrAddDelegate -- old %s"), *Property->GetName());
        return Iter->second.JSObject.Get(Isolate);
    }
}

v8::Local<v8::Value> FJsEnvImpl::CreateArray(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, FPropertyTranslator* Property, void* ArrayPtr)
{
    auto Array = FixSizeArrayTemplate.Get(Isolate)->GetFunction(Context).ToLocalChecked()->NewInstance(Context).ToLocalChecked();
    FV8Utils::SetPointer(Isolate, Array, ArrayPtr, 0);
    FV8Utils::SetPointer(Isolate, Array, Property, 1);
    return Array;
}

void FJsEnvImpl::InvokeJsCallabck(UDynamicDelegateProxy* Proxy, void* Parms)
{
    auto SignatureFunction = Proxy->SignatureFunction;
    auto Iter = JsCallbackPrototypeMap.find(SignatureFunction);
    if (Iter == JsCallbackPrototypeMap.end())
    {
        JsCallbackPrototypeMap[SignatureFunction] = std::make_unique<FFunctionTranslator>(Proxy->SignatureFunction);
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
        Logger->Error(FString::Printf(TEXT("js callback exception %s"), *GetExecutionException(Isolate, &TryCatch)));
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

    auto ReturnVal1 = JSObject->SetPrototype(Context, Prototype.Get(Isolate));

    auto ReturnVal2 = Constructor.Get(Isolate)->Call(Context, JSObject, 0, nullptr);

    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("js callback exception %s"), *GetExecutionException(Isolate, &TryCatch)));
    }
    GeneratedObjectMap[Object] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
    UnBind(Class, Object);
}

void FJsEnvImpl::NotifyUObjectDeleted(const class UObjectBase *Object, int32 Index)
{
    auto Iter = GeneratedObjectMap.find(Object);
    if (Iter != GeneratedObjectMap.end())
    {
        //UE_LOG(LogTemp, Warning, TEXT("NotifyUObjectDeleted: %s(%p)"), *Object->GetClass()->GetName(), Object);
        auto Isolate = MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        auto Context = v8::Local<v8::Context>::New(Isolate, DefaultContext);
        v8::Context::Scope ContextScope(Context);

        auto JSObject = Iter->second.Get(Isolate)->ToObject(Context).ToLocalChecked();
        FV8Utils::SetPointer(Isolate, JSObject, nullptr, 0);
        FV8Utils::SetPointer(Isolate, JSObject, nullptr, 1);
        GeneratedObjectMap.erase(Object);
    }
}

void FJsEnvImpl::InvokeJsMethod(UJSGeneratedFunction* Function, FFrame &Stack, void *RESULT_PARAM)
{
    auto Isolate = MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    auto Context = DefaultContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);

    v8::TryCatch TryCatch(Isolate);

    Function->FunctionTranslator->CallJs(Isolate, Context, Function->JsFunction.Get(Isolate),
        GeneratedObjectMap[Stack.Object].Get(Isolate), Stack, RESULT_PARAM);

    if (TryCatch.HasCaught())
    {
        Logger->Error(FString::Printf(TEXT("call %s::%s of %p fail: %s"), *Stack.Object->GetClass()->GetName(),
            *Function->GetName(), Stack.Object, *GetExecutionException(Isolate, &TryCatch)));
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
        JsCallbackPrototypeMap[SignatureFunction] = std::make_unique<FFunctionTranslator>(SignatureFunction);
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
        DelegateMap.erase(Iter);
        return false;
    }
    if (Iter->second.Proxy)
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
        static_cast<FMulticastScriptDelegate*>(DelegatePtr)->AddUnique(Delegate);
    }
    return true;
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

        static_cast<FMulticastScriptDelegate*>(DelegatePtr)->Remove(Delegate);
            
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
        if (Iter->second.Proxy)
        {
            if (Iter->second.Owner.IsValid())
            {
                FScriptDelegate Delegate;
                *(static_cast<FScriptDelegate*>(DelegatePtr)) = Delegate;
            }

            SysObjectRetainer.Release(Iter->second.Proxy);
            Iter->second.Proxy->JsFunction.Reset();
            Iter->second.Proxy = nullptr;
        }
    }
    else if (Iter->second.MulticastDelegateProperty)
    {
        if (Iter->second.Owner.IsValid())
        {
            static_cast<FMulticastScriptDelegate*>(DelegatePtr)->Clear();
        }

        for (auto ProxyIter = Iter->second.Proxys.CreateIterator(); ProxyIter; ++ProxyIter)
        {
            (*ProxyIter)->JsFunction.Reset();
            SysObjectRetainer.Release(*ProxyIter);
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
        DelegateMap.erase(PendingToRemove[i]);
    }
    return true;
}

FPropertyTranslator* FJsEnvImpl::GetContainerPropertyTranslator(PropertyMacro* Property)
{
    auto Iter = ContainerPropertyMap.find(Property);
    if (Iter == ContainerPropertyMap.end())
    {
        ContainerPropertyMap[Property] = FPropertyTranslator::Create(Property);
#if ENGINE_MINOR_VERSION < 25
        if (!Property->IsNative())
        {
            SysObjectRetainer.Retain(Property);
        }
#endif
        return ContainerPropertyMap[Property].get();
    }
    else
    {
        return Iter->second.get();
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
    FV8Utils::SetPointer(Isolate, Result, GetContainerPropertyTranslator(Property1), 1);
    if (Property2) FV8Utils::SetPointer(Isolate, Result, GetContainerPropertyTranslator(Property2), 2);
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
    FV8Utils::SetPointer(MainIsolate, JSObject, Ptr, 0);
    FV8Utils::SetPointer(MainIsolate, JSObject, ScriptStruct, 1);// add type info
        
    if (!PassByPointer)
    {
        StructMap[Ptr] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
        ScriptStructTypeMap[Ptr] = ScriptStruct;
        StructMap[Ptr].SetWeak<UScriptStruct>(ScriptStruct, FScriptStructWrapper::OnGarbageCollectedWithFree, v8::WeakCallbackType::kInternalFields);
    }
    //IncTypeRef(ScriptStruct);
}

static void CDataGarbageCollectedWithFree(const v8::WeakCallbackInfo<JSClassDefinition>& Data)
{
    JSClassDefinition *ClassDefinition = Data.GetParameter();
    void *Ptr = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
    if (ClassDefinition->Finalize) ClassDefinition->Finalize(Ptr);
    FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindCData(ClassDefinition, Ptr);
}

void FJsEnvImpl::BindCData(JSClassDefinition* ClassDefinition, void *Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer)
{
    FV8Utils::SetPointer(MainIsolate, JSObject, Ptr, 0);
    FV8Utils::SetPointer(MainIsolate, JSObject, const_cast<char*>(ClassDefinition->CDataName), 1);

    if(!PassByPointer)//指针传递不用处理GC
    {
        CDataMap[Ptr] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
        CDataFinalizeMap[Ptr] = ClassDefinition->Finalize;
        CDataMap[Ptr].SetWeak<JSClassDefinition>(ClassDefinition, CDataGarbageCollectedWithFree, v8::WeakCallbackType::kInternalFields);
    }
}

void FJsEnvImpl::UnBindStruct(UScriptStruct* ScriptStruct, void *Ptr)
{
    ScriptStructTypeMap.erase(Ptr);
    StructMap.erase(Ptr);
    //DecScriptStructRef(ScriptStruct);
}

void FJsEnvImpl::UnBindCData(JSClassDefinition* ClassDefinition, void *Ptr)
{
    CDataFinalizeMap.erase(Ptr);
    CDataMap.erase(Ptr);
}

void FJsEnvImpl::BindContainer(void* Ptr, v8::Local<v8::Object> JSObject, void(*Callback)(const v8::WeakCallbackInfo<void>& data))
{
    FV8Utils::SetPointer(MainIsolate, JSObject, Ptr, 0);
    StructMap[Ptr] = v8::UniquePersistent<v8::Value>(MainIsolate, JSObject);
    StructMap[Ptr].SetWeak<void>(nullptr, Callback, v8::WeakCallbackType::kInternalFields);
}

void FJsEnvImpl::UnBindContainer(void* Ptr)
{
    StructMap.erase(Ptr);
}

v8::Local<v8::FunctionTemplate> FJsEnvImpl::GetTemplateOfClass(UStruct *InStruct)
{
    auto Isolate = MainIsolate;
    auto Iter = ClassToTemplateMap.find(InStruct);
    if (Iter == ClassToTemplateMap.end())
    {
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
                Template->Inherit(GetTemplateOfClass(SuperStruct));
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
                Template->Inherit(GetTemplateOfClass(SuperClass));
            }
        }
            
        ClassToTemplateMap[InStruct] = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, Template);

        return HandleScope.Escape(Template);
    }
    else
    {
        return v8::Local<v8::FunctionTemplate>::New(Isolate, Iter->second);
    }
}

bool FJsEnvImpl::IsInstanceOf(UStruct *Struct, v8::Local<v8::Object> JsObject)
{
    return GetTemplateOfClass(Struct)->HasInstance(JsObject);
}

bool FJsEnvImpl::IsInstanceOf(const char* CDataName, v8::Local<v8::Object> JsObject)
{
    return FV8Utils::GetPoninterFast<const char>(JsObject, 1) == CDataName;
}

static void CDataNew(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (Info.IsConstructCall())
    {
        auto Self = Info.This();
        JSClassDefinition* ClassDefinition = reinterpret_cast<JSClassDefinition*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        void* Ptr = nullptr;
        bool PassByPointer = false;

        if (Info.Length() == 2 && Info[0]->IsExternal()) //Call by Native
        {
            Ptr = v8::Local<v8::External>::Cast(Info[0])->Value();
            PassByPointer = Info[1]->BooleanValue(Isolate);
        }
        else // Call by js new
        {
            if(ClassDefinition->Initialize) Ptr = ClassDefinition->Initialize(Info);
        }
        FV8Utils::IsolateData<IObjectMapper>(Isolate)->BindCData(ClassDefinition, Ptr, Self, PassByPointer);
    }
    else
    {
        FV8Utils::ThrowException(Isolate, "only call as Construct is supported!");
    }
}

v8::Local<v8::FunctionTemplate> FJsEnvImpl::GetTemplateOfClass(const JSClassDefinition* ClassDefinition)
{
    check(ClassDefinition);
    auto Isolate = MainIsolate;
    auto Iter = CDataNameToTemplateMap.find(ClassDefinition->CDataName);
    if (Iter == CDataNameToTemplateMap.end())
    {
        v8::EscapableHandleScope HandleScope(Isolate);

        auto Template = v8::FunctionTemplate::New(Isolate, CDataNew, v8::External::New(Isolate, const_cast<void *>(reinterpret_cast<const void*>(ClassDefinition))));
        Template->InstanceTemplate()->SetInternalFieldCount(4);

        JSPropertyInfo* PropertyInfo = ClassDefinition->Propertys;
        while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
        {
            v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
            if (!PropertyInfo->Setter) PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
            Template->PrototypeTemplate()->SetAccessor(FV8Utils::InternalString(Isolate, PropertyInfo->Name), PropertyInfo->Getter, PropertyInfo->Setter,
                v8::Local<v8::Value>(), v8::DEFAULT, PropertyAttribute);
            ++PropertyInfo;
        }

        JSFunctionInfo* FunctionInfo = ClassDefinition->Methods;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            Template->PrototypeTemplate()->Set(FV8Utils::InternalString(Isolate, FunctionInfo->Name), v8::FunctionTemplate::New(Isolate, FunctionInfo->Callback));
            ++FunctionInfo;
        }
        FunctionInfo = ClassDefinition->Functions;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            Template->Set(FV8Utils::InternalString(Isolate, FunctionInfo->Name), v8::FunctionTemplate::New(Isolate, FunctionInfo->Callback));
            ++FunctionInfo;
        }

        if (ClassDefinition->CDataSuperName)
        {
            if (auto SuperDefinition = FindClassByID(ClassDefinition->CDataSuperName))
            {
                Template->Inherit(GetTemplateOfClass(SuperDefinition));
            }
        }

        CDataNameToTemplateMap[ClassDefinition->CDataName] = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, Template);

        return HandleScope.Escape(Template);
    }
    else
    {
        return v8::Local<v8::FunctionTemplate>::New(Isolate, Iter->second);
    }
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
        Info.GetReturnValue().Set(GetTemplateOfClass(Struct)->GetFunction(Context).ToLocalChecked());
    }
    else if (auto Enum = Cast<UEnum>(Type))
    {
        auto Result = v8::Object::New(Isolate);
        for (int i = 0; i < Enum->NumEnums(); ++i)
        {
            auto Name = Enum->GetNameStringByIndex(i);
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

void FJsEnvImpl::LoadCDataType(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    CHECK_V8_ARGS(String);

    FString TypeName = FV8Utils::ToFString(Isolate, Info[0]);

    auto ClassDef = FindCDataClassByName(TypeName);
    if (ClassDef)
    {
        Info.GetReturnValue().Set(GetTemplateOfClass(ClassDef)->GetFunction(Context).ToLocalChecked());
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
        Info.GetReturnValue().Set(GetTemplateOfClass(Struct)->GetFunction(Context).ToLocalChecked());
    }
    else
    {
        FV8Utils::ThrowException(Isolate, FString::Printf(TEXT("argument #0 expect a UStruct")));
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

void FJsEnvImpl::LoadFile(const FString& RequiringDir, const FString& ModuleName, FString& OutPath, FString& OutDebugPath, TArray<uint8>& Data)
{
    if (ModuleLoader->Search(RequiringDir, ModuleName, OutPath, OutDebugPath)) {
        if (!ModuleLoader->Load(OutPath, Data))
        {
            throw JSError(FString::Printf(TEXT("can not load [%s]"), *ModuleName));
        }
    }
    else {
        throw JSError(FString::Printf(TEXT("can not find [%s]"), *ModuleName));
    }
}

FString FJsEnvImpl::GetExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch)
{
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::String::Utf8Value Exception(Isolate, TryCatch->Exception());
    FString ExceptionStr(*Exception);
    v8::Local<v8::Message> Message = TryCatch->Message();
    if (Message.IsEmpty())
    {
        // 如果没有提供更详细的信息，直接输出Exception
        return ExceptionStr;
    }
    else
    {
        v8::Local<v8::Context> Context(Isolate->GetCurrentContext());

        // 输出 (filename):(line number): (message).
        v8::String::Utf8Value FileName(Isolate, Message->GetScriptOrigin().ResourceName());
        int LineNum = Message->GetLineNumber(Context).FromJust();
        FString FileNameStr(*FileName);
        FString LineNumStr = FString::FromInt(LineNum);
        FString FileInfoStr;
        FileInfoStr.Append(FileNameStr).Append(":").Append(LineNumStr).Append(": ").Append(ExceptionStr);

        FString FinalReport;
        FinalReport.Append(FileInfoStr).Append("\n");

        // 输出错误的一行源码
        v8::String::Utf8Value SourceLine(Isolate, Message->GetSourceLine(Context).ToLocalChecked());
        FString SourceLineStr(*SourceLine);

        FinalReport.Append(SourceLineStr).Append("\n");

        // 输出波浪下划线
        FString WavyUnderlineStr;
        int Start = Message->GetStartColumn(Context).FromJust();
        for (int Index = 0; Index < Start; Index++) {
            WavyUnderlineStr.Append(" ");
        }
        int End = Message->GetEndColumn(Context).FromJust();
        for (int Index = Start; Index < End; Index++) {
            WavyUnderlineStr.Append("^");
        }

        FinalReport.Append(WavyUnderlineStr);

        // 输出调用栈信息
        v8::Local<v8::Value> StackTrace;
        if (TryCatch->StackTrace(Context).ToLocal(&StackTrace) &&
            StackTrace->IsString() &&
            v8::Local<v8::String>::Cast(StackTrace)->Length() > 0)
        {
            v8::String::Utf8Value StackTraceVal(Isolate, StackTrace);
            FString StackTraceStr(*StackTraceVal);
            FinalReport.Append("\n").Append(StackTraceStr);
        }
        return FinalReport;
    }
}

void FJsEnvImpl::ExecuteModule(const FString& ModuleName, std::function<FString(const FString&, const FString&)> Preprocessor)
{
    FString OutPath;
    FString DebugPath;
    TArray<uint8> Data;

    try
    {
        LoadFile(TEXT(""), ModuleName, OutPath, DebugPath, Data);
    }
    catch (const JSError& Err)
    {
        Logger->Error(Err.Message);
        return;
    }

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
        FString FormattedScriptUrl = OutPath;
#else
        // 修改URL分隔符格式，否则无法匹配Inspector协议在打断点时发送的正则表达式，导致断点失败
        FString FormattedScriptUrl = OutPath.Replace(TEXT("/"), TEXT("\\"));
#endif
        v8::Local<v8::String> Name = FV8Utils::ToV8String(Isolate, FormattedScriptUrl);
        v8::ScriptOrigin Origin(Name);
        v8::Local<v8::String> Source = FV8Utils::ToV8String(Isolate, Script);
        v8::TryCatch TryCatch(Isolate);

        auto CompiledScript = v8::Script::Compile(Context, Source, &Origin);
        if (CompiledScript.IsEmpty())
        {
            Logger->Error(GetExecutionException(Isolate, &TryCatch));
            return;
        }
        auto ReturnVal = CompiledScript.ToLocalChecked()->Run(Context);
        if (TryCatch.HasCaught())
        {
            Logger->Error(GetExecutionException(Isolate, &TryCatch));
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
    try
    { 
        LoadFile(RequiringDir, ModuleName, OutPath, OutDebugPath, Data);
    }
    catch (const JSError& Err)
    {
        FV8Utils::ThrowException(Isolate, Err.Message);
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

    CHECK_V8_ARGS(Function, Int32);

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
    FTickerDelegate Delegate = TBaseDelegate<bool, float>::CreateRaw(DelegateWrapper, &FTickerDelegateWrapper::CallFunction);

    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    int Millisecond = Info[1]->Int32Value(Context).ToChecked();
    float Delay = Millisecond / 1000.f;

    // TODO - 如果实现多线程，这里应该加锁阻止定时回调的执行，直到DelegateWrapper设置好handle
    FDelegateHandle* DelegateHandle = new FDelegateHandle(FTicker::GetCoreTicker().AddTicker(Delegate, Delay));
    DelegateWrapper->SetDelegateHandle(DelegateHandle);
    TickerDelegateHandleMap[DelegateHandle] = DelegateWrapper;

    Info.GetReturnValue().Set(v8::Local<v8::External>::New(Info.GetIsolate(), v8::External::New(Info.GetIsolate(), DelegateHandle)));
}

void FJsEnvImpl::ReportExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch, std::function<void(const JSError*)> CompletionHandler)
{
    const JSError Error(GetExecutionException(Isolate, TryCatch));
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

    CHECK_V8_ARGS(Function, Int32);

    SetFTickerDelegate(Info, true);
}

void FJsEnvImpl::RequestJitModuleMethod(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    if (!JitScript)
    {
        AllocRequestId = 0;
        JitScript = std::make_unique<FJitScript>(std::make_unique<DefaultJSModuleLoader>(this->ModuleLoader->GetScriptRoot()), CreateJSEngine(), Logger);
        JitScript->Start("puerts/jit_skeleton.js");
    }

    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    //Arg1 = module#method#args
    CHECK_V8_ARGS(String, Function);

    uint64 RequestId = AllocRequestId;
    while (PendingRequests.find(RequestId) != PendingRequests.end())
    {
        ++RequestId;
    }
    AllocRequestId = RequestId + 1;

    PendingRequests[RequestId] = v8::UniquePersistent<v8::Function>(Isolate, v8::Local<v8::Function>::Cast(Info[1]));

    JitScript->SendRquest("requestModuleMethod", FV8Utils::ToFString(Isolate, Info[0]), [this, RequestId](const FString& Rpy, const puerts::JSError* Err)
    {
        AsyncTask(ENamedThreads::GameThread, [=]()
        {
            if (PendingRequests.find(RequestId) == PendingRequests.end())
            {
                Logger->Error(FString::Printf(TEXT("can not find the callback for RequestId(%llu)"), RequestId));
                return;
            }

            v8::Isolate::Scope IsolateScope1(MainIsolate);
            v8::HandleScope HandleScope1(MainIsolate);
            v8::Local<v8::Context> Context1 = DefaultContext.Get(MainIsolate);
            v8::Context::Scope ContextScope1(Context1);

            auto Callback = PendingRequests[RequestId].Get(MainIsolate);
            PendingRequests[RequestId].Reset();
            PendingRequests.erase(RequestId);

            v8::Local<v8::Value> Args[2];
            if (Err)
            {
                Args[0] = v8::Exception::Error(FV8Utils::ToV8String(MainIsolate, Err->Message));
            }
            else
            {
                Args[0] = v8::Undefined(MainIsolate);
            }
            Args[1] = FV8Utils::ToV8String(MainIsolate, Rpy);
                
            auto ReturnVal = Callback->Call(Context1, v8::Undefined(MainIsolate), 2, Args);
        });
    });
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

    auto Class = UJSGeneratedClass::Create(ClassName, ParentUClass, DynamicInvoker, Isolate, Constructor, Prototype);

    for (TFieldIterator<UFunction> It(ParentUClass, EFieldIteratorFlags::IncludeSuper, EFieldIteratorFlags::ExcludeDeprecated, EFieldIteratorFlags::IncludeInterfaces); It; ++It)
    {
        UFunction *Function = *It;
        if (Function->HasAnyFunctionFlags(FUNC_BlueprintEvent))
        {
            auto MaybeValue = Methods->Get(Context, FV8Utils::ToV8String(Isolate, Function->GetName()));
            if (!MaybeValue.IsEmpty() && MaybeValue.ToLocalChecked()->IsFunction())
            {
                //Logger->Warn(FString::Printf(TEXT("override: %s"), *Function->GetName()));
                UJSGeneratedClass::Override(Isolate, Class, Function, v8::Local<v8::Function>::Cast(MaybeValue.ToLocalChecked()), DynamicInvoker);
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
    GeneratedClassList.Add(Class);
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

    auto Name = FV8Utils::ToFString(Isolate, Info[0]);

    auto Func = FindAddonRegisterFunc(Name);

    if (Func)
    {
        auto Exports = v8::Object::New(Isolate);
        Func(Isolate, Context, Exports);
        Info.GetReturnValue().Set(Exports);
    }
}

void FJsEnvImpl::DumpStatisticsLog(const v8::FunctionCallbackInfo<v8::Value> &Info)
{
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
}
}
