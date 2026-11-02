/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "ObjectRetainer.h"
#include "PuertsNamespaceDef.h"

namespace PUERTS_NAMESPACE
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

int32 FObjectPool::Add(UObject* Object)
{
    int32 Index;
    if (!FreeIndices.empty())
    {
        Index = FreeIndices.back();
        FreeIndices.pop_back();
        Objects[Index] = Object;
    }
    else
    {
        Index = Objects.Add(Object);
    }
    return Index + 1;
}

void FObjectPool::Set(int32 Handle, UObject* Object)
{
    if (ensure(Handle > 0 && Handle <= Objects.Num()))
    {
        Objects[Handle - 1] = Object;
    }
}

void FObjectPool::Remove(int32 Handle)
{
    if (ensure(Handle > 0 && Handle <= Objects.Num()))
    {
        Objects[Handle - 1] = nullptr;
        FreeIndices.push_back(Handle - 1);
    }
}

void FObjectPool::Clear()
{
    Objects.Empty();
    FreeIndices.clear();
}

void FObjectPool::AddReferencedObjects(FReferenceCollector& Collector)
{
    // the free slots are null
    Collector.AddReferencedObjects(Objects);
}

FString FObjectPool::GetReferencerName() const
{
    return Name;
}
}    // namespace PUERTS_NAMESPACE