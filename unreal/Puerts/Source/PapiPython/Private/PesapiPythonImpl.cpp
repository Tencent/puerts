/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 Tencent.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

// the python implementation of pesapi, ported from unity/native/papi-python, with the behavior aligned to the lua backend of
// unreal (PapiLua). A pesapi_env is the mapper of the env, a pesapi_value is a PyObject* (nullptr: None)

#include "PesapiPythonImpl.h"
#include "PythonInclude.h"

#if PUERTS_PAPI_PYTHON

#include "PythonPapiData.h"
#include "PythonObjectMapper.h"
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <new>
#include <string>
#include <vector>

namespace PUERTS_NAMESPACE
{
namespace pyimpl
{
static inline FCppObjectMapper* MapperOf(pesapi_env Env)
{
    return reinterpret_cast<FCppObjectMapper*>(Env);
}

// the object of a value, None for nullptr (borrowed)
static inline PyObject* Obj(pesapi_value Value)
{
    return Value ? reinterpret_cast<PyObject*>(Value) : Py_None;
}

static inline PyObject* Raw(pesapi_value Value)
{
    return reinterpret_cast<PyObject*>(Value);
}

static inline bool IsNone(PyObject* O)
{
    return !O || O == Py_None;
}

static inline pesapi_scope__* ScopeOf(pesapi_scope Scope)
{
    return reinterpret_cast<pesapi_scope__*>(Scope);
}

static inline pesapi_env_ref__* EnvRefOf(pesapi_env_ref Ref)
{
    return reinterpret_cast<pesapi_env_ref__*>(Ref);
}

static inline pesapi_value_ref__* ValueRefOf(pesapi_value_ref Ref)
{
    return reinterpret_cast<pesapi_value_ref__*>(Ref);
}

static inline pesapi_callback_info__* InfoOf(pesapi_callback_info Info)
{
    return reinterpret_cast<pesapi_callback_info__*>(Info);
}

// keeps a new reference in the current scope, a failure (nullptr) is caught by the scope
static inline pesapi_value Keep(FCppObjectMapper* Mapper, PyObject* NewRef)
{
    if (!NewRef)
    {
        if (PyErr_Occurred())
        {
            Mapper->CatchError();
        }
        return nullptr;
    }
    return Mapper->Track(NewRef);
}

static inline pesapi_value KeepBorrowed(FCppObjectMapper* Mapper, PyObject* Borrowed)
{
    if (!Borrowed)
    {
        return nullptr;
    }
    Py_INCREF(Borrowed);
    return Mapper->Track(Borrowed);
}

static inline bool IsInt(PyObject* O)
{
    return O && PyLong_Check(O) && !PyBool_Check(O);
}

// ---------------------------------------------------------------- value process

static pesapi_value pesapi_create_null(pesapi_env env)
{
    return reinterpret_cast<pesapi_value>(Py_None);
}

static pesapi_value pesapi_create_undefined(pesapi_env env)
{
    return reinterpret_cast<pesapi_value>(Py_None);
}

static pesapi_value pesapi_create_boolean(pesapi_env env, int value)
{
    return Keep(MapperOf(env), PyBool_FromLong(value));
}

static pesapi_value pesapi_create_int32(pesapi_env env, int32_t value)
{
    return Keep(MapperOf(env), PyLong_FromLong(value));
}

static pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value)
{
    return Keep(MapperOf(env), PyLong_FromUnsignedLong(value));
}

static pesapi_value pesapi_create_int64(pesapi_env env, int64_t value)
{
    return Keep(MapperOf(env), PyLong_FromLongLong(value));
}

static pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value)
{
    return Keep(MapperOf(env), PyLong_FromUnsignedLongLong(value));
}

static pesapi_value pesapi_create_double(pesapi_env env, double value)
{
    return Keep(MapperOf(env), PyFloat_FromDouble(value));
}

static pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length)
{
    if (!str)
    {
        str = "";
        length = 0;
    }
    PyObject* S = PyUnicode_DecodeUTF8(str, static_cast<Py_ssize_t>(length), "surrogatepass");
    if (!S)
    {
        PyErr_Clear();
        S = PyUnicode_DecodeUTF8(str, static_cast<Py_ssize_t>(length), "replace");
    }
    return Keep(MapperOf(env), S);
}

static pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t* str, size_t length)
{
    static const uint16_t Empty = 0;
    if (!str)
    {
        str = &Empty;
        length = 0;
    }
    int Order = -1;
    PyObject* S =
        PyUnicode_DecodeUTF16(reinterpret_cast<const char*>(str), static_cast<Py_ssize_t>(length * 2), "surrogatepass", &Order);
    if (!S)
    {
        PyErr_Clear();
        Order = -1;
        S = PyUnicode_DecodeUTF16(reinterpret_cast<const char*>(str), static_cast<Py_ssize_t>(length * 2), "replace", &Order);
    }
    return Keep(MapperOf(env), S);
}

static pesapi_value pesapi_create_binary(pesapi_env env, void* bin, size_t length)
{
    if (!bin)
    {
        return Keep(MapperOf(env), PyByteArray_FromStringAndSize(nullptr, 0));
    }
    return Keep(MapperOf(env), PyMemoryView_FromMemory(static_cast<char*>(bin), static_cast<Py_ssize_t>(length), PyBUF_WRITE));
}

