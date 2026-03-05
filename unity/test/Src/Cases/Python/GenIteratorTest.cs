#if !UNITY_WEBGL && !UNITY_IOS && !UNITY_ANDROID || FORCE_TEST_PYTHON
using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class GenIteratorTestPython
    {
        [Test]
        public void GenIteratorTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());

            pythonEnv.Eval(@"
exec('''
from System.Collections.Generic import List_1
from System import Int32
List_Int32 = List_1[Int32]
myList = List_Int32()
myList.Add(1)
myList.Add(2)
myList.Add(3)
iter = puerts.gen_iterator(myList)
result = []
for i in iter:
    result.append(i)
assert result == [1, 2, 3]
''')
");

            pythonEnv.Dispose();
        }
    }
}

#endif