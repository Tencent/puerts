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
typedef bool (*WrapFuncPtr)(MethodType* method, MethodPointer methodPointer, const v8::FunctionCallbackInfo<v8::Value>& info, bool checkArgument, void** typeInfos);
typedef v8::FunctionCallback FunctionCallbackFunc;

typedef void TypeIdType;

typedef void (*SetNativePtrFunc)(v8::Object* obj, void* ptr, void* type_id);

typedef void (*UnrefJsObjectFunc)(struct PersistentObjectInfo* objectInfo);

typedef void* (*IsInstFunc)(void * obj, void* typeId); 

typedef bool (*IsValueTypeFunc)(void* typeId); 

typedef bool (*IsAssignableFromFunc)(void* typeId, void* typeId2); 

typedef void* (*JsValueToCSRefFunc)(const void *typeId, v8::Context* env, v8::Value* jsval);

typedef const void* (*CSharpTypeToTypeIdFunc)(const void *type);

typedef void* (*CStringToCSharpStringFunc)(const char* str);

typedef pesapi_value (*TryTranslatePrimitiveFunc)(v8::Context* env, const void* obj);

typedef int (*GetTIDFunc)(void* obj);

#else
    
#define MethodPointer Il2CppMethodPointer
typedef void* (*ObjectAllocateFunc)(Il2CppClass *klass);
typedef void (*ValueTypeDeallocateFunc)(void* ptr);
typedef void PersistentObjectInfo;
typedef void* (*DelegateAllocateFunc)(Il2CppClass* klass, MethodPointer methodPointer, PersistentObjectInfo** outDelegateInfo);
typedef void (*FieldOperationFunc)(void *obj, FieldInfo *fieldInfo, size_t offset, void *value);
typedef void* (*GetValueTypeFieldPtrFunc)(void *obj, FieldInfo *field, size_t offset);
typedef RuntimeMethod MethodType;
typedef bool (*WrapFuncPtr)(MethodType* method, Il2CppMethodPointer methodPointer, pesapi_callback_info info, bool checkArgument, void** typeInfos);
typedef pesapi_callback FunctionCallbackFunc;
typedef pesapi_constructor InitializeFunc;

typedef Il2CppClass TypeIdType;

typedef void (*SetNativePtrFunc)(pesapi_value obj, void* ptr, const void* type_id);

typedef void (*UnrefJsObjectFunc)(PersistentObjectInfo* delegateInfo);

typedef Il2CppObject* (*IsInstFunc)(Il2CppObject* obj, Il2CppClass* typeId); 

typedef bool (*IsValueTypeFunc)(Il2CppClass *klass); 

typedef bool (*IsAssignableFromFunc)(Il2CppClass *klass, Il2CppClass *oklass); 

typedef Il2CppObject* (*JsValueToCSRefFunc)(Il2CppClass *klass, pesapi_env env, pesapi_value jsval);

typedef const void* (*CSharpTypeToTypeIdFunc)(Il2CppObject *type);

typedef Il2CppString* (*CStringToCSharpStringFunc)(const char* str);

typedef pesapi_value (*TryTranslatePrimitiveFunc)(pesapi_env env, Il2CppObject* obj);

typedef int (*GetTIDFunc)(Il2CppObject* obj);

#endif

typedef void* (*FunctionToDelegateFunc)(pesapi_env env, pesapi_value pvalue, const void* TypeId, bool throwIfFail);

typedef void (*ThrowInvalidOperationExceptionFunc)(const char* msg);

struct WrapData 
{
    WrapFuncPtr Wrap;
    MethodType* Method;
    MethodPointer MethodPointer;
    void* TypeInfos[0];
};

struct JsClassInfoHeader
{
    const void* TypeId;
    const void* SuperTypeId;
    std::string Name;
    TypeIdType* Class;
    bool IsValueType;
    MethodPointer DelegateBridge;
    std::vector<WrapData*> Ctors;
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
    IsAssignableFromFunc IsAssignableFrom = nullptr;
    JsValueToCSRefFunc JsValueToCSRef = nullptr;
    CSharpTypeToTypeIdFunc CSharpTypeToTypeId = nullptr;
    CStringToCSharpStringFunc CStringToCSharpString = nullptr;
    TryTranslatePrimitiveFunc TryTranslatePrimitive = nullptr;
    GetTIDFunc GetTID = nullptr;
    ThrowInvalidOperationExceptionFunc ThrowInvalidOperationException = nullptr;
    int SizeOfRuntimeObject = 0;
    //plugin api
    
    SetNativePtrFunc SetNativePtr = nullptr;
    UnrefJsObjectFunc UnrefJsObject = nullptr;
    FunctionToDelegateFunc FunctionToDelegate = nullptr;
};

}
