
using System;
using Puerts;

namespace PuertsStaticWrap
{
    public static class Puerts_UnitTest_ParamsCallTest_Wrap 
    {
    
    
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8ConstructorCallback))]
        private static IntPtr Constructor(IntPtr isolate, IntPtr info, int paramLen, long data)
        {
            try
            {

    
            
                {
                
                
                    

                    {
                    
                        var result = new Puerts.UnitTest.ParamsCallTest();

                    

                    
                        return Puerts.Utils.GetObjectPtr((int)data, typeof(Puerts.UnitTest.ParamsCallTest), result);
                    
                    }
                    
                }
        


            } catch (Exception e) {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
            return IntPtr.Zero;
        }
    // ==================== constructor end ====================

    // ==================== methods start ====================

        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void F_CombinePath(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                
        
        
                if (paramLen >= 0)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatchParams((int)data, isolate, info, Puerts.JsValueType.Any, typeof(System.Object), 0, paramLen, v8Value0, ref argobj0, ref argType0))
                    
                    {
                    
                        System.Object[] arg0 = ArgHelper.GetParams<System.Object>((int)data, isolate, info, 0, paramLen, v8Value0);
                    

                        var result = Puerts.UnitTest.ParamsCallTest.CombinePath (arg0);

                    
                        
                    
                        Puerts.PuertsDLL.ReturnString(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 0)
            
                {
            
                
                
                    
                    {
                    

                        var result = Puerts.UnitTest.ParamsCallTest.CombinePath (default(System.Object));

                    
                        Puerts.PuertsDLL.ReturnString(isolate, info, result);
                        
                        return;
                    }
                
                }
            
        
                Puerts.PuertsDLL.ThrowException(isolate, "invalid arguments to CombinePath");
        
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
    
    // ==================== methods end ====================

    // ==================== properties start ====================
    
    // ==================== properties end ====================
    // ==================== array item get/set start ====================
    
    
    // ==================== array item get/set end ====================
    // ==================== operator start ====================
    
    // ==================== operator end ====================
    // ==================== events start ====================
    
    // ==================== events end ====================

        public static Puerts.TypeRegisterInfo GetRegisterInfo()
        {
            return new Puerts.TypeRegisterInfo()
            {
                BlittableCopy = false,
                Constructor = Constructor,
                Methods = new System.Collections.Generic.Dictionary<Puerts.MethodKey, Puerts.V8FunctionCallback>()
                {   
                    { new Puerts.MethodKey { Name = "CombinePath", IsStatic = true}, F_CombinePath }
                },
                Properties = new System.Collections.Generic.Dictionary<string, Puerts.PropertyRegisterInfo>()
                {
                    
                },
                LazyMembers = new System.Collections.Generic.List<Puerts.LazyMemberRegisterInfo>()
                {   
                }
            };
        }
    
    }
}
