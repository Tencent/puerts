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
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
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


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.returnBigInt = exports.isBigInt = exports.setOutValue8 = exports.setOutValue32 = exports.makeBigInt = exports.GetType = exports.PuertsJSEngine = exports.OnFinalize = exports.createWeakRef = exports.global = exports.CSharpObjectMap = exports.jsFunctionOrObjectFactory = exports.JSObject = exports.JSFunction = exports.FunctionCallbackInfoPtrManager = exports.FunctionCallbackInfo = void 0;
/**
 * 一次函数调用的info
 * 对应v8::FunctionCallbackInfo
 */
class FunctionCallbackInfo {
    args;
    returnValue;
    stack = 0;
    constructor(args) {
        this.args = args;
    }
    recycle() {
        this.stack = 0;
        this.args = null;
        this.returnValue = void 0;
    }
}
exports.FunctionCallbackInfo = FunctionCallbackInfo;
// struct MockV8Value
// {
//     int JSValueType;  // 0
//     int FinalValuePointer[2]; // 1 2 if value is bigint FinalValuePointer[0] for low, FinalValuePointer[1] for high
//     int extra; // 3
//     int FunctionCallbackInfo; // 4
// };
const ArgumentValueLengthIn32 = 4; // int count
/**
 * 把FunctionCallbackInfo以及其参数转化为c#可用的intptr
 */
class FunctionCallbackInfoPtrManager {
    // FunctionCallbackInfo的列表，以列表的index作为IntPtr的值
    infos = [new FunctionCallbackInfo([0])]; // 这里原本只是个普通的0
    // FunctionCallbackInfo用完后，将其序号放入“回收列表”，下次就能继续服用该index，而不必让infos数组无限扩展下去
    freeInfosIndex = [];
    freeCallbackInfoMemoryByLength = {};
    freeRefMemory = [];
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    allocCallbackInfoMemory(argsLength) {
        const cacheArray = this.freeCallbackInfoMemoryByLength[argsLength];
        if (cacheArray && cacheArray.length) {
            return cacheArray.pop();
        }
        else {
            return this.engine.unityApi._malloc((argsLength * ArgumentValueLengthIn32 + 1) << 2);
        }
    }
    allocRefMemory() {
        if (this.freeRefMemory.length)
            return this.freeRefMemory.pop();
        return this.engine.unityApi._malloc(ArgumentValueLengthIn32 << 2);
    }
    recycleRefMemory(bufferPtr) {
        if (this.freeRefMemory.length > 20) {
            this.engine.unityApi._free(bufferPtr);
        }
        else {
            this.freeRefMemory.push(bufferPtr);
        }
    }
    recycleCallbackInfoMemory(bufferPtr, args) {
        const argsLength = args.length;
        if (!this.freeCallbackInfoMemoryByLength[argsLength] && argsLength < 5) {
            this.freeCallbackInfoMemoryByLength[argsLength] = [];
        }
        const cacheArray = this.freeCallbackInfoMemoryByLength[argsLength];
        if (!cacheArray)
            return;
        const bufferPtrIn32 = bufferPtr << 2;
        for (let i = 0; i < argsLength; ++i) {
            if (args[i] instanceof Array && args[i].length == 1) {
                this.recycleRefMemory(this.engine.unityApi.HEAP32[bufferPtrIn32 + i * ArgumentValueLengthIn32 + 1]);
            }
        }
        // 拍脑袋定的最大缓存个数大小。 50 - 参数个数 * 10
        if (cacheArray.length > (50 - argsLength * 10)) {
            this.engine.unityApi._free(bufferPtr);
        }
        else {
            cacheArray.push(bufferPtr);
        }
    }
    /**
     * intptr的格式为id左移四位
     *
     * 右侧四位，是为了在右四位存储参数的序号，这样可以用于表示callbackinfo参数的intptr
     */
    // static GetMockPointer(args: any[]): MockIntPtr {
    //     let index: number;
    //     index = this.freeInfosIndex.pop();
    //     // index最小为1
    //     if (index) {
    //         this.infos[index].args = args;
    //     } else {
    //         index = this.infos.push(new FunctionCallbackInfo(args)) - 1;
    //     }
    //     return index << 4;
    // }
    GetMockPointer(args) {
        const argsLength = args.length;
        let bufferPtrIn8 = this.allocCallbackInfoMemory(argsLength);
        let index = this.freeInfosIndex.pop();
        let functionCallbackInfo;
        // index最小为1
        if (index) {
            (functionCallbackInfo = this.infos[index]).args = args;
        }
        else {
            index = this.infos.push(functionCallbackInfo = new FunctionCallbackInfo(args)) - 1;
        }
        let unityApi = this.engine.unityApi;
        const bufferPtrIn32 = bufferPtrIn8 >> 2;
        unityApi.HEAP32[bufferPtrIn32] = index;
        for (let i = 0; i < argsLength; i++) {
            let arg = args[i];
            // init each value
            const jsValueType = GetType(this.engine, arg);
            const jsValuePtr = bufferPtrIn32 + i * ArgumentValueLengthIn32 + 1;
            unityApi.HEAP32[jsValuePtr] = jsValueType; // jsvaluetype
            if (jsValueType == 2 || jsValueType == 4 || jsValueType == 512) {
                // bigint、number or date
                $FillArgumentFinalNumberValue(this.engine, arg, jsValueType, jsValuePtr + 1); // value
            }
            else if (jsValueType == 8) {
                if (functionCallbackInfo.stack == 0) {
                    functionCallbackInfo.stack = unityApi.stackSave();
                }
                unityApi.HEAP32[jsValuePtr + 1] = $GetArgumentFinalValue(this.engine, arg, jsValueType, (jsValuePtr + 2) << 2);
            }
            else if (jsValueType == 64 && arg instanceof Array && arg.length == 1) {
                // maybe a ref
                unityApi.HEAP32[jsValuePtr + 1] = $GetArgumentFinalValue(this.engine, arg, jsValueType, 0);
                const refPtrIn8 = unityApi.HEAP32[jsValuePtr + 2] = this.allocRefMemory();
                const refPtr = refPtrIn8 >> 2;
                const refValueType = unityApi.HEAP32[refPtr] = GetType(this.engine, arg[0]);
                if (refValueType == 2 || refValueType == 4 || refValueType == 512) {
                    // number or date
                    $FillArgumentFinalNumberValue(this.engine, arg[0], refValueType, refPtr + 1); // value
                }
                else {
                    unityApi.HEAP32[refPtr + 1] = $GetArgumentFinalValue(this.engine, arg[0], refValueType, (refPtr + 2) << 2);
                }
                unityApi.HEAP32[refPtr + 3] = bufferPtrIn8; // a pointer to the info
            }
            else {
                // other
                unityApi.HEAP32[jsValuePtr + 1] = $GetArgumentFinalValue(this.engine, arg, jsValueType, (jsValuePtr + 2) << 2);
            }
            unityApi.HEAP32[jsValuePtr + 3] = bufferPtrIn8; // a pointer to the info
        }
        return bufferPtrIn8;
    }
    // static GetByMockPointer(intptr: MockIntPtr): FunctionCallbackInfo {
    //     return this.infos[intptr >> 4];
    // }
    GetByMockPointer(ptrIn8) {
        const ptrIn32 = ptrIn8 >> 2;
        const index = this.engine.unityApi.HEAP32[ptrIn32];
        return this.infos[index];
    }
    GetReturnValueAndRecycle(ptrIn8) {
        const ptrIn32 = ptrIn8 >> 2;
        const index = this.engine.unityApi.HEAP32[ptrIn32];
        let info = this.infos[index];
        let ret = info.returnValue;
        this.recycleCallbackInfoMemory(ptrIn8, info.args);
        if (info.stack) {
            this.engine.unityApi.stackRestore(info.stack);
        }
        info.recycle();
        this.freeInfosIndex.push(index);
        return ret;
    }
    ReleaseByMockIntPtr(ptrIn8) {
        const ptrIn32 = ptrIn8 >> 2;
        const index = this.engine.unityApi.HEAP32[ptrIn32];
        let info = this.infos[index];
        this.recycleCallbackInfoMemory(ptrIn8, info.args);
        if (info.stack) {
            this.engine.unityApi.stackRestore(info.stack);
        }
        info.recycle();
        this.freeInfosIndex.push(index);
    }
    GetArgsByMockIntPtr(valuePtrIn8) {
        let heap32 = this.engine.unityApi.HEAP32;
        const infoPtrIn8 = heap32[(valuePtrIn8 >> 2) + 3];
        const callbackInfoIndex = heap32[infoPtrIn8 >> 2];
        const argsIndex = (valuePtrIn8 - infoPtrIn8 - 4) / (4 * ArgumentValueLengthIn32);
        return this.infos[callbackInfoIndex].args[argsIndex];
    }
}
exports.FunctionCallbackInfoPtrManager = FunctionCallbackInfoPtrManager;
/**
 * 代表一个JSFunction
 */
class JSFunction {
    _func;
    id;
    args = [];
    lastException = null;
    constructor(id, func) {
        this._func = func;
        this.id = id;
    }
    invoke() {
        var args = [...this.args];
        this.args.length = 0;
        return this._func.apply(this, args);
    }
}
exports.JSFunction = JSFunction;
/**
 * 代表一个JSObject
 */
class JSObject {
    _obj;
    id;
    constructor(id, obj) {
        this._obj = obj;
        this.id = id;
    }
    getObject() {
        return this._obj;
    }
}
exports.JSObject = JSObject;
class jsFunctionOrObjectFactory {
    static regularID = 1;
    static freeID = [];
    static idMap = new WeakMap();
    static jsFuncOrObjectKV = {};
    static getOrCreateJSFunction(funcValue) {
        let id = jsFunctionOrObjectFactory.idMap.get(funcValue);
        if (id) {
            return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        }
        if (this.freeID.length) {
            id = this.freeID.pop();
        }
        else {
            id = jsFunctionOrObjectFactory.regularID++;
        }
        const func = new JSFunction(id, funcValue);
        jsFunctionOrObjectFactory.idMap.set(funcValue, id);
        jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] = func;
        return func;
    }
    static getOrCreateJSObject(obj) {
        let id = jsFunctionOrObjectFactory.idMap.get(obj);
        if (id) {
            return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        }
        if (this.freeID.length) {
            id = this.freeID.pop();
        }
        else {
            id = jsFunctionOrObjectFactory.regularID++;
        }
        const jsObject = new JSObject(id, obj);
        jsFunctionOrObjectFactory.idMap.set(obj, id);
        jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] = jsObject;
        return jsObject;
    }
    static getJSObjectById(id) {
        return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
    }
    static removeJSObjectById(id) {
        const jsObject = jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        if (!jsObject)
            return console.warn('removeJSObjectById failed: id is invalid: ' + id);
        jsFunctionOrObjectFactory.idMap.delete(jsObject.getObject());
        delete jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        this.freeID.push(id);
    }
    static getJSFunctionById(id) {
        return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
    }
    static removeJSFunctionById(id) {
        const jsFunc = jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        if (!jsFunc)
            return console.warn('removeJSFunctionById failed: id is invalid: ' + id);
        jsFunctionOrObjectFactory.idMap.delete(jsFunc._func);
        delete jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        this.freeID.push(id);
    }
}
exports.jsFunctionOrObjectFactory = jsFunctionOrObjectFactory;
/**
 * CSharp对象记录表，记录所有CSharp对象并分配id
 * 和puerts.dll所做的一样
 */
class CSharpObjectMap {
    classes = [null];
    nativeObjectKV = new Map();
    // private nativeObjectKV: { [objectID: CSIdentifier]: WeakRef<any> } = {};
    // private csIDWeakMap: WeakMap<any, CSIdentifier> = new WeakMap();
    namesToClassesID = {};
    classIDWeakMap = new WeakMap();
    constructor() {
        this._memoryDebug && setInterval(() => {
            console.log('addCalled', this.addCalled);
            console.log('removeCalled', this.removeCalled);
            console.log('wr', this.nativeObjectKV.size);
        }, 1000);
    }
    _memoryDebug = false;
    addCalled = 0;
    removeCalled = 0;
    add(csID, obj) {
        this._memoryDebug && this.addCalled++;
        // this.nativeObjectKV[csID] = createWeakRef(obj);
        // this.csIDWeakMap.set(obj, csID);
        this.nativeObjectKV.set(csID, createWeakRef(obj));
        obj['$csid'] = csID;
    }
    remove(csID) {
        this._memoryDebug && this.removeCalled++;
        // delete this.nativeObjectKV[csID];
        this.nativeObjectKV.delete(csID);
    }
    findOrAddObject(csID, classID) {
        let ret = this.nativeObjectKV.get(csID);
        // let ret = this.nativeObjectKV[csID];
        if (ret && (ret = ret.deref())) {
            return ret;
        }
        ret = this.classes[classID].createFromCS(csID);
        // this.add(csID, ret); 构造函数里负责调用
        return ret;
    }
    getCSIdentifierFromObject(obj) {
        // return this.csIDWeakMap.get(obj);
        return obj ? obj.$csid : 0;
    }
}
exports.CSharpObjectMap = CSharpObjectMap;
;
var destructors = {};
exports.global = __webpack_require__.g = __webpack_require__.g || globalThis || window;
__webpack_require__.g.global = __webpack_require__.g;
const createWeakRef = (function () {
    if (typeof WeakRef == 'undefined') {
        if (typeof WXWeakRef == 'undefined') {
            console.error("WeakRef is not defined. maybe you should use newer environment");
            return function (obj) {
                return { deref() { return obj; } };
            };
        }
        console.warn("using WXWeakRef");
        return function (obj) {
            return new WXWeakRef(obj);
        };
    }
    return function (obj) {
        return new WeakRef(obj);
    };
})();
exports.createWeakRef = createWeakRef;
class FinalizationRegistryMock {
    _handler;
    refs = [];
    helds = [];
    availableIndex = [];
    constructor(handler) {
        console.warn("FinalizationRegister is not defined. using FinalizationRegistryMock");
        __webpack_require__.g._puerts_registry = this;
        this._handler = handler;
    }
    register(obj, heldValue) {
        if (this.availableIndex.length) {
            const index = this.availableIndex.pop();
            this.refs[index] = createWeakRef(obj);
            this.helds[index] = heldValue;
        }
        else {
            this.refs.push(createWeakRef(obj));
            this.helds.push(heldValue);
        }
    }
    /**
     * 清除可能已经失效的WeakRef
     */
    iteratePosition = 0;
    cleanup(part = 1) {
        const stepCount = this.refs.length / part;
        let i = this.iteratePosition;
        for (let currentStep = 0; i < this.refs.length && currentStep < stepCount; i = (i == this.refs.length - 1 ? 0 : i + 1), currentStep++) {
            if (this.refs[i] == null) {
                continue;
            }
            if (!this.refs[i].deref()) {
                // 目前没有内存整理能力，如果游戏中期ref很多但后期少了，这里就会白费遍历次数
                // 但遍历也只是一句==和continue，浪费影响不大
                this.availableIndex.push(i);
                this.refs[i] = null;
                try {
                    this._handler(this.helds[i]);
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
        this.iteratePosition = i;
    }
}
var registry = null;
function init() {
    registry = new (typeof FinalizationRegistry == 'undefined' ? FinalizationRegistryMock : FinalizationRegistry)(function (heldValue) {
        var callback = destructors[heldValue];
        if (!callback) {
            throw new Error("cannot find destructor for " + heldValue);
        }
        if (--callback.ref == 0) {
            delete destructors[heldValue];
            callback(heldValue);
        }
    });
}
function OnFinalize(obj, heldValue, callback) {
    if (!registry) {
        init();
    }
    let originCallback = destructors[heldValue];
    if (originCallback) {
        // WeakRef内容释放时机可能比finalizationRegistry的触发更早，前面如果发现weakRef为空会重新创建对象
        // 但之前对象的finalizationRegistry最终又肯定会触发。
        // 所以如果遇到这个情况，需要给destructor加计数
        ++originCallback.ref;
    }
    else {
        callback.ref = 1;
        destructors[heldValue] = callback;
    }
    registry.register(obj, heldValue);
}
exports.OnFinalize = OnFinalize;
class PuertsJSEngine {
    csharpObjectMap;
    functionCallbackInfoPtrManager;
    unityApi;
    /** 字符串缓存，默认为256字节 */
    strBuffer;
    stringBufferSize = 256;
    lastReturnCSResult = null;
    lastException = null;
    // 这两个是Puerts用的的真正的CSharp函数指针
    GetJSArgumentsCallback;
    generalDestructor;
    constructor(ctorParam) {
        this.csharpObjectMap = new CSharpObjectMap();
        this.functionCallbackInfoPtrManager = new FunctionCallbackInfoPtrManager(this);
        const { UTF8ToString, _malloc, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, stackSave, stackRestore, stackAlloc, addFunction, removeFunction, _CallCSharpFunctionCallback, _CallCSharpConstructorCallback, _CallCSharpDestructorCallback, InjectPapiGLNativeImpl, HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64, } = ctorParam;
        this.strBuffer = _malloc(this.stringBufferSize);
        this.unityApi = {
            UTF8ToString,
            _malloc,
            _free,
            _setTempRet0,
            stringToUTF8,
            lengthBytesUTF8,
            stackSave,
            stackRestore,
            stackAlloc,
            addFunction,
            removeFunction,
            _CallCSharpFunctionCallback,
            _CallCSharpConstructorCallback,
            _CallCSharpDestructorCallback,
            InjectPapiGLNativeImpl,
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
    JSStringToCSString(returnStr, /** out int */ lengthOffset) {
        if (returnStr === null || returnStr === undefined) {
            return 0;
        }
        var byteCount = this.unityApi.lengthBytesUTF8(returnStr);
        setOutValue32(this, lengthOffset, byteCount);
        let buffer = this.unityApi._malloc(byteCount + 1);
        this.unityApi.stringToUTF8(returnStr, buffer, byteCount + 1);
        return buffer;
    }
    JSStringToTempCSString(returnStr, /** out int */ lengthOffset) {
        if (returnStr === null || returnStr === undefined) {
            return 0;
        }
        var byteCount = this.unityApi.lengthBytesUTF8(returnStr);
        setOutValue32(this, lengthOffset, byteCount);
        if (this.stringBufferSize < byteCount + 1) {
            this.unityApi._free(this.strBuffer);
            this.strBuffer = this.unityApi._malloc(this.stringBufferSize = Math.max(2 * this.stringBufferSize, byteCount + 1));
        }
        this.unityApi.stringToUTF8(returnStr, this.strBuffer, byteCount + 1);
        return this.strBuffer;
    }
    JSStringToCSStringOnStack(returnStr, /** out int */ lengthOffset) {
        if (returnStr === null || returnStr === undefined) {
            return 0;
        }
        var byteCount = this.unityApi.lengthBytesUTF8(returnStr);
        setOutValue32(this, lengthOffset, byteCount);
        var buffer = this.unityApi.stackAlloc(byteCount + 1);
        this.unityApi.stringToUTF8(returnStr, buffer, byteCount + 1);
        return buffer;
    }
    makeCSharpFunctionCallbackFunction(isStatic, functionPtr, callbackIdx) {
        // 不能用箭头函数！此处返回的函数会赋值到具体的class上，其this指针有含义。
        const engine = this;
        return function (...args) {
            if (new.target) {
                throw new Error('"not a constructor');
            }
            let callbackInfoPtr = engine.functionCallbackInfoPtrManager.GetMockPointer(args);
            try {
                engine.callCSharpFunctionCallback(functionPtr, 
                // getIntPtrManager().GetPointerForJSValue(this),
                isStatic ? 0 : engine.csharpObjectMap.getCSIdentifierFromObject(this), callbackInfoPtr, args.length, callbackIdx);
                return engine.functionCallbackInfoPtrManager.GetReturnValueAndRecycle(callbackInfoPtr);
            }
            catch (e) {
                engine.functionCallbackInfoPtrManager.ReleaseByMockIntPtr(callbackInfoPtr);
                throw e;
            }
        };
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
function GetType(engine, value) {
    if (value === null || value === undefined) {
        return 1;
    }
    if (isBigInt(value)) {
        return 2;
    }
    if (typeof value == 'number') {
        return 4;
    }
    if (typeof value == 'string') {
        return 8;
    }
    if (typeof value == 'boolean') {
        return 16;
    }
    if (typeof value == 'function') {
        return 256;
    }
    if (value instanceof Date) {
        return 512;
    }
    // if (value instanceof Array) { return 128 }
    if (value instanceof Array) {
        return 64;
    }
    if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
        return 1024;
    }
    if (engine.csharpObjectMap.getCSIdentifierFromObject(value)) {
        return 32;
    }
    return 64;
}
exports.GetType = GetType;
function makeBigInt(low, high) {
    return (BigInt(high) << 32n) | BigInt(low >>> 0);
}
exports.makeBigInt = makeBigInt;
function setOutValue32(engine, valuePtr, value) {
    engine.unityApi.HEAP32[valuePtr >> 2] = value;
}
exports.setOutValue32 = setOutValue32;
function setOutValue8(engine, valuePtr, value) {
    engine.unityApi.HEAP8[valuePtr] = value;
}
exports.setOutValue8 = setOutValue8;
function isBigInt(value) {
    return value instanceof BigInt || typeof value === 'bigint';
}
exports.isBigInt = isBigInt;
function returnBigInt(engine, value) {
    engine.unityApi._setTempRet0(Number(value >> 32n)); // high
    return Number(value & 0xffffffffn); // low
}
exports.returnBigInt = returnBigInt;
function writeBigInt(engine, ptrIn32, value) {
    engine.unityApi.HEAP32[ptrIn32] = Number(value & 0xffffffffn); // low
    engine.unityApi.HEAP32[ptrIn32 + 1] = Number(value >> 32n); // high
}
const tmpInt3Arr = new Int32Array(2);
const tmpFloat64Arr = new Float64Array(tmpInt3Arr.buffer);
function writeNumber(engine, ptrIn32, value) {
    // number in js is double
    tmpFloat64Arr[0] = value;
    engine.unityApi.HEAP32[ptrIn32] = tmpInt3Arr[0];
    engine.unityApi.HEAP32[ptrIn32 + 1] = tmpInt3Arr[1];
}
function $FillArgumentFinalNumberValue(engine, val, jsValueType, valPtrIn32) {
    if (val === null || val === undefined) {
        return;
    }
    switch (jsValueType) {
        case 2:
            writeBigInt(engine, valPtrIn32, val);
            break;
        case 4:
            writeNumber(engine, valPtrIn32, +val);
            break;
        case 512:
            writeNumber(engine, valPtrIn32, val.getTime());
            break;
    }
}
function $GetArgumentFinalValue(engine, val, jsValueType, lengthOffset) {
    if (!jsValueType)
        jsValueType = GetType(engine, val);
    switch (jsValueType) {
        case 8: return engine.JSStringToCSStringOnStack(val, lengthOffset);
        case 16: return +val;
        case 32: return engine.csharpObjectMap.getCSIdentifierFromObject(val);
        case 64: return jsFunctionOrObjectFactory.getOrCreateJSObject(val).id;
        case 128: return jsFunctionOrObjectFactory.getOrCreateJSObject(val).id;
        case 256: return jsFunctionOrObjectFactory.getOrCreateJSFunction(val).id;
        case 1024: {
            if (val instanceof ArrayBuffer)
                val = new Uint8Array(val);
            let ptr = engine.unityApi._malloc(val.byteLength);
            engine.unityApi.HEAPU8.set(val, ptr);
            setOutValue32(engine, lengthOffset, val.byteLength);
            return ptr;
        }
    }
}
//# sourceMappingURL=library.js.map

/***/ }),

/***/ "./output/mixins/getFromJSArgument.js":
/*!********************************************!*\
  !*** ./output/mixins/getFromJSArgument.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const library_1 = __webpack_require__(/*! ../library */ "./output/library.js");
// export function GetNumberFromValue(engine: PuertsJSEngine, isolate: IntPtr, value: MockIntPtr, isByRef: bool): number {
//     return engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
// }
// export function GetDateFromValue(engine: PuertsJSEngine, isolate: IntPtr, value: MockIntPtr, isByRef: bool): number {
//     return (engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value) as Date).getTime();
// }
// export function GetStringFromValue(engine: PuertsJSEngine, isolate: IntPtr, value: MockIntPtr, /*out int */lengthOffset: number, isByRef: bool): number {
//     var returnStr = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr<string>(value);
//     return engine.JSStringToCSString(returnStr, lengthOffset);
// }
// export function GetBooleanFromValue(engine: PuertsJSEngine, isolate: IntPtr, value: MockIntPtr, isByRef: bool): boolean {
//     return engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
// }
// export function ValueIsBigInt(engine: PuertsJSEngine, isolate: IntPtr, value: MockIntPtr, isByRef: bool): boolean {
//     var bigint = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
//     return bigint instanceof BigInt;
// }
// export function GetBigIntFromValue(engine: PuertsJSEngine, isolate: IntPtr, value: MockIntPtr, isByRef: bool) {
//     var bigint = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
//     return bigint;
// }
// export function GetObjectFromValue(engine: PuertsJSEngine, isolate: IntPtr, value: MockIntPtr, isByRef: bool) {
//     var nativeObject = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
//     return engine.csharpObjectMap.getCSIdentifierFromObject(nativeObject);
// }
// export function GetFunctionFromValue(engine: PuertsJSEngine, isolate: IntPtr, value: MockIntPtr, isByRef: bool): JSFunctionPtr {
//     var func = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr<(...args: any[]) => any>(value);
//     var jsfunc = jsFunctionOrObjectFactory.getOrCreateJSFunction(func);
//     return jsfunc.id;
// }
// export function GetJSObjectFromValue(engine: PuertsJSEngine, isolate: IntPtr, value: MockIntPtr, isByRef: bool) {
//     var obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr<(...args: any[]) => any>(value);
//     var jsobj = jsFunctionOrObjectFactory.getOrCreateJSObject(obj);
//     return jsobj.id;
// }
// export function GetArrayBufferFromValue(engine: PuertsJSEngine, isolate: IntPtr, value: MockIntPtr, /*out int */lengthOffset: any, isOut: bool) {
//     var ab = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr<ArrayBuffer>(value);
//     if (ab instanceof Uint8Array) {
//         ab = ab.buffer;
//     }
//     var ptr = engine.unityApi._malloc(ab.byteLength);
//     engine.unityApi.HEAP8.set(new Int8Array(ab), ptr);
//     engine.unityApi.HEAP32[lengthOffset >> 2] = ab.byteLength;
//     setOutValue32(engine, lengthOffset, ab.byteLength);
//     return ptr;
// }
/**
 * mixin
 * JS调用C#时，C#侧获取JS调用参数的值
 *
 * @param engine
 * @returns
 */
function WebGLBackendGetFromJSArgumentAPI(engine) {
    return {
        /***********这部分现在都是C++实现的************/
        // GetNumberFromValue: GetNumberFromValue.bind(null, engine),
        // GetDateFromValue: GetDateFromValue.bind(null, engine),
        // GetStringFromValue: GetStringFromValue.bind(null, engine),
        // GetBooleanFromValue: GetBooleanFromValue.bind(null, engine),
        // ValueIsBigInt: ValueIsBigInt.bind(null, engine),
        // GetBigIntFromValue: GetBigIntFromValue.bind(null, engine),
        // GetObjectFromValue: GetObjectFromValue.bind(null, engine),
        // GetFunctionFromValue: GetFunctionFromValue.bind(null, engine),
        // GetJSObjectFromValue: GetJSObjectFromValue.bind(null, engine),
        // GetArrayBufferFromValue: GetArrayBufferFromValue.bind(null, engine),
        // GetArgumentType: function (isolate: IntPtr, info: MockIntPtr, index: int, isByRef: bool) {
        //     var value = FunctionCallbackInfoPtrManager.GetByMockPointer(info, engine).args[index];
        //     return GetType(engine, value);
        // },
        // /**
        //  * 为c#侧提供一个获取callbackinfo里jsvalue的intptr的接口
        //  * 并不是得的到这个argument的值
        //  *
        //  * 该接口只有位运算，由C++实现
        //  */
        // GetArgumentValue/*inCallbackInfo*/: function (infoptr: MockIntPtr, index: int) {
        //     return infoptr | index;
        // },
        // GetJsValueType: function (isolate: IntPtr, val: MockIntPtr, isByRef: bool) {
        //     // public enum JsValueType
        //     // {
        //     //     NullOrUndefined = 1,
        //     //     BigInt = 2,
        //     //     Number = 4,
        //     //     String = 8,
        //     //     Boolean = 16,
        //     //     NativeObject = 32,
        //     //     JsObject = 64,
        //     //     Array = 128,
        //     //     Function = 256,
        //     //     Date = 512,
        //     //     ArrayBuffer = 1024,
        //     //     Unknow = 2048,
        //     //     Any = NullOrUndefined | BigInt | Number | String | Boolean | NativeObject | Array | Function | Date | ArrayBuffer,
        //     // };
        //     var value: any = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(val, engine);
        //     return GetType(engine, value);
        // },
        /***********以上现在都是C++实现的************/
        GetTypeIdFromValue: function (isolate, value, isByRef) {
            var obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            if (isByRef) {
                // @ts-ignore
                obj = obj[0];
            }
            var typeid = 0;
            if (obj instanceof library_1.JSFunction) {
                typeid = obj._func["$cid"];
            }
            else {
                typeid = obj["$cid"];
            }
            if (!typeid) {
                throw new Error('cannot find typeid for' + value);
            }
            return typeid;
        },
    };
}
exports["default"] = WebGLBackendGetFromJSArgumentAPI;
//# sourceMappingURL=getFromJSArgument.js.map

/***/ }),

/***/ "./output/mixins/getFromJSReturn.js":
/*!******************************************!*\
  !*** ./output/mixins/getFromJSReturn.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const library_1 = __webpack_require__(/*! ../library */ "./output/library.js");
