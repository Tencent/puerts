using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
    public delegate void TestCallback(string msg);
    public class DelegateTestClass
    {
        public TestCallback Callback;
        
        public void CSMessage()
        {
            Callback("cs_msg");
        }
    };
    
    [TestFixture]
    public class DelegateTest
    {
        [Test]
        public void DelegateBase()
        {
            var jsEnv = UnitTestEnv.GetEnv();

            jsEnv.Eval(@"
                globalThis.deleteobj = new CS.Puerts.UnitTest.DelegateTestClass()
                deleteobj.Callback = (msg) => globalThis.info = msg;
                deleteobj.CSMessage();
            ");
            
            string info = jsEnv.Eval<string>("globalThis.info");
            Assert.AreEqual("cs_msg", info);
            
            jsEnv.Eval(@"deleteobj.Callback.Invoke('js_msg')");
            info = jsEnv.Eval<string>("globalThis.info");
            Assert.AreEqual("js_msg", info);
        }
    }

    // 被追踪存活性的普通 C# 对象。从 JS new（因此进入 ObjectPool），
    // 并被一个 JS 闭包捕获，该闭包随后被 marshal 成 C# delegate。
    public class LeakTarget
    {
        public void Ping() { }
    }

    public static class Probe
    {
        private static readonly List<WeakReference> tracked = new List<WeakReference>();

        // JS 每造一个 LeakTarget 就登记进来，便于事后数存活数；只存 WeakReference，不会钉住对象。
        public static void Track(LeakTarget t) { tracked.Add(new WeakReference(t)); }

        // 接收一个被 marshal 成 C# delegate 的 JS 闭包，然后立刻丢弃。
        // 这就是被测操作：marshal 会建出那个强 value_ref。
        public static void Sink(Action cb) { /* intentionally discarded */ }

        public static void Reset() { tracked.Clear(); }

        // 仍存活（=仍泄露）的 LeakTarget 数。
        public static int AliveCount()
        {
            int n = 0;
            for (int i = tracked.Count - 1; i >= 0; i--)
            {
                if (tracked[i].IsAlive) n++;
                else tracked.RemoveAt(i);
            }
            return n;
        }
    }

    [TestFixture]
    public class DelegateLeak
    {
        [Test]
        public void DelegateLeakTest()
        {
            var env = UnitTestEnv.GetEnv();

            env.Eval(@"
(function () {{
    for (let i = 0; i < 5; i++) {{
        let o = new CS.Puerts.UnitTest.LeakTarget();
        CS.Puerts.UnitTest.Probe.Track(o);
        let cb = () => o;                      // 闭包捕获 o
        CS.Puerts.UnitTest.Probe.Sink(cb);     // marshal cb -> C# Action，随后丢弃
    }}
}})();
            ");

            int alive = Probe.AliveCount();
            for (int r = 1; r <= 6; r++)
            {
                // 跨堆回收顺序：C# GC + finalizer -> Tick（排空待释放的 value_ref）-> V8 GC -> 重复。
                GC.Collect();
                GC.WaitForPendingFinalizers();
                GC.Collect();
                env.Tick();
                env.Backend.LowMemoryNotification();
                env.Tick();
                env.Backend.LowMemoryNotification();
                GC.Collect();
                GC.WaitForPendingFinalizers();
                env.Tick();

                alive = Probe.AliveCount();
            }

            Assert.AreEqual(0, alive);
        }
    }
}