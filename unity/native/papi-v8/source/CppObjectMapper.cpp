/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "CppObjectMapper.h"
#include "DataTransfer.h"
#include "pesapi.h"
#include "PString.h"
#include "TypeInfo.hpp"
#include "Log.h"

namespace PUERTS_NAMESPACE
{

#define container_of(ptr, type, member) ((type *)((char *)(ptr) - offsetof(type, member)))

static void ThrowException(v8::Isolate* Isolate, const char* Message)
{
    auto ExceptionStr = v8::String::NewFromUtf8(Isolate, Message, v8::NewStringType::kNormal).ToLocalChecked();
    Isolate->ThrowException(v8::Exception::Error(ExceptionStr));
}

void FCppObjectMapper::findClassByName(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Context::Scope ContextScope(Context);

    if (!Info[0]->IsString())
    {
        ThrowException(Isolate, "#0 argument expect a string");
        return;
    }

    PString TypeName = *(v8::String::Utf8Value(Isolate, Info[0]));

    auto ClassDef = FindCppTypeClassByName(Registry, TypeName);
    if (ClassDef)
    {
        Info.GetReturnValue().Set(GetTemplateOfClass(Isolate, ClassDef)->GetFunction(Context).ToLocalChecked());
    }
    else
    {
        PString ErrMsg = "can not find type: " + TypeName;
        ThrowException(Isolate, ErrMsg.c_str());
    }
}

v8::MaybeLocal<v8::Function> FCppObjectMapper::LoadTypeById(v8::Local<v8::Context> Context, const void* TypeId)
{
    auto ClassDef = puerts::LoadClassByID(Registry, TypeId);
    if (!ClassDef)
    {
        return v8::MaybeLocal<v8::Function>();
    }
    auto Template = GetTemplateOfClass(Context->GetIsolate(), ClassDef);
    return Template->GetFunction(Context);
}

static void PointerNew(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    // do nothing
}

void FCppObjectMapper::Initialize(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext)
{
    auto LocalTemplate = v8::FunctionTemplate::New(InIsolate, PointerNew);
    LocalTemplate->InstanceTemplate()->SetInternalFieldCount(4);    // 0 Ptr, 1, CDataName
    PointerTemplate = v8::UniquePersistent<v8::FunctionTemplate>(InIsolate, LocalTemplate);
    PrivateKey.Reset(InIsolate, v8::Symbol::New(InIsolate));

    v8::Local<v8::Context> Context = InIsolate->GetCurrentContext();
    auto This = v8::External::New(InIsolate, this);
    Context->Global()->Set(Context, v8::String::NewFromUtf8(InIsolate, "findClassByName").ToLocalChecked(),
    v8::FunctionTemplate::New(
        InIsolate,
        [](const v8::FunctionCallbackInfo<v8::Value>& Info)
        {
            auto Self = static_cast<FCppObjectMapper*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
            Self->findClassByName(Info);
        },
        This)->GetFunction(Context)
        .ToLocalChecked())
        .Check();
}

v8::Local<v8::Value> FCppObjectMapper::FindOrAddCppObject(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* TypeId, void* Ptr, bool PassByPointer)
{
    if (Ptr == nullptr)
    {
        return v8::Null(Isolate);
    }

    if (PassByPointer)
    {
        auto Iter = CDataCache.find(Ptr);
        if (Iter != CDataCache.end())
        {
            auto CacheNodePtr = Iter->second.Find(TypeId);
            if (CacheNodePtr)
            {
                return CacheNodePtr->Value.Get(Isolate);
            }
        }
    }

    // create and link
    auto ClassDefinition = LoadClassByID(Registry, TypeId);
    if (ClassDefinition)
    {
        auto Result = GetTemplateOfClass(Isolate, ClassDefinition)->InstanceTemplate()->NewInstance(Context).ToLocalChecked();
        BindCppObject(Isolate, const_cast<ScriptClassDefinition*>(ClassDefinition), Ptr, Result, PassByPointer);
        return Result;
    }
    else
    {
        auto Result = PointerTemplate.Get(Isolate)->InstanceTemplate()->NewInstance(Context).ToLocalChecked();
        DataTransfer::SetPointer(Isolate, Result, Ptr, 0);
        DataTransfer::SetPointer(Isolate, Result, TypeId, 1);
        return Result;
    }
}

static void PesapiFunctionCallback(const v8::FunctionCallbackInfo<v8::Value>& info)
{
    PesapiCallbackData* FunctionInfo = container_of(v8::Local<v8::External>::Cast(info.Data())->Value(), struct PesapiCallbackData, Data);
    FunctionInfo->Callback(&v8impl::g_pesapi_ffi, (pesapi_callback_info)(&info));
}

void FCppObjectMapper::CallbackDataGarbageCollected(const v8::WeakCallbackInfo<PesapiCallbackData>& Data)
{
    PesapiCallbackData* CallbackData = Data.GetParameter();
    if (CallbackData->Finalize)
    {
        CallbackData->Finalize(&v8impl::g_pesapi_ffi, CallbackData->Data, DataTransfer::GetIsolatePrivateData(Data.GetIsolate()));
    }
    for (auto it = CallbackData->CppObjectMapper->FunctionDatas.begin(); it != CallbackData->CppObjectMapper->FunctionDatas.end(); )
    {
        if (*it == CallbackData)
        {
            it = CallbackData->CppObjectMapper->FunctionDatas.erase(it);
        }
        else
        {
            ++it;
        }
    }
    delete CallbackData;
}

v8::MaybeLocal<v8::Function> FCppObjectMapper::CreateFunction(v8::Local<v8::Context> Context, pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize)
{
    auto Isolate = Context->GetIsolate();
    auto CallbackData = new PesapiCallbackData {Callback, Data, this};
    CallbackData->Finalize = Finalize;
    auto V8Data = v8::External::New(Isolate, &CallbackData->Data);
    auto Template = v8::FunctionTemplate::New(Isolate, PesapiFunctionCallback, V8Data);
    Template->Set(Isolate, "__do_not_cache", v8::ObjectTemplate::New(Isolate));
    auto Ret = Template->GetFunction(Context);
    if (!Ret.IsEmpty())
    {
        CallbackData->JsFunction.Reset(Isolate, Ret.ToLocalChecked());
        CallbackData->JsFunction.SetWeak<PesapiCallbackData>(
            CallbackData, CallbackDataGarbageCollected, v8::WeakCallbackType::kInternalFields);
        FunctionDatas.push_back(CallbackData);
    }
    else
    {
        delete CallbackData;
    }
    return Ret;
}

bool FCppObjectMapper::IsInstanceOfCppObject(v8::Isolate* Isolate, const void* TypeId, v8::Local<v8::Object> JsObject)
{
    if (DataTransfer::GetPointerFast<const void>(JsObject, 1) == TypeId)
    {
        return true;
    }
    auto ClassDefinition = FindClassByID(Registry, TypeId);
    if (ClassDefinition)
    {
        auto Template = GetTemplateOfClass(Isolate, ClassDefinition);
        return Template->HasInstance(JsObject);
    }
    return false;
}

std::weak_ptr<int> FCppObjectMapper::GetJsEnvLifeCycleTracker()
{
    return std::weak_ptr<int>(Ref);
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
        ScriptClassDefinition* ClassDefinition = container_of(v8::Local<v8::External>::Cast(Info.Data())->Value(), ScriptClassDefinition, Data);
        void* Ptr = nullptr;

        if (ClassDefinition->Initialize)
            Ptr = ClassDefinition->Initialize(&v8impl::g_pesapi_ffi, (pesapi_callback_info) &Info);
        if (Ptr == nullptr)
            return;

        DataTransfer::IsolateData<ICppObjectMapper>(Isolate)->BindCppObject(Isolate, ClassDefinition, Ptr, Self, false);
    }
    else
    {
        ThrowException(Isolate, "only call as Construct is supported!");
    }
}

