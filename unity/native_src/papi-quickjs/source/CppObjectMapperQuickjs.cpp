#include "CppObjectMapperQuickjs.h"
#include "pesapi.h"
#include "PapiData.h"

namespace pesapi
{
namespace qjsimpl
{
struct FuncFinalizeData
{
    pesapi_function_finalize finalize;
    void* data;
    CppObjectMapper* mapper;
};

void PApiFuncFinalizer(JSRuntime* rt, JSValue val)
{
    CppObjectMapper* mapper = reinterpret_cast<CppObjectMapper*>(JS_GetRuntimeOpaque1(rt));
    FuncFinalizeData* data = (FuncFinalizeData*)JS_GetOpaque(val, mapper->funcTracerClassId);
    if (data->finalize)
    {
        data->finalize(&g_pesapi_ffi, data->data, (void*)(data->mapper->GetEnvPrivate())); // TODO: env_private 和 get_env_private 的const修饰统一
    }
    js_free_rt(rt, data);
}

JSValue CppObjectMapper::CreateFunction(pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize)
{
    FuncFinalizeData* data = (FuncFinalizeData*)js_malloc(ctx, sizeof(FuncFinalizeData));
    data->finalize = Finalize;
    data->data = Data;
    data->mapper = this;

    JSValue traceObj = JS_NewObjectClass(ctx, funcTracerClassId);
    JS_SetOpaque(traceObj, data);
    JSValue func_data[3] {
        JS_MKPTR(JS_TAG_EXTERNAL, (void*)Callback), 
        JS_MKPTR(JS_TAG_EXTERNAL, Data), 
        traceObj
        };

    JSValue func = JS_NewCFunctionData(ctx, [](JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data) -> JSValue {
        pesapi::qjsimpl::pesapi_scope__ scope(ctx);
        
        pesapi_callback callback = (pesapi_callback)(JS_VALUE_GET_PTR(func_data[0]));
        pesapi_callback_info__ callbackInfo  { ctx, this_val, argc, argv, JS_VALUE_GET_PTR(func_data[1]), JS_UNDEFINED, JS_UNDEFINED };

        callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
        if (JS_IsException(callbackInfo.res))
        {
            return JS_Throw(ctx, callbackInfo.ex);
        }
        else
        {
            return callbackInfo.res;
        }
    }, 0, 0, 3, &func_data[0]);

    JS_FreeValue(ctx, traceObj); // 在JS_NewCFunctionData有个duplicate操作，所以这里要free

    return func;
}

JSValue CppObjectMapper::CreateError(JSContext* ctx, const char* message)
{
    JSValue ret = JS_NewError(ctx);
    JSAtom message_atom = JS_NewAtom(ctx, "message");
    JS_DefinePropertyValue(ctx, ret, message_atom, JS_NewString(ctx, message), JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE);
    JS_FreeAtom(ctx, message_atom);
    return ret;
}

void PApiObjectFinalizer(JSRuntime* rt, JSValue val)
{
    CppObjectMapper* mapper = reinterpret_cast<CppObjectMapper*>(JS_GetRuntimeOpaque1(rt));
    ObjectUserData* object_udata = (ObjectUserData*)JS_GetOpaque(val, mapper->classId);

    if (object_udata && object_udata->ptr)
    {
        if (object_udata->callFinalize && object_udata->typeInfo->Finalize)
        {
            object_udata->typeInfo->Finalize(&g_pesapi_ffi, (void*)object_udata->ptr, object_udata->typeInfo->Data, (void*)(mapper->GetEnvPrivate()));
        }
        mapper->RemoveFromCache(object_udata->typeInfo, object_udata->ptr);
    }
    js_free_rt(rt, object_udata);
}

void CppObjectMapper::BindAndAddToCache(const puerts::JSClassDefinition* typeInfo, const void* ptr, JSValue value, bool callFinalize)
{
    ObjectUserData* object_udata = (ObjectUserData*)js_malloc(ctx, sizeof(ObjectUserData));
    object_udata->typeInfo = typeInfo;
    object_udata->ptr = ptr;
    object_udata->callFinalize = callFinalize;
    
    JS_SetOpaque(value, object_udata);

    auto Iter = CDataCache.find(ptr);
    FObjectCacheNode* CacheNodePtr;
    if (Iter != CDataCache.end())
    {
        CacheNodePtr = Iter->second.Add(typeInfo->TypeId);
    }
    else
    {
        auto Ret = CDataCache.insert({ptr, FObjectCacheNode(typeInfo->TypeId)});
        CacheNodePtr = &Ret.first->second;
    }
    CacheNodePtr->MustCallFinalize = callFinalize;
    CacheNodePtr->Value = value;

    if (onEnter)
    {
        CacheNodePtr->UserData = onEnter((void*)ptr, typeInfo->Data, (void*)GetEnvPrivate());
    }
}

void CppObjectMapper::RemoveFromCache(const puerts::JSClassDefinition* typeInfo, const void* ptr)
{
    auto Iter = CDataCache.find(ptr);
    if (Iter != CDataCache.end())
    {
        if (onExit)
        {
            onExit( (void*)ptr, typeInfo->Data, (void*)GetEnvPrivate(), Iter->second.UserData);
        }
        auto Removed = Iter->second.Remove(typeInfo->TypeId, true);
        if (!Iter->second.TypeId)    // last one
        {
            CDataCache.erase(ptr);
        }
    }
}

JSValue CppObjectMapper::PushNativeObject(const void* TypeId, void* ObjectPtr, bool callFinalize)
{
    if (!ObjectPtr)
    {
        return JS_UNDEFINED;
    }

    if (!callFinalize)
    {
        auto Iter = CDataCache.find(ObjectPtr);
        if (Iter != CDataCache.end())
        {
            auto CacheNodePtr = Iter->second.Find(TypeId);
            if (CacheNodePtr)
            {
                return JS_DupValue(ctx, CacheNodePtr->Value);
            }
        }
    }

    auto ClassDefinition = puerts::LoadClassByID(registry, TypeId);
    if (!ClassDefinition)
    {
        ClassDefinition = &PtrClassDef;
    }
    JSValue ctor = FindOrCreateClass(ClassDefinition);
    JSAtom prototype_atom = JS_NewAtom(ctx, "prototype");
    JSValue proto = JS_GetProperty(ctx, ctor, prototype_atom);
    JS_FreeAtom(ctx, prototype_atom);
    JSValue obj = JS_NewObjectProtoClass(ctx, proto, classId);
    JS_FreeValue(ctx, proto);
    BindAndAddToCache(ClassDefinition, ObjectPtr, obj, callFinalize);

    return obj;
}

JSValue CppObjectMapper::MakeMethod(pesapi_callback Callback, void* Data)
{
    JSValue method_data[3] {
            JS_MKPTR(JS_TAG_EXTERNAL, (void*)Callback),
            JS_MKPTR(JS_TAG_EXTERNAL, this),
             JS_MKPTR(JS_TAG_EXTERNAL, Data)
            };

    JSValue func = JS_NewCFunctionData(ctx, [](JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *method_data) -> JSValue {
        pesapi_callback callback = (pesapi_callback)(JS_VALUE_GET_PTR(method_data[0]));
        CppObjectMapper* mapper = (CppObjectMapper*)(JS_VALUE_GET_PTR(method_data[1]));
        
        pesapi::qjsimpl::pesapi_scope__ scope(ctx);
        pesapi_callback_info__ callbackInfo  { ctx, this_val, argc, argv, JS_VALUE_GET_PTR(method_data[2]), JS_UNDEFINED, JS_UNDEFINED };
        callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
        if (JS_IsException(callbackInfo.res))
        {
            JS_FreeValue(ctx, callbackInfo.res);
            return JS_Throw(ctx, callbackInfo.ex);
        }
        else
        {
            return callbackInfo.res;
        }
    }, 0, 0, 3, &method_data[0]);
    
    return func;
}

void CppObjectMapper::InitMethod(puerts::JSFunctionInfo* FuncInfo, JSValue Obj)
{
    JSValue func = MakeMethod(FuncInfo->Callback, FuncInfo->Data);

    JSAtom methodName = JS_NewAtom(ctx, FuncInfo->Name);
    JS_DefinePropertyValue(ctx, Obj, methodName, func, JS_PROP_CONFIGURABLE | JS_PROP_ENUMERABLE | JS_PROP_WRITABLE);
    JS_FreeAtom(ctx, methodName);
}

void CppObjectMapper::InitProperty(puerts::JSPropertyInfo* PropInfo, JSValue Obj)
{
    JSValue getter = JS_UNDEFINED;
    JSValue setter = JS_UNDEFINED;
    int flag = JS_PROP_CONFIGURABLE | JS_PROP_ENUMERABLE;

    if (PropInfo->Getter)
    {
        getter = MakeMethod(PropInfo->Getter, PropInfo->GetterData);
        flag |= JS_PROP_HAS_GET;
    }

    if (PropInfo->Setter)
    {
        setter = MakeMethod(PropInfo->Setter, PropInfo->SetterData);
        flag |= JS_PROP_HAS_SET;
        flag |= JS_PROP_WRITABLE;
    }

    JSAtom propName = JS_NewAtom(ctx, PropInfo->Name);
    JS_DefineProperty(ctx, Obj, propName, JS_UNDEFINED, getter, setter, flag);
    JS_FreeAtom(ctx, propName);
    JS_FreeValue(ctx, getter);
    JS_FreeValue(ctx, setter);
}

JSValue CppObjectMapper::FindOrCreateClass(const puerts::JSClassDefinition* ClassDefinition)
{
    auto it = TypeIdToFunctionMap.find(ClassDefinition->TypeId);
    if (it == TypeIdToFunctionMap.end())
    {
        JSValue ctor_data[3] {
            JS_MKPTR(JS_TAG_EXTERNAL, (void*)ClassDefinition),
            JS_MKPTR(JS_TAG_EXTERNAL, this),
            JS_MKPTR(JS_TAG_EXTERNAL, ClassDefinition->Data)
            };

        JSValue func = JS_NewCFunctionData(ctx, [](JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *ctor_data) -> JSValue {
            const puerts::JSClassDefinition* clsDef = (const puerts::JSClassDefinition*)(JS_VALUE_GET_PTR(ctor_data[0]));
            CppObjectMapper* mapper = (CppObjectMapper*)(JS_VALUE_GET_PTR(ctor_data[1]));
            
            pesapi::qjsimpl::pesapi_scope__ scope(ctx);
            if (clsDef->Initialize)
            {
                pesapi_callback_info__ callbackInfo  { ctx, this_val, argc, argv, JS_VALUE_GET_PTR(ctor_data[2]), JS_UNDEFINED, JS_UNDEFINED };
                JSAtom prototype_atom = JS_NewAtom(ctx, "prototype");
                JSValue proto = JS_GetProperty(ctx, this_val, prototype_atom);
                JS_FreeAtom(ctx, prototype_atom);
                callbackInfo.this_val = JS_NewObjectProtoClass(ctx, proto, mapper->classId);
                JS_FreeValue(ctx, proto);
                void* ptr = clsDef->Initialize(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
                if (JS_IsException(callbackInfo.res))
                {
                    JS_FreeValue(ctx, callbackInfo.this_val);
                    return JS_Throw(ctx, callbackInfo.ex);
                }
                else
                {
                    mapper->BindAndAddToCache(clsDef, ptr, callbackInfo.this_val, true);
                    return callbackInfo.this_val;
                }
            }
            else
            {
                return JS_Throw(ctx, CppObjectMapper::CreateError(ctx, "no initialize function"));
            }
        }, 0, 0, 3, &ctor_data[0]); // ref_count: 1

        JS_SetConstructorBit(ctx, func, 1);

        JSAtom name_atom = JS_NewAtom(ctx, "name");
        auto clsName = JS_NewAtom(ctx, ClassDefinition->ScriptName);
        JS_DefinePropertyValue( 
            ctx, 
            func, 
            name_atom,
            JS_AtomToString(ctx, clsName), 
            JS_PROP_CONFIGURABLE
        );
        JS_FreeAtom(ctx, name_atom);
        JS_FreeAtom(ctx, clsName);

        JSValue proto = JS_NewObject(ctx);

        puerts::JSPropertyInfo* PropertyInfo = ClassDefinition->Properties;
        while (PropertyInfo && PropertyInfo->Name)
        {
            InitProperty(PropertyInfo, proto);
            ++PropertyInfo;
        }

        PropertyInfo = ClassDefinition->Variables;
        while (PropertyInfo && PropertyInfo->Name)
        {
            InitProperty(PropertyInfo, func);
            ++PropertyInfo;
        }

        puerts::JSFunctionInfo* FunctionInfo = ClassDefinition->Methods;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            InitMethod(FunctionInfo, proto);
            ++FunctionInfo;
        }

        FunctionInfo = ClassDefinition->Functions;
        while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
        {
            InitMethod(FunctionInfo, func);
            ++FunctionInfo;
        }

        JS_SetConstructor(ctx, func, proto); // func ref_count: 2
        JS_FreeValue(ctx, proto);

        if (ClassDefinition->SuperTypeId)
        {
            if (auto SuperDefinition = puerts::LoadClassByID(registry, ClassDefinition->SuperTypeId))
            {
                JSValue super_func = FindOrCreateClass(SuperDefinition);
                JSAtom prototype_atom = JS_NewAtom(ctx, "prototype");
                JSValue parent_proto = JS_GetProperty(ctx, super_func, prototype_atom);
                JS_FreeAtom(ctx, prototype_atom);
                JS_SetPrototype(ctx, proto, parent_proto);
                JS_FreeValue(ctx, parent_proto);
            }
        }

        TypeIdToFunctionMap[ClassDefinition->TypeId] = func;
        //printf("register class %s, tid:%p, rc:%d, obj:%p\n", ClassDefinition->ScriptName, ClassDefinition->TypeId, JS_ValueRefCount(ctx, func), JS_VALUE_GET_PTR(func));
        return func;
    }
    return it->second;
}

JSValue CppObjectMapper::FindOrCreateClassByID(const void* typeId)
{
    auto clsDef = puerts::LoadClassByID(registry, typeId);
    if (!clsDef)
    {
        return JS_UNDEFINED;
    }
    return FindOrCreateClass(clsDef);
}

JSValue CppObjectMapper::findClassByName(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data)
{
    if (argc != 1 || !JS_IsString(argv[0]))
    {
        return JS_ThrowTypeError(ctx, "findClassByName: expect a string");
    }

    const char* typeName = JS_ToCString(ctx, argv[0]);
    auto clsDef = puerts::FindCppTypeClassByCName(registry, typeName);
    JS_FreeCString(ctx, typeName);

    if (clsDef)
    {
        return FindOrCreateClass(clsDef);
    }
    else
    {
        return JS_UNDEFINED;
    }
}

void CppObjectMapper::Initialize(JSContext* ctx_)
{
    ctx = ctx_;
    rt = JS_GetRuntime(ctx);
    JS_SetRuntimeOpaque1(rt, this);
    // 0x4000: DUMP_LEAKS, 0x8000: DUMP_ATOM_LEAKS
    JS_SetDumpFlags(rt, 0x4000 | 0x8000);
    //new (&CDataCache) eastl::unordered_map<const void*, FObjectCacheNode, eastl::hash<const void*>, 
    //        eastl::equal_to<const void*>, eastl::allocator_malloc>();
    //new (&TypeIdToFunctionMap) eastl::unordered_map<const void*, JSValue, eastl::hash<const void*>, 
    //        eastl::equal_to<const void*>, eastl::allocator_malloc>();

    JSClassDef cls_def;
    cls_def.class_name = "__papi_obj";
    cls_def.finalizer = PApiObjectFinalizer;
    cls_def.exotic = NULL;
    cls_def.gc_mark = NULL;
    cls_def.call = NULL;

    classId = 0;
    JS_NewClassID(rt, &classId);
    JS_NewClass(rt, classId, &cls_def);


    JSClassDef func_tracer_cls_def;
    func_tracer_cls_def.class_name = "__papi_func_tracer";
    func_tracer_cls_def.finalizer = PApiFuncFinalizer;
    func_tracer_cls_def.exotic = NULL;
    func_tracer_cls_def.gc_mark = NULL;
    func_tracer_cls_def.call = NULL;

    funcTracerClassId = 0;
    JS_NewClassID(rt, &funcTracerClassId);
    JS_NewClass(rt, funcTracerClassId, &func_tracer_cls_def);

    PtrClassDef.TypeId = &PtrClassDef;
    PtrClassDef.ScriptName = "__Pointer";

    privateDataKey = JS_NewAtom(ctx, "__papi_private_data");

    JSValue FuncData = JS_MKPTR(JS_TAG_EXTERNAL, (void*)this);
    JSValue Func = JS_NewCFunctionData(ctx, [](JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic, JSValue *func_data) -> JSValue
    {
        CppObjectMapper* Self = (CppObjectMapper*)(JS_VALUE_GET_PTR(func_data[0]));
        return Self->findClassByName(ctx, this_val, argc, argv, magic, func_data);
    }, 0, 0, 1, &FuncData);
    
    JSValue G = JS_GetGlobalObject(ctx);
    JS_SetPropertyStr(ctx, G, "findClassByName", Func);
    JS_FreeValue(ctx, G);
}

void CppObjectMapper::Cleanup()
{
    JS_FreeAtom(ctx, privateDataKey);

    auto PData = GetEnvPrivate();
    for (auto& KV : CDataCache)
    {
        FObjectCacheNode* PNode = &KV.second;
        while (PNode)
        {
            const puerts::JSClassDefinition* ClassDefinition = puerts::FindClassByID(registry, PNode->TypeId);
            // quickjs是可以保证释放的，所以这里不需要释放
            /*
            if (PNode->MustCallFinalize)
            {
                if (ClassDefinition && ClassDefinition->Finalize)
                {
                    ClassDefinition->Finalize(&g_pesapi_ffi, (void*)KV.first, ClassDefinition->Data, (void*)PData);
                }
                PNode->MustCallFinalize = false;
            }
            */
            if (!ClassDefinition)
            {
                ClassDefinition = &PtrClassDef;
            }
            if (onExit)
            {
                onExit((void*)KV.first, ClassDefinition->Data, (void*)PData, PNode->UserData);
            }
            PNode = PNode->Next;
        }
    }

    for(auto& kv : TypeIdToFunctionMap)
    {
        JS_FreeValue(ctx, kv.second);
    }

    for(auto& obj : StrongRefObjects)
    {
        JS_FreeValue(ctx, *obj);
    }
    StrongRefObjects.clear();
    CDataCache.clear();
    TypeIdToFunctionMap.clear();
    //CDataCache.~hash_map();
    //TypeIdToFunctionMap.~hash_map();
}

}
}

