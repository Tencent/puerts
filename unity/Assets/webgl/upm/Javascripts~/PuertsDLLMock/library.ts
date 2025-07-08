/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

declare let global: any;
global = global || globalThis || window;
global.global = global;
export { global };

export namespace PuertsJSEngine {
    export type EngineConstructorParam = UnityAPI;
    
    export interface UnityAPI {
        UTF8ToString: (strPtr: CSString, maxRead?: number) => string,
        UTF16ToString: (strPtr: CSString, maxRead?: number) => string,
        _malloc: (size: number) => number,
        _free: (ptr: number) => void,
        _setTempRet0: (value: number) => void,
        stringToUTF8: (str: string, buffer: any, size: number) => any,
        lengthBytesUTF8: (str: string) => number,
        stringToUTF16: (str: string, buffer: any, size: number) => any,
        lengthBytesUTF16: (str: string) => number,
        stackAlloc: (size: number) => number,
        stackSave: () => number,
        stackRestore: (stack: number) => void,
        getWasmTableEntry: (index: number) => Function,
        addFunction: (func: Function, sig: string) => number,
        removeFunction: (index: number) => void,
        _CallCSharpFunctionCallback: (functionPtr: IntPtr, selfPtr: CSIdentifier, infoIntPtr: MockIntPtr, paramLen: number, callbackIdx: number) => void;
        _CallCSharpConstructorCallback: (functionPtr: IntPtr, infoIntPtr: MockIntPtr, paramLen: number, callbackIdx: number) => number;
        _CallCSharpDestructorCallback: (functionPtr: IntPtr, selfPtr: CSIdentifier, callbackIdx: number) => void;
        PApiCallbackWithScope: (nativeCallback:number, ffi: number, info: number) => void;
        PApiConstructorWithScope: (nativeCallback:number, ffi: number, info: number) => number;
        InjectPapiGLNativeImpl: () => number;

        find_class_by_id: (registry: number, typeId: number) => number;
        load_class_by_id:  (registry: number, typeId: number) => number;
        get_class_name: (classDef: number) => number;
        get_class_initialize: (classDef: number) => number;
        get_class_finalize: (classDef: number) => number;
        get_class_type_id: (classDef: number) => number;
        get_class_super_type_id: (classDef: number) => number;
        get_class_methods: (classDef: number) => number;
        get_class_functions: (classDef: number) => number;
        get_class_properties: (classDef: number) => number;
        get_class_variables: (classDef: number) => number;
        get_next_property_info: (propInfo: number) => number;
        get_next_function_info: (funcInfo: number) => number;
        get_property_info_name: (propInfo: number) => number;
        get_property_info_getter: (propInfo: number) => number;
        get_property_info_setter: (propInfo: number) => number;
        get_function_info_name: (funcInfo: number) => number;
        get_function_info_callback: (funcInfo: number) => number;
        get_class_data: (classDef: number) => number;
        get_property_info_getter_data: (propInfo: number) => number;
        get_property_info_setter_data: (propInfo: number) => number;
        get_function_info_data: (funcInfo: number) => number;
        
        HEAP8: Int8Array;
        HEAPU8: Uint8Array;
        HEAP32: Int32Array;
        HEAPF32: Float32Array;
        HEAPF64: Float64Array;   
    }
}

export class PuertsJSEngine {
    public readonly unityApi: PuertsJSEngine.UnityAPI;

    public lastException: Error = null;

