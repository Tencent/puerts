/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "DataTransfer.h"
#include "ObjectMapper.h"
#include "V8Utils.h"

namespace puerts
{
    v8::Local<v8::Value> DataTransfer::FindOrAddCData(v8::Isolate* Isolate, v8::Local<v8::Context> Context, const char* CDataName, const void *Ptr, bool PassByPointer)
    {
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddCData(Isolate, Context, CDataName, const_cast<void*>(Ptr), PassByPointer);
    }

    v8::Local<v8::Value> DataTransfer::FindOrAddStruct(v8::Isolate* Isolate, v8::Local<v8::Context> Context, UScriptStruct* ScriptStruct, void *Ptr, bool PassByPointer)
    {
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->FindOrAddStruct(Isolate, Context, ScriptStruct, Ptr, PassByPointer);
    }

    bool DataTransfer::IsInstanceOf(v8::Isolate* Isolate, UStruct *Struct, v8::Local<v8::Object> JsObject)
    {
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->IsInstanceOf(Struct, JsObject);
    }

    bool DataTransfer::IsInstanceOf(v8::Isolate* Isolate, const char* CDataName, v8::Local<v8::Object> JsObject)
    {
        return FV8Utils::IsolateData<IObjectMapper>(Isolate)->IsInstanceOf(CDataName, JsObject);
    }

    FString DataTransfer::ToFString(v8::Isolate* Isolate, v8::Local<v8::Value> Value)
    {
        return FV8Utils::ToFString(Isolate, Value);
    }

    v8::Local<v8::Value> DataTransfer::UnRef(v8::Isolate* Isolate, const v8::Local<v8::Value>& Value)
    {
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::EscapableHandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        v8::Local<v8::Value> ObjectValueKey = v8::String::NewFromUtf8(Isolate, "value", v8::NewStringType::kNormal).ToLocalChecked();
        v8::Local<v8::Value> ReturnValue = Value->ToObject(Context).ToLocalChecked()->Get(Context, ObjectValueKey).ToLocalChecked();

        return HandleScope.Escape(ReturnValue);
    }

    void DataTransfer::UpdateRef(v8::Isolate* Isolate, v8::Local<v8::Value> Outer, const v8::Local<v8::Value>& Value)
    {
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::EscapableHandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
        v8::Context::Scope ContextScope(Context);

        v8::Local<v8::Value> ObjectValueKey = v8::String::NewFromUtf8(Isolate, "value", v8::NewStringType::kNormal).ToLocalChecked();
        auto Ret = Outer->ToObject(Context).ToLocalChecked()->Set(Context, ObjectValueKey, Value);
    }

    void DataTransfer::ThrowException(v8::Isolate* Isolate, const char * Message)
    {
        FV8Utils::ThrowException(Isolate, Message);
    }
}