// ----------------begin test interface----------------

pesapi_env_ref create_qjs_env()
{
    JSRuntime* rt = JS_NewRuntime();
    // 0x4000: DUMP_LEAKS, 0x8000: DUMP_ATOM_LEAKS
    JS_SetDumpFlags(rt, 0x4000 | 0x8000);
    JSContext* ctx = JS_NewContext(rt);
    pesapi::qjsimpl::CppObjectMapper* mapper = static_cast<pesapi::qjsimpl::CppObjectMapper*>(malloc(sizeof(pesapi::qjsimpl::CppObjectMapper)));
    
    if (mapper)
    {
        memset(mapper, 0, sizeof(pesapi::qjsimpl::CppObjectMapper));
        new (mapper) pesapi::qjsimpl::CppObjectMapper();
        mapper->Initialize(ctx);
        return pesapi::qjsimpl::g_pesapi_ffi.create_env_ref(reinterpret_cast<pesapi_env>(ctx));
    }
    return nullptr;
}

void destroy_qjs_env(pesapi_env_ref env_ref)
{
    //auto scope = pesapi::qjsimpl::g_pesapi_ffi.open_scope(env_ref);
    JSContext* ctx = reinterpret_cast<JSContext*>(pesapi::qjsimpl::g_pesapi_ffi.get_env_from_ref(env_ref));
    JSRuntime* rt = JS_GetRuntime(ctx);
    pesapi::qjsimpl::CppObjectMapper* mapper = pesapi::qjsimpl::CppObjectMapper::Get(ctx);
    //pesapi::qjsimpl::g_pesapi_ffi.close_scope(scope);
    pesapi::qjsimpl::g_pesapi_ffi.release_env_ref(env_ref);
    mapper->Cleanup();
    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
    if (mapper)
    {
        mapper->~CppObjectMapper();
        free(mapper);
    }
}

struct pesapi_ffi* get_papi_ffi()
{
    return &pesapi::qjsimpl::g_pesapi_ffi;
}

// ----------------end test interface----------------