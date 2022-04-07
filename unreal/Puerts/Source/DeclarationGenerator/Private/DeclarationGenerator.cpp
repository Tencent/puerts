/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "Runtime/Launch/Resources/Version.h"
#include "IDeclarationGenerator.h"
#include "Features/IModularFeatures.h"
#include "Interfaces/IPluginManager.h"
#include "Misc/Paths.h"
#include "CoreUObject.h"
#include "TypeScriptDeclarationGenerator.h"
#include "Components/PanelSlot.h"
#include "Components/Widget.h"
#if WITH_EDITOR
#include "AssetRegistryModule.h"
#endif
#include "LevelEditor.h"
#include "GenDTSStyle.h"
#include "GenDTSCommands.h"
#include "Framework/Notifications/NotificationManager.h"
#include "Widgets/Notifications/SNotificationList.h"
//#include "Misc/MessageDialog.h"
#include "Framework/MultiBox/MultiBoxBuilder.h"
#include "Engine/UserDefinedStruct.h"
#include "Engine/UserDefinedEnum.h"
#include "Engine/Blueprint.h"
#include "TypeScriptObject.h"
#include "CodeGenerator.h"
#include "JSClassRegister.h"
#include "Engine/CollisionProfile.h"
#if (ENGINE_MAJOR_VERSION >= 5)
#include "ToolMenus.h"
#endif

#define STRINGIZE(x) #x
#define STRINGIZE_VALUE_OF(x) STRINGIZE(x)

static FString SafeName(const FString& Name)
{
    auto Ret = Name.Replace(TEXT(" "), TEXT(""))
                   .Replace(TEXT("-"), TEXT("_"))
                   .Replace(TEXT("/"), TEXT("_"))
                   .Replace(TEXT("("), TEXT("_"))
                   .Replace(TEXT(")"), TEXT("_"))
                   .Replace(TEXT("?"), TEXT("$"))
                   .Replace(TEXT(","), TEXT("_"))
                   .Replace(TEXT("="), TEXT("_"));
    if (Ret.Len() > 0)
    {
        auto FirstChar = Ret[0];
        if ((TCHAR) '0' <= FirstChar && FirstChar <= (TCHAR) '9')
        {
            return TEXT("_") + Ret;
        }
    }
    return Ret;
}

static FString SafeFieldName(const FString& Name, bool WithBracket = true)
{
    bool IsInvalid = false;
    FString Ret = TEXT("");

    for (int i = 0; i < Name.Len(); i++)
    {
        auto Char = Name[i];
        if ((Char >= (TCHAR) '0' && Char <= (TCHAR) '9') || (Char >= (TCHAR) 'a' && Char <= (TCHAR) 'z') ||
            (Char >= (TCHAR) 'A' && Char <= (TCHAR) 'Z') || Char == (TCHAR) '_')
        {
            Ret += Char;
        }
        else
        {
            IsInvalid = true;
            if (Char == (TCHAR) '"')
            {
                Ret += "\\\"";
            }
            else if (Char == (TCHAR) '\\')
            {
                Ret += "\\\\";
            }
            else
            {
                Ret += Char;
            }
        }
    }
    if (Ret.Len() > 0)
    {
        auto FirstChar = Ret[0];
        if ((TCHAR) '0' <= FirstChar && FirstChar <= (TCHAR) '9')
        {
            IsInvalid = true;
        }
    }
    return IsInvalid ? (WithBracket ? ((TEXT("[\"") + Ret + TEXT("\"]"))) : ((TEXT("\"") + Ret + TEXT("\"")))) : Ret;
}

FStringBuffer& FStringBuffer::operator<<(const FString& InText)
{
    this->Buffer += InText;
    return *this;
}

FStringBuffer& FStringBuffer::operator<<(const TCHAR* InText)
{
    this->Buffer += InText;
    return *this;
}

FStringBuffer& FStringBuffer::operator<<(const char* InText)
{
    this->Buffer += ANSI_TO_TCHAR(InText);
    return *this;
}

FStringBuffer& FStringBuffer::operator<<(const FStringBuffer& Other)
{
    FString Line;
    FString Rest = Other.Buffer;
    static const FString NL = TEXT("\n");
    while (Rest.Split(NL, &Line, &Rest, ESearchCase::CaseSensitive, ESearchDir::FromStart))
    {
        *this << Prefix << Line << "\n";
    }
    if (!Rest.IsEmpty())
    {
        *this << Prefix << Rest;
    }
    return *this;
}

void FStringBuffer::Indent(int Num)
{
    if (Num > 0)
    {
        for (int i = 0; i < Num; i++)
            Prefix.AppendChar(' ');
    }
    else if (Num < 0)
    {
        Prefix = Prefix.Mid(0, Prefix.Len() + Num);
    }
}

TArray<UClass*> GetSortedClasses()
{
    TArray<UClass*> SortedClasses;
    for (TObjectIterator<UClass> It; It; ++It)
    {
        SortedClasses.Add(*It);
    }

    SortedClasses.Sort([&](const UClass& ClassA, const UClass& ClassB) -> bool { return ClassA.GetName() < ClassB.GetName(); });

    return SortedClasses;
}

void FTypeScriptDeclarationGenerator::Begin(FString ModuleName)
{
    AllFuncionOutputs.clear();
    InitExtensionMethodsMap();
    Output = {"", ""};
    Output << "/// <reference path=\"puerts.d.ts\" />\n";
    Output << "declare module \"" << ModuleName << "\" {\n";
    Output << "    import {$Ref, $Nullable} from \"puerts\"\n\n";
    Output << "    import * as cpp from \"cpp\"\n\n";
    Output << "    import * as UE from \"ue\"\n\n";
    Output.Indent(4);
}

