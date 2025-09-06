/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include <Python.h>
#include <EASTL/memory.h>

#include "pesapi.h"
#include "CppObjectMapperPython.h"
#include "PapiData.h"

#include <iostream>
#include <stdio.h>
#include <assert.h>

namespace pesapi
{
namespace pythonimpl
{
inline pesapi_value pesapiValueFromPyObject(PyObject* v)
{
    return reinterpret_cast<pesapi_value>(v);
}

inline PyObject* pyObjectFromPesapiValue(pesapi_value v)
{
    return reinterpret_cast<PyObject*>(v);
}

inline pesapi_env pesapiEnvFromPyState(PyInterpreterState* state)
{
    return reinterpret_cast<pesapi_env>(state);
}

inline PyInterpreterState* pyStateFromPesapiEnv(pesapi_env v)
{
    return reinterpret_cast<PyInterpreterState*>(v);
}

inline PyObject** allocValueInCurrentScope(PyInterpreterState* state)
{
    auto scope = getCurrentScope(state);
    return scope->allocValue();
}

pesapi_value pesapi_create_null(pesapi_env env)
{
    return pesapiValueFromPyObject(Py_None);
}

pesapi_value pesapi_create_undefined(pesapi_env env)
{
    // no undefined data type in Python
    return pesapiValueFromPyObject(Py_None);
}

//不代表不能通过其他方式封装到env内
pesapi_value pesapi_create_boolean(pesapi_env env, int value)
{
    return pesapiValueFromPyObject(value!=0?Py_True:Py_False);
}

pesapi_value pesapi_create_int32(pesapi_env env, int32_t value)
{
    auto ret = allocValueInCurrentScope(pyStateFromPesapiEnv(env));
    *ret = PyLong_FromLong(value);
    auto* obj = pesapiValueFromPyObject(*ret);
    return obj;
}

pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value)
{
    auto ret = allocValueInCurrentScope(pyStateFromPesapiEnv(env));
    *ret = PyLong_FromUnsignedLong(value);
    auto* obj = pesapiValueFromPyObject(*ret);
    return obj;
}

pesapi_value pesapi_create_int64(pesapi_env env, int64_t value)
{
    auto ret = allocValueInCurrentScope(pyStateFromPesapiEnv(env));
    *ret = PyLong_FromLongLong(value);
    auto* obj = pesapiValueFromPyObject(*ret);
    return obj;
}

pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value)
{
    auto ret = allocValueInCurrentScope(pyStateFromPesapiEnv(env));
    *ret = PyLong_FromUnsignedLongLong(value);
    auto* obj = pesapiValueFromPyObject(*ret);
    return obj;
}

pesapi_value pesapi_create_double(pesapi_env env, double value)
{
    auto ret = allocValueInCurrentScope(pyStateFromPesapiEnv(env));
    *ret = PyFloat_FromDouble(value);
    auto* obj = pesapiValueFromPyObject(*ret);
    return obj;
}

pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t len)
{
    auto ret = allocValueInCurrentScope(pyStateFromPesapiEnv(env));
    *ret = PyUnicode_DecodeUTF8(str, len, nullptr);
    auto* obj = pesapiValueFromPyObject(*ret);
    return obj;
}

pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t* str, size_t length)
{
    auto ret = allocValueInCurrentScope(pyStateFromPesapiEnv(env));
    auto* obj = pesapiValueFromPyObject(PyUnicode_DecodeUTF16(reinterpret_cast<const char*>(str), length * 2, nullptr, nullptr));
    return obj;
}

pesapi_value pesapi_create_binary(pesapi_env env, void* str, size_t length)
{
    //auto* copy = static_cast<char*>(malloc(length));
    //memcpy(copy, str, length);
    auto ret = allocValueInCurrentScope(pyStateFromPesapiEnv(env));
    auto* obj = pesapiValueFromPyObject(PyBytes_FromStringAndSize(static_cast<const char*>(str), length));
    //free(copy);
    return obj;
}

