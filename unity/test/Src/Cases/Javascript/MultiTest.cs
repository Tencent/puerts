using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class MultiEnvTestA
    {
        int number;

        [UnityEngine.Scripting.Preserve]
        public MultiEnvTestA(int a) { number = a; }

        [UnityEngine.Scripting.Preserve]
        public int GetA() 
        {
            return number;
        }

        [UnityEngine.Scripting.Preserve]
        public static MultiEnvTestA CreateA() 
        {
            return new MultiEnvTestA(3);
        }
    }
    
    [UnityEngine.Scripting.Preserve]
    public class MultiEnvTestB
    {
        int number;

        [UnityEngine.Scripting.Preserve]
        public MultiEnvTestB(int b) { number = b; }

        [UnityEngine.Scripting.Preserve]
        public int GetB() 
        {
            return number;
        }

        [UnityEngine.Scripting.Preserve]
        public static MultiEnvTestB CreateB() 
        {
            return new MultiEnvTestB(3);
        }
    }
    public class Ability
    {
        public string Name;
        public Ability(string name)
        {
            this.Name = name;
        }
    }
    public class Character
    {
        public string Name;
        public Character(string name)
        {
            this.Name = name;
        }
    }
    public static class Randomer
    {
        private static List<Ability> AbilityList = new List<Ability>{
            new Ability("froze"),
            new Ability("fire"),
            new Ability("wind"),
            new Ability("rock"),
            new Ability("electric"),
            new Ability("kick"),
            new Ability("wheel kick"),
            new Ability("punch"),
            new Ability("up punch"),
        };

        private static List<Character> CharacterList = new List<Character>{
            new Character("nancy"),
            new Character("lily"),
            new Character("erica"),
            new Character("patrica"),
            new Character("jennifier"),
            new Character("lina"),
            new Character("lancy"),
            new Character("buncy"),
            new Character("kuncy"),
        };

        public static Ability GetRandomAbility()
        {
            var R = new Random();
            return AbilityList[R.Next(0, AbilityList.Count)];
        }
        public static Character GetRandomCharacter()
        {
            var R = new Random();
            return CharacterList[R.Next(0, CharacterList.Count)];
        }
    }

    [TestFixture]
    public class MultiTest
    {
        // [Test]
        // public void MultiThread()
        // {
        //     var jsEnv = new JsEnv(new TxtLoader());
        //     var task = new Task(() =>
        //     {
        //         var env = new JsEnv(new TxtLoader());
        //         env.Eval(@"
        //             const CS = require('csharp');
        //             setInterval(()=> {
        //                 CS.System.Console.WriteLine(2 + ' : ' + CS.PuertsTest.Randomer.GetRandomAbility().Name);
        //             }, 100)
        //         ");
        //         while (true)
        //         {
        //             env.Tick();
        //         }
        //     });
        //     task.Start();
        //     jsEnv.Eval(@"
        //         const CS = require('csharp');
        //         setInterval(()=> {
        //             CS.System.Console.WriteLine(1 + ' : ' + CS.PuertsTest.Randomer.GetRandomCharacter().Name);
        //         }, 100)
        //     ");
        //     while (true)
        //     {
        //         jsEnv.Tick();
        //     }
        // }

#if !UNITY_WEBGL
        [Test]
        public void MultiEnv() {
#if PUERTS_GENERAL
            var backend1 = System.Activator.CreateInstance(PuertsIl2cpp.TypeUtils.GetType("Puerts.BackendV8"), new TxtLoader()) as Backend;
            var jsEnv1 = new ScriptEnv(backend1);
            var backend2 = System.Activator.CreateInstance(PuertsIl2cpp.TypeUtils.GetType("Puerts.BackendV8"), new TxtLoader()) as Backend;
            var jsEnv2 = new ScriptEnv(backend2);
#else
            var backend1 = System.Activator.CreateInstance(PuertsIl2cpp.TypeUtils.GetType("Puerts.BackendV8"), new UnitTestLoader()) as Backend;
            var jsEnv1 = new ScriptEnv(backend1);
            var backend2 = System.Activator.CreateInstance(PuertsIl2cpp.TypeUtils.GetType("Puerts.BackendV8"), new UnitTestLoader()) as Backend;
            var jsEnv2 = new ScriptEnv(backend2);
#endif

            jsEnv1.Eval(@"
                (function() {
                    const A = CS.Puerts.UnitTest.MultiEnvTestA;
                    const B = CS.Puerts.UnitTest.MultiEnvTestB;

                    A.CreateA().GetA();
                    B.CreateB().GetB();
                    A.CreateA().GetA();
                    B.CreateB().GetB();
                    A.CreateA().GetA();
                    B.CreateB().GetB();
                })();
            ");
            jsEnv2.Eval(@"
                (function() {
                    const A = CS.Puerts.UnitTest.MultiEnvTestA;
                    const B = CS.Puerts.UnitTest.MultiEnvTestB;

                    A.CreateA().GetA();
                    B.CreateB().GetB();
                    A.CreateA().GetA();
                    B.CreateB().GetB();
                    A.CreateA().GetA();
                    B.CreateB().GetB();
                })();
            ");
            
            jsEnv2.Backend.LowMemoryNotification();
            
            jsEnv1.Eval(@"
                (function() {
                    const A = CS.Puerts.UnitTest.MultiEnvTestA;
                    const B = CS.Puerts.UnitTest.MultiEnvTestB;

                    A.CreateA().GetA();
                    B.CreateB().GetB();
                    A.CreateA().GetA();
                    B.CreateB().GetB();
                    A.CreateA().GetA();
                    B.CreateB().GetB();
                })();
            ");
            
            Assert.True(true);
        }
#endif

#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void MultiDiffBackend()
        {
            string backendStr = null;
            string errMsg = null;
            bool createEnvSucess = false;
            Action<string> Log = (string msg) =>
            {
#if PUERTS_GENERAL
                Console.WriteLine(msg);
#else
                UnityEngine.Debug.Log(msg);
#endif
            };
            ScriptEnv jsEnv = null;
            Backend backend = null;
            try
            {
                backend = System.Activator.CreateInstance(PuertsIl2cpp.TypeUtils.GetType("Puerts.BackendV8"), UnitTestEnv.GetLoader()) as Backend;
                jsEnv = new ScriptEnv(backend);
                backendStr = jsEnv.Eval<string>(@"((typeof gc) != 'undefined' || (typeof v8) != 'undefined') ? 'v8': 'quickjs';");
                jsEnv.Dispose();
                createEnvSucess = true;
            }
            catch(Exception e)
            {
                errMsg = e.ToString();
            }
            if (createEnvSucess)
            {
                Log("create v8 backend success");
                Assert.AreEqual("v8", backendStr);
                Assert.True(backend is BackendV8 || backend.GetType().Name == "BackendNodeJS");
            }
            else
            {
                Log("create v8 backend fail: " + errMsg);
                Assert.True(errMsg.Contains("BackendV8"));
            }

            backendStr = null;
            errMsg = null;
            createEnvSucess = false;
            jsEnv = null;
            backend = null;
            try
            {
                backend = System.Activator.CreateInstance(PuertsIl2cpp.TypeUtils.GetType("Puerts.BackendQuickJS"), UnitTestEnv.GetLoader()) as Backend;
                jsEnv = new ScriptEnv(backend);
                backendStr = jsEnv.Eval<string>(@"((typeof gc) != 'undefined' || (typeof v8) != 'undefined') ? 'v8': 'quickjs';");
                jsEnv.Dispose();
                createEnvSucess = true;
            }
            catch (Exception e)
            {
                errMsg = e.ToString();
            }
            if (createEnvSucess)
            {
                Log("create quickjs backend success");
                Assert.AreEqual("quickjs", backendStr);
                Assert.True(backend is BackendQuickJS);
            }
            else
            {
                Log("create quickjs backend fail: " + errMsg);
                Assert.True(errMsg.Contains("BackendQuickJS"));
            }
        }
#endif

#if UNITY_WEBGL && !UNITY_EDITOR
        [Test]
        public void WebGLAndQuickjsBackend()
        {
            var jsEnv1 = new ScriptEnv(new BackendQuickJS(UnitTestEnv.GetLoader()));
            var res = jsEnv1.Eval<string>("'hello'");
            Assert.AreEqual("hello", res);

            Assert.Catch(() =>
            {
                new ScriptEnv(new BackendWebGL(UnitTestEnv.GetLoader()));
            });
        }
#endif
    }
}