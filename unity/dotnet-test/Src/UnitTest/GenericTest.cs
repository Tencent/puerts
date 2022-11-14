using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
    public class GenericTestClass
    {
        public static string StaticGenericMethod<T>()
        {
            return typeof(T).Name;
        }
        public static string StaticGenericMethod<T>(T t)
        {
            return t.ToString();
        }

        public string stringProp = "hello";
        public string InstanceGenericMethod<T>()
        {
            return stringProp + "_" + typeof(T).Name;
        }
    }

    [TestFixture]
    public class GenericUnitTest
    {
        [Test]
        public void ListGenericTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<int>(@"
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let List = puerts.$generic(CS.System.Collections.Generic.List$1,CS.System.Int32);
                let ls = new List();
                ls.Add(1);
                ls.Add(2);
                ls.Add(3);
                let res = obj.TestList(ls);
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, 6);
        }
        
        [Test]
        public void ListRangeTest()
        {
            Assert.Catch(() =>
            {
                var jsEnv = new JsEnv(new TxtLoader());
                jsEnv.Eval(@"
                    let obj = new CS.Puerts.UnitTest.DerivedClass();
                    let List = puerts.$generic(CS.System.Collections.Generic.List$1, CS.System.Int32);
                    let ls = new List();
                    ls.Add(1);
                    ls.Add(2);
                    let res = obj.testListRange(ls,2);"
                );
                jsEnv.Dispose();
            });
        }

        [Test]
        public void StaticGenericMethodInvalidClass()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            try
            {
                jsEnv.Eval<string>(@"
                    (function() {
                        const func = puerts.$genericMethod(CS.Puerts.UnitTest, 'StaticGenericMethod', CS.System.Int32);
                        return func();
                    })();
                ");
                Assert.True(false);
            }
            catch (Exception e)
            {
                Assert.True(e.Message.Contains("the class must be a constructor"));
            }
            jsEnv.Dispose();
        }

        [Test]
        public void StaticGenericMethodInvalidGenericArguments()
        {
            var jsEnv = new JsEnv(new TxtLoader());
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
            jsEnv.Dispose();
        }

        [Test]
        public void StaticGenericMethodInvalidCallArguments()
        {
            Assert.Catch(() =>
            {
                var jsEnv = new JsEnv(new TxtLoader());
                string genericTypeName1 = jsEnv.Eval<string>(@"
                    (function() {
                        const func = puerts.$genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', CS.System.Int32);
                        return func('hello');
                    })();
                ");
                jsEnv.Dispose();
            }, "invalid arguments to StaticGenericMethod");
        }

        [Test]
        public void StaticGenericMethodTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            string genericTypeName1 = jsEnv.Eval<string>(@"
                (function() {
                    const func = puerts.$genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', CS.System.Int32);
                    return func();
                })();
            ");
            Assert.AreEqual(genericTypeName1, "Int32");
            jsEnv.Dispose();
        }

        [Test]
        public void StaticGenericMethodTestOverload()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            string genericTypeName1 = jsEnv.Eval<string>(@"
                (function() {
                    const func = puerts.$genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'StaticGenericMethod', CS.System.Int32);
                    return func(3);
                })();
            ");
            Assert.AreEqual(genericTypeName1, "3");
            jsEnv.Dispose();
        }

        [Test]
        public void InstanceGenericMethodTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            string genericTypeName1 = jsEnv.Eval<string>(@"
                (function() {
                    const testobj = new CS.Puerts.UnitTest.GenericTestClass();
                    testobj.stringProp = 'world';
                    const func = puerts.$genericMethod(CS.Puerts.UnitTest.GenericTestClass, 'InstanceGenericMethod', CS.System.Int32);
                    return func.call(testobj);
                })();
            ");
            Assert.AreEqual(genericTypeName1, "world_Int32");
            jsEnv.Dispose();
        }
    }
}