static pesapi_value pesapi_create_binary_by_value(pesapi_env env, void* bin, size_t length)
{
    if (!bin)
    {
        length = 0;
    }
    return Keep(MapperOf(env), PyByteArray_FromStringAndSize(static_cast<const char*>(bin), static_cast<Py_ssize_t>(length)));
}

static pesapi_value pesapi_create_array(pesapi_env env)
{
    return Keep(MapperOf(env), PyList_New(0));
}

// an object supports both the attributes and the getattr / setattr of pesapi
static pesapi_value pesapi_create_object(pesapi_env env)
{
    auto Mapper = MapperOf(env);
    return Keep(Mapper, PyObject_CallNoArgs(Mapper->NamespaceType));
}

static pesapi_value pesapi_create_function(
    pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    auto Mapper = MapperOf(env);
    return Keep(Mapper, Mapper->NewFunction(native_impl, data, finalize, "native", false));
}

static pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    auto Mapper = MapperOf(env);
    return KeepBorrowed(Mapper, Mapper->GetClassByID(type_id));
}

static int pesapi_get_value_bool(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    if (IsNone(O))
    {
        return 0;
    }
    int Ret = PyObject_IsTrue(O);
    if (Ret < 0)
    {
        PyErr_Clear();
        return 0;
    }
    return Ret;
}

// ToInt32 / ToUint32 of js for a double
static uint32_t DoubleToUint32Bits(double D)
{
    if (!std::isfinite(D))
    {
        return 0;
    }
    D = std::trunc(D);
    double M = std::fmod(D, 4294967296.0);
    if (M < 0)
    {
        M += 4294967296.0;
    }
    return static_cast<uint32_t>(M);
}

static uint32_t ToUint32Bits(PyObject* O)
{
    if (!O)
    {
        return 0;
    }
    if (PyLong_Check(O))
    {
        unsigned long long V = PyLong_AsUnsignedLongLongMask(O);
        if (V == static_cast<unsigned long long>(-1) && PyErr_Occurred())
        {
            PyErr_Clear();
            return 0;
        }
        return static_cast<uint32_t>(V);
    }
    if (PyFloat_Check(O))
    {
        return DoubleToUint32Bits(PyFloat_AS_DOUBLE(O));
    }
    return 0;
}

static int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value pvalue)
{
    return static_cast<int32_t>(ToUint32Bits(Raw(pvalue)));
}

static uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value pvalue)
{
    return ToUint32Bits(Raw(pvalue));
}

static int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    if (!O)
    {
        return 0;
    }
    if (PyLong_Check(O))
    {
        int Overflow = 0;
        long long V = PyLong_AsLongLongAndOverflow(O, &Overflow);
        if (Overflow)
        {
            V = static_cast<long long>(PyLong_AsUnsignedLongLongMask(O));
        }
        if (PyErr_Occurred())
        {
            PyErr_Clear();
            return 0;
        }
        return static_cast<int64_t>(V);
    }
    if (PyFloat_Check(O))
    {
        double D = PyFloat_AS_DOUBLE(O);
        if (!std::isfinite(D))
        {
            return 0;
        }
        D = std::trunc(D);
        if (D >= 9223372036854775807.0)
        {
            return INT64_MAX;
        }
        if (D <= -9223372036854775808.0)
        {
            return INT64_MIN;
        }
        return static_cast<int64_t>(D);
    }
    return 0;
}

static uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    if (!O)
    {
        return 0;
    }
    if (PyLong_Check(O))
    {
        unsigned long long V = PyLong_AsUnsignedLongLongMask(O);
        if (PyErr_Occurred())
        {
            PyErr_Clear();
            return 0;
        }
        return static_cast<uint64_t>(V);
    }
    if (PyFloat_Check(O))
    {
        double D = PyFloat_AS_DOUBLE(O);
        if (!std::isfinite(D) || D <= 0)
        {
            return 0;
        }
        D = std::trunc(D);
        if (D >= 18446744073709551615.0)
        {
            return UINT64_MAX;
        }
        return static_cast<uint64_t>(D);
    }
    return 0;
}

static double pesapi_get_value_double(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    if (!O)
    {
        return 0;
    }
    if (PyFloat_Check(O))
    {
        return PyFloat_AS_DOUBLE(O);
    }
    if (PyLong_Check(O))
    {
        double D = PyLong_AsDouble(O);
        if (D == -1.0 && PyErr_Occurred())
        {
            PyErr_Clear();
            return 0;
        }
        return D;
    }
    return 0;
}

// the utf-8 (surrogates passed) of str(value), false on failure
static bool ToUtf8(PyObject* O, std::string& Out)
{
    PyObject* Tmp = nullptr;
    PyObject* S = O;
    if (!PyUnicode_Check(O))
    {
        Tmp = PyObject_Str(O);
        if (!Tmp)
        {
            PyErr_Clear();
            return false;
        }
        S = Tmp;
    }
    Py_ssize_t Len = 0;
    const char* Str = PyUnicode_AsUTF8AndSize(S, &Len);
    if (Str)
    {
        Out.assign(Str, static_cast<size_t>(Len));
        Py_XDECREF(Tmp);
        return true;
    }
    PyErr_Clear();
    PyObject* Bytes = PyUnicode_AsEncodedString(S, "utf-8", "surrogatepass");
    Py_XDECREF(Tmp);
    if (!Bytes)
    {
        PyErr_Clear();
        return false;
    }
    Out.assign(PyBytes_AS_STRING(Bytes), static_cast<size_t>(PyBytes_GET_SIZE(Bytes)));
    Py_DECREF(Bytes);
    return true;
}