/**
 * mixin
 * C#调用JS时，获取JS函数返回值
 *
 * 原有的resultInfo设计出来只是为了让多isolate时能在不同的isolate里保持不同的result
 * 在WebGL模式下没有这个烦恼，因此直接用engine的即可
 * resultInfo固定为1024
 *
 * @param engine
 * @returns
 */
function WebGLBackendGetFromJSReturnAPI(engine) {
    return {
        GetNumberFromResult: function (resultInfo) {
            return engine.lastReturnCSResult;
        },
        GetDateFromResult: function (resultInfo) {
            return engine.lastReturnCSResult.getTime();
        },
        GetStringFromResult: function (resultInfo, /*out int */ length) {
            return engine.JSStringToTempCSString(engine.lastReturnCSResult, length);
        },
        GetBooleanFromResult: function (resultInfo) {
            return engine.lastReturnCSResult;
        },
        ResultIsBigInt: function (resultInfo) {
            return (0, library_1.isBigInt)(engine.lastReturnCSResult);
        },
        GetBigIntFromResult: function (resultInfo) {
            // puerts core v2.0.4开始支持
            return (0, library_1.returnBigInt)(engine, engine.lastReturnCSResult);
        },
        GetObjectFromResult: function (resultInfo) {
            return engine.csharpObjectMap.getCSIdentifierFromObject(engine.lastReturnCSResult);
        },
        GetTypeIdFromResult: function (resultInfo) {
            var value = engine.lastReturnCSResult;
            var typeid = 0;
            if (value instanceof library_1.JSFunction) {
                typeid = value._func["$cid"];
            }
            else {
                typeid = value["$cid"];
            }
            if (!typeid) {
                throw new Error('cannot find typeid for' + value);
            }
            return typeid;
        },
        GetFunctionFromResult: function (resultInfo) {
            var jsfunc = library_1.jsFunctionOrObjectFactory.getOrCreateJSFunction(engine.lastReturnCSResult);
            return jsfunc.id;
        },
        GetJSObjectFromResult: function (resultInfo) {
            var jsobj = library_1.jsFunctionOrObjectFactory.getOrCreateJSObject(engine.lastReturnCSResult);
            return jsobj.id;
        },
        GetArrayBufferFromResult: function (resultInfo, /*out int */ length) {
            var ab = engine.lastReturnCSResult;
            var ptr = engine.unityApi._malloc(ab.byteLength);
            engine.unityApi.HEAP8.set(new Int8Array(ab), ptr);
            (0, library_1.setOutValue32)(engine, length, ab.byteLength);
            return ptr;
        },
        //保守方案
        GetResultType: function (resultInfo) {
            var value = engine.lastReturnCSResult;
            return (0, library_1.GetType)(engine, value);
        },
    };
}
exports["default"] = WebGLBackendGetFromJSReturnAPI;
//# sourceMappingURL=getFromJSReturn.js.map

/***/ }),

/***/ "./output/mixins/register.js":
/*!***********************************!*\
  !*** ./output/mixins/register.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const library_1 = __webpack_require__(/*! ../library */ "./output/library.js");
/**
 * mixin
 * 注册类API，如注册全局函数、注册类，以及类的属性方法等
 *
 * @param engine
 * @returns
 */
function WebGLBackendRegisterAPI(engine) {
    const returnee = {
        SetGlobalFunction: function (isolate, nameString, v8FunctionCallback, jsEnvIdx, callbackidx) {
            const name = engine.unityApi.UTF8ToString(nameString);
            library_1.global[name] = engine.makeCSharpFunctionCallbackFunction(true, v8FunctionCallback, callbackidx);
        },
        _RegisterClass: function (isolate, BaseTypeId, fullNameString, constructor, destructor, jsEnvIdx, callbackidx, size) {
            const fullName = engine.unityApi.UTF8ToString(fullNameString);
            const csharpObjectMap = engine.csharpObjectMap;
            const id = csharpObjectMap.classes.length;
            let tempExternalCSID = 0;
            const ctor = function NativeObject() {
                // 设置类型ID
                this["$cid"] = id;
                // nativeObject的构造函数
                // 构造函数有两个调用的地方：1. js侧new一个它的时候 2. cs侧创建了一个对象要传到js侧时
                // 第一个情况，cs对象ID或者是callV8ConstructorCallback返回的。
                // 第二个情况，则cs对象ID是cs new完之后一并传给js的。
                let csID = tempExternalCSID; // 如果是第二个情况，此ID由createFromCS设置
                tempExternalCSID = 0;
                if (csID === 0) {
                    const args = Array.prototype.slice.call(arguments, 0);
                    const callbackInfoPtr = engine.functionCallbackInfoPtrManager.GetMockPointer(args);
                    // 虽然puerts内Constructor的返回值叫self，但它其实就是CS对象的一个id而已。
                    try {
                        csID = engine.callCSharpConstructorCallback(constructor, callbackInfoPtr, args.length, callbackidx);
                    }
                    catch (e) {
                        engine.functionCallbackInfoPtrManager.ReleaseByMockIntPtr(callbackInfoPtr);
                        throw e;
                    }
                    engine.functionCallbackInfoPtrManager.ReleaseByMockIntPtr(callbackInfoPtr);
                }
                // blittable
                if (size) {
                    let csNewID = engine.unityApi._malloc(size);
                    engine.memcpy(csNewID, csID, size);
                    csharpObjectMap.add(csNewID, this);
                    (0, library_1.OnFinalize)(this, csNewID, (csIdentifier) => {
                        csharpObjectMap.remove(csIdentifier);
                        engine.unityApi._free(csIdentifier);
                    });
                }
                else {
                    csharpObjectMap.add(csID, this);
                    (0, library_1.OnFinalize)(this, csID, (csIdentifier) => {
                        csharpObjectMap.remove(csIdentifier);
                        engine.callCSharpDestructorCallback(destructor || engine.generalDestructor, csIdentifier, callbackidx);
                    });
                }
            };
            ctor.createFromCS = function (csID) {
                tempExternalCSID = csID;
                return new ctor();
            };
            ctor.__puertsMetadata = new Map();
            Object.defineProperty(ctor, "name", { value: fullName + "Constructor" });
            Object.defineProperty(ctor, "$cid", { value: id });
            csharpObjectMap.classes.push(ctor);
            csharpObjectMap.classIDWeakMap.set(ctor, id);
            if (BaseTypeId > 0) {
                ctor.prototype.__proto__ = csharpObjectMap.classes[BaseTypeId].prototype;
            }
            csharpObjectMap.namesToClassesID[fullName] = id;
            return id;
        },
        RegisterStruct: function (isolate, BaseTypeId, fullNameString, constructor, destructor, /*long */ jsEnvIdx, callbackidx, size) {
            return returnee._RegisterClass(isolate, BaseTypeId, fullNameString, constructor, destructor, callbackidx, callbackidx, size);
        },
        RegisterFunction: function (isolate, classID, nameString, isStatic, callback, /*long */ jsEnvIdx, callbackidx) {
            var cls = engine.csharpObjectMap.classes[classID];
            if (!cls) {
                return false;
            }
            var fn = engine.makeCSharpFunctionCallbackFunction(isStatic, callback, callbackidx);
            const name = engine.unityApi.UTF8ToString(nameString);
            if (isStatic) {
                cls[name] = fn;
            }
            else {
                cls.prototype[name] = fn;
            }
        },
        RegisterProperty: function (isolate, classID, nameString, isStatic, getter, 
        /*long */ getterjsEnvIdx, 
        /*long */ gettercallbackidx, setter, 
        /*long */ setterjsEnvIdx, 
        /*long */ settercallbackidx, dontDelete) {
            var cls = engine.csharpObjectMap.classes[classID];
            if (!cls) {
                return false;
            }
            const name = engine.unityApi.UTF8ToString(nameString);
            var attr = {
                configurable: !dontDelete,
                enumerable: false
            };
            if (getter) {
                attr.get = engine.makeCSharpFunctionCallbackFunction(isStatic, getter, gettercallbackidx);
            }
            if (setter) {
                attr.set = engine.makeCSharpFunctionCallbackFunction(isStatic, setter, settercallbackidx);
            }
            if (isStatic) {
                Object.defineProperty(cls, name, attr);
            }
            else {
                Object.defineProperty(cls.prototype, name, attr);
            }
        },
    };
    return returnee;
}
exports["default"] = WebGLBackendRegisterAPI;
//# sourceMappingURL=register.js.map

/***/ }),

/***/ "./output/mixins/setToInvokeJSArgument.js":
/*!************************************************!*\
  !*** ./output/mixins/setToInvokeJSArgument.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const library_1 = __webpack_require__(/*! ../library */ "./output/library.js");
/**
 * mixin
 * C#调用JS时，设置调用参数的值
 *
 * @param engine
 * @returns
 */
function WebGLBackendSetToInvokeJSArgumentApi(engine) {
    return {
        //begin cs call js
        PushNullForJSFunction: function (_function) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(null);
        },
        PushDateForJSFunction: function (_function, dateValue) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(new Date(dateValue));
        },
        PushBooleanForJSFunction: function (_function, b) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(!!b);
        },
        PushBigIntForJSFunction: function (_function, /*long */ longlow, longhigh) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push((0, library_1.makeBigInt)(longlow, longhigh));
        },
        PushStringForJSFunction: function (_function, strString) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(engine.unityApi.UTF8ToString(strString));
        },
        PushNumberForJSFunction: function (_function, d) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(d);
        },
        PushObjectForJSFunction: function (_function, classID, objectID) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(engine.csharpObjectMap.findOrAddObject(objectID, classID));
        },
        PushJSFunctionForJSFunction: function (_function, JSFunction) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(library_1.jsFunctionOrObjectFactory.getJSFunctionById(JSFunction)._func);
        },
        PushJSObjectForJSFunction: function (_function, JSObject) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(library_1.jsFunctionOrObjectFactory.getJSObjectById(JSObject).getObject());
        },
        PushArrayBufferForJSFunction: function (_function, /*byte[] */ index, length) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(engine.unityApi.HEAP8.buffer.slice(index, index + length));
        }
    };
}
exports["default"] = WebGLBackendSetToInvokeJSArgumentApi;
//# sourceMappingURL=setToInvokeJSArgument.js.map

/***/ }),

/***/ "./output/mixins/setToJSInvokeReturn.js":
/*!**********************************************!*\
  !*** ./output/mixins/setToJSInvokeReturn.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const library_1 = __webpack_require__(/*! ../library */ "./output/library.js");
/**
 * mixin
 * JS调用C#时，C#设置返回到JS的值
 *
 * @param engine
 * @returns
 */
function WebGLBackendSetToJSInvokeReturnApi(engine) {
    return {
        ReturnClass: function (isolate, info, classID) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.csharpObjectMap.classes[classID];
        },
        ReturnObject: function (isolate, info, classID, self) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.csharpObjectMap.findOrAddObject(self, classID);
        },
        ReturnNumber: function (isolate, info, number) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = number;
        },
        ReturnString: function (isolate, info, strString) {
            const str = engine.unityApi.UTF8ToString(strString);
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = str;
        },
        ReturnBigInt: function (isolate, info, longLow, longHigh) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = (0, library_1.makeBigInt)(longLow, longHigh);
        },
        ReturnBoolean: function (isolate, info, b) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = !!b; // 传过来的是1和0
        },
        ReturnDate: function (isolate, info, date) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = new Date(date);
        },
        ReturnNull: function (isolate, info) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = null;
        },
        ReturnFunction: function (isolate, info, JSFunctionPtr) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            const jsFunc = library_1.jsFunctionOrObjectFactory.getJSFunctionById(JSFunctionPtr);
            callbackInfo.returnValue = jsFunc._func;
        },
        ReturnJSObject: function (isolate, info, JSObjectPtr) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            const jsObject = library_1.jsFunctionOrObjectFactory.getJSObjectById(JSObjectPtr);
            callbackInfo.returnValue = jsObject.getObject();
        },
        ReturnCSharpFunctionCallback: function (isolate, info, v8FunctionCallback, 
        /*long */ pointerLow, 
        /*long */ pointerHigh) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.makeCSharpFunctionCallbackFunction(false, v8FunctionCallback, pointerHigh);
        },
        ReturnCSharpFunctionCallback2: function (isolate, info, v8FunctionCallback, JsFunctionFinalize, 
        /*long */ pointerLow, 
        /*long */ pointerHigh) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.makeCSharpFunctionCallbackFunction(false, v8FunctionCallback, pointerHigh);
        },
        ReturnArrayBuffer: function (isolate, info, /*byte[] */ index, length) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.unityApi.HEAP8.buffer.slice(index, index + length);
        },
    };
}
exports["default"] = WebGLBackendSetToJSInvokeReturnApi;
//# sourceMappingURL=setToJSInvokeReturn.js.map

/***/ }),

/***/ "./output/mixins/setToJSOutArgument.js":
/*!*********************************************!*\
  !*** ./output/mixins/setToJSOutArgument.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const library_1 = __webpack_require__(/*! ../library */ "./output/library.js");
/**
 * mixin
 * JS调用C#时，C#侧设置out参数值
 *
 * @param engine
 * @returns
 */
function WebGLBackendSetToJSOutArgumentAPI(engine) {
    return {
        SetNumberToOutValue: function (isolate, value, number) {
            var obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = number;
        },
        SetDateToOutValue: function (isolate, value, date) {
            var obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = new Date(date);
        },
        SetStringToOutValue: function (isolate, value, strString) {
            const str = engine.unityApi.UTF8ToString(strString);
            var obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = str;
        },
        SetBooleanToOutValue: function (isolate, value, b) {
            var obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = !!b; // 传过来的是1和0
        },
        SetBigIntToOutValue: function (isolate, value, low, high) {
            const obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = (0, library_1.makeBigInt)(low, high);
        },
        SetObjectToOutValue: function (isolate, value, classID, self) {
            var obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = engine.csharpObjectMap.findOrAddObject(self, classID);
        },
        SetNullToOutValue: function (isolate, value) {
            var obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = null; // 传过来的是1和0
        },
        SetArrayBufferToOutValue: function (isolate, value, /*Byte[] */ index, length) {
            var obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = engine.unityApi.HEAP8.buffer.slice(index, index + length);
        },
    };
}
exports["default"] = WebGLBackendSetToJSOutArgumentAPI;
//# sourceMappingURL=setToJSOutArgument.js.map

/***/ }),

