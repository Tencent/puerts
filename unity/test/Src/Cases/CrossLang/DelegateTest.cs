using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
    public delegate void TestCallback(string msg);
    class DelegateTestClass
    {
        public TestCallback Callback;
        
        public void CSMessage()
        {
            Callback("cs_msg");
        }
    };
    
    [TestFixture]
    public class DelegateTest
    {
        [Test]
        public void DelegateBase()
        {
            var jsEnv = UnitTestEnv.GetEnv();

            jsEnv.Eval(@"
                globalThis.deleteobj = new CS.Puerts.UnitTest.DelegateTestClass()
                deleteobj.Callback = (msg) => globalThis.info = msg;
                deleteobj.CSMessage();
            ");
            
            string info = jsEnv.Eval<string>("globalThis.info");
            Assert.AreEqual("cs_msg", info);
            
            jsEnv.Eval(@"deleteobj.Callback.Invoke('js_msg')");
            info = jsEnv.Eval<string>("globalThis.info");
            Assert.AreEqual("js_msg", info);
        }
    }
}