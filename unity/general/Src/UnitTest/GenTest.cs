using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
    [TestFixture]
    public class GenUnitTest
    {
        [Test]
        public void GenericWrapper()
        {

            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.Eval<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("require('puerts/templates/wrapper.tpl.cjs')");
            var genList = new List<Type>() { typeof(Dictionary<int, JsEnv>) };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Dictionary<int, JsEnv>), genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.True(wrapperContent.Contains("<T>"));
        }

        [Test]
        public void GenericWrapper_2()
        {

            var jsEnv = new JsEnv(new TxtLoader());
            var wrapRender = jsEnv.Eval<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("require('puerts/templates/wrapper.tpl.cjs')");
            var genList = new List<Type>() {
                typeof(Dictionary<Type, JsEnv>)             
            };
            Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Dictionary<Type, JsEnv>), genList);

            string wrapperContent = wrapRender(wrapperInfo);
            Assert.True(wrapperContent.Contains("<T,S>"));
        }
    }
}