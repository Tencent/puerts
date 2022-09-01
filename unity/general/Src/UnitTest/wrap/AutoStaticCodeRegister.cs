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
                
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.GenericGenTest2), Puerts_UnitTest_GenericGenTest2_Wrap.GetRegisterInfo);
                
                
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.GenericWrapperBase<Puerts.JsEnv>), Puerts_UnitTest_GenericWrapperBase_1_T__Wrap<Puerts.JsEnv>.GetRegisterInfo);
                jsEnv.AddLazyStaticWrapLoaderGenericDefinition(
                    typeof(Puerts.UnitTest.GenericWrapperBase<Puerts.JsEnv>).GetGenericTypeDefinition(),
                    new Type[]{ null },
                    typeof(Puerts_UnitTest_GenericWrapperBase_1_T__Wrap<Puerts.JsEnv>).GetGenericTypeDefinition()
                );
                
        }
    }
}