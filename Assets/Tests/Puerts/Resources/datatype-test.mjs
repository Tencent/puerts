const assertAndPrint = cs.PuertsTest.TestHelper.AssertAndPrint.bind(cs.PuertsTest.TestHelper);

var init = function (testHelper) {
    const outRef = puerts.$ref(null);

    // JSFunction
    const oFunc = () => 3;
    testHelper.JSFunctionTestPipeLine(oFunc, function(func) {
        return oFunc
    });
    
    // Number
    const oNum = 1;
    const rNum = testHelper.NumberTestPipeLine(oNum, outRef, function(num) {
        assertAndPrint("JSGetNumberArgFromCS", num == oNum + 1);
        return oNum + 2
    });
    assertAndPrint("JSGetNumberOutArgFromCS", puerts.$unref(outRef) == oNum + 3);
    assertAndPrint("JSGetNumberReturnFromCS", rNum == oNum + 4);

    // Date
    const oDate = new Date("1998-11-11");
    const rDate = testHelper.DateTestPipeLine(oDate, outRef, function(date) {
        assertAndPrint("JSGetDateArgFromCS", date.getTime() == oDate.getTime());
        return oDate;
    });
    assertAndPrint("JSGetDateOutArgFromCS", puerts.$unref(outRef).getTime() == oDate.getTime());
    assertAndPrint("JSGetDateReturnFromCS", rDate.getTime() == oDate.getTime());

    // String
    const oString = "abc";
    const rString = testHelper.StringTestPipeLine(oString, outRef, function(str) {
        assertAndPrint("JSGetStringArgFromCS", str == "abcd");
        return "abcde"
    });
    assertAndPrint("JSGetStringOutArgFromCS", puerts.$unref(outRef) == "abcdef");
    assertAndPrint("JSGetStringReturnFromCS", rString == "abcdefg");

    // Bool
    const oBool = true;
    const rBool = testHelper.BoolTestPipeLine(oBool, outRef, function(b) {
        assertAndPrint("JSGetBoolArgFromCS", b == false);
        return true;
    });
    assertAndPrint("JSGetBoolOutArgFromCS", puerts.$unref(outRef) == false);
    assertAndPrint("JSGetBoolReturnFromCS", rBool == false);

    // 2021+ only
    // // BigInt
    // const oBigInt = 9007199254740992n;
    // const rBigInt = testHelper.BigIntTestPipeLine(oBigInt, outRef, function(bi) {
    //     assertAndPrint("JSGetBigIntArgFromCS", bi == oBigInt + 1n);
    //     return oBigInt + 2n
    // });
    // assertAndPrint("JSGetBigIntOutArgFromCS", puerts.$unref(outRef) == oBigInt + 3n);
    // assertAndPrint("JSGetBigIntReturnFromCS", rBigInt == oBigInt + 4n);

    // AB
    const oAB = new Uint8Array([1]).buffer;
    const rAB = testHelper.ArrayBufferTestPipeLine(oAB, outRef, function(bi) {
        assertAndPrint("JSGetArrayBufferArgFromCS", new Uint8Array(bi) == 2);
        return new Uint8Array([3]).buffer
    });
    assertAndPrint("JSGetArrayBufferOutArgFromCS", new Uint8Array(puerts.$unref(outRef)) == 4);
    assertAndPrint("JSGetArrayBufferReturnFromCS", new Uint8Array(rAB) == 5);

    // NativeObject
    const oNativeObject = new cs.PuertsTest.TestObject(1);
    const rNativeObject = testHelper.NativeObjectTestPipeLine(oNativeObject, outRef, function(obj) {
        assertAndPrint("JSGetNativeObjectArgFromCS", obj == oNativeObject);
        return oNativeObject
    });
    assertAndPrint("JSGetNativeObjectOutArgFromCS", puerts.$unref(outRef) == oNativeObject);
    assertAndPrint("JSGetNativeObjectReturnFromCS", rNativeObject == oNativeObject);

    // JSObject
    const oJSObject = { "puerts": "niubi" };
    const rJSObject = testHelper.JSObjectTestPipeLine(oJSObject, function(obj) {
        assertAndPrint("JSGetJSObjectArgFromCS", obj == oJSObject);
        return oJSObject
    });
    // assertAndPrint("JSGetJSObjectOutArgFromCS", puerts.$unref(outRef) == oJSObject);
    assertAndPrint("JSGetJSObjectReturnFromCS", rJSObject == oJSObject);

    debugger;
};

export { init };
