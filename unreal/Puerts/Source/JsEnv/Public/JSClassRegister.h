/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
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

// All callbacks stored in the class registry are pesapi style (with pesapi_ffi* as the first parameter), the layout of the
// definitions below is the same as unity/native/puerts/include/ScriptClassRegistry.h. The backend object mapper dispatches
// them through trampolines (see Private/PesapiClassThunks.h).
typedef pesapi_callback JSFunctionCallback;
typedef pesapi_constructor JSInitializeFunc;
typedef pesapi_finalize JSFinalizeFunc;

MSVC_PRAGMA(warning(push))
MSVC_PRAGMA(warning(disable : 4191))
struct JSENV_API JSFunctionInfo
{
    JSFunctionInfo() : Name(nullptr), Callback(nullptr)
    {
    }

    JSFunctionInfo(
        const char* InName, JSFunctionCallback InCallback, void* InData = nullptr, const CFunctionInfo* InReflectionInfo = nullptr)
        : Name(InName), Callback(InCallback), Data(InData), ReflectionInfo(InReflectionInfo)
    {
    }

    template <class CallbackType>
    JSFunctionInfo(
        const char* InName, CallbackType InCallback, void* InData = nullptr, const CFunctionInfo* InReflectionInfo = nullptr)
        : Name(InName), Callback(reinterpret_cast<JSFunctionCallback>(InCallback)), Data(InData), ReflectionInfo(InReflectionInfo)
    {
    }

    const char* Name;
    JSFunctionCallback Callback;
    void* Data = nullptr;
    const CFunctionInfo* ReflectionInfo = nullptr;
};

struct JSENV_API JSPropertyInfo
{
    JSPropertyInfo() : Name(nullptr), Getter(nullptr), Setter(nullptr)
    {
    }

    JSPropertyInfo(const char* InName, JSFunctionCallback InGetter, JSFunctionCallback InSetter, void* InGetterData = nullptr,
        void* InSetterData = nullptr)
        : Name(InName), Getter(InGetter), Setter(InSetter), GetterData(InGetterData), SetterData(InSetterData)
    {
    }

    template <class CallbackType>
    JSPropertyInfo(const char* InName, CallbackType InGetter, CallbackType InSetter, void* InGetterData = nullptr,
        void* InSetterData = nullptr)
        : Name(InName)
        , Getter(reinterpret_cast<JSFunctionCallback>(InGetter))
        , Setter(reinterpret_cast<JSFunctionCallback>(InSetter))
        , GetterData(InGetterData)
        , SetterData(InSetterData)
    {
    }

    const char* Name;
    JSFunctionCallback Getter;
    JSFunctionCallback Setter;
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
    JSInitializeFunc Initialize;
    template <class InitializeType>
    void SetInitialize(InitializeType InInitialize)
    {
        Initialize = reinterpret_cast<JSInitializeFunc>(InInitialize);
    }
    JSFunctionInfo* Methods;       //成员方法
    JSFunctionInfo* Functions;     //静态方法
    JSPropertyInfo* Properties;    //成员属性
    JSPropertyInfo* Variables;     //静态属性
    JSFinalizeFunc Finalize;
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

// ---------------------------------------------------------------- class registry instance api
// aligned with unity/native/puerts/include/ScriptClassRegistry.h. A pesapi_registry is a ScriptClassRegistry*.
// The legacy global functions below operate on the default registry returned by GetDefaultClassRegistry().
class ScriptClassRegistry;
typedef JSClassDefinition ScriptClassDefinition;
typedef JSFunctionInfo ScriptFunctionInfo;
typedef JSPropertyInfo ScriptPropertyInfo;

JSENV_API ScriptClassRegistry* GetDefaultClassRegistry();

JSENV_API ScriptClassRegistry* CreateRegistry();

// the default registry can not be destroyed
JSENV_API void DestroyRegistry(ScriptClassRegistry* Registry);

JSENV_API void RegisterScriptClass(ScriptClassRegistry* Registry, const ScriptClassDefinition& ClassDefinition);

JSENV_API void SetClassTypeInfo(ScriptClassRegistry* Registry, const void* TypeId, const NamedFunctionInfo* ConstructorInfos,
    const NamedFunctionInfo* MethodInfos, const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos,
    const NamedPropertyInfo* VariableInfos);

JSENV_API void ForeachRegisterClass(
    ScriptClassRegistry* Registry, const std::function<void(const ScriptClassDefinition* ClassDefinition)>& Callback);

JSENV_API const ScriptClassDefinition* FindClassByID(ScriptClassRegistry* Registry, const void* TypeId);

JSENV_API void OnClassNotFound(ScriptClassRegistry* Registry, pesapi_class_not_found_callback Callback);

JSENV_API const ScriptClassDefinition* LoadClassByID(ScriptClassRegistry* Registry, const void* TypeId);

JSENV_API const ScriptClassDefinition* FindCppTypeClassByName(ScriptClassRegistry* Registry, const PString& Name);

JSENV_API const ScriptClassDefinition* FindCppTypeClassByCName(ScriptClassRegistry* Registry, const char* Name);

JSENV_API bool TraceObjectLifecycle(
    ScriptClassRegistry* Registry, const void* TypeId, pesapi_on_native_object_enter OnEnter, pesapi_on_native_object_exit OnExit);

#if USING_IN_UNREAL_ENGINE
JSENV_API const ScriptClassDefinition* FindClassByType(ScriptClassRegistry* Registry, UStruct* Type);
#endif

// ---------------------------------------------------------------- pesapi entries of the plugin (v8impl)
// used by PesapiBackend.hpp when binding inside the plugin (not in a pesapi addon)
JSENV_API struct pesapi_ffi* GetPesapiFFI();

JSENV_API struct pesapi_registry_api* GetPesapiRegistryApi();

// Same as RegisterScriptClass except that a nullptr Registry means the default registry.
// Unlike pesapi_registry_api, UE types (UETypeName) are supported.
JSENV_API void RegisterPesapiClass(ScriptClassRegistry* Registry, const ScriptClassDefinition& ClassDefinition);

// ---------------------------------------------------------------- legacy global api (default registry)
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

// module internal: the process wide definitions of reflected classes (UClass / UScriptStruct, keyed by their FStructWrapper)
// and of the container classes (TArray / TSet / TMap / fixed size array, see ContainerWrapper.cpp), they are not in the name
// tables (so not visible to ForeachRegisterClass / loadCPPType) but FindClassByID / LoadClassByID of every registry fall back
// to them, see StructWrapper.cpp
const JSClassDefinition* FindReflectedClass(const void* TypeId);

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
