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
            if (env.Backend.GetType().Name  == "BackendNodeJS") {
                int pid = env.Eval<int>("process.pid");
                
                Assert.AreEqual(pid, System.Diagnostics.Process.GetCurrentProcess().Id);
            }
        }

        [Test]
        public void ImportNodeBuiltinsAsESM()
        {
            var env = UnitTestEnv.GetEnv();
            var loader = UnitTestEnv.GetLoader();

            loader.AddMockFileContent("node-builtin-import/main.mjs", @"
                import * as fs from ""fs"";
                import * as fs2 from ""node:fs"";
                import { createRequire } from ""node:module"";
                import { Buffer } from ""node:buffer"";

                const requiredFs = require(""fs"");

                export const ok =
                    typeof fs.writeFileSync === ""function"" &&
                    fs.writeFileSync === fs2.writeFileSync &&
                    typeof createRequire === ""function"" &&
                    Buffer.from(""ok"").toString() === ""ok"" &&
                    typeof requiredFs.writeFileSync === ""function"";

                export const sameRequire = requiredFs.writeFileSync === fs.writeFileSync;
            ");

            if (env.Backend.GetType().Name == "BackendNodeJS")
            {
                var exports = env.ExecuteModule("node-builtin-import/main.mjs");

                Assert.True(exports.Get<bool>("ok"));
                Assert.True(exports.Get<bool>("sameRequire"));
            }
            else
            {
                Assert.Throws<InvalidOperationException>(() => env.ExecuteModule("node-builtin-import/main.mjs"));
            }
        }
    }
}
