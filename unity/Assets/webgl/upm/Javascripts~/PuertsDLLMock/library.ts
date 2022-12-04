/**
 * 一次函数调用的info
 * 对应v8::FunctionCallbackInfo
 */
export class FunctionCallbackInfo {
    args: any[];
    returnValue: any;

    constructor(args: any[]) {
        this.args = args;
    }

    recycle(): void {
        this.args = null;
        this.returnValue = void 0;
    }
}

/**
 * 把FunctionCallbackInfo以及其参数转化为c#可用的intptr
 */
export class FunctionCallbackInfoPtrManager {
    // FunctionCallbackInfo的列表，以列表的index作为IntPtr的值
    private static infos: FunctionCallbackInfo[] = [new FunctionCallbackInfo([0])] // 这里原本只是个普通的0
    // FunctionCallbackInfo用完后，就可以放入回收列表，以供下次复用
    private static freeInfosIndex: MockIntPtr[] = [];

    /**
     * intptr的格式为id左移四位
     * 
     * 右侧四位就是为了放下参数的序号，用于表示callbackinfo参数的intptr
     */
    static GetMockPointer(args: any[]): MockIntPtr {
        let index: number;
        index = this.freeInfosIndex.pop();
        // index最小为1
        if (index) {
            this.infos[index].args = args;
        } else {
            index = this.infos.push(new FunctionCallbackInfo(args)) - 1;
        }
        return index << 4;
    }

    static GetByMockPointer(intptr: MockIntPtr): FunctionCallbackInfo {
        return this.infos[intptr >> 4];
    }

    static GetReturnValueAndRecycle(intptr: MockIntPtr): any {
        const index = intptr >> 4;
        this.freeInfosIndex.push(index);
        let info = this.infos[index];
        let ret = info.returnValue;
        info.recycle();
        return ret;
    }

    static ReleaseByMockIntPtr(intptr: MockIntPtr) {
        const index = intptr >> 4;
        this.infos[index].recycle();
        this.freeInfosIndex.push(index);
    }

    static GetArgsByMockIntPtr<T>(ptr: MockIntPtr): T {
        const callbackInfoIndex = ptr >> 4;
        const argsIndex = ptr & 15;
        const info: FunctionCallbackInfo = this.infos[callbackInfoIndex];
        return info.args[argsIndex] as T;
    }
}

export class Ref<T> {
    public value: T
}

/**
 * 代表一个JSFunction
 */
export class JSFunction {
    public _func: (...args: any[]) => any;

    public readonly id: number;

    public args: any[] = [];

    public lastException: Error = null;

    constructor(id: number, func: (...args: any[]) => any) {
        this._func = func;
        this.id = id;
    }
    public invoke() {
        var args = [...this.args];
        this.args.length = 0;
        return this._func.apply(this, args);
    }
}

/**
 * 代表一个JSObject
 */
export class JSObject {
    private _obj: object

    public id: number

    constructor(id: number, obj: object) {
        this._obj = obj;
        this.id = id;
    }

    public getObject (): object {
        return this._obj;
    }
}

export class jsFunctionOrObjectFactory {
    private static regularID: number = 1;
    private static idMap = new WeakMap<Function | object, number>();
    private static jsFuncOrObjectKV: { [id: number]: JSFunction | JSObject } = {};

    public static getOrCreateJSFunction(funcValue: (...args: any[]) => any) {
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

    public static getOrCreateJSObject(obj: object) {
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

    public static getJSObjectById(id: number): JSObject {
        return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] as JSObject;
    }

    public static removeJSObjectById(id: number): void {
        const jsObject = jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] as JSObject;
        jsFunctionOrObjectFactory.idMap.delete(jsObject.getObject());
        delete jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
    }

    public static getJSFunctionById(id: number): JSFunction {
        return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] as JSFunction;
    }

    public static removeJSFunctionById(id: number): void {
        const jsFunc = jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] as JSFunction;
        jsFunctionOrObjectFactory.idMap.delete(jsFunc._func);
        delete jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
    }
}

/**
 * CSharp对象记录表，记录所有CSharp对象并分配id
 * 和puerts.dll所做的一样
 */
export class CSharpObjectMap {
    public classes: {
        (): void;
        createFromCS(csID: number): any;
        [key: string]: any;
    }[] = [null];

    private nativeObjectKV: Map<CSIdentifier, WeakRef<any>> = new Map();
    // private nativeObjectKV: { [objectID: CSIdentifier]: WeakRef<any> } = {};
    // private csIDWeakMap: WeakMap<any, CSIdentifier> = new WeakMap();

    public namesToClassesID: { [name: string]: number } = {};
    public classIDWeakMap = new WeakMap();