bool IsChildOf(UClass* Class, const FString& Name)
{
    if (!Class)
        return false;
    if (Class->GetName() == Name)
        return true;
    return IsChildOf(Class->GetSuperClass(), Name);
}

bool IsUEContainer(const char* name)
{
    return !(strncmp(name, "TArray", 6) && strncmp(name, "TSet", 4) && strncmp(name, "TMap", 4));
}

FString GetNamePrefix(const puerts::CTypeInfo* TypeInfo)
{
    return TypeInfo->IsObjectType() && !(IsUEContainer(TypeInfo->Name())) ? "cpp." : "";
}

FString GetName(const puerts::CTypeInfo* TypeInfo)
{
    FString Ret = UTF8_TO_TCHAR(TypeInfo->Name());
    if (TypeInfo->IsUEType())
    {
        return Ret.Mid(1);
    }
    return Ret;
}

void GenArgumentsForFunctionInfo(const puerts::CFunctionInfo* Type, FStringBuffer& Buff)
{
    for (unsigned int i = 0; i < Type->ArgumentCount(); i++)
    {
        if (i != 0)
            Buff << ", ";
        auto argInfo = Type->Argument(i);

        Buff << FString::Printf(TEXT("p%d"), i) << ": ";

        bool IsReference = argInfo->IsRef();
        bool IsNullable = !IsReference && argInfo->IsPointer();
        if (IsNullable)
        {
            Buff << "$Nullable<";
        }
        if (IsReference)
        {
            Buff << "$Ref<";
        }

        Buff << GetNamePrefix(argInfo) << GetName(argInfo);

        if (IsNullable)
        {
            Buff << ">";
        }
        if (IsReference)
        {
            Buff << ">";
        }
    }
}

void FTypeScriptDeclarationGenerator::InitExtensionMethodsMap()
{
    TArray<UClass*> SortedClasses(GetSortedClasses());
    for (int i = 0; i < SortedClasses.Num(); ++i)
    {
        UClass* Class = SortedClasses[i];
        bool IsExtensionMethod = IsChildOf(Class, "ExtensionMethods");
        if (IsExtensionMethod)
        {
            for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
            {
                UFunction* Function = *FuncIt;

                if (Function->HasAnyFunctionFlags(FUNC_Static))
                {
                    TFieldIterator<PropertyMacro> ParamIt(Function);
                    if (ParamIt &&
                        ((ParamIt->PropertyFlags & (CPF_Parm | CPF_ReturnParm)) == CPF_Parm))    // has at least one param
                    {
                        UStruct* Struct = nullptr;
                        if (auto ObjectPropertyBase = CastFieldMacro<ObjectPropertyBaseMacro>(*ParamIt))
                        {
                            Struct = ObjectPropertyBase->PropertyClass;
                        }
                        else if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(*ParamIt))
                        {
                            Struct = StructProperty->Struct;
                        }
                        if (Struct)
                        {
                            if (ExtensionMethodsMap.find(Struct) == ExtensionMethodsMap.end())
                            {
                                ExtensionMethodsMap[Struct] = std::vector<UFunction*>();
                            }
                            ExtensionMethodsMap[Struct].push_back(Function);
                        }
                    }
                }
            }
        }
    }
}

