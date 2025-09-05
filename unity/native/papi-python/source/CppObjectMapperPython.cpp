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

typedef struct
{
    PyObject_HEAD
    puerts::ScriptFunctionInfo* funcInfo;
} PyMethodObject;

static void PyMethodObject_dealloc(PyMethodObject* self)
{
    Py_TYPE(self)->tp_free((PyObject*)self);
}

static PyObject* PyMethodObject_call(PyMethodObject* self, PyObject* args, PyObject* kwargs)
{
    pesapi_callback_info__ callbackInfo  { nullptr, args, PyTuple_Size(args), self->funcInfo->Data, nullptr, nullptr };
    self->funcInfo->Callback(&pesapi::pythonimpl::g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
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
}

static PyObject* PyMethodObject_repr(PyMethodObject* self) 
{
    return PyUnicode_FromFormat("<foreign method %s>", self->funcInfo->Name);
}

static PyObject* PyMethodObject_get_name(PyMethodObject* self, void* c) 
{
    return PyUnicode_FromString(self->funcInfo->Name);
}

static PyGetSetDef PyMethodObject_getset[] = 
{
    {"__name__", (getter)PyMethodObject_get_name, NULL, NULL, NULL},
    {NULL, NULL, NULL, NULL, NULL}
};

static PyTypeObject PyMethodObject_Type = {
    PyVarObject_HEAD_INIT(NULL, 0)
    "bridge.PyMethodObject",        /* tp_name */
    sizeof(PyMethodObject),         /* tp_basicsize */
    0,                             /* tp_itemsize */
    (destructor)PyMethodObject_dealloc, /* tp_dealloc */
    0,                             /* tp_vectorcall_offset */
    0,                             /* tp_getattr */
    0,                             /* tp_setattr */
    0,                             /* tp_as_async */
    (reprfunc)PyMethodObject_repr, /* tp_repr */
    0,                             /* tp_as_number */
    0,                             /* tp_as_sequence */
    0,                             /* tp_as_mapping */
    0,                             /* tp_hash */
    (ternaryfunc)PyMethodObject_call, /* tp_call */
    0,                             /* tp_str */
    0,                             /* tp_getattro */
    0,                             /* tp_setattro */
    0,                             /* tp_as_buffer */
    Py_TPFLAGS_DEFAULT,            /* tp_flags */
    0,                             /* tp_doc */
    0,                             /* tp_traverse */
    0,                             /* tp_clear */
    0,                             /* tp_richcompare */
    0,                             /* tp_weaklistoffset */
    0,                             /* tp_iter */
    0,                             /* tp_iternext */
    0,                             /* tp_methods */
    0,                             /* tp_members */
    PyMethodObject_getset,         /* tp_getset */
};

PyObject* CppObjectMapper::MakeMethod(puerts::ScriptFunctionInfo* FuncInfo)
{
    PyMethodObject *methodObj = (PyMethodObject *)PyObject_New(PyMethodObject, &PyMethodObject_Type);
    methodObj->funcInfo = FuncInfo;
    return (PyObject *)methodObj;
}

// TODO
void CppObjectMapper::InitMethod(puerts::ScriptFunctionInfo* FuncInfo, PyObject* Obj)
{
}

// TODO
void CppObjectMapper::InitProperty(puerts::ScriptPropertyInfo* PropInfo, PyObject* Obj)
{
}

typedef struct {
    PyObject_HEAD
    const puerts::ScriptClassDefinition* classDefinition;
} DynObj;

static int DynObj_init(DynObj* self, PyObject* args, PyObject* kwargs) {
    return 0;
}

static void DynObj_dealloc(DynObj* self) {
    Py_TYPE(self)->tp_free((PyObject*)self);
}

// 在 tp_new 里取回“类级唯一指针”
static PyObject* DynObj_new(PyTypeObject* type, PyObject* args, PyObject* kwargs) {
    DynObj* self = (DynObj*)type->tp_alloc(type, 0);
    if (!self) return NULL;

    PyObject* capsule = PyObject_GetAttrString((PyObject*)type, "_type_info_ptr");
    if (!capsule) {
        Py_DECREF(self);
        return NULL;
    }

    puerts::ScriptClassDefinition* classDefinition = (puerts::ScriptClassDefinition*)PyCapsule_GetPointer(capsule, "meta.TypeInfo");
    Py_DECREF(capsule);
    if (!classDefinition) {
        Py_DECREF(self);
        return NULL;
    }

    // 基于 meta 做实例级初始化，这里演示直接保存
    self->classDefinition = classDefinition;

    return (PyObject*)self;
}

static PyObject* DynObj_show_meta(PyObject* self_obj, PyObject* Py_UNUSED(ignored)) {
    PyTypeObject* type = Py_TYPE(self_obj);
    PyObject* capsule = PyObject_GetAttrString((PyObject*)type, "_type_info_ptr");
    if (!capsule) return NULL;
    void* meta = PyCapsule_GetPointer(capsule, "meta.TypeInfo");
    Py_DECREF(capsule);
    if (!meta) return NULL;

#if SIZEOF_VOID_P == SIZEOF_LONG_LONG
    return PyLong_FromUnsignedLongLong((unsigned long long)(uintptr_t)meta);
#else
    return PyLong_FromUnsignedLong((unsigned long)(uintptr_t)meta);
#endif
}

static PyMethodDef DynObj_methods[] = {
    {"_show_meta", (PyCFunction)DynObj_show_meta, METH_NOARGS, "Show per-class meta pointer (demo)"},
    {NULL, NULL, 0, NULL}
};

static PyMemberDef DynObj_members[] = {
    // 如需将实例级指针只读暴露给 Python，可用 capsule/整数方式封装再写 getter
    {NULL}
};

static PyType_Slot DynType_slots[] = {
    {Py_tp_new,      (void*)DynObj_new},
    {Py_tp_dealloc,  (void*)DynObj_dealloc},
    {Py_tp_init,     (void*)DynObj_init},
    {Py_tp_methods,  (void*)DynObj_methods},
    {Py_tp_members,  (void*)DynObj_members},
    {0, 0}
};

static PyType_Spec DynType_spec = {
    .name = "myext.Dynamic",  // 会在 makeClass 中按需覆盖为唯一名
    .basicsize = sizeof(DynObj),
    .itemsize = 0,
    .flags = Py_TPFLAGS_DEFAULT | Py_TPFLAGS_HEAPTYPE,
    .slots = DynType_slots
};


PyObject* CppObjectMapper::FindOrCreateClass(const puerts::ScriptClassDefinition* ClassDefinition)
{
    auto it = TypeIdToFunctionMap.find(ClassDefinition->TypeId);
    if (it != TypeIdToFunctionMap.end())
    {
        PyObject* cls = it->second;
        Py_INCREF(cls);
        return cls;
    }

    PyType_Spec spec = DynType_spec;
    spec.name = ClassDefinition->ScriptName;
    spec.flags = Py_TPFLAGS_DEFAULT | Py_TPFLAGS_HEAPTYPE | Py_TPFLAGS_BASETYPE;

    PyObject* type_obj = ClassDefinition->SuperTypeId ? PyType_FromSpecWithBases(&spec, FindOrCreateClass(puerts::LoadClassByID(registry, ClassDefinition->SuperTypeId))) : PyType_FromSpec(&spec);
    if (!type_obj) return NULL;

    PyObject* capsule = PyCapsule_New((void*)ClassDefinition, "meta.TypeInfo", NULL);
    if (!capsule) {
        Py_DECREF(type_obj);
        return NULL;
    }
    if (PyObject_SetAttrString(type_obj, "_type_info_ptr", capsule) < 0) {
        Py_DECREF(capsule);
        Py_DECREF(type_obj);
        return NULL;
    }
    Py_DECREF(capsule);

    puerts::ScriptFunctionInfo* FunctionInfo = ClassDefinition->Functions;
    while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
    {
        PyObject_SetAttrString(type_obj, FunctionInfo->Name, MakeMethod(FunctionInfo));
        ++FunctionInfo;
    }

    TypeIdToFunctionMap[ClassDefinition->TypeId] = type_obj;
    return type_obj;
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
        Py_DecRef(kv.second);
    }

    for (auto& obj : StrongRefObjects)
    {
        Py_DecRef(obj);
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
