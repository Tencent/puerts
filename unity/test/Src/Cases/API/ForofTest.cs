using NUnit.Framework;
using System;
using System.Collections.Generic;
using Puerts;

namespace Puerts.UnitTest
{
    public class ForofTestHelper 
    {
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
        }
    }
}