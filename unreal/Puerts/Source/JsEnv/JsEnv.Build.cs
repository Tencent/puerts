/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;

// 兼容层：保留 FJsEnv / FJsEnvGroup / IJsEnvModule 等原有接口，内部组合 ScriptEnv（通用部分）与 PapiV8（V8 后端）。
public class JsEnv : ModuleRules
{
    public static bool WithSourceControl = false;

    public JsEnv(ReadOnlyTargetRules Target) : base(Target)
    {
#if UE_5_6_OR_LATER
        CppCompileWarningSettings.ShadowVariableWarningLevel = WarningLevel.Warning;
#else
        ShadowVariableWarningLevel = WarningLevel.Warning;
#endif

        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core", "CoreUObject", "Engine", "ScriptEnv", "PapiV8"
        });

        // JsEnv/Private 下保留了一份 Unity 共用的源文件（V8InspectorImpl.cpp、WebSocketImpl.cpp 等），
        // UE 编译的是 PapiV8 / ScriptEnv 中的版本，这里通过宏跳过，避免重复定义。
        PrivateDefinitions.Add("PUERTS_JSENV_SKIP_UNITY_SHARED_SOURCES");

        bEnableExceptions = true;
    }
}
