/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
 * This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
 */

using System;
using System.IO;
using System.Linq;
using Cake.Common;
using Cake.Common.IO;
using Cake.Common.Tools.DotNet;
using Cake.Common.Tools.DotNet.Pack;
using Cake.Core;
using Cake.Core.Diagnostics;
using Cake.Core.IO;
using Cake.Frosting;

namespace Build;

public static class Program
{
    public static int Main(string[] args)
    {
        return new CakeHost()
            .UseContext<BuildContext>()
            .Run(args);
    }
}

public class BuildContext : FrostingContext
{
    /// <summary>
    /// The full path to the directory containing native assets.
    /// </summary>
    public IDirectory NativeAssetsDirectory => this.HasArgument("NativeAssetsDirectory")
        ? FileSystem.GetDirectory(new DirectoryPath(Arguments.GetArgument("NativeAssetsDirectory")))
        : throw new CakeException($"Argument '{nameof(NativeAssetsDirectory)}' is required.");

    /// <summary>
    /// The full path to the root directory of the projects.
    /// </summary>
    public IDirectory ProjectsRoot => this.HasArgument("ProjectsRoot")
        ? FileSystem.GetDirectory(new DirectoryPath(Arguments.GetArgument("ProjectsRoot")))
        : throw new CakeException($"Argument '{nameof(ProjectsRoot)}' is required.");

    public bool IsUploadPackageEnabled => this.HasArgument("Source") && this.HasArgument("ApiKey");

    public string Source => this.HasArgument("Source")
        ? Arguments.GetArgument("Source")
        : throw new CakeException($"Argument '{nameof(Source)}' is required.");

    public string ApiKey
    {
        get
        {
            Log.Warning("Accessing Secret: {0}", nameof(ApiKey));
            return this.HasArgument("ApiKey")
                ? Arguments.GetArgument("ApiKey")
                : throw new CakeException($"Argument '{nameof(ApiKey)}' is required.");
        }
    }

    public BuildContext(ICakeContext context)
        : base(context)
    {
    }
}

