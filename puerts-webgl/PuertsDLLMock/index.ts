/**
 * 根据 https://docs.unity3d.com/2018.4/Documentation/Manual/webgl-interactingwithbrowserscripting.html
 * 我们的目的就是在WebGL模式下，实现和puerts.dll的效果。具体在于实现一个jslib，里面应包含PuertsDLL.cs的所有接口
 * 实验发现这个jslib虽然也是运行在v8的js，但对devtool调试并不友好，且只支持到es5。
 * 因此应该通过一个独立的js实现接口，puerts.jslib通过全局的方式调用它。
 * 
 * 最终形成如下架构
 * 业务JS <-> WASM <-> unity jslib <-> 本js
 * 但整条链路其实都在一个v8(jscore)虚拟机里
 */
import { JSFunction, global, PuertsJSEngine, jsFunctionOrObjectFactory, setOutValue32 } from "./library";
import WebGLBackendGetFromJSArgumentAPI from "./mixins/getFromJSArgument";
import WebGLBackendGetFromJSReturnAPI from "./mixins/getFromJSReturn";
import WebGLBackendRegisterAPI from "./mixins/register";
import WebGLBackendSetToInvokeJSArgumentApi from "./mixins/setToInvokeJSArgument";
import WebGLBackendSetToJSInvokeReturnApi from "./mixins/setToJSInvokeReturn";
import WebGLBackendSetToJSOutArgumentAPI from "./mixins/setToJSOutArgument";

declare const PUERTS_JS_RESOURCES: any;
declare const wxRequire: any;

global.wxRequire = global.require;
global.PuertsWebGL = {
    // puerts首次初始化时会调用这里，并把Unity的通信接口传入
    Init({
        UTF8ToString, _malloc, _memset, _memcpy, _free, stringToUTF8, lengthBytesUTF8, unityInstance
    }: PuertsJSEngine.UnityAPI) {
        const engine = new PuertsJSEngine({
            UTF8ToString, _malloc, _memset, _memcpy, _free, stringToUTF8, lengthBytesUTF8, unityInstance
        });

        global.__tgjsEvalScript = typeof eval == "undefined" ? () => { } : eval;
        global.__tgjsSetPromiseRejectCallback = function (callback: (...args: any[]) => any) {
            if (typeof wx != 'undefined') {
                wx.onUnhandledRejection(callback);

            } else {
                window.addEventListener("unhandledrejection", callback);
            }
        }

        const executeModuleCache: { [filename: string]: any } = {};

        // PuertsDLL的所有接口实现
        global.PuertsWebGL = Object.assign(
            WebGLBackendGetFromJSArgumentAPI(engine),
            WebGLBackendGetFromJSReturnAPI(engine),
            WebGLBackendSetToInvokeJSArgumentApi(engine),
            WebGLBackendSetToJSInvokeReturnApi(engine),
            WebGLBackendSetToJSOutArgumentAPI(engine),
            WebGLBackendRegisterAPI(engine),
            {
                SetCallV8: function(callV8Function: MockIntPtr, callV8Constructor: MockIntPtr, callV8Destructor: MockIntPtr) {
                    engine.callV8Function = callV8Function;
                    engine.callV8Constructor = callV8Constructor;
                    engine.callV8Destructor = callV8Destructor;
                },
                GetLibVersion: function () {
                    return 15;
                },
                GetLibBackend: function () {
                    return 0;
                },
                CreateJSEngine: function () {
                    return 1024;
                },
                CreateJSEngineWithExternalEnv: function () { },
                DestroyJSEngine: function () { },
                GetLastExceptionInfo: function (isolate: IntPtr,/* out int */strlen: any) {
                    return engine.lastExceptionInfo;
                },
                LowMemoryNotification: function (isolate: IntPtr) {

                },
                SetGeneralDestructor: function (isolate: IntPtr, _generalDestructor: IntPtr) {
                    engine.generalDestructor = _generalDestructor
                },
                SetModuleResolver: function() {

                },
                ExecuteModule: function (isolate: IntPtr, pathString: CSString, exportee: CSString) {
                    try {
                        let fileName = UTF8ToString(pathString);
                        if (typeof wx != 'undefined') {
                            const result = wxRequire('puerts_minigame_js_resources/' + fileName.replace('.mjs', '.js').replace('.cjs', '.js'));
                            if (exportee) {
                                engine.lastReturnCSResult = result[UTF8ToString(exportee)];
                            } else {
                                engine.lastReturnCSResult = result;
                            }
                            return 1024
    
                        } else {
                            const result: any = { exports: {} };
                            if (executeModuleCache[fileName]) {
                                result.exports = executeModuleCache[fileName];

                            } else {
                                if (!PUERTS_JS_RESOURCES[fileName]) {
                                    console.error('file not found' + fileName);
                                }
                                PUERTS_JS_RESOURCES[fileName](result.exports, global['require'], result)
                                executeModuleCache[fileName] = result.exports;
                            }

                            if (exportee) {
                                engine.lastReturnCSResult = result.exports[UTF8ToString(exportee)];
                            } else {
                                engine.lastReturnCSResult = result.exports;
                            }
                            return 1024
                        }
                    } catch(e) {
                        engine.lastExceptionInfo = e.message;
                    }
                },
                Eval: function (isolate: IntPtr, codeString: CSString, path: string) {
                    if (!global.eval) {
                        throw new Error("eval is not supported");
                    }
                    const code = UTF8ToString(codeString);
                    const result = global.eval(code);
                    // return getIntPtrManager().GetPointerForJSValue(result);
                    engine.lastReturnCSResult = result;
                    return /*FResultInfo */1024;
                },


                ThrowException: function (isolate: IntPtr, /*byte[] */messageString: CSString) {
                    throw new Error(UTF8ToString(messageString));
                },

                InvokeJSFunction: function (_function: JSFunctionPtr, hasResult: bool) {
                    const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
                    if (func instanceof JSFunction) {
                        try {
                            engine.lastReturnCSResult = func.invoke();
                            return 1024;

                        } catch (err) {
                            console.error('InvokeJSFunction error', err);
                            func.lastExceptionInfo = err.message
                        }

                    } else {
                        throw new Error('ptr is not a jsfunc');
                    }
                },
                GetFunctionLastExceptionInfo: function (_function: JSFunctionPtr, /*out int */length: number) {
                    const func = jsFunctionOrObjectFactory.getJSFunctionById(_function);
                    if (func instanceof JSFunction) {
                        return engine.JSStringToCSString(func.lastExceptionInfo || '', length);
                    } else {
                        throw new Error('ptr is not a jsfunc');
                    }
                },
                ReleaseJSFunction: function (isolate: IntPtr, _function: JSFunctionPtr) {
                    jsFunctionOrObjectFactory.removeJSFunctionById(_function);

                },
                ReleaseJSObject: function (isolate: IntPtr, obj: IntPtr) {
                    throw new Error('not implemented')

                },

                ResetResult: function (resultInfo: IntPtr) {
                    engine.lastReturnCSResult = null;
                },

                CreateInspector: function (isolate: IntPtr, port: int) { },
                DestroyInspector: function (isolate: IntPtr) { },
                InspectorTick: function (isolate: IntPtr) { },
                LogicTick: function (isolate: IntPtr) { },
                SetLogCallback: function (log: IntPtr, logWarning: IntPtr, logError: IntPtr) {

                }
            }
        )
    }
}