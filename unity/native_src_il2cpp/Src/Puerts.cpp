﻿#include <memory>

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)

#if defined(WITH_NODEJS)

#pragma warning(push, 0)
#include "node.h"
#include "uv.h"
#pragma warning(pop)

#else // !WITH_NODEJS

#if defined(PLATFORM_WINDOWS)

#if _WIN64
#include "Blob/Win64/SnapshotBlob.h"
#else
#include "Blob/Win32/SnapshotBlob.h"
#endif

#elif defined(PLATFORM_ANDROID_ARM)
#include "Blob/Android/armv7a/SnapshotBlob.h"
#elif defined(PLATFORM_ANDROID_ARM64)
#include "Blob/Android/arm64/SnapshotBlob.h"
#elif defined(PLATFORM_MAC_ARM64)
#include "Blob/macOS_arm64/SnapshotBlob.h"
#elif defined(PLATFORM_MAC)
#include "Blob/macOS/SnapshotBlob.h"
#elif defined(PLATFORM_IOS)
#include "Blob/iOS/arm64/SnapshotBlob.h"
#elif defined(PLATFORM_LINUX)
#include "Blob/Linux/SnapshotBlob.h"
#endif

#endif // WITH_NODEJS


#include "CppObjectMapper.h"
#include "DataTransfer.h"
#include "pesapi.h"
#include "JSClassRegister.h"
#include "Binding.hpp"   
#include <stdarg.h>
#include "BackendEnv.h"

#define USE_OUTSIZE_UNITY 1

#include "UnityExports4Puerts.h"
#include "PromiseRejectCallback.hpp"

