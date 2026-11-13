/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "NamespaceDef.h"

namespace PUERTS_NAMESPACE
{
// an optional feature added to an env after it is created (FScriptEnvImpl::AddExtension), e.g. the mixin (ScriptEnvMixin.h).
// The env calls the hooks at the points of its lifetime, the extension is destroyed after the env is released
class IScriptEnvExtension
{
public:
    virtual ~IScriptEnvExtension()
    {
    }

    // the name to find the extension of an env (FScriptEnvImpl::FindExtension)
    virtual FName GetExtensionName() const = 0;

    // in a scope of the env, before the js runtime of the backend stops: releases the refs to the script values
    virtual void OnEnvExit()
    {
    }

    // after the env is released by the backend (no script runs any more), the isolate is still alive
    virtual void OnEnvReleased()
    {
    }

    // a UObject (or UField) is deleted, called by the delete listener of the env
    virtual void NotifyUObjectDeleted(const class UObjectBase* Object)
    {
    }
};

}    // namespace PUERTS_NAMESPACE
