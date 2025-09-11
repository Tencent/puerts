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

struct pesapi_scope__;

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
    void Initialize(PyThreadState *InThreadState);

    inline eastl::weak_ptr<int> GetEnvLifeCycleTracker()
    {
        return ref;
    }

    void SetRegistry(puerts::ScriptClassRegistry* InRegistry)
    {
        registry = InRegistry;
    }

    inline static CppObjectMapper* GetFromEnv(pesapi_env* mapper)
    {
        return reinterpret_cast<CppObjectMapper*>(mapper);
    }

    void* getCurrentScope()
    {
        return currentScope;
    }

    void setCurrentScope(void* scope)
    {
        currentScope = scope;
    }

    void Cleanup();

    eastl::unordered_map<const void*, FObjectCacheNode, eastl::hash<const void*>, eastl::equal_to<const void*>,
        eastl::allocator_malloc>
        CDataCache;
    eastl::unordered_map<const void*, PyObject*, eastl::hash<const void*>, eastl::equal_to<const void*>, eastl::allocator_malloc>
        TypeIdToFunctionMap;

    // coped from STL\string.h
    struct string_hash
    {
        size_t operator()(const eastl::basic_string<char,eastl::allocator_malloc>& x) const
        {
            const unsigned char* p = (const unsigned char*)x.c_str(); // To consider: limit p to at most 256 chars.
            unsigned int c, result = 2166136261U; // We implement an FNV-like string hash.
            while((c = *p++) != 0) // Using '!=' disables compiler warnings.
                result = (result * 16777619) ^ c;
            return (size_t)result;
        }
    };
    eastl::unordered_map<const puerts::ScriptClassDefinition*,
        eastl::unordered_map<eastl::basic_string<char,eastl::allocator_malloc>, puerts::ScriptFunctionInfo*,
        string_hash, eastl::equal_to<eastl::basic_string<char,eastl::allocator_malloc>>,eastl::allocator_malloc>,
    eastl::hash<const void*>, eastl::equal_to<const void*>,eastl::allocator_malloc>
        MethodMetaCache;

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

    puerts::ScriptFunctionInfo* FindFuncInfo(const puerts::ScriptClassDefinition* cls,const eastl::basic_string<char,eastl::allocator_malloc>& name);

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

    struct GetterSetterInfo
    {
        pesapi_callback getter;
        pesapi_callback setter;
        void* getterData;
        void* setterData;
        CppObjectMapper* mapper;
    };

    PyThreadState *threadState = nullptr;

private:
    eastl::shared_ptr<int> ref = eastl::allocate_shared<int>(eastl::allocator_malloc("shared_ptr"), 0);
    eastl::hash_set<PyObject*, eastl::hash<const void*>, eastl::equal_to<const void*>, eastl::allocator_malloc> StrongRefObjects;

    const char* object_udataKey = "__papi_udata";

    const char* privateDataKey = "__papi_private_data";

    const void* envPrivate = nullptr;

    puerts::ScriptClassRegistry* registry = nullptr;

    const char* classId = nullptr;
    const char* funcTracerClassId = nullptr;

    puerts::ScriptClassDefinition PtrClassDef = ScriptClassEmptyDefinition;

    void* currentScope = nullptr;
};
}    // namespace pythonimpl
}    // namespace pesapi

// ----------------begin test interface----------------
PESAPI_MODULE_EXPORT pesapi_env_ref create_py_env();

PESAPI_MODULE_EXPORT void destroy_py_env(pesapi_env_ref env_ref);

PESAPI_MODULE_EXPORT struct pesapi_ffi* get_papi_ffi();

// ----------------end test interface----------------
