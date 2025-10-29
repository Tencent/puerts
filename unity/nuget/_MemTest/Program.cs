using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Diagnostics.Windows.Configs;
using BenchmarkDotNet.Running;
using Iced.Intel;
using Puerts;
using System.Diagnostics;

[ShortRunJob]
[MemoryDiagnoser]
[NativeMemoryProfiler]
public class ScriptEnvBenchmark
{
    const string code = """
                      exec('''
                      CS = CSharp()
                      Debug = CS.load_type('System.Diagnostics.Debug')
                      TestClass = CS.load_type('TestClass')
                      TestClass2 = CS.load_type('TestClass2')
                      TestClass3 = CS.load_type('TestClass3')
                      TestClass4 = CS.load_type('TestClass4')
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

public static class Program
{
    public static void Main(string[] args)
    {
        BenchmarkRunner.Run<ScriptEnvBenchmark>();
    }
}

public class TestClass
{
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