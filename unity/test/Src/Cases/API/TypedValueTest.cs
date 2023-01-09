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

namespace Puerts.UnitTest.JSTypeTest
{
    [UnityEngine.Scripting.Preserve]
    public class TypedValueTestHelper
    {
        static object lastCallbackValue = null;
        
        [UnityEngine.Scripting.Preserve] public static void Callback(object o)
        {
            lastCallbackValue = o;
        }
        [UnityEngine.Scripting.Preserve] public static void CallbackLong(long l)
        {
            lastCallbackValue = l;
        }
        [UnityEngine.Scripting.Preserve] public static Type GetLastCallbackValueType() 
        {
            return lastCallbackValue == null ? null : lastCallbackValue.GetType();
        }

        public static long FieldLong = 0;
        [UnityEngine.Scripting.Preserve] public static bool IsFieldLongEquals(long l) 
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

        [UnityEngine.Scripting.Preserve] public static bool IsPropertyLongEquals(long l) 
        {
            return PropertyLong == l;
        }

        [UnityEngine.Scripting.Preserve] public static long ReturnALong() {
            return 9223372036854775807;
        }
        [UnityEngine.Scripting.Preserve] public static ulong ReturnAUlong() {
            return 18446744073709551614;
        }
    }
    [TestFixture]
    public class TypedValueTest
    {
        [Test]
        public void Int64Value()
        {
            var jsEnv = UnitTestEnv.GetEnv();

            jsEnv.Eval(@"
                (function() {
                    let value = new CS.Puerts.Int64Value(512n);
                    CS.Puerts.UnitTest.JSTypeTest.TypedValueTestHelper.Callback(value);
                })()
            ");

            Assert.True(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Int64));
            Assert.False(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Int32));
            jsEnv.Tick();
        }
        [Test]
        public void FloatValue()
        {
            var jsEnv = UnitTestEnv.GetEnv();

            jsEnv.Eval(@"
                (function() {
                    let value = new CS.Puerts.FloatValue(512.256);
                    CS.Puerts.UnitTest.JSTypeTest.TypedValueTestHelper.Callback(value);
                })()
            ");

            Assert.True(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Single));
            Assert.False(TypedValueTestHelper.GetLastCallbackValueType() == typeof(System.Int32));
            jsEnv.Tick();
        }
    }
}
