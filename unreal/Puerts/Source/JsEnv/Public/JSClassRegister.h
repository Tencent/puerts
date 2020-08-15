// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"

#pragma warning(push, 0) 
#include "v8.h"
#pragma warning(pop)

namespace puerts
{
struct JSENV_API JSFunctionInfo
{
    const char* Name;
    v8::FunctionCallback Callback;
};

struct JSENV_API JSPropertyInfo
{
    const char* Name;
    v8::AccessorNameGetterCallback Getter;
    v8::AccessorNameSetterCallback Setter;
};

typedef void(*FinalizeFunc)(void* Ptr);

typedef void*(*InitializeFunc)(const v8::FunctionCallbackInfo<v8::Value>& Info);

struct JSENV_API JSClassDefinition
{
    const char* CDataName;
    const char* CDataSuperName;
    const char* UStructName;
    InitializeFunc Initialize;
    JSFunctionInfo* Methods;    //成员方法
    JSFunctionInfo* Functions;  //静态方法
    JSPropertyInfo* Propertys;
    FinalizeFunc Finalize;
    //int InternalFieldCount;
};

typedef void(*AddonRegisterFunc)(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Exports);

#define JSClassEmptyDefinition { 0, 0, 0, 0, 0, 0, 0, 0 }

void JSENV_API RegisterClass(const JSClassDefinition &ClassDefinition);

void RegisterAddon(const char* Name, AddonRegisterFunc RegisterFunc);

const JSClassDefinition* FindClassByID(const char* Name);

const JSClassDefinition* FindClassByType(UStruct* Type);

const JSClassDefinition* FindCDataClassByName(const FString& Name);

AddonRegisterFunc FindAddonRegisterFunc(const FString& Name);
}

#define PUERTS_MODULE(Name, RegFunc) \
    static struct FAutoRegisterFor##Name \
    { \
        FAutoRegisterFor##Name()\
        {\
            puerts::RegisterAddon(#Name, (RegFunc));\
        }\
    } _AutoRegisterFor##Name

