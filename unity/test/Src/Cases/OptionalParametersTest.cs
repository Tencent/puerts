using NUnit.Framework;

namespace Puerts.UnitTest
{
    [UnityEngine.Scripting.Preserve]
    public class OptionalParametersClass
    {
        public int a;
        public int b;

        [UnityEngine.Scripting.Preserve]
        public OptionalParametersClass() {
            UnityEngine.Debug.Log("Constructor1");
        }

        [UnityEngine.Scripting.Preserve]
        public OptionalParametersClass(int _c, int _a = 1, int _b = 2) {
            UnityEngine.Debug.Log("Constructor2");
            a = _a * 1000;
            b = _b * 100;
        }

        [UnityEngine.Scripting.Preserve]
        public OptionalParametersClass(string _c, int _a = 1, int _b = 2) {
            UnityEngine.Debug.Log("Constructor3");
            a = _a * 100;
            b = _b * 10;
        }
        
        [UnityEngine.Scripting.Preserve]
        public static int STest(int i = 0, int j = 1, int k = 2)
        {
            return i * 100 + j * 10 + k;
        }

        [UnityEngine.Scripting.Preserve]
        public static int STest(string i, int j = 1, int k = 2)
        {
            return j * 10 + k;
        }

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
        public void InstanceMethodTest1()
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
        public void InstanceMethodTest2() 
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
        public void InstanceMethodTest3()
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
        public void InstanceMethodTest4()
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
        public void InstanceMethodTest5()
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
        public void InstanceMethodTest6()
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
        public void InstanceMethodTest7()
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
        public void InstanceMethodTest8()
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

        // [Test] 
        // public void InstanceMethodTest9()
        // {
        //     var env = UnitTestEnv.GetEnv();
        //     int ret = env.Eval<int>(@"
        //         (function() {
        //             let temp = new CS.Puerts.UnitTest.OptionalParametersClass();
        //             let ret = 0;
        //             try{temp.Test3('1');}catch(e){ret = 1;}
        //             return ret;
        //         })()
        //    ");
        //     Assert.AreEqual(1, ret);
            
        // }

        [Test]
        public void InstanceMethodTest10()
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
        public void InstanceMethodTest11()
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
        public void InstanceMethodTest12()
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
        public void InstanceMethodTest13()
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
        public void InstanceMethodTest14()
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

        [Test]
        public void ConstructorTest1()
        {
            var env = UnitTestEnv.GetEnv();
            string ret = env.Eval<string>(@"
                (function() {
                    const cls = new CS.Puerts.UnitTest.OptionalParametersClass(1);
                    return '' + (cls.a + cls.b)
                })()
           ");
            Assert.AreEqual("1200", ret);
            
        }
        [Test]
        public void ConstructorTest2()
        {
            var env = UnitTestEnv.GetEnv();
            string ret = env.Eval<string>(@"
                (function() {
                    const cls = new CS.Puerts.UnitTest.OptionalParametersClass(1, 4);
                    return '' + (cls.a + cls.b)
                })()
           ");
            Assert.AreEqual("4200", ret);
            
        }
        [Test]
        public void ConstructorTest3()
        {
            var env = UnitTestEnv.GetEnv();
            string ret = env.Eval<string>(@"
                (function() {
                    const cls = new CS.Puerts.UnitTest.OptionalParametersClass('1');
                    return '' + (cls.a + cls.b)
                })()
           ");
            Assert.AreEqual("120", ret);
            
        }

        [Test]
        public void StaticMethodTest1()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    return CS.Puerts.UnitTest.OptionalParametersClass.STest(1,3);
                })()
           ");
            Assert.AreEqual(132, ret);
            
        }
        [Test]
        public void StaticMethodTest2() 
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    return CS.Puerts.UnitTest.OptionalParametersClass.STest('1',3);
                })()
           ");
            Assert.AreEqual(32, ret);
            
        }
        [Test]
        public void StaticMethodTest3()
        {
            var env = UnitTestEnv.GetEnv();
            int ret = env.Eval<int>(@"
                (function() {
                    return CS.Puerts.UnitTest.OptionalParametersClass.STest('1');
                })()
           ");
            Assert.AreEqual(12, ret);
            
        }
    }
}