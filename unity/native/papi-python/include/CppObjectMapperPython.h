/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <Python.h>
#include "pesapi.h"
#include <EASTL/unordered_map.h>
#include <EASTL/hash_set.h>
#include <EASTL/allocator_malloc.h>
#include <EASTL/shared_ptr.h>
#include <EASTL/string.h>

#include "ObjectCacheNodePython.h"
#include "ScriptClassRegistry.h"

namespace pesapi
{
namespace pythonimpl
{
extern pesapi_ffi g_pesapi_ffi;

struct ObjectUserData
{
    const puerts::ScriptClassDefinition* typeInfo;
    const void* ptr;
    bool callFinalize;
};

typedef struct {
    PyObject_HEAD
    const puerts::ScriptClassDefinition* classDefinition;
    class CppObjectMapper* mapper;
    void* objectPtr;
} DynObj;

class CppObjectMapper
{
public:
    PyInterpreterState* state = nullptr;

    void Initialize(PyInterpreterState* State);

    inline eastl::weak_ptr<int> GetEnvLifeCycleTracker()
    {
        return ref;
    }

    void SetRegistry(puerts::ScriptClassRegistry* InRegistry)
    {
        registry = InRegistry;
    }

    inline static CppObjectMapper* Get(PyInterpreterState* state)
    {
        auto dict = PyInterpreterState_GetDict(state);
        PyObject* pmapper = PyDict_GetItemWithError(dict, PyUnicode_FromString("CppObjectMapper"));
        auto mapper = static_cast<CppObjectMapper*>(PyCapsule_GetPointer(pmapper, nullptr));
        return mapper;
    }

    void Cleanup();

    eastl::unordered_map<const void*, FObjectCacheNode, eastl::hash<const void*>, eastl::equal_to<const void*>,
        eastl::allocator_malloc>
        CDataCache;
    eastl::unordered_map<const void*, PyObject*, eastl::hash<const void*>, eastl::equal_to<const void*>, eastl::allocator_malloc>
        TypeIdToFunctionMap;
            //新增一个哈希表，缓存方法
    eastl::unordered_map<eastl::string, puerts::ScriptFunctionInfo*, eastl::hash<eastl::string>, eastl::equal_to<eastl::string>,
        eastl::allocator_malloc>
        MethodCache;

    inline void AddStrongRefObject(PyObject* obj)
    {
        StrongRefObjects.insert(obj);
    }
    inline void RemoveStrongRefObject(PyObject* obj)
    {
        StrongRefObjects.erase(obj);
    }

    inline bool SetPrivateData(PyObject* val, void* ptr) const
    {
        if (!PyDict_Check(val))
        {
            return false;
        }
        PyDict_SetItem(val, PyUnicode_FromString(privateDataKey), PyCapsule_New(ptr, nullptr, nullptr));
        return true;
    }

    inline bool GetPrivateData(PyObject* val, void** outPtr) const
    {
        if (!PyDict_Check(val))
        {
            return false;
        }
        if (!PyDict_Contains(val, PyUnicode_FromString(privateDataKey)))
        {
            *outPtr = nullptr;
            return false;
        }
        PyObject* capsule = PyDict_GetItemWithError(val, PyUnicode_FromString(privateDataKey));
        if (PyCapsule_CheckExact(capsule))
        {
            *outPtr = PyCapsule_GetPointer(capsule, nullptr);
            Py_DECREF(capsule);
            return true;
        }
        *outPtr = nullptr;
        Py_DECREF(capsule);
        return false;
    }

    PyObject* CreateFunction(pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize);

    PyObject* FindOrCreateClassByID(const void* typeId);

    static PyObject* CreateError(const char* message);

    PyObject* MakeFunction(puerts::ScriptFunctionInfo* FuncInfo, DynObj* Obj = nullptr);

    void InitProperty(puerts::ScriptPropertyInfo* PropInfo, PyObject* Obj);

    PyObject* FindOrCreateClass(const puerts::ScriptClassDefinition* ClassDefinition);

    void BindAndAddToCache(const puerts::ScriptClassDefinition* typeInfo, const void* ptr, PyObject* value, bool callFinalize);

    void RemoveFromCache(const puerts::ScriptClassDefinition* typeInfo, const void* ptr);

    PyObject* PushNativeObject(const void* TypeId, void* ObjectPtr, bool callFinalize);

    PyObject* findClassByName(PyObject* this_val, int argc, PyObject** args);

