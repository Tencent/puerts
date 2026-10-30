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
#include "pesapi.h"

#include "NamespaceDef.h"

namespace PUERTS_NAMESPACE
{
#if USING_IN_UNREAL_ENGINE
// the object mapping of an UE env, implemented by the host and published as the env private (pesapi set_env_private, see
// PapiUtils::ObjectMapperOf). All js values are papi values so neither the callers nor the implementation depend on the script
// backend. The mapping of the backend itself (native objects of class definitions) is internal to the backend.
class IObjectMapper
{
public:
    // binds UEObject to JSObject, the object being constructed by the js class of ClassWrapper, returns the native pointer (the
    // UObject itself) for the backend to bind to JSObject
    virtual void* Bind(pesapi_env Env, FClassWrapper* ClassWrapper, UObject* UEObject, pesapi_value JSObject) = 0;

    // the js object of UEObject (a native object of the class definition of UEObject->GetClass(), Class is only used for a null
    // UEObject), created on first use
    virtual pesapi_value FindOrAdd(pesapi_env Env, UClass* Class, UObject* UEObject) = 0;

    // UEObject is bound to / unbound from its js object by the backend (on_enter / on_exit of the class definitions of UClasses,
    // see FClassWrapper), unbound when the js object is garbage collected, the UObject is destroyed or the env is released
    virtual void OnUObjectEnter(UObject* UEObject) = 0;

    virtual void OnUObjectExit(UObject* UEObject) = 0;

    // an owned struct created by a constructor (Info), returns true if it is bound to the object being constructed by a
    // backend specific way (e.g. a POD struct freed with an ArrayBuffer on v8), false to let the backend bind the pointer
    // returned by the constructor
    virtual bool TryBindOwnedStruct(pesapi_callback_info Info, FScriptStructWrapper* Wrapper, void* Ptr) = 0;

    // PassByPointer为false代表需要在js对象释放时，free相应的内存
    // 相关信息见该issue：https://github.com/Tencent/puerts/issues/693
    virtual pesapi_value FindOrAddStruct(pesapi_env Env, UScriptStruct* ScriptStruct, void* Ptr, bool PassByPointer) = 0;

    // Src must be an object, Info is the native callback the merge is done in (nullptr if none), for the errors
    virtual void Merge(pesapi_env Env, pesapi_callback_info Info, pesapi_value Src, UStruct* DesType, void* Des) = 0;

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

    virtual ~IObjectMapper()
    {
    }
};
#endif

}    // namespace PUERTS_NAMESPACE
