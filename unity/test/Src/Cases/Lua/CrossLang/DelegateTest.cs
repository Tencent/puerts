using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
    [TestFixture]
    public class DelegateTestLua
    {
        [Test]
        public void DelegateBase()
        {
            var luaEnv = new ScriptEnv(new BackendLua());

            luaEnv.Eval(@"
                local CS = require('csharp')
                deleteobj = CS.Puerts.UnitTest.DelegateTestClass()
                deleteobj.Callback = function(msg) 
                    info = msg
                end
                deleteobj:CSMessage()
            ");
            
            string info = luaEnv.Eval<string>("return info");
            Assert.AreEqual("cs_msg", info);
            
            luaEnv.Eval(@"deleteobj.Callback:Invoke('js_msg')");
            info = luaEnv.Eval<string>("return info");
            Assert.AreEqual("js_msg", info);
            
            luaEnv.Dispose();
        }
    }
}