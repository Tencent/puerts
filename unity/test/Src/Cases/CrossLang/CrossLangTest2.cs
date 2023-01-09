using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class CrossLangTest2
    {
        [Test]
        public void PassJSFunctionToAction()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                (function() {
                    CS.Puerts.UnitTest.CrossLangTest2Helper.ArgAction(() => {})
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
                        CS.Puerts.UnitTest.CrossLangTest2Helper.ArgDelegate(() => {})
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
                        CS.Puerts.UnitTest.CrossLangTest2Helper.ArgMulticastDelegate(() => {})
                    })()
                ");
            }, "invalid arguments");
            jsEnv.Tick();
        }
    }

    [UnityEngine.Scripting.Preserve]
    public class CrossLangTest2Helper
    {
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
    }
}