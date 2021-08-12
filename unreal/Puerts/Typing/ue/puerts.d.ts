/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

declare module "ue" {
    type ArgumentTypes<T> = T extends (... args: infer U ) => infer R ? U: never;

    interface $CallbackID {}
    
    interface $Delegate<T extends (...args: any) => any> {
        Bind(fn : T): void;
        Bind(target: Object, methodName: string): void;
        Unbind(): void;
        IsBound(): boolean;
        Execute(...a: ArgumentTypes<T>) : ReturnType<T>;
    }

    interface $MulticastDelegate<T extends (...args: any) => any> {
        Add(fn : T): void;
        Add(target: Object, methodName: string): void;
        Remove(fn : T): void;
        Broadcast(...a: ArgumentTypes<T>) : ReturnType<T>;
        Clear(): void;
    }
    
    class FixSizeArray<T> {
        Num(): number;
        Get(Index: number): T;
        Set(Index: number, Value: T): void;
    }
    
    class TArray<T> {
        Num(): number;
        Add(Value: T): void;
        Get(Index: number): T;
        Set(Index: number, Value: T): void;
        Contains(Value: T): boolean;
        FindIndex(Value: T): number;
        RemoveAt(Index: number): void;
        IsValidIndex(Index: number): boolean;
        Empty(): void;
    }
    
    class TSet<T> {
        Num(): number;
        Add(Value: T): void;
        Get(Index: number): T;  // TODO - 这个接口要用Index吗？
        // Set(Index: number, Value: T): void;
        Contains(Value: T): boolean;
        FindIndex(Value: T): number;
        RemoveAt(Index: number): void;
        GetMaxIndex(): number;  // TODO - GetMaxIndex的返回值是InvalidIndex，合理吗？（GetMaxIndex的解释应该是：最大合法index+1），当调用Empty，返回值为0
        IsValidIndex(Index: number): boolean;
        Empty(): void;
    }
    
    class TMap<TKey, TValue> {
        Num(): number;
        Add(Key: TKey, Value: TValue): void;
        Get(Key: TKey): TValue | undefined;
        Set(Key: TKey, Value: TValue): void;    // 即Add()。TODO - 有存在的必要吗？
        Remove(Key: TKey): void;
        GetMaxIndex(): number;                  // TODO - 接口注释要说明返回的是kv的索引。只有调用了Empty后才会返回0
        IsValidIndex(Index: number): boolean;
        GetKey(Index: number): TKey;            // TODO - 对于非法index，是否应该返回undefined
        Empty(): void;
    }

        
    type BuiltinBool = 0;
    type BuiltinByte = 1;
    type BuiltinInt = 2;
    type BuiltinFloat = 3;
    type BuiltinInt64 = 4;
    type BuiltinString = 5;
    type BuiltinText = 6;
    type BuiltinName = 7;

    const BuiltinBool = 0;
    const BuiltinByte = 1;
    const BuiltinInt = 2;
    const BuiltinFloat = 3;
    const BuiltinInt64 = 4;
    const BuiltinString = 5;
    const BuiltinText = 6;
    const BuiltinName = 7;

    type ContainerKVType<T> = 
        T extends BuiltinBool ? boolean : 
        T extends BuiltinByte | BuiltinInt | BuiltinFloat ? number :
        T extends BuiltinInt64 ? bigint :
        T extends BuiltinString | BuiltinText | BuiltinName ? string :
        T extends {new (...args:any[]): infer R} ? R :
        never;

    type SupportedContainerKVType = BuiltinBool | BuiltinByte | BuiltinInt | BuiltinFloat | BuiltinInt64 | BuiltinString | BuiltinText | BuiltinName | {StaticClass(): Class}

    function NewArray<T extends SupportedContainerKVType>(t: T): TArray<ContainerKVType<T>>;
    function NewSet<T extends SupportedContainerKVType>(t: T): TSet<ContainerKVType<T>>;
    function NewMap<TKey extends SupportedContainerKVType, TValue extends SupportedContainerKVType>(k: TKey, v: TValue): TMap<ContainerKVType<TKey>, ContainerKVType<TValue>>;
    
    type DataPropertyNames<T> = {
        [K in keyof T]: T[K] extends (...args: any) => any ? never : K;
    }[keyof T];

    type DataPropertiesOnly<T> = {
        [P in DataPropertyNames<T>]: T[P] extends object ? DataPropertiesOnly<T[P]> : T[P]
    };

    function NewObject(Cls: Class, Outer?: Object, Name?:string, ObjectFlags?: number): Object;
    
    function NewStruct(St: ScriptStruct): object;
    
    type TWeakObjectPtr<T> = {
        [K in keyof T]: T[K];
    }

    type TSoftObjectPtr<T> = {
        [K in keyof T]: T[K];
    }

    type TLazyObjectPtr<T> = {
        [K in keyof T]: T[K];
    }
    
    type TSubclassOf<T> = {
        [K in keyof T]: T[K];
    }

    type TSoftClassPtr<T> = {
        [K in keyof T]: T[K];
    }

    class UInt64Ptr { }

    class FloatPtr { }

    class DoublePtr { }

    class Int64Ptr { }

    class UInt32Ptr { }

    class Int32Ptr { }

    class CharPtr { }

    class ShortPtr { }

    class BoolPtr { }

    class StringPtr { }


    namespace rpc {
        export enum FunctionFlags {
            FUNC_Net				= 0x00000040,   // Function is network-replicated.
            FUNC_NetReliable		= 0x00000080,   // Function should be sent reliably on the network.
            FUNC_NetMulticast		= 0x00004000,	// Function is networked multicast Server -> All Clients
            FUNC_NetServer			= 0x00200000,	// Function is executed on servers (set by replication code if passes check)
            FUNC_NetClient			= 0x01000000,	// function is executed on clients
        }
        

        export enum PropertyFlags {
            CPF_Net				    = 0x0000000000000020,  ///< Property is relevant to network replication.
            CPF_RepNotify		    = 0x0000000100000000,  ///< Notify actors when a property is replicated
        }
        
        export enum ELifetimeCondition {
            COND_InitialOnly = 1					,   // This property will only attempt to send on the initial bunch
            COND_OwnerOnly = 2						,   // This property will only send to the actor's owner
            COND_SkipOwner = 3						,   // This property send to every connection EXCEPT the owner
            COND_SimulatedOnly = 4					,   // This property will only send to simulated actors
            COND_AutonomousOnly = 5					,   // This property will only send to autonomous actors
            COND_SimulatedOrPhysics = 6				,   // This property will send to simulated OR bRepPhysics actors
            COND_InitialOrOwner = 7					,   // This property will send on the initial packet, or to the actors owner
            COND_Custom = 8							,   // This property has no particular condition, but wants the ability to toggle on/off via SetCustomIsActiveOverride
            COND_ReplayOrOwner = 9					,   // This property will only send to the replay connection, or to the actors owner
            COND_ReplayOnly = 10					,   // This property will only send to the replay connection
            COND_SimulatedOnlyNoReplay = 11			,   // This property will send to actors only, but not to replay connections
            COND_SimulatedOrPhysicsNoReplay = 12	,   // This property will send to simulated Or bRepPhysics actors, but not to replay connections
            COND_SkipReplay = 13					,   // This property will not send to the replay connection
            COND_Never = 15							,   // This property will never be replicated						
        }
    
        export function flags(f: FunctionFlags | PropertyFlags): any;
    
        export function condition(f: ELifetimeCondition) : (target: Object, propertyKey: string) => void;
    }
    
    function edit_on_instance(): any;
    
    function no_blueprint(): any;
    
    enum FunctionFlags {
        FUNC_None				= 0x00000000,

        FUNC_Final				= 0x00000001,	// Function is final (prebindable, non-overridable function).
        FUNC_RequiredAPI			= 0x00000002,	// Indicates this function is DLL exported/imported.
        FUNC_BlueprintAuthorityOnly= 0x00000004,   // Function will only run if the object has network authority
        FUNC_BlueprintCosmetic	= 0x00000008,   // Function is cosmetic in nature and should not be invoked on dedicated servers
        // FUNC_				= 0x00000010,   // unused.
        // FUNC_				= 0x00000020,   // unused.
        FUNC_Net				= 0x00000040,   // Function is network-replicated.
        FUNC_NetReliable		= 0x00000080,   // Function should be sent reliably on the network.
        FUNC_NetRequest			= 0x00000100,	// Function is sent to a net service
        FUNC_Exec				= 0x00000200,	// Executable from command line.
        FUNC_Native				= 0x00000400,	// Native function.
        FUNC_Event				= 0x00000800,   // Event function.
        FUNC_NetResponse		= 0x00001000,   // Function response from a net service
        FUNC_Static				= 0x00002000,   // Static function.
        FUNC_NetMulticast		= 0x00004000,	// Function is networked multicast Server -> All Clients
        FUNC_UbergraphFunction	= 0x00008000,   // Function is used as the merge 'ubergraph' for a blueprint, only assigned when using the persistent 'ubergraph' frame
        FUNC_MulticastDelegate	= 0x00010000,	// Function is a multi-cast delegate signature (also requires FUNC_Delegate to be set!)
        FUNC_Public				= 0x00020000,	// Function is accessible in all classes (if overridden, parameters must remain unchanged).
        FUNC_Private			= 0x00040000,	// Function is accessible only in the class it is defined in (cannot be overridden, but function name may be reused in subclasses.  IOW: if overridden, parameters don't need to match, and Super.Func() cannot be accessed since it's private.)
        FUNC_Protected			= 0x00080000,	// Function is accessible only in the class it is defined in and subclasses (if overridden, parameters much remain unchanged).
        FUNC_Delegate			= 0x00100000,	// Function is delegate signature (either single-cast or multi-cast, depending on whether FUNC_MulticastDelegate is set.)
        FUNC_NetServer			= 0x00200000,	// Function is executed on servers (set by replication code if passes check)
        FUNC_HasOutParms		= 0x00400000,	// function has out (pass by reference) parameters
        FUNC_HasDefaults		= 0x00800000,	// function has structs that contain defaults
        FUNC_NetClient			= 0x01000000,	// function is executed on clients
        FUNC_DLLImport			= 0x02000000,	// function is imported from a DLL
        FUNC_BlueprintCallable	= 0x04000000,	// function can be called from blueprint code
        FUNC_BlueprintEvent		= 0x08000000,	// function can be overridden/implemented from a blueprint
        FUNC_BlueprintPure		= 0x10000000,	// function can be called from blueprint code, and is also pure (produces no side effects). If you set this, you should set FUNC_BlueprintCallable as well.
        FUNC_EditorOnly			= 0x20000000,	// function can only be called from an editor scrippt.
        FUNC_Const				= 0x40000000,	// function can be called from blueprint code, and only reads state (never writes state)
        FUNC_NetValidate		= 0x80000000,	// function must supply a _Validate implementation

