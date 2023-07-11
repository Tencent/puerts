using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
    [TestFixture]
    public class BlittableCopyTest
    {
        [Test]
        public void DidnotShareMemory()
        {
            var jsEnv = UnitTestEnv.GetEnv();

            int sumRed = jsEnv.Eval<int>(@"
                (function() {
                    const colors = [
                        new CS.UnityEngine.Color(1, 1, 1, 1),
                        new CS.UnityEngine.Color(2, 1, 1, 1),
                        new CS.UnityEngine.Color(3, 1, 1, 1),
                        new CS.UnityEngine.Color(4, 1, 1, 1),
                        new CS.UnityEngine.Color(5, 1, 1, 1),
                        new CS.UnityEngine.Color(6, 1, 1, 1),
                        new CS.UnityEngine.Color(7, 1, 1, 1),
                        new CS.UnityEngine.Color(8, 1, 1, 1),
                    ]

                    const a = new CS.UnityEngine.Color(100, 1, 1, 1)
                    colors.push(a)

                    return colors.reduce((sumRed, color) => {
                        sumRed += color.r
                        return sumRed;
                    }, 0);
                })()
            ");
            UnityEngine.Debug.Log(sumRed);
            Assert.True(sumRed < 200);
            Assert.True(sumRed > 100);
            
            jsEnv.Tick();
        }
    }
}