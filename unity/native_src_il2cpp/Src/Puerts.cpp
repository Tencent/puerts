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

static_assert(sizeof(PObjectRefInfo) <= sizeof(void*) * 2, "PersistentObjectInfo Size invalid");

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

static void* GetJsClassInfo(const void* TypeId, bool TryLazyLoad)
{
    auto ClassDefinition = FindClassByID(TypeId, TryLazyLoad);
    if (!ClassDefinition)
    {
        return nullptr;
    }
    
    return ClassDefinition->Data;
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
        //TODO: 在FBackendEnv写死了，先不修改native_src，后续需要优化
        //V8_INLINE static FBackendEnv* Get(v8::Isolate* Isolate)
        //{
        //    return (FBackendEnv*)Isolate->GetData(1);
        //}
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

V8_EXPORT pesapi_env_ref GetPapiEnvRef(puerts::JSEnv* jsEnv)
{
    v8::Isolate* Isolate = jsEnv->MainIsolate;
#ifdef THREAD_SAFE
    v8::Locker Locker(Isolate);
#endif
    v8::Isolate::Scope IsolateScope(Isolate);
    v8::HandleScope HandleScope(Isolate);
    v8::Local<v8::Context> Context = jsEnv->MainContext.Get(Isolate);
    v8::Context::Scope ContextScope(Context);
    
    auto env = reinterpret_cast<pesapi_env>(*Context); //TODO: 实现相关
    return pesapi_create_env_ref(env);
}

V8_EXPORT void ExchangeAPI(puerts::UnityExports * exports)
{
    exports->GetJsClassInfo = &puerts::GetJsClassInfo;
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