pesapi_value pesapi_create_binary_by_value(pesapi_env env, void* str, size_t length)
{
    //void* copy = malloc(length);
    //memcpy(copy, str, length);
    auto ret = allocValueInCurrentScope(pyStateFromPesapiEnv(env));
    auto* obj = pesapiValueFromPyObject(PyBytes_FromStringAndSize(static_cast<const char*>(str), length));
    // free(copy);
    return obj;
}

pesapi_value pesapi_create_array(pesapi_env env)    // TODO: JS 的 Array 和 Python 的 list 有区别
{
    auto ret = allocValueInCurrentScope(pyStateFromPesapiEnv(env));
    auto* obj = pesapiValueFromPyObject(PyList_New(0));
    return obj;
}

pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old = PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto mapper = CppObjectMapper::Get(state);
    auto ret = allocValueInCurrentScope(state);
    *ret = mapper->FindOrCreateClassByID(type_id);
    auto* res= pesapiValueFromPyObject(*ret);
    PyThreadState_Swap(old);
    return res;
}

pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto mapper = CppObjectMapper::Get(state);
    auto ret = allocValueInCurrentScope(state);
    *ret = mapper->CreateFunction(native_impl, data, finalize);
    auto* res= pesapiValueFromPyObject(*ret);
    PyThreadState_Swap(old);
    return res;
}

int pesapi_get_value_bool(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old = PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    int res= PyObject_IsTrue(obj) == 1;
    PyThreadState_Swap(old);
    return res;
}

int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    int32_t res= (int32_t) PyLong_AsLong(obj);
    PyThreadState_Swap(old);
    return res;
}

uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    uint32_t res=(uint32_t) PyLong_AsUnsignedLong(obj);
    PyThreadState_Swap(old);
    return res;
}

int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    int64_t res=PyLong_AsLongLong(obj);
    PyThreadState_Swap(old);
    return res;
}

uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    uint64_t res=PyLong_AsUnsignedLongLong(obj);
    PyThreadState_Swap(old);
    return res;
}

double pesapi_get_value_double(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    double res=PyFloat_AsDouble(obj);
    PyThreadState_Swap(old);
    return res;
}


const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value pvalue, char* buf, size_t* bufsize)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(pvalue);
    if (buf == nullptr)
    {
        Py_ssize_t sz; 
        auto* ret = PyUnicode_AsUTF8AndSize(obj, &sz);
        if (ret)
        {
            *bufsize = static_cast<size_t>(sz);
            PyThreadState_Swap(old);
            //避免二次调用
            return ret;
        }
    }
    else
    {
        Py_ssize_t sz;
        auto* ret = PyUnicode_AsUTF8AndSize(obj, &sz);
        //预留'\0'空间
        if (ret&&(*bufsize>=(size_t)sz))
        {
            memcpy(buf,ret,sz);
        }
    }
    PyThreadState_Swap(old);
    return buf;
    
}

const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value value, uint16_t* buf, size_t* bufsize)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    PyObject* utf16Str = PyUnicode_AsUTF16String(obj);
    if (!utf16Str)
    {
        if (bufsize)
            *bufsize = 0;
        PyThreadState_Swap(old);
        return nullptr;
    }

    Py_ssize_t rawLength;
    char* rawBuffer;
    PyBytes_AsStringAndSize(utf16Str, &rawBuffer, &rawLength);

    const auto* utf16Buffer = reinterpret_cast<const uint16_t*>(rawBuffer + 2);
    if (bufsize)
    {
        *bufsize = (rawLength - 2) / sizeof(uint16_t);
    }

    Py_DECREF(utf16Str);
    PyThreadState_Swap(old);
    return utf16Buffer;
}

