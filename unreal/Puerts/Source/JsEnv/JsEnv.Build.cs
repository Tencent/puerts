/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;
using System.IO;
using System.Reflection;

public class JsEnv : ModuleRules
{
    private bool UseNewV8 = 
#if UE_4_25_OR_LATER
        true;
#else
        false;
#endif

    private bool UseNodejs = false;

    private bool UseQuickjs = false;

    private bool WithFFI = false;

    public JsEnv(ReadOnlyTargetRules Target) : base(Target)
    {
        //PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDefinitions.Add("USING_IN_UNREAL_ENGINE");

        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core", "CoreUObject", "Engine", "ParamDefaultValueMetas" ,"UMG"
        });

        bEnableExceptions = true;
        bEnableUndefinedIdentifierWarnings = false; // 避免在VS 2017编译时出现C4668错误
        var ContextField = GetType().GetField("Context", BindingFlags.Instance | BindingFlags.NonPublic);
        if (ContextField != null)
        {
            var bCanHotReloadField = ContextField.FieldType.GetField("bCanHotReload", BindingFlags.Instance | BindingFlags.Public);
            if (bCanHotReloadField != null)
            {
                bCanHotReloadField.SetValue(ContextField.GetValue(this), false);
            }
        }

        if (UseNodejs && (Target.Platform == UnrealTargetPlatform.Win64 
                          || Target.Platform == UnrealTargetPlatform.Mac 
                          || Target.Platform == UnrealTargetPlatform.Linux))
        {
            ThirdPartyNodejs(Target);
        }
        else if (UseNewV8)
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
        
        if (WithFFI) AddFFI(Target);

        string coreJSPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "Content"));
        string destDirName = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "..", "..", "Content"));
        DirectoryCopy(coreJSPath, destDirName, true);
    }

    void OldThirdParty(ReadOnlyTargetRules Target)
    {
        string LibraryPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "v8_for_ue424_or_below", "Lib"));
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            //if (Target.bBuildEditor)
            //{
            //    WinDll(Path.Combine(LibraryPath, "V8"));
            //}
            //else
            {
                string V8LibraryPath = Path.Combine(LibraryPath, "Win64");

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
            }
        }
        else if (Target.Platform == UnrealTargetPlatform.Android)
        {
            if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion >= 25)
            {
                // for arm7
                string V8LibraryPath = Path.Combine(LibraryPath, "Android", "armeabi-v7a", "8.4.371.19");
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
                // for arm64
                V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "arm64-v8a", "8.4.371.19");
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
            }
            else if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion < 25 && Target.Version.MinorVersion >= 22)
            {
                // for arm7
                string V8LibraryPath = Path.Combine(LibraryPath, "Android", "armeabi-v7a", "7.4.288");
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libinspector.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_base.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_external_snapshot.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libbase.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libplatform.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libsampler.a"));
                // for arm64
                V8LibraryPath = Path.Combine(LibraryPath, "Android", "arm64-v8a", "7.4.288");
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libinspector.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_base.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_external_snapshot.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libbase.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libplatform.a"));
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libsampler.a"));
            } 
#if !UE_4_22_OR_LATER
            else if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion < 22) 
            {
                string V8LibraryPath = Path.Combine(LibraryPath, "Android", "armeabi-v7a", "7.4.288");
                PublicLibraryPaths.Add(V8LibraryPath);
                V8LibraryPath = Path.Combine(LibraryPath, "Android", "arm64-v8a", "7.4.288");
                PublicLibraryPaths.Add(V8LibraryPath);
                PublicAdditionalLibraries.Add("inspector");
                PublicAdditionalLibraries.Add("v8_base");
                PublicAdditionalLibraries.Add("v8_external_snapshot");
                PublicAdditionalLibraries.Add("v8_libbase");
                PublicAdditionalLibraries.Add("v8_libplatform");
                PublicAdditionalLibraries.Add("v8_libsampler");
            }
