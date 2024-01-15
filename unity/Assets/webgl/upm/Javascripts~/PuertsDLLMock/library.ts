/**
 * 一次函数调用的info
 * 对应v8::FunctionCallbackInfo
 */
export class FunctionCallbackInfo {
    args: any[];
    returnValue: any;
    stack: number = 0;

    constructor(args: any[]) {
        this.args = args;
    }

    recycle(): void {
        this.stack = 0;
        this.args = null;
        this.returnValue = void 0;
    }
}

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
export class FunctionCallbackInfoPtrManager {
    // FunctionCallbackInfo的列表，以列表的index作为IntPtr的值
    private infos: FunctionCallbackInfo[] = [new FunctionCallbackInfo([0])] // 这里原本只是个普通的0
    // FunctionCallbackInfo用完后，将其序号放入“回收列表”，下次就能继续服用该index，而不必让infos数组无限扩展下去
    private freeInfosIndex: MockIntPtr[] = [];
    private freeCallbackInfoMemoryByLength: {
        [length: number]: number[]
    } = {};
    private freeRefMemory: number[] = []

    private readonly engine: PuertsJSEngine;

    constructor(engine: PuertsJSEngine) {
        this.engine = engine;
    }

    private allocCallbackInfoMemory(argsLength: number): number {
        const cacheArray = this.freeCallbackInfoMemoryByLength[argsLength];
        if (cacheArray && cacheArray.length) {
            return cacheArray.pop();

        } else {
            return this.engine.unityApi._malloc((argsLength * ArgumentValueLengthIn32 + 1) << 2);
        }
    }
    private allocRefMemory() {
        if (this.freeRefMemory.length) return this.freeRefMemory.pop();
        return this.engine.unityApi._malloc(ArgumentValueLengthIn32 << 2);
    }
    private recycleRefMemory(bufferPtr: number) {
        if (this.freeRefMemory.length > 20) {
            this.engine.unityApi._free(bufferPtr);
        }
        else {
            this.freeRefMemory.push(bufferPtr);
        }
    }
    private recycleCallbackInfoMemory(bufferPtr: number, args: any[]) {
        const argsLength = args.length;
        if (!this.freeCallbackInfoMemoryByLength[argsLength] && argsLength < 5) {
            this.freeCallbackInfoMemoryByLength[argsLength] = [];
        }
        const cacheArray = this.freeCallbackInfoMemoryByLength[argsLength];
        if (!cacheArray) return;

        const bufferPtrIn32 = bufferPtr << 2;
        for (let i = 0; i < argsLength; ++i) {
            if (args[i] instanceof Array && args[i].length == 1) {
                this.recycleRefMemory(this.engine.unityApi.HEAP32[bufferPtrIn32 + i * ArgumentValueLengthIn32 + 1])
            }
        }
        // 拍脑袋定的最大缓存个数大小。 50 - 参数个数 * 10
        if (cacheArray.length > (50 - argsLength * 10)) {
            this.engine.unityApi._free(bufferPtr);

        } else {
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
    GetMockPointer(args: any[]): MockIntPtr {
        const argsLength = args.length;
        let bufferPtrIn8 = this.allocCallbackInfoMemory(argsLength);

        let index: number = this.freeInfosIndex.pop();
        let functionCallbackInfo: FunctionCallbackInfo;
        // index最小为1
        if (index) {
            (functionCallbackInfo = this.infos[index]).args = args;
        } else {
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

            unityApi.HEAP32[jsValuePtr] = jsValueType;    // jsvaluetype
            if (jsValueType == 2 || jsValueType == 4 || jsValueType == 512) {
                // bigint、number or date
                $FillArgumentFinalNumberValue(this.engine, arg, jsValueType, jsValuePtr + 1);    // value
            } else if (jsValueType == 8) {
                if (functionCallbackInfo.stack == 0) {
                    functionCallbackInfo.stack = unityApi.stackSave();
                }
                unityApi.HEAP32[jsValuePtr + 1] = $GetArgumentFinalValue(
                    this.engine, arg, jsValueType, (jsValuePtr + 3) << 2
                );
            } else if (jsValueType == 64 && arg instanceof Array && arg.length == 1) {
                // maybe a ref
                unityApi.HEAP32[jsValuePtr + 1] = $GetArgumentFinalValue(
                    this.engine, arg, jsValueType, 0
                );

                const refPtrIn8 = unityApi.HEAP32[jsValuePtr + 3] = this.allocRefMemory();
                const refPtr = refPtrIn8 >> 2
                const refValueType = unityApi.HEAP32[refPtr] = GetType(this.engine, arg[0])
                if (refValueType == 2 || refValueType == 4 || refValueType == 512) {
                    // number or date
                    $FillArgumentFinalNumberValue(this.engine, arg[0], refValueType, refPtr + 1);    // value
                } else {
                    unityApi.HEAP32[refPtr + 1] = $GetArgumentFinalValue(
                        this.engine, arg[0], refValueType, (refPtr + 3) << 2
                    );
                }
                unityApi.HEAP32[refPtr + 4] = bufferPtrIn8; // a pointer to the info

            } else {
                // other
                unityApi.HEAP32[jsValuePtr + 1] = $GetArgumentFinalValue(
                    this.engine, arg, jsValueType, (jsValuePtr + 3) << 2
                );
            }
            unityApi.HEAP32[jsValuePtr + 4] = bufferPtrIn8; // a pointer to the info
        }
        return bufferPtrIn8;
    }

    // static GetByMockPointer(intptr: MockIntPtr): FunctionCallbackInfo {
    //     return this.infos[intptr >> 4];
    // }
    GetByMockPointer(ptrIn8: MockIntPtr): FunctionCallbackInfo {
        const ptrIn32 = ptrIn8 >> 2;
        const index = this.engine.unityApi.HEAP32[ptrIn32];
        return this.infos[index];
    }

    GetReturnValueAndRecycle(ptrIn8: MockIntPtr): any {
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

    ReleaseByMockIntPtr(ptrIn8: MockIntPtr) {
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

    GetArgsByMockIntPtr<T>(valuePtrIn8: MockIntPtr): T {
        let heap32 = this.engine.unityApi.HEAP32;
        const infoPtrIn8 = heap32[(valuePtrIn8 >> 2) + 4];
        const callbackInfoIndex = heap32[infoPtrIn8 >> 2];

        const argsIndex = (valuePtrIn8 - infoPtrIn8 - 4) / (4 * ArgumentValueLengthIn32);
        return this.infos[callbackInfoIndex].args[argsIndex] as T;
    }
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

    public getObject(): object {
        return this._obj;
    }
}

export class jsFunctionOrObjectFactory {
    private static regularID: number = 1;
    private static freeID: number[] = [];
    private static idMap = new WeakMap<Function | object, number>();
    private static jsFuncOrObjectKV: { [id: number]: JSFunction | JSObject } = {};

    public static getOrCreateJSFunction(funcValue: (...args: any[]) => any): JSFunction {
        let id = jsFunctionOrObjectFactory.idMap.get(funcValue);
        if (id) {
            return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] as JSFunction;
        }

        if (this.freeID.length) {
            id = this.freeID.pop();
        } else {
            id = jsFunctionOrObjectFactory.regularID++;
        }

        const func = new JSFunction(id, funcValue);
        jsFunctionOrObjectFactory.idMap.set(funcValue, id);
        jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] = func;

        return func;
    }

    public static getOrCreateJSObject(obj: object): JSObject {
        let id = jsFunctionOrObjectFactory.idMap.get(obj);
        if (id) {
            return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] as JSObject;
        }

        if (this.freeID.length) {
            id = this.freeID.pop();
        } else {
            id = jsFunctionOrObjectFactory.regularID++;
        }

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
        if (!jsObject) return console.warn('removeJSObjectById failed: id is invalid: ' + id);
        jsFunctionOrObjectFactory.idMap.delete(jsObject.getObject());
        delete jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        this.freeID.push(id);
    }

    public static getJSFunctionById(id: number): JSFunction {
        return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] as JSFunction;
    }

