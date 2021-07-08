/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

declare module "ue" {
    type $Nullable<T> = T | null;
    
    type ArgumentTypes<T> = T extends (... args: infer U ) => infer R ? U: never;

    interface $Ref<T> {
        value: T
    }
    
    interface $CallbackID {}
    
    interface $Delegate<T extends (...args: any) => any> {
        Bind(fn : T): void;
        Unbind(): void;
        IsBound(): boolean;
        Execute(...a: ArgumentTypes<T>) : ReturnType<T>;
    }

    interface $MulticastDelegate<T extends (...args: any) => any> {
        Add(fn : T): void;
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

}
