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
        loader = (globalThis as any).scriptEnv.GetLoader();
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
    JS_TAG_STRING16      = -8,
    JS_TAG_BUFFER        = -7,
    JS_TAG_EXCEPTION     = -6,
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

let hasException = false;
let lastException: Error = undefined;
let lastExceptionBuffer: number = undefined;

function getExceptionAsNativeString(wasmApi: PuertsJSEngine.UnityAPI, with_stack: boolean): number {
    if (hasException) {
        hasException = false;
        let result:string = undefined;
        if (typeof lastException === 'object' && lastException !== null) {
            const msg = lastException.message;
            const stack = lastException.stack;
            result = with_stack ? `${msg}\n${stack}` : msg;
        } else {
            result = `${lastException}`;
        }
        lastException = null;
        const byteCount = wasmApi.lengthBytesUTF8(result);
        // console.log(`getExceptionAsNativeString(${byteCount}): ${result}`);
        if (lastExceptionBuffer) {
            wasmApi._free(lastExceptionBuffer);
        }
        lastExceptionBuffer = wasmApi._malloc(byteCount + 1);
        // 这不+1会导致少一个字符，看上去stringToUTF8的逻辑是认为该长度是buffer的最大长度，而且确保结尾有\0结束符
        wasmApi.stringToUTF8(result, lastExceptionBuffer, byteCount + 1);
        // 如果上述推论正确，这行是多余的，不过保险起见还是加下
        wasmApi.HEAPU8[lastExceptionBuffer + byteCount] = 0;
        return lastExceptionBuffer;
    }
    return 0;
}

function getAndClearLastException() : Error {
    hasException = false;
    const ret = lastException;
    lastException = null;
    return ret;
}

function setLastException(err: Error) {
    hasException = true;
    lastException = err;
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
        getAndClearLastException();
        Scope.current.close(wasmApi);
    }

    constructor() {
        this.prevScope = Scope.current;
        Scope.current = this;
    }

    close(wasmApi: PuertsJSEngine.UnityAPI): void {
        Scope.current = this.prevScope;
    }

    addToScope(obj: object): number {
        this.objectsInScope.push(obj);
        return this.objectsInScope.length - 1;
    }

    getFromScope(index: number): object {
        return this.objectsInScope[index];
    }

    toJs(wasmApi: PuertsJSEngine.UnityAPI, objMapper: ObjectMapper, pvalue: pesapi_value, freeStringAndBuffer: boolean = false) : any {
        if (pvalue == 0) return undefined;

        const heap = wasmApi.HEAPU8;
        const tagPtr = pvalue + 8;
        const valType = Buffer.readInt32(heap, tagPtr);
        //console.log(`valType: ${valType}`);
        if (valType <= JSTag.JS_TAG_OBJECT && valType >= JSTag.JS_TAG_ARRAY) {
            const objIdx = Buffer.readInt32(heap, pvalue);
            return this.objectsInScope[objIdx];
        }
        if (valType == JSTag.JS_TAG_NATIVE_OBJECT) {
            const objId = Buffer.readInt32(heap, pvalue);
            return objMapper.findNativeObject(objId); // 肯定已经push过了，直接find就可以了
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
                const str = wasmApi.UTF8ToString(strStart as any, strLen);
                if (freeStringAndBuffer) {
                    const need_free = Buffer.readInt32(heap, tagPtr + 4); // need_free
                    if (need_free != 0) {
                        wasmApi._free(strStart);
                    }
                }
                return str;
            case JSTag.JS_TAG_STRING16:
                const str16Start = Buffer.readInt32(heap, pvalue);
                const str16Len = Buffer.readInt32(heap, pvalue + 4);
                const str16 = wasmApi.UTF16ToString(str16Start as any, str16Len * 2);
                if (freeStringAndBuffer) {
                    const need_free = Buffer.readInt32(heap, tagPtr + 4); // need_free
                    if (need_free != 0) {
                        wasmApi._free(str16Start);
                    }
                }
                return str16;
            case JSTag.JS_TAG_BUFFER:
                const buffStart = Buffer.readInt32(heap, pvalue);
                const buffLen = Buffer.readInt32(heap, pvalue + 4);
                const buff =  wasmApi.HEAP8.buffer.slice(buffStart, buffStart + buffLen);
                if (freeStringAndBuffer) {
                    const need_free = Buffer.readInt32(heap, tagPtr + 4); // need_free
                    if (need_free != 0) {
                        wasmApi._free(buffStart);
                    }
                }
                return buff;
        }
        throw new Error(`unsupported type: ${valType}`);
    }

    private prevScope: Scope = undefined;

    private objectsInScope: object[] = [null]; // 加null为了index从1开始，因为在原生种存放在指针字段防止误判为nullptr
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
            return [objId, (obj as any).$TypeId__]
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

