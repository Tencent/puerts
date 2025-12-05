/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

/// <summary>
/// 修复 PuerTS iOS xcode 编译中的 "ReentrantLock is ambigious" 错误。
/// 参见 https://puerts.github.io/docs/puerts/unity/performance/il2cpp#faq
/// 参见 https://github.com/Tencent/puerts/issues/1428
/// </summary>

#if UNITY_IOS

using System.IO;
using UnityEditor;
using UnityEditor.Callbacks;
using UnityEditor.iOS.Xcode;

public class IOSPreprocessorFix
{
	[PostProcessBuild(100)]
	public static void OnPostProcessBuild(BuildTarget buildTarget, string path)
	{
		if (buildTarget != BuildTarget.iOS) return;

		FixXcodeProject(path);
	}

	private static void FixXcodeProject(string path)
	{
		string projectPath = PBXProject.GetPBXProjectPath(path);
		PBXProject project = new PBXProject();
		project.ReadFromString(File.ReadAllText(projectPath));

		string mainTargetGuid = project.GetUnityMainTargetGuid();
		string unityFrameworkTargetGuid = project.GetUnityFrameworkTargetGuid();

		// 为两个target都添加定义
		string[] targets = { mainTargetGuid, unityFrameworkTargetGuid };

		foreach (var targetGuid in targets)
		{
			if (!string.IsNullOrEmpty(targetGuid))
			{
				project.AddBuildProperty(targetGuid, "OTHER_CFLAGS", "-DBASELIB_INLINE_NAMESPACE=il2cpp_baselib");
			}
		}

		File.WriteAllText(projectPath, project.WriteToString());
	}
}

#endif
