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
    ;
    while (true)
    {
        if (Arr[Count++].Name == nullptr)
            break;
    }
    T* Ret = new T[Count];
    ::memcpy(Ret, Arr, sizeof(T) * Count);
    return Ret;
}

JSClassDefinition* JSClassDefinitionDuplicate(const JSClassDefinition* ClassDefinition)
{
    auto Ret = new JSClassDefinition;
    ::memcpy(Ret, ClassDefinition, sizeof(JSClassDefinition));
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

void JSClassDefinitionDelete(JSClassDefinition* ClassDefinition)
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

class JSClassRegister
{
public:
    JSClassRegister();
    ~JSClassRegister();

    void RegisterClass(const JSClassDefinition& ClassDefinition);

    void SetClassTypeInfo(const void* TypeId, const NamedFunctionInfo* ConstructorInfos, const NamedFunctionInfo* MethodInfos,
        const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos, const NamedPropertyInfo* VariableInfos);

    void ForeachRegisterClass(std::function<void(const JSClassDefinition* ClassDefinition)>);

    const JSClassDefinition* FindClassByID(const void* TypeId);

    void OnClassNotFound(pesapi_class_not_found_callback InCallback)
    {
        ClassNotFoundCallback = InCallback;
    }

    const JSClassDefinition* LoadClassByID(const void* TypeId)
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

    const JSClassDefinition* FindCppTypeClassByName(const PString& Name);

#if USING_IN_UNREAL_ENGINE
    void RegisterAddon(const PString& Name, AddonRegisterFunc RegisterFunc);

    AddonRegisterFunc FindAddonRegisterFunc(const PString& Name);

    const JSClassDefinition* FindClassByType(UStruct* Type);
#endif

private:
    std::map<const void*, JSClassDefinition*> CDataIdToClassDefinition;
    std::map<PString, JSClassDefinition*> CDataNameToClassDefinition;
    pesapi_class_not_found_callback ClassNotFoundCallback = nullptr;
#if USING_IN_UNREAL_ENGINE
    std::map<PString, AddonRegisterFunc> AddonRegisterInfos;
    std::map<FString, JSClassDefinition*> StructNameToClassDefinition;
#endif
};

JSClassRegister::JSClassRegister()
{
}

JSClassRegister::~JSClassRegister()
{
    for (auto& KV : CDataIdToClassDefinition)
    {
        JSClassDefinitionDelete(KV.second);
    }
    CDataIdToClassDefinition.clear();
#if USING_IN_UNREAL_ENGINE
    for (auto& KV : StructNameToClassDefinition)
    {
        JSClassDefinitionDelete(KV.second);
    }
    StructNameToClassDefinition.clear();
#endif
}

void JSClassRegister::RegisterClass(const JSClassDefinition& ClassDefinition)
{
    if (ClassDefinition.TypeId && ClassDefinition.ScriptName)
    {
        auto cd_iter = CDataIdToClassDefinition.find(ClassDefinition.TypeId);
        if (cd_iter != CDataIdToClassDefinition.end())
        {
            JSClassDefinitionDelete(cd_iter->second);
        }
        CDataIdToClassDefinition[ClassDefinition.TypeId] = JSClassDefinitionDuplicate(&ClassDefinition);
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
            JSClassDefinitionDelete(ud_iter->second);
        }
        StructNameToClassDefinition[SN] = JSClassDefinitionDuplicate(&ClassDefinition);
    }
#endif
}

void SetReflectoinInfo(JSFunctionInfo* Methods, const NamedFunctionInfo* MethodInfos)
{
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

    JSFunctionInfo* Method = Methods;
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

void JSClassRegister::SetClassTypeInfo(const void* TypeId, const NamedFunctionInfo* ConstructorInfos,
    const NamedFunctionInfo* MethodInfos, const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos,
    const NamedPropertyInfo* VariableInfos)
{
    auto ClassDef = const_cast<JSClassDefinition*>(FindClassByID(TypeId));
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

const JSClassDefinition* JSClassRegister::FindClassByID(const void* TypeId)
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

const JSClassDefinition* JSClassRegister::FindCppTypeClassByName(const PString& Name)
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

const JSClassDefinition* JSClassRegister::FindClassByType(UStruct* Type)
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

void JSClassRegister::ForeachRegisterClass(std::function<void(const JSClassDefinition* ClassDefinition)> Callback)
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

JSClassRegister* GetJSClassRegister()
{
    static JSClassRegister S_JSClassRegister;
    return &S_JSClassRegister;
}

void RegisterJSClass(const JSClassDefinition& ClassDefinition)
{
    GetJSClassRegister()->RegisterClass(ClassDefinition);
}

void SetClassTypeInfo(const void* TypeId, const NamedFunctionInfo* ConstructorInfos, const NamedFunctionInfo* MethodInfos,
    const NamedFunctionInfo* FunctionInfos, const NamedPropertyInfo* PropertyInfos, const NamedPropertyInfo* VariableInfos)
{
    GetJSClassRegister()->SetClassTypeInfo(TypeId, ConstructorInfos, MethodInfos, FunctionInfos, PropertyInfos, VariableInfos);
}

void ForeachRegisterClass(std::function<void(const JSClassDefinition* ClassDefinition)> Callback)
{
    GetJSClassRegister()->ForeachRegisterClass(Callback);
}

const JSClassDefinition* FindClassByID(const void* TypeId)
{
    return GetJSClassRegister()->FindClassByID(TypeId);
}

void OnClassNotFound(pesapi_class_not_found_callback Callback)
{
    GetJSClassRegister()->OnClassNotFound(Callback);
}

const JSClassDefinition* LoadClassByID(const void* TypeId)
{
    return GetJSClassRegister()->LoadClassByID(TypeId);
}

const JSClassDefinition* FindCppTypeClassByName(const PString& Name)
{
    return GetJSClassRegister()->FindCppTypeClassByName(Name);
}

bool TraceObjectLifecycle(const void* TypeId, pesapi_on_native_object_enter OnEnter, pesapi_on_native_object_exit OnExit)
{
    if (auto clsDef = const_cast<JSClassDefinition*>(GetJSClassRegister()->FindClassByID(TypeId)))
    {
        clsDef->OnEnter = OnEnter;
        clsDef->OnExit = OnExit;
        return true;
    }
    return false;
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

void RegisterAddon(const char* Name, AddonRegisterFunc RegisterFunc)
{
    GetJSClassRegister()->RegisterAddon(Name, RegisterFunc);
}

AddonRegisterFunc FindAddonRegisterFunc(const PString& Name)
{
    return GetJSClassRegister()->FindAddonRegisterFunc(Name);
}

const JSClassDefinition* FindClassByType(UStruct* Type)
{
    return GetJSClassRegister()->FindClassByType(Type);
}
#endif

}    // namespace PUERTS_NAMESPACE
