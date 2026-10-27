/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;
using System.IO;

// the python backend: the python implementation of pesapi and FPapiBackendPython (the same as unity papi-python), on the
// python 3 of the engine (the Python3 module, WITH_PYTHON). Each env is a sub interpreter, the shared library of python is
// loaded by PapiPythonPreload. It can be linked with PapiV8 / PapiQuickjs / PapiLua, the backend of an env is chosen by its
// factory
public class PapiPython : ModuleRules
{
    public PapiPython(ReadOnlyTargetRules Target) : base(Target)
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

        PrivateDependencyModuleNames.AddRange(new string[]
        {
            "Python3"
        });

        // PapiEnvScope.h of ScriptEnv
        PrivateIncludePaths.Add(Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "ScriptEnv", "Private")));

        bEnableExceptions = true;
    }
}
