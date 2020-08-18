/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "PropertyTranslator.h"
#include "JSClassRegister.h"

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

namespace puerts
{
class IObjectMapper
{
public:
    virtual void Bind(UClass *Class, UObject *UEObject, v8::Local<v8::Object> JSObject) = 0;

    virtual void UnBind(UClass *Class, UObject *UEObject) = 0;

    virtual v8::Local<v8::Value> FindOrAdd(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UClass *Class, UObject *UEObject) = 0;

    virtual void BindStruct(UScriptStruct* ScriptStruct, void *Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer) = 0;

    virtual void UnBindStruct(UScriptStruct* ScriptStruct, void *Ptr) = 0;

    virtual v8::Local<v8::Value> FindOrAddStruct(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UScriptStruct* ScriptStruct, void *Ptr, bool PassByPointer) = 0;

    virtual void BindCData(JSClassDefinition* ClassDefinition, void *Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer) = 0;

    virtual void UnBindCData(JSClassDefinition* ClassDefinition, void *Ptr) = 0;

    virtual v8::Local<v8::Value> FindOrAddCData(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const char* CDataName, void *Ptr, bool PassByPointer) = 0;

    virtual void Merge(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Src, UStruct* DesType, void* Des) = 0;

    virtual void BindContainer(void* Ptr, v8::Local<v8::Object> JSObject, void(*Callback)(const v8::WeakCallbackInfo<void>& data)) = 0;

    virtual void UnBindContainer(void* Ptr) = 0;

    virtual v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property, FScriptArray *Ptr, bool PassByPointer) = 0;

    virtual v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property, FScriptSet *Ptr, bool PassByPointer) = 0;

    virtual v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, FScriptMap *Ptr, bool PassByPointer) = 0;

    virtual v8::Local<v8::Value> FindOrAddDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UObject* Owner, PropertyMacro* Property, void *DelegatePtr) = 0;

    virtual bool AddToDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void *DelegatePtr, v8::Local<v8::Function> JsFunction) = 0;

    virtual bool RemoveFromDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void *DelegatePtr, v8::Local<v8::Function> JsFunction) = 0;

    virtual bool ClearDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void *DelegatePtr) = 0;

    virtual void ExecuteDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const v8::FunctionCallbackInfo<v8::Value>& Info, void *DelegatePtr) = 0;

    virtual v8::Local<v8::Value> CreateArray(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, FPropertyTranslator* Property, void* ArrayPtr) = 0;

    virtual bool IsInstanceOf(UStruct *Struct, v8::Local<v8::Object> JsObject) = 0;

    virtual bool IsInstanceOf(const char* CDataName, v8::Local<v8::Object> JsObject) = 0;
};
}
