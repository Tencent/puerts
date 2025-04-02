import { PuertsJSEngine } from "./library";
import *  as Buffer from "./buffer"

let loader: any =  null;
let loaderResolve: Function = null;
declare const wx: any;
declare const CS: any;
declare const wxRequire: any;
const executeModuleCache: { [filename: string]: any } = {};
declare const PUERTS_JS_RESOURCES: any;

/**
 * Sparse Array implementation with efficient add/remove operations
 * - Maintains contiguous storage
 * - Reuses empty slots from deletions
 * - O(1) add/remove in most cases
 */
class SparseArray<T> {
    private _data: (T | undefined)[];
    private _freeIndices: number[];
    private _length: number;

    constructor(capacity: number = 0) {
        this._data = new Array(capacity);
        this._freeIndices = [];
        this._length = 0;
    }

    /**
     * Add an element to the array
     * @returns The index where the element was inserted
     */
    add(element: T): number {
        if (this._freeIndices.length > 0) {
            const index = this._freeIndices.pop()!;
            this._data[index] = element;
            this._length++;
            return index;
        }
        
        const index = this._data.length;
        this._data.push(element);
        this._length++;
        return index;
    }

    /**
     * Remove an element by index
     * @returns true if removal was successful
     */
    remove(index: number): boolean {
        if (index < 0 || index >= this._data.length || this._data[index] === undefined) {
            return false;
        }

        this._data[index] = undefined;
        this._freeIndices.push(index);
        this._length--;
        
        // Compact the array if last element is removed
        if (index === this._data.length - 1) {
            this._compact();
        }
        
        return true;
    }

    /**
     * Get element by index
     */
    get(index: number): T | undefined {
        return this._data[index];
    }

    /**
     * Current number of active elements
     */
    get length(): number {
        return this._length;
    }

    /**
     * Total capacity (including empty slots)
     */
    get capacity(): number {
        return this._data.length;
    }

    /**
     * Compact the array by removing trailing undefined elements
     */
    private _compact(): void {
        let lastIndex = this._data.length - 1;
        while (lastIndex >= 0 && this._data[lastIndex] === undefined) {
            this._data.pop();
            
            // Remove any free indices in the compacted area
            const compactedIndex = this._freeIndices.indexOf(lastIndex);
            if (compactedIndex !== -1) {
                this._freeIndices.splice(compactedIndex, 1);
            }
            
            lastIndex--;
        }
    }
}

function ExecuteModule(fileName: string) {
    if (['puerts/log.mjs', 'puerts/timer.mjs'].indexOf(fileName) != -1) {
        return {};
    }
    if (!loader) {
        loader = (globalThis as any).jsEnv.loader;
        loaderResolve = loader.Resolve ? (function(fileName: string, to: string = "") {
            const resolvedName = loader.Resolve(fileName, to);
            if (!resolvedName) {
                throw new Error('module not found: ' + fileName);
            }
            return resolvedName;
        }) : null;
    }
    if (loaderResolve) {
        fileName = loaderResolve(fileName, "");
    }
    if (typeof wx != 'undefined') {
        const result = wxRequire('puerts_minigame_js_resources/' + (fileName.endsWith('.js') ? fileName : fileName + ".js"));
        return result

    } else {
        function normalize(name: string, to: string) {
            if (typeof CS != void 0) {
                if (CS.Puerts.PathHelper.IsRelative(to)) {
                    const ret = CS.Puerts.PathHelper.normalize(CS.Puerts.PathHelper.Dirname(name) + "/" + to);
                    return ret;
                }
            }
            return to;
        }
        function mockRequire(specifier: string) {
            const result: any = { exports: {} };
            const foundCacheSpecifier = tryFindAndGetFindedSpecifier(specifier, executeModuleCache);
            if (foundCacheSpecifier) {
                result.exports = executeModuleCache[foundCacheSpecifier];

            } else {
                const foundSpecifier = tryFindAndGetFindedSpecifier(specifier, PUERTS_JS_RESOURCES);
                if (!foundSpecifier) {
                    throw new Error('module not found: ' + specifier);
                }
                specifier = foundSpecifier;

                executeModuleCache[specifier] = -1;
                try {
                    PUERTS_JS_RESOURCES[specifier](result.exports, function mRequire(specifierTo: string) {
                        return mockRequire(loaderResolve ? loaderResolve(specifierTo, specifier) : normalize(specifier, specifierTo));
                    }, result);
                } catch (e) {
                    delete executeModuleCache[specifier];
                    throw e
                }
                executeModuleCache[specifier] = result.exports;
            }

            return result.exports;
            function tryFindAndGetFindedSpecifier(specifier: string, obj: any) {
                let tryFindName = [specifier];
                if (specifier.indexOf('.') == -1)
                    tryFindName = tryFindName.concat([specifier + '.js', specifier + '.ts', specifier + '.mjs', specifier + '.mts']);

                let finded: number | false = tryFindName.reduce((ret, name, index) => {
                    if (ret !== false) return ret;
                    if (name in obj) {
                        if (obj[name] == -1) throw new Error(`circular dependency is detected when requiring "${name}"`);
                        return index;
                    }
                    return false;
                }, false)
                if (finded === false) {
                    return null;
                }
                else {
                    return tryFindName[finded];
                }
            }
        }

        const requireRet = mockRequire(fileName)
        return requireRet
    }
}
(globalThis as any).__puertsExecuteModule = ExecuteModule;

type pesapi_env = number;
type pesapi_value = number;
type pesapi_value_ptr = number;
type pesapi_scope = number;
type pesapi_callback = number;
type pesapi_function_finalize = number;
type pesapi_callback_info = number;
type pesapi_env_ref = number;
type pesapi_value_ref = number;
type pesapi_class_not_found_callback = number;

enum JSTag {
    /* all tags with a reference count are negative */
    JS_TAG_FIRST         = -9, /* first negative tag */
    JS_TAG_STRING        = -9,
    JS_TAG_BUFFER        = -8,
    JS_TAG_EXCEPTION     = -7,
    JS_TAG_NATIVE_OBJECT = -4,
    JS_TAG_ARRAY         = -3,
    JS_TAG_FUNCTION      = -2,
    JS_TAG_OBJECT        = -1,
                         
    JS_TAG_INT           = 0,
    JS_TAG_BOOL          = 1,
    JS_TAG_NULL          = 2,
    JS_TAG_UNDEFINED     = 3,
    JS_TAG_UNINITIALIZED = 4,
    JS_TAG_FLOAT64       = 5,
    JS_TAG_INT64         = 6,
    JS_TAG_UINT64        = 7,
}

