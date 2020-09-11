/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;

namespace Puerts.UnitTest
{
    public class BaseClass
    {

    }

    public class DerivedClass : BaseClass
    {
        public int Id(int x)
        {
            return x;
        }


        public class Inner
        {
            public int A = 100;

            public int Add(int a, int b)
            {
                return a + b;
            }
        }

        public bool IsStringNull(string str)
        {
            return str == null;
        }
    }

    public class JsObjectTest
    {
        public GenericDelegate Getter;

        public GenericDelegate Setter;

        public void SetSomeData()
        {
            Setter.Action("a", 1);
            Setter.Action("b.a", "aabbcc");
        }

        public void GetSomeData()
        {
            Assert.AreEqual(1, Getter.Func<string, int>("a"));
            Assert.AreEqual("aabbcc", Getter.Func<string, string>("b.a"));
        }
    }
}