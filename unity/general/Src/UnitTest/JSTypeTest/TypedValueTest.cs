/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;
using System;

namespace Puerts.UnitTest
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
    }
    [TestFixture]
    public class TypedValueTest
    {
        [Test]
        public void Int64Value()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            jsEnv.Eval(@"
                const CS = require('csharp');
                let value = new CS.Puerts.Int64Value(512n);
                CS.Puerts.UnitTest.TypedValue.Callback(value);
            ");

            Assert.True(UnitTest.TypedValue.GetLastCallbackValueType() == typeof(System.Int64));
            Assert.False(UnitTest.TypedValue.GetLastCallbackValueType() == typeof(System.Int32));
        }
        [Test]
        public void Int64Value2()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            jsEnv.Eval(@"
                const CS = require('csharp');
                let value = new CS.Puerts.Int64Value(512n);
                CS.Puerts.UnitTest.TypedValue.CallbackLong(value);
            ");

            Assert.True(UnitTest.TypedValue.GetLastCallbackValueType() == typeof(System.Int64));
            Assert.False(UnitTest.TypedValue.GetLastCallbackValueType() == typeof(System.Int32));
        }
        [Test]
        public void FloatValue()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            jsEnv.Eval(@"
                const CS = require('csharp');
                let value = new CS.Puerts.FloatValue(512.256);
                CS.Puerts.UnitTest.TypedValue.Callback(value);
            ");

            Assert.True(UnitTest.TypedValue.GetLastCallbackValueType() == typeof(System.Single));
            Assert.False(UnitTest.TypedValue.GetLastCallbackValueType() == typeof(System.Int32));
        }
    }
}