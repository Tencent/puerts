/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "Runtime/Launch/Resources/Version.h"
#include "IDeclarationGenerator.h"
#include "Features/IModularFeatures.h"
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
#include "TypeScriptObject.h"

#define STRINGIZE(x) #x
#define STRINGIZE_VALUE_OF(x) STRINGIZE(x)

static FString SafeName(const FString &Name)
{
    auto Ret = Name.Replace(TEXT(" "), TEXT("")).Replace(TEXT("-"), TEXT("_"))
        .Replace(TEXT("/"), TEXT("_")).Replace(TEXT("("), TEXT("_"))
        .Replace(TEXT(")"), TEXT("_")).Replace(TEXT("?"), TEXT("$"))
        .Replace(TEXT(","), TEXT("_"));
    if (Ret.Len() > 0)
    {
        auto FirstChar = Ret[0];
        if ((TCHAR)'0' <= FirstChar && FirstChar <= (TCHAR)'9')
        {
            return TEXT("_") + Ret;
        }
    }
    return Ret;
}

//在PropertyTranslator.cpp另有一份，因为属于两个不同的模块共享比较困难，改动需要同步改
static FString DisplayNameOfUserDefinedStructField(const FString &Name)
{
    const int32 GuidStrLen = 32;
    if (Name.Len() > GuidStrLen + 3)
    {
        const int32 UnderscoreIndex = Name.Len() - GuidStrLen - 1;
        if (TCHAR('_') == Name[UnderscoreIndex])
        {
            for (int i = UnderscoreIndex - 1; i > 0; i--)
            {
                if (TCHAR('_') == Name[i])
                {
                    return Name.Mid(0, i);
                }
            }
        }
    }
    return Name;
}


FStringBuffer& FStringBuffer::operator <<(const FString& InText)
{
    this->Buffer += InText;
    return *this;
}

FStringBuffer& FStringBuffer::operator <<(const TCHAR *InText)
{
    this->Buffer += InText;
    return *this;
}

FStringBuffer& FStringBuffer::operator <<(const char *InText)
{
    this->Buffer += ANSI_TO_TCHAR(InText);
    return *this;
}

FStringBuffer& FStringBuffer::operator <<(const FStringBuffer &Other)
{
    FString Line;
    FString Rest = Other.Buffer;
    static const FString NL = TEXT("\n");
    while (Rest.Split(NL, &Line, &Rest, ESearchCase::CaseSensitive, ESearchDir::FromStart)) {
        *this << Prefix <<Line << "\n";
    }
    if (!Rest.IsEmpty()) {
        *this << Prefix << Rest;
    }
    return *this;
}

void FStringBuffer::Indent(int Num)
{
    if (Num > 0)
    {
        for(int i=0; i < Num; i++) Prefix.AppendChar(' ');
    }
    else if (Num < 0)
    {
        Prefix = Prefix.Mid(0, Prefix.Len() + Num);
    }
}


void FTypeScriptDeclarationGenerator::Begin(FString ModuleName)
{
    InitExtensionMethodsMap();
    Output = {"", ""};
    Output << "/// <reference path=\"puerts.d.ts\" />\n";
    Output << "declare module \"" << ModuleName << "\" {\n";
    Output.Indent(4);
}

bool IsChildOf(UClass *Class, const FString& Name)
{
    if (!Class) return false;
    if (Class->GetName() == Name) return true;
    return IsChildOf(Class->GetSuperClass(), Name);
}

