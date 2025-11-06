/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include <EASTL/vector.h>
#include <EASTL/allocator_malloc.h>
#include <cstdlib>
#include <cstring>

#include "CppObjectMapperPython.h"

namespace pesapi
{
namespace pythonimpl
{
struct pesapi_env_ref__
{
    explicit pesapi_env_ref__(CppObjectMapper* mapper)
        : ref_count(1), mapper_persistent(mapper), env_life_cycle_tracker(mapper->GetEnvLifeCycleTracker())
    {
    }

    ~pesapi_env_ref__()
    {
    }

    int ref_count;

    CppObjectMapper* mapper_persistent;
    eastl::weak_ptr<int> env_life_cycle_tracker;
};

struct pesapi_value_ref__ : pesapi_env_ref__
{
    explicit pesapi_value_ref__(CppObjectMapper* mapper, PyObject* v, uint32_t field_count)
        : pesapi_env_ref__(mapper), value_persistent(v), internal_field_count(field_count)
    {
        Py_XINCREF(v);
        mapper->AddStrongRefObject(value_persistent);
    }

    ~pesapi_value_ref__()
    {
        mapper_persistent->RemoveStrongRefObject(value_persistent);
        PyObject_GC_Del(value_persistent);
    }

    PyObject* value_persistent;
    uint32_t internal_field_count;
    void* internal_fields[0];
};

struct caught_exception_info
{
#if PY_MAJOR_VERSION == 3 && PY_MINOR_VERSION >= 12
    PyObject* value;
#else
    PyObject* type;
    PyObject* value;
    PyObject* traceback;
#endif
    ~caught_exception_info()
    {
#if PY_MAJOR_VERSION == 3 && PY_MINOR_VERSION >= 12
        // From PyErr_GetRaisedException
        Py_XDECREF(value);
#else
        // From PyErr_Fetch
        Py_XDECREF(type);
        Py_XDECREF(value);
        Py_XDECREF(traceback);
#endif
    }
};

struct pesapi_scope__;


struct pesapi_scope__
{
    CppObjectMapper* mapper;
    pesapi_env_ref__* env_ref = nullptr;
    caught_exception_info* caught = nullptr;

    pesapi_scope__* prev_scope;

    const static size_t SCOPE_FIX_SIZE_VALUES_SIZE = 5;
    PyObject* values[SCOPE_FIX_SIZE_VALUES_SIZE];
    uint32_t values_used;
    eastl::vector<PyObject*, eastl::allocator_malloc>* dynamic_alloc_values = nullptr;
    PyThreadState *prevThreadState = nullptr;

    explicit pesapi_scope__(CppObjectMapper* mapper)
    {
        prevThreadState = PyThreadState_Swap(mapper->threadState);
        this->mapper = mapper;
        prev_scope = (pesapi_scope__*)(mapper->getCurrentScope());
        mapper->setCurrentScope(this);
        values_used = 0;
        caught = nullptr;
    }

    PyObject** allocValue()
    {
        PyObject** ret = nullptr;
        if (values_used < SCOPE_FIX_SIZE_VALUES_SIZE)
        {
            ret = &(values[values_used++]);
        }
        else
        {
            if (!dynamic_alloc_values)
            {
                dynamic_alloc_values = (eastl::vector<PyObject*, eastl::allocator_malloc>*)PyMem_Malloc(sizeof(eastl::vector<PyObject*, eastl::allocator_malloc>));
                new (dynamic_alloc_values) eastl::vector<PyObject*, eastl::allocator_malloc>(eastl::allocator_malloc("pesapi_scope__ dynamic_alloc_values") );
            }
            ret = (PyObject**) PyMem_Malloc(sizeof(PyObject*));
            dynamic_alloc_values->push_back(Py_None);
            ret = &dynamic_alloc_values->back();
        }
        *ret = Py_None;    // Initialize to None
        return ret;
    }

#if PY_MAJOR_VERSION == 3 && PY_MINOR_VERSION >= 12
    // From PyErr_GetRaisedException
    void setCaughtException(PyObject* ex)
    {
        if (caught == nullptr)
        {
            caught = (caught_exception_info*) PyMem_Malloc(sizeof(caught_exception_info));
        }
        caught->value = ex;
    }
#else
    // From PyErr_Fetch
    void setCaughtException(PyObject * type, PyObject * value, PyObject * traceback)
    {
        if (caught == nullptr)
        {
            caught = (caught_exception_info*) PyMem_Malloc(sizeof(caught_exception_info));
        }
        caught->type = type;
        caught->value = value;
        caught->traceback = traceback;
    }
#endif

    ~pesapi_scope__()
    {
        if (caught)
        {
            caught->~caught_exception_info();
            PyMem_Free(caught);
        }
        for (size_t i = 0; i < values_used; i++)
        {
            Py_XDECREF(values[i]);
        }

        if (dynamic_alloc_values)
        {
            size_t size = dynamic_alloc_values->size();
            for (size_t i = 0; i < size; i++)
            {
                PyObject* dynamicValue = (*dynamic_alloc_values)[i];
                Py_XDECREF(dynamicValue);
            }
            dynamic_alloc_values->~vector();
            PyMem_Free(dynamic_alloc_values);
            dynamic_alloc_values = nullptr;
        }
        mapper->setCurrentScope(prev_scope);
        PyThreadState_Swap(prevThreadState);
    }
};

static_assert(sizeof(pesapi_scope_memory) >= sizeof(pesapi_scope__), "sizeof(pesapi_scope__) > sizeof(pesapi_scope_memory__)");

struct pesapi_callback_info__
{
    void* self;    // self object in Python
    const void* selfTypeId;    // typeId of self object
    PyObject* args;    // arguments passed to the callback
    int argc;          // number of arguments
    void* data;        // user data passed to the callback
    PyObject* res;     // result of the callback
    const char* ex;    // exception if any occurred during the callback
    char* ex_owned;    // owned copy of exception string for memory safety
    CppObjectMapper* mapper; // mapper instance
    
    pesapi_callback_info__() : self(nullptr), selfTypeId(nullptr), args(nullptr), argc(0), 
                               data(nullptr), res(nullptr), ex(nullptr), ex_owned(nullptr), mapper(nullptr) {}
    
    ~pesapi_callback_info__() {
        if (ex_owned) {
            free(ex_owned);
            ex_owned = nullptr;
            ex = nullptr;
        }
    }
    
    void setException(const char* msg) {
        if (ex_owned) {
            free(ex_owned);
            ex_owned = nullptr;
        }
        if (msg) {
            size_t len = strlen(msg);
            ex_owned = (char*)malloc(len + 1);
            if (ex_owned) {
                strcpy(ex_owned, msg);
                ex = ex_owned;
            }
        } else {
            ex = nullptr;
        }
    }
};
}    // namespace pythonimpl
}    // namespace pesapi