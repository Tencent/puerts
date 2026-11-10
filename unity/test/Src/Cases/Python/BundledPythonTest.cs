#if !UNITY_WEBGL && !UNITY_IOS && !UNITY_ANDROID || FORCE_TEST_PYTHON
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using NUnit.Framework;

namespace Puerts.UnitTest
{
    // 打印当前进程实际加载的 Python，并按运行环境校验来源：
    //   nuget 测试（PUERTS_NUGET_TEST）：必须来自 <输出目录>/runtimes 下 nuget 包自带的 Python
    //   Unity Editor：必须来自包内 PythonHome~/<rid>
    //   Unity Player：Player 下的 Python 定位尚未实现，只打印并校验版本
    //   dotnet 测试（PUERTS_GENERAL）：papi-python 按系统 Python 构建（bundled_python: false），只打印
    // 断言统一用抛异常的方式，兼容 Unity 测试用的简化版 NUnit（Src/TestFramework）和真正的 NUnit。
    [TestFixture]
    public class BundledPythonTest
    {
        // 需与 unity/native/papi-python/bundled-python.json、build_nuget.yml 中的 PY_MINOR_VERSION 同步修改
        const string ExpectedVersionPrefix = "3.14.";

        const string InfoBegin = "==== Bundled Python Info ====";
        const string InfoEnd = "==== End Bundled Python Info ====";

        static string Normalize(string path)
        {
            return Path.GetFullPath(path).Replace('\\', '/').TrimEnd('/');
        }

        static bool IsUnder(string path, string root)
        {
            if (string.IsNullOrEmpty(path) || string.IsNullOrEmpty(root)) return false;
            var cmp = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
            var p = Normalize(path);
            var r = Normalize(root);
            return p.Equals(r, cmp) || p.StartsWith(r + "/", cmp);
        }

        static void Check(bool condition, string message, string info)
        {
            if (!condition) throw new Exception(message + "\n" + info);
        }

        static void Output(string info)
        {
#if PUERTS_GENERAL
            TestContext.Progress.WriteLine(info);
#else
            UnityEngine.Debug.Log(info);
#endif
        }

        [Test]
        public void PrintAndCheckBundledPython()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            try
            {
                // 期望的 Python 根目录，null 表示该环境只打印、不校验来源
                string expectedRoot = null;
                bool checkVersion = true;
#if PUERTS_NUGET_TEST
                expectedRoot = Path.Combine(AppContext.BaseDirectory, "runtimes");
#elif PUERTS_GENERAL
                checkVersion = false;
#elif UNITY_EDITOR
                expectedRoot = BackendPython.ResolvePythonHome();
#endif

                string version = pythonEnv.Eval<string>("__import__('sys').version");
                string prefix = pythonEnv.Eval<string>("__import__('sys').prefix");
                string basePrefix = pythonEnv.Eval<string>("__import__('sys').base_prefix");
                string stdlibDir = pythonEnv.Eval<string>("str(getattr(__import__('sys'), '_stdlib_dir', None))");
                string jsonFile = pythonEnv.Eval<string>("__import__('json').__file__");
                string executable = pythonEnv.Eval<string>("str(__import__('sys').executable)");
                string sysPath = pythonEnv.Eval<string>("repr(__import__('sys').path)");

                var sb = new StringBuilder();
                sb.AppendLine(InfoBegin);
#if PUERTS_NUGET_TEST
                sb.AppendLine("environment:      nuget");
#elif PUERTS_GENERAL
                sb.AppendLine("environment:      dotnet (system python)");
#elif UNITY_EDITOR
                sb.AppendLine("environment:      unity editor");
#else
                sb.AppendLine("environment:      unity player");
#endif
                sb.AppendLine("expected root:    " + (expectedRoot ?? "(not checked)"));
                sb.AppendLine("sys.version:      " + version);
                sb.AppendLine("sys.prefix:       " + prefix);
                sb.AppendLine("sys.base_prefix:  " + basePrefix);
                sb.AppendLine("sys._stdlib_dir:  " + stdlibDir);
                sb.AppendLine("json.__file__:    " + jsonFile);
                sb.AppendLine("sys.executable:   " + executable);
                sb.AppendLine("sys.path:         " + sysPath);
                sb.AppendLine(InfoEnd);
                var info = sb.ToString();

                Output(info);

                if (checkVersion)
                {
                    Check(version.StartsWith(ExpectedVersionPrefix), "Python 版本不是 " + ExpectedVersionPrefix + "x", info);
                }
#if PUERTS_NUGET_TEST || (UNITY_EDITOR && !PUERTS_GENERAL)
                Check(expectedRoot != null, "没有找到自带的 Python，走了系统 Python", info);
                Check(IsUnder(prefix, expectedRoot), "sys.prefix 不在自带 Python 目录下", info);
                Check(IsUnder(basePrefix, expectedRoot), "sys.base_prefix 不在自带 Python 目录下", info);
                Check(IsUnder(jsonFile, expectedRoot), "标准库不是从自带 Python 目录加载", info);
#endif
            }
            finally
            {
                pythonEnv.Dispose();
            }
        }
    }
}

#endif
