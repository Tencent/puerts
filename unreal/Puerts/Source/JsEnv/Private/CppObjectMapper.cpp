/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "CppObjectMapper.h"
#include "DataTransfer.h"

namespace PUERTS_NAMESPACE
{

static void ThrowException(v8::Isolate* Isolate, const char* Message)
{
    auto ExceptionStr = v8::String::NewFromUtf8(Isolate, Message, v8::NewStringType::kNormal).ToLocalChecked();
    Isolate->ThrowException(v8::Exception::Error(ExceptionStr));
}

void FCppObjectMapper::LoadCppType(const v8::FunctionCallbackInfo<v8::Value>& Info)
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

    std::string TypeName = *(v8::String::Utf8Value(Isolate, Info[0]));

    auto ClassDef = FindCppTypeClassByName(TypeName);
    if (ClassDef)
    {
        Info.GetReturnValue().Set(GetTemplateOfClass(Isolate, ClassDef)->GetFunction(Context).ToLocalChecked());
    }
    else
    {
        const std::string ErrMsg = "can not find type: " + TypeName;
        ThrowException(Isolate, ErrMsg.c_str());
    }
}

v8::MaybeLocal<v8::Function> FCppObjectMapper::LoadTypeById(v8::Local<v8::Context> Context, const void* TypeId)
{
    auto ClassDef = puerts::LoadClassByID(TypeId);
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
#ifndef WITH_QUICKJS
    PrivateKey.Reset(InIsolate, v8::Symbol::New(InIsolate));
#endif
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
    auto ClassDefinition = LoadClassByID(TypeId);
    if (ClassDefinition)
    {
        auto Result = GetTemplateOfClass(Isolate, ClassDefinition)->InstanceTemplate()->NewInstance(Context).ToLocalChecked();
        BindCppObject(Isolate, const_cast<JSClassDefinition*>(ClassDefinition), Ptr, Result, PassByPointer);
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

bool FCppObjectMapper::IsInstanceOfCppObject(v8::Isolate* Isolate, const void* TypeId, v8::Local<v8::Object> JsObject)
{
    if (DataTransfer::GetPointerFast<const void>(JsObject, 1) == TypeId)
    {
        return true;
    }
    auto ClassDefinition = FindClassByID(TypeId);
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
        JSClassDefinition* ClassDefinition = reinterpret_cast<JSClassDefinition*>(
            reinterpret_cast<char*>(v8::Local<v8::External>::Cast(Info.Data())->Value()) - offsetof(JSClassDefinition, Data));
        void* Ptr = nullptr;

        if (ClassDefinition->Initialize)
            Ptr = ClassDefinition->Initialize((pesapi_callback_info) &Info);
        if (Ptr == nullptr)
            return;

        DataTransfer::IsolateData<ICppObjectMapper>(Isolate)->BindCppObject(Isolate, ClassDefinition, Ptr, Self, false);
    }
    else
    {
        ThrowException(Isolate, "only call as Construct is supported!");
    }
}

MSVC_PRAGMA(warning(push))
MSVC_PRAGMA(warning(disable : 4191))
v8::Local<v8::FunctionTemplate> FCppObjectMapper::GetTemplateOfClass(v8::Isolate* Isolate, const JSClassDefinition* ClassDefinition)
{
    auto Iter = TypeIdToTemplateMap.find(ClassDefinition->TypeId);
    if (Iter == TypeIdToTemplateMap.end())
    {
        auto Template = v8::FunctionTemplate::New(
            Isolate, CDataNew, v8::External::New(Isolate, &(const_cast<JSClassDefinition*>(ClassDefinition)->Data)));
        Template->InstanceTemplate()->SetInternalFieldCount(4);

        JSPropertyInfo* PropertyInfo = ClassDefinition->Properties;
        while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
        {
            v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
            if (!PropertyInfo->Setter)
                PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
            auto GetterData = v8::External::New(Isolate, &PropertyInfo->GetterData);
            auto SetterData = v8::External::New(Isolate, &PropertyInfo->SetterData);
            Template->PrototypeTemplate()->SetAccessorProperty(
                v8::String::NewFromUtf8(Isolate, PropertyInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                PropertyInfo->Getter ? v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) PropertyInfo->Getter, GetterData)
                                     : v8::Local<v8::FunctionTemplate>(),
                PropertyInfo->Setter ? v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) PropertyInfo->Setter, SetterData)
                                     : v8::Local<v8::FunctionTemplate>(),
                PropertyAttribute);
            ++PropertyInfo;
        }

        PropertyInfo = ClassDefinition->Variables;
        while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
        {
            v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
            if (!PropertyInfo->Setter)
                PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
            auto GetterData = v8::External::New(Isolate, &PropertyInfo->GetterData);
            auto SetterData = v8::External::New(Isolate, &PropertyInfo->SetterData);
            Template->SetAccessorProperty(
                v8::String::NewFromUtf8(Isolate, PropertyInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                PropertyInfo->Getter ? v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) PropertyInfo->Getter, GetterData)
                                     : v8::Local<v8::FunctionTemplate>(),
                PropertyInfo->Setter ? v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) PropertyInfo->Setter, SetterData)
                                     : v8::Local<v8::FunctionTemplate>(),
                PropertyAttribute);
            ++PropertyInfo;
        }

        JSFunctionInfo* FunctionInfo = ClassDefinition->Methods;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
