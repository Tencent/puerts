/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "ObjectRetainer.h"
#ifdef THREAD_SAFE
#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)
#endif

namespace puerts
{
void FObjectRetainer::Retain(UObject* Object)
{
#ifdef THREAD_SAFE
    FScopeLock ScopeLock(&RetainedObjectsCritical);
#endif
    if (!RetainedObjects.Contains(Object))
    {
        RetainedObjects.Add(Object);
    }
}

void FObjectRetainer::Release(UObject* Object)
{
#ifdef THREAD_SAFE
    FScopeLock ScopeLock(&RetainedObjectsCritical);
#endif
    if (RetainedObjects.Contains(Object))
    {
        RetainedObjects.Remove(Object);
    }
}

void FObjectRetainer::Clear()
{
#ifdef THREAD_SAFE
    FScopeLock ScopeLock(&RetainedObjectsCritical);
#endif
    RetainedObjects.Empty();
}

void FObjectRetainer::AddReferencedObjects(FReferenceCollector& Collector)
{
#ifdef THREAD_SAFE
    FScopeLock ScopeLock(&RetainedObjectsCritical);
#endif
    Collector.AddReferencedObjects(RetainedObjects);
}

FString FObjectRetainer::GetReferencerName() const
{
    return Name;
}

FObjectRetainer::~FObjectRetainer()
{
    Clear();
}
}    // namespace puerts