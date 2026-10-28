/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;
using System.IO;

// the lua backend: the lua implementation of pesapi and FPapiBackendLua (the same as unity papi-lua), lua 5.4 is compiled from
// source (Private/lua). It can be linked with PapiV8 / PapiQuickjs, the backend of an env is chosen by its factory.
public class PapiLua : ModuleRules
{
    public PapiLua(ReadOnlyTargetRules Target) : base(Target)
    {
#if UE_5_6_OR_LATER
        CppCompileWarningSettings.ShadowVariableWarningLevel = WarningLevel.Warning;
        CppCompileWarningSettings.UndefinedIdentifierWarningLevel = WarningLevel.Off;
#if UE_5_8_OR_LATER
        // third-party c sources, UE5.8 (BuildSettingsVersion.V7) turns unreachable code into an error by default
        CppCompileWarningSettings.UnreachableCodeWarningLevel = WarningLevel.Warning;
#endif
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
        PrivateIncludePaths.Add(Path.Combine(ModuleDirectory, "Private", "lua"));

        bEnableExceptions = true;
        // the c files of lua must not be merged with the c++ ones
        bUseUnity = false;

        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            PrivateDefinitions.Add("WIN32_LEAN_AND_MEAN");
            PrivateDefinitions.Add("_CRT_SECURE_NO_WARNINGS");
        }
        else if (Target.Platform == UnrealTargetPlatform.Mac)
        {
            PrivateDefinitions.Add("LUA_USE_MACOSX");
        }
        else if (Target.Platform == UnrealTargetPlatform.IOS)
        {
            PrivateDefinitions.Add("LUA_USE_IOS");
        }
        else if (Target.Platform == UnrealTargetPlatform.Linux || Target.Platform == UnrealTargetPlatform.Android)
        {
            PrivateDefinitions.Add("LUA_USE_LINUX");
        }
    }
}
