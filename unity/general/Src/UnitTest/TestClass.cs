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

        public long Long(long l)
        {
            return l;
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

    public class ArrayTest
    {
        public int[] a0 = new int[] { 7, 8, 9 };

        public float[] a1 = new float[] { 7, 8, 9 };

        public double[] a2 = new double[] { 7, 8, 9 };

        public long[] a3 = new long[] { 7, 8, 9 };

        public ulong[] a4 = new ulong[] { 7, 8, 9 };

        public sbyte[] a5 = new sbyte[] { 7, 8, 9 };

        public short[] a6 = new short[] { 7, 8, 9 };

        public ushort[] a7 = new ushort[] { 7, 8, 9 };

        public char[] a8 = new char[] { (char)7, (char)8, (char)9 };

        public uint[] a9 = new uint[] { 7, 8, 9 };

        public bool[] ab = new bool[] { true, false, true, false };

        public string[] astr = new string[] { "hello", "john" };
    }
}