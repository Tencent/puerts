var global = global || (function () { return this; }());
(function (global) {
    "use strict";
    
    let puerts = global.puerts
    
    let dispatchProtocolMessage = global.__tgjsDispatchProtocolMessage 
    global.__tgjsDispatchProtocolMessage = undefined;
    
    let setInspectorCallback = global.__tgjsSetInspectorCallback 
    global.__tgjsSetInspectorCallback = undefined;
    
    const parsedScript = new Map();
    
    let contextInfo
    
    const pendingCommnand = new Map();
    
    function messageHandler(str) {
        let msg = JSON.parse(str);
        if (msg.method === "Debugger.scriptParsed") {
            parsedScript.set(msg.params.scriptId, msg.params.url);
            parsedScript.set(msg.params.url, msg.params.scriptId);
        } else if ( msg.method === "Runtime.executionContextCreated") {
            contextInfo = msg.params.context;
        } else if (typeof msg.id === "number") {
            if (msg.result && pendingCommnand.has(msg.id)) {
                const resolve = pendingCommnand.get(msg.id);
                pendingCommnand.delete(msg.id);
                resolve(msg.result);
            } else {
                console.error("unexpect inspector message:" + str);
            }
        }
        //if ( msg.method != "Runtime.consoleAPICalled") {
        //    console.error("<--", str);
        //}
    };

    let commandId = 0;
    
    function sendCommand(method, params) {
        return new Promise((resolve, reject) => {
            commandId++;
            pendingCommnand.set(commandId, resolve);
            //console.error("-->", JSON.stringify({"id":commandId,"method":method,"params":params}));
            dispatchProtocolMessage(JSON.stringify({"id":commandId,"method":method,"params":params}));
        });
    }
    
    let inited = false;
    
    async function enableDebugger() {
        if (inited) return;
        inited = true;
        setInspectorCallback(messageHandler);
        await sendCommand("Runtime.enable", {});
        await sendCommand("Debugger.enable", {"maxScriptsCacheSize":10000000});
        //await sendCommand("Debugger.setPauseOnExceptions",{"state":"none"});
        //await sendCommand("Debugger.setAsyncCallStackDepth",{"maxDepth":32});
        //await sendCommand("Profiler.enable",{});
        //await sendCommand("Runtime.getIsolateId",{});
        //await sendCommand("Debugger.setBlackboxPatterns",{"patterns":[]});
        //await sendCommand("Runtime.runIfWaitingForDebugger");
    }
    
    async function reload(moduleName, url, source) {
        await enableDebugger();
        let scriptId
        if (parsedScript.has(url)) {
            scriptId = parsedScript.get(url)
        } else {
            let win_url = url.replace(/\//g, '\\');
            if (parsedScript.has(win_url)) {
                scriptId = parsedScript.get(win_url)
            }
        }
        
        if (scriptId) {
            if (typeof source === "string") {
                let orgSourceInfo = await sendCommand("Debugger.getScriptSource", {scriptId:"" + scriptId});
                source = ("(function (exports, require, module, __filename, __dirname) { " + source + "\n});");
                if (orgSourceInfo.scriptSource == source) {
                    console.log(`source not changed, skip ${url}`);
                    return;
                }
                let m = puerts.getModuleByUrl(url);
                if (contextInfo) {
                    await sendCommand("Runtime.compileScript", {expression:source, sourceURL:"", persistScript:false, executionContextId:contextInfo.id});
                } 
                puerts.emit('HMR.prepare', moduleName, m, url);
                let res = await sendCommand("Debugger.setScriptSource", {scriptId:"" + scriptId,scriptSource:source});
                puerts.emit('HMR.finish', moduleName, m, url);
                //puerts.forceReload(url);
            }
        } else {
            console.warn(`can not find scriptId for ${url}`)
        }
    };
    
    puerts.__reload = reload;
}(global));
