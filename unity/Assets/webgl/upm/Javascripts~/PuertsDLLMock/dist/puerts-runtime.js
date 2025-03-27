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
        const { UTF8ToString, _malloc, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, stackSave, stackRestore, stackAlloc, getWasmTableEntry, addFunction, removeFunction, _CallCSharpFunctionCallback, _CallCSharpConstructorCallback, _CallCSharpDestructorCallback, InjectPapiGLNativeImpl, HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64, } = ctorParam;
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
            getWasmTableEntry,
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
    toJs(engine, objMapper, pvalue) {
        const valType = Buffer.readInt32(engine.unityApi.HEAPU8, pvalue + 8);
        if (valType <= JSTag.JS_TAG_OBJECT && valType >= JSTag.JS_TAG_ARRAY) {
            const objIdx = Buffer.readInt32(engine.unityApi.HEAPU8, pvalue);
            return this.objectsInScope[objIdx];
        }
        if (valType == JSTag.JS_TAG_NATIVE_OBJECT) {
            const objId = Buffer.readInt32(engine.unityApi.HEAPU8, pvalue);
            return objMapper.findNativeObject(objId);
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
    add(objId, value, typeId, callFinalize) {
        const ref = new WeakRef(value);
        this.storage.set(objId, [ref, typeId, callFinalize]);
        return this;
    }
    get(objId) {
        const entry = this.storage.get(objId);
        if (!entry)
            return;
        const [ref, typeId, callFinalize] = entry;
        const value = ref.deref();
        if (!value) {
            this.storage.delete(objId);
            this.cleanupCallback(objId, typeId, callFinalize);
        }
        return value;
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
    static getInstance() {
        if (!ClassRegister.instance) {
            ClassRegister.instance = new ClassRegister();
        }
        return ClassRegister.instance;
    }
    loadClassById(typeId) {
        const cls = this.typeIdToClass.get(typeId);
        if (cls) {
            return cls;
        }
        else {
            if (this.classNotFound && this.classNotFound(typeId)) {
                return this.typeIdToClass.get(typeId);
            }
        }
    }
    registerClass(typeId, cls) {
        this.typeIdToClass.set(typeId, cls);
    }
    findClassById(typeId) {
        return this.typeIdToClass.get(typeId);
    }
    setClassNotFoundCallback(callback) {
        this.classNotFound = callback;
    }
}
function makeNativeFunctionWrap(engine, isStatic, native_impl, data, finalize) {
    return function (...args) {
        if (new.target) {
            throw new Error('"not a constructor');
        }
        throw new Error("NativeFunctionWrap not implemented yet!");
    };
}
class ObjectMapper {
    objectPool;
    constructor(cleanupCallback) {
        this.objectPool = new ObjectPool(cleanupCallback);
    }
    pushNativeObject(objId, typeId, callFinalize) {
        let jsObj = this.objectPool.get(objId);
        if (!jsObj) {
            const cls = ClassRegister.getInstance().loadClassById(typeId);
            if (cls) {
                jsObj = Object.create(cls.prototype);
                this.objectPool.add(objId, jsObj, typeId, callFinalize);
            }
        }
        return jsObj;
    }
    findNativeObject(objId) {
        return this.objectPool.get(objId);
    }
}
let webglFFI = undefined;
// 需要在Unity里调用PlayerSettings.WebGL.emscriptenArgs = " -s ALLOW_TABLE_GROWTH=1";
function GetWebGLFFIApi(engine) {
    if (webglFFI)
        return webglFFI;
    const objMapper = new ObjectMapper((objId, typeId, callFinalize) => {
        // todo: callFinalize
        throw new Error("object finalize not implemented yet!");
    });
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
    function pesapi_native_object_to_value(env, typeId, object_ptr, call_finalize) {
        const jsObj = objMapper.pushNativeObject(object_ptr, typeId, call_finalize);
        return object_ptr;
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
        const obj = Scope.getCurrent().toJs(engine, objMapper, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_set_property: target is not an object");
        }
        const key = engine.unityApi.UTF8ToString(pkey);
        const value = Scope.getCurrent().toJs(engine, objMapper, pvalue);
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
        const obj = Scope.getCurrent().toJs(engine, objMapper, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_set_property: target is not an object");
        }
        const value = Scope.getCurrent().toJs(engine, objMapper, pvalue);
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
        pesapi_on_class_not_found: function (callbackPtr) {
            ClassRegister.getInstance().setClassNotFoundCallback((typeId) => {
                const jsCallback = engine.unityApi.getWasmTableEntry(callbackPtr);
                const ret = jsCallback(typeId);
                console.log(`pesapi_on_class_not_found ${typeof ret} ${ret}`);
                //callback(typeId);
                return !!ret;
            });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVlcnRzLXJ1bnRpbWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGlCQUFpQixHQUFHLGdCQUFnQjtBQUM3WjtBQUNBO0FBQ0EsMkJBQTJCLE1BQU0sMkJBQTJCLE1BQU07QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixrQkFBa0IsNkJBQTZCLE1BQU07QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsa0JBQWtCLGFBQWEsY0FBYyxTQUFTLFFBQVEsVUFBVSxNQUFNO0FBQ3JHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsS0FBSyxTQUFTLEtBQUssVUFBVSxNQUFNO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsaURBQWlEO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLCtUQUErVDtBQUMvVTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLHFCQUFNLDJEQUEyRDtBQUN6RSxRQUFRLHFCQUFNO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLHFCQUFNO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVLHFDQUFxQztBQUMvQyxVQUFVLDBDQUEwQztBQUNwRCxVQUFVLHlDQUF5QztBQUNuRCxVQUFVLHVDQUF1QztBQUNqRCxVQUFVLHdDQUF3QztBQUNsRCxVQUFVLHVDQUF1QztBQUNqRCxVQUFVLHdDQUF3QztBQUNsRCxVQUFVLHdDQUF3QztBQUNsRCxVQUFVLDhDQUE4QztBQUN4RCxVQUFVLHlDQUF5QztBQUNuRCxVQUFVLHNDQUFzQztBQUNoRCxVQUFVLHVDQUF1QztBQUNqRCxVQUFVLDRDQUE0QztBQUN0RCxVQUFVLHVDQUF1QztBQUNqRCxVQUFVLHlDQUF5QztBQUNuRCxVQUFVLDBDQUEwQztBQUNwRCxVQUFVLDJDQUEyQztBQUNyRCxVQUFVLDBDQUEwQztBQUNwRCxVQUFVLDJDQUEyQztBQUNyRCxVQUFVLDJDQUEyQztBQUNyRCxVQUFVLGtEQUFrRDtBQUM1RCxVQUFVLDRDQUE0QztBQUN0RCxVQUFVLDJDQUEyQztBQUNyRCxVQUFVLGtDQUFrQztBQUM1QyxVQUFVLHVDQUF1QztBQUNqRCxVQUFVLHFDQUFxQztBQUMvQyxVQUFVLG1DQUFtQztBQUM3QyxVQUFVLG9DQUFvQztBQUM5QyxVQUFVLG1DQUFtQztBQUM3QyxVQUFVLG9DQUFvQztBQUM5QyxVQUFVLG9DQUFvQztBQUM5QyxVQUFVLG9DQUFv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YUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsNkNBQTZDO0FBQzdDLHlEQUF5RDtBQUN6RCxvREFBb0Q7QUFDcEQsaURBQWlEO0FBQ2pELDZDQUE2QztBQUM3QztBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGlDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2J1ZmZlci5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbGlicmFyeS5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL2dldEZyb21KU0FyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvZ2V0RnJvbUpTUmV0dXJuLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvcmVnaXN0ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0ludm9rZUpTQXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0pTSW52b2tlUmV0dXJuLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9KU091dEFyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9wZXNhcGlJbXBsLmpzIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qXHJcbiogVGVuY2VudCBpcyBwbGVhc2VkIHRvIHN1cHBvcnQgdGhlIG9wZW4gc291cmNlIGNvbW11bml0eSBieSBtYWtpbmcgUHVlcnRzIGF2YWlsYWJsZS5cclxuKiBDb3B5cmlnaHQgKEMpIDIwMjAgVEhMIEEyOSBMaW1pdGVkLCBhIFRlbmNlbnQgY29tcGFueS4gIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiogUHVlcnRzIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0QgMy1DbGF1c2UgTGljZW5zZSwgZXhjZXB0IGZvciB0aGUgdGhpcmQtcGFydHkgY29tcG9uZW50cyBsaXN0ZWQgaW4gdGhlIGZpbGUgJ0xJQ0VOU0UnIHdoaWNoIG1heSBiZSBzdWJqZWN0IHRvIHRoZWlyIGNvcnJlc3BvbmRpbmcgbGljZW5zZSB0ZXJtcy5cclxuKiBUaGlzIGZpbGUgaXMgc3ViamVjdCB0byB0aGUgdGVybXMgYW5kIGNvbmRpdGlvbnMgZGVmaW5lZCBpbiBmaWxlICdMSUNFTlNFJywgd2hpY2ggaXMgcGFydCBvZiB0aGlzIHNvdXJjZSBjb2RlIHBhY2thZ2UuXHJcbiovXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy53cml0ZURvdWJsZSA9IGV4cG9ydHMud3JpdGVGbG9hdCA9IGV4cG9ydHMud3JpdGVVSW50NjQgPSBleHBvcnRzLndyaXRlSW50NjQgPSBleHBvcnRzLndyaXRlVUludDMyID0gZXhwb3J0cy53cml0ZUludDMyID0gZXhwb3J0cy53cml0ZVVJbnQxNiA9IGV4cG9ydHMud3JpdGVJbnQxNiA9IGV4cG9ydHMud3JpdGVVSW50OCA9IGV4cG9ydHMud3JpdGVJbnQ4ID0gZXhwb3J0cy5yZWFkRG91YmxlID0gZXhwb3J0cy5yZWFkRmxvYXQgPSBleHBvcnRzLnJlYWRVSW50NjQgPSBleHBvcnRzLnJlYWRJbnQ2NCA9IGV4cG9ydHMucmVhZFVJbnQzMiA9IGV4cG9ydHMucmVhZEludDMyID0gZXhwb3J0cy5yZWFkVUludDE2ID0gZXhwb3J0cy5yZWFkSW50MTYgPSBleHBvcnRzLnJlYWRVSW50OCA9IGV4cG9ydHMucmVhZEludDggPSB2b2lkIDA7XHJcbmZ1bmN0aW9uIHZhbGlkYXRlTnVtYmVyKHZhbHVlLCB0eXBlKSB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBleHBlY3RzIGEgbnVtYmVyIGJ1dCBnb3QgJHt2YWx1ZX1gKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBib3VuZHNFcnJvcih2YWx1ZSwgbGVuZ3RoLCB0eXBlKSB7XHJcbiAgICBpZiAoTWF0aC5mbG9vcih2YWx1ZSkgIT09IHZhbHVlKSB7XHJcbiAgICAgICAgdmFsaWRhdGVOdW1iZXIodmFsdWUsIHR5cGUgfHwgJ29mZnNldCcpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0eXBlIHx8ICdvZmZzZXQnfSBleHBlY3RzIGFuIGludGVnZXIgYnV0IGdvdCAke3ZhbHVlfWApO1xyXG4gICAgfVxyXG4gICAgaWYgKGxlbmd0aCA8IDApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvdXQgb2YgYm91bmRcIik7XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZSB8fCAnb2Zmc2V0J30gZXhwZWN0cyA+PSAke3R5cGUgPyAxIDogMH0gYW5kIDw9ICR7bGVuZ3RofSBidXQgZ290ICR7dmFsdWV9YCk7XHJcbn1cclxuZnVuY3Rpb24gY2hlY2tCb3VuZHMoYnVmLCBvZmZzZXQsIGJ5dGVMZW5ndGgpIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgaWYgKGJ1ZltvZmZzZXRdID09PSB1bmRlZmluZWQgfHwgYnVmW29mZnNldCArIGJ5dGVMZW5ndGhdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1Zi5sZW5ndGggLSAoYnl0ZUxlbmd0aCArIDEpKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiB3cml0ZVVfSW50OChidWYsIHZhbHVlLCBvZmZzZXQsIG1pbiwgbWF4KSB7XHJcbiAgICB2YWx1ZSA9ICt2YWx1ZTtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB2YWx1ZSBleHBlY3RzID49ICR7bWlufSBhbmQgPD0gJHttYXh9IGJ1dCBnb3QgJHt2YWx1ZX1gKTtcclxuICAgIH1cclxuICAgIGlmIChidWZbb2Zmc2V0XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWYubGVuZ3RoIC0gMSk7XHJcbiAgICB9XHJcbiAgICBidWZbb2Zmc2V0XSA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIG9mZnNldCArIDE7XHJcbn1cclxuZnVuY3Rpb24gcmVhZEludDgoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCB2YWwgPSBidWZmW29mZnNldF07XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsIHwgKHZhbCAmIDIgKiogNykgKiAweDFmZmZmZmU7XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50OCA9IHJlYWRJbnQ4O1xyXG5mdW5jdGlvbiB3cml0ZUludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0ID0gMCkge1xyXG4gICAgcmV0dXJuIHdyaXRlVV9JbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCwgLTB4ODAsIDB4N2YpO1xyXG59XHJcbmV4cG9ydHMud3JpdGVJbnQ4ID0gd3JpdGVJbnQ4O1xyXG5mdW5jdGlvbiByZWFkVUludDgoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCB2YWwgPSBidWZmW29mZnNldF07XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQ4ID0gcmVhZFVJbnQ4O1xyXG5mdW5jdGlvbiB3cml0ZVVJbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCA9IDApIHtcclxuICAgIHJldHVybiB3cml0ZVVfSW50OChidWYsIHZhbHVlLCBvZmZzZXQsIDAsIDB4ZmYpO1xyXG59XHJcbmV4cG9ydHMud3JpdGVVSW50OCA9IHdyaXRlVUludDg7XHJcbmNvbnN0IGludDE2QXJyYXkgPSBuZXcgSW50MTZBcnJheSgxKTtcclxuY29uc3QgdUludDhJbnQ2QXJyYXkgPSBuZXcgVWludDhBcnJheShpbnQxNkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRJbnQxNihidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgMV07XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMik7XHJcbiAgICB9XHJcbiAgICB1SW50OEludDZBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdUludDhJbnQ2QXJyYXlbMV0gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGludDE2QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50MTYgPSByZWFkSW50MTY7XHJcbmZ1bmN0aW9uIHdyaXRlSW50MTYoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAxKTtcclxuICAgIGludDE2QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4SW50NkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEludDZBcnJheVsxXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZUludDE2ID0gd3JpdGVJbnQxNjtcclxuY29uc3QgdWludDE2QXJyYXkgPSBuZXcgVWludDE2QXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4VWludDE2QXJyYXkgPSBuZXcgVWludDhBcnJheSh1aW50MTZBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkVUludDE2KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAxXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSAyKTtcclxuICAgIH1cclxuICAgIHVpbnQ4VWludDE2QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4VWludDE2QXJyYXlbMV0gPSBsYXN0O1xyXG4gICAgcmV0dXJuIHVpbnQxNkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQxNiA9IHJlYWRVSW50MTY7XHJcbmZ1bmN0aW9uIHdyaXRlVUludDE2KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMSk7XHJcbiAgICB1aW50MTZBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MTZBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MTZBcnJheVsxXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZVVJbnQxNiA9IHdyaXRlVUludDE2O1xyXG5jb25zdCBpbnQzMkFycmF5ID0gbmV3IEludDMyQXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4SW50MzJBcnJheSA9IG5ldyBVaW50OEFycmF5KGludDMyQXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZEludDMyKGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAzXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA0KTtcclxuICAgIH1cclxuICAgIHVpbnQ4SW50MzJBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhJbnQzMkFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEludDMyQXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4SW50MzJBcnJheVszXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gaW50MzJBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRJbnQzMiA9IHJlYWRJbnQzMjtcclxuZnVuY3Rpb24gd3JpdGVJbnQzMihidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDMpO1xyXG4gICAgaW50MzJBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhJbnQzMkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEludDMyQXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4SW50MzJBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhJbnQzMkFycmF5WzNdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlSW50MzIgPSB3cml0ZUludDMyO1xyXG5jb25zdCB1aW50MzJBcnJheSA9IG5ldyBVaW50MzJBcnJheSgxKTtcclxuY29uc3QgdWludDhVaW50MzJBcnJheSA9IG5ldyBVaW50OEFycmF5KHVpbnQzMkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRVSW50MzIoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDNdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDQpO1xyXG4gICAgfVxyXG4gICAgdWludDhVaW50MzJBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhVaW50MzJBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhVaW50MzJBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhVaW50MzJBcnJheVszXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gdWludDMyQXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkVUludDMyID0gcmVhZFVJbnQzMjtcclxuZnVuY3Rpb24gd3JpdGVVSW50MzIoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAzKTtcclxuICAgIHVpbnQzMkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzNdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlVUludDMyID0gd3JpdGVVSW50MzI7XHJcbmNvbnN0IGZsb2F0MzJBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoMSk7XHJcbmNvbnN0IHVJbnQ4RmxvYXQzMkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoZmxvYXQzMkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRGbG9hdChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgM107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gNCk7XHJcbiAgICB9XHJcbiAgICB1SW50OEZsb2F0MzJBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdUludDhGbG9hdDMyQXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQzMkFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0MzJBcnJheVszXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gZmxvYXQzMkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZEZsb2F0ID0gcmVhZEZsb2F0O1xyXG5mdW5jdGlvbiB3cml0ZUZsb2F0KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMyk7XHJcbiAgICBmbG9hdDMyQXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQzMkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0MzJBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDMyQXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQzMkFycmF5WzNdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlRmxvYXQgPSB3cml0ZUZsb2F0O1xyXG5jb25zdCBmbG9hdDY0QXJyYXkgPSBuZXcgRmxvYXQ2NEFycmF5KDEpO1xyXG5jb25zdCB1SW50OEZsb2F0NjRBcnJheSA9IG5ldyBVaW50OEFycmF5KGZsb2F0NjRBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkRG91YmxlKGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgN107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gOCk7XHJcbiAgICB9XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVszXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbNF0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzVdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVs2XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbN10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGZsb2F0NjRBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWREb3VibGUgPSByZWFkRG91YmxlO1xyXG5mdW5jdGlvbiB3cml0ZURvdWJsZShidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDcpO1xyXG4gICAgZmxvYXQ2NEFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVszXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbNF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzVdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVs2XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbN107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVEb3VibGUgPSB3cml0ZURvdWJsZTtcclxuY29uc3QgYmlnSW50NjRBcnJheSA9IG5ldyBCaWdJbnQ2NEFycmF5KDEpO1xyXG5jb25zdCB1aW50OEJpZ0ludDY0QXJyYXkgPSBuZXcgVWludDhBcnJheShiaWdJbnQ2NEFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRJbnQ2NChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDddO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDgpO1xyXG4gICAgfVxyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzNdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbNF0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVs1XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzZdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbN10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGJpZ0ludDY0QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50NjQgPSByZWFkSW50NjQ7XHJcbmZ1bmN0aW9uIHdyaXRlSW50NjQoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSB0eXBlb2YgdmFsID09PSAnbnVtYmVyJyA/IEJpZ0ludCh2YWwpIDogdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCA3KTtcclxuICAgIGJpZ0ludDY0QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVszXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzRdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbNV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVs2XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzddO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlSW50NjQgPSB3cml0ZUludDY0O1xyXG5jb25zdCBiaWdVaW50NjRBcnJheSA9IG5ldyBCaWdVaW50NjRBcnJheSgxKTtcclxuY29uc3QgdWludDhCaWdVaW50NjRBcnJheSA9IG5ldyBVaW50OEFycmF5KGJpZ1VpbnQ2NEFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRVSW50NjQoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyA3XTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA4KTtcclxuICAgIH1cclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbM10gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbNF0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbNV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbNl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbN10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGJpZ1VpbnQ2NEFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQ2NCA9IHJlYWRVSW50NjQ7XHJcbmZ1bmN0aW9uIHdyaXRlVUludDY0KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gdHlwZW9mIHZhbCA9PT0gJ251bWJlcicgPyBCaWdJbnQodmFsKSA6IHZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgNyk7XHJcbiAgICBiaWdVaW50NjRBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVszXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs0XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs1XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs2XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs3XTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZVVJbnQ2NCA9IHdyaXRlVUludDY0O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1idWZmZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5yZXR1cm5CaWdJbnQgPSBleHBvcnRzLmlzQmlnSW50ID0gZXhwb3J0cy5zZXRPdXRWYWx1ZTggPSBleHBvcnRzLnNldE91dFZhbHVlMzIgPSBleHBvcnRzLm1ha2VCaWdJbnQgPSBleHBvcnRzLkdldFR5cGUgPSBleHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gZXhwb3J0cy5PbkZpbmFsaXplID0gZXhwb3J0cy5jcmVhdGVXZWFrUmVmID0gZXhwb3J0cy5nbG9iYWwgPSBleHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IGV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGV4cG9ydHMuSlNPYmplY3QgPSBleHBvcnRzLkpTRnVuY3Rpb24gPSBleHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IGV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm8gPSB2b2lkIDA7XHJcbi8qKlxyXG4gKiDkuIDmrKHlh73mlbDosIPnlKjnmoRpbmZvXHJcbiAqIOWvueW6lHY4OjpGdW5jdGlvbkNhbGxiYWNrSW5mb1xyXG4gKi9cclxuY2xhc3MgRnVuY3Rpb25DYWxsYmFja0luZm8ge1xyXG4gICAgYXJncztcclxuICAgIHJldHVyblZhbHVlO1xyXG4gICAgc3RhY2sgPSAwO1xyXG4gICAgY29uc3RydWN0b3IoYXJncykge1xyXG4gICAgICAgIHRoaXMuYXJncyA9IGFyZ3M7XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlKCkge1xyXG4gICAgICAgIHRoaXMuc3RhY2sgPSAwO1xyXG4gICAgICAgIHRoaXMuYXJncyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IHZvaWQgMDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gRnVuY3Rpb25DYWxsYmFja0luZm87XHJcbi8vIHN0cnVjdCBNb2NrVjhWYWx1ZVxyXG4vLyB7XHJcbi8vICAgICBpbnQgSlNWYWx1ZVR5cGU7ICAvLyAwXHJcbi8vICAgICBpbnQgRmluYWxWYWx1ZVBvaW50ZXJbMl07IC8vIDEgMiBpZiB2YWx1ZSBpcyBiaWdpbnQgRmluYWxWYWx1ZVBvaW50ZXJbMF0gZm9yIGxvdywgRmluYWxWYWx1ZVBvaW50ZXJbMV0gZm9yIGhpZ2hcclxuLy8gICAgIGludCBleHRyYTsgLy8gM1xyXG4vLyAgICAgaW50IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvOyAvLyA0XHJcbi8vIH07XHJcbmNvbnN0IEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyID0gNDsgLy8gaW50IGNvdW50XHJcbi8qKlxyXG4gKiDmiopGdW5jdGlvbkNhbGxiYWNrSW5mb+S7peWPiuWFtuWPguaVsOi9rOWMluS4umMj5Y+v55So55qEaW50cHRyXHJcbiAqL1xyXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIge1xyXG4gICAgLy8gRnVuY3Rpb25DYWxsYmFja0luZm/nmoTliJfooajvvIzku6XliJfooajnmoRpbmRleOS9nOS4ukludFB0cueahOWAvFxyXG4gICAgaW5mb3MgPSBbbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKFswXSldOyAvLyDov5nph4zljp/mnKzlj6rmmK/kuKrmma7pgJrnmoQwXHJcbiAgICAvLyBGdW5jdGlvbkNhbGxiYWNrSW5mb+eUqOWujOWQju+8jOWwhuWFtuW6j+WPt+aUvuWFpeKAnOWbnuaUtuWIl+ihqOKAne+8jOS4i+asoeWwseiDvee7p+e7reacjeeUqOivpWluZGV477yM6ICM5LiN5b+F6K6paW5mb3PmlbDnu4Tml6DpmZDmianlsZXkuIvljrtcclxuICAgIGZyZWVJbmZvc0luZGV4ID0gW107XHJcbiAgICBmcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGggPSB7fTtcclxuICAgIGZyZWVSZWZNZW1vcnkgPSBbXTtcclxuICAgIGVuZ2luZTtcclxuICAgIGNvbnN0cnVjdG9yKGVuZ2luZSkge1xyXG4gICAgICAgIHRoaXMuZW5naW5lID0gZW5naW5lO1xyXG4gICAgfVxyXG4gICAgYWxsb2NDYWxsYmFja0luZm9NZW1vcnkoYXJnc0xlbmd0aCkge1xyXG4gICAgICAgIGNvbnN0IGNhY2hlQXJyYXkgPSB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXTtcclxuICAgICAgICBpZiAoY2FjaGVBcnJheSAmJiBjYWNoZUFycmF5Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVBcnJheS5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVuZ2luZS51bml0eUFwaS5fbWFsbG9jKChhcmdzTGVuZ3RoICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgKyAxKSA8PCAyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhbGxvY1JlZk1lbW9yeSgpIHtcclxuICAgICAgICBpZiAodGhpcy5mcmVlUmVmTWVtb3J5Lmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnJlZVJlZk1lbW9yeS5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbmdpbmUudW5pdHlBcGkuX21hbGxvYyhBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiA8PCAyKTtcclxuICAgIH1cclxuICAgIHJlY3ljbGVSZWZNZW1vcnkoYnVmZmVyUHRyKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZnJlZVJlZk1lbW9yeS5sZW5ndGggPiAyMCkge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5fZnJlZShidWZmZXJQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5mcmVlUmVmTWVtb3J5LnB1c2goYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KGJ1ZmZlclB0ciwgYXJncykge1xyXG4gICAgICAgIGNvbnN0IGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICBpZiAoIXRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdICYmIGFyZ3NMZW5ndGggPCA1KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGNhY2hlQXJyYXkgPSB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXTtcclxuICAgICAgICBpZiAoIWNhY2hlQXJyYXkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBidWZmZXJQdHJJbjMyID0gYnVmZmVyUHRyIDw8IDI7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzTGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3NbaV0gaW5zdGFuY2VvZiBBcnJheSAmJiBhcmdzW2ldLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlY3ljbGVSZWZNZW1vcnkodGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW2J1ZmZlclB0ckluMzIgKyBpICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgKyAxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g5ouN6ISR6KKL5a6a55qE5pyA5aSn57yT5a2Y5Liq5pWw5aSn5bCP44CCIDUwIC0g5Y+C5pWw5Liq5pWwICogMTBcclxuICAgICAgICBpZiAoY2FjaGVBcnJheS5sZW5ndGggPiAoNTAgLSBhcmdzTGVuZ3RoICogMTApKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9mcmVlKGJ1ZmZlclB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjYWNoZUFycmF5LnB1c2goYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIGludHB0cueahOagvOW8j+S4umlk5bem56e75Zub5L2NXHJcbiAgICAgKlxyXG4gICAgICog5Y+z5L6n5Zub5L2N77yM5piv5Li65LqG5Zyo5Y+z5Zub5L2N5a2Y5YKo5Y+C5pWw55qE5bqP5Y+377yM6L+Z5qC35Y+v5Lul55So5LqO6KGo56S6Y2FsbGJhY2tpbmZv5Y+C5pWw55qEaW50cHRyXHJcbiAgICAgKi9cclxuICAgIC8vIHN0YXRpYyBHZXRNb2NrUG9pbnRlcihhcmdzOiBhbnlbXSk6IE1vY2tJbnRQdHIge1xyXG4gICAgLy8gICAgIGxldCBpbmRleDogbnVtYmVyO1xyXG4gICAgLy8gICAgIGluZGV4ID0gdGhpcy5mcmVlSW5mb3NJbmRleC5wb3AoKTtcclxuICAgIC8vICAgICAvLyBpbmRleOacgOWwj+S4ujFcclxuICAgIC8vICAgICBpZiAoaW5kZXgpIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5pbmZvc1tpbmRleF0uYXJncyA9IGFyZ3M7XHJcbiAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2gobmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKGFyZ3MpKSAtIDE7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIHJldHVybiBpbmRleCA8PCA0O1xyXG4gICAgLy8gfVxyXG4gICAgR2V0TW9ja1BvaW50ZXIoYXJncykge1xyXG4gICAgICAgIGNvbnN0IGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICBsZXQgYnVmZmVyUHRySW44ID0gdGhpcy5hbGxvY0NhbGxiYWNrSW5mb01lbW9yeShhcmdzTGVuZ3RoKTtcclxuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLmZyZWVJbmZvc0luZGV4LnBvcCgpO1xyXG4gICAgICAgIGxldCBmdW5jdGlvbkNhbGxiYWNrSW5mbztcclxuICAgICAgICAvLyBpbmRleOacgOWwj+S4ujFcclxuICAgICAgICBpZiAoaW5kZXgpIHtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gdGhpcy5pbmZvc1tpbmRleF0pLmFyZ3MgPSBhcmdzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2goZnVuY3Rpb25DYWxsYmFja0luZm8gPSBuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oYXJncykpIC0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHVuaXR5QXBpID0gdGhpcy5lbmdpbmUudW5pdHlBcGk7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyUHRySW4zMiA9IGJ1ZmZlclB0ckluOCA+PiAyO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVAzMltidWZmZXJQdHJJbjMyXSA9IGluZGV4O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJnc0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBhcmcgPSBhcmdzW2ldO1xyXG4gICAgICAgICAgICAvLyBpbml0IGVhY2ggdmFsdWVcclxuICAgICAgICAgICAgY29uc3QganNWYWx1ZVR5cGUgPSBHZXRUeXBlKHRoaXMuZW5naW5lLCBhcmcpO1xyXG4gICAgICAgICAgICBjb25zdCBqc1ZhbHVlUHRyID0gYnVmZmVyUHRySW4zMiArIGkgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDE7XHJcbiAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyXSA9IGpzVmFsdWVUeXBlOyAvLyBqc3ZhbHVldHlwZVxyXG4gICAgICAgICAgICBpZiAoanNWYWx1ZVR5cGUgPT0gMiB8fCBqc1ZhbHVlVHlwZSA9PSA0IHx8IGpzVmFsdWVUeXBlID09IDUxMikge1xyXG4gICAgICAgICAgICAgICAgLy8gYmlnaW5044CBbnVtYmVyIG9yIGRhdGVcclxuICAgICAgICAgICAgICAgICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKHRoaXMuZW5naW5lLCBhcmcsIGpzVmFsdWVUeXBlLCBqc1ZhbHVlUHRyICsgMSk7IC8vIHZhbHVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoanNWYWx1ZVR5cGUgPT0gOCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZ1bmN0aW9uQ2FsbGJhY2tJbmZvLnN0YWNrID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbkNhbGxiYWNrSW5mby5zdGFjayA9IHVuaXR5QXBpLnN0YWNrU2F2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIChqc1ZhbHVlUHRyICsgMikgPDwgMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoanNWYWx1ZVR5cGUgPT0gNjQgJiYgYXJnIGluc3RhbmNlb2YgQXJyYXkgJiYgYXJnLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBtYXliZSBhIHJlZlxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIDApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmUHRySW44ID0gdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAyXSA9IHRoaXMuYWxsb2NSZWZNZW1vcnkoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlZlB0ciA9IHJlZlB0ckluOCA+PiAyO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmVmFsdWVUeXBlID0gdW5pdHlBcGkuSEVBUDMyW3JlZlB0cl0gPSBHZXRUeXBlKHRoaXMuZW5naW5lLCBhcmdbMF0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlZlZhbHVlVHlwZSA9PSAyIHx8IHJlZlZhbHVlVHlwZSA9PSA0IHx8IHJlZlZhbHVlVHlwZSA9PSA1MTIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBudW1iZXIgb3IgZGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKHRoaXMuZW5naW5lLCBhcmdbMF0sIHJlZlZhbHVlVHlwZSwgcmVmUHRyICsgMSk7IC8vIHZhbHVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbcmVmUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmdbMF0sIHJlZlZhbHVlVHlwZSwgKHJlZlB0ciArIDIpIDw8IDIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW3JlZlB0ciArIDNdID0gYnVmZmVyUHRySW44OyAvLyBhIHBvaW50ZXIgdG8gdGhlIGluZm9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIG90aGVyXHJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwgKGpzVmFsdWVQdHIgKyAyKSA8PCAyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDNdID0gYnVmZmVyUHRySW44OyAvLyBhIHBvaW50ZXIgdG8gdGhlIGluZm9cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlclB0ckluODtcclxuICAgIH1cclxuICAgIC8vIHN0YXRpYyBHZXRCeU1vY2tQb2ludGVyKGludHB0cjogTW9ja0ludFB0cik6IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvIHtcclxuICAgIC8vICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbnRwdHIgPj4gNF07XHJcbiAgICAvLyB9XHJcbiAgICBHZXRCeU1vY2tQb2ludGVyKHB0ckluOCkge1xyXG4gICAgICAgIGNvbnN0IHB0ckluMzIgPSBwdHJJbjggPj4gMjtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXTtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICB9XHJcbiAgICBHZXRSZXR1cm5WYWx1ZUFuZFJlY3ljbGUocHRySW44KSB7XHJcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xyXG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICAgICAgbGV0IHJldCA9IGluZm8ucmV0dXJuVmFsdWU7XHJcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KHB0ckluOCwgaW5mby5hcmdzKTtcclxuICAgICAgICBpZiAoaW5mby5zdGFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5zdGFja1Jlc3RvcmUoaW5mby5zdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluZm8ucmVjeWNsZSgpO1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIFJlbGVhc2VCeU1vY2tJbnRQdHIocHRySW44KSB7XHJcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xyXG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KHB0ckluOCwgaW5mby5hcmdzKTtcclxuICAgICAgICBpZiAoaW5mby5zdGFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5zdGFja1Jlc3RvcmUoaW5mby5zdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluZm8ucmVjeWNsZSgpO1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICB9XHJcbiAgICBHZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlUHRySW44KSB7XHJcbiAgICAgICAgbGV0IGhlYXAzMiA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMjtcclxuICAgICAgICBjb25zdCBpbmZvUHRySW44ID0gaGVhcDMyWyh2YWx1ZVB0ckluOCA+PiAyKSArIDNdO1xyXG4gICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb0luZGV4ID0gaGVhcDMyW2luZm9QdHJJbjggPj4gMl07XHJcbiAgICAgICAgY29uc3QgYXJnc0luZGV4ID0gKHZhbHVlUHRySW44IC0gaW5mb1B0ckluOCAtIDQpIC8gKDQgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mb3NbY2FsbGJhY2tJbmZvSW5kZXhdLmFyZ3NbYXJnc0luZGV4XTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcclxuLyoqXHJcbiAqIOS7o+ihqOS4gOS4qkpTRnVuY3Rpb25cclxuICovXHJcbmNsYXNzIEpTRnVuY3Rpb24ge1xyXG4gICAgX2Z1bmM7XHJcbiAgICBpZDtcclxuICAgIGFyZ3MgPSBbXTtcclxuICAgIGxhc3RFeGNlcHRpb24gPSBudWxsO1xyXG4gICAgY29uc3RydWN0b3IoaWQsIGZ1bmMpIHtcclxuICAgICAgICB0aGlzLl9mdW5jID0gZnVuYztcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICB9XHJcbiAgICBpbnZva2UoKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbLi4udGhpcy5hcmdzXTtcclxuICAgICAgICB0aGlzLmFyZ3MubGVuZ3RoID0gMDtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkpTRnVuY3Rpb24gPSBKU0Z1bmN0aW9uO1xyXG4vKipcclxuICog5Luj6KGo5LiA5LiqSlNPYmplY3RcclxuICovXHJcbmNsYXNzIEpTT2JqZWN0IHtcclxuICAgIF9vYmo7XHJcbiAgICBpZDtcclxuICAgIGNvbnN0cnVjdG9yKGlkLCBvYmopIHtcclxuICAgICAgICB0aGlzLl9vYmogPSBvYmo7XHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgfVxyXG4gICAgZ2V0T2JqZWN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9vYmo7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5KU09iamVjdCA9IEpTT2JqZWN0O1xyXG5jbGFzcyBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5IHtcclxuICAgIHN0YXRpYyByZWd1bGFySUQgPSAxO1xyXG4gICAgc3RhdGljIGZyZWVJRCA9IFtdO1xyXG4gICAgc3RhdGljIGlkTWFwID0gbmV3IFdlYWtNYXAoKTtcclxuICAgIHN0YXRpYyBqc0Z1bmNPck9iamVjdEtWID0ge307XHJcbiAgICBzdGF0aWMgZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmNWYWx1ZSkge1xyXG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KGZ1bmNWYWx1ZSk7XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5mcmVlSUQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlkID0gdGhpcy5mcmVlSUQucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGZ1bmMgPSBuZXcgSlNGdW5jdGlvbihpZCwgZnVuY1ZhbHVlKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLnNldChmdW5jVmFsdWUsIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdID0gZnVuYztcclxuICAgICAgICByZXR1cm4gZnVuYztcclxuICAgIH1cclxuICAgIHN0YXRpYyBnZXRPckNyZWF0ZUpTT2JqZWN0KG9iaikge1xyXG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KG9iaik7XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5mcmVlSUQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlkID0gdGhpcy5mcmVlSUQucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGpzT2JqZWN0ID0gbmV3IEpTT2JqZWN0KGlkLCBvYmopO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuc2V0KG9iaiwgaWQpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBqc09iamVjdDtcclxuICAgICAgICByZXR1cm4ganNPYmplY3Q7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZ2V0SlNPYmplY3RCeUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcmVtb3ZlSlNPYmplY3RCeUlkKGlkKSB7XHJcbiAgICAgICAgY29uc3QganNPYmplY3QgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIGlmICghanNPYmplY3QpXHJcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ3JlbW92ZUpTT2JqZWN0QnlJZCBmYWlsZWQ6IGlkIGlzIGludmFsaWQ6ICcgKyBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNPYmplY3QuZ2V0T2JqZWN0KCkpO1xyXG4gICAgICAgIGRlbGV0ZSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIHRoaXMuZnJlZUlELnB1c2goaWQpO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGdldEpTRnVuY3Rpb25CeUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcmVtb3ZlSlNGdW5jdGlvbkJ5SWQoaWQpIHtcclxuICAgICAgICBjb25zdCBqc0Z1bmMgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIGlmICghanNGdW5jKVxyXG4gICAgICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKCdyZW1vdmVKU0Z1bmN0aW9uQnlJZCBmYWlsZWQ6IGlkIGlzIGludmFsaWQ6ICcgKyBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNGdW5jLl9mdW5jKTtcclxuICAgICAgICBkZWxldGUganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICB0aGlzLmZyZWVJRC5wdXNoKGlkKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5O1xyXG4vKipcclxuICogQ1NoYXJw5a+56LGh6K6w5b2V6KGo77yM6K6w5b2V5omA5pyJQ1NoYXJw5a+56LGh5bm25YiG6YWNaWRcclxuICog5ZKMcHVlcnRzLmRsbOaJgOWBmueahOS4gOagt1xyXG4gKi9cclxuY2xhc3MgQ1NoYXJwT2JqZWN0TWFwIHtcclxuICAgIGNsYXNzZXMgPSBbbnVsbF07XHJcbiAgICBuYXRpdmVPYmplY3RLViA9IG5ldyBNYXAoKTtcclxuICAgIC8vIHByaXZhdGUgbmF0aXZlT2JqZWN0S1Y6IHsgW29iamVjdElEOiBDU0lkZW50aWZpZXJdOiBXZWFrUmVmPGFueT4gfSA9IHt9O1xyXG4gICAgLy8gcHJpdmF0ZSBjc0lEV2Vha01hcDogV2Vha01hcDxhbnksIENTSWRlbnRpZmllcj4gPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgbmFtZXNUb0NsYXNzZXNJRCA9IHt9O1xyXG4gICAgY2xhc3NJRFdlYWtNYXAgPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYWRkQ2FsbGVkJywgdGhpcy5hZGRDYWxsZWQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVtb3ZlQ2FsbGVkJywgdGhpcy5yZW1vdmVDYWxsZWQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnd3InLCB0aGlzLm5hdGl2ZU9iamVjdEtWLnNpemUpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgfVxyXG4gICAgX21lbW9yeURlYnVnID0gZmFsc2U7XHJcbiAgICBhZGRDYWxsZWQgPSAwO1xyXG4gICAgcmVtb3ZlQ2FsbGVkID0gMDtcclxuICAgIGFkZChjc0lELCBvYmopIHtcclxuICAgICAgICB0aGlzLl9tZW1vcnlEZWJ1ZyAmJiB0aGlzLmFkZENhbGxlZCsrO1xyXG4gICAgICAgIC8vIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF0gPSBjcmVhdGVXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgLy8gdGhpcy5jc0lEV2Vha01hcC5zZXQob2JqLCBjc0lEKTtcclxuICAgICAgICB0aGlzLm5hdGl2ZU9iamVjdEtWLnNldChjc0lELCBjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgIG9ialsnJGNzaWQnXSA9IGNzSUQ7XHJcbiAgICB9XHJcbiAgICByZW1vdmUoY3NJRCkge1xyXG4gICAgICAgIHRoaXMuX21lbW9yeURlYnVnICYmIHRoaXMucmVtb3ZlQ2FsbGVkKys7XHJcbiAgICAgICAgLy8gZGVsZXRlIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF07XHJcbiAgICAgICAgdGhpcy5uYXRpdmVPYmplY3RLVi5kZWxldGUoY3NJRCk7XHJcbiAgICB9XHJcbiAgICBmaW5kT3JBZGRPYmplY3QoY3NJRCwgY2xhc3NJRCkge1xyXG4gICAgICAgIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWLmdldChjc0lEKTtcclxuICAgICAgICAvLyBsZXQgcmV0ID0gdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXTtcclxuICAgICAgICBpZiAocmV0ICYmIChyZXQgPSByZXQuZGVyZWYoKSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0ID0gdGhpcy5jbGFzc2VzW2NsYXNzSURdLmNyZWF0ZUZyb21DUyhjc0lEKTtcclxuICAgICAgICAvLyB0aGlzLmFkZChjc0lELCByZXQpOyDmnoTpgKDlh73mlbDph4zotJ/otKPosIPnlKhcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gICAgZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChvYmopIHtcclxuICAgICAgICAvLyByZXR1cm4gdGhpcy5jc0lEV2Vha01hcC5nZXQob2JqKTtcclxuICAgICAgICByZXR1cm4gb2JqID8gb2JqLiRjc2lkIDogMDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IENTaGFycE9iamVjdE1hcDtcclxuO1xyXG52YXIgZGVzdHJ1Y3RvcnMgPSB7fTtcclxuZXhwb3J0cy5nbG9iYWwgPSBnbG9iYWwgPSBnbG9iYWwgfHwgZ2xvYmFsVGhpcyB8fCB3aW5kb3c7XHJcbmdsb2JhbC5nbG9iYWwgPSBnbG9iYWw7XHJcbmNvbnN0IGNyZWF0ZVdlYWtSZWYgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHR5cGVvZiBXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBXWFdlYWtSZWYgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIldlYWtSZWYgaXMgbm90IGRlZmluZWQuIG1heWJlIHlvdSBzaG91bGQgdXNlIG5ld2VyIGVudmlyb25tZW50XCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGVyZWYoKSB7IHJldHVybiBvYmo7IH0gfTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwidXNpbmcgV1hXZWFrUmVmXCIpO1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgV1hXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXZWFrUmVmKG9iaik7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5leHBvcnRzLmNyZWF0ZVdlYWtSZWYgPSBjcmVhdGVXZWFrUmVmO1xyXG5jbGFzcyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2sge1xyXG4gICAgX2hhbmRsZXI7XHJcbiAgICByZWZzID0gW107XHJcbiAgICBoZWxkcyA9IFtdO1xyXG4gICAgYXZhaWxhYmxlSW5kZXggPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yKGhhbmRsZXIpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oXCJGaW5hbGl6YXRpb25SZWdpc3RlciBpcyBub3QgZGVmaW5lZC4gdXNpbmcgRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrXCIpO1xyXG4gICAgICAgIGdsb2JhbC5fcHVlcnRzX3JlZ2lzdHJ5ID0gdGhpcztcclxuICAgICAgICB0aGlzLl9oYW5kbGVyID0gaGFuZGxlcjtcclxuICAgIH1cclxuICAgIHJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYXZhaWxhYmxlSW5kZXgubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5hdmFpbGFibGVJbmRleC5wb3AoKTtcclxuICAgICAgICAgICAgdGhpcy5yZWZzW2luZGV4XSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcclxuICAgICAgICAgICAgdGhpcy5oZWxkc1tpbmRleF0gPSBoZWxkVmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlZnMucHVzaChjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgICAgICB0aGlzLmhlbGRzLnB1c2goaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOa4hemZpOWPr+iDveW3sue7j+WkseaViOeahFdlYWtSZWZcclxuICAgICAqL1xyXG4gICAgaXRlcmF0ZVBvc2l0aW9uID0gMDtcclxuICAgIGNsZWFudXAocGFydCA9IDEpIHtcclxuICAgICAgICBjb25zdCBzdGVwQ291bnQgPSB0aGlzLnJlZnMubGVuZ3RoIC8gcGFydDtcclxuICAgICAgICBsZXQgaSA9IHRoaXMuaXRlcmF0ZVBvc2l0aW9uO1xyXG4gICAgICAgIGZvciAobGV0IGN1cnJlbnRTdGVwID0gMDsgaSA8IHRoaXMucmVmcy5sZW5ndGggJiYgY3VycmVudFN0ZXAgPCBzdGVwQ291bnQ7IGkgPSAoaSA9PSB0aGlzLnJlZnMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMSksIGN1cnJlbnRTdGVwKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVmc1tpXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVmc1tpXS5kZXJlZigpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDnm67liY3msqHmnInlhoXlrZjmlbTnkIbog73lipvvvIzlpoLmnpzmuLjmiI/kuK3mnJ9yZWblvojlpJrkvYblkI7mnJ/lsJHkuobvvIzov5nph4zlsLHkvJrnmb3otLnpgY3ljobmrKHmlbBcclxuICAgICAgICAgICAgICAgIC8vIOS9humBjeWOhuS5n+WPquaYr+S4gOWPpT095ZKMY29udGludWXvvIzmtarotLnlvbHlk43kuI3lpKdcclxuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlSW5kZXgucHVzaChpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVmc1tpXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZXIodGhpcy5oZWxkc1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pdGVyYXRlUG9zaXRpb24gPSBpO1xyXG4gICAgfVxyXG59XHJcbnZhciByZWdpc3RyeSA9IG51bGw7XHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICByZWdpc3RyeSA9IG5ldyAodHlwZW9mIEZpbmFsaXphdGlvblJlZ2lzdHJ5ID09ICd1bmRlZmluZWQnID8gRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrIDogRmluYWxpemF0aW9uUmVnaXN0cnkpKGZ1bmN0aW9uIChoZWxkVmFsdWUpIHtcclxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xyXG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IGZpbmQgZGVzdHJ1Y3RvciBmb3IgXCIgKyBoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoLS1jYWxsYmFjay5yZWYgPT0gMCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXTtcclxuICAgICAgICAgICAgY2FsbGJhY2soaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBPbkZpbmFsaXplKG9iaiwgaGVsZFZhbHVlLCBjYWxsYmFjaykge1xyXG4gICAgaWYgKCFyZWdpc3RyeSkge1xyXG4gICAgICAgIGluaXQoKTtcclxuICAgIH1cclxuICAgIGxldCBvcmlnaW5DYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XHJcbiAgICBpZiAob3JpZ2luQ2FsbGJhY2spIHtcclxuICAgICAgICAvLyBXZWFrUmVm5YaF5a656YeK5pS+5pe25py65Y+v6IO95q+UZmluYWxpemF0aW9uUmVnaXN0cnnnmoTop6blj5Hmm7Tml6nvvIzliY3pnaLlpoLmnpzlj5HnjrB3ZWFrUmVm5Li656m65Lya6YeN5paw5Yib5bu65a+56LGhXHJcbiAgICAgICAgLy8g5L2G5LmL5YmN5a+56LGh55qEZmluYWxpemF0aW9uUmVnaXN0cnnmnIDnu4jlj4jogq/lrprkvJrop6blj5HjgIJcclxuICAgICAgICAvLyDmiYDku6XlpoLmnpzpgYfliLDov5nkuKrmg4XlhrXvvIzpnIDopoHnu5lkZXN0cnVjdG9y5Yqg6K6h5pWwXHJcbiAgICAgICAgKytvcmlnaW5DYWxsYmFjay5yZWY7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsYmFjay5yZWYgPSAxO1xyXG4gICAgICAgIGRlc3RydWN0b3JzW2hlbGRWYWx1ZV0gPSBjYWxsYmFjaztcclxuICAgIH1cclxuICAgIHJlZ2lzdHJ5LnJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKTtcclxufVxyXG5leHBvcnRzLk9uRmluYWxpemUgPSBPbkZpbmFsaXplO1xyXG5jbGFzcyBQdWVydHNKU0VuZ2luZSB7XHJcbiAgICBjc2hhcnBPYmplY3RNYXA7XHJcbiAgICBmdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXI7XHJcbiAgICB1bml0eUFwaTtcclxuICAgIC8qKiDlrZfnrKbkuLLnvJPlrZjvvIzpu5jorqTkuLoyNTblrZfoioIgKi9cclxuICAgIHN0ckJ1ZmZlcjtcclxuICAgIHN0cmluZ0J1ZmZlclNpemUgPSAyNTY7XHJcbiAgICBsYXN0UmV0dXJuQ1NSZXN1bHQgPSBudWxsO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICAvLyDov5nkuKTkuKrmmK9QdWVydHPnlKjnmoTnmoTnnJ/mraPnmoRDU2hhcnDlh73mlbDmjIfpkohcclxuICAgIEdldEpTQXJndW1lbnRzQ2FsbGJhY2s7XHJcbiAgICBnZW5lcmFsRGVzdHJ1Y3RvcjtcclxuICAgIGNvbnN0cnVjdG9yKGN0b3JQYXJhbSkge1xyXG4gICAgICAgIHRoaXMuY3NoYXJwT2JqZWN0TWFwID0gbmV3IENTaGFycE9iamVjdE1hcCgpO1xyXG4gICAgICAgIHRoaXMuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyID0gbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcih0aGlzKTtcclxuICAgICAgICBjb25zdCB7IFVURjhUb1N0cmluZywgX21hbGxvYywgX2ZyZWUsIF9zZXRUZW1wUmV0MCwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHN0YWNrU2F2ZSwgc3RhY2tSZXN0b3JlLCBzdGFja0FsbG9jLCBnZXRXYXNtVGFibGVFbnRyeSwgYWRkRnVuY3Rpb24sIHJlbW92ZUZ1bmN0aW9uLCBfQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2ssIF9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjaywgX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssIEluamVjdFBhcGlHTE5hdGl2ZUltcGwsIEhFQVA4LCBIRUFQVTgsIEhFQVAzMiwgSEVBUEYzMiwgSEVBUEY2NCwgfSA9IGN0b3JQYXJhbTtcclxuICAgICAgICB0aGlzLnN0ckJ1ZmZlciA9IF9tYWxsb2ModGhpcy5zdHJpbmdCdWZmZXJTaXplKTtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpID0ge1xyXG4gICAgICAgICAgICBVVEY4VG9TdHJpbmcsXHJcbiAgICAgICAgICAgIF9tYWxsb2MsXHJcbiAgICAgICAgICAgIF9mcmVlLFxyXG4gICAgICAgICAgICBfc2V0VGVtcFJldDAsXHJcbiAgICAgICAgICAgIHN0cmluZ1RvVVRGOCxcclxuICAgICAgICAgICAgbGVuZ3RoQnl0ZXNVVEY4LFxyXG4gICAgICAgICAgICBzdGFja1NhdmUsXHJcbiAgICAgICAgICAgIHN0YWNrUmVzdG9yZSxcclxuICAgICAgICAgICAgc3RhY2tBbGxvYyxcclxuICAgICAgICAgICAgZ2V0V2FzbVRhYmxlRW50cnksXHJcbiAgICAgICAgICAgIGFkZEZ1bmN0aW9uLFxyXG4gICAgICAgICAgICByZW1vdmVGdW5jdGlvbixcclxuICAgICAgICAgICAgX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrLFxyXG4gICAgICAgICAgICBfQ2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIF9DYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrLFxyXG4gICAgICAgICAgICBJbmplY3RQYXBpR0xOYXRpdmVJbXBsLFxyXG4gICAgICAgICAgICBIRUFQOCxcclxuICAgICAgICAgICAgSEVBUFU4LFxyXG4gICAgICAgICAgICBIRUFQMzIsXHJcbiAgICAgICAgICAgIEhFQVBGMzIsXHJcbiAgICAgICAgICAgIEhFQVBGNjQsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBnbG9iYWwuX190Z2pzRXZhbFNjcmlwdCA9IHR5cGVvZiBldmFsID09IFwidW5kZWZpbmVkXCIgPyAoKSA9PiB7IH0gOiBldmFsO1xyXG4gICAgICAgIGdsb2JhbC5fX3RnanNTZXRQcm9taXNlUmVqZWN0Q2FsbGJhY2sgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB3eCAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgd3gub25VbmhhbmRsZWRSZWplY3Rpb24oY2FsbGJhY2spO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBnbG9iYWwuX19wdWVydHNHZXRMYXN0RXhjZXB0aW9uID0gKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0RXhjZXB0aW9uO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICAvKiogY2FsbCB3aGVuIHdhc20gZ3JvdyBtZW1vcnkgKi9cclxuICAgIHVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzKEhFQVA4LCBIRUFQVTgsIEhFQVAzMiwgSEVBUEYzMiwgSEVBUEY2NCkge1xyXG4gICAgICAgIGxldCB1bml0eUFwaSA9IHRoaXMudW5pdHlBcGk7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUDggPSBIRUFQODtcclxuICAgICAgICB1bml0eUFwaS5IRUFQVTggPSBIRUFQVTg7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUDMyID0gSEVBUDMyO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVBGMzIgPSBIRUFQRjMyO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVBGNjQgPSBIRUFQRjY0O1xyXG4gICAgfVxyXG4gICAgbWVtY3B5KGRlc3QsIHNyYywgbnVtKSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5IRUFQVTguY29weVdpdGhpbihkZXN0LCBzcmMsIHNyYyArIG51bSk7XHJcbiAgICB9XHJcbiAgICBKU1N0cmluZ1RvQ1NTdHJpbmcocmV0dXJuU3RyLCAvKiogb3V0IGludCAqLyBsZW5ndGhPZmZzZXQpIHtcclxuICAgICAgICBpZiAocmV0dXJuU3RyID09PSBudWxsIHx8IHJldHVyblN0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnl0ZUNvdW50ID0gdGhpcy51bml0eUFwaS5sZW5ndGhCeXRlc1VURjgocmV0dXJuU3RyKTtcclxuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aE9mZnNldCwgYnl0ZUNvdW50KTtcclxuICAgICAgICBsZXQgYnVmZmVyID0gdGhpcy51bml0eUFwaS5fbWFsbG9jKGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgYnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICByZXR1cm4gYnVmZmVyO1xyXG4gICAgfVxyXG4gICAgSlNTdHJpbmdUb1RlbXBDU1N0cmluZyhyZXR1cm5TdHIsIC8qKiBvdXQgaW50ICovIGxlbmd0aE9mZnNldCkge1xyXG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xyXG4gICAgICAgIHNldE91dFZhbHVlMzIodGhpcywgbGVuZ3RoT2Zmc2V0LCBieXRlQ291bnQpO1xyXG4gICAgICAgIGlmICh0aGlzLnN0cmluZ0J1ZmZlclNpemUgPCBieXRlQ291bnQgKyAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMudW5pdHlBcGkuX2ZyZWUodGhpcy5zdHJCdWZmZXIpO1xyXG4gICAgICAgICAgICB0aGlzLnN0ckJ1ZmZlciA9IHRoaXMudW5pdHlBcGkuX21hbGxvYyh0aGlzLnN0cmluZ0J1ZmZlclNpemUgPSBNYXRoLm1heCgyICogdGhpcy5zdHJpbmdCdWZmZXJTaXplLCBieXRlQ291bnQgKyAxKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgdGhpcy5zdHJCdWZmZXIsIGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0ckJ1ZmZlcjtcclxuICAgIH1cclxuICAgIEpTU3RyaW5nVG9DU1N0cmluZ09uU3RhY2socmV0dXJuU3RyLCAvKiogb3V0IGludCAqLyBsZW5ndGhPZmZzZXQpIHtcclxuICAgICAgICBpZiAocmV0dXJuU3RyID09PSBudWxsIHx8IHJldHVyblN0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnl0ZUNvdW50ID0gdGhpcy51bml0eUFwaS5sZW5ndGhCeXRlc1VURjgocmV0dXJuU3RyKTtcclxuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aE9mZnNldCwgYnl0ZUNvdW50KTtcclxuICAgICAgICB2YXIgYnVmZmVyID0gdGhpcy51bml0eUFwaS5zdGFja0FsbG9jKGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgYnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICByZXR1cm4gYnVmZmVyO1xyXG4gICAgfVxyXG4gICAgbWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgZnVuY3Rpb25QdHIsIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgLy8g5LiN6IO955So566t5aS05Ye95pWw77yB5q2k5aSE6L+U5Zue55qE5Ye95pWw5Lya6LWL5YC85Yiw5YW35L2T55qEY2xhc3PkuIrvvIzlhbZ0aGlz5oyH6ZKI5pyJ5ZCr5LmJ44CCXHJcbiAgICAgICAgY29uc3QgZW5naW5lID0gdGhpcztcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcclxuICAgICAgICAgICAgaWYgKG5ldy50YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignXCJub3QgYSBjb25zdHJ1Y3RvcicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBjYWxsYmFja0luZm9QdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmNhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBcclxuICAgICAgICAgICAgICAgIC8vIGdldEludFB0ck1hbmFnZXIoKS5HZXRQb2ludGVyRm9ySlNWYWx1ZSh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGlzU3RhdGljID8gMCA6IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdCh0aGlzKSwgY2FsbGJhY2tJbmZvUHRyLCBhcmdzLmxlbmd0aCwgY2FsbGJhY2tJZHgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0UmV0dXJuVmFsdWVBbmRSZWN5Y2xlKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBjYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5fQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHNlbGZQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbiAgICBjYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudW5pdHlBcGkuX0NhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLl9DYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5QdWVydHNKU0VuZ2luZSA9IFB1ZXJ0c0pTRW5naW5lO1xyXG5mdW5jdGlvbiBHZXRUeXBlKGVuZ2luZSwgdmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIDE7XHJcbiAgICB9XHJcbiAgICBpZiAoaXNCaWdJbnQodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIDI7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInKSB7XHJcbiAgICAgICAgcmV0dXJuIDQ7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgcmV0dXJuIDg7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xyXG4gICAgICAgIHJldHVybiAxNjtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHJldHVybiAyNTY7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIDUxMjtcclxuICAgIH1cclxuICAgIC8vIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7IHJldHVybiAxMjggfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICByZXR1cm4gNjQ7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCB2YWx1ZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgIH1cclxuICAgIGlmIChlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIDMyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDY0O1xyXG59XHJcbmV4cG9ydHMuR2V0VHlwZSA9IEdldFR5cGU7XHJcbmZ1bmN0aW9uIG1ha2VCaWdJbnQobG93LCBoaWdoKSB7XHJcbiAgICByZXR1cm4gKEJpZ0ludChoaWdoKSA8PCAzMm4pIHwgQmlnSW50KGxvdyA+Pj4gMCk7XHJcbn1cclxuZXhwb3J0cy5tYWtlQmlnSW50ID0gbWFrZUJpZ0ludDtcclxuZnVuY3Rpb24gc2V0T3V0VmFsdWUzMihlbmdpbmUsIHZhbHVlUHRyLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMlt2YWx1ZVB0ciA+PiAyXSA9IHZhbHVlO1xyXG59XHJcbmV4cG9ydHMuc2V0T3V0VmFsdWUzMiA9IHNldE91dFZhbHVlMzI7XHJcbmZ1bmN0aW9uIHNldE91dFZhbHVlOChlbmdpbmUsIHZhbHVlUHRyLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4W3ZhbHVlUHRyXSA9IHZhbHVlO1xyXG59XHJcbmV4cG9ydHMuc2V0T3V0VmFsdWU4ID0gc2V0T3V0VmFsdWU4O1xyXG5mdW5jdGlvbiBpc0JpZ0ludCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQmlnSW50IHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2JpZ2ludCc7XHJcbn1cclxuZXhwb3J0cy5pc0JpZ0ludCA9IGlzQmlnSW50O1xyXG5mdW5jdGlvbiByZXR1cm5CaWdJbnQoZW5naW5lLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLl9zZXRUZW1wUmV0MChOdW1iZXIodmFsdWUgPj4gMzJuKSk7IC8vIGhpZ2hcclxuICAgIHJldHVybiBOdW1iZXIodmFsdWUgJiAweGZmZmZmZmZmbik7IC8vIGxvd1xyXG59XHJcbmV4cG9ydHMucmV0dXJuQmlnSW50ID0gcmV0dXJuQmlnSW50O1xyXG5mdW5jdGlvbiB3cml0ZUJpZ0ludChlbmdpbmUsIHB0ckluMzIsIHZhbHVlKSB7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdID0gTnVtYmVyKHZhbHVlICYgMHhmZmZmZmZmZm4pOyAvLyBsb3dcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMiArIDFdID0gTnVtYmVyKHZhbHVlID4+IDMybik7IC8vIGhpZ2hcclxufVxyXG5jb25zdCB0bXBJbnQzQXJyID0gbmV3IEludDMyQXJyYXkoMik7XHJcbmNvbnN0IHRtcEZsb2F0NjRBcnIgPSBuZXcgRmxvYXQ2NEFycmF5KHRtcEludDNBcnIuYnVmZmVyKTtcclxuZnVuY3Rpb24gd3JpdGVOdW1iZXIoZW5naW5lLCBwdHJJbjMyLCB2YWx1ZSkge1xyXG4gICAgLy8gbnVtYmVyIGluIGpzIGlzIGRvdWJsZVxyXG4gICAgdG1wRmxvYXQ2NEFyclswXSA9IHZhbHVlO1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXSA9IHRtcEludDNBcnJbMF07XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzIgKyAxXSA9IHRtcEludDNBcnJbMV07XHJcbn1cclxuZnVuY3Rpb24gJEZpbGxBcmd1bWVudEZpbmFsTnVtYmVyVmFsdWUoZW5naW5lLCB2YWwsIGpzVmFsdWVUeXBlLCB2YWxQdHJJbjMyKSB7XHJcbiAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgc3dpdGNoIChqc1ZhbHVlVHlwZSkge1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgd3JpdGVCaWdJbnQoZW5naW5lLCB2YWxQdHJJbjMyLCB2YWwpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgIHdyaXRlTnVtYmVyKGVuZ2luZSwgdmFsUHRySW4zMiwgK3ZhbCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNTEyOlxyXG4gICAgICAgICAgICB3cml0ZU51bWJlcihlbmdpbmUsIHZhbFB0ckluMzIsIHZhbC5nZXRUaW1lKCkpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKGVuZ2luZSwgdmFsLCBqc1ZhbHVlVHlwZSwgbGVuZ3RoT2Zmc2V0KSB7XHJcbiAgICBpZiAoIWpzVmFsdWVUeXBlKVxyXG4gICAgICAgIGpzVmFsdWVUeXBlID0gR2V0VHlwZShlbmdpbmUsIHZhbCk7XHJcbiAgICBzd2l0Y2ggKGpzVmFsdWVUeXBlKSB7XHJcbiAgICAgICAgY2FzZSA4OiByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZ09uU3RhY2sodmFsLCBsZW5ndGhPZmZzZXQpO1xyXG4gICAgICAgIGNhc2UgMTY6IHJldHVybiArdmFsO1xyXG4gICAgICAgIGNhc2UgMzI6IHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodmFsKTtcclxuICAgICAgICBjYXNlIDY0OiByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KHZhbCkuaWQ7XHJcbiAgICAgICAgY2FzZSAxMjg6IHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3QodmFsKS5pZDtcclxuICAgICAgICBjYXNlIDI1NjogcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKHZhbCkuaWQ7XHJcbiAgICAgICAgY2FzZSAxMDI0OiB7XHJcbiAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcilcclxuICAgICAgICAgICAgICAgIHZhbCA9IG5ldyBVaW50OEFycmF5KHZhbCk7XHJcbiAgICAgICAgICAgIGxldCBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyh2YWwuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQVTguc2V0KHZhbCwgcHRyKTtcclxuICAgICAgICAgICAgc2V0T3V0VmFsdWUzMihlbmdpbmUsIGxlbmd0aE9mZnNldCwgdmFsLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICByZXR1cm4gcHRyO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1saWJyYXJ5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0TnVtYmVyRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBudW1iZXIge1xyXG4vLyAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldERhdGVGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IG51bWJlciB7XHJcbi8vICAgICByZXR1cm4gKGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSkgYXMgRGF0ZSkuZ2V0VGltZSgpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRTdHJpbmdGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgLypvdXQgaW50ICovbGVuZ3RoT2Zmc2V0OiBudW1iZXIsIGlzQnlSZWY6IGJvb2wpOiBudW1iZXIge1xyXG4vLyAgICAgdmFyIHJldHVyblN0ciA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxzdHJpbmc+KHZhbHVlKTtcclxuLy8gICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgbGVuZ3RoT2Zmc2V0KTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0Qm9vbGVhbkZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogYm9vbGVhbiB7XHJcbi8vICAgICByZXR1cm4gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gVmFsdWVJc0JpZ0ludChlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogYm9vbGVhbiB7XHJcbi8vICAgICB2YXIgYmlnaW50ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPGFueT4odmFsdWUpO1xyXG4vLyAgICAgcmV0dXJuIGJpZ2ludCBpbnN0YW5jZW9mIEJpZ0ludDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0QmlnSW50RnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcclxuLy8gICAgIHZhciBiaWdpbnQgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8YW55Pih2YWx1ZSk7XHJcbi8vICAgICByZXR1cm4gYmlnaW50O1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRPYmplY3RGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4vLyAgICAgdmFyIG5hdGl2ZU9iamVjdCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbi8vICAgICByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KG5hdGl2ZU9iamVjdCk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEZ1bmN0aW9uRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBKU0Z1bmN0aW9uUHRyIHtcclxuLy8gICAgIHZhciBmdW5jID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPCguLi5hcmdzOiBhbnlbXSkgPT4gYW55Pih2YWx1ZSk7XHJcbi8vICAgICB2YXIganNmdW5jID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuYyk7XHJcbi8vICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRKU09iamVjdEZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XHJcbi8vICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPCguLi5hcmdzOiBhbnlbXSkgPT4gYW55Pih2YWx1ZSk7XHJcbi8vICAgICB2YXIganNvYmogPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3Qob2JqKTtcclxuLy8gICAgIHJldHVybiBqc29iai5pZDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgLypvdXQgaW50ICovbGVuZ3RoT2Zmc2V0OiBhbnksIGlzT3V0OiBib29sKSB7XHJcbi8vICAgICB2YXIgYWIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8QXJyYXlCdWZmZXI+KHZhbHVlKTtcclxuLy8gICAgIGlmIChhYiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuLy8gICAgICAgICBhYiA9IGFiLmJ1ZmZlcjtcclxuLy8gICAgIH1cclxuLy8gICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcclxuLy8gICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XHJcbi8vICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW2xlbmd0aE9mZnNldCA+PiAyXSA9IGFiLmJ5dGVMZW5ndGg7XHJcbi8vICAgICBzZXRPdXRWYWx1ZTMyKGVuZ2luZSwgbGVuZ3RoT2Zmc2V0LCBhYi5ieXRlTGVuZ3RoKTtcclxuLy8gICAgIHJldHVybiBwdHI7XHJcbi8vIH1cclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEpT6LCD55SoQyPml7bvvIxDI+S+p+iOt+WPlkpT6LCD55So5Y+C5pWw55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU0FyZ3VtZW50QVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAvKioqKioqKioqKirov5npg6jliIbnjrDlnKjpg73mmK9DKyvlrp7njrDnmoQqKioqKioqKioqKiovXHJcbiAgICAgICAgLy8gR2V0TnVtYmVyRnJvbVZhbHVlOiBHZXROdW1iZXJGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldERhdGVGcm9tVmFsdWU6IEdldERhdGVGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldFN0cmluZ0Zyb21WYWx1ZTogR2V0U3RyaW5nRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRCb29sZWFuRnJvbVZhbHVlOiBHZXRCb29sZWFuRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBWYWx1ZUlzQmlnSW50OiBWYWx1ZUlzQmlnSW50LmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRCaWdJbnRGcm9tVmFsdWU6IEdldEJpZ0ludEZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0T2JqZWN0RnJvbVZhbHVlOiBHZXRPYmplY3RGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEZ1bmN0aW9uRnJvbVZhbHVlOiBHZXRGdW5jdGlvbkZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0SlNPYmplY3RGcm9tVmFsdWU6IEdldEpTT2JqZWN0RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRBcnJheUJ1ZmZlckZyb21WYWx1ZTogR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEFyZ3VtZW50VHlwZTogZnVuY3Rpb24gKGlzb2xhdGU6IEludFB0ciwgaW5mbzogTW9ja0ludFB0ciwgaW5kZXg6IGludCwgaXNCeVJlZjogYm9vbCkge1xyXG4gICAgICAgIC8vICAgICB2YXIgdmFsdWUgPSBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvLCBlbmdpbmUpLmFyZ3NbaW5kZXhdO1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gR2V0VHlwZShlbmdpbmUsIHZhbHVlKTtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIC8vIC8qKlxyXG4gICAgICAgIC8vICAqIOS4umMj5L6n5o+Q5L6b5LiA5Liq6I635Y+WY2FsbGJhY2tpbmZv6YeManN2YWx1ZeeahGludHB0cueahOaOpeWPo1xyXG4gICAgICAgIC8vICAqIOW5tuS4jeaYr+W+l+eahOWIsOi/meS4qmFyZ3VtZW5055qE5YC8XHJcbiAgICAgICAgLy8gICpcclxuICAgICAgICAvLyAgKiDor6XmjqXlj6Plj6rmnInkvY3ov5DnrpfvvIznlLFDKyvlrp7njrBcclxuICAgICAgICAvLyAgKi9cclxuICAgICAgICAvLyBHZXRBcmd1bWVudFZhbHVlLyppbkNhbGxiYWNrSW5mbyovOiBmdW5jdGlvbiAoaW5mb3B0cjogTW9ja0ludFB0ciwgaW5kZXg6IGludCkge1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gaW5mb3B0ciB8IGluZGV4O1xyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgICAgLy8gR2V0SnNWYWx1ZVR5cGU6IGZ1bmN0aW9uIChpc29sYXRlOiBJbnRQdHIsIHZhbDogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4gICAgICAgIC8vICAgICAvLyBwdWJsaWMgZW51bSBKc1ZhbHVlVHlwZVxyXG4gICAgICAgIC8vICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIC8vICAgICBOdWxsT3JVbmRlZmluZWQgPSAxLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQmlnSW50ID0gMixcclxuICAgICAgICAvLyAgICAgLy8gICAgIE51bWJlciA9IDQsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBTdHJpbmcgPSA4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQm9vbGVhbiA9IDE2LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgTmF0aXZlT2JqZWN0ID0gMzIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBKc09iamVjdCA9IDY0LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQXJyYXkgPSAxMjgsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBGdW5jdGlvbiA9IDI1NixcclxuICAgICAgICAvLyAgICAgLy8gICAgIERhdGUgPSA1MTIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBBcnJheUJ1ZmZlciA9IDEwMjQsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBVbmtub3cgPSAyMDQ4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQW55ID0gTnVsbE9yVW5kZWZpbmVkIHwgQmlnSW50IHwgTnVtYmVyIHwgU3RyaW5nIHwgQm9vbGVhbiB8IE5hdGl2ZU9iamVjdCB8IEFycmF5IHwgRnVuY3Rpb24gfCBEYXRlIHwgQXJyYXlCdWZmZXIsXHJcbiAgICAgICAgLy8gICAgIC8vIH07XHJcbiAgICAgICAgLy8gICAgIHZhciB2YWx1ZTogYW55ID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsLCBlbmdpbmUpO1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gR2V0VHlwZShlbmdpbmUsIHZhbHVlKTtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIC8qKioqKioqKioqKuS7peS4iueOsOWcqOmDveaYr0MrK+WunueOsOeahCoqKioqKioqKioqKi9cclxuICAgICAgICBHZXRUeXBlSWRGcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgaWYgKGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIG9iaiA9IG9ialswXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgdHlwZWlkID0gMDtcclxuICAgICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSBvYmouX2Z1bmNbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gb2JqW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZmluZCB0eXBlaWQgZm9yJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU0FyZ3VtZW50QVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1nZXRGcm9tSlNBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEMj6LCD55SoSlPml7bvvIzojrflj5ZKU+WHveaVsOi/lOWbnuWAvFxyXG4gKlxyXG4gKiDljp/mnInnmoRyZXN1bHRJbmZv6K6+6K6h5Ye65p2l5Y+q5piv5Li65LqG6K6p5aSaaXNvbGF0ZeaXtuiDveWcqOS4jeWQjOeahGlzb2xhdGXph4zkv53mjIHkuI3lkIznmoRyZXN1bHRcclxuICog5ZyoV2ViR0zmqKHlvI/kuIvmsqHmnInov5nkuKrng6bmgbzvvIzlm6DmraTnm7TmjqXnlKhlbmdpbmXnmoTljbPlj69cclxuICogcmVzdWx0SW5mb+WbuuWumuS4ujEwMjRcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kR2V0RnJvbUpTUmV0dXJuQVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBHZXROdW1iZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldERhdGVGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdC5nZXRUaW1lKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRTdHJpbmdGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9UZW1wQ1NTdHJpbmcoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCwgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEJvb2xlYW5Gcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlc3VsdElzQmlnSW50OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gKDAsIGxpYnJhcnlfMS5pc0JpZ0ludCkoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRCaWdJbnRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICAvLyBwdWVydHMgY29yZSB2Mi4wLjTlvIDlp4vmlK/mjIFcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEucmV0dXJuQmlnSW50KShlbmdpbmUsIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0T2JqZWN0RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldFR5cGVJZEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gdmFsdWUuX2Z1bmNbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gdmFsdWVbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdHlwZWlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBmaW5kIHR5cGVpZCBmb3InICsgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRGdW5jdGlvbkZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRKU09iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBqc29iaiA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3QoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc29iai5pZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEFycmF5QnVmZmVyRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGFiID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICAgICAgdmFyIHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKGFiLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDguc2V0KG5ldyBJbnQ4QXJyYXkoYWIpLCBwdHIpO1xyXG4gICAgICAgICAgICAoMCwgbGlicmFyeV8xLnNldE91dFZhbHVlMzIpKGVuZ2luZSwgbGVuZ3RoLCBhYi5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHB0cjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8v5L+d5a6I5pa55qGIXHJcbiAgICAgICAgR2V0UmVzdWx0VHlwZTogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuR2V0VHlwZSkoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kR2V0RnJvbUpTUmV0dXJuQVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1nZXRGcm9tSlNSZXR1cm4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiDms6jlhoznsbtBUEnvvIzlpoLms6jlhozlhajlsYDlh73mlbDjgIHms6jlhoznsbvvvIzku6Xlj4rnsbvnmoTlsZ7mgKfmlrnms5XnrYlcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEkoZW5naW5lKSB7XHJcbiAgICBjb25zdCByZXR1cm5lZSA9IHtcclxuICAgICAgICBTZXRHbG9iYWxGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIG5hbWVTdHJpbmcsIHY4RnVuY3Rpb25DYWxsYmFjaywganNFbnZJZHgsIGNhbGxiYWNraWR4KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICBsaWJyYXJ5XzEuZ2xvYmFsW25hbWVdID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24odHJ1ZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfUmVnaXN0ZXJDbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwganNFbnZJZHgsIGNhbGxiYWNraWR4LCBzaXplKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxOYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhmdWxsTmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNzaGFycE9iamVjdE1hcCA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXA7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICBsZXQgdGVtcEV4dGVybmFsQ1NJRCA9IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IGN0b3IgPSBmdW5jdGlvbiBOYXRpdmVPYmplY3QoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDorr7nva7nsbvlnotJRFxyXG4gICAgICAgICAgICAgICAgdGhpc1tcIiRjaWRcIl0gPSBpZDtcclxuICAgICAgICAgICAgICAgIC8vIG5hdGl2ZU9iamVjdOeahOaehOmAoOWHveaVsFxyXG4gICAgICAgICAgICAgICAgLy8g5p6E6YCg5Ye95pWw5pyJ5Lik5Liq6LCD55So55qE5Zyw5pa577yaMS4ganPkvqduZXfkuIDkuKrlroPnmoTml7blgJkgMi4gY3PkvqfliJvlu7rkuobkuIDkuKrlr7nosaHopoHkvKDliLBqc+S+p+aXtlxyXG4gICAgICAgICAgICAgICAgLy8g56ys5LiA5Liq5oOF5Ya177yMY3Plr7nosaFJROaIluiAheaYr2NhbGxWOENvbnN0cnVjdG9yQ2FsbGJhY2vov5Tlm57nmoTjgIJcclxuICAgICAgICAgICAgICAgIC8vIOesrOS6jOS4quaDheWGte+8jOWImWNz5a+56LGhSUTmmK9jcyBuZXflrozkuYvlkI7kuIDlubbkvKDnu5lqc+eahOOAglxyXG4gICAgICAgICAgICAgICAgbGV0IGNzSUQgPSB0ZW1wRXh0ZXJuYWxDU0lEOyAvLyDlpoLmnpzmmK/nrKzkuozkuKrmg4XlhrXvvIzmraRJROeUsWNyZWF0ZUZyb21DU+iuvue9rlxyXG4gICAgICAgICAgICAgICAgdGVtcEV4dGVybmFsQ1NJRCA9IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3NJRCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb1B0ciA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0TW9ja1BvaW50ZXIoYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6Jm954S2cHVlcnRz5YaFQ29uc3RydWN0b3LnmoTov5Tlm57lgLzlj6tzZWxm77yM5L2G5a6D5YW25a6e5bCx5pivQ1Plr7nosaHnmoTkuIDkuKppZOiAjOW3suOAglxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzSUQgPSBlbmdpbmUuY2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2soY29uc3RydWN0b3IsIGNhbGxiYWNrSW5mb1B0ciwgYXJncy5sZW5ndGgsIGNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5SZWxlYXNlQnlNb2NrSW50UHRyKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gYmxpdHRhYmxlXHJcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjc05ld0lEID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2Moc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLm1lbWNweShjc05ld0lELCBjc0lELCBzaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuYWRkKGNzTmV3SUQsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICgwLCBsaWJyYXJ5XzEuT25GaW5hbGl6ZSkodGhpcywgY3NOZXdJRCwgKGNzSWRlbnRpZmllcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAucmVtb3ZlKGNzSWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5fZnJlZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc0lELCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzSUQsIChjc0lkZW50aWZpZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLnJlbW92ZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhkZXN0cnVjdG9yIHx8IGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciwgY3NJZGVudGlmaWVyLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGN0b3IuY3JlYXRlRnJvbUNTID0gZnVuY3Rpb24gKGNzSUQpIHtcclxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSBjc0lEO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGN0b3IuX19wdWVydHNNZXRhZGF0YSA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwibmFtZVwiLCB7IHZhbHVlOiBmdWxsTmFtZSArIFwiQ29uc3RydWN0b3JcIiB9KTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwiJGNpZFwiLCB7IHZhbHVlOiBpZCB9KTtcclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMucHVzaChjdG9yKTtcclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzSURXZWFrTWFwLnNldChjdG9yLCBpZCk7XHJcbiAgICAgICAgICAgIGlmIChCYXNlVHlwZUlkID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY3Rvci5wcm90b3R5cGUuX19wcm90b19fID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbQmFzZVR5cGVJZF0ucHJvdG90eXBlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5uYW1lc1RvQ2xhc3Nlc0lEW2Z1bGxOYW1lXSA9IGlkO1xyXG4gICAgICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZWdpc3RlclN0cnVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCwgc2l6ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuZWUuX1JlZ2lzdGVyQ2xhc3MoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCBjYWxsYmFja2lkeCwgY2FsbGJhY2tpZHgsIHNpemUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBjYWxsYmFjaywgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCkge1xyXG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgICAgICBpZiAoIWNscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBmbiA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBjYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgaWYgKGlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICBjbHNbbmFtZV0gPSBmbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNscy5wcm90b3R5cGVbbmFtZV0gPSBmbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJQcm9wZXJ0eTogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBnZXR0ZXIsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBnZXR0ZXJqc0VudklkeCwgXHJcbiAgICAgICAgLypsb25nICovIGdldHRlcmNhbGxiYWNraWR4LCBzZXR0ZXIsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJqc0VudklkeCwgXHJcbiAgICAgICAgLypsb25nICovIHNldHRlcmNhbGxiYWNraWR4LCBkb250RGVsZXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBjbHMgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbY2xhc3NJRF07XHJcbiAgICAgICAgICAgIGlmICghY2xzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIHZhciBhdHRyID0ge1xyXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiAhZG9udERlbGV0ZSxcclxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChnZXR0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGF0dHIuZ2V0ID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGdldHRlciwgZ2V0dGVyY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzZXR0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGF0dHIuc2V0ID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIHNldHRlciwgc2V0dGVyY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscywgbmFtZSwgYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xzLnByb3RvdHlwZSwgbmFtZSwgYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgfTtcclxuICAgIHJldHVybiByZXR1cm5lZTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRSZWdpc3RlckFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmVnaXN0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBDI+iwg+eUqEpT5pe277yM6K6+572u6LCD55So5Y+C5pWw55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSW52b2tlSlNBcmd1bWVudEFwaShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgLy9iZWdpbiBjcyBjYWxsIGpzXHJcbiAgICAgICAgUHVzaE51bGxGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChudWxsKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hEYXRlRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgZGF0ZVZhbHVlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChuZXcgRGF0ZShkYXRlVmFsdWUpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hCb29sZWFuRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgYikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goISFiKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hCaWdJbnRGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKmxvbmcgKi8gbG9uZ2xvdywgbG9uZ2hpZ2gpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKCgwLCBsaWJyYXJ5XzEubWFrZUJpZ0ludCkobG9uZ2xvdywgbG9uZ2hpZ2gpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hTdHJpbmdGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoTnVtYmVyRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgZCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgY2xhc3NJRCwgb2JqZWN0SUQpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KG9iamVjdElELCBjbGFzc0lEKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoSlNGdW5jdGlvbkZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIEpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKEpTRnVuY3Rpb24pLl9mdW5jKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hKU09iamVjdEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIEpTT2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU09iamVjdEJ5SWQoSlNPYmplY3QpLmdldE9iamVjdCgpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hBcnJheUJ1ZmZlckZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qYnl0ZVtdICovIGluZGV4LCBsZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0ludm9rZUpTQXJndW1lbnRBcGk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSW52b2tlSlNBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEpT6LCD55SoQyPml7bvvIxDI+iuvue9rui/lOWbnuWIsEpT55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSlNJbnZva2VSZXR1cm5BcGkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIFJldHVybkNsYXNzOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgY2xhc3NJRCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbY2xhc3NJRF07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5PYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBjbGFzc0lELCBzZWxmKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KHNlbGYsIGNsYXNzSUQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuTnVtYmVyOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG51bWJlcjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVyblN0cmluZzogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHN0clN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCBzdHIgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZyk7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IHN0cjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkJpZ0ludDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGxvbmdMb3csIGxvbmdIaWdoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9ICgwLCBsaWJyYXJ5XzEubWFrZUJpZ0ludCkobG9uZ0xvdywgbG9uZ0hpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQm9vbGVhbjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gISFiOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuRGF0ZTogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGRhdGUpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5OdWxsOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbykge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBudWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBKU0Z1bmN0aW9uUHRyKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzRnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKEpTRnVuY3Rpb25QdHIpO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBqc0Z1bmMuX2Z1bmM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5KU09iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIEpTT2JqZWN0UHRyKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzT2JqZWN0ID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNPYmplY3RCeUlkKEpTT2JqZWN0UHRyKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0ganNPYmplY3QuZ2V0T2JqZWN0KCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5DU2hhcnBGdW5jdGlvbkNhbGxiYWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgdjhGdW5jdGlvbkNhbGxiYWNrLCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckxvdywgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJIaWdoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGZhbHNlLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIHBvaW50ZXJIaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkNTaGFycEZ1bmN0aW9uQ2FsbGJhY2syOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgdjhGdW5jdGlvbkNhbGxiYWNrLCBKc0Z1bmN0aW9uRmluYWxpemUsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVyTG93LCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckhpZ2gpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oZmFsc2UsIHY4RnVuY3Rpb25DYWxsYmFjaywgcG9pbnRlckhpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQXJyYXlCdWZmZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCAvKmJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0pTSW52b2tlUmV0dXJuQXBpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0pTSW52b2tlUmV0dXJuLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogSlPosIPnlKhDI+aXtu+8jEMj5L6n6K6+572ub3V05Y+C5pWw5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgU2V0TnVtYmVyVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBudW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG51bWJlcjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldERhdGVUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGRhdGUpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0U3RyaW5nVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gc3RyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0Qm9vbGVhblRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgYikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gISFiOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0QmlnSW50VG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBsb3csIGhpZ2gpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb3csIGhpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0T2JqZWN0VG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBjbGFzc0lELCBzZWxmKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChzZWxmLCBjbGFzc0lEKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldE51bGxUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG51bGw7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRBcnJheUJ1ZmZlclRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgLypCeXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9KU091dEFyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuV2ViR0xSZWdzdGVyQXBpID0gZXhwb3J0cy5HZXRXZWJHTEZGSUFwaSA9IHZvaWQgMDtcclxuY29uc3QgQnVmZmVyID0gcmVxdWlyZShcIi4vYnVmZmVyXCIpO1xyXG52YXIgSlNUYWc7XHJcbihmdW5jdGlvbiAoSlNUYWcpIHtcclxuICAgIC8qIGFsbCB0YWdzIHdpdGggYSByZWZlcmVuY2UgY291bnQgYXJlIG5lZ2F0aXZlICovXHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19GSVJTVFwiXSA9IC05XSA9IFwiSlNfVEFHX0ZJUlNUXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19TVFJJTkdcIl0gPSAtOV0gPSBcIkpTX1RBR19TVFJJTkdcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0JVRkZFUlwiXSA9IC04XSA9IFwiSlNfVEFHX0JVRkZFUlwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfRVhDRVBUSU9OXCJdID0gLTddID0gXCJKU19UQUdfRVhDRVBUSU9OXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19OQVRJVkVfT0JKRUNUXCJdID0gLTRdID0gXCJKU19UQUdfTkFUSVZFX09CSkVDVFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfQVJSQVlcIl0gPSAtM10gPSBcIkpTX1RBR19BUlJBWVwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfRlVOQ1RJT05cIl0gPSAtMl0gPSBcIkpTX1RBR19GVU5DVElPTlwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfT0JKRUNUXCJdID0gLTFdID0gXCJKU19UQUdfT0JKRUNUXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19JTlRcIl0gPSAwXSA9IFwiSlNfVEFHX0lOVFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfQk9PTFwiXSA9IDFdID0gXCJKU19UQUdfQk9PTFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfTlVMTFwiXSA9IDJdID0gXCJKU19UQUdfTlVMTFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfVU5ERUZJTkVEXCJdID0gM10gPSBcIkpTX1RBR19VTkRFRklORURcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX1VOSU5JVElBTElaRURcIl0gPSA0XSA9IFwiSlNfVEFHX1VOSU5JVElBTElaRURcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0ZMT0FUNjRcIl0gPSA1XSA9IFwiSlNfVEFHX0ZMT0FUNjRcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0lOVDY0XCJdID0gNl0gPSBcIkpTX1RBR19JTlQ2NFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfVUlOVDY0XCJdID0gN10gPSBcIkpTX1RBR19VSU5UNjRcIjtcclxufSkoSlNUYWcgfHwgKEpTVGFnID0ge30pKTtcclxuY2xhc3MgU2NvcGUge1xyXG4gICAgc3RhdGljIGN1cnJlbnQgPSB1bmRlZmluZWQ7XHJcbiAgICBzdGF0aWMgZ2V0Q3VycmVudCgpIHtcclxuICAgICAgICByZXR1cm4gU2NvcGUuY3VycmVudDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBlbnRlcigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFNjb3BlKCk7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZXhpdCgpIHtcclxuICAgICAgICBTY29wZS5jdXJyZW50LmNsb3NlKCk7XHJcbiAgICB9XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnByZXZTY29wZSA9IFNjb3BlLmN1cnJlbnQ7XHJcbiAgICAgICAgU2NvcGUuY3VycmVudCA9IHRoaXM7XHJcbiAgICB9XHJcbiAgICBjbG9zZSgpIHtcclxuICAgICAgICBTY29wZS5jdXJyZW50ID0gdGhpcy5wcmV2U2NvcGU7XHJcbiAgICB9XHJcbiAgICBhZGRUb1Njb3BlKG9iaikge1xyXG4gICAgICAgIHRoaXMub2JqZWN0c0luU2NvcGUucHVzaChvYmopO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdHNJblNjb3BlLmxlbmd0aCAtIDE7XHJcbiAgICB9XHJcbiAgICBnZXRGcm9tU2NvcGUoaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RzSW5TY29wZVtpbmRleF07XHJcbiAgICB9XHJcbiAgICB0b0pzKGVuZ2luZSwgb2JqTWFwcGVyLCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCB2YWxUeXBlID0gQnVmZmVyLnJlYWRJbnQzMihlbmdpbmUudW5pdHlBcGkuSEVBUFU4LCBwdmFsdWUgKyA4KTtcclxuICAgICAgICBpZiAodmFsVHlwZSA8PSBKU1RhZy5KU19UQUdfT0JKRUNUICYmIHZhbFR5cGUgPj0gSlNUYWcuSlNfVEFHX0FSUkFZKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9iaklkeCA9IEJ1ZmZlci5yZWFkSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGVbb2JqSWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbFR5cGUgPT0gSlNUYWcuSlNfVEFHX05BVElWRV9PQkpFQ1QpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JqSWQgPSBCdWZmZXIucmVhZEludDMyKGVuZ2luZS51bml0eUFwaS5IRUFQVTgsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmpNYXBwZXIuZmluZE5hdGl2ZU9iamVjdChvYmpJZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN3aXRjaCAodmFsVHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19CT09MOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEJ1ZmZlci5yZWFkSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgcHZhbHVlKSAhPSAwO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19JTlQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRJbnQzMihlbmdpbmUudW5pdHlBcGkuSEVBUFU4LCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19OVUxMOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0ZMT0FUNjQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWREb3VibGUoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfSU5UNjQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRJbnQ2NChlbmdpbmUudW5pdHlBcGkuSEVBUFU4LCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19VSU5UNjQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRVSW50NjQoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfU1RSSU5HOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocHZhbHVlKTtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfQlVGRkVSOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZlN0YXJ0ID0gQnVmZmVyLnJlYWRJbnQzMihlbmdpbmUudW5pdHlBcGkuSEVBUFU4LCBwdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZkxlbiA9IEJ1ZmZlci5yZWFkSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgcHZhbHVlICsgMTIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoYnVmZlN0YXJ0LCBidWZmU3RhcnQgKyBidWZmTGVuKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBwcmV2U2NvcGUgPSB1bmRlZmluZWQ7XHJcbiAgICBvYmplY3RzSW5TY29wZSA9IFtdO1xyXG59XHJcbmNsYXNzIE9iamVjdFBvb2wge1xyXG4gICAgc3RvcmFnZSA9IG5ldyBNYXAoKTtcclxuICAgIGdjSXRlcmF0b3I7XHJcbiAgICBnY1RpbWVvdXQgPSBudWxsO1xyXG4gICAgaXNHY1J1bm5pbmcgPSBmYWxzZTtcclxuICAgIC8vIEdDIGNvbmZpZ3VyYXRpb24gZGVmYXVsdHNcclxuICAgIGdjQmF0Y2hTaXplID0gMTAwO1xyXG4gICAgZ2NJbnRlcnZhbE1zID0gNTA7XHJcbiAgICBjbGVhbnVwQ2FsbGJhY2sgPSB1bmRlZmluZWQ7XHJcbiAgICBjb25zdHJ1Y3RvcihjbGVhbnVwQ2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLmNsZWFudXBDYWxsYmFjayA9IGNsZWFudXBDYWxsYmFjaztcclxuICAgIH1cclxuICAgIGFkZChvYmpJZCwgdmFsdWUsIHR5cGVJZCwgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgY29uc3QgcmVmID0gbmV3IFdlYWtSZWYodmFsdWUpO1xyXG4gICAgICAgIHRoaXMuc3RvcmFnZS5zZXQob2JqSWQsIFtyZWYsIHR5cGVJZCwgY2FsbEZpbmFsaXplXSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBnZXQob2JqSWQpIHtcclxuICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuc3RvcmFnZS5nZXQob2JqSWQpO1xyXG4gICAgICAgIGlmICghZW50cnkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBbcmVmLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZV0gPSBlbnRyeTtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IHJlZi5kZXJlZigpO1xyXG4gICAgICAgIGlmICghdmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5zdG9yYWdlLmRlbGV0ZShvYmpJZCk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYW51cENhbGxiYWNrKG9iaklkLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuICAgIGhhcyhvYmpJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0b3JhZ2UuaGFzKG9iaklkKTtcclxuICAgIH1cclxuICAgIGZ1bGxHYygpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IFtvYmpJZF0gb2YgdGhpcy5zdG9yYWdlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0KG9iaklkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gT25seSByZXNldCBpdGVyYXRvciBpZiBHQyBpcyBydW5uaW5nIHRvIG1haW50YWluIGl0ZXJhdGlvbiBzdGF0ZVxyXG4gICAgICAgIGlmICh0aGlzLmlzR2NSdW5uaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2NJdGVyYXRvciA9IHRoaXMuc3RvcmFnZS5rZXlzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gU3RhcnQgaW5jcmVtZW50YWwgZ2FyYmFnZSBjb2xsZWN0aW9uIHdpdGggY29uZmlndXJhYmxlIHBhcmFtZXRlcnNcclxuICAgIHN0YXJ0SW5jcmVtZW50YWxHYyhiYXRjaFNpemUgPSAxMDAsIGludGVydmFsTXMgPSA1MCkge1xyXG4gICAgICAgIGlmICh0aGlzLmlzR2NSdW5uaW5nKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdGhpcy5pc0djUnVubmluZyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5nY0JhdGNoU2l6ZSA9IE1hdGgubWF4KDEsIGJhdGNoU2l6ZSk7XHJcbiAgICAgICAgdGhpcy5nY0ludGVydmFsTXMgPSBNYXRoLm1heCgwLCBpbnRlcnZhbE1zKTtcclxuICAgICAgICB0aGlzLmdjSXRlcmF0b3IgPSB0aGlzLnN0b3JhZ2Uua2V5cygpO1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc0djQmF0Y2goKTtcclxuICAgIH1cclxuICAgIC8vIFN0b3AgaW5jcmVtZW50YWwgZ2FyYmFnZSBjb2xsZWN0aW9uXHJcbiAgICBzdG9wSW5jcmVtZW50YWxHYygpIHtcclxuICAgICAgICB0aGlzLmlzR2NSdW5uaW5nID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKHRoaXMuZ2NUaW1lb3V0KSB7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmdjVGltZW91dCk7XHJcbiAgICAgICAgICAgIHRoaXMuZ2NUaW1lb3V0ID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBwcm9jZXNzR2NCYXRjaCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNHY1J1bm5pbmcpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBsZXQgcHJvY2Vzc2VkID0gMDtcclxuICAgICAgICBsZXQgbmV4dCA9IHRoaXMuZ2NJdGVyYXRvci5uZXh0KCk7XHJcbiAgICAgICAgd2hpbGUgKCFuZXh0LmRvbmUgJiYgcHJvY2Vzc2VkIDwgdGhpcy5nY0JhdGNoU2l6ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmdldChuZXh0LnZhbHVlKTtcclxuICAgICAgICAgICAgcHJvY2Vzc2VkKys7XHJcbiAgICAgICAgICAgIG5leHQgPSB0aGlzLmdjSXRlcmF0b3IubmV4dCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobmV4dC5kb25lKSB7XHJcbiAgICAgICAgICAgIC8vIFJlc3RhcnQgaXRlcmF0b3IgZm9yIG5leHQgcm91bmRcclxuICAgICAgICAgICAgdGhpcy5nY0l0ZXJhdG9yID0gdGhpcy5zdG9yYWdlLmtleXMoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5nY1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMucHJvY2Vzc0djQmF0Y2goKSwgdGhpcy5nY0ludGVydmFsTXMpO1xyXG4gICAgfVxyXG59XHJcbmNsYXNzIENsYXNzUmVnaXN0ZXIge1xyXG4gICAgc3RhdGljIGluc3RhbmNlO1xyXG4gICAgY29uc3RydWN0b3IoKSB7IH1cclxuICAgIGNsYXNzTm90Rm91bmQgPSB1bmRlZmluZWQ7XHJcbiAgICB0eXBlSWRUb0NsYXNzID0gbmV3IE1hcCgpO1xyXG4gICAgc3RhdGljIGdldEluc3RhbmNlKCkge1xyXG4gICAgICAgIGlmICghQ2xhc3NSZWdpc3Rlci5pbnN0YW5jZSkge1xyXG4gICAgICAgICAgICBDbGFzc1JlZ2lzdGVyLmluc3RhbmNlID0gbmV3IENsYXNzUmVnaXN0ZXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIENsYXNzUmVnaXN0ZXIuaW5zdGFuY2U7XHJcbiAgICB9XHJcbiAgICBsb2FkQ2xhc3NCeUlkKHR5cGVJZCkge1xyXG4gICAgICAgIGNvbnN0IGNscyA9IHRoaXMudHlwZUlkVG9DbGFzcy5nZXQodHlwZUlkKTtcclxuICAgICAgICBpZiAoY2xzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjbHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jbGFzc05vdEZvdW5kICYmIHRoaXMuY2xhc3NOb3RGb3VuZCh0eXBlSWQpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50eXBlSWRUb0NsYXNzLmdldCh0eXBlSWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVnaXN0ZXJDbGFzcyh0eXBlSWQsIGNscykge1xyXG4gICAgICAgIHRoaXMudHlwZUlkVG9DbGFzcy5zZXQodHlwZUlkLCBjbHMpO1xyXG4gICAgfVxyXG4gICAgZmluZENsYXNzQnlJZCh0eXBlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50eXBlSWRUb0NsYXNzLmdldCh0eXBlSWQpO1xyXG4gICAgfVxyXG4gICAgc2V0Q2xhc3NOb3RGb3VuZENhbGxiYWNrKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc05vdEZvdW5kID0gY2FsbGJhY2s7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gbWFrZU5hdGl2ZUZ1bmN0aW9uV3JhcChlbmdpbmUsIGlzU3RhdGljLCBuYXRpdmVfaW1wbCwgZGF0YSwgZmluYWxpemUpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xyXG4gICAgICAgIGlmIChuZXcudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignXCJub3QgYSBjb25zdHJ1Y3RvcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOYXRpdmVGdW5jdGlvbldyYXAgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9O1xyXG59XHJcbmNsYXNzIE9iamVjdE1hcHBlciB7XHJcbiAgICBvYmplY3RQb29sO1xyXG4gICAgY29uc3RydWN0b3IoY2xlYW51cENhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RQb29sID0gbmV3IE9iamVjdFBvb2woY2xlYW51cENhbGxiYWNrKTtcclxuICAgIH1cclxuICAgIHB1c2hOYXRpdmVPYmplY3Qob2JqSWQsIHR5cGVJZCwgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgbGV0IGpzT2JqID0gdGhpcy5vYmplY3RQb29sLmdldChvYmpJZCk7XHJcbiAgICAgICAgaWYgKCFqc09iaikge1xyXG4gICAgICAgICAgICBjb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkubG9hZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgICAgICBpZiAoY2xzKSB7XHJcbiAgICAgICAgICAgICAgICBqc09iaiA9IE9iamVjdC5jcmVhdGUoY2xzLnByb3RvdHlwZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9iamVjdFBvb2wuYWRkKG9iaklkLCBqc09iaiwgdHlwZUlkLCBjYWxsRmluYWxpemUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBqc09iajtcclxuICAgIH1cclxuICAgIGZpbmROYXRpdmVPYmplY3Qob2JqSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RQb29sLmdldChvYmpJZCk7XHJcbiAgICB9XHJcbn1cclxubGV0IHdlYmdsRkZJID0gdW5kZWZpbmVkO1xyXG4vLyDpnIDopoHlnKhVbml0eemHjOiwg+eUqFBsYXllclNldHRpbmdzLldlYkdMLmVtc2NyaXB0ZW5BcmdzID0gXCIgLXMgQUxMT1dfVEFCTEVfR1JPV1RIPTFcIjtcclxuZnVuY3Rpb24gR2V0V2ViR0xGRklBcGkoZW5naW5lKSB7XHJcbiAgICBpZiAod2ViZ2xGRkkpXHJcbiAgICAgICAgcmV0dXJuIHdlYmdsRkZJO1xyXG4gICAgY29uc3Qgb2JqTWFwcGVyID0gbmV3IE9iamVjdE1hcHBlcigob2JqSWQsIHR5cGVJZCwgY2FsbEZpbmFsaXplKSA9PiB7XHJcbiAgICAgICAgLy8gdG9kbzogY2FsbEZpbmFsaXplXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwib2JqZWN0IGZpbmFsaXplIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfSk7XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5YC85Yib5bu657O75YiXIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9udWxsKGVudikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfbnVsbCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfdW5kZWZpbmVkKGVudikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfdW5kZWZpbmVkIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9ib29sZWFuKGVudiwgdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2Jvb2xlYW4gbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2ludDMyKGVudiwgdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2ludDMyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8g57G75Ly85Zyw5aSE55CG5YW25LuW5Z+656GA57G75Z6L5Yib5bu65Ye95pWwXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX3VpbnQzMihlbnYsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV91aW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2ludDY0KGVudiwgdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2ludDY0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV91aW50NjQoZW52LCB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfdWludDY0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9kb3VibGUoZW52LCB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfZG91YmxlIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9zdHJpbmdfdXRmOChlbnYsIHN0ciwgbGVuZ3RoKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV9zdHJpbmdfdXRmOCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfYmluYXJ5KGVudiwgYmluLCBsZW5ndGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2JpbmFyeSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfYXJyYXkoZW52KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV9hcnJheSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfb2JqZWN0KGVudikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfb2JqZWN0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9mdW5jdGlvbihlbnYsIG5hdGl2ZV9pbXBsLCBkYXRhLCBmaW5hbGl6ZSkge1xyXG4gICAgICAgIHJldHVybiBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShtYWtlTmF0aXZlRnVuY3Rpb25XcmFwKGVuZ2luZSwgZmFsc2UsIG5hdGl2ZV9pbXBsLCBkYXRhLCBmaW5hbGl6ZSkpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9jbGFzcyhlbnYsIHR5cGVfaWQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2NsYXNzIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWAvOiOt+WPluezu+WIlyAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfYm9vbChlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfYm9vbCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfaW50MzIoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX2ludDMyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8g57G75Ly85aSE55CG5YW25LuW57G75Z6L6I635Y+WXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX3VpbnQzMihlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfdWludDMyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV9pbnQ2NChlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfaW50NjQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX3VpbnQ2NChlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfdWludDY0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV9kb3VibGUoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX2RvdWJsZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfc3RyaW5nX3V0ZjgoZW52LCBwdmFsdWUsIGJ1ZiwgYnVmc2l6ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfc3RyaW5nX3V0Zjggbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2JpbmFyeShlbnYsIHB2YWx1ZSwgYnVmc2l6ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfYmluYXJ5IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9hcnJheV9sZW5ndGgoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2FycmF5X2xlbmd0aCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLSDnsbvlnovmo4Dmn6Xns7vliJcgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfbnVsbChlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19udWxsIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX3VuZGVmaW5lZChlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc191bmRlZmluZWQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfYm9vbGVhbihlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19ib29sZWFuIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX2ludDMyKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2ludDMyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX3VpbnQzMihlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc191aW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfaW50NjQoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfaW50NjQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfdWludDY0KGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX3VpbnQ2NCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19kb3VibGUoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfZG91YmxlIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX3N0cmluZyhlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19zdHJpbmcgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfb2JqZWN0KGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX29iamVjdCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19mdW5jdGlvbihlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19mdW5jdGlvbiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19iaW5hcnkoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfYmluYXJ5IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX2FycmF5KGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2FycmF5IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWvueixoeaTjeS9nOezu+WIlyAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9uYXRpdmVfb2JqZWN0X3RvX3ZhbHVlKGVudiwgdHlwZUlkLCBvYmplY3RfcHRyLCBjYWxsX2ZpbmFsaXplKSB7XHJcbiAgICAgICAgY29uc3QganNPYmogPSBvYmpNYXBwZXIucHVzaE5hdGl2ZU9iamVjdChvYmplY3RfcHRyLCB0eXBlSWQsIGNhbGxfZmluYWxpemUpO1xyXG4gICAgICAgIHJldHVybiBvYmplY3RfcHRyO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9uYXRpdmVfb2JqZWN0X3B0cihlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfbmF0aXZlX29iamVjdF9wdHIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X25hdGl2ZV9vYmplY3RfdHlwZWlkKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9uYXRpdmVfb2JqZWN0X3R5cGVpZCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19pbnN0YW5jZV9vZihlbnYsIHR5cGVfaWQsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19pbnN0YW5jZV9vZiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLSDoo4XnrrEv5ouG566xIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2JveGluZyhlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9ib3hpbmcgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfdW5ib3hpbmcoZW52LCBwX2JveGVkX3ZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3VuYm94aW5nIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3VwZGF0ZV9ib3hlZF92YWx1ZShlbnYsIHBfYm94ZWRfdmFsdWUsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV91cGRhdGVfYm94ZWRfdmFsdWUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfYm94ZWRfdmFsdWUoZW52LCB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19ib3hlZF92YWx1ZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLSDlh73mlbDosIPnlKjnm7jlhbMgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X2FyZ3NfbGVuKHBpbmZvKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9hcmdzX2xlbiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfYXJnKHBpbmZvLCBpbmRleCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfYXJnIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9lbnYocGluZm8pIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2VudiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfbmF0aXZlX2hvbGRlcl9wdHIocGluZm8pIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X25hdGl2ZV9ob2xkZXJfcHRyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9ob2xkZXIocGluZm8pIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2hvbGRlciBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfdXNlcmRhdGEocGluZm8pIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3VzZXJkYXRhIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2FkZF9yZXR1cm4ocGluZm8sIHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2FkZF9yZXR1cm4gbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfdGhyb3dfYnlfc3RyaW5nKHBpbmZvLCBtc2cpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfdGhyb3dfYnlfc3RyaW5nIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOeOr+Wig+W8leeUqCAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfZW52X3JlZihlbnYpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2Vudl9yZWYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZW52X3JlZl9pc192YWxpZChwZW52X3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9lbnZfcmVmX2lzX3ZhbGlkIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9lbnZfZnJvbV9yZWYocGVudl9yZWYpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2Vudl9mcm9tX3JlZiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9kdXBsaWNhdGVfZW52X3JlZihwZW52X3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9kdXBsaWNhdGVfZW52X3JlZiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9yZWxlYXNlX2Vudl9yZWYocGVudl9yZWYpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfcmVsZWFzZV9lbnZfcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOS9nOeUqOWfn+euoeeQhiAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9vcGVuX3Njb3BlKHBlbnZfcmVmKSB7XHJcbiAgICAgICAgU2NvcGUuZW50ZXIoKTtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9vcGVuX3Njb3BlX3BsYWNlbWVudChwZW52X3JlZiwgbWVtb3J5KSB7XHJcbiAgICAgICAgU2NvcGUuZW50ZXIoKTtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9oYXNfY2F1Z2h0KHBzY29wZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9oYXNfY2F1Z2h0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9leGNlcHRpb25fYXNfc3RyaW5nKHBzY29wZSwgd2l0aF9zdGFjaykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfZXhjZXB0aW9uX2FzX3N0cmluZyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jbG9zZV9zY29wZShwc2NvcGUpIHtcclxuICAgICAgICBTY29wZS5leGl0KCk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50KHBzY29wZSkge1xyXG4gICAgICAgIFNjb3BlLmV4aXQoKTtcclxuICAgIH1cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLSDlgLzlvJXnlKggLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX3ZhbHVlX3JlZihlbnYsIHB2YWx1ZSwgaW50ZXJuYWxfZmllbGRfY291bnQpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX3ZhbHVlX3JlZiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9kdXBsaWNhdGVfdmFsdWVfcmVmKHB2YWx1ZV9yZWYpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZHVwbGljYXRlX3ZhbHVlX3JlZiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZihwdmFsdWVfcmVmKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3JlbGVhc2VfdmFsdWVfcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV9mcm9tX3JlZihlbnYsIHB2YWx1ZV9yZWYpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9yZWZfd2VhayhlbnYsIHB2YWx1ZV9yZWYpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfc2V0X3JlZl93ZWFrIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9vd25lcihlbnYsIHB2YWx1ZSwgcG93bmVyKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9vd25lciBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfcmVmX2Fzc29jaWF0ZWRfZW52KHZhbHVlX3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfcmVmX2Fzc29jaWF0ZWRfZW52IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9yZWZfaW50ZXJuYWxfZmllbGRzKHB2YWx1ZV9yZWYsIHBpbnRlcm5hbF9maWVsZF9jb3VudCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfcmVmX2ludGVybmFsX2ZpZWxkcyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLSDlsZ7mgKfmk43kvZwgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3Byb3BlcnR5KGVudiwgcG9iamVjdCwga2V5KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9wcm9wZXJ0eSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9zZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUsIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUsIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcml2YXRlKGVudiwgcG9iamVjdCwgb3V0X3B0cikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfcHJpdmF0ZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9zZXRfcHJpdmF0ZShlbnYsIHBvYmplY3QsIHB0cikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcHJpdmF0ZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfcHJvcGVydHlfdWludDMyKGVudiwgcG9iamVjdCwga2V5KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9wcm9wZXJ0eV91aW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMihlbnYsIHBvYmplY3QsIGtleSwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcHJvcGVydHk6IHRhcmdldCBpcyBub3QgYW4gb2JqZWN0XCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB2YWx1ZSA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZSwgb2JqTWFwcGVyLCBwdmFsdWUpO1xyXG4gICAgICAgIG9ialtrZXldID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5Ye95pWw6LCD55SoL+aJp+ihjCAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jYWxsX2Z1bmN0aW9uKGVudiwgcGZ1bmMsIHRoaXNfb2JqZWN0LCBhcmdjLCBhcmd2KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NhbGxfZnVuY3Rpb24gbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZXZhbChlbnYsIGNvZGUsIGNvZGVfc2l6ZSwgcGF0aCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9ldmFsIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWFqOWxgOWvueixoSAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nbG9iYWwoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGdsb2JhbFRoaXMpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOeOr+Wig+engeacieaVsOaNriAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfZW52X3ByaXZhdGUoZW52KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9lbnZfcHJpdmF0ZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9zZXRfZW52X3ByaXZhdGUoZW52LCBwdHIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfc2V0X2Vudl9wcml2YXRlIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYXBpSW5mbyA9IFtcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfbnVsbCwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfdW5kZWZpbmVkLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9ib29sZWFuLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfaW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV91aW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9pbnQ2NCwgc2lnOiBcImlqaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX3VpbnQ2NCwgc2lnOiBcImlqaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2RvdWJsZSwgc2lnOiBcImlpZFwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX3N0cmluZ191dGY4LCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2JpbmFyeSwgc2lnOiBcImlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9hcnJheSwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfb2JqZWN0LCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9mdW5jdGlvbiwgc2lnOiBcImlpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfY2xhc3MsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV9ib29sLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfaW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV91aW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV9pbnQ2NCwgc2lnOiBcImppaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX3VpbnQ2NCwgc2lnOiBcImppaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX2RvdWJsZSwgc2lnOiBcImRpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX3N0cmluZ191dGY4LCBzaWc6IFwiaWlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV9iaW5hcnksIHNpZzogXCJpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19udWxsLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc191bmRlZmluZWQsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2Jvb2xlYW4sIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2ludDMyLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc191aW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2ludDY0LCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc191aW50NjQsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2RvdWJsZSwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfaXNfc3RyaW5nLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19vYmplY3QsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2Z1bmN0aW9uLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19iaW5hcnksIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2FycmF5LCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9uYXRpdmVfb2JqZWN0X3RvX3ZhbHVlLCBzaWc6IFwiaWlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9uYXRpdmVfb2JqZWN0X3B0ciwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X25hdGl2ZV9vYmplY3RfdHlwZWlkLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19pbnN0YW5jZV9vZiwgc2lnOiBcImlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2JveGluZywgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfdW5ib3hpbmcsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX3VwZGF0ZV9ib3hlZF92YWx1ZSwgc2lnOiBcInZpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX2JveGVkX3ZhbHVlLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfYXJnc19sZW4sIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2FyZywgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2Vudiwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfbmF0aXZlX2hvbGRlcl9wdHIsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2hvbGRlciwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdXNlcmRhdGEsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfYWRkX3JldHVybiwgc2lnOiBcInZpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfdGhyb3dfYnlfc3RyaW5nLCBzaWc6IFwidmlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfZW52X3JlZiwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9lbnZfcmVmX2lzX3ZhbGlkLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9lbnZfZnJvbV9yZWYsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZHVwbGljYXRlX2Vudl9yZWYsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfcmVsZWFzZV9lbnZfcmVmLCBzaWc6IFwidmlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX29wZW5fc2NvcGUsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfb3Blbl9zY29wZV9wbGFjZW1lbnQsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2hhc19jYXVnaHQsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2V4Y2VwdGlvbl9hc19zdHJpbmcsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2Nsb3NlX3Njb3BlLCBzaWc6IFwidmlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2Nsb3NlX3Njb3BlX3BsYWNlbWVudCwgc2lnOiBcInZpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZHVwbGljYXRlX3ZhbHVlX3JlZiwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZiwgc2lnOiBcInZpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfZnJvbV9yZWYsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX3NldF9yZWZfd2Vhaywgc2lnOiBcInZpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X293bmVyLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3JlZl9hc3NvY2lhdGVkX2Vudiwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfcmVmX2ludGVybmFsX2ZpZWxkcywgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3Byb3BlcnR5LCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X3Byb3BlcnR5LCBzaWc6IFwidmlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9wcml2YXRlLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X3ByaXZhdGUsIHNpZzogXCJpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfcHJvcGVydHlfdWludDMyLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMiwgc2lnOiBcInZpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jYWxsX2Z1bmN0aW9uLCBzaWc6IFwiaWlpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9ldmFsLCBzaWc6IFwiaWlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dsb2JhbCwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfZW52X3ByaXZhdGUsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X2Vudl9wcml2YXRlLCBzaWc6IFwidmlpXCIgfVxyXG4gICAgXTtcclxuICAgIGNvbnNvbGUubG9nKGBjcmVhdGUgd2ViZ2wgZmZpIGFwaSBjb3VudDogJHthcGlJbmZvLmxlbmd0aH1gKTtcclxuICAgIGNvbnN0IHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKGFwaUluZm8ubGVuZ3RoICogNCk7XHJcbiAgICBjb25zdCBoMzJpbmRleCA9IHB0ciA+PiAyO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcGlJbmZvLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltoMzJpbmRleCArIGldID0gZW5naW5lLnVuaXR5QXBpLmFkZEZ1bmN0aW9uKGFwaUluZm9baV0uZnVuYywgYXBpSW5mb1tpXS5zaWcpO1xyXG4gICAgfVxyXG4gICAgd2ViZ2xGRkkgPSBwdHI7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSW5qZWN0UGFwaUdMTmF0aXZlSW1wbCh3ZWJnbEZGSSk7XHJcbiAgICByZXR1cm4gcHRyO1xyXG59XHJcbmV4cG9ydHMuR2V0V2ViR0xGRklBcGkgPSBHZXRXZWJHTEZGSUFwaTtcclxuZnVuY3Rpb24gV2ViR0xSZWdzdGVyQXBpKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBHZXRSZWdzdGVyQXBpOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVzYXBpX2FsbG9jX3Byb3BlcnR5X2Rlc2NyaXB0b3JzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9hbGxvY19wcm9wZXJ0eV9kZXNjcmlwdG9ycyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlc2FwaV9kZWZpbmVfY2xhc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2RlZmluZV9jbGFzcyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlc2FwaV9nZXRfY2xhc3NfZGF0YTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2NsYXNzX2RhdGEgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXNhcGlfb25fY2xhc3Nfbm90X2ZvdW5kOiBmdW5jdGlvbiAoY2FsbGJhY2tQdHIpIHtcclxuICAgICAgICAgICAgQ2xhc3NSZWdpc3Rlci5nZXRJbnN0YW5jZSgpLnNldENsYXNzTm90Rm91bmRDYWxsYmFjaygodHlwZUlkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBqc0NhbGxiYWNrID0gZW5naW5lLnVuaXR5QXBpLmdldFdhc21UYWJsZUVudHJ5KGNhbGxiYWNrUHRyKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJldCA9IGpzQ2FsbGJhY2sodHlwZUlkKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBwZXNhcGlfb25fY2xhc3Nfbm90X2ZvdW5kICR7dHlwZW9mIHJldH0gJHtyZXR9YCk7XHJcbiAgICAgICAgICAgICAgICAvL2NhbGxiYWNrKHR5cGVJZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gISFyZXQ7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVzYXBpX3NldF9tZXRob2RfaW5mbzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfc2V0X21ldGhvZF9pbmZvIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVzYXBpX3NldF9wcm9wZXJ0eV9pbmZvOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcHJvcGVydHlfaW5mbyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlc2FwaV90cmFjZV9uYXRpdmVfb2JqZWN0X2xpZmVjeWNsZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfdHJhY2VfbmF0aXZlX29iamVjdF9saWZlY3ljbGUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLldlYkdMUmVnc3RlckFwaSA9IFdlYkdMUmVnc3RlckFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGVzYXBpSW1wbC5qcy5tYXAiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4vKipcclxuICog5qC55o2uIGh0dHBzOi8vZG9jcy51bml0eTNkLmNvbS8yMDE4LjQvRG9jdW1lbnRhdGlvbi9NYW51YWwvd2ViZ2wtaW50ZXJhY3Rpbmd3aXRoYnJvd3NlcnNjcmlwdGluZy5odG1sXHJcbiAqIOaIkeS7rOeahOebrueahOWwseaYr+WcqFdlYkdM5qih5byP5LiL77yM5a6e546w5ZKMcHVlcnRzLmRsbOeahOaViOaenOOAguWFt+S9k+WcqOS6juWunueOsOS4gOS4qmpzbGli77yM6YeM6Z2i5bqU5YyF5ZCrUHVlcnRzRExMLmNz55qE5omA5pyJ5o6l5Y+jXHJcbiAqIOWunumqjOWPkeeOsOi/meS4qmpzbGli6Jm954S25Lmf5piv6L+Q6KGM5ZyodjjnmoRqc++8jOS9huWvuWRldnRvb2zosIPor5XlubbkuI3lj4vlpb3vvIzkuJTlj6rmlK/mjIHliLBlczXjgIJcclxuICog5Zug5q2k5bqU6K+l6YCa6L+H5LiA5Liq54us56uL55qEanPlrp7njrDmjqXlj6PvvIxwdWVydHMuanNsaWLpgJrov4flhajlsYDnmoTmlrnlvI/osIPnlKjlroPjgIJcclxuICpcclxuICog5pyA57uI5b2i5oiQ5aaC5LiL5p625p6EXHJcbiAqIOS4muWKoUpTIDwtPiBXQVNNIDwtPiB1bml0eSBqc2xpYiA8LT4g5pysanNcclxuICog5L2G5pW05p2h6ZO+6Lev5YW25a6e6YO95Zyo5LiA5LiqdjgoanNjb3JlKeiZmuaLn+acuumHjFxyXG4gKi9cclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4vbGlicmFyeVwiKTtcclxuY29uc3QgZ2V0RnJvbUpTQXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9nZXRGcm9tSlNBcmd1bWVudFwiKTtcclxuY29uc3QgZ2V0RnJvbUpTUmV0dXJuXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvZ2V0RnJvbUpTUmV0dXJuXCIpO1xyXG5jb25zdCByZWdpc3Rlcl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3JlZ2lzdGVyXCIpO1xyXG5jb25zdCBzZXRUb0ludm9rZUpTQXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0ludm9rZUpTQXJndW1lbnRcIik7XHJcbmNvbnN0IHNldFRvSlNJbnZva2VSZXR1cm5fMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0pTSW52b2tlUmV0dXJuXCIpO1xyXG5jb25zdCBzZXRUb0pTT3V0QXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0pTT3V0QXJndW1lbnRcIik7XHJcbmNvbnN0IHBlc2FwaUltcGxfMSA9IHJlcXVpcmUoXCIuL3Blc2FwaUltcGxcIik7XHJcbmxpYnJhcnlfMS5nbG9iYWwud3hSZXF1aXJlID0gbGlicmFyeV8xLmdsb2JhbC5yZXF1aXJlO1xyXG5saWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMID0ge1xyXG4gICAgaW5pdGVkOiBmYWxzZSxcclxuICAgIGRlYnVnOiBmYWxzZSxcclxuICAgIC8vIHB1ZXJ0c+mmluasoeWIneWni+WMluaXtuS8muiwg+eUqOi/memHjO+8jOW5tuaKilVuaXR555qE6YCa5L+h5o6l5Y+j5Lyg5YWlXHJcbiAgICBJbml0KGN0b3JQYXJhbSkge1xyXG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IG5ldyBsaWJyYXJ5XzEuUHVlcnRzSlNFbmdpbmUoY3RvclBhcmFtKTtcclxuICAgICAgICBjb25zdCBleGVjdXRlTW9kdWxlQ2FjaGUgPSB7fTtcclxuICAgICAgICBsZXQganNFbmdpbmVSZXR1cm5lZCA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBsb2FkZXI7XHJcbiAgICAgICAgLy8gUHVlcnRzRExM55qE5omA5pyJ5o6l5Y+j5a6e546wXHJcbiAgICAgICAgbGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IE9iamVjdC5hc3NpZ24obGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCwge1xyXG4gICAgICAgICAgICB1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3czogZW5naW5lLnVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzLmJpbmQoZW5naW5lKVxyXG4gICAgICAgIH0sICgwLCBnZXRGcm9tSlNBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBnZXRGcm9tSlNSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSlNJbnZva2VSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU091dEFyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHJlZ2lzdGVyXzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHBlc2FwaUltcGxfMS5XZWJHTFJlZ3N0ZXJBcGkpKGVuZ2luZSksIHtcclxuICAgICAgICAgICAgLy8gYnJpZGdlTG9nOiB0cnVlLFxyXG4gICAgICAgICAgICBHZXRMaWJWZXJzaW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMzQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEFwaUxldmVsOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMzQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldExpYkJhY2tlbmQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBDcmVhdGVKU0VuZ2luZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGpzRW5naW5lUmV0dXJuZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJvbmx5IG9uZSBhdmFpbGFibGUganNFbnYgaXMgYWxsb3dlZCBpbiBXZWJHTCBtb2RlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAganNFbmdpbmVSZXR1cm5lZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSlNFbmdpbmVXaXRoRXh0ZXJuYWxFbnY6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgRGVzdHJveUpTRW5naW5lOiBmdW5jdGlvbiAoKSB7IH0sXHJcbiAgICAgICAgICAgIEdldExhc3RFeGNlcHRpb25JbmZvOiBmdW5jdGlvbiAoaXNvbGF0ZSwgLyogb3V0IGludCAqLyBzdHJsZW4pIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbmdpbmUubGFzdEV4Y2VwdGlvbiA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ251bGwnO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlbmdpbmUubGFzdEV4Y2VwdGlvbiA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhlbmdpbmUubGFzdEV4Y2VwdGlvbi5zdGFjaywgc3RybGVuKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgTG93TWVtb3J5Tm90aWZpY2F0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBJZGxlTm90aWZpY2F0aW9uRGVhZGxpbmU6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFJlcXVlc3RNaW5vckdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgUmVxdWVzdEZ1bGxHYXJiYWdlQ29sbGVjdGlvbkZvclRlc3Rpbmc6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFNldEdlbmVyYWxEZXN0cnVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2dlbmVyYWxEZXN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuZ2VuZXJhbERlc3RydWN0b3IgPSBfZ2VuZXJhbERlc3RydWN0b3I7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldE1vZHVsZUV4ZWN1dG9yOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBsb2FkZXIgPSB0eXBlb2YgX190Z2pzR2V0TG9hZGVyICE9ICd1bmRlZmluZWQnID8gX190Z2pzR2V0TG9hZGVyKCkgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9hZGVyUmVzb2x2ZSA9IGxvYWRlci5SZXNvbHZlID8gKGZ1bmN0aW9uIChmaWxlTmFtZSwgdG8gPSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWROYW1lID0gbG9hZGVyLlJlc29sdmUoZmlsZU5hbWUsIHRvKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBub3QgZm91bmQ6ICcgKyBmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlZE5hbWU7XHJcbiAgICAgICAgICAgICAgICB9KSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmN0aW9uIChmaWxlTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChbJ3B1ZXJ0cy9sb2cubWpzJywgJ3B1ZXJ0cy90aW1lci5tanMnXS5pbmRleE9mKGZpbGVOYW1lKSAhPSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge307XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkZXJSZXNvbHZlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVOYW1lID0gbG9hZGVyUmVzb2x2ZShmaWxlTmFtZSwgXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gd3hSZXF1aXJlKCdwdWVydHNfbWluaWdhbWVfanNfcmVzb3VyY2VzLycgKyAoZmlsZU5hbWUuZW5kc1dpdGgoJy5qcycpID8gZmlsZU5hbWUgOiBmaWxlTmFtZSArIFwiLmpzXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShuYW1lLCB0bykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBDUyAhPSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuSXNSZWxhdGl2ZSh0bykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmV0ID0gQ1MuUHVlcnRzLlBhdGhIZWxwZXIubm9ybWFsaXplKENTLlB1ZXJ0cy5QYXRoSGVscGVyLkRpcm5hbWUobmFtZSkgKyBcIi9cIiArIHRvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbW9ja1JlcXVpcmUoc3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGV4cG9ydHM6IHt9IH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZENhY2hlU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIGV4ZWN1dGVNb2R1bGVDYWNoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRDYWNoZVNwZWNpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5leHBvcnRzID0gZXhlY3V0ZU1vZHVsZUNhY2hlW2ZvdW5kQ2FjaGVTcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmRTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgUFVFUlRTX0pTX1JFU09VUkNFUyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3VuZFNwZWNpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBub3QgZm91bmQ6ICcgKyBzcGVjaWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjaWZpZXIgPSBmb3VuZFNwZWNpZmllcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBVRVJUU19KU19SRVNPVVJDRVNbc3BlY2lmaWVyXShyZXN1bHQuZXhwb3J0cywgZnVuY3Rpb24gbVJlcXVpcmUoc3BlY2lmaWVyVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2NrUmVxdWlyZShsb2FkZXJSZXNvbHZlID8gbG9hZGVyUmVzb2x2ZShzcGVjaWZpZXJUbywgc3BlY2lmaWVyKSA6IG5vcm1hbGl6ZShzcGVjaWZpZXIsIHNwZWNpZmllclRvKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSByZXN1bHQuZXhwb3J0cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuZXhwb3J0cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdHJ5RmluZE5hbWUgPSBbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3BlY2lmaWVyLmluZGV4T2YoJy4nKSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5RmluZE5hbWUgPSB0cnlGaW5kTmFtZS5jb25jYXQoW3NwZWNpZmllciArICcuanMnLCBzcGVjaWZpZXIgKyAnLnRzJywgc3BlY2lmaWVyICsgJy5tanMnLCBzcGVjaWZpZXIgKyAnLm10cyddKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmluZGVkID0gdHJ5RmluZE5hbWUucmVkdWNlKChyZXQsIG5hbWUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXQgIT09IGZhbHNlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqW25hbWVdID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY2lyY3VsYXIgZGVwZW5kZW5jeSBpcyBkZXRlY3RlZCB3aGVuIHJlcXVpcmluZyBcIiR7bmFtZX1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbmRlZCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ5RmluZE5hbWVbZmluZGVkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVxdWlyZVJldCA9IG1vY2tSZXF1aXJlKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmVSZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRKU09iamVjdFZhbHVlR2V0dGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmN0aW9uIChvYmosIGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmpba2V5XTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgRXZhbDogZnVuY3Rpb24gKGlzb2xhdGUsIGNvZGVTdHJpbmcsIHBhdGgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbGlicmFyeV8xLmdsb2JhbC5ldmFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZXZhbCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2RlID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhjb2RlU3RyaW5nKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsaWJyYXJ5XzEuZ2xvYmFsLmV2YWwoY29kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGdldEludFB0ck1hbmFnZXIoKS5HZXRQb2ludGVyRm9ySlNWYWx1ZShyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC8qRlJlc3VsdEluZm8gKi8gMTAyNDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RFeGNlcHRpb24gPSBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBTZXRQdXNoSlNGdW5jdGlvbkFyZ3VtZW50c0NhbGxiYWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSwgY2FsbGJhY2ssIGpzRW52SWR4KSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuR2V0SlNBcmd1bWVudHNDYWxsYmFjayA9IGNhbGxiYWNrO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBUaHJvd0V4Y2VwdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIC8qYnl0ZVtdICovIG1lc3NhZ2VTdHJpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG1lc3NhZ2VTdHJpbmcpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgSW52b2tlSlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgaGFzUmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gZnVuYy5pbnZva2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuYy5sYXN0RXhjZXB0aW9uID0gZXJyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0RnVuY3Rpb25MYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnVuYyBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZ1bmMubGFzdEV4Y2VwdGlvbiA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdudWxsJztcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZ1bmMubGFzdEV4Y2VwdGlvbiA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd1bmRlZmluZWQnO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKGZ1bmMubGFzdEV4Y2VwdGlvbi5zdGFjayB8fCBmdW5jLmxhc3RFeGNlcHRpb24ubWVzc2FnZSB8fCAnJywgbGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncHRyIGlzIG5vdCBhIGpzZnVuYycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBSZWxlYXNlSlNGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIF9mdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVtb3ZlSlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVsZWFzZUpTT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgb2JqKSB7XHJcbiAgICAgICAgICAgICAgICBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZW1vdmVKU09iamVjdEJ5SWQob2JqKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVzZXRSZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gbnVsbDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQ2xlYXJNb2R1bGVDYWNoZTogZnVuY3Rpb24gKCkgeyB9LFxyXG4gICAgICAgICAgICBDcmVhdGVJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlLCBwb3J0KSB7IH0sXHJcbiAgICAgICAgICAgIERlc3Ryb3lJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIEluc3BlY3RvclRpY2s6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIExvZ2ljVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgU2V0TG9nQ2FsbGJhY2s6IGZ1bmN0aW9uIChsb2csIGxvZ1dhcm5pbmcsIGxvZ0Vycm9yKSB7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEpTU3RhY2tUcmFjZTogZnVuY3Rpb24gKGlzb2xhdGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoKS5zdGFjaztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0V2ViR0xGRklBcGk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoMCwgcGVzYXBpSW1wbF8xLkdldFdlYkdMRkZJQXBpKShlbmdpbmUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRXZWJHTFBhcGlFbnZSZWY6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAyMDQ4OyAvLyBqdXN0IG5vdCBudWxscHRyXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9