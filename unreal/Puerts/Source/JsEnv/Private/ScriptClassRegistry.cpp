/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

// Instance based class registry, the api is aligned with unity/native/puerts/include/ScriptClassRegistry.h.
// Unreal keeps a default (global) registry which is used by the legacy global functions declared in JSClassRegister.h.

#include "ScriptClassRegistry.h"
#if USING_IN_UNREAL_ENGINE
#include "UObject/Class.h"
#endif
#include <map>
#include <cstring>

namespace PUERTS_NAMESPACE
{
template <class T>
static T* PropertyInfoDuplicate(T* Arr)
{
    if (Arr == nullptr)
        return nullptr;
    int Count = 0;
    while (true)
    {
        if (Arr[Count++].Name == nullptr)
            break;
    }
    T* Ret = new T[Count];
    ::memcpy(Ret, Arr, sizeof(T) * Count);
    return Ret;
}

static ScriptClassDefinition* ScriptClassDefinitionDuplicate(const ScriptClassDefinition* ClassDefinition)
{
    auto Ret = new ScriptClassDefinition;
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

static void ScriptClassDefinitionDelete(ScriptClassDefinition* ClassDefinition)
{
    delete[] ClassDefinition->Methods;
    delete[] ClassDefinition->Functions;
    delete[] ClassDefinition->Properties;
    delete[] ClassDefinition->Variables;
    delete[] ClassDefinition->ConstructorInfos;
    delete[] ClassDefinition->MethodInfos;
    delete[] ClassDefinition->FunctionInfos;
    delete[] ClassDefinition->PropertyInfos;
    delete[] ClassDefinition->VariableInfos;
    delete ClassDefinition;
}

static void SetReflectoinInfo(ScriptFunctionInfo* Methods, const NamedFunctionInfo* MethodInfos)
{
    if (!Methods || !MethodInfos)
    {
        return;
    }
    std::map<PString, std::tuple<int, const NamedFunctionInfo*>> InfoMap;
    const NamedFunctionInfo* MethodInfo = MethodInfos;
    while (MethodInfo->Name)
    {
        auto Iter = InfoMap.find(MethodInfo->Name);
        if (Iter == InfoMap.end())
        {
            InfoMap[MethodInfo->Name] = std::make_tuple(1, MethodInfo);
        }
        else
        {
            std::get<0>(Iter->second) = 2;
        }
        ++MethodInfo;
    }

    ScriptFunctionInfo* Method = Methods;
    while (Method->Name)
    {
        auto Iter = InfoMap.find(Method->Name);
        if (Iter != InfoMap.end() && std::get<0>(Iter->second) == 1)
        {
            Method->ReflectionInfo = std::get<1>(Iter->second)->Type;
        }
        ++Method;
    }
}

class ScriptClassRegistry
{
public:
    ScriptClassRegistry() = default;

    ~ScriptClassRegistry()
    {
        for (auto& KV : CDataIdToClassDefinition)
        {
            ScriptClassDefinitionDelete(KV.second);
        }
        CDataIdToClassDefinition.clear();
        CDataNameToClassDefinition.clear();
#if USING_IN_UNREAL_ENGINE
        for (auto& KV : StructNameToClassDefinition)
        {
            ScriptClassDefinitionDelete(KV.second);
        }
        StructNameToClassDefinition.clear();
#endif
    }

    // unlike unity (first registration wins), unreal replaces the previous definition (behaviour kept from JSClassRegister)
    void RegisterClass(const ScriptClassDefinition& ClassDefinition)
    {
        if (ClassDefinition.TypeId && ClassDefinition.ScriptName)
        {
            auto cd_iter = CDataIdToClassDefinition.find(ClassDefinition.TypeId);
            if (cd_iter != CDataIdToClassDefinition.end())
            {
                ScriptClassDefinitionDelete(cd_iter->second);
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
                ScriptClassDefinitionDelete(ud_iter->second);
            }
            StructNameToClassDefinition[SN] = ScriptClassDefinitionDuplicate(&ClassDefinition);
        }
#endif
    }

    void SetClassTypeInfo(const void* TypeId, const NamedFunctionInfo* ConstructorInfos, const NamedFunctionInfo* MethodInfos,
        const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos, const NamedPropertyInfo* VariableInfos)
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

    void ForeachRegisterClass(const std::function<void(const ScriptClassDefinition* ClassDefinition)>& Callback)
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

    const ScriptClassDefinition* FindClassByID(const void* TypeId)
    {
        if (!TypeId)
        {
            return nullptr;
        }
        auto Iter = CDataIdToClassDefinition.find(TypeId);
        return Iter == CDataIdToClassDefinition.end() ? nullptr : Iter->second;
    }

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
        auto ClassDef = FindClassByID(TypeId);
        if (!ClassDef && ClassNotFoundCallback)
        {
            if (!ClassNotFoundCallback(TypeId))
            {
                return nullptr;
            }
            ClassDef = FindClassByID(TypeId);
        }
        return ClassDef;
    }

    const ScriptClassDefinition* FindCppTypeClassByName(const PString& Name)
    {
        auto Iter = CDataNameToClassDefinition.find(Name);
        return Iter == CDataNameToClassDefinition.end() ? nullptr : Iter->second;
    }

    bool TraceObjectLifecycle(const void* TypeId, pesapi_on_native_object_enter OnEnter, pesapi_on_native_object_exit OnExit)
    {
        if (auto ClassDef = const_cast<ScriptClassDefinition*>(FindClassByID(TypeId)))
        {
            ClassDef->OnEnter = OnEnter;
            ClassDef->OnExit = OnExit;
            return true;
        }
        return false;
    }

#if USING_IN_UNREAL_ENGINE
    const ScriptClassDefinition* FindClassByType(UStruct* Type)
    {
        auto Iter = StructNameToClassDefinition.find(Type->GetName());
        return Iter == StructNameToClassDefinition.end() ? nullptr : Iter->second;
    }
#endif

private:
    std::map<const void*, ScriptClassDefinition*> CDataIdToClassDefinition;
    std::map<PString, ScriptClassDefinition*> CDataNameToClassDefinition;
    pesapi_class_not_found_callback ClassNotFoundCallback = nullptr;
#if USING_IN_UNREAL_ENGINE
    std::map<FString, ScriptClassDefinition*> StructNameToClassDefinition;
#endif
};

ScriptClassRegistry* GetDefaultClassRegistry()
{
    static ScriptClassRegistry S_DefaultRegistry;
    return &S_DefaultRegistry;
}

ScriptClassRegistry* CreateRegistry()
{
    return new ScriptClassRegistry();
}

void DestroyRegistry(ScriptClassRegistry* Registry)
{
    if (Registry && Registry != GetDefaultClassRegistry())
    {
        delete Registry;
    }
}

void RegisterScriptClass(ScriptClassRegistry* Registry, const ScriptClassDefinition& ClassDefinition)
{
    Registry->RegisterClass(ClassDefinition);
}

void SetClassTypeInfo(ScriptClassRegistry* Registry, const void* TypeId, const NamedFunctionInfo* ConstructorInfos,
    const NamedFunctionInfo* MethodInfos, const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos,
    const NamedPropertyInfo* VariableInfos)
{
    Registry->SetClassTypeInfo(TypeId, ConstructorInfos, MethodInfos, FunctionInfos, PropertyInfos, VariableInfos);
}

void ForeachRegisterClass(
    ScriptClassRegistry* Registry, const std::function<void(const ScriptClassDefinition* ClassDefinition)>& Callback)
{
    Registry->ForeachRegisterClass(Callback);
}

const ScriptClassDefinition* FindClassByID(ScriptClassRegistry* Registry, const void* TypeId)
{
    return Registry->FindClassByID(TypeId);
}

void OnClassNotFound(ScriptClassRegistry* Registry, pesapi_class_not_found_callback Callback)
{
    Registry->OnClassNotFound(Callback);
}

const ScriptClassDefinition* LoadClassByID(ScriptClassRegistry* Registry, const void* TypeId)
{
    return Registry->LoadClassByID(TypeId);
}

const ScriptClassDefinition* FindCppTypeClassByName(ScriptClassRegistry* Registry, const PString& Name)
{
    return Registry->FindCppTypeClassByName(Name);
}

const ScriptClassDefinition* FindCppTypeClassByCName(ScriptClassRegistry* Registry, const char* Name)
{
    return Name ? Registry->FindCppTypeClassByName(PString(Name)) : nullptr;
}

bool TraceObjectLifecycle(
    ScriptClassRegistry* Registry, const void* TypeId, pesapi_on_native_object_enter OnEnter, pesapi_on_native_object_exit OnExit)
{
    return Registry->TraceObjectLifecycle(TypeId, OnEnter, OnExit);
}

#if USING_IN_UNREAL_ENGINE
const ScriptClassDefinition* FindClassByType(ScriptClassRegistry* Registry, UStruct* Type)
{
    return Registry->FindClassByType(Type);
}
#endif

}    // namespace PUERTS_NAMESPACE
