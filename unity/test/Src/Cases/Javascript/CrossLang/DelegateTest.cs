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
        // Not only the LeakTarget itself: the discarded Action delegate and its ScriptObject target can also
        // be pinned by stale pointers (il2cpp bdwgc scans stacks conservatively). A pinned delegate never runs
        // its finalizer, so its value_ref is never released and the JS closure keeps its LeakTarget alive.
        // CI hit "but 2" with 5 targets. Use many targets and tolerate a few pinned ones: a real leak (the
        // closure is never released) keeps every target alive, so it is still detected.
        const int TargetCount = 64;
        const int PinTolerance = 4;

        [Test]
        public void DelegateLeakTest()
        {
            var env = UnitTestEnv.GetEnv();
            Probe.Reset();

            // LeakTarget has no instance field, so it shares the GC free list with a plain new object().
            // Allocate placeholders first to consume free blocks that stale pointers on the stack frames
            // of the reflection invoke path still refer to (il2cpp bdwgc scans stacks conservatively,
            // see the comment above TestJsGC in Javascript CrossLangTest). Otherwise a LeakTarget may be
            // allocated on such a block and stay pinned, which looks like a leaked object.
            var placeholders = new object[4096];
            for (int i = 0; i < placeholders.Length; i++)
            {
                placeholders[i] = new object();
            }

            env.Eval(@"
(function () {{
    for (let i = 0; i < " + TargetCount + @"; i++) {{
        let o = new CS.Puerts.UnitTest.LeakTarget();
        CS.Puerts.UnitTest.Probe.Track(o);
        let cb = () => o;                      // 闭包捕获 o
        CS.Puerts.UnitTest.Probe.Sink(cb);     // marshal cb -> C# Action，随后丢弃
    }}
}})();
            ");

            int alive = Probe.AliveCount();
            // poll instead of a fixed number of rounds, to remove finalizer timing from the equation
            for (int r = 1; r <= 30 && Probe.AliveCount() != 0; r++)
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

            GC.KeepAlive(placeholders);

            if (alive != 0)
            {
                Console.WriteLine("LeakTarget remain " + alive + " after release, maybe pinned by conservative stack scan");
            }
            if (alive > PinTolerance)
            {
                throw new Exception("expect at most " + PinTolerance + " of " + TargetCount + " LeakTarget alive, but " + alive);
            }
        }
    }
}