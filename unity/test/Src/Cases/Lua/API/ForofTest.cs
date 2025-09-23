using NUnit.Framework;
using System;
using System.Collections.Generic;
using Puerts;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public struct TestVectorLua
    {
        public double x;
        public double y;
        public double z;

        public TestVectorLua(double x, double y, double z) 
        {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public override string ToString() 
        { 
            return this.x + " " + this.y + " " + this.z;
        }
    }
    
    public class ForofTestHelperLua 
    {
        [UnityEngine.Scripting.Preserve]
        public static List<string> GetAStringList() 
        {
            return new List<string>()
            {
                "puerts",
                "really",
                "good"
            };
        }
    }
    
    [TestFixture]
    public class ForofTestLua
    {
        [Test]
        public void ListDictForofTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.Eval(@"
                local CS = require('csharp')
                local helper = CS.Puerts.UnitTest.ForofTestHelperLua
                local list = helper.GetAStringList()
                
                -- Test list iteration
                local result = ''
                for i = 0, list.Count - 1 do
                    result = result .. list:get_Item(i)
                    if i < list.Count - 1 then
                        result = result .. ','
                    end
                end
                
                assert(result == 'puerts,really,good', 'List iteration failed')
            ");
            luaEnv.Dispose();
        }
        
        [Test]
        public void ValueTypeListTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            var list = new TestVectorLua[] 
            {
                new TestVectorLua(4, 6, 1)
            };
            var ret = luaEnv.Eval<Func<TestVectorLua[], string>>(@"
                return function(list)
                    local vec = list:get_Item(0)
                    return tostring(vec.x) .. ' ' .. tostring(vec.y) .. ' ' .. tostring(vec.z)
                end
            ");
            Assert.AreEqual("4.0 6.0 1.0", ret(list));
            luaEnv.Dispose();
        }
        
        [Test]
        public void TableIterationTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            var result = luaEnv.Eval<string>(@"
                local t = {a = 1, b = 2, c = 3}
                local result = ''
                local keys = {}
                
                -- Collect keys first to ensure consistent order
                for k, v in pairs(t) do
                    table.insert(keys, k)
                end
                table.sort(keys)
                
                for i, k in ipairs(keys) do
                    result = result .. k .. '=' .. t[k]
                    if i < #keys then
                        result = result .. ','
                    end
                end
                
                return result
            ");
            Assert.AreEqual("a=1,b=2,c=3", result);
            luaEnv.Dispose();
        }
    }
}