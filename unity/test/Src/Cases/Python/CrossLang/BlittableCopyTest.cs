#if !UNITY_WEBGL
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
(lambda: (
    Color := puerts.load_type('UnityEngine.Color'),
    colors := [Color(float(i), 1.0, 1.0, 1.0) for i in range(1, 9)],
    a := Color(100.0, 1.0, 1.0, 1.0),
    colors.append(a),
    sumRed := sum(color.r for color in colors),
    int(sumRed)
)[-1])()
");
            UnityEngine.Debug.Log(sumRed);
            Assert.True(sumRed < 200);
            Assert.True(sumRed > 100);
            
            pythonEnv.Dispose();
        }
    }
#endif
}

#endif