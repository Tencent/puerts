//using NUnit.Framework;

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
        public string GeneratedMethod(bool isBase) 
        {
            return "GeneratedMethod(bool)";
        }
        public string LazyMethod(bool isBase)
        {
            return "LazyMethod(bool)";
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

        
        public string GeneratedMethod() 
        {
            return "GeneratedMethod";
        }
        public string LazyMethod()
        {
            return "LazyMethod";
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

    //[TestFixture]
    //public class WrapperGenUnitTest
    //{
    //    [Test]
    //    public void PropertyTest()
    //    {
    //        var jsEnv = new JsEnv(new TxtLoader());
    //        PuertsStaticWrap.AutoStaticCodeRegister.Register(jsEnv);
    //        string ret = jsEnv.Eval<string>(@"
    //            const CS = require('csharp');
    //            const i1 = CS.Puerts.UnitTest.WrapperGenTest.StaticProperty;
    //            CS.Puerts.UnitTest.WrapperGenTest.StaticProperty = 'Puerts'
    //            i1 + ' ' + CS.Puerts.UnitTest.WrapperGenTest.StaticProperty;
    //        ");

    //        jsEnv.Dispose();

    //        Assert.AreEqual("StaticProperty Puerts", ret);
    //    }
    //}
}