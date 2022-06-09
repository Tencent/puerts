
using System;
using Puerts.UnitTest;

namespace PuertsStaticWrap
{
    public static class WrapperGenTest_Wrap
    {

        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8ConstructorCallback))]
        private static IntPtr Constructor(IntPtr isolate, IntPtr info, int paramLen, long data)
        {
            try
            {

                {
            
                    {
                
                        var result = new WrapperGenTest();
                
                        return Puerts.Utils.GetObjectPtr((int)data, typeof(WrapperGenTest), result);
                    
                    }
                
                }
            
    
            } catch (Exception e) {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
            return IntPtr.Zero;
        }
        
        public static Puerts.TypeRegisterInfo GetRegisterInfo()
        {
            return new Puerts.TypeRegisterInfo()
            {
                BlittableCopy = false,
                Constructor = Constructor,
                Methods = new System.Collections.Generic.Dictionary<Puerts.MethodKey, Puerts.V8FunctionCallback>()
                {   
                },
                Properties = new System.Collections.Generic.Dictionary<string, Puerts.PropertyRegisterInfo>()
                {
                    
                },
                LazyMembers = new System.Collections.Generic.List<Puerts.LazyMemberRegisterInfo>()
                {   
                    new Puerts.LazyMemberRegisterInfo() { Name = "HelloMethod", IsStatic = false, Type = (Puerts.LazyMemberType)2, HasGetter = false, HasSetter = false },
                    new Puerts.LazyMemberRegisterInfo() { Name = "HelloProperty", IsStatic = false, Type = (Puerts.LazyMemberType)3, HasGetter = true, HasSetter = false },
                    new Puerts.LazyMemberRegisterInfo() { Name = "HelloField", IsStatic = false, Type = (Puerts.LazyMemberType)4, HasGetter = true, HasSetter = true }
                }
            };
        }
    
    }
}
