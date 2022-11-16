/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#pragma warning(push, 0)
#include "v8.h"
#pragma warning(pop)

namespace puerts
{
class FObjectCacheNode
{
public:
    V8_INLINE FObjectCacheNode(const void* TypeId_) : TypeId(TypeId_), Next(nullptr)
    {
    }

    V8_INLINE FObjectCacheNode(const void* TypeId_, FObjectCacheNode* Next_) : TypeId(TypeId_), Next(Next_)
    {
    }

    V8_INLINE FObjectCacheNode(FObjectCacheNode&& other) noexcept
        : TypeId(other.TypeId), Next(other.Next), Value(std::move(other.Value))
    {
        other.TypeId = nullptr;
        other.Next = nullptr;
    }

    V8_INLINE FObjectCacheNode& operator=(FObjectCacheNode&& rhs) noexcept
    {
        TypeId = rhs.TypeId;
        Next = rhs.Next;
        Value = std::move(rhs.Value);
        rhs.TypeId = nullptr;
        rhs.Next = nullptr;
        return *this;
    }

    V8_INLINE ~FObjectCacheNode()
    {
        if (Next)
            delete Next;
    }

    V8_INLINE FObjectCacheNode* Find(const void* TypeId_)
    {
        if (TypeId_ == TypeId)
        {
            return this;
        }
        if (Next)
        {
            return Next->Find(TypeId_);
        }
        return nullptr;
    }

    V8_INLINE FObjectCacheNode* Remove(const void* TypeId_, bool IsHead)
    {
        if (TypeId_ == TypeId)
        {
            if (IsHead)
            {
                if (Next)
                {
                    auto PreNext = Next;
                    *this = std::move(*Next);
                    delete PreNext;
                }
                else
                {
                    TypeId = nullptr;
                    Next = nullptr;
                    Value.Reset();
                }
            }
            return this;
        }
        if (Next)
        {
            auto Removed = Next->Remove(TypeId_, false);
            if (Removed && Removed == Next)    // detach & delete by prev node
            {
                Next = Removed->Next;
                Removed->Next = nullptr;
                delete Removed;
            }
            return Removed;
        }
        return nullptr;
    }

    V8_INLINE FObjectCacheNode* Add(const void* TypeId_)
    {
        Next = new FObjectCacheNode(TypeId_, Next);
        return Next;
    }

    const void* TypeId;

    FObjectCacheNode* Next;

    v8::UniquePersistent<v8::Value> Value;

    FObjectCacheNode(const FObjectCacheNode&) = delete;
    void operator=(const FObjectCacheNode&) = delete;
};

}    // namespace puerts
