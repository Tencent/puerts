/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using NUnit.Framework;

namespace Puerts.UnitTest.JSTypeTest
{
    [TestFixture]
    public class JSObjectTest
    {

        [Test]
        public void JSObject()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            var ret = jsEnv.Eval<string>(@"
                const CS = require('csharp');
                let jsObj = {'a': 1};
                let obj = new CS.Puerts.UnitTest.JsObjectTest();
                JSON.stringify(obj.passThroughJSObject(jsObj))
            ");
            Assert.AreEqual("{\"a\":1}", ret);
            ret = jsEnv.Eval<string>(@"
                [
                    (obj.passThroughJSObject(jsObj) === obj.passThroughJSObject(jsObj)).toString(),
                    (obj.passThroughJSObject(jsObj) === jsObj).toString()
                ].join('')
            ");
            Assert.AreEqual("truetrue", ret);
            ret = jsEnv.Eval<string>(@"
                [
                    (obj.passThroughJSObjectInAnyFunction(jsObj) === obj.passThroughJSObjectInAnyFunction(jsObj)).toString(),
                    (obj.passThroughJSObjectInAnyFunction(jsObj) === jsObj).toString()
                ].join('')
            ");
            Assert.AreEqual("truetrue", ret);
        }
    }
}