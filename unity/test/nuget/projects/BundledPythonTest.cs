using NUnit.Framework;
using System;
using System.IO;
using System.Text;

namespace Puerts.UnitTest
{
    // 仅在 nuget 测试工程中编译：校验运行时加载的是 nuget 包内自带的 Python，而不是系统 / runner 上的 Python。
    [TestFixture]
    public class BundledPythonTest
    {
        // 需与 .github/workflows/build_nuget.yml 中的 PY_MINOR_VERSION 同步修改
        const string ExpectedVersionPrefix = "3.14.";

        static string Normalize(string path)
        {
            return Path.GetFullPath(path).Replace('\\', '/').TrimEnd('/');
        }

        static bool IsUnder(string path, string root)
        {
            var cmp = OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
            var p = Normalize(path);
            var r = Normalize(root);
            return p.Equals(r, cmp) || p.StartsWith(r + "/", cmp);
        }

        [Test]
        public void PrintAndCheckBundledPython()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            try
            {
                string version = pythonEnv.Eval<string>("__import__('sys').version");
                string prefix = pythonEnv.Eval<string>("__import__('sys').prefix");
                string basePrefix = pythonEnv.Eval<string>("__import__('sys').base_prefix");
                string stdlibDir = pythonEnv.Eval<string>("str(getattr(__import__('sys'), '_stdlib_dir', None))");
                string jsonFile = pythonEnv.Eval<string>("__import__('json').__file__");
                string executable = pythonEnv.Eval<string>("str(__import__('sys').executable)");
                string sysPath = pythonEnv.Eval<string>("repr(__import__('sys').path)");

                var baseDir = AppContext.BaseDirectory;
                var runtimesDir = Path.Combine(baseDir, "runtimes");

                var sb = new StringBuilder();
                sb.AppendLine("==== Bundled Python Info ====");
                sb.AppendLine("AppContext.BaseDirectory: " + baseDir);
                sb.AppendLine("sys.version:      " + version);
                sb.AppendLine("sys.prefix:       " + prefix);
                sb.AppendLine("sys.base_prefix:  " + basePrefix);
                sb.AppendLine("sys._stdlib_dir:  " + stdlibDir);
                sb.AppendLine("json.__file__:    " + jsonFile);
                sb.AppendLine("sys.executable:   " + executable);
                sb.AppendLine("sys.path:         " + sysPath);
                sb.AppendLine("=============================");
                var info = sb.ToString();

                TestContext.Progress.WriteLine(info);
                Console.WriteLine(info);

                StringAssert.StartsWith(ExpectedVersionPrefix, version, info);
                Assert.IsTrue(IsUnder(prefix, runtimesDir), "sys.prefix 不在 nuget 自带目录下\n" + info);
                Assert.IsTrue(IsUnder(basePrefix, runtimesDir), "sys.base_prefix 不在 nuget 自带目录下\n" + info);
                Assert.IsTrue(IsUnder(jsonFile, runtimesDir), "标准库不是从 nuget 自带目录加载\n" + info);
            }
            finally
            {
                pythonEnv.Dispose();
            }
        }
    }
}
