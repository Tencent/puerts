using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
#if !PUERTS_GENERAL
    [TestFixture]
    public class BlittableCopyTestLua
    {
        [Test]
        public void DidnotShareMemory()
        {
            var luaEnv = new ScriptEnv(new BackendLua());

            int sumRed = luaEnv.Eval<int>(@"
                local CS = require('csharp')
                local colors = {}
                
                -- Create color array
                for i = 1, 8 do
                    colors[i] = CS.UnityEngine.Color(i, 1, 1, 1)
                end
                
                local a = CS.UnityEngine.Color(100, 1, 1, 1)
                colors[9] = a
                
                -- Calculate sum of red values
                local sumRed = 0
                for i = 1, #colors do
                    sumRed = sumRed + colors[i].r
                end
                
                return sumRed
            ");
            UnityEngine.Debug.Log(sumRed);
            Assert.True(sumRed < 200);
            Assert.True(sumRed > 100);
            
            luaEnv.Dispose();
        }
    }
#endif
}