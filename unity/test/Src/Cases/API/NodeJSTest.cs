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
                string pid = env.Eval<string>("process.pid");
                
                Assert.AreEqual(pid, System.Diagnostics.Process.GetCurrentProcess().Id);
            }
        }
    }
}