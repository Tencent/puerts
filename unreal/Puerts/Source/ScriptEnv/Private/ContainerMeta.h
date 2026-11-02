/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "PuertsNamespaceDef.h"
#include "CoreMinimal.h"
#include "Runtime/Launch/Resources/Version.h"
#include "PropertyMacros.h"
#include "UObject/UnrealType.h"
#include "UObject/TextProperty.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "EngineMinimal.h"
#endif

USTRUCT(noexport)
struct FPropertyMetaRoot
{
};

namespace PUERTS_NAMESPACE
{
enum BuiltinType
{
    TBool = 0,
    TByte = 1,
    TInt = 2,
    TFloat = 3,
    TDouble = 4,
    TInt64 = 5,
    TString = 6,
    TText = 7,
    TName = 8,
    MaxBuiltinType
};

// the element properties of the containers created by script (NewArray / NewSet / NewMap), process wide as the container
// classes (FContainerClass) are keyed by the properties: a property per element type, otherwise each env would add classes
class FContainerMeta
{
public:
    // never destroyed (the properties may be used by the containers until the process exits)
    static FContainerMeta& Get();

    FContainerMeta();
    ~FContainerMeta();

    PropertyMacro* GetBuiltinProperty(BuiltinType type);

    PropertyMacro* GetObjectProperty(UField* Field);

    void NotifyElementTypeDeleted(const UField* Struct);

private:
    UScriptStruct* PropertyMetaRoot;

    PropertyMacro* BuiltinProperty[MaxBuiltinType];

    struct FObjectPropertyInfo
    {
        // the type, a destroyed one (whose address may be reused) is detected even if no env is notified
        TWeakObjectPtr<UField> Field;
        PropertyMacro* Property;
    };

    TMap<UField*, FObjectPropertyInfo> ObjectPropertyMap;
};

}    // namespace PUERTS_NAMESPACE