static void PesapiCallbackWrap(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    ScriptFunctionInfo* FunctionInfo = container_of(v8::Local<v8::External>::Cast(Info.Data())->Value(), ScriptFunctionInfo, Data);
    FunctionInfo->Callback(&v8impl::g_pesapi_ffi, (pesapi_callback_info)(&Info));
}

static void PesapiGetterWrap(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    ScriptPropertyInfo* PropertyInfo = container_of(v8::Local<v8::External>::Cast(Info.Data())->Value(), ScriptPropertyInfo, GetterData);
    PropertyInfo->Getter(&v8impl::g_pesapi_ffi, (pesapi_callback_info)(&Info));
}

static void PesapiSetterWrap(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    ScriptPropertyInfo* PropertyInfo = container_of(v8::Local<v8::External>::Cast(Info.Data())->Value(), ScriptPropertyInfo, SetterData);
    PropertyInfo->Setter(&v8impl::g_pesapi_ffi, (pesapi_callback_info)(&Info));
}

static bool LazyMemberDefining = false;

// Check if any ancestor class in the inheritance chain has a method with the given name
static bool SuperHasMethod(ScriptClassRegistry* Registry, const ScriptClassDefinition* ClassDefinition, const char* Name)
{
    const void* SuperTypeId = ClassDefinition->SuperTypeId;
    while (SuperTypeId)
    {
        auto SuperDef = FindClassByID(Registry, SuperTypeId);
        if (!SuperDef)
            break;
        ScriptFunctionInfo* FunctionInfo = SuperDef->Methods;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            if (strcmp(FunctionInfo->Name, Name) == 0)
                return true;
            ++FunctionInfo;
        }
        SuperTypeId = SuperDef->SuperTypeId;
    }
    return false;
}