namespace puerts
{
enum Backend
{
    V8          = 0,
    Node        = 1,
    QuickJS     = 2,
};
static std::unique_ptr<v8::Platform> GPlatform;
#if defined(WITH_NODEJS)
static std::vector<std::string>* Args;
static std::vector<std::string>* ExecArgs;
static std::vector<std::string>* Errors;
#endif

typedef void(*LogCallback)(const char* value);

static LogCallback GLogCallback = nullptr;

static UnityExports GUnityExports;

typedef void (*LazyLoadTypeFunc) (const void* typeId, bool includeNonPublic, void* method);

void* GTryLoadTypeMethodInfo = nullptr;
    
LazyLoadTypeFunc GTryLazyLoadType = nullptr;

static void LazyLoad(const void* typeId)
{
    GTryLazyLoadType(typeId, false, GTryLoadTypeMethodInfo);
}

#define GetObjectData(Value, Type) ((Type*)(((uint8_t*)Value) + GUnityExports.SizeOfRuntimeObject))

struct PersistentObjectInfo
{
    FPersistentObjectEnvInfo* EnvInfo;
    v8::Global<v8::Object> JsObject;
    std::weak_ptr<int> JsEnvLifeCycleTracker;
    //std::map<void*, void*> 
};

static_assert(sizeof(PersistentObjectInfo) <= sizeof(int64_t) * 8, "PersistentObjectInfo Size invalid");

void PLog(LogLevel Level, const std::string Fmt, ...)
{
    static char SLogBuffer[1024];
    va_list list;
    va_start(list, Fmt);
    vsnprintf(SLogBuffer, sizeof(SLogBuffer), Fmt.c_str(), list);
    va_end(list);

    if (GLogCallback)
    {
        GLogCallback(SLogBuffer);
    }
}

struct CSharpMethodInfo
{
    std::string Name;
    bool IsStatic;
    bool IsGetter;
    bool IsSetter;
    std::vector<WrapData*> OverloadDatas;
};

struct FieldWrapData
{
    FieldWrapFuncPtr Getter;
    FieldWrapFuncPtr Setter;
    void *FieldInfo;
    size_t Offset;
    void* TypeInfo;
};

struct CSharpFieldInfo
{
    std::string Name;
    bool IsStatic;
    FieldWrapData *Data;
};

struct JsClassInfo : public JsClassInfoHeader
{
    std::string Name;
    std::vector<WrapData*> Ctors;
    std::vector<CSharpMethodInfo> Methods;
    std::vector<CSharpFieldInfo> Fields;
};

static void GetterCallback(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    FieldWrapData* wrapData = reinterpret_cast<FieldWrapData*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    wrapData->Getter(Info, wrapData->FieldInfo, wrapData->Offset, wrapData->TypeInfo);
}

static void SetterCallback(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    FieldWrapData* wrapData = reinterpret_cast<FieldWrapData*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    wrapData->Setter(Info, wrapData->FieldInfo, wrapData->Offset, wrapData->TypeInfo);
}

static void SetNativePtr(v8::Object* obj, void* ptr, void* type_id)
{
    DataTransfer::SetPointer(obj, ptr, 0);
    DataTransfer::SetPointer(obj, type_id, 1);
}

static void* _GetRuntimeObjectFromPersistentObject(v8::Local<v8::Context> Context, v8::Local<v8::Object> Obj)
{
    auto Isolate = Context->GetIsolate();
    auto POEnv = DataTransfer::GetPersistentObjectEnvInfo(Isolate);

    puerts::FCppObjectMapper* mapper = reinterpret_cast<puerts::FCppObjectMapper*>(Isolate->GetData(MAPPER_ISOLATE_DATA_POS));
    mapper->ClearPendingPersistentObject(Isolate, Context);

    v8::MaybeLocal<v8::Value> maybeValue = Obj->Get(Context, POEnv->SymbolCSPtr.Get(Isolate));
    if (maybeValue.IsEmpty())
    {
        return nullptr;
    }
    v8::Local<v8::Value> maybeExternal = maybeValue.ToLocalChecked();
    if (!maybeExternal->IsExternal())
    {
        return nullptr;
    }

    return v8::Local<v8::External>::Cast(maybeExternal)->Value();
}
static void* GetRuntimeObjectFromPersistentObject(pesapi_env env, pesapi_value pvalue)
{
    v8::Local<v8::Context> Context;
    memcpy(static_cast<void*>(&Context), &env, sizeof(env));
    v8::Local<v8::Object> Obj;
    memcpy(static_cast<void*>(&Obj), &pvalue, sizeof(pvalue));

    return _GetRuntimeObjectFromPersistentObject(Context, Obj);
}

static void _SetRuntimeObjectToPersistentObject(v8::Local<v8::Context> Context, v8::Local<v8::Object> Obj, void* runtimeObject)
{
    auto Isolate = Context->GetIsolate();
    auto POEnv = DataTransfer::GetPersistentObjectEnvInfo(Isolate);

    Obj->Set(Context, POEnv->SymbolCSPtr.Get(Isolate), v8::External::New(Context->GetIsolate(), runtimeObject));
}
static void SetRuntimeObjectToPersistentObject(pesapi_env env, pesapi_value pvalue, void* runtimeObject)
{
    v8::Local<v8::Context> Context;
    memcpy(static_cast<void*>(&Context), &env, sizeof(env));
    v8::Local<v8::Object> Obj;
    memcpy(static_cast<void*>(&Obj), &pvalue, sizeof(pvalue));

    _SetRuntimeObjectToPersistentObject(Context, Obj, runtimeObject);
}

static void* FunctionToDelegate(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Func, const JSClassDefinition* ClassDefinition)
{
    //auto MaybeDelegate = Func->Get(Context, 0);
    
    //TODO: 缓存delegate，实现用同一个function可以remove
    //if (!MaybeDelegate.IsEmpty() && MaybeDelegate.ToLocalChecked()->IsExternal())
    //{
    //    PersistentObjectInfo* delegateInfo = static_cast<PersistentObjectInfo*>((v8::Local<v8::External>::Cast(MaybeDelegate.ToLocalChecked()))->Value());
    //}
    void* Ptr = _GetRuntimeObjectFromPersistentObject(Context, Func);
    if (Ptr == nullptr)
    {
        JsClassInfo* classInfo = reinterpret_cast<JsClassInfo*>(ClassDefinition->Data);

        PersistentObjectInfo* delegateInfo = nullptr;
        Ptr = GUnityExports.DelegateAllocate(classInfo->Class, classInfo->DelegateBridge, &delegateInfo);
        memset(delegateInfo, 0, sizeof(PersistentObjectInfo));
        delegateInfo->EnvInfo = DataTransfer::GetPersistentObjectEnvInfo(Isolate);
        
        delegateInfo->JsObject.Reset(Isolate, Func);
        delegateInfo->JsEnvLifeCycleTracker = DataTransfer::GetJsEnvLifeCycleTracker(Isolate);
        _SetRuntimeObjectToPersistentObject(Context, Func, Ptr);
    }
    
    return Ptr;
}

static void* FunctionToDelegate(v8::Local<v8::Context> Context, v8::Local<v8::Object> Func, const void* TypeId, bool throwIfFail)
{
    auto ClassDefinition = FindClassByID(TypeId, true);
    if (!ClassDefinition)
    {
        if (throwIfFail)
        {
            DataTransfer::ThrowException(Context->GetIsolate(), "call not load type of delegate");
        }
        return nullptr;
    }
    return FunctionToDelegate(Context->GetIsolate(), Context, Func, ClassDefinition);
}

static void* FunctionToDelegate_pesapi(pesapi_env env, pesapi_value pvalue, const void* TypeId, bool throwIfFail)
{
    //TODO: pesapi 数据到v8的转换应该交给pesapi实现来提供
    v8::Local<v8::Context> Context;
    memcpy(static_cast<void*>(&Context), &env, sizeof(env));
    v8::Local<v8::Value> Func;
    memcpy(static_cast<void*>(&Func), &pvalue, sizeof(pvalue));
    if (!Func->IsFunction()) return nullptr;
    return FunctionToDelegate(Context, Func.As<v8::Object>(), TypeId, throwIfFail);
}

static void SetPersistentObject(pesapi_env env, pesapi_value pvalue, PersistentObjectInfo* objectInfo)
{
    v8::Local<v8::Context> Context;
    memcpy(static_cast<void*>(&Context), &env, sizeof(env));
    v8::Local<v8::Object> Obj;
    memcpy(static_cast<void*>(&Obj), &pvalue, sizeof(pvalue));
    
    v8::Isolate* Isolate = Context->GetIsolate();
    
    objectInfo->EnvInfo = DataTransfer::GetPersistentObjectEnvInfo(Isolate);;
    objectInfo->JsObject.Reset(Isolate, Obj);
    objectInfo->JsEnvLifeCycleTracker = DataTransfer::GetJsEnvLifeCycleTracker(Isolate);
}

static v8::Value* GetPersistentObject(v8::Context* env, const PersistentObjectInfo* objectInfo)
{    
    if (objectInfo->JsEnvLifeCycleTracker.expired())
    {
        GUnityExports.ThrowInvalidOperationException("JsEnv had been destroy");
        return nullptr;
    }
    
    v8::Isolate* Isolate = env->GetIsolate();
    
    if (Isolate != objectInfo->EnvInfo->Isolate)
    {
        GUnityExports.ThrowInvalidOperationException("js object from other JsEnv");
        return nullptr;
    }
    
    return *objectInfo->JsObject.Get(Isolate);
}

static void* JsValueToCSRef(v8::Local<v8::Context> context, v8::Local<v8::Value> val, const void *typeId)
{
    return GUnityExports.JsValueToCSRef(typeId, *context, *val);
}

static bool IsDelegate(const void* typeId)
{
    return GUnityExports.IsDelegate(typeId);
}

static void* NewArray(const void *typeId, uint32_t length)
{
    return GUnityExports.NewArray(typeId, length);
}

static void* GetArrayFirstElementAddress(void *array)
{
    return GUnityExports.GetArrayFirstElementAddress(array);
}

static void ArraySetRef(void *array, uint32_t index, void* value)
{
    GUnityExports.ArraySetRef(array, index, value);
}

static const void* GetArrayElementTypeId(const void *typeId)
{
    return GUnityExports.GetArrayElementTypeId(typeId);
}

static uint32_t GetArrayLength(void *array)
{
    return GUnityExports.GetArrayLength(array);
}

static void* GetDefaultValuePtr(const void* methodInfo, uint32_t index)
{
    return GUnityExports.GetDefaultValuePtr(methodInfo, index);
}

//type != typeof(object) && !type.IsValueType 
inline static v8::Local<v8::Value> CSRefToJsValue(v8::Isolate* Isolate, v8::Local<v8::Context> Context, void* Obj)
{
    if (!Obj)
    {
        return v8::Undefined(Isolate);
    }
    
    pesapi_value jsVal = GUnityExports.TryTranslateBuiltin(*Context, Obj);
    
    if (jsVal)
    {
        v8::Local<v8::Value> Ret;
        memcpy(static_cast<void*>(&Ret), &jsVal, sizeof(jsVal));
        return Ret;
    }
    
    void* Class = *reinterpret_cast<void**>(Obj);
    
    return DataTransfer::FindOrAddCData(Isolate, Context, Class, Obj, true);
}

//type == typeof(object)
inline static v8::Local<v8::Value> CSAnyToJsValue(v8::Isolate* Isolate, v8::Local<v8::Context> Context, void* Obj)
{
    pesapi_value jsVal = GUnityExports.TryTranslatePrimitive(*Context, Obj);
    
    if (jsVal)
    {
        v8::Local<v8::Value> Ret;
        memcpy(static_cast<void*>(&Ret), &jsVal, sizeof(jsVal));
        return Ret;
    }
    
    return CSRefToJsValue(Isolate, Context, Obj);
}

inline static v8::Local<v8::Value> CopyValueType(v8::Isolate* Isolate, v8::Local<v8::Context> Context, const void* TypeId, const void* Ptr, size_t SizeOfValueType)
{
    void* buff =  GUnityExports.ObjectAllocate(TypeId); //TODO: allc by jsenv
    memcpy(buff, Ptr, SizeOfValueType);
    return DataTransfer::FindOrAddCData(Isolate, Context, TypeId, buff, false);
}

inline static const void* GetTypeId(v8::Local<v8::Object> Obj)
{
    return puerts::DataTransfer::GetPointerFast<void>(Obj, 1);
}

inline static bool IsAssignableFrom(const void* typeId, const void* typeId2)
{
    return GUnityExports.IsAssignableFrom(typeId, typeId2);
}

inline static void* IsInst(void * obj, void* typeId)
{
    return GUnityExports.IsInst(obj, typeId);
}

inline static void FieldGet(void *obj, void *fieldInfo, size_t offset, void *value)
{
    GUnityExports.FieldGet(obj, fieldInfo, offset, value);
}

inline static void FieldSet(void *obj, void *fieldInfo, size_t offset, void *value)
{
    GUnityExports.FieldSet(obj, fieldInfo, offset, value);
}

inline static void* GetValueTypeFieldPtr(void *obj, void *fieldInfo, size_t offset)
{
    return GUnityExports.GetValueTypeFieldPtr(obj, fieldInfo, offset);
}

inline static void ThrowInvalidOperationException(const char* msg)
{
    GUnityExports.ThrowInvalidOperationException(msg);
}

inline static void* CStringToCSharpString(const char* str)
{
    return GUnityExports.CStringToCSharpString(str);
}

inline static const void* GetReturnType(const void* method)
{
    return GUnityExports.GetReturnType(method);
}

inline const void* GetParameterType(const void* method, int index)
{
    return GUnityExports.GetParameterType(method, index);
}

static void* DelegateCtorCallback(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    v8::Isolate* Isolate = Info.GetIsolate();
    v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
    if (!Info[0]->IsFunction()) 
    {
        DataTransfer::ThrowException(Context->GetIsolate(), "expect a function");
        return nullptr;
    }
    
    JSClassDefinition* ClassDefinition =
        reinterpret_cast<JSClassDefinition*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
        
    return FunctionToDelegate(Isolate, Context, Info[0]->ToObject(Context).ToLocalChecked(), ClassDefinition);
}

static void UnrefJsObject(PersistentObjectInfo* objectInfo)
{
    if (!objectInfo->JsEnvLifeCycleTracker.expired())
    {
        std::lock_guard<std::mutex> guard(objectInfo->EnvInfo->Mutex);
        objectInfo->EnvInfo->PendingReleaseObjects.push_back(std::move(objectInfo->JsObject));
        //PLog("add jsobject to pending release list");
    }
    objectInfo->EnvInfo = nullptr;
}

template <typename T>
struct RestArguments
{
    static void* PackPrimitive(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info, const void* typeId, int start)
    {
        void* ret = NewArray(typeId, info.Length() - start > 0 ? info.Length() - start : 0);
        T* arr = static_cast<T*>(GetArrayFirstElementAddress(ret));
        for(int i = start; i < info.Length();++i)
        {
            arr[i - start] = converter::Converter<T>::toCpp(context, info[i]);
        }
        return ret;
    }
    