[TaskName("TransformNativeAssets")]
public sealed class TransformNativeAssetsTask : FrostingTask<BuildContext>
{
    public override void Run(BuildContext context)
    {
        // For osx-auto, we need to transform or copy files differently.
        // natives-osx-auto\upms\core\Plugins\macOS\*.dylib -> natives-osx-auto\native\puerts\build_osx_auto_puerts\*.dylib
        // For osx's python, we need to copy files from arm64 subfolder to natives-osx-arm64\native\puerts\build_arm64_papi-python\*.dylib

        // Transform
        var nativeAssetsDirectory = context.NativeAssetsDirectory;

        // Handle macOS natives
        foreach (var projectItem in WellKnownProjects.NativeAssetsProjects)
        {
            if (!projectItem.CmakeRid.Contains("osx"))
            {
                continue;
            }

            // natives-osx-auto\upms\...\Plugins\macOS\...\*.dylib
            var osxAutoRoot = nativeAssetsDirectory.Path
                .Combine("natives-osx-auto")
                .Combine("upms");

            var backendName = projectItem.DotNetNativeName switch
            {
                "Core" => "core",
                "Lua" => "lua",
                "NodeJS" => "nodejs",
                "Python" => "python",
                "QuickJS" => "quickjs",
                "V8" => "v8",
                _ => null
            };

            if (backendName == null)
            {
                continue;
            }

            var backendPluginsRoot = osxAutoRoot
                .Combine(backendName)
                .Combine("Plugins")
                .Combine("macOS");

            // for Python on arm64
            var isPythonArm64 = projectItem.DotNetNativeName == "Python" && projectItem.CmakeRid == "osx-arm64";
            if (isPythonArm64)
            {
                backendPluginsRoot = backendPluginsRoot.Combine("arm64");
            }

            if (!Directory.Exists(backendPluginsRoot.FullPath))
            {
                throw new CakeException(
                    $"Expected source directory '{backendPluginsRoot.FullPath}' does not exist for project '{projectItem.Name}'.");
            }

            // natives-[cmake-rid]\native\[backend-name]\build_[cmake-rid]_*
            var targetNativeRoot = nativeAssetsDirectory.Path
                .Combine("natives-" + projectItem.CmakeRid)
                .Combine("native")
                .Combine(projectItem.CmakeNativeName);

            string buildFolderName;
            if (isPythonArm64)
            {
                // build_arm64_papi-python
                buildFolderName = "build_arm64_" + projectItem.CmakeNativeName;
            }
            else
            {
                // build_osx_papi-lua
                var ridPart = projectItem.CmakeRid == "osx-arm64" ? "osx_arm64" : "osx_auto";
                buildFolderName = $"build_{ridPart}_{projectItem.CmakeNativeName}";
            }

            var targetBuildDir = targetNativeRoot.Combine(buildFolderName);
            Directory.CreateDirectory(targetBuildDir.FullPath);

            var pattern = $"{backendPluginsRoot.FullPath}/*{projectItem.DotNetNativeName}*.dylib";

            var dylibFiles = context.GetFiles(
                new GlobPattern(pattern),
                new GlobberSettings { IsCaseSensitive = false });

            if (dylibFiles.Count == 0)
            {
                throw new CakeException(
                    $"No native assets found to transform from '{backendPluginsRoot.FullPath}' for project '{projectItem.Name}'.");
            }

            context.CopyFiles(dylibFiles, targetBuildDir.FullPath);

            // for Python, also copy the entire Python runtime (lib, include, etc.)
            if (projectItem.DotNetNativeName == "Python")
            {
                // Copy all Python runtime files and directories
                var pythonRuntimePattern = $"{backendPluginsRoot.FullPath}/**/*";
                var allPythonFiles = context.GetFiles(
                    new GlobPattern(pythonRuntimePattern),
                    new GlobberSettings { IsCaseSensitive = false });

                foreach (var file in allPythonFiles)
                {
                    var relativePath = file.FullPath.Substring(backendPluginsRoot.FullPath.Length + 1);
                    var targetFile = System.IO.Path.Combine(targetBuildDir.FullPath, relativePath);
                    var targetFileDir = System.IO.Path.GetDirectoryName(targetFile);
                    Directory.CreateDirectory(targetFileDir);
                    context.CopyFile(file, targetFile);
                }
                
                context.Log.Information($"Copied Python runtime files from '{backendPluginsRoot.FullPath}' to '{targetBuildDir.FullPath}'");
            }

            // for NodeJS, also copy libnode*.dylib
            if (projectItem.DotNetNativeName == "NodeJS")
            {
                var libnodePattern = $"{backendPluginsRoot.FullPath}/libnode*";
                var libnodeFiles = context.GetFiles(
                    new GlobPattern(libnodePattern),
                    new GlobberSettings { IsCaseSensitive = false });

                if (libnodeFiles.Count == 0)
                {
                    throw new CakeException(
                        $"No libnode dependencies found to copy from '{backendPluginsRoot.FullPath}' for project '{projectItem.Name}'.");
                }

                context.CopyFiles(libnodeFiles, targetBuildDir.FullPath);
            }
        }

        // Print the file tree for verification
        context.Log.Information("Transformed Native Assets Directory Structure:");

        PrintDirectoryTree(new DirectoryInfo(nativeAssetsDirectory.Path.FullPath));
        return;

        void PrintDirectoryTree(DirectoryInfo dir, string indent = "")
        {
            foreach (var subDir in dir.GetDirectories())
            {
                context.Log.Information($"{indent}- {subDir.Name}/");
                PrintDirectoryTree(subDir, indent + "  ");
            }

            foreach (var file in dir.GetFiles())
            {
                context.Log.Information($"{indent}- {file.Name}");
            }
        }
    }
}

[TaskName("CollectNativeAssets")]
public sealed class CollectNativeAssetsTask : FrostingTask<BuildContext>
{
    public override void Run(BuildContext context)
    {
        /* .NET RID catalog: https://learn.microsoft.com/en-us/dotnet/core/rid-catalog
         *
         * Excepted Directory structure:
         * Root\ (NativeAssetsDirectory)
         *  natives-linux-x64\papi-lua\build_linux_x64_papi-lua\*.so
         *  natives-linux-x64\papi-quickjs\build_linux_x64_papi-quickjs\*.so
         *  ...
         *  natives-win-x64\native\papi-lua\build_win_x64_papi-lua\*.dll
         *  ...
         *  natives-osx-x64\native\papi-lua\build_osx_x64_papi-lua\*.dylib
         *  natives-osx-arm64\native\papi-lua\build_osx_arm64_papi-lua\*.dylib
         *  ...
         *  natives-[cmake-rid]\native\[backend-name]\build_[cmake-rid]_*\Release\*.[dll|so|dylib]
         *  natives-[cmake-rid]\native\[backend-name]\build_[cmake-rid]_*\*.[dll|so|dylib]
         */

        var nativeAssetsDirectory = context.NativeAssetsDirectory;

        /* Move native assets to the target directory
         * Puerts.Core.NativeAssets.Linux\lib\
         *                                    [RID]\native\lib.so
         */

        foreach (var projectItem in WellKnownProjects.NativeAssetsProjects)
        {
            var nativeAssetsPath = nativeAssetsDirectory.Path
                .Combine("natives-" + projectItem.CmakeRid)
                .Combine("native")
                .Combine(projectItem.CmakeNativeName);

            if (!Directory.Exists(nativeAssetsPath.FullPath))
            {
                throw new CakeException($"Native assets directory '{nativeAssetsPath.FullPath}' does not exist.");
            }

            var targetDirectory = context.ProjectsRoot.Path
                .Combine(projectItem.Name)
                .Combine("lib")
                .Combine(projectItem.DotNetRid).Combine("native");

            Directory.CreateDirectory(targetDirectory.FullPath);

            var files = context.GetFiles(new GlobPattern($"{nativeAssetsPath.FullPath}/**/*"));
            
            // For Python, we need to preserve directory structure
            if (projectItem.DotNetNativeName == "Python")
            {
                foreach (var file in files)
                {
                    var relativePath = file.FullPath.Substring(nativeAssetsPath.FullPath.Length + 1);
                    var targetFile = System.IO.Path.Combine(targetDirectory.FullPath, relativePath);
                    var targetFileDir = System.IO.Path.GetDirectoryName(targetFile);
                    Directory.CreateDirectory(targetFileDir);
                    context.CopyFile(file, targetFile);
                }
                context.Log.Information($"Copied Python runtime with directory structure preserved to '{targetDirectory.FullPath}'");
            }
            else
            {
                context.CopyFiles(files, targetDirectory.FullPath);
            }
        }
    }
}

