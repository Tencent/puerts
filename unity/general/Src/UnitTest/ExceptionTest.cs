using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    [TestFixture]
    public class ExceptionTest
    {
        [Test]
        public void FunctionNotExistsException()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let res;
                try{obj.adds(i,j);}catch(e){res = -1;}
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, -1);
        }

        [Test]
        public void InvalidArgumentsException()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            int res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let res;
                try { res = obj.TestErrorParam('1');} catch(e){res = -1};
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, -1);
        }

        [Test]
        public void InvalidStructArgumentsException()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            int res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.DerivedClass();
                let s = new CS.Puerts.UnitTest.S(1,'anna');
                let res;
                try { res = obj.TestErrorParamStruct(1);} catch(e){res = -1};
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, -1);
        }

        [Test]
        public void InvalidClassArgumentsException()
        {
            Assert.Catch(() =>
            {
                var jsEnv = new JsEnv(new TxtLoader());
                jsEnv.Eval(@"
                    const CS = require('csharp');
                    let obj = new CS.Puerts.UnitTest.DerivedClass();
                    let iobj = new CS.Puerts.UnitTest.ISubA();
                    obj.TestErrorParamClass(undefined);"
                );
                jsEnv.Dispose();
            });
        }

        [Test]
        public void PolymorphismMismatchedArgumentsException()
        {

            var jsEnv = new JsEnv(new TxtLoader());
            var res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                let obj = new CS.Puerts.UnitTest.BaseClass();
                let iobj = new CS.Puerts.UnitTest.ISubA();
                let res;
                try {res = iobj.TestDerivedObj(obj,1,'gyx');} catch(e){res = -1;}
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, -1);
        }
        [Test]
        public void InvalidRefStructArgumentsException()
        {
            Assert.Catch(() =>
            {
                var jsEnv = new JsEnv(new TxtLoader());
                jsEnv.Eval(@"
                    const CS = require('csharp');
                    const PUERTS = require('puerts');
                    let obj = new CS.Puerts.UnitTest.DerivedClass();
                    let s = new CS.Puerts.UnitTest.S(1,'gyx');
                    obj.PrintStructRef(s);"
                );
                jsEnv.Dispose();
            });
        }

        [Test]
        public void ArgumentsTypeMismatchedException()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            int res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                const PUERTS = require('puerts');
                let obj = new CS.Puerts.UnitTest.ISubA();
                let arrayString = CS.System.Array.CreateInstance(PUERTS.$typeof(CS.System.String), 3);
                arrayString.set_Item(0, '111');
                arrayString.set_Item(1, '222');
                arrayString.set_Item(2, '333');
                let res;
                try {res = obj.TestArrInt(arrayString); } catch(e){res = -1;}
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, -1);
        }

        [Test]
        public void ConstructorArgumentsTypeMismatchedException()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            int res = jsEnv.Eval<int>(@"
                const CS = require('csharp');
                try {
                    const timer = new CS.Puerts.UnitTest.Timer('expected to be a int');
                } catch(e){res = -1;}
                res;
            ");
            jsEnv.Dispose();
            Assert.AreEqual(res, -1);
        }

        [Test]
        public void JsEnvCreateFailedException()
        {
            var loader = new TxtLoader();
            loader.AddMockFileContent("puerts/polyfill.mjs", @" throw new Error('expected exception') ");
            JsEnv env = null;
            var oldEnvList = JsEnv.jsEnvs;
            JsEnv.jsEnvs = new System.Collections.Generic.List<JsEnv>();
            try
            {
                env = new JsEnv(loader);
            }
            catch (Exception ex)
            {
                Assert.True(ex.Message.Contains("expected exception"));
                Assert.True(env == null);
                Assert.True(JsEnv.jsEnvs.Count == 1);
                Assert.True(JsEnv.jsEnvs[0] == null);
                JsEnv.jsEnvs = oldEnvList;
                return;
            }

            JsEnv.jsEnvs = oldEnvList;
            Assert.True(false);
        }
    }
}