#include <memory>

#pragma warning(push, 0)  
#include "libplatform/libplatform.h"
#include "v8.h"
#pragma warning(pop)


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
#elif defined(PLATFORM_MAC)
#include "Blob/macOS/SnapshotBlob.h"
#elif defined(PLATFORM_IOS)
#include "Blob/iOS/arm64/SnapshotBlob.h"
#elif defined(PLATFORM_LINUX)
#include "Blob/Linux/SnapshotBlob.h"
#endif

#include "CppObjectMapper.h"
#include "DataTransfer.h"
#include "pesapi.h"
#include "JSClassRegister.h"
#include "Binding.hpp"   
#include <stdarg.h>

#define USE_OUTSIZE_UNITY 1

#include "UnityExports4Puerts.h"


namespace puerts
{
static std::unique_ptr<v8::Platform> GPlatform;

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
    v8::Isolate* Isolate;
    v8::Global<v8::Context> Context;
    v8::Global<v8::Object> JsObject;
    std::weak_ptr<int> JsEnvLifeCycleTracker;
    //std::map<void*, void*> 
};

static_assert(sizeof(PersistentObjectInfo) <= sizeof(int64_t) * 8, "PersistentObjectInfo Size invalid");

void PLog(const std::string Fmt, ...)
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

typedef bool (*V8WrapFuncPtr)(void* method, MethodPointer methodPointer, const v8::FunctionCallbackInfo<v8::Value>& info, bool checkArgument, void** typeInfos);

struct CSharpMethodInfo
{
    std::string Name;
    bool IsStatic;
    bool IsGetter;
    bool IsSetter;
    std::vector<WrapData*> OverloadDatas;
};

typedef void (*V8FieldWrapFuncPtr)(const v8::FunctionCallbackInfo<v8::Value>& info, void* fieldInfo, size_t offset, void* typeInfo);

