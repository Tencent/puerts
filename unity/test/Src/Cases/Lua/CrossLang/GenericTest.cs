using NUnit.Framework;
using System;
using System.Runtime.InteropServices;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class GenericUnitLuaTest
    {
        [Test]
        public void ListGenericLuaTest()
        {
            var preserveList = new System.Collections.Generic.List<int>();
            var luaEnv = new ScriptEnv(new BackendLua());
            var res = luaEnv.Eval<int>(@"
                local CS = require('csharp')
                local puerts = require('puerts')
                local List = puerts.generic(CS.System.Collections.Generic.List_1, CS.System.Int32)
                local ls = List();
                ls:Add(1);
                ls:Add(2);
                ls:Add(3);
                local res = CS.Puerts.UnitTest.GenericTestHelper.TestList(ls);
                return res;
            ");
            Assert.AreEqual(res, 6);
            luaEnv.Dispose();
        }
    }
}