static const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value pvalue, char* buf, size_t* bufsize)
{
    PyObject* O = Obj(pvalue);
    const char* Str = nullptr;
    size_t Len = 0;
    std::string Tmp;
    Py_ssize_t SLen = 0;
    if (PyUnicode_Check(O) && (Str = PyUnicode_AsUTF8AndSize(O, &SLen)) != nullptr)
    {
        Len = static_cast<size_t>(SLen);
    }
    else
    {
        if (PyErr_Occurred())
        {
            PyErr_Clear();
        }
        if (!ToUtf8(O, Tmp))
        {
            *bufsize = 0;
            return buf;
        }
        Str = Tmp.data();
        Len = Tmp.size();
    }
    if (buf == nullptr)
    {
        *bufsize = Len;
    }
    else
    {
        size_t N = Len < *bufsize ? Len : *bufsize;
        memcpy(buf, Str, N);
        if (N < *bufsize)
        {
            buf[N] = '\0';
        }
        *bufsize = N;
    }
    return buf;
}

static const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value pvalue, uint16_t* buf, size_t* bufsize)
{
    PyObject* O = Obj(pvalue);
    PyObject* Tmp = nullptr;
    PyObject* S = O;
    if (!PyUnicode_Check(O))
    {
        Tmp = PyObject_Str(O);
        if (!Tmp)
        {
            PyErr_Clear();
            *bufsize = 0;
            return buf;
        }
        S = Tmp;
    }
    PyObject* Bytes = PyUnicode_AsEncodedString(S, "utf-16-le", "surrogatepass");
    Py_XDECREF(Tmp);
    if (!Bytes)
    {
        PyErr_Clear();
        *bufsize = 0;
        return buf;
    }
    const size_t Units = static_cast<size_t>(PyBytes_GET_SIZE(Bytes)) / 2;
    if (buf == nullptr)
    {
        *bufsize = Units;
    }
    else
    {
        size_t Cap = *bufsize;
        size_t N = Units < Cap ? Units : Cap;
        memcpy(buf, PyBytes_AS_STRING(Bytes), N * 2);
        if (N < Cap)
        {
            buf[N] = 0;
        }
        *bufsize = N;
    }
    Py_DECREF(Bytes);
    return buf;
}

static void* pesapi_get_value_binary(pesapi_env env, pesapi_value pvalue, size_t* bufsize)
{
    PyObject* O = Raw(pvalue);
    if (O)
    {
        if (PyByteArray_Check(O))
        {
            *bufsize = static_cast<size_t>(PyByteArray_GET_SIZE(O));
            return PyByteArray_AS_STRING(O);
        }
        if (PyBytes_Check(O))
        {
            // read only
            *bufsize = static_cast<size_t>(PyBytes_GET_SIZE(O));
            return PyBytes_AS_STRING(O);
        }
        if (PyMemoryView_Check(O))
        {
            Py_buffer* Buffer = PyMemoryView_GET_BUFFER(O);
            *bufsize = static_cast<size_t>(Buffer->len);
            return Buffer->buf;
        }
    }
    *bufsize = 0;
    return nullptr;
}

static uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    if (O && PyList_Check(O))
    {
        return static_cast<uint32_t>(PyList_GET_SIZE(O));
    }
    if (O && PyTuple_Check(O))
    {
        return static_cast<uint32_t>(PyTuple_GET_SIZE(O));
    }
    return 0;
}

static int pesapi_is_null(pesapi_env env, pesapi_value pvalue)
{
    return IsNone(Raw(pvalue));
}

static int pesapi_is_undefined(pesapi_env env, pesapi_value pvalue)
{
    return IsNone(Raw(pvalue));
}

static int pesapi_is_boolean(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    return O && PyBool_Check(O);
}

// the value of an integral number (an int, or a float with an integral value), false if it is not one or out of int64
static bool IntegralValue(PyObject* O, long long& Out, bool& Big)
{
    Big = false;
    if (IsInt(O))
    {
        int Overflow = 0;
        Out = PyLong_AsLongLongAndOverflow(O, &Overflow);
        if (PyErr_Occurred())
        {
            PyErr_Clear();
            return false;
        }
        Big = Overflow != 0;
        return true;
    }
    if (O && PyFloat_Check(O))
    {
        double D = PyFloat_AS_DOUBLE(O);
        if (!std::isfinite(D) || D != std::trunc(D))
        {
            return false;
        }
        if (D >= 9223372036854775807.0 || D <= -9223372036854775808.0)
        {
            Big = true;
            return true;
        }
        Out = static_cast<long long>(D);
        return true;
    }
    return false;
}

static int pesapi_is_int32(pesapi_env env, pesapi_value pvalue)
{
    long long V = 0;
    bool Big = false;
    return IntegralValue(Raw(pvalue), V, Big) && !Big && V >= INT32_MIN && V <= INT32_MAX;
}