class Scope {
    private static current: Scope = undefined;

    public static getCurrent(): Scope {
        return Scope.current;
    }

    public static enter(): Scope {
        return new Scope();
    }

    public static exit(wasmApi: PuertsJSEngine.UnityAPI): void {
        Scope.current.close(wasmApi);
    }

    constructor() {
        this.prevScope = Scope.current;
        Scope.current = this;
    }

    close(wasmApi: PuertsJSEngine.UnityAPI): void {
        if (this.lastExceptionBuffer) {
            wasmApi._free(this.lastExceptionBuffer);
            this.lastExceptionBuffer = undefined;
        }
        Scope.current = this.prevScope;
    }

    addToScope(obj: object): number {
        this.objectsInScope.push(obj);
        return this.objectsInScope.length - 1;
    }

    getFromScope(index: number): object {
        return this.objectsInScope[index];
    }

    toJs(wasmApi: PuertsJSEngine.UnityAPI, objMapper: ObjectMapper, pvalue: pesapi_value) : any {
        if (pvalue == 0) return undefined;

        const heap = wasmApi.HEAPU8;
        const valType = Buffer.readInt32(heap, pvalue + 8);
        //console.log(`valType: ${valType}`);
        if (valType <= JSTag.JS_TAG_OBJECT && valType >= JSTag.JS_TAG_ARRAY) {
            const objIdx = Buffer.readInt32(heap, pvalue);
            return this.objectsInScope[objIdx];
        }
        if (valType == JSTag.JS_TAG_NATIVE_OBJECT) {
            const objId = Buffer.readInt32(heap, pvalue);
            const typeId = Buffer.readInt32(heap, pvalue + 4);
            return objMapper.pushNativeObject(objId, typeId, true);
        }
        switch(valType) {
            case JSTag.JS_TAG_BOOL:
                return Buffer.readInt32(heap, pvalue) != 0;
            case JSTag.JS_TAG_INT:
                return Buffer.readInt32(heap, pvalue);
            case JSTag.JS_TAG_NULL:
                return null;
            case JSTag.JS_TAG_UNDEFINED:
                return undefined;
            case JSTag.JS_TAG_FLOAT64:
                return Buffer.readDouble(heap, pvalue);
            case JSTag.JS_TAG_INT64:
                return Buffer.readInt64(heap, pvalue);
            case JSTag.JS_TAG_UINT64:
                return Buffer.readUInt64(heap, pvalue);
            case JSTag.JS_TAG_STRING:
                const strStart = Buffer.readInt32(heap, pvalue);
                const strLen = Buffer.readInt32(heap, pvalue + 4);
                return wasmApi.UTF8ToString(strStart as any, strLen);
            case JSTag.JS_TAG_BUFFER:
                const buffStart = Buffer.readInt32(heap, pvalue);
                const buffLen = Buffer.readInt32(heap, pvalue + 4);
                return wasmApi.HEAP8.buffer.slice(buffStart, buffStart + buffLen);
        }
        throw new Error(`unsupported type: ${valType}`);
    }

    getExceptionAsNativeString(wasmApi: PuertsJSEngine.UnityAPI, with_stack: boolean): CSString {
        if (this.lastException) {
            const msg = this.lastException.message;
            const stack = this.lastException.stack;
            const result = with_stack ? `${msg}\n${stack}` : msg;
            const byteCount = wasmApi.lengthBytesUTF8(result);
            const lastExceptionBuffer = wasmApi._malloc(byteCount + 1);
            if (this.lastExceptionBuffer) {
                wasmApi._free(this.lastExceptionBuffer);
            }
            this.lastExceptionBuffer = lastExceptionBuffer;
            return wasmApi.stringToUTF8(result, lastExceptionBuffer, byteCount + 1);
        }
    }

    private prevScope: Scope = undefined;

    private objectsInScope: object[] = [null]; // 加null为了index从1开始，因为在原生种存放在指针字段防止误判为nullptr

    public lastException: Error = null;

    public lastExceptionBuffer: number = undefined;
}

class ObjectPool {
    private storage = new Map<number, [WeakRef<object>, number, boolean]>();
    private gcIterator: IterableIterator<number>;
    private gcTimeout: number | null = null;
    private isGcRunning = false;

    // GC configuration defaults
    private gcBatchSize = 100;
    private gcIntervalMs = 50;

    private cleanupCallback: (objId: number, typeId:number, callFinalize: boolean) => void = undefined;

    constructor(cleanupCallback: (objId: number, typeId:number, callFinalize: boolean) => void) {
        this.cleanupCallback = cleanupCallback;
    }

    add(objId: number, obj: object, typeId:number, callFinalize: boolean): this {
        const ref = new WeakRef(obj);
        this.storage.set(objId, [ref, typeId, callFinalize]);
        (obj as any).$ObjId__ = objId;
        (obj as any).$TypeId__ = typeId;
        return this;
    }

    get(objId: number): object | undefined {
        const entry = this.storage.get(objId);
        if (!entry) return;

        const [ref, typeId, callFinalize] = entry;
        const obj = ref.deref();
        
        if (!obj) {
            this.storage.delete(objId);
            this.cleanupCallback(objId, typeId, callFinalize);
        }
        
        return obj;
    }

    static GetNativeInfoOfObject(obj: object): [number, number] | undefined {
        const objId = (obj as any).$ObjId__;
        if (typeof objId === 'number') {
            return [objId, (obj as any).$ObjId__]
        }
    }

    has(objId: number): boolean {
        return this.storage.has(objId);
    }

    fullGc(): void {
        for (const [objId] of this.storage) {
            this.get(objId);
        }
        // Only reset iterator if GC is running to maintain iteration state
        if (this.isGcRunning) {
            this.gcIterator = this.storage.keys();
        }
    }

    // Start incremental garbage collection with configurable parameters
    startIncrementalGc(batchSize: number = 100, intervalMs: number = 50): void {
        if (this.isGcRunning) return;
        
        this.isGcRunning = true;
        this.gcBatchSize = Math.max(1, batchSize);
        this.gcIntervalMs = Math.max(0, intervalMs);
        this.gcIterator = this.storage.keys();
        this.processGcBatch();
    }

    // Stop incremental garbage collection
    stopIncrementalGc(): void {
        this.isGcRunning = false;
        if (this.gcTimeout) {
            clearTimeout(this.gcTimeout);
            this.gcTimeout = null;
        }
    }