#endif
        }
        else if (Target.Platform == UnrealTargetPlatform.Mac)
        {
            // PublicFrameworks.AddRange(new string[] { "WebKit",  "JavaScriptCore" });
            PublicFrameworks.AddRange(new string[] { "WebKit" });
            string V8LibraryPath = Path.Combine(LibraryPath, "macOS");
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
        }
        else if (Target.Platform == UnrealTargetPlatform.IOS)
        {
            PublicFrameworks.AddRange(new string[] { "WebKit" });
            string V8LibraryPath = Path.Combine(LibraryPath, "iOS", "arm64");
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
            string V8LibraryPath = Path.Combine(LibraryPath, "Linux");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
        }

        string V8HeaderPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "v8_for_ue424_or_below", "Inc"));
        // External headers
        if (Target.Platform == UnrealTargetPlatform.Android)
        {
            if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion >= 25)
            {
                PublicIncludePaths.AddRange(new string[] { Path.Combine(V8HeaderPath, "8.4.371.19") });
            }
            else if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion < 25)
            {
                PublicIncludePaths.AddRange(new string[] { Path.Combine(V8HeaderPath, "7.4.288") });
            }
        }
        //else if (Target.bBuildEditor && Target.Platform == UnrealTargetPlatform.Win64)
        //{
        //    PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "8.4.371.19") });
        //}
        else if (Target.Platform == UnrealTargetPlatform.Win64 ||
            Target.Platform == UnrealTargetPlatform.IOS ||
            Target.Platform == UnrealTargetPlatform.Mac ||
            Target.Platform == UnrealTargetPlatform.Linux)
        {
            PublicIncludePaths.AddRange(new string[] { Path.Combine(V8HeaderPath, "7.7.299") });
        }
        string HeaderPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "Include"));
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "websocketpp") });
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "asio") });
    }

    void AddFFI(ReadOnlyTargetRules Target)
    {
        string HeaderPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "Include"));
        string LibraryPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "Library"));
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            PublicIncludePaths.AddRange(new string[] {Path.Combine(HeaderPath, "ffi", "Win64")});
            PublicAdditionalLibraries.Add(Path.Combine(LibraryPath, "ffi", "Win64", "ffi.lib"));
        }
        else if (Target.Platform == UnrealTargetPlatform.Mac)
        {
            PublicIncludePaths.AddRange(new string[] {Path.Combine(HeaderPath, "ffi", "macOS")});
            PublicAdditionalLibraries.Add(Path.Combine(LibraryPath, "ffi", "macOS", "libffi.a"));
        }
        else if (Target.Platform == UnrealTargetPlatform.IOS)
        {
            PublicIncludePaths.AddRange(new string[] {Path.Combine(HeaderPath, "ffi", "iOS")});
            PublicAdditionalLibraries.Add(Path.Combine(LibraryPath, "ffi", "iOS", "libffi.a"));
        }
        else if (Target.Platform == UnrealTargetPlatform.Android)
        {
            PublicIncludePaths.AddRange(new string[] {Path.Combine(HeaderPath, "ffi", "Android")});
            PublicAdditionalLibraries.Add(Path.Combine(LibraryPath, "ffi", "Android", "armeabi-v7a", "libffi.a"));
            PublicAdditionalLibraries.Add(Path.Combine(LibraryPath, "ffi", "Android", "arm64-v8a", "libffi.a"));
        }

        PrivateDefinitions.Add("WITH_FFI");
    }

    void AddRuntimeDependencies(string[] DllNames, string LibraryPath, bool Delay)
    {
        foreach (var DllName in DllNames)
        {
            if(Delay) PublicDelayLoadDLLs.Add(DllName);
            var DllPath = Path.Combine(LibraryPath, DllName);
            var DestDllPath = Path.Combine("$(BinaryOutputDir)", DllName);
            RuntimeDependencies.Add(DestDllPath, DllPath, StagedFileType.NonUFS);
        }
    }

    void WinDll(string LibraryPath)
    {
        string V8LibraryPath = Path.Combine(LibraryPath, "Win64DLL");
        PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "v8.dll.lib"));
        PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "v8_libplatform.dll.lib"));

        AddRuntimeDependencies(new string[]
        {
            "v8.dll",
            "v8_libplatform.dll",
            "v8_libbase.dll",
            "zlib.dll"
        }, V8LibraryPath, false);
    }
    
    void MacDylib(string LibraryPath)
    {
        string V8LibraryPath = Path.Combine(LibraryPath, "macOSdylib");
        PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8.dylib"));
        PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libplatform.dylib"));
        PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libbase.dylib"));
        PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libchrome_zlib.dylib"));
    }

    void ThirdParty(ReadOnlyTargetRules Target)
    {
        //Add header
        string HeaderPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "Include"));
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "websocketpp") });
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "asio") });
        PublicIncludePaths.AddRange(new string[] { Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "v8", "Inc") });

        string LibraryPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "v8", "Lib"));
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            if (!Target.bBuildEditor)
            {
                string V8LibraryPath = Path.Combine(LibraryPath, "Win64MD");
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "wee8.lib"));
            }
            else 
            {
                WinDll(LibraryPath);
            }
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
            //PublicFrameworks.AddRange(new string[] { "WebKit",  "JavaScriptCore" });
            //PublicFrameworks.AddRange(new string[] { "WebKit" });
            if (!Target.bBuildEditor)
            {
                string V8LibraryPath = Path.Combine(LibraryPath, "macOS");
                PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
            }
            else
            {
                MacDylib(LibraryPath);
            }
        }
        else if (Target.Platform == UnrealTargetPlatform.IOS)
        {
            PublicFrameworks.AddRange(new string[] { "WebKit" });
            string V8LibraryPath = Path.Combine(LibraryPath, "iOS", "arm64");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
        } 
        else if (Target.Platform == UnrealTargetPlatform.Linux) 
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "Linux");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
        }
    }
    
    void ThirdPartyNodejs(ReadOnlyTargetRules Target)
    {
        PrivateDefinitions.Add("WITHOUT_INSPECTOR");//node already had one
        PrivateDefinitions.Add("WITH_NODEJS");
        string HeaderPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "nodejs"));
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "include") });
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "deps", "v8", "include") });
        PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "deps", "uv", "include") });

        string LibraryPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "nodejs", "lib"));
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "Win64");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libnode.lib"));

            RuntimeDependencies.Add("$(TargetOutputDir)/libnode.dll", Path.Combine(V8LibraryPath, "libnode.dll"));
        }
        else if (Target.Platform == UnrealTargetPlatform.Mac)
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "macOS");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libnode.83.dylib"));
        }
        else if (Target.Platform == UnrealTargetPlatform.Linux) 
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "Linux");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libnode.so"));
        }
    }

    void ThirdPartyQJS(ReadOnlyTargetRules Target)
    {
        PrivateDefinitions.Add("WITHOUT_INSPECTOR");
        PrivateDefinitions.Add("WITH_QUICKJS");
        PublicIncludePaths.AddRange(new string[] { Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "quickjs", "Inc") });

        string LibraryPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "quickjs", "Lib"));
        if (Target.Platform == UnrealTargetPlatform.Win64)
        {
            string V8LibraryPath = Path.Combine(LibraryPath, "Win64MD");

            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "quickjs.dll.lib"));
            AddRuntimeDependencies(new string[]
            {
                "libgcc_s_seh-1.dll",
                "libwinpthread-1.dll",
                "msys-quickjs.dll"
            }, V8LibraryPath, true);
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
        }
        else if (Target.Platform == UnrealTargetPlatform.IOS)
        {
            PublicFrameworks.AddRange(new string[] { "WebKit" });
            string V8LibraryPath = Path.Combine(LibraryPath, "iOS", "arm64");
            PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libquickjs.a"));
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