[TaskName("PackNugetPackages")]
public sealed class PackNugetPackagesTask : FrostingTask<BuildContext>
{
    public override void Run(BuildContext context)
    {
        var packageOutputDirectory = context.ProjectsRoot.Path.Combine("packageOutput");

        if (Directory.Exists(packageOutputDirectory.FullPath))
        {
            context.Log.Information(
                $"Cleaning up existing package output directory: {packageOutputDirectory.FullPath}");
            Directory.Delete(packageOutputDirectory.FullPath, true);
        }

        foreach (var coreProject in WellKnownProjects.CoreProjects)
        {
            var csprojPath = context.ProjectsRoot.Path.Combine(coreProject)
                .CombineWithFilePath(coreProject + ".csproj");
            context.Log.Information($"Packing NuGet package for project: {coreProject} at {csprojPath}");
            context.DotNetPack(csprojPath.FullPath, new DotNetPackSettings()
            {
                Configuration = "Release",
                OutputDirectory = packageOutputDirectory,
            });
            context.Log.Information($"NuGet package for {coreProject} packed successfully.");
        }

        foreach (var projectItem in WellKnownProjects.NativeAssetsProjects)
        {
            var csprojPath = context.ProjectsRoot.Path.Combine(projectItem.Name)
                .CombineWithFilePath(projectItem.Name + ".csproj");
            context.Log.Information($"Packing NuGet package for project: {projectItem.Name} at {csprojPath}");

            context.DotNetPack(csprojPath.FullPath, new DotNetPackSettings()
            {
                Configuration = "Release",
                OutputDirectory = packageOutputDirectory,
            });

            context.Log.Information($"NuGet package for {projectItem.Name} packed successfully.");
        }
    }
}

[TaskName("UploadNugetPackages")]
[IsDependentOn(typeof(PackNugetPackagesTask))]
public sealed class UploadNugetPackagesTask : FrostingTask<BuildContext>
{
    public override void Run(BuildContext context)
    {
        if (!context.IsUploadPackageEnabled)
        {
            context.Log.Information("Package upload is disabled. Skipping upload.");
            return;
        }

        var packageOutputDirectory = context.ProjectsRoot.Path.Combine("packageOutput");
        if (!Directory.Exists(packageOutputDirectory.FullPath))
        {
            throw new DirectoryNotFoundException(
                $"Package output directory '{packageOutputDirectory.FullPath}' does not exist.");
        }

        var packageFiles = Directory.EnumerateFiles(packageOutputDirectory.FullPath)
            .Where(file => file.EndsWith(".nupkg", StringComparison.OrdinalIgnoreCase));


        foreach (var nugetPackageFile in packageFiles)
        {
            context.Log.Information($"Uploading NuGet package: {nugetPackageFile}");

            context.DotNetNuGetPush(
                new FilePath(nugetPackageFile),
                new Cake.Common.Tools.DotNet.NuGet.Push.DotNetNuGetPushSettings()
                {
                    Source = context.Source,
                    ApiKey = context.ApiKey,
                    SkipDuplicate = true
                });
        }
    }
}

[TaskName("Default")]
[IsDependentOn(typeof(TransformNativeAssetsTask))]
[IsDependentOn(typeof(CollectNativeAssetsTask))]
[IsDependentOn(typeof(PackNugetPackagesTask))]
[IsDependentOn(typeof(UploadNugetPackagesTask))]
public sealed class DefaultTask : FrostingTask<BuildContext>
{
    public override void Run(BuildContext context)
    {
        context.Log.Information("Build and packaging completed successfully.");
        context.Log.Information("Native assets have been collected and NuGet packages have been created.");
        context.Log.Information(context.IsUploadPackageEnabled
            ? "NuGet packages have been uploaded to the specified source."
            : "Package upload is disabled. No packages were uploaded.");
    }
}

