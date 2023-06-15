/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./output/library.js":
/*!***************************!*\
  !*** ./output/library.js ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setOutValue8 = exports.setOutValue32 = exports.makeBigInt = exports.GetType = exports.PuertsJSEngine = exports.OnFinalize = exports.createWeakRef = exports.global = exports.CSharpObjectMap = exports.jsFunctionOrObjectFactory = exports.JSObject = exports.JSFunction = exports.Ref = exports.FunctionCallbackInfoPtrManager = exports.FunctionCallbackInfo = void 0;
const getFromJSArgument_1 = __webpack_require__(/*! ./mixins/getFromJSArgument */ "./output/mixins/getFromJSArgument.js");
/**
 * 一次函数调用的info
 * 对应v8::FunctionCallbackInfo
 */
class FunctionCallbackInfo {
    args;
    returnValue;
    constructor(args) {
        this.args = args;
    }
    recycle() {
        this.args = null;
        this.returnValue = void 0;
    }
}
exports.FunctionCallbackInfo = FunctionCallbackInfo;
/**
 * 把FunctionCallbackInfo以及其参数转化为c#可用的intptr
 */
class FunctionCallbackInfoPtrManager {
    // FunctionCallbackInfo的列表，以列表的index作为IntPtr的值
    infos = [new FunctionCallbackInfo([0])]; // 这里原本只是个普通的0
    // FunctionCallbackInfo用完后，将其序号放入“回收列表”，下次就能继续服用该index，而不必让infos数组无限扩展下去
    freeInfosIndex = [];
    freeCallbackInfoMemoryByLength = {};
    argumentValueLengthIn32 = 4;
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    allocCallbackInfoMemory(argslength) {
        if (this.freeCallbackInfoMemoryByLength[argslength] &&
            this.freeCallbackInfoMemoryByLength[argslength].length) {
            return this.freeCallbackInfoMemoryByLength[argslength].pop();
        }
        else {
            return this.engine.unityApi._malloc((argslength * this.argumentValueLengthIn32 + 1) << 2);
        }
    }
    recycleCallbackInfoMemory(bufferptr, argslength) {
        if (!this.freeCallbackInfoMemoryByLength[argslength] && argslength < 5) {
            this.freeCallbackInfoMemoryByLength[argslength] = [];
        }
        // 拍脑袋定的最大缓存个数大小。 50 - 参数个数 * 10
        if (this.freeCallbackInfoMemoryByLength[argslength].length > (50 - argslength * 10)) {
            this.engine.unityApi._free(bufferptr);
        }
        else {
            this.freeCallbackInfoMemoryByLength[argslength].push(bufferptr);
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
        var buffer = this.allocCallbackInfoMemory(args.length);
        let index;
        index = this.freeInfosIndex.pop();
        // index最小为1
        if (index) {
            this.infos[index].args = args;
        }
        else {
            index = this.infos.push(new FunctionCallbackInfo(args)) - 1;
        }
        this.engine.unityApi.HEAP32[buffer >> 2] = index;
        for (var i = 0; i < args.length; i++) {
            // init each value
            const jsValueType = GetType(this.engine, args[i]);
            this.engine.unityApi.HEAP32[(buffer >> 2) + (1 + i * this.argumentValueLengthIn32)] = buffer; // a pointer to the info
            this.engine.unityApi.HEAP32[(buffer >> 2) + (2 + i * this.argumentValueLengthIn32)] = jsValueType; // jsvaluetype
            this.engine.unityApi.HEAPF32[(buffer >> 2) + (3 + i * this.argumentValueLengthIn32)] = (0, getFromJSArgument_1.$GetArgumentFinalValue)(this.engine, args[i], jsValueType, ((buffer >> 2) + (4 + i * this.argumentValueLengthIn32)) << 2); // value
        }
        return buffer;
    }
    // static GetByMockPointer(intptr: MockIntPtr): FunctionCallbackInfo {
    //     return this.infos[intptr >> 4];
    // }
    GetByMockPointer(intptr) {
        const index = this.engine.unityApi.HEAP32[intptr >> 2];
        return this.infos[index];
    }
    GetReturnValueAndRecycle(intptr) {
        const index = this.engine.unityApi.HEAP32[intptr >> 2];
        let info = this.infos[index];
        let ret = info.returnValue;
        this.recycleCallbackInfoMemory(intptr, info.args.length);
        info.recycle();
        this.freeInfosIndex.push(index);
        return ret;
    }
    ReleaseByMockIntPtr(intptr) {
        const index = this.engine.unityApi.HEAP32[intptr >> 2];
        let info = this.infos[index];
        this.recycleCallbackInfoMemory(intptr, info.args.length);
        info.recycle();
        this.freeInfosIndex.push(index);
    }
    GetArgsByMockIntPtr(valueptr) {
        const infoptr = this.engine.unityApi.HEAP32[valueptr >> 2];
        const callbackInfoIndex = this.engine.unityApi.HEAP32[infoptr >> 2];
        const argsIndex = (valueptr - infoptr - 4) / (4 * this.argumentValueLengthIn32);
        const info = this.infos[callbackInfoIndex];
        return info.args[argsIndex];
    }
}
exports.FunctionCallbackInfoPtrManager = FunctionCallbackInfoPtrManager;
class Ref {
    value;
}
exports.Ref = Ref;
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
    static idMap = new WeakMap();
    static jsFuncOrObjectKV = {};
    static getOrCreateJSFunction(funcValue) {
        let id = jsFunctionOrObjectFactory.idMap.get(funcValue);
        if (id) {
            return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        }
        id = jsFunctionOrObjectFactory.regularID++;
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
        id = jsFunctionOrObjectFactory.regularID++;
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
        jsFunctionOrObjectFactory.idMap.delete(jsObject.getObject());
        delete jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
    }
    static getJSFunctionById(id) {
        return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
    }
    static removeJSFunctionById(id) {
        const jsFunc = jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        jsFunctionOrObjectFactory.idMap.delete(jsFunc._func);
        delete jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
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
        Object.defineProperty(obj, '_puerts_csid_', {
            value: csID
        });
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
        return obj._puerts_csid_;
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
    lastReturnCSResult = null;
    lastException = null;
    // 这四个是Puerts.WebGL里用于wasm通信的的CSharp Callback函数指针。
    callV8Function;
    callV8Constructor;
    callV8Destructor;
    // 这两个是Puerts用的的真正的CSharp函数指针
    GetJSArgumentsCallback;
    generalDestructor;
    constructor(ctorParam) {
        this.csharpObjectMap = new CSharpObjectMap();
        this.functionCallbackInfoPtrManager = new FunctionCallbackInfoPtrManager(this);
        const { UTF8ToString, _malloc, _memcpy, _free, stringToUTF8, lengthBytesUTF8, unityInstance } = ctorParam;
        this.unityApi = {
            UTF8ToString,
            _malloc,
            _memcpy,
            _free,
            stringToUTF8,
            lengthBytesUTF8,
            dynCall_iiiii: unityInstance.dynCall_iiiii.bind(unityInstance),
            dynCall_viii: unityInstance.dynCall_viii.bind(unityInstance),
            dynCall_viiiii: unityInstance.dynCall_viiiii.bind(unityInstance),
            HEAP32: null,
            HEAP8: null,
            HEAPF32: null,
        };
        Object.defineProperty(this.unityApi, 'HEAP32', {
            get: function () {
                return unityInstance.HEAP32;
            }
        });
        Object.defineProperty(this.unityApi, 'HEAPF32', {
            get: function () {
                return unityInstance.HEAPF32;
            }
        });
        Object.defineProperty(this.unityApi, 'HEAP8', {
            get: function () {
                return unityInstance.HEAP8;
            }
        });
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
    JSStringToCSString(returnStr, /** out int */ length) {
        if (returnStr === null || returnStr === undefined) {
            return 0;
        }
        var byteCount = this.unityApi.lengthBytesUTF8(returnStr);
        setOutValue32(this, length, byteCount);
        var buffer = this.unityApi._malloc(byteCount + 1);
        this.unityApi.stringToUTF8(returnStr, buffer, byteCount + 1);
        return buffer;
    }
    makeV8FunctionCallbackFunction(isStatic, functionPtr, callbackIdx) {
        // 不能用箭头函数！此处返回的函数会放到具体的class上，this有含义。
        const engine = this;
        return function (...args) {
            let callbackInfoPtr = engine.functionCallbackInfoPtrManager.GetMockPointer(args);
            try {
                engine.callV8FunctionCallback(functionPtr, 
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
    callV8FunctionCallback(functionPtr, selfPtr, infoIntPtr, paramLen, callbackIdx) {
        this.unityApi.dynCall_viiiii(this.callV8Function, functionPtr, infoIntPtr, selfPtr, paramLen, callbackIdx);
    }
    callV8ConstructorCallback(functionPtr, infoIntPtr, paramLen, callbackIdx) {
        return this.unityApi.dynCall_iiiii(this.callV8Constructor, functionPtr, infoIntPtr, paramLen, callbackIdx);
    }
    callV8DestructorCallback(functionPtr, selfPtr, callbackIdx) {
        this.unityApi.dynCall_viii(this.callV8Destructor, functionPtr, selfPtr, callbackIdx);
    }
}
exports.PuertsJSEngine = PuertsJSEngine;
function GetType(engine, value) {
    if (value === null || value === undefined) {
        return 1;
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
    if (value instanceof Array) {
        return 128;
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
    return (BigInt(high >>> 0) << BigInt(32)) + BigInt(low >>> 0);
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
//# sourceMappingURL=library.js.map

/***/ }),

/***/ "./output/mixins/getFromJSArgument.js":
/*!********************************************!*\
  !*** ./output/mixins/getFromJSArgument.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.$GetArgumentFinalValue = exports.GetArrayBufferFromValue = exports.GetJSObjectFromValue = exports.GetFunctionFromValue = exports.GetObjectFromValue = exports.GetBigIntFromValue = exports.ValueIsBigInt = exports.GetBooleanFromValue = exports.GetStringFromValue = exports.GetDateFromValue = exports.GetNumberFromValue = void 0;
const library_1 = __webpack_require__(/*! ../library */ "./output/library.js");
function GetNumberFromValue(engine, isolate, value, isByRef) {
    return engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
}
exports.GetNumberFromValue = GetNumberFromValue;
function GetDateFromValue(engine, isolate, value, isByRef) {
    return engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value).getTime();
}
exports.GetDateFromValue = GetDateFromValue;
function GetStringFromValue(engine, isolate, value, /*out int */ lengthOffset, isByRef) {
    var returnStr = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
    return engine.JSStringToCSString(returnStr, lengthOffset);
}
exports.GetStringFromValue = GetStringFromValue;
function GetBooleanFromValue(engine, isolate, value, isByRef) {
    return engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
}
exports.GetBooleanFromValue = GetBooleanFromValue;
function ValueIsBigInt(engine, isolate, value, isByRef) {
    var bigint = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
    return bigint instanceof BigInt;
}
exports.ValueIsBigInt = ValueIsBigInt;
function GetBigIntFromValue(engine, isolate, value, isByRef) {
    var bigint = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
    return bigint;
}
exports.GetBigIntFromValue = GetBigIntFromValue;
function GetObjectFromValue(engine, isolate, value, isByRef) {
    var nativeObject = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
    return engine.csharpObjectMap.getCSIdentifierFromObject(nativeObject);
}
exports.GetObjectFromValue = GetObjectFromValue;
function GetFunctionFromValue(engine, isolate, value, isByRef) {
    var func = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
    var jsfunc = library_1.jsFunctionOrObjectFactory.getOrCreateJSFunction(func);
    return jsfunc.id;
}
exports.GetFunctionFromValue = GetFunctionFromValue;
function GetJSObjectFromValue(engine, isolate, value, isByRef) {
    var obj = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
    var jsobj = library_1.jsFunctionOrObjectFactory.getOrCreateJSObject(obj);
    return jsobj.id;
}
exports.GetJSObjectFromValue = GetJSObjectFromValue;
function GetArrayBufferFromValue(engine, isolate, value, /*out int */ lengthOffset, isOut) {
    var ab = engine.functionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
    if (ab instanceof Uint8Array) {
        ab = ab.buffer;
    }
    var ptr = engine.unityApi._malloc(ab.byteLength);
    engine.unityApi.HEAP8.set(new Int8Array(ab), ptr);
    engine.unityApi.HEAP32[lengthOffset >> 2] = ab.byteLength;
    (0, library_1.setOutValue32)(engine, lengthOffset, ab.byteLength);
    return ptr;
}
exports.GetArrayBufferFromValue = GetArrayBufferFromValue;
function $GetArgumentFinalValue(engine, val, jsValueType, lengthOffset) {
    if (!jsValueType)
        jsValueType = (0, library_1.GetType)(engine, val);
    switch (jsValueType) {
        case 4: return +val;
        case 8: return engine.JSStringToCSString(val, lengthOffset);
        case 16: return +val;
        case 32: return engine.csharpObjectMap.getCSIdentifierFromObject(val);
        case 64: return library_1.jsFunctionOrObjectFactory.getOrCreateJSObject(val).id;
        case 128: return library_1.jsFunctionOrObjectFactory.getOrCreateJSObject(val).id;
        case 256: return library_1.jsFunctionOrObjectFactory.getOrCreateJSFunction(val).id;
        case 512: return val.getTime();
        case 1024:
            if (val instanceof Uint8Array) {
                val = val.buffer;
            }
            var ptr = engine.unityApi._malloc(val.byteLength);
            engine.unityApi.HEAP8.set(new Int8Array(val), ptr);
            (0, library_1.setOutValue32)(engine, lengthOffset, val.byteLength);
            return ptr;
    }
}
exports.$GetArgumentFinalValue = $GetArgumentFinalValue;
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
            return engine.JSStringToCSString(engine.lastReturnCSResult, length);
        },
        GetBooleanFromResult: function (resultInfo) {
            return engine.lastReturnCSResult;
        },
        ResultIsBigInt: function (resultInfo) {
            return engine.lastReturnCSResult instanceof BigInt;
        },
        GetBigIntFromResult: function (resultInfo) {
            throw new Error('not implemented');
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
            library_1.global[name] = engine.makeV8FunctionCallbackFunction(true, v8FunctionCallback, callbackidx);
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
                        csID = engine.callV8ConstructorCallback(constructor, callbackInfoPtr, args.length, callbackidx);
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
                    engine.unityApi._memcpy(csNewID, csID, size);
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
                        engine.callV8DestructorCallback(destructor || engine.generalDestructor, csIdentifier, callbackidx);
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
            const name = engine.unityApi.UTF8ToString(nameString);
            var fn = engine.makeV8FunctionCallbackFunction(isStatic, callback, callbackidx);
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
            attr.get = engine.makeV8FunctionCallbackFunction(isStatic, getter, gettercallbackidx);
            if (setter) {
                attr.set = engine.makeV8FunctionCallbackFunction(isStatic, setter, settercallbackidx);
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
            func.args.push(b);
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
            callbackInfo.returnValue = engine.makeV8FunctionCallbackFunction(false, v8FunctionCallback, pointerLow);
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
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
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
        SetBigIntToOutValue: function (isolate, value, /*long */ bigInt) {
            throw new Error('not implemented');
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
    Init({ UTF8ToString, _malloc, _memcpy, _free, stringToUTF8, lengthBytesUTF8, unityInstance }) {
        const engine = new library_1.PuertsJSEngine({
            UTF8ToString, _malloc, _memcpy, _free, stringToUTF8, lengthBytesUTF8, unityInstance
        });
        const executeModuleCache = {};
        let jsEngineReturned = false;
        // PuertsDLL的所有接口实现
        library_1.global.PuertsWebGL = Object.assign(library_1.global.PuertsWebGL, (0, getFromJSArgument_1.default)(engine), (0, getFromJSReturn_1.default)(engine), (0, setToInvokeJSArgument_1.default)(engine), (0, setToJSInvokeReturn_1.default)(engine), (0, setToJSOutArgument_1.default)(engine), (0, register_1.default)(engine), {
            // bridgeLog: true,
            SetCallV8: function (callV8Function, callV8Constructor, callV8Destructor) {
                engine.callV8Function = callV8Function;
                engine.callV8Constructor = callV8Constructor;
                engine.callV8Destructor = callV8Destructor;
            },
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
                var jsfunc = library_1.jsFunctionOrObjectFactory.getOrCreateJSFunction(function (fileName) {
                    try {
                        if (['puerts/log.mjs', 'puerts/timer.mjs'].indexOf(fileName) != -1) {
                            return {};
                        }
                        if (typeof wx != 'undefined') {
                            const result = wxRequire('puerts_minigame_js_resources/' + (fileName.endsWith('.js') ? fileName : fileName + ".js"));
                            return result;
                        }
                        else {
                            function normalize(name, to) {
                                if ('./' === to.substring(0, 2)) {
                                    to = to.substring(2);
                                }
                                name = (name.endsWith('/') ? name : name.substring(0, name.lastIndexOf('/') + 1)) + to;
                                const pathSegs = name.replaceAll('//', '/').split('/');
                                const retPath = [];
                                for (let i = 0; i < pathSegs.length; i++) {
                                    if (pathSegs[i] == '..')
                                        retPath.pop();
                                    else
                                        retPath.push(pathSegs[i]);
                                }
                                return retPath.join('/');
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
                                        console.error('file not found: ' + specifier);
                                    }
                                    specifier = foundSpecifier;
                                    executeModuleCache[specifier] = -1;
                                    try {
                                        PUERTS_JS_RESOURCES[specifier](result.exports, function mRequire(specifierTo) {
                                            return mockRequire(normalize(specifier, specifierTo));
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
                    catch (e) {
                        engine.lastException = e;
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
                const code = UTF8ToString(codeString);
                const result = library_1.global.eval(code);
                // return getIntPtrManager().GetPointerForJSValue(result);
                engine.lastReturnCSResult = result;
                return /*FResultInfo */ 1024;
            },
            SetPushJSFunctionArgumentsCallback: function (isolate, callback, jsEnvIdx) {
                engine.GetJSArgumentsCallback = callback;
            },
            ThrowException: function (isolate, /*byte[] */ messageString) {
                throw new Error(UTF8ToString(messageString));
            },
            InvokeJSFunction: function (_function, hasResult) {
                const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
                if (func instanceof library_1.JSFunction) {
                    try {
                        engine.lastReturnCSResult = func.invoke();
                        return 1024;
                    }
                    catch (err) {
                        console.error('InvokeJSFunction error', err);
                        func.lastException = err;
                    }
                }
                else {
                    throw new Error('ptr is not a jsfunc');
                }
            },
            GetFunctionLastExceptionInfo: function (_function, /*out int */ length) {
                const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
                if (func instanceof library_1.JSFunction) {
                    return engine.JSStringToCSString(func.lastException.message || '', length);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYiw2Q0FBNkM7QUFDN0MseURBQXlEO0FBQ3pELG9EQUFvRDtBQUNwRCxpREFBaUQ7QUFDakQsNkNBQTZDO0FBQzdDO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGlDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2xpYnJhcnkuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9nZXRGcm9tSlNBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL2dldEZyb21KU1JldHVybi5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3JlZ2lzdGVyLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9JbnZva2VKU0FyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9KU0ludm9rZVJldHVybi5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSlNPdXRBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuc2V0T3V0VmFsdWU4ID0gZXhwb3J0cy5zZXRPdXRWYWx1ZTMyID0gZXhwb3J0cy5tYWtlQmlnSW50ID0gZXhwb3J0cy5HZXRUeXBlID0gZXhwb3J0cy5QdWVydHNKU0VuZ2luZSA9IGV4cG9ydHMuT25GaW5hbGl6ZSA9IGV4cG9ydHMuY3JlYXRlV2Vha1JlZiA9IGV4cG9ydHMuZ2xvYmFsID0gZXhwb3J0cy5DU2hhcnBPYmplY3RNYXAgPSBleHBvcnRzLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkgPSBleHBvcnRzLkpTT2JqZWN0ID0gZXhwb3J0cy5KU0Z1bmN0aW9uID0gZXhwb3J0cy5SZWYgPSBleHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IGV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm8gPSB2b2lkIDA7XHJcbmNvbnN0IGdldEZyb21KU0FyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvZ2V0RnJvbUpTQXJndW1lbnRcIik7XHJcbi8qKlxyXG4gKiDkuIDmrKHlh73mlbDosIPnlKjnmoRpbmZvXHJcbiAqIOWvueW6lHY4OjpGdW5jdGlvbkNhbGxiYWNrSW5mb1xyXG4gKi9cclxuY2xhc3MgRnVuY3Rpb25DYWxsYmFja0luZm8ge1xyXG4gICAgYXJncztcclxuICAgIHJldHVyblZhbHVlO1xyXG4gICAgY29uc3RydWN0b3IoYXJncykge1xyXG4gICAgICAgIHRoaXMuYXJncyA9IGFyZ3M7XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlKCkge1xyXG4gICAgICAgIHRoaXMuYXJncyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IHZvaWQgMDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gRnVuY3Rpb25DYWxsYmFja0luZm87XHJcbi8qKlxyXG4gKiDmiopGdW5jdGlvbkNhbGxiYWNrSW5mb+S7peWPiuWFtuWPguaVsOi9rOWMluS4umMj5Y+v55So55qEaW50cHRyXHJcbiAqL1xyXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIge1xyXG4gICAgLy8gRnVuY3Rpb25DYWxsYmFja0luZm/nmoTliJfooajvvIzku6XliJfooajnmoRpbmRleOS9nOS4ukludFB0cueahOWAvFxyXG4gICAgaW5mb3MgPSBbbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKFswXSldOyAvLyDov5nph4zljp/mnKzlj6rmmK/kuKrmma7pgJrnmoQwXHJcbiAgICAvLyBGdW5jdGlvbkNhbGxiYWNrSW5mb+eUqOWujOWQju+8jOWwhuWFtuW6j+WPt+aUvuWFpeKAnOWbnuaUtuWIl+ihqOKAne+8jOS4i+asoeWwseiDvee7p+e7reacjeeUqOivpWluZGV477yM6ICM5LiN5b+F6K6paW5mb3PmlbDnu4Tml6DpmZDmianlsZXkuIvljrtcclxuICAgIGZyZWVJbmZvc0luZGV4ID0gW107XHJcbiAgICBmcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGggPSB7fTtcclxuICAgIGFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyID0gNDtcclxuICAgIGVuZ2luZTtcclxuICAgIGNvbnN0cnVjdG9yKGVuZ2luZSkge1xyXG4gICAgICAgIHRoaXMuZW5naW5lID0gZW5naW5lO1xyXG4gICAgfVxyXG4gICAgYWxsb2NDYWxsYmFja0luZm9NZW1vcnkoYXJnc2xlbmd0aCkge1xyXG4gICAgICAgIGlmICh0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzbGVuZ3RoXSAmJlxyXG4gICAgICAgICAgICB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzbGVuZ3RoXS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NsZW5ndGhdLnBvcCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoKGFyZ3NsZW5ndGggKiB0aGlzLmFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyICsgMSkgPDwgMik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVjeWNsZUNhbGxiYWNrSW5mb01lbW9yeShidWZmZXJwdHIsIGFyZ3NsZW5ndGgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NsZW5ndGhdICYmIGFyZ3NsZW5ndGggPCA1KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NsZW5ndGhdID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIOaLjeiEkeiii+WumueahOacgOWkp+e8k+WtmOS4quaVsOWkp+Wwj+OAgiA1MCAtIOWPguaVsOS4quaVsCAqIDEwXHJcbiAgICAgICAgaWYgKHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NsZW5ndGhdLmxlbmd0aCA+ICg1MCAtIGFyZ3NsZW5ndGggKiAxMCkpIHtcclxuICAgICAgICAgICAgdGhpcy5lbmdpbmUudW5pdHlBcGkuX2ZyZWUoYnVmZmVycHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NsZW5ndGhdLnB1c2goYnVmZmVycHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIGludHB0cueahOagvOW8j+S4umlk5bem56e75Zub5L2NXHJcbiAgICAgKlxyXG4gICAgICog5Y+z5L6n5Zub5L2N77yM5piv5Li65LqG5Zyo5Y+z5Zub5L2N5a2Y5YKo5Y+C5pWw55qE5bqP5Y+377yM6L+Z5qC35Y+v5Lul55So5LqO6KGo56S6Y2FsbGJhY2tpbmZv5Y+C5pWw55qEaW50cHRyXHJcbiAgICAgKi9cclxuICAgIC8vIHN0YXRpYyBHZXRNb2NrUG9pbnRlcihhcmdzOiBhbnlbXSk6IE1vY2tJbnRQdHIge1xyXG4gICAgLy8gICAgIGxldCBpbmRleDogbnVtYmVyO1xyXG4gICAgLy8gICAgIGluZGV4ID0gdGhpcy5mcmVlSW5mb3NJbmRleC5wb3AoKTtcclxuICAgIC8vICAgICAvLyBpbmRleOacgOWwj+S4ujFcclxuICAgIC8vICAgICBpZiAoaW5kZXgpIHtcclxuICAgIC8vICAgICAgICAgdGhpcy5pbmZvc1tpbmRleF0uYXJncyA9IGFyZ3M7XHJcbiAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2gobmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKGFyZ3MpKSAtIDE7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIHJldHVybiBpbmRleCA8PCA0O1xyXG4gICAgLy8gfVxyXG4gICAgR2V0TW9ja1BvaW50ZXIoYXJncykge1xyXG4gICAgICAgIHZhciBidWZmZXIgPSB0aGlzLmFsbG9jQ2FsbGJhY2tJbmZvTWVtb3J5KGFyZ3MubGVuZ3RoKTtcclxuICAgICAgICBsZXQgaW5kZXg7XHJcbiAgICAgICAgaW5kZXggPSB0aGlzLmZyZWVJbmZvc0luZGV4LnBvcCgpO1xyXG4gICAgICAgIC8vIGluZGV45pyA5bCP5Li6MVxyXG4gICAgICAgIGlmIChpbmRleCkge1xyXG4gICAgICAgICAgICB0aGlzLmluZm9zW2luZGV4XS5hcmdzID0gYXJncztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5pbmZvcy5wdXNoKG5ldyBGdW5jdGlvbkNhbGxiYWNrSW5mbyhhcmdzKSkgLSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbYnVmZmVyID4+IDJdID0gaW5kZXg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIC8vIGluaXQgZWFjaCB2YWx1ZVxyXG4gICAgICAgICAgICBjb25zdCBqc1ZhbHVlVHlwZSA9IEdldFR5cGUodGhpcy5lbmdpbmUsIGFyZ3NbaV0pO1xyXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbKGJ1ZmZlciA+PiAyKSArICgxICsgaSAqIHRoaXMuYXJndW1lbnRWYWx1ZUxlbmd0aEluMzIpXSA9IGJ1ZmZlcjsgLy8gYSBwb2ludGVyIHRvIHRoZSBpbmZvXHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMlsoYnVmZmVyID4+IDIpICsgKDIgKyBpICogdGhpcy5hcmd1bWVudFZhbHVlTGVuZ3RoSW4zMildID0ganNWYWx1ZVR5cGU7IC8vIGpzdmFsdWV0eXBlXHJcbiAgICAgICAgICAgIHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVBGMzJbKGJ1ZmZlciA+PiAyKSArICgzICsgaSAqIHRoaXMuYXJndW1lbnRWYWx1ZUxlbmd0aEluMzIpXSA9ICgwLCBnZXRGcm9tSlNBcmd1bWVudF8xLiRHZXRBcmd1bWVudEZpbmFsVmFsdWUpKHRoaXMuZW5naW5lLCBhcmdzW2ldLCBqc1ZhbHVlVHlwZSwgKChidWZmZXIgPj4gMikgKyAoNCArIGkgKiB0aGlzLmFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyKSkgPDwgMik7IC8vIHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICB9XHJcbiAgICAvLyBzdGF0aWMgR2V0QnlNb2NrUG9pbnRlcihpbnRwdHI6IE1vY2tJbnRQdHIpOiBGdW5jdGlvbkNhbGxiYWNrSW5mbyB7XHJcbiAgICAvLyAgICAgcmV0dXJuIHRoaXMuaW5mb3NbaW50cHRyID4+IDRdO1xyXG4gICAgLy8gfVxyXG4gICAgR2V0QnlNb2NrUG9pbnRlcihpbnRwdHIpIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMltpbnRwdHIgPj4gMl07XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mb3NbaW5kZXhdO1xyXG4gICAgfVxyXG4gICAgR2V0UmV0dXJuVmFsdWVBbmRSZWN5Y2xlKGludHB0cikge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW2ludHB0ciA+PiAyXTtcclxuICAgICAgICBsZXQgaW5mbyA9IHRoaXMuaW5mb3NbaW5kZXhdO1xyXG4gICAgICAgIGxldCByZXQgPSBpbmZvLnJldHVyblZhbHVlO1xyXG4gICAgICAgIHRoaXMucmVjeWNsZUNhbGxiYWNrSW5mb01lbW9yeShpbnRwdHIsIGluZm8uYXJncy5sZW5ndGgpO1xyXG4gICAgICAgIGluZm8ucmVjeWNsZSgpO1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIFJlbGVhc2VCeU1vY2tJbnRQdHIoaW50cHRyKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbaW50cHRyID4+IDJdO1xyXG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICAgICAgdGhpcy5yZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KGludHB0ciwgaW5mby5hcmdzLmxlbmd0aCk7XHJcbiAgICAgICAgaW5mby5yZWN5Y2xlKCk7XHJcbiAgICAgICAgdGhpcy5mcmVlSW5mb3NJbmRleC5wdXNoKGluZGV4KTtcclxuICAgIH1cclxuICAgIEdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWVwdHIpIHtcclxuICAgICAgICBjb25zdCBpbmZvcHRyID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3ZhbHVlcHRyID4+IDJdO1xyXG4gICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb0luZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW2luZm9wdHIgPj4gMl07XHJcbiAgICAgICAgY29uc3QgYXJnc0luZGV4ID0gKHZhbHVlcHRyIC0gaW5mb3B0ciAtIDQpIC8gKDQgKiB0aGlzLmFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyKTtcclxuICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5pbmZvc1tjYWxsYmFja0luZm9JbmRleF07XHJcbiAgICAgICAgcmV0dXJuIGluZm8uYXJnc1thcmdzSW5kZXhdO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyO1xyXG5jbGFzcyBSZWYge1xyXG4gICAgdmFsdWU7XHJcbn1cclxuZXhwb3J0cy5SZWYgPSBSZWY7XHJcbi8qKlxyXG4gKiDku6PooajkuIDkuKpKU0Z1bmN0aW9uXHJcbiAqL1xyXG5jbGFzcyBKU0Z1bmN0aW9uIHtcclxuICAgIF9mdW5jO1xyXG4gICAgaWQ7XHJcbiAgICBhcmdzID0gW107XHJcbiAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgIGNvbnN0cnVjdG9yKGlkLCBmdW5jKSB7XHJcbiAgICAgICAgdGhpcy5fZnVuYyA9IGZ1bmM7XHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgfVxyXG4gICAgaW52b2tlKCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gWy4uLnRoaXMuYXJnc107XHJcbiAgICAgICAgdGhpcy5hcmdzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Z1bmMuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5KU0Z1bmN0aW9uID0gSlNGdW5jdGlvbjtcclxuLyoqXHJcbiAqIOS7o+ihqOS4gOS4qkpTT2JqZWN0XHJcbiAqL1xyXG5jbGFzcyBKU09iamVjdCB7XHJcbiAgICBfb2JqO1xyXG4gICAgaWQ7XHJcbiAgICBjb25zdHJ1Y3RvcihpZCwgb2JqKSB7XHJcbiAgICAgICAgdGhpcy5fb2JqID0gb2JqO1xyXG4gICAgICAgIHRoaXMuaWQgPSBpZDtcclxuICAgIH1cclxuICAgIGdldE9iamVjdCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fb2JqO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuSlNPYmplY3QgPSBKU09iamVjdDtcclxuY2xhc3MganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSB7XHJcbiAgICBzdGF0aWMgcmVndWxhcklEID0gMTtcclxuICAgIHN0YXRpYyBpZE1hcCA9IG5ldyBXZWFrTWFwKCk7XHJcbiAgICBzdGF0aWMganNGdW5jT3JPYmplY3RLViA9IHt9O1xyXG4gICAgc3RhdGljIGdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jVmFsdWUpIHtcclxuICAgICAgICBsZXQgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmdldChmdW5jVmFsdWUpO1xyXG4gICAgICAgIGlmIChpZCkge1xyXG4gICAgICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlZ3VsYXJJRCsrO1xyXG4gICAgICAgIGNvbnN0IGZ1bmMgPSBuZXcgSlNGdW5jdGlvbihpZCwgZnVuY1ZhbHVlKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLnNldChmdW5jVmFsdWUsIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdID0gZnVuYztcclxuICAgICAgICByZXR1cm4gZnVuYztcclxuICAgIH1cclxuICAgIHN0YXRpYyBnZXRPckNyZWF0ZUpTT2JqZWN0KG9iaikge1xyXG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KG9iaik7XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XHJcbiAgICAgICAgY29uc3QganNPYmplY3QgPSBuZXcgSlNPYmplY3QoaWQsIG9iaik7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5zZXQob2JqLCBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXSA9IGpzT2JqZWN0O1xyXG4gICAgICAgIHJldHVybiBqc09iamVjdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBnZXRKU09iamVjdEJ5SWQoaWQpIHtcclxuICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgIH1cclxuICAgIHN0YXRpYyByZW1vdmVKU09iamVjdEJ5SWQoaWQpIHtcclxuICAgICAgICBjb25zdCBqc09iamVjdCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNPYmplY3QuZ2V0T2JqZWN0KCkpO1xyXG4gICAgICAgIGRlbGV0ZSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGdldEpTRnVuY3Rpb25CeUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcmVtb3ZlSlNGdW5jdGlvbkJ5SWQoaWQpIHtcclxuICAgICAgICBjb25zdCBqc0Z1bmMgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZGVsZXRlKGpzRnVuYy5fZnVuYyk7XHJcbiAgICAgICAgZGVsZXRlIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5ID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeTtcclxuLyoqXHJcbiAqIENTaGFycOWvueixoeiusOW9leihqO+8jOiusOW9leaJgOaciUNTaGFycOWvueixoeW5tuWIhumFjWlkXHJcbiAqIOWSjHB1ZXJ0cy5kbGzmiYDlgZrnmoTkuIDmoLdcclxuICovXHJcbmNsYXNzIENTaGFycE9iamVjdE1hcCB7XHJcbiAgICBjbGFzc2VzID0gW251bGxdO1xyXG4gICAgbmF0aXZlT2JqZWN0S1YgPSBuZXcgTWFwKCk7XHJcbiAgICAvLyBwcml2YXRlIG5hdGl2ZU9iamVjdEtWOiB7IFtvYmplY3RJRDogQ1NJZGVudGlmaWVyXTogV2Vha1JlZjxhbnk+IH0gPSB7fTtcclxuICAgIC8vIHByaXZhdGUgY3NJRFdlYWtNYXA6IFdlYWtNYXA8YW55LCBDU0lkZW50aWZpZXI+ID0gbmV3IFdlYWtNYXAoKTtcclxuICAgIG5hbWVzVG9DbGFzc2VzSUQgPSB7fTtcclxuICAgIGNsYXNzSURXZWFrTWFwID0gbmV3IFdlYWtNYXAoKTtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX21lbW9yeURlYnVnICYmIHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZENhbGxlZCcsIHRoaXMuYWRkQ2FsbGVkKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlbW92ZUNhbGxlZCcsIHRoaXMucmVtb3ZlQ2FsbGVkKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3dyJywgdGhpcy5uYXRpdmVPYmplY3RLVi5zaXplKTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgIH1cclxuICAgIF9tZW1vcnlEZWJ1ZyA9IGZhbHNlO1xyXG4gICAgYWRkQ2FsbGVkID0gMDtcclxuICAgIHJlbW92ZUNhbGxlZCA9IDA7XHJcbiAgICBhZGQoY3NJRCwgb2JqKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgdGhpcy5hZGRDYWxsZWQrKztcclxuICAgICAgICAvLyB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdID0gY3JlYXRlV2Vha1JlZihvYmopO1xyXG4gICAgICAgIC8vIHRoaXMuY3NJRFdlYWtNYXAuc2V0KG9iaiwgY3NJRCk7XHJcbiAgICAgICAgdGhpcy5uYXRpdmVPYmplY3RLVi5zZXQoY3NJRCwgY3JlYXRlV2Vha1JlZihvYmopKTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCAnX3B1ZXJ0c19jc2lkXycsIHtcclxuICAgICAgICAgICAgdmFsdWU6IGNzSURcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJlbW92ZShjc0lEKSB7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgdGhpcy5yZW1vdmVDYWxsZWQrKztcclxuICAgICAgICAvLyBkZWxldGUgdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXTtcclxuICAgICAgICB0aGlzLm5hdGl2ZU9iamVjdEtWLmRlbGV0ZShjc0lEKTtcclxuICAgIH1cclxuICAgIGZpbmRPckFkZE9iamVjdChjc0lELCBjbGFzc0lEKSB7XHJcbiAgICAgICAgbGV0IHJldCA9IHRoaXMubmF0aXZlT2JqZWN0S1YuZ2V0KGNzSUQpO1xyXG4gICAgICAgIC8vIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdO1xyXG4gICAgICAgIGlmIChyZXQgJiYgKHJldCA9IHJldC5kZXJlZigpKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXQgPSB0aGlzLmNsYXNzZXNbY2xhc3NJRF0uY3JlYXRlRnJvbUNTKGNzSUQpO1xyXG4gICAgICAgIC8vIHRoaXMuYWRkKGNzSUQsIHJldCk7IOaehOmAoOWHveaVsOmHjOi0n+i0o+iwg+eUqFxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbiAgICBnZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KG9iaikge1xyXG4gICAgICAgIC8vIHJldHVybiB0aGlzLmNzSURXZWFrTWFwLmdldChvYmopO1xyXG4gICAgICAgIHJldHVybiBvYmouX3B1ZXJ0c19jc2lkXztcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IENTaGFycE9iamVjdE1hcDtcclxuO1xyXG52YXIgZGVzdHJ1Y3RvcnMgPSB7fTtcclxuZXhwb3J0cy5nbG9iYWwgPSBnbG9iYWwgPSBnbG9iYWwgfHwgZ2xvYmFsVGhpcyB8fCB3aW5kb3c7XHJcbmdsb2JhbC5nbG9iYWwgPSBnbG9iYWw7XHJcbmNvbnN0IGNyZWF0ZVdlYWtSZWYgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHR5cGVvZiBXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBXWFdlYWtSZWYgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIldlYWtSZWYgaXMgbm90IGRlZmluZWQuIG1heWJlIHlvdSBzaG91bGQgdXNlIG5ld2VyIGVudmlyb25tZW50XCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGVyZWYoKSB7IHJldHVybiBvYmo7IH0gfTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwidXNpbmcgV1hXZWFrUmVmXCIpO1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgV1hXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXZWFrUmVmKG9iaik7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5leHBvcnRzLmNyZWF0ZVdlYWtSZWYgPSBjcmVhdGVXZWFrUmVmO1xyXG5jbGFzcyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2sge1xyXG4gICAgX2hhbmRsZXI7XHJcbiAgICByZWZzID0gW107XHJcbiAgICBoZWxkcyA9IFtdO1xyXG4gICAgYXZhaWxhYmxlSW5kZXggPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yKGhhbmRsZXIpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oXCJGaW5hbGl6YXRpb25SZWdpc3RlciBpcyBub3QgZGVmaW5lZC4gdXNpbmcgRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrXCIpO1xyXG4gICAgICAgIGdsb2JhbC5fcHVlcnRzX3JlZ2lzdHJ5ID0gdGhpcztcclxuICAgICAgICB0aGlzLl9oYW5kbGVyID0gaGFuZGxlcjtcclxuICAgIH1cclxuICAgIHJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYXZhaWxhYmxlSW5kZXgubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5hdmFpbGFibGVJbmRleC5wb3AoKTtcclxuICAgICAgICAgICAgdGhpcy5yZWZzW2luZGV4XSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcclxuICAgICAgICAgICAgdGhpcy5oZWxkc1tpbmRleF0gPSBoZWxkVmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlZnMucHVzaChjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgICAgICB0aGlzLmhlbGRzLnB1c2goaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOa4hemZpOWPr+iDveW3sue7j+WkseaViOeahFdlYWtSZWZcclxuICAgICAqL1xyXG4gICAgaXRlcmF0ZVBvc2l0aW9uID0gMDtcclxuICAgIGNsZWFudXAocGFydCA9IDEpIHtcclxuICAgICAgICBjb25zdCBzdGVwQ291bnQgPSB0aGlzLnJlZnMubGVuZ3RoIC8gcGFydDtcclxuICAgICAgICBsZXQgaSA9IHRoaXMuaXRlcmF0ZVBvc2l0aW9uO1xyXG4gICAgICAgIGZvciAobGV0IGN1cnJlbnRTdGVwID0gMDsgaSA8IHRoaXMucmVmcy5sZW5ndGggJiYgY3VycmVudFN0ZXAgPCBzdGVwQ291bnQ7IGkgPSAoaSA9PSB0aGlzLnJlZnMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMSksIGN1cnJlbnRTdGVwKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVmc1tpXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVmc1tpXS5kZXJlZigpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDnm67liY3msqHmnInlhoXlrZjmlbTnkIbog73lipvvvIzlpoLmnpzmuLjmiI/kuK3mnJ9yZWblvojlpJrkvYblkI7mnJ/lsJHkuobvvIzov5nph4zlsLHkvJrnmb3otLnpgY3ljobmrKHmlbBcclxuICAgICAgICAgICAgICAgIC8vIOS9humBjeWOhuS5n+WPquaYr+S4gOWPpT095ZKMY29udGludWXvvIzmtarotLnlvbHlk43kuI3lpKdcclxuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlSW5kZXgucHVzaChpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVmc1tpXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZXIodGhpcy5oZWxkc1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pdGVyYXRlUG9zaXRpb24gPSBpO1xyXG4gICAgfVxyXG59XHJcbnZhciByZWdpc3RyeSA9IG51bGw7XHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICByZWdpc3RyeSA9IG5ldyAodHlwZW9mIEZpbmFsaXphdGlvblJlZ2lzdHJ5ID09ICd1bmRlZmluZWQnID8gRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrIDogRmluYWxpemF0aW9uUmVnaXN0cnkpKGZ1bmN0aW9uIChoZWxkVmFsdWUpIHtcclxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xyXG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IGZpbmQgZGVzdHJ1Y3RvciBmb3IgXCIgKyBoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoLS1jYWxsYmFjay5yZWYgPT0gMCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXTtcclxuICAgICAgICAgICAgY2FsbGJhY2soaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBPbkZpbmFsaXplKG9iaiwgaGVsZFZhbHVlLCBjYWxsYmFjaykge1xyXG4gICAgaWYgKCFyZWdpc3RyeSkge1xyXG4gICAgICAgIGluaXQoKTtcclxuICAgIH1cclxuICAgIGxldCBvcmlnaW5DYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XHJcbiAgICBpZiAob3JpZ2luQ2FsbGJhY2spIHtcclxuICAgICAgICAvLyBXZWFrUmVm5YaF5a656YeK5pS+5pe25py65Y+v6IO95q+UZmluYWxpemF0aW9uUmVnaXN0cnnnmoTop6blj5Hmm7Tml6nvvIzliY3pnaLlpoLmnpzlj5HnjrB3ZWFrUmVm5Li656m65Lya6YeN5paw5Yib5bu65a+56LGhXHJcbiAgICAgICAgLy8g5L2G5LmL5YmN5a+56LGh55qEZmluYWxpemF0aW9uUmVnaXN0cnnmnIDnu4jlj4jogq/lrprkvJrop6blj5HjgIJcclxuICAgICAgICAvLyDmiYDku6XlpoLmnpzpgYfliLDov5nkuKrmg4XlhrXvvIzpnIDopoHnu5lkZXN0cnVjdG9y5Yqg6K6h5pWwXHJcbiAgICAgICAgKytvcmlnaW5DYWxsYmFjay5yZWY7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsYmFjay5yZWYgPSAxO1xyXG4gICAgICAgIGRlc3RydWN0b3JzW2hlbGRWYWx1ZV0gPSBjYWxsYmFjaztcclxuICAgIH1cclxuICAgIHJlZ2lzdHJ5LnJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKTtcclxufVxyXG5leHBvcnRzLk9uRmluYWxpemUgPSBPbkZpbmFsaXplO1xyXG5jbGFzcyBQdWVydHNKU0VuZ2luZSB7XHJcbiAgICBjc2hhcnBPYmplY3RNYXA7XHJcbiAgICBmdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXI7XHJcbiAgICB1bml0eUFwaTtcclxuICAgIGxhc3RSZXR1cm5DU1Jlc3VsdCA9IG51bGw7XHJcbiAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgIC8vIOi/meWbm+S4quaYr1B1ZXJ0cy5XZWJHTOmHjOeUqOS6jndhc23pgJrkv6HnmoTnmoRDU2hhcnAgQ2FsbGJhY2vlh73mlbDmjIfpkojjgIJcclxuICAgIGNhbGxWOEZ1bmN0aW9uO1xyXG4gICAgY2FsbFY4Q29uc3RydWN0b3I7XHJcbiAgICBjYWxsVjhEZXN0cnVjdG9yO1xyXG4gICAgLy8g6L+Z5Lik5Liq5pivUHVlcnRz55So55qE55qE55yf5q2j55qEQ1NoYXJw5Ye95pWw5oyH6ZKIXHJcbiAgICBHZXRKU0FyZ3VtZW50c0NhbGxiYWNrO1xyXG4gICAgZ2VuZXJhbERlc3RydWN0b3I7XHJcbiAgICBjb25zdHJ1Y3RvcihjdG9yUGFyYW0pIHtcclxuICAgICAgICB0aGlzLmNzaGFycE9iamVjdE1hcCA9IG5ldyBDU2hhcnBPYmplY3RNYXAoKTtcclxuICAgICAgICB0aGlzLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IG5ldyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIodGhpcyk7XHJcbiAgICAgICAgY29uc3QgeyBVVEY4VG9TdHJpbmcsIF9tYWxsb2MsIF9tZW1jcHksIF9mcmVlLCBzdHJpbmdUb1VURjgsIGxlbmd0aEJ5dGVzVVRGOCwgdW5pdHlJbnN0YW5jZSB9ID0gY3RvclBhcmFtO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkgPSB7XHJcbiAgICAgICAgICAgIFVURjhUb1N0cmluZyxcclxuICAgICAgICAgICAgX21hbGxvYyxcclxuICAgICAgICAgICAgX21lbWNweSxcclxuICAgICAgICAgICAgX2ZyZWUsXHJcbiAgICAgICAgICAgIHN0cmluZ1RvVVRGOCxcclxuICAgICAgICAgICAgbGVuZ3RoQnl0ZXNVVEY4LFxyXG4gICAgICAgICAgICBkeW5DYWxsX2lpaWlpOiB1bml0eUluc3RhbmNlLmR5bkNhbGxfaWlpaWkuYmluZCh1bml0eUluc3RhbmNlKSxcclxuICAgICAgICAgICAgZHluQ2FsbF92aWlpOiB1bml0eUluc3RhbmNlLmR5bkNhbGxfdmlpaS5iaW5kKHVuaXR5SW5zdGFuY2UpLFxyXG4gICAgICAgICAgICBkeW5DYWxsX3ZpaWlpaTogdW5pdHlJbnN0YW5jZS5keW5DYWxsX3ZpaWlpaS5iaW5kKHVuaXR5SW5zdGFuY2UpLFxyXG4gICAgICAgICAgICBIRUFQMzI6IG51bGwsXHJcbiAgICAgICAgICAgIEhFQVA4OiBudWxsLFxyXG4gICAgICAgICAgICBIRUFQRjMyOiBudWxsLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMudW5pdHlBcGksICdIRUFQMzInLCB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXR5SW5zdGFuY2UuSEVBUDMyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMudW5pdHlBcGksICdIRUFQRjMyJywge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bml0eUluc3RhbmNlLkhFQVBGMzI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy51bml0eUFwaSwgJ0hFQVA4Jywge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bml0eUluc3RhbmNlLkhFQVA4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZ2xvYmFsLl9fdGdqc0V2YWxTY3JpcHQgPSB0eXBlb2YgZXZhbCA9PSBcInVuZGVmaW5lZFwiID8gKCkgPT4geyB9IDogZXZhbDtcclxuICAgICAgICBnbG9iYWwuX190Z2pzU2V0UHJvbWlzZVJlamVjdENhbGxiYWNrID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHd4Lm9uVW5oYW5kbGVkUmVqZWN0aW9uKGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5oYW5kbGVkcmVqZWN0aW9uXCIsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZ2xvYmFsLl9fcHVlcnRzR2V0TGFzdEV4Y2VwdGlvbiA9ICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFzdEV4Y2VwdGlvbjtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgLyoqIG91dCBpbnQgKi8gbGVuZ3RoKSB7XHJcbiAgICAgICAgaWYgKHJldHVyblN0ciA9PT0gbnVsbCB8fCByZXR1cm5TdHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGJ5dGVDb3VudCA9IHRoaXMudW5pdHlBcGkubGVuZ3RoQnl0ZXNVVEY4KHJldHVyblN0cik7XHJcbiAgICAgICAgc2V0T3V0VmFsdWUzMih0aGlzLCBsZW5ndGgsIGJ5dGVDb3VudCk7XHJcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMudW5pdHlBcGkuX21hbGxvYyhieXRlQ291bnQgKyAxKTtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpLnN0cmluZ1RvVVRGOChyZXR1cm5TdHIsIGJ1ZmZlciwgYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgIH1cclxuICAgIG1ha2VWOEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgZnVuY3Rpb25QdHIsIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgLy8g5LiN6IO955So566t5aS05Ye95pWw77yB5q2k5aSE6L+U5Zue55qE5Ye95pWw5Lya5pS+5Yiw5YW35L2T55qEY2xhc3PkuIrvvIx0aGlz5pyJ5ZCr5LmJ44CCXHJcbiAgICAgICAgY29uc3QgZW5naW5lID0gdGhpcztcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcclxuICAgICAgICAgICAgbGV0IGNhbGxiYWNrSW5mb1B0ciA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0TW9ja1BvaW50ZXIoYXJncyk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbFY4RnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgXHJcbiAgICAgICAgICAgICAgICAvLyBnZXRJbnRQdHJNYW5hZ2VyKCkuR2V0UG9pbnRlckZvckpTVmFsdWUodGhpcyksXHJcbiAgICAgICAgICAgICAgICBpc1N0YXRpYyA/IDAgOiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodGhpcyksIGNhbGxiYWNrSW5mb1B0ciwgYXJncy5sZW5ndGgsIGNhbGxiYWNrSWR4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldFJldHVyblZhbHVlQW5kUmVjeWNsZShjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLlJlbGVhc2VCeU1vY2tJbnRQdHIoY2FsbGJhY2tJbmZvUHRyKTtcclxuICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgY2FsbFY4RnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5keW5DYWxsX3ZpaWlpaSh0aGlzLmNhbGxWOEZ1bmN0aW9uLCBmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgc2VsZlB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxuICAgIGNhbGxWOENvbnN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVuaXR5QXBpLmR5bkNhbGxfaWlpaWkodGhpcy5jYWxsVjhDb25zdHJ1Y3RvciwgZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbiAgICBjYWxsVjhEZXN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5keW5DYWxsX3ZpaWkodGhpcy5jYWxsVjhEZXN0cnVjdG9yLCBmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBQdWVydHNKU0VuZ2luZTtcclxuZnVuY3Rpb24gR2V0VHlwZShlbmdpbmUsIHZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHJldHVybiA0O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJldHVybiA4O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuICAgICAgICByZXR1cm4gMTY7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gMjU2O1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xyXG4gICAgICAgIHJldHVybiA1MTI7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgIHJldHVybiAxMjg7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCB2YWx1ZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgIH1cclxuICAgIGlmIChlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIDMyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDY0O1xyXG59XHJcbmV4cG9ydHMuR2V0VHlwZSA9IEdldFR5cGU7XHJcbmZ1bmN0aW9uIG1ha2VCaWdJbnQobG93LCBoaWdoKSB7XHJcbiAgICByZXR1cm4gKEJpZ0ludChoaWdoID4+PiAwKSA8PCBCaWdJbnQoMzIpKSArIEJpZ0ludChsb3cgPj4+IDApO1xyXG59XHJcbmV4cG9ydHMubWFrZUJpZ0ludCA9IG1ha2VCaWdJbnQ7XHJcbmZ1bmN0aW9uIHNldE91dFZhbHVlMzIoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbdmFsdWVQdHIgPj4gMl0gPSB2YWx1ZTtcclxufVxyXG5leHBvcnRzLnNldE91dFZhbHVlMzIgPSBzZXRPdXRWYWx1ZTMyO1xyXG5mdW5jdGlvbiBzZXRPdXRWYWx1ZTgoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOFt2YWx1ZVB0cl0gPSB2YWx1ZTtcclxufVxyXG5leHBvcnRzLnNldE91dFZhbHVlOCA9IHNldE91dFZhbHVlODtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGlicmFyeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLiRHZXRBcmd1bWVudEZpbmFsVmFsdWUgPSBleHBvcnRzLkdldEFycmF5QnVmZmVyRnJvbVZhbHVlID0gZXhwb3J0cy5HZXRKU09iamVjdEZyb21WYWx1ZSA9IGV4cG9ydHMuR2V0RnVuY3Rpb25Gcm9tVmFsdWUgPSBleHBvcnRzLkdldE9iamVjdEZyb21WYWx1ZSA9IGV4cG9ydHMuR2V0QmlnSW50RnJvbVZhbHVlID0gZXhwb3J0cy5WYWx1ZUlzQmlnSW50ID0gZXhwb3J0cy5HZXRCb29sZWFuRnJvbVZhbHVlID0gZXhwb3J0cy5HZXRTdHJpbmdGcm9tVmFsdWUgPSBleHBvcnRzLkdldERhdGVGcm9tVmFsdWUgPSBleHBvcnRzLkdldE51bWJlckZyb21WYWx1ZSA9IHZvaWQgMDtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbmZ1bmN0aW9uIEdldE51bWJlckZyb21WYWx1ZShlbmdpbmUsIGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICByZXR1cm4gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxufVxyXG5leHBvcnRzLkdldE51bWJlckZyb21WYWx1ZSA9IEdldE51bWJlckZyb21WYWx1ZTtcclxuZnVuY3Rpb24gR2V0RGF0ZUZyb21WYWx1ZShlbmdpbmUsIGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICByZXR1cm4gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKS5nZXRUaW1lKCk7XHJcbn1cclxuZXhwb3J0cy5HZXREYXRlRnJvbVZhbHVlID0gR2V0RGF0ZUZyb21WYWx1ZTtcclxuZnVuY3Rpb24gR2V0U3RyaW5nRnJvbVZhbHVlKGVuZ2luZSwgaXNvbGF0ZSwgdmFsdWUsIC8qb3V0IGludCAqLyBsZW5ndGhPZmZzZXQsIGlzQnlSZWYpIHtcclxuICAgIHZhciByZXR1cm5TdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcocmV0dXJuU3RyLCBsZW5ndGhPZmZzZXQpO1xyXG59XHJcbmV4cG9ydHMuR2V0U3RyaW5nRnJvbVZhbHVlID0gR2V0U3RyaW5nRnJvbVZhbHVlO1xyXG5mdW5jdGlvbiBHZXRCb29sZWFuRnJvbVZhbHVlKGVuZ2luZSwgaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcclxuICAgIHJldHVybiBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG59XHJcbmV4cG9ydHMuR2V0Qm9vbGVhbkZyb21WYWx1ZSA9IEdldEJvb2xlYW5Gcm9tVmFsdWU7XHJcbmZ1bmN0aW9uIFZhbHVlSXNCaWdJbnQoZW5naW5lLCBpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgdmFyIGJpZ2ludCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICByZXR1cm4gYmlnaW50IGluc3RhbmNlb2YgQmlnSW50O1xyXG59XHJcbmV4cG9ydHMuVmFsdWVJc0JpZ0ludCA9IFZhbHVlSXNCaWdJbnQ7XHJcbmZ1bmN0aW9uIEdldEJpZ0ludEZyb21WYWx1ZShlbmdpbmUsIGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICB2YXIgYmlnaW50ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgIHJldHVybiBiaWdpbnQ7XHJcbn1cclxuZXhwb3J0cy5HZXRCaWdJbnRGcm9tVmFsdWUgPSBHZXRCaWdJbnRGcm9tVmFsdWU7XHJcbmZ1bmN0aW9uIEdldE9iamVjdEZyb21WYWx1ZShlbmdpbmUsIGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICB2YXIgbmF0aXZlT2JqZWN0ID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgIHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QobmF0aXZlT2JqZWN0KTtcclxufVxyXG5leHBvcnRzLkdldE9iamVjdEZyb21WYWx1ZSA9IEdldE9iamVjdEZyb21WYWx1ZTtcclxuZnVuY3Rpb24gR2V0RnVuY3Rpb25Gcm9tVmFsdWUoZW5naW5lLCBpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgdmFyIGZ1bmMgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgdmFyIGpzZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jKTtcclxuICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbn1cclxuZXhwb3J0cy5HZXRGdW5jdGlvbkZyb21WYWx1ZSA9IEdldEZ1bmN0aW9uRnJvbVZhbHVlO1xyXG5mdW5jdGlvbiBHZXRKU09iamVjdEZyb21WYWx1ZShlbmdpbmUsIGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgIHZhciBqc29iaiA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3Qob2JqKTtcclxuICAgIHJldHVybiBqc29iai5pZDtcclxufVxyXG5leHBvcnRzLkdldEpTT2JqZWN0RnJvbVZhbHVlID0gR2V0SlNPYmplY3RGcm9tVmFsdWU7XHJcbmZ1bmN0aW9uIEdldEFycmF5QnVmZmVyRnJvbVZhbHVlKGVuZ2luZSwgaXNvbGF0ZSwgdmFsdWUsIC8qb3V0IGludCAqLyBsZW5ndGhPZmZzZXQsIGlzT3V0KSB7XHJcbiAgICB2YXIgYWIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgaWYgKGFiIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xyXG4gICAgICAgIGFiID0gYWIuYnVmZmVyO1xyXG4gICAgfVxyXG4gICAgdmFyIHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKGFiLmJ5dGVMZW5ndGgpO1xyXG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4LnNldChuZXcgSW50OEFycmF5KGFiKSwgcHRyKTtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbbGVuZ3RoT2Zmc2V0ID4+IDJdID0gYWIuYnl0ZUxlbmd0aDtcclxuICAgICgwLCBsaWJyYXJ5XzEuc2V0T3V0VmFsdWUzMikoZW5naW5lLCBsZW5ndGhPZmZzZXQsIGFiLmJ5dGVMZW5ndGgpO1xyXG4gICAgcmV0dXJuIHB0cjtcclxufVxyXG5leHBvcnRzLkdldEFycmF5QnVmZmVyRnJvbVZhbHVlID0gR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWU7XHJcbmZ1bmN0aW9uICRHZXRBcmd1bWVudEZpbmFsVmFsdWUoZW5naW5lLCB2YWwsIGpzVmFsdWVUeXBlLCBsZW5ndGhPZmZzZXQpIHtcclxuICAgIGlmICghanNWYWx1ZVR5cGUpXHJcbiAgICAgICAganNWYWx1ZVR5cGUgPSAoMCwgbGlicmFyeV8xLkdldFR5cGUpKGVuZ2luZSwgdmFsKTtcclxuICAgIHN3aXRjaCAoanNWYWx1ZVR5cGUpIHtcclxuICAgICAgICBjYXNlIDQ6IHJldHVybiArdmFsO1xyXG4gICAgICAgIGNhc2UgODogcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcodmFsLCBsZW5ndGhPZmZzZXQpO1xyXG4gICAgICAgIGNhc2UgMTY6IHJldHVybiArdmFsO1xyXG4gICAgICAgIGNhc2UgMzI6IHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodmFsKTtcclxuICAgICAgICBjYXNlIDY0OiByZXR1cm4gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdCh2YWwpLmlkO1xyXG4gICAgICAgIGNhc2UgMTI4OiByZXR1cm4gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdCh2YWwpLmlkO1xyXG4gICAgICAgIGNhc2UgMjU2OiByZXR1cm4gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKHZhbCkuaWQ7XHJcbiAgICAgICAgY2FzZSA1MTI6IHJldHVybiB2YWwuZ2V0VGltZSgpO1xyXG4gICAgICAgIGNhc2UgMTAyNDpcclxuICAgICAgICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuICAgICAgICAgICAgICAgIHZhbCA9IHZhbC5idWZmZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKHZhbC5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4LnNldChuZXcgSW50OEFycmF5KHZhbCksIHB0cik7XHJcbiAgICAgICAgICAgICgwLCBsaWJyYXJ5XzEuc2V0T3V0VmFsdWUzMikoZW5naW5lLCBsZW5ndGhPZmZzZXQsIHZhbC5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHB0cjtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLiRHZXRBcmd1bWVudEZpbmFsVmFsdWUgPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlO1xyXG4vKipcclxuICogbWl4aW5cclxuICogSlPosIPnlKhDI+aXtu+8jEMj5L6n6I635Y+WSlPosIPnlKjlj4LmlbDnmoTlgLxcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kR2V0RnJvbUpTQXJndW1lbnRBUEkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC8qKioqKioqKioqKui/memDqOWIhueOsOWcqOmDveaYr0MrK+WunueOsOeahCoqKioqKioqKioqKi9cclxuICAgICAgICAvLyBHZXROdW1iZXJGcm9tVmFsdWU6IEdldE51bWJlckZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0RGF0ZUZyb21WYWx1ZTogR2V0RGF0ZUZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0U3RyaW5nRnJvbVZhbHVlOiBHZXRTdHJpbmdGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEJvb2xlYW5Gcm9tVmFsdWU6IEdldEJvb2xlYW5Gcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIFZhbHVlSXNCaWdJbnQ6IFZhbHVlSXNCaWdJbnQuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEJpZ0ludEZyb21WYWx1ZTogR2V0QmlnSW50RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRPYmplY3RGcm9tVmFsdWU6IEdldE9iamVjdEZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0RnVuY3Rpb25Gcm9tVmFsdWU6IEdldEZ1bmN0aW9uRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcclxuICAgICAgICAvLyBHZXRKU09iamVjdEZyb21WYWx1ZTogR2V0SlNPYmplY3RGcm9tVmFsdWUuYmluZChudWxsLCBlbmdpbmUpLFxyXG4gICAgICAgIC8vIEdldEFycmF5QnVmZmVyRnJvbVZhbHVlOiBHZXRBcnJheUJ1ZmZlckZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXHJcbiAgICAgICAgLy8gR2V0QXJndW1lbnRUeXBlOiBmdW5jdGlvbiAoaXNvbGF0ZTogSW50UHRyLCBpbmZvOiBNb2NrSW50UHRyLCBpbmRleDogaW50LCBpc0J5UmVmOiBib29sKSB7XHJcbiAgICAgICAgLy8gICAgIHZhciB2YWx1ZSA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8sIGVuZ2luZSkuYXJnc1tpbmRleF07XHJcbiAgICAgICAgLy8gICAgIHJldHVybiBHZXRUeXBlKGVuZ2luZSwgdmFsdWUpO1xyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgICAgLy8gLyoqXHJcbiAgICAgICAgLy8gICog5Li6YyPkvqfmj5DkvpvkuIDkuKrojrflj5ZjYWxsYmFja2luZm/ph4xqc3ZhbHVl55qEaW50cHRy55qE5o6l5Y+jXHJcbiAgICAgICAgLy8gICog5bm25LiN5piv5b6X55qE5Yiw6L+Z5LiqYXJndW1lbnTnmoTlgLxcclxuICAgICAgICAvLyAgKiBcclxuICAgICAgICAvLyAgKiDor6XmjqXlj6Plj6rmnInkvY3ov5DnrpfvvIznlLFDKyvlrp7njrBcclxuICAgICAgICAvLyAgKi9cclxuICAgICAgICAvLyBHZXRBcmd1bWVudFZhbHVlLyppbkNhbGxiYWNrSW5mbyovOiBmdW5jdGlvbiAoaW5mb3B0cjogTW9ja0ludFB0ciwgaW5kZXg6IGludCkge1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gaW5mb3B0ciB8IGluZGV4O1xyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgICAgLy8gR2V0SnNWYWx1ZVR5cGU6IGZ1bmN0aW9uIChpc29sYXRlOiBJbnRQdHIsIHZhbDogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xyXG4gICAgICAgIC8vICAgICAvLyBwdWJsaWMgZW51bSBKc1ZhbHVlVHlwZVxyXG4gICAgICAgIC8vICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIC8vICAgICBOdWxsT3JVbmRlZmluZWQgPSAxLFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQmlnSW50ID0gMixcclxuICAgICAgICAvLyAgICAgLy8gICAgIE51bWJlciA9IDQsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBTdHJpbmcgPSA4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQm9vbGVhbiA9IDE2LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgTmF0aXZlT2JqZWN0ID0gMzIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBKc09iamVjdCA9IDY0LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQXJyYXkgPSAxMjgsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBGdW5jdGlvbiA9IDI1NixcclxuICAgICAgICAvLyAgICAgLy8gICAgIERhdGUgPSA1MTIsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBBcnJheUJ1ZmZlciA9IDEwMjQsXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBVbmtub3cgPSAyMDQ4LFxyXG4gICAgICAgIC8vICAgICAvLyAgICAgQW55ID0gTnVsbE9yVW5kZWZpbmVkIHwgQmlnSW50IHwgTnVtYmVyIHwgU3RyaW5nIHwgQm9vbGVhbiB8IE5hdGl2ZU9iamVjdCB8IEFycmF5IHwgRnVuY3Rpb24gfCBEYXRlIHwgQXJyYXlCdWZmZXIsXHJcbiAgICAgICAgLy8gICAgIC8vIH07XHJcbiAgICAgICAgLy8gICAgIHZhciB2YWx1ZTogYW55ID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsLCBlbmdpbmUpO1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gR2V0VHlwZShlbmdpbmUsIHZhbHVlKTtcclxuICAgICAgICAvLyB9LFxyXG4gICAgICAgIC8qKioqKioqKioqKuS7peS4iueOsOWcqOmDveaYr0MrK+WunueOsOeahCoqKioqKioqKioqKi9cclxuICAgICAgICBHZXRUeXBlSWRGcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgdmFyIHR5cGVpZCA9IDA7XHJcbiAgICAgICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gb2JqLl9mdW5jW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IG9ialtcIiRjaWRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0eXBlaWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVpZDtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2V0RnJvbUpTQXJndW1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBDI+iwg+eUqEpT5pe277yM6I635Y+WSlPlh73mlbDov5Tlm57lgLxcclxuICpcclxuICog5Y6f5pyJ55qEcmVzdWx0SW5mb+iuvuiuoeWHuuadpeWPquaYr+S4uuS6huiuqeWkmmlzb2xhdGXml7bog73lnKjkuI3lkIznmoRpc29sYXRl6YeM5L+d5oyB5LiN5ZCM55qEcmVzdWx0XHJcbiAqIOWcqFdlYkdM5qih5byP5LiL5rKh5pyJ6L+Z5Liq54Om5oG877yM5Zug5q2k55u05o6l55SoZW5naW5l55qE5Y2z5Y+vXHJcbiAqIHJlc3VsdEluZm/lm7rlrprkuLoxMDI0XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgR2V0TnVtYmVyRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXREYXRlRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQuZ2V0VGltZSgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0U3RyaW5nRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCwgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEJvb2xlYW5Gcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlc3VsdElzQmlnSW50OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCBpbnN0YW5jZW9mIEJpZ0ludDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEJpZ0ludEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRPYmplY3RGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0VHlwZUlkRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICAgICAgdmFyIHR5cGVpZCA9IDA7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSB2YWx1ZS5fZnVuY1tcIiRjaWRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSB2YWx1ZVtcIiRjaWRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0eXBlaWQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVpZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEZ1bmN0aW9uRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdmFyIGpzZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEpTT2JqZWN0RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdmFyIGpzb2JqID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdChlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICAgICAgcmV0dXJuIGpzb2JqLmlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0QXJyYXlCdWZmZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgYWIgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgICAgICB2YXIgcHRyID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoYWIuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XHJcbiAgICAgICAgICAgICgwLCBsaWJyYXJ5XzEuc2V0T3V0VmFsdWUzMikoZW5naW5lLCBsZW5ndGgsIGFiLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICByZXR1cm4gcHRyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy/kv53lrojmlrnmoYhcclxuICAgICAgICBHZXRSZXN1bHRUeXBlOiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgICAgICByZXR1cm4gKDAsIGxpYnJhcnlfMS5HZXRUeXBlKShlbmdpbmUsIHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRHZXRGcm9tSlNSZXR1cm5BUEk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEZyb21KU1JldHVybi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIOazqOWGjOexu0FQSe+8jOWmguazqOWGjOWFqOWxgOWHveaVsOOAgeazqOWGjOexu++8jOS7peWPiuexu+eahOWxnuaAp+aWueazleetiVxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRSZWdpc3RlckFQSShlbmdpbmUpIHtcclxuICAgIGNvbnN0IHJldHVybmVlID0ge1xyXG4gICAgICAgIFNldEdsb2JhbEZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgbmFtZVN0cmluZywgdjhGdW5jdGlvbkNhbGxiYWNrLCBqc0VudklkeCwgY2FsbGJhY2tpZHgpIHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIGxpYnJhcnlfMS5nbG9iYWxbbmFtZV0gPSBlbmdpbmUubWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKHRydWUsIHY4RnVuY3Rpb25DYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX1JlZ2lzdGVyQ2xhc3M6IGZ1bmN0aW9uIChpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIGpzRW52SWR4LCBjYWxsYmFja2lkeCwgc2l6ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBmdWxsTmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoZnVsbE5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICBjb25zdCBjc2hhcnBPYmplY3RNYXAgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwO1xyXG4gICAgICAgICAgICBjb25zdCBpZCA9IGNzaGFycE9iamVjdE1hcC5jbGFzc2VzLmxlbmd0aDtcclxuICAgICAgICAgICAgbGV0IHRlbXBFeHRlcm5hbENTSUQgPSAwO1xyXG4gICAgICAgICAgICBjb25zdCBjdG9yID0gZnVuY3Rpb24gTmF0aXZlT2JqZWN0KCkge1xyXG4gICAgICAgICAgICAgICAgLy8g6K6+572u57G75Z6LSURcclxuICAgICAgICAgICAgICAgIHRoaXNbXCIkY2lkXCJdID0gaWQ7XHJcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmVPYmplY3TnmoTmnoTpgKDlh73mlbBcclxuICAgICAgICAgICAgICAgIC8vIOaehOmAoOWHveaVsOacieS4pOS4quiwg+eUqOeahOWcsOaWue+8mjEuIGpz5L6nbmV35LiA5Liq5a6D55qE5pe25YCZIDIuIGNz5L6n5Yib5bu65LqG5LiA5Liq5a+56LGh6KaB5Lyg5YiwanPkvqfml7ZcclxuICAgICAgICAgICAgICAgIC8vIOesrOS4gOS4quaDheWGte+8jGNz5a+56LGhSUTmiJbogIXmmK9jYWxsVjhDb25zdHJ1Y3RvckNhbGxiYWNr6L+U5Zue55qE44CCXHJcbiAgICAgICAgICAgICAgICAvLyDnrKzkuozkuKrmg4XlhrXvvIzliJljc+WvueixoUlE5pivY3MgbmV35a6M5LmL5ZCO5LiA5bm25Lyg57uZanPnmoTjgIJcclxuICAgICAgICAgICAgICAgIGxldCBjc0lEID0gdGVtcEV4dGVybmFsQ1NJRDsgLy8g5aaC5p6c5piv56ys5LqM5Liq5oOF5Ya177yM5q2kSUTnlLFjcmVhdGVGcm9tQ1Porr7nva5cclxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNzSUQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFja0luZm9QdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOiZveeEtnB1ZXJ0c+WGhUNvbnN0cnVjdG9y55qE6L+U5Zue5YC85Y+rc2VsZu+8jOS9huWug+WFtuWunuWwseaYr0NT5a+56LGh55qE5LiA5LiqaWTogIzlt7LjgIJcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc0lEID0gZW5naW5lLmNhbGxWOENvbnN0cnVjdG9yQ2FsbGJhY2soY29uc3RydWN0b3IsIGNhbGxiYWNrSW5mb1B0ciwgYXJncy5sZW5ndGgsIGNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5SZWxlYXNlQnlNb2NrSW50UHRyKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gYmxpdHRhYmxlXHJcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjc05ld0lEID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2Moc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLl9tZW1jcHkoY3NOZXdJRCwgY3NJRCwgc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc05ld0lELCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzTmV3SUQsIChjc0lkZW50aWZpZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLnJlbW92ZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuX2ZyZWUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5hZGQoY3NJRCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5PbkZpbmFsaXplKSh0aGlzLCBjc0lELCAoY3NJZGVudGlmaWVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5yZW1vdmUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmNhbGxWOERlc3RydWN0b3JDYWxsYmFjayhkZXN0cnVjdG9yIHx8IGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciwgY3NJZGVudGlmaWVyLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGN0b3IuY3JlYXRlRnJvbUNTID0gZnVuY3Rpb24gKGNzSUQpIHtcclxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSBjc0lEO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGN0b3IuX19wdWVydHNNZXRhZGF0YSA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwibmFtZVwiLCB7IHZhbHVlOiBmdWxsTmFtZSArIFwiQ29uc3RydWN0b3JcIiB9KTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwiJGNpZFwiLCB7IHZhbHVlOiBpZCB9KTtcclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMucHVzaChjdG9yKTtcclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzSURXZWFrTWFwLnNldChjdG9yLCBpZCk7XHJcbiAgICAgICAgICAgIGlmIChCYXNlVHlwZUlkID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY3Rvci5wcm90b3R5cGUuX19wcm90b19fID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbQmFzZVR5cGVJZF0ucHJvdG90eXBlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5uYW1lc1RvQ2xhc3Nlc0lEW2Z1bGxOYW1lXSA9IGlkO1xyXG4gICAgICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZWdpc3RlclN0cnVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCwgc2l6ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuZWUuX1JlZ2lzdGVyQ2xhc3MoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCBjYWxsYmFja2lkeCwgY2FsbGJhY2tpZHgsIHNpemUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBjYWxsYmFjaywgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCkge1xyXG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgICAgICBpZiAoIWNscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgZm4gPSBlbmdpbmUubWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBjYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIGNsc1tuYW1lXSA9IGZuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2xzLnByb3RvdHlwZVtuYW1lXSA9IGZuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZWdpc3RlclByb3BlcnR5OiBmdW5jdGlvbiAoaXNvbGF0ZSwgY2xhc3NJRCwgbmFtZVN0cmluZywgaXNTdGF0aWMsIGdldHRlciwgXHJcbiAgICAgICAgLypsb25nICovIGdldHRlcmpzRW52SWR4LCBcclxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyY2FsbGJhY2tpZHgsIHNldHRlciwgXHJcbiAgICAgICAgLypsb25nICovIHNldHRlcmpzRW52SWR4LCBcclxuICAgICAgICAvKmxvbmcgKi8gc2V0dGVyY2FsbGJhY2tpZHgsIGRvbnREZWxldGUpIHtcclxuICAgICAgICAgICAgdmFyIGNscyA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcclxuICAgICAgICAgICAgaWYgKCFjbHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgdmFyIGF0dHIgPSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6ICFkb250RGVsZXRlLFxyXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgYXR0ci5nZXQgPSBlbmdpbmUubWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBnZXR0ZXIsIGdldHRlcmNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgaWYgKHNldHRlcikge1xyXG4gICAgICAgICAgICAgICAgYXR0ci5zZXQgPSBlbmdpbmUubWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBzZXR0ZXIsIHNldHRlcmNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbHMsIG5hbWUsIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscy5wcm90b3R5cGUsIG5hbWUsIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbiAgICByZXR1cm4gcmV0dXJuZWU7XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlZ2lzdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogQyPosIPnlKhKU+aXtu+8jOiuvue9ruiwg+eUqOWPguaVsOeahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0ludm9rZUpTQXJndW1lbnRBcGkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC8vYmVnaW4gY3MgY2FsbCBqc1xyXG4gICAgICAgIFB1c2hOdWxsRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobnVsbCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoRGF0ZUZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGRhdGVWYWx1ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobmV3IERhdGUoZGF0ZVZhbHVlKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoQm9vbGVhbkZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGIpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEJpZ0ludEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qbG9uZyAqLyBsb25nbG93LCBsb25naGlnaCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb25nbG93LCBsb25naGlnaCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaFN0cmluZ0ZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIHN0clN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hOdW1iZXJGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChkKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hPYmplY3RGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBjbGFzc0lELCBvYmplY3RJRCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qob2JqZWN0SUQsIGNsYXNzSUQpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hKU0Z1bmN0aW9uRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoSlNGdW5jdGlvbikuX2Z1bmMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEpTT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNPYmplY3QpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTT2JqZWN0QnlJZChKU09iamVjdCkuZ2V0T2JqZWN0KCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEFycmF5QnVmZmVyRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypieXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSW52b2tlSlNBcmd1bWVudEFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9JbnZva2VKU0FyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogSlPosIPnlKhDI+aXtu+8jEMj6K6+572u6L+U5Zue5YiwSlPnmoTlgLxcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9KU0ludm9rZVJldHVybkFwaShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgUmV0dXJuQ2xhc3M6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBjbGFzc0lEKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybk9iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGNsYXNzSUQsIHNlbGYpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qoc2VsZiwgY2xhc3NJRCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5OdW1iZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBudW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbnVtYmVyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuU3RyaW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgc3RyU3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0ciA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKTtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gc3RyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQmlnSW50OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgbG9uZ0xvdywgbG9uZ0hpZ2gpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb25nTG93LCBsb25nSGlnaCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5Cb29sZWFuOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgYikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSAhIWI7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5EYXRlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgZGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBuZXcgRGF0ZShkYXRlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybk51bGw6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG51bGw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5GdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIEpTRnVuY3Rpb25QdHIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY29uc3QganNGdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoSlNGdW5jdGlvblB0cik7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGpzRnVuYy5fZnVuYztcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkpTT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgSlNPYmplY3RQdHIpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY29uc3QganNPYmplY3QgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU09iamVjdEJ5SWQoSlNPYmplY3RQdHIpO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBqc09iamVjdC5nZXRPYmplY3QoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkNTaGFycEZ1bmN0aW9uQ2FsbGJhY2s6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVyTG93LCBcclxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckhpZ2gpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLm1ha2VWOEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihmYWxzZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBwb2ludGVyTG93KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkFycmF5QnVmZmVyOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgLypieXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9KU0ludm9rZVJldHVybkFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9KU0ludm9rZVJldHVybi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4vKipcclxuICogbWl4aW5cclxuICogSlPosIPnlKhDI+aXtu+8jEMj5L6n6K6+572ub3V05Y+C5pWw5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgU2V0TnVtYmVyVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBudW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG51bWJlcjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldERhdGVUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGRhdGUpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0U3RyaW5nVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gc3RyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0Qm9vbGVhblRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgYikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gISFiOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0QmlnSW50VG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCAvKmxvbmcgKi8gYmlnSW50KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRPYmplY3RUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGNsYXNzSUQsIHNlbGYpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KHNlbGYsIGNsYXNzSUQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0TnVsbFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gbnVsbDsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldEFycmF5QnVmZmVyVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCAvKkJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9KU091dEFyZ3VtZW50QVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0pTT3V0QXJndW1lbnQuanMubWFwIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuLyoqXHJcbiAqIOagueaNriBodHRwczovL2RvY3MudW5pdHkzZC5jb20vMjAxOC40L0RvY3VtZW50YXRpb24vTWFudWFsL3dlYmdsLWludGVyYWN0aW5nd2l0aGJyb3dzZXJzY3JpcHRpbmcuaHRtbFxyXG4gKiDmiJHku6znmoTnm67nmoTlsLHmmK/lnKhXZWJHTOaooeW8j+S4i++8jOWunueOsOWSjHB1ZXJ0cy5kbGznmoTmlYjmnpzjgILlhbfkvZPlnKjkuo7lrp7njrDkuIDkuKpqc2xpYu+8jOmHjOmdouW6lOWMheWQq1B1ZXJ0c0RMTC5jc+eahOaJgOacieaOpeWPo1xyXG4gKiDlrp7pqozlj5HnjrDov5nkuKpqc2xpYuiZveeEtuS5n+aYr+i/kOihjOWcqHY455qEanPvvIzkvYblr7lkZXZ0b29s6LCD6K+V5bm25LiN5Y+L5aW977yM5LiU5Y+q5pSv5oyB5YiwZXM144CCXHJcbiAqIOWboOatpOW6lOivpemAmui/h+S4gOS4queLrOeri+eahGpz5a6e546w5o6l5Y+j77yMcHVlcnRzLmpzbGli6YCa6L+H5YWo5bGA55qE5pa55byP6LCD55So5a6D44CCXHJcbiAqXHJcbiAqIOacgOe7iOW9ouaIkOWmguS4i+aetuaehFxyXG4gKiDkuJrliqFKUyA8LT4gV0FTTSA8LT4gdW5pdHkganNsaWIgPC0+IOacrGpzXHJcbiAqIOS9huaVtOadoemTvui3r+WFtuWunumDveWcqOS4gOS4qnY4KGpzY29yZSnomZrmi5/mnLrph4xcclxuICovXHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuL2xpYnJhcnlcIik7XHJcbmNvbnN0IGdldEZyb21KU0FyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvZ2V0RnJvbUpTQXJndW1lbnRcIik7XHJcbmNvbnN0IGdldEZyb21KU1JldHVybl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL2dldEZyb21KU1JldHVyblwiKTtcclxuY29uc3QgcmVnaXN0ZXJfMSA9IHJlcXVpcmUoXCIuL21peGlucy9yZWdpc3RlclwiKTtcclxuY29uc3Qgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9JbnZva2VKU0FyZ3VtZW50XCIpO1xyXG5jb25zdCBzZXRUb0pTSW52b2tlUmV0dXJuXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9KU0ludm9rZVJldHVyblwiKTtcclxuY29uc3Qgc2V0VG9KU091dEFyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9KU091dEFyZ3VtZW50XCIpO1xyXG5saWJyYXJ5XzEuZ2xvYmFsLnd4UmVxdWlyZSA9IGxpYnJhcnlfMS5nbG9iYWwucmVxdWlyZTtcclxubGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IHtcclxuICAgIGluaXRlZDogZmFsc2UsXHJcbiAgICBkZWJ1ZzogZmFsc2UsXHJcbiAgICAvLyBwdWVydHPpppbmrKHliJ3lp4vljJbml7bkvJrosIPnlKjov5nph4zvvIzlubbmiopVbml0eeeahOmAmuS/oeaOpeWPo+S8oOWFpVxyXG4gICAgSW5pdCh7IFVURjhUb1N0cmluZywgX21hbGxvYywgX21lbWNweSwgX2ZyZWUsIHN0cmluZ1RvVVRGOCwgbGVuZ3RoQnl0ZXNVVEY4LCB1bml0eUluc3RhbmNlIH0pIHtcclxuICAgICAgICBjb25zdCBlbmdpbmUgPSBuZXcgbGlicmFyeV8xLlB1ZXJ0c0pTRW5naW5lKHtcclxuICAgICAgICAgICAgVVRGOFRvU3RyaW5nLCBfbWFsbG9jLCBfbWVtY3B5LCBfZnJlZSwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHVuaXR5SW5zdGFuY2VcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBleGVjdXRlTW9kdWxlQ2FjaGUgPSB7fTtcclxuICAgICAgICBsZXQganNFbmdpbmVSZXR1cm5lZCA9IGZhbHNlO1xyXG4gICAgICAgIC8vIFB1ZXJ0c0RMTOeahOaJgOacieaOpeWPo+WunueOsFxyXG4gICAgICAgIGxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wgPSBPYmplY3QuYXNzaWduKGxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wsICgwLCBnZXRGcm9tSlNBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBnZXRGcm9tSlNSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSlNJbnZva2VSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU091dEFyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHJlZ2lzdGVyXzEuZGVmYXVsdCkoZW5naW5lKSwge1xyXG4gICAgICAgICAgICAvLyBicmlkZ2VMb2c6IHRydWUsXHJcbiAgICAgICAgICAgIFNldENhbGxWODogZnVuY3Rpb24gKGNhbGxWOEZ1bmN0aW9uLCBjYWxsVjhDb25zdHJ1Y3RvciwgY2FsbFY4RGVzdHJ1Y3Rvcikge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmNhbGxWOEZ1bmN0aW9uID0gY2FsbFY4RnVuY3Rpb247XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbFY4Q29uc3RydWN0b3IgPSBjYWxsVjhDb25zdHJ1Y3RvcjtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5jYWxsVjhEZXN0cnVjdG9yID0gY2FsbFY4RGVzdHJ1Y3RvcjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0TGliVmVyc2lvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDMyO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRBcGlMZXZlbDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDMyO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRMaWJCYWNrZW5kOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSlNFbmdpbmU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChqc0VuZ2luZVJldHVybmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwib25seSBvbmUgYXZhaWxhYmxlIGpzRW52IGlzIGFsbG93ZWQgaW4gV2ViR0wgbW9kZVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGpzRW5naW5lUmV0dXJuZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENyZWF0ZUpTRW5naW5lV2l0aEV4dGVybmFsRW52OiBmdW5jdGlvbiAoKSB7IH0sXHJcbiAgICAgICAgICAgIERlc3Ryb3lKU0VuZ2luZTogZnVuY3Rpb24gKCkgeyB9LFxyXG4gICAgICAgICAgICBHZXRMYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKGlzb2xhdGUsIC8qIG91dCBpbnQgKi8gc3RybGVuKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhlbmdpbmUubGFzdEV4Y2VwdGlvbi5zdGFjaywgc3RybGVuKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgTG93TWVtb3J5Tm90aWZpY2F0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBJZGxlTm90aWZpY2F0aW9uRGVhZGxpbmU6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFJlcXVlc3RNaW5vckdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgUmVxdWVzdEZ1bGxHYXJiYWdlQ29sbGVjdGlvbkZvclRlc3Rpbmc6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFNldEdlbmVyYWxEZXN0cnVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2dlbmVyYWxEZXN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuZ2VuZXJhbERlc3RydWN0b3IgPSBfZ2VuZXJhbERlc3RydWN0b3I7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldE1vZHVsZUV4ZWN1dG9yOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmN0aW9uIChmaWxlTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChbJ3B1ZXJ0cy9sb2cubWpzJywgJ3B1ZXJ0cy90aW1lci5tanMnXS5pbmRleE9mKGZpbGVOYW1lKSAhPSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd3ggIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHd4UmVxdWlyZSgncHVlcnRzX21pbmlnYW1lX2pzX3Jlc291cmNlcy8nICsgKGZpbGVOYW1lLmVuZHNXaXRoKCcuanMnKSA/IGZpbGVOYW1lIDogZmlsZU5hbWUgKyBcIi5qc1wiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplKG5hbWUsIHRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCcuLycgPT09IHRvLnN1YnN0cmluZygwLCAyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byA9IHRvLnN1YnN0cmluZygyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA9IChuYW1lLmVuZHNXaXRoKCcvJykgPyBuYW1lIDogbmFtZS5zdWJzdHJpbmcoMCwgbmFtZS5sYXN0SW5kZXhPZignLycpICsgMSkpICsgdG87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aFNlZ3MgPSBuYW1lLnJlcGxhY2VBbGwoJy8vJywgJy8nKS5zcGxpdCgnLycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldFBhdGggPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGhTZWdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoU2Vnc1tpXSA9PSAnLi4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0UGF0aC5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0UGF0aC5wdXNoKHBhdGhTZWdzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldFBhdGguam9pbignLycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbW9ja1JlcXVpcmUoc3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBleHBvcnRzOiB7fSB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kQ2FjaGVTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgZXhlY3V0ZU1vZHVsZUNhY2hlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRDYWNoZVNwZWNpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuZXhwb3J0cyA9IGV4ZWN1dGVNb2R1bGVDYWNoZVtmb3VuZENhY2hlU3BlY2lmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIFBVRVJUU19KU19SRVNPVVJDRVMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdmaWxlIG5vdCBmb3VuZDogJyArIHNwZWNpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY2lmaWVyID0gZm91bmRTcGVjaWZpZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQVUVSVFNfSlNfUkVTT1VSQ0VTW3NwZWNpZmllcl0ocmVzdWx0LmV4cG9ydHMsIGZ1bmN0aW9uIG1SZXF1aXJlKHNwZWNpZmllclRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vY2tSZXF1aXJlKG5vcm1hbGl6ZShzcGVjaWZpZXIsIHNwZWNpZmllclRvKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdID0gcmVzdWx0LmV4cG9ydHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuZXhwb3J0cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0cnlGaW5kTmFtZSA9IFtzcGVjaWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3BlY2lmaWVyLmluZGV4T2YoJy4nKSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeUZpbmROYW1lID0gdHJ5RmluZE5hbWUuY29uY2F0KFtzcGVjaWZpZXIgKyAnLmpzJywgc3BlY2lmaWVyICsgJy50cycsIHNwZWNpZmllciArICcubWpzJywgc3BlY2lmaWVyICsgJy5tdHMnXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSB0cnlGaW5kTmFtZS5yZWR1Y2UoKHJldCwgbmFtZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXQgIT09IGZhbHNlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqW25hbWVdID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNpcmN1bGFyIGRlcGVuZGVuY3kgaXMgZGV0ZWN0ZWQgd2hlbiByZXF1aXJpbmcgXCIke25hbWV9XCJgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbmRlZCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyeUZpbmROYW1lW2ZpbmRlZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVpcmVSZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RFeGNlcHRpb24gPSBlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0SlNPYmplY3RWYWx1ZUdldHRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGpzZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jdGlvbiAob2JqLCBrZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqW2tleV07XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEV2YWw6IGZ1bmN0aW9uIChpc29sYXRlLCBjb2RlU3RyaW5nLCBwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWxpYnJhcnlfMS5nbG9iYWwuZXZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImV2YWwgaXMgbm90IHN1cHBvcnRlZFwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBVVEY4VG9TdHJpbmcoY29kZVN0cmluZyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsaWJyYXJ5XzEuZ2xvYmFsLmV2YWwoY29kZSk7XHJcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gZ2V0SW50UHRyTWFuYWdlcigpLkdldFBvaW50ZXJGb3JKU1ZhbHVlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC8qRlJlc3VsdEluZm8gKi8gMTAyNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgU2V0UHVzaEpTRnVuY3Rpb25Bcmd1bWVudHNDYWxsYmFjazogZnVuY3Rpb24gKGlzb2xhdGUsIGNhbGxiYWNrLCBqc0VudklkeCkge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLkdldEpTQXJndW1lbnRzQ2FsbGJhY2sgPSBjYWxsYmFjaztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgVGhyb3dFeGNlcHRpb246IGZ1bmN0aW9uIChpc29sYXRlLCAvKmJ5dGVbXSAqLyBtZXNzYWdlU3RyaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoVVRGOFRvU3RyaW5nKG1lc3NhZ2VTdHJpbmcpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgSW52b2tlSlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgaGFzUmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gZnVuYy5pbnZva2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignSW52b2tlSlNGdW5jdGlvbiBlcnJvcicsIGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMubGFzdEV4Y2VwdGlvbiA9IGVycjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0RnVuY3Rpb25MYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnVuYyBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZnVuYy5sYXN0RXhjZXB0aW9uLm1lc3NhZ2UgfHwgJycsIGxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVsZWFzZUpTRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBfZnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlbW92ZUpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlbGVhc2VKU09iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIG9iaikge1xyXG4gICAgICAgICAgICAgICAgbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVtb3ZlSlNPYmplY3RCeUlkKG9iaik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlc2V0UmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IG51bGw7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENsZWFyTW9kdWxlQ2FjaGU6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSW5zcGVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgcG9ydCkgeyB9LFxyXG4gICAgICAgICAgICBEZXN0cm95SW5zcGVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBJbnNwZWN0b3JUaWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBMb2dpY1RpY2s6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFNldExvZ0NhbGxiYWNrOiBmdW5jdGlvbiAobG9nLCBsb2dXYXJuaW5nLCBsb2dFcnJvcikge1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==