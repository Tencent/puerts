/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#include "PesapiPythonImpl.h"
#include "pesapi.h"
#include <Python.h>
#include <iostream>

namespace pesapi
{
namespace pythonimpl
{

inline pesapi_value pesapiValueFromPyObject(PyObject* obj)
{
    return reinterpret_cast<pesapi_value>(obj);
}

inline PyObject* pyObjectFromPesapiValue(pesapi_value value)
{
    return reinterpret_cast<PyObject*>(value);
}

inline pesapi_env pesapiEnvFromPyInterpreter(PyInterpreterState* interp)
{
    return reinterpret_cast<pesapi_env>(interp);
}

inline PyInterpreterState* pyInterpreterFromPesapiEnv(pesapi_env env)
{
    return reinterpret_cast<PyInterpreterState*>(env);
}

pesapi_value pesapi_create_int32(pesapi_env env, int32_t value)
{
    PyObject* pyInt = PyLong_FromLong(value);
    return pesapiValueFromPyObject(pyInt);
}

pesapi_value pesapi_create_boolean(pesapi_env env, int value)
{
    PyObject* pyBool = PyBool_FromLong(value);
    return pesapiValueFromPyObject(pyBool);
}

pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length)
{
    PyObject* pyStr = PyUnicode_FromStringAndSize(str, length);
    return pesapiValueFromPyObject(pyStr);
}

pesapi_value pesapi_create_double(pesapi_env env, double value)
{
    PyObject* pyDouble = PyFloat_FromDouble(value);
    return pesapiValueFromPyObject(pyDouble);
}

pesapi_value pesapi_create_array(pesapi_env env)
{
    PyObject* pyList = PyList_New(0);
    return pesapiValueFromPyObject(pyList);
}

pesapi_value pesapi_create_object(pesapi_env env)
{
    PyObject* pyDict = PyDict_New();
    return pesapiValueFromPyObject(pyDict);
}

pesapi_value pesapi_create_null(pesapi_env env)
{
    Py_INCREF(Py_None);
    return pesapiValueFromPyObject(Py_None);
}

pesapi_value pesapi_create_undefined(pesapi_env env)
{
    // Python does not have an explicit undefined, using None as a placeholder
    Py_INCREF(Py_None);
    return pesapiValueFromPyObject(Py_None);
}

double pesapi_get_value_double(pesapi_env env, pesapi_value value)
{
    PyObject* pyDouble = pyObjectFromPesapiValue(value);
    if (PyFloat_Check(pyDouble))
    {
        return PyFloat_AsDouble(pyDouble);
    }
    return 0.0; // Default value if not a double
}

uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value value)
{
    PyObject* pyList = pyObjectFromPesapiValue(value);
    if (PyList_Check(pyList))
    {
        return static_cast<uint32_t>(PyList_Size(pyList));
    }
    return 0; // Default value if not a list
}

int pesapi_is_null(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return pyValue == Py_None;
}

int pesapi_is_boolean(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyBool_Check(pyValue);
}

int pesapi_is_int32(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyLong_Check(pyValue) && PyLong_AsLong(pyValue) <= INT32_MAX && PyLong_AsLong(pyValue) >= INT32_MIN;
}

pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value)
{
    PyObject* pyUInt32 = PyLong_FromUnsignedLong(value);
    return pesapiValueFromPyObject(pyUInt32);
}

pesapi_value pesapi_create_int64(pesapi_env env, int64_t value)
{
    PyObject* pyInt64 = PyLong_FromLongLong(value);
    return pesapiValueFromPyObject(pyInt64);
}

pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value)
{
    PyObject* pyUInt64 = PyLong_FromUnsignedLongLong(value);
    return pesapiValueFromPyObject(pyUInt64);
}

pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t* str, size_t length)
{
    PyObject* pyStr = PyUnicode_FromKindAndData(PyUnicode_2BYTE_KIND, str, length);
    return pesapiValueFromPyObject(pyStr);
}

