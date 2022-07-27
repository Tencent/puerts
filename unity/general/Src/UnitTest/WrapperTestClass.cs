namespace Puerts.UnitTest
{
    [Configure]
    public class WrapperGenTestConfig
    {

        [Filter]
        static bool FilterMethods(System.Reflection.MemberInfo mb)
        {
            if (
                (mb.DeclaringType == typeof(WrapperTest) || mb.DeclaringType == typeof(WrapperTestBase)) && mb.Name == "LazyMethod"
            )
            {
                return true;
            }
            if (
                mb.DeclaringType == typeof(WrapperTest) && mb.Name == "GeneratedMethod"
            )
            {
                return true;
            }
            return false;
        }
    }

    public class GenericWrapperBase<T> where T : class, new()
    { 
        public static System.Type GetGenericType()
        {
            return typeof(T);
        }
    }

    public class GenericGenTest2 :GenericWrapperBase<GenericGenTest2>
    {
        public System.Type GetTypeTest<T>(string arg0, System.Action<T> action = null) where T: WrapperTestBase
        {
            return typeof (T);
        }
    }


    public class WrapperTestBase
    {
        public void GeneratedMethod(bool isBase) 
        {

        }
        public void LazyMethod(bool isBase)
        {

        }
    }

    public class GenericGenTest<T, S> : WrapperTestBase
    {
        public System.Type GetGeneric2()
        {
            return typeof(S);
        }
    }

    public class WrapperTest: WrapperTestBase
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
}
