using NUnit.Framework;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class OptionalParametersClass
    {
        [UnityEngine.Scripting.Preserve]
        public int Test(int i = 0, int j = 1, int k = 2)
        {
            return i * 100 + j * 10 + k;
        }

        [UnityEngine.Scripting.Preserve]
        public int Test(string i, int j = 1, int k = 2)
        {
            return j * 10 + k;
        }

        [UnityEngine.Scripting.Preserve]
        public int Test2(string i)
        {
            return 0;
        }

        [UnityEngine.Scripting.Preserve]
        public int Test2(string i, int j)
        {
            return j;
        }

        [UnityEngine.Scripting.Preserve]
        public int Test2(string i, int j, params bool[] k)
        {
            return -1;
        }

        [UnityEngine.Scripting.Preserve]
        public int Test3(string i, int b)
        {
            return 0;
        }

        [UnityEngine.Scripting.Preserve]
        public int Test4(string i, int b, int c = 0, int d = 1)
        {
            return 0;
        }

        [UnityEngine.Scripting.Preserve]
        public int Test5(string i, int j, params bool[] k)
        {
            return -1;
        }
        [UnityEngine.Scripting.Preserve]
        public int Test6(int d, int i = 1, params string[] strs)
        {
            return i + d;
        }
        [UnityEngine.Scripting.Preserve]
        public string TestFilter(string str)
        {
            return str + " hello";
        }
    }

    [TestFixture]
    public class OptionalParametersTest
    {
        [Test]
        public void Test1()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    return temp.Test(1,3);
                })()
           ");
            Assert.AreEqual(132, ret);
            
        }
        [Test]
        public void Test2()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    return temp.Test('1',3);
                })()
           ");
            Assert.AreEqual(32, ret);
            
        }
        [Test]
        public void Test3()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    return temp.Test('1');
                })()
           ");
            Assert.AreEqual(12, ret);
            
        }
        [Test]
        public void Test4()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    return temp.Test(6,6,6);
                })()
           ");
            Assert.AreEqual(666, ret);
            
        }

        [Test]
        public void Test5()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    return temp.Test2('1',100);
                })()
           ");
            Assert.AreEqual(100, ret);
            
        }

        [Test]
        public void Test6()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    return temp.Test2('1');
                })()
           ");
            Assert.AreEqual(0, ret);
            
        }

        [Test]
        public void Test7()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    return temp.Test5('1', 1, false,false,false);
                })()
           ");
            Assert.AreEqual(-1, ret);
            
        }

        [Test]
        public void Test8()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    return temp.Test5('1', 1, false);
                })()
           ");
            Assert.AreEqual(-1, ret);
            
        }

        [Test] 
        public void Test9()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    let ret = 0;                
                    try{temp.Test3('1');}catch(e){ret = 1;}
                    return ret;
                })()
           ");
            Assert.AreEqual(1, ret);
            
        }

        [Test]
        public void Test10()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    let ret = 0;                
                    try{temp.Test3('1',1);}catch(e){ret = 1;}
                    return ret;
                })()
           ");
            Assert.AreEqual(0, ret);
            
        }

        [Test]
        public void Test11()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    let ret = 0;                
                    try{temp.Test4('1');}catch(e){ if (e.message.indexOf('invalid') != -1) ret = 1; }
                    return ret;
                })()
           ");
            Assert.AreEqual(1, ret);
            
        }

        [Test]
        public void Test12()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    let ret = 0;                
                    try{temp.Test4('1',1);}catch(e){ret = 1;}
                    return ret;
                })()
           ");
            Assert.AreEqual(0, ret);
            
        }

        [Test]
        public void Test13()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();            
                    let ret = temp.Test6(1);
                    return ret;
                })()
           ");
            Assert.AreEqual(2, ret);
            
        }
        [Test]
        public void Test14()
        {
            var env = UnitTestEnv.GetEnv();
            string ret = env.Eval<string>(@"
                (function() {
                    let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
                    return temp.TestFilter('world');
                })()
           ");
            Assert.AreEqual("world hello", ret);
            
        }
    }
}