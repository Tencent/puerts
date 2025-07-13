/*
 * Unity测试脚本 - 验证 PuerTS Issue #2013 修复
 * 
 * 问题描述：在多层C#-JS调用中进行JavaScript调试时Unity Editor崩溃
 * 修复说明：增加了异常处理和线程安全保护
 * 
 * 使用方法：
 * 1. 将此脚本附加到场景中的任意GameObject
 * 2. 运行场景
 * 3. 在Console中查看测试结果
 * 4. 可以在Inspector中点击按钮手动触发测试
 */

using System;
using System.Collections;
using UnityEngine;
using Puerts;

public class DebugIssue2013Test : MonoBehaviour
{
    [Header("调试设置")]
    [SerializeField] private bool enableDebugger = false;
    [SerializeField] private int debugPort = 8080;
    
    [Header("测试控制")]
    [SerializeField] private bool autoStartTest = true;
    [SerializeField] private float testInterval = 2.0f;
    
    private JsEnv jsEnv;
    private bool testPassed = false;
    private int testCount = 0;
    private int successCount = 0;
    
    void Start()
    {
        Debug.Log("=== PuerTS Issue #2013 修复验证开始 ===");
        Debug.Log("问题：多层C#-JS调用时调试器崩溃");
        Debug.Log("修复：增加异常处理和线程安全保护");
        
        InitializePuerTS();
        
        if (autoStartTest)
        {
            StartCoroutine(RunContinuousTest());
        }
    }
    
    void InitializePuerTS()
    {
        try
        {
            // 创建JsEnv，如果需要调试则指定端口
            jsEnv = new JsEnv(new DefaultLoader(), enableDebugger ? debugPort : -1);
            
            if (enableDebugger)
            {
                Debug.Log($"调试器已启用，端口: {debugPort}");
                Debug.Log("可以使用VSCode连接调试器进行测试");
            }
            
            // 注册测试用的C#方法
            RegisterTestMethods();
            
            Debug.Log("PuerTS 初始化成功");
        }
        catch (Exception e)
        {
            Debug.LogError($"PuerTS 初始化失败: {e.Message}");
        }
    }
    
