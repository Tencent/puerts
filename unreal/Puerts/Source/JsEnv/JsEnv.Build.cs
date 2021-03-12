/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;
using System;
using System.IO;
using System.Collections.Generic;

public class JsEnv : ModuleRules
{
    private bool UseNewV8 = false;

    private bool UseQuickjs = false;

    public JsEnv(ReadOnlyTargetRules Target) : base(Target)
    {
        //PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core", "CoreUObject", "Engine", "InputCore", "Serialization", "OpenSSL","UMG"
        });

        bEnableExceptions = true;
        bEnableUndefinedIdentifierWarnings = false; // 避免在VS 2017编译时出现C4668错误

        if (UseNewV8)
        {
            ThirdParty(Target);
        }
        else if (UseQuickjs)
        {
            ThirdPartyQJS(Target);
        }
        else
        {
            OldThirdParty(Target);
        }

        string coreJSPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "Content"));
        string destDirName = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "..", "..", "Content"));
        DirectoryCopy(coreJSPath, destDirName, true);
    }

    void OldThirdParty(ReadOnlyTargetRules Target)
    {
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
            if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion >= 25)
            {
                // for arm7
                string V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "armeabi-v7a", "8.4.371.19");
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
                // for arm64
                V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "arm64-v8a", "8.4.371.19");
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
            }
            else if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion < 25 && Target.Version.MinorVersion >= 22)
            {
                // for arm7
                string V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "armeabi-v7a", "7.4.288");
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libinspector.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_base.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_external_snapshot.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libbase.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libplatform.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libsampler.a"));
                // for arm64
                V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "arm64-v8a", "7.4.288");
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libinspector.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_base.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_external_snapshot.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libbase.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libplatform.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libsampler.a"));
            } 
            else if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion < 22) 
            {
                string V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "armeabi-v7a", "7.4.288");
                PublicLibraryPaths.Add(V8LibraryPath);
                V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "arm64-v8a", "7.4.288");
                PublicLibraryPaths.Add(V8LibraryPath);
                PublicAdditionalLibraries.Add("inspector");
                PublicAdditionalLibraries.Add("v8_base");
                PublicAdditionalLibraries.Add("v8_external_snapshot");
                PublicAdditionalLibraries.Add("v8_libbase");
                PublicAdditionalLibraries.Add("v8_libplatform");
                PublicAdditionalLibraries.Add("v8_libsampler");
            }
        }
        else if (Target.Platform == UnrealTargetPlatform.Mac)
        {
            // PublicFrameworks.AddRange(new string[] { "WebKit",  "JavaScriptCore" });
            PublicFrameworks.AddRange(new string[] { "WebKit" });
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

            //PublicAdditionalLibraries.Add(Path.Combine(Path.Combine(LibraryPath, "ffi", "macOS"), "libffi.a"));
        }
        else if (Target.Platform == UnrealTargetPlatform.IOS)
        {
            PublicFrameworks.AddRange(new string[] { "WebKit" });
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

            //PublicAdditionalLibraries.Add(Path.Combine(Path.Combine(LibraryPath, "ffi", "iOS"), "libffi.a"));
        }
        else if (Target.Platform == UnrealTargetPlatform.Linux)
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "V8", "Linux");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
        }

        string HeaderPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "Include"));
        // External headers
        if (Target.Platform == UnrealTargetPlatform.Android)
        {
            if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion >= 25)
            {
                PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "v8", "8.4.371.19") });
            }
            else if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion < 25)
            {
                PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "v8", "7.4.288") });
            }
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "websocketpp") });
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "asio") });
        }
        else if (Target.Platform == UnrealTargetPlatform.Win64 ||
            Target.Platform == UnrealTargetPlatform.IOS ||
            Target.Platform == UnrealTargetPlatform.Mac ||
            Target.Platform == UnrealTargetPlatform.Linux)
        {
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "v8", "7.7.299") });
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "websocketpp") });
            PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "asio") });
        }

        //if (Target.Platform == UnrealTargetPlatform.Mac)
        //{
        //    PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "ffi", "macOS") });
        //}
        //else if (Target.Platform == UnrealTargetPlatform.IOS)
        //{
        //    PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "ffi", "iOS") });
        //}
    }

    void ThirdParty(ReadOnlyTargetRules Target)
    {
        //Add header
        string HeaderPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "Include"));
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "websocketpp") });
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "asio") });
        //if (Target.Platform == UnrealTargetPlatform.Mac)
        //{
        //    PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "ffi", "macOS") });
        //}
        //else if (Target.Platform == UnrealTargetPlatform.IOS)
        //{
        //    PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "ffi", "iOS") });
        //}
        PublicIncludePaths.AddRange(new string[] { Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "v8", "Inc") });

        string LibraryPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "v8", "Lib"));
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "Win64MD");

            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "wee8.lib"));
        }
        else if (Target.Platform == UnrealTargetPlatform.Android)
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "Android", "armeabi-v7a");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
            V8LibraryPath = Path.Combine(LibraryPath, "Android", "arm64-v8a");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
        }
        else if (Target.Platform == UnrealTargetPlatform.Mac)
        {
            // PublicFrameworks.AddRange(new string[] { "WebKit",  "JavaScriptCore" });
            PublicFrameworks.AddRange(new string[] { "WebKit" });
            string V8LibraryPath = Path.Combine(LibraryPath, "macOS");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));

            //PublicAdditionalLibraries.Add(Path.Combine(Path.Combine(LibraryPath, "ffi", "macOS"), "libffi.a"));
        }
        else if (Target.Platform == UnrealTargetPlatform.IOS)
        {
            PublicFrameworks.AddRange(new string[] { "WebKit" });
            string V8LibraryPath = Path.Combine(LibraryPath, "iOS", "arm64");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));

            //PublicAdditionalLibraries.Add(Path.Combine(Path.Combine(LibraryPath, "ffi", "iOS"), "libffi.a"));
        } 
        else if (Target.Platform == UnrealTargetPlatform.Linux) {
            string V8LibraryPath = Path.Combine(LibraryPath, "Linux");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
        }
    }

    void ThirdPartyQJS(ReadOnlyTargetRules Target)
    {
        Definitions.Add("WITHOUT_INSPECTOR");
        Definitions.Add("WITH_QUICKJS");
        PublicIncludePaths.AddRange(new string[] { Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "quickjs", "Inc") });

        string LibraryPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "quickjs", "Lib"));
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "Win64MD");

            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "quickjs.dll.lib"));
            var DllNames = new string[]
            {
                "libgcc_s_seh-1.dll",
                "libwinpthread-1.dll",
                "msys-quickjs.dll"
            };
            string BinariesDir = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "Binaries", "Win64"));
            foreach (var DllName in DllNames)
            {
                PublicDelayLoadDLLs.Add(DllName);
                var DllPath = Path.Combine(V8LibraryPath, DllName);
                var DestDllPath = Path.Combine(BinariesDir, DllName);
                try
                {
                    System.IO.File.Delete(DestDllPath);
                }
                catch { }
                if (!System.IO.File.Exists(DestDllPath) && System.IO.File.Exists(DllPath))
                {
                    System.IO.File.Copy(DllPath, DestDllPath, false);
                }
                RuntimeDependencies.Add(DestDllPath);
            }
        }
        else if (Target.Platform == UnrealTargetPlatform.Android)
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "Android", "armeabi-v7a");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libquickjs.a"));
            V8LibraryPath = Path.Combine(LibraryPath, "Android", "arm64-v8a");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libquickjs.a"));
        }
        else if (Target.Platform == UnrealTargetPlatform.Mac)
        {
            // PublicFrameworks.AddRange(new string[] { "WebKit",  "JavaScriptCore" });
            PublicFrameworks.AddRange(new string[] { "WebKit" });
            string V8LibraryPath = Path.Combine(LibraryPath, "macOS");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libquickjs.a"));

            //PublicAdditionalLibraries.Add(Path.Combine(Path.Combine(LibraryPath, "ffi", "macOS"), "libffi.a"));
        }
        else if (Target.Platform == UnrealTargetPlatform.IOS)
        {
            PublicFrameworks.AddRange(new string[] { "WebKit" });
            string V8LibraryPath = Path.Combine(LibraryPath, "iOS", "arm64");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libquickjs.a"));

            //PublicAdditionalLibraries.Add(Path.Combine(Path.Combine(LibraryPath, "ffi", "iOS"), "libffi.a"));
        }
        else if (Target.Platform == UnrealTargetPlatform.Linux)
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "Linux");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libquickjs.a"));
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
