/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "UObject/GCObject.h"
#include "PuertsNamespaceDef.h"

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
class JSENV_API FObjectRetainer : public FGCObject
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
    TSet<UObject*> RetainedObjects;

    FString Name = TEXT("FObjectRetainer");
};
}    // namespace PUERTS_NAMESPACE