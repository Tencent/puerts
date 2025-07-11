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
                local CS = require('csharp')
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

        [Test]
        public void ScriptFunctionInstanceLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local assertAndPrint = TestHelper.AssertAndPrint
                local testHelper = TestHelper.GetInstance()

                local oFunc = function() return 3 end
                local rFunc = testHelper:JSFunctionTestPipeLine(oFunc, function(func)
                    return oFunc
                end)

                local evfn = function() return 30 end
                testHelper:add_functionEvent(evfn)
                testHelper.functionTestField = function() return 3 end
                testHelper.functionTestProp = function() return 3 end
                TestHelper.functionTestFieldStatic = function() return 3 end
                TestHelper.functionTestPropStatic = function() return 3 end
                testHelper:JSFunctionTestCheckMemberValue()
                testHelper:remove_functionEvent(evfn);
            ");
        }

        [Test]
        public void NumberInstanceLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local assertAndPrint = TestHelper.AssertAndPrint
                local testHelper = TestHelper.GetInstance()

                local outRef = {}
                local oNum = 1
                outRef[1] = oNum

                local rNum = testHelper:NumberTestPipeLine(oNum, outRef, function(num)
                    assertAndPrint('LuaGetNumberArgFromCS', num, oNum + 1)
                    return oNum + 2
                end)
                
                assertAndPrint('LuaGetNumberOutArgFromCS', outRef[1], oNum + 3)
                assertAndPrint('LuaGetNumberReturnFromCS', rNum, oNum + 4)
                
                testHelper.numberTestField = 3
                testHelper.numberTestProp = 3
                TestHelper.numberTestFieldStatic = 3
                TestHelper.numberTestPropStatic = 3
                testHelper:NumberTestCheckMemberValue()
            ");
        }

        [Test]
        public void StringInstanceLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local assertAndPrint = TestHelper.AssertAndPrint
                local testHelper = TestHelper.GetInstance()

                local outRef = {}
                local oStr = 'abc'
                outRef[1] = oStr

                local rStr = testHelper:StringTestPipeLine(oStr, outRef, function(str)
                    assertAndPrint('LuaGetStringArgFromCS', str, 'abcd')
                    return 'abcde'
                end)
                
                assertAndPrint('LuaGetStringOutArgFromCS', outRef[1], 'abcdef')
                assertAndPrint('LuaGetStringReturnFromCS', rStr, 'abcdefg')

                testHelper.stringTestField = 'Puer'
                testHelper.stringTestProp = 'Puer'
                TestHelper.stringTestFieldStatic = 'Puer'
                TestHelper.stringTestPropStatic = 'Puer'
                testHelper:StringTestCheckMemberValue()
                
                local ustr = testHelper:UnicodeStr('你好')
                assertAndPrint('UnicodeStr', ustr, '小马哥')
            ");
        }

        [Test]
        public void BoolInstanceLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local assertAndPrint = TestHelper.AssertAndPrint
                local testHelper = TestHelper.GetInstance()

                local outRef = {}
                local oBool = true
                outRef[1] = oBool

                local rBool = testHelper:BoolTestPipeLine(oBool, outRef, function(b)
                    assertAndPrint('LuaGetBoolArgFromCS', b, false)
                    return true
                end)
                
                assertAndPrint('LuaGetBoolOutArgFromCS', outRef[1], false)
                assertAndPrint('LuaGetBoolReturnFromCS', rBool, false)
                
                testHelper.boolTestField = true
                testHelper.boolTestProp = true
                TestHelper.boolTestFieldStatic = true
                TestHelper.boolTestPropStatic = true
                testHelper:BoolTestCheckMemberValue()
            ");
        }

        [Test]
        public void NativeObjectInstanceLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local assertAndPrint = TestHelper.AssertAndPrint
                local testHelper = TestHelper.GetInstance()

                local outRef = {}
                local oNativeObject = CS.Puerts.UnitTest.TestObject(1)
                outRef[1] = oNativeObject

                local rNativeObject = testHelper:NativeObjectTestPipeLine(oNativeObject, outRef, function(obj)
                    assertAndPrint('LuaGetNativeObjectArgFromCS', obj.value, oNativeObject.value)
                    return oNativeObject
                end)
                
                assertAndPrint('LuaGetNativeObjectOutArgFromCS', outRef[1].value, oNativeObject.value)
                assertAndPrint('LuaGetNativeObjectReturnFromCS', rNativeObject.value, oNativeObject.value)
                
                testHelper.nativeObjectTestField = CS.Puerts.UnitTest.TestObject(678)
                testHelper.nativeObjectTestProp = CS.Puerts.UnitTest.TestObject(678)
                TestHelper.nativeObjectTestFieldStatic = CS.Puerts.UnitTest.TestObject(678)
                TestHelper.nativeObjectTestPropStatic = CS.Puerts.UnitTest.TestObject(678)
                testHelper:NativeObjectTestCheckMemberValue()
            ");
        }

        [Test]
        public void NativeStructInstanceLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local assertAndPrint = TestHelper.AssertAndPrint
                local testHelper = TestHelper.GetInstance()

                local outRef = {}
                local oNativeStruct = CS.Puerts.UnitTest.TestStruct(1)
                outRef[1] = oNativeStruct

                local rNativeStruct = testHelper:NativeStructTestPipeLine(oNativeStruct, outRef, function(obj)
                    assertAndPrint('LuaGetNativeStructArgFromCS', obj.value, oNativeStruct.value)
                    return oNativeStruct
                end)
                
                assertAndPrint('LuaGetNativeStructOutArgFromCS', outRef[1].value, oNativeStruct.value)
                assertAndPrint('LuaGetNativeStructReturnFromCS', rNativeStruct.value, oNativeStruct.value)

                testHelper.nativeStructTestField = CS.Puerts.UnitTest.TestStruct(765)
                testHelper.nativeStructTestProp = CS.Puerts.UnitTest.TestStruct(765)
                TestHelper.nativeStructTestFieldStatic = CS.Puerts.UnitTest.TestStruct(765)
                TestHelper.nativeStructTestPropStatic = CS.Puerts.UnitTest.TestStruct(765)
                testHelper:NativeStructTestCheckMemberValue()
            ");
        }

        [Test]
        public void NullableNativeStructInstanceLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local assertAndPrint = TestHelper.AssertAndPrint
                local testHelper = TestHelper.GetInstance()

                local outRef = {}
                local oNativeStruct = nil
                outRef[1] = oNativeStruct

                local rNativeStruct = testHelper:NullableNativeStructTestPipeLine(oNativeStruct, outRef, function(obj)
                    assertAndPrint('LuaGetNullableNativeStructArgFromCS', obj == nil)
                    return nil
                end)
                
                assertAndPrint('LuaGetNullableNativeStructOutArgFromCS', outRef[1] == nil)
                assertAndPrint('LuaGetNullableNativeStructReturnFromCS', rNativeStruct == nil)

                testHelper.nullableNativeStructTestField = nil
                testHelper.nullableNativeStructTestProp = nil
                TestHelper.nullableNativeStructTestFieldStatic = nil
                TestHelper.nullableNativeStructTestPropStatic = nil
                testHelper:NullableNativeStructTestCheckMemberValue()
            ");
        }
        
        [Test]
        public void ScriptObjectInstanceLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local assertAndPrint = TestHelper.AssertAndPrint
                local testHelper = TestHelper.GetInstance()

                local oJSObject = { puerts = 'niubi' }
                local rJSObject = testHelper:JSObjectTestPipeLine(oJSObject, function(obj)
                    assertAndPrint('LuaGetJSObjectArgFromCS', obj.puerts, oJSObject.puerts)
                    return oJSObject
                end)
                
                assertAndPrint('LuaGetJSObjectReturnFromCS', rJSObject == oJSObject)

                testHelper.jsObjectTestField = { puerts = 'niubi' }
                testHelper.jsObjectTestProp = { puerts = 'niubi' }
                TestHelper.jsObjectTestFieldStatic = { puerts = 'niubi' }
                TestHelper.jsObjectTestPropStatic = { puerts = 'niubi' }
                testHelper:JSObjectTestCheckMemberValue()
            ");
        }

        [Test]
        public void DateTimeLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            var ret = luaEnv.Eval<string>(@"
                local CS = require('csharp')
                local typeof = require('puerts').typeof
                local helper = CS.Puerts.UnitTest.CrossLangTestHelper()
                local val = helper:GetDateTime()
                return tostring(val:GetType() == typeof(CS.System.DateTime))
            ");
            Assert.AreEqual("true", ret);
        }

        [Test]
        public void EnumLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            var ret = luaEnv.Eval<string>(@"
                local CS = require('csharp')
                local helper = CS.Puerts.UnitTest.CrossLangTestHelper()
                local fstart = helper.EnumField
                helper.EnumField = CS.Puerts.UnitTest.TestEnum.A
                local fend = helper.EnumField
                local ret = helper:GetEnum()
                return tostring(fstart) .. ' ' .. tostring(fend) .. ' ' .. tostring(ret)
            ");
            Assert.AreEqual("213 1 213", ret);
        }

        [Test]
        public void AccessExplicitInterfaceImplementationLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            var ret = luaEnv.Eval<float>(@"
                local CS = require('csharp')
                local foove = CS.Puerts.UnitTest.FooVE.Instance()
                return foove.foo.width
            ");
            Assert.AreEqual(125f, ret);
        }

        [Test]
        public void OverloadLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local o = CS.Puerts.UnitTest.OverloadTestObject()
                o:WithObjectParam('tt')
            ");
            Assert.AreEqual(1, OverloadTestObject.LastCall);

            luaEnv.Eval(@"
                local CS = require('csharp')
                local o = CS.Puerts.UnitTest.OverloadTestObject()
                o:WithObjectParam(888)
            ");
            Assert.AreEqual(2, OverloadTestObject.LastCall);
        }

        [Test]
        public void FuncAsScriptObjectLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            var jso = luaEnv.Eval<JSObject>(@"
                return function() end
            ");
            Assert.True(jso != null);
        }

        [Test]
        public void EnumParamCheckLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                CS.Puerts.UnitTest.CrossLangTestHelper.TestEnumCheck('a', 1, 2)
            ");
        }

        [Test]
        public void PassNullLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local testHelper = TestHelper.GetInstance()
                testHelper:PassStr(nil)
                testHelper:PassObj(nil)
            ");
        }

        [Test]
        public void WriteOnlyLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local o = CS.Puerts.UnitTest.TestObject(1)
                local v = o.WriteOnly
                local sv = CS.Puerts.UnitTest.TestObject.StaticWriteOnly
            ");
        }

        [Test]
        public void TestStructAccessLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            var ret = luaEnv.Eval<string>(@"
                local CS = require('csharp')
                local s1 = CS.Puerts.UnitTest.TestStruct2(5345, 3214, 'fqpziq')
                return s1:ToString()
            ");
            Assert.AreEqual("5345:3214:fqpziq", ret);
        }

        [Test]
        public void NativeUnsafeStructInstanceLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local TestHelper = CS.Puerts.UnitTest.TestHelper
                local assertAndPrint = TestHelper.AssertAndPrint
                local testHelper = TestHelper.GetInstance()

                local outRef = {}
                local oNativeUnsafeStruct = CS.Puerts.UnitTest.TestUnsafeStruct(1)
                outRef[1] = oNativeUnsafeStruct

                local rNativeUnsafeStruct = testHelper:NativeUnsafeStructTestPipeLine(oNativeUnsafeStruct, outRef, function(obj)
                    assertAndPrint('LuaGetNativeUnsafeStructArgFromCS', obj.uintField, oNativeUnsafeStruct.uintField)
                    return oNativeUnsafeStruct
                end)
                
                assertAndPrint('LuaGetNativeUnsafeStructOutArgFromCS', outRef[1].uintField, oNativeUnsafeStruct.uintField)
                assertAndPrint('LuaGetNativeUnsafeStructReturnFromCS', rNativeUnsafeStruct.uintField, oNativeUnsafeStruct.uintField)

                testHelper.nativeUnsafeStructTestField = CS.Puerts.UnitTest.TestUnsafeStruct(765)
                testHelper.nativeUnsafeStructTestProp = CS.Puerts.UnitTest.TestUnsafeStruct(765)
                TestHelper.nativeUnsafeStructTestFieldStatic = CS.Puerts.UnitTest.TestUnsafeStruct(765)
                TestHelper.nativeUnsafeStructTestPropStatic = CS.Puerts.UnitTest.TestUnsafeStruct(765)
                testHelper:NativeUnsafeStructTestCheckMemberValue()
            ");
        }

        [Test]
        public void CallDelegateAfterLuaEnvDisposedTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            var callback = luaEnv.Eval<Action>(@"
                return function() print('hello') end
            ");
            callback();
            luaEnv.Dispose();
            Assert.Catch(() =>
            {
                callback();
            });
        }
        
        [Test]
        public void TestLuaGCTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            TestGC.ObjCount = 0;
            var objCount = luaEnv.Eval<int>(@"
                local CS = require('csharp')
                local randomCount = math.random(50) + 1
                objs = {}
                for i = 1, randomCount do
                    objs[i] = CS.Puerts.UnitTest.TestGC()
                end
                return randomCount
            ");

            luaEnv.Eval("collectgarbage('collect')");

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(objCount, TestGC.ObjCount);
            Assert.True(objCount > 0);

            luaEnv.Eval("objs = nil");
            luaEnv.Eval("collectgarbage('collect')");

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(0, TestGC.ObjCount);

            luaEnv.Dispose();
        }

        [Test]
        public void TestLuaStructGCTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            TestGC.ObjCount = 0;
            var objCount = luaEnv.Eval<int>(@"
                local CS = require('csharp')
                local randomCount = math.random(50) + 1
                objs = {}
                for i = 1, randomCount do
                    objs[i] = CS.Puerts.UnitTest.TakeTestGC(1)
                end
                return randomCount
            ");

            luaEnv.Eval("collectgarbage('collect')");

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(objCount, TestGC.ObjCount);
            Assert.True(objCount > 0);

            luaEnv.Eval("objs = nil");
            luaEnv.Eval("collectgarbage('collect')");

            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.AreEqual(0, TestGC.ObjCount);

            luaEnv.Dispose();
        }

        [Test]
        public void CastLuaFunctionAsTwoDiffDelegateTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                function __GCB(a, b)
                    if b == nil then
                        __GMSG = tostring(a)
                    else
                        __GMSG = tostring(a) .. tostring(b)
                    end
                end
            ");

            // Cast as Action<int>
            var cb1 = luaEnv.Eval<Action<int>>("return __GCB");
            cb1(1);
            var msg1 = luaEnv.Eval<string>("return __GMSG");
            Assert.AreEqual("1", msg1);

            // Cast as Action<string, long>
            var cb2 = luaEnv.Eval<Action<string, long>>("return __GCB");
            cb2("hello", 999);
            var msg2 = luaEnv.Eval<string>("return __GMSG");
            Assert.AreEqual("hello999", msg2);
        }

        [Test]
        public void NotGenericLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                function __NGTF(a)
                    return tostring(a)
                end
            ");

            var cb = luaEnv.Eval<Func<long, string>>("return __NGTF");
            var ret = cb(9999);
            Assert.AreEqual("9999", ret);
        }
    }
}
