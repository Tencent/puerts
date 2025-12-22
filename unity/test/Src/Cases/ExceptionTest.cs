using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class ExceptionTestHelper
    {
        [UnityEngine.Scripting.Preserve]
        public struct TestStruct { 
            public int Age; 
            public TestStruct(int a) { Age = a; } 
            public TestStruct(bool a) { 
                // testing checkJSArguments
                Age = 0;
            } 
        }
        [UnityEngine.Scripting.Preserve]
        public class TestBaseClass { 
        }
        [UnityEngine.Scripting.Preserve]
        public class TestDerivedClass: TestBaseClass { 
        }

        [UnityEngine.Scripting.Preserve]
        public static void ArgAction(Action d) {
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgAction() {
            // just testing checkJSArguments
        }

        [UnityEngine.Scripting.Preserve]
        public static void ArgDelegate(Delegate d) {
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgDelegate() {
            // just testing checkJSArguments
        }

        [UnityEngine.Scripting.Preserve]
        public static void ArgMulticastDelegate(MulticastDelegate d) {
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgMulticastDelegate() {
            // just testing checkJSArguments
        }

        [UnityEngine.Scripting.Preserve]
        public static long ArgLong(long l) {
            // no checkJSArguments
            return l;
        }

        
        [UnityEngine.Scripting.Preserve]
        public static void ArgInt(int i) {
            
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgInt() {
            // testing checkJSArguments
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgStruct(TestStruct s) {
            
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgStruct() {
            // testing checkJSArguments
        }
        
        [UnityEngine.Scripting.Preserve]
        public static void ArgRefStruct(ref TestStruct s) {
            
        }
        [UnityEngine.Scripting.Preserve]
        public static void ArgRefStruct() {
            // testing checkJSArguments
        }

        [UnityEngine.Scripting.Preserve]
        public string ArgDerivedClass(TestDerivedClass obj, int a, string b)
        {
            return b;
        }
    }

    [TestFixture]
    public class ExceptionTest
    {
        [Test]
        public void PassJSFunctionToAction()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    CS.Puerts.UnitTest.ExceptionTestHelper.ArgAction(() => {})
                })()
            ");
            jsEnv.Tick();
        }
        [Test]
        public void PassJSFunctionToDelegate()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(()=> {
                jsEnv.Eval(@"
                    (function() {
                        CS.Puerts.UnitTest.ExceptionTestHelper.ArgDelegate(() => {})
                    })()
                ");
            }, "invalid arguments");
            jsEnv.Tick();
        }
        [Test]
        public void PassJSFunctionToMulticastDelegate()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(()=> {
                jsEnv.Eval(@"
                    (function() {
                        CS.Puerts.UnitTest.ExceptionTestHelper.ArgMulticastDelegate(() => {})
                    })()
                ");
            }, "invalid arguments");
            jsEnv.Tick();
        }
#if !UNITY_WEBGL
        [Test]
        public void PassObjectToLong()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            long ret = jsEnv.Eval<long>(@"
                (function() {
                    return CS.Puerts.UnitTest.ExceptionTestHelper.ArgLong({})
                })()
            ");
            Assert.AreEqual(ret, 0);
            jsEnv.Tick();
        }
#endif
        [Test]
        public void FunctionNotExistsException()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(()=> {
                jsEnv.Eval(@"
                    (function() {
                        let obj = new CS.Puerts.UnitTest.ExceptionTestHelper();
                        obj.adds(1, 2);
                    })()
                ");
            });
            jsEnv.Tick();
        }

        [Test]
        public void InvalidArgumentsException()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(()=> {
                jsEnv.Eval(@"
                    (function() {
                        return CS.Puerts.UnitTest.ExceptionTestHelper.ArgInt('gloria')
                    })()
                ");
            });
            jsEnv.Tick();
        }

        [Test]
        public void InvalidStructArgumentsException()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(()=> {
                jsEnv.Eval(@"
                    (function() {
                        let s = new CS.Puerts.UnitTest.ExceptionTestHelper.TestStruct(1);

                        return CS.Puerts.UnitTest.ExceptionTestHelper.ArgStruct('gloria')
                    })()
                ");
            });
            jsEnv.Tick();
        }
		/*
        [Test]
        public void PolymorphismMismatchedArgumentsException()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(()=> {
                jsEnv.Eval(@"
                    (function() {
                        let tbc = new CS.Puerts.UnitTest.ExceptionTestHelper.TestBaseClass();
                        let helper = new CS.Puerts.UnitTest.ExceptionTestHelper();
                        helper.ArgDerivedClass(tbc, 1, 'gloria')
                    })()
                ");
            });
            jsEnv.Tick();
        }
		*/
        [Test]
        public void InvalidRefStructArgumentsException()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                jsEnv.Eval(@"
                    (function() {
                        let tbc = new CS.Puerts.UnitTest.ExceptionTestHelper.TestStruct(1);
                        return CS.Puerts.UnitTest.ExceptionTestHelper.ArgRefStruct(ts)
                    })()
                ");
            });
            jsEnv.Tick();
        }

        [Test]
        public void ConstructorArgumentsTypeMismatchedException()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                jsEnv.Eval(@"
                    (function() {
                        new CS.Puerts.UnitTest.ExceptionTestHelper.TestStruct('expect to be a int');
                    })()
                ");
            });
            jsEnv.Tick();
        }

        // [Test]
        // public void JsEnvCreateFailedException()
        // {
        //     var loader = new UnitTestLoader();
        //     loader.AddMockFileContent("puerts/events.mjs", @" throw new Error('expected exception') ");

        //     JsEnv env = null;
        //     var oldEnvList = JsEnv.jsEnvs;
        //     JsEnv.jsEnvs = new System.Collections.Generic.List<JsEnv>();

        //     try
        //     {
        //         env = new JsEnv(loader);
        //     }
        //     catch (Exception ex)
        //     {
        //         Assert.True(ex.Message.Contains("expected exception"));
        //         Assert.True(env == null);
        //         Assert.True(JsEnv.jsEnvs.Count == 1);
        //         Assert.True(JsEnv.jsEnvs[0] == null);
        //         JsEnv.jsEnvs = oldEnvList;
        //         return;
        //     }

        //     JsEnv.jsEnvs = oldEnvList;
        //     Assert.True(false);
        // }
