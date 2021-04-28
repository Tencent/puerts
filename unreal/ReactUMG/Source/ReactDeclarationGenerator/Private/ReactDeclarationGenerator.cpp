// Fill out your copyright notice in the Description page of Project Settings.


#include "ReactDeclarationGenerator.h"
#include "TypeScriptDeclarationGenerator.h"
#include "Misc/Paths.h"
#include "CoreUObject.h"
#include "TypeScriptDeclarationGenerator.h"
#include "Components/PanelSlot.h"
#include "Components/Widget.h"
#include "Interfaces/IPluginManager.h"

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

static bool IsDelegate(PropertyMacro* InProperty)
{
    return InProperty->IsA<DelegatePropertyMacro>()
        || InProperty->IsA<MulticastDelegatePropertyMacro>()
#if ENGINE_MINOR_VERSION >= 23
        || InProperty->IsA<MulticastInlineDelegatePropertyMacro>()
        || InProperty->IsA<MulticastSparseDelegatePropertyMacro>()
#endif
        ;
}

static bool HasObjectParam(UFunction* InFunction)
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

struct FReactDeclarationGenerator : public FTypeScriptDeclarationGenerator
{
    void Begin(FString Namespace) override;

    void GenReactDeclaration();

    void GenClass(UClass* Class) override;

    void GenStruct(UStruct *Struct) override;

    void GenEnum(UEnum *Enum) override;

    void End() override;

    virtual ~FReactDeclarationGenerator() {}
};

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

    FFileHelper::SaveStringToFile(ToString(), *(IPluginManager::Get().FindPlugin("ReactUMG")->GetBaseDir() / TEXT("Typing/react-umg/index.d.ts")));
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


void UReactDeclarationGenerator::Gen_Implementation() const
{
    FReactDeclarationGenerator ReactDeclarationGenerator;
    ReactDeclarationGenerator.GenReactDeclaration();
}