#ifndef WITH_QUICKJS
            auto FastCallInfo = FunctionInfo->ReflectionInfo ? FunctionInfo->ReflectionInfo->FastCallInfo() : nullptr;
            if (FastCallInfo)
            {
                Template->PrototypeTemplate()->Set(
                    v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                    v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) FunctionInfo->Callback,
                        v8::External::New(Isolate, &FunctionInfo->Data), v8::Local<v8::Signature>(), 0,
                        v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect, FastCallInfo));
            }
            else
#endif
            {
                Template->PrototypeTemplate()->Set(
                    v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                    v8::FunctionTemplate::New(
                        Isolate, (v8::FunctionCallback) FunctionInfo->Callback, v8::External::New(Isolate, &FunctionInfo->Data)
#ifndef WITH_QUICKJS
                                                                                    ,
                        v8::Local<v8::Signature>(), 0, v8::ConstructorBehavior::kThrow
#endif
                        ));
            }
            ++FunctionInfo;
        }
        FunctionInfo = ClassDefinition->Functions;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
#ifndef WITH_QUICKJS
            auto FastCallInfo = FunctionInfo->ReflectionInfo ? FunctionInfo->ReflectionInfo->FastCallInfo() : nullptr;
            if (FastCallInfo)
            {
                Template->Set(v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                    v8::FunctionTemplate::New(Isolate, (v8::FunctionCallback) FunctionInfo->Callback,
                        v8::External::New(Isolate, &FunctionInfo->Data), v8::Local<v8::Signature>(), 0,
                        v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect, FastCallInfo));
            }
            else
