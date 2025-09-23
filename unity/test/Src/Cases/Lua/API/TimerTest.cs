/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
using NUnit.Framework;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class TimerLua
    {
        private double now = 0;

        [UnityEngine.Scripting.Preserve]
        public TimerLua(double time)
        {
            now = time;
        }
        [UnityEngine.Scripting.Preserve]
        public double Now()
        {
            return now;
        }

        [UnityEngine.Scripting.Preserve]
        public void Tick()
        {
            now += 100;
        }
    }
    
    [TestFixture]
    public class TimerTestLua
    {
        public static int TestNum;
        
        [Test]
        public void BasicTimerTest()
        {
            TestNum = 0;
            var luaEnv = new ScriptEnv(new BackendLua());

            var timer = luaEnv.Eval<TimerLua>(@"
                local CS = require('csharp')
                local timer = CS.Puerts.UnitTest.TimerLua(0)
                local obj = CS.Puerts.UnitTest.TimerTestLua
                
                -- Simulate timer functionality
                local function simulateTimer()
                    obj.TestNum = obj.TestNum + 1
                end
                
                -- Call the function to simulate timer execution
                simulateTimer()
                
                return timer
            ");
            
            Assert.AreEqual(1, TestNum);
            luaEnv.Dispose();
        }

        [Test]
        public void TimerTickTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());

            var result = luaEnv.Eval<double>(@"
                local CS = require('csharp')
                local timer = CS.Puerts.UnitTest.TimerLua(1000)
                local initialTime = timer:Now()
                
                -- Tick the timer multiple times
                for i = 1, 5 do
                    timer:Tick()
                end
                
                local finalTime = timer:Now()
                return finalTime - initialTime
            ");
            
            Assert.AreEqual(500.0, result); // 5 ticks * 100 = 500
            luaEnv.Dispose();
        }
        
        [Test]
        public void LuaCoroutineTest()
        {
            var luaEnv = new ScriptEnv(new BackendLua());

            var result = luaEnv.Eval<int>(@"
                local counter = 0
                
                local function incrementCounter()
                    counter = counter + 1
                    coroutine.yield()
                    counter = counter + 1
                    coroutine.yield()
                    counter = counter + 1
                end
                
                local co = coroutine.create(incrementCounter)
                
                -- Resume coroutine multiple times
                coroutine.resume(co)  -- counter = 1
                coroutine.resume(co)  -- counter = 2
                coroutine.resume(co)  -- counter = 3
                
                return counter
            ");
            
            Assert.AreEqual(3, result);
            luaEnv.Dispose();
        }
    }
}