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
import {WebGLFFIApi} from "./pesapiImpl"

declare const PUERTS_JS_RESOURCES: any;
declare const wxRequire: any;
declare const CS: any;
declare const __tgjsGetLoader: any;

global.wxRequire = global.require;

global.PuertsWebGL = {
    inited: false,
    debug: false,
    // puerts首次初始化时会调用这里，并把Unity的通信接口传入
    Init(ctorParam: PuertsJSEngine.EngineConstructorParam) {
        const engine = new PuertsJSEngine(ctorParam);

        const executeModuleCache: { [filename: string]: any } = {};

        let jsEngineReturned = false;
        let loader: any;

        // PuertsDLL的所有接口实现
        global.PuertsWebGL = Object.assign(
            global.PuertsWebGL,
            { 
                updateGlobalBufferAndViews: engine.updateGlobalBufferAndViews.bind(engine) 
            },
            WebGLFFIApi(engine),
            {
                // bridgeLog: true,
                LowMemoryNotification: function (isolate: IntPtr) { },
                IdleNotificationDeadline: function (isolate: IntPtr) { },
                RequestMinorGarbageCollectionForTesting: function (isolate: IntPtr) { },
                RequestFullGarbageCollectionForTesting: function (isolate: IntPtr) { },
                ClearModuleCache: function () { },
                CreateInspector: function (isolate: IntPtr, port: int) { },
                DestroyInspector: function (isolate: IntPtr) { },
                InspectorTick: function (isolate: IntPtr) { },
                LogicTick: function (isolate: IntPtr) { },
                SetLogCallback: function (log: IntPtr, logWarning: IntPtr, logError: IntPtr) {

                },
                GetJSStackTrace: function (isolate: IntPtr) {
                    return new Error().stack;
                },
                GetWebGLPapiEnvRef: function() {
                    return 2048; // just not nullptr
                }
            }
        )
    }
}