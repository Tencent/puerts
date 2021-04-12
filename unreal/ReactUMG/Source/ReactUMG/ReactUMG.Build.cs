/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using UnrealBuildTool;
using System.IO;

public class ReactUMG : ModuleRules
{
	public ReactUMG(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] 
		{ 
			"Core", "CoreUObject", "Engine", "InputCore", "Serialization", "JsEnv", "UMG"
        });

		bEnableExceptions = true;

		//string coreJSPath = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "Content", "Scripts"));
		//string destDirName = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "..", "..", "Content", "Scripts"));
		//DirectoryCopy(coreJSPath, destDirName, true);

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
