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
        const { UTF8ToString, _malloc, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, stackSave, stackRestore, stackAlloc, getWasmTableEntry, addFunction, removeFunction, _CallCSharpFunctionCallback, _CallCSharpConstructorCallback, _CallCSharpDestructorCallback, InjectPapiGLNativeImpl, PApiCallbackWithScope, PApiConstructorWithScope, HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64, } = ctorParam;
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
            PApiCallbackWithScope,
            PApiConstructorWithScope,
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
        loader = globalThis.jsEnv.loader;
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
        //console.error(`getExceptionAsNativeString(${byteCount}): ${result}`);
        if (lastExceptionBuffer) {
            wasmApi._free(lastExceptionBuffer);
        }
        lastExceptionBuffer = wasmApi._malloc(byteCount + 1);
        wasmApi.stringToUTF8(result, lastExceptionBuffer, byteCount + 1);
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
    toJs(wasmApi, objMapper, pvalue) {
        if (pvalue == 0)
            return undefined;
        const heap = wasmApi.HEAPU8;
        const valType = Buffer.readInt32(heap, pvalue + 8);
        //console.log(`valType: ${valType}`);
        if (valType <= JSTag.JS_TAG_OBJECT && valType >= JSTag.JS_TAG_ARRAY) {
            const objIdx = Buffer.readInt32(heap, pvalue);
            return this.objectsInScope[objIdx];
        }
        if (valType == JSTag.JS_TAG_NATIVE_OBJECT) {
            const objId = Buffer.readInt32(heap, pvalue);
            const typeId = Buffer.readInt32(heap, pvalue + 4);
            return objMapper.pushNativeObject(objId, typeId, true);
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
                return wasmApi.UTF8ToString(strStart, strLen);
            case JSTag.JS_TAG_BUFFER:
                const buffStart = Buffer.readInt32(heap, pvalue);
                const buffLen = Buffer.readInt32(heap, pvalue + 4);
                return wasmApi.HEAP8.buffer.slice(buffStart, buffStart + buffLen);
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
    registerClass(typeId, cls, finalize, clsData) {
        const infos = { typeId, finalize, data: clsData };
        Object.defineProperty(cls, '$Infos', {
            value: infos,
            writable: false,
            enumerable: false,
            configurable: false
        });
        this.typeIdToClass.set(typeId, cls);
        this.typeIdToInfos.set(typeId, infos);
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
    getTypeInfos(typeId) {
        return this.typeIdToInfos.get(typeId);
    }
    setClassNotFoundCallback(callback) {
        this.classNotFound = callback;
    }
    traceNativeObjectLifecycle(typeId, onEnter, onExit) {
        const infos = this.getTypeInfos(typeId);
        if (infos) {
            infos.onEnter = onEnter;
            infos.onExit = onExit;
        }
    }
}
class ObjectMapper {
    objectPool;
    privateData = undefined;
    objId2ud = new Map();
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
        const { onEnter, data } = cls.$Infos;
        if (onEnter) {
            const ud = onEnter(objId, data, this.privateData);
            this.objId2ud.set(objId, ud);
        }
    }
    setEnvPrivate(privateData) {
        this.privateData = privateData;
    }
    OnNativeObjectFinalized(objId, typeId, callFinalize) {
        //console.error(`OnNativeObjectFinalized ${objId}`);
        const cls = ClassRegister.getInstance().findClassById(typeId);
        const { finalize, onExit, data } = cls.$Infos;
        if (callFinalize && finalize) {
            finalize(webglFFI, objId, data, this.privateData);
        }
        if (onExit && this.objId2ud.has(objId)) {
            const ud = this.objId2ud.get(objId);
            this.objId2ud.delete(objId);
            onExit(objId, data, this.privateData, ud);
        }
    }
}
let webglFFI = undefined;
let objMapper = undefined;
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
//     int padding;
// } JSValue;
//
// struct CallbackInfo {
//     void* thisPtr;
//     int argc;
//     void* data;
//     int padding;
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
//只需要用到一个buffer的场景下用预分配的，如果超过一个buffer，就malloc
let buffer = undefined;
let buffer_size = 0;
let usingBuffers = [];
function getBuffer(wasmApi, size) {
    let ret = buffer;
    if (usingBuffers.length > 0) {
        ret = wasmApi._malloc(size);
    }
    else {
        if (buffer_size < size) {
            buffer_size = size;
            if (buffer) {
                wasmApi._free(buffer);
            }
            buffer = wasmApi._malloc(buffer_size);
        }
        ret = buffer;
    }
    usingBuffers.push(ret);
    return ret;
}
function clearUsingBuffers(wasmApi) {
    if (usingBuffers.length == 0)
        return;
    if (usingBuffers.length == 1) {
        usingBuffers.pop();
        return;
    }
    for (let i = 1; i < usingBuffers.length; i++) {
        wasmApi._free(usingBuffers[i]);
    }
    usingBuffers = [];
}
function jsValueToPapiValue(wasmApi, arg, value) {
    const heap = wasmApi.HEAPU8;
    const dataPtr = value;
    const tagPtr = dataPtr + 8;
    if (arg === undefined) {
        Buffer.writeInt32(heap, JSTag.JS_TAG_UNDEFINED, tagPtr);
    }
    else if (arg === null) {
        Buffer.writeInt32(heap, JSTag.JS_TAG_NULL, tagPtr);
    }
    else if (typeof arg === 'bigint') {
        Buffer.writeInt64(heap, arg, dataPtr);
        Buffer.writeInt32(heap, JSTag.JS_TAG_INT64, tagPtr);
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
        const len = wasmApi.lengthBytesUTF8(arg);
        const ptr = getBuffer(wasmApi, len + 1);
        wasmApi.stringToUTF8(arg, ptr, len + 1);
        Buffer.writeInt32(heap, ptr, dataPtr);
        Buffer.writeInt32(heap, len, dataPtr + 4);
        Buffer.writeInt32(heap, JSTag.JS_TAG_STRING, tagPtr);
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
        Buffer.writeInt32(heap, ptr, dataPtr);
        Buffer.writeInt32(heap, len, dataPtr + 4);
        Buffer.writeInt32(heap, JSTag.JS_TAG_BUFFER, tagPtr);
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
    clearUsingBuffers(wasmApi);
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
        try {
            callbackInfo = jsArgsToCallbackInfo(wasmApi, argc, args);
            const heap = wasmApi.HEAPU8;
            Buffer.writeInt32(heap, data, callbackInfo + 8); // data
            let objId = 0;
            if (!isStatic) {
                [objId] = ObjectPool.GetNativeInfoOfObject(this);
            }
            Buffer.writeInt32(heap, objId, callbackInfo); // thisPtr
            wasmApi.PApiCallbackWithScope(callback, papi, callbackInfo); // 预期wasm只会通过throw_by_string抛异常，不产生直接js异常
            if (hasException) {
                throw getAndClearLastException();
            }
            return Scope.getCurrent().toJs(wasmApi, objMapper, callbackInfo + 16);
        }
        finally {
            returnNativeCallbackInfo(wasmApi, argc, callbackInfo);
        }
    };
}
// 需要在Unity里调用PlayerSettings.WebGL.emscriptenArgs = " -s ALLOW_TABLE_GROWTH=1";
function GetWebGLFFIApi(engine) {
    if (webglFFI)
        return webglFFI;
    objMapper = new ObjectMapper();
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
        return Scope.getCurrent().addToScope([]);
    }
    function pesapi_create_object(env) {
        return Scope.getCurrent().addToScope(Object.create(null));
    }
    function pesapi_create_function(env, native_impl, data, finalize // TODO: gc时调用finalize
    ) {
        const jsCallback = genJsCallback(engine.unityApi, native_impl, data, webglFFI, true);
        return Scope.getCurrent().addToScope(jsCallback);
    }
    function pesapi_create_class(env, typeId) {
        const cls = ClassRegister.getInstance().loadClassById(typeId);
        if (typeof cls === 'function') {
            console.log(`create class: ${cls.name}`);
            return Scope.getCurrent().addToScope(cls);
        }
        throw new Error("can't load class by type id: " + typeId);
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
        const array = Scope.getCurrent().getFromScope(pvalue);
        if (!Array.isArray(array)) {
            throw new Error("pesapi_get_array_length: value is not an array");
        }
        return array.length;
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
        // TODO: just for test
        //const cls = ClassRegister.getInstance().findClassById(typeId);
        //if (cls.name == "JsEnv") {
        //    console.log(`call FileExists(aabb.txt): ${(jsObj as any).loader.FileExists("aabb.txt")}`);
        //    console.log(`call FileExists(puerts/esm_bootstrap.cjs): ${(jsObj as any).loader.FileExists("puerts/esm_bootstrap.cjs")}`);
        //}
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
    function pesapi_throw_by_string(pinfo, pmsg) {
        const msg = engine.unityApi.UTF8ToString(pmsg);
        setLastException(new Error(msg));
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
    // --------------- 值引用 ---------------
    function pesapi_create_value_ref(env, pvalue, internal_field_count) {
        const value = Scope.getCurrent().toJs(engine.unityApi, objMapper, pvalue);
        return referencedValues.add(value);
    }
    function pesapi_duplicate_value_ref(pvalue_ref) {
        throw new Error("pesapi_duplicate_value_ref not implemented yet!");
    }
    function pesapi_release_value_ref(pvalue_ref) {
        referencedValues.remove(pvalue_ref);
    }
    function pesapi_get_value_from_ref(env, pvalue_ref, pvalue) {
        const value = referencedValues.get(pvalue_ref);
        jsValueToPapiValue(engine.unityApi, value, pvalue);
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
        if (!globalThis.eval) {
            throw new Error("eval is not supported"); // TODO: 抛给wasm更合适些
        }
        try {
            const code = engine.unityApi.UTF8ToString(pcode, code_size);
            const result = globalThis.eval(code);
            jsValueToPapiValue(engine.unityApi, result, presult);
        }
        catch (e) {
            setLastException(e);
        }
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
        objMapper.setEnvPrivate(ptr);
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
        { func: pesapi_get_value_from_ref, sig: "viii" },
        { func: pesapi_set_ref_weak, sig: "vii" },
        { func: pesapi_set_owner, sig: "iiii" },
        { func: pesapi_get_ref_associated_env, sig: "ii" },
        { func: pesapi_get_ref_internal_fields, sig: "iii" },
        { func: pesapi_get_property, sig: "viiii" },
        { func: pesapi_set_property, sig: "viiii" },
        { func: pesapi_get_private, sig: "iiii" },
        { func: pesapi_set_private, sig: "iiii" },
        { func: pesapi_get_property_uint32, sig: "viiii" },
        { func: pesapi_set_property_uint32, sig: "viiii" },
        { func: pesapi_call_function, sig: "viiiiii" },
        { func: pesapi_eval, sig: "viiiii" },
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
    // Initialize with proper type assertion
    const descriptorsArray = [[]];
    return {
        GetRegsterApi: function () {
            return 0;
        },
        pesapi_alloc_property_descriptors: function (count) {
            descriptorsArray.push([]);
            return descriptorsArray.length - 1;
        },
        pesapi_define_class: function (typeId, superTypeId, pname, constructor, finalize, propertyCount, properties, data) {
            const descriptors = descriptorsArray[properties];
            descriptorsArray[properties] = undefined;
            const name = engine.unityApi.UTF8ToString(pname);
            const PApiNativeObject = function (...args) {
                let callbackInfo = undefined;
                const argc = arguments.length;
                try {
                    callbackInfo = jsArgsToCallbackInfo(engine.unityApi, argc, args);
                    Buffer.writeInt32(engine.unityApi.HEAPU8, data, callbackInfo + 8); // data
                    const objId = engine.unityApi.PApiConstructorWithScope(constructor, webglFFI, callbackInfo); // 预期wasm只会通过throw_by_string抛异常，不产生直接js异常
                    if (hasException) {
                        throw getAndClearLastException();
                    }
                    objMapper.bindNativeObject(objId, this, typeId, PApiNativeObject, true);
                }
                finally {
                    returnNativeCallbackInfo(engine.unityApi, argc, callbackInfo);
                }
            };
            Object.defineProperty(PApiNativeObject, "name", { value: name });
            if (superTypeId != 0) {
                const superType = ClassRegister.getInstance().loadClassById(superTypeId);
                if (superType) {
                    Object.setPrototypeOf(PApiNativeObject.prototype, superType.prototype);
                }
            }
            descriptors.forEach(descriptor => {
                if ('callback' in descriptor) {
                    const jsCallback = genJsCallback(engine.unityApi, descriptor.callback, descriptor.data, webglFFI, descriptor.isStatic);
                    if (descriptor.isStatic) {
                        PApiNativeObject[descriptor.name] = jsCallback;
                    }
                    else {
                        PApiNativeObject.prototype[descriptor.name] = jsCallback;
                    }
                }
                else {
                    //console.log(`genJsCallback ${descriptor.name} ${descriptor.getter_data} ${webglFFI}`);
                    var propertyDescriptor = {
                        get: descriptor.getter === 0 ? undefined : genJsCallback(engine.unityApi, descriptor.getter, descriptor.getter_data, webglFFI, descriptor.isStatic),
                        set: descriptor.setter === 0 ? undefined : genJsCallback(engine.unityApi, descriptor.setter, descriptor.setter_data, webglFFI, descriptor.isStatic),
                        configurable: true,
                        enumerable: true
                    };
                    if (descriptor.isStatic) {
                        Object.defineProperty(PApiNativeObject, descriptor.name, propertyDescriptor);
                    }
                    else {
                        Object.defineProperty(PApiNativeObject.prototype, descriptor.name, propertyDescriptor);
                    }
                }
            });
            console.log(`pesapi_define_class: ${name} ${typeId} ${superTypeId}`);
            ClassRegister.getInstance().registerClass(typeId, PApiNativeObject, engine.unityApi.getWasmTableEntry(finalize), data);
        },
        pesapi_get_class_data: function (typeId, forceLoad) {
            return ClassRegister.getInstance().getClassDataById(typeId, forceLoad);
        },
        pesapi_on_class_not_found: function (callbackPtr) {
            const jsCallback = engine.unityApi.getWasmTableEntry(callbackPtr);
            ClassRegister.getInstance().setClassNotFoundCallback((typeId) => {
                const ret = jsCallback(typeId);
                return !!ret;
            });
        },
        pesapi_set_method_info: function (properties, index, pname, is_static, method, data, signature_info) {
            const name = engine.unityApi.UTF8ToString(pname);
            descriptorsArray[properties][index] = {
                name: name,
                isStatic: is_static,
                callback: method,
                data: data
            };
        },
        pesapi_set_property_info: function (properties, index, pname, is_static, getter, setter, getter_data, setter_data, type_info) {
            const name = engine.unityApi.UTF8ToString(pname);
            descriptorsArray[properties][index] = {
                name: name,
                isStatic: is_static,
                getter: getter,
                setter: setter,
                getter_data: getter_data,
                setter_data: setter_data
            };
        },
        pesapi_trace_native_object_lifecycle: function (typeId, onEnter, onExit) {
            const enterCallback = engine.unityApi.getWasmTableEntry(onEnter);
            const exitCallback = engine.unityApi.getWasmTableEntry(onExit);
            ClassRegister.getInstance().traceNativeObjectLifecycle(typeId, enterCallback, exitCallback);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVlcnRzLXJ1bnRpbWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGlCQUFpQixHQUFHLGdCQUFnQjtBQUM3WjtBQUNBO0FBQ0EsMkJBQTJCLE1BQU0sMkJBQTJCLE1BQU07QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixrQkFBa0IsNkJBQTZCLE1BQU07QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsa0JBQWtCLGFBQWEsY0FBYyxTQUFTLFFBQVEsVUFBVSxNQUFNO0FBQ3JHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsS0FBSyxTQUFTLEtBQUssVUFBVSxNQUFNO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25COzs7Ozs7Ozs7O0FDelNhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG9CQUFvQixHQUFHLGdCQUFnQixHQUFHLG9CQUFvQixHQUFHLHFCQUFxQixHQUFHLGtCQUFrQixHQUFHLGVBQWUsR0FBRyxzQkFBc0IsR0FBRyxrQkFBa0IsR0FBRyxxQkFBcUIsR0FBRyxjQUFjLEdBQUcsdUJBQXVCLEdBQUcsaUNBQWlDLEdBQUcsZ0JBQWdCLEdBQUcsa0JBQWtCLEdBQUcsc0NBQXNDLEdBQUcsNEJBQTRCO0FBQ2xZO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QixpQ0FBaUM7QUFDakMsa0JBQWtCO0FBQ2xCLGlDQUFpQztBQUNqQztBQUNBLG1DQUFtQztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnQkFBZ0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnQkFBZ0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQ7QUFDQTtBQUNBLDhGQUE4RjtBQUM5RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrR0FBa0c7QUFDbEc7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0REFBNEQ7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RDtBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQztBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMseUNBQXlDO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0EsY0FBYyxHQUFHLHFCQUFNLEdBQUcscUJBQU07QUFDaEMscUJBQU0sVUFBVSxxQkFBTTtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLFVBQVU7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsaURBQWlEO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLGdYQUFnWDtBQUNoWTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTSwyREFBMkQ7QUFDekUsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTtBQUNmO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBLHdEQUF3RDtBQUN4RCx3Q0FBd0M7QUFDeEM7QUFDQSxvQkFBb0I7QUFDcEI7QUFDQSxtRUFBbUU7QUFDbkUsZ0VBQWdFO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O0FDdHFCYTtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxrQkFBa0IsbUJBQU8sQ0FBQyx1Q0FBWTtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUM1SGE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUMzRWE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsaUNBQWlDO0FBQ25GLGtEQUFrRCxXQUFXO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxrQkFBZTtBQUNmOzs7Ozs7Ozs7O0FDNUhhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGtCQUFrQixtQkFBTyxDQUFDLHVDQUFZO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWU7QUFDZjs7Ozs7Ozs7OztBQ3hEYTtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxrQkFBa0IsbUJBQU8sQ0FBQyx1Q0FBWTtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLDRDQUE0QztBQUM1QyxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxrQkFBZTtBQUNmOzs7Ozs7Ozs7O0FDMUVhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGtCQUFrQixtQkFBTyxDQUFDLHVDQUFZO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLDBCQUEwQjtBQUMxQixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsMkJBQTJCO0FBQzNCLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUNoRGE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QsdUJBQXVCLEdBQUcsc0JBQXNCO0FBQ2hELGVBQWUsbUJBQU8sQ0FBQyxvQ0FBVTtBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrRkFBK0YsS0FBSztBQUNwRztBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsc0JBQXNCO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDLElBQUksSUFBSSxNQUFNO0FBQ25EO0FBQ0E7QUFDQSx3QkFBd0IsY0FBYztBQUN0QztBQUNBO0FBQ0E7QUFDQSxzREFBc0QsVUFBVSxLQUFLLE9BQU87QUFDNUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQyxRQUFRO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QyxRQUFRO0FBQ3JEO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0IsZ0JBQWdCO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxNQUFNO0FBQ3pEO0FBQ0EsZ0JBQWdCLHlCQUF5QjtBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtGQUFrRjtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IseUJBQXlCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFEQUFxRCxXQUFXO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsVUFBVTtBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2REFBNkQ7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQ7QUFDMUQseUVBQXlFO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUNBQXlDLFNBQVM7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdEQUF3RCw2Q0FBNkM7QUFDckcsd0VBQXdFLDZEQUE2RDtBQUNySTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsVUFBVTtBQUNsQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNEO0FBQ3REO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVSxxQ0FBcUM7QUFDL0MsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSx3Q0FBd0M7QUFDbEQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSx3Q0FBd0M7QUFDbEQsVUFBVSx3Q0FBd0M7QUFDbEQsVUFBVSw4Q0FBOEM7QUFDeEQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSxzQ0FBc0M7QUFDaEQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSw0Q0FBNEM7QUFDdEQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSxrREFBa0Q7QUFDNUQsVUFBVSw0Q0FBNEM7QUFDdEQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSxrQ0FBa0M7QUFDNUMsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSxxQ0FBcUM7QUFDL0MsVUFBVSxtQ0FBbUM7QUFDN0MsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxtQ0FBbUM7QUFDN0MsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxzQ0FBc0M7QUFDaEQsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxtQ0FBbUM7QUFDN0MsVUFBVSxtREFBbUQ7QUFDN0QsVUFBVSxnREFBZ0Q7QUFDMUQsVUFBVSxtREFBbUQ7QUFDN0QsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSxpQ0FBaUM7QUFDM0MsVUFBVSxtQ0FBbUM7QUFDN0MsVUFBVSw4Q0FBOEM7QUFDeEQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSxzQ0FBc0M7QUFDaEQsVUFBVSxrQ0FBa0M7QUFDNUMsVUFBVSxpQ0FBaUM7QUFDM0MsVUFBVSwrQ0FBK0M7QUFDekQsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxzQ0FBc0M7QUFDaEQsVUFBVSxxQ0FBcUM7QUFDL0MsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSx3Q0FBd0M7QUFDbEQsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSwwQ0FBMEM7QUFDcEQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSwrQ0FBK0M7QUFDekQsVUFBVSxvQ0FBb0M7QUFDOUMsVUFBVSxrREFBa0Q7QUFDNUQsVUFBVSxxQ0FBcUM7QUFDL0MsVUFBVSwrQ0FBK0M7QUFDekQsVUFBVSw0Q0FBNEM7QUFDdEQsVUFBVSw2Q0FBNkM7QUFDdkQsVUFBVSwyQ0FBMkM7QUFDckQsVUFBVSw4Q0FBOEM7QUFDeEQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSxxQ0FBcUM7QUFDL0MsVUFBVSxnREFBZ0Q7QUFDMUQsVUFBVSxrREFBa0Q7QUFDNUQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSx1Q0FBdUM7QUFDakQsVUFBVSxnREFBZ0Q7QUFDMUQsVUFBVSxnREFBZ0Q7QUFDMUQsVUFBVSw0Q0FBNEM7QUFDdEQsVUFBVSxrQ0FBa0M7QUFDNUMsVUFBVSxnQ0FBZ0M7QUFDMUMsVUFBVSx5Q0FBeUM7QUFDbkQsVUFBVTtBQUNWO0FBQ0EsK0NBQStDLGVBQWU7QUFDOUQ7QUFDQTtBQUNBLG9CQUFvQixvQkFBb0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUZBQXVGO0FBQ3ZGLGlIQUFpSDtBQUNqSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4REFBOEQsYUFBYTtBQUMzRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbURBQW1ELGlCQUFpQixFQUFFLHdCQUF3QixFQUFFLFNBQVM7QUFDekc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsZ0RBQWdELE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWTtBQUM5RTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUI7QUFDdkI7Ozs7OztVQ2p1Q0E7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxHQUFHO1dBQ0g7V0FDQTtXQUNBLENBQUM7Ozs7Ozs7Ozs7O0FDUFk7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsbUJBQU8sQ0FBQyxzQ0FBVztBQUNyQyw0QkFBNEIsbUJBQU8sQ0FBQyx3RUFBNEI7QUFDaEUsMEJBQTBCLG1CQUFPLENBQUMsb0VBQTBCO0FBQzVELG1CQUFtQixtQkFBTyxDQUFDLHNEQUFtQjtBQUM5QyxnQ0FBZ0MsbUJBQU8sQ0FBQyxnRkFBZ0M7QUFDeEUsOEJBQThCLG1CQUFPLENBQUMsNEVBQThCO0FBQ3BFLDZCQUE2QixtQkFBTyxDQUFDLDBFQUE2QjtBQUNsRSxxQkFBcUIsbUJBQU8sQ0FBQyw0Q0FBYztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLDBEQUEwRDtBQUMxRCw0Q0FBNEM7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLHlEQUF5RDtBQUN6RCw0REFBNEQ7QUFDNUQsMkVBQTJFO0FBQzNFLDBFQUEwRTtBQUMxRTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0dBQStHLEtBQUs7QUFDcEg7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsNkNBQTZDO0FBQzdDLHlEQUF5RDtBQUN6RCxvREFBb0Q7QUFDcEQsaURBQWlEO0FBQ2pELDZDQUE2QztBQUM3QztBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGlDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2J1ZmZlci5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbGlicmFyeS5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL2dldEZyb21KU0FyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvZ2V0RnJvbUpTUmV0dXJuLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvcmVnaXN0ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0ludm9rZUpTQXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0pTSW52b2tlUmV0dXJuLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9KU091dEFyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9wZXNhcGlJbXBsLmpzIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qXHJcbiogVGVuY2VudCBpcyBwbGVhc2VkIHRvIHN1cHBvcnQgdGhlIG9wZW4gc291cmNlIGNvbW11bml0eSBieSBtYWtpbmcgUHVlcnRzIGF2YWlsYWJsZS5cclxuKiBDb3B5cmlnaHQgKEMpIDIwMjAgVEhMIEEyOSBMaW1pdGVkLCBhIFRlbmNlbnQgY29tcGFueS4gIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiogUHVlcnRzIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0QgMy1DbGF1c2UgTGljZW5zZSwgZXhjZXB0IGZvciB0aGUgdGhpcmQtcGFydHkgY29tcG9uZW50cyBsaXN0ZWQgaW4gdGhlIGZpbGUgJ0xJQ0VOU0UnIHdoaWNoIG1heSBiZSBzdWJqZWN0IHRvIHRoZWlyIGNvcnJlc3BvbmRpbmcgbGljZW5zZSB0ZXJtcy5cclxuKiBUaGlzIGZpbGUgaXMgc3ViamVjdCB0byB0aGUgdGVybXMgYW5kIGNvbmRpdGlvbnMgZGVmaW5lZCBpbiBmaWxlICdMSUNFTlNFJywgd2hpY2ggaXMgcGFydCBvZiB0aGlzIHNvdXJjZSBjb2RlIHBhY2thZ2UuXHJcbiovXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy53cml0ZURvdWJsZSA9IGV4cG9ydHMud3JpdGVGbG9hdCA9IGV4cG9ydHMud3JpdGVVSW50NjQgPSBleHBvcnRzLndyaXRlSW50NjQgPSBleHBvcnRzLndyaXRlVUludDMyID0gZXhwb3J0cy53cml0ZUludDMyID0gZXhwb3J0cy53cml0ZVVJbnQxNiA9IGV4cG9ydHMud3JpdGVJbnQxNiA9IGV4cG9ydHMud3JpdGVVSW50OCA9IGV4cG9ydHMud3JpdGVJbnQ4ID0gZXhwb3J0cy5yZWFkRG91YmxlID0gZXhwb3J0cy5yZWFkRmxvYXQgPSBleHBvcnRzLnJlYWRVSW50NjQgPSBleHBvcnRzLnJlYWRJbnQ2NCA9IGV4cG9ydHMucmVhZFVJbnQzMiA9IGV4cG9ydHMucmVhZEludDMyID0gZXhwb3J0cy5yZWFkVUludDE2ID0gZXhwb3J0cy5yZWFkSW50MTYgPSBleHBvcnRzLnJlYWRVSW50OCA9IGV4cG9ydHMucmVhZEludDggPSB2b2lkIDA7XHJcbmZ1bmN0aW9uIHZhbGlkYXRlTnVtYmVyKHZhbHVlLCB0eXBlKSB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBleHBlY3RzIGEgbnVtYmVyIGJ1dCBnb3QgJHt2YWx1ZX1gKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBib3VuZHNFcnJvcih2YWx1ZSwgbGVuZ3RoLCB0eXBlKSB7XHJcbiAgICBpZiAoTWF0aC5mbG9vcih2YWx1ZSkgIT09IHZhbHVlKSB7XHJcbiAgICAgICAgdmFsaWRhdGVOdW1iZXIodmFsdWUsIHR5cGUgfHwgJ29mZnNldCcpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0eXBlIHx8ICdvZmZzZXQnfSBleHBlY3RzIGFuIGludGVnZXIgYnV0IGdvdCAke3ZhbHVlfWApO1xyXG4gICAgfVxyXG4gICAgaWYgKGxlbmd0aCA8IDApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvdXQgb2YgYm91bmRcIik7XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZSB8fCAnb2Zmc2V0J30gZXhwZWN0cyA+PSAke3R5cGUgPyAxIDogMH0gYW5kIDw9ICR7bGVuZ3RofSBidXQgZ290ICR7dmFsdWV9YCk7XHJcbn1cclxuZnVuY3Rpb24gY2hlY2tCb3VuZHMoYnVmLCBvZmZzZXQsIGJ5dGVMZW5ndGgpIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgaWYgKGJ1ZltvZmZzZXRdID09PSB1bmRlZmluZWQgfHwgYnVmW29mZnNldCArIGJ5dGVMZW5ndGhdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1Zi5sZW5ndGggLSAoYnl0ZUxlbmd0aCArIDEpKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiB3cml0ZVVfSW50OChidWYsIHZhbHVlLCBvZmZzZXQsIG1pbiwgbWF4KSB7XHJcbiAgICB2YWx1ZSA9ICt2YWx1ZTtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB2YWx1ZSBleHBlY3RzID49ICR7bWlufSBhbmQgPD0gJHttYXh9IGJ1dCBnb3QgJHt2YWx1ZX1gKTtcclxuICAgIH1cclxuICAgIGlmIChidWZbb2Zmc2V0XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWYubGVuZ3RoIC0gMSk7XHJcbiAgICB9XHJcbiAgICBidWZbb2Zmc2V0XSA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIG9mZnNldCArIDE7XHJcbn1cclxuZnVuY3Rpb24gcmVhZEludDgoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCB2YWwgPSBidWZmW29mZnNldF07XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsIHwgKHZhbCAmIDIgKiogNykgKiAweDFmZmZmZmU7XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50OCA9IHJlYWRJbnQ4O1xyXG5mdW5jdGlvbiB3cml0ZUludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0ID0gMCkge1xyXG4gICAgcmV0dXJuIHdyaXRlVV9JbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCwgLTB4ODAsIDB4N2YpO1xyXG59XHJcbmV4cG9ydHMud3JpdGVJbnQ4ID0gd3JpdGVJbnQ4O1xyXG5mdW5jdGlvbiByZWFkVUludDgoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCB2YWwgPSBidWZmW29mZnNldF07XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQ4ID0gcmVhZFVJbnQ4O1xyXG5mdW5jdGlvbiB3cml0ZVVJbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCA9IDApIHtcclxuICAgIHJldHVybiB3cml0ZVVfSW50OChidWYsIHZhbHVlLCBvZmZzZXQsIDAsIDB4ZmYpO1xyXG59XHJcbmV4cG9ydHMud3JpdGVVSW50OCA9IHdyaXRlVUludDg7XHJcbmNvbnN0IGludDE2QXJyYXkgPSBuZXcgSW50MTZBcnJheSgxKTtcclxuY29uc3QgdUludDhJbnQ2QXJyYXkgPSBuZXcgVWludDhBcnJheShpbnQxNkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRJbnQxNihidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgMV07XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMik7XHJcbiAgICB9XHJcbiAgICB1SW50OEludDZBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdUludDhJbnQ2QXJyYXlbMV0gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGludDE2QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50MTYgPSByZWFkSW50MTY7XHJcbmZ1bmN0aW9uIHdyaXRlSW50MTYoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAxKTtcclxuICAgIGludDE2QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4SW50NkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEludDZBcnJheVsxXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZUludDE2ID0gd3JpdGVJbnQxNjtcclxuY29uc3QgdWludDE2QXJyYXkgPSBuZXcgVWludDE2QXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4VWludDE2QXJyYXkgPSBuZXcgVWludDhBcnJheSh1aW50MTZBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkVUludDE2KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAxXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSAyKTtcclxuICAgIH1cclxuICAgIHVpbnQ4VWludDE2QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4VWludDE2QXJyYXlbMV0gPSBsYXN0O1xyXG4gICAgcmV0dXJuIHVpbnQxNkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQxNiA9IHJlYWRVSW50MTY7XHJcbmZ1bmN0aW9uIHdyaXRlVUludDE2KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMSk7XHJcbiAgICB1aW50MTZBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MTZBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MTZBcnJheVsxXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZVVJbnQxNiA9IHdyaXRlVUludDE2O1xyXG5jb25zdCBpbnQzMkFycmF5ID0gbmV3IEludDMyQXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4SW50MzJBcnJheSA9IG5ldyBVaW50OEFycmF5KGludDMyQXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZEludDMyKGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAzXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA0KTtcclxuICAgIH1cclxuICAgIHVpbnQ4SW50MzJBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhJbnQzMkFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEludDMyQXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4SW50MzJBcnJheVszXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gaW50MzJBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRJbnQzMiA9IHJlYWRJbnQzMjtcclxuZnVuY3Rpb24gd3JpdGVJbnQzMihidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDMpO1xyXG4gICAgaW50MzJBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhJbnQzMkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEludDMyQXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4SW50MzJBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhJbnQzMkFycmF5WzNdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlSW50MzIgPSB3cml0ZUludDMyO1xyXG5jb25zdCB1aW50MzJBcnJheSA9IG5ldyBVaW50MzJBcnJheSgxKTtcclxuY29uc3QgdWludDhVaW50MzJBcnJheSA9IG5ldyBVaW50OEFycmF5KHVpbnQzMkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRVSW50MzIoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDNdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDQpO1xyXG4gICAgfVxyXG4gICAgdWludDhVaW50MzJBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhVaW50MzJBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhVaW50MzJBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhVaW50MzJBcnJheVszXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gdWludDMyQXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkVUludDMyID0gcmVhZFVJbnQzMjtcclxuZnVuY3Rpb24gd3JpdGVVSW50MzIoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAzKTtcclxuICAgIHVpbnQzMkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzNdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlVUludDMyID0gd3JpdGVVSW50MzI7XHJcbmNvbnN0IGZsb2F0MzJBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoMSk7XHJcbmNvbnN0IHVJbnQ4RmxvYXQzMkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoZmxvYXQzMkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRGbG9hdChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgM107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gNCk7XHJcbiAgICB9XHJcbiAgICB1SW50OEZsb2F0MzJBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdUludDhGbG9hdDMyQXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQzMkFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0MzJBcnJheVszXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gZmxvYXQzMkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZEZsb2F0ID0gcmVhZEZsb2F0O1xyXG5mdW5jdGlvbiB3cml0ZUZsb2F0KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMyk7XHJcbiAgICBmbG9hdDMyQXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQzMkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0MzJBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDMyQXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQzMkFycmF5WzNdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlRmxvYXQgPSB3cml0ZUZsb2F0O1xyXG5jb25zdCBmbG9hdDY0QXJyYXkgPSBuZXcgRmxvYXQ2NEFycmF5KDEpO1xyXG5jb25zdCB1SW50OEZsb2F0NjRBcnJheSA9IG5ldyBVaW50OEFycmF5KGZsb2F0NjRBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkRG91YmxlKGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgN107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gOCk7XHJcbiAgICB9XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVszXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbNF0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzVdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVs2XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbN10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGZsb2F0NjRBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWREb3VibGUgPSByZWFkRG91YmxlO1xyXG5mdW5jdGlvbiB3cml0ZURvdWJsZShidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDcpO1xyXG4gICAgZmxvYXQ2NEFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVszXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbNF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzVdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVs2XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbN107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVEb3VibGUgPSB3cml0ZURvdWJsZTtcclxuY29uc3QgYmlnSW50NjRBcnJheSA9IG5ldyBCaWdJbnQ2NEFycmF5KDEpO1xyXG5jb25zdCB1aW50OEJpZ0ludDY0QXJyYXkgPSBuZXcgVWludDhBcnJheShiaWdJbnQ2NEFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRJbnQ2NChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDddO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDgpO1xyXG4gICAgfVxyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzNdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbNF0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVs1XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzZdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbN10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGJpZ0ludDY0QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50NjQgPSByZWFkSW50NjQ7XHJcbmZ1bmN0aW9uIHdyaXRlSW50NjQoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSB0eXBlb2YgdmFsID09PSAnbnVtYmVyJyA/IEJpZ0ludCh2YWwpIDogdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCA3KTtcclxuICAgIGJpZ0ludDY0QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVszXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzRdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbNV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVs2XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzddO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlSW50NjQgPSB3cml0ZUludDY0O1xyXG5jb25zdCBiaWdVaW50NjRBcnJheSA9IG5ldyBCaWdVaW50NjRBcnJheSgxKTtcclxuY29uc3QgdWludDhCaWdVaW50NjRBcnJheSA9IG5ldyBVaW50OEFycmF5KGJpZ1VpbnQ2NEFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRVSW50NjQoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyA3XTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA4KTtcclxuICAgIH1cclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbM10gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbNF0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbNV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbNl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbN10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGJpZ1VpbnQ2NEFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQ2NCA9IHJlYWRVSW50NjQ7XHJcbmZ1bmN0aW9uIHdyaXRlVUludDY0KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gdHlwZW9mIHZhbCA9PT0gJ251bWJlcicgPyBCaWdJbnQodmFsKSA6IHZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgNyk7XHJcbiAgICBiaWdVaW50NjRBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVszXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs0XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs1XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs2XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs3XTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZVVJbnQ2NCA9IHdyaXRlVUludDY0O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1idWZmZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5yZXR1cm5CaWdJbnQgPSBleHBvcnRzLmlzQmlnSW50ID0gZXhwb3J0cy5zZXRPdXRWYWx1ZTggPSBleHBvcnRzLnNldE91dFZhbHVlMzIgPSBleHBvcnRzLm1ha2VCaWdJbnQgPSBleHBvcnRzLkdldFR5cGUgPSBleHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gZXhwb3J0cy5PbkZpbmFsaXplID0gZXhwb3J0cy5jcmVhdGVXZWFrUmVmID0gZXhwb3J0cy5nbG9iYWwgPSBleHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IGV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGV4cG9ydHMuSlNPYmplY3QgPSBleHBvcnRzLkpTRnVuY3Rpb24gPSBleHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IGV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm8gPSB2b2lkIDA7XHJcbi8qKlxyXG4gKiDkuIDmrKHlh73mlbDosIPnlKjnmoRpbmZvXHJcbiAqIOWvueW6lHY4OjpGdW5jdGlvbkNhbGxiYWNrSW5mb1xyXG4gKi9cclxuY2xhc3MgRnVuY3Rpb25DYWxsYmFja0luZm8ge1xyXG4gICAgYXJncztcclxuICAgIHJldHVyblZhbHVlO1xyXG4gICAgc3RhY2sgPSAwO1xyXG4gICAgY29uc3RydWN0b3IoYXJncykge1xyXG4gICAgICAgIHRoaXMuYXJncyA9IGFyZ3M7XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlKCkge1xyXG4gICAgICAgIHRoaXMuc3RhY2sgPSAwO1xyXG4gICAgICAgIHRoaXMuYXJncyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IHZvaWQgMDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gRnVuY3Rpb25DYWxsYmFja0luZm87XHJcbi8vIHN0cnVjdCBNb2NrVjhWYWx1ZVxyXG4vLyB7XHJcbi8vICAgICBpbnQgSlNWYWx1ZVR5cGU7ICAvLyAwXHJcbi8vICAgICBpbnQgRmluYWxWYWx1ZVBvaW50ZXJbMl07IC8vIDEgMiBpZiB2YWx1ZSBpcyBiaWdpbnQgRmluYWxWYWx1ZVBvaW50ZXJbMF0gZm9yIGxvdywgRmluYWxWYWx1ZVBvaW50ZXJbMV0gZm9yIGhpZ2hcclxuLy8gICAgIGludCBleHRyYTsgLy8gM1xyXG4vLyAgICAgaW50IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvOyAvLyA0XHJcbi8vIH07XHJcbmNvbnN0IEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyID0gNDsgLy8gaW50IGNvdW50XHJcbi8qKlxyXG4gKiDmiopGdW5jdGlvbkNhbGxiYWNrSW5mb+S7peWPiuWFtuWPguaVsOi9rOWMluS4umMj5Y+v55So55qEaW50cHRyXHJcbiAqL1xyXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIge1xyXG4gICAgLy8gRnVuY3Rpb25DYWxsYmFja0luZm/nmoTliJfooajvvIzku6XliJfooajnmoRpbmRleOS9nOS4ukludFB0cueahOWAvFxyXG4gICAgaW5mb3MgPSBbbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKFswXSldOyAvLyDov5nph4zljp/mnKzlj6rmmK/kuKrmma7pgJrnmoQwXHJcbiAgICAvLyBGdW5jdGlvbkNhbGxiYWNrSW5mb+eUqOWujOWQju+8jOWwhuWFtuW6j+WPt+aUvuWFpeKAnOWbnuaUtuWIl+ihqOKAne+8jOS4i+asoeWwseiDvee7p+e7reacjeeUqOivpWluZGV477yM6ICM5LiN5b+F6K6paW5mb3PmlbDnu4Tml6DpmZDmianlsZXkuIvljrtcclxuICAgIGZyZWVJbmZvc0luZGV4ID0gW107XHJcbiAgICBmcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGggPSB7fTtcclxuICAgIGZyZWVSZWZNZW1vcnkgPSBbXTtcclxuICAgIGVuZ2luZTtcclxuICAgIGNvbnN0cnVjdG9yKGVuZ2luZSkge1xyXG4gICAgICAgIHRoaXMuZW5naW5lID0gZW5naW5lO1xyXG4gICAgfVxyXG4gICAgYWxsb2NDYWxsYmFja0luZm9NZW1vcnkoYXJnc0xlbmd0aCkge1xyXG4gICAgICAgIGNvbnN0IGNhY2hlQXJyYXkgPSB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXTtcclxuICAgICAgICBpZiAoY2FjaGVBcnJheSAmJiBjYWNoZUFycmF5Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVBcnJheS5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVuZ2luZS51bml0eUFwaS5fbWFsbG9jKChhcmdzTGVuZ3RoICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgKyAxKSA8PCAyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhbGxvY1JlZk1lbW9yeSgpIHtcclxuICAgICAgICBpZiAodGhpcy5mcmVlUmVmTWVtb3J5Lmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnJlZVJlZk1lbW9yeS5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbmdpbmUudW5pdHlBcGkuX21hbGxvYyhBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiA8PCAyKTtcclxuICAgIH1cclxuICAgIHJlY3ljbGVSZWZNZW1vcnkoYnVmZmVyUHRyKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZnJlZVJlZk1lbW9yeS5sZW5ndGggPiAyMCkge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5fZnJlZShidWZmZXJQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5mcmVlUmVmTWVtb3J5LnB1c2goYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KGJ1ZmZlclB0ciwgYXJncykge1xyXG4gICAgICAgIGNvbnN0IGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICBpZiAoIXRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdICYmIGFyZ3NMZW5ndGggPCA1KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGNhY2hlQXJyYXkgPSB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXTtcclxuICAgICAgICBpZiAoIWNhY2hlQXJyYXkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBidWZmZXJQdHJJbjMyID0gYnVmZmVyUHRyIDw8IDI7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzTGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3NbaV0gaW5zdGFuY2VvZiBBcnJheSAmJiBhcmdzW2ldLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlY3ljbGVSZWZNZW1vcnkodGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW2J1ZmZlclB0ckluMzIgKyBpICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgKyAxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g5ouN6ISR6KKL5a6a55qE5pyA5aSn57yT5a2Y5Liq5pWw5aSn5bCP44CCIDUwIC0g5Y+C5pWw5Liq5pWwICogMTBcclxuICAgICAgICBpZiAoY2FjaGVBcnJheS5sZW5ndGggPiAoNTAgLSBhcmdzTGVuZ3RoICogMTApKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9mcmVlKGJ1ZmZlclB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjYWNoZUFycmF5LnB1c2goYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIGludHB0cueahOagvOW8j+S4umlk5bem56e75Zub5L2NXHJcbiAgICAgKlxyXG4gICAgICog5Y+z5L6n5Zub5L2N77yM5piv5Li65LqG5Zyo5Y+z5Zub5L2N5a2Y5YKo5Y+C5pWw55qE5bqP5Y+377yM6L+Z5qC35Y+v5Lul55So5LqO6KGo56S6Y2FsbGJhY2tpbmZv5Y+C5pWw55qEaW50cHRyXHJcbiAgICAgKi9cclxuICAgIC8vIHN0YXRpYyBHZXRNb2NrUG9pbnRlcihhcmdzOiBhbnlbXSk6IE1vY2tJbnRQdHIge1xyXG4gICAgLy8gICAgIGxldCBpbmRleDogbnVtYmVyO1xyXG4gICAgLy8gICAgIGluZGV4ID0gdGhpcy5mcmVlSW5mb3NJbmRleC5wb3AoKTtcclxuICAgIC8vICAgICAvLyBpbmRleOacgOWwj+S4ujFcclxuICAgIC8vICAgICBpZiAoaW5kZXgpIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5pbmZvc1tpbmRleF0uYXJncyA9IGFyZ3M7XHJcbiAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2gobmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKGFyZ3MpKSAtIDE7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIHJldHVybiBpbmRleCA8PCA0O1xyXG4gICAgLy8gfVxyXG4gICAgR2V0TW9ja1BvaW50ZXIoYXJncykge1xyXG4gICAgICAgIGNvbnN0IGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICBsZXQgYnVmZmVyUHRySW44ID0gdGhpcy5hbGxvY0NhbGxiYWNrSW5mb01lbW9yeShhcmdzTGVuZ3RoKTtcclxuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLmZyZWVJbmZvc0luZGV4LnBvcCgpO1xyXG4gICAgICAgIGxldCBmdW5jdGlvbkNhbGxiYWNrSW5mbztcclxuICAgICAgICAvLyBpbmRleOacgOWwj+S4ujFcclxuICAgICAgICBpZiAoaW5kZXgpIHtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gdGhpcy5pbmZvc1tpbmRleF0pLmFyZ3MgPSBhcmdzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2goZnVuY3Rpb25DYWxsYmFja0luZm8gPSBuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oYXJncykpIC0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHVuaXR5QXBpID0gdGhpcy5lbmdpbmUudW5pdHlBcGk7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyUHRySW4zMiA9IGJ1ZmZlclB0ckluOCA+PiAyO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVAzMltidWZmZXJQdHJJbjMyXSA9IGluZGV4O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJnc0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBhcmcgPSBhcmdzW2ldO1xyXG4gICAgICAgICAgICAvLyBpbml0IGVhY2ggdmFsdWVcclxuICAgICAgICAgICAgY29uc3QganNWYWx1ZVR5cGUgPSBHZXRUeXBlKHRoaXMuZW5naW5lLCBhcmcpO1xyXG4gICAgICAgICAgICBjb25zdCBqc1ZhbHVlUHRyID0gYnVmZmVyUHRySW4zMiArIGkgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDE7XHJcbiAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyXSA9IGpzVmFsdWVUeXBlOyAvLyBqc3ZhbHVldHlwZVxyXG4gICAgICAgICAgICBpZiAoanNWYWx1ZVR5cGUgPT0gMiB8fCBqc1ZhbHVlVHlwZSA9PSA0IHx8IGpzVmFsdWVUeXBlID09IDUxMikge1xyXG4gICAgICAgICAgICAgICAgLy8gYmlnaW5044CBbnVtYmVyIG9yIGRhdGVcclxuICAgICAgICAgICAgICAgICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKHRoaXMuZW5naW5lLCBhcmcsIGpzVmFsdWVUeXBlLCBqc1ZhbHVlUHRyICsgMSk7IC8vIHZhbHVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoanNWYWx1ZVR5cGUgPT0gOCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZ1bmN0aW9uQ2FsbGJhY2tJbmZvLnN0YWNrID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbkNhbGxiYWNrSW5mby5zdGFjayA9IHVuaXR5QXBpLnN0YWNrU2F2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIChqc1ZhbHVlUHRyICsgMikgPDwgMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoanNWYWx1ZVR5cGUgPT0gNjQgJiYgYXJnIGluc3RhbmNlb2YgQXJyYXkgJiYgYXJnLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBtYXliZSBhIHJlZlxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIDApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmUHRySW44ID0gdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAyXSA9IHRoaXMuYWxsb2NSZWZNZW1vcnkoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlZlB0ciA9IHJlZlB0ckluOCA+PiAyO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmVmFsdWVUeXBlID0gdW5pdHlBcGkuSEVBUDMyW3JlZlB0cl0gPSBHZXRUeXBlKHRoaXMuZW5naW5lLCBhcmdbMF0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlZlZhbHVlVHlwZSA9PSAyIHx8IHJlZlZhbHVlVHlwZSA9PSA0IHx8IHJlZlZhbHVlVHlwZSA9PSA1MTIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBudW1iZXIgb3IgZGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKHRoaXMuZW5naW5lLCBhcmdbMF0sIHJlZlZhbHVlVHlwZSwgcmVmUHRyICsgMSk7IC8vIHZhbHVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbcmVmUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmdbMF0sIHJlZlZhbHVlVHlwZSwgKHJlZlB0ciArIDIpIDw8IDIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW3JlZlB0ciArIDNdID0gYnVmZmVyUHRySW44OyAvLyBhIHBvaW50ZXIgdG8gdGhlIGluZm9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIG90aGVyXHJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwgKGpzVmFsdWVQdHIgKyAyKSA8PCAyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDNdID0gYnVmZmVyUHRySW44OyAvLyBhIHBvaW50ZXIgdG8gdGhlIGluZm9cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlclB0ckluODtcclxuICAgIH1cclxuICAgIC8vIHN0YXRpYyBHZXRCeU1vY2tQb2ludGVyKGludHB0cjogTW9ja0ludFB0cik6IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvIHtcclxuICAgIC8vICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbnRwdHIgPj4gNF07XHJcbiAgICAvLyB9XHJcbiAgICBHZXRCeU1vY2tQb2ludGVyKHB0ckluOCkge1xyXG4gICAgICAgIGNvbnN0IHB0ckluMzIgPSBwdHJJbjggPj4gMjtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXTtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICB9XHJcbiAgICBHZXRSZXR1cm5WYWx1ZUFuZFJlY3ljbGUocHRySW44KSB7XHJcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xyXG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICAgICAgbGV0IHJldCA9IGluZm8ucmV0dXJuVmFsdWU7XHJcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KHB0ckluOCwgaW5mby5hcmdzKTtcclxuICAgICAgICBpZiAoaW5mby5zdGFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5zdGFja1Jlc3RvcmUoaW5mby5zdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluZm8ucmVjeWNsZSgpO1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIFJlbGVhc2VCeU1vY2tJbnRQdHIocHRySW44KSB7XHJcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xyXG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KHB0ckluOCwgaW5mby5hcmdzKTtcclxuICAgICAgICBpZiAoaW5mby5zdGFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5zdGFja1Jlc3RvcmUoaW5mby5zdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluZm8ucmVjeWNsZSgpO1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICB9XHJcbiAgICBHZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlUHRySW44KSB7XHJcbiAgICAgICAgbGV0IGhlYXAzMiA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMjtcclxuICAgICAgICBjb25zdCBpbmZvUHRySW44ID0gaGVhcDMyWyh2YWx1ZVB0ckluOCA+PiAyKSArIDNdO1xyXG4gICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb0luZGV4ID0gaGVhcDMyW2luZm9QdHJJbjggPj4gMl07XHJcbiAgICAgICAgY29uc3QgYXJnc0luZGV4ID0gKHZhbHVlUHRySW44IC0gaW5mb1B0ckluOCAtIDQpIC8gKDQgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mb3NbY2FsbGJhY2tJbmZvSW5kZXhdLmFyZ3NbYXJnc0luZGV4XTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcclxuLyoqXHJcbiAqIOS7o+ihqOS4gOS4qkpTRnVuY3Rpb25cclxuICovXHJcbmNsYXNzIEpTRnVuY3Rpb24ge1xyXG4gICAgX2Z1bmM7XHJcbiAgICBpZDtcclxuICAgIGFyZ3MgPSBbXTtcclxuICAgIGxhc3RFeGNlcHRpb24gPSBudWxsO1xyXG4gICAgY29uc3RydWN0b3IoaWQsIGZ1bmMpIHtcclxuICAgICAgICB0aGlzLl9mdW5jID0gZnVuYztcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICB9XHJcbiAgICBpbnZva2UoKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbLi4udGhpcy5hcmdzXTtcclxuICAgICAgICB0aGlzLmFyZ3MubGVuZ3RoID0gMDtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkpTRnVuY3Rpb24gPSBKU0Z1bmN0aW9uO1xyXG4vKipcclxuICog5Luj6KGo5LiA5LiqSlNPYmplY3RcclxuICovXHJcbmNsYXNzIEpTT2JqZWN0IHtcclxuICAgIF9vYmo7XHJcbiAgICBpZDtcclxuICAgIGNvbnN0cnVjdG9yKGlkLCBvYmopIHtcclxuICAgICAgICB0aGlzLl9vYmogPSBvYmo7XHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgfVxyXG4gICAgZ2V0T2JqZWN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9vYmo7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5KU09iamVjdCA9IEpTT2JqZWN0O1xyXG5jbGFzcyBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5IHtcclxuICAgIHN0YXRpYyByZWd1bGFySUQgPSAxO1xyXG4gICAgc3RhdGljIGZyZWVJRCA9IFtdO1xyXG4gICAgc3RhdGljIGlkTWFwID0gbmV3IFdlYWtNYXAoKTtcclxuICAgIHN0YXRpYyBqc0Z1bmNPck9iamVjdEtWID0ge307XHJcbiAgICBzdGF0aWMgZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmNWYWx1ZSkge1xyXG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KGZ1bmNWYWx1ZSk7XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5mcmVlSUQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlkID0gdGhpcy5mcmVlSUQucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGZ1bmMgPSBuZXcgSlNGdW5jdGlvbihpZCwgZnVuY1ZhbHVlKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLnNldChmdW5jVmFsdWUsIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdID0gZnVuYztcclxuICAgICAgICByZXR1cm4gZnVuYztcclxuICAgIH1cclxuICAgIHN0YXRpYyBnZXRPckNyZWF0ZUpTT2JqZWN0KG9iaikge1xyXG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KG9iaik7XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5mcmVlSUQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlkID0gdGhpcy5mcmVlSUQucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGpzT2JqZWN0ID0gbmV3IEpTT2JqZWN0KGlkLCBvYmopO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuc2V0KG9iaiwgaWQpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBqc09iamVjdDtcclxuICAgICAgICByZXR1cm4ganNPYmplY3Q7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZ2V0SlNPYmplY3RCeUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcmVtb3ZlSlNPYmplY3RCeUlkKGlkKSB7XHJcbiAgICAgICAgY29uc3QganNPYmplY3QgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIGlmICghanNPYmplY3QpXHJcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ3JlbW92ZUpTT2JqZWN0QnlJZCBmYWlsZWQ6IGlkIGlzIGludmFsaWQ6ICcgKyBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNPYmplY3QuZ2V0T2JqZWN0KCkpO1xyXG4gICAgICAgIGRlbGV0ZSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIHRoaXMuZnJlZUlELnB1c2goaWQpO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGdldEpTRnVuY3Rpb25CeUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcmVtb3ZlSlNGdW5jdGlvbkJ5SWQoaWQpIHtcclxuICAgICAgICBjb25zdCBqc0Z1bmMgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIGlmICghanNGdW5jKVxyXG4gICAgICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKCdyZW1vdmVKU0Z1bmN0aW9uQnlJZCBmYWlsZWQ6IGlkIGlzIGludmFsaWQ6ICcgKyBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNGdW5jLl9mdW5jKTtcclxuICAgICAgICBkZWxldGUganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICB0aGlzLmZyZWVJRC5wdXNoKGlkKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5O1xyXG4vKipcclxuICogQ1NoYXJw5a+56LGh6K6w5b2V6KGo77yM6K6w5b2V5omA5pyJQ1NoYXJw5a+56LGh5bm25YiG6YWNaWRcclxuICog5ZKMcHVlcnRzLmRsbOaJgOWBmueahOS4gOagt1xyXG4gKi9cclxuY2xhc3MgQ1NoYXJwT2JqZWN0TWFwIHtcclxuICAgIGNsYXNzZXMgPSBbbnVsbF07XHJcbiAgICBuYXRpdmVPYmplY3RLViA9IG5ldyBNYXAoKTtcclxuICAgIC8vIHByaXZhdGUgbmF0aXZlT2JqZWN0S1Y6IHsgW29iamVjdElEOiBDU0lkZW50aWZpZXJdOiBXZWFrUmVmPGFueT4gfSA9IHt9O1xyXG4gICAgLy8gcHJpdmF0ZSBjc0lEV2Vha01hcDogV2Vha01hcDxhbnksIENTSWRlbnRpZmllcj4gPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgbmFtZXNUb0NsYXNzZXNJRCA9IHt9O1xyXG4gICAgY2xhc3NJRFdlYWtNYXAgPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYWRkQ2FsbGVkJywgdGhpcy5hZGRDYWxsZWQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVtb3ZlQ2FsbGVkJywgdGhpcy5yZW1vdmVDYWxsZWQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnd3InLCB0aGlzLm5hdGl2ZU9iamVjdEtWLnNpemUpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgfVxyXG4gICAgX21lbW9yeURlYnVnID0gZmFsc2U7XHJcbiAgICBhZGRDYWxsZWQgPSAwO1xyXG4gICAgcmVtb3ZlQ2FsbGVkID0gMDtcclxuICAgIGFkZChjc0lELCBvYmopIHtcclxuICAgICAgICB0aGlzLl9tZW1vcnlEZWJ1ZyAmJiB0aGlzLmFkZENhbGxlZCsrO1xyXG4gICAgICAgIC8vIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF0gPSBjcmVhdGVXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgLy8gdGhpcy5jc0lEV2Vha01hcC5zZXQob2JqLCBjc0lEKTtcclxuICAgICAgICB0aGlzLm5hdGl2ZU9iamVjdEtWLnNldChjc0lELCBjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgIG9ialsnJGNzaWQnXSA9IGNzSUQ7XHJcbiAgICB9XHJcbiAgICByZW1vdmUoY3NJRCkge1xyXG4gICAgICAgIHRoaXMuX21lbW9yeURlYnVnICYmIHRoaXMucmVtb3ZlQ2FsbGVkKys7XHJcbiAgICAgICAgLy8gZGVsZXRlIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF07XHJcbiAgICAgICAgdGhpcy5uYXRpdmVPYmplY3RLVi5kZWxldGUoY3NJRCk7XHJcbiAgICB9XHJcbiAgICBmaW5kT3JBZGRPYmplY3QoY3NJRCwgY2xhc3NJRCkge1xyXG4gICAgICAgIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWLmdldChjc0lEKTtcclxuICAgICAgICAvLyBsZXQgcmV0ID0gdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXTtcclxuICAgICAgICBpZiAocmV0ICYmIChyZXQgPSByZXQuZGVyZWYoKSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0ID0gdGhpcy5jbGFzc2VzW2NsYXNzSURdLmNyZWF0ZUZyb21DUyhjc0lEKTtcclxuICAgICAgICAvLyB0aGlzLmFkZChjc0lELCByZXQpOyDmnoTpgKDlh73mlbDph4zotJ/otKPosIPnlKhcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gICAgZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChvYmopIHtcclxuICAgICAgICAvLyByZXR1cm4gdGhpcy5jc0lEV2Vha01hcC5nZXQob2JqKTtcclxuICAgICAgICByZXR1cm4gb2JqID8gb2JqLiRjc2lkIDogMDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IENTaGFycE9iamVjdE1hcDtcclxuO1xyXG52YXIgZGVzdHJ1Y3RvcnMgPSB7fTtcclxuZXhwb3J0cy5nbG9iYWwgPSBnbG9iYWwgPSBnbG9iYWwgfHwgZ2xvYmFsVGhpcyB8fCB3aW5kb3c7XHJcbmdsb2JhbC5nbG9iYWwgPSBnbG9iYWw7XHJcbmNvbnN0IGNyZWF0ZVdlYWtSZWYgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHR5cGVvZiBXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBXWFdlYWtSZWYgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIldlYWtSZWYgaXMgbm90IGRlZmluZWQuIG1heWJlIHlvdSBzaG91bGQgdXNlIG5ld2VyIGVudmlyb25tZW50XCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGVyZWYoKSB7IHJldHVybiBvYmo7IH0gfTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwidXNpbmcgV1hXZWFrUmVmXCIpO1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgV1hXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXZWFrUmVmKG9iaik7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5leHBvcnRzLmNyZWF0ZVdlYWtSZWYgPSBjcmVhdGVXZWFrUmVmO1xyXG5jbGFzcyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2sge1xyXG4gICAgX2hhbmRsZXI7XHJcbiAgICByZWZzID0gW107XHJcbiAgICBoZWxkcyA9IFtdO1xyXG4gICAgYXZhaWxhYmxlSW5kZXggPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yKGhhbmRsZXIpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oXCJGaW5hbGl6YXRpb25SZWdpc3RlciBpcyBub3QgZGVmaW5lZC4gdXNpbmcgRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrXCIpO1xyXG4gICAgICAgIGdsb2JhbC5fcHVlcnRzX3JlZ2lzdHJ5ID0gdGhpcztcclxuICAgICAgICB0aGlzLl9oYW5kbGVyID0gaGFuZGxlcjtcclxuICAgIH1cclxuICAgIHJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYXZhaWxhYmxlSW5kZXgubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5hdmFpbGFibGVJbmRleC5wb3AoKTtcclxuICAgICAgICAgICAgdGhpcy5yZWZzW2luZGV4XSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcclxuICAgICAgICAgICAgdGhpcy5oZWxkc1tpbmRleF0gPSBoZWxkVmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlZnMucHVzaChjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgICAgICB0aGlzLmhlbGRzLnB1c2goaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOa4hemZpOWPr+iDveW3sue7j+WkseaViOeahFdlYWtSZWZcclxuICAgICAqL1xyXG4gICAgaXRlcmF0ZVBvc2l0aW9uID0gMDtcclxuICAgIGNsZWFudXAocGFydCA9IDEpIHtcclxuICAgICAgICBjb25zdCBzdGVwQ291bnQgPSB0aGlzLnJlZnMubGVuZ3RoIC8gcGFydDtcclxuICAgICAgICBsZXQgaSA9IHRoaXMuaXRlcmF0ZVBvc2l0aW9uO1xyXG4gICAgICAgIGZvciAobGV0IGN1cnJlbnRTdGVwID0gMDsgaSA8IHRoaXMucmVmcy5sZW5ndGggJiYgY3VycmVudFN0ZXAgPCBzdGVwQ291bnQ7IGkgPSAoaSA9PSB0aGlzLnJlZnMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMSksIGN1cnJlbnRTdGVwKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVmc1tpXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVmc1tpXS5kZXJlZigpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDnm67liY3msqHmnInlhoXlrZjmlbTnkIbog73lipvvvIzlpoLmnpzmuLjmiI/kuK3mnJ9yZWblvojlpJrkvYblkI7mnJ/lsJHkuobvvIzov5nph4zlsLHkvJrnmb3otLnpgY3ljobmrKHmlbBcclxuICAgICAgICAgICAgICAgIC8vIOS9humBjeWOhuS5n+WPquaYr+S4gOWPpT095ZKMY29udGludWXvvIzmtarotLnlvbHlk43kuI3lpKdcclxuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlSW5kZXgucHVzaChpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVmc1tpXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZXIodGhpcy5oZWxkc1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pdGVyYXRlUG9zaXRpb24gPSBpO1xyXG4gICAgfVxyXG59XHJcbnZhciByZWdpc3RyeSA9IG51bGw7XHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICByZWdpc3RyeSA9IG5ldyAodHlwZW9mIEZpbmFsaXphdGlvblJlZ2lzdHJ5ID09ICd1bmRlZmluZWQnID8gRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrIDogRmluYWxpemF0aW9uUmVnaXN0cnkpKGZ1bmN0aW9uIChoZWxkVmFsdWUpIHtcclxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xyXG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IGZpbmQgZGVzdHJ1Y3RvciBmb3IgXCIgKyBoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoLS1jYWxsYmFjay5yZWYgPT0gMCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXTtcclxuICAgICAgICAgICAgY2FsbGJhY2soaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBPbkZpbmFsaXplKG9iaiwgaGVsZFZhbHVlLCBjYWxsYmFjaykge1xyXG4gICAgaWYgKCFyZWdpc3RyeSkge1xyXG4gICAgICAgIGluaXQoKTtcclxuICAgIH1cclxuICAgIGxldCBvcmlnaW5DYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XHJcbiAgICBpZiAob3JpZ2luQ2FsbGJhY2spIHtcclxuICAgICAgICAvLyBXZWFrUmVm5YaF5a656YeK5pS+5pe25py65Y+v6IO95q+UZmluYWxpemF0aW9uUmVnaXN0cnnnmoTop6blj5Hmm7Tml6nvvIzliY3pnaLlpoLmnpzlj5HnjrB3ZWFrUmVm5Li656m65Lya6YeN5paw5Yib5bu65a+56LGhXHJcbiAgICAgICAgLy8g5L2G5LmL5YmN5a+56LGh55qEZmluYWxpemF0aW9uUmVnaXN0cnnmnIDnu4jlj4jogq/lrprkvJrop6blj5HjgIJcclxuICAgICAgICAvLyDmiYDku6XlpoLmnpzpgYfliLDov5nkuKrmg4XlhrXvvIzpnIDopoHnu5lkZXN0cnVjdG9y5Yqg6K6h5pWwXHJcbiAgICAgICAgKytvcmlnaW5DYWxsYmFjay5yZWY7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsYmFjay5yZWYgPSAxO1xyXG4gICAgICAgIGRlc3RydWN0b3JzW2hlbGRWYWx1ZV0gPSBjYWxsYmFjaztcclxuICAgIH1cclxuICAgIHJlZ2lzdHJ5LnJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKTtcclxufVxyXG5leHBvcnRzLk9uRmluYWxpemUgPSBPbkZpbmFsaXplO1xyXG5jbGFzcyBQdWVydHNKU0VuZ2luZSB7XHJcbiAgICBjc2hhcnBPYmplY3RNYXA7XHJcbiAgICBmdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXI7XHJcbiAgICB1bml0eUFwaTtcclxuICAgIC8qKiDlrZfnrKbkuLLnvJPlrZjvvIzpu5jorqTkuLoyNTblrZfoioIgKi9cclxuICAgIHN0ckJ1ZmZlcjtcclxuICAgIHN0cmluZ0J1ZmZlclNpemUgPSAyNTY7XHJcbiAgICBsYXN0UmV0dXJuQ1NSZXN1bHQgPSBudWxsO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICAvLyDov5nkuKTkuKrmmK9QdWVydHPnlKjnmoTnmoTnnJ/mraPnmoRDU2hhcnDlh73mlbDmjIfpkohcclxuICAgIEdldEpTQXJndW1lbnRzQ2FsbGJhY2s7XHJcbiAgICBnZW5lcmFsRGVzdHJ1Y3RvcjtcclxuICAgIGNvbnN0cnVjdG9yKGN0b3JQYXJhbSkge1xyXG4gICAgICAgIHRoaXMuY3NoYXJwT2JqZWN0TWFwID0gbmV3IENTaGFycE9iamVjdE1hcCgpO1xyXG4gICAgICAgIHRoaXMuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyID0gbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcih0aGlzKTtcclxuICAgICAgICBjb25zdCB7IFVURjhUb1N0cmluZywgX21hbGxvYywgX2ZyZWUsIF9zZXRUZW1wUmV0MCwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHN0YWNrU2F2ZSwgc3RhY2tSZXN0b3JlLCBzdGFja0FsbG9jLCBnZXRXYXNtVGFibGVFbnRyeSwgYWRkRnVuY3Rpb24sIHJlbW92ZUZ1bmN0aW9uLCBfQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2ssIF9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjaywgX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssIEluamVjdFBhcGlHTE5hdGl2ZUltcGwsIFBBcGlDYWxsYmFja1dpdGhTY29wZSwgUEFwaUNvbnN0cnVjdG9yV2l0aFNjb3BlLCBIRUFQOCwgSEVBUFU4LCBIRUFQMzIsIEhFQVBGMzIsIEhFQVBGNjQsIH0gPSBjdG9yUGFyYW07XHJcbiAgICAgICAgdGhpcy5zdHJCdWZmZXIgPSBfbWFsbG9jKHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSk7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaSA9IHtcclxuICAgICAgICAgICAgVVRGOFRvU3RyaW5nLFxyXG4gICAgICAgICAgICBfbWFsbG9jLFxyXG4gICAgICAgICAgICBfZnJlZSxcclxuICAgICAgICAgICAgX3NldFRlbXBSZXQwLFxyXG4gICAgICAgICAgICBzdHJpbmdUb1VURjgsXHJcbiAgICAgICAgICAgIGxlbmd0aEJ5dGVzVVRGOCxcclxuICAgICAgICAgICAgc3RhY2tTYXZlLFxyXG4gICAgICAgICAgICBzdGFja1Jlc3RvcmUsXHJcbiAgICAgICAgICAgIHN0YWNrQWxsb2MsXHJcbiAgICAgICAgICAgIGdldFdhc21UYWJsZUVudHJ5LFxyXG4gICAgICAgICAgICBhZGRGdW5jdGlvbixcclxuICAgICAgICAgICAgcmVtb3ZlRnVuY3Rpb24sXHJcbiAgICAgICAgICAgIF9DYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayxcclxuICAgICAgICAgICAgX0NhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrLFxyXG4gICAgICAgICAgICBfQ2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayxcclxuICAgICAgICAgICAgSW5qZWN0UGFwaUdMTmF0aXZlSW1wbCxcclxuICAgICAgICAgICAgUEFwaUNhbGxiYWNrV2l0aFNjb3BlLFxyXG4gICAgICAgICAgICBQQXBpQ29uc3RydWN0b3JXaXRoU2NvcGUsXHJcbiAgICAgICAgICAgIEhFQVA4LFxyXG4gICAgICAgICAgICBIRUFQVTgsXHJcbiAgICAgICAgICAgIEhFQVAzMixcclxuICAgICAgICAgICAgSEVBUEYzMixcclxuICAgICAgICAgICAgSEVBUEY2NCxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGdsb2JhbC5fX3RnanNFdmFsU2NyaXB0ID0gdHlwZW9mIGV2YWwgPT0gXCJ1bmRlZmluZWRcIiA/ICgpID0+IHsgfSA6IGV2YWw7XHJcbiAgICAgICAgZ2xvYmFsLl9fdGdqc1NldFByb21pc2VSZWplY3RDYWxsYmFjayA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICB3eC5vblVuaGFuZGxlZFJlamVjdGlvbihjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVuaGFuZGxlZHJlamVjdGlvblwiLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIGdsb2JhbC5fX3B1ZXJ0c0dldExhc3RFeGNlcHRpb24gPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhc3RFeGNlcHRpb247XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIC8qKiBjYWxsIHdoZW4gd2FzbSBncm93IG1lbW9yeSAqL1xyXG4gICAgdXBkYXRlR2xvYmFsQnVmZmVyQW5kVmlld3MoSEVBUDgsIEhFQVBVOCwgSEVBUDMyLCBIRUFQRjMyLCBIRUFQRjY0KSB7XHJcbiAgICAgICAgbGV0IHVuaXR5QXBpID0gdGhpcy51bml0eUFwaTtcclxuICAgICAgICB1bml0eUFwaS5IRUFQOCA9IEhFQVA4O1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVBVOCA9IEhFQVBVODtcclxuICAgICAgICB1bml0eUFwaS5IRUFQMzIgPSBIRUFQMzI7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUEYzMiA9IEhFQVBGMzI7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUEY2NCA9IEhFQVBGNjQ7XHJcbiAgICB9XHJcbiAgICBtZW1jcHkoZGVzdCwgc3JjLCBudW0pIHtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLkhFQVBVOC5jb3B5V2l0aGluKGRlc3QsIHNyYywgc3JjICsgbnVtKTtcclxuICAgIH1cclxuICAgIEpTU3RyaW5nVG9DU1N0cmluZyhyZXR1cm5TdHIsIC8qKiBvdXQgaW50ICovIGxlbmd0aE9mZnNldCkge1xyXG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xyXG4gICAgICAgIHNldE91dFZhbHVlMzIodGhpcywgbGVuZ3RoT2Zmc2V0LCBieXRlQ291bnQpO1xyXG4gICAgICAgIGxldCBidWZmZXIgPSB0aGlzLnVuaXR5QXBpLl9tYWxsb2MoYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5zdHJpbmdUb1VURjgocmV0dXJuU3RyLCBidWZmZXIsIGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICB9XHJcbiAgICBKU1N0cmluZ1RvVGVtcENTU3RyaW5nKHJldHVyblN0ciwgLyoqIG91dCBpbnQgKi8gbGVuZ3RoT2Zmc2V0KSB7XHJcbiAgICAgICAgaWYgKHJldHVyblN0ciA9PT0gbnVsbCB8fCByZXR1cm5TdHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGJ5dGVDb3VudCA9IHRoaXMudW5pdHlBcGkubGVuZ3RoQnl0ZXNVVEY4KHJldHVyblN0cik7XHJcbiAgICAgICAgc2V0T3V0VmFsdWUzMih0aGlzLCBsZW5ndGhPZmZzZXQsIGJ5dGVDb3VudCk7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSA8IGJ5dGVDb3VudCArIDEpIHtcclxuICAgICAgICAgICAgdGhpcy51bml0eUFwaS5fZnJlZSh0aGlzLnN0ckJ1ZmZlcik7XHJcbiAgICAgICAgICAgIHRoaXMuc3RyQnVmZmVyID0gdGhpcy51bml0eUFwaS5fbWFsbG9jKHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSA9IE1hdGgubWF4KDIgKiB0aGlzLnN0cmluZ0J1ZmZlclNpemUsIGJ5dGVDb3VudCArIDEpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5zdHJpbmdUb1VURjgocmV0dXJuU3RyLCB0aGlzLnN0ckJ1ZmZlciwgYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyQnVmZmVyO1xyXG4gICAgfVxyXG4gICAgSlNTdHJpbmdUb0NTU3RyaW5nT25TdGFjayhyZXR1cm5TdHIsIC8qKiBvdXQgaW50ICovIGxlbmd0aE9mZnNldCkge1xyXG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xyXG4gICAgICAgIHNldE91dFZhbHVlMzIodGhpcywgbGVuZ3RoT2Zmc2V0LCBieXRlQ291bnQpO1xyXG4gICAgICAgIHZhciBidWZmZXIgPSB0aGlzLnVuaXR5QXBpLnN0YWNrQWxsb2MoYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5zdHJpbmdUb1VURjgocmV0dXJuU3RyLCBidWZmZXIsIGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICB9XHJcbiAgICBtYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBmdW5jdGlvblB0ciwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICAvLyDkuI3og73nlKjnrq3lpLTlh73mlbDvvIHmraTlpITov5Tlm57nmoTlh73mlbDkvJrotYvlgLzliLDlhbfkvZPnmoRjbGFzc+S4iu+8jOWFtnRoaXPmjIfpkojmnInlkKvkuYnjgIJcclxuICAgICAgICBjb25zdCBlbmdpbmUgPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xyXG4gICAgICAgICAgICBpZiAobmV3LnRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIm5vdCBhIGNvbnN0cnVjdG9yJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IGNhbGxiYWNrSW5mb1B0ciA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0TW9ja1BvaW50ZXIoYXJncyk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIFxyXG4gICAgICAgICAgICAgICAgLy8gZ2V0SW50UHRyTWFuYWdlcigpLkdldFBvaW50ZXJGb3JKU1ZhbHVlKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgaXNTdGF0aWMgPyAwIDogZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHRoaXMpLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja0lkeCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRSZXR1cm5WYWx1ZUFuZFJlY3ljbGUoY2FsbGJhY2tJbmZvUHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5SZWxlYXNlQnlNb2NrSW50UHRyKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGNhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLl9DYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgc2VsZlB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxuICAgIGNhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51bml0eUFwaS5fQ2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbiAgICBjYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gUHVlcnRzSlNFbmdpbmU7XHJcbmZ1bmN0aW9uIEdldFR5cGUoZW5naW5lLCB2YWx1ZSkge1xyXG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gMTtcclxuICAgIH1cclxuICAgIGlmIChpc0JpZ0ludCh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gMjtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcclxuICAgICAgICByZXR1cm4gNDtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXR1cm4gODtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgcmV0dXJuIDE2O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgcmV0dXJuIDI1NjtcclxuICAgIH1cclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcclxuICAgICAgICByZXR1cm4gNTEyO1xyXG4gICAgfVxyXG4gICAgLy8gaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHsgcmV0dXJuIDEyOCB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgIHJldHVybiA2NDtcclxuICAgIH1cclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IHZhbHVlIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xyXG4gICAgICAgIHJldHVybiAxMDI0O1xyXG4gICAgfVxyXG4gICAgaWYgKGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdCh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gMzI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gNjQ7XHJcbn1cclxuZXhwb3J0cy5HZXRUeXBlID0gR2V0VHlwZTtcclxuZnVuY3Rpb24gbWFrZUJpZ0ludChsb3csIGhpZ2gpIHtcclxuICAgIHJldHVybiAoQmlnSW50KGhpZ2gpIDw8IDMybikgfCBCaWdJbnQobG93ID4+PiAwKTtcclxufVxyXG5leHBvcnRzLm1ha2VCaWdJbnQgPSBtYWtlQmlnSW50O1xyXG5mdW5jdGlvbiBzZXRPdXRWYWx1ZTMyKGVuZ2luZSwgdmFsdWVQdHIsIHZhbHVlKSB7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3ZhbHVlUHRyID4+IDJdID0gdmFsdWU7XHJcbn1cclxuZXhwb3J0cy5zZXRPdXRWYWx1ZTMyID0gc2V0T3V0VmFsdWUzMjtcclxuZnVuY3Rpb24gc2V0T3V0VmFsdWU4KGVuZ2luZSwgdmFsdWVQdHIsIHZhbHVlKSB7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDhbdmFsdWVQdHJdID0gdmFsdWU7XHJcbn1cclxuZXhwb3J0cy5zZXRPdXRWYWx1ZTggPSBzZXRPdXRWYWx1ZTg7XHJcbmZ1bmN0aW9uIGlzQmlnSW50KHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBCaWdJbnQgfHwgdHlwZW9mIHZhbHVlID09PSAnYmlnaW50JztcclxufVxyXG5leHBvcnRzLmlzQmlnSW50ID0gaXNCaWdJbnQ7XHJcbmZ1bmN0aW9uIHJldHVybkJpZ0ludChlbmdpbmUsIHZhbHVlKSB7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuX3NldFRlbXBSZXQwKE51bWJlcih2YWx1ZSA+PiAzMm4pKTsgLy8gaGlnaFxyXG4gICAgcmV0dXJuIE51bWJlcih2YWx1ZSAmIDB4ZmZmZmZmZmZuKTsgLy8gbG93XHJcbn1cclxuZXhwb3J0cy5yZXR1cm5CaWdJbnQgPSByZXR1cm5CaWdJbnQ7XHJcbmZ1bmN0aW9uIHdyaXRlQmlnSW50KGVuZ2luZSwgcHRySW4zMiwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMl0gPSBOdW1iZXIodmFsdWUgJiAweGZmZmZmZmZmbik7IC8vIGxvd1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyICsgMV0gPSBOdW1iZXIodmFsdWUgPj4gMzJuKTsgLy8gaGlnaFxyXG59XHJcbmNvbnN0IHRtcEludDNBcnIgPSBuZXcgSW50MzJBcnJheSgyKTtcclxuY29uc3QgdG1wRmxvYXQ2NEFyciA9IG5ldyBGbG9hdDY0QXJyYXkodG1wSW50M0Fyci5idWZmZXIpO1xyXG5mdW5jdGlvbiB3cml0ZU51bWJlcihlbmdpbmUsIHB0ckluMzIsIHZhbHVlKSB7XHJcbiAgICAvLyBudW1iZXIgaW4ganMgaXMgZG91YmxlXHJcbiAgICB0bXBGbG9hdDY0QXJyWzBdID0gdmFsdWU7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdID0gdG1wSW50M0FyclswXTtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMiArIDFdID0gdG1wSW50M0FyclsxXTtcclxufVxyXG5mdW5jdGlvbiAkRmlsbEFyZ3VtZW50RmluYWxOdW1iZXJWYWx1ZShlbmdpbmUsIHZhbCwganNWYWx1ZVR5cGUsIHZhbFB0ckluMzIpIHtcclxuICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBzd2l0Y2ggKGpzVmFsdWVUeXBlKSB7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICB3cml0ZUJpZ0ludChlbmdpbmUsIHZhbFB0ckluMzIsIHZhbCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNDpcclxuICAgICAgICAgICAgd3JpdGVOdW1iZXIoZW5naW5lLCB2YWxQdHJJbjMyLCArdmFsKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA1MTI6XHJcbiAgICAgICAgICAgIHdyaXRlTnVtYmVyKGVuZ2luZSwgdmFsUHRySW4zMiwgdmFsLmdldFRpbWUoKSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uICRHZXRBcmd1bWVudEZpbmFsVmFsdWUoZW5naW5lLCB2YWwsIGpzVmFsdWVUeXBlLCBsZW5ndGhPZmZzZXQpIHtcclxuICAgIGlmICghanNWYWx1ZVR5cGUpXHJcbiAgICAgICAganNWYWx1ZVR5cGUgPSBHZXRUeXBlKGVuZ2luZSwgdmFsKTtcclxuICAgIHN3aXRjaCAoanNWYWx1ZVR5cGUpIHtcclxuICAgICAgICBjYXNlIDg6IHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nT25TdGFjayh2YWwsIGxlbmd0aE9mZnNldCk7XHJcbiAgICAgICAgY2FzZSAxNjogcmV0dXJuICt2YWw7XHJcbiAgICAgICAgY2FzZSAzMjogcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdCh2YWwpO1xyXG4gICAgICAgIGNhc2UgNjQ6IHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3QodmFsKS5pZDtcclxuICAgICAgICBjYXNlIDEyODogcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdCh2YWwpLmlkO1xyXG4gICAgICAgIGNhc2UgMjU2OiByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24odmFsKS5pZDtcclxuICAgICAgICBjYXNlIDEwMjQ6IHtcclxuICAgICAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKVxyXG4gICAgICAgICAgICAgICAgdmFsID0gbmV3IFVpbnQ4QXJyYXkodmFsKTtcclxuICAgICAgICAgICAgbGV0IHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKHZhbC5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVBVOC5zZXQodmFsLCBwdHIpO1xyXG4gICAgICAgICAgICBzZXRPdXRWYWx1ZTMyKGVuZ2luZSwgbGVuZ3RoT2Zmc2V0LCB2YWwuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBwdHI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWxpYnJhcnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXROdW1iZXJGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IG51bWJlciB7XHJcbi8vICAgICByZXR1cm4gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0RGF0ZUZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogbnVtYmVyIHtcclxuLy8gICAgIHJldHVybiAoZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKSBhcyBEYXRlKS5nZXRUaW1lKCk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldFN0cmluZ0Zyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCAvKm91dCBpbnQgKi9sZW5ndGhPZmZzZXQ6IG51bWJlciwgaXNCeVJlZjogYm9vbCk6IG51bWJlciB7XHJcbi8vICAgICB2YXIgcmV0dXJuU3RyID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPHN0cmluZz4odmFsdWUpO1xyXG4vLyAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcocmV0dXJuU3RyLCBsZW5ndGhPZmZzZXQpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRCb29sZWFuRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBib29sZWFuIHtcclxuLy8gICAgIHJldHVybiBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBWYWx1ZUlzQmlnSW50KGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBib29sZWFuIHtcclxuLy8gICAgIHZhciBiaWdpbnQgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8YW55Pih2YWx1ZSk7XHJcbi8vICAgICByZXR1cm4gYmlnaW50IGluc3RhbmNlb2YgQmlnSW50O1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRCaWdJbnRGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4vLyAgICAgdmFyIGJpZ2ludCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxhbnk+KHZhbHVlKTtcclxuLy8gICAgIHJldHVybiBiaWdpbnQ7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldE9iamVjdEZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XHJcbi8vICAgICB2YXIgbmF0aXZlT2JqZWN0ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuLy8gICAgIHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QobmF0aXZlT2JqZWN0KTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0RnVuY3Rpb25Gcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IEpTRnVuY3Rpb25QdHIge1xyXG4vLyAgICAgdmFyIGZ1bmMgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8KC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+KHZhbHVlKTtcclxuLy8gICAgIHZhciBqc2Z1bmMgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jKTtcclxuLy8gICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEpTT2JqZWN0RnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcclxuLy8gICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8KC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+KHZhbHVlKTtcclxuLy8gICAgIHZhciBqc29iaiA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdChvYmopO1xyXG4vLyAgICAgcmV0dXJuIGpzb2JqLmlkO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRBcnJheUJ1ZmZlckZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCAvKm91dCBpbnQgKi9sZW5ndGhPZmZzZXQ6IGFueSwgaXNPdXQ6IGJvb2wpIHtcclxuLy8gICAgIHZhciBhYiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxBcnJheUJ1ZmZlcj4odmFsdWUpO1xyXG4vLyAgICAgaWYgKGFiIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xyXG4vLyAgICAgICAgIGFiID0gYWIuYnVmZmVyO1xyXG4vLyAgICAgfVxyXG4vLyAgICAgdmFyIHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKGFiLmJ5dGVMZW5ndGgpO1xyXG4vLyAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4LnNldChuZXcgSW50OEFycmF5KGFiKSwgcHRyKTtcclxuLy8gICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbbGVuZ3RoT2Zmc2V0ID4+IDJdID0gYWIuYnl0ZUxlbmd0aDtcclxuLy8gICAgIHNldE91dFZhbHVlMzIoZW5naW5lLCBsZW5ndGhPZmZzZXQsIGFiLmJ5dGVMZW5ndGgpO1xyXG4vLyAgICAgcmV0dXJuIHB0cjtcclxuLy8gfVxyXG4vKipcclxuICogbWl4aW5cclxuICogSlPosIPnlKhDI+aXtu+8jEMj5L6n6I635Y+WSlPosIPnlKjlj4LmlbDnmoTlgLxcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kR2V0RnJvbUpTQXJndW1lbnRBUEkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC8qKioqKioqKioqKui/memDqOWIhueOsOWcqOmDveaYr0MrK+WunueOsOeahCoqKioqKioqKioqKi9cclxuICAgICAgICAvLyBHZXROdW1iZXJGcm9tVmFsdWU6IEdldE51bWJlckZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0RGF0ZUZyb21WYWx1ZTogR2V0RGF0ZUZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0U3RyaW5nRnJvbVZhbHVlOiBHZXRTdHJpbmdGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEJvb2xlYW5Gcm9tVmFsdWU6IEdldEJvb2xlYW5Gcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIFZhbHVlSXNCaWdJbnQ6IFZhbHVlSXNCaWdJbnQuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEJpZ0ludEZyb21WYWx1ZTogR2V0QmlnSW50RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRPYmplY3RGcm9tVmFsdWU6IEdldE9iamVjdEZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0RnVuY3Rpb25Gcm9tVmFsdWU6IEdldEZ1bmN0aW9uRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRKU09iamVjdEZyb21WYWx1ZTogR2V0SlNPYmplY3RGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEFycmF5QnVmZmVyRnJvbVZhbHVlOiBHZXRBcnJheUJ1ZmZlckZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0QXJndW1lbnRUeXBlOiBmdW5jdGlvbiAoaXNvbGF0ZTogSW50UHRyLCBpbmZvOiBNb2NrSW50UHRyLCBpbmRleDogaW50LCBpc0J5UmVmOiBib29sKSB7XHJcbiAgICAgICAgLy8gICAgIHZhciB2YWx1ZSA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8sIGVuZ2luZSkuYXJnc1tpbmRleF07XHJcbiAgICAgICAgLy8gICAgIHJldHVybiBHZXRUeXBlKGVuZ2luZSwgdmFsdWUpO1xyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgICAgLy8gLyoqXHJcbiAgICAgICAgLy8gICog5Li6YyPkvqfmj5DkvpvkuIDkuKrojrflj5ZjYWxsYmFja2luZm/ph4xqc3ZhbHVl55qEaW50cHRy55qE5o6l5Y+jXHJcbiAgICAgICAgLy8gICog5bm25LiN5piv5b6X55qE5Yiw6L+Z5LiqYXJndW1lbnTnmoTlgLxcclxuICAgICAgICAvLyAgKlxyXG4gICAgICAgIC8vICAqIOivpeaOpeWPo+WPquacieS9jei/kOeul++8jOeUsUMrK+WunueOsFxyXG4gICAgICAgIC8vICAqL1xyXG4gICAgICAgIC8vIEdldEFyZ3VtZW50VmFsdWUvKmluQ2FsbGJhY2tJbmZvKi86IGZ1bmN0aW9uIChpbmZvcHRyOiBNb2NrSW50UHRyLCBpbmRleDogaW50KSB7XHJcbiAgICAgICAgLy8gICAgIHJldHVybiBpbmZvcHRyIHwgaW5kZXg7XHJcbiAgICAgICAgLy8gfSxcclxuICAgICAgICAvLyBHZXRKc1ZhbHVlVHlwZTogZnVuY3Rpb24gKGlzb2xhdGU6IEludFB0ciwgdmFsOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XHJcbiAgICAgICAgLy8gICAgIC8vIHB1YmxpYyBlbnVtIEpzVmFsdWVUeXBlXHJcbiAgICAgICAgLy8gICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgLy8gICAgIE51bGxPclVuZGVmaW5lZCA9IDEsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBCaWdJbnQgPSAyLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgTnVtYmVyID0gNCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIFN0cmluZyA9IDgsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBCb29sZWFuID0gMTYsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBOYXRpdmVPYmplY3QgPSAzMixcclxuICAgICAgICAvLyAgICAgLy8gICAgIEpzT2JqZWN0ID0gNjQsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBBcnJheSA9IDEyOCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEZ1bmN0aW9uID0gMjU2LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgRGF0ZSA9IDUxMixcclxuICAgICAgICAvLyAgICAgLy8gICAgIEFycmF5QnVmZmVyID0gMTAyNCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIFVua25vdyA9IDIwNDgsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBBbnkgPSBOdWxsT3JVbmRlZmluZWQgfCBCaWdJbnQgfCBOdW1iZXIgfCBTdHJpbmcgfCBCb29sZWFuIHwgTmF0aXZlT2JqZWN0IHwgQXJyYXkgfCBGdW5jdGlvbiB8IERhdGUgfCBBcnJheUJ1ZmZlcixcclxuICAgICAgICAvLyAgICAgLy8gfTtcclxuICAgICAgICAvLyAgICAgdmFyIHZhbHVlOiBhbnkgPSBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWwsIGVuZ2luZSk7XHJcbiAgICAgICAgLy8gICAgIHJldHVybiBHZXRUeXBlKGVuZ2luZSwgdmFsdWUpO1xyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgICAgLyoqKioqKioqKioq5Lul5LiK546w5Zyo6YO95pivQysr5a6e546w55qEKioqKioqKioqKioqL1xyXG4gICAgICAgIEdldFR5cGVJZEZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBpZiAoaXNCeVJlZikge1xyXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgb2JqID0gb2JqWzBdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xyXG4gICAgICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IG9iai5fZnVuY1tcIiRjaWRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSBvYmpbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdHlwZWlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBmaW5kIHR5cGVpZCBmb3InICsgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlaWQ7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kR2V0RnJvbUpTQXJndW1lbnRBUEk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEZyb21KU0FyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogQyPosIPnlKhKU+aXtu+8jOiOt+WPlkpT5Ye95pWw6L+U5Zue5YC8XHJcbiAqXHJcbiAqIOWOn+acieeahHJlc3VsdEluZm/orr7orqHlh7rmnaXlj6rmmK/kuLrkuoborqnlpJppc29sYXRl5pe26IO95Zyo5LiN5ZCM55qEaXNvbGF0ZemHjOS/neaMgeS4jeWQjOeahHJlc3VsdFxyXG4gKiDlnKhXZWJHTOaooeW8j+S4i+ayoeaciei/meS4queDpuaBvO+8jOWboOatpOebtOaOpeeUqGVuZ2luZeeahOWNs+WPr1xyXG4gKiByZXN1bHRJbmZv5Zu65a6a5Li6MTAyNFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRHZXRGcm9tSlNSZXR1cm5BUEkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIEdldE51bWJlckZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0RGF0ZUZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0LmdldFRpbWUoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldFN0cmluZ0Zyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvLCAvKm91dCBpbnQgKi8gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb1RlbXBDU1N0cmluZyhlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0LCBsZW5ndGgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0Qm9vbGVhbkZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVzdWx0SXNCaWdJbnQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgbGlicmFyeV8xLmlzQmlnSW50KShlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEJpZ0ludEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIC8vIHB1ZXJ0cyBjb3JlIHYyLjAuNOW8gOWni+aUr+aMgVxyXG4gICAgICAgICAgICByZXR1cm4gKDAsIGxpYnJhcnlfMS5yZXR1cm5CaWdJbnQpKGVuZ2luZSwgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRPYmplY3RGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0VHlwZUlkRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICAgICAgdmFyIHR5cGVpZCA9IDA7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSB2YWx1ZS5fZnVuY1tcIiRjaWRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSB2YWx1ZVtcIiRjaWRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0eXBlaWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVpZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEZ1bmN0aW9uRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdmFyIGpzZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEpTT2JqZWN0RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdmFyIGpzb2JqID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdChlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICAgICAgcmV0dXJuIGpzb2JqLmlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0QXJyYXlCdWZmZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgYWIgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgICAgICB2YXIgcHRyID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoYWIuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XHJcbiAgICAgICAgICAgICgwLCBsaWJyYXJ5XzEuc2V0T3V0VmFsdWUzMikoZW5naW5lLCBsZW5ndGgsIGFiLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICByZXR1cm4gcHRyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy/kv53lrojmlrnmoYhcclxuICAgICAgICBHZXRSZXN1bHRUeXBlOiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgICAgICByZXR1cm4gKDAsIGxpYnJhcnlfMS5HZXRUeXBlKShlbmdpbmUsIHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRHZXRGcm9tSlNSZXR1cm5BUEk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEZyb21KU1JldHVybi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIOazqOWGjOexu0FQSe+8jOWmguazqOWGjOWFqOWxgOWHveaVsOOAgeazqOWGjOexu++8jOS7peWPiuexu+eahOWxnuaAp+aWueazleetiVxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRSZWdpc3RlckFQSShlbmdpbmUpIHtcclxuICAgIGNvbnN0IHJldHVybmVlID0ge1xyXG4gICAgICAgIFNldEdsb2JhbEZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgbmFtZVN0cmluZywgdjhGdW5jdGlvbkNhbGxiYWNrLCBqc0VudklkeCwgY2FsbGJhY2tpZHgpIHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIGxpYnJhcnlfMS5nbG9iYWxbbmFtZV0gPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbih0cnVlLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIGNhbGxiYWNraWR4KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9SZWdpc3RlckNsYXNzOiBmdW5jdGlvbiAoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCBqc0VudklkeCwgY2FsbGJhY2tpZHgsIHNpemUpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVsbE5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKGZ1bGxOYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgY29uc3QgY3NoYXJwT2JqZWN0TWFwID0gZW5naW5lLmNzaGFycE9iamVjdE1hcDtcclxuICAgICAgICAgICAgY29uc3QgaWQgPSBjc2hhcnBPYmplY3RNYXAuY2xhc3Nlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wRXh0ZXJuYWxDU0lEID0gMDtcclxuICAgICAgICAgICAgY29uc3QgY3RvciA9IGZ1bmN0aW9uIE5hdGl2ZU9iamVjdCgpIHtcclxuICAgICAgICAgICAgICAgIC8vIOiuvue9ruexu+Wei0lEXHJcbiAgICAgICAgICAgICAgICB0aGlzW1wiJGNpZFwiXSA9IGlkO1xyXG4gICAgICAgICAgICAgICAgLy8gbmF0aXZlT2JqZWN055qE5p6E6YCg5Ye95pWwXHJcbiAgICAgICAgICAgICAgICAvLyDmnoTpgKDlh73mlbDmnInkuKTkuKrosIPnlKjnmoTlnLDmlrnvvJoxLiBqc+S+p25ld+S4gOS4quWug+eahOaXtuWAmSAyLiBjc+S+p+WIm+W7uuS6huS4gOS4quWvueixoeimgeS8oOWIsGpz5L6n5pe2XHJcbiAgICAgICAgICAgICAgICAvLyDnrKzkuIDkuKrmg4XlhrXvvIxjc+WvueixoUlE5oiW6ICF5pivY2FsbFY4Q29uc3RydWN0b3JDYWxsYmFja+i/lOWbnueahOOAglxyXG4gICAgICAgICAgICAgICAgLy8g56ys5LqM5Liq5oOF5Ya177yM5YiZY3Plr7nosaFJROaYr2NzIG5ld+WujOS5i+WQjuS4gOW5tuS8oOe7mWpz55qE44CCXHJcbiAgICAgICAgICAgICAgICBsZXQgY3NJRCA9IHRlbXBFeHRlcm5hbENTSUQ7IC8vIOWmguaenOaYr+esrOS6jOS4quaDheWGte+8jOatpElE55SxY3JlYXRlRnJvbUNT6K6+572uXHJcbiAgICAgICAgICAgICAgICB0ZW1wRXh0ZXJuYWxDU0lEID0gMDtcclxuICAgICAgICAgICAgICAgIGlmIChjc0lEID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tJbmZvUHRyID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRNb2NrUG9pbnRlcihhcmdzKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyDomb3nhLZwdWVydHPlhoVDb25zdHJ1Y3RvcueahOi/lOWbnuWAvOWPq3NlbGbvvIzkvYblroPlhbblrp7lsLHmmK9DU+WvueixoeeahOS4gOS4qmlk6ICM5bey44CCXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NJRCA9IGVuZ2luZS5jYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayhjb25zdHJ1Y3RvciwgY2FsbGJhY2tJbmZvUHRyLCBhcmdzLmxlbmd0aCwgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLlJlbGVhc2VCeU1vY2tJbnRQdHIoY2FsbGJhY2tJbmZvUHRyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5SZWxlYXNlQnlNb2NrSW50UHRyKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBibGl0dGFibGVcclxuICAgICAgICAgICAgICAgIGlmIChzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNzTmV3SUQgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhzaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubWVtY3B5KGNzTmV3SUQsIGNzSUQsIHNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5hZGQoY3NOZXdJRCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5PbkZpbmFsaXplKSh0aGlzLCBjc05ld0lELCAoY3NJZGVudGlmaWVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5yZW1vdmUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLl9mcmVlKGNzSWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuYWRkKGNzSUQsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICgwLCBsaWJyYXJ5XzEuT25GaW5hbGl6ZSkodGhpcywgY3NJRCwgKGNzSWRlbnRpZmllcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAucmVtb3ZlKGNzSWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5jYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrKGRlc3RydWN0b3IgfHwgZW5naW5lLmdlbmVyYWxEZXN0cnVjdG9yLCBjc0lkZW50aWZpZXIsIGNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY3Rvci5jcmVhdGVGcm9tQ1MgPSBmdW5jdGlvbiAoY3NJRCkge1xyXG4gICAgICAgICAgICAgICAgdGVtcEV4dGVybmFsQ1NJRCA9IGNzSUQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGN0b3IoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY3Rvci5fX3B1ZXJ0c01ldGFkYXRhID0gbmV3IE1hcCgpO1xyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3RvciwgXCJuYW1lXCIsIHsgdmFsdWU6IGZ1bGxOYW1lICsgXCJDb25zdHJ1Y3RvclwiIH0pO1xyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3RvciwgXCIkY2lkXCIsIHsgdmFsdWU6IGlkIH0pO1xyXG4gICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuY2xhc3Nlcy5wdXNoKGN0b3IpO1xyXG4gICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuY2xhc3NJRFdlYWtNYXAuc2V0KGN0b3IsIGlkKTtcclxuICAgICAgICAgICAgaWYgKEJhc2VUeXBlSWQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjdG9yLnByb3RvdHlwZS5fX3Byb3RvX18gPSBjc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tCYXNlVHlwZUlkXS5wcm90b3R5cGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLm5hbWVzVG9DbGFzc2VzSURbZnVsbE5hbWVdID0gaWQ7XHJcbiAgICAgICAgICAgIHJldHVybiBpZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlZ2lzdGVyU3RydWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCAvKmxvbmcgKi8ganNFbnZJZHgsIGNhbGxiYWNraWR4LCBzaXplKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXR1cm5lZS5fUmVnaXN0ZXJDbGFzcyhpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIGNhbGxiYWNraWR4LCBjYWxsYmFja2lkeCwgc2l6ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZWdpc3RlckZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgY2xhc3NJRCwgbmFtZVN0cmluZywgaXNTdGF0aWMsIGNhbGxiYWNrLCAvKmxvbmcgKi8ganNFbnZJZHgsIGNhbGxiYWNraWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBjbHMgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbY2xhc3NJRF07XHJcbiAgICAgICAgICAgIGlmICghY2xzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGZuID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGNhbGxiYWNrLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIGNsc1tuYW1lXSA9IGZuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2xzLnByb3RvdHlwZVtuYW1lXSA9IGZuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZWdpc3RlclByb3BlcnR5OiBmdW5jdGlvbiAoaXNvbGF0ZSwgY2xhc3NJRCwgbmFtZVN0cmluZywgaXNTdGF0aWMsIGdldHRlciwgXHJcbiAgICAgICAgLypsb25nICovIGdldHRlcmpzRW52SWR4LCBcclxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyY2FsbGJhY2tpZHgsIHNldHRlciwgXHJcbiAgICAgICAgLypsb25nICovIHNldHRlcmpzRW52SWR4LCBcclxuICAgICAgICAvKmxvbmcgKi8gc2V0dGVyY2FsbGJhY2tpZHgsIGRvbnREZWxldGUpIHtcclxuICAgICAgICAgICAgdmFyIGNscyA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcclxuICAgICAgICAgICAgaWYgKCFjbHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgdmFyIGF0dHIgPSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6ICFkb250RGVsZXRlLFxyXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKGdldHRlcikge1xyXG4gICAgICAgICAgICAgICAgYXR0ci5nZXQgPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgZ2V0dGVyLCBnZXR0ZXJjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHNldHRlcikge1xyXG4gICAgICAgICAgICAgICAgYXR0ci5zZXQgPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgc2V0dGVyLCBzZXR0ZXJjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xzLCBuYW1lLCBhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbHMucHJvdG90eXBlLCBuYW1lLCBhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIHJldHVybmVlO1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFJlZ2lzdGVyQVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1yZWdpc3Rlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEMj6LCD55SoSlPml7bvvIzorr7nva7osIPnlKjlj4LmlbDnmoTlgLxcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9JbnZva2VKU0FyZ3VtZW50QXBpKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAvL2JlZ2luIGNzIGNhbGwganNcclxuICAgICAgICBQdXNoTnVsbEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKG51bGwpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaERhdGVGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBkYXRlVmFsdWUpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKG5ldyBEYXRlKGRhdGVWYWx1ZSkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEJvb2xlYW5Gb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaCghIWIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEJpZ0ludEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qbG9uZyAqLyBsb25nbG93LCBsb25naGlnaCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb25nbG93LCBsb25naGlnaCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaFN0cmluZ0ZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIHN0clN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hOdW1iZXJGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChkKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hPYmplY3RGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBjbGFzc0lELCBvYmplY3RJRCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qob2JqZWN0SUQsIGNsYXNzSUQpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hKU0Z1bmN0aW9uRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoSlNGdW5jdGlvbikuX2Z1bmMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEpTT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNPYmplY3QpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTT2JqZWN0QnlJZChKU09iamVjdCkuZ2V0T2JqZWN0KCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEFycmF5QnVmZmVyRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypieXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSW52b2tlSlNBcmd1bWVudEFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9JbnZva2VKU0FyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogSlPosIPnlKhDI+aXtu+8jEMj6K6+572u6L+U5Zue5YiwSlPnmoTlgLxcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9KU0ludm9rZVJldHVybkFwaShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgUmV0dXJuQ2xhc3M6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBjbGFzc0lEKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybk9iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGNsYXNzSUQsIHNlbGYpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qoc2VsZiwgY2xhc3NJRCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5OdW1iZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBudW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbnVtYmVyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuU3RyaW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgc3RyU3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKTtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gc3RyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQmlnSW50OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgbG9uZ0xvdywgbG9uZ0hpZ2gpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb25nTG93LCBsb25nSGlnaCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5Cb29sZWFuOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgYikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSAhIWI7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5EYXRlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgZGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBuZXcgRGF0ZShkYXRlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybk51bGw6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG51bGw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5GdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIEpTRnVuY3Rpb25QdHIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY29uc3QganNGdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoSlNGdW5jdGlvblB0cik7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGpzRnVuYy5fZnVuYztcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkpTT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgSlNPYmplY3RQdHIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY29uc3QganNPYmplY3QgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU09iamVjdEJ5SWQoSlNPYmplY3RQdHIpO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBqc09iamVjdC5nZXRPYmplY3QoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkNTaGFycEZ1bmN0aW9uQ2FsbGJhY2s6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVyTG93LCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckhpZ2gpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oZmFsc2UsIHY4RnVuY3Rpb25DYWxsYmFjaywgcG9pbnRlckhpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQ1NoYXJwRnVuY3Rpb25DYWxsYmFjazI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIEpzRnVuY3Rpb25GaW5hbGl6ZSwgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJMb3csIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVySGlnaCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihmYWxzZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBwb2ludGVySGlnaCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5BcnJheUJ1ZmZlcjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIC8qYnl0ZVtdICovIGluZGV4LCBsZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSlNJbnZva2VSZXR1cm5BcGk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSlNJbnZva2VSZXR1cm4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPkvqforr7nva5vdXTlj4LmlbDlgLxcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9KU091dEFyZ3VtZW50QVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBTZXROdW1iZXJUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gbnVtYmVyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0RGF0ZVRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgZGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRTdHJpbmdUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIHN0clN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCBzdHIgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZyk7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBzdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRCb29sZWFuVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBiKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSAhIWI7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRCaWdJbnRUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGxvdywgaGlnaCkge1xyXG4gICAgICAgICAgICBjb25zdCBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSAoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvdywgaGlnaCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRPYmplY3RUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGNsYXNzSUQsIHNlbGYpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KHNlbGYsIGNsYXNzSUQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0TnVsbFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gbnVsbDsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldEFycmF5QnVmZmVyVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCAvKkJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9KU091dEFyZ3VtZW50QVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0pTT3V0QXJndW1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5XZWJHTFJlZ3N0ZXJBcGkgPSBleHBvcnRzLkdldFdlYkdMRkZJQXBpID0gdm9pZCAwO1xyXG5jb25zdCBCdWZmZXIgPSByZXF1aXJlKFwiLi9idWZmZXJcIik7XHJcbmxldCBsb2FkZXIgPSBudWxsO1xyXG5sZXQgbG9hZGVyUmVzb2x2ZSA9IG51bGw7XHJcbmNvbnN0IGV4ZWN1dGVNb2R1bGVDYWNoZSA9IHt9O1xyXG4vKipcclxuICogU3BhcnNlIEFycmF5IGltcGxlbWVudGF0aW9uIHdpdGggZWZmaWNpZW50IGFkZC9yZW1vdmUgb3BlcmF0aW9uc1xyXG4gKiAtIE1haW50YWlucyBjb250aWd1b3VzIHN0b3JhZ2VcclxuICogLSBSZXVzZXMgZW1wdHkgc2xvdHMgZnJvbSBkZWxldGlvbnNcclxuICogLSBPKDEpIGFkZC9yZW1vdmUgaW4gbW9zdCBjYXNlc1xyXG4gKi9cclxuY2xhc3MgU3BhcnNlQXJyYXkge1xyXG4gICAgX2RhdGE7XHJcbiAgICBfZnJlZUluZGljZXM7XHJcbiAgICBfbGVuZ3RoO1xyXG4gICAgY29uc3RydWN0b3IoY2FwYWNpdHkgPSAwKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IG5ldyBBcnJheShjYXBhY2l0eSk7XHJcbiAgICAgICAgdGhpcy5fZnJlZUluZGljZXMgPSBbXTtcclxuICAgICAgICB0aGlzLl9sZW5ndGggPSAwO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgYW4gZWxlbWVudCB0byB0aGUgYXJyYXlcclxuICAgICAqIEByZXR1cm5zIFRoZSBpbmRleCB3aGVyZSB0aGUgZWxlbWVudCB3YXMgaW5zZXJ0ZWRcclxuICAgICAqL1xyXG4gICAgYWRkKGVsZW1lbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5fZnJlZUluZGljZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuX2ZyZWVJbmRpY2VzLnBvcCgpO1xyXG4gICAgICAgICAgICB0aGlzLl9kYXRhW2luZGV4XSA9IGVsZW1lbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuX2xlbmd0aCsrO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgdGhpcy5fZGF0YS5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgIHRoaXMuX2xlbmd0aCsrO1xyXG4gICAgICAgIHJldHVybiBpbmRleDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGFuIGVsZW1lbnQgYnkgaW5kZXhcclxuICAgICAqIEByZXR1cm5zIHRydWUgaWYgcmVtb3ZhbCB3YXMgc3VjY2Vzc2Z1bFxyXG4gICAgICovXHJcbiAgICByZW1vdmUoaW5kZXgpIHtcclxuICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuX2RhdGEubGVuZ3RoIHx8IHRoaXMuX2RhdGFbaW5kZXhdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9kYXRhW2luZGV4XSA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLl9mcmVlSW5kaWNlcy5wdXNoKGluZGV4KTtcclxuICAgICAgICB0aGlzLl9sZW5ndGgtLTtcclxuICAgICAgICAvLyBDb21wYWN0IHRoZSBhcnJheSBpZiBsYXN0IGVsZW1lbnQgaXMgcmVtb3ZlZFxyXG4gICAgICAgIGlmIChpbmRleCA9PT0gdGhpcy5fZGF0YS5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvbXBhY3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIEdldCBlbGVtZW50IGJ5IGluZGV4XHJcbiAgICAgKi9cclxuICAgIGdldChpbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW2luZGV4XTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQ3VycmVudCBudW1iZXIgb2YgYWN0aXZlIGVsZW1lbnRzXHJcbiAgICAgKi9cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogVG90YWwgY2FwYWNpdHkgKGluY2x1ZGluZyBlbXB0eSBzbG90cylcclxuICAgICAqL1xyXG4gICAgZ2V0IGNhcGFjaXR5KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmxlbmd0aDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQ29tcGFjdCB0aGUgYXJyYXkgYnkgcmVtb3ZpbmcgdHJhaWxpbmcgdW5kZWZpbmVkIGVsZW1lbnRzXHJcbiAgICAgKi9cclxuICAgIF9jb21wYWN0KCkge1xyXG4gICAgICAgIGxldCBsYXN0SW5kZXggPSB0aGlzLl9kYXRhLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgd2hpbGUgKGxhc3RJbmRleCA+PSAwICYmIHRoaXMuX2RhdGFbbGFzdEluZGV4XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGEucG9wKCk7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbnkgZnJlZSBpbmRpY2VzIGluIHRoZSBjb21wYWN0ZWQgYXJlYVxyXG4gICAgICAgICAgICBjb25zdCBjb21wYWN0ZWRJbmRleCA9IHRoaXMuX2ZyZWVJbmRpY2VzLmluZGV4T2YobGFzdEluZGV4KTtcclxuICAgICAgICAgICAgaWYgKGNvbXBhY3RlZEluZGV4ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZnJlZUluZGljZXMuc3BsaWNlKGNvbXBhY3RlZEluZGV4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsYXN0SW5kZXgtLTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gRXhlY3V0ZU1vZHVsZShmaWxlTmFtZSkge1xyXG4gICAgaWYgKFsncHVlcnRzL2xvZy5tanMnLCAncHVlcnRzL3RpbWVyLm1qcyddLmluZGV4T2YoZmlsZU5hbWUpICE9IC0xKSB7XHJcbiAgICAgICAgcmV0dXJuIHt9O1xyXG4gICAgfVxyXG4gICAgaWYgKCFsb2FkZXIpIHtcclxuICAgICAgICBsb2FkZXIgPSBnbG9iYWxUaGlzLmpzRW52LmxvYWRlcjtcclxuICAgICAgICBsb2FkZXJSZXNvbHZlID0gbG9hZGVyLlJlc29sdmUgPyAoZnVuY3Rpb24gKGZpbGVOYW1lLCB0byA9IFwiXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWROYW1lID0gbG9hZGVyLlJlc29sdmUoZmlsZU5hbWUsIHRvKTtcclxuICAgICAgICAgICAgaWYgKCFyZXNvbHZlZE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZWROYW1lO1xyXG4gICAgICAgIH0pIDogbnVsbDtcclxuICAgIH1cclxuICAgIGlmIChsb2FkZXJSZXNvbHZlKSB7XHJcbiAgICAgICAgZmlsZU5hbWUgPSBsb2FkZXJSZXNvbHZlKGZpbGVOYW1lLCBcIlwiKTtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSB3eFJlcXVpcmUoJ3B1ZXJ0c19taW5pZ2FtZV9qc19yZXNvdXJjZXMvJyArIChmaWxlTmFtZS5lbmRzV2l0aCgnLmpzJykgPyBmaWxlTmFtZSA6IGZpbGVOYW1lICsgXCIuanNcIikpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBmdW5jdGlvbiBub3JtYWxpemUobmFtZSwgdG8pIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBDUyAhPSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChDUy5QdWVydHMuUGF0aEhlbHBlci5Jc1JlbGF0aXZlKHRvKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldCA9IENTLlB1ZXJ0cy5QYXRoSGVscGVyLm5vcm1hbGl6ZShDUy5QdWVydHMuUGF0aEhlbHBlci5EaXJuYW1lKG5hbWUpICsgXCIvXCIgKyB0byk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdG87XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1vY2tSZXF1aXJlKHNwZWNpZmllcikge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGV4cG9ydHM6IHt9IH07XHJcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kQ2FjaGVTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgZXhlY3V0ZU1vZHVsZUNhY2hlKTtcclxuICAgICAgICAgICAgaWYgKGZvdW5kQ2FjaGVTcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5leHBvcnRzID0gZXhlY3V0ZU1vZHVsZUNhY2hlW2ZvdW5kQ2FjaGVTcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmRTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgUFVFUlRTX0pTX1JFU09VUkNFUyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtb2R1bGUgbm90IGZvdW5kOiAnICsgc3BlY2lmaWVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNwZWNpZmllciA9IGZvdW5kU3BlY2lmaWVyO1xyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSAtMTtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgUFVFUlRTX0pTX1JFU09VUkNFU1tzcGVjaWZpZXJdKHJlc3VsdC5leHBvcnRzLCBmdW5jdGlvbiBtUmVxdWlyZShzcGVjaWZpZXJUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9ja1JlcXVpcmUobG9hZGVyUmVzb2x2ZSA/IGxvYWRlclJlc29sdmUoc3BlY2lmaWVyVG8sIHNwZWNpZmllcikgOiBub3JtYWxpemUoc3BlY2lmaWVyLCBzcGVjaWZpZXJUbykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSByZXN1bHQuZXhwb3J0cztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LmV4cG9ydHM7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBvYmopIHtcclxuICAgICAgICAgICAgICAgIGxldCB0cnlGaW5kTmFtZSA9IFtzcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5pbmRleE9mKCcuJykgPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5RmluZE5hbWUgPSB0cnlGaW5kTmFtZS5jb25jYXQoW3NwZWNpZmllciArICcuanMnLCBzcGVjaWZpZXIgKyAnLnRzJywgc3BlY2lmaWVyICsgJy5tanMnLCBzcGVjaWZpZXIgKyAnLm10cyddKTtcclxuICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSB0cnlGaW5kTmFtZS5yZWR1Y2UoKHJldCwgbmFtZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmV0ICE9PSBmYWxzZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ialtuYW1lXSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY2lyY3VsYXIgZGVwZW5kZW5jeSBpcyBkZXRlY3RlZCB3aGVuIHJlcXVpcmluZyBcIiR7bmFtZX1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaW5kZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ5RmluZE5hbWVbZmluZGVkXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlUmV0O1xyXG4gICAgfVxyXG59XHJcbmdsb2JhbFRoaXMuX19wdWVydHNFeGVjdXRlTW9kdWxlID0gRXhlY3V0ZU1vZHVsZTtcclxudmFyIEpTVGFnO1xyXG4oZnVuY3Rpb24gKEpTVGFnKSB7XHJcbiAgICAvKiBhbGwgdGFncyB3aXRoIGEgcmVmZXJlbmNlIGNvdW50IGFyZSBuZWdhdGl2ZSAqL1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfRklSU1RcIl0gPSAtOV0gPSBcIkpTX1RBR19GSVJTVFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfU1RSSU5HXCJdID0gLTldID0gXCJKU19UQUdfU1RSSU5HXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19CVUZGRVJcIl0gPSAtOF0gPSBcIkpTX1RBR19CVUZGRVJcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0VYQ0VQVElPTlwiXSA9IC03XSA9IFwiSlNfVEFHX0VYQ0VQVElPTlwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfTkFUSVZFX09CSkVDVFwiXSA9IC00XSA9IFwiSlNfVEFHX05BVElWRV9PQkpFQ1RcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0FSUkFZXCJdID0gLTNdID0gXCJKU19UQUdfQVJSQVlcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0ZVTkNUSU9OXCJdID0gLTJdID0gXCJKU19UQUdfRlVOQ1RJT05cIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX09CSkVDVFwiXSA9IC0xXSA9IFwiSlNfVEFHX09CSkVDVFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfSU5UXCJdID0gMF0gPSBcIkpTX1RBR19JTlRcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0JPT0xcIl0gPSAxXSA9IFwiSlNfVEFHX0JPT0xcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX05VTExcIl0gPSAyXSA9IFwiSlNfVEFHX05VTExcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX1VOREVGSU5FRFwiXSA9IDNdID0gXCJKU19UQUdfVU5ERUZJTkVEXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19VTklOSVRJQUxJWkVEXCJdID0gNF0gPSBcIkpTX1RBR19VTklOSVRJQUxJWkVEXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19GTE9BVDY0XCJdID0gNV0gPSBcIkpTX1RBR19GTE9BVDY0XCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19JTlQ2NFwiXSA9IDZdID0gXCJKU19UQUdfSU5UNjRcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX1VJTlQ2NFwiXSA9IDddID0gXCJKU19UQUdfVUlOVDY0XCI7XHJcbn0pKEpTVGFnIHx8IChKU1RhZyA9IHt9KSk7XHJcbmxldCBoYXNFeGNlcHRpb24gPSBmYWxzZTtcclxubGV0IGxhc3RFeGNlcHRpb24gPSB1bmRlZmluZWQ7XHJcbmxldCBsYXN0RXhjZXB0aW9uQnVmZmVyID0gdW5kZWZpbmVkO1xyXG5mdW5jdGlvbiBnZXRFeGNlcHRpb25Bc05hdGl2ZVN0cmluZyh3YXNtQXBpLCB3aXRoX3N0YWNrKSB7XHJcbiAgICBpZiAoaGFzRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgaGFzRXhjZXB0aW9uID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcclxuICAgICAgICBpZiAodHlwZW9mIGxhc3RFeGNlcHRpb24gPT09ICdvYmplY3QnICYmIGxhc3RFeGNlcHRpb24gIT09IG51bGwpIHtcclxuICAgICAgICAgICAgY29uc3QgbXNnID0gbGFzdEV4Y2VwdGlvbi5tZXNzYWdlO1xyXG4gICAgICAgICAgICBjb25zdCBzdGFjayA9IGxhc3RFeGNlcHRpb24uc3RhY2s7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHdpdGhfc3RhY2sgPyBgJHttc2d9XFxuJHtzdGFja31gIDogbXNnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gYCR7bGFzdEV4Y2VwdGlvbn1gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgICAgICBjb25zdCBieXRlQ291bnQgPSB3YXNtQXBpLmxlbmd0aEJ5dGVzVVRGOChyZXN1bHQpO1xyXG4gICAgICAgIC8vY29uc29sZS5lcnJvcihgZ2V0RXhjZXB0aW9uQXNOYXRpdmVTdHJpbmcoJHtieXRlQ291bnR9KTogJHtyZXN1bHR9YCk7XHJcbiAgICAgICAgaWYgKGxhc3RFeGNlcHRpb25CdWZmZXIpIHtcclxuICAgICAgICAgICAgd2FzbUFwaS5fZnJlZShsYXN0RXhjZXB0aW9uQnVmZmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGFzdEV4Y2VwdGlvbkJ1ZmZlciA9IHdhc21BcGkuX21hbGxvYyhieXRlQ291bnQgKyAxKTtcclxuICAgICAgICB3YXNtQXBpLnN0cmluZ1RvVVRGOChyZXN1bHQsIGxhc3RFeGNlcHRpb25CdWZmZXIsIGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHJldHVybiBsYXN0RXhjZXB0aW9uQnVmZmVyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDA7XHJcbn1cclxuZnVuY3Rpb24gZ2V0QW5kQ2xlYXJMYXN0RXhjZXB0aW9uKCkge1xyXG4gICAgaGFzRXhjZXB0aW9uID0gZmFsc2U7XHJcbiAgICBjb25zdCByZXQgPSBsYXN0RXhjZXB0aW9uO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICByZXR1cm4gcmV0O1xyXG59XHJcbmZ1bmN0aW9uIHNldExhc3RFeGNlcHRpb24oZXJyKSB7XHJcbiAgICBoYXNFeGNlcHRpb24gPSB0cnVlO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IGVycjtcclxufVxyXG5jbGFzcyBTY29wZSB7XHJcbiAgICBzdGF0aWMgY3VycmVudCA9IHVuZGVmaW5lZDtcclxuICAgIHN0YXRpYyBnZXRDdXJyZW50KCkge1xyXG4gICAgICAgIHJldHVybiBTY29wZS5jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGVudGVyKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgU2NvcGUoKTtcclxuICAgIH1cclxuICAgIHN0YXRpYyBleGl0KHdhc21BcGkpIHtcclxuICAgICAgICBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKTtcclxuICAgICAgICBTY29wZS5jdXJyZW50LmNsb3NlKHdhc21BcGkpO1xyXG4gICAgfVxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5wcmV2U2NvcGUgPSBTY29wZS5jdXJyZW50O1xyXG4gICAgICAgIFNjb3BlLmN1cnJlbnQgPSB0aGlzO1xyXG4gICAgfVxyXG4gICAgY2xvc2Uod2FzbUFwaSkge1xyXG4gICAgICAgIFNjb3BlLmN1cnJlbnQgPSB0aGlzLnByZXZTY29wZTtcclxuICAgIH1cclxuICAgIGFkZFRvU2NvcGUob2JqKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RzSW5TY29wZS5wdXNoKG9iaik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGUubGVuZ3RoIC0gMTtcclxuICAgIH1cclxuICAgIGdldEZyb21TY29wZShpbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdHNJblNjb3BlW2luZGV4XTtcclxuICAgIH1cclxuICAgIHRvSnMod2FzbUFwaSwgb2JqTWFwcGVyLCBwdmFsdWUpIHtcclxuICAgICAgICBpZiAocHZhbHVlID09IDApXHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgY29uc3QgaGVhcCA9IHdhc21BcGkuSEVBUFU4O1xyXG4gICAgICAgIGNvbnN0IHZhbFR5cGUgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSArIDgpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coYHZhbFR5cGU6ICR7dmFsVHlwZX1gKTtcclxuICAgICAgICBpZiAodmFsVHlwZSA8PSBKU1RhZy5KU19UQUdfT0JKRUNUICYmIHZhbFR5cGUgPj0gSlNUYWcuSlNfVEFHX0FSUkFZKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9iaklkeCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGVbb2JqSWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbFR5cGUgPT0gSlNUYWcuSlNfVEFHX05BVElWRV9PQkpFQ1QpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JqSWQgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHR5cGVJZCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlICsgNCk7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmpNYXBwZXIucHVzaE5hdGl2ZU9iamVjdChvYmpJZCwgdHlwZUlkLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3dpdGNoICh2YWxUeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0JPT0w6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUpICE9IDA7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0lOVDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX05VTEw6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfVU5ERUZJTkVEOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfRkxPQVQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZERvdWJsZShoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19JTlQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZEludDY0KGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX1VJTlQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZFVJbnQ2NChoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19TVFJJTkc6XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHJTdGFydCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0ckxlbiA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlICsgNCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gd2FzbUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RhcnQsIHN0ckxlbik7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0JVRkZFUjpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZTdGFydCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZMZW4gPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSArIDQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdhc21BcGkuSEVBUDguYnVmZmVyLnNsaWNlKGJ1ZmZTdGFydCwgYnVmZlN0YXJ0ICsgYnVmZkxlbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgdHlwZTogJHt2YWxUeXBlfWApO1xyXG4gICAgfVxyXG4gICAgcHJldlNjb3BlID0gdW5kZWZpbmVkO1xyXG4gICAgb2JqZWN0c0luU2NvcGUgPSBbbnVsbF07IC8vIOWKoG51bGzkuLrkuoZpbmRleOS7jjHlvIDlp4vvvIzlm6DkuLrlnKjljp/nlJ/np43lrZjmlL7lnKjmjIfpkojlrZfmrrXpmLLmraLor6/liKTkuLpudWxscHRyXHJcbn1cclxuY2xhc3MgT2JqZWN0UG9vbCB7XHJcbiAgICBzdG9yYWdlID0gbmV3IE1hcCgpO1xyXG4gICAgZ2NJdGVyYXRvcjtcclxuICAgIGdjVGltZW91dCA9IG51bGw7XHJcbiAgICBpc0djUnVubmluZyA9IGZhbHNlO1xyXG4gICAgLy8gR0MgY29uZmlndXJhdGlvbiBkZWZhdWx0c1xyXG4gICAgZ2NCYXRjaFNpemUgPSAxMDA7XHJcbiAgICBnY0ludGVydmFsTXMgPSA1MDtcclxuICAgIGNsZWFudXBDYWxsYmFjayA9IHVuZGVmaW5lZDtcclxuICAgIGNvbnN0cnVjdG9yKGNsZWFudXBDYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuY2xlYW51cENhbGxiYWNrID0gY2xlYW51cENhbGxiYWNrO1xyXG4gICAgfVxyXG4gICAgYWRkKG9iaklkLCBvYmosIHR5cGVJZCwgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgY29uc3QgcmVmID0gbmV3IFdlYWtSZWYob2JqKTtcclxuICAgICAgICB0aGlzLnN0b3JhZ2Uuc2V0KG9iaklkLCBbcmVmLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZV0pO1xyXG4gICAgICAgIG9iai4kT2JqSWRfXyA9IG9iaklkO1xyXG4gICAgICAgIG9iai4kVHlwZUlkX18gPSB0eXBlSWQ7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBnZXQob2JqSWQpIHtcclxuICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuc3RvcmFnZS5nZXQob2JqSWQpO1xyXG4gICAgICAgIGlmICghZW50cnkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBbcmVmLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZV0gPSBlbnRyeTtcclxuICAgICAgICBjb25zdCBvYmogPSByZWYuZGVyZWYoKTtcclxuICAgICAgICBpZiAoIW9iaikge1xyXG4gICAgICAgICAgICB0aGlzLnN0b3JhZ2UuZGVsZXRlKG9iaklkKTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2sob2JqSWQsIHR5cGVJZCwgY2FsbEZpbmFsaXplKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH1cclxuICAgIHN0YXRpYyBHZXROYXRpdmVJbmZvT2ZPYmplY3Qob2JqKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqSWQgPSBvYmouJE9iaklkX187XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmpJZCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtvYmpJZCwgb2JqLiRUeXBlSWRfX107XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaGFzKG9iaklkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RvcmFnZS5oYXMob2JqSWQpO1xyXG4gICAgfVxyXG4gICAgZnVsbEdjKCkge1xyXG4gICAgICAgIGZvciAoY29uc3QgW29iaklkXSBvZiB0aGlzLnN0b3JhZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy5nZXQob2JqSWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBPbmx5IHJlc2V0IGl0ZXJhdG9yIGlmIEdDIGlzIHJ1bm5pbmcgdG8gbWFpbnRhaW4gaXRlcmF0aW9uIHN0YXRlXHJcbiAgICAgICAgaWYgKHRoaXMuaXNHY1J1bm5pbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5nY0l0ZXJhdG9yID0gdGhpcy5zdG9yYWdlLmtleXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTdGFydCBpbmNyZW1lbnRhbCBnYXJiYWdlIGNvbGxlY3Rpb24gd2l0aCBjb25maWd1cmFibGUgcGFyYW1ldGVyc1xyXG4gICAgc3RhcnRJbmNyZW1lbnRhbEdjKGJhdGNoU2l6ZSA9IDEwMCwgaW50ZXJ2YWxNcyA9IDUwKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNHY1J1bm5pbmcpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB0aGlzLmlzR2NSdW5uaW5nID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmdjQmF0Y2hTaXplID0gTWF0aC5tYXgoMSwgYmF0Y2hTaXplKTtcclxuICAgICAgICB0aGlzLmdjSW50ZXJ2YWxNcyA9IE1hdGgubWF4KDAsIGludGVydmFsTXMpO1xyXG4gICAgICAgIHRoaXMuZ2NJdGVyYXRvciA9IHRoaXMuc3RvcmFnZS5rZXlzKCk7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzR2NCYXRjaCgpO1xyXG4gICAgfVxyXG4gICAgLy8gU3RvcCBpbmNyZW1lbnRhbCBnYXJiYWdlIGNvbGxlY3Rpb25cclxuICAgIHN0b3BJbmNyZW1lbnRhbEdjKCkge1xyXG4gICAgICAgIHRoaXMuaXNHY1J1bm5pbmcgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGhpcy5nY1RpbWVvdXQpIHtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZ2NUaW1lb3V0KTtcclxuICAgICAgICAgICAgdGhpcy5nY1RpbWVvdXQgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHByb2Nlc3NHY0JhdGNoKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5pc0djUnVubmluZylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGxldCBwcm9jZXNzZWQgPSAwO1xyXG4gICAgICAgIGxldCBuZXh0ID0gdGhpcy5nY0l0ZXJhdG9yLm5leHQoKTtcclxuICAgICAgICB3aGlsZSAoIW5leHQuZG9uZSAmJiBwcm9jZXNzZWQgPCB0aGlzLmdjQmF0Y2hTaXplKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0KG5leHQudmFsdWUpO1xyXG4gICAgICAgICAgICBwcm9jZXNzZWQrKztcclxuICAgICAgICAgICAgbmV4dCA9IHRoaXMuZ2NJdGVyYXRvci5uZXh0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuZXh0LmRvbmUpIHtcclxuICAgICAgICAgICAgLy8gUmVzdGFydCBpdGVyYXRvciBmb3IgbmV4dCByb3VuZFxyXG4gICAgICAgICAgICB0aGlzLmdjSXRlcmF0b3IgPSB0aGlzLnN0b3JhZ2Uua2V5cygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmdjVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wcm9jZXNzR2NCYXRjaCgpLCB0aGlzLmdjSW50ZXJ2YWxNcyk7XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgQ2xhc3NSZWdpc3RlciB7XHJcbiAgICBzdGF0aWMgaW5zdGFuY2U7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHsgfVxyXG4gICAgY2xhc3NOb3RGb3VuZCA9IHVuZGVmaW5lZDtcclxuICAgIHR5cGVJZFRvQ2xhc3MgPSBuZXcgTWFwKCk7XHJcbiAgICB0eXBlSWRUb0luZm9zID0gbmV3IE1hcCgpO1xyXG4gICAgc3RhdGljIGdldEluc3RhbmNlKCkge1xyXG4gICAgICAgIGlmICghQ2xhc3NSZWdpc3Rlci5pbnN0YW5jZSkge1xyXG4gICAgICAgICAgICBDbGFzc1JlZ2lzdGVyLmluc3RhbmNlID0gbmV3IENsYXNzUmVnaXN0ZXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIENsYXNzUmVnaXN0ZXIuaW5zdGFuY2U7XHJcbiAgICB9XHJcbiAgICBsb2FkQ2xhc3NCeUlkKHR5cGVJZCkge1xyXG4gICAgICAgIGNvbnN0IGNscyA9IHRoaXMudHlwZUlkVG9DbGFzcy5nZXQodHlwZUlkKTtcclxuICAgICAgICBpZiAoY2xzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjbHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jbGFzc05vdEZvdW5kICYmIHRoaXMuY2xhc3NOb3RGb3VuZCh0eXBlSWQpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50eXBlSWRUb0NsYXNzLmdldCh0eXBlSWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVnaXN0ZXJDbGFzcyh0eXBlSWQsIGNscywgZmluYWxpemUsIGNsc0RhdGEpIHtcclxuICAgICAgICBjb25zdCBpbmZvcyA9IHsgdHlwZUlkLCBmaW5hbGl6ZSwgZGF0YTogY2xzRGF0YSB9O1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbHMsICckSW5mb3MnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBpbmZvcyxcclxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMudHlwZUlkVG9DbGFzcy5zZXQodHlwZUlkLCBjbHMpO1xyXG4gICAgICAgIHRoaXMudHlwZUlkVG9JbmZvcy5zZXQodHlwZUlkLCBpbmZvcyk7XHJcbiAgICB9XHJcbiAgICBnZXRDbGFzc0RhdGFCeUlkKHR5cGVJZCwgZm9yY2VMb2FkKSB7XHJcbiAgICAgICAgaWYgKGZvcmNlTG9hZCkge1xyXG4gICAgICAgICAgICB0aGlzLmxvYWRDbGFzc0J5SWQodHlwZUlkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaW5mb3MgPSB0aGlzLmdldFR5cGVJbmZvcyh0eXBlSWQpO1xyXG4gICAgICAgIHJldHVybiBpbmZvcyA/IGluZm9zLmRhdGEgOiAwO1xyXG4gICAgfVxyXG4gICAgZmluZENsYXNzQnlJZCh0eXBlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50eXBlSWRUb0NsYXNzLmdldCh0eXBlSWQpO1xyXG4gICAgfVxyXG4gICAgZ2V0VHlwZUluZm9zKHR5cGVJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnR5cGVJZFRvSW5mb3MuZ2V0KHR5cGVJZCk7XHJcbiAgICB9XHJcbiAgICBzZXRDbGFzc05vdEZvdW5kQ2FsbGJhY2soY2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLmNsYXNzTm90Rm91bmQgPSBjYWxsYmFjaztcclxuICAgIH1cclxuICAgIHRyYWNlTmF0aXZlT2JqZWN0TGlmZWN5Y2xlKHR5cGVJZCwgb25FbnRlciwgb25FeGl0KSB7XHJcbiAgICAgICAgY29uc3QgaW5mb3MgPSB0aGlzLmdldFR5cGVJbmZvcyh0eXBlSWQpO1xyXG4gICAgICAgIGlmIChpbmZvcykge1xyXG4gICAgICAgICAgICBpbmZvcy5vbkVudGVyID0gb25FbnRlcjtcclxuICAgICAgICAgICAgaW5mb3Mub25FeGl0ID0gb25FeGl0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5jbGFzcyBPYmplY3RNYXBwZXIge1xyXG4gICAgb2JqZWN0UG9vbDtcclxuICAgIHByaXZhdGVEYXRhID0gdW5kZWZpbmVkO1xyXG4gICAgb2JqSWQydWQgPSBuZXcgTWFwKCk7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm9iamVjdFBvb2wgPSBuZXcgT2JqZWN0UG9vbCh0aGlzLk9uTmF0aXZlT2JqZWN0RmluYWxpemVkLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMub2JqZWN0UG9vbC5zdGFydEluY3JlbWVudGFsR2MoMTAwLCAxMDAwKTtcclxuICAgIH1cclxuICAgIHB1c2hOYXRpdmVPYmplY3Qob2JqSWQsIHR5cGVJZCwgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgbGV0IGpzT2JqID0gdGhpcy5vYmplY3RQb29sLmdldChvYmpJZCk7XHJcbiAgICAgICAgaWYgKCFqc09iaikge1xyXG4gICAgICAgICAgICBjb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkubG9hZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgICAgICBpZiAoY2xzKSB7XHJcbiAgICAgICAgICAgICAgICBqc09iaiA9IE9iamVjdC5jcmVhdGUoY2xzLnByb3RvdHlwZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJpbmROYXRpdmVPYmplY3Qob2JqSWQsIGpzT2JqLCB0eXBlSWQsIGNscywgY2FsbEZpbmFsaXplKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ganNPYmo7XHJcbiAgICB9XHJcbiAgICBmaW5kTmF0aXZlT2JqZWN0KG9iaklkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0UG9vbC5nZXQob2JqSWQpO1xyXG4gICAgfVxyXG4gICAgYmluZE5hdGl2ZU9iamVjdChvYmpJZCwganNPYmosIHR5cGVJZCwgY2xzLCBjYWxsRmluYWxpemUpIHtcclxuICAgICAgICB0aGlzLm9iamVjdFBvb2wuYWRkKG9iaklkLCBqc09iaiwgdHlwZUlkLCBjYWxsRmluYWxpemUpO1xyXG4gICAgICAgIGNvbnN0IHsgb25FbnRlciwgZGF0YSB9ID0gY2xzLiRJbmZvcztcclxuICAgICAgICBpZiAob25FbnRlcikge1xyXG4gICAgICAgICAgICBjb25zdCB1ZCA9IG9uRW50ZXIob2JqSWQsIGRhdGEsIHRoaXMucHJpdmF0ZURhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLm9iaklkMnVkLnNldChvYmpJZCwgdWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHNldEVudlByaXZhdGUocHJpdmF0ZURhdGEpIHtcclxuICAgICAgICB0aGlzLnByaXZhdGVEYXRhID0gcHJpdmF0ZURhdGE7XHJcbiAgICB9XHJcbiAgICBPbk5hdGl2ZU9iamVjdEZpbmFsaXplZChvYmpJZCwgdHlwZUlkLCBjYWxsRmluYWxpemUpIHtcclxuICAgICAgICAvL2NvbnNvbGUuZXJyb3IoYE9uTmF0aXZlT2JqZWN0RmluYWxpemVkICR7b2JqSWR9YCk7XHJcbiAgICAgICAgY29uc3QgY2xzID0gQ2xhc3NSZWdpc3Rlci5nZXRJbnN0YW5jZSgpLmZpbmRDbGFzc0J5SWQodHlwZUlkKTtcclxuICAgICAgICBjb25zdCB7IGZpbmFsaXplLCBvbkV4aXQsIGRhdGEgfSA9IGNscy4kSW5mb3M7XHJcbiAgICAgICAgaWYgKGNhbGxGaW5hbGl6ZSAmJiBmaW5hbGl6ZSkge1xyXG4gICAgICAgICAgICBmaW5hbGl6ZSh3ZWJnbEZGSSwgb2JqSWQsIGRhdGEsIHRoaXMucHJpdmF0ZURhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob25FeGl0ICYmIHRoaXMub2JqSWQydWQuaGFzKG9iaklkKSkge1xyXG4gICAgICAgICAgICBjb25zdCB1ZCA9IHRoaXMub2JqSWQydWQuZ2V0KG9iaklkKTtcclxuICAgICAgICAgICAgdGhpcy5vYmpJZDJ1ZC5kZWxldGUob2JqSWQpO1xyXG4gICAgICAgICAgICBvbkV4aXQob2JqSWQsIGRhdGEsIHRoaXMucHJpdmF0ZURhdGEsIHVkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxubGV0IHdlYmdsRkZJID0gdW5kZWZpbmVkO1xyXG5sZXQgb2JqTWFwcGVyID0gdW5kZWZpbmVkO1xyXG4vLyB0eXBlZGVmIHN0cnVjdCBTdHJpbmcge1xyXG4vLyAgICAgY29uc3QgY2hhciAqcHRyO1xyXG4vLyAgICAgdWludDMyX3QgbGVuO1xyXG4vLyB9IFN0cmluZztcclxuLy8gXHJcbi8vIHR5cGVkZWYgc3RydWN0IEJ1ZmZlciB7XHJcbi8vICAgICB2b2lkICpwdHI7XHJcbi8vICAgICB1aW50MzJfdCBsZW47XHJcbi8vIH0gQnVmZmVyO1xyXG4vLyBcclxuLy8gdHlwZWRlZiBzdHJ1Y3QgTmF0aXZlT2JqZWN0IHtcclxuLy8gICAgIHZvaWQgKm9iaklkO1xyXG4vLyAgICAgY29uc3Qgdm9pZCAqdHlwZUlkO1xyXG4vLyB9IE5hdGl2ZU9iamVjdDtcclxuLy8gXHJcbi8vIHR5cGVkZWYgdW5pb24gSlNWYWx1ZVVuaW9uIHtcclxuLy8gICAgIGludDMyX3QgaW50MzI7XHJcbi8vICAgICBkb3VibGUgZmxvYXQ2NDtcclxuLy8gICAgIGludDY0X3QgaW50NjQ7XHJcbi8vICAgICB1aW50NjRfdCB1aW50NjQ7XHJcbi8vICAgICB2b2lkICpwdHI7XHJcbi8vICAgICBTdHJpbmcgc3RyO1xyXG4vLyAgICAgQnVmZmVyIGJ1ZjtcclxuLy8gICAgIE5hdGl2ZU9iamVjdCBudG87XHJcbi8vIH0gSlNWYWx1ZVVuaW9uO1xyXG4vLyBcclxuLy8gdHlwZWRlZiBzdHJ1Y3QgSlNWYWx1ZSB7XHJcbi8vICAgICBKU1ZhbHVlVW5pb24gdTtcclxuLy8gICAgIGludDMyX3QgdGFnO1xyXG4vLyAgICAgaW50IHBhZGRpbmc7XHJcbi8vIH0gSlNWYWx1ZTtcclxuLy9cclxuLy8gc3RydWN0IENhbGxiYWNrSW5mbyB7XHJcbi8vICAgICB2b2lkKiB0aGlzUHRyO1xyXG4vLyAgICAgaW50IGFyZ2M7XHJcbi8vICAgICB2b2lkKiBkYXRhO1xyXG4vLyAgICAgaW50IHBhZGRpbmc7XHJcbi8vICAgICBKU1ZhbHVlIHJlcztcclxuLy8gICAgIEpTVmFsdWUgYXJndlswXTtcclxuLy8gfTtcclxuLy8gc2l6ZW9mKEpTVmFsdWUpID09IDE2XHJcbmNvbnN0IGNhbGxiYWNrSW5mb3NDYWNoZSA9IFtdO1xyXG5mdW5jdGlvbiBnZXROYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYykge1xyXG4gICAgbGV0IGNhbGxiYWNrSW5mbyA9IGNhbGxiYWNrSW5mb3NDYWNoZVthcmdjXTtcclxuICAgIGlmICghY2FsbGJhY2tJbmZvKSB7XHJcbiAgICAgICAgLy8gNCArIDQgKyA0ICsgNCArIDE2ICsgKGFyZ2MgKiAxNilcclxuICAgICAgICBjb25zdCBzaXplID0gMzIgKyAoYXJnYyAqIDE2KTtcclxuICAgICAgICBjYWxsYmFja0luZm8gPSB3YXNtQXBpLl9tYWxsb2Moc2l6ZSk7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIod2FzbUFwaS5IRUFQVTgsIGFyZ2MsIGNhbGxiYWNrSW5mbyArIDQpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgY2FsbGJhY2tJbmZvc0NhY2hlW2FyZ2NdID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgQnVmZmVyLndyaXRlSW50MzIod2FzbUFwaS5IRUFQVTgsIEpTVGFnLkpTX1RBR19VTkRFRklORUQsIGNhbGxiYWNrSW5mbyArIDI0KTsgLy8gc2V0IHJlcyB0byB1bmRlZmluZWRcclxuICAgIHJldHVybiBjYWxsYmFja0luZm87XHJcbn1cclxuZnVuY3Rpb24gcmV0dXJuTmF0aXZlQ2FsbGJhY2tJbmZvKHdhc21BcGksIGFyZ2MsIGNhbGxiYWNrSW5mbykge1xyXG4gICAgaWYgKGNhbGxiYWNrSW5mb3NDYWNoZVthcmdjXSkge1xyXG4gICAgICAgIHdhc21BcGkuX2ZyZWUoY2FsbGJhY2tJbmZvKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGNhbGxiYWNrSW5mb3NDYWNoZVthcmdjXSA9IGNhbGxiYWNrSW5mbztcclxuICAgIH1cclxufVxyXG4vL+WPqumcgOimgeeUqOWIsOS4gOS4qmJ1ZmZlcueahOWcuuaZr+S4i+eUqOmihOWIhumFjeeahO+8jOWmguaenOi2hei/h+S4gOS4qmJ1ZmZlcu+8jOWwsW1hbGxvY1xyXG5sZXQgYnVmZmVyID0gdW5kZWZpbmVkO1xyXG5sZXQgYnVmZmVyX3NpemUgPSAwO1xyXG5sZXQgdXNpbmdCdWZmZXJzID0gW107XHJcbmZ1bmN0aW9uIGdldEJ1ZmZlcih3YXNtQXBpLCBzaXplKSB7XHJcbiAgICBsZXQgcmV0ID0gYnVmZmVyO1xyXG4gICAgaWYgKHVzaW5nQnVmZmVycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgcmV0ID0gd2FzbUFwaS5fbWFsbG9jKHNpemUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKGJ1ZmZlcl9zaXplIDwgc2l6ZSkge1xyXG4gICAgICAgICAgICBidWZmZXJfc2l6ZSA9IHNpemU7XHJcbiAgICAgICAgICAgIGlmIChidWZmZXIpIHtcclxuICAgICAgICAgICAgICAgIHdhc21BcGkuX2ZyZWUoYnVmZmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBidWZmZXIgPSB3YXNtQXBpLl9tYWxsb2MoYnVmZmVyX3NpemUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXQgPSBidWZmZXI7XHJcbiAgICB9XHJcbiAgICB1c2luZ0J1ZmZlcnMucHVzaChyZXQpO1xyXG4gICAgcmV0dXJuIHJldDtcclxufVxyXG5mdW5jdGlvbiBjbGVhclVzaW5nQnVmZmVycyh3YXNtQXBpKSB7XHJcbiAgICBpZiAodXNpbmdCdWZmZXJzLmxlbmd0aCA9PSAwKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIGlmICh1c2luZ0J1ZmZlcnMubGVuZ3RoID09IDEpIHtcclxuICAgICAgICB1c2luZ0J1ZmZlcnMucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCB1c2luZ0J1ZmZlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB3YXNtQXBpLl9mcmVlKHVzaW5nQnVmZmVyc1tpXSk7XHJcbiAgICB9XHJcbiAgICB1c2luZ0J1ZmZlcnMgPSBbXTtcclxufVxyXG5mdW5jdGlvbiBqc1ZhbHVlVG9QYXBpVmFsdWUod2FzbUFwaSwgYXJnLCB2YWx1ZSkge1xyXG4gICAgY29uc3QgaGVhcCA9IHdhc21BcGkuSEVBUFU4O1xyXG4gICAgY29uc3QgZGF0YVB0ciA9IHZhbHVlO1xyXG4gICAgY29uc3QgdGFnUHRyID0gZGF0YVB0ciArIDg7XHJcbiAgICBpZiAoYXJnID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfVU5ERUZJTkVELCB0YWdQdHIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoYXJnID09PSBudWxsKSB7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX05VTEwsIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnYmlnaW50Jykge1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDY0KGhlYXAsIGFyZywgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0lOVDY0LCB0YWdQdHIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihhcmcpKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmcgPj0gLTIxNDc0ODM2NDggJiYgYXJnIDw9IDIxNDc0ODM2NDcpIHtcclxuICAgICAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIGFyZywgZGF0YVB0cik7XHJcbiAgICAgICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfSU5ULCB0YWdQdHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50NjQoaGVhcCwgYXJnLCBkYXRhUHRyKTtcclxuICAgICAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19JTlQ2NCwgdGFnUHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlRG91YmxlKGhlYXAsIGFyZywgZGF0YVB0cik7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19GTE9BVDY0LCB0YWdQdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgY29uc3QgbGVuID0gd2FzbUFwaS5sZW5ndGhCeXRlc1VURjgoYXJnKTtcclxuICAgICAgICBjb25zdCBwdHIgPSBnZXRCdWZmZXIod2FzbUFwaSwgbGVuICsgMSk7XHJcbiAgICAgICAgd2FzbUFwaS5zdHJpbmdUb1VURjgoYXJnLCBwdHIsIGxlbiArIDEpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIHB0ciwgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgbGVuLCBkYXRhUHRyICsgNCk7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX1NUUklORywgdGFnUHRyKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdib29sZWFuJykge1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIGFyZyA/IDEgOiAwLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfQk9PTCwgdGFnUHRyKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShhcmcpLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfRlVOQ1RJT04sIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGFyZyksIGRhdGFQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19BUlJBWSwgdGFnUHRyKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGFyZyBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuICAgICAgICBjb25zdCBsZW4gPSBhcmcuYnl0ZUxlbmd0aDtcclxuICAgICAgICBjb25zdCBwdHIgPSBnZXRCdWZmZXIod2FzbUFwaSwgbGVuKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBwdHIsIGRhdGFQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIGxlbiwgZGF0YVB0ciArIDQpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19CVUZGRVIsIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGNvbnN0IG50b0luZm8gPSBPYmplY3RQb29sLkdldE5hdGl2ZUluZm9PZk9iamVjdChhcmcpO1xyXG4gICAgICAgIGlmIChudG9JbmZvKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IFtvYmpJZCwgdHlwZUlkXSA9IG50b0luZm87XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIG9iaklkLCBkYXRhUHRyKTtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgdHlwZUlkLCBkYXRhUHRyICsgNCk7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19OQVRJVkVfT0JKRUNULCB0YWdQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoYXJnKSwgZGF0YVB0cik7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19PQkpFQ1QsIHRhZ1B0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIGFyZ3VtZW50IHR5cGU6ICR7dHlwZW9mIGFyZ31gKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBqc0FyZ3NUb0NhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjLCBhcmdzKSB7XHJcbiAgICBjbGVhclVzaW5nQnVmZmVycyh3YXNtQXBpKTtcclxuICAgIGNvbnN0IGNhbGxiYWNrSW5mbyA9IGdldE5hdGl2ZUNhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJnYzsgKytpKSB7XHJcbiAgICAgICAgY29uc3QgYXJnID0gYXJnc1tpXTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUod2FzbUFwaSwgYXJnLCBjYWxsYmFja0luZm8gKyAzMiArIChpICogMTYpKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjYWxsYmFja0luZm87XHJcbn1cclxuZnVuY3Rpb24gZ2VuSnNDYWxsYmFjayh3YXNtQXBpLCBjYWxsYmFjaywgZGF0YSwgcGFwaSwgaXNTdGF0aWMpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xyXG4gICAgICAgIGlmIChuZXcudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignXCJub3QgYSBjb25zdHJ1Y3RvcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgY2FsbGJhY2tJbmZvID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGNvbnN0IGFyZ2MgPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8gPSBqc0FyZ3NUb0NhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjLCBhcmdzKTtcclxuICAgICAgICAgICAgY29uc3QgaGVhcCA9IHdhc21BcGkuSEVBUFU4O1xyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBkYXRhLCBjYWxsYmFja0luZm8gKyA4KTsgLy8gZGF0YVxyXG4gICAgICAgICAgICBsZXQgb2JqSWQgPSAwO1xyXG4gICAgICAgICAgICBpZiAoIWlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICBbb2JqSWRdID0gT2JqZWN0UG9vbC5HZXROYXRpdmVJbmZvT2ZPYmplY3QodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgb2JqSWQsIGNhbGxiYWNrSW5mbyk7IC8vIHRoaXNQdHJcclxuICAgICAgICAgICAgd2FzbUFwaS5QQXBpQ2FsbGJhY2tXaXRoU2NvcGUoY2FsbGJhY2ssIHBhcGksIGNhbGxiYWNrSW5mbyk7IC8vIOmihOacn3dhc23lj6rkvJrpgJrov4d0aHJvd19ieV9zdHJpbmfmipvlvILluLjvvIzkuI3kuqfnlJ/nm7TmjqVqc+W8guW4uFxyXG4gICAgICAgICAgICBpZiAoaGFzRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMod2FzbUFwaSwgb2JqTWFwcGVyLCBjYWxsYmFja0luZm8gKyAxNik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICByZXR1cm5OYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgY2FsbGJhY2tJbmZvKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcbi8vIOmcgOimgeWcqFVuaXR56YeM6LCD55SoUGxheWVyU2V0dGluZ3MuV2ViR0wuZW1zY3JpcHRlbkFyZ3MgPSBcIiAtcyBBTExPV19UQUJMRV9HUk9XVEg9MVwiO1xyXG5mdW5jdGlvbiBHZXRXZWJHTEZGSUFwaShlbmdpbmUpIHtcclxuICAgIGlmICh3ZWJnbEZGSSlcclxuICAgICAgICByZXR1cm4gd2ViZ2xGRkk7XHJcbiAgICBvYmpNYXBwZXIgPSBuZXcgT2JqZWN0TWFwcGVyKCk7XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5YC85Yib5bu657O75YiXIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9udWxsKGVudikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfbnVsbCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfdW5kZWZpbmVkKGVudikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfdW5kZWZpbmVkIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9ib29sZWFuKGVudiwgdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2Jvb2xlYW4gbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2ludDMyKGVudiwgdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2ludDMyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8g57G75Ly85Zyw5aSE55CG5YW25LuW5Z+656GA57G75Z6L5Yib5bu65Ye95pWwXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX3VpbnQzMihlbnYsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV91aW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2ludDY0KGVudiwgdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2ludDY0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV91aW50NjQoZW52LCB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfdWludDY0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9kb3VibGUoZW52LCB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfZG91YmxlIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9zdHJpbmdfdXRmOChlbnYsIHN0ciwgbGVuZ3RoKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV9zdHJpbmdfdXRmOCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfYmluYXJ5KGVudiwgYmluLCBsZW5ndGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2JpbmFyeSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfYXJyYXkoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKFtdKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfb2JqZWN0KGVudikge1xyXG4gICAgICAgIHJldHVybiBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShPYmplY3QuY3JlYXRlKG51bGwpKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfZnVuY3Rpb24oZW52LCBuYXRpdmVfaW1wbCwgZGF0YSwgZmluYWxpemUgLy8gVE9ETzogZ2Pml7bosIPnlKhmaW5hbGl6ZVxyXG4gICAgKSB7XHJcbiAgICAgICAgY29uc3QganNDYWxsYmFjayA9IGdlbkpzQ2FsbGJhY2soZW5naW5lLnVuaXR5QXBpLCBuYXRpdmVfaW1wbCwgZGF0YSwgd2ViZ2xGRkksIHRydWUpO1xyXG4gICAgICAgIHJldHVybiBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShqc0NhbGxiYWNrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfY2xhc3MoZW52LCB0eXBlSWQpIHtcclxuICAgICAgICBjb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkubG9hZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgY2xzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBjcmVhdGUgY2xhc3M6ICR7Y2xzLm5hbWV9YCk7XHJcbiAgICAgICAgICAgIHJldHVybiBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShjbHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYW4ndCBsb2FkIGNsYXNzIGJ5IHR5cGUgaWQ6IFwiICsgdHlwZUlkKTtcclxuICAgIH1cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLSDlgLzojrflj5bns7vliJcgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2Jvb2woZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX2Jvb2wgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2ludDMyKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF92YWx1ZV9pbnQzMiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIC8vIOexu+S8vOWkhOeQhuWFtuS7luexu+Wei+iOt+WPllxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV91aW50MzIoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX3VpbnQzMiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfaW50NjQoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX2ludDY0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV91aW50NjQoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX3VpbnQ2NCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfZG91YmxlKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF92YWx1ZV9kb3VibGUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX3N0cmluZ191dGY4KGVudiwgcHZhbHVlLCBidWYsIGJ1ZnNpemUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX3N0cmluZ191dGY4IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV9iaW5hcnkoZW52LCBwdmFsdWUsIGJ1ZnNpemUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX2JpbmFyeSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3QgYXJyYXkgPSBTY29wZS5nZXRDdXJyZW50KCkuZ2V0RnJvbVNjb3BlKHB2YWx1ZSk7XHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2FycmF5X2xlbmd0aDogdmFsdWUgaXMgbm90IGFuIGFycmF5XCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyYXkubGVuZ3RoO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOexu+Wei+ajgOafpeezu+WIlyAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19udWxsKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX251bGwgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfdW5kZWZpbmVkKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX3VuZGVmaW5lZCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19ib29sZWFuKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2Jvb2xlYW4gbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfaW50MzIoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfaW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfdWludDMyKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX3VpbnQzMiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19pbnQ2NChlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19pbnQ2NCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc191aW50NjQoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfdWludDY0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX2RvdWJsZShlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19kb3VibGUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfc3RyaW5nKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX3N0cmluZyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9pc19vYmplY3QoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfb2JqZWN0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX2Z1bmN0aW9uKGVudiwgcHZhbHVlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2Z1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX2JpbmFyeShlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19iaW5hcnkgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfYXJyYXkoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfYXJyYXkgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5a+56LGh5pON5L2c57O75YiXIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX25hdGl2ZV9vYmplY3RfdG9fdmFsdWUoZW52LCB0eXBlSWQsIG9iamVjdF9wdHIsIGNhbGxfZmluYWxpemUpIHtcclxuICAgICAgICBjb25zdCBqc09iaiA9IG9iak1hcHBlci5wdXNoTmF0aXZlT2JqZWN0KG9iamVjdF9wdHIsIHR5cGVJZCwgY2FsbF9maW5hbGl6ZSk7XHJcbiAgICAgICAgLy8gVE9ETzoganVzdCBmb3IgdGVzdFxyXG4gICAgICAgIC8vY29uc3QgY2xzID0gQ2xhc3NSZWdpc3Rlci5nZXRJbnN0YW5jZSgpLmZpbmRDbGFzc0J5SWQodHlwZUlkKTtcclxuICAgICAgICAvL2lmIChjbHMubmFtZSA9PSBcIkpzRW52XCIpIHtcclxuICAgICAgICAvLyAgICBjb25zb2xlLmxvZyhgY2FsbCBGaWxlRXhpc3RzKGFhYmIudHh0KTogJHsoanNPYmogYXMgYW55KS5sb2FkZXIuRmlsZUV4aXN0cyhcImFhYmIudHh0XCIpfWApO1xyXG4gICAgICAgIC8vICAgIGNvbnNvbGUubG9nKGBjYWxsIEZpbGVFeGlzdHMocHVlcnRzL2VzbV9ib290c3RyYXAuY2pzKTogJHsoanNPYmogYXMgYW55KS5sb2FkZXIuRmlsZUV4aXN0cyhcInB1ZXJ0cy9lc21fYm9vdHN0cmFwLmNqc1wiKX1gKTtcclxuICAgICAgICAvL31cclxuICAgICAgICByZXR1cm4gb2JqZWN0X3B0cjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfbmF0aXZlX29iamVjdF9wdHIoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X25hdGl2ZV9vYmplY3RfcHRyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9uYXRpdmVfb2JqZWN0X3R5cGVpZChlbnYsIHB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfbmF0aXZlX29iamVjdF90eXBlaWQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfaXNfaW5zdGFuY2Vfb2YoZW52LCB0eXBlX2lkLCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfaW5zdGFuY2Vfb2Ygbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g6KOF566xL+aLhueusSAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9ib3hpbmcoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfYm94aW5nIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3VuYm94aW5nKGVudiwgcF9ib3hlZF92YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV91bmJveGluZyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV91cGRhdGVfYm94ZWRfdmFsdWUoZW52LCBwX2JveGVkX3ZhbHVlLCBwdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfdXBkYXRlX2JveGVkX3ZhbHVlIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2lzX2JveGVkX3ZhbHVlKGVudiwgdmFsdWUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfYm94ZWRfdmFsdWUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5Ye95pWw6LCD55So55u45YWzIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9hcmdzX2xlbihwaW5mbykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfYXJnc19sZW4gbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X2FyZyhwaW5mbywgaW5kZXgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2FyZyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfZW52KHBpbmZvKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9lbnYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X25hdGl2ZV9ob2xkZXJfcHRyKHBpbmZvKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9uYXRpdmVfaG9sZGVyX3B0ciBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfaG9sZGVyKHBpbmZvKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9ob2xkZXIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3VzZXJkYXRhKHBpbmZvKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF91c2VyZGF0YSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9hZGRfcmV0dXJuKHBpbmZvLCB2YWx1ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9hZGRfcmV0dXJuIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3Rocm93X2J5X3N0cmluZyhwaW5mbywgcG1zZykge1xyXG4gICAgICAgIGNvbnN0IG1zZyA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocG1zZyk7XHJcbiAgICAgICAgc2V0TGFzdEV4Y2VwdGlvbihuZXcgRXJyb3IobXNnKSk7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g546v5aKD5byV55SoIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9lbnZfcmVmKGVudikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfZW52X3JlZiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9lbnZfcmVmX2lzX3ZhbGlkKHBlbnZfcmVmKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2Vudl9yZWZfaXNfdmFsaWQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X2Vudl9mcm9tX3JlZihwZW52X3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfZW52X2Zyb21fcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2R1cGxpY2F0ZV9lbnZfcmVmKHBlbnZfcmVmKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2R1cGxpY2F0ZV9lbnZfcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3JlbGVhc2VfZW52X3JlZihwZW52X3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9yZWxlYXNlX2Vudl9yZWYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5L2c55So5Z+f566h55CGIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGUocGVudl9yZWYpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50KHBlbnZfcmVmLCBtZW1vcnkpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2hhc19jYXVnaHQocHNjb3BlKSB7XHJcbiAgICAgICAgcmV0dXJuIGhhc0V4Y2VwdGlvbjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfZXhjZXB0aW9uX2FzX3N0cmluZyhwc2NvcGUsIHdpdGhfc3RhY2spIHtcclxuICAgICAgICByZXR1cm4gZ2V0RXhjZXB0aW9uQXNOYXRpdmVTdHJpbmcoZW5naW5lLnVuaXR5QXBpLCB3aXRoX3N0YWNrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jbG9zZV9zY29wZShwc2NvcGUpIHtcclxuICAgICAgICBTY29wZS5leGl0KGVuZ2luZS51bml0eUFwaSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50KHBzY29wZSkge1xyXG4gICAgICAgIFNjb3BlLmV4aXQoZW5naW5lLnVuaXR5QXBpKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlZmVyZW5jZWRWYWx1ZXMgPSBuZXcgU3BhcnNlQXJyYXkoKTtcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLSDlgLzlvJXnlKggLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY3JlYXRlX3ZhbHVlX3JlZihlbnYsIHB2YWx1ZSwgaW50ZXJuYWxfZmllbGRfY291bnQpIHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwdmFsdWUpO1xyXG4gICAgICAgIHJldHVybiByZWZlcmVuY2VkVmFsdWVzLmFkZCh2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZHVwbGljYXRlX3ZhbHVlX3JlZihwdmFsdWVfcmVmKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2R1cGxpY2F0ZV92YWx1ZV9yZWYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfcmVsZWFzZV92YWx1ZV9yZWYocHZhbHVlX3JlZikge1xyXG4gICAgICAgIHJlZmVyZW5jZWRWYWx1ZXMucmVtb3ZlKHB2YWx1ZV9yZWYpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV9mcm9tX3JlZihlbnYsIHB2YWx1ZV9yZWYsIHB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmVmZXJlbmNlZFZhbHVlcy5nZXQocHZhbHVlX3JlZik7XHJcbiAgICAgICAganNWYWx1ZVRvUGFwaVZhbHVlKGVuZ2luZS51bml0eUFwaSwgdmFsdWUsIHB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X3JlZl93ZWFrKGVudiwgcHZhbHVlX3JlZikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcmVmX3dlYWsgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X293bmVyKGVudiwgcHZhbHVlLCBwb3duZXIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfc2V0X293bmVyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9yZWZfYXNzb2NpYXRlZF9lbnYodmFsdWVfcmVmKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9yZWZfYXNzb2NpYXRlZF9lbnYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3JlZl9pbnRlcm5hbF9maWVsZHMocHZhbHVlX3JlZiwgcGludGVybmFsX2ZpZWxkX2NvdW50KSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9yZWZfaW50ZXJuYWxfZmllbGRzIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWxnuaAp+aTjeS9nCAtLS0tLS0tLS0tLS0tLS1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCB2YWx1ZSwgcHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9zZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcml2YXRlKGVudiwgcG9iamVjdCwgb3V0X3B0cikge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwb2JqZWN0KTtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgMCwgb3V0X3B0cik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgb2JqWydfX3BfcHJpdmF0ZV9kYXRhJ10sIG91dF9wdHIpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9wcml2YXRlKGVudiwgcG9iamVjdCwgcHRyKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnICYmIHR5cGVvZiBvYmogIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9ialsnX19wX3ByaXZhdGVfZGF0YSddID0gcHRyO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcm9wZXJ0eV91aW50MzIoZW52LCBwb2JqZWN0LCBrZXksIHB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwb2JqZWN0KTtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMjogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAganNWYWx1ZVRvUGFwaVZhbHVlKGVuZ2luZS51bml0eUFwaSwgdmFsdWUsIHB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMihlbnYsIHBvYmplY3QsIGtleSwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcHJvcGVydHlfdWludDMyOiB0YXJnZXQgaXMgbm90IGFuIG9iamVjdFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWHveaVsOiwg+eUqC/miafooYwgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2FsbF9mdW5jdGlvbihlbnYsIHBmdW5jLCB0aGlzX29iamVjdCwgYXJnYywgYXJndiwgcHJlc3VsdCkge1xyXG4gICAgICAgIGNvbnN0IGZ1bmMgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcGZ1bmMpO1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgdGhpc19vYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jYWxsX2Z1bmN0aW9uOiB0YXJnZXQgaXMgbm90IGEgZnVuY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGhlYXAgPSBlbmdpbmUudW5pdHlBcGkuSEVBUFU4O1xyXG4gICAgICAgIGNvbnN0IGFyZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ2M7ICsraSkge1xyXG4gICAgICAgICAgICBjb25zdCBhcmdQdHIgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIGFyZ3YgKyBpICogNCk7XHJcbiAgICAgICAgICAgIGFyZ3MucHVzaChTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgYXJnUHRyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncyk7XHJcbiAgICAgICAgICAgIGpzVmFsdWVUb1BhcGlWYWx1ZShlbmdpbmUudW5pdHlBcGksIHJlc3VsdCwgcHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHNldExhc3RFeGNlcHRpb24oZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8g5ZKMcGVzYXBpLmjlo7DmmI7kuI3kuIDmoLfvvIzov5nmlLnkuLrov5Tlm57lgLzmjIfpkojnlLHosIPnlKjogIXvvIjljp/nlJ/vvInkvKDlhaVcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9ldmFsKGVudiwgcGNvZGUsIGNvZGVfc2l6ZSwgcGF0aCwgcHJlc3VsdCkge1xyXG4gICAgICAgIGlmICghZ2xvYmFsVGhpcy5ldmFsKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImV2YWwgaXMgbm90IHN1cHBvcnRlZFwiKTsgLy8gVE9ETzog5oqb57uZd2FzbeabtOWQiOmAguS6m1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBjb2RlID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhwY29kZSwgY29kZV9zaXplKTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZ2xvYmFsVGhpcy5ldmFsKGNvZGUpO1xyXG4gICAgICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCByZXN1bHQsIHByZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBzZXRMYXN0RXhjZXB0aW9uKGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLSDlhajlsYDlr7nosaEgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2xvYmFsKGVudikge1xyXG4gICAgICAgIHJldHVybiBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShnbG9iYWxUaGlzKTtcclxuICAgIH1cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLSDnjq/looPnp4HmnInmlbDmja4gLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X2Vudl9wcml2YXRlKGVudikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfZW52X3ByaXZhdGUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X2Vudl9wcml2YXRlKGVudiwgcHRyKSB7XHJcbiAgICAgICAgb2JqTWFwcGVyLnNldEVudlByaXZhdGUocHRyKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGFwaUluZm8gPSBbXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX251bGwsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX3VuZGVmaW5lZCwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfYm9vbGVhbiwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2ludDMyLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfdWludDMyLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfaW50NjQsIHNpZzogXCJpamlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV91aW50NjQsIHNpZzogXCJpamlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9kb3VibGUsIHNpZzogXCJpaWRcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9zdHJpbmdfdXRmOCwgc2lnOiBcImlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9iaW5hcnksIHNpZzogXCJpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfYXJyYXksIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX29iamVjdCwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfZnVuY3Rpb24sIHNpZzogXCJpaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2NsYXNzLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfYm9vbCwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX2ludDMyLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfdWludDMyLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfaW50NjQsIHNpZzogXCJqaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV91aW50NjQsIHNpZzogXCJqaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV9kb3VibGUsIHNpZzogXCJkaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV9zdHJpbmdfdXRmOCwgc2lnOiBcImlpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfYmluYXJ5LCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2FycmF5X2xlbmd0aCwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfaXNfbnVsbCwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfaXNfdW5kZWZpbmVkLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19ib29sZWFuLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19pbnQzMiwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfaXNfdWludDMyLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19pbnQ2NCwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfaXNfdWludDY0LCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19kb3VibGUsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2lzX3N0cmluZywgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfaXNfb2JqZWN0LCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19mdW5jdGlvbiwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfaXNfYmluYXJ5LCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19hcnJheSwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfbmF0aXZlX29iamVjdF90b192YWx1ZSwgc2lnOiBcImlpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfbmF0aXZlX29iamVjdF9wdHIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9uYXRpdmVfb2JqZWN0X3R5cGVpZCwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfaXNfaW5zdGFuY2Vfb2YsIHNpZzogXCJpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9ib3hpbmcsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX3VuYm94aW5nLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV91cGRhdGVfYm94ZWRfdmFsdWUsIHNpZzogXCJ2aWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9pc19ib3hlZF92YWx1ZSwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2FyZ3NfbGVuLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9hcmcsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9lbnYsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X25hdGl2ZV9ob2xkZXJfcHRyLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9ob2xkZXIsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3VzZXJkYXRhLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2FkZF9yZXR1cm4sIHNpZzogXCJ2aWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX3Rocm93X2J5X3N0cmluZywgc2lnOiBcInZpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2Vudl9yZWYsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZW52X3JlZl9pc192YWxpZCwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfZW52X2Zyb21fcmVmLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2R1cGxpY2F0ZV9lbnZfcmVmLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX3JlbGVhc2VfZW52X3JlZiwgc2lnOiBcInZpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9vcGVuX3Njb3BlLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50LCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9oYXNfY2F1Z2h0LCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9leGNlcHRpb25fYXNfc3RyaW5nLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jbG9zZV9zY29wZSwgc2lnOiBcInZpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9jbG9zZV9zY29wZV9wbGFjZW1lbnQsIHNpZzogXCJ2aVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX3ZhbHVlX3JlZiwgc2lnOiBcImlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2R1cGxpY2F0ZV92YWx1ZV9yZWYsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfcmVsZWFzZV92YWx1ZV9yZWYsIHNpZzogXCJ2aVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmLCBzaWc6IFwidmlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X3JlZl93ZWFrLCBzaWc6IFwidmlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9zZXRfb3duZXIsIHNpZzogXCJpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfcmVmX2Fzc29jaWF0ZWRfZW52LCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9yZWZfaW50ZXJuYWxfZmllbGRzLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfcHJvcGVydHksIHNpZzogXCJ2aWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X3Byb3BlcnR5LCBzaWc6IFwidmlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dldF9wcml2YXRlLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X3ByaXZhdGUsIHNpZzogXCJpaWlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfcHJvcGVydHlfdWludDMyLCBzaWc6IFwidmlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX3NldF9wcm9wZXJ0eV91aW50MzIsIHNpZzogXCJ2aWlpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfY2FsbF9mdW5jdGlvbiwgc2lnOiBcInZpaWlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2V2YWwsIHNpZzogXCJ2aWlpaWlcIiB9LFxyXG4gICAgICAgIHsgZnVuYzogcGVzYXBpX2dsb2JhbCwgc2lnOiBcImlpXCIgfSxcclxuICAgICAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfZW52X3ByaXZhdGUsIHNpZzogXCJpaVwiIH0sXHJcbiAgICAgICAgeyBmdW5jOiBwZXNhcGlfc2V0X2Vudl9wcml2YXRlLCBzaWc6IFwidmlpXCIgfVxyXG4gICAgXTtcclxuICAgIGNvbnNvbGUubG9nKGBjcmVhdGUgd2ViZ2wgZmZpIGFwaSBjb3VudDogJHthcGlJbmZvLmxlbmd0aH1gKTtcclxuICAgIGNvbnN0IHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKGFwaUluZm8ubGVuZ3RoICogNCk7XHJcbiAgICBjb25zdCBoMzJpbmRleCA9IHB0ciA+PiAyO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcGlJbmZvLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltoMzJpbmRleCArIGldID0gZW5naW5lLnVuaXR5QXBpLmFkZEZ1bmN0aW9uKGFwaUluZm9baV0uZnVuYywgYXBpSW5mb1tpXS5zaWcpO1xyXG4gICAgfVxyXG4gICAgd2ViZ2xGRkkgPSBwdHI7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSW5qZWN0UGFwaUdMTmF0aXZlSW1wbCh3ZWJnbEZGSSk7XHJcbiAgICByZXR1cm4gcHRyO1xyXG59XHJcbmV4cG9ydHMuR2V0V2ViR0xGRklBcGkgPSBHZXRXZWJHTEZGSUFwaTtcclxuZnVuY3Rpb24gV2ViR0xSZWdzdGVyQXBpKGVuZ2luZSkge1xyXG4gICAgLy8gSW5pdGlhbGl6ZSB3aXRoIHByb3BlciB0eXBlIGFzc2VydGlvblxyXG4gICAgY29uc3QgZGVzY3JpcHRvcnNBcnJheSA9IFtbXV07XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIEdldFJlZ3N0ZXJBcGk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXNhcGlfYWxsb2NfcHJvcGVydHlfZGVzY3JpcHRvcnM6IGZ1bmN0aW9uIChjb3VudCkge1xyXG4gICAgICAgICAgICBkZXNjcmlwdG9yc0FycmF5LnB1c2goW10pO1xyXG4gICAgICAgICAgICByZXR1cm4gZGVzY3JpcHRvcnNBcnJheS5sZW5ndGggLSAxO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVzYXBpX2RlZmluZV9jbGFzczogZnVuY3Rpb24gKHR5cGVJZCwgc3VwZXJUeXBlSWQsIHBuYW1lLCBjb25zdHJ1Y3RvciwgZmluYWxpemUsIHByb3BlcnR5Q291bnQsIHByb3BlcnRpZXMsIGRhdGEpIHtcclxuICAgICAgICAgICAgY29uc3QgZGVzY3JpcHRvcnMgPSBkZXNjcmlwdG9yc0FycmF5W3Byb3BlcnRpZXNdO1xyXG4gICAgICAgICAgICBkZXNjcmlwdG9yc0FycmF5W3Byb3BlcnRpZXNdID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhwbmFtZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IFBBcGlOYXRpdmVPYmplY3QgPSBmdW5jdGlvbiAoLi4uYXJncykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNhbGxiYWNrSW5mbyA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFyZ2MgPSBhcmd1bWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja0luZm8gPSBqc0FyZ3NUb0NhbGxiYWNrSW5mbyhlbmdpbmUudW5pdHlBcGksIGFyZ2MsIGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGVuZ2luZS51bml0eUFwaS5IRUFQVTgsIGRhdGEsIGNhbGxiYWNrSW5mbyArIDgpOyAvLyBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqSWQgPSBlbmdpbmUudW5pdHlBcGkuUEFwaUNvbnN0cnVjdG9yV2l0aFNjb3BlKGNvbnN0cnVjdG9yLCB3ZWJnbEZGSSwgY2FsbGJhY2tJbmZvKTsgLy8g6aKE5pyfd2FzbeWPquS8mumAmui/h3Rocm93X2J5X3N0cmluZ+aKm+W8guW4uO+8jOS4jeS6p+eUn+ebtOaOpWpz5byC5bi4XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0V4Y2VwdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqTWFwcGVyLmJpbmROYXRpdmVPYmplY3Qob2JqSWQsIHRoaXMsIHR5cGVJZCwgUEFwaU5hdGl2ZU9iamVjdCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmaW5hbGx5IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm5OYXRpdmVDYWxsYmFja0luZm8oZW5naW5lLnVuaXR5QXBpLCBhcmdjLCBjYWxsYmFja0luZm8pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUEFwaU5hdGl2ZU9iamVjdCwgXCJuYW1lXCIsIHsgdmFsdWU6IG5hbWUgfSk7XHJcbiAgICAgICAgICAgIGlmIChzdXBlclR5cGVJZCAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdXBlclR5cGUgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkubG9hZENsYXNzQnlJZChzdXBlclR5cGVJZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3VwZXJUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKFBBcGlOYXRpdmVPYmplY3QucHJvdG90eXBlLCBzdXBlclR5cGUucHJvdG90eXBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkZXNjcmlwdG9ycy5mb3JFYWNoKGRlc2NyaXB0b3IgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCdjYWxsYmFjaycgaW4gZGVzY3JpcHRvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGpzQ2FsbGJhY2sgPSBnZW5Kc0NhbGxiYWNrKGVuZ2luZS51bml0eUFwaSwgZGVzY3JpcHRvci5jYWxsYmFjaywgZGVzY3JpcHRvci5kYXRhLCB3ZWJnbEZGSSwgZGVzY3JpcHRvci5pc1N0YXRpYyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlc2NyaXB0b3IuaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgUEFwaU5hdGl2ZU9iamVjdFtkZXNjcmlwdG9yLm5hbWVdID0ganNDYWxsYmFjaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFBBcGlOYXRpdmVPYmplY3QucHJvdG90eXBlW2Rlc2NyaXB0b3IubmFtZV0gPSBqc0NhbGxiYWNrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coYGdlbkpzQ2FsbGJhY2sgJHtkZXNjcmlwdG9yLm5hbWV9ICR7ZGVzY3JpcHRvci5nZXR0ZXJfZGF0YX0gJHt3ZWJnbEZGSX1gKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlEZXNjcmlwdG9yID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXQ6IGRlc2NyaXB0b3IuZ2V0dGVyID09PSAwID8gdW5kZWZpbmVkIDogZ2VuSnNDYWxsYmFjayhlbmdpbmUudW5pdHlBcGksIGRlc2NyaXB0b3IuZ2V0dGVyLCBkZXNjcmlwdG9yLmdldHRlcl9kYXRhLCB3ZWJnbEZGSSwgZGVzY3JpcHRvci5pc1N0YXRpYyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldDogZGVzY3JpcHRvci5zZXR0ZXIgPT09IDAgPyB1bmRlZmluZWQgOiBnZW5Kc0NhbGxiYWNrKGVuZ2luZS51bml0eUFwaSwgZGVzY3JpcHRvci5zZXR0ZXIsIGRlc2NyaXB0b3Iuc2V0dGVyX2RhdGEsIHdlYmdsRkZJLCBkZXNjcmlwdG9yLmlzU3RhdGljKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGVzY3JpcHRvci5pc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUEFwaU5hdGl2ZU9iamVjdCwgZGVzY3JpcHRvci5uYW1lLCBwcm9wZXJ0eURlc2NyaXB0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFBBcGlOYXRpdmVPYmplY3QucHJvdG90eXBlLCBkZXNjcmlwdG9yLm5hbWUsIHByb3BlcnR5RGVzY3JpcHRvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYHBlc2FwaV9kZWZpbmVfY2xhc3M6ICR7bmFtZX0gJHt0eXBlSWR9ICR7c3VwZXJUeXBlSWR9YCk7XHJcbiAgICAgICAgICAgIENsYXNzUmVnaXN0ZXIuZ2V0SW5zdGFuY2UoKS5yZWdpc3RlckNsYXNzKHR5cGVJZCwgUEFwaU5hdGl2ZU9iamVjdCwgZW5naW5lLnVuaXR5QXBpLmdldFdhc21UYWJsZUVudHJ5KGZpbmFsaXplKSwgZGF0YSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXNhcGlfZ2V0X2NsYXNzX2RhdGE6IGZ1bmN0aW9uICh0eXBlSWQsIGZvcmNlTG9hZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gQ2xhc3NSZWdpc3Rlci5nZXRJbnN0YW5jZSgpLmdldENsYXNzRGF0YUJ5SWQodHlwZUlkLCBmb3JjZUxvYWQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVzYXBpX29uX2NsYXNzX25vdF9mb3VuZDogZnVuY3Rpb24gKGNhbGxiYWNrUHRyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzQ2FsbGJhY2sgPSBlbmdpbmUudW5pdHlBcGkuZ2V0V2FzbVRhYmxlRW50cnkoY2FsbGJhY2tQdHIpO1xyXG4gICAgICAgICAgICBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkuc2V0Q2xhc3NOb3RGb3VuZENhbGxiYWNrKCh0eXBlSWQpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJldCA9IGpzQ2FsbGJhY2sodHlwZUlkKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAhIXJldDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXNhcGlfc2V0X21ldGhvZF9pbmZvOiBmdW5jdGlvbiAocHJvcGVydGllcywgaW5kZXgsIHBuYW1lLCBpc19zdGF0aWMsIG1ldGhvZCwgZGF0YSwgc2lnbmF0dXJlX2luZm8pIHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocG5hbWUpO1xyXG4gICAgICAgICAgICBkZXNjcmlwdG9yc0FycmF5W3Byb3BlcnRpZXNdW2luZGV4XSA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgICAgICBpc1N0YXRpYzogaXNfc3RhdGljLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IG1ldGhvZCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlc2FwaV9zZXRfcHJvcGVydHlfaW5mbzogZnVuY3Rpb24gKHByb3BlcnRpZXMsIGluZGV4LCBwbmFtZSwgaXNfc3RhdGljLCBnZXR0ZXIsIHNldHRlciwgZ2V0dGVyX2RhdGEsIHNldHRlcl9kYXRhLCB0eXBlX2luZm8pIHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocG5hbWUpO1xyXG4gICAgICAgICAgICBkZXNjcmlwdG9yc0FycmF5W3Byb3BlcnRpZXNdW2luZGV4XSA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgICAgICBpc1N0YXRpYzogaXNfc3RhdGljLFxyXG4gICAgICAgICAgICAgICAgZ2V0dGVyOiBnZXR0ZXIsXHJcbiAgICAgICAgICAgICAgICBzZXR0ZXI6IHNldHRlcixcclxuICAgICAgICAgICAgICAgIGdldHRlcl9kYXRhOiBnZXR0ZXJfZGF0YSxcclxuICAgICAgICAgICAgICAgIHNldHRlcl9kYXRhOiBzZXR0ZXJfZGF0YVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVzYXBpX3RyYWNlX25hdGl2ZV9vYmplY3RfbGlmZWN5Y2xlOiBmdW5jdGlvbiAodHlwZUlkLCBvbkVudGVyLCBvbkV4aXQpIHtcclxuICAgICAgICAgICAgY29uc3QgZW50ZXJDYWxsYmFjayA9IGVuZ2luZS51bml0eUFwaS5nZXRXYXNtVGFibGVFbnRyeShvbkVudGVyKTtcclxuICAgICAgICAgICAgY29uc3QgZXhpdENhbGxiYWNrID0gZW5naW5lLnVuaXR5QXBpLmdldFdhc21UYWJsZUVudHJ5KG9uRXhpdCk7XHJcbiAgICAgICAgICAgIENsYXNzUmVnaXN0ZXIuZ2V0SW5zdGFuY2UoKS50cmFjZU5hdGl2ZU9iamVjdExpZmVjeWNsZSh0eXBlSWQsIGVudGVyQ2FsbGJhY2ssIGV4aXRDYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLldlYkdMUmVnc3RlckFwaSA9IFdlYkdMUmVnc3RlckFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGVzYXBpSW1wbC5qcy5tYXAiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4vKipcclxuICog5qC55o2uIGh0dHBzOi8vZG9jcy51bml0eTNkLmNvbS8yMDE4LjQvRG9jdW1lbnRhdGlvbi9NYW51YWwvd2ViZ2wtaW50ZXJhY3Rpbmd3aXRoYnJvd3NlcnNjcmlwdGluZy5odG1sXHJcbiAqIOaIkeS7rOeahOebrueahOWwseaYr+WcqFdlYkdM5qih5byP5LiL77yM5a6e546w5ZKMcHVlcnRzLmRsbOeahOaViOaenOOAguWFt+S9k+WcqOS6juWunueOsOS4gOS4qmpzbGli77yM6YeM6Z2i5bqU5YyF5ZCrUHVlcnRzRExMLmNz55qE5omA5pyJ5o6l5Y+jXHJcbiAqIOWunumqjOWPkeeOsOi/meS4qmpzbGli6Jm954S25Lmf5piv6L+Q6KGM5ZyodjjnmoRqc++8jOS9huWvuWRldnRvb2zosIPor5XlubbkuI3lj4vlpb3vvIzkuJTlj6rmlK/mjIHliLBlczXjgIJcclxuICog5Zug5q2k5bqU6K+l6YCa6L+H5LiA5Liq54us56uL55qEanPlrp7njrDmjqXlj6PvvIxwdWVydHMuanNsaWLpgJrov4flhajlsYDnmoTmlrnlvI/osIPnlKjlroPjgIJcclxuICpcclxuICog5pyA57uI5b2i5oiQ5aaC5LiL5p625p6EXHJcbiAqIOS4muWKoUpTIDwtPiBXQVNNIDwtPiB1bml0eSBqc2xpYiA8LT4g5pysanNcclxuICog5L2G5pW05p2h6ZO+6Lev5YW25a6e6YO95Zyo5LiA5LiqdjgoanNjb3JlKeiZmuaLn+acuumHjFxyXG4gKi9cclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4vbGlicmFyeVwiKTtcclxuY29uc3QgZ2V0RnJvbUpTQXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9nZXRGcm9tSlNBcmd1bWVudFwiKTtcclxuY29uc3QgZ2V0RnJvbUpTUmV0dXJuXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvZ2V0RnJvbUpTUmV0dXJuXCIpO1xyXG5jb25zdCByZWdpc3Rlcl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3JlZ2lzdGVyXCIpO1xyXG5jb25zdCBzZXRUb0ludm9rZUpTQXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0ludm9rZUpTQXJndW1lbnRcIik7XHJcbmNvbnN0IHNldFRvSlNJbnZva2VSZXR1cm5fMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0pTSW52b2tlUmV0dXJuXCIpO1xyXG5jb25zdCBzZXRUb0pTT3V0QXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0pTT3V0QXJndW1lbnRcIik7XHJcbmNvbnN0IHBlc2FwaUltcGxfMSA9IHJlcXVpcmUoXCIuL3Blc2FwaUltcGxcIik7XHJcbmxpYnJhcnlfMS5nbG9iYWwud3hSZXF1aXJlID0gbGlicmFyeV8xLmdsb2JhbC5yZXF1aXJlO1xyXG5saWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMID0ge1xyXG4gICAgaW5pdGVkOiBmYWxzZSxcclxuICAgIGRlYnVnOiBmYWxzZSxcclxuICAgIC8vIHB1ZXJ0c+mmluasoeWIneWni+WMluaXtuS8muiwg+eUqOi/memHjO+8jOW5tuaKilVuaXR555qE6YCa5L+h5o6l5Y+j5Lyg5YWlXHJcbiAgICBJbml0KGN0b3JQYXJhbSkge1xyXG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IG5ldyBsaWJyYXJ5XzEuUHVlcnRzSlNFbmdpbmUoY3RvclBhcmFtKTtcclxuICAgICAgICBjb25zdCBleGVjdXRlTW9kdWxlQ2FjaGUgPSB7fTtcclxuICAgICAgICBsZXQganNFbmdpbmVSZXR1cm5lZCA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBsb2FkZXI7XHJcbiAgICAgICAgLy8gUHVlcnRzRExM55qE5omA5pyJ5o6l5Y+j5a6e546wXHJcbiAgICAgICAgbGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IE9iamVjdC5hc3NpZ24obGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCwge1xyXG4gICAgICAgICAgICB1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3czogZW5naW5lLnVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzLmJpbmQoZW5naW5lKVxyXG4gICAgICAgIH0sICgwLCBnZXRGcm9tSlNBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBnZXRGcm9tSlNSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSlNJbnZva2VSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU091dEFyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHJlZ2lzdGVyXzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHBlc2FwaUltcGxfMS5XZWJHTFJlZ3N0ZXJBcGkpKGVuZ2luZSksIHtcclxuICAgICAgICAgICAgLy8gYnJpZGdlTG9nOiB0cnVlLFxyXG4gICAgICAgICAgICBHZXRMaWJWZXJzaW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMzQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEFwaUxldmVsOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMzQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldExpYkJhY2tlbmQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBDcmVhdGVKU0VuZ2luZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGpzRW5naW5lUmV0dXJuZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJvbmx5IG9uZSBhdmFpbGFibGUganNFbnYgaXMgYWxsb3dlZCBpbiBXZWJHTCBtb2RlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAganNFbmdpbmVSZXR1cm5lZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSlNFbmdpbmVXaXRoRXh0ZXJuYWxFbnY6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgRGVzdHJveUpTRW5naW5lOiBmdW5jdGlvbiAoKSB7IH0sXHJcbiAgICAgICAgICAgIEdldExhc3RFeGNlcHRpb25JbmZvOiBmdW5jdGlvbiAoaXNvbGF0ZSwgLyogb3V0IGludCAqLyBzdHJsZW4pIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbmdpbmUubGFzdEV4Y2VwdGlvbiA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ251bGwnO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlbmdpbmUubGFzdEV4Y2VwdGlvbiA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhlbmdpbmUubGFzdEV4Y2VwdGlvbi5zdGFjaywgc3RybGVuKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgTG93TWVtb3J5Tm90aWZpY2F0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBJZGxlTm90aWZpY2F0aW9uRGVhZGxpbmU6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFJlcXVlc3RNaW5vckdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgUmVxdWVzdEZ1bGxHYXJiYWdlQ29sbGVjdGlvbkZvclRlc3Rpbmc6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFNldEdlbmVyYWxEZXN0cnVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2dlbmVyYWxEZXN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuZ2VuZXJhbERlc3RydWN0b3IgPSBfZ2VuZXJhbERlc3RydWN0b3I7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldE1vZHVsZUV4ZWN1dG9yOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBsb2FkZXIgPSB0eXBlb2YgX190Z2pzR2V0TG9hZGVyICE9ICd1bmRlZmluZWQnID8gX190Z2pzR2V0TG9hZGVyKCkgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9hZGVyUmVzb2x2ZSA9IGxvYWRlci5SZXNvbHZlID8gKGZ1bmN0aW9uIChmaWxlTmFtZSwgdG8gPSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWROYW1lID0gbG9hZGVyLlJlc29sdmUoZmlsZU5hbWUsIHRvKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBub3QgZm91bmQ6ICcgKyBmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlZE5hbWU7XHJcbiAgICAgICAgICAgICAgICB9KSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmN0aW9uIChmaWxlTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChbJ3B1ZXJ0cy9sb2cubWpzJywgJ3B1ZXJ0cy90aW1lci5tanMnXS5pbmRleE9mKGZpbGVOYW1lKSAhPSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge307XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkZXJSZXNvbHZlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVOYW1lID0gbG9hZGVyUmVzb2x2ZShmaWxlTmFtZSwgXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gd3hSZXF1aXJlKCdwdWVydHNfbWluaWdhbWVfanNfcmVzb3VyY2VzLycgKyAoZmlsZU5hbWUuZW5kc1dpdGgoJy5qcycpID8gZmlsZU5hbWUgOiBmaWxlTmFtZSArIFwiLmpzXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShuYW1lLCB0bykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBDUyAhPSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuSXNSZWxhdGl2ZSh0bykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmV0ID0gQ1MuUHVlcnRzLlBhdGhIZWxwZXIubm9ybWFsaXplKENTLlB1ZXJ0cy5QYXRoSGVscGVyLkRpcm5hbWUobmFtZSkgKyBcIi9cIiArIHRvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbW9ja1JlcXVpcmUoc3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGV4cG9ydHM6IHt9IH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZENhY2hlU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIGV4ZWN1dGVNb2R1bGVDYWNoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRDYWNoZVNwZWNpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5leHBvcnRzID0gZXhlY3V0ZU1vZHVsZUNhY2hlW2ZvdW5kQ2FjaGVTcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmRTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgUFVFUlRTX0pTX1JFU09VUkNFUyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3VuZFNwZWNpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBub3QgZm91bmQ6ICcgKyBzcGVjaWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjaWZpZXIgPSBmb3VuZFNwZWNpZmllcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBVRVJUU19KU19SRVNPVVJDRVNbc3BlY2lmaWVyXShyZXN1bHQuZXhwb3J0cywgZnVuY3Rpb24gbVJlcXVpcmUoc3BlY2lmaWVyVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2NrUmVxdWlyZShsb2FkZXJSZXNvbHZlID8gbG9hZGVyUmVzb2x2ZShzcGVjaWZpZXJUbywgc3BlY2lmaWVyKSA6IG5vcm1hbGl6ZShzcGVjaWZpZXIsIHNwZWNpZmllclRvKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSByZXN1bHQuZXhwb3J0cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuZXhwb3J0cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdHJ5RmluZE5hbWUgPSBbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3BlY2lmaWVyLmluZGV4T2YoJy4nKSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5RmluZE5hbWUgPSB0cnlGaW5kTmFtZS5jb25jYXQoW3NwZWNpZmllciArICcuanMnLCBzcGVjaWZpZXIgKyAnLnRzJywgc3BlY2lmaWVyICsgJy5tanMnLCBzcGVjaWZpZXIgKyAnLm10cyddKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmluZGVkID0gdHJ5RmluZE5hbWUucmVkdWNlKChyZXQsIG5hbWUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXQgIT09IGZhbHNlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqW25hbWVdID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY2lyY3VsYXIgZGVwZW5kZW5jeSBpcyBkZXRlY3RlZCB3aGVuIHJlcXVpcmluZyBcIiR7bmFtZX1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbmRlZCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ5RmluZE5hbWVbZmluZGVkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVxdWlyZVJldCA9IG1vY2tSZXF1aXJlKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmVSZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRKU09iamVjdFZhbHVlR2V0dGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmN0aW9uIChvYmosIGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmpba2V5XTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgRXZhbDogZnVuY3Rpb24gKGlzb2xhdGUsIGNvZGVTdHJpbmcsIHBhdGgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbGlicmFyeV8xLmdsb2JhbC5ldmFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZXZhbCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2RlID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhjb2RlU3RyaW5nKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsaWJyYXJ5XzEuZ2xvYmFsLmV2YWwoY29kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGdldEludFB0ck1hbmFnZXIoKS5HZXRQb2ludGVyRm9ySlNWYWx1ZShyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC8qRlJlc3VsdEluZm8gKi8gMTAyNDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RFeGNlcHRpb24gPSBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBTZXRQdXNoSlNGdW5jdGlvbkFyZ3VtZW50c0NhbGxiYWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSwgY2FsbGJhY2ssIGpzRW52SWR4KSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuR2V0SlNBcmd1bWVudHNDYWxsYmFjayA9IGNhbGxiYWNrO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBUaHJvd0V4Y2VwdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIC8qYnl0ZVtdICovIG1lc3NhZ2VTdHJpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG1lc3NhZ2VTdHJpbmcpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgSW52b2tlSlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgaGFzUmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gZnVuYy5pbnZva2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuYy5sYXN0RXhjZXB0aW9uID0gZXJyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0RnVuY3Rpb25MYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnVuYyBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZ1bmMubGFzdEV4Y2VwdGlvbiA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdudWxsJztcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZ1bmMubGFzdEV4Y2VwdGlvbiA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd1bmRlZmluZWQnO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKGZ1bmMubGFzdEV4Y2VwdGlvbi5zdGFjayB8fCBmdW5jLmxhc3RFeGNlcHRpb24ubWVzc2FnZSB8fCAnJywgbGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncHRyIGlzIG5vdCBhIGpzZnVuYycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBSZWxlYXNlSlNGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIF9mdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVtb3ZlSlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVsZWFzZUpTT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgb2JqKSB7XHJcbiAgICAgICAgICAgICAgICBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZW1vdmVKU09iamVjdEJ5SWQob2JqKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVzZXRSZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gbnVsbDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQ2xlYXJNb2R1bGVDYWNoZTogZnVuY3Rpb24gKCkgeyB9LFxyXG4gICAgICAgICAgICBDcmVhdGVJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlLCBwb3J0KSB7IH0sXHJcbiAgICAgICAgICAgIERlc3Ryb3lJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIEluc3BlY3RvclRpY2s6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIExvZ2ljVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgU2V0TG9nQ2FsbGJhY2s6IGZ1bmN0aW9uIChsb2csIGxvZ1dhcm5pbmcsIGxvZ0Vycm9yKSB7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEpTU3RhY2tUcmFjZTogZnVuY3Rpb24gKGlzb2xhdGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoKS5zdGFjaztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0V2ViR0xGRklBcGk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoMCwgcGVzYXBpSW1wbF8xLkdldFdlYkdMRkZJQXBpKShlbmdpbmUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRXZWJHTFBhcGlFbnZSZWY6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAyMDQ4OyAvLyBqdXN0IG5vdCBudWxscHRyXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9