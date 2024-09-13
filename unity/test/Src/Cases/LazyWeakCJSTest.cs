//#if PUERTS_GENERAL
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Threading;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class LazyWeakCJSTest
    {
        [Test]
        public void LazyLoadTest()
        {
#if PUERTS_GENERAL
            var jsEnv = new JsEnv(new TxtLoader());
#else
            var jsEnv = new JsEnv(new DefaultLoader());
#endif

            jsEnv.ExecuteModule("bootstrap_test.mjs");
            var res = jsEnv.Eval<string>("globalThis.lazyss");
            Assert.AreEqual("boot>>module_root>>foo>>", res);
            
            jsEnv.Eval<string>("globalThis.lazyss = undefined");
            
            // compare with no lazy version
            Puerts.ThirdParty.CommonJS.InjectSupportForCJS(jsEnv);
            jsEnv.Eval(@"
              var lm = require('./lazymodule.cjs');
              globalThis.lazyss += 'boot>>';
              lm.foo();
              lm = undefined;
            ");
            res = jsEnv.Eval<string>("globalThis.lazyss");
            Assert.AreEqual("module_root>>boot>>foo>>", res);
        }
        
        [Test]
        public void ModuleAutoReleaseTest()
        {
            #if PUERTS_GENERAL
            var jsEnv = new JsEnv(new TxtLoader());
#else
            var jsEnv = new JsEnv(new DefaultLoader());
#endif

            if (jsEnv.Backend is BackendQuickJS) return;
            jsEnv.ExecuteModule("puerts/module.mjs");

            jsEnv.Eval(@"
                const require = puer.module.createRequire('');
                var lm = require('lazymodule.cjs');
                lm.foo();
            ");
            
            var res = jsEnv.Eval<string>("puer.module.statModuleCache()");
            Assert.AreEqual("key\tweak?\tvalid?\nlazymodule.cjs\ttrue\ttrue\n", res);
            
            jsEnv.Eval<string>("lm = undefined;");
            jsEnv.Backend.LowMemoryNotification();
            if (jsEnv.Backend is BackendV8)
            {
                jsEnv.Eval<string>("gc();");
            }
            
            res = jsEnv.Eval<string>("puer.module.statModuleCache()");
            Assert.AreEqual("key\tweak?\tvalid?\nlazymodule.cjs\ttrue\tfalse\n", res);
            
            res = jsEnv.Eval<string>("puer.module.gcModuleCache();puer.module.statModuleCache()");
            Assert.AreEqual("key\tweak?\tvalid?\n", res);
        }
        
        [Test]
        public void HalfRefAutoReleaseTest()
        {
            #if PUERTS_GENERAL
            var jsEnv = new JsEnv(new TxtLoader());
#else
            var jsEnv = new JsEnv(new DefaultLoader());
#endif

            if (jsEnv.Backend is BackendQuickJS) return;
            jsEnv.ExecuteModule("puerts/module.mjs");

            jsEnv.Eval(@"
                const require = puer.module.createRequire('');
                var lm1 = require('lazymodule1.cjs');
                lm1.bar();
                lm1.notusinglm2();
            ");
            
            jsEnv.Backend.LowMemoryNotification();
            if (jsEnv.Backend is BackendV8)
            {
                jsEnv.Eval<string>("gc();");
            }
            
            var res = jsEnv.Eval<string>("puer.module.statModuleCache()");
            Assert.AreEqual("key\tweak?\tvalid?\nlazymodule1.cjs\ttrue\ttrue\nlazymodule2.cjs\ttrue\ttrue\n", res);
            
            jsEnv.Eval(@"var notusinglm2 = lm1.notusinglm2;lm1 = undefined"); //仅引用notusinglm2，不引用lm1
            
            jsEnv.Backend.LowMemoryNotification();
            if (jsEnv.Backend is BackendV8)
            {
                jsEnv.Eval<string>("gc();");
            }
            
            res = jsEnv.Eval<string>("puer.module.statModuleCache()");
            Assert.AreEqual("key\tweak?\tvalid?\nlazymodule1.cjs\ttrue\tfalse\nlazymodule2.cjs\ttrue\ttrue\n", res);
            
        }
        
        [Test]
        public void ManualReleaseTest()
        {
#if PUERTS_GENERAL
            var jsEnv = new JsEnv(new TxtLoader());
#else
            var jsEnv = new JsEnv(new DefaultLoader());
#endif

            jsEnv.ExecuteModule("puerts/module.mjs");

            jsEnv.Eval(@"
                const require = puer.module.createRequire('');
                var lm = require('lazymodule.cjs');
                lm.foo();
            ");
            
            Assert.AreEqual(true, jsEnv.Eval<bool>("puer.module.hasModuleCache('lazymodule.cjs')"));

            jsEnv.Eval<string>("puer.module.deleteModuleCache('lazymodule.cjs');if(typeof lm != 'object')throw new Error('abcdf')");
            
            Assert.AreEqual(false, jsEnv.Eval<bool>("puer.module.hasModuleCache('lazymodule.cjs')"));
        }
        
        [Test]
        public void CircularReqireTest()
        {
#if PUERTS_GENERAL
            var jsEnv = new JsEnv(new TxtLoader());
#else
            var jsEnv = new JsEnv(new DefaultLoader());
#endif
            jsEnv.ExecuteModule("puerts/module.mjs");
            
            var res = jsEnv.Eval<string>(@"
                const require = puer.module.createRequire('');
                var lm = require('circular_m1.cjs');
                lm.foo();
            ");
            
            Assert.AreEqual("hello john", res);
        }
    }
}
//#endif