void FTypeScriptDeclarationGenerator::InitExtensionMethodsMap()
{
    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        bool IsExtensionMethod = IsChildOf(Class, "ExtensionMethods");
        if (IsExtensionMethod)
        {
            for (TFieldIterator<UFunction> FuncIt(Class, EFieldIteratorFlags::ExcludeSuper); FuncIt; ++FuncIt)
            {
                UFunction* Function = *FuncIt;

                if (Function->HasAnyFunctionFlags(FUNC_Static))
                {
                    TFieldIterator<PropertyMacro> ParamIt(Function);
                    if (ParamIt && ((ParamIt->PropertyFlags & (CPF_Parm | CPF_ReturnParm)) == CPF_Parm))// has at least one param
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
    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        Gen(Class);
    }
    End();

    FFileHelper::SaveStringToFile(ToString(), *(FPaths::ProjectContentDir() / TEXT("Typing/ue/ue.d.ts")));
}

void FTypeScriptDeclarationGenerator::Gen(UObject *ToGen)
{
    if (Processed.Contains(ToGen)) return;
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

bool IsDelegate(PropertyMacro* InProperty)
{
    return InProperty->IsA<DelegatePropertyMacro>()
        || InProperty->IsA<MulticastDelegatePropertyMacro>()
#if ENGINE_MINOR_VERSION >= 23
        || InProperty->IsA<MulticastInlineDelegatePropertyMacro>()
        || InProperty->IsA<MulticastSparseDelegatePropertyMacro>()
#endif
        ;
}

bool HasObjectParam(UFunction* InFunction)
{
    for (TFieldIterator<PropertyMacro> ParamIt(InFunction); ParamIt; ++ParamIt)
    {
        auto Property = *ParamIt;
        if (Property->IsA<ObjectPropertyBaseMacro>())
        {
            return true;
        }
    }
    return false;
}

// #lizard forgives
bool FTypeScriptDeclarationGenerator::GenTypeDecl(FStringBuffer& StringBuffer, PropertyMacro* Property, TArray<UObject *> &AddToGen, bool ArrayDimProcessed, bool TreatAsRawFunction)
{
    if (Property != nullptr && !ArrayDimProcessed && Property->ArrayDim > 1) // fix size array
    {
        StringBuffer << "FixSizeArray<";
        bool Result = GenTypeDecl(StringBuffer, Property, AddToGen, true, TreatAsRawFunction);
        if (!Result) return false;
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
    else if (Property->IsA<BytePropertyMacro>()
             || Property->IsA<DoublePropertyMacro>()
             || Property->IsA<FloatPropertyMacro>()
             || Property->IsA<IntPropertyMacro>()
             || Property->IsA<UInt32PropertyMacro>()
             || Property->IsA<Int16PropertyMacro>()
             || Property->IsA<UInt16PropertyMacro>()
             || Property->IsA<Int8PropertyMacro>())
    {
        StringBuffer << "number";
    }
    else if (Property->IsA<Int64PropertyMacro>()
        || Property->IsA<UInt64PropertyMacro>()
        )
    {
        StringBuffer << "bigint";
    }
    else if (Property->IsA<StrPropertyMacro>()
             ||Property->IsA<NamePropertyMacro>()
             ||Property->IsA<TextPropertyMacro>())
    {
        StringBuffer << "string";
    }
    else if (EnumPropertyMacro* EnumProperty = CastFieldMacro<EnumPropertyMacro>(Property))
    {
        AddToGen.Add(EnumProperty->GetEnum());
        StringBuffer << SafeName(EnumProperty->GetEnum()->GetName());
    }
    else if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(Property))
    {
        if (StructProperty->Struct->GetName() != "ArrayBuffer")
        {
            AddToGen.Add(StructProperty->Struct);
        }
        StringBuffer << SafeName(StructProperty->Struct->GetName());
    }
    else if (auto ArrayProperty = CastFieldMacro<ArrayPropertyMacro>(Property))
    {
        StringBuffer << "TArray<";
        bool Result = GenTypeDecl(StringBuffer, ArrayProperty->Inner, AddToGen, false, TreatAsRawFunction);
        if (!Result) return false;
        StringBuffer << ">";
        return true;
    }
    else if (auto SetProperty = CastFieldMacro<SetPropertyMacro>(Property))
    {
        StringBuffer << "TSet<";
        bool Result = GenTypeDecl(StringBuffer, SetProperty->ElementProp, AddToGen, false, TreatAsRawFunction);
        if (!Result) return false;
        StringBuffer << ">";
        return true;
    }
    else if (auto MapProperty = CastFieldMacro<MapPropertyMacro>(Property))
    {
        StringBuffer << "TMap<";
        bool Result = GenTypeDecl(StringBuffer, MapProperty->KeyProp, AddToGen, false, TreatAsRawFunction);
        if (!Result) return false;
        StringBuffer << ", ";
        Result = GenTypeDecl(StringBuffer, MapProperty->ValueProp, AddToGen, false, TreatAsRawFunction);
        if (!Result) return false;
        StringBuffer << ">";
        return true;
    }
    else if (auto ObjectProperty = CastFieldMacro<ObjectPropertyMacro>(Property))
    {
        AddToGen.Add(ObjectProperty->PropertyClass);
        StringBuffer << SafeName(ObjectProperty->PropertyClass->GetName());
    }
    else if (auto DelegateProperty = CastFieldMacro<DelegatePropertyMacro>(Property))
    {
        if (!TreatAsRawFunction) StringBuffer << "$Delegate<";
        bool Result = GenFunction(StringBuffer, DelegateProperty->SignatureFunction, false);
        if (!Result) return false;
        if (!TreatAsRawFunction) StringBuffer << ">";
        return true;
    }
    else if (auto MulticastDelegateProperty = CastFieldMacro<MulticastDelegatePropertyMacro>(Property))
    {
        if (!TreatAsRawFunction) StringBuffer << "$MulticastDelegate<";
        bool Result = GenFunction(StringBuffer, MulticastDelegateProperty->SignatureFunction, false);
        if (!Result) return false;
        if (!TreatAsRawFunction) StringBuffer << ">";
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
        StringBuffer << "TWeakObjectPtr<" << SafeName(WeakObjectProperty->PropertyClass->GetName()) << ">";
    }
    else if (auto SoftObjectProperty = CastFieldMacro<SoftObjectPropertyMacro>(Property))
    {
        AddToGen.Add(SoftObjectProperty->PropertyClass);
        StringBuffer <<"TSoftObjectPtr<" << SafeName(SoftObjectProperty->PropertyClass->GetName()) << ">";
    }
    else if (auto LazyObjectProperty = CastFieldMacro<LazyObjectPropertyMacro>(Property))
    {
        AddToGen.Add(LazyObjectProperty->PropertyClass);
        StringBuffer << "TLazyObjectPtr<" << SafeName(LazyObjectProperty->PropertyClass->GetName()) << ">";
    }
    else
    {
        return false;
    }
    return true;
}

// #lizard forgives
bool FTypeScriptDeclarationGenerator::GenFunction(FStringBuffer& OwnerBuffer,UFunction* Function, bool WithName, bool ForceOneway, bool IgnoreOut, bool IsExtensionMethod)
{
    //FStringBuffer LocalBuffer;
    if (WithName)
    {
        if (!IsExtensionMethod && (Function->FunctionFlags & FUNC_Static))
        {
            OwnerBuffer << "static ";
        }
        
        OwnerBuffer << SafeName(Function->GetName());
    }
    OwnerBuffer << "(";
    PropertyMacro *ReturnValue = nullptr;
    TArray<UObject *> RefTypes;
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
                if (ForceOneway) return false;
                ReturnValue = Property;
            }
            else
            {
                FStringBuffer TmpBuf;
                TmpBuf << SafeName(Property->GetName()) << ": ";
                if (!IgnoreOut && Property->PropertyFlags & CPF_OutParm && (!(Property->PropertyFlags & CPF_ConstParm)))
                {
                    if (ForceOneway) return false;
                    TmpBuf << "$Ref<";
                }
                if (!GenTypeDecl(TmpBuf, Property, RefTypes))
                {
                    return false;
                }
                if (!IgnoreOut && Property->PropertyFlags & CPF_OutParm && (!(Property->PropertyFlags & CPF_ConstParm)))
                {
                    TmpBuf << ">";
                }
                ParamDecls.Add(TmpBuf.Buffer);
            }
        }
    }
    OwnerBuffer << FString::Join(ParamDecls, TEXT(", "));
    OwnerBuffer << ")" << (WithName ? ": " : " => ");
    if (!GenTypeDecl(OwnerBuffer, ReturnValue, RefTypes))
    {
        return false;
    }
    
    for (auto Type : RefTypes)
    {
        Gen(Type);
    }
    
    //OwnerBuffer << "    " << LocalBuffer.Buffer << ";\n";
    return true;
}

