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
template <typename T>
inline void __USE(T&&)
{
}

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

static void PointerNew(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    // do nothing
}

void FCppObjectMapper::Initialize(v8::Isolate* InIsolate, v8::Local<v8::Context> InContext)
{
    auto LocalTemplate = v8::FunctionTemplate::New(InIsolate, PointerNew);
    LocalTemplate->InstanceTemplate()->SetInternalFieldCount(4);    // 0 Ptr, 1, CDataName
    PointerConstructor = v8::UniquePersistent<v8::Function>(InIsolate, LocalTemplate->GetFunction(InContext).ToLocalChecked());
}

v8::Local<v8::Value> FCppObjectMapper::FindOrAddCppObject(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* TypeId, void* Ptr, bool PassByPointer)
{
    if (Ptr == nullptr)
    {
        return v8::Undefined(Isolate);
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
    auto ClassDefinition = FindClassByID(TypeId);
    if (ClassDefinition)
    {
        auto Result = GetTemplateOfClass(Isolate, ClassDefinition)->InstanceTemplate()->NewInstance(Context).ToLocalChecked();
        BindCppObject(Isolate, const_cast<JSClassDefinition*>(ClassDefinition), Ptr, Result, PassByPointer);
        return Result;
    }
    else
    {
        auto Result = PointerConstructor.Get(Isolate)->NewInstance(Context, 0, nullptr).ToLocalChecked();
        DataTransfer::SetPointer(Isolate, Result, Ptr, 0);
        DataTransfer::SetPointer(Isolate, Result, TypeId, 1);
        return Result;
    }
}

bool FCppObjectMapper::IsInstanceOfCppObject(const void* TypeId, v8::Local<v8::Object> JsObject)
{
    return DataTransfer::GetPointerFast<const void>(JsObject, 1) == TypeId;
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
        JSClassDefinition* ClassDefinition =
            reinterpret_cast<JSClassDefinition*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        void* Ptr = nullptr;

        if (ClassDefinition->Initialize)
            Ptr = ClassDefinition->Initialize(Info);
        if (Ptr == nullptr)
            return;

        DataTransfer::IsolateData<ICppObjectMapper>(Isolate)->BindCppObject(Isolate, ClassDefinition, Ptr, Self, false);
    }
    else
    {
        ThrowException(Isolate, "only call as Construct is supported!");
    }
}

v8::Local<v8::FunctionTemplate> FCppObjectMapper::GetTemplateOfClass(v8::Isolate* Isolate, const JSClassDefinition* ClassDefinition)
{
    auto Iter = CDataNameToTemplateMap.find(ClassDefinition->TypeId);
    if (Iter == CDataNameToTemplateMap.end())
    {
        auto Template = v8::FunctionTemplate::New(
            Isolate, CDataNew, v8::External::New(Isolate, const_cast<void*>(reinterpret_cast<const void*>(ClassDefinition))));
        Template->InstanceTemplate()->SetInternalFieldCount(4);

        JSPropertyInfo* PropertyInfo = ClassDefinition->Properties;
        while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
        {
            v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
            if (!PropertyInfo->Setter)
                PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
            auto Data = PropertyInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, PropertyInfo->Data))
                                           : v8::Local<v8::Value>();
            Template->PrototypeTemplate()->SetAccessorProperty(
                v8::String::NewFromUtf8(Isolate, PropertyInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                v8::FunctionTemplate::New(Isolate, PropertyInfo->Getter, Data),
                v8::FunctionTemplate::New(Isolate, PropertyInfo->Setter, Data), PropertyAttribute);
            ++PropertyInfo;
        }

        PropertyInfo = ClassDefinition->Variables;
        while (PropertyInfo && PropertyInfo->Name && PropertyInfo->Getter)
        {
            v8::PropertyAttribute PropertyAttribute = v8::DontDelete;
            if (!PropertyInfo->Setter)
                PropertyAttribute = (v8::PropertyAttribute)(PropertyAttribute | v8::ReadOnly);
            auto Data = PropertyInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, PropertyInfo->Data))
                                           : v8::Local<v8::Value>();
            Template->SetAccessorProperty(
                v8::String::NewFromUtf8(Isolate, PropertyInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                v8::FunctionTemplate::New(Isolate, PropertyInfo->Getter, Data),
                v8::FunctionTemplate::New(Isolate, PropertyInfo->Setter, Data), PropertyAttribute);
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
                    v8::FunctionTemplate::New(Isolate, FunctionInfo->Callback,
                        FunctionInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, FunctionInfo->Data))
                                           : v8::Local<v8::Value>(),
                        v8::Local<v8::Signature>(), 0, v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect,
                        FastCallInfo));
            }
            else