    static void* PackString(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info, const void* typeId, int start)
    {
        auto isolate = context->GetIsolate();
        void* ret = NewArray(typeId, info.Length() - start > 0 ? info.Length() - start : 0);
        for(int i = start; i < info.Length();++i)
        {
            v8::String::Utf8Value t(isolate, info[i]);
            ArraySetRef(ret, i - start, CStringToCSharpString(*t));
        }
        return ret;
    }
    
    static void* PackRef(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info, const void* typeId, int start)
    {
        auto isolate = context->GetIsolate();
        void* ret = NewArray(typeId, info.Length() - start > 0 ? info.Length() - start : 0);
        auto elemTypeId = GetArrayElementTypeId(typeId);
        for(int i = start; i < info.Length();++i)
        {
            ArraySetRef(ret, i - start, JsValueToCSRef(context, info[i], elemTypeId));
        }
        return ret;
    }
    
    static void* PackValueType(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info, const void* typeId, int start)
    {
        auto isolate = context->GetIsolate();
        void* ret = NewArray(typeId, info.Length() - start > 0 ? info.Length() - start : 0);
        T* arr = static_cast<T*>(GetArrayFirstElementAddress(ret));
        //auto elemTypeId = GetArrayElementTypeId(typeId);
        for(int i = start; i < info.Length();++i)
        {
            T* e = DataTransfer::GetPointer<T>(context, info[i]);
            if (!e) continue;
            arr[i - start] = *e;
        }
        return ret;
    }
    
