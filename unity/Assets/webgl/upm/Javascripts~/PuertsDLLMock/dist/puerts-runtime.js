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
        const { UTF8ToString, _malloc, _memset, _memcpy, _free, stringToUTF8, lengthBytesUTF8, unityInstance } = ctorParam;
        this.unityApi = {
            UTF8ToString,
            _malloc,
            _memset,
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
        PushArrayBufferForJSFunction: function (_function, /*byte[] */ bytes, length) {
            const func = library_1.jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(new Uint8Array(engine.unityApi.HEAP8.buffer, bytes, length));
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
        ReturnArrayBuffer: function (isolate, info, /*byte[] */ bytes, Length) {
            var callbackInfo = library_1.FunctionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = new Uint8Array(engine.unityApi.HEAP8.buffer, bytes, Length);
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
            obj.value = number;
        },
        SetDateToOutValue: function (isolate, value, date) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj.value = new Date(date);
        },
        SetStringToOutValue: function (isolate, value, strString) {
            const str = engine.unityApi.UTF8ToString(strString);
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj.value = str;
        },
        SetBooleanToOutValue: function (isolate, value, b) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj.value = !!b; // 传过来的是1和0
        },
        SetBigIntToOutValue: function (isolate, value, /*long */ bigInt) {
            throw new Error('not implemented');
        },
        SetObjectToOutValue: function (isolate, value, classID, self) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj.value = engine.csharpObjectMap.findOrAddObject(self, classID);
        },
        SetNullToOutValue: function (isolate, value) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj.value = null; // 传过来的是1和0
        },
        SetArrayBufferToOutValue: function (isolate, value, /*Byte[] */ bytes, Length) {
            var obj = library_1.FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            obj.value = new Uint8Array(engine.unityApi.HEAP8.buffer, bytes, Length);
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
    Init({ UTF8ToString, _malloc, _memset, _memcpy, _free, stringToUTF8, lengthBytesUTF8, unityInstance }) {
        const engine = new library_1.PuertsJSEngine({
            UTF8ToString, _malloc, _memset, _memcpy, _free, stringToUTF8, lengthBytesUTF8, unityInstance
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
                return 19;
            },
            GetApiLevel: function () {
                return 19;
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
                        const result = wxRequire('puerts_minigame_js_resources/' + fileName.replace('.mjs', '.js').replace('.cjs', '.js'));
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
                            if (executeModuleCache[specifier]) {
                                result.exports = executeModuleCache[specifier];
                            }
                            else {
                                if (!PUERTS_JS_RESOURCES[specifier]) {
                                    console.error('file not found' + specifier);
                                }
                                PUERTS_JS_RESOURCES[specifier](result.exports, (specifierTo) => {
                                    return mockRequire(normalize(specifier, specifierTo));
                                }, result);
                                executeModuleCache[specifier] = result.exports;
                            }
                            return result.exports;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYix5REFBeUQ7QUFDekQsb0RBQW9EO0FBQ3BELGlEQUFpRDtBQUNqRCw2Q0FBNkM7QUFDN0M7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsaUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9vdXRwdXQvbGlicmFyeS5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL2dldEZyb21KU0FyZ3VtZW50LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvZ2V0RnJvbUpTUmV0dXJuLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvcmVnaXN0ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0ludm9rZUpTQXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0pTSW52b2tlUmV0dXJuLmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvc2V0VG9KU091dEFyZ3VtZW50LmpzIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLnNldE91dFZhbHVlOCA9IGV4cG9ydHMuc2V0T3V0VmFsdWUzMiA9IGV4cG9ydHMubWFrZUJpZ0ludCA9IGV4cG9ydHMuR2V0VHlwZSA9IGV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBleHBvcnRzLk9uRmluYWxpemUgPSBleHBvcnRzLmNyZWF0ZVdlYWtSZWYgPSBleHBvcnRzLmdsb2JhbCA9IGV4cG9ydHMuQ1NoYXJwT2JqZWN0TWFwID0gZXhwb3J0cy5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5ID0gZXhwb3J0cy5KU09iamVjdCA9IGV4cG9ydHMuSlNGdW5jdGlvbiA9IGV4cG9ydHMuUmVmID0gZXhwb3J0cy5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIgPSBleHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gdm9pZCAwO1xuLyoqXG4gKiDkuIDmrKHlh73mlbDosIPnlKjnmoRpbmZvXG4gKiDlr7nlupR2ODo6RnVuY3Rpb25DYWxsYmFja0luZm9cbiAqL1xuY2xhc3MgRnVuY3Rpb25DYWxsYmFja0luZm8ge1xuICAgIGFyZ3M7XG4gICAgcmV0dXJuVmFsdWU7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICB0aGlzLmFyZ3MgPSBhcmdzO1xuICAgIH1cbiAgICByZWN5Y2xlKCkge1xuICAgICAgICB0aGlzLmFyZ3MgPSBudWxsO1xuICAgICAgICB0aGlzLnJldHVyblZhbHVlID0gdm9pZCAwO1xuICAgIH1cbn1cbmV4cG9ydHMuRnVuY3Rpb25DYWxsYmFja0luZm8gPSBGdW5jdGlvbkNhbGxiYWNrSW5mbztcbi8qKlxuICog5oqKRnVuY3Rpb25DYWxsYmFja0luZm/ku6Xlj4rlhbblj4LmlbDovazljJbkuLpjI+WPr+eUqOeahGludHB0clxuICovXG5jbGFzcyBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIge1xuICAgIC8vIEZ1bmN0aW9uQ2FsbGJhY2tJbmZv55qE5YiX6KGo77yM5Lul5YiX6KGo55qEaW5kZXjkvZzkuLpJbnRQdHLnmoTlgLxcbiAgICBzdGF0aWMgaW5mb3MgPSBbbmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKFswXSldOyAvLyDov5nph4zljp/mnKzlj6rmmK/kuKrmma7pgJrnmoQwXG4gICAgLy8gRnVuY3Rpb25DYWxsYmFja0luZm/nlKjlrozlkI7vvIzlsLHlj6/ku6XmlL7lhaXlm57mlLbliJfooajvvIzku6XkvpvkuIvmrKHlpI3nlKhcbiAgICBzdGF0aWMgZnJlZUluZm9zSW5kZXggPSBbXTtcbiAgICAvKipcbiAgICAgKiBpbnRwdHLnmoTmoLzlvI/kuLppZOW3puenu+Wbm+S9jVxuICAgICAqXG4gICAgICog5Y+z5L6n5Zub5L2N5bCx5piv5Li65LqG5pS+5LiL5Y+C5pWw55qE5bqP5Y+377yM55So5LqO6KGo56S6Y2FsbGJhY2tpbmZv5Y+C5pWw55qEaW50cHRyXG4gICAgICovXG4gICAgc3RhdGljIEdldE1vY2tQb2ludGVyKGFyZ3MpIHtcbiAgICAgICAgbGV0IGluZGV4O1xuICAgICAgICBpbmRleCA9IHRoaXMuZnJlZUluZm9zSW5kZXgucG9wKCk7XG4gICAgICAgIC8vIGluZGV45pyA5bCP5Li6MVxuICAgICAgICBpZiAoaW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuaW5mb3NbaW5kZXhdLmFyZ3MgPSBhcmdzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaW5kZXggPSB0aGlzLmluZm9zLnB1c2gobmV3IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvKGFyZ3MpKSAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluZGV4IDw8IDQ7XG4gICAgfVxuICAgIHN0YXRpYyBHZXRCeU1vY2tQb2ludGVyKGludHB0cikge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmZvc1tpbnRwdHIgPj4gNF07XG4gICAgfVxuICAgIHN0YXRpYyBHZXRSZXR1cm5WYWx1ZUFuZFJlY3ljbGUoaW50cHRyKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gaW50cHRyID4+IDQ7XG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XG4gICAgICAgIGxldCByZXQgPSBpbmZvLnJldHVyblZhbHVlO1xuICAgICAgICBpbmZvLnJlY3ljbGUoKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgc3RhdGljIFJlbGVhc2VCeU1vY2tJbnRQdHIoaW50cHRyKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gaW50cHRyID4+IDQ7XG4gICAgICAgIHRoaXMuaW5mb3NbaW5kZXhdLnJlY3ljbGUoKTtcbiAgICAgICAgdGhpcy5mcmVlSW5mb3NJbmRleC5wdXNoKGluZGV4KTtcbiAgICB9XG4gICAgc3RhdGljIEdldEFyZ3NCeU1vY2tJbnRQdHIocHRyKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb0luZGV4ID0gcHRyID4+IDQ7XG4gICAgICAgIGNvbnN0IGFyZ3NJbmRleCA9IHB0ciAmIDE1O1xuICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5pbmZvc1tjYWxsYmFja0luZm9JbmRleF07XG4gICAgICAgIHJldHVybiBpbmZvLmFyZ3NbYXJnc0luZGV4XTtcbiAgICB9XG59XG5leHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlciA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlcjtcbmNsYXNzIFJlZiB7XG4gICAgdmFsdWU7XG59XG5leHBvcnRzLlJlZiA9IFJlZjtcbi8qKlxuICog5Luj6KGo5LiA5LiqSlNGdW5jdGlvblxuICovXG5jbGFzcyBKU0Z1bmN0aW9uIHtcbiAgICBfZnVuYztcbiAgICBpZDtcbiAgICBhcmdzID0gW107XG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XG4gICAgY29uc3RydWN0b3IoaWQsIGZ1bmMpIHtcbiAgICAgICAgdGhpcy5fZnVuYyA9IGZ1bmM7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICB9XG4gICAgaW52b2tlKCkge1xuICAgICAgICB2YXIgYXJncyA9IFsuLi50aGlzLmFyZ3NdO1xuICAgICAgICB0aGlzLmFyZ3MubGVuZ3RoID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Z1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxufVxuZXhwb3J0cy5KU0Z1bmN0aW9uID0gSlNGdW5jdGlvbjtcbi8qKlxuICog5Luj6KGo5LiA5LiqSlNPYmplY3RcbiAqL1xuY2xhc3MgSlNPYmplY3Qge1xuICAgIF9vYmo7XG4gICAgaWQ7XG4gICAgY29uc3RydWN0b3IoaWQsIG9iaikge1xuICAgICAgICB0aGlzLl9vYmogPSBvYmo7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICB9XG4gICAgZ2V0T2JqZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fb2JqO1xuICAgIH1cbn1cbmV4cG9ydHMuSlNPYmplY3QgPSBKU09iamVjdDtcbmNsYXNzIGpzRnVuY3Rpb25Pck9iamVjdEZhY3Rvcnkge1xuICAgIHN0YXRpYyByZWd1bGFySUQgPSAxO1xuICAgIHN0YXRpYyBpZE1hcCA9IG5ldyBXZWFrTWFwKCk7XG4gICAgc3RhdGljIGpzRnVuY09yT2JqZWN0S1YgPSB7fTtcbiAgICBzdGF0aWMgZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmNWYWx1ZSkge1xuICAgICAgICBsZXQgaWQgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmdldChmdW5jVmFsdWUpO1xuICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xuICAgICAgICB9XG4gICAgICAgIGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZWd1bGFySUQrKztcbiAgICAgICAgY29uc3QgZnVuYyA9IG5ldyBKU0Z1bmN0aW9uKGlkLCBmdW5jVmFsdWUpO1xuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLnNldChmdW5jVmFsdWUsIGlkKTtcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXSA9IGZ1bmM7XG4gICAgICAgIHJldHVybiBmdW5jO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0T3JDcmVhdGVKU09iamVjdChvYmopIHtcbiAgICAgICAgbGV0IGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5nZXQob2JqKTtcbiAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcbiAgICAgICAgfVxuICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XG4gICAgICAgIGNvbnN0IGpzT2JqZWN0ID0gbmV3IEpTT2JqZWN0KGlkLCBvYmopO1xuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLnNldChvYmosIGlkKTtcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXSA9IGpzT2JqZWN0O1xuICAgICAgICByZXR1cm4ganNPYmplY3Q7XG4gICAgfVxuICAgIHN0YXRpYyBnZXRKU09iamVjdEJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XG4gICAgfVxuICAgIHN0YXRpYyByZW1vdmVKU09iamVjdEJ5SWQoaWQpIHtcbiAgICAgICAgY29uc3QganNPYmplY3QgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmRlbGV0ZShqc09iamVjdC5nZXRPYmplY3QoKSk7XG4gICAgICAgIGRlbGV0ZSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0SlNGdW5jdGlvbkJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XG4gICAgfVxuICAgIHN0YXRpYyByZW1vdmVKU0Z1bmN0aW9uQnlJZChpZCkge1xuICAgICAgICBjb25zdCBqc0Z1bmMgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmRlbGV0ZShqc0Z1bmMuX2Z1bmMpO1xuICAgICAgICBkZWxldGUganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcbiAgICB9XG59XG5leHBvcnRzLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5O1xuLyoqXG4gKiBDU2hhcnDlr7nosaHorrDlvZXooajvvIzorrDlvZXmiYDmnIlDU2hhcnDlr7nosaHlubbliIbphY1pZFxuICog5ZKMcHVlcnRzLmRsbOaJgOWBmueahOS4gOagt1xuICovXG5jbGFzcyBDU2hhcnBPYmplY3RNYXAge1xuICAgIGNsYXNzZXMgPSBbbnVsbF07XG4gICAgbmF0aXZlT2JqZWN0S1YgPSBuZXcgTWFwKCk7XG4gICAgLy8gcHJpdmF0ZSBuYXRpdmVPYmplY3RLVjogeyBbb2JqZWN0SUQ6IENTSWRlbnRpZmllcl06IFdlYWtSZWY8YW55PiB9ID0ge307XG4gICAgLy8gcHJpdmF0ZSBjc0lEV2Vha01hcDogV2Vha01hcDxhbnksIENTSWRlbnRpZmllcj4gPSBuZXcgV2Vha01hcCgpO1xuICAgIG5hbWVzVG9DbGFzc2VzSUQgPSB7fTtcbiAgICBjbGFzc0lEV2Vha01hcCA9IG5ldyBXZWFrTWFwKCk7XG4gICAgYWRkKGNzSUQsIG9iaikge1xuICAgICAgICAvLyB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdID0gY3JlYXRlV2Vha1JlZihvYmopO1xuICAgICAgICAvLyB0aGlzLmNzSURXZWFrTWFwLnNldChvYmosIGNzSUQpO1xuICAgICAgICB0aGlzLm5hdGl2ZU9iamVjdEtWLnNldChjc0lELCBjcmVhdGVXZWFrUmVmKG9iaikpO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCAnX3B1ZXJ0c19jc2lkXycsIHtcbiAgICAgICAgICAgIHZhbHVlOiBjc0lEXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW1vdmUoY3NJRCkge1xuICAgICAgICAvLyBkZWxldGUgdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXTtcbiAgICAgICAgdGhpcy5uYXRpdmVPYmplY3RLVi5kZWxldGUoY3NJRCk7XG4gICAgfVxuICAgIGZpbmRPckFkZE9iamVjdChjc0lELCBjbGFzc0lEKSB7XG4gICAgICAgIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWLmdldChjc0lEKTtcbiAgICAgICAgLy8gbGV0IHJldCA9IHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF07XG4gICAgICAgIGlmIChyZXQgJiYgKHJldCA9IHJldC5kZXJlZigpKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfVxuICAgICAgICByZXQgPSB0aGlzLmNsYXNzZXNbY2xhc3NJRF0uY3JlYXRlRnJvbUNTKGNzSUQpO1xuICAgICAgICAvLyB0aGlzLmFkZChjc0lELCByZXQpOyDmnoTpgKDlh73mlbDph4zotJ/otKPosIPnlKhcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdChvYmopIHtcbiAgICAgICAgLy8gcmV0dXJuIHRoaXMuY3NJRFdlYWtNYXAuZ2V0KG9iaik7XG4gICAgICAgIHJldHVybiBvYmouX3B1ZXJ0c19jc2lkXztcbiAgICB9XG59XG5leHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IENTaGFycE9iamVjdE1hcDtcbjtcbnZhciBkZXN0cnVjdG9ycyA9IHt9O1xuZXhwb3J0cy5nbG9iYWwgPSBnbG9iYWwgPSBnbG9iYWwgfHwgZ2xvYmFsVGhpcyB8fCB3aW5kb3c7XG5nbG9iYWwuZ2xvYmFsID0gZ2xvYmFsO1xuY29uc3QgY3JlYXRlV2Vha1JlZiA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgV1hXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiV2Vha1JlZiBpcyBub3QgZGVmaW5lZC4gbWF5YmUgeW91IHNob3VsZCB1c2UgbmV3ZXIgZW52aXJvbm1lbnRcIik7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGRlcmVmKCkgeyByZXR1cm4gb2JqOyB9IH07XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUud2FybihcInVzaW5nIFdYV2Vha1JlZlwiKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgV1hXZWFrUmVmKG9iaik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBuZXcgV2Vha1JlZihvYmopO1xuICAgIH07XG59KSgpO1xuZXhwb3J0cy5jcmVhdGVXZWFrUmVmID0gY3JlYXRlV2Vha1JlZjtcbmNsYXNzIEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9jayB7XG4gICAgX2hhbmRsZXI7XG4gICAgcmVmcyA9IFtdO1xuICAgIGhlbGRzID0gW107XG4gICAgYXZhaWxhYmxlSW5kZXggPSBbXTtcbiAgICBjb25zdHJ1Y3RvcihoYW5kbGVyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIkZpbmFsaXphdGlvblJlZ2lzdGVyIGlzIG5vdCBkZWZpbmVkLiB1c2luZyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2tcIik7XG4gICAgICAgIGdsb2JhbC5fcHVlcnRzX3JlZ2lzdHJ5ID0gdGhpcztcbiAgICAgICAgdGhpcy5faGFuZGxlciA9IGhhbmRsZXI7XG4gICAgfVxuICAgIHJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLmF2YWlsYWJsZUluZGV4Lmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmF2YWlsYWJsZUluZGV4LnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5yZWZzW2luZGV4XSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcbiAgICAgICAgICAgIHRoaXMuaGVsZHNbaW5kZXhdID0gaGVsZFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZWZzLnB1c2goY3JlYXRlV2Vha1JlZihvYmopKTtcbiAgICAgICAgICAgIHRoaXMuaGVsZHMucHVzaChoZWxkVmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIOa4hemZpOWPr+iDveW3sue7j+WkseaViOeahFdlYWtSZWZcbiAgICAgKi9cbiAgICBpdGVyYXRlUG9zaXRpb24gPSAwO1xuICAgIGNsZWFudXAocGFydCA9IDEpIHtcbiAgICAgICAgY29uc3Qgc3RlcENvdW50ID0gdGhpcy5yZWZzLmxlbmd0aCAvIHBhcnQ7XG4gICAgICAgIGxldCBpID0gdGhpcy5pdGVyYXRlUG9zaXRpb247XG4gICAgICAgIGZvciAobGV0IGN1cnJlbnRTdGVwID0gMDsgaSA8IHRoaXMucmVmcy5sZW5ndGggJiYgY3VycmVudFN0ZXAgPCBzdGVwQ291bnQ7IGkgPSAoaSA9PSB0aGlzLnJlZnMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMSksIGN1cnJlbnRTdGVwKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlZnNbaV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlZnNbaV0uZGVyZWYoKSkge1xuICAgICAgICAgICAgICAgIC8vIOebruWJjeayoeacieWGheWtmOaVtOeQhuiDveWKm++8jOWmguaenOa4uOaIj+S4reacn3JlZuW+iOWkmuS9huWQjuacn+WwkeS6hu+8jOi/memHjOWwseS8mueZvei0uemBjeWOhuasoeaVsFxuICAgICAgICAgICAgICAgIC8vIOS9humBjeWOhuS5n+WPquaYr+S4gOWPpT095ZKMY29udGludWXvvIzmtarotLnlvbHlk43kuI3lpKdcbiAgICAgICAgICAgICAgICB0aGlzLmF2YWlsYWJsZUluZGV4LnB1c2goaSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVyKHRoaXMuaGVsZHNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLml0ZXJhdGVQb3NpdGlvbiA9IGk7XG4gICAgfVxufVxudmFyIHJlZ2lzdHJ5ID0gbnVsbDtcbmZ1bmN0aW9uIGluaXQoKSB7XG4gICAgcmVnaXN0cnkgPSBuZXcgKHR5cGVvZiBGaW5hbGl6YXRpb25SZWdpc3RyeSA9PSAndW5kZWZpbmVkJyA/IEZpbmFsaXphdGlvblJlZ2lzdHJ5TW9jayA6IEZpbmFsaXphdGlvblJlZ2lzdHJ5KShmdW5jdGlvbiAoaGVsZFZhbHVlKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbm5vdCBmaW5kIGRlc3RydWN0b3IgZm9yIFwiICsgaGVsZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoLS1jYWxsYmFjay5yZWYgPT0gMCkge1xuICAgICAgICAgICAgZGVsZXRlIGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XG4gICAgICAgICAgICBjYWxsYmFjayhoZWxkVmFsdWUpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5mdW5jdGlvbiBPbkZpbmFsaXplKG9iaiwgaGVsZFZhbHVlLCBjYWxsYmFjaykge1xuICAgIGlmICghcmVnaXN0cnkpIHtcbiAgICAgICAgaW5pdCgpO1xuICAgIH1cbiAgICBsZXQgb3JpZ2luQ2FsbGJhY2sgPSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xuICAgIGlmIChvcmlnaW5DYWxsYmFjaykge1xuICAgICAgICAvLyBXZWFrUmVm5YaF5a656YeK5pS+5pe25py65Y+v6IO95q+UZmluYWxpemF0aW9uUmVnaXN0cnnnmoTop6blj5Hmm7Tml6nvvIzliY3pnaLlpoLmnpzlj5HnjrB3ZWFrUmVm5Li656m65Lya6YeN5paw5Yib5bu65a+56LGhXG4gICAgICAgIC8vIOS9huS5i+WJjeWvueixoeeahGZpbmFsaXphdGlvblJlZ2lzdHJ55pyA57uI5Y+I6IKv5a6a5Lya6Kem5Y+R44CCXG4gICAgICAgIC8vIOaJgOS7peWmguaenOmBh+WIsOi/meS4quaDheWGte+8jOmcgOimgee7mWRlc3RydWN0b3LliqDorqHmlbBcbiAgICAgICAgKytvcmlnaW5DYWxsYmFjay5yZWY7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjYWxsYmFjay5yZWYgPSAxO1xuICAgICAgICBkZXN0cnVjdG9yc1toZWxkVmFsdWVdID0gY2FsbGJhY2s7XG4gICAgfVxuICAgIHJlZ2lzdHJ5LnJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKTtcbn1cbmV4cG9ydHMuT25GaW5hbGl6ZSA9IE9uRmluYWxpemU7XG5jbGFzcyBQdWVydHNKU0VuZ2luZSB7XG4gICAgY3NoYXJwT2JqZWN0TWFwO1xuICAgIHVuaXR5QXBpO1xuICAgIGxhc3RSZXR1cm5DU1Jlc3VsdCA9IG51bGw7XG4gICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XG4gICAgLy8g6L+Z5Zub5Liq5pivUHVlcnRzLldlYkdM6YeM55So5LqOd2FzbemAmuS/oeeahOeahENTaGFycCBDYWxsYmFja+WHveaVsOaMh+mSiOOAglxuICAgIGNhbGxWOEZ1bmN0aW9uO1xuICAgIGNhbGxWOENvbnN0cnVjdG9yO1xuICAgIGNhbGxWOERlc3RydWN0b3I7XG4gICAgLy8g6L+Z5Lik5Liq5pivUHVlcnRz55So55qE55qE55yf5q2j55qEQ1NoYXJw5Ye95pWw5oyH6ZKIXG4gICAgR2V0SlNBcmd1bWVudHNDYWxsYmFjaztcbiAgICBnZW5lcmFsRGVzdHJ1Y3RvcjtcbiAgICBjb25zdHJ1Y3RvcihjdG9yUGFyYW0pIHtcbiAgICAgICAgdGhpcy5jc2hhcnBPYmplY3RNYXAgPSBuZXcgQ1NoYXJwT2JqZWN0TWFwKCk7XG4gICAgICAgIGNvbnN0IHsgVVRGOFRvU3RyaW5nLCBfbWFsbG9jLCBfbWVtc2V0LCBfbWVtY3B5LCBfZnJlZSwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHVuaXR5SW5zdGFuY2UgfSA9IGN0b3JQYXJhbTtcbiAgICAgICAgdGhpcy51bml0eUFwaSA9IHtcbiAgICAgICAgICAgIFVURjhUb1N0cmluZyxcbiAgICAgICAgICAgIF9tYWxsb2MsXG4gICAgICAgICAgICBfbWVtc2V0LFxuICAgICAgICAgICAgX21lbWNweSxcbiAgICAgICAgICAgIF9mcmVlLFxuICAgICAgICAgICAgc3RyaW5nVG9VVEY4LFxuICAgICAgICAgICAgbGVuZ3RoQnl0ZXNVVEY4LFxuICAgICAgICAgICAgZHluQ2FsbF9paWlpaTogdW5pdHlJbnN0YW5jZS5keW5DYWxsX2lpaWlpLmJpbmQodW5pdHlJbnN0YW5jZSksXG4gICAgICAgICAgICBkeW5DYWxsX3ZpaWk6IHVuaXR5SW5zdGFuY2UuZHluQ2FsbF92aWlpLmJpbmQodW5pdHlJbnN0YW5jZSksXG4gICAgICAgICAgICBkeW5DYWxsX3ZpaWlpaTogdW5pdHlJbnN0YW5jZS5keW5DYWxsX3ZpaWlpaS5iaW5kKHVuaXR5SW5zdGFuY2UpLFxuICAgICAgICAgICAgSEVBUDMyOiBudWxsLFxuICAgICAgICAgICAgSEVBUDg6IG51bGxcbiAgICAgICAgfTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMudW5pdHlBcGksICdIRUFQMzInLCB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5pdHlJbnN0YW5jZS5IRUFQMzI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy51bml0eUFwaSwgJ0hFQVA4Jywge1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXR5SW5zdGFuY2UuSEVBUDg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBnbG9iYWwuX190Z2pzRXZhbFNjcmlwdCA9IHR5cGVvZiBldmFsID09IFwidW5kZWZpbmVkXCIgPyAoKSA9PiB7IH0gOiBldmFsO1xuICAgICAgICBnbG9iYWwuX190Z2pzU2V0UHJvbWlzZVJlamVjdENhbGxiYWNrID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgd3gub25VbmhhbmRsZWRSZWplY3Rpb24oY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBnbG9iYWwuX19wdWVydHNHZXRMYXN0RXhjZXB0aW9uID0gKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFzdEV4Y2VwdGlvbjtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgLyoqIG91dCBpbnQgKi8gbGVuZ3RoKSB7XG4gICAgICAgIGlmIChyZXR1cm5TdHIgPT09IG51bGwgfHwgcmV0dXJuU3RyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBieXRlQ291bnQgPSB0aGlzLnVuaXR5QXBpLmxlbmd0aEJ5dGVzVVRGOChyZXR1cm5TdHIpO1xuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aCwgYnl0ZUNvdW50KTtcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMudW5pdHlBcGkuX21hbGxvYyhieXRlQ291bnQgKyAxKTtcbiAgICAgICAgdGhpcy51bml0eUFwaS5zdHJpbmdUb1VURjgocmV0dXJuU3RyLCBidWZmZXIsIGJ5dGVDb3VudCArIDEpO1xuICAgICAgICByZXR1cm4gYnVmZmVyO1xuICAgIH1cbiAgICBtYWtlVjhGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGZ1bmN0aW9uUHRyLCBjYWxsYmFja0lkeCkge1xuICAgICAgICAvLyDkuI3og73nlKjnrq3lpLTlh73mlbDvvIHmraTlpITov5Tlm57nmoTlh73mlbDkvJrmlL7liLDlhbfkvZPnmoRjbGFzc+S4iu+8jHRoaXPmnInlkKvkuYnjgIJcbiAgICAgICAgY29uc3QgZW5naW5lID0gdGhpcztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgICBsZXQgY2FsbGJhY2tJbmZvUHRyID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xuICAgICAgICAgICAgZW5naW5lLmNhbGxWOEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIFxuICAgICAgICAgICAgLy8gZ2V0SW50UHRyTWFuYWdlcigpLkdldFBvaW50ZXJGb3JKU1ZhbHVlKHRoaXMpLFxuICAgICAgICAgICAgaXNTdGF0aWMgPyAwIDogZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHRoaXMpLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja0lkeCk7XG4gICAgICAgICAgICByZXR1cm4gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldFJldHVyblZhbHVlQW5kUmVjeWNsZShjYWxsYmFja0luZm9QdHIpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBjYWxsVjhGdW5jdGlvbkNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpIHtcbiAgICAgICAgdGhpcy51bml0eUFwaS5keW5DYWxsX3ZpaWlpaSh0aGlzLmNhbGxWOEZ1bmN0aW9uLCBmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgc2VsZlB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KTtcbiAgICB9XG4gICAgY2FsbFY4Q29uc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgaW5mb0ludFB0ciwgcGFyYW1MZW4sIGNhbGxiYWNrSWR4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVuaXR5QXBpLmR5bkNhbGxfaWlpaWkodGhpcy5jYWxsVjhDb25zdHJ1Y3RvciwgZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCk7XG4gICAgfVxuICAgIGNhbGxWOERlc3RydWN0b3JDYWxsYmFjayhmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpIHtcbiAgICAgICAgdGhpcy51bml0eUFwaS5keW5DYWxsX3ZpaWkodGhpcy5jYWxsVjhEZXN0cnVjdG9yLCBmdW5jdGlvblB0ciwgc2VsZlB0ciwgY2FsbGJhY2tJZHgpO1xuICAgIH1cbn1cbmV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBQdWVydHNKU0VuZ2luZTtcbmZ1bmN0aW9uIEdldFR5cGUoZW5naW5lLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiA0O1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiA4O1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xuICAgICAgICByZXR1cm4gMTY7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gMjU2O1xuICAgIH1cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgIHJldHVybiA1MTI7XG4gICAgfVxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIHJldHVybiAxMjg7XG4gICAgfVxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IHZhbHVlIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICByZXR1cm4gMTAyNDtcbiAgICB9XG4gICAgaWYgKGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZ2V0Q1NJZGVudGlmaWVyRnJvbU9iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIDMyO1xuICAgIH1cbiAgICByZXR1cm4gNjQ7XG59XG5leHBvcnRzLkdldFR5cGUgPSBHZXRUeXBlO1xuZnVuY3Rpb24gbWFrZUJpZ0ludChsb3csIGhpZ2gpIHtcbiAgICByZXR1cm4gKEJpZ0ludChoaWdoID4+PiAwKSA8PCBCaWdJbnQoMzIpKSArIEJpZ0ludChsb3cgPj4+IDApO1xufVxuZXhwb3J0cy5tYWtlQmlnSW50ID0gbWFrZUJpZ0ludDtcbmZ1bmN0aW9uIHNldE91dFZhbHVlMzIoZW5naW5lLCB2YWx1ZVB0ciwgdmFsdWUpIHtcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3ZhbHVlUHRyID4+IDJdID0gdmFsdWU7XG59XG5leHBvcnRzLnNldE91dFZhbHVlMzIgPSBzZXRPdXRWYWx1ZTMyO1xuZnVuY3Rpb24gc2V0T3V0VmFsdWU4KGVuZ2luZSwgdmFsdWVQdHIsIHZhbHVlKSB7XG4gICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4W3ZhbHVlUHRyXSA9IHZhbHVlO1xufVxuZXhwb3J0cy5zZXRPdXRWYWx1ZTggPSBzZXRPdXRWYWx1ZTg7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1saWJyYXJ5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XG4vKipcbiAqIG1peGluXG4gKiBKU+iwg+eUqEMj5pe277yMQyPkvqfojrflj5ZKU+iwg+eUqOWPguaVsOeahOWAvFxuICpcbiAqIEBwYXJhbSBlbmdpbmVcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU0FyZ3VtZW50QVBJKGVuZ2luZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIEdldE51bWJlckZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XG4gICAgICAgICAgICByZXR1cm4gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0RGF0ZUZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XG4gICAgICAgICAgICByZXR1cm4gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKS5nZXRUaW1lKCk7XG4gICAgICAgIH0sXG4gICAgICAgIEdldFN0cmluZ0Zyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCAvKm91dCBpbnQgKi8gbGVuZ3RoLCBpc0J5UmVmKSB7XG4gICAgICAgICAgICB2YXIgcmV0dXJuU3RyID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgbGVuZ3RoKTtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0Qm9vbGVhbkZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XG4gICAgICAgICAgICByZXR1cm4gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgVmFsdWVJc0JpZ0ludDogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XG4gICAgICAgICAgICB2YXIgYmlnaW50ID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBiaWdpbnQgaW5zdGFuY2VvZiBCaWdJbnQ7XG4gICAgICAgIH0sXG4gICAgICAgIEdldEJpZ0ludEZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XG4gICAgICAgICAgICB2YXIgYmlnaW50ID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBiaWdpbnQ7XG4gICAgICAgIH0sXG4gICAgICAgIEdldE9iamVjdEZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XG4gICAgICAgICAgICB2YXIgbmF0aXZlT2JqZWN0ID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QobmF0aXZlT2JqZWN0KTtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0RnVuY3Rpb25Gcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xuICAgICAgICAgICAgdmFyIGZ1bmMgPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xuICAgICAgICAgICAgdmFyIGpzZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldE9yQ3JlYXRlSlNGdW5jdGlvbihmdW5jKTtcbiAgICAgICAgICAgIHJldHVybiBqc2Z1bmMuaWQ7XG4gICAgICAgIH0sXG4gICAgICAgIEdldEpTT2JqZWN0RnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xuICAgICAgICAgICAgdmFyIGpzb2JqID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdChvYmopO1xuICAgICAgICAgICAgcmV0dXJuIGpzb2JqLmlkO1xuICAgICAgICB9LFxuICAgICAgICBHZXRBcnJheUJ1ZmZlckZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCAvKm91dCBpbnQgKi8gbGVuZ3RoLCBpc091dCkge1xuICAgICAgICAgICAgdmFyIGFiID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIGlmIChhYiBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICAgICAgICAgICAgICBhYiA9IGFiLmJ1ZmZlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XG4gICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW2xlbmd0aCA+PiAyXSA9IGFiLmJ5dGVMZW5ndGg7XG4gICAgICAgICAgICAoMCwgbGlicmFyeV8xLnNldE91dFZhbHVlMzIpKGVuZ2luZSwgbGVuZ3RoLCBhYi5ieXRlTGVuZ3RoKTtcbiAgICAgICAgICAgIHJldHVybiBwdHI7XG4gICAgICAgIH0sXG4gICAgICAgIEdldEFyZ3VtZW50VHlwZTogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGluZGV4LCBpc0J5UmVmKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbykuYXJnc1tpbmRleF07XG4gICAgICAgICAgICByZXR1cm4gKDAsIGxpYnJhcnlfMS5HZXRUeXBlKShlbmdpbmUsIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOS4umMj5L6n5o+Q5L6b5LiA5Liq6I635Y+WY2FsbGJhY2tpbmZv6YeManN2YWx1ZeeahGludHB0cueahOaOpeWPo1xuICAgICAgICAgKiDlubbkuI3mmK/lvpfnmoTliLDov5nkuKphcmd1bWVudOeahOWAvFxuICAgICAgICAgKi9cbiAgICAgICAgR2V0QXJndW1lbnRWYWx1ZSAvKmluQ2FsbGJhY2tJbmZvKi86IGZ1bmN0aW9uIChpbmZvcHRyLCBpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGluZm9wdHIgfCBpbmRleDtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0SnNWYWx1ZVR5cGU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWwsIGlzQnlSZWYpIHtcbiAgICAgICAgICAgIC8vIHB1YmxpYyBlbnVtIEpzVmFsdWVUeXBlXG4gICAgICAgICAgICAvLyB7XG4gICAgICAgICAgICAvLyAgICAgTnVsbE9yVW5kZWZpbmVkID0gMSxcbiAgICAgICAgICAgIC8vICAgICBCaWdJbnQgPSAyLFxuICAgICAgICAgICAgLy8gICAgIE51bWJlciA9IDQsXG4gICAgICAgICAgICAvLyAgICAgU3RyaW5nID0gOCxcbiAgICAgICAgICAgIC8vICAgICBCb29sZWFuID0gMTYsXG4gICAgICAgICAgICAvLyAgICAgTmF0aXZlT2JqZWN0ID0gMzIsXG4gICAgICAgICAgICAvLyAgICAgSnNPYmplY3QgPSA2NCxcbiAgICAgICAgICAgIC8vICAgICBBcnJheSA9IDEyOCxcbiAgICAgICAgICAgIC8vICAgICBGdW5jdGlvbiA9IDI1NixcbiAgICAgICAgICAgIC8vICAgICBEYXRlID0gNTEyLFxuICAgICAgICAgICAgLy8gICAgIEFycmF5QnVmZmVyID0gMTAyNCxcbiAgICAgICAgICAgIC8vICAgICBVbmtub3cgPSAyMDQ4LFxuICAgICAgICAgICAgLy8gICAgIEFueSA9IE51bGxPclVuZGVmaW5lZCB8IEJpZ0ludCB8IE51bWJlciB8IFN0cmluZyB8IEJvb2xlYW4gfCBOYXRpdmVPYmplY3QgfCBBcnJheSB8IEZ1bmN0aW9uIHwgRGF0ZSB8IEFycmF5QnVmZmVyLFxuICAgICAgICAgICAgLy8gfTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWwpO1xuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuR2V0VHlwZSkoZW5naW5lLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIEdldFR5cGVJZEZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XG4gICAgICAgICAgICB2YXIgb2JqID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xuICAgICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdHlwZWlkID0gb2JqLl9mdW5jW1wiJGNpZFwiXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHR5cGVpZCA9IG9ialtcIiRjaWRcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEZyb21KU0FyZ3VtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XG4vKipcbiAqIG1peGluXG4gKiBDI+iwg+eUqEpT5pe277yM6I635Y+WSlPlh73mlbDov5Tlm57lgLxcbiAqXG4gKiDljp/mnInnmoRyZXN1bHRJbmZv6K6+6K6h5Ye65p2l5Y+q5piv5Li65LqG6K6p5aSaaXNvbGF0ZeaXtuiDveWcqOS4jeWQjOeahGlzb2xhdGXph4zkv53mjIHkuI3lkIznmoRyZXN1bHRcbiAqIOWcqFdlYkdM5qih5byP5LiL5rKh5pyJ6L+Z5Liq54Om5oG877yM5Zug5q2k55u05o6l55SoZW5naW5l55qE5Y2z5Y+vXG4gKiByZXN1bHRJbmZv5Zu65a6a5Li6MTAyNFxuICpcbiAqIEBwYXJhbSBlbmdpbmVcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSShlbmdpbmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBHZXROdW1iZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XG4gICAgICAgIH0sXG4gICAgICAgIEdldERhdGVGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQuZ2V0VGltZSgpO1xuICAgICAgICB9LFxuICAgICAgICBHZXRTdHJpbmdGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCwgbGVuZ3RoKTtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0Qm9vbGVhbkZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcbiAgICAgICAgfSxcbiAgICAgICAgUmVzdWx0SXNCaWdJbnQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCBpbnN0YW5jZW9mIEJpZ0ludDtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0QmlnSW50RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJyk7XG4gICAgICAgIH0sXG4gICAgICAgIEdldE9iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xuICAgICAgICB9LFxuICAgICAgICBHZXRUeXBlSWRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcbiAgICAgICAgICAgIHZhciB0eXBlaWQgPSAwO1xuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSB2YWx1ZS5fZnVuY1tcIiRjaWRcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSB2YWx1ZVtcIiRjaWRcIl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGZpbmQgdHlwZWlkIGZvcicgKyB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xuICAgICAgICB9LFxuICAgICAgICBHZXRGdW5jdGlvbkZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xuICAgICAgICAgICAgcmV0dXJuIGpzZnVuYy5pZDtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0SlNPYmplY3RGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xuICAgICAgICAgICAgdmFyIGpzb2JqID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdChlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0KTtcbiAgICAgICAgICAgIHJldHVybiBqc29iai5pZDtcbiAgICAgICAgfSxcbiAgICAgICAgR2V0QXJyYXlCdWZmZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGFiID0gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcbiAgICAgICAgICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XG4gICAgICAgICAgICAoMCwgbGlicmFyeV8xLnNldE91dFZhbHVlMzIpKGVuZ2luZSwgbGVuZ3RoLCBhYi5ieXRlTGVuZ3RoKTtcbiAgICAgICAgICAgIHJldHVybiBwdHI7XG4gICAgICAgIH0sXG4gICAgICAgIC8v5L+d5a6I5pa55qGIXG4gICAgICAgIEdldFJlc3VsdFR5cGU6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xuICAgICAgICAgICAgcmV0dXJuICgwLCBsaWJyYXJ5XzEuR2V0VHlwZSkoZW5naW5lLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdldEZyb21KU1JldHVybi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xuLyoqXG4gKiBtaXhpblxuICog5rOo5YaM57G7QVBJ77yM5aaC5rOo5YaM5YWo5bGA5Ye95pWw44CB5rOo5YaM57G777yM5Lul5Y+K57G755qE5bGe5oCn5pa55rOV562JXG4gKlxuICogQHBhcmFtIGVuZ2luZVxuICogQHJldHVybnNcbiAqL1xuZnVuY3Rpb24gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEkoZW5naW5lKSB7XG4gICAgY29uc3QgcmV0dXJuZWUgPSB7XG4gICAgICAgIFNldEdsb2JhbEZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgbmFtZVN0cmluZywgdjhGdW5jdGlvbkNhbGxiYWNrLCBqc0VudklkeCwgY2FsbGJhY2tpZHgpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xuICAgICAgICAgICAgbGlicmFyeV8xLmdsb2JhbFtuYW1lXSA9IGVuZ2luZS5tYWtlVjhGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24odHJ1ZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBjYWxsYmFja2lkeCk7XG4gICAgICAgIH0sXG4gICAgICAgIF9SZWdpc3RlckNsYXNzOiBmdW5jdGlvbiAoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCBqc0VudklkeCwgY2FsbGJhY2tpZHgsIHNpemUpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxOYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhmdWxsTmFtZVN0cmluZyk7XG4gICAgICAgICAgICBjb25zdCBjc2hhcnBPYmplY3RNYXAgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwO1xuICAgICAgICAgICAgY29uc3QgaWQgPSBjc2hhcnBPYmplY3RNYXAuY2xhc3Nlcy5sZW5ndGg7XG4gICAgICAgICAgICBsZXQgdGVtcEV4dGVybmFsQ1NJRCA9IDA7XG4gICAgICAgICAgICBjb25zdCBjdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIOiuvue9ruexu+Wei0lEXG4gICAgICAgICAgICAgICAgdGhpc1tcIiRjaWRcIl0gPSBpZDtcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmVPYmplY3TnmoTmnoTpgKDlh73mlbBcbiAgICAgICAgICAgICAgICAvLyDmnoTpgKDlh73mlbDmnInkuKTkuKrosIPnlKjnmoTlnLDmlrnvvJoxLiBqc+S+p25ld+S4gOS4quWug+eahOaXtuWAmSAyLiBjc+S+p+WIm+W7uuS6huS4gOS4quWvueixoeimgeS8oOWIsGpz5L6n5pe2XG4gICAgICAgICAgICAgICAgLy8g56ys5LiA5Liq5oOF5Ya177yMY3Plr7nosaFJROaIluiAheaYr2NhbGxWOENvbnN0cnVjdG9yQ2FsbGJhY2vov5Tlm57nmoTjgIJcbiAgICAgICAgICAgICAgICAvLyDnrKzkuozkuKrmg4XlhrXvvIzliJljc+WvueixoUlE5pivY3MgbmV35a6M5LmL5ZCO5LiA5bm25Lyg57uZanPnmoTjgIJcbiAgICAgICAgICAgICAgICBsZXQgY3NJRCA9IHRlbXBFeHRlcm5hbENTSUQ7IC8vIOWmguaenOaYr+esrOS6jOS4quaDheWGte+8jOatpElE55SxY3JlYXRlRnJvbUNT6K6+572uXG4gICAgICAgICAgICAgICAgdGVtcEV4dGVybmFsQ1NJRCA9IDA7XG4gICAgICAgICAgICAgICAgaWYgKGNzSUQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb1B0ciA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0TW9ja1BvaW50ZXIoYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOiZveeEtnB1ZXJ0c+WGhUNvbnN0cnVjdG9y55qE6L+U5Zue5YC85Y+rc2VsZu+8jOS9huWug+WFtuWunuWwseaYr0NT5a+56LGh55qE5LiA5LiqaWTogIzlt7LjgIJcbiAgICAgICAgICAgICAgICAgICAgY3NJRCA9IGVuZ2luZS5jYWxsVjhDb25zdHJ1Y3RvckNhbGxiYWNrKGNvbnN0cnVjdG9yLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja2lkeCk7XG4gICAgICAgICAgICAgICAgICAgIGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBibGl0dGFibGVcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgY3NOZXdJRCA9IGVuZ2luZS51bml0eUFwaS5fbWFsbG9jKHNpemUpO1xuICAgICAgICAgICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuX21lbWNweShjc05ld0lELCBjc0lELCBzaXplKTtcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc05ld0lELCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5PbkZpbmFsaXplKSh0aGlzLCBjc05ld0lELCAoY3NJZGVudGlmaWVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAucmVtb3ZlKGNzSWRlbnRpZmllcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuX2ZyZWUoY3NJZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjc2hhcnBPYmplY3RNYXAuYWRkKGNzSUQsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzSUQsIChjc0lkZW50aWZpZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5yZW1vdmUoY3NJZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5jYWxsVjhEZXN0cnVjdG9yQ2FsbGJhY2soZGVzdHJ1Y3RvciB8fCBlbmdpbmUuZ2VuZXJhbERlc3RydWN0b3IsIGNzSWRlbnRpZmllciwgY2FsbGJhY2tpZHgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY3Rvci5jcmVhdGVGcm9tQ1MgPSBmdW5jdGlvbiAoY3NJRCkge1xuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSBjc0lEO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgY3RvcigpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGN0b3IuX19wdWVydHNNZXRhZGF0YSA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdG9yLCBcIm5hbWVcIiwgeyB2YWx1ZTogZnVsbE5hbWUgKyBcIkNvbnN0cnVjdG9yXCIgfSk7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3RvciwgXCIkY2lkXCIsIHsgdmFsdWU6IGlkIH0pO1xuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMucHVzaChjdG9yKTtcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5jbGFzc0lEV2Vha01hcC5zZXQoY3RvciwgaWQpO1xuICAgICAgICAgICAgaWYgKEJhc2VUeXBlSWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgY3Rvci5wcm90b3R5cGUuX19wcm90b19fID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbQmFzZVR5cGVJZF0ucHJvdG90eXBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLm5hbWVzVG9DbGFzc2VzSURbZnVsbE5hbWVdID0gaWQ7XG4gICAgICAgICAgICByZXR1cm4gaWQ7XG4gICAgICAgIH0sXG4gICAgICAgIFJlZ2lzdGVyU3RydWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCAvKmxvbmcgKi8ganNFbnZJZHgsIGNhbGxiYWNraWR4LCBzaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuZWUuX1JlZ2lzdGVyQ2xhc3MoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCBjYWxsYmFja2lkeCwgY2FsbGJhY2tpZHgsIHNpemUpO1xuICAgICAgICB9LFxuICAgICAgICBSZWdpc3RlckZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgY2xhc3NJRCwgbmFtZVN0cmluZywgaXNTdGF0aWMsIGNhbGxiYWNrLCAvKmxvbmcgKi8ganNFbnZJZHgsIGNhbGxiYWNraWR4KSB7XG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xuICAgICAgICAgICAgaWYgKCFjbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcbiAgICAgICAgICAgIHZhciBmbiA9IGVuZ2luZS5tYWtlVjhGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIGNhbGxiYWNrLCBjYWxsYmFja2lkeCk7XG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgICAgICAgICAgICBjbHNbbmFtZV0gPSBmbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNscy5wcm90b3R5cGVbbmFtZV0gPSBmbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgUmVnaXN0ZXJQcm9wZXJ0eTogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBnZXR0ZXIsIFxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyanNFbnZJZHgsIFxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyY2FsbGJhY2tpZHgsIHNldHRlciwgXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJqc0VudklkeCwgXG4gICAgICAgIC8qbG9uZyAqLyBzZXR0ZXJjYWxsYmFja2lkeCwgZG9udERlbGV0ZSkge1xuICAgICAgICAgICAgdmFyIGNscyA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcbiAgICAgICAgICAgIGlmICghY2xzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcobmFtZVN0cmluZyk7XG4gICAgICAgICAgICB2YXIgYXR0ciA9IHtcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6ICFkb250RGVsZXRlLFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYXR0ci5nZXQgPSBlbmdpbmUubWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBnZXR0ZXIsIGdldHRlcmNhbGxiYWNraWR4KTtcbiAgICAgICAgICAgIGlmIChzZXR0ZXIpIHtcbiAgICAgICAgICAgICAgICBhdHRyLnNldCA9IGVuZ2luZS5tYWtlVjhGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24oaXNTdGF0aWMsIHNldHRlciwgc2V0dGVyY2FsbGJhY2tpZHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzU3RhdGljKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscywgbmFtZSwgYXR0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2xzLnByb3RvdHlwZSwgbmFtZSwgYXR0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4gcmV0dXJuZWU7XG59XG5leHBvcnRzLmRlZmF1bHQgPSBXZWJHTEJhY2tlbmRSZWdpc3RlckFQSTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlZ2lzdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XG4vKipcbiAqIG1peGluXG4gKiBDI+iwg+eUqEpT5pe277yM6K6+572u6LCD55So5Y+C5pWw55qE5YC8XG4gKlxuICogQHBhcmFtIGVuZ2luZVxuICogQHJldHVybnNcbiAqL1xuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9JbnZva2VKU0FyZ3VtZW50QXBpKGVuZ2luZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vYmVnaW4gY3MgY2FsbCBqc1xuICAgICAgICBQdXNoTnVsbEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIFB1c2hEYXRlRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgZGF0ZVZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKG5ldyBEYXRlKGRhdGVWYWx1ZSkpO1xuICAgICAgICB9LFxuICAgICAgICBQdXNoQm9vbGVhbkZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGIpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goYik7XG4gICAgICAgIH0sXG4gICAgICAgIFB1c2hCaWdJbnRGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCAvKmxvbmcgKi8gbG9uZ2xvdywgbG9uZ2hpZ2gpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb25nbG93LCBsb25naGlnaCkpO1xuICAgICAgICB9LFxuICAgICAgICBQdXNoU3RyaW5nRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgc3RyU3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGVuZ2luZS51bml0eUFwaS5VVEY4VG9TdHJpbmcoc3RyU3RyaW5nKSk7XG4gICAgICAgIH0sXG4gICAgICAgIFB1c2hOdW1iZXJGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBkKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGQpO1xuICAgICAgICB9LFxuICAgICAgICBQdXNoT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgY2xhc3NJRCwgb2JqZWN0SUQpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qob2JqZWN0SUQsIGNsYXNzSUQpKTtcbiAgICAgICAgfSxcbiAgICAgICAgUHVzaEpTRnVuY3Rpb25Gb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBKU0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKEpTRnVuY3Rpb24pLl9mdW5jKTtcbiAgICAgICAgfSxcbiAgICAgICAgUHVzaEpTT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNPYmplY3RCeUlkKEpTT2JqZWN0KS5nZXRPYmplY3QoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIFB1c2hBcnJheUJ1ZmZlckZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qYnl0ZVtdICovIGJ5dGVzLCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobmV3IFVpbnQ4QXJyYXkoZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlciwgYnl0ZXMsIGxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSW52b2tlSlNBcmd1bWVudEFwaTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSW52b2tlSlNBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xuLyoqXG4gKiBtaXhpblxuICogSlPosIPnlKhDI+aXtu+8jEMj6K6+572u6L+U5Zue5YiwSlPnmoTlgLxcbiAqXG4gKiBAcGFyYW0gZW5naW5lXG4gKiBAcmV0dXJuc1xuICovXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0pTSW52b2tlUmV0dXJuQXBpKGVuZ2luZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIFJldHVybkNsYXNzOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgY2xhc3NJRCkge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgY2xhc3NJRCwgc2VsZikge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuZmluZE9yQWRkT2JqZWN0KHNlbGYsIGNsYXNzSUQpO1xuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5OdW1iZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBudW1iZXI7XG4gICAgICAgIH0sXG4gICAgICAgIFJldHVyblN0cmluZzogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHN0clN0cmluZykge1xuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IHN0cjtcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuQmlnSW50OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgbG9uZ0xvdywgbG9uZ0hpZ2gpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSAoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvbmdMb3csIGxvbmdIaWdoKTtcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuQm9vbGVhbjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGIpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSAhIWI7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXG4gICAgICAgIH0sXG4gICAgICAgIFJldHVybkRhdGU6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBkYXRlKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbmV3IERhdGUoZGF0ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIFJldHVybk51bGw6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBKU0Z1bmN0aW9uUHRyKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY29uc3QganNGdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoSlNGdW5jdGlvblB0cik7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBqc0Z1bmMuX2Z1bmM7XG4gICAgICAgIH0sXG4gICAgICAgIFJldHVybkpTT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgSlNPYmplY3RQdHIpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XG4gICAgICAgICAgICBjb25zdCBqc09iamVjdCA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTT2JqZWN0QnlJZChKU09iamVjdFB0cik7XG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBqc09iamVjdC5nZXRPYmplY3QoKTtcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuQ1NoYXJwRnVuY3Rpb25DYWxsYmFjazogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHY4RnVuY3Rpb25DYWxsYmFjaywgXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVyTG93LCBcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJIaWdoKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLm1ha2VWOEZ1bmN0aW9uQ2FsbGJhY2tGdW5jdGlvbihmYWxzZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBwb2ludGVyTG93KTtcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuQXJyYXlCdWZmZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCAvKmJ5dGVbXSAqLyBieXRlcywgTGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbmV3IFVpbnQ4QXJyYXkoZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlciwgYnl0ZXMsIExlbmd0aCk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSlNJbnZva2VSZXR1cm5BcGk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0pTSW52b2tlUmV0dXJuLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XG4vKipcbiAqIG1peGluXG4gKiBKU+iwg+eUqEMj5pe277yMQyPkvqforr7nva5vdXTlj4LmlbDlgLxcbiAqXG4gKiBAcGFyYW0gZW5naW5lXG4gKiBAcmV0dXJuc1xuICovXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0pTT3V0QXJndW1lbnRBUEkoZW5naW5lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgU2V0TnVtYmVyVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xuICAgICAgICAgICAgb2JqLnZhbHVlID0gbnVtYmVyO1xuICAgICAgICB9LFxuICAgICAgICBTZXREYXRlVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBkYXRlKSB7XG4gICAgICAgICAgICB2YXIgb2JqID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcbiAgICAgICAgICAgIG9iai52YWx1ZSA9IG5ldyBEYXRlKGRhdGUpO1xuICAgICAgICB9LFxuICAgICAgICBTZXRTdHJpbmdUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIHN0clN0cmluZykge1xuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xuICAgICAgICAgICAgdmFyIG9iaiA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmoudmFsdWUgPSBzdHI7XG4gICAgICAgIH0sXG4gICAgICAgIFNldEJvb2xlYW5Ub091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGIpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xuICAgICAgICAgICAgb2JqLnZhbHVlID0gISFiOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxuICAgICAgICB9LFxuICAgICAgICBTZXRCaWdJbnRUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIC8qbG9uZyAqLyBiaWdJbnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJyk7XG4gICAgICAgIH0sXG4gICAgICAgIFNldE9iamVjdFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgY2xhc3NJRCwgc2VsZikge1xuICAgICAgICAgICAgdmFyIG9iaiA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmoudmFsdWUgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChzZWxmLCBjbGFzc0lEKTtcbiAgICAgICAgfSxcbiAgICAgICAgU2V0TnVsbFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIG9iaiA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmoudmFsdWUgPSBudWxsOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxuICAgICAgICB9LFxuICAgICAgICBTZXRBcnJheUJ1ZmZlclRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgLypCeXRlW10gKi8gYnl0ZXMsIExlbmd0aCkge1xuICAgICAgICAgICAgdmFyIG9iaiA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XG4gICAgICAgICAgICBvYmoudmFsdWUgPSBuZXcgVWludDhBcnJheShlbmdpbmUudW5pdHlBcGkuSEVBUDguYnVmZmVyLCBieXRlcywgTGVuZ3RoKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9KU091dEFyZ3VtZW50QVBJO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9KU091dEFyZ3VtZW50LmpzLm1hcCIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiDmoLnmja4gaHR0cHM6Ly9kb2NzLnVuaXR5M2QuY29tLzIwMTguNC9Eb2N1bWVudGF0aW9uL01hbnVhbC93ZWJnbC1pbnRlcmFjdGluZ3dpdGhicm93c2Vyc2NyaXB0aW5nLmh0bWxcbiAqIOaIkeS7rOeahOebrueahOWwseaYr+WcqFdlYkdM5qih5byP5LiL77yM5a6e546w5ZKMcHVlcnRzLmRsbOeahOaViOaenOOAguWFt+S9k+WcqOS6juWunueOsOS4gOS4qmpzbGli77yM6YeM6Z2i5bqU5YyF5ZCrUHVlcnRzRExMLmNz55qE5omA5pyJ5o6l5Y+jXG4gKiDlrp7pqozlj5HnjrDov5nkuKpqc2xpYuiZveeEtuS5n+aYr+i/kOihjOWcqHY455qEanPvvIzkvYblr7lkZXZ0b29s6LCD6K+V5bm25LiN5Y+L5aW977yM5LiU5Y+q5pSv5oyB5YiwZXM144CCXG4gKiDlm6DmraTlupTor6XpgJrov4fkuIDkuKrni6znq4vnmoRqc+WunueOsOaOpeWPo++8jHB1ZXJ0cy5qc2xpYumAmui/h+WFqOWxgOeahOaWueW8j+iwg+eUqOWug+OAglxuICpcbiAqIOacgOe7iOW9ouaIkOWmguS4i+aetuaehFxuICog5Lia5YqhSlMgPC0+IFdBU00gPC0+IHVuaXR5IGpzbGliIDwtPiDmnKxqc1xuICog5L2G5pW05p2h6ZO+6Lev5YW25a6e6YO95Zyo5LiA5LiqdjgoanNjb3JlKeiZmuaLn+acuumHjFxuICovXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi9saWJyYXJ5XCIpO1xuY29uc3QgZ2V0RnJvbUpTQXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9nZXRGcm9tSlNBcmd1bWVudFwiKTtcbmNvbnN0IGdldEZyb21KU1JldHVybl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL2dldEZyb21KU1JldHVyblwiKTtcbmNvbnN0IHJlZ2lzdGVyXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvcmVnaXN0ZXJcIik7XG5jb25zdCBzZXRUb0ludm9rZUpTQXJndW1lbnRfMSA9IHJlcXVpcmUoXCIuL21peGlucy9zZXRUb0ludm9rZUpTQXJndW1lbnRcIik7XG5jb25zdCBzZXRUb0pTSW52b2tlUmV0dXJuXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvc2V0VG9KU0ludm9rZVJldHVyblwiKTtcbmNvbnN0IHNldFRvSlNPdXRBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSlNPdXRBcmd1bWVudFwiKTtcbmxpYnJhcnlfMS5nbG9iYWwud3hSZXF1aXJlID0gbGlicmFyeV8xLmdsb2JhbC5yZXF1aXJlO1xubGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IHtcbiAgICBpbml0ZWQ6IGZhbHNlLFxuICAgIGRlYnVnOiBmYWxzZSxcbiAgICAvLyBwdWVydHPpppbmrKHliJ3lp4vljJbml7bkvJrosIPnlKjov5nph4zvvIzlubbmiopVbml0eeeahOmAmuS/oeaOpeWPo+S8oOWFpVxuICAgIEluaXQoeyBVVEY4VG9TdHJpbmcsIF9tYWxsb2MsIF9tZW1zZXQsIF9tZW1jcHksIF9mcmVlLCBzdHJpbmdUb1VURjgsIGxlbmd0aEJ5dGVzVVRGOCwgdW5pdHlJbnN0YW5jZSB9KSB7XG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IG5ldyBsaWJyYXJ5XzEuUHVlcnRzSlNFbmdpbmUoe1xuICAgICAgICAgICAgVVRGOFRvU3RyaW5nLCBfbWFsbG9jLCBfbWVtc2V0LCBfbWVtY3B5LCBfZnJlZSwgc3RyaW5nVG9VVEY4LCBsZW5ndGhCeXRlc1VURjgsIHVuaXR5SW5zdGFuY2VcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGV4ZWN1dGVNb2R1bGVDYWNoZSA9IHt9O1xuICAgICAgICBsZXQganNFbmdpbmVSZXR1cm5lZCA9IGZhbHNlO1xuICAgICAgICAvLyBQdWVydHNETEznmoTmiYDmnInmjqXlj6Plrp7njrBcbiAgICAgICAgbGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCA9IE9iamVjdC5hc3NpZ24obGlicmFyeV8xLmdsb2JhbC5QdWVydHNXZWJHTCwgKDAsIGdldEZyb21KU0FyZ3VtZW50XzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIGdldEZyb21KU1JldHVybl8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBzZXRUb0ludm9rZUpTQXJndW1lbnRfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgc2V0VG9KU0ludm9rZVJldHVybl8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBzZXRUb0pTT3V0QXJndW1lbnRfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgcmVnaXN0ZXJfMS5kZWZhdWx0KShlbmdpbmUpLCB7XG4gICAgICAgICAgICAvLyBicmlkZ2VMb2c6IHRydWUsXG4gICAgICAgICAgICBTZXRDYWxsVjg6IGZ1bmN0aW9uIChjYWxsVjhGdW5jdGlvbiwgY2FsbFY4Q29uc3RydWN0b3IsIGNhbGxWOERlc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbFY4RnVuY3Rpb24gPSBjYWxsVjhGdW5jdGlvbjtcbiAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbFY4Q29uc3RydWN0b3IgPSBjYWxsVjhDb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbFY4RGVzdHJ1Y3RvciA9IGNhbGxWOERlc3RydWN0b3I7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgR2V0TGliVmVyc2lvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAxOTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHZXRBcGlMZXZlbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAxOTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBHZXRMaWJCYWNrZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQ3JlYXRlSlNFbmdpbmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoanNFbmdpbmVSZXR1cm5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJvbmx5IG9uZSBhdmFpbGFibGUganNFbnYgaXMgYWxsb3dlZCBpbiBXZWJHTCBtb2RlXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqc0VuZ2luZVJldHVybmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBDcmVhdGVKU0VuZ2luZVdpdGhFeHRlcm5hbEVudjogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgRGVzdHJveUpTRW5naW5lOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICBHZXRMYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKGlzb2xhdGUsIC8qIG91dCBpbnQgKi8gc3RybGVuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZW5naW5lLmxhc3RFeGNlcHRpb24ubWVzc2FnZSwgc3RybGVuKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBMb3dNZW1vcnlOb3RpZmljYXRpb246IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXG4gICAgICAgICAgICBJZGxlTm90aWZpY2F0aW9uRGVhZGxpbmU6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXG4gICAgICAgICAgICBSZXF1ZXN0TWlub3JHYXJiYWdlQ29sbGVjdGlvbkZvclRlc3Rpbmc6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXG4gICAgICAgICAgICBSZXF1ZXN0RnVsbEdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcbiAgICAgICAgICAgIFNldEdlbmVyYWxEZXN0cnVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2dlbmVyYWxEZXN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgZW5naW5lLmdlbmVyYWxEZXN0cnVjdG9yID0gX2dlbmVyYWxEZXN0cnVjdG9yO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFNldE1vZHVsZVJlc29sdmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRXhlY3V0ZU1vZHVsZTogZnVuY3Rpb24gKGlzb2xhdGUsIHBhdGhTdHJpbmcsIGV4cG9ydGVlKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpbGVOYW1lID0gVVRGOFRvU3RyaW5nKHBhdGhTdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZU5hbWUuaW5kZXhPZignbG9nLm1qcycpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHd4ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB3eFJlcXVpcmUoJ3B1ZXJ0c19taW5pZ2FtZV9qc19yZXNvdXJjZXMvJyArIGZpbGVOYW1lLnJlcGxhY2UoJy5tanMnLCAnLmpzJykucmVwbGFjZSgnLmNqcycsICcuanMnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhwb3J0ZWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gcmVzdWx0W1VURjhUb1N0cmluZyhleHBvcnRlZSldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplKG5hbWUsIHRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCcuLycgPT09IHRvLnN1YnN0cmluZygwLCAyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byA9IHRvLnN1YnN0cmluZygyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA9IChuYW1lLmVuZHNXaXRoKCcvJykgPyBuYW1lIDogbmFtZS5zdWJzdHJpbmcoMCwgbmFtZS5sYXN0SW5kZXhPZignLycpICsgMSkpICsgdG87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aFNlZ3MgPSBuYW1lLnJlcGxhY2VBbGwoJy8vJywgJy8nKS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldFBhdGggPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGhTZWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoU2Vnc1tpXSA9PSAnLi4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0UGF0aC5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0UGF0aC5wdXNoKHBhdGhTZWdzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldFBhdGguam9pbignLycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gbW9ja1JlcXVpcmUoc3BlY2lmaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyBleHBvcnRzOiB7fSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuZXhwb3J0cyA9IGV4ZWN1dGVNb2R1bGVDYWNoZVtzcGVjaWZpZXJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFQVUVSVFNfSlNfUkVTT1VSQ0VTW3NwZWNpZmllcl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZpbGUgbm90IGZvdW5kJyArIHNwZWNpZmllcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUFVFUlRTX0pTX1JFU09VUkNFU1tzcGVjaWZpZXJdKHJlc3VsdC5leHBvcnRzLCAoc3BlY2lmaWVyVG8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2NrUmVxdWlyZShub3JtYWxpemUoc3BlY2lmaWVyLCBzcGVjaWZpZXJUbykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IHJlc3VsdC5leHBvcnRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LmV4cG9ydHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cG9ydGVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IHJlcXVpcmVSZXRbVVRGOFRvU3RyaW5nKGV4cG9ydGVlKV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gcmVxdWlyZVJldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0RXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRXZhbDogZnVuY3Rpb24gKGlzb2xhdGUsIGNvZGVTdHJpbmcsIHBhdGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWxpYnJhcnlfMS5nbG9iYWwuZXZhbCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJldmFsIGlzIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBVVEY4VG9TdHJpbmcoY29kZVN0cmluZyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gbGlicmFyeV8xLmdsb2JhbC5ldmFsKGNvZGUpO1xuICAgICAgICAgICAgICAgIC8vIHJldHVybiBnZXRJbnRQdHJNYW5hZ2VyKCkuR2V0UG9pbnRlckZvckpTVmFsdWUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIHJldHVybiAvKkZSZXN1bHRJbmZvICovIDEwMjQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgU2V0UHVzaEpTRnVuY3Rpb25Bcmd1bWVudHNDYWxsYmFjazogZnVuY3Rpb24gKGlzb2xhdGUsIGNhbGxiYWNrLCBqc0VudklkeCkge1xuICAgICAgICAgICAgICAgIGVuZ2luZS5HZXRKU0FyZ3VtZW50c0NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgVGhyb3dFeGNlcHRpb246IGZ1bmN0aW9uIChpc29sYXRlLCAvKmJ5dGVbXSAqLyBtZXNzYWdlU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFVURjhUb1N0cmluZyhtZXNzYWdlU3RyaW5nKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgSW52b2tlSlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgaGFzUmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKGZ1bmMgaW5zdGFuY2VvZiBsaWJyYXJ5XzEuSlNGdW5jdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IGZ1bmMuaW52b2tlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZva2VKU0Z1bmN0aW9uIGVycm9yJywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMubGFzdEV4Y2VwdGlvbiA9IGVycjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwdHIgaXMgbm90IGEganNmdW5jJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEdldEZ1bmN0aW9uTGFzdEV4Y2VwdGlvbkluZm86IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qb3V0IGludCAqLyBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoZnVuYyBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKGZ1bmMubGFzdEV4Y2VwdGlvbi5tZXNzYWdlIHx8ICcnLCBsZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwdHIgaXMgbm90IGEganNmdW5jJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFJlbGVhc2VKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2Z1bmN0aW9uKSB7XG4gICAgICAgICAgICAgICAgbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVtb3ZlSlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBSZWxlYXNlSlNPYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBvYmopIHtcbiAgICAgICAgICAgICAgICBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZW1vdmVKU09iamVjdEJ5SWQob2JqKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBSZXNldFJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcbiAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBDcmVhdGVJbnNwZWN0b3I6IGZ1bmN0aW9uIChpc29sYXRlLCBwb3J0KSB7IH0sXG4gICAgICAgICAgICBEZXN0cm95SW5zcGVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxuICAgICAgICAgICAgSW5zcGVjdG9yVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcbiAgICAgICAgICAgIExvZ2ljVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcbiAgICAgICAgICAgIFNldExvZ0NhbGxiYWNrOiBmdW5jdGlvbiAobG9nLCBsb2dXYXJuaW5nLCBsb2dFcnJvcikge1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9