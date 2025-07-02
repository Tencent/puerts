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
    "TerminateExecution",
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
    "pesapi_trace_native_object_lifecycle",
    "pesapi_create_array_js",
    "pesapi_create_object_js",
    "pesapi_create_function_js",
    "pesapi_create_class_js",
    "pesapi_get_array_length_js",
    "pesapi_native_object_to_value_js",
    "pesapi_throw_by_string_js",
    "pesapi_open_scope_placement_js",
    "pesapi_has_caught_js",
    "pesapi_get_exception_as_string_js",
    "pesapi_close_scope_placement_js",
    "pesapi_create_value_ref_js",
    "pesapi_release_value_ref_js",
    "pesapi_get_value_from_ref_js",
    "pesapi_get_property_js",
    "pesapi_set_property_js",
    "pesapi_get_private_js",
    "pesapi_set_private_js",
    "pesapi_get_property_uint32_js",
    "pesapi_set_property_uint32_js",
    "pesapi_call_function_js",
    "pesapi_eval_js",
    "pesapi_global_js",
    "pesapi_set_env_private_js"
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