struct FieldWrapData
{
    V8FieldWrapFuncPtr Getter;
    V8FieldWrapFuncPtr Setter;
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

static void* FunctionToDelegate(v8::Isolate* Isolate, v8::Local<v8::Context> Context, v8::Local<v8::Object> Func, const JSClassDefinition* ClassDefinition)
{
    //auto MaybeDelegate = Func->Get(Context, 0);
    
    //TODO: 缓存delegate，实现用同一个function可以remove
    //if (!MaybeDelegate.IsEmpty() && MaybeDelegate.ToLocalChecked()->IsExternal())
    //{
    //    PersistentObjectInfo* delegateInfo = static_cast<PersistentObjectInfo*>((v8::Local<v8::External>::Cast(MaybeDelegate.ToLocalChecked()))->Value());
    //}
    
    JsClassInfo* classInfo = reinterpret_cast<JsClassInfo*>(ClassDefinition->Data);
    
    PersistentObjectInfo* delegateInfo = nullptr;
    void* Ptr = GUnityExports.DelegateAllocate(classInfo->Class, classInfo->DelegateBridge, &delegateInfo);
    memset(delegateInfo, 0, sizeof(PersistentObjectInfo));
    delegateInfo->Isolate = Isolate;
    delegateInfo->Context.Reset(Isolate, Context);
    delegateInfo->JsObject.Reset(Isolate, Func);
    delegateInfo->JsEnvLifeCycleTracker = DataTransfer::GetJsEnvLifeCycleTracker(Isolate);
    //Func->Set(Context, 0, v8::External::New(Context->GetIsolate(), delegateInfo));
    
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
    
    objectInfo->Isolate = Isolate;
    objectInfo->Context.Reset(Isolate, Context);
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
    
    if (Isolate != objectInfo->Isolate)
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

//TODO: Add Lock for Isolate ? Global::Reset is thread safe ?
static void UnrefJsObject(PersistentObjectInfo* objectInfo)
{
    if (!objectInfo->JsEnvLifeCycleTracker.expired())
    {
        objectInfo->JsObject.Reset();
        objectInfo->Context.Reset();
        objectInfo->Isolate = nullptr;
        //PLog(">>>>>>>>>>>>>>>>> reset delegate normal...");
    }
    //else
    //{
    //    PLog(">>>>>>>>>>>>>>>>> delegate expired, skip reset...");
    //}
    
    //PLog("delegate release: a=%d, b=%d, c=%d, d=%d, e=%d", objectInfo->a, objectInfo->b, objectInfo->c, objectInfo->d, objectInfo->e);
}

struct BridgeFuncInfo
{
    const char* Signature;
    MethodPointer Method;
};

struct WrapFuncInfo
{
    const char* Signature;
    V8WrapFuncPtr Method;
};

struct FieldWrapFuncInfo
{
    const char* Signature;
    V8FieldWrapFuncPtr Getter;
    V8FieldWrapFuncPtr Setter;
};

#include "FunctionBridge.Gen.h"

MethodPointer FindBridgeFunc(const char* signature)
{
    BridgeFuncInfo* ptr = &g_bridgeFuncInfos[0];
    while(ptr->Signature && ptr->Method)
    {
        if (strcmp(ptr->Signature, signature) == 0)
        {
            return ptr->Method;
        }
        ++ptr;
    }
    return nullptr;
}

V8WrapFuncPtr FindWrapFunc(const char* signature)
{
    WrapFuncInfo* ptr = &g_wrapFuncInfos[0];
    while(ptr->Signature && ptr->Method)
    {
        if (strcmp(ptr->Signature, signature) == 0)
        {
            return ptr->Method;
        }
        ++ptr;
    }
    return nullptr;
}

FieldWrapFuncInfo * FindFieldWrapFuncInfo(const char* signature)
{
    FieldWrapFuncInfo* ptr = &g_fieldWrapFuncInfos[0];
    while(ptr->Signature)
    {
        if (strcmp(ptr->Signature, signature) == 0)
        {
            return ptr;
        }
        ++ptr;
    }
    return nullptr;
}

struct JSEnv
{
    JSEnv()
    {
        if (!GPlatform)
        {
            GPlatform = v8::platform::NewDefaultPlatform();
            v8::V8::InitializePlatform(GPlatform.get());
            v8::V8::Initialize();
        }
        
        std::string Flags = "--no-harmony-top-level-await";
        Flags += " --expose-gc";
#if PLATFORM_IOS
        Flags += " --jitless --no-expose-wasm";
#endif
        v8::V8::SetFlagsFromString(Flags.c_str(), static_cast<int>(Flags.size()));
        
        v8::StartupData SnapshotBlob;
        SnapshotBlob.data = (const char *)SnapshotBlobCode;
        SnapshotBlob.raw_size = sizeof(SnapshotBlobCode);
        v8::V8::SetSnapshotDataBlob(&SnapshotBlob);

        // 初始化Isolate和DefaultContext
        CreateParams = new v8::Isolate::CreateParams();
        CreateParams->array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
        
        MainIsolate = v8::Isolate::New(*CreateParams);
        
        auto Isolate = MainIsolate;
        
        v8::Isolate::Scope Isolatescope(Isolate);
        v8::HandleScope HandleScope(Isolate);

        v8::Local<v8::Context> Context = v8::Context::New(Isolate);
        v8::Context::Scope ContextScope(Context);
        
        MainContext.Reset(Isolate, Context);
        
        CppObjectMapper.Initialize(Isolate, Context);
        Isolate->SetData(MAPPER_ISOLATE_DATA_POS, static_cast<ICppObjectMapper*>(&CppObjectMapper));
        
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
    }
    
    ~JSEnv()
    {
        CppObjectMapper.UnInitialize(MainIsolate);
        MainContext.Reset();
        MainIsolate->Dispose();
        delete CreateParams->array_buffer_allocator;
        delete CreateParams;
    }
    
    v8::Isolate* MainIsolate;
    v8::Global<v8::Context> MainContext;
    
    v8::Isolate::CreateParams* CreateParams;
    
    puerts::FCppObjectMapper CppObjectMapper;
};

}


#ifdef __cplusplus
extern "C" {
#endif

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

V8_EXPORT puerts::WrapData* AddConstructor(puerts::JsClassInfo* classInfo, const char* signature, void* method, puerts::MethodPointer methodPointer, int typeInfoNum)
{
    //puerts::PLog("ctor %s -> %s", classInfo->Name.c_str(), signature);
    puerts::V8WrapFuncPtr WrapFunc = puerts::FindWrapFunc(signature);
    if (!WrapFunc) return nullptr;
    int allocSize = sizeof(puerts::WrapData) + sizeof(void*) * typeInfoNum;
    puerts::WrapData* data = (puerts::WrapData*)malloc(allocSize);
    memset(data, 0, allocSize);
    data->Method = method;
    data->MethodPointer = methodPointer;
    data->Wrap = WrapFunc;
    
    classInfo->Ctors.push_back(data);
    return data;
}

V8_EXPORT puerts::WrapData* AddMethod(puerts::JsClassInfo* classInfo, const char* signature, const char* name, bool isStatic, bool isGetter, bool isSetter, void* method, puerts::MethodPointer methodPointer, int typeInfoNum)
{
    puerts::V8WrapFuncPtr WrapFunc = puerts::FindWrapFunc(signature);
    if (!WrapFunc) return nullptr;
    int allocSize = sizeof(puerts::WrapData) + sizeof(void*) * typeInfoNum;
    puerts::WrapData* data = (puerts::WrapData*)malloc(allocSize);
    memset(data, 0, allocSize);
    data->Method = method;
    data->MethodPointer = methodPointer;
    data->Wrap = WrapFunc;
    
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
    if (!wrapFuncInfo) return false;
    puerts::FieldWrapData* data = new puerts::FieldWrapData();
    data->Getter = wrapFuncInfo->Getter;
    data->Setter = wrapFuncInfo->Setter;
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
    //TODO: 加锁
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

#ifdef __cplusplus
}
#endif


