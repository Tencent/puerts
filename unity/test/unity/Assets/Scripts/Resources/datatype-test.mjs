const TestHelper = loadType(jsEnv.GetTypeByString('PuertsTest.TestHelper'))
const Debug = loadType(jsEnv.GetTypeByString('UnityEngine.Debug'));
const assertAndPrint = TestHelper.AssertAndPrint.bind(TestHelper);

var testHelper = TestHelper.GetInstance();

Debug.Log("111" + (TestHelper.GetInstance() == TestHelper.instance));

Debug.Log('start test ' + testHelper);
const outRef = [null];

Debug.Log('1');
// JSFunction
// const oFunc = () => 3;
// testHelper.JSFunctionTestPipeLine(oFunc, function(func) {
//     return oFunc
// });

// Number
const oNum = 1;
const rNum = testHelper.NumberTestPipeLine(oNum, outRef, function(num) {
    assertAndPrint("JSGetNumberArgFromCS", num == oNum + 1);
    return oNum + 2
});
assertAndPrint("JSGetNumberOutArgFromCS", outRef[0] == oNum + 3);
assertAndPrint("JSGetNumberReturnFromCS", rNum == oNum + 4);
assertAndPrint("JSGetNumberField", testHelper.numberField == 0);
testHelper.numberField = rNum;
Debug.Log(testHelper.numberField);
assertAndPrint("JSSetNumberField", testHelper.numberField == rNum);

// Date
// const oDate = new Date("1998-11-11");
// const rDate = testHelper.DateTestPipeLine(oDate, outRef, function(date) {
//     assertAndPrint("JSGetDateArgFromCS", date.getTime() == oDate.getTime());
//     return oDate;
// });
// assertAndPrint("JSGetDateOutArgFromCS", outRef[0].getTime() == oDate.getTime());
// assertAndPrint("JSGetDateReturnFromCS", rDate.getTime() == oDate.getTime());

// String
const oString = "abc";
const rString = testHelper.StringTestPipeLine(oString, outRef, function(str) {
    assertAndPrint("JSGetStringArgFromCS", str == "abcd");
    return "abcde"
});
assertAndPrint("JSGetStringOutArgFromCS", outRef[0] == "abcdef");
assertAndPrint("JSGetStringReturnFromCS", rString == "abcdefg");
assertAndPrint("JSGetStringField", testHelper.stringField == "");
testHelper.stringField = rString;
assertAndPrint("JSSetStringField", testHelper.stringField == rString);

// Bool
const oBool = true;
const rBool = testHelper.BoolTestPipeLine(oBool, outRef, function(b) {
    assertAndPrint("JSGetBoolArgFromCS", b == false);
    return true;
});
assertAndPrint("JSGetBoolOutArgFromCS", outRef[0] == false);
assertAndPrint("JSGetBoolReturnFromCS", rBool == false);
assertAndPrint("JSGetBoolField", testHelper.boolField == true);
testHelper.boolField = rBool;
assertAndPrint("JSSetBoolField", testHelper.boolField == rBool);

// 2021+ only
// // BigInt
// const oBigInt = 9007199254740992n;
// const rBigInt = testHelper.BigIntTestPipeLine(oBigInt, outRef, function(bi) {
//     assertAndPrint("JSGetBigIntArgFromCS", bi == oBigInt + 1n);
//     return oBigInt + 2n
// });
// assertAndPrint("JSGetBigIntOutArgFromCS", outRef[0] == oBigInt + 3n);
// assertAndPrint("JSGetBigIntReturnFromCS", rBigInt == oBigInt + 4n);

// AB
// const oAB = new Uint8Array([1]).buffer;
// const rAB = testHelper.ArrayBufferTestPipeLine(oAB, outRef, function(bi) {
//     assertAndPrint("JSGetArrayBufferArgFromCS", new Uint8Array(bi) == 2);
//     return new Uint8Array([3]).buffer
// });
// assertAndPrint("JSGetArrayBufferOutArgFromCS", new Uint8Array(outRef[0]) == 4);
// assertAndPrint("JSGetArrayBufferReturnFromCS", new Uint8Array(rAB) == 5);

// NativeObjectStruct
// const oNativeObjectStruct = new cs.PuertsTest.TestStruct(1);
// const rNativeObjectStruct = testHelper.NativeObjectStructTestPipeLine(oNativeObjectStruct, outRef, function(obj) {
//     assertAndPrint("JSGetNativeObjectStructArgFromCS", obj.value == oNativeObjectStruct.value);
//     return oNativeObjectStruct
// });
// assertAndPrint("JSGetNativeObjectStructOutArgFromCS", outRef[0].value == oNativeObjectStruct.value);
// assertAndPrint("JSGetNativeObjectStructReturnFromCS", rNativeObjectStruct.value == oNativeObjectStruct.value);

// NativeObject
// const oNativeObject = new cs.PuertsTest.TestObject(1);
// const rNativeObject = testHelper.NativeObjectTestPipeLine(oNativeObject, outRef, function(obj) {
//     assertAndPrint("JSGetNativeObjectArgFromCS", obj == oNativeObject);
//     return oNativeObject
// });
// assertAndPrint("JSGetNativeObjectOutArgFromCS", outRef[0] == oNativeObject);
// assertAndPrint("JSGetNativeObjectReturnFromCS", rNativeObject == oNativeObject);

// JSObject
// const oJSObject = { "puerts": "niubi" };
// const rJSObject = testHelper.JSObjectTestPipeLine(oJSObject, function(obj) {
//     assertAndPrint("JSGetJSObjectArgFromCS", obj == oJSObject);
//     return oJSObject
// });
// // assertAndPrint("JSGetJSObjectOutArgFromCS", outRef[0] == oJSObject);
// assertAndPrint("JSGetJSObjectReturnFromCS", rJSObject == oJSObject);

// testHelper.ReturnAnyTestFunc = ()=>{
//     return new cs.PuertsTest.TestStruct(2);
// }
// testHelper.InvokeReturnAnyTestFunc(new cs.PuertsTest.TestStruct(2));