    inline const void* GetEnvPrivate() const
    {
        return envPrivate;
    }

    inline void SetEnvPrivate(const void* envPrivate_)
    {
        envPrivate = envPrivate_;
    }

    inline static eastl::weak_ptr<int> GetEnvLifeCycleTracker(PyInterpreterState* state)
    {
        return Get(state)->GetEnvLifeCycleTracker();
    }

    inline const void* GetNativeObjectPtr(PyObject* val)
    {
        // TODO
        return nullptr;
    }

    inline const void* GetNativeObjectTypeId(PyObject* val)
    {
        // TODO
        return nullptr;
    }

    typedef struct
    {
        PyObject_HEAD PyObject* object_udata;
    } __papi_obj;

    PyTypeObject papi_obj_cls_def = []() -> PyTypeObject
    {
        PyTypeObject t{};
        t.ob_base = PyVarObject_HEAD_INIT(&PyType_Type, 0) t.tp_name = "__papi_obj";
        t.tp_basicsize = sizeof(__papi_obj);
        t.tp_flags = Py_TPFLAGS_DEFAULT;
        t.tp_new = PyType_GenericNew;
        //t.tp_is_gc = nullptr;
        t.tp_finalize = [](PyObject* self)
        {
            auto mapper = Get(PyInterpreterState_Get());
            auto* object_udata = (ObjectUserData*) ((__papi_obj*) self)->object_udata;

            if (object_udata && object_udata->ptr)
            {
                if (object_udata->callFinalize && object_udata->typeInfo->Finalize)
                {
                    object_udata->typeInfo->Finalize(
                        &g_pesapi_ffi, (void*) object_udata->ptr, object_udata->typeInfo->Data, (void*) (mapper->GetEnvPrivate()));
                }
                mapper->RemoveFromCache(object_udata->typeInfo, object_udata->ptr);
            }
            PyMem_Free(object_udata);
        };
        return t;
    }();

    typedef struct
    {
        PyObject_HEAD PyObject* func_tracer_udata;
    } __papi_func_tracer;

    struct FuncInfo
    {
        pesapi_callback callback;
        pesapi_function_finalize finalize;
        void* data;
        CppObjectMapper* mapper;
        PyMethodDef* methodDef;
    };

    /*PyTypeObject papi_func_tracer_cls_def = []() -> PyTypeObject
    {
        PyTypeObject t{};
        t.ob_base = PyVarObject_HEAD_INIT(&PyType_Type, 0) t.tp_name = "__papi_func_tracer";
        t.tp_basicsize = sizeof(__papi_func_tracer);
        t.tp_flags = Py_TPFLAGS_DEFAULT;
        t.tp_new = PyType_GenericNew;
        //t.tp_is_gc = nullptr;
        t.tp_finalize = [](PyObject* self)
        {
            auto mapper = Get(PyInterpreterState_Get());
            FuncFinalizeData* data = (FuncFinalizeData*) ((__papi_func_tracer*) self)->func_tracer_udata;
            if (data->finalize)
            {
                data->finalize(&g_pesapi_ffi, data->data, (void*) mapper->GetEnvPrivate());
            }
            PyMem_Free(data);
        };
        return t;
    }();
    */

private:
    eastl::shared_ptr<int> ref = eastl::allocate_shared<int>(eastl::allocator_malloc("shared_ptr"), 0);
    eastl::hash_set<PyObject*, eastl::hash<const void*>, eastl::equal_to<const void*>, eastl::allocator_malloc> StrongRefObjects;

    const char* object_udataKey = "__papi_udata";

    const char* func_tracer_udataKey = "__papi_func_tracer_udata";

    const char* privateDataKey = "__papi_private_data";

    const void* envPrivate = nullptr;

    puerts::ScriptClassRegistry* registry = nullptr;

    const char* classId = nullptr;
    const char* funcTracerClassId = nullptr;

    puerts::ScriptClassDefinition PtrClassDef = ScriptClassEmptyDefinition;
};
}    // namespace pythonimpl
}    // namespace pesapi

// ----------------begin test interface----------------
PESAPI_MODULE_EXPORT pesapi_env_ref create_py_env();

PESAPI_MODULE_EXPORT void destroy_py_env(pesapi_env_ref env_ref);

PESAPI_MODULE_EXPORT struct pesapi_ffi* get_papi_ffi();

// ----------------end test interface----------------
