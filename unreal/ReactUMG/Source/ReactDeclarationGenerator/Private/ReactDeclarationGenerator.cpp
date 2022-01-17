// Fill out your copyright notice in the Description page of Project Settings.

#include "ReactDeclarationGenerator.h"
#include "TypeScriptDeclarationGenerator.h"
#include "Misc/Paths.h"
#include "CoreUObject.h"
#include "TypeScriptDeclarationGenerator.h"
#include "Components/PanelSlot.h"
#include "Components/Widget.h"
#include "Interfaces/IPluginManager.h"

static FString SafeName(const FString& Name)
{
    auto Ret = Name.Replace(TEXT(" "), TEXT(""))
                   .Replace(TEXT("-"), TEXT("_"))
                   .Replace(TEXT("/"), TEXT("_"))
                   .Replace(TEXT("("), TEXT("_"))
                   .Replace(TEXT(")"), TEXT("_"))
                   .Replace(TEXT("?"), TEXT("$"))
                   .Replace(TEXT(","), TEXT("_"));
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

static bool IsDelegate(PropertyMacro* InProperty)
{
    return InProperty->IsA<DelegatePropertyMacro>() || InProperty->IsA<MulticastDelegatePropertyMacro>()
#if ENGINE_MINOR_VERSION >= 23
           || InProperty->IsA<MulticastInlineDelegatePropertyMacro>() || InProperty->IsA<MulticastSparseDelegatePropertyMacro>()
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

    void GenStruct(UStruct* Struct) override;

    void GenEnum(UEnum* Enum) override;

    void End() override;

    virtual ~FReactDeclarationGenerator()
    {
    }
};

//--- FSlotDeclarationGenerator begin ---
void FReactDeclarationGenerator::Begin(FString Namespace)
{
}    // do nothing

void FReactDeclarationGenerator::End()
{
}    // do nothing

void FReactDeclarationGenerator::GenReactDeclaration()
{
    RefFromOuter = true;
    FString Components = TEXT("exports.lazyloadComponents = {};\n");
    Output << "declare module \"react-umg\" {\n";
    Output << "    "
           << "import * as React from 'react';\n    import * as UE from 'ue';\n    type TArray<T> = UE.TArray<T>;\n    type "
              "TSet<T> = UE.TSet<T>;\n    type TMap<TKey, TValue> = UE.TMap<TKey, TValue>;\n\n";

    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        checkfSlow(Class != nullptr, TEXT("Class name corruption!"));
        if (Class->GetName().StartsWith("SKEL_") || Class->GetName().StartsWith("REINST_") ||
            Class->GetName().StartsWith("TRASHCLASS_") || Class->GetName().StartsWith("PLACEHOLDER_"))
        {
            continue;
        }
        if (Class->IsChildOf<UPanelSlot>())
            Gen(Class);
    }

    Output << "    "
           << "export interface Props {\n";
    Output << "    "
           << "    Slot ? : PanelSlot;\n";
    Output << "    "
           << "}\n\n";

    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        checkfSlow(Class != nullptr, TEXT("Class name corruption!"));
        if (Class->GetName().StartsWith("SKEL_") || Class->GetName().StartsWith("REINST_") ||
            Class->GetName().StartsWith("TRASHCLASS_") || Class->GetName().StartsWith("PLACEHOLDER_"))
        {
            continue;
        }
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

    var ReactUMG : TReactUMG;
}    
    )";

    FFileHelper::SaveStringToFile(ToString(),
        *(IPluginManager::Get().FindPlugin("ReactUMG")->GetBaseDir() / TEXT("Typing/react-umg/index.d.ts")),
        FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
    FFileHelper::SaveStringToFile(Components, *(FPaths::ProjectContentDir() / TEXT("JavaScript/react-umg/components.js")),
        FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM);
}

static bool IsReactSupportProperty(PropertyMacro* Property)
{
    if (CastFieldMacro<ObjectPropertyMacro>(Property) || CastFieldMacro<ClassPropertyMacro>(Property) ||
        CastFieldMacro<WeakObjectPropertyMacro>(Property) || CastFieldMacro<SoftObjectPropertyMacro>(Property) ||
        CastFieldMacro<LazyObjectPropertyMacro>(Property))
        return false;
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
    if (!Class->IsChildOf<UPanelSlot>() && !Class->IsChildOf<UWidget>())
        return;
    bool IsWidget = Class->IsChildOf<UWidget>();
    FStringBuffer StringBuffer{"", ""};
    StringBuffer << "    "
                 << "interface " << SafeName(Class->GetName());
    if (IsWidget)
        StringBuffer << "Props";

    auto Super = Class->GetSuperStruct();

    if (Super && (Super->IsChildOf<UPanelSlot>() || Super->IsChildOf<UWidget>()))
    {
        Gen(Super);
        StringBuffer << " extends " << SafeName(Super->GetName());
        if (Super->IsChildOf<UWidget>())
            StringBuffer << "Props";
    }
    else if (IsWidget)
    {
        StringBuffer << " extends Props";
    }

    StringBuffer << " {\n";

    for (TFieldIterator<PropertyMacro> PropertyIt(Class, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        auto Property = *PropertyIt;
        if (!IsReactSupportProperty(Property))
            continue;
        FStringBuffer TmpBuff;
        TmpBuff << "    " << SafeName(Property->GetName()) << "?: ";
        TArray<UObject*> RefTypesTmp;
        if (!IsWidget && IsDelegate(Property))    // UPanelSlot skip delegate
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

    StringBuffer << "    "
                 << "}\n\n";

    if (IsWidget)
    {
        StringBuffer << "    "
                     << "class " << SafeName(Class->GetName()) << " extends React.Component<" << SafeName(Class->GetName())
                     << "Props> {\n"
                     << "        nativePtr: UE." << GetNameWithNamespace(Class) << ";\n    }\n\n";
    }

    Output << StringBuffer;
}

void FReactDeclarationGenerator::GenStruct(UStruct* Struct)
{
    FStringBuffer StringBuffer{"", ""};
    StringBuffer << "    "
                 << "interface " << SafeName(Struct->GetName());

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
        if (Property->IsA<DelegatePropertyMacro>() || Property->IsA<MulticastDelegatePropertyMacro>())
            continue;
        if (!IsReactSupportProperty(Property))
            continue;
        FStringBuffer TmpBuff;
        TmpBuff << "    " << SafeName(Property->GetName()) << "?: ";
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

    StringBuffer << "    "
                 << "}\n\n";

    Output << StringBuffer;
}

void FReactDeclarationGenerator::GenEnum(UEnum* Enum)
{
    Output << "    "
           << "type " << SafeName(Enum->GetName()) << " = UE." << GetNameWithNamespace(Enum) << ";\n";
}

//--- FSlotDeclarationGenerator end ---

void UReactDeclarationGenerator::Gen_Implementation() const
{
    FReactDeclarationGenerator ReactDeclarationGenerator;
    ReactDeclarationGenerator.GenReactDeclaration();
}