    static void UnPackPrimitive(v8::Local<v8::Context> context, void* array, uint32_t arrayLength, const void* typeId, v8::Local<v8::Value> *Argv)
    {
        T* arr = static_cast<T*>(GetArrayFirstElementAddress(array));
        for (int i = 0; i < arrayLength; ++i)
        {
            Argv[i] = converter::Converter<T>::toScript(context, arr[i]);
        }
    }
    
    static void UnPackRefOrBoxedValueType(v8::Local<v8::Context> context, void* array, uint32_t arrayLength, const void* typeId, v8::Local<v8::Value> *Argv)
    {
        auto isolate = context->GetIsolate();
        void** arr = static_cast<void**>(GetArrayFirstElementAddress(array));
        for (int i = 0; i < arrayLength; ++i)
        {
            Argv[i] = CSAnyToJsValue(isolate, context, arr[i]);
        }
    }
    
    static void UnPackValueType(v8::Local<v8::Context> context, void* array, uint32_t arrayLength, const void* typeId, v8::Local<v8::Value> *Argv)
    {
        auto isolate = context->GetIsolate();
        T* arr = static_cast<T*>(GetArrayFirstElementAddress(array));
        auto elemTypeId = GetArrayElementTypeId(typeId);
        for (int i = 0; i < arrayLength; ++i)
        {
            Argv[i] = CopyValueType(isolate, context, elemTypeId, &arr[i], sizeof(T));
        }
    }
};

template <typename T>
struct OptionalParameter
{
    static T GetPrimitive(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info, const void* methodInfo, int index)
    {
        if (index < info.Length())
        {
            return converter::Converter<T>::toCpp(context, info[index]);
        }
        else
        {
            auto pret = (T*)GetDefaultValuePtr(methodInfo, index);
            if (pret) 
            {
                return *pret;
            }
            return {};
        }
    }
    
    static T GetValueType(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info, const void* methodInfo, int index)
    {
        if (index < info.Length())
        {
            return (*DataTransfer::GetPointer<T>(context, info[index]));
        }
        else
        {
            auto pret = (T*)GetDefaultValuePtr(methodInfo, index);
            if (pret) 
            {
                return *pret;
            }
            T ret;
            memset(&ret, 0, sizeof(T));
            return ret;
        }
    }
    
    static void* GetString(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info, const void* methodInfo, int index)
    {
        if (index < info.Length())
        {
            v8::String::Utf8Value t(context->GetIsolate(), info[index]);
            return CStringToCSharpString(*t);
        }
        else
        {
            return GetDefaultValuePtr(methodInfo, index);
        }
    }
    
