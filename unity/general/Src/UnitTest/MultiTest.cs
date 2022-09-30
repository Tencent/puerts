using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Puerts.UnitTest
{
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

        [Test]
        public void MultiEnv() {
            var jsEnv1 = new JsEnv(new TxtLoader());
            var jsEnv2 = new JsEnv(new TxtLoader());

            jsEnv1.Eval(@"
                (function() {
                    const CS = require('csharp');
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
                    const CS = require('csharp');
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
            
            jsEnv2.LowMemoryNotification();
            
            jsEnv1.Eval(@"
                (function() {
                    const CS = require('csharp');
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
    }
}