        FUNC_AllFlags		= 0xFFFFFFFF,
    }
   
    enum FunctionExportFlags
    {
        FUNCEXPORT_Final			=0x00000001,	// function declaration included "final" keyword.  Used to differentiate between functions that have FUNC_Final only because they're private
        //							=0x00000002,
        //							=0x00000004,
        FUNCEXPORT_RequiredAPI		=0x00000008,	// Function should be exported as a public API function
        FUNCEXPORT_Inline			=0x00000010,	// export as an inline static C++ function
        FUNCEXPORT_CppStatic		=0x00000020,	// Export as a real C++ static function, causing thunks to call via ClassName::FuncName instead of this->FuncName
        FUNCEXPORT_CustomThunk		=0x00000040,	// Export no thunk function; the user will manually define a custom one
        //							=0x00000080,
        //							=0x00000100,
    }

    function set_flags(f: FunctionFlags): any;
    
    function clear_flags(f: FunctionFlags): any;

    /**
     * the class flags, current internal 32 bit int is ok
     */
    export enum ClassFlags {
        CLASS_None				  = 0x00000000,
        /** Class is abstract and can't be instantiated directly. */
        CLASS_Abstract            = 0x00000001,
        /** Save object configuration only to Default INIs, never to local INIs. Must be combined with CLASS_Config */
        CLASS_DefaultConfig		  = 0x00000002,
        /** Load object configuration at construction time. */
        CLASS_Config			  = 0x00000004,
        /** This object type can't be saved; null it out at save time. */
        CLASS_Transient			  = 0x00000008,
        /** Successfully parsed. */
        CLASS_Parsed              = 0x00000010,
        /** */
        CLASS_MatchedSerializers  = 0x00000020,
        /** Indicates that the config settings for this class will be saved to Project/User*.ini (similar to CLASS_GlobalUserConfig) */
        CLASS_ProjectUserConfig	  = 0x00000040,
        /** Class is a native class - native interfaces will have CLASS_Native set, but not RF_MarkAsNative */
        CLASS_Native			  = 0x00000080,
        /** Don't export to C++ header. */
        CLASS_NoExport            = 0x00000100,
        /** Do not allow users to create in the editor. */
        CLASS_NotPlaceable        = 0x00000200,
        /** Handle object configuration on a per-object basis, rather than per-class. */
        CLASS_PerObjectConfig     = 0x00000400,
        
        /** Whether SetUpRuntimeReplicationData still needs to be called for this class */
        CLASS_ReplicationDataIsSetUp = 0x00000800,
        
        /** Class can be constructed from editinline New button. */
        CLASS_EditInlineNew		  = 0x00001000,
        /** Display properties in the editor without using categories. */
        CLASS_CollapseCategories  = 0x00002000,
        /** Class is an interface **/
        CLASS_Interface           = 0x00004000,
        /**  Do not export a constructor for this class, assuming it is in the cpptext **/
        CLASS_CustomConstructor   = 0x00008000,
        /** all properties and functions in this class are const and should be exported as const */
        CLASS_Const			      = 0x00010000,

        /** Class flag indicating the class is having its layout changed, and therefore is not ready for a CDO to be created */
        CLASS_LayoutChanging	  = 0x00020000,
        
        /** Indicates that the class was created from blueprint source material */
        CLASS_CompiledFromBlueprint  = 0x00040000,

        /** Indicates that only the bare minimum bits of this class should be DLL exported/imported */
        CLASS_MinimalAPI	      = 0x00080000,
        
        /** Indicates this class must be DLL exported/imported (along with all of it's members) */
        CLASS_RequiredAPI	      = 0x00100000,

        /** Indicates that references to this class default to instanced. Used to be subclasses of UComponent, but now can be any UObject */
        CLASS_DefaultToInstanced  = 0x00200000,

        /** Indicates that the parent token stream has been merged with ours. */
        CLASS_TokenStreamAssembled  = 0x00400000,
        /** Class has component properties. */
        CLASS_HasInstancedReference= 0x00800000,
        /** Don't show this class in the editor class browser or edit inline new menus. */
        CLASS_Hidden			  = 0x01000000,
        /** Don't save objects of this class when serializing */
        CLASS_Deprecated		  = 0x02000000,
        /** Class not shown in editor drop down for class selection */
        CLASS_HideDropDown		  = 0x04000000,
        /** Class settings are saved to <AppData>/..../Blah.ini (as opposed to CLASS_DefaultConfig) */
        CLASS_GlobalUserConfig	  = 0x08000000,
        /** Class was declared directly in C++ and has no boilerplate generated by UnrealHeaderTool */
        CLASS_Intrinsic			  = 0x10000000,
        /** Class has already been constructed (maybe in a previous DLL version before hot-reload). */
        CLASS_Constructed		  = 0x20000000,
        /** Indicates that object configuration will not check against ini base/defaults when serialized */
        CLASS_ConfigDoNotCheckDefaults = 0x40000000,
        /** Class has been consigned to oblivion as part of a blueprint recompile, and a newer version currently exists. */
        CLASS_NewerVersionExists  = 0x80000000,
    }

    /**
     * Flags associated with each property in a class, overriding the
     * property's default behavior.
     * @warning When adding one here, please update ParsePropertyFlags()
     */
    export enum PropertyFlags
    {
        CPF_None = 0,

