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

    public lastExceptionInfo: string = '';

    constructor(func: (...args: any[]) => any) {
        this._func = func;
        this.id = jsFunctionOrObjectFactory.regularID++;
        jsFunctionOrObjectFactory.idMap.set(func, this.id);
        jsFunctionOrObjectFactory.jsFuncOrObjectKV[this.id] = this;
    }
    public invoke() {
        var args = [...this.args];
        this.args.length = 0;
        return this._func.apply(this, args);
    }
}

export class jsFunctionOrObjectFactory {
    public static regularID: number = 1;
    public static idMap = new WeakMap<Function, number>();
    public static jsFuncOrObjectKV: { [id: number]: JSFunction } = {};

    public static getOrCreateJSFunction(funcValue: (...args: any[]) => any) {
        const id = jsFunctionOrObjectFactory.idMap.get(funcValue);
        if (id) {
            return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        }
        return new JSFunction(funcValue);
    }

    public static getJSFunctionById(id: number): JSFunction {
        return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
    }

    public static removeJSFunctionById(id: number) {
        const jsFunc = jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
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

    private nativeObjectKV: { [objectID: CSIdentifer]: WeakRef<any> } = {};
    private csIDWeakMap: WeakMap<any, CSIdentifer> = new WeakMap();

    public namesToClassesID: { [name: string]: number } = {};
    public classIDWeakMap = new WeakMap();

    add(csID: CSIdentifer, obj: any) {
        this.nativeObjectKV[csID] = new WeakRef(obj);
        this.csIDWeakMap.set(obj, csID);
    }
    findOrAddObject(csID: CSIdentifer, classID: number) {
        var ret;
        if (this.nativeObjectKV[csID] && (ret = this.nativeObjectKV[csID].deref())) {
            return ret;
        }
        ret = this.classes[classID].createFromCS(csID);
        // this.add(csID, ret); 构造函数里负责调用
        return ret;
    }
    getCSIdentiferFromObject(obj: any) {
        return this.csIDWeakMap.get(obj);
    }
}

var destructors: { [CSObjectID: number]: (heldValue: any) => any } = {};

/**
 * JS对象声明周期监听
 */
var registry: FinalizationRegistry<any> = null;
function init() {
    registry = new FinalizationRegistry(function (heldValue: any) {
        var callback = destructors[heldValue];
        if (!callback) {
            throw new Error("cannot find destructor for " + heldValue);
        }
        delete destructors[heldValue]
        callback(heldValue);
    });
}
export function OnFinalize(obj: object, heldValue: any, callback: (heldValue: any) => any) {
    if (!registry) {
        init();
    }
    destructors[heldValue] = callback;
    registry.register(obj, heldValue);
}
declare let global: any;
global = global || globalThis || window;
global.global = global;
export { global };

export namespace PuertsJSEngine {
    export interface UnityAPI {
        Pointer_stringify: (strPtr: CSString) => string,
        _malloc: (size: number) => number,
        _memset: (ptr: number, ch: number, size: number) => number,
        _memcpy: (dst: number, src: number, size: number) => number,
        _free: (ptr: number) => void,
        stringToUTF8: (str: string, buffer: any, size: number) => any,
        lengthBytesUTF8: (str: string) => number,
        unityInstance: any,
        HEAP8: Int8Array,
        HEAP32: Int32Array
    }
}

export class PuertsJSEngine {
    public readonly csharpObjectMap: CSharpObjectMap

    public readonly unityApi: PuertsJSEngine.UnityAPI

    public lastReturnCSResult: any = null;
    public lastExceptionInfo: string = null;
    public callV8Function: MockIntPtr;
    public callV8Constructor: MockIntPtr;
    public callV8Destructor: MockIntPtr;

    constructor(unityAPI: PuertsJSEngine.UnityAPI) {
        this.csharpObjectMap = new CSharpObjectMap();
        this.unityApi = unityAPI;
    }

    JSStringToCSString(returnStr: string, /** out int */length: number) {
        if (returnStr === null || returnStr === undefined) {
            return 0;
        }
        if (length) {
            setOutValue32(this, length, returnStr.length);
        }
        var bufferSize = this.unityApi.lengthBytesUTF8(returnStr) + 1;
        var buffer = this.unityApi._malloc(bufferSize);
        this.unityApi.stringToUTF8(returnStr, buffer, bufferSize);
        return buffer;
    }

    public generalDestructor: IntPtr
    makeV8FunctionCallbackFunction(functionPtr: IntPtr, data: number) {
        // 不能用箭头函数！返回的函数会放到具体的class上，this有含义。
        const engine = this;
        return function (...args: any[]) {
            let callbackInfoPtr = FunctionCallbackInfoPtrManager.GetMockPointer(args);
            engine.callV8FunctionCallback(
                functionPtr,
                // getIntPtrManager().GetPointerForJSValue(this),
                engine.csharpObjectMap.getCSIdentiferFromObject(this),
                callbackInfoPtr,
                args.length,
                data
            )
            return FunctionCallbackInfoPtrManager.GetReturnValueAndRecycle(callbackInfoPtr);
        }
    }

    callV8FunctionCallback(functionPtr: IntPtr, selfPtr: CSIdentifer, infoIntPtr: MockIntPtr, paramLen: number, data: number) {
        this.unityApi.unityInstance.dynCall_viiiii(this.callV8Function, functionPtr, infoIntPtr, selfPtr, paramLen, data);
    }

    callV8ConstructorCallback(functionPtr: IntPtr, infoIntPtr: MockIntPtr, paramLen: number, data: number) {
        return this.unityApi.unityInstance.dynCall_iiiii(this.callV8Constructor, functionPtr, infoIntPtr, paramLen, data);
    }

    callV8DestructorCallback(functionPtr: IntPtr, selfPtr: IntPtr, data: number) {
        this.unityApi.unityInstance.dynCall_viii(this.callV8Destructor, functionPtr, selfPtr, data);
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
    if (engine.csharpObjectMap.getCSIdentiferFromObject(value)) { return 32 }
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