pesapi_value pesapi_create_binary(pesapi_env env, void* data, size_t length)
{
    PyObject* pyBytes = PyBytes_FromStringAndSize(static_cast<const char*>(data), length);
    return pesapiValueFromPyObject(pyBytes);
}

pesapi_value pesapi_create_binary_by_value(pesapi_env env, void* data, size_t length)
{
    PyObject* pyBytes = PyBytes_FromStringAndSize(static_cast<const char*>(data), length);
    return pesapiValueFromPyObject(pyBytes);
}

pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    if (!type_id) {
        PyErr_SetString(PyExc_ValueError, "type_id cannot be null");
        return nullptr;
    }

    // Create a Python class dynamically
    PyObject* pyClass = PyType_Type.tp_new(&PyType_Type, nullptr, nullptr);
    if (!pyClass) {
        PyErr_SetString(PyExc_RuntimeError, "Failed to create Python class");
        return nullptr;
    }

    return pesapiValueFromPyObject(pyClass);
}

int pesapi_get_value_bool(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyObject_IsTrue(pyValue);
}

int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return static_cast<int32_t>(PyLong_AsLong(pyValue));
}

uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return static_cast<uint32_t>(PyLong_AsUnsignedLong(pyValue));
}

int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyLong_AsLongLong(pyValue);
}

uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyLong_AsUnsignedLongLong(pyValue);
}

int pesapi_is_undefined(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return pyValue == Py_None;
}

int pesapi_is_string(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyUnicode_Check(pyValue);
}

int pesapi_is_object(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyDict_Check(pyValue);
}

int pesapi_is_function(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyCallable_Check(pyValue);
}

int pesapi_is_binary(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyBytes_Check(pyValue);
}

int pesapi_is_array(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyList_Check(pyValue);
}

const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value value, char* buf, size_t* bufsize) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    if (PyUnicode_Check(pyValue)) {
        Py_ssize_t length;
        const char* str = PyUnicode_AsUTF8AndSize(pyValue, &length);
        if (str && buf && bufsize && *bufsize >= static_cast<size_t>(length)) {
            memcpy(buf, str, length);
            *bufsize = length;
            return buf;
        }
        if (bufsize) {
            *bufsize = static_cast<size_t>(length);
        }
        return str;
    }
    return nullptr;
}

const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value value, uint16_t* buf, size_t* bufsize) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    if (PyUnicode_Check(pyValue)) {
        Py_ssize_t length;
        const uint16_t* data = reinterpret_cast<const uint16_t*>(PyUnicode_AsWideCharString(pyValue, &length));
        if (data && buf && bufsize && *bufsize >= static_cast<size_t>(length)) {
            memcpy(buf, data, length * sizeof(uint16_t));
            *bufsize = length;
            PyMem_Free((void*)data);
            return buf;
        }
        if (bufsize) {
            *bufsize = static_cast<size_t>(length);
        }
        return data;
    }
    return nullptr;
}

void* pesapi_get_value_binary(pesapi_env env, pesapi_value value, size_t* bufsize) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    if (PyBytes_Check(pyValue)) {
        char* data;
        Py_ssize_t length;
        if (PyBytes_AsStringAndSize(pyValue, &data, &length) == 0) {
            if (bufsize) {
                *bufsize = static_cast<size_t>(length);
            }
            return data;
        }
    }
    return nullptr;
}

int pesapi_is_uint32(pesapi_env env, pesapi_value value) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyLong_Check(pyValue) && PyLong_AsUnsignedLong(pyValue) <= UINT32_MAX;
}

int pesapi_is_int64(pesapi_env env, pesapi_value value) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyLong_Check(pyValue) && PyLong_AsLongLong(pyValue) >= INT64_MIN && PyLong_AsLongLong(pyValue) <= INT64_MAX;
}

int pesapi_is_uint64(pesapi_env env, pesapi_value value) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyLong_Check(pyValue) && PyLong_AsUnsignedLongLong(pyValue) <= UINT64_MAX;
}

int pesapi_is_double(pesapi_env env, pesapi_value value)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyFloat_Check(pyValue);
}

pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize) {
    if (type_id == nullptr) {
        std::cerr << "[pesapi_native_object_to_value] Error: type_id is null." << std::endl;
        return nullptr;
    }

    if (object_ptr == nullptr) {
        std::cerr << "[pesapi_native_object_to_value] Error: object_ptr is null." << std::endl;
        return nullptr;
    }

    PyObject* pyObject = PyCapsule_New(object_ptr, static_cast<const char*>(type_id), nullptr);
    if (pyObject == nullptr) {
        std::cerr << "[pesapi_native_object_to_value] Error: Failed to create PyCapsule." << std::endl;
    }

    return pesapiValueFromPyObject(pyObject);
}

void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value value) {
    if (value == nullptr) {
        std::cerr << "[pesapi_get_native_object_ptr] Error: value is null." << std::endl;
        return nullptr;
    }

    PyObject* pyValue = pyObjectFromPesapiValue(value);
    if (pyValue == nullptr) {
        std::cerr << "[pesapi_get_native_object_ptr] Error: pyValue is null." << std::endl;
        return nullptr;
    }

    if (PyCapsule_CheckExact(pyValue)) {
        void* ptr = PyCapsule_GetPointer(pyValue, nullptr);
        if (ptr == nullptr) {
            std::cerr << "[pesapi_get_native_object_ptr] Error: Failed to get pointer from PyCapsule." << std::endl;
        }
        return ptr;
    } else {
        std::cerr << "[pesapi_get_native_object_ptr] Error: pyValue is not a PyCapsule." << std::endl;
    }

    return nullptr;
}

const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value value) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    if (PyCapsule_CheckExact(pyValue)) {
        return PyCapsule_GetName(pyValue);
    }
    return nullptr;
}

int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value value) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyCapsule_CheckExact(pyValue) && strcmp(PyCapsule_GetName(pyValue), static_cast<const char*>(type_id)) == 0;
}

pesapi_value pesapi_boxing(pesapi_env env, pesapi_value value) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    Py_INCREF(pyValue);
    return pesapiValueFromPyObject(pyValue);
}

pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize) {
    if (!native_impl) {
        PyErr_SetString(PyExc_ValueError, "native_impl cannot be null");
        return nullptr;
    }

    // Create a Python callable object
    PyObject* pyFunc = PyCFunction_NewEx(nullptr, nullptr, nullptr); // Replace with actual logic
    if (!pyFunc) {
        PyErr_SetString(PyExc_RuntimeError, "Failed to create Python function");
        return nullptr;
    }

    return pesapiValueFromPyObject(pyFunc);
}

pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value value) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    if (pyValue == nullptr) {
        std::cerr << "[pesapi_unboxing] Error: value is null." << std::endl;
        return nullptr;
    }

    if (PyCapsule_CheckExact(pyValue)) {
        void* unboxedValue = PyCapsule_GetPointer(pyValue, nullptr);
        if (unboxedValue == nullptr) {
            std::cerr << "[pesapi_unboxing] Error: Failed to get pointer from PyCapsule." << std::endl;
        }
        return pesapiValueFromPyObject(reinterpret_cast<PyObject*>(unboxedValue));
    } else {
        std::cerr << "[pesapi_unboxing] Error: pyValue is not a PyCapsule." << std::endl;
    }

    return nullptr;
}

void pesapi_update_boxed_value(pesapi_env env, pesapi_value boxed_value, pesapi_value value) {
    PyObject* pyBoxedValue = pyObjectFromPesapiValue(boxed_value);
    PyObject* pyValue = pyObjectFromPesapiValue(value);

    if (pyBoxedValue == nullptr || pyValue == nullptr) {
        std::cerr << "[pesapi_update_boxed_value] Error: One or both values are null." << std::endl;
        return;
    }

    if (PyCapsule_CheckExact(pyBoxedValue)) {
        PyCapsule_SetPointer(pyBoxedValue, pyValue);
    } else {
        std::cerr << "[pesapi_update_boxed_value] Error: boxed_value is not a PyCapsule." << std::endl;
    }
}

