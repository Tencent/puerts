using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Puerts.UnitTest 
{
    class Singleton1<T> where T: Singleton1<T>, new() {}
    class Zombie: Singleton1<Zombie> {}
    class Singleton2<T> where T: class, new() {}

    [TestFixture]
    public class GenUnitTest
    {
        // [Test]
        // public void GenericWrapper()
        // {

        //     var jsEnv = new JsEnv(new TxtLoader());
        //     var wrapRender = jsEnv.Eval<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("require('puerts/templates/wrapper.tpl.cjs')");
        //     var genList = new List<Type>() { typeof(Dictionary<int, JsEnv>) };
        //     Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Dictionary<int, JsEnv>), genList);

        //     string wrapperContent = wrapRender(wrapperInfo);
        //     Assert.True(wrapperContent.Contains("<T>"));
        // }

        // [Test]
        // public void GenericWrapper_2()
        // {

        //     var jsEnv = new JsEnv(new TxtLoader());
        //     var wrapRender = jsEnv.Eval<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("require('puerts/templates/wrapper.tpl.cjs')");
        //     var genList = new List<Type>() {
        //         typeof(Dictionary<Type, JsEnv>)             
        //     };
        //     Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Dictionary<Type, JsEnv>), genList);

        //     string wrapperContent = wrapRender(wrapperInfo);
        //     Assert.True(wrapperContent.Contains("<T,S>"));
        // }

        // [Test]
        // public void GenericWrapper_3()
        // {
        //     var jsEnv = new JsEnv(new TxtLoader());
        //     var wrapRender = jsEnv.Eval<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("require('puerts/templates/wrapper.tpl.cjs')");
        //     var genList = new List<Type>() {
        //         typeof(Singleton1<Zombie>),            
        //         typeof(Zombie)             
        //     };
        //     Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Singleton1<Zombie>), genList);

        //     string wrapperContent = wrapRender(wrapperInfo);
        //     Assert.False(wrapperContent.Contains("<T>"));
        // }

        // [Test]
        // public void GenericWrapper_4()
        // {
        //     var jsEnv = new JsEnv(new TxtLoader());
        //     var wrapRender = jsEnv.Eval<Func<Editor.Generator.Wrapper.StaticWrapperInfo, string>>("require('puerts/templates/wrapper.tpl.cjs')");
        //     var genList = new List<Type>() {
        //         typeof(Singleton2<Zombie>),            
        //         typeof(Zombie)             
        //     };
        //     Editor.Generator.Wrapper.StaticWrapperInfo wrapperInfo = Editor.Generator.Wrapper.StaticWrapperInfo.FromType(typeof(Singleton2<Zombie>), genList);

        //     string wrapperContent = wrapRender(wrapperInfo);
        //     Assert.True(wrapperContent.Contains("<T>"));
        // }
    }
}