    static void* GetRefType(v8::Local<v8::Context> context, const v8::FunctionCallbackInfo<v8::Value>& info, const void* methodInfo, int index, const void* typeId)
    {
        if (index < info.Length())
        {
            return JsValueToCSRef(context, info[index], typeId);
        }
        else
        {
            return GetDefaultValuePtr(methodInfo, index);
        }
    }
};

struct BridgeFuncInfo
{
    const char* Signature;
    MethodPointer Method;
};

struct WrapFuncInfo
{
    const char* Signature;
    WrapFuncPtr Method;
};

struct FieldWrapFuncInfo
{
    const char* Signature;
    FieldWrapFuncPtr Getter;
    FieldWrapFuncPtr Setter;
};

#include "FunctionBridge.Gen.h"

MethodPointer FindBridgeFunc(const char* signature)
{
    auto begin = &g_bridgeFuncInfos[0];
    auto end = &g_bridgeFuncInfos[sizeof(g_bridgeFuncInfos) / sizeof(BridgeFuncInfo) - 1];
    auto first = std::lower_bound(begin, end, signature, [](const BridgeFuncInfo& x, const char* signature) {return strcmp(x.Signature, signature) < 0;});
    if (first != end && strcmp(first->Signature, signature) == 0) {
        return first->Method;
    }
    return nullptr;
}

WrapFuncPtr FindWrapFunc(const char* signature)
{
    auto begin = &g_wrapFuncInfos[0];
    auto end = &g_wrapFuncInfos[sizeof(g_wrapFuncInfos) / sizeof(WrapFuncInfo) - 1];
    auto first = std::lower_bound(begin, end, signature, [](const WrapFuncInfo& x, const char* signature) {return strcmp(x.Signature, signature) < 0;});
    if (first != end && strcmp(first->Signature, signature) == 0) {
        return first->Method;
    }
    return nullptr;
}

FieldWrapFuncInfo * FindFieldWrapFuncInfo(const char* signature)
{
    auto begin = &g_fieldWrapFuncInfos[0];
    auto end = &g_fieldWrapFuncInfos[sizeof(g_fieldWrapFuncInfos) / sizeof(FieldWrapFuncInfo) - 1];
    auto first = std::lower_bound(begin, end, signature, [](const FieldWrapFuncInfo& x, const char* signature) {return strcmp(x.Signature, signature) < 0;});
    if (first != end && strcmp(first->Signature, signature) == 0) {
        return first;
    }
    return nullptr;
}

struct JSEnv
{
    JSEnv()
    {
        if (!GPlatform)
        {
#if defined(WITH_NODEJS)
            int Argc = 2;
            char* ArgvIn[] = {"puerts", "--no-harmony-top-level-await"};
            char ** Argv = uv_setup_args(Argc, ArgvIn);
            Args = new std::vector<std::string>(Argv, Argv + Argc);
            ExecArgs = new std::vector<std::string>();
            Errors = new std::vector<std::string>();

            GPlatform = node::MultiIsolatePlatform::Create(4);
            v8::V8::InitializePlatform(GPlatform.get());
            v8::V8::Initialize();
            int ExitCode = node::InitializeNodeWithArgs(Args, ExecArgs, Errors);
            for (const std::string& error : *Errors)
            {
                printf("InitializeNodeWithArgs failed\n");
            }
#else
            GPlatform = v8::platform::NewDefaultPlatform();
            v8::V8::InitializePlatform(GPlatform.get());
            v8::V8::Initialize();
#endif
        }
        
#if defined(WITH_NODEJS)
        std::string Flags = "--stack_size=856";
#else
        std::string Flags = "--no-harmony-top-level-await --stack_size=856";
#endif
        Flags += " --expose-gc";
#if PLATFORM_IOS
        Flags += " --jitless --no-expose-wasm";
#endif
        v8::V8::SetFlagsFromString(Flags.c_str(), static_cast<int>(Flags.size()));
        
#if defined(WITH_NODEJS)
        NodeUVLoop = new uv_loop_t;
        const int Ret = uv_loop_init(NodeUVLoop);
        if (Ret != 0)
        {
            // TODO log
            printf("uv_loop_init failed\n");
            return;
        }

        NodeArrayBufferAllocator = node::ArrayBufferAllocator::Create();
        // PLog(puerts::Log, "[PuertsDLL][JSEngineWithNode]isolate");

        auto Platform = static_cast<node::MultiIsolatePlatform*>(GPlatform.get());
        MainIsolate = node::NewIsolate(NodeArrayBufferAllocator.get(), NodeUVLoop,
            Platform);

        MainIsolate->SetMicrotasksPolicy(v8::MicrotasksPolicy::kAuto);
#else
        v8::StartupData SnapshotBlob;
        SnapshotBlob.data = (const char *)SnapshotBlobCode;
        SnapshotBlob.raw_size = sizeof(SnapshotBlobCode);
        v8::V8::SetSnapshotDataBlob(&SnapshotBlob);

        // 初始化Isolate和DefaultContext
        CreateParams = new v8::Isolate::CreateParams();
        CreateParams->array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
        
        MainIsolate = v8::Isolate::New(*CreateParams);
#endif
        auto Isolate = MainIsolate;
        
        v8::Isolate::Scope Isolatescope(Isolate);
        v8::HandleScope HandleScope(Isolate);

        v8::Local<v8::Context> Context = v8::Context::New(Isolate);
        v8::Context::Scope ContextScope(Context);
        
        MainContext.Reset(Isolate, Context);
#if defined(WITH_NODEJS)
        v8::Local<v8::Object> Global = Context->Global();
        auto strConsole = v8::String::NewFromUtf8(Isolate, "console").ToLocalChecked();
        v8::Local<v8::Value> Console = Global->Get(Context, strConsole).ToLocalChecked();

        NodeIsolateData = node::CreateIsolateData(Isolate, NodeUVLoop, Platform, NodeArrayBufferAllocator.get()); // node::FreeIsolateData
    
        NodeEnv = CreateEnvironment(NodeIsolateData, Context, *Args, *ExecArgs, node::EnvironmentFlags::kOwnsProcessState);

        Global->Set(Context, strConsole, Console).Check();

        v8::MaybeLocal<v8::Value> LoadenvRet = node::LoadEnvironment(
            NodeEnv,
            "const publicRequire ="
            "  require('module').createRequire(process.cwd() + '/');"
            "globalThis.require = publicRequire;");

        if (LoadenvRet.IsEmpty())  // There has been a JS exception.
        {
            return;
        }
#endif
        CppObjectMapper.Initialize(Isolate, Context);
        Isolate->SetData(MAPPER_ISOLATE_DATA_POS, static_cast<ICppObjectMapper*>(&CppObjectMapper));
        Isolate->SetData(1, &BackendEnv);
        
        Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, "loadType").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& Info)
        {
            v8::Isolate* Isolate = Info.GetIsolate();
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
            v8::Context::Scope ContextScope(Context);
    
            auto pom = static_cast<puerts::FCppObjectMapper*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
            
            auto type = GUnityExports.CSharpTypeToTypeId(DataTransfer::GetPointer<void>(Context, Info[0]));
            if (!type)
            {
                DataTransfer::ThrowException(Isolate, "expect a c# type");
                return;
            }
            
            auto Ret = pom->LoadTypeById(Isolate, Context, type);
            
            if (!Ret.IsEmpty())
            {
                Info.GetReturnValue().Set(Ret);
            }
            
        }, v8::External::New(Isolate, &CppObjectMapper))->GetFunction(Context).ToLocalChecked()).Check();
        
        Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, "log").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info)
        {
            std::string str = *(v8::String::Utf8Value(info.GetIsolate(), info[0]));
            
            if (GLogCallback)
            {
                GLogCallback(str.c_str());
            }
        })->GetFunction(Context).ToLocalChecked()).Check();

        Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, "__puer_execute_module_sync__").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info)
        {
            v8::Isolate* Isolate = info.GetIsolate();
            v8::Isolate::Scope IsolateScope(Isolate);
            v8::HandleScope HandleScope(Isolate);
            v8::Local<v8::Context> Context = Isolate->GetCurrentContext();
            v8::Context::Scope ContextScope(Context);

            v8::Local<v8::String> Specifier_v8 = info[0]->ToString(Context).ToLocalChecked();

            auto emptyStrV8 = v8::String::NewFromUtf8(Isolate, "", v8::NewStringType::kNormal).ToLocalChecked();
            v8::ScriptOrigin origin(emptyStrV8,
                            v8::Integer::New(Isolate, 0),                      // line offset
                            v8::Integer::New(Isolate, 0),                    // column offset
                            v8::True(Isolate),                    // is cross origin
                            v8::Local<v8::Integer>(),                 // script id
                            v8::Local<v8::Value>(),                   // source map URL
                            v8::False(Isolate),                   // is opaque (?)
                            v8::False(Isolate),                   // is WASM
                            v8::True(Isolate),                    // is ES Module
                            v8::PrimitiveArray::New(Isolate, 10)
            );
            v8::ScriptCompiler::Source source(emptyStrV8, origin);
            v8::Local<v8::Module> entryModule = v8::ScriptCompiler::CompileModule(Isolate, &source, v8::ScriptCompiler::kNoCompileOptions)
                    .ToLocalChecked();

            v8::MaybeLocal<v8::Module> mod = puerts::esmodule::ResolveModule(Context, Specifier_v8, entryModule);
            if (mod.IsEmpty())
            {
                // TODO
                return;
            }
            v8::Local<v8::Module> moduleChecked = mod.ToLocalChecked();
            if (!puerts::esmodule::LinkModule(Context, moduleChecked))
            {
                // TODO
                return;
            }
            v8::Maybe<bool> ret = moduleChecked->InstantiateModule(Context, puerts::esmodule::ResolveModule);
            if (ret.IsNothing() || !ret.ToChecked())
            {
                // TODO
                return;
            }
            v8::MaybeLocal<v8::Value> evalRet = moduleChecked->Evaluate(Context);
            if (evalRet.IsEmpty())
            {
                // TODO
                return;
            }
            info.GetReturnValue().Set(moduleChecked->GetModuleNamespace());

        })->GetFunction(Context).ToLocalChecked()).Check();
        MainIsolate->SetHostInitializeImportMetaObjectCallback(&puerts::esmodule::HostInitializeImportMetaObject);

        MainIsolate->SetPromiseRejectCallback(&PromiseRejectCallback<puerts::BackendEnv>);
        Context->Global()->Set(Context, v8::String::NewFromUtf8(MainIsolate, "__tgjsSetPromiseRejectCallback").ToLocalChecked(), v8::FunctionTemplate::New(Isolate, &SetPromiseRejectCallback<puerts::BackendEnv>)->GetFunction(Context).ToLocalChecked()).Check();
    }
    
    ~JSEnv()
    {
        CppObjectMapper.UnInitialize(MainIsolate);
        BackendEnv.PathToModuleMap.clear();
        BackendEnv.ScriptIdToPathMap.clear();
        BackendEnv.JsPromiseRejectCallback.Reset();
        if (BackendEnv.Inspector)
        {
            delete BackendEnv.Inspector;
            BackendEnv.Inspector = nullptr;
        }

#if defined(WITH_NODEJS)
        // node::EmitExit(NodeEnv);
        node::Stop(NodeEnv);
        node::FreeEnvironment(NodeEnv);
        node::FreeIsolateData(NodeIsolateData);
        auto Platform = static_cast<node::MultiIsolatePlatform*>(GPlatform.get());
        bool platform_finished = false;
        Platform->AddIsolateFinishedCallback(MainIsolate, [](void* data) {
            *static_cast<bool*>(data) = true;
        }, &platform_finished);
        Platform->UnregisterIsolate(MainIsolate);
#endif
        MainContext.Reset();
        MainIsolate->Dispose();
#if WITH_NODEJS
        // Wait until the platform has cleaned up all relevant resources.
        while (!platform_finished)
        {
            uv_run(NodeUVLoop, UV_RUN_ONCE);
        }

        int err = uv_loop_close(NodeUVLoop);
        assert(err == 0);
        delete NodeUVLoop;
#else
        delete CreateParams->array_buffer_allocator;
        delete CreateParams;
#endif
    }
    
    v8::Isolate* MainIsolate;
    v8::Global<v8::Context> MainContext;
    
    v8::Isolate::CreateParams* CreateParams;
    
    puerts::FCppObjectMapper CppObjectMapper;
    puerts::BackendEnv BackendEnv;

