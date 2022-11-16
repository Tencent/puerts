/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <map>
#include <vector>

#include "PropertyMacros.h"

struct DECLARATIONGENERATOR_API FStringBuffer
{
    FString Buffer;

    FString Prefix;

    FStringBuffer& operator<<(const FString& InText);

    FStringBuffer& operator<<(const TCHAR* InText);

    FStringBuffer& operator<<(const char* InText);

    FStringBuffer& operator<<(const FStringBuffer& Other);

    void Indent(int Num);
};

struct DECLARATIONGENERATOR_API FTypeScriptDeclarationGenerator
{
    FStringBuffer Output{"", ""};
    TSet<UObject*> Processed;
    TSet<FString> ProcessedByName;
    std::map<UStruct*, std::vector<UFunction*>> ExtensionMethodsMap;
    struct FunctionKey
    {
        FunctionKey(const FString& InFunctioName, bool InIsStatic) : FunctionName(InFunctioName), IsStatic(InIsStatic)
        {
        }

        bool operator<(const FunctionKey& other) const
        {
            return IsStatic != other.IsStatic ? IsStatic < other.IsStatic : FunctionName < other.FunctionName;
        }

        FString FunctionName;
        bool IsStatic;
    };
    typedef TArray<FString> FunctionOverloads;
    typedef std::map<FunctionKey, FunctionOverloads> FunctionOutputs;
    std::map<UStruct*, FunctionOutputs> AllFuncionOutputs;

    std::map<UObject*, FString> NamespaceMap;

    struct BlueprintTypeDeclInfo
    {
        FString TypeDecl;
        FString FileVersionString;
        bool IsExist;
        bool Changed;
    };

    TMap<FName, BlueprintTypeDeclInfo> BlueprintTypeDeclInfoCache;

    TArray<FAssetData> AssetList;

    bool RefFromOuter = false;

    const FString& GetNamespace(UObject* Obj);

    FString GetNameWithNamespace(UObject* Obj);

    void NamespaceBegin(UObject* Obj, FStringBuffer& Buff);

    void NamespaceEnd(UObject* Obj, FStringBuffer& Buff);

    void WriteOutput(UObject* Obj, const FStringBuffer& Buff);

    void RestoreBlueprintTypeDeclInfos();

    void RestoreBlueprintTypeDeclInfos(const FString& FileContent);

    void LoadAllWidgetBlueprint(FName SearchPath);

    void InitExtensionMethodsMap();

    virtual void Begin(FString Namespace = TEXT("ue"));

    void GenTypeScriptDeclaration(bool GenStruct = false, bool GenEnum = false);

    virtual void Gen(UObject* ToGen);

    virtual bool GenTypeDecl(FStringBuffer& StringBuffer, PropertyMacro* Property, TArray<UObject*>& AddToGen,
        bool ArrayDimProcessed = false, bool TreatAsRawFunction = false);

    virtual bool GenFunction(FStringBuffer& OwnerBuffer, UFunction* Function, bool WithName = true, bool ForceOneway = false,
        bool IgnoreOut = false, bool IsExtensionMethod = false);

    void GatherExtensions(UStruct* Struct, FStringBuffer& Buff);

    void GenResolvedFunctions(UStruct* Struct, FStringBuffer& Buff);

    FunctionOutputs& GetFunctionOutputs(UStruct* Struct);

    FunctionOverloads& GetFunctionOverloads(FunctionOutputs& Outputs, const FString& FunctionName, bool IsStatic);

    void TryToAddOverload(FunctionOutputs& Outputs, const FString& FunctionName, bool IsStatic, const FString& Overload);

    virtual void GenClass(UClass* Class);

    virtual void GenEnum(UEnum* Enum);

    virtual void GenStruct(UStruct* Struct);

    virtual void End();

    FString ToString();

    virtual ~FTypeScriptDeclarationGenerator()
    {
    }
};

bool HasUENamespace(const char* name);

bool HadNamespace(const char* name);