#if !UNITY_WEBGL
        [Test]
        public void UnhandledRejectionHandle()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    global.catched = false;
                    puerts.on('unhandledRejection', function(reason) {
                        global.catched = true;
                    });
                    new Promise((resolve, reject)=>{
                        throw new Error('unhandled rejection');
                    });
                })()
            ");
            var res = jsEnv.Eval<bool>("global.catched");
            Assert.True(res);
        }
#endif
        [Test]
        public void UnhandledRejectionCancel()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    global.catched = false;
                    puerts.on('unhandledRejection', function(reason) {
                        global.catched = true;
                    });
                    new Promise((resolve, reject)=>{
                        throw new Error('unhandled rejection');
                    }).catch(error => {});
                })()
            ");
            var res = jsEnv.Eval<bool>("global.catched");
            Assert.False(res);
        }
        
        // [Test]
        // public void JSGetLastException()
        // {
        //     var loader = new TxtLoader();
        //     var jsEnv = new JsEnv(loader);
        //     try
        //     {
        //         jsEnv.Eval(@"
        //             throw new Error('hello error');
        //         ");
        //     }
        //     catch (Exception e) { }

        //     string jsErrorMessage = jsEnv.Eval<string>(@"
        //         puerts.getLastException().message
        //     ");
        //     Assert.True(jsErrorMessage == "hello error");
        //     jsEnv.Dispose();
        // }
        
        [Test]
        public void ThrowNull()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                jsEnv.Eval(@"
                    (function() {
                        throw null;
                    })()
                ");
            });
            jsEnv.Tick();
        }
        
        [Test]
        public void ThrowUndefined()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                jsEnv.Eval(@"
                    (function() {
                        throw undefined;
                    })()
                ");
            });
            jsEnv.Tick();
        }
        
        [Test]
        public void ThrowNullInModule()
        {
            var loader = UnitTestEnv.GetLoader();
            loader.AddMockFileContent("throw-null/whatever.mjs", @"(function() {throw null;})()");
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                jsEnv.ExecuteModule("throw-null/whatever.mjs");
            });
            jsEnv.Tick();
        }
        
        [Test]
        public void ThrowUndefinedInModule()
        {
            var loader = UnitTestEnv.GetLoader();
            loader.AddMockFileContent("throw-undefined/whatever.mjs", @"(function() {throw undefined;})()");
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                jsEnv.ExecuteModule("throw-undefined/whatever.mjs");
            });
            jsEnv.Tick();
        }
        
        [Test]
        public void ThrowNullInFunction()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                var foo = jsEnv.Eval<Action>(@"
                    function t() {
                        throw null;
                    }
                    t;
                ");
                foo();
            });
            jsEnv.Tick();
        }
        
        [Test]
        public void ThrowUndefinedInFunction()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                var foo = jsEnv.Eval<Action>(@"
                    function t() {
                        throw undefined;
                    }
                    t;
                ");
                foo();
            });
            jsEnv.Tick();
        }

        [Test]
        public void QuickjsStackOverflowTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            ConsumeStackAndCallJs(8 * 1024, jsEnv);
        }

        void ConsumeStackAndCallJs(int loop, JsEnv jsEnv)
        {
            if (loop > 0)
            {
                ConsumeStackAndCallJs(loop - 1, jsEnv);
            }
            else
            {
                jsEnv.Eval(@"
                function foo(p) { return p;}
                foo(1);
                ");
            }
        }

        static string anrStackTrace = null;

        [MonoPInvokeCallback(typeof(InterruptCallback))]
        internal static void OnStackCallback(IntPtr str, int strlen)
        {
            //关键点2：切记回调不能抛C#异常
            try
            {
                byte[] buffer = new byte[strlen + 1];
                System.Runtime.InteropServices.Marshal.Copy(str, buffer, 0, strlen);
                anrStackTrace = System.Text.Encoding.UTF8.GetString(buffer, 0, strlen);
            }
            catch (Exception e)
            {
                //用例需要，业务可以选择直接忽略异常
                anrStackTrace = e.StackTrace;
            }
        }

#if !UNITY_WEBGL
        [Test]
        public void ANRTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            if (!(jsEnv.Backend is BackendV8)) return;
            var t = new System.Threading.Thread(() =>
            {
                System.Threading.Thread.Sleep(300);
                PuertsDLL.InterruptWithStackCallback(jsEnv.Isolate, OnStackCallback);
                // 关键点1：徐等待OnStackCallback回调，如果马上调用TerminateExecution，可能拿不到堆栈信息
                System.Threading.Thread.Sleep(200); // wait for stack trace to be captured
                PuertsDLL.TerminateExecution(jsEnv.Isolate);
            });
            t.Start();
            Assert.Catch(() =>
            {
                jsEnv.Eval(@"
                    function func1() {
                        while(true) {
                        }
                    }
                    function func2() {
                        func1();
                    }
                    function func3() {
                        func2();
                    }
                    function main() {
                        func3();
                    }
                    main();
                ");
            });

            Assert.True(System.Text.RegularExpressions.Regex.IsMatch(anrStackTrace, @"\s+at func1\(.*\)\s+at func2\(.*\)\s+at func3\(.*\)\s+at main\(.*\)", System.Text.RegularExpressions.RegexOptions.Multiline));
        }
#endif
    }
}