    add(csID: CSIdentifier, obj: any) {
        // this.nativeObjectKV[csID] = createWeakRef(obj);
        // this.csIDWeakMap.set(obj, csID);
        this.nativeObjectKV.set(csID, createWeakRef(obj));
        Object.defineProperty(obj, '_puerts_csid_', {
            value: csID
        })
    }
    remove(csID: CSIdentifier) {
        // delete this.nativeObjectKV[csID];
        this.nativeObjectKV.delete(csID);
    }
    findOrAddObject(csID: CSIdentifier, classID: number) {
        let ret = this.nativeObjectKV.get(csID);
        // let ret = this.nativeObjectKV[csID];
        if (ret && (ret = ret.deref())) {
            return ret;
        }
        ret = this.classes[classID].createFromCS(csID);
        // this.add(csID, ret); 构造函数里负责调用
        return ret;
    }
    getCSIdentifierFromObject(obj: any) {
        // return this.csIDWeakMap.get(obj);
        return obj._puerts_csid_;
    }
}

interface Destructor {
    (heldValue: CSIdentifier): any,
    ref: number
};
var destructors: { [csIdentifier: CSIdentifier]: Destructor } = {};

declare let global: any;
global = global || globalThis || window;
global.global = global;
export { global };

declare const WXWeakRef: any;
const createWeakRef: <T extends object>(obj: any) => WeakRef<T> = (function () {
    if (typeof WeakRef == 'undefined') {
        if (typeof WXWeakRef == 'undefined') {
            console.error("WeakRef is not defined. maybe you should use newer environment");
            return function(obj: any) {
                return { deref() { return obj } }
            }
        }

        console.warn("using WXWeakRef");
        return function (obj: any) {
            return new WXWeakRef(obj);
        }
    }    
    return function(obj: any) {
        return new WeakRef(obj);
    }
})();
export { createWeakRef }
/**
 * JS对象生命周期监听
 */
interface FinalizationRegistryMock<T> extends FinalizationRegistry<T> {}
class FinalizationRegistryMock<T> {
    private _handler: (value: T) => void;

    private refs: WeakRef<any>[] = [];
    private helds: T[] = [];
    private availableIndex: number[] = [];

    constructor(handler: (value: T) => void) {
        console.warn("FinalizationRegister is not defined. using FinalizationRegistryMock");
        global._puerts_registry = this;
        this._handler = handler;
    }
    public register(obj: object, heldValue: T) {
        if (this.availableIndex.length) {
            const index = this.availableIndex.pop();
            this.refs[index] = createWeakRef(obj);
            this.helds[index] = heldValue;

        } else {
            this.refs.push(createWeakRef(obj));
            this.helds.push(heldValue);
        }
    }

