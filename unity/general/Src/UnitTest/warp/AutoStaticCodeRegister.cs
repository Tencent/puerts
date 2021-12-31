namespace PuertsStaticWrap
{
    public static class AutoStaticCodeRegister
    {
        public static void Register(Puerts.JsEnv jsEnv)
        {
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.OptionalParametersClass), Puerts_UnitTest_OptionalParametersClass_Wrap.GetRegisterInfo);
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.RefInClass.Vector3), Puerts_UnitTest_RefInClass_Vector3_Wrap.GetRegisterInfo);
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.RefInClass), PuertsTest_RefInTest_Wrap.GetRegisterInfo);
        }
    }
}