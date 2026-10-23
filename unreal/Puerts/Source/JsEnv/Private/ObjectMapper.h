/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
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
#include "pesapi.h"

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

#ifndef WITH_QUICKJS
    virtual v8::MaybeLocal<v8::Function> CreateFunction(v8::Local<v8::Context> Context, struct pesapi_ffi* Apis,
        pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize) = 0;
#endif

    virtual std::weak_ptr<int> GetJsEnvLifeCycleTracker() = 0;

    // class registry used by this env (pesapi set_registry), nullptr resets to the default registry
    virtual void SetRegistry(ScriptClassRegistry* InRegistry) = 0;

    virtual ScriptClassRegistry* GetRegistry() = 0;

    // pesapi invalidate_class: drop the cached script class of TypeId, the next use rebuilds it
    virtual void InvalidateClass(const void* TypeId) = 0;

    virtual ~ICppObjectMapper()
    {
    }
};

#if USING_IN_UNREAL_ENGINE
// the object mapping of an UE env (see PapiUtils::ObjectMapperOf), all js values are papi values so the callers do not
// depend on the script backend
class IObjectMapper : public ICppObjectMapper
{
public:
    virtual void Bind(pesapi_env Env, FClassWrapper* ClassWrapper, UObject* UEObject, pesapi_value JSObject) = 0;

    virtual void UnBind(UClass* Class, UObject* UEObject) = 0;

    virtual pesapi_value FindOrAdd(pesapi_env Env, UClass* Class, UObject* UEObject) = 0;

    // ClassDefinition is the class definition (of an UScriptStruct) the template of JSObject is built from, the object is
    // cached and finalized by the CppObjectMapper
    virtual void BindStruct(
        pesapi_env Env, const JSClassDefinition* ClassDefinition, void* Ptr, pesapi_value JSObject, bool PassByPointer) = 0;

    // PassByPointer为false代表需要在js对象释放时，free相应的内存
    // 相关信息见该issue：https://github.com/Tencent/puerts/issues/693
    virtual pesapi_value FindOrAddStruct(pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer) = 0;

    // Src must be an object
    virtual void Merge(pesapi_env Env, pesapi_value Src, UStruct* DesType, void* Des) = 0;

    virtual pesapi_value FindOrAddContainer(pesapi_env Env, PropertyMacro* Property, FScriptArray* Ptr, bool PassByPointer) = 0;

    virtual pesapi_value FindOrAddContainer(pesapi_env Env, PropertyMacro* Property, FScriptSet* Ptr, bool PassByPointer) = 0;

    virtual pesapi_value FindOrAddContainer(
        pesapi_env Env, PropertyMacro* KeyProperty, PropertyMacro* ValueProperty, FScriptMap* Ptr, bool PassByPointer) = 0;

    virtual pesapi_value FindOrAddDelegate(
        pesapi_env Env, UObject* Owner, PropertyMacro* Property, void* DelegatePtr, bool PassByPointer) = 0;

    // JsFunction must be a function
    virtual bool AddToDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction) = 0;

    virtual PropertyMacro* FindDelegateProperty(void* DelegatePtr) = 0;

    // JsFunction must be a function
    virtual FScriptDelegate NewDelegate(pesapi_env Env, UObject* Owner, pesapi_value JsFunction, UFunction* SignatureFunction) = 0;

    // JsFunction must be a function
    virtual bool RemoveFromDelegate(pesapi_env Env, void* DelegatePtr, pesapi_value JsFunction) = 0;

    virtual bool ClearDelegate(pesapi_env Env, void* DelegatePtr) = 0;

    virtual void ExecuteDelegate(pesapi_env Env, pesapi_callback_info Info, void* DelegatePtr) = 0;

    virtual pesapi_value CreateArray(pesapi_env Env, FPropertyTranslator* Property, void* ArrayPtr) = 0;

    virtual bool IsInstanceOf(pesapi_env Env, UStruct* Struct, pesapi_value JsObject) = 0;
};
#endif

}    // namespace PUERTS_NAMESPACE