// Check if any ancestor class in the inheritance chain has a property with the given name
static bool SuperHasProperty(ScriptClassRegistry* Registry, const ScriptClassDefinition* ClassDefinition, const char* Name)
{
    const void* SuperTypeId = ClassDefinition->SuperTypeId;
    while (SuperTypeId)
    {
        auto SuperDef = FindClassByID(Registry, SuperTypeId);
        if (!SuperDef)
            break;
        ScriptPropertyInfo* PropertyInfo = SuperDef->Properties;
        while (PropertyInfo && PropertyInfo->Name)
        {
            if (strcmp(PropertyInfo->Name, Name) == 0)
                return true;
            ++PropertyInfo;
        }
        SuperTypeId = SuperDef->SuperTypeId;
    }
    return false;
}

static v8::Intercepted LazyInstanceMemberGetter(
    v8::Local<v8::Name> Name, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();

    if (!Name->IsString() || LazyMemberDefining)
        return v8::Intercepted::kNo;

    const ScriptClassDefinition* ClassDefinition =
        static_cast<const ScriptClassDefinition*>(v8::Local<v8::External>::Cast(Info.Data())->Value());

    v8::String::Utf8Value Utf8Name(Isolate, Name);
    const char* NameStr = *Utf8Name;
    PLog(puerts::LogLevel::Log, "++++++++++++++++++LazyInstanceMemberGetter: %s", NameStr);

    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    // Search Methods - find the LAST match to replicate PrototypeTemplate->Set() override behavior
    ScriptFunctionInfo* FunctionInfo = ClassDefinition->Methods;
    ScriptFunctionInfo* MatchedFunctionInfo = nullptr;
    while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
    {
        if (strcmp(FunctionInfo->Name, NameStr) == 0)
        {
            MatchedFunctionInfo = FunctionInfo;
        }
        ++FunctionInfo;
    }
    if (MatchedFunctionInfo)
    {
        v8::Local<v8::Function> Func;
        auto FastCallInfo = MatchedFunctionInfo->ReflectionInfo ? MatchedFunctionInfo->ReflectionInfo->FastCallInfo() : nullptr;
        if (FastCallInfo)
        {
            Func = v8::FunctionTemplate::New(Isolate, &PesapiCallbackWrap,
                v8::External::New(Isolate, &MatchedFunctionInfo->Data), v8::Local<v8::Signature>(), 0,
                v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect, FastCallInfo)
                ->GetFunction(Context).ToLocalChecked();
        }
        else
        {
            Func = v8::FunctionTemplate::New(
                Isolate, &PesapiCallbackWrap, v8::External::New(Isolate, &MatchedFunctionInfo->Data),
                v8::Local<v8::Signature>(), 0, v8::ConstructorBehavior::kThrow)
                ->GetFunction(Context).ToLocalChecked();
        }
        LazyMemberDefining = true;
        Info.Holder()->DefineOwnProperty(Context, Name, Func, v8::DontEnum).Check();
        LazyMemberDefining = false;
        Info.GetReturnValue().Set(Func);
        return v8::Intercepted::kYes;
    }

    // Search Properties - find the LAST match
    ScriptPropertyInfo* PropertyInfo = ClassDefinition->Properties;
    ScriptPropertyInfo* MatchedPropertyInfo = nullptr;
    while (PropertyInfo && PropertyInfo->Name)
    {
        if (strcmp(PropertyInfo->Name, NameStr) == 0)
        {
            MatchedPropertyInfo = PropertyInfo;
        }
        ++PropertyInfo;
    }
    if (MatchedPropertyInfo)
    {
        auto GetterData = v8::External::New(Isolate, &MatchedPropertyInfo->GetterData);
        auto SetterData = v8::External::New(Isolate, &MatchedPropertyInfo->SetterData);
        v8::Local<v8::Function> GetterFunc;
        v8::Local<v8::Function> SetterFunc;
        if (MatchedPropertyInfo->Getter)
        {
            GetterFunc = v8::FunctionTemplate::New(Isolate, &PesapiGetterWrap, GetterData)
                ->GetFunction(Context).ToLocalChecked();
        }
        if (MatchedPropertyInfo->Setter)
        {
            SetterFunc = v8::FunctionTemplate::New(Isolate, &PesapiSetterWrap, SetterData)
                ->GetFunction(Context).ToLocalChecked();
        }
        // Cache the accessor property on the holder (prototype)
        v8::Local<v8::Value> GetterVal = GetterFunc.IsEmpty() ? v8::Undefined(Isolate).As<v8::Value>() : GetterFunc.As<v8::Value>();
        v8::Local<v8::Value> SetterVal = SetterFunc.IsEmpty() ? v8::Undefined(Isolate).As<v8::Value>() : SetterFunc.As<v8::Value>();
        v8::PropertyDescriptor Desc(GetterVal, SetterVal);
        Desc.set_enumerable(true);
        Desc.set_configurable(false);
        LazyMemberDefining = true;
        (void) Info.Holder()->DefineProperty(Context, Name, Desc);
        LazyMemberDefining = false;
        // Invoke the getter for this first access
        if (MatchedPropertyInfo->Getter && !GetterFunc.IsEmpty())
        {
            v8::Local<v8::Value> Self = Info.This();
            v8::MaybeLocal<v8::Value> Result = GetterFunc->Call(Context, Self, 0, nullptr);
            if (!Result.IsEmpty())
            {
                Info.GetReturnValue().Set(Result.ToLocalChecked());
            }
        }
        return v8::Intercepted::kYes;
    }

    return v8::Intercepted::kNo;
}

