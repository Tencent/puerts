/*
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
    auto* data = (FuncInfo*) PyMem_Malloc(sizeof(FuncInfo));
    data->callback = Callback;
    data->finalize = Finalize;
    data->data = Data;
    data->mapper = this;

    PyObject* capsule = PyCapsule_New(data, "FuncInfo",
        [](PyObject* capsule)
        {
            FuncInfo* data = reinterpret_cast<FuncInfo*>(PyCapsule_GetPointer(capsule, "FuncInfo"));
            if (data && data->finalize)
            {
                data->finalize(&pesapi::pythonimpl::g_pesapi_ffi, data->data, const_cast<void*>(data->mapper->GetEnvPrivate()));
            }
            if (data && data->methodDef)
            {
                PyMem_Free(data->methodDef);
            }
        });
    if (!capsule)
    {
        PyMem_Free(data);
        return nullptr;
    }

    // 不能用栈变量
    PyMethodDef* methodDef = (PyMethodDef*) PyMem_Malloc(sizeof(PyMethodDef));
    methodDef->ml_name ="PapiCallback";
    methodDef->ml_meth = [](PyObject* self, PyObject* args) -> PyObject*
        {
            FuncInfo* data = reinterpret_cast<FuncInfo*>(PyCapsule_GetPointer(self, "FuncInfo"));
            if (!data || !data->callback)
            {
                PyErr_SetString(PyExc_RuntimeError, "Invalid callback data");
                return nullptr;
            }
            pesapi_callback_info__ callbackInfo  { nullptr, args, PyTuple_Size(args), data->data, nullptr, nullptr };
            data->callback(&pesapi::pythonimpl::g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
            if (callbackInfo.ex)
            {
                PyErr_SetString(PyExc_RuntimeError, callbackInfo.ex);
                return nullptr;
            }

            if (callbackInfo.res)
            {
                Py_INCREF(callbackInfo.res);
                return callbackInfo.res;
            }

            Py_RETURN_NONE;
        };
    methodDef->ml_flags= METH_VARARGS;
    methodDef->ml_doc= "Puerts C++ callback wrapper";
    data->methodDef = methodDef;

    auto ret = PyCFunction_New(methodDef, capsule);
    Py_DECREF(capsule);
    return ret;
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

    // 1) 组装类名与字典
    const char* scriptName = (ClassDefinition->ScriptName && ClassDefinition->ScriptName[0])
                                 ? ClassDefinition->ScriptName
                                 : "NativeClass";

    PyObject* name  = PyUnicode_FromString(scriptName);
    PyObject* bases = PyTuple_New(0);           // 先不指定基类
    PyObject* dict  = PyDict_New();             // 类属性字典
    if (!name || !bases || !dict)
    {
        Py_XDECREF(name);
        Py_XDECREF(bases);
        Py_XDECREF(dict);
        return CreateError("FindOrCreateClass: failed to allocate name/bases/dict");
    }

    // 设置 __module__ = "__main__"，确保类在全局命名空间展示正确
    PyObject* moduleStr = PyUnicode_FromString("__main__");
    if (!moduleStr || PyDict_SetItemString(dict, "__module__", moduleStr) != 0)
    {
        Py_XDECREF(moduleStr);
        Py_DECREF(name);
        Py_DECREF(bases);
        Py_DECREF(dict);
        return CreateError("FindOrCreateClass: failed to set __module__");
    }
    Py_DECREF(moduleStr);

    // TODO: 若需要，可在此处为静态方法/静态属性预先填充（Functions/Variables）
    // 说明：实例方法/属性需要描述符/绑定，建议在后续 MakeMethod/InitMethod/InitProperty 中补齐
    if (ClassDefinition->Functions)
    {
        for (auto fi = ClassDefinition->Functions; fi && fi->Name; ++fi)
        {
            PyObject* fn = CreateFunction(fi->Callback, fi->Data, nullptr);
            if (!fn)
            {
                Py_DECREF(name);
                Py_DECREF(bases);
                Py_DECREF(dict);
                return CreateError("FindOrCreateClass: failed to create static function");
            }
            // 以函数名作为键放入类字典（静态方法）
            if (PyDict_SetItemString(dict, fi->Name, fn) != 0)
            {
                Py_DECREF(fn);
                Py_DECREF(name);
                Py_DECREF(bases);
                Py_DECREF(dict);
                return CreateError("FindOrCreateClass: failed to set static function to dict");
            }
            Py_DECREF(fn);
        }
    }

    // 2) 通过 type(name, bases, dict) 创建类对象
    PyObject* cls = PyObject_CallFunctionObjArgs((PyObject*) &PyType_Type, name, bases, dict, NULL);
    Py_DECREF(name);
    Py_DECREF(bases);
    Py_DECREF(dict);

    if (!cls)
    {
        return CreateError("FindOrCreateClass: failed to create Python type");
    }

    // 3) 注册到 __main__ 全局命名空间
    PyObject* mainMod = PyImport_AddModule("__main__"); // borrowed
    if (!mainMod)
    {
        Py_DECREF(cls);
        return CreateError("FindOrCreateClass: cannot import __main__");
    }
    PyObject* globals = PyModule_GetDict(mainMod); // borrowed
    if (!globals || PyDict_SetItemString(globals, scriptName, cls) != 0)
    {
        Py_DECREF(cls);
        return CreateError("FindOrCreateClass: failed to add class to __main__");
    }

    // 4) 写入缓存，保持强引用
    TypeIdToFunctionMap[ClassDefinition->TypeId] = cls;
    Py_INCREF(cls); // 缓存持有引用

    return cls;
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
    PyDict_SetItemOpaqueString(dict, "CppObjectMapper", this);

    PtrClassDef.TypeId = &PtrClassDef;
    PtrClassDef.ScriptName = "__Pointer";

    /*auto mapperSelf = PyCapsule_New(this, nullptr, nullptr);

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

    PyDict_SetItemString(G, "findClassByName", Func);*/
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

    // For debug
    /*PyRun_SimpleString(
        "import sys, traceback, faulthandler, tracemalloc, signal, logging, gc\n"
        //"logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s %(message)s')\n"
        //"faulthandler.enable()\n"
        //"tracemalloc.start()\n"
        //"def tracefunc(frame, event, arg):\n"
        //"    co = frame.f_code\n"
        //"    print(f'TRACE {event} {co.co_filename}:{frame.f_lineno} {co.co_name}')\n"
        //"    return tracefunc\n"
        //"sys.settrace(tracefunc)\n"
        "gc.set_debug(gc.DEBUG_UNCOLLECTABLE | gc.DEBUG_SAVEALL | gc.DEBUG_STATS)\n");*/

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
