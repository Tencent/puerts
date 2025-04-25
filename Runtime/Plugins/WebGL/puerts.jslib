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
            UTF16ToString,
            _malloc,
            _free,
            _setTempRet0,
            stringToUTF8,
            lengthBytesUTF8,
            stringToUTF16,
            lengthBytesUTF16,
            stackAlloc,
            stackSave,
            stackRestore,
            getWasmTableEntry: (typeof getWasmTableEntry != 'undefined') ? getWasmTableEntry : function(funcPtr) {
                return wasmTable.get(funcPtr);
            },
            addFunction,
            removeFunction,
            _CallCSharpFunctionCallback: Module._CallCSharpFunctionCallback,
            _CallCSharpConstructorCallback: Module._CallCSharpConstructorCallback,
            _CallCSharpDestructorCallback: Module._CallCSharpDestructorCallback,
            InjectPapiGLNativeImpl: Module._InjectPapiGLNativeImpl,
            PApiCallbackWithScope: Module._PApiCallbackWithScope,
            PApiConstructorWithScope: Module._PApiConstructorWithScope,
            WasmAdd: Module._WasmAdd,
            IndirectWasmAdd: Module._IndirectWasmAdd,
            GetWasmAddPtr: Module._GetWasmAddPtr,
            
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
    "GetJSStackTrace",
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
    "ReturnCSharpFunctionCallback2",
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
    "GetWebGLFFIApi",
    "GetWebGLPapiEnvRef",
    "GetQjsFFIApi", // declare for compile
    "GetQjsPapiEnvRef", // declare for compile
    "GetRegsterApi",
    "pesapi_alloc_property_descriptors",
    "pesapi_define_class",
    "pesapi_get_class_data",
    "pesapi_on_class_not_found",
    "pesapi_set_method_info",
    "pesapi_set_property_info",
    "pesapi_trace_native_object_lifecycle"
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