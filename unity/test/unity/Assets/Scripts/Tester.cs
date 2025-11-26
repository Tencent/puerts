using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Collections;
using System;
using NUnit.Framework;
using System.IO;
using System.IO.Compression;
using System.Threading.Tasks;
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



    // 获取Python目录路径（Android使用内部存储，其他平台使用persistentDataPath）
    private string GetPythonDir()
    {
#if UNITY_ANDROID && !UNITY_EDITOR
        // 在Android上使用getFilesDir()，这个路径在permitted_paths中，允许加载.so文件
        using (AndroidJavaClass unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
        using (AndroidJavaObject currentActivity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
        using (AndroidJavaObject filesDir = currentActivity.Call<AndroidJavaObject>("getFilesDir"))
        {
            string filesDirPath = filesDir.Call<string>("getAbsolutePath");
            string pythonDir = Path.Combine(filesDirPath, "python");
            Debug.Log($"Using Android internal storage: {pythonDir}");
            return pythonDir;
        }
#else
        return Path.Combine(Application.persistentDataPath, "python");
#endif
    }

    private IEnumerator CopyPythonDir(string _destDir)
    {
        // 先删除旧目录（防止脏数据）
        if (Directory.Exists(_destDir))
        {
            Debug.Log($"Deleting old Python directory: {_destDir}");
            Directory.Delete(_destDir, true);
        }

        // 下载 python.zip
        string zipUrl = Path.Combine(Application.streamingAssetsPath, "python.zip");
        string tempZipPath = Path.Combine(Application.temporaryCachePath, "python.zip");

        Debug.Log($"Downloading python.zip from {zipUrl}");
        
        using (var zipReq = UnityEngine.Networking.UnityWebRequest.Get(zipUrl))
        {
            yield return zipReq.SendWebRequest();
            
            if (zipReq.result != UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                Debug.LogError($"Failed to download python.zip: {zipReq.error}");
                yield break;
            }
            
            if (zipReq.downloadHandler == null || zipReq.downloadHandler.data == null)
            {
                Debug.LogError("python.zip download handler data is null");
                yield break;
            }
            
            // 保存到临时目录
            File.WriteAllBytes(tempZipPath, zipReq.downloadHandler.data);
            Debug.Log($"Downloaded python.zip ({zipReq.downloadHandler.data.Length} bytes) to {tempZipPath}");
        }

        // 异步解压（避免阻塞主线程）
        Debug.Log($"Extracting python.zip to {_destDir}");
        
        bool extractDone = false;
        Exception extractError = null;
        
        Task.Run(() =>
        {
            try
            {
                // 获取目标目录的父目录
                string parentDir = Path.GetDirectoryName(_destDir);
                if (!Directory.Exists(parentDir))
                    Directory.CreateDirectory(parentDir);
                
                // 直接解压到父目录
                ZipFile.ExtractToDirectory(tempZipPath, parentDir);
                
                // 检查解压结果
                if (!Directory.Exists(_destDir))
                {
                    throw new Exception($"Extraction failed: {_destDir} does not exist after extraction");
                }
            }
            catch (Exception e)
            {
                extractError = e;
            }
            finally
            {
                extractDone = true;
            }
        });
        
        // 等待解压完成
        while (!extractDone)
        {
            yield return null;
        }
        
        if (extractError != null)
        {
            Debug.LogError($"Extract failed: {extractError}");
            yield break;
        }
        
        // 删除临时 zip 文件
        try
        {
            if (File.Exists(tempZipPath))
                File.Delete(tempZipPath);
        }
        catch (Exception e)
        {
            Debug.LogWarning($"Failed to clean temp zip file: {e.Message}");
        }
        
        // 标记已安装
        PlayerPrefs.SetInt("PythonInstalled", 1);
        PlayerPrefs.Save();
        
        Debug.Log($"Python successfully installed to {_destDir}");
    }

    private IEnumerator RunTest(
        Action<string> OnSuccess, 
        Action<string, Exception> OnFail,
        Action OnEnd
    )
    {
#if FORCE_TEST_PYTHON
		if (Application.platform == RuntimePlatform.Android)
        {
            string pythonDir = GetPythonDir();
            if (PlayerPrefs.GetInt("PythonInstalled", 0) != 1)
            {
                yield return StartCoroutine(CopyPythonDir(pythonDir));
            }
            
            int res = Puerts.PapiPythonNative.InitPythonByHome(pythonDir);
            UnityEngine.Debug.Log($"InitPythonByHome with path: {pythonDir}, result: {res}");
        }
#endif

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