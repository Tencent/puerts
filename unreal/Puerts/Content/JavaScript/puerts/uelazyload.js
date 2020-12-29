/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

var global = global || (function () { return this; }());
(function (global) {
    "use strict";
    
    let loadUEType = global.__tgjsLoadUEType;
    global.__tgjsLoadUEType = undefined;
    
    let loadCDataType = global.__tgjsLoadCDataType;
    global.__tgjsLoadCDataType = undefined;
    
    let cache = Object.create(null);
    
    let UE = new Proxy(cache, {
        get: function(classWrapers, name) {
            if (name === "toString") return () => "[UE Module]";
            if (name === "__esModule") return UE;//我们直接返回它,以便支持esm
            
            if (!(name in classWrapers)) {
                classWrapers[name] = loadUEType(name);
            }
            return classWrapers[name];
        }
    });
    
    puerts.registerBuildinModule('ue', UE);
    
    let CPP = new Proxy(cache, {
        get: function(classWrapers, name) {
            if (name === "toString") return () => "[cpp native Module]";
            if (name === "__esModule") return CPP;//我们直接返回它,以便支持esm
            
            if (!(name in classWrapers)) {
                classWrapers[name] = loadCDataType(name);
            }
            return classWrapers[name];
        }
    });
    
    puerts.registerBuildinModule('cpp', CPP);
    
    function ref(x) {
        return {value:x};
    }

    function unref(r) {
        return r.value;
    }
    
    function setref(x, val) {
        x.value = val;
    }
    
    cache.NewObject = global.__tgjsNewObject;
    global.__tgjsNewObject = undefined;
    
    puerts.$ref = ref;
    puerts.$unref = unref;
    puerts.$set = setref;
    puerts.merge = global.__tgjsMergeObject;
    global.__tgjsMergeObject = undefined;
    
    let rawmakeclass = global.__tgjsMakeUClass
    global.__tgjsMakeUClass = undefined;
    
    function defaultUeConstructor(){};
    
    function makeUClass(cls) {
        if (typeof cls === 'function' && !cls.hasOwnProperty('arguments')
            && typeof cls.StaticClass === 'function'
            && !cls.hasOwnProperty('StaticClass')) {
            //let parentClass = Object.getPrototypeOf(cls.prototype).constructor;
            let proto = cls.prototype;
            let methods = Object.create(null);
            
            let names = Object.getOwnPropertyNames(proto);
            let ueConstructor = defaultUeConstructor;
            for(var i = 0; i < names.length; ++i) {
                let name = names[i];
                if (typeof proto[name] === 'function' && name != "constructor") {
                    if (name === 'Constructor') {
                        ueConstructor = proto[name];
                    } else {
                        methods[name] = proto[name];
                    }
                }
            }
            
            return rawmakeclass(ueConstructor, proto, `${cls.name}_C`, methods, cls.StaticClass());
            
        } else {
            throw new Error("invalid class");
        }
    }
    
    puerts.makeUClass = makeUClass;
    
    let UEClassToJSClass = global.__tgjsUEClassToJSClass;
    global.__tgjsUEClassToJSClass = undefined;
    
    function blueprint(path) {
        let uclass = UE.Class.Load(path);
        if (uclass) {
            return UEClassToJSClass(uclass);
        } else {
            throw new Error("can not load class in " + path);
        }
    }
    
    puerts.blueprint = blueprint;
}(global));
