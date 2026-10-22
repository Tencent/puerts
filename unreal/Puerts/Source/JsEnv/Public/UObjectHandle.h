/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "UObject/WeakObjectPtr.h"
#include "NamespaceDef.h"

namespace PUERTS_NAMESPACE
{
// The native pointer stored in the js wrapper of a UObject (see doc/unreal/zhcn/papi_unification_design.md 5.6, option A).
//
// A handle is allocated by the js env when a UObject is bound and lives as long as the js wrapper object: when the UObject is
// destroyed the handle is detached (Object becomes nullptr) but not freed until the wrapper is garbage collected. So the address of
// a handle is never reused while its wrapper is alive, even if the memory of the destroyed UObject is reused by a new UObject.
//
// Always use DataTransfer::GetUObjectOfWrapper / FV8Utils::GetUObject to read the UObject of a wrapper.
struct FUObjectHandle
{
    static constexpr uint64 MagicValue = 0x454C444E41484F55ull;    // "UOHANDLE"

    // used to reject objects that are not UObject wrappers (structs, containers...) passed where a UObject is expected
    uint64 Magic = MagicValue;

    // raw pointer of the bound UObject, identity key in the env object map, nullptr after the UObject is destroyed
    UObject* Object = nullptr;

    FWeakObjectPtr WeakObject;

    UClass* Class = nullptr;

    FORCEINLINE static bool IsHandle(const void* Ptr)
    {
        return Ptr && static_cast<const FUObjectHandle*>(Ptr)->Magic == MagicValue;
    }

    // nullptr if the UObject is destroyed, garbage (pending kill) or unreachable
    FORCEINLINE UObject* Get() const
    {
        return Object ? WeakObject.Get() : nullptr;
    }

    // nullptr if the UObject is destroyed or unreachable
    FORCEINLINE UObject* GetEvenIfPendingKill() const
    {
        return Object ? WeakObject.Get(true) : nullptr;
    }
};
}    // namespace PUERTS_NAMESPACE
