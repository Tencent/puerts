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
    static infos = [new FunctionCallbackInfo([0])]; // 这里原本只是个普通的0
    // FunctionCallbackInfo用完后，就可以放入回收列表，以供下次复用
    static freeInfosIndex = [];
    /**
     * intptr的格式为id左移四位
     *
     * 右侧四位就是为了放下参数的序号，用于表示callbackinfo参数的intptr
     */
    static GetMockPointer(args) {
        let index;
        index = this.freeInfosIndex.pop();
        // index最小为1
        if (index) {
            this.infos[index].args = args;
        }
        else {
            index = this.infos.push(new FunctionCallbackInfo(args)) - 1;
        }
        return index << 4;
    }
    static GetByMockPointer(intptr) {
        return this.infos[intptr >> 4];
    }
    static GetReturnValueAndRecycle(intptr) {
        const index = intptr >> 4;
        this.freeInfosIndex.push(index);
        let info = this.infos[index];
        let ret = info.returnValue;
        info.recycle();
        return ret;
    }
    static ReleaseByMockIntPtr(intptr) {
        const index = intptr >> 4;
        this.infos[index].recycle();
        this.freeInfosIndex.push(index);
    }
    static GetArgsByMockIntPtr(ptr) {
        const callbackInfoIndex = ptr >> 4;
        const argsIndex = ptr & 15;
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
    add(csID, obj) {
        // this.nativeObjectKV[csID] = createWeakRef(obj);
        // this.csIDWeakMap.set(obj, csID);
        this.nativeObjectKV.set(csID, createWeakRef(obj));
        Object.defineProperty(obj, '_puerts_csid_', {
            value: csID
        });
    }
    remove(csID) {
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
            HEAP8: null
        };
        Object.defineProperty(this.unityApi, 'HEAP32', {
            get: function () {
                return unityInstance.HEAP32;
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
            let callbackInfoPtr = FunctionCallbackInfoPtrManager.GetMockPointer(args);
            engine.callV8FunctionCallback(functionPtr, 
            // getIntPtrManager().GetPointerForJSValue(this),
            isStatic ? 0 : engine.csharpObjectMap.getCSIdentifierFromObject(this), callbackInfoPtr, args.length, callbackIdx);
            return FunctionCallbackInfoPtrManager.GetReturnValueAndRecycle(callbackInfoPtr);
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
const library_1 = __webpack_require__(/*! ../library */ "./output/library.js");
/**
 * mixin
 * JS调用C#时，C#侧获取JS调用参数的值
 *
 * @param engine
 * @returns
 */
function WebGLBackendGetFromJSArgumentAPI(engine) {
    return {
        GetNumberFromValue: function (isolate, value, isByRef) {
            return library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
        },
        GetDateFromValue: function (isolate, value, isByRef) {
            return library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value).getTime();
        },
        GetStringFromValue: function (isolate, value, /*out int */ length, isByRef) {
            var returnStr = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            return engine.JSStringToCSString(returnStr, length);
        },
        GetBooleanFromValue: function (isolate, value, isByRef) {
            return library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
        },
        ValueIsBigInt: function (isolate, value, isByRef) {
            var bigint = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            return bigint instanceof BigInt;
        },
        GetBigIntFromValue: function (isolate, value, isByRef) {
            var bigint = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            return bigint;
        },
        GetObjectFromValue: function (isolate, value, isByRef) {
            var nativeObject = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            return engine.csharpObjectMap.getCSIdentifierFromObject(nativeObject);
        },
        GetFunctionFromValue: function (isolate, value, isByRef) {
            var func = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            var jsfunc = library_1.jsFunctionOrObjectFactory.getOrCreateJSFunction(func);
            return jsfunc.id;
        },
        GetJSObjectFromValue: function (isolate, value, isByRef) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            var jsobj = library_1.jsFunctionOrObjectFactory.getOrCreateJSObject(obj);
            return jsobj.id;
        },
        GetArrayBufferFromValue: function (isolate, value, /*out int */ length, isOut) {
            var ab = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            if (ab instanceof Uint8Array) {
                ab = ab.buffer;
            }
            var ptr = engine.unityApi._malloc(ab.byteLength);
            engine.unityApi.HEAP8.set(new Int8Array(ab), ptr);
            engine.unityApi.HEAP32[length >> 2] = ab.byteLength;
            (0, library_1.setOutValue32)(engine, length, ab.byteLength);
            return ptr;
        },
        GetArgumentType: function (isolate, info, index, isByRef) {
            var value = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info).args[index];
            return (0, library_1.GetType)(engine, value);
        },
        /**
         * 为c#侧提供一个获取callbackinfo里jsvalue的intptr的接口
         * 并不是得的到这个argument的值
         */
        GetArgumentValue /*inCallbackInfo*/: function (infoptr, index) {
            return infoptr | index;
        },
        GetJsValueType: function (isolate, val, isByRef) {
            // public enum JsValueType
            // {
            //     NullOrUndefined = 1,
            //     BigInt = 2,
            //     Number = 4,
            //     String = 8,
            //     Boolean = 16,
            //     NativeObject = 32,
            //     JsObject = 64,
            //     Array = 128,
            //     Function = 256,
            //     Date = 512,
            //     ArrayBuffer = 1024,
            //     Unknow = 2048,
            //     Any = NullOrUndefined | BigInt | Number | String | Boolean | NativeObject | Array | Function | Date | ArrayBuffer,
            // };
            var value = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(val);
            return (0, library_1.GetType)(engine, value);
        },
        GetTypeIdFromValue: function (isolate, value, isByRef) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
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
            const ctor = function () {
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
                    const callbackInfoPtr = library_1.FunctionCallbackInfoPtrManager.GetMockPointer(args);
                    // 虽然puerts内Constructor的返回值叫self，但它其实就是CS对象的一个id而已。
                    csID = engine.callV8ConstructorCallback(constructor, callbackInfoPtr, args.length, callbackidx);
                    library_1.FunctionCallbackInfoPtrManager.ReleaseByMockIntPtr(callbackInfoPtr);
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
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.csharpObjectMap.classes[classID];
        },
        ReturnObject: function (isolate, info, classID, self) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.csharpObjectMap.findOrAddObject(self, classID);
        },
        ReturnNumber: function (isolate, info, number) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = number;
        },
        ReturnString: function (isolate, info, strString) {
            const str = engine.unityApi.UTF8ToString(strString);
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = str;
        },
        ReturnBigInt: function (isolate, info, longLow, longHigh) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = (0, library_1.makeBigInt)(longLow, longHigh);
        },
        ReturnBoolean: function (isolate, info, b) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = !!b; // 传过来的是1和0
        },
        ReturnDate: function (isolate, info, date) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = new Date(date);
        },
        ReturnNull: function (isolate, info) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = null;
        },
        ReturnFunction: function (isolate, info, JSFunctionPtr) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            const jsFunc = library_1.jsFunctionOrObjectFactory.getJSFunctionById(JSFunctionPtr);
            callbackInfo.returnValue = jsFunc._func;
        },
        ReturnJSObject: function (isolate, info, JSObjectPtr) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            const jsObject = library_1.jsFunctionOrObjectFactory.getJSObjectById(JSObjectPtr);
            callbackInfo.returnValue = jsObject.getObject();
        },
        ReturnCSharpFunctionCallback: function (isolate, info, v8FunctionCallback, 
        /*long */ pointerLow, 
        /*long */ pointerHigh) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.makeV8FunctionCallbackFunction(false, v8FunctionCallback, pointerLow);
        },
        ReturnArrayBuffer: function (isolate, info, /*byte[] */ index, length) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
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
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = number;
        },
        SetDateToOutValue: function (isolate, value, date) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = new Date(date);
        },
        SetStringToOutValue: function (isolate, value, strString) {
            const str = engine.unityApi.UTF8ToString(strString);
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = str;
        },
        SetBooleanToOutValue: function (isolate, value, b) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = !!b; // 传过来的是1和0
        },
        SetBigIntToOutValue: function (isolate, value, /*long */ bigInt) {
            throw new Error('not implemented');
        },
        SetObjectToOutValue: function (isolate, value, classID, self) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = engine.csharpObjectMap.findOrAddObject(self, classID);
        },
        SetNullToOutValue: function (isolate, value) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj[0] = null; // 传过来的是1和0
        },
        SetArrayBufferToOutValue: function (isolate, value, /*Byte[] */ index, length) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
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
                return 30;
            },
            GetApiLevel: function () {
                return 30;
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
                return engine.JSStringToCSString(engine.lastException.message, strlen);
            },
            LowMemoryNotification: function (isolate) { },
            IdleNotificationDeadline: function (isolate) { },
            RequestMinorGarbageCollectionForTesting: function (isolate) { },
            RequestFullGarbageCollectionForTesting: function (isolate) { },
            SetGeneralDestructor: function (isolate, _generalDestructor) {
                engine.generalDestructor = _generalDestructor;
            },
            SetModuleResolver: function () {
            },
            ExecuteModule: function (isolate, pathString, exportee) {
                try {
                    let fileName = UTF8ToString(pathString);
                    if (fileName.indexOf('log.mjs') != -1) {
                        return 1024;
                    }
                    if (typeof wx != 'undefined') {
                        const result = wxRequire('puerts_minigame_js_resources/' + (fileName.endsWith('.js') ? fileName : fileName + ".js"));
                        if (exportee) {
                            engine.lastReturnCSResult = result[UTF8ToString(exportee)];
                        }
                        else {
                            engine.lastReturnCSResult = result;
                        }
                        return 1024;
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
                                PUERTS_JS_RESOURCES[specifier](result.exports, (specifierTo) => {
                                    return mockRequire(normalize(specifier, specifierTo));
                                }, result);
                                executeModuleCache[specifier] = result.exports;
                            }
                            return result.exports;
                            function tryFindAndGetFindedSpecifier(specifier, obj) {
                                let tryfind = [specifier];
                                if (specifier.indexOf('.') == -1)
                                    tryfind = tryfind.concat([specifier + '.js', specifier + '.ts', specifier + '.mjs', specifier + '.mts']);
                                let finded = -1;
                                tryfind.forEach((s, index) => {
                                    finded = finded != -1 ? finded : (!!obj[s] ? index : -1);
                                });
                                if (finded == -1) {
                                    return null;
                                }
                                else {
                                    return tryfind[finded];
                                }
                            }
                        }
                        const requireRet = mockRequire(fileName);
                        if (exportee) {
                            engine.lastReturnCSResult = requireRet[UTF8ToString(exportee)];
                        }
                        else {
                            engine.lastReturnCSResult = requireRet;
                        }
                        return 1024;
                    }
                }
                catch (e) {
                    engine.lastException = e;
                }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGtCQUFlO0FBQ2Y7Ozs7Ozs7Ozs7QUMxR2E7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsa0JBQWtCLG1CQUFPLENBQUMsdUNBQVk7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7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O0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYiw2Q0FBNkM7QUFDN0MseURBQXlEO0FBQ3pELG9EQUFvRDtBQUNwRCxpREFBaUQ7QUFDakQsNkNBQTZDO0FBQzdDO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLGlDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2xpYnJhcnkuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9nZXRGcm9tSlNBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL2dldEZyb21KU1JldHVybi5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3JlZ2lzdGVyLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9JbnZva2VKU0FyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9KU0ludm9rZVJldHVybi5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSlNPdXRBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuc2V0T3V0VmFsdWU4ID0gZXhwb3J0cy5zZXRPdXRWYWx1ZTMyID0gZXhwb3J0cy5tYWtlQmlnSW50ID0gZXhwb3J0cy5HZXRUeXBlID0gZXhwb3J0cy5QdWVydHNKU0VuZ2luZSA9IGV4cG9ydHMuT25GaW5hbGl6ZSA9IGV4cG9ydHMuY3JlYXRlV2Vha1JlZiA9IGV4cG9ydHMuZ2xvYmFsID0gZXhwb3J0cy5DU2hhcnBPYmplY3RNYXAgPSBleHBvcnRzLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkgPSBleHBvcnRzLkpTT2JqZWN0ID0gZXhwb3J0cy5KU0Z1bmN0aW9uID0gZXhwb3J0cy5SZWYgPSBleHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IGV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm8gPSB2b2lkIDA7XHJcbi8qKlxyXG4gKiDkuIDmrKHlh73mlbDosIPnlKjnmoRpbmZvXHJcbiAqIOWvueW6lHY4OjpGdW5jdGlvbkNhbGxiYWNrSW5mb1xyXG4gKi9cclxuY2xhc3MgRnVuY3Rpb25DYWxsYmFja0luZm8ge1xyXG4gICAgYXJncztcclxuICAgIHJldHVyblZhbHVlO1xyXG4gICAgY29uc3RydWN0b3IoYXJncykge1xyXG4gICAgICAgIHRoaXMuYXJncyA9IGFyZ3M7XHJcbiAgICB9XHJcbiAgICByZWN5Y2xlKCkge1xyXG4gICAgICAgIHRoaXMuYXJncyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IHZvaWQgMDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gRnVuY3Rpb25DYWxsYmFja0luZm87XHJcbi8qKlxyXG4gKiDmiopGdW5jdGlvbkNhbGxiYWNrSW5mb+S7peWPiuWFtuWPguaVsOi9rOWMluS4umMj5Y+v55So55qEaW50cHRyXHJcbiAqL1xyXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIge1xyXG4gICAgLy8gRnVuY3Rpb25DYWxsYmFja0luZm/nmoTliJfooajvvIzku6XliJfooajnmoRpbmRleOS9nOS4ukludFB0cueahOWAvFxyXG4gICAgc3RhdGljIGluZm9zID0gW25ldyBGdW5jdGlvbkNhbGxiYWNrSW5mbyhbMF0pXTsgLy8g6L+Z6YeM5Y6f5pys5Y+q5piv5Liq5pmu6YCa55qEMFxyXG4gICAgLy8gRnVuY3Rpb25DYWxsYmFja0luZm/nlKjlrozlkI7vvIzlsLHlj6/ku6XmlL7lhaXlm57mlLbliJfooajvvIzku6XkvpvkuIvmrKHlpI3nlKhcclxuICAgIHN0YXRpYyBmcmVlSW5mb3NJbmRleCA9IFtdO1xyXG4gICAgLyoqXHJcbiAgICAgKiBpbnRwdHLnmoTmoLzlvI/kuLppZOW3puenu+Wbm+S9jVxyXG4gICAgICpcclxuICAgICAqIOWPs+S+p+Wbm+S9jeWwseaYr+S4uuS6huaUvuS4i+WPguaVsOeahOW6j+WPt++8jOeUqOS6juihqOekumNhbGxiYWNraW5mb+WPguaVsOeahGludHB0clxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgR2V0TW9ja1BvaW50ZXIoYXJncykge1xyXG4gICAgICAgIGxldCBpbmRleDtcclxuICAgICAgICBpbmRleCA9IHRoaXMuZnJlZUluZm9zSW5kZXgucG9wKCk7XHJcbiAgICAgICAgLy8gaW5kZXjmnIDlsI/kuLoxXHJcbiAgICAgICAgaWYgKGluZGV4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5mb3NbaW5kZXhdLmFyZ3MgPSBhcmdzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2gobmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKGFyZ3MpKSAtIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpbmRleCA8PCA0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIEdldEJ5TW9ja1BvaW50ZXIoaW50cHRyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mb3NbaW50cHRyID4+IDRdO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIEdldFJldHVyblZhbHVlQW5kUmVjeWNsZShpbnRwdHIpIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IGludHB0ciA+PiA0O1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICAgICAgbGV0IGluZm8gPSB0aGlzLmluZm9zW2luZGV4XTtcclxuICAgICAgICBsZXQgcmV0ID0gaW5mby5yZXR1cm5WYWx1ZTtcclxuICAgICAgICBpbmZvLnJlY3ljbGUoKTtcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIFJlbGVhc2VCeU1vY2tJbnRQdHIoaW50cHRyKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBpbnRwdHIgPj4gNDtcclxuICAgICAgICB0aGlzLmluZm9zW2luZGV4XS5yZWN5Y2xlKCk7XHJcbiAgICAgICAgdGhpcy5mcmVlSW5mb3NJbmRleC5wdXNoKGluZGV4KTtcclxuICAgIH1cclxuICAgIHN0YXRpYyBHZXRBcmdzQnlNb2NrSW50UHRyKHB0cikge1xyXG4gICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb0luZGV4ID0gcHRyID4+IDQ7XHJcbiAgICAgICAgY29uc3QgYXJnc0luZGV4ID0gcHRyICYgMTU7XHJcbiAgICAgICAgY29uc3QgaW5mbyA9IHRoaXMuaW5mb3NbY2FsbGJhY2tJbmZvSW5kZXhdO1xyXG4gICAgICAgIHJldHVybiBpbmZvLmFyZ3NbYXJnc0luZGV4XTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcclxuY2xhc3MgUmVmIHtcclxuICAgIHZhbHVlO1xyXG59XHJcbmV4cG9ydHMuUmVmID0gUmVmO1xyXG4vKipcclxuICog5Luj6KGo5LiA5LiqSlNGdW5jdGlvblxyXG4gKi9cclxuY2xhc3MgSlNGdW5jdGlvbiB7XHJcbiAgICBfZnVuYztcclxuICAgIGlkO1xyXG4gICAgYXJncyA9IFtdO1xyXG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XHJcbiAgICBjb25zdHJ1Y3RvcihpZCwgZnVuYykge1xyXG4gICAgICAgIHRoaXMuX2Z1bmMgPSBmdW5jO1xyXG4gICAgICAgIHRoaXMuaWQgPSBpZDtcclxuICAgIH1cclxuICAgIGludm9rZSgpIHtcclxuICAgICAgICB2YXIgYXJncyA9IFsuLi50aGlzLmFyZ3NdO1xyXG4gICAgICAgIHRoaXMuYXJncy5sZW5ndGggPSAwO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9mdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuSlNGdW5jdGlvbiA9IEpTRnVuY3Rpb247XHJcbi8qKlxyXG4gKiDku6PooajkuIDkuKpKU09iamVjdFxyXG4gKi9cclxuY2xhc3MgSlNPYmplY3Qge1xyXG4gICAgX29iajtcclxuICAgIGlkO1xyXG4gICAgY29uc3RydWN0b3IoaWQsIG9iaikge1xyXG4gICAgICAgIHRoaXMuX29iaiA9IG9iajtcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICB9XHJcbiAgICBnZXRPYmplY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX29iajtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkpTT2JqZWN0ID0gSlNPYmplY3Q7XHJcbmNsYXNzIGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnkge1xyXG4gICAgc3RhdGljIHJlZ3VsYXJJRCA9IDE7XHJcbiAgICBzdGF0aWMgaWRNYXAgPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgc3RhdGljIGpzRnVuY09yT2JqZWN0S1YgPSB7fTtcclxuICAgIHN0YXRpYyBnZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuY1ZhbHVlKSB7XHJcbiAgICAgICAgbGV0IGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5nZXQoZnVuY1ZhbHVlKTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZWd1bGFySUQrKztcclxuICAgICAgICBjb25zdCBmdW5jID0gbmV3IEpTRnVuY3Rpb24oaWQsIGZ1bmNWYWx1ZSk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5zZXQoZnVuY1ZhbHVlLCBpZCk7XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXSA9IGZ1bmM7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmM7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZ2V0T3JDcmVhdGVKU09iamVjdChvYmopIHtcclxuICAgICAgICBsZXQgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmdldChvYmopO1xyXG4gICAgICAgIGlmIChpZCkge1xyXG4gICAgICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlZ3VsYXJJRCsrO1xyXG4gICAgICAgIGNvbnN0IGpzT2JqZWN0ID0gbmV3IEpTT2JqZWN0KGlkLCBvYmopO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuc2V0KG9iaiwgaWQpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBqc09iamVjdDtcclxuICAgICAgICByZXR1cm4ganNPYmplY3Q7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZ2V0SlNPYmplY3RCeUlkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcmVtb3ZlSlNPYmplY3RCeUlkKGlkKSB7XHJcbiAgICAgICAgY29uc3QganNPYmplY3QgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZGVsZXRlKGpzT2JqZWN0LmdldE9iamVjdCgpKTtcclxuICAgICAgICBkZWxldGUganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgIH1cclxuICAgIHN0YXRpYyBnZXRKU0Z1bmN0aW9uQnlJZChpZCkge1xyXG4gICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHJlbW92ZUpTRnVuY3Rpb25CeUlkKGlkKSB7XHJcbiAgICAgICAgY29uc3QganNGdW5jID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmRlbGV0ZShqc0Z1bmMuX2Z1bmMpO1xyXG4gICAgICAgIGRlbGV0ZSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeSA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnk7XHJcbi8qKlxyXG4gKiBDU2hhcnDlr7nosaHorrDlvZXooajvvIzorrDlvZXmiYDmnIlDU2hhcnDlr7nosaHlubbliIbphY1pZFxyXG4gKiDlkoxwdWVydHMuZGxs5omA5YGa55qE5LiA5qC3XHJcbiAqL1xyXG5jbGFzcyBDU2hhcnBPYmplY3RNYXAge1xyXG4gICAgY2xhc3NlcyA9IFtudWxsXTtcclxuICAgIG5hdGl2ZU9iamVjdEtWID0gbmV3IE1hcCgpO1xyXG4gICAgLy8gcHJpdmF0ZSBuYXRpdmVPYmplY3RLVjogeyBbb2JqZWN0SUQ6IENTSWRlbnRpZmllcl06IFdlYWtSZWY8YW55PiB9ID0ge307XHJcbiAgICAvLyBwcml2YXRlIGNzSURXZWFrTWFwOiBXZWFrTWFwPGFueSwgQ1NJZGVudGlmaWVyPiA9IG5ldyBXZWFrTWFwKCk7XHJcbiAgICBuYW1lc1RvQ2xhc3Nlc0lEID0ge307XHJcbiAgICBjbGFzc0lEV2Vha01hcCA9IG5ldyBXZWFrTWFwKCk7XHJcbiAgICBhZGQoY3NJRCwgb2JqKSB7XHJcbiAgICAgICAgLy8gdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcclxuICAgICAgICAvLyB0aGlzLmNzSURXZWFrTWFwLnNldChvYmosIGNzSUQpO1xyXG4gICAgICAgIHRoaXMubmF0aXZlT2JqZWN0S1Yuc2V0KGNzSUQsIGNyZWF0ZVdlYWtSZWYob2JqKSk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgJ19wdWVydHNfY3NpZF8nLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBjc0lEXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZW1vdmUoY3NJRCkge1xyXG4gICAgICAgIC8vIGRlbGV0ZSB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdO1xyXG4gICAgICAgIHRoaXMubmF0aXZlT2JqZWN0S1YuZGVsZXRlKGNzSUQpO1xyXG4gICAgfVxyXG4gICAgZmluZE9yQWRkT2JqZWN0KGNzSUQsIGNsYXNzSUQpIHtcclxuICAgICAgICBsZXQgcmV0ID0gdGhpcy5uYXRpdmVPYmplY3RLVi5nZXQoY3NJRCk7XHJcbiAgICAgICAgLy8gbGV0IHJldCA9IHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF07XHJcbiAgICAgICAgaWYgKHJldCAmJiAocmV0ID0gcmV0LmRlcmVmKCkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldCA9IHRoaXMuY2xhc3Nlc1tjbGFzc0lEXS5jcmVhdGVGcm9tQ1MoY3NJRCk7XHJcbiAgICAgICAgLy8gdGhpcy5hZGQoY3NJRCwgcmV0KTsg5p6E6YCg5Ye95pWw6YeM6LSf6LSj6LCD55SoXHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIGdldENTSWRlbnRpZmllckZyb21PYmplY3Qob2JqKSB7XHJcbiAgICAgICAgLy8gcmV0dXJuIHRoaXMuY3NJRFdlYWtNYXAuZ2V0KG9iaik7XHJcbiAgICAgICAgcmV0dXJuIG9iai5fcHVlcnRzX2NzaWRfO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuQ1NoYXJwT2JqZWN0TWFwID0gQ1NoYXJwT2JqZWN0TWFwO1xyXG47XHJcbnZhciBkZXN0cnVjdG9ycyA9IHt9O1xyXG5leHBvcnRzLmdsb2JhbCA9IGdsb2JhbCA9IGdsb2JhbCB8fCBnbG9iYWxUaGlzIHx8IHdpbmRvdztcclxuZ2xvYmFsLmdsb2JhbCA9IGdsb2JhbDtcclxuY29uc3QgY3JlYXRlV2Vha1JlZiA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodHlwZW9mIFdlYWtSZWYgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBpZiAodHlwZW9mIFdYV2Vha1JlZiA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiV2Vha1JlZiBpcyBub3QgZGVmaW5lZC4gbWF5YmUgeW91IHNob3VsZCB1c2UgbmV3ZXIgZW52aXJvbm1lbnRcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBkZXJlZigpIHsgcmV0dXJuIG9iajsgfSB9O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLndhcm4oXCJ1c2luZyBXWFdlYWtSZWZcIik7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBXWFdlYWtSZWYob2JqKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcclxuICAgICAgICByZXR1cm4gbmV3IFdlYWtSZWYob2JqKTtcclxuICAgIH07XHJcbn0pKCk7XHJcbmV4cG9ydHMuY3JlYXRlV2Vha1JlZiA9IGNyZWF0ZVdlYWtSZWY7XHJcbmNsYXNzIEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9jayB7XHJcbiAgICBfaGFuZGxlcjtcclxuICAgIHJlZnMgPSBbXTtcclxuICAgIGhlbGRzID0gW107XHJcbiAgICBhdmFpbGFibGVJbmRleCA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IoaGFuZGxlcikge1xyXG4gICAgICAgIGNvbnNvbGUud2FybihcIkZpbmFsaXphdGlvblJlZ2lzdGVyIGlzIG5vdCBkZWZpbmVkLiB1c2luZyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2tcIik7XHJcbiAgICAgICAgZ2xvYmFsLl9wdWVydHNfcmVnaXN0cnkgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuX2hhbmRsZXIgPSBoYW5kbGVyO1xyXG4gICAgfVxyXG4gICAgcmVnaXN0ZXIob2JqLCBoZWxkVmFsdWUpIHtcclxuICAgICAgICBpZiAodGhpcy5hdmFpbGFibGVJbmRleC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmF2YWlsYWJsZUluZGV4LnBvcCgpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZnNbaW5kZXhdID0gY3JlYXRlV2Vha1JlZihvYmopO1xyXG4gICAgICAgICAgICB0aGlzLmhlbGRzW2luZGV4XSA9IGhlbGRWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVmcy5wdXNoKGNyZWF0ZVdlYWtSZWYob2JqKSk7XHJcbiAgICAgICAgICAgIHRoaXMuaGVsZHMucHVzaChoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog5riF6Zmk5Y+v6IO95bey57uP5aSx5pWI55qEV2Vha1JlZlxyXG4gICAgICovXHJcbiAgICBpdGVyYXRlUG9zaXRpb24gPSAwO1xyXG4gICAgY2xlYW51cChwYXJ0ID0gMSkge1xyXG4gICAgICAgIGNvbnN0IHN0ZXBDb3VudCA9IHRoaXMucmVmcy5sZW5ndGggLyBwYXJ0O1xyXG4gICAgICAgIGxldCBpID0gdGhpcy5pdGVyYXRlUG9zaXRpb247XHJcbiAgICAgICAgZm9yIChsZXQgY3VycmVudFN0ZXAgPSAwOyBpIDwgdGhpcy5yZWZzLmxlbmd0aCAmJiBjdXJyZW50U3RlcCA8IHN0ZXBDb3VudDsgaSA9IChpID09IHRoaXMucmVmcy5sZW5ndGggLSAxID8gMCA6IGkgKyAxKSwgY3VycmVudFN0ZXArKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5yZWZzW2ldID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWZzW2ldLmRlcmVmKCkpIHtcclxuICAgICAgICAgICAgICAgIC8vIOebruWJjeayoeacieWGheWtmOaVtOeQhuiDveWKm++8jOWmguaenOa4uOaIj+S4reacn3JlZuW+iOWkmuS9huWQjuacn+WwkeS6hu+8jOi/memHjOWwseS8mueZvei0uemBjeWOhuasoeaVsFxyXG4gICAgICAgICAgICAgICAgLy8g5L2G6YGN5Y6G5Lmf5Y+q5piv5LiA5Y+lPT3lkoxjb250aW51Ze+8jOa1qui0ueW9seWTjeS4jeWkp1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdmFpbGFibGVJbmRleC5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWZzW2ldID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlcih0aGlzLmhlbGRzW2ldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLml0ZXJhdGVQb3NpdGlvbiA9IGk7XHJcbiAgICB9XHJcbn1cclxudmFyIHJlZ2lzdHJ5ID0gbnVsbDtcclxuZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIHJlZ2lzdHJ5ID0gbmV3ICh0eXBlb2YgRmluYWxpemF0aW9uUmVnaXN0cnkgPT0gJ3VuZGVmaW5lZCcgPyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2sgOiBGaW5hbGl6YXRpb25SZWdpc3RyeSkoZnVuY3Rpb24gKGhlbGRWYWx1ZSkge1xyXG4gICAgICAgIHZhciBjYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XHJcbiAgICAgICAgaWYgKCFjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYW5ub3QgZmluZCBkZXN0cnVjdG9yIGZvciBcIiArIGhlbGRWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgtLWNhbGxiYWNrLnJlZiA9PSAwKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xyXG4gICAgICAgICAgICBjYWxsYmFjayhoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIE9uRmluYWxpemUob2JqLCBoZWxkVmFsdWUsIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAoIXJlZ2lzdHJ5KSB7XHJcbiAgICAgICAgaW5pdCgpO1xyXG4gICAgfVxyXG4gICAgbGV0IG9yaWdpbkNhbGxiYWNrID0gZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXTtcclxuICAgIGlmIChvcmlnaW5DYWxsYmFjaykge1xyXG4gICAgICAgIC8vIFdlYWtSZWblhoXlrrnph4rmlL7ml7bmnLrlj6/og73mr5RmaW5hbGl6YXRpb25SZWdpc3RyeeeahOinpuWPkeabtOaXqe+8jOWJjemdouWmguaenOWPkeeOsHdlYWtSZWbkuLrnqbrkvJrph43mlrDliJvlu7rlr7nosaFcclxuICAgICAgICAvLyDkvYbkuYvliY3lr7nosaHnmoRmaW5hbGl6YXRpb25SZWdpc3RyeeacgOe7iOWPiOiCr+WumuS8muinpuWPkeOAglxyXG4gICAgICAgIC8vIOaJgOS7peWmguaenOmBh+WIsOi/meS4quaDheWGte+8jOmcgOimgee7mWRlc3RydWN0b3LliqDorqHmlbBcclxuICAgICAgICArK29yaWdpbkNhbGxiYWNrLnJlZjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGNhbGxiYWNrLnJlZiA9IDE7XHJcbiAgICAgICAgZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXSA9IGNhbGxiYWNrO1xyXG4gICAgfVxyXG4gICAgcmVnaXN0cnkucmVnaXN0ZXIob2JqLCBoZWxkVmFsdWUpO1xyXG59XHJcbmV4cG9ydHMuT25GaW5hbGl6ZSA9IE9uRmluYWxpemU7XHJcbmNsYXNzIFB1ZXJ0c0pTRW5naW5lIHtcclxuICAgIGNzaGFycE9iamVjdE1hcDtcclxuICAgIHVuaXR5QXBpO1xyXG4gICAgbGFzdFJldHVybkNTUmVzdWx0ID0gbnVsbDtcclxuICAgIGxhc3RFeGNlcHRpb24gPSBudWxsO1xyXG4gICAgLy8g6L+Z5Zub5Liq5pivUHVlcnRzLldlYkdM6YeM55So5LqOd2FzbemAmuS/oeeahOeahENTaGFycCBDYWxsYmFja+WHveaVsOaMh+mSiOOAglxyXG4gICAgY2FsbFY4RnVuY3Rpb247XHJcbiAgICBjYWxsVjhDb25zdHJ1Y3RvcjtcclxuICAgIGNhbGxWOERlc3RydWN0b3I7XHJcbiAgICAvLyDov5nkuKTkuKrmmK9QdWVydHPnlKjnmoTnmoTnnJ/mraPnmoRDU2hhcnDlh73mlbDmjIfpkohcclxuICAgIEdldEpTQXJndW1lbnRzQ2FsbGJhY2s7XHJcbiAgICBnZW5lcmFsRGVzdHJ1Y3RvcjtcclxuICAgIGNvbnN0cnVjdG9yKGN0b3JQYXJhbSkge1xyXG4gICAgICAgIHRoaXMuY3NoYXJwT2JqZWN0TWFwID0gbmV3IENTaGFycE9iamVjdE1hcCgpO1xyXG4gICAgICAgIGNvbnN0IHsgVVRGOFRvU3RyaW5nLCBfbWFsbG9jLCBfbWVtY3B5LCBfZnJlZSwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHVuaXR5SW5zdGFuY2UgfSA9IGN0b3JQYXJhbTtcclxuICAgICAgICB0aGlzLnVuaXR5QXBpID0ge1xyXG4gICAgICAgICAgICBVVEY4VG9TdHJpbmcsXHJcbiAgICAgICAgICAgIF9tYWxsb2MsXHJcbiAgICAgICAgICAgIF9tZW1jcHksXHJcbiAgICAgICAgICAgIF9mcmVlLFxyXG4gICAgICAgICAgICBzdHJpbmdUb1VURjgsXHJcbiAgICAgICAgICAgIGxlbmd0aEJ5dGVzVVRGOCxcclxuICAgICAgICAgICAgZHluQ2FsbF9paWlpaTogdW5pdHlJbnN0YW5jZS5keW5DYWxsX2lpaWlpLmJpbmQodW5pdHlJbnN0YW5jZSksXHJcbiAgICAgICAgICAgIGR5bkNhbGxfdmlpaTogdW5pdHlJbnN0YW5jZS5keW5DYWxsX3ZpaWkuYmluZCh1bml0eUluc3RhbmNlKSxcclxuICAgICAgICAgICAgZHluQ2FsbF92aWlpaWk6IHVuaXR5SW5zdGFuY2UuZHluQ2FsbF92aWlpaWkuYmluZCh1bml0eUluc3RhbmNlKSxcclxuICAgICAgICAgICAgSEVBUDMyOiBudWxsLFxyXG4gICAgICAgICAgICBIRUFQODogbnVsbFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMudW5pdHlBcGksICdIRUFQMzInLCB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXR5SW5zdGFuY2UuSEVBUDMyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMudW5pdHlBcGksICdIRUFQOCcsIHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5pdHlJbnN0YW5jZS5IRUFQODtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGdsb2JhbC5fX3RnanNFdmFsU2NyaXB0ID0gdHlwZW9mIGV2YWwgPT0gXCJ1bmRlZmluZWRcIiA/ICgpID0+IHsgfSA6IGV2YWw7XHJcbiAgICAgICAgZ2xvYmFsLl9fdGdqc1NldFByb21pc2VSZWplY3RDYWxsYmFjayA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICB3eC5vblVuaGFuZGxlZFJlamVjdGlvbihjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVuaGFuZGxlZHJlamVjdGlvblwiLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIGdsb2JhbC5fX3B1ZXJ0c0dldExhc3RFeGNlcHRpb24gPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhc3RFeGNlcHRpb247XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIEpTU3RyaW5nVG9DU1N0cmluZyhyZXR1cm5TdHIsIC8qKiBvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xyXG4gICAgICAgIHNldE91dFZhbHVlMzIodGhpcywgbGVuZ3RoLCBieXRlQ291bnQpO1xyXG4gICAgICAgIHZhciBidWZmZXIgPSB0aGlzLnVuaXR5QXBpLl9tYWxsb2MoYnl0ZUNvdW50ICsgMSk7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5zdHJpbmdUb1VURjgocmV0dXJuU3RyLCBidWZmZXIsIGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICB9XHJcbiAgICBtYWtlVjhGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGZ1bmN0aW9uUHRyLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIC8vIOS4jeiDveeUqOeureWktOWHveaVsO+8geatpOWkhOi/lOWbnueahOWHveaVsOS8muaUvuWIsOWFt+S9k+eahGNsYXNz5LiK77yMdGhpc+acieWQq+S5ieOAglxyXG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XHJcbiAgICAgICAgICAgIGxldCBjYWxsYmFja0luZm9QdHIgPSBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0TW9ja1BvaW50ZXIoYXJncyk7XHJcbiAgICAgICAgICAgIGVuZ2luZS5jYWxsVjhGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBcclxuICAgICAgICAgICAgLy8gZ2V0SW50UHRyTWFuYWdlcigpLkdldFBvaW50ZXJGb3JKU1ZhbHVlKHRoaXMpLFxyXG4gICAgICAgICAgICBpc1N0YXRpYyA/IDAgOiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodGhpcyksIGNhbGxiYWNrSW5mb1B0ciwgYXJncy5sZW5ndGgsIGNhbGxiYWNrSWR4KTtcclxuICAgICAgICAgICAgcmV0dXJuIEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRSZXR1cm5WYWx1ZUFuZFJlY3ljbGUoY2FsbGJhY2tJbmZvUHRyKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgY2FsbFY4RnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5keW5DYWxsX3ZpaWlpaSh0aGlzLmNhbGxWOEZ1bmN0aW9uLCBmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgc2VsZlB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxuICAgIGNhbGxWOENvbnN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVuaXR5QXBpLmR5bkNhbGxfaWlpaWkodGhpcy5jYWxsVjhDb25zdHJ1Y3RvciwgZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbiAgICBjYWxsVjhEZXN0cnVjdG9yQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGNhbGxiYWNrSWR4KSB7XHJcbiAgICAgICAgdGhpcy51bml0eUFwaS5keW5DYWxsX3ZpaWkodGhpcy5jYWxsVjhEZXN0cnVjdG9yLCBmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBQdWVydHNKU0VuZ2luZTtcclxuZnVuY3Rpb24gR2V0VHlwZShlbmdpbmUsIHZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHJldHVybiA0O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJldHVybiA4O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuICAgICAgICByZXR1cm4gMTY7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gMjU2O1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xyXG4gICAgICAgIHJldHVybiA1MTI7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgIHJldHVybiAxMjg7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCB2YWx1ZSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgIH1cclxuICAgIGlmIChlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIDMyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIDY0O1xyXG59XHJcbmV4cG9ydHMuR2V0VHlwZSA9IEdldFR5cGU7XHJcbmZ1bmN0aW9uIG1ha2VCaWdJbnQobG93LCBoaWdoKSB7XHJcbiAgICByZXR1cm4gKEJpZ0ludChoaWdoID4+PiAwKSA8PCBCaWdJbnQoMzIpKSArIEJpZ0ludChsb3cgPj4+IDApO1xyXG59XHJcbmV4cG9ydHMubWFrZUJpZ0ludCA9IG1ha2VCaWdJbnQ7XHJcbmZ1bmN0aW9uIHNldE91dFZhbHVlMzIoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbdmFsdWVQdHIgPj4gMl0gPSB2YWx1ZTtcclxufVxyXG5leHBvcnRzLnNldE91dFZhbHVlMzIgPSBzZXRPdXRWYWx1ZTMyO1xyXG5mdW5jdGlvbiBzZXRPdXRWYWx1ZTgoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcclxuICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOFt2YWx1ZVB0cl0gPSB2YWx1ZTtcclxufVxyXG5leHBvcnRzLnNldE91dFZhbHVlOCA9IHNldE91dFZhbHVlODtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGlicmFyeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEpT6LCD55SoQyPml7bvvIxDI+S+p+iOt+WPlkpT6LCD55So5Y+C5pWw55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU0FyZ3VtZW50QVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBHZXROdW1iZXJGcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICByZXR1cm4gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldERhdGVGcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICByZXR1cm4gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRTdHJpbmdGcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgLypvdXQgaW50ICovIGxlbmd0aCwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICB2YXIgcmV0dXJuU3RyID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcocmV0dXJuU3RyLCBsZW5ndGgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0Qm9vbGVhbkZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgVmFsdWVJc0JpZ0ludDogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgIHZhciBiaWdpbnQgPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gYmlnaW50IGluc3RhbmNlb2YgQmlnSW50O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0QmlnSW50RnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgdmFyIGJpZ2ludCA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBiaWdpbnQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRPYmplY3RGcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICB2YXIgbmF0aXZlT2JqZWN0ID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChuYXRpdmVPYmplY3QpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0RnVuY3Rpb25Gcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICB2YXIgZnVuYyA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZnVuYyk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRKU09iamVjdEZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICB2YXIganNvYmogPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KG9iaik7XHJcbiAgICAgICAgICAgIHJldHVybiBqc29iai5pZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEFycmF5QnVmZmVyRnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIC8qb3V0IGludCAqLyBsZW5ndGgsIGlzT3V0KSB7XHJcbiAgICAgICAgICAgIHZhciBhYiA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIGlmIChhYiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcclxuICAgICAgICAgICAgICAgIGFiID0gYWIuYnVmZmVyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4LnNldChuZXcgSW50OEFycmF5KGFiKSwgcHRyKTtcclxuICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVAzMltsZW5ndGggPj4gMl0gPSBhYi5ieXRlTGVuZ3RoO1xyXG4gICAgICAgICAgICAoMCwgbGlicmFyeV8xLnNldE91dFZhbHVlMzIpKGVuZ2luZSwgbGVuZ3RoLCBhYi5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHB0cjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEFyZ3VtZW50VHlwZTogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGluZGV4LCBpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKS5hcmdzW2luZGV4XTtcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuR2V0VHlwZSkoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDkuLpjI+S+p+aPkOS+m+S4gOS4quiOt+WPlmNhbGxiYWNraW5mb+mHjGpzdmFsdWXnmoRpbnRwdHLnmoTmjqXlj6NcclxuICAgICAgICAgKiDlubbkuI3mmK/lvpfnmoTliLDov5nkuKphcmd1bWVudOeahOWAvFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEdldEFyZ3VtZW50VmFsdWUgLyppbkNhbGxiYWNrSW5mbyovOiBmdW5jdGlvbiAoaW5mb3B0ciwgaW5kZXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGluZm9wdHIgfCBpbmRleDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEpzVmFsdWVUeXBlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsLCBpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgIC8vIHB1YmxpYyBlbnVtIEpzVmFsdWVUeXBlXHJcbiAgICAgICAgICAgIC8vIHtcclxuICAgICAgICAgICAgLy8gICAgIE51bGxPclVuZGVmaW5lZCA9IDEsXHJcbiAgICAgICAgICAgIC8vICAgICBCaWdJbnQgPSAyLFxyXG4gICAgICAgICAgICAvLyAgICAgTnVtYmVyID0gNCxcclxuICAgICAgICAgICAgLy8gICAgIFN0cmluZyA9IDgsXHJcbiAgICAgICAgICAgIC8vICAgICBCb29sZWFuID0gMTYsXHJcbiAgICAgICAgICAgIC8vICAgICBOYXRpdmVPYmplY3QgPSAzMixcclxuICAgICAgICAgICAgLy8gICAgIEpzT2JqZWN0ID0gNjQsXHJcbiAgICAgICAgICAgIC8vICAgICBBcnJheSA9IDEyOCxcclxuICAgICAgICAgICAgLy8gICAgIEZ1bmN0aW9uID0gMjU2LFxyXG4gICAgICAgICAgICAvLyAgICAgRGF0ZSA9IDUxMixcclxuICAgICAgICAgICAgLy8gICAgIEFycmF5QnVmZmVyID0gMTAyNCxcclxuICAgICAgICAgICAgLy8gICAgIFVua25vdyA9IDIwNDgsXHJcbiAgICAgICAgICAgIC8vICAgICBBbnkgPSBOdWxsT3JVbmRlZmluZWQgfCBCaWdJbnQgfCBOdW1iZXIgfCBTdHJpbmcgfCBCb29sZWFuIHwgTmF0aXZlT2JqZWN0IHwgQXJyYXkgfCBGdW5jdGlvbiB8IERhdGUgfCBBcnJheUJ1ZmZlcixcclxuICAgICAgICAgICAgLy8gfTtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgbGlicmFyeV8xLkdldFR5cGUpKGVuZ2luZSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0VHlwZUlkRnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xyXG4gICAgICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IG9iai5fZnVuY1tcIiRjaWRcIl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSBvYmpbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdHlwZWlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBmaW5kIHR5cGVpZCBmb3InICsgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlaWQ7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kR2V0RnJvbUpTQXJndW1lbnRBUEk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEZyb21KU0FyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogQyPosIPnlKhKU+aXtu+8jOiOt+WPlkpT5Ye95pWw6L+U5Zue5YC8XHJcbiAqXHJcbiAqIOWOn+acieeahHJlc3VsdEluZm/orr7orqHlh7rmnaXlj6rmmK/kuLrkuoborqnlpJppc29sYXRl5pe26IO95Zyo5LiN5ZCM55qEaXNvbGF0ZemHjOS/neaMgeS4jeWQjOeahHJlc3VsdFxyXG4gKiDlnKhXZWJHTOaooeW8j+S4i+ayoeaciei/meS4queDpuaBvO+8jOWboOatpOebtOaOpeeUqGVuZ2luZeeahOWNs+WPr1xyXG4gKiByZXN1bHRJbmZv5Zu65a6a5Li6MTAyNFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRHZXRGcm9tSlNSZXR1cm5BUEkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIEdldE51bWJlckZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0RGF0ZUZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0LmdldFRpbWUoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldFN0cmluZ0Zyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvLCAvKm91dCBpbnQgKi8gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQsIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRCb29sZWFuRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXN1bHRJc0JpZ0ludDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgaW5zdGFuY2VvZiBCaWdJbnQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRCaWdJbnRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBpbXBsZW1lbnRlZCcpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0T2JqZWN0RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldFR5cGVJZEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gdmFsdWUuX2Z1bmNbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gdmFsdWVbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdHlwZWlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBmaW5kIHR5cGVpZCBmb3InICsgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRGdW5jdGlvbkZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBqc2Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTRnVuY3Rpb24oZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRKU09iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciBqc29iaiA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNPYmplY3QoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc29iai5pZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEFycmF5QnVmZmVyRnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGFiID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICAgICAgdmFyIHB0ciA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKGFiLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDguc2V0KG5ldyBJbnQ4QXJyYXkoYWIpLCBwdHIpO1xyXG4gICAgICAgICAgICAoMCwgbGlicmFyeV8xLnNldE91dFZhbHVlMzIpKGVuZ2luZSwgbGVuZ3RoLCBhYi5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHB0cjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8v5L+d5a6I5pa55qGIXHJcbiAgICAgICAgR2V0UmVzdWx0VHlwZTogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuR2V0VHlwZSkoZW5naW5lLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kR2V0RnJvbUpTUmV0dXJuQVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1nZXRGcm9tSlNSZXR1cm4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiDms6jlhoznsbtBUEnvvIzlpoLms6jlhozlhajlsYDlh73mlbDjgIHms6jlhoznsbvvvIzku6Xlj4rnsbvnmoTlsZ7mgKfmlrnms5XnrYlcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEkoZW5naW5lKSB7XHJcbiAgICBjb25zdCByZXR1cm5lZSA9IHtcclxuICAgICAgICBTZXRHbG9iYWxGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIG5hbWVTdHJpbmcsIHY4RnVuY3Rpb25DYWxsYmFjaywganNFbnZJZHgsIGNhbGxiYWNraWR4KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICBsaWJyYXJ5XzEuZ2xvYmFsW25hbWVdID0gZW5naW5lLm1ha2VWOEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbih0cnVlLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIGNhbGxiYWNraWR4KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIF9SZWdpc3RlckNsYXNzOiBmdW5jdGlvbiAoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCBqc0VudklkeCwgY2FsbGJhY2tpZHgsIHNpemUpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVsbE5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKGZ1bGxOYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgY29uc3QgY3NoYXJwT2JqZWN0TWFwID0gZW5naW5lLmNzaGFycE9iamVjdE1hcDtcclxuICAgICAgICAgICAgY29uc3QgaWQgPSBjc2hhcnBPYmplY3RNYXAuY2xhc3Nlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wRXh0ZXJuYWxDU0lEID0gMDtcclxuICAgICAgICAgICAgY29uc3QgY3RvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIOiuvue9ruexu+Wei0lEXHJcbiAgICAgICAgICAgICAgICB0aGlzW1wiJGNpZFwiXSA9IGlkO1xyXG4gICAgICAgICAgICAgICAgLy8gbmF0aXZlT2JqZWN055qE5p6E6YCg5Ye95pWwXHJcbiAgICAgICAgICAgICAgICAvLyDmnoTpgKDlh73mlbDmnInkuKTkuKrosIPnlKjnmoTlnLDmlrnvvJoxLiBqc+S+p25ld+S4gOS4quWug+eahOaXtuWAmSAyLiBjc+S+p+WIm+W7uuS6huS4gOS4quWvueixoeimgeS8oOWIsGpz5L6n5pe2XHJcbiAgICAgICAgICAgICAgICAvLyDnrKzkuIDkuKrmg4XlhrXvvIxjc+WvueixoUlE5oiW6ICF5pivY2FsbFY4Q29uc3RydWN0b3JDYWxsYmFja+i/lOWbnueahOOAglxyXG4gICAgICAgICAgICAgICAgLy8g56ys5LqM5Liq5oOF5Ya177yM5YiZY3Plr7nosaFJROaYr2NzIG5ld+WujOS5i+WQjuS4gOW5tuS8oOe7mWpz55qE44CCXHJcbiAgICAgICAgICAgICAgICBsZXQgY3NJRCA9IHRlbXBFeHRlcm5hbENTSUQ7IC8vIOWmguaenOaYr+esrOS6jOS4quaDheWGte+8jOatpElE55SxY3JlYXRlRnJvbUNT6K6+572uXHJcbiAgICAgICAgICAgICAgICB0ZW1wRXh0ZXJuYWxDU0lEID0gMDtcclxuICAgICAgICAgICAgICAgIGlmIChjc0lEID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tJbmZvUHRyID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRNb2NrUG9pbnRlcihhcmdzKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyDomb3nhLZwdWVydHPlhoVDb25zdHJ1Y3RvcueahOi/lOWbnuWAvOWPq3NlbGbvvIzkvYblroPlhbblrp7lsLHmmK9DU+WvueixoeeahOS4gOS4qmlk6ICM5bey44CCXHJcbiAgICAgICAgICAgICAgICAgICAgY3NJRCA9IGVuZ2luZS5jYWxsVjhDb25zdHJ1Y3RvckNhbGxiYWNrKGNvbnN0cnVjdG9yLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5SZWxlYXNlQnlNb2NrSW50UHRyKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBibGl0dGFibGVcclxuICAgICAgICAgICAgICAgIGlmIChzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNzTmV3SUQgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhzaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuX21lbWNweShjc05ld0lELCBjc0lELCBzaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuYWRkKGNzTmV3SUQsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICgwLCBsaWJyYXJ5XzEuT25GaW5hbGl6ZSkodGhpcywgY3NOZXdJRCwgKGNzSWRlbnRpZmllcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAucmVtb3ZlKGNzSWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5fZnJlZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc0lELCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzSUQsIChjc0lkZW50aWZpZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLnJlbW92ZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbFY4RGVzdHJ1Y3RvckNhbGxiYWNrKGRlc3RydWN0b3IgfHwgZW5naW5lLmdlbmVyYWxEZXN0cnVjdG9yLCBjc0lkZW50aWZpZXIsIGNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY3Rvci5jcmVhdGVGcm9tQ1MgPSBmdW5jdGlvbiAoY3NJRCkge1xyXG4gICAgICAgICAgICAgICAgdGVtcEV4dGVybmFsQ1NJRCA9IGNzSUQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGN0b3IoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY3Rvci5fX3B1ZXJ0c01ldGFkYXRhID0gbmV3IE1hcCgpO1xyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3RvciwgXCJuYW1lXCIsIHsgdmFsdWU6IGZ1bGxOYW1lICsgXCJDb25zdHJ1Y3RvclwiIH0pO1xyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3RvciwgXCIkY2lkXCIsIHsgdmFsdWU6IGlkIH0pO1xyXG4gICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuY2xhc3Nlcy5wdXNoKGN0b3IpO1xyXG4gICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuY2xhc3NJRFdlYWtNYXAuc2V0KGN0b3IsIGlkKTtcclxuICAgICAgICAgICAgaWYgKEJhc2VUeXBlSWQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjdG9yLnByb3RvdHlwZS5fX3Byb3RvX18gPSBjc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tCYXNlVHlwZUlkXS5wcm90b3R5cGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLm5hbWVzVG9DbGFzc2VzSURbZnVsbE5hbWVdID0gaWQ7XHJcbiAgICAgICAgICAgIHJldHVybiBpZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlZ2lzdGVyU3RydWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCAvKmxvbmcgKi8ganNFbnZJZHgsIGNhbGxiYWNraWR4LCBzaXplKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXR1cm5lZS5fUmVnaXN0ZXJDbGFzcyhpc29sYXRlLCBCYXNlVHlwZUlkLCBmdWxsTmFtZVN0cmluZywgY29uc3RydWN0b3IsIGRlc3RydWN0b3IsIGNhbGxiYWNraWR4LCBjYWxsYmFja2lkeCwgc2l6ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZWdpc3RlckZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgY2xhc3NJRCwgbmFtZVN0cmluZywgaXNTdGF0aWMsIGNhbGxiYWNrLCAvKmxvbmcgKi8ganNFbnZJZHgsIGNhbGxiYWNraWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBjbHMgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbY2xhc3NJRF07XHJcbiAgICAgICAgICAgIGlmICghY2xzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIHZhciBmbiA9IGVuZ2luZS5tYWtlVjhGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGNhbGxiYWNrLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgY2xzW25hbWVdID0gZm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjbHMucHJvdG90eXBlW25hbWVdID0gZm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIFJlZ2lzdGVyUHJvcGVydHk6IGZ1bmN0aW9uIChpc29sYXRlLCBjbGFzc0lELCBuYW1lU3RyaW5nLCBpc1N0YXRpYywgZ2V0dGVyLCBcclxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyanNFbnZJZHgsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBnZXR0ZXJjYWxsYmFja2lkeCwgc2V0dGVyLCBcclxuICAgICAgICAvKmxvbmcgKi8gc2V0dGVyanNFbnZJZHgsIFxyXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJjYWxsYmFja2lkeCwgZG9udERlbGV0ZSkge1xyXG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgICAgICBpZiAoIWNscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgYXR0ciA9IHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogIWRvbnREZWxldGUsXHJcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBhdHRyLmdldCA9IGVuZ2luZS5tYWtlVjhGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGdldHRlciwgZ2V0dGVyY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICBpZiAoc2V0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICBhdHRyLnNldCA9IGVuZ2luZS5tYWtlVjhGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIHNldHRlciwgc2V0dGVyY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscywgbmFtZSwgYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xzLnByb3RvdHlwZSwgbmFtZSwgYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgfTtcclxuICAgIHJldHVybiByZXR1cm5lZTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRSZWdpc3RlckFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmVnaXN0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBDI+iwg+eUqEpT5pe277yM6K6+572u6LCD55So5Y+C5pWw55qE5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSW52b2tlSlNBcmd1bWVudEFwaShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgLy9iZWdpbiBjcyBjYWxsIGpzXHJcbiAgICAgICAgUHVzaE51bGxGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChudWxsKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hEYXRlRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgZGF0ZVZhbHVlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChuZXcgRGF0ZShkYXRlVmFsdWUpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hCb29sZWFuRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgYikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goYik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoQmlnSW50Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypsb25nICovIGxvbmdsb3csIGxvbmdoaWdoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaCgoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvbmdsb3csIGxvbmdoaWdoKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoU3RyaW5nRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgc3RyU3RyaW5nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZykpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaE51bWJlckZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGQpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaE9iamVjdEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGNsYXNzSUQsIG9iamVjdElEKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChvYmplY3RJRCwgY2xhc3NJRCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEpTRnVuY3Rpb25Gb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBKU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChKU0Z1bmN0aW9uKS5fZnVuYyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoSlNPYmplY3RGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBKU09iamVjdCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNPYmplY3RCeUlkKEpTT2JqZWN0KS5nZXRPYmplY3QoKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoQXJyYXlCdWZmZXJGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKmJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9JbnZva2VKU0FyZ3VtZW50QXBpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0ludm9rZUpTQXJndW1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPorr7nva7ov5Tlm57liLBKU+eahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0pTSW52b2tlUmV0dXJuQXBpKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBSZXR1cm5DbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGNsYXNzSUQpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgY2xhc3NJRCwgc2VsZikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChzZWxmLCBjbGFzc0lEKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybk51bWJlcjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBudW1iZXI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5TdHJpbmc6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBzdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5CaWdJbnQ6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBsb25nTG93LCBsb25nSGlnaCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSAoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvbmdMb3csIGxvbmdIaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkJvb2xlYW46IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBiKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9ICEhYjsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkRhdGU6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBkYXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuTnVsbDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8pIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgSlNGdW5jdGlvblB0cikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjb25zdCBqc0Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChKU0Z1bmN0aW9uUHRyKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0ganNGdW5jLl9mdW5jO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuSlNPYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBKU09iamVjdFB0cikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjb25zdCBqc09iamVjdCA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTT2JqZWN0QnlJZChKU09iamVjdFB0cik7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGpzT2JqZWN0LmdldE9iamVjdCgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQ1NoYXJwRnVuY3Rpb25DYWxsYmFjazogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHY4RnVuY3Rpb25DYWxsYmFjaywgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJMb3csIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVySGlnaCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUubWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGZhbHNlLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIHBvaW50ZXJMb3cpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQXJyYXlCdWZmZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCAvKmJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRTZXRUb0pTSW52b2tlUmV0dXJuQXBpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0pTSW52b2tlUmV0dXJuLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogSlPosIPnlKhDI+aXtu+8jEMj5L6n6K6+572ub3V05Y+C5pWw5YC8XHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgU2V0TnVtYmVyVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBudW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG51bWJlcjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldERhdGVUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGRhdGUpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0U3RyaW5nVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gc3RyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0Qm9vbGVhblRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgYikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gISFiOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0QmlnSW50VG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCAvKmxvbmcgKi8gYmlnSW50KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRPYmplY3RUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGNsYXNzSUQsIHNlbGYpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9ialswXSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KHNlbGYsIGNsYXNzSUQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0TnVsbFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqWzBdID0gbnVsbDsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldEFycmF5QnVmZmVyVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCAvKkJ5dGVbXSAqLyBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmpbMF0gPSBlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLnNsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9KU091dEFyZ3VtZW50QVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0pTT3V0QXJndW1lbnQuanMubWFwIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuLyoqXHJcbiAqIOagueaNriBodHRwczovL2RvY3MudW5pdHkzZC5jb20vMjAxOC40L0RvY3VtZW50YXRpb24vTWFudWFsL3dlYmdsLWludGVyYWN0aW5nd2l0aGJyb3dzZXJzY3JpcHRpbmcuaHRtbFxyXG4gKiDmiJHku6znmoTnm67nmoTlsLHmmK/lnKhXZWJHTOaooeW8j+S4i++8jOWunueOsOWSjHB1ZXJ0cy5kbGznmoTmlYjmnpzjgILlhbfkvZPlnKjkuo7lrp7njrDkuIDkuKpqc2xpYu+8jOmHjOmdouW6lOWMheWQq1B1ZXJ0c0RMTC5jc+eahOaJgOacieaOpeWPo1xyXG4gKiDlrp7pqozlj5HnjrDov5nkuKpqc2xpYuiZveeEtuS5n+aYr+i/kOihjOWcqHY455qEanPvvIzkvYblr7lkZXZ0b29s6LCD6K+V5bm25LiN5Y+L5aW977yM5LiU5Y+q5pSv5oyB5YiwZXM144CCXHJcbiAqIOWboOatpOW6lOivpemAmui/h+S4gOS4queLrOeri+eahGpz5a6e546w5o6l5Y+j77yMcHVlcnRzLmpzbGli6YCa6L+H5YWo5bGA55qE5pa55byP6LCD55So5a6D44CCXHJcbiAqXHJcbiAqIOacgOe7iOW9ouaIkOWmguS4i+aetuaehFxyXG4gKiDkuJrliqFKUyA8LT4gV0FTTSA8LT4gdW5pdHkganNsaWIgPC0+IOacrGpzXHJcbiAqIOS9huaVtOadoemTvui3r+WFtuWunumDveWcqOS4gOS4qnY4KGpzY29yZSnomZrmi5/mnLrph4xcclxuICovXHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuL2xpYnJhcnlcIik7XHJcbmNvbnN0IGdldEZyb21KU0FyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvZ2V0RnJvbUpTQXJndW1lbnRcIik7XHJcbmNvbnN0IGdldEZyb21KU1JldHVybl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL2dldEZyb21KU1JldHVyblwiKTtcclxuY29uc3QgcmVnaXN0ZXJfMSA9IHJlcXVpcmUoXCIuL21peGlucy9yZWdpc3RlclwiKTtcclxuY29uc3Qgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9JbnZva2VKU0FyZ3VtZW50XCIpO1xyXG5jb25zdCBzZXRUb0pTSW52b2tlUmV0dXJuXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9KU0ludm9rZVJldHVyblwiKTtcclxuY29uc3Qgc2V0VG9KU091dEFyZ3VtZW50XzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9KU091dEFyZ3VtZW50XCIpO1xyXG5saWJyYXJ5XzEuZ2xvYmFsLnd4UmVxdWlyZSA9IGxpYnJhcnlfMS5nbG9iYWwucmVxdWlyZTtcclxubGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IHtcclxuICAgIGluaXRlZDogZmFsc2UsXHJcbiAgICBkZWJ1ZzogZmFsc2UsXHJcbiAgICAvLyBwdWVydHPpppbmrKHliJ3lp4vljJbml7bkvJrosIPnlKjov5nph4zvvIzlubbmiopVbml0eeeahOmAmuS/oeaOpeWPo+S8oOWFpVxyXG4gICAgSW5pdCh7IFVURjhUb1N0cmluZywgX21hbGxvYywgX21lbWNweSwgX2ZyZWUsIHN0cmluZ1RvVVRGOCwgbGVuZ3RoQnl0ZXNVVEY4LCB1bml0eUluc3RhbmNlIH0pIHtcclxuICAgICAgICBjb25zdCBlbmdpbmUgPSBuZXcgbGlicmFyeV8xLlB1ZXJ0c0pTRW5naW5lKHtcclxuICAgICAgICAgICAgVVRGOFRvU3RyaW5nLCBfbWFsbG9jLCBfbWVtY3B5LCBfZnJlZSwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHVuaXR5SW5zdGFuY2VcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBleGVjdXRlTW9kdWxlQ2FjaGUgPSB7fTtcclxuICAgICAgICBsZXQganNFbmdpbmVSZXR1cm5lZCA9IGZhbHNlO1xyXG4gICAgICAgIC8vIFB1ZXJ0c0RMTOeahOaJgOacieaOpeWPo+WunueOsFxyXG4gICAgICAgIGxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wgPSBPYmplY3QuYXNzaWduKGxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wsICgwLCBnZXRGcm9tSlNBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBnZXRGcm9tSlNSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9JbnZva2VKU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSlNJbnZva2VSZXR1cm5fMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU091dEFyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHJlZ2lzdGVyXzEuZGVmYXVsdCkoZW5naW5lKSwge1xyXG4gICAgICAgICAgICAvLyBicmlkZ2VMb2c6IHRydWUsXHJcbiAgICAgICAgICAgIFNldENhbGxWODogZnVuY3Rpb24gKGNhbGxWOEZ1bmN0aW9uLCBjYWxsVjhDb25zdHJ1Y3RvciwgY2FsbFY4RGVzdHJ1Y3Rvcikge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmNhbGxWOEZ1bmN0aW9uID0gY2FsbFY4RnVuY3Rpb247XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbFY4Q29uc3RydWN0b3IgPSBjYWxsVjhDb25zdHJ1Y3RvcjtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5jYWxsVjhEZXN0cnVjdG9yID0gY2FsbFY4RGVzdHJ1Y3RvcjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0TGliVmVyc2lvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDMwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRBcGlMZXZlbDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDMwO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBHZXRMaWJCYWNrZW5kOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSlNFbmdpbmU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChqc0VuZ2luZVJldHVybmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwib25seSBvbmUgYXZhaWxhYmxlIGpzRW52IGlzIGFsbG93ZWQgaW4gV2ViR0wgbW9kZVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGpzRW5naW5lUmV0dXJuZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENyZWF0ZUpTRW5naW5lV2l0aEV4dGVybmFsRW52OiBmdW5jdGlvbiAoKSB7IH0sXHJcbiAgICAgICAgICAgIERlc3Ryb3lKU0VuZ2luZTogZnVuY3Rpb24gKCkgeyB9LFxyXG4gICAgICAgICAgICBHZXRMYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKGlzb2xhdGUsIC8qIG91dCBpbnQgKi8gc3RybGVuKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhlbmdpbmUubGFzdEV4Y2VwdGlvbi5tZXNzYWdlLCBzdHJsZW4pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBMb3dNZW1vcnlOb3RpZmljYXRpb246IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIElkbGVOb3RpZmljYXRpb25EZWFkbGluZTogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgUmVxdWVzdE1pbm9yR2FyYmFnZUNvbGxlY3Rpb25Gb3JUZXN0aW5nOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBSZXF1ZXN0RnVsbEdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgU2V0R2VuZXJhbERlc3RydWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlLCBfZ2VuZXJhbERlc3RydWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciA9IF9nZW5lcmFsRGVzdHJ1Y3RvcjtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgU2V0TW9kdWxlUmVzb2x2ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgRXhlY3V0ZU1vZHVsZTogZnVuY3Rpb24gKGlzb2xhdGUsIHBhdGhTdHJpbmcsIGV4cG9ydGVlKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBmaWxlTmFtZSA9IFVURjhUb1N0cmluZyhwYXRoU3RyaW5nKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZU5hbWUuaW5kZXhPZignbG9nLm1qcycpICE9IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHd4UmVxdWlyZSgncHVlcnRzX21pbmlnYW1lX2pzX3Jlc291cmNlcy8nICsgKGZpbGVOYW1lLmVuZHNXaXRoKCcuanMnKSA/IGZpbGVOYW1lIDogZmlsZU5hbWUgKyBcIi5qc1wiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHBvcnRlZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IHJlc3VsdFtVVEY4VG9TdHJpbmcoZXhwb3J0ZWUpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBub3JtYWxpemUobmFtZSwgdG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnLi8nID09PSB0by5zdWJzdHJpbmcoMCwgMikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byA9IHRvLnN1YnN0cmluZygyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPSAobmFtZS5lbmRzV2l0aCgnLycpID8gbmFtZSA6IG5hbWUuc3Vic3RyaW5nKDAsIG5hbWUubGFzdEluZGV4T2YoJy8nKSArIDEpKSArIHRvO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aFNlZ3MgPSBuYW1lLnJlcGxhY2VBbGwoJy8vJywgJy8nKS5zcGxpdCgnLycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmV0UGF0aCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoU2Vncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoU2Vnc1tpXSA9PSAnLi4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXRQYXRoLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0UGF0aC5wdXNoKHBhdGhTZWdzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRQYXRoLmpvaW4oJy8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBtb2NrUmVxdWlyZShzcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgZXhwb3J0czoge30gfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kQ2FjaGVTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgZXhlY3V0ZU1vZHVsZUNhY2hlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZENhY2hlU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmV4cG9ydHMgPSBleGVjdXRlTW9kdWxlQ2FjaGVbZm91bmRDYWNoZVNwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZFNwZWNpZmllciA9IHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBQVUVSVFNfSlNfUkVTT1VSQ0VTKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZpbGUgbm90IGZvdW5kOiAnICsgc3BlY2lmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY2lmaWVyID0gZm91bmRTcGVjaWZpZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUFVFUlRTX0pTX1JFU09VUkNFU1tzcGVjaWZpZXJdKHJlc3VsdC5leHBvcnRzLCAoc3BlY2lmaWVyVG8pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vY2tSZXF1aXJlKG5vcm1hbGl6ZShzcGVjaWZpZXIsIHNwZWNpZmllclRvKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0cnlmaW5kID0gW3NwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5pbmRleE9mKCcuJykgPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeWZpbmQgPSB0cnlmaW5kLmNvbmNhdChbc3BlY2lmaWVyICsgJy5qcycsIHNwZWNpZmllciArICcudHMnLCBzcGVjaWZpZXIgKyAnLm1qcycsIHNwZWNpZmllciArICcubXRzJ10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlmaW5kLmZvckVhY2goKHMsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmRlZCA9IGZpbmRlZCAhPSAtMSA/IGZpbmRlZCA6ICghIW9ialtzXSA/IGluZGV4IDogLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaW5kZWQgPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ5ZmluZFtmaW5kZWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhwb3J0ZWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSByZXF1aXJlUmV0W1VURjhUb1N0cmluZyhleHBvcnRlZSldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IHJlcXVpcmVSZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdEV4Y2VwdGlvbiA9IGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEV2YWw6IGZ1bmN0aW9uIChpc29sYXRlLCBjb2RlU3RyaW5nLCBwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWxpYnJhcnlfMS5nbG9iYWwuZXZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImV2YWwgaXMgbm90IHN1cHBvcnRlZFwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBVVEY4VG9TdHJpbmcoY29kZVN0cmluZyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsaWJyYXJ5XzEuZ2xvYmFsLmV2YWwoY29kZSk7XHJcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gZ2V0SW50UHRyTWFuYWdlcigpLkdldFBvaW50ZXJGb3JKU1ZhbHVlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC8qRlJlc3VsdEluZm8gKi8gMTAyNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgU2V0UHVzaEpTRnVuY3Rpb25Bcmd1bWVudHNDYWxsYmFjazogZnVuY3Rpb24gKGlzb2xhdGUsIGNhbGxiYWNrLCBqc0VudklkeCkge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLkdldEpTQXJndW1lbnRzQ2FsbGJhY2sgPSBjYWxsYmFjaztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgVGhyb3dFeGNlcHRpb246IGZ1bmN0aW9uIChpc29sYXRlLCAvKmJ5dGVbXSAqLyBtZXNzYWdlU3RyaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoVVRGOFRvU3RyaW5nKG1lc3NhZ2VTdHJpbmcpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgSW52b2tlSlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgaGFzUmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gZnVuYy5pbnZva2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignSW52b2tlSlNGdW5jdGlvbiBlcnJvcicsIGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMubGFzdEV4Y2VwdGlvbiA9IGVycjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0RnVuY3Rpb25MYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnVuYyBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZnVuYy5sYXN0RXhjZXB0aW9uLm1lc3NhZ2UgfHwgJycsIGxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVsZWFzZUpTRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBfZnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlbW92ZUpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlbGVhc2VKU09iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIG9iaikge1xyXG4gICAgICAgICAgICAgICAgbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVtb3ZlSlNPYmplY3RCeUlkKG9iaik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlc2V0UmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IG51bGw7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENsZWFyTW9kdWxlQ2FjaGU6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgQ3JlYXRlSW5zcGVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgcG9ydCkgeyB9LFxyXG4gICAgICAgICAgICBEZXN0cm95SW5zcGVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBJbnNwZWN0b3JUaWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBMb2dpY1RpY2s6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFNldExvZ0NhbGxiYWNrOiBmdW5jdGlvbiAobG9nLCBsb2dXYXJuaW5nLCBsb2dFcnJvcikge1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==