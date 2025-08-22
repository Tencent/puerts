﻿/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "Python.h"
#include "pesapi.h"
#include "ScriptClassRegistry.h"
#include "CppObjectMapperPython.h"

#include "PapiData.h"

namespace pesapi
{
namespace pythonimpl
{
// TODO
PyObject* CppObjectMapper::CreateFunction(pesapi_callback Callback, void* Data, pesapi_function_finalize Finalize)
{
    auto* data = (FuncFinalizeData*) PyMem_Malloc(sizeof(FuncFinalizeData));
    data->finalize = Finalize;
    data->data = Data;
    data->mapper = this;

    auto* traceObj = PyObject_New(__papi_func_tracer, &papi_func_tracer_cls_def);
    traceObj->func_tracer_udata = PyCapsule_New(data, nullptr, nullptr);

    PyObject* func_data = PyTuple_New(3);
    PyTuple_SetItem(func_data, 0, PyCapsule_New((void*) Callback, nullptr, nullptr));
    PyTuple_SetItem(func_data, 1, PyCapsule_New(Data, nullptr, nullptr));
    PyTuple_SetItem(func_data, 2, (PyObject*) traceObj);

    PyMethodDef meh[] = {{"__papi_func_tracer",
                             [](PyObject* self, PyObject* args) -> PyObject*
                             {
                                 pesapi_scope__ scope(PyInterpreterState_Get());
                                 auto callback = (pesapi_callback) PyCapsule_GetPointer(PyTuple_GetItem(args, 0), nullptr);
                                 void* data = PyCapsule_GetPointer(PyTuple_GetItem(args, 1), nullptr);
                                 pesapi_callback_info__ info = {self, args, (int) PyTuple_Size(args), data, nullptr, nullptr};
                                 callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&info));
                                 if (PyExceptionClass_Check(info.res))
                                 {
                                     PyErr_SetString(PyExc_RuntimeError, info.ex);
                                     return nullptr;
                                 }
                                 else
                                 {
                                     return info.res;
                                 }
                                 return nullptr;
                             },
                             METH_VARARGS},
        {NULL, NULL, 0, NULL}};

    return PyCFunction_New(&meh[0], func_data);
}

// TODO
PyObject* CppObjectMapper::CreateError(const char* message)
{
    PyErr_SetString(PyExc_RuntimeError, message);
    return nullptr;
}

// TODO
void CppObjectMapper::BindAndAddToCache(
    const puerts::ScriptClassDefinition* typeInfo, const void* ptr, PyObject* value, bool callFinalize)
{
}

// TODO
void CppObjectMapper::RemoveFromCache(const puerts::ScriptClassDefinition* typeInfo, const void* ptr)
{
    auto Iter = CDataCache.find(ptr);
    if (Iter != CDataCache.end())
    {
        if (typeInfo->OnExit)
        {
            typeInfo->OnExit((void*) ptr, typeInfo->Data, (void*) GetEnvPrivate(), Iter->second.UserData);
        }

        Iter->second.Remove(typeInfo->TypeId, true);
        if (!Iter->second.TypeId)    // last one
        {
            CDataCache.erase(ptr);
        }
    }
}

// TODO
PyObject* CppObjectMapper::PushNativeObject(const void* TypeId, void* ObjectPtr, bool callFinalize)
{
    return nullptr;
}

// TODO
PyObject* CppObjectMapper::MakeMethod(pesapi_callback Callback, void* Data)
{
    return nullptr;
}

// TODO
void CppObjectMapper::InitMethod(puerts::ScriptFunctionInfo* FuncInfo, PyObject* Obj)
{
}

// TODO
void CppObjectMapper::InitProperty(puerts::ScriptPropertyInfo* PropInfo, PyObject* Obj)
{
}

// TODO
PyObject* CppObjectMapper::FindOrCreateClass(const puerts::ScriptClassDefinition* ClassDefinition)
{
    auto it = TypeIdToFunctionMap.find(ClassDefinition->TypeId);
    if (it != TypeIdToFunctionMap.end())
    {
        PyObject* cls = it->second;
        Py_INCREF(cls);
        return cls;
    }

    return nullptr;
}

PyObject* CppObjectMapper::FindOrCreateClassByID(const void* typeId)
{
    auto clsDef = puerts::LoadClassByID(registry, typeId);
    if (!clsDef)
    {
        Py_RETURN_NONE;
    }
    return FindOrCreateClass(clsDef);
}

