﻿
using System;
using Puerts;

namespace PuertsStaticWrap
{
    public static class Puerts_UnitTest_WrapperTest_Wrap 
    {

        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8ConstructorCallback))]
        private static IntPtr Constructor(IntPtr isolate, IntPtr info, int paramLen, long data)
        {
            try
            {

                {
            
                    {
                
                        var result = new Puerts.UnitTest.WrapperTest();
                
                        return Puerts.Utils.GetObjectPtr((int)data, typeof(Puerts.UnitTest.WrapperTest), result);
                    
                    }
                
                }
            
    
            } catch (Exception e) {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
            return IntPtr.Zero;
        }
    
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void M_GeneratedMethod(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = Puerts.Utils.GetSelf((int)data, self) as Puerts.UnitTest.WrapperTest;
        
                if (paramLen == 0)
            
                {
            
                    {
                
                        obj.GeneratedMethod();
                
                        
                        
                        return;
                    }
                
                }
            
                if (paramLen == 1)
            
                {
            
                    var argHelper0 = new Puerts.ArgumentHelper((int)data, isolate, info, 0);
                
                    if (argHelper0.IsMatch(Puerts.JsValueType.Boolean, typeof(bool), false, false))
                
                    {
                
                        var Arg0 = argHelper0.GetBoolean(false);
                    
                        obj.GeneratedMethod(Arg0);
                
                        
                        
                        return;
                    }
                
                }
            
                Puerts.PuertsDLL.ThrowException(isolate, "invalid arguments to GeneratedMethod");
        
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
        
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void G_PropertyWithoutSetter(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = Puerts.Utils.GetSelf((int)data, self) as Puerts.UnitTest.WrapperTest;
                var result = obj.PropertyWithoutSetter;
                Puerts.StaticTranslate<string>.Set((int)data, isolate, Puerts.NativeValueApi.SetValueToResult, info, result);
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void S_PropertyWithoutGetter(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = Puerts.Utils.GetSelf((int)data, self) as Puerts.UnitTest.WrapperTest;
                var argHelper = new Puerts.ArgumentHelper((int)data, isolate, info, 0);
                obj.PropertyWithoutGetter = argHelper.GetString(false);
                
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void G_Property(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = Puerts.Utils.GetSelf((int)data, self) as Puerts.UnitTest.WrapperTest;
                var result = obj.Property;
                Puerts.StaticTranslate<string>.Set((int)data, isolate, Puerts.NativeValueApi.SetValueToResult, info, result);
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void S_Property(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = Puerts.Utils.GetSelf((int)data, self) as Puerts.UnitTest.WrapperTest;
                var argHelper = new Puerts.ArgumentHelper((int)data, isolate, info, 0);
                obj.Property = argHelper.GetString(false);
                
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void G_StaticProperty(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                
                var result = Puerts.UnitTest.WrapperTest.StaticProperty;
                Puerts.StaticTranslate<string>.Set((int)data, isolate, Puerts.NativeValueApi.SetValueToResult, info, result);
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void S_StaticProperty(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                
                var argHelper = new Puerts.ArgumentHelper((int)data, isolate, info, 0);
                Puerts.UnitTest.WrapperTest.StaticProperty = argHelper.GetString(false);
                
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void G_Field(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = Puerts.Utils.GetSelf((int)data, self) as Puerts.UnitTest.WrapperTest;
                var result = obj.Field;
                Puerts.StaticTranslate<string>.Set((int)data, isolate, Puerts.NativeValueApi.SetValueToResult, info, result);
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void S_Field(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = Puerts.Utils.GetSelf((int)data, self) as Puerts.UnitTest.WrapperTest;
                var argHelper = new Puerts.ArgumentHelper((int)data, isolate, info, 0);
                obj.Field = argHelper.GetString(false);
                
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
            
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8FunctionCallback))]
        private static void G_ReadonlyField(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                var obj = Puerts.Utils.GetSelf((int)data, self) as Puerts.UnitTest.WrapperTest;
                var result = obj.ReadonlyField;
                Puerts.StaticTranslate<string>.Set((int)data, isolate, Puerts.NativeValueApi.SetValueToResult, info, result);
            }
            catch (Exception e)
            {
                Puerts.PuertsDLL.ThrowException(isolate, "c# exception:" + e.Message + ",stack:" + e.StackTrace);
            }
        }
                
        public static Puerts.TypeRegisterInfo GetRegisterInfo()
        {
            return new Puerts.TypeRegisterInfo()
            {
                BlittableCopy = false,
                Constructor = Constructor,
                Methods = new System.Collections.Generic.Dictionary<Puerts.MethodKey, Puerts.V8FunctionCallback>()
                {   
                    { new Puerts.MethodKey { Name = "GeneratedMethod", IsStatic = false}, M_GeneratedMethod }
                },
                Properties = new System.Collections.Generic.Dictionary<string, Puerts.PropertyRegisterInfo>()
                {
                    
                    {"PropertyWithoutSetter", new Puerts.PropertyRegisterInfo(){ IsStatic = false, Getter = G_PropertyWithoutSetter, Setter = null} },

                    {"PropertyWithoutGetter", new Puerts.PropertyRegisterInfo(){ IsStatic = false, Getter = null, Setter = S_PropertyWithoutGetter} },

                    {"Property", new Puerts.PropertyRegisterInfo(){ IsStatic = false, Getter = G_Property, Setter = S_Property} },

                    {"StaticProperty", new Puerts.PropertyRegisterInfo(){ IsStatic = true, Getter = G_StaticProperty, Setter = S_StaticProperty} },

                    {"Field", new Puerts.PropertyRegisterInfo(){ IsStatic = false, Getter = G_Field, Setter = S_Field} },

                    {"ReadonlyField", new Puerts.PropertyRegisterInfo(){ IsStatic = false, Getter = G_ReadonlyField, Setter = null} }
                },
                LazyMembers = new System.Collections.Generic.List<Puerts.LazyMemberRegisterInfo>()
                {   
                    new Puerts.LazyMemberRegisterInfo() { Name = "LazyMethod", IsStatic = false, Type = (Puerts.LazyMemberType)2, HasGetter = false, HasSetter = false }
                }
            };
        }
    
    }
}