type TypeInfos = { typeId: number; finalize: Function; data: number}

class ClassRegister {
    private static instance: ClassRegister;

    private constructor() {}

    private classNotFound: (typeId: number) => bool = undefined

    private typeIdToClass: Map<number, Function> = new Map();

    private typeIdToInfos: Map<number, TypeInfos> = new Map();

    private nameToClass: Map<string, Function> = new Map();

    public static getInstance(): ClassRegister {
        if (!ClassRegister.instance) {
            ClassRegister.instance = new ClassRegister();
        }
        return ClassRegister.instance;
    }

    //public pesapi_define_class(typeId: number, superTypeId: number, pname: CSString, constructor: number, finalize: number, propertyCount: number, properties: number, data: number): void {
        
    //}

    public defineClass(typeId: number): void {
        const typeDef = wasmApi.load_class_by_id(registry, typeId);
        const superTypeId: number = wasmApi.get_class_super_type_id(typeDef);
        const pname = wasmApi.get_class_name(typeDef);
        const name = wasmApi.UTF8ToString(pname as any);
        const constructor = wasmApi.get_class_initialize(typeDef);
        const finalize = wasmApi.get_class_finalize(typeDef);
        const data = wasmApi.get_class_data(typeDef);

        const PApiNativeObject = function (...args: any[]) {
            let callbackInfo: number = undefined;
            const argc = arguments.length;
            const scope = Scope.enter();
            try {
                callbackInfo = jsArgsToCallbackInfo(wasmApi, argc, args);
                Buffer.writeInt32(wasmApi.HEAPU8, data, callbackInfo + 8); // data
                const objId = wasmApi.PApiConstructorWithScope(constructor, webglFFI, callbackInfo); // 预期wasm只会通过throw_by_string抛异常，不产生直接js异常
                if (hasException) {
                    throw getAndClearLastException();
                }
                objMapper.bindNativeObject(objId, this, typeId, PApiNativeObject, true);
            } finally {
                returnNativeCallbackInfo(wasmApi, argc, callbackInfo);
                scope.close(wasmApi);
            }
        }
        Object.defineProperty(PApiNativeObject, "name", { value: name });

        if (superTypeId != 0) {
            const superType = this.loadClassById(superTypeId);
            if (superType) {
                Object.setPrototypeOf(PApiNativeObject.prototype, superType.prototype);
            }
        }

        function nativeMethodInfoToJs(methodPtr: number, isStatic: boolean) : Function {
            const nativeFuncPtr = wasmApi.get_function_info_callback(methodPtr);
            const methodData = wasmApi.get_function_info_data(methodPtr);
            return genJsCallback(wasmApi, nativeFuncPtr, methodData, webglFFI, isStatic);
        }

        function nativePropertyInfoToJs(propertyInfoPtr: number, isStatic: boolean) : PropertyDescriptor {
            const getter = wasmApi.get_property_info_getter(propertyInfoPtr);
            const setter = wasmApi.get_property_info_setter(propertyInfoPtr);
            const getter_data = wasmApi.get_property_info_getter_data(propertyInfoPtr);
            const setter_data = wasmApi.get_property_info_setter_data(propertyInfoPtr);
            return {
                get: getter === 0 ? undefined : genJsCallback(wasmApi, getter, getter_data, webglFFI, isStatic),
                set: setter === 0 ? undefined : genJsCallback(wasmApi, setter, setter_data, webglFFI, isStatic),
                configurable: true,
                enumerable: true
            }
        }

        let methodPtr = wasmApi.get_class_methods(typeDef);
        while (methodPtr != 0) {
            const fieldName = wasmApi.UTF8ToString(wasmApi.get_function_info_name(methodPtr) as any);
            //console.log(`method: ${name} ${fieldName}`);
            PApiNativeObject.prototype[fieldName] = nativeMethodInfoToJs(methodPtr, false);
            methodPtr = wasmApi.get_next_function_info(methodPtr);
        }

        let functionPtr = wasmApi.get_class_functions(typeDef);
        while (functionPtr != 0) {
            const fieldName = wasmApi.UTF8ToString(wasmApi.get_function_info_name(functionPtr) as any);
            //console.log(`function: ${name} ${fieldName}`);
            (PApiNativeObject as any)[fieldName] = nativeMethodInfoToJs(functionPtr, true);
            functionPtr = wasmApi.get_next_function_info(functionPtr);
        }

        let propertyPtr = wasmApi.get_class_properties(typeDef);
        while (propertyPtr != 0) {
            const fieldName = wasmApi.UTF8ToString(wasmApi.get_property_info_name(propertyPtr) as any);
            //console.log(`property: ${name} ${fieldName}`);
            Object.defineProperty(PApiNativeObject.prototype, fieldName, nativePropertyInfoToJs(propertyPtr, false));
            propertyPtr = wasmApi.get_next_property_info(propertyPtr);
        }

        let variablePtr = wasmApi.get_class_variables(typeDef);
        while (variablePtr != 0) {
            const fieldName = wasmApi.UTF8ToString(wasmApi.get_property_info_name(variablePtr) as any);
            //console.log(`variable: ${name} ${fieldName}`);
            Object.defineProperty(PApiNativeObject, fieldName, nativePropertyInfoToJs(variablePtr, false));
            variablePtr = wasmApi.get_next_property_info(variablePtr);
        }

        //console.log(`pesapi_define_class: ${name} ${typeId} ${superTypeId}`);

        this.registerClass(typeId, PApiNativeObject, wasmApi.getWasmTableEntry(finalize), data);
    }