        CPF_Edit							= 0x0000000000000001,	///< Property is user-settable in the editor.
        CPF_ConstParm						= 0x0000000000000002,	///< This is a constant function parameter
        CPF_BlueprintVisible				= 0x0000000000000004,	///< This property can be read by blueprint code
        CPF_ExportObject					= 0x0000000000000008,	///< Object can be exported with actor.
        CPF_BlueprintReadOnly				= 0x0000000000000010,	///< This property cannot be modified by blueprint code
        CPF_Net								= 0x0000000000000020,	///< Property is relevant to network replication.
        CPF_EditFixedSize					= 0x0000000000000040,	///< Indicates that elements of an array can be modified, but its size cannot be changed.
        CPF_Parm							= 0x0000000000000080,	///< Function/When call parameter.
        CPF_OutParm							= 0x0000000000000100,	///< Value is copied out after function call.
        CPF_ZeroConstructor					= 0x0000000000000200,	///< memset is fine for construction
        CPF_ReturnParm						= 0x0000000000000400,	///< Return value.
        CPF_DisableEditOnTemplate			= 0x0000000000000800,	///< Disable editing of this property on an archetype/sub-blueprint
        //CPF_      						= 0x0000000000001000,	///< 
        CPF_Transient   					= 0x0000000000002000,	///< Property is transient: shouldn't be saved or loaded, except for Blueprint CDOs.
        CPF_Config      					= 0x0000000000004000,	///< Property should be loaded/saved as permanent profile.
        //CPF_								= 0x0000000000008000,	///< 
        CPF_DisableEditOnInstance			= 0x0000000000010000,	///< Disable editing on an instance of this class
        CPF_EditConst   					= 0x0000000000020000,	///< Property is uneditable in the editor.
        CPF_GlobalConfig					= 0x0000000000040000,	///< Load config from base class, not subclass.
        CPF_InstancedReference				= 0x0000000000080000,	///< Property is a component references.
        //CPF_								= 0x0000000000100000,	///<
        CPF_DuplicateTransient				= 0x0000000000200000,	///< Property should always be reset to the default value during any type of duplication (copy/paste, binary duplicatio, etc.)
        //CPF_								= 0x0000000000400000,	///< 
        //CPF_    							= 0x0000000000800000,	///< 
        CPF_SaveGame						= 0x0000000001000000,	///< Property should be serialized for save games, this is only checked for game-specific archives with ArIsSaveGame
        CPF_NoClear							= 0x0000000002000000,	///< Hide clear (and browse) button.
        //CPF_  							= 0x0000000004000000,	///<
        CPF_ReferenceParm					= 0x0000000008000000,	///< Value is passed by reference; CPF_OutParam and CPF_Param should also be set.
        CPF_BlueprintAssignable				= 0x0000000010000000,	///< MC Delegates only.  Property should be exposed for assigning in blueprint code
        CPF_Deprecated  					= 0x0000000020000000,	///< Property is deprecated.  Read it from an archive, but don't save it.
        CPF_IsPlainOldData					= 0x0000000040000000,	///< If this is set, then the property can be memcopied instead of CopyCompleteValue / CopySingleValue
        CPF_RepSkip							= 0x0000000080000000,	///< Not replicated. For non replicated properties in replicated structs 
        CPF_RepNotify						= 0x0000000100000000,	///< Notify actors when a property is replicated
        CPF_Interp							= 0x0000000200000000,	///< interpolatable property for use with matinee
        CPF_NonTransactional				= 0x0000000400000000,	///< Property isn't transacted
        CPF_EditorOnly						= 0x0000000800000000,	///< Property should only be loaded in the editor
        CPF_NoDestructor					= 0x0000001000000000,	///< No destructor
        //CPF_								= 0x0000002000000000,	///<
        CPF_AutoWeak						= 0x0000004000000000,	///< Only used for weak pointers, means the export type is autoweak
        CPF_ContainsInstancedReference		= 0x0000008000000000,	///< Property contains component references.
        CPF_AssetRegistrySearchable			= 0x0000010000000000,	///< asset instances will add properties with this flag to the asset registry automatically
        CPF_SimpleDisplay					= 0x0000020000000000,	///< The property is visible by default in the editor details view
        CPF_AdvancedDisplay					= 0x0000040000000000,	///< The property is advanced and not visible by default in the editor details view
        CPF_Protected						= 0x0000080000000000,	///< property is protected from the perspective of script
        CPF_BlueprintCallable				= 0x0000100000000000,	///< MC Delegates only.  Property should be exposed for calling in blueprint code
        CPF_BlueprintAuthorityOnly			= 0x0000200000000000,	///< MC Delegates only.  This delegate accepts (only in blueprint) only events with BlueprintAuthorityOnly.
        CPF_TextExportTransient				= 0x0000400000000000,	///< Property shouldn't be exported to text format (e.g. copy/paste)
        CPF_NonPIEDuplicateTransient		= 0x0000800000000000,	///< Property should only be copied in PIE
        CPF_ExposeOnSpawn					= 0x0001000000000000,	///< Property is exposed on spawn
        CPF_PersistentInstance				= 0x0002000000000000,	///< A object referenced by the property is duplicated like a component. (Each actor should have an own instance.)
        CPF_UObjectWrapper					= 0x0004000000000000,	///< Property was parsed as a wrapper class like TSubclassOf<T>, FScriptInterface etc., rather than a USomething*
        CPF_HasGetValueTypeHash				= 0x0008000000000000,	///< This property can generate a meaningful hash value.
        CPF_NativeAccessSpecifierPublic		= 0x0010000000000000,	///< Public native access specifier
        CPF_NativeAccessSpecifierProtected	= 0x0020000000000000,	///< Protected native access specifier
        CPF_NativeAccessSpecifierPrivate	= 0x0040000000000000,	///< Private native access specifier
        CPF_SkipSerialization				= 0x0080000000000000,	///< Property shouldn't be serialized, can still be exported to text
    }

    /**
     * @brief
     *      the property export flags
     */
    enum EPropertyHeaderExportFlags
    {
        PROPEXPORT_Public		=0x00000001,	// property should be exported as public
        PROPEXPORT_Private		=0x00000002,	// property should be exported as private
        PROPEXPORT_Protected	=0x00000004,	// property should be exported as protected
    }

    /**
     * @brief 
     *      the functionality for add meta data to class
     */
    namespace uclass 
    {
        /**
         * @brief 
         *      the meta data
         */
        type ClassKey = string | string[];
        /**
         * @brief 
         *      This keyword is used to set the actor group that the class is show in, in the editor.
         */
        let ClassGroup: ClassKey;

        /**
         * @brief 
         *      Declares that instances of this class should always have an outer of the specified class.  This is inherited by subclasses unless overridden.
         */
        let Within: ClassKey; /* =OuterClassName */

        /**
         * @brief
         *      Exposes this class as a type that can be used for variables in blueprints
         */
        let BlueprintType: ClassKey;

        
        /**
         * @brief
         *     Prevents this class from being used for variables in blueprints
         */
        let NotBlueprintType: ClassKey;

        /**
         * @brief
         *      Exposes this class as an acceptable base class for creating blueprints. The default is NotBlueprintable, unless inherited otherwise. This is inherited by subclasses.
         */
        let Blueprintable: ClassKey;

        /**
         * @brief
         *      Specifies that this class is *NOT* an acceptable base class for creating blueprints. The default is NotBlueprintable, unless inherited otherwise. This is inherited by subclasses.
         */
        let NotBlueprintable: ClassKey;

        /**
         * @brief   
         *      This keyword indicates that the class should be accessible outside of it's module, but does not need all methods exported.
         *      It exports only the autogenerated methods required for dynamic_cast<>, etc... to work.
         */
        let MinimalAPI: ClassKey;

        /**
         * @brief   
         *      Prevents automatic generation of the constructor declaration.
         */
        let customConstructor: ClassKey;

        /**
         * @brief
         *      Class was declared directly in C++ and has no boilerplate generated by UnrealHeaderTool.
         *      DO NOT USE THIS FLAG ON NEW CLASSES.
         */
        let Intrinsic: ClassKey;

        /**
         * @brief
         *      No autogenerated code will be created for this class; the header is only provided to parse metadata from.
         *      DO NOT USE THIS FLAG ON NEW CLASSES.
         * 
         */
        let noexport: ClassKey;

        /**
         * @brief 
         *      Allow users to create and place this class in the editor.  This flag is inherited by subclasses.
         */
        let placeable: ClassKey;

        /**
         * @brief 
         *      This class cannot be placed in the editor (it cancels out an inherited placeable flag).
         */
        let notplaceable: ClassKey;

        /**
         * @brief 
         *      All instances of this class are considered "instanced". Instanced classes (components) are duplicated upon construction. This flag is inherited by subclasses. 
         */
        let DefaultToInstanced: ClassKey;

        /**
         * @brief 
         *      All properties and functions in this class are const and should be exported as const.  This flag is inherited by subclasses.
         */
        let Const: ClassKey;

        /**
         * @brief 
         *      Class is abstract and can't be instantiated directly.
         */
        let Abstract: ClassKey;

        /**
         * @brief 
         *      This class is deprecated and objects of this class won't be saved when serializing.  This flag is inherited by subclasses.
         */
        let deprecated: ClassKey;

        /**
         * @brief 
         *      This class can't be saved; null it out at save time.  This flag is inherited by subclasses.
         */
        let Transient: ClassKey;

        /**
         * @brief 
         *      This class should be saved normally (it cancels out an inherited transient flag).
         */
        let nonTransient: ClassKey;

        /**
         * @brief 
         *      Load object configuration at construction time.  These flags are inherited by subclasses.
         *      Class containing config properties. Usage config=ConfigName or config=inherit (inherits config name from base class).
         */
        let config: ClassKey;
            
        /**
         * @brief
         *      Handle object configuration on a per-object basis, rather than per-class. 	
         */
        let perObjectConfig: ClassKey;
            
        /**
         * @brief 
         *      Determine whether on serialize to configs a check should be done on the base/defaults ini's
         */
        let configdonotcheckdefaults: ClassKey;

        /**
         * @brief
         *      Save object config only to Default INIs, never to local INIs.
         */
        let defaultconfig: ClassKey;

        /**
         * @brief
         *      These affect the behavior of the property editor.
         *      Class can be constructed from editinline New button.
         */
        let editinlinenew: ClassKey;
        /**
         * @brief
         *      Class can't be constructed from editinline New button.
         */
        let noteditinlinenew: ClassKey;
        /**
         * @brief
         *      Class not shown in editor drop down for class selection.
         */
        let hidedropdown: ClassKey;

        /**
         * @brief
         *      Shows the specified categories in a property viewer. Usage: showCategories=CategoryName or showCategories=(category0, category1, ...)
         */
        let showCategories: ClassKey;
        /**
         * @brief
         *      Hides the specified categories in a property viewer. Usage: hideCategories=CategoryName or hideCategories=(category0, category1, ...)
         */
        let hideCategories: ClassKey;
        /**
         * @brief
         *      Indicates that this class is a wrapper class for a component with little intrinsic functionality (this causes things like hideCategories and showCategories to be ignored if the class is subclassed in a Blueprint)
         */
        let ComponentWrapperClass: ClassKey;
        /**
         * @brief
         *      Shows the specified function in a property viewer. Usage: showFunctions=FunctionName or showFunctions=(category0, category1, ...)
         */
        let showFunctions: ClassKey;
        /**
         * @brief
         *      Hides the specified function in a property viewer. Usage: hideFunctions=FunctionName or hideFunctions=(category0, category1, ...)
         */
        let hideFunctions: ClassKey;
        /**
         * @brief
         *      Specifies which categories should be automatically expanded in a property viewer.
         */
        let autoExpandCategories: ClassKey;

        /**
         * @brief
         *      Specifies which categories should be automatically collapsed in a property viewer.
         */
        let autoCollapseCategories: ClassKey;
        /**
         * @brief
         *      Clears the list of auto collapse categories.
         */
        let dontAutoCollapseCategories: ClassKey;
        /**
         * @brief
         *      Display properties in the editor without using categories.
         */
        let collapseCategories: ClassKey;
        /**
         * @brief
         *      Display properties in the editor using categories (default behaviour).
         */
        let dontCollapseCategories: ClassKey;

