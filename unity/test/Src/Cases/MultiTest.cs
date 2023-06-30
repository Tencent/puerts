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
            var jsEnv1 = new JsEnv(new TxtLoader());
            var jsEnv2 = new JsEnv(new TxtLoader());
#else
            var jsEnv1 = new JsEnv(new UnitTestLoader());
            var jsEnv2 = new JsEnv(new UnitTestLoader());
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
            
            if (jsEnv2.Backend is BackendV8)
                (jsEnv2.Backend as BackendV8).LowMemoryNotification();
            else if (jsEnv2.Backend is BackendNodeJS)
                (jsEnv2.Backend as BackendNodeJS).LowMemoryNotification();
            else if (jsEnv2.Backend is BackendQuickJS)
                (jsEnv2.Backend as BackendQuickJS).LowMemoryNotification();
            
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
    }
}