    private processGcBatch(): void {
        if (!this.isGcRunning) return;

        let processed = 0;
        let next = this.gcIterator.next();
        
        while (!next.done && processed < this.gcBatchSize) {
            this.get(next.value);
            processed++;
            next = this.gcIterator.next();
        }

        if (next.done) {
            // Restart iterator for next round
            this.gcIterator = this.storage.keys();
        }
        
        this.gcTimeout = setTimeout(
            () => this.processGcBatch(), 
            this.gcIntervalMs
        ) as unknown as number;
    }
}

class ClassRegister {
    private static instance: ClassRegister;

    private constructor() {}

    private classNotFound: (typeId: number) => bool = undefined

    private typeIdToClass: Map<number, Function> = new Map();

    public static getInstance(): ClassRegister {
        if (!ClassRegister.instance) {
            ClassRegister.instance = new ClassRegister();
        }
        return ClassRegister.instance;
    }

    public loadClassById(typeId: number): Function {
        const cls = this.typeIdToClass.get(typeId);
        if (cls) {
            return cls;
        } else {
            if (this.classNotFound && this.classNotFound(typeId)) {
                return this.typeIdToClass.get(typeId);
            }
        }
    }

    public registerClass(typeId: number, cls: Function, clsData: number): void {
        // Store class data in non-enumerable property
        Object.defineProperty(cls, '$ClassData', {
            value: clsData,
            writable: false,
            enumerable: false,
            configurable: false
        });

        Object.defineProperty(cls, '$TypeId', {
            value: typeId,
            writable: false,
            enumerable: false,
            configurable: false
        });
        
        this.typeIdToClass.set(typeId, cls);
    }

    public getClassDataById(typeId: number, forceLoad: boolean): number | undefined {
        const cls = forceLoad ? this.loadClassById(typeId) : this.findClassById(typeId);
        return cls ? (cls as any).$ClassData : 0;
    }

    public findClassById(typeId: number): Function | undefined {
        return this.typeIdToClass.get(typeId);
    }

    public setClassNotFoundCallback(callback: (typeId: number) => boolean) {
        this.classNotFound = callback;
    }
}

class ObjectMapper {
    private objectPool: ObjectPool;

    constructor(cleanupCallback: (objId: number, typeId:number, callFinalize: boolean) => void) {
        this.objectPool = new ObjectPool(cleanupCallback);
    }

    public pushNativeObject(objId: number, typeId:number, callFinalize: boolean): object {
        let jsObj = this.objectPool.get(objId);
        if (!jsObj) {
            const cls = ClassRegister.getInstance().loadClassById(typeId);
            if (cls) {
                jsObj = Object.create(cls.prototype);
                this.objectPool.add(objId, jsObj, typeId, callFinalize);
            }
        } 
        return jsObj;
    }

    public findNativeObject(objId: number): object | undefined {
        return this.objectPool.get(objId);
    }

    public bindNativeObject(objId: number, jsObj: object, typeId:number, callFinalize: boolean): void {
        this.objectPool.add(objId, jsObj, typeId, callFinalize);
    }
}


let webglFFI:number = undefined;
let objMapper: ObjectMapper = undefined;

// typedef struct String {
//     const char *ptr;
//     uint32_t len;
// } String;
// 
// typedef struct Buffer {
//     void *ptr;
//     uint32_t len;
// } Buffer;
// 
// typedef struct NativeObject {
//     void *objId;
//     const void *typeId;
// } NativeObject;
// 
// typedef union JSValueUnion {
//     int32_t int32;
//     double float64;
//     int64_t int64;
//     uint64_t uint64;
//     void *ptr;
//     String str;
//     Buffer buf;
//     NativeObject nto;
// } JSValueUnion;
// 
// typedef struct JSValue {
//     JSValueUnion u;
//     int32_t tag;
//     int padding;
// } JSValue;
//
// struct CallbackInfo {
//     void* thisPtr;
//     int argc;
//     void* data;
//     int padding;
//     JSValue res;
//     JSValue argv[0];
// };
// sizeof(JSValue) == 16

const callbackInfosCache : number[] = [];

function getNativeCallbackInfo(wasmApi: PuertsJSEngine.UnityAPI, argc: number): number {
    if (!callbackInfosCache[argc])
    {
        // 4 + 4 + 4 + 4 + 16 + (argc * 16)
        const size = 32 + (argc * 16);
        callbackInfosCache[argc] = wasmApi._malloc(size);
        Buffer.writeInt32(wasmApi.HEAPU8, argc, callbackInfosCache[argc] + 4);
    }
    Buffer.writeInt32(wasmApi.HEAPU8, JSTag.JS_TAG_UNDEFINED, callbackInfosCache[argc] + 24); // set res to undefined
    return callbackInfosCache[argc];
}

//只需要用到一个buffer的场景下用预分配的，如果超过一个buffer，就malloc
let buffer:number = undefined;
let buffer_size: number = 0;
let usingBuffers: number[] = [];
function getBuffer(wasmApi: PuertsJSEngine.UnityAPI, size: number): number {
    let ret = buffer;
    if (usingBuffers.length > 0) {
        ret = wasmApi._malloc(buffer_size);
    } else {
        if (buffer_size < size) {
            buffer_size = size;
            if (buffer) {
                wasmApi._free(buffer);
            }
            buffer = wasmApi._malloc(buffer_size);
        }
        ret = buffer;
    }
    usingBuffers.push(ret)
    return ret;
}
function clearUsingBuffers(wasmApi: PuertsJSEngine.UnityAPI) {
    if (usingBuffers.length == 0) return;
    if (usingBuffers.length == 1) {
        usingBuffers.pop();
        return;
    }
    for (let i = 1; i < usingBuffers.length; i++) {
        wasmApi._free(usingBuffers[i]);
    }
    usingBuffers = [];
}

