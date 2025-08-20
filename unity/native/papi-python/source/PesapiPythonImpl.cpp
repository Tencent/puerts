#include <Python.h>
#include "pesapi.h"
#include "CppObjectMapperPython.h"

namespace pesapi {
namespace pythonimpl {

// Recommended: custom env storing interpreter state and cached objects
struct PythonEnv {
    PyThreadState* tstate = nullptr;
    PyObject* main_mod = nullptr;       // strong
    PyObject* globals_dict = nullptr;   // strong
    PyObject* import_module = nullptr;  // optional strong
    PyObject* traceback_fmt = nullptr;  // optional strong
};

static inline PythonEnv* EnvFrom(pesapi_env e) { return reinterpret_cast<PythonEnv*>(e); }
static inline pesapi_env ToEnv(PythonEnv* e) { return reinterpret_cast<pesapi_env>(e); }

static inline PyObject* MainModule(pesapi_env env) {
    auto* penv = EnvFrom(env);
    return penv ? penv->main_mod : nullptr;
}

// Optionally create env for host embedding
static PythonEnv* CreatePythonEnvInternal() {
    if (!Py_IsInitialized()) Py_Initialize();
    PyGILState_STATE g = PyGILState_Ensure();
    PyThreadState* sub = Py_NewInterpreter();
    PyThreadState_Swap(sub);

    auto* env = new PythonEnv();
    env->tstate = sub;

    PyObject* main_mod = PyImport_AddModule("__main__"); // borrowed
    Py_XINCREF(main_mod);
    env->main_mod = main_mod;
    env->globals_dict = PyModule_GetDict(main_mod); // borrowed
    Py_XINCREF(env->globals_dict);

    PyObject* importlib = PyImport_ImportModule("importlib");
    if (importlib) {
        env->import_module = PyObject_GetAttrString(importlib, "import_module");
        Py_DECREF(importlib);
    }
    PyObject* traceback = PyImport_ImportModule("traceback");
    if (traceback) {
        env->traceback_fmt = PyObject_GetAttrString(traceback, "format_exception");
        Py_DECREF(traceback);
    }

    PyGILState_Release(g);
    return env;
}

static void DestroyPythonEnvInternal(PythonEnv* env) {
    if (!env) return;
    PyGILState_STATE g = PyGILState_Ensure();
    PyThreadState_Swap(env->tstate);
    Py_XDECREF(env->traceback_fmt);
    Py_XDECREF(env->import_module);
    Py_XDECREF(env->globals_dict);
    Py_XDECREF(env->main_mod);
    Py_EndInterpreter(env->tstate);
    PyGILState_Release(g);
    delete env;
}

inline pesapi_value pesapiValueFromPyObject(PyObject* v) { return reinterpret_cast<pesapi_value>(v); }
inline PyObject* pyObjectFromPesapiValue(pesapi_value v) { return reinterpret_cast<PyObject*>(v); }

// value process
pesapi_value pesapi_create_null(pesapi_env env) {
    return pesapiValueFromPyObject(&_Py_NoneStruct);
}

pesapi_value pesapi_create_undefined(pesapi_env env) { return pesapi_create_null(env); }

pesapi_value pesapi_create_boolean(pesapi_env env, int value) {
    if (value) return pesapiValueFromPyObject((PyObject*)(&_Py_TrueStruct));
    return pesapiValueFromPyObject((PyObject*)(&_Py_FalseStruct));
}

pesapi_value pesapi_create_int32(pesapi_env env, int32_t value) { return pesapiValueFromPyObject(PyLong_FromLong(value)); }

pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value) { return pesapiValueFromPyObject(PyLong_FromUnsignedLong(value)); }

pesapi_value pesapi_create_int64(pesapi_env env, int64_t value) { return pesapiValueFromPyObject(PyLong_FromLongLong(value)); }

pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value) { return pesapiValueFromPyObject(PyLong_FromUnsignedLongLong(value)); }

pesapi_value pesapi_create_double(pesapi_env env, double value) { return pesapiValueFromPyObject(PyFloat_FromDouble(value)); }

pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length) {
    return pesapiValueFromPyObject(PyUnicode_FromStringAndSize(str, (Py_ssize_t)length));
}

pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t* str, size_t length) {
    return pesapiValueFromPyObject(PyUnicode_FromKindAndData(PyUnicode_2BYTE_KIND, str, (Py_ssize_t)length));
}

pesapi_value pesapi_create_binary(pesapi_env env, void* bin, size_t length) {
    auto mapper = CppObjectMapper::Get(MainModule(env));
    return pesapiValueFromPyObject(mapper->CreateBufferByPointer(MainModule(env), (unsigned char*)bin, length));
}

pesapi_value pesapi_create_binary_by_value(pesapi_env env, void* bin, size_t length) {
    auto mapper = CppObjectMapper::Get(MainModule(env));
    return pesapiValueFromPyObject(mapper->CreateBufferCopy(MainModule(env), (const unsigned char*)bin, length));
}

pesapi_value pesapi_create_array(pesapi_env env) { return pesapiValueFromPyObject(PyList_New(0)); }

pesapi_value pesapi_create_object(pesapi_env env) { return pesapiValueFromPyObject(PyDict_New()); }

pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize) {
    auto mapper = CppObjectMapper::Get(MainModule(env));
    return pesapiValueFromPyObject(mapper->CreateFunction(MainModule(env), native_impl, data, finalize));
}

pesapi_value pesapi_create_class(pesapi_env env, const void* type_id) {
    auto mapper = CppObjectMapper::Get(MainModule(env));
    return pesapiValueFromPyObject(mapper->LoadTypeById(MainModule(env), type_id));
}

int pesapi_get_value_bool(pesapi_env env, pesapi_value pvalue) { return PyObject_IsTrue(pyObjectFromPesapiValue(pvalue)); }
int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value pvalue) { return (int32_t)PyLong_AsLong(pyObjectFromPesapiValue(pvalue)); }
uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value pvalue) { return (uint32_t)PyLong_AsUnsignedLong(pyObjectFromPesapiValue(pvalue)); }
int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value pvalue) { return PyLong_AsLongLong(pyObjectFromPesapiValue(pvalue)); }
uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value pvalue) { return PyLong_AsUnsignedLongLong(pyObjectFromPesapiValue(pvalue)); }

double pesapi_get_value_double(pesapi_env env, pesapi_value pvalue) { return PyFloat_AsDouble(pyObjectFromPesapiValue(pvalue)); }

const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value pvalue, char* buf, size_t* bufsize) {
    PyObject* obj = pyObjectFromPesapiValue(pvalue);
    if (PyUnicode_Check(obj)) {
        Py_ssize_t sz; const char* data = PyUnicode_AsUTF8AndSize(obj, &sz);
        if (!data) return nullptr;
        if (buf && bufsize && *bufsize >= (size_t)sz) { memcpy(buf, data, (size_t)sz); *bufsize = (size_t)sz; return buf; }
        if (bufsize) *bufsize = (size_t)sz; return data;
    }
    return nullptr;
}

const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value pvalue, uint16_t* buf, size_t* bufsize) {
    PyObject* obj = pyObjectFromPesapiValue(pvalue);
    if (!PyUnicode_Check(obj)) return nullptr;
    Py_ssize_t len = PyUnicode_GetLength(obj);
    if (buf && bufsize && *bufsize >= (size_t)len) {
        PyUnicode_WriteChar(obj, 0, 0); // no-op ensure object
        Py_ssize_t copied = PyUnicode_AsWideChar(obj, (wchar_t*)buf, (Py_ssize_t)*bufsize);
        if (copied >= 0) { if (bufsize) *bufsize = (size_t)copied; return buf; }
        return nullptr;
    }
    if (bufsize) *bufsize = (size_t)len; return nullptr;
}

void* pesapi_get_value_binary(pesapi_env env, pesapi_value pvalue, size_t* bufsize) {
    auto mapper = CppObjectMapper::Get(MainModule(env));
    return mapper->GetBufferData(pyObjectFromPesapiValue(pvalue), bufsize);
}

uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value pvalue) {
    PyObject* obj = pyObjectFromPesapiValue(pvalue);
    if (PyList_Check(obj)) return (uint32_t)PyList_Size(obj);
    return 0;
}