void FTypeScriptDeclarationGenerator::GenTypeScriptDeclaration()
{
    Begin();

    TArray<UClass*> SortedClasses(GetSortedClasses());
    for (int i = 0; i < SortedClasses.Num(); ++i)
    {
        UClass* Class = SortedClasses[i];
        checkfSlow(Class != nullptr, TEXT("Class name corruption!"));
        if (Class->GetName().StartsWith("SKEL_") || Class->GetName().StartsWith("REINST_") ||
            Class->GetName().StartsWith("TRASHCLASS_") || Class->GetName().StartsWith("PLACEHOLDER-") ||
            Class->GetName().StartsWith("HOTRELOADED_"))
        {
            continue;
        }
        Gen(Class);
    }
    End();

    FFileHelper::SaveStringToFile(ToString(),
        *(IPluginManager::Get().FindPlugin("Puerts")->GetBaseDir() / TEXT("Typing/ue/ue.d.ts")),
        FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
}

const FString& FTypeScriptDeclarationGenerator::GetNamespace(UObject* Obj)
{
    auto Iter = NamespaceMap.find(Obj);
    if (Iter == NamespaceMap.end())
    {
        UPackage* Pkg = Obj->GetPackage();
        if (Pkg)
        {
            TArray<FString> PathFrags;
            Pkg->GetName().ParseIntoArray(PathFrags, TEXT("/"));
            for (int i = 0; i < PathFrags.Num(); i++)
            {
                auto FirstChar = PathFrags[i][0];
                if ((FirstChar >= (TCHAR) '0' && FirstChar <= (TCHAR) '9') || FirstChar == (TCHAR) '$')
                {
                    PathFrags[i] = TEXT("$") + PathFrags[i];
                }
            }
            NamespaceMap[Obj] = FString::Join(PathFrags, TEXT("."));
        }
        else
        {
            NamespaceMap[Obj] = TEXT("");
        }
        Iter = NamespaceMap.find(Obj);
    }
    return Iter->second;
}

FString FTypeScriptDeclarationGenerator::GetNameWithNamespace(UObject* Obj)
{
#if !defined(WITHOUT_BP_NAMESPACE)
    if (!Obj->IsNative())
    {
        return (RefFromOuter ? TEXT("") : TEXT("UE.")) + GetNamespace(Obj) + TEXT(".") + SafeName(Obj->GetName());
    }
    return (RefFromOuter ? TEXT("") : TEXT("UE.")) + SafeName(Obj->GetName());
#else
    return SafeName(Obj->GetName());
#endif
}

void FTypeScriptDeclarationGenerator::NamespaceBegin(UObject* Obj)
{
#if !defined(WITHOUT_BP_NAMESPACE)
    if (!Obj->IsNative())
    {
        Output << "    namespace " << GetNamespace(Obj) << " {\n";
        Output.Indent(4);
    }
#endif
}

void FTypeScriptDeclarationGenerator::NamespaceEnd(UObject* Obj)
{
#if !defined(WITHOUT_BP_NAMESPACE)
    if (!Obj->IsNative())
    {
        Output.Indent(-4);
        Output << "    }\n\n";
    }
#endif
}

void FTypeScriptDeclarationGenerator::Gen(UObject* ToGen)
{
    if (Processed.Contains(ToGen))
        return;
    if (ProcessedByName.Contains(SafeName(ToGen->GetName())))
    {
        UE_LOG(LogTemp, Warning, TEXT("duplicate name found in ue.d.ts generate: %s"), *SafeName(ToGen->GetName()));
        return;
    }
    Processed.Add(ToGen);
    ProcessedByName.Add(SafeName(ToGen->GetName()));

    if (auto Class = Cast<UClass>(ToGen))
    {
        GenClass(Class);
    }
    else if (auto Struct = Cast<UStruct>(ToGen))
    {
        GenStruct(Struct);
    }
    else if (auto Enum = Cast<UEnum>(ToGen))
    {
        GenEnum(Enum);
    }
}

// #lizard forgives
bool FTypeScriptDeclarationGenerator::GenTypeDecl(FStringBuffer& StringBuffer, PropertyMacro* Property, TArray<UObject*>& AddToGen,
    bool ArrayDimProcessed, bool TreatAsRawFunction)
{
    if (Property != nullptr && !ArrayDimProcessed && Property->ArrayDim > 1)    // fix size array
    {
        StringBuffer << "FixSizeArray<";
        bool Result = GenTypeDecl(StringBuffer, Property, AddToGen, true, TreatAsRawFunction);
        if (!Result)
            return false;
        StringBuffer << ">";
        return true;
    }
    if (Property == nullptr)
    {
        StringBuffer << "void";
    }
    else if (Property->IsA<BoolPropertyMacro>())
    {
        StringBuffer << "boolean";
    }
    else if (Property->IsA<DoublePropertyMacro>() || Property->IsA<FloatPropertyMacro>() || Property->IsA<IntPropertyMacro>() ||
             Property->IsA<UInt32PropertyMacro>() || Property->IsA<Int16PropertyMacro>() || Property->IsA<UInt16PropertyMacro>() ||
             Property->IsA<Int8PropertyMacro>())
    {
        StringBuffer << "number";
    }
    else if (Property->IsA<Int64PropertyMacro>() || Property->IsA<UInt64PropertyMacro>())
    {
        StringBuffer << "bigint";
    }
    else if (Property->IsA<StrPropertyMacro>() || Property->IsA<NamePropertyMacro>() || Property->IsA<TextPropertyMacro>())
    {
        StringBuffer << "string";
    }
    else if (EnumPropertyMacro* EnumProperty = CastFieldMacro<EnumPropertyMacro>(Property))
    {
        AddToGen.Add(EnumProperty->GetEnum());
        StringBuffer << GetNameWithNamespace(EnumProperty->GetEnum());
    }
    else if (BytePropertyMacro* ByteProperty = CastFieldMacro<BytePropertyMacro>(Property))
    {
        if (ByteProperty->GetIntPropertyEnum())
        {
            AddToGen.Add(ByteProperty->GetIntPropertyEnum());
            StringBuffer << GetNameWithNamespace(ByteProperty->GetIntPropertyEnum());
        }
        else
        {
            StringBuffer << "number";
        }
    }
    else if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(Property))
    {
        if (StructProperty->Struct->GetName() != TEXT("ArrayBuffer") && StructProperty->Struct->GetName() != TEXT("JsObject"))
        {
            AddToGen.Add(StructProperty->Struct);
        }
        if (StructProperty->Struct->GetName() == TEXT("JsObject"))
        {
            StringBuffer << "object";
        }
        else if (StructProperty->Struct->GetName() == TEXT("ArrayBuffer"))
        {
            StringBuffer << "ArrayBuffer";
        }
        else
        {
            StringBuffer << GetNameWithNamespace(StructProperty->Struct);
        }
    }
    else if (auto ArrayProperty = CastFieldMacro<ArrayPropertyMacro>(Property))
    {
        StringBuffer << "TArray<";
        bool Result = GenTypeDecl(StringBuffer, ArrayProperty->Inner, AddToGen, false, TreatAsRawFunction);
        if (!Result)
            return false;
        StringBuffer << ">";
        return true;
    }
    else if (auto SetProperty = CastFieldMacro<SetPropertyMacro>(Property))
    {
        StringBuffer << "TSet<";
        bool Result = GenTypeDecl(StringBuffer, SetProperty->ElementProp, AddToGen, false, TreatAsRawFunction);
        if (!Result)
            return false;
        StringBuffer << ">";
        return true;
    }
    else if (auto MapProperty = CastFieldMacro<MapPropertyMacro>(Property))
    {
        StringBuffer << "TMap<";
        bool Result = GenTypeDecl(StringBuffer, MapProperty->KeyProp, AddToGen, false, TreatAsRawFunction);
        if (!Result)
            return false;
        StringBuffer << ", ";
        Result = GenTypeDecl(StringBuffer, MapProperty->ValueProp, AddToGen, false, TreatAsRawFunction);
        if (!Result)
            return false;
        StringBuffer << ">";
        return true;
    }
    else if (auto ObjectProperty = CastFieldMacro<ObjectPropertyMacro>(Property))
    {
        AddToGen.Add(ObjectProperty->PropertyClass);
        StringBuffer << GetNameWithNamespace(ObjectProperty->PropertyClass);
    }
    else if (auto DelegateProperty = CastFieldMacro<DelegatePropertyMacro>(Property))
    {
        if (!TreatAsRawFunction)
            StringBuffer << "$Delegate<";
        bool Result = GenFunction(StringBuffer, DelegateProperty->SignatureFunction, false);
        if (!Result)
            return false;
        if (!TreatAsRawFunction)
            StringBuffer << ">";
        return true;
    }
    else if (auto MulticastDelegateProperty = CastFieldMacro<MulticastDelegatePropertyMacro>(Property))
    {
        if (!TreatAsRawFunction)
            StringBuffer << "$MulticastDelegate<";
        bool Result = GenFunction(StringBuffer, MulticastDelegateProperty->SignatureFunction, false);
        if (!Result)
            return false;
        if (!TreatAsRawFunction)
            StringBuffer << ">";
        return true;
    }
    else if (auto InterfaceProperty = CastFieldMacro<InterfacePropertyMacro>(Property))
    {
        AddToGen.Add(InterfaceProperty->InterfaceClass);
        StringBuffer << SafeName(InterfaceProperty->InterfaceClass->GetName());
    }
    else if (auto WeakObjectProperty = CastFieldMacro<WeakObjectPropertyMacro>(Property))
    {
        AddToGen.Add(WeakObjectProperty->PropertyClass);
        StringBuffer << "TWeakObjectPtr<" << GetNameWithNamespace(WeakObjectProperty->PropertyClass) << ">";
    }
    else if (auto SoftClassProperty = CastFieldMacro<SoftClassPropertyMacro>(Property))
    {
        AddToGen.Add(SoftClassProperty->PropertyClass);
        StringBuffer << "TSoftClassPtr<" << GetNameWithNamespace(SoftClassProperty->MetaClass) << ">";
    }
    else if (auto SoftObjectProperty = CastFieldMacro<SoftObjectPropertyMacro>(Property))
    {
        AddToGen.Add(SoftObjectProperty->PropertyClass);
        StringBuffer << "TSoftObjectPtr<" << GetNameWithNamespace(SoftObjectProperty->PropertyClass) << ">";
    }
    else if (auto LazyObjectProperty = CastFieldMacro<LazyObjectPropertyMacro>(Property))
    {
        AddToGen.Add(LazyObjectProperty->PropertyClass);
        StringBuffer << "TLazyObjectPtr<" << GetNameWithNamespace(LazyObjectProperty->PropertyClass) << ">";
    }
    else
    {
        return false;
    }
    return true;
}

