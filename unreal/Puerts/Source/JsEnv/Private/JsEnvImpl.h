/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "JsEnv.h"
#include "DynamicDelegateProxy.h"
#include "StructWrapper.h"
#include "V8Utils.h"
#include "Engine/Engine.h"
#include "ObjectMapper.h"
#include "JSLogger.h"
#include "TickerDelegateWrapper.h"
#include "TypeScriptGeneratedClass.h"
#include "ContainerMeta.h"

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#include "V8InspectorImpl.h"

namespace puerts
{
class JSError
{
public:
    FString Message;

    JSError() {}

    explicit JSError(const FString& m) : Message(m) {}
};

class FJsEnvImpl : public IJsEnv, IObjectMapper, public FUObjectArray::FUObjectDeleteListener
{
public:
    explicit FJsEnvImpl(const FString &ScriptRoot);

    FJsEnvImpl(std::shared_ptr<IJSModuleLoader> InModuleLoader, std::shared_ptr<ILogger> InLogger, int InPort,
        void* InExternalRuntime = nullptr, void* InExternalContext = nullptr);

    ~FJsEnvImpl() override;

    void Start(const FString& ModuleName, const TArray<TPair<FString, UObject*>> &Arguments) override;

    void LowMemoryNotification() override;

    void WaitDebugger(double timeout) override
    {
        const auto startTime = FDateTime::Now();
        while (Inspector && !Inspector->Tick())
        {
            if (timeout > 0)
            {
                auto now = FDateTime::Now();
                if ((now - startTime).GetTotalSeconds() >= timeout)
                {
                    break;
                }
            }
        }
    }

    virtual void TryBindJs(const class UObjectBase *InObject) override;

    virtual void RebindJs() override;

    virtual FString CurrentStackTrace() override;

    virtual void InitExtensionMethodsMap() override;

    void JsHotReload(FName ModuleName, const FString& JsSource);

    virtual void ReloadModule(FName ModuleName, const FString& JsSource) override;

public:
    void Bind(UClass *Class, UObject *UEObject, v8::Local<v8::Object> JSObject) override;

    void UnBind(UClass *Class, UObject *UEObject) override;

    void UnBind(UClass *Class, UObject *UEObject, bool ResetPointer);

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

    v8::Local<v8::Value> FindOrAddDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UObject* Owner, PropertyMacro* Property, void *DelegatePtr, bool PassByPointer) override;

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

    void TsConstruct(UTypeScriptGeneratedClass* Class, UObject* Object);

    void InvokeJsMethod(UObject *ContextObject, UJSGeneratedFunction* Function, FFrame &Stack, void *RESULT_PARAM);

    void InvokeTsMethod(UObject *ContextObject, UFunction *Function, FFrame &Stack, void *RESULT_PARAM);

    void NotifyReBind(UTypeScriptGeneratedClass* Class);

    v8::UniquePersistent<v8::Function> JsPromiseRejectCallback;

    V8_INLINE static FJsEnvImpl * Get(v8::Isolate* Isolate)
    {
        return static_cast<FJsEnvImpl*>(FV8Utils::IsolateData<IObjectMapper>(Isolate));
    }

public:
#if ENGINE_MINOR_VERSION > 22 || ENGINE_MAJOR_VERSION > 4
    void OnUObjectArrayShutdown() override
    {
        GUObjectArray.RemoveUObjectDeleteListener(static_cast<FUObjectArray::FUObjectDeleteListener*>(this));
    }
#endif
    void NotifyUObjectDeleted(const class UObjectBase *Object, int32 Index) override;

