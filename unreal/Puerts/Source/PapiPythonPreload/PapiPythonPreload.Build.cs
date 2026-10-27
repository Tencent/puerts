/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;

// loads the python shared library of the engine before PapiPython (the same as PythonScriptPluginPreload of UE, which is not
// loaded if the PythonScriptPlugin is not enabled). Only patchlevel.h is included, it does not link to python
public class PapiPythonPreload : ModuleRules
{
    public PapiPythonPreload(ReadOnlyTargetRules Target) : base(Target)
    {
        PrivateDependencyModuleNames.AddRange(new string[]
        {
            "Core", "Python3"
        });
    }
}