function jsValueToPapiValue(wasmApi: PuertsJSEngine.UnityAPI, arg: any, value: pesapi_value) {
    const heap = wasmApi.HEAPU8;

    const dataPtr = value;
    const tagPtr = dataPtr + 8;
    if (arg === undefined) {
        Buffer.writeInt32(heap, JSTag.JS_TAG_UNDEFINED, tagPtr);
    } else if (arg === null) {
        Buffer.writeInt32(heap, JSTag.JS_TAG_NULL, tagPtr);
    } else if (typeof arg === 'bigint') {
        Buffer.writeInt64(heap, arg, dataPtr);
        Buffer.writeInt32(heap, JSTag.JS_TAG_INT64, tagPtr);
    } else if (typeof arg === 'number') {
        if (Number.isInteger(arg)) {
            if (arg >= -2147483648 && arg <= 2147483647) {
                Buffer.writeInt32(heap, arg, dataPtr);
                Buffer.writeInt32(heap, JSTag.JS_TAG_INT, tagPtr);
            } else {
                Buffer.writeInt64(heap, arg, dataPtr);
                Buffer.writeInt32(heap, JSTag.JS_TAG_INT64, tagPtr);
            }
        } else {
            Buffer.writeDouble(heap, arg, dataPtr);
            Buffer.writeInt32(heap, JSTag.JS_TAG_FLOAT64, tagPtr);
        }
    } else if (typeof arg === 'string') {
        const len = wasmApi.lengthBytesUTF8(arg);
        const ptr = getBuffer(wasmApi, len + 1);
        wasmApi.stringToUTF8(arg, ptr, buffer_size);
        Buffer.writeInt32(heap, ptr, dataPtr);
        Buffer.writeInt32(heap, len, dataPtr + 4);
        Buffer.writeInt32(heap, JSTag.JS_TAG_STRING, tagPtr);
    } else if (typeof arg === 'boolean') {
        Buffer.writeInt32(heap, arg ? 1 : 0, dataPtr);
        Buffer.writeInt32(heap, JSTag.JS_TAG_BOOL, tagPtr);
    } else if (typeof arg === 'function') {
        Buffer.writeInt32(heap, Scope.getCurrent().addToScope(arg), dataPtr);
        Buffer.writeInt32(heap, JSTag.JS_TAG_FUNCTION, tagPtr);
    } else if (arg instanceof Array) {
        Buffer.writeInt32(heap, Scope.getCurrent().addToScope(arg), dataPtr);
        Buffer.writeInt32(heap, JSTag.JS_TAG_ARRAY, tagPtr);
    } else if (arg instanceof ArrayBuffer || arg instanceof Uint8Array) {
        const len = arg.byteLength;
        const ptr = getBuffer(wasmApi, len);
        Buffer.writeInt32(heap, ptr, dataPtr);
        Buffer.writeInt32(heap, len, dataPtr + 4);
        Buffer.writeInt32(heap, JSTag.JS_TAG_BUFFER, tagPtr);
    } else if (typeof arg === 'object') {
        const ntoInfo = ObjectPool.GetNativeInfoOfObject(arg);
        if (ntoInfo) {
            const [objId, typeId] = ntoInfo;
            Buffer.writeInt32(heap, objId, dataPtr);
            Buffer.writeInt32(heap, typeId, dataPtr + 4);
            Buffer.writeInt32(heap, JSTag.JS_TAG_NATIVE_OBJECT, tagPtr);
        } else {
            Buffer.writeInt32(heap, Scope.getCurrent().addToScope(arg), dataPtr);
            Buffer.writeInt32(heap, JSTag.JS_TAG_OBJECT, tagPtr);
        }
    } else {
        throw new Error(`Unexpected argument type: ${typeof arg}`);
    }
}

function jsArgsToCallbackInfo(wasmApi: PuertsJSEngine.UnityAPI, args: any[]): number {
    const argc = args.length;
    clearUsingBuffers(wasmApi);
    const callbackInfo = getNativeCallbackInfo(wasmApi, argc);

    for(let i = 0; i < argc; ++i) {
        const arg = args[i];
        jsValueToPapiValue(wasmApi, arg, callbackInfo + 32 + (i * 16));
    }

    return callbackInfo;
}

function genJsCallback(wasmApi: PuertsJSEngine.UnityAPI, callback: Function, data: number, papi:number, isStatic: boolean) {
    return function(...args: any[]) {
        if (new.target) {
            throw new Error('"not a constructor');
        }
        const callbackInfo = jsArgsToCallbackInfo(wasmApi, args);
        const heap = wasmApi.HEAPU8;
        Buffer.writeInt32(heap, data, callbackInfo + 8); // data
        let objId = 0;
        if (!isStatic) {
            [objId] = ObjectPool.GetNativeInfoOfObject(this);
        } 
        Buffer.writeInt32(heap, objId, callbackInfo); // thisPtr
        callback(papi, callbackInfo);
        return Scope.getCurrent().toJs(wasmApi, objMapper, callbackInfo + 16);
    }
}

