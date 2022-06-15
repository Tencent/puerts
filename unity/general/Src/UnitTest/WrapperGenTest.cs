using NUnit.Framework;
using System;
using System.Collections.Generic;

namespace Puerts.UnitTest 
{
    [Configure]
    public class WrapperGenTestConfig
    {

        [Filter]
        static bool FilterMethods(System.Reflection.MemberInfo mb)
        {
            if (
                (mb.DeclaringType == typeof(WrapperGenTest) || mb.DeclaringType == typeof(WrapperGenTestBase)) && mb.Name == "LazyMethod"
            )
            {
                return true;
            }
            if (
                mb.DeclaringType == typeof(WrapperGenTest) && mb.Name == "GeneratedMethod"
            )
            {
                return true;
            }
            return false;
        }
    }

    public class WrapperGenTestBase
    {
        public void GeneratedMethod(bool isBase) 
        {

        }
        public void LazyMethod(bool isBase)
        {

        }
    }
    public class WrapperGenTest: WrapperGenTestBase
    {
        public string PropertyWithoutSetter
        {
            get
            {
                return "PropertyWithoutSetter";
            }
        }
        public string PropertyWithoutGetter
        {
            set
            {

            }
        }
        private string _Property = "Property";
        public string Property 
        {
            get 
            {
                return _Property;
            }
            set
            {
                _Property = value;
            }
        }

        private static string _StaticProperty = "StaticProperty";
        public static string StaticProperty 
        {
            get 
            {
                return _StaticProperty;
            }
            set
            {
                _StaticProperty = value;
            }
        }

        public string Field = "Field";
        public readonly string ReadonlyField = "ReadonlyField";

        
        public void GeneratedMethod() 
        {

        }
        public void LazyMethod()
        {

        }
        public void SupportedGenericMethod<T>(T t) where T: Puerts.ILoader
        {

        }
        public void SupportedGenericMethod2<T>(System.Collections.Generic.List<T> list) where T: Puerts.ILoader
        {

        }

        public void UnsupportedGenericMethod<T>(T t) {
            
        }
        public void UnsupportedGenericMethod2<T, S>(T t, S s) {
            
        }
    }

    [TestFixture]
    public class WrapperGenUnitTest
    {
        [Test]
        public void GenericWrapper()
        {

            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.Eval<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("require('puerts/templates/wrapper.tpl.cjs')");
            var genList = new List<Type>() { typeof(Dictionary<int, JsEnv>) };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Dictionary<int, JsEnv>), genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.True(wrapperContent.Contains("<T>"));
        }

        [Test]
        public void GenericWrapper_2()
        {

            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.Eval<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("require('puerts/templates/wrapper.tpl.cjs')");
            var genList = new List<Type>() {
                typeof(Dictionary<Type, JsEnv>)             
            };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Dictionary<Type, JsEnv>), genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.True(wrapperContent.Contains("<T,S>"));
        }

        [Test]
        public void PropertyTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            PuertsStaticWrap.AutoStaticCodeRegister.Register(jsEnv);
            string ret = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                const i1 = CS.Puerts.UnitTest.WrapperGenTest.StaticProperty;
                CS.Puerts.UnitTest.WrapperGenTest.StaticProperty = 'Puerts'
                i1 + ' ' + CS.Puerts.UnitTest.WrapperGenTest.StaticProperty;
            ");

            jsEnv.Dispose();

            Assert.AreEqual("StaticProperty Puerts", ret);
        }
    }
}