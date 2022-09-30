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

namespace puerts
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

    void ForeachRegisterClass(std::function<void(const JSClassDefinition* ClassDefinition)>);

    const JSClassDefinition* FindClassByID(const void* TypeId);

    const JSClassDefinition* FindCppTypeClassByName(const std::string& Name);

    void RegisterAddon(const std::string& Name, AddonRegisterFunc RegisterFunc);

    AddonRegisterFunc FindAddonRegisterFunc(const std::string& Name);

#if USING_IN_UNREAL_ENGINE
    const JSClassDefinition* FindClassByType(UStruct* Type);
#endif

private:
    std::map<const void*, JSClassDefinition*> CDataIdToClassDefinition;
    std::map<std::string, JSClassDefinition*> CDataNameToClassDefinition;
    std::map<std::string, AddonRegisterFunc> AddonRegisterInfos;
#if USING_IN_UNREAL_ENGINE
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
        std::string SN = ClassDefinition.ScriptName;
        CDataNameToClassDefinition[SN] = CDataIdToClassDefinition[ClassDefinition.TypeId];
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

const JSClassDefinition* JSClassRegister::FindClassByID(const void* TypeId)
{
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

const JSClassDefinition* JSClassRegister::FindCppTypeClassByName(const std::string& Name)
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

void JSClassRegister::RegisterAddon(const std::string& Name, AddonRegisterFunc RegisterFunc)
{
    AddonRegisterInfos[Name] = RegisterFunc;
}

AddonRegisterFunc JSClassRegister::FindAddonRegisterFunc(const std::string& Name)
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

#if USING_IN_UNREAL_ENGINE
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

void ForeachRegisterClass(std::function<void(const JSClassDefinition* ClassDefinition)> Callback)
{
    GetJSClassRegister()->ForeachRegisterClass(Callback);
}

const JSClassDefinition* FindClassByID(const void* TypeId)
{
    return GetJSClassRegister()->FindClassByID(TypeId);
}

const JSClassDefinition* FindCppTypeClassByName(const std::string& Name)
{
    return GetJSClassRegister()->FindCppTypeClassByName(Name);
}

void RegisterAddon(const char* Name, AddonRegisterFunc RegisterFunc)
{
    GetJSClassRegister()->RegisterAddon(Name, RegisterFunc);
}

AddonRegisterFunc FindAddonRegisterFunc(const std::string& Name)
{
    return GetJSClassRegister()->FindAddonRegisterFunc(Name);
}

#if USING_IN_UNREAL_ENGINE
const JSClassDefinition* FindClassByType(UStruct* Type)
{
    return GetJSClassRegister()->FindClassByType(Type);
}
#endif

}    // namespace puerts
