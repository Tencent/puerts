/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

var global = global || (function () { return this; }());
(function (global) {
    "use strict";
    
    const scriptEnv = global.scriptEnv;
    
    // the public api of puerts, implemented by the methods of scriptEnv
    puerts.loadUEType = scriptEnv.loadUEType.bind(scriptEnv);
    puerts.loadCPPType = scriptEnv.loadCPPType.bind(scriptEnv);
    puerts.loadModule = scriptEnv.loadModule.bind(scriptEnv);
    puerts.releaseManualReleaseDelegate = scriptEnv.releaseManualReleaseDelegate.bind(scriptEnv);
    puerts.getFNameString = scriptEnv.getFNameString.bind(scriptEnv);
    puerts.toCString = scriptEnv.toCString.bind(scriptEnv);
    puerts.toCPtrArray = scriptEnv.toCPtrArray.bind(scriptEnv);
    
    const getFNameString = puerts.getFNameString;
    
    function rawSet(obj, key, val) {
        Object.defineProperty(obj, key, {
            value: val,
            writable: true,
            configurable: true,
            enumerable: false,
        });
    }
    
    function interceptClass(cls) {
        let cls_proxy = new Proxy(cls, {
        get : function(cls, name) {
                const fname = getFNameString(name);
                const p = Object.getOwnPropertyDescriptor(cls, fname);
                if (p) {
                    Object.defineProperty(cls, name, p);
                    return cls[fname];
                }
            }
        });
        Object.setPrototypeOf(cls_proxy, Object.getPrototypeOf(cls));
        Object.setPrototypeOf(cls, cls_proxy);
    }

    let UE = Object.create(null);
    let UE_proxy = new Proxy(UE, {
        get : function(UE, name)
        {
            let cls = scriptEnv.loadUEType(name);
            rawSet(UE, name, cls);
            interceptClass(cls);
            return cls;
        }
    });
    Object.setPrototypeOf(UE, UE_proxy);
    Object.defineProperty(UE, "__esModule", {value: false});

    const TNAMESPACE = 0;
    const TENUM = 1
    const TBLUEPRINT = 2;
    const TSTRUCT = 3
    
    function createNamespaceOrClass(path, parentDir, nodeType) {
        let result = {__path: path, __parent:parentDir, __type:nodeType};
        let result_proxy = new Proxy(result, {
            get: function(node, name) {
                if (name === '__parent' || name === '__path') return undefined;
                
                if (node.__type == TENUM) { // auto load
                    const res = createNamespaceOrClass(name, node, TNAMESPACE);
                    rawSet(node, name, res);
                    blueprint_load(res);
                    return node[name];
                } else {
                    let newNodeType = node.__type;
                    
                    if (newNodeType === TNAMESPACE) {
                        let path = `/${name}.${name}`
                        let c = node;
                        while (c && c.__path) {
                            path = `/${c.__path}${path}`
                            c = c.__parent;
                        }
                        const obj = UE.Object.Load(path, true);
                        if (obj) {
                            const typeName = obj.GetClass().GetName();
                            if (typeName === 'UserDefinedEnum') {
                                newNodeType = TENUM;
                            } else if (typeName === 'UserDefinedStruct') {
                                newNodeType = TSTRUCT;
                            } else {
                                newNodeType = TBLUEPRINT;
                            }
                        }
                    }
                    const res = createNamespaceOrClass(name, node, newNodeType);
                    rawSet(node, name, res);
                    return res;
                }
            }
        });
        Object.setPrototypeOf(result, result_proxy);
        return result;
    }
    
    rawSet(UE, "Game", createNamespaceOrClass("Game", undefined, TNAMESPACE));
    
    puerts.registerBuildinModule('ue', UE);
    global.UE = UE;
    
    let CPP = Object.create(null);
    let CPP_proxy = new Proxy(CPP, {
        get: function(CPP, name) {
            let cls = scriptEnv.loadCPPType(name);
            rawSet(CPP, name, cls);
            return cls;
        }
    });
    Object.setPrototypeOf(CPP, CPP_proxy);
    Object.defineProperty(CPP, "__esModule", {value: false});
    
    puerts.registerBuildinModule('cpp', CPP);
    global.CPP = CPP;
    
    function ref(x) {
        return [x];
    }

    function unref(r) {
        return r[0];
    }
    
    function setref(x, val) {
        x[0] = val;
    }
    
    rawSet(UE, 'NewObject', scriptEnv.newObject.bind(scriptEnv));
    
    
    rawSet(UE, 'NewStruct', scriptEnv.newStruct.bind(scriptEnv));
    
    rawSet(UE, 'MakeWeakObjectPtr', scriptEnv.makeWeakObjectPtr.bind(scriptEnv));
    
    puerts.$ref = ref;
    puerts.$unref = unref;
    puerts.$set = setref;
    
    rawSet(UE, 'FNameLiteral', scriptEnv.fnameToArrayBuffer.bind(scriptEnv));


    puerts.setJsTakeRef = scriptEnv.setJsTakeRef.bind(scriptEnv);
    
    const UEClassToJSClass = scriptEnv.ueClassToJSClass.bind(scriptEnv);
    
    function blueprint(path) {
        console.warn('deprecated! use blueprint.tojs instead');
        let ufield = UE.Field.Load(path, true);
        if (ufield) {
            let jsclass = UEClassToJSClass(ufield);
            jsclass.__puerts_ufield = ufield;
            return jsclass;
        } else {
            throw new Error("can not load type in " + path);
        }
    }
    
    blueprint.tojs = UEClassToJSClass;
    
    // blueprint.mixin / blueprint.unmixin are added by puerts/mixin.js when the mixin is enabled (EnableMixin of ScriptEnvMixinApi.h)
    
    const bpns = new Set(['Game']);
    
    function blueprint_createNamespace(ns) {
        if (!bpns.has(ns)) {
            rawSet(UE, ns, createNamespaceOrClass(ns, undefined, TNAMESPACE));
            bpns.add(ns);
        }
    }
    
    function blueprint_load(cls) {
        if (cls.__path) {
            let c = cls
            let path = `.${c.__path}`;
            c = c.__parent;
            while (c && c.__path) {
                path = `/${c.__path}${path}`
                c = c.__parent;
            }
            
            let ufield = UE.Field.Load(path, true);
            if (!ufield) {
                throw new Error(`load ${path} fail!`);
            }
            let jsclass = UEClassToJSClass(ufield);
            jsclass.__puerts_ufield = ufield;
            
            if (cls.__parent) {
                jsclass.__parent = cls.__parent;
                jsclass.__name = cls.__path;
                cls.__parent[cls.__path] = jsclass;
            }
            interceptClass(jsclass);
        } else {
            throw new Error("argument #0 is not a unload type");
        }
    }
    
    blueprint.load = blueprint_load;
    blueprint.namespace = blueprint_createNamespace;
    
    function blueprint_unload(cls) {
        if (cls.__puerts_ufield) {
            cls.__puerts_ufield = undefined;
            if (cls.__parent) {
                cls.__parent[cls.__name] = createNamespaceOrClass(cls.__name, cls.__parent);
            }
        }
    }
    
    blueprint.unload = blueprint_unload;
    
    puerts.blueprint = blueprint;
    
    const newContainer = scriptEnv.newContainer.bind(scriptEnv);
    
    function translateType(t) {
        if (typeof t !== 'number') {
            if (Object.prototype.hasOwnProperty.call(t, '__puerts_ufield')) {
                return t.__puerts_ufield
            } else {
                return t.StaticClass();
            }
        } else {
            return t;
        }
    }
    
    function NewArray(t1) {
        t1 = translateType(t1);

        var ret = newContainer(0, t1);
        if (!("[Symbol.iterator]" in ret)) {
            Object.getPrototypeOf(ret.constructor.prototype)[Symbol.iterator] = function*() {
                let index = 0;
                let num = this.Num();
                while (index < num) {
                    yield this.Get(index);
                    index++;
                }
            }
        }
        return ret;
    }
    
    function NewSet(t1) {
        t1 = translateType(t1);
        
        var ret = newContainer(1, t1);
        if (!("[Symbol.iterator]" in ret)) {
            Object.getPrototypeOf(ret.constructor.prototype)[Symbol.iterator] = function*() {
                let index = 0;
                let maxIndex = this.GetMaxIndex();
                while (index < maxIndex) {
                    if (this.IsValidIndex(index)) {
                        yield this.Get(index);
                    }
                    index++;
                }
            }
        }
        return ret;
    }
    
    function NewMap(t1, t2) {
        t1 = translateType(t1);
        t2 = translateType(t2);

        var ret = newContainer(2, t1, t2);
        if (!("[Symbol.iterator]" in ret)) {
            Object.getPrototypeOf(ret.constructor.prototype)[Symbol.iterator] = function*() {
                let index = 0;
                let maxIndex = this.GetMaxIndex();
                while (index < maxIndex) {
                    if (this.IsValidIndex(index)) {
                        let key = this.GetKey(index);
                        let value = this.Get(key);
                        yield [key, value];
                    }
                    index++;
                }
            }
        }
        return ret;
    }
    
    rawSet(UE, 'BuiltinBool', 0);
    rawSet(UE, 'BuiltinByte', 1);
    rawSet(UE, 'BuiltinInt', 2);
    rawSet(UE, 'BuiltinFloat', 3);
    rawSet(UE, 'BuiltinDouble', 4);
    rawSet(UE, 'BuiltinInt64', 5);
    rawSet(UE, 'BuiltinString', 6);
    rawSet(UE, 'BuiltinText', 7);
    rawSet(UE, 'BuiltinName', 8);
    
    // call once to inject iterators to constructor
    NewArray(UE.BuiltinInt);
    NewSet(UE.BuiltinInt);
    NewMap(UE.BuiltinInt, UE.BuiltinInt);
    
    rawSet(UE, 'NewArray', NewArray);
    rawSet(UE, 'NewSet', NewSet);
    rawSet(UE, 'NewMap', NewMap);
    
    puerts.toManualReleaseDelegate = (x) => x;
    puerts.toDelegate = (o,k) => [o, k];
    
    function removeListItem(list, item) {
        var found = false;
        for (var i = 0; i < list.length; ++i) {
            if (!found) {
                found = (list[i] === item);
            }
            if (found) {
                list[i] = list[i + 1]; // array[length + 1] === undefined
            }
        }
        if (found) {
            list.pop();
        }
    }
    puerts.__removeListItem = removeListItem
    
    function genListApply(lst) {
        return function(...args) {
            const len = lst.length;
            const list = lst.slice();
            let ret
            for (var i = 0; i < len; ++i) {
                ret = Reflect.apply(list[i], this, args);
            }
            return ret;
        }
    }
    puerts.__genListApply = genListApply
    
}(global));