    public loadClassById(typeId: number): Function {
        const cls = this.typeIdToClass.get(typeId);
        if (cls) {
            return cls;
        } else {
            this.defineClass(typeId);
            return this.typeIdToClass.get(typeId);
        }
    }

    public registerClass(typeId: number, cls: Function, finalize: Function, clsData: number): void {
        const infos = { typeId, finalize, data: clsData };

        Object.defineProperty(cls, '$Infos', {
            value: infos,
            writable: false,
            enumerable: false,
            configurable: false
        });
        this.typeIdToClass.set(typeId, cls);
        this.typeIdToInfos.set(typeId, infos);
        this.nameToClass.set(cls.name, cls);
    }

    public getClassDataById(typeId: number, forceLoad: boolean): number {
        if (forceLoad) {
            this.loadClassById(typeId);
        }
        const infos = this.getTypeInfos(typeId);
        return infos ? infos.data : 0;
    }

    public findClassById(typeId: number): Function | undefined {
        return this.typeIdToClass.get(typeId);
    }

    public findClassByName(name: string): Function | undefined {
        return this.nameToClass.get(name);
    }

    public getTypeInfos(typeId: number): TypeInfos | undefined {
        return this.typeIdToInfos.get(typeId);
    }

    public setClassNotFoundCallback(callback: (typeId: number) => boolean) {
        this.classNotFound = callback;
    }
}

class ObjectMapper {
    private objectPool: ObjectPool;
    private privateData: number = undefined;
    private objId2ud = new Map<number, number>();
    private onEnter: (objId: number, data: number, privateData: number) => number = undefined;
    private onExit: (objId: number, data: number, privateData: number, ud: number) => void = undefined;

    constructor() {
        this.objectPool = new ObjectPool(this.OnNativeObjectFinalized.bind(this));
        this.objectPool.startIncrementalGc(100, 1000);
    }

    public pushNativeObject(objId: number, typeId:number, callFinalize: boolean): object {
        let jsObj = this.objectPool.get(objId);
        if (!jsObj) {
            const cls = ClassRegister.getInstance().loadClassById(typeId);
            if (cls) {
                jsObj = Object.create(cls.prototype);
                this.bindNativeObject(objId, jsObj, typeId, cls, callFinalize);
            }
        } 
        return jsObj;
    }

    public findNativeObject(objId: number): object | undefined {
        return this.objectPool.get(objId);
    }

    public bindNativeObject(objId: number, jsObj: object, typeId:number, cls: Function, callFinalize: boolean): void {
        this.objectPool.add(objId, jsObj, typeId, callFinalize);
        const {data} = (cls as any).$Infos as TypeInfos;
        if (this.onEnter) {
            const ud: number = this.onEnter(objId, data, this.privateData);
            this.objId2ud.set(objId, ud);
        }
    }

    public setEnvPrivate(privateData: number): void {
        this.privateData = privateData;
    }

