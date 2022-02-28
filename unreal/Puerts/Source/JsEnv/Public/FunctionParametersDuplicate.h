/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "Engine/Blueprint.h"
#include "PropertyMacros.h"

static PropertyMacro* DuplicateProperty(
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
    FFieldVariant Outer,
#else
    UObject* Outer,
#endif
    PropertyMacro* Property, FName Name)
{
    auto SetupProperty = [&](PropertyMacro* NewProperty)
    {
        NewProperty->SetPropertyFlags(Property->GetPropertyFlags());
        return NewProperty;
    };

    PropertyMacro* NewProperty;
    EObjectFlags ObjectFlags = RF_NoFlags;

    if (auto StructProperty = CastFieldMacro<StructPropertyMacro>(Property))
    {
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
        auto Temp = new StructPropertyMacro(Outer, Name, ObjectFlags);
#else
        auto Temp = NewObject<StructPropertyMacro>(Outer, Name);
#endif
        Temp->Struct = StructProperty->Struct;
        NewProperty = Temp;
    }
    else if (auto ArrayProperty = CastFieldMacro<ArrayPropertyMacro>(Property))
    {
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
        auto Temp = new ArrayPropertyMacro(Outer, Name, ObjectFlags);
#else
        auto Temp = NewObject<ArrayPropertyMacro>(Outer, Name);
#endif
        Temp->Inner = DuplicateProperty(Temp, ArrayProperty->Inner, ArrayProperty->Inner->GetFName());
        NewProperty = Temp;
    }
    else if (auto ByteProperty = CastFieldMacro<BytePropertyMacro>(Property))
    {
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
        auto Temp = new BytePropertyMacro(Outer, Name, ObjectFlags);
#else
        auto Temp = NewObject<BytePropertyMacro>(Outer, Name);
#endif
        Temp->Enum = ByteProperty->Enum;
        NewProperty = Temp;
    }
    else if (CastFieldMacro<BoolPropertyMacro>(Property))
    {
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
        auto Temp = new BoolPropertyMacro(Outer, Name, ObjectFlags);
#else
        auto Temp = NewObject<BoolPropertyMacro>(Outer, Name);
#endif
        Temp->SetBoolSize(sizeof(bool), true);
        NewProperty = Temp;
    }
    else if (auto ClassProperty = CastFieldMacro<ClassPropertyMacro>(Property))
    {
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
        auto Temp = new ClassPropertyMacro(Outer, Name, ObjectFlags);
#else
        auto Temp = NewObject<ClassPropertyMacro>(Outer, Name);
#endif
        Temp->SetMetaClass(ClassProperty->MetaClass);
        Temp->PropertyClass = UClass::StaticClass();
        NewProperty = Temp;
    }
    else if (auto ObjectProperty = CastFieldMacro<ObjectPropertyMacro>(Property))
    {
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
        auto Temp = new ObjectPropertyMacro(Outer, Name, ObjectFlags);
#else
        auto Temp = NewObject<ObjectPropertyMacro>(Outer, Name);
#endif
        Temp->SetPropertyClass(ObjectProperty->PropertyClass);
        NewProperty = Temp;
    }
    else
    {
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
        NewProperty = CastField<PropertyMacro>(FField::Duplicate(Property, Outer, *(Name.ToString())));
#else
        NewProperty = static_cast<PropertyMacro*>(StaticDuplicateObject(Property, Outer, *(Name.ToString())));
#endif
    }

    NewProperty->SetPropertyFlags(Property->GetPropertyFlags());

    return NewProperty;
};

static void DuplicateParameters(UFunction* FromFunction, UFunction* Function)
{
#if ENGINE_MINOR_VERSION >= 25 || ENGINE_MAJOR_VERSION > 4
    FField** Storage = &Function->ChildProperties;
#else
    UField** Storage = &Function->Children;
#endif
    PropertyMacro** PropertyStorage = &Function->PropertyLink;

    for (TFieldIterator<PropertyMacro> PropIt(FromFunction, EFieldIteratorFlags::ExcludeSuper); PropIt; ++PropIt)
    {
        PropertyMacro* Property = *PropIt;
        if (Property->HasAnyPropertyFlags(CPF_Parm))
        {
            PropertyMacro* NewProperty = DuplicateProperty(Function, Property, Property->GetFName());

            *Storage = NewProperty;
            Storage = &NewProperty->Next;

            *PropertyStorage = NewProperty;
            PropertyStorage = &NewProperty->PropertyLinkNext;
        }
    }

    for (TFieldIterator<PropertyMacro> PropIt(Function, EFieldIteratorFlags::ExcludeSuper); PropIt; ++PropIt)
    {
        PropertyMacro* Property = *PropIt;
        if (Property->HasAnyPropertyFlags(CPF_Parm))
        {
            ++Function->NumParms;
            Function->ParmsSize = Property->GetOffset_ForUFunction() + Property->GetSize();

            if (Property->HasAnyPropertyFlags(CPF_OutParm))
            {
                Function->FunctionFlags |= FUNC_HasOutParms;
            }

            if (Property->HasAnyPropertyFlags(CPF_ReturnParm))
            {
                Function->ReturnValueOffset = Property->GetOffset_ForUFunction();

                if (!Property->HasAnyPropertyFlags(CPF_IsPlainOldData | CPF_NoDestructor))
                {
                    Property->DestructorLinkNext = Function->DestructorLink;
                    Function->DestructorLink = Property;
                }
            }
        }
        else
        {
            if (!Property->HasAnyPropertyFlags(CPF_ZeroConstructor))
            {
                Function->FirstPropertyToInit = Property;
                Function->FunctionFlags |= FUNC_HasDefaults;
                break;
            }
        }
    }
}
