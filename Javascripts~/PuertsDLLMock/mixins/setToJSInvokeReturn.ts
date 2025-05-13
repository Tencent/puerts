import { PuertsJSEngine, jsFunctionOrObjectFactory, makeBigInt } from "../library";

/**
 * mixin
 * JS调用C#时，C#设置返回到JS的值
 * 
 * @param engine 
 * @returns 
 */
export default function WebGLBackendSetToJSInvokeReturnApi(engine: PuertsJSEngine) {
    return {
        ReturnClass: function (isolate: IntPtr, info: MockIntPtr, classID: int) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.csharpObjectMap.classes[classID];
        },
        ReturnObject: function (isolate: IntPtr, info: MockIntPtr, classID: int, self: CSIdentifier) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.csharpObjectMap.findOrAddObject(self, classID);
        },
        ReturnNumber: function (isolate: IntPtr, info: MockIntPtr, number: double) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = number;
        },
        ReturnString: function (isolate: IntPtr, info: MockIntPtr, strString: CSString) {
            const str = engine.unityApi.UTF8ToString(strString);
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = str;
        },
        ReturnBigInt: function (isolate: IntPtr, info: MockIntPtr, longLow: number, longHigh: number) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = makeBigInt(longLow, longHigh);
        },
        ReturnBoolean: function (isolate: IntPtr, info: MockIntPtr, b: boolean) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = !!b; // 传过来的是1和0
        },
        ReturnDate: function (isolate: IntPtr, info: MockIntPtr, date: double) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = new Date(date);
        },
        ReturnNull: function (isolate: IntPtr, info: MockIntPtr) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = null;
        },
        ReturnFunction: function (isolate: IntPtr, info: MockIntPtr, JSFunctionPtr: JSFunctionPtr) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            const jsFunc = jsFunctionOrObjectFactory.getJSFunctionById(JSFunctionPtr);
            callbackInfo.returnValue = jsFunc._func;
        },
        ReturnJSObject: function (isolate: IntPtr, info: MockIntPtr, JSObjectPtr: JSObjectPtr) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            const jsObject = jsFunctionOrObjectFactory.getJSObjectById(JSObjectPtr);
            callbackInfo.returnValue = jsObject.getObject();
        },
        ReturnCSharpFunctionCallback: function(
            isolate: IntPtr, 
            info: MockIntPtr, 
            v8FunctionCallback: IntPtr,
            /*long */pointerLow: number,
            /*long */pointerHigh: number
        ) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.makeCSharpFunctionCallbackFunction(false, v8FunctionCallback, pointerHigh);
        },
        ReturnCSharpFunctionCallback2: function(
            isolate: IntPtr, 
            info: MockIntPtr, 
            v8FunctionCallback: IntPtr,
            JsFunctionFinalize: IntPtr,
            /*long */pointerLow: number,
            /*long */pointerHigh: number
        ) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.makeCSharpFunctionCallbackFunction(false, v8FunctionCallback, pointerHigh);
        },
        ReturnArrayBuffer: function (isolate: IntPtr, info: MockIntPtr, /*byte[] */index: number, length: int) {
            var callbackInfo = engine.functionCallbackInfoPtrManager.GetByMockPointer(info);
            callbackInfo.returnValue = engine.unityApi.HEAP8.buffer.slice(index, index + length);
        },

    }
}