// #lizard forgives
bool FTypeScriptDeclarationGenerator::GenFunction(
    FStringBuffer& OwnerBuffer, UFunction* Function, bool WithName, bool ForceOneway, bool IgnoreOut, bool IsExtensionMethod)
{
    // FStringBuffer LocalBuffer;
    if (WithName)
    {
        if (!IsExtensionMethod && (Function->FunctionFlags & FUNC_Static))
        {
            OwnerBuffer << "static ";
        }

        OwnerBuffer << SafeFieldName(Function->GetName());
    }
    OwnerBuffer << "(";
    PropertyMacro* ReturnValue = nullptr;
    TArray<UObject*> RefTypes;
    TArray<FString> ParamDecls;
    bool First = true;
    for (TFieldIterator<PropertyMacro> ParamIt(Function); ParamIt; ++ParamIt)
    {
        if (IsExtensionMethod && First)
        {
            First = false;
            continue;
        }
        auto Property = *ParamIt;
        if (Property->PropertyFlags & CPF_Parm)
        {
            if (Property->PropertyFlags & CPF_ReturnParm)
            {
                if (ForceOneway)
                    return false;
                ReturnValue = Property;
            }
            else
            {
                FStringBuffer TmpBuf;
                TMap<FName, FString>* MetaMap = UMetaData::GetMapForObject(Function);
                const FName MetadataCppDefaultValueKey(*(FString(TEXT("CPP_Default_")) + Property->GetName()));
                FString* DefaultValuePtr = nullptr;
                if (MetaMap)
                {
                    DefaultValuePtr = MetaMap->Find(MetadataCppDefaultValueKey);
                }

                TmpBuf << SafeName(Property->GetName());
                if (DefaultValuePtr)
                {
                    TmpBuf << "?";
                }
                TmpBuf << ": ";

                const bool IsReference =
                    !IgnoreOut && Property->PropertyFlags & CPF_OutParm && (!(Property->PropertyFlags & CPF_ConstParm));
                const bool IsNullable = !(DefaultValuePtr != nullptr || IsReference) &&
                                        (CastFieldMacro<ObjectPropertyMacro>(Property) != nullptr) &&
                                        !(Property->PropertyFlags & CPF_ReferenceParm);

                if (IsNullable)
                {
                    TmpBuf << "$Nullable<";
                }
                if (IsReference)
                {
                    if (ForceOneway)
                        return false;
                    TmpBuf << "$Ref<";
                }
                if (!GenTypeDecl(TmpBuf, Property, RefTypes))
                {
                    return false;
                }
                if (IsReference)
                {
                    TmpBuf << ">";
                }
                if (IsNullable)
                {
                    TmpBuf << ">";
                }

                if (DefaultValuePtr)
                {
                    if (Property->IsA<StrPropertyMacro>() || Property->IsA<NamePropertyMacro>() ||
                        Property->IsA<TextPropertyMacro>())
                    {
                        TmpBuf << " /* = \"" << *DefaultValuePtr << "\" */";
                    }
                    else
                    {
                        TmpBuf << " /* = " << *DefaultValuePtr << " */";
                    }
                }
                ParamDecls.Add(TmpBuf.Buffer);
            }
        }
    }
    OwnerBuffer << FString::Join(ParamDecls, TEXT(", "));
    OwnerBuffer << ")" << (WithName ? " : " : " => ");
    if (!GenTypeDecl(OwnerBuffer, ReturnValue, RefTypes))
    {
        return false;
    }

    for (auto Type : RefTypes)
    {
        Gen(Type);
    }

    // OwnerBuffer << "    " << LocalBuffer.Buffer << ";\n";
    return true;
}

