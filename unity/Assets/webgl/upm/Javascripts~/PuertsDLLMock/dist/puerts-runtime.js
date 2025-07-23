/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./output/buffer.js":
/*!**************************!*\
  !*** ./output/buffer.js ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {


/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.writeDouble = exports.writeFloat = exports.writeUInt64 = exports.writeInt64 = exports.writeUInt32 = exports.writeInt32 = exports.writeUInt16 = exports.writeInt16 = exports.writeUInt8 = exports.writeInt8 = exports.readDouble = exports.readFloat = exports.readUInt64 = exports.readInt64 = exports.readUInt32 = exports.readInt32 = exports.readUInt16 = exports.readInt16 = exports.readUInt8 = exports.readInt8 = void 0;
function validateNumber(value, type) {
    if (typeof value !== 'number') {
        throw new Error(`${type} expects a number but got ${value}`);
    }
}
function boundsError(value, length, type) {
    if (Math.floor(value) !== value) {
        validateNumber(value, type || 'offset');
        throw new Error(`${type || 'offset'} expects an integer but got ${value}`);
    }
    if (length < 0) {
        throw new Error("out of bound");
    }
    throw new Error(`${type || 'offset'} expects >= ${type ? 1 : 0} and <= ${length} but got ${value}`);
}
function checkBounds(buf, offset, byteLength) {
    validateNumber(offset, 'offset');
    if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
        boundsError(offset, buf.length - (byteLength + 1));
    }
}
function writeU_Int8(buf, value, offset, min, max) {
    value = +value;
    validateNumber(offset, 'offset');
    if (value > max || value < min) {
        throw new Error(`value expects >= ${min} and <= ${max} but got ${value}`);
    }
    if (buf[offset] === undefined) {
        boundsError(offset, buf.length - 1);
    }
    buf[offset] = value;
    return offset + 1;
}
function readInt8(buff, offset = 0) {
    validateNumber(offset, 'offset');
    const val = buff[offset];
    if (val === undefined) {
        boundsError(offset, buff.length - 1);
    }
    return val | (val & 2 ** 7) * 0x1fffffe;
}
exports.readInt8 = readInt8;
function writeInt8(buf, value, offset = 0) {
    return writeU_Int8(buf, value, offset, -0x80, 0x7f);
}
exports.writeInt8 = writeInt8;
function readUInt8(buff, offset = 0) {
    validateNumber(offset, 'offset');
    const val = buff[offset];
    if (val === undefined) {
        boundsError(offset, buff.length - 1);
    }
    return val;
}
exports.readUInt8 = readUInt8;
function writeUInt8(buf, value, offset = 0) {
    return writeU_Int8(buf, value, offset, 0, 0xff);
}
exports.writeUInt8 = writeUInt8;
const int16Array = new Int16Array(1);
const uInt8Int6Array = new Uint8Array(int16Array.buffer);
function readInt16(buff, offset = 0) {
    validateNumber(offset, 'offset');
    const first = buff[offset];
    const last = buff[offset + 1];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 2);
    }
    uInt8Int6Array[0] = first;
    uInt8Int6Array[1] = last;
    return int16Array[0];
}
exports.readInt16 = readInt16;
function writeInt16(buff, val, offset = 0) {
    val = +val;
    checkBounds(buff, offset, 1);
    int16Array[0] = val;
    buff[offset++] = uInt8Int6Array[0];
    buff[offset++] = uInt8Int6Array[1];
    return offset;
}
exports.writeInt16 = writeInt16;
const uint16Array = new Uint16Array(1);
const uint8Uint16Array = new Uint8Array(uint16Array.buffer);
function readUInt16(buff, offset = 0) {
    validateNumber(offset, 'offset');
    const first = buff[offset];
    const last = buff[offset + 1];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 2);
    }
    uint8Uint16Array[0] = first;
    uint8Uint16Array[1] = last;
    return uint16Array[0];
}
exports.readUInt16 = readUInt16;
function writeUInt16(buff, val, offset = 0) {
    val = +val;
    checkBounds(buff, offset, 1);
    uint16Array[0] = val;
    buff[offset++] = uint8Uint16Array[0];
    buff[offset++] = uint8Uint16Array[1];
    return offset;
}
exports.writeUInt16 = writeUInt16;
const int32Array = new Int32Array(1);
const uint8Int32Array = new Uint8Array(int32Array.buffer);
function readInt32(buff, offset = 0) {
    validateNumber(offset, 'offset');
    const first = buff[offset];
    const last = buff[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 4);
    }
    uint8Int32Array[0] = first;
    uint8Int32Array[1] = buff[++offset];
    uint8Int32Array[2] = buff[++offset];
    uint8Int32Array[3] = last;
    return int32Array[0];
}
exports.readInt32 = readInt32;
function writeInt32(buff, val, offset = 0) {
    val = +val;
    checkBounds(buff, offset, 3);
    int32Array[0] = val;
    buff[offset++] = uint8Int32Array[0];
    buff[offset++] = uint8Int32Array[1];
    buff[offset++] = uint8Int32Array[2];
    buff[offset++] = uint8Int32Array[3];
    return offset;
}
exports.writeInt32 = writeInt32;
const uint32Array = new Uint32Array(1);
const uint8Uint32Array = new Uint8Array(uint32Array.buffer);
function readUInt32(buff, offset = 0) {
    validateNumber(offset, 'offset');
    const first = buff[offset];
    const last = buff[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 4);
    }
    uint8Uint32Array[0] = first;
    uint8Uint32Array[1] = buff[++offset];
    uint8Uint32Array[2] = buff[++offset];
    uint8Uint32Array[3] = last;
    return uint32Array[0];
}
exports.readUInt32 = readUInt32;
function writeUInt32(buff, val, offset = 0) {
    val = +val;
    checkBounds(buff, offset, 3);
    uint32Array[0] = val;
    buff[offset++] = uint8Uint32Array[0];
    buff[offset++] = uint8Uint32Array[1];
    buff[offset++] = uint8Uint32Array[2];
    buff[offset++] = uint8Uint32Array[3];
    return offset;
}
exports.writeUInt32 = writeUInt32;
const float32Array = new Float32Array(1);
const uInt8Float32Array = new Uint8Array(float32Array.buffer);
function readFloat(buff, offset = 0) {
    validateNumber(offset, 'offset');
    const first = buff[offset];
    const last = buff[offset + 3];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 4);
    }
    uInt8Float32Array[0] = first;
    uInt8Float32Array[1] = buff[++offset];
    uInt8Float32Array[2] = buff[++offset];
    uInt8Float32Array[3] = last;
    return float32Array[0];
}
exports.readFloat = readFloat;
function writeFloat(buff, val, offset = 0) {
    val = +val;
    checkBounds(buff, offset, 3);
    float32Array[0] = val;
    buff[offset++] = uInt8Float32Array[0];
    buff[offset++] = uInt8Float32Array[1];
    buff[offset++] = uInt8Float32Array[2];
    buff[offset++] = uInt8Float32Array[3];
    return offset;
}
exports.writeFloat = writeFloat;
const float64Array = new Float64Array(1);
const uInt8Float64Array = new Uint8Array(float64Array.buffer);
function readDouble(buff, offset = 0) {
    const first = buff[offset];
    const last = buff[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 8);
    }
    uInt8Float64Array[0] = first;
    uInt8Float64Array[1] = buff[++offset];
    uInt8Float64Array[2] = buff[++offset];
    uInt8Float64Array[3] = buff[++offset];
    uInt8Float64Array[4] = buff[++offset];
    uInt8Float64Array[5] = buff[++offset];
    uInt8Float64Array[6] = buff[++offset];
    uInt8Float64Array[7] = last;
    return float64Array[0];
}
exports.readDouble = readDouble;
function writeDouble(buff, val, offset = 0) {
    val = +val;
    checkBounds(buff, offset, 7);
    float64Array[0] = val;
    buff[offset++] = uInt8Float64Array[0];
    buff[offset++] = uInt8Float64Array[1];
    buff[offset++] = uInt8Float64Array[2];
    buff[offset++] = uInt8Float64Array[3];
    buff[offset++] = uInt8Float64Array[4];
    buff[offset++] = uInt8Float64Array[5];
    buff[offset++] = uInt8Float64Array[6];
    buff[offset++] = uInt8Float64Array[7];
    return offset;
}
exports.writeDouble = writeDouble;
const bigInt64Array = new BigInt64Array(1);
const uint8BigInt64Array = new Uint8Array(bigInt64Array.buffer);
function readInt64(buff, offset = 0) {
    const first = buff[offset];
    const last = buff[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 8);
    }
    uint8BigInt64Array[0] = first;
    uint8BigInt64Array[1] = buff[++offset];
    uint8BigInt64Array[2] = buff[++offset];
    uint8BigInt64Array[3] = buff[++offset];
    uint8BigInt64Array[4] = buff[++offset];
    uint8BigInt64Array[5] = buff[++offset];
    uint8BigInt64Array[6] = buff[++offset];
    uint8BigInt64Array[7] = last;
    return bigInt64Array[0];
}
exports.readInt64 = readInt64;
function writeInt64(buff, val, offset = 0) {
    val = typeof val === 'number' ? BigInt(val) : val;
    checkBounds(buff, offset, 7);
    bigInt64Array[0] = val;
    buff[offset++] = uint8BigInt64Array[0];
    buff[offset++] = uint8BigInt64Array[1];
    buff[offset++] = uint8BigInt64Array[2];
    buff[offset++] = uint8BigInt64Array[3];
    buff[offset++] = uint8BigInt64Array[4];
    buff[offset++] = uint8BigInt64Array[5];
    buff[offset++] = uint8BigInt64Array[6];
    buff[offset++] = uint8BigInt64Array[7];
    return offset;
}
exports.writeInt64 = writeInt64;
const bigUint64Array = new BigUint64Array(1);
const uint8BigUint64Array = new Uint8Array(bigUint64Array.buffer);
function readUInt64(buff, offset = 0) {
    const first = buff[offset];
    const last = buff[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, buff.length - 8);
    }
    uint8BigUint64Array[0] = first;
    uint8BigUint64Array[1] = buff[++offset];
    uint8BigUint64Array[2] = buff[++offset];
    uint8BigUint64Array[3] = buff[++offset];
    uint8BigUint64Array[4] = buff[++offset];
    uint8BigUint64Array[5] = buff[++offset];
    uint8BigUint64Array[6] = buff[++offset];
    uint8BigUint64Array[7] = last;
    return bigUint64Array[0];
}
exports.readUInt64 = readUInt64;
function writeUInt64(buff, val, offset = 0) {
    val = typeof val === 'number' ? BigInt(val) : val;
    checkBounds(buff, offset, 7);
    bigUint64Array[0] = val;
    buff[offset++] = uint8BigUint64Array[0];
    buff[offset++] = uint8BigUint64Array[1];
    buff[offset++] = uint8BigUint64Array[2];
    buff[offset++] = uint8BigUint64Array[3];
    buff[offset++] = uint8BigUint64Array[4];
    buff[offset++] = uint8BigUint64Array[5];
    buff[offset++] = uint8BigUint64Array[6];
    buff[offset++] = uint8BigUint64Array[7];
    return offset;
}
exports.writeUInt64 = writeUInt64;
//# sourceMappingURL=buffer.js.map

/***/ }),

/***/ "./output/library.js":
/*!***************************!*\
  !*** ./output/library.js ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PuertsJSEngine = exports.global = void 0;
exports.global = __webpack_require__.g = __webpack_require__.g || globalThis || window;
__webpack_require__.g.global = __webpack_require__.g;
class PuertsJSEngine {
    unityApi;
    lastException = null;
    constructor(ctorParam) {
        const { UTF8ToString, UTF16ToString, _malloc, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, stringToUTF16, lengthBytesUTF16, stackSave, stackRestore, stackAlloc, getWasmTableEntry, addFunction, removeFunction, _CallCSharpFunctionCallback, _CallCSharpConstructorCallback, _CallCSharpDestructorCallback, InjectPapiGLNativeImpl, PApiCallbackWithScope, PApiConstructorWithScope, find_class_by_id, load_class_by_id, get_class_name, get_class_initialize, get_class_finalize, get_class_type_id, get_class_super_type_id, get_class_methods, get_class_functions, get_class_properties, get_class_variables, get_next_property_info, get_next_function_info, get_property_info_name, get_property_info_getter, get_property_info_setter, get_function_info_name, get_function_info_callback, get_class_data, get_class_trace_lifecycle, get_property_info_getter_data, get_property_info_setter_data, get_function_info_data, HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64, } = ctorParam;
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
            get_class_trace_lifecycle,
            get_property_info_getter_data,
            get_property_info_setter_data,
            get_function_info_data,
            HEAP8,
            HEAPU8,
            HEAP32,
            HEAPF32,
            HEAPF64,
        };
        __webpack_require__.g.__tgjsEvalScript = typeof eval == "undefined" ? () => { } : eval;
        __webpack_require__.g.__tgjsSetPromiseRejectCallback = function (callback) {
            if (typeof wx != 'undefined') {
                wx.onUnhandledRejection(callback);
            }
            else {
                window.addEventListener("unhandledrejection", callback);
            }
        };
        __webpack_require__.g.__puertsGetLastException = () => {
            return this.lastException;
        };
    }
    /** call when wasm grow memory */
    updateGlobalBufferAndViews(HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64) {
        let unityApi = this.unityApi;
        unityApi.HEAP8 = HEAP8;
        unityApi.HEAPU8 = HEAPU8;
        unityApi.HEAP32 = HEAP32;
        unityApi.HEAPF32 = HEAPF32;
        unityApi.HEAPF64 = HEAPF64;
    }
    memcpy(dest, src, num) {
        this.unityApi.HEAPU8.copyWithin(dest, src, src + num);
    }
    callCSharpFunctionCallback(functionPtr, selfPtr, infoIntPtr, paramLen, callbackIdx) {
        this.unityApi._CallCSharpFunctionCallback(functionPtr, infoIntPtr, selfPtr, paramLen, callbackIdx);
    }
    callCSharpConstructorCallback(functionPtr, infoIntPtr, paramLen, callbackIdx) {
        return this.unityApi._CallCSharpConstructorCallback(functionPtr, infoIntPtr, paramLen, callbackIdx);
    }
    callCSharpDestructorCallback(functionPtr, selfPtr, callbackIdx) {
        this.unityApi._CallCSharpDestructorCallback(functionPtr, selfPtr, callbackIdx);
    }
}
exports.PuertsJSEngine = PuertsJSEngine;
//# sourceMappingURL=library.js.map

/***/ }),

/***/ "./output/pesapiImpl.js":
/*!******************************!*\
  !*** ./output/pesapiImpl.js ***!
  \******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebGLFFIApi = void 0;
const Buffer = __webpack_require__(/*! ./buffer */ "./output/buffer.js");
let loader = null;
let loaderResolve = null;
const executeModuleCache = {};
/**
 * Sparse Array implementation with efficient add/remove operations
 * - Maintains contiguous storage
 * - Reuses empty slots from deletions
 * - O(1) add/remove in most cases
 */
