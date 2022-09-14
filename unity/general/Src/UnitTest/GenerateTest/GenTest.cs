using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
    class Singleton1<T> where T: Singleton1<T>, new() {}
    class Zombie: Singleton1<Zombie> {}

    [TestFixture]
    public class GenTest
    {
        [Test]
        public void GenericWrapper()
        {

            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.ExecuteModule<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("puerts/templates/wrapper.tpl.mjs", "default");
            var genList = new List<Type>() { typeof(Dictionary<int, JsEnv>) };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Dictionary<int, JsEnv>), genList);

            string wrapperContent = wrapRender(wrapperInfo);
            System.Console.WriteLine(wrapperContent);
            Assert.True((new Regex(@"<TValue>")).IsMatch(wrapperContent));
        }

        [Test]
        public void GenericWrapper_2()
        {

            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.ExecuteModule<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("puerts/templates/wrapper.tpl.mjs", "default");
            var genList = new List<Type>() {
                typeof(Dictionary<Type, JsEnv>)             
            };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Dictionary<Type, JsEnv>), genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.True((new Regex(@"<TKey,TValue>")).IsMatch(wrapperContent));
        }

        [Test]
        public void GenericWrapper_3()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.ExecuteModule<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("puerts/templates/wrapper.tpl.mjs", "default");
            var genList = new List<Type>() {
                typeof(Singleton1<Zombie>),            
                typeof(Zombie)             
            };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Singleton1<Zombie>), genList);

            string wrapperContent = wrapRender(wrapperInfo);
            System.Console.WriteLine(wrapperContent);
            Assert.True((new Regex(@"where T : Puerts.UnitTest.Singleton1<T>")).IsMatch(wrapperContent));
        }

        [Test]
        public void GenericWrapper_4()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.ExecuteModule<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("puerts/templates/wrapper.tpl.mjs", "default");
            var genList = new List<Type>() {
                typeof(List<int>)            
            };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(genList[0], genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.False((new Regex(@"<\w>")).IsMatch(wrapperContent));
        }

        [Test]
        public void GenericWrapperWithConstraint_1()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.ExecuteModule<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("puerts/templates/wrapper.tpl.mjs", "default");
            var genList = new List<Type>() {
                typeof(Puerts.UnitTest.GenericWrapperWithConstraintStruct<TimeSpan>)         
            };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(genList[0], genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.True((new Regex(@"where T : struct")).IsMatch(wrapperContent));
        }

        [Test]
        public void GenericWrapperWithConstraint_2()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.ExecuteModule<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("puerts/templates/wrapper.tpl.mjs", "default");
            var genList = new List<Type>() {
                typeof(Puerts.UnitTest.GenericWrapperWithConstraintClass<JsEnv>)         
            };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(genList[0], genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.True((new Regex(@"where T : class")).IsMatch(wrapperContent));
        }

        [Test]
        public void GenericWrapperWithConstraint_3()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.ExecuteModule<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("puerts/templates/wrapper.tpl.mjs", "default");
            var genList = new List<Type>() {
                typeof(Puerts.UnitTest.GenericWrapperWithConstraintNew<JsEnv>)         
            };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(genList[0], genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.True((new Regex(@"where T : new\(\)")).IsMatch(wrapperContent));
        }

        [Test]
        public void GenericWrapperWithConstraint_4()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.ExecuteModule<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("puerts/templates/wrapper.tpl.mjs", "default");
            var genList = new List<Type>() {
                typeof(Puerts.UnitTest.GenericWrapperWithConstraintNewClass<JsEnv>)         
            };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(genList[0], genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.True((new Regex(@"where T : class, new\(\)")).IsMatch(wrapperContent));
        }

        [Test]
        public void GenericWrapperWithConstraint_5()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.ExecuteModule<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("puerts/templates/wrapper.tpl.mjs", "default");
            var genList = new List<Type>() {
                typeof(Puerts.UnitTest.GenericWrapperWithConstraintStringComparer<StringComparer>)         
            };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(genList[0], genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.True((new Regex(@"where T : System.StringComparer")).IsMatch(wrapperContent));
        }
    }
}