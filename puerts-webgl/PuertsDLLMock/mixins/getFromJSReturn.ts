import { FunctionCallbackInfoPtrManager, GetType, jsFunctionOrObjectFactory, PuertsJSEngine, Ref } from "../library";
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
        GetStringFromResult: function (resultInfo: IntPtr, /*out int */len: any) {
            engine.unityApi.HEAP32[len >> 2] = engine.lastReturnCSResult.length;
            return engine.JSStringToCSString(engine.lastReturnCSResult)

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
            return engine.csharpObjectMap.getCSObjectIDFromObject(engine.lastReturnCSResult);
        },
        GetTypeIdFromResult: function (resultInfo: IntPtr) {
            return GetType(engine, engine.lastReturnCSResult);

        },
        GetFunctionFromResult: function (resultInfo: IntPtr): JSFunctionPtr {
            var jsfunc = jsFunctionOrObjectFactory.getOrCreateJSFunction(engine.lastReturnCSResult);
            return jsfunc.id;
        },
        GetJSObjectFromResult: function (resultInfo: IntPtr) {
            throw new Error('not implemented')

        },
        GetArrayBufferFromResult: function (resultInfo: IntPtr, /*out int */length: any) {
            var ab: ArrayBuffer = engine.lastReturnCSResult;
            var ptr = engine.unityApi._malloc(ab.byteLength);
            engine.unityApi.HEAP8.set(new Int8Array(ab), ptr);
            engine.unityApi.HEAP32[length >> 2] = ab.byteLength;
            return ptr;
        },
        //保守方案
        GetResultType: function (resultInfo: IntPtr) {
            var value = engine.lastReturnCSResult;
            return GetType(engine, value);
        },
    }
}