// 需要在Unity里调用PlayerSettings.WebGL.emscriptenArgs = " -s ALLOW_TABLE_GROWTH=1";
export function GetWebGLFFIApi(engine: PuertsJSEngine) {
    if (webglFFI) return webglFFI;

    objMapper = new ObjectMapper((objId: number, typeId:number, callFinalize: boolean) => {
        // todo: callFinalize
        throw new Error("object finalize not implemented yet!");
    });

    // --------------- 值创建系列 ---------------
    function pesapi_create_null(env: pesapi_env): pesapi_value {
        throw new Error("pesapi_create_null not implemented yet!");
    }

    function pesapi_create_undefined(env: pesapi_env): pesapi_value {
        throw new Error("pesapi_create_undefined not implemented yet!");
    }

    function pesapi_create_boolean(env: pesapi_env, value: boolean): pesapi_value {
        throw new Error("pesapi_create_boolean not implemented yet!");
    }

    function pesapi_create_int32(env: pesapi_env, value: number): pesapi_value {
        throw new Error("pesapi_create_int32 not implemented yet!");
    }

    // 类似地处理其他基础类型创建函数
    function pesapi_create_uint32(env: pesapi_env, value: number): pesapi_value { 
        throw new Error("pesapi_create_uint32 not implemented yet!");
    }
    function pesapi_create_int64(env: pesapi_env, value: bigint): pesapi_value { 
        throw new Error("pesapi_create_int64 not implemented yet!");
    }
    function pesapi_create_uint64(env: pesapi_env, value: bigint): pesapi_value { 
        throw new Error("pesapi_create_uint64 not implemented yet!");
    }
    function pesapi_create_double(env: pesapi_env, value: number): pesapi_value { 
        throw new Error("pesapi_create_double not implemented yet!");
    }

    function pesapi_create_string_utf8(env: pesapi_env, str: number, length: number): pesapi_value {
        throw new Error("pesapi_create_string_utf8 not implemented yet!");
    }

    function pesapi_create_binary(env: pesapi_env, bin: number, length: number): pesapi_value {
        throw new Error("pesapi_create_binary not implemented yet!");
    }

    function pesapi_create_array(env: pesapi_env): pesapi_value { 
        return Scope.getCurrent().addToScope([]);
    }
    function pesapi_create_object(env: pesapi_env): pesapi_value { 
        return Scope.getCurrent().addToScope(Object.create(null));
    }

    function pesapi_create_function(
        env: pesapi_env, 
        native_impl: pesapi_callback, 
        data: number, 
        finalize: pesapi_function_finalize // TODO: gc时调用finalize
    ): pesapi_value {
        const nativeCallback = engine.unityApi.getWasmTableEntry(native_impl);
        const jsCallback = genJsCallback(engine.unityApi, nativeCallback, data, webglFFI, true);
        return Scope.getCurrent().addToScope(jsCallback);
    }

    function pesapi_create_class(env: pesapi_env, typeId: number): pesapi_value {
        const cls = ClassRegister.getInstance().loadClassById(typeId);
        if (typeof cls === 'function') {
            console.log(`create class: ${cls.name}`);
            return Scope.getCurrent().addToScope(cls);
        }
        throw new Error("can't load class by type id: " + typeId);
    }

    // --------------- 值获取系列 ---------------
    function pesapi_get_value_bool(env: pesapi_env, pvalue: pesapi_value): boolean {
        throw new Error("pesapi_get_value_bool not implemented yet!");
    }

    function pesapi_get_value_int32(env: pesapi_env, pvalue: pesapi_value): number {
        throw new Error("pesapi_get_value_int32 not implemented yet!");
    }

    // 类似处理其他类型获取
    function pesapi_get_value_uint32(env: pesapi_env, pvalue: pesapi_value): number { 
        throw new Error("pesapi_get_value_uint32 not implemented yet!");
    }
    function pesapi_get_value_int64(env: pesapi_env, pvalue: pesapi_value): bigint { 
        throw new Error("pesapi_get_value_int64 not implemented yet!");
    }
    function pesapi_get_value_uint64(env: pesapi_env, pvalue: pesapi_value): bigint { 
        throw new Error("pesapi_get_value_uint64 not implemented yet!");
    }
    function pesapi_get_value_double(env: pesapi_env, pvalue: pesapi_value): number { 
        throw new Error("pesapi_get_value_double not implemented yet!");
    }

    function pesapi_get_value_string_utf8(
        env: pesapi_env, 
        pvalue: pesapi_value, 
        buf: number, 
        bufsize: number
    ): number {
        throw new Error("pesapi_get_value_string_utf8 not implemented yet!");
    }

    function pesapi_get_value_binary(
        env: pesapi_env, 
        pvalue: pesapi_value, 
        bufsize: number
    ): number {
        throw new Error("pesapi_get_value_binary not implemented yet!");
    }

    function pesapi_get_array_length(env: pesapi_env, 
        pvalue: pesapi_value,
    ): number {
        const array = Scope.getCurrent().getFromScope(pvalue);
        if (!Array.isArray(array)) {
            throw new Error("pesapi_get_array_length: value is not an array");
        }
        return array.length;
    }

    // --------------- 类型检查系列 ---------------
    function pesapi_is_null(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_null not implemented yet!");
    }
    function pesapi_is_undefined(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_undefined not implemented yet!");
    }
    function pesapi_is_boolean(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_boolean not implemented yet!");
    }
    function pesapi_is_int32(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_int32 not implemented yet!");
    }
    function pesapi_is_uint32(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_uint32 not implemented yet!");
    }
    function pesapi_is_int64(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_int64 not implemented yet!");
    }
    function pesapi_is_uint64(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_uint64 not implemented yet!");
    }
    function pesapi_is_double(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_double not implemented yet!");
    }
    function pesapi_is_string(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_string not implemented yet!");
    }
    function pesapi_is_object(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_object not implemented yet!");
    }
    function pesapi_is_function(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_function not implemented yet!");
    }
    function pesapi_is_binary(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_binary not implemented yet!");
    }
    function pesapi_is_array(env: pesapi_env, pvalue: pesapi_value): boolean { 
        throw new Error("pesapi_is_array not implemented yet!");
    }

    // --------------- 对象操作系列 ---------------
    function pesapi_native_object_to_value(
        env: pesapi_env, 
        typeId: number, 
        object_ptr: number, 
        call_finalize: boolean
    ): pesapi_value {
        const jsObj = objMapper.pushNativeObject(object_ptr, typeId, call_finalize);

        // TODO: just for test
        //const cls = ClassRegister.getInstance().findClassById(typeId);
        //if (cls.name == "JsEnv") {
        //    console.log(`call FileExists(aabb.txt): ${(jsObj as any).loader.FileExists("aabb.txt")}`);
        //    console.log(`call FileExists(puerts/esm_bootstrap.cjs): ${(jsObj as any).loader.FileExists("puerts/esm_bootstrap.cjs")}`);
        //}
         
        return object_ptr;
    }

    function pesapi_get_native_object_ptr(env: pesapi_env, pvalue: pesapi_value): number {
        throw new Error("pesapi_get_native_object_ptr not implemented yet!");
    }

    function pesapi_get_native_object_typeid(env: pesapi_env, pvalue: pesapi_value): number {
        throw new Error("pesapi_get_native_object_typeid not implemented yet!");
    }

    function pesapi_is_instance_of(env: pesapi_env, type_id: number, pvalue: pesapi_value): boolean {
        throw new Error("pesapi_is_instance_of not implemented yet!");
    }

    // --------------- 装箱/拆箱 ---------------
    function pesapi_boxing(env: pesapi_env, pvalue: pesapi_value): pesapi_value { 
        throw new Error("pesapi_boxing not implemented yet!");
    }
    function pesapi_unboxing(env: pesapi_env, p_boxed_value: pesapi_value): pesapi_value { 
        throw new Error("pesapi_unboxing not implemented yet!");
    }
    function pesapi_update_boxed_value(env: pesapi_env, p_boxed_value: pesapi_value, pvalue: pesapi_value): void {
        throw new Error("pesapi_update_boxed_value not implemented yet!");
    }
    function pesapi_is_boxed_value(env: pesapi_env, value: pesapi_value): boolean { 
        throw new Error("pesapi_is_boxed_value not implemented yet!");
    }

    // --------------- 函数调用相关 ---------------
    function pesapi_get_args_len(pinfo: pesapi_callback_info): number { 
        throw new Error("pesapi_get_args_len not implemented yet!");
    }
    function pesapi_get_arg(pinfo: pesapi_callback_info, index: number): pesapi_value { 
        throw new Error("pesapi_get_arg not implemented yet!");
    }
    function pesapi_get_env(pinfo: pesapi_callback_info): pesapi_env { 
        throw new Error("pesapi_get_env not implemented yet!");
    }
    function pesapi_get_native_holder_ptr(pinfo: pesapi_callback_info): pesapi_value { 
        throw new Error("pesapi_get_native_holder_ptr not implemented yet!");
    }
    function pesapi_get_holder(pinfo: pesapi_callback_info): pesapi_value { 
        throw new Error("pesapi_get_holder not implemented yet!");
    }
    function pesapi_get_userdata(pinfo: pesapi_callback_info): number { 
        throw new Error("pesapi_get_userdata not implemented yet!");
    }
    function pesapi_add_return(pinfo: pesapi_callback_info, value: pesapi_value): void {
        throw new Error("pesapi_add_return not implemented yet!");
    }
    function pesapi_throw_by_string(pinfo: pesapi_callback_info, pmsg: CSString): void {
        const msg = engine.unityApi.UTF8ToString(pmsg);
        Scope.getCurrent().lastException = new Error(msg);
    }

    // --------------- 环境引用 ---------------
    function pesapi_create_env_ref(env: pesapi_env): pesapi_env_ref { 
        throw new Error("pesapi_create_env_ref not implemented yet!");
    }
    function pesapi_env_ref_is_valid(penv_ref: pesapi_env_ref): boolean { 
        throw new Error("pesapi_env_ref_is_valid not implemented yet!");
    }
    function pesapi_get_env_from_ref(penv_ref: pesapi_env_ref): pesapi_env { 
        throw new Error("pesapi_get_env_from_ref not implemented yet!");
    }
    function pesapi_duplicate_env_ref(penv_ref: pesapi_env_ref): pesapi_env_ref { 
        throw new Error("pesapi_duplicate_env_ref not implemented yet!");
    }
    function pesapi_release_env_ref(penv_ref: pesapi_env_ref): void {
        throw new Error("pesapi_release_env_ref not implemented yet!");
    }

    // --------------- 作用域管理 ---------------
    function pesapi_open_scope(penv_ref: pesapi_env_ref): pesapi_scope { 
        Scope.enter();
        return null;
    }
    function pesapi_open_scope_placement(penv_ref: pesapi_env_ref, memory: number): pesapi_scope { 
        Scope.enter();
        return null;
    }
    function pesapi_has_caught(pscope: pesapi_scope): boolean { 
        return Scope.getCurrent().lastException != null;
    }
    function pesapi_get_exception_as_string(pscope: pesapi_scope, with_stack: boolean): CSString { 
        return Scope.getCurrent().getExceptionAsNativeString(engine.unityApi, with_stack);
    }
    function pesapi_close_scope(pscope: pesapi_scope): void {
        Scope.exit(engine.unityApi);
    }
    function pesapi_close_scope_placement(pscope: pesapi_scope): void {
        Scope.exit(engine.unityApi);
    }

    const referencedValues = new SparseArray<any>();

    // --------------- 值引用 ---------------
    function pesapi_create_value_ref(env: pesapi_env, pvalue: pesapi_value, internal_field_count: number): pesapi_value_ref { 
        const value = Scope.getCurrent().toJs(engine.unityApi, objMapper, pvalue);
        return referencedValues.add(value);
    }
    function pesapi_duplicate_value_ref(pvalue_ref: pesapi_value_ref): pesapi_value_ref { 
        throw new Error("pesapi_duplicate_value_ref not implemented yet!");
    }
    function pesapi_release_value_ref(pvalue_ref: pesapi_value_ref): void {
        referencedValues.remove(pvalue_ref);
    }
    function pesapi_get_value_from_ref(env: pesapi_env, pvalue_ref: pesapi_value_ref, pvalue: pesapi_value): void { 
        const value = referencedValues.get(pvalue_ref);
        jsValueToPapiValue(engine.unityApi, value, pvalue);
    }
    function pesapi_set_ref_weak(env: pesapi_env, pvalue_ref: pesapi_value_ref): void {
        throw new Error("pesapi_set_ref_weak not implemented yet!");
    }
    function pesapi_set_owner(env: pesapi_env, pvalue: pesapi_value, powner: pesapi_value): boolean { 
        throw new Error("pesapi_set_owner not implemented yet!");
    }
    function pesapi_get_ref_associated_env(value_ref: pesapi_value_ref): pesapi_env_ref { 
        throw new Error("pesapi_get_ref_associated_env not implemented yet!");
    }
    function pesapi_get_ref_internal_fields(pvalue_ref: pesapi_value_ref, pinternal_field_count: number): number { 
        throw new Error("pesapi_get_ref_internal_fields not implemented yet!");
    }

    // --------------- 属性操作 ---------------
    function pesapi_get_property(env: pesapi_env, pobject: pesapi_value, pkey: CSString, pvalue: pesapi_value): void { 
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_get_property: target is not an object");
        }
        const key = engine.unityApi.UTF8ToString(pkey);
        const value = obj[key];
        jsValueToPapiValue(engine.unityApi, value, pvalue);
    }
    function pesapi_set_property(env: pesapi_env, pobject: pesapi_value, pkey: CSString, pvalue: pesapi_value): void {
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_set_property: target is not an object");
        }
        const key = engine.unityApi.UTF8ToString(pkey);
        const value = Scope.getCurrent().toJs(engine.unityApi, objMapper, pvalue);
        obj[key] = value;
    }
    function pesapi_get_private(env: pesapi_env, pobject: pesapi_value, out_ptr: number): boolean { 
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object' && typeof obj != 'function') {
            Buffer.writeInt32(engine.unityApi.HEAPU8, 0, out_ptr);
            return false;
        }
        Buffer.writeInt32(engine.unityApi.HEAPU8, obj['__p_private_data'], out_ptr);
        return true;
    }
    function pesapi_set_private(env: pesapi_env, pobject: pesapi_value, ptr: number): boolean { 
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object' && typeof obj != 'function') {
            return false;
        }
        obj['__p_private_data'] = ptr;
        return true;
    }
    function pesapi_get_property_uint32(env: pesapi_env, pobject: pesapi_value, key: number, pvalue: pesapi_value): void {
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_get_property_uint32: target is not an object");
        }
        const value = obj[key];
        jsValueToPapiValue(engine.unityApi, value, pvalue);
    }
    function pesapi_set_property_uint32(env: pesapi_env, pobject: pesapi_value, key: number, pvalue: pesapi_value): void {
        const obj = Scope.getCurrent().toJs(engine.unityApi, objMapper, pobject);
        if (typeof obj != 'object') {
            throw new Error("pesapi_set_property_uint32: target is not an object");
        }
        const value = Scope.getCurrent().toJs(engine.unityApi, objMapper, pvalue);
        obj[key] = value;
    }

    // --------------- 函数调用/执行 ---------------
    function pesapi_call_function(
        env: pesapi_env, 
        pfunc: pesapi_value, 
        this_object: pesapi_value, 
        argc: number, 
        argv: pesapi_value_ptr,
        presult: pesapi_value
    ): void {
        const func: Function = Scope.getCurrent().toJs(engine.unityApi, objMapper, pfunc);
        const self = Scope.getCurrent().toJs(engine.unityApi, objMapper, this_object);
        if (typeof func != 'function') {
            throw new Error("pesapi_call_function: target is not a function");
        }
        const heap = engine.unityApi.HEAPU8;
        const args = [];
        for(let i = 0; i < argc; ++i) {
            const argPtr:pesapi_value = Buffer.readInt32(heap, argv + i * 4);
            args.push(Scope.getCurrent().toJs(engine.unityApi, objMapper, argPtr));
        }
        try {
            const result = func.apply(self, args);
            jsValueToPapiValue(engine.unityApi, result, presult);
        } catch (e) {
            Scope.getCurrent().lastException = e;
        }
    }

    // 和pesapi.h声明不一样，这改为返回值指针由调用者（原生）传入
    function pesapi_eval(env: pesapi_env, pcode: CSString, code_size: number, path: string, presult: pesapi_value): void {
        if (!globalThis.eval) {
            throw new Error("eval is not supported");
        }
        try {
            const code = engine.unityApi.UTF8ToString(pcode);
            const result = globalThis.eval(code);
            jsValueToPapiValue(engine.unityApi, result, presult);
        } catch (e) {
            Scope.getCurrent().lastException = e;
        }
    }

    // --------------- 全局对象 ---------------
    function pesapi_global(env: pesapi_env): pesapi_value { 
        return Scope.getCurrent().addToScope(globalThis);
    }

    // --------------- 环境私有数据 ---------------
    function pesapi_get_env_private(env: pesapi_env): number { 
        throw new Error("pesapi_get_env_private not implemented yet!");
    }
    function pesapi_set_env_private(env: pesapi_env, ptr: number): void {
        throw new Error("pesapi_set_env_private not implemented yet!");
    }

    interface APIInfo {
        func: Function
        sig: string
    }

    const apiInfo: APIInfo[] = [
        {func: pesapi_create_null, sig: "ii"},
        {func: pesapi_create_undefined, sig: "ii"},
        {func: pesapi_create_boolean, sig: "iii"},
        {func: pesapi_create_int32, sig: "iii"},
        {func: pesapi_create_uint32, sig: "iii"},
        {func: pesapi_create_int64, sig: "iji"},
        {func: pesapi_create_uint64, sig: "iji"},
        {func: pesapi_create_double, sig: "iid"},
        {func: pesapi_create_string_utf8, sig: "iiii"},
        {func: pesapi_create_binary, sig: "iiii"},
        {func: pesapi_create_array, sig: "ii"},
        {func: pesapi_create_object, sig: "ii"},
        {func: pesapi_create_function, sig: "iiiii"},
        {func: pesapi_create_class, sig: "iii"},
        
        {func: pesapi_get_value_bool, sig: "iii"},
        {func: pesapi_get_value_int32, sig: "iii"},
        {func: pesapi_get_value_uint32, sig: "iii"},
        {func: pesapi_get_value_int64, sig: "jii"},
        {func: pesapi_get_value_uint64, sig: "jii"},
        {func: pesapi_get_value_double, sig: "dii"},
        {func: pesapi_get_value_string_utf8, sig: "iiiii"},
        {func: pesapi_get_value_binary, sig: "iiii"},
        {func: pesapi_get_array_length, sig: "iii"},
        
        {func: pesapi_is_null, sig: "iii"},
        {func: pesapi_is_undefined, sig: "iii"},
        {func: pesapi_is_boolean, sig: "iii"},
        {func: pesapi_is_int32, sig: "iii"},
        {func: pesapi_is_uint32, sig: "iii"},
        {func: pesapi_is_int64, sig: "iii"},
        {func: pesapi_is_uint64, sig: "iii"},
        {func: pesapi_is_double, sig: "iii"},
        {func: pesapi_is_string, sig: "iii"},
        {func: pesapi_is_object, sig: "iii"},
        {func: pesapi_is_function, sig: "iii"},
        {func: pesapi_is_binary, sig: "iii"},
        {func: pesapi_is_array, sig: "iii"},
        
        {func: pesapi_native_object_to_value, sig: "iiiii"},
        {func: pesapi_get_native_object_ptr, sig: "iii"},
        {func: pesapi_get_native_object_typeid, sig: "iii"},
        {func: pesapi_is_instance_of, sig: "iiii"},
        
        {func: pesapi_boxing, sig: "iii"},
        {func: pesapi_unboxing, sig: "iii"},
        {func: pesapi_update_boxed_value, sig: "viii"},
        {func: pesapi_is_boxed_value, sig: "iii"},
        
        {func: pesapi_get_args_len, sig: "ii"},
        {func: pesapi_get_arg, sig: "iii"},
        {func: pesapi_get_env, sig: "ii"},
        {func: pesapi_get_native_holder_ptr, sig: "ii"},
        {func: pesapi_get_holder, sig: "ii"},
        {func: pesapi_get_userdata, sig: "ii"},
        {func: pesapi_add_return, sig: "vii"},
        {func: pesapi_throw_by_string, sig: "vii"},
        
        {func: pesapi_create_env_ref, sig: "ii"},
        {func: pesapi_env_ref_is_valid, sig: "ii"},
        {func: pesapi_get_env_from_ref, sig: "ii"},
        {func: pesapi_duplicate_env_ref, sig: "ii"},
        {func: pesapi_release_env_ref, sig: "vi"},
        
        {func: pesapi_open_scope, sig: "ii"},
        {func: pesapi_open_scope_placement, sig: "iii"},
        {func: pesapi_has_caught, sig: "ii"},
        {func: pesapi_get_exception_as_string, sig: "iii"},
        {func: pesapi_close_scope, sig: "vi"},
        {func: pesapi_close_scope_placement, sig: "vi"},
        
        {func: pesapi_create_value_ref, sig: "iiii"},
        {func: pesapi_duplicate_value_ref, sig: "ii"},
        {func: pesapi_release_value_ref, sig: "vi"},
        {func: pesapi_get_value_from_ref, sig: "viii"},
        {func: pesapi_set_ref_weak, sig: "vii"},
        {func: pesapi_set_owner, sig: "iiii"},
        {func: pesapi_get_ref_associated_env, sig: "ii"},
        {func: pesapi_get_ref_internal_fields, sig: "iii"},
        
        {func: pesapi_get_property, sig: "viiii"},
        {func: pesapi_set_property, sig: "viiii"},
        {func: pesapi_get_private, sig: "iiii"},
        {func: pesapi_set_private, sig: "iiii"},
        {func: pesapi_get_property_uint32, sig: "viiii"},
        {func: pesapi_set_property_uint32, sig: "viiii"},
        
        {func: pesapi_call_function, sig: "viiiiii"},
        {func: pesapi_eval, sig: "viiiii"},
        {func: pesapi_global, sig: "ii"},
        {func: pesapi_get_env_private, sig: "ii"},
        {func: pesapi_set_env_private, sig: "vii"}
    ];

    console.log(`create webgl ffi api count: ${apiInfo.length}`);
    const ptr = engine.unityApi._malloc(apiInfo.length * 4);
    const h32index = ptr >> 2;
    for(var i = 0; i < apiInfo.length; ++i) {
        engine.unityApi.HEAP32[h32index + i] = engine.unityApi.addFunction(apiInfo[i].func, apiInfo[i].sig);
    }

    webglFFI = ptr;
    engine.unityApi.InjectPapiGLNativeImpl(webglFFI);
    return ptr;
}

