using NUnit.Framework;
using System;
using System.Runtime.InteropServices;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class CrossLangTestLua
    {
        [Test]
        public void ArrayBufferInstanceLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local assertAndPrint = TestHelper.AssertAndPrint
                local testHelper = TestHelper.GetInstance()
                local outRef = {}
                local oAB = buffer({1})

                local rAB = testHelper:ArrayBufferTestPipeLine(oAB, outRef, function(bi)
                    assertAndPrint('LuaGetArrayBufferArgFromCS', bi[1], 2)
                    local res = buffer({3})
                    return res
                end)
                
                assertAndPrint('LuaGetArrayBufferOutArgFromCS', outRef[1][1], 4)
                assertAndPrint('LuaGetArrayBufferReturnFromCS', rAB[1], 5)

                testHelper.arrayBufferTestField = buffer({192})
                testHelper.arrayBufferTestProp = buffer({192})
                TestHelper.arrayBufferTestFieldStatic = buffer({192})
                TestHelper.arrayBufferTestPropStatic = buffer({192})
                local tmp = TestHelper.arrayBufferTestPropStatic
                testHelper:ArrayBufferTestCheckMemberValue();
                assertAndPrint('LuaArrayBufferShouldBeCopied', tmp[1], 192);
            ");
        }
    }
}