/***/ "./output/pesapiImpl.js":
/*!******************************!*\
  !*** ./output/pesapiImpl.js ***!
  \******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebGLRegsterApi = exports.GetWebGLFFIApi = void 0;
const Buffer = __webpack_require__(/*! ./buffer */ "./output/buffer.js");
var JSTag;
(function (JSTag) {
    /* all tags with a reference count are negative */
    JSTag[JSTag["JS_TAG_FIRST"] = -9] = "JS_TAG_FIRST";
    JSTag[JSTag["JS_TAG_STRING"] = -9] = "JS_TAG_STRING";
    JSTag[JSTag["JS_TAG_BUFFER"] = -8] = "JS_TAG_BUFFER";
    JSTag[JSTag["JS_TAG_EXCEPTION"] = -7] = "JS_TAG_EXCEPTION";
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
let class_not_found_callback = undefined;
class Scope {
    static current = undefined;
    static getCurrent() {
        return Scope.current;
    }
    static enter() {
        return new Scope();
    }
    static exit() {
        Scope.current.close();
    }
    constructor() {
        this.prevScope = Scope.current;
        Scope.current = this;
    }
    close() {
        Scope.current = this.prevScope;
    }
    addToScope(obj) {
        this.objectsInScope.push(obj);
        return this.objectsInScope.length - 1;
    }
    getFromScope(index) {
        return this.objectsInScope[index];
    }
    toJs(engine, pvalue) {
        const valType = Buffer.readInt32(engine.unityApi.HEAPU8, pvalue + 8);
        if (valType <= JSTag.JS_TAG_OBJECT && valType >= JSTag.JS_TAG_ARRAY) {
            const objIdx = Buffer.readInt32(engine.unityApi.HEAPU8, pvalue);
            return this.objectsInScope[objIdx];
        }
        switch (valType) {
            case JSTag.JS_TAG_BOOL:
                return Buffer.readInt32(engine.unityApi.HEAPU8, pvalue) != 0;
            case JSTag.JS_TAG_INT:
                return Buffer.readInt32(engine.unityApi.HEAPU8, pvalue);
            case JSTag.JS_TAG_NULL:
                return null;
            case JSTag.JS_TAG_FLOAT64:
                return Buffer.readDouble(engine.unityApi.HEAPU8, pvalue);
            case JSTag.JS_TAG_INT64:
                return Buffer.readInt64(engine.unityApi.HEAPU8, pvalue);
            case JSTag.JS_TAG_UINT64:
                return Buffer.readUInt64(engine.unityApi.HEAPU8, pvalue);
            case JSTag.JS_TAG_STRING:
                return engine.unityApi.UTF8ToString(pvalue);
            case JSTag.JS_TAG_BUFFER:
                const buffStart = Buffer.readInt32(engine.unityApi.HEAPU8, pvalue);
                const buffLen = Buffer.readInt32(engine.unityApi.HEAPU8, pvalue + 12);
                return engine.unityApi.HEAP8.buffer.slice(buffStart, buffStart + buffLen);
        }
    }
    prevScope = undefined;
    objectsInScope = [];
}
function makeNativeFunctionWrap(engine, isStatic, native_impl, data, finalize) {
    return function (...args) {
        if (new.target) {
            throw new Error('"not a constructor');
        }
        throw new Error("NativeFunctionWrap not implemented yet!");
    };
}
let webglFFI = undefined;
// 需要在Unity里调用PlayerSettings.WebGL.emscriptenArgs = " -s ALLOW_TABLE_GROWTH=1";
function GetWebGLFFIApi(engine) {
    if (webglFFI)
        return webglFFI;
    // --------------- 值创建系列 ---------------
    function pesapi_create_null(env) {
        throw new Error("pesapi_create_null not implemented yet!");
    }
    function pesapi_create_undefined(env) {
        throw new Error("pesapi_create_undefined not implemented yet!");
    }
    function pesapi_create_boolean(env, value) {
        throw new Error("pesapi_create_boolean not implemented yet!");
    }
    function pesapi_create_int32(env, value) {
        throw new Error("pesapi_create_int32 not implemented yet!");
    }
    // 类似地处理其他基础类型创建函数
    function pesapi_create_uint32(env, value) {
        throw new Error("pesapi_create_uint32 not implemented yet!");
    }
    function pesapi_create_int64(env, value) {
        throw new Error("pesapi_create_int64 not implemented yet!");
    }
    function pesapi_create_uint64(env, value) {
        throw new Error("pesapi_create_uint64 not implemented yet!");
    }
    function pesapi_create_double(env, value) {
        throw new Error("pesapi_create_double not implemented yet!");
    }
    function pesapi_create_string_utf8(env, str, length) {
        throw new Error("pesapi_create_string_utf8 not implemented yet!");
    }
    function pesapi_create_binary(env, bin, length) {
        throw new Error("pesapi_create_binary not implemented yet!");
    }
    function pesapi_create_array(env) {
        throw new Error("pesapi_create_array not implemented yet!");
    }
    function pesapi_create_object(env) {
        throw new Error("pesapi_create_object not implemented yet!");
    }
    function pesapi_create_function(env, native_impl, data, finalize) {
        return Scope.getCurrent().addToScope(makeNativeFunctionWrap(engine, false, native_impl, data, finalize));
    }
    function pesapi_create_class(env, type_id) {
        throw new Error("pesapi_create_class not implemented yet!");
    }
    // --------------- 值获取系列 ---------------
    function pesapi_get_value_bool(env, pvalue) {
        throw new Error("pesapi_get_value_bool not implemented yet!");
    }
    function pesapi_get_value_int32(env, pvalue) {
        throw new Error("pesapi_get_value_int32 not implemented yet!");
    }
    // 类似处理其他类型获取
    function pesapi_get_value_uint32(env, pvalue) {
        throw new Error("pesapi_get_value_uint32 not implemented yet!");
    }
    function pesapi_get_value_int64(env, pvalue) {
        throw new Error("pesapi_get_value_int64 not implemented yet!");
    }
    function pesapi_get_value_uint64(env, pvalue) {
        throw new Error("pesapi_get_value_uint64 not implemented yet!");
    }
    function pesapi_get_value_double(env, pvalue) {
        throw new Error("pesapi_get_value_double not implemented yet!");
    }
    function pesapi_get_value_string_utf8(env, pvalue, buf, bufsize) {
        throw new Error("pesapi_get_value_string_utf8 not implemented yet!");
    }
    function pesapi_get_value_binary(env, pvalue, bufsize) {
        throw new Error("pesapi_get_value_binary not implemented yet!");
    }
    function pesapi_get_array_length(env, pvalue) {
        throw new Error("pesapi_get_array_length not implemented yet!");
    }
    // --------------- 类型检查系列 ---------------
    function pesapi_is_null(env, pvalue) {
        throw new Error("pesapi_is_null not implemented yet!");
    }
    function pesapi_is_undefined(env, pvalue) {
        throw new Error("pesapi_is_undefined not implemented yet!");
    }
    function pesapi_is_boolean(env, pvalue) {
        throw new Error("pesapi_is_boolean not implemented yet!");
    }
    function pesapi_is_int32(env, pvalue) {
        throw new Error("pesapi_is_int32 not implemented yet!");
    }
    function pesapi_is_uint32(env, pvalue) {
        throw new Error("pesapi_is_uint32 not implemented yet!");
    }
    function pesapi_is_int64(env, pvalue) {
        throw new Error("pesapi_is_int64 not implemented yet!");
    }
    function pesapi_is_uint64(env, pvalue) {
        throw new Error("pesapi_is_uint64 not implemented yet!");
    }
    function pesapi_is_double(env, pvalue) {
        throw new Error("pesapi_is_double not implemented yet!");
    }
    function pesapi_is_string(env, pvalue) {
        throw new Error("pesapi_is_string not implemented yet!");
    }
    function pesapi_is_object(env, pvalue) {
        throw new Error("pesapi_is_object not implemented yet!");
    }
    function pesapi_is_function(env, pvalue) {
        throw new Error("pesapi_is_function not implemented yet!");
    }
    function pesapi_is_binary(env, pvalue) {
        throw new Error("pesapi_is_binary not implemented yet!");
    }
    function pesapi_is_array(env, pvalue) {
        throw new Error("pesapi_is_array not implemented yet!");
    }
    // --------------- 对象操作系列 ---------------
    function pesapi_native_object_to_value(env, type_id, object_ptr, call_finalize) {
        throw new Error("pesapi_native_object_to_value not implemented yet!");
    }
    function pesapi_get_native_object_ptr(env, pvalue) {
        throw new Error("pesapi_get_native_object_ptr not implemented yet!");
    }
    function pesapi_get_native_object_typeid(env, pvalue) {
        throw new Error("pesapi_get_native_object_typeid not implemented yet!");
    }
    function pesapi_is_instance_of(env, type_id, pvalue) {
        throw new Error("pesapi_is_instance_of not implemented yet!");
    }
    // --------------- 装箱/拆箱 ---------------
    function pesapi_boxing(env, pvalue) {
        throw new Error("pesapi_boxing not implemented yet!");
    }
    function pesapi_unboxing(env, p_boxed_value) {
        throw new Error("pesapi_unboxing not implemented yet!");
    }
    function pesapi_update_boxed_value(env, p_boxed_value, pvalue) {
        throw new Error("pesapi_update_boxed_value not implemented yet!");
    }
    function pesapi_is_boxed_value(env, value) {
        throw new Error("pesapi_is_boxed_value not implemented yet!");
    }
    // --------------- 函数调用相关 ---------------
    function pesapi_get_args_len(pinfo) {
        throw new Error("pesapi_get_args_len not implemented yet!");
    }
    function pesapi_get_arg(pinfo, index) {
        throw new Error("pesapi_get_arg not implemented yet!");
    }
    function pesapi_get_env(pinfo) {
        throw new Error("pesapi_get_env not implemented yet!");
    }
    function pesapi_get_native_holder_ptr(pinfo) {
        throw new Error("pesapi_get_native_holder_ptr not implemented yet!");
    }
    function pesapi_get_holder(pinfo) {
        throw new Error("pesapi_get_holder not implemented yet!");
    }
    function pesapi_get_userdata(pinfo) {
        throw new Error("pesapi_get_userdata not implemented yet!");
    }
    function pesapi_add_return(pinfo, value) {
        throw new Error("pesapi_add_return not implemented yet!");
    }
    function pesapi_throw_by_string(pinfo, msg) {
        throw new Error("pesapi_throw_by_string not implemented yet!");
    }
    // --------------- 环境引用 ---------------
    function pesapi_create_env_ref(env) {
        throw new Error("pesapi_create_env_ref not implemented yet!");
    }
    function pesapi_env_ref_is_valid(penv_ref) {
        throw new Error("pesapi_env_ref_is_valid not implemented yet!");
    }
    function pesapi_get_env_from_ref(penv_ref) {
        throw new Error("pesapi_get_env_from_ref not implemented yet!");
    }
    function pesapi_duplicate_env_ref(penv_ref) {
        throw new Error("pesapi_duplicate_env_ref not implemented yet!");
    }
    function pesapi_release_env_ref(penv_ref) {
        throw new Error("pesapi_release_env_ref not implemented yet!");
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
        throw new Error("pesapi_has_caught not implemented yet!");
    }
    function pesapi_get_exception_as_string(pscope, with_stack) {
        throw new Error("pesapi_get_exception_as_string not implemented yet!");
    }
    function pesapi_close_scope(pscope) {
        Scope.exit();
    }
    function pesapi_close_scope_placement(pscope) {
        Scope.exit();
    }
    // --------------- 值引用 ---------------
    function pesapi_create_value_ref(env, pvalue, internal_field_count) {
        throw new Error("pesapi_create_value_ref not implemented yet!");
    }
    function pesapi_duplicate_value_ref(pvalue_ref) {
        throw new Error("pesapi_duplicate_value_ref not implemented yet!");
    }
    function pesapi_release_value_ref(pvalue_ref) {
        throw new Error("pesapi_release_value_ref not implemented yet!");
    }
    function pesapi_get_value_from_ref(env, pvalue_ref) {
        throw new Error("pesapi_get_value_from_ref not implemented yet!");
    }
    function pesapi_set_ref_weak(env, pvalue_ref) {
        throw new Error("pesapi_set_ref_weak not implemented yet!");
    }
    function pesapi_set_owner(env, pvalue, powner) {
        throw new Error("pesapi_set_owner not implemented yet!");
    }
    function pesapi_get_ref_associated_env(value_ref) {
        throw new Error("pesapi_get_ref_associated_env not implemented yet!");
    }
    function pesapi_get_ref_internal_fields(pvalue_ref, pinternal_field_count) {
        throw new Error("pesapi_get_ref_internal_fields not implemented yet!");
    }
    // --------------- 属性操作 ---------------
    function pesapi_get_property(env, pobject, key) {
        throw new Error("pesapi_get_property not implemented yet!");
    }
    function pesapi_set_property(env, pobject, pkey, pvalue) {
        const obj = Scope.getCurrent().toJs(engine, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_set_property: target is not an object");
        }
        const key = engine.unityApi.UTF8ToString(pkey);
        const value = Scope.getCurrent().toJs(engine, pvalue);
        obj[key] = value;
    }
    function pesapi_get_private(env, pobject, out_ptr) {
        throw new Error("pesapi_get_private not implemented yet!");
    }
    function pesapi_set_private(env, pobject, ptr) {
        throw new Error("pesapi_set_private not implemented yet!");
    }
    function pesapi_get_property_uint32(env, pobject, key) {
        throw new Error("pesapi_get_property_uint32 not implemented yet!");
    }
    function pesapi_set_property_uint32(env, pobject, key, pvalue) {
        const obj = Scope.getCurrent().toJs(engine, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_set_property: target is not an object");
        }
        const value = Scope.getCurrent().toJs(engine, pvalue);
        obj[key] = value;
    }
    // --------------- 函数调用/执行 ---------------
    function pesapi_call_function(env, pfunc, this_object, argc, argv) {
        throw new Error("pesapi_call_function not implemented yet!");
    }
    function pesapi_eval(env, code, code_size, path) {
        throw new Error("pesapi_eval not implemented yet!");
    }
    // --------------- 全局对象 ---------------
    function pesapi_global(env) {
        return Scope.getCurrent().addToScope(globalThis);
    }
    // --------------- 环境私有数据 ---------------
    function pesapi_get_env_private(env) {
        throw new Error("pesapi_get_env_private not implemented yet!");
    }
    function pesapi_set_env_private(env, ptr) {
        throw new Error("pesapi_set_env_private not implemented yet!");
    }
    const apiInfo = [
        { func: pesapi_create_null, sig: "ii" },
        { func: pesapi_create_undefined, sig: "ii" },
        { func: pesapi_create_boolean, sig: "iii" },
        { func: pesapi_create_int32, sig: "iii" },
        { func: pesapi_create_uint32, sig: "iii" },
        { func: pesapi_create_int64, sig: "iji" },
        { func: pesapi_create_uint64, sig: "iji" },
        { func: pesapi_create_double, sig: "iid" },
        { func: pesapi_create_string_utf8, sig: "iiii" },
        { func: pesapi_create_binary, sig: "iiii" },
        { func: pesapi_create_array, sig: "ii" },
        { func: pesapi_create_object, sig: "ii" },
        { func: pesapi_create_function, sig: "iiiii" },
        { func: pesapi_create_class, sig: "iii" },
        { func: pesapi_get_value_bool, sig: "iii" },
        { func: pesapi_get_value_int32, sig: "iii" },
        { func: pesapi_get_value_uint32, sig: "iii" },
        { func: pesapi_get_value_int64, sig: "jii" },
        { func: pesapi_get_value_uint64, sig: "jii" },
        { func: pesapi_get_value_double, sig: "dii" },
        { func: pesapi_get_value_string_utf8, sig: "iiiii" },
        { func: pesapi_get_value_binary, sig: "iiii" },
        { func: pesapi_get_array_length, sig: "iii" },
        { func: pesapi_is_null, sig: "iii" },
        { func: pesapi_is_undefined, sig: "iii" },
        { func: pesapi_is_boolean, sig: "iii" },
        { func: pesapi_is_int32, sig: "iii" },
        { func: pesapi_is_uint32, sig: "iii" },
        { func: pesapi_is_int64, sig: "iii" },
        { func: pesapi_is_uint64, sig: "iii" },
        { func: pesapi_is_double, sig: "iii" },
        { func: pesapi_is_string, sig: "iii" },
        { func: pesapi_is_object, sig: "iii" },
        { func: pesapi_is_function, sig: "iii" },
        { func: pesapi_is_binary, sig: "iii" },
        { func: pesapi_is_array, sig: "iii" },
        { func: pesapi_native_object_to_value, sig: "iiiii" },
        { func: pesapi_get_native_object_ptr, sig: "iii" },
        { func: pesapi_get_native_object_typeid, sig: "iii" },
        { func: pesapi_is_instance_of, sig: "iiii" },
        { func: pesapi_boxing, sig: "iii" },
        { func: pesapi_unboxing, sig: "iii" },
        { func: pesapi_update_boxed_value, sig: "viii" },
        { func: pesapi_is_boxed_value, sig: "iii" },
        { func: pesapi_get_args_len, sig: "ii" },
        { func: pesapi_get_arg, sig: "iii" },
        { func: pesapi_get_env, sig: "ii" },
        { func: pesapi_get_native_holder_ptr, sig: "ii" },
        { func: pesapi_get_holder, sig: "ii" },
        { func: pesapi_get_userdata, sig: "ii" },
        { func: pesapi_add_return, sig: "vii" },
        { func: pesapi_throw_by_string, sig: "vii" },
        { func: pesapi_create_env_ref, sig: "ii" },
        { func: pesapi_env_ref_is_valid, sig: "ii" },
        { func: pesapi_get_env_from_ref, sig: "ii" },
        { func: pesapi_duplicate_env_ref, sig: "ii" },
        { func: pesapi_release_env_ref, sig: "vi" },
        { func: pesapi_open_scope, sig: "ii" },
        { func: pesapi_open_scope_placement, sig: "iii" },
        { func: pesapi_has_caught, sig: "ii" },
        { func: pesapi_get_exception_as_string, sig: "iii" },
        { func: pesapi_close_scope, sig: "vi" },
        { func: pesapi_close_scope_placement, sig: "vi" },
        { func: pesapi_create_value_ref, sig: "iiii" },
        { func: pesapi_duplicate_value_ref, sig: "ii" },
        { func: pesapi_release_value_ref, sig: "vi" },
        { func: pesapi_get_value_from_ref, sig: "iii" },
        { func: pesapi_set_ref_weak, sig: "vii" },
        { func: pesapi_set_owner, sig: "iiii" },
        { func: pesapi_get_ref_associated_env, sig: "ii" },
        { func: pesapi_get_ref_internal_fields, sig: "iii" },
        { func: pesapi_get_property, sig: "iiii" },
        { func: pesapi_set_property, sig: "viiii" },
        { func: pesapi_get_private, sig: "iiii" },
        { func: pesapi_set_private, sig: "iiii" },
        { func: pesapi_get_property_uint32, sig: "iiii" },
        { func: pesapi_set_property_uint32, sig: "viiii" },
        { func: pesapi_call_function, sig: "iiiiii" },
        { func: pesapi_eval, sig: "iiiii" },
        { func: pesapi_global, sig: "ii" },
        { func: pesapi_get_env_private, sig: "ii" },
        { func: pesapi_set_env_private, sig: "vii" }
    ];
    console.log(`create webgl ffi api count: ${apiInfo.length}`);
    const ptr = engine.unityApi._malloc(apiInfo.length * 4);
    const h32index = ptr >> 2;
    for (var i = 0; i < apiInfo.length; ++i) {
        engine.unityApi.HEAP32[h32index + i] = engine.unityApi.addFunction(apiInfo[i].func, apiInfo[i].sig);
    }
    webglFFI = ptr;
    engine.unityApi.InjectPapiGLNativeImpl(webglFFI);
    return ptr;
}
exports.GetWebGLFFIApi = GetWebGLFFIApi;
function WebGLRegsterApi(engine) {
    return {
        GetRegsterApi: function () {
            return 0;
        },
        pesapi_alloc_property_descriptors: function () {
            throw new Error("pesapi_alloc_property_descriptors not implemented yet!");
        },
        pesapi_define_class: function () {
            throw new Error("pesapi_define_class not implemented yet!");
        },
        pesapi_get_class_data: function () {
            throw new Error("pesapi_get_class_data not implemented yet!");
        },
        pesapi_on_class_not_found: function (callback) {
            class_not_found_callback = callback;
        },
        pesapi_set_method_info: function () {
            throw new Error("pesapi_set_method_info not implemented yet!");
        },
        pesapi_set_property_info: function () {
            throw new Error("pesapi_set_property_info not implemented yet!");
        },
        pesapi_trace_native_object_lifecycle: function () {
            throw new Error("pesapi_trace_native_object_lifecycle not implemented yet!");
        }
    };
}
exports.WebGLRegsterApi = WebGLRegsterApi;
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
const getFromJSArgument_1 = __webpack_require__(/*! ./mixins/getFromJSArgument */ "./output/mixins/getFromJSArgument.js");
const getFromJSReturn_1 = __webpack_require__(/*! ./mixins/getFromJSReturn */ "./output/mixins/getFromJSReturn.js");
const register_1 = __webpack_require__(/*! ./mixins/register */ "./output/mixins/register.js");
const setToInvokeJSArgument_1 = __webpack_require__(/*! ./mixins/setToInvokeJSArgument */ "./output/mixins/setToInvokeJSArgument.js");
const setToJSInvokeReturn_1 = __webpack_require__(/*! ./mixins/setToJSInvokeReturn */ "./output/mixins/setToJSInvokeReturn.js");
const setToJSOutArgument_1 = __webpack_require__(/*! ./mixins/setToJSOutArgument */ "./output/mixins/setToJSOutArgument.js");
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
        }, (0, getFromJSArgument_1.default)(engine), (0, getFromJSReturn_1.default)(engine), (0, setToInvokeJSArgument_1.default)(engine), (0, setToJSInvokeReturn_1.default)(engine), (0, setToJSOutArgument_1.default)(engine), (0, register_1.default)(engine), (0, pesapiImpl_1.WebGLRegsterApi)(engine), {
            // bridgeLog: true,
            GetLibVersion: function () {
                return 34;
            },
            GetApiLevel: function () {
                return 34;
            },
            GetLibBackend: function () {
                return 0;
            },
            CreateJSEngine: function () {
                if (jsEngineReturned) {
                    console.warn("only one available jsEnv is allowed in WebGL mode");
                    return 1024;
                }
                jsEngineReturned = true;
                return 1024;
            },
            CreateJSEngineWithExternalEnv: function () { },
            DestroyJSEngine: function () { },
            GetLastExceptionInfo: function (isolate, /* out int */ strlen) {
                if (engine.lastException === null)
                    return 'null';
                if (typeof engine.lastException == 'undefined')
                    return 'undefined';
                return engine.JSStringToCSString(engine.lastException.stack, strlen);
            },
            LowMemoryNotification: function (isolate) { },
            IdleNotificationDeadline: function (isolate) { },
            RequestMinorGarbageCollectionForTesting: function (isolate) { },
            RequestFullGarbageCollectionForTesting: function (isolate) { },
            SetGeneralDestructor: function (isolate, _generalDestructor) {
                engine.generalDestructor = _generalDestructor;
            },
            GetModuleExecutor: function () {
                loader = typeof __tgjsGetLoader != 'undefined' ? __tgjsGetLoader() : null;
                const loaderResolve = loader.Resolve ? (function (fileName, to = "") {
                    const resolvedName = loader.Resolve(fileName, to);
                    if (!resolvedName) {
                        throw new Error('module not found: ' + fileName);
                    }
                    return resolvedName;
                }) : null;
                var jsfunc = library_1.jsFunctionOrObjectFactory.getOrCreateJSFunction(function (fileName) {
                    if (['puerts/log.mjs', 'puerts/timer.mjs'].indexOf(fileName) != -1) {
                        return {};
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
                });
                return jsfunc.id;
            },
            GetJSObjectValueGetter: function () {
                var jsfunc = library_1.jsFunctionOrObjectFactory.getOrCreateJSFunction(function (obj, key) {
                    return obj[key];
                });
                return jsfunc.id;
            },
            Eval: function (isolate, codeString, path) {
                if (!library_1.global.eval) {
                    throw new Error("eval is not supported");
                }
                try {
                    const code = engine.unityApi.UTF8ToString(codeString);
                    const result = library_1.global.eval(code);
                    // return getIntPtrManager().GetPointerForJSValue(result);
                    engine.lastReturnCSResult = result;
                    return /*FResultInfo */ 1024;
                }
                catch (e) {
                    engine.lastException = e;
                }
            },
            SetPushJSFunctionArgumentsCallback: function (isolate, callback, jsEnvIdx) {
                engine.GetJSArgumentsCallback = callback;
            },
            ThrowException: function (isolate, /*byte[] */ messageString) {
                throw new Error(engine.unityApi.UTF8ToString(messageString));
            },
            InvokeJSFunction: function (_function, hasResult) {
                const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
                if (func instanceof library_1.JSFunction) {
                    try {
                        engine.lastReturnCSResult = func.invoke();
                        return 1024;
                    }
                    catch (err) {
                        func.lastException = err;
                        return 0;
                    }
                }
                else {
                    throw new Error('ptr is not a jsfunc');
                }
            },
            GetFunctionLastExceptionInfo: function (_function, /*out int */ length) {
                const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
                if (func instanceof library_1.JSFunction) {
                    if (func.lastException === null)
                        return 'null';
                    if (typeof func.lastException == 'undefined')
                        return 'undefined';
                    return engine.JSStringToCSString(func.lastException.stack || func.lastException.message || '', length);
                }
                else {
                    throw new Error('ptr is not a jsfunc');
                }
            },
            ReleaseJSFunction: function (isolate, _function) {
                library_1.jsFunctionOrObjectFactory.removeJSFunctionById(_function);
            },
            ReleaseJSObject: function (isolate, obj) {
                library_1.jsFunctionOrObjectFactory.removeJSObjectById(obj);
            },
            ResetResult: function (resultInfo) {
                engine.lastReturnCSResult = null;
            },
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
            GetWebGLFFIApi: function () {
                return (0, pesapiImpl_1.GetWebGLFFIApi)(engine);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVlcnRzLXJ1bnRpbWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGlCQUFpQixHQUFHLGdCQUFnQjtBQUM3WjtBQUNBO0FBQ0EsMkJBQTJCLE1BQU0sMkJBQTJCLE1BQU07QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixrQkFBa0IsNkJBQTZCLE1BQU07QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsa0JBQWtCLGFBQWEsY0FBYyxTQUFTLFFBQVEsVUFBVSxNQUFNO0FBQ3JHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsS0FBSyxTQUFTLEtBQUssVUFBVSxNQUFNO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25COzs7Ozs7Ozs7O0FDelNhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG9CQUFvQixHQUFHLGdCQUFnQixHQUFHLG9CQUFvQixHQUFHLHFCQUFxQixHQUFHLGtCQUFrQixHQUFHLGVBQWUsR0FBRyxzQkFBc0IsR0FBRyxrQkFBa0IsR0FBRyxxQkFBcUIsR0FBRyxjQUFjLEdBQUcsdUJBQXVCLEdBQUcsaUNBQWlDLEdBQUcsZ0JBQWdCLEdBQUcsa0JBQWtCLEdBQUcsc0NBQXNDLEdBQUcsNEJBQTRCO0FBQ2xZO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QixpQ0FBaUM7QUFDakMsa0JBQWtCO0FBQ2xCLGlDQUFpQztBQUNqQztBQUNBLG1DQUFtQztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnQkFBZ0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnQkFBZ0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQ7QUFDQTtBQUNBLDhGQUE4RjtBQUM5RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrR0FBa0c7QUFDbEc7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0REFBNEQ7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RDtBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQztBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMseUNBQXlDO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0EsY0FBYyxHQUFHLHFCQUFNLEdBQUcscUJBQU07QUFDaEMscUJBQU0sVUFBVSxxQkFBTTtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLFVBQVU7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsaURBQWlEO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLDRTQUE0UztBQUM1VDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTSwyREFBMkQ7QUFDekUsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTtBQUNmO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBLHdEQUF3RDtBQUN4RCx3Q0FBd0M7QUFDeEM7QUFDQSxvQkFBb0I7QUFDcEI7QUFDQSxtRUFBbUU7QUFDbkUsZ0VBQWdFO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O0FDbnFCYTtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxrQkFBa0IsbUJBQU8sQ0FBQyx1Q0FBWTtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUM1SGE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUMzRWE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsaUNBQWlDO0FBQ25GLGtEQUFrRCxXQUFXO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxrQkFBZTtBQUNmOzs7Ozs7Ozs7O0FDNUhhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGtCQUFrQixtQkFBTyxDQUFDLHVDQUFZO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWU7QUFDZjs7Ozs7Ozs7OztBQ3hEYTtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxrQkFBa0IsbUJBQU8sQ0FBQyx1Q0FBWTtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLDRDQUE0QztBQUM1QyxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxrQkFBZTtBQUNmOzs7Ozs7Ozs7O0FDMUVhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGtCQUFrQixtQkFBTyxDQUFDLHVDQUFZO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLDBCQUEwQjtBQUMxQixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsMkJBQTJCO0FBQzNCLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUNoRGE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QsdUJBQXVCLEdBQUcsc0JBQXNCO0FBQ2hELGVBQWUsbUJBQU8sQ0FBQyxvQ0FBVTtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLHNCQUFzQjtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVSxxQ0FBcUM7QUFDL0MsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSx3Q0FBd0M7QUFDbEQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSx3Q0FBd0M7QUFDbEQsVUFBVSx3Q0FBd0M7QUFDbEQsVUFBVSw4Q0FBOEM7QUFDeEQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSxzQ0FBc0M7QUFDaEQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSw0Q0FBNEM7QUFDdEQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSxrREFBa0Q7QUFDNUQsVUFBVSw0Q0FBNEM7QUFDdEQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSxrQ0FBa0M7QUFDNUMsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSxxQ0FBcUM7QUFDL0MsVUFBVSxtQ0FBbUM7QUFDN0MsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxtQ0FBbUM7QUFDN0MsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxzQ0FBc0M7QUFDaEQsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxtQ0FBbUM7QUFDN0MsVUFBVSxtREFBbUQ7QUFDN0QsVUFBVSxnREFBZ0Q7QUFDMUQsVUFBVSxtREFBbUQ7QUFDN0QsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSxpQ0FBaUM7QUFDM0MsVUFBVSxtQ0FBbUM7QUFDN0MsVUFBVSw4Q0FBOEM7QUFDeEQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSxzQ0FBc0M7QUFDaEQsVUFBVSxrQ0FBa0M7QUFDNUMsVUFBVSxpQ0FBaUM7QUFDM0MsVUFBVSwrQ0FBK0M7QUFDekQsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxzQ0FBc0M7QUFDaEQsVUFBVSxxQ0FBcUM7QUFDL0MsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSx3Q0FBd0M7QUFDbEQsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSwrQ0FBK0M7QUFDekQsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxrREFBa0Q7QUFDNUQsVUFBVSxxQ0FBcUM7QUFDL0MsVUFBVSwrQ0FBK0M7QUFDekQsVUFBVSw0Q0FBNEM7QUFDdEQsVUFBVSw2Q0FBNkM7QUFDdkQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSw2Q0FBNkM7QUFDdkQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSxxQ0FBcUM7QUFDL0MsVUFBVSxnREFBZ0Q7QUFDMUQsVUFBVSxrREFBa0Q7QUFDNUQsVUFBVSx3Q0FBd0M7QUFDbEQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSwrQ0FBK0M7QUFDekQsVUFBVSxnREFBZ0Q7QUFDMUQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSxpQ0FBaUM7QUFDM0MsVUFBVSxnQ0FBZ0M7QUFDMUMsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVTtBQUNWO0FBQ0EsK0NBQStDLGVBQWU7QUFDOUQ7QUFDQTtBQUNBLG9CQUFvQixvQkFBb0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUI7QUFDdkI7Ozs7OztVQzFlQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEdBQUc7V0FDSDtXQUNBO1dBQ0EsQ0FBQzs7Ozs7Ozs7Ozs7QUNQWTtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQixtQkFBTyxDQUFDLHNDQUFXO0FBQ3JDLDRCQUE0QixtQkFBTyxDQUFDLHdFQUE0QjtBQUNoRSwwQkFBMEIsbUJBQU8sQ0FBQyxvRUFBMEI7QUFDNUQsbUJBQW1CLG1CQUFPLENBQUMsc0RBQW1CO0FBQzlDLGdDQUFnQyxtQkFBTyxDQUFDLGdGQUFnQztBQUN4RSw4QkFBOEIsbUJBQU8sQ0FBQyw0RUFBOEI7QUFDcEUsNkJBQTZCLG1CQUFPLENBQUMsMEVBQTZCO0FBQ2xFLHFCQUFxQixtQkFBTyxDQUFDLDRDQUFjO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsMERBQTBEO0FBQzFELDRDQUE0QztBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IseURBQXlEO0FBQ3pELDREQUE0RDtBQUM1RCwyRUFBMkU7QUFDM0UsMEVBQTBFO0FBQzFFO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrR0FBK0csS0FBSztBQUNwSDtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYiw2Q0FBNkM7QUFDN0MseURBQXlEO0FBQ3pELG9EQUFvRDtBQUNwRCxpREFBaUQ7QUFDakQsNkNBQTZDO0FBQzdDO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsaUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9vdXRwdXQvYnVmZmVyLmpzIiwid2VicGFjazovLy8uL291dHB1dC9saWJyYXJ5LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvZ2V0RnJvbUpTQXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9nZXRGcm9tSlNSZXR1cm4uanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9yZWdpc3Rlci5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSW52b2tlSlNBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSlNJbnZva2VSZXR1cm4uanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0pTT3V0QXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L3Blc2FwaUltcGwuanMiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovLy8uL291dHB1dC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuLypcclxuKiBUZW5jZW50IGlzIHBsZWFzZWQgdG8gc3VwcG9ydCB0aGUgb3BlbiBzb3VyY2UgY29tbXVuaXR5IGJ5IG1ha2luZyBQdWVydHMgYXZhaWxhYmxlLlxyXG4qIENvcHlyaWdodCAoQykgMjAyMCBUSEwgQTI5IExpbWl0ZWQsIGEgVGVuY2VudCBjb21wYW55LiAgQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKiBQdWVydHMgaXMgbGljZW5zZWQgdW5kZXIgdGhlIEJTRCAzLUNsYXVzZSBMaWNlbnNlLCBleGNlcHQgZm9yIHRoZSB0aGlyZC1wYXJ0eSBjb21wb25lbnRzIGxpc3RlZCBpbiB0aGUgZmlsZSAnTElDRU5TRScgd2hpY2ggbWF5IGJlIHN1YmplY3QgdG8gdGhlaXIgY29ycmVzcG9uZGluZyBsaWNlbnNlIHRlcm1zLlxyXG4qIFRoaXMgZmlsZSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBhbmQgY29uZGl0aW9ucyBkZWZpbmVkIGluIGZpbGUgJ0xJQ0VOU0UnLCB3aGljaCBpcyBwYXJ0IG9mIHRoaXMgc291cmNlIGNvZGUgcGFja2FnZS5cclxuKi9cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLndyaXRlRG91YmxlID0gZXhwb3J0cy53cml0ZUZsb2F0ID0gZXhwb3J0cy53cml0ZVVJbnQ2NCA9IGV4cG9ydHMud3JpdGVJbnQ2NCA9IGV4cG9ydHMud3JpdGVVSW50MzIgPSBleHBvcnRzLndyaXRlSW50MzIgPSBleHBvcnRzLndyaXRlVUludDE2ID0gZXhwb3J0cy53cml0ZUludDE2ID0gZXhwb3J0cy53cml0ZVVJbnQ4ID0gZXhwb3J0cy53cml0ZUludDggPSBleHBvcnRzLnJlYWREb3VibGUgPSBleHBvcnRzLnJlYWRGbG9hdCA9IGV4cG9ydHMucmVhZFVJbnQ2NCA9IGV4cG9ydHMucmVhZEludDY0ID0gZXhwb3J0cy5yZWFkVUludDMyID0gZXhwb3J0cy5yZWFkSW50MzIgPSBleHBvcnRzLnJlYWRVSW50MTYgPSBleHBvcnRzLnJlYWRJbnQxNiA9IGV4cG9ydHMucmVhZFVJbnQ4ID0gZXhwb3J0cy5yZWFkSW50OCA9IHZvaWQgMDtcclxuZnVuY3Rpb24gdmFsaWRhdGVOdW1iZXIodmFsdWUsIHR5cGUpIHtcclxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3R5cGV9IGV4cGVjdHMgYSBudW1iZXIgYnV0IGdvdCAke3ZhbHVlfWApO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGJvdW5kc0Vycm9yKHZhbHVlLCBsZW5ndGgsIHR5cGUpIHtcclxuICAgIGlmIChNYXRoLmZsb29yKHZhbHVlKSAhPT0gdmFsdWUpIHtcclxuICAgICAgICB2YWxpZGF0ZU51bWJlcih2YWx1ZSwgdHlwZSB8fCAnb2Zmc2V0Jyk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3R5cGUgfHwgJ29mZnNldCd9IGV4cGVjdHMgYW4gaW50ZWdlciBidXQgZ290ICR7dmFsdWV9YCk7XHJcbiAgICB9XHJcbiAgICBpZiAobGVuZ3RoIDwgMCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm91dCBvZiBib3VuZFwiKTtcclxuICAgIH1cclxuICAgIHRocm93IG5ldyBFcnJvcihgJHt0eXBlIHx8ICdvZmZzZXQnfSBleHBlY3RzID49ICR7dHlwZSA/IDEgOiAwfSBhbmQgPD0gJHtsZW5ndGh9IGJ1dCBnb3QgJHt2YWx1ZX1gKTtcclxufVxyXG5mdW5jdGlvbiBjaGVja0JvdW5kcyhidWYsIG9mZnNldCwgYnl0ZUxlbmd0aCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBpZiAoYnVmW29mZnNldF0gPT09IHVuZGVmaW5lZCB8fCBidWZbb2Zmc2V0ICsgYnl0ZUxlbmd0aF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmLmxlbmd0aCAtIChieXRlTGVuZ3RoICsgMSkpO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHdyaXRlVV9JbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCwgbWluLCBtYXgpIHtcclxuICAgIHZhbHVlID0gK3ZhbHVlO1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHZhbHVlIGV4cGVjdHMgPj0gJHttaW59IGFuZCA8PSAke21heH0gYnV0IGdvdCAke3ZhbHVlfWApO1xyXG4gICAgfVxyXG4gICAgaWYgKGJ1ZltvZmZzZXRdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1Zi5sZW5ndGggLSAxKTtcclxuICAgIH1cclxuICAgIGJ1ZltvZmZzZXRdID0gdmFsdWU7XHJcbiAgICByZXR1cm4gb2Zmc2V0ICsgMTtcclxufVxyXG5mdW5jdGlvbiByZWFkSW50OChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IHZhbCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSAxKTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWwgfCAodmFsICYgMiAqKiA3KSAqIDB4MWZmZmZmZTtcclxufVxyXG5leHBvcnRzLnJlYWRJbnQ4ID0gcmVhZEludDg7XHJcbmZ1bmN0aW9uIHdyaXRlSW50OChidWYsIHZhbHVlLCBvZmZzZXQgPSAwKSB7XHJcbiAgICByZXR1cm4gd3JpdGVVX0ludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0LCAtMHg4MCwgMHg3Zik7XHJcbn1cclxuZXhwb3J0cy53cml0ZUludDggPSB3cml0ZUludDg7XHJcbmZ1bmN0aW9uIHJlYWRVSW50OChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IHZhbCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSAxKTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWw7XHJcbn1cclxuZXhwb3J0cy5yZWFkVUludDggPSByZWFkVUludDg7XHJcbmZ1bmN0aW9uIHdyaXRlVUludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0ID0gMCkge1xyXG4gICAgcmV0dXJuIHdyaXRlVV9JbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCwgMCwgMHhmZik7XHJcbn1cclxuZXhwb3J0cy53cml0ZVVJbnQ4ID0gd3JpdGVVSW50ODtcclxuY29uc3QgaW50MTZBcnJheSA9IG5ldyBJbnQxNkFycmF5KDEpO1xyXG5jb25zdCB1SW50OEludDZBcnJheSA9IG5ldyBVaW50OEFycmF5KGludDE2QXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZEludDE2KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAxXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSAyKTtcclxuICAgIH1cclxuICAgIHVJbnQ4SW50NkFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1SW50OEludDZBcnJheVsxXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gaW50MTZBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRJbnQxNiA9IHJlYWRJbnQxNjtcclxuZnVuY3Rpb24gd3JpdGVJbnQxNihidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDEpO1xyXG4gICAgaW50MTZBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhJbnQ2QXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4SW50NkFycmF5WzFdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlSW50MTYgPSB3cml0ZUludDE2O1xyXG5jb25zdCB1aW50MTZBcnJheSA9IG5ldyBVaW50MTZBcnJheSgxKTtcclxuY29uc3QgdWludDhVaW50MTZBcnJheSA9IG5ldyBVaW50OEFycmF5KHVpbnQxNkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRVSW50MTYoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDFdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDIpO1xyXG4gICAgfVxyXG4gICAgdWludDhVaW50MTZBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhVaW50MTZBcnJheVsxXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gdWludDE2QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkVUludDE2ID0gcmVhZFVJbnQxNjtcclxuZnVuY3Rpb24gd3JpdGVVSW50MTYoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAxKTtcclxuICAgIHVpbnQxNkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQxNkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQxNkFycmF5WzFdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlVUludDE2ID0gd3JpdGVVSW50MTY7XHJcbmNvbnN0IGludDMyQXJyYXkgPSBuZXcgSW50MzJBcnJheSgxKTtcclxuY29uc3QgdWludDhJbnQzMkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoaW50MzJBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkSW50MzIoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDNdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDQpO1xyXG4gICAgfVxyXG4gICAgdWludDhJbnQzMkFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OEludDMyQXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4SW50MzJBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhJbnQzMkFycmF5WzNdID0gbGFzdDtcclxuICAgIHJldHVybiBpbnQzMkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZEludDMyID0gcmVhZEludDMyO1xyXG5mdW5jdGlvbiB3cml0ZUludDMyKGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMyk7XHJcbiAgICBpbnQzMkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEludDMyQXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4SW50MzJBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhJbnQzMkFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEludDMyQXJyYXlbM107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVJbnQzMiA9IHdyaXRlSW50MzI7XHJcbmNvbnN0IHVpbnQzMkFycmF5ID0gbmV3IFVpbnQzMkFycmF5KDEpO1xyXG5jb25zdCB1aW50OFVpbnQzMkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkodWludDMyQXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZFVJbnQzMihidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgM107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gNCk7XHJcbiAgICB9XHJcbiAgICB1aW50OFVpbnQzMkFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OFVpbnQzMkFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OFVpbnQzMkFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OFVpbnQzMkFycmF5WzNdID0gbGFzdDtcclxuICAgIHJldHVybiB1aW50MzJBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRVSW50MzIgPSByZWFkVUludDMyO1xyXG5mdW5jdGlvbiB3cml0ZVVJbnQzMihidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDMpO1xyXG4gICAgdWludDMyQXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDMyQXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDMyQXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDMyQXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDMyQXJyYXlbM107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVVSW50MzIgPSB3cml0ZVVJbnQzMjtcclxuY29uc3QgZmxvYXQzMkFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSgxKTtcclxuY29uc3QgdUludDhGbG9hdDMyQXJyYXkgPSBuZXcgVWludDhBcnJheShmbG9hdDMyQXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZEZsb2F0KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAzXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA0KTtcclxuICAgIH1cclxuICAgIHVJbnQ4RmxvYXQzMkFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1SW50OEZsb2F0MzJBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDMyQXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQzMkFycmF5WzNdID0gbGFzdDtcclxuICAgIHJldHVybiBmbG9hdDMyQXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkRmxvYXQgPSByZWFkRmxvYXQ7XHJcbmZ1bmN0aW9uIHdyaXRlRmxvYXQoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAzKTtcclxuICAgIGZsb2F0MzJBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDMyQXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQzMkFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0MzJBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDMyQXJyYXlbM107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVGbG9hdCA9IHdyaXRlRmxvYXQ7XHJcbmNvbnN0IGZsb2F0NjRBcnJheSA9IG5ldyBGbG9hdDY0QXJyYXkoMSk7XHJcbmNvbnN0IHVJbnQ4RmxvYXQ2NEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoZmxvYXQ2NEFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWREb3VibGUoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyA3XTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA4KTtcclxuICAgIH1cclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzNdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVs0XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbNV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzZdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVs3XSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gZmxvYXQ2NEFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZERvdWJsZSA9IHJlYWREb3VibGU7XHJcbmZ1bmN0aW9uIHdyaXRlRG91YmxlKGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgNyk7XHJcbiAgICBmbG9hdDY0QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzNdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVs0XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbNV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzZdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVs3XTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZURvdWJsZSA9IHdyaXRlRG91YmxlO1xyXG5jb25zdCBiaWdJbnQ2NEFycmF5ID0gbmV3IEJpZ0ludDY0QXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4QmlnSW50NjRBcnJheSA9IG5ldyBVaW50OEFycmF5KGJpZ0ludDY0QXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZEludDY0KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgN107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gOCk7XHJcbiAgICB9XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbM10gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVs0XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzVdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbNl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVs3XSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gYmlnSW50NjRBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRJbnQ2NCA9IHJlYWRJbnQ2NDtcclxuZnVuY3Rpb24gd3JpdGVJbnQ2NChidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9IHR5cGVvZiB2YWwgPT09ICdudW1iZXInID8gQmlnSW50KHZhbCkgOiB2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDcpO1xyXG4gICAgYmlnSW50NjRBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzNdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbNF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVs1XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzZdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbN107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVJbnQ2NCA9IHdyaXRlSW50NjQ7XHJcbmNvbnN0IGJpZ1VpbnQ2NEFycmF5ID0gbmV3IEJpZ1VpbnQ2NEFycmF5KDEpO1xyXG5jb25zdCB1aW50OEJpZ1VpbnQ2NEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYmlnVWludDY0QXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZFVJbnQ2NChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDddO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDgpO1xyXG4gICAgfVxyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVszXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVs0XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVs1XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVs2XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdVaW50NjRBcnJheVs3XSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gYmlnVWludDY0QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkVUludDY0ID0gcmVhZFVJbnQ2NDtcclxuZnVuY3Rpb24gd3JpdGVVSW50NjQoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSB0eXBlb2YgdmFsID09PSAnbnVtYmVyJyA/IEJpZ0ludCh2YWwpIDogdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCA3KTtcclxuICAgIGJpZ1VpbnQ2NEFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzNdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzRdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzVdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzZdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ1VpbnQ2NEFycmF5WzddO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlVUludDY0ID0gd3JpdGVVSW50NjQ7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJ1ZmZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLnJldHVybkJpZ0ludCA9IGV4cG9ydHMuaXNCaWdJbnQgPSBleHBvcnRzLnNldE91dFZhbHVlOCA9IGV4cG9ydHMuc2V0T3V0VmFsdWUzMiA9IGV4cG9ydHMubWFrZUJpZ0ludCA9IGV4cG9ydHMuR2V0VHlwZSA9IGV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBleHBvcnRzLk9uRmluYWxpemUgPSBleHBvcnRzLmNyZWF0ZVdlYWtSZWYgPSBleHBvcnRzLmdsb2JhbCA9IGV4cG9ydHMuQ1NoYXJwT2JqZWN0TWFwID0gZXhwb3J0cy5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5ID0gZXhwb3J0cy5KU09iamVjdCA9IGV4cG9ydHMuSlNGdW5jdGlvbiA9IGV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyID0gZXhwb3J0cy5GdW5jdGlvbkNhbGxiYWNrSW5mbyA9IHZvaWQgMDtcclxuLyoqXHJcbiAqIOS4gOasoeWHveaVsOiwg+eUqOeahGluZm9cclxuICog5a+55bqUdjg6OkZ1bmN0aW9uQ2FsbGJhY2tJbmZvXHJcbiAqL1xyXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mbyB7XHJcbiAgICBhcmdzO1xyXG4gICAgcmV0dXJuVmFsdWU7XHJcbiAgICBzdGFjayA9IDA7XHJcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XHJcbiAgICAgICAgdGhpcy5hcmdzID0gYXJncztcclxuICAgIH1cclxuICAgIHJlY3ljbGUoKSB7XHJcbiAgICAgICAgdGhpcy5zdGFjayA9IDA7XHJcbiAgICAgICAgdGhpcy5hcmdzID0gbnVsbDtcclxuICAgICAgICB0aGlzLnJldHVyblZhbHVlID0gdm9pZCAwO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm8gPSBGdW5jdGlvbkNhbGxiYWNrSW5mbztcclxuLy8gc3RydWN0IE1vY2tWOFZhbHVlXHJcbi8vIHtcclxuLy8gICAgIGludCBKU1ZhbHVlVHlwZTsgIC8vIDBcclxuLy8gICAgIGludCBGaW5hbFZhbHVlUG9pbnRlclsyXTsgLy8gMSAyIGlmIHZhbHVlIGlzIGJpZ2ludCBGaW5hbFZhbHVlUG9pbnRlclswXSBmb3IgbG93LCBGaW5hbFZhbHVlUG9pbnRlclsxXSBmb3IgaGlnaFxyXG4vLyAgICAgaW50IGV4dHJhOyAvLyAzXHJcbi8vICAgICBpbnQgRnVuY3Rpb25DYWxsYmFja0luZm87IC8vIDRcclxuLy8gfTtcclxuY29uc3QgQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgPSA0OyAvLyBpbnQgY291bnRcclxuLyoqXHJcbiAqIOaKikZ1bmN0aW9uQ2FsbGJhY2tJbmZv5Lul5Y+K5YW25Y+C5pWw6L2s5YyW5Li6YyPlj6/nlKjnmoRpbnRwdHJcclxuICovXHJcbmNsYXNzIEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciB7XHJcbiAgICAvLyBGdW5jdGlvbkNhbGxiYWNrSW5mb+eahOWIl+ihqO+8jOS7peWIl+ihqOeahGluZGV45L2c5Li6SW50UHRy55qE5YC8XHJcbiAgICBpbmZvcyA9IFtuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oWzBdKV07IC8vIOi/memHjOWOn+acrOWPquaYr+S4quaZrumAmueahDBcclxuICAgIC8vIEZ1bmN0aW9uQ2FsbGJhY2tJbmZv55So5a6M5ZCO77yM5bCG5YW25bqP5Y+35pS+5YWl4oCc5Zue5pS25YiX6KGo4oCd77yM5LiL5qyh5bCx6IO957un57ut5pyN55So6K+laW5kZXjvvIzogIzkuI3lv4XorqlpbmZvc+aVsOe7hOaXoOmZkOaJqeWxleS4i+WOu1xyXG4gICAgZnJlZUluZm9zSW5kZXggPSBbXTtcclxuICAgIGZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aCA9IHt9O1xyXG4gICAgZnJlZVJlZk1lbW9yeSA9IFtdO1xyXG4gICAgZW5naW5lO1xyXG4gICAgY29uc3RydWN0b3IoZW5naW5lKSB7XHJcbiAgICAgICAgdGhpcy5lbmdpbmUgPSBlbmdpbmU7XHJcbiAgICB9XHJcbiAgICBhbGxvY0NhbGxiYWNrSW5mb01lbW9yeShhcmdzTGVuZ3RoKSB7XHJcbiAgICAgICAgY29uc3QgY2FjaGVBcnJheSA9IHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdO1xyXG4gICAgICAgIGlmIChjYWNoZUFycmF5ICYmIGNhY2hlQXJyYXkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWNoZUFycmF5LnBvcCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoKGFyZ3NMZW5ndGggKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDEpIDw8IDIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGFsbG9jUmVmTWVtb3J5KCkge1xyXG4gICAgICAgIGlmICh0aGlzLmZyZWVSZWZNZW1vcnkubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mcmVlUmVmTWVtb3J5LnBvcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVuZ2luZS51bml0eUFwaS5fbWFsbG9jKEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyIDw8IDIpO1xyXG4gICAgfVxyXG4gICAgcmVjeWNsZVJlZk1lbW9yeShidWZmZXJQdHIpIHtcclxuICAgICAgICBpZiAodGhpcy5mcmVlUmVmTWVtb3J5Lmxlbmd0aCA+IDIwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9mcmVlKGJ1ZmZlclB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmZyZWVSZWZNZW1vcnkucHVzaChidWZmZXJQdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJlY3ljbGVDYWxsYmFja0luZm9NZW1vcnkoYnVmZmVyUHRyLCBhcmdzKSB7XHJcbiAgICAgICAgY29uc3QgYXJnc0xlbmd0aCA9IGFyZ3MubGVuZ3RoO1xyXG4gICAgICAgIGlmICghdGhpcy5mcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGhbYXJnc0xlbmd0aF0gJiYgYXJnc0xlbmd0aCA8IDUpIHtcclxuICAgICAgICAgICAgdGhpcy5mcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGhbYXJnc0xlbmd0aF0gPSBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgY2FjaGVBcnJheSA9IHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdO1xyXG4gICAgICAgIGlmICghY2FjaGVBcnJheSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ckluMzIgPSBidWZmZXJQdHIgPDwgMjtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ3NMZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICBpZiAoYXJnc1tpXSBpbnN0YW5jZW9mIEFycmF5ICYmIGFyZ3NbaV0ubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVjeWNsZVJlZk1lbW9yeSh0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbYnVmZmVyUHRySW4zMiArIGkgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyDmi43ohJHooovlrprnmoTmnIDlpKfnvJPlrZjkuKrmlbDlpKflsI/jgIIgNTAgLSDlj4LmlbDkuKrmlbAgKiAxMFxyXG4gICAgICAgIGlmIChjYWNoZUFycmF5Lmxlbmd0aCA+ICg1MCAtIGFyZ3NMZW5ndGggKiAxMCkpIHtcclxuICAgICAgICAgICAgdGhpcy5lbmdpbmUudW5pdHlBcGkuX2ZyZWUoYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNhY2hlQXJyYXkucHVzaChidWZmZXJQdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogaW50cHRy55qE5qC85byP5Li6aWTlt6bnp7vlm5vkvY1cclxuICAgICAqXHJcbiAgICAgKiDlj7Pkvqflm5vkvY3vvIzmmK/kuLrkuoblnKjlj7Plm5vkvY3lrZjlgqjlj4LmlbDnmoTluo/lj7fvvIzov5nmoLflj6/ku6XnlKjkuo7ooajnpLpjYWxsYmFja2luZm/lj4LmlbDnmoRpbnRwdHJcclxuICAgICAqL1xyXG4gICAgLy8gc3RhdGljIEdldE1vY2tQb2ludGVyKGFyZ3M6IGFueVtdKTogTW9ja0ludFB0ciB7XHJcbiAgICAvLyAgICAgbGV0IGluZGV4OiBudW1iZXI7XHJcbiAgICAvLyAgICAgaW5kZXggPSB0aGlzLmZyZWVJbmZvc0luZGV4LnBvcCgpO1xyXG4gICAgLy8gICAgIC8vIGluZGV45pyA5bCP5Li6MVxyXG4gICAgLy8gICAgIGlmIChpbmRleCkge1xyXG4gICAgLy8gICAgICAgICB0aGlzLmluZm9zW2luZGV4XS5hcmdzID0gYXJncztcclxuICAgIC8vICAgICB9IGVsc2Uge1xyXG4gICAgLy8gICAgICAgICBpbmRleCA9IHRoaXMuaW5mb3MucHVzaChuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oYXJncykpIC0gMTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgICAgcmV0dXJuIGluZGV4IDw8IDQ7XHJcbiAgICAvLyB9XHJcbiAgICBHZXRNb2NrUG9pbnRlcihhcmdzKSB7XHJcbiAgICAgICAgY29uc3QgYXJnc0xlbmd0aCA9IGFyZ3MubGVuZ3RoO1xyXG4gICAgICAgIGxldCBidWZmZXJQdHJJbjggPSB0aGlzLmFsbG9jQ2FsbGJhY2tJbmZvTWVtb3J5KGFyZ3NMZW5ndGgpO1xyXG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMuZnJlZUluZm9zSW5kZXgucG9wKCk7XHJcbiAgICAgICAgbGV0IGZ1bmN0aW9uQ2FsbGJhY2tJbmZvO1xyXG4gICAgICAgIC8vIGluZGV45pyA5bCP5Li6MVxyXG4gICAgICAgIGlmIChpbmRleCkge1xyXG4gICAgICAgICAgICAoZnVuY3Rpb25DYWxsYmFja0luZm8gPSB0aGlzLmluZm9zW2luZGV4XSkuYXJncyA9IGFyZ3M7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpbmRleCA9IHRoaXMuaW5mb3MucHVzaChmdW5jdGlvbkNhbGxiYWNrSW5mbyA9IG5ldyBGdW5jdGlvbkNhbGxiYWNrSW5mbyhhcmdzKSkgLSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgdW5pdHlBcGkgPSB0aGlzLmVuZ2luZS51bml0eUFwaTtcclxuICAgICAgICBjb25zdCBidWZmZXJQdHJJbjMyID0gYnVmZmVyUHRySW44ID4+IDI7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2J1ZmZlclB0ckluMzJdID0gaW5kZXg7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzTGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGFyZyA9IGFyZ3NbaV07XHJcbiAgICAgICAgICAgIC8vIGluaXQgZWFjaCB2YWx1ZVxyXG4gICAgICAgICAgICBjb25zdCBqc1ZhbHVlVHlwZSA9IEdldFR5cGUodGhpcy5lbmdpbmUsIGFyZyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzVmFsdWVQdHIgPSBidWZmZXJQdHJJbjMyICsgaSAqIEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyICsgMTtcclxuICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHJdID0ganNWYWx1ZVR5cGU7IC8vIGpzdmFsdWV0eXBlXHJcbiAgICAgICAgICAgIGlmIChqc1ZhbHVlVHlwZSA9PSAyIHx8IGpzVmFsdWVUeXBlID09IDQgfHwganNWYWx1ZVR5cGUgPT0gNTEyKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBiaWdpbnTjgIFudW1iZXIgb3IgZGF0ZVxyXG4gICAgICAgICAgICAgICAgJEZpbGxBcmd1bWVudEZpbmFsTnVtYmVyVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIGpzVmFsdWVQdHIgKyAxKTsgLy8gdmFsdWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChqc1ZhbHVlVHlwZSA9PSA4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnVuY3Rpb25DYWxsYmFja0luZm8uc3RhY2sgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uQ2FsbGJhY2tJbmZvLnN0YWNrID0gdW5pdHlBcGkuc3RhY2tTYXZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwgKGpzVmFsdWVQdHIgKyAyKSA8PCAyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChqc1ZhbHVlVHlwZSA9PSA2NCAmJiBhcmcgaW5zdGFuY2VvZiBBcnJheSAmJiBhcmcubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIG1heWJlIGEgcmVmXHJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwgMCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWZQdHJJbjggPSB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDJdID0gdGhpcy5hbGxvY1JlZk1lbW9yeSgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmUHRyID0gcmVmUHRySW44ID4+IDI7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWZWYWx1ZVR5cGUgPSB1bml0eUFwaS5IRUFQMzJbcmVmUHRyXSA9IEdldFR5cGUodGhpcy5lbmdpbmUsIGFyZ1swXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVmVmFsdWVUeXBlID09IDIgfHwgcmVmVmFsdWVUeXBlID09IDQgfHwgcmVmVmFsdWVUeXBlID09IDUxMikge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG51bWJlciBvciBkYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgJEZpbGxBcmd1bWVudEZpbmFsTnVtYmVyVmFsdWUodGhpcy5lbmdpbmUsIGFyZ1swXSwgcmVmVmFsdWVUeXBlLCByZWZQdHIgKyAxKTsgLy8gdmFsdWVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltyZWZQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZ1swXSwgcmVmVmFsdWVUeXBlLCAocmVmUHRyICsgMikgPDwgMik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbcmVmUHRyICsgM10gPSBidWZmZXJQdHJJbjg7IC8vIGEgcG9pbnRlciB0byB0aGUgaW5mb1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gb3RoZXJcclxuICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmcsIGpzVmFsdWVUeXBlLCAoanNWYWx1ZVB0ciArIDIpIDw8IDIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgM10gPSBidWZmZXJQdHJJbjg7IC8vIGEgcG9pbnRlciB0byB0aGUgaW5mb1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYnVmZmVyUHRySW44O1xyXG4gICAgfVxyXG4gICAgLy8gc3RhdGljIEdldEJ5TW9ja1BvaW50ZXIoaW50cHRyOiBNb2NrSW50UHRyKTogRnVuY3Rpb25DYWxsYmFja0luZm8ge1xyXG4gICAgLy8gICAgIHJldHVybiB0aGlzLmluZm9zW2ludHB0ciA+PiA0XTtcclxuICAgIC8vIH1cclxuICAgIEdldEJ5TW9ja1BvaW50ZXIocHRySW44KSB7XHJcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmluZm9zW2luZGV4XTtcclxuICAgIH1cclxuICAgIEdldFJldHVyblZhbHVlQW5kUmVjeWNsZShwdHJJbjgpIHtcclxuICAgICAgICBjb25zdCBwdHJJbjMyID0gcHRySW44ID4+IDI7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMl07XHJcbiAgICAgICAgbGV0IGluZm8gPSB0aGlzLmluZm9zW2luZGV4XTtcclxuICAgICAgICBsZXQgcmV0ID0gaW5mby5yZXR1cm5WYWx1ZTtcclxuICAgICAgICB0aGlzLnJlY3ljbGVDYWxsYmFja0luZm9NZW1vcnkocHRySW44LCBpbmZvLmFyZ3MpO1xyXG4gICAgICAgIGlmIChpbmZvLnN0YWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLnN0YWNrUmVzdG9yZShpbmZvLnN0YWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5mby5yZWN5Y2xlKCk7XHJcbiAgICAgICAgdGhpcy5mcmVlSW5mb3NJbmRleC5wdXNoKGluZGV4KTtcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gICAgUmVsZWFzZUJ5TW9ja0ludFB0cihwdHJJbjgpIHtcclxuICAgICAgICBjb25zdCBwdHJJbjMyID0gcHRySW44ID4+IDI7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMl07XHJcbiAgICAgICAgbGV0IGluZm8gPSB0aGlzLmluZm9zW2luZGV4XTtcclxuICAgICAgICB0aGlzLnJlY3ljbGVDYWxsYmFja0luZm9NZW1vcnkocHRySW44LCBpbmZvLmFyZ3MpO1xyXG4gICAgICAgIGlmIChpbmZvLnN0YWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLnN0YWNrUmVzdG9yZShpbmZvLnN0YWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5mby5yZWN5Y2xlKCk7XHJcbiAgICAgICAgdGhpcy5mcmVlSW5mb3NJbmRleC5wdXNoKGluZGV4KTtcclxuICAgIH1cclxuICAgIEdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWVQdHJJbjgpIHtcclxuICAgICAgICBsZXQgaGVhcDMyID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyO1xyXG4gICAgICAgIGNvbnN0IGluZm9QdHJJbjggPSBoZWFwMzJbKHZhbHVlUHRySW44ID4+IDIpICsgM107XHJcbiAgICAgICAgY29uc3QgY2FsbGJhY2tJbmZvSW5kZXggPSBoZWFwMzJbaW5mb1B0ckluOCA+PiAyXTtcclxuICAgICAgICBjb25zdCBhcmdzSW5kZXggPSAodmFsdWVQdHJJbjggLSBpbmZvUHRySW44IC0gNCkgLyAoNCAqIEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbmZvc1tjYWxsYmFja0luZm9JbmRleF0uYXJnc1thcmdzSW5kZXhdO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyO1xyXG4vKipcclxuICog5Luj6KGo5LiA5LiqSlNGdW5jdGlvblxyXG4gKi9cclxuY2xhc3MgSlNGdW5jdGlvbiB7XHJcbiAgICBfZnVuYztcclxuICAgIGlkO1xyXG4gICAgYXJncyA9IFtdO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICBjb25zdHJ1Y3RvcihpZCwgZnVuYykge1xyXG4gICAgICAgIHRoaXMuX2Z1bmMgPSBmdW5jO1xyXG4gICAgICAgIHRoaXMuaWQgPSBpZDtcclxuICAgIH1cclxuICAgIGludm9rZSgpIHtcclxuICAgICAgICB2YXIgYXJncyA9IFsuLi50aGlzLmFyZ3NdO1xyXG4gICAgICAgIHRoaXMuYXJncy5sZW5ndGggPSAwO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9mdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuSlNGdW5jdGlvbiA9IEpTRnVuY3Rpb247XHJcbi8qKlxyXG4gKiDku6PooajkuIDkuKpKU09iamVjdFxyXG4gKi9cclxuY2xhc3MgSlNPYmplY3Qge1xyXG4gICAgX29iajtcclxuICAgIGlkO1xyXG4gICAgY29uc3RydWN0b3IoaWQsIG9iaikge1xyXG4gICAgICAgIHRoaXMuX29iaiA9IG9iajtcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICB9XHJcbiAgICBnZXRPYmplY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX29iajtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkpTT2JqZWN0ID0gSlNPYmplY3Q7XHJcbmNsYXNzIGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnkge1xyXG4gICAgc3RhdGljIHJlZ3VsYXJJRCA9IDE7XHJcbiAgICBzdGF0aWMgZnJlZUlEID0gW107XHJcbiAgICBzdGF0aWMgaWRNYXAgPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgc3RhdGljIGpzRnVuY09yT2JqZWN0S1YgPSB7fTtcclxuICAgIHN0YXRpYyBnZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuY1ZhbHVlKSB7XHJcbiAgICAgICAgbGV0IGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5nZXQoZnVuY1ZhbHVlKTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmZyZWVJRC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaWQgPSB0aGlzLmZyZWVJRC5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZWd1bGFySUQrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZnVuYyA9IG5ldyBKU0Z1bmN0aW9uKGlkLCBmdW5jVmFsdWUpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuc2V0KGZ1bmNWYWx1ZSwgaWQpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBmdW5jO1xyXG4gICAgICAgIHJldHVybiBmdW5jO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGdldE9yQ3JlYXRlSlNPYmplY3Qob2JqKSB7XHJcbiAgICAgICAgbGV0IGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5nZXQob2JqKTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmZyZWVJRC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaWQgPSB0aGlzLmZyZWVJRC5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZWd1bGFySUQrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QganNPYmplY3QgPSBuZXcgSlNPYmplY3QoaWQsIG9iaik7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5zZXQob2JqLCBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXSA9IGpzT2JqZWN0O1xyXG4gICAgICAgIHJldHVybiBqc09iamVjdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBnZXRKU09iamVjdEJ5SWQoaWQpIHtcclxuICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgIH1cclxuICAgIHN0YXRpYyByZW1vdmVKU09iamVjdEJ5SWQoaWQpIHtcclxuICAgICAgICBjb25zdCBqc09iamVjdCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgaWYgKCFqc09iamVjdClcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybigncmVtb3ZlSlNPYmplY3RCeUlkIGZhaWxlZDogaWQgaXMgaW52YWxpZDogJyArIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmRlbGV0ZShqc09iamVjdC5nZXRPYmplY3QoKSk7XHJcbiAgICAgICAgZGVsZXRlIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgdGhpcy5mcmVlSUQucHVzaChpZCk7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZ2V0SlNGdW5jdGlvbkJ5SWQoaWQpIHtcclxuICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgIH1cclxuICAgIHN0YXRpYyByZW1vdmVKU0Z1bmN0aW9uQnlJZChpZCkge1xyXG4gICAgICAgIGNvbnN0IGpzRnVuYyA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgaWYgKCFqc0Z1bmMpXHJcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ3JlbW92ZUpTRnVuY3Rpb25CeUlkIGZhaWxlZDogaWQgaXMgaW52YWxpZDogJyArIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmRlbGV0ZShqc0Z1bmMuX2Z1bmMpO1xyXG4gICAgICAgIGRlbGV0ZSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIHRoaXMuZnJlZUlELnB1c2goaWQpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnk7XHJcbi8qKlxyXG4gKiBDU2hhcnDlr7nosaHorrDlvZXooajvvIzorrDlvZXmiYDmnIlDU2hhcnDlr7nosaHlubbliIbphY1pZFxyXG4gKiDlkoxwdWVydHMuZGxs5omA5YGa55qE5LiA5qC3XHJcbiAqL1xyXG5jbGFzcyBDU2hhcnBPYmplY3RNYXAge1xyXG4gICAgY2xhc3NlcyA9IFtudWxsXTtcclxuICAgIG5hdGl2ZU9iamVjdEtWID0gbmV3IE1hcCgpO1xyXG4gICAgLy8gcHJpdmF0ZSBuYXRpdmVPYmplY3RLVjogeyBbb2JqZWN0SUQ6IENTSWRlbnRpZmllcl06IFdlYWtSZWY8YW55PiB9ID0ge307XHJcbiAgICAvLyBwcml2YXRlIGNzSURXZWFrTWFwOiBXZWFrTWFwPGFueSwgQ1NJZGVudGlmaWVyPiA9IG5ldyBXZWFrTWFwKCk7XHJcbiAgICBuYW1lc1RvQ2xhc3Nlc0lEID0ge307XHJcbiAgICBjbGFzc0lEV2Vha01hcCA9IG5ldyBXZWFrTWFwKCk7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLl9tZW1vcnlEZWJ1ZyAmJiBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhZGRDYWxsZWQnLCB0aGlzLmFkZENhbGxlZCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZW1vdmVDYWxsZWQnLCB0aGlzLnJlbW92ZUNhbGxlZCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd3cicsIHRoaXMubmF0aXZlT2JqZWN0S1Yuc2l6ZSk7XHJcbiAgICAgICAgfSwgMTAwMCk7XHJcbiAgICB9XHJcbiAgICBfbWVtb3J5RGVidWcgPSBmYWxzZTtcclxuICAgIGFkZENhbGxlZCA9IDA7XHJcbiAgICByZW1vdmVDYWxsZWQgPSAwO1xyXG4gICAgYWRkKGNzSUQsIG9iaikge1xyXG4gICAgICAgIHRoaXMuX21lbW9yeURlYnVnICYmIHRoaXMuYWRkQ2FsbGVkKys7XHJcbiAgICAgICAgLy8gdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcclxuICAgICAgICAvLyB0aGlzLmNzSURXZWFrTWFwLnNldChvYmosIGNzSUQpO1xyXG4gICAgICAgIHRoaXMubmF0aXZlT2JqZWN0S1Yuc2V0KGNzSUQsIGNyZWF0ZVdlYWtSZWYob2JqKSk7XHJcbiAgICAgICAgb2JqWyckY3NpZCddID0gY3NJRDtcclxuICAgIH1cclxuICAgIHJlbW92ZShjc0lEKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgdGhpcy5yZW1vdmVDYWxsZWQrKztcclxuICAgICAgICAvLyBkZWxldGUgdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXTtcclxuICAgICAgICB0aGlzLm5hdGl2ZU9iamVjdEtWLmRlbGV0ZShjc0lEKTtcclxuICAgIH1cclxuICAgIGZpbmRPckFkZE9iamVjdChjc0lELCBjbGFzc0lEKSB7XHJcbiAgICAgICAgbGV0IHJldCA9IHRoaXMubmF0aXZlT2JqZWN0S1YuZ2V0KGNzSUQpO1xyXG4gICAgICAgIC8vIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdO1xyXG4gICAgICAgIGlmIChyZXQgJiYgKHJldCA9IHJldC5kZXJlZigpKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXQgPSB0aGlzLmNsYXNzZXNbY2xhc3NJRF0uY3JlYXRlRnJvbUNTKGNzSUQpO1xyXG4gICAgICAgIC8vIHRoaXMuYWRkKGNzSUQsIHJldCk7IOaehOmAoOWHveaVsOmHjOi0n+i0o+iwg+eUqFxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbiAgICBnZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KG9iaikge1xyXG4gICAgICAgIC8vIHJldHVybiB0aGlzLmNzSURXZWFrTWFwLmdldChvYmopO1xyXG4gICAgICAgIHJldHVybiBvYmogPyBvYmouJGNzaWQgOiAwO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuQ1NoYXJwT2JqZWN0TWFwID0gQ1NoYXJwT2JqZWN0TWFwO1xyXG47XHJcbnZhciBkZXN0cnVjdG9ycyA9IHt9O1xyXG5leHBvcnRzLmdsb2JhbCA9IGdsb2JhbCA9IGdsb2JhbCB8fCBnbG9iYWxUaGlzIHx8IHdpbmRvdztcclxuZ2xvYmFsLmdsb2JhbCA9IGdsb2JhbDtcclxuY29uc3QgY3JlYXRlV2Vha1JlZiA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodHlwZW9mIFdlYWtSZWYgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBpZiAodHlwZW9mIFdYV2Vha1JlZiA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiV2Vha1JlZiBpcyBub3QgZGVmaW5lZC4gbWF5YmUgeW91IHNob3VsZCB1c2UgbmV3ZXIgZW52aXJvbm1lbnRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBkZXJlZigpIHsgcmV0dXJuIG9iajsgfSB9O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLndhcm4oXCJ1c2luZyBXWFdlYWtSZWZcIik7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBXWFdlYWtSZWYob2JqKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICByZXR1cm4gbmV3IFdlYWtSZWYob2JqKTtcclxuICAgIH07XHJcbn0pKCk7XHJcbmV4cG9ydHMuY3JlYXRlV2Vha1JlZiA9IGNyZWF0ZVdlYWtSZWY7XHJcbmNsYXNzIEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9jayB7XHJcbiAgICBfaGFuZGxlcjtcclxuICAgIHJlZnMgPSBbXTtcclxuICAgIGhlbGRzID0gW107XHJcbiAgICBhdmFpbGFibGVJbmRleCA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IoaGFuZGxlcikge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihcIkZpbmFsaXphdGlvblJlZ2lzdGVyIGlzIG5vdCBkZWZpbmVkLiB1c2luZyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2tcIik7XHJcbiAgICAgICAgZ2xvYmFsLl9wdWVydHNfcmVnaXN0cnkgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuX2hhbmRsZXIgPSBoYW5kbGVyO1xyXG4gICAgfVxyXG4gICAgcmVnaXN0ZXIob2JqLCBoZWxkVmFsdWUpIHtcclxuICAgICAgICBpZiAodGhpcy5hdmFpbGFibGVJbmRleC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmF2YWlsYWJsZUluZGV4LnBvcCgpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZnNbaW5kZXhdID0gY3JlYXRlV2Vha1JlZihvYmopO1xyXG4gICAgICAgICAgICB0aGlzLmhlbGRzW2luZGV4XSA9IGhlbGRWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVmcy5wdXNoKGNyZWF0ZVdlYWtSZWYob2JqKSk7XHJcbiAgICAgICAgICAgIHRoaXMuaGVsZHMucHVzaChoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog5riF6Zmk5Y+v6IO95bey57uP5aSx5pWI55qEV2Vha1JlZlxyXG4gICAgICovXHJcbiAgICBpdGVyYXRlUG9zaXRpb24gPSAwO1xyXG4gICAgY2xlYW51cChwYXJ0ID0gMSkge1xyXG4gICAgICAgIGNvbnN0IHN0ZXBDb3VudCA9IHRoaXMucmVmcy5sZW5ndGggLyBwYXJ0O1xyXG4gICAgICAgIGxldCBpID0gdGhpcy5pdGVyYXRlUG9zaXRpb247XHJcbiAgICAgICAgZm9yIChsZXQgY3VycmVudFN0ZXAgPSAwOyBpIDwgdGhpcy5yZWZzLmxlbmd0aCAmJiBjdXJyZW50U3RlcCA8IHN0ZXBDb3VudDsgaSA9IChpID09IHRoaXMucmVmcy5sZW5ndGggLSAxID8gMCA6IGkgKyAxKSwgY3VycmVudFN0ZXArKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5yZWZzW2ldID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWZzW2ldLmRlcmVmKCkpIHtcclxuICAgICAgICAgICAgICAgIC8vIOebruWJjeayoeacieWGheWtmOaVtOeQhuiDveWKm++8jOWmguaenOa4uOaIj+S4reacn3JlZuW+iOWkmuS9huWQjuacn+WwkeS6hu+8jOi/memHjOWwseS8mueZvei0uemBjeWOhuasoeaVsFxyXG4gICAgICAgICAgICAgICAgLy8g5L2G6YGN5Y6G5Lmf5Y+q5piv5LiA5Y+lPT3lkoxjb250aW51Ze+8jOa1qui0ueW9seWTjeS4jeWkp1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdmFpbGFibGVJbmRleC5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWZzW2ldID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlcih0aGlzLmhlbGRzW2ldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLml0ZXJhdGVQb3NpdGlvbiA9IGk7XHJcbiAgICB9XHJcbn1cclxudmFyIHJlZ2lzdHJ5ID0gbnVsbDtcclxuZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIHJlZ2lzdHJ5ID0gbmV3ICh0eXBlb2YgRmluYWxpemF0aW9uUmVnaXN0cnkgPT0gJ3VuZGVmaW5lZCcgPyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2sgOiBGaW5hbGl6YXRpb25SZWdpc3RyeSkoZnVuY3Rpb24gKGhlbGRWYWx1ZSkge1xyXG4gICAgICAgIHZhciBjYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XHJcbiAgICAgICAgaWYgKCFjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYW5ub3QgZmluZCBkZXN0cnVjdG9yIGZvciBcIiArIGhlbGRWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgtLWNhbGxiYWNrLnJlZiA9PSAwKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xyXG4gICAgICAgICAgICBjYWxsYmFjayhoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIE9uRmluYWxpemUob2JqLCBoZWxkVmFsdWUsIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAoIXJlZ2lzdHJ5KSB7XHJcbiAgICAgICAgaW5pdCgpO1xyXG4gICAgfVxyXG4gICAgbGV0IG9yaWdpbkNhbGxiYWNrID0gZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXTtcclxuICAgIGlmIChvcmlnaW5DYWxsYmFjaykge1xyXG4gICAgICAgIC8vIFdlYWtSZWblhoXlrrnph4rmlL7ml7bmnLrlj6/og73mr5RmaW5hbGl6YXRpb25SZWdpc3RyeeeahOinpuWPkeabtOaXqe+8jOWJjemdouWmguaenOWPkeeOsHdlYWtSZWbkuLrnqbrkvJrph43mlrDliJvlu7rlr7nosaFcclxuICAgICAgICAvLyDkvYbkuYvliY3lr7nosaHnmoRmaW5hbGl6YXRpb25SZWdpc3RyeeacgOe7iOWPiOiCr+WumuS8muinpuWPkeOAglxyXG4gICAgICAgIC8vIOaJgOS7peWmguaenOmBh+WIsOi/meS4quaDheWGte+8jOmcgOimgee7mWRlc3RydWN0b3LliqDorqHmlbBcclxuICAgICAgICArK29yaWdpbkNhbGxiYWNrLnJlZjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGNhbGxiYWNrLnJlZiA9IDE7XHJcbiAgICAgICAgZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXSA9IGNhbGxiYWNrO1xyXG4gICAgfVxyXG4gICAgcmVnaXN0cnkucmVnaXN0ZXIob2JqLCBoZWxkVmFsdWUpO1xyXG59XHJcbmV4cG9ydHMuT25GaW5hbGl6ZSA9IE9uRmluYWxpemU7XHJcbmNsYXNzIFB1ZXJ0c0pTRW5naW5lIHtcclxuICAgIGNzaGFycE9iamVjdE1hcDtcclxuICAgIGZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcclxuICAgIHVuaXR5QXBpO1xyXG4gICAgLyoqIOWtl+espuS4sue8k+WtmO+8jOm7mOiupOS4ujI1NuWtl+iKgiAqL1xyXG4gICAgc3RyQnVmZmVyO1xyXG4gICAgc3RyaW5nQnVmZmVyU2l6ZSA9IDI1NjtcclxuICAgIGxhc3RSZXR1cm5DU1Jlc3VsdCA9IG51bGw7XHJcbiAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgIC8vIOi/meS4pOS4quaYr1B1ZXJ0c+eUqOeahOeahOecn+ato+eahENTaGFycOWHveaVsOaMh+mSiFxyXG4gICAgR2V0SlNBcmd1bWVudHNDYWxsYmFjaztcclxuICAgIGdlbmVyYWxEZXN0cnVjdG9yO1xyXG4gICAgY29uc3RydWN0b3IoY3RvclBhcmFtKSB7XHJcbiAgICAgICAgdGhpcy5jc2hhcnBPYmplY3RNYXAgPSBuZXcgQ1NoYXJwT2JqZWN0TWFwKCk7XHJcbiAgICAgICAgdGhpcy5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIgPSBuZXcgRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyKHRoaXMpO1xyXG4gICAgICAgIGNvbnN0IHsgVVRGOFRvU3RyaW5nLCBfbWFsbG9jLCBfZnJlZSwgX3NldFRlbXBSZXQwLCBzdHJpbmdUb1VURjgsIGxlbmd0aEJ5dGVzVVRGOCwgc3RhY2tTYXZlLCBzdGFja1Jlc3RvcmUsIHN0YWNrQWxsb2MsIGFkZEZ1bmN0aW9uLCByZW1vdmVGdW5jdGlvbiwgX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrLCBfQ2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2ssIF9DYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrLCBJbmplY3RQYXBpR0xOYXRpdmVJbXBsLCBIRUFQOCwgSEVBUFU4LCBIRUFQMzIsIEhFQVBGMzIsIEhFQVBGNjQsIH0gPSBjdG9yUGFyYW07XHJcbiAgICAgICAgdGhpcy5zdHJCdWZmZXIgPSBfbWFsbG9jKHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSk7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaSA9IHtcclxuICAgICAgICAgICAgVVRGOFRvU3RyaW5nLFxyXG4gICAgICAgICAgICBfbWFsbG9jLFxyXG4gICAgICAgICAgICBfZnJlZSxcclxuICAgICAgICAgICAgX3NldFRlbXBSZXQwLFxyXG4gICAgICAgICAgICBzdHJpbmdUb1VURjgsXHJcbiAgICAgICAgICAgIGxlbmd0aEJ5dGVzVVRGOCxcclxuICAgICAgICAgICAgc3RhY2tTYXZlLFxyXG4gICAgICAgICAgICBzdGFja1Jlc3RvcmUsXHJcbiAgICAgICAgICAgIHN0YWNrQWxsb2MsXHJcbiAgICAgICAgICAgIGFkZEZ1bmN0aW9uLFxyXG4gICAgICAgICAgICByZW1vdmVGdW5jdGlvbixcclxuICAgICAgICAgICAgX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrLFxyXG4gICAgICAgICAgICBfQ2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIF9DYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrLFxyXG4gICAgICAgICAgICBJbmplY3RQYXBpR0xOYXRpdmVJbXBsLFxyXG4gICAgICAgICAgICBIRUFQOCxcclxuICAgICAgICAgICAgSEVBUFU4LFxyXG4gICAgICAgICAgICBIRUFQMzIsXHJcbiAgICAgICAgICAgIEhFQVBGMzIsXHJcbiAgICAgICAgICAgIEhFQVBGNjQsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBnbG9iYWwuX190Z2pzRXZhbFNjcmlwdCA9IHR5cGVvZiBldmFsID09IFwidW5kZWZpbmVkXCIgPyAoKSA9PiB7IH0gOiBldmFsO1xyXG4gICAgICAgIGdsb2JhbC5fX3RnanNTZXRQcm9taXNlUmVqZWN0Q2FsbGJhY2sgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB3eCAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgd3gub25VbmhhbmRsZWRSZWplY3Rpb24oY2FsbGJhY2spO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBnbG9iYWwuX19wdWVydHNHZXRMYXN0RXhjZXB0aW9uID0gKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0RXhjZXB0aW9uO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICAvKiogY2FsbCB3aGVuIHdhc20gZ3JvdyBtZW1vcnkgKi9cclxuICAgIHVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzKEhFQVA4LCBIRUFQVTgsIEhFQVAzMiwgSEVBUEYzMiwgSEVBUEY2NCkge1xyXG4gICAgICAgIGxldCB1bml0eUFwaSA9IHRoaXMudW5pdHlBcGk7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUDggPSBIRUFQODtcclxuICAgICAgICB1bml0eUFwaS5IRUFQVTggPSBIRUFQVTg7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUDMyID0gSEVBUDMyO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVBGMzIgPSBIRUFQRjMyO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVBGNjQgPSBIRUFQRjY0O1xyXG4gICAgfVxyXG4gICAgbWVtY3B5KGRlc3QsIHNyYywgbnVtKSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5IRUFQVTguY29weVdpdGhpbihkZXN0LCBzcmMsIHNyYyArIG51bSk7XHJcbiAgICB9XHJcbiAgICBKU1N0cmluZ1RvQ1NTdHJpbmcocmV0dXJuU3RyLCAvKiogb3V0IGludCAqLyBsZW5ndGhPZmZzZXQpIHtcclxuICAgICAgICBpZiAocmV0dXJuU3RyID09PSBudWxsIHx8IHJldHVyblN0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnl0ZUNvdW50ID0gdGhpcy51bml0eUFwaS5sZW5ndGhCeXRlc1VURjgocmV0dXJuU3RyKTtcclxuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aE9mZnNldCwgYnl0ZUNvdW50KTtcclxuICAgICAgICBsZXQgYnVmZmVyID0gdGhpcy51bml0eUFwaS5fbWFsbG9jKGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgYnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICByZXR1cm4gYnVmZmVyO1xyXG4gICAgfVxyXG4gICAgSlNTdHJpbmdUb1RlbXBDU1N0cmluZyhyZXR1cm5TdHIsIC8qKiBvdXQgaW50ICovIGxlbmd0aE9mZnNldCkge1xyXG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xyXG4gICAgICAgIHNldE91dFZhbHVlMzIodGhpcywgbGVuZ3RoT2Zmc2V0LCBieXRlQ291bnQpO1xyXG4gICAgICAgIGlmICh0aGlzLnN0cmluZ0J1ZmZlclNpemUgPCBieXRlQ291bnQgKyAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMudW5pdHlBcGkuX2ZyZWUodGhpcy5zdHJCdWZmZXIpO1xyXG4gICAgICAgICAgICB0aGlzLnN0ckJ1ZmZlciA9IHRoaXMudW5pdHlBcGkuX21hbGxvYyh0aGlzLnN0cmluZ0J1ZmZlclNpemUgPSBNYXRoLm1heCgyICogdGhpcy5zdHJpbmdCdWZmZXJTaXplLCBieXRlQ291bnQgKyAxKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgdGhpcy5zdHJCdWZmZXIsIGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0ckJ1ZmZlcjtcclxuICAgIH1cclxuICAgIEpTU3RyaW5nVG9DU1N0cmluZ09uU3RhY2socmV0dXJuU3RyLCAvKiogb3V0IGludCAqLyBsZW5ndGhPZmZzZXQpIHtcclxuICAgICAgICBpZiAocmV0dXJuU3RyID09PSBudWxsIHx8IHJldHVyblN0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnl0ZUNvdW50ID0gdGhpcy51bml0eUFwaS5sZW5ndGhCeXRlc1VURjgocmV0dXJuU3RyKTtcclxuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aE9mZnNldCwgYnl0ZUNvdW50KTtcclxuICAgICAgICB2YXIgYnVmZmVyID0gdGhpcy51bml0eUFwaS5zdGFja0FsbG9jKGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgYnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICByZXR1cm4gYnVmZmVyO1xyXG4gICAgfVxyXG4gICAgbWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgZnVuY3Rpb25QdHIsIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgLy8g5LiN6IO955So566t5aS05Ye95pWw77yB5q2k5aSE6L+U5Zue55qE5Ye95pWw5Lya6LWL5YC85Yiw5YW35L2T55qEY2xhc3PkuIrvvIzlhbZ0aGlz5oyH6ZKI5pyJ5ZCr5LmJ44CCXHJcbiAgICAgICAgY29uc3QgZW5naW5lID0gdGhpcztcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcclxuICAgICAgICAgICAgaWYgKG5ldy50YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignXCJub3QgYSBjb25zdHJ1Y3RvcicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBjYWxsYmFja0luZm9QdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmNhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBcclxuICAgICAgICAgICAgICAgIC8vIGdldEludFB0ck1hbmFnZXIoKS5HZXRQb2ludGVyRm9ySlNWYWx1ZSh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGlzU3RhdGljID8gMCA6IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdCh0aGlzKSwgY2FsbGJhY2tJbmZvUHRyLCBhcmdzLmxlbmd0aCwgY2FsbGJhY2tJZHgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0UmV0dXJuVmFsdWVBbmRSZWN5Y2xlKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBjYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5fQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHNlbGZQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbiAgICBjYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudW5pdHlBcGkuX0NhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLl9DYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5QdWVydHNKU0VuZ2luZSA9IFB1ZXJ0c0pTRW5naW5lO1xyXG5mdW5jdGlvbiBHZXRUeXBlKGVuZ2luZSwgdmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIDE7XHJcbiAgICB9XHJcbiAgICBpZiAoaXNCaWdJbnQodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIDI7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInKSB7XHJcbiAgICAgICAgcmV0dXJuIDQ7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgcmV0dXJuIDg7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xyXG4gICAgICAgIHJldHVybiAxNjtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHJldHVybiAyNTY7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIDUxMjtcclxuICAgIH1cclxuICAgIC8vIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7IHJldHVybiAxMjggfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICByZXR1cm4gNjQ7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCB2YWx1ZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgIH1cclxuICAgIGlmIChlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIDMyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDY0O1xyXG59XHJcbmV4cG9ydHMuR2V0VHlwZSA9IEdldFR5cGU7XHJcbmZ1bmN0aW9uIG1ha2VCaWdJbnQobG93LCBoaWdoKSB7XHJcbiAgICByZXR1cm4gKEJpZ0ludChoaWdoKSA8PCAzMm4pIHwgQmlnSW50KGxvdyA+Pj4gMCk7XHJcbn1cclxuZXhwb3J0cy5tYWtlQmlnSW50ID0gbWFrZUJpZ0ludDtcclxuZnVuY3Rpb24gc2V0T3V0VmFsdWUzMihlbmdpbmUsIHZhbHVlUHRyLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMlt2YWx1ZVB0ciA+PiAyXSA9IHZhbHVlO1xyXG59XHJcbmV4cG9ydHMuc2V0T3V0VmFsdWUzMiA9IHNldE91dFZhbHVlMzI7XHJcbmZ1bmN0aW9uIHNldE91dFZhbHVlOChlbmdpbmUsIHZhbHVlUHRyLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4W3ZhbHVlUHRyXSA9IHZhbHVlO1xyXG59XHJcbmV4cG9ydHMuc2V0T3V0VmFsdWU4ID0gc2V0T3V0VmFsdWU4O1xyXG5mdW5jdGlvbiBpc0JpZ0ludCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQmlnSW50IHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2JpZ2ludCc7XHJcbn1cclxuZXhwb3J0cy5pc0JpZ0ludCA9IGlzQmlnSW50O1xyXG5mdW5jdGlvbiByZXR1cm5CaWdJbnQoZW5naW5lLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLl9zZXRUZW1wUmV0MChOdW1iZXIodmFsdWUgPj4gMzJuKSk7IC8vIGhpZ2hcclxuICAgIHJldHVybiBOdW1iZXIodmFsdWUgJiAweGZmZmZmZmZmbik7IC8vIGxvd1xyXG59XHJcbmV4cG9ydHMucmV0dXJuQmlnSW50ID0gcmV0dXJuQmlnSW50O1xyXG5mdW5jdGlvbiB3cml0ZUJpZ0ludChlbmdpbmUsIHB0ckluMzIsIHZhbHVlKSB7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdID0gTnVtYmVyKHZhbHVlICYgMHhmZmZmZmZmZm4pOyAvLyBsb3dcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMiArIDFdID0gTnVtYmVyKHZhbHVlID4+IDMybik7IC8vIGhpZ2hcclxufVxyXG5jb25zdCB0bXBJbnQzQXJyID0gbmV3IEludDMyQXJyYXkoMik7XHJcbmNvbnN0IHRtcEZsb2F0NjRBcnIgPSBuZXcgRmxvYXQ2NEFycmF5KHRtcEludDNBcnIuYnVmZmVyKTtcclxuZnVuY3Rpb24gd3JpdGVOdW1iZXIoZW5naW5lLCBwdHJJbjMyLCB2YWx1ZSkge1xyXG4gICAgLy8gbnVtYmVyIGluIGpzIGlzIGRvdWJsZVxyXG4gICAgdG1wRmxvYXQ2NEFyclswXSA9IHZhbHVlO1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXSA9IHRtcEludDNBcnJbMF07XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzIgKyAxXSA9IHRtcEludDNBcnJbMV07XHJcbn1cclxuZnVuY3Rpb24gJEZpbGxBcmd1bWVudEZpbmFsTnVtYmVyVmFsdWUoZW5naW5lLCB2YWwsIGpzVmFsdWVUeXBlLCB2YWxQdHJJbjMyKSB7XHJcbiAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgc3dpdGNoIChqc1ZhbHVlVHlwZSkge1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgd3JpdGVCaWdJbnQoZW5naW5lLCB2YWxQdHJJbjMyLCB2YWwpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgIHdyaXRlTnVtYmVyKGVuZ2luZSwgdmFsUHRySW4zMiwgK3ZhbCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNTEyOlxyXG4gICAgICAgICAgICB3cml0ZU51bWJlcihlbmdpbmUsIHZhbFB0ckluMzIsIHZhbC5nZXRUaW1lKCkpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKGVuZ2luZSwgdmFsLCBqc1ZhbHVlVHlwZSwgbGVuZ3RoT2Zmc2V0KSB7XHJcbiAgICBpZiAoIWpzVmFsdWVUeXBlKVxyXG4gICAgICAgIGpzVmFsdWVUeXBlID0gR2V0VHlwZShlbmdpbmUsIHZhbCk7XHJcbiAgICBzd2l0Y2ggKGpzVmFsdWVUeXBlKSB7XHJcbiAgICAgICAgY2FzZSA4OiByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZ09uU3RhY2sodmFsLCBsZW5ndGhPZmZzZXQpO1xyXG4gICAgICAgIGNhc2UgMTY6IHJldHVybiArdmFsO1xyXG4gICAgICAgIGNhc2UgMzI6IHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodmFsKTtcclxuICAgICAgICBjYXNlIDY0OiByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KHZhbCkuaWQ7XHJcbiAgICAgICAgY2FzZSAxMjg6IHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3QodmFsKS5pZDtcclxuICAgICAgICBjYXNlIDI1NjogcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKHZhbCkuaWQ7XHJcbiAgICAgICAgY2FzZSAxMDI0OiB7XHJcbiAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcilcclxuICAgICAgICAgICAgICAgIHZhbCA9IG5ldyBVaW50OEFycmF5KHZhbCk7XHJcbiAgICAgICAgICAgIGxldCBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyh2YWwuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQVTguc2V0KHZhbCwgcHRyKTtcclxuICAgICAgICAgICAgc2V0T3V0VmFsdWUzMihlbmdpbmUsIGxlbmd0aE9mZnNldCwgdmFsLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICByZXR1cm4gcHRyO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1saWJyYXJ5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0TnVtYmVyRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBudW1iZXIge1xyXG4vLyAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldERhdGVGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IG51bWJlciB7XHJcbi8vICAgICByZXR1cm4gKGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSkgYXMgRGF0ZSkuZ2V0VGltZSgpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRTdHJpbmdGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgLypvdXQgaW50ICovbGVuZ3RoT2Zmc2V0OiBudW1iZXIsIGlzQnlSZWY6IGJvb2wpOiBudW1iZXIge1xyXG4vLyAgICAgdmFyIHJldHVyblN0ciA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxzdHJpbmc+KHZhbHVlKTtcclxuLy8gICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgbGVuZ3RoT2Zmc2V0KTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0Qm9vbGVhbkZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogYm9vbGVhbiB7XHJcbi8vICAgICByZXR1cm4gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gVmFsdWVJc0JpZ0ludChlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogYm9vbGVhbiB7XHJcbi8vICAgICB2YXIgYmlnaW50ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPGFueT4odmFsdWUpO1xyXG4vLyAgICAgcmV0dXJuIGJpZ2ludCBpbnN0YW5jZW9mIEJpZ0ludDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0QmlnSW50RnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcclxuLy8gICAgIHZhciBiaWdpbnQgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8YW55Pih2YWx1ZSk7XHJcbi8vICAgICByZXR1cm4gYmlnaW50O1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRPYmplY3RGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4vLyAgICAgdmFyIG5hdGl2ZU9iamVjdCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbi8vICAgICByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KG5hdGl2ZU9iamVjdCk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEZ1bmN0aW9uRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBKU0Z1bmN0aW9uUHRyIHtcclxuLy8gICAgIHZhciBmdW5jID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPCguLi5hcmdzOiBhbnlbXSkgPT4gYW55Pih2YWx1ZSk7XHJcbi8vICAgICB2YXIganNmdW5jID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuYyk7XHJcbi8vICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRKU09iamVjdEZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XHJcbi8vICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPCguLi5hcmdzOiBhbnlbXSkgPT4gYW55Pih2YWx1ZSk7XHJcbi8vICAgICB2YXIganNvYmogPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3Qob2JqKTtcclxuLy8gICAgIHJldHVybiBqc29iai5pZDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgLypvdXQgaW50ICovbGVuZ3RoT2Zmc2V0OiBhbnksIGlzT3V0OiBib29sKSB7XHJcbi8vICAgICB2YXIgYWIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8QXJyYXlCdWZmZXI+KHZhbHVlKTtcclxuLy8gICAgIGlmIChhYiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuLy8gICAgICAgICBhYiA9IGFiLmJ1ZmZlcjtcclxuLy8gICAgIH1cclxuLy8gICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcclxuLy8gICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XHJcbi8vICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW2xlbmd0aE9mZnNldCA+PiAyXSA9IGFiLmJ5dGVMZW5ndGg7XHJcbi8vICAgICBzZXRPdXRWYWx1ZTMyKGVuZ2luZSwgbGVuZ3RoT2Zmc2V0LCBhYi5ieXRlTGVuZ3RoKTtcclxuLy8gICAgIHJldHVybiBwdHI7XHJcbi8vIH1cclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEpT6LCD55SoQyPml7bvvIxDI+S+p+iOt+WPlkpT6LCD55So5Y+C5pWw55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU0FyZ3VtZW50QVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAvKioqKioqKioqKirov5npg6jliIbnjrDlnKjpg73mmK9DKyvlrp7njrDnmoQqKioqKioqKioqKiovXHJcbiAgICAgICAgLy8gR2V0TnVtYmVyRnJvbVZhbHVlOiBHZXROdW1iZXJGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldERhdGVGcm9tVmFsdWU6IEdldERhdGVGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldFN0cmluZ0Zyb21WYWx1ZTogR2V0U3RyaW5nRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRCb29sZWFuRnJvbVZhbHVlOiBHZXRCb29sZWFuRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBWYWx1ZUlzQmlnSW50OiBWYWx1ZUlzQmlnSW50LmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRCaWdJbnRGcm9tVmFsdWU6IEdldEJpZ0ludEZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0T2JqZWN0RnJvbVZhbHVlOiBHZXRPYmplY3RGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEZ1bmN0aW9uRnJvbVZhbHVlOiBHZXRGdW5jdGlvbkZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0SlNPYmplY3RGcm9tVmFsdWU6IEdldEpTT2JqZWN0RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRBcnJheUJ1ZmZlckZyb21WYWx1ZTogR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEFyZ3VtZW50VHlwZTogZnVuY3Rpb24gKGlzb2xhdGU6IEludFB0ciwgaW5mbzogTW9ja0ludFB0ciwgaW5kZXg6IGludCwgaXNCeVJlZjogYm9vbCkge1xyXG4gICAgICAgIC8vICAgICB2YXIgdmFsdWUgPSBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvLCBlbmdpbmUpLmFyZ3NbaW5kZXhdO1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gR2V0VHlwZShlbmdpbmUsIHZhbHVlKTtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIC8vIC8qKlxyXG4gICAgICAgIC8vICAqIOS4umMj5L6n5o+Q5L6b5LiA5Liq6I635Y+WY2FsbGJhY2tpbmZv6YeManN2YWx1ZeeahGludHB0cueahOaOpeWPo1xyXG4gICAgICAgIC8vICAqIOW5tuS4jeaYr+W+l+eahOWIsOi/meS4qmFyZ3VtZW5055qE5YC8XHJcbiAgICAgICAgLy8gICpcclxuICAgICAgICAvLyAgKiDor6XmjqXlj6Plj6rmnInkvY3ov5DnrpfvvIznlLFDKyvlrp7njrBcclxuICAgICAgICAvLyAgKi9cclxuICAgICAgICAvLyBHZXRBcmd1bWVudFZhbHVlLyppbkNhbGxiYWNrSW5mbyovOiBmdW5jdGlvbiAoaW5mb3B0cjogTW9ja0ludFB0ciwgaW5kZXg6IGludCkge1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gaW5mb3B0ciB8IGluZGV4O1xyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgICAgLy8gR2V0SnNWYWx1ZVR5cGU6IGZ1bmN0aW9uIChpc29sYXRlOiBJbnRQdHIsIHZhbDogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4gICAgICAgIC8vICAgICAvLyBwdWJsaWMgZW51bSBKc1ZhbHVlVHlwZVxyXG4gICAgICAgIC8vICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIC8vICAgICBOdWxsT3JVbmRlZmluZWQgPSAxLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQmlnSW50ID0gMixcclxuICAgICAgICAvLyAgICAgLy8gICAgIE51bWJlciA9IDQsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBTdHJpbmcgPSA4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQm9vbGVhbiA9IDE2LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgTmF0aXZlT2JqZWN0ID0gMzIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBKc09iamVjdCA9IDY0LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQXJyYXkgPSAxMjgsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBGdW5jdGlvbiA9IDI1NixcclxuICAgICAgICAvLyAgICAgLy8gICAgIERhdGUgPSA1MTIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBBcnJheUJ1ZmZlciA9IDEwMjQsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBVbmtub3cgPSAyMDQ4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQW55ID0gTnVsbE9yVW5kZWZpbmVkIHwgQmlnSW50IHwgTnVtYmVyIHwgU3RyaW5nIHwgQm9vbGVhbiB8IE5hdGl2ZU9iamVjdCB8IEFycmF5IHwgRnVuY3Rpb24gfCBEYXRlIHwgQXJyYXlCdWZmZXIsXHJcbiAgICAgICAgLy8gICAgIC8vIH07XHJcbiAgICAgICAgLy8gICAgIHZhciB2YWx1ZTogYW55ID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsLCBlbmdpbmUpO1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gR2V0VHlwZShlbmdpbmUsIHZhbHVlKTtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIC8qKioqKioqKioqKuS7peS4iueOsOWcqOmDveaYr0MrK+WunueOsOeahCoqKioqKioqKioqKi9cclxuICAgICAgICBHZXRUeXBlSWRGcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgaWYgKGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIG9iaiA9IG9ialswXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgdHlwZWlkID0gMDtcclxuICAgICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSBvYmouX2Z1bmNbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gb2JqW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZmluZCB0eXBlaWQgZm9yJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU0FyZ3VtZW50QVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1nZXRGcm9tSlNBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEMj6LCD55SoSlPml7bvvIzojrflj5ZKU+WHveaVsOi/lOWbnuWAvFxyXG4gKlxyXG4gKiDljp/mnInnmoRyZXN1bHRJbmZv6K6+6K6h5Ye65p2l5Y+q5piv5Li65LqG6K6p5aSaaXNvbGF0ZeaXtuiDveWcqOS4jeWQjOeahGlzb2xhdGXph4zkv53mjIHkuI3lkIznmoRyZXN1bHRcclxuICog5ZyoV2ViR0zmqKHlvI/kuIvmsqHmnInov5nkuKrng6bmgbzvvIzlm6DmraTnm7TmjqXnlKhlbmdpbmXnmoTljbPlj69cclxuICogcmVzdWx0SW5mb+WbuuWumuS4ujEwMjRcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kR2V0RnJvbUpTUmV0dXJuQVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBHZXROdW1iZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldERhdGVGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdC5nZXRUaW1lKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRTdHJpbmdGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9UZW1wQ1NTdHJpbmcoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCwgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEJvb2xlYW5Gcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlc3VsdElzQmlnSW50OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gKDAsIGxpYnJhcnlfMS5pc0JpZ0ludCkoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRCaWdJbnRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICAvLyBwdWVydHMgY29yZSB2Mi4wLjTlvIDlp4vmlK/mjIFcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEucmV0dXJuQmlnSW50KShlbmdpbmUsIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0T2JqZWN0RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldFR5cGVJZEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gdmFsdWUuX2Z1bmNbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gdmFsdWVbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdHlwZWlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBmaW5kIHR5cGVpZCBmb3InICsgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRGdW5jdGlvbkZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRKU09iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBqc29iaiA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3QoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc29iai5pZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEFycmF5QnVmZmVyRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGFiID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICAgICAgdmFyIHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKGFiLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDguc2V0KG5ldyBJbnQ4QXJyYXkoYWIpLCBwdHIpO1xyXG4gICAgICAgICAgICAoMCwgbGlicmFyeV8xLnNldE91dFZhbHVlMzIpKGVuZ2luZSwgbGVuZ3RoLCBhYi5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHB0cjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8v5L+d5a6I5pa55qGIXHJcbiAgICAgICAgR2V0UmVzdWx0VHlwZTogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuR2V0VHlwZSkoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kR2V0RnJvbUpTUmV0dXJuQVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1nZXRGcm9tSlNSZXR1cm4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiDms6jlhoznsbtBUEnvvIzlpoLms6jlhozlhajlsYDlh73mlbDjgIHms6jlhoznsbvvvIzku6Xlj4rnsbvnmoTlsZ7mgKfmlrnms5XnrYlcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEkoZW5naW5lKSB7XHJcbiAgICBjb25zdCByZXR1cm5lZSA9IHtcclxuICAgICAgICBTZXRHbG9iYWxGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIG5hbWVTdHJpbmcsIHY4RnVuY3Rpb25DYWxsYmFjaywganNFbnZJZHgsIGNhbGxiYWNraWR4KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICBsaWJyYXJ5XzEuZ2xvYmFsW25hbWVdID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24odHJ1ZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfUmVnaXN0ZXJDbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwganNFbnZJZHgsIGNhbGxiYWNraWR4LCBzaXplKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxOYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhmdWxsTmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNzaGFycE9iamVjdE1hcCA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXA7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICBsZXQgdGVtcEV4dGVybmFsQ1NJRCA9IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IGN0b3IgPSBmdW5jdGlvbiBOYXRpdmVPYmplY3QoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDorr7nva7nsbvlnotJRFxyXG4gICAgICAgICAgICAgICAgdGhpc1tcIiRjaWRcIl0gPSBpZDtcclxuICAgICAgICAgICAgICAgIC8vIG5hdGl2ZU9iamVjdOeahOaehOmAoOWHveaVsFxyXG4gICAgICAgICAgICAgICAgLy8g5p6E6YCg5Ye95pWw5pyJ5Lik5Liq6LCD55So55qE5Zyw5pa577yaMS4ganPkvqduZXfkuIDkuKrlroPnmoTml7blgJkgMi4gY3PkvqfliJvlu7rkuobkuIDkuKrlr7nosaHopoHkvKDliLBqc+S+p+aXtlxyXG4gICAgICAgICAgICAgICAgLy8g56ys5LiA5Liq5oOF5Ya177yMY3Plr7nosaFJROaIluiAheaYr2NhbGxWOENvbnN0cnVjdG9yQ2FsbGJhY2vov5Tlm57nmoTjgIJcclxuICAgICAgICAgICAgICAgIC8vIOesrOS6jOS4quaDheWGte+8jOWImWNz5a+56LGhSUTmmK9jcyBuZXflrozkuYvlkI7kuIDlubbkvKDnu5lqc+eahOOAglxyXG4gICAgICAgICAgICAgICAgbGV0IGNzSUQgPSB0ZW1wRXh0ZXJuYWxDU0lEOyAvLyDlpoLmnpzmmK/nrKzkuozkuKrmg4XlhrXvvIzmraRJROeUsWNyZWF0ZUZyb21DU+iuvue9rlxyXG4gICAgICAgICAgICAgICAgdGVtcEV4dGVybmFsQ1NJRCA9IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3NJRCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb1B0ciA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0TW9ja1BvaW50ZXIoYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6Jm954S2cHVlcnRz5YaFQ29uc3RydWN0b3LnmoTov5Tlm57lgLzlj6tzZWxm77yM5L2G5a6D5YW25a6e5bCx5pivQ1Plr7nosaHnmoTkuIDkuKppZOiAjOW3suOAglxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzSUQgPSBlbmdpbmUuY2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2soY29uc3RydWN0b3IsIGNhbGxiYWNrSW5mb1B0ciwgYXJncy5sZW5ndGgsIGNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5SZWxlYXNlQnlNb2NrSW50UHRyKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gYmxpdHRhYmxlXHJcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjc05ld0lEID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2Moc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLm1lbWNweShjc05ld0lELCBjc0lELCBzaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuYWRkKGNzTmV3SUQsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICgwLCBsaWJyYXJ5XzEuT25GaW5hbGl6ZSkodGhpcywgY3NOZXdJRCwgKGNzSWRlbnRpZmllcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAucmVtb3ZlKGNzSWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5fZnJlZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc0lELCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzSUQsIChjc0lkZW50aWZpZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLnJlbW92ZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhkZXN0cnVjdG9yIHx8IGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciwgY3NJZGVudGlmaWVyLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGN0b3IuY3JlYXRlRnJvbUNTID0gZnVuY3Rpb24gKGNzSUQpIHtcclxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSBjc0lEO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGN0b3IuX19wdWVydHNNZXRhZGF0YSA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwibmFtZVwiLCB7IHZhbHVlOiBmdWxsTmFtZSArIFwiQ29uc3RydWN0b3JcIiB9KTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwiJGNpZFwiLCB7IHZhbHVlOiBpZCB9KTtcclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMucHVzaChjdG9yKTtcclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzSURXZWFrTWFwLnNldChjdG9yLCBpZCk7XHJcbiAgICAgICAgICAgIGlmIChCYXNlVHlwZUlkID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY3Rvci5wcm90b3R5cGUuX19wcm90b19fID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbQmFzZVR5cGVJZF0ucHJvdG90eXBlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5uYW1lc1RvQ2xhc3Nlc0lEW2Z1bGxOYW1lXSA9IGlkO1xyXG4gICAgICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZWdpc3RlclN0cnVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCwgc2l6ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuZWUuX1JlZ2lzdGVyQ2xhc3MoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCBjYWxsYmFja2lkeCwgY2FsbGJhY2tpZHgsIHNpemUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBjYWxsYmFjaywgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCkge1xyXG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgICAgICBpZiAoIWNscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBmbiA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBjYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgaWYgKGlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICBjbHNbbmFtZV0gPSBmbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNscy5wcm90b3R5cGVbbmFtZV0gPSBmbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJQcm9wZXJ0eTogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBnZXR0ZXIsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBnZXR0ZXJqc0VudklkeCwgXHJcbiAgICAgICAgLypsb25nICovIGdldHRlcmNhbGxiYWNraWR4LCBzZXR0ZXIsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJqc0VudklkeCwgXHJcbiAgICAgICAgLypsb25nICovIHNldHRlcmNhbGxiYWNraWR4LCBkb250RGVsZXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBjbHMgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbY2xhc3NJRF07XHJcbiAgICAgICAgICAgIGlmICghY2xzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIHZhciBhdHRyID0ge1xyXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiAhZG9udERlbGV0ZSxcclxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChnZXR0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGF0dHIuZ2V0ID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGdldHRlciwgZ2V0dGVyY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzZXR0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGF0dHIuc2V0ID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIHNldHRlciwgc2V0dGVyY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscywgbmFtZSwgYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xzLnByb3RvdHlwZSwgbmFtZSwgYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgfTtcclxuICAgIHJldHVybiByZXR1cm5lZTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRSZWdpc3RlckFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmVnaXN0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBDI+iwg+eUqEpT5pe277yM6K6+572u6LCD55So5Y+C5pWw55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSW52b2tlSlNBcmd1bWVudEFwaShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgLy9iZWdpbiBjcyBjYWxsIGpzXHJcbiAgICAgICAgUHVzaE51bGxGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChudWxsKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hEYXRlRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgZGF0ZVZhbHVlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChuZXcgRGF0ZShkYXRlVmFsdWUpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hCb29sZWFuRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgYikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goISFiKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hCaWdJbnRGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKmxvbmcgKi8gbG9uZ2xvdywgbG9uZ2hpZ2gpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKCgwLCBsaWJyYXJ5XzEubWFrZUJpZ0ludCkobG9uZ2xvdywgbG9uZ2hpZ2gpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hTdHJpbmdGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoTnVtYmVyRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgZCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgY2xhc3NJRCwgb2JqZWN0SUQpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KG9iamVjdElELCBjbGFzc0lEKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoSlNGdW5jdGlvbkZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIEpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKEpTRnVuY3Rpb24pLl9mdW5jKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hKU09iamVjdEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIEpTT2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU09iamVjdEJ5SWQoSlNPYmplY3QpLmdldE9iamVjdCgpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hBcnJheUJ1ZmZlckZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qYnl0ZVtdICovIGluZGV4LCBsZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0ludm9rZUpTQXJndW1lbnRBcGk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSW52b2tlSlNBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEpT6LCD55SoQyPml7bvvIxDI+iuvue9rui/lOWbnuWIsEpT55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSlNJbnZva2VSZXR1cm5BcGkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIFJldHVybkNsYXNzOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgY2xhc3NJRCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbY2xhc3NJRF07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5PYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBjbGFzc0lELCBzZWxmKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KHNlbGYsIGNsYXNzSUQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuTnVtYmVyOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG51bWJlcjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVyblN0cmluZzogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHN0clN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCBzdHIgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZyk7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IHN0cjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkJpZ0ludDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGxvbmdMb3csIGxvbmdIaWdoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9ICgwLCBsaWJyYXJ5XzEubWFrZUJpZ0ludCkobG9uZ0xvdywgbG9uZ0hpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQm9vbGVhbjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gISFiOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuRGF0ZTogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGRhdGUpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5OdWxsOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbykge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBudWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBKU0Z1bmN0aW9uUHRyKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzRnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKEpTRnVuY3Rpb25QdHIpO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBqc0Z1bmMuX2Z1bmM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5KU09iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIEpTT2JqZWN0UHRyKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzT2JqZWN0ID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNPYmplY3RCeUlkKEpTT2JqZWN0UHRyKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0ganNPYmplY3QuZ2V0T2JqZWN0KCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5DU2hhcnBGdW5jdGlvbkNhbGxiYWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgdjhGdW5jdGlvbkNhbGxiYWNrLCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckxvdywgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJIaWdoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGZhbHNlLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIHBvaW50ZXJIaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkNTaGFycEZ1bmN0aW9uQ2FsbGJhY2syOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgdjhGdW5jdGlvbkNhbGxiYWNrLCBKc0Z1bmN0aW9uRmluYWxpemUsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVyTG93LCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckhpZ2gpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oZmFsc2UsIHY4RnVuY3Rpb25DYWxsYmFjaywgcG9pbnRlckhpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQXJyYXlCdWZmZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCAvKmJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0pTSW52b2tlUmV0dXJuQXBpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0pTSW52b2tlUmV0dXJuLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogSlPosIPnlKhDI+aXtu+8jEMj5L6n6K6+572ub3V05Y+C5pWw5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgU2V0TnVtYmVyVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBudW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG51bWJlcjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldERhdGVUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGRhdGUpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0U3RyaW5nVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gc3RyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0Qm9vbGVhblRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgYikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gISFiOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0QmlnSW50VG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBsb3csIGhpZ2gpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb3csIGhpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0T2JqZWN0VG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBjbGFzc0lELCBzZWxmKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChzZWxmLCBjbGFzc0lEKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldE51bGxUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG51bGw7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRBcnJheUJ1ZmZlclRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgLypCeXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9KU091dEFyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuV2ViR0xSZWdzdGVyQXBpID0gZXhwb3J0cy5HZXRXZWJHTEZGSUFwaSA9IHZvaWQgMDtcclxuY29uc3QgQnVmZmVyID0gcmVxdWlyZShcIi4vYnVmZmVyXCIpO1xyXG52YXIgSlNUYWc7XHJcbihmdW5jdGlvbiAoSlNUYWcpIHtcclxuICAgIC8qIGFsbCB0YWdzIHdpdGggYSByZWZlcmVuY2UgY291bnQgYXJlIG5lZ2F0aXZlICovXHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19GSVJTVFwiXSA9IC05XSA9IFwiSlNfVEFHX0ZJUlNUXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19TVFJJTkdcIl0gPSAtOV0gPSBcIkpTX1RBR19TVFJJTkdcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0JVRkZFUlwiXSA9IC04XSA9IFwiSlNfVEFHX0JVRkZFUlwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfRVhDRVBUSU9OXCJdID0gLTddID0gXCJKU19UQUdfRVhDRVBUSU9OXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19BUlJBWVwiXSA9IC0zXSA9IFwiSlNfVEFHX0FSUkFZXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19GVU5DVElPTlwiXSA9IC0yXSA9IFwiSlNfVEFHX0ZVTkNUSU9OXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19PQkpFQ1RcIl0gPSAtMV0gPSBcIkpTX1RBR19PQkpFQ1RcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0lOVFwiXSA9IDBdID0gXCJKU19UQUdfSU5UXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19CT09MXCJdID0gMV0gPSBcIkpTX1RBR19CT09MXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19OVUxMXCJdID0gMl0gPSBcIkpTX1RBR19OVUxMXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19VTkRFRklORURcIl0gPSAzXSA9IFwiSlNfVEFHX1VOREVGSU5FRFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfVU5JTklUSUFMSVpFRFwiXSA9IDRdID0gXCJKU19UQUdfVU5JTklUSUFMSVpFRFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfRkxPQVQ2NFwiXSA9IDVdID0gXCJKU19UQUdfRkxPQVQ2NFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfSU5UNjRcIl0gPSA2XSA9IFwiSlNfVEFHX0lOVDY0XCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19VSU5UNjRcIl0gPSA3XSA9IFwiSlNfVEFHX1VJTlQ2NFwiO1xyXG59KShKU1RhZyB8fCAoSlNUYWcgPSB7fSkpO1xyXG5sZXQgY2xhc3Nfbm90X2ZvdW5kX2NhbGxiYWNrID0gdW5kZWZpbmVkO1xyXG5jbGFzcyBTY29wZSB7XHJcbiAgICBzdGF0aWMgY3VycmVudCA9IHVuZGVmaW5lZDtcclxuICAgIHN0YXRpYyBnZXRDdXJyZW50KCkge1xyXG4gICAgICAgIHJldHVybiBTY29wZS5jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGVudGVyKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgU2NvcGUoKTtcclxuICAgIH1cclxuICAgIHN0YXRpYyBleGl0KCkge1xyXG4gICAgICAgIFNjb3BlLmN1cnJlbnQuY2xvc2UoKTtcclxuICAgIH1cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMucHJldlNjb3BlID0gU2NvcGUuY3VycmVudDtcclxuICAgICAgICBTY29wZS5jdXJyZW50ID0gdGhpcztcclxuICAgIH1cclxuICAgIGNsb3NlKCkge1xyXG4gICAgICAgIFNjb3BlLmN1cnJlbnQgPSB0aGlzLnByZXZTY29wZTtcclxuICAgIH1cclxuICAgIGFkZFRvU2NvcGUob2JqKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RzSW5TY29wZS5wdXNoKG9iaik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGUubGVuZ3RoIC0gMTtcclxuICAgIH1cclxuICAgIGdldEZyb21TY29wZShpbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdHNJblNjb3BlW2luZGV4XTtcclxuICAgIH1cclxuICAgIHRvSnMoZW5naW5lLCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCB2YWxUeXBlID0gQnVmZmVyLnJlYWRJbnQzMihlbmdpbmUudW5pdHlBcGkuSEVBUFU4LCBwdmFsdWUgKyA4KTtcclxuICAgICAgICBpZiAodmFsVHlwZSA8PSBKU1RhZy5KU19UQUdfT0JKRUNUICYmIHZhbFR5cGUgPj0gSlNUYWcuSlNfVEFHX0FSUkFZKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9iaklkeCA9IEJ1ZmZlci5yZWFkSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGVbb2JqSWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3dpdGNoICh2YWxUeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0JPT0w6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRJbnQzMihlbmdpbmUudW5pdHlBcGkuSEVBUFU4LCBwdmFsdWUpICE9IDA7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0lOVDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZEludDMyKGVuZ2luZS51bml0eUFwaS5IRUFQVTgsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX05VTEw6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfRkxPQVQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZERvdWJsZShlbmdpbmUudW5pdHlBcGkuSEVBUFU4LCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19JTlQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZEludDY0KGVuZ2luZS51bml0eUFwaS5IRUFQVTgsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX1VJTlQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZFVJbnQ2NChlbmdpbmUudW5pdHlBcGkuSEVBUFU4LCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19TVFJJTkc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19CVUZGRVI6XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmU3RhcnQgPSBCdWZmZXIucmVhZEludDMyKGVuZ2luZS51bml0eUFwaS5IRUFQVTgsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmTGVuID0gQnVmZmVyLnJlYWRJbnQzMihlbmdpbmUudW5pdHlBcGkuSEVBUFU4LCBwdmFsdWUgKyAxMik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShidWZmU3RhcnQsIGJ1ZmZTdGFydCArIGJ1ZmZMZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHByZXZTY29wZSA9IHVuZGVmaW5lZDtcclxuICAgIG9iamVjdHNJblNjb3BlID0gW107XHJcbn1cclxuZnVuY3Rpb24gbWFrZU5hdGl2ZUZ1bmN0aW9uV3JhcChlbmdpbmUsIGlzU3RhdGljLCBuYXRpdmVfaW1wbCwgZGF0YSwgZmluYWxpemUpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xyXG4gICAgICAgIGlmIChuZXcudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignXCJub3QgYSBjb25zdHJ1Y3RvcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOYXRpdmVGdW5jdGlvbldyYXAgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9O1xyXG59XHJcbmxldCB3ZWJnbEZGSSA9IHVuZGVmaW5lZDtcclxuLy8g6ZyA6KaB5ZyoVW5pdHnph4zosIPnlKhQbGF5ZXJTZXR0aW5ncy5XZWJHTC5lbXNjcmlwdGVuQXJncyA9IFwiIC1zIEFMTE9XX1RBQkxFX0dST1dUSD0xXCI7XHJcbmZ1bmN0aW9uIEdldFdlYkdMRkZJQXBpKGVuZ2luZSkge1xyXG4gICAgaWYgKHdlYmdsRkZJKVxyXG4gICAgICAgIHJldHVybiB3ZWJnbEZGSTtcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLSDlgLzliJvlu7rns7vliJcgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX251bGwoZW52KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV9udWxsIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV91bmRlZmluZWQoZW52KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV91bmRlZmluZWQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2Jvb2xlYW4oZW52LCB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfYm9vbGVhbiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfaW50MzIoZW52LCB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfaW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICAvLyDnsbvkvLzlnLDlpITnkIblhbbku5bln7rnoYDnsbvlnovliJvlu7rlh73mlbBcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfdWludDMyKGVudiwgdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX3VpbnQzMiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfaW50NjQoZW52LCB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfaW50NjQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX3VpbnQ2NChlbnYsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV91aW50NjQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2RvdWJsZShlbnYsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV9kb3VibGUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX3N0cmluZ191dGY4KGVudiwgc3RyLCBsZW5ndGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX3N0cmluZ191dGY4IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9iaW5hcnkoZW52LCBiaW4sIGxlbmd0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfYmluYXJ5IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9hcnJheShlbnYpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2FycmF5IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9vYmplY3QoZW52KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV9vYmplY3Qgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2Z1bmN0aW9uKGVudiwgbmF0aXZlX2ltcGwsIGRhdGEsIGZpbmFsaXplKSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKG1ha2VOYXRpdmVGdW5jdGlvbldyYXAoZW5naW5lLCBmYWxzZSwgbmF0aXZlX2ltcGwsIGRhdGEsIGZpbmFsaXplKSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2NsYXNzKGVudiwgdHlwZV9pZCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfY2xhc3Mgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5YC86I635Y+W57O75YiXIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV9ib29sKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF92YWx1ZV9ib29sIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV9pbnQzMihlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfaW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICAvLyDnsbvkvLzlpITnkIblhbbku5bnsbvlnovojrflj5ZcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfdWludDMyKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF92YWx1ZV91aW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2ludDY0KGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF92YWx1ZV9pbnQ2NCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfdWludDY0KGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF92YWx1ZV91aW50NjQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2RvdWJsZShlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfZG91YmxlIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV9zdHJpbmdfdXRmOChlbnYsIHB2YWx1ZSwgYnVmLCBidWZzaXplKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF92YWx1ZV9zdHJpbmdfdXRmOCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfYmluYXJ5KGVudiwgcHZhbHVlLCBidWZzaXplKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF92YWx1ZV9iaW5hcnkgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X2FycmF5X2xlbmd0aChlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOexu+Wei+ajgOafpeezu+WIlyAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19udWxsKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX251bGwgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfdW5kZWZpbmVkKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX3VuZGVmaW5lZCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19ib29sZWFuKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2Jvb2xlYW4gbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfaW50MzIoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfaW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfdWludDMyKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX3VpbnQzMiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19pbnQ2NChlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19pbnQ2NCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc191aW50NjQoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfdWludDY0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX2RvdWJsZShlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19kb3VibGUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfc3RyaW5nKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX3N0cmluZyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19vYmplY3QoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfb2JqZWN0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX2Z1bmN0aW9uKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2Z1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX2JpbmFyeShlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19iaW5hcnkgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfYXJyYXkoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfYXJyYXkgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5a+56LGh5pON5L2c57O75YiXIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX25hdGl2ZV9vYmplY3RfdG9fdmFsdWUoZW52LCB0eXBlX2lkLCBvYmplY3RfcHRyLCBjYWxsX2ZpbmFsaXplKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX25hdGl2ZV9vYmplY3RfdG9fdmFsdWUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X25hdGl2ZV9vYmplY3RfcHRyKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9uYXRpdmVfb2JqZWN0X3B0ciBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfbmF0aXZlX29iamVjdF90eXBlaWQoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X25hdGl2ZV9vYmplY3RfdHlwZWlkIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX2luc3RhbmNlX29mKGVudiwgdHlwZV9pZCwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2luc3RhbmNlX29mIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOijheeusS/mi4bnrrEgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfYm94aW5nKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2JveGluZyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV91bmJveGluZyhlbnYsIHBfYm94ZWRfdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfdW5ib3hpbmcgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfdXBkYXRlX2JveGVkX3ZhbHVlKGVudiwgcF9ib3hlZF92YWx1ZSwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3VwZGF0ZV9ib3hlZF92YWx1ZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19ib3hlZF92YWx1ZShlbnYsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2JveGVkX3ZhbHVlIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWHveaVsOiwg+eUqOebuOWFsyAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfYXJnc19sZW4ocGluZm8pIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2FyZ3NfbGVuIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9hcmcocGluZm8sIGluZGV4KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9hcmcgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X2VudihwaW5mbykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfZW52IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9uYXRpdmVfaG9sZGVyX3B0cihwaW5mbykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfbmF0aXZlX2hvbGRlcl9wdHIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X2hvbGRlcihwaW5mbykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfaG9sZGVyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF91c2VyZGF0YShwaW5mbykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdXNlcmRhdGEgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfYWRkX3JldHVybihwaW5mbywgdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfYWRkX3JldHVybiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV90aHJvd19ieV9zdHJpbmcocGluZm8sIG1zZykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV90aHJvd19ieV9zdHJpbmcgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g546v5aKD5byV55SoIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9lbnZfcmVmKGVudikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfZW52X3JlZiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9lbnZfcmVmX2lzX3ZhbGlkKHBlbnZfcmVmKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2Vudl9yZWZfaXNfdmFsaWQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X2Vudl9mcm9tX3JlZihwZW52X3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfZW52X2Zyb21fcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2R1cGxpY2F0ZV9lbnZfcmVmKHBlbnZfcmVmKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2R1cGxpY2F0ZV9lbnZfcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3JlbGVhc2VfZW52X3JlZihwZW52X3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9yZWxlYXNlX2Vudl9yZWYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5L2c55So5Z+f566h55CGIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGUocGVudl9yZWYpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50KHBlbnZfcmVmLCBtZW1vcnkpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2hhc19jYXVnaHQocHNjb3BlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2hhc19jYXVnaHQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X2V4Y2VwdGlvbl9hc19zdHJpbmcocHNjb3BlLCB3aXRoX3N0YWNrKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9leGNlcHRpb25fYXNfc3RyaW5nIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2Nsb3NlX3Njb3BlKHBzY29wZSkge1xyXG4gICAgICAgIFNjb3BlLmV4aXQoKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jbG9zZV9zY29wZV9wbGFjZW1lbnQocHNjb3BlKSB7XHJcbiAgICAgICAgU2NvcGUuZXhpdCgpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWAvOW8leeUqCAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmKGVudiwgcHZhbHVlLCBpbnRlcm5hbF9maWVsZF9jb3VudCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2R1cGxpY2F0ZV92YWx1ZV9yZWYocHZhbHVlX3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9kdXBsaWNhdGVfdmFsdWVfcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3JlbGVhc2VfdmFsdWVfcmVmKHB2YWx1ZV9yZWYpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfcmVsZWFzZV92YWx1ZV9yZWYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmKGVudiwgcHZhbHVlX3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfZnJvbV9yZWYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X3JlZl93ZWFrKGVudiwgcHZhbHVlX3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcmVmX3dlYWsgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X293bmVyKGVudiwgcHZhbHVlLCBwb3duZXIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfc2V0X293bmVyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9yZWZfYXNzb2NpYXRlZF9lbnYodmFsdWVfcmVmKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9yZWZfYXNzb2NpYXRlZF9lbnYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3JlZl9pbnRlcm5hbF9maWVsZHMocHZhbHVlX3JlZiwgcGludGVybmFsX2ZpZWxkX2NvdW50KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9yZWZfaW50ZXJuYWxfZmllbGRzIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWxnuaAp+aTjeS9nCAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBrZXkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3Byb3BlcnR5IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9wcm9wZXJ0eShlbnYsIHBvYmplY3QsIHBrZXksIHB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZSwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUsIHB2YWx1ZSk7XHJcbiAgICAgICAgb2JqW2tleV0gPSB2YWx1ZTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfcHJpdmF0ZShlbnYsIHBvYmplY3QsIG91dF9wdHIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ByaXZhdGUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X3ByaXZhdGUoZW52LCBwb2JqZWN0LCBwdHIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfc2V0X3ByaXZhdGUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMihlbnYsIHBvYmplY3QsIGtleSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfcHJvcGVydHlfdWludDMyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9wcm9wZXJ0eV91aW50MzIoZW52LCBwb2JqZWN0LCBrZXksIHB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZSwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLCBwdmFsdWUpO1xyXG4gICAgICAgIG9ialtrZXldID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5Ye95pWw6LCD55SoL+aJp+ihjCAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jYWxsX2Z1bmN0aW9uKGVudiwgcGZ1bmMsIHRoaXNfb2JqZWN0LCBhcmdjLCBhcmd2KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NhbGxfZnVuY3Rpb24gbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZXZhbChlbnYsIGNvZGUsIGNvZGVfc2l6ZSwgcGF0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9ldmFsIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWFqOWxgOWvueixoSAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nbG9iYWwoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGdsb2JhbFRoaXMpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOeOr+Wig+engeacieaVsOaNriAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfZW52X3ByaXZhdGUoZW52KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9lbnZfcHJpdmF0ZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9zZXRfZW52X3ByaXZhdGUoZW52LCBwdHIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfc2V0X2Vudl9wcml2YXRlIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYXBpSW5mbyA9IFtcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfbnVsbCwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfdW5kZWZpbmVkLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9ib29sZWFuLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfaW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV91aW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9pbnQ2NCwgc2lnOiBcImlqaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX3VpbnQ2NCwgc2lnOiBcImlqaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2RvdWJsZSwgc2lnOiBcImlpZFwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX3N0cmluZ191dGY4LCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2JpbmFyeSwgc2lnOiBcImlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9hcnJheSwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfb2JqZWN0LCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9mdW5jdGlvbiwgc2lnOiBcImlpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfY2xhc3MsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV9ib29sLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfaW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV91aW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV9pbnQ2NCwgc2lnOiBcImppaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX3VpbnQ2NCwgc2lnOiBcImppaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX2RvdWJsZSwgc2lnOiBcImRpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX3N0cmluZ191dGY4LCBzaWc6IFwiaWlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV9iaW5hcnksIHNpZzogXCJpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19udWxsLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc191bmRlZmluZWQsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2Jvb2xlYW4sIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2ludDMyLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc191aW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2ludDY0LCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc191aW50NjQsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2RvdWJsZSwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfaXNfc3RyaW5nLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19vYmplY3QsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2Z1bmN0aW9uLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19iaW5hcnksIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2FycmF5LCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9uYXRpdmVfb2JqZWN0X3RvX3ZhbHVlLCBzaWc6IFwiaWlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9uYXRpdmVfb2JqZWN0X3B0ciwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X25hdGl2ZV9vYmplY3RfdHlwZWlkLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19pbnN0YW5jZV9vZiwgc2lnOiBcImlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2JveGluZywgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfdW5ib3hpbmcsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX3VwZGF0ZV9ib3hlZF92YWx1ZSwgc2lnOiBcInZpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2JveGVkX3ZhbHVlLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfYXJnc19sZW4sIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2FyZywgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2Vudiwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfbmF0aXZlX2hvbGRlcl9wdHIsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2hvbGRlciwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdXNlcmRhdGEsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfYWRkX3JldHVybiwgc2lnOiBcInZpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfdGhyb3dfYnlfc3RyaW5nLCBzaWc6IFwidmlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfZW52X3JlZiwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9lbnZfcmVmX2lzX3ZhbGlkLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9lbnZfZnJvbV9yZWYsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZHVwbGljYXRlX2Vudl9yZWYsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfcmVsZWFzZV9lbnZfcmVmLCBzaWc6IFwidmlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX29wZW5fc2NvcGUsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfb3Blbl9zY29wZV9wbGFjZW1lbnQsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2hhc19jYXVnaHQsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2V4Y2VwdGlvbl9hc19zdHJpbmcsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2Nsb3NlX3Njb3BlLCBzaWc6IFwidmlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2Nsb3NlX3Njb3BlX3BsYWNlbWVudCwgc2lnOiBcInZpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZHVwbGljYXRlX3ZhbHVlX3JlZiwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZiwgc2lnOiBcInZpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfZnJvbV9yZWYsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX3NldF9yZWZfd2Vhaywgc2lnOiBcInZpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X293bmVyLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3JlZl9hc3NvY2lhdGVkX2Vudiwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfcmVmX2ludGVybmFsX2ZpZWxkcywgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3Byb3BlcnR5LCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X3Byb3BlcnR5LCBzaWc6IFwidmlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9wcml2YXRlLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X3ByaXZhdGUsIHNpZzogXCJpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfcHJvcGVydHlfdWludDMyLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMiwgc2lnOiBcInZpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jYWxsX2Z1bmN0aW9uLCBzaWc6IFwiaWlpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9ldmFsLCBzaWc6IFwiaWlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dsb2JhbCwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfZW52X3ByaXZhdGUsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X2Vudl9wcml2YXRlLCBzaWc6IFwidmlpXCIgfVxyXG4gICAgXTtcclxuICAgIGNvbnNvbGUubG9nKGBjcmVhdGUgd2ViZ2wgZmZpIGFwaSBjb3VudDogJHthcGlJbmZvLmxlbmd0aH1gKTtcclxuICAgIGNvbnN0IHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKGFwaUluZm8ubGVuZ3RoICogNCk7XHJcbiAgICBjb25zdCBoMzJpbmRleCA9IHB0ciA+PiAyO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcGlJbmZvLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltoMzJpbmRleCArIGldID0gZW5naW5lLnVuaXR5QXBpLmFkZEZ1bmN0aW9uKGFwaUluZm9baV0uZnVuYywgYXBpSW5mb1tpXS5zaWcpO1xyXG4gICAgfVxyXG4gICAgd2ViZ2xGRkkgPSBwdHI7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSW5qZWN0UGFwaUdMTmF0aXZlSW1wbCh3ZWJnbEZGSSk7XHJcbiAgICByZXR1cm4gcHRyO1xyXG59XHJcbmV4cG9ydHMuR2V0V2ViR0xGRklBcGkgPSBHZXRXZWJHTEZGSUFwaTtcclxuZnVuY3Rpb24gV2ViR0xSZWdzdGVyQXBpKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBHZXRSZWdzdGVyQXBpOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVzYXBpX2FsbG9jX3Byb3BlcnR5X2Rlc2NyaXB0b3JzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9hbGxvY19wcm9wZXJ0eV9kZXNjcmlwdG9ycyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlc2FwaV9kZWZpbmVfY2xhc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2RlZmluZV9jbGFzcyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlc2FwaV9nZXRfY2xhc3NfZGF0YTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2NsYXNzX2RhdGEgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXNhcGlfb25fY2xhc3Nfbm90X2ZvdW5kOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY2xhc3Nfbm90X2ZvdW5kX2NhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXNhcGlfc2V0X21ldGhvZF9pbmZvOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfbWV0aG9kX2luZm8gbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXNhcGlfc2V0X3Byb3BlcnR5X2luZm86IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9wcm9wZXJ0eV9pbmZvIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVzYXBpX3RyYWNlX25hdGl2ZV9vYmplY3RfbGlmZWN5Y2xlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV90cmFjZV9uYXRpdmVfb2JqZWN0X2xpZmVjeWNsZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuV2ViR0xSZWdzdGVyQXBpID0gV2ViR0xSZWdzdGVyQXBpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1wZXNhcGlJbXBsLmpzLm1hcCIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbi8qKlxyXG4gKiDmoLnmja4gaHR0cHM6Ly9kb2NzLnVuaXR5M2QuY29tLzIwMTguNC9Eb2N1bWVudGF0aW9uL01hbnVhbC93ZWJnbC1pbnRlcmFjdGluZ3dpdGhicm93c2Vyc2NyaXB0aW5nLmh0bWxcclxuICog5oiR5Lus55qE55uu55qE5bCx5piv5ZyoV2ViR0zmqKHlvI/kuIvvvIzlrp7njrDlkoxwdWVydHMuZGxs55qE5pWI5p6c44CC5YW35L2T5Zyo5LqO5a6e546w5LiA5LiqanNsaWLvvIzph4zpnaLlupTljIXlkKtQdWVydHNETEwuY3PnmoTmiYDmnInmjqXlj6NcclxuICog5a6e6aqM5Y+R546w6L+Z5LiqanNsaWLomb3nhLbkuZ/mmK/ov5DooYzlnKh2OOeahGpz77yM5L2G5a+5ZGV2dG9vbOiwg+ivleW5tuS4jeWPi+Wlve+8jOS4lOWPquaUr+aMgeWIsGVzNeOAglxyXG4gKiDlm6DmraTlupTor6XpgJrov4fkuIDkuKrni6znq4vnmoRqc+WunueOsOaOpeWPo++8jHB1ZXJ0cy5qc2xpYumAmui/h+WFqOWxgOeahOaWueW8j+iwg+eUqOWug+OAglxyXG4gKlxyXG4gKiDmnIDnu4jlvaLmiJDlpoLkuIvmnrbmnoRcclxuICog5Lia5YqhSlMgPC0+IFdBU00gPC0+IHVuaXR5IGpzbGliIDwtPiDmnKxqc1xyXG4gKiDkvYbmlbTmnaHpk77ot6/lhbblrp7pg73lnKjkuIDkuKp2OChqc2NvcmUp6Jma5ouf5py66YeMXHJcbiAqL1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi9saWJyYXJ5XCIpO1xyXG5jb25zdCBnZXRGcm9tSlNBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL2dldEZyb21KU0FyZ3VtZW50XCIpO1xyXG5jb25zdCBnZXRGcm9tSlNSZXR1cm5fMSA9IHJlcXVpcmUoXCIuL21peGlucy9nZXRGcm9tSlNSZXR1cm5cIik7XHJcbmNvbnN0IHJlZ2lzdGVyXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvcmVnaXN0ZXJcIik7XHJcbmNvbnN0IHNldFRvSW52b2tlSlNBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSW52b2tlSlNBcmd1bWVudFwiKTtcclxuY29uc3Qgc2V0VG9KU0ludm9rZVJldHVybl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSlNJbnZva2VSZXR1cm5cIik7XHJcbmNvbnN0IHNldFRvSlNPdXRBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSlNPdXRBcmd1bWVudFwiKTtcclxuY29uc3QgcGVzYXBpSW1wbF8xID0gcmVxdWlyZShcIi4vcGVzYXBpSW1wbFwiKTtcclxubGlicmFyeV8xLmdsb2JhbC53eFJlcXVpcmUgPSBsaWJyYXJ5XzEuZ2xvYmFsLnJlcXVpcmU7XHJcbmxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wgPSB7XHJcbiAgICBpbml0ZWQ6IGZhbHNlLFxyXG4gICAgZGVidWc6IGZhbHNlLFxyXG4gICAgLy8gcHVlcnRz6aaW5qyh5Yid5aeL5YyW5pe25Lya6LCD55So6L+Z6YeM77yM5bm25oqKVW5pdHnnmoTpgJrkv6HmjqXlj6PkvKDlhaVcclxuICAgIEluaXQoY3RvclBhcmFtKSB7XHJcbiAgICAgICAgY29uc3QgZW5naW5lID0gbmV3IGxpYnJhcnlfMS5QdWVydHNKU0VuZ2luZShjdG9yUGFyYW0pO1xyXG4gICAgICAgIGNvbnN0IGV4ZWN1dGVNb2R1bGVDYWNoZSA9IHt9O1xyXG4gICAgICAgIGxldCBqc0VuZ2luZVJldHVybmVkID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IGxvYWRlcjtcclxuICAgICAgICAvLyBQdWVydHNETEznmoTmiYDmnInmjqXlj6Plrp7njrBcclxuICAgICAgICBsaWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMID0gT2JqZWN0LmFzc2lnbihsaWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMLCB7XHJcbiAgICAgICAgICAgIHVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzOiBlbmdpbmUudXBkYXRlR2xvYmFsQnVmZmVyQW5kVmlld3MuYmluZChlbmdpbmUpXHJcbiAgICAgICAgfSwgKDAsIGdldEZyb21KU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIGdldEZyb21KU1JldHVybl8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBzZXRUb0ludm9rZUpTQXJndW1lbnRfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU0ludm9rZVJldHVybl8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBzZXRUb0pTT3V0QXJndW1lbnRfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgcmVnaXN0ZXJfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgcGVzYXBpSW1wbF8xLldlYkdMUmVnc3RlckFwaSkoZW5naW5lKSwge1xyXG4gICAgICAgICAgICAvLyBicmlkZ2VMb2c6IHRydWUsXHJcbiAgICAgICAgICAgIEdldExpYlZlcnNpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAzNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0QXBpTGV2ZWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAzNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0TGliQmFja2VuZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENyZWF0ZUpTRW5naW5lOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoanNFbmdpbmVSZXR1cm5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIm9ubHkgb25lIGF2YWlsYWJsZSBqc0VudiBpcyBhbGxvd2VkIGluIFdlYkdMIG1vZGVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBqc0VuZ2luZVJldHVybmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBDcmVhdGVKU0VuZ2luZVdpdGhFeHRlcm5hbEVudjogZnVuY3Rpb24gKCkgeyB9LFxyXG4gICAgICAgICAgICBEZXN0cm95SlNFbmdpbmU6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgR2V0TGFzdEV4Y2VwdGlvbkluZm86IGZ1bmN0aW9uIChpc29sYXRlLCAvKiBvdXQgaW50ICovIHN0cmxlbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVuZ2luZS5sYXN0RXhjZXB0aW9uID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnbnVsbCc7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVuZ2luZS5sYXN0RXhjZXB0aW9uID09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAndW5kZWZpbmVkJztcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKGVuZ2luZS5sYXN0RXhjZXB0aW9uLnN0YWNrLCBzdHJsZW4pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBMb3dNZW1vcnlOb3RpZmljYXRpb246IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIElkbGVOb3RpZmljYXRpb25EZWFkbGluZTogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgUmVxdWVzdE1pbm9yR2FyYmFnZUNvbGxlY3Rpb25Gb3JUZXN0aW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBSZXF1ZXN0RnVsbEdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgU2V0R2VuZXJhbERlc3RydWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlLCBfZ2VuZXJhbERlc3RydWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciA9IF9nZW5lcmFsRGVzdHJ1Y3RvcjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0TW9kdWxlRXhlY3V0b3I6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGxvYWRlciA9IHR5cGVvZiBfX3RnanNHZXRMb2FkZXIgIT0gJ3VuZGVmaW5lZCcgPyBfX3RnanNHZXRMb2FkZXIoKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2FkZXJSZXNvbHZlID0gbG9hZGVyLlJlc29sdmUgPyAoZnVuY3Rpb24gKGZpbGVOYW1lLCB0byA9IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZE5hbWUgPSBsb2FkZXIuUmVzb2x2ZShmaWxlTmFtZSwgdG8pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkTmFtZTtcclxuICAgICAgICAgICAgICAgIH0pIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuY3Rpb24gKGZpbGVOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKFsncHVlcnRzL2xvZy5tanMnLCAncHVlcnRzL3RpbWVyLm1qcyddLmluZGV4T2YoZmlsZU5hbWUpICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7fTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlclJlc29sdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZU5hbWUgPSBsb2FkZXJSZXNvbHZlKGZpbGVOYW1lLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3eCAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB3eFJlcXVpcmUoJ3B1ZXJ0c19taW5pZ2FtZV9qc19yZXNvdXJjZXMvJyArIChmaWxlTmFtZS5lbmRzV2l0aCgnLmpzJykgPyBmaWxlTmFtZSA6IGZpbGVOYW1lICsgXCIuanNcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplKG5hbWUsIHRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIENTICE9IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDUy5QdWVydHMuUGF0aEhlbHBlci5Jc1JlbGF0aXZlKHRvKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXQgPSBDUy5QdWVydHMuUGF0aEhlbHBlci5ub3JtYWxpemUoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuRGlybmFtZShuYW1lKSArIFwiL1wiICsgdG8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0bztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBtb2NrUmVxdWlyZShzcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgZXhwb3J0czoge30gfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kQ2FjaGVTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgZXhlY3V0ZU1vZHVsZUNhY2hlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZENhY2hlU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmV4cG9ydHMgPSBleGVjdXRlTW9kdWxlQ2FjaGVbZm91bmRDYWNoZVNwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZFNwZWNpZmllciA9IHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBQVUVSVFNfSlNfUkVTT1VSQ0VTKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIHNwZWNpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNpZmllciA9IGZvdW5kU3BlY2lmaWVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUFVFUlRTX0pTX1JFU09VUkNFU1tzcGVjaWZpZXJdKHJlc3VsdC5leHBvcnRzLCBmdW5jdGlvbiBtUmVxdWlyZShzcGVjaWZpZXJUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vY2tSZXF1aXJlKGxvYWRlclJlc29sdmUgPyBsb2FkZXJSZXNvbHZlKHNwZWNpZmllclRvLCBzcGVjaWZpZXIpIDogbm9ybWFsaXplKHNwZWNpZmllciwgc3BlY2lmaWVyVG8pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0cnlGaW5kTmFtZSA9IFtzcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGVjaWZpZXIuaW5kZXhPZignLicpID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlGaW5kTmFtZSA9IHRyeUZpbmROYW1lLmNvbmNhdChbc3BlY2lmaWVyICsgJy5qcycsIHNwZWNpZmllciArICcudHMnLCBzcGVjaWZpZXIgKyAnLm1qcycsIHNwZWNpZmllciArICcubXRzJ10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSB0cnlGaW5kTmFtZS5yZWR1Y2UoKHJldCwgbmFtZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJldCAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmpbbmFtZV0gPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjaXJjdWxhciBkZXBlbmRlbmN5IGlzIGRldGVjdGVkIHdoZW4gcmVxdWlyaW5nIFwiJHtuYW1lfVwiYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmluZGVkID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnlGaW5kTmFtZVtmaW5kZWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWlyZVJldDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEpTT2JqZWN0VmFsdWVHZXR0ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuY3Rpb24gKG9iaiwga2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialtrZXldO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBFdmFsOiBmdW5jdGlvbiAoaXNvbGF0ZSwgY29kZVN0cmluZywgcGF0aCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsaWJyYXJ5XzEuZ2xvYmFsLmV2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJldmFsIGlzIG5vdCBzdXBwb3J0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKGNvZGVTdHJpbmcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGxpYnJhcnlfMS5nbG9iYWwuZXZhbChjb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gZ2V0SW50UHRyTWFuYWdlcigpLkdldFBvaW50ZXJGb3JKU1ZhbHVlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLypGUmVzdWx0SW5mbyAqLyAxMDI0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdEV4Y2VwdGlvbiA9IGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFNldFB1c2hKU0Z1bmN0aW9uQXJndW1lbnRzQ2FsbGJhY2s6IGZ1bmN0aW9uIChpc29sYXRlLCBjYWxsYmFjaywganNFbnZJZHgpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5HZXRKU0FyZ3VtZW50c0NhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFRocm93RXhjZXB0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgLypieXRlW10gKi8gbWVzc2FnZVN0cmluZykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobWVzc2FnZVN0cmluZykpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBJbnZva2VKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBoYXNSZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZ1bmMgaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSBmdW5jLmludm9rZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jLmxhc3RFeGNlcHRpb24gPSBlcnI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncHRyIGlzIG5vdCBhIGpzZnVuYycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRGdW5jdGlvbkxhc3RFeGNlcHRpb25JbmZvOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKm91dCBpbnQgKi8gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZnVuYy5sYXN0RXhjZXB0aW9uID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ251bGwnO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZnVuYy5sYXN0RXhjZXB0aW9uID09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZnVuYy5sYXN0RXhjZXB0aW9uLnN0YWNrIHx8IGZ1bmMubGFzdEV4Y2VwdGlvbi5tZXNzYWdlIHx8ICcnLCBsZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwdHIgaXMgbm90IGEganNmdW5jJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlbGVhc2VKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZW1vdmVKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBSZWxlYXNlSlNPYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBvYmopIHtcclxuICAgICAgICAgICAgICAgIGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlbW92ZUpTT2JqZWN0QnlJZChvYmopO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBSZXNldFJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSBudWxsO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBDbGVhck1vZHVsZUNhY2hlOiBmdW5jdGlvbiAoKSB7IH0sXHJcbiAgICAgICAgICAgIENyZWF0ZUluc3BlY3RvcjogZnVuY3Rpb24gKGlzb2xhdGUsIHBvcnQpIHsgfSxcclxuICAgICAgICAgICAgRGVzdHJveUluc3BlY3RvcjogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgSW5zcGVjdG9yVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgTG9naWNUaWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBTZXRMb2dDYWxsYmFjazogZnVuY3Rpb24gKGxvZywgbG9nV2FybmluZywgbG9nRXJyb3IpIHtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0SlNTdGFja1RyYWNlOiBmdW5jdGlvbiAoaXNvbGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcigpLnN0YWNrO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRXZWJHTEZGSUFwaTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICgwLCBwZXNhcGlJbXBsXzEuR2V0V2ViR0xGRklBcGkpKGVuZ2luZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldFdlYkdMUGFwaUVudlJlZjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDIwNDg7IC8vIGp1c3Qgbm90IG51bGxwdHJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=