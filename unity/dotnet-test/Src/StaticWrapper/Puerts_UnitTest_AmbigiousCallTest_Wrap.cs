
using System;
using Puerts;

namespace PuertsStaticWrap
{
    public static class Puerts_UnitTest_AmbigiousCallTest_Wrap 
    {
    
    
        [Puerts.MonoPInvokeCallback(typeof(Puerts.V8ConstructorCallback))]
        private static IntPtr Constructor(IntPtr isolate, IntPtr info, int paramLen, long data)
        {
            try
            {

    
            
                {
                
                
                    

                    {
                    
                        var result = new Puerts.UnitTest.AmbigiousCallTest();

                    

                    
                        return Puerts.Utils.GetObjectPtr((int)data, typeof(Puerts.UnitTest.AmbigiousCallTest), result);
                    
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
        private static void F_PlaySound(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
            try
            {
                
        
        
                if (paramLen == 13)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                    IntPtr v8Value3 = PuertsDLL.GetArgumentValue(info, 3);
                    object argobj3 = null;
                    JsValueType argType3 = JsValueType.Invalid;
                
                    IntPtr v8Value4 = PuertsDLL.GetArgumentValue(info, 4);
                    object argobj4 = null;
                    JsValueType argType4 = JsValueType.Invalid;
                
                    IntPtr v8Value5 = PuertsDLL.GetArgumentValue(info, 5);
                    object argobj5 = null;
                    JsValueType argType5 = JsValueType.Invalid;
                
                    IntPtr v8Value6 = PuertsDLL.GetArgumentValue(info, 6);
                    object argobj6 = null;
                    JsValueType argType6 = JsValueType.Invalid;
                
                    IntPtr v8Value7 = PuertsDLL.GetArgumentValue(info, 7);
                    object argobj7 = null;
                    JsValueType argType7 = JsValueType.Invalid;
                
                    IntPtr v8Value8 = PuertsDLL.GetArgumentValue(info, 8);
                    object argobj8 = null;
                    JsValueType argType8 = JsValueType.Invalid;
                
                    IntPtr v8Value9 = PuertsDLL.GetArgumentValue(info, 9);
                    object argobj9 = null;
                    JsValueType argType9 = JsValueType.Invalid;
                
                    IntPtr v8Value10 = PuertsDLL.GetArgumentValue(info, 10);
                    object argobj10 = null;
                    JsValueType argType10 = JsValueType.Invalid;
                
                    IntPtr v8Value11 = PuertsDLL.GetArgumentValue(info, 11);
                    object argobj11 = null;
                    JsValueType argType11 = JsValueType.Invalid;
                
                    IntPtr v8Value12 = PuertsDLL.GetArgumentValue(info, 12);
                    object argobj12 = null;
                    JsValueType argType12 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value3, ref argobj3, ref argType3) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value4, ref argobj4, ref argType4) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(ulong), false, false, v8Value5, ref argobj5, ref argType5) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(long), false, false, v8Value6, ref argobj6, ref argType6) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Boolean, typeof(bool), false, false, v8Value7, ref argobj7, ref argType7) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(Puerts.UnitTest.AmbigiousCallTest.AENUM), false, false, v8Value8, ref argobj8, ref argType8) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(byte), false, false, v8Value9, ref argobj9, ref argType9) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value10, ref argobj10, ref argType10) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value11, ref argobj11, ref argType11) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NativeObject, typeof(System.IntPtr), false, false, v8Value12, ref argobj12, ref argType12))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    
                        argobj3 = argobj3 != null ? argobj3 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value3, false); System.Char arg3 = (System.Char)argobj3;
                    
                        string arg4 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value4, false);
                    
                        ulong arg5 = (ulong)StaticTranslate<ulong>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value5, false);;
                    
                        long arg6 = (long)StaticTranslate<long>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value6, false);;
                    
                        bool arg7 = (bool)PuertsDLL.GetBooleanFromValue(isolate, v8Value7, false);
                    
                        Puerts.UnitTest.AmbigiousCallTest.AENUM arg8 = (Puerts.UnitTest.AmbigiousCallTest.AENUM)StaticTranslate<int>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value8, false);
                    
                        byte arg9 = (byte)PuertsDLL.GetNumberFromValue(isolate, v8Value9, false);
                    
                        argobj10 = argobj10 != null ? argobj10 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value10, false); System.Char arg10 = (System.Char)argobj10;
                    
                        float arg11 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value11, false);
                    
                        argobj12 = argobj12 != null ? argobj12 : StaticTranslate<System.IntPtr>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value12, false); System.IntPtr arg12 = (System.IntPtr)argobj12;
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12);

                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 12)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                    IntPtr v8Value3 = PuertsDLL.GetArgumentValue(info, 3);
                    object argobj3 = null;
                    JsValueType argType3 = JsValueType.Invalid;
                
                    IntPtr v8Value4 = PuertsDLL.GetArgumentValue(info, 4);
                    object argobj4 = null;
                    JsValueType argType4 = JsValueType.Invalid;
                
                    IntPtr v8Value5 = PuertsDLL.GetArgumentValue(info, 5);
                    object argobj5 = null;
                    JsValueType argType5 = JsValueType.Invalid;
                
                    IntPtr v8Value6 = PuertsDLL.GetArgumentValue(info, 6);
                    object argobj6 = null;
                    JsValueType argType6 = JsValueType.Invalid;
                
                    IntPtr v8Value7 = PuertsDLL.GetArgumentValue(info, 7);
                    object argobj7 = null;
                    JsValueType argType7 = JsValueType.Invalid;
                
                    IntPtr v8Value8 = PuertsDLL.GetArgumentValue(info, 8);
                    object argobj8 = null;
                    JsValueType argType8 = JsValueType.Invalid;
                
                    IntPtr v8Value9 = PuertsDLL.GetArgumentValue(info, 9);
                    object argobj9 = null;
                    JsValueType argType9 = JsValueType.Invalid;
                
                    IntPtr v8Value10 = PuertsDLL.GetArgumentValue(info, 10);
                    object argobj10 = null;
                    JsValueType argType10 = JsValueType.Invalid;
                
                    IntPtr v8Value11 = PuertsDLL.GetArgumentValue(info, 11);
                    object argobj11 = null;
                    JsValueType argType11 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value3, ref argobj3, ref argType3) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value4, ref argobj4, ref argType4) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(ulong), false, false, v8Value5, ref argobj5, ref argType5) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(long), false, false, v8Value6, ref argobj6, ref argType6) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Boolean, typeof(bool), false, false, v8Value7, ref argobj7, ref argType7) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(Puerts.UnitTest.AmbigiousCallTest.AENUM), false, false, v8Value8, ref argobj8, ref argType8) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(byte), false, false, v8Value9, ref argobj9, ref argType9) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value10, ref argobj10, ref argType10) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value11, ref argobj11, ref argType11))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    
                        argobj3 = argobj3 != null ? argobj3 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value3, false); System.Char arg3 = (System.Char)argobj3;
                    
                        string arg4 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value4, false);
                    
                        ulong arg5 = (ulong)StaticTranslate<ulong>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value5, false);;
                    
                        long arg6 = (long)StaticTranslate<long>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value6, false);;
                    
                        bool arg7 = (bool)PuertsDLL.GetBooleanFromValue(isolate, v8Value7, false);
                    
                        Puerts.UnitTest.AmbigiousCallTest.AENUM arg8 = (Puerts.UnitTest.AmbigiousCallTest.AENUM)StaticTranslate<int>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value8, false);
                    
                        byte arg9 = (byte)PuertsDLL.GetNumberFromValue(isolate, v8Value9, false);
                    
                        argobj10 = argobj10 != null ? argobj10 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value10, false); System.Char arg10 = (System.Char)argobj10;
                    
                        float arg11 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value11, false);
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, default(System.IntPtr));

                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 11)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                    IntPtr v8Value3 = PuertsDLL.GetArgumentValue(info, 3);
                    object argobj3 = null;
                    JsValueType argType3 = JsValueType.Invalid;
                
                    IntPtr v8Value4 = PuertsDLL.GetArgumentValue(info, 4);
                    object argobj4 = null;
                    JsValueType argType4 = JsValueType.Invalid;
                
                    IntPtr v8Value5 = PuertsDLL.GetArgumentValue(info, 5);
                    object argobj5 = null;
                    JsValueType argType5 = JsValueType.Invalid;
                
                    IntPtr v8Value6 = PuertsDLL.GetArgumentValue(info, 6);
                    object argobj6 = null;
                    JsValueType argType6 = JsValueType.Invalid;
                
                    IntPtr v8Value7 = PuertsDLL.GetArgumentValue(info, 7);
                    object argobj7 = null;
                    JsValueType argType7 = JsValueType.Invalid;
                
                    IntPtr v8Value8 = PuertsDLL.GetArgumentValue(info, 8);
                    object argobj8 = null;
                    JsValueType argType8 = JsValueType.Invalid;
                
                    IntPtr v8Value9 = PuertsDLL.GetArgumentValue(info, 9);
                    object argobj9 = null;
                    JsValueType argType9 = JsValueType.Invalid;
                
                    IntPtr v8Value10 = PuertsDLL.GetArgumentValue(info, 10);
                    object argobj10 = null;
                    JsValueType argType10 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value3, ref argobj3, ref argType3) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value4, ref argobj4, ref argType4) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(ulong), false, false, v8Value5, ref argobj5, ref argType5) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(long), false, false, v8Value6, ref argobj6, ref argType6) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Boolean, typeof(bool), false, false, v8Value7, ref argobj7, ref argType7) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(Puerts.UnitTest.AmbigiousCallTest.AENUM), false, false, v8Value8, ref argobj8, ref argType8) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(byte), false, false, v8Value9, ref argobj9, ref argType9) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value10, ref argobj10, ref argType10))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    
                        argobj3 = argobj3 != null ? argobj3 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value3, false); System.Char arg3 = (System.Char)argobj3;
                    
                        string arg4 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value4, false);
                    
                        ulong arg5 = (ulong)StaticTranslate<ulong>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value5, false);;
                    
                        long arg6 = (long)StaticTranslate<long>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value6, false);;
                    
                        bool arg7 = (bool)PuertsDLL.GetBooleanFromValue(isolate, v8Value7, false);
                    
                        Puerts.UnitTest.AmbigiousCallTest.AENUM arg8 = (Puerts.UnitTest.AmbigiousCallTest.AENUM)StaticTranslate<int>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value8, false);
                    
                        byte arg9 = (byte)PuertsDLL.GetNumberFromValue(isolate, v8Value9, false);
                    
                        argobj10 = argobj10 != null ? argobj10 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value10, false); System.Char arg10 = (System.Char)argobj10;
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 10)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                    IntPtr v8Value3 = PuertsDLL.GetArgumentValue(info, 3);
                    object argobj3 = null;
                    JsValueType argType3 = JsValueType.Invalid;
                
                    IntPtr v8Value4 = PuertsDLL.GetArgumentValue(info, 4);
                    object argobj4 = null;
                    JsValueType argType4 = JsValueType.Invalid;
                
                    IntPtr v8Value5 = PuertsDLL.GetArgumentValue(info, 5);
                    object argobj5 = null;
                    JsValueType argType5 = JsValueType.Invalid;
                
                    IntPtr v8Value6 = PuertsDLL.GetArgumentValue(info, 6);
                    object argobj6 = null;
                    JsValueType argType6 = JsValueType.Invalid;
                
                    IntPtr v8Value7 = PuertsDLL.GetArgumentValue(info, 7);
                    object argobj7 = null;
                    JsValueType argType7 = JsValueType.Invalid;
                
                    IntPtr v8Value8 = PuertsDLL.GetArgumentValue(info, 8);
                    object argobj8 = null;
                    JsValueType argType8 = JsValueType.Invalid;
                
                    IntPtr v8Value9 = PuertsDLL.GetArgumentValue(info, 9);
                    object argobj9 = null;
                    JsValueType argType9 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value3, ref argobj3, ref argType3) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value4, ref argobj4, ref argType4) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(ulong), false, false, v8Value5, ref argobj5, ref argType5) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(long), false, false, v8Value6, ref argobj6, ref argType6) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Boolean, typeof(bool), false, false, v8Value7, ref argobj7, ref argType7) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(Puerts.UnitTest.AmbigiousCallTest.AENUM), false, false, v8Value8, ref argobj8, ref argType8) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(byte), false, false, v8Value9, ref argobj9, ref argType9))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    
                        argobj3 = argobj3 != null ? argobj3 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value3, false); System.Char arg3 = (System.Char)argobj3;
                    
                        string arg4 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value4, false);
                    
                        ulong arg5 = (ulong)StaticTranslate<ulong>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value5, false);;
                    
                        long arg6 = (long)StaticTranslate<long>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value6, false);;
                    
                        bool arg7 = (bool)PuertsDLL.GetBooleanFromValue(isolate, v8Value7, false);
                    
                        Puerts.UnitTest.AmbigiousCallTest.AENUM arg8 = (Puerts.UnitTest.AmbigiousCallTest.AENUM)StaticTranslate<int>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value8, false);
                    
                        byte arg9 = (byte)PuertsDLL.GetNumberFromValue(isolate, v8Value9, false);
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, (char)65535, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 9)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                    IntPtr v8Value3 = PuertsDLL.GetArgumentValue(info, 3);
                    object argobj3 = null;
                    JsValueType argType3 = JsValueType.Invalid;
                
                    IntPtr v8Value4 = PuertsDLL.GetArgumentValue(info, 4);
                    object argobj4 = null;
                    JsValueType argType4 = JsValueType.Invalid;
                
                    IntPtr v8Value5 = PuertsDLL.GetArgumentValue(info, 5);
                    object argobj5 = null;
                    JsValueType argType5 = JsValueType.Invalid;
                
                    IntPtr v8Value6 = PuertsDLL.GetArgumentValue(info, 6);
                    object argobj6 = null;
                    JsValueType argType6 = JsValueType.Invalid;
                
                    IntPtr v8Value7 = PuertsDLL.GetArgumentValue(info, 7);
                    object argobj7 = null;
                    JsValueType argType7 = JsValueType.Invalid;
                
                    IntPtr v8Value8 = PuertsDLL.GetArgumentValue(info, 8);
                    object argobj8 = null;
                    JsValueType argType8 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value3, ref argobj3, ref argType3) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value4, ref argobj4, ref argType4) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(ulong), false, false, v8Value5, ref argobj5, ref argType5) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(long), false, false, v8Value6, ref argobj6, ref argType6) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Boolean, typeof(bool), false, false, v8Value7, ref argobj7, ref argType7) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(Puerts.UnitTest.AmbigiousCallTest.AENUM), false, false, v8Value8, ref argobj8, ref argType8))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    
                        argobj3 = argobj3 != null ? argobj3 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value3, false); System.Char arg3 = (System.Char)argobj3;
                    
                        string arg4 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value4, false);
                    
                        ulong arg5 = (ulong)StaticTranslate<ulong>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value5, false);;
                    
                        long arg6 = (long)StaticTranslate<long>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value6, false);;
                    
                        bool arg7 = (bool)PuertsDLL.GetBooleanFromValue(isolate, v8Value7, false);
                    
                        Puerts.UnitTest.AmbigiousCallTest.AENUM arg8 = (Puerts.UnitTest.AmbigiousCallTest.AENUM)StaticTranslate<int>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value8, false);
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, 255, (char)65535, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 8)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                    IntPtr v8Value3 = PuertsDLL.GetArgumentValue(info, 3);
                    object argobj3 = null;
                    JsValueType argType3 = JsValueType.Invalid;
                
                    IntPtr v8Value4 = PuertsDLL.GetArgumentValue(info, 4);
                    object argobj4 = null;
                    JsValueType argType4 = JsValueType.Invalid;
                
                    IntPtr v8Value5 = PuertsDLL.GetArgumentValue(info, 5);
                    object argobj5 = null;
                    JsValueType argType5 = JsValueType.Invalid;
                
                    IntPtr v8Value6 = PuertsDLL.GetArgumentValue(info, 6);
                    object argobj6 = null;
                    JsValueType argType6 = JsValueType.Invalid;
                
                    IntPtr v8Value7 = PuertsDLL.GetArgumentValue(info, 7);
                    object argobj7 = null;
                    JsValueType argType7 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value3, ref argobj3, ref argType3) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value4, ref argobj4, ref argType4) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(ulong), false, false, v8Value5, ref argobj5, ref argType5) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(long), false, false, v8Value6, ref argobj6, ref argType6) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Boolean, typeof(bool), false, false, v8Value7, ref argobj7, ref argType7))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    
                        argobj3 = argobj3 != null ? argobj3 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value3, false); System.Char arg3 = (System.Char)argobj3;
                    
                        string arg4 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value4, false);
                    
                        ulong arg5 = (ulong)StaticTranslate<ulong>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value5, false);;
                    
                        long arg6 = (long)StaticTranslate<long>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value6, false);;
                    
                        bool arg7 = (bool)PuertsDLL.GetBooleanFromValue(isolate, v8Value7, false);
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, Puerts.UnitTest.AmbigiousCallTest.AENUM.b, 255, (char)65535, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 7)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                    IntPtr v8Value3 = PuertsDLL.GetArgumentValue(info, 3);
                    object argobj3 = null;
                    JsValueType argType3 = JsValueType.Invalid;
                
                    IntPtr v8Value4 = PuertsDLL.GetArgumentValue(info, 4);
                    object argobj4 = null;
                    JsValueType argType4 = JsValueType.Invalid;
                
                    IntPtr v8Value5 = PuertsDLL.GetArgumentValue(info, 5);
                    object argobj5 = null;
                    JsValueType argType5 = JsValueType.Invalid;
                
                    IntPtr v8Value6 = PuertsDLL.GetArgumentValue(info, 6);
                    object argobj6 = null;
                    JsValueType argType6 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value3, ref argobj3, ref argType3) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value4, ref argobj4, ref argType4) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(ulong), false, false, v8Value5, ref argobj5, ref argType5) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(long), false, false, v8Value6, ref argobj6, ref argType6))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    
                        argobj3 = argobj3 != null ? argobj3 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value3, false); System.Char arg3 = (System.Char)argobj3;
                    
                        string arg4 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value4, false);
                    
                        ulong arg5 = (ulong)StaticTranslate<ulong>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value5, false);;
                    
                        long arg6 = (long)StaticTranslate<long>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value6, false);;
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, arg3, arg4, arg5, arg6, false, Puerts.UnitTest.AmbigiousCallTest.AENUM.b, 255, (char)65535, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 6)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                    IntPtr v8Value3 = PuertsDLL.GetArgumentValue(info, 3);
                    object argobj3 = null;
                    JsValueType argType3 = JsValueType.Invalid;
                
                    IntPtr v8Value4 = PuertsDLL.GetArgumentValue(info, 4);
                    object argobj4 = null;
                    JsValueType argType4 = JsValueType.Invalid;
                
                    IntPtr v8Value5 = PuertsDLL.GetArgumentValue(info, 5);
                    object argobj5 = null;
                    JsValueType argType5 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value3, ref argobj3, ref argType3) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value4, ref argobj4, ref argType4) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.BigInt, typeof(ulong), false, false, v8Value5, ref argobj5, ref argType5))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    
                        argobj3 = argobj3 != null ? argobj3 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value3, false); System.Char arg3 = (System.Char)argobj3;
                    
                        string arg4 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value4, false);
                    
                        ulong arg5 = (ulong)StaticTranslate<ulong>.Get((int)data, isolate, Puerts.NativeValueApi.GetValueFromArgument, v8Value5, false);;
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, arg3, arg4, arg5, -123124124123, false, Puerts.UnitTest.AmbigiousCallTest.AENUM.b, 255, (char)65535, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 5)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                    IntPtr v8Value3 = PuertsDLL.GetArgumentValue(info, 3);
                    object argobj3 = null;
                    JsValueType argType3 = JsValueType.Invalid;
                
                    IntPtr v8Value4 = PuertsDLL.GetArgumentValue(info, 4);
                    object argobj4 = null;
                    JsValueType argType4 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value3, ref argobj3, ref argType3) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value4, ref argobj4, ref argType4))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    
                        argobj3 = argobj3 != null ? argobj3 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value3, false); System.Char arg3 = (System.Char)argobj3;
                    
                        string arg4 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value4, false);
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, arg3, arg4, 12381263987129837, -123124124123, false, Puerts.UnitTest.AmbigiousCallTest.AENUM.b, 255, (char)65535, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        
                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 4)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                    IntPtr v8Value3 = PuertsDLL.GetArgumentValue(info, 3);
                    object argobj3 = null;
                    JsValueType argType3 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(System.Char), false, false, v8Value3, ref argobj3, ref argType3))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    
                        argobj3 = argobj3 != null ? argobj3 : StaticTranslate<System.Char>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value3, false); System.Char arg3 = (System.Char)argobj3;
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, arg3, "ddd", 12381263987129837, -123124124123, false, Puerts.UnitTest.AmbigiousCallTest.AENUM.b, 255, (char)65535, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 3)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                    IntPtr v8Value2 = PuertsDLL.GetArgumentValue(info, 2);
                    object argobj2 = null;
                    JsValueType argType2 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(float), false, false, v8Value2, ref argobj2, ref argType2))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    
                        float arg2 = (float)PuertsDLL.GetNumberFromValue(isolate, v8Value2, false);
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, arg2, (char)99, "ddd", 12381263987129837, -123124124123, false, Puerts.UnitTest.AmbigiousCallTest.AENUM.b, 255, (char)65535, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 2)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                    IntPtr v8Value1 = PuertsDLL.GetArgumentValue(info, 1);
                    object argobj1 = null;
                    JsValueType argType1 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.Number, typeof(int), false, false, v8Value1, ref argobj1, ref argType1))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        int arg1 = (int)PuertsDLL.GetNumberFromValue(isolate, v8Value1, false);
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1, 0.3f, (char)99, "ddd", 12381263987129837, -123124124123, false, Puerts.UnitTest.AmbigiousCallTest.AENUM.b, 255, (char)65535, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0) && ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.NativeObject | Puerts.JsValueType.Function, typeof(System.Action), false, false, v8Value1, ref argobj1, ref argType1))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    
                        argobj1 = argobj1 != null ? argobj1 : StaticTranslate<System.Action>.Get((int)data, isolate, NativeValueApi.GetValueFromArgument, v8Value1, false); System.Action arg1 = (System.Action)argobj1;
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, arg1);

                    
                        
                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
                if (paramLen == 1)
            
                {
            
                
                    IntPtr v8Value0 = PuertsDLL.GetArgumentValue(info, 0);
                    object argobj0 = null;
                    JsValueType argType0 = JsValueType.Invalid;
                
                
                    
                    if (ArgHelper.IsMatch((int)data, isolate, Puerts.JsValueType.NullOrUndefined | Puerts.JsValueType.String, typeof(string), false, false, v8Value0, ref argobj0, ref argType0))
                    
                    {
                    
                        string arg0 = (string)PuertsDLL.GetStringFromValue(isolate, v8Value0, false);
                    

                        var result = Puerts.UnitTest.AmbigiousCallTest.PlaySound (arg0, 3, 0.3f, (char)99, "ddd", 12381263987129837, -123124124123, false, Puerts.UnitTest.AmbigiousCallTest.AENUM.b, 255, (char)65535, Single.PositiveInfinity, default(System.IntPtr));

                    
                        
                    
                        Puerts.PuertsDLL.ReturnNumber(isolate, info, result);
                        
                        return;
                    }
                
                }
            
        
                Puerts.PuertsDLL.ThrowException(isolate, "invalid arguments to PlaySound");
        
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
                    { new Puerts.MethodKey { Name = "PlaySound", IsStatic = true}, F_PlaySound }
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