void* pesapi_get_value_binary(pesapi_env env, pesapi_value value, size_t* length)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    Py_ssize_t len;
    char* data;
    if (PyBytes_AsStringAndSize(obj, &data, &len) == -1)
    {
        if (length)
            *length = 0;
        PyThreadState_Swap(old);
        return nullptr;
    }
    if (length)
        *length = (size_t) len;
    PyThreadState_Swap(old);
    return data;
}

uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value value)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    if (PyList_Check(obj))
    {
        uint32_t size=PyList_Size(obj);
        PyThreadState_Swap(old);
        return size;
    }
    PyThreadState_Swap(old);
    return 0;
}


int pesapi_is_null(pesapi_env env, pesapi_value value)
{
    return pyObjectFromPesapiValue(value) == Py_None;
}


int pesapi_is_undefined(pesapi_env env, pesapi_value value)
{
    return pyObjectFromPesapiValue(value) == Py_None;    // TODO: Python没有undefined，使用None代替
}


int pesapi_is_boolean(pesapi_env env, pesapi_value value)
{
    return PyBool_Check(pyObjectFromPesapiValue(value));
}

int pesapi_is_int32(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    if (!PyLong_Check(obj))
    {
        PyThreadState_Swap(old);
        return false;
    }

    auto num = PyLong_AsLong(obj);
    PyThreadState_Swap(old);
    return num >= INT32_MIN && num <= INT32_MAX;
}

int pesapi_is_uint32(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    if (!PyLong_Check(obj))
    {
        PyThreadState_Swap(old);
        return false;
    }
    auto num = PyLong_AsLong(obj);
    PyThreadState_Swap(old);
    return num >= 0 && num <= UINT32_MAX;
}

int pesapi_is_int64(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    int res= PyLong_Check(pyObjectFromPesapiValue(value));
    PyThreadState_Swap(old);
    return res;
}

int pesapi_is_uint64(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    if (!PyLong_Check(obj))
        return false;
    int res=PyLong_AsLongLong(obj) >= 0;
    PyThreadState_Swap(old);
    return res;
}

int pesapi_is_double(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    int res=PyFloat_Check(pyObjectFromPesapiValue(value));
    PyThreadState_Swap(old);
    return res;
}

int pesapi_is_string(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    int res=PyUnicode_Check(pyObjectFromPesapiValue(value));
    PyThreadState_Swap(old);
    return res;
}

int pesapi_is_object(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    int res=PyDict_Check(pyObjectFromPesapiValue(value));
    PyThreadState_Swap(old);
    return res;
}

int pesapi_is_function(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    int res=PyCallable_Check(pyObjectFromPesapiValue(value));
    PyThreadState_Swap(old);
    return res;
}

int pesapi_is_binary(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    int res=PyBytes_Check(pyObjectFromPesapiValue(value));
    PyThreadState_Swap(old);
    return res;
}

int pesapi_is_array(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    int res=PyList_Check(obj);
    PyThreadState_Swap(old);
    return res;
}

pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old = PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto mapper = CppObjectMapper::Get(state);
    auto ret = allocValueInCurrentScope(state);
    *ret = mapper->PushNativeObject(type_id, object_ptr, call_finalize);
    auto* res= pesapiValueFromPyObject(*ret);
    PyThreadState_Swap(old);
    return res;
}

void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value value)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old = PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto obj = pyObjectFromPesapiValue(value);
    auto mapper = CppObjectMapper::Get(state);
    void* res= (void*) mapper->GetNativeObjectPtr(obj);
    PyThreadState_Swap(old);
    return res;
}

const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value value)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old = PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto obj = pyObjectFromPesapiValue(value);
    auto mapper = CppObjectMapper::Get(state);
    const void* res= mapper->GetNativeObjectTypeId(obj);
    PyThreadState_Swap(old);
    return res;
}

int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value value)
{
    // TODO
    return false;
}

pesapi_value pesapi_boxing(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));

    PyObject* item = pyObjectFromPesapiValue(value);
    Py_INCREF(item);

    PyObject* tuple = PyList_New(1);
    PyList_SetItem(tuple, 0, item);
    auto* res= pesapiValueFromPyObject(tuple);
    PyThreadState_Swap(old);
    return res;
}

pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));

    PyObject* tuple = pyObjectFromPesapiValue(value);
    PyObject* item = PyTuple_GetItem(tuple, 0);
    auto* res= pesapiValueFromPyObject(item);
    PyThreadState_Swap(old);
    return res;
}

void pesapi_update_boxed_value(pesapi_env env, pesapi_value boxed_value, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));

    PyObject* box = pyObjectFromPesapiValue(boxed_value);
    PyObject* val = pyObjectFromPesapiValue(value);

    PyTuple_SetItem(box, 0, val);
    PyThreadState_Swap(old);
}

int pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(value);
    int res= PyTuple_Check(obj) && PyTuple_Size(obj) == 1;
    PyThreadState_Swap(old);
    return res;
}

int pesapi_get_args_len(pesapi_callback_info info)
{
    auto callback_info = reinterpret_cast<pesapi_callback_info__*>(info);
    return callback_info->argc;
}

pesapi_value pesapi_get_arg(pesapi_callback_info pinfo, int index)
{
    auto info = reinterpret_cast<pesapi_callback_info__*>(pinfo);
    if (index >= 0 && index < info->argc)
    {
        return pesapiValueFromPyObject(PyTuple_GetItem(info->args, index));
    }
    else
    {
        return pesapiValueFromPyObject(Py_None);
    }
}


pesapi_env pesapi_get_env(pesapi_callback_info info)
{
    auto callback_info = reinterpret_cast<pesapi_callback_info__*>(info);
    auto* state = callback_info->state_persistent;
    return pesapiEnvFromPyState(state);
}


void* pesapi_get_native_holder_ptr(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi_callback_info__*>(pinfo);
    return (void*) mapper->GetNativeObjectPtr(info->self);
}

const void* pesapi_get_native_holder_typeid(pesapi_callback_info pinfo)
{
    auto info = reinterpret_cast<pesapi_callback_info__*>(pinfo);
    return mapper->GetNativeObjectTypeId(info->self);
}

void* pesapi_get_userdata(pesapi_callback_info info)
{
    auto* callback_info = reinterpret_cast<pesapi_callback_info__*>(info);
    return callback_info->data;
}

// TODO:是否需要切换线程，如果这个函数作为内部调用就不需要，提升性能
void pesapi_add_return(pesapi_callback_info info, pesapi_value value)
{
    auto* callback_info = reinterpret_cast<pesapi_callback_info__*>(info);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(callback_info->state_persistent));
    callback_info->res = pyObjectFromPesapiValue(value);
    if (callback_info->res != nullptr)
    {
        Py_INCREF(callback_info->res);
    }
    PyThreadState_Swap(old);
}

//TODO:是否需要切换线程，如果这个函数作为内部调用就不需要，提升性能
void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg)
{
    auto info = reinterpret_cast<pesapi_callback_info__*>(pinfo);
    info->res = PyExc_RuntimeError;
    info->ex = msg;
}

pesapi_env_ref pesapi_create_env_ref(pesapi_env env)
{
    auto state = pyStateFromPesapiEnv(env);
    auto ret = static_cast<pesapi_env_ref>(malloc(sizeof(pesapi_env_ref__)));
    if (!state)
    {
        //内部接口不宜使用标准库函数（诸如std::cerr)
        return nullptr;
    }

    if (ret)
    {
        memset(ret, 0, sizeof(pesapi_env_ref__));
        new (ret) pesapi_env_ref__(state);
        return ret;
    }
    //异常处理 
    auto scope = getCurrentScope(state);
    scope->setCaughtException(PyErr_Occurred());
    return nullptr;
}

int pesapi_env_ref_is_valid(pesapi_env_ref penv_ref)
{
    auto env_ref = reinterpret_cast<pesapi_env_ref__*>(penv_ref);
    return !env_ref->env_life_cycle_tracker.expired();
}