export function WebGLRegsterApi(engine: PuertsJSEngine) {
    // Explicitly define array type to avoid 'never' type inference
    // Define union type for method/property descriptors
    type Descriptor = 
        | { name: string; isStatic: boolean; callback: Function; data: number }
        | { 
            name: string; 
            isStatic: boolean; 
            getter: Function; 
            setter: Function; 
            getter_data: number; 
            setter_data: number 
          };

    // Initialize with proper type assertion
    const descriptorsArray: Array<Array<Descriptor>> = [[]] as Array<Array<Descriptor>>;
    return {
        GetRegsterApi: function() {
            return 0;
        },
        pesapi_alloc_property_descriptors: function(count:number): number {
            descriptorsArray.push([]);
            return descriptorsArray.length - 1;
        },
        pesapi_define_class: function(typeId: number, superTypeId: number, pname: CSString, constructor: number, finalize: number, propertyCount: number, properties: number, data: number) : void {
            const descriptors = descriptorsArray[properties];
            descriptorsArray[properties] = undefined;
            const name = engine.unityApi.UTF8ToString(pname);
            const nativeConstructor = engine.unityApi.getWasmTableEntry(constructor);

            const PApiNativeObject = function (...args: any[]) {
                const callbackInfo = jsArgsToCallbackInfo(engine.unityApi, args);
                Buffer.writeInt32(engine.unityApi.HEAPU8, data, callbackInfo + 8); // data
                const objId = nativeConstructor(webglFFI, callbackInfo);
                objMapper.bindNativeObject(objId, this, typeId, true);
            }
            Object.defineProperty(PApiNativeObject, "name", { value: name });

            if (superTypeId != 0) {
                const superType = ClassRegister.getInstance().loadClassById(superTypeId);
                if (superType) {
                    Object.setPrototypeOf(PApiNativeObject.prototype, superType.prototype);
                }
            }

            descriptors.forEach(descriptor => {
                if ('callback' in descriptor) {
                    const jsCallback = genJsCallback(engine.unityApi, descriptor.callback, descriptor.data, webglFFI, descriptor.isStatic);
                    if (descriptor.isStatic) {
                        (PApiNativeObject as any)[descriptor.name] = jsCallback;
                    } else {
                        PApiNativeObject.prototype[descriptor.name] = jsCallback;
                    }
                } else {
                    //console.log(`genJsCallback ${descriptor.name} ${descriptor.getter_data} ${webglFFI}`);
                    var propertyDescriptor: PropertyDescriptor = {
                        get: genJsCallback(engine.unityApi, descriptor.getter, descriptor.getter_data, webglFFI, descriptor.isStatic),
                        set: genJsCallback(engine.unityApi, descriptor.setter, descriptor.setter_data, webglFFI, descriptor.isStatic),
                        configurable: true,
                        enumerable: true
                    }
                    if (descriptor.isStatic) {
                        Object.defineProperty(PApiNativeObject, descriptor.name, propertyDescriptor);
                    } else {
                        Object.defineProperty(PApiNativeObject.prototype, descriptor.name, propertyDescriptor);
                    }
                }
            });

            console.log(`pesapi_define_class: ${name} ${typeId} ${superTypeId}`);

            ClassRegister.getInstance().registerClass(typeId, PApiNativeObject, data);
        },
        pesapi_get_class_data: function(typeId: number, forceLoad: boolean) : number {
            return ClassRegister.getInstance().getClassDataById(typeId, forceLoad);
        },
        pesapi_on_class_not_found: function(callbackPtr: pesapi_class_not_found_callback) {
            const jsCallback =engine.unityApi.getWasmTableEntry(callbackPtr);
            ClassRegister.getInstance().setClassNotFoundCallback((typeId: number) : boolean => {
                const ret = jsCallback(typeId);
                return !!ret;
            });
        },
        pesapi_set_method_info: function(properties: number, index: number, pname: CSString, is_static: boolean, method: number, data: number, signature_info: number): void {
            const name = engine.unityApi.UTF8ToString(pname);
            const jsCallback = engine.unityApi.getWasmTableEntry(method);
            descriptorsArray[properties][index] = {
                name: name,
                isStatic: is_static,
                callback: jsCallback,
                data: data
            };
        },
        pesapi_set_property_info: function(properties: number, index: number, pname: CSString, is_static: boolean, getter: number, setter: number, getter_data: number, setter_data: number, type_info: number): void {
            const name = engine.unityApi.UTF8ToString(pname);
            const jsGetter = engine.unityApi.getWasmTableEntry(getter);
            const jsSetter = engine.unityApi.getWasmTableEntry(setter);
            descriptorsArray[properties][index] = {
                name: name,
                isStatic: is_static,
                getter: jsGetter,
                setter: jsSetter,
                getter_data: getter_data,
                setter_data: setter_data
            };
        },
        pesapi_trace_native_object_lifecycle: function() {
            //throw new Error("pesapi_trace_native_object_lifecycle not implemented yet!");
        }
    }
}