using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
#if !PUERTS_GENERAL
    [TestFixture]
    public class BlittableCopyTestPython
    {
        [Test]
        public void DidnotShareMemory()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());

            int sumRed = pythonEnv.Eval<int>(@"
exec('''
CS = CSharp()
Color = CS.load_type('UnityEngine.Color')
colors = []

for i in range(1, 9):
    colors.append(Color(i, 1, 1, 1))

a = Color(100, 1, 1, 1)
colors.append(a)

sumRed = 0
for color in colors:
    sumRed = sumRed + color.r

result = int(sumRed)
''')
result
");
            UnityEngine.Debug.Log(sumRed);
            Assert.True(sumRed < 200);
            Assert.True(sumRed > 100);
            
            pythonEnv.Dispose();
        }
    }
#endif
}
