using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class EvalTest
    {
        // [Test]
        // public void ForceFail()
        // {
        //     Assert.True(1 == 2);
        // }
        [Test]
        public void EvalError()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                jsEnv.Eval(@"
                    var obj = {}; obj.func();
                ");
            });
            jsEnv.Tick();
        }
        [Test]
        public void ESModuleNotFound()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            try 
            {
                jsEnv.ExecuteModule("notfound/whatever.mjs");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("notfound/whatever.mjs", e.Message);
                return;
            }
            throw new Exception("unexpected to reach here");
            jsEnv.Tick();
        }
#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void ESModuleCompileError()
        {
            var loader = UnitTestEnv.GetLoader();
            loader.AddMockFileContent("compile-error/whatever.mjs", @"export delete;");
            var jsEnv = UnitTestEnv.GetEnv();
            try 
            {
                jsEnv.ExecuteModule("compile-error/whatever.mjs");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("export", e.Message);
                return;
            }
            throw new Exception("unexpected to reach here");
        }
#endif
        [Test]
        public void ESModuleCompileErrorInNested() //https://github.com/Tencent/puerts/issues/1670
        {
            var loader = UnitTestEnv.GetLoader();
            loader.AddMockFileContent("compile-error/AModule.mjs", @"import BModule from ""./BModule.mjs""

class AModule
{

}

console.log(`===AModule=====`);

export default AModule;");
            loader.AddMockFileContent("compile-error/BModule.mjs", @"import CrashTest from ""CrashTest.mjs""

class BModule
{

}

console.log(`===BModule=====`);

export default BModule;");
            loader.AddMockFileContent("compile-error/CrashTest.mjs", @"

class CrashTest
{
    async doSomthine(content) {
        let content = '123';        //这里声明的变量，和输入参数一样，语法错误导致，启动后Unity崩溃。
        return content;
    }
}

console.log(`======CrashTest======`)

export default CrashTest;");
            var jsEnv = UnitTestEnv.GetEnv();
            for (int i = 0; i < 10; ++i)
            {
                try 
                {
                    jsEnv.ExecuteModule("compile-error/AModule.mjs");
                } 
                catch(Exception e) 
                {
                    continue;
                }
                throw new Exception("unexpected to reach here");
            }
        }
        
        [Test]
        public void ESModuleEvaluateError()
        {
            var loader = UnitTestEnv.GetLoader();
            // loader.AddMockFileContent("eval-error/whatever.mjs", @"var obj = {}; obj.func();");
            var jsEnv = UnitTestEnv.GetEnv();
            try 
            {
                jsEnv.ExecuteModule("eval-error/whatever.mjs");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("not a function", e.Message);
                return;
            }
            throw new Exception("unexpected to reach here");
            jsEnv.Tick();
        }
        [Test]
        public void ESModuleImportNotFound()
        {
            var loader = UnitTestEnv.GetLoader();
            // loader.AddMockFileContent("notfound/entry.mjs", @"import './whatever.mjs'");
            var jsEnv = UnitTestEnv.GetEnv();
            try 
            {
                jsEnv.ExecuteModule("notfound/entry.mjs");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("whatever.mjs", e.Message);
                return;
            }
            throw new Exception("unexpected to reach here");
            jsEnv.Tick();
        }
#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void ESModuleImportCompileError()
        {
            var loader = UnitTestEnv.GetLoader();
            loader.AddMockFileContent("import-compile-error/whatever.mjs", @"export delete;");
            loader.AddMockFileContent("import-compile-error/entry.mjs", @"import './whatever.mjs'");
            var jsEnv = UnitTestEnv.GetEnv();
            try 
            {
                jsEnv.ExecuteModule("import-compile-error/entry.mjs");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("export", e.Message);
                return;
            }
            throw new Exception("unexpected to reach here");
            jsEnv.Tick();
        }
#endif
        [Test]
        public void ESModuleImportEvaluateError()
        {
            var loader = UnitTestEnv.GetLoader();
            // loader.AddMockFileContent("import-eval-error/whatever.mjs", @"var obj = {}; obj.func();");
            // loader.AddMockFileContent("import-eval-error/entry.mjs", @"import './whatever.mjs'");
            var jsEnv = UnitTestEnv.GetEnv();
            try 
            {
                jsEnv.ExecuteModule("import-eval-error/entry.mjs");
            } 
            catch(Exception e) 
            {
                StringAssert.Contains("not a function", e.Message);
                return;
            }
            throw new Exception("unexpected to reach here");
            jsEnv.Tick();
        }
        // [Test]
        // public void ESModuleExecuteCJS()
        // {
        //     var loader = UnitTestEnv.GetLoader();
        //     loader.AddMockFileContent("execute-cjs/cjs/whatever.cjs", @"
        //         module.exports = 'hello world';
        //     ");
        //     loader.AddMockFileContent("execute-cjs/mjs/whatever.mjs", @"
        //         import str from '../cjs/whatever.cjs';
                
        //         export default str;
        //     ");
        //     var jsEnv = UnitTestEnv.GetEnv();
        //     string str = jsEnv.ExecuteModule<string>("execute-cjs/mjs/whatever.mjs", "default");

        //     Assert.AreEqual(str, "hello world");
        // }
        [Test]
        public void ESModuleImportRelative()
        {
            var loader = UnitTestEnv.GetLoader();
            // loader.AddMockFileContent("import-relative/a/entry.mjs", @"
            //     import { str } from '../b/whatever.mjs'; 
            //     export { str };
            // ");
            // loader.AddMockFileContent("import-relative/b/whatever.mjs", @"export const str = 'hello'");
            var jsEnv = UnitTestEnv.GetEnv();
            string ret = jsEnv.ExecuteModule<string>("import-relative/a/entry.mjs", "str");

            Assert.AreEqual(ret, "hello");
            jsEnv.Tick();
        }
        [Test]
        public void ESModuleImportCircular()
        {
            var loader = UnitTestEnv.GetLoader();
            // loader.AddMockFileContent("import-circular/module1.mjs", @"
            //     import module2 from './module2.mjs';
            //     // CS.System.Console.WriteLine('module1 loading');

            //     function callMe(msg)
            //     {
            //         module2.callMe('module 2');
            //         // CS.System.Console.WriteLine('callMe called', msg);
            //     }

            //     class M1
            //     {
            //         constructor()
            //         {
            //             // CS.System.Console.WriteLine('M1');
            //         }
            //     }

            //     export default { callMe, M1 };
            // ");
            // loader.AddMockFileContent("import-circular/module2.mjs", @"
            //     import module1 from './module1.mjs';
            //     // CS.System.Console.WriteLine('module2 loading');

            //     function callMe(msg)
            //     {
            //         new module1.M1();
            //         // CS.System.Console.WriteLine('callMe called', msg);
            //     }


            //     export default { callMe };
            // ");
            // loader.AddMockFileContent("import-circular/main.mjs", @"
            //     import module1 from './module1.mjs';
            //     import module2 from './module2.mjs';

            //     module1.callMe('from john');
            //     module2.callMe('from bob');
            // ");
            var jsEnv = UnitTestEnv.GetEnv();

            jsEnv.ExecuteModule("import-circular/main.mjs");
            jsEnv.Tick();
        }
        [Test]
        public void ESModuleImportNotRelative()
        {
            var loader = UnitTestEnv.GetLoader();
            // loader.AddMockFileContent("import-not-relative/lib/test.mjs", @"
            //     import { M2 } from 'import-not-relative/module2.mjs';
            //     const Test = 'Test ' + M2

            //     export { Test };
            // ");
            // loader.AddMockFileContent("import-not-relative/module2.mjs", @"
            //     const M2 = 'M2';
            //     export { M2 };
            // ");
            // loader.AddMockFileContent("import-not-relative/main.mjs", @"
            //     import { M2 } from 'import-not-relative/module2.mjs'
            //     import { Test } from './lib/test.mjs';

            //     export default M2 + Test;
            // ");
            var jsEnv = UnitTestEnv.GetEnv();

            string res = jsEnv.ExecuteModule<string>("import-not-relative/main.mjs", "default");
            Assert.AreEqual(res, "M2Test M2");
            jsEnv.Tick();
        }
#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void ESModuleImportMeta()
        {
            var loader = UnitTestEnv.GetLoader();
            loader.AddMockFileContent("import-meta/entry.mjs", @"
                export default import.meta.url;
            ");
            var jsEnv = UnitTestEnv.GetEnv();

            string res = jsEnv.ExecuteModule<string>("import-meta/entry.mjs", "default");
            Assert.AreEqual(res, "puer:import-meta/entry.mjs");
            jsEnv.Tick();
        }
#endif
        [Test]
        public void ESModuleImportPackageTest()
        {
            var loader = UnitTestEnv.GetLoader();
            // loader.AddMockFileContent("import-package/index.js", @"
            //     import str from './lib.js'
            //     export default str
            // ");
            // loader.AddMockFileContent("import-package/lib.js", @"
            //     export default 'lib in package'
            // ");
            var jsEnv = UnitTestEnv.GetEnv();

            string res = jsEnv.ExecuteModule<string>("import-package", "default");
            Assert.AreEqual(res, "lib in package");
            jsEnv.Tick();
        }
        [Test]
        public void ESModuleExecuteCJS()
        {
            var loader = UnitTestEnv.GetLoader();
            // loader.AddMockFileContent("whatever.cjs", @"
            //     module.exports = 'hello world';
            // ");
            // loader.AddMockFileContent("whatever.mjs", @"
            //     import str from 'whatever.cjs';
                
            //     export default str;
            // ");
            var jsEnv = UnitTestEnv.GetEnv();
            string str = jsEnv.ExecuteModule<string>("a_mjs.mjs", "default");

            Assert.True(str == "hello world");
            jsEnv.Tick();

        }
        [Test]
        public void ESModuleExecuteCJSRelative()
        {
            var loader = UnitTestEnv.GetLoader();
            // loader.AddMockFileContent("cjs/whatever.cjs", @"
            //     module.exports = 'hello world';
            // ");
            // loader.AddMockFileContent("mjs/whatever.mjs", @"
            //     import str from '../cjs/whatever.cjs';
                
            //     export default str;
            // ");
            var jsEnv = UnitTestEnv.GetEnv();
            string str = jsEnv.ExecuteModule<string>("mjs/whatever.mjs", "default");

            Assert.True(str == "hello world");
            jsEnv.Tick();

        }


        [Test]
        public void ESDynamicModuleNotFound()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                import('notfound/whatever.mjs')
                    .catch(e => {
                        global.error_ESDynamicModuleNotFound = e
                    })
            ");
            jsEnv.Tick();
            string msg = jsEnv.Eval<string>("error_ESDynamicModuleNotFound.toString()");
            Assert.True(msg.Contains("notfound/whatever.mjs") || msg.Contains("notfound\\whatever.mjs"));
        }
#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void ESDynamicModuleCompileError()
        {
            var loader = UnitTestEnv.GetLoader();
            loader.AddMockFileContent("compile-error/whatever2.mjs", @"export delete;");
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                import('compile-error/whatever2.mjs')
                    .catch(e => {
                        global.error_ESDynamicModuleCompileError = e
                    })
            ");
            jsEnv.Tick();
            StringAssert.Contains("export", jsEnv.Eval<string>("error_ESDynamicModuleCompileError.toString()"));
        }
#endif
        [Test]
        public void ESDynamicModuleEvaluateError()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                import('eval-error/whatever.mjs')
                    .catch(e => {
                        global.error_ESDynamicModuleEvaluateError = e
                    })
            ");
            jsEnv.Tick();
            StringAssert.Contains("not a function", jsEnv.Eval<string>("error_ESDynamicModuleEvaluateError.toString()"));
        }
        [Test]
        public void ESDynamicModuleImportRelative()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.Eval(@"
                import('import-relative/a/entry.mjs')
                    .then(r => {
                        global.result_ESDynamicModuleImportRelative = r.str
                    })
            ");
            jsEnv.Tick();
            StringAssert.Contains("hello", jsEnv.Eval<string>("result_ESDynamicModuleImportRelative.toString()"));
        }
    }
}