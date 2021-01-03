/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <memory>
#include <vector>

#include "CoreMinimal.h"
#include "CoreUObject.h"
#include "V8Utils.h"
#include "ObjectMapper.h"

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)


namespace puerts
{
class FPropertyTranslator;

template<typename T>
class FContinerWrapper
{
public:
    static void OnGarbageCollectedWithFree(const v8::WeakCallbackInfo<void>& Data)
    {
        T *Container = static_cast<T*>(DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1)));
        FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindContainer(Container);
        delete Container;
    }

    static void OnGarbageCollected(const v8::WeakCallbackInfo<void>& Data)
    {
        T *Container = static_cast<T*>(DataTransfer::MakeAddressWithHighPartOfTwo(Data.GetInternalField(0), Data.GetInternalField(1)));
        FV8Utils::IsolateData<IObjectMapper>(Data.GetIsolate())->UnBindContainer(Container);
    }

    static void New(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

        auto Self = Info.This();

        if (Info.Length() == 2 && Info[0]->IsExternal()) //Call by Native
        {
            T* Ptr = reinterpret_cast<T*>(v8::Local<v8::External>::Cast(Info[0])->Value());
            bool PassByPointer = Info[1]->BooleanValue(Isolate);
            if (PassByPointer)
            {
                FV8Utils::IsolateData<IObjectMapper>(Isolate)->BindContainer(Ptr, Self, OnGarbageCollected);
            }
            else
            {
                FV8Utils::IsolateData<IObjectMapper>(Isolate)->BindContainer(Ptr, Self, OnGarbageCollectedWithFree);
            }
        }
        else // Call by js new
        {
            FV8Utils::ThrowException(Isolate, "Container Constrator no support yet");
        }
            
    }

    // TODO - 用doxygen注释
    // 参数：无
    // 返回：容器内元素总数
    static void Num(const v8::FunctionCallbackInfo<v8::Value>& Info)
    {
        v8::Isolate* Isolate = Info.GetIsolate();
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = Isolate->GetCurrentContext();

        auto Self = FV8Utils::GetPoninterFast<T>(Info.Holder());
        Info.GetReturnValue().Set(Self->Num());
    }
};

class FScriptArrayWrapper : public FContinerWrapper<FScriptArray>
{
public:
    static v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

private:
    // 参数：一到多个容器元素
    // 返回：无
    // 作用：追加新元素到容器
    static void Add(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 参数：索引
    // 返回：元素
    // 作用：获取索引对应的元素，如果索引越界则抛出异常
    static void Get(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 参数1：索引；参数2：元素
    // 返回：无
    // 作用：设置容器中索引对应的元素值，如果索引越界则抛出异常
    static void Set(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 参数：元素
    // 返回：bool
    // 作用：查询容器是否包含该元素，若是则返回true，否则返回false
    static void Contains(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 参数：元素
    // 返回：索引
    // 作用：返回容器中第一次出现该元素的索引，若元素不存在则返回INDEX_NONE（-1）
    static void FindIndex(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 参数：索引
    // 返回：无
    // 作用：移除索引对应的元素，被移除的位置之后的元素会自动前移，如果索引越界则抛出异常
    static void RemoveAt(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 参数：索引
    // 返回：bool
    // 作用：如果参数是有效索引，返回true，否则返回false
    static void IsValidIndex(const v8::FunctionCallbackInfo<v8::Value>& Info);

    // 参数：无
    // 返回：无
    // 作用：清空容器
    static void Empty(const v8::FunctionCallbackInfo<v8::Value>& Info);
    
private:
    FORCEINLINE static int32 AddUninitialized(FScriptArray *ScriptArray, int32 ElementSize, int32 Count = 1);

    FORCEINLINE static uint8* GetData(FScriptArray *ScriptArray, int32 ElementSize, int32 Index);

    FORCEINLINE static void Construct(FScriptArray *ScriptArray, FPropertyTranslator *Inner, int32 Index, int32 Count = 1);

    FORCEINLINE static void Destruct(FScriptArray *ScriptArray, FPropertyTranslator *Inner, int32 Index, int32 Count = 1);

    static int32 FindIndexInner(const v8::FunctionCallbackInfo<v8::Value>& Info);
};

class FScriptSetWrapper : public FContinerWrapper<FScriptSet>
{
public:
    static v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);
private:
    static void Add(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Get(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Contains(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void FindIndex(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void RemoveAt(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void GetMaxIndex(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void IsValidIndex(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Empty(const v8::FunctionCallbackInfo<v8::Value>& Info);

private:
    FORCEINLINE static void Destruct(FScriptSet *ScriptSet, FPropertyTranslator *Inner, int32 Index, int32 Count = 1);

    FORCEINLINE static int32 FindIndexInner(const v8::FunctionCallbackInfo<v8::Value>& Info);
};

class FScriptMapWrapper : public FContinerWrapper<FScriptMap>
{
public:
    static v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

private:
    static void Add(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Get(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Set(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Remove(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void GetMaxIndex(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void IsValidIndex(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void GetKey(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Empty(const v8::FunctionCallbackInfo<v8::Value>& Info);

private:
    FORCEINLINE static void Destruct(FScriptMap *ScriptMap, FPropertyTranslator *KeyTranslator, FPropertyTranslator *ValueTranslator, int32 Index, int32 Count = 1);

    FORCEINLINE static FScriptMapLayout GetScriptLayout(const PropertyMacro* KeyProperty, const PropertyMacro* ValueProperty);
};

class FFixSizeArrayWrapper
{
public:
    static v8::Local<v8::FunctionTemplate> ToFunctionTemplate(v8::Isolate* Isolate);

private:
    static void New(const v8::FunctionCallbackInfo<v8::Value>& Info) {}

    static void Num(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Get(const v8::FunctionCallbackInfo<v8::Value>& Info);

    static void Set(const v8::FunctionCallbackInfo<v8::Value>& Info);
};
}
