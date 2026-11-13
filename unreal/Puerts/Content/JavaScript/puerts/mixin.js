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
        let names = Object.getOwnPropertyNames(mixinClass.prototype);
        for(var i = 0; i < names.length; ++i) {
            let name = names[i];
            let descriptor = Object.getOwnPropertyDescriptor(mixinClass.prototype, name);
            if (typeof descriptor.value === 'function' && name != "constructor") {
                 mixinMethods[name] = mixinClass.prototype[name];
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