    /**
     * 清除可能已经失效的WeakRef
     */
    private iteratePosition: number = 0;
    public cleanup(part: number = 1) {
        const stepCount = this.refs.length / part;
        let i = this.iteratePosition;
        for (
            let currentStep = 0; 
            i < this.refs.length && currentStep < stepCount; 
            i = (i == this.refs.length - 1 ? 0 : i + 1), currentStep++
        ) {
            if (this.refs[i] == null) {
                continue;
            }
            if (!this.refs[i].deref()) 
            {
                // 目前没有内存整理能力，如果游戏中期ref很多但后期少了，这里就会白费遍历次数
                // 但遍历也只是一句==和continue，浪费影响不大
                this.availableIndex.push(i);
                this.refs[i] = null;
                try {
                    this._handler(this.helds[i]);
                } catch(e) {
                    console.error(e);
                }
            }
        }
        this.iteratePosition = i;
    }
}
var registry: FinalizationRegistry<any> = null;
function init() {
    registry = new (
        typeof FinalizationRegistry == 'undefined' ? FinalizationRegistryMock : FinalizationRegistry
    )(function (heldValue: CSIdentifier) {
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
export function OnFinalize(obj: object, heldValue: any, callback: (heldValue: CSIdentifier) => any) {
    if (!registry) {
        init();
    }
    let originCallback = destructors[heldValue];
    if (originCallback) {
        // WeakRef内容释放时机可能比finalizationRegistry的触发更早，前面如果发现weakRef为空会重新创建对象
        // 但之前对象的finalizationRegistry最终又肯定会触发。
        // 所以如果遇到这个情况，需要给destructor加计数
        ++originCallback.ref;
    } else {
        (callback as Destructor).ref = 1;
        destructors[heldValue] = (callback as Destructor);
    }
    registry.register(obj, heldValue);
}

export namespace PuertsJSEngine {
    export interface EngineConstructorParam {
        UTF8ToString: (strPtr: CSString) => string,
        _malloc: (size: number) => number,
        _memset: (ptr: number, ch: number, size: number) => number,
        _memcpy: (dst: number, src: number, size: number) => void,
        _free: (ptr: number) => void,
        stringToUTF8: (str: string, buffer: any, size: number) => any,
        lengthBytesUTF8: (str: string) => number,
        unityInstance: any,
    }
    export interface UnityAPI {
        UTF8ToString: (strPtr: CSString) => string,
        _malloc: (size: number) => number,
        _memset: (ptr: number, ch: number, size: number) => number,
        _memcpy: (dst: number, src: number, size: number) => void,
        _free: (ptr: number) => void,
        stringToUTF8: (str: string, buffer: any, size: number) => any,
        lengthBytesUTF8: (str: string) => number,
        HEAP8: Uint8Array,
        HEAP32: Uint32Array,
        dynCall_viiiii: Function,
        dynCall_viii: Function,
        dynCall_iiiii: Function
    }
}

export class PuertsJSEngine {
    public readonly csharpObjectMap: CSharpObjectMap

    public readonly unityApi: PuertsJSEngine.UnityAPI;

    public lastReturnCSResult: any = null;
    public lastException: Error = null;

    // 这四个是Puerts.WebGL里用于wasm通信的的CSharp Callback函数指针。
    public callV8Function: MockIntPtr;
    public callV8Constructor: MockIntPtr;
    public callV8Destructor: MockIntPtr;

    // 这两个是Puerts用的的真正的CSharp函数指针
    public GetJSArgumentsCallback: IntPtr
    public generalDestructor: IntPtr

    constructor(ctorParam: PuertsJSEngine.EngineConstructorParam) {
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
            get: function() {
                return unityInstance.HEAP32
            }
        })
        Object.defineProperty(this.unityApi, 'HEAP8', {
            get: function() {
                return unityInstance.HEAP8
            }
        });

        global.__tgjsEvalScript = typeof eval == "undefined" ? () => { } : eval;
        global.__tgjsSetPromiseRejectCallback = function (callback: (...args: any[]) => any) {
            if (typeof wx != 'undefined') {
                wx.onUnhandledRejection(callback);

            } else {
                window.addEventListener("unhandledrejection", callback);
            }
        }
        global.__puertsGetLastException = () => {
            return this.lastException
        }
    }

    JSStringToCSString(returnStr: string, /** out int */length: number) {
        if (returnStr === null || returnStr === undefined) {
            return 0;
        }
        var byteCount = this.unityApi.lengthBytesUTF8(returnStr);
        setOutValue32(this, length, byteCount);
        var buffer = this.unityApi._malloc(byteCount + 1);
        this.unityApi.stringToUTF8(returnStr, buffer, byteCount + 1);
        return buffer;
    }

    makeV8FunctionCallbackFunction(isStatic: bool, functionPtr: IntPtr, callbackIdx: number) {
        // 不能用箭头函数！此处返回的函数会放到具体的class上，this有含义。
        const engine = this;
        return function (...args: any[]) {
            let callbackInfoPtr = FunctionCallbackInfoPtrManager.GetMockPointer(args);
            engine.callV8FunctionCallback(
                functionPtr,
                // getIntPtrManager().GetPointerForJSValue(this),
                isStatic ? 0:engine.csharpObjectMap.getCSIdentifierFromObject(this),
                callbackInfoPtr,
                args.length,
                callbackIdx
            )
            return FunctionCallbackInfoPtrManager.GetReturnValueAndRecycle(callbackInfoPtr);
        }
    }

    callV8FunctionCallback(functionPtr: IntPtr, selfPtr: CSIdentifier, infoIntPtr: MockIntPtr, paramLen: number, callbackIdx: number) {
        this.unityApi.dynCall_viiiii(this.callV8Function, functionPtr, infoIntPtr, selfPtr, paramLen, callbackIdx);
    }

    callV8ConstructorCallback(functionPtr: IntPtr, infoIntPtr: MockIntPtr, paramLen: number, callbackIdx: number) {
        return this.unityApi.dynCall_iiiii(this.callV8Constructor, functionPtr, infoIntPtr, paramLen, callbackIdx);
    }

    callV8DestructorCallback(functionPtr: IntPtr, selfPtr: CSIdentifier, callbackIdx: number) {
        this.unityApi.dynCall_viii(this.callV8Destructor, functionPtr, selfPtr, callbackIdx);
    }
}

export function GetType(engine: PuertsJSEngine, value: any): number {
    if (value === null || value === undefined) { return 1 }
    if (typeof value == 'number') { return 4 }
    if (typeof value == 'string') { return 8 }
    if (typeof value == 'boolean') { return 16 }
    if (typeof value == 'function') { return 256 }
    if (value instanceof Date) { return 512 }
    if (value instanceof Array) { return 128 }
    if (value instanceof ArrayBuffer || value instanceof Uint8Array) { return 1024 }
    if (engine.csharpObjectMap.getCSIdentifierFromObject(value)) { return 32 }
    return 64;
}

export function makeBigInt(low: number, high: number) {
    return (BigInt(high >>> 0) << BigInt(32)) + BigInt(low >>> 0)
}

export function setOutValue32(engine: PuertsJSEngine, valuePtr: number, value: any) {
    engine.unityApi.HEAP32[valuePtr >> 2] = value;
}

export function setOutValue8(engine: PuertsJSEngine, valuePtr: number, value: any) {
    engine.unityApi.HEAP8[valuePtr] = value;
}