    public static removeJSFunctionById(id: number): void {
        const jsFunc = jsFunctionOrObjectFactory.jsFuncOrObjectKV[id] as JSFunction;
        if (!jsFunc) return console.warn('removeJSFunctionById failed: id is invalid: ' + id);
        jsFunctionOrObjectFactory.idMap.delete(jsFunc._func);
        delete jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        this.freeID.push(id);
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

    constructor() {
        this._memoryDebug && setInterval(() => {
            console.log('addCalled', this.addCalled);
            console.log('removeCalled', this.removeCalled);
            console.log('wr', this.nativeObjectKV.size);
        }, 1000)
    }

    private _memoryDebug = false
    private addCalled: number = 0;
    private removeCalled: number = 0;

    add(csID: CSIdentifier, obj: any) {
        this._memoryDebug && this.addCalled++;
        // this.nativeObjectKV[csID] = createWeakRef(obj);
        // this.csIDWeakMap.set(obj, csID);
        this.nativeObjectKV.set(csID, createWeakRef(obj));
        obj['$csid'] = csID;
    }
    remove(csID: CSIdentifier) {
        this._memoryDebug && this.removeCalled++;
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
        return obj ? obj.$csid : 0;
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
            return function (obj: any) {
                return { deref() { return obj } }
            }
        }

        console.warn("using WXWeakRef");
        return function (obj: any) {
            return new WXWeakRef(obj);
        }
    }
    return function (obj: any) {
        return new WeakRef(obj);
    }
})();
export { createWeakRef }
/**
 * JS对象生命周期监听
 */
