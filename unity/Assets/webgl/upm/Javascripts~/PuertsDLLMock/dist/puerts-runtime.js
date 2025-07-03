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
        const { UTF8ToString, UTF16ToString, _malloc, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, stringToUTF16, lengthBytesUTF16, stackSave, stackRestore, stackAlloc, getWasmTableEntry, addFunction, removeFunction, _CallCSharpFunctionCallback, _CallCSharpConstructorCallback, _CallCSharpDestructorCallback, InjectPapiGLNativeImpl, PApiCallbackWithScope, PApiConstructorWithScope, find_class_by_id, load_class_by_id, get_class_name, get_class_initialize, get_class_finalize, get_class_type_id, get_class_super_type_id, get_class_methods, get_class_functions, get_class_properties, get_class_variables, get_next_property_info, get_next_function_info, get_property_info_name, get_property_info_getter, get_property_info_setter, get_function_info_name, get_function_info_callback, get_class_data, get_property_info_getter_data, get_property_info_setter_data, get_function_info_data, HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64, } = ctorParam;
        this.strBuffer = _malloc(this.stringBufferSize);
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
        this.registerClass(typeId, PApiNativeObject, wasmApi.getWasmTableEntry(finalize), data);
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
        const { data } = cls.$Infos;
        if (this.onEnter) {
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
        const { finalize, data } = cls.$Infos;
        if (callFinalize && finalize) {
            finalize(webglFFI, objId, data, this.privateData);
        }
        if (this.onExit && this.objId2ud.has(objId)) {
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
    /*
    interface APIInfo {
        func: Function
        sig: string
    }

    const apiInfo: APIInfo[] = [
        {func: pesapi_create_array, sig: "ii"},
        {func: pesapi_create_object, sig: "ii"},
        {func: pesapi_create_function, sig: "iiiii"},
        {func: pesapi_create_class, sig: "iii"},
        {func: pesapi_get_array_length, sig: "iii"},
        {func: pesapi_native_object_to_value, sig: "iiiii"},
        {func: pesapi_throw_by_string, sig: "vii"},
        //{func: pesapi_open_scope, sig: "ii"},
        {func: pesapi_open_scope_placement, sig: "iii"},
        {func: pesapi_has_caught, sig: "ii"},
        {func: pesapi_get_exception_as_string, sig: "iii"},
        //{func: pesapi_close_scope, sig: "vi"},
        {func: pesapi_close_scope_placement, sig: "vi"},
        {func: pesapi_create_value_ref, sig: "iiii"},
        {func: pesapi_release_value_ref, sig: "vi"},
        {func: pesapi_get_value_from_ref, sig: "viii"},
        {func: pesapi_get_property, sig: "viiii"},
        {func: pesapi_set_property, sig: "viiii"},
        {func: pesapi_get_private, sig: "iiii"},
        {func: pesapi_set_private, sig: "iiii"},
        {func: pesapi_get_property_uint32, sig: "viiii"},
        {func: pesapi_set_property_uint32, sig: "viiii"},
        {func: pesapi_call_function, sig: "viiiiii"},
        {func: pesapi_eval, sig: "viiiii"},
        {func: pesapi_global, sig: "ii"},
        {func: pesapi_set_env_private, sig: "vii"}
    ];
    */
    return {
        GetWebGLFFIApi: GetWebGLFFIApi,
        GetWebGLPapiVersion: GetWebGLPapiVersion,
        CreateWebGLPapiEnvRef: CreateWebGLPapiEnvRef,
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
        }, (0, getFromJSArgument_1.default)(engine), (0, getFromJSReturn_1.default)(engine), (0, setToInvokeJSArgument_1.default)(engine), (0, setToJSInvokeReturn_1.default)(engine), (0, setToJSOutArgument_1.default)(engine), (0, register_1.default)(engine), (0, pesapiImpl_1.WebGLFFIApi)(engine), {
            // bridgeLog: true,
            GetLibVersion: function () {
                return 35;
            },
            GetApiLevel: function () {
                return 35;
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
                try {
                    if (!library_1.global.eval) {
                        throw new Error("eval is not supported");
                    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVlcnRzLXJ1bnRpbWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGlCQUFpQixHQUFHLGdCQUFnQjtBQUM3WjtBQUNBO0FBQ0EsMkJBQTJCLE1BQU0sMkJBQTJCLE1BQU07QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixrQkFBa0IsNkJBQTZCLE1BQU07QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsa0JBQWtCLGFBQWEsY0FBYyxTQUFTLFFBQVEsVUFBVSxNQUFNO0FBQ3JHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsS0FBSyxTQUFTLEtBQUssVUFBVSxNQUFNO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsaURBQWlEO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLG01QkFBbTVCO0FBQ242QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLHFCQUFNLDJEQUEyRDtBQUN6RSxRQUFRLHFCQUFNO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLHFCQUFNO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQyxRQUFRO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRDtBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwRUFBMEU7QUFDMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwRUFBMEU7QUFDMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwRUFBMEU7QUFDMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDLFFBQVE7QUFDckQ7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyRUFBMkU7QUFDM0UscUdBQXFHO0FBQ3JHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMERBQTBELGFBQWE7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQyxNQUFNLEVBQUUsVUFBVTtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsTUFBTSxFQUFFLFVBQVU7QUFDekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDLE1BQU0sRUFBRSxVQUFVO0FBQ3pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxNQUFNLEVBQUUsVUFBVTtBQUN6RDtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsTUFBTSxFQUFFLFFBQVEsRUFBRSxZQUFZO0FBQzVFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixPQUFPO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbURBQW1ELE1BQU07QUFDekQ7QUFDQSxnQkFBZ0IsaUJBQWlCO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtGQUFrRjtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYiw2Q0FBNkM7QUFDN0MseURBQXlEO0FBQ3pELG9EQUFvRDtBQUNwRCxpREFBaUQ7QUFDakQsNkNBQTZDO0FBQzdDO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGlDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2J1ZmZlci5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbGlicmFyeS5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL2dldEZyb21KU0FyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvZ2V0RnJvbUpTUmV0dXJuLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvcmVnaXN0ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0ludm9rZUpTQXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0pTSW52b2tlUmV0dXJuLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9KU091dEFyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9wZXNhcGlJbXBsLmpzIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qXHJcbiogVGVuY2VudCBpcyBwbGVhc2VkIHRvIHN1cHBvcnQgdGhlIG9wZW4gc291cmNlIGNvbW11bml0eSBieSBtYWtpbmcgUHVlcnRzIGF2YWlsYWJsZS5cclxuKiBDb3B5cmlnaHQgKEMpIDIwMjAgVEhMIEEyOSBMaW1pdGVkLCBhIFRlbmNlbnQgY29tcGFueS4gIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiogUHVlcnRzIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0QgMy1DbGF1c2UgTGljZW5zZSwgZXhjZXB0IGZvciB0aGUgdGhpcmQtcGFydHkgY29tcG9uZW50cyBsaXN0ZWQgaW4gdGhlIGZpbGUgJ0xJQ0VOU0UnIHdoaWNoIG1heSBiZSBzdWJqZWN0IHRvIHRoZWlyIGNvcnJlc3BvbmRpbmcgbGljZW5zZSB0ZXJtcy5cclxuKiBUaGlzIGZpbGUgaXMgc3ViamVjdCB0byB0aGUgdGVybXMgYW5kIGNvbmRpdGlvbnMgZGVmaW5lZCBpbiBmaWxlICdMSUNFTlNFJywgd2hpY2ggaXMgcGFydCBvZiB0aGlzIHNvdXJjZSBjb2RlIHBhY2thZ2UuXHJcbiovXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy53cml0ZURvdWJsZSA9IGV4cG9ydHMud3JpdGVGbG9hdCA9IGV4cG9ydHMud3JpdGVVSW50NjQgPSBleHBvcnRzLndyaXRlSW50NjQgPSBleHBvcnRzLndyaXRlVUludDMyID0gZXhwb3J0cy53cml0ZUludDMyID0gZXhwb3J0cy53cml0ZVVJbnQxNiA9IGV4cG9ydHMud3JpdGVJbnQxNiA9IGV4cG9ydHMud3JpdGVVSW50OCA9IGV4cG9ydHMud3JpdGVJbnQ4ID0gZXhwb3J0cy5yZWFkRG91YmxlID0gZXhwb3J0cy5yZWFkRmxvYXQgPSBleHBvcnRzLnJlYWRVSW50NjQgPSBleHBvcnRzLnJlYWRJbnQ2NCA9IGV4cG9ydHMucmVhZFVJbnQzMiA9IGV4cG9ydHMucmVhZEludDMyID0gZXhwb3J0cy5yZWFkVUludDE2ID0gZXhwb3J0cy5yZWFkSW50MTYgPSBleHBvcnRzLnJlYWRVSW50OCA9IGV4cG9ydHMucmVhZEludDggPSB2b2lkIDA7XHJcbmZ1bmN0aW9uIHZhbGlkYXRlTnVtYmVyKHZhbHVlLCB0eXBlKSB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0eXBlfSBleHBlY3RzIGEgbnVtYmVyIGJ1dCBnb3QgJHt2YWx1ZX1gKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBib3VuZHNFcnJvcih2YWx1ZSwgbGVuZ3RoLCB0eXBlKSB7XHJcbiAgICBpZiAoTWF0aC5mbG9vcih2YWx1ZSkgIT09IHZhbHVlKSB7XHJcbiAgICAgICAgdmFsaWRhdGVOdW1iZXIodmFsdWUsIHR5cGUgfHwgJ29mZnNldCcpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0eXBlIHx8ICdvZmZzZXQnfSBleHBlY3RzIGFuIGludGVnZXIgYnV0IGdvdCAke3ZhbHVlfWApO1xyXG4gICAgfVxyXG4gICAgaWYgKGxlbmd0aCA8IDApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvdXQgb2YgYm91bmRcIik7XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZSB8fCAnb2Zmc2V0J30gZXhwZWN0cyA+PSAke3R5cGUgPyAxIDogMH0gYW5kIDw9ICR7bGVuZ3RofSBidXQgZ290ICR7dmFsdWV9YCk7XHJcbn1cclxuZnVuY3Rpb24gY2hlY2tCb3VuZHMoYnVmLCBvZmZzZXQsIGJ5dGVMZW5ndGgpIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgaWYgKGJ1ZltvZmZzZXRdID09PSB1bmRlZmluZWQgfHwgYnVmW29mZnNldCArIGJ5dGVMZW5ndGhdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1Zi5sZW5ndGggLSAoYnl0ZUxlbmd0aCArIDEpKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiB3cml0ZVVfSW50OChidWYsIHZhbHVlLCBvZmZzZXQsIG1pbiwgbWF4KSB7XHJcbiAgICB2YWx1ZSA9ICt2YWx1ZTtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB2YWx1ZSBleHBlY3RzID49ICR7bWlufSBhbmQgPD0gJHttYXh9IGJ1dCBnb3QgJHt2YWx1ZX1gKTtcclxuICAgIH1cclxuICAgIGlmIChidWZbb2Zmc2V0XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWYubGVuZ3RoIC0gMSk7XHJcbiAgICB9XHJcbiAgICBidWZbb2Zmc2V0XSA9IHZhbHVlO1xyXG4gICAgcmV0dXJuIG9mZnNldCArIDE7XHJcbn1cclxuZnVuY3Rpb24gcmVhZEludDgoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCB2YWwgPSBidWZmW29mZnNldF07XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsIHwgKHZhbCAmIDIgKiogNykgKiAweDFmZmZmZmU7XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50OCA9IHJlYWRJbnQ4O1xyXG5mdW5jdGlvbiB3cml0ZUludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0ID0gMCkge1xyXG4gICAgcmV0dXJuIHdyaXRlVV9JbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCwgLTB4ODAsIDB4N2YpO1xyXG59XHJcbmV4cG9ydHMud3JpdGVJbnQ4ID0gd3JpdGVJbnQ4O1xyXG5mdW5jdGlvbiByZWFkVUludDgoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCB2YWwgPSBidWZmW29mZnNldF07XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQ4ID0gcmVhZFVJbnQ4O1xyXG5mdW5jdGlvbiB3cml0ZVVJbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCA9IDApIHtcclxuICAgIHJldHVybiB3cml0ZVVfSW50OChidWYsIHZhbHVlLCBvZmZzZXQsIDAsIDB4ZmYpO1xyXG59XHJcbmV4cG9ydHMud3JpdGVVSW50OCA9IHdyaXRlVUludDg7XHJcbmNvbnN0IGludDE2QXJyYXkgPSBuZXcgSW50MTZBcnJheSgxKTtcclxuY29uc3QgdUludDhJbnQ2QXJyYXkgPSBuZXcgVWludDhBcnJheShpbnQxNkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRJbnQxNihidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgMV07XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMik7XHJcbiAgICB9XHJcbiAgICB1SW50OEludDZBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdUludDhJbnQ2QXJyYXlbMV0gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGludDE2QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50MTYgPSByZWFkSW50MTY7XHJcbmZ1bmN0aW9uIHdyaXRlSW50MTYoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAxKTtcclxuICAgIGludDE2QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4SW50NkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEludDZBcnJheVsxXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZUludDE2ID0gd3JpdGVJbnQxNjtcclxuY29uc3QgdWludDE2QXJyYXkgPSBuZXcgVWludDE2QXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4VWludDE2QXJyYXkgPSBuZXcgVWludDhBcnJheSh1aW50MTZBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkVUludDE2KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAxXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSAyKTtcclxuICAgIH1cclxuICAgIHVpbnQ4VWludDE2QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4VWludDE2QXJyYXlbMV0gPSBsYXN0O1xyXG4gICAgcmV0dXJuIHVpbnQxNkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQxNiA9IHJlYWRVSW50MTY7XHJcbmZ1bmN0aW9uIHdyaXRlVUludDE2KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMSk7XHJcbiAgICB1aW50MTZBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MTZBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MTZBcnJheVsxXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZVVJbnQxNiA9IHdyaXRlVUludDE2O1xyXG5jb25zdCBpbnQzMkFycmF5ID0gbmV3IEludDMyQXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4SW50MzJBcnJheSA9IG5ldyBVaW50OEFycmF5KGludDMyQXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZEludDMyKGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAzXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA0KTtcclxuICAgIH1cclxuICAgIHVpbnQ4SW50MzJBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhJbnQzMkFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEludDMyQXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4SW50MzJBcnJheVszXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gaW50MzJBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRJbnQzMiA9IHJlYWRJbnQzMjtcclxuZnVuY3Rpb24gd3JpdGVJbnQzMihidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDMpO1xyXG4gICAgaW50MzJBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhJbnQzMkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEludDMyQXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4SW50MzJBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhJbnQzMkFycmF5WzNdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlSW50MzIgPSB3cml0ZUludDMyO1xyXG5jb25zdCB1aW50MzJBcnJheSA9IG5ldyBVaW50MzJBcnJheSgxKTtcclxuY29uc3QgdWludDhVaW50MzJBcnJheSA9IG5ldyBVaW50OEFycmF5KHVpbnQzMkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRVSW50MzIoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDNdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDQpO1xyXG4gICAgfVxyXG4gICAgdWludDhVaW50MzJBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhVaW50MzJBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhVaW50MzJBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhVaW50MzJBcnJheVszXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gdWludDMyQXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkVUludDMyID0gcmVhZFVJbnQzMjtcclxuZnVuY3Rpb24gd3JpdGVVSW50MzIoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAzKTtcclxuICAgIHVpbnQzMkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OFVpbnQzMkFycmF5WzNdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlVUludDMyID0gd3JpdGVVSW50MzI7XHJcbmNvbnN0IGZsb2F0MzJBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoMSk7XHJcbmNvbnN0IHVJbnQ4RmxvYXQzMkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoZmxvYXQzMkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRGbG9hdChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgM107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gNCk7XHJcbiAgICB9XHJcbiAgICB1SW50OEZsb2F0MzJBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdUludDhGbG9hdDMyQXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQzMkFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0MzJBcnJheVszXSA9IGxhc3Q7XHJcbiAgICByZXR1cm4gZmxvYXQzMkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZEZsb2F0ID0gcmVhZEZsb2F0O1xyXG5mdW5jdGlvbiB3cml0ZUZsb2F0KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMyk7XHJcbiAgICBmbG9hdDMyQXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQzMkFycmF5WzBdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0MzJBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDMyQXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQzMkFycmF5WzNdO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlRmxvYXQgPSB3cml0ZUZsb2F0O1xyXG5jb25zdCBmbG9hdDY0QXJyYXkgPSBuZXcgRmxvYXQ2NEFycmF5KDEpO1xyXG5jb25zdCB1SW50OEZsb2F0NjRBcnJheSA9IG5ldyBVaW50OEFycmF5KGZsb2F0NjRBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkRG91YmxlKGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgN107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gOCk7XHJcbiAgICB9XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVszXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbNF0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzVdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVs2XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbN10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGZsb2F0NjRBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWREb3VibGUgPSByZWFkRG91YmxlO1xyXG5mdW5jdGlvbiB3cml0ZURvdWJsZShidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDcpO1xyXG4gICAgZmxvYXQ2NEFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVszXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbNF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzVdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVs2XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbN107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVEb3VibGUgPSB3cml0ZURvdWJsZTtcclxuY29uc3QgYmlnSW50NjRBcnJheSA9IG5ldyBCaWdJbnQ2NEFycmF5KDEpO1xyXG5jb25zdCB1aW50OEJpZ0ludDY0QXJyYXkgPSBuZXcgVWludDhBcnJheShiaWdJbnQ2NEFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRJbnQ2NChidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDddO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDgpO1xyXG4gICAgfVxyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzNdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbNF0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVs1XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzZdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbN10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGJpZ0ludDY0QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50NjQgPSByZWFkSW50NjQ7XHJcbmZ1bmN0aW9uIHdyaXRlSW50NjQoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSB0eXBlb2YgdmFsID09PSAnbnVtYmVyJyA/IEJpZ0ludCh2YWwpIDogdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCA3KTtcclxuICAgIGJpZ0ludDY0QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVszXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzRdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbNV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVs2XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzddO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlSW50NjQgPSB3cml0ZUludDY0O1xyXG5jb25zdCBiaWdVaW50NjRBcnJheSA9IG5ldyBCaWdVaW50NjRBcnJheSgxKTtcclxuY29uc3QgdWludDhCaWdVaW50NjRBcnJheSA9IG5ldyBVaW50OEFycmF5KGJpZ1VpbnQ2NEFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRVSW50NjQoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyA3XTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA4KTtcclxuICAgIH1cclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbM10gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbNF0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbNV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbNl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnVWludDY0QXJyYXlbN10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGJpZ1VpbnQ2NEFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQ2NCA9IHJlYWRVSW50NjQ7XHJcbmZ1bmN0aW9uIHdyaXRlVUludDY0KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gdHlwZW9mIHZhbCA9PT0gJ251bWJlcicgPyBCaWdJbnQodmFsKSA6IHZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgNyk7XHJcbiAgICBiaWdVaW50NjRBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVszXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs0XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs1XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs2XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdVaW50NjRBcnJheVs3XTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZVVJbnQ2NCA9IHdyaXRlVUludDY0O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1idWZmZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5yZXR1cm5CaWdJbnQgPSBleHBvcnRzLmlzQmlnSW50ID0gZXhwb3J0cy5zZXRPdXRWYWx1ZTggPSBleHBvcnRzLnNldE91dFZhbHVlMzIgPSBleHBvcnRzLm1ha2VCaWdJbnQgPSBleHBvcnRzLkdldFR5cGUgPSBleHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gZXhwb3J0cy5PbkZpbmFsaXplID0gZXhwb3J0cy5jcmVhdGVXZWFrUmVmID0gZXhwb3J0cy5nbG9iYWwgPSBleHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IGV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGV4cG9ydHMuSlNPYmplY3QgPSBleHBvcnRzLkpTRnVuY3Rpb24gPSBleHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IGV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm8gPSB2b2lkIDA7XHJcbi8qKlxyXG4gKiDkuIDmrKHlh73mlbDosIPnlKjnmoRpbmZvXHJcbiAqIOWvueW6lHY4OjpGdW5jdGlvbkNhbGxiYWNrSW5mb1xyXG4gKi9cclxuY2xhc3MgRnVuY3Rpb25DYWxsYmFja0luZm8ge1xyXG4gICAgYXJncztcclxuICAgIHJldHVyblZhbHVlO1xyXG4gICAgc3RhY2sgPSAwO1xyXG4gICAgY29uc3RydWN0b3IoYXJncykge1xyXG4gICAgICAgIHRoaXMuYXJncyA9IGFyZ3M7XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlKCkge1xyXG4gICAgICAgIHRoaXMuc3RhY2sgPSAwO1xyXG4gICAgICAgIHRoaXMuYXJncyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IHZvaWQgMDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gRnVuY3Rpb25DYWxsYmFja0luZm87XHJcbi8vIHN0cnVjdCBNb2NrVjhWYWx1ZVxyXG4vLyB7XHJcbi8vICAgICBpbnQgSlNWYWx1ZVR5cGU7ICAvLyAwXHJcbi8vICAgICBpbnQgRmluYWxWYWx1ZVBvaW50ZXJbMl07IC8vIDEgMiBpZiB2YWx1ZSBpcyBiaWdpbnQgRmluYWxWYWx1ZVBvaW50ZXJbMF0gZm9yIGxvdywgRmluYWxWYWx1ZVBvaW50ZXJbMV0gZm9yIGhpZ2hcclxuLy8gICAgIGludCBleHRyYTsgLy8gM1xyXG4vLyAgICAgaW50IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvOyAvLyA0XHJcbi8vIH07XHJcbmNvbnN0IEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyID0gNDsgLy8gaW50IGNvdW50XHJcbi8qKlxyXG4gKiDmiopGdW5jdGlvbkNhbGxiYWNrSW5mb+S7peWPiuWFtuWPguaVsOi9rOWMluS4umMj5Y+v55So55qEaW50cHRyXHJcbiAqL1xyXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIge1xyXG4gICAgLy8gRnVuY3Rpb25DYWxsYmFja0luZm/nmoTliJfooajvvIzku6XliJfooajnmoRpbmRleOS9nOS4ukludFB0cueahOWAvFxyXG4gICAgaW5mb3MgPSBbbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKFswXSldOyAvLyDov5nph4zljp/mnKzlj6rmmK/kuKrmma7pgJrnmoQwXHJcbiAgICAvLyBGdW5jdGlvbkNhbGxiYWNrSW5mb+eUqOWujOWQju+8jOWwhuWFtuW6j+WPt+aUvuWFpeKAnOWbnuaUtuWIl+ihqOKAne+8jOS4i+asoeWwseiDvee7p+e7reacjeeUqOivpWluZGV477yM6ICM5LiN5b+F6K6paW5mb3PmlbDnu4Tml6DpmZDmianlsZXkuIvljrtcclxuICAgIGZyZWVJbmZvc0luZGV4ID0gW107XHJcbiAgICBmcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGggPSB7fTtcclxuICAgIGZyZWVSZWZNZW1vcnkgPSBbXTtcclxuICAgIGVuZ2luZTtcclxuICAgIGNvbnN0cnVjdG9yKGVuZ2luZSkge1xyXG4gICAgICAgIHRoaXMuZW5naW5lID0gZW5naW5lO1xyXG4gICAgfVxyXG4gICAgYWxsb2NDYWxsYmFja0luZm9NZW1vcnkoYXJnc0xlbmd0aCkge1xyXG4gICAgICAgIGNvbnN0IGNhY2hlQXJyYXkgPSB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXTtcclxuICAgICAgICBpZiAoY2FjaGVBcnJheSAmJiBjYWNoZUFycmF5Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVBcnJheS5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVuZ2luZS51bml0eUFwaS5fbWFsbG9jKChhcmdzTGVuZ3RoICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgKyAxKSA8PCAyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhbGxvY1JlZk1lbW9yeSgpIHtcclxuICAgICAgICBpZiAodGhpcy5mcmVlUmVmTWVtb3J5Lmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnJlZVJlZk1lbW9yeS5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbmdpbmUudW5pdHlBcGkuX21hbGxvYyhBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiA8PCAyKTtcclxuICAgIH1cclxuICAgIHJlY3ljbGVSZWZNZW1vcnkoYnVmZmVyUHRyKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZnJlZVJlZk1lbW9yeS5sZW5ndGggPiAyMCkge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5fZnJlZShidWZmZXJQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5mcmVlUmVmTWVtb3J5LnB1c2goYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KGJ1ZmZlclB0ciwgYXJncykge1xyXG4gICAgICAgIGNvbnN0IGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICBpZiAoIXRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdICYmIGFyZ3NMZW5ndGggPCA1KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGNhY2hlQXJyYXkgPSB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXTtcclxuICAgICAgICBpZiAoIWNhY2hlQXJyYXkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBidWZmZXJQdHJJbjMyID0gYnVmZmVyUHRyIDw8IDI7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzTGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3NbaV0gaW5zdGFuY2VvZiBBcnJheSAmJiBhcmdzW2ldLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlY3ljbGVSZWZNZW1vcnkodGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW2J1ZmZlclB0ckluMzIgKyBpICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgKyAxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g5ouN6ISR6KKL5a6a55qE5pyA5aSn57yT5a2Y5Liq5pWw5aSn5bCP44CCIDUwIC0g5Y+C5pWw5Liq5pWwICogMTBcclxuICAgICAgICBpZiAoY2FjaGVBcnJheS5sZW5ndGggPiAoNTAgLSBhcmdzTGVuZ3RoICogMTApKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9mcmVlKGJ1ZmZlclB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjYWNoZUFycmF5LnB1c2goYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIGludHB0cueahOagvOW8j+S4umlk5bem56e75Zub5L2NXHJcbiAgICAgKlxyXG4gICAgICog5Y+z5L6n5Zub5L2N77yM5piv5Li65LqG5Zyo5Y+z5Zub5L2N5a2Y5YKo5Y+C5pWw55qE5bqP5Y+377yM6L+Z5qC35Y+v5Lul55So5LqO6KGo56S6Y2FsbGJhY2tpbmZv5Y+C5pWw55qEaW50cHRyXHJcbiAgICAgKi9cclxuICAgIC8vIHN0YXRpYyBHZXRNb2NrUG9pbnRlcihhcmdzOiBhbnlbXSk6IE1vY2tJbnRQdHIge1xyXG4gICAgLy8gICAgIGxldCBpbmRleDogbnVtYmVyO1xyXG4gICAgLy8gICAgIGluZGV4ID0gdGhpcy5mcmVlSW5mb3NJbmRleC5wb3AoKTtcclxuICAgIC8vICAgICAvLyBpbmRleOacgOWwj+S4ujFcclxuICAgIC8vICAgICBpZiAoaW5kZXgpIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5pbmZvc1tpbmRleF0uYXJncyA9IGFyZ3M7XHJcbiAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2gobmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKGFyZ3MpKSAtIDE7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIHJldHVybiBpbmRleCA8PCA0O1xyXG4gICAgLy8gfVxyXG4gICAgR2V0TW9ja1BvaW50ZXIoYXJncykge1xyXG4gICAgICAgIGNvbnN0IGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICBsZXQgYnVmZmVyUHRySW44ID0gdGhpcy5hbGxvY0NhbGxiYWNrSW5mb01lbW9yeShhcmdzTGVuZ3RoKTtcclxuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLmZyZWVJbmZvc0luZGV4LnBvcCgpO1xyXG4gICAgICAgIGxldCBmdW5jdGlvbkNhbGxiYWNrSW5mbztcclxuICAgICAgICAvLyBpbmRleOacgOWwj+S4ujFcclxuICAgICAgICBpZiAoaW5kZXgpIHtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gdGhpcy5pbmZvc1tpbmRleF0pLmFyZ3MgPSBhcmdzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2goZnVuY3Rpb25DYWxsYmFja0luZm8gPSBuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oYXJncykpIC0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHVuaXR5QXBpID0gdGhpcy5lbmdpbmUudW5pdHlBcGk7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyUHRySW4zMiA9IGJ1ZmZlclB0ckluOCA+PiAyO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVAzMltidWZmZXJQdHJJbjMyXSA9IGluZGV4O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJnc0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBhcmcgPSBhcmdzW2ldO1xyXG4gICAgICAgICAgICAvLyBpbml0IGVhY2ggdmFsdWVcclxuICAgICAgICAgICAgY29uc3QganNWYWx1ZVR5cGUgPSBHZXRUeXBlKHRoaXMuZW5naW5lLCBhcmcpO1xyXG4gICAgICAgICAgICBjb25zdCBqc1ZhbHVlUHRyID0gYnVmZmVyUHRySW4zMiArIGkgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDE7XHJcbiAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyXSA9IGpzVmFsdWVUeXBlOyAvLyBqc3ZhbHVldHlwZVxyXG4gICAgICAgICAgICBpZiAoanNWYWx1ZVR5cGUgPT0gMiB8fCBqc1ZhbHVlVHlwZSA9PSA0IHx8IGpzVmFsdWVUeXBlID09IDUxMikge1xyXG4gICAgICAgICAgICAgICAgLy8gYmlnaW5044CBbnVtYmVyIG9yIGRhdGVcclxuICAgICAgICAgICAgICAgICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKHRoaXMuZW5naW5lLCBhcmcsIGpzVmFsdWVUeXBlLCBqc1ZhbHVlUHRyICsgMSk7IC8vIHZhbHVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoanNWYWx1ZVR5cGUgPT0gOCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZ1bmN0aW9uQ2FsbGJhY2tJbmZvLnN0YWNrID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbkNhbGxiYWNrSW5mby5zdGFjayA9IHVuaXR5QXBpLnN0YWNrU2F2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIChqc1ZhbHVlUHRyICsgMikgPDwgMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoanNWYWx1ZVR5cGUgPT0gNjQgJiYgYXJnIGluc3RhbmNlb2YgQXJyYXkgJiYgYXJnLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBtYXliZSBhIHJlZlxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIDApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmUHRySW44ID0gdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAyXSA9IHRoaXMuYWxsb2NSZWZNZW1vcnkoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlZlB0ciA9IHJlZlB0ckluOCA+PiAyO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmVmFsdWVUeXBlID0gdW5pdHlBcGkuSEVBUDMyW3JlZlB0cl0gPSBHZXRUeXBlKHRoaXMuZW5naW5lLCBhcmdbMF0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlZlZhbHVlVHlwZSA9PSAyIHx8IHJlZlZhbHVlVHlwZSA9PSA0IHx8IHJlZlZhbHVlVHlwZSA9PSA1MTIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBudW1iZXIgb3IgZGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKHRoaXMuZW5naW5lLCBhcmdbMF0sIHJlZlZhbHVlVHlwZSwgcmVmUHRyICsgMSk7IC8vIHZhbHVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbcmVmUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmdbMF0sIHJlZlZhbHVlVHlwZSwgKHJlZlB0ciArIDIpIDw8IDIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW3JlZlB0ciArIDNdID0gYnVmZmVyUHRySW44OyAvLyBhIHBvaW50ZXIgdG8gdGhlIGluZm9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIG90aGVyXHJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwgKGpzVmFsdWVQdHIgKyAyKSA8PCAyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDNdID0gYnVmZmVyUHRySW44OyAvLyBhIHBvaW50ZXIgdG8gdGhlIGluZm9cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlclB0ckluODtcclxuICAgIH1cclxuICAgIC8vIHN0YXRpYyBHZXRCeU1vY2tQb2ludGVyKGludHB0cjogTW9ja0ludFB0cik6IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvIHtcclxuICAgIC8vICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbnRwdHIgPj4gNF07XHJcbiAgICAvLyB9XHJcbiAgICBHZXRCeU1vY2tQb2ludGVyKHB0ckluOCkge1xyXG4gICAgICAgIGNvbnN0IHB0ckluMzIgPSBwdHJJbjggPj4gMjtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXTtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICB9XHJcbiAgICBHZXRSZXR1cm5WYWx1ZUFuZFJlY3ljbGUocHRySW44KSB7XHJcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xyXG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICAgICAgbGV0IHJldCA9IGluZm8ucmV0dXJuVmFsdWU7XHJcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KHB0ckluOCwgaW5mby5hcmdzKTtcclxuICAgICAgICBpZiAoaW5mby5zdGFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5zdGFja1Jlc3RvcmUoaW5mby5zdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluZm8ucmVjeWNsZSgpO1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIFJlbGVhc2VCeU1vY2tJbnRQdHIocHRySW44KSB7XHJcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xyXG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KHB0ckluOCwgaW5mby5hcmdzKTtcclxuICAgICAgICBpZiAoaW5mby5zdGFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5zdGFja1Jlc3RvcmUoaW5mby5zdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluZm8ucmVjeWNsZSgpO1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICB9XHJcbiAgICBHZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlUHRySW44KSB7XHJcbiAgICAgICAgbGV0IGhlYXAzMiA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMjtcclxuICAgICAgICBjb25zdCBpbmZvUHRySW44ID0gaGVhcDMyWyh2YWx1ZVB0ckluOCA+PiAyKSArIDNdO1xyXG4gICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb0luZGV4ID0gaGVhcDMyW2luZm9QdHJJbjggPj4gMl07XHJcbiAgICAgICAgY29uc3QgYXJnc0luZGV4ID0gKHZhbHVlUHRySW44IC0gaW5mb1B0ckluOCAtIDQpIC8gKDQgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mb3NbY2FsbGJhY2tJbmZvSW5kZXhdLmFyZ3NbYXJnc0luZGV4XTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcclxuLyoqXHJcbiAqIOS7o+ihqOS4gOS4qkpTRnVuY3Rpb25cclxuICovXHJcbmNsYXNzIEpTRnVuY3Rpb24ge1xyXG4gICAgX2Z1bmM7XHJcbiAgICBpZDtcclxuICAgIGFyZ3MgPSBbXTtcclxuICAgIGxhc3RFeGNlcHRpb24gPSBudWxsO1xyXG4gICAgY29uc3RydWN0b3IoaWQsIGZ1bmMpIHtcclxuICAgICAgICB0aGlzLl9mdW5jID0gZnVuYztcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICB9XHJcbiAgICBpbnZva2UoKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbLi4udGhpcy5hcmdzXTtcclxuICAgICAgICB0aGlzLmFyZ3MubGVuZ3RoID0gMDtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkpTRnVuY3Rpb24gPSBKU0Z1bmN0aW9uO1xyXG4vKipcclxuICog5Luj6KGo5LiA5LiqSlNPYmplY3RcclxuICovXHJcbmNsYXNzIEpTT2JqZWN0IHtcclxuICAgIF9vYmo7XHJcbiAgICBpZDtcclxuICAgIGNvbnN0cnVjdG9yKGlkLCBvYmopIHtcclxuICAgICAgICB0aGlzLl9vYmogPSBvYmo7XHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgfVxyXG4gICAgZ2V0T2JqZWN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9vYmo7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5KU09iamVjdCA9IEpTT2JqZWN0O1xyXG5jbGFzcyBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5IHtcclxuICAgIHN0YXRpYyByZWd1bGFySUQgPSAxO1xyXG4gICAgc3RhdGljIGZyZWVJRCA9IFtdO1xyXG4gICAgc3RhdGljIGlkTWFwID0gbmV3IFdlYWtNYXAoKTtcclxuICAgIHN0YXRpYyBqc0Z1bmNPck9iamVjdEtWID0ge307XHJcbiAgICBzdGF0aWMgZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmNWYWx1ZSkge1xyXG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KGZ1bmNWYWx1ZSk7XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5mcmVlSUQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlkID0gdGhpcy5mcmVlSUQucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGZ1bmMgPSBuZXcgSlNGdW5jdGlvbihpZCwgZnVuY1ZhbHVlKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLnNldChmdW5jVmFsdWUsIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdID0gZnVuYztcclxuICAgICAgICByZXR1cm4gZnVuYztcclxuICAgIH1cclxuICAgIHN0YXRpYyBnZXRPckNyZWF0ZUpTT2JqZWN0KG9iaikge1xyXG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KG9iaik7XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5mcmVlSUQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlkID0gdGhpcy5mcmVlSUQucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGpzT2JqZWN0ID0gbmV3IEpTT2JqZWN0KGlkLCBvYmopO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuc2V0KG9iaiwgaWQpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBqc09iamVjdDtcclxuICAgICAgICByZXR1cm4ganNPYmplY3Q7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZ2V0SlNPYmplY3RCeUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcmVtb3ZlSlNPYmplY3RCeUlkKGlkKSB7XHJcbiAgICAgICAgY29uc3QganNPYmplY3QgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIGlmICghanNPYmplY3QpXHJcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ3JlbW92ZUpTT2JqZWN0QnlJZCBmYWlsZWQ6IGlkIGlzIGludmFsaWQ6ICcgKyBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNPYmplY3QuZ2V0T2JqZWN0KCkpO1xyXG4gICAgICAgIGRlbGV0ZSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIHRoaXMuZnJlZUlELnB1c2goaWQpO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGdldEpTRnVuY3Rpb25CeUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcmVtb3ZlSlNGdW5jdGlvbkJ5SWQoaWQpIHtcclxuICAgICAgICBjb25zdCBqc0Z1bmMgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIGlmICghanNGdW5jKVxyXG4gICAgICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKCdyZW1vdmVKU0Z1bmN0aW9uQnlJZCBmYWlsZWQ6IGlkIGlzIGludmFsaWQ6ICcgKyBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNGdW5jLl9mdW5jKTtcclxuICAgICAgICBkZWxldGUganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICB0aGlzLmZyZWVJRC5wdXNoKGlkKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5O1xyXG4vKipcclxuICogQ1NoYXJw5a+56LGh6K6w5b2V6KGo77yM6K6w5b2V5omA5pyJQ1NoYXJw5a+56LGh5bm25YiG6YWNaWRcclxuICog5ZKMcHVlcnRzLmRsbOaJgOWBmueahOS4gOagt1xyXG4gKi9cclxuY2xhc3MgQ1NoYXJwT2JqZWN0TWFwIHtcclxuICAgIGNsYXNzZXMgPSBbbnVsbF07XHJcbiAgICBuYXRpdmVPYmplY3RLViA9IG5ldyBNYXAoKTtcclxuICAgIC8vIHByaXZhdGUgbmF0aXZlT2JqZWN0S1Y6IHsgW29iamVjdElEOiBDU0lkZW50aWZpZXJdOiBXZWFrUmVmPGFueT4gfSA9IHt9O1xyXG4gICAgLy8gcHJpdmF0ZSBjc0lEV2Vha01hcDogV2Vha01hcDxhbnksIENTSWRlbnRpZmllcj4gPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgbmFtZXNUb0NsYXNzZXNJRCA9IHt9O1xyXG4gICAgY2xhc3NJRFdlYWtNYXAgPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYWRkQ2FsbGVkJywgdGhpcy5hZGRDYWxsZWQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVtb3ZlQ2FsbGVkJywgdGhpcy5yZW1vdmVDYWxsZWQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnd3InLCB0aGlzLm5hdGl2ZU9iamVjdEtWLnNpemUpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgfVxyXG4gICAgX21lbW9yeURlYnVnID0gZmFsc2U7XHJcbiAgICBhZGRDYWxsZWQgPSAwO1xyXG4gICAgcmVtb3ZlQ2FsbGVkID0gMDtcclxuICAgIGFkZChjc0lELCBvYmopIHtcclxuICAgICAgICB0aGlzLl9tZW1vcnlEZWJ1ZyAmJiB0aGlzLmFkZENhbGxlZCsrO1xyXG4gICAgICAgIC8vIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF0gPSBjcmVhdGVXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgLy8gdGhpcy5jc0lEV2Vha01hcC5zZXQob2JqLCBjc0lEKTtcclxuICAgICAgICB0aGlzLm5hdGl2ZU9iamVjdEtWLnNldChjc0lELCBjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgIG9ialsnJGNzaWQnXSA9IGNzSUQ7XHJcbiAgICB9XHJcbiAgICByZW1vdmUoY3NJRCkge1xyXG4gICAgICAgIHRoaXMuX21lbW9yeURlYnVnICYmIHRoaXMucmVtb3ZlQ2FsbGVkKys7XHJcbiAgICAgICAgLy8gZGVsZXRlIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF07XHJcbiAgICAgICAgdGhpcy5uYXRpdmVPYmplY3RLVi5kZWxldGUoY3NJRCk7XHJcbiAgICB9XHJcbiAgICBmaW5kT3JBZGRPYmplY3QoY3NJRCwgY2xhc3NJRCkge1xyXG4gICAgICAgIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWLmdldChjc0lEKTtcclxuICAgICAgICAvLyBsZXQgcmV0ID0gdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXTtcclxuICAgICAgICBpZiAocmV0ICYmIChyZXQgPSByZXQuZGVyZWYoKSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0ID0gdGhpcy5jbGFzc2VzW2NsYXNzSURdLmNyZWF0ZUZyb21DUyhjc0lEKTtcclxuICAgICAgICAvLyB0aGlzLmFkZChjc0lELCByZXQpOyDmnoTpgKDlh73mlbDph4zotJ/otKPosIPnlKhcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gICAgZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChvYmopIHtcclxuICAgICAgICAvLyByZXR1cm4gdGhpcy5jc0lEV2Vha01hcC5nZXQob2JqKTtcclxuICAgICAgICByZXR1cm4gb2JqID8gb2JqLiRjc2lkIDogMDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IENTaGFycE9iamVjdE1hcDtcclxuO1xyXG52YXIgZGVzdHJ1Y3RvcnMgPSB7fTtcclxuZXhwb3J0cy5nbG9iYWwgPSBnbG9iYWwgPSBnbG9iYWwgfHwgZ2xvYmFsVGhpcyB8fCB3aW5kb3c7XHJcbmdsb2JhbC5nbG9iYWwgPSBnbG9iYWw7XHJcbmNvbnN0IGNyZWF0ZVdlYWtSZWYgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHR5cGVvZiBXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBXWFdlYWtSZWYgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIldlYWtSZWYgaXMgbm90IGRlZmluZWQuIG1heWJlIHlvdSBzaG91bGQgdXNlIG5ld2VyIGVudmlyb25tZW50XCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGVyZWYoKSB7IHJldHVybiBvYmo7IH0gfTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwidXNpbmcgV1hXZWFrUmVmXCIpO1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgV1hXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXZWFrUmVmKG9iaik7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5leHBvcnRzLmNyZWF0ZVdlYWtSZWYgPSBjcmVhdGVXZWFrUmVmO1xyXG5jbGFzcyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2sge1xyXG4gICAgX2hhbmRsZXI7XHJcbiAgICByZWZzID0gW107XHJcbiAgICBoZWxkcyA9IFtdO1xyXG4gICAgYXZhaWxhYmxlSW5kZXggPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yKGhhbmRsZXIpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oXCJGaW5hbGl6YXRpb25SZWdpc3RlciBpcyBub3QgZGVmaW5lZC4gdXNpbmcgRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrXCIpO1xyXG4gICAgICAgIGdsb2JhbC5fcHVlcnRzX3JlZ2lzdHJ5ID0gdGhpcztcclxuICAgICAgICB0aGlzLl9oYW5kbGVyID0gaGFuZGxlcjtcclxuICAgIH1cclxuICAgIHJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYXZhaWxhYmxlSW5kZXgubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5hdmFpbGFibGVJbmRleC5wb3AoKTtcclxuICAgICAgICAgICAgdGhpcy5yZWZzW2luZGV4XSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcclxuICAgICAgICAgICAgdGhpcy5oZWxkc1tpbmRleF0gPSBoZWxkVmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlZnMucHVzaChjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgICAgICB0aGlzLmhlbGRzLnB1c2goaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOa4hemZpOWPr+iDveW3sue7j+WkseaViOeahFdlYWtSZWZcclxuICAgICAqL1xyXG4gICAgaXRlcmF0ZVBvc2l0aW9uID0gMDtcclxuICAgIGNsZWFudXAocGFydCA9IDEpIHtcclxuICAgICAgICBjb25zdCBzdGVwQ291bnQgPSB0aGlzLnJlZnMubGVuZ3RoIC8gcGFydDtcclxuICAgICAgICBsZXQgaSA9IHRoaXMuaXRlcmF0ZVBvc2l0aW9uO1xyXG4gICAgICAgIGZvciAobGV0IGN1cnJlbnRTdGVwID0gMDsgaSA8IHRoaXMucmVmcy5sZW5ndGggJiYgY3VycmVudFN0ZXAgPCBzdGVwQ291bnQ7IGkgPSAoaSA9PSB0aGlzLnJlZnMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMSksIGN1cnJlbnRTdGVwKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVmc1tpXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVmc1tpXS5kZXJlZigpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDnm67liY3msqHmnInlhoXlrZjmlbTnkIbog73lipvvvIzlpoLmnpzmuLjmiI/kuK3mnJ9yZWblvojlpJrkvYblkI7mnJ/lsJHkuobvvIzov5nph4zlsLHkvJrnmb3otLnpgY3ljobmrKHmlbBcclxuICAgICAgICAgICAgICAgIC8vIOS9humBjeWOhuS5n+WPquaYr+S4gOWPpT095ZKMY29udGludWXvvIzmtarotLnlvbHlk43kuI3lpKdcclxuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlSW5kZXgucHVzaChpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVmc1tpXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZXIodGhpcy5oZWxkc1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pdGVyYXRlUG9zaXRpb24gPSBpO1xyXG4gICAgfVxyXG59XHJcbnZhciByZWdpc3RyeSA9IG51bGw7XHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICByZWdpc3RyeSA9IG5ldyAodHlwZW9mIEZpbmFsaXphdGlvblJlZ2lzdHJ5ID09ICd1bmRlZmluZWQnID8gRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrIDogRmluYWxpemF0aW9uUmVnaXN0cnkpKGZ1bmN0aW9uIChoZWxkVmFsdWUpIHtcclxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xyXG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IGZpbmQgZGVzdHJ1Y3RvciBmb3IgXCIgKyBoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoLS1jYWxsYmFjay5yZWYgPT0gMCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXTtcclxuICAgICAgICAgICAgY2FsbGJhY2soaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBPbkZpbmFsaXplKG9iaiwgaGVsZFZhbHVlLCBjYWxsYmFjaykge1xyXG4gICAgaWYgKCFyZWdpc3RyeSkge1xyXG4gICAgICAgIGluaXQoKTtcclxuICAgIH1cclxuICAgIGxldCBvcmlnaW5DYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XHJcbiAgICBpZiAob3JpZ2luQ2FsbGJhY2spIHtcclxuICAgICAgICAvLyBXZWFrUmVm5YaF5a656YeK5pS+5pe25py65Y+v6IO95q+UZmluYWxpemF0aW9uUmVnaXN0cnnnmoTop6blj5Hmm7Tml6nvvIzliY3pnaLlpoLmnpzlj5HnjrB3ZWFrUmVm5Li656m65Lya6YeN5paw5Yib5bu65a+56LGhXHJcbiAgICAgICAgLy8g5L2G5LmL5YmN5a+56LGh55qEZmluYWxpemF0aW9uUmVnaXN0cnnmnIDnu4jlj4jogq/lrprkvJrop6blj5HjgIJcclxuICAgICAgICAvLyDmiYDku6XlpoLmnpzpgYfliLDov5nkuKrmg4XlhrXvvIzpnIDopoHnu5lkZXN0cnVjdG9y5Yqg6K6h5pWwXHJcbiAgICAgICAgKytvcmlnaW5DYWxsYmFjay5yZWY7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsYmFjay5yZWYgPSAxO1xyXG4gICAgICAgIGRlc3RydWN0b3JzW2hlbGRWYWx1ZV0gPSBjYWxsYmFjaztcclxuICAgIH1cclxuICAgIHJlZ2lzdHJ5LnJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKTtcclxufVxyXG5leHBvcnRzLk9uRmluYWxpemUgPSBPbkZpbmFsaXplO1xyXG5jbGFzcyBQdWVydHNKU0VuZ2luZSB7XHJcbiAgICBjc2hhcnBPYmplY3RNYXA7XHJcbiAgICBmdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXI7XHJcbiAgICB1bml0eUFwaTtcclxuICAgIC8qKiDlrZfnrKbkuLLnvJPlrZjvvIzpu5jorqTkuLoyNTblrZfoioIgKi9cclxuICAgIHN0ckJ1ZmZlcjtcclxuICAgIHN0cmluZ0J1ZmZlclNpemUgPSAyNTY7XHJcbiAgICBsYXN0UmV0dXJuQ1NSZXN1bHQgPSBudWxsO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICAvLyDov5nkuKTkuKrmmK9QdWVydHPnlKjnmoTnmoTnnJ/mraPnmoRDU2hhcnDlh73mlbDmjIfpkohcclxuICAgIEdldEpTQXJndW1lbnRzQ2FsbGJhY2s7XHJcbiAgICBnZW5lcmFsRGVzdHJ1Y3RvcjtcclxuICAgIGNvbnN0cnVjdG9yKGN0b3JQYXJhbSkge1xyXG4gICAgICAgIHRoaXMuY3NoYXJwT2JqZWN0TWFwID0gbmV3IENTaGFycE9iamVjdE1hcCgpO1xyXG4gICAgICAgIHRoaXMuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyID0gbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcih0aGlzKTtcclxuICAgICAgICBjb25zdCB7IFVURjhUb1N0cmluZywgVVRGMTZUb1N0cmluZywgX21hbGxvYywgX2ZyZWUsIF9zZXRUZW1wUmV0MCwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHN0cmluZ1RvVVRGMTYsIGxlbmd0aEJ5dGVzVVRGMTYsIHN0YWNrU2F2ZSwgc3RhY2tSZXN0b3JlLCBzdGFja0FsbG9jLCBnZXRXYXNtVGFibGVFbnRyeSwgYWRkRnVuY3Rpb24sIHJlbW92ZUZ1bmN0aW9uLCBfQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2ssIF9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjaywgX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssIEluamVjdFBhcGlHTE5hdGl2ZUltcGwsIFBBcGlDYWxsYmFja1dpdGhTY29wZSwgUEFwaUNvbnN0cnVjdG9yV2l0aFNjb3BlLCBmaW5kX2NsYXNzX2J5X2lkLCBsb2FkX2NsYXNzX2J5X2lkLCBnZXRfY2xhc3NfbmFtZSwgZ2V0X2NsYXNzX2luaXRpYWxpemUsIGdldF9jbGFzc19maW5hbGl6ZSwgZ2V0X2NsYXNzX3R5cGVfaWQsIGdldF9jbGFzc19zdXBlcl90eXBlX2lkLCBnZXRfY2xhc3NfbWV0aG9kcywgZ2V0X2NsYXNzX2Z1bmN0aW9ucywgZ2V0X2NsYXNzX3Byb3BlcnRpZXMsIGdldF9jbGFzc192YXJpYWJsZXMsIGdldF9uZXh0X3Byb3BlcnR5X2luZm8sIGdldF9uZXh0X2Z1bmN0aW9uX2luZm8sIGdldF9wcm9wZXJ0eV9pbmZvX25hbWUsIGdldF9wcm9wZXJ0eV9pbmZvX2dldHRlciwgZ2V0X3Byb3BlcnR5X2luZm9fc2V0dGVyLCBnZXRfZnVuY3Rpb25faW5mb19uYW1lLCBnZXRfZnVuY3Rpb25faW5mb19jYWxsYmFjaywgZ2V0X2NsYXNzX2RhdGEsIGdldF9wcm9wZXJ0eV9pbmZvX2dldHRlcl9kYXRhLCBnZXRfcHJvcGVydHlfaW5mb19zZXR0ZXJfZGF0YSwgZ2V0X2Z1bmN0aW9uX2luZm9fZGF0YSwgSEVBUDgsIEhFQVBVOCwgSEVBUDMyLCBIRUFQRjMyLCBIRUFQRjY0LCB9ID0gY3RvclBhcmFtO1xyXG4gICAgICAgIHRoaXMuc3RyQnVmZmVyID0gX21hbGxvYyh0aGlzLnN0cmluZ0J1ZmZlclNpemUpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkgPSB7XHJcbiAgICAgICAgICAgIFVURjhUb1N0cmluZyxcclxuICAgICAgICAgICAgVVRGMTZUb1N0cmluZyxcclxuICAgICAgICAgICAgX21hbGxvYyxcclxuICAgICAgICAgICAgX2ZyZWUsXHJcbiAgICAgICAgICAgIF9zZXRUZW1wUmV0MCxcclxuICAgICAgICAgICAgc3RyaW5nVG9VVEY4LFxyXG4gICAgICAgICAgICBsZW5ndGhCeXRlc1VURjgsXHJcbiAgICAgICAgICAgIHN0cmluZ1RvVVRGMTYsXHJcbiAgICAgICAgICAgIGxlbmd0aEJ5dGVzVVRGMTYsXHJcbiAgICAgICAgICAgIHN0YWNrU2F2ZSxcclxuICAgICAgICAgICAgc3RhY2tSZXN0b3JlLFxyXG4gICAgICAgICAgICBzdGFja0FsbG9jLFxyXG4gICAgICAgICAgICBnZXRXYXNtVGFibGVFbnRyeSxcclxuICAgICAgICAgICAgYWRkRnVuY3Rpb24sXHJcbiAgICAgICAgICAgIHJlbW92ZUZ1bmN0aW9uLFxyXG4gICAgICAgICAgICBfQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIF9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayxcclxuICAgICAgICAgICAgX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIEluamVjdFBhcGlHTE5hdGl2ZUltcGwsXHJcbiAgICAgICAgICAgIFBBcGlDYWxsYmFja1dpdGhTY29wZSxcclxuICAgICAgICAgICAgUEFwaUNvbnN0cnVjdG9yV2l0aFNjb3BlLFxyXG4gICAgICAgICAgICBmaW5kX2NsYXNzX2J5X2lkLFxyXG4gICAgICAgICAgICBsb2FkX2NsYXNzX2J5X2lkLFxyXG4gICAgICAgICAgICBnZXRfY2xhc3NfbmFtZSxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX2luaXRpYWxpemUsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc19maW5hbGl6ZSxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX3R5cGVfaWQsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc19zdXBlcl90eXBlX2lkLFxyXG4gICAgICAgICAgICBnZXRfY2xhc3NfbWV0aG9kcyxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX2Z1bmN0aW9ucyxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX3Byb3BlcnRpZXMsXHJcbiAgICAgICAgICAgIGdldF9jbGFzc192YXJpYWJsZXMsXHJcbiAgICAgICAgICAgIGdldF9uZXh0X3Byb3BlcnR5X2luZm8sXHJcbiAgICAgICAgICAgIGdldF9uZXh0X2Z1bmN0aW9uX2luZm8sXHJcbiAgICAgICAgICAgIGdldF9wcm9wZXJ0eV9pbmZvX25hbWUsXHJcbiAgICAgICAgICAgIGdldF9wcm9wZXJ0eV9pbmZvX2dldHRlcixcclxuICAgICAgICAgICAgZ2V0X3Byb3BlcnR5X2luZm9fc2V0dGVyLFxyXG4gICAgICAgICAgICBnZXRfZnVuY3Rpb25faW5mb19uYW1lLFxyXG4gICAgICAgICAgICBnZXRfZnVuY3Rpb25faW5mb19jYWxsYmFjayxcclxuICAgICAgICAgICAgZ2V0X2NsYXNzX2RhdGEsXHJcbiAgICAgICAgICAgIGdldF9wcm9wZXJ0eV9pbmZvX2dldHRlcl9kYXRhLFxyXG4gICAgICAgICAgICBnZXRfcHJvcGVydHlfaW5mb19zZXR0ZXJfZGF0YSxcclxuICAgICAgICAgICAgZ2V0X2Z1bmN0aW9uX2luZm9fZGF0YSxcclxuICAgICAgICAgICAgSEVBUDgsXHJcbiAgICAgICAgICAgIEhFQVBVOCxcclxuICAgICAgICAgICAgSEVBUDMyLFxyXG4gICAgICAgICAgICBIRUFQRjMyLFxyXG4gICAgICAgICAgICBIRUFQRjY0LFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZ2xvYmFsLl9fdGdqc0V2YWxTY3JpcHQgPSB0eXBlb2YgZXZhbCA9PSBcInVuZGVmaW5lZFwiID8gKCkgPT4geyB9IDogZXZhbDtcclxuICAgICAgICBnbG9iYWwuX190Z2pzU2V0UHJvbWlzZVJlamVjdENhbGxiYWNrID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHd4Lm9uVW5oYW5kbGVkUmVqZWN0aW9uKGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5oYW5kbGVkcmVqZWN0aW9uXCIsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZ2xvYmFsLl9fcHVlcnRzR2V0TGFzdEV4Y2VwdGlvbiA9ICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFzdEV4Y2VwdGlvbjtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgLyoqIGNhbGwgd2hlbiB3YXNtIGdyb3cgbWVtb3J5ICovXHJcbiAgICB1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3cyhIRUFQOCwgSEVBUFU4LCBIRUFQMzIsIEhFQVBGMzIsIEhFQVBGNjQpIHtcclxuICAgICAgICBsZXQgdW5pdHlBcGkgPSB0aGlzLnVuaXR5QXBpO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVA4ID0gSEVBUDg7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUFU4ID0gSEVBUFU4O1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVAzMiA9IEhFQVAzMjtcclxuICAgICAgICB1bml0eUFwaS5IRUFQRjMyID0gSEVBUEYzMjtcclxuICAgICAgICB1bml0eUFwaS5IRUFQRjY0ID0gSEVBUEY2NDtcclxuICAgIH1cclxuICAgIG1lbWNweShkZXN0LCBzcmMsIG51bSkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuSEVBUFU4LmNvcHlXaXRoaW4oZGVzdCwgc3JjLCBzcmMgKyBudW0pO1xyXG4gICAgfVxyXG4gICAgSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgLyoqIG91dCBpbnQgKi8gbGVuZ3RoT2Zmc2V0KSB7XHJcbiAgICAgICAgaWYgKHJldHVyblN0ciA9PT0gbnVsbCB8fCByZXR1cm5TdHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGJ5dGVDb3VudCA9IHRoaXMudW5pdHlBcGkubGVuZ3RoQnl0ZXNVVEY4KHJldHVyblN0cik7XHJcbiAgICAgICAgc2V0T3V0VmFsdWUzMih0aGlzLCBsZW5ndGhPZmZzZXQsIGJ5dGVDb3VudCk7XHJcbiAgICAgICAgbGV0IGJ1ZmZlciA9IHRoaXMudW5pdHlBcGkuX21hbGxvYyhieXRlQ291bnQgKyAxKTtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLnN0cmluZ1RvVVRGOChyZXR1cm5TdHIsIGJ1ZmZlciwgYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgIH1cclxuICAgIEpTU3RyaW5nVG9UZW1wQ1NTdHJpbmcocmV0dXJuU3RyLCAvKiogb3V0IGludCAqLyBsZW5ndGhPZmZzZXQpIHtcclxuICAgICAgICBpZiAocmV0dXJuU3RyID09PSBudWxsIHx8IHJldHVyblN0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnl0ZUNvdW50ID0gdGhpcy51bml0eUFwaS5sZW5ndGhCeXRlc1VURjgocmV0dXJuU3RyKTtcclxuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aE9mZnNldCwgYnl0ZUNvdW50KTtcclxuICAgICAgICBpZiAodGhpcy5zdHJpbmdCdWZmZXJTaXplIDwgYnl0ZUNvdW50ICsgMSkge1xyXG4gICAgICAgICAgICB0aGlzLnVuaXR5QXBpLl9mcmVlKHRoaXMuc3RyQnVmZmVyKTtcclxuICAgICAgICAgICAgdGhpcy5zdHJCdWZmZXIgPSB0aGlzLnVuaXR5QXBpLl9tYWxsb2ModGhpcy5zdHJpbmdCdWZmZXJTaXplID0gTWF0aC5tYXgoMiAqIHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSwgYnl0ZUNvdW50ICsgMSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVuaXR5QXBpLnN0cmluZ1RvVVRGOChyZXR1cm5TdHIsIHRoaXMuc3RyQnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHJCdWZmZXI7XHJcbiAgICB9XHJcbiAgICBKU1N0cmluZ1RvQ1NTdHJpbmdPblN0YWNrKHJldHVyblN0ciwgLyoqIG91dCBpbnQgKi8gbGVuZ3RoT2Zmc2V0KSB7XHJcbiAgICAgICAgaWYgKHJldHVyblN0ciA9PT0gbnVsbCB8fCByZXR1cm5TdHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGJ5dGVDb3VudCA9IHRoaXMudW5pdHlBcGkubGVuZ3RoQnl0ZXNVVEY4KHJldHVyblN0cik7XHJcbiAgICAgICAgc2V0T3V0VmFsdWUzMih0aGlzLCBsZW5ndGhPZmZzZXQsIGJ5dGVDb3VudCk7XHJcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMudW5pdHlBcGkuc3RhY2tBbGxvYyhieXRlQ291bnQgKyAxKTtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLnN0cmluZ1RvVVRGOChyZXR1cm5TdHIsIGJ1ZmZlciwgYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgIH1cclxuICAgIG1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGZ1bmN0aW9uUHRyLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIC8vIOS4jeiDveeUqOeureWktOWHveaVsO+8geatpOWkhOi/lOWbnueahOWHveaVsOS8mui1i+WAvOWIsOWFt+S9k+eahGNsYXNz5LiK77yM5YW2dGhpc+aMh+mSiOacieWQq+S5ieOAglxyXG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XHJcbiAgICAgICAgICAgIGlmIChuZXcudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wibm90IGEgY29uc3RydWN0b3InKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgY2FsbGJhY2tJbmZvUHRyID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRNb2NrUG9pbnRlcihhcmdzKTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5jYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgXHJcbiAgICAgICAgICAgICAgICAvLyBnZXRJbnRQdHJNYW5hZ2VyKCkuR2V0UG9pbnRlckZvckpTVmFsdWUodGhpcyksXHJcbiAgICAgICAgICAgICAgICBpc1N0YXRpYyA/IDAgOiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodGhpcyksIGNhbGxiYWNrSW5mb1B0ciwgYXJncy5sZW5ndGgsIGNhbGxiYWNrSWR4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldFJldHVyblZhbHVlQW5kUmVjeWNsZShjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLlJlbGVhc2VCeU1vY2tJbnRQdHIoY2FsbGJhY2tJbmZvUHRyKTtcclxuICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBzZWxmUHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVuaXR5QXBpLl9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxuICAgIGNhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5fQ2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBQdWVydHNKU0VuZ2luZTtcclxuZnVuY3Rpb24gR2V0VHlwZShlbmdpbmUsIHZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG4gICAgaWYgKGlzQmlnSW50KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAyO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHJldHVybiA0O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJldHVybiA4O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuICAgICAgICByZXR1cm4gMTY7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gMjU2O1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xyXG4gICAgICAgIHJldHVybiA1MTI7XHJcbiAgICB9XHJcbiAgICAvLyBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkgeyByZXR1cm4gMTI4IH1cclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgcmV0dXJuIDY0O1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgdmFsdWUgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbiAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICB9XHJcbiAgICBpZiAoZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAzMjtcclxuICAgIH1cclxuICAgIHJldHVybiA2NDtcclxufVxyXG5leHBvcnRzLkdldFR5cGUgPSBHZXRUeXBlO1xyXG5mdW5jdGlvbiBtYWtlQmlnSW50KGxvdywgaGlnaCkge1xyXG4gICAgcmV0dXJuIChCaWdJbnQoaGlnaCkgPDwgMzJuKSB8IEJpZ0ludChsb3cgPj4+IDApO1xyXG59XHJcbmV4cG9ydHMubWFrZUJpZ0ludCA9IG1ha2VCaWdJbnQ7XHJcbmZ1bmN0aW9uIHNldE91dFZhbHVlMzIoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbdmFsdWVQdHIgPj4gMl0gPSB2YWx1ZTtcclxufVxyXG5leHBvcnRzLnNldE91dFZhbHVlMzIgPSBzZXRPdXRWYWx1ZTMyO1xyXG5mdW5jdGlvbiBzZXRPdXRWYWx1ZTgoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOFt2YWx1ZVB0cl0gPSB2YWx1ZTtcclxufVxyXG5leHBvcnRzLnNldE91dFZhbHVlOCA9IHNldE91dFZhbHVlODtcclxuZnVuY3Rpb24gaXNCaWdJbnQodmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIEJpZ0ludCB8fCB0eXBlb2YgdmFsdWUgPT09ICdiaWdpbnQnO1xyXG59XHJcbmV4cG9ydHMuaXNCaWdJbnQgPSBpc0JpZ0ludDtcclxuZnVuY3Rpb24gcmV0dXJuQmlnSW50KGVuZ2luZSwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5fc2V0VGVtcFJldDAoTnVtYmVyKHZhbHVlID4+IDMybikpOyAvLyBoaWdoXHJcbiAgICByZXR1cm4gTnVtYmVyKHZhbHVlICYgMHhmZmZmZmZmZm4pOyAvLyBsb3dcclxufVxyXG5leHBvcnRzLnJldHVybkJpZ0ludCA9IHJldHVybkJpZ0ludDtcclxuZnVuY3Rpb24gd3JpdGVCaWdJbnQoZW5naW5lLCBwdHJJbjMyLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXSA9IE51bWJlcih2YWx1ZSAmIDB4ZmZmZmZmZmZuKTsgLy8gbG93XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzIgKyAxXSA9IE51bWJlcih2YWx1ZSA+PiAzMm4pOyAvLyBoaWdoXHJcbn1cclxuY29uc3QgdG1wSW50M0FyciA9IG5ldyBJbnQzMkFycmF5KDIpO1xyXG5jb25zdCB0bXBGbG9hdDY0QXJyID0gbmV3IEZsb2F0NjRBcnJheSh0bXBJbnQzQXJyLmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHdyaXRlTnVtYmVyKGVuZ2luZSwgcHRySW4zMiwgdmFsdWUpIHtcclxuICAgIC8vIG51bWJlciBpbiBqcyBpcyBkb3VibGVcclxuICAgIHRtcEZsb2F0NjRBcnJbMF0gPSB2YWx1ZTtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMl0gPSB0bXBJbnQzQXJyWzBdO1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyICsgMV0gPSB0bXBJbnQzQXJyWzFdO1xyXG59XHJcbmZ1bmN0aW9uICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKGVuZ2luZSwgdmFsLCBqc1ZhbHVlVHlwZSwgdmFsUHRySW4zMikge1xyXG4gICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHN3aXRjaCAoanNWYWx1ZVR5cGUpIHtcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgIHdyaXRlQmlnSW50KGVuZ2luZSwgdmFsUHRySW4zMiwgdmFsKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA0OlxyXG4gICAgICAgICAgICB3cml0ZU51bWJlcihlbmdpbmUsIHZhbFB0ckluMzIsICt2YWwpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDUxMjpcclxuICAgICAgICAgICAgd3JpdGVOdW1iZXIoZW5naW5lLCB2YWxQdHJJbjMyLCB2YWwuZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gJEdldEFyZ3VtZW50RmluYWxWYWx1ZShlbmdpbmUsIHZhbCwganNWYWx1ZVR5cGUsIGxlbmd0aE9mZnNldCkge1xyXG4gICAgaWYgKCFqc1ZhbHVlVHlwZSlcclxuICAgICAgICBqc1ZhbHVlVHlwZSA9IEdldFR5cGUoZW5naW5lLCB2YWwpO1xyXG4gICAgc3dpdGNoIChqc1ZhbHVlVHlwZSkge1xyXG4gICAgICAgIGNhc2UgODogcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmdPblN0YWNrKHZhbCwgbGVuZ3RoT2Zmc2V0KTtcclxuICAgICAgICBjYXNlIDE2OiByZXR1cm4gK3ZhbDtcclxuICAgICAgICBjYXNlIDMyOiByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHZhbCk7XHJcbiAgICAgICAgY2FzZSA2NDogcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdCh2YWwpLmlkO1xyXG4gICAgICAgIGNhc2UgMTI4OiByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KHZhbCkuaWQ7XHJcbiAgICAgICAgY2FzZSAyNTY6IHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbih2YWwpLmlkO1xyXG4gICAgICAgIGNhc2UgMTAyNDoge1xyXG4gICAgICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpXHJcbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgVWludDhBcnJheSh2YWwpO1xyXG4gICAgICAgICAgICBsZXQgcHRyID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2ModmFsLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUFU4LnNldCh2YWwsIHB0cik7XHJcbiAgICAgICAgICAgIHNldE91dFZhbHVlMzIoZW5naW5lLCBsZW5ndGhPZmZzZXQsIHZhbC5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHB0cjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGlicmFyeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldE51bWJlckZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogbnVtYmVyIHtcclxuLy8gICAgIHJldHVybiBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXREYXRlRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBudW1iZXIge1xyXG4vLyAgICAgcmV0dXJuIChlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpIGFzIERhdGUpLmdldFRpbWUoKTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0U3RyaW5nRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIC8qb3V0IGludCAqL2xlbmd0aE9mZnNldDogbnVtYmVyLCBpc0J5UmVmOiBib29sKTogbnVtYmVyIHtcclxuLy8gICAgIHZhciByZXR1cm5TdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8c3RyaW5nPih2YWx1ZSk7XHJcbi8vICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhyZXR1cm5TdHIsIGxlbmd0aE9mZnNldCk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEJvb2xlYW5Gcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IGJvb2xlYW4ge1xyXG4vLyAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIFZhbHVlSXNCaWdJbnQoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IGJvb2xlYW4ge1xyXG4vLyAgICAgdmFyIGJpZ2ludCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxhbnk+KHZhbHVlKTtcclxuLy8gICAgIHJldHVybiBiaWdpbnQgaW5zdGFuY2VvZiBCaWdJbnQ7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEJpZ0ludEZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XHJcbi8vICAgICB2YXIgYmlnaW50ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPGFueT4odmFsdWUpO1xyXG4vLyAgICAgcmV0dXJuIGJpZ2ludDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0T2JqZWN0RnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcclxuLy8gICAgIHZhciBuYXRpdmVPYmplY3QgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4vLyAgICAgcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChuYXRpdmVPYmplY3QpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRGdW5jdGlvbkZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogSlNGdW5jdGlvblB0ciB7XHJcbi8vICAgICB2YXIgZnVuYyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjwoLi4uYXJnczogYW55W10pID0+IGFueT4odmFsdWUpO1xyXG4vLyAgICAgdmFyIGpzZnVuYyA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmMpO1xyXG4vLyAgICAgcmV0dXJuIGpzZnVuYy5pZDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0SlNPYmplY3RGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4vLyAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjwoLi4uYXJnczogYW55W10pID0+IGFueT4odmFsdWUpO1xyXG4vLyAgICAgdmFyIGpzb2JqID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KG9iaik7XHJcbi8vICAgICByZXR1cm4ganNvYmouaWQ7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEFycmF5QnVmZmVyRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIC8qb3V0IGludCAqL2xlbmd0aE9mZnNldDogYW55LCBpc091dDogYm9vbCkge1xyXG4vLyAgICAgdmFyIGFiID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPEFycmF5QnVmZmVyPih2YWx1ZSk7XHJcbi8vICAgICBpZiAoYWIgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbi8vICAgICAgICAgYWIgPSBhYi5idWZmZXI7XHJcbi8vICAgICB9XHJcbi8vICAgICB2YXIgcHRyID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoYWIuYnl0ZUxlbmd0aCk7XHJcbi8vICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDguc2V0KG5ldyBJbnQ4QXJyYXkoYWIpLCBwdHIpO1xyXG4vLyAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltsZW5ndGhPZmZzZXQgPj4gMl0gPSBhYi5ieXRlTGVuZ3RoO1xyXG4vLyAgICAgc2V0T3V0VmFsdWUzMihlbmdpbmUsIGxlbmd0aE9mZnNldCwgYWIuYnl0ZUxlbmd0aCk7XHJcbi8vICAgICByZXR1cm4gcHRyO1xyXG4vLyB9XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPkvqfojrflj5ZKU+iwg+eUqOWPguaVsOeahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgLyoqKioqKioqKioq6L+Z6YOo5YiG546w5Zyo6YO95pivQysr5a6e546w55qEKioqKioqKioqKioqL1xyXG4gICAgICAgIC8vIEdldE51bWJlckZyb21WYWx1ZTogR2V0TnVtYmVyRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXREYXRlRnJvbVZhbHVlOiBHZXREYXRlRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRTdHJpbmdGcm9tVmFsdWU6IEdldFN0cmluZ0Zyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0Qm9vbGVhbkZyb21WYWx1ZTogR2V0Qm9vbGVhbkZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gVmFsdWVJc0JpZ0ludDogVmFsdWVJc0JpZ0ludC5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0QmlnSW50RnJvbVZhbHVlOiBHZXRCaWdJbnRGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldE9iamVjdEZyb21WYWx1ZTogR2V0T2JqZWN0RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRGdW5jdGlvbkZyb21WYWx1ZTogR2V0RnVuY3Rpb25Gcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEpTT2JqZWN0RnJvbVZhbHVlOiBHZXRKU09iamVjdEZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWU6IEdldEFycmF5QnVmZmVyRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRBcmd1bWVudFR5cGU6IGZ1bmN0aW9uIChpc29sYXRlOiBJbnRQdHIsIGluZm86IE1vY2tJbnRQdHIsIGluZGV4OiBpbnQsIGlzQnlSZWY6IGJvb2wpIHtcclxuICAgICAgICAvLyAgICAgdmFyIHZhbHVlID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbywgZW5naW5lKS5hcmdzW2luZGV4XTtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIEdldFR5cGUoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgLy8gfSxcclxuICAgICAgICAvLyAvKipcclxuICAgICAgICAvLyAgKiDkuLpjI+S+p+aPkOS+m+S4gOS4quiOt+WPlmNhbGxiYWNraW5mb+mHjGpzdmFsdWXnmoRpbnRwdHLnmoTmjqXlj6NcclxuICAgICAgICAvLyAgKiDlubbkuI3mmK/lvpfnmoTliLDov5nkuKphcmd1bWVudOeahOWAvFxyXG4gICAgICAgIC8vICAqXHJcbiAgICAgICAgLy8gICog6K+l5o6l5Y+j5Y+q5pyJ5L2N6L+Q566X77yM55SxQysr5a6e546wXHJcbiAgICAgICAgLy8gICovXHJcbiAgICAgICAgLy8gR2V0QXJndW1lbnRWYWx1ZS8qaW5DYWxsYmFja0luZm8qLzogZnVuY3Rpb24gKGluZm9wdHI6IE1vY2tJbnRQdHIsIGluZGV4OiBpbnQpIHtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIGluZm9wdHIgfCBpbmRleDtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIC8vIEdldEpzVmFsdWVUeXBlOiBmdW5jdGlvbiAoaXNvbGF0ZTogSW50UHRyLCB2YWw6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcclxuICAgICAgICAvLyAgICAgLy8gcHVibGljIGVudW0gSnNWYWx1ZVR5cGVcclxuICAgICAgICAvLyAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICAvLyAgICAgTnVsbE9yVW5kZWZpbmVkID0gMSxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEJpZ0ludCA9IDIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBOdW1iZXIgPSA0LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgU3RyaW5nID0gOCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEJvb2xlYW4gPSAxNixcclxuICAgICAgICAvLyAgICAgLy8gICAgIE5hdGl2ZU9iamVjdCA9IDMyLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgSnNPYmplY3QgPSA2NCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEFycmF5ID0gMTI4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgRnVuY3Rpb24gPSAyNTYsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBEYXRlID0gNTEyLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQXJyYXlCdWZmZXIgPSAxMDI0LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgVW5rbm93ID0gMjA0OCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEFueSA9IE51bGxPclVuZGVmaW5lZCB8IEJpZ0ludCB8IE51bWJlciB8IFN0cmluZyB8IEJvb2xlYW4gfCBOYXRpdmVPYmplY3QgfCBBcnJheSB8IEZ1bmN0aW9uIHwgRGF0ZSB8IEFycmF5QnVmZmVyLFxyXG4gICAgICAgIC8vICAgICAvLyB9O1xyXG4gICAgICAgIC8vICAgICB2YXIgdmFsdWU6IGFueSA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbCwgZW5naW5lKTtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIEdldFR5cGUoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgLy8gfSxcclxuICAgICAgICAvKioqKioqKioqKirku6XkuIrnjrDlnKjpg73mmK9DKyvlrp7njrDnmoQqKioqKioqKioqKiovXHJcbiAgICAgICAgR2V0VHlwZUlkRnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIGlmIChpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICBvYmogPSBvYmpbMF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHR5cGVpZCA9IDA7XHJcbiAgICAgICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gb2JqLl9mdW5jW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IG9ialtcIiRjaWRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0eXBlaWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVpZDtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2V0RnJvbUpTQXJndW1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBDI+iwg+eUqEpT5pe277yM6I635Y+WSlPlh73mlbDov5Tlm57lgLxcclxuICpcclxuICog5Y6f5pyJ55qEcmVzdWx0SW5mb+iuvuiuoeWHuuadpeWPquaYr+S4uuS6huiuqeWkmmlzb2xhdGXml7bog73lnKjkuI3lkIznmoRpc29sYXRl6YeM5L+d5oyB5LiN5ZCM55qEcmVzdWx0XHJcbiAqIOWcqFdlYkdM5qih5byP5LiL5rKh5pyJ6L+Z5Liq54Om5oG877yM5Zug5q2k55u05o6l55SoZW5naW5l55qE5Y2z5Y+vXHJcbiAqIHJlc3VsdEluZm/lm7rlrprkuLoxMDI0XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgR2V0TnVtYmVyRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXREYXRlRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQuZ2V0VGltZSgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0U3RyaW5nRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvVGVtcENTU3RyaW5nKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQsIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRCb29sZWFuRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXN1bHRJc0JpZ0ludDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuaXNCaWdJbnQpKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0QmlnSW50RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgLy8gcHVlcnRzIGNvcmUgdjIuMC405byA5aeL5pSv5oyBXHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgbGlicmFyeV8xLnJldHVybkJpZ0ludCkoZW5naW5lLCBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldE9iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRUeXBlSWRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgICAgICB2YXIgdHlwZWlkID0gMDtcclxuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IHZhbHVlLl9mdW5jW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IHZhbHVlW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZmluZCB0eXBlaWQgZm9yJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0RnVuY3Rpb25Gcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0SlNPYmplY3RGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIganNvYmogPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgICAgICByZXR1cm4ganNvYmouaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRBcnJheUJ1ZmZlckZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvLCAvKm91dCBpbnQgKi8gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBhYiA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4LnNldChuZXcgSW50OEFycmF5KGFiKSwgcHRyKTtcclxuICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5zZXRPdXRWYWx1ZTMyKShlbmdpbmUsIGxlbmd0aCwgYWIuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBwdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvL+S/neWuiOaWueahiFxyXG4gICAgICAgIEdldFJlc3VsdFR5cGU6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgbGlicmFyeV8xLkdldFR5cGUpKGVuZ2luZSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2V0RnJvbUpTUmV0dXJuLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICog5rOo5YaM57G7QVBJ77yM5aaC5rOo5YaM5YWo5bGA5Ye95pWw44CB5rOo5YaM57G777yM5Lul5Y+K57G755qE5bGe5oCn5pa55rOV562JXHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFJlZ2lzdGVyQVBJKGVuZ2luZSkge1xyXG4gICAgY29uc3QgcmV0dXJuZWUgPSB7XHJcbiAgICAgICAgU2V0R2xvYmFsRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBuYW1lU3RyaW5nLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIGpzRW52SWR4LCBjYWxsYmFja2lkeCkge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgbGlicmFyeV8xLmdsb2JhbFtuYW1lXSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKHRydWUsIHY4RnVuY3Rpb25DYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX1JlZ2lzdGVyQ2xhc3M6IGZ1bmN0aW9uIChpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIGpzRW52SWR4LCBjYWxsYmFja2lkeCwgc2l6ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBmdWxsTmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoZnVsbE5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICBjb25zdCBjc2hhcnBPYmplY3RNYXAgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwO1xyXG4gICAgICAgICAgICBjb25zdCBpZCA9IGNzaGFycE9iamVjdE1hcC5jbGFzc2VzLmxlbmd0aDtcclxuICAgICAgICAgICAgbGV0IHRlbXBFeHRlcm5hbENTSUQgPSAwO1xyXG4gICAgICAgICAgICBjb25zdCBjdG9yID0gZnVuY3Rpb24gTmF0aXZlT2JqZWN0KCkge1xyXG4gICAgICAgICAgICAgICAgLy8g6K6+572u57G75Z6LSURcclxuICAgICAgICAgICAgICAgIHRoaXNbXCIkY2lkXCJdID0gaWQ7XHJcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmVPYmplY3TnmoTmnoTpgKDlh73mlbBcclxuICAgICAgICAgICAgICAgIC8vIOaehOmAoOWHveaVsOacieS4pOS4quiwg+eUqOeahOWcsOaWue+8mjEuIGpz5L6nbmV35LiA5Liq5a6D55qE5pe25YCZIDIuIGNz5L6n5Yib5bu65LqG5LiA5Liq5a+56LGh6KaB5Lyg5YiwanPkvqfml7ZcclxuICAgICAgICAgICAgICAgIC8vIOesrOS4gOS4quaDheWGte+8jGNz5a+56LGhSUTmiJbogIXmmK9jYWxsVjhDb25zdHJ1Y3RvckNhbGxiYWNr6L+U5Zue55qE44CCXHJcbiAgICAgICAgICAgICAgICAvLyDnrKzkuozkuKrmg4XlhrXvvIzliJljc+WvueixoUlE5pivY3MgbmV35a6M5LmL5ZCO5LiA5bm25Lyg57uZanPnmoTjgIJcclxuICAgICAgICAgICAgICAgIGxldCBjc0lEID0gdGVtcEV4dGVybmFsQ1NJRDsgLy8g5aaC5p6c5piv56ys5LqM5Liq5oOF5Ya177yM5q2kSUTnlLFjcmVhdGVGcm9tQ1Porr7nva5cclxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNzSUQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFja0luZm9QdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOiZveeEtnB1ZXJ0c+WGhUNvbnN0cnVjdG9y55qE6L+U5Zue5YC85Y+rc2VsZu+8jOS9huWug+WFtuWunuWwseaYr0NT5a+56LGh55qE5LiA5LiqaWTogIzlt7LjgIJcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc0lEID0gZW5naW5lLmNhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGNvbnN0cnVjdG9yLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLlJlbGVhc2VCeU1vY2tJbnRQdHIoY2FsbGJhY2tJbmZvUHRyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIGJsaXR0YWJsZVxyXG4gICAgICAgICAgICAgICAgaWYgKHNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY3NOZXdJRCA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKHNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5tZW1jcHkoY3NOZXdJRCwgY3NJRCwgc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc05ld0lELCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzTmV3SUQsIChjc0lkZW50aWZpZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLnJlbW92ZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuX2ZyZWUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5hZGQoY3NJRCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5PbkZpbmFsaXplKSh0aGlzLCBjc0lELCAoY3NJZGVudGlmaWVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5yZW1vdmUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmNhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2soZGVzdHJ1Y3RvciB8fCBlbmdpbmUuZ2VuZXJhbERlc3RydWN0b3IsIGNzSWRlbnRpZmllciwgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjdG9yLmNyZWF0ZUZyb21DUyA9IGZ1bmN0aW9uIChjc0lEKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wRXh0ZXJuYWxDU0lEID0gY3NJRDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY3RvcigpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjdG9yLl9fcHVlcnRzTWV0YWRhdGEgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBcIm5hbWVcIiwgeyB2YWx1ZTogZnVsbE5hbWUgKyBcIkNvbnN0cnVjdG9yXCIgfSk7XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBcIiRjaWRcIiwgeyB2YWx1ZTogaWQgfSk7XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5jbGFzc2VzLnB1c2goY3Rvcik7XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5jbGFzc0lEV2Vha01hcC5zZXQoY3RvciwgaWQpO1xyXG4gICAgICAgICAgICBpZiAoQmFzZVR5cGVJZCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGN0b3IucHJvdG90eXBlLl9fcHJvdG9fXyA9IGNzaGFycE9iamVjdE1hcC5jbGFzc2VzW0Jhc2VUeXBlSWRdLnByb3RvdHlwZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAubmFtZXNUb0NsYXNzZXNJRFtmdWxsTmFtZV0gPSBpZDtcclxuICAgICAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJTdHJ1Y3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIC8qbG9uZyAqLyBqc0VudklkeCwgY2FsbGJhY2tpZHgsIHNpemUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldHVybmVlLl9SZWdpc3RlckNsYXNzKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwgY2FsbGJhY2tpZHgsIGNhbGxiYWNraWR4LCBzaXplKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlZ2lzdGVyRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBjbGFzc0lELCBuYW1lU3RyaW5nLCBpc1N0YXRpYywgY2FsbGJhY2ssIC8qbG9uZyAqLyBqc0VudklkeCwgY2FsbGJhY2tpZHgpIHtcclxuICAgICAgICAgICAgdmFyIGNscyA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcclxuICAgICAgICAgICAgaWYgKCFjbHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgZm4gPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgY2FsbGJhY2ssIGNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgY2xzW25hbWVdID0gZm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjbHMucHJvdG90eXBlW25hbWVdID0gZm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlZ2lzdGVyUHJvcGVydHk6IGZ1bmN0aW9uIChpc29sYXRlLCBjbGFzc0lELCBuYW1lU3RyaW5nLCBpc1N0YXRpYywgZ2V0dGVyLCBcclxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyanNFbnZJZHgsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBnZXR0ZXJjYWxsYmFja2lkeCwgc2V0dGVyLCBcclxuICAgICAgICAvKmxvbmcgKi8gc2V0dGVyanNFbnZJZHgsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJjYWxsYmFja2lkeCwgZG9udERlbGV0ZSkge1xyXG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgICAgICBpZiAoIWNscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgYXR0ciA9IHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogIWRvbnREZWxldGUsXHJcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAoZ2V0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICBhdHRyLmdldCA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBnZXR0ZXIsIGdldHRlcmNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc2V0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICBhdHRyLnNldCA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBzZXR0ZXIsIHNldHRlcmNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbHMsIG5hbWUsIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscy5wcm90b3R5cGUsIG5hbWUsIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbiAgICByZXR1cm4gcmV0dXJuZWU7XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlZ2lzdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogQyPosIPnlKhKU+aXtu+8jOiuvue9ruiwg+eUqOWPguaVsOeahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0ludm9rZUpTQXJndW1lbnRBcGkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC8vYmVnaW4gY3MgY2FsbCBqc1xyXG4gICAgICAgIFB1c2hOdWxsRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobnVsbCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoRGF0ZUZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGRhdGVWYWx1ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobmV3IERhdGUoZGF0ZVZhbHVlKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoQm9vbGVhbkZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGIpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKCEhYik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoQmlnSW50Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypsb25nICovIGxvbmdsb3csIGxvbmdoaWdoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaCgoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvbmdsb3csIGxvbmdoaWdoKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoU3RyaW5nRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgc3RyU3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZykpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaE51bWJlckZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGQpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaE9iamVjdEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGNsYXNzSUQsIG9iamVjdElEKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChvYmplY3RJRCwgY2xhc3NJRCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEpTRnVuY3Rpb25Gb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBKU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChKU0Z1bmN0aW9uKS5fZnVuYyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoSlNPYmplY3RGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBKU09iamVjdCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNPYmplY3RCeUlkKEpTT2JqZWN0KS5nZXRPYmplY3QoKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoQXJyYXlCdWZmZXJGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKmJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9JbnZva2VKU0FyZ3VtZW50QXBpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0ludm9rZUpTQXJndW1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPorr7nva7ov5Tlm57liLBKU+eahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0pTSW52b2tlUmV0dXJuQXBpKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBSZXR1cm5DbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGNsYXNzSUQpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgY2xhc3NJRCwgc2VsZikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChzZWxmLCBjbGFzc0lEKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybk51bWJlcjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBudW1iZXI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5TdHJpbmc6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBzdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5CaWdJbnQ6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBsb25nTG93LCBsb25nSGlnaCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSAoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvbmdMb3csIGxvbmdIaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkJvb2xlYW46IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBiKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9ICEhYjsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkRhdGU6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBkYXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuTnVsbDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8pIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgSlNGdW5jdGlvblB0cikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjb25zdCBqc0Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChKU0Z1bmN0aW9uUHRyKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0ganNGdW5jLl9mdW5jO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuSlNPYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBKU09iamVjdFB0cikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjb25zdCBqc09iamVjdCA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTT2JqZWN0QnlJZChKU09iamVjdFB0cik7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGpzT2JqZWN0LmdldE9iamVjdCgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQ1NoYXJwRnVuY3Rpb25DYWxsYmFjazogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHY4RnVuY3Rpb25DYWxsYmFjaywgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJMb3csIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVySGlnaCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihmYWxzZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBwb2ludGVySGlnaCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5DU2hhcnBGdW5jdGlvbkNhbGxiYWNrMjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHY4RnVuY3Rpb25DYWxsYmFjaywgSnNGdW5jdGlvbkZpbmFsaXplLCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckxvdywgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJIaWdoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGZhbHNlLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIHBvaW50ZXJIaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkFycmF5QnVmZmVyOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgLypieXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9KU0ludm9rZVJldHVybkFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9KU0ludm9rZVJldHVybi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEpT6LCD55SoQyPml7bvvIxDI+S+p+iuvue9rm91dOWPguaVsOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0pTT3V0QXJndW1lbnRBUEkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIFNldE51bWJlclRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBudW1iZXI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXREYXRlVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBkYXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBuZXcgRGF0ZShkYXRlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldFN0cmluZ1RvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgc3RyU3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKTtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IHN0cjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldEJvb2xlYW5Ub091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGIpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9ICEhYjsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldEJpZ0ludFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgbG93LCBoaWdoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9ICgwLCBsaWJyYXJ5XzEubWFrZUJpZ0ludCkobG93LCBoaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldE9iamVjdFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgY2xhc3NJRCwgc2VsZikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qoc2VsZiwgY2xhc3NJRCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXROdWxsVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBudWxsOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0QXJyYXlCdWZmZXJUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIC8qQnl0ZVtdICovIGluZGV4LCBsZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0pTT3V0QXJndW1lbnRBUEk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSlNPdXRBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLldlYkdMRkZJQXBpID0gdm9pZCAwO1xyXG5jb25zdCBCdWZmZXIgPSByZXF1aXJlKFwiLi9idWZmZXJcIik7XHJcbmxldCBsb2FkZXIgPSBudWxsO1xyXG5sZXQgbG9hZGVyUmVzb2x2ZSA9IG51bGw7XHJcbmNvbnN0IGV4ZWN1dGVNb2R1bGVDYWNoZSA9IHt9O1xyXG4vKipcclxuICogU3BhcnNlIEFycmF5IGltcGxlbWVudGF0aW9uIHdpdGggZWZmaWNpZW50IGFkZC9yZW1vdmUgb3BlcmF0aW9uc1xyXG4gKiAtIE1haW50YWlucyBjb250aWd1b3VzIHN0b3JhZ2VcclxuICogLSBSZXVzZXMgZW1wdHkgc2xvdHMgZnJvbSBkZWxldGlvbnNcclxuICogLSBPKDEpIGFkZC9yZW1vdmUgaW4gbW9zdCBjYXNlc1xyXG4gKi9cclxuY2xhc3MgU3BhcnNlQXJyYXkge1xyXG4gICAgX2RhdGE7XHJcbiAgICBfZnJlZUluZGljZXM7XHJcbiAgICBfbGVuZ3RoO1xyXG4gICAgY29uc3RydWN0b3IoY2FwYWNpdHkgPSAwKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IG5ldyBBcnJheShjYXBhY2l0eSk7XHJcbiAgICAgICAgdGhpcy5fZnJlZUluZGljZXMgPSBbXTtcclxuICAgICAgICB0aGlzLl9sZW5ndGggPSAwO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgYW4gZWxlbWVudCB0byB0aGUgYXJyYXlcclxuICAgICAqIEByZXR1cm5zIFRoZSBpbmRleCB3aGVyZSB0aGUgZWxlbWVudCB3YXMgaW5zZXJ0ZWRcclxuICAgICAqL1xyXG4gICAgYWRkKGVsZW1lbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5fZnJlZUluZGljZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuX2ZyZWVJbmRpY2VzLnBvcCgpO1xyXG4gICAgICAgICAgICB0aGlzLl9kYXRhW2luZGV4XSA9IGVsZW1lbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuX2xlbmd0aCsrO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgdGhpcy5fZGF0YS5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgIHRoaXMuX2xlbmd0aCsrO1xyXG4gICAgICAgIHJldHVybiBpbmRleDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGFuIGVsZW1lbnQgYnkgaW5kZXhcclxuICAgICAqIEByZXR1cm5zIHRydWUgaWYgcmVtb3ZhbCB3YXMgc3VjY2Vzc2Z1bFxyXG4gICAgICovXHJcbiAgICByZW1vdmUoaW5kZXgpIHtcclxuICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuX2RhdGEubGVuZ3RoIHx8IHRoaXMuX2RhdGFbaW5kZXhdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9kYXRhW2luZGV4XSA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLl9mcmVlSW5kaWNlcy5wdXNoKGluZGV4KTtcclxuICAgICAgICB0aGlzLl9sZW5ndGgtLTtcclxuICAgICAgICAvLyBDb21wYWN0IHRoZSBhcnJheSBpZiBsYXN0IGVsZW1lbnQgaXMgcmVtb3ZlZFxyXG4gICAgICAgIGlmIChpbmRleCA9PT0gdGhpcy5fZGF0YS5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvbXBhY3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIEdldCBlbGVtZW50IGJ5IGluZGV4XHJcbiAgICAgKi9cclxuICAgIGdldChpbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW2luZGV4XTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQ3VycmVudCBudW1iZXIgb2YgYWN0aXZlIGVsZW1lbnRzXHJcbiAgICAgKi9cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogVG90YWwgY2FwYWNpdHkgKGluY2x1ZGluZyBlbXB0eSBzbG90cylcclxuICAgICAqL1xyXG4gICAgZ2V0IGNhcGFjaXR5KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmxlbmd0aDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQ29tcGFjdCB0aGUgYXJyYXkgYnkgcmVtb3ZpbmcgdHJhaWxpbmcgdW5kZWZpbmVkIGVsZW1lbnRzXHJcbiAgICAgKi9cclxuICAgIF9jb21wYWN0KCkge1xyXG4gICAgICAgIGxldCBsYXN0SW5kZXggPSB0aGlzLl9kYXRhLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgd2hpbGUgKGxhc3RJbmRleCA+PSAwICYmIHRoaXMuX2RhdGFbbGFzdEluZGV4XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGEucG9wKCk7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbnkgZnJlZSBpbmRpY2VzIGluIHRoZSBjb21wYWN0ZWQgYXJlYVxyXG4gICAgICAgICAgICBjb25zdCBjb21wYWN0ZWRJbmRleCA9IHRoaXMuX2ZyZWVJbmRpY2VzLmluZGV4T2YobGFzdEluZGV4KTtcclxuICAgICAgICAgICAgaWYgKGNvbXBhY3RlZEluZGV4ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZnJlZUluZGljZXMuc3BsaWNlKGNvbXBhY3RlZEluZGV4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsYXN0SW5kZXgtLTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gRXhlY3V0ZU1vZHVsZShmaWxlTmFtZSkge1xyXG4gICAgaWYgKFsncHVlcnRzL2xvZy5tanMnLCAncHVlcnRzL3RpbWVyLm1qcyddLmluZGV4T2YoZmlsZU5hbWUpICE9IC0xKSB7XHJcbiAgICAgICAgcmV0dXJuIHt9O1xyXG4gICAgfVxyXG4gICAgaWYgKCFsb2FkZXIpIHtcclxuICAgICAgICBsb2FkZXIgPSBnbG9iYWxUaGlzLnNjcmlwdEVudi5HZXRMb2FkZXIoKTtcclxuICAgICAgICBsb2FkZXJSZXNvbHZlID0gbG9hZGVyLlJlc29sdmUgPyAoZnVuY3Rpb24gKGZpbGVOYW1lLCB0byA9IFwiXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWROYW1lID0gbG9hZGVyLlJlc29sdmUoZmlsZU5hbWUsIHRvKTtcclxuICAgICAgICAgICAgaWYgKCFyZXNvbHZlZE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZWROYW1lO1xyXG4gICAgICAgIH0pIDogbnVsbDtcclxuICAgIH1cclxuICAgIGlmIChsb2FkZXJSZXNvbHZlKSB7XHJcbiAgICAgICAgZmlsZU5hbWUgPSBsb2FkZXJSZXNvbHZlKGZpbGVOYW1lLCBcIlwiKTtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSB3eFJlcXVpcmUoJ3B1ZXJ0c19taW5pZ2FtZV9qc19yZXNvdXJjZXMvJyArIChmaWxlTmFtZS5lbmRzV2l0aCgnLmpzJykgPyBmaWxlTmFtZSA6IGZpbGVOYW1lICsgXCIuanNcIikpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBmdW5jdGlvbiBub3JtYWxpemUobmFtZSwgdG8pIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBDUyAhPSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChDUy5QdWVydHMuUGF0aEhlbHBlci5Jc1JlbGF0aXZlKHRvKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldCA9IENTLlB1ZXJ0cy5QYXRoSGVscGVyLm5vcm1hbGl6ZShDUy5QdWVydHMuUGF0aEhlbHBlci5EaXJuYW1lKG5hbWUpICsgXCIvXCIgKyB0byk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdG87XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1vY2tSZXF1aXJlKHNwZWNpZmllcikge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGV4cG9ydHM6IHt9IH07XHJcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kQ2FjaGVTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgZXhlY3V0ZU1vZHVsZUNhY2hlKTtcclxuICAgICAgICAgICAgaWYgKGZvdW5kQ2FjaGVTcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5leHBvcnRzID0gZXhlY3V0ZU1vZHVsZUNhY2hlW2ZvdW5kQ2FjaGVTcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmRTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgUFVFUlRTX0pTX1JFU09VUkNFUyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtb2R1bGUgbm90IGZvdW5kOiAnICsgc3BlY2lmaWVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNwZWNpZmllciA9IGZvdW5kU3BlY2lmaWVyO1xyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSAtMTtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgUFVFUlRTX0pTX1JFU09VUkNFU1tzcGVjaWZpZXJdKHJlc3VsdC5leHBvcnRzLCBmdW5jdGlvbiBtUmVxdWlyZShzcGVjaWZpZXJUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9ja1JlcXVpcmUobG9hZGVyUmVzb2x2ZSA/IGxvYWRlclJlc29sdmUoc3BlY2lmaWVyVG8sIHNwZWNpZmllcikgOiBub3JtYWxpemUoc3BlY2lmaWVyLCBzcGVjaWZpZXJUbykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSByZXN1bHQuZXhwb3J0cztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LmV4cG9ydHM7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBvYmopIHtcclxuICAgICAgICAgICAgICAgIGxldCB0cnlGaW5kTmFtZSA9IFtzcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5pbmRleE9mKCcuJykgPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5RmluZE5hbWUgPSB0cnlGaW5kTmFtZS5jb25jYXQoW3NwZWNpZmllciArICcuanMnLCBzcGVjaWZpZXIgKyAnLnRzJywgc3BlY2lmaWVyICsgJy5tanMnLCBzcGVjaWZpZXIgKyAnLm10cyddKTtcclxuICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSB0cnlGaW5kTmFtZS5yZWR1Y2UoKHJldCwgbmFtZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmV0ICE9PSBmYWxzZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ialtuYW1lXSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY2lyY3VsYXIgZGVwZW5kZW5jeSBpcyBkZXRlY3RlZCB3aGVuIHJlcXVpcmluZyBcIiR7bmFtZX1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaW5kZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ5RmluZE5hbWVbZmluZGVkXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xyXG4gICAgICAgIHJldHVybiByZXF1aXJlUmV0O1xyXG4gICAgfVxyXG59XHJcbmdsb2JhbFRoaXMuX19wdWVydHNFeGVjdXRlTW9kdWxlID0gRXhlY3V0ZU1vZHVsZTtcclxudmFyIEpTVGFnO1xyXG4oZnVuY3Rpb24gKEpTVGFnKSB7XHJcbiAgICAvKiBhbGwgdGFncyB3aXRoIGEgcmVmZXJlbmNlIGNvdW50IGFyZSBuZWdhdGl2ZSAqL1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfRklSU1RcIl0gPSAtOV0gPSBcIkpTX1RBR19GSVJTVFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfU1RSSU5HXCJdID0gLTldID0gXCJKU19UQUdfU1RSSU5HXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19TVFJJTkcxNlwiXSA9IC04XSA9IFwiSlNfVEFHX1NUUklORzE2XCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19CVUZGRVJcIl0gPSAtN10gPSBcIkpTX1RBR19CVUZGRVJcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0VYQ0VQVElPTlwiXSA9IC02XSA9IFwiSlNfVEFHX0VYQ0VQVElPTlwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfTkFUSVZFX09CSkVDVFwiXSA9IC00XSA9IFwiSlNfVEFHX05BVElWRV9PQkpFQ1RcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0FSUkFZXCJdID0gLTNdID0gXCJKU19UQUdfQVJSQVlcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0ZVTkNUSU9OXCJdID0gLTJdID0gXCJKU19UQUdfRlVOQ1RJT05cIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX09CSkVDVFwiXSA9IC0xXSA9IFwiSlNfVEFHX09CSkVDVFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfSU5UXCJdID0gMF0gPSBcIkpTX1RBR19JTlRcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0JPT0xcIl0gPSAxXSA9IFwiSlNfVEFHX0JPT0xcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX05VTExcIl0gPSAyXSA9IFwiSlNfVEFHX05VTExcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX1VOREVGSU5FRFwiXSA9IDNdID0gXCJKU19UQUdfVU5ERUZJTkVEXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19VTklOSVRJQUxJWkVEXCJdID0gNF0gPSBcIkpTX1RBR19VTklOSVRJQUxJWkVEXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19GTE9BVDY0XCJdID0gNV0gPSBcIkpTX1RBR19GTE9BVDY0XCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19JTlQ2NFwiXSA9IDZdID0gXCJKU19UQUdfSU5UNjRcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX1VJTlQ2NFwiXSA9IDddID0gXCJKU19UQUdfVUlOVDY0XCI7XHJcbn0pKEpTVGFnIHx8IChKU1RhZyA9IHt9KSk7XHJcbmxldCBoYXNFeGNlcHRpb24gPSBmYWxzZTtcclxubGV0IGxhc3RFeGNlcHRpb24gPSB1bmRlZmluZWQ7XHJcbmxldCBsYXN0RXhjZXB0aW9uQnVmZmVyID0gdW5kZWZpbmVkO1xyXG5mdW5jdGlvbiBnZXRFeGNlcHRpb25Bc05hdGl2ZVN0cmluZyh3YXNtQXBpLCB3aXRoX3N0YWNrKSB7XHJcbiAgICBpZiAoaGFzRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgaGFzRXhjZXB0aW9uID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcclxuICAgICAgICBpZiAodHlwZW9mIGxhc3RFeGNlcHRpb24gPT09ICdvYmplY3QnICYmIGxhc3RFeGNlcHRpb24gIT09IG51bGwpIHtcclxuICAgICAgICAgICAgY29uc3QgbXNnID0gbGFzdEV4Y2VwdGlvbi5tZXNzYWdlO1xyXG4gICAgICAgICAgICBjb25zdCBzdGFjayA9IGxhc3RFeGNlcHRpb24uc3RhY2s7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHdpdGhfc3RhY2sgPyBgJHttc2d9XFxuJHtzdGFja31gIDogbXNnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gYCR7bGFzdEV4Y2VwdGlvbn1gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgICAgICBjb25zdCBieXRlQ291bnQgPSB3YXNtQXBpLmxlbmd0aEJ5dGVzVVRGOChyZXN1bHQpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBnZXRFeGNlcHRpb25Bc05hdGl2ZVN0cmluZygke2J5dGVDb3VudH0pOiAke3Jlc3VsdH1gKTtcclxuICAgICAgICBpZiAobGFzdEV4Y2VwdGlvbkJ1ZmZlcikge1xyXG4gICAgICAgICAgICB3YXNtQXBpLl9mcmVlKGxhc3RFeGNlcHRpb25CdWZmZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsYXN0RXhjZXB0aW9uQnVmZmVyID0gd2FzbUFwaS5fbWFsbG9jKGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIC8vIOi/meS4jSsx5Lya5a+86Ie05bCR5LiA5Liq5a2X56ym77yM55yL5LiK5Y67c3RyaW5nVG9VVEY455qE6YC76L6R5piv6K6k5Li66K+l6ZW/5bqm5pivYnVmZmVy55qE5pyA5aSn6ZW/5bqm77yM6ICM5LiU56Gu5L+d57uT5bC+5pyJXFww57uT5p2f56ymXHJcbiAgICAgICAgd2FzbUFwaS5zdHJpbmdUb1VURjgocmVzdWx0LCBsYXN0RXhjZXB0aW9uQnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICAvLyDlpoLmnpzkuIrov7DmjqjorrrmraPnoa7vvIzov5nooYzmmK/lpJrkvZnnmoTvvIzkuI3ov4fkv53pmanotbfop4Hov5jmmK/liqDkuItcclxuICAgICAgICB3YXNtQXBpLkhFQVBVOFtsYXN0RXhjZXB0aW9uQnVmZmVyICsgYnl0ZUNvdW50XSA9IDA7XHJcbiAgICAgICAgcmV0dXJuIGxhc3RFeGNlcHRpb25CdWZmZXI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gMDtcclxufVxyXG5mdW5jdGlvbiBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKSB7XHJcbiAgICBoYXNFeGNlcHRpb24gPSBmYWxzZTtcclxuICAgIGNvbnN0IHJldCA9IGxhc3RFeGNlcHRpb247XHJcbiAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgIHJldHVybiByZXQ7XHJcbn1cclxuZnVuY3Rpb24gc2V0TGFzdEV4Y2VwdGlvbihlcnIpIHtcclxuICAgIGhhc0V4Y2VwdGlvbiA9IHRydWU7XHJcbiAgICBsYXN0RXhjZXB0aW9uID0gZXJyO1xyXG59XHJcbmNsYXNzIFNjb3BlIHtcclxuICAgIHN0YXRpYyBjdXJyZW50ID0gdW5kZWZpbmVkO1xyXG4gICAgc3RhdGljIGdldEN1cnJlbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmN1cnJlbnQ7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZW50ZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTY29wZSgpO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGV4aXQod2FzbUFwaSkge1xyXG4gICAgICAgIGdldEFuZENsZWFyTGFzdEV4Y2VwdGlvbigpO1xyXG4gICAgICAgIFNjb3BlLmN1cnJlbnQuY2xvc2Uod2FzbUFwaSk7XHJcbiAgICB9XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnByZXZTY29wZSA9IFNjb3BlLmN1cnJlbnQ7XHJcbiAgICAgICAgU2NvcGUuY3VycmVudCA9IHRoaXM7XHJcbiAgICB9XHJcbiAgICBjbG9zZSh3YXNtQXBpKSB7XHJcbiAgICAgICAgU2NvcGUuY3VycmVudCA9IHRoaXMucHJldlNjb3BlO1xyXG4gICAgfVxyXG4gICAgYWRkVG9TY29wZShvYmopIHtcclxuICAgICAgICB0aGlzLm9iamVjdHNJblNjb3BlLnB1c2gob2JqKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RzSW5TY29wZS5sZW5ndGggLSAxO1xyXG4gICAgfVxyXG4gICAgZ2V0RnJvbVNjb3BlKGluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGVbaW5kZXhdO1xyXG4gICAgfVxyXG4gICAgdG9Kcyh3YXNtQXBpLCBvYmpNYXBwZXIsIHB2YWx1ZSwgZnJlZVN0cmluZ0FuZEJ1ZmZlciA9IGZhbHNlKSB7XHJcbiAgICAgICAgaWYgKHB2YWx1ZSA9PSAwKVxyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIGNvbnN0IGhlYXAgPSB3YXNtQXBpLkhFQVBVODtcclxuICAgICAgICBjb25zdCB0YWdQdHIgPSBwdmFsdWUgKyA4O1xyXG4gICAgICAgIGNvbnN0IHZhbFR5cGUgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHRhZ1B0cik7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhgdmFsVHlwZTogJHt2YWxUeXBlfWApO1xyXG4gICAgICAgIGlmICh2YWxUeXBlIDw9IEpTVGFnLkpTX1RBR19PQkpFQ1QgJiYgdmFsVHlwZSA+PSBKU1RhZy5KU19UQUdfQVJSQVkpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JqSWR4ID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RzSW5TY29wZVtvYmpJZHhdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodmFsVHlwZSA9PSBKU1RhZy5KU19UQUdfTkFUSVZFX09CSkVDVCkge1xyXG4gICAgICAgICAgICBjb25zdCBvYmpJZCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9iak1hcHBlci5maW5kTmF0aXZlT2JqZWN0KG9iaklkKTsgLy8g6IKv5a6a5bey57uPcHVzaOi/h+S6hu+8jOebtOaOpWZpbmTlsLHlj6/ku6XkuoZcclxuICAgICAgICB9XHJcbiAgICAgICAgc3dpdGNoICh2YWxUeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0JPT0w6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUpICE9IDA7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0lOVDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX05VTEw6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfVU5ERUZJTkVEOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfRkxPQVQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZERvdWJsZShoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19JTlQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZEludDY0KGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX1VJTlQ2NDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBCdWZmZXIucmVhZFVJbnQ2NChoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19TVFJJTkc6XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHJTdGFydCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0ckxlbiA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlICsgNCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHIgPSB3YXNtQXBpLlVURjhUb1N0cmluZyhzdHJTdGFydCwgc3RyTGVuKTtcclxuICAgICAgICAgICAgICAgIGlmIChmcmVlU3RyaW5nQW5kQnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVlZF9mcmVlID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCB0YWdQdHIgKyA0KTsgLy8gbmVlZF9mcmVlXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5lZWRfZnJlZSAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhc21BcGkuX2ZyZWUoc3RyU3RhcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX1NUUklORzE2OlxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RyMTZTdGFydCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0cjE2TGVuID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUgKyA0KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0cjE2ID0gd2FzbUFwaS5VVEYxNlRvU3RyaW5nKHN0cjE2U3RhcnQsIHN0cjE2TGVuICogMik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnJlZVN0cmluZ0FuZEJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lZWRfZnJlZSA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgdGFnUHRyICsgNCk7IC8vIG5lZWRfZnJlZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWVkX2ZyZWUgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXNtQXBpLl9mcmVlKHN0cjE2U3RhcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBzdHIxNjtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfQlVGRkVSOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZlN0YXJ0ID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZkxlbiA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlICsgNCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmID0gd2FzbUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoYnVmZlN0YXJ0LCBidWZmU3RhcnQgKyBidWZmTGVuKTtcclxuICAgICAgICAgICAgICAgIGlmIChmcmVlU3RyaW5nQW5kQnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVlZF9mcmVlID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCB0YWdQdHIgKyA0KTsgLy8gbmVlZF9mcmVlXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5lZWRfZnJlZSAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhc21BcGkuX2ZyZWUoYnVmZlN0YXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYnVmZjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCB0eXBlOiAke3ZhbFR5cGV9YCk7XHJcbiAgICB9XHJcbiAgICBwcmV2U2NvcGUgPSB1bmRlZmluZWQ7XHJcbiAgICBvYmplY3RzSW5TY29wZSA9IFtudWxsXTsgLy8g5YqgbnVsbOS4uuS6hmluZGV45LuOMeW8gOWni++8jOWboOS4uuWcqOWOn+eUn+enjeWtmOaUvuWcqOaMh+mSiOWtl+autemYsuatouivr+WIpOS4um51bGxwdHJcclxufVxyXG5jbGFzcyBPYmplY3RQb29sIHtcclxuICAgIHN0b3JhZ2UgPSBuZXcgTWFwKCk7XHJcbiAgICBnY0l0ZXJhdG9yO1xyXG4gICAgZ2NUaW1lb3V0ID0gbnVsbDtcclxuICAgIGlzR2NSdW5uaW5nID0gZmFsc2U7XHJcbiAgICAvLyBHQyBjb25maWd1cmF0aW9uIGRlZmF1bHRzXHJcbiAgICBnY0JhdGNoU2l6ZSA9IDEwMDtcclxuICAgIGdjSW50ZXJ2YWxNcyA9IDUwO1xyXG4gICAgY2xlYW51cENhbGxiYWNrID0gdW5kZWZpbmVkO1xyXG4gICAgY29uc3RydWN0b3IoY2xlYW51cENhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2sgPSBjbGVhbnVwQ2FsbGJhY2s7XHJcbiAgICB9XHJcbiAgICBhZGQob2JqSWQsIG9iaiwgdHlwZUlkLCBjYWxsRmluYWxpemUpIHtcclxuICAgICAgICBjb25zdCByZWYgPSBuZXcgV2Vha1JlZihvYmopO1xyXG4gICAgICAgIHRoaXMuc3RvcmFnZS5zZXQob2JqSWQsIFtyZWYsIHR5cGVJZCwgY2FsbEZpbmFsaXplXSk7XHJcbiAgICAgICAgb2JqLiRPYmpJZF9fID0gb2JqSWQ7XHJcbiAgICAgICAgb2JqLiRUeXBlSWRfXyA9IHR5cGVJZDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIGdldChvYmpJZCkge1xyXG4gICAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5zdG9yYWdlLmdldChvYmpJZCk7XHJcbiAgICAgICAgaWYgKCFlbnRyeSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IFtyZWYsIHR5cGVJZCwgY2FsbEZpbmFsaXplXSA9IGVudHJ5O1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IHJlZi5kZXJlZigpO1xyXG4gICAgICAgIGlmICghb2JqKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RvcmFnZS5kZWxldGUob2JqSWQpO1xyXG4gICAgICAgICAgICB0aGlzLmNsZWFudXBDYWxsYmFjayhvYmpJZCwgdHlwZUlkLCBjYWxsRmluYWxpemUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIEdldE5hdGl2ZUluZm9PZk9iamVjdChvYmopIHtcclxuICAgICAgICBjb25zdCBvYmpJZCA9IG9iai4kT2JqSWRfXztcclxuICAgICAgICBpZiAodHlwZW9mIG9iaklkID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICByZXR1cm4gW29iaklkLCBvYmouJFR5cGVJZF9fXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBoYXMob2JqSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdG9yYWdlLmhhcyhvYmpJZCk7XHJcbiAgICB9XHJcbiAgICBmdWxsR2MoKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBbb2JqSWRdIG9mIHRoaXMuc3RvcmFnZSkge1xyXG4gICAgICAgICAgICB0aGlzLmdldChvYmpJZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE9ubHkgcmVzZXQgaXRlcmF0b3IgaWYgR0MgaXMgcnVubmluZyB0byBtYWludGFpbiBpdGVyYXRpb24gc3RhdGVcclxuICAgICAgICBpZiAodGhpcy5pc0djUnVubmluZykge1xyXG4gICAgICAgICAgICB0aGlzLmdjSXRlcmF0b3IgPSB0aGlzLnN0b3JhZ2Uua2V5cygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFN0YXJ0IGluY3JlbWVudGFsIGdhcmJhZ2UgY29sbGVjdGlvbiB3aXRoIGNvbmZpZ3VyYWJsZSBwYXJhbWV0ZXJzXHJcbiAgICBzdGFydEluY3JlbWVudGFsR2MoYmF0Y2hTaXplID0gMTAwLCBpbnRlcnZhbE1zID0gNTApIHtcclxuICAgICAgICBpZiAodGhpcy5pc0djUnVubmluZylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuaXNHY1J1bm5pbmcgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZ2NCYXRjaFNpemUgPSBNYXRoLm1heCgxLCBiYXRjaFNpemUpO1xyXG4gICAgICAgIHRoaXMuZ2NJbnRlcnZhbE1zID0gTWF0aC5tYXgoMCwgaW50ZXJ2YWxNcyk7XHJcbiAgICAgICAgdGhpcy5nY0l0ZXJhdG9yID0gdGhpcy5zdG9yYWdlLmtleXMoKTtcclxuICAgICAgICB0aGlzLnByb2Nlc3NHY0JhdGNoKCk7XHJcbiAgICB9XHJcbiAgICAvLyBTdG9wIGluY3JlbWVudGFsIGdhcmJhZ2UgY29sbGVjdGlvblxyXG4gICAgc3RvcEluY3JlbWVudGFsR2MoKSB7XHJcbiAgICAgICAgdGhpcy5pc0djUnVubmluZyA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh0aGlzLmdjVGltZW91dCkge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5nY1RpbWVvdXQpO1xyXG4gICAgICAgICAgICB0aGlzLmdjVGltZW91dCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcHJvY2Vzc0djQmF0Y2goKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzR2NSdW5uaW5nKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgbGV0IHByb2Nlc3NlZCA9IDA7XHJcbiAgICAgICAgbGV0IG5leHQgPSB0aGlzLmdjSXRlcmF0b3IubmV4dCgpO1xyXG4gICAgICAgIHdoaWxlICghbmV4dC5kb25lICYmIHByb2Nlc3NlZCA8IHRoaXMuZ2NCYXRjaFNpemUpIHtcclxuICAgICAgICAgICAgdGhpcy5nZXQobmV4dC52YWx1ZSk7XHJcbiAgICAgICAgICAgIHByb2Nlc3NlZCsrO1xyXG4gICAgICAgICAgICBuZXh0ID0gdGhpcy5nY0l0ZXJhdG9yLm5leHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG5leHQuZG9uZSkge1xyXG4gICAgICAgICAgICAvLyBSZXN0YXJ0IGl0ZXJhdG9yIGZvciBuZXh0IHJvdW5kXHJcbiAgICAgICAgICAgIHRoaXMuZ2NJdGVyYXRvciA9IHRoaXMuc3RvcmFnZS5rZXlzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZ2NUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnByb2Nlc3NHY0JhdGNoKCksIHRoaXMuZ2NJbnRlcnZhbE1zKTtcclxuICAgIH1cclxufVxyXG5jbGFzcyBDbGFzc1JlZ2lzdGVyIHtcclxuICAgIHN0YXRpYyBpbnN0YW5jZTtcclxuICAgIGNvbnN0cnVjdG9yKCkgeyB9XHJcbiAgICBjbGFzc05vdEZvdW5kID0gdW5kZWZpbmVkO1xyXG4gICAgdHlwZUlkVG9DbGFzcyA9IG5ldyBNYXAoKTtcclxuICAgIHR5cGVJZFRvSW5mb3MgPSBuZXcgTWFwKCk7XHJcbiAgICBuYW1lVG9DbGFzcyA9IG5ldyBNYXAoKTtcclxuICAgIHN0YXRpYyBnZXRJbnN0YW5jZSgpIHtcclxuICAgICAgICBpZiAoIUNsYXNzUmVnaXN0ZXIuaW5zdGFuY2UpIHtcclxuICAgICAgICAgICAgQ2xhc3NSZWdpc3Rlci5pbnN0YW5jZSA9IG5ldyBDbGFzc1JlZ2lzdGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBDbGFzc1JlZ2lzdGVyLmluc3RhbmNlO1xyXG4gICAgfVxyXG4gICAgLy9wdWJsaWMgcGVzYXBpX2RlZmluZV9jbGFzcyh0eXBlSWQ6IG51bWJlciwgc3VwZXJUeXBlSWQ6IG51bWJlciwgcG5hbWU6IENTU3RyaW5nLCBjb25zdHJ1Y3RvcjogbnVtYmVyLCBmaW5hbGl6ZTogbnVtYmVyLCBwcm9wZXJ0eUNvdW50OiBudW1iZXIsIHByb3BlcnRpZXM6IG51bWJlciwgZGF0YTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAvL31cclxuICAgIGRlZmluZUNsYXNzKHR5cGVJZCkge1xyXG4gICAgICAgIGNvbnN0IHR5cGVEZWYgPSB3YXNtQXBpLmxvYWRfY2xhc3NfYnlfaWQocmVnaXN0cnksIHR5cGVJZCk7XHJcbiAgICAgICAgY29uc3Qgc3VwZXJUeXBlSWQgPSB3YXNtQXBpLmdldF9jbGFzc19zdXBlcl90eXBlX2lkKHR5cGVEZWYpO1xyXG4gICAgICAgIGNvbnN0IHBuYW1lID0gd2FzbUFwaS5nZXRfY2xhc3NfbmFtZSh0eXBlRGVmKTtcclxuICAgICAgICBjb25zdCBuYW1lID0gd2FzbUFwaS5VVEY4VG9TdHJpbmcocG5hbWUpO1xyXG4gICAgICAgIGNvbnN0IGNvbnN0cnVjdG9yID0gd2FzbUFwaS5nZXRfY2xhc3NfaW5pdGlhbGl6ZSh0eXBlRGVmKTtcclxuICAgICAgICBjb25zdCBmaW5hbGl6ZSA9IHdhc21BcGkuZ2V0X2NsYXNzX2ZpbmFsaXplKHR5cGVEZWYpO1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB3YXNtQXBpLmdldF9jbGFzc19kYXRhKHR5cGVEZWYpO1xyXG4gICAgICAgIGNvbnN0IFBBcGlOYXRpdmVPYmplY3QgPSBmdW5jdGlvbiAoLi4uYXJncykge1xyXG4gICAgICAgICAgICBsZXQgY2FsbGJhY2tJbmZvID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBjb25zdCBhcmdjID0gYXJndW1lbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgY29uc3Qgc2NvcGUgPSBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tJbmZvID0ganNBcmdzVG9DYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgYXJncyk7XHJcbiAgICAgICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMih3YXNtQXBpLkhFQVBVOCwgZGF0YSwgY2FsbGJhY2tJbmZvICsgOCk7IC8vIGRhdGFcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9iaklkID0gd2FzbUFwaS5QQXBpQ29uc3RydWN0b3JXaXRoU2NvcGUoY29uc3RydWN0b3IsIHdlYmdsRkZJLCBjYWxsYmFja0luZm8pOyAvLyDpooTmnJ93YXNt5Y+q5Lya6YCa6L+HdGhyb3dfYnlfc3RyaW5n5oqb5byC5bi477yM5LiN5Lqn55Sf55u05o6lanPlvILluLhcclxuICAgICAgICAgICAgICAgIGlmIChoYXNFeGNlcHRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG9iak1hcHBlci5iaW5kTmF0aXZlT2JqZWN0KG9iaklkLCB0aGlzLCB0eXBlSWQsIFBBcGlOYXRpdmVPYmplY3QsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuTmF0aXZlQ2FsbGJhY2tJbmZvKHdhc21BcGksIGFyZ2MsIGNhbGxiYWNrSW5mbyk7XHJcbiAgICAgICAgICAgICAgICBzY29wZS5jbG9zZSh3YXNtQXBpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFBBcGlOYXRpdmVPYmplY3QsIFwibmFtZVwiLCB7IHZhbHVlOiBuYW1lIH0pO1xyXG4gICAgICAgIGlmIChzdXBlclR5cGVJZCAhPSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN1cGVyVHlwZSA9IHRoaXMubG9hZENsYXNzQnlJZChzdXBlclR5cGVJZCk7XHJcbiAgICAgICAgICAgIGlmIChzdXBlclR5cGUpIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihQQXBpTmF0aXZlT2JqZWN0LnByb3RvdHlwZSwgc3VwZXJUeXBlLnByb3RvdHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbmF0aXZlTWV0aG9kSW5mb1RvSnMobWV0aG9kUHRyLCBpc1N0YXRpYykge1xyXG4gICAgICAgICAgICBjb25zdCBuYXRpdmVGdW5jUHRyID0gd2FzbUFwaS5nZXRfZnVuY3Rpb25faW5mb19jYWxsYmFjayhtZXRob2RQdHIpO1xyXG4gICAgICAgICAgICBjb25zdCBtZXRob2REYXRhID0gd2FzbUFwaS5nZXRfZnVuY3Rpb25faW5mb19kYXRhKG1ldGhvZFB0cik7XHJcbiAgICAgICAgICAgIHJldHVybiBnZW5Kc0NhbGxiYWNrKHdhc21BcGksIG5hdGl2ZUZ1bmNQdHIsIG1ldGhvZERhdGEsIHdlYmdsRkZJLCBpc1N0YXRpYyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG5hdGl2ZVByb3BlcnR5SW5mb1RvSnMocHJvcGVydHlJbmZvUHRyLCBpc1N0YXRpYykge1xyXG4gICAgICAgICAgICBjb25zdCBnZXR0ZXIgPSB3YXNtQXBpLmdldF9wcm9wZXJ0eV9pbmZvX2dldHRlcihwcm9wZXJ0eUluZm9QdHIpO1xyXG4gICAgICAgICAgICBjb25zdCBzZXR0ZXIgPSB3YXNtQXBpLmdldF9wcm9wZXJ0eV9pbmZvX3NldHRlcihwcm9wZXJ0eUluZm9QdHIpO1xyXG4gICAgICAgICAgICBjb25zdCBnZXR0ZXJfZGF0YSA9IHdhc21BcGkuZ2V0X3Byb3BlcnR5X2luZm9fZ2V0dGVyX2RhdGEocHJvcGVydHlJbmZvUHRyKTtcclxuICAgICAgICAgICAgY29uc3Qgc2V0dGVyX2RhdGEgPSB3YXNtQXBpLmdldF9wcm9wZXJ0eV9pbmZvX3NldHRlcl9kYXRhKHByb3BlcnR5SW5mb1B0cik7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBnZXQ6IGdldHRlciA9PT0gMCA/IHVuZGVmaW5lZCA6IGdlbkpzQ2FsbGJhY2sod2FzbUFwaSwgZ2V0dGVyLCBnZXR0ZXJfZGF0YSwgd2ViZ2xGRkksIGlzU3RhdGljKSxcclxuICAgICAgICAgICAgICAgIHNldDogc2V0dGVyID09PSAwID8gdW5kZWZpbmVkIDogZ2VuSnNDYWxsYmFjayh3YXNtQXBpLCBzZXR0ZXIsIHNldHRlcl9kYXRhLCB3ZWJnbEZGSSwgaXNTdGF0aWMpLFxyXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbWV0aG9kUHRyID0gd2FzbUFwaS5nZXRfY2xhc3NfbWV0aG9kcyh0eXBlRGVmKTtcclxuICAgICAgICB3aGlsZSAobWV0aG9kUHRyICE9IDApIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gd2FzbUFwaS5VVEY4VG9TdHJpbmcod2FzbUFwaS5nZXRfZnVuY3Rpb25faW5mb19uYW1lKG1ldGhvZFB0cikpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGBtZXRob2Q6ICR7bmFtZX0gJHtmaWVsZE5hbWV9YCk7XHJcbiAgICAgICAgICAgIFBBcGlOYXRpdmVPYmplY3QucHJvdG90eXBlW2ZpZWxkTmFtZV0gPSBuYXRpdmVNZXRob2RJbmZvVG9KcyhtZXRob2RQdHIsIGZhbHNlKTtcclxuICAgICAgICAgICAgbWV0aG9kUHRyID0gd2FzbUFwaS5nZXRfbmV4dF9mdW5jdGlvbl9pbmZvKG1ldGhvZFB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBmdW5jdGlvblB0ciA9IHdhc21BcGkuZ2V0X2NsYXNzX2Z1bmN0aW9ucyh0eXBlRGVmKTtcclxuICAgICAgICB3aGlsZSAoZnVuY3Rpb25QdHIgIT0gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSB3YXNtQXBpLlVURjhUb1N0cmluZyh3YXNtQXBpLmdldF9mdW5jdGlvbl9pbmZvX25hbWUoZnVuY3Rpb25QdHIpKTtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhgZnVuY3Rpb246ICR7bmFtZX0gJHtmaWVsZE5hbWV9YCk7XHJcbiAgICAgICAgICAgIFBBcGlOYXRpdmVPYmplY3RbZmllbGROYW1lXSA9IG5hdGl2ZU1ldGhvZEluZm9Ub0pzKGZ1bmN0aW9uUHRyLCB0cnVlKTtcclxuICAgICAgICAgICAgZnVuY3Rpb25QdHIgPSB3YXNtQXBpLmdldF9uZXh0X2Z1bmN0aW9uX2luZm8oZnVuY3Rpb25QdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgcHJvcGVydHlQdHIgPSB3YXNtQXBpLmdldF9jbGFzc19wcm9wZXJ0aWVzKHR5cGVEZWYpO1xyXG4gICAgICAgIHdoaWxlIChwcm9wZXJ0eVB0ciAhPSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IHdhc21BcGkuVVRGOFRvU3RyaW5nKHdhc21BcGkuZ2V0X3Byb3BlcnR5X2luZm9fbmFtZShwcm9wZXJ0eVB0cikpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGBwcm9wZXJ0eTogJHtuYW1lfSAke2ZpZWxkTmFtZX1gKTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFBBcGlOYXRpdmVPYmplY3QucHJvdG90eXBlLCBmaWVsZE5hbWUsIG5hdGl2ZVByb3BlcnR5SW5mb1RvSnMocHJvcGVydHlQdHIsIGZhbHNlKSk7XHJcbiAgICAgICAgICAgIHByb3BlcnR5UHRyID0gd2FzbUFwaS5nZXRfbmV4dF9wcm9wZXJ0eV9pbmZvKHByb3BlcnR5UHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHZhcmlhYmxlUHRyID0gd2FzbUFwaS5nZXRfY2xhc3NfdmFyaWFibGVzKHR5cGVEZWYpO1xyXG4gICAgICAgIHdoaWxlICh2YXJpYWJsZVB0ciAhPSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IHdhc21BcGkuVVRGOFRvU3RyaW5nKHdhc21BcGkuZ2V0X3Byb3BlcnR5X2luZm9fbmFtZSh2YXJpYWJsZVB0cikpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGB2YXJpYWJsZTogJHtuYW1lfSAke2ZpZWxkTmFtZX1gKTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFBBcGlOYXRpdmVPYmplY3QsIGZpZWxkTmFtZSwgbmF0aXZlUHJvcGVydHlJbmZvVG9Kcyh2YXJpYWJsZVB0ciwgZmFsc2UpKTtcclxuICAgICAgICAgICAgdmFyaWFibGVQdHIgPSB3YXNtQXBpLmdldF9uZXh0X3Byb3BlcnR5X2luZm8odmFyaWFibGVQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKGBwZXNhcGlfZGVmaW5lX2NsYXNzOiAke25hbWV9ICR7dHlwZUlkfSAke3N1cGVyVHlwZUlkfWApO1xyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJDbGFzcyh0eXBlSWQsIFBBcGlOYXRpdmVPYmplY3QsIHdhc21BcGkuZ2V0V2FzbVRhYmxlRW50cnkoZmluYWxpemUpLCBkYXRhKTtcclxuICAgIH1cclxuICAgIGxvYWRDbGFzc0J5SWQodHlwZUlkKSB7XHJcbiAgICAgICAgY29uc3QgY2xzID0gdGhpcy50eXBlSWRUb0NsYXNzLmdldCh0eXBlSWQpO1xyXG4gICAgICAgIGlmIChjbHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNscztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVmaW5lQ2xhc3ModHlwZUlkKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudHlwZUlkVG9DbGFzcy5nZXQodHlwZUlkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZWdpc3RlckNsYXNzKHR5cGVJZCwgY2xzLCBmaW5hbGl6ZSwgY2xzRGF0YSkge1xyXG4gICAgICAgIGNvbnN0IGluZm9zID0geyB0eXBlSWQsIGZpbmFsaXplLCBkYXRhOiBjbHNEYXRhIH07XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscywgJyRJbmZvcycsIHtcclxuICAgICAgICAgICAgdmFsdWU6IGluZm9zLFxyXG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50eXBlSWRUb0NsYXNzLnNldCh0eXBlSWQsIGNscyk7XHJcbiAgICAgICAgdGhpcy50eXBlSWRUb0luZm9zLnNldCh0eXBlSWQsIGluZm9zKTtcclxuICAgICAgICB0aGlzLm5hbWVUb0NsYXNzLnNldChjbHMubmFtZSwgY2xzKTtcclxuICAgIH1cclxuICAgIGdldENsYXNzRGF0YUJ5SWQodHlwZUlkLCBmb3JjZUxvYWQpIHtcclxuICAgICAgICBpZiAoZm9yY2VMb2FkKSB7XHJcbiAgICAgICAgICAgIHRoaXMubG9hZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBpbmZvcyA9IHRoaXMuZ2V0VHlwZUluZm9zKHR5cGVJZCk7XHJcbiAgICAgICAgcmV0dXJuIGluZm9zID8gaW5mb3MuZGF0YSA6IDA7XHJcbiAgICB9XHJcbiAgICBmaW5kQ2xhc3NCeUlkKHR5cGVJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnR5cGVJZFRvQ2xhc3MuZ2V0KHR5cGVJZCk7XHJcbiAgICB9XHJcbiAgICBmaW5kQ2xhc3NCeU5hbWUobmFtZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5hbWVUb0NsYXNzLmdldChuYW1lKTtcclxuICAgIH1cclxuICAgIGdldFR5cGVJbmZvcyh0eXBlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50eXBlSWRUb0luZm9zLmdldCh0eXBlSWQpO1xyXG4gICAgfVxyXG4gICAgc2V0Q2xhc3NOb3RGb3VuZENhbGxiYWNrKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc05vdEZvdW5kID0gY2FsbGJhY2s7XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgT2JqZWN0TWFwcGVyIHtcclxuICAgIG9iamVjdFBvb2w7XHJcbiAgICBwcml2YXRlRGF0YSA9IHVuZGVmaW5lZDtcclxuICAgIG9iaklkMnVkID0gbmV3IE1hcCgpO1xyXG4gICAgb25FbnRlciA9IHVuZGVmaW5lZDtcclxuICAgIG9uRXhpdCA9IHVuZGVmaW5lZDtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMub2JqZWN0UG9vbCA9IG5ldyBPYmplY3RQb29sKHRoaXMuT25OYXRpdmVPYmplY3RGaW5hbGl6ZWQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5vYmplY3RQb29sLnN0YXJ0SW5jcmVtZW50YWxHYygxMDAsIDEwMDApO1xyXG4gICAgfVxyXG4gICAgcHVzaE5hdGl2ZU9iamVjdChvYmpJZCwgdHlwZUlkLCBjYWxsRmluYWxpemUpIHtcclxuICAgICAgICBsZXQganNPYmogPSB0aGlzLm9iamVjdFBvb2wuZ2V0KG9iaklkKTtcclxuICAgICAgICBpZiAoIWpzT2JqKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNscyA9IENsYXNzUmVnaXN0ZXIuZ2V0SW5zdGFuY2UoKS5sb2FkQ2xhc3NCeUlkKHR5cGVJZCk7XHJcbiAgICAgICAgICAgIGlmIChjbHMpIHtcclxuICAgICAgICAgICAgICAgIGpzT2JqID0gT2JqZWN0LmNyZWF0ZShjbHMucHJvdG90eXBlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYmluZE5hdGl2ZU9iamVjdChvYmpJZCwganNPYmosIHR5cGVJZCwgY2xzLCBjYWxsRmluYWxpemUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBqc09iajtcclxuICAgIH1cclxuICAgIGZpbmROYXRpdmVPYmplY3Qob2JqSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RQb29sLmdldChvYmpJZCk7XHJcbiAgICB9XHJcbiAgICBiaW5kTmF0aXZlT2JqZWN0KG9iaklkLCBqc09iaiwgdHlwZUlkLCBjbHMsIGNhbGxGaW5hbGl6ZSkge1xyXG4gICAgICAgIHRoaXMub2JqZWN0UG9vbC5hZGQob2JqSWQsIGpzT2JqLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZSk7XHJcbiAgICAgICAgY29uc3QgeyBkYXRhIH0gPSBjbHMuJEluZm9zO1xyXG4gICAgICAgIGlmICh0aGlzLm9uRW50ZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgdWQgPSB0aGlzLm9uRW50ZXIob2JqSWQsIGRhdGEsIHRoaXMucHJpdmF0ZURhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLm9iaklkMnVkLnNldChvYmpJZCwgdWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHNldEVudlByaXZhdGUocHJpdmF0ZURhdGEpIHtcclxuICAgICAgICB0aGlzLnByaXZhdGVEYXRhID0gcHJpdmF0ZURhdGE7XHJcbiAgICB9XHJcbiAgICB0cmFjZU5hdGl2ZU9iamVjdChvbkVudGVyLCBvbkV4aXQpIHtcclxuICAgICAgICB0aGlzLm9uRW50ZXIgPSBvbkVudGVyO1xyXG4gICAgICAgIHRoaXMub25FeGl0ID0gb25FeGl0O1xyXG4gICAgfVxyXG4gICAgT25OYXRpdmVPYmplY3RGaW5hbGl6ZWQob2JqSWQsIHR5cGVJZCwgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmVycm9yKGBPbk5hdGl2ZU9iamVjdEZpbmFsaXplZCAke29iaklkfWApO1xyXG4gICAgICAgIGNvbnN0IGNscyA9IENsYXNzUmVnaXN0ZXIuZ2V0SW5zdGFuY2UoKS5maW5kQ2xhc3NCeUlkKHR5cGVJZCk7XHJcbiAgICAgICAgY29uc3QgeyBmaW5hbGl6ZSwgZGF0YSB9ID0gY2xzLiRJbmZvcztcclxuICAgICAgICBpZiAoY2FsbEZpbmFsaXplICYmIGZpbmFsaXplKSB7XHJcbiAgICAgICAgICAgIGZpbmFsaXplKHdlYmdsRkZJLCBvYmpJZCwgZGF0YSwgdGhpcy5wcml2YXRlRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9uRXhpdCAmJiB0aGlzLm9iaklkMnVkLmhhcyhvYmpJZCkpIHtcclxuICAgICAgICAgICAgY29uc3QgdWQgPSB0aGlzLm9iaklkMnVkLmdldChvYmpJZCk7XHJcbiAgICAgICAgICAgIHRoaXMub2JqSWQydWQuZGVsZXRlKG9iaklkKTtcclxuICAgICAgICAgICAgdGhpcy5vbkV4aXQob2JqSWQsIGRhdGEsIHRoaXMucHJpdmF0ZURhdGEsIHVkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxubGV0IHdlYmdsRkZJID0gdW5kZWZpbmVkO1xyXG5sZXQgb2JqTWFwcGVyID0gdW5kZWZpbmVkO1xyXG5sZXQgcmVnaXN0cnkgPSB1bmRlZmluZWQ7XHJcbmxldCB3YXNtQXBpID0gdW5kZWZpbmVkO1xyXG4vLyB0eXBlZGVmIHN0cnVjdCBTdHJpbmcge1xyXG4vLyAgICAgY29uc3QgY2hhciAqcHRyO1xyXG4vLyAgICAgdWludDMyX3QgbGVuO1xyXG4vLyB9IFN0cmluZztcclxuLy8gXHJcbi8vIHR5cGVkZWYgc3RydWN0IEJ1ZmZlciB7XHJcbi8vICAgICB2b2lkICpwdHI7XHJcbi8vICAgICB1aW50MzJfdCBsZW47XHJcbi8vIH0gQnVmZmVyO1xyXG4vLyBcclxuLy8gdHlwZWRlZiBzdHJ1Y3QgTmF0aXZlT2JqZWN0IHtcclxuLy8gICAgIHZvaWQgKm9iaklkO1xyXG4vLyAgICAgY29uc3Qgdm9pZCAqdHlwZUlkO1xyXG4vLyB9IE5hdGl2ZU9iamVjdDtcclxuLy8gXHJcbi8vIHR5cGVkZWYgdW5pb24gSlNWYWx1ZVVuaW9uIHtcclxuLy8gICAgIGludDMyX3QgaW50MzI7XHJcbi8vICAgICBkb3VibGUgZmxvYXQ2NDtcclxuLy8gICAgIGludDY0X3QgaW50NjQ7XHJcbi8vICAgICB1aW50NjRfdCB1aW50NjQ7XHJcbi8vICAgICB2b2lkICpwdHI7XHJcbi8vICAgICBTdHJpbmcgc3RyO1xyXG4vLyAgICAgQnVmZmVyIGJ1ZjtcclxuLy8gICAgIE5hdGl2ZU9iamVjdCBudG87XHJcbi8vIH0gSlNWYWx1ZVVuaW9uO1xyXG4vLyBcclxuLy8gdHlwZWRlZiBzdHJ1Y3QgSlNWYWx1ZSB7XHJcbi8vICAgICBKU1ZhbHVlVW5pb24gdTtcclxuLy8gICAgIGludDMyX3QgdGFnO1xyXG4vLyAgICAgaW50IG5lZWRfZnJlZTtcclxuLy8gfSBKU1ZhbHVlO1xyXG4vL1xyXG4vLyBzdHJ1Y3QgQ2FsbGJhY2tJbmZvIHtcclxuLy8gICAgIHZvaWQqIHRoaXNQdHI7XHJcbi8vICAgICBpbnQgYXJnYztcclxuLy8gICAgIHZvaWQqIGRhdGE7XHJcbi8vICAgICB2b2lkKiB0aGlzVHlwZUlkO1xyXG4vLyAgICAgSlNWYWx1ZSByZXM7XHJcbi8vICAgICBKU1ZhbHVlIGFyZ3ZbMF07XHJcbi8vIH07XHJcbi8vIHNpemVvZihKU1ZhbHVlKSA9PSAxNlxyXG5jb25zdCBjYWxsYmFja0luZm9zQ2FjaGUgPSBbXTtcclxuZnVuY3Rpb24gZ2V0TmF0aXZlQ2FsbGJhY2tJbmZvKHdhc21BcGksIGFyZ2MpIHtcclxuICAgIGxldCBjYWxsYmFja0luZm8gPSBjYWxsYmFja0luZm9zQ2FjaGVbYXJnY107XHJcbiAgICBpZiAoIWNhbGxiYWNrSW5mbykge1xyXG4gICAgICAgIC8vIDQgKyA0ICsgNCArIDQgKyAxNiArIChhcmdjICogMTYpXHJcbiAgICAgICAgY29uc3Qgc2l6ZSA9IDMyICsgKGFyZ2MgKiAxNik7XHJcbiAgICAgICAgY2FsbGJhY2tJbmZvID0gd2FzbUFwaS5fbWFsbG9jKHNpemUpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKHdhc21BcGkuSEVBUFU4LCBhcmdjLCBjYWxsYmFja0luZm8gKyA0KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGNhbGxiYWNrSW5mb3NDYWNoZVthcmdjXSA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIEJ1ZmZlci53cml0ZUludDMyKHdhc21BcGkuSEVBUFU4LCBKU1RhZy5KU19UQUdfVU5ERUZJTkVELCBjYWxsYmFja0luZm8gKyAyNCk7IC8vIHNldCByZXMgdG8gdW5kZWZpbmVkXHJcbiAgICByZXR1cm4gY2FsbGJhY2tJbmZvO1xyXG59XHJcbmZ1bmN0aW9uIHJldHVybk5hdGl2ZUNhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjLCBjYWxsYmFja0luZm8pIHtcclxuICAgIGlmIChjYWxsYmFja0luZm9zQ2FjaGVbYXJnY10pIHtcclxuICAgICAgICB3YXNtQXBpLl9mcmVlKGNhbGxiYWNrSW5mbyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsYmFja0luZm9zQ2FjaGVbYXJnY10gPSBjYWxsYmFja0luZm87XHJcbiAgICB9XHJcbn1cclxuLy8gVE9ETzog5YWI566A5Y2V5YiG6YWN55Sxd2FzbemCo+mHiuaUvu+8jOWQjue7reWGjeS8mOWMllxyXG5mdW5jdGlvbiBnZXRCdWZmZXIod2FzbUFwaSwgc2l6ZSkge1xyXG4gICAgcmV0dXJuIHdhc21BcGkuX21hbGxvYyhzaXplKTtcclxufVxyXG5mdW5jdGlvbiBqc1ZhbHVlVG9QYXBpVmFsdWUod2FzbUFwaSwgYXJnLCB2YWx1ZSkge1xyXG4gICAgbGV0IGhlYXAgPSB3YXNtQXBpLkhFQVBVODtcclxuICAgIGNvbnN0IGRhdGFQdHIgPSB2YWx1ZTtcclxuICAgIGNvbnN0IHRhZ1B0ciA9IGRhdGFQdHIgKyA4O1xyXG4gICAgaWYgKGFyZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX1VOREVGSU5FRCwgdGFnUHRyKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGFyZyA9PT0gbnVsbCkge1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19OVUxMLCB0YWdQdHIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ2JpZ2ludCcpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQ2NChoZWFwLCBhcmcsIGRhdGFQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19JTlQ2NCwgdGFnUHRyKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIoYXJnKSkge1xyXG4gICAgICAgICAgICBpZiAoYXJnID49IC0yMTQ3NDgzNjQ4ICYmIGFyZyA8PSAyMTQ3NDgzNjQ3KSB7XHJcbiAgICAgICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBhcmcsIGRhdGFQdHIpO1xyXG4gICAgICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0lOVCwgdGFnUHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDY0KGhlYXAsIGFyZywgZGF0YVB0cik7XHJcbiAgICAgICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfSU5UNjQsIHRhZ1B0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZURvdWJsZShoZWFwLCBhcmcsIGRhdGFQdHIpO1xyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfRkxPQVQ2NCwgdGFnUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGNvbnN0IGxlbiA9IHdhc21BcGkubGVuZ3RoQnl0ZXNVVEYxNihhcmcpO1xyXG4gICAgICAgIGNvbnN0IHB0ciA9IGdldEJ1ZmZlcih3YXNtQXBpLCBsZW4gKyAyKTtcclxuICAgICAgICB3YXNtQXBpLnN0cmluZ1RvVVRGMTYoYXJnLCBwdHIsIGxlbiArIDIpO1xyXG4gICAgICAgIGhlYXAgPSB3YXNtQXBpLkhFQVBVODsgLy8gZ2V0QnVmZmVy5Lya55Sz6K+35YaF5a2Y77yM5Y+v6IO95a+86Ie0SEVBUFU45pS55Y+YXHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgcHRyLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBhcmcubGVuZ3RoLCBkYXRhUHRyICsgNCk7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX1NUUklORzE2LCB0YWdQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIDEsIHRhZ1B0ciArIDQpOyAvLyBuZWVkX2ZyZWUgPSB0cnVlXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnYm9vbGVhbicpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBhcmcgPyAxIDogMCwgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0JPT0wsIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoYXJnKSwgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0ZVTkNUSU9OLCB0YWdQdHIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShhcmcpLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfQVJSQVksIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBhcmcgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbiAgICAgICAgY29uc3QgbGVuID0gYXJnLmJ5dGVMZW5ndGg7XHJcbiAgICAgICAgY29uc3QgcHRyID0gZ2V0QnVmZmVyKHdhc21BcGksIGxlbik7XHJcbiAgICAgICAgd2FzbUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhcmcpLCBwdHIpO1xyXG4gICAgICAgIGhlYXAgPSB3YXNtQXBpLkhFQVBVODsgLy8gZ2V0QnVmZmVy5Lya55Sz6K+35YaF5a2Y77yM5Y+v6IO95a+86Ie0SEVBUFU45pS55Y+YXHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgcHRyLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBsZW4sIGRhdGFQdHIgKyA0KTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfQlVGRkVSLCB0YWdQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIDEsIHRhZ1B0ciArIDQpOyAvLyBuZWVkX2ZyZWUgPSB0cnVlXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGNvbnN0IG50b0luZm8gPSBPYmplY3RQb29sLkdldE5hdGl2ZUluZm9PZk9iamVjdChhcmcpO1xyXG4gICAgICAgIGlmIChudG9JbmZvKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IFtvYmpJZCwgdHlwZUlkXSA9IG50b0luZm87XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIG9iaklkLCBkYXRhUHRyKTtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgdHlwZUlkLCBkYXRhUHRyICsgNCk7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19OQVRJVkVfT0JKRUNULCB0YWdQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoYXJnKSwgZGF0YVB0cik7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19PQkpFQ1QsIHRhZ1B0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIGFyZ3VtZW50IHR5cGU6ICR7dHlwZW9mIGFyZ31gKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBqc0FyZ3NUb0NhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjLCBhcmdzKSB7XHJcbiAgICBjb25zdCBjYWxsYmFja0luZm8gPSBnZXROYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYyk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ2M7ICsraSkge1xyXG4gICAgICAgIGNvbnN0IGFyZyA9IGFyZ3NbaV07XHJcbiAgICAgICAganNWYWx1ZVRvUGFwaVZhbHVlKHdhc21BcGksIGFyZywgY2FsbGJhY2tJbmZvICsgMzIgKyAoaSAqIDE2KSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2FsbGJhY2tJbmZvO1xyXG59XHJcbmZ1bmN0aW9uIGdlbkpzQ2FsbGJhY2sod2FzbUFwaSwgY2FsbGJhY2ssIGRhdGEsIHBhcGksIGlzU3RhdGljKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcclxuICAgICAgICBpZiAobmV3LnRhcmdldCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wibm90IGEgY29uc3RydWN0b3InKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGNhbGxiYWNrSW5mbyA9IHVuZGVmaW5lZDtcclxuICAgICAgICBjb25zdCBhcmdjID0gYXJncy5sZW5ndGg7XHJcbiAgICAgICAgY29uc3Qgc2NvcGUgPSBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mbyA9IGpzQXJnc1RvQ2FsbGJhY2tJbmZvKHdhc21BcGksIGFyZ2MsIGFyZ3MpO1xyXG4gICAgICAgICAgICBjb25zdCBoZWFwID0gd2FzbUFwaS5IRUFQVTg7IC8v5ZyoUEFwaUNhbGxiYWNrV2l0aFNjb3Bl5YmN6YO95LiN5Lya5Y+Y5YyW77yM6L+Z5qC355So5piv5a6J5YWo55qEXHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIGRhdGEsIGNhbGxiYWNrSW5mbyArIDgpOyAvLyBkYXRhXHJcbiAgICAgICAgICAgIGxldCBvYmpJZCA9IDA7XHJcbiAgICAgICAgICAgIGxldCB0eXBlSWQgPSAwO1xyXG4gICAgICAgICAgICBpZiAoIWlzU3RhdGljICYmIHRoaXMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG50b0luZm8gPSBPYmplY3RQb29sLkdldE5hdGl2ZUluZm9PZk9iamVjdCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGlmIChudG9JbmZvKVxyXG4gICAgICAgICAgICAgICAgICAgIFtvYmpJZCwgdHlwZUlkXSA9IG50b0luZm87XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgb2JqSWQsIGNhbGxiYWNrSW5mbyk7IC8vIHRoaXNQdHJcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgdHlwZUlkLCBjYWxsYmFja0luZm8gKyAxMik7IC8vIHRoaXNUeXBlSWRcclxuICAgICAgICAgICAgd2FzbUFwaS5QQXBpQ2FsbGJhY2tXaXRoU2NvcGUoY2FsbGJhY2ssIHBhcGksIGNhbGxiYWNrSW5mbyk7IC8vIOmihOacn3dhc23lj6rkvJrpgJrov4d0aHJvd19ieV9zdHJpbmfmipvlvILluLjvvIzkuI3kuqfnlJ/nm7TmjqVqc+W8guW4uFxyXG4gICAgICAgICAgICBpZiAoaGFzRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMod2FzbUFwaSwgb2JqTWFwcGVyLCBjYWxsYmFja0luZm8gKyAxNiwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICByZXR1cm5OYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgY2FsbGJhY2tJbmZvKTtcclxuICAgICAgICAgICAgc2NvcGUuY2xvc2Uod2FzbUFwaSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG4vLyDpnIDopoHlnKhVbml0eemHjOiwg+eUqFBsYXllclNldHRpbmdzLldlYkdMLmVtc2NyaXB0ZW5BcmdzID0gXCIgLXMgQUxMT1dfVEFCTEVfR1JPV1RIPTFcIjtcclxuZnVuY3Rpb24gV2ViR0xGRklBcGkoZW5naW5lKSB7XHJcbiAgICB3YXNtQXBpID0gZW5naW5lLnVuaXR5QXBpO1xyXG4gICAgb2JqTWFwcGVyID0gbmV3IE9iamVjdE1hcHBlcigpO1xyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9hcnJheShlbnYpIHtcclxuICAgICAgICByZXR1cm4gU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoW10pO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9vYmplY3QoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKE9iamVjdC5jcmVhdGUobnVsbCkpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9mdW5jdGlvbihlbnYsIG5hdGl2ZV9pbXBsLCBkYXRhLCBmaW5hbGl6ZSAvLyBUT0RPOiBnY+aXtuiwg+eUqGZpbmFsaXplXHJcbiAgICApIHtcclxuICAgICAgICBjb25zdCBqc0NhbGxiYWNrID0gZ2VuSnNDYWxsYmFjayhlbmdpbmUudW5pdHlBcGksIG5hdGl2ZV9pbXBsLCBkYXRhLCB3ZWJnbEZGSSwgZmFsc2UpO1xyXG4gICAgICAgIHJldHVybiBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShqc0NhbGxiYWNrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfY2xhc3MoZW52LCB0eXBlSWQpIHtcclxuICAgICAgICBjb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkubG9hZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgY2xzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYGNyZWF0ZSBjbGFzczogJHtjbHMubmFtZX1gKTtcclxuICAgICAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGNscyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbid0IGxvYWQgY2xhc3MgYnkgdHlwZSBpZDogXCIgKyB0eXBlSWQpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9hcnJheV9sZW5ndGgoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBhcnJheSA9IFNjb3BlLmdldEN1cnJlbnQoKS5nZXRGcm9tU2NvcGUocHZhbHVlKTtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoOiB2YWx1ZSBpcyBub3QgYW4gYXJyYXlcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnJheS5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfbmF0aXZlX29iamVjdF90b192YWx1ZShlbnYsIHR5cGVJZCwgb2JqZWN0X3B0ciwgY2FsbF9maW5hbGl6ZSkge1xyXG4gICAgICAgIGNvbnN0IGpzT2JqID0gb2JqTWFwcGVyLnB1c2hOYXRpdmVPYmplY3Qob2JqZWN0X3B0ciwgdHlwZUlkLCBjYWxsX2ZpbmFsaXplKTtcclxuICAgICAgICAvLyBUT0RPOiBqdXN0IGZvciB0ZXN0XHJcbiAgICAgICAgLy9jb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkuZmluZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIC8vaWYgKGNscy5uYW1lID09IFwiSnNFbnZcIikge1xyXG4gICAgICAgIC8vICAgIGNvbnNvbGUubG9nKGBjYWxsIEZpbGVFeGlzdHMoYWFiYi50eHQpOiAkeyhqc09iaiBhcyBhbnkpLmxvYWRlci5GaWxlRXhpc3RzKFwiYWFiYi50eHRcIil9YCk7XHJcbiAgICAgICAgLy8gICAgY29uc29sZS5sb2coYGNhbGwgRmlsZUV4aXN0cyhwdWVydHMvZXNtX2Jvb3RzdHJhcC5janMpOiAkeyhqc09iaiBhcyBhbnkpLmxvYWRlci5GaWxlRXhpc3RzKFwicHVlcnRzL2VzbV9ib290c3RyYXAuY2pzXCIpfWApO1xyXG4gICAgICAgIC8vfVxyXG4gICAgICAgIHJldHVybiBvYmplY3RfcHRyO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3Rocm93X2J5X3N0cmluZyhwaW5mbywgcG1zZykge1xyXG4gICAgICAgIGNvbnN0IG1zZyA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocG1zZyk7XHJcbiAgICAgICAgc2V0TGFzdEV4Y2VwdGlvbihuZXcgRXJyb3IobXNnKSk7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5L2c55So5Z+f566h55CGIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGUocGVudl9yZWYpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50KHBlbnZfcmVmLCBtZW1vcnkpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2hhc19jYXVnaHQocHNjb3BlKSB7XHJcbiAgICAgICAgcmV0dXJuIGhhc0V4Y2VwdGlvbjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfZXhjZXB0aW9uX2FzX3N0cmluZyhwc2NvcGUsIHdpdGhfc3RhY2spIHtcclxuICAgICAgICByZXR1cm4gZ2V0RXhjZXB0aW9uQXNOYXRpdmVTdHJpbmcoZW5naW5lLnVuaXR5QXBpLCB3aXRoX3N0YWNrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jbG9zZV9zY29wZShwc2NvcGUpIHtcclxuICAgICAgICBTY29wZS5leGl0KGVuZ2luZS51bml0eUFwaSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50KHBzY29wZSkge1xyXG4gICAgICAgIFNjb3BlLmV4aXQoZW5naW5lLnVuaXR5QXBpKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlZmVyZW5jZWRWYWx1ZXMgPSBuZXcgU3BhcnNlQXJyYXkoKTtcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmKGVudiwgcHZhbHVlLCBpbnRlcm5hbF9maWVsZF9jb3VudCkge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHB2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHJlZmVyZW5jZWRWYWx1ZXMuYWRkKHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZihwdmFsdWVfcmVmKSB7XHJcbiAgICAgICAgcmVmZXJlbmNlZFZhbHVlcy5yZW1vdmUocHZhbHVlX3JlZik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmKGVudiwgcHZhbHVlX3JlZiwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSByZWZlcmVuY2VkVmFsdWVzLmdldChwdmFsdWVfcmVmKTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCB2YWx1ZSwgcHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCB2YWx1ZSwgcHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9zZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcml2YXRlKGVudiwgcG9iamVjdCwgb3V0X3B0cikge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwb2JqZWN0KTtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgMCwgb3V0X3B0cik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgb2JqWydfX3BfcHJpdmF0ZV9kYXRhJ10sIG91dF9wdHIpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9wcml2YXRlKGVudiwgcG9iamVjdCwgcHRyKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnICYmIHR5cGVvZiBvYmogIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9ialsnX19wX3ByaXZhdGVfZGF0YSddID0gcHRyO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcm9wZXJ0eV91aW50MzIoZW52LCBwb2JqZWN0LCBrZXksIHB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwb2JqZWN0KTtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMjogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAganNWYWx1ZVRvUGFwaVZhbHVlKGVuZ2luZS51bml0eUFwaSwgdmFsdWUsIHB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMihlbnYsIHBvYmplY3QsIGtleSwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcHJvcGVydHlfdWludDMyOiB0YXJnZXQgaXMgbm90IGFuIG9iamVjdFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWHveaVsOiwg+eUqC/miafooYwgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2FsbF9mdW5jdGlvbihlbnYsIHBmdW5jLCB0aGlzX29iamVjdCwgYXJnYywgYXJndiwgcHJlc3VsdCkge1xyXG4gICAgICAgIGNvbnN0IGZ1bmMgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcGZ1bmMpO1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgdGhpc19vYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jYWxsX2Z1bmN0aW9uOiB0YXJnZXQgaXMgbm90IGEgZnVuY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGhlYXAgPSBlbmdpbmUudW5pdHlBcGkuSEVBUFU4O1xyXG4gICAgICAgIGNvbnN0IGFyZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ2M7ICsraSkge1xyXG4gICAgICAgICAgICBjb25zdCBhcmdQdHIgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIGFyZ3YgKyBpICogNCk7XHJcbiAgICAgICAgICAgIGFyZ3MucHVzaChTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgYXJnUHRyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncyk7XHJcbiAgICAgICAgICAgIGpzVmFsdWVUb1BhcGlWYWx1ZShlbmdpbmUudW5pdHlBcGksIHJlc3VsdCwgcHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHNldExhc3RFeGNlcHRpb24oZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8g5ZKMcGVzYXBpLmjlo7DmmI7kuI3kuIDmoLfvvIzov5nmlLnkuLrov5Tlm57lgLzmjIfpkojnlLHosIPnlKjogIXvvIjljp/nlJ/vvInkvKDlhaVcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9ldmFsKGVudiwgcGNvZGUsIGNvZGVfc2l6ZSwgcGF0aCwgcHJlc3VsdCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghZ2xvYmFsVGhpcy5ldmFsKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJldmFsIGlzIG5vdCBzdXBwb3J0ZWRcIik7IC8vIFRPRE86IOaKm+e7mXdhc23mm7TlkIjpgILkuptcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjb2RlID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhwY29kZSwgY29kZV9zaXplKTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZ2xvYmFsVGhpcy5ldmFsKGNvZGUpO1xyXG4gICAgICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCByZXN1bHQsIHByZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBzZXRMYXN0RXhjZXB0aW9uKGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nbG9iYWwoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGdsb2JhbFRoaXMpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9lbnZfcHJpdmF0ZShlbnYsIHB0cikge1xyXG4gICAgICAgIG9iak1hcHBlci5zZXRFbnZQcml2YXRlKHB0cik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfdHJhY2VfbmF0aXZlX29iamVjdF9saWZlY3ljbGUoZW52LCBvbkVudGVyLCBvbkV4aXQpIHtcclxuICAgICAgICBjb25zdCBlbnRlckNhbGxiYWNrID0gZW5naW5lLnVuaXR5QXBpLmdldFdhc21UYWJsZUVudHJ5KG9uRW50ZXIpO1xyXG4gICAgICAgIGNvbnN0IGV4aXRDYWxsYmFjayA9IGVuZ2luZS51bml0eUFwaS5nZXRXYXNtVGFibGVFbnRyeShvbkV4aXQpO1xyXG4gICAgICAgIG9iak1hcHBlci50cmFjZU5hdGl2ZU9iamVjdChlbnRlckNhbGxiYWNrLCBleGl0Q2FsbGJhY2spO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9yZWdpc3RyeShlbnYsIHJlZ2lzdHJ5Xykge1xyXG4gICAgICAgIHJlZ2lzdHJ5ID0gcmVnaXN0cnlfO1xyXG4gICAgfVxyXG4gICAgLypcclxuICAgIGludGVyZmFjZSBBUElJbmZvIHtcclxuICAgICAgICBmdW5jOiBGdW5jdGlvblxyXG4gICAgICAgIHNpZzogc3RyaW5nXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYXBpSW5mbzogQVBJSW5mb1tdID0gW1xyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfY3JlYXRlX2FycmF5LCBzaWc6IFwiaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9jcmVhdGVfb2JqZWN0LCBzaWc6IFwiaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9jcmVhdGVfZnVuY3Rpb24sIHNpZzogXCJpaWlpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX2NyZWF0ZV9jbGFzcywgc2lnOiBcImlpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX2dldF9hcnJheV9sZW5ndGgsIHNpZzogXCJpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9uYXRpdmVfb2JqZWN0X3RvX3ZhbHVlLCBzaWc6IFwiaWlpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV90aHJvd19ieV9zdHJpbmcsIHNpZzogXCJ2aWlcIn0sXHJcbiAgICAgICAgLy97ZnVuYzogcGVzYXBpX29wZW5fc2NvcGUsIHNpZzogXCJpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50LCBzaWc6IFwiaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfaGFzX2NhdWdodCwgc2lnOiBcImlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfZ2V0X2V4Y2VwdGlvbl9hc19zdHJpbmcsIHNpZzogXCJpaWlcIn0sXHJcbiAgICAgICAgLy97ZnVuYzogcGVzYXBpX2Nsb3NlX3Njb3BlLCBzaWc6IFwidmlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9jbG9zZV9zY29wZV9wbGFjZW1lbnQsIHNpZzogXCJ2aVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX2NyZWF0ZV92YWx1ZV9yZWYsIHNpZzogXCJpaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfcmVsZWFzZV92YWx1ZV9yZWYsIHNpZzogXCJ2aVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX2dldF92YWx1ZV9mcm9tX3JlZiwgc2lnOiBcInZpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9nZXRfcHJvcGVydHksIHNpZzogXCJ2aWlpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX3NldF9wcm9wZXJ0eSwgc2lnOiBcInZpaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfZ2V0X3ByaXZhdGUsIHNpZzogXCJpaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfc2V0X3ByaXZhdGUsIHNpZzogXCJpaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMiwgc2lnOiBcInZpaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMiwgc2lnOiBcInZpaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfY2FsbF9mdW5jdGlvbiwgc2lnOiBcInZpaWlpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9ldmFsLCBzaWc6IFwidmlpaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfZ2xvYmFsLCBzaWc6IFwiaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9zZXRfZW52X3ByaXZhdGUsIHNpZzogXCJ2aWlcIn1cclxuICAgIF07XHJcbiAgICAqL1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBHZXRXZWJHTEZGSUFwaTogR2V0V2ViR0xGRklBcGksXHJcbiAgICAgICAgR2V0V2ViR0xQYXBpVmVyc2lvbjogR2V0V2ViR0xQYXBpVmVyc2lvbixcclxuICAgICAgICBDcmVhdGVXZWJHTFBhcGlFbnZSZWY6IENyZWF0ZVdlYkdMUGFwaUVudlJlZixcclxuICAgICAgICBwZXNhcGlfY3JlYXRlX2FycmF5X2pzOiBwZXNhcGlfY3JlYXRlX2FycmF5LFxyXG4gICAgICAgIHBlc2FwaV9jcmVhdGVfb2JqZWN0X2pzOiBwZXNhcGlfY3JlYXRlX29iamVjdCxcclxuICAgICAgICBwZXNhcGlfY3JlYXRlX2Z1bmN0aW9uX2pzOiBwZXNhcGlfY3JlYXRlX2Z1bmN0aW9uLFxyXG4gICAgICAgIHBlc2FwaV9jcmVhdGVfY2xhc3NfanM6IHBlc2FwaV9jcmVhdGVfY2xhc3MsXHJcbiAgICAgICAgcGVzYXBpX2dldF9hcnJheV9sZW5ndGhfanM6IHBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoLFxyXG4gICAgICAgIHBlc2FwaV9uYXRpdmVfb2JqZWN0X3RvX3ZhbHVlX2pzOiBwZXNhcGlfbmF0aXZlX29iamVjdF90b192YWx1ZSxcclxuICAgICAgICBwZXNhcGlfdGhyb3dfYnlfc3RyaW5nX2pzOiBwZXNhcGlfdGhyb3dfYnlfc3RyaW5nLFxyXG4gICAgICAgIHBlc2FwaV9vcGVuX3Njb3BlX3BsYWNlbWVudF9qczogcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50LFxyXG4gICAgICAgIHBlc2FwaV9oYXNfY2F1Z2h0X2pzOiBwZXNhcGlfaGFzX2NhdWdodCxcclxuICAgICAgICBwZXNhcGlfZ2V0X2V4Y2VwdGlvbl9hc19zdHJpbmdfanM6IHBlc2FwaV9nZXRfZXhjZXB0aW9uX2FzX3N0cmluZyxcclxuICAgICAgICBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50X2pzOiBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50LFxyXG4gICAgICAgIHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmX2pzOiBwZXNhcGlfY3JlYXRlX3ZhbHVlX3JlZixcclxuICAgICAgICBwZXNhcGlfcmVsZWFzZV92YWx1ZV9yZWZfanM6IHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZixcclxuICAgICAgICBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmX2pzOiBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmLFxyXG4gICAgICAgIHBlc2FwaV9nZXRfcHJvcGVydHlfanM6IHBlc2FwaV9nZXRfcHJvcGVydHksXHJcbiAgICAgICAgcGVzYXBpX3NldF9wcm9wZXJ0eV9qczogcGVzYXBpX3NldF9wcm9wZXJ0eSxcclxuICAgICAgICBwZXNhcGlfZ2V0X3ByaXZhdGVfanM6IHBlc2FwaV9nZXRfcHJpdmF0ZSxcclxuICAgICAgICBwZXNhcGlfc2V0X3ByaXZhdGVfanM6IHBlc2FwaV9zZXRfcHJpdmF0ZSxcclxuICAgICAgICBwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMl9qczogcGVzYXBpX2dldF9wcm9wZXJ0eV91aW50MzIsXHJcbiAgICAgICAgcGVzYXBpX3NldF9wcm9wZXJ0eV91aW50MzJfanM6IHBlc2FwaV9zZXRfcHJvcGVydHlfdWludDMyLFxyXG4gICAgICAgIHBlc2FwaV9jYWxsX2Z1bmN0aW9uX2pzOiBwZXNhcGlfY2FsbF9mdW5jdGlvbixcclxuICAgICAgICBwZXNhcGlfZXZhbF9qczogcGVzYXBpX2V2YWwsXHJcbiAgICAgICAgcGVzYXBpX2dsb2JhbF9qczogcGVzYXBpX2dsb2JhbCxcclxuICAgICAgICBwZXNhcGlfc2V0X2Vudl9wcml2YXRlX2pzOiBwZXNhcGlfc2V0X2Vudl9wcml2YXRlLFxyXG4gICAgICAgIHBlc2FwaV90cmFjZV9uYXRpdmVfb2JqZWN0X2xpZmVjeWNsZV9qczogcGVzYXBpX3RyYWNlX25hdGl2ZV9vYmplY3RfbGlmZWN5Y2xlLFxyXG4gICAgICAgIHBlc2FwaV9zZXRfcmVnaXN0cnlfanM6IHBlc2FwaV9zZXRfcmVnaXN0cnlcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5XZWJHTEZGSUFwaSA9IFdlYkdMRkZJQXBpO1xyXG5mdW5jdGlvbiBHZXRXZWJHTEZGSUFwaSgpIHtcclxuICAgIGlmICh3ZWJnbEZGSSlcclxuICAgICAgICByZXR1cm4gd2ViZ2xGRkk7XHJcbiAgICB3ZWJnbEZGSSA9IHdhc21BcGkuSW5qZWN0UGFwaUdMTmF0aXZlSW1wbCgpO1xyXG4gICAgcmV0dXJuIHdlYmdsRkZJO1xyXG59XHJcbmZ1bmN0aW9uIEdldFdlYkdMUGFwaVZlcnNpb24oKSB7XHJcbiAgICByZXR1cm4gMTE7XHJcbn1cclxuZnVuY3Rpb24gQ3JlYXRlV2ViR0xQYXBpRW52UmVmKCkge1xyXG4gICAgcmV0dXJuIDIwNDg7IC8vIGp1c3Qgbm90IG51bGxwdHJcclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1wZXNhcGlJbXBsLmpzLm1hcCIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbi8qKlxyXG4gKiDmoLnmja4gaHR0cHM6Ly9kb2NzLnVuaXR5M2QuY29tLzIwMTguNC9Eb2N1bWVudGF0aW9uL01hbnVhbC93ZWJnbC1pbnRlcmFjdGluZ3dpdGhicm93c2Vyc2NyaXB0aW5nLmh0bWxcclxuICog5oiR5Lus55qE55uu55qE5bCx5piv5ZyoV2ViR0zmqKHlvI/kuIvvvIzlrp7njrDlkoxwdWVydHMuZGxs55qE5pWI5p6c44CC5YW35L2T5Zyo5LqO5a6e546w5LiA5LiqanNsaWLvvIzph4zpnaLlupTljIXlkKtQdWVydHNETEwuY3PnmoTmiYDmnInmjqXlj6NcclxuICog5a6e6aqM5Y+R546w6L+Z5LiqanNsaWLomb3nhLbkuZ/mmK/ov5DooYzlnKh2OOeahGpz77yM5L2G5a+5ZGV2dG9vbOiwg+ivleW5tuS4jeWPi+Wlve+8jOS4lOWPquaUr+aMgeWIsGVzNeOAglxyXG4gKiDlm6DmraTlupTor6XpgJrov4fkuIDkuKrni6znq4vnmoRqc+WunueOsOaOpeWPo++8jHB1ZXJ0cy5qc2xpYumAmui/h+WFqOWxgOeahOaWueW8j+iwg+eUqOWug+OAglxyXG4gKlxyXG4gKiDmnIDnu4jlvaLmiJDlpoLkuIvmnrbmnoRcclxuICog5Lia5YqhSlMgPC0+IFdBU00gPC0+IHVuaXR5IGpzbGliIDwtPiDmnKxqc1xyXG4gKiDkvYbmlbTmnaHpk77ot6/lhbblrp7pg73lnKjkuIDkuKp2OChqc2NvcmUp6Jma5ouf5py66YeMXHJcbiAqL1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi9saWJyYXJ5XCIpO1xyXG5jb25zdCBnZXRGcm9tSlNBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL2dldEZyb21KU0FyZ3VtZW50XCIpO1xyXG5jb25zdCBnZXRGcm9tSlNSZXR1cm5fMSA9IHJlcXVpcmUoXCIuL21peGlucy9nZXRGcm9tSlNSZXR1cm5cIik7XHJcbmNvbnN0IHJlZ2lzdGVyXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvcmVnaXN0ZXJcIik7XHJcbmNvbnN0IHNldFRvSW52b2tlSlNBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSW52b2tlSlNBcmd1bWVudFwiKTtcclxuY29uc3Qgc2V0VG9KU0ludm9rZVJldHVybl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSlNJbnZva2VSZXR1cm5cIik7XHJcbmNvbnN0IHNldFRvSlNPdXRBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSlNPdXRBcmd1bWVudFwiKTtcclxuY29uc3QgcGVzYXBpSW1wbF8xID0gcmVxdWlyZShcIi4vcGVzYXBpSW1wbFwiKTtcclxubGlicmFyeV8xLmdsb2JhbC53eFJlcXVpcmUgPSBsaWJyYXJ5XzEuZ2xvYmFsLnJlcXVpcmU7XHJcbmxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wgPSB7XHJcbiAgICBpbml0ZWQ6IGZhbHNlLFxyXG4gICAgZGVidWc6IGZhbHNlLFxyXG4gICAgLy8gcHVlcnRz6aaW5qyh5Yid5aeL5YyW5pe25Lya6LCD55So6L+Z6YeM77yM5bm25oqKVW5pdHnnmoTpgJrkv6HmjqXlj6PkvKDlhaVcclxuICAgIEluaXQoY3RvclBhcmFtKSB7XHJcbiAgICAgICAgY29uc3QgZW5naW5lID0gbmV3IGxpYnJhcnlfMS5QdWVydHNKU0VuZ2luZShjdG9yUGFyYW0pO1xyXG4gICAgICAgIGNvbnN0IGV4ZWN1dGVNb2R1bGVDYWNoZSA9IHt9O1xyXG4gICAgICAgIGxldCBqc0VuZ2luZVJldHVybmVkID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IGxvYWRlcjtcclxuICAgICAgICAvLyBQdWVydHNETEznmoTmiYDmnInmjqXlj6Plrp7njrBcclxuICAgICAgICBsaWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMID0gT2JqZWN0LmFzc2lnbihsaWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMLCB7XHJcbiAgICAgICAgICAgIHVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzOiBlbmdpbmUudXBkYXRlR2xvYmFsQnVmZmVyQW5kVmlld3MuYmluZChlbmdpbmUpXHJcbiAgICAgICAgfSwgKDAsIGdldEZyb21KU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIGdldEZyb21KU1JldHVybl8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBzZXRUb0ludm9rZUpTQXJndW1lbnRfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU0ludm9rZVJldHVybl8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBzZXRUb0pTT3V0QXJndW1lbnRfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgcmVnaXN0ZXJfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgcGVzYXBpSW1wbF8xLldlYkdMRkZJQXBpKShlbmdpbmUpLCB7XHJcbiAgICAgICAgICAgIC8vIGJyaWRnZUxvZzogdHJ1ZSxcclxuICAgICAgICAgICAgR2V0TGliVmVyc2lvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDM1O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRBcGlMZXZlbDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDM1O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRMaWJCYWNrZW5kOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSlNFbmdpbmU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChqc0VuZ2luZVJldHVybmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwib25seSBvbmUgYXZhaWxhYmxlIGpzRW52IGlzIGFsbG93ZWQgaW4gV2ViR0wgbW9kZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGpzRW5naW5lUmV0dXJuZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENyZWF0ZUpTRW5naW5lV2l0aEV4dGVybmFsRW52OiBmdW5jdGlvbiAoKSB7IH0sXHJcbiAgICAgICAgICAgIERlc3Ryb3lKU0VuZ2luZTogZnVuY3Rpb24gKCkgeyB9LFxyXG4gICAgICAgICAgICBHZXRMYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKGlzb2xhdGUsIC8qIG91dCBpbnQgKi8gc3RybGVuKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZW5naW5lLmxhc3RFeGNlcHRpb24gPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdudWxsJztcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZW5naW5lLmxhc3RFeGNlcHRpb24gPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd1bmRlZmluZWQnO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZW5naW5lLmxhc3RFeGNlcHRpb24uc3RhY2ssIHN0cmxlbik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIExvd01lbW9yeU5vdGlmaWNhdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgSWRsZU5vdGlmaWNhdGlvbkRlYWRsaW5lOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBSZXF1ZXN0TWlub3JHYXJiYWdlQ29sbGVjdGlvbkZvclRlc3Rpbmc6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFJlcXVlc3RGdWxsR2FyYmFnZUNvbGxlY3Rpb25Gb3JUZXN0aW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBTZXRHZW5lcmFsRGVzdHJ1Y3RvcjogZnVuY3Rpb24gKGlzb2xhdGUsIF9nZW5lcmFsRGVzdHJ1Y3Rvcikge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmdlbmVyYWxEZXN0cnVjdG9yID0gX2dlbmVyYWxEZXN0cnVjdG9yO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRNb2R1bGVFeGVjdXRvcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbG9hZGVyID0gdHlwZW9mIF9fdGdqc0dldExvYWRlciAhPSAndW5kZWZpbmVkJyA/IF9fdGdqc0dldExvYWRlcigpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvYWRlclJlc29sdmUgPSBsb2FkZXIuUmVzb2x2ZSA/IChmdW5jdGlvbiAoZmlsZU5hbWUsIHRvID0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkTmFtZSA9IGxvYWRlci5SZXNvbHZlKGZpbGVOYW1lLCB0byk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZE5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtb2R1bGUgbm90IGZvdW5kOiAnICsgZmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZWROYW1lO1xyXG4gICAgICAgICAgICAgICAgfSkgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgdmFyIGpzZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jdGlvbiAoZmlsZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoWydwdWVydHMvbG9nLm1qcycsICdwdWVydHMvdGltZXIubWpzJ10uaW5kZXhPZihmaWxlTmFtZSkgIT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVyUmVzb2x2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlTmFtZSA9IGxvYWRlclJlc29sdmUoZmlsZU5hbWUsIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHd4UmVxdWlyZSgncHVlcnRzX21pbmlnYW1lX2pzX3Jlc291cmNlcy8nICsgKGZpbGVOYW1lLmVuZHNXaXRoKCcuanMnKSA/IGZpbGVOYW1lIDogZmlsZU5hbWUgKyBcIi5qc1wiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBub3JtYWxpemUobmFtZSwgdG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgQ1MgIT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTLlB1ZXJ0cy5QYXRoSGVscGVyLklzUmVsYXRpdmUodG8pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldCA9IENTLlB1ZXJ0cy5QYXRoSGVscGVyLm5vcm1hbGl6ZShDUy5QdWVydHMuUGF0aEhlbHBlci5EaXJuYW1lKG5hbWUpICsgXCIvXCIgKyB0byk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRvO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG1vY2tSZXF1aXJlKHNwZWNpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBleHBvcnRzOiB7fSB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmRDYWNoZVNwZWNpZmllciA9IHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBleGVjdXRlTW9kdWxlQ2FjaGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kQ2FjaGVTcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuZXhwb3J0cyA9IGV4ZWN1dGVNb2R1bGVDYWNoZVtmb3VuZENhY2hlU3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIFBVRVJUU19KU19SRVNPVVJDRVMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZm91bmRTcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtb2R1bGUgbm90IGZvdW5kOiAnICsgc3BlY2lmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY2lmaWVyID0gZm91bmRTcGVjaWZpZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQVUVSVFNfSlNfUkVTT1VSQ0VTW3NwZWNpZmllcl0ocmVzdWx0LmV4cG9ydHMsIGZ1bmN0aW9uIG1SZXF1aXJlKHNwZWNpZmllclRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9ja1JlcXVpcmUobG9hZGVyUmVzb2x2ZSA/IGxvYWRlclJlc29sdmUoc3BlY2lmaWVyVG8sIHNwZWNpZmllcikgOiBub3JtYWxpemUoc3BlY2lmaWVyLCBzcGVjaWZpZXJUbykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gcmVzdWx0LmV4cG9ydHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LmV4cG9ydHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRyeUZpbmROYW1lID0gW3NwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5pbmRleE9mKCcuJykgPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeUZpbmROYW1lID0gdHJ5RmluZE5hbWUuY29uY2F0KFtzcGVjaWZpZXIgKyAnLmpzJywgc3BlY2lmaWVyICsgJy50cycsIHNwZWNpZmllciArICcubWpzJywgc3BlY2lmaWVyICsgJy5tdHMnXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpbmRlZCA9IHRyeUZpbmROYW1lLnJlZHVjZSgocmV0LCBuYW1lLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmV0ICE9PSBmYWxzZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuYW1lIGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ialtuYW1lXSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNpcmN1bGFyIGRlcGVuZGVuY3kgaXMgZGV0ZWN0ZWQgd2hlbiByZXF1aXJpbmcgXCIke25hbWV9XCJgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbmRleDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaW5kZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyeUZpbmROYW1lW2ZpbmRlZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcXVpcmVSZXQgPSBtb2NrUmVxdWlyZShmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1aXJlUmV0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0SlNPYmplY3RWYWx1ZUdldHRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGpzZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jdGlvbiAob2JqLCBrZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqW2tleV07XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEV2YWw6IGZ1bmN0aW9uIChpc29sYXRlLCBjb2RlU3RyaW5nLCBwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbGlicmFyeV8xLmdsb2JhbC5ldmFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImV2YWwgaXMgbm90IHN1cHBvcnRlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29kZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoY29kZVN0cmluZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gbGlicmFyeV8xLmdsb2JhbC5ldmFsKGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiBnZXRJbnRQdHJNYW5hZ2VyKCkuR2V0UG9pbnRlckZvckpTVmFsdWUocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAvKkZSZXN1bHRJbmZvICovIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0RXhjZXB0aW9uID0gZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgU2V0UHVzaEpTRnVuY3Rpb25Bcmd1bWVudHNDYWxsYmFjazogZnVuY3Rpb24gKGlzb2xhdGUsIGNhbGxiYWNrLCBqc0VudklkeCkge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLkdldEpTQXJndW1lbnRzQ2FsbGJhY2sgPSBjYWxsYmFjaztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgVGhyb3dFeGNlcHRpb246IGZ1bmN0aW9uIChpc29sYXRlLCAvKmJ5dGVbXSAqLyBtZXNzYWdlU3RyaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhtZXNzYWdlU3RyaW5nKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEludm9rZUpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGhhc1Jlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnVuYyBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IGZ1bmMuaW52b2tlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMubGFzdEV4Y2VwdGlvbiA9IGVycjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwdHIgaXMgbm90IGEganNmdW5jJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEZ1bmN0aW9uTGFzdEV4Y2VwdGlvbkluZm86IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZ1bmMgaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmdW5jLmxhc3RFeGNlcHRpb24gPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnbnVsbCc7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmdW5jLmxhc3RFeGNlcHRpb24gPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAndW5kZWZpbmVkJztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhmdW5jLmxhc3RFeGNlcHRpb24uc3RhY2sgfHwgZnVuYy5sYXN0RXhjZXB0aW9uLm1lc3NhZ2UgfHwgJycsIGxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVsZWFzZUpTRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBfZnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlbW92ZUpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlbGVhc2VKU09iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIG9iaikge1xyXG4gICAgICAgICAgICAgICAgbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVtb3ZlSlNPYmplY3RCeUlkKG9iaik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlc2V0UmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IG51bGw7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENsZWFyTW9kdWxlQ2FjaGU6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSW5zcGVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgcG9ydCkgeyB9LFxyXG4gICAgICAgICAgICBEZXN0cm95SW5zcGVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBJbnNwZWN0b3JUaWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBMb2dpY1RpY2s6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFNldExvZ0NhbGxiYWNrOiBmdW5jdGlvbiAobG9nLCBsb2dXYXJuaW5nLCBsb2dFcnJvcikge1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRKU1N0YWNrVHJhY2U6IGZ1bmN0aW9uIChpc29sYXRlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKCkuc3RhY2s7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldFdlYkdMUGFwaUVudlJlZjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDIwNDg7IC8vIGp1c3Qgbm90IG51bGxwdHJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=