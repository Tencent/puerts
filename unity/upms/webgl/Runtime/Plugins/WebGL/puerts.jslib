// Unity 6 ships a newer Emscripten where
//   - updateGlobalBufferAndViews(buf) was renamed to updateMemoryViews()
//   - UTF16ToString / stringToUTF16 / lengthBytesUTF16 / getWasmTableEntry became library
//     functions that are only linked in when some __deps asks for them
//   - _setTempRet0 / stackAlloc / addFunction / removeFunction may be gone (unused by the runtime)
// The deps list is filtered against what this Emscripten's library actually has, so the same
// file also links on Unity 2022 (where those helpers live in the preamble).
var puertsInitDeps = ['$UTF16ToString', '$stringToUTF16', '$lengthBytesUTF16', '$getWasmTableEntry'].filter(function (n) {
    return typeof LibraryManager != 'undefined' && LibraryManager.library && Object.prototype.hasOwnProperty.call(LibraryManager.library, n);
});

var exportDLL = {
    InitPuertsWebGL__deps: puertsInitDeps,
    InitPuertsWebGL: function () {
        var global = typeof global != 'undefined' ? global : window;
        if (!global.PuertsWebGL) {
            throw new Error('cannot found PuertsWebGL script. please find some way to load puerts-runtime.js');
        }
        var notifyHeap = function () {
            global.PuertsWebGL.updateGlobalBufferAndViews(HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64);
        };
        if (typeof updateMemoryViews == 'function') {
            var oldUpdateMemoryViews = updateMemoryViews;
            updateMemoryViews = function () {
                var r = oldUpdateMemoryViews.apply(this, arguments);
                notifyHeap();
                return r;
            };
        } else if (typeof updateGlobalBufferAndViews == 'function') {
            var oldUpdateGlobalBufferAndViews = updateGlobalBufferAndViews;
            updateGlobalBufferAndViews = function (buf) {
                var r = oldUpdateGlobalBufferAndViews.apply(this, arguments);
                notifyHeap();
                return r;
            };
        } else {
            console.warn('[puerts] no memory-view update hook found; heap growth may break puerts');
        }

        // Fallbacks in case this Emscripten has neither the preamble nor the library version.
        var utf16ToString = typeof UTF16ToString == 'function' ? UTF16ToString : function (ptr, maxBytesToRead) {
            var end = ptr >> 1, maxIdx = end + (maxBytesToRead === undefined ? Infinity : maxBytesToRead / 2), s = '';
            while (end < maxIdx && HEAPU16[end]) ++end;
            for (var i = ptr >> 1; i < end; i += 4096) s += String.fromCharCode.apply(null, HEAPU16.subarray(i, Math.min(i + 4096, end)));
            return s;
        };
        var stringToUtf16 = typeof stringToUTF16 == 'function' ? stringToUTF16 : function (str, outPtr, maxBytesToWrite) {
            if (maxBytesToWrite === undefined) maxBytesToWrite = 0x7FFFFFFF;
            if (maxBytesToWrite < 2) return 0;
            maxBytesToWrite -= 2;
            var start = outPtr, n = Math.min(str.length, maxBytesToWrite >> 1);
            for (var i = 0; i < n; ++i) { HEAP16[outPtr >> 1] = str.charCodeAt(i); outPtr += 2; }
            HEAP16[outPtr >> 1] = 0;
            return outPtr - start;
        };
        var lengthBytesUtf16 = typeof lengthBytesUTF16 == 'function' ? lengthBytesUTF16 : function (str) { return str.length * 2; };
        var tableEntry = typeof getWasmTableEntry == 'function' ? getWasmTableEntry : function (funcPtr) { return wasmTable.get(funcPtr); };

        global.PuertsWebGL.Init({
            UTF8ToString,
            UTF16ToString: utf16ToString,
            _malloc,
            _free,
            _setTempRet0: typeof _setTempRet0 != 'undefined' ? _setTempRet0 : (typeof setTempRet0 != 'undefined' ? setTempRet0 : undefined),
            stringToUTF8,
            lengthBytesUTF8,
            stringToUTF16: stringToUtf16,
            lengthBytesUTF16: lengthBytesUtf16,
            stackAlloc: typeof stackAlloc != 'undefined' ? stackAlloc : undefined,
            stackSave: typeof stackSave != 'undefined' ? stackSave : undefined,
            stackRestore: typeof stackRestore != 'undefined' ? stackRestore : undefined,
            getWasmTableEntry: tableEntry,
            addFunction: typeof addFunction != 'undefined' ? addFunction : undefined,
            removeFunction: typeof removeFunction != 'undefined' ? removeFunction : undefined,
            _CallCSharpFunctionCallback: Module._CallCSharpFunctionCallback,
            _CallCSharpConstructorCallback: Module._CallCSharpConstructorCallback,
            _CallCSharpDestructorCallback: Module._CallCSharpDestructorCallback,
            InjectPapiGLNativeImpl: Module._InjectPapiGLNativeImpl,
            PApiCallbackWithScope: Module._PApiCallbackWithScope,
            PApiConstructorWithScope: Module._PApiConstructorWithScope,
            
            find_class_by_id: Module._find_class_by_id,
            load_class_by_id: Module._load_class_by_id,
            get_class_name: Module._get_class_name,
            get_class_initialize: Module._get_class_initialize,
            get_class_finalize: Module._get_class_finalize,
            get_class_type_id: Module._get_class_type_id,
            get_class_super_type_id: Module._get_class_super_type_id,
            get_class_methods: Module._get_class_methods,
            get_class_functions: Module._get_class_functions,
            get_class_properties: Module._get_class_properties,
            get_class_variables: Module._get_class_variables,
            get_next_property_info: Module._get_next_property_info,
            get_next_function_info: Module._get_next_function_info,
            get_property_info_name: Module._get_property_info_name,
            get_property_info_getter: Module._get_property_info_getter,
            get_property_info_setter: Module._get_property_info_setter,
            get_function_info_name: Module._get_function_info_name,
            get_function_info_callback: Module._get_function_info_callback,
            get_class_data: Module._get_class_data,
            get_class_on_enter: Module._get_class_on_enter,
            get_class_on_exit: Module._get_class_on_exit,
            get_property_info_getter_data: Module._get_property_info_getter_data,
            get_property_info_setter_data: Module._get_property_info_setter_data,
            get_function_info_data: Module._get_function_info_data,
            
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
    "GetWebGLPapiVersion",
    "GetWebGLFFIApi",
    "CreateWebGLPapiEnvRef",
    "TranToString",
    //"GetQjsFFIApi", // declare for compile
    //"GetQjsPapiEnvRef", // declare for compile
    //"GetRegsterApi",
    //"pesapi_alloc_property_descriptors",
    //"pesapi_define_class",
    //"pesapi_get_class_data",
    //"pesapi_on_class_not_found",
    //"pesapi_set_method_info",
    //"pesapi_set_property_info",
    //"pesapi_trace_native_object_lifecycle",
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
    "pesapi_set_env_private_js",
    "pesapi_trace_native_object_lifecycle_js",
    "pesapi_set_registry_js"
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