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

/// IniFile class was implemented by "juaxix" from UE forum
/// (https://forums.unrealengine.com/development-discussion/android-development/1693164-linking-static-library-based-on-architecture-arm-7-and-arm64)
/// 
/// <summary>
/// A class for reading values by section and key from a standard ".ini" initialization file.
/// </summary>
/// <remarks>
/// Section and key names are not case-sensitive. Values are loaded into a hash table for fast access.
/// Use <see cref="GetAllValues"/> to read multiple values that share the same section and key.
/// Sections in the initialization file must have the following form:
/// <code>
///     ; comment line
///     [section]
///     key=value
/// </code>
/// </remarks>
public class IniFile
{
    /// <summary>
    /// Initializes a new instance of the <see cref="IniFile"/> class.
    /// </summary>
    /// <param name="file">The initialization file path.</param>
    /// <param name="commentDelimiter">The comment delimiter string (default value is ";").
    /// </param>
    public IniFile(string file, string commentDelimiter = ";")
    {
        CommentDelimiter = commentDelimiter;
        TheFile = file;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="IniFile"/> class.
    /// </summary>
    public IniFile()
    {
        CommentDelimiter = ";";
    }

    /// <summary>
    /// The comment delimiter string (default value is ";").
    /// </summary>
    public string CommentDelimiter { get; set; }

    private string theFile;

    /// <summary>
    /// The initialization file path.
    /// </summary>
    public string TheFile
    {
        get
        {
            return theFile;
        }
        set
        {
            theFile = null;
            dictionary.Clear();
            if (File.Exists(value))
            {
                theFile = value;
                using (StreamReader sr = new StreamReader(theFile))
                {
                    string line, section = "";
                    while ((line = sr.ReadLine()) != null)
                    {
                        line = line.Trim();
                        if (line.Length == 0) continue;  // empty line
                        if (!String.IsNullOrEmpty(CommentDelimiter) && line.StartsWith(CommentDelimiter))
                            continue;  // comment

                        if (line.StartsWith("[") && line.Contains("]"))  // [section]
                        {
                            int index = line.IndexOf(']');
                            section = line.Substring(1, index - 1).Trim();
                            continue;
                        }

                        if (line.Contains("="))  // key=value
                        {
                            int index = line.IndexOf('=');
                            string key = line.Substring(0, index).Trim();
                            string val = line.Substring(index + 1).Trim();
                            string key2 = String.Format("[{0}]{1}", section, key).ToLower();

                            if (val.StartsWith("\"") && val.EndsWith("\""))  // strip quotes
                                val = val.Substring(1, val.Length - 2);

                            if (dictionary.ContainsKey(key2))  // multiple values can share the same key
                            {
                                index = 1;
                                string key3;
                                while (true)
                                {
                                    key3 = String.Format("{0}~{1}", key2, ++index);
                                    if (!dictionary.ContainsKey(key3))
                                    {
                                        dictionary.Add(key3, val);
                                        break;
                                    }
                                }
                            }
                            else
                            {
                                dictionary.Add(key2, val);
                            }
                        }
                    }
                }
            }
        }
    }

    // "[section]key"   -> "value1"
    // "[section]key~2" -> "value2"
    // "[section]key~3" -> "value3"
    private Dictionary<string, string> dictionary = new Dictionary<string, string>();

    private bool TryGetValue(string section, string key, out string value)
    {
        string key2;
        if (section.StartsWith("["))
            key2 = String.Format("{0}{1}", section, key);
        else
            key2 = String.Format("[{0}]{1}", section, key);

        return dictionary.TryGetValue(key2.ToLower(), out value);
    }

    /// <summary>
    /// Gets a string value by section and key.
    /// </summary>
    /// <param name="section">The section.</param>
    /// <param name="key">The key.</param>
    /// <param name="defaultValue">The default value.</param>
    /// <returns>The value.</returns>
    /// <seealso cref="GetAllValues"/>
    public string GetValue(string section, string key, string defaultValue = "")
    {
        string value;
        if (!TryGetValue(section, key, out value))
            return defaultValue;

        return value;
    }

    /// <summary>
    /// Gets a string value by section and key.
    /// </summary>
    /// <param name="section">The section.</param>
    /// <param name="key">The key.</param>
    /// <returns>The value.</returns>
    /// <seealso cref="GetValue"/>
    public string this[string section, string key]
    {
        get
        {
            return GetValue(section, key);
        }
    }

    /// <summary>
    /// Gets an integer value by section and key.
    /// </summary>
    /// <param name="section">The section.</param>
    /// <param name="key">The key.</param>
    /// <param name="defaultValue">The default value.</param>
    /// <param name="minValue">Optional minimum value to be enforced.</param>
    /// <param name="maxValue">Optional maximum value to be enforced.</param>
    /// <returns>The value.</returns>
    public int GetInteger(string section, string key, int defaultValue = 0,
        int minValue = int.MinValue, int maxValue = int.MaxValue)
    {
        string stringValue;
        if (!TryGetValue(section, key, out stringValue))
            return defaultValue;

        int value;
        if (!int.TryParse(stringValue, out value))
        {
            double dvalue;
            if (!double.TryParse(stringValue, out dvalue))
                return defaultValue;
            value = (int)dvalue;
        }

        if (value < minValue)
            value = minValue;
        if (value > maxValue)
            value = maxValue;
        return value;
    }

    /// <summary>
    /// Gets a double floating-point value by section and key.
    /// </summary>
    /// <param name="section">The section.</param>
    /// <param name="key">The key.</param>
    /// <param name="defaultValue">The default value.</param>
    /// <param name="minValue">Optional minimum value to be enforced.</param>
    /// <param name="maxValue">Optional maximum value to be enforced.</param>
    /// <returns>The value.</returns>
    public double GetDouble(string section, string key, double defaultValue = 0,
        double minValue = double.MinValue, double maxValue = double.MaxValue)
    {
        string stringValue;
        if (!TryGetValue(section, key, out stringValue))
            return defaultValue;

        double value;
        if (!double.TryParse(stringValue, out value))
            return defaultValue;

        if (value < minValue)
            value = minValue;
        if (value > maxValue)
            value = maxValue;
        return value;
    }

    /// <summary>
    /// Gets a boolean value by section and key.
    /// </summary>
    /// <param name="section">The section.</param>
    /// <param name="key">The key.</param>
    /// <param name="defaultValue">The default value.</param>
    /// <returns>The value.</returns>
    public bool GetBoolean(string section, string key, bool defaultValue = false)
    {
        string stringValue;
        if (!TryGetValue(section, key, out stringValue))
            return defaultValue;

        return (stringValue != "0" && !stringValue.StartsWith("f", true, null));
    }

    /// <summary>
    /// Gets an array of string values by section and key.
    /// </summary>
    /// <param name="section">The section.</param>
    /// <param name="key">The key.</param>
    /// <returns>The array of values, or null if none found.</returns>
    /// <seealso cref="GetValue"/>
    public string[] GetAllValues(string section, string key)
    {
        string key2, key3, value;
        if (section.StartsWith("["))
            key2 = String.Format("{0}{1}", section, key).ToLower();
        else
            key2 = String.Format("[{0}]{1}", section, key).ToLower();

        if (!dictionary.TryGetValue(key2, out value))
            return null;

        List<string> values = new List<string>();
        values.Add(value);
        int index = 1;
        while (true)
        {
            key3 = String.Format("{0}~{1}", key2, ++index);
            if (!dictionary.TryGetValue(key3, out value))
                break;
            values.Add(value);
        }

        return values.ToArray();
    }
}

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
            var DefaultEngineIniFile = new IniFile(Target.ProjectFile.Directory.FullName + "/Config/DefaultEngine.ini");
            bool bBuildForArmV7 = DefaultEngineIniFile.GetBoolean("/Script/AndroidRuntimeSettings.AndroidRuntimeSettings", "bBuildForArmV7");
            bool bBuildForArm64 = DefaultEngineIniFile.GetBoolean("/Script/AndroidRuntimeSettings.AndroidRuntimeSettings", "bBuildForArm64");

