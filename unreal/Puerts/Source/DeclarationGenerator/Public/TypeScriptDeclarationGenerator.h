/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <functional>
#include "CoreUObject.h"
#include <map>
#include <vector>
#include "PropertyMacros.h"

struct DECLARATIONGENERATOR_API FStringBuffer
{
    FString Buffer;
    
    FString Prefix;
    
    FStringBuffer& operator <<(const FString& InText);
    
    FStringBuffer& operator <<(const TCHAR *InText);
    
    FStringBuffer& operator <<(const char *InText);
    
    FStringBuffer& operator <<(const FStringBuffer &Other);
    
    void Indent(int Num);
};


struct DECLARATIONGENERATOR_API FTypeScriptDeclarationGenerator
{
    FStringBuffer Output {"", ""};
    TSet<UObject*> Processed;
    TSet<FString> ProcessedByName;
    std::map<UStruct*, std::vector<UFunction*>> ExtensionMethodsMap;

    void InitExtensionMethodsMap();

    virtual void Begin(FString Namespace = TEXT("ue"));

    void GenTypeScriptDeclaration();
    
    virtual void Gen(UObject *ToGen);
    
    virtual bool GenTypeDecl(FStringBuffer& StringBuffer, PropertyMacro* Property, TArray<UObject *> &AddToGen, bool ArrayDimProcessed = false, bool TreatAsRawFunction = false);
    
    virtual bool GenFunction(FStringBuffer& OwnerBuffer,UFunction* Function, bool WithName = true, bool ForceOneway = false, bool IgnoreOut = false, bool IsExtensionMethod = false);
    
    virtual void GenClass(UClass* Class);
    
    virtual void GenEnum(UEnum *Enum);
    
    virtual void GenStruct(UStruct *Struct);
    
    virtual void End();
    
    FString ToString();

    virtual ~FTypeScriptDeclarationGenerator(){}
};

struct DECLARATIONGENERATOR_API FReactDeclarationGenerator : public FTypeScriptDeclarationGenerator
{
    void Begin(FString Namespace) override;

    void GenReactDeclaration();

    void GenClass(UClass* Class) override;

    void GenStruct(UStruct *Struct) override;

    void GenEnum(UEnum *Enum) override;

    void End() override;

    virtual ~FReactDeclarationGenerator() {}
};


