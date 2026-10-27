/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;
using System.IO;

// the quickjs backend: the quickjs implementation of pesapi and FPapiBackendQuickjs, quickjs (quickjs-ng, the same as unity) is
// compiled from source (Private/quickjs). It can be linked with PapiV8, the backend of an env is chosen by its factory.
public class PapiQuickjs : ModuleRules
{
    public PapiQuickjs(ReadOnlyTargetRules Target) : base(Target)
    {
#if UE_5_6_OR_LATER
        CppCompileWarningSettings.ShadowVariableWarningLevel = WarningLevel.Warning;
        CppCompileWarningSettings.UndefinedIdentifierWarningLevel = WarningLevel.Off;
#else
        ShadowVariableWarningLevel = WarningLevel.Warning;
        bEnableUndefinedIdentifierWarnings = false;
#endif

        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core", "CoreUObject", "Engine", "ScriptEnv"
        });

        // PapiEnvScope.h of ScriptEnv
        PrivateIncludePaths.Add(Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "ScriptEnv", "Private")));
        PrivateIncludePaths.Add(Path.Combine(ModuleDirectory, "Private", "quickjs"));

        bEnableExceptions = true;
        // quickjs.c is large, and the c files must not be merged with the c++ ones
        bUseUnity = false;

        PrivateDefinitions.Add("_GNU_SOURCE");
        // Atomics (SharedArrayBuffer) are not used, and stdatomic.h is not available for c of msvc without
        // /experimental:c11atomics
        PrivateDefinitions.Add("__STDC_NO_ATOMICS__=1");
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            PrivateDefinitions.Add("WIN32_LEAN_AND_MEAN");
            PrivateDefinitions.Add("_CRT_SECURE_NO_WARNINGS");
        }
    }
}
