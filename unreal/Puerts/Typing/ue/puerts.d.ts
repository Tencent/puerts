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
    
    function set_flags(f: FunctionFlags): any;
    
    function clear_flags(f: FunctionFlags): any;

}