class SparseArray {
    _data;
    _freeIndices;
    _length;
    constructor(capacity = 0) {
        this._data = new Array(capacity);
        this._freeIndices = [];
        this._length = 0;
    }
    /**
     * Add an element to the array
     * @returns The index where the element was inserted
     */
    add(element) {
        if (this._freeIndices.length > 0) {
            const index = this._freeIndices.pop();
            this._data[index] = element;
            this._length++;
            return index;
        }
        const index = this._data.length;
        this._data.push(element);
        this._length++;
        return index;
    }
    /**
     * Remove an element by index
     * @returns true if removal was successful
     */
    remove(index) {
        if (index < 0 || index >= this._data.length || this._data[index] === undefined) {
            return false;
        }
        this._data[index] = undefined;
        this._freeIndices.push(index);
        this._length--;
        // Compact the array if last element is removed
        if (index === this._data.length - 1) {
            this._compact();
        }
        return true;
    }
    /**
     * Get element by index
     */
    get(index) {
        return this._data[index];
    }
    /**
     * Current number of active elements
     */
    get length() {
        return this._length;
    }
    /**
     * Total capacity (including empty slots)
     */
    get capacity() {
        return this._data.length;
    }
    /**
     * Compact the array by removing trailing undefined elements
     */
    _compact() {
        let lastIndex = this._data.length - 1;
        while (lastIndex >= 0 && this._data[lastIndex] === undefined) {
            this._data.pop();
            // Remove any free indices in the compacted area
            const compactedIndex = this._freeIndices.indexOf(lastIndex);
            if (compactedIndex !== -1) {
                this._freeIndices.splice(compactedIndex, 1);
            }
            lastIndex--;
        }
    }
}
function ExecuteModule(fileName) {
    if (['puerts/log.mjs', 'puerts/timer.mjs'].indexOf(fileName) != -1) {
        return {};
    }
    if (!loader) {
        loader = globalThis.scriptEnv.GetLoader();
        loaderResolve = loader.Resolve ? (function (fileName, to = "") {
            const resolvedName = loader.Resolve(fileName, to);
            if (!resolvedName) {
                throw new Error('module not found: ' + fileName);
            }
            return resolvedName;
        }) : null;
    }
    if (loaderResolve) {
        fileName = loaderResolve(fileName, "");
    }
    if (typeof wx != 'undefined') {
        const result = wxRequire('puerts_minigame_js_resources/' + (fileName.endsWith('.js') ? fileName : fileName + ".js"));
        return result;
    }
    else {
        function normalize(name, to) {
            if (typeof CS != void 0) {
                if (CS.Puerts.PathHelper.IsRelative(to)) {
                    const ret = CS.Puerts.PathHelper.normalize(CS.Puerts.PathHelper.Dirname(name) + "/" + to);
                    return ret;
                }
            }
            return to;
        }
        function mockRequire(specifier) {
            const result = { exports: {} };
            const foundCacheSpecifier = tryFindAndGetFindedSpecifier(specifier, executeModuleCache);
            if (foundCacheSpecifier) {
                result.exports = executeModuleCache[foundCacheSpecifier];
            }
            else {
                const foundSpecifier = tryFindAndGetFindedSpecifier(specifier, PUERTS_JS_RESOURCES);
                if (!foundSpecifier) {
                    throw new Error('module not found: ' + specifier);
                }
                specifier = foundSpecifier;
                executeModuleCache[specifier] = -1;
                try {
                    PUERTS_JS_RESOURCES[specifier](result.exports, function mRequire(specifierTo) {
                        return mockRequire(loaderResolve ? loaderResolve(specifierTo, specifier) : normalize(specifier, specifierTo));
                    }, result);
                }
                catch (e) {
                    delete executeModuleCache[specifier];
                    throw e;
                }
                executeModuleCache[specifier] = result.exports;
            }
            return result.exports;
            function tryFindAndGetFindedSpecifier(specifier, obj) {
                let tryFindName = [specifier];
                if (specifier.indexOf('.') == -1)
                    tryFindName = tryFindName.concat([specifier + '.js', specifier + '.ts', specifier + '.mjs', specifier + '.mts']);
                let finded = tryFindName.reduce((ret, name, index) => {
                    if (ret !== false)
                        return ret;
                    if (name in obj) {
                        if (obj[name] == -1)
                            throw new Error(`circular dependency is detected when requiring "${name}"`);
                        return index;
                    }
                    return false;
                }, false);
                if (finded === false) {
                    return null;
                }
                else {
                    return tryFindName[finded];
                }
            }
        }
        const requireRet = mockRequire(fileName);
        return requireRet;
    }
}
globalThis.__puertsExecuteModule = ExecuteModule;
var JSTag;
(function (JSTag) {
    /* all tags with a reference count are negative */
    JSTag[JSTag["JS_TAG_FIRST"] = -9] = "JS_TAG_FIRST";
    JSTag[JSTag["JS_TAG_STRING"] = -9] = "JS_TAG_STRING";
    JSTag[JSTag["JS_TAG_STRING16"] = -8] = "JS_TAG_STRING16";
    JSTag[JSTag["JS_TAG_BUFFER"] = -7] = "JS_TAG_BUFFER";
    JSTag[JSTag["JS_TAG_EXCEPTION"] = -6] = "JS_TAG_EXCEPTION";
    JSTag[JSTag["JS_TAG_NATIVE_OBJECT"] = -4] = "JS_TAG_NATIVE_OBJECT";
    JSTag[JSTag["JS_TAG_ARRAY"] = -3] = "JS_TAG_ARRAY";
    JSTag[JSTag["JS_TAG_FUNCTION"] = -2] = "JS_TAG_FUNCTION";
    JSTag[JSTag["JS_TAG_OBJECT"] = -1] = "JS_TAG_OBJECT";
    JSTag[JSTag["JS_TAG_INT"] = 0] = "JS_TAG_INT";
    JSTag[JSTag["JS_TAG_BOOL"] = 1] = "JS_TAG_BOOL";
    JSTag[JSTag["JS_TAG_NULL"] = 2] = "JS_TAG_NULL";
    JSTag[JSTag["JS_TAG_UNDEFINED"] = 3] = "JS_TAG_UNDEFINED";
    JSTag[JSTag["JS_TAG_UNINITIALIZED"] = 4] = "JS_TAG_UNINITIALIZED";
    JSTag[JSTag["JS_TAG_FLOAT64"] = 5] = "JS_TAG_FLOAT64";
    JSTag[JSTag["JS_TAG_INT64"] = 6] = "JS_TAG_INT64";
    JSTag[JSTag["JS_TAG_UINT64"] = 7] = "JS_TAG_UINT64";
})(JSTag || (JSTag = {}));
let hasException = false;
let lastException = undefined;
let lastExceptionBuffer = undefined;
function getExceptionAsNativeString(wasmApi, with_stack) {
    if (hasException) {
        hasException = false;
        let result = undefined;
        if (typeof lastException === 'object' && lastException !== null) {
            const msg = lastException.message;
            const stack = lastException.stack;
            result = with_stack ? `${msg}\n${stack}` : msg;
        }
        else {
            result = `${lastException}`;
        }
        lastException = null;
        const byteCount = wasmApi.lengthBytesUTF8(result);
        // console.log(`getExceptionAsNativeString(${byteCount}): ${result}`);
        if (lastExceptionBuffer) {
            wasmApi._free(lastExceptionBuffer);
        }
        lastExceptionBuffer = wasmApi._malloc(byteCount + 1);
        // 这不+1会导致少一个字符，看上去stringToUTF8的逻辑是认为该长度是buffer的最大长度，而且确保结尾有\0结束符
        wasmApi.stringToUTF8(result, lastExceptionBuffer, byteCount + 1);
        // 如果上述推论正确，这行是多余的，不过保险起见还是加下
        wasmApi.HEAPU8[lastExceptionBuffer + byteCount] = 0;
        return lastExceptionBuffer;
    }
    return 0;
}
function getAndClearLastException() {
    hasException = false;
    const ret = lastException;
    lastException = null;
    return ret;
}
function setLastException(err) {
    hasException = true;
    lastException = err;
}
class Scope {
    static current = undefined;
    static getCurrent() {
        return Scope.current;
    }
    static enter() {
        return new Scope();
    }
    static exit(wasmApi) {
        getAndClearLastException();
        Scope.current.close(wasmApi);
    }
    constructor() {
        this.prevScope = Scope.current;
        Scope.current = this;
    }
    close(wasmApi) {
        Scope.current = this.prevScope;
    }
    addToScope(obj) {
        this.objectsInScope.push(obj);
        return this.objectsInScope.length - 1;
    }
    getFromScope(index) {
        return this.objectsInScope[index];
    }
    toJs(wasmApi, objMapper, pvalue, freeStringAndBuffer = false) {
        if (pvalue == 0)
            return undefined;
        const heap = wasmApi.HEAPU8;
        const tagPtr = pvalue + 8;
        const valType = Buffer.readInt32(heap, tagPtr);
        //console.log(`valType: ${valType}`);
        if (valType <= JSTag.JS_TAG_OBJECT && valType >= JSTag.JS_TAG_ARRAY) {
            const objIdx = Buffer.readInt32(heap, pvalue);
            return this.objectsInScope[objIdx];
        }
        if (valType == JSTag.JS_TAG_NATIVE_OBJECT) {
            const objId = Buffer.readInt32(heap, pvalue);
            return objMapper.findNativeObject(objId); // 肯定已经push过了，直接find就可以了
        }
        switch (valType) {
            case JSTag.JS_TAG_BOOL:
                return Buffer.readInt32(heap, pvalue) != 0;
            case JSTag.JS_TAG_INT:
                return Buffer.readInt32(heap, pvalue);
            case JSTag.JS_TAG_NULL:
                return null;
            case JSTag.JS_TAG_UNDEFINED:
                return undefined;
            case JSTag.JS_TAG_FLOAT64:
                return Buffer.readDouble(heap, pvalue);
            case JSTag.JS_TAG_INT64:
                return Buffer.readInt64(heap, pvalue);
            case JSTag.JS_TAG_UINT64:
                return Buffer.readUInt64(heap, pvalue);
            case JSTag.JS_TAG_STRING:
                const strStart = Buffer.readInt32(heap, pvalue);
                const strLen = Buffer.readInt32(heap, pvalue + 4);
                const str = wasmApi.UTF8ToString(strStart, strLen);
                if (freeStringAndBuffer) {
                    const need_free = Buffer.readInt32(heap, tagPtr + 4); // need_free
                    if (need_free != 0) {
                        wasmApi._free(strStart);
                    }
                }
                return str;
            case JSTag.JS_TAG_STRING16:
                const str16Start = Buffer.readInt32(heap, pvalue);
                const str16Len = Buffer.readInt32(heap, pvalue + 4);
                const str16 = wasmApi.UTF16ToString(str16Start, str16Len * 2);
                if (freeStringAndBuffer) {
                    const need_free = Buffer.readInt32(heap, tagPtr + 4); // need_free
                    if (need_free != 0) {
                        wasmApi._free(str16Start);
                    }
                }
                return str16;
            case JSTag.JS_TAG_BUFFER:
                const buffStart = Buffer.readInt32(heap, pvalue);
                const buffLen = Buffer.readInt32(heap, pvalue + 4);
                const buff = wasmApi.HEAP8.buffer.slice(buffStart, buffStart + buffLen);
                if (freeStringAndBuffer) {
                    const need_free = Buffer.readInt32(heap, tagPtr + 4); // need_free
                    if (need_free != 0) {
                        wasmApi._free(buffStart);
                    }
                }
                return buff;
        }
        throw new Error(`unsupported type: ${valType}`);
    }
    prevScope = undefined;
    objectsInScope = [null]; // 加null为了index从1开始，因为在原生种存放在指针字段防止误判为nullptr
}
class ObjectPool {
    storage = new Map();
    gcIterator;
    gcTimeout = null;
    isGcRunning = false;
    // GC configuration defaults
    gcBatchSize = 100;
    gcIntervalMs = 50;
    cleanupCallback = undefined;
    constructor(cleanupCallback) {
        this.cleanupCallback = cleanupCallback;
    }
    add(objId, obj, typeId, callFinalize) {
        const ref = new WeakRef(obj);
        this.storage.set(objId, [ref, typeId, callFinalize]);
        obj.$ObjId__ = objId;
        obj.$TypeId__ = typeId;
        return this;
    }
    get(objId) {
        const entry = this.storage.get(objId);
        if (!entry)
            return;
        const [ref, typeId, callFinalize] = entry;
        const obj = ref.deref();
        if (!obj) {
            this.storage.delete(objId);
            this.cleanupCallback(objId, typeId, callFinalize);
        }
        return obj;
    }
    static GetNativeInfoOfObject(obj) {
        const objId = obj.$ObjId__;
        if (typeof objId === 'number') {
            return [objId, obj.$TypeId__];
        }
    }
    has(objId) {
        return this.storage.has(objId);
    }
    fullGc() {
        for (const [objId] of this.storage) {
            this.get(objId);
        }
        // Only reset iterator if GC is running to maintain iteration state
        if (this.isGcRunning) {
            this.gcIterator = this.storage.keys();
        }
    }
    // Start incremental garbage collection with configurable parameters
    startIncrementalGc(batchSize = 100, intervalMs = 50) {
        if (this.isGcRunning)
            return;
        this.isGcRunning = true;
        this.gcBatchSize = Math.max(1, batchSize);
        this.gcIntervalMs = Math.max(0, intervalMs);
        this.gcIterator = this.storage.keys();
        this.processGcBatch();
    }
    // Stop incremental garbage collection
    stopIncrementalGc() {
        this.isGcRunning = false;
        if (this.gcTimeout) {
            clearTimeout(this.gcTimeout);
            this.gcTimeout = null;
        }
    }
    processGcBatch() {
        if (!this.isGcRunning)
            return;
        let processed = 0;
        let next = this.gcIterator.next();
        while (!next.done && processed < this.gcBatchSize) {
            this.get(next.value);
            processed++;
            next = this.gcIterator.next();
        }
        if (next.done) {
            // Restart iterator for next round
            this.gcIterator = this.storage.keys();
        }
        this.gcTimeout = setTimeout(() => this.processGcBatch(), this.gcIntervalMs);
    }
}
class ClassRegister {
    static instance;
    constructor() { }
    classNotFound = undefined;
    typeIdToClass = new Map();
    typeIdToInfos = new Map();
    nameToClass = new Map();
    static getInstance() {
        if (!ClassRegister.instance) {
            ClassRegister.instance = new ClassRegister();
        }
        return ClassRegister.instance;
    }
    //public pesapi_define_class(typeId: number, superTypeId: number, pname: CSString, constructor: number, finalize: number, propertyCount: number, properties: number, data: number): void {
    //}
    defineClass(typeId) {
        const typeDef = wasmApi.load_class_by_id(registry, typeId);
        const superTypeId = wasmApi.get_class_super_type_id(typeDef);
        const pname = wasmApi.get_class_name(typeDef);
        const name = wasmApi.UTF8ToString(pname);
        const constructor = wasmApi.get_class_initialize(typeDef);
        const finalize = wasmApi.get_class_finalize(typeDef);
        const data = wasmApi.get_class_data(typeDef);
        const trace_lifecycle = wasmApi.get_class_trace_lifecycle(typeDef);
        const PApiNativeObject = function (...args) {
            let callbackInfo = undefined;
            const argc = arguments.length;
            const scope = Scope.enter();
            try {
                callbackInfo = jsArgsToCallbackInfo(wasmApi, argc, args);
                Buffer.writeInt32(wasmApi.HEAPU8, data, callbackInfo + 8); // data
                const objId = wasmApi.PApiConstructorWithScope(constructor, webglFFI, callbackInfo); // 预期wasm只会通过throw_by_string抛异常，不产生直接js异常
                if (hasException) {
                    throw getAndClearLastException();
                }
                objMapper.bindNativeObject(objId, this, typeId, PApiNativeObject, true);
            }
            finally {
                returnNativeCallbackInfo(wasmApi, argc, callbackInfo);
                scope.close(wasmApi);
            }
        };
        Object.defineProperty(PApiNativeObject, "name", { value: name });
        if (superTypeId != 0) {
            const superType = this.loadClassById(superTypeId);
            if (superType) {
                Object.setPrototypeOf(PApiNativeObject.prototype, superType.prototype);
            }
        }
        function nativeMethodInfoToJs(methodPtr, isStatic) {
            const nativeFuncPtr = wasmApi.get_function_info_callback(methodPtr);
            const methodData = wasmApi.get_function_info_data(methodPtr);
            return genJsCallback(wasmApi, nativeFuncPtr, methodData, webglFFI, isStatic);
        }
        function nativePropertyInfoToJs(propertyInfoPtr, isStatic) {
            const getter = wasmApi.get_property_info_getter(propertyInfoPtr);
            const setter = wasmApi.get_property_info_setter(propertyInfoPtr);
            const getter_data = wasmApi.get_property_info_getter_data(propertyInfoPtr);
            const setter_data = wasmApi.get_property_info_setter_data(propertyInfoPtr);
            return {
                get: getter === 0 ? undefined : genJsCallback(wasmApi, getter, getter_data, webglFFI, isStatic),
                set: setter === 0 ? undefined : genJsCallback(wasmApi, setter, setter_data, webglFFI, isStatic),
                configurable: true,
                enumerable: true
            };
        }
        let methodPtr = wasmApi.get_class_methods(typeDef);
        while (methodPtr != 0) {
            const fieldName = wasmApi.UTF8ToString(wasmApi.get_function_info_name(methodPtr));
            //console.log(`method: ${name} ${fieldName}`);
            PApiNativeObject.prototype[fieldName] = nativeMethodInfoToJs(methodPtr, false);
            methodPtr = wasmApi.get_next_function_info(methodPtr);
        }
        let functionPtr = wasmApi.get_class_functions(typeDef);
        while (functionPtr != 0) {
            const fieldName = wasmApi.UTF8ToString(wasmApi.get_function_info_name(functionPtr));
            //console.log(`function: ${name} ${fieldName}`);
            PApiNativeObject[fieldName] = nativeMethodInfoToJs(functionPtr, true);
            functionPtr = wasmApi.get_next_function_info(functionPtr);
        }
        let propertyPtr = wasmApi.get_class_properties(typeDef);
        while (propertyPtr != 0) {
            const fieldName = wasmApi.UTF8ToString(wasmApi.get_property_info_name(propertyPtr));
            //console.log(`property: ${name} ${fieldName}`);
            Object.defineProperty(PApiNativeObject.prototype, fieldName, nativePropertyInfoToJs(propertyPtr, false));
            propertyPtr = wasmApi.get_next_property_info(propertyPtr);
        }
        let variablePtr = wasmApi.get_class_variables(typeDef);
        while (variablePtr != 0) {
            const fieldName = wasmApi.UTF8ToString(wasmApi.get_property_info_name(variablePtr));
            //console.log(`variable: ${name} ${fieldName}`);
            Object.defineProperty(PApiNativeObject, fieldName, nativePropertyInfoToJs(variablePtr, false));
            variablePtr = wasmApi.get_next_property_info(variablePtr);
        }
        //console.log(`pesapi_define_class: ${name} ${typeId} ${superTypeId}`);
        this.registerClass(typeId, PApiNativeObject, wasmApi.getWasmTableEntry(finalize), data, trace_lifecycle);
    }
    loadClassById(typeId) {
        const cls = this.typeIdToClass.get(typeId);
        if (cls) {
            return cls;
        }
        else {
            this.defineClass(typeId);
            return this.typeIdToClass.get(typeId);
        }
    }
    registerClass(typeId, cls, finalize, clsData, trace_lifecycle) {
        const infos = { typeId, finalize, data: clsData, traceLifecycle: trace_lifecycle != 0 };
        Object.defineProperty(cls, '$Infos', {
            value: infos,
            writable: false,
            enumerable: false,
            configurable: false
        });
        this.typeIdToClass.set(typeId, cls);
        this.typeIdToInfos.set(typeId, infos);
        this.nameToClass.set(cls.name, cls);
    }
    getClassDataById(typeId, forceLoad) {
        if (forceLoad) {
            this.loadClassById(typeId);
        }
        const infos = this.getTypeInfos(typeId);
        return infos ? infos.data : 0;
    }
    findClassById(typeId) {
        return this.typeIdToClass.get(typeId);
    }
    findClassByName(name) {
        return this.nameToClass.get(name);
    }
    getTypeInfos(typeId) {
        return this.typeIdToInfos.get(typeId);
    }
    setClassNotFoundCallback(callback) {
        this.classNotFound = callback;
    }
}
class ObjectMapper {
    objectPool;
    privateData = undefined;
    objId2ud = new Map();
    onEnter = undefined;
    onExit = undefined;
    constructor() {
        this.objectPool = new ObjectPool(this.OnNativeObjectFinalized.bind(this));
        this.objectPool.startIncrementalGc(100, 1000);
    }
    pushNativeObject(objId, typeId, callFinalize) {
        let jsObj = this.objectPool.get(objId);
        if (!jsObj) {
            const cls = ClassRegister.getInstance().loadClassById(typeId);
            if (cls) {
                jsObj = Object.create(cls.prototype);
                this.bindNativeObject(objId, jsObj, typeId, cls, callFinalize);
            }
        }
        return jsObj;
    }
    findNativeObject(objId) {
        return this.objectPool.get(objId);
    }
    bindNativeObject(objId, jsObj, typeId, cls, callFinalize) {
        this.objectPool.add(objId, jsObj, typeId, callFinalize);
        const { data, traceLifecycle } = cls.$Infos;
        if (traceLifecycle && this.onEnter) {
            const ud = this.onEnter(objId, data, this.privateData);
            this.objId2ud.set(objId, ud);
        }
    }
    setEnvPrivate(privateData) {
        this.privateData = privateData;
    }
    traceNativeObject(onEnter, onExit) {
        this.onEnter = onEnter;
        this.onExit = onExit;
    }
    OnNativeObjectFinalized(objId, typeId, callFinalize) {
        //console.error(`OnNativeObjectFinalized ${objId}`);
        const cls = ClassRegister.getInstance().findClassById(typeId);
        const { finalize, data, traceLifecycle } = cls.$Infos;
        if (callFinalize && finalize) {
            finalize(webglFFI, objId, data, this.privateData);
        }
        if (traceLifecycle && this.onExit && this.objId2ud.has(objId)) {
            const ud = this.objId2ud.get(objId);
            this.objId2ud.delete(objId);
            this.onExit(objId, data, this.privateData, ud);
        }
    }
}
let webglFFI = undefined;
let objMapper = undefined;
let registry = undefined;
let wasmApi = undefined;
// typedef struct String {
//     const char *ptr;
//     uint32_t len;
// } String;
// 
// typedef struct Buffer {
//     void *ptr;
//     uint32_t len;
// } Buffer;
// 
// typedef struct NativeObject {
//     void *objId;
//     const void *typeId;
// } NativeObject;
// 
// typedef union JSValueUnion {
//     int32_t int32;
//     double float64;
//     int64_t int64;
//     uint64_t uint64;
//     void *ptr;
//     String str;
//     Buffer buf;
//     NativeObject nto;
// } JSValueUnion;
// 
// typedef struct JSValue {
//     JSValueUnion u;
//     int32_t tag;
//     int need_free;
// } JSValue;
//
// struct CallbackInfo {
//     void* thisPtr;
//     int argc;
//     void* data;
//     void* thisTypeId;
//     JSValue res;
//     JSValue argv[0];
// };
// sizeof(JSValue) == 16
const callbackInfosCache = [];
function getNativeCallbackInfo(wasmApi, argc) {
    let callbackInfo = callbackInfosCache[argc];
    if (!callbackInfo) {
        // 4 + 4 + 4 + 4 + 16 + (argc * 16)
        const size = 32 + (argc * 16);
        callbackInfo = wasmApi._malloc(size);
        Buffer.writeInt32(wasmApi.HEAPU8, argc, callbackInfo + 4);
    }
    else {
        callbackInfosCache[argc] = undefined;
    }
    Buffer.writeInt32(wasmApi.HEAPU8, JSTag.JS_TAG_UNDEFINED, callbackInfo + 24); // set res to undefined
    return callbackInfo;
}
function returnNativeCallbackInfo(wasmApi, argc, callbackInfo) {
    if (callbackInfosCache[argc]) {
        wasmApi._free(callbackInfo);
    }
    else {
        callbackInfosCache[argc] = callbackInfo;
    }
}
// TODO: 先简单分配由wasm那释放，后续再优化
function getBuffer(wasmApi, size) {
    return wasmApi._malloc(size);
}
function jsValueToPapiValue(wasmApi, arg, value) {
    let heap = wasmApi.HEAPU8;
    const dataPtr = value;
    const tagPtr = dataPtr + 8;
    if (arg === undefined) {
        Buffer.writeInt32(heap, JSTag.JS_TAG_UNDEFINED, tagPtr);
    }
    else if (arg === null) {
        Buffer.writeInt32(heap, JSTag.JS_TAG_NULL, tagPtr);
    }
    else if (typeof arg === 'bigint') {
        if (arg > 9223372036854775807n) {
            Buffer.writeUInt64(heap, arg, dataPtr);
            Buffer.writeInt32(heap, JSTag.JS_TAG_UINT64, tagPtr);
        }
        else {
            Buffer.writeInt64(heap, arg, dataPtr);
            Buffer.writeInt32(heap, JSTag.JS_TAG_INT64, tagPtr);
        }
    }
    else if (typeof arg === 'number') {
        if (Number.isInteger(arg)) {
            if (arg >= -2147483648 && arg <= 2147483647) {
                Buffer.writeInt32(heap, arg, dataPtr);
                Buffer.writeInt32(heap, JSTag.JS_TAG_INT, tagPtr);
            }
            else {
                Buffer.writeInt64(heap, arg, dataPtr);
                Buffer.writeInt32(heap, JSTag.JS_TAG_INT64, tagPtr);
            }
        }
        else {
            Buffer.writeDouble(heap, arg, dataPtr);
            Buffer.writeInt32(heap, JSTag.JS_TAG_FLOAT64, tagPtr);
        }
    }
    else if (typeof arg === 'string') {
        const len = wasmApi.lengthBytesUTF16(arg);
        const ptr = getBuffer(wasmApi, len + 2);
        wasmApi.stringToUTF16(arg, ptr, len + 2);
        heap = wasmApi.HEAPU8; // getBuffer会申请内存，可能导致HEAPU8改变
        Buffer.writeInt32(heap, ptr, dataPtr);
        Buffer.writeInt32(heap, arg.length, dataPtr + 4);
        Buffer.writeInt32(heap, JSTag.JS_TAG_STRING16, tagPtr);
        Buffer.writeInt32(heap, 1, tagPtr + 4); // need_free = true
    }
    else if (typeof arg === 'boolean') {
        Buffer.writeInt32(heap, arg ? 1 : 0, dataPtr);
        Buffer.writeInt32(heap, JSTag.JS_TAG_BOOL, tagPtr);
    }
    else if (typeof arg === 'function') {
        Buffer.writeInt32(heap, Scope.getCurrent().addToScope(arg), dataPtr);
        Buffer.writeInt32(heap, JSTag.JS_TAG_FUNCTION, tagPtr);
    }
    else if (arg instanceof Array) {
        Buffer.writeInt32(heap, Scope.getCurrent().addToScope(arg), dataPtr);
        Buffer.writeInt32(heap, JSTag.JS_TAG_ARRAY, tagPtr);
    }
    else if (arg instanceof ArrayBuffer || arg instanceof Uint8Array) {
        const len = arg.byteLength;
        const ptr = getBuffer(wasmApi, len);
        wasmApi.HEAP8.set(new Int8Array(arg), ptr);
        heap = wasmApi.HEAPU8; // getBuffer会申请内存，可能导致HEAPU8改变
        Buffer.writeInt32(heap, ptr, dataPtr);
        Buffer.writeInt32(heap, len, dataPtr + 4);
        Buffer.writeInt32(heap, JSTag.JS_TAG_BUFFER, tagPtr);
        Buffer.writeInt32(heap, 1, tagPtr + 4); // need_free = true
    }
    else if (typeof arg === 'object') {
        const ntoInfo = ObjectPool.GetNativeInfoOfObject(arg);
        if (ntoInfo) {
            const [objId, typeId] = ntoInfo;
            Buffer.writeInt32(heap, objId, dataPtr);
            Buffer.writeInt32(heap, typeId, dataPtr + 4);
            Buffer.writeInt32(heap, JSTag.JS_TAG_NATIVE_OBJECT, tagPtr);
        }
        else {
            Buffer.writeInt32(heap, Scope.getCurrent().addToScope(arg), dataPtr);
            Buffer.writeInt32(heap, JSTag.JS_TAG_OBJECT, tagPtr);
        }
    }
    else {
        throw new Error(`Unexpected argument type: ${typeof arg}`);
    }
}
function jsArgsToCallbackInfo(wasmApi, argc, args) {
    const callbackInfo = getNativeCallbackInfo(wasmApi, argc);
    for (let i = 0; i < argc; ++i) {
        const arg = args[i];
        jsValueToPapiValue(wasmApi, arg, callbackInfo + 32 + (i * 16));
    }
    return callbackInfo;
}
function genJsCallback(wasmApi, callback, data, papi, isStatic) {
    return function (...args) {
        if (new.target) {
            throw new Error('"not a constructor');
        }
        let callbackInfo = undefined;
        const argc = args.length;
        const scope = Scope.enter();
        try {
            callbackInfo = jsArgsToCallbackInfo(wasmApi, argc, args);
            const heap = wasmApi.HEAPU8; //在PApiCallbackWithScope前都不会变化，这样用是安全的
            Buffer.writeInt32(heap, data, callbackInfo + 8); // data
            let objId = 0;
            let typeId = 0;
            if (!isStatic && this) {
                const ntoInfo = ObjectPool.GetNativeInfoOfObject(this);
                if (ntoInfo)
                    [objId, typeId] = ntoInfo;
            }
            Buffer.writeInt32(heap, objId, callbackInfo); // thisPtr
            Buffer.writeInt32(heap, typeId, callbackInfo + 12); // thisTypeId
            wasmApi.PApiCallbackWithScope(callback, papi, callbackInfo); // 预期wasm只会通过throw_by_string抛异常，不产生直接js异常
            if (hasException) {
                throw getAndClearLastException();
            }
            return Scope.getCurrent().toJs(wasmApi, objMapper, callbackInfo + 16, true);
        }
        finally {
            returnNativeCallbackInfo(wasmApi, argc, callbackInfo);
            scope.close(wasmApi);
        }
    };
}
// 需要在Unity里调用PlayerSettings.WebGL.emscriptenArgs = " -s ALLOW_TABLE_GROWTH=1";
function WebGLFFIApi(engine) {
    wasmApi = engine.unityApi;
    objMapper = new ObjectMapper();
    function pesapi_create_array(env) {
        return Scope.getCurrent().addToScope([]);
    }
    function pesapi_create_object(env) {
        return Scope.getCurrent().addToScope(Object.create(null));
    }
    function pesapi_create_function(env, native_impl, data, finalize // TODO: gc时调用finalize
    ) {
        const jsCallback = genJsCallback(engine.unityApi, native_impl, data, webglFFI, false);
        return Scope.getCurrent().addToScope(jsCallback);
    }
    function pesapi_create_class(env, typeId) {
        const cls = ClassRegister.getInstance().loadClassById(typeId);
        if (typeof cls === 'function') {
            //console.log(`create class: ${cls.name}`);
            return Scope.getCurrent().addToScope(cls);
        }
        throw new Error("can't load class by type id: " + typeId);
    }
    function pesapi_get_array_length(env, pvalue) {
        const array = Scope.getCurrent().getFromScope(pvalue);
        if (!Array.isArray(array)) {
            throw new Error("pesapi_get_array_length: value is not an array");
        }
        return array.length;
    }
    function pesapi_native_object_to_value(env, typeId, object_ptr, call_finalize) {
        const jsObj = objMapper.pushNativeObject(object_ptr, typeId, call_finalize);
        // TODO: just for test
        //const cls = ClassRegister.getInstance().findClassById(typeId);
        //if (cls.name == "JsEnv") {
        //    console.log(`call FileExists(aabb.txt): ${(jsObj as any).loader.FileExists("aabb.txt")}`);
        //    console.log(`call FileExists(puerts/esm_bootstrap.cjs): ${(jsObj as any).loader.FileExists("puerts/esm_bootstrap.cjs")}`);
        //}
        return object_ptr;
    }
    function pesapi_throw_by_string(pinfo, pmsg) {
        const msg = engine.unityApi.UTF8ToString(pmsg);
        setLastException(new Error(msg));
    }
    // --------------- 作用域管理 ---------------
    function pesapi_open_scope(penv_ref) {
        Scope.enter();
        return null;
    }
    function pesapi_open_scope_placement(penv_ref, memory) {
        Scope.enter();
        return null;
    }
    function pesapi_has_caught(pscope) {
        return hasException;
    }
    function pesapi_get_exception_as_string(pscope, with_stack) {
        return getExceptionAsNativeString(engine.unityApi, with_stack);
    }
    function pesapi_close_scope(pscope) {
        Scope.exit(engine.unityApi);
    }
    function pesapi_close_scope_placement(pscope) {
        Scope.exit(engine.unityApi);
    }
    const referencedValues = new SparseArray();
    function pesapi_create_value_ref(env, pvalue, internal_field_count) {
        const value = Scope.getCurrent().toJs(engine.unityApi, objMapper, pvalue);
        return referencedValues.add(value);
    }
    function pesapi_release_value_ref(pvalue_ref) {
        referencedValues.remove(pvalue_ref);
    }
    function pesapi_get_value_from_ref(env, pvalue_ref, pvalue) {
        const value = referencedValues.get(pvalue_ref);
        jsValueToPapiValue(engine.unityApi, value, pvalue);
    }
    function pesapi_get_property(env, pobject, pkey, pvalue) {
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_get_property: target is not an object");
        }
        const key = engine.unityApi.UTF8ToString(pkey);
        const value = obj[key];
        jsValueToPapiValue(engine.unityApi, value, pvalue);
    }
    function pesapi_set_property(env, pobject, pkey, pvalue) {
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_set_property: target is not an object");
        }
        const key = engine.unityApi.UTF8ToString(pkey);
        const value = Scope.getCurrent().toJs(engine.unityApi, objMapper, pvalue);
        obj[key] = value;
    }
    function pesapi_get_private(env, pobject, out_ptr) {
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object' && typeof obj != 'function') {
            Buffer.writeInt32(engine.unityApi.HEAPU8, 0, out_ptr);
            return false;
        }
        Buffer.writeInt32(engine.unityApi.HEAPU8, obj['__p_private_data'], out_ptr);
        return true;
    }
    function pesapi_set_private(env, pobject, ptr) {
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object' && typeof obj != 'function') {
            return false;
        }
        obj['__p_private_data'] = ptr;
        return true;
    }
    function pesapi_get_property_uint32(env, pobject, key, pvalue) {
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_get_property_uint32: target is not an object");
        }
        const value = obj[key];
        jsValueToPapiValue(engine.unityApi, value, pvalue);
    }
    function pesapi_set_property_uint32(env, pobject, key, pvalue) {
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_set_property_uint32: target is not an object");
        }
        const value = Scope.getCurrent().toJs(engine.unityApi, objMapper, pvalue);
        obj[key] = value;
    }
    // --------------- 函数调用/执行 ---------------
    function pesapi_call_function(env, pfunc, this_object, argc, argv, presult) {
        const func = Scope.getCurrent().toJs(engine.unityApi, objMapper, pfunc);
        const self = Scope.getCurrent().toJs(engine.unityApi, objMapper, this_object);
        if (typeof func != 'function') {
            throw new Error("pesapi_call_function: target is not a function");
        }
        const heap = engine.unityApi.HEAPU8;
        const args = [];
        for (let i = 0; i < argc; ++i) {
            const argPtr = Buffer.readInt32(heap, argv + i * 4);
            args.push(Scope.getCurrent().toJs(engine.unityApi, objMapper, argPtr));
        }
        try {
            const result = func.apply(self, args);
            jsValueToPapiValue(engine.unityApi, result, presult);
        }
        catch (e) {
            setLastException(e);
        }
    }
    // 和pesapi.h声明不一样，这改为返回值指针由调用者（原生）传入
    function pesapi_eval(env, pcode, code_size, path, presult) {
        try {
            if (!globalThis.eval) {
                throw new Error("eval is not supported"); // TODO: 抛给wasm更合适些
            }
            const code = engine.unityApi.UTF8ToString(pcode, code_size);
            const result = globalThis.eval(code);
            jsValueToPapiValue(engine.unityApi, result, presult);
        }
        catch (e) {
            setLastException(e);
        }
    }
    function pesapi_global(env) {
        return Scope.getCurrent().addToScope(globalThis);
    }
    function pesapi_set_env_private(env, ptr) {
        objMapper.setEnvPrivate(ptr);
    }
    function pesapi_trace_native_object_lifecycle(env, onEnter, onExit) {
        const enterCallback = engine.unityApi.getWasmTableEntry(onEnter);
        const exitCallback = engine.unityApi.getWasmTableEntry(onExit);
        objMapper.traceNativeObject(enterCallback, exitCallback);
    }
    function pesapi_set_registry(env, registry_) {
        registry = registry_;
    }
    function TranToString(pvalue) {
        const value = Scope.getCurrent().toJs(engine.unityApi, objMapper, pvalue);
        const str = value.toString();
        jsValueToPapiValue(engine.unityApi, str, pvalue);
    }
    return {
        GetWebGLFFIApi: GetWebGLFFIApi,
        GetWebGLPapiVersion: GetWebGLPapiVersion,
        CreateWebGLPapiEnvRef: CreateWebGLPapiEnvRef,
        TranToString: TranToString,
        pesapi_create_array_js: pesapi_create_array,
        pesapi_create_object_js: pesapi_create_object,
        pesapi_create_function_js: pesapi_create_function,
        pesapi_create_class_js: pesapi_create_class,
        pesapi_get_array_length_js: pesapi_get_array_length,
        pesapi_native_object_to_value_js: pesapi_native_object_to_value,
        pesapi_throw_by_string_js: pesapi_throw_by_string,
        pesapi_open_scope_placement_js: pesapi_open_scope_placement,
        pesapi_has_caught_js: pesapi_has_caught,
        pesapi_get_exception_as_string_js: pesapi_get_exception_as_string,
        pesapi_close_scope_placement_js: pesapi_close_scope_placement,
        pesapi_create_value_ref_js: pesapi_create_value_ref,
        pesapi_release_value_ref_js: pesapi_release_value_ref,
        pesapi_get_value_from_ref_js: pesapi_get_value_from_ref,
        pesapi_get_property_js: pesapi_get_property,
        pesapi_set_property_js: pesapi_set_property,
        pesapi_get_private_js: pesapi_get_private,
        pesapi_set_private_js: pesapi_set_private,
        pesapi_get_property_uint32_js: pesapi_get_property_uint32,
        pesapi_set_property_uint32_js: pesapi_set_property_uint32,
        pesapi_call_function_js: pesapi_call_function,
        pesapi_eval_js: pesapi_eval,
        pesapi_global_js: pesapi_global,
        pesapi_set_env_private_js: pesapi_set_env_private,
        pesapi_trace_native_object_lifecycle_js: pesapi_trace_native_object_lifecycle,
        pesapi_set_registry_js: pesapi_set_registry
    };
}
exports.WebGLFFIApi = WebGLFFIApi;
function GetWebGLFFIApi() {
    if (webglFFI)
        return webglFFI;
    webglFFI = wasmApi.InjectPapiGLNativeImpl();
    return webglFFI;
}
function GetWebGLPapiVersion() {
    return 11;
}
function CreateWebGLPapiEnvRef() {
    return 2048; // just not nullptr
}
//# sourceMappingURL=pesapiImpl.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*************************!*\
  !*** ./output/index.js ***!
  \*************************/

