import { FunctionCallbackInfoPtrManager, PuertsJSEngine, Ref } from "../library";
/**
 * mixin
 * JS调用C#时，C#侧设置out参数值
 * 
 * @param engine 
 * @returns 
 */
export default function WebGLBackendSetToJSOutArgumentAPI(engine: PuertsJSEngine) {
    return {
        SetNumberToOutValue: function (isolate: IntPtr, value: MockIntPtr, number: double) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj.value = number;
        },
        SetDateToOutValue: function (isolate: IntPtr, value: MockIntPtr, date: double) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj.value = new Date(date);
        },
        SetStringToOutValue: function (isolate: IntPtr, value: MockIntPtr, strString: CSString) {
            const str = engine.unityApi.UTF8ToString(strString);
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj.value = str;
        },
        SetBooleanToOutValue: function (isolate: IntPtr, value: MockIntPtr, b: bool) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj.value = !!b; // 传过来的是1和0
        },
        SetBigIntToOutValue: function (isolate: IntPtr, value: IntPtr, /*long */bigInt: any) {
            throw new Error('not implemented')

        },
        SetObjectToOutValue: function (isolate: IntPtr, value: MockIntPtr, classID: int, self: CSIdentifier) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj.value = engine.csharpObjectMap.findOrAddObject(self, classID);
        },
        SetNullToOutValue: function (isolate: IntPtr, value: MockIntPtr) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj.value = null; // 传过来的是1和0
        },
        SetArrayBufferToOutValue: function (isolate: IntPtr, value: MockIntPtr, /*Byte[] */bytes: any, Length: int) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj.value = new Uint8Array(engine.unityApi.HEAP8.buffer, bytes, Length);

        },
    }
}