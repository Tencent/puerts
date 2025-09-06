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

#include "CppObjectMapperPython.h"
#include "Opaque.h"

namespace pesapi
{
namespace pythonimpl
{
struct pesapi_env_ref__
{
    explicit pesapi_env_ref__(PyInterpreterState* state)
        : ref_count(1), state_persistent(state), env_life_cycle_tracker(CppObjectMapper::GetEnvLifeCycleTracker(state))
    {
    }

    ~pesapi_env_ref__()
    {
    }

    int ref_count;

    PyInterpreterState* state_persistent;
    eastl::weak_ptr<int> env_life_cycle_tracker;
};

struct pesapi_value_ref__ : pesapi_env_ref__
{
    explicit pesapi_value_ref__(PyInterpreterState* state, PyObject* v, uint32_t field_count)
        : pesapi_env_ref__(state), value_persistent(v), internal_field_count(field_count)
    {
        Py_XINCREF(v);
        auto mapper = CppObjectMapper::Get(state);
        mapper->AddStrongRefObject(value_persistent);
    }

    ~pesapi_value_ref__()
    {
        auto mapper = CppObjectMapper::Get(state_persistent);
        mapper->RemoveStrongRefObject(value_persistent);
        PyObject_GC_Del(value_persistent);
    }

    PyObject* value_persistent;
    uint32_t internal_field_count;
    void* internal_fields[0];
};

struct caught_exception_info
{
    PyObject* ex;
};

struct pesapi_scope__;

static pesapi_scope__* getCurrentScope(PyInterpreterState* state)
{
    auto dict = PyInterpreterState_GetDict(state);
    if (PyDict_Contains(dict, PyUnicode_FromString("__papi_scope__")))
    {
        auto ret = PyDict_GetItemOpaqueString(dict, "__papi_scope__");
        if (ret)
        {
            return reinterpret_cast<pesapi_scope__*>(ret);
        }
    }
    return nullptr;
}

static void setCurrentScope(PyInterpreterState* state, pesapi_scope__* scope)
{
    auto dict = PyInterpreterState_GetDict(state);
    PyDict_SetItemOpaqueString(dict, "__papi_scope__", scope);
}

struct pesapi_scope__
{
    PyInterpreterState* state;
    pesapi_env_ref__* env_ref = nullptr;
    caught_exception_info* caught = nullptr;

    pesapi_scope__* prev_scope;

    const static size_t SCOPE_FIX_SIZE_VALUES_SIZE = 5;
    PyObject* values[SCOPE_FIX_SIZE_VALUES_SIZE];
    uint32_t values_used;
    eastl::vector<PyObject*, eastl::allocator_malloc>* dynamic_alloc_values = nullptr;

    explicit pesapi_scope__(PyInterpreterState* state)
    {
        this->state = state;
        prev_scope = getCurrentScope(state);
        setCurrentScope(state, this);
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
            }
            ret = (PyObject**) PyMem_Malloc(sizeof(PyObject*));
            dynamic_alloc_values->push_back(Py_None);
            ret = &dynamic_alloc_values->back();
        }
        *ret = Py_None;    // Initialize to None
        return ret;
    }

    void setCaughtException(PyObject* ex)
    {
        if (caught == nullptr)
        {
            caught = (caught_exception_info*) PyMem_Malloc(sizeof(caught_exception_info));
        }
        caught->ex = ex;
    }

    ~pesapi_scope__()
    {
        if (caught)
        {
            Py_XDECREF(caught->ex);
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
        setCurrentScope(state, prev_scope);
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
    PyInterpreterState* state_persistent;
};
}    // namespace pythonimpl
}    // namespace pesapi