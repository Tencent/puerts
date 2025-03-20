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
        const { UTF8ToString, _malloc, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, stackSave, stackRestore, stackAlloc, addFunction, removeFunction, _CallCSharpFunctionCallback, _CallCSharpConstructorCallback, _CallCSharpDestructorCallback, HEAP8, HEAPU8, HEAP32, HEAPF32, HEAPF64, } = ctorParam;
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
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PApiRegsterApi = exports.GetWebGLFFIApi = void 0;
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
    throw new Error("pesapi_create_function not implemented yet!");
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
function pesapi_get_this(pinfo) {
    throw new Error("pesapi_get_this not implemented yet!");
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
    throw new Error("pesapi_open_scope not implemented yet!");
}
function pesapi_open_scope_placement(penv_ref, memory) {
    throw new Error("pesapi_open_scope_placement not implemented yet!");
}
function pesapi_has_caught(pscope) {
    throw new Error("pesapi_has_caught not implemented yet!");
}
function pesapi_get_exception_as_string(pscope, with_stack) {
    throw new Error("pesapi_get_exception_as_string not implemented yet!");
}
function pesapi_close_scope(pscope) {
    throw new Error("pesapi_close_scope not implemented yet!");
}
function pesapi_close_scope_placement(pscope) {
    throw new Error("pesapi_close_scope_placement not implemented yet!");
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
function pesapi_set_property(env, pobject, key, pvalue) {
    throw new Error("pesapi_set_property not implemented yet!");
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
    throw new Error("pesapi_set_property_uint32 not implemented yet!");
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
    throw new Error("pesapi_global not implemented yet!");
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
    { func: pesapi_get_this, sig: "ii" },
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
let webglFFI = undefined;
// 需要在Unity里调用PlayerSettings.WebGL.emscriptenArgs = " -s ALLOW_TABLE_GROWTH=1";
function GetWebGLFFIApi(engine) {
    if (webglFFI)
        return webglFFI;
    console.log(`create webgl ffi api count: ${apiInfo.length}`);
    const ptr = engine.unityApi._malloc(apiInfo.length * 4);
    const h32index = ptr >> 2;
    for (var i = 0; i < apiInfo.length; ++i) {
        engine.unityApi.HEAP32[h32index + i] = engine.unityApi.addFunction(apiInfo[i].func, apiInfo[i].sig);
    }
    webglFFI = ptr;
    return ptr;
}
exports.GetWebGLFFIApi = GetWebGLFFIApi;
function PApiRegsterApi(engine) {
    return {};
}
exports.PApiRegsterApi = PApiRegsterApi;
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
                return 1024;
            }
        });
    }
};
//# sourceMappingURL=index.js.map
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVlcnRzLXJ1bnRpbWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG9CQUFvQixHQUFHLGdCQUFnQixHQUFHLG9CQUFvQixHQUFHLHFCQUFxQixHQUFHLGtCQUFrQixHQUFHLGVBQWUsR0FBRyxzQkFBc0IsR0FBRyxrQkFBa0IsR0FBRyxxQkFBcUIsR0FBRyxjQUFjLEdBQUcsdUJBQXVCLEdBQUcsaUNBQWlDLEdBQUcsZ0JBQWdCLEdBQUcsa0JBQWtCLEdBQUcsc0NBQXNDLEdBQUcsNEJBQTRCO0FBQ2xZO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QixpQ0FBaUM7QUFDakMsa0JBQWtCO0FBQ2xCLGlDQUFpQztBQUNqQztBQUNBLG1DQUFtQztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnQkFBZ0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnQkFBZ0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQ7QUFDQTtBQUNBLDhGQUE4RjtBQUM5RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrR0FBa0c7QUFDbEc7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0REFBNEQ7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RDtBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQztBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMseUNBQXlDO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0EsY0FBYyxHQUFHLHFCQUFNLEdBQUcscUJBQU07QUFDaEMscUJBQU0sVUFBVSxxQkFBTTtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLFVBQVU7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsaURBQWlEO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLG9SQUFvUjtBQUNwUztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVEscUJBQU0sMkRBQTJEO0FBQ3pFLFFBQVEscUJBQU07QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVEscUJBQU07QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWU7QUFDZjtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQSx3REFBd0Q7QUFDeEQsd0NBQXdDO0FBQ3hDO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0EsbUVBQW1FO0FBQ25FLGdFQUFnRTtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7OztBQ2xxQmE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxrQkFBZTtBQUNmOzs7Ozs7Ozs7O0FDNUhhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGtCQUFrQixtQkFBTyxDQUFDLHVDQUFZO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxrQkFBZTtBQUNmOzs7Ozs7Ozs7O0FDM0VhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGtCQUFrQixtQkFBTyxDQUFDLHVDQUFZO0FBQ3RDO0FBQ0E7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QSwwQkFBMEI7QUFDMUIsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLDJCQUEyQjtBQUMzQixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxrQkFBZTtBQUNmOzs7Ozs7Ozs7O0FDaERhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELHNCQUFzQixHQUFHLHNCQUFzQjtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU0scUNBQXFDO0FBQzNDLE1BQU0sMENBQTBDO0FBQ2hELE1BQU0seUNBQXlDO0FBQy9DLE1BQU0sdUNBQXVDO0FBQzdDLE1BQU0sd0NBQXdDO0FBQzlDLE1BQU0sdUNBQXVDO0FBQzdDLE1BQU0sd0NBQXdDO0FBQzlDLE1BQU0sd0NBQXdDO0FBQzlDLE1BQU0sOENBQThDO0FBQ3BELE1BQU0seUNBQXlDO0FBQy9DLE1BQU0sc0NBQXNDO0FBQzVDLE1BQU0sdUNBQXVDO0FBQzdDLE1BQU0sNENBQTRDO0FBQ2xELE1BQU0sdUNBQXVDO0FBQzdDLE1BQU0seUNBQXlDO0FBQy9DLE1BQU0sMENBQTBDO0FBQ2hELE1BQU0sMkNBQTJDO0FBQ2pELE1BQU0sMENBQTBDO0FBQ2hELE1BQU0sMkNBQTJDO0FBQ2pELE1BQU0sMkNBQTJDO0FBQ2pELE1BQU0sa0RBQWtEO0FBQ3hELE1BQU0sNENBQTRDO0FBQ2xELE1BQU0sMkNBQTJDO0FBQ2pELE1BQU0sa0NBQWtDO0FBQ3hDLE1BQU0sdUNBQXVDO0FBQzdDLE1BQU0scUNBQXFDO0FBQzNDLE1BQU0sbUNBQW1DO0FBQ3pDLE1BQU0sb0NBQW9DO0FBQzFDLE1BQU0sbUNBQW1DO0FBQ3pDLE1BQU0sb0NBQW9DO0FBQzFDLE1BQU0sb0NBQW9DO0FBQzFDLE1BQU0sb0NBQW9DO0FBQzFDLE1BQU0sb0NBQW9DO0FBQzFDLE1BQU0sc0NBQXNDO0FBQzVDLE1BQU0sb0NBQW9DO0FBQzFDLE1BQU0sbUNBQW1DO0FBQ3pDLE1BQU0sbURBQW1EO0FBQ3pELE1BQU0sZ0RBQWdEO0FBQ3RELE1BQU0sbURBQW1EO0FBQ3pELE1BQU0sMENBQTBDO0FBQ2hELE1BQU0saUNBQWlDO0FBQ3ZDLE1BQU0sbUNBQW1DO0FBQ3pDLE1BQU0sOENBQThDO0FBQ3BELE1BQU0seUNBQXlDO0FBQy9DLE1BQU0sc0NBQXNDO0FBQzVDLE1BQU0sa0NBQWtDO0FBQ3hDLE1BQU0saUNBQWlDO0FBQ3ZDLE1BQU0sa0NBQWtDO0FBQ3hDLE1BQU0sb0NBQW9DO0FBQzFDLE1BQU0sc0NBQXNDO0FBQzVDLE1BQU0scUNBQXFDO0FBQzNDLE1BQU0sMENBQTBDO0FBQ2hELE1BQU0sd0NBQXdDO0FBQzlDLE1BQU0sMENBQTBDO0FBQ2hELE1BQU0sMENBQTBDO0FBQ2hELE1BQU0sMkNBQTJDO0FBQ2pELE1BQU0seUNBQXlDO0FBQy9DLE1BQU0sb0NBQW9DO0FBQzFDLE1BQU0sK0NBQStDO0FBQ3JELE1BQU0sb0NBQW9DO0FBQzFDLE1BQU0sa0RBQWtEO0FBQ3hELE1BQU0scUNBQXFDO0FBQzNDLE1BQU0sK0NBQStDO0FBQ3JELE1BQU0sNENBQTRDO0FBQ2xELE1BQU0sNkNBQTZD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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiLDZDQUE2QztBQUM3Qyx5REFBeUQ7QUFDekQsb0RBQW9EO0FBQ3BELGlEQUFpRDtBQUNqRCw2Q0FBNkM7QUFDN0M7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsaUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9vdXRwdXQvbGlicmFyeS5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL2dldEZyb21KU0FyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvZ2V0RnJvbUpTUmV0dXJuLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvcmVnaXN0ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0ludm9rZUpTQXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0pTSW52b2tlUmV0dXJuLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9KU091dEFyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9wZXNhcGlJbXBsLmpzIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5yZXR1cm5CaWdJbnQgPSBleHBvcnRzLmlzQmlnSW50ID0gZXhwb3J0cy5zZXRPdXRWYWx1ZTggPSBleHBvcnRzLnNldE91dFZhbHVlMzIgPSBleHBvcnRzLm1ha2VCaWdJbnQgPSBleHBvcnRzLkdldFR5cGUgPSBleHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gZXhwb3J0cy5PbkZpbmFsaXplID0gZXhwb3J0cy5jcmVhdGVXZWFrUmVmID0gZXhwb3J0cy5nbG9iYWwgPSBleHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IGV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGV4cG9ydHMuSlNPYmplY3QgPSBleHBvcnRzLkpTRnVuY3Rpb24gPSBleHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IGV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm8gPSB2b2lkIDA7XHJcbi8qKlxyXG4gKiDkuIDmrKHlh73mlbDosIPnlKjnmoRpbmZvXHJcbiAqIOWvueW6lHY4OjpGdW5jdGlvbkNhbGxiYWNrSW5mb1xyXG4gKi9cclxuY2xhc3MgRnVuY3Rpb25DYWxsYmFja0luZm8ge1xyXG4gICAgYXJncztcclxuICAgIHJldHVyblZhbHVlO1xyXG4gICAgc3RhY2sgPSAwO1xyXG4gICAgY29uc3RydWN0b3IoYXJncykge1xyXG4gICAgICAgIHRoaXMuYXJncyA9IGFyZ3M7XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlKCkge1xyXG4gICAgICAgIHRoaXMuc3RhY2sgPSAwO1xyXG4gICAgICAgIHRoaXMuYXJncyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IHZvaWQgMDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gRnVuY3Rpb25DYWxsYmFja0luZm87XHJcbi8vIHN0cnVjdCBNb2NrVjhWYWx1ZVxyXG4vLyB7XHJcbi8vICAgICBpbnQgSlNWYWx1ZVR5cGU7ICAvLyAwXHJcbi8vICAgICBpbnQgRmluYWxWYWx1ZVBvaW50ZXJbMl07IC8vIDEgMiBpZiB2YWx1ZSBpcyBiaWdpbnQgRmluYWxWYWx1ZVBvaW50ZXJbMF0gZm9yIGxvdywgRmluYWxWYWx1ZVBvaW50ZXJbMV0gZm9yIGhpZ2hcclxuLy8gICAgIGludCBleHRyYTsgLy8gM1xyXG4vLyAgICAgaW50IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvOyAvLyA0XHJcbi8vIH07XHJcbmNvbnN0IEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyID0gNDsgLy8gaW50IGNvdW50XHJcbi8qKlxyXG4gKiDmiopGdW5jdGlvbkNhbGxiYWNrSW5mb+S7peWPiuWFtuWPguaVsOi9rOWMluS4umMj5Y+v55So55qEaW50cHRyXHJcbiAqL1xyXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIge1xyXG4gICAgLy8gRnVuY3Rpb25DYWxsYmFja0luZm/nmoTliJfooajvvIzku6XliJfooajnmoRpbmRleOS9nOS4ukludFB0cueahOWAvFxyXG4gICAgaW5mb3MgPSBbbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKFswXSldOyAvLyDov5nph4zljp/mnKzlj6rmmK/kuKrmma7pgJrnmoQwXHJcbiAgICAvLyBGdW5jdGlvbkNhbGxiYWNrSW5mb+eUqOWujOWQju+8jOWwhuWFtuW6j+WPt+aUvuWFpeKAnOWbnuaUtuWIl+ihqOKAne+8jOS4i+asoeWwseiDvee7p+e7reacjeeUqOivpWluZGV477yM6ICM5LiN5b+F6K6paW5mb3PmlbDnu4Tml6DpmZDmianlsZXkuIvljrtcclxuICAgIGZyZWVJbmZvc0luZGV4ID0gW107XHJcbiAgICBmcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGggPSB7fTtcclxuICAgIGZyZWVSZWZNZW1vcnkgPSBbXTtcclxuICAgIGVuZ2luZTtcclxuICAgIGNvbnN0cnVjdG9yKGVuZ2luZSkge1xyXG4gICAgICAgIHRoaXMuZW5naW5lID0gZW5naW5lO1xyXG4gICAgfVxyXG4gICAgYWxsb2NDYWxsYmFja0luZm9NZW1vcnkoYXJnc0xlbmd0aCkge1xyXG4gICAgICAgIGNvbnN0IGNhY2hlQXJyYXkgPSB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXTtcclxuICAgICAgICBpZiAoY2FjaGVBcnJheSAmJiBjYWNoZUFycmF5Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVBcnJheS5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVuZ2luZS51bml0eUFwaS5fbWFsbG9jKChhcmdzTGVuZ3RoICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgKyAxKSA8PCAyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhbGxvY1JlZk1lbW9yeSgpIHtcclxuICAgICAgICBpZiAodGhpcy5mcmVlUmVmTWVtb3J5Lmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnJlZVJlZk1lbW9yeS5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbmdpbmUudW5pdHlBcGkuX21hbGxvYyhBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiA8PCAyKTtcclxuICAgIH1cclxuICAgIHJlY3ljbGVSZWZNZW1vcnkoYnVmZmVyUHRyKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZnJlZVJlZk1lbW9yeS5sZW5ndGggPiAyMCkge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5fZnJlZShidWZmZXJQdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5mcmVlUmVmTWVtb3J5LnB1c2goYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KGJ1ZmZlclB0ciwgYXJncykge1xyXG4gICAgICAgIGNvbnN0IGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICBpZiAoIXRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdICYmIGFyZ3NMZW5ndGggPCA1KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGNhY2hlQXJyYXkgPSB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXTtcclxuICAgICAgICBpZiAoIWNhY2hlQXJyYXkpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBidWZmZXJQdHJJbjMyID0gYnVmZmVyUHRyIDw8IDI7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzTGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3NbaV0gaW5zdGFuY2VvZiBBcnJheSAmJiBhcmdzW2ldLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlY3ljbGVSZWZNZW1vcnkodGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW2J1ZmZlclB0ckluMzIgKyBpICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgKyAxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g5ouN6ISR6KKL5a6a55qE5pyA5aSn57yT5a2Y5Liq5pWw5aSn5bCP44CCIDUwIC0g5Y+C5pWw5Liq5pWwICogMTBcclxuICAgICAgICBpZiAoY2FjaGVBcnJheS5sZW5ndGggPiAoNTAgLSBhcmdzTGVuZ3RoICogMTApKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9mcmVlKGJ1ZmZlclB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjYWNoZUFycmF5LnB1c2goYnVmZmVyUHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIGludHB0cueahOagvOW8j+S4umlk5bem56e75Zub5L2NXHJcbiAgICAgKlxyXG4gICAgICog5Y+z5L6n5Zub5L2N77yM5piv5Li65LqG5Zyo5Y+z5Zub5L2N5a2Y5YKo5Y+C5pWw55qE5bqP5Y+377yM6L+Z5qC35Y+v5Lul55So5LqO6KGo56S6Y2FsbGJhY2tpbmZv5Y+C5pWw55qEaW50cHRyXHJcbiAgICAgKi9cclxuICAgIC8vIHN0YXRpYyBHZXRNb2NrUG9pbnRlcihhcmdzOiBhbnlbXSk6IE1vY2tJbnRQdHIge1xyXG4gICAgLy8gICAgIGxldCBpbmRleDogbnVtYmVyO1xyXG4gICAgLy8gICAgIGluZGV4ID0gdGhpcy5mcmVlSW5mb3NJbmRleC5wb3AoKTtcclxuICAgIC8vICAgICAvLyBpbmRleOacgOWwj+S4ujFcclxuICAgIC8vICAgICBpZiAoaW5kZXgpIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5pbmZvc1tpbmRleF0uYXJncyA9IGFyZ3M7XHJcbiAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2gobmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKGFyZ3MpKSAtIDE7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIHJldHVybiBpbmRleCA8PCA0O1xyXG4gICAgLy8gfVxyXG4gICAgR2V0TW9ja1BvaW50ZXIoYXJncykge1xyXG4gICAgICAgIGNvbnN0IGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aDtcclxuICAgICAgICBsZXQgYnVmZmVyUHRySW44ID0gdGhpcy5hbGxvY0NhbGxiYWNrSW5mb01lbW9yeShhcmdzTGVuZ3RoKTtcclxuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLmZyZWVJbmZvc0luZGV4LnBvcCgpO1xyXG4gICAgICAgIGxldCBmdW5jdGlvbkNhbGxiYWNrSW5mbztcclxuICAgICAgICAvLyBpbmRleOacgOWwj+S4ujFcclxuICAgICAgICBpZiAoaW5kZXgpIHtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gdGhpcy5pbmZvc1tpbmRleF0pLmFyZ3MgPSBhcmdzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2goZnVuY3Rpb25DYWxsYmFja0luZm8gPSBuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oYXJncykpIC0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHVuaXR5QXBpID0gdGhpcy5lbmdpbmUudW5pdHlBcGk7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyUHRySW4zMiA9IGJ1ZmZlclB0ckluOCA+PiAyO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVAzMltidWZmZXJQdHJJbjMyXSA9IGluZGV4O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJnc0xlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBhcmcgPSBhcmdzW2ldO1xyXG4gICAgICAgICAgICAvLyBpbml0IGVhY2ggdmFsdWVcclxuICAgICAgICAgICAgY29uc3QganNWYWx1ZVR5cGUgPSBHZXRUeXBlKHRoaXMuZW5naW5lLCBhcmcpO1xyXG4gICAgICAgICAgICBjb25zdCBqc1ZhbHVlUHRyID0gYnVmZmVyUHRySW4zMiArIGkgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDE7XHJcbiAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyXSA9IGpzVmFsdWVUeXBlOyAvLyBqc3ZhbHVldHlwZVxyXG4gICAgICAgICAgICBpZiAoanNWYWx1ZVR5cGUgPT0gMiB8fCBqc1ZhbHVlVHlwZSA9PSA0IHx8IGpzVmFsdWVUeXBlID09IDUxMikge1xyXG4gICAgICAgICAgICAgICAgLy8gYmlnaW5044CBbnVtYmVyIG9yIGRhdGVcclxuICAgICAgICAgICAgICAgICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKHRoaXMuZW5naW5lLCBhcmcsIGpzVmFsdWVUeXBlLCBqc1ZhbHVlUHRyICsgMSk7IC8vIHZhbHVlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoanNWYWx1ZVR5cGUgPT0gOCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGZ1bmN0aW9uQ2FsbGJhY2tJbmZvLnN0YWNrID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbkNhbGxiYWNrSW5mby5zdGFjayA9IHVuaXR5QXBpLnN0YWNrU2F2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIChqc1ZhbHVlUHRyICsgMikgPDwgMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoanNWYWx1ZVR5cGUgPT0gNjQgJiYgYXJnIGluc3RhbmNlb2YgQXJyYXkgJiYgYXJnLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBtYXliZSBhIHJlZlxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIDApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmUHRySW44ID0gdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAyXSA9IHRoaXMuYWxsb2NSZWZNZW1vcnkoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlZlB0ciA9IHJlZlB0ckluOCA+PiAyO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVmVmFsdWVUeXBlID0gdW5pdHlBcGkuSEVBUDMyW3JlZlB0cl0gPSBHZXRUeXBlKHRoaXMuZW5naW5lLCBhcmdbMF0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlZlZhbHVlVHlwZSA9PSAyIHx8IHJlZlZhbHVlVHlwZSA9PSA0IHx8IHJlZlZhbHVlVHlwZSA9PSA1MTIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBudW1iZXIgb3IgZGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKHRoaXMuZW5naW5lLCBhcmdbMF0sIHJlZlZhbHVlVHlwZSwgcmVmUHRyICsgMSk7IC8vIHZhbHVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbcmVmUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmdbMF0sIHJlZlZhbHVlVHlwZSwgKHJlZlB0ciArIDIpIDw8IDIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW3JlZlB0ciArIDNdID0gYnVmZmVyUHRySW44OyAvLyBhIHBvaW50ZXIgdG8gdGhlIGluZm9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIG90aGVyXHJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwgKGpzVmFsdWVQdHIgKyAyKSA8PCAyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDNdID0gYnVmZmVyUHRySW44OyAvLyBhIHBvaW50ZXIgdG8gdGhlIGluZm9cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlclB0ckluODtcclxuICAgIH1cclxuICAgIC8vIHN0YXRpYyBHZXRCeU1vY2tQb2ludGVyKGludHB0cjogTW9ja0ludFB0cik6IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvIHtcclxuICAgIC8vICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbnRwdHIgPj4gNF07XHJcbiAgICAvLyB9XHJcbiAgICBHZXRCeU1vY2tQb2ludGVyKHB0ckluOCkge1xyXG4gICAgICAgIGNvbnN0IHB0ckluMzIgPSBwdHJJbjggPj4gMjtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXTtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICB9XHJcbiAgICBHZXRSZXR1cm5WYWx1ZUFuZFJlY3ljbGUocHRySW44KSB7XHJcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xyXG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICAgICAgbGV0IHJldCA9IGluZm8ucmV0dXJuVmFsdWU7XHJcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KHB0ckluOCwgaW5mby5hcmdzKTtcclxuICAgICAgICBpZiAoaW5mby5zdGFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5zdGFja1Jlc3RvcmUoaW5mby5zdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluZm8ucmVjeWNsZSgpO1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIFJlbGVhc2VCeU1vY2tJbnRQdHIocHRySW44KSB7XHJcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xyXG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KHB0ckluOCwgaW5mby5hcmdzKTtcclxuICAgICAgICBpZiAoaW5mby5zdGFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5zdGFja1Jlc3RvcmUoaW5mby5zdGFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluZm8ucmVjeWNsZSgpO1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICB9XHJcbiAgICBHZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlUHRySW44KSB7XHJcbiAgICAgICAgbGV0IGhlYXAzMiA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMjtcclxuICAgICAgICBjb25zdCBpbmZvUHRySW44ID0gaGVhcDMyWyh2YWx1ZVB0ckluOCA+PiAyKSArIDNdO1xyXG4gICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb0luZGV4ID0gaGVhcDMyW2luZm9QdHJJbjggPj4gMl07XHJcbiAgICAgICAgY29uc3QgYXJnc0luZGV4ID0gKHZhbHVlUHRySW44IC0gaW5mb1B0ckluOCAtIDQpIC8gKDQgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mb3NbY2FsbGJhY2tJbmZvSW5kZXhdLmFyZ3NbYXJnc0luZGV4XTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcclxuLyoqXHJcbiAqIOS7o+ihqOS4gOS4qkpTRnVuY3Rpb25cclxuICovXHJcbmNsYXNzIEpTRnVuY3Rpb24ge1xyXG4gICAgX2Z1bmM7XHJcbiAgICBpZDtcclxuICAgIGFyZ3MgPSBbXTtcclxuICAgIGxhc3RFeGNlcHRpb24gPSBudWxsO1xyXG4gICAgY29uc3RydWN0b3IoaWQsIGZ1bmMpIHtcclxuICAgICAgICB0aGlzLl9mdW5jID0gZnVuYztcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICB9XHJcbiAgICBpbnZva2UoKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbLi4udGhpcy5hcmdzXTtcclxuICAgICAgICB0aGlzLmFyZ3MubGVuZ3RoID0gMDtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkpTRnVuY3Rpb24gPSBKU0Z1bmN0aW9uO1xyXG4vKipcclxuICog5Luj6KGo5LiA5LiqSlNPYmplY3RcclxuICovXHJcbmNsYXNzIEpTT2JqZWN0IHtcclxuICAgIF9vYmo7XHJcbiAgICBpZDtcclxuICAgIGNvbnN0cnVjdG9yKGlkLCBvYmopIHtcclxuICAgICAgICB0aGlzLl9vYmogPSBvYmo7XHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgfVxyXG4gICAgZ2V0T2JqZWN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9vYmo7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5KU09iamVjdCA9IEpTT2JqZWN0O1xyXG5jbGFzcyBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5IHtcclxuICAgIHN0YXRpYyByZWd1bGFySUQgPSAxO1xyXG4gICAgc3RhdGljIGZyZWVJRCA9IFtdO1xyXG4gICAgc3RhdGljIGlkTWFwID0gbmV3IFdlYWtNYXAoKTtcclxuICAgIHN0YXRpYyBqc0Z1bmNPck9iamVjdEtWID0ge307XHJcbiAgICBzdGF0aWMgZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmNWYWx1ZSkge1xyXG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KGZ1bmNWYWx1ZSk7XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5mcmVlSUQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlkID0gdGhpcy5mcmVlSUQucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGZ1bmMgPSBuZXcgSlNGdW5jdGlvbihpZCwgZnVuY1ZhbHVlKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLnNldChmdW5jVmFsdWUsIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdID0gZnVuYztcclxuICAgICAgICByZXR1cm4gZnVuYztcclxuICAgIH1cclxuICAgIHN0YXRpYyBnZXRPckNyZWF0ZUpTT2JqZWN0KG9iaikge1xyXG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KG9iaik7XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5mcmVlSUQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlkID0gdGhpcy5mcmVlSUQucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGpzT2JqZWN0ID0gbmV3IEpTT2JqZWN0KGlkLCBvYmopO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuc2V0KG9iaiwgaWQpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBqc09iamVjdDtcclxuICAgICAgICByZXR1cm4ganNPYmplY3Q7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZ2V0SlNPYmplY3RCeUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcmVtb3ZlSlNPYmplY3RCeUlkKGlkKSB7XHJcbiAgICAgICAgY29uc3QganNPYmplY3QgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIGlmICghanNPYmplY3QpXHJcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ3JlbW92ZUpTT2JqZWN0QnlJZCBmYWlsZWQ6IGlkIGlzIGludmFsaWQ6ICcgKyBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNPYmplY3QuZ2V0T2JqZWN0KCkpO1xyXG4gICAgICAgIGRlbGV0ZSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIHRoaXMuZnJlZUlELnB1c2goaWQpO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGdldEpTRnVuY3Rpb25CeUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcmVtb3ZlSlNGdW5jdGlvbkJ5SWQoaWQpIHtcclxuICAgICAgICBjb25zdCBqc0Z1bmMgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIGlmICghanNGdW5jKVxyXG4gICAgICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKCdyZW1vdmVKU0Z1bmN0aW9uQnlJZCBmYWlsZWQ6IGlkIGlzIGludmFsaWQ6ICcgKyBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNGdW5jLl9mdW5jKTtcclxuICAgICAgICBkZWxldGUganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICB0aGlzLmZyZWVJRC5wdXNoKGlkKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5O1xyXG4vKipcclxuICogQ1NoYXJw5a+56LGh6K6w5b2V6KGo77yM6K6w5b2V5omA5pyJQ1NoYXJw5a+56LGh5bm25YiG6YWNaWRcclxuICog5ZKMcHVlcnRzLmRsbOaJgOWBmueahOS4gOagt1xyXG4gKi9cclxuY2xhc3MgQ1NoYXJwT2JqZWN0TWFwIHtcclxuICAgIGNsYXNzZXMgPSBbbnVsbF07XHJcbiAgICBuYXRpdmVPYmplY3RLViA9IG5ldyBNYXAoKTtcclxuICAgIC8vIHByaXZhdGUgbmF0aXZlT2JqZWN0S1Y6IHsgW29iamVjdElEOiBDU0lkZW50aWZpZXJdOiBXZWFrUmVmPGFueT4gfSA9IHt9O1xyXG4gICAgLy8gcHJpdmF0ZSBjc0lEV2Vha01hcDogV2Vha01hcDxhbnksIENTSWRlbnRpZmllcj4gPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgbmFtZXNUb0NsYXNzZXNJRCA9IHt9O1xyXG4gICAgY2xhc3NJRFdlYWtNYXAgPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYWRkQ2FsbGVkJywgdGhpcy5hZGRDYWxsZWQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVtb3ZlQ2FsbGVkJywgdGhpcy5yZW1vdmVDYWxsZWQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnd3InLCB0aGlzLm5hdGl2ZU9iamVjdEtWLnNpemUpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgfVxyXG4gICAgX21lbW9yeURlYnVnID0gZmFsc2U7XHJcbiAgICBhZGRDYWxsZWQgPSAwO1xyXG4gICAgcmVtb3ZlQ2FsbGVkID0gMDtcclxuICAgIGFkZChjc0lELCBvYmopIHtcclxuICAgICAgICB0aGlzLl9tZW1vcnlEZWJ1ZyAmJiB0aGlzLmFkZENhbGxlZCsrO1xyXG4gICAgICAgIC8vIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF0gPSBjcmVhdGVXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgLy8gdGhpcy5jc0lEV2Vha01hcC5zZXQob2JqLCBjc0lEKTtcclxuICAgICAgICB0aGlzLm5hdGl2ZU9iamVjdEtWLnNldChjc0lELCBjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgIG9ialsnJGNzaWQnXSA9IGNzSUQ7XHJcbiAgICB9XHJcbiAgICByZW1vdmUoY3NJRCkge1xyXG4gICAgICAgIHRoaXMuX21lbW9yeURlYnVnICYmIHRoaXMucmVtb3ZlQ2FsbGVkKys7XHJcbiAgICAgICAgLy8gZGVsZXRlIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF07XHJcbiAgICAgICAgdGhpcy5uYXRpdmVPYmplY3RLVi5kZWxldGUoY3NJRCk7XHJcbiAgICB9XHJcbiAgICBmaW5kT3JBZGRPYmplY3QoY3NJRCwgY2xhc3NJRCkge1xyXG4gICAgICAgIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWLmdldChjc0lEKTtcclxuICAgICAgICAvLyBsZXQgcmV0ID0gdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXTtcclxuICAgICAgICBpZiAocmV0ICYmIChyZXQgPSByZXQuZGVyZWYoKSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0ID0gdGhpcy5jbGFzc2VzW2NsYXNzSURdLmNyZWF0ZUZyb21DUyhjc0lEKTtcclxuICAgICAgICAvLyB0aGlzLmFkZChjc0lELCByZXQpOyDmnoTpgKDlh73mlbDph4zotJ/otKPosIPnlKhcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gICAgZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChvYmopIHtcclxuICAgICAgICAvLyByZXR1cm4gdGhpcy5jc0lEV2Vha01hcC5nZXQob2JqKTtcclxuICAgICAgICByZXR1cm4gb2JqID8gb2JqLiRjc2lkIDogMDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IENTaGFycE9iamVjdE1hcDtcclxuO1xyXG52YXIgZGVzdHJ1Y3RvcnMgPSB7fTtcclxuZXhwb3J0cy5nbG9iYWwgPSBnbG9iYWwgPSBnbG9iYWwgfHwgZ2xvYmFsVGhpcyB8fCB3aW5kb3c7XHJcbmdsb2JhbC5nbG9iYWwgPSBnbG9iYWw7XHJcbmNvbnN0IGNyZWF0ZVdlYWtSZWYgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHR5cGVvZiBXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBXWFdlYWtSZWYgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIldlYWtSZWYgaXMgbm90IGRlZmluZWQuIG1heWJlIHlvdSBzaG91bGQgdXNlIG5ld2VyIGVudmlyb25tZW50XCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGVyZWYoKSB7IHJldHVybiBvYmo7IH0gfTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwidXNpbmcgV1hXZWFrUmVmXCIpO1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgV1hXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXZWFrUmVmKG9iaik7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5leHBvcnRzLmNyZWF0ZVdlYWtSZWYgPSBjcmVhdGVXZWFrUmVmO1xyXG5jbGFzcyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2sge1xyXG4gICAgX2hhbmRsZXI7XHJcbiAgICByZWZzID0gW107XHJcbiAgICBoZWxkcyA9IFtdO1xyXG4gICAgYXZhaWxhYmxlSW5kZXggPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yKGhhbmRsZXIpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oXCJGaW5hbGl6YXRpb25SZWdpc3RlciBpcyBub3QgZGVmaW5lZC4gdXNpbmcgRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrXCIpO1xyXG4gICAgICAgIGdsb2JhbC5fcHVlcnRzX3JlZ2lzdHJ5ID0gdGhpcztcclxuICAgICAgICB0aGlzLl9oYW5kbGVyID0gaGFuZGxlcjtcclxuICAgIH1cclxuICAgIHJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYXZhaWxhYmxlSW5kZXgubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5hdmFpbGFibGVJbmRleC5wb3AoKTtcclxuICAgICAgICAgICAgdGhpcy5yZWZzW2luZGV4XSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcclxuICAgICAgICAgICAgdGhpcy5oZWxkc1tpbmRleF0gPSBoZWxkVmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlZnMucHVzaChjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgICAgICB0aGlzLmhlbGRzLnB1c2goaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOa4hemZpOWPr+iDveW3sue7j+WkseaViOeahFdlYWtSZWZcclxuICAgICAqL1xyXG4gICAgaXRlcmF0ZVBvc2l0aW9uID0gMDtcclxuICAgIGNsZWFudXAocGFydCA9IDEpIHtcclxuICAgICAgICBjb25zdCBzdGVwQ291bnQgPSB0aGlzLnJlZnMubGVuZ3RoIC8gcGFydDtcclxuICAgICAgICBsZXQgaSA9IHRoaXMuaXRlcmF0ZVBvc2l0aW9uO1xyXG4gICAgICAgIGZvciAobGV0IGN1cnJlbnRTdGVwID0gMDsgaSA8IHRoaXMucmVmcy5sZW5ndGggJiYgY3VycmVudFN0ZXAgPCBzdGVwQ291bnQ7IGkgPSAoaSA9PSB0aGlzLnJlZnMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMSksIGN1cnJlbnRTdGVwKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVmc1tpXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVmc1tpXS5kZXJlZigpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDnm67liY3msqHmnInlhoXlrZjmlbTnkIbog73lipvvvIzlpoLmnpzmuLjmiI/kuK3mnJ9yZWblvojlpJrkvYblkI7mnJ/lsJHkuobvvIzov5nph4zlsLHkvJrnmb3otLnpgY3ljobmrKHmlbBcclxuICAgICAgICAgICAgICAgIC8vIOS9humBjeWOhuS5n+WPquaYr+S4gOWPpT095ZKMY29udGludWXvvIzmtarotLnlvbHlk43kuI3lpKdcclxuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlSW5kZXgucHVzaChpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVmc1tpXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZXIodGhpcy5oZWxkc1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pdGVyYXRlUG9zaXRpb24gPSBpO1xyXG4gICAgfVxyXG59XHJcbnZhciByZWdpc3RyeSA9IG51bGw7XHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICByZWdpc3RyeSA9IG5ldyAodHlwZW9mIEZpbmFsaXphdGlvblJlZ2lzdHJ5ID09ICd1bmRlZmluZWQnID8gRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrIDogRmluYWxpemF0aW9uUmVnaXN0cnkpKGZ1bmN0aW9uIChoZWxkVmFsdWUpIHtcclxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xyXG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IGZpbmQgZGVzdHJ1Y3RvciBmb3IgXCIgKyBoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoLS1jYWxsYmFjay5yZWYgPT0gMCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXTtcclxuICAgICAgICAgICAgY2FsbGJhY2soaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBPbkZpbmFsaXplKG9iaiwgaGVsZFZhbHVlLCBjYWxsYmFjaykge1xyXG4gICAgaWYgKCFyZWdpc3RyeSkge1xyXG4gICAgICAgIGluaXQoKTtcclxuICAgIH1cclxuICAgIGxldCBvcmlnaW5DYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XHJcbiAgICBpZiAob3JpZ2luQ2FsbGJhY2spIHtcclxuICAgICAgICAvLyBXZWFrUmVm5YaF5a656YeK5pS+5pe25py65Y+v6IO95q+UZmluYWxpemF0aW9uUmVnaXN0cnnnmoTop6blj5Hmm7Tml6nvvIzliY3pnaLlpoLmnpzlj5HnjrB3ZWFrUmVm5Li656m65Lya6YeN5paw5Yib5bu65a+56LGhXHJcbiAgICAgICAgLy8g5L2G5LmL5YmN5a+56LGh55qEZmluYWxpemF0aW9uUmVnaXN0cnnmnIDnu4jlj4jogq/lrprkvJrop6blj5HjgIJcclxuICAgICAgICAvLyDmiYDku6XlpoLmnpzpgYfliLDov5nkuKrmg4XlhrXvvIzpnIDopoHnu5lkZXN0cnVjdG9y5Yqg6K6h5pWwXHJcbiAgICAgICAgKytvcmlnaW5DYWxsYmFjay5yZWY7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsYmFjay5yZWYgPSAxO1xyXG4gICAgICAgIGRlc3RydWN0b3JzW2hlbGRWYWx1ZV0gPSBjYWxsYmFjaztcclxuICAgIH1cclxuICAgIHJlZ2lzdHJ5LnJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKTtcclxufVxyXG5leHBvcnRzLk9uRmluYWxpemUgPSBPbkZpbmFsaXplO1xyXG5jbGFzcyBQdWVydHNKU0VuZ2luZSB7XHJcbiAgICBjc2hhcnBPYmplY3RNYXA7XHJcbiAgICBmdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXI7XHJcbiAgICB1bml0eUFwaTtcclxuICAgIC8qKiDlrZfnrKbkuLLnvJPlrZjvvIzpu5jorqTkuLoyNTblrZfoioIgKi9cclxuICAgIHN0ckJ1ZmZlcjtcclxuICAgIHN0cmluZ0J1ZmZlclNpemUgPSAyNTY7XHJcbiAgICBsYXN0UmV0dXJuQ1NSZXN1bHQgPSBudWxsO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICAvLyDov5nkuKTkuKrmmK9QdWVydHPnlKjnmoTnmoTnnJ/mraPnmoRDU2hhcnDlh73mlbDmjIfpkohcclxuICAgIEdldEpTQXJndW1lbnRzQ2FsbGJhY2s7XHJcbiAgICBnZW5lcmFsRGVzdHJ1Y3RvcjtcclxuICAgIGNvbnN0cnVjdG9yKGN0b3JQYXJhbSkge1xyXG4gICAgICAgIHRoaXMuY3NoYXJwT2JqZWN0TWFwID0gbmV3IENTaGFycE9iamVjdE1hcCgpO1xyXG4gICAgICAgIHRoaXMuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyID0gbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcih0aGlzKTtcclxuICAgICAgICBjb25zdCB7IFVURjhUb1N0cmluZywgX21hbGxvYywgX2ZyZWUsIF9zZXRUZW1wUmV0MCwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHN0YWNrU2F2ZSwgc3RhY2tSZXN0b3JlLCBzdGFja0FsbG9jLCBhZGRGdW5jdGlvbiwgcmVtb3ZlRnVuY3Rpb24sIF9DYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjaywgX0NhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrLCBfQ2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjaywgSEVBUDgsIEhFQVBVOCwgSEVBUDMyLCBIRUFQRjMyLCBIRUFQRjY0LCB9ID0gY3RvclBhcmFtO1xyXG4gICAgICAgIHRoaXMuc3RyQnVmZmVyID0gX21hbGxvYyh0aGlzLnN0cmluZ0J1ZmZlclNpemUpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkgPSB7XHJcbiAgICAgICAgICAgIFVURjhUb1N0cmluZyxcclxuICAgICAgICAgICAgX21hbGxvYyxcclxuICAgICAgICAgICAgX2ZyZWUsXHJcbiAgICAgICAgICAgIF9zZXRUZW1wUmV0MCxcclxuICAgICAgICAgICAgc3RyaW5nVG9VVEY4LFxyXG4gICAgICAgICAgICBsZW5ndGhCeXRlc1VURjgsXHJcbiAgICAgICAgICAgIHN0YWNrU2F2ZSxcclxuICAgICAgICAgICAgc3RhY2tSZXN0b3JlLFxyXG4gICAgICAgICAgICBzdGFja0FsbG9jLFxyXG4gICAgICAgICAgICBhZGRGdW5jdGlvbixcclxuICAgICAgICAgICAgcmVtb3ZlRnVuY3Rpb24sXHJcbiAgICAgICAgICAgIF9DYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayxcclxuICAgICAgICAgICAgX0NhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrLFxyXG4gICAgICAgICAgICBfQ2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayxcclxuICAgICAgICAgICAgSEVBUDgsXHJcbiAgICAgICAgICAgIEhFQVBVOCxcclxuICAgICAgICAgICAgSEVBUDMyLFxyXG4gICAgICAgICAgICBIRUFQRjMyLFxyXG4gICAgICAgICAgICBIRUFQRjY0LFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZ2xvYmFsLl9fdGdqc0V2YWxTY3JpcHQgPSB0eXBlb2YgZXZhbCA9PSBcInVuZGVmaW5lZFwiID8gKCkgPT4geyB9IDogZXZhbDtcclxuICAgICAgICBnbG9iYWwuX190Z2pzU2V0UHJvbWlzZVJlamVjdENhbGxiYWNrID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHd4Lm9uVW5oYW5kbGVkUmVqZWN0aW9uKGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5oYW5kbGVkcmVqZWN0aW9uXCIsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZ2xvYmFsLl9fcHVlcnRzR2V0TGFzdEV4Y2VwdGlvbiA9ICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFzdEV4Y2VwdGlvbjtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgLyoqIGNhbGwgd2hlbiB3YXNtIGdyb3cgbWVtb3J5ICovXHJcbiAgICB1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3cyhIRUFQOCwgSEVBUFU4LCBIRUFQMzIsIEhFQVBGMzIsIEhFQVBGNjQpIHtcclxuICAgICAgICBsZXQgdW5pdHlBcGkgPSB0aGlzLnVuaXR5QXBpO1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVA4ID0gSEVBUDg7XHJcbiAgICAgICAgdW5pdHlBcGkuSEVBUFU4ID0gSEVBUFU4O1xyXG4gICAgICAgIHVuaXR5QXBpLkhFQVAzMiA9IEhFQVAzMjtcclxuICAgICAgICB1bml0eUFwaS5IRUFQRjMyID0gSEVBUEYzMjtcclxuICAgICAgICB1bml0eUFwaS5IRUFQRjY0ID0gSEVBUEY2NDtcclxuICAgIH1cclxuICAgIG1lbWNweShkZXN0LCBzcmMsIG51bSkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuSEVBUFU4LmNvcHlXaXRoaW4oZGVzdCwgc3JjLCBzcmMgKyBudW0pO1xyXG4gICAgfVxyXG4gICAgSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgLyoqIG91dCBpbnQgKi8gbGVuZ3RoT2Zmc2V0KSB7XHJcbiAgICAgICAgaWYgKHJldHVyblN0ciA9PT0gbnVsbCB8fCByZXR1cm5TdHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGJ5dGVDb3VudCA9IHRoaXMudW5pdHlBcGkubGVuZ3RoQnl0ZXNVVEY4KHJldHVyblN0cik7XHJcbiAgICAgICAgc2V0T3V0VmFsdWUzMih0aGlzLCBsZW5ndGhPZmZzZXQsIGJ5dGVDb3VudCk7XHJcbiAgICAgICAgbGV0IGJ1ZmZlciA9IHRoaXMudW5pdHlBcGkuX21hbGxvYyhieXRlQ291bnQgKyAxKTtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLnN0cmluZ1RvVVRGOChyZXR1cm5TdHIsIGJ1ZmZlciwgYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgIH1cclxuICAgIEpTU3RyaW5nVG9UZW1wQ1NTdHJpbmcocmV0dXJuU3RyLCAvKiogb3V0IGludCAqLyBsZW5ndGhPZmZzZXQpIHtcclxuICAgICAgICBpZiAocmV0dXJuU3RyID09PSBudWxsIHx8IHJldHVyblN0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnl0ZUNvdW50ID0gdGhpcy51bml0eUFwaS5sZW5ndGhCeXRlc1VURjgocmV0dXJuU3RyKTtcclxuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aE9mZnNldCwgYnl0ZUNvdW50KTtcclxuICAgICAgICBpZiAodGhpcy5zdHJpbmdCdWZmZXJTaXplIDwgYnl0ZUNvdW50ICsgMSkge1xyXG4gICAgICAgICAgICB0aGlzLnVuaXR5QXBpLl9mcmVlKHRoaXMuc3RyQnVmZmVyKTtcclxuICAgICAgICAgICAgdGhpcy5zdHJCdWZmZXIgPSB0aGlzLnVuaXR5QXBpLl9tYWxsb2ModGhpcy5zdHJpbmdCdWZmZXJTaXplID0gTWF0aC5tYXgoMiAqIHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSwgYnl0ZUNvdW50ICsgMSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVuaXR5QXBpLnN0cmluZ1RvVVRGOChyZXR1cm5TdHIsIHRoaXMuc3RyQnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHJCdWZmZXI7XHJcbiAgICB9XHJcbiAgICBKU1N0cmluZ1RvQ1NTdHJpbmdPblN0YWNrKHJldHVyblN0ciwgLyoqIG91dCBpbnQgKi8gbGVuZ3RoT2Zmc2V0KSB7XHJcbiAgICAgICAgaWYgKHJldHVyblN0ciA9PT0gbnVsbCB8fCByZXR1cm5TdHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGJ5dGVDb3VudCA9IHRoaXMudW5pdHlBcGkubGVuZ3RoQnl0ZXNVVEY4KHJldHVyblN0cik7XHJcbiAgICAgICAgc2V0T3V0VmFsdWUzMih0aGlzLCBsZW5ndGhPZmZzZXQsIGJ5dGVDb3VudCk7XHJcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMudW5pdHlBcGkuc3RhY2tBbGxvYyhieXRlQ291bnQgKyAxKTtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLnN0cmluZ1RvVVRGOChyZXR1cm5TdHIsIGJ1ZmZlciwgYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgIH1cclxuICAgIG1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGZ1bmN0aW9uUHRyLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIC8vIOS4jeiDveeUqOeureWktOWHveaVsO+8geatpOWkhOi/lOWbnueahOWHveaVsOS8mui1i+WAvOWIsOWFt+S9k+eahGNsYXNz5LiK77yM5YW2dGhpc+aMh+mSiOacieWQq+S5ieOAglxyXG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XHJcbiAgICAgICAgICAgIGlmIChuZXcudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wibm90IGEgY29uc3RydWN0b3InKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgY2FsbGJhY2tJbmZvUHRyID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRNb2NrUG9pbnRlcihhcmdzKTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5jYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgXHJcbiAgICAgICAgICAgICAgICAvLyBnZXRJbnRQdHJNYW5hZ2VyKCkuR2V0UG9pbnRlckZvckpTVmFsdWUodGhpcyksXHJcbiAgICAgICAgICAgICAgICBpc1N0YXRpYyA/IDAgOiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodGhpcyksIGNhbGxiYWNrSW5mb1B0ciwgYXJncy5sZW5ndGgsIGNhbGxiYWNrSWR4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldFJldHVyblZhbHVlQW5kUmVjeWNsZShjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLlJlbGVhc2VCeU1vY2tJbnRQdHIoY2FsbGJhY2tJbmZvUHRyKTtcclxuICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBzZWxmUHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG4gICAgY2FsbENTaGFycENvbnN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVuaXR5QXBpLl9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxuICAgIGNhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5fQ2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBQdWVydHNKU0VuZ2luZTtcclxuZnVuY3Rpb24gR2V0VHlwZShlbmdpbmUsIHZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG4gICAgaWYgKGlzQmlnSW50KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAyO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHJldHVybiA0O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJldHVybiA4O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuICAgICAgICByZXR1cm4gMTY7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gMjU2O1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xyXG4gICAgICAgIHJldHVybiA1MTI7XHJcbiAgICB9XHJcbiAgICAvLyBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkgeyByZXR1cm4gMTI4IH1cclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgcmV0dXJuIDY0O1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgdmFsdWUgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbiAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICB9XHJcbiAgICBpZiAoZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAzMjtcclxuICAgIH1cclxuICAgIHJldHVybiA2NDtcclxufVxyXG5leHBvcnRzLkdldFR5cGUgPSBHZXRUeXBlO1xyXG5mdW5jdGlvbiBtYWtlQmlnSW50KGxvdywgaGlnaCkge1xyXG4gICAgcmV0dXJuIChCaWdJbnQoaGlnaCkgPDwgMzJuKSB8IEJpZ0ludChsb3cgPj4+IDApO1xyXG59XHJcbmV4cG9ydHMubWFrZUJpZ0ludCA9IG1ha2VCaWdJbnQ7XHJcbmZ1bmN0aW9uIHNldE91dFZhbHVlMzIoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbdmFsdWVQdHIgPj4gMl0gPSB2YWx1ZTtcclxufVxyXG5leHBvcnRzLnNldE91dFZhbHVlMzIgPSBzZXRPdXRWYWx1ZTMyO1xyXG5mdW5jdGlvbiBzZXRPdXRWYWx1ZTgoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOFt2YWx1ZVB0cl0gPSB2YWx1ZTtcclxufVxyXG5leHBvcnRzLnNldE91dFZhbHVlOCA9IHNldE91dFZhbHVlODtcclxuZnVuY3Rpb24gaXNCaWdJbnQodmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIEJpZ0ludCB8fCB0eXBlb2YgdmFsdWUgPT09ICdiaWdpbnQnO1xyXG59XHJcbmV4cG9ydHMuaXNCaWdJbnQgPSBpc0JpZ0ludDtcclxuZnVuY3Rpb24gcmV0dXJuQmlnSW50KGVuZ2luZSwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5fc2V0VGVtcFJldDAoTnVtYmVyKHZhbHVlID4+IDMybikpOyAvLyBoaWdoXHJcbiAgICByZXR1cm4gTnVtYmVyKHZhbHVlICYgMHhmZmZmZmZmZm4pOyAvLyBsb3dcclxufVxyXG5leHBvcnRzLnJldHVybkJpZ0ludCA9IHJldHVybkJpZ0ludDtcclxuZnVuY3Rpb24gd3JpdGVCaWdJbnQoZW5naW5lLCBwdHJJbjMyLCB2YWx1ZSkge1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXSA9IE51bWJlcih2YWx1ZSAmIDB4ZmZmZmZmZmZuKTsgLy8gbG93XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzIgKyAxXSA9IE51bWJlcih2YWx1ZSA+PiAzMm4pOyAvLyBoaWdoXHJcbn1cclxuY29uc3QgdG1wSW50M0FyciA9IG5ldyBJbnQzMkFycmF5KDIpO1xyXG5jb25zdCB0bXBGbG9hdDY0QXJyID0gbmV3IEZsb2F0NjRBcnJheSh0bXBJbnQzQXJyLmJ1ZmZlcik7XHJcbmZ1bmN0aW9uIHdyaXRlTnVtYmVyKGVuZ2luZSwgcHRySW4zMiwgdmFsdWUpIHtcclxuICAgIC8vIG51bWJlciBpbiBqcyBpcyBkb3VibGVcclxuICAgIHRtcEZsb2F0NjRBcnJbMF0gPSB2YWx1ZTtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMl0gPSB0bXBJbnQzQXJyWzBdO1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyICsgMV0gPSB0bXBJbnQzQXJyWzFdO1xyXG59XHJcbmZ1bmN0aW9uICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKGVuZ2luZSwgdmFsLCBqc1ZhbHVlVHlwZSwgdmFsUHRySW4zMikge1xyXG4gICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHN3aXRjaCAoanNWYWx1ZVR5cGUpIHtcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgIHdyaXRlQmlnSW50KGVuZ2luZSwgdmFsUHRySW4zMiwgdmFsKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSA0OlxyXG4gICAgICAgICAgICB3cml0ZU51bWJlcihlbmdpbmUsIHZhbFB0ckluMzIsICt2YWwpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDUxMjpcclxuICAgICAgICAgICAgd3JpdGVOdW1iZXIoZW5naW5lLCB2YWxQdHJJbjMyLCB2YWwuZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gJEdldEFyZ3VtZW50RmluYWxWYWx1ZShlbmdpbmUsIHZhbCwganNWYWx1ZVR5cGUsIGxlbmd0aE9mZnNldCkge1xyXG4gICAgaWYgKCFqc1ZhbHVlVHlwZSlcclxuICAgICAgICBqc1ZhbHVlVHlwZSA9IEdldFR5cGUoZW5naW5lLCB2YWwpO1xyXG4gICAgc3dpdGNoIChqc1ZhbHVlVHlwZSkge1xyXG4gICAgICAgIGNhc2UgODogcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmdPblN0YWNrKHZhbCwgbGVuZ3RoT2Zmc2V0KTtcclxuICAgICAgICBjYXNlIDE2OiByZXR1cm4gK3ZhbDtcclxuICAgICAgICBjYXNlIDMyOiByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHZhbCk7XHJcbiAgICAgICAgY2FzZSA2NDogcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdCh2YWwpLmlkO1xyXG4gICAgICAgIGNhc2UgMTI4OiByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KHZhbCkuaWQ7XHJcbiAgICAgICAgY2FzZSAyNTY6IHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbih2YWwpLmlkO1xyXG4gICAgICAgIGNhc2UgMTAyNDoge1xyXG4gICAgICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpXHJcbiAgICAgICAgICAgICAgICB2YWwgPSBuZXcgVWludDhBcnJheSh2YWwpO1xyXG4gICAgICAgICAgICBsZXQgcHRyID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2ModmFsLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUFU4LnNldCh2YWwsIHB0cik7XHJcbiAgICAgICAgICAgIHNldE91dFZhbHVlMzIoZW5naW5lLCBsZW5ndGhPZmZzZXQsIHZhbC5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHB0cjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGlicmFyeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldE51bWJlckZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogbnVtYmVyIHtcclxuLy8gICAgIHJldHVybiBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXREYXRlRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBudW1iZXIge1xyXG4vLyAgICAgcmV0dXJuIChlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpIGFzIERhdGUpLmdldFRpbWUoKTtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0U3RyaW5nRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIC8qb3V0IGludCAqL2xlbmd0aE9mZnNldDogbnVtYmVyLCBpc0J5UmVmOiBib29sKTogbnVtYmVyIHtcclxuLy8gICAgIHZhciByZXR1cm5TdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8c3RyaW5nPih2YWx1ZSk7XHJcbi8vICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhyZXR1cm5TdHIsIGxlbmd0aE9mZnNldCk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEJvb2xlYW5Gcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IGJvb2xlYW4ge1xyXG4vLyAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIFZhbHVlSXNCaWdJbnQoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IGJvb2xlYW4ge1xyXG4vLyAgICAgdmFyIGJpZ2ludCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxhbnk+KHZhbHVlKTtcclxuLy8gICAgIHJldHVybiBiaWdpbnQgaW5zdGFuY2VvZiBCaWdJbnQ7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEJpZ0ludEZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XHJcbi8vICAgICB2YXIgYmlnaW50ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPGFueT4odmFsdWUpO1xyXG4vLyAgICAgcmV0dXJuIGJpZ2ludDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0T2JqZWN0RnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcclxuLy8gICAgIHZhciBuYXRpdmVPYmplY3QgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4vLyAgICAgcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChuYXRpdmVPYmplY3QpO1xyXG4vLyB9XHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRGdW5jdGlvbkZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogSlNGdW5jdGlvblB0ciB7XHJcbi8vICAgICB2YXIgZnVuYyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjwoLi4uYXJnczogYW55W10pID0+IGFueT4odmFsdWUpO1xyXG4vLyAgICAgdmFyIGpzZnVuYyA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmMpO1xyXG4vLyAgICAgcmV0dXJuIGpzZnVuYy5pZDtcclxuLy8gfVxyXG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0SlNPYmplY3RGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4vLyAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjwoLi4uYXJnczogYW55W10pID0+IGFueT4odmFsdWUpO1xyXG4vLyAgICAgdmFyIGpzb2JqID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KG9iaik7XHJcbi8vICAgICByZXR1cm4ganNvYmouaWQ7XHJcbi8vIH1cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEFycmF5QnVmZmVyRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIC8qb3V0IGludCAqL2xlbmd0aE9mZnNldDogYW55LCBpc091dDogYm9vbCkge1xyXG4vLyAgICAgdmFyIGFiID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPEFycmF5QnVmZmVyPih2YWx1ZSk7XHJcbi8vICAgICBpZiAoYWIgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbi8vICAgICAgICAgYWIgPSBhYi5idWZmZXI7XHJcbi8vICAgICB9XHJcbi8vICAgICB2YXIgcHRyID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoYWIuYnl0ZUxlbmd0aCk7XHJcbi8vICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDguc2V0KG5ldyBJbnQ4QXJyYXkoYWIpLCBwdHIpO1xyXG4vLyAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltsZW5ndGhPZmZzZXQgPj4gMl0gPSBhYi5ieXRlTGVuZ3RoO1xyXG4vLyAgICAgc2V0T3V0VmFsdWUzMihlbmdpbmUsIGxlbmd0aE9mZnNldCwgYWIuYnl0ZUxlbmd0aCk7XHJcbi8vICAgICByZXR1cm4gcHRyO1xyXG4vLyB9XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPkvqfojrflj5ZKU+iwg+eUqOWPguaVsOeahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgLyoqKioqKioqKioq6L+Z6YOo5YiG546w5Zyo6YO95pivQysr5a6e546w55qEKioqKioqKioqKioqL1xyXG4gICAgICAgIC8vIEdldE51bWJlckZyb21WYWx1ZTogR2V0TnVtYmVyRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXREYXRlRnJvbVZhbHVlOiBHZXREYXRlRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRTdHJpbmdGcm9tVmFsdWU6IEdldFN0cmluZ0Zyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0Qm9vbGVhbkZyb21WYWx1ZTogR2V0Qm9vbGVhbkZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gVmFsdWVJc0JpZ0ludDogVmFsdWVJc0JpZ0ludC5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0QmlnSW50RnJvbVZhbHVlOiBHZXRCaWdJbnRGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldE9iamVjdEZyb21WYWx1ZTogR2V0T2JqZWN0RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRGdW5jdGlvbkZyb21WYWx1ZTogR2V0RnVuY3Rpb25Gcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEpTT2JqZWN0RnJvbVZhbHVlOiBHZXRKU09iamVjdEZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWU6IEdldEFycmF5QnVmZmVyRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRBcmd1bWVudFR5cGU6IGZ1bmN0aW9uIChpc29sYXRlOiBJbnRQdHIsIGluZm86IE1vY2tJbnRQdHIsIGluZGV4OiBpbnQsIGlzQnlSZWY6IGJvb2wpIHtcclxuICAgICAgICAvLyAgICAgdmFyIHZhbHVlID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbywgZW5naW5lKS5hcmdzW2luZGV4XTtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIEdldFR5cGUoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgLy8gfSxcclxuICAgICAgICAvLyAvKipcclxuICAgICAgICAvLyAgKiDkuLpjI+S+p+aPkOS+m+S4gOS4quiOt+WPlmNhbGxiYWNraW5mb+mHjGpzdmFsdWXnmoRpbnRwdHLnmoTmjqXlj6NcclxuICAgICAgICAvLyAgKiDlubbkuI3mmK/lvpfnmoTliLDov5nkuKphcmd1bWVudOeahOWAvFxyXG4gICAgICAgIC8vICAqXHJcbiAgICAgICAgLy8gICog6K+l5o6l5Y+j5Y+q5pyJ5L2N6L+Q566X77yM55SxQysr5a6e546wXHJcbiAgICAgICAgLy8gICovXHJcbiAgICAgICAgLy8gR2V0QXJndW1lbnRWYWx1ZS8qaW5DYWxsYmFja0luZm8qLzogZnVuY3Rpb24gKGluZm9wdHI6IE1vY2tJbnRQdHIsIGluZGV4OiBpbnQpIHtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIGluZm9wdHIgfCBpbmRleDtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIC8vIEdldEpzVmFsdWVUeXBlOiBmdW5jdGlvbiAoaXNvbGF0ZTogSW50UHRyLCB2YWw6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcclxuICAgICAgICAvLyAgICAgLy8gcHVibGljIGVudW0gSnNWYWx1ZVR5cGVcclxuICAgICAgICAvLyAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICAvLyAgICAgTnVsbE9yVW5kZWZpbmVkID0gMSxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEJpZ0ludCA9IDIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBOdW1iZXIgPSA0LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgU3RyaW5nID0gOCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEJvb2xlYW4gPSAxNixcclxuICAgICAgICAvLyAgICAgLy8gICAgIE5hdGl2ZU9iamVjdCA9IDMyLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgSnNPYmplY3QgPSA2NCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEFycmF5ID0gMTI4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgRnVuY3Rpb24gPSAyNTYsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBEYXRlID0gNTEyLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQXJyYXlCdWZmZXIgPSAxMDI0LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgVW5rbm93ID0gMjA0OCxcclxuICAgICAgICAvLyAgICAgLy8gICAgIEFueSA9IE51bGxPclVuZGVmaW5lZCB8IEJpZ0ludCB8IE51bWJlciB8IFN0cmluZyB8IEJvb2xlYW4gfCBOYXRpdmVPYmplY3QgfCBBcnJheSB8IEZ1bmN0aW9uIHwgRGF0ZSB8IEFycmF5QnVmZmVyLFxyXG4gICAgICAgIC8vICAgICAvLyB9O1xyXG4gICAgICAgIC8vICAgICB2YXIgdmFsdWU6IGFueSA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbCwgZW5naW5lKTtcclxuICAgICAgICAvLyAgICAgcmV0dXJuIEdldFR5cGUoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgLy8gfSxcclxuICAgICAgICAvKioqKioqKioqKirku6XkuIrnjrDlnKjpg73mmK9DKyvlrp7njrDnmoQqKioqKioqKioqKiovXHJcbiAgICAgICAgR2V0VHlwZUlkRnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIGlmIChpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICBvYmogPSBvYmpbMF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHR5cGVpZCA9IDA7XHJcbiAgICAgICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gb2JqLl9mdW5jW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IG9ialtcIiRjaWRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0eXBlaWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVpZDtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2V0RnJvbUpTQXJndW1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBDI+iwg+eUqEpT5pe277yM6I635Y+WSlPlh73mlbDov5Tlm57lgLxcclxuICpcclxuICog5Y6f5pyJ55qEcmVzdWx0SW5mb+iuvuiuoeWHuuadpeWPquaYr+S4uuS6huiuqeWkmmlzb2xhdGXml7bog73lnKjkuI3lkIznmoRpc29sYXRl6YeM5L+d5oyB5LiN5ZCM55qEcmVzdWx0XHJcbiAqIOWcqFdlYkdM5qih5byP5LiL5rKh5pyJ6L+Z5Liq54Om5oG877yM5Zug5q2k55u05o6l55SoZW5naW5l55qE5Y2z5Y+vXHJcbiAqIHJlc3VsdEluZm/lm7rlrprkuLoxMDI0XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgR2V0TnVtYmVyRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXREYXRlRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQuZ2V0VGltZSgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0U3RyaW5nRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvVGVtcENTU3RyaW5nKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQsIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRCb29sZWFuRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXN1bHRJc0JpZ0ludDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuaXNCaWdJbnQpKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0QmlnSW50RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgLy8gcHVlcnRzIGNvcmUgdjIuMC405byA5aeL5pSv5oyBXHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgbGlicmFyeV8xLnJldHVybkJpZ0ludCkoZW5naW5lLCBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldE9iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRUeXBlSWRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgICAgICB2YXIgdHlwZWlkID0gMDtcclxuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IHZhbHVlLl9mdW5jW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IHZhbHVlW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZmluZCB0eXBlaWQgZm9yJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0RnVuY3Rpb25Gcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0SlNPYmplY3RGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIganNvYmogPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgICAgICByZXR1cm4ganNvYmouaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRBcnJheUJ1ZmZlckZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvLCAvKm91dCBpbnQgKi8gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBhYiA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4LnNldChuZXcgSW50OEFycmF5KGFiKSwgcHRyKTtcclxuICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5zZXRPdXRWYWx1ZTMyKShlbmdpbmUsIGxlbmd0aCwgYWIuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBwdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvL+S/neWuiOaWueahiFxyXG4gICAgICAgIEdldFJlc3VsdFR5cGU6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgbGlicmFyeV8xLkdldFR5cGUpKGVuZ2luZSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2V0RnJvbUpTUmV0dXJuLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICog5rOo5YaM57G7QVBJ77yM5aaC5rOo5YaM5YWo5bGA5Ye95pWw44CB5rOo5YaM57G777yM5Lul5Y+K57G755qE5bGe5oCn5pa55rOV562JXHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFJlZ2lzdGVyQVBJKGVuZ2luZSkge1xyXG4gICAgY29uc3QgcmV0dXJuZWUgPSB7XHJcbiAgICAgICAgU2V0R2xvYmFsRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBuYW1lU3RyaW5nLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIGpzRW52SWR4LCBjYWxsYmFja2lkeCkge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgbGlicmFyeV8xLmdsb2JhbFtuYW1lXSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKHRydWUsIHY4RnVuY3Rpb25DYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX1JlZ2lzdGVyQ2xhc3M6IGZ1bmN0aW9uIChpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIGpzRW52SWR4LCBjYWxsYmFja2lkeCwgc2l6ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBmdWxsTmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoZnVsbE5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICBjb25zdCBjc2hhcnBPYmplY3RNYXAgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwO1xyXG4gICAgICAgICAgICBjb25zdCBpZCA9IGNzaGFycE9iamVjdE1hcC5jbGFzc2VzLmxlbmd0aDtcclxuICAgICAgICAgICAgbGV0IHRlbXBFeHRlcm5hbENTSUQgPSAwO1xyXG4gICAgICAgICAgICBjb25zdCBjdG9yID0gZnVuY3Rpb24gTmF0aXZlT2JqZWN0KCkge1xyXG4gICAgICAgICAgICAgICAgLy8g6K6+572u57G75Z6LSURcclxuICAgICAgICAgICAgICAgIHRoaXNbXCIkY2lkXCJdID0gaWQ7XHJcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmVPYmplY3TnmoTmnoTpgKDlh73mlbBcclxuICAgICAgICAgICAgICAgIC8vIOaehOmAoOWHveaVsOacieS4pOS4quiwg+eUqOeahOWcsOaWue+8mjEuIGpz5L6nbmV35LiA5Liq5a6D55qE5pe25YCZIDIuIGNz5L6n5Yib5bu65LqG5LiA5Liq5a+56LGh6KaB5Lyg5YiwanPkvqfml7ZcclxuICAgICAgICAgICAgICAgIC8vIOesrOS4gOS4quaDheWGte+8jGNz5a+56LGhSUTmiJbogIXmmK9jYWxsVjhDb25zdHJ1Y3RvckNhbGxiYWNr6L+U5Zue55qE44CCXHJcbiAgICAgICAgICAgICAgICAvLyDnrKzkuozkuKrmg4XlhrXvvIzliJljc+WvueixoUlE5pivY3MgbmV35a6M5LmL5ZCO5LiA5bm25Lyg57uZanPnmoTjgIJcclxuICAgICAgICAgICAgICAgIGxldCBjc0lEID0gdGVtcEV4dGVybmFsQ1NJRDsgLy8g5aaC5p6c5piv56ys5LqM5Liq5oOF5Ya177yM5q2kSUTnlLFjcmVhdGVGcm9tQ1Porr7nva5cclxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNzSUQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFja0luZm9QdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOiZveeEtnB1ZXJ0c+WGhUNvbnN0cnVjdG9y55qE6L+U5Zue5YC85Y+rc2VsZu+8jOS9huWug+WFtuWunuWwseaYr0NT5a+56LGh55qE5LiA5LiqaWTogIzlt7LjgIJcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc0lEID0gZW5naW5lLmNhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGNvbnN0cnVjdG9yLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLlJlbGVhc2VCeU1vY2tJbnRQdHIoY2FsbGJhY2tJbmZvUHRyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIGJsaXR0YWJsZVxyXG4gICAgICAgICAgICAgICAgaWYgKHNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY3NOZXdJRCA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKHNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5tZW1jcHkoY3NOZXdJRCwgY3NJRCwgc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc05ld0lELCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzTmV3SUQsIChjc0lkZW50aWZpZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLnJlbW92ZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuX2ZyZWUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5hZGQoY3NJRCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5PbkZpbmFsaXplKSh0aGlzLCBjc0lELCAoY3NJZGVudGlmaWVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5yZW1vdmUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmNhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2soZGVzdHJ1Y3RvciB8fCBlbmdpbmUuZ2VuZXJhbERlc3RydWN0b3IsIGNzSWRlbnRpZmllciwgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjdG9yLmNyZWF0ZUZyb21DUyA9IGZ1bmN0aW9uIChjc0lEKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wRXh0ZXJuYWxDU0lEID0gY3NJRDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY3RvcigpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjdG9yLl9fcHVlcnRzTWV0YWRhdGEgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBcIm5hbWVcIiwgeyB2YWx1ZTogZnVsbE5hbWUgKyBcIkNvbnN0cnVjdG9yXCIgfSk7XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBcIiRjaWRcIiwgeyB2YWx1ZTogaWQgfSk7XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5jbGFzc2VzLnB1c2goY3Rvcik7XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5jbGFzc0lEV2Vha01hcC5zZXQoY3RvciwgaWQpO1xyXG4gICAgICAgICAgICBpZiAoQmFzZVR5cGVJZCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGN0b3IucHJvdG90eXBlLl9fcHJvdG9fXyA9IGNzaGFycE9iamVjdE1hcC5jbGFzc2VzW0Jhc2VUeXBlSWRdLnByb3RvdHlwZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAubmFtZXNUb0NsYXNzZXNJRFtmdWxsTmFtZV0gPSBpZDtcclxuICAgICAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJTdHJ1Y3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIC8qbG9uZyAqLyBqc0VudklkeCwgY2FsbGJhY2tpZHgsIHNpemUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldHVybmVlLl9SZWdpc3RlckNsYXNzKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwgY2FsbGJhY2tpZHgsIGNhbGxiYWNraWR4LCBzaXplKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlZ2lzdGVyRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBjbGFzc0lELCBuYW1lU3RyaW5nLCBpc1N0YXRpYywgY2FsbGJhY2ssIC8qbG9uZyAqLyBqc0VudklkeCwgY2FsbGJhY2tpZHgpIHtcclxuICAgICAgICAgICAgdmFyIGNscyA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcclxuICAgICAgICAgICAgaWYgKCFjbHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgZm4gPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgY2FsbGJhY2ssIGNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgY2xzW25hbWVdID0gZm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjbHMucHJvdG90eXBlW25hbWVdID0gZm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlZ2lzdGVyUHJvcGVydHk6IGZ1bmN0aW9uIChpc29sYXRlLCBjbGFzc0lELCBuYW1lU3RyaW5nLCBpc1N0YXRpYywgZ2V0dGVyLCBcclxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyanNFbnZJZHgsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBnZXR0ZXJjYWxsYmFja2lkeCwgc2V0dGVyLCBcclxuICAgICAgICAvKmxvbmcgKi8gc2V0dGVyanNFbnZJZHgsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJjYWxsYmFja2lkeCwgZG9udERlbGV0ZSkge1xyXG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgICAgICBpZiAoIWNscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgYXR0ciA9IHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogIWRvbnREZWxldGUsXHJcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAoZ2V0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICBhdHRyLmdldCA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBnZXR0ZXIsIGdldHRlcmNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc2V0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICBhdHRyLnNldCA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBzZXR0ZXIsIHNldHRlcmNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbHMsIG5hbWUsIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscy5wcm90b3R5cGUsIG5hbWUsIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbiAgICByZXR1cm4gcmV0dXJuZWU7XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlZ2lzdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogQyPosIPnlKhKU+aXtu+8jOiuvue9ruiwg+eUqOWPguaVsOeahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0ludm9rZUpTQXJndW1lbnRBcGkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC8vYmVnaW4gY3MgY2FsbCBqc1xyXG4gICAgICAgIFB1c2hOdWxsRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobnVsbCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoRGF0ZUZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGRhdGVWYWx1ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobmV3IERhdGUoZGF0ZVZhbHVlKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoQm9vbGVhbkZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGIpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKCEhYik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoQmlnSW50Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypsb25nICovIGxvbmdsb3csIGxvbmdoaWdoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaCgoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvbmdsb3csIGxvbmdoaWdoKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoU3RyaW5nRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgc3RyU3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZykpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaE51bWJlckZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGQpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaE9iamVjdEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGNsYXNzSUQsIG9iamVjdElEKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChvYmplY3RJRCwgY2xhc3NJRCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEpTRnVuY3Rpb25Gb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBKU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChKU0Z1bmN0aW9uKS5fZnVuYyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoSlNPYmplY3RGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBKU09iamVjdCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNPYmplY3RCeUlkKEpTT2JqZWN0KS5nZXRPYmplY3QoKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoQXJyYXlCdWZmZXJGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKmJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9JbnZva2VKU0FyZ3VtZW50QXBpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0ludm9rZUpTQXJndW1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPorr7nva7ov5Tlm57liLBKU+eahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0pTSW52b2tlUmV0dXJuQXBpKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBSZXR1cm5DbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGNsYXNzSUQpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgY2xhc3NJRCwgc2VsZikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChzZWxmLCBjbGFzc0lEKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybk51bWJlcjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBudW1iZXI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5TdHJpbmc6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBzdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5CaWdJbnQ6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBsb25nTG93LCBsb25nSGlnaCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSAoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvbmdMb3csIGxvbmdIaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkJvb2xlYW46IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBiKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9ICEhYjsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkRhdGU6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBkYXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuTnVsbDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8pIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgSlNGdW5jdGlvblB0cikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjb25zdCBqc0Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChKU0Z1bmN0aW9uUHRyKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0ganNGdW5jLl9mdW5jO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuSlNPYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBKU09iamVjdFB0cikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjb25zdCBqc09iamVjdCA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTT2JqZWN0QnlJZChKU09iamVjdFB0cik7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGpzT2JqZWN0LmdldE9iamVjdCgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQ1NoYXJwRnVuY3Rpb25DYWxsYmFjazogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHY4RnVuY3Rpb25DYWxsYmFjaywgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJMb3csIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVySGlnaCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihmYWxzZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBwb2ludGVySGlnaCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5DU2hhcnBGdW5jdGlvbkNhbGxiYWNrMjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHY4RnVuY3Rpb25DYWxsYmFjaywgSnNGdW5jdGlvbkZpbmFsaXplLCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckxvdywgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJIaWdoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGZhbHNlLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIHBvaW50ZXJIaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkFycmF5QnVmZmVyOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgLypieXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9KU0ludm9rZVJldHVybkFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9KU0ludm9rZVJldHVybi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEpT6LCD55SoQyPml7bvvIxDI+S+p+iuvue9rm91dOWPguaVsOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0pTT3V0QXJndW1lbnRBUEkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIFNldE51bWJlclRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBudW1iZXI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXREYXRlVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBkYXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBuZXcgRGF0ZShkYXRlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldFN0cmluZ1RvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgc3RyU3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKTtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IHN0cjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldEJvb2xlYW5Ub091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGIpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9ICEhYjsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldEJpZ0ludFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgbG93LCBoaWdoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9ICgwLCBsaWJyYXJ5XzEubWFrZUJpZ0ludCkobG93LCBoaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldE9iamVjdFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgY2xhc3NJRCwgc2VsZikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qoc2VsZiwgY2xhc3NJRCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXROdWxsVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBudWxsOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0QXJyYXlCdWZmZXJUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIC8qQnl0ZVtdICovIGluZGV4LCBsZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0pTT3V0QXJndW1lbnRBUEk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSlNPdXRBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLlBBcGlSZWdzdGVyQXBpID0gZXhwb3J0cy5HZXRXZWJHTEZGSUFwaSA9IHZvaWQgMDtcclxuLy8gLS0tLS0tLS0tLS0tLS0tIOWAvOWIm+W7uuezu+WIlyAtLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9udWxsKGVudikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV9udWxsIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfdW5kZWZpbmVkKGVudikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV91bmRlZmluZWQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9ib29sZWFuKGVudiwgdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfYm9vbGVhbiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2ludDMyKGVudiwgdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfaW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuLy8g57G75Ly85Zyw5aSE55CG5YW25LuW5Z+656GA57G75Z6L5Yib5bu65Ye95pWwXHJcbmZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfdWludDMyKGVudiwgdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfdWludDMyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfaW50NjQoZW52LCB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV9pbnQ2NCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfY3JlYXRlX3VpbnQ2NChlbnYsIHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX3VpbnQ2NCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2RvdWJsZShlbnYsIHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2RvdWJsZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfY3JlYXRlX3N0cmluZ191dGY4KGVudiwgc3RyLCBsZW5ndGgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfc3RyaW5nX3V0Zjggbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9iaW5hcnkoZW52LCBiaW4sIGxlbmd0aCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2NyZWF0ZV9iaW5hcnkgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9hcnJheShlbnYpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfYXJyYXkgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2NyZWF0ZV9vYmplY3QoZW52KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX29iamVjdCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2Z1bmN0aW9uKGVudiwgbmF0aXZlX2ltcGwsIGRhdGEsIGZpbmFsaXplKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2Z1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9jcmVhdGVfY2xhc3MoZW52LCB0eXBlX2lkKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2NsYXNzIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbi8vIC0tLS0tLS0tLS0tLS0tLSDlgLzojrflj5bns7vliJcgLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfYm9vbChlbnYsIHB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF92YWx1ZV9ib29sIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfaW50MzIoZW52LCBwdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfaW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuLy8g57G75Ly85aSE55CG5YW25LuW57G75Z6L6I635Y+WXHJcbmZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfdWludDMyKGVudiwgcHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX3VpbnQzMiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2ludDY0KGVudiwgcHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX2ludDY0IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfdWludDY0KGVudiwgcHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX3VpbnQ2NCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfZ2V0X3ZhbHVlX2RvdWJsZShlbnYsIHB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF92YWx1ZV9kb3VibGUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV9zdHJpbmdfdXRmOChlbnYsIHB2YWx1ZSwgYnVmLCBidWZzaXplKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX3N0cmluZ191dGY4IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9nZXRfdmFsdWVfYmluYXJ5KGVudiwgcHZhbHVlLCBidWZzaXplKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X3ZhbHVlX2JpbmFyeSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfZ2V0X2FycmF5X2xlbmd0aChlbnYsIHB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9hcnJheV9sZW5ndGggbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuLy8gLS0tLS0tLS0tLS0tLS0tIOexu+Wei+ajgOafpeezu+WIlyAtLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gcGVzYXBpX2lzX251bGwoZW52LCBwdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19udWxsIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9pc191bmRlZmluZWQoZW52LCBwdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc191bmRlZmluZWQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2lzX2Jvb2xlYW4oZW52LCBwdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19ib29sZWFuIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9pc19pbnQzMihlbnYsIHB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2ludDMyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9pc191aW50MzIoZW52LCBwdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc191aW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2lzX2ludDY0KGVudiwgcHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfaW50NjQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2lzX3VpbnQ2NChlbnYsIHB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX3VpbnQ2NCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfaXNfZG91YmxlKGVudiwgcHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfZG91YmxlIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9pc19zdHJpbmcoZW52LCBwdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19zdHJpbmcgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2lzX29iamVjdChlbnYsIHB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX29iamVjdCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfaXNfZnVuY3Rpb24oZW52LCBwdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9pc19mdW5jdGlvbiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfaXNfYmluYXJ5KGVudiwgcHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfYmluYXJ5IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9pc19hcnJheShlbnYsIHB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2FycmF5IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbi8vIC0tLS0tLS0tLS0tLS0tLSDlr7nosaHmk43kvZzns7vliJcgLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHBlc2FwaV9uYXRpdmVfb2JqZWN0X3RvX3ZhbHVlKGVudiwgdHlwZV9pZCwgb2JqZWN0X3B0ciwgY2FsbF9maW5hbGl6ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX25hdGl2ZV9vYmplY3RfdG9fdmFsdWUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2dldF9uYXRpdmVfb2JqZWN0X3B0cihlbnYsIHB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9uYXRpdmVfb2JqZWN0X3B0ciBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfZ2V0X25hdGl2ZV9vYmplY3RfdHlwZWlkKGVudiwgcHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X25hdGl2ZV9vYmplY3RfdHlwZWlkIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9pc19pbnN0YW5jZV9vZihlbnYsIHR5cGVfaWQsIHB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2lzX2luc3RhbmNlX29mIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbi8vIC0tLS0tLS0tLS0tLS0tLSDoo4XnrrEv5ouG566xIC0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBwZXNhcGlfYm94aW5nKGVudiwgcHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfYm94aW5nIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV91bmJveGluZyhlbnYsIHBfYm94ZWRfdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV91bmJveGluZyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfdXBkYXRlX2JveGVkX3ZhbHVlKGVudiwgcF9ib3hlZF92YWx1ZSwgcHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfdXBkYXRlX2JveGVkX3ZhbHVlIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9pc19ib3hlZF92YWx1ZShlbnYsIHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfaXNfYm94ZWRfdmFsdWUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuLy8gLS0tLS0tLS0tLS0tLS0tIOWHveaVsOiwg+eUqOebuOWFsyAtLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gcGVzYXBpX2dldF9hcmdzX2xlbihwaW5mbykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9hcmdzX2xlbiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfZ2V0X2FyZyhwaW5mbywgaW5kZXgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfYXJnIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9nZXRfZW52KHBpbmZvKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2VudiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfZ2V0X3RoaXMocGluZm8pIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdGhpcyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfZ2V0X2hvbGRlcihwaW5mbykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9ob2xkZXIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2dldF91c2VyZGF0YShwaW5mbykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF91c2VyZGF0YSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfYWRkX3JldHVybihwaW5mbywgdmFsdWUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9hZGRfcmV0dXJuIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV90aHJvd19ieV9zdHJpbmcocGluZm8sIG1zZykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3Rocm93X2J5X3N0cmluZyBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG4vLyAtLS0tLS0tLS0tLS0tLS0g546v5aKD5byV55SoIC0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBwZXNhcGlfY3JlYXRlX2Vudl9yZWYoZW52KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY3JlYXRlX2Vudl9yZWYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2Vudl9yZWZfaXNfdmFsaWQocGVudl9yZWYpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9lbnZfcmVmX2lzX3ZhbGlkIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9nZXRfZW52X2Zyb21fcmVmKHBlbnZfcmVmKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfZ2V0X2Vudl9mcm9tX3JlZiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfZHVwbGljYXRlX2Vudl9yZWYocGVudl9yZWYpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9kdXBsaWNhdGVfZW52X3JlZiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfcmVsZWFzZV9lbnZfcmVmKHBlbnZfcmVmKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfcmVsZWFzZV9lbnZfcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbi8vIC0tLS0tLS0tLS0tLS0tLSDkvZznlKjln5/nrqHnkIYgLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHBlc2FwaV9vcGVuX3Njb3BlKHBlbnZfcmVmKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfb3Blbl9zY29wZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfb3Blbl9zY29wZV9wbGFjZW1lbnQocGVudl9yZWYsIG1lbW9yeSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX29wZW5fc2NvcGVfcGxhY2VtZW50IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9oYXNfY2F1Z2h0KHBzY29wZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2hhc19jYXVnaHQgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2dldF9leGNlcHRpb25fYXNfc3RyaW5nKHBzY29wZSwgd2l0aF9zdGFjaykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9leGNlcHRpb25fYXNfc3RyaW5nIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9jbG9zZV9zY29wZShwc2NvcGUpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jbG9zZV9zY29wZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfY2xvc2Vfc2NvcGVfcGxhY2VtZW50KHBzY29wZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2Nsb3NlX3Njb3BlX3BsYWNlbWVudCBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG4vLyAtLS0tLS0tLS0tLS0tLS0g5YC85byV55SoIC0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBwZXNhcGlfY3JlYXRlX3ZhbHVlX3JlZihlbnYsIHB2YWx1ZSwgaW50ZXJuYWxfZmllbGRfY291bnQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9kdXBsaWNhdGVfdmFsdWVfcmVmKHB2YWx1ZV9yZWYpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9kdXBsaWNhdGVfdmFsdWVfcmVmIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9yZWxlYXNlX3ZhbHVlX3JlZihwdmFsdWVfcmVmKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfcmVsZWFzZV92YWx1ZV9yZWYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2dldF92YWx1ZV9mcm9tX3JlZihlbnYsIHB2YWx1ZV9yZWYpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfdmFsdWVfZnJvbV9yZWYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX3NldF9yZWZfd2VhayhlbnYsIHB2YWx1ZV9yZWYpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcmVmX3dlYWsgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX3NldF9vd25lcihlbnYsIHB2YWx1ZSwgcG93bmVyKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfc2V0X293bmVyIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9nZXRfcmVmX2Fzc29jaWF0ZWRfZW52KHZhbHVlX3JlZikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9yZWZfYXNzb2NpYXRlZF9lbnYgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX2dldF9yZWZfaW50ZXJuYWxfZmllbGRzKHB2YWx1ZV9yZWYsIHBpbnRlcm5hbF9maWVsZF9jb3VudCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9yZWZfaW50ZXJuYWxfZmllbGRzIG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbi8vIC0tLS0tLS0tLS0tLS0tLSDlsZ7mgKfmk43kvZwgLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHBlc2FwaV9nZXRfcHJvcGVydHkoZW52LCBwb2JqZWN0LCBrZXkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfcHJvcGVydHkgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX3NldF9wcm9wZXJ0eShlbnYsIHBvYmplY3QsIGtleSwgcHZhbHVlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfc2V0X3Byb3BlcnR5IG5vdCBpbXBsZW1lbnRlZCB5ZXQhXCIpO1xyXG59XHJcbmZ1bmN0aW9uIHBlc2FwaV9nZXRfcHJpdmF0ZShlbnYsIHBvYmplY3QsIG91dF9wdHIpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfcHJpdmF0ZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfc2V0X3ByaXZhdGUoZW52LCBwb2JqZWN0LCBwdHIpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9zZXRfcHJpdmF0ZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfZ2V0X3Byb3BlcnR5X3VpbnQzMihlbnYsIHBvYmplY3QsIGtleSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2dldF9wcm9wZXJ0eV91aW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX3NldF9wcm9wZXJ0eV91aW50MzIoZW52LCBwb2JqZWN0LCBrZXksIHB2YWx1ZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9wcm9wZXJ0eV91aW50MzIgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuLy8gLS0tLS0tLS0tLS0tLS0tIOWHveaVsOiwg+eUqC/miafooYwgLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHBlc2FwaV9jYWxsX2Z1bmN0aW9uKGVudiwgcGZ1bmMsIHRoaXNfb2JqZWN0LCBhcmdjLCBhcmd2KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwZXNhcGlfY2FsbF9mdW5jdGlvbiBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5mdW5jdGlvbiBwZXNhcGlfZXZhbChlbnYsIGNvZGUsIGNvZGVfc2l6ZSwgcGF0aCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX2V2YWwgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuLy8gLS0tLS0tLS0tLS0tLS0tIOWFqOWxgOWvueixoSAtLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gcGVzYXBpX2dsb2JhbChlbnYpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nbG9iYWwgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuLy8gLS0tLS0tLS0tLS0tLS0tIOeOr+Wig+engeacieaVsOaNriAtLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gcGVzYXBpX2dldF9lbnZfcHJpdmF0ZShlbnYpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcInBlc2FwaV9nZXRfZW52X3ByaXZhdGUgbm90IGltcGxlbWVudGVkIHlldCFcIik7XHJcbn1cclxuZnVuY3Rpb24gcGVzYXBpX3NldF9lbnZfcHJpdmF0ZShlbnYsIHB0cikge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGVzYXBpX3NldF9lbnZfcHJpdmF0ZSBub3QgaW1wbGVtZW50ZWQgeWV0IVwiKTtcclxufVxyXG5jb25zdCBhcGlJbmZvID0gW1xyXG4gICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX251bGwsIHNpZzogXCJpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfdW5kZWZpbmVkLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2Jvb2xlYW4sIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2ludDMyLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV91aW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2ludDY0LCBzaWc6IFwiaWppXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV91aW50NjQsIHNpZzogXCJpamlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfY3JlYXRlX2RvdWJsZSwgc2lnOiBcImlpZFwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfc3RyaW5nX3V0ZjgsIHNpZzogXCJpaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9iaW5hcnksIHNpZzogXCJpaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9hcnJheSwgc2lnOiBcImlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9vYmplY3QsIHNpZzogXCJpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfZnVuY3Rpb24sIHNpZzogXCJpaWlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfY2xhc3MsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX2Jvb2wsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX2ludDMyLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV91aW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX2ludDY0LCBzaWc6IFwiamlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2dldF92YWx1ZV91aW50NjQsIHNpZzogXCJqaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ZhbHVlX2RvdWJsZSwgc2lnOiBcImRpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfc3RyaW5nX3V0ZjgsIHNpZzogXCJpaWlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfYmluYXJ5LCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfYXJyYXlfbGVuZ3RoLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2lzX251bGwsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfaXNfdW5kZWZpbmVkLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2lzX2Jvb2xlYW4sIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfaXNfaW50MzIsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfaXNfdWludDMyLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2lzX2ludDY0LCBzaWc6IFwiaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2lzX3VpbnQ2NCwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9pc19kb3VibGUsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfaXNfc3RyaW5nLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2lzX29iamVjdCwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9pc19mdW5jdGlvbiwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9pc19iaW5hcnksIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfaXNfYXJyYXksIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfbmF0aXZlX29iamVjdF90b192YWx1ZSwgc2lnOiBcImlpaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2dldF9uYXRpdmVfb2JqZWN0X3B0ciwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfbmF0aXZlX29iamVjdF90eXBlaWQsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfaXNfaW5zdGFuY2Vfb2YsIHNpZzogXCJpaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2JveGluZywgc2lnOiBcImlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV91bmJveGluZywgc2lnOiBcImlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV91cGRhdGVfYm94ZWRfdmFsdWUsIHNpZzogXCJ2aWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2lzX2JveGVkX3ZhbHVlLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2dldF9hcmdzX2xlbiwgc2lnOiBcImlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2dldF9hcmcsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2Vudiwgc2lnOiBcImlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2dldF90aGlzLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2hvbGRlciwgc2lnOiBcImlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2dldF91c2VyZGF0YSwgc2lnOiBcImlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2FkZF9yZXR1cm4sIHNpZzogXCJ2aWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfdGhyb3dfYnlfc3RyaW5nLCBzaWc6IFwidmlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2NyZWF0ZV9lbnZfcmVmLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZW52X3JlZl9pc192YWxpZCwgc2lnOiBcImlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2dldF9lbnZfZnJvbV9yZWYsIHNpZzogXCJpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9kdXBsaWNhdGVfZW52X3JlZiwgc2lnOiBcImlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX3JlbGVhc2VfZW52X3JlZiwgc2lnOiBcInZpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX29wZW5fc2NvcGUsIHNpZzogXCJpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9vcGVuX3Njb3BlX3BsYWNlbWVudCwgc2lnOiBcImlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9oYXNfY2F1Z2h0LCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2V4Y2VwdGlvbl9hc19zdHJpbmcsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfY2xvc2Vfc2NvcGUsIHNpZzogXCJ2aVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9jbG9zZV9zY29wZV9wbGFjZW1lbnQsIHNpZzogXCJ2aVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9jcmVhdGVfdmFsdWVfcmVmLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9kdXBsaWNhdGVfdmFsdWVfcmVmLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfcmVsZWFzZV92YWx1ZV9yZWYsIHNpZzogXCJ2aVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfdmFsdWVfZnJvbV9yZWYsIHNpZzogXCJpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfc2V0X3JlZl93ZWFrLCBzaWc6IFwidmlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX3NldF9vd25lciwgc2lnOiBcImlpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3JlZl9hc3NvY2lhdGVkX2Vudiwgc2lnOiBcImlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2dldF9yZWZfaW50ZXJuYWxfZmllbGRzLCBzaWc6IFwiaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX2dldF9wcm9wZXJ0eSwgc2lnOiBcImlpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfc2V0X3Byb3BlcnR5LCBzaWc6IFwidmlpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2V0X3ByaXZhdGUsIHNpZzogXCJpaWlpXCIgfSxcclxuICAgIHsgZnVuYzogcGVzYXBpX3NldF9wcml2YXRlLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9nZXRfcHJvcGVydHlfdWludDMyLCBzaWc6IFwiaWlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9zZXRfcHJvcGVydHlfdWludDMyLCBzaWc6IFwidmlpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfY2FsbF9mdW5jdGlvbiwgc2lnOiBcImlpaWlpaVwiIH0sXHJcbiAgICB7IGZ1bmM6IHBlc2FwaV9ldmFsLCBzaWc6IFwiaWlpaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2xvYmFsLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfZ2V0X2Vudl9wcml2YXRlLCBzaWc6IFwiaWlcIiB9LFxyXG4gICAgeyBmdW5jOiBwZXNhcGlfc2V0X2Vudl9wcml2YXRlLCBzaWc6IFwidmlpXCIgfVxyXG5dO1xyXG5sZXQgd2ViZ2xGRkkgPSB1bmRlZmluZWQ7XHJcbi8vIOmcgOimgeWcqFVuaXR56YeM6LCD55SoUGxheWVyU2V0dGluZ3MuV2ViR0wuZW1zY3JpcHRlbkFyZ3MgPSBcIiAtcyBBTExPV19UQUJMRV9HUk9XVEg9MVwiO1xyXG5mdW5jdGlvbiBHZXRXZWJHTEZGSUFwaShlbmdpbmUpIHtcclxuICAgIGlmICh3ZWJnbEZGSSlcclxuICAgICAgICByZXR1cm4gd2ViZ2xGRkk7XHJcbiAgICBjb25zb2xlLmxvZyhgY3JlYXRlIHdlYmdsIGZmaSBhcGkgY291bnQ6ICR7YXBpSW5mby5sZW5ndGh9YCk7XHJcbiAgICBjb25zdCBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhcGlJbmZvLmxlbmd0aCAqIDQpO1xyXG4gICAgY29uc3QgaDMyaW5kZXggPSBwdHIgPj4gMjtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXBpSW5mby5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbaDMyaW5kZXggKyBpXSA9IGVuZ2luZS51bml0eUFwaS5hZGRGdW5jdGlvbihhcGlJbmZvW2ldLmZ1bmMsIGFwaUluZm9baV0uc2lnKTtcclxuICAgIH1cclxuICAgIHdlYmdsRkZJID0gcHRyO1xyXG4gICAgcmV0dXJuIHB0cjtcclxufVxyXG5leHBvcnRzLkdldFdlYkdMRkZJQXBpID0gR2V0V2ViR0xGRklBcGk7XHJcbmZ1bmN0aW9uIFBBcGlSZWdzdGVyQXBpKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHt9O1xyXG59XHJcbmV4cG9ydHMuUEFwaVJlZ3N0ZXJBcGkgPSBQQXBpUmVnc3RlckFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGVzYXBpSW1wbC5qcy5tYXAiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4vKipcclxuICog5qC55o2uIGh0dHBzOi8vZG9jcy51bml0eTNkLmNvbS8yMDE4LjQvRG9jdW1lbnRhdGlvbi9NYW51YWwvd2ViZ2wtaW50ZXJhY3Rpbmd3aXRoYnJvd3NlcnNjcmlwdGluZy5odG1sXHJcbiAqIOaIkeS7rOeahOebrueahOWwseaYr+WcqFdlYkdM5qih5byP5LiL77yM5a6e546w5ZKMcHVlcnRzLmRsbOeahOaViOaenOOAguWFt+S9k+WcqOS6juWunueOsOS4gOS4qmpzbGli77yM6YeM6Z2i5bqU5YyF5ZCrUHVlcnRzRExMLmNz55qE5omA5pyJ5o6l5Y+jXHJcbiAqIOWunumqjOWPkeeOsOi/meS4qmpzbGli6Jm954S25Lmf5piv6L+Q6KGM5ZyodjjnmoRqc++8jOS9huWvuWRldnRvb2zosIPor5XlubbkuI3lj4vlpb3vvIzkuJTlj6rmlK/mjIHliLBlczXjgIJcclxuICog5Zug5q2k5bqU6K+l6YCa6L+H5LiA5Liq54us56uL55qEanPlrp7njrDmjqXlj6PvvIxwdWVydHMuanNsaWLpgJrov4flhajlsYDnmoTmlrnlvI/osIPnlKjlroPjgIJcclxuICpcclxuICog5pyA57uI5b2i5oiQ5aaC5LiL5p625p6EXHJcbiAqIOS4muWKoUpTIDwtPiBXQVNNIDwtPiB1bml0eSBqc2xpYiA8LT4g5pysanNcclxuICog5L2G5pW05p2h6ZO+6Lev5YW25a6e6YO95Zyo5LiA5LiqdjgoanNjb3JlKeiZmuaLn+acuumHjFxyXG4gKi9cclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4vbGlicmFyeVwiKTtcclxuY29uc3QgZ2V0RnJvbUpTQXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9nZXRGcm9tSlNBcmd1bWVudFwiKTtcclxuY29uc3QgZ2V0RnJvbUpTUmV0dXJuXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvZ2V0RnJvbUpTUmV0dXJuXCIpO1xyXG5jb25zdCByZWdpc3Rlcl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3JlZ2lzdGVyXCIpO1xyXG5jb25zdCBzZXRUb0ludm9rZUpTQXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0ludm9rZUpTQXJndW1lbnRcIik7XHJcbmNvbnN0IHNldFRvSlNJbnZva2VSZXR1cm5fMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0pTSW52b2tlUmV0dXJuXCIpO1xyXG5jb25zdCBzZXRUb0pTT3V0QXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0pTT3V0QXJndW1lbnRcIik7XHJcbmNvbnN0IHBlc2FwaUltcGxfMSA9IHJlcXVpcmUoXCIuL3Blc2FwaUltcGxcIik7XHJcbmxpYnJhcnlfMS5nbG9iYWwud3hSZXF1aXJlID0gbGlicmFyeV8xLmdsb2JhbC5yZXF1aXJlO1xyXG5saWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMID0ge1xyXG4gICAgaW5pdGVkOiBmYWxzZSxcclxuICAgIGRlYnVnOiBmYWxzZSxcclxuICAgIC8vIHB1ZXJ0c+mmluasoeWIneWni+WMluaXtuS8muiwg+eUqOi/memHjO+8jOW5tuaKilVuaXR555qE6YCa5L+h5o6l5Y+j5Lyg5YWlXHJcbiAgICBJbml0KGN0b3JQYXJhbSkge1xyXG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IG5ldyBsaWJyYXJ5XzEuUHVlcnRzSlNFbmdpbmUoY3RvclBhcmFtKTtcclxuICAgICAgICBjb25zdCBleGVjdXRlTW9kdWxlQ2FjaGUgPSB7fTtcclxuICAgICAgICBsZXQganNFbmdpbmVSZXR1cm5lZCA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBsb2FkZXI7XHJcbiAgICAgICAgLy8gUHVlcnRzRExM55qE5omA5pyJ5o6l5Y+j5a6e546wXHJcbiAgICAgICAgbGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IE9iamVjdC5hc3NpZ24obGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCwge1xyXG4gICAgICAgICAgICB1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3czogZW5naW5lLnVwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzLmJpbmQoZW5naW5lKVxyXG4gICAgICAgIH0sICgwLCBnZXRGcm9tSlNBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBnZXRGcm9tSlNSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSlNJbnZva2VSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU091dEFyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHJlZ2lzdGVyXzEuZGVmYXVsdCkoZW5naW5lKSwge1xyXG4gICAgICAgICAgICAvLyBicmlkZ2VMb2c6IHRydWUsXHJcbiAgICAgICAgICAgIEdldExpYlZlcnNpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAzNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0QXBpTGV2ZWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAzNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0TGliQmFja2VuZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENyZWF0ZUpTRW5naW5lOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoanNFbmdpbmVSZXR1cm5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIm9ubHkgb25lIGF2YWlsYWJsZSBqc0VudiBpcyBhbGxvd2VkIGluIFdlYkdMIG1vZGVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBqc0VuZ2luZVJldHVybmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBDcmVhdGVKU0VuZ2luZVdpdGhFeHRlcm5hbEVudjogZnVuY3Rpb24gKCkgeyB9LFxyXG4gICAgICAgICAgICBEZXN0cm95SlNFbmdpbmU6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgR2V0TGFzdEV4Y2VwdGlvbkluZm86IGZ1bmN0aW9uIChpc29sYXRlLCAvKiBvdXQgaW50ICovIHN0cmxlbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVuZ2luZS5sYXN0RXhjZXB0aW9uID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnbnVsbCc7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVuZ2luZS5sYXN0RXhjZXB0aW9uID09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAndW5kZWZpbmVkJztcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKGVuZ2luZS5sYXN0RXhjZXB0aW9uLnN0YWNrLCBzdHJsZW4pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBMb3dNZW1vcnlOb3RpZmljYXRpb246IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIElkbGVOb3RpZmljYXRpb25EZWFkbGluZTogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgUmVxdWVzdE1pbm9yR2FyYmFnZUNvbGxlY3Rpb25Gb3JUZXN0aW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBSZXF1ZXN0RnVsbEdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgU2V0R2VuZXJhbERlc3RydWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlLCBfZ2VuZXJhbERlc3RydWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciA9IF9nZW5lcmFsRGVzdHJ1Y3RvcjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0TW9kdWxlRXhlY3V0b3I6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGxvYWRlciA9IHR5cGVvZiBfX3RnanNHZXRMb2FkZXIgIT0gJ3VuZGVmaW5lZCcgPyBfX3RnanNHZXRMb2FkZXIoKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2FkZXJSZXNvbHZlID0gbG9hZGVyLlJlc29sdmUgPyAoZnVuY3Rpb24gKGZpbGVOYW1lLCB0byA9IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZE5hbWUgPSBsb2FkZXIuUmVzb2x2ZShmaWxlTmFtZSwgdG8pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIGZpbGVOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkTmFtZTtcclxuICAgICAgICAgICAgICAgIH0pIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuY3Rpb24gKGZpbGVOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKFsncHVlcnRzL2xvZy5tanMnLCAncHVlcnRzL3RpbWVyLm1qcyddLmluZGV4T2YoZmlsZU5hbWUpICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7fTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlclJlc29sdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZU5hbWUgPSBsb2FkZXJSZXNvbHZlKGZpbGVOYW1lLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3eCAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB3eFJlcXVpcmUoJ3B1ZXJ0c19taW5pZ2FtZV9qc19yZXNvdXJjZXMvJyArIChmaWxlTmFtZS5lbmRzV2l0aCgnLmpzJykgPyBmaWxlTmFtZSA6IGZpbGVOYW1lICsgXCIuanNcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplKG5hbWUsIHRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIENTICE9IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDUy5QdWVydHMuUGF0aEhlbHBlci5Jc1JlbGF0aXZlKHRvKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXQgPSBDUy5QdWVydHMuUGF0aEhlbHBlci5ub3JtYWxpemUoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuRGlybmFtZShuYW1lKSArIFwiL1wiICsgdG8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0bztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBtb2NrUmVxdWlyZShzcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgZXhwb3J0czoge30gfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kQ2FjaGVTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgZXhlY3V0ZU1vZHVsZUNhY2hlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZENhY2hlU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmV4cG9ydHMgPSBleGVjdXRlTW9kdWxlQ2FjaGVbZm91bmRDYWNoZVNwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZFNwZWNpZmllciA9IHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBQVUVSVFNfSlNfUkVTT1VSQ0VTKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIHNwZWNpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNpZmllciA9IGZvdW5kU3BlY2lmaWVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUFVFUlRTX0pTX1JFU09VUkNFU1tzcGVjaWZpZXJdKHJlc3VsdC5leHBvcnRzLCBmdW5jdGlvbiBtUmVxdWlyZShzcGVjaWZpZXJUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vY2tSZXF1aXJlKGxvYWRlclJlc29sdmUgPyBsb2FkZXJSZXNvbHZlKHNwZWNpZmllclRvLCBzcGVjaWZpZXIpIDogbm9ybWFsaXplKHNwZWNpZmllciwgc3BlY2lmaWVyVG8pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0cnlGaW5kTmFtZSA9IFtzcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGVjaWZpZXIuaW5kZXhPZignLicpID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlGaW5kTmFtZSA9IHRyeUZpbmROYW1lLmNvbmNhdChbc3BlY2lmaWVyICsgJy5qcycsIHNwZWNpZmllciArICcudHMnLCBzcGVjaWZpZXIgKyAnLm1qcycsIHNwZWNpZmllciArICcubXRzJ10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSB0cnlGaW5kTmFtZS5yZWR1Y2UoKHJldCwgbmFtZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJldCAhPT0gZmFsc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmpbbmFtZV0gPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjaXJjdWxhciBkZXBlbmRlbmN5IGlzIGRldGVjdGVkIHdoZW4gcmVxdWlyaW5nIFwiJHtuYW1lfVwiYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmluZGVkID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnlGaW5kTmFtZVtmaW5kZWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWlyZVJldDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldEpTT2JqZWN0VmFsdWVHZXR0ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuY3Rpb24gKG9iaiwga2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialtrZXldO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBFdmFsOiBmdW5jdGlvbiAoaXNvbGF0ZSwgY29kZVN0cmluZywgcGF0aCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsaWJyYXJ5XzEuZ2xvYmFsLmV2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJldmFsIGlzIG5vdCBzdXBwb3J0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKGNvZGVTdHJpbmcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGxpYnJhcnlfMS5nbG9iYWwuZXZhbChjb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gZ2V0SW50UHRyTWFuYWdlcigpLkdldFBvaW50ZXJGb3JKU1ZhbHVlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLypGUmVzdWx0SW5mbyAqLyAxMDI0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdEV4Y2VwdGlvbiA9IGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFNldFB1c2hKU0Z1bmN0aW9uQXJndW1lbnRzQ2FsbGJhY2s6IGZ1bmN0aW9uIChpc29sYXRlLCBjYWxsYmFjaywganNFbnZJZHgpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5HZXRKU0FyZ3VtZW50c0NhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFRocm93RXhjZXB0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgLypieXRlW10gKi8gbWVzc2FnZVN0cmluZykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobWVzc2FnZVN0cmluZykpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBJbnZva2VKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBoYXNSZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZ1bmMgaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSBmdW5jLmludm9rZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jLmxhc3RFeGNlcHRpb24gPSBlcnI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncHRyIGlzIG5vdCBhIGpzZnVuYycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRGdW5jdGlvbkxhc3RFeGNlcHRpb25JbmZvOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKm91dCBpbnQgKi8gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZnVuYy5sYXN0RXhjZXB0aW9uID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ251bGwnO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZnVuYy5sYXN0RXhjZXB0aW9uID09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZnVuYy5sYXN0RXhjZXB0aW9uLnN0YWNrIHx8IGZ1bmMubGFzdEV4Y2VwdGlvbi5tZXNzYWdlIHx8ICcnLCBsZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwdHIgaXMgbm90IGEganNmdW5jJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlbGVhc2VKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZW1vdmVKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBSZWxlYXNlSlNPYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBvYmopIHtcclxuICAgICAgICAgICAgICAgIGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlbW92ZUpTT2JqZWN0QnlJZChvYmopO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBSZXNldFJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSBudWxsO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBDbGVhck1vZHVsZUNhY2hlOiBmdW5jdGlvbiAoKSB7IH0sXHJcbiAgICAgICAgICAgIENyZWF0ZUluc3BlY3RvcjogZnVuY3Rpb24gKGlzb2xhdGUsIHBvcnQpIHsgfSxcclxuICAgICAgICAgICAgRGVzdHJveUluc3BlY3RvcjogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgSW5zcGVjdG9yVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgTG9naWNUaWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBTZXRMb2dDYWxsYmFjazogZnVuY3Rpb24gKGxvZywgbG9nV2FybmluZywgbG9nRXJyb3IpIHtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0SlNTdGFja1RyYWNlOiBmdW5jdGlvbiAoaXNvbGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFcnJvcigpLnN0YWNrO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRXZWJHTEZGSUFwaTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICgwLCBwZXNhcGlJbXBsXzEuR2V0V2ViR0xGRklBcGkpKGVuZ2luZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldFdlYkdMUGFwaUVudlJlZjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9