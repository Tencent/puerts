
var init = function (testHelper) {
    // testHelper.GetNumberFromJSArgument(3)
    // testHelper.GetDateFromJSArgument(new Date("Sep 11 2001"))
    // testHelper.GetStringFromJSArgument("Hello World")
    // testHelper.GetBooleanFromJSArgument(true)
    // // testHelper.GetBigIntFromJSArgument(Number.MAX_SAFE_INTEGER)
    // testHelper.GetObjectFromJSArgument(new cs.PuertsTest.TestObject(3))
    const struct = new cs.PuertsTest.TestStruct();
    struct.value = 3;
    testHelper.GetStructFromJSArgument(struct)
    // testHelper.GetFunctionFromJSArgument()
    // testHelper.GetJSObjectFromJSArgument()
    // testHelper.GetArrayBufferFromJSArgument(new Uint8Array([3]).buffer)
    // testHelper.GetNumberFromResult(() => 3)
    // testHelper.GetDateFromResult(() => new Date("Sep 11 2001"))
    // testHelper.GetStringFromResult(() => "Hello World")
    // testHelper.GetBooleanFromResult(() => true)
    // testHelper.GetBigIntFromResult()
    // testHelper.GetObjectFromResult(() => new cs.PuertsTest.TestObject(3))
    // testHelper.GetFunctionFromResult()
    // testHelper.GetJSObjectFromResult()
    // testHelper.GetArrayBufferFromResult(() => new Uint8Array([3]).buffer)
};

export { init };