interface FinalizationRegistryMock<T> extends FinalizationRegistry<T> { }
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
            if (!this.refs[i].deref()) {
                // 目前没有内存整理能力，如果游戏中期ref很多但后期少了，这里就会白费遍历次数
                // 但遍历也只是一句==和continue，浪费影响不大
                this.availableIndex.push(i);
                this.refs[i] = null;
                try {
                    this._handler(this.helds[i]);
                } catch (e) {
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
    export type EngineConstructorParam = UnityAPI;
    
    export interface UnityAPI {
        UTF8ToString: (strPtr: CSString) => string,
        _malloc: (size: number) => number,
        _free: (ptr: number) => void,
        _setTempRet0: (value: number) => void,
        stringToUTF8: (str: string, buffer: any, size: number) => any,
        lengthBytesUTF8: (str: string) => number,
        stackAlloc: (size: number) => number,
        stackSave: () => number,
        stackRestore: (stack: number) => void,
        _CallCSharpFunctionCallback: (functionPtr: IntPtr, selfPtr: CSIdentifier, infoIntPtr: MockIntPtr, paramLen: number, callbackIdx: number) => void;
        _CallCSharpConstructorCallback: (functionPtr: IntPtr, infoIntPtr: MockIntPtr, paramLen: number, callbackIdx: number) => number;
        _CallCSharpDestructorCallback: (functionPtr: IntPtr, selfPtr: CSIdentifier, callbackIdx: number) => void;
        HEAP8: Int8Array;
        HEAPU8: Uint8Array;
        HEAP32: Int32Array;
        HEAPF32: Float32Array;
        HEAPF64: Float64Array;   
    }
}

export class PuertsJSEngine {
    public readonly csharpObjectMap: CSharpObjectMap
    public readonly functionCallbackInfoPtrManager: FunctionCallbackInfoPtrManager

    public readonly unityApi: PuertsJSEngine.UnityAPI;

    /** 字符串缓存，默认为256字节 */
    public strBuffer: number;
    public stringBufferSize: number = 256;
    public lastReturnCSResult: any = null;
    public lastException: Error = null;

    // 这两个是Puerts用的的真正的CSharp函数指针
    public GetJSArgumentsCallback: IntPtr
    public generalDestructor: IntPtr

    constructor(ctorParam: PuertsJSEngine.EngineConstructorParam) {
        this.csharpObjectMap = new CSharpObjectMap();
        this.functionCallbackInfoPtrManager = new FunctionCallbackInfoPtrManager(this);
        const { 
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
        } = ctorParam;

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

    /** call when wasm grow memory */
    updateGlobalBufferAndViews(
        HEAP8: Int8Array,
        HEAPU8: Uint8Array,
        HEAP32: Int32Array,
        HEAPF32: Float32Array,
        HEAPF64: Float64Array,
        ): void{
        let unityApi = this.unityApi;
        unityApi.HEAP8 = HEAP8;
        unityApi.HEAPU8 = HEAPU8;
        unityApi.HEAP32 = HEAP32;
        unityApi.HEAPF32 = HEAPF32;
        unityApi.HEAPF64 = HEAPF64;
    }

    memcpy(dest: number, src: number, num: number) {
        this.unityApi.HEAPU8.copyWithin(dest, src, src + num);
    }

    JSStringToCSString(returnStr: string, /** out int */lengthOffset: number) {
        if (returnStr === null || returnStr === undefined) {
            return 0;
        }
        var byteCount = this.unityApi.lengthBytesUTF8(returnStr);
        setOutValue32(this, lengthOffset, byteCount);
        let buffer = this.unityApi._malloc(byteCount + 1);
        this.unityApi.stringToUTF8(returnStr, buffer, byteCount + 1);
        return buffer;
    }

    JSStringToTempCSString(returnStr: string, /** out int */lengthOffset: number) {
        if (returnStr === null || returnStr === undefined) {
            return 0;
        }
        var byteCount = this.unityApi.lengthBytesUTF8(returnStr);
        setOutValue32(this, lengthOffset, byteCount);
        if (this.stringBufferSize < byteCount + 1) {
            this.strBuffer = this.unityApi._malloc(this.stringBufferSize = Math.max(2 * this.stringBufferSize, byteCount + 1));
        }
        this.unityApi.stringToUTF8(returnStr, this.strBuffer, byteCount + 1);
        return this.strBuffer;
    }

    JSStringToCSStringOnStack(returnStr: string, /** out int */lengthOffset: number) {
        if (returnStr === null || returnStr === undefined) {
            return 0;
        }
        var byteCount = this.unityApi.lengthBytesUTF8(returnStr);
        setOutValue32(this, lengthOffset, byteCount);
        var buffer = this.unityApi.stackAlloc(byteCount + 1);
        this.unityApi.stringToUTF8(returnStr, buffer, byteCount + 1);
        return buffer;
    }

    makeCSharpFunctionCallbackFunction(isStatic: bool, functionPtr: IntPtr, callbackIdx: number) {
        // 不能用箭头函数！此处返回的函数会赋值到具体的class上，其this指针有含义。
        const engine = this;
        return function (...args: any[]) {
            let callbackInfoPtr = engine.functionCallbackInfoPtrManager.GetMockPointer(args);
            try {
                engine.callCSharpFunctionCallback(
                    functionPtr,
                    // getIntPtrManager().GetPointerForJSValue(this),
                    isStatic ? 0 : engine.csharpObjectMap.getCSIdentifierFromObject(this),
                    callbackInfoPtr,
                    args.length,
                    callbackIdx
                );

                return engine.functionCallbackInfoPtrManager.GetReturnValueAndRecycle(callbackInfoPtr);

            } catch (e) {
                engine.functionCallbackInfoPtrManager.ReleaseByMockIntPtr(callbackInfoPtr);
                throw e;
            }
        }
    }

    callCSharpFunctionCallback(functionPtr: IntPtr, selfPtr: CSIdentifier, infoIntPtr: MockIntPtr, paramLen: number, callbackIdx: number) {
        this.unityApi._CallCSharpFunctionCallback(functionPtr, infoIntPtr, selfPtr, paramLen, callbackIdx);
    }

    callCSharpConstructorCallback(functionPtr: IntPtr, infoIntPtr: MockIntPtr, paramLen: number, callbackIdx: number) {
        return this.unityApi._CallCSharpConstructorCallback(functionPtr, infoIntPtr, paramLen, callbackIdx);
    }

    callCSharpDestructorCallback(functionPtr: IntPtr, selfPtr: CSIdentifier, callbackIdx: number) {
        this.unityApi._CallCSharpDestructorCallback(functionPtr, selfPtr, callbackIdx);
    }
}

export function GetType(engine: PuertsJSEngine, value: any): number {
    if (value === null || value === undefined) { return 1 }
    if (isBigInt(value)) { return 2 }
    if (typeof value == 'number') { return 4 }
    if (typeof value == 'string') { return 8 }
    if (typeof value == 'boolean') { return 16 }
    if (typeof value == 'function') { return 256 }
    if (value instanceof Date) { return 512 }
    // if (value instanceof Array) { return 128 }
    if (value instanceof Array) { return 64 }
    if (value instanceof ArrayBuffer || value instanceof Uint8Array) { return 1024 }
    if (engine.csharpObjectMap.getCSIdentifierFromObject(value)) { return 32 }
    return 64;
}

export function makeBigInt(low: number, high: number) {
    return (BigInt(high) << 32n) | BigInt(low >>> 0);
}

export function setOutValue32(engine: PuertsJSEngine, valuePtr: number, value: any) {
    engine.unityApi.HEAP32[valuePtr >> 2] = value;
}

export function setOutValue8(engine: PuertsJSEngine, valuePtr: number, value: any) {
    engine.unityApi.HEAP8[valuePtr] = value;
}

export function isBigInt(value: unknown): value is bigint {
    return value instanceof BigInt || typeof value === 'bigint';
}

export function returnBigInt(engine: PuertsJSEngine, value: bigint): number {
    engine.unityApi._setTempRet0(Number(value >> 32n)); // high
    return Number(value & 0xffffffffn); // low
}

function writeBigInt(engine: PuertsJSEngine, ptrIn32: number, value: bigint) {
    engine.unityApi.HEAP32[ptrIn32] = Number(value & 0xffffffffn); // low
    engine.unityApi.HEAP32[ptrIn32 + 1] = Number(value >> 32n); // high
}

const tmpInt3Arr = new Int32Array(2);
const tmpFloat64Arr = new Float64Array(tmpInt3Arr.buffer);

function writeNumber(engine: PuertsJSEngine, ptrIn32: number, value: number): void {
    // number in js is double
    tmpFloat64Arr[0] = value;
    engine.unityApi.HEAP32[ptrIn32] = tmpInt3Arr[0];
    engine.unityApi.HEAP32[ptrIn32 + 1] = tmpInt3Arr[1];
}

function $FillArgumentFinalNumberValue(engine: PuertsJSEngine, val: any, jsValueType: number, valPtrIn32: number): number {
    if (val === null || val === undefined) { return; }
    switch (jsValueType) {
        case 2: {
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

function $GetArgumentFinalValue(engine: PuertsJSEngine, val: any, jsValueType: number, lengthOffset: number): number {
    if (!jsValueType) jsValueType = GetType(engine, val);

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