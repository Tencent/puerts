/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "UObject/GCObject.h"
#include "PuertsNamespaceDef.h"
#include "Runtime/Launch/Resources/Version.h"
#include <vector>

#ifdef THREAD_SAFE
#if defined(WITH_QJS_NAMESPACE_SUFFIX)
namespace v8_qjs
#else
namespace v8
#endif
{
class Isolate;
}
#endif

namespace PUERTS_NAMESPACE
{
class SCRIPTENV_API FObjectRetainer : public FGCObject
{
public:
    void Retain(UObject* Object);

    void Release(UObject* Object);

    void Clear();

    virtual void AddReferencedObjects(FReferenceCollector& Collector) override;

    virtual ~FObjectRetainer() override;

    FORCEINLINE void SetName(FString InName)
    {
        Name = InName;
    }

    virtual FString GetReferencerName() const override;

#ifdef THREAD_SAFE
    FCriticalSection RetainedObjectsCritical;
#endif

private:
#if ENGINE_MAJOR_VERSION >= 5
    TSet<TObjectPtr<UObject>> RetainedObjects;
#else
    TSet<UObject*> RetainedObjects;
#endif

    FString Name = TEXT("FObjectRetainer");
};

// The UObjects held by the script wrappers of an env. Add returns a handle (index + 1, never 0) that the wrapper keeps (the
// userdata returned by on_enter of pesapi trace_native_object_lifecycle, passed back to on_exit), so binding / unbinding a
// wrapper is O(1) and a UObject bound by several wrappers is held by each of them. A slot may hold null (reserved, filled
// later by Set), the gc may also null the slot of a UObject being destroyed, the slot stays until it is removed.
class SCRIPTENV_API FObjectPool : public FGCObject
{
public:
    int32 Add(UObject* Object);

    void Set(int32 Handle, UObject* Object);

    void Remove(int32 Handle);

    void Clear();

    int32 Num() const
    {
        return Objects.Num() - static_cast<int32>(FreeIndices.size());
    }

    virtual void AddReferencedObjects(FReferenceCollector& Collector) override;

    FORCEINLINE void SetName(FString InName)
    {
        Name = InName;
    }

    virtual FString GetReferencerName() const override;

private:
#if ENGINE_MAJOR_VERSION >= 5
    TArray<TObjectPtr<UObject>> Objects;
#else
    TArray<UObject*> Objects;
#endif

    std::vector<int32> FreeIndices;

    FString Name = TEXT("FObjectPool");
};
}    // namespace PUERTS_NAMESPACE