static bool GenTemplateBindingFunction(FStringBuffer& OwnerBuffer, puerts::NamedFunctionInfo* Func, bool IsStatic)
{
    if (IsStatic)
    {
        OwnerBuffer << "static ";
    }
    OwnerBuffer << Func->Name << "(";
    GenArgumentsForFunctionInfo(Func->Type, OwnerBuffer);
    const auto Return = Func->Type->Return();
    OwnerBuffer << ") : " << GetNamePrefix(Return) << GetName(Return);

    return true;
}

FTypeScriptDeclarationGenerator::FunctionOutputs& FTypeScriptDeclarationGenerator::GetFunctionOutputs(UStruct* Struct)
{
    return AllFuncionOutputs[Struct];
}

FTypeScriptDeclarationGenerator::FunctionOverloads& FTypeScriptDeclarationGenerator::GetFunctionOverloads(
    FunctionOutputs& Outputs, const FString& FunctionName, bool IsStatic)
{
    return Outputs[FunctionKey(FunctionName, IsStatic)];
}

void FTypeScriptDeclarationGenerator::TryToAddOverload(
    FunctionOutputs& Outputs, const FString& FunctionName, bool IsStatic, const FString& Overload)
{
    FunctionOverloads& Overloads = GetFunctionOverloads(Outputs, FunctionName, IsStatic);
    if (!Overloads.Contains(Overload))
    {
        Overloads.Add(Overload);
    }
}

void FTypeScriptDeclarationGenerator::GatherExtensions(UStruct* Struct, FStringBuffer& Buff)
{
    FunctionOutputs& Outputs = GetFunctionOutputs(Struct);
    auto ClassDefinition = puerts::FindClassByType(Struct);
    if (ClassDefinition)
    {
        puerts::NamedFunctionInfo* FunctionInfo = ClassDefinition->FunctionInfos;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Type)
        {
            FStringBuffer Tmp;
            GenTemplateBindingFunction(Tmp, FunctionInfo, true);
            TryToAddOverload(Outputs, FunctionInfo->Name, true, Tmp.Buffer);
            ++FunctionInfo;
        }

        puerts::NamedFunctionInfo* MethodInfo = ClassDefinition->MethodInfos;
        while (MethodInfo && MethodInfo->Name && MethodInfo->Type)
        {
            FStringBuffer Tmp;
            GenTemplateBindingFunction(Tmp, MethodInfo, false);
            TryToAddOverload(Outputs, MethodInfo->Name, false, Tmp.Buffer);
            ++MethodInfo;
        }
    }

    auto ExtensionMethodsIter = ExtensionMethodsMap.find(Struct);
    if (ExtensionMethodsIter != ExtensionMethodsMap.end())
    {
        for (auto Iter = ExtensionMethodsIter->second.begin(); Iter != ExtensionMethodsIter->second.end(); ++Iter)
        {
            UFunction* Function = *Iter;

            FStringBuffer Tmp;
            if (!GenFunction(Tmp, Function, true, false, false, true))
            {
                continue;
            }
            TryToAddOverload(Outputs, Function->GetName(), false, Tmp.Buffer);
        }
    }
}