    void TryReleaseType(UStruct *Struct);

private:
    FString GetExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch);

    bool LoadFile(const FString& RequiringDir, const FString& ModuleName, FString& OutPath, FString& OutDebugPath, TArray<uint8>& Data, FString &ErrInfo);

    void ExecuteModule(const FString& ModuleName, std::function<FString(const FString&, const FString&)> Preprocessor = nullptr);

    void EvalScript(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void Log(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void LoadModule(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void LoadUEType(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void LoadCDataType(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void UEClassToJSClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    bool GetContainerTypeProperty(v8::Local<v8::Context> Context, v8::Local<v8::Value> Value, PropertyMacro ** PropertyPtr);

    void NewContainer(const v8::FunctionCallbackInfo<v8::Value>& Info);

    v8::Local<v8::FunctionTemplate> GetTemplateOfClass(UStruct *Class, bool &Existed);

    v8::Local<v8::Function> GetJsClass(UStruct *Class, v8::Local<v8::Context> Context);

    v8::Local<v8::FunctionTemplate> GetTemplateOfClass(const JSClassDefinition* ClassDefinition);

    FPropertyTranslator* GetContainerPropertyTranslator(PropertyMacro* Property);

    void SetTimeout(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void SetFTickerDelegate(const v8::FunctionCallbackInfo<v8::Value>& Info, bool Continue);

    void ReportExecutionException(v8::Isolate* Isolate, v8::TryCatch* TryCatch, std::function<void(const JSError*)> CompletionHandler);

    void RemoveFTickerDelegateHandle(FDelegateHandle* Handle);

    void SetInterval(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void ClearInterval(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void MergeObject(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void NewObjectByClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void NewStructByScriptStruct(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void MakeUClass(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void FindModule(const v8::FunctionCallbackInfo<v8::Value>& Info);

    void DumpStatisticsLog(const v8::FunctionCallbackInfo<v8::Value> &Info);

    void SetInspectorCallback(const v8::FunctionCallbackInfo<v8::Value> &Info);

    void DispatchProtocolMessage(const v8::FunctionCallbackInfo<v8::Value> &Info);

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

public:
    class TsDynamicInvokerImpl : public ITsDynamicInvoker
    {
    public:
        TsDynamicInvokerImpl(FJsEnvImpl *InParent) :Parent(InParent) {}

        void TsConstruct(UTypeScriptGeneratedClass* Class, UObject* Object) override
        {
            if (Parent) Parent->TsConstruct(Class, Object);
        }

        void InvokeTsMethod(UObject *ContextObject, UFunction *Function, FFrame &Stack, void *RESULT_PARAM) override
        {
            if (Parent) Parent->InvokeTsMethod(ContextObject, Function, Stack, RESULT_PARAM);
        }

        void NotifyReBind(UTypeScriptGeneratedClass* Class) override
        {
            if (Parent) Parent->NotifyReBind(Class);
        }

        FJsEnvImpl *Parent;
    };

    TSharedPtr<ITsDynamicInvoker> TsDynamicInvoker;

private:
    puerts::FObjectRetainer UserObjectRetainer;

    puerts::FObjectRetainer SysObjectRetainer;

    std::shared_ptr<IJSModuleLoader> ModuleLoader;

    std::shared_ptr<ILogger> Logger;

    bool Started;

private:
    v8::Isolate::CreateParams CreateParams;

    v8::Isolate* MainIsolate;

    v8::Global<v8::Context> DefaultContext;

    v8::Global<v8::Function> Require;

    v8::Global<v8::Function> ReloadJs;

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
        bool PassByPointer;
        TWeakObjectPtr<UDynamicDelegateProxy> Proxy;//for delegate
        TSet<TWeakObjectPtr<UDynamicDelegateProxy>> Proxys; // for MulticastDelegate
    };

    struct TsFunctionInfo
    {
        v8::UniquePersistent<v8::Function> JsFunction;

        std::unique_ptr<puerts::FFunctionTranslator> FunctionTranslator;
    };

    class DynamicInvokerImpl : public IDynamicInvoker
    {
    public:
        DynamicInvokerImpl(FJsEnvImpl *InParent) :Parent(InParent) {}

        void InvokeJsCallabck(UDynamicDelegateProxy* Proxy, void* Parms) override
        {
            if (Parent) Parent->InvokeJsCallabck(Proxy, Parms);
        }

        void Construct(UClass* Class, UObject* Object, const v8::UniquePersistent<v8::Function> &Constructor, const v8::UniquePersistent<v8::Object> &Prototype) override
        {
            if (Parent) Parent->Construct(Class, Object, Constructor, Prototype);
        }

        void InvokeJsMethod(UObject *ContextObject, UJSGeneratedFunction* Function, FFrame &Stack, void *RESULT_PARAM) override
        {
            if (Parent) Parent->InvokeJsMethod(ContextObject, Function, Stack, RESULT_PARAM);
        }

        FJsEnvImpl *Parent;
    };

    struct FBindInfo
    {
        FName Name;
        v8::UniquePersistent<v8::Function> Constructor;
        v8::UniquePersistent<v8::Object> Prototype;
    };

    std::map<UTypeScriptGeneratedClass*, FBindInfo> BindInfoMap;

    void MakeSureInject(UTypeScriptGeneratedClass* Class, bool ForceReinject, bool RebindObject);

    TSharedPtr<DynamicInvokerImpl> DynamicInvoker;

    TSet<UClass *> GeneratedClasses;

    v8::UniquePersistent<v8::FunctionTemplate> DelegateTemplate;

    v8::UniquePersistent<v8::FunctionTemplate> MulticastDelegateTemplate;

    std::map<void*, DelegateObjectInfo> DelegateMap;

    std::map<UFunction*, TsFunctionInfo> TsFunctionMap;

    std::map<UStruct*, std::vector<UFunction*>> ExtensionMethodsMap;

    bool ExtensionMethodsMapInited = false;

    std::map<FDelegateHandle*, FTickerDelegateWrapper*> TickerDelegateHandleMap;

    FDelegateHandle DelegateProxysCheckerHandler;

    V8Inspector* Inspector;

    V8InspectorChannel* InspectorChannel;

    v8::Global<v8::Function> InspectorMessageHandler;

    FContainerMeta ContainerMeta;
};

}
