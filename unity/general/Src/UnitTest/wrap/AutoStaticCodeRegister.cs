using System;

namespace PuertsStaticWrap
{
    public static class AutoStaticCodeRegister
    {
        public static void Register(Puerts.JsEnv jsEnv)
        {
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.OptionalParametersClass), Puerts_UnitTest_OptionalParametersClass_Wrap.GetRegisterInfo);
                
                
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.WrapperTest), Puerts_UnitTest_WrapperTest_Wrap.GetRegisterInfo);
                
                
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.GenericGenTest<System.Type, Puerts.JsEnv>), Puerts_UnitTest_GenericGenTest_2_T_S__Wrap<System.Type,Puerts.JsEnv>.GetRegisterInfo);
                jsEnv.AddLazyStaticWrapLoaderGenericDefinition(
                    typeof(Puerts.UnitTest.GenericGenTest<System.Type, Puerts.JsEnv>).GetGenericTypeDefinition(),
                    new Type[]{ null, null },
                    typeof(Puerts_UnitTest_GenericGenTest_2_T_S__Wrap<System.Type,Puerts.JsEnv>).GetGenericTypeDefinition()
                );
                
        }
    }
}