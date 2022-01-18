import { FunctionCallbackInfoPtrMananger, PuertsJSEngine, Ref } from "../library";
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
            throw new Error('not implemented')

        },
        SetDateToOutValue: function (isolate: IntPtr, value: MockIntPtr, date: double) {
            throw new Error('not implemented')

        },
        SetStringToOutValue: function (isolate: IntPtr, value: MockIntPtr, str: string) {
            var obj = FunctionCallbackInfoPtrMananger.GetArgsByMockIntPtr<any>(value);
            console.log(obj)
        },
        SetBooleanToOutValue: function (isolate: IntPtr, value: MockIntPtr, b: bool) {
            throw new Error('not implemented')

        },
        SetBigIntToOutValue: function (isolate: IntPtr, value: IntPtr, /*long */bigInt: any) {
            throw new Error('not implemented')

        },
        SetObjectToOutValue: function (isolate: IntPtr, value: IntPtr, classId: int, ptr: IntPtr) {
            throw new Error('not implemented')

        },
        SetNullToOutValue: function (isolate: IntPtr, value: MockIntPtr) {
            throw new Error('not implemented')

        },
        SetArrayBufferToOutValue: function (isolate: IntPtr, value: IntPtr, /*Byte[] */bytes: any, length: int) {
            throw new Error('not implemented')

        },
    }
}