/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;
using System;
using System.Collections.Generic;


// too old. dont use this file anymore.
namespace PuerTS.UnitTest
{
    public class Util
    {
        public static int InvokeJSFunctionIntInt(Func<int, int> jsFunc, int arg)
        {
            return jsFunc(arg);
        }
    }

    public class ParentParent
    {
        public static void doSth()
        {
        }
    }
    public class GenericParent<T> : ParentParent
    {
    }
    public class SonClass: GenericParent<int>
    {
    }

    public struct S
    {
        int age;
        string name;
        public int Age
        {
            get
            {
                return age;
            }
            set
            {
                age = value;
            }
        }
        public string Name
        {
            get
            {
                return name;
            }
            set
            {
                name = value;
            }
        }
        public S(int i, string j) : this()
        {
            Age = i;
            Name = j;
        }
        public string TestParamObj(DerivedClass obj)
        {
            obj.baseIntField = 111;
            return obj.TestVirt(Age, Name);
        }
    }
    public class BaseClass
    {
        public int baseIntField = 10;
        public static string baseStringField = " base-static-field ";
        public int[] baseArr = new int[3];

        public virtual string TestVirt(int a, string str)
        {
            return str + a;
        }
        public virtual string TestBaseVirt()
        {
            return "base print" + baseStringField;
        }

        public static BaseClass operator +(BaseClass b1,BaseClass b2)
        {
            BaseClass b3 = new BaseClass();
            b3.baseIntField = b1.baseIntField + b2.baseIntField;
            return b3;
        }

        public static bool operator >=(BaseClass b1, BaseClass b2)
        {
            return b1.baseIntField >= b2.baseIntField;
        }

        public static bool operator <=(BaseClass b1, BaseClass b2)
        {
            return b1.baseIntField <= b2.baseIntField;
        }

        public int this[int i]
        {
            get
            {
                return baseArr[i];
            }
            set
            {
                baseArr[i] = value;
            }
        }

        public void ActionParam(System.Action action)
        {
        }
    }

    public class DerivedClass : BaseClass
    {
        public int Id(int x)
        {
            return x;
        }
        public override string TestVirt(int a, string str)
        {
            return str + a * 10 + " " + baseIntField;
        }

        public override string TestBaseVirt()
        {
            baseStringField = " fixed-base-static-field ";
            return base.TestBaseVirt();
        }

        public class Inner
        {
            public int A = 100;

            public int Add(int a, int b)
            {
                return a + b;
            }
            public static void Sub(int a, int b, out int c)
            {
                c = a - b;
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
        public string PrintStruct(S s)
        {
            s.Age = 20;
            return ("name : " + s.Name + " , age : " + s.Age);
        }

        public string PrintStructRef(ref S s)
        {
            s.Age = 20;
            return ("name : " + s.Name + " , age : " + s.Age);
        }


        public int Adds(int a, int b)
        {
            return (a + b);
        }
        public string Adds(string a, string b)
        {
            return (a + b);
        }

        public int TestList(List<int> list)
        {
            int sum = 0;
            foreach (var i in list)
            {
                sum += i;
            }
            return sum;
        }

        public string TryCatchFinally(bool bThrow, ref bool t, ref bool c, ref bool f, ref bool e)
        {
            string s = "";
            try
            {
                if (bThrow)
                {
                    throw new Exception();
                }
                s += "t";
                t = true;
            }
            catch
            {
                s += "c";
                c = true;
            }
            finally
            {
                s += "f";
                f = true;
            }
            s += "e";
            e = true;
            return s;
        }

        public string CatchByNextLevel(out bool f1, out bool f2, out bool f3)
        {
            string res = "";
            f1 = f2 = f3 = false;
            try
            {
                res += "try";
                try
                {
                    res += "-try";
                    throw new Exception();
                }
                finally
                {
                    res += "-finally";
                    f1 = true;
                }
            }
            catch
            {
                res += "-catch";
                f2 = true;
            }
            finally
            {
                res += "-finally";
                f3 = true;
            }
            return res;
        }

        public int TestListRange(List<int> l, int i)
        {
            return l[i];
        }

        public string TestDefaultParam(int i = 1, string s = "str")
        {
            return i + s;
        }

        public int TestErrorParam(int i)
        {
            return i;
        }

        public int TestErrorParamStruct(S s)
        {
            return s.Age;
        }

        public bool TestErrorParamClass(ISubA obj)
        {
            return obj.running;
        }

        public int TestInt(int i)
        {
            return i;
        }
        public String TestString(String s)
        {
            s += "gyx";
            return s;
        }

        public int TestStringLen(String s)
        {
            return s.Length;
        }

        public DateTime TestTime(DateTime time)
        {
            return time;
        }

        public ArrayBuffer TestArrayBuffer(ArrayBuffer array)
        {
            return array;
        }

        public void OutRefFunc(IA x, out IA y, ref IA z)
        {
            y = new ISubA();
            y.cmpTarget = 100;
        }

        public void OutString(out string str)
        {
            str = null;
        }
    }

