using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Collections;
using System;
using NUnit.Framework;
using System.IO;
using Puerts;

public class Tester : MonoBehaviour {

    public Text m_ContentText;
    public Button m_StartBtn;
    public Button m_StopBtn;

    public bool IsTesting = false;

    void Start() {

        string MockConsoleContent = "";
        IsTesting = true;

        bool hasFail = false;

        StartCoroutine(
            RunTest(
                (string name) => {
                    MockConsoleContent += $"Passed: TestCase {name}\n";
                    UnityEngine.Debug.Log($"Passed: TestCase {name}\n");
                    m_ContentText.text = MockConsoleContent;
                },
                (string name, Exception e) => {
                    MockConsoleContent += $"Failed: TestCase {name}\n";
                    UnityEngine.Debug.LogError($"Failed: TestCase {name}\n");
                    UnityEngine.Debug.LogError(e);
                    m_ContentText.text = MockConsoleContent;
                    hasFail = true;
                },
                () => {
#if !UNITY_EDITOR && !UNITY_WEBGL
                    UnityEngine.Debug.Log("Application.Quit");
                    UnityEngine.Application.Quit(hasFail ? 1 : 0);
#endif
                }
            )
        );
    }

    // 递归获取Android StreamingAssets中的所有文件
    private List<string> GetAndroidStreamingAssetsFiles(string path)
    {
        List<string> fileList = new List<string>();
        
#if UNITY_ANDROID && !UNITY_EDITOR
        try
        {
            using (AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
            using (AndroidJavaObject currentActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
            using (AndroidJavaObject assetManager = currentActivity.Call<AndroidJavaObject>("getAssets"))
            {
                string[] files = assetManager.Call<string[]>("list", path);
                
                foreach (string file in files)
                {
                    string fullPath = string.IsNullOrEmpty(path) ? file : path + "/" + file;
                    
                    // 尝试判断是文件还是目录
                    string[] subFiles = assetManager.Call<string[]>("list", fullPath);
                    
                    if (subFiles != null && subFiles.Length > 0)
                    {
                        // 是目录，递归获取
                        fileList.AddRange(GetAndroidStreamingAssetsFiles(fullPath));
                    }
                    else
                    {
                        // 是文件
                        fileList.Add(fullPath);
                    }
                }
            }
        }
        catch (Exception e)
        {
            Debug.LogError("GetAndroidStreamingAssetsFiles error: " + e.Message);
        }
#endif
        
        return fileList;
    }

    private IEnumerator CopyPythonDir()
    {
        string _destDir = Path.Combine(Application.persistentDataPath, "python");
        // 先删除旧目录（防止脏数据）
        if (Directory.Exists(_destDir))
            Directory.Delete(_destDir, true);

        // 创建目标目录
        Directory.CreateDirectory(_destDir);

        List<string> allFiles = new List<string>();

#if UNITY_ANDROID && !UNITY_EDITOR
        // Android平台：使用AssetManager动态枚举文件
        Debug.Log("Android platform: enumerating files using AssetManager");
        allFiles = GetAndroidStreamingAssetsFiles("python");
        Debug.Log($"Found {allFiles.Count} files in StreamingAssets/python");
#else
        // 其他平台：直接使用文件系统
        string srcRoot = Path.Combine(Application.streamingAssetsPath, "python");
        if (Directory.Exists(srcRoot))
        {
            string[] files = Directory.GetFiles(srcRoot, "*", SearchOption.AllDirectories);
            foreach (string file in files)
            {
                string relativePath = file.Substring(srcRoot.Length + 1).Replace("\\", "/");
                allFiles.Add("python/" + relativePath);
            }
        }
        else
        {
            Debug.LogError("StreamingAssets/python directory not found");
            yield break;
        }
#endif

        // 复制所有文件
        foreach (string relativePath in allFiles)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                continue;

            string srcFile = Path.Combine(Application.streamingAssetsPath, relativePath);
            // 移除 "python/" 前缀
            string destRelativePath = relativePath.Replace("python/", "");
            string dstFile = Path.Combine(_destDir, destRelativePath);

            // 创建子目录
            string dstDir = Path.GetDirectoryName(dstFile);
            if (!string.IsNullOrEmpty(dstDir) && !Directory.Exists(dstDir))
                Directory.CreateDirectory(dstDir);

            // 使用UnityWebRequest拷贝文件（兼容Android）
            using (var fileReq = UnityEngine.Networking.UnityWebRequest.Get(srcFile))
            {
                yield return fileReq.SendWebRequest();
                if (fileReq.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    if (fileReq.downloadHandler != null && fileReq.downloadHandler.data != null)
                    {
                        File.WriteAllBytes(dstFile, fileReq.downloadHandler.data);
                        Debug.Log($"Copied: {relativePath}");
                    }
                    else
                    {
                        Debug.LogWarning($"Copy fail: {srcFile} -> {dstFile}, downloadHandler.data is null");
                    }
                }
                else
                {
                    Debug.LogWarning($"Copy fail: {srcFile} -> {dstFile}, error: {fileReq.error}");
                }
            }
        }

        // 标记已安装
        PlayerPrefs.SetInt("PythonInstalled", 1);
        PlayerPrefs.Save();
        Debug.Log("Python installed to " + _destDir);
    }

    private IEnumerator RunTest(
        Action<string> OnSuccess, 
        Action<string, Exception> OnFail,
        Action OnEnd
    )
    {
        if (Application.platform == RuntimePlatform.Android)
        {
            if (PlayerPrefs.GetInt("PythonInstalled", 0) != 1)
            {
                yield return StartCoroutine(CopyPythonDir());
            }
            int res = Puerts.PapiPythonNative.InitPythonByHome(Path.Combine(Application.persistentDataPath, "python"));
            UnityEngine.Debug.Log("InitPythonByHome res: " + res);
        }

        UnityEngine.Debug.Log("Start RunTest");
        var types = from assembly in AppDomain.CurrentDomain.GetAssemblies()
                    // where !(assembly.ManifestModule is System.Reflection.Emit.ModuleBuilder)
                    from type in assembly.GetTypes()
                    where type.IsDefined(typeof(TestFixtureAttribute), false)
                    select type;

        foreach (var type in types)
        {
            var testInstance = System.Activator.CreateInstance(type);

            foreach (var method in type.GetMethods(BindingFlags.Instance | BindingFlags.Public
                | BindingFlags.NonPublic | BindingFlags.DeclaredOnly))
            {
                foreach (var ca in method.GetCustomAttributes(false))
                {
                    yield return null;
                    if (IsTesting && ca.GetType() == typeof(TestAttribute)) 
                    {
                        // if (method.Name != "DateTimeTest") continue;
                        // if (!method.DeclaringType.Name.Contains("AccessControlTest")) continue;
                        UnityEngine.Debug.Log($"Started: TestCase {method.Name}\n");
                        try 
                        {
                            method.Invoke(testInstance, null);
                        } 
                        catch (TargetInvocationException e) 
                        {
                            OnFail(method.Name, e.GetBaseException());
                            continue;
                        }
                        catch (Exception e) 
                        {
                            OnFail(method.Name, e);
                            continue;
                        }
                        OnSuccess(method.Name);
                    }
                }
            }        
        }
		UnityEngine.Debug.Log("End RunTest");
        OnEnd();    
    }
}