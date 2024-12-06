/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "functional"

#if USING_IN_UNREAL_ENGINE
#include "CoreMinimal.h"

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS
#else
#define JSENV_API
#define FORCEINLINE V8_INLINE
#define UPTRINT uintptr_t
#endif

#include <string>

#include "PuertsNamespaceDef.h"

#include "pesapi.h"
#include "TypeInfo.hpp"
#include "PString.h"

#if USING_IN_UNREAL_ENGINE
static const FAnsiStringView EditorOnlyPropertySuffix = "_EditorOnly";
#endif

namespace PUERTS_NAMESPACE
{
class CFunctionInfo;

MSVC_PRAGMA(warning(push))
MSVC_PRAGMA(warning(disable : 4191))
struct JSENV_API JSFunctionInfo
{
    JSFunctionInfo() : Name(nullptr), Callback(nullptr)
    {
    }

    JSFunctionInfo(
        const char* InName, pesapi_callback InCallback, void* InData = nullptr, const CFunctionInfo* InReflectionInfo = nullptr)
        : Name(InName), Callback(InCallback), Data(InData), ReflectionInfo(InReflectionInfo)
    {
    }

    template <class CallbackType>
    JSFunctionInfo(
        const char* InName, CallbackType InCallback, void* InData = nullptr, const CFunctionInfo* InReflectionInfo = nullptr)
        : Name(InName), Callback(reinterpret_cast<pesapi_callback>(InCallback)), Data(InData), ReflectionInfo(InReflectionInfo)
    {
    }

    const char* Name;
    pesapi_callback Callback;
    void* Data = nullptr;
    const CFunctionInfo* ReflectionInfo = nullptr;
};

struct JSENV_API JSPropertyInfo
{
    JSPropertyInfo() : Name(nullptr), Getter(nullptr), Setter(nullptr)
    {
    }

    JSPropertyInfo(const char* InName, pesapi_callback InGetter, pesapi_callback InSetter, void* InGetterData = nullptr,
        void* InSetterData = nullptr)
        : Name(InName), Getter(InGetter), Setter(InSetter), GetterData(InGetterData), SetterData(InSetterData)
    {
    }

    template <class CallbackType>
    JSPropertyInfo(const char* InName, CallbackType InGetter, CallbackType InSetter, void* InGetterData = nullptr,
        void* InSetterData = nullptr)
        : Name(InName)
        , Getter(reinterpret_cast<pesapi_callback>(InGetter))
        , Setter(reinterpret_cast<pesapi_callback>(InSetter))
        , GetterData(InGetterData)
        , SetterData(InSetterData)
    {
    }

    const char* Name;
    pesapi_callback Getter;
    pesapi_callback Setter;
    void* GetterData = nullptr;
    void* SetterData = nullptr;
};

struct NamedFunctionInfo;
struct NamedPropertyInfo;

struct JSENV_API JSClassDefinition
{
    const void* TypeId;
    const void* SuperTypeId;
    const char* ScriptName;
    const char* UETypeName;
    pesapi_constructor Initialize;
    template <class InitializeType>
    void SetInitialize(InitializeType InInitialize)
    {
        Initialize = reinterpret_cast<pesapi_constructor>(InInitialize);
    }
    JSFunctionInfo* Methods;       //成员方法
    JSFunctionInfo* Functions;     //静态方法
    JSPropertyInfo* Properties;    //成员属性
    JSPropertyInfo* Variables;     //静态属性
    pesapi_finalize Finalize;
    // int InternalFieldCount;
    NamedFunctionInfo* ConstructorInfos;
    NamedFunctionInfo* MethodInfos;
    NamedFunctionInfo* FunctionInfos;
    NamedPropertyInfo* PropertyInfos;
    NamedPropertyInfo* VariableInfos;
    void* Data = nullptr;
    pesapi_on_native_object_enter OnEnter = nullptr;
    pesapi_on_native_object_exit OnExit = nullptr;
};
MSVC_PRAGMA(warning(pop))

#define JSClassEmptyDefinition                               \
    {                                                        \
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 \
    }

void JSENV_API RegisterJSClass(const JSClassDefinition& ClassDefinition);

void JSENV_API SetClassTypeInfo(const void* TypeId, const NamedFunctionInfo* ConstructorInfos, const NamedFunctionInfo* MethodInfos,
    const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos, const NamedPropertyInfo* VariableInfos);

void JSENV_API ForeachRegisterClass(std::function<void(const JSClassDefinition* ClassDefinition)>);

JSENV_API const JSClassDefinition* FindClassByID(const void* TypeId);

JSENV_API void OnClassNotFound(pesapi_class_not_found_callback Callback);

JSENV_API const JSClassDefinition* LoadClassByID(const void* TypeId);

JSENV_API const JSClassDefinition* FindCppTypeClassByName(const PString& Name);

JSENV_API bool TraceObjectLifecycle(const void* TypeId, pesapi_on_native_object_enter OnEnter, pesapi_on_native_object_exit OnExit);

#if USING_IN_UNREAL_ENGINE
typedef void (*AddonRegisterFunc)(v8::Local<v8::Context> Context, v8::Local<v8::Object> Exports);

AddonRegisterFunc FindAddonRegisterFunc(const PString& Name);

void RegisterAddon(const char* Name, AddonRegisterFunc RegisterFunc);

JSENV_API const JSClassDefinition* FindClassByType(UStruct* Type);

JSENV_API bool IsEditorOnlyUFunction(const UFunction* Func);

#endif

}    // namespace PUERTS_NAMESPACE

#define PUERTS_MODULE(Name, RegFunc)                           \
    static struct FAutoRegisterFor##Name                       \
    {                                                          \
        FAutoRegisterFor##Name()                               \
        {                                                      \
            PUERTS_NAMESPACE::RegisterAddon(#Name, (RegFunc)); \
        }                                                      \
    } _AutoRegisterFor##Name