public static class WellKnownProjects
{
    public static readonly string[] CoreProjects =
    [
        "Puerts.Core",
        "Puerts.Core.Complete",
        "Puerts.Lua",
        "Puerts.Lua.Complete",
        "Puerts.NodeJS",
        "Puerts.NodeJS.Complete",
        "Puerts.Python",
        "Puerts.Python.Complete",
        "Puerts.QuickJS",
        "Puerts.QuickJS.Complete",
        "Puerts.V8",
        "Puerts.V8.Complete"
    ];

    /// <summary>
    /// This array contains the names and RIDs of well-known native projects.
    /// </summary>
    /// <remarks>
    /// This also needs to be defined in their csproj file.
    /// </remarks>
    public static readonly ProjectAndRidWithNativeName[] NativeAssetsProjects =
    [
        new() { Name = "Puerts.Core.NativeAssets.Win32", DotNetRid = "win-x64", DotNetNativeName = "Core" },
        new() { Name = "Puerts.Core.NativeAssets.Linux", DotNetRid = "linux-x64", DotNetNativeName = "Core" },
        new() { Name = "Puerts.Core.NativeAssets.macOS", DotNetRid = "osx", DotNetNativeName = "Core" },

        new() { Name = "Puerts.Lua.NativeAssets.Win32", DotNetRid = "win-x64", DotNetNativeName = "Lua" },
        new() { Name = "Puerts.Lua.NativeAssets.Linux", DotNetRid = "linux-x64", DotNetNativeName = "Lua" },
        new() { Name = "Puerts.Lua.NativeAssets.macOS", DotNetRid = "osx", DotNetNativeName = "Lua" },

        new() { Name = "Puerts.NodeJS.NativeAssets.Win32", DotNetRid = "win-x64", DotNetNativeName = "NodeJS" },
        new() { Name = "Puerts.NodeJS.NativeAssets.Linux", DotNetRid = "linux-x64", DotNetNativeName = "NodeJS" },
        new() { Name = "Puerts.NodeJS.NativeAssets.macOS", DotNetRid = "osx", DotNetNativeName = "NodeJS" },

        new() { Name = "Puerts.Python.NativeAssets.Win32", DotNetRid = "win-x64", DotNetNativeName = "Python" },
        new() { Name = "Puerts.Python.NativeAssets.Linux", DotNetRid = "linux-x64", DotNetNativeName = "Python" },
        new() { Name = "Puerts.Python.NativeAssets.macOS", DotNetRid = "osx-arm64", DotNetNativeName = "Python" },

        new() { Name = "Puerts.QuickJS.NativeAssets.Win32", DotNetRid = "win-x64", DotNetNativeName = "QuickJS" },
        new() { Name = "Puerts.QuickJS.NativeAssets.Linux", DotNetRid = "linux-x64", DotNetNativeName = "QuickJS" },
        new() { Name = "Puerts.QuickJS.NativeAssets.macOS", DotNetRid = "osx", DotNetNativeName = "QuickJS" },

        new() { Name = "Puerts.V8.NativeAssets.Win32", DotNetRid = "win-x64", DotNetNativeName = "V8" },
        new() { Name = "Puerts.V8.NativeAssets.Linux", DotNetRid = "linux-x64", DotNetNativeName = "V8" },
        new() { Name = "Puerts.V8.NativeAssets.macOS", DotNetRid = "osx", DotNetNativeName = "V8" },
    ];
}

public class ProjectAndRidWithNativeName
{
    /// <summary>
    /// Gets the csproj name of the native project.
    /// </summary>
    public string Name { get; init; }

    /// <summary>
    /// Gets the RID (Runtime Identifier) of the related native project.
    /// </summary>
    public string DotNetRid { get; init; }

    public string CmakeRid
    {
        get
        {
            return DotNetRid switch
            {
                "win-x64" => "win-x64",
                "linux-x64" => "linux-x64",
                "osx" => "osx",
                "osx-arm64" => "osx-arm64",
                _ => throw new NotSupportedException($"RID '{DotNetRid}' is not supported.")
            };
        }
    }

    /// <summary>
    /// Puerts.V8.NativeAssets.macOS => "V8"
    /// </summary>

    public string DotNetNativeName { get; init; }

    public string CmakeNativeName
    {
        get
        {
            return DotNetNativeName switch
            {
                "Core" => "puerts",
                "Lua" => "papi-lua",
                "NodeJS" => "papi-nodejs",
                "Python" => "papi-python",
                "QuickJS" => "papi-quickjs",
                "V8" => "papi-v8",
                _ => throw new NotSupportedException($"NativeName '{DotNetNativeName}' is not supported.")
            };
        }
    }
}