/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "JSClassRegister.h"
#if USING_IN_UNREAL_ENGINE
#include "UObject/Class.h"
#endif
#include <map>

namespace puerts
{
class JSClassRegister
{
public:
    JSClassRegister();
    ~JSClassRegister();

    void RegisterClass(const JSClassDefinition &ClassDefinition);

    void ForeachRegisterClass(std::function<void(const JSClassDefinition *ClassDefinition)>);

    const JSClassDefinition* FindClassByID(const char* Name);

    const JSClassDefinition* FindCppTypeClassByName(const std::string& Name);

#if USING_IN_UNREAL_ENGINE
    void RegisterAddon(const FString&Name, AddonRegisterFunc RegisterFunc);

    const JSClassDefinition* FindClassByType(UStruct* Type);
    
    AddonRegisterFunc FindAddonRegisterFunc(const FString& Name);
#endif
private:
    std::map<const void*, JSClassDefinition*> NameToClassDefinition;
    std::map<std::string, JSClassDefinition*> CDataNameToClassDefinition;
#if USING_IN_UNREAL_ENGINE
    std::map<FString, JSClassDefinition*> StructNameToClassDefinition;
    std::map<FString, AddonRegisterFunc> AddonRegisterInfos;
#endif
};

JSClassRegister::JSClassRegister()
{
}

JSClassRegister::~JSClassRegister()
{
    for(auto & KV : NameToClassDefinition)
    {
        ::free(KV.second);
    }
    NameToClassDefinition.clear();
#if USING_IN_UNREAL_ENGINE
    for(auto & KV : StructNameToClassDefinition)
    {
        ::free(KV.second);
    }
    StructNameToClassDefinition.clear();
#endif
}

void JSClassRegister::RegisterClass(const JSClassDefinition &ClassDefinition)
{
    auto CD = (JSClassDefinition *)::malloc(sizeof(JSClassDefinition));
    ::memcpy(CD, &ClassDefinition, sizeof(JSClassDefinition));
    
    if (ClassDefinition.CPPTypeName)
    {
        NameToClassDefinition[ClassDefinition.CPPTypeName] = CD;
        std::string SN = ClassDefinition.CPPTypeName;
        CDataNameToClassDefinition[SN] = NameToClassDefinition[ClassDefinition.CPPTypeName];
    }
#if USING_IN_UNREAL_ENGINE
    else if (ClassDefinition.UETypeName)
    {
        FString SN = UTF8_TO_TCHAR(ClassDefinition.UETypeName);
        StructNameToClassDefinition[SN] = CD;
    }
#endif
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

#if USING_IN_UNREAL_ENGINE
void JSClassRegister::RegisterAddon(const FString& Name, AddonRegisterFunc RegisterFunc)
{
    AddonRegisterInfos[Name] = RegisterFunc;
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
        return Iter->second;
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
#endif
    
void JSClassRegister::ForeachRegisterClass(std::function<void(const JSClassDefinition *ClassDefinition)> Callback)
{
    for(auto & KV : NameToClassDefinition)
    {
        Callback(KV.second);
    }
#if USING_IN_UNREAL_ENGINE
    for(auto & KV : StructNameToClassDefinition)
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

void RegisterJSClass(const JSClassDefinition &ClassDefinition)
{
    GetJSClassRegister()->RegisterClass(ClassDefinition);
}

void ForeachRegisterClass(std::function<void(const JSClassDefinition *ClassDefinition)> Callback)
{
    GetJSClassRegister()->ForeachRegisterClass(Callback);
}

const JSClassDefinition* FindClassByID(const char* Name)
{
    return GetJSClassRegister()->FindClassByID(Name);
}

const JSClassDefinition* FindCppTypeClassByName(const std::string& Name)
{
    return GetJSClassRegister()->FindCppTypeClassByName(Name);
}

#if USING_IN_UNREAL_ENGINE
void RegisterAddon(const char* Name, AddonRegisterFunc RegisterFunc)
{
    FString SN = UTF8_TO_TCHAR(Name);
    GetJSClassRegister()->RegisterAddon(SN, RegisterFunc);
}

const JSClassDefinition* FindClassByType(UStruct* Type)
{
    return GetJSClassRegister()->FindClassByType(Type);
}

AddonRegisterFunc FindAddonRegisterFunc(const FString& Name)
{
    return GetJSClassRegister()->FindAddonRegisterFunc(Name);
}
#endif

}
