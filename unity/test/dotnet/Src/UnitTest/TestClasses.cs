/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;
using System;
using System.Collections.Generic;

namespace PuerTS.UnitTest
{
    public class ParamsCallTest
    {
        public static string CombinePath(params object[] paths)
        {
            if (paths.Length == 0) { return ""; }
            string ret = paths[0].ToString();
            for (var i = 1; i < paths.Length; i++)
            {
                ret = ret + "/" + paths[i].ToString();
            }
            return ret;
        }
    }
    public class AmbigiousCallTest 
    {
        public enum AENUM
        {
            a = 123, b = 456
        }

        public static int PlaySound(
            string uid, 
            int a = 3, 
            float b = .3f, 
            char c = 'c', 
            string d = "ddd", 
            ulong e = 12381263987129837, 
            long f = -123124124123,
            bool g = false,
            AENUM h = AENUM.b,
            byte i = 255,
            char j = char.MaxValue,
            float k = float.PositiveInfinity,
            IntPtr l = default(IntPtr)
        )
        { return 1; }
        public static int PlaySound(string uid,Action onCompleted = default) 
        { return 2; }
        public static int PlaySound(string uid) 
        { return 3; }
    }
    public class MultiEnvTestA
    {
        int number;

        public MultiEnvTestA(int a) { number = a; }

        public int GetA() 
        {
            return number;
        }

        public static MultiEnvTestA CreateA() 
        {
            return new MultiEnvTestA(3);
        }
    }
    public class MultiEnvTestB
    {
        int number;

        public MultiEnvTestB(int b) { number = b; }

        public int GetB() 
        {
            return number;
        }

        public static MultiEnvTestB CreateB() 
        {
            return new MultiEnvTestB(3);
        }
    }

    public class Utils {

        public static void RegisterStaticWrapper(JsEnv env) 
        {
            const string AutoStaticCodeRegisterClassName = "PuertsStaticWrap.AutoStaticCodeRegister";
            var autoRegister = Type.GetType(AutoStaticCodeRegisterClassName, false);
            if (autoRegister == null)
            {
                foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
                {
                    autoRegister = assembly.GetType(AutoStaticCodeRegisterClassName, false);
                    if (autoRegister != null) break;
                }
            }
            if (autoRegister != null)
            {
                var methodInfoOfRegister = autoRegister.GetMethod("Register");
                methodInfoOfRegister.Invoke(null, new object[] { env });
            }
        }
    }
}
