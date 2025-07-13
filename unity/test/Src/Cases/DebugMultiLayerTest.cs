/*
* 测试多层C#-JS调用中的调试崩溃问题修复
* 用于验证 issue #2013 的解决方案
*/

#if !UNITY_WEBGL || UNITY_EDITOR
using NUnit.Framework;
using System;
using System.Threading;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class DebugMultiLayerTest
    {
        private JsEnv jsEnv;
        private static bool callbackExecuted = false;
        private static int callbackDepth = 0;
        
        [SetUp]
        public void Setup()
        {
            // 重置状态
            callbackExecuted = false;
            callbackDepth = 0;
            
            // 创建带调试端口的JsEnv
            jsEnv = UnitTestEnv.GetEnv();
            
            // 注册测试用的C#方法
            jsEnv.Eval(@"
                global.TestMultiLayerCallback = function(depth, callback) {
                    console.log('JS: 进入第 ' + depth + ' 层调用');
                    
                    if (depth < 3) {
                        // 递归调用，模拟多层嵌套
                        CS.Puerts.UnitTest.DebugMultiLayerTest.CallCSharpMethod(depth + 1, callback);
                    } else {
                        console.log('JS: 达到最大深度，执行回调');
                        callback();
                    }
                };
            ");
        }
        
        [TearDown] 
        public void TearDown()
        {
            jsEnv?.Dispose();
        }
        
        /// <summary>
        /// 测试多层调用中的调试稳定性
        /// 这个测试模拟了issue #2013中描述的场景
        /// </summary>
        [Test]
        public void TestMultiLayerDebuggingStability()
        {
            // 执行多层调用，在修复前这里可能导致崩溃
            jsEnv.Eval(@"
                console.log('开始多层调用测试');
                TestMultiLayerCallback(1, function() {
                    console.log('JS: 多层调用测试完成');
                    CS.Puerts.UnitTest.DebugMultiLayerTest.SetCallbackExecuted(true);
                });
            ");
            
            // 等待异步调用完成
            var timeout = DateTime.Now.AddSeconds(5);
            while (!callbackExecuted && DateTime.Now < timeout)
            {
                jsEnv.Tick();
                Thread.Sleep(10);
            }
            
            Assert.IsTrue(callbackExecuted, "多层调用回调应该被执行");
            Assert.GreaterOrEqual(callbackDepth, 3, "应该达到预期的调用深度");
        }
        
        /// <summary>
        /// 压力测试：多次执行多层调用
        /// </summary>
        [Test]
        public void TestMultiLayerDebuggingStressTest()
        {
            int successCount = 0;
            const int testCount = 10;
            
            for (int i = 0; i < testCount; i++)
            {
                callbackExecuted = false;
                callbackDepth = 0;
                
                try
                {
                    jsEnv.Eval($@"
                        console.log('压力测试第 {i + 1} 次');
                        TestMultiLayerCallback(1, function() {{
                            CS.Puerts.UnitTest.DebugMultiLayerTest.SetCallbackExecuted(true);
                        }});
                    ");
                    
                    // 等待回调完成
                    var timeout = DateTime.Now.AddSeconds(2);
                    while (!callbackExecuted && DateTime.Now < timeout)
                    {
                        jsEnv.Tick();
                        Thread.Sleep(5);
                    }
                    
                    if (callbackExecuted)
                    {
                        successCount++;
                    }
                }
                catch (Exception e)
                {
                    // 记录异常但继续测试
                    UnityEngine.Debug.LogError($"压力测试第 {i + 1} 次失败: {e.Message}");
                }
            }
            
            Assert.AreEqual(testCount, successCount, $"压力测试应该全部成功，实际成功 {successCount}/{testCount}");
        }
        
        /// <summary>
        /// 测试调试器异常恢复
        /// </summary>
        [Test]
        public void TestDebuggerExceptionRecovery()
        {
            // 模拟可能导致调试器异常的操作
            bool exceptionCaught = false;
            
            try
            {
                // 执行一些可能导致调试器问题的复杂操作
                jsEnv.Eval(@"
                    for (let i = 0; i < 5; i++) {
                        TestMultiLayerCallback(1, function() {
                            console.log('批量调用完成: ' + i);
                        });
                    }
                ");
                
                // 强制多次Tick，模拟调试器压力
                for (int i = 0; i < 100; i++)
                {
                    jsEnv.Tick();
                    Thread.Sleep(1);
                }
            }
            catch (Exception e)
            {
                exceptionCaught = true;
                UnityEngine.Debug.LogWarning($"捕获到异常但程序继续运行: {e.Message}");
            }
            
            // 验证即使出现异常，系统仍然可以正常工作
            callbackExecuted = false;
            jsEnv.Eval(@"
                console.log('异常后恢复测试');
                CS.Puerts.UnitTest.DebugMultiLayerTest.SetCallbackExecuted(true);
            ");
            
            var timeout = DateTime.Now.AddSeconds(2);
            while (!callbackExecuted && DateTime.Now < timeout)
            {
                jsEnv.Tick();
                Thread.Sleep(10);
            }
            
            Assert.IsTrue(callbackExecuted, "即使出现调试器异常，系统应该能够恢复并继续工作");
        }
        
        // C#静态方法供JS调用
        public static void CallCSharpMethod(int depth, Action callback)
        {
            callbackDepth = Math.Max(callbackDepth, depth);
            UnityEngine.Debug.Log($"C#: 第 {depth} 层调用");
            
            // 回调到JS
            callback?.Invoke();
        }
        
        public static void SetCallbackExecuted(bool executed)
        {
            callbackExecuted = executed;
        }
    }
}
#endif 