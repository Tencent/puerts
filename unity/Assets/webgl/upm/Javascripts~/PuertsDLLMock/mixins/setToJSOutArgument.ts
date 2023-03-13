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
            obj[0] = number;
        },
        SetDateToOutValue: function (isolate: IntPtr, value: MockIntPtr, date: double) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj[0] = new Date(date);
        },
        SetStringToOutValue: function (isolate: IntPtr, value: MockIntPtr, strString: CSString) {
            const str = engine.unityApi.UTF8ToString(strString);
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj[0] = str;
        },
        SetBooleanToOutValue: function (isolate: IntPtr, value: MockIntPtr, b: bool) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj[0] = !!b; // 传过来的是1和0
        },
        SetBigIntToOutValue: function (isolate: IntPtr, value: IntPtr, /*long */bigInt: any) {
            throw new Error('not implemented')

        },
        SetObjectToOutValue: function (isolate: IntPtr, value: MockIntPtr, classID: int, self: CSIdentifier) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj[0] = engine.csharpObjectMap.findOrAddObject(self, classID);
        },
        SetNullToOutValue: function (isolate: IntPtr, value: MockIntPtr) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            obj[0] = null; // 传过来的是1和0
        },
        SetArrayBufferToOutValue: function (isolate: IntPtr, value: MockIntPtr, /*Byte[] */index: any, length: int) {
            var obj = FunctionCallbackInfoPtrManager.GetArgsByMockIntPtr<any>(value);
            // 这里必须使用Uint8Array而不是AB本身，因为ab会是wasm的大buffer。除非为了变成ab而copy一遍。
            obj[0] = engine.unityApi.HEAP8.buffer.slice(index, index + length);

        },
    }
}