static int pesapi_is_uint32(pesapi_env env, pesapi_value pvalue)
{
    long long V = 0;
    bool Big = false;
    return IntegralValue(Raw(pvalue), V, Big) && !Big && V >= 0 && V <= UINT32_MAX;
}

static int pesapi_is_int64(pesapi_env env, pesapi_value pvalue)
{
    long long V = 0;
    bool Big = false;
    return IntegralValue(Raw(pvalue), V, Big);
}

static int pesapi_is_uint64(pesapi_env env, pesapi_value pvalue)
{
    long long V = 0;
    bool Big = false;
    return IntegralValue(Raw(pvalue), V, Big);
}

static int pesapi_is_double(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    return O && (PyFloat_Check(O) || IsInt(O));
}

static int pesapi_is_string(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    return O && PyUnicode_Check(O);
}

static int pesapi_is_object(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    return !IsNone(O) && !PyBool_Check(O) && !PyLong_Check(O) && !PyFloat_Check(O) && !PyUnicode_Check(O);
}

static int pesapi_is_function(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    return !IsNone(O) && PyCallable_Check(O);
}

static int pesapi_is_binary(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    return O && (PyByteArray_Check(O) || PyBytes_Check(O) || PyMemoryView_Check(O));
}

static int pesapi_is_array(pesapi_env env, pesapi_value pvalue)
{
    PyObject* O = Raw(pvalue);
    return O && (PyList_Check(O) || PyTuple_Check(O));
}

static pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)
{
    auto Mapper = MapperOf(env);
    return Keep(Mapper, Mapper->PushCppObject(type_id, object_ptr, !call_finalize));
}

static void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue)
{
    auto CppObj = MapperOf(env)->GetCppObject(Raw(pvalue));
    return CppObj ? CppObj->Ptr : nullptr;
}

static const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value pvalue)
{
    auto CppObj = MapperOf(env)->GetCppObject(Raw(pvalue));
    return CppObj ? CppObj->TypeId : nullptr;
}

static int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value pvalue)
{
    return MapperOf(env)->IsInstanceOf(type_id, Raw(pvalue));
}

// a boxed value is a list of one element
static pesapi_value pesapi_boxing(pesapi_env env, pesapi_value pvalue)
{
    auto Mapper = MapperOf(env);
    PyObject* List = PyList_New(1);
    if (List)
    {
        PyObject* O = Obj(pvalue);
        Py_INCREF(O);
        PyList_SET_ITEM(List, 0, O);
    }
    return Keep(Mapper, List);
}

static pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value p_boxed_value)
{
    PyObject* O = Raw(p_boxed_value);
    if (!O || !PyList_Check(O) || PyList_GET_SIZE(O) < 1)
    {
        return nullptr;
    }
    return KeepBorrowed(MapperOf(env), PyList_GET_ITEM(O, 0));
}

static void pesapi_update_boxed_value(pesapi_env env, pesapi_value p_boxed_value, pesapi_value pvalue)
{
    PyObject* O = Raw(p_boxed_value);
    if (!O || !PyList_Check(O))
    {
        return;
    }
    PyObject* V = Obj(pvalue);
    if (PyList_GET_SIZE(O) > 0)
    {
        Py_INCREF(V);
        PyList_SetItem(O, 0, V);
    }
    else if (PyList_Append(O, V) < 0)
    {
        PyErr_Clear();
    }
}

static int pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    PyObject* O = Raw(value);
    return O && PyList_Check(O);
}

static int pesapi_get_args_len(pesapi_callback_info pinfo)
{
    return InfoOf(pinfo)->Argc;
}

static pesapi_value pesapi_get_arg(pesapi_callback_info pinfo, int index)
{
    auto Info = InfoOf(pinfo);
    if (index >= 0 && index < Info->Argc)
    {
        return reinterpret_cast<pesapi_value>(Info->Args[index]);
    }
    return nullptr;
}

static pesapi_env pesapi_get_env(pesapi_callback_info pinfo)
{
    return reinterpret_cast<pesapi_env>(InfoOf(pinfo)->Mapper);
}

static void* pesapi_get_native_holder_ptr(pesapi_callback_info pinfo)
{
    auto Info = InfoOf(pinfo);
    auto CppObj = Info->Mapper->GetCppObject(Info->This);
    return CppObj ? CppObj->Ptr : nullptr;
}

static const void* pesapi_get_native_holder_typeid(pesapi_callback_info pinfo)
{
    auto Info = InfoOf(pinfo);
    auto CppObj = Info->Mapper->GetCppObject(Info->This);
    return CppObj ? CppObj->TypeId : nullptr;
}

static void* pesapi_get_userdata(pesapi_callback_info pinfo)
{
    return InfoOf(pinfo)->Data;
}

static void pesapi_add_return(pesapi_callback_info pinfo, pesapi_value value)
{
    auto Info = InfoOf(pinfo);
    PyObject* V = Obj(value);
    Py_INCREF(V);
    PyObject* Old = reinterpret_cast<PyObject*>(Info->Ret);
    Info->Ret = reinterpret_cast<pesapi_value>(V);
    Py_XDECREF(Old);
}