pesapi_env pesapi_get_env_from_ref(pesapi_env_ref penv_ref)
{
    //下一行代码应该无效?
    auto env_ref = reinterpret_cast<pesapi_env_ref__*>(penv_ref);
    if (!env_ref || env_ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    return pesapiEnvFromPyState(env_ref->state_persistent);
}

pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref env_ref)
{
    auto ref = reinterpret_cast<pesapi_env_ref__*>(env_ref);
    ++ref->ref_count;
    return env_ref;
}

void pesapi_release_env_ref(pesapi_env_ref env_ref)
{
    //作用？
    auto ref = reinterpret_cast<pesapi_env_ref__*>(env_ref);
    if (--ref->ref_count == 0)
    {
        if (!ref->env_life_cycle_tracker.expired())
        {
            //析构函数为空函数实现
            ref->~pesapi_env_ref__();
        }
        free(ref);
    }
}

pesapi_scope pesapi_open_scope(pesapi_env_ref penv_ref)
{
    auto ref = reinterpret_cast<pesapi_env_ref__*>(penv_ref);
    if (!ref || ref->env_life_cycle_tracker.expired())
    {
        return nullptr;
    }
    pesapi_scope ret = static_cast<pesapi_scope>(malloc(sizeof(pesapi_scope__)));
    memset(ret, 0, sizeof(pesapi_scope__));
    new (ret) pesapi_scope__(ref->state_persistent);
    return ret;
}

pesapi_scope pesapi_open_scope_placement(pesapi_env_ref env_ref, struct pesapi_scope_memory* memory)
{
    return pesapi_open_scope(env_ref);
}

// TODO
void pesapi_close_scope(pesapi_scope pscope)
{
    auto scope = reinterpret_cast<pesapi_scope__*>(pscope);
    if (!scope)
    {
        return;
    }
    if (scope->prev_scope == nullptr)
    {

    }
    scope->~pesapi_scope__();
    free(scope);
}

void pesapi_close_scope_placement(pesapi_scope scope)
{
    pesapi_close_scope(scope);
}

int pesapi_has_caught(pesapi_scope pscope)
{
    auto scope = reinterpret_cast<pesapi_scope__*>(pscope);
    return scope->caught != nullptr;
}

//内部调用，不需要切换线程
const char* pesapi_get_exception_as_string(pesapi_scope pscope, int with_stack)
{
    auto scope = reinterpret_cast<pesapi_scope__*>(pscope);
    PyThreadState* old = PyThreadState_Swap(PyInterpreterState_ThreadHead(scope->state));
    if (!scope->caught)
    {
        return nullptr;
    }
    auto ex = scope->caught->ex;
    auto globals = PyModule_GetDict(PyImport_AddModule("__main__"));
    PyDict_SetItem(globals, PyUnicode_FromString("__pesapi_last_exception"), ex);
    const char* ret;
    if (with_stack)
    {
        PyRun_SimpleString(
            "import traceback\n"
            "try:\n"
            "    raise __pesapi_last_exception\n"
            "except Exception as e:\n"
            "    __pesapi_last_exception_str = ''.join(traceback.format_exception(type(e), e, e.__traceback__))\n");
        ret = PyUnicode_AsUTF8(PyDict_GetItem(globals, PyUnicode_FromString("__pesapi_last_exception_str")));
    }
    else
    {
        ret = PyUnicode_AsUTF8(PyObject_Str(ex));
    }
    PyDict_DelItemString(globals, "__pesapi_last_exception");
    PyThreadState_Swap(old);
    return ret;
}

pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value value, uint32_t internal_field_count)
{
    size_t totalSize = sizeof(pesapi_value_ref__) + sizeof(void*) * internal_field_count;
    auto ret = reinterpret_cast<pesapi_value_ref>(malloc(totalSize));
    memset(ret, 0, totalSize);
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* v = pyObjectFromPesapiValue(value);
    Py_XINCREF(v);
    new (ret) pesapi_value_ref__(PyInterpreterState_Get(), v, internal_field_count);
    PyThreadState_Swap(old);
    return ret;
}

pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref pref)
{
    auto value_ref = reinterpret_cast<pesapi_value_ref__*>(pref);
    ++value_ref->ref_count;
    return pref;
}

void pesapi_release_value_ref(pesapi_value_ref ref)
{
    auto value_ref = reinterpret_cast<pesapi_value_ref__*>(ref);
    if (--value_ref->ref_count == 0)
    {
        if (!value_ref->env_life_cycle_tracker.expired())
        {
            value_ref->~pesapi_value_ref__();
        }
        free(value_ref);
    }
}

pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref pref)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto* value_ref = reinterpret_cast<pesapi_value_ref__*>(pref);
    auto* v = value_ref->value_persistent;
    Py_INCREF(v);
    auto* obj=pesapiValueFromPyObject(v);
    PyThreadState_Swap(old);
    return obj;
}

void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto value_ref = reinterpret_cast<pesapi_value_ref__*>(pvalue_ref);
    PyObject_GC_Del(value_ref->value_persistent);
    PyThreadState_Swap(old);
}

int pesapi_set_owner(pesapi_env env, pesapi_value value, pesapi_value owner)
{
    // Will not impl in Python
    return false;
}

pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref ref)
{
    return reinterpret_cast<pesapi_env_ref>(ref);
}

void** pesapi_get_ref_internal_fields(pesapi_value_ref value_ref, uint32_t* pinternal_field_count)
{
    auto* ref = reinterpret_cast<pesapi_value_ref__*>(value_ref);
    if (pinternal_field_count)
    {
        *pinternal_field_count = ref->internal_field_count;
    }
    return ref->internal_fields;
}

int pesapi_set_property(pesapi_env env, pesapi_value object, const char* key, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(object);
    PyObject* val = pyObjectFromPesapiValue(value);
    if (PyDict_Check(obj))
    {
        int res = PyDict_SetItemString(obj, key, val);
        PyThreadState_Swap(old);
        return res;
    }
    PyThreadState_Swap(old);
    return -1;
}

pesapi_value pesapi_get_property(pesapi_env env, pesapi_value object, const char* key)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* obj = pyObjectFromPesapiValue(object);
    if (PyDict_Check(obj))
    {
        auto ret = PyDict_GetItemWithError(obj, PyUnicode_FromString(key));
        //传值需要增加引用
        Py_XINCREF(ret);
        auto* res=pesapiValueFromPyObject(ret);
        PyThreadState_Swap(old);
        return res;
    }
    PyThreadState_Swap(old);
    return nullptr;
}

int pesapi_get_private(pesapi_env penv, pesapi_value pobject, void** out_ptr)
{
    auto* env = pyStateFromPesapiEnv(penv);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(env));
    auto mapper = CppObjectMapper::Get(env);
    auto obj = pyObjectFromPesapiValue(pobject);
    int res= mapper->GetPrivateData(obj, out_ptr);
    PyThreadState_Swap(old);
    return res;
}

int pesapi_set_private(pesapi_env penv, pesapi_value object, void* ptr)
{
    auto* env = pyStateFromPesapiEnv(penv);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(env));
    auto mapper = CppObjectMapper::Get(env);
    auto obj = pyObjectFromPesapiValue(object);
    int res = mapper->SetPrivateData(obj, ptr);
    PyThreadState_Swap(old);
    return res;
}

pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value object, uint32_t key)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto obj = pyObjectFromPesapiValue(object);
    if (PyDict_Check(obj))
    {
        auto ret = PyDict_GetItemWithError(obj, PyLong_FromUnsignedLong(key));
        Py_XINCREF(ret);
        auto* res = pesapiValueFromPyObject(ret);
        PyThreadState_Swap(old);
        return res;
    }
    PyThreadState_Swap(old);
    return nullptr;
}

