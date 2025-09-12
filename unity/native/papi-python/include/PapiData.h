﻿/*
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
    PyObject* ex;
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
    CppObjectMapper* mapper; // mapper instance
};
}    // namespace pythonimpl
}    // namespace pesapi