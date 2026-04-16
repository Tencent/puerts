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
        auto Func = GetTemplateOfClass(Isolate, ClassDef)->GetFunction(Context).ToLocalChecked();
#ifdef PUERTS_LAZYLOAD
        WrapFunctionWithStaticLazyInterceptor(Isolate, Context, Func, ClassDef);
#endif
        Info.GetReturnValue().Set(Func);
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
    auto MaybeFunc = Template->GetFunction(Context);
#ifdef PUERTS_LAZYLOAD
    if (!MaybeFunc.IsEmpty())
    {
        WrapFunctionWithStaticLazyInterceptor(Context->GetIsolate(), Context, MaybeFunc.ToLocalChecked(), ClassDef);
    }
#endif
    return MaybeFunc;
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

#ifdef PUERTS_LAZYLOAD
static thread_local bool LazyStaticMemberCaching = false;

struct LazyInterceptorData
{
    const ScriptClassDefinition* ClassDefinition;
    ScriptClassRegistry* Registry;
};

// Lazy getter interceptor for static functions via SetHandler on an inserted prototype node.
// Searches ClassDefinition->Functions for the requested name, creates the v8::Function on first access,
// and caches it directly on the interceptor node object.
static v8::Intercepted LazyStaticFunctionInterceptorGetter(
    v8::Local<v8::Name> Name, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();

    if (!Name->IsString() || LazyStaticMemberCaching)
        return v8::Intercepted::kNo;

    const ScriptClassDefinition* ClassDefinition =
        static_cast<const ScriptClassDefinition*>(v8::Local<v8::External>::Cast(Info.Data())->Value());

    v8::String::Utf8Value Utf8Name(Isolate, Name);
    const char* NameStr = *Utf8Name;

    // Search Functions (static methods)
    ScriptFunctionInfo* FunctionInfo = ClassDefinition->Functions;
    ScriptFunctionInfo* MatchedFunctionInfo = nullptr;
    while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
    {
        if (strcmp(FunctionInfo->Name, NameStr) == 0)
        {
            MatchedFunctionInfo = FunctionInfo;
            break;
        }
        ++FunctionInfo;
    }
    if (MatchedFunctionInfo)
    {
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
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
        // Cache the function on the interceptor node so subsequent accesses won't trigger the interceptor
        LazyStaticMemberCaching = true;
        (void) Info.This()->Set(Context, Name, Func);
        LazyStaticMemberCaching = false;
        Info.GetReturnValue().Set(Func);
        return v8::Intercepted::kYes;
    }

    // Search Variables (read-only static properties) for lazy getter creation
    ScriptPropertyInfo* PropertyInfo = ClassDefinition->Variables;
    ScriptPropertyInfo* MatchedPropertyInfo = nullptr;
    while (PropertyInfo && PropertyInfo->Name)
    {
        if (!PropertyInfo->Setter && strcmp(PropertyInfo->Name, NameStr) == 0)
        {
            MatchedPropertyInfo = PropertyInfo;
            break;
        }
        ++PropertyInfo;
    }
    if (MatchedPropertyInfo && MatchedPropertyInfo->Getter)
    {
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        auto GetterData = v8::External::New(Isolate, &MatchedPropertyInfo->GetterData);
        auto GetterFunc = v8::FunctionTemplate::New(Isolate, &PesapiGetterWrap, GetterData)
            ->GetFunction(Context).ToLocalChecked();

        // Cache as a read-only accessor property on the interceptor node
        v8::PropertyDescriptor Desc(GetterFunc.As<v8::Value>(), v8::Undefined(Isolate).As<v8::Value>());
        Desc.set_enumerable(true);
        Desc.set_configurable(false);
        LazyStaticMemberCaching = true;
        (void) Info.This()->DefineProperty(Context, Name, Desc);
        LazyStaticMemberCaching = false;

        // Invoke the getter for this first access
        v8::Local<v8::Value> Self = Info.This();
        v8::MaybeLocal<v8::Value> Result = GetterFunc->Call(Context, Self, 0, nullptr);
        if (!Result.IsEmpty())
        {
            Info.GetReturnValue().Set(Result.ToLocalChecked());
        }
        return v8::Intercepted::kYes;
    }

    return v8::Intercepted::kNo;
}

static thread_local bool LazyMemberCaching = false;
#endif // PUERTS_LAZYLOAD