int pesapi_set_property_uint32(pesapi_env env, pesapi_value object, uint32_t key, pesapi_value value)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto obj = pyObjectFromPesapiValue(object);
    PyObject* val = pyObjectFromPesapiValue(value);
    if (PyDict_Check(obj))
    {
        int res= PyDict_SetItem(obj, PyLong_FromUnsignedLong(key), val);
        PyThreadState_Swap(old);
        return res;
    }
    PyThreadState_Swap(old);
    return false;
}

pesapi_value pesapi_create_object(pesapi_env env)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto* ret = allocValueInCurrentScope(state);
    *ret = PyDict_New();
    auto* obj= pesapiValueFromPyObject(*ret);
    PyThreadState_Swap(old);
    return obj;
}

// TODO
pesapi_value pesapi_call_function(pesapi_env env, pesapi_value pfunc, pesapi_value this_object, int argc, const pesapi_value pargv[])
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* func = pyObjectFromPesapiValue(pfunc);
    PyObject* args = PyTuple_New(argc);
    for (int i = 0; i < argc; ++i)
    {
        PyObject* arg = pyObjectFromPesapiValue(pargv[i]);
        Py_INCREF(arg);
        //steals reference
        PyTuple_SetItem(args, i, arg);
    }
    PyObject* result = PyObject_Call(func, args, nullptr);
    //不会触发元素GC
    Py_DECREF(args);
    if (result)
    {
        auto* obj = pesapiValueFromPyObject(result);
        PyThreadState_Swap(old);
        return obj;
    }
    else
    {
        auto scope = getCurrentScope(state);

#if PY_VERSION_HEX >= 0x030C0000
        {
            scope->setCaughtException(PyErr_GetRaisedException());
            PyErr_Clear();
        }

#else
        {
            PyObject *type = nullptr, *value = nullptr, *tb = nullptr;
            PyErr_Fetch(&type, &value, &tb);
            Py_XDECREF(type);
            Py_XDECREF(tb);
            if (value)
            {
                // std::cout << PyUnicode_AsUTF8(PyObject_Str(value)) << std::endl;
                scope->setCaughtException(value);
            }
        }
#endif
        PyThreadState_Swap(old);
        return nullptr;
    }
}


pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    PyObject* compiled_code = Py_CompileString(reinterpret_cast<const char*>(code), path, Py_eval_input);
    if (compiled_code)
    {
        PyObject* globals = PyModule_GetDict(PyImport_AddModule("__main__"));
        //可不可以使用PyRun_String()？
        PyObject* result = PyEval_EvalCode(compiled_code, globals, globals);
        Py_DECREF(compiled_code);
        std::cout << reinterpret_cast<const char*>(code) << std::endl;
        if (result)
        {
            auto* obj = pesapiValueFromPyObject(result);
            if (PyLong_Check(result))
                std::cout << "Result: " << PyLong_AsLong(result)<<std::endl;
            //PyThreadState_Swap(old);
            return obj;
        }
    }

    //异常捕获和处理
    //可能返回空值
    if (PyErr_Occurred())
    {
        auto scope = getCurrentScope(state);

#if PY_VERSION_HEX >= 0x030C0000
        {
            scope->setCaughtException(PyErr_GetRaisedException());
            PyErr_Clear();
        }

#else
        {
            PyObject *type = nullptr, *value = nullptr, *tb = nullptr;
            PyErr_Fetch(&type, &value, &tb);
            Py_XDECREF(type);
            Py_XDECREF(tb);
            if (value)
            {
                // std::cout << PyUnicode_AsUTF8(PyObject_Str(value)) << std::endl;
                scope->setCaughtException(value);
            }
        }
#endif
    }

    PyThreadState_Swap(old);
    return nullptr;
}

