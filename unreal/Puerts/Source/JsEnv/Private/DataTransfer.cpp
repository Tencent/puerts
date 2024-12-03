/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "DataTransfer.h"
#include "ObjectMapper.h"
#if USING_IN_UNREAL_ENGINE
#include "V8Utils.h"
#endif

namespace PUERTS_NAMESPACE
{
v8::Local<v8::Value> DataTransfer::FindOrAddCData(
    v8::Isolate* Isolate, v8::Local<v8::Context> Context, const void* TypeId, const void* Ptr, bool PassByPointer)
{
    return IsolateData<ICppObjectMapper>(Isolate)->FindOrAddCppObject(
        Isolate, Context, TypeId, const_cast<void*>(Ptr), PassByPointer);
}

bool DataTransfer::IsInstanceOf(v8::Isolate* Isolate, const void* TypeId, v8::Local<v8::Value> JsObject)
{
    return JsObject->IsObject() &&
           IsolateData<ICppObjectMapper>(Isolate)->IsInstanceOfCppObject(Isolate, TypeId, JsObject.As<v8::Object>());
}

v8::Local<v8::Value> DataTransfer::UnRef(v8::Isolate* Isolate, const v8::Local<v8::Value>& Value)
{
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    v8::Local<v8::Value> ReturnValue = Value->ToObject(Context).ToLocalChecked()->Get(Context, 0).ToLocalChecked();

    return ReturnValue;
}

void DataTransfer::UpdateRef(v8::Isolate* Isolate, v8::Local<v8::Value> Outer, const v8::Local<v8::Value>& Value)
{
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

    auto Ret = Outer->ToObject(Context).ToLocalChecked()->Set(Context, 0, Value);
}

std::weak_ptr<int> DataTransfer::GetJsEnvLifeCycleTracker(v8::Isolate* Isolate)
{
    return IsolateData<ICppObjectMapper>(Isolate)->GetJsEnvLifeCycleTracker();
}

#if USING_IN_UNREAL_ENGINE
FString DataTransfer::ToFString(v8::Isolate* Isolate, v8::Local<v8::Value> Value)
{
    return FV8Utils::ToFString(Isolate, Value);
}

v8::Local<v8::Value> DataTransfer::FindOrAddObject(
    v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UClass* Class, UObject* UEObject)
{
    return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAdd(Isolate, Context, Class, UEObject);
}

v8::Local<v8::Value> DataTransfer::FindOrAddStruct(
    v8::Isolate* Isolate, v8::Local<v8::Context> Context, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer)
{
    return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddStruct(Isolate, Context, ScriptStruct, Ptr, PassByPointer);
}

bool DataTransfer::IsInstanceOf(v8::Isolate* Isolate, UStruct* Struct, v8::Local<v8::Value> JsObject)
{
    return JsObject->IsObject() && FV8Utils::IsolateData<IObjectMapper>(Isolate)->IsInstanceOf(Struct, JsObject.As<v8::Object>());
}

void DataTransfer::ThrowException(v8::Isolate* Isolate, const char* Message)
{
    FV8Utils::ThrowException(Isolate, Message);
}
#endif
}    // namespace PUERTS_NAMESPACE