static v8::Intercepted LazyInstanceMemberSetter(
    v8::Local<v8::Name> Name, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();

    if (!Name->IsString() || LazyMemberDefining)
        return v8::Intercepted::kNo;

    const ScriptClassDefinition* ClassDefinition =
        static_cast<const ScriptClassDefinition*>(v8::Local<v8::External>::Cast(Info.Data())->Value());

    v8::String::Utf8Value Utf8Name(Isolate, Name);
    const char* NameStr = *Utf8Name;

    PLog(puerts::LogLevel::Log, "...............LazyInstanceMemberSetter: %s", NameStr);

    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    // Search Properties - find the LAST match
    ScriptPropertyInfo* PropertyInfo = ClassDefinition->Properties;
    ScriptPropertyInfo* MatchedPropertyInfo = nullptr;
    while (PropertyInfo && PropertyInfo->Name)
    {
        if (strcmp(PropertyInfo->Name, NameStr) == 0)
        {
            MatchedPropertyInfo = PropertyInfo;
        }
        ++PropertyInfo;
    }
    if (MatchedPropertyInfo)
    {
        auto GetterData = v8::External::New(Isolate, &MatchedPropertyInfo->GetterData);
        auto SetterData = v8::External::New(Isolate, &MatchedPropertyInfo->SetterData);
        v8::Local<v8::Function> GetterFunc;
        v8::Local<v8::Function> SetterFunc;
        if (MatchedPropertyInfo->Getter)
        {
            GetterFunc = v8::FunctionTemplate::New(Isolate, &PesapiGetterWrap, GetterData)
                ->GetFunction(Context).ToLocalChecked();
        }
        if (MatchedPropertyInfo->Setter)
        {
            SetterFunc = v8::FunctionTemplate::New(Isolate, &PesapiSetterWrap, SetterData)
                ->GetFunction(Context).ToLocalChecked();
        }
        // Cache the accessor property on the holder (prototype)
        v8::Local<v8::Value> GetterVal = GetterFunc.IsEmpty() ? v8::Undefined(Isolate).As<v8::Value>() : GetterFunc.As<v8::Value>();
        v8::Local<v8::Value> SetterVal = SetterFunc.IsEmpty() ? v8::Undefined(Isolate).As<v8::Value>() : SetterFunc.As<v8::Value>();
        v8::PropertyDescriptor Desc(GetterVal, SetterVal);
        Desc.set_enumerable(true);
        Desc.set_configurable(false);
        LazyMemberDefining = true;
        (void) Info.Holder()->DefineProperty(Context, Name, Desc);
        LazyMemberDefining = false;
        // Invoke the setter for this first access
        if (MatchedPropertyInfo->Setter && !SetterFunc.IsEmpty())
        {
            v8::Local<v8::Value> Self = Info.This();
            v8::Local<v8::Value> Args[] = { Value };
            (void) SetterFunc->Call(Context, Self, 1, Args);
        }
        return v8::Intercepted::kYes;
    }

    // Not found in current ClassDefinition; if there's a C# base class, trigger a Get on
    // the parent prototype to lazily cache the accessor, then Set on the original instance
    // so that the setter callback receives the correct 'this' (the instance, not the prototype).
    if (ClassDefinition->SuperTypeId)
    {
        auto ProtoProto = Info.Holder()->GetPrototype();
        if (!ProtoProto.IsEmpty() && ProtoProto->IsObject())
        {
            // Trigger lazy getter on parent prototype to cache the accessor property
            (void) ProtoProto.As<v8::Object>()->Get(Context, Name);
            // Now set on the original instance; the cached accessor's setter will be invoked with correct 'this'
            (void) Info.This()->Set(Context, Name, Value);
            return v8::Intercepted::kYes;
        }
    }

    return v8::Intercepted::kNo;
}

