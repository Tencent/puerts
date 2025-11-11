#if !UNITY_WEBGL
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
    public class TimerPython
    {
        private double now = 0;

        [UnityEngine.Scripting.Preserve]
        public TimerPython(double time)
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
    public class TimerTestPython
    {
        public static int TestNum;
        
        [Test]
        public void BasicTimerTest()
        {
            TestNum = 0;
            var pythonEnv = new ScriptEnv(new BackendPython());

            var timer = pythonEnv.Eval<TimerPython>(@"
(lambda: (
    timer := puerts.load_type('Puerts.UnitTest.TimerPython')(0),
    TimerTestPython := puerts.load_type('Puerts.UnitTest.TimerTestPython'),
    TimerTestPython.set_TestNum(TimerTestPython.get_TestNum() + 1),
    timer
)[-1])()
");
            
            Assert.AreEqual(1, TestNum);
            pythonEnv.Dispose();
        }

        [Test]
        public void TimerTickTest()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());

            var result = pythonEnv.Eval<double>(@"
(lambda: (
    timer := puerts.load_type('Puerts.UnitTest.TimerPython')(1000),
    initialTime := timer.Now(),
    [timer.Tick() for i in range(5)],
    finalTime := timer.Now(),
    finalTime - initialTime
)[-1])()
");
            
            Assert.AreEqual(500.0, result); // 5 ticks * 100 = 500
            pythonEnv.Dispose();
        }
        
    }
}

#endif