#endif
            {
                Template->PrototypeTemplate()->Set(
                    v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                    v8::FunctionTemplate::New(Isolate, FunctionInfo->Callback,
                        FunctionInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, FunctionInfo->Data))
                                           : v8::Local<v8::Value>()));
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
                    v8::FunctionTemplate::New(Isolate, FunctionInfo->Callback,
                        FunctionInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, FunctionInfo->Data))
                                           : v8::Local<v8::Value>(),
                        v8::Local<v8::Signature>(), 0, v8::ConstructorBehavior::kThrow, v8::SideEffectType::kHasSideEffect,
                        FastCallInfo));
            }
            else
#endif
            {
                Template->Set(v8::String::NewFromUtf8(Isolate, FunctionInfo->Name, v8::NewStringType::kNormal).ToLocalChecked(),
                    v8::FunctionTemplate::New(Isolate, FunctionInfo->Callback,
                        FunctionInfo->Data ? static_cast<v8::Local<v8::Value>>(v8::External::New(Isolate, FunctionInfo->Data))
                                           : v8::Local<v8::Value>()));
            }
            ++FunctionInfo;
        }

        if (ClassDefinition->SuperTypeId)
        {
            if (auto SuperDefinition = FindClassByID(ClassDefinition->SuperTypeId))
            {
                Template->Inherit(GetTemplateOfClass(Isolate, SuperDefinition));
            }
        }

        CDataNameToTemplateMap[ClassDefinition->TypeId] = v8::UniquePersistent<v8::FunctionTemplate>(Isolate, Template);

        return Template;
    }
    else
    {
        return v8::Local<v8::FunctionTemplate>::New(Isolate, Iter->second);
    }
}

static void CDataGarbageCollectedWithFree(const v8::WeakCallbackInfo<JSClassDefinition>& Data)
{
    JSClassDefinition* ClassDefinition = Data.GetParameter();
    void* Ptr = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
    if (ClassDefinition->Finalize)
        ClassDefinition->Finalize(Ptr);
    DataTransfer::IsolateData<ICppObjectMapper>(Data.GetIsolate())->UnBindCppObject(ClassDefinition, Ptr);
}

static void CDataGarbageCollectedWithoutFree(const v8::WeakCallbackInfo<JSClassDefinition>& Data)
{
    JSClassDefinition* ClassDefinition = Data.GetParameter();
    void* Ptr = DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1));
    DataTransfer::IsolateData<ICppObjectMapper>(Data.GetIsolate())->UnBindCppObject(ClassDefinition, Ptr);
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
        CDataFinalizeMap[Ptr] = ClassDefinition->Finalize;
        CacheNodePtr->Value.SetWeak<JSClassDefinition>(
            ClassDefinition, CDataGarbageCollectedWithFree, v8::WeakCallbackType::kInternalFields);
    }
    else
    {
        CacheNodePtr->Value.SetWeak<JSClassDefinition>(
            ClassDefinition, CDataGarbageCollectedWithoutFree, v8::WeakCallbackType::kInternalFields);
    }
}

void FCppObjectMapper::UnBindCppObject(JSClassDefinition* ClassDefinition, void* Ptr)
{
    CDataFinalizeMap.erase(Ptr);
    auto Iter = CDataCache.find(Ptr);
    if (Iter != CDataCache.end())
    {
        auto Removed = Iter->second.Remove(ClassDefinition->TypeId, true);
        if (!Iter->second.TypeId)    // last one
        {
            CDataCache.erase(Ptr);
        }
    }
}

void FCppObjectMapper::UnInitialize(v8::Isolate* InIsolate)
{
    for (auto Iter = CDataFinalizeMap.begin(); Iter != CDataFinalizeMap.end(); Iter++)
    {
        if (Iter->second)
            Iter->second(Iter->first);
    }
    CDataCache.clear();
    CDataFinalizeMap.clear();
    CDataNameToTemplateMap.clear();
    PointerConstructor.Reset();
}

}    // namespace PUERTS_NAMESPACE