// InstanceTemplate setter interceptor: triggers a Get on the prototype to lazily cache the
// accessor property, then sets on the instance so the setter callback receives correct 'this'.
static v8::Intercepted LazyInstanceSetterForwarder(
    v8::Local<v8::Name> Name, v8::Local<v8::Value> Value, const v8::PropertyCallbackInfo<void>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();

    if (!Name->IsString() || LazyMemberDefining)
        return v8::Intercepted::kNo;

    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Proto = Info.This()->GetPrototype();
    if (!Proto.IsEmpty() && Proto->IsObject())
    {
        // Trigger lazy getter on prototype to cache the accessor property
        (void) Proto.As<v8::Object>()->Get(Context, Name);
        // Now set on the instance; the cached accessor's setter will be invoked with correct 'this'
        auto Result = Info.This()->Set(Context, Name, Value);
        if (!Result.IsNothing() && Result.FromJust())
        {
            return v8::Intercepted::kYes;
        }
    }

    return v8::Intercepted::kNo;
}

v8::Local<v8::FunctionTemplate> FCppObjectMapper::GetTemplateOfClass(v8::Isolate* Isolate, const ScriptClassDefinition* ClassDefinition)
{
    auto Iter = TypeIdToTemplateMap.find(ClassDefinition->TypeId);
    if (Iter == TypeIdToTemplateMap.end())
    {
        auto Template = v8::FunctionTemplate::New(
            Isolate, CDataNew, v8::External::New(Isolate, &(const_cast<ScriptClassDefinition*>(ClassDefinition)->Data)));
        Template->InstanceTemplate()->SetInternalFieldCount(4);

        Template->PrototypeTemplate()->SetHandler(v8::NamedPropertyHandlerConfiguration(
            LazyInstanceMemberGetter, LazyInstanceMemberSetter, nullptr, nullptr, nullptr,
            v8::External::New(Isolate, const_cast<ScriptClassDefinition*>(ClassDefinition)),
            v8::PropertyHandlerFlags::kNonMasking));

        // InstanceTemplate setter interceptor: forwards set to prototype to trigger PrototypeTemplate's setter
        Template->InstanceTemplate()->SetHandler(v8::NamedPropertyHandlerConfiguration(
            nullptr, LazyInstanceSetterForwarder, nullptr, nullptr, nullptr,
            v8::Local<v8::Value>(),
            v8::PropertyHandlerFlags::kNonMasking));

        // For methods that override a parent method, register them directly on PrototypeTemplate
        // to avoid kNonMasking interceptor being skipped when parent prototype already has the property cached
        if (ClassDefinition->SuperTypeId)
        {
            ScriptFunctionInfo* FunctionInfo = ClassDefinition->Methods;
            while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
            {
                if (SuperHasMethod(Registry, ClassDefinition, FunctionInfo->Name))
                {
                    // Find the LAST match for this name to replicate override behavior
                    ScriptFunctionInfo* LastMatch = FunctionInfo;
                    ScriptFunctionInfo* Search = FunctionInfo + 1;
                    while (Search && Search->Name && Search->Callback)
                    {
                        if (strcmp(Search->Name, FunctionInfo->Name) == 0)
                            LastMatch = Search;
                        ++Search;
                    }
                    auto FastCallInfo = LastMatch->ReflectionInfo ? LastMatch->ReflectionInfo->FastCallInfo() : nullptr;
                    if (FastCallInfo)
                    {
                        Template->PrototypeTemplate()->Set(
                            v8::String::NewFromUtf8(Isolate, LastMatch->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                            v8::FunctionTemplate::New(Isolate, &PesapiCallbackWrap,
                                v8::External::New(Isolate, &LastMatch->Data), v8::Local<v8::Signature>(), 0,
                                v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect, FastCallInfo));
                    }
                    else
                    {
                        Template->PrototypeTemplate()->Set(
                            v8::String::NewFromUtf8(Isolate, LastMatch->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                            v8::FunctionTemplate::New(Isolate, &PesapiCallbackWrap,
                                v8::External::New(Isolate, &LastMatch->Data), v8::Local<v8::Signature>(), 0,
                                v8::ConstructorBehavior::kThrow));
                    }
                }
                ++FunctionInfo;
            }
        }

        // For properties that override a parent property, register them directly on PrototypeTemplate
        if (ClassDefinition->SuperTypeId)
        {
            ScriptPropertyInfo* PropertyInfo = ClassDefinition->Properties;
            while (PropertyInfo && PropertyInfo->Name)
            {
                if (SuperHasProperty(Registry, ClassDefinition, PropertyInfo->Name))
                {
                    // Find the LAST match for this name to replicate override behavior
                    ScriptPropertyInfo* LastMatch = PropertyInfo;
                    ScriptPropertyInfo* Search = PropertyInfo + 1;
                    while (Search && Search->Name)
                    {
                        if (strcmp(Search->Name, PropertyInfo->Name) == 0)
                            LastMatch = Search;
                        ++Search;
                    }
                    v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
                    if (!LastMatch->Setter)
                        PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
                    auto GetterData = v8::External::New(Isolate, &LastMatch->GetterData);
                    auto SetterData = v8::External::New(Isolate, &LastMatch->SetterData);
                    Template->PrototypeTemplate()->SetAccessorProperty(
                        v8::String::NewFromUtf8(Isolate, LastMatch->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                        LastMatch->Getter ? v8::FunctionTemplate::New(Isolate, &PesapiGetterWrap, GetterData)
                                          : v8::Local<v8::FunctionTemplate>(),
                        LastMatch->Setter ? v8::FunctionTemplate::New(Isolate, &PesapiSetterWrap, SetterData)
                                          : v8::Local<v8::FunctionTemplate>(),
                        PropertyAttribute);
                }
                ++PropertyInfo;
            }
        }

        ScriptPropertyInfo* PropertyInfo = ClassDefinition->Variables;
        while (PropertyInfo && PropertyInfo->Name)
        {
            v8::PropertyAttribute PropertyAttribute = v8::None;
            if (!PropertyInfo->Setter)
                PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
            auto GetterData = v8::External::New(Isolate, &PropertyInfo->GetterData);
            auto SetterData = v8::External::New(Isolate, &PropertyInfo->SetterData);
            Template->SetAccessorProperty(
                v8::String::NewFromUtf8(Isolate, PropertyInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                PropertyInfo->Getter ? v8::FunctionTemplate::New(Isolate, &PesapiGetterWrap, GetterData)
                                     : v8::Local<v8::FunctionTemplate>(),
                PropertyInfo->Setter ? v8::FunctionTemplate::New(Isolate, &PesapiSetterWrap, SetterData)
                                     : v8::Local<v8::FunctionTemplate>(),
                PropertyAttribute);
            ++PropertyInfo;
        }

        ScriptFunctionInfo* FunctionInfo = ClassDefinition->Functions;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            auto FastCallInfo = FunctionInfo->ReflectionInfo ? FunctionInfo->ReflectionInfo->FastCallInfo() : nullptr;
            if (FastCallInfo)
            {
                Template->Set(v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                    v8::FunctionTemplate::New(Isolate, &PesapiCallbackWrap,
                        v8::External::New(Isolate, &FunctionInfo->Data), v8::Local<v8::Signature>(), 0,
                        v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect, FastCallInfo));
            }
            else
            {
                Template->Set(v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                    v8::FunctionTemplate::New(
                        Isolate, &PesapiCallbackWrap, v8::External::New(Isolate, &FunctionInfo->Data),
                        v8::Local<v8::Signature>(), 0, v8::ConstructorBehavior::kThrow
                        ));
            }
            ++FunctionInfo;
        }

        if (ClassDefinition->SuperTypeId)
        {
            if (auto SuperDefinition = LoadClassByID(Registry, ClassDefinition->SuperTypeId))
            {
                Template->Inherit(GetTemplateOfClass(Isolate, SuperDefinition));
            }
        }

        TypeIdToTemplateMap[ClassDefinition->TypeId] = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, Template);

        return Template;
    }
    else
    {
        return v8::Local<v8::FunctionTemplate>::New(Isolate, Iter->second);
    }
}

static void CDataGarbageCollectedWithFree(const v8::WeakCallbackInfo<ScriptClassDefinition>& Data)
{
    ScriptClassDefinition* ClassDefinition = Data.GetParameter();
    void* Ptr = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
    if (ClassDefinition->Finalize)
        ClassDefinition->Finalize(&v8impl::g_pesapi_ffi, Ptr, ClassDefinition->Data, DataTransfer::GetIsolatePrivateData(Data.GetIsolate()));
    DataTransfer::IsolateData<ICppObjectMapper>(Data.GetIsolate())->UnBindCppObject(Data.GetIsolate(), ClassDefinition, Ptr);
}

static void CDataGarbageCollectedWithoutFree(const v8::WeakCallbackInfo<ScriptClassDefinition>& Data)
{
    ScriptClassDefinition* ClassDefinition = Data.GetParameter();
    void* Ptr = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
    DataTransfer::IsolateData<ICppObjectMapper>(Data.GetIsolate())->UnBindCppObject(Data.GetIsolate(), ClassDefinition, Ptr);
}

void FCppObjectMapper::BindCppObject(
    v8::Isolate* Isolate, ScriptClassDefinition* ClassDefinition, void* Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer)
{
    DataTransfer::SetPointer(Isolate, JSObject, Ptr, 0);
    DataTransfer::SetPointer(Isolate, JSObject, ClassDefinition->TypeId, 1);

    auto Iter = CDataCache.find(Ptr);
    FObjectCacheNode* CacheNodePtr;
    if (Iter != CDataCache.end())
    {
        auto Temp = Iter->second.Find(ClassDefinition->TypeId);
        CacheNodePtr = Temp ? Temp : Iter->second.Add(ClassDefinition->TypeId);
    }
    else
    {
        auto Ret = CDataCache.insert({Ptr, FObjectCacheNode(ClassDefinition->TypeId)});
        CacheNodePtr = &Ret.first->second;
    }
    CacheNodePtr->Value.Reset(Isolate, JSObject);

    if (!PassByPointer)
    {
        CacheNodePtr->MustCallFinalize = true;
        CacheNodePtr->Value.SetWeak<ScriptClassDefinition>(
            ClassDefinition, CDataGarbageCollectedWithFree, v8::WeakCallbackType::kInternalFields);
    }
    else
    {
        CacheNodePtr->Value.SetWeak<ScriptClassDefinition>(
            ClassDefinition, CDataGarbageCollectedWithoutFree, v8::WeakCallbackType::kInternalFields);
    }

    if (ClassDefinition->OnEnter)
    {
        CacheNodePtr->UserData = ClassDefinition->OnEnter(Ptr, ClassDefinition->Data, DataTransfer::GetIsolatePrivateData(Isolate));
    }
}

void* FCppObjectMapper::GetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject)
{
    auto Key = PrivateKey.Get(Context->GetIsolate());
    auto hasOwn = JSObject->HasOwnProperty(Context, Key);
    if (hasOwn.IsNothing() || !hasOwn.FromJust())
    {
        return nullptr;
    }
    v8::MaybeLocal<v8::Value> maybeValue = JSObject->Get(Context, Key);
    if (maybeValue.IsEmpty())
    {
        return nullptr;
    }

    v8::Local<v8::Value> maybeExternal = maybeValue.ToLocalChecked();
    if (!maybeExternal->IsExternal())
    {
        return nullptr;
    }

    return v8::Local<v8::External>::Cast(maybeExternal)->Value();
}

void FCppObjectMapper::SetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject, void* Ptr)
{
    auto Key = PrivateKey.Get(Context->GetIsolate());
    (void) (JSObject->Set(Context, Key, v8::External::New(Context->GetIsolate(), Ptr)));
}

