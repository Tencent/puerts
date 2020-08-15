/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#include "ObjectRetainer.h"

namespace puerts
{
    void FObjectRetainer::Retain(UObject* Object)
    {
        if (!RetainedObjects.Contains(Object))
        {
            RetainedObjects.Add(Object);
        }
    }

    void FObjectRetainer::Release(UObject* Object)
    {
        if (RetainedObjects.Contains(Object))
        {
            RetainedObjects.Remove(Object);
        }
    }

    void FObjectRetainer::Clear()
    {
        RetainedObjects.Empty();
    }

    void FObjectRetainer::AddReferencedObjects(FReferenceCollector& Collector)
    {
        Collector.AddReferencedObjects(RetainedObjects);
    }

    FObjectRetainer::~FObjectRetainer()
    {
        Clear();
    }
}