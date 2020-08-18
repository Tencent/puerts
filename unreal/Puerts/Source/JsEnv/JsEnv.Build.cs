/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;
using System.IO;

public class JsEnv : ModuleRules
{
    public JsEnv(ReadOnlyTargetRules Target) : base(Target)
    {
        //PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core", "CoreUObject", "Engine", "InputCore", "Serialization", "OpenSSL","UMG"
        });

        bEnableExceptions = true;
        bEnableUndefinedIdentifierWarnings = false; // 避免在VS 2017编译时出现C4668错误

        string LibraryPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "Library"));
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "V8", "Win64");
            
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "encoding.lib"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "inspector.lib"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "inspector_string_conversions.lib"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "v8_base_without_compiler_0.lib"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "v8_base_without_compiler_1.lib"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "v8_compiler.lib"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "v8_external_snapshot.lib"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "v8_libbase.lib"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "v8_libplatform.lib"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "v8_libsampler.lib"));

            /*
            if (Target.bBuildEditor)
            {
                string WSLibraryPath = Path.Combine(LibraryPath, "Websockets", "Win64");

                PublicAdditionalLibraries.Add(Path.Combine(WSLibraryPath, "websockets_static.lib"));
                PublicAdditionalLibraries.Add(Path.Combine(WSLibraryPath, "libssl_static.lib"));
                PublicAdditionalLibraries.Add(Path.Combine(WSLibraryPath, "libcrypto_static.lib"));
                PublicAdditionalLibraries.Add(Path.Combine(WSLibraryPath, "zlib_internal.lib"));
            }
            */
        }
        else if (Target.Platform == UnrealTargetPlatform.Android)
        {
            string ARMv7aLibPath = Path.Combine(LibraryPath, "V8", "Android", "armv7a-release");
            string ARM64LibPath = Path.Combine(LibraryPath, "V8", "Android", "arm64-release");

            PublicAdditionalLibraries.Add(Path.Combine(ARMv7aLibPath, "libinspector.a"));
            PublicAdditionalLibraries.Add(Path.Combine(ARMv7aLibPath, "libv8_base.a"));
            PublicAdditionalLibraries.Add(Path.Combine(ARMv7aLibPath, "libv8_libbase.a"));
            PublicAdditionalLibraries.Add(Path.Combine(ARMv7aLibPath, "libv8_libplatform.a"));
            PublicAdditionalLibraries.Add(Path.Combine(ARMv7aLibPath, "libv8_libsampler.a"));
            PublicAdditionalLibraries.Add(Path.Combine(ARMv7aLibPath, "libv8_external_snapshot.a"));

            PublicAdditionalLibraries.Add(Path.Combine(ARM64LibPath, "libinspector.a"));
            PublicAdditionalLibraries.Add(Path.Combine(ARM64LibPath, "libv8_base.a"));
            PublicAdditionalLibraries.Add(Path.Combine(ARM64LibPath, "libv8_libbase.a"));
            PublicAdditionalLibraries.Add(Path.Combine(ARM64LibPath, "libv8_libplatform.a"));
            PublicAdditionalLibraries.Add(Path.Combine(ARM64LibPath, "libv8_libsampler.a"));
            PublicAdditionalLibraries.Add(Path.Combine(ARM64LibPath, "libv8_external_snapshot.a"));

            // TODO - 开启Websockets库依赖
            /*
            PublicLibraryPaths.Add(Path.Combine(LibraryPath, "Websockets", "Android", "armv7a-release"));
            PublicLibraryPaths.Add(Path.Combine(LibraryPath, "Websockets", "Android", "arm64-release"));

            PublicAdditionalLibraries.Add("");
            */
        }
        else if (Target.Platform == UnrealTargetPlatform.Mac)
        {
            // PublicFrameworks.AddRange(new string[] { "WebKit",  "JavaScriptCore" });
            PublicFrameworks.AddRange(new string[] { "WebKit"});
            string V8LibraryPath = Path.Combine(LibraryPath, "V8", "macOS");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libbindings.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libencoding.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libinspector.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libinspector_string_conversions.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libtorque_base.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libtorque_generated_definitions.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libtorque_generated_initializers.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_base_without_compiler.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_compiler.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_external_snapshot.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_init.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_initializers.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libbase.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libplatform.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libsampler.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_nosnapshot.a"));
            
            PublicAdditionalLibraries.Add(Path.Combine(Path.Combine(LibraryPath, "ffi", "macOS"), "libffi.a"));
        }
        else if (Target.Platform == UnrealTargetPlatform.IOS)
        {
            PublicFrameworks.AddRange(new string[] { "WebKit"});
            string V8LibraryPath = Path.Combine(LibraryPath, "V8", "iOS", "arm64");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libbindings.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libencoding.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libinspector.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libinspector_string_conversions.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libtorque_generated_definitions.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_base_without_compiler.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_compiler.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_external_snapshot.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libbase.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libplatform.a"));
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libsampler.a"));
            
            PublicAdditionalLibraries.Add(Path.Combine(Path.Combine(LibraryPath, "ffi", "iOS"), "libffi.a"));
        }
        string coreJSPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "Content"));
        string destDirName = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "..", "..", "Content"));
        DirectoryCopy(coreJSPath, destDirName, true);

        string HeaderPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "Include"));
        // External headers
        if (Target.Platform == UnrealTargetPlatform.Android)
        {
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "v8", "7.4.288") });
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "websocketpp") });
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "asio") });
        }
        else if (Target.Platform == UnrealTargetPlatform.Win64 ||
            Target.Platform == UnrealTargetPlatform.IOS ||
            Target.Platform == UnrealTargetPlatform.Mac)
        {
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "v8", "7.7.299") });
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "websocketpp") });
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "asio") });
        }
        
        if (Target.Platform == UnrealTargetPlatform.Mac)
        {
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "ffi", "macOS") });
        }
        else if (Target.Platform == UnrealTargetPlatform.IOS)
        {
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "ffi", "iOS") });
        }
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

        // Get the files in the directory and copy them to the new location.
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
