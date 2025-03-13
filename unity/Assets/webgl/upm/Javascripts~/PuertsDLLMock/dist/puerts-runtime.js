/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
        const { UTF8ToString, _malloc, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, stackSave, stackRestore, stackAlloc, _CallCSharpFunctionCallback, _CallCSharpConstructorCallback, _CallCSharpDestructorCallback, HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64, } = ctorParam;
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
            _CallCSharpFunctionCallback,
            _CallCSharpConstructorCallback,
            _CallCSharpDestructorCallback,
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
            attr.get = engine.makeCSharpFunctionCallbackFunction(isStatic, getter, gettercallbackidx);
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
        }, (0, getFromJSArgument_1.default)(engine), (0, getFromJSReturn_1.default)(engine), (0, setToInvokeJSArgument_1.default)(engine), (0, setToJSInvokeReturn_1.default)(engine), (0, setToJSOutArgument_1.default)(engine), (0, register_1.default)(engine), {
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
                    throw new Error("only one available jsEnv is allowed in WebGL mode");
                }
                jsEngineReturned = true;
                return 1024;
            },
            CreateJSEngineWithExternalEnv: function () { },
            DestroyJSEngine: function () { },
            GetLastExceptionInfo: function (isolate, /* out int */ strlen) {
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
            }
        });
    }
};
//# sourceMappingURL=index.js.map
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLHVQQUF1UDtBQUN2UTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTSwyREFBMkQ7QUFDekUsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTtBQUNmO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBLHdEQUF3RDtBQUN4RCx3Q0FBd0M7QUFDeEM7QUFDQSxvQkFBb0I7QUFDcEI7QUFDQSxtRUFBbUU7QUFDbkUsZ0VBQWdFO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O0FDN3BCYTtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxrQkFBa0IsbUJBQU8sQ0FBQyx1Q0FBWTtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUM1SGE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUMzRWE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBQ2I7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxpQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL291dHB1dC9saWJyYXJ5LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvZ2V0RnJvbUpTQXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9nZXRGcm9tSlNSZXR1cm4uanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9yZWdpc3Rlci5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSW52b2tlSlNBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSlNJbnZva2VSZXR1cm4uanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0pTT3V0QXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovLy8uL291dHB1dC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLnJldHVybkJpZ0ludCA9IGV4cG9ydHMuaXNCaWdJbnQgPSBleHBvcnRzLnNldE91dFZhbHVlOCA9IGV4cG9ydHMuc2V0T3V0VmFsdWUzMiA9IGV4cG9ydHMubWFrZUJpZ0ludCA9IGV4cG9ydHMuR2V0VHlwZSA9IGV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBleHBvcnRzLk9uRmluYWxpemUgPSBleHBvcnRzLmNyZWF0ZVdlYWtSZWYgPSBleHBvcnRzLmdsb2JhbCA9IGV4cG9ydHMuQ1NoYXJwT2JqZWN0TWFwID0gZXhwb3J0cy5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5ID0gZXhwb3J0cy5KU09iamVjdCA9IGV4cG9ydHMuSlNGdW5jdGlvbiA9IGV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyID0gZXhwb3J0cy5GdW5jdGlvbkNhbGxiYWNrSW5mbyA9IHZvaWQgMDtcclxuLyoqXHJcbiAqIOS4gOasoeWHveaVsOiwg+eUqOeahGluZm9cclxuICog5a+55bqUdjg6OkZ1bmN0aW9uQ2FsbGJhY2tJbmZvXHJcbiAqL1xyXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mbyB7XHJcbiAgICBhcmdzO1xyXG4gICAgcmV0dXJuVmFsdWU7XHJcbiAgICBzdGFjayA9IDA7XHJcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XHJcbiAgICAgICAgdGhpcy5hcmdzID0gYXJncztcclxuICAgIH1cclxuICAgIHJlY3ljbGUoKSB7XHJcbiAgICAgICAgdGhpcy5zdGFjayA9IDA7XHJcbiAgICAgICAgdGhpcy5hcmdzID0gbnVsbDtcclxuICAgICAgICB0aGlzLnJldHVyblZhbHVlID0gdm9pZCAwO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm8gPSBGdW5jdGlvbkNhbGxiYWNrSW5mbztcclxuLy8gc3RydWN0IE1vY2tWOFZhbHVlXHJcbi8vIHtcclxuLy8gICAgIGludCBKU1ZhbHVlVHlwZTsgIC8vIDBcclxuLy8gICAgIGludCBGaW5hbFZhbHVlUG9pbnRlclsyXTsgLy8gMSAyIGlmIHZhbHVlIGlzIGJpZ2ludCBGaW5hbFZhbHVlUG9pbnRlclswXSBmb3IgbG93LCBGaW5hbFZhbHVlUG9pbnRlclsxXSBmb3IgaGlnaFxyXG4vLyAgICAgaW50IGV4dHJhOyAvLyAzXHJcbi8vICAgICBpbnQgRnVuY3Rpb25DYWxsYmFja0luZm87IC8vIDRcclxuLy8gfTtcclxuY29uc3QgQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgPSA0OyAvLyBpbnQgY291bnRcclxuLyoqXHJcbiAqIOaKikZ1bmN0aW9uQ2FsbGJhY2tJbmZv5Lul5Y+K5YW25Y+C5pWw6L2s5YyW5Li6YyPlj6/nlKjnmoRpbnRwdHJcclxuICovXHJcbmNsYXNzIEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciB7XHJcbiAgICAvLyBGdW5jdGlvbkNhbGxiYWNrSW5mb+eahOWIl+ihqO+8jOS7peWIl+ihqOeahGluZGV45L2c5Li6SW50UHRy55qE5YC8XHJcbiAgICBpbmZvcyA9IFtuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oWzBdKV07IC8vIOi/memHjOWOn+acrOWPquaYr+S4quaZrumAmueahDBcclxuICAgIC8vIEZ1bmN0aW9uQ2FsbGJhY2tJbmZv55So5a6M5ZCO77yM5bCG5YW25bqP5Y+35pS+5YWl4oCc5Zue5pS25YiX6KGo4oCd77yM5LiL5qyh5bCx6IO957un57ut5pyN55So6K+laW5kZXjvvIzogIzkuI3lv4XorqlpbmZvc+aVsOe7hOaXoOmZkOaJqeWxleS4i+WOu1xyXG4gICAgZnJlZUluZm9zSW5kZXggPSBbXTtcclxuICAgIGZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aCA9IHt9O1xyXG4gICAgZnJlZVJlZk1lbW9yeSA9IFtdO1xyXG4gICAgZW5naW5lO1xyXG4gICAgY29uc3RydWN0b3IoZW5naW5lKSB7XHJcbiAgICAgICAgdGhpcy5lbmdpbmUgPSBlbmdpbmU7XHJcbiAgICB9XHJcbiAgICBhbGxvY0NhbGxiYWNrSW5mb01lbW9yeShhcmdzTGVuZ3RoKSB7XHJcbiAgICAgICAgY29uc3QgY2FjaGVBcnJheSA9IHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdO1xyXG4gICAgICAgIGlmIChjYWNoZUFycmF5ICYmIGNhY2hlQXJyYXkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWNoZUFycmF5LnBvcCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoKGFyZ3NMZW5ndGggKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDEpIDw8IDIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGFsbG9jUmVmTWVtb3J5KCkge1xyXG4gICAgICAgIGlmICh0aGlzLmZyZWVSZWZNZW1vcnkubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mcmVlUmVmTWVtb3J5LnBvcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVuZ2luZS51bml0eUFwaS5fbWFsbG9jKEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyIDw8IDIpO1xyXG4gICAgfVxyXG4gICAgcmVjeWNsZVJlZk1lbW9yeShidWZmZXJQdHIpIHtcclxuICAgICAgICBpZiAodGhpcy5mcmVlUmVmTWVtb3J5Lmxlbmd0aCA+IDIwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9mcmVlKGJ1ZmZlclB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmZyZWVSZWZNZW1vcnkucHVzaChidWZmZXJQdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJlY3ljbGVDYWxsYmFja0luZm9NZW1vcnkoYnVmZmVyUHRyLCBhcmdzKSB7XHJcbiAgICAgICAgY29uc3QgYXJnc0xlbmd0aCA9IGFyZ3MubGVuZ3RoO1xyXG4gICAgICAgIGlmICghdGhpcy5mcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGhbYXJnc0xlbmd0aF0gJiYgYXJnc0xlbmd0aCA8IDUpIHtcclxuICAgICAgICAgICAgdGhpcy5mcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGhbYXJnc0xlbmd0aF0gPSBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgY2FjaGVBcnJheSA9IHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdO1xyXG4gICAgICAgIGlmICghY2FjaGVBcnJheSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ckluMzIgPSBidWZmZXJQdHIgPDwgMjtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyZ3NMZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICBpZiAoYXJnc1tpXSBpbnN0YW5jZW9mIEFycmF5ICYmIGFyZ3NbaV0ubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVjeWNsZVJlZk1lbW9yeSh0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbYnVmZmVyUHRySW4zMiArIGkgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyDmi43ohJHooovlrprnmoTmnIDlpKfnvJPlrZjkuKrmlbDlpKflsI/jgIIgNTAgLSDlj4LmlbDkuKrmlbAgKiAxMFxyXG4gICAgICAgIGlmIChjYWNoZUFycmF5Lmxlbmd0aCA+ICg1MCAtIGFyZ3NMZW5ndGggKiAxMCkpIHtcclxuICAgICAgICAgICAgdGhpcy5lbmdpbmUudW5pdHlBcGkuX2ZyZWUoYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNhY2hlQXJyYXkucHVzaChidWZmZXJQdHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogaW50cHRy55qE5qC85byP5Li6aWTlt6bnp7vlm5vkvY1cclxuICAgICAqXHJcbiAgICAgKiDlj7Pkvqflm5vkvY3vvIzmmK/kuLrkuoblnKjlj7Plm5vkvY3lrZjlgqjlj4LmlbDnmoTluo/lj7fvvIzov5nmoLflj6/ku6XnlKjkuo7ooajnpLpjYWxsYmFja2luZm/lj4LmlbDnmoRpbnRwdHJcclxuICAgICAqL1xyXG4gICAgLy8gc3RhdGljIEdldE1vY2tQb2ludGVyKGFyZ3M6IGFueVtdKTogTW9ja0ludFB0ciB7XHJcbiAgICAvLyAgICAgbGV0IGluZGV4OiBudW1iZXI7XHJcbiAgICAvLyAgICAgaW5kZXggPSB0aGlzLmZyZWVJbmZvc0luZGV4LnBvcCgpO1xyXG4gICAgLy8gICAgIC8vIGluZGV45pyA5bCP5Li6MVxyXG4gICAgLy8gICAgIGlmIChpbmRleCkge1xyXG4gICAgLy8gICAgICAgICB0aGlzLmluZm9zW2luZGV4XS5hcmdzID0gYXJncztcclxuICAgIC8vICAgICB9IGVsc2Uge1xyXG4gICAgLy8gICAgICAgICBpbmRleCA9IHRoaXMuaW5mb3MucHVzaChuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oYXJncykpIC0gMTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgICAgcmV0dXJuIGluZGV4IDw8IDQ7XHJcbiAgICAvLyB9XHJcbiAgICBHZXRNb2NrUG9pbnRlcihhcmdzKSB7XHJcbiAgICAgICAgY29uc3QgYXJnc0xlbmd0aCA9IGFyZ3MubGVuZ3RoO1xyXG4gICAgICAgIGxldCBidWZmZXJQdHJJbjggPSB0aGlzLmFsbG9jQ2FsbGJhY2tJbmZvTWVtb3J5KGFyZ3NMZW5ndGgpO1xyXG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMuZnJlZUluZm9zSW5kZXgucG9wKCk7XHJcbiAgICAgICAgbGV0IGZ1bmN0aW9uQ2FsbGJhY2tJbmZvO1xyXG4gICAgICAgIC8vIGluZGV45pyA5bCP5Li6MVxyXG4gICAgICAgIGlmIChpbmRleCkge1xyXG4gICAgICAgICAgICAoZnVuY3Rpb25DYWxsYmFja0luZm8gPSB0aGlzLmluZm9zW2luZGV4XSkuYXJncyA9IGFyZ3M7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpbmRleCA9IHRoaXMuaW5mb3MucHVzaChmdW5jdGlvbkNhbGxiYWNrSW5mbyA9IG5ldyBGdW5jdGlvbkNhbGxiYWNrSW5mbyhhcmdzKSkgLSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgdW5pdHlBcGkgPSB0aGlzLmVuZ2luZS51bml0eUFwaTtcclxuICAgICAgICBjb25zdCBidWZmZXJQdHJJbjMyID0gYnVmZmVyUHRySW44ID4+IDI7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2J1ZmZlclB0ckluMzJdID0gaW5kZXg7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzTGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGFyZyA9IGFyZ3NbaV07XHJcbiAgICAgICAgICAgIC8vIGluaXQgZWFjaCB2YWx1ZVxyXG4gICAgICAgICAgICBjb25zdCBqc1ZhbHVlVHlwZSA9IEdldFR5cGUodGhpcy5lbmdpbmUsIGFyZyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGpzVmFsdWVQdHIgPSBidWZmZXJQdHJJbjMyICsgaSAqIEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyICsgMTtcclxuICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHJdID0ganNWYWx1ZVR5cGU7IC8vIGpzdmFsdWV0eXBlXHJcbiAgICAgICAgICAgIGlmIChqc1ZhbHVlVHlwZSA9PSAyIHx8IGpzVmFsdWVUeXBlID09IDQgfHwganNWYWx1ZVR5cGUgPT0gNTEyKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBiaWdpbnTjgIFudW1iZXIgb3IgZGF0ZVxyXG4gICAgICAgICAgICAgICAgJEZpbGxBcmd1bWVudEZpbmFsTnVtYmVyVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIGpzVmFsdWVQdHIgKyAxKTsgLy8gdmFsdWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChqc1ZhbHVlVHlwZSA9PSA4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnVuY3Rpb25DYWxsYmFja0luZm8uc3RhY2sgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uQ2FsbGJhY2tJbmZvLnN0YWNrID0gdW5pdHlBcGkuc3RhY2tTYXZlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwgKGpzVmFsdWVQdHIgKyAyKSA8PCAyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChqc1ZhbHVlVHlwZSA9PSA2NCAmJiBhcmcgaW5zdGFuY2VvZiBBcnJheSAmJiBhcmcubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIG1heWJlIGEgcmVmXHJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwgMCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWZQdHJJbjggPSB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDJdID0gdGhpcy5hbGxvY1JlZk1lbW9yeSgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmUHRyID0gcmVmUHRySW44ID4+IDI7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZWZWYWx1ZVR5cGUgPSB1bml0eUFwaS5IRUFQMzJbcmVmUHRyXSA9IEdldFR5cGUodGhpcy5lbmdpbmUsIGFyZ1swXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVmVmFsdWVUeXBlID09IDIgfHwgcmVmVmFsdWVUeXBlID09IDQgfHwgcmVmVmFsdWVUeXBlID09IDUxMikge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG51bWJlciBvciBkYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgJEZpbGxBcmd1bWVudEZpbmFsTnVtYmVyVmFsdWUodGhpcy5lbmdpbmUsIGFyZ1swXSwgcmVmVmFsdWVUeXBlLCByZWZQdHIgKyAxKTsgLy8gdmFsdWVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltyZWZQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZ1swXSwgcmVmVmFsdWVUeXBlLCAocmVmUHRyICsgMikgPDwgMik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbcmVmUHRyICsgM10gPSBidWZmZXJQdHJJbjg7IC8vIGEgcG9pbnRlciB0byB0aGUgaW5mb1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gb3RoZXJcclxuICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmcsIGpzVmFsdWVUeXBlLCAoanNWYWx1ZVB0ciArIDIpIDw8IDIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgM10gPSBidWZmZXJQdHJJbjg7IC8vIGEgcG9pbnRlciB0byB0aGUgaW5mb1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYnVmZmVyUHRySW44O1xyXG4gICAgfVxyXG4gICAgLy8gc3RhdGljIEdldEJ5TW9ja1BvaW50ZXIoaW50cHRyOiBNb2NrSW50UHRyKTogRnVuY3Rpb25DYWxsYmFja0luZm8ge1xyXG4gICAgLy8gICAgIHJldHVybiB0aGlzLmluZm9zW2ludHB0ciA+PiA0XTtcclxuICAgIC8vIH1cclxuICAgIEdldEJ5TW9ja1BvaW50ZXIocHRySW44KSB7XHJcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmluZm9zW2luZGV4XTtcclxuICAgIH1cclxuICAgIEdldFJldHVyblZhbHVlQW5kUmVjeWNsZShwdHJJbjgpIHtcclxuICAgICAgICBjb25zdCBwdHJJbjMyID0gcHRySW44ID4+IDI7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMl07XHJcbiAgICAgICAgbGV0IGluZm8gPSB0aGlzLmluZm9zW2luZGV4XTtcclxuICAgICAgICBsZXQgcmV0ID0gaW5mby5yZXR1cm5WYWx1ZTtcclxuICAgICAgICB0aGlzLnJlY3ljbGVDYWxsYmFja0luZm9NZW1vcnkocHRySW44LCBpbmZvLmFyZ3MpO1xyXG4gICAgICAgIGlmIChpbmZvLnN0YWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLnN0YWNrUmVzdG9yZShpbmZvLnN0YWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5mby5yZWN5Y2xlKCk7XHJcbiAgICAgICAgdGhpcy5mcmVlSW5mb3NJbmRleC5wdXNoKGluZGV4KTtcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gICAgUmVsZWFzZUJ5TW9ja0ludFB0cihwdHJJbjgpIHtcclxuICAgICAgICBjb25zdCBwdHJJbjMyID0gcHRySW44ID4+IDI7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMl07XHJcbiAgICAgICAgbGV0IGluZm8gPSB0aGlzLmluZm9zW2luZGV4XTtcclxuICAgICAgICB0aGlzLnJlY3ljbGVDYWxsYmFja0luZm9NZW1vcnkocHRySW44LCBpbmZvLmFyZ3MpO1xyXG4gICAgICAgIGlmIChpbmZvLnN0YWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLnN0YWNrUmVzdG9yZShpbmZvLnN0YWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5mby5yZWN5Y2xlKCk7XHJcbiAgICAgICAgdGhpcy5mcmVlSW5mb3NJbmRleC5wdXNoKGluZGV4KTtcclxuICAgIH1cclxuICAgIEdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWVQdHJJbjgpIHtcclxuICAgICAgICBsZXQgaGVhcDMyID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyO1xyXG4gICAgICAgIGNvbnN0IGluZm9QdHJJbjggPSBoZWFwMzJbKHZhbHVlUHRySW44ID4+IDIpICsgM107XHJcbiAgICAgICAgY29uc3QgY2FsbGJhY2tJbmZvSW5kZXggPSBoZWFwMzJbaW5mb1B0ckluOCA+PiAyXTtcclxuICAgICAgICBjb25zdCBhcmdzSW5kZXggPSAodmFsdWVQdHJJbjggLSBpbmZvUHRySW44IC0gNCkgLyAoNCAqIEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbmZvc1tjYWxsYmFja0luZm9JbmRleF0uYXJnc1thcmdzSW5kZXhdO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyO1xyXG4vKipcclxuICog5Luj6KGo5LiA5LiqSlNGdW5jdGlvblxyXG4gKi9cclxuY2xhc3MgSlNGdW5jdGlvbiB7XHJcbiAgICBfZnVuYztcclxuICAgIGlkO1xyXG4gICAgYXJncyA9IFtdO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICBjb25zdHJ1Y3RvcihpZCwgZnVuYykge1xyXG4gICAgICAgIHRoaXMuX2Z1bmMgPSBmdW5jO1xyXG4gICAgICAgIHRoaXMuaWQgPSBpZDtcclxuICAgIH1cclxuICAgIGludm9rZSgpIHtcclxuICAgICAgICB2YXIgYXJncyA9IFsuLi50aGlzLmFyZ3NdO1xyXG4gICAgICAgIHRoaXMuYXJncy5sZW5ndGggPSAwO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9mdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuSlNGdW5jdGlvbiA9IEpTRnVuY3Rpb247XHJcbi8qKlxyXG4gKiDku6PooajkuIDkuKpKU09iamVjdFxyXG4gKi9cclxuY2xhc3MgSlNPYmplY3Qge1xyXG4gICAgX29iajtcclxuICAgIGlkO1xyXG4gICAgY29uc3RydWN0b3IoaWQsIG9iaikge1xyXG4gICAgICAgIHRoaXMuX29iaiA9IG9iajtcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICB9XHJcbiAgICBnZXRPYmplY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX29iajtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkpTT2JqZWN0ID0gSlNPYmplY3Q7XHJcbmNsYXNzIGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnkge1xyXG4gICAgc3RhdGljIHJlZ3VsYXJJRCA9IDE7XHJcbiAgICBzdGF0aWMgZnJlZUlEID0gW107XHJcbiAgICBzdGF0aWMgaWRNYXAgPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgc3RhdGljIGpzRnVuY09yT2JqZWN0S1YgPSB7fTtcclxuICAgIHN0YXRpYyBnZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuY1ZhbHVlKSB7XHJcbiAgICAgICAgbGV0IGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5nZXQoZnVuY1ZhbHVlKTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmZyZWVJRC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaWQgPSB0aGlzLmZyZWVJRC5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZWd1bGFySUQrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZnVuYyA9IG5ldyBKU0Z1bmN0aW9uKGlkLCBmdW5jVmFsdWUpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuc2V0KGZ1bmNWYWx1ZSwgaWQpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBmdW5jO1xyXG4gICAgICAgIHJldHVybiBmdW5jO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGdldE9yQ3JlYXRlSlNPYmplY3Qob2JqKSB7XHJcbiAgICAgICAgbGV0IGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5nZXQob2JqKTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmZyZWVJRC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaWQgPSB0aGlzLmZyZWVJRC5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZWd1bGFySUQrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QganNPYmplY3QgPSBuZXcgSlNPYmplY3QoaWQsIG9iaik7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5zZXQob2JqLCBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXSA9IGpzT2JqZWN0O1xyXG4gICAgICAgIHJldHVybiBqc09iamVjdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBnZXRKU09iamVjdEJ5SWQoaWQpIHtcclxuICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgIH1cclxuICAgIHN0YXRpYyByZW1vdmVKU09iamVjdEJ5SWQoaWQpIHtcclxuICAgICAgICBjb25zdCBqc09iamVjdCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgaWYgKCFqc09iamVjdClcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybigncmVtb3ZlSlNPYmplY3RCeUlkIGZhaWxlZDogaWQgaXMgaW52YWxpZDogJyArIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmRlbGV0ZShqc09iamVjdC5nZXRPYmplY3QoKSk7XHJcbiAgICAgICAgZGVsZXRlIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgdGhpcy5mcmVlSUQucHVzaChpZCk7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZ2V0SlNGdW5jdGlvbkJ5SWQoaWQpIHtcclxuICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgIH1cclxuICAgIHN0YXRpYyByZW1vdmVKU0Z1bmN0aW9uQnlJZChpZCkge1xyXG4gICAgICAgIGNvbnN0IGpzRnVuYyA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgaWYgKCFqc0Z1bmMpXHJcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ3JlbW92ZUpTRnVuY3Rpb25CeUlkIGZhaWxlZDogaWQgaXMgaW52YWxpZDogJyArIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmRlbGV0ZShqc0Z1bmMuX2Z1bmMpO1xyXG4gICAgICAgIGRlbGV0ZSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIHRoaXMuZnJlZUlELnB1c2goaWQpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnk7XHJcbi8qKlxyXG4gKiBDU2hhcnDlr7nosaHorrDlvZXooajvvIzorrDlvZXmiYDmnIlDU2hhcnDlr7nosaHlubbliIbphY1pZFxyXG4gKiDlkoxwdWVydHMuZGxs5omA5YGa55qE5LiA5qC3XHJcbiAqL1xyXG5jbGFzcyBDU2hhcnBPYmplY3RNYXAge1xyXG4gICAgY2xhc3NlcyA9IFtudWxsXTtcclxuICAgIG5hdGl2ZU9iamVjdEtWID0gbmV3IE1hcCgpO1xyXG4gICAgLy8gcHJpdmF0ZSBuYXRpdmVPYmplY3RLVjogeyBbb2JqZWN0SUQ6IENTSWRlbnRpZmllcl06IFdlYWtSZWY8YW55PiB9ID0ge307XHJcbiAgICAvLyBwcml2YXRlIGNzSURXZWFrTWFwOiBXZWFrTWFwPGFueSwgQ1NJZGVudGlmaWVyPiA9IG5ldyBXZWFrTWFwKCk7XHJcbiAgICBuYW1lc1RvQ2xhc3Nlc0lEID0ge307XHJcbiAgICBjbGFzc0lEV2Vha01hcCA9IG5ldyBXZWFrTWFwKCk7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLl9tZW1vcnlEZWJ1ZyAmJiBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhZGRDYWxsZWQnLCB0aGlzLmFkZENhbGxlZCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZW1vdmVDYWxsZWQnLCB0aGlzLnJlbW92ZUNhbGxlZCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd3cicsIHRoaXMubmF0aXZlT2JqZWN0S1Yuc2l6ZSk7XHJcbiAgICAgICAgfSwgMTAwMCk7XHJcbiAgICB9XHJcbiAgICBfbWVtb3J5RGVidWcgPSBmYWxzZTtcclxuICAgIGFkZENhbGxlZCA9IDA7XHJcbiAgICByZW1vdmVDYWxsZWQgPSAwO1xyXG4gICAgYWRkKGNzSUQsIG9iaikge1xyXG4gICAgICAgIHRoaXMuX21lbW9yeURlYnVnICYmIHRoaXMuYWRkQ2FsbGVkKys7XHJcbiAgICAgICAgLy8gdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcclxuICAgICAgICAvLyB0aGlzLmNzSURXZWFrTWFwLnNldChvYmosIGNzSUQpO1xyXG4gICAgICAgIHRoaXMubmF0aXZlT2JqZWN0S1Yuc2V0KGNzSUQsIGNyZWF0ZVdlYWtSZWYob2JqKSk7XHJcbiAgICAgICAgb2JqWyckY3NpZCddID0gY3NJRDtcclxuICAgIH1cclxuICAgIHJlbW92ZShjc0lEKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgdGhpcy5yZW1vdmVDYWxsZWQrKztcclxuICAgICAgICAvLyBkZWxldGUgdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXTtcclxuICAgICAgICB0aGlzLm5hdGl2ZU9iamVjdEtWLmRlbGV0ZShjc0lEKTtcclxuICAgIH1cclxuICAgIGZpbmRPckFkZE9iamVjdChjc0lELCBjbGFzc0lEKSB7XHJcbiAgICAgICAgbGV0IHJldCA9IHRoaXMubmF0aXZlT2JqZWN0S1YuZ2V0KGNzSUQpO1xyXG4gICAgICAgIC8vIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdO1xyXG4gICAgICAgIGlmIChyZXQgJiYgKHJldCA9IHJldC5kZXJlZigpKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXQgPSB0aGlzLmNsYXNzZXNbY2xhc3NJRF0uY3JlYXRlRnJvbUNTKGNzSUQpO1xyXG4gICAgICAgIC8vIHRoaXMuYWRkKGNzSUQsIHJldCk7IOaehOmAoOWHveaVsOmHjOi0n+i0o+iwg+eUqFxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbiAgICBnZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KG9iaikge1xyXG4gICAgICAgIC8vIHJldHVybiB0aGlzLmNzSURXZWFrTWFwLmdldChvYmopO1xyXG4gICAgICAgIHJldHVybiBvYmogPyBvYmouJGNzaWQgOiAwO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuQ1NoYXJwT2JqZWN0TWFwID0gQ1NoYXJwT2JqZWN0TWFwO1xyXG47XHJcbnZhciBkZXN0cnVjdG9ycyA9IHt9O1xyXG5leHBvcnRzLmdsb2JhbCA9IGdsb2JhbCA9IGdsb2JhbCB8fCBnbG9iYWxUaGlzIHx8IHdpbmRvdztcclxuZ2xvYmFsLmdsb2JhbCA9IGdsb2JhbDtcclxuY29uc3QgY3JlYXRlV2Vha1JlZiA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodHlwZW9mIFdlYWtSZWYgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBpZiAodHlwZW9mIFdYV2Vha1JlZiA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiV2Vha1JlZiBpcyBub3QgZGVmaW5lZC4gbWF5YmUgeW91IHNob3VsZCB1c2UgbmV3ZXIgZW52aXJvbm1lbnRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBkZXJlZigpIHsgcmV0dXJuIG9iajsgfSB9O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLndhcm4oXCJ1c2luZyBXWFdlYWtSZWZcIik7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBXWFdlYWtSZWYob2JqKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICByZXR1cm4gbmV3IFdlYWtSZWYob2JqKTtcclxuICAgIH07XHJcbn0pKCk7XHJcbmV4cG9ydHMuY3JlYXRlV2Vha1JlZiA9IGNyZWF0ZVdlYWtSZWY7XHJcbmNsYXNzIEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9jayB7XHJcbiAgICBfaGFuZGxlcjtcclxuICAgIHJlZnMgPSBbXTtcclxuICAgIGhlbGRzID0gW107XHJcbiAgICBhdmFpbGFibGVJbmRleCA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IoaGFuZGxlcikge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihcIkZpbmFsaXphdGlvblJlZ2lzdGVyIGlzIG5vdCBkZWZpbmVkLiB1c2luZyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2tcIik7XHJcbiAgICAgICAgZ2xvYmFsLl9wdWVydHNfcmVnaXN0cnkgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuX2hhbmRsZXIgPSBoYW5kbGVyO1xyXG4gICAgfVxyXG4gICAgcmVnaXN0ZXIob2JqLCBoZWxkVmFsdWUpIHtcclxuICAgICAgICBpZiAodGhpcy5hdmFpbGFibGVJbmRleC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmF2YWlsYWJsZUluZGV4LnBvcCgpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZnNbaW5kZXhdID0gY3JlYXRlV2Vha1JlZihvYmopO1xyXG4gICAgICAgICAgICB0aGlzLmhlbGRzW2luZGV4XSA9IGhlbGRWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVmcy5wdXNoKGNyZWF0ZVdlYWtSZWYob2JqKSk7XHJcbiAgICAgICAgICAgIHRoaXMuaGVsZHMucHVzaChoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog5riF6Zmk5Y+v6IO95bey57uP5aSx5pWI55qEV2Vha1JlZlxyXG4gICAgICovXHJcbiAgICBpdGVyYXRlUG9zaXRpb24gPSAwO1xyXG4gICAgY2xlYW51cChwYXJ0ID0gMSkge1xyXG4gICAgICAgIGNvbnN0IHN0ZXBDb3VudCA9IHRoaXMucmVmcy5sZW5ndGggLyBwYXJ0O1xyXG4gICAgICAgIGxldCBpID0gdGhpcy5pdGVyYXRlUG9zaXRpb247XHJcbiAgICAgICAgZm9yIChsZXQgY3VycmVudFN0ZXAgPSAwOyBpIDwgdGhpcy5yZWZzLmxlbmd0aCAmJiBjdXJyZW50U3RlcCA8IHN0ZXBDb3VudDsgaSA9IChpID09IHRoaXMucmVmcy5sZW5ndGggLSAxID8gMCA6IGkgKyAxKSwgY3VycmVudFN0ZXArKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5yZWZzW2ldID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWZzW2ldLmRlcmVmKCkpIHtcclxuICAgICAgICAgICAgICAgIC8vIOebruWJjeayoeacieWGheWtmOaVtOeQhuiDveWKm++8jOWmguaenOa4uOaIj+S4reacn3JlZuW+iOWkmuS9huWQjuacn+WwkeS6hu+8jOi/memHjOWwseS8mueZvei0uemBjeWOhuasoeaVsFxyXG4gICAgICAgICAgICAgICAgLy8g5L2G6YGN5Y6G5Lmf5Y+q5piv5LiA5Y+lPT3lkoxjb250aW51Ze+8jOa1qui0ueW9seWTjeS4jeWkp1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdmFpbGFibGVJbmRleC5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWZzW2ldID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlcih0aGlzLmhlbGRzW2ldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLml0ZXJhdGVQb3NpdGlvbiA9IGk7XHJcbiAgICB9XHJcbn1cclxudmFyIHJlZ2lzdHJ5ID0gbnVsbDtcclxuZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIHJlZ2lzdHJ5ID0gbmV3ICh0eXBlb2YgRmluYWxpemF0aW9uUmVnaXN0cnkgPT0gJ3VuZGVmaW5lZCcgPyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2sgOiBGaW5hbGl6YXRpb25SZWdpc3RyeSkoZnVuY3Rpb24gKGhlbGRWYWx1ZSkge1xyXG4gICAgICAgIHZhciBjYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XHJcbiAgICAgICAgaWYgKCFjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYW5ub3QgZmluZCBkZXN0cnVjdG9yIGZvciBcIiArIGhlbGRWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgtLWNhbGxiYWNrLnJlZiA9PSAwKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xyXG4gICAgICAgICAgICBjYWxsYmFjayhoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIE9uRmluYWxpemUob2JqLCBoZWxkVmFsdWUsIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAoIXJlZ2lzdHJ5KSB7XHJcbiAgICAgICAgaW5pdCgpO1xyXG4gICAgfVxyXG4gICAgbGV0IG9yaWdpbkNhbGxiYWNrID0gZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXTtcclxuICAgIGlmIChvcmlnaW5DYWxsYmFjaykge1xyXG4gICAgICAgIC8vIFdlYWtSZWblhoXlrrnph4rmlL7ml7bmnLrlj6/og73mr5RmaW5hbGl6YXRpb25SZWdpc3RyeeeahOinpuWPkeabtOaXqe+8jOWJjemdouWmguaenOWPkeeOsHdlYWtSZWbkuLrnqbrkvJrph43mlrDliJvlu7rlr7nosaFcclxuICAgICAgICAvLyDkvYbkuYvliY3lr7nosaHnmoRmaW5hbGl6YXRpb25SZWdpc3RyeeacgOe7iOWPiOiCr+WumuS8muinpuWPkeOAglxyXG4gICAgICAgIC8vIOaJgOS7peWmguaenOmBh+WIsOi/meS4quaDheWGte+8jOmcgOimgee7mWRlc3RydWN0b3LliqDorqHmlbBcclxuICAgICAgICArK29yaWdpbkNhbGxiYWNrLnJlZjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGNhbGxiYWNrLnJlZiA9IDE7XHJcbiAgICAgICAgZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXSA9IGNhbGxiYWNrO1xyXG4gICAgfVxyXG4gICAgcmVnaXN0cnkucmVnaXN0ZXIob2JqLCBoZWxkVmFsdWUpO1xyXG59XHJcbmV4cG9ydHMuT25GaW5hbGl6ZSA9IE9uRmluYWxpemU7XHJcbmNsYXNzIFB1ZXJ0c0pTRW5naW5lIHtcclxuICAgIGNzaGFycE9iamVjdE1hcDtcclxuICAgIGZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcclxuICAgIHVuaXR5QXBpO1xyXG4gICAgLyoqIOWtl+espuS4sue8k+WtmO+8jOm7mOiupOS4ujI1NuWtl+iKgiAqL1xyXG4gICAgc3RyQnVmZmVyO1xyXG4gICAgc3RyaW5nQnVmZmVyU2l6ZSA9IDI1NjtcclxuICAgIGxhc3RSZXR1cm5DU1Jlc3VsdCA9IG51bGw7XHJcbiAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgIC8vIOi/meS4pOS4quaYr1B1ZXJ0c+eUqOeahOeahOecn+ato+eahENTaGFycOWHveaVsOaMh+mSiFxyXG4gICAgR2V0SlNBcmd1bWVudHNDYWxsYmFjaztcclxuICAgIGdlbmVyYWxEZXN0cnVjdG9yO1xyXG4gICAgY29uc3RydWN0b3IoY3RvclBhcmFtKSB7XHJcbiAgICAgICAgdGhpcy5jc2hhcnBPYmplY3RNYXAgPSBuZXcgQ1NoYXJwT2JqZWN0TWFwKCk7XHJcbiAgICAgICAgdGhpcy5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIgPSBuZXcgRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyKHRoaXMpO1xyXG4gICAgICAgIGNvbnN0IHsgVVRGOFRvU3RyaW5nLCBfbWFsbG9jLCBfZnJlZSwgX3NldFRlbXBSZXQwLCBzdHJpbmdUb1VURjgsIGxlbmd0aEJ5dGVzVVRGOCwgc3RhY2tTYXZlLCBzdGFja1Jlc3RvcmUsIHN0YWNrQWxsb2MsIF9DYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjaywgX0NhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrLCBfQ2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjaywgSEVBUDgsIEhFQVBVOCwgSEVBUDMyLCBIRUFQRjMyLCBIRUFQRjY0LCB9ID0gY3RvclBhcmFtO1xyXG4gICAgICAgIHRoaXMuc3RyQnVmZmVyID0gX21hbGxvYyh0aGlzLnN0cmluZ0J1ZmZlclNpemUpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkgPSB7XHJcbiAgICAgICAgICAgIFVURjhUb1N0cmluZyxcclxuICAgICAgICAgICAgX21hbGxvYyxcclxuICAgICAgICAgICAgX2ZyZWUsXHJcbiAgICAgICAgICAgIF9zZXRUZW1wUmV0MCxcclxuICAgICAgICAgICAgc3RyaW5nVG9VVEY4LFxyXG4gICAgICAgICAgICBsZW5ndGhCeXRlc1VURjgsXHJcbiAgICAgICAgICAgIHN0YWNrU2F2ZSxcclxuICAgICAgICAgICAgc3RhY2tSZXN0b3JlLFxyXG4gICAgICAgICAgICBzdGFja0FsbG9jLFxyXG4gICAgICAgICAgICBfQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIF9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayxcclxuICAgICAgICAgICAgX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIEhFQVA4LFxyXG4gICAgICAgICAgICBIRUFQVTgsXHJcbiAgICAgICAgICAgIEhFQVAzMixcclxuICAgICAgICAgICAgSEVBUEYzMixcclxuICAgICAgICAgICAgSEVBUEY2NCxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGdsb2JhbC5fX3RnanNFdmFsU2NyaXB0ID0gdHlwZW9mIGV2YWwgPT0gXCJ1bmRlZmluZWRcIiA/ICgpID0+IHsgfSA6IGV2YWw7XHJcbiAgICAgICAgZ2xvYmFsLl9fdGdqc1NldFByb21pc2VSZWplY3RDYWxsYmFjayA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICB3eC5vblVuaGFuZGxlZFJlamVjdGlvbihjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVuaGFuZGxlZHJlamVjdGlvblwiLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIGdsb2JhbC5fX3B1ZXJ0c0dldExhc3RFeGNlcHRpb24gPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhc3RFeGNlcHRpb247XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIC8qKiBjYWxsIHdoZW4gd2FzbSBncm93IG1lbW9yeSAqL1xyXG4gICAgdXBkYXRlR2xvYmFsQnVmZmVyQW5kVmlld3MoSEVBUDgsIEhFQVBVOCwgSEVBUDMyLCBIRUFQRjMyLCBIRUFQRjY0KSB7XHJcbiAgICAgICAgbGV0IHVuaXR5QXBpID0gdGhpcy51bml0eUFwaTtcclxuICAgICAgICB1bml0eUFwaS5IRUFQOCA9IEhFQVA4O1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVBVOCA9IEhFQVBVODtcclxuICAgICAgICB1bml0eUFwaS5IRUFQMzIgPSBIRUFQMzI7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUEYzMiA9IEhFQVBGMzI7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUEY2NCA9IEhFQVBGNjQ7XHJcbiAgICB9XHJcbiAgICBtZW1jcHkoZGVzdCwgc3JjLCBudW0pIHtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLkhFQVBVOC5jb3B5V2l0aGluKGRlc3QsIHNyYywgc3JjICsgbnVtKTtcclxuICAgIH1cclxuICAgIEpTU3RyaW5nVG9DU1N0cmluZyhyZXR1cm5TdHIsIC8qKiBvdXQgaW50ICovIGxlbmd0aE9mZnNldCkge1xyXG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xyXG4gICAgICAgIHNldE91dFZhbHVlMzIodGhpcywgbGVuZ3RoT2Zmc2V0LCBieXRlQ291bnQpO1xyXG4gICAgICAgIGxldCBidWZmZXIgPSB0aGlzLnVuaXR5QXBpLl9tYWxsb2MoYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5zdHJpbmdUb1VURjgocmV0dXJuU3RyLCBidWZmZXIsIGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICB9XHJcbiAgICBKU1N0cmluZ1RvVGVtcENTU3RyaW5nKHJldHVyblN0ciwgLyoqIG91dCBpbnQgKi8gbGVuZ3RoT2Zmc2V0KSB7XHJcbiAgICAgICAgaWYgKHJldHVyblN0ciA9PT0gbnVsbCB8fCByZXR1cm5TdHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGJ5dGVDb3VudCA9IHRoaXMudW5pdHlBcGkubGVuZ3RoQnl0ZXNVVEY4KHJldHVyblN0cik7XHJcbiAgICAgICAgc2V0T3V0VmFsdWUzMih0aGlzLCBsZW5ndGhPZmZzZXQsIGJ5dGVDb3VudCk7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSA8IGJ5dGVDb3VudCArIDEpIHtcclxuICAgICAgICAgICAgdGhpcy51bml0eUFwaS5fZnJlZSh0aGlzLnN0ckJ1ZmZlcik7XHJcbiAgICAgICAgICAgIHRoaXMuc3RyQnVmZmVyID0gdGhpcy51bml0eUFwaS5fbWFsbG9jKHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSA9IE1hdGgubWF4KDIgKiB0aGlzLnN0cmluZ0J1ZmZlclNpemUsIGJ5dGVDb3VudCArIDEpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5zdHJpbmdUb1VURjgocmV0dXJuU3RyLCB0aGlzLnN0ckJ1ZmZlciwgYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyQnVmZmVyO1xyXG4gICAgfVxyXG4gICAgSlNTdHJpbmdUb0NTU3RyaW5nT25TdGFjayhyZXR1cm5TdHIsIC8qKiBvdXQgaW50ICovIGxlbmd0aE9mZnNldCkge1xyXG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xyXG4gICAgICAgIHNldE91dFZhbHVlMzIodGhpcywgbGVuZ3RoT2Zmc2V0LCBieXRlQ291bnQpO1xyXG4gICAgICAgIHZhciBidWZmZXIgPSB0aGlzLnVuaXR5QXBpLnN0YWNrQWxsb2MoYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5zdHJpbmdUb1VURjgocmV0dXJuU3RyLCBidWZmZXIsIGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICB9XHJcbiAgICBtYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBmdW5jdGlvblB0ciwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICAvLyDkuI3og73nlKjnrq3lpLTlh73mlbDvvIHmraTlpITov5Tlm57nmoTlh73mlbDkvJrotYvlgLzliLDlhbfkvZPnmoRjbGFzc+S4iu+8jOWFtnRoaXPmjIfpkojmnInlkKvkuYnjgIJcclxuICAgICAgICBjb25zdCBlbmdpbmUgPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xyXG4gICAgICAgICAgICBsZXQgY2FsbGJhY2tJbmZvUHRyID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRNb2NrUG9pbnRlcihhcmdzKTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5jYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgXHJcbiAgICAgICAgICAgICAgICAvLyBnZXRJbnRQdHJNYW5hZ2VyKCkuR2V0UG9pbnRlckZvckpTVmFsdWUodGhpcyksXHJcbiAgICAgICAgICAgICAgICBpc1N0YXRpYyA/IDAgOiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodGhpcyksIGNhbGxiYWNrSW5mb1B0ciwgYXJncy5sZW5ndGgsIGNhbGxiYWNrSWR4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldFJldHVyblZhbHVlQW5kUmVjeWNsZShjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLlJlbGVhc2VCeU1vY2tJbnRQdHIoY2FsbGJhY2tJbmZvUHRyKTtcclxuICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBzZWxmUHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVuaXR5QXBpLl9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxuICAgIGNhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5fQ2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBQdWVydHNKU0VuZ2luZTtcclxuZnVuY3Rpb24gR2V0VHlwZShlbmdpbmUsIHZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG4gICAgaWYgKGlzQmlnSW50KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAyO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHJldHVybiA0O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJldHVybiA4O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuICAgICAgICByZXR1cm4gMTY7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gMjU2O1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xyXG4gICAgICAgIHJldHVybiA1MTI7XHJcbiAgICB9XHJcbiAgICAvLyBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkgeyByZXR1cm4gMTI4IH1cclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgcmV0dXJuIDY0O1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgdmFsdWUgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbiAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICB9XHJcbiAgICBpZiAoZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAzMjtcclxuICAgIH1cclxuICAgIHJldHVybiA2NDtcclxufVxyXG5leHBvcnRzLkdldFR5cGUgPSBHZXRUeXBlO1xyXG5mdW5jdGlvbiBtYWtlQmlnSW50KGxvdywgaGlnaCkge1xyXG4gICAgcmV0dXJuIChCaWdJbnQoaGlnaCkgPDwgMzJuKSB8IEJpZ0ludChsb3cgPj4+IDApO1xyXG59XHJcbmV4cG9ydHMubWFrZUJpZ0ludCA9IG1ha2VCaWdJbnQ7XHJcbmZ1bmN0aW9uIHNldE91dFZhbHVlMzIoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbdmFsdWVQdHIgPj4gMl0gPSB2YWx1ZTtcclxufVxyXG5leHBvcnRzLnNldE91dFZhbHVlMzIgPSBzZXRPdXRWYWx1ZTMyO1xyXG5mdW5jdGlvbiBzZXRPdXRWYWx1ZTgoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOFt2YWx1ZVB0cl0gPSB2YWx1ZTtcclxufVxyXG5leHBvcnRzLnNldE91dFZhbHVlOCA9IHNldE91dFZhbHVlODtcclxuZnVuY3Rpb24gaXNCaWdJbnQodmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIEJpZ0ludCB8fCB0eXBlb2YgdmFsdWUgPT09ICdiaWdpbnQnO1xyXG59XHJcbmV4cG9ydHMuaXNCaWdJbnQgPSBpc0JpZ0ludDtcclxuZnVuY3Rpb24gcmV0dXJuQmlnSW50KGVuZ2luZSwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5fc2V0VGVtcFJldDAoTnVtYmVyKHZhbHVlID4+IDMybikpOyAvLyBoaWdoXHJcbiAgICByZXR1cm4gTnVtYmVyKHZhbHVlICYgMHhmZmZmZmZmZm4pOyAvLyBsb3dcclxufVxyXG5leHBvcnRzLnJldHVybkJpZ0ludCA9IHJldHVybkJpZ0ludDtcclxuZnVuY3Rpb24gd3JpdGVCaWdJbnQoZW5naW5lLCBwdHJJbjMyLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXSA9IE51bWJlcih2YWx1ZSAmIDB4ZmZmZmZmZmZuKTsgLy8gbG93XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzIgKyAxXSA9IE51bWJlcih2YWx1ZSA+PiAzMm4pOyAvLyBoaWdoXHJcbn1cclxuY29uc3QgdG1wSW50M0FyciA9IG5ldyBJbnQzMkFycmF5KDIpO1xyXG5jb25zdCB0bXBGbG9hdDY0QXJyID0gbmV3IEZsb2F0NjRBcnJheSh0bXBJbnQzQXJyLmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHdyaXRlTnVtYmVyKGVuZ2luZSwgcHRySW4zMiwgdmFsdWUpIHtcclxuICAgIC8vIG51bWJlciBpbiBqcyBpcyBkb3VibGVcclxuICAgIHRtcEZsb2F0NjRBcnJbMF0gPSB2YWx1ZTtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMl0gPSB0bXBJbnQzQXJyWzBdO1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyICsgMV0gPSB0bXBJbnQzQXJyWzFdO1xyXG59XHJcbmZ1bmN0aW9uICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKGVuZ2luZSwgdmFsLCBqc1ZhbHVlVHlwZSwgdmFsUHRySW4zMikge1xyXG4gICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHN3aXRjaCAoanNWYWx1ZVR5cGUpIHtcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgIHdyaXRlQmlnSW50KGVuZ2luZSwgdmFsUHRySW4zMiwgdmFsKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA0OlxyXG4gICAgICAgICAgICB3cml0ZU51bWJlcihlbmdpbmUsIHZhbFB0ckluMzIsICt2YWwpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDUxMjpcclxuICAgICAgICAgICAgd3JpdGVOdW1iZXIoZW5naW5lLCB2YWxQdHJJbjMyLCB2YWwuZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gJEdldEFyZ3VtZW50RmluYWxWYWx1ZShlbmdpbmUsIHZhbCwganNWYWx1ZVR5cGUsIGxlbmd0aE9mZnNldCkge1xyXG4gICAgaWYgKCFqc1ZhbHVlVHlwZSlcclxuICAgICAgICBqc1ZhbHVlVHlwZSA9IEdldFR5cGUoZW5naW5lLCB2YWwpO1xyXG4gICAgc3dpdGNoIChqc1ZhbHVlVHlwZSkge1xyXG4gICAgICAgIGNhc2UgODogcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmdPblN0YWNrKHZhbCwgbGVuZ3RoT2Zmc2V0KTtcclxuICAgICAgICBjYXNlIDE2OiByZXR1cm4gK3ZhbDtcclxuICAgICAgICBjYXNlIDMyOiByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHZhbCk7XHJcbiAgICAgICAgY2FzZSA2NDogcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdCh2YWwpLmlkO1xyXG4gICAgICAgIGNhc2UgMTI4OiByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KHZhbCkuaWQ7XHJcbiAgICAgICAgY2FzZSAyNTY6IHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbih2YWwpLmlkO1xyXG4gICAgICAgIGNhc2UgMTAyNDoge1xyXG4gICAgICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpXHJcbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgVWludDhBcnJheSh2YWwpO1xyXG4gICAgICAgICAgICBsZXQgcHRyID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2ModmFsLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUFU4LnNldCh2YWwsIHB0cik7XHJcbiAgICAgICAgICAgIHNldE91dFZhbHVlMzIoZW5naW5lLCBsZW5ndGhPZmZzZXQsIHZhbC5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHB0cjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGlicmFyeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldE51bWJlckZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogbnVtYmVyIHtcclxuLy8gICAgIHJldHVybiBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXREYXRlRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBudW1iZXIge1xyXG4vLyAgICAgcmV0dXJuIChlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpIGFzIERhdGUpLmdldFRpbWUoKTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0U3RyaW5nRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIC8qb3V0IGludCAqL2xlbmd0aE9mZnNldDogbnVtYmVyLCBpc0J5UmVmOiBib29sKTogbnVtYmVyIHtcclxuLy8gICAgIHZhciByZXR1cm5TdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8c3RyaW5nPih2YWx1ZSk7XHJcbi8vICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhyZXR1cm5TdHIsIGxlbmd0aE9mZnNldCk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEJvb2xlYW5Gcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IGJvb2xlYW4ge1xyXG4vLyAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIFZhbHVlSXNCaWdJbnQoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IGJvb2xlYW4ge1xyXG4vLyAgICAgdmFyIGJpZ2ludCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxhbnk+KHZhbHVlKTtcclxuLy8gICAgIHJldHVybiBiaWdpbnQgaW5zdGFuY2VvZiBCaWdJbnQ7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEJpZ0ludEZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XHJcbi8vICAgICB2YXIgYmlnaW50ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPGFueT4odmFsdWUpO1xyXG4vLyAgICAgcmV0dXJuIGJpZ2ludDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0T2JqZWN0RnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcclxuLy8gICAgIHZhciBuYXRpdmVPYmplY3QgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4vLyAgICAgcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChuYXRpdmVPYmplY3QpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRGdW5jdGlvbkZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogSlNGdW5jdGlvblB0ciB7XHJcbi8vICAgICB2YXIgZnVuYyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjwoLi4uYXJnczogYW55W10pID0+IGFueT4odmFsdWUpO1xyXG4vLyAgICAgdmFyIGpzZnVuYyA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmMpO1xyXG4vLyAgICAgcmV0dXJuIGpzZnVuYy5pZDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0SlNPYmplY3RGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4vLyAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjwoLi4uYXJnczogYW55W10pID0+IGFueT4odmFsdWUpO1xyXG4vLyAgICAgdmFyIGpzb2JqID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KG9iaik7XHJcbi8vICAgICByZXR1cm4ganNvYmouaWQ7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEFycmF5QnVmZmVyRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIC8qb3V0IGludCAqL2xlbmd0aE9mZnNldDogYW55LCBpc091dDogYm9vbCkge1xyXG4vLyAgICAgdmFyIGFiID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPEFycmF5QnVmZmVyPih2YWx1ZSk7XHJcbi8vICAgICBpZiAoYWIgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbi8vICAgICAgICAgYWIgPSBhYi5idWZmZXI7XHJcbi8vICAgICB9XHJcbi8vICAgICB2YXIgcHRyID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoYWIuYnl0ZUxlbmd0aCk7XHJcbi8vICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDguc2V0KG5ldyBJbnQ4QXJyYXkoYWIpLCBwdHIpO1xyXG4vLyAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltsZW5ndGhPZmZzZXQgPj4gMl0gPSBhYi5ieXRlTGVuZ3RoO1xyXG4vLyAgICAgc2V0T3V0VmFsdWUzMihlbmdpbmUsIGxlbmd0aE9mZnNldCwgYWIuYnl0ZUxlbmd0aCk7XHJcbi8vICAgICByZXR1cm4gcHRyO1xyXG4vLyB9XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPkvqfojrflj5ZKU+iwg+eUqOWPguaVsOeahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgLyoqKioqKioqKioq6L+Z6YOo5YiG546w5Zyo6YO95pivQysr5a6e546w55qEKioqKioqKioqKioqL1xyXG4gICAgICAgIC8vIEdldE51bWJlckZyb21WYWx1ZTogR2V0TnVtYmVyRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXREYXRlRnJvbVZhbHVlOiBHZXREYXRlRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRTdHJpbmdGcm9tVmFsdWU6IEdldFN0cmluZ0Zyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0Qm9vbGVhbkZyb21WYWx1ZTogR2V0Qm9vbGVhbkZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gVmFsdWVJc0JpZ0ludDogVmFsdWVJc0JpZ0ludC5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0QmlnSW50RnJvbVZhbHVlOiBHZXRCaWdJbnRGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldE9iamVjdEZyb21WYWx1ZTogR2V0T2JqZWN0RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRGdW5jdGlvbkZyb21WYWx1ZTogR2V0RnVuY3Rpb25Gcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEpTT2JqZWN0RnJvbVZhbHVlOiBHZXRKU09iamVjdEZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWU6IEdldEFycmF5QnVmZmVyRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRBcmd1bWVudFR5cGU6IGZ1bmN0aW9uIChpc29sYXRlOiBJbnRQdHIsIGluZm86IE1vY2tJbnRQdHIsIGluZGV4OiBpbnQsIGlzQnlSZWY6IGJvb2wpIHtcclxuICAgICAgICAvLyAgICAgdmFyIHZhbHVlID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbywgZW5naW5lKS5hcmdzW2luZGV4XTtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIEdldFR5cGUoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgLy8gfSxcclxuICAgICAgICAvLyAvKipcclxuICAgICAgICAvLyAgKiDkuLpjI+S+p+aPkOS+m+S4gOS4quiOt+WPlmNhbGxiYWNraW5mb+mHjGpzdmFsdWXnmoRpbnRwdHLnmoTmjqXlj6NcclxuICAgICAgICAvLyAgKiDlubbkuI3mmK/lvpfnmoTliLDov5nkuKphcmd1bWVudOeahOWAvFxyXG4gICAgICAgIC8vICAqXHJcbiAgICAgICAgLy8gICog6K+l5o6l5Y+j5Y+q5pyJ5L2N6L+Q566X77yM55SxQysr5a6e546wXHJcbiAgICAgICAgLy8gICovXHJcbiAgICAgICAgLy8gR2V0QXJndW1lbnRWYWx1ZS8qaW5DYWxsYmFja0luZm8qLzogZnVuY3Rpb24gKGluZm9wdHI6IE1vY2tJbnRQdHIsIGluZGV4OiBpbnQpIHtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIGluZm9wdHIgfCBpbmRleDtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIC8vIEdldEpzVmFsdWVUeXBlOiBmdW5jdGlvbiAoaXNvbGF0ZTogSW50UHRyLCB2YWw6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcclxuICAgICAgICAvLyAgICAgLy8gcHVibGljIGVudW0gSnNWYWx1ZVR5cGVcclxuICAgICAgICAvLyAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICAvLyAgICAgTnVsbE9yVW5kZWZpbmVkID0gMSxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEJpZ0ludCA9IDIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBOdW1iZXIgPSA0LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgU3RyaW5nID0gOCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEJvb2xlYW4gPSAxNixcclxuICAgICAgICAvLyAgICAgLy8gICAgIE5hdGl2ZU9iamVjdCA9IDMyLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgSnNPYmplY3QgPSA2NCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEFycmF5ID0gMTI4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgRnVuY3Rpb24gPSAyNTYsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBEYXRlID0gNTEyLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQXJyYXlCdWZmZXIgPSAxMDI0LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgVW5rbm93ID0gMjA0OCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEFueSA9IE51bGxPclVuZGVmaW5lZCB8IEJpZ0ludCB8IE51bWJlciB8IFN0cmluZyB8IEJvb2xlYW4gfCBOYXRpdmVPYmplY3QgfCBBcnJheSB8IEZ1bmN0aW9uIHwgRGF0ZSB8IEFycmF5QnVmZmVyLFxyXG4gICAgICAgIC8vICAgICAvLyB9O1xyXG4gICAgICAgIC8vICAgICB2YXIgdmFsdWU6IGFueSA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbCwgZW5naW5lKTtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIEdldFR5cGUoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgLy8gfSxcclxuICAgICAgICAvKioqKioqKioqKirku6XkuIrnjrDlnKjpg73mmK9DKyvlrp7njrDnmoQqKioqKioqKioqKiovXHJcbiAgICAgICAgR2V0VHlwZUlkRnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIGlmIChpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICBvYmogPSBvYmpbMF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHR5cGVpZCA9IDA7XHJcbiAgICAgICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gb2JqLl9mdW5jW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IG9ialtcIiRjaWRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0eXBlaWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVpZDtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2V0RnJvbUpTQXJndW1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBDI+iwg+eUqEpT5pe277yM6I635Y+WSlPlh73mlbDov5Tlm57lgLxcclxuICpcclxuICog5Y6f5pyJ55qEcmVzdWx0SW5mb+iuvuiuoeWHuuadpeWPquaYr+S4uuS6huiuqeWkmmlzb2xhdGXml7bog73lnKjkuI3lkIznmoRpc29sYXRl6YeM5L+d5oyB5LiN5ZCM55qEcmVzdWx0XHJcbiAqIOWcqFdlYkdM5qih5byP5LiL5rKh5pyJ6L+Z5Liq54Om5oG877yM5Zug5q2k55u05o6l55SoZW5naW5l55qE5Y2z5Y+vXHJcbiAqIHJlc3VsdEluZm/lm7rlrprkuLoxMDI0XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgR2V0TnVtYmVyRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXREYXRlRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQuZ2V0VGltZSgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0U3RyaW5nRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvVGVtcENTU3RyaW5nKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQsIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRCb29sZWFuRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXN1bHRJc0JpZ0ludDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuaXNCaWdJbnQpKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0QmlnSW50RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgLy8gcHVlcnRzIGNvcmUgdjIuMC405byA5aeL5pSv5oyBXHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgbGlicmFyeV8xLnJldHVybkJpZ0ludCkoZW5naW5lLCBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldE9iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRUeXBlSWRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgICAgICB2YXIgdHlwZWlkID0gMDtcclxuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IHZhbHVlLl9mdW5jW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IHZhbHVlW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZmluZCB0eXBlaWQgZm9yJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0RnVuY3Rpb25Gcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0SlNPYmplY3RGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIganNvYmogPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgICAgICByZXR1cm4ganNvYmouaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRBcnJheUJ1ZmZlckZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvLCAvKm91dCBpbnQgKi8gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBhYiA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4LnNldChuZXcgSW50OEFycmF5KGFiKSwgcHRyKTtcclxuICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5zZXRPdXRWYWx1ZTMyKShlbmdpbmUsIGxlbmd0aCwgYWIuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBwdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvL+S/neWuiOaWueahiFxyXG4gICAgICAgIEdldFJlc3VsdFR5cGU6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgbGlicmFyeV8xLkdldFR5cGUpKGVuZ2luZSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2V0RnJvbUpTUmV0dXJuLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICog5rOo5YaM57G7QVBJ77yM5aaC5rOo5YaM5YWo5bGA5Ye95pWw44CB5rOo5YaM57G777yM5Lul5Y+K57G755qE5bGe5oCn5pa55rOV562JXHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFJlZ2lzdGVyQVBJKGVuZ2luZSkge1xyXG4gICAgY29uc3QgcmV0dXJuZWUgPSB7XHJcbiAgICAgICAgU2V0R2xvYmFsRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBuYW1lU3RyaW5nLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIGpzRW52SWR4LCBjYWxsYmFja2lkeCkge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgbGlicmFyeV8xLmdsb2JhbFtuYW1lXSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKHRydWUsIHY4RnVuY3Rpb25DYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX1JlZ2lzdGVyQ2xhc3M6IGZ1bmN0aW9uIChpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIGpzRW52SWR4LCBjYWxsYmFja2lkeCwgc2l6ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBmdWxsTmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoZnVsbE5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICBjb25zdCBjc2hhcnBPYmplY3RNYXAgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwO1xyXG4gICAgICAgICAgICBjb25zdCBpZCA9IGNzaGFycE9iamVjdE1hcC5jbGFzc2VzLmxlbmd0aDtcclxuICAgICAgICAgICAgbGV0IHRlbXBFeHRlcm5hbENTSUQgPSAwO1xyXG4gICAgICAgICAgICBjb25zdCBjdG9yID0gZnVuY3Rpb24gTmF0aXZlT2JqZWN0KCkge1xyXG4gICAgICAgICAgICAgICAgLy8g6K6+572u57G75Z6LSURcclxuICAgICAgICAgICAgICAgIHRoaXNbXCIkY2lkXCJdID0gaWQ7XHJcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmVPYmplY3TnmoTmnoTpgKDlh73mlbBcclxuICAgICAgICAgICAgICAgIC8vIOaehOmAoOWHveaVsOacieS4pOS4quiwg+eUqOeahOWcsOaWue+8mjEuIGpz5L6nbmV35LiA5Liq5a6D55qE5pe25YCZIDIuIGNz5L6n5Yib5bu65LqG5LiA5Liq5a+56LGh6KaB5Lyg5YiwanPkvqfml7ZcclxuICAgICAgICAgICAgICAgIC8vIOesrOS4gOS4quaDheWGte+8jGNz5a+56LGhSUTmiJbogIXmmK9jYWxsVjhDb25zdHJ1Y3RvckNhbGxiYWNr6L+U5Zue55qE44CCXHJcbiAgICAgICAgICAgICAgICAvLyDnrKzkuozkuKrmg4XlhrXvvIzliJljc+WvueixoUlE5pivY3MgbmV35a6M5LmL5ZCO5LiA5bm25Lyg57uZanPnmoTjgIJcclxuICAgICAgICAgICAgICAgIGxldCBjc0lEID0gdGVtcEV4dGVybmFsQ1NJRDsgLy8g5aaC5p6c5piv56ys5LqM5Liq5oOF5Ya177yM5q2kSUTnlLFjcmVhdGVGcm9tQ1Porr7nva5cclxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNzSUQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFja0luZm9QdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOiZveeEtnB1ZXJ0c+WGhUNvbnN0cnVjdG9y55qE6L+U5Zue5YC85Y+rc2VsZu+8jOS9huWug+WFtuWunuWwseaYr0NT5a+56LGh55qE5LiA5LiqaWTogIzlt7LjgIJcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc0lEID0gZW5naW5lLmNhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGNvbnN0cnVjdG9yLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLlJlbGVhc2VCeU1vY2tJbnRQdHIoY2FsbGJhY2tJbmZvUHRyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIGJsaXR0YWJsZVxyXG4gICAgICAgICAgICAgICAgaWYgKHNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY3NOZXdJRCA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKHNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5tZW1jcHkoY3NOZXdJRCwgY3NJRCwgc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc05ld0lELCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzTmV3SUQsIChjc0lkZW50aWZpZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLnJlbW92ZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuX2ZyZWUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5hZGQoY3NJRCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5PbkZpbmFsaXplKSh0aGlzLCBjc0lELCAoY3NJZGVudGlmaWVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5yZW1vdmUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmNhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2soZGVzdHJ1Y3RvciB8fCBlbmdpbmUuZ2VuZXJhbERlc3RydWN0b3IsIGNzSWRlbnRpZmllciwgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjdG9yLmNyZWF0ZUZyb21DUyA9IGZ1bmN0aW9uIChjc0lEKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wRXh0ZXJuYWxDU0lEID0gY3NJRDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY3RvcigpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjdG9yLl9fcHVlcnRzTWV0YWRhdGEgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBcIm5hbWVcIiwgeyB2YWx1ZTogZnVsbE5hbWUgKyBcIkNvbnN0cnVjdG9yXCIgfSk7XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBcIiRjaWRcIiwgeyB2YWx1ZTogaWQgfSk7XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5jbGFzc2VzLnB1c2goY3Rvcik7XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5jbGFzc0lEV2Vha01hcC5zZXQoY3RvciwgaWQpO1xyXG4gICAgICAgICAgICBpZiAoQmFzZVR5cGVJZCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGN0b3IucHJvdG90eXBlLl9fcHJvdG9fXyA9IGNzaGFycE9iamVjdE1hcC5jbGFzc2VzW0Jhc2VUeXBlSWRdLnByb3RvdHlwZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAubmFtZXNUb0NsYXNzZXNJRFtmdWxsTmFtZV0gPSBpZDtcclxuICAgICAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJTdHJ1Y3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIC8qbG9uZyAqLyBqc0VudklkeCwgY2FsbGJhY2tpZHgsIHNpemUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldHVybmVlLl9SZWdpc3RlckNsYXNzKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwgY2FsbGJhY2tpZHgsIGNhbGxiYWNraWR4LCBzaXplKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlZ2lzdGVyRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBjbGFzc0lELCBuYW1lU3RyaW5nLCBpc1N0YXRpYywgY2FsbGJhY2ssIC8qbG9uZyAqLyBqc0VudklkeCwgY2FsbGJhY2tpZHgpIHtcclxuICAgICAgICAgICAgdmFyIGNscyA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcclxuICAgICAgICAgICAgaWYgKCFjbHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgZm4gPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgY2FsbGJhY2ssIGNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgY2xzW25hbWVdID0gZm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjbHMucHJvdG90eXBlW25hbWVdID0gZm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlZ2lzdGVyUHJvcGVydHk6IGZ1bmN0aW9uIChpc29sYXRlLCBjbGFzc0lELCBuYW1lU3RyaW5nLCBpc1N0YXRpYywgZ2V0dGVyLCBcclxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyanNFbnZJZHgsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBnZXR0ZXJjYWxsYmFja2lkeCwgc2V0dGVyLCBcclxuICAgICAgICAvKmxvbmcgKi8gc2V0dGVyanNFbnZJZHgsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJjYWxsYmFja2lkeCwgZG9udERlbGV0ZSkge1xyXG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgICAgICBpZiAoIWNscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgYXR0ciA9IHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogIWRvbnREZWxldGUsXHJcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBhdHRyLmdldCA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBnZXR0ZXIsIGdldHRlcmNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgaWYgKHNldHRlcikge1xyXG4gICAgICAgICAgICAgICAgYXR0ci5zZXQgPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgc2V0dGVyLCBzZXR0ZXJjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xzLCBuYW1lLCBhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbHMucHJvdG90eXBlLCBuYW1lLCBhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIHJldHVybmVlO1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFJlZ2lzdGVyQVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1yZWdpc3Rlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEMj6LCD55SoSlPml7bvvIzorr7nva7osIPnlKjlj4LmlbDnmoTlgLxcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9JbnZva2VKU0FyZ3VtZW50QXBpKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAvL2JlZ2luIGNzIGNhbGwganNcclxuICAgICAgICBQdXNoTnVsbEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKG51bGwpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaERhdGVGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBkYXRlVmFsdWUpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKG5ldyBEYXRlKGRhdGVWYWx1ZSkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEJvb2xlYW5Gb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaCghIWIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEJpZ0ludEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qbG9uZyAqLyBsb25nbG93LCBsb25naGlnaCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb25nbG93LCBsb25naGlnaCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaFN0cmluZ0ZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIHN0clN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hOdW1iZXJGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChkKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hPYmplY3RGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBjbGFzc0lELCBvYmplY3RJRCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qob2JqZWN0SUQsIGNsYXNzSUQpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hKU0Z1bmN0aW9uRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoSlNGdW5jdGlvbikuX2Z1bmMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEpTT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNPYmplY3QpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTT2JqZWN0QnlJZChKU09iamVjdCkuZ2V0T2JqZWN0KCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEFycmF5QnVmZmVyRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypieXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSW52b2tlSlNBcmd1bWVudEFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9JbnZva2VKU0FyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogSlPosIPnlKhDI+aXtu+8jEMj6K6+572u6L+U5Zue5YiwSlPnmoTlgLxcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9KU0ludm9rZVJldHVybkFwaShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgUmV0dXJuQ2xhc3M6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBjbGFzc0lEKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybk9iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGNsYXNzSUQsIHNlbGYpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qoc2VsZiwgY2xhc3NJRCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5OdW1iZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBudW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbnVtYmVyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuU3RyaW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgc3RyU3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKTtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gc3RyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQmlnSW50OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgbG9uZ0xvdywgbG9uZ0hpZ2gpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb25nTG93LCBsb25nSGlnaCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5Cb29sZWFuOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgYikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSAhIWI7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5EYXRlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgZGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBuZXcgRGF0ZShkYXRlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybk51bGw6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG51bGw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5GdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIEpTRnVuY3Rpb25QdHIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY29uc3QganNGdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoSlNGdW5jdGlvblB0cik7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGpzRnVuYy5fZnVuYztcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkpTT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgSlNPYmplY3RQdHIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY29uc3QganNPYmplY3QgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU09iamVjdEJ5SWQoSlNPYmplY3RQdHIpO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBqc09iamVjdC5nZXRPYmplY3QoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkNTaGFycEZ1bmN0aW9uQ2FsbGJhY2s6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVyTG93LCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckhpZ2gpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oZmFsc2UsIHY4RnVuY3Rpb25DYWxsYmFjaywgcG9pbnRlckhpZ2gpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQ1NoYXJwRnVuY3Rpb25DYWxsYmFjazI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIEpzRnVuY3Rpb25GaW5hbGl6ZSwgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJMb3csIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVySGlnaCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihmYWxzZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBwb2ludGVySGlnaCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5BcnJheUJ1ZmZlcjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIC8qYnl0ZVtdICovIGluZGV4LCBsZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSlNJbnZva2VSZXR1cm5BcGk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSlNJbnZva2VSZXR1cm4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPkvqforr7nva5vdXTlj4LmlbDlgLxcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9KU091dEFyZ3VtZW50QVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBTZXROdW1iZXJUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gbnVtYmVyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0RGF0ZVRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgZGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRTdHJpbmdUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIHN0clN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCBzdHIgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZyk7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBzdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRCb29sZWFuVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBiKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSAhIWI7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRCaWdJbnRUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGxvdywgaGlnaCkge1xyXG4gICAgICAgICAgICBjb25zdCBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSAoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvdywgaGlnaCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRPYmplY3RUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGNsYXNzSUQsIHNlbGYpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KHNlbGYsIGNsYXNzSUQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0TnVsbFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gbnVsbDsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldEFycmF5QnVmZmVyVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCAvKkJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9KU091dEFyZ3VtZW50QVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0pTT3V0QXJndW1lbnQuanMubWFwIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuLyoqXHJcbiAqIOagueaNriBodHRwczovL2RvY3MudW5pdHkzZC5jb20vMjAxOC40L0RvY3VtZW50YXRpb24vTWFudWFsL3dlYmdsLWludGVyYWN0aW5nd2l0aGJyb3dzZXJzY3JpcHRpbmcuaHRtbFxyXG4gKiDmiJHku6znmoTnm67nmoTlsLHmmK/lnKhXZWJHTOaooeW8j+S4i++8jOWunueOsOWSjHB1ZXJ0cy5kbGznmoTmlYjmnpzjgILlhbfkvZPlnKjkuo7lrp7njrDkuIDkuKpqc2xpYu+8jOmHjOmdouW6lOWMheWQq1B1ZXJ0c0RMTC5jc+eahOaJgOacieaOpeWPo1xyXG4gKiDlrp7pqozlj5HnjrDov5nkuKpqc2xpYuiZveeEtuS5n+aYr+i/kOihjOWcqHY455qEanPvvIzkvYblr7lkZXZ0b29s6LCD6K+V5bm25LiN5Y+L5aW977yM5LiU5Y+q5pSv5oyB5YiwZXM144CCXHJcbiAqIOWboOatpOW6lOivpemAmui/h+S4gOS4queLrOeri+eahGpz5a6e546w5o6l5Y+j77yMcHVlcnRzLmpzbGli6YCa6L+H5YWo5bGA55qE5pa55byP6LCD55So5a6D44CCXHJcbiAqXHJcbiAqIOacgOe7iOW9ouaIkOWmguS4i+aetuaehFxyXG4gKiDkuJrliqFKUyA8LT4gV0FTTSA8LT4gdW5pdHkganNsaWIgPC0+IOacrGpzXHJcbiAqIOS9huaVtOadoemTvui3r+WFtuWunumDveWcqOS4gOS4qnY4KGpzY29yZSnomZrmi5/mnLrph4xcclxuICovXHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuL2xpYnJhcnlcIik7XHJcbmNvbnN0IGdldEZyb21KU0FyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvZ2V0RnJvbUpTQXJndW1lbnRcIik7XHJcbmNvbnN0IGdldEZyb21KU1JldHVybl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL2dldEZyb21KU1JldHVyblwiKTtcclxuY29uc3QgcmVnaXN0ZXJfMSA9IHJlcXVpcmUoXCIuL21peGlucy9yZWdpc3RlclwiKTtcclxuY29uc3Qgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9JbnZva2VKU0FyZ3VtZW50XCIpO1xyXG5jb25zdCBzZXRUb0pTSW52b2tlUmV0dXJuXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9KU0ludm9rZVJldHVyblwiKTtcclxuY29uc3Qgc2V0VG9KU091dEFyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9KU091dEFyZ3VtZW50XCIpO1xyXG5saWJyYXJ5XzEuZ2xvYmFsLnd4UmVxdWlyZSA9IGxpYnJhcnlfMS5nbG9iYWwucmVxdWlyZTtcclxubGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IHtcclxuICAgIGluaXRlZDogZmFsc2UsXHJcbiAgICBkZWJ1ZzogZmFsc2UsXHJcbiAgICAvLyBwdWVydHPpppbmrKHliJ3lp4vljJbml7bkvJrosIPnlKjov5nph4zvvIzlubbmiopVbml0eeeahOmAmuS/oeaOpeWPo+S8oOWFpVxyXG4gICAgSW5pdChjdG9yUGFyYW0pIHtcclxuICAgICAgICBjb25zdCBlbmdpbmUgPSBuZXcgbGlicmFyeV8xLlB1ZXJ0c0pTRW5naW5lKGN0b3JQYXJhbSk7XHJcbiAgICAgICAgY29uc3QgZXhlY3V0ZU1vZHVsZUNhY2hlID0ge307XHJcbiAgICAgICAgbGV0IGpzRW5naW5lUmV0dXJuZWQgPSBmYWxzZTtcclxuICAgICAgICBsZXQgbG9hZGVyO1xyXG4gICAgICAgIC8vIFB1ZXJ0c0RMTOeahOaJgOacieaOpeWPo+WunueOsFxyXG4gICAgICAgIGxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wgPSBPYmplY3QuYXNzaWduKGxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wsIHtcclxuICAgICAgICAgICAgdXBkYXRlR2xvYmFsQnVmZmVyQW5kVmlld3M6IGVuZ2luZS51cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3cy5iaW5kKGVuZ2luZSlcclxuICAgICAgICB9LCAoMCwgZ2V0RnJvbUpTQXJndW1lbnRfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgZ2V0RnJvbUpTUmV0dXJuXzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSW52b2tlSlNBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBzZXRUb0pTSW52b2tlUmV0dXJuXzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSlNPdXRBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCByZWdpc3Rlcl8xLmRlZmF1bHQpKGVuZ2luZSksIHtcclxuICAgICAgICAgICAgLy8gYnJpZGdlTG9nOiB0cnVlLFxyXG4gICAgICAgICAgICBHZXRMaWJWZXJzaW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMzQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEFwaUxldmVsOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMzQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldExpYkJhY2tlbmQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBDcmVhdGVKU0VuZ2luZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGpzRW5naW5lUmV0dXJuZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvbmx5IG9uZSBhdmFpbGFibGUganNFbnYgaXMgYWxsb3dlZCBpbiBXZWJHTCBtb2RlXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAganNFbmdpbmVSZXR1cm5lZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSlNFbmdpbmVXaXRoRXh0ZXJuYWxFbnY6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgRGVzdHJveUpTRW5naW5lOiBmdW5jdGlvbiAoKSB7IH0sXHJcbiAgICAgICAgICAgIEdldExhc3RFeGNlcHRpb25JbmZvOiBmdW5jdGlvbiAoaXNvbGF0ZSwgLyogb3V0IGludCAqLyBzdHJsZW4pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKGVuZ2luZS5sYXN0RXhjZXB0aW9uLnN0YWNrLCBzdHJsZW4pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBMb3dNZW1vcnlOb3RpZmljYXRpb246IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIElkbGVOb3RpZmljYXRpb25EZWFkbGluZTogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgUmVxdWVzdE1pbm9yR2FyYmFnZUNvbGxlY3Rpb25Gb3JUZXN0aW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBSZXF1ZXN0RnVsbEdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgU2V0R2VuZXJhbERlc3RydWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlLCBfZ2VuZXJhbERlc3RydWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciA9IF9nZW5lcmFsRGVzdHJ1Y3RvcjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0TW9kdWxlRXhlY3V0b3I6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGxvYWRlciA9IHR5cGVvZiBfX3RnanNHZXRMb2FkZXIgIT0gJ3VuZGVmaW5lZCcgPyBfX3RnanNHZXRMb2FkZXIoKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2FkZXJSZXNvbHZlID0gbG9hZGVyLlJlc29sdmUgPyAoZnVuY3Rpb24gKGZpbGVOYW1lLCB0byA9IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZE5hbWUgPSBsb2FkZXIuUmVzb2x2ZShmaWxlTmFtZSwgdG8pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkTmFtZTtcclxuICAgICAgICAgICAgICAgIH0pIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuY3Rpb24gKGZpbGVOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKFsncHVlcnRzL2xvZy5tanMnLCAncHVlcnRzL3RpbWVyLm1qcyddLmluZGV4T2YoZmlsZU5hbWUpICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7fTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlclJlc29sdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZU5hbWUgPSBsb2FkZXJSZXNvbHZlKGZpbGVOYW1lLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3eCAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB3eFJlcXVpcmUoJ3B1ZXJ0c19taW5pZ2FtZV9qc19yZXNvdXJjZXMvJyArIChmaWxlTmFtZS5lbmRzV2l0aCgnLmpzJykgPyBmaWxlTmFtZSA6IGZpbGVOYW1lICsgXCIuanNcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplKG5hbWUsIHRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIENTICE9IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDUy5QdWVydHMuUGF0aEhlbHBlci5Jc1JlbGF0aXZlKHRvKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXQgPSBDUy5QdWVydHMuUGF0aEhlbHBlci5ub3JtYWxpemUoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuRGlybmFtZShuYW1lKSArIFwiL1wiICsgdG8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0bztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBtb2NrUmVxdWlyZShzcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgZXhwb3J0czoge30gfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kQ2FjaGVTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgZXhlY3V0ZU1vZHVsZUNhY2hlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZENhY2hlU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmV4cG9ydHMgPSBleGVjdXRlTW9kdWxlQ2FjaGVbZm91bmRDYWNoZVNwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZFNwZWNpZmllciA9IHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBQVUVSVFNfSlNfUkVTT1VSQ0VTKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIHNwZWNpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNpZmllciA9IGZvdW5kU3BlY2lmaWVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUFVFUlRTX0pTX1JFU09VUkNFU1tzcGVjaWZpZXJdKHJlc3VsdC5leHBvcnRzLCBmdW5jdGlvbiBtUmVxdWlyZShzcGVjaWZpZXJUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vY2tSZXF1aXJlKGxvYWRlclJlc29sdmUgPyBsb2FkZXJSZXNvbHZlKHNwZWNpZmllclRvLCBzcGVjaWZpZXIpIDogbm9ybWFsaXplKHNwZWNpZmllciwgc3BlY2lmaWVyVG8pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0cnlGaW5kTmFtZSA9IFtzcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGVjaWZpZXIuaW5kZXhPZignLicpID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlGaW5kTmFtZSA9IHRyeUZpbmROYW1lLmNvbmNhdChbc3BlY2lmaWVyICsgJy5qcycsIHNwZWNpZmllciArICcudHMnLCBzcGVjaWZpZXIgKyAnLm1qcycsIHNwZWNpZmllciArICcubXRzJ10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSB0cnlGaW5kTmFtZS5yZWR1Y2UoKHJldCwgbmFtZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJldCAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmpbbmFtZV0gPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjaXJjdWxhciBkZXBlbmRlbmN5IGlzIGRldGVjdGVkIHdoZW4gcmVxdWlyaW5nIFwiJHtuYW1lfVwiYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmluZGVkID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnlGaW5kTmFtZVtmaW5kZWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWlyZVJldDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEpTT2JqZWN0VmFsdWVHZXR0ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuY3Rpb24gKG9iaiwga2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialtrZXldO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBFdmFsOiBmdW5jdGlvbiAoaXNvbGF0ZSwgY29kZVN0cmluZywgcGF0aCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsaWJyYXJ5XzEuZ2xvYmFsLmV2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJldmFsIGlzIG5vdCBzdXBwb3J0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKGNvZGVTdHJpbmcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGxpYnJhcnlfMS5nbG9iYWwuZXZhbChjb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gZ2V0SW50UHRyTWFuYWdlcigpLkdldFBvaW50ZXJGb3JKU1ZhbHVlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLypGUmVzdWx0SW5mbyAqLyAxMDI0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdEV4Y2VwdGlvbiA9IGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFNldFB1c2hKU0Z1bmN0aW9uQXJndW1lbnRzQ2FsbGJhY2s6IGZ1bmN0aW9uIChpc29sYXRlLCBjYWxsYmFjaywganNFbnZJZHgpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5HZXRKU0FyZ3VtZW50c0NhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFRocm93RXhjZXB0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgLypieXRlW10gKi8gbWVzc2FnZVN0cmluZykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobWVzc2FnZVN0cmluZykpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBJbnZva2VKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBoYXNSZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZ1bmMgaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSBmdW5jLmludm9rZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jLmxhc3RFeGNlcHRpb24gPSBlcnI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncHRyIGlzIG5vdCBhIGpzZnVuYycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRGdW5jdGlvbkxhc3RFeGNlcHRpb25JbmZvOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKm91dCBpbnQgKi8gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhmdW5jLmxhc3RFeGNlcHRpb24uc3RhY2sgfHwgZnVuYy5sYXN0RXhjZXB0aW9uLm1lc3NhZ2UgfHwgJycsIGxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVsZWFzZUpTRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBfZnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlbW92ZUpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlbGVhc2VKU09iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIG9iaikge1xyXG4gICAgICAgICAgICAgICAgbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVtb3ZlSlNPYmplY3RCeUlkKG9iaik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlc2V0UmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IG51bGw7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENsZWFyTW9kdWxlQ2FjaGU6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSW5zcGVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgcG9ydCkgeyB9LFxyXG4gICAgICAgICAgICBEZXN0cm95SW5zcGVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBJbnNwZWN0b3JUaWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBMb2dpY1RpY2s6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFNldExvZ0NhbGxiYWNrOiBmdW5jdGlvbiAobG9nLCBsb2dXYXJuaW5nLCBsb2dFcnJvcikge1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRKU1N0YWNrVHJhY2U6IGZ1bmN0aW9uIChpc29sYXRlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yKCkuc3RhY2s7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9