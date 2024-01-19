var exportDLL = {
    InitPuertsWebGL: function () {
        var global = typeof global != 'undefined' ? global : window;
        if (!global.PuertsWebGL) {
            throw new Error('cannot found PuertsWebGL script. please find some way to load puerts-runtime.js');
        }
        let oldUpdateGlobalBufferAndViews = updateGlobalBufferAndViews;
        updateGlobalBufferAndViews = function (buf) {
            oldUpdateGlobalBufferAndViews(buf);
            global.PuertsWebGL.updateGlobalBufferAndViews(
                HEAP8,
                HEAPU8,
                HEAP32,
                HEAPF32,
                HEAPF64
            );
        }
        global.PuertsWebGL.Init({
            UTF8ToString,
            _malloc,
            _free,
            _setTempRet0,
            stringToUTF8,
            lengthBytesUTF8,
            stackAlloc,
            stackSave,
            stackRestore,
            _CallCSharpFunctionCallback: Module._CallCSharpFunctionCallback,
            _CallCSharpConstructorCallback: Module._CallCSharpConstructorCallback,
            _CallCSharpDestructorCallback: Module._CallCSharpDestructorCallback,
            
            HEAP8,
            HEAPU8,
            HEAP32,
            HEAPF32,
            HEAPF64,
        });
        global.PuertsWebGL.inited = true;
    },
};


[
    "GetLibVersion",
    "GetApiLevel",
    "GetLibBackend",
    "CreateJSEngine",
    "CreateJSEngineWithExternalEnv",
    "DestroyJSEngine",
    "SetGlobalFunction",
    "GetLastExceptionInfo",
    "LowMemoryNotification",
    "IdleNotificationDeadline",
    "RequestMinorGarbageCollectionForTesting",
    "RequestFullGarbageCollectionForTesting",
    "SetGeneralDestructor",
    "Eval",
    "ClearModuleCache",
    "GetModuleExecutor",
    "GetJSObjectValueGetter",
    "_RegisterClass",
    "RegisterStruct",
    "RegisterFunction",
    "RegisterProperty",
    "ReturnClass",
    "ReturnObject",
    "ReturnNumber",
    "ReturnString",
    "ReturnBigInt",
    "ReturnBoolean",
    "ReturnDate",
    "ReturnNull",
    "ReturnFunction",
    "ReturnJSObject",
    "ReturnArrayBuffer",
    "ReturnCSharpFunctionCallback",
    // "GetArgumentType",
//    "GetArgumentValue",
    // "GetJsValueType",
    "GetTypeIdFromValue",
    // "GetNumberFromValue",
    // "GetDateFromValue",
    // "GetStringFromValue",
    // "GetBooleanFromValue",
    // "ValueIsBigInt",
    // "GetBigIntFromValue",
    // "GetObjectFromValue",
    // "GetFunctionFromValue",
    // "GetJSObjectFromValue",
    // "GetArrayBufferFromValue",
    "SetNumberToOutValue",
    "SetDateToOutValue",
    "SetStringToOutValue",
    "SetBooleanToOutValue",
    "SetBigIntToOutValue",
    "SetObjectToOutValue",
    "SetNullToOutValue",
    "SetArrayBufferToOutValue",
    "ThrowException",
    "PushNullForJSFunction",
    "PushDateForJSFunction",
    "PushBooleanForJSFunction",
    "PushBigIntForJSFunction",
    "PushStringForJSFunction",
    "__PushStringForJSFunction",
    "PushNumberForJSFunction",
    "PushObjectForJSFunction",
    "PushJSFunctionForJSFunction",
    "PushJSObjectForJSFunction",
    "PushArrayBufferForJSFunction",
    "SetPushJSFunctionArgumentsCallback",
    "InvokeJSFunction",
    "GetFunctionLastExceptionInfo",
    "ReleaseJSFunction",
    "ReleaseJSObject",
    "GetResultType",
    "GetNumberFromResult",
    "GetDateFromResult",
    "GetStringFromResult",
    "GetBooleanFromResult",
    "ResultIsBigInt",
    "GetBigIntFromResult",
    "GetObjectFromResult",
    "GetTypeIdFromResult",
    "GetFunctionFromResult",
    "GetJSObjectFromResult",
    "GetArrayBufferFromResult",
    "ResetResult",
    "CreateInspector",
    "DestroyInspector",
    "InspectorTick",
    "LogicTick",
    "SetLogCallback",
].forEach(function (methodName) {

    exportDLL[methodName] = new Function(
        "var global = typeof global != 'undefined' ? global : window; " +
        "if (!global.PuertsWebGL) throw new Error('cannot found PuertsWebGL script. please find some way to load puerts-runtime.js');" +
        "if (!global.PuertsWebGL.inited) throw new Error('please use Puerts.WebGL.MainEnv.Get() to create JsEnv'); " +
        "if (global.PuertsWebGL.debug) console.log('WebGL DLL:" + methodName + "'); "+
        "return global.PuertsWebGL['" + methodName + "'].apply(this, arguments)"
    );
})

mergeInto(LibraryManager.library, exportDLL);