int pesapi_is_boxed_value(pesapi_env env, pesapi_value value) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    return PyCapsule_CheckExact(pyValue);
}

int pesapi_get_args_len(pesapi_callback_info info) {
    // Placeholder: Assuming info contains a Python tuple of arguments
    PyObject* args = reinterpret_cast<PyObject*>(info);
    if (PyTuple_Check(args)) {
        return static_cast<int>(PyTuple_Size(args));
    }
    return 0;
}

pesapi_value pesapi_get_arg(pesapi_callback_info info, int index) {
    PyObject* args = reinterpret_cast<PyObject*>(info);
    if (PyTuple_Check(args) && index >= 0 && index < PyTuple_Size(args)) {
        PyObject* arg = PyTuple_GetItem(args, index);
        Py_INCREF(arg);
        return pesapiValueFromPyObject(arg);
    }
    return nullptr;
}

pesapi_env pesapi_get_env(pesapi_callback_info info) {
    PyObject* pyInfo = reinterpret_cast<PyObject*>(info);
    if (pyInfo && PyTuple_Check(pyInfo)) {
        // Assuming the first item in the tuple is the environment
        PyObject* env = PyTuple_GetItem(pyInfo, 0);
        return reinterpret_cast<pesapi_env>(env);
    }
    return nullptr;
}

void* pesapi_get_native_holder_ptr(pesapi_callback_info info) {
    PyObject* pyInfo = reinterpret_cast<PyObject*>(info);
    if (pyInfo && PyTuple_Check(pyInfo)) {
        // Assuming the second item in the tuple is the native holder pointer
        PyObject* holder = PyTuple_GetItem(pyInfo, 1);
        return PyCapsule_GetPointer(holder, nullptr);
    }
    return nullptr;
}

const void* pesapi_get_native_holder_typeid(pesapi_callback_info info) {
    PyObject* pyInfo = reinterpret_cast<PyObject*>(info);
    if (pyInfo && PyTuple_Check(pyInfo)) {
        // Assuming the third item in the tuple is the type ID
        PyObject* typeId = PyTuple_GetItem(pyInfo, 2);
        return PyCapsule_GetPointer(typeId, nullptr);
    }
    return nullptr;
}

void* pesapi_get_userdata(pesapi_callback_info info) {
    PyObject* pyInfo = reinterpret_cast<PyObject*>(info);
    if (pyInfo && PyTuple_Check(pyInfo)) {
        // Assuming the fourth item in the tuple is the user data
        PyObject* userData = PyTuple_GetItem(pyInfo, 3);
        return PyCapsule_GetPointer(userData, nullptr);
    }
    return nullptr;
}

void pesapi_add_return(pesapi_callback_info info, pesapi_value value) {
    PyObject* pyInfo = reinterpret_cast<PyObject*>(info);
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    if (pyInfo && PyTuple_Check(pyInfo) && pyValue) {
        // Assuming the fifth item in the tuple is the return container
        PyObject* returnContainer = PyTuple_GetItem(pyInfo, 4);
        Py_INCREF(pyValue);
        PyTuple_SetItem(returnContainer, 0, pyValue);
    }
}

void pesapi_throw_by_string(pesapi_callback_info info, const char* msg) {
    if (msg) {
        PyErr_SetString(PyExc_RuntimeError, msg);
    }
}

pesapi_env_ref pesapi_create_env_ref(pesapi_env env) {
    Py_INCREF(reinterpret_cast<PyObject*>(env));
    return reinterpret_cast<pesapi_env_ref>(env);
}

int pesapi_env_ref_is_valid(pesapi_env_ref env_ref) {
    return env_ref != nullptr;
}

pesapi_env pesapi_get_env_from_ref(pesapi_env_ref env_ref) {
    return reinterpret_cast<pesapi_env>(env_ref);
}

pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref env_ref) {
    Py_INCREF(reinterpret_cast<PyObject*>(env_ref));
    return env_ref;
}

