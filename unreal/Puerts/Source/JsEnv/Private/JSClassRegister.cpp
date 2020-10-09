/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JSClassRegister.h"
#include "UObject/Class.h"
#include <map>

namespace puerts
{
class JSClassRegister
{
public:
    JSClassRegister();
    ~JSClassRegister();

    void RegisterClass(const JSClassDefinition &ClassDefinition);

    void RegisterAddon(const FString&Name, AddonRegisterFunc RegisterFunc);

    const JSClassDefinition* FindClassByID(const char* Name);

    const JSClassDefinition* FindClassByType(UStruct* Type);

    const JSClassDefinition* FindCDataClassByName(const FString& Name);

    AddonRegisterFunc FindAddonRegisterFunc(const FString& Name);

private:
    std::map<const void*, JSClassDefinition> NameToClassDefinition;
    std::map<FString, JSClassDefinition> StructNameToClassDefinition;
    std::map<FString, JSClassDefinition*> CDataNameToClassDefinition;
    std::map<FString, AddonRegisterFunc> AddonRegisterInfos;
};

JSClassRegister::JSClassRegister()
{
}

JSClassRegister::~JSClassRegister()
{
    NameToClassDefinition.clear();
    StructNameToClassDefinition.clear();
}

void JSClassRegister::RegisterClass(const JSClassDefinition &ClassDefinition)
{
    if (ClassDefinition.UStructName)
    {
        FString SN = UTF8_TO_TCHAR(ClassDefinition.UStructName);
        StructNameToClassDefinition[SN] = ClassDefinition;
    }
    else if (ClassDefinition.CDataName)
    {
        NameToClassDefinition[ClassDefinition.CDataName] = ClassDefinition;
        FString SN = UTF8_TO_TCHAR(ClassDefinition.CDataName);
        CDataNameToClassDefinition[SN] = &NameToClassDefinition[ClassDefinition.CDataName];
    }
}

void JSClassRegister::RegisterAddon(const FString& Name, AddonRegisterFunc RegisterFunc)
{
    AddonRegisterInfos[Name] = RegisterFunc;
}

const JSClassDefinition* JSClassRegister::FindClassByID(const char* Name)
{
    auto Iter = NameToClassDefinition.find(Name);
    if (Iter == NameToClassDefinition.end())
    {
        return nullptr;
    }
    else
    {
        return &Iter->second;
    }
}

const JSClassDefinition* JSClassRegister::FindCDataClassByName(const FString& Name)
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

const JSClassDefinition* JSClassRegister::FindClassByType(UStruct* Type)
{
    FString Name = FString::Printf(TEXT("%s%s"), Type->GetPrefixCPP(), *Type->GetName());
    auto Iter = StructNameToClassDefinition.find(Name);
    if (Iter == StructNameToClassDefinition.end())
    {
        return nullptr;
    }
    else
    {
        return &Iter->second;
    }
}

AddonRegisterFunc JSClassRegister::FindAddonRegisterFunc(const FString& Name)
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

JSClassRegister* GetJSClassRegister()
{
    static JSClassRegister S_JSClassRegister;
    return &S_JSClassRegister;
}

void RegisterClass(const JSClassDefinition &ClassDefinition)
{
    GetJSClassRegister()->RegisterClass(ClassDefinition);
}

void RegisterAddon(const char* Name, AddonRegisterFunc RegisterFunc)
{
    FString SN = UTF8_TO_TCHAR(Name);
    GetJSClassRegister()->RegisterAddon(SN, RegisterFunc);
}

const JSClassDefinition* FindClassByID(const char* Name)
{
    return GetJSClassRegister()->FindClassByID(Name);
}

const JSClassDefinition* FindClassByType(UStruct* Type)
{
    return GetJSClassRegister()->FindClassByType(Type);
}

const JSClassDefinition* FindCDataClassByName(const FString& Name)
{
    return GetJSClassRegister()->FindCDataClassByName(Name);
}

AddonRegisterFunc FindAddonRegisterFunc(const FString& Name)
{
    return GetJSClassRegister()->FindAddonRegisterFunc(Name);
}
}
