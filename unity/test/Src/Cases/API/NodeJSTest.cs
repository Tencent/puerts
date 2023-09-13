using NUnit.Framework;
using System;
using Puerts;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class NodeJSTest
    {
        [Test]
        public void BackendIsNodeJSTest()
        {
            var env = UnitTestEnv.GetEnv();
            if (env.Backend is BackendNodeJS) {
                int pid = env.Eval<int>("process.pid");
                
                Assert.AreEqual(pid, System.Diagnostics.Process.GetCurrentProcess().Id);
            }
        }
    }
}