void pesapi_release_env_ref(pesapi_env_ref env_ref) {
    Py_DECREF(reinterpret_cast<PyObject*>(env_ref));
}

pesapi_value_ref pesapi_get_value_ref(pesapi_env env, pesapi_value value) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    if (pyValue) {
        Py_INCREF(pyValue);
        return reinterpret_cast<pesapi_value_ref>(pyValue);
    }
    return nullptr;
}

pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value value) {
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    if (pyValue) {
        Py_INCREF(pyValue);
        return reinterpret_cast<pesapi_value_ref>(pyValue);
    }
    return nullptr;
}

void pesapi_release_value_ref(pesapi_env env, pesapi_value_ref value_ref) {
    PyObject* pyValue = reinterpret_cast<PyObject*>(value_ref);
    if (pyValue) {
        Py_DECREF(pyValue);
    }
}

pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref value_ref) {
    PyObject* pyValue = reinterpret_cast<PyObject*>(value_ref);
    if (pyValue) {
        Py_INCREF(pyValue);
        return pesapiValueFromPyObject(pyValue);
    }
    return nullptr;
}

int pesapi_is_value_ref_valid(pesapi_env env, pesapi_value_ref value_ref) {
    return value_ref != nullptr;
}


// Define the complete structure for pesapi_scope__
struct pesapi_scope__ {
    pesapi_env_ref env_ref;
    bool has_exception;
    std::string exception_message;
};

static_assert(sizeof(pesapi_scope_memory) >= sizeof(pesapi_scope__), "pesapi_scope_memory is too small to hold pesapi_scope__");

pesapi_scope pesapi_open_scope(pesapi_env_ref env_ref) {
    // Allocate a new scope
    pesapi_scope scope = reinterpret_cast<pesapi_scope>(new pesapi_scope_memory());
    scope->env_ref = env_ref;
    scope->has_exception = false;
    return scope;
}

pesapi_scope pesapi_open_scope_placement(pesapi_env_ref env_ref, struct pesapi_scope_memory* memory) {
    pesapi_scope scope = reinterpret_cast<pesapi_scope>(memory);
    scope->env_ref = env_ref;
    scope->has_exception = false;
    return scope;
}

const char* pesapi_get_exception_as_string(pesapi_scope scope, int with_stack) {
    if (scope->has_exception) {
        return scope->exception_message.c_str();
    }
    return nullptr;
}

void pesapi_close_scope(pesapi_scope scope) {
    delete reinterpret_cast<pesapi_scope__*>(scope);
}

void pesapi_close_scope_placement(pesapi_scope scope) {
    // No operation needed for placement scope
}

pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref value_ref) {
    PyObject* pyValue = reinterpret_cast<PyObject*>(value_ref);
    Py_INCREF(pyValue);
    return reinterpret_cast<pesapi_value_ref>(pyValue);
}

void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref value_ref)
{
    PyObject* pyObj = pyObjectFromPesapiValue(reinterpret_cast<pesapi_value>(value_ref));
    Py_DECREF(pyObj); // Decrease reference count to make it weak
}

int pesapi_set_owner(pesapi_env env, pesapi_value value, pesapi_value owner)
{
    PyObject* pyValue = pyObjectFromPesapiValue(value);
    PyObject* pyOwner = pyObjectFromPesapiValue(owner);

    if (PyDict_Check(pyOwner))
    {
        PyDict_SetItemString(pyOwner, "_p_i_only_one_child", pyValue);
        return 1; // Success
    }
    return 0; // Failure
}

pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref)
{
    return reinterpret_cast<pesapi_env_ref>(value_ref);
}

void** pesapi_get_ref_internal_fields(pesapi_value_ref value_ref, uint32_t* pinternal_field_count)
{
    *pinternal_field_count = 0; // Python objects do not have internal fields
    return nullptr;
}

const void* pesapi_get_env_private(pesapi_env env)
{
    return nullptr; // Python does not have a direct equivalent for private data in the environment
}

} // namespace pythonimpl
} // namespace pesapi
