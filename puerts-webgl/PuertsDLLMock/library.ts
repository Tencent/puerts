/**
 * 一次函数调用的info
 * 对应v8::FunctionCallbackInfo
 */
export class FunctionCallbackInfo {
    args: any[]

    returnValue: any

    constructor(args: any[]) {
        this.args = args;
        this.returnValue = void 0;
    }

    public static infos: FunctionCallbackInfo[];
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
    static GetMockPointer(callbackInfo: FunctionCallbackInfo): MockIntPtr {
        if (this.freeInfosIndex.length) {
            const index = this.freeInfosIndex.pop();
            this.infos[index] = callbackInfo;
            return index << 4;

        } else {
            this.infos.push(callbackInfo);
            return (this.infos.length - 1) << 4;
        }
    }
    static GetByMockPointer(intptr: MockIntPtr): FunctionCallbackInfo {
        return this.infos[intptr >> 4];
    }
    static ReleaseByMockIntPtr(intptr: MockIntPtr) {
        const index = intptr >> 4;
        this.infos[index] = void 0;
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
        jsFunctionOrObjectFactory.idmap.set(func, this.id);
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
    public static idmap = new WeakMap();
    public static jsFuncOrObjectKV: { [id: number]: JSFunction } = {};

    public static getOrCreateJSFunction(funcValue: (...args: any[]) => any) {
        const id = jsFunctionOrObjectFactory.idmap.get(funcValue)
        if (id) {
            return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        }
        return new JSFunction(funcValue);
    }
    public static getJSFunctionById(id: number): JSFunction {
        return jsFunctionOrObjectFactory.jsFuncOrObjectKV[id]
    }
    public static removeJSFunctionById(id: number) {
        const jsFunc = jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
        jsFunctionOrObjectFactory.idmap.delete(jsFunc._func);
        delete jsFunctionOrObjectFactory.jsFuncOrObjectKV[id];
    }

}

/**
 * CSharp对象记录表，记录所有CSharp对象并分配id
 * 和puerts.dll所做的一样
 */
export class CSharpObjectMap {
    public classes: { [classID: number]: any } = {};

    private nativeObjectKV: { [objectID: number]: WeakRef<any> } = {};
    private objectIDWeakMap: WeakMap<any, number> = new WeakMap();

    public namesToClassesID: { [name: string]: number } = {};
    public classIDWeakMap = new WeakMap();

    add(csObjectID: number, obj: any) {
        this.nativeObjectKV[csObjectID] = new WeakRef(obj);
        this.objectIDWeakMap.set(obj, csObjectID);
    }
    findOrAddObject(csObjectID: number, classID: number) {
        var ret;
        if (this.nativeObjectKV[csObjectID] && (ret = this.nativeObjectKV[csObjectID].deref())) {
            return ret;
        }
        ret = this.classes[classID].createFromCS(csObjectID);
        this.add(csObjectID, ret);
        return ret;
    }
    getCSObjectIDFromObject(obj: any) {
        return this.objectIDWeakMap.get(obj);
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
        if (!(heldValue in destructors)) {
            throw new Error("cannot find destructor for" + heldValue);
        }
        delete destructors[heldValue]
        console.log('onFinalize', heldValue)
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
        _malloc: (size: number) => any,
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

    JSStringToCSString(returnStr: string) {
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
            let callbackInfo = new FunctionCallbackInfo(args);
            let callbackInfoPtr = FunctionCallbackInfoPtrManager.GetMockPointer(callbackInfo);
            engine.callV8FunctionCallback(
                functionPtr,
                // getIntPtrManager().GetPointerForJSValue(this),
                engine.csharpObjectMap.getCSObjectIDFromObject(this),
                callbackInfoPtr,
                args.length,
                data
            )
            FunctionCallbackInfoPtrManager.ReleaseByMockIntPtr(callbackInfoPtr);

            return callbackInfo.returnValue;
        }
    }

    callV8FunctionCallback(functionPtr: IntPtr, selfPtr: CSObjectID, infoIntPtr: MockIntPtr, paramLen: number, data: number) {
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
    if (typeof value == 'undefined') { return 1 }
    if (typeof value == 'number') { return 4 }
    if (typeof value == 'string') { return 8 }
    if (typeof value == 'boolean') { return 16 }
    if (typeof value == 'function') { return 256 }
    if (value instanceof Date) { return 512 }
    if (value instanceof Array) { return 128 }
    if (engine.csharpObjectMap.getCSObjectIDFromObject(value)) { return 32 }
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