PyObject* CppObjectMapper::findClassByName(PyObject* this_val, int argc, PyObject** argv)
{
    if (argc != 1 || !PyUnicode_Check(argv[0]))
    {
        PyErr_SetString(PyExc_TypeError, "findClassByName: expect a string");
        return nullptr;
    }

    const char* typeName = PyUnicode_AsUTF8(argv[0]);
    auto clsDef = puerts::FindCppTypeClassByCName(registry, typeName);

    if (clsDef)
    {
        return FindOrCreateClass(clsDef);
    }
    else
    {
        Py_RETURN_NONE;
    }
}

void CppObjectMapper::Initialize(PyInterpreterState* State)
{
    this->state = State;
    auto dict = PyInterpreterState_GetDict(state);
    auto mapper = PyCapsule_New(this, nullptr, nullptr);
    PyDict_SetItemString(dict, "CppObjectMapper", mapper);

    PyObject_New(__papi_obj, &papi_obj_cls_def);
    PyObject_New(__papi_func_tracer, &papi_func_tracer_cls_def);

    PtrClassDef.TypeId = &PtrClassDef;
    PtrClassDef.ScriptName = "__Pointer";

    auto mapperSelf = PyCapsule_New(this, nullptr, nullptr);

    PyMethodDef methods_def = {"findClassByName",
        [](PyObject* self, PyObject* args) -> PyObject*
        {
            auto _mapper = static_cast<CppObjectMapper*>(PyCapsule_GetPointer(self, nullptr));
            PyObject* this_val = self;
            Py_ssize_t argc_ssize = PyTuple_Size(args);
            if (argc_ssize < 0)
            {
                return nullptr;
            }
            auto** argv = (PyObject**) PyMem_Malloc(sizeof(PyObject*) * (size_t) argc_ssize);
            for (Py_ssize_t i = 0; i < argc_ssize; ++i)
            {
                argv[i] = PyTuple_GetItem(args, i);
            }
            PyObject* ret = _mapper->findClassByName(this_val, (int) argc_ssize, argv);
            PyMem_Free(argv);
            return ret;
        },
        METH_VARARGS};

    auto Func = PyCFunction_New(&methods_def, mapperSelf);

    auto M = PyImport_AddModule("__main__");
    auto G = PyModule_GetDict(M);

    PyDict_SetItemString(G, "findClassByName", Func);
}

void CppObjectMapper::Cleanup()
{
    for (auto& kv : TypeIdToFunctionMap)
    {
        PyObject_GC_Del(kv.second);
    }

    for (auto& obj : StrongRefObjects)
    {
        PyObject_GC_Del(obj);
    }

    StrongRefObjects.clear();
    CDataCache.clear();
    TypeIdToFunctionMap.clear();
}
}    // namespace pythonimpl
}    // namespace pesapi

pesapi_env_ref create_py_env()
{
    Py_Initialize();

    // For debugg
    PyRun_SimpleString(
        "import tracemalloc\n"
        "import faulthandler\n"
        "faulthandler.enable()\n"
        "tracemalloc.start()");

    auto* mapper = reinterpret_cast<pesapi::pythonimpl::CppObjectMapper*>(malloc(sizeof(pesapi::pythonimpl::CppObjectMapper)));
    if (mapper)
    {
        memset(mapper, 0, sizeof(pesapi::pythonimpl::CppObjectMapper));
        new (mapper) pesapi::pythonimpl::CppObjectMapper();
        mapper->Initialize(PyInterpreterState_Get());
        return pesapi::pythonimpl::g_pesapi_ffi.create_env_ref(reinterpret_cast<pesapi_env>(PyInterpreterState_Get()));
    }
    return nullptr;
}

void destroy_py_env(pesapi_env_ref env_ref)
{
    auto state = reinterpret_cast<PyInterpreterState*>(pesapi::pythonimpl::g_pesapi_ffi.get_env_from_ref(env_ref));
    auto mapper = pesapi::pythonimpl::CppObjectMapper::Get(state);
    get_papi_ffi()->release_env_ref(env_ref);
    mapper->Cleanup();
    if (mapper)
    {
        mapper->Cleanup();
        free(mapper);
    }
    Py_Finalize();    // Finalize Python interpreter
}

pesapi_ffi* get_papi_ffi()
{
    return &pesapi::pythonimpl::g_pesapi_ffi;
}
