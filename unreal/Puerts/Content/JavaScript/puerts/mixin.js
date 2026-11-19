/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

// blueprint.mixin / blueprint.unmixin, executed only when the mixin is enabled (EnableMixin of ScriptEnvMixinApi.h, FJsEnv always does),
// after puerts/uelazyload.js. The env without the mixin does not have them
var global = global || (function () { return this; }());
(function (global) {
    "use strict";
    
    const scriptEnv = global.scriptEnv;
    const blueprint = puerts.blueprint;
    
    // the native mixin of the env (FScriptEnvMixin), only kept by the closures below
    const nativeMixin = puerts.__mixin;
    delete puerts.__mixin;
    
    const UEClassToJSClass = scriptEnv.ueClassToJSClass.bind(scriptEnv);
    
    function mixin(to, mixinClass, config) {
        config = config || {};
        let mixinMethods = Object.create(null);
        // the methods of the ts class chain are collected, the ones of the derived class win: a ts class derived from
        // another ts class (the "unlua" style) mixin's the methods of its parents as well. The walk stops before the
        // prototype of a UE class (its methods are not mixin methods)
        for (let proto = mixinClass.prototype; proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
            let ctor = proto.constructor;
            if (typeof ctor === 'function' && typeof ctor.StaticClass === 'function') {
                break;
            }
            let names = Object.getOwnPropertyNames(proto);
            for (var i = 0; i < names.length; ++i) {
                let name = names[i];
                if (name == "constructor" || name in mixinMethods) {
                    continue;
                }
                let descriptor = Object.getOwnPropertyDescriptor(proto, name);
                if (typeof descriptor.value === 'function') {
                    mixinMethods[name] = descriptor.value;
                }
            }
        }
        let cls = nativeMixin.mixin(to.StaticClass(), mixinMethods, config.inherit, config.noMixinedWarning);
        // whether the objects of the mixed class (and its subclasses) are held by native, always set as before (a false overrides
        // the setting of a base class)
        scriptEnv.setNativeTakeJsRef(cls, !!config.objectTakeByNative);
        
        let jsCls = UEClassToJSClass(cls);
        Object.getOwnPropertyNames(mixinMethods).forEach(name => {
            if (!jsCls.prototype.hasOwnProperty(name)) {
                Object.defineProperty(
                    jsCls.prototype,
                    name,
                    Object.getOwnPropertyDescriptor(mixinMethods, name) ||
                    Object.create(null)
                );
            }
        });
                
        if (config.inherit) {
            config.generatedClass = cls;
        }
        return jsCls;
    }
    
    blueprint.mixin = mixin;
    
    function unmixin(to) {
        nativeMixin.unmixin(to.StaticClass());
    }
    
    blueprint.unmixin = unmixin;
    
}(global));
