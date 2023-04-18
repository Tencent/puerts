/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using Puerts;

namespace Puerts.UnitTest 
{
    public class UnitTestEnv
    {
        private static JsEnv env;
        private static UnitTestLoader loader;
        private static UnitTestLoader2 loader2;

        UnitTestEnv() { }

        private static void Init() 
        {
            if (env == null) 
            {
                loader = new UnitTestLoader();
                loader2 = new UnitTestLoader2();
                env = new JsEnv(loader2);
            }
        }

        public static JsEnv GetEnv() 
        {
            if (env == null) Init();
            return env;
        }

        public static UnitTestLoader2 GetLoader() 
        {
            if (env == null) Init();
            return loader2;
        }
    }
}