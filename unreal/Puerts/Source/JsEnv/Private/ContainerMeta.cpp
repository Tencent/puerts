// Fill out your copyright notice in the Description page of Project Settings.

#include "ContainerMeta.h"
#include "UObject/Package.h"

namespace puerts
{
FContainerMeta::FContainerMeta()
{
    ::memset(&BuiltinProperty, 0, sizeof(BuiltinProperty));

    PropertyMetaRoot = FindObject<UScriptStruct>(ANY_PACKAGE, TEXT("PropertyMetaRoot"));
}

FContainerMeta::~FContainerMeta()
{
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
    // for (auto KV : ObjectPropertyMap)
    //{
    //    delete KV.Value;
    //}
#else
    for (int i = 0; i < MaxBuiltinType; i++)
    {
        if (BuiltinProperty[i])
        {
            // UE_LOG(LogTemp, Warning, TEXT("BuiltinProperty RemoveFromRoot %s"), *BuiltinProperty[i]->GetName());
            BuiltinProperty[i]->RemoveFromRoot();
        }
    }
    for (auto KV : ObjectPropertyMap)
    {
        // UE_LOG(LogTemp, Warning, TEXT("BuiltinProperty RemoveFromRoot %s"), *KV.Value->GetName());
        KV.Value->RemoveFromRoot();
    }
#endif
}

PropertyMacro* FContainerMeta::GetBuiltinProperty(BuiltinType type)
{
    PropertyMacro* Ret = nullptr;

    if (type < MaxBuiltinType)
    {
        if (BuiltinProperty[type])
        {
            return BuiltinProperty[type];
        }

        switch (type)
        {
#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
            case puerts::TBool:
                Ret = new (EC_InternalUseOnlyConstructor, PropertyMetaRoot, NAME_None, RF_Transient)
                    UBoolProperty(FObjectInitializer(), EC_CppProperty, 0, (EPropertyFlags) 0, 0xFF, 1, true);
                break;
            case puerts::TByte:
                Ret = new (EC_InternalUseOnlyConstructor, PropertyMetaRoot, NAME_None, RF_Transient)
                    UByteProperty(FObjectInitializer(), EC_CppProperty, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TInt:
                Ret = new (EC_InternalUseOnlyConstructor, PropertyMetaRoot, NAME_None, RF_Transient)
                    UIntProperty(FObjectInitializer(), EC_CppProperty, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TFloat:
                Ret = new (EC_InternalUseOnlyConstructor, PropertyMetaRoot, NAME_None, RF_Transient)
                    UFloatProperty(FObjectInitializer(), EC_CppProperty, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TInt64:
                Ret = new (EC_InternalUseOnlyConstructor, PropertyMetaRoot, NAME_None, RF_Transient)
                    UInt64Property(FObjectInitializer(), EC_CppProperty, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TString:
                Ret = new (EC_InternalUseOnlyConstructor, PropertyMetaRoot, NAME_None, RF_Transient)
                    UStrProperty(FObjectInitializer(), EC_CppProperty, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TText:
                Ret = new (EC_InternalUseOnlyConstructor, PropertyMetaRoot, NAME_None, RF_Transient)
                    UNameProperty(FObjectInitializer(), EC_CppProperty, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TName:
                Ret = new (EC_InternalUseOnlyConstructor, PropertyMetaRoot, NAME_None, RF_Transient)
                    UTextProperty(FObjectInitializer(), EC_CppProperty, 0, CPF_HasGetValueTypeHash);
                break;
#else
            case puerts::TBool:
                Ret = new FBoolProperty(PropertyMetaRoot, NAME_None, RF_Transient, 0, (EPropertyFlags) 0, 0xFF, 1, true);
                break;
            case puerts::TByte:
                Ret = new FByteProperty(PropertyMetaRoot, NAME_None, RF_Transient, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TInt:
                Ret = new FIntProperty(PropertyMetaRoot, NAME_None, RF_Transient, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TFloat:
                Ret = new FFloatProperty(PropertyMetaRoot, NAME_None, RF_Transient, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TInt64:
                Ret = new FInt64Property(PropertyMetaRoot, NAME_None, RF_Transient, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TString:
                Ret = new FStrProperty(PropertyMetaRoot, NAME_None, RF_Transient, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TText:
                Ret = new FTextProperty(PropertyMetaRoot, NAME_None, RF_Transient, 0, CPF_HasGetValueTypeHash);
                break;
            case puerts::TName:
                Ret = new FNameProperty(PropertyMetaRoot, NAME_None, RF_Transient, 0, CPF_HasGetValueTypeHash);
                break;
#endif
            case puerts::MaxBuiltinType:
                break;
            default:
                break;
        }
        if (Ret)
        {
#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
            Ret->AddToRoot();
#endif
            BuiltinProperty[type] = Ret;
        }
    }

    return Ret;
}

PropertyMacro* FContainerMeta::GetObjectProperty(UField* Field)
{
    auto Iter = ObjectPropertyMap.Find(Field);
    if (Iter)
    {
        return *Iter;
    }

    PropertyMacro* Ret = nullptr;

    if (auto Class = Cast<UClass>(Field))
    {
#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
        Ret = new (EC_InternalUseOnlyConstructor, PropertyMetaRoot, NAME_None, RF_Transient)
            UObjectProperty(FObjectInitializer(), EC_CppProperty, 0, CPF_HasGetValueTypeHash, Class);
#else
        Ret = new FObjectProperty(PropertyMetaRoot, NAME_None, RF_Transient, 0, CPF_HasGetValueTypeHash, Class);
#endif
    }
    else if (auto ScriptStruct = Cast<UScriptStruct>(Field))
    {
#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
        Ret = new (EC_InternalUseOnlyConstructor, PropertyMetaRoot, NAME_None, RF_Transient)
            UStructProperty(FObjectInitializer(), EC_CppProperty, 0, CPF_HasGetValueTypeHash, ScriptStruct);
#else
        Ret = new FStructProperty(PropertyMetaRoot, NAME_None, RF_Transient, 0, CPF_HasGetValueTypeHash, ScriptStruct);
#endif
    }
    else if (auto Enum = Cast<UEnum>(Field))
    {
#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
        UEnumProperty* EnumProp = new (EC_InternalUseOnlyConstructor, ScriptStruct, NAME_None, RF_Transient)
            UEnumProperty(FObjectInitializer(), EC_CppProperty, 0, CPF_HasGetValueTypeHash, Enum);
        UNumericProperty* UnderlyingProp = NewObject<UByteProperty>(EnumProp, TEXT("UnderlyingType"));
        EnumProp->AddCppProperty(UnderlyingProp);
        Ret = EnumProp;
#else
        if (Enum->GetCppForm() == UEnum::ECppForm::EnumClass)
        {
            FEnumProperty* EnumProp =
                new FEnumProperty(PropertyMetaRoot, NAME_None, RF_Transient, 0, CPF_HasGetValueTypeHash, Enum);
            FNumericProperty* UnderlyingProp = new FByteProperty(EnumProp, TEXT("UnderlyingType"), RF_Transient);
            EnumProp->AddCppProperty(UnderlyingProp);
            EnumProp->ElementSize = UnderlyingProp->ElementSize;
            EnumProp->PropertyFlags |= CPF_IsPlainOldData | CPF_NoDestructor | CPF_ZeroConstructor;

            Ret = EnumProp;
        }
        else
        {
            FByteProperty* ByteProp = new FByteProperty(PropertyMetaRoot, NAME_None, RF_Transient);
            ByteProp->Enum = Enum;

            Ret = ByteProp;
        }

        Ret->SetPropertyFlags(CPF_HasGetValueTypeHash);
#endif
    }
    else
    {
        return nullptr;
    }

#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
    Ret->AddToRoot();
#endif

    ObjectPropertyMap.Add(Field, Ret);
    return Ret;
}

void FContainerMeta::NotifyElementTypeDeleted(const UField* Field)
{
    auto Iter = ObjectPropertyMap.Find(Field);
    if (Iter)
    {
#if ENGINE_MINOR_VERSION < 25 && ENGINE_MAJOR_VERSION < 5
        (const_cast<UField*>(Field))->RemoveFromRoot();
#else
        // delete *Iter;
#endif
        ObjectPropertyMap.Remove(Field);
    }
}

}    // namespace puerts
