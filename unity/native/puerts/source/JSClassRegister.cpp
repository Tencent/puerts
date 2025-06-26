/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "JSClassRegister.h"
#if USING_IN_UNREAL_ENGINE
#include "UObject/Class.h"
#endif
#include <EASTL/map.h>
#include <EASTL/allocator_malloc.h>
#include <string.h>
#include "TypeInfo.hpp"
#include "PString.h"

namespace PUERTS_REG_NAMESPACE
{
template <class T>
static T* PropertyInfoDuplicate(T* Arr)
{
    if (Arr == nullptr)
        return nullptr;
    int Count = 0;
    ;
    while (true)
    {
        if (Arr[Count++].Name == nullptr)
            break;
    }
    T* Ret = (T*)::malloc(sizeof(T) *Count);
    ::memcpy(Ret, Arr, sizeof(T) * Count);
    return Ret;
}

ScriptClassDefinition* ScriptClassDefinitionDuplicate(const ScriptClassDefinition* ClassDefinition)
{
    auto Ret = (ScriptClassDefinition*)::malloc(sizeof(ScriptClassDefinition));
    ::memcpy(Ret, ClassDefinition, sizeof(ScriptClassDefinition));
    Ret->Methods = PropertyInfoDuplicate(ClassDefinition->Methods);
    Ret->Functions = PropertyInfoDuplicate(ClassDefinition->Functions);
    Ret->Properties = PropertyInfoDuplicate(ClassDefinition->Properties);
    Ret->Variables = PropertyInfoDuplicate(ClassDefinition->Variables);
    Ret->ConstructorInfos = PropertyInfoDuplicate(ClassDefinition->ConstructorInfos);
    Ret->MethodInfos = PropertyInfoDuplicate(ClassDefinition->MethodInfos);
    Ret->FunctionInfos = PropertyInfoDuplicate(ClassDefinition->FunctionInfos);
    Ret->PropertyInfos = PropertyInfoDuplicate(ClassDefinition->PropertyInfos);
    Ret->VariableInfos = PropertyInfoDuplicate(ClassDefinition->VariableInfos);
    return Ret;
}

void ScriptClassDefinitionDelete(ScriptClassDefinition* ClassDefinition)
{
    ::free(ClassDefinition->Methods);
    ::free(ClassDefinition->Functions);
    ::free(ClassDefinition->Properties);
    ::free(ClassDefinition->Variables);
    ::free(ClassDefinition->ConstructorInfos);
    ::free(ClassDefinition->MethodInfos);
    ::free(ClassDefinition->FunctionInfos);
    ::free(ClassDefinition->PropertyInfos);
    ::free(ClassDefinition->VariableInfos);
    ::free(ClassDefinition);
}

class JSClassRegister
{
public:
    JSClassRegister();
    ~JSClassRegister();

    void RegisterClass(const ScriptClassDefinition& ClassDefinition);

    void SetClassTypeInfo(const void* TypeId, const NamedFunctionInfo* ConstructorInfos, const NamedFunctionInfo* MethodInfos,
        const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos, const NamedPropertyInfo* VariableInfos);

    void ForeachRegisterClass(ClassDefinitionForeachCallback Callback);

    const ScriptClassDefinition* FindClassByID(const void* TypeId);

    void OnClassNotFound(pesapi_class_not_found_callback InCallback)
    {
        ClassNotFoundCallback = InCallback;
    }

    const ScriptClassDefinition* LoadClassByID(const void* TypeId)
    {
        if (!TypeId)
        {
            return nullptr;
        }
        auto clsDef = FindClassByID(TypeId);
        if (!clsDef && ClassNotFoundCallback)
        {
            if (!ClassNotFoundCallback(TypeId))
            {
                return nullptr;
            }
            clsDef = FindClassByID(TypeId);
        }
        return clsDef;
    }

    const ScriptClassDefinition* FindCppTypeClassByName(const PString& Name);

#if USING_IN_UNREAL_ENGINE
    void RegisterAddon(const PString& Name, AddonRegisterFunc RegisterFunc);

    AddonRegisterFunc FindAddonRegisterFunc(const PString& Name);

