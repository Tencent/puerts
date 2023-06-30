using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
    [UnityEngine.Scripting.Preserve]
    public class GenericTestClass
    {
        [UnityEngine.Scripting.Preserve] public static string StaticGenericMethod<T>()
        {
            return typeof(T).Name;
        }
        [UnityEngine.Scripting.Preserve] public static string StaticGenericMethod<T>(T t)
        {
            return t.ToString();
        }

        [UnityEngine.Scripting.Preserve] public string stringProp = "hello";
        [UnityEngine.Scripting.Preserve] public string InstanceGenericMethod<T>()
        {
            return stringProp + "_" + typeof(T).Name;
        }
    }
    [UnityEngine.Scripting.Preserve]
    public class GenericTestHelper
    {
        [UnityEngine.Scripting.Preserve] public static int TestList(List<int> list)
        {
            int sum = 0;
            foreach (var i in list)
            {
                sum += i;
            }
            return sum;
        }

        [UnityEngine.Scripting.Preserve] public static int TestListRange(List<int> l, int i)
        {
            return l[i];
        }
    }

    [TestFixture]
    public class GenericUnitTest
    {
        [Test]
        public void ListGenericTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            var preserveList = new System.Collections.Generic.List<int>();
            var res = jsEnv.Eval<int>(@"
                (function() {
                    let List = puerts.$generic(CS.System.Collections.Generic.List$1, CS.System.Int32);
                    let ls = new List();
                    ls.Add(1);
                    ls.Add(2);
                    ls.Add(3);
                    let res = CS.Puerts.UnitTest.GenericTestHelper.TestList(ls);
                    return res;
                })()
            ");
            Assert.AreEqual(res, 6);
            jsEnv.Tick();
        }
        
        [Test]
        public void ListRangeTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                jsEnv.Eval(@"
                    (function() {
                        let List = puerts.$generic(CS.System.Collections.Generic.List$1, CS.System.Int32);
                        let ls = new List();
                        ls.Add(1);
                        ls.Add(2);
                        let res = CS.Puerts.UnitTest.GenericTestHelper.testListRange(ls,2);
                    })()
                ");
            });
            jsEnv.Tick();
        }

        [Test]
        public void StaticGenericMethodInvalidClass()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            try
            {
                jsEnv.Eval<string>(@"
                    (function() {
                        const func = puerts.$genericMethod(CS.Puerts.UnitTest, 'StaticGenericMethod', CS.System.Int32);
                        return func();
                    })();
                ");
            }
            catch (Exception e)
            {
                StringAssert.Contains("the class must be a constructor", e.Message);
                jsEnv.Tick();
                return;
            }
            jsEnv.Tick();
            throw new Exception("unexpected reach here");
            
        }

        [Test]
        public void StaticGenericMethodInvalidGenericArguments()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            try
            {
                jsEnv.Eval<string>(@"
                    (function() {
                        const func = puerts.$genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', 3);
                        return func();
                    })();
                ");
                Assert.True(false);
            }
            catch (Exception e)
            {
                Assert.True(e.Message.Contains("invalid Type for generic arguments 0"));
            }
            
            jsEnv.Tick();
        }

        [Test]
        public void StaticGenericMethodInvalidCallArguments()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Assert.Catch(() =>
            {
                string genericTypeName1 = jsEnv.Eval<string>(@"
                    (function() {
                        const func = puerts.$genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', CS.System.Int32);
                        return func('hello');
                    })();
                ");
#if EXPERIMENTAL_IL2CPP_PUERTS && !UNITY_EDITOR
            }, "'System.String' cannot be converted to type 'System.Int32'");
#else 
            }, "invalid arguments to StaticGenericMethod");
#endif
            jsEnv.Tick();
        }

        [Test]
        public void StaticGenericMethodTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Puerts.UnitTest.GenericTestClass.StaticGenericMethod<int>();
            string genericTypeName1 = jsEnv.Eval<string>(@"
                (function() {
                    const func = puerts.$genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', CS.System.Int32);
                    return func();
                })();
            ");
            Assert.AreEqual(genericTypeName1, "Int32");
            
            jsEnv.Tick();
        }

        [Test]
        public void StaticGenericMethodTestOverload()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            Puerts.UnitTest.GenericTestClass.StaticGenericMethod<int>(3);
            string genericTypeName1 = jsEnv.Eval<string>(@"
                (function() {
                    const func = puerts.$genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', CS.System.Int32);
                    return func(3);
                })();
            ");
            Assert.AreEqual(genericTypeName1, "3");
            
            jsEnv.Tick();
        }

        [Test]
        public void InstanceGenericMethodTest()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            
            var preserver = new Puerts.UnitTest.GenericTestClass();
            preserver.InstanceGenericMethod<int>();

            string genericTypeName1 = jsEnv.Eval<string>(@"
                (function() {
                    const testobj = new CS.Puerts.UnitTest.GenericTestClass();
                    testobj.stringProp = 'world';
                    const func = puerts.$genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'InstanceGenericMethod', CS.System.Int32);
                    return func.call(testobj);
                })();
            ");
            Assert.AreEqual(genericTypeName1, "world_Int32");
            
            jsEnv.Tick();
        }
    }
}