static void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg)
{
    auto Info = InfoOf(pinfo);
    Info->HasEx = true;
    Info->ExMsg = msg ? msg : "";
}

static pesapi_env_ref pesapi_create_env_ref(pesapi_env env)
{
    return reinterpret_cast<pesapi_env_ref>(new pesapi_env_ref__(MapperOf(env)));
}

static int pesapi_env_ref_is_valid(pesapi_env_ref penv_ref)
{
    auto EnvRef = EnvRefOf(penv_ref);
    return EnvRef && !EnvRef->Tracker.expired();
}

static pesapi_env pesapi_get_env_from_ref(pesapi_env_ref penv_ref)
{
    auto EnvRef = EnvRefOf(penv_ref);
    if (!EnvRef || EnvRef->Tracker.expired())
    {
        return nullptr;
    }
    return reinterpret_cast<pesapi_env>(EnvRef->Mapper);
}

static pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref penv_ref)
{
    ++EnvRefOf(penv_ref)->RefCount;
    return penv_ref;
}

static void pesapi_release_env_ref(pesapi_env_ref penv_ref)
{
    auto EnvRef = EnvRefOf(penv_ref);
    if (--EnvRef->RefCount == 0)
    {
        delete EnvRef;
    }
}

static pesapi_scope pesapi_open_scope(pesapi_env_ref penv_ref)
{
    auto EnvRef = EnvRefOf(penv_ref);
    if (!EnvRef || EnvRef->Tracker.expired())
    {
        return nullptr;
    }
    void* Mem = malloc(sizeof(pesapi_scope__));
    return reinterpret_cast<pesapi_scope>(new (Mem) pesapi_scope__(EnvRef->Mapper));
}

static pesapi_scope pesapi_open_scope_placement(pesapi_env_ref penv_ref, struct pesapi_scope_memory* memory)
{
    auto EnvRef = EnvRefOf(penv_ref);
    if (!EnvRef || EnvRef->Tracker.expired())
    {
        return nullptr;
    }
    memset(memory, 0, sizeof(struct pesapi_scope_memory));
    return reinterpret_cast<pesapi_scope>(new (memory) pesapi_scope__(EnvRef->Mapper));
}

static int pesapi_has_caught(pesapi_scope pscope)
{
    auto Scope = ScopeOf(pscope);
    if (!Scope)
    {
        return false;
    }
    return Scope->Caught != nullptr && Scope->Caught->Type != nullptr;
}

static const char* pesapi_get_exception_as_string(pesapi_scope pscope, int with_stack)
{
    auto Scope = ScopeOf(pscope);
    if (!Scope)
    {
        return nullptr;
    }
    if (!Scope->Caught || !Scope->Caught->Type)
    {
        return nullptr;
    }
    FCppObjectMapper* Mapper = Scope->Mapper;
    caught_exception_info* Caught = Scope->Caught;
    PyObject* Value = Caught->Value ? Caught->Value : Py_None;
    PyObject* Lines = nullptr;
    if (with_stack && Mapper->FormatException)
    {
        PyObject* Tb = Caught->Traceback ? Caught->Traceback : Py_None;
        Lines = PyObject_CallFunctionObjArgs(Mapper->FormatException, Caught->Type, Value, Tb, nullptr);
    }
    else if (Mapper->FormatExceptionOnly)
    {
        Lines = PyObject_CallFunctionObjArgs(Mapper->FormatExceptionOnly, Caught->Type, Value, nullptr);
    }
    bool Ok = false;
    if (Lines)
    {
        PyObject* Sep = PyUnicode_FromString("");
        PyObject* Joined = Sep ? PyUnicode_Join(Sep, Lines) : nullptr;
        Py_XDECREF(Sep);
        Py_DECREF(Lines);
        if (Joined)
        {
            Ok = ToUtf8(Joined, Caught->Message);
            Py_DECREF(Joined);
        }
    }
    if (PyErr_Occurred())
    {
        PyErr_Clear();
    }
    if (!Ok && !ToUtf8(Value, Caught->Message))
    {
        Caught->Message = "(unknown error)";
    }
    while (!Caught->Message.empty() && (Caught->Message.back() == '\n' || Caught->Message.back() == '\r'))
    {
        Caught->Message.pop_back();
    }
    return Caught->Message.c_str();
}

static void pesapi_close_scope(pesapi_scope pscope)
{
    auto Scope = ScopeOf(pscope);
    if (!Scope)
    {
        return;
    }
    Scope->~pesapi_scope__();
    free(Scope);
}

static void pesapi_close_scope_placement(pesapi_scope pscope)
{
    auto Scope = ScopeOf(pscope);
    if (!Scope)
    {
        return;
    }
    Scope->~pesapi_scope__();
}

static pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value pvalue, uint32_t internal_field_count)
{
    auto Mapper = MapperOf(env);
    PyObject* O = Obj(pvalue);
    Py_INCREF(O);
    size_t TotalSize = ValueRefSize(internal_field_count);
    void* Mem = malloc(TotalSize);
    memset(Mem, 0, TotalSize);
    auto Ret = new (Mem) pesapi_value_ref__(Mapper, O, internal_field_count);
    return reinterpret_cast<pesapi_value_ref>(Ret);
}

static pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref pvalue_ref)
{
    ++ValueRefOf(pvalue_ref)->RefCount;
    return pvalue_ref;
}

static void pesapi_release_value_ref(pesapi_value_ref pvalue_ref)
{
    auto ValueRef = ValueRefOf(pvalue_ref);
    if (--ValueRef->RefCount == 0)
    {
        if (!ValueRef->Tracker.expired() && ValueRef->Mapper)
        {
            FPyEnvGuard Guard(ValueRef->Mapper->TState);
            Py_XDECREF(ValueRef->Obj);
        }
        // the env is gone: only the memory is released
        ValueRef->Obj = nullptr;
        ValueRef->~pesapi_value_ref__();
        free(ValueRef);
    }
}

static pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto ValueRef = ValueRefOf(pvalue_ref);
    PyObject* O = ValueRef->Obj;
    if (ValueRef->Weak)
    {
        O = PyWeakref_GetObject(O);
        if (IsNone(O))
        {
            if (PyErr_Occurred())
            {
                PyErr_Clear();
            }
            return nullptr;
        }
    }
    return KeepBorrowed(MapperOf(env), O);
}

static void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref pvalue_ref)
{
    auto ValueRef = ValueRefOf(pvalue_ref);
    if (ValueRef->Weak || IsNone(ValueRef->Obj))
    {
        return;
    }
    PyObject* Weak = PyWeakref_NewRef(ValueRef->Obj, nullptr);
    if (!Weak)
    {
        // a value which can not be referenced weakly is kept strongly
        PyErr_Clear();
        return;
    }
    Py_DECREF(ValueRef->Obj);
    ValueRef->Obj = Weak;
    ValueRef->Weak = true;
}

static const char* const OwnerKey = "_p_i_only_one_child";

static int pesapi_set_owner(pesapi_env env, pesapi_value pvalue, pesapi_value powner)
{
    auto Mapper = MapperOf(env);
    PyObject* Owner = Raw(powner);
    if (IsNone(Owner))
    {
        return false;
    }
    PyObject* V = Obj(pvalue);
    if (FPyCppObject* CppObj = Mapper->GetCppObject(Owner))
    {
        Py_INCREF(V);
        PyObject* Old = CppObj->Owner;
        CppObj->Owner = V;
        Py_XDECREF(Old);
        return true;
    }
    int Ret = PyDict_Check(Owner) ? PyDict_SetItemString(Owner, OwnerKey, V) : PyObject_SetAttrString(Owner, OwnerKey, V);
    if (Ret < 0)
    {
        PyErr_Clear();
        return false;
    }
    return true;
}

static pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref)
{
    return reinterpret_cast<pesapi_env_ref>(static_cast<pesapi_env_ref__*>(ValueRefOf(value_ref)));
}

static void** pesapi_get_ref_internal_fields(pesapi_value_ref pvalue_ref, uint32_t* pinternal_field_count)
{
    auto ValueRef = ValueRefOf(pvalue_ref);
    *pinternal_field_count = ValueRef->InternalFieldCount;
    return &ValueRef->InternalFields[0];
}

// a missing attribute reads None, another error is caught by the scope
static pesapi_value pesapi_get_property(pesapi_env env, pesapi_value pobject, const char* key)
{
    auto Mapper = MapperOf(env);
    PyObject* O = Raw(pobject);
    if (IsNone(O) || !key)
    {
        return nullptr;
    }
    if (PyDict_Check(O))
    {
        PyObject* Key = PyUnicode_FromString(key);
        if (!Key)
        {
            Mapper->CatchError();
            return nullptr;
        }
        PyObject* R = PyDict_GetItemWithError(O, Key);
        Py_DECREF(Key);
        if (!R)
        {
            if (PyErr_Occurred())
            {
                Mapper->CatchError();
            }
            return nullptr;
        }
        return KeepBorrowed(Mapper, R);
    }
    PyObject* R = PyObject_GetAttrString(O, key);
    if (!R)
    {
        if (PyErr_ExceptionMatches(PyExc_AttributeError))
        {
            PyErr_Clear();
        }
        else
        {
            Mapper->CatchError();
        }
        return nullptr;
    }
    return Mapper->Track(R);
}

static int pesapi_set_property(pesapi_env env, pesapi_value pobject, const char* key, pesapi_value pvalue)
{
    auto Mapper = MapperOf(env);
    PyObject* O = Raw(pobject);
    if (IsNone(O) || !key)
    {
        return 0;
    }
    int Ret = PyDict_Check(O) ? PyDict_SetItemString(O, key, Obj(pvalue)) : PyObject_SetAttrString(O, key, Obj(pvalue));
    if (Ret < 0)
    {
        Mapper->CatchError();
        return 0;
    }
    return 1;
}

static const char* const PrivateKey = "__puerts_private__";

static int pesapi_get_private(pesapi_env env, pesapi_value pobject, void** out_ptr)
{
    *out_ptr = nullptr;
    PyObject* O = Raw(pobject);
    if (!pesapi_is_object(env, pobject))
    {
        return false;
    }
    PyObject* P = PyDict_Check(O) ? PyDict_GetItemString(O, PrivateKey) : PyObject_GetAttrString(O, PrivateKey);
    if (!P)
    {
        // not set
        PyErr_Clear();
        return true;
    }
    if (PyDict_Check(O))
    {
        Py_INCREF(P);
    }
    *out_ptr = PyLong_AsVoidPtr(P);
    if (PyErr_Occurred())
    {
        PyErr_Clear();
        *out_ptr = nullptr;
    }
    Py_DECREF(P);
    return true;
}

