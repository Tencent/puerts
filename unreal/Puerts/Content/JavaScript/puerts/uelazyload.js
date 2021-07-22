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
            if (!(name in classWrapers)) {
                classWrapers[name] = loadUEType(name);
            }
            return classWrapers[name];
        }
    });
    
    puerts.registerBuildinModule('ue', UE);
    
    let CPP = new Proxy(cache, {
        get: function(classWrapers, name) {
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
    
    cache.NewStruct = global.__tgjsNewStruct;
    global.__tgjsNewStruct = undefined;
    
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
                let descriptor = Object.getOwnPropertyDescriptor(proto, name);
                if (typeof descriptor.value === 'function' && name != "constructor") {
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
            let jsclass = UEClassToJSClass(uclass);
            jsclass.__puerts_uclass = uclass;
            return jsclass;
        } else {
            throw new Error("can not load class in " + path);
        }
    }
    
    puerts.blueprint = blueprint;
    
    const newContainer = global.__tgjsNewContainer;
    global.__tgjsNewContainer = undefined;
    
    function NewArray(t1) {
        if (typeof t1 !== 'number') {
            t1 = t1.StaticClass();
        }
        return newContainer(0, t1);
    }
    
    function NewSet(t1) {
        if (typeof t1 !== 'number') {
            t1 = t1.StaticClass();
        }
        return newContainer(1, t1);
    }
    
    function NewMap(t1, t2) {
        if (typeof t1 !== 'number') {
            t1 = t1.StaticClass();
        }
        if (typeof t2 !== 'number') {
            t2 = t2.StaticClass();
        }
        return newContainer(2, t1, t2);
    }
    
    cache.BuiltinBool = 0;
    cache.BuiltinByte = 1;
    cache.BuiltinInt = 2;
    cache.BuiltinFloat = 3;
    cache.BuiltinInt64 = 4;
    cache.BuiltinString = 5;
    cache.BuiltinText = 6;
    cache.BuiltinName = 7;
    
    cache.NewArray = NewArray;
    cache.NewSet = NewSet;
    cache.NewMap = NewMap;
    
    const FunctionFlags = {
        FUNC_None				: 0x00000000,

        FUNC_Final				: 0x00000001,	// Function is final (prebindable, non-overridable function).
        FUNC_RequiredAPI			: 0x00000002,	// Indicates this function is DLL exported/imported.
        FUNC_BlueprintAuthorityOnly: 0x00000004,   // Function will only run if the object has network authority
        FUNC_BlueprintCosmetic	: 0x00000008,   // Function is cosmetic in nature and should not be invoked on dedicated servers
        // FUNC_				: 0x00000010,   // unused.
        // FUNC_				: 0x00000020,   // unused.
        FUNC_Net				: 0x00000040,   // Function is network-replicated.
        FUNC_NetReliable		: 0x00000080,   // Function should be sent reliably on the network.
        FUNC_NetRequest			: 0x00000100,	// Function is sent to a net service
        FUNC_Exec				: 0x00000200,	// Executable from command line.
        FUNC_Native				: 0x00000400,	// Native function.
        FUNC_Event				: 0x00000800,   // Event function.
        FUNC_NetResponse		: 0x00001000,   // Function response from a net service
        FUNC_Static				: 0x00002000,   // Static function.
        FUNC_NetMulticast		: 0x00004000,	// Function is networked multicast Server -> All Clients
        FUNC_UbergraphFunction	: 0x00008000,   // Function is used as the merge 'ubergraph' for a blueprint, only assigned when using the persistent 'ubergraph' frame
        FUNC_MulticastDelegate	: 0x00010000,	// Function is a multi-cast delegate signature (also requires FUNC_Delegate to be set!)
        FUNC_Public				: 0x00020000,	// Function is accessible in all classes (if overridden, parameters must remain unchanged).
        FUNC_Private			: 0x00040000,	// Function is accessible only in the class it is defined in (cannot be overridden, but function name may be reused in subclasses.  IOW: if overridden, parameters don't need to match, and Super.Func() cannot be accessed since it's private.)
        FUNC_Protected			: 0x00080000,	// Function is accessible only in the class it is defined in and subclasses (if overridden, parameters much remain unchanged).
        FUNC_Delegate			: 0x00100000,	// Function is delegate signature (either single-cast or multi-cast, depending on whether FUNC_MulticastDelegate is set.)
        FUNC_NetServer			: 0x00200000,	// Function is executed on servers (set by replication code if passes check)
        FUNC_HasOutParms		: 0x00400000,	// function has out (pass by reference) parameters
        FUNC_HasDefaults		: 0x00800000,	// function has structs that contain defaults
        FUNC_NetClient			: 0x01000000,	// function is executed on clients
        FUNC_DLLImport			: 0x02000000,	// function is imported from a DLL
        FUNC_BlueprintCallable	: 0x04000000,	// function can be called from blueprint code
        FUNC_BlueprintEvent		: 0x08000000,	// function can be overridden/implemented from a blueprint
        FUNC_BlueprintPure		: 0x10000000,	// function can be called from blueprint code, and is also pure (produces no side effects). If you set this, you should set FUNC_BlueprintCallable as well.
        FUNC_EditorOnly			: 0x20000000,	// function can only be called from an editor scrippt.
        FUNC_Const				: 0x40000000,	// function can be called from blueprint code, and only reads state (never writes state)
        FUNC_NetValidate		: 0x80000000,	// function must supply a _Validate implementation

        FUNC_AllFlags		: 0xFFFFFFFF,
    };
    Object.freeze(FunctionFlags);
    
    const PropertyFlags = {
        CPF_Net								: 0x0000000000000020,	///< Property is relevant to network replication.
        CPF_RepNotify						: 0x0000000100000000,	///< Notify actors when a property is replicated
    };
    
    const ELifetimeCondition = {
        "COND_InitialOnly" : 1					    ,   // This property will only attempt to send on the initial bunch
        "COND_OwnerOnly" : 2						,   // This property will only send to the actor's owner
        "COND_SkipOwner" : 3						,   // This property send to every connection EXCEPT the owner
        "COND_SimulatedOnly" : 4					,   // This property will only send to simulated actors
        "COND_AutonomousOnly" : 5					,   // This property will only send to autonomous actors
        "COND_SimulatedOrPhysics" : 6				,   // This property will send to simulated OR bRepPhysics actors
        "COND_InitialOrOwner" : 7					,   // This property will send on the initial packet, or to the actors owner
        "COND_Custom" : 8							,   // This property has no particular condition, but wants the ability to toggle on/off via SetCustomIsActiveOverride
        "COND_ReplayOrOwner" : 9					,   // This property will only send to the replay connection, or to the actors owner
        "COND_ReplayOnly" : 10					    ,   // This property will only send to the replay connection
        "COND_SimulatedOnlyNoReplay" : 11			,   // This property will send to actors only, but not to replay connections
        "COND_SimulatedOrPhysicsNoReplay" : 12	    ,   // This property will send to simulated Or bRepPhysics actors, but not to replay connections
        "COND_SkipReplay" : 13				    	,   // This property will not send to the replay connection
        "COND_Never" : 15							,   // This property will never be replicated						
    }
    Object.freeze(ELifetimeCondition);
    
    function dummyDecorator() {
        return () => {};
    }
    
    cache.rpc = {
        "FunctionFlags" : FunctionFlags,
        "PropertyFlags" : PropertyFlags,
        "ELifetimeCondition" : ELifetimeCondition,
        "flags" : dummyDecorator,
        "condition" : dummyDecorator
    }
    
    cache.edit_on_instance = dummyDecorator;
    
    cache.no_blueprint = dummyDecorator;
    
    cache.set_flags = dummyDecorator;
    
    cache.clear_flags = dummyDecorator;
    
    cache.FunctionFlags = FunctionFlags;
    
    puerts.toManualReleaseDelegate = (x) => x;
    
}(global));
