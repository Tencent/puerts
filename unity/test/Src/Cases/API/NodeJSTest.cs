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
                string platform = env.Eval<string>("process.platform");
#if PLATFORM_WINDOWS
                Assert.AreEqual(platform, "win32");
#else
                Assert.AreEqual(platform, "darwin");
#endif
            }
        }
    }
}