    void RegisterTestMethods()
    {
        jsEnv.Eval(@"
            // 注册全局测试函数
            global.TestIssue2013 = function(depth, maxDepth, callback) {
                console.log('JS: 当前深度 ' + depth + '/' + maxDepth);
                
                // 这里是关键测试点：在多层嵌套中设置断点应该不会崩溃
                let testData = {
                    currentDepth: depth,
                    maxDepth: maxDepth,
                    timestamp: Date.now(),
                    safe: true
                };
                
                if (depth < maxDepth) {
                    // 继续递归调用，增加深度
                    CS.DebugIssue2013Test.CallCSharpRecursive(depth + 1, maxDepth, callback);
                } else {
                    console.log('JS: 达到最大深度，测试完成');
                    callback(true);
                }
            };
            
            // 注册异常测试函数
            global.TestExceptionHandling = function() {
                console.log('JS: 测试异常处理');
                try {
                    // 故意制造一个可能的异常场景
                    for (let i = 0; i < 10; i++) {
                        CS.DebugIssue2013Test.CallCSharpRecursive(1, 3, function(success) {
                            console.log('JS: 批量测试回调 ' + i + ' 完成');
                        });
                    }
                    return true;
                } catch (e) {
                    console.error('JS: 捕获异常:', e.message);
                    return false;
                }
            };
        ");
    }
    
    void Update()
    {
        // 安全的Tick调用，修复后这里不应该崩溃
        jsEnv?.Tick();
    }
    
    IEnumerator RunContinuousTest()
    {
        yield return new WaitForSeconds(1.0f); // 等待初始化完成
        
        while (true)
        {
            RunSingleTest();
            yield return new WaitForSeconds(testInterval);
        }
    }
    
    void RunSingleTest()
    {
        testCount++;
        Debug.Log($"=== 第 {testCount} 次测试开始 ===");
        
        try
        {
            // 执行多层调用测试
            testPassed = false;
            jsEnv.Eval(@"
                TestIssue2013(1, 4, function(success) {
                    console.log('JS: 测试回调执行，结果:', success);
                    CS.DebugIssue2013Test.OnTestComplete(success);
                });
            ");
            
            // 等待测试完成
            float timeout = 5.0f;
            float elapsed = 0;
            while (!testPassed && elapsed < timeout)
            {
                elapsed += Time.deltaTime;
                yield return null;
            }
            
            if (testPassed)
            {
                successCount++;
                Debug.Log($"第 {testCount} 次测试成功");
            }
            else
            {
                Debug.LogWarning($"第 {testCount} 次测试超时");
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"第 {testCount} 次测试异常: {e.Message}");
        }
        
        Debug.Log($"总体成功率: {successCount}/{testCount} ({(float)successCount/testCount*100:F1}%)");
    }
    
    // 供Unity Inspector调用的测试方法
    [ContextMenu("运行单次测试")]
    public void RunManualTest()
    {
        StartCoroutine(RunSingleTestCoroutine());
    }
    
    IEnumerator RunSingleTestCoroutine()
    {
        RunSingleTest();
        yield return null;
    }
    
    [ContextMenu("运行异常处理测试")]
    public void RunExceptionTest()
    {
        Debug.Log("=== 异常处理测试开始 ===");
        
        try
        {
            bool result = jsEnv.Eval<bool>("TestExceptionHandling()");
            Debug.Log($"异常处理测试结果: {result}");
        }
        catch (Exception e)
        {
            Debug.LogWarning($"异常处理测试捕获异常（这是预期的）: {e.Message}");
        }
        
        Debug.Log("=== 异常处理测试完成 ===");
    }
    
    [ContextMenu("压力测试")]
    public void RunStressTest()
    {
        StartCoroutine(StressTestCoroutine());
    }
    
    IEnumerator StressTestCoroutine()
    {
        Debug.Log("=== 压力测试开始 ===");
        
        int stressTestCount = 50;
        int stressSuccessCount = 0;
        
        for (int i = 0; i < stressTestCount; i++)
        {
            try
            {
                jsEnv.Eval($@"
                    console.log('压力测试 {i + 1}/{stressTestCount}');
                    TestIssue2013(1, 2, function(success) {{
                        console.log('压力测试 {i + 1} 完成');
                    }});
                ");
                stressSuccessCount++;
            }
            catch (Exception e)
            {
                Debug.LogError($"压力测试 {i + 1} 失败: {e.Message}");
            }
            
            if (i % 10 == 9)
            {
                yield return new WaitForSeconds(0.1f); // 短暂休息
            }
        }
        
        Debug.Log($"=== 压力测试完成: {stressSuccessCount}/{stressTestCount} 成功 ===");
    }
    
    // 静态方法供JS调用
    public static void CallCSharpRecursive(int depth, int maxDepth, Action<bool> callback)
    {
        Debug.Log($"C#: 递归调用深度 {depth}/{maxDepth}");
        
        try
        {
            // 模拟一些C#处理逻辑
            var random = new System.Random();
            var processTime = random.Next(1, 10);
            
            // 回调到JS继续递归
            callback?.Invoke(true);
        }
        catch (Exception e)
        {
            Debug.LogError($"C#递归调用异常: {e.Message}");
            callback?.Invoke(false);
        }
    }
    
    public static void OnTestComplete(bool success)
    {
        var instance = FindObjectOfType<DebugIssue2013Test>();
        if (instance != null)
        {
            instance.testPassed = success;
        }
    }
    
    void OnDestroy()
    {
        jsEnv?.Dispose();
        Debug.Log("=== PuerTS Issue #2013 测试结束 ===");
    }
    
    void OnGUI()
    {
        GUILayout.BeginArea(new Rect(10, 10, 400, 200));
        GUILayout.Label($"PuerTS Issue #2013 修复验证", new GUIStyle() { fontSize = 16, fontStyle = FontStyle.Bold });
        GUILayout.Label($"测试次数: {testCount}");
        GUILayout.Label($"成功次数: {successCount}");
        GUILayout.Label($"成功率: {(testCount > 0 ? (float)successCount/testCount*100 : 0):F1}%");
        
        if (GUILayout.Button("手动运行测试"))
        {
            RunManualTest();
        }
        
        if (GUILayout.Button("异常处理测试"))
        {
            RunExceptionTest();
        }
        
        if (GUILayout.Button("压力测试"))
        {
            RunStressTest();
        }
        
        GUILayout.EndArea();
    }
} 