using NUnit.Framework;
using System;
using System.Collections.Generic;
using Puerts;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public struct TestVector
    {
        public double x;
        public double y;
        public double z;

        public TestVector(double x, double y, double z) 
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
    public class ForofTestHelper 
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
    public class ForofTest
    {
        [Test]
        public void ListDictForofTest()
        {
            var env = UnitTestEnv.GetEnv();
            env.ExecuteModule("CSharpModuleTest/forof_test.mjs");
            env.Tick();
        }
        
        [Test]
        public void ValueTypeListTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var list = new TestVector[] 
            {
                new TestVector(4, 6, 1)
            };
            var ret = jsEnv.Eval<Func<TestVector[], string>>(@"
                (function(list) {
                    var vec = list.get_Item(0);
                    return `${vec.x} ${vec.y} ${vec.z}`
                })
            ");
            Assert.AreEqual("4 6 1", ret(list));
            jsEnv.Tick();
        }
    }
}