int pesapi_is_null(pesapi_env env, pesapi_value pvalue) { return pyObjectFromPesapiValue(pvalue) == Py_None; }
int pesapi_is_undefined(pesapi_env env, pesapi_value pvalue) { return pyObjectFromPesapiValue(pvalue) == Py_None; }
int pesapi_is_boolean(pesapi_env env, pesapi_value pvalue) { return PyBool_Check(pyObjectFromPesapiValue(pvalue)); }
int pesapi_is_int32(pesapi_env env, pesapi_value pvalue) { return PyLong_Check(pyObjectFromPesapiValue(pvalue)); }
int pesapi_is_uint32(pesapi_env env, pesapi_value pvalue) { return PyLong_Check(pyObjectFromPesapiValue(pvalue)); }
int pesapi_is_int64(pesapi_env env, pesapi_value pvalue) { return PyLong_Check(pyObjectFromPesapiValue(pvalue)); }
int pesapi_is_uint64(pesapi_env env, pesapi_value pvalue) { return PyLong_Check(pyObjectFromPesapiValue(pvalue)); }
int pesapi_is_double(pesapi_env env, pesapi_value pvalue) { return PyFloat_Check(pyObjectFromPesapiValue(pvalue)); }
int pesapi_is_string(pesapi_env env, pesapi_value pvalue) { return PyUnicode_Check(pyObjectFromPesapiValue(pvalue)); }
int pesapi_is_object(pesapi_env env, pesapi_value pvalue) {
    PyObject* o = pyObjectFromPesapiValue(pvalue);
    return PyDict_Check(o) || PyCallable_Check(o) || PyCapsule_CheckExact(o);
}
int pesapi_is_function(pesapi_env env, pesapi_value pvalue) { return PyCallable_Check(pyObjectFromPesapiValue(pvalue)); }
int pesapi_is_binary(pesapi_env env, pesapi_value pvalue) { return CppObjectMapper::Get(MainModule(env))->IsBuffer(pyObjectFromPesapiValue(pvalue)); }
int pesapi_is_array(pesapi_env env, pesapi_value pvalue) { return PyList_Check(pyObjectFromPesapiValue(pvalue)); }

pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize) {
    auto mapper = CppObjectMapper::Get(MainModule(env));
    return pesapiValueFromPyObject(mapper->FindOrAddCppObject(MainModule(env), type_id, object_ptr, !call_finalize));
}

void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value pvalue) {
    auto mapper = CppObjectMapper::Get(MainModule(env));
    auto* cppObject = mapper->GetCppObject(pyObjectFromPesapiValue(pvalue));
    return cppObject ? cppObject->Ptr : nullptr;
}

const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value pvalue) {
    auto mapper = CppObjectMapper::Get(MainModule(env));
    auto* cppObject = mapper->GetCppObject(pyObjectFromPesapiValue(pvalue));
    return cppObject ? cppObject->TypeId : nullptr;
}

int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value pvalue) {
    auto mapper = CppObjectMapper::Get(MainModule(env));
    auto* cppObject = mapper->GetCppObject(pyObjectFromPesapiValue(pvalue));
    return cppObject && (cppObject->TypeId == type_id);
}

pesapi_value pesapi_boxing(pesapi_env env, pesapi_value pvalue) {
    PyObject* list = PyList_New(1);
    PyObject* obj = pyObjectFromPesapiValue(pvalue);
    Py_INCREF(obj);
    PyList_SetItem(list, 0, obj);
    return pesapiValueFromPyObject(list);
}

pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value p_boxed_value) {
    PyObject* list = pyObjectFromPesapiValue(p_boxed_value);
    if (PyList_Check(list) && PyList_Size(list) > 0) {
        PyObject* item = PyList_GetItem(list, 0);
        Py_INCREF(item);
        return pesapiValueFromPyObject(item);
    }
    return 0;
}

void pesapi_update_boxed_value(pesapi_env env, pesapi_value p_boxed_value, pesapi_value pvalue) {
    PyObject* list = pyObjectFromPesapiValue(p_boxed_value);
    if (PyList_Check(list)) {
        PyObject* obj = pyObjectFromPesapiValue(pvalue);
        Py_INCREF(obj);
        PyList_SetItem(list, 0, obj);
    }
}

