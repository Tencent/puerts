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
    
    const TNAMESPACE = 0;
    const TENUM = 1
    const TBLUEPRINT = 2;
    const TSTRUCT = 3
    
    function createNamespaceOrClass(path, parentDir, nodeType) {
        return new Proxy({__path: path, __parent:parentDir, __type:nodeType}, {
            get: function(node, name) {
                if (!(name in node)) {
                    if (name === '__parent' || name === '__path') return undefined;
                    
                    if (node.__type == TENUM) { // auto load
                        node[name] = createNamespaceOrClass(name, node, TNAMESPACE);
                        blueprint_load(node[name]);
                    } else {
                        let newNodeType = node.__type;
                        
                        if (newNodeType === TNAMESPACE) {
                            let path = `/${name}.${name}`
                            let c = node;
                            while (c && c.__path) {
                                path = `/${c.__path}${path}`
                                c = c.__parent;
                            }
                            const obj = UE.Object.Load(path);
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
                        
                        node[name] = createNamespaceOrClass(name, node, newNodeType);
                    }
                }
                return node[name];
            }
        });
    }
    
    cache["Game"] = createNamespaceOrClass("Game", undefined, TNAMESPACE);
    
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
        return [x];
    }

    function unref(r) {
        return r[0];
    }
    
    function setref(x, val) {
        x[0] = val;
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
    
    cache.FNameLiteral = global.__tgjsFNameToArrayBuffer;
    global.__tgjsFNameToArrayBuffer = undefined;
    
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
        console.warn('deprecated! use blueprint.tojs instead');
        let ufield = UE.Field.Load(path);
        if (ufield) {
            let jsclass = UEClassToJSClass(ufield);
            jsclass.__puerts_ufield = ufield;
            return jsclass;
        } else {
            throw new Error("can not load type in " + path);
        }
    }
    
    blueprint.tojs = UEClassToJSClass;
    
    let __tgjsMixin = global.__tgjsMixin;
    global.__tgjsMixin = undefined;
    
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
        let cls = __tgjsMixin(to.StaticClass(), mixinMethods, config.objectTakeByNative, config.inherit, config.noMixinedWarning);
        
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
        __tgjsMixin(to.StaticClass(), {}, undefined, undefined, undefined, true);
    }
    
    blueprint.unmixin = unmixin;
    
    function blueprint_load(cls) {
        if (cls.__path) {
            let c = cls
            let path = `.${c.__path}`
            c = c.__parent;
            while (c && c.__path) {
                path = `/${c.__path}${path}`
                c = c.__parent;
            }
            let ufield = UE.Field.Load(path);
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
            
        } else {
            throw new Error("argument #0 is not a unload type");
        }
    }
    
    blueprint.load = blueprint_load;
    
    function blueprint_unload(cls) {
        if (cls.__puerts_ufield) {
            delete cls.__puerts_ufield;
            if (cls.__parent) {
                cls.__parent[cls.__name] = createNamespaceOrClass(cls.__name, cls.__parent);
            }
        }
    }
    
    blueprint.unload = blueprint_unload;
    
    puerts.blueprint = blueprint;
    
    const newContainer = global.__tgjsNewContainer;
    global.__tgjsNewContainer = undefined;
    
    function translateType(t) {
        if (typeof t !== 'number') {
            if (t.hasOwnProperty('__puerts_ufield')) {
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

        return newContainer(0, t1);
    }
    
    function NewSet(t1) {
        t1 = translateType(t1);
        
        return newContainer(1, t1);
    }
    
    function NewMap(t1, t2) {
        t1 = translateType(t1);
        t2 = translateType(t2);
        
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
        FUNC_None                : 0x00000000,

        FUNC_Final                : 0x00000001,    // Function is final (prebindable, non-overridable function).
        FUNC_RequiredAPI            : 0x00000002,    // Indicates this function is DLL exported/imported.
        FUNC_BlueprintAuthorityOnly: 0x00000004,   // Function will only run if the object has network authority
        FUNC_BlueprintCosmetic    : 0x00000008,   // Function is cosmetic in nature and should not be invoked on dedicated servers
        // FUNC_                : 0x00000010,   // unused.
        // FUNC_                : 0x00000020,   // unused.
        FUNC_Net                : 0x00000040,   // Function is network-replicated.
        FUNC_NetReliable        : 0x00000080,   // Function should be sent reliably on the network.
        FUNC_NetRequest            : 0x00000100,    // Function is sent to a net service
        FUNC_Exec                : 0x00000200,    // Executable from command line.
        FUNC_Native                : 0x00000400,    // Native function.
        FUNC_Event                : 0x00000800,   // Event function.
        FUNC_NetResponse        : 0x00001000,   // Function response from a net service
        FUNC_Static                : 0x00002000,   // Static function.
        FUNC_NetMulticast        : 0x00004000,    // Function is networked multicast Server -> All Clients
        FUNC_UbergraphFunction    : 0x00008000,   // Function is used as the merge 'ubergraph' for a blueprint, only assigned when using the persistent 'ubergraph' frame
        FUNC_MulticastDelegate    : 0x00010000,    // Function is a multi-cast delegate signature (also requires FUNC_Delegate to be set!)
        FUNC_Public                : 0x00020000,    // Function is accessible in all classes (if overridden, parameters must remain unchanged).
        FUNC_Private            : 0x00040000,    // Function is accessible only in the class it is defined in (cannot be overridden, but function name may be reused in subclasses.  IOW: if overridden, parameters don't need to match, and Super.Func() cannot be accessed since it's private.)
        FUNC_Protected            : 0x00080000,    // Function is accessible only in the class it is defined in and subclasses (if overridden, parameters much remain unchanged).
        FUNC_Delegate            : 0x00100000,    // Function is delegate signature (either single-cast or multi-cast, depending on whether FUNC_MulticastDelegate is set.)
        FUNC_NetServer            : 0x00200000,    // Function is executed on servers (set by replication code if passes check)
        FUNC_HasOutParms        : 0x00400000,    // function has out (pass by reference) parameters
        FUNC_HasDefaults        : 0x00800000,    // function has structs that contain defaults
        FUNC_NetClient            : 0x01000000,    // function is executed on clients
        FUNC_DLLImport            : 0x02000000,    // function is imported from a DLL
        FUNC_BlueprintCallable    : 0x04000000,    // function can be called from blueprint code
        FUNC_BlueprintEvent        : 0x08000000,    // function can be overridden/implemented from a blueprint
        FUNC_BlueprintPure        : 0x10000000,    // function can be called from blueprint code, and is also pure (produces no side effects). If you set this, you should set FUNC_BlueprintCallable as well.
        FUNC_EditorOnly            : 0x20000000,    // function can only be called from an editor scrippt.
        FUNC_Const                : 0x40000000,    // function can be called from blueprint code, and only reads state (never writes state)
        FUNC_NetValidate        : 0x80000000,    // function must supply a _Validate implementation

        FUNC_AllFlags        : 0xFFFFFFFF,
    };
    Object.freeze(FunctionFlags);
   
    const FunctionExportFlags =
    {
        FUNCEXPORT_Final			:0x00000001,	// function declaration included "final" keyword.  Used to differentiate between functions that have FUNC_Final only because they're private
        //							=0x00000002,
        //							=0x00000004,
        FUNCEXPORT_RequiredAPI		:0x00000008,	// Function should be exported as a public API function
        FUNCEXPORT_Inline			:0x00000010,	// export as an inline static C++ function
        FUNCEXPORT_CppStatic		:0x00000020,	// Export as a real C++ static function, causing thunks to call via ClassName::FuncName instead of this->FuncName
        FUNCEXPORT_CustomThunk		:0x00000040,	// Export no thunk function; the user will manually define a custom one
        //							=0x00000080,
        //							=0x00000100,
    };
    Object.freeze(FunctionExportFlags)

    const ELifetimeCondition = {
        "COND_InitialOnly" : 1                        ,   // This property will only attempt to send on the initial bunch
        "COND_OwnerOnly" : 2                        ,   // This property will only send to the actor's owner
        "COND_SkipOwner" : 3                        ,   // This property send to every connection EXCEPT the owner
        "COND_SimulatedOnly" : 4                    ,   // This property will only send to simulated actors
        "COND_AutonomousOnly" : 5                    ,   // This property will only send to autonomous actors
        "COND_SimulatedOrPhysics" : 6                ,   // This property will send to simulated OR bRepPhysics actors
        "COND_InitialOrOwner" : 7                    ,   // This property will send on the initial packet, or to the actors owner
        "COND_Custom" : 8                            ,   // This property has no particular condition, but wants the ability to toggle on/off via SetCustomIsActiveOverride
        "COND_ReplayOrOwner" : 9                    ,   // This property will only send to the replay connection, or to the actors owner
        "COND_ReplayOnly" : 10                        ,   // This property will only send to the replay connection
        "COND_SimulatedOnlyNoReplay" : 11            ,   // This property will send to actors only, but not to replay connections
        "COND_SimulatedOrPhysicsNoReplay" : 12        ,   // This property will send to simulated Or bRepPhysics actors, but not to replay connections
        "COND_SkipReplay" : 13                        ,   // This property will not send to the replay connection
        "COND_Never" : 15                            ,   // This property will never be replicated                        
    }
    Object.freeze(ELifetimeCondition);

    const ClassFlags = {
        CLASS_None: 0x00000000,
        /** Class is abstract and can't be instantiated directly. */
        CLASS_Abstract: 0x00000001,
        /** Save object configuration only to Default INIs, never to local INIs. Must be combined with CLASS_Config */
        CLASS_DefaultConfig: 0x00000002,
        /** Load object configuration at construction time. */
        CLASS_Config: 0x00000004,
        /** This object type can't be saved; null it out at save time. */
        CLASS_Transient: 0x00000008,
        /** Successfully parsed. */
        CLASS_Parsed: 0x00000010,
        /** */
        CLASS_MatchedSerializers: 0x00000020,
        /** Indicates that the config settings for this class will be saved to Project/User*.ini (similar to CLASS_GlobalUserConfig) */
        CLASS_ProjectUserConfig: 0x00000040,
        /** Class is a native class - native interfaces will have CLASS_Native set, but not RF_MarkAsNative */
        CLASS_Native: 0x00000080,
        /** Don't export to C++ header. */
        CLASS_NoExport: 0x00000100,
        /** Do not allow users to create in the editor. */
        CLASS_NotPlaceable: 0x00000200,
        /** Handle object configuration on a per-object basis, rather than per-class. */
        CLASS_PerObjectConfig: 0x00000400,
        
        /** Whether SetUpRuntimeReplicationData still needs to be called for this class */
        CLASS_ReplicationDataIsSetUp: 0x00000800,
        
        /** Class can be constructed from editinline New button. */
        CLASS_EditInlineNew: 0x00001000,
        /** Display properties in the editor without using categories. */
        CLASS_CollapseCategories: 0x00002000,
        /** Class is an interface **/
        CLASS_Interface: 0x00004000,
        /**  Do not export a constructor for this class, assuming it is in the cpptext **/
        CLASS_CustomConstructor: 0x00008000,
        /** all properties and functions in this class are const and should be exported as const */
        CLASS_Const: 0x00010000,

        /** Class flag indicating the class is having its layout changed, and therefore is not ready for a CDO to be created */
        CLASS_LayoutChanging: 0x00020000,
        
        /** Indicates that the class was created from blueprint source material */
        CLASS_CompiledFromBlueprint: 0x00040000,

        /** Indicates that only the bare minimum bits of this class should be DLL exported/imported */
        CLASS_MinimalAPI: 0x00080000,
        
        /** Indicates this class must be DLL exported/imported (along with all of it's members) */
        CLASS_RequiredAPI: 0x00100000,

        /** Indicates that references to this class default to instanced. Used to be subclasses of UComponent, but now can be any UObject */
        CLASS_DefaultToInstanced: 0x00200000,

        /** Indicates that the parent token stream has been merged with ours. */
        CLASS_TokenStreamAssembled: 0x00400000,
        /** Class has component properties. */
        CLASS_HasInstancedReference: 0x00800000,
        /** Don't show this class in the editor class browser or edit inline new menus. */
        CLASS_Hidden: 0x01000000,
        /** Don't save objects of this class when serializing */
        CLASS_Deprecated: 0x02000000,
        /** Class not shown in editor drop down for class selection */
        CLASS_HideDropDown: 0x04000000,
        /** Class settings are saved to <AppData>/..../Blah.ini (as opposed to CLASS_DefaultConfig) */
        CLASS_GlobalUserConfig: 0x08000000,
        /** Class was declared directly in C++ and has no boilerplate generated by UnrealHeaderTool */
        CLASS_Intrinsic    : 0x10000000,
        /** Class has already been constructed (maybe in a previous DLL version before hot-reload). */
        CLASS_Constructed: 0x20000000,
        /** Indicates that object configuration will not check against ini base/defaults when serialized */
        CLASS_ConfigDoNotCheckDefaults: 0x40000000,
        /** Class has been consigned to oblivion as part of a blueprint recompile, and a newer version currently exists. */
        CLASS_NewerVersionExists: 0x80000000,
    }

    const PropertyFlags =
    {
        CPF_None : 0,

        CPF_Edit							: 0x0000000000000001,	///< Property is user-settable in the editor.
        CPF_ConstParm						: 0x0000000000000002,	///< This is a constant function parameter
        CPF_BlueprintVisible				: 0x0000000000000004,	///< This property can be read by blueprint code
        CPF_ExportObject					: 0x0000000000000008,	///< Object can be exported with actor.
        CPF_BlueprintReadOnly				: 0x0000000000000010,	///< This property cannot be modified by blueprint code
        CPF_Net								: 0x0000000000000020,	///< Property is relevant to network replication.
        CPF_EditFixedSize					: 0x0000000000000040,	///< Indicates that elements of an array can be modified, but its size cannot be changed.
        CPF_Parm							: 0x0000000000000080,	///< Function/When call parameter.
        CPF_OutParm							: 0x0000000000000100,	///< Value is copied out after function call.
        CPF_ZeroConstructor					: 0x0000000000000200,	///< memset is fine for construction
        CPF_ReturnParm						: 0x0000000000000400,	///< Return value.
        CPF_DisableEditOnTemplate			: 0x0000000000000800,	///< Disable editing of this property on an archetype/sub-blueprint
        //CPF_      						: 0x0000000000001000,	///< 
        CPF_Transient   					: 0x0000000000002000,	///< Property is transient: shouldn't be saved or loaded, except for Blueprint CDOs.
        CPF_Config      					: 0x0000000000004000,	///< Property should be loaded/saved as permanent profile.
        //CPF_								: 0x0000000000008000,	///< 
        CPF_DisableEditOnInstance			: 0x0000000000010000,	///< Disable editing on an instance of this class
        CPF_EditConst   					: 0x0000000000020000,	///< Property is uneditable in the editor.
        CPF_GlobalConfig					: 0x0000000000040000,	///< Load config from base class, not subclass.
        CPF_InstancedReference				: 0x0000000000080000,	///< Property is a component references.
        //CPF_								: 0x0000000000100000,	///<
        CPF_DuplicateTransient				: 0x0000000000200000,	///< Property should always be reset to the default value during any type of duplication (copy/paste, binary duplication, etc.)
        //CPF_								: 0x0000000000400000,	///< 
        //CPF_    							: 0x0000000000800000,	///< 
        CPF_SaveGame						: 0x0000000001000000,	///< Property should be serialized for save games, this is only checked for game-specific archives with ArIsSaveGame
        CPF_NoClear							: 0x0000000002000000,	///< Hide clear (and browse) button.
        //CPF_  							: 0x0000000004000000,	///<
        CPF_ReferenceParm					: 0x0000000008000000,	///< Value is passed by reference; CPF_OutParam and CPF_Param should also be set.
        CPF_BlueprintAssignable				: 0x0000000010000000,	///< MC Delegates only.  Property should be exposed for assigning in blueprint code
        CPF_Deprecated  					: 0x0000000020000000,	///< Property is deprecated.  Read it from an archive, but don't save it.
        CPF_IsPlainOldData					: 0x0000000040000000,	///< If this is set, then the property can be memcopied instead of CopyCompleteValue / CopySingleValue
        CPF_RepSkip							: 0x0000000080000000,	///< Not replicated. For non replicated properties in replicated structs 
        CPF_RepNotify						: 0x0000000100000000,	///< Notify actors when a property is replicated
        CPF_Interp							: 0x0000000200000000,	///< interpolatable property for use with matinee
        CPF_NonTransactional				: 0x0000000400000000,	///< Property isn't transacted
        CPF_EditorOnly						: 0x0000000800000000,	///< Property should only be loaded in the editor
        CPF_NoDestructor					: 0x0000001000000000,	///< No destructor
        //CPF_								: 0x0000002000000000,	///<
        CPF_AutoWeak						: 0x0000004000000000,	///< Only used for weak pointers, means the export type is autoweak
        CPF_ContainsInstancedReference		: 0x0000008000000000,	///< Property contains component references.
        CPF_AssetRegistrySearchable			: 0x0000010000000000,	///< asset instances will add properties with this flag to the asset registry automatically
        CPF_SimpleDisplay					: 0x0000020000000000,	///< The property is visible by default in the editor details view
        CPF_AdvancedDisplay					: 0x0000040000000000,	///< The property is advanced and not visible by default in the editor details view
        CPF_Protected						: 0x0000080000000000,	///< property is protected from the perspective of script
        CPF_BlueprintCallable				: 0x0000100000000000,	///< MC Delegates only.  Property should be exposed for calling in blueprint code
        CPF_BlueprintAuthorityOnly			: 0x0000200000000000,	///< MC Delegates only.  This delegate accepts (only in blueprint) only events with BlueprintAuthorityOnly.
        CPF_TextExportTransient				: 0x0000400000000000,	///< Property shouldn't be exported to text format (e.g. copy/paste)
        CPF_NonPIEDuplicateTransient		: 0x0000800000000000,	///< Property should only be copied in PIE
        CPF_ExposeOnSpawn					: 0x0001000000000000,	///< Property is exposed on spawn
        CPF_PersistentInstance				: 0x0002000000000000,	///< A object referenced by the property is duplicated like a component. (Each actor should have an own instance.)
        CPF_UObjectWrapper					: 0x0004000000000000,	///< Property was parsed as a wrapper class like TSubclassOf<T>, FScriptInterface etc., rather than a USomething*
        CPF_HasGetValueTypeHash				: 0x0008000000000000,	///< This property can generate a meaningful hash value.
        CPF_NativeAccessSpecifierPublic		: 0x0010000000000000,	///< Public native access specifier
        CPF_NativeAccessSpecifierProtected	: 0x0020000000000000,	///< Protected native access specifier
        CPF_NativeAccessSpecifierPrivate	: 0x0040000000000000,	///< Private native access specifier
        CPF_SkipSerialization				: 0x0080000000000000,	///< Property shouldn't be serialized, can still be exported to text
    }

    
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
    
    const MetaDataInst = '';
    
    cache.uclass = {
        //  the class specifier
        "ClassGroup": MetaDataInst,
        "Within": MetaDataInst,
        "BlueprintType": MetaDataInst,
        "NotBlueprintType": MetaDataInst,
        "Blueprintable": MetaDataInst,
        "NotBlueprintable": MetaDataInst,
        "MinimalAPI": MetaDataInst,
        "customConstructor": MetaDataInst,
        "Intrinsic": MetaDataInst,
        "noexport": MetaDataInst,
        "placeable": MetaDataInst,
        "notplaceable": MetaDataInst,
        "DefaultToInstanced": MetaDataInst,
        "Const": MetaDataInst,
        "Abstract": MetaDataInst,
        "deprecated": MetaDataInst,
        "Transient": MetaDataInst,
        "nonTransient": MetaDataInst,
        "config": MetaDataInst,
        "perObjectConfig": MetaDataInst,
        "configdonotcheckdefaults": MetaDataInst,
        "defaultconfig": MetaDataInst,
        "editinlinenew": MetaDataInst,
        "noteditinlinenew": MetaDataInst,
        "hidedropdown": MetaDataInst,
        "showCategories": MetaDataInst,
        "hideCategories": MetaDataInst,
        "ComponentWrapperClass": MetaDataInst,
        "showFunctions": MetaDataInst,
        "hideFunctions": MetaDataInst,
        "autoExpandCategories": MetaDataInst,
        "autoCollapseCategories": MetaDataInst,
        "dontAutoCollapseCategories": MetaDataInst,
        "collapseCategories": MetaDataInst,
        "dontCollapseCategories": MetaDataInst,
        "AdvancedClassDisplay": MetaDataInst,
        "ConversionRoot": MetaDataInst,
        "Experimental": MetaDataInst,
        "EarlyAccessPreview": MetaDataInst,
        "SparseClassDataType": MetaDataInst,
        "CustomThunkTemplates": MetaDataInst,
        //  decorator to add class specifier
        "uclass": dummyDecorator,
        //  metadata of class
        "ToolTip": MetaDataInst,
        "ShortTooltip": MetaDataInst,
        "DocumentationPolicy": MetaDataInst,
        "BlueprintSpawnableComponent": MetaDataInst,
        "ChildCanTick": MetaDataInst,
        "ChildCannotTick": MetaDataInst,
        "IgnoreCategoryKeywordsInSubclasses": MetaDataInst,
        "DeprecatedNode": MetaDataInst,
        "DeprecationMessage": MetaDataInst,
        "DisplayName": MetaDataInst,
        "ScriptName": MetaDataInst,
        "IsBlueprintBase": MetaDataInst,
        "KismetHideOverrides": MetaDataInst,
        "ProhibitedInterfaces": MetaDataInst,
        "RestrictedToClasses": MetaDataInst,
        "ShowWorldContextPin": MetaDataInst,
        "DontUseGenericSpawnObject": MetaDataInst,
        "ExposedAsyncProxy": MetaDataInst,
        "BlueprintThreadSafe": MetaDataInst,
        "UsesHierarchy": MetaDataInst,
        //  decorator to add class metadata
        "umeta": dummyDecorator
    }

    cache.ufunction = {
        //  the function specifier
        "BlueprintImplementableEvent": MetaDataInst,
        "BlueprintNativeEvent": MetaDataInst,
        "SealedEvent": MetaDataInst,
        "Exec": MetaDataInst,
        "Server": MetaDataInst,
        "Client": MetaDataInst,
        "NetMulticast": MetaDataInst,
        "Reliable": MetaDataInst,
        "Unreliable": MetaDataInst,
        "BlueprintPure": MetaDataInst,
        "BlueprintCallable": MetaDataInst,
        "BlueprintGetter": MetaDataInst,
        "BlueprintSetter": MetaDataInst,
        "BlueprintAuthorityOnly": MetaDataInst,
        "BlueprintCosmetic": MetaDataInst,
        "BlueprintInternalUseOnly": MetaDataInst,
        "CallInEditor": MetaDataInst,
        "CustomThunk": MetaDataInst,
        "Category": MetaDataInst,
        "WithValidation": MetaDataInst,
        "ServiceRequest": MetaDataInst,
        "ServiceResponse": MetaDataInst,
        "Variadic": MetaDataInst,
        "ReturnDisplayName": MetaDataInst,
        "InternalUseParam": MetaDataInst,
        //  decorator to add function specifier
        "ufunction": dummyDecorator,
        //  type of metadata specifier
        "ToolTip": MetaDataInst,
        "ShortTooltip": MetaDataInst,
        "DocumentationPolicy": MetaDataInst,
        "AdvancedDisplay": MetaDataInst,
        "ArrayParm": MetaDataInst,
        "ArrayTypeDependentParams": MetaDataInst,
        "AutoCreateRefTerm": MetaDataInst,
        "BlueprintProtected": MetaDataInst,
        "CallableWithoutWorldContext": MetaDataInst,
        "CommutativeAssociativeBinaryOperator": MetaDataInst,
        "CompactNodeTitle": MetaDataInst,
        "CustomStructureParam": MetaDataInst,
        "DefaultToSelf": MetaDataInst,
        "DeprecatedFunction": MetaDataInst,
        "DeprecationMessage": MetaDataInst, //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the function section)
        "ExpandEnumAsExecs": MetaDataInst,
        "ExpandBoolAsExecs": MetaDataInst,
        "DisplayName": MetaDataInst, //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the function section)
        "ScriptName": MetaDataInst, // (Commented out so as to avoid duplicate name with version in the Class section, but still show in the function section)
        "ScriptNoExport": MetaDataInst, //, (Commented out so as to avoid duplicate name with version in the Property section, but still show in the function section)
        "ScriptMethod": MetaDataInst,
        "ScriptMethodSelfReturn": MetaDataInst,
        "ScriptOperator": MetaDataInst,
        "ScriptConstant": MetaDataInst,
        "ScriptConstantHost": MetaDataInst,
        "HidePin": MetaDataInst,
        "HideSpawnParms": MetaDataInst,
        "Keywords": MetaDataInst,
        "Latent": MetaDataInst,
        "LatentInfo": MetaDataInst,
        "MaterialParameterCollectionFunction": MetaDataInst,
        "NativeBreakFunc": MetaDataInst,
        "NativeMakeFunc": MetaDataInst,
        "UnsafeDuringActorConstruction": MetaDataInst,
        "WorldContext": MetaDataInst,
        "BlueprintAutocast": MetaDataInst,
        "NotBlueprintThreadSafe": MetaDataInst,
        "DeterminesOutputType": MetaDataInst,
        "DynamicOutputParam": MetaDataInst,
        "DataTablePin": MetaDataInst,
        "SetParam": MetaDataInst,
        "MapParam": MetaDataInst,
        "MapKeyParam": MetaDataInst,
        "MapValueParam": MetaDataInst,
        "AnimBlueprintFunction": MetaDataInst,
        "ArrayParam": MetaDataInst,
        //  decorator to add function metadata
        "umeta": dummyDecorator
    }

    cache.uproperty = {
        //  the specifiers
        "Const": MetaDataInst,
        "Config": MetaDataInst,
        "GlobalConfig": MetaDataInst,
        "Localized": MetaDataInst,
        "Transient": MetaDataInst,
        "DuplicateTransient": MetaDataInst,
        "NonPIETransient": MetaDataInst,
        "NonPIEDuplicateTransient": MetaDataInst,
        "Export": MetaDataInst,
        "NoClear": MetaDataInst,
        "EditFixedSize": MetaDataInst,
        "Replicated": MetaDataInst,
        "ReplicatedUsing": MetaDataInst,
        "NotReplicated": MetaDataInst,
        "Interp": MetaDataInst,
        "NonTransactional": MetaDataInst,
        "Instanced": MetaDataInst,
        "BlueprintAssignable": MetaDataInst,
        "Category": MetaDataInst,
        "SimpleDisplay": MetaDataInst,
        "AdvancedDisplay": MetaDataInst,
        "EditAnywhere": MetaDataInst,
        "EditInstanceOnly": MetaDataInst,
        "EditDefaultsOnly": MetaDataInst,
        "VisibleAnywhere": MetaDataInst,
        "VisibleInstanceOnly": MetaDataInst,
        "VisibleDefaultsOnly": MetaDataInst,
        "BlueprintReadOnly": MetaDataInst,
        "BlueprintGetter": MetaDataInst,
        "BlueprintReadWrite": MetaDataInst,
        "BlueprintSetter": MetaDataInst,
        "AssetRegistrySearchable": MetaDataInst,
        "SaveGame": MetaDataInst,
        "BlueprintCallable": MetaDataInst,
        "BlueprintAuthorityOnly": MetaDataInst,
        "TextExportTransient": MetaDataInst,
        "SkipSerialization": MetaDataInst,
        "HideSelfPin": MetaDataInst,
        //  decorator
        "uproperty": dummyDecorator,
        //  specifier
        "ToolTip":  MetaDataInst,
        "ShortTooltip": MetaDataInst,
        "DocumentationPolicy": MetaDataInst,
        "AllowAbstract": MetaDataInst, 
        "AllowAnyActor": MetaDataInst,
        "AllowedClasses": MetaDataInst,
        "AllowPreserveRatio": MetaDataInst,
        "AllowPrivateAccess": MetaDataInst,
        "ArrayClamp": MetaDataInst,
        "AssetBundles": MetaDataInst,
        "BlueprintBaseOnly": MetaDataInst,
        "BlueprintCompilerGeneratedDefaults": MetaDataInst,
        "ClampMin": MetaDataInst,
        "ClampMax": MetaDataInst,
        "ConfigHierarchyEditable": MetaDataInst,
        "ContentDir": MetaDataInst,
        "DeprecatedProperty": MetaDataInst,
        "DeprecationMessage": MetaDataInst, //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the property section)
        "DisplayName": MetaDataInst, // (Commented out so as to avoid duplicate name with version in the Class section, but still show in the property section)
        "ScriptName": MetaDataInst, //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the property section)
        "DisallowedClasses": MetaDataInst,
        "DisplayAfter": MetaDataInst,
        "DisplayPriority": MetaDataInst,
        "DisplayThumbnail": MetaDataInst,
        "EditCondition": MetaDataInst,
        "EditFixedOrder": MetaDataInst,
        "ExactClass": MetaDataInst,
        "ExposeFunctionCategories": MetaDataInst,
        "ExposeOnSpawn": MetaDataInst,
        "FilePathFilter": MetaDataInst,
        "RelativeToGameDir": MetaDataInst,
        "ForceShowEngineContent": MetaDataInst,
        "ForceShowPluginContent": MetaDataInst,
        "HideAlphaChannel": MetaDataInst,
        "HideInDetailPanel": MetaDataInst,
        "HideViewOptions": MetaDataInst,
        "IgnoreForMemberInitializationTest": MetaDataInst,
        "InlineEditConditionToggle": MetaDataInst,
        "LongPackageName": MetaDataInst,
        "MakeEditWidget": MetaDataInst,
        "MakeStructureDefaultValue": MetaDataInst,
        "MetaClass": MetaDataInst,
        "MustImplement": MetaDataInst,
        "Multiple": MetaDataInst,
        "MultiLine": MetaDataInst,
        "PasswordField": MetaDataInst,
        "NoElementDuplicate": MetaDataInst,
        "NoResetToDefault": MetaDataInst,
        "NoSpinbox": MetaDataInst,
        "OnlyPlaceable": MetaDataInst,
        "RelativePath": MetaDataInst,
        "RelativeToGameContentDir": MetaDataInst,
        "ScriptNoExport": MetaDataInst,
        "ShowOnlyInnerProperties": MetaDataInst,
        "ShowTreeView": MetaDataInst,
        "SliderExponent": MetaDataInst,
        "TitleProperty": MetaDataInst,
        "UIMin": MetaDataInst,
        "UIMax": MetaDataInst,
        "Untracked": MetaDataInst,
        "DevelopmentOnly": MetaDataInst,
        "NeedsLatentFixup": MetaDataInst,
        "LatentCallbackTarget": MetaDataInst,
        "GetOptions": MetaDataInst,    
        "Bitmask": MetaDataInst,
        "BitmaskEnum": MetaDataInst,
        //  decorator
        "umeta": dummyDecorator,
        "attach": dummyDecorator
    }

    cache.uparam =
    {
        //  the specifiers
        "Const": MetaDataInst,
        "Ref": MetaDataInst,
        "NotReplicated": MetaDataInst,
        "DisplayName": MetaDataInst,
        //  decorator
        "uparam": dummyDecorator,
        //  specifier
        "ToolTip":  MetaDataInst,
        "ShortTooltip": MetaDataInst,
        "DocumentationPolicy": MetaDataInst,
        "AllowAbstract": MetaDataInst, 
        "AllowAnyActor": MetaDataInst,
        "AllowedClasses": MetaDataInst,
        "AllowPreserveRatio": MetaDataInst,
        "AllowPrivateAccess": MetaDataInst,
        "ArrayClamp": MetaDataInst,
        "AssetBundles": MetaDataInst,
        "BlueprintBaseOnly": MetaDataInst,
        "BlueprintCompilerGeneratedDefaults": MetaDataInst,
        "ClampMin": MetaDataInst,
        "ClampMax": MetaDataInst,
        "ConfigHierarchyEditable": MetaDataInst,
        "ContentDir": MetaDataInst,
        "DeprecatedProperty": MetaDataInst,
        "DeprecationMessage": MetaDataInst, //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the property section)
        "ScriptName": MetaDataInst, //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the property section)
        "DisallowedClasses": MetaDataInst,
        "DisplayAfter": MetaDataInst,
        "DisplayPriority": MetaDataInst,
        "DisplayThumbnail": MetaDataInst,
        "EditCondition": MetaDataInst,
        "EditFixedOrder": MetaDataInst,
        "ExactClass": MetaDataInst,
        "ExposeFunctionCategories": MetaDataInst,
        "ExposeOnSpawn": MetaDataInst,
        "FilePathFilter": MetaDataInst,
        "RelativeToGameDir": MetaDataInst,
        "ForceShowEngineContent": MetaDataInst,
        "ForceShowPluginContent": MetaDataInst,
        "HideAlphaChannel": MetaDataInst,
        "HideInDetailPanel": MetaDataInst,
        "HideViewOptions": MetaDataInst,
        "IgnoreForMemberInitializationTest": MetaDataInst,
        "InlineEditConditionToggle": MetaDataInst,
        "LongPackageName": MetaDataInst,
        "MakeEditWidget": MetaDataInst,
        "MakeStructureDefaultValue": MetaDataInst,
        "MetaClass": MetaDataInst,
        "MustImplement": MetaDataInst,
        "Multiple": MetaDataInst,
        "MultiLine": MetaDataInst,
        "PasswordField": MetaDataInst,
        "NoElementDuplicate": MetaDataInst,
        "NoResetToDefault": MetaDataInst,
        "NoSpinbox": MetaDataInst,
        "OnlyPlaceable": MetaDataInst,
        "RelativePath": MetaDataInst,
        "RelativeToGameContentDir": MetaDataInst,
        "ScriptNoExport": MetaDataInst,
        "ShowOnlyInnerProperties": MetaDataInst,
        "ShowTreeView": MetaDataInst,
        "SliderExponent": MetaDataInst,
        "TitleProperty": MetaDataInst,
        "UIMin": MetaDataInst,
        "UIMax": MetaDataInst,
        "Untracked": MetaDataInst,
        "DevelopmentOnly": MetaDataInst,
        "NeedsLatentFixup": MetaDataInst,
        "LatentCallbackTarget": MetaDataInst,
        "GetOptions": MetaDataInst,    
        "Bitmask": MetaDataInst,
        "BitmaskEnum": MetaDataInst,
        //  decorator
        "umeta": dummyDecorator,
    }

    cache.edit_on_instance = dummyDecorator;
    
    cache.no_blueprint = dummyDecorator;
    
    cache.set_flags = dummyDecorator;
    
    cache.clear_flags = dummyDecorator;
    
    cache.FunctionFlags = FunctionFlags;

    cache.ClassFlags = ClassFlags;

    cache.PropertyFlags = PropertyFlags;

    cache.FunctionExportFlags = FunctionExportFlags;

    puerts.toManualReleaseDelegate = (x) => x;
    puerts.toDelegate = (o,k) => [o, k];

    function mergePrototype(from, to, exclude) {
        Object.getOwnPropertyNames(from).forEach(name => {
            if (!(name in exclude)) {
                Object.defineProperty(
                    to,
                    name,
                    Object.getOwnPropertyDescriptor(from, name) ||
                    Object.create(null)
                );
            }
        });
    }
    puerts.__mergePrototype = mergePrototype
    
}(global));
