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
const ArgumentValueLengthIn32 = 5; // int count
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
                unityApi.HEAP32[jsValuePtr + 1] = $GetArgumentFinalValue(this.engine, arg, jsValueType, (jsValuePtr + 3) << 2);
            }
            else if (jsValueType == 64 && arg instanceof Array && arg.length == 1) {
                // maybe a ref
                unityApi.HEAP32[jsValuePtr + 1] = $GetArgumentFinalValue(this.engine, arg, jsValueType, 0);
                const refPtrIn8 = unityApi.HEAP32[jsValuePtr + 3] = this.allocRefMemory();
                const refPtr = refPtrIn8 >> 2;
                const refValueType = unityApi.HEAP32[refPtr] = GetType(this.engine, arg[0]);
                if (refValueType == 2 || refValueType == 4 || refValueType == 512) {
                    // number or date
                    $FillArgumentFinalNumberValue(this.engine, arg[0], refValueType, refPtr + 1); // value
                }
                else {
                    unityApi.HEAP32[refPtr + 1] = $GetArgumentFinalValue(this.engine, arg[0], refValueType, (refPtr + 3) << 2);
                }
                unityApi.HEAP32[refPtr + 4] = bufferPtrIn8; // a pointer to the info
            }
            else {
                // other
                unityApi.HEAP32[jsValuePtr + 1] = $GetArgumentFinalValue(this.engine, arg, jsValueType, (jsValuePtr + 3) << 2);
            }
            unityApi.HEAP32[jsValuePtr + 4] = bufferPtrIn8; // a pointer to the info
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
        const infoPtrIn8 = heap32[(valuePtrIn8 >> 2) + 4];
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
            {
                writeBigInt(engine, valPtrIn32, val);
                // ValueIsBigInt可据此判断
                engine.unityApi.HEAP32[valPtrIn32 + 2] = 8; /*long == 8byte*/
            }
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
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
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
                return 32;
            },
            GetApiLevel: function () {
                return 32;
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
            }
        });
    }
};
//# sourceMappingURL=index.js.map
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVlcnRzLXJ1bnRpbWUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG9CQUFvQixHQUFHLGdCQUFnQixHQUFHLG9CQUFvQixHQUFHLHFCQUFxQixHQUFHLGtCQUFrQixHQUFHLGVBQWUsR0FBRyxzQkFBc0IsR0FBRyxrQkFBa0IsR0FBRyxxQkFBcUIsR0FBRyxjQUFjLEdBQUcsdUJBQXVCLEdBQUcsaUNBQWlDLEdBQUcsZ0JBQWdCLEdBQUcsa0JBQWtCLEdBQUcsc0NBQXNDLEdBQUcsNEJBQTRCO0FBQ2xZO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QixpQ0FBaUM7QUFDakMsa0JBQWtCO0FBQ2xCLGlDQUFpQztBQUNqQztBQUNBLG1DQUFtQztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnQkFBZ0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnQkFBZ0I7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQ7QUFDQTtBQUNBLDhGQUE4RjtBQUM5RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrR0FBa0c7QUFDbEc7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0REFBNEQ7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RDtBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQztBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMseUNBQXlDO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBO0FBQ0EsY0FBYyxHQUFHLHFCQUFNLEdBQUcscUJBQU07QUFDaEMscUJBQU0sVUFBVSxxQkFBTTtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLFVBQVU7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsaURBQWlEO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCLHVQQUF1UDtBQUN2UTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTSwyREFBMkQ7QUFDekUsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxxQkFBTTtBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTtBQUNmO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBLHdEQUF3RDtBQUN4RCx3Q0FBd0M7QUFDeEM7QUFDQSxvQkFBb0I7QUFDcEI7QUFDQSxtRUFBbUU7QUFDbkUsZ0VBQWdFO0FBQ2hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RDtBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O0FDL3BCYTtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxrQkFBa0IsbUJBQU8sQ0FBQyx1Q0FBWTtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUM1SGE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUMzRWE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FB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QUNBLGlDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2xpYnJhcnkuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9nZXRGcm9tSlNBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL2dldEZyb21KU1JldHVybi5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3JlZ2lzdGVyLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9JbnZva2VKU0FyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9KU0ludm9rZVJldHVybi5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSlNPdXRBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5yZXR1cm5CaWdJbnQgPSBleHBvcnRzLmlzQmlnSW50ID0gZXhwb3J0cy5zZXRPdXRWYWx1ZTggPSBleHBvcnRzLnNldE91dFZhbHVlMzIgPSBleHBvcnRzLm1ha2VCaWdJbnQgPSBleHBvcnRzLkdldFR5cGUgPSBleHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gZXhwb3J0cy5PbkZpbmFsaXplID0gZXhwb3J0cy5jcmVhdGVXZWFrUmVmID0gZXhwb3J0cy5nbG9iYWwgPSBleHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IGV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGV4cG9ydHMuSlNPYmplY3QgPSBleHBvcnRzLkpTRnVuY3Rpb24gPSBleHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IGV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm8gPSB2b2lkIDA7XG4vKipcbiAqIOS4gOasoeWHveaVsOiwg+eUqOeahGluZm9cbiAqIOWvueW6lHY4OjpGdW5jdGlvbkNhbGxiYWNrSW5mb1xuICovXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mbyB7XG4gICAgYXJncztcbiAgICByZXR1cm5WYWx1ZTtcbiAgICBzdGFjayA9IDA7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICB0aGlzLmFyZ3MgPSBhcmdzO1xuICAgIH1cbiAgICByZWN5Y2xlKCkge1xuICAgICAgICB0aGlzLnN0YWNrID0gMDtcbiAgICAgICAgdGhpcy5hcmdzID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IHZvaWQgMDtcbiAgICB9XG59XG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gRnVuY3Rpb25DYWxsYmFja0luZm87XG4vLyBzdHJ1Y3QgTW9ja1Y4VmFsdWVcbi8vIHtcbi8vICAgICBpbnQgSlNWYWx1ZVR5cGU7ICAvLyAwXG4vLyAgICAgaW50IEZpbmFsVmFsdWVQb2ludGVyWzJdOyAvLyAxIDIgaWYgdmFsdWUgaXMgYmlnaW50IEZpbmFsVmFsdWVQb2ludGVyWzBdIGZvciBsb3csIEZpbmFsVmFsdWVQb2ludGVyWzFdIGZvciBoaWdoXG4vLyAgICAgaW50IGV4dHJhOyAvLyAzXG4vLyAgICAgaW50IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvOyAvLyA0XG4vLyB9O1xuY29uc3QgQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgPSA1OyAvLyBpbnQgY291bnRcbi8qKlxuICog5oqKRnVuY3Rpb25DYWxsYmFja0luZm/ku6Xlj4rlhbblj4LmlbDovazljJbkuLpjI+WPr+eUqOeahGludHB0clxuICovXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIge1xuICAgIC8vIEZ1bmN0aW9uQ2FsbGJhY2tJbmZv55qE5YiX6KGo77yM5Lul5YiX6KGo55qEaW5kZXjkvZzkuLpJbnRQdHLnmoTlgLxcbiAgICBpbmZvcyA9IFtuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oWzBdKV07IC8vIOi/memHjOWOn+acrOWPquaYr+S4quaZrumAmueahDBcbiAgICAvLyBGdW5jdGlvbkNhbGxiYWNrSW5mb+eUqOWujOWQju+8jOWwhuWFtuW6j+WPt+aUvuWFpeKAnOWbnuaUtuWIl+ihqOKAne+8jOS4i+asoeWwseiDvee7p+e7reacjeeUqOivpWluZGV477yM6ICM5LiN5b+F6K6paW5mb3PmlbDnu4Tml6DpmZDmianlsZXkuIvljrtcbiAgICBmcmVlSW5mb3NJbmRleCA9IFtdO1xuICAgIGZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aCA9IHt9O1xuICAgIGZyZWVSZWZNZW1vcnkgPSBbXTtcbiAgICBlbmdpbmU7XG4gICAgY29uc3RydWN0b3IoZW5naW5lKSB7XG4gICAgICAgIHRoaXMuZW5naW5lID0gZW5naW5lO1xuICAgIH1cbiAgICBhbGxvY0NhbGxiYWNrSW5mb01lbW9yeShhcmdzTGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGNhY2hlQXJyYXkgPSB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXTtcbiAgICAgICAgaWYgKGNhY2hlQXJyYXkgJiYgY2FjaGVBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWNoZUFycmF5LnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoKGFyZ3NMZW5ndGggKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDEpIDw8IDIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFsbG9jUmVmTWVtb3J5KCkge1xuICAgICAgICBpZiAodGhpcy5mcmVlUmVmTWVtb3J5Lmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZyZWVSZWZNZW1vcnkucG9wKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmVuZ2luZS51bml0eUFwaS5fbWFsbG9jKEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyIDw8IDIpO1xuICAgIH1cbiAgICByZWN5Y2xlUmVmTWVtb3J5KGJ1ZmZlclB0cikge1xuICAgICAgICBpZiAodGhpcy5mcmVlUmVmTWVtb3J5Lmxlbmd0aCA+IDIwKSB7XG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5fZnJlZShidWZmZXJQdHIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mcmVlUmVmTWVtb3J5LnB1c2goYnVmZmVyUHRyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KGJ1ZmZlclB0ciwgYXJncykge1xuICAgICAgICBjb25zdCBhcmdzTGVuZ3RoID0gYXJncy5sZW5ndGg7XG4gICAgICAgIGlmICghdGhpcy5mcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGhbYXJnc0xlbmd0aF0gJiYgYXJnc0xlbmd0aCA8IDUpIHtcbiAgICAgICAgICAgIHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2FjaGVBcnJheSA9IHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdO1xuICAgICAgICBpZiAoIWNhY2hlQXJyYXkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ckluMzIgPSBidWZmZXJQdHIgPDwgMjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzTGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChhcmdzW2ldIGluc3RhbmNlb2YgQXJyYXkgJiYgYXJnc1tpXS5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVjeWNsZVJlZk1lbW9yeSh0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbYnVmZmVyUHRySW4zMiArIGkgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDmi43ohJHooovlrprnmoTmnIDlpKfnvJPlrZjkuKrmlbDlpKflsI/jgIIgNTAgLSDlj4LmlbDkuKrmlbAgKiAxMFxuICAgICAgICBpZiAoY2FjaGVBcnJheS5sZW5ndGggPiAoNTAgLSBhcmdzTGVuZ3RoICogMTApKSB7XG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5fZnJlZShidWZmZXJQdHIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVBcnJheS5wdXNoKGJ1ZmZlclB0cik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogaW50cHRy55qE5qC85byP5Li6aWTlt6bnp7vlm5vkvY1cbiAgICAgKlxuICAgICAqIOWPs+S+p+Wbm+S9je+8jOaYr+S4uuS6huWcqOWPs+Wbm+S9jeWtmOWCqOWPguaVsOeahOW6j+WPt++8jOi/meagt+WPr+S7peeUqOS6juihqOekumNhbGxiYWNraW5mb+WPguaVsOeahGludHB0clxuICAgICAqL1xuICAgIC8vIHN0YXRpYyBHZXRNb2NrUG9pbnRlcihhcmdzOiBhbnlbXSk6IE1vY2tJbnRQdHIge1xuICAgIC8vICAgICBsZXQgaW5kZXg6IG51bWJlcjtcbiAgICAvLyAgICAgaW5kZXggPSB0aGlzLmZyZWVJbmZvc0luZGV4LnBvcCgpO1xuICAgIC8vICAgICAvLyBpbmRleOacgOWwj+S4ujFcbiAgICAvLyAgICAgaWYgKGluZGV4KSB7XG4gICAgLy8gICAgICAgICB0aGlzLmluZm9zW2luZGV4XS5hcmdzID0gYXJncztcbiAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgIGluZGV4ID0gdGhpcy5pbmZvcy5wdXNoKG5ldyBGdW5jdGlvbkNhbGxiYWNrSW5mbyhhcmdzKSkgLSAxO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIHJldHVybiBpbmRleCA8PCA0O1xuICAgIC8vIH1cbiAgICBHZXRNb2NrUG9pbnRlcihhcmdzKSB7XG4gICAgICAgIGNvbnN0IGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aDtcbiAgICAgICAgbGV0IGJ1ZmZlclB0ckluOCA9IHRoaXMuYWxsb2NDYWxsYmFja0luZm9NZW1vcnkoYXJnc0xlbmd0aCk7XG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMuZnJlZUluZm9zSW5kZXgucG9wKCk7XG4gICAgICAgIGxldCBmdW5jdGlvbkNhbGxiYWNrSW5mbztcbiAgICAgICAgLy8gaW5kZXjmnIDlsI/kuLoxXG4gICAgICAgIGlmIChpbmRleCkge1xuICAgICAgICAgICAgKGZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gdGhpcy5pbmZvc1tpbmRleF0pLmFyZ3MgPSBhcmdzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2goZnVuY3Rpb25DYWxsYmFja0luZm8gPSBuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oYXJncykpIC0gMTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdW5pdHlBcGkgPSB0aGlzLmVuZ2luZS51bml0eUFwaTtcbiAgICAgICAgY29uc3QgYnVmZmVyUHRySW4zMiA9IGJ1ZmZlclB0ckluOCA+PiAyO1xuICAgICAgICB1bml0eUFwaS5IRUFQMzJbYnVmZmVyUHRySW4zMl0gPSBpbmRleDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBhcmcgPSBhcmdzW2ldO1xuICAgICAgICAgICAgLy8gaW5pdCBlYWNoIHZhbHVlXG4gICAgICAgICAgICBjb25zdCBqc1ZhbHVlVHlwZSA9IEdldFR5cGUodGhpcy5lbmdpbmUsIGFyZyk7XG4gICAgICAgICAgICBjb25zdCBqc1ZhbHVlUHRyID0gYnVmZmVyUHRySW4zMiArIGkgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDE7XG4gICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0cl0gPSBqc1ZhbHVlVHlwZTsgLy8ganN2YWx1ZXR5cGVcbiAgICAgICAgICAgIGlmIChqc1ZhbHVlVHlwZSA9PSAyIHx8IGpzVmFsdWVUeXBlID09IDQgfHwganNWYWx1ZVR5cGUgPT0gNTEyKSB7XG4gICAgICAgICAgICAgICAgLy8gYmlnaW5044CBbnVtYmVyIG9yIGRhdGVcbiAgICAgICAgICAgICAgICAkRmlsbEFyZ3VtZW50RmluYWxOdW1iZXJWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwganNWYWx1ZVB0ciArIDEpOyAvLyB2YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoanNWYWx1ZVR5cGUgPT0gOCkge1xuICAgICAgICAgICAgICAgIGlmIChmdW5jdGlvbkNhbGxiYWNrSW5mby5zdGFjayA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uQ2FsbGJhY2tJbmZvLnN0YWNrID0gdW5pdHlBcGkuc3RhY2tTYXZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmcsIGpzVmFsdWVUeXBlLCAoanNWYWx1ZVB0ciArIDMpIDw8IDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoanNWYWx1ZVR5cGUgPT0gNjQgJiYgYXJnIGluc3RhbmNlb2YgQXJyYXkgJiYgYXJnLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gbWF5YmUgYSByZWZcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwgMCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVmUHRySW44ID0gdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAzXSA9IHRoaXMuYWxsb2NSZWZNZW1vcnkoKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWZQdHIgPSByZWZQdHJJbjggPj4gMjtcbiAgICAgICAgICAgICAgICBjb25zdCByZWZWYWx1ZVR5cGUgPSB1bml0eUFwaS5IRUFQMzJbcmVmUHRyXSA9IEdldFR5cGUodGhpcy5lbmdpbmUsIGFyZ1swXSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlZlZhbHVlVHlwZSA9PSAyIHx8IHJlZlZhbHVlVHlwZSA9PSA0IHx8IHJlZlZhbHVlVHlwZSA9PSA1MTIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbnVtYmVyIG9yIGRhdGVcbiAgICAgICAgICAgICAgICAgICAgJEZpbGxBcmd1bWVudEZpbmFsTnVtYmVyVmFsdWUodGhpcy5lbmdpbmUsIGFyZ1swXSwgcmVmVmFsdWVUeXBlLCByZWZQdHIgKyAxKTsgLy8gdmFsdWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltyZWZQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZ1swXSwgcmVmVmFsdWVUeXBlLCAocmVmUHRyICsgMykgPDwgMik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltyZWZQdHIgKyA0XSA9IGJ1ZmZlclB0ckluODsgLy8gYSBwb2ludGVyIHRvIHRoZSBpbmZvXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBvdGhlclxuICAgICAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmcsIGpzVmFsdWVUeXBlLCAoanNWYWx1ZVB0ciArIDMpIDw8IDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyA0XSA9IGJ1ZmZlclB0ckluODsgLy8gYSBwb2ludGVyIHRvIHRoZSBpbmZvXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJ1ZmZlclB0ckluODtcbiAgICB9XG4gICAgLy8gc3RhdGljIEdldEJ5TW9ja1BvaW50ZXIoaW50cHRyOiBNb2NrSW50UHRyKTogRnVuY3Rpb25DYWxsYmFja0luZm8ge1xuICAgIC8vICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbnRwdHIgPj4gNF07XG4gICAgLy8gfVxuICAgIEdldEJ5TW9ja1BvaW50ZXIocHRySW44KSB7XG4gICAgICAgIGNvbnN0IHB0ckluMzIgPSBwdHJJbjggPj4gMjtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbcHRySW4zMl07XG4gICAgICAgIHJldHVybiB0aGlzLmluZm9zW2luZGV4XTtcbiAgICB9XG4gICAgR2V0UmV0dXJuVmFsdWVBbmRSZWN5Y2xlKHB0ckluOCkge1xuICAgICAgICBjb25zdCBwdHJJbjMyID0gcHRySW44ID4+IDI7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xuICAgICAgICBsZXQgaW5mbyA9IHRoaXMuaW5mb3NbaW5kZXhdO1xuICAgICAgICBsZXQgcmV0ID0gaW5mby5yZXR1cm5WYWx1ZTtcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KHB0ckluOCwgaW5mby5hcmdzKTtcbiAgICAgICAgaWYgKGluZm8uc3RhY2spIHtcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLnN0YWNrUmVzdG9yZShpbmZvLnN0YWNrKTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlY3ljbGUoKTtcbiAgICAgICAgdGhpcy5mcmVlSW5mb3NJbmRleC5wdXNoKGluZGV4KTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgUmVsZWFzZUJ5TW9ja0ludFB0cihwdHJJbjgpIHtcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXTtcbiAgICAgICAgbGV0IGluZm8gPSB0aGlzLmluZm9zW2luZGV4XTtcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KHB0ckluOCwgaW5mby5hcmdzKTtcbiAgICAgICAgaWYgKGluZm8uc3RhY2spIHtcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLnN0YWNrUmVzdG9yZShpbmZvLnN0YWNrKTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlY3ljbGUoKTtcbiAgICAgICAgdGhpcy5mcmVlSW5mb3NJbmRleC5wdXNoKGluZGV4KTtcbiAgICB9XG4gICAgR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZVB0ckluOCkge1xuICAgICAgICBsZXQgaGVhcDMyID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyO1xuICAgICAgICBjb25zdCBpbmZvUHRySW44ID0gaGVhcDMyWyh2YWx1ZVB0ckluOCA+PiAyKSArIDRdO1xuICAgICAgICBjb25zdCBjYWxsYmFja0luZm9JbmRleCA9IGhlYXAzMltpbmZvUHRySW44ID4+IDJdO1xuICAgICAgICBjb25zdCBhcmdzSW5kZXggPSAodmFsdWVQdHJJbjggLSBpbmZvUHRySW44IC0gNCkgLyAoNCAqIEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mb3NbY2FsbGJhY2tJbmZvSW5kZXhdLmFyZ3NbYXJnc0luZGV4XTtcbiAgICB9XG59XG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcbi8qKlxuICog5Luj6KGo5LiA5LiqSlNGdW5jdGlvblxuICovXG5jbGFzcyBKU0Z1bmN0aW9uIHtcbiAgICBfZnVuYztcbiAgICBpZDtcbiAgICBhcmdzID0gW107XG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XG4gICAgY29uc3RydWN0b3IoaWQsIGZ1bmMpIHtcbiAgICAgICAgdGhpcy5fZnVuYyA9IGZ1bmM7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICB9XG4gICAgaW52b2tlKCkge1xuICAgICAgICB2YXIgYXJncyA9IFsuLi50aGlzLmFyZ3NdO1xuICAgICAgICB0aGlzLmFyZ3MubGVuZ3RoID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Z1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxufVxuZXhwb3J0cy5KU0Z1bmN0aW9uID0gSlNGdW5jdGlvbjtcbi8qKlxuICog5Luj6KGo5LiA5LiqSlNPYmplY3RcbiAqL1xuY2xhc3MgSlNPYmplY3Qge1xuICAgIF9vYmo7XG4gICAgaWQ7XG4gICAgY29uc3RydWN0b3IoaWQsIG9iaikge1xuICAgICAgICB0aGlzLl9vYmogPSBvYmo7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICB9XG4gICAgZ2V0T2JqZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb2JqO1xuICAgIH1cbn1cbmV4cG9ydHMuSlNPYmplY3QgPSBKU09iamVjdDtcbmNsYXNzIGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnkge1xuICAgIHN0YXRpYyByZWd1bGFySUQgPSAxO1xuICAgIHN0YXRpYyBmcmVlSUQgPSBbXTtcbiAgICBzdGF0aWMgaWRNYXAgPSBuZXcgV2Vha01hcCgpO1xuICAgIHN0YXRpYyBqc0Z1bmNPck9iamVjdEtWID0ge307XG4gICAgc3RhdGljIGdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jVmFsdWUpIHtcbiAgICAgICAgbGV0IGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5nZXQoZnVuY1ZhbHVlKTtcbiAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5mcmVlSUQubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZCA9IHRoaXMuZnJlZUlELnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlZ3VsYXJJRCsrO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZ1bmMgPSBuZXcgSlNGdW5jdGlvbihpZCwgZnVuY1ZhbHVlKTtcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5zZXQoZnVuY1ZhbHVlLCBpZCk7XG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBmdW5jO1xuICAgICAgICByZXR1cm4gZnVuYztcbiAgICB9XG4gICAgc3RhdGljIGdldE9yQ3JlYXRlSlNPYmplY3Qob2JqKSB7XG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KG9iaik7XG4gICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZnJlZUlELmxlbmd0aCkge1xuICAgICAgICAgICAgaWQgPSB0aGlzLmZyZWVJRC5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZWd1bGFySUQrKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBqc09iamVjdCA9IG5ldyBKU09iamVjdChpZCwgb2JqKTtcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5zZXQob2JqLCBpZCk7XG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBqc09iamVjdDtcbiAgICAgICAgcmV0dXJuIGpzT2JqZWN0O1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0SlNPYmplY3RCeUlkKGlkKSB7XG4gICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xuICAgIH1cbiAgICBzdGF0aWMgcmVtb3ZlSlNPYmplY3RCeUlkKGlkKSB7XG4gICAgICAgIGNvbnN0IGpzT2JqZWN0ID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcbiAgICAgICAgaWYgKCFqc09iamVjdClcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ3JlbW92ZUpTT2JqZWN0QnlJZCBmYWlsZWQ6IGlkIGlzIGludmFsaWQ6ICcgKyBpZCk7XG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZGVsZXRlKGpzT2JqZWN0LmdldE9iamVjdCgpKTtcbiAgICAgICAgZGVsZXRlIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XG4gICAgICAgIHRoaXMuZnJlZUlELnB1c2goaWQpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0SlNGdW5jdGlvbkJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XG4gICAgfVxuICAgIHN0YXRpYyByZW1vdmVKU0Z1bmN0aW9uQnlJZChpZCkge1xuICAgICAgICBjb25zdCBqc0Z1bmMgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xuICAgICAgICBpZiAoIWpzRnVuYylcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ3JlbW92ZUpTRnVuY3Rpb25CeUlkIGZhaWxlZDogaWQgaXMgaW52YWxpZDogJyArIGlkKTtcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNGdW5jLl9mdW5jKTtcbiAgICAgICAgZGVsZXRlIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XG4gICAgICAgIHRoaXMuZnJlZUlELnB1c2goaWQpO1xuICAgIH1cbn1cbmV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnk7XG4vKipcbiAqIENTaGFycOWvueixoeiusOW9leihqO+8jOiusOW9leaJgOaciUNTaGFycOWvueixoeW5tuWIhumFjWlkXG4gKiDlkoxwdWVydHMuZGxs5omA5YGa55qE5LiA5qC3XG4gKi9cbmNsYXNzIENTaGFycE9iamVjdE1hcCB7XG4gICAgY2xhc3NlcyA9IFtudWxsXTtcbiAgICBuYXRpdmVPYmplY3RLViA9IG5ldyBNYXAoKTtcbiAgICAvLyBwcml2YXRlIG5hdGl2ZU9iamVjdEtWOiB7IFtvYmplY3RJRDogQ1NJZGVudGlmaWVyXTogV2Vha1JlZjxhbnk+IH0gPSB7fTtcbiAgICAvLyBwcml2YXRlIGNzSURXZWFrTWFwOiBXZWFrTWFwPGFueSwgQ1NJZGVudGlmaWVyPiA9IG5ldyBXZWFrTWFwKCk7XG4gICAgbmFtZXNUb0NsYXNzZXNJRCA9IHt9O1xuICAgIGNsYXNzSURXZWFrTWFwID0gbmV3IFdlYWtNYXAoKTtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZENhbGxlZCcsIHRoaXMuYWRkQ2FsbGVkKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZW1vdmVDYWxsZWQnLCB0aGlzLnJlbW92ZUNhbGxlZCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnd3InLCB0aGlzLm5hdGl2ZU9iamVjdEtWLnNpemUpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG4gICAgX21lbW9yeURlYnVnID0gZmFsc2U7XG4gICAgYWRkQ2FsbGVkID0gMDtcbiAgICByZW1vdmVDYWxsZWQgPSAwO1xuICAgIGFkZChjc0lELCBvYmopIHtcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgdGhpcy5hZGRDYWxsZWQrKztcbiAgICAgICAgLy8gdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcbiAgICAgICAgLy8gdGhpcy5jc0lEV2Vha01hcC5zZXQob2JqLCBjc0lEKTtcbiAgICAgICAgdGhpcy5uYXRpdmVPYmplY3RLVi5zZXQoY3NJRCwgY3JlYXRlV2Vha1JlZihvYmopKTtcbiAgICAgICAgb2JqWyckY3NpZCddID0gY3NJRDtcbiAgICB9XG4gICAgcmVtb3ZlKGNzSUQpIHtcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgdGhpcy5yZW1vdmVDYWxsZWQrKztcbiAgICAgICAgLy8gZGVsZXRlIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF07XG4gICAgICAgIHRoaXMubmF0aXZlT2JqZWN0S1YuZGVsZXRlKGNzSUQpO1xuICAgIH1cbiAgICBmaW5kT3JBZGRPYmplY3QoY3NJRCwgY2xhc3NJRCkge1xuICAgICAgICBsZXQgcmV0ID0gdGhpcy5uYXRpdmVPYmplY3RLVi5nZXQoY3NJRCk7XG4gICAgICAgIC8vIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdO1xuICAgICAgICBpZiAocmV0ICYmIChyZXQgPSByZXQuZGVyZWYoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0ID0gdGhpcy5jbGFzc2VzW2NsYXNzSURdLmNyZWF0ZUZyb21DUyhjc0lEKTtcbiAgICAgICAgLy8gdGhpcy5hZGQoY3NJRCwgcmV0KTsg5p6E6YCg5Ye95pWw6YeM6LSf6LSj6LCD55SoXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIGdldENTSWRlbnRpZmllckZyb21PYmplY3Qob2JqKSB7XG4gICAgICAgIC8vIHJldHVybiB0aGlzLmNzSURXZWFrTWFwLmdldChvYmopO1xuICAgICAgICByZXR1cm4gb2JqID8gb2JqLiRjc2lkIDogMDtcbiAgICB9XG59XG5leHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IENTaGFycE9iamVjdE1hcDtcbjtcbnZhciBkZXN0cnVjdG9ycyA9IHt9O1xuZXhwb3J0cy5nbG9iYWwgPSBnbG9iYWwgPSBnbG9iYWwgfHwgZ2xvYmFsVGhpcyB8fCB3aW5kb3c7XG5nbG9iYWwuZ2xvYmFsID0gZ2xvYmFsO1xuY29uc3QgY3JlYXRlV2Vha1JlZiA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgV1hXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiV2Vha1JlZiBpcyBub3QgZGVmaW5lZC4gbWF5YmUgeW91IHNob3VsZCB1c2UgbmV3ZXIgZW52aXJvbm1lbnRcIik7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGRlcmVmKCkgeyByZXR1cm4gb2JqOyB9IH07XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUud2FybihcInVzaW5nIFdYV2Vha1JlZlwiKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgV1hXZWFrUmVmKG9iaik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBuZXcgV2Vha1JlZihvYmopO1xuICAgIH07XG59KSgpO1xuZXhwb3J0cy5jcmVhdGVXZWFrUmVmID0gY3JlYXRlV2Vha1JlZjtcbmNsYXNzIEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9jayB7XG4gICAgX2hhbmRsZXI7XG4gICAgcmVmcyA9IFtdO1xuICAgIGhlbGRzID0gW107XG4gICAgYXZhaWxhYmxlSW5kZXggPSBbXTtcbiAgICBjb25zdHJ1Y3RvcihoYW5kbGVyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIkZpbmFsaXphdGlvblJlZ2lzdGVyIGlzIG5vdCBkZWZpbmVkLiB1c2luZyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2tcIik7XG4gICAgICAgIGdsb2JhbC5fcHVlcnRzX3JlZ2lzdHJ5ID0gdGhpcztcbiAgICAgICAgdGhpcy5faGFuZGxlciA9IGhhbmRsZXI7XG4gICAgfVxuICAgIHJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLmF2YWlsYWJsZUluZGV4Lmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmF2YWlsYWJsZUluZGV4LnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5yZWZzW2luZGV4XSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcbiAgICAgICAgICAgIHRoaXMuaGVsZHNbaW5kZXhdID0gaGVsZFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZWZzLnB1c2goY3JlYXRlV2Vha1JlZihvYmopKTtcbiAgICAgICAgICAgIHRoaXMuaGVsZHMucHVzaChoZWxkVmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIOa4hemZpOWPr+iDveW3sue7j+WkseaViOeahFdlYWtSZWZcbiAgICAgKi9cbiAgICBpdGVyYXRlUG9zaXRpb24gPSAwO1xuICAgIGNsZWFudXAocGFydCA9IDEpIHtcbiAgICAgICAgY29uc3Qgc3RlcENvdW50ID0gdGhpcy5yZWZzLmxlbmd0aCAvIHBhcnQ7XG4gICAgICAgIGxldCBpID0gdGhpcy5pdGVyYXRlUG9zaXRpb247XG4gICAgICAgIGZvciAobGV0IGN1cnJlbnRTdGVwID0gMDsgaSA8IHRoaXMucmVmcy5sZW5ndGggJiYgY3VycmVudFN0ZXAgPCBzdGVwQ291bnQ7IGkgPSAoaSA9PSB0aGlzLnJlZnMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMSksIGN1cnJlbnRTdGVwKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlZnNbaV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlZnNbaV0uZGVyZWYoKSkge1xuICAgICAgICAgICAgICAgIC8vIOebruWJjeayoeacieWGheWtmOaVtOeQhuiDveWKm++8jOWmguaenOa4uOaIj+S4reacn3JlZuW+iOWkmuS9huWQjuacn+WwkeS6hu+8jOi/memHjOWwseS8mueZvei0uemBjeWOhuasoeaVsFxuICAgICAgICAgICAgICAgIC8vIOS9humBjeWOhuS5n+WPquaYr+S4gOWPpT095ZKMY29udGludWXvvIzmtarotLnlvbHlk43kuI3lpKdcbiAgICAgICAgICAgICAgICB0aGlzLmF2YWlsYWJsZUluZGV4LnB1c2goaSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVyKHRoaXMuaGVsZHNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLml0ZXJhdGVQb3NpdGlvbiA9IGk7XG4gICAgfVxufVxudmFyIHJlZ2lzdHJ5ID0gbnVsbDtcbmZ1bmN0aW9uIGluaXQoKSB7XG4gICAgcmVnaXN0cnkgPSBuZXcgKHR5cGVvZiBGaW5hbGl6YXRpb25SZWdpc3RyeSA9PSAndW5kZWZpbmVkJyA/IEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9jayA6IEZpbmFsaXphdGlvblJlZ2lzdHJ5KShmdW5jdGlvbiAoaGVsZFZhbHVlKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbm5vdCBmaW5kIGRlc3RydWN0b3IgZm9yIFwiICsgaGVsZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoLS1jYWxsYmFjay5yZWYgPT0gMCkge1xuICAgICAgICAgICAgZGVsZXRlIGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XG4gICAgICAgICAgICBjYWxsYmFjayhoZWxkVmFsdWUpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5mdW5jdGlvbiBPbkZpbmFsaXplKG9iaiwgaGVsZFZhbHVlLCBjYWxsYmFjaykge1xuICAgIGlmICghcmVnaXN0cnkpIHtcbiAgICAgICAgaW5pdCgpO1xuICAgIH1cbiAgICBsZXQgb3JpZ2luQ2FsbGJhY2sgPSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xuICAgIGlmIChvcmlnaW5DYWxsYmFjaykge1xuICAgICAgICAvLyBXZWFrUmVm5YaF5a656YeK5pS+5pe25py65Y+v6IO95q+UZmluYWxpemF0aW9uUmVnaXN0cnnnmoTop6blj5Hmm7Tml6nvvIzliY3pnaLlpoLmnpzlj5HnjrB3ZWFrUmVm5Li656m65Lya6YeN5paw5Yib5bu65a+56LGhXG4gICAgICAgIC8vIOS9huS5i+WJjeWvueixoeeahGZpbmFsaXphdGlvblJlZ2lzdHJ55pyA57uI5Y+I6IKv5a6a5Lya6Kem5Y+R44CCXG4gICAgICAgIC8vIOaJgOS7peWmguaenOmBh+WIsOi/meS4quaDheWGte+8jOmcgOimgee7mWRlc3RydWN0b3LliqDorqHmlbBcbiAgICAgICAgKytvcmlnaW5DYWxsYmFjay5yZWY7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjYWxsYmFjay5yZWYgPSAxO1xuICAgICAgICBkZXN0cnVjdG9yc1toZWxkVmFsdWVdID0gY2FsbGJhY2s7XG4gICAgfVxuICAgIHJlZ2lzdHJ5LnJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKTtcbn1cbmV4cG9ydHMuT25GaW5hbGl6ZSA9IE9uRmluYWxpemU7XG5jbGFzcyBQdWVydHNKU0VuZ2luZSB7XG4gICAgY3NoYXJwT2JqZWN0TWFwO1xuICAgIGZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcbiAgICB1bml0eUFwaTtcbiAgICAvKiog5a2X56ym5Liy57yT5a2Y77yM6buY6K6k5Li6MjU25a2X6IqCICovXG4gICAgc3RyQnVmZmVyO1xuICAgIHN0cmluZ0J1ZmZlclNpemUgPSAyNTY7XG4gICAgbGFzdFJldHVybkNTUmVzdWx0ID0gbnVsbDtcbiAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcbiAgICAvLyDov5nkuKTkuKrmmK9QdWVydHPnlKjnmoTnmoTnnJ/mraPnmoRDU2hhcnDlh73mlbDmjIfpkohcbiAgICBHZXRKU0FyZ3VtZW50c0NhbGxiYWNrO1xuICAgIGdlbmVyYWxEZXN0cnVjdG9yO1xuICAgIGNvbnN0cnVjdG9yKGN0b3JQYXJhbSkge1xuICAgICAgICB0aGlzLmNzaGFycE9iamVjdE1hcCA9IG5ldyBDU2hhcnBPYmplY3RNYXAoKTtcbiAgICAgICAgdGhpcy5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIgPSBuZXcgRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyKHRoaXMpO1xuICAgICAgICBjb25zdCB7IFVURjhUb1N0cmluZywgX21hbGxvYywgX2ZyZWUsIF9zZXRUZW1wUmV0MCwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHN0YWNrU2F2ZSwgc3RhY2tSZXN0b3JlLCBzdGFja0FsbG9jLCBfQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2ssIF9DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjaywgX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssIEhFQVA4LCBIRUFQVTgsIEhFQVAzMiwgSEVBUEYzMiwgSEVBUEY2NCwgfSA9IGN0b3JQYXJhbTtcbiAgICAgICAgdGhpcy5zdHJCdWZmZXIgPSBfbWFsbG9jKHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSk7XG4gICAgICAgIHRoaXMudW5pdHlBcGkgPSB7XG4gICAgICAgICAgICBVVEY4VG9TdHJpbmcsXG4gICAgICAgICAgICBfbWFsbG9jLFxuICAgICAgICAgICAgX2ZyZWUsXG4gICAgICAgICAgICBfc2V0VGVtcFJldDAsXG4gICAgICAgICAgICBzdHJpbmdUb1VURjgsXG4gICAgICAgICAgICBsZW5ndGhCeXRlc1VURjgsXG4gICAgICAgICAgICBzdGFja1NhdmUsXG4gICAgICAgICAgICBzdGFja1Jlc3RvcmUsXG4gICAgICAgICAgICBzdGFja0FsbG9jLFxuICAgICAgICAgICAgX0NhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrLFxuICAgICAgICAgICAgX0NhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrLFxuICAgICAgICAgICAgX0NhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssXG4gICAgICAgICAgICBIRUFQOCxcbiAgICAgICAgICAgIEhFQVBVOCxcbiAgICAgICAgICAgIEhFQVAzMixcbiAgICAgICAgICAgIEhFQVBGMzIsXG4gICAgICAgICAgICBIRUFQRjY0LFxuICAgICAgICB9O1xuICAgICAgICBnbG9iYWwuX190Z2pzRXZhbFNjcmlwdCA9IHR5cGVvZiBldmFsID09IFwidW5kZWZpbmVkXCIgPyAoKSA9PiB7IH0gOiBldmFsO1xuICAgICAgICBnbG9iYWwuX190Z2pzU2V0UHJvbWlzZVJlamVjdENhbGxiYWNrID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgd3gub25VbmhhbmRsZWRSZWplY3Rpb24oY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBnbG9iYWwuX19wdWVydHNHZXRMYXN0RXhjZXB0aW9uID0gKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFzdEV4Y2VwdGlvbjtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqIGNhbGwgd2hlbiB3YXNtIGdyb3cgbWVtb3J5ICovXG4gICAgdXBkYXRlR2xvYmFsQnVmZmVyQW5kVmlld3MoSEVBUDgsIEhFQVBVOCwgSEVBUDMyLCBIRUFQRjMyLCBIRUFQRjY0KSB7XG4gICAgICAgIGxldCB1bml0eUFwaSA9IHRoaXMudW5pdHlBcGk7XG4gICAgICAgIHVuaXR5QXBpLkhFQVA4ID0gSEVBUDg7XG4gICAgICAgIHVuaXR5QXBpLkhFQVBVOCA9IEhFQVBVODtcbiAgICAgICAgdW5pdHlBcGkuSEVBUDMyID0gSEVBUDMyO1xuICAgICAgICB1bml0eUFwaS5IRUFQRjMyID0gSEVBUEYzMjtcbiAgICAgICAgdW5pdHlBcGkuSEVBUEY2NCA9IEhFQVBGNjQ7XG4gICAgfVxuICAgIG1lbWNweShkZXN0LCBzcmMsIG51bSkge1xuICAgICAgICB0aGlzLnVuaXR5QXBpLkhFQVBVOC5jb3B5V2l0aGluKGRlc3QsIHNyYywgc3JjICsgbnVtKTtcbiAgICB9XG4gICAgSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgLyoqIG91dCBpbnQgKi8gbGVuZ3RoT2Zmc2V0KSB7XG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aE9mZnNldCwgYnl0ZUNvdW50KTtcbiAgICAgICAgbGV0IGJ1ZmZlciA9IHRoaXMudW5pdHlBcGkuX21hbGxvYyhieXRlQ291bnQgKyAxKTtcbiAgICAgICAgdGhpcy51bml0eUFwaS5zdHJpbmdUb1VURjgocmV0dXJuU3RyLCBidWZmZXIsIGJ5dGVDb3VudCArIDEpO1xuICAgICAgICByZXR1cm4gYnVmZmVyO1xuICAgIH1cbiAgICBKU1N0cmluZ1RvVGVtcENTU3RyaW5nKHJldHVyblN0ciwgLyoqIG91dCBpbnQgKi8gbGVuZ3RoT2Zmc2V0KSB7XG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aE9mZnNldCwgYnl0ZUNvdW50KTtcbiAgICAgICAgaWYgKHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSA8IGJ5dGVDb3VudCArIDEpIHtcbiAgICAgICAgICAgIHRoaXMudW5pdHlBcGkuX2ZyZWUodGhpcy5zdHJCdWZmZXIpO1xuICAgICAgICAgICAgdGhpcy5zdHJCdWZmZXIgPSB0aGlzLnVuaXR5QXBpLl9tYWxsb2ModGhpcy5zdHJpbmdCdWZmZXJTaXplID0gTWF0aC5tYXgoMiAqIHRoaXMuc3RyaW5nQnVmZmVyU2l6ZSwgYnl0ZUNvdW50ICsgMSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgdGhpcy5zdHJCdWZmZXIsIGJ5dGVDb3VudCArIDEpO1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJCdWZmZXI7XG4gICAgfVxuICAgIEpTU3RyaW5nVG9DU1N0cmluZ09uU3RhY2socmV0dXJuU3RyLCAvKiogb3V0IGludCAqLyBsZW5ndGhPZmZzZXQpIHtcbiAgICAgICAgaWYgKHJldHVyblN0ciA9PT0gbnVsbCB8fCByZXR1cm5TdHIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJ5dGVDb3VudCA9IHRoaXMudW5pdHlBcGkubGVuZ3RoQnl0ZXNVVEY4KHJldHVyblN0cik7XG4gICAgICAgIHNldE91dFZhbHVlMzIodGhpcywgbGVuZ3RoT2Zmc2V0LCBieXRlQ291bnQpO1xuICAgICAgICB2YXIgYnVmZmVyID0gdGhpcy51bml0eUFwaS5zdGFja0FsbG9jKGJ5dGVDb3VudCArIDEpO1xuICAgICAgICB0aGlzLnVuaXR5QXBpLnN0cmluZ1RvVVRGOChyZXR1cm5TdHIsIGJ1ZmZlciwgYnl0ZUNvdW50ICsgMSk7XG4gICAgICAgIHJldHVybiBidWZmZXI7XG4gICAgfVxuICAgIG1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGZ1bmN0aW9uUHRyLCBjYWxsYmFja0lkeCkge1xuICAgICAgICAvLyDkuI3og73nlKjnrq3lpLTlh73mlbDvvIHmraTlpITov5Tlm57nmoTlh73mlbDkvJrotYvlgLzliLDlhbfkvZPnmoRjbGFzc+S4iu+8jOWFtnRoaXPmjIfpkojmnInlkKvkuYnjgIJcbiAgICAgICAgY29uc3QgZW5naW5lID0gdGhpcztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgICBsZXQgY2FsbGJhY2tJbmZvUHRyID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRNb2NrUG9pbnRlcihhcmdzKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZW5naW5lLmNhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBcbiAgICAgICAgICAgICAgICAvLyBnZXRJbnRQdHJNYW5hZ2VyKCkuR2V0UG9pbnRlckZvckpTVmFsdWUodGhpcyksXG4gICAgICAgICAgICAgICAgaXNTdGF0aWMgPyAwIDogZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHRoaXMpLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja0lkeCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0UmV0dXJuVmFsdWVBbmRSZWN5Y2xlKGNhbGxiYWNrSW5mb1B0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpIHtcbiAgICAgICAgdGhpcy51bml0eUFwaS5fQ2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHNlbGZQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCk7XG4gICAgfVxuICAgIGNhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudW5pdHlBcGkuX0NhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xuICAgIH1cbiAgICBjYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBjYWxsYmFja0lkeCkge1xuICAgICAgICB0aGlzLnVuaXR5QXBpLl9DYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBjYWxsYmFja0lkeCk7XG4gICAgfVxufVxuZXhwb3J0cy5QdWVydHNKU0VuZ2luZSA9IFB1ZXJ0c0pTRW5naW5lO1xuZnVuY3Rpb24gR2V0VHlwZShlbmdpbmUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGlmIChpc0JpZ0ludCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIDI7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIDQ7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIDg7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHJldHVybiAxNjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiAyNTY7XG4gICAgfVxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgcmV0dXJuIDUxMjtcbiAgICB9XG4gICAgLy8gaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHsgcmV0dXJuIDEyOCB9XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIDY0O1xuICAgIH1cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCB2YWx1ZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIDEwMjQ7XG4gICAgfVxuICAgIGlmIChlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiAzMjtcbiAgICB9XG4gICAgcmV0dXJuIDY0O1xufVxuZXhwb3J0cy5HZXRUeXBlID0gR2V0VHlwZTtcbmZ1bmN0aW9uIG1ha2VCaWdJbnQobG93LCBoaWdoKSB7XG4gICAgcmV0dXJuIChCaWdJbnQoaGlnaCkgPDwgMzJuKSB8IEJpZ0ludChsb3cgPj4+IDApO1xufVxuZXhwb3J0cy5tYWtlQmlnSW50ID0gbWFrZUJpZ0ludDtcbmZ1bmN0aW9uIHNldE91dFZhbHVlMzIoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3ZhbHVlUHRyID4+IDJdID0gdmFsdWU7XG59XG5leHBvcnRzLnNldE91dFZhbHVlMzIgPSBzZXRPdXRWYWx1ZTMyO1xuZnVuY3Rpb24gc2V0T3V0VmFsdWU4KGVuZ2luZSwgdmFsdWVQdHIsIHZhbHVlKSB7XG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4W3ZhbHVlUHRyXSA9IHZhbHVlO1xufVxuZXhwb3J0cy5zZXRPdXRWYWx1ZTggPSBzZXRPdXRWYWx1ZTg7XG5mdW5jdGlvbiBpc0JpZ0ludCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIEJpZ0ludCB8fCB0eXBlb2YgdmFsdWUgPT09ICdiaWdpbnQnO1xufVxuZXhwb3J0cy5pc0JpZ0ludCA9IGlzQmlnSW50O1xuZnVuY3Rpb24gcmV0dXJuQmlnSW50KGVuZ2luZSwgdmFsdWUpIHtcbiAgICBlbmdpbmUudW5pdHlBcGkuX3NldFRlbXBSZXQwKE51bWJlcih2YWx1ZSA+PiAzMm4pKTsgLy8gaGlnaFxuICAgIHJldHVybiBOdW1iZXIodmFsdWUgJiAweGZmZmZmZmZmbik7IC8vIGxvd1xufVxuZXhwb3J0cy5yZXR1cm5CaWdJbnQgPSByZXR1cm5CaWdJbnQ7XG5mdW5jdGlvbiB3cml0ZUJpZ0ludChlbmdpbmUsIHB0ckluMzIsIHZhbHVlKSB7XG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXSA9IE51bWJlcih2YWx1ZSAmIDB4ZmZmZmZmZmZuKTsgLy8gbG93XG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyICsgMV0gPSBOdW1iZXIodmFsdWUgPj4gMzJuKTsgLy8gaGlnaFxufVxuY29uc3QgdG1wSW50M0FyciA9IG5ldyBJbnQzMkFycmF5KDIpO1xuY29uc3QgdG1wRmxvYXQ2NEFyciA9IG5ldyBGbG9hdDY0QXJyYXkodG1wSW50M0Fyci5idWZmZXIpO1xuZnVuY3Rpb24gd3JpdGVOdW1iZXIoZW5naW5lLCBwdHJJbjMyLCB2YWx1ZSkge1xuICAgIC8vIG51bWJlciBpbiBqcyBpcyBkb3VibGVcbiAgICB0bXBGbG9hdDY0QXJyWzBdID0gdmFsdWU7XG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXSA9IHRtcEludDNBcnJbMF07XG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyICsgMV0gPSB0bXBJbnQzQXJyWzFdO1xufVxuZnVuY3Rpb24gJEZpbGxBcmd1bWVudEZpbmFsTnVtYmVyVmFsdWUoZW5naW5lLCB2YWwsIGpzVmFsdWVUeXBlLCB2YWxQdHJJbjMyKSB7XG4gICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHN3aXRjaCAoanNWYWx1ZVR5cGUpIHtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHdyaXRlQmlnSW50KGVuZ2luZSwgdmFsUHRySW4zMiwgdmFsKTtcbiAgICAgICAgICAgICAgICAvLyBWYWx1ZUlzQmlnSW505Y+v5o2u5q2k5Yik5patXG4gICAgICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMlt2YWxQdHJJbjMyICsgMl0gPSA4OyAvKmxvbmcgPT0gOGJ5dGUqL1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHdyaXRlTnVtYmVyKGVuZ2luZSwgdmFsUHRySW4zMiwgK3ZhbCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1MTI6XG4gICAgICAgICAgICB3cml0ZU51bWJlcihlbmdpbmUsIHZhbFB0ckluMzIsIHZhbC5nZXRUaW1lKCkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuZnVuY3Rpb24gJEdldEFyZ3VtZW50RmluYWxWYWx1ZShlbmdpbmUsIHZhbCwganNWYWx1ZVR5cGUsIGxlbmd0aE9mZnNldCkge1xuICAgIGlmICghanNWYWx1ZVR5cGUpXG4gICAgICAgIGpzVmFsdWVUeXBlID0gR2V0VHlwZShlbmdpbmUsIHZhbCk7XG4gICAgc3dpdGNoIChqc1ZhbHVlVHlwZSkge1xuICAgICAgICBjYXNlIDg6IHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nT25TdGFjayh2YWwsIGxlbmd0aE9mZnNldCk7XG4gICAgICAgIGNhc2UgMTY6IHJldHVybiArdmFsO1xuICAgICAgICBjYXNlIDMyOiByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHZhbCk7XG4gICAgICAgIGNhc2UgNjQ6IHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3QodmFsKS5pZDtcbiAgICAgICAgY2FzZSAxMjg6IHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3QodmFsKS5pZDtcbiAgICAgICAgY2FzZSAyNTY6IHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbih2YWwpLmlkO1xuICAgICAgICBjYXNlIDEwMjQ6IHtcbiAgICAgICAgICAgIGxldCBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyh2YWwuYnl0ZUxlbmd0aCk7XG4gICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUFU4LnNldCh2YWwsIHB0cik7XG4gICAgICAgICAgICBzZXRPdXRWYWx1ZTMyKGVuZ2luZSwgbGVuZ3RoT2Zmc2V0LCB2YWwuYnl0ZUxlbmd0aCk7XG4gICAgICAgICAgICByZXR1cm4gcHRyO1xuICAgICAgICB9XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGlicmFyeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldE51bWJlckZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogbnVtYmVyIHtcbi8vICAgICByZXR1cm4gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbi8vIH1cbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXREYXRlRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBudW1iZXIge1xuLy8gICAgIHJldHVybiAoZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKSBhcyBEYXRlKS5nZXRUaW1lKCk7XG4vLyB9XG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0U3RyaW5nRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIC8qb3V0IGludCAqL2xlbmd0aE9mZnNldDogbnVtYmVyLCBpc0J5UmVmOiBib29sKTogbnVtYmVyIHtcbi8vICAgICB2YXIgcmV0dXJuU3RyID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPHN0cmluZz4odmFsdWUpO1xuLy8gICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgbGVuZ3RoT2Zmc2V0KTtcbi8vIH1cbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXRCb29sZWFuRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBib29sZWFuIHtcbi8vICAgICByZXR1cm4gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbi8vIH1cbi8vIGV4cG9ydCBmdW5jdGlvbiBWYWx1ZUlzQmlnSW50KGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBib29sZWFuIHtcbi8vICAgICB2YXIgYmlnaW50ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPGFueT4odmFsdWUpO1xuLy8gICAgIHJldHVybiBiaWdpbnQgaW5zdGFuY2VvZiBCaWdJbnQ7XG4vLyB9XG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0QmlnSW50RnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcbi8vICAgICB2YXIgYmlnaW50ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPGFueT4odmFsdWUpO1xuLy8gICAgIHJldHVybiBiaWdpbnQ7XG4vLyB9XG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0T2JqZWN0RnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcbi8vICAgICB2YXIgbmF0aXZlT2JqZWN0ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbi8vICAgICByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KG5hdGl2ZU9iamVjdCk7XG4vLyB9XG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0RnVuY3Rpb25Gcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IEpTRnVuY3Rpb25QdHIge1xuLy8gICAgIHZhciBmdW5jID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPCguLi5hcmdzOiBhbnlbXSkgPT4gYW55Pih2YWx1ZSk7XG4vLyAgICAgdmFyIGpzZnVuYyA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmMpO1xuLy8gICAgIHJldHVybiBqc2Z1bmMuaWQ7XG4vLyB9XG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0SlNPYmplY3RGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xuLy8gICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHI8KC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+KHZhbHVlKTtcbi8vICAgICB2YXIganNvYmogPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3Qob2JqKTtcbi8vICAgICByZXR1cm4ganNvYmouaWQ7XG4vLyB9XG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgLypvdXQgaW50ICovbGVuZ3RoT2Zmc2V0OiBhbnksIGlzT3V0OiBib29sKSB7XG4vLyAgICAgdmFyIGFiID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPEFycmF5QnVmZmVyPih2YWx1ZSk7XG4vLyAgICAgaWYgKGFiIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuLy8gICAgICAgICBhYiA9IGFiLmJ1ZmZlcjtcbi8vICAgICB9XG4vLyAgICAgdmFyIHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKGFiLmJ5dGVMZW5ndGgpO1xuLy8gICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XG4vLyAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltsZW5ndGhPZmZzZXQgPj4gMl0gPSBhYi5ieXRlTGVuZ3RoO1xuLy8gICAgIHNldE91dFZhbHVlMzIoZW5naW5lLCBsZW5ndGhPZmZzZXQsIGFiLmJ5dGVMZW5ndGgpO1xuLy8gICAgIHJldHVybiBwdHI7XG4vLyB9XG4vKipcbiAqIG1peGluXG4gKiBKU+iwg+eUqEMj5pe277yMQyPkvqfojrflj5ZKU+iwg+eUqOWPguaVsOeahOWAvFxuICpcbiAqIEBwYXJhbSBlbmdpbmVcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU0FyZ3VtZW50QVBJKGVuZ2luZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8qKioqKioqKioqKui/memDqOWIhueOsOWcqOmDveaYr0MrK+WunueOsOeahCoqKioqKioqKioqKi9cbiAgICAgICAgLy8gR2V0TnVtYmVyRnJvbVZhbHVlOiBHZXROdW1iZXJGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxuICAgICAgICAvLyBHZXREYXRlRnJvbVZhbHVlOiBHZXREYXRlRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcbiAgICAgICAgLy8gR2V0U3RyaW5nRnJvbVZhbHVlOiBHZXRTdHJpbmdGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxuICAgICAgICAvLyBHZXRCb29sZWFuRnJvbVZhbHVlOiBHZXRCb29sZWFuRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcbiAgICAgICAgLy8gVmFsdWVJc0JpZ0ludDogVmFsdWVJc0JpZ0ludC5iaW5kKG51bGwsIGVuZ2luZSksXG4gICAgICAgIC8vIEdldEJpZ0ludEZyb21WYWx1ZTogR2V0QmlnSW50RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcbiAgICAgICAgLy8gR2V0T2JqZWN0RnJvbVZhbHVlOiBHZXRPYmplY3RGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxuICAgICAgICAvLyBHZXRGdW5jdGlvbkZyb21WYWx1ZTogR2V0RnVuY3Rpb25Gcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxuICAgICAgICAvLyBHZXRKU09iamVjdEZyb21WYWx1ZTogR2V0SlNPYmplY3RGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxuICAgICAgICAvLyBHZXRBcnJheUJ1ZmZlckZyb21WYWx1ZTogR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxuICAgICAgICAvLyBHZXRBcmd1bWVudFR5cGU6IGZ1bmN0aW9uIChpc29sYXRlOiBJbnRQdHIsIGluZm86IE1vY2tJbnRQdHIsIGluZGV4OiBpbnQsIGlzQnlSZWY6IGJvb2wpIHtcbiAgICAgICAgLy8gICAgIHZhciB2YWx1ZSA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8sIGVuZ2luZSkuYXJnc1tpbmRleF07XG4gICAgICAgIC8vICAgICByZXR1cm4gR2V0VHlwZShlbmdpbmUsIHZhbHVlKTtcbiAgICAgICAgLy8gfSxcbiAgICAgICAgLy8gLyoqXG4gICAgICAgIC8vICAqIOS4umMj5L6n5o+Q5L6b5LiA5Liq6I635Y+WY2FsbGJhY2tpbmZv6YeManN2YWx1ZeeahGludHB0cueahOaOpeWPo1xuICAgICAgICAvLyAgKiDlubbkuI3mmK/lvpfnmoTliLDov5nkuKphcmd1bWVudOeahOWAvFxuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiDor6XmjqXlj6Plj6rmnInkvY3ov5DnrpfvvIznlLFDKyvlrp7njrBcbiAgICAgICAgLy8gICovXG4gICAgICAgIC8vIEdldEFyZ3VtZW50VmFsdWUvKmluQ2FsbGJhY2tJbmZvKi86IGZ1bmN0aW9uIChpbmZvcHRyOiBNb2NrSW50UHRyLCBpbmRleDogaW50KSB7XG4gICAgICAgIC8vICAgICByZXR1cm4gaW5mb3B0ciB8IGluZGV4O1xuICAgICAgICAvLyB9LFxuICAgICAgICAvLyBHZXRKc1ZhbHVlVHlwZTogZnVuY3Rpb24gKGlzb2xhdGU6IEludFB0ciwgdmFsOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XG4gICAgICAgIC8vICAgICAvLyBwdWJsaWMgZW51bSBKc1ZhbHVlVHlwZVxuICAgICAgICAvLyAgICAgLy8ge1xuICAgICAgICAvLyAgICAgLy8gICAgIE51bGxPclVuZGVmaW5lZCA9IDEsXG4gICAgICAgIC8vICAgICAvLyAgICAgQmlnSW50ID0gMixcbiAgICAgICAgLy8gICAgIC8vICAgICBOdW1iZXIgPSA0LFxuICAgICAgICAvLyAgICAgLy8gICAgIFN0cmluZyA9IDgsXG4gICAgICAgIC8vICAgICAvLyAgICAgQm9vbGVhbiA9IDE2LFxuICAgICAgICAvLyAgICAgLy8gICAgIE5hdGl2ZU9iamVjdCA9IDMyLFxuICAgICAgICAvLyAgICAgLy8gICAgIEpzT2JqZWN0ID0gNjQsXG4gICAgICAgIC8vICAgICAvLyAgICAgQXJyYXkgPSAxMjgsXG4gICAgICAgIC8vICAgICAvLyAgICAgRnVuY3Rpb24gPSAyNTYsXG4gICAgICAgIC8vICAgICAvLyAgICAgRGF0ZSA9IDUxMixcbiAgICAgICAgLy8gICAgIC8vICAgICBBcnJheUJ1ZmZlciA9IDEwMjQsXG4gICAgICAgIC8vICAgICAvLyAgICAgVW5rbm93ID0gMjA0OCxcbiAgICAgICAgLy8gICAgIC8vICAgICBBbnkgPSBOdWxsT3JVbmRlZmluZWQgfCBCaWdJbnQgfCBOdW1iZXIgfCBTdHJpbmcgfCBCb29sZWFuIHwgTmF0aXZlT2JqZWN0IHwgQXJyYXkgfCBGdW5jdGlvbiB8IERhdGUgfCBBcnJheUJ1ZmZlcixcbiAgICAgICAgLy8gICAgIC8vIH07XG4gICAgICAgIC8vICAgICB2YXIgdmFsdWU6IGFueSA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbCwgZW5naW5lKTtcbiAgICAgICAgLy8gICAgIHJldHVybiBHZXRUeXBlKGVuZ2luZSwgdmFsdWUpO1xuICAgICAgICAvLyB9LFxuICAgICAgICAvKioqKioqKioqKirku6XkuIrnjrDlnKjpg73mmK9DKyvlrp7njrDnmoQqKioqKioqKioqKiovXG4gICAgICAgIEdldFR5cGVJZEZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIGlmIChpc0J5UmVmKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIG9iaiA9IG9ialswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xuICAgICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdHlwZWlkID0gb2JqLl9mdW5jW1wiJGNpZFwiXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHR5cGVpZCA9IG9ialtcIiRjaWRcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEZyb21KU0FyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XG4vKipcbiAqIG1peGluXG4gKiBDI+iwg+eUqEpT5pe277yM6I635Y+WSlPlh73mlbDov5Tlm57lgLxcbiAqXG4gKiDljp/mnInnmoRyZXN1bHRJbmZv6K6+6K6h5Ye65p2l5Y+q5piv5Li65LqG6K6p5aSaaXNvbGF0ZeaXtuiDveWcqOS4jeWQjOeahGlzb2xhdGXph4zkv53mjIHkuI3lkIznmoRyZXN1bHRcbiAqIOWcqFdlYkdM5qih5byP5LiL5rKh5pyJ6L+Z5Liq54Om5oG877yM5Zug5q2k55u05o6l55SoZW5naW5l55qE5Y2z5Y+vXG4gKiByZXN1bHRJbmZv5Zu65a6a5Li6MTAyNFxuICpcbiAqIEBwYXJhbSBlbmdpbmVcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSShlbmdpbmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBHZXROdW1iZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XG4gICAgICAgIH0sXG4gICAgICAgIEdldERhdGVGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQuZ2V0VGltZSgpO1xuICAgICAgICB9LFxuICAgICAgICBHZXRTdHJpbmdGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvVGVtcENTU3RyaW5nKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQsIGxlbmd0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIEdldEJvb2xlYW5Gcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XG4gICAgICAgIH0sXG4gICAgICAgIFJlc3VsdElzQmlnSW50OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuaXNCaWdJbnQpKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xuICAgICAgICB9LFxuICAgICAgICBHZXRCaWdJbnRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgLy8gcHVlcnRzIGNvcmUgdjIuMC405byA5aeL5pSv5oyBXG4gICAgICAgICAgICByZXR1cm4gKDAsIGxpYnJhcnlfMS5yZXR1cm5CaWdJbnQpKGVuZ2luZSwgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XG4gICAgICAgIH0sXG4gICAgICAgIEdldE9iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xuICAgICAgICB9LFxuICAgICAgICBHZXRUeXBlSWRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSB2YWx1ZS5fZnVuY1tcIiRjaWRcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSB2YWx1ZVtcIiRjaWRcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xuICAgICAgICB9LFxuICAgICAgICBHZXRGdW5jdGlvbkZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xuICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0SlNPYmplY3RGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgdmFyIGpzb2JqID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdChlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcbiAgICAgICAgICAgIHJldHVybiBqc29iai5pZDtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0QXJyYXlCdWZmZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGFiID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcbiAgICAgICAgICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XG4gICAgICAgICAgICAoMCwgbGlicmFyeV8xLnNldE91dFZhbHVlMzIpKGVuZ2luZSwgbGVuZ3RoLCBhYi5ieXRlTGVuZ3RoKTtcbiAgICAgICAgICAgIHJldHVybiBwdHI7XG4gICAgICAgIH0sXG4gICAgICAgIC8v5L+d5a6I5pa55qGIXG4gICAgICAgIEdldFJlc3VsdFR5cGU6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuR2V0VHlwZSkoZW5naW5lLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEZyb21KU1JldHVybi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xuLyoqXG4gKiBtaXhpblxuICog5rOo5YaM57G7QVBJ77yM5aaC5rOo5YaM5YWo5bGA5Ye95pWw44CB5rOo5YaM57G777yM5Lul5Y+K57G755qE5bGe5oCn5pa55rOV562JXG4gKlxuICogQHBhcmFtIGVuZ2luZVxuICogQHJldHVybnNcbiAqL1xuZnVuY3Rpb24gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEkoZW5naW5lKSB7XG4gICAgY29uc3QgcmV0dXJuZWUgPSB7XG4gICAgICAgIFNldEdsb2JhbEZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgbmFtZVN0cmluZywgdjhGdW5jdGlvbkNhbGxiYWNrLCBqc0VudklkeCwgY2FsbGJhY2tpZHgpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xuICAgICAgICAgICAgbGlicmFyeV8xLmdsb2JhbFtuYW1lXSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKHRydWUsIHY4RnVuY3Rpb25DYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xuICAgICAgICB9LFxuICAgICAgICBfUmVnaXN0ZXJDbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwganNFbnZJZHgsIGNhbGxiYWNraWR4LCBzaXplKSB7XG4gICAgICAgICAgICBjb25zdCBmdWxsTmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoZnVsbE5hbWVTdHJpbmcpO1xuICAgICAgICAgICAgY29uc3QgY3NoYXJwT2JqZWN0TWFwID0gZW5naW5lLmNzaGFycE9iamVjdE1hcDtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMubGVuZ3RoO1xuICAgICAgICAgICAgbGV0IHRlbXBFeHRlcm5hbENTSUQgPSAwO1xuICAgICAgICAgICAgY29uc3QgY3RvciA9IGZ1bmN0aW9uIE5hdGl2ZU9iamVjdCgpIHtcbiAgICAgICAgICAgICAgICAvLyDorr7nva7nsbvlnotJRFxuICAgICAgICAgICAgICAgIHRoaXNbXCIkY2lkXCJdID0gaWQ7XG4gICAgICAgICAgICAgICAgLy8gbmF0aXZlT2JqZWN055qE5p6E6YCg5Ye95pWwXG4gICAgICAgICAgICAgICAgLy8g5p6E6YCg5Ye95pWw5pyJ5Lik5Liq6LCD55So55qE5Zyw5pa577yaMS4ganPkvqduZXfkuIDkuKrlroPnmoTml7blgJkgMi4gY3PkvqfliJvlu7rkuobkuIDkuKrlr7nosaHopoHkvKDliLBqc+S+p+aXtlxuICAgICAgICAgICAgICAgIC8vIOesrOS4gOS4quaDheWGte+8jGNz5a+56LGhSUTmiJbogIXmmK9jYWxsVjhDb25zdHJ1Y3RvckNhbGxiYWNr6L+U5Zue55qE44CCXG4gICAgICAgICAgICAgICAgLy8g56ys5LqM5Liq5oOF5Ya177yM5YiZY3Plr7nosaFJROaYr2NzIG5ld+WujOS5i+WQjuS4gOW5tuS8oOe7mWpz55qE44CCXG4gICAgICAgICAgICAgICAgbGV0IGNzSUQgPSB0ZW1wRXh0ZXJuYWxDU0lEOyAvLyDlpoLmnpzmmK/nrKzkuozkuKrmg4XlhrXvvIzmraRJROeUsWNyZWF0ZUZyb21DU+iuvue9rlxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSAwO1xuICAgICAgICAgICAgICAgIGlmIChjc0lEID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFja0luZm9QdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAvLyDomb3nhLZwdWVydHPlhoVDb25zdHJ1Y3RvcueahOi/lOWbnuWAvOWPq3NlbGbvvIzkvYblroPlhbblrp7lsLHmmK9DU+WvueixoeeahOS4gOS4qmlk6ICM5bey44CCXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjc0lEID0gZW5naW5lLmNhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGNvbnN0cnVjdG9yLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja2lkeCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLlJlbGVhc2VCeU1vY2tJbnRQdHIoY2FsbGJhY2tJbmZvUHRyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYmxpdHRhYmxlXG4gICAgICAgICAgICAgICAgaWYgKHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNzTmV3SUQgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhzaXplKTtcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLm1lbWNweShjc05ld0lELCBjc0lELCBzaXplKTtcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc05ld0lELCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5PbkZpbmFsaXplKSh0aGlzLCBjc05ld0lELCAoY3NJZGVudGlmaWVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAucmVtb3ZlKGNzSWRlbnRpZmllcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuX2ZyZWUoY3NJZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuYWRkKGNzSUQsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzSUQsIChjc0lkZW50aWZpZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5yZW1vdmUoY3NJZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5jYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrKGRlc3RydWN0b3IgfHwgZW5naW5lLmdlbmVyYWxEZXN0cnVjdG9yLCBjc0lkZW50aWZpZXIsIGNhbGxiYWNraWR4KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGN0b3IuY3JlYXRlRnJvbUNTID0gZnVuY3Rpb24gKGNzSUQpIHtcbiAgICAgICAgICAgICAgICB0ZW1wRXh0ZXJuYWxDU0lEID0gY3NJRDtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGN0b3IoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjdG9yLl9fcHVlcnRzTWV0YWRhdGEgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3RvciwgXCJuYW1lXCIsIHsgdmFsdWU6IGZ1bGxOYW1lICsgXCJDb25zdHJ1Y3RvclwiIH0pO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwiJGNpZFwiLCB7IHZhbHVlOiBpZCB9KTtcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5jbGFzc2VzLnB1c2goY3Rvcik7XG4gICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuY2xhc3NJRFdlYWtNYXAuc2V0KGN0b3IsIGlkKTtcbiAgICAgICAgICAgIGlmIChCYXNlVHlwZUlkID4gMCkge1xuICAgICAgICAgICAgICAgIGN0b3IucHJvdG90eXBlLl9fcHJvdG9fXyA9IGNzaGFycE9iamVjdE1hcC5jbGFzc2VzW0Jhc2VUeXBlSWRdLnByb3RvdHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5uYW1lc1RvQ2xhc3Nlc0lEW2Z1bGxOYW1lXSA9IGlkO1xuICAgICAgICAgICAgcmV0dXJuIGlkO1xuICAgICAgICB9LFxuICAgICAgICBSZWdpc3RlclN0cnVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCwgc2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJldHVybmVlLl9SZWdpc3RlckNsYXNzKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwgY2FsbGJhY2tpZHgsIGNhbGxiYWNraWR4LCBzaXplKTtcbiAgICAgICAgfSxcbiAgICAgICAgUmVnaXN0ZXJGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBjYWxsYmFjaywgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCkge1xuICAgICAgICAgICAgdmFyIGNscyA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcbiAgICAgICAgICAgIGlmICghY2xzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGZuID0gZW5naW5lLm1ha2VDU2hhcnBGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGNhbGxiYWNrLCBjYWxsYmFja2lkeCk7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xuICAgICAgICAgICAgICAgIGNsc1tuYW1lXSA9IGZuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xzLnByb3RvdHlwZVtuYW1lXSA9IGZuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBSZWdpc3RlclByb3BlcnR5OiBmdW5jdGlvbiAoaXNvbGF0ZSwgY2xhc3NJRCwgbmFtZVN0cmluZywgaXNTdGF0aWMsIGdldHRlciwgXG4gICAgICAgIC8qbG9uZyAqLyBnZXR0ZXJqc0VudklkeCwgXG4gICAgICAgIC8qbG9uZyAqLyBnZXR0ZXJjYWxsYmFja2lkeCwgc2V0dGVyLCBcbiAgICAgICAgLypsb25nICovIHNldHRlcmpzRW52SWR4LCBcbiAgICAgICAgLypsb25nICovIHNldHRlcmNhbGxiYWNraWR4LCBkb250RGVsZXRlKSB7XG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xuICAgICAgICAgICAgaWYgKCFjbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcbiAgICAgICAgICAgIHZhciBhdHRyID0ge1xuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogIWRvbnREZWxldGUsXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2VcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhdHRyLmdldCA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBnZXR0ZXIsIGdldHRlcmNhbGxiYWNraWR4KTtcbiAgICAgICAgICAgIGlmIChzZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICBhdHRyLnNldCA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBzZXR0ZXIsIHNldHRlcmNhbGxiYWNraWR4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbHMsIG5hbWUsIGF0dHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscy5wcm90b3R5cGUsIG5hbWUsIGF0dHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG4gICAgcmV0dXJuIHJldHVybmVlO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1yZWdpc3Rlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xuLyoqXG4gKiBtaXhpblxuICogQyPosIPnlKhKU+aXtu+8jOiuvue9ruiwg+eUqOWPguaVsOeahOWAvFxuICpcbiAqIEBwYXJhbSBlbmdpbmVcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSW52b2tlSlNBcmd1bWVudEFwaShlbmdpbmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAvL2JlZ2luIGNzIGNhbGwganNcbiAgICAgICAgUHVzaE51bGxGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBQdXNoRGF0ZUZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGRhdGVWYWx1ZSkge1xuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChuZXcgRGF0ZShkYXRlVmFsdWUpKTtcbiAgICAgICAgfSxcbiAgICAgICAgUHVzaEJvb2xlYW5Gb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBiKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKCEhYik7XG4gICAgICAgIH0sXG4gICAgICAgIFB1c2hCaWdJbnRGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKmxvbmcgKi8gbG9uZ2xvdywgbG9uZ2hpZ2gpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb25nbG93LCBsb25naGlnaCkpO1xuICAgICAgICB9LFxuICAgICAgICBQdXNoU3RyaW5nRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgc3RyU3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKSk7XG4gICAgICAgIH0sXG4gICAgICAgIFB1c2hOdW1iZXJGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBkKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGQpO1xuICAgICAgICB9LFxuICAgICAgICBQdXNoT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgY2xhc3NJRCwgb2JqZWN0SUQpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qob2JqZWN0SUQsIGNsYXNzSUQpKTtcbiAgICAgICAgfSxcbiAgICAgICAgUHVzaEpTRnVuY3Rpb25Gb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBKU0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKEpTRnVuY3Rpb24pLl9mdW5jKTtcbiAgICAgICAgfSxcbiAgICAgICAgUHVzaEpTT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNPYmplY3RCeUlkKEpTT2JqZWN0KS5nZXRPYmplY3QoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIFB1c2hBcnJheUJ1ZmZlckZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qYnl0ZVtdICovIGluZGV4LCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0ludm9rZUpTQXJndW1lbnRBcGk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0ludm9rZUpTQXJndW1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcbi8qKlxuICogbWl4aW5cbiAqIEpT6LCD55SoQyPml7bvvIxDI+iuvue9rui/lOWbnuWIsEpT55qE5YC8XG4gKlxuICogQHBhcmFtIGVuZ2luZVxuICogQHJldHVybnNcbiAqL1xuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9KU0ludm9rZVJldHVybkFwaShlbmdpbmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBSZXR1cm5DbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGNsYXNzSUQpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbY2xhc3NJRF07XG4gICAgICAgIH0sXG4gICAgICAgIFJldHVybk9iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGNsYXNzSUQsIHNlbGYpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChzZWxmLCBjbGFzc0lEKTtcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuTnVtYmVyOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgbnVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbnVtYmVyO1xuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5TdHJpbmc6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBzdHJTdHJpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKTtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBzdHI7XG4gICAgICAgIH0sXG4gICAgICAgIFJldHVybkJpZ0ludDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGxvbmdMb3csIGxvbmdIaWdoKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb25nTG93LCBsb25nSGlnaCk7XG4gICAgICAgIH0sXG4gICAgICAgIFJldHVybkJvb2xlYW46IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBiKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gISFiOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5EYXRlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgZGF0ZSkge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG5ldyBEYXRlKGRhdGUpO1xuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5OdWxsOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIFJldHVybkZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgSlNGdW5jdGlvblB0cikge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNvbnN0IGpzRnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKEpTRnVuY3Rpb25QdHIpO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0ganNGdW5jLl9mdW5jO1xuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5KU09iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIEpTT2JqZWN0UHRyKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY29uc3QganNPYmplY3QgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU09iamVjdEJ5SWQoSlNPYmplY3RQdHIpO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0ganNPYmplY3QuZ2V0T2JqZWN0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIFJldHVybkNTaGFycEZ1bmN0aW9uQ2FsbGJhY2s6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIFxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckxvdywgXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVySGlnaCkge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGZhbHNlLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIHBvaW50ZXJIaWdoKTtcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuQXJyYXlCdWZmZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCAvKmJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0pTSW52b2tlUmV0dXJuQXBpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9KU0ludm9rZVJldHVybi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xuLyoqXG4gKiBtaXhpblxuICogSlPosIPnlKhDI+aXtu+8jEMj5L6n6K6+572ub3V05Y+C5pWw5YC8XG4gKlxuICogQHBhcmFtIGVuZ2luZVxuICogQHJldHVybnNcbiAqL1xuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9KU091dEFyZ3VtZW50QVBJKGVuZ2luZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIFNldE51bWJlclRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgbnVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIG9ialswXSA9IG51bWJlcjtcbiAgICAgICAgfSxcbiAgICAgICAgU2V0RGF0ZVRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgZGF0ZSkge1xuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmpbMF0gPSBuZXcgRGF0ZShkYXRlKTtcbiAgICAgICAgfSxcbiAgICAgICAgU2V0U3RyaW5nVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBzdHJTdHJpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKTtcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xuICAgICAgICAgICAgb2JqWzBdID0gc3RyO1xuICAgICAgICB9LFxuICAgICAgICBTZXRCb29sZWFuVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBiKSB7XG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIG9ialswXSA9ICEhYjsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcbiAgICAgICAgfSxcbiAgICAgICAgU2V0QmlnSW50VG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBsb3csIGhpZ2gpIHtcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmpbMF0gPSAoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvdywgaGlnaCk7XG4gICAgICAgIH0sXG4gICAgICAgIFNldE9iamVjdFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgY2xhc3NJRCwgc2VsZikge1xuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmpbMF0gPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChzZWxmLCBjbGFzc0lEKTtcbiAgICAgICAgfSxcbiAgICAgICAgU2V0TnVsbFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmpbMF0gPSBudWxsOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxuICAgICAgICB9LFxuICAgICAgICBTZXRBcnJheUJ1ZmZlclRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgLypCeXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmpbMF0gPSBlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSlNPdXRBcmd1bWVudC5qcy5tYXAiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICog5qC55o2uIGh0dHBzOi8vZG9jcy51bml0eTNkLmNvbS8yMDE4LjQvRG9jdW1lbnRhdGlvbi9NYW51YWwvd2ViZ2wtaW50ZXJhY3Rpbmd3aXRoYnJvd3NlcnNjcmlwdGluZy5odG1sXG4gKiDmiJHku6znmoTnm67nmoTlsLHmmK/lnKhXZWJHTOaooeW8j+S4i++8jOWunueOsOWSjHB1ZXJ0cy5kbGznmoTmlYjmnpzjgILlhbfkvZPlnKjkuo7lrp7njrDkuIDkuKpqc2xpYu+8jOmHjOmdouW6lOWMheWQq1B1ZXJ0c0RMTC5jc+eahOaJgOacieaOpeWPo1xuICog5a6e6aqM5Y+R546w6L+Z5LiqanNsaWLomb3nhLbkuZ/mmK/ov5DooYzlnKh2OOeahGpz77yM5L2G5a+5ZGV2dG9vbOiwg+ivleW5tuS4jeWPi+Wlve+8jOS4lOWPquaUr+aMgeWIsGVzNeOAglxuICog5Zug5q2k5bqU6K+l6YCa6L+H5LiA5Liq54us56uL55qEanPlrp7njrDmjqXlj6PvvIxwdWVydHMuanNsaWLpgJrov4flhajlsYDnmoTmlrnlvI/osIPnlKjlroPjgIJcbiAqXG4gKiDmnIDnu4jlvaLmiJDlpoLkuIvmnrbmnoRcbiAqIOS4muWKoUpTIDwtPiBXQVNNIDwtPiB1bml0eSBqc2xpYiA8LT4g5pysanNcbiAqIOS9huaVtOadoemTvui3r+WFtuWunumDveWcqOS4gOS4qnY4KGpzY29yZSnomZrmi5/mnLrph4xcbiAqL1xuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4vbGlicmFyeVwiKTtcbmNvbnN0IGdldEZyb21KU0FyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvZ2V0RnJvbUpTQXJndW1lbnRcIik7XG5jb25zdCBnZXRGcm9tSlNSZXR1cm5fMSA9IHJlcXVpcmUoXCIuL21peGlucy9nZXRGcm9tSlNSZXR1cm5cIik7XG5jb25zdCByZWdpc3Rlcl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3JlZ2lzdGVyXCIpO1xuY29uc3Qgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9JbnZva2VKU0FyZ3VtZW50XCIpO1xuY29uc3Qgc2V0VG9KU0ludm9rZVJldHVybl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSlNJbnZva2VSZXR1cm5cIik7XG5jb25zdCBzZXRUb0pTT3V0QXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0pTT3V0QXJndW1lbnRcIik7XG5saWJyYXJ5XzEuZ2xvYmFsLnd4UmVxdWlyZSA9IGxpYnJhcnlfMS5nbG9iYWwucmVxdWlyZTtcbmxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wgPSB7XG4gICAgaW5pdGVkOiBmYWxzZSxcbiAgICBkZWJ1ZzogZmFsc2UsXG4gICAgLy8gcHVlcnRz6aaW5qyh5Yid5aeL5YyW5pe25Lya6LCD55So6L+Z6YeM77yM5bm25oqKVW5pdHnnmoTpgJrkv6HmjqXlj6PkvKDlhaVcbiAgICBJbml0KGN0b3JQYXJhbSkge1xuICAgICAgICBjb25zdCBlbmdpbmUgPSBuZXcgbGlicmFyeV8xLlB1ZXJ0c0pTRW5naW5lKGN0b3JQYXJhbSk7XG4gICAgICAgIGNvbnN0IGV4ZWN1dGVNb2R1bGVDYWNoZSA9IHt9O1xuICAgICAgICBsZXQganNFbmdpbmVSZXR1cm5lZCA9IGZhbHNlO1xuICAgICAgICBsZXQgbG9hZGVyO1xuICAgICAgICAvLyBQdWVydHNETEznmoTmiYDmnInmjqXlj6Plrp7njrBcbiAgICAgICAgbGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IE9iamVjdC5hc3NpZ24obGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCwge1xuICAgICAgICAgICAgdXBkYXRlR2xvYmFsQnVmZmVyQW5kVmlld3M6IGVuZ2luZS51cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3cy5iaW5kKGVuZ2luZSlcbiAgICAgICAgfSwgKDAsIGdldEZyb21KU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIGdldEZyb21KU1JldHVybl8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBzZXRUb0ludm9rZUpTQXJndW1lbnRfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU0ludm9rZVJldHVybl8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBzZXRUb0pTT3V0QXJndW1lbnRfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgcmVnaXN0ZXJfMS5kZWZhdWx0KShlbmdpbmUpLCB7XG4gICAgICAgICAgICAvLyBicmlkZ2VMb2c6IHRydWUsXG4gICAgICAgICAgICBHZXRMaWJWZXJzaW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDMyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEdldEFwaUxldmVsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDMyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEdldExpYkJhY2tlbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBDcmVhdGVKU0VuZ2luZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChqc0VuZ2luZVJldHVybmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm9ubHkgb25lIGF2YWlsYWJsZSBqc0VudiBpcyBhbGxvd2VkIGluIFdlYkdMIG1vZGVcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGpzRW5naW5lUmV0dXJuZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENyZWF0ZUpTRW5naW5lV2l0aEV4dGVybmFsRW52OiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICBEZXN0cm95SlNFbmdpbmU6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgIEdldExhc3RFeGNlcHRpb25JbmZvOiBmdW5jdGlvbiAoaXNvbGF0ZSwgLyogb3V0IGludCAqLyBzdHJsZW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhlbmdpbmUubGFzdEV4Y2VwdGlvbi5zdGFjaywgc3RybGVuKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBMb3dNZW1vcnlOb3RpZmljYXRpb246IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXG4gICAgICAgICAgICBJZGxlTm90aWZpY2F0aW9uRGVhZGxpbmU6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXG4gICAgICAgICAgICBSZXF1ZXN0TWlub3JHYXJiYWdlQ29sbGVjdGlvbkZvclRlc3Rpbmc6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXG4gICAgICAgICAgICBSZXF1ZXN0RnVsbEdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcbiAgICAgICAgICAgIFNldEdlbmVyYWxEZXN0cnVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2dlbmVyYWxEZXN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgZW5naW5lLmdlbmVyYWxEZXN0cnVjdG9yID0gX2dlbmVyYWxEZXN0cnVjdG9yO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEdldE1vZHVsZUV4ZWN1dG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVyID0gdHlwZW9mIF9fdGdqc0dldExvYWRlciAhPSAndW5kZWZpbmVkJyA/IF9fdGdqc0dldExvYWRlcigpIDogbnVsbDtcbiAgICAgICAgICAgICAgICBjb25zdCBsb2FkZXJSZXNvbHZlID0gbG9hZGVyLlJlc29sdmUgPyAoZnVuY3Rpb24gKGZpbGVOYW1lLCB0byA9IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWROYW1lID0gbG9hZGVyLlJlc29sdmUoZmlsZU5hbWUsIHRvKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kdWxlIG5vdCBmb3VuZDogJyArIGZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZWROYW1lO1xuICAgICAgICAgICAgICAgIH0pIDogbnVsbDtcbiAgICAgICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmN0aW9uIChmaWxlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoWydwdWVydHMvbG9nLm1qcycsICdwdWVydHMvdGltZXIubWpzJ10uaW5kZXhPZihmaWxlTmFtZSkgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVyUmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZU5hbWUgPSBsb2FkZXJSZXNvbHZlKGZpbGVOYW1lLCBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB3eFJlcXVpcmUoJ3B1ZXJ0c19taW5pZ2FtZV9qc19yZXNvdXJjZXMvJyArIChmaWxlTmFtZS5lbmRzV2l0aCgnLmpzJykgPyBmaWxlTmFtZSA6IGZpbGVOYW1lICsgXCIuanNcIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShuYW1lLCB0bykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgQ1MgIT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDUy5QdWVydHMuUGF0aEhlbHBlci5Jc1JlbGF0aXZlKHRvKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmV0ID0gQ1MuUHVlcnRzLlBhdGhIZWxwZXIubm9ybWFsaXplKENTLlB1ZXJ0cy5QYXRoSGVscGVyLkRpcm5hbWUobmFtZSkgKyBcIi9cIiArIHRvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRvO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbW9ja1JlcXVpcmUoc3BlY2lmaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBleHBvcnRzOiB7fSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kQ2FjaGVTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgZXhlY3V0ZU1vZHVsZUNhY2hlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRDYWNoZVNwZWNpZmllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuZXhwb3J0cyA9IGV4ZWN1dGVNb2R1bGVDYWNoZVtmb3VuZENhY2hlU3BlY2lmaWVyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIFBVRVJUU19KU19SRVNPVVJDRVMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kU3BlY2lmaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBub3QgZm91bmQ6ICcgKyBzcGVjaWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWNpZmllciA9IGZvdW5kU3BlY2lmaWVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUFVFUlRTX0pTX1JFU09VUkNFU1tzcGVjaWZpZXJdKHJlc3VsdC5leHBvcnRzLCBmdW5jdGlvbiBtUmVxdWlyZShzcGVjaWZpZXJUbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2NrUmVxdWlyZShsb2FkZXJSZXNvbHZlID8gbG9hZGVyUmVzb2x2ZShzcGVjaWZpZXJUbywgc3BlY2lmaWVyKSA6IG5vcm1hbGl6ZShzcGVjaWZpZXIsIHNwZWNpZmllclRvKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gcmVzdWx0LmV4cG9ydHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuZXhwb3J0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0cnlGaW5kTmFtZSA9IFtzcGVjaWZpZXJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3BlY2lmaWVyLmluZGV4T2YoJy4nKSA9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeUZpbmROYW1lID0gdHJ5RmluZE5hbWUuY29uY2F0KFtzcGVjaWZpZXIgKyAnLmpzJywgc3BlY2lmaWVyICsgJy50cycsIHNwZWNpZmllciArICcubWpzJywgc3BlY2lmaWVyICsgJy5tdHMnXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSB0cnlGaW5kTmFtZS5yZWR1Y2UoKHJldCwgbmFtZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXQgIT09IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqW25hbWVdID09IC0xKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNpcmN1bGFyIGRlcGVuZGVuY3kgaXMgZGV0ZWN0ZWQgd2hlbiByZXF1aXJpbmcgXCIke25hbWV9XCJgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbmRlZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyeUZpbmROYW1lW2ZpbmRlZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmVSZXQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEdldEpTT2JqZWN0VmFsdWVHZXR0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmN0aW9uIChvYmosIGtleSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqW2tleV07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBFdmFsOiBmdW5jdGlvbiAoaXNvbGF0ZSwgY29kZVN0cmluZywgcGF0aCkge1xuICAgICAgICAgICAgICAgIGlmICghbGlicmFyeV8xLmdsb2JhbC5ldmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImV2YWwgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29kZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoY29kZVN0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGxpYnJhcnlfMS5nbG9iYWwuZXZhbChjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGdldEludFB0ck1hbmFnZXIoKS5HZXRQb2ludGVyRm9ySlNWYWx1ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLypGUmVzdWx0SW5mbyAqLyAxMDI0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdEV4Y2VwdGlvbiA9IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFNldFB1c2hKU0Z1bmN0aW9uQXJndW1lbnRzQ2FsbGJhY2s6IGZ1bmN0aW9uIChpc29sYXRlLCBjYWxsYmFjaywganNFbnZJZHgpIHtcbiAgICAgICAgICAgICAgICBlbmdpbmUuR2V0SlNBcmd1bWVudHNDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFRocm93RXhjZXB0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgLypieXRlW10gKi8gbWVzc2FnZVN0cmluZykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG1lc3NhZ2VTdHJpbmcpKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBJbnZva2VKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBoYXNSZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoZnVuYyBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gZnVuYy5pbnZva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMubGFzdEV4Y2VwdGlvbiA9IGVycjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgR2V0RnVuY3Rpb25MYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypvdXQgaW50ICovIGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZnVuYy5sYXN0RXhjZXB0aW9uLnN0YWNrIHx8IGZ1bmMubGFzdEV4Y2VwdGlvbi5tZXNzYWdlIHx8ICcnLCBsZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwdHIgaXMgbm90IGEganNmdW5jJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFJlbGVhc2VKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVtb3ZlSlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBSZWxlYXNlSlNPYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBvYmopIHtcbiAgICAgICAgICAgICAgICBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZW1vdmVKU09iamVjdEJ5SWQob2JqKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBSZXNldFJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcbiAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBDbGVhck1vZHVsZUNhY2hlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICBDcmVhdGVJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlLCBwb3J0KSB7IH0sXG4gICAgICAgICAgICBEZXN0cm95SW5zcGVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxuICAgICAgICAgICAgSW5zcGVjdG9yVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcbiAgICAgICAgICAgIExvZ2ljVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcbiAgICAgICAgICAgIFNldExvZ0NhbGxiYWNrOiBmdW5jdGlvbiAobG9nLCBsb2dXYXJuaW5nLCBsb2dFcnJvcikge1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9