/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;

namespace Puerts.UnitTest
{
    class Timer
    {
        private double now = 0;

        public Timer(double time)
        {
            now = time;
        }
        public double Now()
        {
            return now;
        }

        public void Tick()
        {
            now += 100;
        }
    }
    
    [TestFixture]
    public class TimerTest
    {
        [OneTimeSetUp]
        public static void Init()
        {
        }

        public static int SetTimeoutTestNum;
        [Test]
        public void SetTimeoutTest()
        {
            SetTimeoutTestNum = 0;
            var jsEnv = new JsEnv(new TxtLoader());

            var timer = jsEnv.Eval<Timer>(@"
                const CS = require('csharp');
                let timer = new CS.Puerts.UnitTest.Timer(Date.now());
                Date.now = ()=>timer.Now();
                let obj = CS.Puerts.UnitTest.TimerTest;
                let i = 0;
                setTimeout(()=>{obj.SetTimeoutTestNum = ++i;},4000);
                timer;
            ");
            for (int i = 0; i < 100; i++)
            {
                if (i == 38)
                {
                    Assert.AreEqual(0, SetTimeoutTestNum);
                }

                if (i == 40)
                {
                    Assert.AreEqual(1, SetTimeoutTestNum);
                }
                
                timer.Tick();
                jsEnv.Tick();
            }

            Assert.AreEqual(1, SetTimeoutTestNum);
            jsEnv.Dispose();
        }

        public static int SetIntervalTestNum;

        [Test]
        public void SetIntervalTest()
        {
            SetIntervalTestNum = 0;
            var jsEnv = new JsEnv(new TxtLoader());

            var timer = jsEnv.Eval<Timer>(@"
                const CS = require('csharp');
                let timer = new CS.Puerts.UnitTest.Timer(Date.now());
                Date.now = ()=>timer.Now();
                let obj = CS.Puerts.UnitTest.TimerTest;
                let i = 0;
                setInterval(()=>{obj.SetIntervalTestNum = ++i;},1000);
                timer;
            ");
            for (int i = 0; i < 100; i++)
            {
                Assert.AreEqual(i / 10, SetIntervalTestNum);
                timer.Tick();
                jsEnv.Tick();
            }

            jsEnv.Dispose();
        }

        public static int SetInterval2TestNum1;
        public static int SetIntervalTestNum2;

        [Test]
        public void SetIntervalTest2()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            var timer = jsEnv.Eval<Timer>(@"
                const CS = require('csharp');
                let timer = new CS.Puerts.UnitTest.Timer(Date.now());
                Date.now = ()=>timer.Now();
                let obj = CS.Puerts.UnitTest.TimerTest;
                let i = 0;
                let j = 0;
                setInterval(()=>{obj.SetInterval2TestNum1 = ++i;},1000);
                setInterval(()=>{obj.SetIntervalTestNum2 = ++j;},500);
                timer;
            ");
            for (int i = 0; i < 100; i++)
            {
                Assert.AreEqual(i / 10, SetInterval2TestNum1);
                Assert.AreEqual(i / 5, SetIntervalTestNum2);
                timer.Tick();
                jsEnv.Tick();
            }

            jsEnv.Dispose();
        }

        public static int TimerTest2Num;

        [Test]
        public void TimerTest2()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            var timer = jsEnv.Eval<Timer>(@"
                const CS = require('csharp');
                let timer = new CS.Puerts.UnitTest.Timer(Date.now());
                Date.now = ()=>timer.Now();
                let obj = CS.Puerts.UnitTest.TimerTest;
                let i = 0;
                let id = setInterval(()=>{obj.TimerTest2Num = ++i;},500);
                setTimeout(()=>{clearInterval(id);},2000);
                timer;
            ");
            for (int i = 0; i < 100; i++)
            {
                if (i <= 20)
                {
                    Assert.AreEqual(i / 5, TimerTest2Num);
                }
                else
                {
                    Assert.AreEqual(20 / 5, TimerTest2Num);
                }
                timer.Tick();
                jsEnv.Tick();
            }

            jsEnv.Dispose();
        }

        public static int TimerTest3Num;

        [Test]
        public void TimerTest3()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            var timer = jsEnv.Eval<Timer>(@"
                const CS = require('csharp');
                let timer = new CS.Puerts.UnitTest.Timer(Date.now());
                Date.now = ()=>timer.Now();
                let obj = CS.Puerts.UnitTest.TimerTest;
                let i = 0;
                let id = setInterval(()=>{obj.TimerTest3Num = ++i;},500);
                setTimeout(()=>{clearInterval(id);},2000);
                setTimeout(()=>{clearInterval(id);},2500);
                timer;
            ");
            for (int i = 0; i < 100; i++)
            {
                if (i < 20)
                {
                    Assert.AreEqual(i / 5, TimerTest3Num);
                }
                else
                {
                    Assert.AreEqual(20 / 5, TimerTest3Num);
                }
                timer.Tick();
                jsEnv.Tick();
            }
            Assert.AreEqual(20 / 5, TimerTest3Num);
            jsEnv.Dispose();
        }
        
        public static int TimerTest4Num;

        [Test]
        public void TimerTest4()
        {
            var jsEnv = new JsEnv(new TxtLoader());

            var timer = jsEnv.Eval<Timer>(@"
                const CS = require('csharp');
                let timer = new CS.Puerts.UnitTest.Timer(Date.now());
                Date.now = ()=>timer.Now();
                let obj = CS.Puerts.UnitTest.TimerTest;
                let i = 0;
                let id = setInterval(()=>{obj.TimerTest4Num = ++i;},500);
                setTimeout(()=>{clearInterval(id);},200);
                timer;
            ");
            for (int i = 0; i < 100; i++)
            {
                Assert.AreEqual(0, TimerTest4Num);
                timer.Tick();
                jsEnv.Tick();
            }
            jsEnv.Dispose();
        }
    }
}