    public traceNativeObject(onEnter: Function, onExit: Function) {
        this.onEnter = onEnter as (objId: number, data: number, privateData: number) => number;
        this.onExit = onExit as (objId: number, data: number, privateData: number, ud: number) => void;
    }

    private OnNativeObjectFinalized(objId: number, typeId:number, callFinalize: boolean) {
        //console.error(`OnNativeObjectFinalized ${objId}`);
        const cls = ClassRegister.getInstance().findClassById(typeId);
        const {finalize, data} = (cls as any).$Infos as TypeInfos;
        if (callFinalize && finalize) {
            finalize(webglFFI, objId, data, this.privateData);
        }
        if (this.onExit && this.objId2ud.has(objId)) {
            const ud = this.objId2ud.get(objId);
            this.objId2ud.delete(objId);
            this.onExit(objId, data, this.privateData, ud);
        }
    }
}


let webglFFI:number = undefined;
let objMapper: ObjectMapper = undefined;
let registry: number = undefined;
let wasmApi: PuertsJSEngine.UnityAPI = undefined;

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
//     int need_free;
// } JSValue;
//
// struct CallbackInfo {
//     void* thisPtr;
//     int argc;
//     void* data;
//     void* thisTypeId;
//     JSValue res;
//     JSValue argv[0];
// };
// sizeof(JSValue) == 16

const callbackInfosCache : number[] = [];

function getNativeCallbackInfo(wasmApi: PuertsJSEngine.UnityAPI, argc: number): number {
    let callbackInfo = callbackInfosCache[argc];
    if (!callbackInfo)  {
        // 4 + 4 + 4 + 4 + 16 + (argc * 16)
        const size = 32 + (argc * 16);
        callbackInfo = wasmApi._malloc(size);
        Buffer.writeInt32(wasmApi.HEAPU8, argc, callbackInfo + 4);
    } else {
        callbackInfosCache[argc] = undefined;
    }
    Buffer.writeInt32(wasmApi.HEAPU8, JSTag.JS_TAG_UNDEFINED, callbackInfo + 24); // set res to undefined
    return callbackInfo;
}

function returnNativeCallbackInfo(wasmApi: PuertsJSEngine.UnityAPI, argc: number, callbackInfo: number): void {
    if (callbackInfosCache[argc]) {
        wasmApi._free(callbackInfo);
    } else {
        callbackInfosCache[argc] = callbackInfo;
    }
}

// TODO: 先简单分配由wasm那释放，后续再优化
function getBuffer(wasmApi: PuertsJSEngine.UnityAPI, size: number): number {
    return wasmApi._malloc(size);
}

