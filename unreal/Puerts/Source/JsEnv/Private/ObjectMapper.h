/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#if USING_IN_UNREAL_ENGINE
#include "CoreMinimal.h"
#include "PropertyTranslator.h"
#include "StructWrapper.h"
#endif
#include "JSClassRegister.h"

#include "NamespaceDef.h"

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS

#include <memory>

namespace PUERTS_NAMESPACE
{
class ICppObjectMapper
{
public:
    virtual void BindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr, v8::Local<v8::Object> JSObject,
        bool PassByPointer) = 0;

    virtual void UnBindCppObject(v8::Isolate* Isolate, JSClassDefinition* ClassDefinition, void* Ptr) = 0;

    virtual v8::Local<v8::Value> FindOrAddCppObject(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, const void* TypeId, void* Ptr, bool PassByPointer) = 0;

    virtual bool IsInstanceOfCppObject(v8::Isolate* Isolate, const void* TypeId, v8::Local<v8::Object> JsObject) = 0;

    virtual void* GetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject) = 0;

    virtual void SetPrivateData(v8::Local<v8::Context> Context, v8::Local<v8::Object> JSObject, void* Ptr) = 0;

    virtual v8::MaybeLocal<v8::Function> LoadTypeById(v8::Local<v8::Context> Context, const void* TypeId) = 0;

    virtual std::weak_ptr<int> GetJsEnvLifeCycleTracker() = 0;

    virtual ~ICppObjectMapper()
    {
    }
};

#if USING_IN_UNREAL_ENGINE
class IObjectMapper : public ICppObjectMapper
{
public:
    virtual void Bind(FClassWrapper* ClassWrapper, UObject* UEObject, v8::Local<v8::Object> JSObject) = 0;

    virtual void UnBind(UClass* Class, UObject* UEObject) = 0;

    virtual v8::Local<v8::Value> FindOrAdd(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UClass* Class, UObject* UEObject) = 0;

    virtual void BindStruct(
        FScriptStructWrapper* ScriptStructWrapper, void* Ptr, v8::Local<v8::Object> JSObject, bool PassByPointer) = 0;

    virtual void UnBindStruct(FScriptStructWrapper* ScriptStructWrapper, void* Ptr) = 0;

    // PassByPointer为false代表需要在js对象释放时，free相应的内存
    // 相关信息见该issue：https://github.com/Tencent/puerts/issues/693
    virtual v8::Local<v8::Value> FindOrAddStruct(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer) = 0;

    virtual void Merge(
        v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Src, UStruct* DesType, void* Des) = 0;

    virtual void UnBindContainer(void* Ptr) = 0;

    virtual v8::Local<v8::Value> FindOrAddContainer(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property, FScriptArray* Ptr, bool PassByPointer) = 0;

    virtual v8::Local<v8::Value> FindOrAddContainer(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, PropertyMacro* Property, FScriptSet* Ptr, bool PassByPointer) = 0;

    virtual v8::Local<v8::Value> FindOrAddContainer(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
        PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, FScriptMap* Ptr, bool PassByPointer) = 0;

    virtual v8::Local<v8::Value> FindOrAddDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UObject* Owner,
        PropertyMacro* Property, void* DelegatePtr, bool PassByPointer) = 0;

    virtual bool AddToDelegate(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void* DelegatePtr, v8::Local<v8::Function> JsFunction) = 0;

    virtual PropertyMacro* FindDelegateProperty(void* DelegatePtr) = 0;

    virtual FScriptDelegate NewDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, UObject* Owner,
        v8::Local<v8::Function> JsFunction, UFunction* SignatureFunction) = 0;

    virtual bool RemoveFromDelegate(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void* DelegatePtr, v8::Local<v8::Function> JsFunction) = 0;

    virtual bool ClearDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context, void* DelegatePtr) = 0;

    virtual void ExecuteDelegate(v8::Isolate* Isolate, v8::Local<v8::Context>& Context,
        const v8::FunctionCallbackInfo<v8::Value>& Info, void* DelegatePtr) = 0;

    virtual v8::Local<v8::Value> CreateArray(
        v8::Isolate* Isolate, v8::Local<v8::Context>& Context, FPropertyTranslator* Property, void* ArrayPtr) = 0;

    virtual bool IsInstanceOf(UStruct* Struct, v8::Local<v8::Object> JsObject) = 0;

    virtual v8::Local<v8::Value> AddSoftObjectPtr(
        v8::Isolate* Isolate, v8::Local<v8::Context> Context, FSoftObjectPtr* SoftObjectPtr, UClass* Class, bool IsSoftClass) = 0;
};
#endif

}    // namespace PUERTS_NAMESPACE