            if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion == 25)
            {
                if (bBuildForArmV7)
                {
                    string V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "armv7a-release", "8.4.371.19");
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
                }
                if (bBuildForArm64)
                {
                    string V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "arm64-release", "8.4.371.19");
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libwee8.a"));
                }
            }
            else if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion < 25)
            {
                if (bBuildForArmV7)
                {
                    string V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "armv7a-release", "7.4.288");
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libinspector.a"));
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_base.a"));
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_external_snapshot.a"));
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libbase.a"));
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libplatform.a"));
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libsampler.a"));
                }
                if (bBuildForArm64)
                {
                    string V8LibraryPath = Path.Combine(LibraryPath, "V8", "Android", "arm64-release", "7.4.288");
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libinspector.a"));
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_base.a"));
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_external_snapshot.a"));
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libbase.a"));
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libplatform.a"));
                    PublicAdditionalLibraries.Add(Path.Combine(V8LibraryPath, "libv8_libsampler.a"));
                }
            }
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
            
            //PublicAdditionalLibraries.Add(Path.Combine(Path.Combine(LibraryPath, "ffi", "iOS"), "libffi.a"));
        }
        string coreJSPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "Content"));
        string destDirName = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "..", "..", "Content"));
        DirectoryCopy(coreJSPath, destDirName, true);

        string HeaderPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "ThirdParty", "Include"));
        // External headers
        if (Target.Platform == UnrealTargetPlatform.Android)
        {
            if (Target.Version.MajorVersion == 4 && Target.Version.MinorVersion == 25)
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
        //else if (Target.Platform == UnrealTargetPlatform.IOS)
        //{
        //    PublicIncludePaths.AddRange(new string[] { Path.Combine(HeaderPath, "ffi", "iOS") });
        //}
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
