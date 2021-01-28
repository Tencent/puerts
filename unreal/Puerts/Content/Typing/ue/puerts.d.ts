/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

declare module "ue" {
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
    
    type TWeakObjectPtr<T> = {
        [K in keyof T]: T[K];
    }

    type TSoftObjectPtr<T> = {
        [K in keyof T]: T[K];
    }

    type TLazyObjectPtr<T> = {
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

}
