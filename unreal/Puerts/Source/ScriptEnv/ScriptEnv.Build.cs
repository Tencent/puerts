/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;
using System.IO;
using System.Reflection;

// 脚本环境的引擎通用部分：UE 反射绑定、模块加载、类型翻译等，只依赖 pesapi，不依赖具体脚本后端（V8 等）。
// 具体后端在 PapiV8 等模块中实现，兼容层 JsEnv 把两者组合成原来的 FJsEnv。
public class ScriptEnv : ModuleRules
{
    private bool ThreadSafe = false;

    private bool FTextAsString = true;

    private bool bEditorSuffix = true;

    // 开启后 ScriptEnv 与 PapiV8 都会按字节码模式编译（PapiV8.Build.cs 读取该字段）
    public static bool WithByteCode = false;

    private bool WithWebsocket = false;

    public ScriptEnv(ReadOnlyTargetRules Target) : base(Target)
    {
        PublicDefinitions.Add("USING_IN_UNREAL_ENGINE");
        // 如需启用 WITH_V8_FAST_CALL，必须放在这里（ScriptEnv 的 PublicDefinitions），
        // 保证所有模块看到的模板展开一致，否则会有 ODR 问题。
        //PublicDefinitions.Add("WITH_V8_FAST_CALL");

        PublicDefinitions.Add("TS_BLUEPRINT_PATH=\"/Blueprints/TypeScript/\"");

        PublicDefinitions.Add(ThreadSafe ? "THREAD_SAFE" : "NOT_THREAD_SAFE");

        if (bEditorSuffix)
        {
            PublicDefinitions.Add("PUERTS_WITH_EDITOR_SUFFIX");
        }

        if (WithWebsocket)
        {
            PublicDefinitions.Add("WITH_WEBSOCKET");
            PublicDefinitions.Add("WITH_WEBSOCKET_SSL");
            PublicDependencyModuleNames.Add("OpenSSL");
        }

#if UE_5_6_OR_LATER
        CppCompileWarningSettings.ShadowVariableWarningLevel = WarningLevel.Warning;
#else
        ShadowVariableWarningLevel = WarningLevel.Warning;
#endif

        if (!FTextAsString)
        {
            PublicDefinitions.Add("PUERTS_FTEXT_AS_OBJECT");
        }

        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core", "CoreUObject", "Engine", "ParamDefaultValueMetas", "UMG", "Json"
        });

        if (Target.bBuildEditor)
        {
            PublicDependencyModuleNames.AddRange(new string[] { "DirectoryWatcher", });
        }

        bEnableExceptions = true;
        var ContextField = GetType().GetField("Context", BindingFlags.Instance | BindingFlags.NonPublic);
        if (ContextField != null)
        {
            var bCanHotReloadField = ContextField.FieldType.GetField("bCanHotReload", BindingFlags.Instance | BindingFlags.Public);
            if (bCanHotReloadField != null)
            {
                bCanHotReloadField.SetValue(ContextField.GetValue(this), false);
            }
        }

        bool bForceAllUFunctionInCPP = false;
        PublicDefinitions.Add(bForceAllUFunctionInCPP ? "PUERTS_FORCE_CPP_UFUNCTION=1" : "PUERTS_FORCE_CPP_UFUNCTION=0");

        bool bKeepUObjectReference = true;
        PublicDefinitions.Add(bKeepUObjectReference ? "PUERTS_KEEP_UOBJECT_REFERENCE=1" : "PUERTS_KEEP_UOBJECT_REFERENCE=0");

        if (WithByteCode)
        {
            PrivateDefinitions.Add("WITH_V8_BYTECODE");
        }

        string HeaderPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "Include"));
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "websocketpp") });
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "asio") });

        string coreJSPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "Content"));
        string destDirName = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "..", "..", "Content"));
        DirectoryCopy(coreJSPath, destDirName, true);

        // 每次build时拷贝一些手写的.d.ts到Typing目录以同步更新
        string srcDtsDirName = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "Typing"));
        string dstDtsDirName = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "..", "..", "Typing"));
        DirectoryCopy(srcDtsDirName, dstDtsDirName, true);
    }

    private static void DirectoryCopy(string sourceDirName, string destDirName, bool copySubDirs)
    {
        DirectoryInfo dir = new DirectoryInfo(sourceDirName);

        if (!dir.Exists)
        {
            throw new DirectoryNotFoundException(
            "Source directory does not exist or could not be found: "
            + sourceDirName);
        }

        if (!Directory.Exists(destDirName))
        {
            Directory.CreateDirectory(destDirName);
        }

        FileInfo[] files = dir.GetFiles();
        foreach (FileInfo file in files)
        {
            string temppath = Path.Combine(destDirName, file.Name);
            file.CopyTo(temppath, true);
        }

        if (copySubDirs)
        {
            DirectoryInfo[] dirs = dir.GetDirectories();
            foreach (DirectoryInfo subdir in dirs)
            {
                string temppath = Path.Combine(destDirName, subdir.Name);
                DirectoryCopy(subdir.FullName, temppath, copySubDirs);
            }
        }
    }
}
