/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "QjsObjectMapper.h"
#include "QjsPapiData.h"
#include "PesapiQuickjsImpl.h"

namespace PUERTS_NAMESPACE
{
namespace qjsimpl
{
static void PApiFuncFinalizer(JSRuntime* rt, JSValue val)
{
    FCppObjectMapper* mapper = reinterpret_cast<FCppObjectMapper*>(JS_GetRuntimeOpaque1(rt));
    // the class id of the tracer is not reachable without the mapper, the opaque is read by JS_GetAnyOpaque
    JSClassID ClassId = 0;
    FuncFinalizeData* data = (FuncFinalizeData*) JS_GetAnyOpaque(val, &ClassId);
    if (!data)
        return;
    if (mapper)
    {
        if (data->finalize)
        {
            data->finalize(&g_pesapi_ffi, data->data, (void*) (mapper->GetEnvPrivate()));
        }
        mapper->RemoveFuncFinalizeData(data);
    }
    js_free_rt(rt, data);
}

static void PApiObjectFinalizer(JSRuntime* rt, JSValue val)
{
    FCppObjectMapper* mapper = reinterpret_cast<FCppObjectMapper*>(JS_GetRuntimeOpaque1(rt));
    JSClassID ClassId = 0;
    ObjectUserData* object_udata = (ObjectUserData*) JS_GetAnyOpaque(val, &ClassId);
    if (!object_udata)
        return;
    if (mapper && object_udata->ptr)
    {
        if (object_udata->callFinalize && object_udata->typeInfo->Finalize)
        {
            object_udata->typeInfo->Finalize(
                &g_pesapi_ffi, object_udata->ptr, object_udata->typeInfo->Data, (void*) (mapper->GetEnvPrivate()));
        }
        if (object_udata->cached)
        {
            mapper->UnBindCppObject(object_udata->typeInfo, object_udata->ptr);
        }
    }
    js_free_rt(rt, object_udata);
}

static void PApiWeakTracerFinalizer(JSRuntime* rt, JSValue val)
{
    FCppObjectMapper* mapper = reinterpret_cast<FCppObjectMapper*>(JS_GetRuntimeOpaque1(rt));
    JSClassID ClassId = 0;
    pesapi_value_ref__* value_ref = (pesapi_value_ref__*) JS_GetAnyOpaque(val, &ClassId);
    // after the env is uninitialized the ref may be freed already (release_value_ref of an invalid env only frees the memory)
    if (!mapper || !value_ref)
        return;
    value_ref->value_persistent = JS_UNDEFINED;
    value_ref->tracer = JS_NULL;
    value_ref->tracer_alive = false;
}

JSValue FCppObjectMapper::CreateFunction(pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize)
{
    JSValue traceObj = JS_NewObjectClass(ctx, FuncTracerClassId);
    if (JS_IsException(traceObj))
    {
        return JS_EXCEPTION;
    }
    FuncFinalizeData* data = (FuncFinalizeData*) js_malloc(ctx, sizeof(FuncFinalizeData));
    data->finalize = Finalize;
    data->data = Data;
    data->mapper = this;
    JS_SetOpaque(traceObj, data);
    FuncFinalizeDatas.insert(data);

    JSValue func_data[3]{JS_MKPTR(JS_TAG_EXTERNAL, (void*) Callback), JS_MKPTR(JS_TAG_EXTERNAL, Data), traceObj};

    JSValue func = JS_NewCFunctionData(
        ctx,
        [](JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv, int magic, JSValueConst* func_data) -> JSValue
        {
            pesapi_scope__ scope(ctx);
            pesapi_callback callback = (pesapi_callback) (JS_VALUE_GET_PTR(func_data[0]));
            pesapi_callback_info__ callbackInfo{
                ctx, this_val, argc, argv, JS_VALUE_GET_PTR(func_data[1]), JS_UNDEFINED, JS_UNDEFINED};
            callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
            return finish_callback(ctx, scope, callbackInfo);
        },
        0, 0, 3, &func_data[0]);

    // JS_NewCFunctionData dups the data, the function owns the tracer (finalized with the function)
    JS_FreeValue(ctx, traceObj);

    return func;
}

JSValue FCppObjectMapper::MakeMethod(pesapi_callback Callback, void* Data)
{
    JSValue method_data[2]{JS_MKPTR(JS_TAG_EXTERNAL, (void*) Callback), JS_MKPTR(JS_TAG_EXTERNAL, Data)};

    return JS_NewCFunctionData(
        ctx,
        [](JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv, int magic, JSValueConst* method_data) -> JSValue
        {
            pesapi_callback callback = (pesapi_callback) (JS_VALUE_GET_PTR(method_data[0]));
            pesapi_scope__ scope(ctx);
            pesapi_callback_info__ callbackInfo{
                ctx, this_val, argc, argv, JS_VALUE_GET_PTR(method_data[1]), JS_UNDEFINED, JS_UNDEFINED};
            callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
            return finish_callback(ctx, scope, callbackInfo);
        },
        0, 0, 2, &method_data[0]);
}

void FCppObjectMapper::InitMethod(JSFunctionInfo* FuncInfo, JSValue Obj)
{
    JSValue func = MakeMethod(FuncInfo->Callback, FuncInfo->Data);
    if (JS_IsException(func))
    {
        JS_FreeValue(ctx, JS_GetException(ctx));
        return;
    }
    // the same as v8 (the function template set on the prototype is named): JS_NewCFunctionData creates an unnamed function
    JS_DefinePropertyValueStr(ctx, func, "name", JS_NewString(ctx, FuncInfo->Name), JS_PROP_CONFIGURABLE);
    JSAtom methodName = JS_NewAtom(ctx, FuncInfo->Name);
    JS_DefinePropertyValue(ctx, Obj, methodName, func, JS_PROP_CONFIGURABLE | JS_PROP_ENUMERABLE | JS_PROP_WRITABLE);
    JS_FreeAtom(ctx, methodName);
}

void FCppObjectMapper::InitProperty(JSPropertyInfo* PropInfo, JSValue Obj)
{
    JSValue getter = JS_UNDEFINED;
    JSValue setter = JS_UNDEFINED;
    // the same as the v8 backend: DontDelete, ReadOnly without a setter, enumerable
    int flag = JS_PROP_ENUMERABLE | JS_PROP_HAS_ENUMERABLE | JS_PROP_HAS_CONFIGURABLE | JS_PROP_HAS_GET | JS_PROP_HAS_SET;

    if (PropInfo->Getter)
    {
        getter = MakeMethod(PropInfo->Getter, PropInfo->GetterData);
    }

    if (PropInfo->Setter)
    {
        setter = MakeMethod(PropInfo->Setter, PropInfo->SetterData);
    }

    JSAtom propName = JS_NewAtom(ctx, PropInfo->Name);
    JS_DefineProperty(ctx, Obj, propName, JS_UNDEFINED, getter, setter, flag);
    JS_FreeAtom(ctx, propName);
    JS_FreeValue(ctx, getter);
    JS_FreeValue(ctx, setter);
}

JSValue FCppObjectMapper::NewObjectOfClass(JSValue Ctor)
{
    JSValue proto = JS_GetProperty(ctx, Ctor, PrototypeAtom);
    JSValue obj = JS_NewObjectProtoClass(ctx, proto, ClassId);
    JS_FreeValue(ctx, proto);
    return obj;
}

static JSValue CDataNew(JSContext* ctx, JSValueConst new_target, int argc, JSValueConst* argv, int magic, JSValueConst* ctor_data)
{
    const JSClassDefinition* clsDef = (const JSClassDefinition*) (JS_VALUE_GET_PTR(ctor_data[0]));
    FCppObjectMapper* mapper = (FCppObjectMapper*) (JS_VALUE_GET_PTR(ctor_data[1]));

    // a constructor call passes new_target as this, a plain call passes the receiver (undefined mostly)
    if (!JS_IsFunction(ctx, new_target) || !JS_IsConstructor(ctx, new_target))
    {
        return JS_ThrowPlainError(ctx, "only call as Construct is supported!");
    }

    JSAtom prototypeAtom = JS_NewAtom(ctx, "prototype");
    JSValue proto = JS_GetProperty(ctx, new_target, prototypeAtom);
    JS_FreeAtom(ctx, prototypeAtom);
    if (JS_IsException(proto))
    {
        return JS_EXCEPTION;
    }
    JSValue self = JS_NewObjectProtoClass(ctx, proto, mapper->ClassId);
    JS_FreeValue(ctx, proto);
    if (JS_IsException(self))
    {
        return JS_EXCEPTION;
    }

    if (clsDef->Initialize)
    {
        pesapi_scope__ scope(ctx);
        pesapi_callback_info__ callbackInfo{ctx, self, argc, argv, clsDef->Data, JS_UNDEFINED, JS_UNDEFINED};
        void* ptr = clsDef->Initialize(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
        JSValue ret = finish_callback(ctx, scope, callbackInfo);
        if (JS_IsException(ret))
        {
            JS_FreeValue(ctx, self);
            return ret;
        }
        JS_FreeValue(ctx, ret);
        if (ptr)
        {
            mapper->BindCppObject(clsDef, ptr, self, false);
        }
    }
    return self;
}

JSValue FCppObjectMapper::FindOrCreateClass(const JSClassDefinition* ClassDefinition)
{
    auto it = TypeIdToFunctionMap.find(ClassDefinition->TypeId);
    if (it != TypeIdToFunctionMap.end())
    {
        return it->second.Ctor;
    }

    JSValue ctor_data[2]{JS_MKPTR(JS_TAG_EXTERNAL, (void*) ClassDefinition), JS_MKPTR(JS_TAG_EXTERNAL, this)};

    JSValue func = JS_NewCFunctionData(ctx, CDataNew, 0, 0, 2, &ctor_data[0]);
    if (JS_IsException(func))
    {
        return JS_UNDEFINED;
    }

    JS_SetConstructorBit(ctx, func, 1);

    if (OnClassCreated && OnClassCreated(ClassDefinition))
    {
#if WITH_EDITOR || !defined(UE_SHIPPING)
        if (ClassDefinition->ScriptName)
        {
            JSAtom nameAtom = JS_NewAtom(ctx, "name");
            JS_DefinePropertyValue(ctx, func, nameAtom, JS_NewString(ctx, ClassDefinition->ScriptName), JS_PROP_CONFIGURABLE);
            JS_FreeAtom(ctx, nameAtom);
        }
#endif
    }

    JSValue proto = JS_NewObject(ctx);

    JSPropertyInfo* PropertyInfo = ClassDefinition->Properties;
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

    JSFunctionInfo* FunctionInfo = ClassDefinition->Methods;
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

    JS_SetConstructor(ctx, func, proto);

    // registered before the super class, a cyclic super chain ends here
    TypeIdToFunctionMap[ClassDefinition->TypeId] = FClassEntry{func, ClassDefinition};

    if (ClassDefinition->SuperTypeId)
    {
        if (auto SuperDefinition = LoadClassByID(Registry, ClassDefinition->SuperTypeId))
        {
            JSValue super_func = FindOrCreateClass(SuperDefinition);
            if (!JS_IsUndefined(super_func))
            {
                JSValue parent_proto = JS_GetProperty(ctx, super_func, PrototypeAtom);
                JS_SetPrototype(ctx, proto, parent_proto);
                JS_FreeValue(ctx, parent_proto);
                JS_SetPrototype(ctx, func, super_func);
            }
        }
    }
    JS_FreeValue(ctx, proto);

    return func;
}

JSValue FCppObjectMapper::FindOrCreateClassByID(const void* TypeId)
{
    auto it = TypeIdToFunctionMap.find(TypeId);
    if (it != TypeIdToFunctionMap.end())
    {
        return it->second.Ctor;
    }
    auto clsDef = LoadClassByID(Registry, TypeId);
    if (!clsDef)
    {
        return JS_UNDEFINED;
    }
    return FindOrCreateClass(clsDef);
}

void FCppObjectMapper::InvalidateClass(const void* TypeId)
{
    if (OnClassInvalidated)
    {
        OnClassInvalidated(TypeId);
    }
    auto it = TypeIdToFunctionMap.find(TypeId);
    if (it != TypeIdToFunctionMap.end())
    {
        JSValue Ctor = it->second.Ctor;
        TypeIdToFunctionMap.erase(it);
        JS_FreeValue(ctx, Ctor);
    }
}

JSValue FCppObjectMapper::FindOrAddCppObject(const void* TypeId, void* Ptr, bool PassByPointer)
{
    if (!Ptr)
    {
        return JS_NULL;
    }

    if (PassByPointer)
    {
        auto Iter = CDataCache.find(Ptr);
        if (Iter != CDataCache.end())
        {
            auto CacheNodePtr = Iter->second.Find(TypeId);
            if (CacheNodePtr)
            {
                return JS_DupValue(ctx, CacheNodePtr->Value);
            }
        }
    }

    const JSClassDefinition* ClassDefinition = nullptr;
    JSValue Ctor = JS_UNDEFINED;
    auto it = TypeIdToFunctionMap.find(TypeId);
    if (it != TypeIdToFunctionMap.end())
    {
        Ctor = it->second.Ctor;
        ClassDefinition = it->second.ClassDefinition;
    }
    else if ((ClassDefinition = LoadClassByID(Registry, TypeId)) != nullptr)
    {
        Ctor = FindOrCreateClass(ClassDefinition);
    }

    if (ClassDefinition && !JS_IsUndefined(Ctor))
    {
        JSValue Obj = NewObjectOfClass(Ctor);
        if (JS_IsException(Obj))
        {
            return Obj;
        }
        BindCppObject(ClassDefinition, Ptr, Obj, PassByPointer);
        return Obj;
    }

    // a pointer of an unknown class: not cached, not finalized
    JSValue PtrCtor = FindOrCreateClass(&PtrClassDef);
    JSValue Obj = NewObjectOfClass(PtrCtor);
    if (JS_IsException(Obj))
    {
        return Obj;
    }
    ObjectUserData* object_udata = (ObjectUserData*) js_malloc(ctx, sizeof(ObjectUserData));
    object_udata->typeInfo = &PtrClassDef;
    object_udata->typeId = TypeId;
    object_udata->ptr = Ptr;
    object_udata->callFinalize = false;
    object_udata->cached = false;
    JS_SetOpaque(Obj, object_udata);
    return Obj;
}

bool FCppObjectMapper::IsInstanceOf(const void* TypeId, JSValue Obj)
{
    if (GetNativeObjectTypeId(Obj) == TypeId)
    {
        return true;
    }
    auto ClassDefinition = FindClassByID(Registry, TypeId);
    if (ClassDefinition)
    {
        JSValue Ctor = FindOrCreateClass(ClassDefinition);
        if (JS_IsUndefined(Ctor))
        {
            return false;
        }
        int Ret = JS_IsInstanceOf(ctx, Obj, Ctor);
        if (Ret < 0)
        {
            JS_FreeValue(ctx, JS_GetException(ctx));
            return false;
        }
        return Ret == 1;
    }
    return false;
}

void FCppObjectMapper::BindCppObject(const JSClassDefinition* ClassDefinition, void* Ptr, JSValue Obj, bool PassByPointer)
{
    ObjectUserData* object_udata = GetObjectUserData(Obj);
    if (!object_udata)
    {
        object_udata = (ObjectUserData*) js_malloc(ctx, sizeof(ObjectUserData));
        JS_SetOpaque(Obj, object_udata);
    }
    object_udata->typeInfo = ClassDefinition;
    object_udata->typeId = ClassDefinition->TypeId;
    object_udata->ptr = Ptr;
    object_udata->callFinalize = !PassByPointer;
    object_udata->cached = true;

    auto Iter = CDataCache.find(Ptr);
    FObjectCacheNode* CacheNodePtr;
    if (Iter != CDataCache.end())
    {
        auto Temp = Iter->second.Find(ClassDefinition->TypeId);
        CacheNodePtr = Temp ? Temp : Iter->second.Add(ClassDefinition->TypeId);
    }
    else
    {
        auto Ret = CDataCache.insert({Ptr, FObjectCacheNode(ClassDefinition->TypeId)});
        CacheNodePtr = &Ret.first->second;
    }
    // weak: the object is not ref counted by the cache
    CacheNodePtr->Value = Obj;
    CacheNodePtr->MustCallFinalize = !PassByPointer;

    if (ClassDefinition->OnEnter)
    {
        CacheNodePtr->UserData = ClassDefinition->OnEnter(Ptr, ClassDefinition->Data, (void*) GetEnvPrivate());
    }
}

void FCppObjectMapper::UnBindCppObject(const JSClassDefinition* ClassDefinition, void* Ptr)
{
    auto Iter = CDataCache.find(Ptr);
    if (Iter != CDataCache.end())
    {
        auto Node = Iter->second.Find(ClassDefinition->TypeId);
        if (!Node)
        {
            return;
        }
        if (ClassDefinition->OnExit)
        {
            ClassDefinition->OnExit(Ptr, ClassDefinition->Data, (void*) GetEnvPrivate(), Node->UserData);
        }
        Iter->second.Remove(ClassDefinition->TypeId, true);
        if (!Iter->second.TypeId)    // last one
        {
            CDataCache.erase(Iter);
        }
    }
}

bool FCppObjectMapper::UnbindNativeObject(const void* TypeId, void* Ptr)
{
    auto Iter = CDataCache.find(Ptr);
    if (Iter == CDataCache.end())
    {
        return false;
    }
    auto Node = Iter->second.Find(TypeId);
    if (!Node)
    {
        return false;
    }
    // the object stays alive (the cache does not count it), its finalizer only frees the opaque
    if (ObjectUserData* object_udata = GetObjectUserData(Node->Value))
    {
        object_udata->ptr = nullptr;
        object_udata->callFinalize = false;
        object_udata->cached = false;
    }
    void* UserData = Node->UserData;
    Iter->second.Remove(TypeId, true);
    if (!Iter->second.TypeId)    // last one
    {
        CDataCache.erase(Iter);
    }
    // OnExit runs after the cache is updated, it may free js values whose finalizers run synchronously
    auto ClassIter = TypeIdToFunctionMap.find(TypeId);
    const JSClassDefinition* ClassDefinition =
        ClassIter != TypeIdToFunctionMap.end() ? ClassIter->second.ClassDefinition : FindClassByID(Registry, TypeId);
    if (ClassDefinition && ClassDefinition->OnExit)
    {
        ClassDefinition->OnExit(Ptr, ClassDefinition->Data, (void*) GetEnvPrivate(), UserData);
    }
    return true;
}

bool FCppObjectMapper::GetPrivate(JSValue val, void** outPtr) const
{
    *outPtr = nullptr;
    if (!JS_IsObject(val))
    {
        return false;
    }
    JSPropertyDescriptor desc;
    int ret = JS_GetOwnProperty(ctx, &desc, val, PrivateDataKey);
    if (ret <= 0)
    {
        if (ret < 0)
        {
            JS_FreeValue(ctx, JS_GetException(ctx));
        }
        return ret == 0;
    }
    if (JS_VALUE_GET_TAG(desc.value) == JS_TAG_EXTERNAL)
    {
        *outPtr = JS_VALUE_GET_PTR(desc.value);
    }
    JS_FreeValue(ctx, desc.value);
    JS_FreeValue(ctx, desc.getter);
    JS_FreeValue(ctx, desc.setter);
    return true;
}

bool FCppObjectMapper::SetPrivate(JSValue val, void* ptr)
{
    if (!JS_IsObject(val))
    {
        return false;
    }
    return JS_DefinePropertyValue(
               ctx, val, PrivateDataKey, JS_MKPTR(JS_TAG_EXTERNAL, ptr), JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE) >= 0;
}

void FCppObjectMapper::Initialize(JSContext* InCtx)
{
    ctx = InCtx;
    rt = JS_GetRuntime(ctx);
    JS_SetRuntimeOpaque1(rt, this);

    JSClassDef cls_def = {};
    cls_def.class_name = "__papi_obj";
    cls_def.finalizer = PApiObjectFinalizer;
    ClassId = 0;
    JS_NewClassID(rt, &ClassId);
    JS_NewClass(rt, ClassId, &cls_def);

    JSClassDef func_tracer_cls_def = {};
    func_tracer_cls_def.class_name = "__papi_func_tracer";
    func_tracer_cls_def.finalizer = PApiFuncFinalizer;
    FuncTracerClassId = 0;
    JS_NewClassID(rt, &FuncTracerClassId);
    JS_NewClass(rt, FuncTracerClassId, &func_tracer_cls_def);

    JSClassDef weak_tracer_cls_def = {};
    weak_tracer_cls_def.class_name = "__papi_weak_tracer";
    weak_tracer_cls_def.finalizer = PApiWeakTracerFinalizer;
    WeakTracerClassId = 0;
    JS_NewClassID(rt, &WeakTracerClassId);
    JS_NewClass(rt, WeakTracerClassId, &weak_tracer_cls_def);

    PtrClassDef.TypeId = &PtrClassDef;
    PtrClassDef.ScriptName = "__Pointer";

    PrivateDataKey = JS_NewAtom(ctx, "__papi_private_data");
    PrototypeAtom = JS_NewAtom(ctx, "prototype");
}

void FCppObjectMapper::UnInitialize()
{
    if (!ctx)
    {
        return;
    }
    void* PData = (void*) GetEnvPrivate();
    // quickjs finalizers run synchronously: Finalize/OnExit below may free js values whose finalizer calls UnBindCppObject,
    // so the cache is moved out first (UnBindCppObject finds nothing), and every object is detached before any callback
    // runs (its finalizer must not finalize again, it only frees the opaque)
    auto Cache = std::move(CDataCache);
    CDataCache.clear();
    for (auto& KV : Cache)
    {
        for (FObjectCacheNode* PNode = &KV.second; PNode; PNode = PNode->Next)
        {
            if (ObjectUserData* object_udata = GetObjectUserData(PNode->Value))
            {
                object_udata->ptr = nullptr;
            }
        }
    }
    for (auto& KV : Cache)
    {
        FObjectCacheNode* PNode = &KV.second;
        while (PNode)
        {
            const JSClassDefinition* ClassDefinition = FindClassByID(Registry, PNode->TypeId);
            if (ClassDefinition)
            {
                if (PNode->MustCallFinalize && ClassDefinition->Finalize)
                {
                    ClassDefinition->Finalize(&g_pesapi_ffi, KV.first, ClassDefinition->Data, PData);
                }
                if (ClassDefinition->OnExit)
                {
                    ClassDefinition->OnExit(KV.first, ClassDefinition->Data, PData, PNode->UserData);
                }
            }
            PNode = PNode->Next;
        }
    }
    Cache.clear();

    for (FuncFinalizeData* Data : FuncFinalizeDatas)
    {
        if (Data->finalize)
        {
            Data->finalize(&g_pesapi_ffi, Data->data, PData);
            Data->finalize = nullptr;
        }
    }
    FuncFinalizeDatas.clear();

    JS_SetRuntimeOpaque1(rt, nullptr);

    for (auto& KV : TypeIdToFunctionMap)
    {
        JS_FreeValue(ctx, KV.second.Ctor);
    }
    TypeIdToFunctionMap.clear();

    for (JSValue* Obj : StrongRefObjects)
    {
        JS_FreeValue(ctx, *Obj);
        *Obj = JS_UNDEFINED;
    }
    StrongRefObjects.clear();

    JS_FreeAtom(ctx, PrivateDataKey);
    JS_FreeAtom(ctx, PrototypeAtom);
    PrivateDataKey = 0;
    PrototypeAtom = 0;

    Ref.reset();
}

}    // namespace qjsimpl
}    // namespace PUERTS_NAMESPACE
