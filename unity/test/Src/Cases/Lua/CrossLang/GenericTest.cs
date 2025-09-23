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

        [Test]
        public void StaticGenericMethodLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            string genericTypeName1 = luaEnv.Eval<string>(@"
                local CS = require('csharp')
                local puerts = require('puerts')
                local func = puerts.genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', CS.System.Int32);
                return func();
            ");
            Assert.AreEqual(genericTypeName1, "Int32");
            luaEnv.Dispose();
        }

        [Test]
        public void ListRangeLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(() => 
            {
                luaEnv.Eval(@"
                    local CS = require('csharp')
                    local puerts = require('puerts')
                    local List = puerts.generic(CS.System.Collections.Generic.List_1, CS.System.Int32)
                    local ls = List()
                    ls:Add(1)
                    ls:Add(2)
                    local res = CS.Puerts.UnitTest.GenericTestHelper.TestListRange(ls,2)
                ");
            });
            luaEnv.Dispose();
        }

        [Test]
        public void StaticGenericMethodInvalidClassLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            try
            {
                luaEnv.Eval<string>(@"
                    local CS = require('csharp')
                    local puerts = require('puerts')
                    local func = puerts.genericMethod(CS.Puerts.UnitTest, 'StaticGenericMethod', CS.System.Int32)
                    return func()
                ");
            }
            catch (Exception e)
            {
                StringAssert.Contains("the class must be a constructor", e.Message);
                luaEnv.Dispose();
                return;
            }
            luaEnv.Dispose();
            throw new Exception("unexpected reach here");
        }

        [Test]
        public void StaticGenericMethodInvalidGenericArgumentsLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            try
            {
                luaEnv.Eval<string>(@"
                    local CS = require('csharp')
                    local puerts = require('puerts')
                    local func = puerts.genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', 3)
                    return func()
                ");
                Assert.True(false);
            }
            catch (Exception e)
            {
                Assert.True(e.Message.Contains("invalid Type for generic arguments 1"));
            }
            luaEnv.Dispose();
        }

        [Test]
        public void StaticGenericMethodInvalidCallArgumentsLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            Assert.Catch(() =>
            {
                string genericTypeName1 = luaEnv.Eval<string>(@"
                    local CS = require('csharp')
                    local puerts = require('puerts')
                    local func = puerts.genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', CS.System.Int32)
                    return func('hello')
                ");
            }, "invalid arguments to StaticGenericMethod");
            luaEnv.Dispose();
        }

        [Test]
        public void StaticGenericMethodTestOverloadLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            string result = luaEnv.Eval<string>(@"
                local CS = require('csharp')
                local puerts = require('puerts')
                local func = puerts.genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', CS.System.Int32)
                return func(3)
            ");
            Assert.AreEqual(result, "3");
            luaEnv.Dispose();
        }

        [Test]
        public void InstanceGenericMethodLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            string result = luaEnv.Eval<string>(@"
                local CS = require('csharp')
                local puerts = require('puerts')
                local testobj = CS.Puerts.UnitTest.GenericTestClass()
                testobj.stringProp = 'world'
                local func = puerts.genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'InstanceGenericMethod', CS.System.Int32)
                return func(testobj)
            ");
            Assert.AreEqual(result, "world_Int32");
            luaEnv.Dispose();
        }

        [Test]
        public void GenericAccessLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            string result = luaEnv.Eval<string>(@"
                local CS = require('csharp')
                local puerts = require('puerts')
                local GenericTestClass = puerts.generic(CS.Puerts.UnitTest.GenericTestClass_1, CS.System.String)
                GenericTestClass.v = '6'
                GenericTestClass.Inner()
                return GenericTestClass.Inner.stringProp
            ");
            Assert.AreEqual(result, "hello");
            luaEnv.Dispose();
        }

        // web平台没有gc的api
#if !UNITY_WEBGL || UNITY_EDITOR
        [Test]
        public void CreateFunctionByMethodInfoLuaTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            string result = luaEnv.Eval<string>(@"
                local CS = require('csharp')
                local puerts = require('puerts')
                local cls = puerts.typeof(CS.Puerts.UnitTest.GenericTestClass)
                local methods = CS.Puerts.Utils.GetMethodAndOverrideMethodByName(cls, 'StaticGenericMethod')
                local overloads = {}
                for i = 0, methods.Length - 1 do
                    local method = methods:GetValue(i)
                    table.insert(overloads, method:MakeGenericMethod(puerts.typeof(CS.System.Int32)))
                end
                local func = puerts.createFunction(table.unpack(overloads))
                return func() .. func(1024)
            ");
            Assert.AreEqual(result, "Int321024");
            luaEnv.Dispose();
        }
#endif
    }
}
