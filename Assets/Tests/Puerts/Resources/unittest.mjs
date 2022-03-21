const assertAndPrint = cs.PuertsTest.TestHelper.AssertAndPrint.bind(cs.PuertsTest.TestHelper);

var init = function (testHelper) {
    let testDate = new Date("1998-11-11");

    testHelper.GetNumberFromJSArgument(3)
    testHelper.GetDateFromJSArgument(testDate)
    testHelper.GetStringFromJSArgument("Hello World")
    testHelper.GetBooleanFromJSArgument(true)
    // 2021才能测
    // testHelper.GetBigIntFromJSArgument(BigInt(Number.MAX_SAFE_INTEGER + 1))
    testHelper.GetObjectFromJSArgument(new cs.PuertsTest.TestObject(3))
    // BlittableCopy下容易出的问题是多个struct共用了内存产生错乱
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

    console.log("======")

    const numberOut = puerts.$ref(1);
    testHelper.SetNumberToOutValue(numberOut);
    console.log(puerts.$unref(numberOut))
    assertAndPrint("SetNumberToOutValue", puerts.$unref(numberOut) == 3);

    const dateOut = puerts.$ref(new Date());
    testHelper.SetDateToOutValue(dateOut);
    assertAndPrint("SetDateToOutValue", puerts.$unref(dateOut).getTime() == testDate.getTime());

    const stringOut = puerts.$ref("hello string out");
    testHelper.SetStringToOutValue(stringOut);
    assertAndPrint("SetStringToOutValue", puerts.$unref(stringOut) == "byebye string out");

    const booleanOut = puerts.$ref(false);
    testHelper.SetBooleanToOutValue(booleanOut);
    assertAndPrint("SetBooleanToOutValue", puerts.$unref(booleanOut) == true);

    const objectOut = puerts.$ref(new cs.PuertsTest.TestObject(4));
    testHelper.SetObjectToOutValue(objectOut);
    assertAndPrint("SetObjectToOutValue", puerts.$unref(objectOut).value == 3);

    const arrayBufferOut = puerts.$ref(new Uint8Array([1]).buffer);
    testHelper.SetArrayBufferToOutValue(arrayBufferOut);
    assertAndPrint("SetArrayBufferToOutValue", puerts.$unref(arrayBufferOut)[0] == 3);
};

export { init };
