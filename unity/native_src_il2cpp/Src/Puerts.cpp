#include <memory>

#pragma warning(push, 0)  
#include "v8.h"
#pragma warning(pop)

#if defined(WITH_NODEJS)

#pragma warning(push, 0)
#include "node.h"
#include "uv.h"
#pragma warning(pop)

#endif // WITH_NODEJS

#include "CppObjectMapper.h"
#include "DataTransfer.h"
#include "pesapi.h"
#include "JSClassRegister.h"
#include <stdarg.h>
#include "BackendEnv.h"
#include "ExecuteModuleJSCode.h"

#define USE_OUTSIZE_UNITY 1

#include "UnityExports4Puerts.h"

namespace puerts
{
enum Backend
{
    V8          = 0,
    Node        = 1,
    QuickJS     = 2,
};
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

static_assert(sizeof(PObjectRefInfo) <= sizeof(int64_t) * 8, "PersistentObjectInfo Size invalid");

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
    FieldWrapData* wrapData = static_cast<FieldWrapData*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
    wrapData->Getter(Info, wrapData->FieldInfo, wrapData->Offset, wrapData->TypeInfo);
}

static void SetterCallback(const v8::FunctionCallbackInfo<v8::Value>& Info)
{
    FieldWrapData* wrapData = static_cast<FieldWrapData*>((v8::Local<v8::External>::Cast(Info.Data()))->Value());
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

    puerts::FCppObjectMapper* mapper = static_cast<puerts::FCppObjectMapper*>(Isolate->GetData(MAPPER_ISOLATE_DATA_POS));
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


static JsClassInfoHeader* GetJsClassInfo(const void* TypeId)
{
    auto ClassDefinition = FindClassByID(TypeId, true);
    if (!ClassDefinition)
    {
        return nullptr;
    }
    
    return static_cast<JsClassInfo*>(ClassDefinition->Data);
}

static v8::Value* GetModuleExecutor(v8::Context* env)
{
    //TODO: pesapi 数据到v8的转换应该交给pesapi实现来提供
    v8::Local<v8::Context> Context;
    memcpy(static_cast<void*>(&Context), &env, sizeof(env));

    auto ret = pesapi_eval((pesapi_env) env, (const uint8_t*) ExecuteModuleJSCode, strlen(ExecuteModuleJSCode), "__puer_execute__.mjs");

    auto Isolate = Context->GetIsolate();
    v8::Local<v8::Object> Global = Context->Global();
    auto Ret = Global->Get(Context, v8::String::NewFromUtf8(Isolate, EXECUTEMODULEGLOBANAME).ToLocalChecked());
    v8::Local<v8::Value> Func;
    if (Ret.ToLocal(&Func) && Func->IsFunction())
    {
        return *Func;
    }

    return nullptr;
}

static void SetExtraData(pesapi_env env, struct PObjectRefInfo* objectInfo)
{
    v8::Local<v8::Context> Context;
    memcpy(static_cast<void*>(&Context), &env, sizeof(env));
    
    v8::Isolate* Isolate = Context->GetIsolate();
    
    objectInfo->ExtraData = DataTransfer::GetPersistentObjectEnvInfo(Isolate);
    //objectInfo->ExtraData = static_cast<puerts::FCppObjectMapper*>(Isolate->GetData(MAPPER_ISOLATE_DATA_POS));
    objectInfo->EnvLifeCycleTracker = DataTransfer::GetJsEnvLifeCycleTracker(Isolate);
}

static void UnrefJsObject(PObjectRefInfo* objectInfo)
{
    // gc线程不能访问v8虚拟机，访问就会崩溃 ///
    if (!objectInfo->EnvLifeCycleTracker.expired())
    {
        auto envInfo = static_cast<puerts::FPersistentObjectEnvInfo*>(objectInfo->ExtraData);
        std::lock_guard<std::mutex> guard(envInfo->Mutex);
        
        v8::Global<v8::Object> *obj = reinterpret_cast<v8::Global<v8::Object> *>(objectInfo->ValueRef); // TODO: 和实现绑定了，需优化
        envInfo->PendingReleaseObjects.push_back(std::move(*obj));
    }
    objectInfo->ExtraData = nullptr;
    // 两个delete，可以通过直接用PObjectRefInfo placement new的方式优化，但需要p-api新增api
    pesapi_release_value_ref(objectInfo->ValueRef);
    pesapi_release_env_ref(objectInfo->EnvRef);
}

struct JSEnv
{
    JSEnv()
    {
        puerts::FBackendEnv::GlobalPrepare();
        
#if defined(WITH_NODEJS)
        std::string Flags = "--stack_size=856";
#else
        std::string Flags = "--no-harmony-top-level-await --stack_size=856";
#endif
        Flags += " --expose-gc";
#if defined(PLATFORM_IOS) || defined(PLATFORM_OHOS)
        Flags += " --jitless --no-expose-wasm";
#endif
        v8::V8::SetFlagsFromString(Flags.c_str(), static_cast<int>(Flags.size()));
        
        BackendEnv.Initialize(nullptr, nullptr);
        MainIsolate = BackendEnv.MainIsolate;

        auto Isolate = MainIsolate;
        
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope Isolatescope(Isolate);
        v8::HandleScope HandleScope(Isolate);

        v8::Local<v8::Context> Context = BackendEnv.MainContext.Get(Isolate);;
        v8::Context::Scope ContextScope(Context);
        
        MainContext.Reset(Isolate, Context);

        CppObjectMapper.Initialize(Isolate, Context);
        Isolate->SetData(MAPPER_ISOLATE_DATA_POS, static_cast<ICppObjectMapper*>(&CppObjectMapper));
        Isolate->SetData(BACKENDENV_DATA_POS, &BackendEnv);
        
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
        
        BackendEnv.StartPolling();
    }
    
    ~JSEnv()
    {
        BackendEnv.LogicTick();
        BackendEnv.StopPolling();

        CppObjectMapper.UnInitialize(MainIsolate);
        BackendEnv.PathToModuleMap.clear();
        BackendEnv.ScriptIdToPathMap.clear();
        BackendEnv.JsPromiseRejectCallback.Reset();
        if (BackendEnv.Inspector)
        {
            delete BackendEnv.Inspector;
            BackendEnv.Inspector = nullptr;
        }

        MainContext.Reset();
        BackendEnv.UnInitialize();
    }
    
    v8::Isolate* MainIsolate;
    v8::Global<v8::Context> MainContext;
    
    puerts::FCppObjectMapper CppObjectMapper;
    puerts::FBackendEnv BackendEnv;
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

V8_EXPORT v8::Isolate* GetIsolate(puerts::JSEnv* jsEnv)
{
    return jsEnv->MainIsolate;
}

V8_EXPORT pesapi_env_ref GetPesapiEnvHolder(puerts::JSEnv* jsEnv)
{
    v8::Isolate* Isolate = jsEnv->MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = jsEnv->MainContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    
    auto env = reinterpret_cast<pesapi_env>(*Context);
    return pesapi_create_env_ref(env);
}

V8_EXPORT puerts::JsClassInfo* CreateCSharpTypeInfo(const char* name, const void* type_id, const void* super_type_id, void* klass, bool isValueType, bool isDelegate, const char* delegateSignature)
{
    puerts::MethodPointer delegateBridge = nullptr;
    if (isDelegate)
    {
        delegateBridge = puerts::GUnityExports.FindBridgeFunc(delegateSignature);
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

V8_EXPORT puerts::WrapData* AddConstructor(puerts::JsClassInfo* classInfo, const char* signature, puerts::WrapFuncPtr WrapFunc, void* method, puerts::MethodPointer methodPointer, int typeInfoNum)
{
    // puerts::PLog(puerts::LogLevel::Log, "ctor %s -> %s", classInfo->Name.c_str(), signature);
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

V8_EXPORT puerts::WrapData* AddMethod(puerts::JsClassInfo* classInfo, const char* signature, puerts::WrapFuncPtr WrapFunc, const char* name, bool isStatic, bool isExtensionMethod, bool isGetter, bool isSetter, void* method, puerts::MethodPointer methodPointer, int typeInfoNum)
{
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

V8_EXPORT bool AddField(puerts::JsClassInfo* classInfo, puerts::FieldWrapFuncPtr getter, puerts::FieldWrapFuncPtr setter, const char* name, bool is_static, void* fieldInfo, int offset, void* fieldTypeInfo)
{
    if (!getter && !setter) 
    {
        return false;
    }
    puerts::FieldWrapData* data = new puerts::FieldWrapData();
    data->Getter = getter;
    data->Setter = setter;
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
    
    ClassDef.Initialize = classInfo->DelegateBridge ? puerts::GUnityExports.DelegateConstructorCallback : puerts::GUnityExports.ConstructorCallback;
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
    exports->SetExtraData = &puerts::SetExtraData;
    exports->UnrefJsObject = &puerts::UnrefJsObject;
    exports->GetJsClassInfo = &puerts::GetJsClassInfo;
    exports->SetRuntimeObjectToPersistentObject = &puerts::SetRuntimeObjectToPersistentObject;
    exports->GetRuntimeObjectFromPersistentObject = &puerts::GetRuntimeObjectFromPersistentObject;
    exports->GetModuleExecutor = &puerts::GetModuleExecutor;
    exports->LogCallback = puerts::GLogCallback;
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
#ifdef THREAD_SAFE
        v8::Locker Locker(Isolate);
#endif
        v8::Isolate::Scope IsolateScope(Isolate);
        v8::HandleScope HandleScope(Isolate);
        v8::Local<v8::Context> Context = jsEnv->MainContext.Get(Isolate);
        v8::Context::Scope ContextScope(Context);
        
        void* klass = *static_cast<void**>(obj); //TODO: 这是Il2cpp内部实现
        Context->Global()->Set(Context, v8::String::NewFromUtf8(Isolate, key).ToLocalChecked(), puerts::DataTransfer::FindOrAddCData(Isolate, Context, klass, obj, true)).Check();
    }
}

V8_EXPORT void ReleasePendingJsObjects(puerts::JSEnv* jsEnv)
{
    v8::Isolate* Isolate = jsEnv->MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
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
    jsEnv->BackendEnv.LogicTick();
}

#ifdef __cplusplus
}
#endif