#endif
            {
                Template->Set(v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                    v8::FunctionTemplate::New(
                        Isolate, (v8::FunctionCallback) FunctionInfo->Callback, v8::External::New(Isolate, &FunctionInfo->Data)
#ifndef WITH_QUICKJS
                                                                                    ,
                        v8::Local<v8::Signature>(), 0, v8::ConstructorBehavior::kThrow
#endif
                        ));
            }
            ++FunctionInfo;
        }

        if (ClassDefinition->SuperTypeId)
        {
            if (auto SuperDefinition = LoadClassByID(ClassDefinition->SuperTypeId))
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
MSVC_PRAGMA(warning(pop))

static void CDataGarbageCollectedWithFree(const v8::WeakCallbackInfo<JSClassDefinition>& Data)
{
    JSClassDefinition* ClassDefinition = Data.GetParameter();
    void* Ptr = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
    if (ClassDefinition->Finalize)
        ClassDefinition->Finalize(Ptr, ClassDefinition->Data, DataTransfer::GetIsolatePrivateData(Data.GetIsolate()));
    DataTransfer::IsolateData<ICppObjectMapper>(Data.GetIsolate())->UnBindCppObject(Data.GetIsolate(), ClassDefinition, Ptr);
}

static void CDataGarbageCollectedWithoutFree(const v8::WeakCallbackInfo<JSClassDefinition>& Data)
{
    JSClassDefinition* ClassDefinition = Data.GetParameter();
    void* Ptr = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
    DataTransfer::IsolateData<ICppObjectMapper>(Data.GetIsolate())->UnBindCppObject(Data.GetIsolate(), ClassDefinition, Ptr);
}

void FCppObjectMapper::BindCppObject(
    v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer)
{
    DataTransfer::SetPointer(Isolate, JSObject, Ptr, 0);
    DataTransfer::SetPointer(Isolate, JSObject, ClassDefinition->TypeId, 1);

    auto Iter = CDataCache.find(Ptr);
    FObjectCacheNode* CacheNodePtr;
    if (Iter != CDataCache.end())
    {
        CacheNodePtr = Iter->second.Add(ClassDefinition->TypeId);
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
        CacheNodePtr->Value.SetWeak<JSClassDefinition>(
            ClassDefinition, CDataGarbageCollectedWithFree, v8::WeakCallbackType::kInternalFields);
    }
    else
    {
        CacheNodePtr->Value.SetWeak<JSClassDefinition>(
            ClassDefinition, CDataGarbageCollectedWithoutFree, v8::WeakCallbackType::kInternalFields);
    }

    if (ClassDefinition->OnEnter)
    {
        CacheNodePtr->UserData = ClassDefinition->OnEnter(Ptr, ClassDefinition->Data, DataTransfer::GetIsolatePrivateData(Isolate));
    }
}

#define QJS_PRIVATE_KEY_STR "__,kp@"

void* FCppObjectMapper::GetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject)
{
#ifndef WITH_QUICKJS
    auto Key = PrivateKey.Get(Context->GetIsolate());
#else
    auto Key = FV8Utils::InternalString(Context->GetIsolate(), QJS_PRIVATE_KEY_STR);
#endif
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
#ifndef WITH_QUICKJS
    auto Key = PrivateKey.Get(Context->GetIsolate());
#else
    auto Key = FV8Utils::InternalString(Context->GetIsolate(), QJS_PRIVATE_KEY_STR);
#endif
    (void) (JSObject->Set(Context, Key, v8::External::New(Context->GetIsolate(), Ptr)));
}

void FCppObjectMapper::UnBindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr)
{
    auto Iter = CDataCache.find(Ptr);
    if (Iter != CDataCache.end())
    {
        if (ClassDefinition->OnExit)
        {
            ClassDefinition->OnExit(
                Ptr, ClassDefinition->Data, DataTransfer::GetIsolatePrivateData(Isolate), Iter->second.UserData);
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
            const JSClassDefinition* ClassDefinition = FindClassByID(PNode->TypeId);
            if (PNode->MustCallFinalize)
            {
                if (ClassDefinition && ClassDefinition->Finalize)
                {
                    ClassDefinition->Finalize(KV.first, ClassDefinition->Data, PData);
                }
                PNode->MustCallFinalize = false;
            }
            if (ClassDefinition->OnExit)
            {
                ClassDefinition->OnExit(
                    KV.first, ClassDefinition->Data, DataTransfer::GetIsolatePrivateData(InIsolate), PNode->UserData);
            }
            PNode = PNode->Next;
        }
    }
    CDataCache.clear();
    TypeIdToTemplateMap.clear();
#ifndef WITH_QUICKJS
    PrivateKey.Reset();
#endif
    PointerTemplate.Reset();
}

}    // namespace PUERTS_NAMESPACE
