using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class EvalTest
    {
        [Test]
        public void EvalError()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            Assert.Catch(() =>
            {
                jsEnv.Eval(@"
                    var obj = {}; obj.func();
                ");
            });
            jsEnv.Dispose();
        }
        [Test]
        public void ESModuleNotFound()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            try 
            {
                jsEnv.ExecuteModule("whatever.mjs");
            } 
            catch(Exception e) 
            {
                Assert.True(e.Message.Contains("whatever.mjs"));
                jsEnv.Dispose();
                return;
            }
            Assert.True(false);
        }
        [Test]
        public void ESModuleCompileError()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("whatever.mjs", @"export delete;");
            var jsEnv = new JsEnv(loader);
            try 
            {
                jsEnv.ExecuteModule("whatever.mjs");
            } 
            catch(Exception e) 
            {
                Assert.True(e.Message.Contains("export"));
                jsEnv.Dispose();
                return;
            }
            Assert.True(false);
        }
        [Test]
        public void ESModuleEvaluateError()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("whatever.mjs", @"var obj = {}; obj.func();");
            var jsEnv = new JsEnv(loader);
            try 
            {
                jsEnv.ExecuteModule("whatever.mjs");
            } 
            catch(Exception e) 
            {
                Assert.True(e.Message.Contains("not a function"));
                jsEnv.Dispose();
                return;
            }
            Assert.True(false);
        }
        [Test]
        public void ESModuleImportNotFound()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("entry.mjs", @"import 'whatever.mjs'");
            var jsEnv = new JsEnv(loader);
            try 
            {
                jsEnv.ExecuteModule("entry.mjs");
            } 
            catch(Exception e) 
            {
                Assert.True(e.Message.Contains("whatever.mjs"));
                jsEnv.Dispose();
                return;
            }
            Assert.True(false);
        }
        [Test]
        public void ESModuleImportCompileError()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("whatever.mjs", @"export delete;");
            loader.AddMockFileContent("entry.mjs", @"import 'whatever.mjs'");
            var jsEnv = new JsEnv(loader);
            try 
            {
                jsEnv.ExecuteModule("entry.mjs");
            } 
            catch(Exception e) 
            {
                Assert.True(e.Message.Contains("export"));
                jsEnv.Dispose();
                return;
            }
            Assert.True(false);
        }
        [Test]
        public void ESModuleImportEvaluateError()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("whatever.mjs", @"var obj = {}; obj.func();");
            loader.AddMockFileContent("entry.mjs", @"import 'whatever.mjs'");
            var jsEnv = new JsEnv(loader);
            try 
            {
                jsEnv.ExecuteModule("entry.mjs");
            } 
            catch(Exception e) 
            {
                Assert.True(e.Message.Contains("not a function"));
                jsEnv.Dispose();
                return;
            }
            Assert.True(false);
        }
        [Test]
        public void ESModuleExecuteCJS()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("whatever.cjs", @"
                module.exports = 'hello world';
            ");
            var jsEnv = new JsEnv(loader);
            string str = jsEnv.ExecuteModule<string>("whatever.cjs", "default");

            Assert.True(str == "hello world");

            jsEnv.Dispose();
        }
        [Test]
        public void ESModuleImportCSharp()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("whatever.mjs", @"
                import csharp from 'csharp';
                const func = function() { return csharp.System.String.Join(' ', 'hello', 'world') }
                export { func };
            ");
            var jsEnv = new JsEnv(loader);
            Func<string> func = jsEnv.ExecuteModule<Func<string>>("whatever.mjs", "func");

            Assert.True(func() == "hello world");

            jsEnv.Dispose();
        }
        [Test]
        public void ESModuleImportRelative()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("a/entry.mjs", @"
                import { str } from '../b/whatever.mjs'; 
                export { str };
            ");
            loader.AddMockFileContent("b/whatever.mjs", @"export const str = 'hello'");
            var jsEnv = new JsEnv(loader);
            string ret = jsEnv.ExecuteModule<string>("a/entry.mjs", "str");

            Assert.True(ret == "hello");

            jsEnv.Dispose();
        }
        [Test]
        public void ESModuleImportCircular()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("module1.mjs", @"
                import module2 from './module2.mjs';
                CS.System.Console.WriteLine('module1 loading');

                function callMe(msg)
                {
                    module2.callMe('module 2');
                    CS.System.Console.WriteLine('callMe called', msg);
                }

                class M1
                {
                    constructor()
                    {
                        CS.System.Console.WriteLine('M1');
                    }
                }

                export default { callMe, M1 };
            ");
            loader.AddMockFileContent("module2.mjs", @"
                import module1 from './module1.mjs';
                CS.System.Console.WriteLine('module2 loading');

                function callMe(msg)
                {
                    new module1.M1();
                    CS.System.Console.WriteLine('callMe called', msg);
                }


                export default { callMe };
            ");
            loader.AddMockFileContent("main.mjs", @"
                import module1 from './module1.mjs';
                import module2 from './module2.mjs';

                module1.callMe('from john');
                module2.callMe('from bob');
            ");
            var jsEnv = new JsEnv(loader);

            jsEnv.ExecuteModule("main.mjs");
            jsEnv.Dispose();
        }/*
        [Test]
        public void ESModuleImportCSharpNamespace()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("whatever.mjs", @"
                import csharp from 'csharp';
                const func = function() { return csharp.System.String.Join(' ', 'hello', 'world') }
                export { func };
            ");
            var jsEnv = new JsEnv(loader);
            var ns = jsEnv.ExecuteModule<JSObject>("whatever.mjs");

            Assert.True(ns != null);
            Assert.True(ns.GetType() == typeof(JSObject));

            jsEnv.Dispose();
        }*/
    }
}