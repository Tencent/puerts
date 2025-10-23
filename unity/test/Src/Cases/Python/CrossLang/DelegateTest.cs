using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
    [TestFixture]
    public class DelegateTestPython
    {
        [Test]
        public void DelegateBase()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());

            pythonEnv.Eval(@"
exec('''
CS = CSharp()
deleteobj = CS.load_type('Puerts.UnitTest.DelegateTestClass')()
def callback(msg):
    global info
    info = msg
deleteobj.Callback = callback
deleteobj.CSMessage()
''')
");
            
            string info = pythonEnv.Eval<string>("info");
            Assert.AreEqual("cs_msg", info);
            
            pythonEnv.Eval(@"
exec('''
deleteobj.Callback.Invoke('js_msg')
''')
");
            info = pythonEnv.Eval<string>("info");
            Assert.AreEqual("js_msg", info);
            
            pythonEnv.Dispose();
        }
    }
}
