/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.IO;
using UnrealBuildTool;

public class PuertsEditor : ModuleRules {
    public PuertsEditor(ReadOnlyTargetRules target) : base(target) {
        PublicDependencyModuleNames.AddRange(
            new string[]
            {
                "Core",
                "CoreUObject",
                "UMG",
                "UnrealEd",
                "LevelEditor",
                "Engine",
                "Slate",
                "SlateCore",
                "EditorStyle",
                "InputCore",
                "Projects",
                "JsEnv",
                "Puerts",
                "DirectoryWatcher",
                "AssetRegistry",
                "KismetCompiler",
                "BlueprintGraph",
                "AssetTools"
            }
        );
        bEnableUndefinedIdentifierWarnings = false; // 避免在VS 2017编译时出现C4668错误
    }
}