int pesapi_is_boxed_value(pesapi_env env, pesapi_value value) { return PyList_Check(pyObjectFromPesapiValue(value)); }

int pesapi_get_args_len(pesapi_callback_info pinfo) {
    auto info = reinterpret_cast<pesapi::pythonimpl::pesapi_callback_info__*>(pinfo);
    return (info->args && PyTuple_Check(info->args)) ? (int)PyTuple_Size(info->args) : 0;
}

pesapi_value pesapi_get_arg(pesapi_callback_info pinfo, int index) {
    auto info = reinterpret_cast<pesapi::pythonimpl::pesapi_callback_info__*>(pinfo);
    if (info->args && PyTuple_Check(info->args) && index < PyTuple_Size(info->args)) {
        PyObject* item = PyTuple_GetItem(info->args, index);
        Py_INCREF(item);
        return pesapiValueFromPyObject(item);
    }
    return 0;
}

pesapi_env pesapi_get_env(pesapi_callback_info pinfo) {
    // No direct env captured; return nullptr. Host can set via Data if needed.
    return nullptr;
}

void* pesapi_get_native_holder_ptr(pesapi_callback_info pinfo) { return nullptr; }
const void* pesapi_get_native_holder_typeid(pesapi_callback_info pinfo) { return nullptr; }

void* pesapi_get_userdata(pesapi_callback_info pinfo) {
    auto info = reinterpret_cast<pesapi::pythonimpl::pesapi_callback_info__*>(pinfo);
    return info->Data;
}

void pesapi_add_return(pesapi_callback_info pinfo, pesapi_value value) {
    auto info = reinterpret_cast<pesapi::pythonimpl::pesapi_callback_info__*>(pinfo);
    info->ret = pyObjectFromPesapiValue(value);
}

void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg) { PyErr_SetString(PyExc_RuntimeError, msg); }

struct pesapi_env_ref__ {
    explicit pesapi_env_ref__(PythonEnv* _env)
        : env(_env)
        , ref_count(1) {}
    PythonEnv* env;
    int ref_count;
};

struct pesapi_scope__ {
    explicit pesapi_scope__() : gil(PyGILState_Ensure()) {}
    ~pesapi_scope__() { PyGILState_Release(gil); }
    PyGILState_STATE gil;
};

pesapi_env_ref pesapi_create_env_ref(pesapi_env env) {
    auto ret = (pesapi_env_ref)malloc(sizeof(pesapi_env_ref__));
    memset(ret, 0, sizeof(pesapi_env_ref__));
    new (ret) pesapi::pythonimpl::pesapi_env_ref__(EnvFrom(env));
    return ret;
}

int pesapi_env_ref_is_valid(pesapi_env_ref penv_ref) { return penv_ref != nullptr && pesapi_get_env_from_ref(penv_ref) != nullptr; }

pesapi_env pesapi_get_env_from_ref(pesapi_env_ref penv_ref) {
    if (!penv_ref) return nullptr;
    auto envref = reinterpret_cast<pesapi_env_ref__*>(penv_ref);
    return ToEnv(envref->env);
}

pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref penv_ref) { auto r = reinterpret_cast<pesapi_env_ref__*>(penv_ref); ++r->ref_count; return penv_ref; }

void pesapi_release_env_ref(pesapi_env_ref penv_ref) {
    auto r = reinterpret_cast<pesapi_env_ref__*>(penv_ref);
    if (--r->ref_count == 0) { r->~pesapi_env_ref__(); free(r); }
}

pesapi_scope pesapi_open_scope(pesapi_env_ref penv_ref) {
    pesapi_scope ret = static_cast<pesapi_scope>(malloc(sizeof(pesapi_scope__)));
    memset(ret, 0, sizeof(pesapi_scope__));
    new (ret) pesapi::pythonimpl::pesapi_scope__();
    return ret;
}

pesapi_scope pesapi_open_scope_placement(pesapi_env_ref penv_ref, struct pesapi_scope_memory* memory) {
    memset(memory, 0, sizeof(struct pesapi_scope_memory));
    new (memory) pesapi::pythonimpl::pesapi_scope__();
    return reinterpret_cast<pesapi_scope>(memory);
}

int pesapi_has_caught(pesapi_scope pscope) { return PyErr_Occurred() != nullptr; }

