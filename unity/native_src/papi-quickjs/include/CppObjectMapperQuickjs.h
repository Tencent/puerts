#pragma once

#include "pesapi.h"
#include "quickjs.h"
#include <unordered_map>
#include <memory>
#include "ObjectCacheNodeQuickjs.h"
#include "JSClassRegister.h"

#define JS_TAG_EXTERNAL (JS_TAG_FLOAT64 + 1)

namespace pesapi
{
namespace qjsimpl
{
    
extern pesapi_ffi g_pesapi_ffi;

struct ObjectUserData
{
    const puerts::JSClassDefinition* typeInfo;
    const void* ptr;
    bool callFinalize;
};

struct CppObjectMapper
{
    inline static CppObjectMapper* Get(JSContext* ctx)
    {
        return reinterpret_cast<CppObjectMapper*>(JS_GetRuntimeOpaque1(JS_GetRuntime(ctx)));
    }

    void Initialize(JSContext* ctx_);

    void Cleanup();
    
    CppObjectMapper(const CppObjectMapper&) = delete;
    CppObjectMapper& operator=(const CppObjectMapper&) = delete;
    
    //void* operator new(size_t) = delete;
    void operator delete(void*) = delete;

    CppObjectMapper() = default;
    ~CppObjectMapper() = default;

    std::unordered_map<const void*, FObjectCacheNode, std::hash<const void*>, std::equal_to<const void*>> CDataCache;
    std::unordered_map<const void*, JSValue, std::hash<const void*>, std::equal_to<const void*>> TypeIdToFunctionMap;

    JSRuntime* rt;
    JSContext* ctx;
    JSClassID classId;
    JSClassID funcTracerClassId;
    const void* envPrivate = nullptr;
    std::shared_ptr<int> ref = std::make_shared<int>(0);

    puerts::JSClassDefinition PtrClassDef = JSClassEmptyDefinition;

    JSAtom privateDataKey;

    inline static std::weak_ptr<int> GetEnvLifeCycleTracker(JSContext* ctx)
    {
        CppObjectMapper* mapper = Get(ctx);
        return mapper->GetEnvLifeCycleTracker();
    }

    inline std::weak_ptr<int> GetEnvLifeCycleTracker()
    {
        return std::weak_ptr<int>(ref);
    }

    inline const void* GetEnvPrivate() const
    {
        return envPrivate;
    }

    inline void SetEnvPrivate(const void* envPrivate_)
    {
        envPrivate = envPrivate_;
    }

    inline const void* GetNativeObjectPtr(JSValue val)
    {
        ObjectUserData* object_udata = (ObjectUserData*)JS_GetOpaque(val, classId);
        return object_udata ? object_udata->ptr : nullptr;
    }

    inline const void* GetNativeObjectTypeId(JSValue val)
    {
        ObjectUserData* object_udata = (ObjectUserData*)JS_GetOpaque(val, classId);
        return object_udata ? object_udata->typeInfo->TypeId : nullptr;
    }

    inline bool GetPrivate(JSValue val, void** outPrr) const
    {
        if (!JS_IsObject(val) || !JS_IsExtensible(ctx, val))
        {
            *outPrr = nullptr;
            return false;
        }
   
        JSValue data = JS_GetProperty(ctx, val, privateDataKey);
        if (JS_VALUE_GET_TAG(data) == JS_TAG_EXTERNAL)
        {
            *outPrr = JS_VALUE_GET_PTR(data);
        }
        else
        {
            *outPrr = nullptr;
            JS_FreeValue(ctx, data);
        }
        return true;
    }

    inline bool SetPrivate(JSValue val, void* ptr)
    {
        if (!JS_IsObject(val) || !JS_IsExtensible(ctx, val))
        {
            return false;
        }
        JS_SetProperty(ctx, val, privateDataKey, JS_MKPTR(JS_TAG_EXTERNAL, ptr));
        return true;
    }

    JSValue CreateFunction(pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize);

    JSValue FindOrCreateClassByID(const void* typeId);

    static JSValue CreateError(JSContext* ctx, const char* message);

    JSValue MakeMethod(pesapi_callback Callback, void* Data);
    void InitMethod(puerts::JSFunctionInfo* FuncInfo, JSValue Obj);
    void InitProperty(puerts::JSPropertyInfo* PropInfo, JSValue Obj);

    JSValue FindOrCreateClass(const puerts::JSClassDefinition* ClassDefinition);

    void BindAndAddToCache(const puerts::JSClassDefinition* typeInfo, const void* ptr, JSValue value, bool callFinalize);

    void RemoveFromCache(const puerts::JSClassDefinition* typeInfo, const void* ptr);

    JSValue PushNativeObject(const void* TypeId, void* ObjectPtr, bool callFinalize);

    JSValue findClassByName(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data);
};

}  // namespace qjsimpl
}  // namespace pesapi

// ----------------begin test interface----------------
PESAPI_MODULE_EXPORT pesapi_env_ref create_qjs_env();
PESAPI_MODULE_EXPORT void destroy_qjs_env(pesapi_env_ref env_ref);
PESAPI_MODULE_EXPORT struct pesapi_ffi* get_papi_ffi();
// ----------------end test interface----------------
