import { GetType, JSFunction, jsFunctionOrObjectFactory, PuertsJSEngine, setOutValue32 } from "../library";
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
export default function WebGLBackendGetFromJSReturnAPI(engine: PuertsJSEngine) {
    return {
        GetNumberFromResult: function (resultInfo: IntPtr) {
            return engine.lastReturnCSResult;
        },
        GetDateFromResult: function (resultInfo: IntPtr) {
            return (engine.lastReturnCSResult as Date).getTime();
        },
        GetStringFromResult: function (resultInfo: IntPtr, /*out int */length: number) {
            return engine.JSStringToCSString(engine.lastReturnCSResult, length);
        },
        GetBooleanFromResult: function (resultInfo: IntPtr) {
            return engine.lastReturnCSResult;
        },
        ResultIsBigInt: function (resultInfo: IntPtr) {
            return engine.lastReturnCSResult instanceof BigInt;
        },
        GetBigIntFromResult: function (resultInfo: IntPtr) {
            throw new Error('not implemented')
        },
        GetObjectFromResult: function (resultInfo: IntPtr) {
            return engine.csharpObjectMap.getCSIdentifierFromObject(engine.lastReturnCSResult);
        },
        GetTypeIdFromResult: function (resultInfo: IntPtr) {
            var value = engine.lastReturnCSResult;
            var typeid = 0;
            if (value instanceof JSFunction) {
                typeid = (value._func as any)["$cid"];
            } else {
                typeid = (value as any)["$cid"];
            }

            if (!typeid) {
                throw new Error('cannot find typeid for' + value)
            }
            return typeid
        },
        GetFunctionFromResult: function (resultInfo: IntPtr): JSFunctionPtr {
            var jsfunc = jsFunctionOrObjectFactory.getOrCreateJSFunction(engine.lastReturnCSResult);
            return jsfunc.id;
        },
        GetJSObjectFromResult: function (resultInfo: IntPtr) {
            var jsobj = jsFunctionOrObjectFactory.getOrCreateJSObject(engine.lastReturnCSResult);
            return jsobj.id;
        },
        GetArrayBufferFromResult: function (resultInfo: IntPtr, /*out int */length: any) {
            var ab: ArrayBuffer = engine.lastReturnCSResult;
            var ptr = engine.unityApi._malloc(ab.byteLength);
            engine.unityApi.HEAP8.set(new Int8Array(ab), ptr);
            setOutValue32(engine, length, ab.byteLength);
            return ptr;
        },
        //保守方案
        GetResultType: function (resultInfo: IntPtr) {
            var value = engine.lastReturnCSResult;
            return GetType(engine, value);
        },
    }
}