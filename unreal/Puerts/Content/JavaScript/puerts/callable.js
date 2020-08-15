/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

var global = global || (function () { return this; }());
(function (global) {
    "use strict";

    let sendRequestSync = puerts.sendRequestSync;

    function getClassInfo(className) {
        let classInfo = sendRequestSync('getClassInfo', className);
        return JSON.parse(classInfo);
    }

    function ref(x) {
        return {value:x};
    }

    function unref(r) {
        return r.value;
    }

    function ret(o) {
        return o.ReturnValue;
    }

    function retWithWrap(o){
        return wrapUObject(o.ReturnValue);
    }
    
    function retWithAsyncWrap(o){
        return wrapUObject(o.ReturnValue, true);
    }
    
    function id(x) {
        return x;
    }
    
    function makeArgumentUnpack(paramInfo) {
        if (paramInfo.isOut && paramInfo.isUObject) {
            return x => ref(wrapUObject(x));
        } else if(paramInfo.isOut) {
            return ref;
        } else if (paramInfo.isUObject) {
            return wrapUObject;
        } else {
            return id;
        }
    }
    
    function wrapCallback(functionInfo, callback) {
        let paramsInfo = functionInfo.parameters;
        paramsInfo.forEach( paramInfo => paramInfo.unpack = makeArgumentUnpack(paramInfo));
        return (argsObj) => {
            let args = paramsInfo.map(paramInfo => paramInfo.unpack(argsObj[paramInfo.name]));
            callback.apply(null, args);
        };
    }
    
    let registerCallbacks = Object.create(null);
    var allocedCallbackId = 0;
    function registerCallback(callback) {
        let callbackId = allocedCallbackId++;
        registerCallbacks[callbackId] = callback;
        return callbackId;
    }
    function unregisterCallback(callbackId) {
        delete registerCallbacks[callbackId];
    }

    let wrapGenerators = Object.create(null);

    class Delegate {
        constructor(objectId, propertyName, propertyType) {
            this.objectId = objectId;
            this.propertyName = propertyName;
            this.propertyType = propertyType;
        }

        Bind(func) {
            if (typeof func !== 'function') {
                throw new Error('function needed!');
            }
            this.Unbind();
            let callbackId = registerCallback(wrapCallback(this.propertyType, func));
            sendRequestSync('bindDelegate', this.objectId + '#' + this.propertyName + '#' + callbackId);
            this.bindedCallbackId = callbackId;
        }

        Unbind() {
            if (this.bindedCallbackId) {
                sendRequestSync('unbindDelegate', this.bindedCallbackId);
                unregisterCallback(this.bindedCallbackId);
                this.bindedCallbackId = undefined;
            }
        }
    }

    class MulticastDelegate {
        constructor(objectId, propertyName, propertyType) {
            this.objectId = objectId;
            this.propertyName = propertyName;
            this.propertyType = propertyType;
        }

        Add(func) {
            if (typeof func !== 'function') {
                throw new Error('function needed!');
            }
            let callbackId = registerCallback(wrapCallback(this.propertyType, func));
            sendRequestSync('bindDelegate', this.objectId + '#' + this.propertyName + '#' + callbackId);
            return callbackId;
        }

        Remove(callbackId) {
            sendRequestSync('unbindDelegate', callbackId);
            unregisterCallback(callbackId);
        }
    }

    let pendingAsyncCall = [];

    function getWrapGenerator(className, optClassInfo) {
        if (!(className in wrapGenerators)) {
            let classInfo = optClassInfo || getClassInfo(className);
            wrapGenerators[className] = (objectId, isClass, isAsync) => {
                let target = {$functions: classInfo.functions, $id:objectId, toJSON:() => objectId, $toAsync:() => getWrapGenerator(className, optClassInfo)(objectId, true, true)};
                if (!isClass) {
                    for (var propertyName in classInfo.delegates) {
                        target[propertyName] = new Delegate(objectId, propertyName, classInfo.delegates[propertyName]);
                    }
                    for (var propertyName in classInfo.multicasts) {
                        target[propertyName] = new MulticastDelegate(objectId, propertyName, classInfo.multicasts[propertyName]);
                    }
                } else {
                    target["StaticClass"] = () => classInfo.pathName;
                }
                return new Proxy(target, {
                    get: function(cfg, name) {
                        if (!(name in cfg)) {
                            let functionInfo = cfg.$functions[name];
                            let id = cfg.$id
                            //之前抛异常不太适合，传统js是duck typing，有时会通过是否有某函数判断能力。
                            //比如，promise里resolve传入的对象，thenable对象是通过是否有then函数来决定的，
                            //所以异步返回，resolve传入wrap的uobject时，会抛无then函数的异常；
                            if (!functionInfo) return; 
                            let paramsInfo = functionInfo.parameters;
                            let r = functionInfo.isUObject ? (isAsync ? retWithAsyncWrap : retWithWrap) : ret;
                            cfg[name] = isAsync ? function() {
                                let argsObj = {};
                                paramsInfo.forEach((paramInfo, idx) => argsObj[paramInfo.name] = paramInfo.isOut ? arguments[idx].value : arguments[idx]);
                                let argsString = JSON.stringify(argsObj);
                                let outterArgs = arguments;
                                return new Promise(function(resolve, reject) {
                                    let args = id + '#' + name + '#' + argsString;
                                    pendingAsyncCall.push({args: args.length + 'A' + args, resolve: res => {
                                        paramsInfo.forEach((paramInfo, idx) =>  {
                                            if(paramInfo.isOut) {
                                                outterArgs[idx].value = paramInfo.isUObject ? wrapUObject(res[paramInfo.name]) :res[paramInfo.name];
                                            }
                                        });
                                        resolve(r(res));
                                    }, reject: reject});
                                });
                            } : function() {
                                let argsObj = {};
                                paramsInfo.forEach((paramInfo, idx) => argsObj[paramInfo.name] = paramInfo.isOut ? arguments[idx].value : arguments[idx]);
                                let argsString = JSON.stringify(argsObj);
                                //puerts.console.log('id:' + id + ',method:' + name + ',args:' + argsString);
                                let res = JSON.parse(sendRequestSync('callUObjectMethod', id + '#' + name + '#' + argsString));
                                paramsInfo.forEach((paramInfo, idx) =>  {
                                    if(paramInfo.isOut) {
                                        arguments[idx].value = paramInfo.isUObject ? wrapUObject(res[paramInfo.name]) :res[paramInfo.name];
                                    }
                                });

                                return r(res);
                            }
                        }
                        return cfg[name];
                    },
                    set: function(cfg, name, value) {
                        throw new Error('set not allow for ' + name);
                    }
                });
            };
        }

        return wrapGenerators[className];
    }

    function wrapUObject(objectId, isAsync) {
        if (objectId === "0000000000000000") return null;
        let className = objectId.substring(objectId.indexOf('-') + 1);
        return getWrapGenerator(className)(objectId, false, isAsync);
    }

    let UE = new Proxy(Object.create(null), {
        get: function(classWrapers, name) {
            if (!(name in classWrapers)) {
                let classInfo = getClassInfo(name);
                classWrapers[name] = getWrapGenerator(name, classInfo)(classInfo.pathName, true);
            }
            return classWrapers[name];
        }
    });
    
    puerts.registerRequestHandler('invokeCallback', (msg, onFinished) => {
        let split = msg.indexOf('#');
        let callbackId = msg.substring(0, split);
        let cb = registerCallbacks[callbackId];
        if (cb) {
            cb(JSON.parse(msg.substring(split + 1)));
            onFinished("");
        } else {
            onFinished(undefined, "no callback " + callbackId);
        }
    });
    
    puerts.registerRequestHandler('onCallbackRelease', callbackId => {
        registerCallbacks[callbackId] = undefined;
    });

    var mainObject = undefined;

    function getMainObject() {
        if (!mainObject) {
            mainObject = wrapUObject(sendRequestSync('getMainObjectId', ''));
        }
        return mainObject;
    }
    
    function getProperties(obj, ...fields) {
        let args = (typeof obj === 'string') ? obj : obj.toJSON();
        if (fields.length > 0) {
            args += ("#" + fields.join('#'));
        }
        return JSON.parse(sendRequestSync('getProperties', args));
    }
    
    function getPropertiesAsync(obj, ...fields) {
        let args = (typeof obj === 'string') ? obj : obj.toJSON();
        if (fields.length > 0) {
            args += ("#" + fields.join('#'));
        }
        return new Promise(function(resolve, reject) {
            pendingAsyncCall.push({args: args.length + 'C' + args, resolve: resolve, reject: reject});
        });
    }
    
    function setProperties(obj, properties) {
        let objectId = (typeof obj === 'string') ? obj : obj.toJSON();
        sendRequestSync('setProperties', objectId + '#' +JSON.stringify(properties));
    }
    
    function setPropertiesAsync(obj, properties) {
        let objectId = (typeof obj === 'string') ? obj : obj.toJSON();
        let args = objectId + '#' +JSON.stringify(properties);
        return new Promise(function(resolve, reject) {
            pendingAsyncCall.push({args: args.length + 'B' + args, resolve: resolve, reject: reject});
        });
    }

    function flushAsyncCall(trace) {
        if (pendingAsyncCall.length == 0) return 0;
        let sliceCalls = pendingAsyncCall;
        let batchArgs = sliceCalls.map(x =>x.args).join('');
        if (trace) {
            puerts.console.log(sliceCalls.map(x =>x.args).join('\n'))
        }
        pendingAsyncCall = [];
        let batchResult = sendRequestSync('batchCall', batchArgs);
        let callIndex = 0;
        let split1 = 0;
        let split2;
        while((split2 = batchResult.indexOf('#', split1)) >= 0) {
            let len = parseInt(batchResult.slice(split1, split2));
            let result = batchResult.substr(split2 + 1, len);
            if (result.startsWith('#')) {
                let r = result.substr(1);
                if (r == '') {
                    sliceCalls[callIndex].resolve();
                } else {
                    sliceCalls[callIndex].resolve(JSON.parse(result.substr(1)));
                }
            } else {
                sliceCalls[callIndex].reject(new Error(result));
            }
            ++callIndex;
            split1 = split2 + 1 + len;
        }
        return sliceCalls.length
    }

    puerts.getMainObject = getMainObject;
    puerts.getProperties = getProperties;
    puerts.getPropertiesAsync = getPropertiesAsync;
    puerts.setProperties = setProperties;
    puerts.setPropertiesAsync = setPropertiesAsync;
    puerts.flushAsyncCall = flushAsyncCall;

    puerts.$ref = ref;
    puerts.$unref = unref;
    puerts.$async = x => x.$toAsync();
    
    puerts.registerBuildinModule('ue', UE);
}(global));
