const assertAndPrint = cs.PuertsTest.TestHelper.AssertAndPrint.bind(cs.PuertsTest.TestHelper);

var init = function (testHelper) {
    let testDate = new Date("1998-11-11");

    testHelper.GetNumberFromJSArgument(3)
    testHelper.GetDateFromJSArgument(testDate)
    testHelper.GetStringFromJSArgument("Hello World")
    testHelper.GetBooleanFromJSArgument(true)
    // testHelper.GetBigIntFromJSArgument(BigInt(Number.MAX_SAFE_INTEGER + 1))
    testHelper.GetObjectFromJSArgument(new cs.PuertsTest.TestObject(3))
    const struct = new cs.PuertsTest.TestStruct();
    struct.value = 3;
    testHelper.GetStructFromJSArgument(struct)
    testHelper.GetFunctionFromJSArgument(() => 3)
    // testHelper.GetJSObjectFromJSArgument()
    testHelper.GetArrayBufferFromJSArgument(new Uint8Array([3]).buffer)

    console.log("======")

    testHelper.GetNumberFromResult(() => 3)
    testHelper.GetDateFromResult(() => testDate)
    testHelper.GetStringFromResult(() => "Hello World")
    testHelper.GetBooleanFromResult(() => true)
    // testHelper.GetBigIntFromResult(() => BigInt(Number.MAX_SAFE_INTEGER + 1))
    testHelper.GetObjectFromResult(() => new cs.PuertsTest.TestObject(3))
    testHelper.GetFunctionFromResult(() => () => 3)
    // testHelper.GetJSObjectFromResult()
    testHelper.GetArrayBufferFromResult(() => new Uint8Array([3]).buffer)

    console.log("======")

    assertAndPrint("ReturnNumber", testHelper.ReturnNumber() == 3)
    assertAndPrint("ReturnDate", testHelper.ReturnDate().toString() == testDate.toString());
    assertAndPrint("ReturnString", testHelper.ReturnString() == "Hello World");
    assertAndPrint("ReturnBoolean", testHelper.ReturnBoolean());
    // assertAndPrint("ReturnBigInt", testHelper.ReturnBigInt() == BigInt(Number.MAX_SAFE_INTEGER + 1));
    assertAndPrint("ReturnObject", testHelper.ReturnObject(3).value == 3);
    const struct1 = testHelper.ReturnStruct(1);
    const struct2 = testHelper.ReturnStruct(2);
    assertAndPrint("ReturnStruct", struct1.value == 1);
    // assertAndPrint("ReturnFunction", testHelper.ReturnFunction()() == 3);
    // assertAndPrint("ReturnJSObject", testHelper.ReturnJSObject());
    assertAndPrint("ReturnArrayBuffer", new Uint8Array(testHelper.ReturnArrayBuffer())[0] == 3);
};

export { init };
