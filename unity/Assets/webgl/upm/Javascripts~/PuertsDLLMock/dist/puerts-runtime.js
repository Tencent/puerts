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
        const { UTF8ToString, UTF16ToString, _malloc, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, stringToUTF16, lengthBytesUTF16, stackSave, stackRestore, stackAlloc, getWasmTableEntry, addFunction, removeFunction, _CallCSharpFunctionCallback, _CallCSharpConstructorCallback, _CallCSharpDestructorCallback, InjectPapiGLNativeImpl, PApiCallbackWithScope, PApiConstructorWithScope, HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64, } = ctorParam;
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
exports.WebGLRegsterApi = exports.WebGLFFIApi = void 0;
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
        pesapi_set_env_private_js: pesapi_set_env_private
    };
}
exports.WebGLFFIApi = WebGLFFIApi;
function GetWebGLFFIApi(engine) {
    if (webglFFI)
        return webglFFI;
    webglFFI = engine.unityApi.InjectPapiGLNativeImpl();
    return webglFFI;
}
function WebGLRegsterApi(engine) {
    GetWebGLFFIApi(engine); // 让webglFFI可用，否则注册genJsCallback传入的webglFFI是undefined
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
                const scope = Scope.enter();
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
                    scope.close(engine.unityApi);
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
            //console.log(`pesapi_define_class: ${name} ${typeId} ${superTypeId}`);
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
        }, (0, getFromJSArgument_1.default)(engine), (0, getFromJSReturn_1.default)(engine), (0, setToInvokeJSArgument_1.default)(engine), (0, setToJSInvokeReturn_1.default)(engine), (0, setToJSOutArgument_1.default)(engine), (0, register_1.default)(engine), (0, pesapiImpl_1.WebGLRegsterApi)(engine), (0, pesapiImpl_1.WebGLFFIApi)(engine), {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVlcnRzLXJ1bnRpbWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLG1CQUFtQixHQUFHLGtCQUFrQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixHQUFHLGlCQUFpQixHQUFHLGlCQUFpQixHQUFHLGdCQUFnQjtBQUM3WjtBQUNBO0FBQ0EsMkJBQTJCLE1BQU0sMkJBQTJCLE1BQU07QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixrQkFBa0IsNkJBQTZCLE1BQU07QUFDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsa0JBQWtCLGFBQWEsY0FBYyxTQUFTLFFBQVEsVUFBVSxNQUFNO0FBQ3JHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsS0FBSyxTQUFTLEtBQUssVUFBVSxNQUFNO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUM1SGE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsUUFBUTtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzREFBc0Q7QUFDdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEVBQTBFO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEVBQTBFO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEVBQTBFO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QyxRQUFRO0FBQ3JEO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLGdCQUFnQjtBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtREFBbUQsTUFBTTtBQUN6RDtBQUNBLGdCQUFnQix5QkFBeUI7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRkFBa0Y7QUFDbEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCO0FBQy9CO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRDtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCO0FBQy9CO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRDtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxREFBcUQsV0FBVztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixVQUFVO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlDQUF5QztBQUN6Qyw2REFBNkQ7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQ7QUFDMUQsZ0VBQWdFO0FBQ2hFLHlFQUF5RTtBQUN6RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQyxTQUFTO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELDZDQUE2QztBQUNyRyx3RUFBd0UsNkRBQTZEO0FBQ3JJO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLFVBQVU7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMERBQTBEO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxxQ0FBcUM7QUFD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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsNkNBQTZDO0FBQzdDLHlEQUF5RDtBQUN6RCxvREFBb0Q7QUFDcEQsaURBQWlEO0FBQ2pELDZDQUE2QztBQUM3QztBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxpQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL291dHB1dC9idWZmZXIuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2xpYnJhcnkuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9nZXRGcm9tSlNBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL2dldEZyb21KU1JldHVybi5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3JlZ2lzdGVyLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9JbnZva2VKU0FyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9KU0ludm9rZVJldHVybi5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSlNPdXRBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvcGVzYXBpSW1wbC5qcyIsIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG4vKlxyXG4qIFRlbmNlbnQgaXMgcGxlYXNlZCB0byBzdXBwb3J0IHRoZSBvcGVuIHNvdXJjZSBjb21tdW5pdHkgYnkgbWFraW5nIFB1ZXJ0cyBhdmFpbGFibGUuXHJcbiogQ29weXJpZ2h0IChDKSAyMDIwIFRITCBBMjkgTGltaXRlZCwgYSBUZW5jZW50IGNvbXBhbnkuICBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qIFB1ZXJ0cyBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNEIDMtQ2xhdXNlIExpY2Vuc2UsIGV4Y2VwdCBmb3IgdGhlIHRoaXJkLXBhcnR5IGNvbXBvbmVudHMgbGlzdGVkIGluIHRoZSBmaWxlICdMSUNFTlNFJyB3aGljaCBtYXkgYmUgc3ViamVjdCB0byB0aGVpciBjb3JyZXNwb25kaW5nIGxpY2Vuc2UgdGVybXMuXHJcbiogVGhpcyBmaWxlIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIGFuZCBjb25kaXRpb25zIGRlZmluZWQgaW4gZmlsZSAnTElDRU5TRScsIHdoaWNoIGlzIHBhcnQgb2YgdGhpcyBzb3VyY2UgY29kZSBwYWNrYWdlLlxyXG4qL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMud3JpdGVEb3VibGUgPSBleHBvcnRzLndyaXRlRmxvYXQgPSBleHBvcnRzLndyaXRlVUludDY0ID0gZXhwb3J0cy53cml0ZUludDY0ID0gZXhwb3J0cy53cml0ZVVJbnQzMiA9IGV4cG9ydHMud3JpdGVJbnQzMiA9IGV4cG9ydHMud3JpdGVVSW50MTYgPSBleHBvcnRzLndyaXRlSW50MTYgPSBleHBvcnRzLndyaXRlVUludDggPSBleHBvcnRzLndyaXRlSW50OCA9IGV4cG9ydHMucmVhZERvdWJsZSA9IGV4cG9ydHMucmVhZEZsb2F0ID0gZXhwb3J0cy5yZWFkVUludDY0ID0gZXhwb3J0cy5yZWFkSW50NjQgPSBleHBvcnRzLnJlYWRVSW50MzIgPSBleHBvcnRzLnJlYWRJbnQzMiA9IGV4cG9ydHMucmVhZFVJbnQxNiA9IGV4cG9ydHMucmVhZEludDE2ID0gZXhwb3J0cy5yZWFkVUludDggPSBleHBvcnRzLnJlYWRJbnQ4ID0gdm9pZCAwO1xyXG5mdW5jdGlvbiB2YWxpZGF0ZU51bWJlcih2YWx1ZSwgdHlwZSkge1xyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZX0gZXhwZWN0cyBhIG51bWJlciBidXQgZ290ICR7dmFsdWV9YCk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gYm91bmRzRXJyb3IodmFsdWUsIGxlbmd0aCwgdHlwZSkge1xyXG4gICAgaWYgKE1hdGguZmxvb3IodmFsdWUpICE9PSB2YWx1ZSkge1xyXG4gICAgICAgIHZhbGlkYXRlTnVtYmVyKHZhbHVlLCB0eXBlIHx8ICdvZmZzZXQnKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dHlwZSB8fCAnb2Zmc2V0J30gZXhwZWN0cyBhbiBpbnRlZ2VyIGJ1dCBnb3QgJHt2YWx1ZX1gKTtcclxuICAgIH1cclxuICAgIGlmIChsZW5ndGggPCAwKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwib3V0IG9mIGJvdW5kXCIpO1xyXG4gICAgfVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKGAke3R5cGUgfHwgJ29mZnNldCd9IGV4cGVjdHMgPj0gJHt0eXBlID8gMSA6IDB9IGFuZCA8PSAke2xlbmd0aH0gYnV0IGdvdCAke3ZhbHVlfWApO1xyXG59XHJcbmZ1bmN0aW9uIGNoZWNrQm91bmRzKGJ1Ziwgb2Zmc2V0LCBieXRlTGVuZ3RoKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGlmIChidWZbb2Zmc2V0XSA9PT0gdW5kZWZpbmVkIHx8IGJ1ZltvZmZzZXQgKyBieXRlTGVuZ3RoXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWYubGVuZ3RoIC0gKGJ5dGVMZW5ndGggKyAxKSk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gd3JpdGVVX0ludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBtaW4sIG1heCkge1xyXG4gICAgdmFsdWUgPSArdmFsdWU7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdmFsdWUgZXhwZWN0cyA+PSAke21pbn0gYW5kIDw9ICR7bWF4fSBidXQgZ290ICR7dmFsdWV9YCk7XHJcbiAgICB9XHJcbiAgICBpZiAoYnVmW29mZnNldF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmLmxlbmd0aCAtIDEpO1xyXG4gICAgfVxyXG4gICAgYnVmW29mZnNldF0gPSB2YWx1ZTtcclxuICAgIHJldHVybiBvZmZzZXQgKyAxO1xyXG59XHJcbmZ1bmN0aW9uIHJlYWRJbnQ4KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgdmFsID0gYnVmZltvZmZzZXRdO1xyXG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDEpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbCB8ICh2YWwgJiAyICoqIDcpICogMHgxZmZmZmZlO1xyXG59XHJcbmV4cG9ydHMucmVhZEludDggPSByZWFkSW50ODtcclxuZnVuY3Rpb24gd3JpdGVJbnQ4KGJ1ZiwgdmFsdWUsIG9mZnNldCA9IDApIHtcclxuICAgIHJldHVybiB3cml0ZVVfSW50OChidWYsIHZhbHVlLCBvZmZzZXQsIC0weDgwLCAweDdmKTtcclxufVxyXG5leHBvcnRzLndyaXRlSW50OCA9IHdyaXRlSW50ODtcclxuZnVuY3Rpb24gcmVhZFVJbnQ4KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgdmFsID0gYnVmZltvZmZzZXRdO1xyXG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDEpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbDtcclxufVxyXG5leHBvcnRzLnJlYWRVSW50OCA9IHJlYWRVSW50ODtcclxuZnVuY3Rpb24gd3JpdGVVSW50OChidWYsIHZhbHVlLCBvZmZzZXQgPSAwKSB7XHJcbiAgICByZXR1cm4gd3JpdGVVX0ludDgoYnVmLCB2YWx1ZSwgb2Zmc2V0LCAwLCAweGZmKTtcclxufVxyXG5leHBvcnRzLndyaXRlVUludDggPSB3cml0ZVVJbnQ4O1xyXG5jb25zdCBpbnQxNkFycmF5ID0gbmV3IEludDE2QXJyYXkoMSk7XHJcbmNvbnN0IHVJbnQ4SW50NkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoaW50MTZBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkSW50MTYoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDFdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDIpO1xyXG4gICAgfVxyXG4gICAgdUludDhJbnQ2QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVJbnQ4SW50NkFycmF5WzFdID0gbGFzdDtcclxuICAgIHJldHVybiBpbnQxNkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZEludDE2ID0gcmVhZEludDE2O1xyXG5mdW5jdGlvbiB3cml0ZUludDE2KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMSk7XHJcbiAgICBpbnQxNkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEludDZBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhJbnQ2QXJyYXlbMV07XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVJbnQxNiA9IHdyaXRlSW50MTY7XHJcbmNvbnN0IHVpbnQxNkFycmF5ID0gbmV3IFVpbnQxNkFycmF5KDEpO1xyXG5jb25zdCB1aW50OFVpbnQxNkFycmF5ID0gbmV3IFVpbnQ4QXJyYXkodWludDE2QXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZFVJbnQxNihidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgMV07XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gMik7XHJcbiAgICB9XHJcbiAgICB1aW50OFVpbnQxNkFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OFVpbnQxNkFycmF5WzFdID0gbGFzdDtcclxuICAgIHJldHVybiB1aW50MTZBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRVSW50MTYgPSByZWFkVUludDE2O1xyXG5mdW5jdGlvbiB3cml0ZVVJbnQxNihidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDEpO1xyXG4gICAgdWludDE2QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDE2QXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4VWludDE2QXJyYXlbMV07XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVVSW50MTYgPSB3cml0ZVVJbnQxNjtcclxuY29uc3QgaW50MzJBcnJheSA9IG5ldyBJbnQzMkFycmF5KDEpO1xyXG5jb25zdCB1aW50OEludDMyQXJyYXkgPSBuZXcgVWludDhBcnJheShpbnQzMkFycmF5LmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHJlYWRJbnQzMihidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWxpZGF0ZU51bWJlcihvZmZzZXQsICdvZmZzZXQnKTtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgM107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gNCk7XHJcbiAgICB9XHJcbiAgICB1aW50OEludDMyQXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4SW50MzJBcnJheVsxXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhJbnQzMkFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEludDMyQXJyYXlbM10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGludDMyQXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkSW50MzIgPSByZWFkSW50MzI7XHJcbmZ1bmN0aW9uIHdyaXRlSW50MzIoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCAzKTtcclxuICAgIGludDMyQXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4SW50MzJBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhJbnQzMkFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEludDMyQXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4SW50MzJBcnJheVszXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZUludDMyID0gd3JpdGVJbnQzMjtcclxuY29uc3QgdWludDMyQXJyYXkgPSBuZXcgVWludDMyQXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4VWludDMyQXJyYXkgPSBuZXcgVWludDhBcnJheSh1aW50MzJBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkVUludDMyKGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbGlkYXRlTnVtYmVyKG9mZnNldCwgJ29mZnNldCcpO1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyAzXTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA0KTtcclxuICAgIH1cclxuICAgIHVpbnQ4VWludDMyQXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVpbnQ4VWludDMyQXJyYXlbMV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4VWludDMyQXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4VWludDMyQXJyYXlbM10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIHVpbnQzMkFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZFVJbnQzMiA9IHJlYWRVSW50MzI7XHJcbmZ1bmN0aW9uIHdyaXRlVUludDMyKGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gK3ZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgMyk7XHJcbiAgICB1aW50MzJBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MzJBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MzJBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MzJBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhVaW50MzJBcnJheVszXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZVVJbnQzMiA9IHdyaXRlVUludDMyO1xyXG5jb25zdCBmbG9hdDMyQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KDEpO1xyXG5jb25zdCB1SW50OEZsb2F0MzJBcnJheSA9IG5ldyBVaW50OEFycmF5KGZsb2F0MzJBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkRmxvYXQoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsaWRhdGVOdW1iZXIob2Zmc2V0LCAnb2Zmc2V0Jyk7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDNdO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDQpO1xyXG4gICAgfVxyXG4gICAgdUludDhGbG9hdDMyQXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVJbnQ4RmxvYXQzMkFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0MzJBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDMyQXJyYXlbM10gPSBsYXN0O1xyXG4gICAgcmV0dXJuIGZsb2F0MzJBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRGbG9hdCA9IHJlYWRGbG9hdDtcclxuZnVuY3Rpb24gd3JpdGVGbG9hdChidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9ICt2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDMpO1xyXG4gICAgZmxvYXQzMkFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0MzJBcnJheVswXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDMyQXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQzMkFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0MzJBcnJheVszXTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZUZsb2F0ID0gd3JpdGVGbG9hdDtcclxuY29uc3QgZmxvYXQ2NEFycmF5ID0gbmV3IEZsb2F0NjRBcnJheSgxKTtcclxuY29uc3QgdUludDhGbG9hdDY0QXJyYXkgPSBuZXcgVWludDhBcnJheShmbG9hdDY0QXJyYXkuYnVmZmVyKTtcclxuZnVuY3Rpb24gcmVhZERvdWJsZShidWZmLCBvZmZzZXQgPSAwKSB7XHJcbiAgICBjb25zdCBmaXJzdCA9IGJ1ZmZbb2Zmc2V0XTtcclxuICAgIGNvbnN0IGxhc3QgPSBidWZmW29mZnNldCArIDddO1xyXG4gICAgaWYgKGZpcnN0ID09PSB1bmRlZmluZWQgfHwgbGFzdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYm91bmRzRXJyb3Iob2Zmc2V0LCBidWZmLmxlbmd0aCAtIDgpO1xyXG4gICAgfVxyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbMF0gPSBmaXJzdDtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVsyXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbM10gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzRdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1SW50OEZsb2F0NjRBcnJheVs1XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdUludDhGbG9hdDY0QXJyYXlbNl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVJbnQ4RmxvYXQ2NEFycmF5WzddID0gbGFzdDtcclxuICAgIHJldHVybiBmbG9hdDY0QXJyYXlbMF07XHJcbn1cclxuZXhwb3J0cy5yZWFkRG91YmxlID0gcmVhZERvdWJsZTtcclxuZnVuY3Rpb24gd3JpdGVEb3VibGUoYnVmZiwgdmFsLCBvZmZzZXQgPSAwKSB7XHJcbiAgICB2YWwgPSArdmFsO1xyXG4gICAgY2hlY2tCb3VuZHMoYnVmZiwgb2Zmc2V0LCA3KTtcclxuICAgIGZsb2F0NjRBcnJheVswXSA9IHZhbDtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzFdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVsyXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbM107XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzRdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1SW50OEZsb2F0NjRBcnJheVs1XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdUludDhGbG9hdDY0QXJyYXlbNl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVJbnQ4RmxvYXQ2NEFycmF5WzddO1xyXG4gICAgcmV0dXJuIG9mZnNldDtcclxufVxyXG5leHBvcnRzLndyaXRlRG91YmxlID0gd3JpdGVEb3VibGU7XHJcbmNvbnN0IGJpZ0ludDY0QXJyYXkgPSBuZXcgQmlnSW50NjRBcnJheSgxKTtcclxuY29uc3QgdWludDhCaWdJbnQ2NEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYmlnSW50NjRBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkSW50NjQoYnVmZiwgb2Zmc2V0ID0gMCkge1xyXG4gICAgY29uc3QgZmlyc3QgPSBidWZmW29mZnNldF07XHJcbiAgICBjb25zdCBsYXN0ID0gYnVmZltvZmZzZXQgKyA3XTtcclxuICAgIGlmIChmaXJzdCA9PT0gdW5kZWZpbmVkIHx8IGxhc3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGJvdW5kc0Vycm9yKG9mZnNldCwgYnVmZi5sZW5ndGggLSA4KTtcclxuICAgIH1cclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVswXSA9IGZpcnN0O1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbMl0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVszXSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzRdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ0ludDY0QXJyYXlbNV0gPSBidWZmWysrb2Zmc2V0XTtcclxuICAgIHVpbnQ4QmlnSW50NjRBcnJheVs2XSA9IGJ1ZmZbKytvZmZzZXRdO1xyXG4gICAgdWludDhCaWdJbnQ2NEFycmF5WzddID0gbGFzdDtcclxuICAgIHJldHVybiBiaWdJbnQ2NEFycmF5WzBdO1xyXG59XHJcbmV4cG9ydHMucmVhZEludDY0ID0gcmVhZEludDY0O1xyXG5mdW5jdGlvbiB3cml0ZUludDY0KGJ1ZmYsIHZhbCwgb2Zmc2V0ID0gMCkge1xyXG4gICAgdmFsID0gdHlwZW9mIHZhbCA9PT0gJ251bWJlcicgPyBCaWdJbnQodmFsKSA6IHZhbDtcclxuICAgIGNoZWNrQm91bmRzKGJ1ZmYsIG9mZnNldCwgNyk7XHJcbiAgICBiaWdJbnQ2NEFycmF5WzBdID0gdmFsO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVsxXTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzJdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbM107XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVs0XTtcclxuICAgIGJ1ZmZbb2Zmc2V0KytdID0gdWludDhCaWdJbnQ2NEFycmF5WzVdO1xyXG4gICAgYnVmZltvZmZzZXQrK10gPSB1aW50OEJpZ0ludDY0QXJyYXlbNl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnSW50NjRBcnJheVs3XTtcclxuICAgIHJldHVybiBvZmZzZXQ7XHJcbn1cclxuZXhwb3J0cy53cml0ZUludDY0ID0gd3JpdGVJbnQ2NDtcclxuY29uc3QgYmlnVWludDY0QXJyYXkgPSBuZXcgQmlnVWludDY0QXJyYXkoMSk7XHJcbmNvbnN0IHVpbnQ4QmlnVWludDY0QXJyYXkgPSBuZXcgVWludDhBcnJheShiaWdVaW50NjRBcnJheS5idWZmZXIpO1xyXG5mdW5jdGlvbiByZWFkVUludDY0KGJ1ZmYsIG9mZnNldCA9IDApIHtcclxuICAgIGNvbnN0IGZpcnN0ID0gYnVmZltvZmZzZXRdO1xyXG4gICAgY29uc3QgbGFzdCA9IGJ1ZmZbb2Zmc2V0ICsgN107XHJcbiAgICBpZiAoZmlyc3QgPT09IHVuZGVmaW5lZCB8fCBsYXN0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBib3VuZHNFcnJvcihvZmZzZXQsIGJ1ZmYubGVuZ3RoIC0gOCk7XHJcbiAgICB9XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzBdID0gZmlyc3Q7XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzFdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzJdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzNdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzRdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzVdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzZdID0gYnVmZlsrK29mZnNldF07XHJcbiAgICB1aW50OEJpZ1VpbnQ2NEFycmF5WzddID0gbGFzdDtcclxuICAgIHJldHVybiBiaWdVaW50NjRBcnJheVswXTtcclxufVxyXG5leHBvcnRzLnJlYWRVSW50NjQgPSByZWFkVUludDY0O1xyXG5mdW5jdGlvbiB3cml0ZVVJbnQ2NChidWZmLCB2YWwsIG9mZnNldCA9IDApIHtcclxuICAgIHZhbCA9IHR5cGVvZiB2YWwgPT09ICdudW1iZXInID8gQmlnSW50KHZhbCkgOiB2YWw7XHJcbiAgICBjaGVja0JvdW5kcyhidWZmLCBvZmZzZXQsIDcpO1xyXG4gICAgYmlnVWludDY0QXJyYXlbMF0gPSB2YWw7XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbMF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbMV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbMl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbM107XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbNF07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbNV07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbNl07XHJcbiAgICBidWZmW29mZnNldCsrXSA9IHVpbnQ4QmlnVWludDY0QXJyYXlbN107XHJcbiAgICByZXR1cm4gb2Zmc2V0O1xyXG59XHJcbmV4cG9ydHMud3JpdGVVSW50NjQgPSB3cml0ZVVJbnQ2NDtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YnVmZmVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMucmV0dXJuQmlnSW50ID0gZXhwb3J0cy5pc0JpZ0ludCA9IGV4cG9ydHMuc2V0T3V0VmFsdWU4ID0gZXhwb3J0cy5zZXRPdXRWYWx1ZTMyID0gZXhwb3J0cy5tYWtlQmlnSW50ID0gZXhwb3J0cy5HZXRUeXBlID0gZXhwb3J0cy5QdWVydHNKU0VuZ2luZSA9IGV4cG9ydHMuT25GaW5hbGl6ZSA9IGV4cG9ydHMuY3JlYXRlV2Vha1JlZiA9IGV4cG9ydHMuZ2xvYmFsID0gZXhwb3J0cy5DU2hhcnBPYmplY3RNYXAgPSBleHBvcnRzLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkgPSBleHBvcnRzLkpTT2JqZWN0ID0gZXhwb3J0cy5KU0Z1bmN0aW9uID0gZXhwb3J0cy5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIgPSBleHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gdm9pZCAwO1xyXG4vKipcclxuICog5LiA5qyh5Ye95pWw6LCD55So55qEaW5mb1xyXG4gKiDlr7nlupR2ODo6RnVuY3Rpb25DYWxsYmFja0luZm9cclxuICovXHJcbmNsYXNzIEZ1bmN0aW9uQ2FsbGJhY2tJbmZvIHtcclxuICAgIGFyZ3M7XHJcbiAgICByZXR1cm5WYWx1ZTtcclxuICAgIHN0YWNrID0gMDtcclxuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcclxuICAgICAgICB0aGlzLmFyZ3MgPSBhcmdzO1xyXG4gICAgfVxyXG4gICAgcmVjeWNsZSgpIHtcclxuICAgICAgICB0aGlzLnN0YWNrID0gMDtcclxuICAgICAgICB0aGlzLmFyZ3MgPSBudWxsO1xyXG4gICAgICAgIHRoaXMucmV0dXJuVmFsdWUgPSB2b2lkIDA7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5GdW5jdGlvbkNhbGxiYWNrSW5mbyA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvO1xyXG4vLyBzdHJ1Y3QgTW9ja1Y4VmFsdWVcclxuLy8ge1xyXG4vLyAgICAgaW50IEpTVmFsdWVUeXBlOyAgLy8gMFxyXG4vLyAgICAgaW50IEZpbmFsVmFsdWVQb2ludGVyWzJdOyAvLyAxIDIgaWYgdmFsdWUgaXMgYmlnaW50IEZpbmFsVmFsdWVQb2ludGVyWzBdIGZvciBsb3csIEZpbmFsVmFsdWVQb2ludGVyWzFdIGZvciBoaWdoXHJcbi8vICAgICBpbnQgZXh0cmE7IC8vIDNcclxuLy8gICAgIGludCBGdW5jdGlvbkNhbGxiYWNrSW5mbzsgLy8gNFxyXG4vLyB9O1xyXG5jb25zdCBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiA9IDQ7IC8vIGludCBjb3VudFxyXG4vKipcclxuICog5oqKRnVuY3Rpb25DYWxsYmFja0luZm/ku6Xlj4rlhbblj4LmlbDovazljJbkuLpjI+WPr+eUqOeahGludHB0clxyXG4gKi9cclxuY2xhc3MgRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyIHtcclxuICAgIC8vIEZ1bmN0aW9uQ2FsbGJhY2tJbmZv55qE5YiX6KGo77yM5Lul5YiX6KGo55qEaW5kZXjkvZzkuLpJbnRQdHLnmoTlgLxcclxuICAgIGluZm9zID0gW25ldyBGdW5jdGlvbkNhbGxiYWNrSW5mbyhbMF0pXTsgLy8g6L+Z6YeM5Y6f5pys5Y+q5piv5Liq5pmu6YCa55qEMFxyXG4gICAgLy8gRnVuY3Rpb25DYWxsYmFja0luZm/nlKjlrozlkI7vvIzlsIblhbbluo/lj7fmlL7lhaXigJzlm57mlLbliJfooajigJ3vvIzkuIvmrKHlsLHog73nu6fnu63mnI3nlKjor6VpbmRleO+8jOiAjOS4jeW/heiuqWluZm9z5pWw57uE5peg6ZmQ5omp5bGV5LiL5Y67XHJcbiAgICBmcmVlSW5mb3NJbmRleCA9IFtdO1xyXG4gICAgZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoID0ge307XHJcbiAgICBmcmVlUmVmTWVtb3J5ID0gW107XHJcbiAgICBlbmdpbmU7XHJcbiAgICBjb25zdHJ1Y3RvcihlbmdpbmUpIHtcclxuICAgICAgICB0aGlzLmVuZ2luZSA9IGVuZ2luZTtcclxuICAgIH1cclxuICAgIGFsbG9jQ2FsbGJhY2tJbmZvTWVtb3J5KGFyZ3NMZW5ndGgpIHtcclxuICAgICAgICBjb25zdCBjYWNoZUFycmF5ID0gdGhpcy5mcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGhbYXJnc0xlbmd0aF07XHJcbiAgICAgICAgaWYgKGNhY2hlQXJyYXkgJiYgY2FjaGVBcnJheS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlQXJyYXkucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbmdpbmUudW5pdHlBcGkuX21hbGxvYygoYXJnc0xlbmd0aCAqIEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyICsgMSkgPDwgMik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgYWxsb2NSZWZNZW1vcnkoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZnJlZVJlZk1lbW9yeS5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZyZWVSZWZNZW1vcnkucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgPDwgMik7XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlUmVmTWVtb3J5KGJ1ZmZlclB0cikge1xyXG4gICAgICAgIGlmICh0aGlzLmZyZWVSZWZNZW1vcnkubGVuZ3RoID4gMjApIHtcclxuICAgICAgICAgICAgdGhpcy5lbmdpbmUudW5pdHlBcGkuX2ZyZWUoYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJlZVJlZk1lbW9yeS5wdXNoKGJ1ZmZlclB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVjeWNsZUNhbGxiYWNrSW5mb01lbW9yeShidWZmZXJQdHIsIGFyZ3MpIHtcclxuICAgICAgICBjb25zdCBhcmdzTGVuZ3RoID0gYXJncy5sZW5ndGg7XHJcbiAgICAgICAgaWYgKCF0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXSAmJiBhcmdzTGVuZ3RoIDwgNSkge1xyXG4gICAgICAgICAgICB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXSA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBjYWNoZUFycmF5ID0gdGhpcy5mcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGhbYXJnc0xlbmd0aF07XHJcbiAgICAgICAgaWYgKCFjYWNoZUFycmF5KVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgY29uc3QgYnVmZmVyUHRySW4zMiA9IGJ1ZmZlclB0ciA8PCAyO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJnc0xlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmdzW2ldIGluc3RhbmNlb2YgQXJyYXkgJiYgYXJnc1tpXS5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWN5Y2xlUmVmTWVtb3J5KHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMltidWZmZXJQdHJJbjMyICsgaSAqIEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyICsgMV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIOaLjeiEkeiii+WumueahOacgOWkp+e8k+WtmOS4quaVsOWkp+Wwj+OAgiA1MCAtIOWPguaVsOS4quaVsCAqIDEwXHJcbiAgICAgICAgaWYgKGNhY2hlQXJyYXkubGVuZ3RoID4gKDUwIC0gYXJnc0xlbmd0aCAqIDEwKSkge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5fZnJlZShidWZmZXJQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY2FjaGVBcnJheS5wdXNoKGJ1ZmZlclB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBpbnRwdHLnmoTmoLzlvI/kuLppZOW3puenu+Wbm+S9jVxyXG4gICAgICpcclxuICAgICAqIOWPs+S+p+Wbm+S9je+8jOaYr+S4uuS6huWcqOWPs+Wbm+S9jeWtmOWCqOWPguaVsOeahOW6j+WPt++8jOi/meagt+WPr+S7peeUqOS6juihqOekumNhbGxiYWNraW5mb+WPguaVsOeahGludHB0clxyXG4gICAgICovXHJcbiAgICAvLyBzdGF0aWMgR2V0TW9ja1BvaW50ZXIoYXJnczogYW55W10pOiBNb2NrSW50UHRyIHtcclxuICAgIC8vICAgICBsZXQgaW5kZXg6IG51bWJlcjtcclxuICAgIC8vICAgICBpbmRleCA9IHRoaXMuZnJlZUluZm9zSW5kZXgucG9wKCk7XHJcbiAgICAvLyAgICAgLy8gaW5kZXjmnIDlsI/kuLoxXHJcbiAgICAvLyAgICAgaWYgKGluZGV4KSB7XHJcbiAgICAvLyAgICAgICAgIHRoaXMuaW5mb3NbaW5kZXhdLmFyZ3MgPSBhcmdzO1xyXG4gICAgLy8gICAgIH0gZWxzZSB7XHJcbiAgICAvLyAgICAgICAgIGluZGV4ID0gdGhpcy5pbmZvcy5wdXNoKG5ldyBGdW5jdGlvbkNhbGxiYWNrSW5mbyhhcmdzKSkgLSAxO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vICAgICByZXR1cm4gaW5kZXggPDwgNDtcclxuICAgIC8vIH1cclxuICAgIEdldE1vY2tQb2ludGVyKGFyZ3MpIHtcclxuICAgICAgICBjb25zdCBhcmdzTGVuZ3RoID0gYXJncy5sZW5ndGg7XHJcbiAgICAgICAgbGV0IGJ1ZmZlclB0ckluOCA9IHRoaXMuYWxsb2NDYWxsYmFja0luZm9NZW1vcnkoYXJnc0xlbmd0aCk7XHJcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5mcmVlSW5mb3NJbmRleC5wb3AoKTtcclxuICAgICAgICBsZXQgZnVuY3Rpb25DYWxsYmFja0luZm87XHJcbiAgICAgICAgLy8gaW5kZXjmnIDlsI/kuLoxXHJcbiAgICAgICAgaWYgKGluZGV4KSB7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbkNhbGxiYWNrSW5mbyA9IHRoaXMuaW5mb3NbaW5kZXhdKS5hcmdzID0gYXJncztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5pbmZvcy5wdXNoKGZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKGFyZ3MpKSAtIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCB1bml0eUFwaSA9IHRoaXMuZW5naW5lLnVuaXR5QXBpO1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ckluMzIgPSBidWZmZXJQdHJJbjggPj4gMjtcclxuICAgICAgICB1bml0eUFwaS5IRUFQMzJbYnVmZmVyUHRySW4zMl0gPSBpbmRleDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ3NMZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgYXJnID0gYXJnc1tpXTtcclxuICAgICAgICAgICAgLy8gaW5pdCBlYWNoIHZhbHVlXHJcbiAgICAgICAgICAgIGNvbnN0IGpzVmFsdWVUeXBlID0gR2V0VHlwZSh0aGlzLmVuZ2luZSwgYXJnKTtcclxuICAgICAgICAgICAgY29uc3QganNWYWx1ZVB0ciA9IGJ1ZmZlclB0ckluMzIgKyBpICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgKyAxO1xyXG4gICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0cl0gPSBqc1ZhbHVlVHlwZTsgLy8ganN2YWx1ZXR5cGVcclxuICAgICAgICAgICAgaWYgKGpzVmFsdWVUeXBlID09IDIgfHwganNWYWx1ZVR5cGUgPT0gNCB8fCBqc1ZhbHVlVHlwZSA9PSA1MTIpIHtcclxuICAgICAgICAgICAgICAgIC8vIGJpZ2ludOOAgW51bWJlciBvciBkYXRlXHJcbiAgICAgICAgICAgICAgICAkRmlsbEFyZ3VtZW50RmluYWxOdW1iZXJWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwganNWYWx1ZVB0ciArIDEpOyAvLyB2YWx1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGpzVmFsdWVUeXBlID09IDgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jdGlvbkNhbGxiYWNrSW5mby5zdGFjayA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25DYWxsYmFja0luZm8uc3RhY2sgPSB1bml0eUFwaS5zdGFja1NhdmUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmcsIGpzVmFsdWVUeXBlLCAoanNWYWx1ZVB0ciArIDIpIDw8IDIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGpzVmFsdWVUeXBlID09IDY0ICYmIGFyZyBpbnN0YW5jZW9mIEFycmF5ICYmIGFyZy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gbWF5YmUgYSByZWZcclxuICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmcsIGpzVmFsdWVUeXBlLCAwKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlZlB0ckluOCA9IHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgMl0gPSB0aGlzLmFsbG9jUmVmTWVtb3J5KCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWZQdHIgPSByZWZQdHJJbjggPj4gMjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlZlZhbHVlVHlwZSA9IHVuaXR5QXBpLkhFQVAzMltyZWZQdHJdID0gR2V0VHlwZSh0aGlzLmVuZ2luZSwgYXJnWzBdKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZWZWYWx1ZVR5cGUgPT0gMiB8fCByZWZWYWx1ZVR5cGUgPT0gNCB8fCByZWZWYWx1ZVR5cGUgPT0gNTEyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbnVtYmVyIG9yIGRhdGVcclxuICAgICAgICAgICAgICAgICAgICAkRmlsbEFyZ3VtZW50RmluYWxOdW1iZXJWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnWzBdLCByZWZWYWx1ZVR5cGUsIHJlZlB0ciArIDEpOyAvLyB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW3JlZlB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnWzBdLCByZWZWYWx1ZVR5cGUsIChyZWZQdHIgKyAyKSA8PCAyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltyZWZQdHIgKyAzXSA9IGJ1ZmZlclB0ckluODsgLy8gYSBwb2ludGVyIHRvIHRoZSBpbmZvXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBvdGhlclxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIChqc1ZhbHVlUHRyICsgMikgPDwgMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAzXSA9IGJ1ZmZlclB0ckluODsgLy8gYSBwb2ludGVyIHRvIHRoZSBpbmZvXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBidWZmZXJQdHJJbjg7XHJcbiAgICB9XHJcbiAgICAvLyBzdGF0aWMgR2V0QnlNb2NrUG9pbnRlcihpbnRwdHI6IE1vY2tJbnRQdHIpOiBGdW5jdGlvbkNhbGxiYWNrSW5mbyB7XHJcbiAgICAvLyAgICAgcmV0dXJuIHRoaXMuaW5mb3NbaW50cHRyID4+IDRdO1xyXG4gICAgLy8gfVxyXG4gICAgR2V0QnlNb2NrUG9pbnRlcihwdHJJbjgpIHtcclxuICAgICAgICBjb25zdCBwdHJJbjMyID0gcHRySW44ID4+IDI7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMl07XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mb3NbaW5kZXhdO1xyXG4gICAgfVxyXG4gICAgR2V0UmV0dXJuVmFsdWVBbmRSZWN5Y2xlKHB0ckluOCkge1xyXG4gICAgICAgIGNvbnN0IHB0ckluMzIgPSBwdHJJbjggPj4gMjtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXTtcclxuICAgICAgICBsZXQgaW5mbyA9IHRoaXMuaW5mb3NbaW5kZXhdO1xyXG4gICAgICAgIGxldCByZXQgPSBpbmZvLnJldHVyblZhbHVlO1xyXG4gICAgICAgIHRoaXMucmVjeWNsZUNhbGxiYWNrSW5mb01lbW9yeShwdHJJbjgsIGluZm8uYXJncyk7XHJcbiAgICAgICAgaWYgKGluZm8uc3RhY2spIHtcclxuICAgICAgICAgICAgdGhpcy5lbmdpbmUudW5pdHlBcGkuc3RhY2tSZXN0b3JlKGluZm8uc3RhY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbmZvLnJlY3ljbGUoKTtcclxuICAgICAgICB0aGlzLmZyZWVJbmZvc0luZGV4LnB1c2goaW5kZXgpO1xyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbiAgICBSZWxlYXNlQnlNb2NrSW50UHRyKHB0ckluOCkge1xyXG4gICAgICAgIGNvbnN0IHB0ckluMzIgPSBwdHJJbjggPj4gMjtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXTtcclxuICAgICAgICBsZXQgaW5mbyA9IHRoaXMuaW5mb3NbaW5kZXhdO1xyXG4gICAgICAgIHRoaXMucmVjeWNsZUNhbGxiYWNrSW5mb01lbW9yeShwdHJJbjgsIGluZm8uYXJncyk7XHJcbiAgICAgICAgaWYgKGluZm8uc3RhY2spIHtcclxuICAgICAgICAgICAgdGhpcy5lbmdpbmUudW5pdHlBcGkuc3RhY2tSZXN0b3JlKGluZm8uc3RhY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbmZvLnJlY3ljbGUoKTtcclxuICAgICAgICB0aGlzLmZyZWVJbmZvc0luZGV4LnB1c2goaW5kZXgpO1xyXG4gICAgfVxyXG4gICAgR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZVB0ckluOCkge1xyXG4gICAgICAgIGxldCBoZWFwMzIgPSB0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzI7XHJcbiAgICAgICAgY29uc3QgaW5mb1B0ckluOCA9IGhlYXAzMlsodmFsdWVQdHJJbjggPj4gMikgKyAzXTtcclxuICAgICAgICBjb25zdCBjYWxsYmFja0luZm9JbmRleCA9IGhlYXAzMltpbmZvUHRySW44ID4+IDJdO1xyXG4gICAgICAgIGNvbnN0IGFyZ3NJbmRleCA9ICh2YWx1ZVB0ckluOCAtIGluZm9QdHJJbjggLSA0KSAvICg0ICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmluZm9zW2NhbGxiYWNrSW5mb0luZGV4XS5hcmdzW2FyZ3NJbmRleF07XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIgPSBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXI7XHJcbi8qKlxyXG4gKiDku6PooajkuIDkuKpKU0Z1bmN0aW9uXHJcbiAqL1xyXG5jbGFzcyBKU0Z1bmN0aW9uIHtcclxuICAgIF9mdW5jO1xyXG4gICAgaWQ7XHJcbiAgICBhcmdzID0gW107XHJcbiAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgIGNvbnN0cnVjdG9yKGlkLCBmdW5jKSB7XHJcbiAgICAgICAgdGhpcy5fZnVuYyA9IGZ1bmM7XHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgfVxyXG4gICAgaW52b2tlKCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gWy4uLnRoaXMuYXJnc107XHJcbiAgICAgICAgdGhpcy5hcmdzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Z1bmMuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5KU0Z1bmN0aW9uID0gSlNGdW5jdGlvbjtcclxuLyoqXHJcbiAqIOS7o+ihqOS4gOS4qkpTT2JqZWN0XHJcbiAqL1xyXG5jbGFzcyBKU09iamVjdCB7XHJcbiAgICBfb2JqO1xyXG4gICAgaWQ7XHJcbiAgICBjb25zdHJ1Y3RvcihpZCwgb2JqKSB7XHJcbiAgICAgICAgdGhpcy5fb2JqID0gb2JqO1xyXG4gICAgICAgIHRoaXMuaWQgPSBpZDtcclxuICAgIH1cclxuICAgIGdldE9iamVjdCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fb2JqO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuSlNPYmplY3QgPSBKU09iamVjdDtcclxuY2xhc3MganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSB7XHJcbiAgICBzdGF0aWMgcmVndWxhcklEID0gMTtcclxuICAgIHN0YXRpYyBmcmVlSUQgPSBbXTtcclxuICAgIHN0YXRpYyBpZE1hcCA9IG5ldyBXZWFrTWFwKCk7XHJcbiAgICBzdGF0aWMganNGdW5jT3JPYmplY3RLViA9IHt9O1xyXG4gICAgc3RhdGljIGdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jVmFsdWUpIHtcclxuICAgICAgICBsZXQgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmdldChmdW5jVmFsdWUpO1xyXG4gICAgICAgIGlmIChpZCkge1xyXG4gICAgICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuZnJlZUlELmxlbmd0aCkge1xyXG4gICAgICAgICAgICBpZCA9IHRoaXMuZnJlZUlELnBvcCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlZ3VsYXJJRCsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBmdW5jID0gbmV3IEpTRnVuY3Rpb24oaWQsIGZ1bmNWYWx1ZSk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5zZXQoZnVuY1ZhbHVlLCBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXSA9IGZ1bmM7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmM7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZ2V0T3JDcmVhdGVKU09iamVjdChvYmopIHtcclxuICAgICAgICBsZXQgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmdldChvYmopO1xyXG4gICAgICAgIGlmIChpZCkge1xyXG4gICAgICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuZnJlZUlELmxlbmd0aCkge1xyXG4gICAgICAgICAgICBpZCA9IHRoaXMuZnJlZUlELnBvcCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlZ3VsYXJJRCsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBqc09iamVjdCA9IG5ldyBKU09iamVjdChpZCwgb2JqKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLnNldChvYmosIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdID0ganNPYmplY3Q7XHJcbiAgICAgICAgcmV0dXJuIGpzT2JqZWN0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGdldEpTT2JqZWN0QnlJZChpZCkge1xyXG4gICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHJlbW92ZUpTT2JqZWN0QnlJZChpZCkge1xyXG4gICAgICAgIGNvbnN0IGpzT2JqZWN0ID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICBpZiAoIWpzT2JqZWN0KVxyXG4gICAgICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKCdyZW1vdmVKU09iamVjdEJ5SWQgZmFpbGVkOiBpZCBpcyBpbnZhbGlkOiAnICsgaWQpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZGVsZXRlKGpzT2JqZWN0LmdldE9iamVjdCgpKTtcclxuICAgICAgICBkZWxldGUganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICB0aGlzLmZyZWVJRC5wdXNoKGlkKTtcclxuICAgIH1cclxuICAgIHN0YXRpYyBnZXRKU0Z1bmN0aW9uQnlJZChpZCkge1xyXG4gICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHJlbW92ZUpTRnVuY3Rpb25CeUlkKGlkKSB7XHJcbiAgICAgICAgY29uc3QganNGdW5jID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICBpZiAoIWpzRnVuYylcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybigncmVtb3ZlSlNGdW5jdGlvbkJ5SWQgZmFpbGVkOiBpZCBpcyBpbnZhbGlkOiAnICsgaWQpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZGVsZXRlKGpzRnVuYy5fZnVuYyk7XHJcbiAgICAgICAgZGVsZXRlIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgdGhpcy5mcmVlSUQucHVzaChpZCk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5ID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeTtcclxuLyoqXHJcbiAqIENTaGFycOWvueixoeiusOW9leihqO+8jOiusOW9leaJgOaciUNTaGFycOWvueixoeW5tuWIhumFjWlkXHJcbiAqIOWSjHB1ZXJ0cy5kbGzmiYDlgZrnmoTkuIDmoLdcclxuICovXHJcbmNsYXNzIENTaGFycE9iamVjdE1hcCB7XHJcbiAgICBjbGFzc2VzID0gW251bGxdO1xyXG4gICAgbmF0aXZlT2JqZWN0S1YgPSBuZXcgTWFwKCk7XHJcbiAgICAvLyBwcml2YXRlIG5hdGl2ZU9iamVjdEtWOiB7IFtvYmplY3RJRDogQ1NJZGVudGlmaWVyXTogV2Vha1JlZjxhbnk+IH0gPSB7fTtcclxuICAgIC8vIHByaXZhdGUgY3NJRFdlYWtNYXA6IFdlYWtNYXA8YW55LCBDU0lkZW50aWZpZXI+ID0gbmV3IFdlYWtNYXAoKTtcclxuICAgIG5hbWVzVG9DbGFzc2VzSUQgPSB7fTtcclxuICAgIGNsYXNzSURXZWFrTWFwID0gbmV3IFdlYWtNYXAoKTtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX21lbW9yeURlYnVnICYmIHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZENhbGxlZCcsIHRoaXMuYWRkQ2FsbGVkKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlbW92ZUNhbGxlZCcsIHRoaXMucmVtb3ZlQ2FsbGVkKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3dyJywgdGhpcy5uYXRpdmVPYmplY3RLVi5zaXplKTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgIH1cclxuICAgIF9tZW1vcnlEZWJ1ZyA9IGZhbHNlO1xyXG4gICAgYWRkQ2FsbGVkID0gMDtcclxuICAgIHJlbW92ZUNhbGxlZCA9IDA7XHJcbiAgICBhZGQoY3NJRCwgb2JqKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgdGhpcy5hZGRDYWxsZWQrKztcclxuICAgICAgICAvLyB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdID0gY3JlYXRlV2Vha1JlZihvYmopO1xyXG4gICAgICAgIC8vIHRoaXMuY3NJRFdlYWtNYXAuc2V0KG9iaiwgY3NJRCk7XHJcbiAgICAgICAgdGhpcy5uYXRpdmVPYmplY3RLVi5zZXQoY3NJRCwgY3JlYXRlV2Vha1JlZihvYmopKTtcclxuICAgICAgICBvYmpbJyRjc2lkJ10gPSBjc0lEO1xyXG4gICAgfVxyXG4gICAgcmVtb3ZlKGNzSUQpIHtcclxuICAgICAgICB0aGlzLl9tZW1vcnlEZWJ1ZyAmJiB0aGlzLnJlbW92ZUNhbGxlZCsrO1xyXG4gICAgICAgIC8vIGRlbGV0ZSB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdO1xyXG4gICAgICAgIHRoaXMubmF0aXZlT2JqZWN0S1YuZGVsZXRlKGNzSUQpO1xyXG4gICAgfVxyXG4gICAgZmluZE9yQWRkT2JqZWN0KGNzSUQsIGNsYXNzSUQpIHtcclxuICAgICAgICBsZXQgcmV0ID0gdGhpcy5uYXRpdmVPYmplY3RLVi5nZXQoY3NJRCk7XHJcbiAgICAgICAgLy8gbGV0IHJldCA9IHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF07XHJcbiAgICAgICAgaWYgKHJldCAmJiAocmV0ID0gcmV0LmRlcmVmKCkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldCA9IHRoaXMuY2xhc3Nlc1tjbGFzc0lEXS5jcmVhdGVGcm9tQ1MoY3NJRCk7XHJcbiAgICAgICAgLy8gdGhpcy5hZGQoY3NJRCwgcmV0KTsg5p6E6YCg5Ye95pWw6YeM6LSf6LSj6LCD55SoXHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIGdldENTSWRlbnRpZmllckZyb21PYmplY3Qob2JqKSB7XHJcbiAgICAgICAgLy8gcmV0dXJuIHRoaXMuY3NJRFdlYWtNYXAuZ2V0KG9iaik7XHJcbiAgICAgICAgcmV0dXJuIG9iaiA/IG9iai4kY3NpZCA6IDA7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5DU2hhcnBPYmplY3RNYXAgPSBDU2hhcnBPYmplY3RNYXA7XHJcbjtcclxudmFyIGRlc3RydWN0b3JzID0ge307XHJcbmV4cG9ydHMuZ2xvYmFsID0gZ2xvYmFsID0gZ2xvYmFsIHx8IGdsb2JhbFRoaXMgfHwgd2luZG93O1xyXG5nbG9iYWwuZ2xvYmFsID0gZ2xvYmFsO1xyXG5jb25zdCBjcmVhdGVXZWFrUmVmID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0eXBlb2YgV2Vha1JlZiA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgV1hXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJXZWFrUmVmIGlzIG5vdCBkZWZpbmVkLiBtYXliZSB5b3Ugc2hvdWxkIHVzZSBuZXdlciBlbnZpcm9ubWVudFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IGRlcmVmKCkgeyByZXR1cm4gb2JqOyB9IH07XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUud2FybihcInVzaW5nIFdYV2Vha1JlZlwiKTtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFdYV2Vha1JlZihvYmopO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgIHJldHVybiBuZXcgV2Vha1JlZihvYmopO1xyXG4gICAgfTtcclxufSkoKTtcclxuZXhwb3J0cy5jcmVhdGVXZWFrUmVmID0gY3JlYXRlV2Vha1JlZjtcclxuY2xhc3MgRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrIHtcclxuICAgIF9oYW5kbGVyO1xyXG4gICAgcmVmcyA9IFtdO1xyXG4gICAgaGVsZHMgPSBbXTtcclxuICAgIGF2YWlsYWJsZUluZGV4ID0gW107XHJcbiAgICBjb25zdHJ1Y3RvcihoYW5kbGVyKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwiRmluYWxpemF0aW9uUmVnaXN0ZXIgaXMgbm90IGRlZmluZWQuIHVzaW5nIEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9ja1wiKTtcclxuICAgICAgICBnbG9iYWwuX3B1ZXJ0c19yZWdpc3RyeSA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5faGFuZGxlciA9IGhhbmRsZXI7XHJcbiAgICB9XHJcbiAgICByZWdpc3RlcihvYmosIGhlbGRWYWx1ZSkge1xyXG4gICAgICAgIGlmICh0aGlzLmF2YWlsYWJsZUluZGV4Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuYXZhaWxhYmxlSW5kZXgucG9wKCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVmc1tpbmRleF0gPSBjcmVhdGVXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgICAgIHRoaXMuaGVsZHNbaW5kZXhdID0gaGVsZFZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5yZWZzLnB1c2goY3JlYXRlV2Vha1JlZihvYmopKTtcclxuICAgICAgICAgICAgdGhpcy5oZWxkcy5wdXNoKGhlbGRWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDmuIXpmaTlj6/og73lt7Lnu4/lpLHmlYjnmoRXZWFrUmVmXHJcbiAgICAgKi9cclxuICAgIGl0ZXJhdGVQb3NpdGlvbiA9IDA7XHJcbiAgICBjbGVhbnVwKHBhcnQgPSAxKSB7XHJcbiAgICAgICAgY29uc3Qgc3RlcENvdW50ID0gdGhpcy5yZWZzLmxlbmd0aCAvIHBhcnQ7XHJcbiAgICAgICAgbGV0IGkgPSB0aGlzLml0ZXJhdGVQb3NpdGlvbjtcclxuICAgICAgICBmb3IgKGxldCBjdXJyZW50U3RlcCA9IDA7IGkgPCB0aGlzLnJlZnMubGVuZ3RoICYmIGN1cnJlbnRTdGVwIDwgc3RlcENvdW50OyBpID0gKGkgPT0gdGhpcy5yZWZzLmxlbmd0aCAtIDEgPyAwIDogaSArIDEpLCBjdXJyZW50U3RlcCsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlZnNbaV0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlZnNbaV0uZGVyZWYoKSkge1xyXG4gICAgICAgICAgICAgICAgLy8g55uu5YmN5rKh5pyJ5YaF5a2Y5pW055CG6IO95Yqb77yM5aaC5p6c5ri45oiP5Lit5pyfcmVm5b6I5aSa5L2G5ZCO5pyf5bCR5LqG77yM6L+Z6YeM5bCx5Lya55m96LS56YGN5Y6G5qyh5pWwXHJcbiAgICAgICAgICAgICAgICAvLyDkvYbpgY3ljobkuZ/lj6rmmK/kuIDlj6U9PeWSjGNvbnRpbnVl77yM5rWq6LS55b2x5ZON5LiN5aSnXHJcbiAgICAgICAgICAgICAgICB0aGlzLmF2YWlsYWJsZUluZGV4LnB1c2goaSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnNbaV0gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVyKHRoaXMuaGVsZHNbaV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaXRlcmF0ZVBvc2l0aW9uID0gaTtcclxuICAgIH1cclxufVxyXG52YXIgcmVnaXN0cnkgPSBudWxsO1xyXG5mdW5jdGlvbiBpbml0KCkge1xyXG4gICAgcmVnaXN0cnkgPSBuZXcgKHR5cGVvZiBGaW5hbGl6YXRpb25SZWdpc3RyeSA9PSAndW5kZWZpbmVkJyA/IEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9jayA6IEZpbmFsaXphdGlvblJlZ2lzdHJ5KShmdW5jdGlvbiAoaGVsZFZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXTtcclxuICAgICAgICBpZiAoIWNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbm5vdCBmaW5kIGRlc3RydWN0b3IgZm9yIFwiICsgaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKC0tY2FsbGJhY2sucmVmID09IDApIHtcclxuICAgICAgICAgICAgZGVsZXRlIGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGhlbGRWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gT25GaW5hbGl6ZShvYmosIGhlbGRWYWx1ZSwgY2FsbGJhY2spIHtcclxuICAgIGlmICghcmVnaXN0cnkpIHtcclxuICAgICAgICBpbml0KCk7XHJcbiAgICB9XHJcbiAgICBsZXQgb3JpZ2luQ2FsbGJhY2sgPSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xyXG4gICAgaWYgKG9yaWdpbkNhbGxiYWNrKSB7XHJcbiAgICAgICAgLy8gV2Vha1JlZuWGheWuuemHiuaUvuaXtuacuuWPr+iDveavlGZpbmFsaXphdGlvblJlZ2lzdHJ555qE6Kem5Y+R5pu05pep77yM5YmN6Z2i5aaC5p6c5Y+R546wd2Vha1JlZuS4uuepuuS8mumHjeaWsOWIm+W7uuWvueixoVxyXG4gICAgICAgIC8vIOS9huS5i+WJjeWvueixoeeahGZpbmFsaXphdGlvblJlZ2lzdHJ55pyA57uI5Y+I6IKv5a6a5Lya6Kem5Y+R44CCXHJcbiAgICAgICAgLy8g5omA5Lul5aaC5p6c6YGH5Yiw6L+Z5Liq5oOF5Ya177yM6ZyA6KaB57uZZGVzdHJ1Y3RvcuWKoOiuoeaVsFxyXG4gICAgICAgICsrb3JpZ2luQ2FsbGJhY2sucmVmO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgY2FsbGJhY2sucmVmID0gMTtcclxuICAgICAgICBkZXN0cnVjdG9yc1toZWxkVmFsdWVdID0gY2FsbGJhY2s7XHJcbiAgICB9XHJcbiAgICByZWdpc3RyeS5yZWdpc3RlcihvYmosIGhlbGRWYWx1ZSk7XHJcbn1cclxuZXhwb3J0cy5PbkZpbmFsaXplID0gT25GaW5hbGl6ZTtcclxuY2xhc3MgUHVlcnRzSlNFbmdpbmUge1xyXG4gICAgY3NoYXJwT2JqZWN0TWFwO1xyXG4gICAgZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyO1xyXG4gICAgdW5pdHlBcGk7XHJcbiAgICAvKiog5a2X56ym5Liy57yT5a2Y77yM6buY6K6k5Li6MjU25a2X6IqCICovXHJcbiAgICBzdHJCdWZmZXI7XHJcbiAgICBzdHJpbmdCdWZmZXJTaXplID0gMjU2O1xyXG4gICAgbGFzdFJldHVybkNTUmVzdWx0ID0gbnVsbDtcclxuICAgIGxhc3RFeGNlcHRpb24gPSBudWxsO1xyXG4gICAgLy8g6L+Z5Lik5Liq5pivUHVlcnRz55So55qE55qE55yf5q2j55qEQ1NoYXJw5Ye95pWw5oyH6ZKIXHJcbiAgICBHZXRKU0FyZ3VtZW50c0NhbGxiYWNrO1xyXG4gICAgZ2VuZXJhbERlc3RydWN0b3I7XHJcbiAgICBjb25zdHJ1Y3RvcihjdG9yUGFyYW0pIHtcclxuICAgICAgICB0aGlzLmNzaGFycE9iamVjdE1hcCA9IG5ldyBDU2hhcnBPYmplY3RNYXAoKTtcclxuICAgICAgICB0aGlzLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IG5ldyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIodGhpcyk7XHJcbiAgICAgICAgY29uc3QgeyBVVEY4VG9TdHJpbmcsIFVURjE2VG9TdHJpbmcsIF9tYWxsb2MsIF9mcmVlLCBfc2V0VGVtcFJldDAsIHN0cmluZ1RvVVRGOCwgbGVuZ3RoQnl0ZXNVVEY4LCBzdHJpbmdUb1VURjE2LCBsZW5ndGhCeXRlc1VURjE2LCBzdGFja1NhdmUsIHN0YWNrUmVzdG9yZSwgc3RhY2tBbGxvYywgZ2V0V2FzbVRhYmxlRW50cnksIGFkZEZ1bmN0aW9uLCByZW1vdmVGdW5jdGlvbiwgX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrLCBfQ2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2ssIF9DYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrLCBJbmplY3RQYXBpR0xOYXRpdmVJbXBsLCBQQXBpQ2FsbGJhY2tXaXRoU2NvcGUsIFBBcGlDb25zdHJ1Y3RvcldpdGhTY29wZSwgSEVBUDgsIEhFQVBVOCwgSEVBUDMyLCBIRUFQRjMyLCBIRUFQRjY0LCB9ID0gY3RvclBhcmFtO1xyXG4gICAgICAgIHRoaXMuc3RyQnVmZmVyID0gX21hbGxvYyh0aGlzLnN0cmluZ0J1ZmZlclNpemUpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkgPSB7XHJcbiAgICAgICAgICAgIFVURjhUb1N0cmluZyxcclxuICAgICAgICAgICAgVVRGMTZUb1N0cmluZyxcclxuICAgICAgICAgICAgX21hbGxvYyxcclxuICAgICAgICAgICAgX2ZyZWUsXHJcbiAgICAgICAgICAgIF9zZXRUZW1wUmV0MCxcclxuICAgICAgICAgICAgc3RyaW5nVG9VVEY4LFxyXG4gICAgICAgICAgICBsZW5ndGhCeXRlc1VURjgsXHJcbiAgICAgICAgICAgIHN0cmluZ1RvVVRGMTYsXHJcbiAgICAgICAgICAgIGxlbmd0aEJ5dGVzVVRGMTYsXHJcbiAgICAgICAgICAgIHN0YWNrU2F2ZSxcclxuICAgICAgICAgICAgc3RhY2tSZXN0b3JlLFxyXG4gICAgICAgICAgICBzdGFja0FsbG9jLFxyXG4gICAgICAgICAgICBnZXRXYXNtVGFibGVFbnRyeSxcclxuICAgICAgICAgICAgYWRkRnVuY3Rpb24sXHJcbiAgICAgICAgICAgIHJlbW92ZUZ1bmN0aW9uLFxyXG4gICAgICAgICAgICBfQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIF9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayxcclxuICAgICAgICAgICAgX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIEluamVjdFBhcGlHTE5hdGl2ZUltcGwsXHJcbiAgICAgICAgICAgIFBBcGlDYWxsYmFja1dpdGhTY29wZSxcclxuICAgICAgICAgICAgUEFwaUNvbnN0cnVjdG9yV2l0aFNjb3BlLFxyXG4gICAgICAgICAgICBIRUFQOCxcclxuICAgICAgICAgICAgSEVBUFU4LFxyXG4gICAgICAgICAgICBIRUFQMzIsXHJcbiAgICAgICAgICAgIEhFQVBGMzIsXHJcbiAgICAgICAgICAgIEhFQVBGNjQsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBnbG9iYWwuX190Z2pzRXZhbFNjcmlwdCA9IHR5cGVvZiBldmFsID09IFwidW5kZWZpbmVkXCIgPyAoKSA9PiB7IH0gOiBldmFsO1xyXG4gICAgICAgIGdsb2JhbC5fX3RnanNTZXRQcm9taXNlUmVqZWN0Q2FsbGJhY2sgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB3eCAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgd3gub25VbmhhbmRsZWRSZWplY3Rpb24oY2FsbGJhY2spO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBnbG9iYWwuX19wdWVydHNHZXRMYXN0RXhjZXB0aW9uID0gKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0RXhjZXB0aW9uO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICAvKiogY2FsbCB3aGVuIHdhc20gZ3JvdyBtZW1vcnkgKi9cclxuICAgIHVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzKEhFQVA4LCBIRUFQVTgsIEhFQVAzMiwgSEVBUEYzMiwgSEVBUEY2NCkge1xyXG4gICAgICAgIGxldCB1bml0eUFwaSA9IHRoaXMudW5pdHlBcGk7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUDggPSBIRUFQODtcclxuICAgICAgICB1bml0eUFwaS5IRUFQVTggPSBIRUFQVTg7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUDMyID0gSEVBUDMyO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVBGMzIgPSBIRUFQRjMyO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVBGNjQgPSBIRUFQRjY0O1xyXG4gICAgfVxyXG4gICAgbWVtY3B5KGRlc3QsIHNyYywgbnVtKSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5IRUFQVTguY29weVdpdGhpbihkZXN0LCBzcmMsIHNyYyArIG51bSk7XHJcbiAgICB9XHJcbiAgICBKU1N0cmluZ1RvQ1NTdHJpbmcocmV0dXJuU3RyLCAvKiogb3V0IGludCAqLyBsZW5ndGhPZmZzZXQpIHtcclxuICAgICAgICBpZiAocmV0dXJuU3RyID09PSBudWxsIHx8IHJldHVyblN0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnl0ZUNvdW50ID0gdGhpcy51bml0eUFwaS5sZW5ndGhCeXRlc1VURjgocmV0dXJuU3RyKTtcclxuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aE9mZnNldCwgYnl0ZUNvdW50KTtcclxuICAgICAgICBsZXQgYnVmZmVyID0gdGhpcy51bml0eUFwaS5fbWFsbG9jKGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgYnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICByZXR1cm4gYnVmZmVyO1xyXG4gICAgfVxyXG4gICAgSlNTdHJpbmdUb1RlbXBDU1N0cmluZyhyZXR1cm5TdHIsIC8qKiBvdXQgaW50ICovIGxlbmd0aE9mZnNldCkge1xyXG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xyXG4gICAgICAgIHNldE91dFZhbHVlMzIodGhpcywgbGVuZ3RoT2Zmc2V0LCBieXRlQ291bnQpO1xyXG4gICAgICAgIGlmICh0aGlzLnN0cmluZ0J1ZmZlclNpemUgPCBieXRlQ291bnQgKyAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMudW5pdHlBcGkuX2ZyZWUodGhpcy5zdHJCdWZmZXIpO1xyXG4gICAgICAgICAgICB0aGlzLnN0ckJ1ZmZlciA9IHRoaXMudW5pdHlBcGkuX21hbGxvYyh0aGlzLnN0cmluZ0J1ZmZlclNpemUgPSBNYXRoLm1heCgyICogdGhpcy5zdHJpbmdCdWZmZXJTaXplLCBieXRlQ291bnQgKyAxKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgdGhpcy5zdHJCdWZmZXIsIGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0ckJ1ZmZlcjtcclxuICAgIH1cclxuICAgIEpTU3RyaW5nVG9DU1N0cmluZ09uU3RhY2socmV0dXJuU3RyLCAvKiogb3V0IGludCAqLyBsZW5ndGhPZmZzZXQpIHtcclxuICAgICAgICBpZiAocmV0dXJuU3RyID09PSBudWxsIHx8IHJldHVyblN0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnl0ZUNvdW50ID0gdGhpcy51bml0eUFwaS5sZW5ndGhCeXRlc1VURjgocmV0dXJuU3RyKTtcclxuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aE9mZnNldCwgYnl0ZUNvdW50KTtcclxuICAgICAgICB2YXIgYnVmZmVyID0gdGhpcy51bml0eUFwaS5zdGFja0FsbG9jKGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgYnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICByZXR1cm4gYnVmZmVyO1xyXG4gICAgfVxyXG4gICAgbWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgZnVuY3Rpb25QdHIsIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgLy8g5LiN6IO955So566t5aS05Ye95pWw77yB5q2k5aSE6L+U5Zue55qE5Ye95pWw5Lya6LWL5YC85Yiw5YW35L2T55qEY2xhc3PkuIrvvIzlhbZ0aGlz5oyH6ZKI5pyJ5ZCr5LmJ44CCXHJcbiAgICAgICAgY29uc3QgZW5naW5lID0gdGhpcztcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcclxuICAgICAgICAgICAgaWYgKG5ldy50YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignXCJub3QgYSBjb25zdHJ1Y3RvcicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBjYWxsYmFja0luZm9QdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmNhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBcclxuICAgICAgICAgICAgICAgIC8vIGdldEludFB0ck1hbmFnZXIoKS5HZXRQb2ludGVyRm9ySlNWYWx1ZSh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGlzU3RhdGljID8gMCA6IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdCh0aGlzKSwgY2FsbGJhY2tJbmZvUHRyLCBhcmdzLmxlbmd0aCwgY2FsbGJhY2tJZHgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0UmV0dXJuVmFsdWVBbmRSZWN5Y2xlKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBjYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5fQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHNlbGZQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbiAgICBjYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudW5pdHlBcGkuX0NhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLl9DYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5QdWVydHNKU0VuZ2luZSA9IFB1ZXJ0c0pTRW5naW5lO1xyXG5mdW5jdGlvbiBHZXRUeXBlKGVuZ2luZSwgdmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIDE7XHJcbiAgICB9XHJcbiAgICBpZiAoaXNCaWdJbnQodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIDI7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInKSB7XHJcbiAgICAgICAgcmV0dXJuIDQ7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgcmV0dXJuIDg7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xyXG4gICAgICAgIHJldHVybiAxNjtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHJldHVybiAyNTY7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIDUxMjtcclxuICAgIH1cclxuICAgIC8vIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7IHJldHVybiAxMjggfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICByZXR1cm4gNjQ7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCB2YWx1ZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgIH1cclxuICAgIGlmIChlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIDMyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDY0O1xyXG59XHJcbmV4cG9ydHMuR2V0VHlwZSA9IEdldFR5cGU7XHJcbmZ1bmN0aW9uIG1ha2VCaWdJbnQobG93LCBoaWdoKSB7XHJcbiAgICByZXR1cm4gKEJpZ0ludChoaWdoKSA8PCAzMm4pIHwgQmlnSW50KGxvdyA+Pj4gMCk7XHJcbn1cclxuZXhwb3J0cy5tYWtlQmlnSW50ID0gbWFrZUJpZ0ludDtcclxuZnVuY3Rpb24gc2V0T3V0VmFsdWUzMihlbmdpbmUsIHZhbHVlUHRyLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMlt2YWx1ZVB0ciA+PiAyXSA9IHZhbHVlO1xyXG59XHJcbmV4cG9ydHMuc2V0T3V0VmFsdWUzMiA9IHNldE91dFZhbHVlMzI7XHJcbmZ1bmN0aW9uIHNldE91dFZhbHVlOChlbmdpbmUsIHZhbHVlUHRyLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4W3ZhbHVlUHRyXSA9IHZhbHVlO1xyXG59XHJcbmV4cG9ydHMuc2V0T3V0VmFsdWU4ID0gc2V0T3V0VmFsdWU4O1xyXG5mdW5jdGlvbiBpc0JpZ0ludCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQmlnSW50IHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2JpZ2ludCc7XHJcbn1cclxuZXhwb3J0cy5pc0JpZ0ludCA9IGlzQmlnSW50O1xyXG5mdW5jdGlvbiByZXR1cm5CaWdJbnQoZW5naW5lLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLl9zZXRUZW1wUmV0MChOdW1iZXIodmFsdWUgPj4gMzJuKSk7IC8vIGhpZ2hcclxuICAgIHJldHVybiBOdW1iZXIodmFsdWUgJiAweGZmZmZmZmZmbik7IC8vIGxvd1xyXG59XHJcbmV4cG9ydHMucmV0dXJuQmlnSW50ID0gcmV0dXJuQmlnSW50O1xyXG5mdW5jdGlvbiB3cml0ZUJpZ0ludChlbmdpbmUsIHB0ckluMzIsIHZhbHVlKSB7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdID0gTnVtYmVyKHZhbHVlICYgMHhmZmZmZmZmZm4pOyAvLyBsb3dcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMiArIDFdID0gTnVtYmVyKHZhbHVlID4+IDMybik7IC8vIGhpZ2hcclxufVxyXG5jb25zdCB0bXBJbnQzQXJyID0gbmV3IEludDMyQXJyYXkoMik7XHJcbmNvbnN0IHRtcEZsb2F0NjRBcnIgPSBuZXcgRmxvYXQ2NEFycmF5KHRtcEludDNBcnIuYnVmZmVyKTtcclxuZnVuY3Rpb24gd3JpdGVOdW1iZXIoZW5naW5lLCBwdHJJbjMyLCB2YWx1ZSkge1xyXG4gICAgLy8gbnVtYmVyIGluIGpzIGlzIGRvdWJsZVxyXG4gICAgdG1wRmxvYXQ2NEFyclswXSA9IHZhbHVlO1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXSA9IHRtcEludDNBcnJbMF07XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzIgKyAxXSA9IHRtcEludDNBcnJbMV07XHJcbn1cclxuZnVuY3Rpb24gJEZpbGxBcmd1bWVudEZpbmFsTnVtYmVyVmFsdWUoZW5naW5lLCB2YWwsIGpzVmFsdWVUeXBlLCB2YWxQdHJJbjMyKSB7XHJcbiAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgc3dpdGNoIChqc1ZhbHVlVHlwZSkge1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgd3JpdGVCaWdJbnQoZW5naW5lLCB2YWxQdHJJbjMyLCB2YWwpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgIHdyaXRlTnVtYmVyKGVuZ2luZSwgdmFsUHRySW4zMiwgK3ZhbCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgNTEyOlxyXG4gICAgICAgICAgICB3cml0ZU51bWJlcihlbmdpbmUsIHZhbFB0ckluMzIsIHZhbC5nZXRUaW1lKCkpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKGVuZ2luZSwgdmFsLCBqc1ZhbHVlVHlwZSwgbGVuZ3RoT2Zmc2V0KSB7XHJcbiAgICBpZiAoIWpzVmFsdWVUeXBlKVxyXG4gICAgICAgIGpzVmFsdWVUeXBlID0gR2V0VHlwZShlbmdpbmUsIHZhbCk7XHJcbiAgICBzd2l0Y2ggKGpzVmFsdWVUeXBlKSB7XHJcbiAgICAgICAgY2FzZSA4OiByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZ09uU3RhY2sodmFsLCBsZW5ndGhPZmZzZXQpO1xyXG4gICAgICAgIGNhc2UgMTY6IHJldHVybiArdmFsO1xyXG4gICAgICAgIGNhc2UgMzI6IHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodmFsKTtcclxuICAgICAgICBjYXNlIDY0OiByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KHZhbCkuaWQ7XHJcbiAgICAgICAgY2FzZSAxMjg6IHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3QodmFsKS5pZDtcclxuICAgICAgICBjYXNlIDI1NjogcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKHZhbCkuaWQ7XHJcbiAgICAgICAgY2FzZSAxMDI0OiB7XHJcbiAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcilcclxuICAgICAgICAgICAgICAgIHZhbCA9IG5ldyBVaW50OEFycmF5KHZhbCk7XHJcbiAgICAgICAgICAgIGxldCBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyh2YWwuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQVTguc2V0KHZhbCwgcHRyKTtcclxuICAgICAgICAgICAgc2V0T3V0VmFsdWUzMihlbmdpbmUsIGxlbmd0aE9mZnNldCwgdmFsLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICByZXR1cm4gcHRyO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1saWJyYXJ5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0TnVtYmVyRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBudW1iZXIge1xyXG4vLyAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldERhdGVGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IG51bWJlciB7XHJcbi8vICAgICByZXR1cm4gKGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSkgYXMgRGF0ZSkuZ2V0VGltZSgpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRTdHJpbmdGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgLypvdXQgaW50ICovbGVuZ3RoT2Zmc2V0OiBudW1iZXIsIGlzQnlSZWY6IGJvb2wpOiBudW1iZXIge1xyXG4vLyAgICAgdmFyIHJldHVyblN0ciA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxzdHJpbmc+KHZhbHVlKTtcclxuLy8gICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgbGVuZ3RoT2Zmc2V0KTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0Qm9vbGVhbkZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogYm9vbGVhbiB7XHJcbi8vICAgICByZXR1cm4gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gVmFsdWVJc0JpZ0ludChlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogYm9vbGVhbiB7XHJcbi8vICAgICB2YXIgYmlnaW50ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPGFueT4odmFsdWUpO1xyXG4vLyAgICAgcmV0dXJuIGJpZ2ludCBpbnN0YW5jZW9mIEJpZ0ludDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0QmlnSW50RnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcclxuLy8gICAgIHZhciBiaWdpbnQgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8YW55Pih2YWx1ZSk7XHJcbi8vICAgICByZXR1cm4gYmlnaW50O1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRPYmplY3RGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4vLyAgICAgdmFyIG5hdGl2ZU9iamVjdCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbi8vICAgICByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KG5hdGl2ZU9iamVjdCk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEZ1bmN0aW9uRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBKU0Z1bmN0aW9uUHRyIHtcclxuLy8gICAgIHZhciBmdW5jID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPCguLi5hcmdzOiBhbnlbXSkgPT4gYW55Pih2YWx1ZSk7XHJcbi8vICAgICB2YXIganNmdW5jID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuYyk7XHJcbi8vICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRKU09iamVjdEZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XHJcbi8vICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPCguLi5hcmdzOiBhbnlbXSkgPT4gYW55Pih2YWx1ZSk7XHJcbi8vICAgICB2YXIganNvYmogPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3Qob2JqKTtcclxuLy8gICAgIHJldHVybiBqc29iai5pZDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgLypvdXQgaW50ICovbGVuZ3RoT2Zmc2V0OiBhbnksIGlzT3V0OiBib29sKSB7XHJcbi8vICAgICB2YXIgYWIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8QXJyYXlCdWZmZXI+KHZhbHVlKTtcclxuLy8gICAgIGlmIChhYiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuLy8gICAgICAgICBhYiA9IGFiLmJ1ZmZlcjtcclxuLy8gICAgIH1cclxuLy8gICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcclxuLy8gICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XHJcbi8vICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW2xlbmd0aE9mZnNldCA+PiAyXSA9IGFiLmJ5dGVMZW5ndGg7XHJcbi8vICAgICBzZXRPdXRWYWx1ZTMyKGVuZ2luZSwgbGVuZ3RoT2Zmc2V0LCBhYi5ieXRlTGVuZ3RoKTtcclxuLy8gICAgIHJldHVybiBwdHI7XHJcbi8vIH1cclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEpT6LCD55SoQyPml7bvvIxDI+S+p+iOt+WPlkpT6LCD55So5Y+C5pWw55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU0FyZ3VtZW50QVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAvKioqKioqKioqKirov5npg6jliIbnjrDlnKjpg73mmK9DKyvlrp7njrDnmoQqKioqKioqKioqKiovXHJcbiAgICAgICAgLy8gR2V0TnVtYmVyRnJvbVZhbHVlOiBHZXROdW1iZXJGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldERhdGVGcm9tVmFsdWU6IEdldERhdGVGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldFN0cmluZ0Zyb21WYWx1ZTogR2V0U3RyaW5nRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRCb29sZWFuRnJvbVZhbHVlOiBHZXRCb29sZWFuRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBWYWx1ZUlzQmlnSW50OiBWYWx1ZUlzQmlnSW50LmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRCaWdJbnRGcm9tVmFsdWU6IEdldEJpZ0ludEZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0T2JqZWN0RnJvbVZhbHVlOiBHZXRPYmplY3RGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEZ1bmN0aW9uRnJvbVZhbHVlOiBHZXRGdW5jdGlvbkZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0SlNPYmplY3RGcm9tVmFsdWU6IEdldEpTT2JqZWN0RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRBcnJheUJ1ZmZlckZyb21WYWx1ZTogR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEFyZ3VtZW50VHlwZTogZnVuY3Rpb24gKGlzb2xhdGU6IEludFB0ciwgaW5mbzogTW9ja0ludFB0ciwgaW5kZXg6IGludCwgaXNCeVJlZjogYm9vbCkge1xyXG4gICAgICAgIC8vICAgICB2YXIgdmFsdWUgPSBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvLCBlbmdpbmUpLmFyZ3NbaW5kZXhdO1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gR2V0VHlwZShlbmdpbmUsIHZhbHVlKTtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIC8vIC8qKlxyXG4gICAgICAgIC8vICAqIOS4umMj5L6n5o+Q5L6b5LiA5Liq6I635Y+WY2FsbGJhY2tpbmZv6YeManN2YWx1ZeeahGludHB0cueahOaOpeWPo1xyXG4gICAgICAgIC8vICAqIOW5tuS4jeaYr+W+l+eahOWIsOi/meS4qmFyZ3VtZW5055qE5YC8XHJcbiAgICAgICAgLy8gICpcclxuICAgICAgICAvLyAgKiDor6XmjqXlj6Plj6rmnInkvY3ov5DnrpfvvIznlLFDKyvlrp7njrBcclxuICAgICAgICAvLyAgKi9cclxuICAgICAgICAvLyBHZXRBcmd1bWVudFZhbHVlLyppbkNhbGxiYWNrSW5mbyovOiBmdW5jdGlvbiAoaW5mb3B0cjogTW9ja0ludFB0ciwgaW5kZXg6IGludCkge1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gaW5mb3B0ciB8IGluZGV4O1xyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgICAgLy8gR2V0SnNWYWx1ZVR5cGU6IGZ1bmN0aW9uIChpc29sYXRlOiBJbnRQdHIsIHZhbDogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4gICAgICAgIC8vICAgICAvLyBwdWJsaWMgZW51bSBKc1ZhbHVlVHlwZVxyXG4gICAgICAgIC8vICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIC8vICAgICBOdWxsT3JVbmRlZmluZWQgPSAxLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQmlnSW50ID0gMixcclxuICAgICAgICAvLyAgICAgLy8gICAgIE51bWJlciA9IDQsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBTdHJpbmcgPSA4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQm9vbGVhbiA9IDE2LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgTmF0aXZlT2JqZWN0ID0gMzIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBKc09iamVjdCA9IDY0LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQXJyYXkgPSAxMjgsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBGdW5jdGlvbiA9IDI1NixcclxuICAgICAgICAvLyAgICAgLy8gICAgIERhdGUgPSA1MTIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBBcnJheUJ1ZmZlciA9IDEwMjQsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBVbmtub3cgPSAyMDQ4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQW55ID0gTnVsbE9yVW5kZWZpbmVkIHwgQmlnSW50IHwgTnVtYmVyIHwgU3RyaW5nIHwgQm9vbGVhbiB8IE5hdGl2ZU9iamVjdCB8IEFycmF5IHwgRnVuY3Rpb24gfCBEYXRlIHwgQXJyYXlCdWZmZXIsXHJcbiAgICAgICAgLy8gICAgIC8vIH07XHJcbiAgICAgICAgLy8gICAgIHZhciB2YWx1ZTogYW55ID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsLCBlbmdpbmUpO1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gR2V0VHlwZShlbmdpbmUsIHZhbHVlKTtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIC8qKioqKioqKioqKuS7peS4iueOsOWcqOmDveaYr0MrK+WunueOsOeahCoqKioqKioqKioqKi9cclxuICAgICAgICBHZXRUeXBlSWRGcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgaWYgKGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIG9iaiA9IG9ialswXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgdHlwZWlkID0gMDtcclxuICAgICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSBvYmouX2Z1bmNbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gb2JqW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZmluZCB0eXBlaWQgZm9yJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU0FyZ3VtZW50QVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1nZXRGcm9tSlNBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEMj6LCD55SoSlPml7bvvIzojrflj5ZKU+WHveaVsOi/lOWbnuWAvFxyXG4gKlxyXG4gKiDljp/mnInnmoRyZXN1bHRJbmZv6K6+6K6h5Ye65p2l5Y+q5piv5Li65LqG6K6p5aSaaXNvbGF0ZeaXtuiDveWcqOS4jeWQjOeahGlzb2xhdGXph4zkv53mjIHkuI3lkIznmoRyZXN1bHRcclxuICog5ZyoV2ViR0zmqKHlvI/kuIvmsqHmnInov5nkuKrng6bmgbzvvIzlm6DmraTnm7TmjqXnlKhlbmdpbmXnmoTljbPlj69cclxuICogcmVzdWx0SW5mb+WbuuWumuS4ujEwMjRcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kR2V0RnJvbUpTUmV0dXJuQVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBHZXROdW1iZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldERhdGVGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdC5nZXRUaW1lKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRTdHJpbmdGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9UZW1wQ1NTdHJpbmcoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCwgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEJvb2xlYW5Gcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlc3VsdElzQmlnSW50OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gKDAsIGxpYnJhcnlfMS5pc0JpZ0ludCkoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRCaWdJbnRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICAvLyBwdWVydHMgY29yZSB2Mi4wLjTlvIDlp4vmlK/mjIFcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEucmV0dXJuQmlnSW50KShlbmdpbmUsIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0T2JqZWN0RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldFR5cGVJZEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gdmFsdWUuX2Z1bmNbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gdmFsdWVbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdHlwZWlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBmaW5kIHR5cGVpZCBmb3InICsgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRGdW5jdGlvbkZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRKU09iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBqc29iaiA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3QoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc29iai5pZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEFycmF5QnVmZmVyRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGFiID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICAgICAgdmFyIHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKGFiLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDguc2V0KG5ldyBJbnQ4QXJyYXkoYWIpLCBwdHIpO1xyXG4gICAgICAgICAgICAoMCwgbGlicmFyeV8xLnNldE91dFZhbHVlMzIpKGVuZ2luZSwgbGVuZ3RoLCBhYi5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHB0cjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8v5L+d5a6I5pa55qGIXHJcbiAgICAgICAgR2V0UmVzdWx0VHlwZTogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuR2V0VHlwZSkoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kR2V0RnJvbUpTUmV0dXJuQVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1nZXRGcm9tSlNSZXR1cm4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiDms6jlhoznsbtBUEnvvIzlpoLms6jlhozlhajlsYDlh73mlbDjgIHms6jlhoznsbvvvIzku6Xlj4rnsbvnmoTlsZ7mgKfmlrnms5XnrYlcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEkoZW5naW5lKSB7XHJcbiAgICBjb25zdCByZXR1cm5lZSA9IHtcclxuICAgICAgICBTZXRHbG9iYWxGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIG5hbWVTdHJpbmcsIHY4RnVuY3Rpb25DYWxsYmFjaywganNFbnZJZHgsIGNhbGxiYWNraWR4KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICBsaWJyYXJ5XzEuZ2xvYmFsW25hbWVdID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24odHJ1ZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfUmVnaXN0ZXJDbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwganNFbnZJZHgsIGNhbGxiYWNraWR4LCBzaXplKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxOYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhmdWxsTmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNzaGFycE9iamVjdE1hcCA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXA7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICBsZXQgdGVtcEV4dGVybmFsQ1NJRCA9IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IGN0b3IgPSBmdW5jdGlvbiBOYXRpdmVPYmplY3QoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDorr7nva7nsbvlnotJRFxyXG4gICAgICAgICAgICAgICAgdGhpc1tcIiRjaWRcIl0gPSBpZDtcclxuICAgICAgICAgICAgICAgIC8vIG5hdGl2ZU9iamVjdOeahOaehOmAoOWHveaVsFxyXG4gICAgICAgICAgICAgICAgLy8g5p6E6YCg5Ye95pWw5pyJ5Lik5Liq6LCD55So55qE5Zyw5pa577yaMS4ganPkvqduZXfkuIDkuKrlroPnmoTml7blgJkgMi4gY3PkvqfliJvlu7rkuobkuIDkuKrlr7nosaHopoHkvKDliLBqc+S+p+aXtlxyXG4gICAgICAgICAgICAgICAgLy8g56ys5LiA5Liq5oOF5Ya177yMY3Plr7nosaFJROaIluiAheaYr2NhbGxWOENvbnN0cnVjdG9yQ2FsbGJhY2vov5Tlm57nmoTjgIJcclxuICAgICAgICAgICAgICAgIC8vIOesrOS6jOS4quaDheWGte+8jOWImWNz5a+56LGhSUTmmK9jcyBuZXflrozkuYvlkI7kuIDlubbkvKDnu5lqc+eahOOAglxyXG4gICAgICAgICAgICAgICAgbGV0IGNzSUQgPSB0ZW1wRXh0ZXJuYWxDU0lEOyAvLyDlpoLmnpzmmK/nrKzkuozkuKrmg4XlhrXvvIzmraRJROeUsWNyZWF0ZUZyb21DU+iuvue9rlxyXG4gICAgICAgICAgICAgICAgdGVtcEV4dGVybmFsQ1NJRCA9IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3NJRCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb1B0ciA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0TW9ja1BvaW50ZXIoYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6Jm954S2cHVlcnRz5YaFQ29uc3RydWN0b3LnmoTov5Tlm57lgLzlj6tzZWxm77yM5L2G5a6D5YW25a6e5bCx5pivQ1Plr7nosaHnmoTkuIDkuKppZOiAjOW3suOAglxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzSUQgPSBlbmdpbmUuY2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2soY29uc3RydWN0b3IsIGNhbGxiYWNrSW5mb1B0ciwgYXJncy5sZW5ndGgsIGNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5SZWxlYXNlQnlNb2NrSW50UHRyKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gYmxpdHRhYmxlXHJcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjc05ld0lEID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2Moc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLm1lbWNweShjc05ld0lELCBjc0lELCBzaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuYWRkKGNzTmV3SUQsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICgwLCBsaWJyYXJ5XzEuT25GaW5hbGl6ZSkodGhpcywgY3NOZXdJRCwgKGNzSWRlbnRpZmllcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAucmVtb3ZlKGNzSWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5fZnJlZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc0lELCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzSUQsIChjc0lkZW50aWZpZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLnJlbW92ZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhkZXN0cnVjdG9yIHx8IGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciwgY3NJZGVudGlmaWVyLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGN0b3IuY3JlYXRlRnJvbUNTID0gZnVuY3Rpb24gKGNzSUQpIHtcclxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSBjc0lEO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGN0b3IuX19wdWVydHNNZXRhZGF0YSA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwibmFtZVwiLCB7IHZhbHVlOiBmdWxsTmFtZSArIFwiQ29uc3RydWN0b3JcIiB9KTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwiJGNpZFwiLCB7IHZhbHVlOiBpZCB9KTtcclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMucHVzaChjdG9yKTtcclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzSURXZWFrTWFwLnNldChjdG9yLCBpZCk7XHJcbiAgICAgICAgICAgIGlmIChCYXNlVHlwZUlkID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY3Rvci5wcm90b3R5cGUuX19wcm90b19fID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbQmFzZVR5cGVJZF0ucHJvdG90eXBlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5uYW1lc1RvQ2xhc3Nlc0lEW2Z1bGxOYW1lXSA9IGlkO1xyXG4gICAgICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZWdpc3RlclN0cnVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCwgc2l6ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuZWUuX1JlZ2lzdGVyQ2xhc3MoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCBjYWxsYmFja2lkeCwgY2FsbGJhY2tpZHgsIHNpemUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBjYWxsYmFjaywgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCkge1xyXG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgICAgICBpZiAoIWNscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBmbiA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBjYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgaWYgKGlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICBjbHNbbmFtZV0gPSBmbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNscy5wcm90b3R5cGVbbmFtZV0gPSBmbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJQcm9wZXJ0eTogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBnZXR0ZXIsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBnZXR0ZXJqc0VudklkeCwgXHJcbiAgICAgICAgLypsb25nICovIGdldHRlcmNhbGxiYWNraWR4LCBzZXR0ZXIsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJqc0VudklkeCwgXHJcbiAgICAgICAgLypsb25nICovIHNldHRlcmNhbGxiYWNraWR4LCBkb250RGVsZXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBjbHMgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbY2xhc3NJRF07XHJcbiAgICAgICAgICAgIGlmICghY2xzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIHZhciBhdHRyID0ge1xyXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiAhZG9udERlbGV0ZSxcclxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChnZXR0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGF0dHIuZ2V0ID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGdldHRlciwgZ2V0dGVyY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzZXR0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGF0dHIuc2V0ID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIHNldHRlciwgc2V0dGVyY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscywgbmFtZSwgYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xzLnByb3RvdHlwZSwgbmFtZSwgYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgfTtcclxuICAgIHJldHVybiByZXR1cm5lZTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRSZWdpc3RlckFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmVnaXN0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBDI+iwg+eUqEpT5pe277yM6K6+572u6LCD55So5Y+C5pWw55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSW52b2tlSlNBcmd1bWVudEFwaShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgLy9iZWdpbiBjcyBjYWxsIGpzXHJcbiAgICAgICAgUHVzaE51bGxGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChudWxsKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hEYXRlRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgZGF0ZVZhbHVlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChuZXcgRGF0ZShkYXRlVmFsdWUpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hCb29sZWFuRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgYikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goISFiKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hCaWdJbnRGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKmxvbmcgKi8gbG9uZ2xvdywgbG9uZ2hpZ2gpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKCgwLCBsaWJyYXJ5XzEubWFrZUJpZ0ludCkobG9uZ2xvdywgbG9uZ2hpZ2gpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hTdHJpbmdGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoTnVtYmVyRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgZCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgY2xhc3NJRCwgb2JqZWN0SUQpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KG9iamVjdElELCBjbGFzc0lEKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoSlNGdW5jdGlvbkZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIEpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKEpTRnVuY3Rpb24pLl9mdW5jKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hKU09iamVjdEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIEpTT2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU09iamVjdEJ5SWQoSlNPYmplY3QpLmdldE9iamVjdCgpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hBcnJheUJ1ZmZlckZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qYnl0ZVtdICovIGluZGV4LCBsZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0ludm9rZUpTQXJndW1lbnRBcGk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSW52b2tlSlNBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEpT6LCD55SoQyPml7bvvIxDI+iuvue9rui/lOWbnuWIsEpT55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSlNJbnZva2VSZXR1cm5BcGkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIFJldHVybkNsYXNzOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgY2xhc3NJRCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbY2xhc3NJRF07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5PYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBjbGFzc0lELCBzZWxmKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KHNlbGYsIGNsYXNzSUQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuTnVtYmVyOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG51bWJlcjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVyblN0cmluZzogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHN0clN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCBzdHIgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZyk7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IHN0cjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkJpZ0ludDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGxvbmdMb3csIGxvbmdIaWdoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9ICgwLCBsaWJyYXJ5XzEubWFrZUJpZ0ludCkobG9uZ0xvdywgbG9uZ0hpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQm9vbGVhbjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gISFiOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuRGF0ZTogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGRhdGUpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5OdWxsOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbykge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBudWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBKU0Z1bmN0aW9uUHRyKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzRnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKEpTRnVuY3Rpb25QdHIpO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBqc0Z1bmMuX2Z1bmM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5KU09iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIEpTT2JqZWN0UHRyKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzT2JqZWN0ID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNPYmplY3RCeUlkKEpTT2JqZWN0UHRyKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0ganNPYmplY3QuZ2V0T2JqZWN0KCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5DU2hhcnBGdW5jdGlvbkNhbGxiYWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgdjhGdW5jdGlvbkNhbGxiYWNrLCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckxvdywgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJIaWdoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGZhbHNlLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIHBvaW50ZXJIaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkNTaGFycEZ1bmN0aW9uQ2FsbGJhY2syOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgdjhGdW5jdGlvbkNhbGxiYWNrLCBKc0Z1bmN0aW9uRmluYWxpemUsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVyTG93LCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckhpZ2gpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oZmFsc2UsIHY4RnVuY3Rpb25DYWxsYmFjaywgcG9pbnRlckhpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQXJyYXlCdWZmZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCAvKmJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0pTSW52b2tlUmV0dXJuQXBpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0pTSW52b2tlUmV0dXJuLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogSlPosIPnlKhDI+aXtu+8jEMj5L6n6K6+572ub3V05Y+C5pWw5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgU2V0TnVtYmVyVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBudW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG51bWJlcjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldERhdGVUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGRhdGUpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0U3RyaW5nVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gc3RyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0Qm9vbGVhblRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgYikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gISFiOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0QmlnSW50VG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBsb3csIGhpZ2gpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb3csIGhpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0T2JqZWN0VG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBjbGFzc0lELCBzZWxmKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChzZWxmLCBjbGFzc0lEKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldE51bGxUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG51bGw7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRBcnJheUJ1ZmZlclRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgLypCeXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9KU091dEFyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuV2ViR0xSZWdzdGVyQXBpID0gZXhwb3J0cy5XZWJHTEZGSUFwaSA9IHZvaWQgMDtcclxuY29uc3QgQnVmZmVyID0gcmVxdWlyZShcIi4vYnVmZmVyXCIpO1xyXG5sZXQgbG9hZGVyID0gbnVsbDtcclxubGV0IGxvYWRlclJlc29sdmUgPSBudWxsO1xyXG5jb25zdCBleGVjdXRlTW9kdWxlQ2FjaGUgPSB7fTtcclxuLyoqXHJcbiAqIFNwYXJzZSBBcnJheSBpbXBsZW1lbnRhdGlvbiB3aXRoIGVmZmljaWVudCBhZGQvcmVtb3ZlIG9wZXJhdGlvbnNcclxuICogLSBNYWludGFpbnMgY29udGlndW91cyBzdG9yYWdlXHJcbiAqIC0gUmV1c2VzIGVtcHR5IHNsb3RzIGZyb20gZGVsZXRpb25zXHJcbiAqIC0gTygxKSBhZGQvcmVtb3ZlIGluIG1vc3QgY2FzZXNcclxuICovXHJcbmNsYXNzIFNwYXJzZUFycmF5IHtcclxuICAgIF9kYXRhO1xyXG4gICAgX2ZyZWVJbmRpY2VzO1xyXG4gICAgX2xlbmd0aDtcclxuICAgIGNvbnN0cnVjdG9yKGNhcGFjaXR5ID0gMCkge1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSBuZXcgQXJyYXkoY2FwYWNpdHkpO1xyXG4gICAgICAgIHRoaXMuX2ZyZWVJbmRpY2VzID0gW107XHJcbiAgICAgICAgdGhpcy5fbGVuZ3RoID0gMDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQWRkIGFuIGVsZW1lbnQgdG8gdGhlIGFycmF5XHJcbiAgICAgKiBAcmV0dXJucyBUaGUgaW5kZXggd2hlcmUgdGhlIGVsZW1lbnQgd2FzIGluc2VydGVkXHJcbiAgICAgKi9cclxuICAgIGFkZChlbGVtZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZyZWVJbmRpY2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9mcmVlSW5kaWNlcy5wb3AoKTtcclxuICAgICAgICAgICAgdGhpcy5fZGF0YVtpbmRleF0gPSBlbGVtZW50O1xyXG4gICAgICAgICAgICB0aGlzLl9sZW5ndGgrKztcclxuICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuX2RhdGEubGVuZ3RoO1xyXG4gICAgICAgIHRoaXMuX2RhdGEucHVzaChlbGVtZW50KTtcclxuICAgICAgICB0aGlzLl9sZW5ndGgrKztcclxuICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBhbiBlbGVtZW50IGJ5IGluZGV4XHJcbiAgICAgKiBAcmV0dXJucyB0cnVlIGlmIHJlbW92YWwgd2FzIHN1Y2Nlc3NmdWxcclxuICAgICAqL1xyXG4gICAgcmVtb3ZlKGluZGV4KSB7XHJcbiAgICAgICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLl9kYXRhLmxlbmd0aCB8fCB0aGlzLl9kYXRhW2luZGV4XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fZGF0YVtpbmRleF0gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy5fZnJlZUluZGljZXMucHVzaChpbmRleCk7XHJcbiAgICAgICAgdGhpcy5fbGVuZ3RoLS07XHJcbiAgICAgICAgLy8gQ29tcGFjdCB0aGUgYXJyYXkgaWYgbGFzdCBlbGVtZW50IGlzIHJlbW92ZWRcclxuICAgICAgICBpZiAoaW5kZXggPT09IHRoaXMuX2RhdGEubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICB0aGlzLl9jb21wYWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgZWxlbWVudCBieSBpbmRleFxyXG4gICAgICovXHJcbiAgICBnZXQoaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtpbmRleF07XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIEN1cnJlbnQgbnVtYmVyIG9mIGFjdGl2ZSBlbGVtZW50c1xyXG4gICAgICovXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9sZW5ndGg7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFRvdGFsIGNhcGFjaXR5IChpbmNsdWRpbmcgZW1wdHkgc2xvdHMpXHJcbiAgICAgKi9cclxuICAgIGdldCBjYXBhY2l0eSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIENvbXBhY3QgdGhlIGFycmF5IGJ5IHJlbW92aW5nIHRyYWlsaW5nIHVuZGVmaW5lZCBlbGVtZW50c1xyXG4gICAgICovXHJcbiAgICBfY29tcGFjdCgpIHtcclxuICAgICAgICBsZXQgbGFzdEluZGV4ID0gdGhpcy5fZGF0YS5sZW5ndGggLSAxO1xyXG4gICAgICAgIHdoaWxlIChsYXN0SW5kZXggPj0gMCAmJiB0aGlzLl9kYXRhW2xhc3RJbmRleF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9kYXRhLnBvcCgpO1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYW55IGZyZWUgaW5kaWNlcyBpbiB0aGUgY29tcGFjdGVkIGFyZWFcclxuICAgICAgICAgICAgY29uc3QgY29tcGFjdGVkSW5kZXggPSB0aGlzLl9mcmVlSW5kaWNlcy5pbmRleE9mKGxhc3RJbmRleCk7XHJcbiAgICAgICAgICAgIGlmIChjb21wYWN0ZWRJbmRleCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ZyZWVJbmRpY2VzLnNwbGljZShjb21wYWN0ZWRJbmRleCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGFzdEluZGV4LS07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIEV4ZWN1dGVNb2R1bGUoZmlsZU5hbWUpIHtcclxuICAgIGlmIChbJ3B1ZXJ0cy9sb2cubWpzJywgJ3B1ZXJ0cy90aW1lci5tanMnXS5pbmRleE9mKGZpbGVOYW1lKSAhPSAtMSkge1xyXG4gICAgICAgIHJldHVybiB7fTtcclxuICAgIH1cclxuICAgIGlmICghbG9hZGVyKSB7XHJcbiAgICAgICAgbG9hZGVyID0gZ2xvYmFsVGhpcy5qc0Vudi5sb2FkZXI7XHJcbiAgICAgICAgbG9hZGVyUmVzb2x2ZSA9IGxvYWRlci5SZXNvbHZlID8gKGZ1bmN0aW9uIChmaWxlTmFtZSwgdG8gPSBcIlwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkTmFtZSA9IGxvYWRlci5SZXNvbHZlKGZpbGVOYW1lLCB0byk7XHJcbiAgICAgICAgICAgIGlmICghcmVzb2x2ZWROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBub3QgZm91bmQ6ICcgKyBmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkTmFtZTtcclxuICAgICAgICB9KSA6IG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAobG9hZGVyUmVzb2x2ZSkge1xyXG4gICAgICAgIGZpbGVOYW1lID0gbG9hZGVyUmVzb2x2ZShmaWxlTmFtZSwgXCJcIik7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gd3hSZXF1aXJlKCdwdWVydHNfbWluaWdhbWVfanNfcmVzb3VyY2VzLycgKyAoZmlsZU5hbWUuZW5kc1dpdGgoJy5qcycpID8gZmlsZU5hbWUgOiBmaWxlTmFtZSArIFwiLmpzXCIpKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplKG5hbWUsIHRvKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgQ1MgIT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuSXNSZWxhdGl2ZSh0bykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXQgPSBDUy5QdWVydHMuUGF0aEhlbHBlci5ub3JtYWxpemUoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuRGlybmFtZShuYW1lKSArIFwiL1wiICsgdG8pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRvO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtb2NrUmVxdWlyZShzcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBleHBvcnRzOiB7fSB9O1xyXG4gICAgICAgICAgICBjb25zdCBmb3VuZENhY2hlU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIGV4ZWN1dGVNb2R1bGVDYWNoZSk7XHJcbiAgICAgICAgICAgIGlmIChmb3VuZENhY2hlU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuZXhwb3J0cyA9IGV4ZWN1dGVNb2R1bGVDYWNoZVtmb3VuZENhY2hlU3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIFBVRVJUU19KU19SRVNPVVJDRVMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZFNwZWNpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIHNwZWNpZmllcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzcGVjaWZpZXIgPSBmb3VuZFNwZWNpZmllcjtcclxuICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gLTE7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIFBVRVJUU19KU19SRVNPVVJDRVNbc3BlY2lmaWVyXShyZXN1bHQuZXhwb3J0cywgZnVuY3Rpb24gbVJlcXVpcmUoc3BlY2lmaWVyVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vY2tSZXF1aXJlKGxvYWRlclJlc29sdmUgPyBsb2FkZXJSZXNvbHZlKHNwZWNpZmllclRvLCBzcGVjaWZpZXIpIDogbm9ybWFsaXplKHNwZWNpZmllciwgc3BlY2lmaWVyVG8pKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gcmVzdWx0LmV4cG9ydHM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgb2JqKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdHJ5RmluZE5hbWUgPSBbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgIGlmIChzcGVjaWZpZXIuaW5kZXhPZignLicpID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIHRyeUZpbmROYW1lID0gdHJ5RmluZE5hbWUuY29uY2F0KFtzcGVjaWZpZXIgKyAnLmpzJywgc3BlY2lmaWVyICsgJy50cycsIHNwZWNpZmllciArICcubWpzJywgc3BlY2lmaWVyICsgJy5tdHMnXSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZmluZGVkID0gdHJ5RmluZE5hbWUucmVkdWNlKChyZXQsIG5hbWUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJldCAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmpbbmFtZV0gPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNpcmN1bGFyIGRlcGVuZGVuY3kgaXMgZGV0ZWN0ZWQgd2hlbiByZXF1aXJpbmcgXCIke25hbWV9XCJgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmluZGVkID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyeUZpbmROYW1lW2ZpbmRlZF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcmVxdWlyZVJldCA9IG1vY2tSZXF1aXJlKGZpbGVOYW1lKTtcclxuICAgICAgICByZXR1cm4gcmVxdWlyZVJldDtcclxuICAgIH1cclxufVxyXG5nbG9iYWxUaGlzLl9fcHVlcnRzRXhlY3V0ZU1vZHVsZSA9IEV4ZWN1dGVNb2R1bGU7XHJcbnZhciBKU1RhZztcclxuKGZ1bmN0aW9uIChKU1RhZykge1xyXG4gICAgLyogYWxsIHRhZ3Mgd2l0aCBhIHJlZmVyZW5jZSBjb3VudCBhcmUgbmVnYXRpdmUgKi9cclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0ZJUlNUXCJdID0gLTldID0gXCJKU19UQUdfRklSU1RcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX1NUUklOR1wiXSA9IC05XSA9IFwiSlNfVEFHX1NUUklOR1wiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfU1RSSU5HMTZcIl0gPSAtOF0gPSBcIkpTX1RBR19TVFJJTkcxNlwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfQlVGRkVSXCJdID0gLTddID0gXCJKU19UQUdfQlVGRkVSXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19FWENFUFRJT05cIl0gPSAtNl0gPSBcIkpTX1RBR19FWENFUFRJT05cIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX05BVElWRV9PQkpFQ1RcIl0gPSAtNF0gPSBcIkpTX1RBR19OQVRJVkVfT0JKRUNUXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19BUlJBWVwiXSA9IC0zXSA9IFwiSlNfVEFHX0FSUkFZXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19GVU5DVElPTlwiXSA9IC0yXSA9IFwiSlNfVEFHX0ZVTkNUSU9OXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19PQkpFQ1RcIl0gPSAtMV0gPSBcIkpTX1RBR19PQkpFQ1RcIjtcclxuICAgIEpTVGFnW0pTVGFnW1wiSlNfVEFHX0lOVFwiXSA9IDBdID0gXCJKU19UQUdfSU5UXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19CT09MXCJdID0gMV0gPSBcIkpTX1RBR19CT09MXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19OVUxMXCJdID0gMl0gPSBcIkpTX1RBR19OVUxMXCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19VTkRFRklORURcIl0gPSAzXSA9IFwiSlNfVEFHX1VOREVGSU5FRFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfVU5JTklUSUFMSVpFRFwiXSA9IDRdID0gXCJKU19UQUdfVU5JTklUSUFMSVpFRFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfRkxPQVQ2NFwiXSA9IDVdID0gXCJKU19UQUdfRkxPQVQ2NFwiO1xyXG4gICAgSlNUYWdbSlNUYWdbXCJKU19UQUdfSU5UNjRcIl0gPSA2XSA9IFwiSlNfVEFHX0lOVDY0XCI7XHJcbiAgICBKU1RhZ1tKU1RhZ1tcIkpTX1RBR19VSU5UNjRcIl0gPSA3XSA9IFwiSlNfVEFHX1VJTlQ2NFwiO1xyXG59KShKU1RhZyB8fCAoSlNUYWcgPSB7fSkpO1xyXG5sZXQgaGFzRXhjZXB0aW9uID0gZmFsc2U7XHJcbmxldCBsYXN0RXhjZXB0aW9uID0gdW5kZWZpbmVkO1xyXG5sZXQgbGFzdEV4Y2VwdGlvbkJ1ZmZlciA9IHVuZGVmaW5lZDtcclxuZnVuY3Rpb24gZ2V0RXhjZXB0aW9uQXNOYXRpdmVTdHJpbmcod2FzbUFwaSwgd2l0aF9zdGFjaykge1xyXG4gICAgaWYgKGhhc0V4Y2VwdGlvbikge1xyXG4gICAgICAgIGhhc0V4Y2VwdGlvbiA9IGZhbHNlO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBsYXN0RXhjZXB0aW9uID09PSAnb2JqZWN0JyAmJiBsYXN0RXhjZXB0aW9uICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IGxhc3RFeGNlcHRpb24ubWVzc2FnZTtcclxuICAgICAgICAgICAgY29uc3Qgc3RhY2sgPSBsYXN0RXhjZXB0aW9uLnN0YWNrO1xyXG4gICAgICAgICAgICByZXN1bHQgPSB3aXRoX3N0YWNrID8gYCR7bXNnfVxcbiR7c3RhY2t9YCA6IG1zZztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGAke2xhc3RFeGNlcHRpb259YDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICAgICAgY29uc3QgYnl0ZUNvdW50ID0gd2FzbUFwaS5sZW5ndGhCeXRlc1VURjgocmVzdWx0KTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZ2V0RXhjZXB0aW9uQXNOYXRpdmVTdHJpbmcoJHtieXRlQ291bnR9KTogJHtyZXN1bHR9YCk7XHJcbiAgICAgICAgaWYgKGxhc3RFeGNlcHRpb25CdWZmZXIpIHtcclxuICAgICAgICAgICAgd2FzbUFwaS5fZnJlZShsYXN0RXhjZXB0aW9uQnVmZmVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGFzdEV4Y2VwdGlvbkJ1ZmZlciA9IHdhc21BcGkuX21hbGxvYyhieXRlQ291bnQgKyAxKTtcclxuICAgICAgICAvLyDov5nkuI0rMeS8muWvvOiHtOWwkeS4gOS4quWtl+espu+8jOeci+S4iuWOu3N0cmluZ1RvVVRGOOeahOmAu+i+keaYr+iupOS4uuivpemVv+W6puaYr2J1ZmZlcueahOacgOWkp+mVv+W6pu+8jOiAjOS4lOehruS/nee7k+WwvuaciVxcMOe7k+adn+esplxyXG4gICAgICAgIHdhc21BcGkuc3RyaW5nVG9VVEY4KHJlc3VsdCwgbGFzdEV4Y2VwdGlvbkJ1ZmZlciwgYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgLy8g5aaC5p6c5LiK6L+w5o6o6K665q2j56Gu77yM6L+Z6KGM5piv5aSa5L2Z55qE77yM5LiN6L+H5L+d6Zmp6LW36KeB6L+Y5piv5Yqg5LiLXHJcbiAgICAgICAgd2FzbUFwaS5IRUFQVThbbGFzdEV4Y2VwdGlvbkJ1ZmZlciArIGJ5dGVDb3VudF0gPSAwO1xyXG4gICAgICAgIHJldHVybiBsYXN0RXhjZXB0aW9uQnVmZmVyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDA7XHJcbn1cclxuZnVuY3Rpb24gZ2V0QW5kQ2xlYXJMYXN0RXhjZXB0aW9uKCkge1xyXG4gICAgaGFzRXhjZXB0aW9uID0gZmFsc2U7XHJcbiAgICBjb25zdCByZXQgPSBsYXN0RXhjZXB0aW9uO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICByZXR1cm4gcmV0O1xyXG59XHJcbmZ1bmN0aW9uIHNldExhc3RFeGNlcHRpb24oZXJyKSB7XHJcbiAgICBoYXNFeGNlcHRpb24gPSB0cnVlO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IGVycjtcclxufVxyXG5jbGFzcyBTY29wZSB7XHJcbiAgICBzdGF0aWMgY3VycmVudCA9IHVuZGVmaW5lZDtcclxuICAgIHN0YXRpYyBnZXRDdXJyZW50KCkge1xyXG4gICAgICAgIHJldHVybiBTY29wZS5jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGVudGVyKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgU2NvcGUoKTtcclxuICAgIH1cclxuICAgIHN0YXRpYyBleGl0KHdhc21BcGkpIHtcclxuICAgICAgICBnZXRBbmRDbGVhckxhc3RFeGNlcHRpb24oKTtcclxuICAgICAgICBTY29wZS5jdXJyZW50LmNsb3NlKHdhc21BcGkpO1xyXG4gICAgfVxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5wcmV2U2NvcGUgPSBTY29wZS5jdXJyZW50O1xyXG4gICAgICAgIFNjb3BlLmN1cnJlbnQgPSB0aGlzO1xyXG4gICAgfVxyXG4gICAgY2xvc2Uod2FzbUFwaSkge1xyXG4gICAgICAgIFNjb3BlLmN1cnJlbnQgPSB0aGlzLnByZXZTY29wZTtcclxuICAgIH1cclxuICAgIGFkZFRvU2NvcGUob2JqKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RzSW5TY29wZS5wdXNoKG9iaik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGUubGVuZ3RoIC0gMTtcclxuICAgIH1cclxuICAgIGdldEZyb21TY29wZShpbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdHNJblNjb3BlW2luZGV4XTtcclxuICAgIH1cclxuICAgIHRvSnMod2FzbUFwaSwgb2JqTWFwcGVyLCBwdmFsdWUsIGZyZWVTdHJpbmdBbmRCdWZmZXIgPSBmYWxzZSkge1xyXG4gICAgICAgIGlmIChwdmFsdWUgPT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICBjb25zdCBoZWFwID0gd2FzbUFwaS5IRUFQVTg7XHJcbiAgICAgICAgY29uc3QgdGFnUHRyID0gcHZhbHVlICsgODtcclxuICAgICAgICBjb25zdCB2YWxUeXBlID0gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCB0YWdQdHIpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coYHZhbFR5cGU6ICR7dmFsVHlwZX1gKTtcclxuICAgICAgICBpZiAodmFsVHlwZSA8PSBKU1RhZy5KU19UQUdfT0JKRUNUICYmIHZhbFR5cGUgPj0gSlNUYWcuSlNfVEFHX0FSUkFZKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9iaklkeCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0c0luU2NvcGVbb2JqSWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbFR5cGUgPT0gSlNUYWcuSlNfVEFHX05BVElWRV9PQkpFQ1QpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2JqSWQgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmpNYXBwZXIuZmluZE5hdGl2ZU9iamVjdChvYmpJZCk7IC8vIOiCr+WumuW3sue7j3B1c2jov4fkuobvvIznm7TmjqVmaW5k5bCx5Y+v5Lul5LqGXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN3aXRjaCAodmFsVHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19CT09MOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKSAhPSAwO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19JTlQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRJbnQzMihoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19OVUxMOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX1VOREVGSU5FRDpcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0ZMT0FUNjQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWREb3VibGUoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfSU5UNjQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRJbnQ2NChoZWFwLCBwdmFsdWUpO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19VSU5UNjQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQnVmZmVyLnJlYWRVSW50NjQoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgY2FzZSBKU1RhZy5KU19UQUdfU1RSSU5HOlxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RyU3RhcnQgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHJMZW4gPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSArIDQpO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RyID0gd2FzbUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RhcnQsIHN0ckxlbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnJlZVN0cmluZ0FuZEJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lZWRfZnJlZSA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgdGFnUHRyICsgNCk7IC8vIG5lZWRfZnJlZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWVkX2ZyZWUgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXNtQXBpLl9mcmVlKHN0clN0YXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICAgICAgICBjYXNlIEpTVGFnLkpTX1RBR19TVFJJTkcxNjpcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0cjE2U3RhcnQgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHIxNkxlbiA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlICsgNCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdHIxNiA9IHdhc21BcGkuVVRGMTZUb1N0cmluZyhzdHIxNlN0YXJ0LCBzdHIxNkxlbiAqIDIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZyZWVTdHJpbmdBbmRCdWZmZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZWVkX2ZyZWUgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHRhZ1B0ciArIDQpOyAvLyBuZWVkX2ZyZWVcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmVlZF9mcmVlICE9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2FzbUFwaS5fZnJlZShzdHIxNlN0YXJ0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyMTY7XHJcbiAgICAgICAgICAgIGNhc2UgSlNUYWcuSlNfVEFHX0JVRkZFUjpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZTdGFydCA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgcHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1ZmZMZW4gPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIHB2YWx1ZSArIDQpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZiA9IHdhc21BcGkuSEVBUDguYnVmZmVyLnNsaWNlKGJ1ZmZTdGFydCwgYnVmZlN0YXJ0ICsgYnVmZkxlbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnJlZVN0cmluZ0FuZEJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lZWRfZnJlZSA9IEJ1ZmZlci5yZWFkSW50MzIoaGVhcCwgdGFnUHRyICsgNCk7IC8vIG5lZWRfZnJlZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZWVkX2ZyZWUgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3YXNtQXBpLl9mcmVlKGJ1ZmZTdGFydCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJ1ZmY7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgdHlwZTogJHt2YWxUeXBlfWApO1xyXG4gICAgfVxyXG4gICAgcHJldlNjb3BlID0gdW5kZWZpbmVkO1xyXG4gICAgb2JqZWN0c0luU2NvcGUgPSBbbnVsbF07IC8vIOWKoG51bGzkuLrkuoZpbmRleOS7jjHlvIDlp4vvvIzlm6DkuLrlnKjljp/nlJ/np43lrZjmlL7lnKjmjIfpkojlrZfmrrXpmLLmraLor6/liKTkuLpudWxscHRyXHJcbn1cclxuY2xhc3MgT2JqZWN0UG9vbCB7XHJcbiAgICBzdG9yYWdlID0gbmV3IE1hcCgpO1xyXG4gICAgZ2NJdGVyYXRvcjtcclxuICAgIGdjVGltZW91dCA9IG51bGw7XHJcbiAgICBpc0djUnVubmluZyA9IGZhbHNlO1xyXG4gICAgLy8gR0MgY29uZmlndXJhdGlvbiBkZWZhdWx0c1xyXG4gICAgZ2NCYXRjaFNpemUgPSAxMDA7XHJcbiAgICBnY0ludGVydmFsTXMgPSA1MDtcclxuICAgIGNsZWFudXBDYWxsYmFjayA9IHVuZGVmaW5lZDtcclxuICAgIGNvbnN0cnVjdG9yKGNsZWFudXBDYWxsYmFjaykge1xyXG4gICAgICAgIHRoaXMuY2xlYW51cENhbGxiYWNrID0gY2xlYW51cENhbGxiYWNrO1xyXG4gICAgfVxyXG4gICAgYWRkKG9iaklkLCBvYmosIHR5cGVJZCwgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgY29uc3QgcmVmID0gbmV3IFdlYWtSZWYob2JqKTtcclxuICAgICAgICB0aGlzLnN0b3JhZ2Uuc2V0KG9iaklkLCBbcmVmLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZV0pO1xyXG4gICAgICAgIG9iai4kT2JqSWRfXyA9IG9iaklkO1xyXG4gICAgICAgIG9iai4kVHlwZUlkX18gPSB0eXBlSWQ7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBnZXQob2JqSWQpIHtcclxuICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMuc3RvcmFnZS5nZXQob2JqSWQpO1xyXG4gICAgICAgIGlmICghZW50cnkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBbcmVmLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZV0gPSBlbnRyeTtcclxuICAgICAgICBjb25zdCBvYmogPSByZWYuZGVyZWYoKTtcclxuICAgICAgICBpZiAoIW9iaikge1xyXG4gICAgICAgICAgICB0aGlzLnN0b3JhZ2UuZGVsZXRlKG9iaklkKTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhbnVwQ2FsbGJhY2sob2JqSWQsIHR5cGVJZCwgY2FsbEZpbmFsaXplKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH1cclxuICAgIHN0YXRpYyBHZXROYXRpdmVJbmZvT2ZPYmplY3Qob2JqKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqSWQgPSBvYmouJE9iaklkX187XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmpJZCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtvYmpJZCwgb2JqLiRUeXBlSWRfX107XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaGFzKG9iaklkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RvcmFnZS5oYXMob2JqSWQpO1xyXG4gICAgfVxyXG4gICAgZnVsbEdjKCkge1xyXG4gICAgICAgIGZvciAoY29uc3QgW29iaklkXSBvZiB0aGlzLnN0b3JhZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy5nZXQob2JqSWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBPbmx5IHJlc2V0IGl0ZXJhdG9yIGlmIEdDIGlzIHJ1bm5pbmcgdG8gbWFpbnRhaW4gaXRlcmF0aW9uIHN0YXRlXHJcbiAgICAgICAgaWYgKHRoaXMuaXNHY1J1bm5pbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5nY0l0ZXJhdG9yID0gdGhpcy5zdG9yYWdlLmtleXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTdGFydCBpbmNyZW1lbnRhbCBnYXJiYWdlIGNvbGxlY3Rpb24gd2l0aCBjb25maWd1cmFibGUgcGFyYW1ldGVyc1xyXG4gICAgc3RhcnRJbmNyZW1lbnRhbEdjKGJhdGNoU2l6ZSA9IDEwMCwgaW50ZXJ2YWxNcyA9IDUwKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNHY1J1bm5pbmcpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB0aGlzLmlzR2NSdW5uaW5nID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmdjQmF0Y2hTaXplID0gTWF0aC5tYXgoMSwgYmF0Y2hTaXplKTtcclxuICAgICAgICB0aGlzLmdjSW50ZXJ2YWxNcyA9IE1hdGgubWF4KDAsIGludGVydmFsTXMpO1xyXG4gICAgICAgIHRoaXMuZ2NJdGVyYXRvciA9IHRoaXMuc3RvcmFnZS5rZXlzKCk7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzR2NCYXRjaCgpO1xyXG4gICAgfVxyXG4gICAgLy8gU3RvcCBpbmNyZW1lbnRhbCBnYXJiYWdlIGNvbGxlY3Rpb25cclxuICAgIHN0b3BJbmNyZW1lbnRhbEdjKCkge1xyXG4gICAgICAgIHRoaXMuaXNHY1J1bm5pbmcgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGhpcy5nY1RpbWVvdXQpIHtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZ2NUaW1lb3V0KTtcclxuICAgICAgICAgICAgdGhpcy5nY1RpbWVvdXQgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHByb2Nlc3NHY0JhdGNoKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5pc0djUnVubmluZylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGxldCBwcm9jZXNzZWQgPSAwO1xyXG4gICAgICAgIGxldCBuZXh0ID0gdGhpcy5nY0l0ZXJhdG9yLm5leHQoKTtcclxuICAgICAgICB3aGlsZSAoIW5leHQuZG9uZSAmJiBwcm9jZXNzZWQgPCB0aGlzLmdjQmF0Y2hTaXplKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0KG5leHQudmFsdWUpO1xyXG4gICAgICAgICAgICBwcm9jZXNzZWQrKztcclxuICAgICAgICAgICAgbmV4dCA9IHRoaXMuZ2NJdGVyYXRvci5uZXh0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuZXh0LmRvbmUpIHtcclxuICAgICAgICAgICAgLy8gUmVzdGFydCBpdGVyYXRvciBmb3IgbmV4dCByb3VuZFxyXG4gICAgICAgICAgICB0aGlzLmdjSXRlcmF0b3IgPSB0aGlzLnN0b3JhZ2Uua2V5cygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmdjVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5wcm9jZXNzR2NCYXRjaCgpLCB0aGlzLmdjSW50ZXJ2YWxNcyk7XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgQ2xhc3NSZWdpc3RlciB7XHJcbiAgICBzdGF0aWMgaW5zdGFuY2U7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHsgfVxyXG4gICAgY2xhc3NOb3RGb3VuZCA9IHVuZGVmaW5lZDtcclxuICAgIHR5cGVJZFRvQ2xhc3MgPSBuZXcgTWFwKCk7XHJcbiAgICB0eXBlSWRUb0luZm9zID0gbmV3IE1hcCgpO1xyXG4gICAgbmFtZVRvQ2xhc3MgPSBuZXcgTWFwKCk7XHJcbiAgICBzdGF0aWMgZ2V0SW5zdGFuY2UoKSB7XHJcbiAgICAgICAgaWYgKCFDbGFzc1JlZ2lzdGVyLmluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgIENsYXNzUmVnaXN0ZXIuaW5zdGFuY2UgPSBuZXcgQ2xhc3NSZWdpc3RlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQ2xhc3NSZWdpc3Rlci5pbnN0YW5jZTtcclxuICAgIH1cclxuICAgIGxvYWRDbGFzc0J5SWQodHlwZUlkKSB7XHJcbiAgICAgICAgY29uc3QgY2xzID0gdGhpcy50eXBlSWRUb0NsYXNzLmdldCh0eXBlSWQpO1xyXG4gICAgICAgIGlmIChjbHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNscztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNsYXNzTm90Rm91bmQgJiYgdGhpcy5jbGFzc05vdEZvdW5kKHR5cGVJZCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnR5cGVJZFRvQ2xhc3MuZ2V0KHR5cGVJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZWdpc3RlckNsYXNzKHR5cGVJZCwgY2xzLCBmaW5hbGl6ZSwgY2xzRGF0YSkge1xyXG4gICAgICAgIGNvbnN0IGluZm9zID0geyB0eXBlSWQsIGZpbmFsaXplLCBkYXRhOiBjbHNEYXRhIH07XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscywgJyRJbmZvcycsIHtcclxuICAgICAgICAgICAgdmFsdWU6IGluZm9zLFxyXG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy50eXBlSWRUb0NsYXNzLnNldCh0eXBlSWQsIGNscyk7XHJcbiAgICAgICAgdGhpcy50eXBlSWRUb0luZm9zLnNldCh0eXBlSWQsIGluZm9zKTtcclxuICAgICAgICB0aGlzLm5hbWVUb0NsYXNzLnNldChjbHMubmFtZSwgY2xzKTtcclxuICAgIH1cclxuICAgIGdldENsYXNzRGF0YUJ5SWQodHlwZUlkLCBmb3JjZUxvYWQpIHtcclxuICAgICAgICBpZiAoZm9yY2VMb2FkKSB7XHJcbiAgICAgICAgICAgIHRoaXMubG9hZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBpbmZvcyA9IHRoaXMuZ2V0VHlwZUluZm9zKHR5cGVJZCk7XHJcbiAgICAgICAgcmV0dXJuIGluZm9zID8gaW5mb3MuZGF0YSA6IDA7XHJcbiAgICB9XHJcbiAgICBmaW5kQ2xhc3NCeUlkKHR5cGVJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnR5cGVJZFRvQ2xhc3MuZ2V0KHR5cGVJZCk7XHJcbiAgICB9XHJcbiAgICBmaW5kQ2xhc3NCeU5hbWUobmFtZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5hbWVUb0NsYXNzLmdldChuYW1lKTtcclxuICAgIH1cclxuICAgIGdldFR5cGVJbmZvcyh0eXBlSWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50eXBlSWRUb0luZm9zLmdldCh0eXBlSWQpO1xyXG4gICAgfVxyXG4gICAgc2V0Q2xhc3NOb3RGb3VuZENhbGxiYWNrKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc05vdEZvdW5kID0gY2FsbGJhY2s7XHJcbiAgICB9XHJcbiAgICB0cmFjZU5hdGl2ZU9iamVjdExpZmVjeWNsZSh0eXBlSWQsIG9uRW50ZXIsIG9uRXhpdCkge1xyXG4gICAgICAgIGNvbnN0IGluZm9zID0gdGhpcy5nZXRUeXBlSW5mb3ModHlwZUlkKTtcclxuICAgICAgICBpZiAoaW5mb3MpIHtcclxuICAgICAgICAgICAgaW5mb3Mub25FbnRlciA9IG9uRW50ZXI7XHJcbiAgICAgICAgICAgIGluZm9zLm9uRXhpdCA9IG9uRXhpdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgT2JqZWN0TWFwcGVyIHtcclxuICAgIG9iamVjdFBvb2w7XHJcbiAgICBwcml2YXRlRGF0YSA9IHVuZGVmaW5lZDtcclxuICAgIG9iaklkMnVkID0gbmV3IE1hcCgpO1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RQb29sID0gbmV3IE9iamVjdFBvb2wodGhpcy5Pbk5hdGl2ZU9iamVjdEZpbmFsaXplZC5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLm9iamVjdFBvb2wuc3RhcnRJbmNyZW1lbnRhbEdjKDEwMCwgMTAwMCk7XHJcbiAgICB9XHJcbiAgICBwdXNoTmF0aXZlT2JqZWN0KG9iaklkLCB0eXBlSWQsIGNhbGxGaW5hbGl6ZSkge1xyXG4gICAgICAgIGxldCBqc09iaiA9IHRoaXMub2JqZWN0UG9vbC5nZXQob2JqSWQpO1xyXG4gICAgICAgIGlmICghanNPYmopIHtcclxuICAgICAgICAgICAgY29uc3QgY2xzID0gQ2xhc3NSZWdpc3Rlci5nZXRJbnN0YW5jZSgpLmxvYWRDbGFzc0J5SWQodHlwZUlkKTtcclxuICAgICAgICAgICAgaWYgKGNscykge1xyXG4gICAgICAgICAgICAgICAganNPYmogPSBPYmplY3QuY3JlYXRlKGNscy5wcm90b3R5cGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kTmF0aXZlT2JqZWN0KG9iaklkLCBqc09iaiwgdHlwZUlkLCBjbHMsIGNhbGxGaW5hbGl6ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGpzT2JqO1xyXG4gICAgfVxyXG4gICAgZmluZE5hdGl2ZU9iamVjdChvYmpJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdFBvb2wuZ2V0KG9iaklkKTtcclxuICAgIH1cclxuICAgIGJpbmROYXRpdmVPYmplY3Qob2JqSWQsIGpzT2JqLCB0eXBlSWQsIGNscywgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgdGhpcy5vYmplY3RQb29sLmFkZChvYmpJZCwganNPYmosIHR5cGVJZCwgY2FsbEZpbmFsaXplKTtcclxuICAgICAgICBjb25zdCB7IG9uRW50ZXIsIGRhdGEgfSA9IGNscy4kSW5mb3M7XHJcbiAgICAgICAgaWYgKG9uRW50ZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgdWQgPSBvbkVudGVyKG9iaklkLCBkYXRhLCB0aGlzLnByaXZhdGVEYXRhKTtcclxuICAgICAgICAgICAgdGhpcy5vYmpJZDJ1ZC5zZXQob2JqSWQsIHVkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBzZXRFbnZQcml2YXRlKHByaXZhdGVEYXRhKSB7XHJcbiAgICAgICAgdGhpcy5wcml2YXRlRGF0YSA9IHByaXZhdGVEYXRhO1xyXG4gICAgfVxyXG4gICAgT25OYXRpdmVPYmplY3RGaW5hbGl6ZWQob2JqSWQsIHR5cGVJZCwgY2FsbEZpbmFsaXplKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmVycm9yKGBPbk5hdGl2ZU9iamVjdEZpbmFsaXplZCAke29iaklkfWApO1xyXG4gICAgICAgIGNvbnN0IGNscyA9IENsYXNzUmVnaXN0ZXIuZ2V0SW5zdGFuY2UoKS5maW5kQ2xhc3NCeUlkKHR5cGVJZCk7XHJcbiAgICAgICAgY29uc3QgeyBmaW5hbGl6ZSwgb25FeGl0LCBkYXRhIH0gPSBjbHMuJEluZm9zO1xyXG4gICAgICAgIGlmIChjYWxsRmluYWxpemUgJiYgZmluYWxpemUpIHtcclxuICAgICAgICAgICAgZmluYWxpemUod2ViZ2xGRkksIG9iaklkLCBkYXRhLCB0aGlzLnByaXZhdGVEYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9uRXhpdCAmJiB0aGlzLm9iaklkMnVkLmhhcyhvYmpJZCkpIHtcclxuICAgICAgICAgICAgY29uc3QgdWQgPSB0aGlzLm9iaklkMnVkLmdldChvYmpJZCk7XHJcbiAgICAgICAgICAgIHRoaXMub2JqSWQydWQuZGVsZXRlKG9iaklkKTtcclxuICAgICAgICAgICAgb25FeGl0KG9iaklkLCBkYXRhLCB0aGlzLnByaXZhdGVEYXRhLCB1ZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmxldCB3ZWJnbEZGSSA9IHVuZGVmaW5lZDtcclxubGV0IG9iak1hcHBlciA9IHVuZGVmaW5lZDtcclxuLy8gdHlwZWRlZiBzdHJ1Y3QgU3RyaW5nIHtcclxuLy8gICAgIGNvbnN0IGNoYXIgKnB0cjtcclxuLy8gICAgIHVpbnQzMl90IGxlbjtcclxuLy8gfSBTdHJpbmc7XHJcbi8vIFxyXG4vLyB0eXBlZGVmIHN0cnVjdCBCdWZmZXIge1xyXG4vLyAgICAgdm9pZCAqcHRyO1xyXG4vLyAgICAgdWludDMyX3QgbGVuO1xyXG4vLyB9IEJ1ZmZlcjtcclxuLy8gXHJcbi8vIHR5cGVkZWYgc3RydWN0IE5hdGl2ZU9iamVjdCB7XHJcbi8vICAgICB2b2lkICpvYmpJZDtcclxuLy8gICAgIGNvbnN0IHZvaWQgKnR5cGVJZDtcclxuLy8gfSBOYXRpdmVPYmplY3Q7XHJcbi8vIFxyXG4vLyB0eXBlZGVmIHVuaW9uIEpTVmFsdWVVbmlvbiB7XHJcbi8vICAgICBpbnQzMl90IGludDMyO1xyXG4vLyAgICAgZG91YmxlIGZsb2F0NjQ7XHJcbi8vICAgICBpbnQ2NF90IGludDY0O1xyXG4vLyAgICAgdWludDY0X3QgdWludDY0O1xyXG4vLyAgICAgdm9pZCAqcHRyO1xyXG4vLyAgICAgU3RyaW5nIHN0cjtcclxuLy8gICAgIEJ1ZmZlciBidWY7XHJcbi8vICAgICBOYXRpdmVPYmplY3QgbnRvO1xyXG4vLyB9IEpTVmFsdWVVbmlvbjtcclxuLy8gXHJcbi8vIHR5cGVkZWYgc3RydWN0IEpTVmFsdWUge1xyXG4vLyAgICAgSlNWYWx1ZVVuaW9uIHU7XHJcbi8vICAgICBpbnQzMl90IHRhZztcclxuLy8gICAgIGludCBuZWVkX2ZyZWU7XHJcbi8vIH0gSlNWYWx1ZTtcclxuLy9cclxuLy8gc3RydWN0IENhbGxiYWNrSW5mbyB7XHJcbi8vICAgICB2b2lkKiB0aGlzUHRyO1xyXG4vLyAgICAgaW50IGFyZ2M7XHJcbi8vICAgICB2b2lkKiBkYXRhO1xyXG4vLyAgICAgdm9pZCogdGhpc1R5cGVJZDtcclxuLy8gICAgIEpTVmFsdWUgcmVzO1xyXG4vLyAgICAgSlNWYWx1ZSBhcmd2WzBdO1xyXG4vLyB9O1xyXG4vLyBzaXplb2YoSlNWYWx1ZSkgPT0gMTZcclxuY29uc3QgY2FsbGJhY2tJbmZvc0NhY2hlID0gW107XHJcbmZ1bmN0aW9uIGdldE5hdGl2ZUNhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjKSB7XHJcbiAgICBsZXQgY2FsbGJhY2tJbmZvID0gY2FsbGJhY2tJbmZvc0NhY2hlW2FyZ2NdO1xyXG4gICAgaWYgKCFjYWxsYmFja0luZm8pIHtcclxuICAgICAgICAvLyA0ICsgNCArIDQgKyA0ICsgMTYgKyAoYXJnYyAqIDE2KVxyXG4gICAgICAgIGNvbnN0IHNpemUgPSAzMiArIChhcmdjICogMTYpO1xyXG4gICAgICAgIGNhbGxiYWNrSW5mbyA9IHdhc21BcGkuX21hbGxvYyhzaXplKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMih3YXNtQXBpLkhFQVBVOCwgYXJnYywgY2FsbGJhY2tJbmZvICsgNCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsYmFja0luZm9zQ2FjaGVbYXJnY10gPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBCdWZmZXIud3JpdGVJbnQzMih3YXNtQXBpLkhFQVBVOCwgSlNUYWcuSlNfVEFHX1VOREVGSU5FRCwgY2FsbGJhY2tJbmZvICsgMjQpOyAvLyBzZXQgcmVzIHRvIHVuZGVmaW5lZFxyXG4gICAgcmV0dXJuIGNhbGxiYWNrSW5mbztcclxufVxyXG5mdW5jdGlvbiByZXR1cm5OYXRpdmVDYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgY2FsbGJhY2tJbmZvKSB7XHJcbiAgICBpZiAoY2FsbGJhY2tJbmZvc0NhY2hlW2FyZ2NdKSB7XHJcbiAgICAgICAgd2FzbUFwaS5fZnJlZShjYWxsYmFja0luZm8pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgY2FsbGJhY2tJbmZvc0NhY2hlW2FyZ2NdID0gY2FsbGJhY2tJbmZvO1xyXG4gICAgfVxyXG59XHJcbi8vIFRPRE86IOWFiOeugOWNleWIhumFjeeUsXdhc23pgqPph4rmlL7vvIzlkI7nu63lho3kvJjljJZcclxuZnVuY3Rpb24gZ2V0QnVmZmVyKHdhc21BcGksIHNpemUpIHtcclxuICAgIHJldHVybiB3YXNtQXBpLl9tYWxsb2Moc2l6ZSk7XHJcbn1cclxuZnVuY3Rpb24ganNWYWx1ZVRvUGFwaVZhbHVlKHdhc21BcGksIGFyZywgdmFsdWUpIHtcclxuICAgIGxldCBoZWFwID0gd2FzbUFwaS5IRUFQVTg7XHJcbiAgICBjb25zdCBkYXRhUHRyID0gdmFsdWU7XHJcbiAgICBjb25zdCB0YWdQdHIgPSBkYXRhUHRyICsgODtcclxuICAgIGlmIChhcmcgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19VTkRFRklORUQsIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhcmcgPT09IG51bGwpIHtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfTlVMTCwgdGFnUHRyKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdiaWdpbnQnKSB7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50NjQoaGVhcCwgYXJnLCBkYXRhUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfSU5UNjQsIHRhZ1B0cik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGFyZykpIHtcclxuICAgICAgICAgICAgaWYgKGFyZyA+PSAtMjE0NzQ4MzY0OCAmJiBhcmcgPD0gMjE0NzQ4MzY0Nykge1xyXG4gICAgICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgYXJnLCBkYXRhUHRyKTtcclxuICAgICAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19JTlQsIHRhZ1B0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQ2NChoZWFwLCBhcmcsIGRhdGFQdHIpO1xyXG4gICAgICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0lOVDY0LCB0YWdQdHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVEb3VibGUoaGVhcCwgYXJnLCBkYXRhUHRyKTtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0ZMT0FUNjQsIHRhZ1B0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBjb25zdCBsZW4gPSB3YXNtQXBpLmxlbmd0aEJ5dGVzVVRGMTYoYXJnKTtcclxuICAgICAgICBjb25zdCBwdHIgPSBnZXRCdWZmZXIod2FzbUFwaSwgbGVuICsgMik7XHJcbiAgICAgICAgd2FzbUFwaS5zdHJpbmdUb1VURjE2KGFyZywgcHRyLCBsZW4gKyAyKTtcclxuICAgICAgICBoZWFwID0gd2FzbUFwaS5IRUFQVTg7IC8vIGdldEJ1ZmZlcuS8mueUs+ivt+WGheWtmO+8jOWPr+iDveWvvOiHtEhFQVBVOOaUueWPmFxyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIHB0ciwgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgYXJnLmxlbmd0aCwgZGF0YVB0ciArIDQpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19TVFJJTkcxNiwgdGFnUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCAxLCB0YWdQdHIgKyA0KTsgLy8gbmVlZF9mcmVlID0gdHJ1ZVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgYXJnID8gMSA6IDAsIGRhdGFQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19CT09MLCB0YWdQdHIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGFyZyksIGRhdGFQdHIpO1xyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIEpTVGFnLkpTX1RBR19GVU5DVElPTiwgdGFnUHRyKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoYXJnKSwgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0FSUkFZLCB0YWdQdHIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgYXJnIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xyXG4gICAgICAgIGNvbnN0IGxlbiA9IGFyZy5ieXRlTGVuZ3RoO1xyXG4gICAgICAgIGNvbnN0IHB0ciA9IGdldEJ1ZmZlcih3YXNtQXBpLCBsZW4pO1xyXG4gICAgICAgIHdhc21BcGkuSEVBUDguc2V0KG5ldyBJbnQ4QXJyYXkoYXJnKSwgcHRyKTtcclxuICAgICAgICBoZWFwID0gd2FzbUFwaS5IRUFQVTg7IC8vIGdldEJ1ZmZlcuS8mueUs+ivt+WGheWtmO+8jOWPr+iDveWvvOiHtEhFQVBVOOaUueWPmFxyXG4gICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIHB0ciwgZGF0YVB0cik7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgbGVuLCBkYXRhUHRyICsgNCk7XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoaGVhcCwgSlNUYWcuSlNfVEFHX0JVRkZFUiwgdGFnUHRyKTtcclxuICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCAxLCB0YWdQdHIgKyA0KTsgLy8gbmVlZF9mcmVlID0gdHJ1ZVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBjb25zdCBudG9JbmZvID0gT2JqZWN0UG9vbC5HZXROYXRpdmVJbmZvT2ZPYmplY3QoYXJnKTtcclxuICAgICAgICBpZiAobnRvSW5mbykge1xyXG4gICAgICAgICAgICBjb25zdCBbb2JqSWQsIHR5cGVJZF0gPSBudG9JbmZvO1xyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBvYmpJZCwgZGF0YVB0cik7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIHR5cGVJZCwgZGF0YVB0ciArIDQpO1xyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfTkFUSVZFX09CSkVDVCwgdGFnUHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGFyZyksIGRhdGFQdHIpO1xyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBKU1RhZy5KU19UQUdfT0JKRUNULCB0YWdQdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBhcmd1bWVudCB0eXBlOiAke3R5cGVvZiBhcmd9YCk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24ganNBcmdzVG9DYWxsYmFja0luZm8od2FzbUFwaSwgYXJnYywgYXJncykge1xyXG4gICAgY29uc3QgY2FsbGJhY2tJbmZvID0gZ2V0TmF0aXZlQ2FsbGJhY2tJbmZvKHdhc21BcGksIGFyZ2MpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdjOyArK2kpIHtcclxuICAgICAgICBjb25zdCBhcmcgPSBhcmdzW2ldO1xyXG4gICAgICAgIGpzVmFsdWVUb1BhcGlWYWx1ZSh3YXNtQXBpLCBhcmcsIGNhbGxiYWNrSW5mbyArIDMyICsgKGkgKiAxNikpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNhbGxiYWNrSW5mbztcclxufVxyXG5mdW5jdGlvbiBnZW5Kc0NhbGxiYWNrKHdhc21BcGksIGNhbGxiYWNrLCBkYXRhLCBwYXBpLCBpc1N0YXRpYykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XHJcbiAgICAgICAgaWYgKG5ldy50YXJnZXQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIm5vdCBhIGNvbnN0cnVjdG9yJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBjYWxsYmFja0luZm8gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgY29uc3QgYXJnYyA9IGFyZ3MubGVuZ3RoO1xyXG4gICAgICAgIGNvbnN0IHNjb3BlID0gU2NvcGUuZW50ZXIoKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8gPSBqc0FyZ3NUb0NhbGxiYWNrSW5mbyh3YXNtQXBpLCBhcmdjLCBhcmdzKTtcclxuICAgICAgICAgICAgY29uc3QgaGVhcCA9IHdhc21BcGkuSEVBUFU4OyAvL+WcqFBBcGlDYWxsYmFja1dpdGhTY29wZeWJjemDveS4jeS8muWPmOWMlu+8jOi/meagt+eUqOaYr+WuieWFqOeahFxyXG4gICAgICAgICAgICBCdWZmZXIud3JpdGVJbnQzMihoZWFwLCBkYXRhLCBjYWxsYmFja0luZm8gKyA4KTsgLy8gZGF0YVxyXG4gICAgICAgICAgICBsZXQgb2JqSWQgPSAwO1xyXG4gICAgICAgICAgICBsZXQgdHlwZUlkID0gMDtcclxuICAgICAgICAgICAgaWYgKCFpc1N0YXRpYyAmJiB0aGlzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBudG9JbmZvID0gT2JqZWN0UG9vbC5HZXROYXRpdmVJbmZvT2ZPYmplY3QodGhpcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAobnRvSW5mbylcclxuICAgICAgICAgICAgICAgICAgICBbb2JqSWQsIHR5cGVJZF0gPSBudG9JbmZvO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIG9iaklkLCBjYWxsYmFja0luZm8pOyAvLyB0aGlzUHRyXHJcbiAgICAgICAgICAgIEJ1ZmZlci53cml0ZUludDMyKGhlYXAsIHR5cGVJZCwgY2FsbGJhY2tJbmZvICsgMTIpOyAvLyB0aGlzVHlwZUlkXHJcbiAgICAgICAgICAgIHdhc21BcGkuUEFwaUNhbGxiYWNrV2l0aFNjb3BlKGNhbGxiYWNrLCBwYXBpLCBjYWxsYmFja0luZm8pOyAvLyDpooTmnJ93YXNt5Y+q5Lya6YCa6L+HdGhyb3dfYnlfc3RyaW5n5oqb5byC5bi477yM5LiN5Lqn55Sf55u05o6lanPlvILluLhcclxuICAgICAgICAgICAgaWYgKGhhc0V4Y2VwdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgZ2V0QW5kQ2xlYXJMYXN0RXhjZXB0aW9uKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKHdhc21BcGksIG9iak1hcHBlciwgY2FsbGJhY2tJbmZvICsgMTYsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHtcclxuICAgICAgICAgICAgcmV0dXJuTmF0aXZlQ2FsbGJhY2tJbmZvKHdhc21BcGksIGFyZ2MsIGNhbGxiYWNrSW5mbyk7XHJcbiAgICAgICAgICAgIHNjb3BlLmNsb3NlKHdhc21BcGkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuLy8g6ZyA6KaB5ZyoVW5pdHnph4zosIPnlKhQbGF5ZXJTZXR0aW5ncy5XZWJHTC5lbXNjcmlwdGVuQXJncyA9IFwiIC1zIEFMTE9XX1RBQkxFX0dST1dUSD0xXCI7XHJcbmZ1bmN0aW9uIFdlYkdMRkZJQXBpKGVuZ2luZSkge1xyXG4gICAgb2JqTWFwcGVyID0gbmV3IE9iamVjdE1hcHBlcigpO1xyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9hcnJheShlbnYpIHtcclxuICAgICAgICByZXR1cm4gU2NvcGUuZ2V0Q3VycmVudCgpLmFkZFRvU2NvcGUoW10pO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9vYmplY3QoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKE9iamVjdC5jcmVhdGUobnVsbCkpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9mdW5jdGlvbihlbnYsIG5hdGl2ZV9pbXBsLCBkYXRhLCBmaW5hbGl6ZSAvLyBUT0RPOiBnY+aXtuiwg+eUqGZpbmFsaXplXHJcbiAgICApIHtcclxuICAgICAgICBjb25zdCBqc0NhbGxiYWNrID0gZ2VuSnNDYWxsYmFjayhlbmdpbmUudW5pdHlBcGksIG5hdGl2ZV9pbXBsLCBkYXRhLCB3ZWJnbEZGSSwgZmFsc2UpO1xyXG4gICAgICAgIHJldHVybiBTY29wZS5nZXRDdXJyZW50KCkuYWRkVG9TY29wZShqc0NhbGxiYWNrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfY2xhc3MoZW52LCB0eXBlSWQpIHtcclxuICAgICAgICBjb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkubG9hZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgY2xzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYGNyZWF0ZSBjbGFzczogJHtjbHMubmFtZX1gKTtcclxuICAgICAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGNscyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbid0IGxvYWQgY2xhc3MgYnkgdHlwZSBpZDogXCIgKyB0eXBlSWQpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9hcnJheV9sZW5ndGgoZW52LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBhcnJheSA9IFNjb3BlLmdldEN1cnJlbnQoKS5nZXRGcm9tU2NvcGUocHZhbHVlKTtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoOiB2YWx1ZSBpcyBub3QgYW4gYXJyYXlcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnJheS5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfbmF0aXZlX29iamVjdF90b192YWx1ZShlbnYsIHR5cGVJZCwgb2JqZWN0X3B0ciwgY2FsbF9maW5hbGl6ZSkge1xyXG4gICAgICAgIGNvbnN0IGpzT2JqID0gb2JqTWFwcGVyLnB1c2hOYXRpdmVPYmplY3Qob2JqZWN0X3B0ciwgdHlwZUlkLCBjYWxsX2ZpbmFsaXplKTtcclxuICAgICAgICAvLyBUT0RPOiBqdXN0IGZvciB0ZXN0XHJcbiAgICAgICAgLy9jb25zdCBjbHMgPSBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkuZmluZENsYXNzQnlJZCh0eXBlSWQpO1xyXG4gICAgICAgIC8vaWYgKGNscy5uYW1lID09IFwiSnNFbnZcIikge1xyXG4gICAgICAgIC8vICAgIGNvbnNvbGUubG9nKGBjYWxsIEZpbGVFeGlzdHMoYWFiYi50eHQpOiAkeyhqc09iaiBhcyBhbnkpLmxvYWRlci5GaWxlRXhpc3RzKFwiYWFiYi50eHRcIil9YCk7XHJcbiAgICAgICAgLy8gICAgY29uc29sZS5sb2coYGNhbGwgRmlsZUV4aXN0cyhwdWVydHMvZXNtX2Jvb3RzdHJhcC5janMpOiAkeyhqc09iaiBhcyBhbnkpLmxvYWRlci5GaWxlRXhpc3RzKFwicHVlcnRzL2VzbV9ib290c3RyYXAuY2pzXCIpfWApO1xyXG4gICAgICAgIC8vfVxyXG4gICAgICAgIHJldHVybiBvYmplY3RfcHRyO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3Rocm93X2J5X3N0cmluZyhwaW5mbywgcG1zZykge1xyXG4gICAgICAgIGNvbnN0IG1zZyA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocG1zZyk7XHJcbiAgICAgICAgc2V0TGFzdEV4Y2VwdGlvbihuZXcgRXJyb3IobXNnKSk7XHJcbiAgICB9XHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0g5L2c55So5Z+f566h55CGIC0tLS0tLS0tLS0tLS0tLVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGUocGVudl9yZWYpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50KHBlbnZfcmVmLCBtZW1vcnkpIHtcclxuICAgICAgICBTY29wZS5lbnRlcigpO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2hhc19jYXVnaHQocHNjb3BlKSB7XHJcbiAgICAgICAgcmV0dXJuIGhhc0V4Y2VwdGlvbjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfZXhjZXB0aW9uX2FzX3N0cmluZyhwc2NvcGUsIHdpdGhfc3RhY2spIHtcclxuICAgICAgICByZXR1cm4gZ2V0RXhjZXB0aW9uQXNOYXRpdmVTdHJpbmcoZW5naW5lLnVuaXR5QXBpLCB3aXRoX3N0YWNrKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jbG9zZV9zY29wZShwc2NvcGUpIHtcclxuICAgICAgICBTY29wZS5leGl0KGVuZ2luZS51bml0eUFwaSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50KHBzY29wZSkge1xyXG4gICAgICAgIFNjb3BlLmV4aXQoZW5naW5lLnVuaXR5QXBpKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlZmVyZW5jZWRWYWx1ZXMgPSBuZXcgU3BhcnNlQXJyYXkoKTtcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmKGVudiwgcHZhbHVlLCBpbnRlcm5hbF9maWVsZF9jb3VudCkge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHB2YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHJlZmVyZW5jZWRWYWx1ZXMuYWRkKHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZihwdmFsdWVfcmVmKSB7XHJcbiAgICAgICAgcmVmZXJlbmNlZFZhbHVlcy5yZW1vdmUocHZhbHVlX3JlZik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmKGVudiwgcHZhbHVlX3JlZiwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSByZWZlcmVuY2VkVmFsdWVzLmdldChwdmFsdWVfcmVmKTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCB2YWx1ZSwgcHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcclxuICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCB2YWx1ZSwgcHZhbHVlKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9zZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBwa2V5LCBwdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcG9iamVjdCk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9wcm9wZXJ0eTogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGtleSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocGtleSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcml2YXRlKGVudiwgcG9iamVjdCwgb3V0X3B0cikge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwb2JqZWN0KTtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgMCwgb3V0X3B0cik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgb2JqWydfX3BfcHJpdmF0ZV9kYXRhJ10sIG91dF9wdHIpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9wcml2YXRlKGVudiwgcG9iamVjdCwgcHRyKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnICYmIHR5cGVvZiBvYmogIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9ialsnX19wX3ByaXZhdGVfZGF0YSddID0gcHRyO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX2dldF9wcm9wZXJ0eV91aW50MzIoZW52LCBwb2JqZWN0LCBrZXksIHB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IFNjb3BlLmdldEN1cnJlbnQoKS50b0pzKGVuZ2luZS51bml0eUFwaSwgb2JqTWFwcGVyLCBwb2JqZWN0KTtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMjogdGFyZ2V0IGlzIG5vdCBhbiBvYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAganNWYWx1ZVRvUGFwaVZhbHVlKGVuZ2luZS51bml0eUFwaSwgdmFsdWUsIHB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfc2V0X3Byb3BlcnR5X3VpbnQzMihlbnYsIHBvYmplY3QsIGtleSwgcHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gU2NvcGUuZ2V0Q3VycmVudCgpLnRvSnMoZW5naW5lLnVuaXR5QXBpLCBvYmpNYXBwZXIsIHBvYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcHJvcGVydHlfdWludDMyOiB0YXJnZXQgaXMgbm90IGFuIG9iamVjdFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcHZhbHVlKTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tIOWHveaVsOiwg+eUqC/miafooYwgLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBmdW5jdGlvbiBwZXNhcGlfY2FsbF9mdW5jdGlvbihlbnYsIHBmdW5jLCB0aGlzX29iamVjdCwgYXJnYywgYXJndiwgcHJlc3VsdCkge1xyXG4gICAgICAgIGNvbnN0IGZ1bmMgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgcGZ1bmMpO1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSBTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgdGhpc19vYmplY3QpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jYWxsX2Z1bmN0aW9uOiB0YXJnZXQgaXMgbm90IGEgZnVuY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGhlYXAgPSBlbmdpbmUudW5pdHlBcGkuSEVBUFU4O1xyXG4gICAgICAgIGNvbnN0IGFyZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ2M7ICsraSkge1xyXG4gICAgICAgICAgICBjb25zdCBhcmdQdHIgPSBCdWZmZXIucmVhZEludDMyKGhlYXAsIGFyZ3YgKyBpICogNCk7XHJcbiAgICAgICAgICAgIGFyZ3MucHVzaChTY29wZS5nZXRDdXJyZW50KCkudG9KcyhlbmdpbmUudW5pdHlBcGksIG9iak1hcHBlciwgYXJnUHRyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncyk7XHJcbiAgICAgICAgICAgIGpzVmFsdWVUb1BhcGlWYWx1ZShlbmdpbmUudW5pdHlBcGksIHJlc3VsdCwgcHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHNldExhc3RFeGNlcHRpb24oZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8g5ZKMcGVzYXBpLmjlo7DmmI7kuI3kuIDmoLfvvIzov5nmlLnkuLrov5Tlm57lgLzmjIfpkojnlLHosIPnlKjogIXvvIjljp/nlJ/vvInkvKDlhaVcclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9ldmFsKGVudiwgcGNvZGUsIGNvZGVfc2l6ZSwgcGF0aCwgcHJlc3VsdCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghZ2xvYmFsVGhpcy5ldmFsKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJldmFsIGlzIG5vdCBzdXBwb3J0ZWRcIik7IC8vIFRPRE86IOaKm+e7mXdhc23mm7TlkIjpgILkuptcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjb2RlID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhwY29kZSwgY29kZV9zaXplKTtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZ2xvYmFsVGhpcy5ldmFsKGNvZGUpO1xyXG4gICAgICAgICAgICBqc1ZhbHVlVG9QYXBpVmFsdWUoZW5naW5lLnVuaXR5QXBpLCByZXN1bHQsIHByZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBzZXRMYXN0RXhjZXB0aW9uKGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBlc2FwaV9nbG9iYWwoZW52KSB7XHJcbiAgICAgICAgcmV0dXJuIFNjb3BlLmdldEN1cnJlbnQoKS5hZGRUb1Njb3BlKGdsb2JhbFRoaXMpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcGVzYXBpX3NldF9lbnZfcHJpdmF0ZShlbnYsIHB0cikge1xyXG4gICAgICAgIG9iak1hcHBlci5zZXRFbnZQcml2YXRlKHB0cik7XHJcbiAgICB9XHJcbiAgICAvKlxyXG4gICAgaW50ZXJmYWNlIEFQSUluZm8ge1xyXG4gICAgICAgIGZ1bmM6IEZ1bmN0aW9uXHJcbiAgICAgICAgc2lnOiBzdHJpbmdcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhcGlJbmZvOiBBUElJbmZvW10gPSBbXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9jcmVhdGVfYXJyYXksIHNpZzogXCJpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX2NyZWF0ZV9vYmplY3QsIHNpZzogXCJpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX2NyZWF0ZV9mdW5jdGlvbiwgc2lnOiBcImlpaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfY3JlYXRlX2NsYXNzLCBzaWc6IFwiaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfZ2V0X2FycmF5X2xlbmd0aCwgc2lnOiBcImlpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX25hdGl2ZV9vYmplY3RfdG9fdmFsdWUsIHNpZzogXCJpaWlpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX3Rocm93X2J5X3N0cmluZywgc2lnOiBcInZpaVwifSxcclxuICAgICAgICAvL3tmdW5jOiBwZXNhcGlfb3Blbl9zY29wZSwgc2lnOiBcImlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfb3Blbl9zY29wZV9wbGFjZW1lbnQsIHNpZzogXCJpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9oYXNfY2F1Z2h0LCBzaWc6IFwiaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9nZXRfZXhjZXB0aW9uX2FzX3N0cmluZywgc2lnOiBcImlpaVwifSxcclxuICAgICAgICAvL3tmdW5jOiBwZXNhcGlfY2xvc2Vfc2NvcGUsIHNpZzogXCJ2aVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX2Nsb3NlX3Njb3BlX3BsYWNlbWVudCwgc2lnOiBcInZpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfY3JlYXRlX3ZhbHVlX3JlZiwgc2lnOiBcImlpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZiwgc2lnOiBcInZpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmLCBzaWc6IFwidmlpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX2dldF9wcm9wZXJ0eSwgc2lnOiBcInZpaWlpXCJ9LFxyXG4gICAgICAgIHtmdW5jOiBwZXNhcGlfc2V0X3Byb3BlcnR5LCBzaWc6IFwidmlpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9nZXRfcHJpdmF0ZSwgc2lnOiBcImlpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9zZXRfcHJpdmF0ZSwgc2lnOiBcImlpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9nZXRfcHJvcGVydHlfdWludDMyLCBzaWc6IFwidmlpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9zZXRfcHJvcGVydHlfdWludDMyLCBzaWc6IFwidmlpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9jYWxsX2Z1bmN0aW9uLCBzaWc6IFwidmlpaWlpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX2V2YWwsIHNpZzogXCJ2aWlpaWlcIn0sXHJcbiAgICAgICAge2Z1bmM6IHBlc2FwaV9nbG9iYWwsIHNpZzogXCJpaVwifSxcclxuICAgICAgICB7ZnVuYzogcGVzYXBpX3NldF9lbnZfcHJpdmF0ZSwgc2lnOiBcInZpaVwifVxyXG4gICAgXTtcclxuICAgICovXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIEdldFdlYkdMRkZJQXBpOiBHZXRXZWJHTEZGSUFwaSxcclxuICAgICAgICBwZXNhcGlfY3JlYXRlX2FycmF5X2pzOiBwZXNhcGlfY3JlYXRlX2FycmF5LFxyXG4gICAgICAgIHBlc2FwaV9jcmVhdGVfb2JqZWN0X2pzOiBwZXNhcGlfY3JlYXRlX29iamVjdCxcclxuICAgICAgICBwZXNhcGlfY3JlYXRlX2Z1bmN0aW9uX2pzOiBwZXNhcGlfY3JlYXRlX2Z1bmN0aW9uLFxyXG4gICAgICAgIHBlc2FwaV9jcmVhdGVfY2xhc3NfanM6IHBlc2FwaV9jcmVhdGVfY2xhc3MsXHJcbiAgICAgICAgcGVzYXBpX2dldF9hcnJheV9sZW5ndGhfanM6IHBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoLFxyXG4gICAgICAgIHBlc2FwaV9uYXRpdmVfb2JqZWN0X3RvX3ZhbHVlX2pzOiBwZXNhcGlfbmF0aXZlX29iamVjdF90b192YWx1ZSxcclxuICAgICAgICBwZXNhcGlfdGhyb3dfYnlfc3RyaW5nX2pzOiBwZXNhcGlfdGhyb3dfYnlfc3RyaW5nLFxyXG4gICAgICAgIHBlc2FwaV9vcGVuX3Njb3BlX3BsYWNlbWVudF9qczogcGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50LFxyXG4gICAgICAgIHBlc2FwaV9oYXNfY2F1Z2h0X2pzOiBwZXNhcGlfaGFzX2NhdWdodCxcclxuICAgICAgICBwZXNhcGlfZ2V0X2V4Y2VwdGlvbl9hc19zdHJpbmdfanM6IHBlc2FwaV9nZXRfZXhjZXB0aW9uX2FzX3N0cmluZyxcclxuICAgICAgICBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50X2pzOiBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50LFxyXG4gICAgICAgIHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmX2pzOiBwZXNhcGlfY3JlYXRlX3ZhbHVlX3JlZixcclxuICAgICAgICBwZXNhcGlfcmVsZWFzZV92YWx1ZV9yZWZfanM6IHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZixcclxuICAgICAgICBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmX2pzOiBwZXNhcGlfZ2V0X3ZhbHVlX2Zyb21fcmVmLFxyXG4gICAgICAgIHBlc2FwaV9nZXRfcHJvcGVydHlfanM6IHBlc2FwaV9nZXRfcHJvcGVydHksXHJcbiAgICAgICAgcGVzYXBpX3NldF9wcm9wZXJ0eV9qczogcGVzYXBpX3NldF9wcm9wZXJ0eSxcclxuICAgICAgICBwZXNhcGlfZ2V0X3ByaXZhdGVfanM6IHBlc2FwaV9nZXRfcHJpdmF0ZSxcclxuICAgICAgICBwZXNhcGlfc2V0X3ByaXZhdGVfanM6IHBlc2FwaV9zZXRfcHJpdmF0ZSxcclxuICAgICAgICBwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMl9qczogcGVzYXBpX2dldF9wcm9wZXJ0eV91aW50MzIsXHJcbiAgICAgICAgcGVzYXBpX3NldF9wcm9wZXJ0eV91aW50MzJfanM6IHBlc2FwaV9zZXRfcHJvcGVydHlfdWludDMyLFxyXG4gICAgICAgIHBlc2FwaV9jYWxsX2Z1bmN0aW9uX2pzOiBwZXNhcGlfY2FsbF9mdW5jdGlvbixcclxuICAgICAgICBwZXNhcGlfZXZhbF9qczogcGVzYXBpX2V2YWwsXHJcbiAgICAgICAgcGVzYXBpX2dsb2JhbF9qczogcGVzYXBpX2dsb2JhbCxcclxuICAgICAgICBwZXNhcGlfc2V0X2Vudl9wcml2YXRlX2pzOiBwZXNhcGlfc2V0X2Vudl9wcml2YXRlXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuV2ViR0xGRklBcGkgPSBXZWJHTEZGSUFwaTtcclxuZnVuY3Rpb24gR2V0V2ViR0xGRklBcGkoZW5naW5lKSB7XHJcbiAgICBpZiAod2ViZ2xGRkkpXHJcbiAgICAgICAgcmV0dXJuIHdlYmdsRkZJO1xyXG4gICAgd2ViZ2xGRkkgPSBlbmdpbmUudW5pdHlBcGkuSW5qZWN0UGFwaUdMTmF0aXZlSW1wbCgpO1xyXG4gICAgcmV0dXJuIHdlYmdsRkZJO1xyXG59XHJcbmZ1bmN0aW9uIFdlYkdMUmVnc3RlckFwaShlbmdpbmUpIHtcclxuICAgIEdldFdlYkdMRkZJQXBpKGVuZ2luZSk7IC8vIOiuqXdlYmdsRkZJ5Y+v55So77yM5ZCm5YiZ5rOo5YaMZ2VuSnNDYWxsYmFja+S8oOWFpeeahHdlYmdsRkZJ5pivdW5kZWZpbmVkXHJcbiAgICAvLyBJbml0aWFsaXplIHdpdGggcHJvcGVyIHR5cGUgYXNzZXJ0aW9uXHJcbiAgICBjb25zdCBkZXNjcmlwdG9yc0FycmF5ID0gW1tdXTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgR2V0UmVnc3RlckFwaTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlc2FwaV9hbGxvY19wcm9wZXJ0eV9kZXNjcmlwdG9yczogZnVuY3Rpb24gKGNvdW50KSB7XHJcbiAgICAgICAgICAgIGRlc2NyaXB0b3JzQXJyYXkucHVzaChbXSk7XHJcbiAgICAgICAgICAgIHJldHVybiBkZXNjcmlwdG9yc0FycmF5Lmxlbmd0aCAtIDE7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXNhcGlfZGVmaW5lX2NsYXNzOiBmdW5jdGlvbiAodHlwZUlkLCBzdXBlclR5cGVJZCwgcG5hbWUsIGNvbnN0cnVjdG9yLCBmaW5hbGl6ZSwgcHJvcGVydHlDb3VudCwgcHJvcGVydGllcywgZGF0YSkge1xyXG4gICAgICAgICAgICBjb25zdCBkZXNjcmlwdG9ycyA9IGRlc2NyaXB0b3JzQXJyYXlbcHJvcGVydGllc107XHJcbiAgICAgICAgICAgIGRlc2NyaXB0b3JzQXJyYXlbcHJvcGVydGllc10gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHBuYW1lKTtcclxuICAgICAgICAgICAgY29uc3QgUEFwaU5hdGl2ZU9iamVjdCA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2FsbGJhY2tJbmZvID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXJnYyA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY29wZSA9IFNjb3BlLmVudGVyKCk7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrSW5mbyA9IGpzQXJnc1RvQ2FsbGJhY2tJbmZvKGVuZ2luZS51bml0eUFwaSwgYXJnYywgYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgQnVmZmVyLndyaXRlSW50MzIoZW5naW5lLnVuaXR5QXBpLkhFQVBVOCwgZGF0YSwgY2FsbGJhY2tJbmZvICsgOCk7IC8vIGRhdGFcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmpJZCA9IGVuZ2luZS51bml0eUFwaS5QQXBpQ29uc3RydWN0b3JXaXRoU2NvcGUoY29uc3RydWN0b3IsIHdlYmdsRkZJLCBjYWxsYmFja0luZm8pOyAvLyDpooTmnJ93YXNt5Y+q5Lya6YCa6L+HdGhyb3dfYnlfc3RyaW5n5oqb5byC5bi477yM5LiN5Lqn55Sf55u05o6lanPlvILluLhcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRXhjZXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGdldEFuZENsZWFyTGFzdEV4Y2VwdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBvYmpNYXBwZXIuYmluZE5hdGl2ZU9iamVjdChvYmpJZCwgdGhpcywgdHlwZUlkLCBQQXBpTmF0aXZlT2JqZWN0LCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybk5hdGl2ZUNhbGxiYWNrSW5mbyhlbmdpbmUudW5pdHlBcGksIGFyZ2MsIGNhbGxiYWNrSW5mbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuY2xvc2UoZW5naW5lLnVuaXR5QXBpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFBBcGlOYXRpdmVPYmplY3QsIFwibmFtZVwiLCB7IHZhbHVlOiBuYW1lIH0pO1xyXG4gICAgICAgICAgICBpZiAoc3VwZXJUeXBlSWQgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3VwZXJUeXBlID0gQ2xhc3NSZWdpc3Rlci5nZXRJbnN0YW5jZSgpLmxvYWRDbGFzc0J5SWQoc3VwZXJUeXBlSWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN1cGVyVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihQQXBpTmF0aXZlT2JqZWN0LnByb3RvdHlwZSwgc3VwZXJUeXBlLnByb3RvdHlwZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVzY3JpcHRvcnMuZm9yRWFjaChkZXNjcmlwdG9yID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICgnY2FsbGJhY2snIGluIGRlc2NyaXB0b3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBqc0NhbGxiYWNrID0gZ2VuSnNDYWxsYmFjayhlbmdpbmUudW5pdHlBcGksIGRlc2NyaXB0b3IuY2FsbGJhY2ssIGRlc2NyaXB0b3IuZGF0YSwgd2ViZ2xGRkksIGRlc2NyaXB0b3IuaXNTdGF0aWMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yLmlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFBBcGlOYXRpdmVPYmplY3RbZGVzY3JpcHRvci5uYW1lXSA9IGpzQ2FsbGJhY2s7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBQQXBpTmF0aXZlT2JqZWN0LnByb3RvdHlwZVtkZXNjcmlwdG9yLm5hbWVdID0ganNDYWxsYmFjaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGBnZW5Kc0NhbGxiYWNrICR7ZGVzY3JpcHRvci5uYW1lfSAke2Rlc2NyaXB0b3IuZ2V0dGVyX2RhdGF9ICR7d2ViZ2xGRkl9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5RGVzY3JpcHRvciA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiBkZXNjcmlwdG9yLmdldHRlciA9PT0gMCA/IHVuZGVmaW5lZCA6IGdlbkpzQ2FsbGJhY2soZW5naW5lLnVuaXR5QXBpLCBkZXNjcmlwdG9yLmdldHRlciwgZGVzY3JpcHRvci5nZXR0ZXJfZGF0YSwgd2ViZ2xGRkksIGRlc2NyaXB0b3IuaXNTdGF0aWMpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXQ6IGRlc2NyaXB0b3Iuc2V0dGVyID09PSAwID8gdW5kZWZpbmVkIDogZ2VuSnNDYWxsYmFjayhlbmdpbmUudW5pdHlBcGksIGRlc2NyaXB0b3Iuc2V0dGVyLCBkZXNjcmlwdG9yLnNldHRlcl9kYXRhLCB3ZWJnbEZGSSwgZGVzY3JpcHRvci5pc1N0YXRpYyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlc2NyaXB0b3IuaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFBBcGlOYXRpdmVPYmplY3QsIGRlc2NyaXB0b3IubmFtZSwgcHJvcGVydHlEZXNjcmlwdG9yKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQQXBpTmF0aXZlT2JqZWN0LnByb3RvdHlwZSwgZGVzY3JpcHRvci5uYW1lLCBwcm9wZXJ0eURlc2NyaXB0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coYHBlc2FwaV9kZWZpbmVfY2xhc3M6ICR7bmFtZX0gJHt0eXBlSWR9ICR7c3VwZXJUeXBlSWR9YCk7XHJcbiAgICAgICAgICAgIENsYXNzUmVnaXN0ZXIuZ2V0SW5zdGFuY2UoKS5yZWdpc3RlckNsYXNzKHR5cGVJZCwgUEFwaU5hdGl2ZU9iamVjdCwgZW5naW5lLnVuaXR5QXBpLmdldFdhc21UYWJsZUVudHJ5KGZpbmFsaXplKSwgZGF0YSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXNhcGlfZ2V0X2NsYXNzX2RhdGE6IGZ1bmN0aW9uICh0eXBlSWQsIGZvcmNlTG9hZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gQ2xhc3NSZWdpc3Rlci5nZXRJbnN0YW5jZSgpLmdldENsYXNzRGF0YUJ5SWQodHlwZUlkLCBmb3JjZUxvYWQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVzYXBpX29uX2NsYXNzX25vdF9mb3VuZDogZnVuY3Rpb24gKGNhbGxiYWNrUHRyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzQ2FsbGJhY2sgPSBlbmdpbmUudW5pdHlBcGkuZ2V0V2FzbVRhYmxlRW50cnkoY2FsbGJhY2tQdHIpO1xyXG4gICAgICAgICAgICBDbGFzc1JlZ2lzdGVyLmdldEluc3RhbmNlKCkuc2V0Q2xhc3NOb3RGb3VuZENhbGxiYWNrKCh0eXBlSWQpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJldCA9IGpzQ2FsbGJhY2sodHlwZUlkKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAhIXJldDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXNhcGlfc2V0X21ldGhvZF9pbmZvOiBmdW5jdGlvbiAocHJvcGVydGllcywgaW5kZXgsIHBuYW1lLCBpc19zdGF0aWMsIG1ldGhvZCwgZGF0YSwgc2lnbmF0dXJlX2luZm8pIHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocG5hbWUpO1xyXG4gICAgICAgICAgICBkZXNjcmlwdG9yc0FycmF5W3Byb3BlcnRpZXNdW2luZGV4XSA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgICAgICBpc1N0YXRpYzogaXNfc3RhdGljLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6IG1ldGhvZCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlc2FwaV9zZXRfcHJvcGVydHlfaW5mbzogZnVuY3Rpb24gKHByb3BlcnRpZXMsIGluZGV4LCBwbmFtZSwgaXNfc3RhdGljLCBnZXR0ZXIsIHNldHRlciwgZ2V0dGVyX2RhdGEsIHNldHRlcl9kYXRhLCB0eXBlX2luZm8pIHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcocG5hbWUpO1xyXG4gICAgICAgICAgICBkZXNjcmlwdG9yc0FycmF5W3Byb3BlcnRpZXNdW2luZGV4XSA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgICAgICBpc1N0YXRpYzogaXNfc3RhdGljLFxyXG4gICAgICAgICAgICAgICAgZ2V0dGVyOiBnZXR0ZXIsXHJcbiAgICAgICAgICAgICAgICBzZXR0ZXI6IHNldHRlcixcclxuICAgICAgICAgICAgICAgIGdldHRlcl9kYXRhOiBnZXR0ZXJfZGF0YSxcclxuICAgICAgICAgICAgICAgIHNldHRlcl9kYXRhOiBzZXR0ZXJfZGF0YVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGVzYXBpX3RyYWNlX25hdGl2ZV9vYmplY3RfbGlmZWN5Y2xlOiBmdW5jdGlvbiAodHlwZUlkLCBvbkVudGVyLCBvbkV4aXQpIHtcclxuICAgICAgICAgICAgY29uc3QgZW50ZXJDYWxsYmFjayA9IGVuZ2luZS51bml0eUFwaS5nZXRXYXNtVGFibGVFbnRyeShvbkVudGVyKTtcclxuICAgICAgICAgICAgY29uc3QgZXhpdENhbGxiYWNrID0gZW5naW5lLnVuaXR5QXBpLmdldFdhc21UYWJsZUVudHJ5KG9uRXhpdCk7XHJcbiAgICAgICAgICAgIENsYXNzUmVnaXN0ZXIuZ2V0SW5zdGFuY2UoKS50cmFjZU5hdGl2ZU9iamVjdExpZmVjeWNsZSh0eXBlSWQsIGVudGVyQ2FsbGJhY2ssIGV4aXRDYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLldlYkdMUmVnc3RlckFwaSA9IFdlYkdMUmVnc3RlckFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGVzYXBpSW1wbC5qcy5tYXAiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4vKipcclxuICog5qC55o2uIGh0dHBzOi8vZG9jcy51bml0eTNkLmNvbS8yMDE4LjQvRG9jdW1lbnRhdGlvbi9NYW51YWwvd2ViZ2wtaW50ZXJhY3Rpbmd3aXRoYnJvd3NlcnNjcmlwdGluZy5odG1sXHJcbiAqIOaIkeS7rOeahOebrueahOWwseaYr+WcqFdlYkdM5qih5byP5LiL77yM5a6e546w5ZKMcHVlcnRzLmRsbOeahOaViOaenOOAguWFt+S9k+WcqOS6juWunueOsOS4gOS4qmpzbGli77yM6YeM6Z2i5bqU5YyF5ZCrUHVlcnRzRExMLmNz55qE5omA5pyJ5o6l5Y+jXHJcbiAqIOWunumqjOWPkeeOsOi/meS4qmpzbGli6Jm954S25Lmf5piv6L+Q6KGM5ZyodjjnmoRqc++8jOS9huWvuWRldnRvb2zosIPor5XlubbkuI3lj4vlpb3vvIzkuJTlj6rmlK/mjIHliLBlczXjgIJcclxuICog5Zug5q2k5bqU6K+l6YCa6L+H5LiA5Liq54us56uL55qEanPlrp7njrDmjqXlj6PvvIxwdWVydHMuanNsaWLpgJrov4flhajlsYDnmoTmlrnlvI/osIPnlKjlroPjgIJcclxuICpcclxuICog5pyA57uI5b2i5oiQ5aaC5LiL5p625p6EXHJcbiAqIOS4muWKoUpTIDwtPiBXQVNNIDwtPiB1bml0eSBqc2xpYiA8LT4g5pysanNcclxuICog5L2G5pW05p2h6ZO+6Lev5YW25a6e6YO95Zyo5LiA5LiqdjgoanNjb3JlKeiZmuaLn+acuumHjFxyXG4gKi9cclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4vbGlicmFyeVwiKTtcclxuY29uc3QgZ2V0RnJvbUpTQXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9nZXRGcm9tSlNBcmd1bWVudFwiKTtcclxuY29uc3QgZ2V0RnJvbUpTUmV0dXJuXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvZ2V0RnJvbUpTUmV0dXJuXCIpO1xyXG5jb25zdCByZWdpc3Rlcl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3JlZ2lzdGVyXCIpO1xyXG5jb25zdCBzZXRUb0ludm9rZUpTQXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0ludm9rZUpTQXJndW1lbnRcIik7XHJcbmNvbnN0IHNldFRvSlNJbnZva2VSZXR1cm5fMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0pTSW52b2tlUmV0dXJuXCIpO1xyXG5jb25zdCBzZXRUb0pTT3V0QXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0pTT3V0QXJndW1lbnRcIik7XHJcbmNvbnN0IHBlc2FwaUltcGxfMSA9IHJlcXVpcmUoXCIuL3Blc2FwaUltcGxcIik7XHJcbmxpYnJhcnlfMS5nbG9iYWwud3hSZXF1aXJlID0gbGlicmFyeV8xLmdsb2JhbC5yZXF1aXJlO1xyXG5saWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMID0ge1xyXG4gICAgaW5pdGVkOiBmYWxzZSxcclxuICAgIGRlYnVnOiBmYWxzZSxcclxuICAgIC8vIHB1ZXJ0c+mmluasoeWIneWni+WMluaXtuS8muiwg+eUqOi/memHjO+8jOW5tuaKilVuaXR555qE6YCa5L+h5o6l5Y+j5Lyg5YWlXHJcbiAgICBJbml0KGN0b3JQYXJhbSkge1xyXG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IG5ldyBsaWJyYXJ5XzEuUHVlcnRzSlNFbmdpbmUoY3RvclBhcmFtKTtcclxuICAgICAgICBjb25zdCBleGVjdXRlTW9kdWxlQ2FjaGUgPSB7fTtcclxuICAgICAgICBsZXQganNFbmdpbmVSZXR1cm5lZCA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBsb2FkZXI7XHJcbiAgICAgICAgLy8gUHVlcnRzRExM55qE5omA5pyJ5o6l5Y+j5a6e546wXHJcbiAgICAgICAgbGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IE9iamVjdC5hc3NpZ24obGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCwge1xyXG4gICAgICAgICAgICB1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3czogZW5naW5lLnVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzLmJpbmQoZW5naW5lKVxyXG4gICAgICAgIH0sICgwLCBnZXRGcm9tSlNBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBnZXRGcm9tSlNSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSlNJbnZva2VSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU091dEFyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHJlZ2lzdGVyXzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHBlc2FwaUltcGxfMS5XZWJHTFJlZ3N0ZXJBcGkpKGVuZ2luZSksICgwLCBwZXNhcGlJbXBsXzEuV2ViR0xGRklBcGkpKGVuZ2luZSksIHtcclxuICAgICAgICAgICAgLy8gYnJpZGdlTG9nOiB0cnVlLFxyXG4gICAgICAgICAgICBHZXRMaWJWZXJzaW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMzU7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEFwaUxldmVsOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMzU7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldExpYkJhY2tlbmQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBDcmVhdGVKU0VuZ2luZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGpzRW5naW5lUmV0dXJuZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJvbmx5IG9uZSBhdmFpbGFibGUganNFbnYgaXMgYWxsb3dlZCBpbiBXZWJHTCBtb2RlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAganNFbmdpbmVSZXR1cm5lZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSlNFbmdpbmVXaXRoRXh0ZXJuYWxFbnY6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgRGVzdHJveUpTRW5naW5lOiBmdW5jdGlvbiAoKSB7IH0sXHJcbiAgICAgICAgICAgIEdldExhc3RFeGNlcHRpb25JbmZvOiBmdW5jdGlvbiAoaXNvbGF0ZSwgLyogb3V0IGludCAqLyBzdHJsZW4pIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbmdpbmUubGFzdEV4Y2VwdGlvbiA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ251bGwnO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlbmdpbmUubGFzdEV4Y2VwdGlvbiA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhlbmdpbmUubGFzdEV4Y2VwdGlvbi5zdGFjaywgc3RybGVuKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgTG93TWVtb3J5Tm90aWZpY2F0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBJZGxlTm90aWZpY2F0aW9uRGVhZGxpbmU6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFJlcXVlc3RNaW5vckdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgUmVxdWVzdEZ1bGxHYXJiYWdlQ29sbGVjdGlvbkZvclRlc3Rpbmc6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFNldEdlbmVyYWxEZXN0cnVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2dlbmVyYWxEZXN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuZ2VuZXJhbERlc3RydWN0b3IgPSBfZ2VuZXJhbERlc3RydWN0b3I7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldE1vZHVsZUV4ZWN1dG9yOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBsb2FkZXIgPSB0eXBlb2YgX190Z2pzR2V0TG9hZGVyICE9ICd1bmRlZmluZWQnID8gX190Z2pzR2V0TG9hZGVyKCkgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9hZGVyUmVzb2x2ZSA9IGxvYWRlci5SZXNvbHZlID8gKGZ1bmN0aW9uIChmaWxlTmFtZSwgdG8gPSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWROYW1lID0gbG9hZGVyLlJlc29sdmUoZmlsZU5hbWUsIHRvKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBub3QgZm91bmQ6ICcgKyBmaWxlTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlZE5hbWU7XHJcbiAgICAgICAgICAgICAgICB9KSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmN0aW9uIChmaWxlTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChbJ3B1ZXJ0cy9sb2cubWpzJywgJ3B1ZXJ0cy90aW1lci5tanMnXS5pbmRleE9mKGZpbGVOYW1lKSAhPSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge307XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkZXJSZXNvbHZlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVOYW1lID0gbG9hZGVyUmVzb2x2ZShmaWxlTmFtZSwgXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gd3hSZXF1aXJlKCdwdWVydHNfbWluaWdhbWVfanNfcmVzb3VyY2VzLycgKyAoZmlsZU5hbWUuZW5kc1dpdGgoJy5qcycpID8gZmlsZU5hbWUgOiBmaWxlTmFtZSArIFwiLmpzXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShuYW1lLCB0bykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBDUyAhPSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuSXNSZWxhdGl2ZSh0bykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmV0ID0gQ1MuUHVlcnRzLlBhdGhIZWxwZXIubm9ybWFsaXplKENTLlB1ZXJ0cy5QYXRoSGVscGVyLkRpcm5hbWUobmFtZSkgKyBcIi9cIiArIHRvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbW9ja1JlcXVpcmUoc3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7IGV4cG9ydHM6IHt9IH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZENhY2hlU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIGV4ZWN1dGVNb2R1bGVDYWNoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRDYWNoZVNwZWNpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5leHBvcnRzID0gZXhlY3V0ZU1vZHVsZUNhY2hlW2ZvdW5kQ2FjaGVTcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmRTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgUFVFUlRTX0pTX1JFU09VUkNFUyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3VuZFNwZWNpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBub3QgZm91bmQ6ICcgKyBzcGVjaWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjaWZpZXIgPSBmb3VuZFNwZWNpZmllcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBVRVJUU19KU19SRVNPVVJDRVNbc3BlY2lmaWVyXShyZXN1bHQuZXhwb3J0cywgZnVuY3Rpb24gbVJlcXVpcmUoc3BlY2lmaWVyVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2NrUmVxdWlyZShsb2FkZXJSZXNvbHZlID8gbG9hZGVyUmVzb2x2ZShzcGVjaWZpZXJUbywgc3BlY2lmaWVyKSA6IG5vcm1hbGl6ZShzcGVjaWZpZXIsIHNwZWNpZmllclRvKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSByZXN1bHQuZXhwb3J0cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuZXhwb3J0cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdHJ5RmluZE5hbWUgPSBbc3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3BlY2lmaWVyLmluZGV4T2YoJy4nKSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5RmluZE5hbWUgPSB0cnlGaW5kTmFtZS5jb25jYXQoW3NwZWNpZmllciArICcuanMnLCBzcGVjaWZpZXIgKyAnLnRzJywgc3BlY2lmaWVyICsgJy5tanMnLCBzcGVjaWZpZXIgKyAnLm10cyddKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmluZGVkID0gdHJ5RmluZE5hbWUucmVkdWNlKChyZXQsIG5hbWUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXQgIT09IGZhbHNlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqW25hbWVdID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY2lyY3VsYXIgZGVwZW5kZW5jeSBpcyBkZXRlY3RlZCB3aGVuIHJlcXVpcmluZyBcIiR7bmFtZX1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbmRlZCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ5RmluZE5hbWVbZmluZGVkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVxdWlyZVJldCA9IG1vY2tSZXF1aXJlKGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmVSZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRKU09iamVjdFZhbHVlR2V0dGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmN0aW9uIChvYmosIGtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmpba2V5XTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgRXZhbDogZnVuY3Rpb24gKGlzb2xhdGUsIGNvZGVTdHJpbmcsIHBhdGgpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFsaWJyYXJ5XzEuZ2xvYmFsLmV2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZXZhbCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2RlID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhjb2RlU3RyaW5nKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsaWJyYXJ5XzEuZ2xvYmFsLmV2YWwoY29kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGdldEludFB0ck1hbmFnZXIoKS5HZXRQb2ludGVyRm9ySlNWYWx1ZShyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC8qRlJlc3VsdEluZm8gKi8gMTAyNDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RFeGNlcHRpb24gPSBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBTZXRQdXNoSlNGdW5jdGlvbkFyZ3VtZW50c0NhbGxiYWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSwgY2FsbGJhY2ssIGpzRW52SWR4KSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuR2V0SlNBcmd1bWVudHNDYWxsYmFjayA9IGNhbGxiYWNrO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBUaHJvd0V4Y2VwdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIC8qYnl0ZVtdICovIG1lc3NhZ2VTdHJpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG1lc3NhZ2VTdHJpbmcpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgSW52b2tlSlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgaGFzUmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gZnVuYy5pbnZva2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuYy5sYXN0RXhjZXB0aW9uID0gZXJyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0RnVuY3Rpb25MYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnVuYyBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZ1bmMubGFzdEV4Y2VwdGlvbiA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdudWxsJztcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZ1bmMubGFzdEV4Y2VwdGlvbiA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd1bmRlZmluZWQnO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKGZ1bmMubGFzdEV4Y2VwdGlvbi5zdGFjayB8fCBmdW5jLmxhc3RFeGNlcHRpb24ubWVzc2FnZSB8fCAnJywgbGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncHRyIGlzIG5vdCBhIGpzZnVuYycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBSZWxlYXNlSlNGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIF9mdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVtb3ZlSlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVsZWFzZUpTT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgb2JqKSB7XHJcbiAgICAgICAgICAgICAgICBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZW1vdmVKU09iamVjdEJ5SWQob2JqKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVzZXRSZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gbnVsbDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQ2xlYXJNb2R1bGVDYWNoZTogZnVuY3Rpb24gKCkgeyB9LFxyXG4gICAgICAgICAgICBDcmVhdGVJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlLCBwb3J0KSB7IH0sXHJcbiAgICAgICAgICAgIERlc3Ryb3lJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIEluc3BlY3RvclRpY2s6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIExvZ2ljVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgU2V0TG9nQ2FsbGJhY2s6IGZ1bmN0aW9uIChsb2csIGxvZ1dhcm5pbmcsIGxvZ0Vycm9yKSB7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEpTU3RhY2tUcmFjZTogZnVuY3Rpb24gKGlzb2xhdGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoKS5zdGFjaztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0V2ViR0xQYXBpRW52UmVmOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMjA0ODsgLy8ganVzdCBub3QgbnVsbHB0clxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==