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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiLHlEQUF5RDtBQUN6RCxvREFBb0Q7QUFDcEQsaURBQWlEO0FBQ2pELDZDQUE2QztBQUM3QztBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxpQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL291dHB1dC9saWJyYXJ5LmpzIiwid2VicGFjazovLy8uL291dHB1dC9taXhpbnMvZ2V0RnJvbUpTQXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9nZXRGcm9tSlNSZXR1cm4uanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9yZWdpc3Rlci5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSW52b2tlSlNBcmd1bWVudC5qcyIsIndlYnBhY2s6Ly8vLi9vdXRwdXQvbWl4aW5zL3NldFRvSlNJbnZva2VSZXR1cm4uanMiLCJ3ZWJwYWNrOi8vLy4vb3V0cHV0L21peGlucy9zZXRUb0pTT3V0QXJndW1lbnQuanMiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovLy8uL291dHB1dC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLnNldE91dFZhbHVlOCA9IGV4cG9ydHMuc2V0T3V0VmFsdWUzMiA9IGV4cG9ydHMubWFrZUJpZ0ludCA9IGV4cG9ydHMuR2V0VHlwZSA9IGV4cG9ydHMuUHVlcnRzSlNFbmdpbmUgPSBleHBvcnRzLk9uRmluYWxpemUgPSBleHBvcnRzLmNyZWF0ZVdlYWtSZWYgPSBleHBvcnRzLmdsb2JhbCA9IGV4cG9ydHMuQ1NoYXJwT2JqZWN0TWFwID0gZXhwb3J0cy5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5ID0gZXhwb3J0cy5KU09iamVjdCA9IGV4cG9ydHMuSlNGdW5jdGlvbiA9IGV4cG9ydHMuUmVmID0gZXhwb3J0cy5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIgPSBleHBvcnRzLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvID0gdm9pZCAwO1xyXG4vKipcclxuICog5LiA5qyh5Ye95pWw6LCD55So55qEaW5mb1xyXG4gKiDlr7nlupR2ODo6RnVuY3Rpb25DYWxsYmFja0luZm9cclxuICovXHJcbmNsYXNzIEZ1bmN0aW9uQ2FsbGJhY2tJbmZvIHtcclxuICAgIGFyZ3M7XHJcbiAgICByZXR1cm5WYWx1ZTtcclxuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcclxuICAgICAgICB0aGlzLmFyZ3MgPSBhcmdzO1xyXG4gICAgfVxyXG4gICAgcmVjeWNsZSgpIHtcclxuICAgICAgICB0aGlzLmFyZ3MgPSBudWxsO1xyXG4gICAgICAgIHRoaXMucmV0dXJuVmFsdWUgPSB2b2lkIDA7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5GdW5jdGlvbkNhbGxiYWNrSW5mbyA9IEZ1bmN0aW9uQ2FsbGJhY2tJbmZvO1xyXG4vKipcclxuICog5oqKRnVuY3Rpb25DYWxsYmFja0luZm/ku6Xlj4rlhbblj4LmlbDovazljJbkuLpjI+WPr+eUqOeahGludHB0clxyXG4gKi9cclxuY2xhc3MgRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyIHtcclxuICAgIC8vIEZ1bmN0aW9uQ2FsbGJhY2tJbmZv55qE5YiX6KGo77yM5Lul5YiX6KGo55qEaW5kZXjkvZzkuLpJbnRQdHLnmoTlgLxcclxuICAgIHN0YXRpYyBpbmZvcyA9IFtuZXcgRnVuY3Rpb25DYWxsYmFja0luZm8oWzBdKV07IC8vIOi/memHjOWOn+acrOWPquaYr+S4quaZrumAmueahDBcclxuICAgIC8vIEZ1bmN0aW9uQ2FsbGJhY2tJbmZv55So5a6M5ZCO77yM5bCx5Y+v5Lul5pS+5YWl5Zue5pS25YiX6KGo77yM5Lul5L6b5LiL5qyh5aSN55SoXHJcbiAgICBzdGF0aWMgZnJlZUluZm9zSW5kZXggPSBbXTtcclxuICAgIC8qKlxyXG4gICAgICogaW50cHRy55qE5qC85byP5Li6aWTlt6bnp7vlm5vkvY1cclxuICAgICAqXHJcbiAgICAgKiDlj7Pkvqflm5vkvY3lsLHmmK/kuLrkuobmlL7kuIvlj4LmlbDnmoTluo/lj7fvvIznlKjkuo7ooajnpLpjYWxsYmFja2luZm/lj4LmlbDnmoRpbnRwdHJcclxuICAgICAqL1xyXG4gICAgc3RhdGljIEdldE1vY2tQb2ludGVyKGFyZ3MpIHtcclxuICAgICAgICBsZXQgaW5kZXg7XHJcbiAgICAgICAgaW5kZXggPSB0aGlzLmZyZWVJbmZvc0luZGV4LnBvcCgpO1xyXG4gICAgICAgIC8vIGluZGV45pyA5bCP5Li6MVxyXG4gICAgICAgIGlmIChpbmRleCkge1xyXG4gICAgICAgICAgICB0aGlzLmluZm9zW2luZGV4XS5hcmdzID0gYXJncztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy5pbmZvcy5wdXNoKG5ldyBGdW5jdGlvbkNhbGxiYWNrSW5mbyhhcmdzKSkgLSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaW5kZXggPDwgNDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBHZXRCeU1vY2tQb2ludGVyKGludHB0cikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmluZm9zW2ludHB0ciA+PiA0XTtcclxuICAgIH1cclxuICAgIHN0YXRpYyBHZXRSZXR1cm5WYWx1ZUFuZFJlY3ljbGUoaW50cHRyKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBpbnRwdHIgPj4gNDtcclxuICAgICAgICB0aGlzLmZyZWVJbmZvc0luZGV4LnB1c2goaW5kZXgpO1xyXG4gICAgICAgIGxldCBpbmZvID0gdGhpcy5pbmZvc1tpbmRleF07XHJcbiAgICAgICAgbGV0IHJldCA9IGluZm8ucmV0dXJuVmFsdWU7XHJcbiAgICAgICAgaW5mby5yZWN5Y2xlKCk7XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBSZWxlYXNlQnlNb2NrSW50UHRyKGludHB0cikge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gaW50cHRyID4+IDQ7XHJcbiAgICAgICAgdGhpcy5pbmZvc1tpbmRleF0ucmVjeWNsZSgpO1xyXG4gICAgICAgIHRoaXMuZnJlZUluZm9zSW5kZXgucHVzaChpbmRleCk7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgR2V0QXJnc0J5TW9ja0ludFB0cihwdHIpIHtcclxuICAgICAgICBjb25zdCBjYWxsYmFja0luZm9JbmRleCA9IHB0ciA+PiA0O1xyXG4gICAgICAgIGNvbnN0IGFyZ3NJbmRleCA9IHB0ciAmIDE1O1xyXG4gICAgICAgIGNvbnN0IGluZm8gPSB0aGlzLmluZm9zW2NhbGxiYWNrSW5mb0luZGV4XTtcclxuICAgICAgICByZXR1cm4gaW5mby5hcmdzW2FyZ3NJbmRleF07XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIgPSBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXI7XHJcbmNsYXNzIFJlZiB7XHJcbiAgICB2YWx1ZTtcclxufVxyXG5leHBvcnRzLlJlZiA9IFJlZjtcclxuLyoqXHJcbiAqIOS7o+ihqOS4gOS4qkpTRnVuY3Rpb25cclxuICovXHJcbmNsYXNzIEpTRnVuY3Rpb24ge1xyXG4gICAgX2Z1bmM7XHJcbiAgICBpZDtcclxuICAgIGFyZ3MgPSBbXTtcclxuICAgIGxhc3RFeGNlcHRpb24gPSBudWxsO1xyXG4gICAgY29uc3RydWN0b3IoaWQsIGZ1bmMpIHtcclxuICAgICAgICB0aGlzLl9mdW5jID0gZnVuYztcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICB9XHJcbiAgICBpbnZva2UoKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbLi4udGhpcy5hcmdzXTtcclxuICAgICAgICB0aGlzLmFyZ3MubGVuZ3RoID0gMDtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkpTRnVuY3Rpb24gPSBKU0Z1bmN0aW9uO1xyXG4vKipcclxuICog5Luj6KGo5LiA5LiqSlNPYmplY3RcclxuICovXHJcbmNsYXNzIEpTT2JqZWN0IHtcclxuICAgIF9vYmo7XHJcbiAgICBpZDtcclxuICAgIGNvbnN0cnVjdG9yKGlkLCBvYmopIHtcclxuICAgICAgICB0aGlzLl9vYmogPSBvYmo7XHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgfVxyXG4gICAgZ2V0T2JqZWN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9vYmo7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5KU09iamVjdCA9IEpTT2JqZWN0O1xyXG5jbGFzcyBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5IHtcclxuICAgIHN0YXRpYyByZWd1bGFySUQgPSAxO1xyXG4gICAgc3RhdGljIGlkTWFwID0gbmV3IFdlYWtNYXAoKTtcclxuICAgIHN0YXRpYyBqc0Z1bmNPck9iamVjdEtWID0ge307XHJcbiAgICBzdGF0aWMgZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmNWYWx1ZSkge1xyXG4gICAgICAgIGxldCBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuZ2V0KGZ1bmNWYWx1ZSk7XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZCA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVndWxhcklEKys7XHJcbiAgICAgICAgY29uc3QgZnVuYyA9IG5ldyBKU0Z1bmN0aW9uKGlkLCBmdW5jVmFsdWUpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuaWRNYXAuc2V0KGZ1bmNWYWx1ZSwgaWQpO1xyXG4gICAgICAgIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF0gPSBmdW5jO1xyXG4gICAgICAgIHJldHVybiBmdW5jO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGdldE9yQ3JlYXRlSlNPYmplY3Qob2JqKSB7XHJcbiAgICAgICAgbGV0IGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5nZXQob2JqKTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlkID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5yZWd1bGFySUQrKztcclxuICAgICAgICBjb25zdCBqc09iamVjdCA9IG5ldyBKU09iamVjdChpZCwgb2JqKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLnNldChvYmosIGlkKTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdID0ganNPYmplY3Q7XHJcbiAgICAgICAgcmV0dXJuIGpzT2JqZWN0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGdldEpTT2JqZWN0QnlJZChpZCkge1xyXG4gICAgICAgIHJldHVybiBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmpzRnVuY09yT2JqZWN0S1ZbaWRdO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHJlbW92ZUpTT2JqZWN0QnlJZChpZCkge1xyXG4gICAgICAgIGNvbnN0IGpzT2JqZWN0ID0ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgICAgICBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmlkTWFwLmRlbGV0ZShqc09iamVjdC5nZXRPYmplY3QoKSk7XHJcbiAgICAgICAgZGVsZXRlIGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZ2V0SlNGdW5jdGlvbkJ5SWQoaWQpIHtcclxuICAgICAgICByZXR1cm4ganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgIH1cclxuICAgIHN0YXRpYyByZW1vdmVKU0Z1bmN0aW9uQnlJZChpZCkge1xyXG4gICAgICAgIGNvbnN0IGpzRnVuYyA9IGpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuanNGdW5jT3JPYmplY3RLVltpZF07XHJcbiAgICAgICAganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5pZE1hcC5kZWxldGUoanNGdW5jLl9mdW5jKTtcclxuICAgICAgICBkZWxldGUganNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5qc0Z1bmNPck9iamVjdEtWW2lkXTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkgPSBqc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5O1xyXG4vKipcclxuICogQ1NoYXJw5a+56LGh6K6w5b2V6KGo77yM6K6w5b2V5omA5pyJQ1NoYXJw5a+56LGh5bm25YiG6YWNaWRcclxuICog5ZKMcHVlcnRzLmRsbOaJgOWBmueahOS4gOagt1xyXG4gKi9cclxuY2xhc3MgQ1NoYXJwT2JqZWN0TWFwIHtcclxuICAgIGNsYXNzZXMgPSBbbnVsbF07XHJcbiAgICBuYXRpdmVPYmplY3RLViA9IG5ldyBNYXAoKTtcclxuICAgIC8vIHByaXZhdGUgbmF0aXZlT2JqZWN0S1Y6IHsgW29iamVjdElEOiBDU0lkZW50aWZpZXJdOiBXZWFrUmVmPGFueT4gfSA9IHt9O1xyXG4gICAgLy8gcHJpdmF0ZSBjc0lEV2Vha01hcDogV2Vha01hcDxhbnksIENTSWRlbnRpZmllcj4gPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgbmFtZXNUb0NsYXNzZXNJRCA9IHt9O1xyXG4gICAgY2xhc3NJRFdlYWtNYXAgPSBuZXcgV2Vha01hcCgpO1xyXG4gICAgYWRkKGNzSUQsIG9iaikge1xyXG4gICAgICAgIC8vIHRoaXMubmF0aXZlT2JqZWN0S1ZbY3NJRF0gPSBjcmVhdGVXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgLy8gdGhpcy5jc0lEV2Vha01hcC5zZXQob2JqLCBjc0lEKTtcclxuICAgICAgICB0aGlzLm5hdGl2ZU9iamVjdEtWLnNldChjc0lELCBjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosICdfcHVlcnRzX2NzaWRfJywge1xyXG4gICAgICAgICAgICB2YWx1ZTogY3NJRFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcmVtb3ZlKGNzSUQpIHtcclxuICAgICAgICAvLyBkZWxldGUgdGhpcy5uYXRpdmVPYmplY3RLVltjc0lEXTtcclxuICAgICAgICB0aGlzLm5hdGl2ZU9iamVjdEtWLmRlbGV0ZShjc0lEKTtcclxuICAgIH1cclxuICAgIGZpbmRPckFkZE9iamVjdChjc0lELCBjbGFzc0lEKSB7XHJcbiAgICAgICAgbGV0IHJldCA9IHRoaXMubmF0aXZlT2JqZWN0S1YuZ2V0KGNzSUQpO1xyXG4gICAgICAgIC8vIGxldCByZXQgPSB0aGlzLm5hdGl2ZU9iamVjdEtWW2NzSURdO1xyXG4gICAgICAgIGlmIChyZXQgJiYgKHJldCA9IHJldC5kZXJlZigpKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXQgPSB0aGlzLmNsYXNzZXNbY2xhc3NJRF0uY3JlYXRlRnJvbUNTKGNzSUQpO1xyXG4gICAgICAgIC8vIHRoaXMuYWRkKGNzSUQsIHJldCk7IOaehOmAoOWHveaVsOmHjOi0n+i0o+iwg+eUqFxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbiAgICBnZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KG9iaikge1xyXG4gICAgICAgIC8vIHJldHVybiB0aGlzLmNzSURXZWFrTWFwLmdldChvYmopO1xyXG4gICAgICAgIHJldHVybiBvYmouX3B1ZXJ0c19jc2lkXztcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkNTaGFycE9iamVjdE1hcCA9IENTaGFycE9iamVjdE1hcDtcclxuO1xyXG52YXIgZGVzdHJ1Y3RvcnMgPSB7fTtcclxuZXhwb3J0cy5nbG9iYWwgPSBnbG9iYWwgPSBnbG9iYWwgfHwgZ2xvYmFsVGhpcyB8fCB3aW5kb3c7XHJcbmdsb2JhbC5nbG9iYWwgPSBnbG9iYWw7XHJcbmNvbnN0IGNyZWF0ZVdlYWtSZWYgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHR5cGVvZiBXZWFrUmVmID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBXWFdlYWtSZWYgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIldlYWtSZWYgaXMgbm90IGRlZmluZWQuIG1heWJlIHlvdSBzaG91bGQgdXNlIG5ld2VyIGVudmlyb25tZW50XCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGVyZWYoKSB7IHJldHVybiBvYmo7IH0gfTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwidXNpbmcgV1hXZWFrUmVmXCIpO1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgV1hXZWFrUmVmKG9iaik7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXZWFrUmVmKG9iaik7XHJcbiAgICB9O1xyXG59KSgpO1xyXG5leHBvcnRzLmNyZWF0ZVdlYWtSZWYgPSBjcmVhdGVXZWFrUmVmO1xyXG5jbGFzcyBGaW5hbGl6YXRpb25SZWdpc3RyeU1vY2sge1xyXG4gICAgX2hhbmRsZXI7XHJcbiAgICByZWZzID0gW107XHJcbiAgICBoZWxkcyA9IFtdO1xyXG4gICAgYXZhaWxhYmxlSW5kZXggPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yKGhhbmRsZXIpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oXCJGaW5hbGl6YXRpb25SZWdpc3RlciBpcyBub3QgZGVmaW5lZC4gdXNpbmcgRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrXCIpO1xyXG4gICAgICAgIGdsb2JhbC5fcHVlcnRzX3JlZ2lzdHJ5ID0gdGhpcztcclxuICAgICAgICB0aGlzLl9oYW5kbGVyID0gaGFuZGxlcjtcclxuICAgIH1cclxuICAgIHJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYXZhaWxhYmxlSW5kZXgubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5hdmFpbGFibGVJbmRleC5wb3AoKTtcclxuICAgICAgICAgICAgdGhpcy5yZWZzW2luZGV4XSA9IGNyZWF0ZVdlYWtSZWYob2JqKTtcclxuICAgICAgICAgICAgdGhpcy5oZWxkc1tpbmRleF0gPSBoZWxkVmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlZnMucHVzaChjcmVhdGVXZWFrUmVmKG9iaikpO1xyXG4gICAgICAgICAgICB0aGlzLmhlbGRzLnB1c2goaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOa4hemZpOWPr+iDveW3sue7j+WkseaViOeahFdlYWtSZWZcclxuICAgICAqL1xyXG4gICAgaXRlcmF0ZVBvc2l0aW9uID0gMDtcclxuICAgIGNsZWFudXAocGFydCA9IDEpIHtcclxuICAgICAgICBjb25zdCBzdGVwQ291bnQgPSB0aGlzLnJlZnMubGVuZ3RoIC8gcGFydDtcclxuICAgICAgICBsZXQgaSA9IHRoaXMuaXRlcmF0ZVBvc2l0aW9uO1xyXG4gICAgICAgIGZvciAobGV0IGN1cnJlbnRTdGVwID0gMDsgaSA8IHRoaXMucmVmcy5sZW5ndGggJiYgY3VycmVudFN0ZXAgPCBzdGVwQ291bnQ7IGkgPSAoaSA9PSB0aGlzLnJlZnMubGVuZ3RoIC0gMSA/IDAgOiBpICsgMSksIGN1cnJlbnRTdGVwKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVmc1tpXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVmc1tpXS5kZXJlZigpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDnm67liY3msqHmnInlhoXlrZjmlbTnkIbog73lipvvvIzlpoLmnpzmuLjmiI/kuK3mnJ9yZWblvojlpJrkvYblkI7mnJ/lsJHkuobvvIzov5nph4zlsLHkvJrnmb3otLnpgY3ljobmrKHmlbBcclxuICAgICAgICAgICAgICAgIC8vIOS9humBjeWOhuS5n+WPquaYr+S4gOWPpT095ZKMY29udGludWXvvIzmtarotLnlvbHlk43kuI3lpKdcclxuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlSW5kZXgucHVzaChpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVmc1tpXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZXIodGhpcy5oZWxkc1tpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pdGVyYXRlUG9zaXRpb24gPSBpO1xyXG4gICAgfVxyXG59XHJcbnZhciByZWdpc3RyeSA9IG51bGw7XHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICByZWdpc3RyeSA9IG5ldyAodHlwZW9mIEZpbmFsaXphdGlvblJlZ2lzdHJ5ID09ICd1bmRlZmluZWQnID8gRmluYWxpemF0aW9uUmVnaXN0cnlNb2NrIDogRmluYWxpemF0aW9uUmVnaXN0cnkpKGZ1bmN0aW9uIChoZWxkVmFsdWUpIHtcclxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBkZXN0cnVjdG9yc1toZWxkVmFsdWVdO1xyXG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2Fubm90IGZpbmQgZGVzdHJ1Y3RvciBmb3IgXCIgKyBoZWxkVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoLS1jYWxsYmFjay5yZWYgPT0gMCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZGVzdHJ1Y3RvcnNbaGVsZFZhbHVlXTtcclxuICAgICAgICAgICAgY2FsbGJhY2soaGVsZFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBPbkZpbmFsaXplKG9iaiwgaGVsZFZhbHVlLCBjYWxsYmFjaykge1xyXG4gICAgaWYgKCFyZWdpc3RyeSkge1xyXG4gICAgICAgIGluaXQoKTtcclxuICAgIH1cclxuICAgIGxldCBvcmlnaW5DYWxsYmFjayA9IGRlc3RydWN0b3JzW2hlbGRWYWx1ZV07XHJcbiAgICBpZiAob3JpZ2luQ2FsbGJhY2spIHtcclxuICAgICAgICAvLyBXZWFrUmVm5YaF5a656YeK5pS+5pe25py65Y+v6IO95q+UZmluYWxpemF0aW9uUmVnaXN0cnnnmoTop6blj5Hmm7Tml6nvvIzliY3pnaLlpoLmnpzlj5HnjrB3ZWFrUmVm5Li656m65Lya6YeN5paw5Yib5bu65a+56LGhXHJcbiAgICAgICAgLy8g5L2G5LmL5YmN5a+56LGh55qEZmluYWxpemF0aW9uUmVnaXN0cnnmnIDnu4jlj4jogq/lrprkvJrop6blj5HjgIJcclxuICAgICAgICAvLyDmiYDku6XlpoLmnpzpgYfliLDov5nkuKrmg4XlhrXvvIzpnIDopoHnu5lkZXN0cnVjdG9y5Yqg6K6h5pWwXHJcbiAgICAgICAgKytvcmlnaW5DYWxsYmFjay5yZWY7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjYWxsYmFjay5yZWYgPSAxO1xyXG4gICAgICAgIGRlc3RydWN0b3JzW2hlbGRWYWx1ZV0gPSBjYWxsYmFjaztcclxuICAgIH1cclxuICAgIHJlZ2lzdHJ5LnJlZ2lzdGVyKG9iaiwgaGVsZFZhbHVlKTtcclxufVxyXG5leHBvcnRzLk9uRmluYWxpemUgPSBPbkZpbmFsaXplO1xyXG5jbGFzcyBQdWVydHNKU0VuZ2luZSB7XHJcbiAgICBjc2hhcnBPYmplY3RNYXA7XHJcbiAgICB1bml0eUFwaTtcclxuICAgIGxhc3RSZXR1cm5DU1Jlc3VsdCA9IG51bGw7XHJcbiAgICBsYXN0RXhjZXB0aW9uID0gbnVsbDtcclxuICAgIC8vIOi/meWbm+S4quaYr1B1ZXJ0cy5XZWJHTOmHjOeUqOS6jndhc23pgJrkv6HnmoTnmoRDU2hhcnAgQ2FsbGJhY2vlh73mlbDmjIfpkojjgIJcclxuICAgIGNhbGxWOEZ1bmN0aW9uO1xyXG4gICAgY2FsbFY4Q29uc3RydWN0b3I7XHJcbiAgICBjYWxsVjhEZXN0cnVjdG9yO1xyXG4gICAgLy8g6L+Z5Lik5Liq5pivUHVlcnRz55So55qE55qE55yf5q2j55qEQ1NoYXJw5Ye95pWw5oyH6ZKIXHJcbiAgICBHZXRKU0FyZ3VtZW50c0NhbGxiYWNrO1xyXG4gICAgZ2VuZXJhbERlc3RydWN0b3I7XHJcbiAgICBjb25zdHJ1Y3RvcihjdG9yUGFyYW0pIHtcclxuICAgICAgICB0aGlzLmNzaGFycE9iamVjdE1hcCA9IG5ldyBDU2hhcnBPYmplY3RNYXAoKTtcclxuICAgICAgICBjb25zdCB7IFVURjhUb1N0cmluZywgX21hbGxvYywgX21lbXNldCwgX21lbWNweSwgX2ZyZWUsIHN0cmluZ1RvVVRGOCwgbGVuZ3RoQnl0ZXNVVEY4LCB1bml0eUluc3RhbmNlIH0gPSBjdG9yUGFyYW07XHJcbiAgICAgICAgdGhpcy51bml0eUFwaSA9IHtcclxuICAgICAgICAgICAgVVRGOFRvU3RyaW5nLFxyXG4gICAgICAgICAgICBfbWFsbG9jLFxyXG4gICAgICAgICAgICBfbWVtc2V0LFxyXG4gICAgICAgICAgICBfbWVtY3B5LFxyXG4gICAgICAgICAgICBfZnJlZSxcclxuICAgICAgICAgICAgc3RyaW5nVG9VVEY4LFxyXG4gICAgICAgICAgICBsZW5ndGhCeXRlc1VURjgsXHJcbiAgICAgICAgICAgIGR5bkNhbGxfaWlpaWk6IHVuaXR5SW5zdGFuY2UuZHluQ2FsbF9paWlpaS5iaW5kKHVuaXR5SW5zdGFuY2UpLFxyXG4gICAgICAgICAgICBkeW5DYWxsX3ZpaWk6IHVuaXR5SW5zdGFuY2UuZHluQ2FsbF92aWlpLmJpbmQodW5pdHlJbnN0YW5jZSksXHJcbiAgICAgICAgICAgIGR5bkNhbGxfdmlpaWlpOiB1bml0eUluc3RhbmNlLmR5bkNhbGxfdmlpaWlpLmJpbmQodW5pdHlJbnN0YW5jZSksXHJcbiAgICAgICAgICAgIEhFQVAzMjogbnVsbCxcclxuICAgICAgICAgICAgSEVBUDg6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnVuaXR5QXBpLCAnSEVBUDMyJywge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bml0eUluc3RhbmNlLkhFQVAzMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnVuaXR5QXBpLCAnSEVBUDgnLCB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXR5SW5zdGFuY2UuSEVBUDg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBnbG9iYWwuX190Z2pzRXZhbFNjcmlwdCA9IHR5cGVvZiBldmFsID09IFwidW5kZWZpbmVkXCIgPyAoKSA9PiB7IH0gOiBldmFsO1xyXG4gICAgICAgIGdsb2JhbC5fX3RnanNTZXRQcm9taXNlUmVqZWN0Q2FsbGJhY2sgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB3eCAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgd3gub25VbmhhbmRsZWRSZWplY3Rpb24oY2FsbGJhY2spO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmhhbmRsZWRyZWplY3Rpb25cIiwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBnbG9iYWwuX19wdWVydHNHZXRMYXN0RXhjZXB0aW9uID0gKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0RXhjZXB0aW9uO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBKU1N0cmluZ1RvQ1NTdHJpbmcocmV0dXJuU3RyLCAvKiogb3V0IGludCAqLyBsZW5ndGgpIHtcclxuICAgICAgICBpZiAocmV0dXJuU3RyID09PSBudWxsIHx8IHJldHVyblN0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYnl0ZUNvdW50ID0gdGhpcy51bml0eUFwaS5sZW5ndGhCeXRlc1VURjgocmV0dXJuU3RyKTtcclxuICAgICAgICBzZXRPdXRWYWx1ZTMyKHRoaXMsIGxlbmd0aCwgYnl0ZUNvdW50KTtcclxuICAgICAgICB2YXIgYnVmZmVyID0gdGhpcy51bml0eUFwaS5fbWFsbG9jKGJ5dGVDb3VudCArIDEpO1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuc3RyaW5nVG9VVEY4KHJldHVyblN0ciwgYnVmZmVyLCBieXRlQ291bnQgKyAxKTtcclxuICAgICAgICByZXR1cm4gYnVmZmVyO1xyXG4gICAgfVxyXG4gICAgbWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBmdW5jdGlvblB0ciwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICAvLyDkuI3og73nlKjnrq3lpLTlh73mlbDvvIHmraTlpITov5Tlm57nmoTlh73mlbDkvJrmlL7liLDlhbfkvZPnmoRjbGFzc+S4iu+8jHRoaXPmnInlkKvkuYnjgIJcclxuICAgICAgICBjb25zdCBlbmdpbmUgPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xyXG4gICAgICAgICAgICBsZXQgY2FsbGJhY2tJbmZvUHRyID0gRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldE1vY2tQb2ludGVyKGFyZ3MpO1xyXG4gICAgICAgICAgICBlbmdpbmUuY2FsbFY4RnVuY3Rpb25DYWxsYmFjayhmdW5jdGlvblB0ciwgXHJcbiAgICAgICAgICAgIC8vIGdldEludFB0ck1hbmFnZXIoKS5HZXRQb2ludGVyRm9ySlNWYWx1ZSh0aGlzKSxcclxuICAgICAgICAgICAgaXNTdGF0aWMgPyAwIDogZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHRoaXMpLCBjYWxsYmFja0luZm9QdHIsIGFyZ3MubGVuZ3RoLCBjYWxsYmFja0lkeCk7XHJcbiAgICAgICAgICAgIHJldHVybiBGdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0UmV0dXJuVmFsdWVBbmRSZWN5Y2xlKGNhbGxiYWNrSW5mb1B0cik7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGNhbGxWOEZ1bmN0aW9uQ2FsbGJhY2soZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGluZm9JbnRQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuZHluQ2FsbF92aWlpaWkodGhpcy5jYWxsVjhGdW5jdGlvbiwgZnVuY3Rpb25QdHIsIGluZm9JbnRQdHIsIHNlbGZQdHIsIHBhcmFtTGVuLCBjYWxsYmFja0lkeCk7XHJcbiAgICB9XHJcbiAgICBjYWxsVjhDb25zdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51bml0eUFwaS5keW5DYWxsX2lpaWlpKHRoaXMuY2FsbFY4Q29uc3RydWN0b3IsIGZ1bmN0aW9uUHRyLCBpbmZvSW50UHRyLCBwYXJhbUxlbiwgY2FsbGJhY2tJZHgpO1xyXG4gICAgfVxyXG4gICAgY2FsbFY4RGVzdHJ1Y3RvckNhbGxiYWNrKGZ1bmN0aW9uUHRyLCBzZWxmUHRyLCBjYWxsYmFja0lkeCkge1xyXG4gICAgICAgIHRoaXMudW5pdHlBcGkuZHluQ2FsbF92aWlpKHRoaXMuY2FsbFY4RGVzdHJ1Y3RvciwgZnVuY3Rpb25QdHIsIHNlbGZQdHIsIGNhbGxiYWNrSWR4KTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLlB1ZXJ0c0pTRW5naW5lID0gUHVlcnRzSlNFbmdpbmU7XHJcbmZ1bmN0aW9uIEdldFR5cGUoZW5naW5lLCB2YWx1ZSkge1xyXG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gMTtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcclxuICAgICAgICByZXR1cm4gNDtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXR1cm4gODtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgcmV0dXJuIDE2O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgcmV0dXJuIDI1NjtcclxuICAgIH1cclxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcclxuICAgICAgICByZXR1cm4gNTEyO1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICByZXR1cm4gMTI4O1xyXG4gICAgfVxyXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgdmFsdWUgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbiAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICB9XHJcbiAgICBpZiAoZW5naW5lLmNzaGFycE9iamVjdE1hcC5nZXRDU0lkZW50aWZpZXJGcm9tT2JqZWN0KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAzMjtcclxuICAgIH1cclxuICAgIHJldHVybiA2NDtcclxufVxyXG5leHBvcnRzLkdldFR5cGUgPSBHZXRUeXBlO1xyXG5mdW5jdGlvbiBtYWtlQmlnSW50KGxvdywgaGlnaCkge1xyXG4gICAgcmV0dXJuIChCaWdJbnQoaGlnaCA+Pj4gMCkgPDwgQmlnSW50KDMyKSkgKyBCaWdJbnQobG93ID4+PiAwKTtcclxufVxyXG5leHBvcnRzLm1ha2VCaWdJbnQgPSBtYWtlQmlnSW50O1xyXG5mdW5jdGlvbiBzZXRPdXRWYWx1ZTMyKGVuZ2luZSwgdmFsdWVQdHIsIHZhbHVlKSB7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDMyW3ZhbHVlUHRyID4+IDJdID0gdmFsdWU7XHJcbn1cclxuZXhwb3J0cy5zZXRPdXRWYWx1ZTMyID0gc2V0T3V0VmFsdWUzMjtcclxuZnVuY3Rpb24gc2V0T3V0VmFsdWU4KGVuZ2luZSwgdmFsdWVQdHIsIHZhbHVlKSB7XHJcbiAgICBlbmdpbmUudW5pdHlBcGkuSEVBUDhbdmFsdWVQdHJdID0gdmFsdWU7XHJcbn1cclxuZXhwb3J0cy5zZXRPdXRWYWx1ZTggPSBzZXRPdXRWYWx1ZTg7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWxpYnJhcnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPkvqfojrflj5ZKU+iwg+eUqOWPguaVsOeahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRHZXRGcm9tSlNBcmd1bWVudEFQSShlbmdpbmUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgR2V0TnVtYmVyRnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXREYXRlRnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSkuZ2V0VGltZSgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0U3RyaW5nRnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIC8qb3V0IGludCAqLyBsZW5ndGgsIGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgdmFyIHJldHVyblN0ciA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuSlNTdHJpbmdUb0NTU3RyaW5nKHJldHVyblN0ciwgbGVuZ3RoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEJvb2xlYW5Gcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICByZXR1cm4gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFZhbHVlSXNCaWdJbnQ6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICB2YXIgYmlnaW50ID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIGJpZ2ludCBpbnN0YW5jZW9mIEJpZ0ludDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEJpZ0ludEZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgIHZhciBiaWdpbnQgPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gYmlnaW50O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0T2JqZWN0RnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgdmFyIG5hdGl2ZU9iamVjdCA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QobmF0aXZlT2JqZWN0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldEZ1bmN0aW9uRnJvbVZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIGlzQnlSZWYpIHtcclxuICAgICAgICAgICAgdmFyIGZ1bmMgPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGZ1bmMpO1xyXG4gICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0SlNPYmplY3RGcm9tVmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgdmFyIGpzb2JqID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU09iamVjdChvYmopO1xyXG4gICAgICAgICAgICByZXR1cm4ganNvYmouaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRBcnJheUJ1ZmZlckZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCAvKm91dCBpbnQgKi8gbGVuZ3RoLCBpc091dCkge1xyXG4gICAgICAgICAgICB2YXIgYWIgPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBpZiAoYWIgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XHJcbiAgICAgICAgICAgICAgICBhYiA9IGFiLmJ1ZmZlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcHRyID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2MoYWIuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQOC5zZXQobmV3IEludDhBcnJheShhYiksIHB0cik7XHJcbiAgICAgICAgICAgIGVuZ2luZS51bml0eUFwaS5IRUFQMzJbbGVuZ3RoID4+IDJdID0gYWIuYnl0ZUxlbmd0aDtcclxuICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5zZXRPdXRWYWx1ZTMyKShlbmdpbmUsIGxlbmd0aCwgYWIuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBwdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRBcmd1bWVudFR5cGU6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBpbmRleCwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbykuYXJnc1tpbmRleF07XHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgbGlicmFyeV8xLkdldFR5cGUpKGVuZ2luZSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5Li6YyPkvqfmj5DkvpvkuIDkuKrojrflj5ZjYWxsYmFja2luZm/ph4xqc3ZhbHVl55qEaW50cHRy55qE5o6l5Y+jXHJcbiAgICAgICAgICog5bm25LiN5piv5b6X55qE5Yiw6L+Z5LiqYXJndW1lbnTnmoTlgLxcclxuICAgICAgICAgKi9cclxuICAgICAgICBHZXRBcmd1bWVudFZhbHVlIC8qaW5DYWxsYmFja0luZm8qLzogZnVuY3Rpb24gKGluZm9wdHIsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpbmZvcHRyIHwgaW5kZXg7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRKc1ZhbHVlVHlwZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbCwgaXNCeVJlZikge1xyXG4gICAgICAgICAgICAvLyBwdWJsaWMgZW51bSBKc1ZhbHVlVHlwZVxyXG4gICAgICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgIC8vICAgICBOdWxsT3JVbmRlZmluZWQgPSAxLFxyXG4gICAgICAgICAgICAvLyAgICAgQmlnSW50ID0gMixcclxuICAgICAgICAgICAgLy8gICAgIE51bWJlciA9IDQsXHJcbiAgICAgICAgICAgIC8vICAgICBTdHJpbmcgPSA4LFxyXG4gICAgICAgICAgICAvLyAgICAgQm9vbGVhbiA9IDE2LFxyXG4gICAgICAgICAgICAvLyAgICAgTmF0aXZlT2JqZWN0ID0gMzIsXHJcbiAgICAgICAgICAgIC8vICAgICBKc09iamVjdCA9IDY0LFxyXG4gICAgICAgICAgICAvLyAgICAgQXJyYXkgPSAxMjgsXHJcbiAgICAgICAgICAgIC8vICAgICBGdW5jdGlvbiA9IDI1NixcclxuICAgICAgICAgICAgLy8gICAgIERhdGUgPSA1MTIsXHJcbiAgICAgICAgICAgIC8vICAgICBBcnJheUJ1ZmZlciA9IDEwMjQsXHJcbiAgICAgICAgICAgIC8vICAgICBVbmtub3cgPSAyMDQ4LFxyXG4gICAgICAgICAgICAvLyAgICAgQW55ID0gTnVsbE9yVW5kZWZpbmVkIHwgQmlnSW50IHwgTnVtYmVyIHwgU3RyaW5nIHwgQm9vbGVhbiB8IE5hdGl2ZU9iamVjdCB8IEFycmF5IHwgRnVuY3Rpb24gfCBEYXRlIHwgQXJyYXlCdWZmZXIsXHJcbiAgICAgICAgICAgIC8vIH07XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gKDAsIGxpYnJhcnlfMS5HZXRUeXBlKShlbmdpbmUsIHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldFR5cGVJZEZyb21WYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBpc0J5UmVmKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICB2YXIgdHlwZWlkID0gMDtcclxuICAgICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlaWQgPSBvYmouX2Z1bmNbXCIkY2lkXCJdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHlwZWlkID0gb2JqW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZmluZCB0eXBlaWQgZm9yJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU0FyZ3VtZW50QVBJO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1nZXRGcm9tSlNBcmd1bWVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi4vbGlicmFyeVwiKTtcclxuLyoqXHJcbiAqIG1peGluXHJcbiAqIEMj6LCD55SoSlPml7bvvIzojrflj5ZKU+WHveaVsOi/lOWbnuWAvFxyXG4gKlxyXG4gKiDljp/mnInnmoRyZXN1bHRJbmZv6K6+6K6h5Ye65p2l5Y+q5piv5Li65LqG6K6p5aSaaXNvbGF0ZeaXtuiDveWcqOS4jeWQjOeahGlzb2xhdGXph4zkv53mjIHkuI3lkIznmoRyZXN1bHRcclxuICog5ZyoV2ViR0zmqKHlvI/kuIvmsqHmnInov5nkuKrng6bmgbzvvIzlm6DmraTnm7TmjqXnlKhlbmdpbmXnmoTljbPlj69cclxuICogcmVzdWx0SW5mb+WbuuWumuS4ujEwMjRcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kR2V0RnJvbUpTUmV0dXJuQVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBHZXROdW1iZXJGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldERhdGVGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdC5nZXRUaW1lKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRTdHJpbmdGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbywgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5naW5lLkpTU3RyaW5nVG9DU1N0cmluZyhlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0LCBsZW5ndGgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0Qm9vbGVhbkZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVzdWx0SXNCaWdJbnQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0IGluc3RhbmNlb2YgQmlnSW50O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0QmlnSW50RnJvbVJlc3VsdDogZnVuY3Rpb24gKHJlc3VsdEluZm8pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZWQnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdldE9iamVjdEZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmdldENTSWRlbnRpZmllckZyb21PYmplY3QoZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRUeXBlSWRGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0O1xyXG4gICAgICAgICAgICB2YXIgdHlwZWlkID0gMDtcclxuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IHZhbHVlLl9mdW5jW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR5cGVpZCA9IHZhbHVlW1wiJGNpZFwiXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXR5cGVpZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZmluZCB0eXBlaWQgZm9yJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHlwZWlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0RnVuY3Rpb25Gcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIganNmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0T3JDcmVhdGVKU0Z1bmN0aW9uKGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgICAgICByZXR1cm4ganNmdW5jLmlkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgR2V0SlNPYmplY3RGcm9tUmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICB2YXIganNvYmogPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRPckNyZWF0ZUpTT2JqZWN0KGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQpO1xyXG4gICAgICAgICAgICByZXR1cm4ganNvYmouaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBHZXRBcnJheUJ1ZmZlckZyb21SZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRJbmZvLCAvKm91dCBpbnQgKi8gbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBhYiA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHZhciBwdHIgPSBlbmdpbmUudW5pdHlBcGkuX21hbGxvYyhhYi5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLkhFQVA4LnNldChuZXcgSW50OEFycmF5KGFiKSwgcHRyKTtcclxuICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5zZXRPdXRWYWx1ZTMyKShlbmdpbmUsIGxlbmd0aCwgYWIuYnl0ZUxlbmd0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBwdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvL+S/neWuiOaWueahiFxyXG4gICAgICAgIEdldFJlc3VsdFR5cGU6IGZ1bmN0aW9uIChyZXN1bHRJbmZvKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQ7XHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgbGlicmFyeV8xLkdldFR5cGUpKGVuZ2luZSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZEdldEZyb21KU1JldHVybkFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Z2V0RnJvbUpTUmV0dXJuLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICog5rOo5YaM57G7QVBJ77yM5aaC5rOo5YaM5YWo5bGA5Ye95pWw44CB5rOo5YaM57G777yM5Lul5Y+K57G755qE5bGe5oCn5pa55rOV562JXHJcbiAqXHJcbiAqIEBwYXJhbSBlbmdpbmVcclxuICogQHJldHVybnNcclxuICovXHJcbmZ1bmN0aW9uIFdlYkdMQmFja2VuZFJlZ2lzdGVyQVBJKGVuZ2luZSkge1xyXG4gICAgY29uc3QgcmV0dXJuZWUgPSB7XHJcbiAgICAgICAgU2V0R2xvYmFsRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBuYW1lU3RyaW5nLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIGpzRW52SWR4LCBjYWxsYmFja2lkeCkge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgbGlicmFyeV8xLmdsb2JhbFtuYW1lXSA9IGVuZ2luZS5tYWtlVjhGdW5jdGlvbkNhbGxiYWNrRnVuY3Rpb24odHJ1ZSwgdjhGdW5jdGlvbkNhbGxiYWNrLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfUmVnaXN0ZXJDbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwganNFbnZJZHgsIGNhbGxiYWNraWR4LCBzaXplKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxOYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhmdWxsTmFtZVN0cmluZyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNzaGFycE9iamVjdE1hcCA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXA7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICBsZXQgdGVtcEV4dGVybmFsQ1NJRCA9IDA7XHJcbiAgICAgICAgICAgIGNvbnN0IGN0b3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyDorr7nva7nsbvlnotJRFxyXG4gICAgICAgICAgICAgICAgdGhpc1tcIiRjaWRcIl0gPSBpZDtcclxuICAgICAgICAgICAgICAgIC8vIG5hdGl2ZU9iamVjdOeahOaehOmAoOWHveaVsFxyXG4gICAgICAgICAgICAgICAgLy8g5p6E6YCg5Ye95pWw5pyJ5Lik5Liq6LCD55So55qE5Zyw5pa577yaMS4ganPkvqduZXfkuIDkuKrlroPnmoTml7blgJkgMi4gY3PkvqfliJvlu7rkuobkuIDkuKrlr7nosaHopoHkvKDliLBqc+S+p+aXtlxyXG4gICAgICAgICAgICAgICAgLy8g56ys5LiA5Liq5oOF5Ya177yMY3Plr7nosaFJROaIluiAheaYr2NhbGxWOENvbnN0cnVjdG9yQ2FsbGJhY2vov5Tlm57nmoTjgIJcclxuICAgICAgICAgICAgICAgIC8vIOesrOS6jOS4quaDheWGte+8jOWImWNz5a+56LGhSUTmmK9jcyBuZXflrozkuYvlkI7kuIDlubbkvKDnu5lqc+eahOOAglxyXG4gICAgICAgICAgICAgICAgbGV0IGNzSUQgPSB0ZW1wRXh0ZXJuYWxDU0lEOyAvLyDlpoLmnpzmmK/nrKzkuozkuKrmg4XlhrXvvIzmraRJROeUsWNyZWF0ZUZyb21DU+iuvue9rlxyXG4gICAgICAgICAgICAgICAgdGVtcEV4dGVybmFsQ1NJRCA9IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3NJRCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrSW5mb1B0ciA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0TW9ja1BvaW50ZXIoYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6Jm954S2cHVlcnRz5YaFQ29uc3RydWN0b3LnmoTov5Tlm57lgLzlj6tzZWxm77yM5L2G5a6D5YW25a6e5bCx5pivQ1Plr7nosaHnmoTkuIDkuKppZOiAjOW3suOAglxyXG4gICAgICAgICAgICAgICAgICAgIGNzSUQgPSBlbmdpbmUuY2FsbFY4Q29uc3RydWN0b3JDYWxsYmFjayhjb25zdHJ1Y3RvciwgY2FsbGJhY2tJbmZvUHRyLCBhcmdzLmxlbmd0aCwgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuUmVsZWFzZUJ5TW9ja0ludFB0cihjYWxsYmFja0luZm9QdHIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gYmxpdHRhYmxlXHJcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjc05ld0lEID0gZW5naW5lLnVuaXR5QXBpLl9tYWxsb2Moc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lLnVuaXR5QXBpLl9tZW1jcHkoY3NOZXdJRCwgY3NJRCwgc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmFkZChjc05ld0lELCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICAoMCwgbGlicmFyeV8xLk9uRmluYWxpemUpKHRoaXMsIGNzTmV3SUQsIChjc0lkZW50aWZpZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLnJlbW92ZShjc0lkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUudW5pdHlBcGkuX2ZyZWUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5hZGQoY3NJRCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgKDAsIGxpYnJhcnlfMS5PbkZpbmFsaXplKSh0aGlzLCBjc0lELCAoY3NJZGVudGlmaWVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5yZW1vdmUoY3NJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmNhbGxWOERlc3RydWN0b3JDYWxsYmFjayhkZXN0cnVjdG9yIHx8IGVuZ2luZS5nZW5lcmFsRGVzdHJ1Y3RvciwgY3NJZGVudGlmaWVyLCBjYWxsYmFja2lkeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGN0b3IuY3JlYXRlRnJvbUNTID0gZnVuY3Rpb24gKGNzSUQpIHtcclxuICAgICAgICAgICAgICAgIHRlbXBFeHRlcm5hbENTSUQgPSBjc0lEO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGN0b3IuX19wdWVydHNNZXRhZGF0YSA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwibmFtZVwiLCB7IHZhbHVlOiBmdWxsTmFtZSArIFwiQ29uc3RydWN0b3JcIiB9KTtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIFwiJGNpZFwiLCB7IHZhbHVlOiBpZCB9KTtcclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXMucHVzaChjdG9yKTtcclxuICAgICAgICAgICAgY3NoYXJwT2JqZWN0TWFwLmNsYXNzSURXZWFrTWFwLnNldChjdG9yLCBpZCk7XHJcbiAgICAgICAgICAgIGlmIChCYXNlVHlwZUlkID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY3Rvci5wcm90b3R5cGUuX19wcm90b19fID0gY3NoYXJwT2JqZWN0TWFwLmNsYXNzZXNbQmFzZVR5cGVJZF0ucHJvdG90eXBlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNzaGFycE9iamVjdE1hcC5uYW1lc1RvQ2xhc3Nlc0lEW2Z1bGxOYW1lXSA9IGlkO1xyXG4gICAgICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZWdpc3RlclN0cnVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIEJhc2VUeXBlSWQsIGZ1bGxOYW1lU3RyaW5nLCBjb25zdHJ1Y3RvciwgZGVzdHJ1Y3RvciwgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCwgc2l6ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuZWUuX1JlZ2lzdGVyQ2xhc3MoaXNvbGF0ZSwgQmFzZVR5cGVJZCwgZnVsbE5hbWVTdHJpbmcsIGNvbnN0cnVjdG9yLCBkZXN0cnVjdG9yLCBjYWxsYmFja2lkeCwgY2FsbGJhY2tpZHgsIHNpemUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmVnaXN0ZXJGdW5jdGlvbjogZnVuY3Rpb24gKGlzb2xhdGUsIGNsYXNzSUQsIG5hbWVTdHJpbmcsIGlzU3RhdGljLCBjYWxsYmFjaywgLypsb25nICovIGpzRW52SWR4LCBjYWxsYmFja2lkeCkge1xyXG4gICAgICAgICAgICB2YXIgY2xzID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgICAgICBpZiAoIWNscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKG5hbWVTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgZm4gPSBlbmdpbmUubWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBjYWxsYmFjaywgY2FsbGJhY2tpZHgpO1xyXG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIGNsc1tuYW1lXSA9IGZuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2xzLnByb3RvdHlwZVtuYW1lXSA9IGZuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZWdpc3RlclByb3BlcnR5OiBmdW5jdGlvbiAoaXNvbGF0ZSwgY2xhc3NJRCwgbmFtZVN0cmluZywgaXNTdGF0aWMsIGdldHRlciwgXHJcbiAgICAgICAgLypsb25nICovIGdldHRlcmpzRW52SWR4LCBcclxuICAgICAgICAvKmxvbmcgKi8gZ2V0dGVyY2FsbGJhY2tpZHgsIHNldHRlciwgXHJcbiAgICAgICAgLypsb25nICovIHNldHRlcmpzRW52SWR4LCBcclxuICAgICAgICAvKmxvbmcgKi8gc2V0dGVyY2FsbGJhY2tpZHgsIGRvbnREZWxldGUpIHtcclxuICAgICAgICAgICAgdmFyIGNscyA9IGVuZ2luZS5jc2hhcnBPYmplY3RNYXAuY2xhc3Nlc1tjbGFzc0lEXTtcclxuICAgICAgICAgICAgaWYgKCFjbHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhuYW1lU3RyaW5nKTtcclxuICAgICAgICAgICAgdmFyIGF0dHIgPSB7XHJcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6ICFkb250RGVsZXRlLFxyXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgYXR0ci5nZXQgPSBlbmdpbmUubWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBnZXR0ZXIsIGdldHRlcmNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgaWYgKHNldHRlcikge1xyXG4gICAgICAgICAgICAgICAgYXR0ci5zZXQgPSBlbmdpbmUubWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGlzU3RhdGljLCBzZXR0ZXIsIHNldHRlcmNhbGxiYWNraWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbHMsIG5hbWUsIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNscy5wcm90b3R5cGUsIG5hbWUsIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbiAgICByZXR1cm4gcmV0dXJuZWU7XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kUmVnaXN0ZXJBUEk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlZ2lzdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IGxpYnJhcnlfMSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5XCIpO1xyXG4vKipcclxuICogbWl4aW5cclxuICogQyPosIPnlKhKU+aXtu+8jOiuvue9ruiwg+eUqOWPguaVsOeahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0ludm9rZUpTQXJndW1lbnRBcGkoZW5naW5lKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC8vYmVnaW4gY3MgY2FsbCBqc1xyXG4gICAgICAgIFB1c2hOdWxsRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobnVsbCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoRGF0ZUZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGRhdGVWYWx1ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobmV3IERhdGUoZGF0ZVZhbHVlKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBQdXNoQm9vbGVhbkZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIGIpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEJpZ0ludEZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIC8qbG9uZyAqLyBsb25nbG93LCBsb25naGlnaCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goKDAsIGxpYnJhcnlfMS5tYWtlQmlnSW50KShsb25nbG93LCBsb25naGlnaCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaFN0cmluZ0ZvckpTRnVuY3Rpb246IGZ1bmN0aW9uIChfZnVuY3Rpb24sIHN0clN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hOdW1iZXJGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChfZnVuY3Rpb24pO1xyXG4gICAgICAgICAgICBmdW5jLmFyZ3MucHVzaChkKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hPYmplY3RGb3JKU0Z1bmN0aW9uOiBmdW5jdGlvbiAoX2Z1bmN0aW9uLCBjbGFzc0lELCBvYmplY3RJRCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2goZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qob2JqZWN0SUQsIGNsYXNzSUQpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFB1c2hKU0Z1bmN0aW9uRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNGdW5jdGlvbikge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoSlNGdW5jdGlvbikuX2Z1bmMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEpTT2JqZWN0Rm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgSlNPYmplY3QpIHtcclxuICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIGZ1bmMuYXJncy5wdXNoKGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTT2JqZWN0QnlJZChKU09iamVjdCkuZ2V0T2JqZWN0KCkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUHVzaEFycmF5QnVmZmVyRm9ySlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypieXRlW10gKi8gYnl0ZXMsIGxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgZnVuYy5hcmdzLnB1c2gobmV3IFVpbnQ4QXJyYXkoZW5naW5lLnVuaXR5QXBpLkhFQVA4LmJ1ZmZlciwgYnl0ZXMsIGxlbmd0aCkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViR0xCYWNrZW5kU2V0VG9JbnZva2VKU0FyZ3VtZW50QXBpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXRUb0ludm9rZUpTQXJndW1lbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPorr7nva7ov5Tlm57liLBKU+eahOWAvFxyXG4gKlxyXG4gKiBAcGFyYW0gZW5naW5lXHJcbiAqIEByZXR1cm5zXHJcbiAqL1xyXG5mdW5jdGlvbiBXZWJHTEJhY2tlbmRTZXRUb0pTSW52b2tlUmV0dXJuQXBpKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBSZXR1cm5DbGFzczogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIGNsYXNzSUQpIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5jbGFzc2VzW2NsYXNzSURdO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuT2JqZWN0OiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgY2xhc3NJRCwgc2VsZikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUuY3NoYXJwT2JqZWN0TWFwLmZpbmRPckFkZE9iamVjdChzZWxmLCBjbGFzc0lEKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybk51bWJlcjogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBudW1iZXI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5TdHJpbmc6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBzdHJTdHJpbmcpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyID0gZW5naW5lLnVuaXR5QXBpLlVURjhUb1N0cmluZyhzdHJTdHJpbmcpO1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBzdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBSZXR1cm5CaWdJbnQ6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBsb25nTG93LCBsb25nSGlnaCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSAoMCwgbGlicmFyeV8xLm1ha2VCaWdJbnQpKGxvbmdMb3csIGxvbmdIaWdoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkJvb2xlYW46IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBiKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9ICEhYjsgLy8g5Lyg6L+H5p2l55qE5pivMeWSjDBcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkRhdGU6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBkYXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuTnVsbDogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8pIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrSW5mbyA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QnlNb2NrUG9pbnRlcihpbmZvKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0gbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFJldHVybkZ1bmN0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSwgaW5mbywgSlNGdW5jdGlvblB0cikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjb25zdCBqc0Z1bmMgPSBsaWJyYXJ5XzEuanNGdW5jdGlvbk9yT2JqZWN0RmFjdG9yeS5nZXRKU0Z1bmN0aW9uQnlJZChKU0Z1bmN0aW9uUHRyKTtcclxuICAgICAgICAgICAgY2FsbGJhY2tJbmZvLnJldHVyblZhbHVlID0ganNGdW5jLl9mdW5jO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuSlNPYmplY3Q6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCBKU09iamVjdFB0cikge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjb25zdCBqc09iamVjdCA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTT2JqZWN0QnlJZChKU09iamVjdFB0cik7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IGpzT2JqZWN0LmdldE9iamVjdCgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQ1NoYXJwRnVuY3Rpb25DYWxsYmFjazogZnVuY3Rpb24gKGlzb2xhdGUsIGluZm8sIHY4RnVuY3Rpb25DYWxsYmFjaywgXHJcbiAgICAgICAgLypsb25nICovIHBvaW50ZXJMb3csIFxyXG4gICAgICAgIC8qbG9uZyAqLyBwb2ludGVySGlnaCkge1xyXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tJbmZvID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRCeU1vY2tQb2ludGVyKGluZm8pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0luZm8ucmV0dXJuVmFsdWUgPSBlbmdpbmUubWFrZVY4RnVuY3Rpb25DYWxsYmFja0Z1bmN0aW9uKGZhbHNlLCB2OEZ1bmN0aW9uQ2FsbGJhY2ssIHBvaW50ZXJMb3cpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgUmV0dXJuQXJyYXlCdWZmZXI6IGZ1bmN0aW9uIChpc29sYXRlLCBpbmZvLCAvKmJ5dGVbXSAqLyBieXRlcywgTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYWxsYmFja0luZm8gPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEJ5TW9ja1BvaW50ZXIoaW5mbyk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrSW5mby5yZXR1cm5WYWx1ZSA9IG5ldyBVaW50OEFycmF5KGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIsIGJ5dGVzLCBMZW5ndGgpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSlNJbnZva2VSZXR1cm5BcGk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldFRvSlNJbnZva2VSZXR1cm4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgbGlicmFyeV8xID0gcmVxdWlyZShcIi4uL2xpYnJhcnlcIik7XHJcbi8qKlxyXG4gKiBtaXhpblxyXG4gKiBKU+iwg+eUqEMj5pe277yMQyPkvqforr7nva5vdXTlj4LmlbDlgLxcclxuICpcclxuICogQHBhcmFtIGVuZ2luZVxyXG4gKiBAcmV0dXJuc1xyXG4gKi9cclxuZnVuY3Rpb24gV2ViR0xCYWNrZW5kU2V0VG9KU091dEFyZ3VtZW50QVBJKGVuZ2luZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBTZXROdW1iZXJUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqLnZhbHVlID0gbnVtYmVyO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0RGF0ZVRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgZGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqLnZhbHVlID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRTdHJpbmdUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIHN0clN0cmluZykge1xyXG4gICAgICAgICAgICBjb25zdCBzdHIgPSBlbmdpbmUudW5pdHlBcGkuVVRGOFRvU3RyaW5nKHN0clN0cmluZyk7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmoudmFsdWUgPSBzdHI7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRCb29sZWFuVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlLCBiKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmoudmFsdWUgPSAhIWI7IC8vIOS8oOi/h+adpeeahOaYrzHlkowwXHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXRCaWdJbnRUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIC8qbG9uZyAqLyBiaWdJbnQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZWQnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIFNldE9iamVjdFRvT3V0VmFsdWU6IGZ1bmN0aW9uIChpc29sYXRlLCB2YWx1ZSwgY2xhc3NJRCwgc2VsZikge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gbGlicmFyeV8xLkZ1bmN0aW9uQ2FsbGJhY2tJbmZvUHRyTWFuYWdlci5HZXRBcmdzQnlNb2NrSW50UHRyKHZhbHVlKTtcclxuICAgICAgICAgICAgb2JqLnZhbHVlID0gZW5naW5lLmNzaGFycE9iamVjdE1hcC5maW5kT3JBZGRPYmplY3Qoc2VsZiwgY2xhc3NJRCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBTZXROdWxsVG9PdXRWYWx1ZTogZnVuY3Rpb24gKGlzb2xhdGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBsaWJyYXJ5XzEuRnVuY3Rpb25DYWxsYmFja0luZm9QdHJNYW5hZ2VyLkdldEFyZ3NCeU1vY2tJbnRQdHIodmFsdWUpO1xyXG4gICAgICAgICAgICBvYmoudmFsdWUgPSBudWxsOyAvLyDkvKDov4fmnaXnmoTmmK8x5ZKMMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU2V0QXJyYXlCdWZmZXJUb091dFZhbHVlOiBmdW5jdGlvbiAoaXNvbGF0ZSwgdmFsdWUsIC8qQnl0ZVtdICovIGJ5dGVzLCBMZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGxpYnJhcnlfMS5GdW5jdGlvbkNhbGxiYWNrSW5mb1B0ck1hbmFnZXIuR2V0QXJnc0J5TW9ja0ludFB0cih2YWx1ZSk7XHJcbiAgICAgICAgICAgIG9iai52YWx1ZSA9IG5ldyBVaW50OEFycmF5KGVuZ2luZS51bml0eUFwaS5IRUFQOC5idWZmZXIsIGJ5dGVzLCBMZW5ndGgpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkdMQmFja2VuZFNldFRvSlNPdXRBcmd1bWVudEFQSTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0VG9KU091dEFyZ3VtZW50LmpzLm1hcCIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbi8qKlxyXG4gKiDmoLnmja4gaHR0cHM6Ly9kb2NzLnVuaXR5M2QuY29tLzIwMTguNC9Eb2N1bWVudGF0aW9uL01hbnVhbC93ZWJnbC1pbnRlcmFjdGluZ3dpdGhicm93c2Vyc2NyaXB0aW5nLmh0bWxcclxuICog5oiR5Lus55qE55uu55qE5bCx5piv5ZyoV2ViR0zmqKHlvI/kuIvvvIzlrp7njrDlkoxwdWVydHMuZGxs55qE5pWI5p6c44CC5YW35L2T5Zyo5LqO5a6e546w5LiA5LiqanNsaWLvvIzph4zpnaLlupTljIXlkKtQdWVydHNETEwuY3PnmoTmiYDmnInmjqXlj6NcclxuICog5a6e6aqM5Y+R546w6L+Z5LiqanNsaWLomb3nhLbkuZ/mmK/ov5DooYzlnKh2OOeahGpz77yM5L2G5a+5ZGV2dG9vbOiwg+ivleW5tuS4jeWPi+Wlve+8jOS4lOWPquaUr+aMgeWIsGVzNeOAglxyXG4gKiDlm6DmraTlupTor6XpgJrov4fkuIDkuKrni6znq4vnmoRqc+WunueOsOaOpeWPo++8jHB1ZXJ0cy5qc2xpYumAmui/h+WFqOWxgOeahOaWueW8j+iwg+eUqOWug+OAglxyXG4gKlxyXG4gKiDmnIDnu4jlvaLmiJDlpoLkuIvmnrbmnoRcclxuICog5Lia5YqhSlMgPC0+IFdBU00gPC0+IHVuaXR5IGpzbGliIDwtPiDmnKxqc1xyXG4gKiDkvYbmlbTmnaHpk77ot6/lhbblrp7pg73lnKjkuIDkuKp2OChqc2NvcmUp6Jma5ouf5py66YeMXHJcbiAqL1xyXG5jb25zdCBsaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi9saWJyYXJ5XCIpO1xyXG5jb25zdCBnZXRGcm9tSlNBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL2dldEZyb21KU0FyZ3VtZW50XCIpO1xyXG5jb25zdCBnZXRGcm9tSlNSZXR1cm5fMSA9IHJlcXVpcmUoXCIuL21peGlucy9nZXRGcm9tSlNSZXR1cm5cIik7XHJcbmNvbnN0IHJlZ2lzdGVyXzEgPSByZXF1aXJlKFwiLi9taXhpbnMvcmVnaXN0ZXJcIik7XHJcbmNvbnN0IHNldFRvSW52b2tlSlNBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSW52b2tlSlNBcmd1bWVudFwiKTtcclxuY29uc3Qgc2V0VG9KU0ludm9rZVJldHVybl8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSlNJbnZva2VSZXR1cm5cIik7XHJcbmNvbnN0IHNldFRvSlNPdXRBcmd1bWVudF8xID0gcmVxdWlyZShcIi4vbWl4aW5zL3NldFRvSlNPdXRBcmd1bWVudFwiKTtcclxubGlicmFyeV8xLmdsb2JhbC53eFJlcXVpcmUgPSBsaWJyYXJ5XzEuZ2xvYmFsLnJlcXVpcmU7XHJcbmxpYnJhcnlfMS5nbG9iYWwuUHVlcnRzV2ViR0wgPSB7XHJcbiAgICBpbml0ZWQ6IGZhbHNlLFxyXG4gICAgZGVidWc6IGZhbHNlLFxyXG4gICAgLy8gcHVlcnRz6aaW5qyh5Yid5aeL5YyW5pe25Lya6LCD55So6L+Z6YeM77yM5bm25oqKVW5pdHnnmoTpgJrkv6HmjqXlj6PkvKDlhaVcclxuICAgIEluaXQoeyBVVEY4VG9TdHJpbmcsIF9tYWxsb2MsIF9tZW1zZXQsIF9tZW1jcHksIF9mcmVlLCBzdHJpbmdUb1VURjgsIGxlbmd0aEJ5dGVzVVRGOCwgdW5pdHlJbnN0YW5jZSB9KSB7XHJcbiAgICAgICAgY29uc3QgZW5naW5lID0gbmV3IGxpYnJhcnlfMS5QdWVydHNKU0VuZ2luZSh7XHJcbiAgICAgICAgICAgIFVURjhUb1N0cmluZywgX21hbGxvYywgX21lbXNldCwgX21lbWNweSwgX2ZyZWUsIHN0cmluZ1RvVVRGOCwgbGVuZ3RoQnl0ZXNVVEY4LCB1bml0eUluc3RhbmNlXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgZXhlY3V0ZU1vZHVsZUNhY2hlID0ge307XHJcbiAgICAgICAgbGV0IGpzRW5naW5lUmV0dXJuZWQgPSBmYWxzZTtcclxuICAgICAgICAvLyBQdWVydHNETEznmoTmiYDmnInmjqXlj6Plrp7njrBcclxuICAgICAgICBsaWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMID0gT2JqZWN0LmFzc2lnbihsaWJyYXJ5XzEuZ2xvYmFsLlB1ZXJ0c1dlYkdMLCAoMCwgZ2V0RnJvbUpTQXJndW1lbnRfMS5kZWZhdWx0KShlbmdpbmUpLCAoMCwgZ2V0RnJvbUpTUmV0dXJuXzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSW52b2tlSlNBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCBzZXRUb0pTSW52b2tlUmV0dXJuXzEuZGVmYXVsdCkoZW5naW5lKSwgKDAsIHNldFRvSlNPdXRBcmd1bWVudF8xLmRlZmF1bHQpKGVuZ2luZSksICgwLCByZWdpc3Rlcl8xLmRlZmF1bHQpKGVuZ2luZSksIHtcclxuICAgICAgICAgICAgLy8gYnJpZGdlTG9nOiB0cnVlLFxyXG4gICAgICAgICAgICBTZXRDYWxsVjg6IGZ1bmN0aW9uIChjYWxsVjhGdW5jdGlvbiwgY2FsbFY4Q29uc3RydWN0b3IsIGNhbGxWOERlc3RydWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIGVuZ2luZS5jYWxsVjhGdW5jdGlvbiA9IGNhbGxWOEZ1bmN0aW9uO1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmNhbGxWOENvbnN0cnVjdG9yID0gY2FsbFY4Q29uc3RydWN0b3I7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuY2FsbFY4RGVzdHJ1Y3RvciA9IGNhbGxWOERlc3RydWN0b3I7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEdldExpYlZlcnNpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxOTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0QXBpTGV2ZWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxOTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0TGliQmFja2VuZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENyZWF0ZUpTRW5naW5lOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoanNFbmdpbmVSZXR1cm5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm9ubHkgb25lIGF2YWlsYWJsZSBqc0VudiBpcyBhbGxvd2VkIGluIFdlYkdMIG1vZGVcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBqc0VuZ2luZVJldHVybmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxMDI0O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBDcmVhdGVKU0VuZ2luZVdpdGhFeHRlcm5hbEVudjogZnVuY3Rpb24gKCkgeyB9LFxyXG4gICAgICAgICAgICBEZXN0cm95SlNFbmdpbmU6IGZ1bmN0aW9uICgpIHsgfSxcclxuICAgICAgICAgICAgR2V0TGFzdEV4Y2VwdGlvbkluZm86IGZ1bmN0aW9uIChpc29sYXRlLCAvKiBvdXQgaW50ICovIHN0cmxlbikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZW5naW5lLmxhc3RFeGNlcHRpb24ubWVzc2FnZSwgc3RybGVuKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgTG93TWVtb3J5Tm90aWZpY2F0aW9uOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBJZGxlTm90aWZpY2F0aW9uRGVhZGxpbmU6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFJlcXVlc3RNaW5vckdhcmJhZ2VDb2xsZWN0aW9uRm9yVGVzdGluZzogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgUmVxdWVzdEZ1bGxHYXJiYWdlQ29sbGVjdGlvbkZvclRlc3Rpbmc6IGZ1bmN0aW9uIChpc29sYXRlKSB7IH0sXHJcbiAgICAgICAgICAgIFNldEdlbmVyYWxEZXN0cnVjdG9yOiBmdW5jdGlvbiAoaXNvbGF0ZSwgX2dlbmVyYWxEZXN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUuZ2VuZXJhbERlc3RydWN0b3IgPSBfZ2VuZXJhbERlc3RydWN0b3I7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFNldE1vZHVsZVJlc29sdmVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEV4ZWN1dGVNb2R1bGU6IGZ1bmN0aW9uIChpc29sYXRlLCBwYXRoU3RyaW5nLCBleHBvcnRlZSkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZmlsZU5hbWUgPSBVVEY4VG9TdHJpbmcocGF0aFN0cmluZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVOYW1lLmluZGV4T2YoJ2xvZy5tanMnKSAhPSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTAyNDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3eCAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB3eFJlcXVpcmUoJ3B1ZXJ0c19taW5pZ2FtZV9qc19yZXNvdXJjZXMvJyArIGZpbGVOYW1lLnJlcGxhY2UoJy5tanMnLCAnLmpzJykucmVwbGFjZSgnLmNqcycsICcuanMnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHBvcnRlZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IHJlc3VsdFtVVEY4VG9TdHJpbmcoZXhwb3J0ZWUpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBub3JtYWxpemUobmFtZSwgdG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnLi8nID09PSB0by5zdWJzdHJpbmcoMCwgMikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byA9IHRvLnN1YnN0cmluZygyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPSAobmFtZS5lbmRzV2l0aCgnLycpID8gbmFtZSA6IG5hbWUuc3Vic3RyaW5nKDAsIG5hbWUubGFzdEluZGV4T2YoJy8nKSArIDEpKSArIHRvO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGF0aFNlZ3MgPSBuYW1lLnJlcGxhY2VBbGwoJy8vJywgJy8nKS5zcGxpdCgnLycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmV0UGF0aCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoU2Vncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoU2Vnc1tpXSA9PSAnLi4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXRQYXRoLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0UGF0aC5wdXNoKHBhdGhTZWdzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXRQYXRoLmpvaW4oJy8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBtb2NrUmVxdWlyZShzcGVjaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgZXhwb3J0czoge30gfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kQ2FjaGVTcGVjaWZpZXIgPSB0cnlGaW5kQW5kR2V0RmluZGVkU3BlY2lmaWVyKHNwZWNpZmllciwgZXhlY3V0ZU1vZHVsZUNhY2hlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZENhY2hlU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmV4cG9ydHMgPSBleGVjdXRlTW9kdWxlQ2FjaGVbZm91bmRDYWNoZVNwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZFNwZWNpZmllciA9IHRyeUZpbmRBbmRHZXRGaW5kZWRTcGVjaWZpZXIoc3BlY2lmaWVyLCBQVUVSVFNfSlNfUkVTT1VSQ0VTKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kU3BlY2lmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZpbGUgbm90IGZvdW5kOiAnICsgc3BlY2lmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY2lmaWVyID0gZm91bmRTcGVjaWZpZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUFVFUlRTX0pTX1JFU09VUkNFU1tzcGVjaWZpZXJdKHJlc3VsdC5leHBvcnRzLCAoc3BlY2lmaWVyVG8pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vY2tSZXF1aXJlKG5vcm1hbGl6ZShzcGVjaWZpZXIsIHNwZWNpZmllclRvKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlTW9kdWxlQ2FjaGVbc3BlY2lmaWVyXSA9IHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5leHBvcnRzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gdHJ5RmluZEFuZEdldEZpbmRlZFNwZWNpZmllcihzcGVjaWZpZXIsIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0cnlmaW5kID0gW3NwZWNpZmllcl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5pbmRleE9mKCcuJykgPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeWZpbmQgPSB0cnlmaW5kLmNvbmNhdChbc3BlY2lmaWVyICsgJy5qcycsIHNwZWNpZmllciArICcudHMnLCBzcGVjaWZpZXIgKyAnLm1qcycsIHNwZWNpZmllciArICcubXRzJ10pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaW5kZWQgPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnlmaW5kLmZvckVhY2goKHMsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmRlZCA9IGZpbmRlZCAhPSAtMSA/IGZpbmRlZCA6ICghIW9ialtzXSA/IGluZGV4IDogLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaW5kZWQgPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ5ZmluZFtmaW5kZWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXF1aXJlUmV0ID0gbW9ja1JlcXVpcmUoZmlsZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhwb3J0ZWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZ2luZS5sYXN0UmV0dXJuQ1NSZXN1bHQgPSByZXF1aXJlUmV0W1VURjhUb1N0cmluZyhleHBvcnRlZSldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IHJlcXVpcmVSZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdEV4Y2VwdGlvbiA9IGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIEV2YWw6IGZ1bmN0aW9uIChpc29sYXRlLCBjb2RlU3RyaW5nLCBwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWxpYnJhcnlfMS5nbG9iYWwuZXZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImV2YWwgaXMgbm90IHN1cHBvcnRlZFwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBVVEY4VG9TdHJpbmcoY29kZVN0cmluZyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsaWJyYXJ5XzEuZ2xvYmFsLmV2YWwoY29kZSk7XHJcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gZ2V0SW50UHRyTWFuYWdlcigpLkdldFBvaW50ZXJGb3JKU1ZhbHVlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC8qRlJlc3VsdEluZm8gKi8gMTAyNDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgU2V0UHVzaEpTRnVuY3Rpb25Bcmd1bWVudHNDYWxsYmFjazogZnVuY3Rpb24gKGlzb2xhdGUsIGNhbGxiYWNrLCBqc0VudklkeCkge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLkdldEpTQXJndW1lbnRzQ2FsbGJhY2sgPSBjYWxsYmFjaztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgVGhyb3dFeGNlcHRpb246IGZ1bmN0aW9uIChpc29sYXRlLCAvKmJ5dGVbXSAqLyBtZXNzYWdlU3RyaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoVVRGOFRvU3RyaW5nKG1lc3NhZ2VTdHJpbmcpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgSW52b2tlSlNGdW5jdGlvbjogZnVuY3Rpb24gKF9mdW5jdGlvbiwgaGFzUmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkuZ2V0SlNGdW5jdGlvbkJ5SWQoX2Z1bmN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmIChmdW5jIGluc3RhbmNlb2YgbGlicmFyeV8xLkpTRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmdpbmUubGFzdFJldHVybkNTUmVzdWx0ID0gZnVuYy5pbnZva2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEwMjQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignSW52b2tlSlNGdW5jdGlvbiBlcnJvcicsIGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmMubGFzdEV4Y2VwdGlvbiA9IGVycjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgR2V0RnVuY3Rpb25MYXN0RXhjZXB0aW9uSW5mbzogZnVuY3Rpb24gKF9mdW5jdGlvbiwgLypvdXQgaW50ICovIGxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZnVuYyA9IGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LmdldEpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnVuYyBpbnN0YW5jZW9mIGxpYnJhcnlfMS5KU0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuZ2luZS5KU1N0cmluZ1RvQ1NTdHJpbmcoZnVuYy5sYXN0RXhjZXB0aW9uLm1lc3NhZ2UgfHwgJycsIGxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3B0ciBpcyBub3QgYSBqc2Z1bmMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgUmVsZWFzZUpTRnVuY3Rpb246IGZ1bmN0aW9uIChpc29sYXRlLCBfZnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGxpYnJhcnlfMS5qc0Z1bmN0aW9uT3JPYmplY3RGYWN0b3J5LnJlbW92ZUpTRnVuY3Rpb25CeUlkKF9mdW5jdGlvbik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlbGVhc2VKU09iamVjdDogZnVuY3Rpb24gKGlzb2xhdGUsIG9iaikge1xyXG4gICAgICAgICAgICAgICAgbGlicmFyeV8xLmpzRnVuY3Rpb25Pck9iamVjdEZhY3RvcnkucmVtb3ZlSlNPYmplY3RCeUlkKG9iaik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFJlc2V0UmVzdWx0OiBmdW5jdGlvbiAocmVzdWx0SW5mbykge1xyXG4gICAgICAgICAgICAgICAgZW5naW5lLmxhc3RSZXR1cm5DU1Jlc3VsdCA9IG51bGw7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIENyZWF0ZUluc3BlY3RvcjogZnVuY3Rpb24gKGlzb2xhdGUsIHBvcnQpIHsgfSxcclxuICAgICAgICAgICAgRGVzdHJveUluc3BlY3RvcjogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgSW5zcGVjdG9yVGljazogZnVuY3Rpb24gKGlzb2xhdGUpIHsgfSxcclxuICAgICAgICAgICAgTG9naWNUaWNrOiBmdW5jdGlvbiAoaXNvbGF0ZSkgeyB9LFxyXG4gICAgICAgICAgICBTZXRMb2dDYWxsYmFjazogZnVuY3Rpb24gKGxvZywgbG9nV2FybmluZywgbG9nRXJyb3IpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=