    constructor(ctorParam: PuertsJSEngine.EngineConstructorParam) {
        const { 
            UTF8ToString,
            UTF16ToString,
            _malloc,
            _free,
            _setTempRet0,
            stringToUTF8,
            lengthBytesUTF8,
            stringToUTF16,
            lengthBytesUTF16,
            stackSave,
            stackRestore,
            stackAlloc,
            getWasmTableEntry,
            addFunction,
            removeFunction,
            _CallCSharpFunctionCallback,
            _CallCSharpConstructorCallback,
            _CallCSharpDestructorCallback,
            InjectPapiGLNativeImpl,
            PApiCallbackWithScope,
            PApiConstructorWithScope,
            find_class_by_id,
            load_class_by_id,
            get_class_name,
            get_class_initialize,
            get_class_finalize,
            get_class_type_id,
            get_class_super_type_id,
            get_class_methods,
            get_class_functions,
            get_class_properties,
            get_class_variables,
            get_next_property_info,
            get_next_function_info,
            get_property_info_name,
            get_property_info_getter,
            get_property_info_setter,
            get_function_info_name,
            get_function_info_callback,
            get_class_data,
            get_property_info_getter_data,
            get_property_info_setter_data,
            get_function_info_data,
            HEAP8,
            HEAPU8,
            HEAP32,
            HEAPF32,
            HEAPF64,
        } = ctorParam;

        this.unityApi = {
            UTF8ToString,
            UTF16ToString,
            _malloc,
            _free,
            _setTempRet0,
            stringToUTF8,
            lengthBytesUTF8,
            stringToUTF16,
            lengthBytesUTF16,
            stackSave,
            stackRestore,
            stackAlloc,
            getWasmTableEntry,
            addFunction,
            removeFunction,
            _CallCSharpFunctionCallback,
            _CallCSharpConstructorCallback,
            _CallCSharpDestructorCallback,
            InjectPapiGLNativeImpl,
            PApiCallbackWithScope,
            PApiConstructorWithScope,

            find_class_by_id,
            load_class_by_id,
            get_class_name,
            get_class_initialize,
            get_class_finalize,
            get_class_type_id,
            get_class_super_type_id,
            get_class_methods,
            get_class_functions,
            get_class_properties,
            get_class_variables,
            get_next_property_info,
            get_next_function_info,
            get_property_info_name,
            get_property_info_getter,
            get_property_info_setter,
            get_function_info_name,
            get_function_info_callback,
            get_class_data,
            get_property_info_getter_data,
            get_property_info_setter_data,
            get_function_info_data,

            HEAP8,
            HEAPU8,
            HEAP32,
            HEAPF32,
            HEAPF64,
        };

        global.__tgjsEvalScript = typeof eval == "undefined" ? () => { } : eval;
        global.__tgjsSetPromiseRejectCallback = function (callback: (...args: any[]) => any) {
            if (typeof wx != 'undefined') {
                wx.onUnhandledRejection(callback);

            } else {
                window.addEventListener("unhandledrejection", callback);
            }
        }
        global.__puertsGetLastException = () => {
            return this.lastException
        }
    }

    /** call when wasm grow memory */
    updateGlobalBufferAndViews(
        HEAP8: Int8Array,
        HEAPU8: Uint8Array,
        HEAP32: Int32Array,
        HEAPF32: Float32Array,
        HEAPF64: Float64Array,
        ): void{
        let unityApi = this.unityApi;
        unityApi.HEAP8 = HEAP8;
        unityApi.HEAPU8 = HEAPU8;
        unityApi.HEAP32 = HEAP32;
        unityApi.HEAPF32 = HEAPF32;
        unityApi.HEAPF64 = HEAPF64;
    }

    memcpy(dest: number, src: number, num: number) {
        this.unityApi.HEAPU8.copyWithin(dest, src, src + num);
    }

    callCSharpFunctionCallback(functionPtr: IntPtr, selfPtr: CSIdentifier, infoIntPtr: MockIntPtr, paramLen: number, callbackIdx: number) {
        this.unityApi._CallCSharpFunctionCallback(functionPtr, infoIntPtr, selfPtr, paramLen, callbackIdx);
    }

    callCSharpConstructorCallback(functionPtr: IntPtr, infoIntPtr: MockIntPtr, paramLen: number, callbackIdx: number) {
        return this.unityApi._CallCSharpConstructorCallback(functionPtr, infoIntPtr, paramLen, callbackIdx);
    }

    callCSharpDestructorCallback(functionPtr: IntPtr, selfPtr: CSIdentifier, callbackIdx: number) {
        this.unityApi._CallCSharpDestructorCallback(functionPtr, selfPtr, callbackIdx);
    }
}