static int pesapi_set_private(pesapi_env env, pesapi_value pobject, void* ptr)
{
    PyObject* O = Raw(pobject);
    if (!pesapi_is_object(env, pobject))
    {
        return false;
    }
    PyObject* P = PyLong_FromVoidPtr(ptr);
    if (!P)
    {
        PyErr_Clear();
        return false;
    }
    int Ret = PyDict_Check(O) ? PyDict_SetItemString(O, PrivateKey, P) : PyObject_SetAttrString(O, PrivateKey, P);
    Py_DECREF(P);
    if (Ret < 0)
    {
        PyErr_Clear();
        return false;
    }
    return true;
}

// the index is 0 based (the same as js)
static pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key)
{
    auto Mapper = MapperOf(env);
    PyObject* O = Raw(pobject);
    if (IsNone(O))
    {
        return nullptr;
    }
    if (PyList_Check(O))
    {
        return static_cast<Py_ssize_t>(key) < PyList_GET_SIZE(O) ? KeepBorrowed(Mapper, PyList_GET_ITEM(O, key)) : nullptr;
    }
    if (PyTuple_Check(O))
    {
        return static_cast<Py_ssize_t>(key) < PyTuple_GET_SIZE(O) ? KeepBorrowed(Mapper, PyTuple_GET_ITEM(O, key)) : nullptr;
    }
    PyObject* Key = PyLong_FromUnsignedLong(key);
    if (!Key)
    {
        Mapper->CatchError();
        return nullptr;
    }
    if (PyDict_Check(O))
    {
        PyObject* R = PyDict_GetItemWithError(O, Key);
        Py_DECREF(Key);
        if (!R)
        {
            if (PyErr_Occurred())
            {
                Mapper->CatchError();
            }
            return nullptr;
        }
        return KeepBorrowed(Mapper, R);
    }
    PyObject* R = PyObject_GetItem(O, Key);
    Py_DECREF(Key);
    if (!R)
    {
        if (PyErr_ExceptionMatches(PyExc_IndexError) || PyErr_ExceptionMatches(PyExc_KeyError) ||
            PyErr_ExceptionMatches(PyExc_TypeError))
        {
            PyErr_Clear();
        }
        else
        {
            Mapper->CatchError();
        }
        return nullptr;
    }
    return Mapper->Track(R);
}

static int pesapi_set_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key, pesapi_value pvalue)
{
    auto Mapper = MapperOf(env);
    PyObject* O = Raw(pobject);
    PyObject* V = Obj(pvalue);
    if (IsNone(O))
    {
        return 0;
    }
    if (PyList_Check(O))
    {
        const Py_ssize_t Index = static_cast<Py_ssize_t>(key);
        if (Index < PyList_GET_SIZE(O))
        {
            Py_INCREF(V);
            return PyList_SetItem(O, Index, V) == 0;
        }
        // the holes are None
        while (PyList_GET_SIZE(O) < Index)
        {
            if (PyList_Append(O, Py_None) < 0)
            {
                Mapper->CatchError();
                return 0;
            }
        }
        if (PyList_Append(O, V) < 0)
        {
            Mapper->CatchError();
            return 0;
        }
        return 1;
    }
    PyObject* Key = PyLong_FromUnsignedLong(key);
    if (!Key)
    {
        Mapper->CatchError();
        return 0;
    }
    int Ret = PyDict_Check(O) ? PyDict_SetItem(O, Key, V) : PyObject_SetItem(O, Key, V);
    Py_DECREF(Key);
    if (Ret < 0)
    {
        Mapper->CatchError();
        return 0;
    }
    return 1;
}

// this_object is ignored: a python function has no this (a method is bound to its object)
static pesapi_value pesapi_call_function(
    pesapi_env env, pesapi_value pfunc, pesapi_value this_object, int argc, const pesapi_value argv[])
{
    auto Mapper = MapperOf(env);
    PyObject* Func = Raw(pfunc);
    if (IsNone(Func))
    {
        PyErr_SetString(PyExc_TypeError, "None is not callable");
        Mapper->CatchError();
        return nullptr;
    }
    PyObject* Small[16];
    std::vector<PyObject*> Big;
    PyObject** Args = Small;
    if (argc > 16)
    {
        Big.resize(static_cast<size_t>(argc));
        Args = Big.data();
    }
    for (int i = 0; i < argc; ++i)
    {
        Args[i] = Obj(argv[i]);
    }
    PyObject* R = PyObject_Vectorcall(Func, Args, static_cast<size_t>(argc > 0 ? argc : 0), nullptr);
    if (!R)
    {
        Mapper->CatchError();
        return nullptr;
    }
    return Mapper->Track(R);
}

