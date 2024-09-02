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
            jsEnv.ExecuteModule("module.mjs");

            jsEnv.Eval(@"
                const require = puer.module.createRequire('');
                var lm = require('lazymodule.cjs');
                lm.foo();
            ");
            
            var res = jsEnv.Eval<string>("puer.module.statModuleCache()");
            Assert.AreEqual("key\tweak?\tvalid?\nlazymodule.cjs\ttrue\ttrue\n", res);
            
            jsEnv.Eval<string>("lm = undefined;");
            jsEnv.Backend.LowMemoryNotification();
            
            res = jsEnv.Eval<string>("puer.module.statModuleCache()");
            Assert.AreEqual("key\tweak?\tvalid?\nlazymodule.cjs\ttrue\tfalse\n", res);
            
            res = jsEnv.Eval<string>("puer.module.clearModuleCache();puer.module.statModuleCache()");
            Assert.AreEqual("key\tweak?\tvalid?\n", res);
        }
    }
}
//#endif
