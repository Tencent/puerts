/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "Python.h"
#include "structmember.h"
#include "pesapi.h"
#include "ScriptClassRegistry.h"
#include "CppObjectMapperPython.h"

#include "PapiData.h"

#define CTX_ATTR_NAME "__context_puerts__"

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
            pesapi_callback_info__ callbackInfo;
            callbackInfo.self = nullptr;
            callbackInfo.selfTypeId = nullptr;
            callbackInfo.args = args;
            callbackInfo.argc = static_cast<int>(PyTuple_Size(args));
            callbackInfo.data = data->data;
            callbackInfo.res = nullptr;
            callbackInfo.ex = nullptr;
            callbackInfo.ex_owned = nullptr;
            callbackInfo.mapper = data->mapper;
            
            data->callback(&pesapi::pythonimpl::g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
            
            PyObject* result = nullptr;
            if (callbackInfo.ex)
            {
                PyErr_SetString(PyExc_RuntimeError, callbackInfo.ex);
            }
            else if (callbackInfo.res)
            {
                Py_INCREF(callbackInfo.res);
                result = callbackInfo.res;
            }
            else
            {
                Py_INCREF(Py_None);
                result = Py_None;
            }
            
            return result;

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

void CppObjectMapper::BindAndAddToCache(
    const puerts::ScriptClassDefinition* typeInfo, const void* ptr, PyObject* value, bool callFinalize)
{
    DynObj* dynObj = (DynObj*)value;
    dynObj->objectPtr = (void*)(ptr);
    dynObj->classDefinition = typeInfo;
    dynObj->mapper = this;

    auto Iter = CDataCache.find(ptr);
    FObjectCacheNode* CacheNodePtr;
    if (Iter != CDataCache.end())
    {
        CacheNodePtr = Iter->second.Add(typeInfo->TypeId);
    }
    else
    {
        auto Ret = CDataCache.insert({ptr, FObjectCacheNode(typeInfo->TypeId)});
        CacheNodePtr = &Ret.first->second;
    }
    CacheNodePtr->MustCallFinalize = callFinalize;
    CacheNodePtr->Value = value;

    if (typeInfo->OnEnter)
    {
        CacheNodePtr->UserData = typeInfo->OnEnter((void*)ptr, typeInfo->Data, (void*)GetEnvPrivate());
    }
}

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

PyObject* CppObjectMapper::PushNativeObject(const void* TypeId, void* ObjectPtr, bool callFinalize)
{
    if (!ObjectPtr)
    {
        Py_RETURN_NONE;
    }

    if (!callFinalize)
    {
        auto Iter = CDataCache.find(ObjectPtr);
        if (Iter != CDataCache.end())
        {
            auto CacheNodePtr = Iter->second.Find(TypeId);
            if (CacheNodePtr)
            {
                return CacheNodePtr->Value;
            }
        }
    }

    auto ClassDefinition = puerts::LoadClassByID(registry, TypeId);
    if (!ClassDefinition)
    {
        ClassDefinition = &PtrClassDef;
    }
    PyObject* cls = FindOrCreateClass(ClassDefinition);
    if (!cls)
    {
        return nullptr;
    }

    auto* obj = PyObject_New(PyObject, (PyTypeObject*) cls);
    if (!obj)
    {
        return nullptr;
    }

    BindAndAddToCache(ClassDefinition, ObjectPtr, obj, callFinalize);

    return obj;
}

typedef struct
{
    PyObject_HEAD
    puerts::ScriptFunctionInfo* funcInfo;
    DynObj* dynObj;
    CppObjectMapper* mapper;
} PyMethodObject;

static void PyMethodObject_dealloc(PyMethodObject* self)
{
    // Release reference to dynObj when method object is deallocated
    if (self->dynObj) {
        Py_DECREF((PyObject*)self->dynObj);
    }
    Py_TYPE(self)->tp_free((PyObject*)self);
}

static PyObject* PyMethodObject_call(PyMethodObject* self, PyObject* args, PyObject* kwargs)
{
    if (!self->funcInfo || !self->funcInfo->Callback) {
        PyErr_SetString(PyExc_RuntimeError, "Invalid function info or callback");
        return nullptr;
    }
    
    pesapi_callback_info__ callbackInfo;
    callbackInfo.self = self->dynObj ? self->dynObj->objectPtr : nullptr;
    callbackInfo.selfTypeId = self->dynObj ? self->dynObj->classDefinition->TypeId : nullptr;
    callbackInfo.args = args;
    callbackInfo.argc = static_cast<int>(PyTuple_Size(args));
    callbackInfo.data = self->funcInfo->Data;
    callbackInfo.res = nullptr;
    callbackInfo.ex = nullptr;
    callbackInfo.ex_owned = nullptr;
    callbackInfo.mapper = self->mapper;
    
    self->funcInfo->Callback(&pesapi::pythonimpl::g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
    
    PyObject* result = nullptr;
    if (callbackInfo.ex)
    {
        PyErr_SetString(PyExc_RuntimeError, callbackInfo.ex);
    }
    else if (callbackInfo.res)
    {
        Py_INCREF(callbackInfo.res);
        result = callbackInfo.res;
    }
    else
    {
        Py_INCREF(Py_None);
        result = Py_None;
    }
    
    // Destructor will be called automatically when callbackInfo goes out of scope
    return result;
}

static PyObject* PyMethodObject_repr(PyMethodObject* self) 
{
    if (!self->funcInfo || !self->funcInfo->Name) {
        return PyUnicode_FromString("<foreign method (invalid)>");
    }
    return PyUnicode_FromFormat("<foreign method %s>", self->funcInfo->Name);
}

static PyObject* PyMethodObject_get_name(PyMethodObject* self, void* c) 
{
    if (!self->funcInfo || !self->funcInfo->Name) {
        return PyUnicode_FromString("(invalid)");
    }
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

PyObject* CppObjectMapper::MakeFunction(puerts::ScriptFunctionInfo* FuncInfo, DynObj* Obj)
{
    if (!FuncInfo) {
        PyErr_SetString(PyExc_RuntimeError, "FuncInfo cannot be null");
        return nullptr;
    }
    
    PyMethodObject *methodObj = (PyMethodObject *)PyObject_New(PyMethodObject, &PyMethodObject_Type);
    if (!methodObj) {
        return nullptr;
    }
    
    methodObj->funcInfo = FuncInfo;
    methodObj->dynObj = Obj;
    methodObj->mapper = this;
    // Increase reference count to keep dynObj alive while method exists
    if (Obj) {
        Py_INCREF((PyObject*)Obj);
    }
    return (PyObject *)methodObj;
}

static PyObject* propGetter(PyObject* self, void* closure)
{
    auto* info = (CppObjectMapper::GetterSetterInfo*) closure;
    pesapi_callback callback = info->getter;

    pesapi_scope__ scope(info->mapper);
    pesapi_callback_info__ callbackInfo;
    callbackInfo.self = ((DynObj*) self)->objectPtr;
    callbackInfo.selfTypeId = ((DynObj*) self)->classDefinition->TypeId;
    callbackInfo.args = nullptr;
    callbackInfo.argc = 0;
    callbackInfo.data = info->getterData;
    callbackInfo.res = nullptr;
    callbackInfo.ex = nullptr;
    callbackInfo.ex_owned = nullptr;
    callbackInfo.mapper = info->mapper;
    
    callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
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

static int propSetter(PyObject* self, PyObject* value, void* closure)
{
    if (!value)
    {
        PyErr_SetString(PyExc_RuntimeError, "Native property value cannot be null and cannot be deleted");
        return -1;
    }

    auto* info = (CppObjectMapper::GetterSetterInfo*) closure;
    pesapi_callback callback = info->setter;

    pesapi_scope__ scope(info->mapper);
    pesapi_callback_info__ callbackInfo;
    callbackInfo.self = ((DynObj*) self)->objectPtr;
    callbackInfo.selfTypeId = ((DynObj*) self)->classDefinition->TypeId;
    callbackInfo.args = PyTuple_Pack(1, value);
    callbackInfo.argc = 1;
    callbackInfo.data = info->setterData;
    callbackInfo.res = nullptr;
    callbackInfo.ex = nullptr;
    callbackInfo.ex_owned = nullptr;
    callbackInfo.mapper = info->mapper;
    
    callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
    if (callbackInfo.ex)
    {
        PyErr_SetString(PyExc_RuntimeError, callbackInfo.ex);
        Py_DECREF(callbackInfo.args);  // Clean up the tuple we created
        return -1;
    }
    Py_DECREF(callbackInfo.args);  // Clean up the tuple we created
    return 0;
};

// TODO
void CppObjectMapper::InitProperty(puerts::ScriptPropertyInfo* PropInfo, PyObject* Obj)
{
    auto info = (GetterSetterInfo*) PyMem_Malloc(sizeof(GetterSetterInfo));
    info->getter = PropInfo->Getter;
    info->setter = PropInfo->Setter;
    info->getterData = PropInfo->GetterData;
    info->setterData = PropInfo->SetterData;
    info->mapper = this;

    auto* def = (PyGetSetDef*) PyMem_Malloc(sizeof(PyGetSetDef));
    def->name = PropInfo->Name;
    def->get = nullptr;
    def->set = nullptr;
    def->doc = nullptr;
    def->closure = info;

    if (PropInfo->Getter)
    {
        def->get = propGetter;
    }
    if (PropInfo->Setter)
    {
        def->set = propSetter;
    }

    auto prop = PyDescr_NewGetSet((PyTypeObject*)Obj, def);
    PyObject_SetAttrString(Obj, PropInfo->Name, prop);
    Py_DECREF(prop);
};

// Static method implementation for variables
static PyObject* staticVariableGetter(PyObject* self, PyObject* args) {
    auto* info = (CppObjectMapper::GetterSetterInfo*) PyCapsule_GetPointer(self, "GetterSetterInfo");
    if (!info || !info->getter) {
        PyErr_SetString(PyExc_RuntimeError, "Invalid getter info");
        return nullptr;
    }
    
    pesapi_scope__ scope(info->mapper);
    pesapi_callback_info__ callbackInfo;
    callbackInfo.self = nullptr;
    callbackInfo.selfTypeId = nullptr;
    callbackInfo.args = nullptr;
    callbackInfo.argc = 0;
    callbackInfo.data = info->getterData;
    callbackInfo.res = nullptr;
    callbackInfo.ex = nullptr;
    callbackInfo.ex_owned = nullptr;
    callbackInfo.mapper = info->mapper;
    
    info->getter(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
    
    if (callbackInfo.ex) {
        PyErr_SetString(PyExc_RuntimeError, callbackInfo.ex);
        return nullptr;
    }
    if (callbackInfo.res) {
        Py_INCREF(callbackInfo.res);
        return callbackInfo.res;
    }
    Py_RETURN_NONE;
}

static PyObject* staticVariableSetter(PyObject* self, PyObject* args) {
    auto* info = (CppObjectMapper::GetterSetterInfo*) PyCapsule_GetPointer(self, "GetterSetterInfo");
    if (!info || !info->setter) {
        PyErr_SetString(PyExc_RuntimeError, "Invalid setter info");
        return nullptr;
    }
    
    pesapi_scope__ scope(info->mapper);
    pesapi_callback_info__ callbackInfo;
    callbackInfo.self = nullptr;
    callbackInfo.selfTypeId = nullptr;
    callbackInfo.args = args;
    callbackInfo.argc = static_cast<int>(PyTuple_Size(args));
    callbackInfo.data = info->setterData;
    callbackInfo.res = nullptr;
    callbackInfo.ex = nullptr;
    callbackInfo.ex_owned = nullptr;
    callbackInfo.mapper = info->mapper;
    
    info->setter(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
    
    if (callbackInfo.ex) {
        PyErr_SetString(PyExc_RuntimeError, callbackInfo.ex);
        return nullptr;
    }
    
    Py_RETURN_NONE;
}

typedef struct {
    PyObject_HEAD
    const puerts::ScriptClassDefinition* classDefinition;
    CppObjectMapper* mapper;
} ContextObj;

static void ContextObj_dealloc(ContextObj* self) {
    Py_TYPE(self)->tp_free((PyObject*)self);
}

static PyTypeObject Context_Type = {
    PyVarObject_HEAD_INIT(NULL, 0)
    "bridge._Context",              /* tp_name */
    sizeof(ContextObj),             /* tp_basicsize */
    0,                             /* tp_itemsize */
    (destructor)ContextObj_dealloc, /* tp_dealloc */
    0,                             /* tp_vectorcall_offset */
    0,                             /* tp_getattr */
    0,                             /* tp_setattr */
    0,                             /* tp_as_async */
    0,                             /* tp_repr */
    0,                             /* tp_as_number */
    0,                             /* tp_as_sequence */
    0,                             /* tp_as_mapping */
    0,                             /* tp_hash */
    0,                             /* tp_call */
    0,                             /* tp_str */
    0,                             /* tp_getattro */
    0,                             /* tp_setattro */
    0,                             /* tp_as_buffer */
    Py_TPFLAGS_DEFAULT,            /* tp_flags */
    "Internal context holder",     /* tp_doc */
    0,                             /* tp_traverse */
    0,                             /* tp_clear */
    0,                             /* tp_richcompare */
    0,                             /* tp_weaklistoffset */
    0,                             /* tp_iter */
    0,                             /* tp_iternext */
    0,                             /* tp_methods */
    0,                             /* tp_members */
    0,                             /* tp_getset */
};

static int DynObj_init(DynObj* self, PyObject* args, PyObject* kwargs) {
    return 0;
}

static ContextObj* GetContextObj(PyTypeObject* type) {
    PyObject* ctx = PyObject_GetAttrString((PyObject*)type, CTX_ATTR_NAME);
    if (!ctx) return nullptr;
    if (!PyObject_TypeCheck(ctx, &Context_Type)) {
        Py_DECREF(ctx);
        PyErr_SetString(PyExc_RuntimeError, "Invalid context object type");
        return nullptr;
    }
    return (ContextObj*)ctx;
}

static void DynObj_dealloc(DynObj* self) {
    self->mapper->RemoveFromCache(self->classDefinition, self->objectPtr);
    if (self->classDefinition && self->classDefinition->Finalize && self->objectPtr && self->mapper) {
        self->classDefinition->Finalize(&g_pesapi_ffi, (void*)self->objectPtr, self->classDefinition->Data, (void*)(self->mapper->GetEnvPrivate()));
    }
    
    // Must get type before calling tp_free, as tp_free may invalidate self
    PyTypeObject* type = Py_TYPE(self);
    type->tp_free((PyObject*)self);
    // For heap types, decrement the type's reference count to match the increment done by tp_alloc
    Py_DECREF(type);
}

static PyObject* DynObj_new(PyTypeObject* type, PyObject* args, PyObject* kwargs) {
    DynObj* self = (DynObj*)type->tp_alloc(type, 0);
    if (!self) return NULL;

    ContextObj* ctx = GetContextObj(type);
    if (!ctx) {
        Py_DECREF(self); // will crash if not bind and add to cache
        return NULL;
    }

    self->classDefinition = ctx->classDefinition;
    self->mapper = ctx->mapper;
    Py_DECREF(ctx);
    
    if (!self->classDefinition || !self->classDefinition->Initialize) {
        PyErr_SetString(PyExc_RuntimeError, "Invalid class definition or Initialize function");
        Py_DECREF(self);
        return NULL;
    }
    
    pesapi_callback_info__ callbackInfo;
    callbackInfo.self = nullptr;
    callbackInfo.selfTypeId = self->classDefinition->TypeId;
    callbackInfo.args = args;
    callbackInfo.argc = static_cast<int>(PyTuple_Size(args));
    callbackInfo.data = self->classDefinition->Data;
    callbackInfo.res = nullptr;
    callbackInfo.ex = nullptr;
    callbackInfo.ex_owned = nullptr;
    callbackInfo.mapper = self->mapper;
    
    void* ptr = self->classDefinition->Initialize(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
    if (callbackInfo.ex)
    {
        PyErr_SetString(PyExc_RuntimeError, callbackInfo.ex);
        Py_DECREF(self);
        return NULL;
    }
    self->mapper->BindAndAddToCache(self->classDefinition, ptr, (PyObject*)self, true);
    self->objectPtr = ptr;

    return (PyObject*)self;
}

static PyObject* DynObj_getattro(PyObject* self, PyObject* name) {
    DynObj* dynObj = (DynObj*)self;

    // First try to get attribute from the type's dictionary
    PyObject* result = PyObject_GenericGetAttr(self, name);
    if (result != NULL) {
        return result;
    }
    
    // Clear the AttributeError from PyObject_GenericGetAttr
    PyErr_Clear();

    const char* attrName = PyUnicode_AsUTF8(name);
    if (attrName) {
        auto* funcInfo = dynObj->mapper->FindFuncInfo(dynObj->classDefinition, attrName);
        if (funcInfo) return dynObj->mapper->MakeFunction(funcInfo, dynObj);
        auto* varInfo = dynObj->mapper->FindVariableInfo(dynObj->classDefinition, attrName);
        if (varInfo)
        {
            // check if have getter, then get the value as the res
            if (varInfo->Getter)
            {
                pesapi_scope__ scope(dynObj->mapper);
                pesapi_callback_info__ callbackInfo;
                callbackInfo.self = dynObj->objectPtr;
                callbackInfo.selfTypeId = dynObj->classDefinition->TypeId;
                callbackInfo.args = nullptr;
                callbackInfo.argc = 0;
                callbackInfo.data = varInfo->GetterData;
                callbackInfo.res = nullptr;
                callbackInfo.ex = nullptr;
                callbackInfo.ex_owned = nullptr;
                callbackInfo.mapper = dynObj->mapper;
                varInfo->Getter(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
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
        }
    }

    PyErr_Format(PyExc_AttributeError, "'%.50s' object has no attribute '%.400s'",
                 Py_TYPE(self)->tp_name, PyUnicode_AsUTF8(name));
    return nullptr;
}

static int DynObj_setattro(PyObject* self, PyObject* name, PyObject* value) {
    DynObj* dynObj = (DynObj*)self;

    const char* attrName = PyUnicode_AsUTF8(name);
    if (attrName) {
        if (auto* varInfo = dynObj->mapper->FindVariableInfo(dynObj->classDefinition, attrName))
        {
            // check if have setter, then set the value
            if (varInfo->Setter)
            {
                pesapi_scope__ scope(dynObj->mapper);
                pesapi_callback_info__ callbackInfo;
                callbackInfo.self = dynObj->objectPtr;
                callbackInfo.selfTypeId = dynObj->classDefinition->TypeId;
                callbackInfo.args = PyTuple_Pack(1, value);
                callbackInfo.argc = 1;
                callbackInfo.data = varInfo->SetterData;
                callbackInfo.res = nullptr;
                callbackInfo.ex = nullptr;
                callbackInfo.ex_owned = nullptr;
                callbackInfo.mapper = dynObj->mapper;
                varInfo->Setter(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
                Py_DECREF(callbackInfo.args);
                if (callbackInfo.ex)
                {
                    PyErr_SetString(PyExc_RuntimeError, callbackInfo.ex);
                    return -1;
                }
                return 0;
            }
            else
            {
                PyErr_Format(PyExc_AttributeError, "property '%.400s' of '%.50s' object has no setter",
                             attrName, Py_TYPE(self)->tp_name);
                return -1;
            }
        }
    }

    // Fallback to generic setattr
    return PyObject_GenericSetAttr(self, name, value);
}

//新增CallMethod
static PyObject* DynObj_call_method(PyObject* self, PyObject* args)
{
    //思路是从 Python 传入的方法名和方法参数，找到对应的C++方法并调用，最终返回结果给Python 
    DynObj* dynObj = (DynObj*)self;
    const char* methodName;
    PyObject* pyArgs;

    if (!PyArg_ParseTuple(args, "sO", &methodName, &pyArgs))
        return nullptr;
    if (!PyTuple_Check(pyArgs)) {
        PyErr_SetString(PyExc_TypeError, "2nd arg must be tuple");
        return nullptr;
    }

    auto* funcInfo = dynObj->mapper->FindFuncInfo(dynObj->classDefinition, methodName);
    if (!funcInfo) {
        PyErr_Format(PyExc_AttributeError, "method '%s' not found", methodName);
        return nullptr;
    }

    pesapi_callback_info__ cbinfo;
    cbinfo.self = dynObj->objectPtr;
    cbinfo.selfTypeId = dynObj->classDefinition->TypeId;
    cbinfo.args = pyArgs;
    cbinfo.argc = static_cast<int>(PyTuple_Size(pyArgs));
    cbinfo.data = funcInfo->Data;
    cbinfo.res = nullptr;
    cbinfo.ex = nullptr;
    cbinfo.ex_owned = nullptr;
    cbinfo.mapper = dynObj->mapper;

    funcInfo->Callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&cbinfo));

    if (cbinfo.ex) {
        PyErr_SetString(PyExc_RuntimeError, cbinfo.ex);
        return nullptr;
    }
    if (cbinfo.res) {
        Py_INCREF(cbinfo.res);
        return cbinfo.res;
    }
    Py_RETURN_NONE;
}

static PyMethodDef DynObj_methods[] = {
    {"call_method", (PyCFunction)DynObj_call_method, METH_VARARGS,
    "call_method(name, args_tuple) -> result"},
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
    {Py_tp_getattro, (void*)DynObj_getattro},
    {Py_tp_setattro, (void*)DynObj_setattro},
    {Py_tp_methods,  (void*)DynObj_methods},
    {Py_tp_members,  (void*)DynObj_members},
    {0, 0}
};

static PyType_Spec DynType_spec = {
    .name = "NativeClass",
    .basicsize = sizeof(DynObj),
    .itemsize = 0,
    .flags = Py_TPFLAGS_DEFAULT | Py_TPFLAGS_HEAPTYPE,
    .slots = DynType_slots
};

static PyObject* MetaObj_getattro(PyObject* /*caller, the object which use it as metaclass */self, PyObject* name)
{
    // printf("Getting Attribute in MetaObj_getattro for name: %s\n", PyUnicode_AsUTF8(name));
    PyObject* result = PyObject_GenericGetAttr(self, name);
    PyErr_Clear(); // Clear any error from the generic getattro
    if (result) {
        return result;
    }

    auto ctx = GetContextObj(Py_TYPE(self));
    if (!ctx) {
        char* error_msg = (char*) PyMem_Malloc(100);
        sprintf(error_msg, "'%.50s' metaclass has no puerts context object", Py_TYPE(self)->tp_name);
        PyErr_SetString(PyExc_AttributeError, error_msg);
        return nullptr;
    }

    const char* attrName = PyUnicode_AsUTF8(name);
    if (attrName)
    {
        auto* varInfo =
            ((GetContextObj(Py_TYPE(self)))->mapper)->FindVariableInfo(((GetContextObj(Py_TYPE(self)))->classDefinition), attrName);
        if (varInfo)
        {
            // check if have getter, then get the value as the res
            if (varInfo->Getter)
            {
                pesapi_scope__ scope(ctx->mapper);
                pesapi_callback_info__ callbackInfo;
                callbackInfo.self = nullptr;
                callbackInfo.selfTypeId = nullptr;
                callbackInfo.args = nullptr;
                callbackInfo.argc = 0;
                callbackInfo.data = varInfo->GetterData;
                callbackInfo.res = nullptr;
                callbackInfo.ex = nullptr;
                callbackInfo.ex_owned = nullptr;
                callbackInfo.mapper = ctx->mapper;

                varInfo->Getter(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));

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
            else
            {
                PyErr_Format(PyExc_AttributeError, "property '%.400s' of '%.50s' object has no getter", attrName, Py_TYPE(self)->tp_name);
                return nullptr;
            }
        }
    }
    if (attrName && strcmp(attrName, "__bases__") == 0)
        return (PyObject*) &PyType_Type;
    char* error_msg = (char*) PyMem_Malloc(100 + strlen(attrName));
    sprintf(error_msg, "'%.50s' metaclass has no attribute '%.400s'", Py_TYPE(self)->tp_name, attrName);

    PyErr_SetString(PyExc_AttributeError, error_msg);
    return nullptr;

}

static int MetaObj_setattro(PyObject* self, PyObject* name, PyObject* value)
{
    //printf("Setting Attribute in MetaObj_setattro for name: %s\n", PyUnicode_AsUTF8(name));
    const char *attrName = PyUnicode_AsUTF8(name);

    ContextObj* ctx = nullptr;
    ctx = GetContextObj((PyTypeObject*) self);
    if (ctx)
    {
        auto* varInfo =
        (ctx->mapper)->FindVariableInfo(ctx->classDefinition, attrName);
        if (varInfo)
        {
            // check if have setter, then set the value
            if (varInfo->Setter)
            {
                pesapi_scope__ scope(ctx->mapper);
                pesapi_callback_info__ callbackInfo;
                callbackInfo.self = nullptr;
                callbackInfo.selfTypeId = nullptr;
                callbackInfo.args = PyTuple_Pack(1, value);
                callbackInfo.argc = 1;
                callbackInfo.data = varInfo->SetterData;
                callbackInfo.res = nullptr;
                callbackInfo.ex = nullptr;
                callbackInfo.ex_owned = nullptr;
                callbackInfo.mapper = ctx->mapper;

                varInfo->Setter(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&callbackInfo));
                Py_DECREF(callbackInfo.args);  // Clean up the tuple we created
                if (callbackInfo.ex)
                {
                    PyErr_SetString(PyExc_RuntimeError, callbackInfo.ex);
                    return -1;
                }
                return 0;
            }
            else
            {
                PyErr_Format(PyExc_AttributeError, "property '%.400s' of '%.50s' object has no setter", attrName, Py_TYPE(self)->tp_name);
                return -1;
            }
        }
    }

    auto result = PyObject_GenericSetAttr(self, name, value);
    PyErr_Clear();
    if (result == 0)
    {
        return 0;
    }
    PyErr_Format(PyExc_AttributeError, "'%.50s' metaclass has no attribute '%.400s'", Py_TYPE(self)->tp_name, attrName);
    return -1;
}

static PyType_Slot MetaType_slots[] = {
    {Py_tp_base, &PyType_Type },
    {Py_tp_getattro, (void*)MetaObj_getattro},
    {Py_tp_setattro, (void*)MetaObj_setattro},
    {0, nullptr}
};

static PyType_Spec MetaClassType_spec = {
    .name = "Meta",
    .basicsize = sizeof(PyHeapTypeObject),
    .itemsize = 0,
    .flags = Py_TPFLAGS_DEFAULT | Py_TPFLAGS_HEAPTYPE | Py_TPFLAGS_BASETYPE,
    .slots = MetaType_slots
};

puerts::ScriptFunctionInfo* CppObjectMapper::FindFuncInfo(const puerts::ScriptClassDefinition* cls,const eastl::basic_string<char,eastl::allocator_malloc>& name)
{
    auto it_cache = MethodMetaCache.find(cls);
    MethodMap* cache = nullptr;
    
    if (it_cache != MethodMetaCache.end()) {
        cache = it_cache->second;
    } else {
        // Use malloc + placement new to construct the inner map
        void* memory = malloc(sizeof(MethodMap));
        if (!memory) return nullptr;
        cache = new(memory) MethodMap();
        MethodMetaCache[cls] = cache;
    }
    
    auto it = cache->find(name);
    if (it != cache->end()) return it->second;

    if (cls && cls->Methods) {
        puerts::ScriptFunctionInfo* info = cls->Methods;
        while (info && info->Name) {
            (*cache)[info->Name] = info;
            if (name == info->Name) return info;
            ++info;
        }
    }
    if (cls && cls->SuperTypeId) {
        return FindFuncInfo(puerts::LoadClassByID(registry, cls->SuperTypeId), name);
    }
    return nullptr;
}

puerts::ScriptPropertyInfo* CppObjectMapper::FindVariableInfo(const puerts::ScriptClassDefinition* cls,const eastl::basic_string<char,eastl::allocator_malloc>& name)
{
    auto it_cache = VariableMetaCache.find(cls);
    VariableMap* cache = nullptr;

    if (it_cache != VariableMetaCache.end()) {
        cache = it_cache->second;
    } else {
        // Use malloc + placement new to construct the inner map
        void* memory = malloc(sizeof(VariableMap));
        if (!memory) return nullptr;
        cache = new(memory) VariableMap();
        VariableMetaCache[cls] = cache;
    }
    auto it = cache->find(name);
    if (it != cache->end()) return it->second;
    if (cls && cls->Variables) {
        puerts::ScriptPropertyInfo* info = cls->Variables;
        while (info && info->Name) {
            (*cache)[info->Name] = info;
            if (name == info->Name) return info;
            ++info;
        }
    }
    if (cls && cls->SuperTypeId) {
        return FindVariableInfo(puerts::LoadClassByID(registry, cls->SuperTypeId), name);
    }
    return nullptr;
}


PyObject* CppObjectMapper::FindOrCreateClass(const puerts::ScriptClassDefinition* ClassDefinition)
{
    auto it = TypeIdToFunctionMap.find(ClassDefinition->TypeId);
    if (it != TypeIdToFunctionMap.end())
    {
        PyObject* cls = it->second;
        return cls;
    }

    PyType_Spec spec = DynType_spec;
    char* typeName = (char*) PyMem_Malloc(strlen(ClassDefinition->ScriptName) + 10); // "builtins." + name + '\0'
    sprintf(typeName, "builtins.%s", ClassDefinition->ScriptName);
    spec.name = typeName;
    spec.flags = Py_TPFLAGS_DEFAULT | Py_TPFLAGS_HEAPTYPE | Py_TPFLAGS_BASETYPE;

    PyType_Spec metaSpec = MetaClassType_spec;
    char* metaTypeName = (char*) PyMem_Malloc(strlen(ClassDefinition->ScriptName) + 15); // "Meta." + name + '\0'
    sprintf(metaTypeName, "Meta.%s", ClassDefinition->ScriptName);
    metaSpec.name = metaTypeName;

    // printf("Creating class: %s\n", spec.name);

    PyObject* type_obj = nullptr;
    PyObject* meta_type_obj = nullptr;
    if (ClassDefinition->SuperTypeId)
    {
        auto super_type_obj = FindOrCreateClass(puerts::LoadClassByID(registry, ClassDefinition->SuperTypeId));
        auto meta_super = PyObject_GetAttrString(super_type_obj, "__p_m__");
        auto meta_base = PyTuple_Pack(1, meta_super);
        meta_type_obj = PyType_FromSpecWithBases(&metaSpec, meta_base);
        PyObject* bases = PyTuple_Pack(1, super_type_obj);
        type_obj = PyType_FromMetaclass((PyTypeObject*)meta_type_obj, nullptr, &spec, bases);
        Py_DECREF(bases);
        Py_DECREF(meta_base);
    }
    else 
    {
        auto bases = PyTuple_Pack(1, (PyObject*)&PyType_Type);
        meta_type_obj = PyType_FromSpecWithBases(&metaSpec, bases);
        type_obj = PyType_FromMetaclass((PyTypeObject*)meta_type_obj, nullptr, &spec, nullptr/*bases*/);
        Py_DECREF(bases);
    }

    PyMem_Free(typeName);
    PyMem_Free(metaTypeName);

    if (!type_obj || !meta_type_obj) {

        if (type_obj) Py_DECREF(type_obj);
        if (meta_type_obj) Py_DECREF(meta_type_obj);
        return NULL;
    }

    PyObject_SetAttrString(type_obj, "__p_m__", meta_type_obj);

    ContextObj* ctx = PyObject_New(ContextObj, &Context_Type);
    if (!ctx) {
        Py_DECREF(type_obj);
        return NULL;
    }

    ctx->classDefinition = ClassDefinition;
    ctx->mapper = this;
    if (PyObject_SetAttrString(type_obj, CTX_ATTR_NAME, (PyObject*)ctx) < 0 ||
        PyObject_SetAttrString(meta_type_obj, CTX_ATTR_NAME, (PyObject*)ctx) < 0) {
        Py_DECREF(ctx);
        Py_DECREF(type_obj);
        Py_DECREF(meta_type_obj);
        return NULL;
    }

    puerts::ScriptPropertyInfo* PropertyInfo = ClassDefinition->Properties;
    while (PropertyInfo && PropertyInfo->Name)
    {
        InitProperty(PropertyInfo, type_obj);
        ++PropertyInfo;
    }

    puerts::ScriptFunctionInfo* FunctionInfo = ClassDefinition->Functions;
    while (FunctionInfo && FunctionInfo->Name && FunctionInfo->Callback)
    {
        PyObject_SetAttrString(type_obj, FunctionInfo->Name, MakeFunction(FunctionInfo));
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

void CppObjectMapper::Initialize(PyThreadState *InThreadState)
{
    threadState = InThreadState;
    if (!threadState) {
        return;
    }
    
    auto prevThreadState = PyThreadState_Swap(threadState);
    
    // Ensure __main__ module exists
    PyObject* main_module = PyImport_AddModule("__main__");
    if (!main_module) {
        PyErr_Clear();
        return;
    }
    
    if (PyType_Ready(&Context_Type) < 0) 
    {
        PyErr_Clear();
        return;
    }
    
    if (PyType_Ready(&PyMethodObject_Type) < 0) 
    {
        PyErr_Clear();
        return;
    }
    
    PtrClassDef.TypeId = &PtrClassDef;
    PtrClassDef.ScriptName = "__Pointer";
    PyThreadState_Swap(prevThreadState);
}

void CppObjectMapper::Cleanup()
{
    // Release type objects stored in TypeIdToFunctionMap
    for (auto& kv : TypeIdToFunctionMap)
    {
        Py_DECREF(kv.second);
    }

    for (auto& obj : StrongRefObjects)
    {
        Py_DecRef(obj);
    }

    // Clean up MethodMetaCache - call destructor and free memory for each inner map
    for (auto& kv : MethodMetaCache)
    {
        if (kv.second) {
            kv.second->~MethodMap();  // Call destructor
            free(kv.second);          // Free memory
        }
    }

    StrongRefObjects.clear();
    CDataCache.clear();
    TypeIdToFunctionMap.clear();
    MethodMetaCache.clear();
}
}    // namespace pythonimpl
}    // namespace pesapi

pesapi_env_ref create_py_env()
{
    auto* mapper = reinterpret_cast<pesapi::pythonimpl::CppObjectMapper*>(malloc(sizeof(pesapi::pythonimpl::CppObjectMapper)));
    if (!mapper)
    {
        return nullptr;
    }
    
    memset(mapper, 0, sizeof(pesapi::pythonimpl::CppObjectMapper));
    PyThreadState *threadState = Py_NewInterpreter();
    if (!threadState) {
        free(mapper);
        return nullptr;
    }
    
    new (mapper) pesapi::pythonimpl::CppObjectMapper();
    mapper->Initialize(threadState);
    
    return pesapi::pythonimpl::g_pesapi_ffi.create_env_ref(reinterpret_cast<pesapi_env>(mapper));
}

void destroy_py_env(pesapi_env_ref env_ref)
{
    auto mapper = reinterpret_cast<pesapi::pythonimpl::CppObjectMapper*>(pesapi::pythonimpl::g_pesapi_ffi.get_env_from_ref(env_ref));
    get_papi_ffi()->release_env_ref(env_ref);
    if (mapper)
    {
        PyThreadState *threadState = mapper->threadState;
        if (threadState)
        {
            PyThreadState* prevThreadState = PyThreadState_Swap(threadState);
            
            mapper->Cleanup();
            
            Py_EndInterpreter(threadState);
            
            if (prevThreadState && prevThreadState != threadState) {
                PyThreadState_Swap(prevThreadState);
            }
        }
        else
        {
            mapper->Cleanup();
        }
        mapper->~CppObjectMapper();
        free(mapper);
    }
}

pesapi_ffi* get_papi_ffi()
{
    return &pesapi::pythonimpl::g_pesapi_ffi;
}
