/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

// Legacy global class register api, thin wrappers of the default ScriptClassRegistry (see ScriptClassRegistry.cpp).

#include "JSClassRegister.h"
#if USING_IN_UNREAL_ENGINE
#include "UObject/Class.h"
#include "UObject/Package.h"
#endif
#include <map>

namespace PUERTS_NAMESPACE
{
void RegisterJSClass(const JSClassDefinition& ClassDefinition)
{
    RegisterScriptClass(GetDefaultClassRegistry(), ClassDefinition);
}

void SetClassTypeInfo(const void* TypeId, const NamedFunctionInfo* ConstructorInfos, const NamedFunctionInfo* MethodInfos,
    const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos, const NamedPropertyInfo* VariableInfos)
{
    SetClassTypeInfo(GetDefaultClassRegistry(), TypeId, ConstructorInfos, MethodInfos, FunctionInfos, PropertyInfos, VariableInfos);
}

void ForeachRegisterClass(std::function<void(const JSClassDefinition* ClassDefinition)> Callback)
{
    ForeachRegisterClass(GetDefaultClassRegistry(), Callback);
}

const JSClassDefinition* FindClassByID(const void* TypeId)
{
    return FindClassByID(GetDefaultClassRegistry(), TypeId);
}

void OnClassNotFound(pesapi_class_not_found_callback Callback)
{
    OnClassNotFound(GetDefaultClassRegistry(), Callback);
}

const JSClassDefinition* LoadClassByID(const void* TypeId)
{
    return LoadClassByID(GetDefaultClassRegistry(), TypeId);
}

const JSClassDefinition* FindCppTypeClassByName(const PString& Name)
{
    return FindCppTypeClassByName(GetDefaultClassRegistry(), Name);
}

bool TraceObjectLifecycle(const void* TypeId, pesapi_on_native_object_enter OnEnter, pesapi_on_native_object_exit OnExit)
{
    return TraceObjectLifecycle(GetDefaultClassRegistry(), TypeId, OnEnter, OnExit);
}

#if USING_IN_UNREAL_ENGINE

bool IsEditorOnlyUFunction(const UFunction* Func)
{
    // a simplified version of IsEditorOnlyObject(), sadly it's a EditorOnly Function so I have to reimplement a toy one
    if (!Func)
    {
        return false;
    }
    if (Func->HasAnyFunctionFlags(FUNC_EditorOnly))
    {
        return true;
    }
    auto InObject = Func;
    if (InObject->HasAnyMarks(OBJECTMARK_EditorOnly) || InObject->IsEditorOnly())
    {
        return true;
    }

    auto Package = Func->GetPackage();
    if (Package && Package->HasAnyPackageFlags(PKG_EditorOnly))
    {
        return true;
    }

    return false;
}

const JSClassDefinition* FindClassByType(UStruct* Type)
{
    return FindClassByType(GetDefaultClassRegistry(), Type);
}
#endif

}    // namespace PUERTS_NAMESPACE
