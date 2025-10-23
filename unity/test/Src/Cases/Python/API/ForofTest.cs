#if !UNITY_WEBGL
using NUnit.Framework;
using System;
using System.Collections.Generic;
using Puerts;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public struct TestVectorPython
    {
        public double x;
        public double y;
        public double z;

        public TestVectorPython(double x, double y, double z) 
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
    
    public class ForofTestHelperPython 
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
    public class ForofTestPython
    {
        [Test]
        public void ListDictForofTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.Eval(@"
exec('''
CS = CSharp()
helper = CS.load_type('Puerts.UnitTest.ForofTestHelperPython')
list = helper.GetAStringList()

# Test list iteration
result = ''
for i in range(list.Count):
    result = result + list.get_Item(i)
    if i < list.Count - 1:
        result = result + ','

assert result == 'puerts,really,good', 'List iteration failed'
''')
");
            pythonEnv.Dispose();
        }
        
        [Test]
        public void ValueTypeListTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            var list = new TestVectorPython[] 
            {
                new TestVectorPython(4, 6, 1)
            };
            var ret = pythonEnv.Eval<Func<TestVectorPython[], string>>(@"
lambda list: (
    vec := list.GetValue(0),
    str(vec.x) + ' ' + str(vec.y) + ' ' + str(vec.z)
)[-1]
");
            Assert.AreEqual("4.0 6.0 1.0", ret(list));
            pythonEnv.Dispose();
        }
        
    }
}

#endif