#if defined(WITH_NODEJS)
    uv_loop_t* NodeUVLoop;
    std::unique_ptr<node::ArrayBufferAllocator> NodeArrayBufferAllocator;
    node::IsolateData* NodeIsolateData;
    node::Environment* NodeEnv;

    const float UV_LOOP_DELAY = 0.1;
#endif
};

}


#ifdef __cplusplus
extern "C" {
#endif

V8_EXPORT int GetLibBackend()
{
#if WITH_NODEJS
    return puerts::Backend::Node;
#elif WITH_QUICKJS
    return puerts::Backend::QuickJS;
#else
    return puerts::Backend::V8;
#endif
}

V8_EXPORT puerts::JSEnv* CreateNativeJSEnv()
{
    return new puerts::JSEnv();
}

V8_EXPORT void DestroyNativeJSEnv(puerts::JSEnv* jsEnv)
{
    delete jsEnv;
}

V8_EXPORT void SetLogCallback(puerts::LogCallback Log)
{
    puerts::GLogCallback = Log;
}

V8_EXPORT pesapi_env_holder GetPesapiEnvHolder(puerts::JSEnv* jsEnv)
{
    v8::Isolate* Isolate = jsEnv->MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = jsEnv->MainContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    
    auto env = reinterpret_cast<pesapi_env>(*Context);
    return pesapi_hold_env(env);
}

V8_EXPORT puerts::JsClassInfo* CreateCSharpTypeInfo(const char* name, const void* type_id, const void* super_type_id, void* klass, bool isValueType, bool isDelegate, const char* delegateSignature)
{
    puerts::MethodPointer delegateBridge = nullptr;
    if (isDelegate)
    {
        delegateBridge = puerts::FindBridgeFunc(delegateSignature);
        if (!delegateBridge) return nullptr;
    }
    puerts::JsClassInfo* ret = new puerts::JsClassInfo();
    ret->Name = name;
    ret->TypeId = type_id;
    ret->SuperTypeId = super_type_id;
    ret->Class = klass;
    ret->IsValueType = isValueType;
    ret->DelegateBridge = delegateBridge;
    
    return ret;
}

V8_EXPORT void ReleaseCSharpTypeInfo(puerts::JsClassInfo* classInfo)
{
    //TODO: 有内存泄漏，需要释放里面的内容
    delete classInfo;
}

static void SetParamArrayFlagAndOptionalNum(puerts::WrapData* data, const char* signature)
{
    data->HasParamArray = false;
    data->OptionalNum = 0;
    
    const char* p = signature;
    while(*p)
    {
        if (*p == 'V')
        {
            data->HasParamArray = true;
        }
        if (*p == 'D')
        {
            ++data->OptionalNum;
        }
        ++p;
    }
}

V8_EXPORT puerts::WrapData* AddConstructor(puerts::JsClassInfo* classInfo, const char* signature, void* method, puerts::MethodPointer methodPointer, int typeInfoNum)
{
    //puerts::PLog("ctor %s -> %s", classInfo->Name.c_str(), signature);
    puerts::WrapFuncPtr WrapFunc = puerts::FindWrapFunc(signature);
    if (!WrapFunc)
    {
        WrapFunc = puerts::GUnityExports.ReflectionWrapper;
    }
    if (!WrapFunc) return nullptr;
    int allocSize = sizeof(puerts::WrapData) + sizeof(void*) * typeInfoNum;
    puerts::WrapData* data = (puerts::WrapData*)malloc(allocSize);
    memset(data, 0, allocSize);
    data->Method = method;
    data->MethodPointer = methodPointer;
    data->Wrap = WrapFunc;
    data->IsStatic = false;
    data->IsExtensionMethod = false;
    SetParamArrayFlagAndOptionalNum(data, signature);
    
    classInfo->Ctors.push_back(data);
    return data;
}

V8_EXPORT puerts::WrapData* AddMethod(puerts::JsClassInfo* classInfo, const char* signature, const char* name, bool isStatic, bool isExtensionMethod, bool isGetter, bool isSetter, void* method, puerts::MethodPointer methodPointer, int typeInfoNum)
{
    puerts::WrapFuncPtr WrapFunc = puerts::FindWrapFunc(signature);
    if (!WrapFunc)
    {
        WrapFunc = puerts::GUnityExports.ReflectionWrapper;
    }
    if (!WrapFunc) return nullptr;
    int allocSize = sizeof(puerts::WrapData) + sizeof(void*) * typeInfoNum;
    puerts::WrapData* data = (puerts::WrapData*)malloc(allocSize);
    memset(data, 0, allocSize);
    data->Method = method;
    data->MethodPointer = methodPointer;
    data->Wrap = WrapFunc;
    data->IsStatic = isStatic;
    data->IsExtensionMethod = isExtensionMethod;
    SetParamArrayFlagAndOptionalNum(data, signature);
    
    for(int i = 0; i < classInfo->Methods.size(); ++i)
    {
        if (classInfo->Methods[i].IsStatic == isStatic && classInfo->Methods[i].IsGetter == isGetter && classInfo->Methods[i].IsGetter == isGetter && classInfo->Methods[i].Name == name)
        {
            if (isGetter || isSetter) // no overload for getter or setter
            {
                free(data);
                return nullptr;
            }
            //puerts::PLog("add overload for %s, %s", name, signature);
            classInfo->Methods[i].OverloadDatas.push_back(data);
            return data;
        }
    }
    
    //puerts::PLog("%s %d %d %d %p", name, typeInfoNum, allocSize, sizeof(puerts::WrapData), data);
    std::vector<puerts::WrapData*> OverloadDatas;
    OverloadDatas.push_back(data);
    classInfo->Methods.push_back({std::string(name), isStatic, isGetter, isSetter, std::move(OverloadDatas)});
    return data;
}

V8_EXPORT bool AddField(puerts::JsClassInfo* classInfo, const char* signature, const char* name, bool is_static, void* fieldInfo, int offset, void* fieldTypeInfo)
{
    puerts::FieldWrapFuncInfo* wrapFuncInfo = puerts::FindFieldWrapFuncInfo(signature);
    puerts::FieldWrapFuncPtr Getter = nullptr;
    puerts::FieldWrapFuncPtr Setter = nullptr;
    if (wrapFuncInfo) 
    {
        Getter = wrapFuncInfo->Getter;
        Setter = wrapFuncInfo->Setter;
    }
    else
    {
        Getter = puerts::GUnityExports.ReflectionGetFieldWrapper;
        Setter = puerts::GUnityExports.ReflectionSetFieldWrapper;
    }
    if (!Getter && !Setter)
    {
        return false;
    }
    puerts::FieldWrapData* data = new puerts::FieldWrapData();
    data->Getter = Getter;
    data->Setter = Setter;
    data->FieldInfo = fieldInfo;
    data->Offset = offset;
    data->TypeInfo = fieldTypeInfo;
    
    classInfo->Fields.push_back({std::string(name), is_static, data});
    return true;
}

V8_EXPORT void SetTypeInfo(puerts::WrapData* data, int index, void* typeInfo)
{
    data->TypeInfos[index] = typeInfo;
}

V8_EXPORT bool RegisterCSharpType(puerts::JsClassInfo* classInfo)
{
    std::lock_guard<std::recursive_mutex> guard(puerts::RegisterMutex());
    if (puerts::FindClassByID(classInfo->TypeId))
    {
        ReleaseCSharpTypeInfo(classInfo);
        return true;
    }
    
    puerts::JSClassDefinition ClassDef = JSClassEmptyDefinition;
    ClassDef.ScriptName = classInfo->Name.c_str();
    ClassDef.TypeId = classInfo->TypeId;
    ClassDef.SuperTypeId = classInfo->SuperTypeId;
    
    ClassDef.Initialize = classInfo->DelegateBridge ? puerts::DelegateCtorCallback : puerts::GUnityExports.ConstructorCallback;
    ClassDef.Finalize = classInfo->IsValueType ? puerts::GUnityExports.ValueTypeDeallocate : (puerts::FinalizeFunc)nullptr;
    ClassDef.Data = classInfo;
    
    classInfo->Ctors.push_back(nullptr);
    classInfo->CtorWrapDatas = classInfo->Ctors.data();
    
    std::vector<puerts::JSFunctionInfo> functions{};

    std::vector<puerts::JSFunctionInfo> methods{};
    
    std::vector<puerts::JSPropertyInfo> properties{};
    
    std::vector<puerts::JSPropertyInfo> variables{};
    
    std::map<std::string, std::pair<puerts::CSharpMethodInfo*, puerts::CSharpMethodInfo*>> gseters;
    
    for (auto & method : classInfo->Methods)
    {
        method.OverloadDatas.push_back(nullptr);
        
        if (method.IsGetter || method.IsSetter)
        {
            auto iter = gseters.find(method.Name);
            if (iter == gseters.end())
            {
                gseters[method.Name] = std::make_pair<puerts::CSharpMethodInfo*, puerts::CSharpMethodInfo*>(method.IsGetter ? &method : nullptr, method.IsSetter ? &method : nullptr);
            }
            else
            {
                if (method.IsGetter)
                {
                    iter->second.first = &method;
                }
                else
                {
                    iter->second.second = &method;
                }
            }
        }
        else
        {
            if (method.IsStatic)
            {
                //puerts::PLog("add static method [%s]", method.Name.c_str());
                functions.push_back(puerts::JSFunctionInfo{method.Name.c_str(), puerts::GUnityExports.MethodCallback, method.OverloadDatas.data()});
            }
            else
            {
                //puerts::PLog("add instance method [%s]", method.Name.c_str());
                methods.push_back(puerts::JSFunctionInfo{method.Name.c_str(), puerts::GUnityExports.MethodCallback, method.OverloadDatas.data()});
            }
        }
        //puerts::WrapData** wrapDatas = reinterpret_cast<puerts::WrapData**>(method.OverloadDatas.data());
    }
    
    for (auto const& kv: gseters)
    {
        auto geter_or_setter = kv.second.first ? kv.second.first : kv.second.second;
        if (geter_or_setter->IsStatic)
        {
            variables.push_back(puerts::JSPropertyInfo{
                geter_or_setter->Name.c_str(), 
                kv.second.first ? puerts::GUnityExports.MethodCallback : nullptr, 
                kv.second.second ? puerts::GUnityExports.MethodCallback: nullptr, 
                kv.second.first ? kv.second.first->OverloadDatas.data() : nullptr, 
                kv.second.second ? kv.second.second->OverloadDatas.data() : nullptr
                });
        }
        else
        {
            properties.push_back(puerts::JSPropertyInfo{
                geter_or_setter->Name.c_str(), 
                kv.second.first ? puerts::GUnityExports.MethodCallback : nullptr, 
                kv.second.second ? puerts::GUnityExports.MethodCallback: nullptr, 
                kv.second.first ? kv.second.first->OverloadDatas.data() : nullptr, 
                kv.second.second ? kv.second.second->OverloadDatas.data() : nullptr
                });
        }
    }
    
    for (auto & field : classInfo->Fields)
    {
        if (field.IsStatic)
        {
            variables.push_back(puerts::JSPropertyInfo{field.Name.c_str(), puerts::GetterCallback, puerts::SetterCallback, field.Data, field.Data});
        }
        else
        {
            properties.push_back(puerts::JSPropertyInfo{field.Name.c_str(), puerts::GetterCallback, puerts::SetterCallback, field.Data, field.Data});
        }
    }
    
    functions.push_back({nullptr, nullptr, nullptr});
    ClassDef.Functions = functions.data();
    //puerts::PLog("static size %d", (int)functions.size());

    methods.push_back({nullptr, nullptr, nullptr});
    ClassDef.Methods = methods.data();
    //puerts::PLog("instance size %d", (int)methods.size());
    
    properties.push_back({nullptr, nullptr, nullptr, nullptr});
    ClassDef.Properties = properties.data();
    
    variables.push_back({nullptr, nullptr, nullptr, nullptr});
    ClassDef.Variables = variables.data();

    puerts::RegisterJSClass(ClassDef);
    
    return true;
}

V8_EXPORT void ExchangeAPI(puerts::UnityExports * exports)
{
    exports->SetNativePtr = &puerts::SetNativePtr;
    exports->UnrefJsObject = &puerts::UnrefJsObject;
    exports->FunctionToDelegate = &puerts::FunctionToDelegate_pesapi;
    exports->SetPersistentObject = &puerts::SetPersistentObject;
    exports->GetPersistentObject = &puerts::GetPersistentObject;
    exports->SetRuntimeObjectToPersistentObject = &puerts::SetRuntimeObjectToPersistentObject;
    exports->GetRuntimeObjectFromPersistentObject = &puerts::GetRuntimeObjectFromPersistentObject;
    puerts::GUnityExports = *exports;
}

V8_EXPORT void SetObjectPool(puerts::JSEnv* jsEnv, void* ObjectPoolAddMethodInfo, puerts::ObjectPoolAddFunc ObjectPoolAdd, void* ObjectPoolRemoveMethodInfo, puerts::ObjectPoolRemoveFunc ObjectPoolRemove, void* ObjectPoolInstance)
{
    jsEnv->CppObjectMapper.ObjectPoolAddMethodInfo = ObjectPoolAddMethodInfo;
    jsEnv->CppObjectMapper.ObjectPoolAdd = ObjectPoolAdd;
    jsEnv->CppObjectMapper.ObjectPoolRemoveMethodInfo = ObjectPoolRemoveMethodInfo;
    jsEnv->CppObjectMapper.ObjectPoolRemove = ObjectPoolRemove;
    jsEnv->CppObjectMapper.ObjectPoolInstance = ObjectPoolInstance;
}

V8_EXPORT void SetTryLoadCallback(void* tryLoadMethodInfo, puerts::LazyLoadTypeFunc tryLoad)
{
    puerts::GTryLoadTypeMethodInfo = tryLoadMethodInfo;
    puerts::GTryLazyLoadType = tryLoad;
    puerts::SetLazyLoadCallback(puerts::LazyLoad);
}

V8_EXPORT void SetObjectToGlobal(puerts::JSEnv* jsEnv, const char* key, void *obj)
{
    if (obj)
    {
        v8::Isolate* Isolate = jsEnv->MainIsolate;
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = jsEnv->MainContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        
        void* klass = *reinterpret_cast<void**>(obj);
        Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, key).ToLocalChecked(), puerts::DataTransfer::FindOrAddCData(Isolate, Context, klass, obj, true)).Check();
    }
}

