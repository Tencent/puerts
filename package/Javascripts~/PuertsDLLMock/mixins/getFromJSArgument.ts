import { FunctionCallbackInfoPtrManager, GetType, JSFunction, jsFunctionOrObjectFactory, PuertsJSEngine, setOutValue32 } from "../library";
/**
 * mixin
 * JS调用C#时，C#侧获取JS调用参数的值
 * 
 * @param engine 
 * @returns 
 */
export default function WebGLBackendGetFromJSArgumentAPI(engine: PuertsJSEngine) {
    return {
        GetNumberFromValue: function (isolate: IntPtr, value: MockIntPtr, isByRef: bool): number {
            return FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
        },
        GetDateFromValue: function (isolate: IntPtr, value: MockIntPtr, isByRef: bool): number {
            return (FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value) as Date).getTime();
        },
        GetStringFromValue: function (isolate: IntPtr, value: MockIntPtr, /*out int */length: number, isByRef: bool): number {
            var returnStr = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<string>(value);
            return engine.JSStringToCSString(returnStr, length);
        },
        GetBooleanFromValue: function (isolate: IntPtr, value: MockIntPtr, isByRef: bool): boolean {
            return FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
        },
        ValueIsBigInt: function (isolate: IntPtr, value: MockIntPtr, isByRef: bool): boolean {
            var bigint = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            return bigint instanceof BigInt;
        },
        GetBigIntFromValue: function (isolate: IntPtr, value: MockIntPtr, isByRef: bool) {
            var bigint = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            return bigint;
        },
        GetObjectFromValue: function (isolate: IntPtr, value: MockIntPtr, isByRef: bool) {
            var nativeObject = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            return engine.csharpObjectMap.getCSIdentifierFromObject(nativeObject);
        },
        GetFunctionFromValue: function (isolate: IntPtr, value: MockIntPtr, isByRef: bool): JSFunctionPtr {
            var func = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<(...args: any[]) => any>(value);
            var jsfunc = jsFunctionOrObjectFactory.getOrCreateJSFunction(func);
            return jsfunc.id;
        },
        GetJSObjectFromValue: function (isolate: IntPtr, value: MockIntPtr, isByRef: bool) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<(...args: any[]) => any>(value);
            var jsobj = jsFunctionOrObjectFactory.getOrCreateJSObject(obj);
            return jsobj.id;
        },
        GetArrayBufferFromValue: function (isolate: IntPtr, value: MockIntPtr, /*out int */length: any, isOut: bool) {
            var ab = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<ArrayBuffer>(value);
            if (ab instanceof Uint8Array) {
                ab = ab.buffer;
            }
            var ptr = engine.unityApi._malloc(ab.byteLength);
            engine.unityApi.HEAP8.set(new Int8Array(ab), ptr);
            engine.unityApi.HEAP32[length >> 2] = ab.byteLength;
            setOutValue32(engine, length, ab.byteLength);
            return ptr;
        },


        GetArgumentType: function (isolate: IntPtr, info: MockIntPtr, index: int, isByRef: bool) {
            var value = FunctionCallbackInfoPtrManager.GetByMockPointer(info).args[index];
            return GetType(engine, value);
        },
        /**
         * 为c#侧提供一个获取callbackinfo里jsvalue的intptr的接口
         * 并不是得的到这个argument的值
         */
        GetArgumentValue/*inCallbackInfo*/: function (infoptr: MockIntPtr, index: int) {
            return infoptr | index;
        },
        GetJsValueType: function (isolate: IntPtr, val: MockIntPtr, isByRef: bool) {
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
            var value: any = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(val);
            return GetType(engine, value);
        },
        GetTypeIdFromValue: function (isolate: IntPtr, value: MockIntPtr, isByRef: bool) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr(value);
            var typeid = 0;
            if (obj instanceof JSFunction) {
                typeid = (obj._func as any)["$cid"];
            } else {
                typeid = (obj as any)["$cid"];
            }

            if (!typeid) {
                throw new Error('cannot find typeid for' + value)
            }
            return typeid
        },
    }
}