function jsValueToPapiValue(wasmApi: PuertsJSEngine.UnityAPI, arg: any, value: pesapi_value) {
    let heap = wasmApi.HEAPU8;

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
        const len = wasmApi.lengthBytesUTF16(arg);
        const ptr = getBuffer(wasmApi, len + 2);
        wasmApi.stringToUTF16(arg, ptr, len + 2);
        heap = wasmApi.HEAPU8; // getBuffer会申请内存，可能导致HEAPU8改变
        Buffer.writeInt32(heap, ptr, dataPtr);
        Buffer.writeInt32(heap, arg.length, dataPtr + 4);
        Buffer.writeInt32(heap, JSTag.JS_TAG_STRING16, tagPtr);
        Buffer.writeInt32(heap, 1, tagPtr + 4); // need_free = true
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
        wasmApi.HEAP8.set(new Int8Array(arg), ptr);
        heap = wasmApi.HEAPU8; // getBuffer会申请内存，可能导致HEAPU8改变
        Buffer.writeInt32(heap, ptr, dataPtr);
        Buffer.writeInt32(heap, len, dataPtr + 4);
        Buffer.writeInt32(heap, JSTag.JS_TAG_BUFFER, tagPtr);
        Buffer.writeInt32(heap, 1, tagPtr + 4); // need_free = true
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

function jsArgsToCallbackInfo(wasmApi: PuertsJSEngine.UnityAPI, argc:number, args: any[]): number {
    const callbackInfo = getNativeCallbackInfo(wasmApi, argc);

    for(let i = 0; i < argc; ++i) {
        const arg = args[i];
        jsValueToPapiValue(wasmApi, arg, callbackInfo + 32 + (i * 16));
    }

    return callbackInfo;
}

function genJsCallback(wasmApi: PuertsJSEngine.UnityAPI, callback: number, data: number, papi:number, isStatic: boolean) {
    return function(...args: any[]) {
        if (new.target) {
            throw new Error('"not a constructor');
        }
        let callbackInfo: number = undefined;
        const argc = args.length;
        const scope = Scope.enter();
        try {
            callbackInfo = jsArgsToCallbackInfo(wasmApi, argc, args);
            const heap = wasmApi.HEAPU8; //在PApiCallbackWithScope前都不会变化，这样用是安全的
            Buffer.writeInt32(heap, data, callbackInfo + 8); // data
            let objId = 0;
            let typeId = 0;
            if (!isStatic && this) {
                const ntoInfo = ObjectPool.GetNativeInfoOfObject(this);
                if (ntoInfo) [objId, typeId] = ntoInfo;
            } 
            Buffer.writeInt32(heap, objId, callbackInfo); // thisPtr
            Buffer.writeInt32(heap, typeId, callbackInfo + 12); // thisTypeId
            wasmApi.PApiCallbackWithScope(callback, papi, callbackInfo); // 预期wasm只会通过throw_by_string抛异常，不产生直接js异常
            if (hasException) {
                throw getAndClearLastException();
            }
        
            return Scope.getCurrent().toJs(wasmApi, objMapper, callbackInfo + 16, true);
        } finally {
            returnNativeCallbackInfo(wasmApi, argc, callbackInfo);
            scope.close(wasmApi);
        }
    }
}

// 需要在Unity里调用PlayerSettings.WebGL.emscriptenArgs = " -s ALLOW_TABLE_GROWTH=1";
export function WebGLFFIApi(engine: PuertsJSEngine) {
    wasmApi = engine.unityApi;
    objMapper = new ObjectMapper();

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
        const jsCallback = genJsCallback(engine.unityApi, native_impl, data, webglFFI, false);
        return Scope.getCurrent().addToScope(jsCallback);
    }

    function pesapi_create_class(env: pesapi_env, typeId: number): pesapi_value {
        const cls = ClassRegister.getInstance().loadClassById(typeId);
        if (typeof cls === 'function') {
            //console.log(`create class: ${cls.name}`);
            return Scope.getCurrent().addToScope(cls);
        }
        throw new Error("can't load class by type id: " + typeId);
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

    function pesapi_throw_by_string(pinfo: pesapi_callback_info, pmsg: CSString): void {
        const msg = engine.unityApi.UTF8ToString(pmsg);
        setLastException(new Error(msg));
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
        return hasException;
    }
    function pesapi_get_exception_as_string(pscope: pesapi_scope, with_stack: boolean): number { 
        return getExceptionAsNativeString(engine.unityApi, with_stack);
    }
    function pesapi_close_scope(pscope: pesapi_scope): void {
        Scope.exit(engine.unityApi);
    }
    function pesapi_close_scope_placement(pscope: pesapi_scope): void {
        Scope.exit(engine.unityApi);
    }

    const referencedValues = new SparseArray<any>();

    function pesapi_create_value_ref(env: pesapi_env, pvalue: pesapi_value, internal_field_count: number): pesapi_value_ref { 
        const value = Scope.getCurrent().toJs(engine.unityApi, objMapper, pvalue);
        return referencedValues.add(value);
    }

    function pesapi_release_value_ref(pvalue_ref: pesapi_value_ref): void {
        referencedValues.remove(pvalue_ref);
    }
    function pesapi_get_value_from_ref(env: pesapi_env, pvalue_ref: pesapi_value_ref, pvalue: pesapi_value): void { 
        const value = referencedValues.get(pvalue_ref);
        jsValueToPapiValue(engine.unityApi, value, pvalue);
    }

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
            setLastException(e);
        }
    }

    // 和pesapi.h声明不一样，这改为返回值指针由调用者（原生）传入
    function pesapi_eval(env: pesapi_env, pcode: CSString, code_size: number, path: string, presult: pesapi_value): void {
        try {
            if (!globalThis.eval) {
                throw new Error("eval is not supported"); // TODO: 抛给wasm更合适些
            }
            const code = engine.unityApi.UTF8ToString(pcode, code_size);
            const result = globalThis.eval(code);
            jsValueToPapiValue(engine.unityApi, result, presult);
        } catch (e) {
            setLastException(e);
        }
    }

    function pesapi_global(env: pesapi_env): pesapi_value { 
        return Scope.getCurrent().addToScope(globalThis);
    }

    function pesapi_set_env_private(env: pesapi_env, ptr: number): void {
        objMapper.setEnvPrivate(ptr);
    }

    function pesapi_trace_native_object_lifecycle(env: number, onEnter:number, onExit:number) {
        const enterCallback = engine.unityApi.getWasmTableEntry(onEnter);
        const exitCallback = engine.unityApi.getWasmTableEntry(onExit);
        objMapper.traceNativeObject(enterCallback, exitCallback);
    }

    function pesapi_set_registry(env: number, registry_: number): void {
        registry = registry_;
    }

    /*
    interface APIInfo {
        func: Function
        sig: string
    }

    const apiInfo: APIInfo[] = [
        {func: pesapi_create_array, sig: "ii"},
        {func: pesapi_create_object, sig: "ii"},
        {func: pesapi_create_function, sig: "iiiii"},
        {func: pesapi_create_class, sig: "iii"},
        {func: pesapi_get_array_length, sig: "iii"},
        {func: pesapi_native_object_to_value, sig: "iiiii"},
        {func: pesapi_throw_by_string, sig: "vii"},
        //{func: pesapi_open_scope, sig: "ii"},
        {func: pesapi_open_scope_placement, sig: "iii"},
        {func: pesapi_has_caught, sig: "ii"},
        {func: pesapi_get_exception_as_string, sig: "iii"},
        //{func: pesapi_close_scope, sig: "vi"},
        {func: pesapi_close_scope_placement, sig: "vi"},
        {func: pesapi_create_value_ref, sig: "iiii"},
        {func: pesapi_release_value_ref, sig: "vi"},
        {func: pesapi_get_value_from_ref, sig: "viii"},
        {func: pesapi_get_property, sig: "viiii"},
        {func: pesapi_set_property, sig: "viiii"},
        {func: pesapi_get_private, sig: "iiii"},
        {func: pesapi_set_private, sig: "iiii"},
        {func: pesapi_get_property_uint32, sig: "viiii"},
        {func: pesapi_set_property_uint32, sig: "viiii"},
        {func: pesapi_call_function, sig: "viiiiii"},
        {func: pesapi_eval, sig: "viiiii"},
        {func: pesapi_global, sig: "ii"},
        {func: pesapi_set_env_private, sig: "vii"}
    ];
    */

    return {
        GetWebGLFFIApi: GetWebGLFFIApi,
        GetWebGLPapiVersion: GetWebGLPapiVersion,
        CreateWebGLPapiEnvRef: CreateWebGLPapiEnvRef,
        pesapi_create_array_js: pesapi_create_array,
        pesapi_create_object_js: pesapi_create_object,
        pesapi_create_function_js: pesapi_create_function,
        pesapi_create_class_js: pesapi_create_class,
        pesapi_get_array_length_js: pesapi_get_array_length,
        pesapi_native_object_to_value_js: pesapi_native_object_to_value,
        pesapi_throw_by_string_js: pesapi_throw_by_string,
        pesapi_open_scope_placement_js: pesapi_open_scope_placement,
        pesapi_has_caught_js: pesapi_has_caught,
        pesapi_get_exception_as_string_js: pesapi_get_exception_as_string,
        pesapi_close_scope_placement_js: pesapi_close_scope_placement,
        pesapi_create_value_ref_js: pesapi_create_value_ref,
        pesapi_release_value_ref_js: pesapi_release_value_ref,
        pesapi_get_value_from_ref_js: pesapi_get_value_from_ref,
        pesapi_get_property_js: pesapi_get_property,
        pesapi_set_property_js: pesapi_set_property,
        pesapi_get_private_js: pesapi_get_private,
        pesapi_set_private_js: pesapi_set_private,
        pesapi_get_property_uint32_js: pesapi_get_property_uint32,
        pesapi_set_property_uint32_js: pesapi_set_property_uint32,
        pesapi_call_function_js: pesapi_call_function,
        pesapi_eval_js: pesapi_eval,
        pesapi_global_js: pesapi_global,
        pesapi_set_env_private_js: pesapi_set_env_private,
        pesapi_trace_native_object_lifecycle_js: pesapi_trace_native_object_lifecycle,
        pesapi_set_registry_js: pesapi_set_registry
    };
}

function GetWebGLFFIApi() {
    if (webglFFI) return webglFFI;
    webglFFI = wasmApi.InjectPapiGLNativeImpl();
    return webglFFI;
}

function GetWebGLPapiVersion(): number {
    return 11;
}

function CreateWebGLPapiEnvRef() {
    return 2048; // just not nullptr
}
