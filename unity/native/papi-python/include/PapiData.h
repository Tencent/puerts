/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

#pragma once

#include <EASTL/string.h>

#include "CppObjectMapperPython.h"

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
        auto dict = PyInterpreterState_GetDict(state_persistent);
        if (PyObject_HasAttrString(dict, "CppObjectMapper"))
        {
            PyObject* capsule = PyObject_GetAttrString(dict, "CppObjectMapper");
            if (PyCapsule_CheckExact(capsule))
            {
                auto* mapper = static_cast<CppObjectMapper*>(PyCapsule_GetPointer(capsule, nullptr));
                if (mapper)
                {
                    mapper->Cleanup();
                }
            }
            Py_XDECREF(capsule);
            PyObject_DelAttrString(dict, "CppObjectMapper");
        }
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
    PyObject* exception;    // The caught exception
    const char* message;
};

struct pesapi_scope__
{
    PyObject* ctxVar;    // Python context var
    pesapi_env_ref__* env_ref = nullptr;
    caught_exception_info* caught = nullptr;

    explicit pesapi_scope__(PyObject* CtxVar)
    {
        this->ctxVar = CtxVar;
        PyContext_Enter(ctxVar);
        caught = nullptr;
    }

    void setCaughtException(PyObject* ex)
    {
        if (caught == nullptr)
        {
            caught = (caught_exception_info*) PyMem_Malloc(sizeof(caught_exception_info));
        }
        caught->exception = ex;
    }

    ~pesapi_scope__()
    {
        if (caught)
        {
            Py_XDECREF(caught->exception);
            PyMem_Free(caught);
        }
        PyContext_Exit(ctxVar);
        Py_XDECREF(ctxVar);
    }
};

struct pesapi_callback_info__
{
    PyObject* self;    // self object in Python
    PyObject* args;    // arguments passed to the callback
    int argc;          // number of arguments
    void* data;        // user data passed to the callback
    PyObject* res;     // result of the callback
    const char* ex;    // exception if any occurred during the callback
};
}    // namespace pythonimpl
}    // namespace pesapi