void FTypeScriptDeclarationGenerator::GenClass(UClass* Class)
{
    if (Class->ImplementsInterface(UTypeScriptObject::StaticClass())) return;
    FStringBuffer StringBuffer {"", ""};
    StringBuffer << "class " << SafeName(Class->GetName());
    
    auto Super = Class->GetSuperStruct();
    
    if (Super)
    {
        Gen(Super);
        StringBuffer << " extends " << SafeName(Super->GetName());
    }
    
    StringBuffer << " {\n";

    StringBuffer << "    constructor(Outer?: Object, Name?: string, ObjectFlags?: number);\n";

    for (TFieldIterator<PropertyMacro> PropertyIt(Class, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        auto Property = *PropertyIt;

        FStringBuffer TmpBuff;
        TmpBuff << SafeName(Property->GetName()) << ": ";
        TArray<UObject *> RefTypesTmp;
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
    
    for (TFieldIterator<UFunction> FunctionIt(Class, EFieldIteratorFlags::ExcludeSuper); FunctionIt; ++FunctionIt)
    {
        FStringBuffer TmpBuff;
        if (!GenFunction(TmpBuff, *FunctionIt))
        {
            continue;
        }
        StringBuffer << "    " << TmpBuff.Buffer << ";\n";
    }

    auto ExtensionMethodsIter = ExtensionMethodsMap.find(Class);
    if (ExtensionMethodsIter != ExtensionMethodsMap.end())
    {
        for (auto Iter = ExtensionMethodsIter->second.begin(); Iter != ExtensionMethodsIter->second.end(); ++Iter)
        {
            UFunction* Function = *Iter;

            FStringBuffer TmpBuff;
            if (!GenFunction(TmpBuff, Function, true, false, false, true))
            {
                continue;
            }
            StringBuffer << "    " << TmpBuff.Buffer << ";\n";
        }
    }
    
    StringBuffer << "    static StaticClass(): Class;\n";
    StringBuffer << "    static Find(OrigInName: string, Outer?: Object): " << SafeName(Class->GetName()) << ";\n";
    StringBuffer << "    static Load(InName: string): " << SafeName(Class->GetName()) << ";\n";
    
    StringBuffer << "}\n\n";
    
    Output << StringBuffer;
}

void FTypeScriptDeclarationGenerator::GenEnum(UEnum *Enum)
{
    FStringBuffer StringBuffer {"", ""};

    TArray<FString> EnumListerrals;
    for (int i = 0; i < Enum->NumEnums(); ++i)
    {
        auto Name = Enum->GetNameStringByIndex(i);
       // auto Value = Enum->GetValueByIndex(i);
        EnumListerrals.Add(Name);
    }
    
    StringBuffer << "enum " << SafeName(Enum->GetName()) << " { " << FString::Join(EnumListerrals, TEXT(", ")) << "}\n";
    
    Output << StringBuffer;
}

void FTypeScriptDeclarationGenerator::GenStruct(UStruct *Struct)
{
#include "ExcludeStructs.h"
    FStringBuffer StringBuffer {"", ""};
    StringBuffer << "class " << SafeName(Struct->GetName());
    
    auto Super = Struct->GetSuperStruct();
    
    if (Super)
    {
        Gen(Super);
        StringBuffer << " extends " << SafeName(Super->GetName());
    }
    
    StringBuffer << " {\n";

    auto GenConstrutor = [&]()
    {
        FStringBuffer TmpBuff;
        TmpBuff << "constructor(";
        bool First = true;
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
            TmpBuff << SafeName(Property->GetName()) << ": ";
            TArray<UObject *> RefTypesTmp;
            if (!GenTypeDecl(TmpBuff, Property, RefTypesTmp))
            {
                return;
            }
        }
        TmpBuff << ")";
        StringBuffer << "    " << TmpBuff.Buffer << ";\n";
    };
    GenConstrutor();
    
    for (TFieldIterator<PropertyMacro> PropertyIt(Struct, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        auto Property = *PropertyIt;
        FStringBuffer TmpBuff;
        FString SN = SafeName(Property->GetName());
        TmpBuff << (Struct->IsA<UUserDefinedStruct>() ? DisplayNameOfUserDefinedStructField(SN) : SN) << ": ";
        TArray<UObject *> RefTypesTmp;
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

    auto ExtensionMethodsIter = ExtensionMethodsMap.find(Struct);
    if (ExtensionMethodsIter != ExtensionMethodsMap.end())
    {
        for (auto Iter = ExtensionMethodsIter->second.begin(); Iter != ExtensionMethodsIter->second.end(); ++Iter)
        {
            UFunction* Function = *Iter;

            FStringBuffer TmpBuff;
            if (!GenFunction(TmpBuff, Function, true, false, false, true))
            {
                continue;
            }
            StringBuffer << "    " << TmpBuff.Buffer << ";\n";
        }
    }

    StringBuffer << "    static StaticClass(): Class;\n";
    
    StringBuffer << "}\n\n";
    
    Output << StringBuffer;
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

//--- FSlotDeclarationGenerator begin ---
void FReactDeclarationGenerator::Begin(FString Namespace) { } //do nothing

void FReactDeclarationGenerator::End() { } //do nothing

void FReactDeclarationGenerator::GenReactDeclaration()
{
    FString Components = TEXT("exports.lazyloadComponents = {};\n");
    Output << "import * as React from 'react';\nimport {TArray}  from 'ue';\n\n";
    
    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        if (Class->IsChildOf<UPanelSlot>()) Gen(Class);
    }

    Output << "export interface Props {\n";
    Output << "    Slot ? : PanelSlot;\n";
    Output << "}\n\n";

    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        if (Class->IsChildOf<UWidget>()) 
        {
            Gen(Class);
            Components += "exports." + SafeName(Class->GetName()) + " = '" + SafeName(Class->GetName()) + "';\n";
            if (!(Class->ClassFlags & CLASS_Native))
            {
                Components += "exports.lazyloadComponents." + SafeName(Class->GetName()) + " = '" + Class->GetPathName() + "';\n";
            }
        }
    }

    Output << R"(
interface Root {
    removeFromViewport() : void;
    getWidget(): any;
}

interface TReactUMG {
    render(element: React.ReactElement) : Root;
    init(world: any) : void;
}

export var ReactUMG : TReactUMG;
)";

    FFileHelper::SaveStringToFile(ToString(), *(FPaths::ProjectContentDir() / TEXT("ReactTyping/react-umg/index.d.ts")));
    FFileHelper::SaveStringToFile(Components, *(FPaths::ProjectContentDir() / TEXT("JavaScript/react-umg/components.js")));
}

static bool IsReactSupportProperty(PropertyMacro *Property) 
{
    if (CastFieldMacro<ObjectPropertyMacro>(Property)
        || CastFieldMacro<ClassPropertyMacro>(Property)
        || CastFieldMacro<WeakObjectPropertyMacro>(Property)
        || CastFieldMacro<SoftObjectPropertyMacro>(Property)
        || CastFieldMacro<LazyObjectPropertyMacro>(Property)) return false;
    if (auto ArrayProperty = CastFieldMacro<ArrayPropertyMacro>(Property))
    {
        return IsReactSupportProperty(ArrayProperty->Inner);
    }
    else if (auto DelegateProperty = CastFieldMacro<DelegatePropertyMacro>(Property))
    {
        return !HasObjectParam(DelegateProperty->SignatureFunction);
    }
    else if (auto MulticastDelegateProperty = CastFieldMacro<MulticastDelegatePropertyMacro>(Property))
    {
        return !HasObjectParam(MulticastDelegateProperty->SignatureFunction);
    }
    return true;
}

void FReactDeclarationGenerator::GenClass(UClass* Class)
{
    if (Class->ImplementsInterface(UTypeScriptObject::StaticClass())) return;
    if (!Class->IsChildOf<UPanelSlot>() && !Class->IsChildOf<UWidget>()) return;
    bool IsWidget = Class->IsChildOf<UWidget>();
    FStringBuffer StringBuffer{ "", "" };
    StringBuffer << "export interface " << SafeName(Class->GetName());
    if (IsWidget) StringBuffer << "Props";

    auto Super = Class->GetSuperStruct();

    if (Super && (Super->IsChildOf<UPanelSlot>() || Super->IsChildOf<UWidget>()))
    {
        Gen(Super);
        StringBuffer << " extends " << SafeName(Super->GetName());
        if (Super->IsChildOf<UWidget>()) StringBuffer << "Props";
    }
    else if (IsWidget) {
        StringBuffer << " extends Props";
    }

    StringBuffer << " {\n";

    for (TFieldIterator<PropertyMacro> PropertyIt(Class, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        auto Property = *PropertyIt;
        if (!IsReactSupportProperty(Property)) continue;
        FStringBuffer TmpBuff;
        TmpBuff << SafeName(Property->GetName()) << "?: ";
        TArray<UObject *> RefTypesTmp;
        if (!IsWidget && IsDelegate(Property))//UPanelSlot skip delegate
        {
            continue;
        }
        if (!GenTypeDecl(TmpBuff, Property, RefTypesTmp, false, true))
        {
            continue;
        }
        for (auto Type : RefTypesTmp)
        {
            Gen(Type);
        }
        StringBuffer << "    " << TmpBuff.Buffer << ";\n";
    }

    StringBuffer << "}\n\n";

    if (IsWidget) {
        StringBuffer << "export class " << SafeName(Class->GetName()) << " extends React.Component<" << SafeName(Class->GetName()) << "Props> {}\n\n";
    }

    Output << StringBuffer;
}

void FReactDeclarationGenerator::GenStruct(UStruct *Struct)
{
    FStringBuffer StringBuffer{ "", "" };
    StringBuffer << "export interface " << SafeName(Struct->GetName());

    auto Super = Struct->GetSuperStruct();

    if (Super)
    {
        Gen(Super);
        StringBuffer << " extends " << SafeName(Super->GetName());
    }

    StringBuffer << " {\n";

    for (TFieldIterator<PropertyMacro> PropertyIt(Struct, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        auto Property = *PropertyIt;
        if (Property->IsA<DelegatePropertyMacro>() || Property->IsA<MulticastDelegatePropertyMacro>()) continue;
        if (!IsReactSupportProperty(Property)) continue;
        FStringBuffer TmpBuff;
        TmpBuff << SafeName(Property->GetName()) << "?: ";
        TArray<UObject *> RefTypesTmp;
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

    StringBuffer << "}\n\n";

    Output << StringBuffer;
}

void FReactDeclarationGenerator::GenEnum(UEnum *Enum)
{
    FStringBuffer StringBuffer{ "", "" };

    TArray<FString> EnumListerrals;
    for (int i = 0; i < Enum->NumEnums(); ++i)
    {
        auto Name = Enum->GetNameStringByIndex(i);
        if (INDEX_NONE == EnumListerrals.Find(Name))
        {
            EnumListerrals.Add(Name);
        }
    }

    StringBuffer << "export type " << SafeName(Enum->GetName()) << " = ";
    TArray<FString> Arr1;
    TArray<FString> Arr2;
    for (auto Name : EnumListerrals)
    {
        Arr1.Add(TEXT("\"") + Name + TEXT("\""));
        Arr2.Add(Name + TEXT(": \"") + Name + TEXT("\""));
    }

    StringBuffer << FString::Join(Arr1, TEXT(" | ")) << ";\n";
    StringBuffer << "export const " << SafeName(Enum->GetName()) << ": {" << FString::Join(Arr2, TEXT(" ,")) << "};\n";

    Output << StringBuffer;
}

//--- FSlotDeclarationGenerator end ---
class FToolBarBuilder;

#define LOCTEXT_NAMESPACE "FGenDTSModule"

class FDeclarationGenerator : public IDeclarationGenerator
{
private:
    TSharedPtr<class FUICommandList> PluginCommands;

    void AddToolbarExtension(FToolBarBuilder& Builder)
    {
        Builder.AddToolBarButton(FGenDTSCommands::Get().PluginAction);
    }

    void GenUeDts()
    {
        LoadAllWidgetBlueprint();
        GenTypeScriptDeclaration();
        GenReactDeclaration();
        FText DialogText = FText::Format(
            LOCTEXT("PluginButtonDialogText", "genertate finish, {0} store in {1}"),
            FText::FromString(TEXT("ue.d.ts")),
            FText::FromString(TEXT("Content/Typing/ue"))
        );
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
        //IModularFeatures::Get().RegisterModularFeature(TEXT("ScriptGenerator"), this);
        FGenDTSStyle::Initialize();
        FGenDTSStyle::ReloadTextures();

        FGenDTSCommands::Register();

        PluginCommands = MakeShareable(new FUICommandList);

        PluginCommands->MapAction(
            FGenDTSCommands::Get().PluginAction,
            FExecuteAction::CreateRaw(this, &FDeclarationGenerator::GenUeDts),
            FCanExecuteAction());

        FLevelEditorModule& LevelEditorModule = FModuleManager::LoadModuleChecked<FLevelEditorModule>("LevelEditor");

        {
            TSharedPtr<FExtender> ToolbarExtender = MakeShareable(new FExtender);
            ToolbarExtender->AddToolBarExtension("Settings", EExtensionHook::After, PluginCommands, FToolBarExtensionDelegate::CreateRaw(this, &FDeclarationGenerator::AddToolbarExtension));

            LevelEditorModule.GetToolBarExtensibilityManager()->AddExtender(ToolbarExtender);
        }
    }

    void ShutdownModule() override 
    {
        //IModularFeatures::Get().UnregisterModularFeature(TEXT("ScriptGenerator"), this);
        FGenDTSStyle::Shutdown();
        FGenDTSCommands::Unregister();
    }

    void LoadAllWidgetBlueprint() override
    {
#if WITH_EDITOR
        FAssetRegistryModule& AssetRegistryModule = FModuleManager::LoadModuleChecked< FAssetRegistryModule >(FName("AssetRegistry"));
        IAssetRegistry& AssetRegistry = AssetRegistryModule.Get();
        TArray< FString > ContentPaths;
        ContentPaths.Add(TEXT("/Game"));
        AssetRegistry.ScanPathsSynchronous(ContentPaths);

        TArray< FAssetData > AssetList;
        AssetRegistry.GetAssetsByClass(FName("Blueprint"), AssetList);

        for (auto const& Asset : AssetList)
        {
            if (Asset.ObjectPath.ToString().StartsWith("/Game/"))
            {
                Asset.GetAsset();
            }
        }

        TArray< FAssetData > AssetList1;
        AssetRegistry.GetAssetsByClass(FName("WidgetBlueprint"), AssetList1);

        for (auto const& Asset : AssetList1)
        {
            if (Asset.ObjectPath.ToString().StartsWith("/Game/"))
            {
                Asset.GetAsset();
            }
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
        FReactDeclarationGenerator ReactDeclarationGenerator;
        ReactDeclarationGenerator.GenReactDeclaration();
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
    
    virtual bool ShouldExportClassesForModule(const FString& ModuleName, EBuildModuleType::Type ModuleType, const FString& ModuleGeneratedIncludeDirectory) const override
    {
        return ModuleName != TEXT("JsEnv");
    }
    
    virtual void Initialize(const FString& RootLocalPath, const FString& RootBuildPath, const FString& OutputDirectory, const FString& IncludeBase) override
    {
        TypeScriptDeclarationGenerator.Begin();
    }
    
    virtual void ExportClass(class UClass* Class, const FString& SourceHeaderFilename, const FString& GeneratedHeaderFilename, bool bHasChanged) override
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

IMPLEMENT_MODULE( FDeclarationGenerator, DeclarationGenerator )