const char* pesapi_get_exception_as_string(pesapi_scope pscope, int with_stack) {
    if (PyErr_Occurred()) {
        PyObject *type, *value, *tb; PyErr_Fetch(&type, &value, &tb);
        PyErr_NormalizeException(&type, &value, &tb);
        PyObject* str = value ? PyObject_Str(value) : nullptr;
        const char* res = str ? PyUnicode_AsUTF8(str) : "Unknown error";
        // Note: returning pointer owned by Python object; in practice, consumer must copy immediately.
        Py_XDECREF(str); Py_XDECREF(type); Py_XDECREF(value); Py_XDECREF(tb);
        return res;
    }
    return "";
}

void pesapi_close_scope(pesapi_scope pscope) { if (!pscope) return; auto s = reinterpret_cast<pesapi_scope__*>(pscope); s->~pesapi_scope__(); free(s); }
void pesapi_close_scope_placement(pesapi_scope pscope) { if (!pscope) return; auto s = reinterpret_cast<pesapi_scope__*>(pscope); s->~pesapi_scope__(); }

struct pesapi_value_ref__ : public pesapi_env_ref__ {
    pesapi_value_ref__(PythonEnv* _env, PyObject* _value_ref, uint32_t _internal_field_count)
        : pesapi_env_ref__(_env), value_ref(_value_ref), internal_field_count(_internal_field_count) {}
    PyObject* value_ref;
    uint32_t internal_field_count;
    void* internal_fields[1];
};

pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value pvalue, uint32_t internal_field_count) {
    PyObject* obj = pyObjectFromPesapiValue(pvalue);
    size_t totalSize = sizeof(pesapi_value_ref__) + (internal_field_count > 0 ? (internal_field_count - 1) : 0) * sizeof(void*);
    auto ret = (pesapi_value_ref)malloc(totalSize);
    memset(ret, 0, totalSize);
    Py_INCREF(obj);
    new (ret) pesapi::pythonimpl::pesapi_value_ref__(EnvFrom(env), obj, internal_field_count);
    return ret;
}

pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref pvalue_ref) { auto r = reinterpret_cast<pesapi_value_ref__*>(pvalue_ref); ++r->ref_count; return pvalue_ref; }

void pesapi_release_value_ref(pesapi_value_ref pvalue_ref) {
    auto r = reinterpret_cast<pesapi_value_ref__*>(pvalue_ref);
    if (--r->ref_count == 0) { Py_DECREF(r->value_ref); r->~pesapi_value_ref__(); free(r); }
}

pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref pvalue_ref) { auto r = reinterpret_cast<pesapi_value_ref__*>(pvalue_ref); Py_INCREF(r->value_ref); return pesapiValueFromPyObject(r->value_ref); }

void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref pvalue_ref) { auto r = reinterpret_cast<pesapi_value_ref__*>(pvalue_ref); Py_DECREF(r->value_ref); r->value_ref = Py_None; Py_INCREF(Py_None); }

int pesapi_set_owner(pesapi_env env, pesapi_value pvalue, pesapi_value powner) {
    PyObject* owner = pyObjectFromPesapiValue(powner);
    if (PyDict_Check(owner)) { PyDict_SetItemString(owner, "0", pyObjectFromPesapiValue(pvalue)); return true; }
    return false;
}

pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref) { return reinterpret_cast<pesapi_env_ref>(value_ref); }

void** pesapi_get_ref_internal_fields(pesapi_value_ref pvalue_ref, uint32_t* pinternal_field_count) {
    auto r = reinterpret_cast<pesapi_value_ref__*>(pvalue_ref);
    *pinternal_field_count = r->internal_field_count; return &r->internal_fields[0];
}

pesapi_value pesapi_get_property(pesapi_env env, pesapi_value pobject, const char* key) {
    PyObject* obj = pyObjectFromPesapiValue(pobject);
    PyObject* result = nullptr;
    if (PyDict_Check(obj)) {
        result = PyDict_GetItemString(obj, key);
        if (!result) return 0; Py_INCREF(result); return pesapiValueFromPyObject(result);
    }
    result = PyObject_GetAttrString(obj, key);
    if (!result) { PyErr_Clear(); return 0; }
    return pesapiValueFromPyObject(result);
}