#ifdef PUERTS_LAZYLOAD
// Check if any ancestor class in the inheritance chain has a static variable (Variables) with the given name
static bool SuperHasStaticVariable(ScriptClassRegistry* Registry, const ScriptClassDefinition* ClassDefinition, const char* Name)
{
    const void* SuperTypeId = ClassDefinition->SuperTypeId;
    while (SuperTypeId)
    {
        auto SuperDef = FindClassByID(Registry, SuperTypeId);
        if (!SuperDef)
            break;
        ScriptPropertyInfo* PropertyInfo = SuperDef->Variables;
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

// Check if any ancestor class in the inheritance chain has a static method (Functions) with the given name
static bool SuperHasStaticMethod(ScriptClassRegistry* Registry, const ScriptClassDefinition* ClassDefinition, const char* Name)
{
    const void* SuperTypeId = ClassDefinition->SuperTypeId;
    while (SuperTypeId)
    {
        auto SuperDef = FindClassByID(Registry, SuperTypeId);
        if (!SuperDef)
            break;
        ScriptFunctionInfo* FunctionInfo = SuperDef->Functions;
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
#endif // PUERTS_LAZYLOAD

#ifdef PUERTS_LAZYLOAD
// Search for a method by name in the given ClassDefinition's Methods, create the v8::Function,
// cache it on proto, and return it. If not found, recurse into the parent ClassDefinition
// (via SuperTypeId) and proto's prototype. Returns empty Maybe if no match in the entire chain.
static v8::MaybeLocal<v8::Function> FindAndCacheMethodInChain(
    v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Name> Name,
    const char* NameStr, const ScriptClassDefinition* ClassDefinition,
    v8::Local<v8::Object> Proto, ScriptClassRegistry* Registry)
{
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
        // Cache the method on proto so subsequent accesses won't trigger the interceptor
        LazyMemberCaching = true;
        (void) Proto->Set(Context, Name, Func);
        LazyMemberCaching = false;
        return Func;
    }

    // Not found in current ClassDefinition, recurse into parent
    if (ClassDefinition->SuperTypeId)
    {
        auto SuperDef = FindClassByID(Registry, ClassDefinition->SuperTypeId);
        if (SuperDef)
        {
            auto ProtoProtoVal = Proto->GetPrototype();
            if (!ProtoProtoVal.IsEmpty() && ProtoProtoVal->IsObject())
            {
                return FindAndCacheMethodInChain(
                    Isolate, Context, Name, NameStr, SuperDef,
                    ProtoProtoVal.As<v8::Object>(), Registry);
            }
        }
    }

    return v8::MaybeLocal<v8::Function>();
}

// Search for a property by name in the given ClassDefinition's Properties, create the accessor,
// cache it on proto, and return true. If not found, recurse into the parent ClassDefinition
// (via SuperTypeId) and proto's prototype. Returns false if no match in the entire chain.
static bool FindAndCachePropertyInChain(
    v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Name> Name,
    const char* NameStr, const ScriptClassDefinition* ClassDefinition,
    v8::Local<v8::Object> Proto, ScriptClassRegistry* Registry,
    v8::Local<v8::Value>* OutGetter, v8::Local<v8::Value>* OutSetter)
{
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
        v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
        if (!MatchedPropertyInfo->Setter)
            PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
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
        // Cache the accessor property on proto
        v8::Local<v8::Value> GetterVal = GetterFunc.IsEmpty() ? v8::Undefined(Isolate).As<v8::Value>() : GetterFunc.As<v8::Value>();
        v8::Local<v8::Value> SetterVal = SetterFunc.IsEmpty() ? v8::Undefined(Isolate).As<v8::Value>() : SetterFunc.As<v8::Value>();
        v8::PropertyDescriptor Desc(GetterVal, SetterVal);
        Desc.set_enumerable(true);
        Desc.set_configurable(false);
        LazyMemberCaching = true;
        (void) Proto->DefineProperty(Context, Name, Desc);
        LazyMemberCaching = false;
        if (OutGetter) *OutGetter = GetterVal;
        if (OutSetter) *OutSetter = SetterVal;
        return true;
    }

    // Not found in current ClassDefinition, recurse into parent
    if (ClassDefinition->SuperTypeId)
    {
        auto SuperDef = FindClassByID(Registry, ClassDefinition->SuperTypeId);
        if (SuperDef)
        {
            auto ProtoProtoVal = Proto->GetPrototype();
            if (!ProtoProtoVal.IsEmpty() && ProtoProtoVal->IsObject())
            {
                return FindAndCachePropertyInChain(
                    Isolate, Context, Name, NameStr, SuperDef,
                    ProtoProtoVal.As<v8::Object>(), Registry, OutGetter, OutSetter);
            }
        }
    }

    return false;
}

static v8::Intercepted LazyInstanceMemberGetter(
    v8::Local<v8::Name> Name, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();

    if (!Name->IsString())
        return v8::Intercepted::kNo;

    LazyInterceptorData* InterceptorData =
        static_cast<LazyInterceptorData*>(v8::Local<v8::External>::Cast(Info.Data())->Value());
    const ScriptClassDefinition* ClassDefinition = InterceptorData->ClassDefinition;
    ScriptClassRegistry* Registry = InterceptorData->Registry;

    v8::String::Utf8Value Utf8Name(Isolate, Name);
    const char* NameStr = *Utf8Name;

    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Proto = Info.This()->GetPrototype();
    if (Proto.IsEmpty() || !Proto->IsObject())
        return v8::Intercepted::kNo;

    v8::MaybeLocal<v8::Function> MaybeFunc = FindAndCacheMethodInChain(
        Isolate, Context, Name, NameStr, ClassDefinition, Proto.As<v8::Object>(), Registry);

    if (!MaybeFunc.IsEmpty())
    {
        Info.GetReturnValue().Set(MaybeFunc.ToLocalChecked());
        return v8::Intercepted::kYes;
    }

    // Try to find a property accessor in the inheritance chain
    v8::Local<v8::Value> GetterFunc;
    if (FindAndCachePropertyInChain(
        Isolate, Context, Name, NameStr, ClassDefinition, Proto.As<v8::Object>(), Registry, &GetterFunc, nullptr))
    {
        // Property found and cached; invoke the getter for this access
        if (GetterFunc->IsFunction())
        {
            v8::Local<v8::Value> Self = Info.This();
            v8::MaybeLocal<v8::Value> Result = GetterFunc.As<v8::Function>()->Call(Context, Self, 0, nullptr);
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

    if (!Name->IsString())
        return v8::Intercepted::kNo;

    LazyInterceptorData* InterceptorData =
        static_cast<LazyInterceptorData*>(v8::Local<v8::External>::Cast(Info.Data())->Value());
    const ScriptClassDefinition* ClassDefinition = InterceptorData->ClassDefinition;
    ScriptClassRegistry* Registry = InterceptorData->Registry;

    v8::String::Utf8Value Utf8Name(Isolate, Name);
    const char* NameStr = *Utf8Name;

    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Proto = Info.This()->GetPrototype();
    if (Proto.IsEmpty() || !Proto->IsObject())
        return v8::Intercepted::kNo;

    // Try to find a property accessor in the inheritance chain
    v8::Local<v8::Value> SetterFunc;
    if (FindAndCachePropertyInChain(
        Isolate, Context, Name, NameStr, ClassDefinition, Proto.As<v8::Object>(), Registry, nullptr, &SetterFunc))
    {
        // Property found and cached; invoke the setter for this access
        if (SetterFunc->IsFunction())
        {
            v8::Local<v8::Value> Self = Info.This();
            v8::Local<v8::Value> Args[] = { Value };
            (void) SetterFunc.As<v8::Function>()->Call(Context, Self, 1, Args);
        }
        return v8::Intercepted::kYes;
    }

    return v8::Intercepted::kNo;
}

// Prototype-level lazy getter: triggered when accessing properties directly on the prototype object
// (e.g. CS.System.Object.prototype.ToString), not through an instance.
static v8::Intercepted LazyPrototypeMemberGetter(
    v8::Local<v8::Name> Name, const v8::PropertyCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();

    if (!Name->IsString() || LazyMemberCaching)
        return v8::Intercepted::kNo;

    LazyInterceptorData* InterceptorData =
        static_cast<LazyInterceptorData*>(v8::Local<v8::External>::Cast(Info.Data())->Value());
    const ScriptClassDefinition* ClassDefinition = InterceptorData->ClassDefinition;
    ScriptClassRegistry* Registry = InterceptorData->Registry;

    v8::String::Utf8Value Utf8Name(Isolate, Name);
    const char* NameStr = *Utf8Name;

    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    // Info.This() is the prototype object itself; cache methods/properties directly on it
    v8::Local<v8::Object> Proto = Info.This();

    v8::MaybeLocal<v8::Function> MaybeFunc = FindAndCacheMethodInChain(
        Isolate, Context, Name, NameStr, ClassDefinition, Proto, Registry);

    if (!MaybeFunc.IsEmpty())
    {
        Info.GetReturnValue().Set(MaybeFunc.ToLocalChecked());
        return v8::Intercepted::kYes;
    }

    // Try to find a property accessor in the inheritance chain
    // For prototype-level access, just cache the accessor; don't invoke the getter
    // (there's no real instance to call it on)
    if (FindAndCachePropertyInChain(
        Isolate, Context, Name, NameStr, ClassDefinition, Proto, Registry, nullptr, nullptr))
    {
        return v8::Intercepted::kYes;
    }

    return v8::Intercepted::kNo;
}
#endif // PUERTS_LAZYLOAD

v8::Local<v8::FunctionTemplate> FCppObjectMapper::GetTemplateOfClass(v8::Isolate* Isolate, const ScriptClassDefinition* ClassDefinition)
{
    auto Iter = TypeIdToTemplateMap.find(ClassDefinition->TypeId);
    if (Iter == TypeIdToTemplateMap.end())
    {
        auto Template = v8::FunctionTemplate::New(
            Isolate, CDataNew, v8::External::New(Isolate, &(const_cast<ScriptClassDefinition*>(ClassDefinition)->Data)));
        Template->InstanceTemplate()->SetInternalFieldCount(4);

#ifdef PUERTS_LAZYLOAD
        // InstanceTemplate, PrototypeTemplate
        auto InterceptorData = new LazyInterceptorData{ClassDefinition, Registry};
        InterceptorDatas.push_back(InterceptorData);
        Template->InstanceTemplate()->SetHandler(v8::NamedPropertyHandlerConfiguration(
            LazyInstanceMemberGetter, LazyInstanceMemberSetter, nullptr, nullptr, nullptr,
            v8::External::New(Isolate, InterceptorData),
            v8::PropertyHandlerFlags::kNonMasking));

        Template->PrototypeTemplate()->SetHandler(v8::NamedPropertyHandlerConfiguration(
            LazyPrototypeMemberGetter, nullptr, nullptr, nullptr, nullptr,
            v8::External::New(Isolate, InterceptorData),
            v8::PropertyHandlerFlags::kNonMasking));
#endif // PUERTS_LAZYLOAD

        // Methods
        {
            ScriptFunctionInfo* FunctionInfo = ClassDefinition->Methods;
            while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
            {
#ifdef PUERTS_LAZYLOAD
                if (ClassDefinition->SuperTypeId && SuperHasMethod(Registry, ClassDefinition, FunctionInfo->Name))
#endif
                {
                    auto FastCallInfo = FunctionInfo->ReflectionInfo ? FunctionInfo->ReflectionInfo->FastCallInfo() : nullptr;
                    if (FastCallInfo)
                    {
                        Template->PrototypeTemplate()->Set(
                            v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                            v8::FunctionTemplate::New(Isolate, &PesapiCallbackWrap,
                                v8::External::New(Isolate, &FunctionInfo->Data), v8::Local<v8::Signature>(), 0,
                                v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect, FastCallInfo));
                    }
                    else
                    {
                        Template->PrototypeTemplate()->Set(
                            v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                            v8::FunctionTemplate::New(Isolate, &PesapiCallbackWrap,
                                v8::External::New(Isolate, &FunctionInfo->Data), v8::Local<v8::Signature>(), 0,
                                v8::ConstructorBehavior::kThrow));
                    }
                }
                ++FunctionInfo;
            }
        }

        // Properties
        {
            ScriptPropertyInfo* PropertyInfo = ClassDefinition->Properties;
            while (PropertyInfo && PropertyInfo->Name)
            {
#ifdef PUERTS_LAZYLOAD
                if (ClassDefinition->SuperTypeId && SuperHasProperty(Registry, ClassDefinition, PropertyInfo->Name))
#endif
                {
                    v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
                    if (!PropertyInfo->Setter)
                        PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
                    auto GetterData = v8::External::New(Isolate, &PropertyInfo->GetterData);
                    auto SetterData = v8::External::New(Isolate, &PropertyInfo->SetterData);
                    Template->PrototypeTemplate()->SetAccessorProperty(
                        v8::String::NewFromUtf8(Isolate, PropertyInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                        PropertyInfo->Getter ? v8::FunctionTemplate::New(Isolate, &PesapiGetterWrap, GetterData)
                                             : v8::Local<v8::FunctionTemplate>(),
                        PropertyInfo->Setter ? v8::FunctionTemplate::New(Isolate, &PesapiSetterWrap, SetterData)
                                             : v8::Local<v8::FunctionTemplate>(),
                        PropertyAttribute);
                }
                ++PropertyInfo;
            }
        }

        // Variables (static properties)
        {
            ScriptPropertyInfo* PropertyInfo = ClassDefinition->Variables;
            while (PropertyInfo && PropertyInfo->Name)
            {
#ifdef PUERTS_LAZYLOAD
                // Directly register if: has setter (writable), or parent has same-named static variable (override)
                bool DirectRegister = PropertyInfo->Setter
                    || (ClassDefinition->SuperTypeId && SuperHasStaticVariable(Registry, ClassDefinition, PropertyInfo->Name));
                if (DirectRegister)
#endif
                {
                    v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
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
                }
                ++PropertyInfo;
            }
        }

        // Functions (static methods)
        {
            ScriptFunctionInfo* FunctionInfo = ClassDefinition->Functions;
            while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
            {
#ifdef PUERTS_LAZYLOAD
                if (ClassDefinition->SuperTypeId && SuperHasStaticMethod(Registry, ClassDefinition, FunctionInfo->Name))
#endif
                {
                    auto FastCallInfo = FunctionInfo->ReflectionInfo ? FunctionInfo->ReflectionInfo->FastCallInfo() : nullptr;
                    if (FastCallInfo)
                    {
                        Template->Set(
                            v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                            v8::FunctionTemplate::New(Isolate, &PesapiCallbackWrap,
                                v8::External::New(Isolate, &FunctionInfo->Data), v8::Local<v8::Signature>(), 0,
                                v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect, FastCallInfo));
                    }
                    else
                    {
                        Template->Set(
                            v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                            v8::FunctionTemplate::New(Isolate, &PesapiCallbackWrap,
                                v8::External::New(Isolate, &FunctionInfo->Data), v8::Local<v8::Signature>(), 0,
                                v8::ConstructorBehavior::kThrow));
                    }
                }
                ++FunctionInfo;
            }
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

#ifdef PUERTS_LAZYLOAD
void FCppObjectMapper::WrapFunctionWithStaticLazyInterceptor(v8::Isolate* Isolate, v8::Local<v8::Context> Context,
    v8::Local<v8::Function> Func, const ScriptClassDefinition* ClassDefinition)
{
    // Avoid wrapping the same type multiple times (GetFunction returns the same object in the same Context)
    if (StaticLazyWrappedTypes.find(ClassDefinition->TypeId) != StaticLazyWrappedTypes.end())
        return;

    // Create an ObjectTemplate with SetHandler for lazy static function interception
    auto ObjTemplate = v8::ObjectTemplate::New(Isolate);
    ObjTemplate->SetHandler(v8::NamedPropertyHandlerConfiguration(
        LazyStaticFunctionInterceptorGetter, nullptr, nullptr, nullptr, nullptr,
        v8::External::New(Isolate, const_cast<ScriptClassDefinition*>(ClassDefinition)),
        v8::PropertyHandlerFlags::kNonMasking));

    auto InterceptorNode = ObjTemplate->NewInstance(Context).ToLocalChecked();

    // Insert the interceptor node into the prototype chain:
    // Before: Func -> OriginalPrototype
    // After:  Func -> InterceptorNode -> OriginalPrototype
    auto OriginalPrototype = Func->GetPrototype();
    (void) InterceptorNode->SetPrototype(Context, OriginalPrototype);
    (void) Func->SetPrototype(Context, InterceptorNode);

    StaticLazyWrappedTypes.insert(ClassDefinition->TypeId);
}
#endif // PUERTS_LAZYLOAD

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
#ifdef PUERTS_LAZYLOAD
    for (auto* Data : InterceptorDatas)
    {
        delete static_cast<LazyInterceptorData*>(Data);
    }
    InterceptorDatas.clear();
    StaticLazyWrappedTypes.clear();
#endif // PUERTS_LAZYLOAD
    CDataCache.clear();
    TypeIdToTemplateMap.clear();
    PrivateKey.Reset();
    PointerTemplate.Reset();
}

}    // namespace PUERTS_NAMESPACE