    public delegate string MyCallBack(string str);

    public class EventTest
    {
        public MyCallBack myCallBack;
        public event MyCallBack myEvent;
        public static event MyCallBack myStaticEvent;

        public string Trigger()
        {
            string res = "start ";
            if (myCallBack != null)
            {
                res += myCallBack(" delegate ");
            }
            if (myEvent != null)
            {
                res += myCallBack(" event ");
            }
            if (myStaticEvent != null)
            {
                res += myCallBack(" static-event ");
            }
            res += " end";
            return res;
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

        public JSObject passThroughJSObject(JSObject obj) 
        {
            return obj;
        }

        public object passThroughJSObjectInAnyFunction(object obj) 
        {
            return obj;
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

    public abstract class Abs
    {
        public int age = 23;
        public abstract void TestRef(ref string name, out string res);
    }

    public class C : Abs
    {
        public override void TestRef(ref string name, out string res)
        {
            res = name + age;
            name = "anna";
        }
    }

    public interface IA
    {
        bool running { get; }

        int cmpTarget { set; get; }

        string TestBaseObj(BaseClass obj, int a, string b);


        string TestDerivedObj(DerivedClass obj, int a, string b);
        

        string TestArr(char[] arr);
    }


    public class ISubA : IA
    {

        public char[] a8 = new char[] { (char)(7 + '0'), (char)(8 + '0'), (char)(9 + '0') };
        public bool running
        {
            get
            {
                return true;
            }
        }

        public int cmpTarget { set; get; }

        public string TestBaseObj(BaseClass obj, int a, string b)
        {
            return obj.TestVirt(a, b);
        }

        public string TestDerivedObj(DerivedClass obj, int a, string b)
        {
            return obj.TestVirt(a, b);
        }

        public string TestArr(char[] arr)
        {
            string sum = "";
            for (int i = 0; i < arr.Length; i++)
            {
                sum += arr[i];
            }
            return sum;
        }

        public int TestArrInt(int[] array)
        {
            int sum = 0;
            for (int i = 0; i < array.Length; i++)
            {
                sum += array[i];
            }
            return sum;
        }

        public string TestArrString(string[] arr)
        {
            string str = "";
            for (int i = 0; i < arr.Length; i++)
            {
                str += arr[i];
            }
            return str;
        }
    }

    public class BaseClass1
    {

    }

    public class DerivedClass1 : BaseClass1
    {
    }

    public static class BaseClassExtension
    {
        public static int PrimitiveExtension(this BaseClass a)
        {
            return 111;
        }
        public static string PlainExtension(this BaseClass a)
        {
            return "PlainExtension";
        }

        public static T Extension<T>(this T a) where T : BaseClass
        {
            return a;
        }

        public static T Extension1<T>(this T a, string b) where T : BaseClass
        {
            return a;
        }

        public static string Extension2<T1, T2>(this T1 a, T2 b) where T1 : BaseClass where T2 : BaseClass1
        {
            return (string.Format("Extension2<{0},{1}>", typeof(T1), typeof(T2)));
        }
    }

    public class Reentrant
    {
        public Action Callback;

        public bool Call(bool b)
        {
            if (b && Callback != null) Callback();
            return true;
        }
    
    }

    public class ReadonlyStaticTest
    {
        public readonly static int ReadonlyStaticField = 1;
        public static int StaticField = 3;
    }
    public class OptionalParametersClass
    {
        public int Test(int i = 0, int j = 1, int k = 2)
        {
            return i * 100 + j * 10 + k;
        }

        public int Test(string i, int j = 1, int k = 2)
        {
            return j * 10 + k;
        }

        public int Test2(string i)
        {
            return 0;
        }

        public int Test2(string i, int j)
        {
            return j;
        }

        public int Test2(string i, int j, params bool[] k)
        {
            return -1;
        }

        public int Test3(string i, int b)
        {
            return 0;
        }

        public int Test4(string i, int b, int c = 0, int d = 1)
        {
            return 0;
        }

        public int Test5(string i, int j, params bool[] k)
        {
            return -1;
        }
        public int Test6(int d, int i = 1, params string[] strs)
        {
            return i + d;
        }
        public string TestFilter(string str)
        {
            return str + " hello";
        }
    }

}
