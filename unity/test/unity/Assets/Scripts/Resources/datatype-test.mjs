const TestHelper = loadType(jsEnv.GetTypeByString('PuertsTest.TestHelper'))
const Debug = loadType(jsEnv.GetTypeByString('UnityEngine.Debug'));
const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

var testHelper = TestHelper.GetInstance();

Debug.Log('start test ' + testHelper);
const outRef = [null];

// JSFunction
const oFunc = testHelper.functionTestStartValue
testHelper.JSFunctionTestPipeLine(oFunc, function (func) {
    testHelper.functionTestEndValue = () => 3;
    return testHelper.functionTestEndValue;
});

// Number
const oNum = testHelper.numberTestStartValue;
const rNum = testHelper.NumberTestPipeLine(oNum, outRef, function (num) {
    assertAndPrint("JSGetNumberArgFromCS", num == oNum + 1);
    testHelper.numberTestEndValue = oNum + 2;
    return testHelper.numberTestEndValue;
});
assertAndPrint("JSGetNumberOutArgFromCS", outRef[0] == oNum + 3);
assertAndPrint("JSGetNumberReturnFromCS", rNum == oNum + 4);

// Date
// const oDate = new Date("1998-11-11");
// const rDate = testHelper.DateTestPipeLine(oDate, outRef, function(date) {
//     assertAndPrint("JSGetDateArgFromCS", date.getTime() == oDate.getTime());
//     return oDate;
// });
// assertAndPrint("JSGetDateOutArgFromCS", outRef[0].getTime() == oDate.getTime());
// assertAndPrint("JSGetDateReturnFromCS", rDate.getTime() == oDate.getTime());

// String
const oString = testHelper.stringTestStartValue;
const rString = testHelper.StringTestPipeLine(oString, outRef, function (str) {
    assertAndPrint("JSGetStringArgFromCS", str == "abcd");
    testHelper.stringTestEndValue = "abcde";
    return testHelper.stringTestEndValue
});
assertAndPrint("JSGetStringOutArgFromCS", outRef[0] == "abcdef");
assertAndPrint("JSGetStringReturnFromCS", rString == "abcdefg");

// Bool
const oBool = testHelper.boolTestStartValue;
const rBool = testHelper.BoolTestPipeLine(oBool, outRef, function (b) {
    assertAndPrint("JSGetBoolArgFromCS", b == false);
    testHelper.boolTestEndValue = true;
    return testHelper.boolTestEndValue;
});
assertAndPrint("JSGetBoolOutArgFromCS", outRef[0] == false);
assertAndPrint("JSGetBoolReturnFromCS", rBool == false);

// 2021+ only
// BigInt
const oBigInt = testHelper.bigIntTestStartValue;
const rBigInt = testHelper.BigIntTestPipeLine(oBigInt, outRef, function (bi) {
    assertAndPrint("JSGetBigIntArgFromCS", bi == oBigInt + 1n);
    testHelper.bigIntTestEndValue = oBigInt + 2n;
    return testHelper.bigIntTestEndValue;
});
assertAndPrint("JSGetBigIntOutArgFromCS", outRef[0] == oBigInt + 3n);
assertAndPrint("JSGetBigIntReturnFromCS", rBigInt == oBigInt + 4n);

// AB
// const oAB = new Uint8Array([1]).buffer;
// const rAB = testHelper.ArrayBufferTestPipeLine(oAB, outRef, function(bi) {
//     assertAndPrint("JSGetArrayBufferArgFromCS", new Uint8Array(bi) == 2);
//     return new Uint8Array([3]).buffer
// });
// assertAndPrint("JSGetArrayBufferOutArgFromCS", new Uint8Array(outRef[0]) == 4);
// assertAndPrint("JSGetArrayBufferReturnFromCS", new Uint8Array(rAB) == 5);

// NativeObjectStruct
const oNativeObjectStruct = testHelper.nativeObjectStructTestStartValue;
const rNativeObjectStruct = testHelper.NativeObjectStructTestPipeLine(oNativeObjectStruct, outRef, function (obj) {
    assertAndPrint("JSGetNativeObjectStructArgFromCS", obj.value == oNativeObjectStruct.value);
    testHelper.nativeObjectStructTestEndValue = oNativeObjectStruct;
    return testHelper.nativeObjectStructTestEndValue;
});
assertAndPrint("JSGetNativeObjectStructOutArgFromCS", outRef[0].value == oNativeObjectStruct.value);
assertAndPrint("JSGetNativeObjectStructReturnFromCS", rNativeObjectStruct.value == oNativeObjectStruct.value);

// NativeObject
const oNativeObject = testHelper.nativeObjectTestStartValue;;
const rNativeObject = testHelper.NativeObjectTestPipeLine(oNativeObject, outRef, function (obj) {
    assertAndPrint("JSGetNativeObjectArgFromCS", obj == oNativeObject);
    testHelper.nativeObjectTestEndValue = oNativeObject;
    return testHelper.nativeObjectTestEndValue;
});
assertAndPrint("JSGetNativeObjectOutArgFromCS", outRef[0] == oNativeObject);
assertAndPrint("JSGetNativeObjectReturnFromCS", rNativeObject == oNativeObject);

// JSObject
const oJSObject = { "puerts": "niubi" };
const rJSObject = testHelper.JSObjectTestPipeLine(oJSObject, function(obj) {
    assertAndPrint("JSGetJSObjectArgFromCS", obj == oJSObject);
    return oJSObject
});
// assertAndPrint("JSGetJSObjectOutArgFromCS", outRef[0] == oJSObject);
assertAndPrint("JSGetJSObjectReturnFromCS", rJSObject == oJSObject);