void pesapi_set_property(pesapi_env env, pesapi_value pobject, const char* key, pesapi_value pvalue) {
    PyObject* obj = pyObjectFromPesapiValue(pobject);
    PyObject* v = pyObjectFromPesapiValue(pvalue);
    if (PyDict_Check(obj)) { PyDict_SetItemString(obj, key, v); return; }
    PyObject_SetAttrString(obj, key, v);
}

int pesapi_get_private(pesapi_env env, pesapi_value pobject, void** out_ptr) {
    PyObject* obj = pyObjectFromPesapiValue(pobject);
    if (obj == Py_None) { *out_ptr = NULL; return false; }
    auto mapper = CppObjectMapper::Get(MainModule(env));
    *out_ptr = mapper->GetPrivateData(obj); return true;
}

int pesapi_set_private(pesapi_env env, pesapi_value pobject, void* ptr) {
    PyObject* obj = pyObjectFromPesapiValue(pobject);
    if (obj == Py_None) return false;
    auto mapper = CppObjectMapper::Get(MainModule(env));
    mapper->SetPrivateData(obj, ptr); return true;
}

pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key) {
    PyObject* obj = pyObjectFromPesapiValue(pobject);
    if (PyList_Check(obj) && key < (uint32_t)PyList_Size(obj)) { PyObject* item = PyList_GetItem(obj, (Py_ssize_t)key); Py_INCREF(item); return pesapiValueFromPyObject(item); }
    return 0;
}

void pesapi_set_property_uint32(pesapi_env env, pesapi_value pobject, uint32_t key, pesapi_value pvalue) {
    PyObject* obj = pyObjectFromPesapiValue(pobject);
    PyObject* v = pyObjectFromPesapiValue(pvalue);
    if (PyList_Check(obj)) {
        if (!v) { v = Py_None; }
        Py_INCREF(v); // PyList_SetItem steals a reference
        PyList_SetItem(obj, (Py_ssize_t)key, v);
    }
}

pesapi_value pesapi_call_function(pesapi_env env, pesapi_value pfunc, pesapi_value this_object, int argc, const pesapi_value argv[]) {
    PyObject* func = pyObjectFromPesapiValue(pfunc);
    PyObject* args = PyTuple_New(argc);
    for (int i = 0; i < argc; ++i) { PyObject* a = pyObjectFromPesapiValue(argv[i]); Py_INCREF(a); PyTuple_SetItem(args, i, a); }
    PyObject* result = PyObject_Call(func, args, nullptr); Py_DECREF(args);
    if (!result) { return 0; }
    return pesapiValueFromPyObject(result);
}

pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path) {
    auto* penv = EnvFrom(env);
    PyObject* codeObj = Py_CompileString((const char*)code, path ? path : "<string>", Py_file_input);
    if (!codeObj) { return 0; }
    PyObject* result = PyEval_EvalCode(codeObj, penv && penv->globals_dict ? penv->globals_dict : PyEval_GetGlobals(), penv && penv->globals_dict ? penv->globals_dict : PyEval_GetLocals());
    Py_DECREF(codeObj);
    if (!result) { return 0; }
    return pesapiValueFromPyObject(result);
}

pesapi_value pesapi_global(pesapi_env env) {
    auto* penv = EnvFrom(env);
    PyObject* globals = penv ? penv->globals_dict : PyEval_GetGlobals();
    if (!globals) { return pesapiValueFromPyObject(&_Py_NoneStruct); }
    Py_INCREF(globals); return pesapiValueFromPyObject(globals);
}

const void* pesapi_get_env_private(pesapi_env env) { return CppObjectMapper::Get(MainModule(env))->GetEnvPrivate(); }
void pesapi_set_env_private(pesapi_env env, const void* ptr) { CppObjectMapper::Get(MainModule(env))->SetEnvPrivate(ptr); }

void pesapi_set_registry(pesapi_env env, pesapi_registry registry) { CppObjectMapper::Get(MainModule(env))->SetRegistry(reinterpret_cast<puerts::ScriptClassRegistry*>(registry)); }

pesapi_ffi g_pesapi_ffi {
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
    &pesapi_set_registry
};

} // namespace pythonimpl
} // namespace pesapi