void FTypeScriptDeclarationGenerator::GenResolvedFunctions(UStruct* Struct, FStringBuffer& Buff)
{
    FunctionOutputs& Outputs = GetFunctionOutputs(Struct);

    for (FunctionOutputs::iterator Iter = Outputs.begin(); Iter != Outputs.end(); ++Iter)
    {
        const FunctionKey& FunctionKey = Iter->first;
        FunctionOverloads& Overloads = Outputs[FunctionKey];
        for (FunctionOverloads::RangedForIteratorType OverloadIter = Overloads.begin(); OverloadIter != Overloads.end();
             ++OverloadIter)
        {
            Buff << "    " << *OverloadIter << ";\n";
        }

        UStruct* SuperStruct = Struct->GetSuperStruct();
        while (SuperStruct != nullptr)
        {
            FunctionOutputs& SuperOutputs = GetFunctionOutputs(SuperStruct);
            FunctionOutputs::iterator SuperOutputsIter = SuperOutputs.find(FunctionKey);
            if (SuperOutputsIter != SuperOutputs.end())
            {
                FunctionOverloads& SuperOverloads = SuperOutputsIter->second;
                for (FunctionOverloads::RangedForIteratorType SuperOverloadIter = SuperOverloads.begin();
                     SuperOverloadIter != SuperOverloads.end(); ++SuperOverloadIter)
                {
                    if (!Overloads.Contains(*SuperOverloadIter))
                    {
                        Buff << "    /**\n";
                        Buff << "     * @deprecated Unsupported super overloads.\n";
                        Buff << "     */\n";
                        Buff << "    " << *SuperOverloadIter << ";\n";
                    }
                }
            }
            SuperStruct = SuperStruct->GetSuperStruct();
        }
    }
}

