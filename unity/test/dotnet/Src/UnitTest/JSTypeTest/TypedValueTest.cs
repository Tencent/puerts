/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;
using System;

namespace PuerTS.UnitTest.JSTypeTest
{
    public class TypedValue
    {
        static object lastCallbackValue = null;
        public static void Callback(object o)
        {
            lastCallbackValue = o;
        }
        public static void CallbackLong(long l)
        {
            lastCallbackValue = l;
        }
        public static Type GetLastCallbackValueType() 
        {
            return lastCallbackValue == null ? null : lastCallbackValue.GetType();
        }

        public static long FieldLong = 0;
        public static bool IsFieldLongEquals(long l) 
        {
            return FieldLong == l;
        }

        private static long _PropertyLong;
        public static long PropertyLong
        {
            get
            {
                return _PropertyLong;
            }
            set
            {
                _PropertyLong = value;
            }
        }

        public static bool IsPropertyLongEquals(long l) 
        {
            return PropertyLong == l;
        }

        public static long ReturnALong() {
            return 9223372036854775807;
        }
        public static ulong ReturnAUlong() {
            return 18446744073709551614;
        }
    }
    [TestFixture]
    public class TypedValueTest
    {
        [Test]
        public void Int64Value()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            jsEnv.Eval(@"
                let value = new CS.Puerts.Int64Value(512n);
                CS.Puerts.UnitTest.JSTypeTest.TypedValue.Callback(value);
            ");

            Assert.True(TypedValue.GetLastCallbackValueType() == typeof(System.Int64));
            Assert.False(TypedValue.GetLastCallbackValueType() == typeof(System.Int32));
        }
        [Test]
        public void Int64Value2()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            jsEnv.Eval(@"
                let value = new CS.Puerts.Int64Value(512n);
                CS.Puerts.UnitTest.JSTypeTest.TypedValue.CallbackLong(value);
            ");

            Assert.True(TypedValue.GetLastCallbackValueType() == typeof(System.Int64));
            Assert.False(TypedValue.GetLastCallbackValueType() == typeof(System.Int32));
        }
        [Test]
        public void Int64Value3()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            jsEnv.Eval(@"
                let value = new CS.Puerts.Int64Value(512n);
                CS.Puerts.UnitTest.JSTypeTest.TypedValue.FieldLong = value;
            ");

            Assert.True(TypedValue.IsFieldLongEquals(512));
        }
        [Test]
        public void Int64Value4()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            jsEnv.Eval(@"
                let value = new CS.Puerts.Int64Value(512n);
                CS.Puerts.UnitTest.JSTypeTest.TypedValue.PropertyLong = value;
            ");

            Assert.True(TypedValue.IsPropertyLongEquals(512));
        }
        [Test]
        public void ConvertLongToString()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            jsEnv.RegisterGeneralGetSet(
                typeof(long),
                null,
                (int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj) =>
                {
                    setValueApi.SetString(isolate, holder, obj.ToString());
                }
            );
            Puerts.StaticTranslate<long>.ReplaceDefault(
                (int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, long obj) =>
                {
                    setValueApi.SetString(isolate, holder, obj.ToString());
                },
                null
            );

            Assert.True(
                jsEnv.Eval<bool>(@"
                    typeof CS.Puerts.UnitTest.JSTypeTest.TypedValue.ReturnALong() == 'string';
                ")
            );
        }
        [Test]
        public void ConvertULongToString()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            jsEnv.RegisterGeneralGetSet(
                typeof(ulong),
                null,
                (int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, object obj) =>
                {
                    setValueApi.SetString(isolate, holder, obj.ToString());
                }
            );
            Puerts.StaticTranslate<ulong>.ReplaceDefault(
                (int jsEnvIdx, IntPtr isolate, ISetValueToJs setValueApi, IntPtr holder, ulong obj) =>
                {
                    setValueApi.SetString(isolate, holder, obj.ToString());
                },
                null
            );

            Assert.True(
                jsEnv.Eval<bool>(@"
                    typeof CS.Puerts.UnitTest.JSTypeTest.TypedValue.ReturnAUlong() == 'string';
                ")
            );
        }
        [Test]
        public void FloatValue()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            jsEnv.Eval(@"
                let value = new CS.Puerts.FloatValue(512.256);
                CS.Puerts.UnitTest.JSTypeTest.TypedValue.Callback(value);
            ");

            Assert.True(TypedValue.GetLastCallbackValueType() == typeof(System.Single));
            Assert.False(TypedValue.GetLastCallbackValueType() == typeof(System.Int32));
        }
    }
}
