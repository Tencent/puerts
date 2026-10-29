/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "PythonInclude.h"

#if PUERTS_PAPI_PYTHON

#include "NamespaceDef.h"
#include "pesapi.h"
#include "PythonObjectMapper.h"
#include <cstddef>
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

// a pesapi_env of the python backend is the mapper of the env, a pesapi_value is a PyObject* (nullptr: None) which lives until
// the scope it is created in is closed (the new references are kept by the scope)

namespace PUERTS_NAMESPACE
{
namespace pyimpl
{
// makes the thread state of the sub interpreter of an env current (taking the GIL if no thread state is current) and
// restores the previous one
struct FPyEnvGuard
{
    explicit FPyEnvGuard(PyThreadState* Target)
    {
        PyThreadState* Cur = _PyThreadState_UncheckedGet();
        if (!Target || Cur == Target)
        {
            Mode = 0;
        }
        else if (Cur)
        {
            Prev = PyThreadState_Swap(Target);
            Mode = 1;
        }
        else
        {
            PyEval_RestoreThread(Target);
            Mode = 2;
        }
    }

    ~FPyEnvGuard()
    {
        if (Mode == 1)
        {
            PyThreadState_Swap(Prev);
        }
        else if (Mode == 2)
        {
            PyEval_SaveThread();
        }
    }

    FPyEnvGuard(const FPyEnvGuard&) = delete;
    FPyEnvGuard& operator=(const FPyEnvGuard&) = delete;

    PyThreadState* Prev = nullptr;
    int Mode = 0;
};

struct pesapi_env_ref__
{
    pesapi_env_ref__(FCppObjectMapper* InMapper)
        : Mapper(InMapper), RefCount(1), Tracker(InMapper ? InMapper->GetEnvLifeCycleTracker() : std::weak_ptr<int>())
    {
    }

    FCppObjectMapper* Mapper;
    int RefCount;
    std::weak_ptr<int> Tracker;
};

// a value ref, allocated with extra room for the internal fields (see ValueRefSize)
struct pesapi_value_ref__ : pesapi_env_ref__
{
    pesapi_value_ref__(FCppObjectMapper* InMapper, PyObject* InObj, uint32_t FieldCount)
        : pesapi_env_ref__(InMapper), Obj(InObj), InternalFieldCount(FieldCount)
    {
        for (uint32_t i = 0; i < FieldCount; ++i)
        {
            InternalFields[i] = nullptr;
        }
    }

    // a strong reference of the value, or of the weak reference to it
    PyObject* Obj;
    bool Weak = false;
    uint32_t InternalFieldCount;
    void* InternalFields[1];
};

inline size_t ValueRefSize(uint32_t FieldCount)
{
    size_t Size = offsetof(pesapi_value_ref__, InternalFields) + sizeof(void*) * FieldCount;
    return Size < sizeof(pesapi_value_ref__) ? sizeof(pesapi_value_ref__) : Size;
}

struct caught_exception_info
{
    PyObject* Type = nullptr;
    PyObject* Value = nullptr;
    PyObject* Traceback = nullptr;
    std::string Message;

    void Clear()
    {
        Py_CLEAR(Type);
        Py_CLEAR(Value);
        Py_CLEAR(Traceback);
    }
};

struct pesapi_scope__
{
    explicit pesapi_scope__(FCppObjectMapper* InMapper) : Guard(InMapper->TState), Mapper(InMapper), Caught(nullptr)
    {
        Prev = Mapper->CurrentScope;
        Mapper->CurrentScope = this;
    }

    ~pesapi_scope__()
    {
        if (Caught)
        {
            Caught->Clear();
            delete Caught;
            Caught = nullptr;
        }
        // a dealloc may create values in this scope
        while (!Values.empty())
        {
            PyObject* Value = Values.back();
            Values.pop_back();
            Py_DECREF(Value);
        }
        Mapper->CurrentScope = Prev;
    }

    // takes the references
    void SetCaught(PyObject* Type, PyObject* Value, PyObject* Traceback)
    {
        if (!Caught)
        {
            Caught = new caught_exception_info();
        }
        else
        {
            Caught->Clear();
        }
        Caught->Type = Type;
        Caught->Value = Value;
        Caught->Traceback = Traceback;
        Caught->Message.clear();
    }

    // the first member: entered first, left last
    FPyEnvGuard Guard;
    FCppObjectMapper* Mapper;
    pesapi_scope__* Prev;
    caught_exception_info* Caught;
    std::vector<PyObject*> Values;
};

static_assert(sizeof(pesapi_scope_memory) >= sizeof(pesapi_scope__), "sizeof(pesapi_scope__) > sizeof(pesapi_scope_memory)");

struct pesapi_callback_info__
{
    FCppObjectMapper* Mapper;
    // borrowed
    PyObject* This;
    PyObject* const* Args;
    int Argc;
    void* Data;
    // a new reference (set by add_return, taken by the caller)
    pesapi_value Ret = nullptr;
    bool HasEx = false;
    std::string ExMsg;
};

}    // namespace pyimpl
}    // namespace PUERTS_NAMESPACE

#endif    // PUERTS_PAPI_PYTHON
