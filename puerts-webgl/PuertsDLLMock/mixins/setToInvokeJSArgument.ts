import { JSFunction, jsFunctionOrObjectFactory, makeBigInt, PuertsJSEngine } from "../library";
/**
 * mixin
 * C#调用JS时，设置调用参数的值
 * 
 * @param engine 
 * @returns 
 */
export default function WebGLBackendSetToInvokeJSArgumentApi(engine: PuertsJSEngine) {
    return {
    
        //begin cs call js
        PushNullForJSFunction: function (_function: JSFunctionPtr) {
            const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(null);

        },
        PushDateForJSFunction: function (_function: JSFunctionPtr, dateValue: double) {
            const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(new Date(dateValue));

        },
        PushBooleanForJSFunction: function (_function: JSFunctionPtr, b: bool) {
            const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(b);

        },
        PushBigIntForJSFunction: function (_function: JSFunctionPtr, /*long */longlow: number, longhigh: number) {
            const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(makeBigInt(longlow, longhigh));

        },
        PushStringForJSFunction: function (_function: JSFunctionPtr, strString: CSString) {
            const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(engine.unityApi.Pointer_stringify(strString));

        },
        PushNumberForJSFunction: function (_function: JSFunctionPtr, d: double) {
            const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(d);

        },
        PushObjectForJSFunction: function (_function: JSFunctionPtr, classID: int, objectID: CSIdentifier) {
            const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(engine.csharpObjectMap.findOrAddObject(objectID, classID));
        },
        PushJSFunctionForJSFunction: function (_function: JSFunctionPtr, JSFunction: JSFunctionPtr) {
            const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(jsFunctionOrObjectFactory.getJSFunctionById(JSFunction));

        },
        PushJSObjectForJSFunction: function (_function: MockIntPtr, JSObject: IntPtr) {
            throw new Error('not implemented')

        },
        PushArrayBufferForJSFunction: function (_function: MockIntPtr, /*byte[] */bytes: number, length: int) {
            const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
            func.args.push(new Uint8Array(engine.unityApi.HEAP8.buffer, bytes, length));
        }

    }
}