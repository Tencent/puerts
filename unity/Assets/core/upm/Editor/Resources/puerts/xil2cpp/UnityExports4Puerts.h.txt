/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once
namespace puerts
{
#if defined(USE_OUTSIZE_UNITY)

typedef void (*MethodPointer)();
typedef void* (*ObjectAllocateFunc)(const void* type);
typedef void (*ValueTypeDeallocateFunc)(void* ptr);
typedef void* (*DelegateAllocateFunc)(const void* type, MethodPointer methodPointer, struct PersistentObjectInfo** outDelegateInfo);
typedef void (*FieldOperationFunc)(void *obj, void *fieldInfo, size_t offset, void *value);
typedef void* (*GetValueTypeFieldPtrFunc)(void *obj, void *field, size_t offset);
typedef void MethodType;
typedef bool (*WrapFuncPtr)(MethodType* method, MethodPointer methodPointer, const v8::FunctionCallbackInfo<v8::Value>& info, bool checkArgument, struct WrapData* wrapData);
typedef v8::FunctionCallback FunctionCallbackFunc;

typedef void (*FieldWrapFuncPtr)(const v8::FunctionCallbackInfo<v8::Value>& info, void* fieldInfo, size_t offset, void* typeInfo);

typedef void TypeIdType;

typedef void (*SetNativePtrFunc)(v8::Object* obj, void* ptr, void* type_id);

typedef v8::Value* (*CreateJSArrayBufferFunc)(v8::Context* env, void* buffer, size_t length);

typedef void (*UnrefJsObjectFunc)(struct PersistentObjectInfo* objectInfo);

typedef void* (*IsInstFunc)(void * obj, void* typeId); 

typedef bool (*IsValueTypeFunc)(void* typeId); 

typedef bool (*IsDelegateFunc)(const void* typeId); 

typedef bool (*IsAssignableFromFunc)(const void* typeId, const void* typeId2); 

typedef void* (*JsValueToCSRefFunc)(const void *typeId, v8::Context* env, v8::Value* jsval);

typedef const void* (*CSharpTypeToTypeIdFunc)(const void *type);

typedef void* (*CStringToCSharpStringFunc)(const char* str);

typedef pesapi_value (*TryTranslateFunc)(v8::Context* env, const void* obj);

typedef int (*GetTIDFunc)(void* obj);

typedef const void* (*GetReturnTypeFunc)(const void* method);

typedef const void* (*GetParameterTypeFunc)(const void* method, int index);

typedef void (*SetPersistentObjectFunc)(pesapi_env env, pesapi_value pvalue, PersistentObjectInfo* objectInfo);

typedef v8::Value* (*GetPersistentObjectFunc)(v8::Context* env, const PersistentObjectInfo* objectInfo);

typedef void* (*GetJSObjectValueFunc)(const PersistentObjectInfo* objectInfo, const char* key, const void* type);

typedef v8::Value* (*GetModuleExecutorFunc)(v8::Context* env);

typedef void* (*NewArrayFunc)(const void *typeId, uint32_t length);

typedef void* (*GetArrayFirstElementAddressFunc)(void *array);

typedef void (*ArraySetRefFunc)(void *array, uint32_t index, void* value);

typedef const void* (*GetArrayElementTypeIdFunc)(const void *typeId);

typedef uint32_t (*GetArrayLengthFunc)(void *array);

typedef void* (*GetDefaultValuePtrFunc)(const void* methodInfo, uint32_t index);

#else
    
#define MethodPointer Il2CppMethodPointer
typedef void* (*ObjectAllocateFunc)(Il2CppClass *klass);
typedef void (*ValueTypeDeallocateFunc)(void* ptr);
typedef void PersistentObjectInfo;
typedef void* (*DelegateAllocateFunc)(Il2CppClass* klass, MethodPointer methodPointer, PersistentObjectInfo** outDelegateInfo);
typedef void (*FieldOperationFunc)(void *obj, FieldInfo *fieldInfo, size_t offset, void *value);
typedef void* (*GetValueTypeFieldPtrFunc)(void *obj, FieldInfo *field, size_t offset);
typedef MethodInfo MethodType;
typedef bool (*WrapFuncPtr)(MethodType* method, Il2CppMethodPointer methodPointer, pesapi_callback_info info, bool checkArgument, struct WrapData* wrapData);
typedef pesapi_callback FunctionCallbackFunc;
typedef pesapi_constructor InitializeFunc;
typedef void (*FieldWrapFuncPtr)(pesapi_callback_info info, FieldInfo* field, size_t offset, Il2CppClass* fieldType);

typedef Il2CppClass TypeIdType;

typedef void (*SetNativePtrFunc)(pesapi_value obj, void* ptr, const void* type_id);

typedef pesapi_value (*CreateJSArrayBufferFunc)(pesapi_env env, void* buffer, size_t length);

typedef void (*UnrefJsObjectFunc)(PersistentObjectInfo* delegateInfo);

typedef Il2CppObject* (*IsInstFunc)(Il2CppObject* obj, Il2CppClass* typeId); 

typedef bool (*IsValueTypeFunc)(Il2CppClass *klass); 

typedef bool (*IsDelegateFunc)(Il2CppClass *klass); 

typedef bool (*IsAssignableFromFunc)(Il2CppClass *klass, Il2CppClass *oklass); 

typedef Il2CppObject* (*JsValueToCSRefFunc)(Il2CppClass *klass, pesapi_env env, pesapi_value jsval);

typedef const void* (*CSharpTypeToTypeIdFunc)(Il2CppObject *type);

typedef Il2CppString* (*CStringToCSharpStringFunc)(const char* str);

typedef pesapi_value (*TryTranslateFunc)(pesapi_env env, Il2CppObject* obj);

typedef int (*GetTIDFunc)(Il2CppObject* obj);

typedef const Il2CppClass* (*GetReturnTypeFunc)(const MethodInfo* method);

typedef const Il2CppClass* (*GetParameterTypeFunc)(const MethodInfo* method, int index);

typedef void (*SetPersistentObjectFunc)(pesapi_env env, pesapi_value pvalue, PersistentObjectInfo* objectInfo);

typedef pesapi_value (*GetPersistentObjectFunc)(pesapi_env env, const PersistentObjectInfo* objectInfo);

typedef Il2CppObject* (*GetJSObjectValueFunc)(const PersistentObjectInfo* objectInfo, const char* key, Il2CppClass* type);

typedef pesapi_value (*GetModuleExecutorFunc)(pesapi_env env);

typedef Il2CppArray* (*NewArrayFunc)(Il2CppClass *typeId, uint32_t length);

typedef char* (*GetArrayFirstElementAddressFunc)(Il2CppArray *array);

typedef void (*ArraySetRefFunc)(Il2CppArray *array, uint32_t index, void* value);

typedef Il2CppClass* (*GetArrayElementTypeIdFunc)(Il2CppClass *typeId);

typedef uint32_t (*GetArrayLengthFunc)(Il2CppArray *array);

typedef void* (*GetDefaultValuePtrFunc)(const MethodInfo* methodInfo, uint32_t index);

#endif

typedef void* (*FunctionToDelegateFunc)(pesapi_env env, pesapi_value pvalue, const void* TypeId, bool throwIfFail);

typedef void (*ThrowInvalidOperationExceptionFunc)(const char* msg);

typedef void* (*GetRuntimeObjectFromPersistentObjectFunc)(pesapi_env env, pesapi_value pvalue);

typedef void (*SetRuntimeObjectToPersistentObjectFunc)(pesapi_env env, pesapi_value pvalue, void* runtimeObject);

struct WrapData 
{
    WrapFuncPtr Wrap;
    MethodType* Method;
    MethodPointer MethodPointer;
    bool IsStatic;
    bool IsExtensionMethod;
    bool HasParamArray;
    int OptionalNum;
    void* TypeInfos[0];
};

struct JsClassInfoHeader
{
    const void* TypeId;
    const void* SuperTypeId;
    TypeIdType* Class;
    bool IsValueType;
    MethodPointer DelegateBridge;
    WrapData** CtorWrapDatas;
};

struct UnityExports
{
    //.cpp api
    ObjectAllocateFunc ObjectAllocate = nullptr;
    DelegateAllocateFunc DelegateAllocate = nullptr;
    ValueTypeDeallocateFunc ValueTypeDeallocate = nullptr;
    FunctionCallbackFunc MethodCallback = nullptr;
    InitializeFunc ConstructorCallback = nullptr;
    FieldOperationFunc FieldGet = nullptr;
    FieldOperationFunc FieldSet = nullptr;
    GetValueTypeFieldPtrFunc GetValueTypeFieldPtr = nullptr;
    IsInstFunc IsInst = nullptr; // slow, but apply to all situations
    IsInstFunc IsInstClass = nullptr; // faster, just for class, can not apply to interface and array type
    IsInstFunc IsInstSealed = nullptr; // fastest, only for sealed class, delegate
    IsValueTypeFunc IsValueType = nullptr;
    IsDelegateFunc IsDelegate = nullptr;
    IsAssignableFromFunc IsAssignableFrom = nullptr;
    JsValueToCSRefFunc JsValueToCSRef = nullptr;
    CSharpTypeToTypeIdFunc CSharpTypeToTypeId = nullptr;
    CStringToCSharpStringFunc CStringToCSharpString = nullptr;
    TryTranslateFunc TryTranslatePrimitive = nullptr;
    TryTranslateFunc TryTranslateBuiltin = nullptr;
    TryTranslateFunc TryTranslateValueType = nullptr;
    GetTIDFunc GetTID = nullptr;
    ThrowInvalidOperationExceptionFunc ThrowInvalidOperationException = nullptr;
    GetReturnTypeFunc GetReturnType = nullptr;
    GetParameterTypeFunc GetParameterType = nullptr;
    NewArrayFunc NewArray = nullptr;
    GetArrayFirstElementAddressFunc GetArrayFirstElementAddress = nullptr;
    ArraySetRefFunc ArraySetRef = nullptr;
    GetArrayElementTypeIdFunc GetArrayElementTypeId = nullptr;
    GetArrayLengthFunc GetArrayLength = nullptr;
    GetDefaultValuePtrFunc GetDefaultValuePtr = nullptr;
    WrapFuncPtr ReflectionWrapper = nullptr;
    FieldWrapFuncPtr ReflectionGetFieldWrapper = nullptr;
    FieldWrapFuncPtr ReflectionSetFieldWrapper = nullptr;
    int SizeOfRuntimeObject = 0;
    //plugin api
    
    SetNativePtrFunc SetNativePtr = nullptr;
    CreateJSArrayBufferFunc CreateJSArrayBuffer = nullptr;
    UnrefJsObjectFunc UnrefJsObject = nullptr;
    FunctionToDelegateFunc FunctionToDelegate = nullptr;

    SetPersistentObjectFunc SetPersistentObject = nullptr;
    GetPersistentObjectFunc GetPersistentObject = nullptr;
    GetJSObjectValueFunc GetJSObjectValue = nullptr;
    GetModuleExecutorFunc GetModuleExecutor = nullptr;

    GetRuntimeObjectFromPersistentObjectFunc GetRuntimeObjectFromPersistentObject = nullptr;
    SetRuntimeObjectToPersistentObjectFunc SetRuntimeObjectToPersistentObject = nullptr;
};

}