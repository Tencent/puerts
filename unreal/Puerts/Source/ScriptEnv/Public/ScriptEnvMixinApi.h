/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <functional>

#include "CoreMinimal.h"
#include "ScriptEnv.h"
#if !defined(ENGINE_INDEPENDENT_JSENV)
#include "ScriptEnvGroup.h"
#endif

// blueprint.mixin/unmixin, not a part of the basic env (FScriptEnv / FScriptEnvGroup know nothing of it), added to an env by the
// functions below. FJsEnv / FJsEnvGroup (the envs of the old versions) always add it
namespace PUERTS_NAMESPACE
{
// adds blueprint.mixin/unmixin to the env (runs puerts/mixin.js, the env without it does not have them), call before Start.
// Js backends only, no effect on ENGINE_INDEPENDENT_JSENV
SCRIPTENV_API void EnableMixin(FScriptEnv& Env);

#if !defined(ENGINE_INDEPENDENT_JSENV)
// adds blueprint.mixin/unmixin to the envs of the group (call before Start), a mixin method is called in the env chosen by
// SetMixinSelector (the first by default)
SCRIPTENV_API void EnableMixin(FScriptEnvGroup& Group);

// the selector of the env a mixin method of the group is called in, ignored if EnableMixin is not called for the group
SCRIPTENV_API void SetMixinSelector(FScriptEnvGroup& Group, std::function<int(UObject*, int)> InSelector);
#endif
}    // namespace PUERTS_NAMESPACE
