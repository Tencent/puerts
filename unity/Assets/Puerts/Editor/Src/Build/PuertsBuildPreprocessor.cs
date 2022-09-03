using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using UnityEditor;
using UnityEngine;

#if UNITY_2018_1_OR_NEWER
public partial class PuertsBuildPreprocessor : UnityEditor.Build.IPreprocessBuildWithReport, UnityEditor.Build.IPostprocessBuildWithReport
#else
public partial class AkBuildPreprocessor : UnityEditor.Build.IPreprocessBuild, UnityEditor.Build.IPostprocessBuild
#endif

{

    public int callbackOrder
    {
        get { return 1; }
    }
    /// <summary>
    /// 可设置激活的插件类型，默认V8,然后根据发布的是 development Debug还是Release而设置
    /// </summary>
    public PuertsBackEndType activateType = PuertsBackEndType.None;
    public void OnPreprocessBuildInternal(UnityEditor.BuildTarget target, string path)
    {
        //激活插件
        PuertsPluginActivator.deactivateAllPlugins();
        if (this.activateType == PuertsBackEndType.None)
        {
            var isDevBuild = UnityEditor.EditorUserBuildSettings.development;
            this.activateType = isDevBuild ? PuertsBackEndType.V8_Debug : PuertsBackEndType.V8_Release;
        }
        PuertsPluginActivator.activatePluginsForDeployment(target, this.activateType, true);
    }
    public static string GetIp { get; } = Dns.GetHostEntry(Dns.GetHostName()).AddressList.FirstOrDefault(p => p.AddressFamily.ToString() == "InterNetwork")?.ToString();
    public void OnPostprocessBuildInternal(UnityEditor.BuildTarget target, string path)
    {

        PuertsPluginActivator.activatePluginsForDeployment(target, this.activateType, false);
    }

#if UNITY_2018_1_OR_NEWER
    public void OnPreprocessBuild(UnityEditor.Build.Reporting.BuildReport report)
    {

        OnPreprocessBuildInternal(report.summary.platform, report.summary.outputPath);
    }

    public void OnPostprocessBuild(UnityEditor.Build.Reporting.BuildReport report)
    {
        OnPostprocessBuildInternal(report.summary.platform, report.summary.outputPath);
    }
#else
		public void OnPreprocessBuild(UnityEditor.BuildTarget target, string path)
	{
		OnPreprocessBuildInternal(target, path);
	}

	public void OnPostprocessBuild(UnityEditor.BuildTarget target, string path)
	{
		OnPostprocessBuildInternal(target, path);
	}
#endif
}