void FCppObjectMapper::UnBindCppObject(v8::Isolate* Isolate, ScriptClassDefinition* ClassDefinition, void* Ptr)
{
    auto Iter = CDataCache.find(Ptr);
    if (Iter != CDataCache.end())
    {
        if (ClassDefinition->OnExit)
        {
            ClassDefinition->OnExit(Ptr, ClassDefinition->Data, DataTransfer::GetIsolatePrivateData(Isolate), Iter->second.UserData);
        }
        auto Removed = Iter->second.Remove(ClassDefinition->TypeId, true);
        if (!Iter->second.TypeId)    // last one
        {
            CDataCache.erase(Ptr);
        }
    }
}

void FCppObjectMapper::UnInitialize(v8::Isolate* InIsolate)
{
    auto PData = DataTransfer::GetIsolatePrivateData(InIsolate);
    for (auto& KV : CDataCache)
    {
        FObjectCacheNode* PNode = &KV.second;
        while (PNode)
        {
            const ScriptClassDefinition* ClassDefinition = FindClassByID(Registry, PNode->TypeId);
            if (PNode->MustCallFinalize)
            {
                if (ClassDefinition && ClassDefinition->Finalize)
                {
                    ClassDefinition->Finalize(&v8impl::g_pesapi_ffi, KV.first, ClassDefinition->Data, PData);
                }
                PNode->MustCallFinalize = false;
            }
            if (ClassDefinition->OnExit)
            {
                ClassDefinition->OnExit(KV.first, ClassDefinition->Data, PData, PNode->UserData);
            }
            PNode = PNode->Next;
        }
    }
    for(int i = 0;i < FunctionDatas.size(); ++i)
    {
        auto CallbackData = FunctionDatas[i];
        if (CallbackData->Finalize)
        {
            CallbackData->Finalize(&v8impl::g_pesapi_ffi, CallbackData->Data, PData);
        }
        delete CallbackData;
    }
    FunctionDatas.clear();
    CDataCache.clear();
    TypeIdToTemplateMap.clear();
    PrivateKey.Reset();
    PointerTemplate.Reset();
}

}    // namespace PUERTS_NAMESPACE
