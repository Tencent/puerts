/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.IO;
using UnrealBuildTool;

public class Puerts : ModuleRules 
{
    public Puerts(ReadOnlyTargetRules Target) : base(Target) 
    {
        PublicDependencyModuleNames.AddRange(
            new string[]
            {
                "Core", "CoreUObject", "Engine", "InputCore", "Serialization", "OpenSSL","UMG","JsEnv",
            }
        );
        
        if (Target.bBuildEditor == true)
        {
            PrivateDependencyModuleNames.Add("UnrealEd");
        }

        //PublicDefinitions.Add(string.Format("DECL_OUTPUT_PATH={0}", Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "Content", "Scripts"))));
    }
}
