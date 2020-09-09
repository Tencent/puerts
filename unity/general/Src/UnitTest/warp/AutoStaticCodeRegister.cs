namespace PuertsStaticWrap
{
    public static class AutoStaticCodeRegister
    {
        public static void Register(Puerts.JsEnv jsEnv)
        {
            jsEnv.AddLazyStaticWrapLoader(typeof(Puerts.UnitTest.OptionalParametersClass), Puerts_UnitTest_OptionalParametersClass_Wrap.GetRegisterInfo);
            
        }
    }
}