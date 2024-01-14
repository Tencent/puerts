/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./output/library.js":
/*!***************************!*\
  !*** ./output/library.js ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.returnBigInt = exports.isBigInt = exports.setOutValue8 = exports.setOutValue32 = exports.makeBigInt = exports.GetType = exports.PuertsJSEngine = exports.OnFinalize = exports.createWeakRef = exports.global = exports.CSharpObjectMap = exports.jsFunctionOrObjectFactory = exports.JSObject = exports.JSFunction = exports.Ref = exports.FunctionCallbackInfoPtrManager = exports.FunctionCallbackInfo = void 0;
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
        // index最小为1
        if (index) {
            this.infos[index].args = args;
        }
        else {
            index = this.infos.push(new FunctionCallbackInfo(args)) - 1;
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
        info.recycle();
        this.freeInfosIndex.push(index);
        return ret;
    }
    ReleaseByMockIntPtr(ptrIn8) {
        const ptrIn32 = ptrIn8 >> 2;
        const index = this.engine.unityApi.HEAP32[ptrIn32];
        let info = this.infos[index];
        this.recycleCallbackInfoMemory(ptrIn8, info.args);
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
    lastReturnCSResult = null;
    lastException = null;
    // 这两个是Puerts用的的真正的CSharp函数指针
    GetJSArgumentsCallback;
    generalDestructor;
    constructor(ctorParam) {
        this.csharpObjectMap = new CSharpObjectMap();
        this.functionCallbackInfoPtrManager = new FunctionCallbackInfoPtrManager(this);
        const { UTF8ToString, _malloc, _memcpy, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, unityInstance } = ctorParam;
        this.unityApi = {
            UTF8ToString,
            _malloc,
            _memcpy,
            _free,
            _setTempRet0,
            stringToUTF8,
            lengthBytesUTF8,
            CallCSharpFunctionCallback: unityInstance.asm.CallCSharpFunctionCallback,
            CallCSharpConstructorCallback: unityInstance.asm.CallCSharpConstructorCallback,
            CallCSharpDestructorCallback: unityInstance.asm.CallCSharpDestructorCallback,
            get HEAP32() {
                return unityInstance.HEAP32;
            },
            get HEAP8() {
                return unityInstance.HEAP8;
            },
            get HEAPU8() {
                return unityInstance.HEAPU8;
            },
            get HEAPF32() {
                return unityInstance.HEAPF32;
            },
            get HEAPF64() {
                return unityInstance.HEAPF64;
            },
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
    JSStringToCSString(returnStr, /** out int */ lengthOffset) {
        if (returnStr === null || returnStr === undefined) {
            return 0;
        }
        var byteCount = this.unityApi.lengthBytesUTF8(returnStr);
        setOutValue32(this, lengthOffset, byteCount);
        var buffer = this.unityApi._malloc(byteCount + 1);
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
        this.unityApi.CallCSharpFunctionCallback(functionPtr, infoIntPtr, selfPtr, paramLen, callbackIdx);
    }
    callCSharpConstructorCallback(functionPtr, infoIntPtr, paramLen, callbackIdx) {
        return this.unityApi.CallCSharpConstructorCallback(functionPtr, infoIntPtr, paramLen, callbackIdx);
    }
    callCSharpDestructorCallback(functionPtr, selfPtr, callbackIdx) {
        this.unityApi.CallCSharpDestructorCallback(functionPtr, selfPtr, callbackIdx);
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
        case 8: return engine.JSStringToCSString(val, lengthOffset);
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
            return engine.JSStringToCSString(engine.lastReturnCSResult, length);
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
    Init({ UTF8ToString, _malloc, _memcpy, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, unityInstance }) {
        const engine = new library_1.PuertsJSEngine({
            UTF8ToString, _malloc, _memcpy, _free, _setTempRet0, stringToUTF8, lengthBytesUTF8, unityInstance
        });
        const executeModuleCache = {};
        let jsEngineReturned = false;
        let loader;
        // PuertsDLL的所有接口实现
        library_1.global.PuertsWebGL = Object.assign(library_1.global.PuertsWebGL, { unityInstance }, (0, getFromJSArgument_1.default)(engine), (0, getFromJSReturn_1.default)(engine), (0, setToInvokeJSArgument_1.default)(engine), (0, setToJSInvokeReturn_1.default)(engine), (0, setToJSOutArgument_1.default)(engine), (0, register_1.default)(engine), {
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
                    const code = UTF8ToString(codeString);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxrQkFBZTtBQUNmOzs7Ozs7Ozs7O0FDNUhhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGtCQUFrQixtQkFBTyxDQUFDLHVDQUFZO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxrQkFBZTtBQUNmOzs7Ozs7Ozs7O0FDM0VhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGtCQUFrQixtQkFBTyxDQUFDLHVDQUFZO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QTZDO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtHQUErRyxLQUFLO0FBQ3BIO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYiw2Q0FBNkM7QUFDN0MseURBQXlEO0FBQ3pELG9EQUFvRDtBQUNwRCxpREFBaUQ7QUFDakQsNkNBQTZDO0FBQzdDO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGlDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2xpYnJhcnkuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9nZXRGcm9tSlNBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL2dldEZyb21KU1JldHVybi5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3JlZ2lzdGVyLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9JbnZva2VKU0FyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9KU0ludm9rZVJldHVybi5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSlNPdXRBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5yZXR1cm5CaWdJbnQgPSBleHBvcnRzLmlzQmlnSW50ID0gZXhwb3J0cy5zZXRPdXRWYWx1ZTggPSBleHBvcnRzLnNldE91dFZhbHVlMzIgPSBleHBvcnRzLm1ha2VCaWdJbnQgPSBleHBvcnRzLkdldFR5cGUgPSBleHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gZXhwb3J0cy5PbkZpbmFsaXplID0gZXhwb3J0cy5jcmVhdGVXZWFrUmVmID0gZXhwb3J0cy5nbG9iYWwgPSBleHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IGV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGV4cG9ydHMuSlNPYmplY3QgPSBleHBvcnRzLkpTRnVuY3Rpb24gPSBleHBvcnRzLlJlZiA9IGV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyID0gZXhwb3J0cy5GdW5jdGlvbkNhbGxiYWNrSW5mbyA9IHZvaWQgMDtcbi8qKlxuICog5LiA5qyh5Ye95pWw6LCD55So55qEaW5mb1xuICog5a+55bqUdjg6OkZ1bmN0aW9uQ2FsbGJhY2tJbmZvXG4gKi9cbmNsYXNzIEZ1bmN0aW9uQ2FsbGJhY2tJbmZvIHtcbiAgICBhcmdzO1xuICAgIHJldHVyblZhbHVlO1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICAgICAgdGhpcy5hcmdzID0gYXJncztcbiAgICB9XG4gICAgcmVjeWNsZSgpIHtcbiAgICAgICAgdGhpcy5hcmdzID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IHZvaWQgMDtcbiAgICB9XG59XG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gRnVuY3Rpb25DYWxsYmFja0luZm87XG4vLyBzdHJ1Y3QgTW9ja1Y4VmFsdWVcbi8vIHtcbi8vICAgICBpbnQgSlNWYWx1ZVR5cGU7ICAvLyAwXG4vLyAgICAgaW50IEZpbmFsVmFsdWVQb2ludGVyWzJdOyAvLyAxIDIgaWYgdmFsdWUgaXMgYmlnaW50IEZpbmFsVmFsdWVQb2ludGVyWzBdIGZvciBsb3csIEZpbmFsVmFsdWVQb2ludGVyWzFdIGZvciBoaWdoXG4vLyAgICAgaW50IGV4dHJhOyAvLyAzXG4vLyAgICAgaW50IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvOyAvLyA0XG4vLyB9O1xuY29uc3QgQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgPSA1OyAvLyBpbnQgY291bnRcbi8qKlxuICog5oqKRnVuY3Rpb25DYWxsYmFja0luZm/ku6Xlj4rlhbblj4LmlbDovazljJbkuLpjI+WPr+eUqOeahGludHB0clxuICovXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIge1xuICAgIC8vIEZ1bmN0aW9uQ2FsbGJhY2tJbmZv55qE5YiX6KGo77yM5Lul5YiX6KGo55qEaW5kZXjkvZzkuLpJbnRQdHLnmoTlgLxcbiAgICBpbmZvcyA9IFtuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oWzBdKV07IC8vIOi/memHjOWOn+acrOWPquaYr+S4quaZrumAmueahDBcbiAgICAvLyBGdW5jdGlvbkNhbGxiYWNrSW5mb+eUqOWujOWQju+8jOWwhuWFtuW6j+WPt+aUvuWFpeKAnOWbnuaUtuWIl+ihqOKAne+8jOS4i+asoeWwseiDvee7p+e7reacjeeUqOivpWluZGV477yM6ICM5LiN5b+F6K6paW5mb3PmlbDnu4Tml6DpmZDmianlsZXkuIvljrtcbiAgICBmcmVlSW5mb3NJbmRleCA9IFtdO1xuICAgIGZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aCA9IHt9O1xuICAgIGZyZWVSZWZNZW1vcnkgPSBbXTtcbiAgICBlbmdpbmU7XG4gICAgY29uc3RydWN0b3IoZW5naW5lKSB7XG4gICAgICAgIHRoaXMuZW5naW5lID0gZW5naW5lO1xuICAgIH1cbiAgICBhbGxvY0NhbGxiYWNrSW5mb01lbW9yeShhcmdzTGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGNhY2hlQXJyYXkgPSB0aGlzLmZyZWVDYWxsYmFja0luZm9NZW1vcnlCeUxlbmd0aFthcmdzTGVuZ3RoXTtcbiAgICAgICAgaWYgKGNhY2hlQXJyYXkgJiYgY2FjaGVBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWNoZUFycmF5LnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoKGFyZ3NMZW5ndGggKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDEpIDw8IDIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFsbG9jUmVmTWVtb3J5KCkge1xuICAgICAgICBpZiAodGhpcy5mcmVlUmVmTWVtb3J5Lmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZyZWVSZWZNZW1vcnkucG9wKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmVuZ2luZS51bml0eUFwaS5fbWFsbG9jKEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyIDw8IDIpO1xuICAgIH1cbiAgICByZWN5Y2xlUmVmTWVtb3J5KGJ1ZmZlclB0cikge1xuICAgICAgICBpZiAodGhpcy5mcmVlUmVmTWVtb3J5Lmxlbmd0aCA+IDIwKSB7XG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5fZnJlZShidWZmZXJQdHIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5mcmVlUmVmTWVtb3J5LnB1c2goYnVmZmVyUHRyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZWN5Y2xlQ2FsbGJhY2tJbmZvTWVtb3J5KGJ1ZmZlclB0ciwgYXJncykge1xuICAgICAgICBjb25zdCBhcmdzTGVuZ3RoID0gYXJncy5sZW5ndGg7XG4gICAgICAgIGlmICghdGhpcy5mcmVlQ2FsbGJhY2tJbmZvTWVtb3J5QnlMZW5ndGhbYXJnc0xlbmd0aF0gJiYgYXJnc0xlbmd0aCA8IDUpIHtcbiAgICAgICAgICAgIHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2FjaGVBcnJheSA9IHRoaXMuZnJlZUNhbGxiYWNrSW5mb01lbW9yeUJ5TGVuZ3RoW2FyZ3NMZW5ndGhdO1xuICAgICAgICBpZiAoIWNhY2hlQXJyYXkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ckluMzIgPSBidWZmZXJQdHIgPDwgMjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzTGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChhcmdzW2ldIGluc3RhbmNlb2YgQXJyYXkgJiYgYXJnc1tpXS5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVjeWNsZVJlZk1lbW9yeSh0aGlzLmVuZ2luZS51bml0eUFwaS5IRUFQMzJbYnVmZmVyUHRySW4zMiArIGkgKiBBcmd1bWVudFZhbHVlTGVuZ3RoSW4zMiArIDFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDmi43ohJHooovlrprnmoTmnIDlpKfnvJPlrZjkuKrmlbDlpKflsI/jgIIgNTAgLSDlj4LmlbDkuKrmlbAgKiAxMFxuICAgICAgICBpZiAoY2FjaGVBcnJheS5sZW5ndGggPiAoNTAgLSBhcmdzTGVuZ3RoICogMTApKSB7XG4gICAgICAgICAgICB0aGlzLmVuZ2luZS51bml0eUFwaS5fZnJlZShidWZmZXJQdHIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVBcnJheS5wdXNoKGJ1ZmZlclB0cik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogaW50cHRy55qE5qC85byP5Li6aWTlt6bnp7vlm5vkvY1cbiAgICAgKlxuICAgICAqIOWPs+S+p+Wbm+S9je+8jOaYr+S4uuS6huWcqOWPs+Wbm+S9jeWtmOWCqOWPguaVsOeahOW6j+WPt++8jOi/meagt+WPr+S7peeUqOS6juihqOekumNhbGxiYWNraW5mb+WPguaVsOeahGludHB0clxuICAgICAqL1xuICAgIC8vIHN0YXRpYyBHZXRNb2NrUG9pbnRlcihhcmdzOiBhbnlbXSk6IE1vY2tJbnRQdHIge1xuICAgIC8vICAgICBsZXQgaW5kZXg6IG51bWJlcjtcbiAgICAvLyAgICAgaW5kZXggPSB0aGlzLmZyZWVJbmZvc0luZGV4LnBvcCgpO1xuICAgIC8vICAgICAvLyBpbmRleOacgOWwj+S4ujFcbiAgICAvLyAgICAgaWYgKGluZGV4KSB7XG4gICAgLy8gICAgICAgICB0aGlzLmluZm9zW2luZGV4XS5hcmdzID0gYXJncztcbiAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgIGluZGV4ID0gdGhpcy5pbmZvcy5wdXNoKG5ldyBGdW5jdGlvbkNhbGxiYWNrSW5mbyhhcmdzKSkgLSAxO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIHJldHVybiBpbmRleCA8PCA0O1xuICAgIC8vIH1cbiAgICBHZXRNb2NrUG9pbnRlcihhcmdzKSB7XG4gICAgICAgIGNvbnN0IGFyZ3NMZW5ndGggPSBhcmdzLmxlbmd0aDtcbiAgICAgICAgbGV0IGJ1ZmZlclB0ckluOCA9IHRoaXMuYWxsb2NDYWxsYmFja0luZm9NZW1vcnkoYXJnc0xlbmd0aCk7XG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMuZnJlZUluZm9zSW5kZXgucG9wKCk7XG4gICAgICAgIC8vIGluZGV45pyA5bCP5Li6MVxuICAgICAgICBpZiAoaW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuaW5mb3NbaW5kZXhdLmFyZ3MgPSBhcmdzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2gobmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKGFyZ3MpKSAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHVuaXR5QXBpID0gdGhpcy5lbmdpbmUudW5pdHlBcGk7XG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ckluMzIgPSBidWZmZXJQdHJJbjggPj4gMjtcbiAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2J1ZmZlclB0ckluMzJdID0gaW5kZXg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJnc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgYXJnID0gYXJnc1tpXTtcbiAgICAgICAgICAgIC8vIGluaXQgZWFjaCB2YWx1ZVxuICAgICAgICAgICAgY29uc3QganNWYWx1ZVR5cGUgPSBHZXRUeXBlKHRoaXMuZW5naW5lLCBhcmcpO1xuICAgICAgICAgICAgY29uc3QganNWYWx1ZVB0ciA9IGJ1ZmZlclB0ckluMzIgKyBpICogQXJndW1lbnRWYWx1ZUxlbmd0aEluMzIgKyAxO1xuICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHJdID0ganNWYWx1ZVR5cGU7IC8vIGpzdmFsdWV0eXBlXG4gICAgICAgICAgICBpZiAoanNWYWx1ZVR5cGUgPT0gMiB8fCBqc1ZhbHVlVHlwZSA9PSA0IHx8IGpzVmFsdWVUeXBlID09IDUxMikge1xuICAgICAgICAgICAgICAgIC8vIGJpZ2ludOOAgW51bWJlciBvciBkYXRlXG4gICAgICAgICAgICAgICAgJEZpbGxBcmd1bWVudEZpbmFsTnVtYmVyVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIGpzVmFsdWVQdHIgKyAxKTsgLy8gdmFsdWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGpzVmFsdWVUeXBlID09IDY0ICYmIGFyZyBpbnN0YW5jZW9mIEFycmF5ICYmIGFyZy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIG1heWJlIGEgcmVmXG4gICAgICAgICAgICAgICAgdW5pdHlBcGkuSEVBUDMyW2pzVmFsdWVQdHIgKyAxXSA9ICRHZXRBcmd1bWVudEZpbmFsVmFsdWUodGhpcy5lbmdpbmUsIGFyZywganNWYWx1ZVR5cGUsIDApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlZlB0ckluOCA9IHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgM10gPSB0aGlzLmFsbG9jUmVmTWVtb3J5KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVmUHRyID0gcmVmUHRySW44ID4+IDI7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVmVmFsdWVUeXBlID0gdW5pdHlBcGkuSEVBUDMyW3JlZlB0cl0gPSBHZXRUeXBlKHRoaXMuZW5naW5lLCBhcmdbMF0pO1xuICAgICAgICAgICAgICAgIGlmIChyZWZWYWx1ZVR5cGUgPT0gMiB8fCByZWZWYWx1ZVR5cGUgPT0gNCB8fCByZWZWYWx1ZVR5cGUgPT0gNTEyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG51bWJlciBvciBkYXRlXG4gICAgICAgICAgICAgICAgICAgICRGaWxsQXJndW1lbnRGaW5hbE51bWJlclZhbHVlKHRoaXMuZW5naW5lLCBhcmdbMF0sIHJlZlZhbHVlVHlwZSwgcmVmUHRyICsgMSk7IC8vIHZhbHVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbcmVmUHRyICsgMV0gPSAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKHRoaXMuZW5naW5lLCBhcmdbMF0sIHJlZlZhbHVlVHlwZSwgKHJlZlB0ciArIDMpIDw8IDIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbcmVmUHRyICsgNF0gPSBidWZmZXJQdHJJbjg7IC8vIGEgcG9pbnRlciB0byB0aGUgaW5mb1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gb3RoZXJcbiAgICAgICAgICAgICAgICB1bml0eUFwaS5IRUFQMzJbanNWYWx1ZVB0ciArIDFdID0gJEdldEFyZ3VtZW50RmluYWxWYWx1ZSh0aGlzLmVuZ2luZSwgYXJnLCBqc1ZhbHVlVHlwZSwgKGpzVmFsdWVQdHIgKyAzKSA8PCAyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVuaXR5QXBpLkhFQVAzMltqc1ZhbHVlUHRyICsgNF0gPSBidWZmZXJQdHJJbjg7IC8vIGEgcG9pbnRlciB0byB0aGUgaW5mb1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBidWZmZXJQdHJJbjg7XG4gICAgfVxuICAgIC8vIHN0YXRpYyBHZXRCeU1vY2tQb2ludGVyKGludHB0cjogTW9ja0ludFB0cik6IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvIHtcbiAgICAvLyAgICAgcmV0dXJuIHRoaXMuaW5mb3NbaW50cHRyID4+IDRdO1xuICAgIC8vIH1cbiAgICBHZXRCeU1vY2tQb2ludGVyKHB0ckluOCkge1xuICAgICAgICBjb25zdCBwdHJJbjMyID0gcHRySW44ID4+IDI7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xuICAgICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbmRleF07XG4gICAgfVxuICAgIEdldFJldHVyblZhbHVlQW5kUmVjeWNsZShwdHJJbjgpIHtcbiAgICAgICAgY29uc3QgcHRySW4zMiA9IHB0ckluOCA+PiAyO1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZW5naW5lLnVuaXR5QXBpLkhFQVAzMltwdHJJbjMyXTtcbiAgICAgICAgbGV0IGluZm8gPSB0aGlzLmluZm9zW2luZGV4XTtcbiAgICAgICAgbGV0IHJldCA9IGluZm8ucmV0dXJuVmFsdWU7XG4gICAgICAgIHRoaXMucmVjeWNsZUNhbGxiYWNrSW5mb01lbW9yeShwdHJJbjgsIGluZm8uYXJncyk7XG4gICAgICAgIGluZm8ucmVjeWNsZSgpO1xuICAgICAgICB0aGlzLmZyZWVJbmZvc0luZGV4LnB1c2goaW5kZXgpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICBSZWxlYXNlQnlNb2NrSW50UHRyKHB0ckluOCkge1xuICAgICAgICBjb25zdCBwdHJJbjMyID0gcHRySW44ID4+IDI7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdO1xuICAgICAgICBsZXQgaW5mbyA9IHRoaXMuaW5mb3NbaW5kZXhdO1xuICAgICAgICB0aGlzLnJlY3ljbGVDYWxsYmFja0luZm9NZW1vcnkocHRySW44LCBpbmZvLmFyZ3MpO1xuICAgICAgICBpbmZvLnJlY3ljbGUoKTtcbiAgICAgICAgdGhpcy5mcmVlSW5mb3NJbmRleC5wdXNoKGluZGV4KTtcbiAgICB9XG4gICAgR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZVB0ckluOCkge1xuICAgICAgICBsZXQgaGVhcDMyID0gdGhpcy5lbmdpbmUudW5pdHlBcGkuSEVBUDMyO1xuICAgICAgICBjb25zdCBpbmZvUHRySW44ID0gaGVhcDMyWyh2YWx1ZVB0ckluOCA+PiAyKSArIDRdO1xuICAgICAgICBjb25zdCBjYWxsYmFja0luZm9JbmRleCA9IGhlYXAzMltpbmZvUHRySW44ID4+IDJdO1xuICAgICAgICBjb25zdCBhcmdzSW5kZXggPSAodmFsdWVQdHJJbjggLSBpbmZvUHRySW44IC0gNCkgLyAoNCAqIEFyZ3VtZW50VmFsdWVMZW5ndGhJbjMyKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mb3NbY2FsbGJhY2tJbmZvSW5kZXhdLmFyZ3NbYXJnc0luZGV4XTtcbiAgICB9XG59XG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcbmNsYXNzIFJlZiB7XG4gICAgdmFsdWU7XG59XG5leHBvcnRzLlJlZiA9IFJlZjtcbi8qKlxuICog5Luj6KGo5LiA5LiqSlNGdW5jdGlvblxuICovXG5jbGFzcyBKU0Z1bmN0aW9uIHtcbiAgICBfZnVuYztcbiAgICBpZDtcbiAgICBhcmdzID0gW107XG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XG4gICAgY29uc3RydWN0b3IoaWQsIGZ1bmMpIHtcbiAgICAgICAgdGhpcy5fZnVuYyA9IGZ1bmM7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICB9XG4gICAgaW52b2tlKCkge1xuICAgICAgICB2YXIgYXJncyA9IFsuLi50aGlzLmFyZ3NdO1xuICAgICAgICB0aGlzLmFyZ3MubGVuZ3RoID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Z1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxufVxuZXhwb3J0cy5KU0Z1bmN0aW9uID0gSlNGdW5jdGlvbjtcbi8qKlxuICog5Luj6KGo5LiA5LiqSlNPYmplY3RcbiAqL1xuY2xhc3MgSlNPYmplY3Qge1xuICAgIF9vYmo7XG4gICAgaWQ7XG4gICAgY29uc3RydWN0b3IoaWQsIG9iaikge1xuICAgICAgICB0aGlzLl9vYmogPSBvYmo7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICB9XG4gICAgZ2V0T2JqZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb2JqO1xuICAgIH1cbn1cbmV4cG9ydHMuSlNPYmplY3QgPSBKU09iamVjdDtcbmNsYXNzIGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnkge1xuICAgIHN0YXRpYyByZWd1bGFySUQgPSAxO1xuICAgIHN0YXRpYyBmcmVlSUQgPSBbXTtcbiAgICBzdGF0aWMgaWRNYXAgPSBuZXcgV2Vha01hcCgpO1xuICAgIHN0YXRpYyBqc0Z1bmNPck9iamVjdEtWID0ge307XG4gICAgc3RhdGljIGdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jVmFsdWUpIHtcbiAgICAgICAgbGV0IGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5nZXQoZnVuY1ZhbHVlKTtcbiAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5mcmVlSUQubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZCA9IHRoaXMuZnJlZUlELnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlZ3VsYXJJRCsrO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZ1bmMgPSBuZXcgSlNGdW5jdGlvbihpZCwgZnVuY1ZhbHVlKTtcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5zZXQoZnVuY1ZhbHVlLCBpZCk7XG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBmdW5jO1xuICAgICAgICByZXR1cm4gZnVuYztcbiAgICB9XG4gICAgc3RhdGljIGdldE9yQ3JlYXRlSlNPYmplY3Qob2JqKSB7XG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KG9iaik7XG4gICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZnJlZUlELmxlbmd0aCkge1xuICAgICAgICAgICAgaWQgPSB0aGlzLmZyZWVJRC5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZWd1bGFySUQrKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBqc09iamVjdCA9IG5ldyBKU09iamVjdChpZCwgb2JqKTtcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5zZXQob2JqLCBpZCk7XG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBqc09iamVjdDtcbiAgICAgICAgcmV0dXJuIGpzT2JqZWN0O1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0SlNPYmplY3RCeUlkKGlkKSB7XG4gICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xuICAgIH1cbiAgICBzdGF0aWMgcmVtb3ZlSlNPYmplY3RCeUlkKGlkKSB7XG4gICAgICAgIGNvbnN0IGpzT2JqZWN0ID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcbiAgICAgICAgaWYgKCFqc09iamVjdClcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ3JlbW92ZUpTT2JqZWN0QnlJZCBmYWlsZWQ6IGlkIGlzIGludmFsaWQ6ICcgKyBpZCk7XG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZGVsZXRlKGpzT2JqZWN0LmdldE9iamVjdCgpKTtcbiAgICAgICAgZGVsZXRlIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XG4gICAgICAgIHRoaXMuZnJlZUlELnB1c2goaWQpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0SlNGdW5jdGlvbkJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XG4gICAgfVxuICAgIHN0YXRpYyByZW1vdmVKU0Z1bmN0aW9uQnlJZChpZCkge1xuICAgICAgICBjb25zdCBqc0Z1bmMgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xuICAgICAgICBpZiAoIWpzRnVuYylcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oJ3JlbW92ZUpTRnVuY3Rpb25CeUlkIGZhaWxlZDogaWQgaXMgaW52YWxpZDogJyArIGlkKTtcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNGdW5jLl9mdW5jKTtcbiAgICAgICAgZGVsZXRlIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XG4gICAgICAgIHRoaXMuZnJlZUlELnB1c2goaWQpO1xuICAgIH1cbn1cbmV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnk7XG4vKipcbiAqIENTaGFycOWvueixoeiusOW9leihqO+8jOiusOW9leaJgOaciUNTaGFycOWvueixoeW5tuWIhumFjWlkXG4gKiDlkoxwdWVydHMuZGxs5omA5YGa55qE5LiA5qC3XG4gKi9cbmNsYXNzIENTaGFycE9iamVjdE1hcCB7XG4gICAgY2xhc3NlcyA9IFtudWxsXTtcbiAgICBuYXRpdmVPYmplY3RLViA9IG5ldyBNYXAoKTtcbiAgICAvLyBwcml2YXRlIG5hdGl2ZU9iamVjdEtWOiB7IFtvYmplY3RJRDogQ1NJZGVudGlmaWVyXTogV2Vha1JlZjxhbnk+IH0gPSB7fTtcbiAgICAvLyBwcml2YXRlIGNzSURXZWFrTWFwOiBXZWFrTWFwPGFueSwgQ1NJZGVudGlmaWVyPiA9IG5ldyBXZWFrTWFwKCk7XG4gICAgbmFtZXNUb0NsYXNzZXNJRCA9IHt9O1xuICAgIGNsYXNzSURXZWFrTWFwID0gbmV3IFdlYWtNYXAoKTtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZENhbGxlZCcsIHRoaXMuYWRkQ2FsbGVkKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZW1vdmVDYWxsZWQnLCB0aGlzLnJlbW92ZUNhbGxlZCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnd3InLCB0aGlzLm5hdGl2ZU9iamVjdEtWLnNpemUpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG4gICAgX21lbW9yeURlYnVnID0gZmFsc2U7XG4gICAgYWRkQ2FsbGVkID0gMDtcbiAgICByZW1vdmVDYWxsZWQgPSAwO1xuICAgIGFkZChjc0lELCBvYmopIHtcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgdGhpcy5hZGRDYWxsZWQrKztcbiAgICAgICAgLy8gdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcbiAgICAgICAgLy8gdGhpcy5jc0lEV2Vha01hcC5zZXQob2JqLCBjc0lEKTtcbiAgICAgICAgdGhpcy5uYXRpdmVPYmplY3RLVi5zZXQoY3NJRCwgY3JlYXRlV2Vha1JlZihvYmopKTtcbiAgICAgICAgb2JqWyckY3NpZCddID0gY3NJRDtcbiAgICB9XG4gICAgcmVtb3ZlKGNzSUQpIHtcbiAgICAgICAgdGhpcy5fbWVtb3J5RGVidWcgJiYgdGhpcy5yZW1vdmVDYWxsZWQrKztcbiAgICAgICAgLy8gZGVsZXRlIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF07XG4gICAgICAgIHRoaXMubmF0aXZlT2JqZWN0S1YuZGVsZXRlKGNzSUQpO1xuICAgIH1cbiAgICBmaW5kT3JBZGRPYmplY3QoY3NJRCwgY2xhc3NJRCkge1xuICAgICAgICBsZXQgcmV0ID0gdGhpcy5uYXRpdmVPYmplY3RLVi5nZXQoY3NJRCk7XG4gICAgICAgIC8vIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdO1xuICAgICAgICBpZiAocmV0ICYmIChyZXQgPSByZXQuZGVyZWYoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0ID0gdGhpcy5jbGFzc2VzW2NsYXNzSURdLmNyZWF0ZUZyb21DUyhjc0lEKTtcbiAgICAgICAgLy8gdGhpcy5hZGQoY3NJRCwgcmV0KTsg5p6E6YCg5Ye95pWw6YeM6LSf6LSj6LCD55SoXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIGdldENTSWRlbnRpZmllckZyb21PYmplY3Qob2JqKSB7XG4gICAgICAgIC8vIHJldHVybiB0aGlzLmNzSURXZWFrTWFwLmdldChvYmopO1xuICAgICAgICByZXR1cm4gb2JqID8gb2JqLiRjc2lkIDogMDtcbiAgICB9XG59XG5leHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IENTaGFycE9iamVjdE1hcDtcbjtcbnZhciBkZXN0cnVjdG9ycyA9IHt9O1xuZXhwb3J0cy5nbG9iYWwgPSBnbG9iYWwgPSBnbG9iYWwgfHwgZ2xvYmFsVGhpcyB8fCB3aW5kb3c7XG5nbG9iYWwuZ2xvYmFsID0gZ2xvYmFsO1xuY29uc3QgY3JlYXRlV2Vha1JlZiA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgV1hXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiV2Vha1JlZiBpcyBub3QgZGVmaW5lZC4gbWF5YmUgeW91IHNob3VsZCB1c2UgbmV3ZXIgZW52aXJvbm1lbnRcIik7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGRlcmVmKCkgeyByZXR1cm4gb2JqOyB9IH07XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUud2FybihcInVzaW5nIFdYV2Vha1JlZlwiKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgV1hXZWFrUmVmKG9iaik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBuZXcgV2Vha1JlZihvYmopO1xuICAgIH07XG59KSgpO1xuZXhwb3J0cy5jcmVhdGVXZWFrUmVmID0gY3JlYXRlV2Vha1JlZjtcbmNsYXNzIEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9jayB7XG4gICAgX2hhbmRsZXI7XG4gICAgcmVmcyA9IFtdO1xuICAgIGhlbGRzID0gW107XG4gICAgYXZhaWxhYmxlSW5kZXggPSBbXTtcbiAgICBjb25zdHJ1Y3RvcihoYW5kbGVyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIkZpbmFsaXphdGlvblJlZ2lzdGVyIGlzIG5vdCBkZWZpbmVkLiB1c2luZyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2tcIik7XG4gICAgICAgIGdsb2JhbC5fcHVlcnRzX3JlZ2lzdHJ5ID0gdGhpcztcbiAgICAgICAgdGhpcy5faGFuZGxlciA9IGhhbmRsZXI7XG4gICAgfVxuICAgIHJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLmF2YWlsYWJsZUluZGV4Lmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmF2YWlsYWJsZUluZGV4LnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5yZWZzW2luZGV4XSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcbiAgICAgICAgICAgIHRoaXMuaGVsZHNbaW5kZXhdID0gaGVsZFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZWZzLnB1c2goY3JlYXRlV2Vha1JlZihvYmopKTtcbiAgICAgICAgICAgIHRoaXMuaGVsZHMucHVzaChoZWxkVmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIOa4hemZpOWPr+iDveW3sue7j+WkseaViOeahFdlYWtSZWZcbiAgICAgKi9cbiAgICBpdGVyYXRlUG9zaXRpb24gPSAwO1xuICAgIGNsZWFudXAocGFydCA9IDEpIHtcbiAgICAgICAgY29uc3Qgc3RlcENvdW50ID0gdGhpcy5yZWZzLmxlbmd0aCAvIHBhcnQ7XG4gICAgICAgIGxldCBpID0gdGhpcy5pdGVyYXRlUG9zaXRpb247XG4gICAgICAgIGZvciAobGV0IGN1cnJlbnRTdGVwID0gMDsgaSA8IHRoaXMucmVmcy5sZW5ndGggJiYgY3VycmVudFN0ZXAgPCBzdGVwQ291bnQ7IGkgPSAoaSA9PSB0aGlzLnJlZnMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMSksIGN1cnJlbnRTdGVwKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlZnNbaV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlZnNbaV0uZGVyZWYoKSkge1xuICAgICAgICAgICAgICAgIC8vIOebruWJjeayoeacieWGheWtmOaVtOeQhuiDveWKm++8jOWmguaenOa4uOaIj+S4reacn3JlZuW+iOWkmuS9huWQjuacn+WwkeS6hu+8jOi/memHjOWwseS8mueZvei0uemBjeWOhuasoeaVsFxuICAgICAgICAgICAgICAgIC8vIOS9humBjeWOhuS5n+WPquaYr+S4gOWPpT095ZKMY29udGludWXvvIzmtarotLnlvbHlk43kuI3lpKdcbiAgICAgICAgICAgICAgICB0aGlzLmF2YWlsYWJsZUluZGV4LnB1c2goaSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVyKHRoaXMuaGVsZHNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLml0ZXJhdGVQb3NpdGlvbiA9IGk7XG4gICAgfVxufVxudmFyIHJlZ2lzdHJ5ID0gbnVsbDtcbmZ1bmN0aW9uIGluaXQoKSB7XG4gICAgcmVnaXN0cnkgPSBuZXcgKHR5cGVvZiBGaW5hbGl6YXRpb25SZWdpc3RyeSA9PSAndW5kZWZpbmVkJyA/IEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9jayA6IEZpbmFsaXphdGlvblJlZ2lzdHJ5KShmdW5jdGlvbiAoaGVsZFZhbHVlKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbm5vdCBmaW5kIGRlc3RydWN0b3IgZm9yIFwiICsgaGVsZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoLS1jYWxsYmFjay5yZWYgPT0gMCkge1xuICAgICAgICAgICAgZGVsZXRlIGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XG4gICAgICAgICAgICBjYWxsYmFjayhoZWxkVmFsdWUpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5mdW5jdGlvbiBPbkZpbmFsaXplKG9iaiwgaGVsZFZhbHVlLCBjYWxsYmFjaykge1xuICAgIGlmICghcmVnaXN0cnkpIHtcbiAgICAgICAgaW5pdCgpO1xuICAgIH1cbiAgICBsZXQgb3JpZ2luQ2FsbGJhY2sgPSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xuICAgIGlmIChvcmlnaW5DYWxsYmFjaykge1xuICAgICAgICAvLyBXZWFrUmVm5YaF5a656YeK5pS+5pe25py65Y+v6IO95q+UZmluYWxpemF0aW9uUmVnaXN0cnnnmoTop6blj5Hmm7Tml6nvvIzliY3pnaLlpoLmnpzlj5HnjrB3ZWFrUmVm5Li656m65Lya6YeN5paw5Yib5bu65a+56LGhXG4gICAgICAgIC8vIOS9huS5i+WJjeWvueixoeeahGZpbmFsaXphdGlvblJlZ2lzdHJ55pyA57uI5Y+I6IKv5a6a5Lya6Kem5Y+R44CCXG4gICAgICAgIC8vIOaJgOS7peWmguaenOmBh+WIsOi/meS4quaDheWGte+8jOmcgOimgee7mWRlc3RydWN0b3LliqDorqHmlbBcbiAgICAgICAgKytvcmlnaW5DYWxsYmFjay5yZWY7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjYWxsYmFjay5yZWYgPSAxO1xuICAgICAgICBkZXN0cnVjdG9yc1toZWxkVmFsdWVdID0gY2FsbGJhY2s7XG4gICAgfVxuICAgIHJlZ2lzdHJ5LnJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKTtcbn1cbmV4cG9ydHMuT25GaW5hbGl6ZSA9IE9uRmluYWxpemU7XG5jbGFzcyBQdWVydHNKU0VuZ2luZSB7XG4gICAgY3NoYXJwT2JqZWN0TWFwO1xuICAgIGZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcbiAgICB1bml0eUFwaTtcbiAgICBsYXN0UmV0dXJuQ1NSZXN1bHQgPSBudWxsO1xuICAgIGxhc3RFeGNlcHRpb24gPSBudWxsO1xuICAgIC8vIOi/meS4pOS4quaYr1B1ZXJ0c+eUqOeahOeahOecn+ato+eahENTaGFycOWHveaVsOaMh+mSiFxuICAgIEdldEpTQXJndW1lbnRzQ2FsbGJhY2s7XG4gICAgZ2VuZXJhbERlc3RydWN0b3I7XG4gICAgY29uc3RydWN0b3IoY3RvclBhcmFtKSB7XG4gICAgICAgIHRoaXMuY3NoYXJwT2JqZWN0TWFwID0gbmV3IENTaGFycE9iamVjdE1hcCgpO1xuICAgICAgICB0aGlzLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IG5ldyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIodGhpcyk7XG4gICAgICAgIGNvbnN0IHsgVVRGOFRvU3RyaW5nLCBfbWFsbG9jLCBfbWVtY3B5LCBfZnJlZSwgX3NldFRlbXBSZXQwLCBzdHJpbmdUb1VURjgsIGxlbmd0aEJ5dGVzVVRGOCwgdW5pdHlJbnN0YW5jZSB9ID0gY3RvclBhcmFtO1xuICAgICAgICB0aGlzLnVuaXR5QXBpID0ge1xuICAgICAgICAgICAgVVRGOFRvU3RyaW5nLFxuICAgICAgICAgICAgX21hbGxvYyxcbiAgICAgICAgICAgIF9tZW1jcHksXG4gICAgICAgICAgICBfZnJlZSxcbiAgICAgICAgICAgIF9zZXRUZW1wUmV0MCxcbiAgICAgICAgICAgIHN0cmluZ1RvVVRGOCxcbiAgICAgICAgICAgIGxlbmd0aEJ5dGVzVVRGOCxcbiAgICAgICAgICAgIENhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrOiB1bml0eUluc3RhbmNlLmFzbS5DYWxsQ1NoYXJwRnVuY3Rpb25DYWxsYmFjayxcbiAgICAgICAgICAgIENhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrOiB1bml0eUluc3RhbmNlLmFzbS5DYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayxcbiAgICAgICAgICAgIENhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2s6IHVuaXR5SW5zdGFuY2UuYXNtLkNhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2ssXG4gICAgICAgICAgICBnZXQgSEVBUDMyKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bml0eUluc3RhbmNlLkhFQVAzMjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXQgSEVBUDgoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXR5SW5zdGFuY2UuSEVBUDg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0IEhFQVBVOCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5pdHlJbnN0YW5jZS5IRUFQVTg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0IEhFQVBGMzIoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXR5SW5zdGFuY2UuSEVBUEYzMjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXQgSEVBUEY2NCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5pdHlJbnN0YW5jZS5IRUFQRjY0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgZ2xvYmFsLl9fdGdqc0V2YWxTY3JpcHQgPSB0eXBlb2YgZXZhbCA9PSBcInVuZGVmaW5lZFwiID8gKCkgPT4geyB9IDogZXZhbDtcbiAgICAgICAgZ2xvYmFsLl9fdGdqc1NldFByb21pc2VSZWplY3RDYWxsYmFjayA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3eCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHd4Lm9uVW5oYW5kbGVkUmVqZWN0aW9uKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5oYW5kbGVkcmVqZWN0aW9uXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZ2xvYmFsLl9fcHVlcnRzR2V0TGFzdEV4Y2VwdGlvbiA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhc3RFeGNlcHRpb247XG4gICAgICAgIH07XG4gICAgfVxuICAgIEpTU3RyaW5nVG9DU1N0cmluZyhyZXR1cm5TdHIsIC8qKiBvdXQgaW50ICovIGxlbmd0aE9mZnNldCkge1xuICAgICAgICBpZiAocmV0dXJuU3RyID09PSBudWxsIHx8IHJldHVyblN0ciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYnl0ZUNvdW50ID0gdGhpcy51bml0eUFwaS5sZW5ndGhCeXRlc1VURjgocmV0dXJuU3RyKTtcbiAgICAgICAgc2V0T3V0VmFsdWUzMih0aGlzLCBsZW5ndGhPZmZzZXQsIGJ5dGVDb3VudCk7XG4gICAgICAgIHZhciBidWZmZXIgPSB0aGlzLnVuaXR5QXBpLl9tYWxsb2MoYnl0ZUNvdW50ICsgMSk7XG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgYnVmZmVyLCBieXRlQ291bnQgKyAxKTtcbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICB9XG4gICAgbWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgZnVuY3Rpb25QdHIsIGNhbGxiYWNrSWR4KSB7XG4gICAgICAgIC8vIOS4jeiDveeUqOeureWktOWHveaVsO+8geatpOWkhOi/lOWbnueahOWHveaVsOS8mui1i+WAvOWIsOWFt+S9k+eahGNsYXNz5LiK77yM5YW2dGhpc+aMh+mSiOacieWQq+S5ieOAglxuICAgICAgICBjb25zdCBlbmdpbmUgPSB0aGlzO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIGxldCBjYWxsYmFja0luZm9QdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIFxuICAgICAgICAgICAgICAgIC8vIGdldEludFB0ck1hbmFnZXIoKS5HZXRQb2ludGVyRm9ySlNWYWx1ZSh0aGlzKSxcbiAgICAgICAgICAgICAgICBpc1N0YXRpYyA/IDAgOiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodGhpcyksIGNhbGxiYWNrSW5mb1B0ciwgYXJncy5sZW5ndGgsIGNhbGxiYWNrSWR4KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRSZXR1cm5WYWx1ZUFuZFJlY3ljbGUoY2FsbGJhY2tJbmZvUHRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5SZWxlYXNlQnlNb2NrSW50UHRyKGNhbGxiYWNrSW5mb1B0cik7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2FsbENTaGFycEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xuICAgICAgICB0aGlzLnVuaXR5QXBpLkNhbGxDU2hhcnBGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBzZWxmUHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xuICAgIH1cbiAgICBjYWxsQ1NoYXJwQ29uc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVuaXR5QXBpLkNhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xuICAgIH1cbiAgICBjYWxsQ1NoYXJwRGVzdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBjYWxsYmFja0lkeCkge1xuICAgICAgICB0aGlzLnVuaXR5QXBpLkNhbGxDU2hhcnBEZXN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGNhbGxiYWNrSWR4KTtcbiAgICB9XG59XG5leHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gUHVlcnRzSlNFbmdpbmU7XG5mdW5jdGlvbiBHZXRUeXBlKGVuZ2luZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgaWYgKGlzQmlnSW50KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gMjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gNDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gODtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgcmV0dXJuIDE2O1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIDI1NjtcbiAgICB9XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICByZXR1cm4gNTEyO1xuICAgIH1cbiAgICAvLyBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkgeyByZXR1cm4gMTI4IH1cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICByZXR1cm4gNjQ7XG4gICAgfVxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IHZhbHVlIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICByZXR1cm4gMTAyNDtcbiAgICB9XG4gICAgaWYgKGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIDMyO1xuICAgIH1cbiAgICByZXR1cm4gNjQ7XG59XG5leHBvcnRzLkdldFR5cGUgPSBHZXRUeXBlO1xuZnVuY3Rpb24gbWFrZUJpZ0ludChsb3csIGhpZ2gpIHtcbiAgICByZXR1cm4gKEJpZ0ludChoaWdoKSA8PCAzMm4pIHwgQmlnSW50KGxvdyA+Pj4gMCk7XG59XG5leHBvcnRzLm1ha2VCaWdJbnQgPSBtYWtlQmlnSW50O1xuZnVuY3Rpb24gc2V0T3V0VmFsdWUzMihlbmdpbmUsIHZhbHVlUHRyLCB2YWx1ZSkge1xuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbdmFsdWVQdHIgPj4gMl0gPSB2YWx1ZTtcbn1cbmV4cG9ydHMuc2V0T3V0VmFsdWUzMiA9IHNldE91dFZhbHVlMzI7XG5mdW5jdGlvbiBzZXRPdXRWYWx1ZTgoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDhbdmFsdWVQdHJdID0gdmFsdWU7XG59XG5leHBvcnRzLnNldE91dFZhbHVlOCA9IHNldE91dFZhbHVlODtcbmZ1bmN0aW9uIGlzQmlnSW50KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQmlnSW50IHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2JpZ2ludCc7XG59XG5leHBvcnRzLmlzQmlnSW50ID0gaXNCaWdJbnQ7XG5mdW5jdGlvbiByZXR1cm5CaWdJbnQoZW5naW5lLCB2YWx1ZSkge1xuICAgIGVuZ2luZS51bml0eUFwaS5fc2V0VGVtcFJldDAoTnVtYmVyKHZhbHVlID4+IDMybikpOyAvLyBoaWdoXG4gICAgcmV0dXJuIE51bWJlcih2YWx1ZSAmIDB4ZmZmZmZmZmZuKTsgLy8gbG93XG59XG5leHBvcnRzLnJldHVybkJpZ0ludCA9IHJldHVybkJpZ0ludDtcbmZ1bmN0aW9uIHdyaXRlQmlnSW50KGVuZ2luZSwgcHRySW4zMiwgdmFsdWUpIHtcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdID0gTnVtYmVyKHZhbHVlICYgMHhmZmZmZmZmZm4pOyAvLyBsb3dcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzIgKyAxXSA9IE51bWJlcih2YWx1ZSA+PiAzMm4pOyAvLyBoaWdoXG59XG5jb25zdCB0bXBJbnQzQXJyID0gbmV3IEludDMyQXJyYXkoMik7XG5jb25zdCB0bXBGbG9hdDY0QXJyID0gbmV3IEZsb2F0NjRBcnJheSh0bXBJbnQzQXJyLmJ1ZmZlcik7XG5mdW5jdGlvbiB3cml0ZU51bWJlcihlbmdpbmUsIHB0ckluMzIsIHZhbHVlKSB7XG4gICAgLy8gbnVtYmVyIGluIGpzIGlzIGRvdWJsZVxuICAgIHRtcEZsb2F0NjRBcnJbMF0gPSB2YWx1ZTtcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzJdID0gdG1wSW50M0FyclswXTtcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3B0ckluMzIgKyAxXSA9IHRtcEludDNBcnJbMV07XG59XG5mdW5jdGlvbiAkRmlsbEFyZ3VtZW50RmluYWxOdW1iZXJWYWx1ZShlbmdpbmUsIHZhbCwganNWYWx1ZVR5cGUsIHZhbFB0ckluMzIpIHtcbiAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3dpdGNoIChqc1ZhbHVlVHlwZSkge1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgd3JpdGVCaWdJbnQoZW5naW5lLCB2YWxQdHJJbjMyLCB2YWwpO1xuICAgICAgICAgICAgICAgIC8vIFZhbHVlSXNCaWdJbnTlj6/mja7mraTliKTmlq1cbiAgICAgICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3ZhbFB0ckluMzIgKyAyXSA9IDg7IC8qbG9uZyA9PSA4Ynl0ZSovXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgd3JpdGVOdW1iZXIoZW5naW5lLCB2YWxQdHJJbjMyLCArdmFsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDUxMjpcbiAgICAgICAgICAgIHdyaXRlTnVtYmVyKGVuZ2luZSwgdmFsUHRySW4zMiwgdmFsLmdldFRpbWUoKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59XG5mdW5jdGlvbiAkR2V0QXJndW1lbnRGaW5hbFZhbHVlKGVuZ2luZSwgdmFsLCBqc1ZhbHVlVHlwZSwgbGVuZ3RoT2Zmc2V0KSB7XG4gICAgaWYgKCFqc1ZhbHVlVHlwZSlcbiAgICAgICAganNWYWx1ZVR5cGUgPSBHZXRUeXBlKGVuZ2luZSwgdmFsKTtcbiAgICBzd2l0Y2ggKGpzVmFsdWVUeXBlKSB7XG4gICAgICAgIGNhc2UgODogcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcodmFsLCBsZW5ndGhPZmZzZXQpO1xuICAgICAgICBjYXNlIDE2OiByZXR1cm4gK3ZhbDtcbiAgICAgICAgY2FzZSAzMjogcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdCh2YWwpO1xuICAgICAgICBjYXNlIDY0OiByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KHZhbCkuaWQ7XG4gICAgICAgIGNhc2UgMTI4OiByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KHZhbCkuaWQ7XG4gICAgICAgIGNhc2UgMjU2OiByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24odmFsKS5pZDtcbiAgICAgICAgY2FzZSAxMDI0OiB7XG4gICAgICAgICAgICBsZXQgcHRyID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2ModmFsLmJ5dGVMZW5ndGgpO1xuICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVBVOC5zZXQodmFsLCBwdHIpO1xuICAgICAgICAgICAgc2V0T3V0VmFsdWUzMihlbmdpbmUsIGxlbmd0aE9mZnNldCwgdmFsLmJ5dGVMZW5ndGgpO1xuICAgICAgICAgICAgcmV0dXJuIHB0cjtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWxpYnJhcnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcbi8vIGV4cG9ydCBmdW5jdGlvbiBHZXROdW1iZXJGcm9tVmFsdWUoZW5naW5lOiBQdWVydHNKU0VuZ2luZSwgaXNvbGF0ZTogSW50UHRyLCB2YWx1ZTogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCk6IG51bWJlciB7XG4vLyAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4vLyB9XG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0RGF0ZUZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogbnVtYmVyIHtcbi8vICAgICByZXR1cm4gKGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSkgYXMgRGF0ZSkuZ2V0VGltZSgpO1xuLy8gfVxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldFN0cmluZ0Zyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCAvKm91dCBpbnQgKi9sZW5ndGhPZmZzZXQ6IG51bWJlciwgaXNCeVJlZjogYm9vbCk6IG51bWJlciB7XG4vLyAgICAgdmFyIHJldHVyblN0ciA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxzdHJpbmc+KHZhbHVlKTtcbi8vICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhyZXR1cm5TdHIsIGxlbmd0aE9mZnNldCk7XG4vLyB9XG4vLyBleHBvcnQgZnVuY3Rpb24gR2V0Qm9vbGVhbkZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogYm9vbGVhbiB7XG4vLyAgICAgcmV0dXJuIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4vLyB9XG4vLyBleHBvcnQgZnVuY3Rpb24gVmFsdWVJc0JpZ0ludChlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKTogYm9vbGVhbiB7XG4vLyAgICAgdmFyIGJpZ2ludCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxhbnk+KHZhbHVlKTtcbi8vICAgICByZXR1cm4gYmlnaW50IGluc3RhbmNlb2YgQmlnSW50O1xuLy8gfVxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEJpZ0ludEZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XG4vLyAgICAgdmFyIGJpZ2ludCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxhbnk+KHZhbHVlKTtcbi8vICAgICByZXR1cm4gYmlnaW50O1xuLy8gfVxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldE9iamVjdEZyb21WYWx1ZShlbmdpbmU6IFB1ZXJ0c0pTRW5naW5lLCBpc29sYXRlOiBJbnRQdHIsIHZhbHVlOiBNb2NrSW50UHRyLCBpc0J5UmVmOiBib29sKSB7XG4vLyAgICAgdmFyIG5hdGl2ZU9iamVjdCA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4vLyAgICAgcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChuYXRpdmVPYmplY3QpO1xuLy8gfVxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEZ1bmN0aW9uRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpOiBKU0Z1bmN0aW9uUHRyIHtcbi8vICAgICB2YXIgZnVuYyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjwoLi4uYXJnczogYW55W10pID0+IGFueT4odmFsdWUpO1xuLy8gICAgIHZhciBqc2Z1bmMgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jKTtcbi8vICAgICByZXR1cm4ganNmdW5jLmlkO1xuLy8gfVxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEpTT2JqZWN0RnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIGlzQnlSZWY6IGJvb2wpIHtcbi8vICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyPCguLi5hcmdzOiBhbnlbXSkgPT4gYW55Pih2YWx1ZSk7XG4vLyAgICAgdmFyIGpzb2JqID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KG9iaik7XG4vLyAgICAgcmV0dXJuIGpzb2JqLmlkO1xuLy8gfVxuLy8gZXhwb3J0IGZ1bmN0aW9uIEdldEFycmF5QnVmZmVyRnJvbVZhbHVlKGVuZ2luZTogUHVlcnRzSlNFbmdpbmUsIGlzb2xhdGU6IEludFB0ciwgdmFsdWU6IE1vY2tJbnRQdHIsIC8qb3V0IGludCAqL2xlbmd0aE9mZnNldDogYW55LCBpc091dDogYm9vbCkge1xuLy8gICAgIHZhciBhYiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cjxBcnJheUJ1ZmZlcj4odmFsdWUpO1xuLy8gICAgIGlmIChhYiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbi8vICAgICAgICAgYWIgPSBhYi5idWZmZXI7XG4vLyAgICAgfVxuLy8gICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcbi8vICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDguc2V0KG5ldyBJbnQ4QXJyYXkoYWIpLCBwdHIpO1xuLy8gICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbbGVuZ3RoT2Zmc2V0ID4+IDJdID0gYWIuYnl0ZUxlbmd0aDtcbi8vICAgICBzZXRPdXRWYWx1ZTMyKGVuZ2luZSwgbGVuZ3RoT2Zmc2V0LCBhYi5ieXRlTGVuZ3RoKTtcbi8vICAgICByZXR1cm4gcHRyO1xuLy8gfVxuLyoqXG4gKiBtaXhpblxuICogSlPosIPnlKhDI+aXtu+8jEMj5L6n6I635Y+WSlPosIPnlKjlj4LmlbDnmoTlgLxcbiAqXG4gKiBAcGFyYW0gZW5naW5lXG4gKiBAcmV0dXJuc1xuICovXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSShlbmdpbmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAvKioqKioqKioqKirov5npg6jliIbnjrDlnKjpg73mmK9DKyvlrp7njrDnmoQqKioqKioqKioqKiovXG4gICAgICAgIC8vIEdldE51bWJlckZyb21WYWx1ZTogR2V0TnVtYmVyRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcbiAgICAgICAgLy8gR2V0RGF0ZUZyb21WYWx1ZTogR2V0RGF0ZUZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXG4gICAgICAgIC8vIEdldFN0cmluZ0Zyb21WYWx1ZTogR2V0U3RyaW5nRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcbiAgICAgICAgLy8gR2V0Qm9vbGVhbkZyb21WYWx1ZTogR2V0Qm9vbGVhbkZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXG4gICAgICAgIC8vIFZhbHVlSXNCaWdJbnQ6IFZhbHVlSXNCaWdJbnQuYmluZChudWxsLCBlbmdpbmUpLFxuICAgICAgICAvLyBHZXRCaWdJbnRGcm9tVmFsdWU6IEdldEJpZ0ludEZyb21WYWx1ZS5iaW5kKG51bGwsIGVuZ2luZSksXG4gICAgICAgIC8vIEdldE9iamVjdEZyb21WYWx1ZTogR2V0T2JqZWN0RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcbiAgICAgICAgLy8gR2V0RnVuY3Rpb25Gcm9tVmFsdWU6IEdldEZ1bmN0aW9uRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcbiAgICAgICAgLy8gR2V0SlNPYmplY3RGcm9tVmFsdWU6IEdldEpTT2JqZWN0RnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcbiAgICAgICAgLy8gR2V0QXJyYXlCdWZmZXJGcm9tVmFsdWU6IEdldEFycmF5QnVmZmVyRnJvbVZhbHVlLmJpbmQobnVsbCwgZW5naW5lKSxcbiAgICAgICAgLy8gR2V0QXJndW1lbnRUeXBlOiBmdW5jdGlvbiAoaXNvbGF0ZTogSW50UHRyLCBpbmZvOiBNb2NrSW50UHRyLCBpbmRleDogaW50LCBpc0J5UmVmOiBib29sKSB7XG4gICAgICAgIC8vICAgICB2YXIgdmFsdWUgPSBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvLCBlbmdpbmUpLmFyZ3NbaW5kZXhdO1xuICAgICAgICAvLyAgICAgcmV0dXJuIEdldFR5cGUoZW5naW5lLCB2YWx1ZSk7XG4gICAgICAgIC8vIH0sXG4gICAgICAgIC8vIC8qKlxuICAgICAgICAvLyAgKiDkuLpjI+S+p+aPkOS+m+S4gOS4quiOt+WPlmNhbGxiYWNraW5mb+mHjGpzdmFsdWXnmoRpbnRwdHLnmoTmjqXlj6NcbiAgICAgICAgLy8gICog5bm25LiN5piv5b6X55qE5Yiw6L+Z5LiqYXJndW1lbnTnmoTlgLxcbiAgICAgICAgLy8gICpcbiAgICAgICAgLy8gICog6K+l5o6l5Y+j5Y+q5pyJ5L2N6L+Q566X77yM55SxQysr5a6e546wXG4gICAgICAgIC8vICAqL1xuICAgICAgICAvLyBHZXRBcmd1bWVudFZhbHVlLyppbkNhbGxiYWNrSW5mbyovOiBmdW5jdGlvbiAoaW5mb3B0cjogTW9ja0ludFB0ciwgaW5kZXg6IGludCkge1xuICAgICAgICAvLyAgICAgcmV0dXJuIGluZm9wdHIgfCBpbmRleDtcbiAgICAgICAgLy8gfSxcbiAgICAgICAgLy8gR2V0SnNWYWx1ZVR5cGU6IGZ1bmN0aW9uIChpc29sYXRlOiBJbnRQdHIsIHZhbDogTW9ja0ludFB0ciwgaXNCeVJlZjogYm9vbCkge1xuICAgICAgICAvLyAgICAgLy8gcHVibGljIGVudW0gSnNWYWx1ZVR5cGVcbiAgICAgICAgLy8gICAgIC8vIHtcbiAgICAgICAgLy8gICAgIC8vICAgICBOdWxsT3JVbmRlZmluZWQgPSAxLFxuICAgICAgICAvLyAgICAgLy8gICAgIEJpZ0ludCA9IDIsXG4gICAgICAgIC8vICAgICAvLyAgICAgTnVtYmVyID0gNCxcbiAgICAgICAgLy8gICAgIC8vICAgICBTdHJpbmcgPSA4LFxuICAgICAgICAvLyAgICAgLy8gICAgIEJvb2xlYW4gPSAxNixcbiAgICAgICAgLy8gICAgIC8vICAgICBOYXRpdmVPYmplY3QgPSAzMixcbiAgICAgICAgLy8gICAgIC8vICAgICBKc09iamVjdCA9IDY0LFxuICAgICAgICAvLyAgICAgLy8gICAgIEFycmF5ID0gMTI4LFxuICAgICAgICAvLyAgICAgLy8gICAgIEZ1bmN0aW9uID0gMjU2LFxuICAgICAgICAvLyAgICAgLy8gICAgIERhdGUgPSA1MTIsXG4gICAgICAgIC8vICAgICAvLyAgICAgQXJyYXlCdWZmZXIgPSAxMDI0LFxuICAgICAgICAvLyAgICAgLy8gICAgIFVua25vdyA9IDIwNDgsXG4gICAgICAgIC8vICAgICAvLyAgICAgQW55ID0gTnVsbE9yVW5kZWZpbmVkIHwgQmlnSW50IHwgTnVtYmVyIHwgU3RyaW5nIHwgQm9vbGVhbiB8IE5hdGl2ZU9iamVjdCB8IEFycmF5IHwgRnVuY3Rpb24gfCBEYXRlIHwgQXJyYXlCdWZmZXIsXG4gICAgICAgIC8vICAgICAvLyB9O1xuICAgICAgICAvLyAgICAgdmFyIHZhbHVlOiBhbnkgPSBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWwsIGVuZ2luZSk7XG4gICAgICAgIC8vICAgICByZXR1cm4gR2V0VHlwZShlbmdpbmUsIHZhbHVlKTtcbiAgICAgICAgLy8gfSxcbiAgICAgICAgLyoqKioqKioqKioq5Lul5LiK546w5Zyo6YO95pivQysr5a6e546w55qEKioqKioqKioqKioqL1xuICAgICAgICBHZXRUeXBlSWRGcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBpZiAoaXNCeVJlZikge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBvYmogPSBvYmpbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdHlwZWlkID0gMDtcbiAgICAgICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgIHR5cGVpZCA9IG9iai5fZnVuY1tcIiRjaWRcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSBvYmpbXCIkY2lkXCJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0eXBlaWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBmaW5kIHR5cGVpZCBmb3InICsgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHR5cGVpZDtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kR2V0RnJvbUpTQXJndW1lbnRBUEk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1nZXRGcm9tSlNBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xuLyoqXG4gKiBtaXhpblxuICogQyPosIPnlKhKU+aXtu+8jOiOt+WPlkpT5Ye95pWw6L+U5Zue5YC8XG4gKlxuICog5Y6f5pyJ55qEcmVzdWx0SW5mb+iuvuiuoeWHuuadpeWPquaYr+S4uuS6huiuqeWkmmlzb2xhdGXml7bog73lnKjkuI3lkIznmoRpc29sYXRl6YeM5L+d5oyB5LiN5ZCM55qEcmVzdWx0XG4gKiDlnKhXZWJHTOaooeW8j+S4i+ayoeaciei/meS4queDpuaBvO+8jOWboOatpOebtOaOpeeUqGVuZ2luZeeahOWNs+WPr1xuICogcmVzdWx0SW5mb+WbuuWumuS4ujEwMjRcbiAqXG4gKiBAcGFyYW0gZW5naW5lXG4gKiBAcmV0dXJuc1xuICovXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRHZXRGcm9tSlNSZXR1cm5BUEkoZW5naW5lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgR2V0TnVtYmVyRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xuICAgICAgICB9LFxuICAgICAgICBHZXREYXRlRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0LmdldFRpbWUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0U3RyaW5nRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQsIGxlbmd0aCk7XG4gICAgICAgIH0sXG4gICAgICAgIEdldEJvb2xlYW5Gcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XG4gICAgICAgIH0sXG4gICAgICAgIFJlc3VsdElzQmlnSW50OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuaXNCaWdJbnQpKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xuICAgICAgICB9LFxuICAgICAgICBHZXRCaWdJbnRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgLy8gcHVlcnRzIGNvcmUgdjIuMC405byA5aeL5pSv5oyBXG4gICAgICAgICAgICByZXR1cm4gKDAsIGxpYnJhcnlfMS5yZXR1cm5CaWdJbnQpKGVuZ2luZSwgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XG4gICAgICAgIH0sXG4gICAgICAgIEdldE9iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xuICAgICAgICB9LFxuICAgICAgICBHZXRUeXBlSWRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSB2YWx1ZS5fZnVuY1tcIiRjaWRcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSB2YWx1ZVtcIiRjaWRcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xuICAgICAgICB9LFxuICAgICAgICBHZXRGdW5jdGlvbkZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xuICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0SlNPYmplY3RGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgdmFyIGpzb2JqID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdChlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcbiAgICAgICAgICAgIHJldHVybiBqc29iai5pZDtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0QXJyYXlCdWZmZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGFiID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcbiAgICAgICAgICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XG4gICAgICAgICAgICAoMCwgbGlicmFyeV8xLnNldE91dFZhbHVlMzIpKGVuZ2luZSwgbGVuZ3RoLCBhYi5ieXRlTGVuZ3RoKTtcbiAgICAgICAgICAgIHJldHVybiBwdHI7XG4gICAgICAgIH0sXG4gICAgICAgIC8v5L+d5a6I5pa55qGIXG4gICAgICAgIEdldFJlc3VsdFR5cGU6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuR2V0VHlwZSkoZW5naW5lLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEZyb21KU1JldHVybi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xuLyoqXG4gKiBtaXhpblxuICog5rOo5YaM57G7QVBJ77yM5aaC5rOo5YaM5YWo5bGA5Ye95pWw44CB5rOo5YaM57G777yM5Lul5Y+K57G755qE5bGe5oCn5pa55rOV562JXG4gKlxuICogQHBhcmFtIGVuZ2luZVxuICogQHJldHVybnNcbiAqL1xuZnVuY3Rpb24gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEkoZW5naW5lKSB7XG4gICAgY29uc3QgcmV0dXJuZWUgPSB7XG4gICAgICAgIFNldEdsb2JhbEZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgbmFtZVN0cmluZywgdjhGdW5jdGlvbkNhbGxiYWNrLCBqc0VudklkeCwgY2FsbGJhY2tpZHgpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xuICAgICAgICAgICAgbGlicmFyeV8xLmdsb2JhbFtuYW1lXSA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKHRydWUsIHY4RnVuY3Rpb25DYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xuICAgICAgICB9LFxuICAgICAgICBfUmVnaXN0ZXJDbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwganNFbnZJZHgsIGNhbGxiYWNraWR4LCBzaXplKSB7XG4gICAgICAgICAgICBjb25zdCBmdWxsTmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoZnVsbE5hbWVTdHJpbmcpO1xuICAgICAgICAgICAgY29uc3QgY3NoYXJwT2JqZWN0TWFwID0gZW5naW5lLmNzaGFycE9iamVjdE1hcDtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMubGVuZ3RoO1xuICAgICAgICAgICAgbGV0IHRlbXBFeHRlcm5hbENTSUQgPSAwO1xuICAgICAgICAgICAgY29uc3QgY3RvciA9IGZ1bmN0aW9uIE5hdGl2ZU9iamVjdCgpIHtcbiAgICAgICAgICAgICAgICAvLyDorr7nva7nsbvlnotJRFxuICAgICAgICAgICAgICAgIHRoaXNbXCIkY2lkXCJdID0gaWQ7XG4gICAgICAgICAgICAgICAgLy8gbmF0aXZlT2JqZWN055qE5p6E6YCg5Ye95pWwXG4gICAgICAgICAgICAgICAgLy8g5p6E6YCg5Ye95pWw5pyJ5Lik5Liq6LCD55So55qE5Zyw5pa577yaMS4ganPkvqduZXfkuIDkuKrlroPnmoTml7blgJkgMi4gY3PkvqfliJvlu7rkuobkuIDkuKrlr7nosaHopoHkvKDliLBqc+S+p+aXtlxuICAgICAgICAgICAgICAgIC8vIOesrOS4gOS4quaDheWGte+8jGNz5a+56LGhSUTmiJbogIXmmK9jYWxsVjhDb25zdHJ1Y3RvckNhbGxiYWNr6L+U5Zue55qE44CCXG4gICAgICAgICAgICAgICAgLy8g56ys5LqM5Liq5oOF5Ya177yM5YiZY3Plr7nosaFJROaYr2NzIG5ld+WujOS5i+WQjuS4gOW5tuS8oOe7mWpz55qE44CCXG4gICAgICAgICAgICAgICAgbGV0IGNzSUQgPSB0ZW1wRXh0ZXJuYWxDU0lEOyAvLyDlpoLmnpzmmK/nrKzkuozkuKrmg4XlhrXvvIzmraRJROeUsWNyZWF0ZUZyb21DU+iuvue9rlxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSAwO1xuICAgICAgICAgICAgICAgIGlmIChjc0lEID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFja0luZm9QdHIgPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAvLyDomb3nhLZwdWVydHPlhoVDb25zdHJ1Y3RvcueahOi/lOWbnuWAvOWPq3NlbGbvvIzkvYblroPlhbblrp7lsLHmmK9DU+WvueixoeeahOS4gOS4qmlk6ICM5bey44CCXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjc0lEID0gZW5naW5lLmNhbGxDU2hhcnBDb25zdHJ1Y3RvckNhbGxiYWNrKGNvbnN0cnVjdG9yLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja2lkeCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLlJlbGVhc2VCeU1vY2tJbnRQdHIoY2FsbGJhY2tJbmZvUHRyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYmxpdHRhYmxlXG4gICAgICAgICAgICAgICAgaWYgKHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNzTmV3SUQgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhzaXplKTtcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLl9tZW1jcHkoY3NOZXdJRCwgY3NJRCwgc2l6ZSk7XG4gICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5hZGQoY3NOZXdJRCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICgwLCBsaWJyYXJ5XzEuT25GaW5hbGl6ZSkodGhpcywgY3NOZXdJRCwgKGNzSWRlbnRpZmllcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLnJlbW92ZShjc0lkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLl9mcmVlKGNzSWRlbnRpZmllcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc0lELCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5PbkZpbmFsaXplKSh0aGlzLCBjc0lELCAoY3NJZGVudGlmaWVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAucmVtb3ZlKGNzSWRlbnRpZmllcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbENTaGFycERlc3RydWN0b3JDYWxsYmFjayhkZXN0cnVjdG9yIHx8IGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciwgY3NJZGVudGlmaWVyLCBjYWxsYmFja2lkeCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjdG9yLmNyZWF0ZUZyb21DUyA9IGZ1bmN0aW9uIChjc0lEKSB7XG4gICAgICAgICAgICAgICAgdGVtcEV4dGVybmFsQ1NJRCA9IGNzSUQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY3Rvci5fX3B1ZXJ0c01ldGFkYXRhID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwibmFtZVwiLCB7IHZhbHVlOiBmdWxsTmFtZSArIFwiQ29uc3RydWN0b3JcIiB9KTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBcIiRjaWRcIiwgeyB2YWx1ZTogaWQgfSk7XG4gICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuY2xhc3Nlcy5wdXNoKGN0b3IpO1xuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzSURXZWFrTWFwLnNldChjdG9yLCBpZCk7XG4gICAgICAgICAgICBpZiAoQmFzZVR5cGVJZCA+IDApIHtcbiAgICAgICAgICAgICAgICBjdG9yLnByb3RvdHlwZS5fX3Byb3RvX18gPSBjc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tCYXNlVHlwZUlkXS5wcm90b3R5cGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAubmFtZXNUb0NsYXNzZXNJRFtmdWxsTmFtZV0gPSBpZDtcbiAgICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgfSxcbiAgICAgICAgUmVnaXN0ZXJTdHJ1Y3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIC8qbG9uZyAqLyBqc0VudklkeCwgY2FsbGJhY2tpZHgsIHNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiByZXR1cm5lZS5fUmVnaXN0ZXJDbGFzcyhpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIGNhbGxiYWNraWR4LCBjYWxsYmFja2lkeCwgc2l6ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIFJlZ2lzdGVyRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBjbGFzc0lELCBuYW1lU3RyaW5nLCBpc1N0YXRpYywgY2FsbGJhY2ssIC8qbG9uZyAqLyBqc0VudklkeCwgY2FsbGJhY2tpZHgpIHtcbiAgICAgICAgICAgIHZhciBjbHMgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbY2xhc3NJRF07XG4gICAgICAgICAgICBpZiAoIWNscykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBmbiA9IGVuZ2luZS5tYWtlQ1NoYXJwRnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBjYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgICAgICAgICAgICBjbHNbbmFtZV0gPSBmbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNscy5wcm90b3R5cGVbbmFtZV0gPSBmbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgUmVnaXN0ZXJQcm9wZXJ0eTogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBnZXR0ZXIsIFxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyanNFbnZJZHgsIFxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyY2FsbGJhY2tpZHgsIHNldHRlciwgXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJqc0VudklkeCwgXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJjYWxsYmFja2lkeCwgZG9udERlbGV0ZSkge1xuICAgICAgICAgICAgdmFyIGNscyA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcbiAgICAgICAgICAgIGlmICghY2xzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XG4gICAgICAgICAgICB2YXIgYXR0ciA9IHtcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6ICFkb250RGVsZXRlLFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYXR0ci5nZXQgPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgZ2V0dGVyLCBnZXR0ZXJjYWxsYmFja2lkeCk7XG4gICAgICAgICAgICBpZiAoc2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgYXR0ci5zZXQgPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihpc1N0YXRpYywgc2V0dGVyLCBzZXR0ZXJjYWxsYmFja2lkeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xzLCBuYW1lLCBhdHRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbHMucHJvdG90eXBlLCBuYW1lLCBhdHRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiByZXR1cm5lZTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFJlZ2lzdGVyQVBJO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmVnaXN0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcbi8qKlxuICogbWl4aW5cbiAqIEMj6LCD55SoSlPml7bvvIzorr7nva7osIPnlKjlj4LmlbDnmoTlgLxcbiAqXG4gKiBAcGFyYW0gZW5naW5lXG4gKiBAcmV0dXJuc1xuICovXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0ludm9rZUpTQXJndW1lbnRBcGkoZW5naW5lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLy9iZWdpbiBjcyBjYWxsIGpzXG4gICAgICAgIFB1c2hOdWxsRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbikge1xuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChudWxsKTtcbiAgICAgICAgfSxcbiAgICAgICAgUHVzaERhdGVGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBkYXRlVmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobmV3IERhdGUoZGF0ZVZhbHVlKSk7XG4gICAgICAgIH0sXG4gICAgICAgIFB1c2hCb29sZWFuRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgYikge1xuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaCghIWIpO1xuICAgICAgICB9LFxuICAgICAgICBQdXNoQmlnSW50Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypsb25nICovIGxvbmdsb3csIGxvbmdoaWdoKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKCgwLCBsaWJyYXJ5XzEubWFrZUJpZ0ludCkobG9uZ2xvdywgbG9uZ2hpZ2gpKTtcbiAgICAgICAgfSxcbiAgICAgICAgUHVzaFN0cmluZ0ZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIHN0clN0cmluZykge1xuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZykpO1xuICAgICAgICB9LFxuICAgICAgICBQdXNoTnVtYmVyRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgZCkge1xuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChkKTtcbiAgICAgICAgfSxcbiAgICAgICAgUHVzaE9iamVjdEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGNsYXNzSUQsIG9iamVjdElEKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KG9iamVjdElELCBjbGFzc0lEKSk7XG4gICAgICAgIH0sXG4gICAgICAgIFB1c2hKU0Z1bmN0aW9uRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNGdW5jdGlvbikge1xuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChKU0Z1bmN0aW9uKS5fZnVuYyk7XG4gICAgICAgIH0sXG4gICAgICAgIFB1c2hKU09iamVjdEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIEpTT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTT2JqZWN0QnlJZChKU09iamVjdCkuZ2V0T2JqZWN0KCkpO1xuICAgICAgICB9LFxuICAgICAgICBQdXNoQXJyYXlCdWZmZXJGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKmJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9JbnZva2VKU0FyZ3VtZW50QXBpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9JbnZva2VKU0FyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XG4vKipcbiAqIG1peGluXG4gKiBKU+iwg+eUqEMj5pe277yMQyPorr7nva7ov5Tlm57liLBKU+eahOWAvFxuICpcbiAqIEBwYXJhbSBlbmdpbmVcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSlNJbnZva2VSZXR1cm5BcGkoZW5naW5lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgUmV0dXJuQ2xhc3M6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBjbGFzc0lEKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5PYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBjbGFzc0lELCBzZWxmKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qoc2VsZiwgY2xhc3NJRCk7XG4gICAgICAgIH0sXG4gICAgICAgIFJldHVybk51bWJlcjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIG51bWJlcikge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG51bWJlcjtcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuU3RyaW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgc3RyU3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBzdHIgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZyk7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gc3RyO1xuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5CaWdJbnQ6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBsb25nTG93LCBsb25nSGlnaCkge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9ICgwLCBsaWJyYXJ5XzEubWFrZUJpZ0ludCkobG9uZ0xvdywgbG9uZ0hpZ2gpO1xuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5Cb29sZWFuOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgYikge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9ICEhYjsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuRGF0ZTogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGRhdGUpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBuZXcgRGF0ZShkYXRlKTtcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuTnVsbDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8pIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5GdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIEpTRnVuY3Rpb25QdHIpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjb25zdCBqc0Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChKU0Z1bmN0aW9uUHRyKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGpzRnVuYy5fZnVuYztcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuSlNPYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBKU09iamVjdFB0cikge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNvbnN0IGpzT2JqZWN0ID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNPYmplY3RCeUlkKEpTT2JqZWN0UHRyKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGpzT2JqZWN0LmdldE9iamVjdCgpO1xuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5DU2hhcnBGdW5jdGlvbkNhbGxiYWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgdjhGdW5jdGlvbkNhbGxiYWNrLCBcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJMb3csIFxuICAgICAgICAvKmxvbmcgKi8gcG9pbnRlckhpZ2gpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUubWFrZUNTaGFycEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihmYWxzZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBwb2ludGVySGlnaCk7XG4gICAgICAgIH0sXG4gICAgICAgIFJldHVybkFycmF5QnVmZmVyOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgLypieXRlW10gKi8gaW5kZXgsIGxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9KU0ludm9rZVJldHVybkFwaTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSlNJbnZva2VSZXR1cm4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcbi8qKlxuICogbWl4aW5cbiAqIEpT6LCD55SoQyPml7bvvIxDI+S+p+iuvue9rm91dOWPguaVsOWAvFxuICpcbiAqIEBwYXJhbSBlbmdpbmVcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSShlbmdpbmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBTZXROdW1iZXJUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIG51bWJlcikge1xuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmpbMF0gPSBudW1iZXI7XG4gICAgICAgIH0sXG4gICAgICAgIFNldERhdGVUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGRhdGUpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xuICAgICAgICAgICAgb2JqWzBdID0gbmV3IERhdGUoZGF0ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIFNldFN0cmluZ1RvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgc3RyU3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBzdHIgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZyk7XG4gICAgICAgICAgICB2YXIgb2JqID0gZW5naW5lLmZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIG9ialswXSA9IHN0cjtcbiAgICAgICAgfSxcbiAgICAgICAgU2V0Qm9vbGVhblRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgYikge1xuICAgICAgICAgICAgdmFyIG9iaiA9IGVuZ2luZS5mdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmpbMF0gPSAhIWI7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXG4gICAgICAgIH0sXG4gICAgICAgIFNldEJpZ0ludFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgbG93LCBoaWdoKSB7XG4gICAgICAgICAgICBjb25zdCBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xuICAgICAgICAgICAgb2JqWzBdID0gKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb3csIGhpZ2gpO1xuICAgICAgICB9LFxuICAgICAgICBTZXRPYmplY3RUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGNsYXNzSUQsIHNlbGYpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xuICAgICAgICAgICAgb2JqWzBdID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qoc2VsZiwgY2xhc3NJRCk7XG4gICAgICAgIH0sXG4gICAgICAgIFNldE51bGxUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xuICAgICAgICAgICAgb2JqWzBdID0gbnVsbDsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcbiAgICAgICAgfSxcbiAgICAgICAgU2V0QXJyYXlCdWZmZXJUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIC8qQnl0ZVtdICovIGluZGV4LCBsZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSBlbmdpbmUuZnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xuICAgICAgICAgICAgb2JqWzBdID0gZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlci5zbGljZShpbmRleCwgaW5kZXggKyBsZW5ndGgpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0pTT3V0QXJndW1lbnRBUEk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0pTT3V0QXJndW1lbnQuanMubWFwIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIOagueaNriBodHRwczovL2RvY3MudW5pdHkzZC5jb20vMjAxOC40L0RvY3VtZW50YXRpb24vTWFudWFsL3dlYmdsLWludGVyYWN0aW5nd2l0aGJyb3dzZXJzY3JpcHRpbmcuaHRtbFxuICog5oiR5Lus55qE55uu55qE5bCx5piv5ZyoV2ViR0zmqKHlvI/kuIvvvIzlrp7njrDlkoxwdWVydHMuZGxs55qE5pWI5p6c44CC5YW35L2T5Zyo5LqO5a6e546w5LiA5LiqanNsaWLvvIzph4zpnaLlupTljIXlkKtQdWVydHNETEwuY3PnmoTmiYDmnInmjqXlj6NcbiAqIOWunumqjOWPkeeOsOi/meS4qmpzbGli6Jm954S25Lmf5piv6L+Q6KGM5ZyodjjnmoRqc++8jOS9huWvuWRldnRvb2zosIPor5XlubbkuI3lj4vlpb3vvIzkuJTlj6rmlK/mjIHliLBlczXjgIJcbiAqIOWboOatpOW6lOivpemAmui/h+S4gOS4queLrOeri+eahGpz5a6e546w5o6l5Y+j77yMcHVlcnRzLmpzbGli6YCa6L+H5YWo5bGA55qE5pa55byP6LCD55So5a6D44CCXG4gKlxuICog5pyA57uI5b2i5oiQ5aaC5LiL5p625p6EXG4gKiDkuJrliqFKUyA8LT4gV0FTTSA8LT4gdW5pdHkganNsaWIgPC0+IOacrGpzXG4gKiDkvYbmlbTmnaHpk77ot6/lhbblrp7pg73lnKjkuIDkuKp2OChqc2NvcmUp6Jma5ouf5py66YeMXG4gKi9cbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuL2xpYnJhcnlcIik7XG5jb25zdCBnZXRGcm9tSlNBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL2dldEZyb21KU0FyZ3VtZW50XCIpO1xuY29uc3QgZ2V0RnJvbUpTUmV0dXJuXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvZ2V0RnJvbUpTUmV0dXJuXCIpO1xuY29uc3QgcmVnaXN0ZXJfMSA9IHJlcXVpcmUoXCIuL21peGlucy9yZWdpc3RlclwiKTtcbmNvbnN0IHNldFRvSW52b2tlSlNBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSW52b2tlSlNBcmd1bWVudFwiKTtcbmNvbnN0IHNldFRvSlNJbnZva2VSZXR1cm5fMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0pTSW52b2tlUmV0dXJuXCIpO1xuY29uc3Qgc2V0VG9KU091dEFyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9KU091dEFyZ3VtZW50XCIpO1xubGlicmFyeV8xLmdsb2JhbC53eFJlcXVpcmUgPSBsaWJyYXJ5XzEuZ2xvYmFsLnJlcXVpcmU7XG5saWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMID0ge1xuICAgIGluaXRlZDogZmFsc2UsXG4gICAgZGVidWc6IGZhbHNlLFxuICAgIC8vIHB1ZXJ0c+mmluasoeWIneWni+WMluaXtuS8muiwg+eUqOi/memHjO+8jOW5tuaKilVuaXR555qE6YCa5L+h5o6l5Y+j5Lyg5YWlXG4gICAgSW5pdCh7IFVURjhUb1N0cmluZywgX21hbGxvYywgX21lbWNweSwgX2ZyZWUsIF9zZXRUZW1wUmV0MCwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHVuaXR5SW5zdGFuY2UgfSkge1xuICAgICAgICBjb25zdCBlbmdpbmUgPSBuZXcgbGlicmFyeV8xLlB1ZXJ0c0pTRW5naW5lKHtcbiAgICAgICAgICAgIFVURjhUb1N0cmluZywgX21hbGxvYywgX21lbWNweSwgX2ZyZWUsIF9zZXRUZW1wUmV0MCwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHVuaXR5SW5zdGFuY2VcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGV4ZWN1dGVNb2R1bGVDYWNoZSA9IHt9O1xuICAgICAgICBsZXQganNFbmdpbmVSZXR1cm5lZCA9IGZhbHNlO1xuICAgICAgICBsZXQgbG9hZGVyO1xuICAgICAgICAvLyBQdWVydHNETEznmoTmiYDmnInmjqXlj6Plrp7njrBcbiAgICAgICAgbGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IE9iamVjdC5hc3NpZ24obGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCwgeyB1bml0eUluc3RhbmNlIH0sICgwLCBnZXRGcm9tSlNBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBnZXRGcm9tSlNSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSlNJbnZva2VSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU091dEFyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHJlZ2lzdGVyXzEuZGVmYXVsdCkoZW5naW5lKSwge1xuICAgICAgICAgICAgLy8gYnJpZGdlTG9nOiB0cnVlLFxuICAgICAgICAgICAgR2V0TGliVmVyc2lvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAzMjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHZXRBcGlMZXZlbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAzMjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHZXRMaWJCYWNrZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQ3JlYXRlSlNFbmdpbmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoanNFbmdpbmVSZXR1cm5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvbmx5IG9uZSBhdmFpbGFibGUganNFbnYgaXMgYWxsb3dlZCBpbiBXZWJHTCBtb2RlXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqc0VuZ2luZVJldHVybmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBDcmVhdGVKU0VuZ2luZVdpdGhFeHRlcm5hbEVudjogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgRGVzdHJveUpTRW5naW5lOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICBHZXRMYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKGlzb2xhdGUsIC8qIG91dCBpbnQgKi8gc3RybGVuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZW5naW5lLmxhc3RFeGNlcHRpb24uc3RhY2ssIHN0cmxlbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgTG93TWVtb3J5Tm90aWZpY2F0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxuICAgICAgICAgICAgSWRsZU5vdGlmaWNhdGlvbkRlYWRsaW5lOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxuICAgICAgICAgICAgUmVxdWVzdE1pbm9yR2FyYmFnZUNvbGxlY3Rpb25Gb3JUZXN0aW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxuICAgICAgICAgICAgUmVxdWVzdEZ1bGxHYXJiYWdlQ29sbGVjdGlvbkZvclRlc3Rpbmc6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXG4gICAgICAgICAgICBTZXRHZW5lcmFsRGVzdHJ1Y3RvcjogZnVuY3Rpb24gKGlzb2xhdGUsIF9nZW5lcmFsRGVzdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciA9IF9nZW5lcmFsRGVzdHJ1Y3RvcjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHZXRNb2R1bGVFeGVjdXRvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGxvYWRlciA9IHR5cGVvZiBfX3RnanNHZXRMb2FkZXIgIT0gJ3VuZGVmaW5lZCcgPyBfX3RnanNHZXRMb2FkZXIoKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc3QgbG9hZGVyUmVzb2x2ZSA9IGxvYWRlci5SZXNvbHZlID8gKGZ1bmN0aW9uIChmaWxlTmFtZSwgdG8gPSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkTmFtZSA9IGxvYWRlci5SZXNvbHZlKGZpbGVOYW1lLCB0byk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vZHVsZSBub3QgZm91bmQ6ICcgKyBmaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkTmFtZTtcbiAgICAgICAgICAgICAgICB9KSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIGpzZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jdGlvbiAoZmlsZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFsncHVlcnRzL2xvZy5tanMnLCAncHVlcnRzL3RpbWVyLm1qcyddLmluZGV4T2YoZmlsZU5hbWUpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlclJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVOYW1lID0gbG9hZGVyUmVzb2x2ZShmaWxlTmFtZSwgXCJcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3eCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gd3hSZXF1aXJlKCdwdWVydHNfbWluaWdhbWVfanNfcmVzb3VyY2VzLycgKyAoZmlsZU5hbWUuZW5kc1dpdGgoJy5qcycpID8gZmlsZU5hbWUgOiBmaWxlTmFtZSArIFwiLmpzXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBub3JtYWxpemUobmFtZSwgdG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIENTICE9IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1MuUHVlcnRzLlBhdGhIZWxwZXIuSXNSZWxhdGl2ZSh0bykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldCA9IENTLlB1ZXJ0cy5QYXRoSGVscGVyLm5vcm1hbGl6ZShDUy5QdWVydHMuUGF0aEhlbHBlci5EaXJuYW1lKG5hbWUpICsgXCIvXCIgKyB0byk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0bztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG1vY2tSZXF1aXJlKHNwZWNpZmllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgZXhwb3J0czoge30gfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZENhY2hlU3BlY2lmaWVyID0gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIGV4ZWN1dGVNb2R1bGVDYWNoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kQ2FjaGVTcGVjaWZpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmV4cG9ydHMgPSBleGVjdXRlTW9kdWxlQ2FjaGVbZm91bmRDYWNoZVNwZWNpZmllcl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZFNwZWNpZmllciA9IHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBQVUVSVFNfSlNfUkVTT1VSQ0VTKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3VuZFNwZWNpZmllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtb2R1bGUgbm90IGZvdW5kOiAnICsgc3BlY2lmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjaWZpZXIgPSBmb3VuZFNwZWNpZmllcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZU1vZHVsZUNhY2hlW3NwZWNpZmllcl0gPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBVRVJUU19KU19SRVNPVVJDRVNbc3BlY2lmaWVyXShyZXN1bHQuZXhwb3J0cywgZnVuY3Rpb24gbVJlcXVpcmUoc3BlY2lmaWVyVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9ja1JlcXVpcmUobG9hZGVyUmVzb2x2ZSA/IGxvYWRlclJlc29sdmUoc3BlY2lmaWVyVG8sIHNwZWNpZmllcikgOiBub3JtYWxpemUoc3BlY2lmaWVyLCBzcGVjaWZpZXJUbykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IHJlc3VsdC5leHBvcnRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LmV4cG9ydHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIG9iaikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdHJ5RmluZE5hbWUgPSBbc3BlY2lmaWVyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5pbmRleE9mKCcuJykgPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlGaW5kTmFtZSA9IHRyeUZpbmROYW1lLmNvbmNhdChbc3BlY2lmaWVyICsgJy5qcycsIHNwZWNpZmllciArICcudHMnLCBzcGVjaWZpZXIgKyAnLm1qcycsIHNwZWNpZmllciArICcubXRzJ10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZmluZGVkID0gdHJ5RmluZE5hbWUucmVkdWNlKChyZXQsIG5hbWUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmV0ICE9PSBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ialtuYW1lXSA9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjaXJjdWxhciBkZXBlbmRlbmN5IGlzIGRldGVjdGVkIHdoZW4gcmVxdWlyaW5nIFwiJHtuYW1lfVwiYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaW5kZWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnlGaW5kTmFtZVtmaW5kZWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVxdWlyZVJldCA9IG1vY2tSZXF1aXJlKGZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1aXJlUmV0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHZXRKU09iamVjdFZhbHVlR2V0dGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGpzZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jdGlvbiAob2JqLCBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRXZhbDogZnVuY3Rpb24gKGlzb2xhdGUsIGNvZGVTdHJpbmcsIHBhdGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWxpYnJhcnlfMS5nbG9iYWwuZXZhbCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJldmFsIGlzIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBVVEY4VG9TdHJpbmcoY29kZVN0cmluZyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGxpYnJhcnlfMS5nbG9iYWwuZXZhbChjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGdldEludFB0ck1hbmFnZXIoKS5HZXRQb2ludGVyRm9ySlNWYWx1ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLypGUmVzdWx0SW5mbyAqLyAxMDI0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdEV4Y2VwdGlvbiA9IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFNldFB1c2hKU0Z1bmN0aW9uQXJndW1lbnRzQ2FsbGJhY2s6IGZ1bmN0aW9uIChpc29sYXRlLCBjYWxsYmFjaywganNFbnZJZHgpIHtcbiAgICAgICAgICAgICAgICBlbmdpbmUuR2V0SlNBcmd1bWVudHNDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFRocm93RXhjZXB0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgLypieXRlW10gKi8gbWVzc2FnZVN0cmluZykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihVVEY4VG9TdHJpbmcobWVzc2FnZVN0cmluZykpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEludm9rZUpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGhhc1Jlc3VsdCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSBmdW5jLmludm9rZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnVuYy5sYXN0RXhjZXB0aW9uID0gZXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncHRyIGlzIG5vdCBhIGpzZnVuYycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHZXRGdW5jdGlvbkxhc3RFeGNlcHRpb25JbmZvOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKm91dCBpbnQgKi8gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKGZ1bmMgaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhmdW5jLmxhc3RFeGNlcHRpb24uc3RhY2sgfHwgZnVuYy5sYXN0RXhjZXB0aW9uLm1lc3NhZ2UgfHwgJycsIGxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUmVsZWFzZUpTRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBfZnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZW1vdmVKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFJlbGVhc2VKU09iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIG9iaikge1xuICAgICAgICAgICAgICAgIGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlbW92ZUpTT2JqZWN0QnlJZChvYmopO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFJlc2V0UmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENsZWFyTW9kdWxlQ2FjaGU6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgIENyZWF0ZUluc3BlY3RvcjogZnVuY3Rpb24gKGlzb2xhdGUsIHBvcnQpIHsgfSxcbiAgICAgICAgICAgIERlc3Ryb3lJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXG4gICAgICAgICAgICBJbnNwZWN0b3JUaWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxuICAgICAgICAgICAgTG9naWNUaWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxuICAgICAgICAgICAgU2V0TG9nQ2FsbGJhY2s6IGZ1bmN0aW9uIChsb2csIGxvZ1dhcm5pbmcsIGxvZ0Vycm9yKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=