        /**
         * @brief
         *      All the properties of the class are hidden in the main display by default, and are only shown in the advanced details section.
         */
        let AdvancedClassDisplay: ClassKey;

        /**
         * @brief
         *      A root convert limits a sub-class to only be able to convert to child classes of the first root class going up the hierarchy.
         */
        let ConversionRoot: ClassKey;

        /**
         * @brief
         *      Marks this class as 'experimental' (a totally unsupported and undocumented prototype)
         */
        let Experimental: ClassKey;

        /**
         * @brief
         *      Marks this class as an 'early access' preview (while not considered production-ready, it's a step beyond 'experimental' and is being provided as a preview of things to come)
         */
        let EarlyAccessPreview: ClassKey;

        /**
         * @brief
         *      Some properties are stored once per class in a sidecar structure and not on instances of the class
         */
        let SparseClassDataType: ClassKey;

        /**
         * @brief
         *      Specifies the struct that contains the CustomThunk implementations
         */
        let CustomThunkTemplates: ClassKey;

        /**
         * decorator used to add class specifier
         * @param InValues 
         */
        function uclass(...InValues: ClassKey[]): any;

        /**
         * @brief 
         *      the meta data 
         */
        type MetaKey = string | string[];

        /**
         * @brief
         *      Overrides the automatically generated tooltip from the class comment
         */
        let ToolTip: MetaKey;

        /**
         * @brief
         *      A short tooltip that is used in some contexts where the full tooltip might be overwhelming (such as the parent class picker dialog)
         */
        let ShortTooltip: MetaKey;

