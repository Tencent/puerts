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
        const { UTF8ToString, UTF16ToString, _malloc, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, stringToUTF16, lengthBytesUTF16, stackSave, stackRestore, stackAlloc, getWasmTableEntry, addFunction, removeFunction, _CallCSharpFunctionCallback, _CallCSharpConstructorCallback, _CallCSharpDestructorCallback, InjectPapiGLNativeImpl, PApiCallbackWithScope, PApiConstructorWithScope, find_class_by_id, load_class_by_id, get_class_name, get_class_initialize, get_class_finalize, get_class_type_id, get_class_super_type_id, get_class_methods, get_class_functions, get_class_properties, get_class_variables, get_next_property_info, get_next_function_info, get_property_info_name, get_property_info_getter, get_property_info_setter, get_function_info_name, get_function_info_callback, get_class_data, get_class_on_enter, get_class_on_exit, get_property_info_getter_data, get_property_info_setter_data, get_function_info_data, HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64, } = ctorParam;
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
            get_class_on_enter,
            get_class_on_exit,
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
        const enterCallback = wasmApi.getWasmTableEntry(wasmApi.get_class_on_enter(typeDef));
        const exitCallback = wasmApi.getWasmTableEntry(wasmApi.get_class_on_exit(typeDef));
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
        this.registerClass(typeId, PApiNativeObject, wasmApi.getWasmTableEntry(finalize), data, enterCallback, exitCallback);
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
    registerClass(typeId, cls, finalize, clsData, enter, exit) {
        const infos = { typeId, finalize, data: clsData, enter, exit };
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
    //private onEnter: (objId: number, data: number, privateData: number) => number = undefined;
    //private onExit: (objId: number, data: number, privateData: number, ud: number) => void = undefined;
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
        const { data, enter } = cls.$Infos;
        if (enter) {
            const ud = enter(objId, data, this.privateData);
            this.objId2ud.set(objId, ud);
        }
    }
    setEnvPrivate(privateData) {
        this.privateData = privateData;
    }
    OnNativeObjectFinalized(objId, typeId, callFinalize) {
        //console.error(`OnNativeObjectFinalized ${objId}`);
        const cls = ClassRegister.getInstance().findClassById(typeId);
        const { finalize, data, exit } = cls.$Infos;
        if (callFinalize && finalize) {
            finalize(webglFFI, objId, data, this.privateData);
        }
        if (exit && this.objId2ud.has(objId)) {
            const ud = this.objId2ud.get(objId);
            this.objId2ud.delete(objId);
            exit(objId, data, this.privateData, ud);
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
        return 1;
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
        return 1;
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
    function pesapi_set_registry(env, registry_) {
        registry = registry_;
    }
    function TranToString(pvalue) {
        const value = Scope.getCurrent().toJs(engine.unityApi, objMapper, pvalue);
        if (typeof value == 'undefined') {
        }
        const str = (typeof value === 'undefined') ? "undefined" : (value === null ? "null" : value.toString());
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVlcnRzLXJ1bnRpbWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGlCQUFpQixHQUFHLGdCQUFnQjtBQUM3WjtBQUNBO0FBQ0EsMkJBQTJCLE1BQU0sMkJBQTJCLE1BQU07QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixrQkFBa0IsNkJBQTZCLE1BQU07QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsa0JBQWtCLGFBQWEsY0FBYyxTQUFTLFFBQVEsVUFBVSxNQUFNO0FBQ3JHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsS0FBSyxTQUFTLEtBQUssVUFBVSxNQUFNO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25COzs7Ozs7Ozs7O0FDelNhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELHNCQUFzQixHQUFHLGNBQWM7QUFDdkMsY0FBYyxHQUFHLHFCQUFNLEdBQUcscUJBQU07QUFDaEMscUJBQU0sVUFBVSxxQkFBTTtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQiwwN0JBQTA3QjtBQUMxOEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLHFCQUFNLDJEQUEyRDtBQUN6RSxRQUFRLHFCQUFNO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLHFCQUFNO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7Ozs7Ozs7Ozs7QUN4R2E7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QsbUJBQW1CO0FBQ25CLGVBQWUsbUJBQU8sQ0FBQyxvQ0FBVTtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrRkFBK0YsS0FBSztBQUNwRztBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxzQkFBc0I7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsSUFBSSxJQUFJLE1BQU07QUFDbkQ7QUFDQTtBQUNBLHdCQUF3QixjQUFjO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBLHFEQUFxRCxVQUFVLEtBQUssT0FBTztBQUMzRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsUUFBUTtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzREFBc0Q7QUFDdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEVBQTBFO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEVBQTBFO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEVBQTBFO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QyxRQUFRO0FBQ3JEO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJFQUEyRTtBQUMzRSxxR0FBcUc7QUFDckc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsYUFBYTtBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDLE1BQU0sRUFBRSxVQUFVO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxNQUFNLEVBQUUsVUFBVTtBQUN6RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsTUFBTSxFQUFFLFVBQVU7QUFDekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDLE1BQU0sRUFBRSxVQUFVO0FBQ3pEO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxNQUFNLEVBQUUsUUFBUSxFQUFFLFlBQVk7QUFDNUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLGNBQWM7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbURBQW1ELE1BQU07QUFDekQ7QUFDQSxnQkFBZ0IsdUJBQXVCO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtGQUFrRjtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0I7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdEO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0I7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdEO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFEQUFxRCxXQUFXO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLFVBQVU7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUNBQXlDO0FBQ3pDLDZEQUE2RDtBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUseUVBQXlFO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsU0FBUztBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdEQUF3RCw2Q0FBNkM7QUFDckcsd0VBQXdFLDZEQUE2RDtBQUNySTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsVUFBVTtBQUNsQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQ7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7Ozs7OztVQ3ZnQ0E7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxHQUFHO1dBQ0g7V0FDQTtXQUNBLENBQUM7Ozs7Ozs7Ozs7O0FDUFk7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsbUJBQU8sQ0FBQyxzQ0FBVztBQUNyQyxxQkFBcUIsbUJBQU8sQ0FBQyw0Q0FBYztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBLHlEQUF5RDtBQUN6RCw0REFBNEQ7QUFDNUQsMkVBQTJFO0FBQzNFLDBFQUEwRTtBQUMxRSw2Q0FBNkM7QUFDN0MseURBQXlEO0FBQ3pELG9EQUFvRDtBQUNwRCxpREFBaUQ7QUFDakQsNkNBQTZDO0FBQzdDO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGlDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2J1ZmZlci5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbGlicmFyeS5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvcGVzYXBpSW1wbC5qcyIsIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG4vKlxyXG4qIFRlbmNlbnQgaXMgcGxlYXNlZCB0byBzdXBwb3J0IHRoZSBvcGVuIHNvdXJjZSBjb21tdW5pdHkgYnkgbWFraW5nIFB1ZXJ0cyBhdmFpbGFibGUuXHJcbiogQ29weXJpZ2h0IChDKSAyMDIwIFRlbmNlbnQuICBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qIFB1ZXJ0cyBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNEIDMtQ2xhdXNlIExpY2Vuc2UsIGV4Y2VwdCBmb3IgdGhlIHRoaXJkLXBhcnR5IGNvbXBvbmVudHMgbGlzdGVkIGluIHRoZSBmaWxlICdMSUNFTlNFJyB3aGljaCBtYXkgYmUgc3ViamVjdCB0byB0aGVpciBjb3JyZXNwb25kaW5nIGxpY2Vuc2UgdGVybXMuXHJcbiogVGhpcyBmaWxlIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIGFuZCBjb25kaXRpb25zIGRlZmluZWQgaW4gZmlsZSAnTElDRU5TRScsIHdoaWNoIGlzIHBhcnQgb2YgdGhpcyBzb3VyY2UgY29kZSBwYWNrYWdlLlxyXG4qL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMud3JpdGVEb3VibGUgPSBleHBvcnRzLndyaXRlRmxvYXQgPSBleHBvcnRzLndyaXRlVUludDY0ID0gZXhwb3J0cy53cml0ZUludDY0ID0gZXhwb3J0cy53cml0ZVVJbnQzMiA9IGV4cG9ydHMud3JpdGVJbnQzMiA9IGV4cG9ydHMud3JpdGVVSW50MTYgPSBleHBvcnRzLndyaXRlSW50MTYgPSBleHBvcnRzLndyaXRlVUludDggPSBleHBvcnRzLndyaXRlSW50OCA9IGV4cG9ydHMucmVhZERvdWJsZSA9IGV4cG9ydHMucmVhZEZsb2F0ID0gZXhwb3J0cy5yZWFkVUludDY0ID0gZXhwb3J0cy5yZWFkSW50NjQgPSBleHBvcnRzLnJlYWRVSW50MzIgPSBleHBvcnRzLnJlYWRJbnQzMiA9IGV4cG9ydHMucmVhZFVJbnQxNiA9IGV4cG9ydHMucmVhZEludDE2ID0gZXhwb3J0cy5yZWFkVUludDggPSBleHBvcnRzLnJlYWRJbnQ4ID0gdm9pZCAwO1xyXG5mdW5jdGlvbiB2YWxpZGF0ZU51bWJlcih2YWx1ZSwgdHlwZSkge1xyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gZXhwZWN0cyBhIG51bWJlciBidXQgZ290ICR7dmFsdWV9YCk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gYm91bmRzRXJyb3IodmFsdWUsIGxlbmd0aCwgdHlwZSkge1xyXG4gICAgaWYgKE1hdGguZmxvb3IodmFsdWUpICE9PSB2YWx1ZSkge1xyXG4gICAgICAgIHZhbGlkYXRlTnVtYmVyKHZhbHVlLCB0eXBlIHx8ICdvZmZzZXQnKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZSB8fCAnb2Zmc2V0J30gZXhwZWN0cyBhbiBpbnRlZ2VyIGJ1dCBnb3QgJHt2YWx1ZX1gKTtcclxuICAgIH1cclxuICAgIGlmIChsZW5ndGggPCAwKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwib3V0IG9mIGJvdW5kXCIpO1xyXG4gICAgfVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKGAke3R5cGUgfHwgJ29mZnNldCd9IGV4cGVjdHMgPj0gJHt0eXBlID8gMSA6IDB9IGFuZCA8PSAke2xlbmd0aH0gYnV0IGdvdCAke3ZhbHVlfWApO1xyXG59XHJcbmZ1bmN0aW9uIGNoZWNrQm91bmRzKGJ1Ziwgb2Zmc2V0LCBieXRlTGVuZ3RoKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGlmIChidWZbb2Zmc2V0XSA9PT0gdW5kZWZpbmVkIHx8IGJ1ZltvZmZzZXQgKyBieXRlTGVuZ3RoXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWYubGVuZ3RoIC0gKGJ5dGVMZW5ndGggKyAxKSk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gd3JpdGVVX0ludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBtaW4sIG1heCkge1xyXG4gICAgdmFsdWUgPSArdmFsdWU7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdmFsdWUgZXhwZWN0cyA+PSAke21pbn0gYW5kIDw9ICR7bWF4fSBidXQgZ290ICR7dmFsdWV9YCk7XHJcbiAgICB9XHJcbiAgICBpZiAoYnVmW29mZnNldF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmLmxlbmd0aCAtIDEpO1xyXG4gICAgfVxyXG4gICAgYnVmW29mZnNldF0gPSB2YWx1ZTtcclxuICAgIHJldHVybiBvZmZzZXQgKyAxO1xyXG59XHJcbmZ1bmN0aW9uIHJlYWRJbnQ4KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgdmFsID0gYnVmZltvZmZzZXRdO1xyXG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDEpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbCB8ICh2YWwgJiAyICoqIDcpICogMHgxZmZmZmZlO1xyXG59XHJcbmV4cG9ydHMucmVhZEludDggPSByZWFkSW50ODtcclxuZnVuY3Rpb24gd3JpdGVJbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCA9IDApIHtcclxuICAgIHJldHVybiB3cml0ZVVfSW50OChidWYsIHZhbHVlLCBvZmZzZXQsIC0weDgwLCAweDdmKTtcclxufVxyXG5leHBvcnRzLndyaXRlSW50OCA9IHdyaXRlSW50ODtcclxuZnVuY3Rpb24gcmVhZFVJbnQ4KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgdmFsID0gYnVmZltvZmZzZXRdO1xyXG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDEpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbDtcclxufVxyXG5leHBvcnRzLnJlYWRVSW50OCA9IHJlYWRVSW50ODtcclxuZnVuY3Rpb24gd3JpdGVVSW50OChidWYsIHZhbHVlLCBvZmZzZXQgPSAwKSB7XHJcbiAgICByZXR1cm4gd3JpdGVVX0ludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0LCAwLCAweGZmKTtcclxufVxyXG5leHBvcnRzLndyaXRlVUludDggPSB3cml0ZVVJbnQ4O1xyXG5jb25zdCBpbnQxNkFycmF5ID0gbmV3IEludDE2QXJyYXkoMSk7XHJcbmNvbnN0IHVJbnQ4SW50NkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoaW50MTZBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkSW50MTYoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDFdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDIpO1xyXG4gICAgfVxyXG4gICAgdUludDhJbnQ2QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVJbnQ4SW50NkFycmF5WzFdID0gbGFzdDtcclxuICAgIHJldHVybiBpbnQxNkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZEludDE2ID0gcmVhZEludDE2O1xyXG5mdW5jdGlvbiB3cml0ZUludDE2KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMSk7XHJcbiAgICBpbnQxNkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEludDZBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhJbnQ2QXJyYXlbMV07XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVJbnQxNiA9IHdyaXRlSW50MTY7XHJcbmNvbnN0IHVpbnQxNkFycmF5ID0gbmV3IFVpbnQxNkFycmF5KDEpO1xyXG5jb25zdCB1aW50OFVpbnQxNkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkodWludDE2QXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZFVJbnQxNihidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgMV07XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMik7XHJcbiAgICB9XHJcbiAgICB1aW50OFVpbnQxNkFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OFVpbnQxNkFycmF5WzFdID0gbGFzdDtcclxuICAgIHJldHVybiB1aW50MTZBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRVSW50MTYgPSByZWFkVUludDE2O1xyXG5mdW5jdGlvbiB3cml0ZVVJbnQxNihidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDEpO1xyXG4gICAgdWludDE2QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDE2QXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDE2QXJyYXlbMV07XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVVSW50MTYgPSB3cml0ZVVJbnQxNjtcclxuY29uc3QgaW50MzJBcnJheSA9IG5ldyBJbnQzMkFycmF5KDEpO1xyXG5jb25zdCB1aW50OEludDMyQXJyYXkgPSBuZXcgVWludDhBcnJheShpbnQzMkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRJbnQzMihidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgM107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gNCk7XHJcbiAgICB9XHJcbiAgICB1aW50OEludDMyQXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4SW50MzJBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhJbnQzMkFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEludDMyQXJyYXlbM10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGludDMyQXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50MzIgPSByZWFkSW50MzI7XHJcbmZ1bmN0aW9uIHdyaXRlSW50MzIoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAzKTtcclxuICAgIGludDMyQXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4SW50MzJBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhJbnQzMkFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEludDMyQXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4SW50MzJBcnJheVszXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZUludDMyID0gd3JpdGVJbnQzMjtcclxuY29uc3QgdWludDMyQXJyYXkgPSBuZXcgVWludDMyQXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4VWludDMyQXJyYXkgPSBuZXcgVWludDhBcnJheSh1aW50MzJBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkVUludDMyKGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAzXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA0KTtcclxuICAgIH1cclxuICAgIHVpbnQ4VWludDMyQXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4VWludDMyQXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4VWludDMyQXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4VWludDMyQXJyYXlbM10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIHVpbnQzMkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQzMiA9IHJlYWRVSW50MzI7XHJcbmZ1bmN0aW9uIHdyaXRlVUludDMyKGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMyk7XHJcbiAgICB1aW50MzJBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MzJBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MzJBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MzJBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MzJBcnJheVszXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZVVJbnQzMiA9IHdyaXRlVUludDMyO1xyXG5jb25zdCBmbG9hdDMyQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KDEpO1xyXG5jb25zdCB1SW50OEZsb2F0MzJBcnJheSA9IG5ldyBVaW50OEFycmF5KGZsb2F0MzJBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkRmxvYXQoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDNdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDQpO1xyXG4gICAgfVxyXG4gICAgdUludDhGbG9hdDMyQXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVJbnQ4RmxvYXQzMkFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0MzJBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDMyQXJyYXlbM10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGZsb2F0MzJBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRGbG9hdCA9IHJlYWRGbG9hdDtcclxuZnVuY3Rpb24gd3JpdGVGbG9hdChidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDMpO1xyXG4gICAgZmxvYXQzMkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0MzJBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDMyQXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQzMkFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0MzJBcnJheVszXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZUZsb2F0ID0gd3JpdGVGbG9hdDtcclxuY29uc3QgZmxvYXQ2NEFycmF5ID0gbmV3IEZsb2F0NjRBcnJheSgxKTtcclxuY29uc3QgdUludDhGbG9hdDY0QXJyYXkgPSBuZXcgVWludDhBcnJheShmbG9hdDY0QXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZERvdWJsZShidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDddO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDgpO1xyXG4gICAgfVxyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbM10gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzRdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVs1XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbNl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzddID0gbGFzdDtcclxuICAgIHJldHVybiBmbG9hdDY0QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkRG91YmxlID0gcmVhZERvdWJsZTtcclxuZnVuY3Rpb24gd3JpdGVEb3VibGUoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCA3KTtcclxuICAgIGZsb2F0NjRBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbM107XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzRdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVs1XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbNl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzddO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlRG91YmxlID0gd3JpdGVEb3VibGU7XHJcbmNvbnN0IGJpZ0ludDY0QXJyYXkgPSBuZXcgQmlnSW50NjRBcnJheSgxKTtcclxuY29uc3QgdWludDhCaWdJbnQ2NEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYmlnSW50NjRBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkSW50NjQoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyA3XTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA4KTtcclxuICAgIH1cclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVszXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzRdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbNV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVs2XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzddID0gbGFzdDtcclxuICAgIHJldHVybiBiaWdJbnQ2NEFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZEludDY0ID0gcmVhZEludDY0O1xyXG5mdW5jdGlvbiB3cml0ZUludDY0KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gdHlwZW9mIHZhbCA9PT0gJ251bWJlcicgPyBCaWdJbnQodmFsKSA6IHZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgNyk7XHJcbiAgICBiaWdJbnQ2NEFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbM107XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVs0XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzVdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbNl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVs3XTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZUludDY0ID0gd3JpdGVJbnQ2NDtcclxuY29uc3QgYmlnVWludDY0QXJyYXkgPSBuZXcgQmlnVWludDY0QXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4QmlnVWludDY0QXJyYXkgPSBuZXcgVWludDhBcnJheShiaWdVaW50NjRBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkVUludDY0KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgN107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gOCk7XHJcbiAgICB9XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzNdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzRdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzVdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzZdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzddID0gbGFzdDtcclxuICAgIHJldHVybiBiaWdVaW50NjRBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRVSW50NjQgPSByZWFkVUludDY0O1xyXG5mdW5jdGlvbiB3cml0ZVVJbnQ2NChidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9IHR5cGVvZiB2YWwgPT09ICdudW1iZXInID8gQmlnSW50KHZhbCkgOiB2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDcpO1xyXG4gICAgYmlnVWludDY0QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbM107XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbNF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbNV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbNl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbN107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVVSW50NjQgPSB3cml0ZVVJbnQ2NDtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YnVmZmVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG4vKlxyXG4qIFRlbmNlbnQgaXMgcGxlYXNlZCB0byBzdXBwb3J0IHRoZSBvcGVuIHNvdXJjZSBjb21tdW5pdHkgYnkgbWFraW5nIFB1ZXJ0cyBhdmFpbGFibGUuXHJcbiogQ29weXJpZ2h0IChDKSAyMDIwIFRlbmNlbnQuICBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qIFB1ZXJ0cyBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNEIDMtQ2xhdXNlIExpY2Vuc2UsIGV4Y2VwdCBmb3IgdGhlIHRoaXJkLXBhcnR5IGNvbXBvbmVudHMgbGlzdGVkIGluIHRoZSBmaWxlICdMSUNFTlNFJyB3aGljaCBtYXkgYmUgc3ViamVjdCB0byB0aGVpciBjb3JyZXNwb25kaW5nIGxpY2Vuc2UgdGVybXMuXHJcbiogVGhpcyBmaWxlIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIGFuZCBjb25kaXRpb25zIGRlZmluZWQgaW4gZmlsZSAnTElDRU5TRScsIHdoaWNoIGlzIHBhcnQgb2YgdGhpcyBzb3VyY2UgY29kZSBwYWNrYWdlLlxyXG4qL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBleHBvcnRzLmdsb2JhbCA9IHZvaWQgMDtcclxuZXhwb3J0cy5nbG9iYWwgPSBnbG9iYWwgPSBnbG9iYWwgfHwgZ2xvYmFsVGhpcyB8fCB3aW5kb3c7XHJcbmdsb2JhbC5nbG9iYWwgPSBnbG9iYWw7XHJcbmNsYXNzIFB1ZXJ0c0pTRW5naW5lIHtcclxuICAgIHVuaXR5QXBpO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICBjb25zdHJ1Y3RvcihjdG9yUGFyYW0pIHtcclxuICAgICAgICBjb25zdCB7IFVURjhUb1N0cmluZywgVVRGMTZUb1N0cmluZywgX21hbGxvYywgX2ZyZWUsIF9zZXRUZW1wUmV0MCwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHN0cmluZ1RvVVRGMTYsIGxlbmd0aEJ5dGVzVVRGMTYsIHN0YWNrU2F2ZSwgc3RhY2tSZXN0b3JlLCBzdGFja0FsbG9jLCBnZXRXYXNtVGFibGVFbnRyeSwgYWRkRnVuY3Rpb24sIHJlbW92ZUZ1bmN0aW9uLCBfQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2ssIF9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjaywgX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssIEluamVjdFBhcGlHTE5hdGl2ZUltcGwsIFBBcGlDYWxsYmFja1dpdGhTY29wZSwgUEFwaUNvbnN0cnVjdG9yV2l0aFNjb3BlLCBmaW5kX2NsYXNzX2J5X2lkLCBsb2FkX2NsYXNzX2J5X2lkLCBnZXRfY2xhc3NfbmFtZSwgZ2V0X2NsYXNzX2luaXRpYWxpemUsIGdldF9jbGFzc19maW5hbGl6ZSwgZ2V0X2NsYXNzX3R5cGVfaWQsIGdldF9jbGFzc19zdXBlcl90eXBlX2lkLCBnZXRfY2xhc3NfbWV0aG9kcywgZ2V0X2NsYXNzX2Z1bmN0aW9ucywgZ2V0X2NsYXNzX3Byb3BlcnRpZXMsIGdldF9jbGFzc192YXJpYWJsZXMsIGdldF9uZXh0X3Byb3BlcnR5X2luZm8sIGdldF9uZXh0X2Z1bmN0aW9uX2luZm8sIGdldF9wcm9wZXJ0eV9pbmZvX25hbWUsIGdldF9wcm9wZXJ0eV9pbmZvX2dldHRlciwgZ2V0X3Byb3BlcnR5X2luZm9fc2V0dGVyLCBnZXRfZnVuY3Rpb25faW5mb19uYW1lLCBnZXRfZnVuY3Rpb25faW5mb19jYWxsYmFjaywgZ2V0X2NsYXNzX2RhdGEsIGdldF9jbGFzc19vbl9lbnRlciwgZ2V0X2NsYXNzX29uX2V4aXQsIGdldF9wcm9wZXJ0eV9pbmZvX2dldHRlcl9kYXRhLCBnZXRfcHJvcGVydHlfaW5mb19zZXR0ZXJfZGF0YSwgZ2V0X2Z1bmN0aW9uX2luZm9fZGF0YSwgSEVBUDgsIEhFQVBVOCwgSEVBUDMyLCBIRUFQRjMyLCBIRUFQRjY0LCB9ID0gY3RvclBhcmFtO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkgPSB7XHJcbiAgICAgICAgICAgIFVURjhUb1N0cmluZyxcclxuICAgICAgICAgICAgVVRGMTZUb1N0cmluZyxcclxuICAgICAgICAgICAgX21hbGxvYyxcclxuICAgICAgICAgICAgX2ZyZWUsXHJcbiAgICAgICAgICAgIF9zZXRUZW1wUmV0MCxcclxuICAgICAgICAgICAgc3RyaW5nVG9VVEY4LFxyXG4gICAgICAgICAgICBsZW5ndGhCeXRlc1VURjgsXHJcbiAgICAgICAgICAgIHN0cmluZ1RvVVRGMTYsXHJcbiAgICAgICAgICAgIGxlbmd0aEJ5dGVzVVRGMTYsXHJcbiAgICAgICAgICAgIHN0YWNrU2F2ZSxcclxuICAgICAgICAgICAgc3RhY2tSZXN0b3JlLFxyXG4gICAgICAgICAgICBzdGFja0FsbG9jLFxyXG4gICAgICAgICAgICBnZXRXYXNtVGFibGVFbnRyeSxcclxuICAgICAgICAgICAgYWRkRnVuY3Rpb24sXHJcbiAgICAgICAgICAgIHJlbW92ZUZ1bmN0aW9uLFxyXG4gICAgICAgICAgICBfQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIF9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayxcclxuICAgICAgICAgICAgX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIEluamVjdFBhcGlHTE5hdGl2ZUltcGwsXHJcbiAgICAgICAgICAgIFBBcGlDYWxsYmFja1dpdGhTY29wZSxcclxuICAgICAgICAgICAgUEFwaUNvbnN0cnVjdG9yV2l0aFNjb3BlLFxyXG4gICAgICAgICAgICBmaW5kX2NsYXNzX2J5X2lkLFxyXG4gICAgICAgICAgICBsb2FkX2NsYXNzX2J5X2lkLFxyXG4gICAgICAgICAgICBnZXRfY2xhc3NfbmFtZSxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX2luaXRpYWxpemUsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc19maW5hbGl6ZSxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX3R5cGVfaWQsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc19zdXBlcl90eXBlX2lkLFxyXG4gICAgICAgICAgICBnZXRfY2xhc3NfbWV0aG9kcyxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX2Z1bmN0aW9ucyxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX3Byb3BlcnRpZXMsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc192YXJpYWJsZXMsXHJcbiAgICAgICAgICAgIGdldF9uZXh0X3Byb3BlcnR5X2luZm8sXHJcbiAgICAgICAgICAgIGdldF9uZXh0X2Z1bmN0aW9uX2luZm8sXHJcbiAgICAgICAgICAgIGdldF9wcm9wZXJ0eV9pbmZvX25hbWUsXHJcbiAgICAgICAgICAgIGdldF9wcm9wZXJ0eV9pbmZvX2dldHRlcixcclxuICAgICAgICAgICAgZ2V0X3Byb3BlcnR5X2luZm9fc2V0dGVyLFxyXG4gICAgICAgICAgICBnZXRfZnVuY3Rpb25faW5mb19uYW1lLFxyXG4gICAgICAgICAgICBnZXRfZnVuY3Rpb25faW5mb19jYWxsYmFjayxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX2RhdGEsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc19vbl9lbnRlcixcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX29uX2V4aXQsXHJcbiAgICAgICAgICAgIGdldF9wcm9wZXJ0eV9pbmZvX2dldHRlcl9kYXRhLFxyXG4gICAgICAgICAgICBnZXRfcHJvcGVydHlfaW5mb19zZXR0ZXJfZGF0YSxcclxuICAgICAgICAgICAgZ2V0X2Z1bmN0aW9uX2luZm9fZGF0YSxcclxuICAgICAgICAgICAgSEVBUDgsXHJcbiAgICAgICAgICAgIEhFQVBVOCxcclxuICAgICAgICAgICAgSEVBUDMyLFxyXG4gICAgICAgICAgICBIRUFQRjMyLFxyXG4gICAgICAgICAgICBIRUFQRjY0LFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZ2xvYmFsLl9fdGdqc0V2YWxTY3JpcHQgPSB0eXBlb2YgZXZhbCA9PSBcInVuZGVmaW5lZFwiID8gKCkgPT4geyB9IDogZXZhbDtcclxuICAgICAgICBnbG9iYWwuX190Z2pzU2V0UHJvbWlzZVJlamVjdENhbGxiYWNrID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHd4Lm9uVW5oYW5kbGVkUmVqZWN0aW9uKGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5oYW5kbGVkcmVqZWN0aW9uXCIsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZ2xvYmFsLl9fcHVlcnRzR2V0TGFzdEV4Y2VwdGlvbiA9ICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFzdEV4Y2VwdGlvbjtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgLyoqIGNhbGwgd2hlbiB3YXNtIGdyb3cgbWVtb3J5ICovXHJcbiAgICB1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3cyhIRUFQOCwgSEVBUFU4LCBIRUFQMzIsIEhFQVBGMzIsIEhFQVBGNjQpIHtcclxuICAgICAgICBsZXQgdW5pdHlBcGkgPSB0aGlzLnVuaXR5QXBpO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVA4ID0gSEVBUDg7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUFU4ID0gSEVBUFU4O1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVAzMiA9IEhFQVAzMjtcclxuICAgICAgICB1bml0eUFwaS5IRUFQRjMyID0gSEVBUEYzMjtcclxuICAgICAgICB1bml0eUFwaS5IRUFQRjY0ID0gSEVBUEY2NDtcclxuICAgIH1cclxuICAgIG1lbWNweShkZXN0LCBzcmMsIG51bSkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuSEVBUFU4LmNvcHlXaXRoaW4oZGVzdCwgc3JjLCBzcmMgKyBudW0pO1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBzZWxmUHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVuaXR5QXBpLl9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxuICAgIGNhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5fQ2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBQdWVydHNKU0VuZ2luZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGlicmFyeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuLypcclxuKiBUZW5jZW50IGlzIHBsZWFzZWQgdG8gc3VwcG9ydCB0aGUgb3BlbiBzb3VyY2UgY29tbXVuaXR5IGJ5IG1ha2luZyBQdWVydHMgYXZhaWxhYmxlLlxyXG4qIENvcHlyaWdodCAoQykgMjAyMCBUZW5jZW50LiAgQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKiBQdWVydHMgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRCAzLUNsYXVzZSBMaWNlbnNlLCBleGNlcHQgZm9yIHRoZSB0aGlyZC1wYXJ0eSBjb21wb25lbnRzIGxpc3RlZCBpbiB0aGUgZmlsZSAnTElDRU5TRScgd2hpY2ggbWF5IGJlIHN1YmplY3QgdG8gdGhlaXIgY29ycmVzcG9uZGluZyBsaWNlbnNlIHRlcm1zLlxyXG4qIFRoaXMgZmlsZSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBhbmQgY29uZGl0aW9ucyBkZWZpbmVkIGluIGZpbGUgJ0xJQ0VOU0UnLCB3aGljaCBpcyBwYXJ0IG9mIHRoaXMgc291cmNlIGNvZGUgcGFja2FnZS5cclxuKi9cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLldlYkdMRkZJQXBpID0gdm9pZCAwO1xyXG5jb25zdCBCdWZmZXIgPSByZXF1aXJlKFwiLi9idWZmZXJcIik7XHJcbmxldCBsb2FkZXIgPSBudWxsO1xyXG5sZXQgbG9hZGVyUmVzb2x2ZSA9IG51bGw7XHJcbmNvbnN0IGV4ZWN1dGVNb2R1bGVDYWNoZSA9IHt9O1xyXG4vKipcclxuICogU3BhcnNlIEFycmF5IGltcGxlbWVudGF0aW9uIHdpdGggZWZmaWNpZW50IGFkZC9yZW1vdmUgb3BlcmF0aW9uc1xyXG4gKiAtIE1haW50YWlucyBjb250aWd1b3VzIHN0b3JhZ2VcclxuICogLSBSZXVzZXMgZW1wdHkgc2xvdHMgZnJvbSBkZWxldGlvbnNcclxuICogLSBPKDEpIGFkZC9yZW1vdmUgaW4gbW9zdCBjYXNlc1xyXG4gKi9cclxuY2xhc3MgU3BhcnNlQXJyYXkge1xyXG4gICAgX2RhdGE7XHJcbiAgICBfZnJlZUluZGljZXM7XHJcbiAgICBfbGVuZ3RoO1xyXG4gICAgY29uc3RydWN0b3IoY2FwYWNpdHkgPSAwKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IG5ldyBBcnJheShjYXBhY2l0eSk7XHJcbiAgICAgICAgdGhpcy5fZnJlZUluZGljZXMgPSBbXTtcclxuICAgICAgICB0aGlzLl9sZW5ndGggPSAwO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgYW4gZWxlbWVudCB0byB0aGUgYXJyYXlcclxuICAgICAqIEByZXR1cm5zIFRoZSBpbmRleCB3aGVyZSB0aGUgZWxlbWVudCB3YXMgaW5zZXJ0ZWRcclxuICAgICAqL1xyXG4gICAgYWRkKGVsZW1lbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5fZnJlZUluZGljZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuX2ZyZWVJbmRpY2VzLnBvcCgpO1xyXG4gICAgICAgICAgICB0aGlzLl9kYXRhW2luZGV4XSA9IGVsZW1lbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuX2xlbmd0aCsrO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgdGhpcy5fZGF0YS5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgIHRoaXMuX2xlbmd0aCsrO1xyXG4gICAgICAgIHJldHVybiBpbmRleDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGFuIGVsZW1lbnQgYnkgaW5kZXhcclxuICAgICAqIEByZXR1cm5zIHRydWUgaWYgcmVtb3ZhbCB3YXMgc3VjY2Vzc2Z1bFxyXG4gICAgICovXHJcbiAgICByZW1vdmUoaW5kZXgpIHtcclxuICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuX2RhdGEubGVuZ3RoIHx8IHRoaXMuX2RhdGFbaW5kZXhdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9kYXRhW2luZGV4XSA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLl9mcmVlSW5kaWNlcy5wdXNoKGluZGV4KTtcclxuICAgICAgICB0aGlzLl9sZW5ndGgtLTtcclxuICAgICAgICAvLyBDb21wYWN0IHRoZSBhcnJheSBpZiBsYXN0IGVsZW1lbnQgaXMgcmVtb3ZlZFxyXG4gICAgICAgIGlmIChpbmRleCA9PT0gdGhpcy5fZGF0YS5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvbXBhY3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIEdldCBlbGVtZW50IGJ5IGluZGV4XHJcbiAgICAgKi9cclxuICAgIGdldChpbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW2luZGV4XTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQ3VycmVudCBudW1iZXIgb2YgYWN0aXZlIGVsZW1lbnRzXHJcbiAgICAgKi9cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogVG90YWwgY2FwYWNpdHkgKGluY2x1ZGluZyBlbXB0eSBzbG90cylcclxuICAgICAqL1xyXG4gICAgZ2V0IGNhcGFjaXR5KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmxlbmd0aDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQ29tcGFjdCB0aGUgYXJyYXkgYnkgcmVtb3ZpbmcgdHJhaWxpbmcgdW5kZWZpbmVkIGVsZW1lbnRzXHJcbiAgICAgKi9cclxuICAgIF9jb21wYWN0KCkge1xyXG4gICAgICAgIGxldCBsYXN0SW5kZXggPSB0aGlzLl9kYXRhLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgd2hpbGUgKGxhc3RJbmRleCA+PSAwICYmIHRoaXMuX2RhdGFbbGFzdEluZGV4XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGEucG9wKCk7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbnkgZnJlZSBpbmRpY2VzIGluIHRoZSBjb21wYWN0ZWQgYXJlYVxyXG4gICAgICAgICAgICBjb25zdCBjb21wYWN0ZWRJbmRleCA9IHRoaXMuX2ZyZWVJbmRpY2VzLmluZGV4T2YobGFzdEluZGV4KTtcclxuICAgICAgICAgICAgaWYgKGNvbXBhY3RlZEluZGV4ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZnJlZUluZGljZXMuc3BsaWNlKGNvbXBhY3RlZEluZGV4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsYXN0SW5kZXgtLTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gRXhlY3V0ZU1vZHVsZShmaWxlTmFtZSkge1xyXG4gICAgaWYgKFsncHVlcnRzL2xvZy5tanMnLCAncHVlcnRzL3RpbWVyLm1qcyddLmluZGV4T2YoZmlsZU5hbWUpICE9IC0xKSB7XHJcbiAgICAgICAgcmV0dXJuIHt9O1xyXG4gICAgfVxyXG4gICAgaWYgKCFsb2FkZXIpIHtcclxuICAgICAgICBsb2FkZXIgPSBnbG9iYWxUaGlzLnNjcmlwdEVudi5HZXRMb2FkZXIoKTtcclxuICAgICAgICBsb2FkZXJSZXNvbHZlID0gbG9hZGVyLlJlc29sdmUgPyAoZnVuY3Rpb24gKGZpbGVOYW1lLCB0byA9IFwiXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWROYW1lID0gbG9hZGVyLlJlc29sdmUoZmlsZU5hbWUsIHRvKTtcclxuICAgICAgICAgICAgaWYgKCFyZXNvbHZlZE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZWROYW1lO1xyXG4gICAgICAgIH0pIDogbnVsbDtcclxuICAgIH1cclxuICAgIGlmIChsb2FkZXJSZXNvbHZlKSB7XHJcbiAgICAgICAgZmlsZU5hbWUgPSBsb2FkZXJSZXNvbHZlKGZpbGVOYW1lLCBcIlwiKTtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSB3eFJlcXVpcmUoJ3B1ZXJ0c19taW5pZ2FtZV9qc19yZXNvdXJjZXMvJyArIChmaWxlTmFtZS5lbmRzV2l0aCgnLmpzJykgPyBmaWxlTmFtZSA6IGZpbGVOYW1lICsgXCIuanNcIikpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBmdW5jdGlvbiBub3JtYWxpemUobmFtZSwgdG8pIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBDUyAhPSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChDUy5QdWVydHMuUGF0aEhlbHBlci5Jc1JlbGF0aXZlKHRvKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldCA9IENTLlB1ZXJ0cy5QYXRoSGVscGVyLm5vcm1hbGl6ZShDUy5QdWVydHMuUGF0aEhlbHBlci5EaXJuYW1lKG5hbWUpICsgXCIvXCIgKyB0byk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdG87XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1vY2tSZXF1aXJlKHNwZWNpZmllcikge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGV4cG9ydHM6IHt9IH07XHJcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kQ2FjaGVTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgZXhlY3V0ZU1vZHVsZUNhY2hlKTtcclxuICAgICAgICAgICAgaWYgKGZvdW5kQ2FjaGVTcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5leHBvcnRzID0gZXhlY3V0ZU1vZHVsZUNhY2hlW2ZvdW5kQ2FjaGVTcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmRTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgUFVFUlRTX0pTX1JFU09VUkNFUyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtb2R1bGUgbm90IGZvdW5kOiAnICsgc3BlY2lmaWVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNwZWNpZmllciA9IGZvdW5kU3BlY2lmaWVyO1xyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSAtMTtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgUFVFUlRTX0pTX1JFU09VUkNFU1tzcGVjaWZpZXJdKHJlc3VsdC5leHBvcnRzLCBmdW5jdGlvbiBtUmVxdWlyZShzcGVjaWZpZXJUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9ja1JlcXVpcmUobG9hZGVyUmVzb2x2ZSA/IGxvYWRlclJlc29sdmUoc3BlY2lmaWVyVG8sIHNwZWNpZmllcikgOiBub3JtYWxpemUoc3BlY2lmaWVyLCBzcGVjaWZpZXJUbykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSByZXN1bHQuZXhwb3J0cztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LmV4cG9ydHM7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBvYmopIHtcclxuICAgICAgICAgICAgICAgIGxldCB0cnlGaW5kTmFtZSA9IFtzcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5pbmRleE9mKCcuJykgPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5RmluZE5hbWUgPSB0cnlGaW5kTmFtZS5jb25jYXQoW3NwZWNpZmllciArICcuanMnLCBzcGVjaWZpZXIgKyAnLnRzJywgc3BlY2lmaWVyICsgJy5tanMnLCBzcGVjaWZpZXIgKyAnLm10cyddKTtcclxuICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSB0cnlGaW5kTmFtZS5yZWR1Y2UoKHJldCwgbmFtZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmV0ICE9PSBmYWxzZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ialtuYW1lXSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY2lyY3VsYXIgZGVwZW5kZW5jeSBpcyBkZXRlY3RlZCB3aGVuIHJlcXVpcmluZyBcIiR7bmFtZX1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaW5kZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ5RmluZE5hbWVbZmluZGVkXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlUmV0O1xyXG4gICAgfVxyXG59XHJcbmdsb2JhbFRoaXMuX19wdWVydHNFeGVjdXRlTW9kdWxlID0gRXhlY3V0ZU1vZHVsZTtcclxudmFyIEpTVGFnO1xyXG4oZnVuY3Rpb24gKEpTVGFnKSB7XHJcbiAgICAvKiBhbGwgdGFncyB3aXRoIGEgcmVmZXJlbmNlIGNvdW50IGFyZSBuZWdhdGl2ZSAqL1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfRklSU1RcIl0gPSAtOV0gPSBcIkpTX1RBR19GSVJTVFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfU1RSSU5HXCJdID0gLTldID0gXCJKU19UQUdfU1RSSU5HXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19TVFJJTkcxNlwiXSA9IC04XSA9IFwiSlNfVEFHX1NUUklORzE2XCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19CVUZGRVJcIl0gPSAtN10gPSBcIkpTX1RBR19CVUZGRVJcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0VYQ0VQVElPTlwiXSA9IC02XSA9IFwiSlNfVEFHX0VYQ0VQVElPTlwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfTkFUSVZFX09CSkVDVFwiXSA9IC00XSA9IFwiSlNfVEFHX05BVElWRV9PQkpFQ1RcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0FSUkFZXCJdID0gLTNdID0gXCJKU19UQUdfQVJSQVlcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0ZVTkNUSU9OXCJdID0gLTJdID0gXCJKU19UQUdfRlVOQ1RJT05cIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX09CSkVDVFwiXSA9IC0xXSA9IFwiSlNfVEFHX09CSkVDVFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfSU5UXCJdID0gMF0gPSBcIkpTX1RBR19JTlRcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0JPT0xcIl0gPSAxXSA9IFwiSlNfVEFHX0JPT0xcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX05VTExcIl0gPSAyXSA9IFwiSlNfVEFHX05VTExcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX1VOREVGSU5FRFwiXSA9IDNdID0gXCJKU19UQUdfVU5ERUZJTkVEXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19VTklOSVRJQUxJWkVEXCJdID0gNF0gPSBcIkpTX1RBR19VTklOSVRJQUxJWkVEXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19GTE9BVDY0XCJdID0gNV0gPSBcIkpTX1RBR19GTE9BVDY0XCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19JTlQ2NFwiXSA9IDZdID0gXCJKU19UQUdfSU5UNjRcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX1VJTlQ2NFwiXSA9IDddID0gXCJKU19UQUdfVUlOVDY0XCI7XHJcbn0pKEpTVGFnIHx8IChKU1RhZyA9IHt9KSk7XHJcbmxldCBoYXNFeGNlcHRpb24gPSBmYWxzZTtcclxubGV0IGxhc3RFeGNlcHRpb24gPSB1bmRlZmluZWQ7XHJcbmxldCBsYXN0RXhjZXB0aW9uQnVmZmVyID0gdW5kZWZpbmVkO1xyXG5mdW5jdGlvbiBnZXRFeGNlcHRpb25Bc05hdGl2ZVN0cmluZyh3YXNtQXBpLCB3aXRoX3N0YWNrKSB7XHJcbiAgICBpZiAoaGFzRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgaGFzRXhjZXB0aW9uID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcclxuICAgICAgICBpZiAodHlwZW9mIGxhc3RFeGNlcHRpb24gPT09ICdvYmplY3QnICYmIGxhc3RFeGNlcHRpb24gIT09IG51bGwpIHtcclxuICAgICAgICAgICAgY29uc3QgbXNnID0gbGFzdEV4Y2VwdGlvbi5tZXNzYWdlO1xyXG4gICAgICAgICAgICBjb25zdCBzdGFjayA9IGxhc3RFeGNlcHRpb24uc3RhY2s7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHdpdGhfc3RhY2sgPyBgJHttc2d9XFxuJHtzdGFja31gIDogbXNnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gYCR7bGFzdEV4Y2VwdGlvbn1gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgICAgICBjb25zdCBieXRlQ291bnQgPSB3YXNtQXBpLmxlbmd0aEJ5dGVzVVRGOChyZXN1bHQpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBnZXRFeGNlcHRpb25Bc05hdGl2ZVN0cmluZygke2J5dGVDb3VudH0pOiAke3Jlc3VsdH1gKTtcclxuICAgICAgICBpZiAobGFzdEV4Y2VwdGlvbkJ1ZmZlcikge1xyXG4gICAgICAgICAgICB3YXNtQXBpLl9mcmVlKGxhc3RFeGNlcHRpb25CdWZmZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsYXN0RXhjZXB0aW9uQnVmZmVyID0gd2FzbUFwaS5fbWFsbG9jKGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIC8vIOi/meS4jSsx5Lya5a+86Ie05bCR5LiA5Liq5a2X56ym77yM55yL5LiK5Y67c3RyaW5nVG9VVEY455qE6YC76L6R5piv6K6k5Li66K+l6ZW/5bqm5pivYnVmZmVy55qE5pyA5aSn6ZW/5bqm77yM6ICM5LiU56Gu5L+d57uT5bC+5pyJXFww57uT5p2f56ymXHJcbiAgICAgICAgd2FzbUFwaS5zdHJpbmdUb1VURjgocmVzdWx0LCBsYXN0RXhjZXB0aW9uQnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICAvLyDlpoLmnpzkuIrov7DmjqjorrrmraPnoa7vvIzov5nooYzmmK/lpJrkvZnnmoTvvIzkuI3ov4fkv53pmanotbfop4Hov5jmmK/liqDkuItcclxuICAgICAgICB3YXNtQXBpLkhFQVBVOFtsYXN0RXhjZXB0aW9uQnVmZmVyICsgYnl0ZUNvdW50XSA9IDA7XHJcbiAgICAgICAgcmV0dXJuIGxhc3RFeGNlcHRpb25CdWZmZXI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gMDtcclxufVxyXG5mdW5jdGlvbiBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKSB7XHJcbiAgICBoYXNFeGNlcHRpb24gPSBmYWxzZTtcclxuICAgIGNvbnN0IHJldCA9IGxhc3RFeGNlcHRpb247XHJcbiAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgIHJldHVybiByZXQ7XHJcbn1cclxuZnVuY3Rpb24gc2V0TGFzdEV4Y2VwdGlvbihlcnIpIHtcclxuICAgIGhhc0V4Y2VwdGlvbiA9IHRydWU7XHJcbiAgICBsYXN0RXhjZXB0aW9uID0gZXJyO1xyXG59XHJcbmNsYXNzIFNjb3BlIHtcclxuICAgIHN0YXRpYyBjdXJyZW50ID0gdW5kZWZpbmVkO1xyXG4gICAgc3RhdGljIGdldEN1cnJlbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmN1cnJlbnQ7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZW50ZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTY29wZSgpO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGV4aXQod2FzbUFwaSkge1xyXG4gICAgICAgIGdldEFuZENsZWFyTGFzdEV4Y2VwdGlvbigpO1xyXG4gICAgICAgIFNjb3BlLmN1cnJlbnQuY2xvc2Uod2FzbUFwaSk7XHJcbiAgICB9XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnByZXZTY29wZSA9IFNjb3BlLmN1cnJlbnQ7XHJcbiAgICAgICAgU2NvcGUuY3VycmVudCA9IHRoaXM7XHJcbiAgICB9XHJcbiAgICBjbG9zZSh3YXNtQXBpKSB7XHJcbiAgICAgICAgU2NvcGUuY3VycmVudCA9IHRoaXMucHJldlNjb3BlO1xyXG4gICAgfVxyXG4gICAgYWRkVG9TY29wZShvYmopIHtcclxuICAgICAgICB0aGlzLm9iamVjdHNJblNjb3BlLnB1c2gob2JqKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RzSW5TY29wZS5sZW5ndGggLSAxO1xyXG4gICAgfVxyXG4gICAgZ2V0RnJvbVNjb3BlKGluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGVbaW5kZXhdO1xyXG4gICAgfVxyXG4gICAgdG9Kcyh3YXNtQXBpLCBvYmpNYXBwZXIsIHB2YWx1ZSwgZnJlZVN0cmluZ0FuZEJ1ZmZlciA9IGZhbHNlKSB7XHJcbiAgICAgICAgaWYgKHB2YWx1ZSA9PSAwKVxyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIGNvbnN0IGhlYXAgPSB3YXNtQXBpLkhFQVBVODtcclxuICAgICAgICBjb25zdCB0YWdQdHIgPSBwdmFsdWUgKyA4O1xyXG4gICAgICAgIGNvbnN0IHZhbFR5cGUgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHRhZ1B0cik7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhgdmFsVHlwZTogJHt2YWxUeXBlfWApO1xyXG4gICAgICAgIGlmICh2YWxUeXBlIDw9IEpTVGFnLkpTX1RBR19PQkpFQ1QgJiYgdmFsVHlwZSA+PSBKU1RhZy5KU19UQUdfQVJSQVkpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JqSWR4ID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RzSW5TY29wZVtvYmpJZHhdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodmFsVHlwZSA9PSBKU1RhZy5KU19UQUdfTkFUSVZFX09CSkVDVCkge1xyXG4gICAgICAgICAgICBjb25zdCBvYmpJZCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9iak1hcHBlci5maW5kTmF0aXZlT2JqZWN0KG9iaklkKTsgLy8g6IKv5a6a5bey57uPcHVzaOi/h+S6hu+8jOebtOaOpWZpbmTlsLHlj6/ku6XkuoZcclxuICAgICAgICB9XHJcbiAgICAgICAgc3dpdGNoICh2YWxUeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0JPT0w6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUpICE9IDA7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0lOVDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX05VTEw6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfVU5ERUZJTkVEOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfRkxPQVQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZERvdWJsZShoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19JTlQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZEludDY0KGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX1VJTlQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZFVJbnQ2NChoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19TVFJJTkc6XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHJTdGFydCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0ckxlbiA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlICsgNCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHIgPSB3YXNtQXBpLlVURjhUb1N0cmluZyhzdHJTdGFydCwgc3RyTGVuKTtcclxuICAgICAgICAgICAgICAgIGlmIChmcmVlU3RyaW5nQW5kQnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVlZF9mcmVlID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCB0YWdQdHIgKyA0KTsgLy8gbmVlZF9mcmVlXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5lZWRfZnJlZSAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhc21BcGkuX2ZyZWUoc3RyU3RhcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX1NUUklORzE2OlxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RyMTZTdGFydCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0cjE2TGVuID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUgKyA0KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0cjE2ID0gd2FzbUFwaS5VVEYxNlRvU3RyaW5nKHN0cjE2U3RhcnQsIHN0cjE2TGVuICogMik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnJlZVN0cmluZ0FuZEJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lZWRfZnJlZSA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgdGFnUHRyICsgNCk7IC8vIG5lZWRfZnJlZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWVkX2ZyZWUgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXNtQXBpLl9mcmVlKHN0cjE2U3RhcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBzdHIxNjtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfQlVGRkVSOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZlN0YXJ0ID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZkxlbiA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlICsgNCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmID0gd2FzbUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoYnVmZlN0YXJ0LCBidWZmU3RhcnQgKyBidWZmTGVuKTtcclxuICAgICAgICAgICAgICAgIGlmIChmcmVlU3RyaW5nQW5kQnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVlZF9mcmVlID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCB0YWdQdHIgKyA0KTsgLy8gbmVlZF9mcmVlXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5lZWRfZnJlZSAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhc21BcGkuX2ZyZWUoYnVmZlN0YXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYnVmZjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCB0eXBlOiAke3ZhbFR5cGV9YCk7XHJcbiAgICB9XHJcbiAgICBwcmV2U2NvcGUgPSB1bmRlZmluZWQ7XHJcbiAgICBvYmplY3RzSW5TY29wZSA9IFtudWxsXTsgLy8g5YqgbnVsbOS4uuS6hmluZGV45LuOMeW8gOWni++8jOWboOS4uuWcqOWOn+eUn+enjeWtmOaUvuWcqOaMh+mSiOWtl+autemYsuatouivr+WIpOS4um51bGxwdHJcclxufVxyXG5jbGFzcyBPYmplY3RQb29sIHtcclxuICAgIHN0b3JhZ2UgPSBuZXcgTWFwKCk7XHJcbiAgICBnY0l0ZXJhdG9yO1xyXG4gICAgZ2NUaW1lb3V0ID0gbnVsbDtcclxuICAgIGlzR2NSdW5uaW5nID0gZmFsc2U7XHJcbiAgICAvLyBHQyBjb25maWd1cmF0aW9uIGRlZmF1bHRzXHJcbiAgICBnY0JhdGNoU2l6ZSA9IDEwMDtcclxuICAgIGdjSW50ZXJ2YWxNcyA9IDUwO1xyXG4gICAgY2xlYW51cENhbGxiYWNrID0gdW5kZWZpbmVkO1xyXG4gICAgY29uc3RydWN0b3IoY2xlYW51cENhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2sgPSBjbGVhbnVwQ2FsbGJhY2s7XHJcbiAgICB9XHJcbiAgICBhZGQob2JqSWQsIG9iaiwgdHlwZUlkLCBjYWxsRmluYWxpemUpIHtcclxuICAgICAgICBjb25zdCByZWYgPSBuZXcgV2Vha1JlZihvYmopO1xyXG4gICAgICAgIHRoaXMuc3RvcmFnZS5zZXQob2JqSWQsIFtyZWYsIHR5cGVJZCwgY2FsbEZpbmFsaXplXSk7XHJcbiAgICAgICAgb2JqLiRPYmpJZF9fID0gb2JqSWQ7XHJcbiAgICAgICAgb2JqLiRUeXBlSWRfXyA9IHR5cGVJZDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGdldChvYmpJZCkge1xyXG4gICAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5zdG9yYWdlLmdldChvYmpJZCk7XHJcbiAgICAgICAgaWYgKCFlbnRyeSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IFtyZWYsIHR5cGVJZCwgY2FsbEZpbmFsaXplXSA9IGVudHJ5O1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IHJlZi5kZXJlZigpO1xyXG4gICAgICAgIGlmICghb2JqKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RvcmFnZS5kZWxldGUob2JqSWQpO1xyXG4gICAgICAgICAgICB0aGlzLmNsZWFudXBDYWxsYmFjayhvYmpJZCwgdHlwZUlkLCBjYWxsRmluYWxpemUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIEdldE5hdGl2ZUluZm9PZk9iamVjdChvYmopIHtcclxuICAgICAgICBjb25zdCBvYmpJZCA9IG9iai4kT2JqSWRfXztcclxuICAgICAgICBpZiAodHlwZW9mIG9iaklkID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICByZXR1cm4gW29iaklkLCBvYmouJFR5cGVJZF9fXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBoYXMob2JqSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdG9yYWdlLmhhcyhvYmpJZCk7XHJcbiAgICB9XHJcbiAgICBmdWxsR2MoKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBbb2JqSWRdIG9mIHRoaXMuc3RvcmFnZSkge1xyXG4gICAgICAgICAgICB0aGlzLmdldChvYmpJZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE9ubHkgcmVzZXQgaXRlcmF0b3IgaWYgR0MgaXMgcnVubmluZyB0byBtYWludGFpbiBpdGVyYXRpb24gc3RhdGVcclxuICAgICAgICBpZiAodGhpcy5pc0djUnVubmluZykge1xyXG4gICAgICAgICAgICB0aGlzLmdjSXRlcmF0b3IgPSB0aGlzLnN0b3JhZ2Uua2V5cygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFN0YXJ0IGluY3JlbWVudGFsIGdhcmJhZ2UgY29sbGVjdGlvbiB3aXRoIGNvbmZpZ3VyYWJsZSBwYXJhbWV0ZXJzXHJcbiAgICBzdGFydEluY3JlbWVudGFsR2MoYmF0Y2hTaXplID0gMTAwLCBpbnRlcnZhbE1zID0gNTApIHtcclxuICAgICAgICBpZiAodGhpcy5pc0djUnVubmluZylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuaXNHY1J1bm5pbmcgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZ2NCYXRjaFNpemUgPSBNYXRoLm1heCgxLCBiYXRjaFNpemUpO1xyXG4gICAgICAgIHRoaXMuZ2NJbnRlcnZhbE1zID0gTWF0aC5tYXgoMCwgaW50ZXJ2YWxNcyk7XHJcbiAgICAgICAgdGhpcy5nY0l0ZXJhdG9yID0gdGhpcy5zdG9yYWdlLmtleXMoKTtcclxuICAgICAgICB0aGlzLnByb2Nlc3NHY0JhdGNoKCk7XHJcbiAgICB9XHJcbiAgICAvLyBTdG9wIGluY3JlbWVudGFsIGdhcmJhZ2UgY29sbGVjdGlvblxyXG4gICAgc3RvcEluY3JlbWVudGFsR2MoKSB7XHJcbiAgICAgICAgdGhpcy5pc0djUnVubmluZyA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh0aGlzLmdjVGltZW91dCkge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5nY1RpbWVvdXQpO1xyXG4gICAgICAgICAgICB0aGlzLmdjVGltZW91dCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcHJvY2Vzc0djQmF0Y2goKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzR2NSdW5uaW5nKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgbGV0IHByb2Nlc3NlZCA9IDA7XHJcbiAgICAgICAgbGV0IG5leHQgPSB0aGlzLmdjSXRlcmF0b3IubmV4dCgpO1xyXG4gICAgICAgIHdoaWxlICghbmV4dC5kb25lICYmIHByb2Nlc3NlZCA8IHRoaXMuZ2NCYXRjaFNpemUpIHtcclxuICAgICAgICAgICAgdGhpcy5nZXQobmV4dC52YWx1ZSk7XHJcbiAgICAgICAgICAgIHByb2Nlc3NlZCsrO1xyXG4gICAgICAgICAgICBuZXh0ID0gdGhpcy5nY0l0ZXJhdG9yLm5leHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG5leHQuZG9uZSkge1xyXG4gICAgICAgICAgICAvLyBSZXN0YXJ0IGl0ZXJhdG9yIGZvciBuZXh0IHJvdW5kXHJcbiAgICAgICAgICAgIHRoaXMuZ2NJdGVyYXRvciA9IHRoaXMuc3RvcmFnZS5rZXlzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZ2NUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnByb2Nlc3NHY0JhdGNoKCksIHRoaXMuZ2NJbnRlcnZhbE1zKTtcclxuICAgIH1cclxufVxyXG5jbGFzcyBDbGFzc1JlZ2lzdGVyIHtcclxuICAgIHN0YXRpYyBpbnN0YW5jZTtcclxuICAgIGNvbnN0cnVjdG9yKCkgeyB9XHJcbiAgICBjbGFzc05vdEZvdW5kID0gdW5kZWZpbmVkO1xyXG4gICAgdHlwZUlkVG9DbGFzcyA9IG5ldyBNYXAoKTtcclxuICAgIHR5cGVJZFRvSW5mb3MgPSBuZXcgTWFwKCk7XHJcbiAgICBuYW1lVG9DbGFzcyA9IG5ldyBNYXAoKTtcclxuICAgIHN0YXRpYyBnZXRJbnN0YW5jZSgpIHtcclxuICAgICAgICBpZiAoIUNsYXNzUmVnaXN0ZXIuaW5zdGFuY2UpIHtcclxuICAgICAgICAgICAgQ2xhc3NSZWdpc3Rlci5pbnN0YW5jZSA9IG5ldyBDbGFzc1JlZ2lzdGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBDbGFzc1JlZ2lzdGVyLmluc3RhbmNlO1xyXG4gICAgfVxyXG4gICAgLy9wdWJsaWMgcGVzYXBpX2RlZmluZV9jbGFzcyh0eXBlSWQ6IG51bWJlciwgc3VwZXJUeXBlSWQ6IG51bWJlciwgcG5hbWU6IENTU3RyaW5nLCBjb25zdHJ1Y3RvcjogbnVtYmVyLCBmaW5hbGl6ZTogbnVtYmVyLCBwcm9wZXJ0eUNvdW50OiBudW1iZXIsIHByb3BlcnRpZXM6IG51bWJlciwgZGF0YTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAvL31cclxuICAgIGRlZmluZUNsYXNzKHR5cGVJZCkge1xyXG4gICAgICAgIGNvbnN0IHR5cGVEZWYgPSB3YXNtQXBpLmxvYWRfY2xhc3NfYnlfaWQocmVnaXN0cnksIHR5cGVJZCk7XHJcbiAgICAgICAgY29uc3Qgc3VwZXJUeXBlSWQgPSB3YXNtQXBpLmdldF9jbGFzc19zdXBlcl90eXBlX2lkKHR5cGVEZWYpO1xyXG4gICAgICAgIGNvbnN0IHBuYW1lID0gd2FzbUFwaS5nZXRfY2xhc3NfbmFtZSh0eXBlRGVmKTtcclxuICAgICAgICBjb25zdCBuYW1lID0gd2FzbUFwaS5VVEY4VG9TdHJpbmcocG5hbWUpO1xyXG4gICAgICAgIGNvbnN0IGNvbnN0cnVjdG9yID0gd2FzbUFwaS5nZXRfY2xhc3NfaW5pdGlhbGl6ZSh0eXBlRGVmKTtcclxuICAgICAgICBjb25zdCBmaW5hbGl6ZSA9IHdhc21BcGkuZ2V0X2NsYXNzX2ZpbmFsaXplKHR5cGVEZWYpO1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB3YXNtQXBpLmdldF9jbGFzc19kYXRhKHR5cGVEZWYpO1xyXG4gICAgICAgIGNvbnN0IGVudGVyQ2FsbGJhY2sgPSB3YXNtQXBpLmdldFdhc21UYWJsZUVudHJ5KHdhc21BcGkuZ2V0X2NsYXNzX29uX2VudGVyKHR5cGVEZWYpKTtcclxuICAgICAgICBjb25zdCBleGl0Q2FsbGJhY2sgPSB3YXNtQXBpLmdldFdhc21UYWJsZUVudHJ5KHdhc21BcGkuZ2V0X2NsYXNzX29uX2V4aXQodHlwZURlZikpO1xyXG4gICAgICAgIGNvbnN0IFBBcGlOYXRpdmVPYmplY3QgPSBmdW5jdGlvbiAoLi4uYXJncykge1xyXG4gICAgICAgICAgICBsZXQgY2FsbGJhY2tJbmZvID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBjb25zdCBhcmdjID0gYXJndW1lbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgY29uc3Qgc2NvcGUgPSBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tJbmZvID0ganNBcmdzVG9DYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgYXJncyk7XHJcbiAgICAgICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMih3YXNtQXBpLkhFQVBVOCwgZGF0YSwgY2FsbGJhY2tJbmZvICsgOCk7IC8vIGRhdGFcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9iaklkID0gd2FzbUFwaS5QQXBpQ29uc3RydWN0b3JXaXRoU2NvcGUoY29uc3RydWN0b3IsIHdlYmdsRkZJLCBjYWxsYmFja0luZm8pOyAvLyDpooTmnJ93YXNt5Y+q5Lya6YCa6L+HdGhyb3dfYnlfc3RyaW5n5oqb5byC5bi477yM5LiN5Lqn55Sf55u05o6lanPlvILluLhcclxuICAgICAgICAgICAgICAgIGlmIChoYXNFeGNlcHRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG9iak1hcHBlci5iaW5kTmF0aXZlT2JqZWN0KG9iaklkLCB0aGlzLCB0eXBlSWQsIFBBcGlOYXRpdmVPYmplY3QsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuTmF0aXZlQ2FsbGJhY2tJbmZvKHdhc21BcGksIGFyZ2MsIGNhbGxiYWNrSW5mbyk7XHJcbiAgICAgICAgICAgICAgICBzY29wZS5jbG9zZSh3YXNtQXBpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFBBcGlOYXRpdmVPYmplY3QsIFwibmFtZVwiLCB7IHZhbHVlOiBuYW1lIH0pO1xyXG4gICAgICAgIGlmIChzdXBlclR5cGVJZCAhPSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN1cGVyVHlwZSA9IHRoaXMubG9hZENsYXNzQnlJZChzdXBlclR5cGVJZCk7XHJcbiAgICAgICAgICAgIGlmIChzdXBlclR5cGUpIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihQQXBpTmF0aXZlT2JqZWN0LnByb3RvdHlwZSwgc3VwZXJUeXBlLnByb3RvdHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbmF0aXZlTWV0aG9kSW5mb1RvSnMobWV0aG9kUHRyLCBpc1N0YXRpYykge1xyXG4gICAgICAgICAgICBjb25zdCBuYXRpdmVGdW5jUHRyID0gd2FzbUFwaS5nZXRfZnVuY3Rpb25faW5mb19jYWxsYmFjayhtZXRob2RQdHIpO1xyXG4gICAgICAgICAgICBjb25zdCBtZXRob2REYXRhID0gd2FzbUFwaS5nZXRfZnVuY3Rpb25faW5mb19kYXRhKG1ldGhvZFB0cik7XHJcbiAgICAgICAgICAgIHJldHVybiBnZW5Kc0NhbGxiYWNrKHdhc21BcGksIG5hdGl2ZUZ1bmNQdHIsIG1ldGhvZERhdGEsIHdlYmdsRkZJLCBpc1N0YXRpYyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG5hdGl2ZVByb3BlcnR5SW5mb1RvSnMocHJvcGVydHlJbmZvUHRyLCBpc1N0YXRpYykge1xyXG4gICAgICAgICAgICBjb25zdCBnZXR0ZXIgPSB3YXNtQXBpLmdldF9wcm9wZXJ0eV9pbmZvX2dldHRlcihwcm9wZXJ0eUluZm9QdHIpO1xyXG4gICAgICAgICAgICBjb25zdCBzZXR0ZXIgPSB3YXNtQXBpLmdldF9wcm9wZXJ0eV9pbmZvX3NldHRlcihwcm9wZXJ0eUluZm9QdHIpO1xyXG4gICAgICAgICAgICBjb25zdCBnZXR0ZXJfZGF0YSA9IHdhc21BcGkuZ2V0X3Byb3BlcnR5X2luZm9fZ2V0dGVyX2RhdGEocHJvcGVydHlJbmZvUHRyKTtcclxuICAgICAgICAgICAgY29uc3Qgc2V0dGVyX2RhdGEgPSB3YXNtQXBpLmdldF9wcm9wZXJ0eV9pbmZvX3NldHRlcl9kYXRhKHByb3BlcnR5SW5mb1B0cik7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBnZXQ6IGdldHRlciA9PT0gMCA/IHVuZGVmaW5lZCA6IGdlbkpzQ2FsbGJhY2sod2FzbUFwaSwgZ2V0dGVyLCBnZXR0ZXJfZGF0YSwgd2ViZ2xGRkksIGlzU3RhdGljKSxcclxuICAgICAgICAgICAgICAgIHNldDogc2V0dGVyID09PSAwID8gdW5kZWZpbmVkIDogZ2VuSnNDYWxsYmFjayh3YXNtQXBpLCBzZXR0ZXIsIHNldHRlcl9kYXRhLCB3ZWJnbEZGSSwgaXNTdGF0aWMpLFxyXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbWV0aG9kUHRyID0gd2FzbUFwaS5nZXRfY2xhc3NfbWV0aG9kcyh0eXBlRGVmKTtcclxuICAgICAgICB3aGlsZSAobWV0aG9kUHRyICE9IDApIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gd2FzbUFwaS5VVEY4VG9TdHJpbmcod2FzbUFwaS5nZXRfZnVuY3Rpb25faW5mb19uYW1lKG1ldGhvZFB0cikpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGBtZXRob2Q6ICR7bmFtZX0gJHtmaWVsZE5hbWV9YCk7XHJcbiAgICAgICAgICAgIFBBcGlOYXRpdmVPYmplY3QucHJvdG90eXBlW2ZpZWxkTmFtZV0gPSBuYXRpdmVNZXRob2RJbmZvVG9KcyhtZXRob2RQdHIsIGZhbHNlKTtcclxuICAgICAgICAgICAgbWV0aG9kUHRyID0gd2FzbUFwaS5nZXRfbmV4dF9mdW5jdGlvbl9pbmZvKG1ldGhvZFB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBmdW5jdGlvblB0ciA9IHdhc21BcGkuZ2V0X2NsYXNzX2Z1bmN0aW9ucyh0eXBlRGVmKTtcclxuICAgICAgICB3aGlsZSAoZnVuY3Rpb25QdHIgIT0gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSB3YXNtQXBpLlVURjhUb1N0cmluZyh3YXNtQXBpLmdldF9mdW5jdGlvbl9pbmZvX25hbWUoZnVuY3Rpb25QdHIpKTtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhgZnVuY3Rpb246ICR7bmFtZX0gJHtmaWVsZE5hbWV9YCk7XHJcbiAgICAgICAgICAgIFBBcGlOYXRpdmVPYmplY3RbZmllbGROYW1lXSA9IG5hdGl2ZU1ldGhvZEluZm9Ub0pzKGZ1bmN0aW9uUHRyLCB0cnVlKTtcclxuICAgICAgICAgICAgZnVuY3Rpb25QdHIgPSB3YXNtQXBpLmdldF9uZXh0X2Z1bmN0aW9uX2luZm8oZnVuY3Rpb25QdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgcHJvcGVydHlQdHIgPSB3YXNtQXBpLmdldF9jbGFzc19wcm9wZXJ0aWVzKHR5cGVEZWYpO1xyXG4gICAgICAgIHdoaWxlIChwcm9wZXJ0eVB0ciAhPSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IHdhc21BcGkuVVRGOFRvU3RyaW5nKHdhc21BcGkuZ2V0X3Byb3BlcnR5X2luZm9fbmFtZShwcm9wZXJ0eVB0cikpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGBwcm9wZXJ0eTogJHtuYW1lfSAke2ZpZWxkTmFtZX1gKTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFBBcGlOYXRpdmVPYmplY3QucHJvdG90eXBlLCBmaWVsZE5hbWUsIG5hdGl2ZVByb3BlcnR5SW5mb1RvSnMocHJvcGVydHlQdHIsIGZhbHNlKSk7XHJcbiAgICAgICAgICAgIHByb3BlcnR5UHRyID0gd2FzbUFwaS5nZXRfbmV4dF9wcm9wZXJ0eV9pbmZvKHByb3BlcnR5UHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHZhcmlhYmxlUHRyID0gd2FzbUFwaS5nZXRfY2xhc3NfdmFyaWFibGVzKHR5cGVEZWYpO1xyXG4gICAgICAgIHdoaWxlICh2YXJpYWJsZVB0ciAhPSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IHdhc21BcGkuVVRGOFRvU3RyaW5nKHdhc21BcGkuZ2V0X3Byb3BlcnR5X2luZm9fbmFtZSh2YXJpYWJsZVB0cikpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGB2YXJpYWJsZTogJHtuYW1lfSAke2ZpZWxkTmFtZX1gKTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFBBcGlOYXRpdmVPYmplY3QsIGZpZWxkTmFtZSwgbmF0aXZlUHJvcGVydHlJbmZvVG9Kcyh2YXJpYWJsZVB0ciwgZmFsc2UpKTtcclxuICAgICAgICAgICAgdmFyaWFibGVQdHIgPSB3YXNtQXBpLmdldF9uZXh0X3Byb3BlcnR5X2luZm8odmFyaWFibGVQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKGBwZXNhcGlfZGVmaW5lX2NsYXNzOiAke25hbWV9ICR7dHlwZUlkfSAke3N1cGVyVHlwZUlkfWApO1xyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJDbGFzcyh0eXBlSWQsIFBBcGlOYXRpdmVPYmplY3QsIHdhc21BcGkuZ2V0V2FzbVRhYmxlRW50cnkoZmluYWxpemUpLCBkYXRhLCBlbnRlckNhbGxiYWNrLCBleGl0Q2FsbGJhY2spO1xyXG4gICAgfVxyXG4gICAgbG9hZENsYXNzQnlJZCh0eXBlSWQpIHtcclxuICAgICAgICBjb25zdCBjbHMgPSB0aGlzLnR5cGVJZFRvQ2xhc3MuZ2V0KHR5cGVJZCk7XHJcbiAgICAgICAgaWYgKGNscykge1xyXG4gICAgICAgICAgICByZXR1cm4gY2xzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kZWZpbmVDbGFzcyh0eXBlSWQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50eXBlSWRUb0NsYXNzLmdldCh0eXBlSWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJlZ2lzdGVyQ2xhc3ModHlwZUlkLCBjbHMsIGZpbmFsaXplLCBjbHNEYXRhLCBlbnRlciwgZXhpdCkge1xyXG4gICAgICAgIGNvbnN0IGluZm9zID0geyB0eXBlSWQsIGZpbmFsaXplLCBkYXRhOiBjbHNEYXRhLCBlbnRlciwgZXhpdCB9O1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbHMsICckSW5mb3MnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBpbmZvcyxcclxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMudHlwZUlkVG9DbGFzcy5zZXQodHlwZUlkLCBjbHMpO1xyXG4gICAgICAgIHRoaXMudHlwZUlkVG9JbmZvcy5zZXQodHlwZUlkLCBpbmZvcyk7XHJcbiAgICAgICAgdGhpcy5uYW1lVG9DbGFzcy5zZXQoY2xzLm5hbWUsIGNscyk7XHJcbiAgICB9XHJcbiAgICBnZXRDbGFzc0RhdGFCeUlkKHR5cGVJZCwgZm9yY2VMb2FkKSB7XHJcbiAgICAgICAgaWYgKGZvcmNlTG9hZCkge1xyXG4gICAgICAgICAgICB0aGlzLmxvYWRDbGFzc0J5SWQodHlwZUlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaW5mb3MgPSB0aGlzLmdldFR5cGVJbmZvcyh0eXBlSWQpO1xyXG4gICAgICAgIHJldHVybiBpbmZvcyA/IGluZm9zLmRhdGEgOiAwO1xyXG4gICAgfVxyXG4gICAgZmluZENsYXNzQnlJZCh0eXBlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50eXBlSWRUb0NsYXNzLmdldCh0eXBlSWQpO1xyXG4gICAgfVxyXG4gICAgZmluZENsYXNzQnlOYW1lKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lVG9DbGFzcy5nZXQobmFtZSk7XHJcbiAgICB9XHJcbiAgICBnZXRUeXBlSW5mb3ModHlwZUlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZUlkVG9JbmZvcy5nZXQodHlwZUlkKTtcclxuICAgIH1cclxuICAgIHNldENsYXNzTm90Rm91bmRDYWxsYmFjayhjYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuY2xhc3NOb3RGb3VuZCA9IGNhbGxiYWNrO1xyXG4gICAgfVxyXG59XHJcbmNsYXNzIE9iamVjdE1hcHBlciB7XHJcbiAgICBvYmplY3RQb29sO1xyXG4gICAgcHJpdmF0ZURhdGEgPSB1bmRlZmluZWQ7XHJcbiAgICBvYmpJZDJ1ZCA9IG5ldyBNYXAoKTtcclxuICAgIC8vcHJpdmF0ZSBvbkVudGVyOiAob2JqSWQ6IG51bWJlciwgZGF0YTogbnVtYmVyLCBwcml2YXRlRGF0YTogbnVtYmVyKSA9PiBudW1iZXIgPSB1bmRlZmluZWQ7XHJcbiAgICAvL3ByaXZhdGUgb25FeGl0OiAob2JqSWQ6IG51bWJlciwgZGF0YTogbnVtYmVyLCBwcml2YXRlRGF0YTogbnVtYmVyLCB1ZDogbnVtYmVyKSA9PiB2b2lkID0gdW5kZWZpbmVkO1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RQb29sID0gbmV3IE9iamVjdFBvb2wodGhpcy5Pbk5hdGl2ZU9iamVjdEZpbmFsaXplZC5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLm9iamVjdFBvb2wuc3RhcnRJbmNyZW1lbnRhbEdjKDEwMCwgMTAwMCk7XHJcbiAgICB9XHJcbiAgICBwdXNoTmF0aXZlT2JqZWN0KG9iaklkLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZSkge1xyXG4gICAgICAgIGxldCBqc09iaiA9IHRoaXMub2JqZWN0UG9vbC5nZXQob2JqSWQpO1xyXG4gICAgICAgIGlmICghanNPYmopIHtcclxuICAgICAgICAgICAgY29uc3QgY2xzID0gQ2xhc3NSZWdpc3Rlci5nZXRJbnN0YW5jZSgpLmxvYWRDbGFzc0J5SWQodHlwZUlkKTtcclxuICAgICAgICAgICAgaWYgKGNscykge1xyXG4gICAgICAgICAgICAgICAganNPYmogPSBPYmplY3QuY3JlYXRlKGNscy5wcm90b3R5cGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kTmF0aXZlT2JqZWN0KG9iaklkLCBqc09iaiwgdHlwZUlkLCBjbHMsIGNhbGxGaW5hbGl6ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGpzT2JqO1xyXG4gICAgfVxyXG4gICAgZmluZE5hdGl2ZU9iamVjdChvYmpJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdFBvb2wuZ2V0KG9iaklkKTtcclxuICAgIH1cclxuICAgIGJpbmROYXRpdmVPYmplY3Qob2JqSWQsIGpzT2JqLCB0eXBlSWQsIGNscywgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RQb29sLmFkZChvYmpJZCwganNPYmosIHR5cGVJZCwgY2FsbEZpbmFsaXplKTtcclxuICAgICAgICBjb25zdCB7IGRhdGEsIGVudGVyIH0gPSBjbHMuJEluZm9zO1xyXG4gICAgICAgIGlmIChlbnRlcikge1xyXG4gICAgICAgICAgICBjb25zdCB1ZCA9IGVudGVyKG9iaklkLCBkYXRhLCB0aGlzLnByaXZhdGVEYXRhKTtcclxuICAgICAgICAgICAgdGhpcy5vYmpJZDJ1ZC5zZXQob2JqSWQsIHVkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBzZXRFbnZQcml2YXRlKHByaXZhdGVEYXRhKSB7XHJcbiAgICAgICAgdGhpcy5wcml2YXRlRGF0YSA9IHByaXZhdGVEYXRhO1xyXG4gICAgfVxyXG4gICAgT25OYXRpdmVPYmplY3RGaW5hbGl6ZWQob2JqSWQsIHR5cGVJZCwgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmVycm9yKGBPbk5hdGl2ZU9iamVjdEZpbmFsaXplZCAke29iaklkfWApO1xyXG4gICAgICAgIGNvbnN0IGNscyA9IENsYXNzUmVnaXN0ZXIuZ2V0SW5zdGFuY2UoKS5maW5kQ2xhc3NCeUlkKHR5cGVJZCk7XHJcbiAgICAgICAgY29uc3QgeyBmaW5hbGl6ZSwgZGF0YSwgZXhpdCB9ID0gY2xzLiRJbmZvcztcclxuICAgICAgICBpZiAoY2FsbEZpbmFsaXplICYmIGZpbmFsaXplKSB7XHJcbiAgICAgICAgICAgIGZpbmFsaXplKHdlYmdsRkZJLCBvYmpJZCwgZGF0YSwgdGhpcy5wcml2YXRlRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGl0ICYmIHRoaXMub2JqSWQydWQuaGFzKG9iaklkKSkge1xyXG4gICAgICAgICAgICBjb25zdCB1ZCA9IHRoaXMub2JqSWQydWQuZ2V0KG9iaklkKTtcclxuICAgICAgICAgICAgdGhpcy5vYmpJZDJ1ZC5kZWxldGUob2JqSWQpO1xyXG4gICAgICAgICAgICBleGl0KG9iaklkLCBkYXRhLCB0aGlzLnByaXZhdGVEYXRhLCB1ZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmxldCB3ZWJnbEZGSSA9IHVuZGVmaW5lZDtcclxubGV0IG9iak1hcHBlciA9IHVuZGVmaW5lZDtcclxubGV0IHJlZ2lzdHJ5ID0gdW5kZWZpbmVkO1xyXG5sZXQgd2FzbUFwaSA9IHVuZGVmaW5lZDtcclxuLy8gdHlwZWRlZiBzdHJ1Y3QgU3RyaW5nIHtcclxuLy8gICAgIGNvbnN0IGNoYXIgKnB0cjtcclxuLy8gICAgIHVpbnQzMl90IGxlbjtcclxuLy8gfSBTdHJpbmc7XHJcbi8vIFxyXG4vLyB0eXBlZGVmIHN0cnVjdCBCdWZmZXIge1xyXG4vLyAgICAgdm9pZCAqcHRyO1xyXG4vLyAgICAgdWludDMyX3QgbGVuO1xyXG4vLyB9IEJ1ZmZlcjtcclxuLy8gXHJcbi8vIHR5cGVkZWYgc3RydWN0IE5hdGl2ZU9iamVjdCB7XHJcbi8vICAgICB2b2lkICpvYmpJZDtcclxuLy8gICAgIGNvbnN0IHZvaWQgKnR5cGVJZDtcclxuLy8gfSBOYXRpdmVPYmplY3Q7XHJcbi8vIFxyXG4vLyB0eXBlZGVmIHVuaW9uIEpTVmFsdWVVbmlvbiB7XHJcbi8vICAgICBpbnQzMl90IGludDMyO1xyXG4vLyAgICAgZG91YmxlIGZsb2F0NjQ7XHJcbi8vICAgICBpbnQ2NF90IGludDY0O1xyXG4vLyAgICAgdWludDY0X3QgdWludDY0O1xyXG4vLyAgICAgdm9pZCAqcHRyO1xyXG4vLyAgICAgU3RyaW5nIHN0cjtcclxuLy8gICAgIEJ1ZmZlciBidWY7XHJcbi8vICAgICBOYXRpdmVPYmplY3QgbnRvO1xyXG4vLyB9IEpTVmFsdWVVbmlvbjtcclxuLy8gXHJcbi8vIHR5cGVkZWYgc3RydWN0IEpTVmFsdWUge1xyXG4vLyAgICAgSlNWYWx1ZVVuaW9uIHU7XHJcbi8vICAgICBpbnQzMl90IHRhZztcclxuLy8gICAgIGludCBuZWVkX2ZyZWU7XHJcbi8vIH0gSlNWYWx1ZTtcclxuLy9cclxuLy8gc3RydWN0IENhbGxiYWNrSW5mbyB7XHJcbi8vICAgICB2b2lkKiB0aGlzUHRyO1xyXG4vLyAgICAgaW50IGFyZ2M7XHJcbi8vICAgICB2b2lkKiBkYXRhO1xyXG4vLyAgICAgdm9pZCogdGhpc1R5cGVJZDtcclxuLy8gICAgIEpTVmFsdWUgcmVzO1xyXG4vLyAgICAgSlNWYWx1ZSBhcmd2WzBdO1xyXG4vLyB9O1xyXG4vLyBzaXplb2YoSlNWYWx1ZSkgPT0gMTZcclxuY29uc3QgY2FsbGJhY2tJbmZvc0NhY2hlID0gW107XHJcbmZ1bmN0aW9uIGdldE5hdGl2ZUNhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjKSB7XHJcbiAgICBsZXQgY2FsbGJhY2tJbmZvID0gY2FsbGJhY2tJbmZvc0NhY2hlW2FyZ2NdO1xyXG4gICAgaWYgKCFjYWxsYmFja0luZm8pIHtcclxuICAgICAgICAvLyA0ICsgNCArIDQgKyA0ICsgMTYgKyAoYXJnYyAqIDE2KVxyXG4gICAgICAgIGNvbnN0IHNpemUgPSAzMiArIChhcmdjICogMTYpO1xyXG4gICAgICAgIGNhbGxiYWNrSW5mbyA9IHdhc21BcGkuX21hbGxvYyhzaXplKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMih3YXNtQXBpLkhFQVBVOCwgYXJnYywgY2FsbGJhY2tJbmZvICsgNCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsYmFja0luZm9zQ2FjaGVbYXJnY10gPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBCdWZmZXIud3JpdGVJbnQzMih3YXNtQXBpLkhFQVBVOCwgSlNUYWcuSlNfVEFHX1VOREVGSU5FRCwgY2FsbGJhY2tJbmZvICsgMjQpOyAvLyBzZXQgcmVzIHRvIHVuZGVmaW5lZFxyXG4gICAgcmV0dXJuIGNhbGxiYWNrSW5mbztcclxufVxyXG5mdW5jdGlvbiByZXR1cm5OYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgY2FsbGJhY2tJbmZvKSB7XHJcbiAgICBpZiAoY2FsbGJhY2tJbmZvc0NhY2hlW2FyZ2NdKSB7XHJcbiAgICAgICAgd2FzbUFwaS5fZnJlZShjYWxsYmFja0luZm8pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgY2FsbGJhY2tJbmZvc0NhY2hlW2FyZ2NdID0gY2FsbGJhY2tJbmZvO1xyXG4gICAgfVxyXG59XHJcbi8vIFRPRE86IOWFiOeugOWNleWIhumFjeeUsXdhc23pgqPph4rmlL7vvIzlkI7nu63lho3kvJjljJZcclxuZnVuY3Rpb24gZ2V0QnVmZmVyKHdhc21BcGksIHNpemUpIHtcclxuICAgIHJldHVybiB3YXNtQXBpLl9tYWxsb2Moc2l6ZSk7XHJcbn1cclxuZnVuY3Rpb24ganNWYWx1ZVRvUGFwaVZhbHVlKHdhc21BcGksIGFyZywgdmFsdWUpIHtcclxuICAgIGxldCBoZWFwID0gd2FzbUFwaS5IRUFQVTg7XHJcbiAgICBjb25zdCBkYXRhUHRyID0gdmFsdWU7XHJcbiAgICBjb25zdCB0YWdQdHIgPSBkYXRhUHRyICsgODtcclxuICAgIGlmIChhcmcgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19VTkRFRklORUQsIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhcmcgPT09IG51bGwpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfTlVMTCwgdGFnUHRyKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdiaWdpbnQnKSB7XHJcbiAgICAgICAgaWYgKGFyZyA+IDkyMjMzNzIwMzY4NTQ3NzU4MDduKSB7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZVVJbnQ2NChoZWFwLCBhcmcsIGRhdGFQdHIpO1xyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfVUlOVDY0LCB0YWdQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50NjQoaGVhcCwgYXJnLCBkYXRhUHRyKTtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0lOVDY0LCB0YWdQdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoYXJnKSkge1xyXG4gICAgICAgICAgICBpZiAoYXJnID49IC0yMTQ3NDgzNjQ4ICYmIGFyZyA8PSAyMTQ3NDgzNjQ3KSB7XHJcbiAgICAgICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBhcmcsIGRhdGFQdHIpO1xyXG4gICAgICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0lOVCwgdGFnUHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDY0KGhlYXAsIGFyZywgZGF0YVB0cik7XHJcbiAgICAgICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfSU5UNjQsIHRhZ1B0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZURvdWJsZShoZWFwLCBhcmcsIGRhdGFQdHIpO1xyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfRkxPQVQ2NCwgdGFnUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGNvbnN0IGxlbiA9IHdhc21BcGkubGVuZ3RoQnl0ZXNVVEYxNihhcmcpO1xyXG4gICAgICAgIGNvbnN0IHB0ciA9IGdldEJ1ZmZlcih3YXNtQXBpLCBsZW4gKyAyKTtcclxuICAgICAgICB3YXNtQXBpLnN0cmluZ1RvVVRGMTYoYXJnLCBwdHIsIGxlbiArIDIpO1xyXG4gICAgICAgIGhlYXAgPSB3YXNtQXBpLkhFQVBVODsgLy8gZ2V0QnVmZmVy5Lya55Sz6K+35YaF5a2Y77yM5Y+v6IO95a+86Ie0SEVBUFU45pS55Y+YXHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgcHRyLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBhcmcubGVuZ3RoLCBkYXRhUHRyICsgNCk7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX1NUUklORzE2LCB0YWdQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIDEsIHRhZ1B0ciArIDQpOyAvLyBuZWVkX2ZyZWUgPSB0cnVlXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnYm9vbGVhbicpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBhcmcgPyAxIDogMCwgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0JPT0wsIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoYXJnKSwgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0ZVTkNUSU9OLCB0YWdQdHIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShhcmcpLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfQVJSQVksIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBhcmcgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbiAgICAgICAgY29uc3QgbGVuID0gYXJnLmJ5dGVMZW5ndGg7XHJcbiAgICAgICAgY29uc3QgcHRyID0gZ2V0QnVmZmVyKHdhc21BcGksIGxlbik7XHJcbiAgICAgICAgd2FzbUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhcmcpLCBwdHIpO1xyXG4gICAgICAgIGhlYXAgPSB3YXNtQXBpLkhFQVBVODsgLy8gZ2V0QnVmZmVy5Lya55Sz6K+35YaF5a2Y77yM5Y+v6IO95a+86Ie0SEVBUFU45pS55Y+YXHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgcHRyLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBsZW4sIGRhdGFQdHIgKyA0KTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfQlVGRkVSLCB0YWdQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIDEsIHRhZ1B0ciArIDQpOyAvLyBuZWVkX2ZyZWUgPSB0cnVlXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGNvbnN0IG50b0luZm8gPSBPYmplY3RQb29sLkdldE5hdGl2ZUluZm9PZk9iamVjdChhcmcpO1xyXG4gICAgICAgIGlmIChudG9JbmZvKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IFtvYmpJZCwgdHlwZUlkXSA9IG50b0luZm87XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIG9iaklkLCBkYXRhUHRyKTtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgdHlwZUlkLCBkYXRhUHRyICsgNCk7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19OQVRJVkVfT0JKRUNULCB0YWdQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoYXJnKSwgZGF0YVB0cik7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19PQkpFQ1QsIHRhZ1B0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIGFyZ3VtZW50IHR5cGU6ICR7dHlwZW9mIGFyZ31gKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBqc0FyZ3NUb0NhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjLCBhcmdzKSB7XHJcbiAgICBjb25zdCBjYWxsYmFja0luZm8gPSBnZXROYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYyk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ2M7ICsraSkge1xyXG4gICAgICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV07XHJcbiAgICAgICAganNWYWx1ZVRvUGFwaVZhbHVlKHdhc21BcGksIGFyZywgY2FsbGJhY2tJbmZvICsgMzIgKyAoaSAqIDE2KSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2FsbGJhY2tJbmZvO1xyXG59XHJcbmZ1bmN0aW9uIGdlbkpzQ2FsbGJhY2sod2FzbUFwaSwgY2FsbGJhY2ssIGRhdGEsIHBhcGksIGlzU3RhdGljKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcclxuICAgICAgICBpZiAobmV3LnRhcmdldCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wibm90IGEgY29uc3RydWN0b3InKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGNhbGxiYWNrSW5mbyA9IHVuZGVmaW5lZDtcclxuICAgICAgICBjb25zdCBhcmdjID0gYXJncy5sZW5ndGg7XHJcbiAgICAgICAgY29uc3Qgc2NvcGUgPSBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mbyA9IGpzQXJnc1RvQ2FsbGJhY2tJbmZvKHdhc21BcGksIGFyZ2MsIGFyZ3MpO1xyXG4gICAgICAgICAgICBjb25zdCBoZWFwID0gd2FzbUFwaS5IRUFQVTg7IC8v5ZyoUEFwaUNhbGxiYWNrV2l0aFNjb3Bl5YmN6YO95LiN5Lya5Y+Y5YyW77yM6L+Z5qC355So5piv5a6J5YWo55qEXHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIGRhdGEsIGNhbGxiYWNrSW5mbyArIDgpOyAvLyBkYXRhXHJcbiAgICAgICAgICAgIGxldCBvYmpJZCA9IDA7XHJcbiAgICAgICAgICAgIGxldCB0eXBlSWQgPSAwO1xyXG4gICAgICAgICAgICBpZiAoIWlzU3RhdGljICYmIHRoaXMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG50b0luZm8gPSBPYmplY3RQb29sLkdldE5hdGl2ZUluZm9PZk9iamVjdCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGlmIChudG9JbmZvKVxyXG4gICAgICAgICAgICAgICAgICAgIFtvYmpJZCwgdHlwZUlkXSA9IG50b0luZm87XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgb2JqSWQsIGNhbGxiYWNrSW5mbyk7IC8vIHRoaXNQdHJcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgdHlwZUlkLCBjYWxsYmFja0luZm8gKyAxMik7IC8vIHRoaXNUeXBlSWRcclxuICAgICAgICAgICAgd2FzbUFwaS5QQXBpQ2FsbGJhY2tXaXRoU2NvcGUoY2FsbGJhY2ssIHBhcGksIGNhbGxiYWNrSW5mbyk7IC8vIOmihOacn3dhc23lj6rkvJrpgJrov4d0aHJvd19ieV9zdHJpbmfmipvlvILluLjvvIzkuI3kuqfnlJ/nm7TmjqVqc+W8guW4uFxyXG4gICAgICAgICAgICBpZiAoaGFzRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMod2FzbUFwaSwgb2JqTWFwcGVyLCBjYWxsYmFja0luZm8gKyAxNiwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICByZXR1cm5OYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgY2FsbGJhY2tJbmZvKTtcclxuICAgICAgICAgICAgc2NvcGUuY2xvc2Uod2FzbUFwaSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG4vLyDpnIDopoHlnKhVbml0eemHjOiwg+eUqFBsYXllclNldHRpbmdzLldlYkdMLmVtc2NyaXB0ZW5BcmdzID0gXCIgLXMgQUxMT1dfVEFCTEVfR1JPV1RIPTFcIjtcclxuZnVuY3Rpb24gV2ViR0xGRklBcGkoZW5naW5lKSB7XHJcbiAgICB3YXNtQXBpID0gZW5naW5lLnVuaXR5QXBpO1xyXG4gICAgb2JqTWFwcGVyID0gbmV3IE9iamVjdE1hcHBlcigpO1xyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9hcnJheShlbnYpIHtcclxuICAgICAgICByZXR1cm4gU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoW10pO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9vYmplY3QoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKE9iamVjdC5jcmVhdGUobnVsbCkpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9mdW5jdGlvbihlbnYsIG5hdGl2ZV9pbXBsLCBkYXRhLCBmaW5hbGl6ZSAvLyBUT0RPOiBnY+aXtuiwg+eUqGZpbmFsaXplXHJcbiAgICApIHtcclxuICAgICAgICBjb25zdCBqc0NhbGxiYWNrID0gZ2VuSnNDYWxsYmFjayhlbmdpbmUudW5pdHlBcGksIG5hdGl2ZV9pbXBsLCBkYXRhLCB3ZWJnbEZGSSwgZmFsc2UpO1xyXG4gICAgICAgIHJldHVybiBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShqc0NhbGxiYWNrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfY2xhc3MoZW52LCB0eXBlSWQpIHtcclxuICAgICAgICBjb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkubG9hZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgY2xzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYGNyZWF0ZSBjbGFzczogJHtjbHMubmFtZX1gKTtcclxuICAgICAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGNscyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbid0IGxvYWQgY2xhc3MgYnkgdHlwZSBpZDogXCIgKyB0eXBlSWQpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9hcnJheV9sZW5ndGgoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBhcnJheSA9IFNjb3BlLmdldEN1cnJlbnQoKS5nZXRGcm9tU2NvcGUocHZhbHVlKTtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoOiB2YWx1ZSBpcyBub3QgYW4gYXJyYXlcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnJheS5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfbmF0aXZlX29iamVjdF90b192YWx1ZShlbnYsIHR5cGVJZCwgb2JqZWN0X3B0ciwgY2FsbF9maW5hbGl6ZSkge1xyXG4gICAgICAgIGNvbnN0IGpzT2JqID0gb2JqTWFwcGVyLnB1c2hOYXRpdmVPYmplY3Qob2JqZWN0X3B0ciwgdHlwZUlkLCBjYWxsX2ZpbmFsaXplKTtcclxuICAgICAgICAvLyBUT0RPOiBqdXN0IGZvciB0ZXN0XHJcbiAgICAgICAgLy9jb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkuZmluZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIC8vaWYgKGNscy5uYW1lID09IFwiSnNFbnZcIikge1xyXG4gICAgICAgIC8vICAgIGNvbnNvbGUubG9nKGBjYWxsIEZpbGVFeGlzdHMoYWFiYi50eHQpOiAkeyhqc09iaiBhcyBhbnkpLmxvYWRlci5GaWxlRXhpc3RzKFwiYWFiYi50eHRcIil9YCk7XHJcbiAgICAgICAgLy8gICAgY29uc29sZS5sb2coYGNhbGwgRmlsZUV4aXN0cyhwdWVydHMvZXNtX2Jvb3RzdHJhcC5janMpOiAkeyhqc09iaiBhcyBhbnkpLmxvYWRlci5GaWxlRXhpc3RzKFwicHVlcnRzL2VzbV9ib290c3RyYXAuY2pzXCIpfWApO1xyXG4gICAgICAgIC8vfVxyXG4gICAgICAgIHJldHVybiBvYmplY3RfcHRyO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3Rocm93X2J5X3N0cmluZyhwaW5mbywgcG1zZykge1xyXG4gICAgICAgIGNvbnN0IG1zZyA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocG1zZyk7XHJcbiAgICAgICAgc2V0TGFzdEV4Y2VwdGlvbihuZXcgRXJyb3IobXNnKSk7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5L2c55So5Z+f566h55CGIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGUocGVudl9yZWYpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50KHBlbnZfcmVmLCBtZW1vcnkpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2hhc19jYXVnaHQocHNjb3BlKSB7XHJcbiAgICAgICAgcmV0dXJuIGhhc0V4Y2VwdGlvbjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfZXhjZXB0aW9uX2FzX3N0cmluZyhwc2NvcGUsIHdpdGhfc3RhY2spIHtcclxuICAgICAgICByZXR1cm4gZ2V0RXhjZXB0aW9uQXNOYXRpdmVTdHJpbmcoZW5naW5lLnVuaXR5QXBpLCB3aXRoX3N0YWNrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jbG9zZV9zY29wZShwc2NvcGUpIHtcclxuICAgICAgICBTY29wZS5leGl0KGVuZ2luZS51bml0eUFwaSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50KHBzY29wZSkge1xyXG4gICAgICAgIFNjb3BlLmV4aXQoZW5naW5lLnVuaXR5QXBpKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlZmVyZW5jZWRWYWx1ZXMgPSBuZXcgU3BhcnNlQXJyYXkoKTtcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmKGVudiwgcHZhbHVlLCBpbnRlcm5hbF9maWVsZF9jb3VudCkge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHB2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHJlZmVyZW5jZWRWYWx1ZXMuYWRkKHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZihwdmFsdWVfcmVmKSB7XHJcbiAgICAgICAgcmVmZXJlbmNlZFZhbHVlcy5yZW1vdmUocHZhbHVlX3JlZik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmKGVudiwgcHZhbHVlX3JlZiwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSByZWZlcmVuY2VkVmFsdWVzLmdldChwdmFsdWVfcmVmKTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCB2YWx1ZSwgcHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCB2YWx1ZSwgcHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9zZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcml2YXRlKGVudiwgcG9iamVjdCwgb3V0X3B0cikge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwb2JqZWN0KTtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgMCwgb3V0X3B0cik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgb2JqWydfX3BfcHJpdmF0ZV9kYXRhJ10sIG91dF9wdHIpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9wcml2YXRlKGVudiwgcG9iamVjdCwgcHRyKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnICYmIHR5cGVvZiBvYmogIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9ialsnX19wX3ByaXZhdGVfZGF0YSddID0gcHRyO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcm9wZXJ0eV91aW50MzIoZW52LCBwb2JqZWN0LCBrZXksIHB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwb2JqZWN0KTtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMjogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAganNWYWx1ZVRvUGFwaVZhbHVlKGVuZ2luZS51bml0eUFwaSwgdmFsdWUsIHB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMihlbnYsIHBvYmplY3QsIGtleSwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcHJvcGVydHlfdWludDMyOiB0YXJnZXQgaXMgbm90IGFuIG9iamVjdFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWHveaVsOiwg+eUqC/miafooYwgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2FsbF9mdW5jdGlvbihlbnYsIHBmdW5jLCB0aGlzX29iamVjdCwgYXJnYywgYXJndiwgcHJlc3VsdCkge1xyXG4gICAgICAgIGNvbnN0IGZ1bmMgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcGZ1bmMpO1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgdGhpc19vYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jYWxsX2Z1bmN0aW9uOiB0YXJnZXQgaXMgbm90IGEgZnVuY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGhlYXAgPSBlbmdpbmUudW5pdHlBcGkuSEVBUFU4O1xyXG4gICAgICAgIGNvbnN0IGFyZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ2M7ICsraSkge1xyXG4gICAgICAgICAgICBjb25zdCBhcmdQdHIgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIGFyZ3YgKyBpICogNCk7XHJcbiAgICAgICAgICAgIGFyZ3MucHVzaChTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgYXJnUHRyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncyk7XHJcbiAgICAgICAgICAgIGpzVmFsdWVUb1BhcGlWYWx1ZShlbmdpbmUudW5pdHlBcGksIHJlc3VsdCwgcHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHNldExhc3RFeGNlcHRpb24oZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8g5ZKMcGVzYXBpLmjlo7DmmI7kuI3kuIDmoLfvvIzov5nmlLnkuLrov5Tlm57lgLzmjIfpkojnlLHosIPnlKjogIXvvIjljp/nlJ/vvInkvKDlhaVcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9ldmFsKGVudiwgcGNvZGUsIGNvZGVfc2l6ZSwgcGF0aCwgcHJlc3VsdCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghZ2xvYmFsVGhpcy5ldmFsKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJldmFsIGlzIG5vdCBzdXBwb3J0ZWRcIik7IC8vIFRPRE86IOaKm+e7mXdhc23mm7TlkIjpgILkuptcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjb2RlID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhwY29kZSwgY29kZV9zaXplKTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZ2xvYmFsVGhpcy5ldmFsKGNvZGUpO1xyXG4gICAgICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCByZXN1bHQsIHByZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBzZXRMYXN0RXhjZXB0aW9uKGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nbG9iYWwoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGdsb2JhbFRoaXMpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9lbnZfcHJpdmF0ZShlbnYsIHB0cikge1xyXG4gICAgICAgIG9iak1hcHBlci5zZXRFbnZQcml2YXRlKHB0cik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X3JlZ2lzdHJ5KGVudiwgcmVnaXN0cnlfKSB7XHJcbiAgICAgICAgcmVnaXN0cnkgPSByZWdpc3RyeV87XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBUcmFuVG9TdHJpbmcocHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHN0ciA9ICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSA/IFwidW5kZWZpbmVkXCIgOiAodmFsdWUgPT09IG51bGwgPyBcIm51bGxcIiA6IHZhbHVlLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIGpzVmFsdWVUb1BhcGlWYWx1ZShlbmdpbmUudW5pdHlBcGksIHN0ciwgcHZhbHVlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgR2V0V2ViR0xGRklBcGk6IEdldFdlYkdMRkZJQXBpLFxyXG4gICAgICAgIEdldFdlYkdMUGFwaVZlcnNpb246IEdldFdlYkdMUGFwaVZlcnNpb24sXHJcbiAgICAgICAgQ3JlYXRlV2ViR0xQYXBpRW52UmVmOiBDcmVhdGVXZWJHTFBhcGlFbnZSZWYsXHJcbiAgICAgICAgVHJhblRvU3RyaW5nOiBUcmFuVG9TdHJpbmcsXHJcbiAgICAgICAgcGVzYXBpX2NyZWF0ZV9hcnJheV9qczogcGVzYXBpX2NyZWF0ZV9hcnJheSxcclxuICAgICAgICBwZXNhcGlfY3JlYXRlX29iamVjdF9qczogcGVzYXBpX2NyZWF0ZV9vYmplY3QsXHJcbiAgICAgICAgcGVzYXBpX2NyZWF0ZV9mdW5jdGlvbl9qczogcGVzYXBpX2NyZWF0ZV9mdW5jdGlvbixcclxuICAgICAgICBwZXNhcGlfY3JlYXRlX2NsYXNzX2pzOiBwZXNhcGlfY3JlYXRlX2NsYXNzLFxyXG4gICAgICAgIHBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoX2pzOiBwZXNhcGlfZ2V0X2FycmF5X2xlbmd0aCxcclxuICAgICAgICBwZXNhcGlfbmF0aXZlX29iamVjdF90b192YWx1ZV9qczogcGVzYXBpX25hdGl2ZV9vYmplY3RfdG9fdmFsdWUsXHJcbiAgICAgICAgcGVzYXBpX3Rocm93X2J5X3N0cmluZ19qczogcGVzYXBpX3Rocm93X2J5X3N0cmluZyxcclxuICAgICAgICBwZXNhcGlfb3Blbl9zY29wZV9wbGFjZW1lbnRfanM6IHBlc2FwaV9vcGVuX3Njb3BlX3BsYWNlbWVudCxcclxuICAgICAgICBwZXNhcGlfaGFzX2NhdWdodF9qczogcGVzYXBpX2hhc19jYXVnaHQsXHJcbiAgICAgICAgcGVzYXBpX2dldF9leGNlcHRpb25fYXNfc3RyaW5nX2pzOiBwZXNhcGlfZ2V0X2V4Y2VwdGlvbl9hc19zdHJpbmcsXHJcbiAgICAgICAgcGVzYXBpX2Nsb3NlX3Njb3BlX3BsYWNlbWVudF9qczogcGVzYXBpX2Nsb3NlX3Njb3BlX3BsYWNlbWVudCxcclxuICAgICAgICBwZXNhcGlfY3JlYXRlX3ZhbHVlX3JlZl9qczogcGVzYXBpX2NyZWF0ZV92YWx1ZV9yZWYsXHJcbiAgICAgICAgcGVzYXBpX3JlbGVhc2VfdmFsdWVfcmVmX2pzOiBwZXNhcGlfcmVsZWFzZV92YWx1ZV9yZWYsXHJcbiAgICAgICAgcGVzYXBpX2dldF92YWx1ZV9mcm9tX3JlZl9qczogcGVzYXBpX2dldF92YWx1ZV9mcm9tX3JlZixcclxuICAgICAgICBwZXNhcGlfZ2V0X3Byb3BlcnR5X2pzOiBwZXNhcGlfZ2V0X3Byb3BlcnR5LFxyXG4gICAgICAgIHBlc2FwaV9zZXRfcHJvcGVydHlfanM6IHBlc2FwaV9zZXRfcHJvcGVydHksXHJcbiAgICAgICAgcGVzYXBpX2dldF9wcml2YXRlX2pzOiBwZXNhcGlfZ2V0X3ByaXZhdGUsXHJcbiAgICAgICAgcGVzYXBpX3NldF9wcml2YXRlX2pzOiBwZXNhcGlfc2V0X3ByaXZhdGUsXHJcbiAgICAgICAgcGVzYXBpX2dldF9wcm9wZXJ0eV91aW50MzJfanM6IHBlc2FwaV9nZXRfcHJvcGVydHlfdWludDMyLFxyXG4gICAgICAgIHBlc2FwaV9zZXRfcHJvcGVydHlfdWludDMyX2pzOiBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMixcclxuICAgICAgICBwZXNhcGlfY2FsbF9mdW5jdGlvbl9qczogcGVzYXBpX2NhbGxfZnVuY3Rpb24sXHJcbiAgICAgICAgcGVzYXBpX2V2YWxfanM6IHBlc2FwaV9ldmFsLFxyXG4gICAgICAgIHBlc2FwaV9nbG9iYWxfanM6IHBlc2FwaV9nbG9iYWwsXHJcbiAgICAgICAgcGVzYXBpX3NldF9lbnZfcHJpdmF0ZV9qczogcGVzYXBpX3NldF9lbnZfcHJpdmF0ZSxcclxuICAgICAgICBwZXNhcGlfc2V0X3JlZ2lzdHJ5X2pzOiBwZXNhcGlfc2V0X3JlZ2lzdHJ5XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuV2ViR0xGRklBcGkgPSBXZWJHTEZGSUFwaTtcclxuZnVuY3Rpb24gR2V0V2ViR0xGRklBcGkoKSB7XHJcbiAgICBpZiAod2ViZ2xGRkkpXHJcbiAgICAgICAgcmV0dXJuIHdlYmdsRkZJO1xyXG4gICAgd2ViZ2xGRkkgPSB3YXNtQXBpLkluamVjdFBhcGlHTE5hdGl2ZUltcGwoKTtcclxuICAgIHJldHVybiB3ZWJnbEZGSTtcclxufVxyXG5mdW5jdGlvbiBHZXRXZWJHTFBhcGlWZXJzaW9uKCkge1xyXG4gICAgcmV0dXJuIDExO1xyXG59XHJcbmZ1bmN0aW9uIENyZWF0ZVdlYkdMUGFwaUVudlJlZigpIHtcclxuICAgIHJldHVybiAyMDQ4OyAvLyBqdXN0IG5vdCBudWxscHRyXHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGVzYXBpSW1wbC5qcy5tYXAiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJcInVzZSBzdHJpY3RcIjtcclxuLypcclxuKiBUZW5jZW50IGlzIHBsZWFzZWQgdG8gc3VwcG9ydCB0aGUgb3BlbiBzb3VyY2UgY29tbXVuaXR5IGJ5IG1ha2luZyBQdWVydHMgYXZhaWxhYmxlLlxyXG4qIENvcHlyaWdodCAoQykgMjAyMCBUZW5jZW50LiAgQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKiBQdWVydHMgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRCAzLUNsYXVzZSBMaWNlbnNlLCBleGNlcHQgZm9yIHRoZSB0aGlyZC1wYXJ0eSBjb21wb25lbnRzIGxpc3RlZCBpbiB0aGUgZmlsZSAnTElDRU5TRScgd2hpY2ggbWF5IGJlIHN1YmplY3QgdG8gdGhlaXIgY29ycmVzcG9uZGluZyBsaWNlbnNlIHRlcm1zLlxyXG4qIFRoaXMgZmlsZSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBhbmQgY29uZGl0aW9ucyBkZWZpbmVkIGluIGZpbGUgJ0xJQ0VOU0UnLCB3aGljaCBpcyBwYXJ0IG9mIHRoaXMgc291cmNlIGNvZGUgcGFja2FnZS5cclxuKi9cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4vKipcclxuICog5qC55o2uIGh0dHBzOi8vZG9jcy51bml0eTNkLmNvbS8yMDE4LjQvRG9jdW1lbnRhdGlvbi9NYW51YWwvd2ViZ2wtaW50ZXJhY3Rpbmd3aXRoYnJvd3NlcnNjcmlwdGluZy5odG1sXHJcbiAqIOaIkeS7rOeahOebrueahOWwseaYr+WcqFdlYkdM5qih5byP5LiL77yM5a6e546w5ZKMcHVlcnRzLmRsbOeahOaViOaenOOAguWFt+S9k+WcqOS6juWunueOsOS4gOS4qmpzbGli77yM6YeM6Z2i5bqU5YyF5ZCrUHVlcnRzRExMLmNz55qE5omA5pyJ5o6l5Y+jXHJcbiAqIOWunumqjOWPkeeOsOi/meS4qmpzbGli6Jm954S25Lmf5piv6L+Q6KGM5ZyodjjnmoRqc++8jOS9huWvuWRldnRvb2zosIPor5XlubbkuI3lj4vlpb3vvIzkuJTlj6rmlK/mjIHliLBlczXjgIJcclxuICog5Zug5q2k5bqU6K+l6YCa6L+H5LiA5Liq54us56uL55qEanPlrp7njrDmjqXlj6PvvIxwdWVydHMuanNsaWLpgJrov4flhajlsYDnmoTmlrnlvI/osIPnlKjlroPjgIJcclxuICpcclxuICog5pyA57uI5b2i5oiQ5aaC5LiL5p625p6EXHJcbiAqIOS4muWKoUpTIDwtPiBXQVNNIDwtPiB1bml0eSBqc2xpYiA8LT4g5pysanNcclxuICog5L2G5pW05p2h6ZO+6Lev5YW25a6e6YO95Zyo5LiA5LiqdjgoanNjb3JlKeiZmuaLn+acuumHjFxyXG4gKi9cclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4vbGlicmFyeVwiKTtcclxuY29uc3QgcGVzYXBpSW1wbF8xID0gcmVxdWlyZShcIi4vcGVzYXBpSW1wbFwiKTtcclxubGlicmFyeV8xLmdsb2JhbC53eFJlcXVpcmUgPSBsaWJyYXJ5XzEuZ2xvYmFsLnJlcXVpcmU7XHJcbmxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wgPSB7XHJcbiAgICBpbml0ZWQ6IGZhbHNlLFxyXG4gICAgZGVidWc6IGZhbHNlLFxyXG4gICAgLy8gcHVlcnRz6aaW5qyh5Yid5aeL5YyW5pe25Lya6LCD55So6L+Z6YeM77yM5bm25oqKVW5pdHnnmoTpgJrkv6HmjqXlj6PkvKDlhaVcclxuICAgIEluaXQoY3RvclBhcmFtKSB7XHJcbiAgICAgICAgY29uc3QgZW5naW5lID0gbmV3IGxpYnJhcnlfMS5QdWVydHNKU0VuZ2luZShjdG9yUGFyYW0pO1xyXG4gICAgICAgIGNvbnN0IGV4ZWN1dGVNb2R1bGVDYWNoZSA9IHt9O1xyXG4gICAgICAgIGxldCBqc0VuZ2luZVJldHVybmVkID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IGxvYWRlcjtcclxuICAgICAgICAvLyBQdWVydHNETEznmoTmiYDmnInmjqXlj6Plrp7njrBcclxuICAgICAgICBsaWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMID0gT2JqZWN0LmFzc2lnbihsaWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMLCB7XHJcbiAgICAgICAgICAgIHVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzOiBlbmdpbmUudXBkYXRlR2xvYmFsQnVmZmVyQW5kVmlld3MuYmluZChlbmdpbmUpXHJcbiAgICAgICAgfSwgKDAsIHBlc2FwaUltcGxfMS5XZWJHTEZGSUFwaSkoZW5naW5lKSwge1xyXG4gICAgICAgICAgICAvLyBicmlkZ2VMb2c6IHRydWUsXHJcbiAgICAgICAgICAgIExvd01lbW9yeU5vdGlmaWNhdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgSWRsZU5vdGlmaWNhdGlvbkRlYWRsaW5lOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBSZXF1ZXN0TWlub3JHYXJiYWdlQ29sbGVjdGlvbkZvclRlc3Rpbmc6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFJlcXVlc3RGdWxsR2FyYmFnZUNvbGxlY3Rpb25Gb3JUZXN0aW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBDbGVhck1vZHVsZUNhY2hlOiBmdW5jdGlvbiAoKSB7IH0sXHJcbiAgICAgICAgICAgIENyZWF0ZUluc3BlY3RvcjogZnVuY3Rpb24gKGlzb2xhdGUsIHBvcnQpIHsgfSxcclxuICAgICAgICAgICAgRGVzdHJveUluc3BlY3RvcjogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgSW5zcGVjdG9yVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgTG9naWNUaWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBTZXRMb2dDYWxsYmFjazogZnVuY3Rpb24gKGxvZywgbG9nV2FybmluZywgbG9nRXJyb3IpIHtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0SlNTdGFja1RyYWNlOiBmdW5jdGlvbiAoaXNvbGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcigpLnN0YWNrO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRXZWJHTFBhcGlFbnZSZWY6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAyMDQ4OyAvLyBqdXN0IG5vdCBudWxscHRyXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9