pesapi_value pesapi_global(pesapi_env env)
{
    auto* state = pyStateFromPesapiEnv(env);
    PyThreadState* old=PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto* globals = pesapiValueFromPyObject(PyModule_GetDict(PyImport_AddModule("__main__")));
    PyThreadState_Swap(old);
    return globals;
}

const void* pesapi_get_env_private(pesapi_env env)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old = PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    auto envp= CppObjectMapper::Get(state)->GetEnvPrivate();
    PyThreadState_Swap(old);
    return envp;
}

void pesapi_set_env_private(pesapi_env env, const void* ptr)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old = PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    CppObjectMapper::Get(state)->SetEnvPrivate(ptr);
    PyThreadState_Swap(old);
}

void pesapi_set_registry(pesapi_env env, pesapi_registry registry)
{
    auto state = pyStateFromPesapiEnv(env);
    PyThreadState* old = PyThreadState_Swap(PyInterpreterState_ThreadHead(state));
    CppObjectMapper::Get(state)->SetRegistry(reinterpret_cast<puerts::ScriptClassRegistry*>(registry));
    PyThreadState_Swap(old);
}

pesapi_ffi g_pesapi_ffi{&pesapi_create_null, &pesapi_create_undefined, &pesapi_create_boolean, &pesapi_create_int32,
    &pesapi_create_uint32, &pesapi_create_int64, &pesapi_create_uint64, &pesapi_create_double, &pesapi_create_string_utf8,
    &pesapi_create_string_utf16, &pesapi_create_binary, &pesapi_create_binary_by_value, &pesapi_create_array, &pesapi_create_object,
    &pesapi_create_function, &pesapi_create_class, &pesapi_get_value_bool, &pesapi_get_value_int32, &pesapi_get_value_uint32,
    &pesapi_get_value_int64, &pesapi_get_value_uint64, &pesapi_get_value_double, &pesapi_get_value_string_utf8,
    &pesapi_get_value_string_utf16, &pesapi_get_value_binary, &pesapi_get_array_length, &pesapi_is_null, &pesapi_is_undefined,
    &pesapi_is_boolean, &pesapi_is_int32, &pesapi_is_uint32, &pesapi_is_int64, &pesapi_is_uint64, &pesapi_is_double,
    &pesapi_is_string, &pesapi_is_object, &pesapi_is_function, &pesapi_is_binary, &pesapi_is_array, &pesapi_native_object_to_value,
    &pesapi_get_native_object_ptr, &pesapi_get_native_object_typeid, &pesapi_is_instance_of, &pesapi_boxing, &pesapi_unboxing,
    &pesapi_update_boxed_value, &pesapi_is_boxed_value, &pesapi_get_args_len, &pesapi_get_arg, &pesapi_get_env,
    &pesapi_get_native_holder_ptr, &pesapi_get_native_holder_typeid, &pesapi_get_userdata, &pesapi_add_return,
    &pesapi_throw_by_string, &pesapi_create_env_ref, &pesapi_env_ref_is_valid, &pesapi_get_env_from_ref, &pesapi_duplicate_env_ref,
    &pesapi_release_env_ref, &pesapi_open_scope, &pesapi_open_scope_placement, &pesapi_has_caught, &pesapi_get_exception_as_string,
    &pesapi_close_scope, &pesapi_close_scope_placement, &pesapi_create_value_ref, &pesapi_duplicate_value_ref,
    &pesapi_release_value_ref, &pesapi_get_value_from_ref, &pesapi_set_ref_weak, &pesapi_set_owner, &pesapi_get_ref_associated_env,
    &pesapi_get_ref_internal_fields, &pesapi_get_property, &pesapi_set_property, &pesapi_get_private, &pesapi_set_private,
    &pesapi_get_property_uint32, &pesapi_set_property_uint32, &pesapi_call_function, &pesapi_eval, &pesapi_global,
    &pesapi_get_env_private, &pesapi_set_env_private, &pesapi_set_registry};
}    // namespace pythonimpl
}    // namespace pesapi