        /**
         * @brief
         *      A setting to determine validation of tooltips and comments. Needs to be set to "Strict"
         */
        let DocumentationPolicy: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Used for Actor Component classes. If present indicates that it can be spawned by a Blueprint.
         */
        let BlueprintSpawnableComponent: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Used for Actor and Component classes. If the native class cannot tick, Blueprint generated classes based this Actor or Component can have bCanEverTick flag overridden even if bCanBlueprintsTickByDefault is false.
         */
        let ChildCanTick: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Used for Actor and Component classes. If the native class cannot tick, Blueprint generated classes based this Actor or Component can never tick even if bCanBlueprintsTickByDefault is true.
         */
        let ChildCannotTick: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Used to make the first subclass of a class ignore all inherited showCategories and hideCategories commands
         */
        let IgnoreCategoryKeywordsInSubclasses: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] For BehaviorTree nodes indicates that the class is deprecated and will display a warning when compiled.
         */
        let DeprecatedNode: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] [PropertyMetadata] [FunctionMetadata] Used in conjunction with DeprecatedNode, DeprecatedProperty, or DeprecatedFunction to customize the warning message displayed to the user.
         */
        let DeprecationMessage: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] [PropertyMetadata] [FunctionMetadata] The name to display for this class, property, or function instead of auto-generating it from the name.
         */
        let DisplayName: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] [PropertyMetadata] [FunctionMetadata] The name to use for this class, property, or function when exporting it to a scripting language. May include deprecated names as additional semi-colon separated entries.
         */
        let ScriptName: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Specifies that this class is an acceptable base class for creating blueprints.
         */
        let IsBlueprintBase: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Comma delimited list of blueprint events that are not be allowed to be overridden in classes of this type
         */
        let KismetHideOverrides: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Specifies interfaces that are not compatible with the class.
         */
        let ProhibitedInterfaces: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Used by BlueprintFunctionLibrary classes to restrict the graphs the functions in the library can be used in to the classes specified.
         */
        let RestrictedToClasses: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Indicates that when placing blueprint nodes in graphs owned by this class that the hidden world context pin should be visible because the self context of the class cannot
         *                 provide the world context and it must be wired in manually
         */
        let ShowWorldContextPin: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Do not spawn an object of the class using Generic Create Object node in Blueprint. It makes sense only for a BluprintType class, that is neither Actor, nor ActorComponent.
         */
        let DontUseGenericSpawnObject: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Expose a proxy object of this class in Async Task node.
         */
        let ExposedAsyncProxy: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Only valid on Blueprint Function Libraries. Mark the functions in this class as callable on non-game threads in an Animation Blueprint.
         */
        let BlueprintThreadSafe: MetaKey;

        /**
         * @brief
         *      [ClassMetadata] Indicates the class uses hierarchical data. Used to instantiate hierarchical editing features in details panels
         */
        let UsesHierarchy: MetaKey;            

        /**
         * the decorator used to add meta data to class
         * @param InValues 
         */
        function umeta(...InValues:MetaKey[]): any;
    }

    /**
     * @brief 
     *      the functionality for add meta data to function
     */
    namespace ufunction
    {
        /**
         * @brief 
         *      the meta data
         */
        type FunctionKey = string | string[];

        /**
         * @brief
         *      This function is designed to be overridden by a blueprint.  Do not provide a body for this function;
         *      the autogenerated code will include a thunk that calls ProcessEvent to execute the overridden body.
         */
		let BlueprintImplementableEvent: FunctionKey;

        /**
         * @brief
		 *      This function is designed to be overridden by a blueprint, but also has a native implementation.
		 *      Provide a body named [FunctionName]_Implementation instead of [FunctionName]; the autogenerated
		 *      code will include a thunk that calls the implementation method when necessary.
         */
		let BlueprintNativeEvent: FunctionKey;

        /**
         * @brief
		 *      This function is sealed and cannot be overridden in subclasses.
		 *      It is only a valid keyword for events; declare other methods as static or final to indicate that they are sealed.
         */
		let SealedEvent: FunctionKey;

        /**
         * @brief 
		 *      This function is executable from the command line.
         */
		let Exec: FunctionKey;

        /**
         * @brief
		 *      This function is replicated, and executed on servers.  Provide a body named [FunctionName]_Implementation instead of [FunctionName];
		 *      the autogenerated code will include a thunk that calls the implementation method when necessary.
         */
		let Server: FunctionKey;

        /**
         * @brief
		 *      This function is replicated, and executed on clients.  Provide a body named [FunctionName]_Implementation instead of [FunctionName];
		 *      the autogenerated code will include a thunk that calls the implementation method when necessary.
         */
		let Client: FunctionKey;

        /**
         * @brief 
		 *      This function is both executed locally on the server and replicated to all clients, regardless of the Actor's NetOwner
         */
		let NetMulticast: FunctionKey;

        /**
         * @brief
		 *      Replication of calls to this function should be done on a reliable channel.
		 *      Only valid when used in conjunction with Client or Server
         */
		let Reliable: FunctionKey;

        /**
         * @brief
		 *      Replication of calls to this function can be done on an unreliable channel.
		 *      Only valid when used in conjunction with Client or Server
         */
		let Unreliable: FunctionKey;

        /**
         * @brief
		 *      This function fulfills a contract of producing no side effects, and additionally implies BlueprintCallable.
         */
		let BlueprintPure: FunctionKey;

        /**
         * @brief
		 *      This function can be called from blueprint code and should be exposed to the user of blueprint editing tools.
         */
		let BlueprintCallable: FunctionKey;

        /**
         * @brief
		 *      This function is used as the get accessor for a blueprint exposed property. Implies BlueprintPure and BlueprintCallable.
         */
		let BlueprintGetter: FunctionKey;

        /**
         * @brief 
		 *      This function is used as the set accessor for a blueprint exposed property. Implies BlueprintCallable.
         */
		let BlueprintSetter: FunctionKey;

        /**
         * @brief
		 *      This function will not execute from blueprint code if running on something without network authority
         */
		let BlueprintAuthorityOnly: FunctionKey;

        /**
         * @brief
		 *      This function is cosmetic and will not run on dedicated servers
         */
		let BlueprintCosmetic: FunctionKey;

        /**
         * @brief
		 *      This function can be called in the editor on selected instances via a button in the details panel.
         */
		let CallInEditor: FunctionKey;

        /**
         * @brief
		 *      The UnrealHeaderTool code generator will not produce a execFoo thunk for this function; it is up to the user to provide one.
         */
		let CustomThunk: FunctionKey;

        /**
         * @brief
		 *      Specifies the category of the function when displayed in blueprint editing tools.
		 *      Usage: Category=CategoryName or Category="MajorCategory,SubCategory"
         */
		let Category: FunctionKey;

        /**
         * @brief
		 *      This function must supply a _Validate implementation
         */
		let WithValidation: FunctionKey;

        /**
         * @brief
		 *      This function is RPC service request
         */
		let ServiceRequest: FunctionKey;

        /**
         * @brief
		 *      This function is RPC service response
         */
		let ServiceResponse: FunctionKey;
		
        /**
         * @brief
		 *      [FunctionMetadata]	Marks a UFUNCTION as accepting variadic arguments. Variadic functions may have extra terms they need to emit after the main set of function arguments
		 *						These are all considered wildcards so no type checking will be performed on them
         */
		let Variadic: FunctionKey;

        /**
         * @brief
		 *      [FunctionMetadata] Indicates the display name of the return value pin
         */
		let ReturnDisplayName: FunctionKey;

        /**
         * @brief
		 *      [FunctionMetadata] Indicates that a particular function parameter is for internal use only, which means it will be both hidden and not connectible.
         */
		let InternalUseParam: FunctionKey;

        /**
         * decorator used to add function specifier
         * @param InValues 
         */
        function ufunction(...InValues: FunctionKey[]): any;

        /**
         * @brief 
         *      the meta data with one key for class meta
         */
        type MetaKey = string | string[];
	
	
        /**
         * @brief
         *      Indicates that a Blueprint exposed function should not be exposed to the end user
         */
        let BlueprintInternalUseOnly: MetaKey;

        /**
         * @brief
         *      Overrides the automatically generated tooltip from the class comment
         */
        let ToolTip: MetaKey;

        /**
         * @brief
         *      A short tooltip that is used in some contexts where the full tooltip might be overwhelming (such as the parent class picker dialog)
         */
        let ShortTooltip: MetaKey;

        /**
         * @brief
         *      A setting to determine validation of tooltips and comments. Needs to be set to "Strict"
         */
        let DocumentationPolicy: MetaKey;

        /**
         * @brief
         *      [FunctionMetadata] Used with a comma-separated list of parameter names that should show up as advanced pins (requiring UI expansion).
		 *      Alternatively you can set a number, which is the number of parameters from the start that should *not* be marked as advanced (eg 'AdvancedDisplay="2"' will mark all but the first two advanced).
         */
        let AdvancedDisplay: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Indicates that a BlueprintCallable function should use a Call Array Function node and that the parameters specified in the comma delimited list should be treated as wild card array properties.
         */
		let ArrayParm: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Used when ArrayParm has been specified to indicate other function parameters that should be treated as wild card properties linked to the type of the array parameter.
         */
		let ArrayTypeDependentParams: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] For reference parameters, indicates that a value should be created to be used for the input if none is linked via BP.
		 *      This also allows for inline editing of the default value on some types (take FRotator for instance). Only valid for inputs.
         */
		let AutoCreateRefTerm: MetaKey;

        /**
         * @brief
         *      [FunctionMetadata] This function is only accessible from within its class and derived classes.
         */
		let BlueprintProtected: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Used for BlueprintCallable functions that have a WorldContext pin to indicate that the function can be called even if the class does not implement the virtual function GetWorld().
         */
		let CallableWithoutWorldContext: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Indicates that a BlueprintCallable function should use the Commutative Associative Binary node.
         */
		let CommutativeAssociativeBinaryOperator: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Indicates that a BlueprintCallable function should display in the compact display mode and the name to use in that mode.
         */
		let CompactNodeTitle: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Used with CustomThunk to declare that a parameter is actually polymorphic
         */
		let CustomStructureParam: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] For BlueprintCallable functions indicates that the object property named's default value should be the self context of the node
         */
		let DefaultToSelf: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] This function is deprecated, any blueprint references to it cause a compilation warning.
         */
		let DeprecatedFunction: MetaKey;

        /**
         * @brief
		 *      [ClassMetadata] [FunctionMetadata] Used in conjunction with DeprecatedNode or DeprecatedFunction to customize the warning message displayed to the user.
         */
		let DeprecationMessage: MetaKey; //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the function section)

        /**
         * @brief
		 *      [FunctionMetadata] For BlueprintCallable functions indicates that an input/output (determined by whether it is an input/output enum) exec pin should be created for each entry in the enum specified.
		 *      Use ReturnValue to refer to the return value of the function. Also works for bools.
         */
		let ExpandEnumAsExecs: MetaKey;

        /**
         * @brief
		 *      Synonym for ExpandEnumAsExecs
         */
		let ExpandBoolAsExecs: MetaKey;

        /**
         * @brief
		 *      [ClassMetadata] [PropertyMetadata] [FunctionMetadata] The name to display for this class, property, or function instead of auto-generating it from the name.
         */
		let DisplayName: MetaKey; //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the function section)

        /**
         * @brief
         *      [ClassMetadata] [PropertyMetadata] [FunctionMetadata] The name to use for this class, property, or function when exporting it to a scripting language. May include deprecated names as additional semi-colon separated entries.
         */
        let ScriptName: MetaKey; // (Commented out so as to avoid duplicate name with version in the Class section, but still show in the function section)

        /**
         * @brief
		 *      [PropertyMetadata] [FunctionMetadata] Flag set on a property or function to prevent it being exported to a scripting language.
         */
		let ScriptNoExport: MetaKey; //, (Commented out so as to avoid duplicate name with version in the Property section, but still show in the function section)

        /**
         * @brief
		 *      [FunctionMetadata] Flags a static function taking a struct or or object as its first argument so that it "hoists" the function to be a method of the struct or class when exporting it to a scripting language.
		 *      The value is optional, and may specify a name override for the method. May include deprecated names as additional semi-colon separated entries.
         */
		let ScriptMethod: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Used with ScriptMethod to denote that the return value of the function should overwrite the value of the instance that made the call (structs only, equivalent to using UPARAM(self) on the struct argument).
         */
		let ScriptMethodSelfReturn: MetaKey;

        /**
         * @brief
         *      [FunctionMetadata] Flags a static function taking a struct as its first argument so that it "hoists" the function to be an operator of the struct when exporting it to a scripting language.
		 *      The value describes the kind of operator using C++ operator syntax (see below), and may contain multiple semi-colon separated values.
		 *      The signature of the function depends on the operator type, and additional parameters may be passed as long as they're defaulted and the basic signature requirements are met.
		 *      - For the bool conversion operator (bool) the signature must be:
		 *     		bool FuncName(const FMyStruct&); // FMyStruct may be passed by value rather than const-ref
		 *      - For the unary conversion operators (neg(-obj)) the signature must be:
		 *     		FMyStruct FuncName(const FMyStruct&); // FMyStruct may be passed by value rather than const-ref
		 *      - For comparison operators (==, !=, <, <=, >, >=) the signature must be:
		 *     		bool FuncName(const FMyStruct, OtherType); // OtherType can be any type, FMyStruct may be passed by value rather than const-ref
		 *     	- For mathematical operators (+, -, *, /, %, &, |, ^, >>, <<) the signature must be:
		 *     		ReturnType FuncName(const FMyStruct&, OtherType); // ReturnType and OtherType can be any type, FMyStruct may be passed by value rather than const-ref
		 *     	- For mathematical assignment operators (+=, -=, *=, /=, %=, &=, |=, ^=, >>=, <<=) the signature must be:
		 *     		FMyStruct FuncName(const FMyStruct&, OtherType); // OtherType can be any type, FMyStruct may be passed by value rather than const-ref
         */
		let ScriptOperator: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Flags a static function returning a value so that it "hoists" the function to be a constant of its host type when exporting it to a scripting language.
		 *      The constant will be hosted on the class that owns the function, but ScriptConstantHost can be used to host it on a different type (struct or class).
		 *      The value is optional, and may specify a name override for the constant. May include deprecated names as additional semi-colon separated entries.
         */
		let ScriptConstant: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Used with ScriptConstant to override the host type for a constant. Should be the name of a struct or class with no prefix, eg) Vector2D or Actor
         */
		let ScriptConstantHost: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] For BlueprintCallable functions indicates that the parameter pin should be hidden from the user's view.
         */
		let HidePin: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] For some functions used by async task nodes, specify this parameter should be skipped when exposing pins
         */
		let HideSpawnParms: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] For BlueprintCallable functions provides additional keywords to be associated with the function for search purposes.
         */
		let Keywords: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Indicates that a BlueprintCallable function is Latent
         */
		let Latent: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] For Latent BlueprintCallable functions indicates which parameter is the LatentInfo parameter
         */
		let LatentInfo: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] For BlueprintCallable functions indicates that the material override node should be used
         */
		let MaterialParameterCollectionFunction: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] For BlueprintCallable functions indicates that the function should be displayed the same as the implicit Break Struct nodes
         */
		let NativeBreakFunc: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] For BlueprintCallable functions indicates that the function should be displayed the same as the implicit Make Struct nodes
         */
		let NativeMakeFunc: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Used by BlueprintCallable functions to indicate that this function is not to be allowed in the Construction Script.
         */
		let UnsafeDuringActorConstruction: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Used by BlueprintCallable functions to indicate which parameter is used to determine the World that the operation is occurring within.
         */
		let WorldContext: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Used only by static BlueprintPure functions from BlueprintLibrary. A cast node will be automatically added for the return type and the type of the first parameter of the function.
         */
		let BlueprintAutocast: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] Only valid in Blueprint Function Libraries. Mark this function as an exception to the class's general BlueprintThreadSafe metadata.
         */
		let NotBlueprintThreadSafe: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] [InterfaceMetadata] Metadata that flags function params that govern what type of object the function returns
         */
		let DeterminesOutputType: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] [InterfaceMetadata] Metadata that flags the function output param that will be controlled by the "MD_DynamicOutputType" pin
         */
		let DynamicOutputParam: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata][InterfaceMetadata] Metadata to identify an DataTable Pin. Depending on which DataTable is selected, we display different RowName options
         */
		let DataTablePin: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata][InterfaceMetadata] Metadata that flags TSet parameters that will have their type determined at blueprint compile time
         */
		let SetParam: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] [InterfaceMetadata] Metadata that flags TMap function parameters that will have their type determined at blueprint compile time
         */
		let MapParam: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] [InterfaceMetadata]  Metadata that flags TMap function parameters that will have their key type determined at blueprint compile time
         */
		let MapKeyParam: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata][InterfaceMetadata] Metadata that flags TMap function parameter that will have their value type determined at blueprint compile time
         */
		let MapValueParam: MetaKey;

		/// [FunctionMetadata] [InterfaceMetadata] Metadata that identifies an integral property as a bitmask.
		// Bitmask, for property

		/// [FunctionMetadata] [InterfaceMetadata] Metadata that associates a bitmask property with a bitflag enum.
		// BitmaskEnum, for property

		/// [InterfaceMetadata] Metadata that identifies an enum as a set of explicitly-named bitflags.
        // 	Bitflags, for enum
		/// [InterfaceMetadata] Metadata that signals to the editor that enum values correspond to mask values instead of bitshift (index) values.
		//  UseEnumValuesAsMaskValuesInEditor, for enum


        /**
         * @brief
		 *      [InterfaceMetadata] Stub function used internally by animation blueprints
         */
		let AnimBlueprintFunction: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] [InterfaceMetadata] Metadata that flags TArray function parameters that will have their type determined at blueprint compile time
         */
		let ArrayParam: MetaKey;

        /**
         * the decorator used to add meta data to function
         * @param InValues 
         */
        function umeta(...InValues:MetaKey[]): any;
    }


    /**
     * @brief
     *      the functionality for add meta data to property
     */
    namespace uproperty 
    {
        /**
         * @brief
         *      the meta data
         */
        type PropertyKey = string | string[];

        /**
         * @brief
         *      This property is const and should be exported as const.
         */
        let Const: PropertyKey;

        /**
         * @brief
		 *      Property should be loaded/saved to ini file as permanent profile.
         */
		let Config: PropertyKey;

        /**
         * @brief
		 *      Same as above but load config from base class, not subclass.
         */
		let GlobalConfig: PropertyKey;

        /**
         * @brief
		 *      Property should be loaded as localizable text. Implies ReadOnly.
         */
		let Localized: PropertyKey;

        /**
         * @brief
		 *      Property is transient: shouldn't be saved, zero-filled at load time.
         */
		let Transient: PropertyKey;

        /**
         * @brief
		 *      Property should always be reset to the default value during any type of duplication (copy/paste, binary duplication, etc.)
         */
		let DuplicateTransient: PropertyKey;

        /**
         * @brief
		 *      Property should always be reset to the default value unless it's being duplicated for a PIE session - deprecated, use NonPIEDuplicateTransient instead
         */
		let NonPIETransient: PropertyKey;

        /**
         * @brief
		 *      Property should always be reset to the default value unless it's being duplicated for a PIE session
         */
		let NonPIEDuplicateTransient: PropertyKey;

        /**
         * @brief
		 *      Object property can be exported with it's owner.
         */
		let Export: PropertyKey;

        /**
         * @brief
		 *      Hide clear (and browse) button in the editor.
         */
		let NoClear: PropertyKey;

        /**
         * @brief
		 *      Indicates that elements of an array can be modified, but its size cannot be changed.
         */
		let EditFixedSize: PropertyKey;

        /**
         * @brief
		 *      Property is relevant to network replication.
         */
		let Replicated: PropertyKey;

        /**
         * @brief
		 *      Property is relevant to network replication. Notify actors when a property is replicated (usage: ReplicatedUsing=FunctionName).
         */
		let ReplicatedUsing: PropertyKey;

        /**
         * @brief
		 *      Skip replication (only for struct members and parameters in service request functions).
         */
		let NotReplicated: PropertyKey;

        /**
         * @brief
		 *      Interpolatable property for use with matinee. Always user-settable in the editor.
         */
		let Interp: PropertyKey;

        /**
         * @brief
		 *      Property isn't transacted.
         */
		let NonTransactional: PropertyKey;

        /**
         * @brief
		 *      Property is a component reference. Implies EditInline and Export.
         */
		let Instanced: PropertyKey;

        /**
         * @brief
		 *      MC Delegates only.  Property should be exposed for assigning in blueprints.
         */
		let BlueprintAssignable: PropertyKey;

        /**
         * @brief
		 *      Specifies the category of the property. Usage: Category=CategoryName.
         */
		let Category: PropertyKey;

        /**
         * @brief
         *      Properties appear visible by default in a details panel
         */
		let SimpleDisplay: PropertyKey;

        /**
         * @brief
		 *      Properties are in the advanced dropdown in a details panel
         */
		let AdvancedDisplay: PropertyKey;

        /**
         * @brief
		 *      Indicates that this property can be edited by property windows in the editor
         */
		let EditAnywhere: PropertyKey;

        /**
         * @brief
		 *      Indicates that this property can be edited by property windows, but only on instances, not on archetypes
         */
		let EditInstanceOnly: PropertyKey;

        /**
         * @brief
		 *      Indicates that this property can be edited by property windows, but only on archetypes
         */
		let EditDefaultsOnly: PropertyKey;

        /**
         * @brief
		 *      Indicates that this property is visible in property windows, but cannot be edited at all
         */
		let VisibleAnywhere: PropertyKey;
		
        /**
         * @brief
		 *      Indicates that this property is only visible in property windows for instances, not for archetypes, and cannot be edited
         */
		let VisibleInstanceOnly: PropertyKey;

        /**
         * @brief
		 *      Indicates that this property is only visible in property windows for archetypes, and cannot be edited
         */
		let VisibleDefaultsOnly: PropertyKey;

        /**
         * @brief
		 *      This property can be read by blueprints, but not modified.
         */
		let BlueprintReadOnly: PropertyKey;

        /**
         * @brief
		 *      This property has an accessor to return the value. Implies BlueprintReadOnly if BlueprintSetter or BlueprintReadWrite is not specified. (usage: BlueprintGetter=FunctionName).
         */
		let BlueprintGetter: PropertyKey;

        /**
         * @brief
		 *      This property can be read or written from a blueprint.
         */
		let BlueprintReadWrite: PropertyKey;

        /**
         * @brief
		 *      This property has an accessor to set the value. Implies BlueprintReadWrite. (usage: BlueprintSetter=FunctionName).
         */
		let BlueprintSetter: PropertyKey;

        /**
         * @brief
		 *      The AssetRegistrySearchable keyword indicates that this property and it's value will be automatically added
		 *      to the asset registry for any asset class instances containing this as a member variable.  It is not legal
		 *      to use on struct properties or parameters.
         */
		let AssetRegistrySearchable: PropertyKey;

        /**
         * @brief
		 *      Property should be serialized for save games.
		 *      This is only checked for game-specific archives with ArIsSaveGame set
         */
		let SaveGame: PropertyKey;

        /**
         * @brief
		 *      MC Delegates only.  Property should be exposed for calling in blueprint code
         */
		let BlueprintCallable: PropertyKey;

        /**
         * @brief
		 *      MC Delegates only. This delegate accepts (only in blueprint) only events with BlueprintAuthorityOnly.
         */
		let BlueprintAuthorityOnly: PropertyKey;

        /**
         * @brief
		 *      Property shouldn't be exported to text format (e.g. copy/paste)
         */
		let TextExportTransient: PropertyKey;

        /**
         * @brief
		 *      Property shouldn't be serialized, can still be exported to text
         */
		let SkipSerialization: PropertyKey;

        /**
         * @brief
		 *      If true, the self pin should not be shown or connectable regardless of purity, const, etc. similar to InternalUseParam
         */
		let HideSelfPin: PropertyKey;

        /**
         * decorator used to add property specifier
         * @param InValues 
         */
        function uproperty(...InValues: PropertyKey[]) : any;

        /**
         * @brief
         *      the meta data with one key for  property meta
         */
        type MetaKey = string | string[];

        /**
         * @brief
         *      Overrides the automatically generated tooltip from the class comment
         */
        let ToolTip: MetaKey;

        /**
         * @brief
         *      A short tooltip that is used in some contexts where the full tooltip might be overwhelming (such as the parent class picker dialog)
         */
        let ShortTooltip: MetaKey;

        /**
         * @brief
         *      A setting to determine validation of tooltips and comments. Needs to be set to "Strict"
         */
        let DocumentationPolicy: MetaKey;

        /**
         * @brief
         *      [PropertyMetadata] Used for Subclass and SoftClass properties.  Indicates whether abstract class types should be shown in the class picker.
         */
		let AllowAbstract: MetaKey; 

        /**
         * @brief
		 *      [PropertyMetadata] Used for ComponentReference properties.  Indicates whether other actor that are not in the property outer hierarchy should be shown in the component picker.
         */
		let AllowAnyActor: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for FSoftObjectPath, ComponentReference and UClass properties.  Comma delimited list that indicates the class type(s) of assets to be displayed in the asset picker(FSoftObjectPath) or component picker or class viewer (UClass).
         */
		let AllowedClasses: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for FVector properties.  It causes a ratio lock to be added when displaying this property in details panels.
         */
		let AllowPreserveRatio: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Indicates that a private member marked as BluperintReadOnly or BlueprintReadWrite should be accessible from blueprints
         */
		let AllowPrivateAccess: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for integer properties.  Clamps the valid values that can be entered in the UI to be between 0 and the length of the array specified.
         */
		let ArrayClamp: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for SoftObjectPtr/SoftObjectPath properties. Comma separated list of Bundle names used inside PrimaryDataAssets to specify which bundles this reference is part of
         */
		let AssetBundles: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Subclass and SoftClass properties.  Indicates whether only blueprint classes should be shown in the class picker.
         */
		let BlueprintBaseOnly: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Property defaults are generated by the Blueprint compiler and will not be copied when CopyPropertiesForUnrelatedObjects is called post-compile.
         */
		let BlueprintCompilerGeneratedDefaults: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for float and integer properties.  Specifies the minimum value that may be entered for the property.
         */
		let ClampMin: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for float and integer properties.  Specifies the maximum value that may be entered for the property.
         */
		let ClampMax: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Property is serialized to config and we should be able to set it anywhere along the config hierarchy.
         */
		let ConfigHierarchyEditable: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FDirectoryPath properties. Indicates that the path will be picked using the Slate-style directory picker inside the game Content dir.
         */
		let ContentDir: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] This property is deprecated, any blueprint references to it cause a compilation warning.
         */
		let DeprecatedProperty: MetaKey;

        /**
         * @brief
		 *      [ClassMetadata] [PropertyMetadata] [FunctionMetadata] Used in conjunction with DeprecatedNode, DeprecatedProperty, or DeprecatedFunction to customize the warning message displayed to the user.
         */
		let DeprecationMessage: MetaKey; //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the property section)

        /**
         * @brief
		 *      [ClassMetadata] [PropertyMetadata] [FunctionMetadata] The name to display for this class, property, or function instead of auto-generating it from the name.
         */
		let DisplayName: MetaKey; // (Commented out so as to avoid duplicate name with version in the Class section, but still show in the property section)

        /**
         * @brief
		 *      [ClassMetadata] [PropertyMetadata] [FunctionMetadata] The name to use for this class, property, or function when exporting it to a scripting language. May include deprecated names as additional semi-colon separated entries.
         */
		let ScriptName: MetaKey; //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the property section)

        /**
         * @brief
		 *      [PropertyMetadata] Used for FSoftObjectPath, ActorComponentReference and UClass properties.  Comma delimited list that indicates the class type(s) of assets that will NOT be displayed in the asset picker (FSoftObjectPath) or component picker or class viewer (UClass).
         */
		let DisallowedClasses: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Indicates that the property should be displayed immediately after the property named in the metadata.
         */
		let DisplayAfter: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] The relative order within its category that the property should be displayed in where lower values are sorted first..
		 *      If used in conjunction with DisplayAfter, specifies the priority relative to other properties with same DisplayAfter specifier.
         */
		let DisplayPriority: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Indicates that the property is an asset type and it should display the thumbnail of the selected asset.
         */
		let DisplayThumbnail: MetaKey;
	
        /**
         * @brief
		 *      [PropertyMetadata] Specifies a boolean property that is used to indicate whether editing of this property is disabled.
         */
		let EditCondition: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Keeps the elements of an array from being reordered by dragging 
         */
		let EditFixedOrder: MetaKey;
		
        /**
         * @brief
		 *      [PropertyMetadata] Used for FSoftObjectPath properties in conjunction with AllowedClasses. Indicates whether only the exact classes specified in AllowedClasses can be used or whether subclasses are valid.
         */
		let ExactClass: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Specifies a list of categories whose functions should be exposed when building a function list in the Blueprint Editor.
         */
		let ExposeFunctionCategories: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Specifies whether the property should be exposed on a Spawn Actor for the class type.
         */
		let ExposeOnSpawn: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FFilePath properties. Indicates the path filter to display in the file picker.
         */
		let FilePathFilter: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FFilePath properties. Indicates that the FilePicker dialog will output a path relative to the game directory when setting the property. An absolute path will be used when outside the game directory.
         */
		let RelativeToGameDir: MetaKey;

		/// [PropertyMetadata] Deprecated.
		// FixedIncrement,

        /**
         * @brief
		 *      [PropertyMetadata] Used by asset properties. Indicates that the asset pickers should always show engine content
         */
		let ForceShowEngineContent: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by asset properties. Indicates that the asset pickers should always show plugin content
         */
		let ForceShowPluginContent: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for FColor and FLinearColor properties. Indicates that the Alpha property should be hidden when displaying the property widget in the details.
         */
		let HideAlphaChannel: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Indicates that the property should be hidden in the details panel. Currently only used by events.
         */
		let HideInDetailPanel: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Subclass and SoftClass properties. Specifies to hide the ability to change view options in the class picker
         */
		let HideViewOptions: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for bypassing property initialization tests when the property cannot be safely tested in a deterministic fashion. Example: random numbers, guids, etc.
         */
		let IgnoreForMemberInitializationTest: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Signifies that the bool property is only displayed inline as an edit condition toggle in other properties, and should not be shown on its own row.
         */
		let InlineEditConditionToggle: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FDirectoryPath properties.  Converts the path to a long package name
         */
		let LongPackageName: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Transform/Rotator properties (also works on arrays of them). Indicates that the property should be exposed in the viewport as a movable widget.
         */
		let MakeEditWidget: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] For properties in a structure indicates the default value of the property in a blueprint make structure node.
         */
		let MakeStructureDefaultValue: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used FSoftClassPath properties. Indicates the parent class that the class picker will use when filtering which classes to display.
         */
		let MetaClass: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Subclass and SoftClass properties. Indicates the selected class must implement a specific interface
         */
		let MustImplement: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for numeric properties. Stipulates that the value must be a multiple of the metadata value.
         */
		let Multiple: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for FString and FText properties.  Indicates that the edit field should be multi-line, allowing entry of newlines.
         */
		let MultiLine: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for FString and FText properties.  Indicates that the edit field is a secret field (e.g a password) and entered text will be replaced with dots. Do not use this as your only security measure.  The property data is still stored as plain text. 
         */
		let PasswordField: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for array properties. Indicates that the duplicate icon should not be shown for entries of this array in the property panel.
         */
		let NoElementDuplicate: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Property wont have a 'reset to default' button when displayed in property windows
         */
		let NoResetToDefault: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for integer and float properties. Indicates that the spin box element of the number editing widget should not be displayed.
         */
		let NoSpinbox: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Subclass properties. Indicates whether only placeable classes should be shown in the class picker.
         */
		let OnlyPlaceable: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FDirectoryPath properties. Indicates that the directory dialog will output a relative path when setting the property.
         */
		let RelativePath: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FDirectoryPath properties. Indicates that the directory dialog will output a path relative to the game content directory when setting the property.
         */
		let RelativeToGameContentDir: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] [FunctionMetadata] Flag set on a property or function to prevent it being exported to a scripting language.
         */
		let ScriptNoExport: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by struct properties. Indicates that the inner properties will not be shown inside an expandable struct, but promoted up a level.
         */
		let ShowOnlyInnerProperties: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Subclass and SoftClass properties. Shows the picker as a tree view instead of as a list
         */
		let ShowTreeView: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by numeric properties. Indicates how rapidly the value will grow when moving an unbounded slider.
         */
		let SliderExponent: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by arrays of structs. Indicates a single property inside of the struct that should be used as a title summary when the array entry is collapsed.
         */
		let TitleProperty: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for float and integer properties.  Specifies the lowest that the value slider should represent.
         */
		let UIMin: MetaKey;

        /**
         * @brief
         *      [PropertyMetadata] Used for float and integer properties.  Specifies the highest that the value slider should represent.
         */
		let UIMax: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for SoftObjectPtr/SoftObjectPath properties to specify a reference should not be tracked. This reference will not be automatically cooked or saved into the asset registry for redirector/delete fixup.
         */
		let Untracked: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] For functions that should be compiled in development mode only.
         */
		let DevelopmentOnly: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] (Internal use only) Used for the latent action manager to fix up a latent action with the VM
         */
		let NeedsLatentFixup: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] (Internal use only) Used for the latent action manager to track where it's re-entry should be
         */
		let LatentCallbackTarget: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Causes FString and FName properties to have a limited set of options generated dynamically, e.g. meta=(GetOptions="FuncName")
		 *
		 *      UFUNCTION()
		 *      TArray<FString> FuncName() const; // Always return string array even if FName property.
         */
		let GetOptions: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] [InterfaceMetadata] Metadata that identifies an integral property as a bitmask.
         */
		let Bitmask: MetaKey; //, for property

        /**
         * @brief
         *      [FunctionMetadata] [InterfaceMetadata] Metadata that associates a bitmask property with a bitflag enum.
         */
		let BitmaskEnum: MetaKey; //, for property

        /**
         * the decorator used to add meta data to property
         * @param InValues 
         */
        function umeta(...InValues: MetaKey[]): any;
    }

    /**
     * @brief
     *      the functionality to add meta data for function parameters
     */
    namespace uparam 
    {
        /**
         * @brief
         *      the meta data 
         */
        class ParamKey
        {
            /**
             * set the meta data' value
             * @param InValue 
             * @param InRemains 
             */
            assign(InValue: string, ... InRemains: string[]): ParamKey;
        }

        /**
         * @brief
         *      This property is const and should be exported as const
         */
        let Const: ParamKey;

        /**
         * @brief
         *      Value is copied out after function call. Only valid on function param declaration
         */
        let Ref: ParamKey;

        /**
         * @brief
         *      Skip replication (only for struct members and parameters in service request functions).
         */
        let NotReplicated: ParamKey;
        
        /**
         * @brief
         *      the display name
         */
        let DisplayName: ParamKey;

        /**
         * decorator to add parameters metadata
         * @param InValues 
         */
        function uparam(...InValues: ParamKey[]): any;

        //  todo: is parameter ok to use same meta data as property ?
        /**
         * @brief
         *      the meta data with one key for  property meta
         */
        type MetaKey = string | string[]

        /**
         * @brief
         *      Overrides the automatically generated tooltip from the class comment
         */
        let ToolTip: MetaKey;

        /**
         * @brief
         *      A short tooltip that is used in some contexts where the full tooltip might be overwhelming (such as the parent class picker dialog)
         */
        let ShortTooltip: MetaKey;

        /**
         * @brief
         *      A setting to determine validation of tooltips and comments. Needs to be set to "Strict"
         */
        let DocumentationPolicy: MetaKey;

        /**
         * @brief
         *      [PropertyMetadata] Used for Subclass and SoftClass properties.  Indicates whether abstract class types should be shown in the class picker.
         */
		let AllowAbstract: MetaKey; 

        /**
         * @brief
		 *      [PropertyMetadata] Used for ComponentReference properties.  Indicates whether other actor that are not in the property outer hierarchy should be shown in the component picker.
         */
		let AllowAnyActor: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for FSoftObjectPath, ComponentReference and UClass properties.  Comma delimited list that indicates the class type(s) of assets to be displayed in the asset picker(FSoftObjectPath) or component picker or class viewer (UClass).
         */
		let AllowedClasses: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for FVector properties.  It causes a ratio lock to be added when displaying this property in details panels.
         */
		let AllowPreserveRatio: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Indicates that a private member marked as BluperintReadOnly or BlueprintReadWrite should be accessible from blueprints
         */
		let AllowPrivateAccess: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for integer properties.  Clamps the valid values that can be entered in the UI to be between 0 and the length of the array specified.
         */
		let ArrayClamp: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for SoftObjectPtr/SoftObjectPath properties. Comma separated list of Bundle names used inside PrimaryDataAssets to specify which bundles this reference is part of
         */
		let AssetBundles: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Subclass and SoftClass properties.  Indicates whether only blueprint classes should be shown in the class picker.
         */
		let BlueprintBaseOnly: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Property defaults are generated by the Blueprint compiler and will not be copied when CopyPropertiesForUnrelatedObjects is called post-compile.
         */
		let BlueprintCompilerGeneratedDefaults: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for float and integer properties.  Specifies the minimum value that may be entered for the property.
         */
		let ClampMin: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for float and integer properties.  Specifies the maximum value that may be entered for the property.
         */
		let ClampMax: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Property is serialized to config and we should be able to set it anywhere along the config hierarchy.
         */
		let ConfigHierarchyEditable: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FDirectoryPath properties. Indicates that the path will be picked using the Slate-style directory picker inside the game Content dir.
         */
		let ContentDir: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] This property is deprecated, any blueprint references to it cause a compilation warning.
         */
		let DeprecatedProperty: MetaKey;

        /**
         * @brief
		 *      [ClassMetadata] [PropertyMetadata] [FunctionMetadata] Used in conjunction with DeprecatedNode, DeprecatedProperty, or DeprecatedFunction to customize the warning message displayed to the user.
         */
		let DeprecationMessage: MetaKey; //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the property section)

        /**
         * @brief
		 *      [ClassMetadata] [PropertyMetadata] [FunctionMetadata] The name to use for this class, property, or function when exporting it to a scripting language. May include deprecated names as additional semi-colon separated entries.
         */
		let ScriptName: MetaKey; //, (Commented out so as to avoid duplicate name with version in the Class section, but still show in the property section)

        /**
         * @brief
		 *      [PropertyMetadata] Used for FSoftObjectPath, ActorComponentReference and UClass properties.  Comma delimited list that indicates the class type(s) of assets that will NOT be displayed in the asset picker (FSoftObjectPath) or component picker or class viewer (UClass).
         */
		let DisallowedClasses: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Indicates that the property should be displayed immediately after the property named in the metadata.
         */
		let DisplayAfter: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] The relative order within its category that the property should be displayed in where lower values are sorted first..
		 *      If used in conjunction with DisplayAfter, specifies the priority relative to other properties with same DisplayAfter specifier.
         */
		let DisplayPriority: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Indicates that the property is an asset type and it should display the thumbnail of the selected asset.
         */
		let DisplayThumbnail: MetaKey;
	
        /**
         * @brief
		 *      [PropertyMetadata] Specifies a boolean property that is used to indicate whether editing of this property is disabled.
         */
		let EditCondition: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Keeps the elements of an array from being reordered by dragging 
         */
		let EditFixedOrder: MetaKey;
		
        /**
         * @brief
		 *      [PropertyMetadata] Used for FSoftObjectPath properties in conjunction with AllowedClasses. Indicates whether only the exact classes specified in AllowedClasses can be used or whether subclasses are valid.
         */
		let ExactClass: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Specifies a list of categories whose functions should be exposed when building a function list in the Blueprint Editor.
         */
		let ExposeFunctionCategories: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Specifies whether the property should be exposed on a Spawn Actor for the class type.
         */
		let ExposeOnSpawn: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FFilePath properties. Indicates the path filter to display in the file picker.
         */
		let FilePathFilter: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FFilePath properties. Indicates that the FilePicker dialog will output a path relative to the game directory when setting the property. An absolute path will be used when outside the game directory.
         */
		let RelativeToGameDir: MetaKey;

		/// [PropertyMetadata] Deprecated.
		// FixedIncrement,

        /**
         * @brief
		 *      [PropertyMetadata] Used by asset properties. Indicates that the asset pickers should always show engine content
         */
		let ForceShowEngineContent: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by asset properties. Indicates that the asset pickers should always show plugin content
         */
		let ForceShowPluginContent: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for FColor and FLinearColor properties. Indicates that the Alpha property should be hidden when displaying the property widget in the details.
         */
		let HideAlphaChannel: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Indicates that the property should be hidden in the details panel. Currently only used by events.
         */
		let HideInDetailPanel: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Subclass and SoftClass properties. Specifies to hide the ability to change view options in the class picker
         */
		let HideViewOptions: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for bypassing property initialization tests when the property cannot be safely tested in a deterministic fashion. Example: random numbers, guids, etc.
         */
		let IgnoreForMemberInitializationTest: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Signifies that the bool property is only displayed inline as an edit condition toggle in other properties, and should not be shown on its own row.
         */
		let InlineEditConditionToggle: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FDirectoryPath properties.  Converts the path to a long package name
         */
		let LongPackageName: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Transform/Rotator properties (also works on arrays of them). Indicates that the property should be exposed in the viewport as a movable widget.
         */
		let MakeEditWidget: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] For properties in a structure indicates the default value of the property in a blueprint make structure node.
         */
		let MakeStructureDefaultValue: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used FSoftClassPath properties. Indicates the parent class that the class picker will use when filtering which classes to display.
         */
		let MetaClass: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Subclass and SoftClass properties. Indicates the selected class must implement a specific interface
         */
		let MustImplement: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for numeric properties. Stipulates that the value must be a multiple of the metadata value.
         */
		let Multiple: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for FString and FText properties.  Indicates that the edit field should be multi-line, allowing entry of newlines.
         */
		let MultiLine: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for FString and FText properties.  Indicates that the edit field is a secret field (e.g a password) and entered text will be replaced with dots. Do not use this as your only security measure.  The property data is still stored as plain text. 
         */
		let PasswordField: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for array properties. Indicates that the duplicate icon should not be shown for entries of this array in the property panel.
         */
		let NoElementDuplicate: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Property wont have a 'reset to default' button when displayed in property windows
         */
		let NoResetToDefault: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for integer and float properties. Indicates that the spin box element of the number editing widget should not be displayed.
         */
		let NoSpinbox: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Subclass properties. Indicates whether only placeable classes should be shown in the class picker.
         */
		let OnlyPlaceable: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FDirectoryPath properties. Indicates that the directory dialog will output a relative path when setting the property.
         */
		let RelativePath: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by FDirectoryPath properties. Indicates that the directory dialog will output a path relative to the game content directory when setting the property.
         */
		let RelativeToGameContentDir: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] [FunctionMetadata] Flag set on a property or function to prevent it being exported to a scripting language.
         */
		let ScriptNoExport: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by struct properties. Indicates that the inner properties will not be shown inside an expandable struct, but promoted up a level.
         */
		let ShowOnlyInnerProperties: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for Subclass and SoftClass properties. Shows the picker as a tree view instead of as a list
         */
		let ShowTreeView: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by numeric properties. Indicates how rapidly the value will grow when moving an unbounded slider.
         */
		let SliderExponent: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used by arrays of structs. Indicates a single property inside of the struct that should be used as a title summary when the array entry is collapsed.
         */
		let TitleProperty: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for float and integer properties.  Specifies the lowest that the value slider should represent.
         */
		let UIMin: MetaKey;

        /**
         * @brief
         *      [PropertyMetadata] Used for float and integer properties.  Specifies the highest that the value slider should represent.
         */
		let UIMax: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Used for SoftObjectPtr/SoftObjectPath properties to specify a reference should not be tracked. This reference will not be automatically cooked or saved into the asset registry for redirector/delete fixup.
         */
		let Untracked: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] For functions that should be compiled in development mode only.
         */
		let DevelopmentOnly: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] (Internal use only) Used for the latent action manager to fix up a latent action with the VM
         */
		let NeedsLatentFixup: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] (Internal use only) Used for the latent action manager to track where it's re-entry should be
         */
		let LatentCallbackTarget: MetaKey;

        /**
         * @brief
		 *      [PropertyMetadata] Causes FString and FName properties to have a limited set of options generated dynamically, e.g. meta=(GetOptions="FuncName")
		 *
		 *      UFUNCTION()
		 *      TArray<FString> FuncName() const; // Always return string array even if FName property.
         */
		let GetOptions: MetaKey;

        /**
         * @brief
		 *      [FunctionMetadata] [InterfaceMetadata] Metadata that identifies an integral property as a bitmask.
         */
		let Bitmask: MetaKey; //, for property

        /**
         * @brief
         *      [FunctionMetadata] [InterfaceMetadata] Metadata that associates a bitmask property with a bitflag enum.
         */
		let BitmaskEnum: MetaKey; //, for property

        /**
         * the decorator for parameters
         * @param InValue 
         */
        function umeta(...InValue:MetaKey[]) : any;
    }
}
