/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include "functional"

#if USING_IN_UNREAL_ENGINE
#include "CoreMinimal.h"
#else
#define JSENV_API
#define FORCEINLINE V8_INLINE
#define UPTRINT uintptr_t
#endif

#pragma warning(push, 0) 
#include "v8.h"
#pragma warning(pop)

namespace puerts
{
struct JSENV_API JSFunctionInfo
{
    const char* Name;
    v8::FunctionCallback Callback;
    void *Data = nullptr;
};

struct JSENV_API JSPropertyInfo
{
    const char* Name;
    v8::AccessorNameGetterCallback Getter;
    v8::AccessorNameSetterCallback Setter;
    void *Data = nullptr;
};

typedef void(*FinalizeFunc)(void* Ptr);

typedef void*(*InitializeFunc)(const v8::FunctionCallbackInfo<v8::Value>& Info);

class CTypeInfo
{
public:
    virtual const char* Name() const = 0;
    virtual bool IsPointer() const = 0;
    virtual bool IsRef() const = 0;
    virtual bool IsConst() const = 0;
    virtual bool IsUEType() const = 0;
};

class CFunctionInfo
{
public:
    virtual const CTypeInfo* Return() const = 0;
    virtual unsigned int ArgumentCount() const = 0;
    virtual const CTypeInfo* Argument(unsigned int index) const = 0;
};

struct NamedFunctionInfo
{
    const char* Name;
    const CFunctionInfo* Type;
};

struct NamedPropertyInfo
{
    const char* Name;
    const char* Type;
};

struct JSENV_API JSClassDefinition
{
    const char* CPPTypeName;
    const char* CPPSuperTypeName;
    const char* UETypeName;
    InitializeFunc Initialize;
    JSFunctionInfo* Methods;    //成员方法
    JSFunctionInfo* Functions;  //静态方法
    JSPropertyInfo* Properties;
    FinalizeFunc Finalize;
    //int InternalFieldCount;
    NamedFunctionInfo* ConstructorInfos;
    NamedFunctionInfo* MethodInfos;
    NamedFunctionInfo* FunctionInfos;
    NamedPropertyInfo* PropertyInfos;
};

typedef void(*AddonRegisterFunc)(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Exports);

#define JSClassEmptyDefinition { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }

void JSENV_API RegisterJSClass(const JSClassDefinition &ClassDefinition);

void JSENV_API ForeachRegisterClass(std::function<void(const JSClassDefinition *ClassDefinition)>);

void RegisterAddon(const char* Name, AddonRegisterFunc RegisterFunc);

const JSClassDefinition* FindClassByID(const char* Name);

#if USING_IN_UNREAL_ENGINE
JSENV_API const JSClassDefinition* FindClassByType(UStruct* Type);

const JSClassDefinition* FindCDataClassByName(const FString& Name);

AddonRegisterFunc FindAddonRegisterFunc(const FString& Name);
#endif

}

#define PUERTS_MODULE(Name, RegFunc) \
    static struct FAutoRegisterFor##Name \
    { \
        FAutoRegisterFor##Name()\
        {\
            puerts::RegisterAddon(#Name, (RegFunc));\
        }\
    } _AutoRegisterFor##Name

