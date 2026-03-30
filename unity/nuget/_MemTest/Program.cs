using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Diagnostics.Windows.Configs;
using BenchmarkDotNet.Running;
using Puerts;
using System.Diagnostics;


//BenchmarkRunner.Run<ScriptEnvBenchmark>();
var env = new ScriptEnv(new BackendPython());

env.Eval($"""
          exec(r'''
          from System import Console, Int32, String
          from System.Collections.Generic import List_1, List
          import System.Collections.Generic.List as List
          from System.Collections.Generic import List
          
          List_int = List[Int32]
          myList111 = List_int()
          myList111.Add(123)
          Console.WriteLine("Item count: " + str(myList111.Count))
          
          
          print(type(List_1))
          List_1_Int = List_1[Int32]
          myList = List_1_Int()
          
          myList.Add(42)
          myList.Add(100)
          iter = puerts.gen_iterator(myList)

          for i in iter:
              Console.WriteLine("Item in myList: " + str(i))
              
          import GenericTest_1
          
          T = puerts.generic(GenericTest_1, Int32)

          GenericTest_1_Int = GenericTest_1[Int32]
          
          StaticTestMethod_Int32 = puerts.generic_method(GenericTest_1_Int, 'StaticTestMethod', Int32)
          StaticTestMethod_Int32(456)
          StaticTestMethod_Int32_Int32 = puerts.generic_method(GenericTest_1_Int, 'StaticTestMethod', Int32, Int32)
          StaticTestMethod_Int32_Int32(789)
          
          import GenericTest2_2
          GenericTest2_Int_String = GenericTest2_2[Int32, String]
          t2 = GenericTest2_Int_String()
          
          print(type(GenericTest2_Int_String.NestedClass))
          
          t = GenericTest_1_Int()
          
          print(puerts.generic_method(GenericTest_1_Int, 'TestMethod', 1))
          TestMethod_Int32 = type(puerts.generic_method(GenericTest_1_Int, 'TestMethod', Int32))
            

          ''')
          """);

public class GenericTest2<T1, T2>
{
    public GenericTest2()
    {
        Console.WriteLine("GenericTest2 constructor called with types: " + typeof(T1).Name + ", " + typeof(T2).Name);
    }

    public class NestedClass
    {
        
    }
}

public class GenericTest<T1>
{
    public T? TestMethod<T>(int param)
    {
        Console.WriteLine("GenericTest.TestMethod called with type: " + typeof(T).Name + " and value: " + param);
        return default(T);
    }
    
    public static T StaticTestMethod<T>(int param)
    {
        Console.WriteLine("GenericTest.StaticTestMethod called with type: " + typeof(T).Name + " and value: " + param);
        return default(T);
    }
    public static T1 StaticTestMethod<T1, T2>(int param)
    {
        Console.WriteLine("GenericTest.StaticTestMethod called with type: " + typeof(T1).Name + ", " + typeof(T2).Name + " and value: " + param);
        return default(T1);
    }
}


[ShortRunJob]
[MemoryDiagnoser]
[NativeMemoryProfiler]
public class ScriptEnvBenchmark
{
    const string code = """
                      exec('''
                      import System.Diagnostics.Debug as Debug
                      import TestClass, TestClass2, TestClass3, TestClass4
                      ''')
                      """;

    [Benchmark]
    public void CreateAndDisposeScriptEnvLoop100()
    {
        for (int i = 0; i < 100; i++)
        {
            var env = new ScriptEnv(new BackendPython());
            env.Eval(code);
            env.Dispose();
        }
    }

    [Benchmark]
    public void CreateAndDisposeScriptEnvLoop500()
    {
        for (int i = 0; i < 500; i++)
        {
            var env = new ScriptEnv(new BackendPython());
            env.Eval(code);
            env.Dispose();
        }
    }
}

public class TestClass
{
    public static int staticValue = 42;
    public int value;

    public TestClass(int v)
    {
        value = v;
    }
    public void Foo()
    {
        Debug.WriteLine("Foo: " + value);
    }
    public void Bar()
    {
        Debug.WriteLine("Bar: " + value);
    }
}

public class TestClass2
{
    public string text;

    public TestClass2(string t)
    {
        text = t;
    }

    public void Foo2()
    {

    }
    public void Bar2()
    {

    }
}
public class TestClass3
{
    public double number;

    public TestClass3(double n)
    {
        number = n;
    }
    public void Foo2()
    {

    }
    public void Bar2()
    {

    }
}
public class TestClass4
{
    public bool flag;

    public TestClass4(bool f)
    {
        flag = f;
    }
    public void Foo2()
    {

    }
    public void Bar2()
    {

    }
}