    const ScriptClassDefinition* FindClassByType(UStruct* Type);
#endif

private:
    eastl::map<const void*, ScriptClassDefinition*, eastl::less<const void*>, eastl::allocator_malloc> CDataIdToClassDefinition;
    eastl::map<PString, ScriptClassDefinition*, eastl::less<PString>, eastl::allocator_malloc> CDataNameToClassDefinition; //需要禁用rtti，否则含析构函数的类会导致对libstdc++/libc++的依赖，尽管没有使用c++的api
    pesapi_class_not_found_callback ClassNotFoundCallback = nullptr;
#if USING_IN_UNREAL_ENGINE
    eastl::map<PString, AddonRegisterFunc, eastl::less<PString>, eastl::allocator_malloc> AddonRegisterInfos;
    eastl::map<FString, ScriptClassDefinition*, eastl::less<FString>, eastl::allocator_malloc> StructNameToClassDefinition;
#endif
};

JSClassRegister::JSClassRegister()
{
}

JSClassRegister::~JSClassRegister()
{
    for (auto& KV : CDataIdToClassDefinition)
    {
        ScriptClassDefinitionDelete(KV.second);
    }
    CDataIdToClassDefinition.clear();
#if USING_IN_UNREAL_ENGINE
    for (auto& KV : StructNameToClassDefinition)
    {
        ScriptClassDefinitionDelete(KV.second);
    }
    StructNameToClassDefinition.clear();
#endif
}

void JSClassRegister::RegisterClass(const ScriptClassDefinition& ClassDefinition)
{
    if (ClassDefinition.TypeId && ClassDefinition.ScriptName)
    {
        auto cd_iter = CDataIdToClassDefinition.find(ClassDefinition.TypeId);
        if (cd_iter != CDataIdToClassDefinition.end())
        {
            //ScriptClassDefinitionDelete(cd_iter->second);
            return;
        }
        CDataIdToClassDefinition[ClassDefinition.TypeId] = ScriptClassDefinitionDuplicate(&ClassDefinition);
        PString SN = ClassDefinition.ScriptName;
        CDataNameToClassDefinition[SN] = CDataIdToClassDefinition[ClassDefinition.TypeId];
        CDataIdToClassDefinition[ClassDefinition.TypeId]->ScriptName = CDataNameToClassDefinition.find(SN)->first.c_str();
    }
#if USING_IN_UNREAL_ENGINE
    else if (ClassDefinition.UETypeName)
    {
        FString SN = UTF8_TO_TCHAR(ClassDefinition.UETypeName);
        auto ud_iter = StructNameToClassDefinition.find(SN);
        if (ud_iter != StructNameToClassDefinition.end())
        {
            //ScriptClassDefinitionDelete(ud_iter->second);
            return;
        }
        StructNameToClassDefinition[SN] = ScriptClassDefinitionDuplicate(&ClassDefinition);
    }
#endif
}

void SetReflectoinInfo(ScriptFunctionInfo* Methods, const NamedFunctionInfo* MethodInfos)
{
    eastl::map<PString, eastl::tuple<int, const NamedFunctionInfo*>, eastl::less<PString>, eastl::allocator_malloc> InfoMap;
    const NamedFunctionInfo* MethodInfo = MethodInfos;
    while (MethodInfo->Name)
    {
        auto Iter = InfoMap.find(MethodInfo->Name);
        if (Iter == InfoMap.end())
        {
            InfoMap[MethodInfo->Name] = eastl::make_tuple(1, MethodInfo);
        }
        else
        {
            eastl::get<0>(Iter->second) = 2;
        }
        ++MethodInfo;
    }

    ScriptFunctionInfo* Method = Methods;
    while (Method->Name)
    {
        auto Iter = InfoMap.find(Method->Name);
        if (Iter != InfoMap.end() && eastl::get<0>(Iter->second) == 1)
        {
            Method->ReflectionInfo = eastl::get<1>(Iter->second)->Type;
        }
        ++Method;
    }
}

void JSClassRegister::SetClassTypeInfo(const void* TypeId, const NamedFunctionInfo* ConstructorInfos,
    const NamedFunctionInfo* MethodInfos, const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos,
    const NamedPropertyInfo* VariableInfos)
{
    auto ClassDef = const_cast<ScriptClassDefinition*>(FindClassByID(TypeId));
    if (ClassDef)
    {
        ClassDef->ConstructorInfos = PropertyInfoDuplicate(const_cast<NamedFunctionInfo*>(ConstructorInfos));
        ClassDef->MethodInfos = PropertyInfoDuplicate(const_cast<NamedFunctionInfo*>(MethodInfos));
        ClassDef->FunctionInfos = PropertyInfoDuplicate(const_cast<NamedFunctionInfo*>(FunctionInfos));
        ClassDef->PropertyInfos = PropertyInfoDuplicate(const_cast<NamedPropertyInfo*>(PropertyInfos));
        ClassDef->VariableInfos = PropertyInfoDuplicate(const_cast<NamedPropertyInfo*>(VariableInfos));
        SetReflectoinInfo(ClassDef->Methods, ClassDef->MethodInfos);
        SetReflectoinInfo(ClassDef->Functions, ClassDef->FunctionInfos);
    }
}

const ScriptClassDefinition* JSClassRegister::FindClassByID(const void* TypeId)
{
    if (!TypeId)
    {
        return nullptr;
    }
    auto Iter = CDataIdToClassDefinition.find(TypeId);
    if (Iter == CDataIdToClassDefinition.end())
    {
        return nullptr;
    }
    else
    {
        return Iter->second;
    }
}

const ScriptClassDefinition* JSClassRegister::FindCppTypeClassByName(const PString& Name)
{
    auto Iter = CDataNameToClassDefinition.find(Name);
    if (Iter == CDataNameToClassDefinition.end())
    {
        return nullptr;
    }
    else
    {
        return Iter->second;
    }
}

#if USING_IN_UNREAL_ENGINE
void JSClassRegister::RegisterAddon(const PString& Name, AddonRegisterFunc RegisterFunc)
{
    AddonRegisterInfos[Name] = RegisterFunc;
}

AddonRegisterFunc JSClassRegister::FindAddonRegisterFunc(const PString& Name)
{
    auto Iter = AddonRegisterInfos.find(Name);
    if (Iter == AddonRegisterInfos.end())
    {
        return nullptr;
    }
    else
    {
        return Iter->second;
    }
}

const ScriptClassDefinition* JSClassRegister::FindClassByType(UStruct* Type)
{
    auto Iter = StructNameToClassDefinition.find(Type->GetName());
    if (Iter == StructNameToClassDefinition.end())
    {
        return nullptr;
    }
    else
    {
        return Iter->second;
    }
}
#endif

void JSClassRegister::ForeachRegisterClass(ClassDefinitionForeachCallback Callback)
{
    for (auto& KV : CDataNameToClassDefinition)
    {
        Callback(KV.second);
    }
#if USING_IN_UNREAL_ENGINE
    for (auto& KV : StructNameToClassDefinition)
    {
        Callback(KV.second);
    }
#endif
}

JSClassRegister* CreateRegistry()
{
    auto ret = (JSClassRegister*)malloc(sizeof(JSClassRegister));
    new (ret)JSClassRegister();
    return ret;
}

void RegisterJSClass(JSClassRegister* Registry, const ScriptClassDefinition& ClassDefinition)
{
    Registry->RegisterClass(ClassDefinition);
}

void SetClassTypeInfo(JSClassRegister* Registry, const void* TypeId, const NamedFunctionInfo* ConstructorInfos, const NamedFunctionInfo* MethodInfos,
    const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos, const NamedPropertyInfo* VariableInfos)
{
    Registry->SetClassTypeInfo(TypeId, ConstructorInfos, MethodInfos, FunctionInfos, PropertyInfos, VariableInfos);
}

void ForeachRegisterClass(JSClassRegister* Registry, ClassDefinitionForeachCallback Callback)
{
    Registry->ForeachRegisterClass(Callback);
}

const ScriptClassDefinition* FindClassByID(JSClassRegister* Registry, const void* TypeId)
{
    return Registry->FindClassByID(TypeId);
}

void OnClassNotFound(JSClassRegister* Registry, pesapi_class_not_found_callback Callback)
{
    Registry->OnClassNotFound(Callback);
}

const ScriptClassDefinition* LoadClassByID(JSClassRegister* Registry, const void* TypeId)
{
    return Registry->LoadClassByID(TypeId);
}

const ScriptClassDefinition* FindCppTypeClassByName(JSClassRegister* Registry, const PString& Name)
{
    return Registry->FindCppTypeClassByName(Name);
}

const ScriptClassDefinition* FindCppTypeClassByCName(JSClassRegister* Registry, const char* Name)
{
    return Registry->FindCppTypeClassByName(Name);
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

void RegisterAddon(JSClassRegister* Registry, const char* Name, AddonRegisterFunc RegisterFunc)
{
    Registry->RegisterAddon(Name, RegisterFunc);
}

AddonRegisterFunc FindAddonRegisterFunc(JSClassRegister* Registry, const PString& Name)
{
    return Registry->FindAddonRegisterFunc(Name);
}

const ScriptClassDefinition* FindClassByType(JSClassRegister* Registry, UStruct* Type)
{
    return Registry->FindClassByType(Type);
}
#endif

}    // namespace PUERTS_NAMESPACE