/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * 根据 https://docs.unity3d.com/2018.4/Documentation/Manual/webgl-interactingwithbrowserscripting.html
 * 我们的目的就是在WebGL模式下，实现和puerts.dll的效果。具体在于实现一个jslib，里面应包含PuertsDLL.cs的所有接口
 * 实验发现这个jslib虽然也是运行在v8的js，但对devtool调试并不友好，且只支持到es5。
 * 因此应该通过一个独立的js实现接口，puerts.jslib通过全局的方式调用它。
 *
 * 最终形成如下架构
 * 业务JS <-> WASM <-> unity jslib <-> 本js
 * 但整条链路其实都在一个v8(jscore)虚拟机里
 */
const library_1 = __webpack_require__(/*! ./library */ "./output/library.js");
const pesapiImpl_1 = __webpack_require__(/*! ./pesapiImpl */ "./output/pesapiImpl.js");
library_1.global.wxRequire = library_1.global.require;
library_1.global.PuertsWebGL = {
    inited: false,
    debug: false,
    // puerts首次初始化时会调用这里，并把Unity的通信接口传入
    Init(ctorParam) {
        const engine = new library_1.PuertsJSEngine(ctorParam);
        const executeModuleCache = {};
        let jsEngineReturned = false;
        let loader;
        // PuertsDLL的所有接口实现
        library_1.global.PuertsWebGL = Object.assign(library_1.global.PuertsWebGL, {
            updateGlobalBufferAndViews: engine.updateGlobalBufferAndViews.bind(engine)
        }, (0, pesapiImpl_1.WebGLFFIApi)(engine), {
            // bridgeLog: true,
            LowMemoryNotification: function (isolate) { },
            IdleNotificationDeadline: function (isolate) { },
            RequestMinorGarbageCollectionForTesting: function (isolate) { },
            RequestFullGarbageCollectionForTesting: function (isolate) { },
            ClearModuleCache: function () { },
            CreateInspector: function (isolate, port) { },
            DestroyInspector: function (isolate) { },
            InspectorTick: function (isolate) { },
            LogicTick: function (isolate) { },
            SetLogCallback: function (log, logWarning, logError) {
            },
            GetJSStackTrace: function (isolate) {
                return new Error().stack;
            },
            GetWebGLPapiEnvRef: function () {
                return 2048; // just not nullptr
            }
        });
    }
};
//# sourceMappingURL=index.js.map
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVlcnRzLXJ1bnRpbWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGlCQUFpQixHQUFHLGdCQUFnQjtBQUM3WjtBQUNBO0FBQ0EsMkJBQTJCLE1BQU0sMkJBQTJCLE1BQU07QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixrQkFBa0IsNkJBQTZCLE1BQU07QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsa0JBQWtCLGFBQWEsY0FBYyxTQUFTLFFBQVEsVUFBVSxNQUFNO0FBQ3JHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsS0FBSyxTQUFTLEtBQUssVUFBVSxNQUFNO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25COzs7Ozs7Ozs7O0FDelNhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELHNCQUFzQixHQUFHLGNBQWM7QUFDdkMsY0FBYyxHQUFHLHFCQUFNLEdBQUcscUJBQU07QUFDaEMscUJBQU0sVUFBVSxxQkFBTTtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQiw4NkJBQTg2QjtBQUM5N0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTSwyREFBMkQ7QUFDekUsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCOzs7Ozs7Ozs7O0FDdkdhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQjtBQUNuQixlQUFlLG1CQUFPLENBQUMsb0NBQVU7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0ZBQStGLEtBQUs7QUFDcEc7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsc0JBQXNCO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDLElBQUksSUFBSSxNQUFNO0FBQ25EO0FBQ0E7QUFDQSx3QkFBd0IsY0FBYztBQUN0QztBQUNBO0FBQ0E7QUFDQSxxREFBcUQsVUFBVSxLQUFLLE9BQU87QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWtDLFFBQVE7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNEO0FBQ3REO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBFQUEwRTtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBFQUEwRTtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBFQUEwRTtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkMsUUFBUTtBQUNyRDtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkVBQTJFO0FBQzNFLHFHQUFxRztBQUNyRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRCxhQUFhO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsTUFBTSxFQUFFLFVBQVU7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDLE1BQU0sRUFBRSxVQUFVO0FBQ3pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxNQUFNLEVBQUUsVUFBVTtBQUN6RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsTUFBTSxFQUFFLFVBQVU7QUFDekQ7QUFDQTtBQUNBO0FBQ0EsOENBQThDLE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWTtBQUM1RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0IsdUJBQXVCO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbURBQW1ELE1BQU07QUFDekQ7QUFDQSxnQkFBZ0IsaUNBQWlDO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtGQUFrRjtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0I7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdEO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0I7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdEO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFEQUFxRCxXQUFXO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLFVBQVU7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUNBQXlDO0FBQ3pDLDZEQUE2RDtBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUseUVBQXlFO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsU0FBUztBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdEQUF3RCw2Q0FBNkM7QUFDckcsd0VBQXdFLDZEQUE2RDtBQUNySTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixVQUFVO0FBQ2xDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRDtBQUMxRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBOzs7Ozs7VUM1Z0NBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsR0FBRztXQUNIO1dBQ0E7V0FDQSxDQUFDOzs7Ozs7Ozs7OztBQ1BZO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLG1CQUFPLENBQUMsc0NBQVc7QUFDckMscUJBQXFCLG1CQUFPLENBQUMsNENBQWM7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSx5REFBeUQ7QUFDekQsNERBQTREO0FBQzVELDJFQUEyRTtBQUMzRSwwRUFBMEU7QUFDMUUsNkNBQTZDO0FBQzdDLHlEQUF5RDtBQUN6RCxvREFBb0Q7QUFDcEQsaURBQWlEO0FBQ2pELDZDQUE2QztBQUM3QztBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxpQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL291dHB1dC9idWZmZXIuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2xpYnJhcnkuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L3Blc2FwaUltcGwuanMiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovLy8uL291dHB1dC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuLypcclxuKiBUZW5jZW50IGlzIHBsZWFzZWQgdG8gc3VwcG9ydCB0aGUgb3BlbiBzb3VyY2UgY29tbXVuaXR5IGJ5IG1ha2luZyBQdWVydHMgYXZhaWxhYmxlLlxyXG4qIENvcHlyaWdodCAoQykgMjAyMCBUZW5jZW50LiAgQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKiBQdWVydHMgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRCAzLUNsYXVzZSBMaWNlbnNlLCBleGNlcHQgZm9yIHRoZSB0aGlyZC1wYXJ0eSBjb21wb25lbnRzIGxpc3RlZCBpbiB0aGUgZmlsZSAnTElDRU5TRScgd2hpY2ggbWF5IGJlIHN1YmplY3QgdG8gdGhlaXIgY29ycmVzcG9uZGluZyBsaWNlbnNlIHRlcm1zLlxyXG4qIFRoaXMgZmlsZSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBhbmQgY29uZGl0aW9ucyBkZWZpbmVkIGluIGZpbGUgJ0xJQ0VOU0UnLCB3aGljaCBpcyBwYXJ0IG9mIHRoaXMgc291cmNlIGNvZGUgcGFja2FnZS5cclxuKi9cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLndyaXRlRG91YmxlID0gZXhwb3J0cy53cml0ZUZsb2F0ID0gZXhwb3J0cy53cml0ZVVJbnQ2NCA9IGV4cG9ydHMud3JpdGVJbnQ2NCA9IGV4cG9ydHMud3JpdGVVSW50MzIgPSBleHBvcnRzLndyaXRlSW50MzIgPSBleHBvcnRzLndyaXRlVUludDE2ID0gZXhwb3J0cy53cml0ZUludDE2ID0gZXhwb3J0cy53cml0ZVVJbnQ4ID0gZXhwb3J0cy53cml0ZUludDggPSBleHBvcnRzLnJlYWREb3VibGUgPSBleHBvcnRzLnJlYWRGbG9hdCA9IGV4cG9ydHMucmVhZFVJbnQ2NCA9IGV4cG9ydHMucmVhZEludDY0ID0gZXhwb3J0cy5yZWFkVUludDMyID0gZXhwb3J0cy5yZWFkSW50MzIgPSBleHBvcnRzLnJlYWRVSW50MTYgPSBleHBvcnRzLnJlYWRJbnQxNiA9IGV4cG9ydHMucmVhZFVJbnQ4ID0gZXhwb3J0cy5yZWFkSW50OCA9IHZvaWQgMDtcclxuZnVuY3Rpb24gdmFsaWRhdGVOdW1iZXIodmFsdWUsIHR5cGUpIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3R5cGV9IGV4cGVjdHMgYSBudW1iZXIgYnV0IGdvdCAke3ZhbHVlfWApO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGJvdW5kc0Vycm9yKHZhbHVlLCBsZW5ndGgsIHR5cGUpIHtcclxuICAgIGlmIChNYXRoLmZsb29yKHZhbHVlKSAhPT0gdmFsdWUpIHtcclxuICAgICAgICB2YWxpZGF0ZU51bWJlcih2YWx1ZSwgdHlwZSB8fCAnb2Zmc2V0Jyk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3R5cGUgfHwgJ29mZnNldCd9IGV4cGVjdHMgYW4gaW50ZWdlciBidXQgZ290ICR7dmFsdWV9YCk7XHJcbiAgICB9XHJcbiAgICBpZiAobGVuZ3RoIDwgMCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm91dCBvZiBib3VuZFwiKTtcclxuICAgIH1cclxuICAgIHRocm93IG5ldyBFcnJvcihgJHt0eXBlIHx8ICdvZmZzZXQnfSBleHBlY3RzID49ICR7dHlwZSA/IDEgOiAwfSBhbmQgPD0gJHtsZW5ndGh9IGJ1dCBnb3QgJHt2YWx1ZX1gKTtcclxufVxyXG5mdW5jdGlvbiBjaGVja0JvdW5kcyhidWYsIG9mZnNldCwgYnl0ZUxlbmd0aCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBpZiAoYnVmW29mZnNldF0gPT09IHVuZGVmaW5lZCB8fCBidWZbb2Zmc2V0ICsgYnl0ZUxlbmd0aF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmLmxlbmd0aCAtIChieXRlTGVuZ3RoICsgMSkpO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHdyaXRlVV9JbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCwgbWluLCBtYXgpIHtcclxuICAgIHZhbHVlID0gK3ZhbHVlO1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHZhbHVlIGV4cGVjdHMgPj0gJHttaW59IGFuZCA8PSAke21heH0gYnV0IGdvdCAke3ZhbHVlfWApO1xyXG4gICAgfVxyXG4gICAgaWYgKGJ1ZltvZmZzZXRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1Zi5sZW5ndGggLSAxKTtcclxuICAgIH1cclxuICAgIGJ1ZltvZmZzZXRdID0gdmFsdWU7XHJcbiAgICByZXR1cm4gb2Zmc2V0ICsgMTtcclxufVxyXG5mdW5jdGlvbiByZWFkSW50OChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IHZhbCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSAxKTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWwgfCAodmFsICYgMiAqKiA3KSAqIDB4MWZmZmZmZTtcclxufVxyXG5leHBvcnRzLnJlYWRJbnQ4ID0gcmVhZEludDg7XHJcbmZ1bmN0aW9uIHdyaXRlSW50OChidWYsIHZhbHVlLCBvZmZzZXQgPSAwKSB7XHJcbiAgICByZXR1cm4gd3JpdGVVX0ludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0LCAtMHg4MCwgMHg3Zik7XHJcbn1cclxuZXhwb3J0cy53cml0ZUludDggPSB3cml0ZUludDg7XHJcbmZ1bmN0aW9uIHJlYWRVSW50OChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IHZhbCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSAxKTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWw7XHJcbn1cclxuZXhwb3J0cy5yZWFkVUludDggPSByZWFkVUludDg7XHJcbmZ1bmN0aW9uIHdyaXRlVUludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0ID0gMCkge1xyXG4gICAgcmV0dXJuIHdyaXRlVV9JbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCwgMCwgMHhmZik7XHJcbn1cclxuZXhwb3J0cy53cml0ZVVJbnQ4ID0gd3JpdGVVSW50ODtcclxuY29uc3QgaW50MTZBcnJheSA9IG5ldyBJbnQxNkFycmF5KDEpO1xyXG5jb25zdCB1SW50OEludDZBcnJheSA9IG5ldyBVaW50OEFycmF5KGludDE2QXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZEludDE2KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAxXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSAyKTtcclxuICAgIH1cclxuICAgIHVJbnQ4SW50NkFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1SW50OEludDZBcnJheVsxXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gaW50MTZBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRJbnQxNiA9IHJlYWRJbnQxNjtcclxuZnVuY3Rpb24gd3JpdGVJbnQxNihidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDEpO1xyXG4gICAgaW50MTZBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhJbnQ2QXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4SW50NkFycmF5WzFdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlSW50MTYgPSB3cml0ZUludDE2O1xyXG5jb25zdCB1aW50MTZBcnJheSA9IG5ldyBVaW50MTZBcnJheSgxKTtcclxuY29uc3QgdWludDhVaW50MTZBcnJheSA9IG5ldyBVaW50OEFycmF5KHVpbnQxNkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRVSW50MTYoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDFdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDIpO1xyXG4gICAgfVxyXG4gICAgdWludDhVaW50MTZBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhVaW50MTZBcnJheVsxXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gdWludDE2QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkVUludDE2ID0gcmVhZFVJbnQxNjtcclxuZnVuY3Rpb24gd3JpdGVVSW50MTYoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAxKTtcclxuICAgIHVpbnQxNkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQxNkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQxNkFycmF5WzFdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlVUludDE2ID0gd3JpdGVVSW50MTY7XHJcbmNvbnN0IGludDMyQXJyYXkgPSBuZXcgSW50MzJBcnJheSgxKTtcclxuY29uc3QgdWludDhJbnQzMkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoaW50MzJBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkSW50MzIoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDNdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDQpO1xyXG4gICAgfVxyXG4gICAgdWludDhJbnQzMkFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OEludDMyQXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4SW50MzJBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhJbnQzMkFycmF5WzNdID0gbGFzdDtcclxuICAgIHJldHVybiBpbnQzMkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZEludDMyID0gcmVhZEludDMyO1xyXG5mdW5jdGlvbiB3cml0ZUludDMyKGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMyk7XHJcbiAgICBpbnQzMkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEludDMyQXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4SW50MzJBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhJbnQzMkFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEludDMyQXJyYXlbM107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVJbnQzMiA9IHdyaXRlSW50MzI7XHJcbmNvbnN0IHVpbnQzMkFycmF5ID0gbmV3IFVpbnQzMkFycmF5KDEpO1xyXG5jb25zdCB1aW50OFVpbnQzMkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkodWludDMyQXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZFVJbnQzMihidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgM107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gNCk7XHJcbiAgICB9XHJcbiAgICB1aW50OFVpbnQzMkFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OFVpbnQzMkFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OFVpbnQzMkFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OFVpbnQzMkFycmF5WzNdID0gbGFzdDtcclxuICAgIHJldHVybiB1aW50MzJBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRVSW50MzIgPSByZWFkVUludDMyO1xyXG5mdW5jdGlvbiB3cml0ZVVJbnQzMihidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDMpO1xyXG4gICAgdWludDMyQXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDMyQXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDMyQXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDMyQXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDMyQXJyYXlbM107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVVSW50MzIgPSB3cml0ZVVJbnQzMjtcclxuY29uc3QgZmxvYXQzMkFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgxKTtcclxuY29uc3QgdUludDhGbG9hdDMyQXJyYXkgPSBuZXcgVWludDhBcnJheShmbG9hdDMyQXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZEZsb2F0KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAzXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA0KTtcclxuICAgIH1cclxuICAgIHVJbnQ4RmxvYXQzMkFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1SW50OEZsb2F0MzJBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDMyQXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQzMkFycmF5WzNdID0gbGFzdDtcclxuICAgIHJldHVybiBmbG9hdDMyQXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkRmxvYXQgPSByZWFkRmxvYXQ7XHJcbmZ1bmN0aW9uIHdyaXRlRmxvYXQoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAzKTtcclxuICAgIGZsb2F0MzJBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDMyQXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQzMkFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0MzJBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDMyQXJyYXlbM107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVGbG9hdCA9IHdyaXRlRmxvYXQ7XHJcbmNvbnN0IGZsb2F0NjRBcnJheSA9IG5ldyBGbG9hdDY0QXJyYXkoMSk7XHJcbmNvbnN0IHVJbnQ4RmxvYXQ2NEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoZmxvYXQ2NEFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWREb3VibGUoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyA3XTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA4KTtcclxuICAgIH1cclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzNdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVs0XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbNV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzZdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVs3XSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gZmxvYXQ2NEFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZERvdWJsZSA9IHJlYWREb3VibGU7XHJcbmZ1bmN0aW9uIHdyaXRlRG91YmxlKGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgNyk7XHJcbiAgICBmbG9hdDY0QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzNdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVs0XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbNV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzZdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVs3XTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZURvdWJsZSA9IHdyaXRlRG91YmxlO1xyXG5jb25zdCBiaWdJbnQ2NEFycmF5ID0gbmV3IEJpZ0ludDY0QXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4QmlnSW50NjRBcnJheSA9IG5ldyBVaW50OEFycmF5KGJpZ0ludDY0QXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZEludDY0KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgN107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gOCk7XHJcbiAgICB9XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbM10gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVs0XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzVdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbNl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVs3XSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gYmlnSW50NjRBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRJbnQ2NCA9IHJlYWRJbnQ2NDtcclxuZnVuY3Rpb24gd3JpdGVJbnQ2NChidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9IHR5cGVvZiB2YWwgPT09ICdudW1iZXInID8gQmlnSW50KHZhbCkgOiB2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDcpO1xyXG4gICAgYmlnSW50NjRBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzNdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbNF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVs1XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzZdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbN107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVJbnQ2NCA9IHdyaXRlSW50NjQ7XHJcbmNvbnN0IGJpZ1VpbnQ2NEFycmF5ID0gbmV3IEJpZ1VpbnQ2NEFycmF5KDEpO1xyXG5jb25zdCB1aW50OEJpZ1VpbnQ2NEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYmlnVWludDY0QXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZFVJbnQ2NChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDddO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDgpO1xyXG4gICAgfVxyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVszXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVs0XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVs1XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVs2XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVs3XSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gYmlnVWludDY0QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkVUludDY0ID0gcmVhZFVJbnQ2NDtcclxuZnVuY3Rpb24gd3JpdGVVSW50NjQoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSB0eXBlb2YgdmFsID09PSAnbnVtYmVyJyA/IEJpZ0ludCh2YWwpIDogdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCA3KTtcclxuICAgIGJpZ1VpbnQ2NEFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzNdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzRdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzVdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzZdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzddO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlVUludDY0ID0gd3JpdGVVSW50NjQ7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJ1ZmZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuLypcclxuKiBUZW5jZW50IGlzIHBsZWFzZWQgdG8gc3VwcG9ydCB0aGUgb3BlbiBzb3VyY2UgY29tbXVuaXR5IGJ5IG1ha2luZyBQdWVydHMgYXZhaWxhYmxlLlxyXG4qIENvcHlyaWdodCAoQykgMjAyMCBUZW5jZW50LiAgQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKiBQdWVydHMgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRCAzLUNsYXVzZSBMaWNlbnNlLCBleGNlcHQgZm9yIHRoZSB0aGlyZC1wYXJ0eSBjb21wb25lbnRzIGxpc3RlZCBpbiB0aGUgZmlsZSAnTElDRU5TRScgd2hpY2ggbWF5IGJlIHN1YmplY3QgdG8gdGhlaXIgY29ycmVzcG9uZGluZyBsaWNlbnNlIHRlcm1zLlxyXG4qIFRoaXMgZmlsZSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBhbmQgY29uZGl0aW9ucyBkZWZpbmVkIGluIGZpbGUgJ0xJQ0VOU0UnLCB3aGljaCBpcyBwYXJ0IG9mIHRoaXMgc291cmNlIGNvZGUgcGFja2FnZS5cclxuKi9cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gZXhwb3J0cy5nbG9iYWwgPSB2b2lkIDA7XHJcbmV4cG9ydHMuZ2xvYmFsID0gZ2xvYmFsID0gZ2xvYmFsIHx8IGdsb2JhbFRoaXMgfHwgd2luZG93O1xyXG5nbG9iYWwuZ2xvYmFsID0gZ2xvYmFsO1xyXG5jbGFzcyBQdWVydHNKU0VuZ2luZSB7XHJcbiAgICB1bml0eUFwaTtcclxuICAgIGxhc3RFeGNlcHRpb24gPSBudWxsO1xyXG4gICAgY29uc3RydWN0b3IoY3RvclBhcmFtKSB7XHJcbiAgICAgICAgY29uc3QgeyBVVEY4VG9TdHJpbmcsIFVURjE2VG9TdHJpbmcsIF9tYWxsb2MsIF9mcmVlLCBfc2V0VGVtcFJldDAsIHN0cmluZ1RvVVRGOCwgbGVuZ3RoQnl0ZXNVVEY4LCBzdHJpbmdUb1VURjE2LCBsZW5ndGhCeXRlc1VURjE2LCBzdGFja1NhdmUsIHN0YWNrUmVzdG9yZSwgc3RhY2tBbGxvYywgZ2V0V2FzbVRhYmxlRW50cnksIGFkZEZ1bmN0aW9uLCByZW1vdmVGdW5jdGlvbiwgX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrLCBfQ2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2ssIF9DYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrLCBJbmplY3RQYXBpR0xOYXRpdmVJbXBsLCBQQXBpQ2FsbGJhY2tXaXRoU2NvcGUsIFBBcGlDb25zdHJ1Y3RvcldpdGhTY29wZSwgZmluZF9jbGFzc19ieV9pZCwgbG9hZF9jbGFzc19ieV9pZCwgZ2V0X2NsYXNzX25hbWUsIGdldF9jbGFzc19pbml0aWFsaXplLCBnZXRfY2xhc3NfZmluYWxpemUsIGdldF9jbGFzc190eXBlX2lkLCBnZXRfY2xhc3Nfc3VwZXJfdHlwZV9pZCwgZ2V0X2NsYXNzX21ldGhvZHMsIGdldF9jbGFzc19mdW5jdGlvbnMsIGdldF9jbGFzc19wcm9wZXJ0aWVzLCBnZXRfY2xhc3NfdmFyaWFibGVzLCBnZXRfbmV4dF9wcm9wZXJ0eV9pbmZvLCBnZXRfbmV4dF9mdW5jdGlvbl9pbmZvLCBnZXRfcHJvcGVydHlfaW5mb19uYW1lLCBnZXRfcHJvcGVydHlfaW5mb19nZXR0ZXIsIGdldF9wcm9wZXJ0eV9pbmZvX3NldHRlciwgZ2V0X2Z1bmN0aW9uX2luZm9fbmFtZSwgZ2V0X2Z1bmN0aW9uX2luZm9fY2FsbGJhY2ssIGdldF9jbGFzc19kYXRhLCBnZXRfY2xhc3NfdHJhY2VfbGlmZWN5Y2xlLCBnZXRfcHJvcGVydHlfaW5mb19nZXR0ZXJfZGF0YSwgZ2V0X3Byb3BlcnR5X2luZm9fc2V0dGVyX2RhdGEsIGdldF9mdW5jdGlvbl9pbmZvX2RhdGEsIEhFQVA4LCBIRUFQVTgsIEhFQVAzMiwgSEVBUEYzMiwgSEVBUEY2NCwgfSA9IGN0b3JQYXJhbTtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpID0ge1xyXG4gICAgICAgICAgICBVVEY4VG9TdHJpbmcsXHJcbiAgICAgICAgICAgIFVURjE2VG9TdHJpbmcsXHJcbiAgICAgICAgICAgIF9tYWxsb2MsXHJcbiAgICAgICAgICAgIF9mcmVlLFxyXG4gICAgICAgICAgICBfc2V0VGVtcFJldDAsXHJcbiAgICAgICAgICAgIHN0cmluZ1RvVVRGOCxcclxuICAgICAgICAgICAgbGVuZ3RoQnl0ZXNVVEY4LFxyXG4gICAgICAgICAgICBzdHJpbmdUb1VURjE2LFxyXG4gICAgICAgICAgICBsZW5ndGhCeXRlc1VURjE2LFxyXG4gICAgICAgICAgICBzdGFja1NhdmUsXHJcbiAgICAgICAgICAgIHN0YWNrUmVzdG9yZSxcclxuICAgICAgICAgICAgc3RhY2tBbGxvYyxcclxuICAgICAgICAgICAgZ2V0V2FzbVRhYmxlRW50cnksXHJcbiAgICAgICAgICAgIGFkZEZ1bmN0aW9uLFxyXG4gICAgICAgICAgICByZW1vdmVGdW5jdGlvbixcclxuICAgICAgICAgICAgX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrLFxyXG4gICAgICAgICAgICBfQ2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIF9DYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrLFxyXG4gICAgICAgICAgICBJbmplY3RQYXBpR0xOYXRpdmVJbXBsLFxyXG4gICAgICAgICAgICBQQXBpQ2FsbGJhY2tXaXRoU2NvcGUsXHJcbiAgICAgICAgICAgIFBBcGlDb25zdHJ1Y3RvcldpdGhTY29wZSxcclxuICAgICAgICAgICAgZmluZF9jbGFzc19ieV9pZCxcclxuICAgICAgICAgICAgbG9hZF9jbGFzc19ieV9pZCxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX25hbWUsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc19pbml0aWFsaXplLFxyXG4gICAgICAgICAgICBnZXRfY2xhc3NfZmluYWxpemUsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc190eXBlX2lkLFxyXG4gICAgICAgICAgICBnZXRfY2xhc3Nfc3VwZXJfdHlwZV9pZCxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX21ldGhvZHMsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc19mdW5jdGlvbnMsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc19wcm9wZXJ0aWVzLFxyXG4gICAgICAgICAgICBnZXRfY2xhc3NfdmFyaWFibGVzLFxyXG4gICAgICAgICAgICBnZXRfbmV4dF9wcm9wZXJ0eV9pbmZvLFxyXG4gICAgICAgICAgICBnZXRfbmV4dF9mdW5jdGlvbl9pbmZvLFxyXG4gICAgICAgICAgICBnZXRfcHJvcGVydHlfaW5mb19uYW1lLFxyXG4gICAgICAgICAgICBnZXRfcHJvcGVydHlfaW5mb19nZXR0ZXIsXHJcbiAgICAgICAgICAgIGdldF9wcm9wZXJ0eV9pbmZvX3NldHRlcixcclxuICAgICAgICAgICAgZ2V0X2Z1bmN0aW9uX2luZm9fbmFtZSxcclxuICAgICAgICAgICAgZ2V0X2Z1bmN0aW9uX2luZm9fY2FsbGJhY2ssXHJcbiAgICAgICAgICAgIGdldF9jbGFzc19kYXRhLFxyXG4gICAgICAgICAgICBnZXRfY2xhc3NfdHJhY2VfbGlmZWN5Y2xlLFxyXG4gICAgICAgICAgICBnZXRfcHJvcGVydHlfaW5mb19nZXR0ZXJfZGF0YSxcclxuICAgICAgICAgICAgZ2V0X3Byb3BlcnR5X2luZm9fc2V0dGVyX2RhdGEsXHJcbiAgICAgICAgICAgIGdldF9mdW5jdGlvbl9pbmZvX2RhdGEsXHJcbiAgICAgICAgICAgIEhFQVA4LFxyXG4gICAgICAgICAgICBIRUFQVTgsXHJcbiAgICAgICAgICAgIEhFQVAzMixcclxuICAgICAgICAgICAgSEVBUEYzMixcclxuICAgICAgICAgICAgSEVBUEY2NCxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGdsb2JhbC5fX3RnanNFdmFsU2NyaXB0ID0gdHlwZW9mIGV2YWwgPT0gXCJ1bmRlZmluZWRcIiA/ICgpID0+IHsgfSA6IGV2YWw7XHJcbiAgICAgICAgZ2xvYmFsLl9fdGdqc1NldFByb21pc2VSZWplY3RDYWxsYmFjayA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICB3eC5vblVuaGFuZGxlZFJlamVjdGlvbihjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVuaGFuZGxlZHJlamVjdGlvblwiLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIGdsb2JhbC5fX3B1ZXJ0c0dldExhc3RFeGNlcHRpb24gPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhc3RFeGNlcHRpb247XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIC8qKiBjYWxsIHdoZW4gd2FzbSBncm93IG1lbW9yeSAqL1xyXG4gICAgdXBkYXRlR2xvYmFsQnVmZmVyQW5kVmlld3MoSEVBUDgsIEhFQVBVOCwgSEVBUDMyLCBIRUFQRjMyLCBIRUFQRjY0KSB7XHJcbiAgICAgICAgbGV0IHVuaXR5QXBpID0gdGhpcy51bml0eUFwaTtcclxuICAgICAgICB1bml0eUFwaS5IRUFQOCA9IEhFQVA4O1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVBVOCA9IEhFQVBVODtcclxuICAgICAgICB1bml0eUFwaS5IRUFQMzIgPSBIRUFQMzI7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUEYzMiA9IEhFQVBGMzI7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUEY2NCA9IEhFQVBGNjQ7XHJcbiAgICB9XHJcbiAgICBtZW1jcHkoZGVzdCwgc3JjLCBudW0pIHtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLkhFQVBVOC5jb3B5V2l0aGluKGRlc3QsIHNyYywgc3JjICsgbnVtKTtcclxuICAgIH1cclxuICAgIGNhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLl9DYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgc2VsZlB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxuICAgIGNhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51bml0eUFwaS5fQ2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbiAgICBjYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gUHVlcnRzSlNFbmdpbmU7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWxpYnJhcnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qXHJcbiogVGVuY2VudCBpcyBwbGVhc2VkIHRvIHN1cHBvcnQgdGhlIG9wZW4gc291cmNlIGNvbW11bml0eSBieSBtYWtpbmcgUHVlcnRzIGF2YWlsYWJsZS5cclxuKiBDb3B5cmlnaHQgKEMpIDIwMjAgVGVuY2VudC4gIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiogUHVlcnRzIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0QgMy1DbGF1c2UgTGljZW5zZSwgZXhjZXB0IGZvciB0aGUgdGhpcmQtcGFydHkgY29tcG9uZW50cyBsaXN0ZWQgaW4gdGhlIGZpbGUgJ0xJQ0VOU0UnIHdoaWNoIG1heSBiZSBzdWJqZWN0IHRvIHRoZWlyIGNvcnJlc3BvbmRpbmcgbGljZW5zZSB0ZXJtcy5cclxuKiBUaGlzIGZpbGUgaXMgc3ViamVjdCB0byB0aGUgdGVybXMgYW5kIGNvbmRpdGlvbnMgZGVmaW5lZCBpbiBmaWxlICdMSUNFTlNFJywgd2hpY2ggaXMgcGFydCBvZiB0aGlzIHNvdXJjZSBjb2RlIHBhY2thZ2UuXHJcbiovXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5XZWJHTEZGSUFwaSA9IHZvaWQgMDtcclxuY29uc3QgQnVmZmVyID0gcmVxdWlyZShcIi4vYnVmZmVyXCIpO1xyXG5sZXQgbG9hZGVyID0gbnVsbDtcclxubGV0IGxvYWRlclJlc29sdmUgPSBudWxsO1xyXG5jb25zdCBleGVjdXRlTW9kdWxlQ2FjaGUgPSB7fTtcclxuLyoqXHJcbiAqIFNwYXJzZSBBcnJheSBpbXBsZW1lbnRhdGlvbiB3aXRoIGVmZmljaWVudCBhZGQvcmVtb3ZlIG9wZXJhdGlvbnNcclxuICogLSBNYWludGFpbnMgY29udGlndW91cyBzdG9yYWdlXHJcbiAqIC0gUmV1c2VzIGVtcHR5IHNsb3RzIGZyb20gZGVsZXRpb25zXHJcbiAqIC0gTygxKSBhZGQvcmVtb3ZlIGluIG1vc3QgY2FzZXNcclxuICovXHJcbmNsYXNzIFNwYXJzZUFycmF5IHtcclxuICAgIF9kYXRhO1xyXG4gICAgX2ZyZWVJbmRpY2VzO1xyXG4gICAgX2xlbmd0aDtcclxuICAgIGNvbnN0cnVjdG9yKGNhcGFjaXR5ID0gMCkge1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSBuZXcgQXJyYXkoY2FwYWNpdHkpO1xyXG4gICAgICAgIHRoaXMuX2ZyZWVJbmRpY2VzID0gW107XHJcbiAgICAgICAgdGhpcy5fbGVuZ3RoID0gMDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQWRkIGFuIGVsZW1lbnQgdG8gdGhlIGFycmF5XHJcbiAgICAgKiBAcmV0dXJucyBUaGUgaW5kZXggd2hlcmUgdGhlIGVsZW1lbnQgd2FzIGluc2VydGVkXHJcbiAgICAgKi9cclxuICAgIGFkZChlbGVtZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZyZWVJbmRpY2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9mcmVlSW5kaWNlcy5wb3AoKTtcclxuICAgICAgICAgICAgdGhpcy5fZGF0YVtpbmRleF0gPSBlbGVtZW50O1xyXG4gICAgICAgICAgICB0aGlzLl9sZW5ndGgrKztcclxuICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xyXG4gICAgICAgIHRoaXMuX2RhdGEucHVzaChlbGVtZW50KTtcclxuICAgICAgICB0aGlzLl9sZW5ndGgrKztcclxuICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBhbiBlbGVtZW50IGJ5IGluZGV4XHJcbiAgICAgKiBAcmV0dXJucyB0cnVlIGlmIHJlbW92YWwgd2FzIHN1Y2Nlc3NmdWxcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlKGluZGV4KSB7XHJcbiAgICAgICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLl9kYXRhLmxlbmd0aCB8fCB0aGlzLl9kYXRhW2luZGV4XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fZGF0YVtpbmRleF0gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy5fZnJlZUluZGljZXMucHVzaChpbmRleCk7XHJcbiAgICAgICAgdGhpcy5fbGVuZ3RoLS07XHJcbiAgICAgICAgLy8gQ29tcGFjdCB0aGUgYXJyYXkgaWYgbGFzdCBlbGVtZW50IGlzIHJlbW92ZWRcclxuICAgICAgICBpZiAoaW5kZXggPT09IHRoaXMuX2RhdGEubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9jb21wYWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgZWxlbWVudCBieSBpbmRleFxyXG4gICAgICovXHJcbiAgICBnZXQoaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtpbmRleF07XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIEN1cnJlbnQgbnVtYmVyIG9mIGFjdGl2ZSBlbGVtZW50c1xyXG4gICAgICovXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9sZW5ndGg7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFRvdGFsIGNhcGFjaXR5IChpbmNsdWRpbmcgZW1wdHkgc2xvdHMpXHJcbiAgICAgKi9cclxuICAgIGdldCBjYXBhY2l0eSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIENvbXBhY3QgdGhlIGFycmF5IGJ5IHJlbW92aW5nIHRyYWlsaW5nIHVuZGVmaW5lZCBlbGVtZW50c1xyXG4gICAgICovXHJcbiAgICBfY29tcGFjdCgpIHtcclxuICAgICAgICBsZXQgbGFzdEluZGV4ID0gdGhpcy5fZGF0YS5sZW5ndGggLSAxO1xyXG4gICAgICAgIHdoaWxlIChsYXN0SW5kZXggPj0gMCAmJiB0aGlzLl9kYXRhW2xhc3RJbmRleF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9kYXRhLnBvcCgpO1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYW55IGZyZWUgaW5kaWNlcyBpbiB0aGUgY29tcGFjdGVkIGFyZWFcclxuICAgICAgICAgICAgY29uc3QgY29tcGFjdGVkSW5kZXggPSB0aGlzLl9mcmVlSW5kaWNlcy5pbmRleE9mKGxhc3RJbmRleCk7XHJcbiAgICAgICAgICAgIGlmIChjb21wYWN0ZWRJbmRleCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ZyZWVJbmRpY2VzLnNwbGljZShjb21wYWN0ZWRJbmRleCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGFzdEluZGV4LS07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIEV4ZWN1dGVNb2R1bGUoZmlsZU5hbWUpIHtcclxuICAgIGlmIChbJ3B1ZXJ0cy9sb2cubWpzJywgJ3B1ZXJ0cy90aW1lci5tanMnXS5pbmRleE9mKGZpbGVOYW1lKSAhPSAtMSkge1xyXG4gICAgICAgIHJldHVybiB7fTtcclxuICAgIH1cclxuICAgIGlmICghbG9hZGVyKSB7XHJcbiAgICAgICAgbG9hZGVyID0gZ2xvYmFsVGhpcy5zY3JpcHRFbnYuR2V0TG9hZGVyKCk7XHJcbiAgICAgICAgbG9hZGVyUmVzb2x2ZSA9IGxvYWRlci5SZXNvbHZlID8gKGZ1bmN0aW9uIChmaWxlTmFtZSwgdG8gPSBcIlwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkTmFtZSA9IGxvYWRlci5SZXNvbHZlKGZpbGVOYW1lLCB0byk7XHJcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZWROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBub3QgZm91bmQ6ICcgKyBmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkTmFtZTtcclxuICAgICAgICB9KSA6IG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAobG9hZGVyUmVzb2x2ZSkge1xyXG4gICAgICAgIGZpbGVOYW1lID0gbG9hZGVyUmVzb2x2ZShmaWxlTmFtZSwgXCJcIik7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gd3hSZXF1aXJlKCdwdWVydHNfbWluaWdhbWVfanNfcmVzb3VyY2VzLycgKyAoZmlsZU5hbWUuZW5kc1dpdGgoJy5qcycpID8gZmlsZU5hbWUgOiBmaWxlTmFtZSArIFwiLmpzXCIpKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplKG5hbWUsIHRvKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgQ1MgIT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuSXNSZWxhdGl2ZSh0bykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXQgPSBDUy5QdWVydHMuUGF0aEhlbHBlci5ub3JtYWxpemUoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuRGlybmFtZShuYW1lKSArIFwiL1wiICsgdG8pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRvO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtb2NrUmVxdWlyZShzcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBleHBvcnRzOiB7fSB9O1xyXG4gICAgICAgICAgICBjb25zdCBmb3VuZENhY2hlU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIGV4ZWN1dGVNb2R1bGVDYWNoZSk7XHJcbiAgICAgICAgICAgIGlmIChmb3VuZENhY2hlU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuZXhwb3J0cyA9IGV4ZWN1dGVNb2R1bGVDYWNoZVtmb3VuZENhY2hlU3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIFBVRVJUU19KU19SRVNPVVJDRVMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZFNwZWNpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIHNwZWNpZmllcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzcGVjaWZpZXIgPSBmb3VuZFNwZWNpZmllcjtcclxuICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gLTE7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIFBVRVJUU19KU19SRVNPVVJDRVNbc3BlY2lmaWVyXShyZXN1bHQuZXhwb3J0cywgZnVuY3Rpb24gbVJlcXVpcmUoc3BlY2lmaWVyVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vY2tSZXF1aXJlKGxvYWRlclJlc29sdmUgPyBsb2FkZXJSZXNvbHZlKHNwZWNpZmllclRvLCBzcGVjaWZpZXIpIDogbm9ybWFsaXplKHNwZWNpZmllciwgc3BlY2lmaWVyVG8pKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gcmVzdWx0LmV4cG9ydHM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgb2JqKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdHJ5RmluZE5hbWUgPSBbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgIGlmIChzcGVjaWZpZXIuaW5kZXhPZignLicpID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIHRyeUZpbmROYW1lID0gdHJ5RmluZE5hbWUuY29uY2F0KFtzcGVjaWZpZXIgKyAnLmpzJywgc3BlY2lmaWVyICsgJy50cycsIHNwZWNpZmllciArICcubWpzJywgc3BlY2lmaWVyICsgJy5tdHMnXSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZmluZGVkID0gdHJ5RmluZE5hbWUucmVkdWNlKChyZXQsIG5hbWUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJldCAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmpbbmFtZV0gPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNpcmN1bGFyIGRlcGVuZGVuY3kgaXMgZGV0ZWN0ZWQgd2hlbiByZXF1aXJpbmcgXCIke25hbWV9XCJgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmluZGVkID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyeUZpbmROYW1lW2ZpbmRlZF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcmVxdWlyZVJldCA9IG1vY2tSZXF1aXJlKGZpbGVOYW1lKTtcclxuICAgICAgICByZXR1cm4gcmVxdWlyZVJldDtcclxuICAgIH1cclxufVxyXG5nbG9iYWxUaGlzLl9fcHVlcnRzRXhlY3V0ZU1vZHVsZSA9IEV4ZWN1dGVNb2R1bGU7XHJcbnZhciBKU1RhZztcclxuKGZ1bmN0aW9uIChKU1RhZykge1xyXG4gICAgLyogYWxsIHRhZ3Mgd2l0aCBhIHJlZmVyZW5jZSBjb3VudCBhcmUgbmVnYXRpdmUgKi9cclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0ZJUlNUXCJdID0gLTldID0gXCJKU19UQUdfRklSU1RcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX1NUUklOR1wiXSA9IC05XSA9IFwiSlNfVEFHX1NUUklOR1wiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfU1RSSU5HMTZcIl0gPSAtOF0gPSBcIkpTX1RBR19TVFJJTkcxNlwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfQlVGRkVSXCJdID0gLTddID0gXCJKU19UQUdfQlVGRkVSXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19FWENFUFRJT05cIl0gPSAtNl0gPSBcIkpTX1RBR19FWENFUFRJT05cIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX05BVElWRV9PQkpFQ1RcIl0gPSAtNF0gPSBcIkpTX1RBR19OQVRJVkVfT0JKRUNUXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19BUlJBWVwiXSA9IC0zXSA9IFwiSlNfVEFHX0FSUkFZXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19GVU5DVElPTlwiXSA9IC0yXSA9IFwiSlNfVEFHX0ZVTkNUSU9OXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19PQkpFQ1RcIl0gPSAtMV0gPSBcIkpTX1RBR19PQkpFQ1RcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0lOVFwiXSA9IDBdID0gXCJKU19UQUdfSU5UXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19CT09MXCJdID0gMV0gPSBcIkpTX1RBR19CT09MXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19OVUxMXCJdID0gMl0gPSBcIkpTX1RBR19OVUxMXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19VTkRFRklORURcIl0gPSAzXSA9IFwiSlNfVEFHX1VOREVGSU5FRFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfVU5JTklUSUFMSVpFRFwiXSA9IDRdID0gXCJKU19UQUdfVU5JTklUSUFMSVpFRFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfRkxPQVQ2NFwiXSA9IDVdID0gXCJKU19UQUdfRkxPQVQ2NFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfSU5UNjRcIl0gPSA2XSA9IFwiSlNfVEFHX0lOVDY0XCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19VSU5UNjRcIl0gPSA3XSA9IFwiSlNfVEFHX1VJTlQ2NFwiO1xyXG59KShKU1RhZyB8fCAoSlNUYWcgPSB7fSkpO1xyXG5sZXQgaGFzRXhjZXB0aW9uID0gZmFsc2U7XHJcbmxldCBsYXN0RXhjZXB0aW9uID0gdW5kZWZpbmVkO1xyXG5sZXQgbGFzdEV4Y2VwdGlvbkJ1ZmZlciA9IHVuZGVmaW5lZDtcclxuZnVuY3Rpb24gZ2V0RXhjZXB0aW9uQXNOYXRpdmVTdHJpbmcod2FzbUFwaSwgd2l0aF9zdGFjaykge1xyXG4gICAgaWYgKGhhc0V4Y2VwdGlvbikge1xyXG4gICAgICAgIGhhc0V4Y2VwdGlvbiA9IGZhbHNlO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBsYXN0RXhjZXB0aW9uID09PSAnb2JqZWN0JyAmJiBsYXN0RXhjZXB0aW9uICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IGxhc3RFeGNlcHRpb24ubWVzc2FnZTtcclxuICAgICAgICAgICAgY29uc3Qgc3RhY2sgPSBsYXN0RXhjZXB0aW9uLnN0YWNrO1xyXG4gICAgICAgICAgICByZXN1bHQgPSB3aXRoX3N0YWNrID8gYCR7bXNnfVxcbiR7c3RhY2t9YCA6IG1zZztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGAke2xhc3RFeGNlcHRpb259YDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICAgICAgY29uc3QgYnl0ZUNvdW50ID0gd2FzbUFwaS5sZW5ndGhCeXRlc1VURjgocmVzdWx0KTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZ2V0RXhjZXB0aW9uQXNOYXRpdmVTdHJpbmcoJHtieXRlQ291bnR9KTogJHtyZXN1bHR9YCk7XHJcbiAgICAgICAgaWYgKGxhc3RFeGNlcHRpb25CdWZmZXIpIHtcclxuICAgICAgICAgICAgd2FzbUFwaS5fZnJlZShsYXN0RXhjZXB0aW9uQnVmZmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGFzdEV4Y2VwdGlvbkJ1ZmZlciA9IHdhc21BcGkuX21hbGxvYyhieXRlQ291bnQgKyAxKTtcclxuICAgICAgICAvLyDov5nkuI0rMeS8muWvvOiHtOWwkeS4gOS4quWtl+espu+8jOeci+S4iuWOu3N0cmluZ1RvVVRGOOeahOmAu+i+keaYr+iupOS4uuivpemVv+W6puaYr2J1ZmZlcueahOacgOWkp+mVv+W6pu+8jOiAjOS4lOehruS/nee7k+WwvuaciVxcMOe7k+adn+esplxyXG4gICAgICAgIHdhc21BcGkuc3RyaW5nVG9VVEY4KHJlc3VsdCwgbGFzdEV4Y2VwdGlvbkJ1ZmZlciwgYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgLy8g5aaC5p6c5LiK6L+w5o6o6K665q2j56Gu77yM6L+Z6KGM5piv5aSa5L2Z55qE77yM5LiN6L+H5L+d6Zmp6LW36KeB6L+Y5piv5Yqg5LiLXHJcbiAgICAgICAgd2FzbUFwaS5IRUFQVThbbGFzdEV4Y2VwdGlvbkJ1ZmZlciArIGJ5dGVDb3VudF0gPSAwO1xyXG4gICAgICAgIHJldHVybiBsYXN0RXhjZXB0aW9uQnVmZmVyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDA7XHJcbn1cclxuZnVuY3Rpb24gZ2V0QW5kQ2xlYXJMYXN0RXhjZXB0aW9uKCkge1xyXG4gICAgaGFzRXhjZXB0aW9uID0gZmFsc2U7XHJcbiAgICBjb25zdCByZXQgPSBsYXN0RXhjZXB0aW9uO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICByZXR1cm4gcmV0O1xyXG59XHJcbmZ1bmN0aW9uIHNldExhc3RFeGNlcHRpb24oZXJyKSB7XHJcbiAgICBoYXNFeGNlcHRpb24gPSB0cnVlO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IGVycjtcclxufVxyXG5jbGFzcyBTY29wZSB7XHJcbiAgICBzdGF0aWMgY3VycmVudCA9IHVuZGVmaW5lZDtcclxuICAgIHN0YXRpYyBnZXRDdXJyZW50KCkge1xyXG4gICAgICAgIHJldHVybiBTY29wZS5jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGVudGVyKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgU2NvcGUoKTtcclxuICAgIH1cclxuICAgIHN0YXRpYyBleGl0KHdhc21BcGkpIHtcclxuICAgICAgICBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKTtcclxuICAgICAgICBTY29wZS5jdXJyZW50LmNsb3NlKHdhc21BcGkpO1xyXG4gICAgfVxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5wcmV2U2NvcGUgPSBTY29wZS5jdXJyZW50O1xyXG4gICAgICAgIFNjb3BlLmN1cnJlbnQgPSB0aGlzO1xyXG4gICAgfVxyXG4gICAgY2xvc2Uod2FzbUFwaSkge1xyXG4gICAgICAgIFNjb3BlLmN1cnJlbnQgPSB0aGlzLnByZXZTY29wZTtcclxuICAgIH1cclxuICAgIGFkZFRvU2NvcGUob2JqKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RzSW5TY29wZS5wdXNoKG9iaik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGUubGVuZ3RoIC0gMTtcclxuICAgIH1cclxuICAgIGdldEZyb21TY29wZShpbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdHNJblNjb3BlW2luZGV4XTtcclxuICAgIH1cclxuICAgIHRvSnMod2FzbUFwaSwgb2JqTWFwcGVyLCBwdmFsdWUsIGZyZWVTdHJpbmdBbmRCdWZmZXIgPSBmYWxzZSkge1xyXG4gICAgICAgIGlmIChwdmFsdWUgPT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICBjb25zdCBoZWFwID0gd2FzbUFwaS5IRUFQVTg7XHJcbiAgICAgICAgY29uc3QgdGFnUHRyID0gcHZhbHVlICsgODtcclxuICAgICAgICBjb25zdCB2YWxUeXBlID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCB0YWdQdHIpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coYHZhbFR5cGU6ICR7dmFsVHlwZX1gKTtcclxuICAgICAgICBpZiAodmFsVHlwZSA8PSBKU1RhZy5KU19UQUdfT0JKRUNUICYmIHZhbFR5cGUgPj0gSlNUYWcuSlNfVEFHX0FSUkFZKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9iaklkeCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGVbb2JqSWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbFR5cGUgPT0gSlNUYWcuSlNfVEFHX05BVElWRV9PQkpFQ1QpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JqSWQgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmpNYXBwZXIuZmluZE5hdGl2ZU9iamVjdChvYmpJZCk7IC8vIOiCr+WumuW3sue7j3B1c2jov4fkuobvvIznm7TmjqVmaW5k5bCx5Y+v5Lul5LqGXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN3aXRjaCAodmFsVHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19CT09MOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKSAhPSAwO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19JTlQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19OVUxMOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX1VOREVGSU5FRDpcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0ZMT0FUNjQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWREb3VibGUoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfSU5UNjQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRJbnQ2NChoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19VSU5UNjQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRVSW50NjQoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfU1RSSU5HOlxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RyU3RhcnQgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHJMZW4gPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSArIDQpO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RyID0gd2FzbUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RhcnQsIHN0ckxlbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnJlZVN0cmluZ0FuZEJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lZWRfZnJlZSA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgdGFnUHRyICsgNCk7IC8vIG5lZWRfZnJlZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWVkX2ZyZWUgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXNtQXBpLl9mcmVlKHN0clN0YXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19TVFJJTkcxNjpcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0cjE2U3RhcnQgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHIxNkxlbiA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlICsgNCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHIxNiA9IHdhc21BcGkuVVRGMTZUb1N0cmluZyhzdHIxNlN0YXJ0LCBzdHIxNkxlbiAqIDIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZyZWVTdHJpbmdBbmRCdWZmZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZWVkX2ZyZWUgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHRhZ1B0ciArIDQpOyAvLyBuZWVkX2ZyZWVcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmVlZF9mcmVlICE9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2FzbUFwaS5fZnJlZShzdHIxNlN0YXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyMTY7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0JVRkZFUjpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZTdGFydCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZMZW4gPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSArIDQpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZiA9IHdhc21BcGkuSEVBUDguYnVmZmVyLnNsaWNlKGJ1ZmZTdGFydCwgYnVmZlN0YXJ0ICsgYnVmZkxlbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnJlZVN0cmluZ0FuZEJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lZWRfZnJlZSA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgdGFnUHRyICsgNCk7IC8vIG5lZWRfZnJlZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWVkX2ZyZWUgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXNtQXBpLl9mcmVlKGJ1ZmZTdGFydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJ1ZmY7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgdHlwZTogJHt2YWxUeXBlfWApO1xyXG4gICAgfVxyXG4gICAgcHJldlNjb3BlID0gdW5kZWZpbmVkO1xyXG4gICAgb2JqZWN0c0luU2NvcGUgPSBbbnVsbF07IC8vIOWKoG51bGzkuLrkuoZpbmRleOS7jjHlvIDlp4vvvIzlm6DkuLrlnKjljp/nlJ/np43lrZjmlL7lnKjmjIfpkojlrZfmrrXpmLLmraLor6/liKTkuLpudWxscHRyXHJcbn1cclxuY2xhc3MgT2JqZWN0UG9vbCB7XHJcbiAgICBzdG9yYWdlID0gbmV3IE1hcCgpO1xyXG4gICAgZ2NJdGVyYXRvcjtcclxuICAgIGdjVGltZW91dCA9IG51bGw7XHJcbiAgICBpc0djUnVubmluZyA9IGZhbHNlO1xyXG4gICAgLy8gR0MgY29uZmlndXJhdGlvbiBkZWZhdWx0c1xyXG4gICAgZ2NCYXRjaFNpemUgPSAxMDA7XHJcbiAgICBnY0ludGVydmFsTXMgPSA1MDtcclxuICAgIGNsZWFudXBDYWxsYmFjayA9IHVuZGVmaW5lZDtcclxuICAgIGNvbnN0cnVjdG9yKGNsZWFudXBDYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuY2xlYW51cENhbGxiYWNrID0gY2xlYW51cENhbGxiYWNrO1xyXG4gICAgfVxyXG4gICAgYWRkKG9iaklkLCBvYmosIHR5cGVJZCwgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgY29uc3QgcmVmID0gbmV3IFdlYWtSZWYob2JqKTtcclxuICAgICAgICB0aGlzLnN0b3JhZ2Uuc2V0KG9iaklkLCBbcmVmLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZV0pO1xyXG4gICAgICAgIG9iai4kT2JqSWRfXyA9IG9iaklkO1xyXG4gICAgICAgIG9iai4kVHlwZUlkX18gPSB0eXBlSWQ7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBnZXQob2JqSWQpIHtcclxuICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuc3RvcmFnZS5nZXQob2JqSWQpO1xyXG4gICAgICAgIGlmICghZW50cnkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBbcmVmLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZV0gPSBlbnRyeTtcclxuICAgICAgICBjb25zdCBvYmogPSByZWYuZGVyZWYoKTtcclxuICAgICAgICBpZiAoIW9iaikge1xyXG4gICAgICAgICAgICB0aGlzLnN0b3JhZ2UuZGVsZXRlKG9iaklkKTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2sob2JqSWQsIHR5cGVJZCwgY2FsbEZpbmFsaXplKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH1cclxuICAgIHN0YXRpYyBHZXROYXRpdmVJbmZvT2ZPYmplY3Qob2JqKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqSWQgPSBvYmouJE9iaklkX187XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmpJZCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtvYmpJZCwgb2JqLiRUeXBlSWRfX107XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaGFzKG9iaklkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RvcmFnZS5oYXMob2JqSWQpO1xyXG4gICAgfVxyXG4gICAgZnVsbEdjKCkge1xyXG4gICAgICAgIGZvciAoY29uc3QgW29iaklkXSBvZiB0aGlzLnN0b3JhZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy5nZXQob2JqSWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBPbmx5IHJlc2V0IGl0ZXJhdG9yIGlmIEdDIGlzIHJ1bm5pbmcgdG8gbWFpbnRhaW4gaXRlcmF0aW9uIHN0YXRlXHJcbiAgICAgICAgaWYgKHRoaXMuaXNHY1J1bm5pbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5nY0l0ZXJhdG9yID0gdGhpcy5zdG9yYWdlLmtleXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTdGFydCBpbmNyZW1lbnRhbCBnYXJiYWdlIGNvbGxlY3Rpb24gd2l0aCBjb25maWd1cmFibGUgcGFyYW1ldGVyc1xyXG4gICAgc3RhcnRJbmNyZW1lbnRhbEdjKGJhdGNoU2l6ZSA9IDEwMCwgaW50ZXJ2YWxNcyA9IDUwKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNHY1J1bm5pbmcpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB0aGlzLmlzR2NSdW5uaW5nID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmdjQmF0Y2hTaXplID0gTWF0aC5tYXgoMSwgYmF0Y2hTaXplKTtcclxuICAgICAgICB0aGlzLmdjSW50ZXJ2YWxNcyA9IE1hdGgubWF4KDAsIGludGVydmFsTXMpO1xyXG4gICAgICAgIHRoaXMuZ2NJdGVyYXRvciA9IHRoaXMuc3RvcmFnZS5rZXlzKCk7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzR2NCYXRjaCgpO1xyXG4gICAgfVxyXG4gICAgLy8gU3RvcCBpbmNyZW1lbnRhbCBnYXJiYWdlIGNvbGxlY3Rpb25cclxuICAgIHN0b3BJbmNyZW1lbnRhbEdjKCkge1xyXG4gICAgICAgIHRoaXMuaXNHY1J1bm5pbmcgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGhpcy5nY1RpbWVvdXQpIHtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZ2NUaW1lb3V0KTtcclxuICAgICAgICAgICAgdGhpcy5nY1RpbWVvdXQgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHByb2Nlc3NHY0JhdGNoKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5pc0djUnVubmluZylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGxldCBwcm9jZXNzZWQgPSAwO1xyXG4gICAgICAgIGxldCBuZXh0ID0gdGhpcy5nY0l0ZXJhdG9yLm5leHQoKTtcclxuICAgICAgICB3aGlsZSAoIW5leHQuZG9uZSAmJiBwcm9jZXNzZWQgPCB0aGlzLmdjQmF0Y2hTaXplKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0KG5leHQudmFsdWUpO1xyXG4gICAgICAgICAgICBwcm9jZXNzZWQrKztcclxuICAgICAgICAgICAgbmV4dCA9IHRoaXMuZ2NJdGVyYXRvci5uZXh0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuZXh0LmRvbmUpIHtcclxuICAgICAgICAgICAgLy8gUmVzdGFydCBpdGVyYXRvciBmb3IgbmV4dCByb3VuZFxyXG4gICAgICAgICAgICB0aGlzLmdjSXRlcmF0b3IgPSB0aGlzLnN0b3JhZ2Uua2V5cygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmdjVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wcm9jZXNzR2NCYXRjaCgpLCB0aGlzLmdjSW50ZXJ2YWxNcyk7XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgQ2xhc3NSZWdpc3RlciB7XHJcbiAgICBzdGF0aWMgaW5zdGFuY2U7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHsgfVxyXG4gICAgY2xhc3NOb3RGb3VuZCA9IHVuZGVmaW5lZDtcclxuICAgIHR5cGVJZFRvQ2xhc3MgPSBuZXcgTWFwKCk7XHJcbiAgICB0eXBlSWRUb0luZm9zID0gbmV3IE1hcCgpO1xyXG4gICAgbmFtZVRvQ2xhc3MgPSBuZXcgTWFwKCk7XHJcbiAgICBzdGF0aWMgZ2V0SW5zdGFuY2UoKSB7XHJcbiAgICAgICAgaWYgKCFDbGFzc1JlZ2lzdGVyLmluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgIENsYXNzUmVnaXN0ZXIuaW5zdGFuY2UgPSBuZXcgQ2xhc3NSZWdpc3RlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQ2xhc3NSZWdpc3Rlci5pbnN0YW5jZTtcclxuICAgIH1cclxuICAgIC8vcHVibGljIHBlc2FwaV9kZWZpbmVfY2xhc3ModHlwZUlkOiBudW1iZXIsIHN1cGVyVHlwZUlkOiBudW1iZXIsIHBuYW1lOiBDU1N0cmluZywgY29uc3RydWN0b3I6IG51bWJlciwgZmluYWxpemU6IG51bWJlciwgcHJvcGVydHlDb3VudDogbnVtYmVyLCBwcm9wZXJ0aWVzOiBudW1iZXIsIGRhdGE6IG51bWJlcik6IHZvaWQge1xyXG4gICAgLy99XHJcbiAgICBkZWZpbmVDbGFzcyh0eXBlSWQpIHtcclxuICAgICAgICBjb25zdCB0eXBlRGVmID0gd2FzbUFwaS5sb2FkX2NsYXNzX2J5X2lkKHJlZ2lzdHJ5LCB0eXBlSWQpO1xyXG4gICAgICAgIGNvbnN0IHN1cGVyVHlwZUlkID0gd2FzbUFwaS5nZXRfY2xhc3Nfc3VwZXJfdHlwZV9pZCh0eXBlRGVmKTtcclxuICAgICAgICBjb25zdCBwbmFtZSA9IHdhc21BcGkuZ2V0X2NsYXNzX25hbWUodHlwZURlZik7XHJcbiAgICAgICAgY29uc3QgbmFtZSA9IHdhc21BcGkuVVRGOFRvU3RyaW5nKHBuYW1lKTtcclxuICAgICAgICBjb25zdCBjb25zdHJ1Y3RvciA9IHdhc21BcGkuZ2V0X2NsYXNzX2luaXRpYWxpemUodHlwZURlZik7XHJcbiAgICAgICAgY29uc3QgZmluYWxpemUgPSB3YXNtQXBpLmdldF9jbGFzc19maW5hbGl6ZSh0eXBlRGVmKTtcclxuICAgICAgICBjb25zdCBkYXRhID0gd2FzbUFwaS5nZXRfY2xhc3NfZGF0YSh0eXBlRGVmKTtcclxuICAgICAgICBjb25zdCB0cmFjZV9saWZlY3ljbGUgPSB3YXNtQXBpLmdldF9jbGFzc190cmFjZV9saWZlY3ljbGUodHlwZURlZik7XHJcbiAgICAgICAgY29uc3QgUEFwaU5hdGl2ZU9iamVjdCA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XHJcbiAgICAgICAgICAgIGxldCBjYWxsYmFja0luZm8gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGNvbnN0IGFyZ2MgPSBhcmd1bWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICBjb25zdCBzY29wZSA9IFNjb3BlLmVudGVyKCk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFja0luZm8gPSBqc0FyZ3NUb0NhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjLCBhcmdzKTtcclxuICAgICAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKHdhc21BcGkuSEVBUFU4LCBkYXRhLCBjYWxsYmFja0luZm8gKyA4KTsgLy8gZGF0YVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqSWQgPSB3YXNtQXBpLlBBcGlDb25zdHJ1Y3RvcldpdGhTY29wZShjb25zdHJ1Y3Rvciwgd2ViZ2xGRkksIGNhbGxiYWNrSW5mbyk7IC8vIOmihOacn3dhc23lj6rkvJrpgJrov4d0aHJvd19ieV9zdHJpbmfmipvlvILluLjvvIzkuI3kuqfnlJ/nm7TmjqVqc+W8guW4uFxyXG4gICAgICAgICAgICAgICAgaWYgKGhhc0V4Y2VwdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IGdldEFuZENsZWFyTGFzdEV4Y2VwdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgb2JqTWFwcGVyLmJpbmROYXRpdmVPYmplY3Qob2JqSWQsIHRoaXMsIHR5cGVJZCwgUEFwaU5hdGl2ZU9iamVjdCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm5OYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgY2FsbGJhY2tJbmZvKTtcclxuICAgICAgICAgICAgICAgIHNjb3BlLmNsb3NlKHdhc21BcGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUEFwaU5hdGl2ZU9iamVjdCwgXCJuYW1lXCIsIHsgdmFsdWU6IG5hbWUgfSk7XHJcbiAgICAgICAgaWYgKHN1cGVyVHlwZUlkICE9IDApIHtcclxuICAgICAgICAgICAgY29uc3Qgc3VwZXJUeXBlID0gdGhpcy5sb2FkQ2xhc3NCeUlkKHN1cGVyVHlwZUlkKTtcclxuICAgICAgICAgICAgaWYgKHN1cGVyVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKFBBcGlOYXRpdmVPYmplY3QucHJvdG90eXBlLCBzdXBlclR5cGUucHJvdG90eXBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBuYXRpdmVNZXRob2RJbmZvVG9KcyhtZXRob2RQdHIsIGlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZUZ1bmNQdHIgPSB3YXNtQXBpLmdldF9mdW5jdGlvbl9pbmZvX2NhbGxiYWNrKG1ldGhvZFB0cik7XHJcbiAgICAgICAgICAgIGNvbnN0IG1ldGhvZERhdGEgPSB3YXNtQXBpLmdldF9mdW5jdGlvbl9pbmZvX2RhdGEobWV0aG9kUHRyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGdlbkpzQ2FsbGJhY2sod2FzbUFwaSwgbmF0aXZlRnVuY1B0ciwgbWV0aG9kRGF0YSwgd2ViZ2xGRkksIGlzU3RhdGljKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbmF0aXZlUHJvcGVydHlJbmZvVG9Kcyhwcm9wZXJ0eUluZm9QdHIsIGlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGdldHRlciA9IHdhc21BcGkuZ2V0X3Byb3BlcnR5X2luZm9fZ2V0dGVyKHByb3BlcnR5SW5mb1B0cik7XHJcbiAgICAgICAgICAgIGNvbnN0IHNldHRlciA9IHdhc21BcGkuZ2V0X3Byb3BlcnR5X2luZm9fc2V0dGVyKHByb3BlcnR5SW5mb1B0cik7XHJcbiAgICAgICAgICAgIGNvbnN0IGdldHRlcl9kYXRhID0gd2FzbUFwaS5nZXRfcHJvcGVydHlfaW5mb19nZXR0ZXJfZGF0YShwcm9wZXJ0eUluZm9QdHIpO1xyXG4gICAgICAgICAgICBjb25zdCBzZXR0ZXJfZGF0YSA9IHdhc21BcGkuZ2V0X3Byb3BlcnR5X2luZm9fc2V0dGVyX2RhdGEocHJvcGVydHlJbmZvUHRyKTtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIGdldDogZ2V0dGVyID09PSAwID8gdW5kZWZpbmVkIDogZ2VuSnNDYWxsYmFjayh3YXNtQXBpLCBnZXR0ZXIsIGdldHRlcl9kYXRhLCB3ZWJnbEZGSSwgaXNTdGF0aWMpLFxyXG4gICAgICAgICAgICAgICAgc2V0OiBzZXR0ZXIgPT09IDAgPyB1bmRlZmluZWQgOiBnZW5Kc0NhbGxiYWNrKHdhc21BcGksIHNldHRlciwgc2V0dGVyX2RhdGEsIHdlYmdsRkZJLCBpc1N0YXRpYyksXHJcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBtZXRob2RQdHIgPSB3YXNtQXBpLmdldF9jbGFzc19tZXRob2RzKHR5cGVEZWYpO1xyXG4gICAgICAgIHdoaWxlIChtZXRob2RQdHIgIT0gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSB3YXNtQXBpLlVURjhUb1N0cmluZyh3YXNtQXBpLmdldF9mdW5jdGlvbl9pbmZvX25hbWUobWV0aG9kUHRyKSk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYG1ldGhvZDogJHtuYW1lfSAke2ZpZWxkTmFtZX1gKTtcclxuICAgICAgICAgICAgUEFwaU5hdGl2ZU9iamVjdC5wcm90b3R5cGVbZmllbGROYW1lXSA9IG5hdGl2ZU1ldGhvZEluZm9Ub0pzKG1ldGhvZFB0ciwgZmFsc2UpO1xyXG4gICAgICAgICAgICBtZXRob2RQdHIgPSB3YXNtQXBpLmdldF9uZXh0X2Z1bmN0aW9uX2luZm8obWV0aG9kUHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGZ1bmN0aW9uUHRyID0gd2FzbUFwaS5nZXRfY2xhc3NfZnVuY3Rpb25zKHR5cGVEZWYpO1xyXG4gICAgICAgIHdoaWxlIChmdW5jdGlvblB0ciAhPSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IHdhc21BcGkuVVRGOFRvU3RyaW5nKHdhc21BcGkuZ2V0X2Z1bmN0aW9uX2luZm9fbmFtZShmdW5jdGlvblB0cikpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGBmdW5jdGlvbjogJHtuYW1lfSAke2ZpZWxkTmFtZX1gKTtcclxuICAgICAgICAgICAgUEFwaU5hdGl2ZU9iamVjdFtmaWVsZE5hbWVdID0gbmF0aXZlTWV0aG9kSW5mb1RvSnMoZnVuY3Rpb25QdHIsIHRydWUpO1xyXG4gICAgICAgICAgICBmdW5jdGlvblB0ciA9IHdhc21BcGkuZ2V0X25leHRfZnVuY3Rpb25faW5mbyhmdW5jdGlvblB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBwcm9wZXJ0eVB0ciA9IHdhc21BcGkuZ2V0X2NsYXNzX3Byb3BlcnRpZXModHlwZURlZik7XHJcbiAgICAgICAgd2hpbGUgKHByb3BlcnR5UHRyICE9IDApIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gd2FzbUFwaS5VVEY4VG9TdHJpbmcod2FzbUFwaS5nZXRfcHJvcGVydHlfaW5mb19uYW1lKHByb3BlcnR5UHRyKSk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYHByb3BlcnR5OiAke25hbWV9ICR7ZmllbGROYW1lfWApO1xyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUEFwaU5hdGl2ZU9iamVjdC5wcm90b3R5cGUsIGZpZWxkTmFtZSwgbmF0aXZlUHJvcGVydHlJbmZvVG9Kcyhwcm9wZXJ0eVB0ciwgZmFsc2UpKTtcclxuICAgICAgICAgICAgcHJvcGVydHlQdHIgPSB3YXNtQXBpLmdldF9uZXh0X3Byb3BlcnR5X2luZm8ocHJvcGVydHlQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgdmFyaWFibGVQdHIgPSB3YXNtQXBpLmdldF9jbGFzc192YXJpYWJsZXModHlwZURlZik7XHJcbiAgICAgICAgd2hpbGUgKHZhcmlhYmxlUHRyICE9IDApIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gd2FzbUFwaS5VVEY4VG9TdHJpbmcod2FzbUFwaS5nZXRfcHJvcGVydHlfaW5mb19uYW1lKHZhcmlhYmxlUHRyKSk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYHZhcmlhYmxlOiAke25hbWV9ICR7ZmllbGROYW1lfWApO1xyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUEFwaU5hdGl2ZU9iamVjdCwgZmllbGROYW1lLCBuYXRpdmVQcm9wZXJ0eUluZm9Ub0pzKHZhcmlhYmxlUHRyLCBmYWxzZSkpO1xyXG4gICAgICAgICAgICB2YXJpYWJsZVB0ciA9IHdhc21BcGkuZ2V0X25leHRfcHJvcGVydHlfaW5mbyh2YXJpYWJsZVB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coYHBlc2FwaV9kZWZpbmVfY2xhc3M6ICR7bmFtZX0gJHt0eXBlSWR9ICR7c3VwZXJUeXBlSWR9YCk7XHJcbiAgICAgICAgdGhpcy5yZWdpc3RlckNsYXNzKHR5cGVJZCwgUEFwaU5hdGl2ZU9iamVjdCwgd2FzbUFwaS5nZXRXYXNtVGFibGVFbnRyeShmaW5hbGl6ZSksIGRhdGEsIHRyYWNlX2xpZmVjeWNsZSk7XHJcbiAgICB9XHJcbiAgICBsb2FkQ2xhc3NCeUlkKHR5cGVJZCkge1xyXG4gICAgICAgIGNvbnN0IGNscyA9IHRoaXMudHlwZUlkVG9DbGFzcy5nZXQodHlwZUlkKTtcclxuICAgICAgICBpZiAoY2xzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjbHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRlZmluZUNsYXNzKHR5cGVJZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnR5cGVJZFRvQ2xhc3MuZ2V0KHR5cGVJZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVnaXN0ZXJDbGFzcyh0eXBlSWQsIGNscywgZmluYWxpemUsIGNsc0RhdGEsIHRyYWNlX2xpZmVjeWNsZSkge1xyXG4gICAgICAgIGNvbnN0IGluZm9zID0geyB0eXBlSWQsIGZpbmFsaXplLCBkYXRhOiBjbHNEYXRhLCB0cmFjZUxpZmVjeWNsZTogdHJhY2VfbGlmZWN5Y2xlICE9IDAgfTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xzLCAnJEluZm9zJywge1xyXG4gICAgICAgICAgICB2YWx1ZTogaW5mb3MsXHJcbiAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2VcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnR5cGVJZFRvQ2xhc3Muc2V0KHR5cGVJZCwgY2xzKTtcclxuICAgICAgICB0aGlzLnR5cGVJZFRvSW5mb3Muc2V0KHR5cGVJZCwgaW5mb3MpO1xyXG4gICAgICAgIHRoaXMubmFtZVRvQ2xhc3Muc2V0KGNscy5uYW1lLCBjbHMpO1xyXG4gICAgfVxyXG4gICAgZ2V0Q2xhc3NEYXRhQnlJZCh0eXBlSWQsIGZvcmNlTG9hZCkge1xyXG4gICAgICAgIGlmIChmb3JjZUxvYWQpIHtcclxuICAgICAgICAgICAgdGhpcy5sb2FkQ2xhc3NCeUlkKHR5cGVJZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGluZm9zID0gdGhpcy5nZXRUeXBlSW5mb3ModHlwZUlkKTtcclxuICAgICAgICByZXR1cm4gaW5mb3MgPyBpbmZvcy5kYXRhIDogMDtcclxuICAgIH1cclxuICAgIGZpbmRDbGFzc0J5SWQodHlwZUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZUlkVG9DbGFzcy5nZXQodHlwZUlkKTtcclxuICAgIH1cclxuICAgIGZpbmRDbGFzc0J5TmFtZShuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZVRvQ2xhc3MuZ2V0KG5hbWUpO1xyXG4gICAgfVxyXG4gICAgZ2V0VHlwZUluZm9zKHR5cGVJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnR5cGVJZFRvSW5mb3MuZ2V0KHR5cGVJZCk7XHJcbiAgICB9XHJcbiAgICBzZXRDbGFzc05vdEZvdW5kQ2FsbGJhY2soY2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLmNsYXNzTm90Rm91bmQgPSBjYWxsYmFjaztcclxuICAgIH1cclxufVxyXG5jbGFzcyBPYmplY3RNYXBwZXIge1xyXG4gICAgb2JqZWN0UG9vbDtcclxuICAgIHByaXZhdGVEYXRhID0gdW5kZWZpbmVkO1xyXG4gICAgb2JqSWQydWQgPSBuZXcgTWFwKCk7XHJcbiAgICBvbkVudGVyID0gdW5kZWZpbmVkO1xyXG4gICAgb25FeGl0ID0gdW5kZWZpbmVkO1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RQb29sID0gbmV3IE9iamVjdFBvb2wodGhpcy5Pbk5hdGl2ZU9iamVjdEZpbmFsaXplZC5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLm9iamVjdFBvb2wuc3RhcnRJbmNyZW1lbnRhbEdjKDEwMCwgMTAwMCk7XHJcbiAgICB9XHJcbiAgICBwdXNoTmF0aXZlT2JqZWN0KG9iaklkLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZSkge1xyXG4gICAgICAgIGxldCBqc09iaiA9IHRoaXMub2JqZWN0UG9vbC5nZXQob2JqSWQpO1xyXG4gICAgICAgIGlmICghanNPYmopIHtcclxuICAgICAgICAgICAgY29uc3QgY2xzID0gQ2xhc3NSZWdpc3Rlci5nZXRJbnN0YW5jZSgpLmxvYWRDbGFzc0J5SWQodHlwZUlkKTtcclxuICAgICAgICAgICAgaWYgKGNscykge1xyXG4gICAgICAgICAgICAgICAganNPYmogPSBPYmplY3QuY3JlYXRlKGNscy5wcm90b3R5cGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kTmF0aXZlT2JqZWN0KG9iaklkLCBqc09iaiwgdHlwZUlkLCBjbHMsIGNhbGxGaW5hbGl6ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGpzT2JqO1xyXG4gICAgfVxyXG4gICAgZmluZE5hdGl2ZU9iamVjdChvYmpJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdFBvb2wuZ2V0KG9iaklkKTtcclxuICAgIH1cclxuICAgIGJpbmROYXRpdmVPYmplY3Qob2JqSWQsIGpzT2JqLCB0eXBlSWQsIGNscywgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RQb29sLmFkZChvYmpJZCwganNPYmosIHR5cGVJZCwgY2FsbEZpbmFsaXplKTtcclxuICAgICAgICBjb25zdCB7IGRhdGEsIHRyYWNlTGlmZWN5Y2xlIH0gPSBjbHMuJEluZm9zO1xyXG4gICAgICAgIGlmICh0cmFjZUxpZmVjeWNsZSAmJiB0aGlzLm9uRW50ZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgdWQgPSB0aGlzLm9uRW50ZXIob2JqSWQsIGRhdGEsIHRoaXMucHJpdmF0ZURhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLm9iaklkMnVkLnNldChvYmpJZCwgdWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHNldEVudlByaXZhdGUocHJpdmF0ZURhdGEpIHtcclxuICAgICAgICB0aGlzLnByaXZhdGVEYXRhID0gcHJpdmF0ZURhdGE7XHJcbiAgICB9XHJcbiAgICB0cmFjZU5hdGl2ZU9iamVjdChvbkVudGVyLCBvbkV4aXQpIHtcclxuICAgICAgICB0aGlzLm9uRW50ZXIgPSBvbkVudGVyO1xyXG4gICAgICAgIHRoaXMub25FeGl0ID0gb25FeGl0O1xyXG4gICAgfVxyXG4gICAgT25OYXRpdmVPYmplY3RGaW5hbGl6ZWQob2JqSWQsIHR5cGVJZCwgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmVycm9yKGBPbk5hdGl2ZU9iamVjdEZpbmFsaXplZCAke29iaklkfWApO1xyXG4gICAgICAgIGNvbnN0IGNscyA9IENsYXNzUmVnaXN0ZXIuZ2V0SW5zdGFuY2UoKS5maW5kQ2xhc3NCeUlkKHR5cGVJZCk7XHJcbiAgICAgICAgY29uc3QgeyBmaW5hbGl6ZSwgZGF0YSwgdHJhY2VMaWZlY3ljbGUgfSA9IGNscy4kSW5mb3M7XHJcbiAgICAgICAgaWYgKGNhbGxGaW5hbGl6ZSAmJiBmaW5hbGl6ZSkge1xyXG4gICAgICAgICAgICBmaW5hbGl6ZSh3ZWJnbEZGSSwgb2JqSWQsIGRhdGEsIHRoaXMucHJpdmF0ZURhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHJhY2VMaWZlY3ljbGUgJiYgdGhpcy5vbkV4aXQgJiYgdGhpcy5vYmpJZDJ1ZC5oYXMob2JqSWQpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHVkID0gdGhpcy5vYmpJZDJ1ZC5nZXQob2JqSWQpO1xyXG4gICAgICAgICAgICB0aGlzLm9iaklkMnVkLmRlbGV0ZShvYmpJZCk7XHJcbiAgICAgICAgICAgIHRoaXMub25FeGl0KG9iaklkLCBkYXRhLCB0aGlzLnByaXZhdGVEYXRhLCB1ZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmxldCB3ZWJnbEZGSSA9IHVuZGVmaW5lZDtcclxubGV0IG9iak1hcHBlciA9IHVuZGVmaW5lZDtcclxubGV0IHJlZ2lzdHJ5ID0gdW5kZWZpbmVkO1xyXG5sZXQgd2FzbUFwaSA9IHVuZGVmaW5lZDtcclxuLy8gdHlwZWRlZiBzdHJ1Y3QgU3RyaW5nIHtcclxuLy8gICAgIGNvbnN0IGNoYXIgKnB0cjtcclxuLy8gICAgIHVpbnQzMl90IGxlbjtcclxuLy8gfSBTdHJpbmc7XHJcbi8vIFxyXG4vLyB0eXBlZGVmIHN0cnVjdCBCdWZmZXIge1xyXG4vLyAgICAgdm9pZCAqcHRyO1xyXG4vLyAgICAgdWludDMyX3QgbGVuO1xyXG4vLyB9IEJ1ZmZlcjtcclxuLy8gXHJcbi8vIHR5cGVkZWYgc3RydWN0IE5hdGl2ZU9iamVjdCB7XHJcbi8vICAgICB2b2lkICpvYmpJZDtcclxuLy8gICAgIGNvbnN0IHZvaWQgKnR5cGVJZDtcclxuLy8gfSBOYXRpdmVPYmplY3Q7XHJcbi8vIFxyXG4vLyB0eXBlZGVmIHVuaW9uIEpTVmFsdWVVbmlvbiB7XHJcbi8vICAgICBpbnQzMl90IGludDMyO1xyXG4vLyAgICAgZG91YmxlIGZsb2F0NjQ7XHJcbi8vICAgICBpbnQ2NF90IGludDY0O1xyXG4vLyAgICAgdWludDY0X3QgdWludDY0O1xyXG4vLyAgICAgdm9pZCAqcHRyO1xyXG4vLyAgICAgU3RyaW5nIHN0cjtcclxuLy8gICAgIEJ1ZmZlciBidWY7XHJcbi8vICAgICBOYXRpdmVPYmplY3QgbnRvO1xyXG4vLyB9IEpTVmFsdWVVbmlvbjtcclxuLy8gXHJcbi8vIHR5cGVkZWYgc3RydWN0IEpTVmFsdWUge1xyXG4vLyAgICAgSlNWYWx1ZVVuaW9uIHU7XHJcbi8vICAgICBpbnQzMl90IHRhZztcclxuLy8gICAgIGludCBuZWVkX2ZyZWU7XHJcbi8vIH0gSlNWYWx1ZTtcclxuLy9cclxuLy8gc3RydWN0IENhbGxiYWNrSW5mbyB7XHJcbi8vICAgICB2b2lkKiB0aGlzUHRyO1xyXG4vLyAgICAgaW50IGFyZ2M7XHJcbi8vICAgICB2b2lkKiBkYXRhO1xyXG4vLyAgICAgdm9pZCogdGhpc1R5cGVJZDtcclxuLy8gICAgIEpTVmFsdWUgcmVzO1xyXG4vLyAgICAgSlNWYWx1ZSBhcmd2WzBdO1xyXG4vLyB9O1xyXG4vLyBzaXplb2YoSlNWYWx1ZSkgPT0gMTZcclxuY29uc3QgY2FsbGJhY2tJbmZvc0NhY2hlID0gW107XHJcbmZ1bmN0aW9uIGdldE5hdGl2ZUNhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjKSB7XHJcbiAgICBsZXQgY2FsbGJhY2tJbmZvID0gY2FsbGJhY2tJbmZvc0NhY2hlW2FyZ2NdO1xyXG4gICAgaWYgKCFjYWxsYmFja0luZm8pIHtcclxuICAgICAgICAvLyA0ICsgNCArIDQgKyA0ICsgMTYgKyAoYXJnYyAqIDE2KVxyXG4gICAgICAgIGNvbnN0IHNpemUgPSAzMiArIChhcmdjICogMTYpO1xyXG4gICAgICAgIGNhbGxiYWNrSW5mbyA9IHdhc21BcGkuX21hbGxvYyhzaXplKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMih3YXNtQXBpLkhFQVBVOCwgYXJnYywgY2FsbGJhY2tJbmZvICsgNCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsYmFja0luZm9zQ2FjaGVbYXJnY10gPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBCdWZmZXIud3JpdGVJbnQzMih3YXNtQXBpLkhFQVBVOCwgSlNUYWcuSlNfVEFHX1VOREVGSU5FRCwgY2FsbGJhY2tJbmZvICsgMjQpOyAvLyBzZXQgcmVzIHRvIHVuZGVmaW5lZFxyXG4gICAgcmV0dXJuIGNhbGxiYWNrSW5mbztcclxufVxyXG5mdW5jdGlvbiByZXR1cm5OYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgY2FsbGJhY2tJbmZvKSB7XHJcbiAgICBpZiAoY2FsbGJhY2tJbmZvc0NhY2hlW2FyZ2NdKSB7XHJcbiAgICAgICAgd2FzbUFwaS5fZnJlZShjYWxsYmFja0luZm8pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgY2FsbGJhY2tJbmZvc0NhY2hlW2FyZ2NdID0gY2FsbGJhY2tJbmZvO1xyXG4gICAgfVxyXG59XHJcbi8vIFRPRE86IOWFiOeugOWNleWIhumFjeeUsXdhc23pgqPph4rmlL7vvIzlkI7nu63lho3kvJjljJZcclxuZnVuY3Rpb24gZ2V0QnVmZmVyKHdhc21BcGksIHNpemUpIHtcclxuICAgIHJldHVybiB3YXNtQXBpLl9tYWxsb2Moc2l6ZSk7XHJcbn1cclxuZnVuY3Rpb24ganNWYWx1ZVRvUGFwaVZhbHVlKHdhc21BcGksIGFyZywgdmFsdWUpIHtcclxuICAgIGxldCBoZWFwID0gd2FzbUFwaS5IRUFQVTg7XHJcbiAgICBjb25zdCBkYXRhUHRyID0gdmFsdWU7XHJcbiAgICBjb25zdCB0YWdQdHIgPSBkYXRhUHRyICsgODtcclxuICAgIGlmIChhcmcgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19VTkRFRklORUQsIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhcmcgPT09IG51bGwpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfTlVMTCwgdGFnUHRyKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdiaWdpbnQnKSB7XHJcbiAgICAgICAgaWYgKGFyZyA+IDkyMjMzNzIwMzY4NTQ3NzU4MDduKSB7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZVVJbnQ2NChoZWFwLCBhcmcsIGRhdGFQdHIpO1xyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfVUlOVDY0LCB0YWdQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50NjQoaGVhcCwgYXJnLCBkYXRhUHRyKTtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0lOVDY0LCB0YWdQdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoYXJnKSkge1xyXG4gICAgICAgICAgICBpZiAoYXJnID49IC0yMTQ3NDgzNjQ4ICYmIGFyZyA8PSAyMTQ3NDgzNjQ3KSB7XHJcbiAgICAgICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBhcmcsIGRhdGFQdHIpO1xyXG4gICAgICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0lOVCwgdGFnUHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDY0KGhlYXAsIGFyZywgZGF0YVB0cik7XHJcbiAgICAgICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfSU5UNjQsIHRhZ1B0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZURvdWJsZShoZWFwLCBhcmcsIGRhdGFQdHIpO1xyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfRkxPQVQ2NCwgdGFnUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGNvbnN0IGxlbiA9IHdhc21BcGkubGVuZ3RoQnl0ZXNVVEYxNihhcmcpO1xyXG4gICAgICAgIGNvbnN0IHB0ciA9IGdldEJ1ZmZlcih3YXNtQXBpLCBsZW4gKyAyKTtcclxuICAgICAgICB3YXNtQXBpLnN0cmluZ1RvVVRGMTYoYXJnLCBwdHIsIGxlbiArIDIpO1xyXG4gICAgICAgIGhlYXAgPSB3YXNtQXBpLkhFQVBVODsgLy8gZ2V0QnVmZmVy5Lya55Sz6K+35YaF5a2Y77yM5Y+v6IO95a+86Ie0SEVBUFU45pS55Y+YXHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgcHRyLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBhcmcubGVuZ3RoLCBkYXRhUHRyICsgNCk7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX1NUUklORzE2LCB0YWdQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIDEsIHRhZ1B0ciArIDQpOyAvLyBuZWVkX2ZyZWUgPSB0cnVlXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnYm9vbGVhbicpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBhcmcgPyAxIDogMCwgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0JPT0wsIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoYXJnKSwgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0ZVTkNUSU9OLCB0YWdQdHIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShhcmcpLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfQVJSQVksIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBhcmcgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbiAgICAgICAgY29uc3QgbGVuID0gYXJnLmJ5dGVMZW5ndGg7XHJcbiAgICAgICAgY29uc3QgcHRyID0gZ2V0QnVmZmVyKHdhc21BcGksIGxlbik7XHJcbiAgICAgICAgd2FzbUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhcmcpLCBwdHIpO1xyXG4gICAgICAgIGhlYXAgPSB3YXNtQXBpLkhFQVBVODsgLy8gZ2V0QnVmZmVy5Lya55Sz6K+35YaF5a2Y77yM5Y+v6IO95a+86Ie0SEVBUFU45pS55Y+YXHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgcHRyLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBsZW4sIGRhdGFQdHIgKyA0KTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfQlVGRkVSLCB0YWdQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIDEsIHRhZ1B0ciArIDQpOyAvLyBuZWVkX2ZyZWUgPSB0cnVlXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGNvbnN0IG50b0luZm8gPSBPYmplY3RQb29sLkdldE5hdGl2ZUluZm9PZk9iamVjdChhcmcpO1xyXG4gICAgICAgIGlmIChudG9JbmZvKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IFtvYmpJZCwgdHlwZUlkXSA9IG50b0luZm87XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIG9iaklkLCBkYXRhUHRyKTtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgdHlwZUlkLCBkYXRhUHRyICsgNCk7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19OQVRJVkVfT0JKRUNULCB0YWdQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoYXJnKSwgZGF0YVB0cik7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19PQkpFQ1QsIHRhZ1B0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIGFyZ3VtZW50IHR5cGU6ICR7dHlwZW9mIGFyZ31gKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBqc0FyZ3NUb0NhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjLCBhcmdzKSB7XHJcbiAgICBjb25zdCBjYWxsYmFja0luZm8gPSBnZXROYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYyk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ2M7ICsraSkge1xyXG4gICAgICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV07XHJcbiAgICAgICAganNWYWx1ZVRvUGFwaVZhbHVlKHdhc21BcGksIGFyZywgY2FsbGJhY2tJbmZvICsgMzIgKyAoaSAqIDE2KSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2FsbGJhY2tJbmZvO1xyXG59XHJcbmZ1bmN0aW9uIGdlbkpzQ2FsbGJhY2sod2FzbUFwaSwgY2FsbGJhY2ssIGRhdGEsIHBhcGksIGlzU3RhdGljKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcclxuICAgICAgICBpZiAobmV3LnRhcmdldCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wibm90IGEgY29uc3RydWN0b3InKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGNhbGxiYWNrSW5mbyA9IHVuZGVmaW5lZDtcclxuICAgICAgICBjb25zdCBhcmdjID0gYXJncy5sZW5ndGg7XHJcbiAgICAgICAgY29uc3Qgc2NvcGUgPSBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mbyA9IGpzQXJnc1RvQ2FsbGJhY2tJbmZvKHdhc21BcGksIGFyZ2MsIGFyZ3MpO1xyXG4gICAgICAgICAgICBjb25zdCBoZWFwID0gd2FzbUFwaS5IRUFQVTg7IC8v5ZyoUEFwaUNhbGxiYWNrV2l0aFNjb3Bl5YmN6YO95LiN5Lya5Y+Y5YyW77yM6L+Z5qC355So5piv5a6J5YWo55qEXHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIGRhdGEsIGNhbGxiYWNrSW5mbyArIDgpOyAvLyBkYXRhXHJcbiAgICAgICAgICAgIGxldCBvYmpJZCA9IDA7XHJcbiAgICAgICAgICAgIGxldCB0eXBlSWQgPSAwO1xyXG4gICAgICAgICAgICBpZiAoIWlzU3RhdGljICYmIHRoaXMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG50b0luZm8gPSBPYmplY3RQb29sLkdldE5hdGl2ZUluZm9PZk9iamVjdCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGlmIChudG9JbmZvKVxyXG4gICAgICAgICAgICAgICAgICAgIFtvYmpJZCwgdHlwZUlkXSA9IG50b0luZm87XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgb2JqSWQsIGNhbGxiYWNrSW5mbyk7IC8vIHRoaXNQdHJcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgdHlwZUlkLCBjYWxsYmFja0luZm8gKyAxMik7IC8vIHRoaXNUeXBlSWRcclxuICAgICAgICAgICAgd2FzbUFwaS5QQXBpQ2FsbGJhY2tXaXRoU2NvcGUoY2FsbGJhY2ssIHBhcGksIGNhbGxiYWNrSW5mbyk7IC8vIOmihOacn3dhc23lj6rkvJrpgJrov4d0aHJvd19ieV9zdHJpbmfmipvlvILluLjvvIzkuI3kuqfnlJ/nm7TmjqVqc+W8guW4uFxyXG4gICAgICAgICAgICBpZiAoaGFzRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMod2FzbUFwaSwgb2JqTWFwcGVyLCBjYWxsYmFja0luZm8gKyAxNiwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICByZXR1cm5OYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgY2FsbGJhY2tJbmZvKTtcclxuICAgICAgICAgICAgc2NvcGUuY2xvc2Uod2FzbUFwaSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG4vLyDpnIDopoHlnKhVbml0eemHjOiwg+eUqFBsYXllclNldHRpbmdzLldlYkdMLmVtc2NyaXB0ZW5BcmdzID0gXCIgLXMgQUxMT1dfVEFCTEVfR1JPV1RIPTFcIjtcclxuZnVuY3Rpb24gV2ViR0xGRklBcGkoZW5naW5lKSB7XHJcbiAgICB3YXNtQXBpID0gZW5naW5lLnVuaXR5QXBpO1xyXG4gICAgb2JqTWFwcGVyID0gbmV3IE9iamVjdE1hcHBlcigpO1xyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9hcnJheShlbnYpIHtcclxuICAgICAgICByZXR1cm4gU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoW10pO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9vYmplY3QoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKE9iamVjdC5jcmVhdGUobnVsbCkpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9mdW5jdGlvbihlbnYsIG5hdGl2ZV9pbXBsLCBkYXRhLCBmaW5hbGl6ZSAvLyBUT0RPOiBnY+aXtuiwg+eUqGZpbmFsaXplXHJcbiAgICApIHtcclxuICAgICAgICBjb25zdCBqc0NhbGxiYWNrID0gZ2VuSnNDYWxsYmFjayhlbmdpbmUudW5pdHlBcGksIG5hdGl2ZV9pbXBsLCBkYXRhLCB3ZWJnbEZGSSwgZmFsc2UpO1xyXG4gICAgICAgIHJldHVybiBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShqc0NhbGxiYWNrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfY2xhc3MoZW52LCB0eXBlSWQpIHtcclxuICAgICAgICBjb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkubG9hZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgY2xzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYGNyZWF0ZSBjbGFzczogJHtjbHMubmFtZX1gKTtcclxuICAgICAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGNscyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbid0IGxvYWQgY2xhc3MgYnkgdHlwZSBpZDogXCIgKyB0eXBlSWQpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9hcnJheV9sZW5ndGgoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBhcnJheSA9IFNjb3BlLmdldEN1cnJlbnQoKS5nZXRGcm9tU2NvcGUocHZhbHVlKTtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoOiB2YWx1ZSBpcyBub3QgYW4gYXJyYXlcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnJheS5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfbmF0aXZlX29iamVjdF90b192YWx1ZShlbnYsIHR5cGVJZCwgb2JqZWN0X3B0ciwgY2FsbF9maW5hbGl6ZSkge1xyXG4gICAgICAgIGNvbnN0IGpzT2JqID0gb2JqTWFwcGVyLnB1c2hOYXRpdmVPYmplY3Qob2JqZWN0X3B0ciwgdHlwZUlkLCBjYWxsX2ZpbmFsaXplKTtcclxuICAgICAgICAvLyBUT0RPOiBqdXN0IGZvciB0ZXN0XHJcbiAgICAgICAgLy9jb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkuZmluZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIC8vaWYgKGNscy5uYW1lID09IFwiSnNFbnZcIikge1xyXG4gICAgICAgIC8vICAgIGNvbnNvbGUubG9nKGBjYWxsIEZpbGVFeGlzdHMoYWFiYi50eHQpOiAkeyhqc09iaiBhcyBhbnkpLmxvYWRlci5GaWxlRXhpc3RzKFwiYWFiYi50eHRcIil9YCk7XHJcbiAgICAgICAgLy8gICAgY29uc29sZS5sb2coYGNhbGwgRmlsZUV4aXN0cyhwdWVydHMvZXNtX2Jvb3RzdHJhcC5janMpOiAkeyhqc09iaiBhcyBhbnkpLmxvYWRlci5GaWxlRXhpc3RzKFwicHVlcnRzL2VzbV9ib290c3RyYXAuY2pzXCIpfWApO1xyXG4gICAgICAgIC8vfVxyXG4gICAgICAgIHJldHVybiBvYmplY3RfcHRyO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3Rocm93X2J5X3N0cmluZyhwaW5mbywgcG1zZykge1xyXG4gICAgICAgIGNvbnN0IG1zZyA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocG1zZyk7XHJcbiAgICAgICAgc2V0TGFzdEV4Y2VwdGlvbihuZXcgRXJyb3IobXNnKSk7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5L2c55So5Z+f566h55CGIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGUocGVudl9yZWYpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50KHBlbnZfcmVmLCBtZW1vcnkpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2hhc19jYXVnaHQocHNjb3BlKSB7XHJcbiAgICAgICAgcmV0dXJuIGhhc0V4Y2VwdGlvbjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfZXhjZXB0aW9uX2FzX3N0cmluZyhwc2NvcGUsIHdpdGhfc3RhY2spIHtcclxuICAgICAgICByZXR1cm4gZ2V0RXhjZXB0aW9uQXNOYXRpdmVTdHJpbmcoZW5naW5lLnVuaXR5QXBpLCB3aXRoX3N0YWNrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jbG9zZV9zY29wZShwc2NvcGUpIHtcclxuICAgICAgICBTY29wZS5leGl0KGVuZ2luZS51bml0eUFwaSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50KHBzY29wZSkge1xyXG4gICAgICAgIFNjb3BlLmV4aXQoZW5naW5lLnVuaXR5QXBpKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlZmVyZW5jZWRWYWx1ZXMgPSBuZXcgU3BhcnNlQXJyYXkoKTtcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmKGVudiwgcHZhbHVlLCBpbnRlcm5hbF9maWVsZF9jb3VudCkge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHB2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHJlZmVyZW5jZWRWYWx1ZXMuYWRkKHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZihwdmFsdWVfcmVmKSB7XHJcbiAgICAgICAgcmVmZXJlbmNlZFZhbHVlcy5yZW1vdmUocHZhbHVlX3JlZik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmKGVudiwgcHZhbHVlX3JlZiwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSByZWZlcmVuY2VkVmFsdWVzLmdldChwdmFsdWVfcmVmKTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCB2YWx1ZSwgcHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCB2YWx1ZSwgcHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9zZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcml2YXRlKGVudiwgcG9iamVjdCwgb3V0X3B0cikge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwb2JqZWN0KTtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgMCwgb3V0X3B0cik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgb2JqWydfX3BfcHJpdmF0ZV9kYXRhJ10sIG91dF9wdHIpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9wcml2YXRlKGVudiwgcG9iamVjdCwgcHRyKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnICYmIHR5cGVvZiBvYmogIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9ialsnX19wX3ByaXZhdGVfZGF0YSddID0gcHRyO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcm9wZXJ0eV91aW50MzIoZW52LCBwb2JqZWN0LCBrZXksIHB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwb2JqZWN0KTtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMjogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAganNWYWx1ZVRvUGFwaVZhbHVlKGVuZ2luZS51bml0eUFwaSwgdmFsdWUsIHB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMihlbnYsIHBvYmplY3QsIGtleSwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcHJvcGVydHlfdWludDMyOiB0YXJnZXQgaXMgbm90IGFuIG9iamVjdFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWHveaVsOiwg+eUqC/miafooYwgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2FsbF9mdW5jdGlvbihlbnYsIHBmdW5jLCB0aGlzX29iamVjdCwgYXJnYywgYXJndiwgcHJlc3VsdCkge1xyXG4gICAgICAgIGNvbnN0IGZ1bmMgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcGZ1bmMpO1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgdGhpc19vYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jYWxsX2Z1bmN0aW9uOiB0YXJnZXQgaXMgbm90IGEgZnVuY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGhlYXAgPSBlbmdpbmUudW5pdHlBcGkuSEVBUFU4O1xyXG4gICAgICAgIGNvbnN0IGFyZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ2M7ICsraSkge1xyXG4gICAgICAgICAgICBjb25zdCBhcmdQdHIgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIGFyZ3YgKyBpICogNCk7XHJcbiAgICAgICAgICAgIGFyZ3MucHVzaChTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgYXJnUHRyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncyk7XHJcbiAgICAgICAgICAgIGpzVmFsdWVUb1BhcGlWYWx1ZShlbmdpbmUudW5pdHlBcGksIHJlc3VsdCwgcHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHNldExhc3RFeGNlcHRpb24oZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8g5ZKMcGVzYXBpLmjlo7DmmI7kuI3kuIDmoLfvvIzov5nmlLnkuLrov5Tlm57lgLzmjIfpkojnlLHosIPnlKjogIXvvIjljp/nlJ/vvInkvKDlhaVcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9ldmFsKGVudiwgcGNvZGUsIGNvZGVfc2l6ZSwgcGF0aCwgcHJlc3VsdCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghZ2xvYmFsVGhpcy5ldmFsKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJldmFsIGlzIG5vdCBzdXBwb3J0ZWRcIik7IC8vIFRPRE86IOaKm+e7mXdhc23mm7TlkIjpgILkuptcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjb2RlID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhwY29kZSwgY29kZV9zaXplKTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZ2xvYmFsVGhpcy5ldmFsKGNvZGUpO1xyXG4gICAgICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCByZXN1bHQsIHByZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBzZXRMYXN0RXhjZXB0aW9uKGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nbG9iYWwoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGdsb2JhbFRoaXMpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9lbnZfcHJpdmF0ZShlbnYsIHB0cikge1xyXG4gICAgICAgIG9iak1hcHBlci5zZXRFbnZQcml2YXRlKHB0cik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfdHJhY2VfbmF0aXZlX29iamVjdF9saWZlY3ljbGUoZW52LCBvbkVudGVyLCBvbkV4aXQpIHtcclxuICAgICAgICBjb25zdCBlbnRlckNhbGxiYWNrID0gZW5naW5lLnVuaXR5QXBpLmdldFdhc21UYWJsZUVudHJ5KG9uRW50ZXIpO1xyXG4gICAgICAgIGNvbnN0IGV4aXRDYWxsYmFjayA9IGVuZ2luZS51bml0eUFwaS5nZXRXYXNtVGFibGVFbnRyeShvbkV4aXQpO1xyXG4gICAgICAgIG9iak1hcHBlci50cmFjZU5hdGl2ZU9iamVjdChlbnRlckNhbGxiYWNrLCBleGl0Q2FsbGJhY2spO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9yZWdpc3RyeShlbnYsIHJlZ2lzdHJ5Xykge1xyXG4gICAgICAgIHJlZ2lzdHJ5ID0gcmVnaXN0cnlfO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gVHJhblRvU3RyaW5nKHB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHB2YWx1ZSk7XHJcbiAgICAgICAgY29uc3Qgc3RyID0gdmFsdWUudG9TdHJpbmcoKTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCBzdHIsIHB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIEdldFdlYkdMRkZJQXBpOiBHZXRXZWJHTEZGSUFwaSxcclxuICAgICAgICBHZXRXZWJHTFBhcGlWZXJzaW9uOiBHZXRXZWJHTFBhcGlWZXJzaW9uLFxyXG4gICAgICAgIENyZWF0ZVdlYkdMUGFwaUVudlJlZjogQ3JlYXRlV2ViR0xQYXBpRW52UmVmLFxyXG4gICAgICAgIFRyYW5Ub1N0cmluZzogVHJhblRvU3RyaW5nLFxyXG4gICAgICAgIHBlc2FwaV9jcmVhdGVfYXJyYXlfanM6IHBlc2FwaV9jcmVhdGVfYXJyYXksXHJcbiAgICAgICAgcGVzYXBpX2NyZWF0ZV9vYmplY3RfanM6IHBlc2FwaV9jcmVhdGVfb2JqZWN0LFxyXG4gICAgICAgIHBlc2FwaV9jcmVhdGVfZnVuY3Rpb25fanM6IHBlc2FwaV9jcmVhdGVfZnVuY3Rpb24sXHJcbiAgICAgICAgcGVzYXBpX2NyZWF0ZV9jbGFzc19qczogcGVzYXBpX2NyZWF0ZV9jbGFzcyxcclxuICAgICAgICBwZXNhcGlfZ2V0X2FycmF5X2xlbmd0aF9qczogcGVzYXBpX2dldF9hcnJheV9sZW5ndGgsXHJcbiAgICAgICAgcGVzYXBpX25hdGl2ZV9vYmplY3RfdG9fdmFsdWVfanM6IHBlc2FwaV9uYXRpdmVfb2JqZWN0X3RvX3ZhbHVlLFxyXG4gICAgICAgIHBlc2FwaV90aHJvd19ieV9zdHJpbmdfanM6IHBlc2FwaV90aHJvd19ieV9zdHJpbmcsXHJcbiAgICAgICAgcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50X2pzOiBwZXNhcGlfb3Blbl9zY29wZV9wbGFjZW1lbnQsXHJcbiAgICAgICAgcGVzYXBpX2hhc19jYXVnaHRfanM6IHBlc2FwaV9oYXNfY2F1Z2h0LFxyXG4gICAgICAgIHBlc2FwaV9nZXRfZXhjZXB0aW9uX2FzX3N0cmluZ19qczogcGVzYXBpX2dldF9leGNlcHRpb25fYXNfc3RyaW5nLFxyXG4gICAgICAgIHBlc2FwaV9jbG9zZV9zY29wZV9wbGFjZW1lbnRfanM6IHBlc2FwaV9jbG9zZV9zY29wZV9wbGFjZW1lbnQsXHJcbiAgICAgICAgcGVzYXBpX2NyZWF0ZV92YWx1ZV9yZWZfanM6IHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmLFxyXG4gICAgICAgIHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZl9qczogcGVzYXBpX3JlbGVhc2VfdmFsdWVfcmVmLFxyXG4gICAgICAgIHBlc2FwaV9nZXRfdmFsdWVfZnJvbV9yZWZfanM6IHBlc2FwaV9nZXRfdmFsdWVfZnJvbV9yZWYsXHJcbiAgICAgICAgcGVzYXBpX2dldF9wcm9wZXJ0eV9qczogcGVzYXBpX2dldF9wcm9wZXJ0eSxcclxuICAgICAgICBwZXNhcGlfc2V0X3Byb3BlcnR5X2pzOiBwZXNhcGlfc2V0X3Byb3BlcnR5LFxyXG4gICAgICAgIHBlc2FwaV9nZXRfcHJpdmF0ZV9qczogcGVzYXBpX2dldF9wcml2YXRlLFxyXG4gICAgICAgIHBlc2FwaV9zZXRfcHJpdmF0ZV9qczogcGVzYXBpX3NldF9wcml2YXRlLFxyXG4gICAgICAgIHBlc2FwaV9nZXRfcHJvcGVydHlfdWludDMyX2pzOiBwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMixcclxuICAgICAgICBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMl9qczogcGVzYXBpX3NldF9wcm9wZXJ0eV91aW50MzIsXHJcbiAgICAgICAgcGVzYXBpX2NhbGxfZnVuY3Rpb25fanM6IHBlc2FwaV9jYWxsX2Z1bmN0aW9uLFxyXG4gICAgICAgIHBlc2FwaV9ldmFsX2pzOiBwZXNhcGlfZXZhbCxcclxuICAgICAgICBwZXNhcGlfZ2xvYmFsX2pzOiBwZXNhcGlfZ2xvYmFsLFxyXG4gICAgICAgIHBlc2FwaV9zZXRfZW52X3ByaXZhdGVfanM6IHBlc2FwaV9zZXRfZW52X3ByaXZhdGUsXHJcbiAgICAgICAgcGVzYXBpX3RyYWNlX25hdGl2ZV9vYmplY3RfbGlmZWN5Y2xlX2pzOiBwZXNhcGlfdHJhY2VfbmF0aXZlX29iamVjdF9saWZlY3ljbGUsXHJcbiAgICAgICAgcGVzYXBpX3NldF9yZWdpc3RyeV9qczogcGVzYXBpX3NldF9yZWdpc3RyeVxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLldlYkdMRkZJQXBpID0gV2ViR0xGRklBcGk7XHJcbmZ1bmN0aW9uIEdldFdlYkdMRkZJQXBpKCkge1xyXG4gICAgaWYgKHdlYmdsRkZJKVxyXG4gICAgICAgIHJldHVybiB3ZWJnbEZGSTtcclxuICAgIHdlYmdsRkZJID0gd2FzbUFwaS5JbmplY3RQYXBpR0xOYXRpdmVJbXBsKCk7XHJcbiAgICByZXR1cm4gd2ViZ2xGRkk7XHJcbn1cclxuZnVuY3Rpb24gR2V0V2ViR0xQYXBpVmVyc2lvbigpIHtcclxuICAgIHJldHVybiAxMTtcclxufVxyXG5mdW5jdGlvbiBDcmVhdGVXZWJHTFBhcGlFbnZSZWYoKSB7XHJcbiAgICByZXR1cm4gMjA0ODsgLy8ganVzdCBub3QgbnVsbHB0clxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBlc2FwaUltcGwuanMubWFwIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qXHJcbiogVGVuY2VudCBpcyBwbGVhc2VkIHRvIHN1cHBvcnQgdGhlIG9wZW4gc291cmNlIGNvbW11bml0eSBieSBtYWtpbmcgUHVlcnRzIGF2YWlsYWJsZS5cclxuKiBDb3B5cmlnaHQgKEMpIDIwMjAgVGVuY2VudC4gIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiogUHVlcnRzIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0QgMy1DbGF1c2UgTGljZW5zZSwgZXhjZXB0IGZvciB0aGUgdGhpcmQtcGFydHkgY29tcG9uZW50cyBsaXN0ZWQgaW4gdGhlIGZpbGUgJ0xJQ0VOU0UnIHdoaWNoIG1heSBiZSBzdWJqZWN0IHRvIHRoZWlyIGNvcnJlc3BvbmRpbmcgbGljZW5zZSB0ZXJtcy5cclxuKiBUaGlzIGZpbGUgaXMgc3ViamVjdCB0byB0aGUgdGVybXMgYW5kIGNvbmRpdGlvbnMgZGVmaW5lZCBpbiBmaWxlICdMSUNFTlNFJywgd2hpY2ggaXMgcGFydCBvZiB0aGlzIHNvdXJjZSBjb2RlIHBhY2thZ2UuXHJcbiovXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuLyoqXHJcbiAqIOagueaNriBodHRwczovL2RvY3MudW5pdHkzZC5jb20vMjAxOC40L0RvY3VtZW50YXRpb24vTWFudWFsL3dlYmdsLWludGVyYWN0aW5nd2l0aGJyb3dzZXJzY3JpcHRpbmcuaHRtbFxyXG4gKiDmiJHku6znmoTnm67nmoTlsLHmmK/lnKhXZWJHTOaooeW8j+S4i++8jOWunueOsOWSjHB1ZXJ0cy5kbGznmoTmlYjmnpzjgILlhbfkvZPlnKjkuo7lrp7njrDkuIDkuKpqc2xpYu+8jOmHjOmdouW6lOWMheWQq1B1ZXJ0c0RMTC5jc+eahOaJgOacieaOpeWPo1xyXG4gKiDlrp7pqozlj5HnjrDov5nkuKpqc2xpYuiZveeEtuS5n+aYr+i/kOihjOWcqHY455qEanPvvIzkvYblr7lkZXZ0b29s6LCD6K+V5bm25LiN5Y+L5aW977yM5LiU5Y+q5pSv5oyB5YiwZXM144CCXHJcbiAqIOWboOatpOW6lOivpemAmui/h+S4gOS4queLrOeri+eahGpz5a6e546w5o6l5Y+j77yMcHVlcnRzLmpzbGli6YCa6L+H5YWo5bGA55qE5pa55byP6LCD55So5a6D44CCXHJcbiAqXHJcbiAqIOacgOe7iOW9ouaIkOWmguS4i+aetuaehFxyXG4gKiDkuJrliqFKUyA8LT4gV0FTTSA8LT4gdW5pdHkganNsaWIgPC0+IOacrGpzXHJcbiAqIOS9huaVtOadoemTvui3r+WFtuWunumDveWcqOS4gOS4qnY4KGpzY29yZSnomZrmi5/mnLrph4xcclxuICovXHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuL2xpYnJhcnlcIik7XHJcbmNvbnN0IHBlc2FwaUltcGxfMSA9IHJlcXVpcmUoXCIuL3Blc2FwaUltcGxcIik7XHJcbmxpYnJhcnlfMS5nbG9iYWwud3hSZXF1aXJlID0gbGlicmFyeV8xLmdsb2JhbC5yZXF1aXJlO1xyXG5saWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMID0ge1xyXG4gICAgaW5pdGVkOiBmYWxzZSxcclxuICAgIGRlYnVnOiBmYWxzZSxcclxuICAgIC8vIHB1ZXJ0c+mmluasoeWIneWni+WMluaXtuS8muiwg+eUqOi/memHjO+8jOW5tuaKilVuaXR555qE6YCa5L+h5o6l5Y+j5Lyg5YWlXHJcbiAgICBJbml0KGN0b3JQYXJhbSkge1xyXG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IG5ldyBsaWJyYXJ5XzEuUHVlcnRzSlNFbmdpbmUoY3RvclBhcmFtKTtcclxuICAgICAgICBjb25zdCBleGVjdXRlTW9kdWxlQ2FjaGUgPSB7fTtcclxuICAgICAgICBsZXQganNFbmdpbmVSZXR1cm5lZCA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBsb2FkZXI7XHJcbiAgICAgICAgLy8gUHVlcnRzRExM55qE5omA5pyJ5o6l5Y+j5a6e546wXHJcbiAgICAgICAgbGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IE9iamVjdC5hc3NpZ24obGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCwge1xyXG4gICAgICAgICAgICB1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3czogZW5naW5lLnVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzLmJpbmQoZW5naW5lKVxyXG4gICAgICAgIH0sICgwLCBwZXNhcGlJbXBsXzEuV2ViR0xGRklBcGkpKGVuZ2luZSksIHtcclxuICAgICAgICAgICAgLy8gYnJpZGdlTG9nOiB0cnVlLFxyXG4gICAgICAgICAgICBMb3dNZW1vcnlOb3RpZmljYXRpb246IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIElkbGVOb3RpZmljYXRpb25EZWFkbGluZTogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgUmVxdWVzdE1pbm9yR2FyYmFnZUNvbGxlY3Rpb25Gb3JUZXN0aW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBSZXF1ZXN0RnVsbEdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgQ2xlYXJNb2R1bGVDYWNoZTogZnVuY3Rpb24gKCkgeyB9LFxyXG4gICAgICAgICAgICBDcmVhdGVJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlLCBwb3J0KSB7IH0sXHJcbiAgICAgICAgICAgIERlc3Ryb3lJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIEluc3BlY3RvclRpY2s6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIExvZ2ljVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgU2V0TG9nQ2FsbGJhY2s6IGZ1bmN0aW9uIChsb2csIGxvZ1dhcm5pbmcsIGxvZ0Vycm9yKSB7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEpTU3RhY2tUcmFjZTogZnVuY3Rpb24gKGlzb2xhdGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoKS5zdGFjaztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0V2ViR0xQYXBpRW52UmVmOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMjA0ODsgLy8ganVzdCBub3QgbnVsbHB0clxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==