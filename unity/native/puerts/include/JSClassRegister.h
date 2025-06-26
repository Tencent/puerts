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

PRAGMA_DISABLE_UNDEFINED_IDENTIFIER_WARNINGS
#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)
PRAGMA_ENABLE_UNDEFINED_IDENTIFIER_WARNINGS
#else
#define FORCEINLINE V8_INLINE
#define UPTRINT uintptr_t
#endif

#include "PuertsNamespaceDef.h"

#include "pesapi.h"

#if USING_IN_UNREAL_ENGINE
static const FAnsiStringView EditorOnlyPropertySuffix = "_EditorOnly";
#endif

namespace PUERTS_REG_NAMESPACE
{
class CFunctionInfo;
class PString;
class JSClassRegister;

MSVC_PRAGMA(warning(push))
MSVC_PRAGMA(warning(disable : 4191))
struct PUERTS_API ScriptFunctionInfo
{
    ScriptFunctionInfo() : Name(nullptr), Callback(nullptr)
    {
    }

    ScriptFunctionInfo(
        const char* InName, pesapi_callback InCallback, void* InData = nullptr, const CFunctionInfo* InReflectionInfo = nullptr)
        : Name(InName), Callback(InCallback), Data(InData), ReflectionInfo(InReflectionInfo)
    {
    }

    template <class CallbackType>
    ScriptFunctionInfo(
        const char* InName, CallbackType InCallback, void* InData = nullptr, const CFunctionInfo* InReflectionInfo = nullptr)
        : Name(InName), Callback(reinterpret_cast<pesapi_callback>(InCallback)), Data(InData), ReflectionInfo(InReflectionInfo)
    {
    }

    const char* Name;
    pesapi_callback Callback;
    void* Data = nullptr;
    const CFunctionInfo* ReflectionInfo = nullptr;
};

struct PUERTS_API ScriptPropertyInfo
{
    ScriptPropertyInfo() : Name(nullptr), Getter(nullptr), Setter(nullptr)
    {
    }

    ScriptPropertyInfo(const char* InName, pesapi_callback InGetter, pesapi_callback InSetter, void* InGetterData = nullptr,
        void* InSetterData = nullptr)
        : Name(InName), Getter(InGetter), Setter(InSetter), GetterData(InGetterData), SetterData(InSetterData)
    {
    }

    template <class CallbackType>
    ScriptPropertyInfo(const char* InName, CallbackType InGetter, CallbackType InSetter, void* InGetterData = nullptr,
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

struct PUERTS_API ScriptClassDefinition
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
    ScriptFunctionInfo* Methods;       //成员方法
    ScriptFunctionInfo* Functions;     //静态方法
    ScriptPropertyInfo* Properties;    //成员属性
    ScriptPropertyInfo* Variables;     //静态属性
    pesapi_finalize Finalize;
    // int InternalFieldCount;
    NamedFunctionInfo* ConstructorInfos;
    NamedFunctionInfo* MethodInfos;
    NamedFunctionInfo* FunctionInfos;
    NamedPropertyInfo* PropertyInfos;
    NamedPropertyInfo* VariableInfos;
    void* Data = nullptr;
};
MSVC_PRAGMA(warning(pop))

#define ScriptClassEmptyDefinition                           \
    {                                                        \
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0       \
    }
    
    
JSClassRegister* CreateRegistry();

void PUERTS_API RegisterJSClass(JSClassRegister* Registry, const ScriptClassDefinition& ClassDefinition);

void PUERTS_API SetClassTypeInfo(JSClassRegister* Registry, const void* TypeId, const NamedFunctionInfo* ConstructorInfos, const NamedFunctionInfo* MethodInfos,
    const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos, const NamedPropertyInfo* VariableInfos);

typedef void (*ClassDefinitionForeachCallback)(const ScriptClassDefinition* ClassDefinition);

void PUERTS_API ForeachRegisterClass(JSClassRegister* Registry, ClassDefinitionForeachCallback Callback);

PUERTS_API const ScriptClassDefinition* FindClassByID(JSClassRegister* Registry, const void* TypeId);

PUERTS_API void OnClassNotFound(JSClassRegister* Registry, pesapi_class_not_found_callback Callback);

PUERTS_API const ScriptClassDefinition* LoadClassByID(JSClassRegister* Registry, const void* TypeId);

PUERTS_API const ScriptClassDefinition* FindCppTypeClassByName(JSClassRegister* Registry, const PString& Name);

PUERTS_API const ScriptClassDefinition* FindCppTypeClassByCName(JSClassRegister* Registry, const char* Name);

#if USING_IN_UNREAL_ENGINE
typedef void (*AddonRegisterFunc)(v8::Local<v8::Context> Context, v8::Local<v8::Object> Exports);

AddonRegisterFunc FindAddonRegisterFunc(JSClassRegister* Registry, const PString& Name);

void RegisterAddon(JSClassRegister* Registry, const char* Name, AddonRegisterFunc RegisterFunc);

PUERTS_API const ScriptClassDefinition* FindClassByType(JSClassRegister* Registry, UStruct* Type);

PUERTS_API bool IsEditorOnlyUFunction(const UFunction* Func);

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