V8_EXPORT void ReleasePendingJsObjects(puerts::JSEnv* jsEnv)
{
    v8::Isolate* Isolate = jsEnv->MainIsolate;
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    
    jsEnv->CppObjectMapper.ClearPendingPersistentObject(Isolate, jsEnv->MainContext.Get(Isolate));
}

V8_EXPORT void CreateInspector(puerts::JSEnv* jsEnv, int32_t Port)
{
    jsEnv->BackendEnv.CreateInspector(jsEnv->MainIsolate, &jsEnv->MainContext, Port);
}

V8_EXPORT void DestroyInspector(puerts::JSEnv* jsEnv)
{
    jsEnv->BackendEnv.DestroyInspector(jsEnv->MainIsolate, &jsEnv->MainContext);
}

V8_EXPORT int InspectorTick(puerts::JSEnv* jsEnv)
{
    return jsEnv->BackendEnv.InspectorTick() ? 1 : 0;
}

V8_EXPORT void LogicTick(puerts::JSEnv* jsEnv)
{
#ifdef WITH_NODEJS
    v8::Isolate* Isolate = jsEnv->MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = jsEnv->MainContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    uv_run(jsEnv->NodeUVLoop, UV_RUN_NOWAIT);
    static_cast<node::MultiIsolatePlatform*>(puerts::GPlatform.get())->DrainTasks(Isolate);
#endif
}

#ifdef __cplusplus
}
#endif