void FTypeScriptDeclarationGenerator::GenClass(UClass* Class)
{
    if (Class->ImplementsInterface(UTypeScriptObject::StaticClass()))
        return;
    FStringBuffer StringBuffer{"", ""};
    StringBuffer << "class " << SafeName(Class->GetName());

    auto Super = Class->GetSuperStruct();

    if (Super)
    {
        Gen(Super);
        StringBuffer << " extends " << GetNameWithNamespace(Super);
    }

    StringBuffer << " {\n";

    StringBuffer << "    constructor(Outer?: Object, Name?: string, ObjectFlags?: number);\n";

    for (TFieldIterator<PropertyMacro> PropertyIt(Class, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        auto Property = *PropertyIt;

        FStringBuffer TmpBuff;
        TmpBuff << SafeFieldName(Property->GetName()) << ": ";
        TArray<UObject*> RefTypesTmp;
        if (!GenTypeDecl(TmpBuff, Property, RefTypesTmp))
        {
            continue;
        }
        for (auto Type : RefTypesTmp)
        {
            Gen(Type);
        }
        StringBuffer << "    " << TmpBuff << ";\n";
    }

    FunctionOutputs& Outputs = GetFunctionOutputs(Class);
    for (TFieldIterator<UFunction> FunctionIt(Class, EFieldIteratorFlags::ExcludeSuper); FunctionIt; ++FunctionIt)
    {
        FStringBuffer TmpBuff;
        if (!GenFunction(TmpBuff, *FunctionIt))
        {
            continue;
        }
        TryToAddOverload(Outputs, FunctionIt->GetName(), (FunctionIt->FunctionFlags & FUNC_Static) != 0, TmpBuff.Buffer);
    }

    GatherExtensions(Class, StringBuffer);

    GenResolvedFunctions(Class, StringBuffer);

    StringBuffer << "    static StaticClass(): Class;\n";
    StringBuffer << "    static Find(OrigInName: string, Outer?: Object): " << SafeName(Class->GetName()) << ";\n";
    StringBuffer << "    static Load(InName: string): " << SafeName(Class->GetName()) << ";\n";

    StringBuffer << "}\n\n";

    NamespaceBegin(Class);

    Output << StringBuffer;

    NamespaceEnd(Class);
}

void FTypeScriptDeclarationGenerator::GenEnum(UEnum* Enum)
{
    FStringBuffer StringBuffer{"", ""};

    TArray<FString> EnumListerrals;
    for (int i = 0; i < Enum->NumEnums(); ++i)
    {
        auto Name = Enum->IsA<UUserDefinedEnum>() ?
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                                                  Enum->GetAuthoredNameStringByIndex(i)
#else
                                                  Enum->GetDisplayNameTextByIndex(i).ToString()
#endif
                                                  : Enum->GetNameStringByIndex(i);
        // auto Value = Enum->GetValueByIndex(i);
        EnumListerrals.Add(SafeFieldName(Name, false));
    }

    StringBuffer << "enum " << SafeName(Enum->GetName()) << " { " << FString::Join(EnumListerrals, TEXT(", "));

    if (Enum == StaticEnum<EObjectTypeQuery>())
    {
        UCollisionProfile* CollisionProfile = UCollisionProfile::Get();
        int32 ContainerIndex = 0;
        while (true)
        {
            FName ChannelName = CollisionProfile->ReturnChannelNameFromContainerIndex(ContainerIndex);
            if (ChannelName == NAME_None)
            {
                break;
            }
            auto ObjectType = CollisionProfile->ConvertToObjectType((ECollisionChannel) ContainerIndex);
            if (ObjectType != EObjectTypeQuery::ObjectTypeQuery_MAX)
            {
                StringBuffer << FString::Printf(TEXT(", %s = %d"), *SafeName(ChannelName.ToString()), ObjectType);
            }
            ContainerIndex++;
        }
    }
    else if (Enum == StaticEnum<ETraceTypeQuery>())
    {
        UCollisionProfile* CollisionProfile = UCollisionProfile::Get();
        int32 ContainerIndex = 0;
        while (true)
        {
            FName ChannelName = CollisionProfile->ReturnChannelNameFromContainerIndex(ContainerIndex);
            if (ChannelName == NAME_None)
            {
                break;
            }
            auto TraceType = CollisionProfile->ConvertToTraceType((ECollisionChannel) ContainerIndex);
            if (TraceType != ETraceTypeQuery::TraceTypeQuery_MAX)
            {
                StringBuffer << FString::Printf(TEXT(", %s = %d"), *SafeName(ChannelName.ToString()), TraceType);
            }
            ContainerIndex++;
        }
    }

    StringBuffer << "}\n";

    NamespaceBegin(Enum);

    Output << StringBuffer;

    NamespaceEnd(Enum);
}

void FTypeScriptDeclarationGenerator::GenStruct(UStruct* Struct)
{
#include "ExcludeStructs.h"
    FStringBuffer StringBuffer{"", ""};
    StringBuffer << "class " << SafeName(Struct->GetName());

    auto Super = Struct->GetSuperStruct();

    if (Super)
    {
        Gen(Super);
        StringBuffer << " extends " << GetNameWithNamespace(Super);
    }

    StringBuffer << " {\n";

    auto GenConstrutor = [&]()
    {
        FStringBuffer TmpBuff;
        TmpBuff << "constructor(";
        bool First = true;
        bool HasProperty = false;
        for (TFieldIterator<PropertyMacro> PropertyIt(Struct, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
        {
            auto Property = *PropertyIt;
            if (First)
            {
                First = false;
            }
            else
            {
                TmpBuff << ", ";
            }
            TmpBuff << SafeName(Struct->IsA<UUserDefinedStruct>() ?
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                                                                  Property->GetAuthoredName()
#else
                                                                  Property->GetDisplayNameText().ToString()
#endif
                                                                  : Property->GetName())
                    << ": ";
            TArray<UObject*> RefTypesTmp;
            if (!GenTypeDecl(TmpBuff, Property, RefTypesTmp))
            {
                return;
            }
            HasProperty = true;
        }
        TmpBuff << ")";
        if (HasProperty)
            StringBuffer << "    constructor();\n";
        StringBuffer << "    " << TmpBuff.Buffer << ";\n";
    };
    GenConstrutor();

    for (TFieldIterator<PropertyMacro> PropertyIt(Struct, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        auto Property = *PropertyIt;
        FStringBuffer TmpBuff;
        FString SN = SafeFieldName(Struct->IsA<UUserDefinedStruct>() ?
#if ENGINE_MINOR_VERSION >= 23 || ENGINE_MAJOR_VERSION > 4
                                                                     Property->GetAuthoredName()
#else
                                                                     Property->GetDisplayNameText().ToString()
#endif
                                                                     : Property->GetName());
        TmpBuff << SN << ": ";
        TArray<UObject*> RefTypesTmp;
        if (!GenTypeDecl(TmpBuff, Property, RefTypesTmp))
        {
            continue;
        }
        for (auto Type : RefTypesTmp)
        {
            Gen(Type);
        }
        StringBuffer << "    " << TmpBuff.Buffer << ";\n";
    }

    GatherExtensions(Struct, StringBuffer);

    GenResolvedFunctions(Struct, StringBuffer);

    StringBuffer << "    static StaticClass(): Class;\n";

    StringBuffer << "}\n\n";

    NamespaceBegin(Struct);

    Output << StringBuffer;

    NamespaceEnd(Struct);
}

void FTypeScriptDeclarationGenerator::End()
{
    Output.Indent(-4);
    Output << "}\n";
}

FString FTypeScriptDeclarationGenerator::ToString()
{
    return Output.Buffer;
}

class FToolBarBuilder;

#define LOCTEXT_NAMESPACE "FGenDTSModule"

class FDeclarationGenerator : public IDeclarationGenerator
{
private:
    TSharedPtr<class FUICommandList> PluginCommands;
    TUniquePtr<FAutoConsoleCommand> ConsoleCommand;

#if (ENGINE_MAJOR_VERSION >= 5)
    void RegisterMenus()
    {
        // Owner will be used for cleanup in call to UToolMenus::UnregisterOwner
        FToolMenuOwnerScoped OwnerScoped(this);

        {
            UToolMenu* Menu = UToolMenus::Get()->ExtendMenu("LevelEditor.MainMenu.Window");
            {
                FToolMenuSection& Section = Menu->FindOrAddSection("WindowLayout");
                Section.AddMenuEntryWithCommandList(FGenDTSCommands::Get().PluginAction, PluginCommands);
            }
        }

        {
            UToolMenu* ToolbarMenu = UToolMenus::Get()->ExtendMenu("LevelEditor.LevelEditorToolBar.PlayToolBar");
            {
                FToolMenuSection& Section = ToolbarMenu->FindOrAddSection("PluginTools");
                {
                    FToolMenuEntry& Entry =
                        Section.AddEntry(FToolMenuEntry::InitToolBarButton(FGenDTSCommands::Get().PluginAction));
                    Entry.SetCommandList(PluginCommands);
                }
            }
        }
    }
#else
    void AddToolbarExtension(FToolBarBuilder& Builder)
    {
        Builder.AddToolBarButton(FGenDTSCommands::Get().PluginAction);
    }
#endif

    void GenUeDts()
    {
        LoadAllWidgetBlueprint();
        GenTypeScriptDeclaration();

        TArray<UClass*> SortedClasses(GetSortedClasses());
        for (int i = 0; i < SortedClasses.Num(); ++i)
        {
            UClass* Class = SortedClasses[i];
            if (Class->ImplementsInterface(UCodeGenerator::StaticClass()))
            {
                ICodeGenerator::Execute_Gen(Class->GetDefaultObject());
            }
        }

        FText DialogText = FText::Format(LOCTEXT("PluginButtonDialogText", "genertate finish, {0} store in {1}"),
            FText::FromString(TEXT("ue.d.ts")), FText::FromString(TEXT("Content/Typing/ue")));
        // FMessageDialog::Open(EAppMsgType::Ok, DialogText);
        FNotificationInfo Info(DialogText);
        Info.bFireAndForget = true;
        Info.FadeInDuration = 0.0f;
        Info.FadeOutDuration = 5.0f;
        FSlateNotificationManager::Get().AddNotification(Info);
    }

public:
    void StartupModule() override
    {
        // IModularFeatures::Get().RegisterModularFeature(TEXT("ScriptGenerator"), this);
        FGenDTSStyle::Initialize();
        FGenDTSStyle::ReloadTextures();

        FGenDTSCommands::Register();

        PluginCommands = MakeShareable(new FUICommandList);

        PluginCommands->MapAction(FGenDTSCommands::Get().PluginAction,
            FExecuteAction::CreateRaw(this, &FDeclarationGenerator::GenUeDts), FCanExecuteAction());

#if (ENGINE_MAJOR_VERSION >= 5)
        UToolMenus::RegisterStartupCallback(
            FSimpleMulticastDelegate::FDelegate::CreateRaw(this, &FDeclarationGenerator::RegisterMenus));
#else
        FLevelEditorModule& LevelEditorModule = FModuleManager::LoadModuleChecked<FLevelEditorModule>("LevelEditor");

        {
            TSharedPtr<FExtender> ToolbarExtender = MakeShareable(new FExtender);
            ToolbarExtender->AddToolBarExtension("Settings", EExtensionHook::After, PluginCommands,
                FToolBarExtensionDelegate::CreateRaw(this, &FDeclarationGenerator::AddToolbarExtension));

            LevelEditorModule.GetToolBarExtensibilityManager()->AddExtender(ToolbarExtender);
        }
#endif

        ConsoleCommand = MakeUnique<FAutoConsoleCommand>(TEXT("Puerts.Gen"), TEXT("Execute GenDTS action"),
            FConsoleCommandDelegate::CreateRaw(this, &FDeclarationGenerator::GenUeDts));
    }

    void ShutdownModule() override
    {
        // IModularFeatures::Get().UnregisterModularFeature(TEXT("ScriptGenerator"), this);
#if (ENGINE_MAJOR_VERSION >= 5)
        UToolMenus::UnRegisterStartupCallback(this);
#endif
        FGenDTSStyle::Shutdown();
        FGenDTSCommands::Unregister();
    }

    void LoadAllWidgetBlueprint() override
    {
#if WITH_EDITOR
        FAssetRegistryModule& AssetRegistryModule = FModuleManager::LoadModuleChecked<FAssetRegistryModule>(FName("AssetRegistry"));
        IAssetRegistry& AssetRegistry = AssetRegistryModule.Get();

        TArray<FAssetData> AssetList;

        FARFilter BPFilter;
        BPFilter.PackagePaths.Add(FName(TEXT("/Game")));
        BPFilter.bRecursivePaths = true;
        BPFilter.bRecursiveClasses = true;
        BPFilter.ClassNames.Add(FName(TEXT("Blueprint")));

        AssetRegistry.GetAssets(BPFilter, AssetList);
        for (FAssetData const& Asset : AssetList)
        {
            Asset.GetAsset();
        }
#endif
    }

    void GenTypeScriptDeclaration() override
    {
        FTypeScriptDeclarationGenerator TypeScriptDeclarationGenerator;
        TypeScriptDeclarationGenerator.GenTypeScriptDeclaration();
    }

    void GenReactDeclaration() override
    {
    }

    /*
    virtual FString GetGeneratedCodeModuleName() const override
    {
        return TEXT("Engine");
    }

    virtual bool SupportsTarget(const FString& TargetName) const override
    {
        return true;
    }

    virtual bool ShouldExportClassesForModule(const FString& ModuleName, EBuildModuleType::Type ModuleType, const FString&
ModuleGeneratedIncludeDirectory) const override
    {
        return ModuleName != TEXT("JsEnv");
    }

    virtual void Initialize(const FString& RootLocalPath, const FString& RootBuildPath, const FString& OutputDirectory, const
FString& IncludeBase) override
    {
        TypeScriptDeclarationGenerator.Begin();
    }

    virtual void ExportClass(class UClass* Class, const FString& SourceHeaderFilename, const FString& GeneratedHeaderFilename, bool
bHasChanged) override
    {
#if WITH_EDITOR || HACK_HEADER_GENERATOR
        static FName MainObjectTag("TGameJSMainObject");
        if(Class->HasMetaData(MainObjectTag))
#endif
        {
            TypeScriptDeclarationGenerator.Gen(Class);
        }
    }

    virtual void FinishExport() override
    {
        TypeScriptDeclarationGenerator.End();
        FString Path = ANSI_TO_TCHAR(STRINGIZE_VALUE_OF(DECL_OUTPUT_PATH));
        Path += TEXT("/ue.d.ts");
        //printf(">>>>>>>>>>>>save to %s\n\n", TCHAR_TO_ANSI(*Path));
        FFileHelper::SaveStringToFile(TypeScriptDeclarationGenerator.ToString(), *Path);
    }

    virtual FString GetGeneratorName() const override
    {
        return TEXT("(TypeScript | Kotlin)Declaration Generator Plugin");
    }
    */
};

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FDeclarationGenerator, DeclarationGenerator)
