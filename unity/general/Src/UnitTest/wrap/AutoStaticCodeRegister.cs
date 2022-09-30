using System;

namespace PuertsStaticWrap
{
    public static class AutoStaticCodeRegister
    {
        public static void Register(Puerts.JsEnv jsEnv)
        {
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.OptionalParametersClass), Puerts_UnitTest_OptionalParametersClass_Wrap.GetRegisterInfo);
                
                
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.WrapperTest), Puerts_UnitTest_WrapperTest_Wrap.GetRegisterInfo);
                
                
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.MultiEnvTestA), Puerts_UnitTest_MultiEnvTestA_Wrap.GetRegisterInfo);
                
                
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.MultiEnvTestB), Puerts_UnitTest_MultiEnvTestB_Wrap.GetRegisterInfo);
                
                
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.GenericGenTest<System.Type, Puerts.JsEnv>), Puerts_UnitTest_GenericGenTest_2_System_Type_Puerts_JsEnv__Wrap.GetRegisterInfo);
                
                
        }
    }
}