/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "NamespaceDef.h"
#include "lua.hpp"
#include <memory>
namespace pesapi
{
namespace luaimpl
{
class FObjectCacheNode
{
public:
    inline FObjectCacheNode(const void* TypeId_, void* userdata) :TypeId(TypeId_), UserData(userdata), Next(nullptr), MustCallFinalize(false)
    {
    }

    inline FObjectCacheNode(const void* TypeId_, FObjectCacheNode* Next_)
        : TypeId(TypeId_), UserData(nullptr), Next(Next_), MustCallFinalize(false)
    {
    }

    inline FObjectCacheNode(FObjectCacheNode&& other) noexcept
        : TypeId(other.TypeId)
        , UserData(other.UserData)
        , Next(other.Next)
        , Value(other.Value)
        , MustCallFinalize(other.MustCallFinalize)
    {
        other.TypeId = nullptr;
        other.UserData = nullptr;
        other.Next = nullptr;
        other.MustCallFinalize = false;
    }

    inline FObjectCacheNode& operator=(FObjectCacheNode&& rhs) noexcept
    {
        TypeId = rhs.TypeId;
        Next = rhs.Next;
        Value = rhs.Value;
        UserData = rhs.UserData;
        MustCallFinalize = rhs.MustCallFinalize;
        rhs.UserData = nullptr;
        rhs.TypeId = nullptr;
        rhs.Next = nullptr;
        rhs.MustCallFinalize = false;
        return *this;
    }

    ~FObjectCacheNode()
    {
        if (Next)
        {
            Next->~FObjectCacheNode();
            free(Next);
            Next = nullptr;
        }
    }

    FObjectCacheNode* Find(const void* TypeId_)
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

    FObjectCacheNode* Remove(const void* TypeId_, bool IsHead)
    {
        if (TypeId_ == TypeId)
        {
            if (IsHead)
            {
                if (Next)
                {
                    auto PreNext = Next;
                    *this = std::move(*Next);
                    PreNext->~FObjectCacheNode();
                    free(PreNext);
                }
                else
                {
                    TypeId = nullptr;
                    Next = nullptr;
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
                Removed->~FObjectCacheNode();
                free(Removed);
            }
            return Removed;
        }
        return nullptr;
    }

    inline FObjectCacheNode* Add(const void* TypeId_)
    {
        FObjectCacheNode* newNode = static_cast<FObjectCacheNode*>(malloc(sizeof(FObjectCacheNode)));
        new (newNode) FObjectCacheNode(TypeId_, Next);
        Next = newNode;
        return Next;
    }

    const void* TypeId;

    void* UserData;

    FObjectCacheNode* Next;

    int Value;

    bool MustCallFinalize;

    FObjectCacheNode(const FObjectCacheNode&) = delete;
    void operator=(const FObjectCacheNode&) = delete;
};

}    // namespace qjsimpl
}    // namespace pesapi