// runs the code (a python file) in the dict of __main__
static pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    auto Mapper = MapperOf(env);
    std::string Source(reinterpret_cast<const char*>(code), code ? code_size : 0);
    PyObject* Code = Py_CompileStringExFlags(Source.c_str(), path ? path : "<eval>", Py_file_input, nullptr, -1);
    if (!Code)
    {
        Mapper->CatchError();
        return nullptr;
    }
    PyObject* R = PyEval_EvalCode(Code, Mapper->MainDict, Mapper->MainDict);
    Py_DECREF(Code);
    if (!R)
    {
        Mapper->CatchError();
        return nullptr;
    }
    return Mapper->Track(R);
}

// the dict of builtins: the names set are visible to all the modules
static pesapi_value pesapi_global(pesapi_env env)
{
    return reinterpret_cast<pesapi_value>(MapperOf(env)->Builtins);
}

static const void* pesapi_get_env_private(pesapi_env env)
{
    auto Mapper = MapperOf(env);
    return Mapper ? Mapper->GetEnvPrivate() : nullptr;
}

static void pesapi_set_env_private(pesapi_env env, const void* ptr)
{
    auto Mapper = MapperOf(env);
    if (Mapper)
    {
        Mapper->SetEnvPrivate(ptr);
    }
}

static void pesapi_set_registry(pesapi_env env, pesapi_registry registry)
{
    MapperOf(env)->SetRegistry(reinterpret_cast<ScriptClassRegistry*>(registry));
}

static pesapi_value pesapi_get_this(pesapi_callback_info pinfo)
{
    return reinterpret_cast<pesapi_value>(InfoOf(pinfo)->This);
}

static int pesapi_unbind_native_object(pesapi_env env, const void* type_id, void* ptr)
{
    auto Mapper = MapperOf(env);
    return Mapper ? Mapper->UnbindNativeObject(type_id, ptr) : false;
}

pesapi_ffi g_pesapi_ffi{
    &pesapi_create_null,
    &pesapi_create_undefined,
    &pesapi_create_boolean,
    &pesapi_create_int32,
    &pesapi_create_uint32,
    &pesapi_create_int64,
    &pesapi_create_uint64,
    &pesapi_create_double,
    &pesapi_create_string_utf8,
    &pesapi_create_string_utf16,
    &pesapi_create_binary,
    &pesapi_create_binary_by_value,
    &pesapi_create_array,
    &pesapi_create_object,
    &pesapi_create_function,
    &pesapi_create_class,
    &pesapi_get_value_bool,
    &pesapi_get_value_int32,
    &pesapi_get_value_uint32,
    &pesapi_get_value_int64,
    &pesapi_get_value_uint64,
    &pesapi_get_value_double,
    &pesapi_get_value_string_utf8,
    &pesapi_get_value_string_utf16,
    &pesapi_get_value_binary,
    &pesapi_get_array_length,
    &pesapi_is_null,
    &pesapi_is_undefined,
    &pesapi_is_boolean,
    &pesapi_is_int32,
    &pesapi_is_uint32,
    &pesapi_is_int64,
    &pesapi_is_uint64,
    &pesapi_is_double,
    &pesapi_is_string,
    &pesapi_is_object,
    &pesapi_is_function,
    &pesapi_is_binary,
    &pesapi_is_array,
    &pesapi_native_object_to_value,
    &pesapi_get_native_object_ptr,
    &pesapi_get_native_object_typeid,
    &pesapi_is_instance_of,
    &pesapi_boxing,
    &pesapi_unboxing,
    &pesapi_update_boxed_value,
    &pesapi_is_boxed_value,
    &pesapi_get_args_len,
    &pesapi_get_arg,
    &pesapi_get_env,
    &pesapi_get_native_holder_ptr,
    &pesapi_get_native_holder_typeid,
    &pesapi_get_userdata,
    &pesapi_add_return,
    &pesapi_throw_by_string,
    &pesapi_create_env_ref,
    &pesapi_env_ref_is_valid,
    &pesapi_get_env_from_ref,
    &pesapi_duplicate_env_ref,
    &pesapi_release_env_ref,
    &pesapi_open_scope,
    &pesapi_open_scope_placement,
    &pesapi_has_caught,
    &pesapi_get_exception_as_string,
    &pesapi_close_scope,
    &pesapi_close_scope_placement,
    &pesapi_create_value_ref,
    &pesapi_duplicate_value_ref,
    &pesapi_release_value_ref,
    &pesapi_get_value_from_ref,
    &pesapi_set_ref_weak,
    &pesapi_set_owner,
    &pesapi_get_ref_associated_env,
    &pesapi_get_ref_internal_fields,
    &pesapi_get_property,
    &pesapi_set_property,
    &pesapi_get_private,
    &pesapi_set_private,
    &pesapi_get_property_uint32,
    &pesapi_set_property_uint32,
    &pesapi_call_function,
    &pesapi_eval,
    &pesapi_global,
    &pesapi_get_env_private,
    &pesapi_set_env_private,
    &pesapi_set_registry,
    &pesapi_get_this,
    &pesapi_unbind_native_object,
};

}    // namespace pyimpl
}    // namespace PUERTS_NAMESPACE

#else    // PUERTS_PAPI_PYTHON

namespace PUERTS_NAMESPACE
{
namespace pyimpl
{
pesapi_ffi g_pesapi_ffi{};
}    // namespace pyimpl
}    // namespace PUERTS_NAMESPACE

#endif    // PUERTS_PAPI_PYTHON
