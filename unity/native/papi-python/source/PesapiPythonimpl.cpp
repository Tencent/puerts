#include "papi_python.h"
#include <cstring>
#include <stdexcept>
#include <mutex>
namespace pesapi
{
namespace pythonimpl
{

// 类型转换辅助函数
inline PyObject* pyObjectFromPesapiValue(pesapi_value value)
{
    return reinterpret_cast<PyObject*>(value);
}

inline pesapi_value pesapiValueFromPyObject(PyObject* obj)
{
    return reinterpret_cast<pesapi_value>(obj);
}

inline PythonEnv* pythonEnvFromPesapiEnv(pesapi_env env)
{
    return reinterpret_cast<PythonEnv*>(env);
}

struct pesapi_registry_api g_registry_api = {
    // 1. 创建注册表（返回全局注册表指针）
    .create_registry = []() -> pesapi_registry { return reinterpret_cast<pesapi_registry>(&g_type_registry); },

    // 2. 分配类型信息数组（返回pesapi_type_info__数组）
    .alloc_type_infos = [](size_t count) -> pesapi_type_info
    {
        if (count == 0)
            return nullptr;
        // 分配实际的类型信息结构体数组
        auto* infos = new pesapi_type_info__[count];
        return reinterpret_cast<pesapi_type_info>(infos);
    },

    // 3. 设置类型信息（填充pesapi_type_info__的字段）
    .set_type_info =
        [](pesapi_type_info type_infos, size_t index, const char* name, int is_pointer, int is_const, int is_ref, int is_primitive)
    {
        if (!type_infos)
            return;
        auto* infos = reinterpret_cast<pesapi_type_info__*>(type_infos);
        infos[index].name = name ? name : "";
        infos[index].is_pointer = is_pointer != 0;
        infos[index].is_const = is_const != 0;
        infos[index].is_ref = is_ref != 0;
        infos[index].is_primitive = is_primitive != 0;
    },

    // 4. 创建函数签名信息（存储返回类型和参数类型）
    .create_signature_info = [](pesapi_type_info return_type, size_t parameter_count,
                                 pesapi_type_info parameter_types) -> pesapi_signature_info
    {
        auto* sig = new pesapi_signature_info__();
        sig->return_type = return_type;
        sig->param_count = parameter_count;
        if (parameter_count > 0 && parameter_types)
        {
            auto* params = reinterpret_cast<pesapi_type_info__*>(parameter_types);
            sig->param_types = new pesapi_type_info[parameter_count];
            for (size_t i = 0; i < parameter_count; ++i)
            {
                sig->param_types[i] = &params[i];
            }
        }
        else
        {
            sig->param_types = nullptr;
        }
        return reinterpret_cast<pesapi_signature_info>(sig);
    },

    .define_class =
        [](pesapi_registry registry, const void* type_id, const void* super_type_id, const char* module_name, const char* type_name,
            pesapi_constructor constructor, pesapi_finalize finalize, void* data, int copy_str)
    {
        // 调用TypeRegistry的DefineClass，补充构造函数
        g_type_registry.DefineClass(type_id, super_type_id, module_name, type_name, finalize, data);
        // 额外存储构造函数
        if (auto* info = g_type_registry.GetTypeInfo(type_id))
        {
            info->constructor = constructor;
        }
    },

    // 6. 设置类成员数量（方法/函数/属性/变量）
    .set_property_info_size = [](pesapi_registry registry, const void* type_id, int method_count, int function_count,
                                  int property_count, int variable_count)
    { g_type_registry.SetPropertyInfoSize(type_id, method_count, function_count, property_count, variable_count); },

    // 7. 注册方法信息
    .set_method_info =
        [](pesapi_registry registry, const void* type_id, int index, const char* name, int is_static, pesapi_callback method,
            void* data, int copy_str)
    {
        MethodInfo method_info;
        method_info.name = name ? name : "";
        method_info.is_static = is_static != 0;
        method_info.method = method;
        method_info.data = data;
        g_type_registry.AddMethodInfo(type_id, method_info);
    },

    // 8. 注册属性信息
    .set_property_info =
        [](pesapi_registry registry, const void* type_id, int index, const char* name, int is_static, pesapi_callback getter,
            pesapi_callback setter, void* getter_data, void* setter_data, int copy_str)
    {
        PropertyInfo prop_info;
        prop_info.name = name ? name : "";
        prop_info.is_static = is_static != 0;
        prop_info.getter = getter;
        prop_info.setter = setter;
        prop_info.getter_data = getter_data;
        prop_info.setter_data = setter_data;
        g_type_registry.AddPropertyInfo(type_id, prop_info);
    },

    // 9. 获取类关联数据
    .get_class_data = [](pesapi_registry registry, const void* type_id, int force_load) -> void*
    {
        TypeInfo* info = g_type_registry.GetTypeInfo(type_id);
        return info ? info->class_data : nullptr;
    },

    // 10. 设置类未找到回调
    .on_class_not_found = [](pesapi_registry registry, pesapi_class_not_found_callback callback)
    { g_type_registry.SetClassNotFoundCallback(registry, callback); },

    // 11. 存储类的类型信息（原型ID、各种元数据指针）
    .class_type_info =
        [](pesapi_registry registry, const char* proto_magic_id, const void* type_id, const void* constructor_info,
            const void* methods_info, const void* functions_info, const void* properties_info, const void* variables_info)
    {
        // 简化实现：将这些信息存储到TypeInfo（实际可扩展字段）
        if (auto* info = g_type_registry.GetTypeInfo(type_id))
        {
        }
    },

    // 12. 通过模块名和类型名查找type_id
    .find_type_id = [](pesapi_registry registry, const char* module_name, const char* type_name) -> const void*
    { return g_type_registry.FindTypeId(module_name, type_name); },

    // 13. 跟踪原生对象生命周期（注册enter/exit回调）
    .trace_native_object_lifecycle = [](pesapi_registry registry, const void* type_id, pesapi_on_native_object_enter on_enter,
                                         pesapi_on_native_object_exit on_exit) -> int
    { return g_type_registry.TraceNativeObjectLifecycle(type_id, on_enter, on_exit); }
};


pesapi_env_ref CreatePythonEnvRef()
{
    if (!Py_IsInitialized())
        Py_Initialize();

    PythonEnv* env = new PythonEnv();
    env->thread_state = Py_NewInterpreter();
    if (!env->thread_state)
    {
        delete env;
        return nullptr;
    }

    PyThreadState_Swap(env->thread_state);
    env->main_module = PyImport_AddModule("__main__");
    env->main_namespace = PyModule_GetDict(env->main_module);
    Py_INCREF(env->main_namespace);

    return reinterpret_cast<pesapi_env_ref>(env);
}

void DestroyPythonEnvRef(pesapi_env_ref env_ref)
{
    PythonEnv* env = reinterpret_cast<PythonEnv*>(env_ref);
    if (env)
    {
        PyThreadState_Swap(env->thread_state);
        delete env;
    }
}

void RunGC(pesapi_env_ref env_ref)
{
    PythonEnv* env = reinterpret_cast<PythonEnv*>(env_ref);
    if (env)
    {
        PyThreadState_Swap(env->thread_state);
        PyGC_Collect();
    }
}

// 基础类型创建函数
pesapi_value pesapi_create_null(pesapi_env env)
{
    Py_INCREF(Py_None);
    return pesapiValueFromPyObject(Py_None);
}

pesapi_value pesapi_create_undefined(pesapi_env env)
{
    Py_INCREF(Py_None);
    return pesapiValueFromPyObject(Py_None);
}

pesapi_value pesapi_create_boolean(pesapi_env env, int value)
{
    PyObject* obj = value ? Py_True : Py_False;
    Py_INCREF(obj);
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_int32(pesapi_env env, int32_t value)
{
    PyObject* obj = PyLong_FromLong(value);
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_uint32(pesapi_env env, uint32_t value)
{
    PyObject* obj = PyLong_FromUnsignedLong(value);
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_int64(pesapi_env env, int64_t value)
{
    PyObject* obj = PyLong_FromLongLong(value);
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_uint64(pesapi_env env, uint64_t value)
{
    PyObject* obj = PyLong_FromUnsignedLongLong(value);
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_double(pesapi_env env, double value)
{
    PyObject* obj = PyFloat_FromDouble(value);
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length)
{
    PyObject* obj = PyUnicode_FromStringAndSize(str, length);
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_string_utf16(pesapi_env env, const uint16_t* str, size_t length)
{
    PyObject* obj = PyUnicode_FromWideChar(reinterpret_cast<const wchar_t*>(str), length);
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_binary(pesapi_env env, void* bin, size_t length)
{
    PyObject* obj = PyBytes_FromStringAndSize(static_cast<const char*>(bin), length);
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_binary_by_value(pesapi_env env, void* bin, size_t length)
{
    return pesapi_create_binary(env, bin, length);    // Python bytes默认值拷贝
}

pesapi_value pesapi_create_array(pesapi_env env)
{
    PyObject* obj = PyList_New(0);
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_object(pesapi_env env)
{
    PyObject* obj = PyDict_New();
    return pesapiValueFromPyObject(obj);
}

pesapi_value pesapi_create_function(pesapi_env env, pesapi_callback native_impl, void* data, pesapi_function_finalize finalize)
{
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);
    if (!py_env)
        return nullptr;

    CppObjectMapper* mapper = CppObjectMapper::Get(py_env->main_module);
    return pesapiValueFromPyObject(mapper->CreateFunction(native_impl, data, finalize));
}

pesapi_value pesapi_create_class(pesapi_env env, const void* type_id)
{
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);
    if (!py_env)
        return nullptr;

    CppObjectMapper* mapper = CppObjectMapper::Get(py_env->main_module);
    return pesapiValueFromPyObject(mapper->FindOrCreateClassByID(type_id));
}

// 数值提取函数
int pesapi_get_value_bool(pesapi_env env, pesapi_value value)
{
    return PyObject_IsTrue(pyObjectFromPesapiValue(value));
}

int32_t pesapi_get_value_int32(pesapi_env env, pesapi_value value)
{
    return static_cast<int32_t>(PyLong_AsLong(pyObjectFromPesapiValue(value)));
}

uint32_t pesapi_get_value_uint32(pesapi_env env, pesapi_value value)
{
    return static_cast<uint32_t>(PyLong_AsUnsignedLong(pyObjectFromPesapiValue(value)));
}

int64_t pesapi_get_value_int64(pesapi_env env, pesapi_value value)
{
    return PyLong_AsLongLong(pyObjectFromPesapiValue(value));
}

uint64_t pesapi_get_value_uint64(pesapi_env env, pesapi_value value)
{
    return PyLong_AsUnsignedLongLong(pyObjectFromPesapiValue(value));
}

double pesapi_get_value_double(pesapi_env env, pesapi_value value)
{
    return PyFloat_AsDouble(pyObjectFromPesapiValue(value));
}

const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value value, char* buf, size_t* bufsize)
{
    PyObject* obj = pyObjectFromPesapiValue(value);
    PyObject* str_obj = PyUnicode_AsUTF8String(obj);
    if (!str_obj)
        return nullptr;

    const char* c_str = PyBytes_AsString(str_obj);
    size_t len = PyBytes_Size(str_obj);

    if (!buf)
    {
        *bufsize = len;
        Py_DECREF(str_obj);
        return nullptr;
    }

    if (*bufsize < len + 1)
    {
        *bufsize = len + 1;
        Py_DECREF(str_obj);
        return nullptr;
    }

    std::memcpy(buf, c_str, len);
    buf[len] = '\0';
    *bufsize = len;

    Py_DECREF(str_obj);
    return buf;
}

const uint16_t* pesapi_get_value_string_utf16(pesapi_env env, pesapi_value value, uint16_t* buf, size_t* bufsize)
{
    PyObject* obj = pyObjectFromPesapiValue(value);
    Py_ssize_t size;
    const wchar_t* wstr = PyUnicode_AsWideCharString(obj, &size);
    if (!wstr)
        return nullptr;

    if (!buf)
    {
        *bufsize = static_cast<size_t>(size);
        PyMem_Free(const_cast<wchar_t*>(wstr));
        return nullptr;
    }

    if (*bufsize < static_cast<size_t>(size))
    {
        *bufsize = static_cast<size_t>(size);
        PyMem_Free(const_cast<wchar_t*>(wstr));
        return nullptr;
    }

    std::memcpy(buf, wstr, size * sizeof(uint16_t));
    *bufsize = static_cast<size_t>(size);

    PyMem_Free(const_cast<wchar_t*>(wstr));
    return buf;
}

void* pesapi_get_value_binary(pesapi_env env, pesapi_value value, size_t* bufsize)
{
    PyObject* obj = pyObjectFromPesapiValue(value);
    if (PyBytes_Check(obj))
    {
        *bufsize = PyBytes_Size(obj);
        return const_cast<void*>(static_cast<const void*>(PyBytes_AsString(obj)));
    }
    return nullptr;
}

uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value value)
{
    PyObject* obj = pyObjectFromPesapiValue(value);
    return (PyList_Check(obj) || PyTuple_Check(obj)) ? static_cast<uint32_t>(PySequence_Size(obj)) : 0;
}

// 类型检查函数
int pesapi_is_null(pesapi_env env, pesapi_value value)
{
    return pyObjectFromPesapiValue(value) == Py_None ? 1 : 0;
}

int pesapi_is_undefined(pesapi_env env, pesapi_value value)
{
    return pyObjectFromPesapiValue(value) == Py_None ? 1 : 0;
}

int pesapi_is_boolean(pesapi_env env, pesapi_value value)
{
    return PyBool_Check(pyObjectFromPesapiValue(value)) ? 1 : 0;
}

int pesapi_is_int32(pesapi_env env, pesapi_value value)
{
    PyObject* obj = pyObjectFromPesapiValue(value);
    if (!PyLong_Check(obj))
        return 0;
    long long val = PyLong_AsLongLong(obj);
    return (val >= INT32_MIN && val <= INT32_MAX) ? 1 : 0;
}

int pesapi_is_uint32(pesapi_env env, pesapi_value value)
{
    PyObject* obj = pyObjectFromPesapiValue(value);
    if (!PyLong_Check(obj))
        return 0;
    unsigned long long val = PyLong_AsUnsignedLongLong(obj);
    return (val <= UINT32_MAX) ? 1 : 0;
}

int pesapi_is_int64(pesapi_env env, pesapi_value value)
{
    return PyLong_Check(pyObjectFromPesapiValue(value)) ? 1 : 0;
}

int pesapi_is_uint64(pesapi_env env, pesapi_value value)
{
    return PyLong_Check(pyObjectFromPesapiValue(value)) ? 1 : 0;
}

int pesapi_is_double(pesapi_env env, pesapi_value value)
{
    return PyFloat_Check(pyObjectFromPesapiValue(value)) ? 1 : 0;
}

int pesapi_is_string(pesapi_env env, pesapi_value value)
{
    return PyUnicode_Check(pyObjectFromPesapiValue(value)) ? 1 : 0;
}

int pesapi_is_object(pesapi_env env, pesapi_value value)
{
    return PyDict_Check(pyObjectFromPesapiValue(value)) ? 1 : 0;
}

int pesapi_is_function(pesapi_env env, pesapi_value value)
{
    return PyCallable_Check(pyObjectFromPesapiValue(value)) ? 1 : 0;
}

int pesapi_is_binary(pesapi_env env, pesapi_value value)
{
    return PyBytes_Check(pyObjectFromPesapiValue(value)) ? 1 : 0;
}

int pesapi_is_array(pesapi_env env, pesapi_value value)
{
    return PyList_Check(pyObjectFromPesapiValue(value)) ? 1 : 0;
}

// 函数调用实现
pesapi_value pesapi_call_function(pesapi_env env, pesapi_value func, pesapi_value this_object, int argc, const pesapi_value argv[])
{
    PyObject* py_func = pyObjectFromPesapiValue(func);
    if (!PyCallable_Check(py_func))
    {
        PyErr_SetString(PyExc_TypeError, "Object is not callable");
        return nullptr;
    }

    PyObject* py_args = PyTuple_New(argc);
    if (!py_args)
        return nullptr;

    for (int i = 0; i < argc; ++i)
    {
        PyObject* arg = pyObjectFromPesapiValue(argv[i]);
        Py_INCREF(arg);
        PyTuple_SetItem(py_args, i, arg);
    }

    PyObject* py_this = pyObjectFromPesapiValue(this_object);
    Py_INCREF(py_this);

    PyObject* py_result = PyObject_Call(py_func, py_args, py_this);

    Py_DECREF(py_args);
    Py_DECREF(py_this);

    if (!py_result)
    {
        PyErr_Print();
        return nullptr;
    }

    return pesapiValueFromPyObject(py_result);
}

// 对象属性操作
pesapi_value pesapi_get_property(pesapi_env env, pesapi_value object, const char* name)
{
    PyObject* obj = pyObjectFromPesapiValue(object);
    PyObject* key = PyUnicode_FromString(name);
    if (!key)
        return nullptr;

    PyObject* val = PyDict_GetItem(obj, key);
    Py_DECREF(key);
    if (!val)
        return nullptr;

    Py_INCREF(val);
    return pesapiValueFromPyObject(val);
}

void pesapi_set_property(pesapi_env env, pesapi_value object, const char* name, pesapi_value value)
{
    PyObject* obj = pyObjectFromPesapiValue(object);
    PyObject* val = pyObjectFromPesapiValue(value);
    PyObject* key = PyUnicode_FromString(name);
    if (!key)
        return;

    PyDict_SetItem(obj, key, val);
    Py_DECREF(key);
}

// 数组操作
void pesapi_set_array_element(pesapi_env env, pesapi_value array, uint32_t index, pesapi_value value)
{
    PyObject* arr = pyObjectFromPesapiValue(array);
    PyObject* val = pyObjectFromPesapiValue(value);
    if (!PyList_Check(arr))
        return;

    PyList_SetItem(arr, index, val);
    Py_INCREF(val);
}

pesapi_value pesapi_get_array_element(pesapi_env env, pesapi_value array, uint32_t index)
{
    PyObject* arr = pyObjectFromPesapiValue(array);
    if (!PyList_Check(arr) || index >= PyList_Size(arr))
        return nullptr;

    PyObject* val = PyList_GetItem(arr, index);
    Py_INCREF(val);
    return pesapiValueFromPyObject(val);
}

pesapi_value pesapi_native_object_to_value(pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)
{
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);
    if (!py_env || !type_id || !object_ptr)
        return nullptr;

    CppObjectMapper* mapper = CppObjectMapper::Get(py_env->main_module);
    if (!mapper)
        return nullptr;

    PyObject* obj = mapper->PushNativeObject(type_id, object_ptr, call_finalize != 0);
    return pesapiValueFromPyObject(obj);
}

void* pesapi_get_native_object_ptr(pesapi_env env, pesapi_value value)
{
    if (!value)
        return nullptr;

    PyObject* obj = pyObjectFromPesapiValue(value);
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);    // 获取环境
    if (!py_env)
        return nullptr;

    CppObjectMapper* mapper = CppObjectMapper::Get(py_env->main_module);
    if (!mapper)
        return nullptr;

    PyObject* native_class = mapper->FindOrCreateClassByID(nullptr);
    if (!PyObject_TypeCheck(obj, (PyTypeObject*) native_class))
        return nullptr;

    NativeObject* native_obj = reinterpret_cast<NativeObject*>(obj);
    return native_obj->object_ptr;
}

const void* pesapi_get_native_object_typeid(pesapi_env env, pesapi_value value)
{
    if (!value)
        return nullptr;

    PyObject* obj = pyObjectFromPesapiValue(value);
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);    // 获取环境
    if (!py_env)
        return nullptr;

    CppObjectMapper* mapper = CppObjectMapper::Get(py_env->main_module);
    if (!mapper)
        return nullptr;

    PyObject* native_class = mapper->FindOrCreateClassByID(nullptr);
    if (!PyObject_TypeCheck(obj, (PyTypeObject*) native_class))
        return nullptr;

    NativeObject* native_obj = reinterpret_cast<NativeObject*>(obj);
    return native_obj->type_id;
}

int pesapi_is_instance_of(pesapi_env env, const void* type_id, pesapi_value value)
{
    if (!type_id || !value)
        return 0;

    PyObject* obj = pyObjectFromPesapiValue(value);
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);
    if (!py_env)
        return 0;

    CppObjectMapper* mapper = CppObjectMapper::Get(py_env->main_module);
    if (!mapper)
        return 0;

    PyObject* native_class = mapper->FindOrCreateClassByID(nullptr);
    if (!PyObject_TypeCheck(obj, (PyTypeObject*) native_class))
        return 0;

    NativeObject* native_obj = reinterpret_cast<NativeObject*>(obj);
    // 利用全局注册表检查类型继承链
    return g_type_registry.IsInstanceOf(type_id, native_obj->type_id) ? 1 : 0;
}

pesapi_value pesapi_boxing(pesapi_env env, pesapi_value value)
{
    if (!value)
        return nullptr;

    // 创建装箱容器（用字典存储原始值）
    PyObject* box = PyDict_New();
    if (!box)
        return nullptr;

    PyObject* key = PyUnicode_FromString("boxed_value");
    PyObject* val = pyObjectFromPesapiValue(value);
    Py_INCREF(val);

    PyDict_SetItem(box, key, val);
    Py_DECREF(key);
    Py_DECREF(val);

    return pesapiValueFromPyObject(box);
}

pesapi_value pesapi_unboxing(pesapi_env env, pesapi_value value)
{
    if (!value || !pesapi_is_boxed_value(env, value))
        return nullptr;

    PyObject* box = pyObjectFromPesapiValue(value);
    PyObject* key = PyUnicode_FromString("boxed_value");
    PyObject* val = PyDict_GetItem(box, key);
    Py_DECREF(key);

    if (!val)
        return nullptr;

    Py_INCREF(val);
    return pesapiValueFromPyObject(val);
}

void pesapi_update_boxed_value(pesapi_env env, pesapi_value boxed_value, pesapi_value value)
{
    if (!boxed_value || !value || !pesapi_is_boxed_value(env, boxed_value))
        return;

    PyObject* box = pyObjectFromPesapiValue(boxed_value);
    PyObject* key = PyUnicode_FromString("boxed_value");
    PyObject* val = pyObjectFromPesapiValue(value);
    Py_INCREF(val);

    PyDict_SetItem(box, key, val);
    Py_DECREF(key);
    Py_DECREF(val);
}

int pesapi_is_boxed_value(pesapi_env env, pesapi_value value)
{
    if (!value)
        return 0;

    PyObject* obj = pyObjectFromPesapiValue(value);
    // 检查是否为包含"boxed_value"键的字典
    if (!PyDict_Check(obj))
        return 0;

    PyObject* key = PyUnicode_FromString("boxed_value");
    int has_key = PyDict_Contains(obj, key);
    Py_DECREF(key);
    return has_key ? 1 : 0;
}

int pesapi_get_args_len(pesapi_callback_info info)
{
    if (!info)
        return 0;

    pesapi_callback_info__* info_impl = reinterpret_cast<pesapi_callback_info__*>(info);
    return PyTuple_Size(info_impl->args);
}

pesapi_value pesapi_get_arg(pesapi_callback_info info, int index)
{
    if (!info || index < 0)
        return nullptr;

    pesapi_callback_info__* info_impl = reinterpret_cast<pesapi_callback_info__*>(info);
    if (index >= PyTuple_Size(info_impl->args))
        return nullptr;

    PyObject* arg = PyTuple_GetItem(info_impl->args, index);
    Py_INCREF(arg);
    return pesapiValueFromPyObject(arg);
}

pesapi_env pesapi_get_env(pesapi_callback_info info)
{
    if (!info)
        return nullptr;

    pesapi_callback_info__* info_impl = reinterpret_cast<pesapi_callback_info__*>(info);
    return reinterpret_cast<pesapi_env>(info_impl->L);
}

void* pesapi_get_native_holder_ptr(pesapi_callback_info info)
{
    if (!info)
        return nullptr;

    pesapi_callback_info__* info_impl = reinterpret_cast<pesapi_callback_info__*>(info);
    return info_impl->self;
}

const void* pesapi_get_native_holder_typeid(pesapi_callback_info info)
{
    if (!info)
        return nullptr;
    pesapi_callback_info__* info_impl = reinterpret_cast<pesapi_callback_info__*>(info);
    NativeObject* native_obj = reinterpret_cast<NativeObject*>(info_impl->self);
    return native_obj ? native_obj->type_id : nullptr;
}

void* pesapi_get_userdata(pesapi_callback_info info)
{
    if (!info)
        return nullptr;

    pesapi_callback_info__* info_impl = reinterpret_cast<pesapi_callback_info__*>(info);
    return info_impl->Data;
}

void pesapi_add_return(pesapi_callback_info info, pesapi_value value)
{
    if (!info || !value)
        return;

    pesapi_callback_info__* info_impl = reinterpret_cast<pesapi_callback_info__*>(info);
    PyObject* val = pyObjectFromPesapiValue(value);
    Py_INCREF(val);    // 延长生命周期
    info_impl->result = val;
}

void pesapi_throw_by_string(pesapi_callback_info pinfo, const char* msg)
{
    if (!pinfo || !msg)
        return;

    pesapi_callback_info__* info = reinterpret_cast<pesapi_callback_info__*>(pinfo);
    // 设置Python异常
    PyErr_SetString(PyExc_RuntimeError, msg);
    info->exception = PyErr_Occurred();    // 记录异常对象
}

pesapi_env_ref pesapi_create_env_ref(pesapi_env env)
{
    // 直接转换（假设env和env_ref兼容）
    return reinterpret_cast<pesapi_env_ref>(env);
}

int pesapi_env_ref_is_valid(pesapi_env_ref env)
{
    return (env != nullptr) ? 1 : 0;
}

pesapi_env pesapi_get_env_from_ref(pesapi_env_ref env_ref)
{
    return reinterpret_cast<pesapi_env>(env_ref);
}

pesapi_env_ref pesapi_duplicate_env_ref(pesapi_env_ref env_ref)
{
    if (!env_ref)
        return nullptr;

    PythonEnv* py_env = reinterpret_cast<PythonEnv*>(env_ref);
    py_env->ref_count++;
    return env_ref;
}

void pesapi_release_env_ref(pesapi_env_ref env_ref)
{
    if (!env_ref)
        return;

    PythonEnv* py_env = reinterpret_cast<PythonEnv*>(env_ref);
    if (--py_env->ref_count == 0)
    {
        // 实际释放逻辑（如销毁环境）
        delete py_env;
    }
}
// 打开作用域（用于异常捕获）
pesapi_scope pesapi_open_scope(pesapi_env_ref env_ref)
{
    if (!pesapi_env_ref_is_valid(env_ref))
        return nullptr;

    ScopeData* data = new ScopeData{nullptr};
    return reinterpret_cast<pesapi_scope>(data);
}
// placement版本打开作用域
pesapi_scope pesapi_open_scope_placement(pesapi_env_ref env_ref, struct pesapi_scope_memory* memory)
{
    if (!memory)
        return nullptr;

    // 利用预分配内存存储作用域状态
    ScopeData* data = reinterpret_cast<ScopeData*>(memory);
    data->exception = nullptr;
    return reinterpret_cast<pesapi_scope>(data);
}
// 检查作用域是否捕获异常
int pesapi_has_caught(pesapi_scope scope)
{
    if (!scope)
        return 0;

    ScopeData* data = reinterpret_cast<ScopeData*>(scope);
    return (data->exception != nullptr) ? 1 : 0;
}

// 获取异常字符串
const char* pesapi_get_exception_as_string(pesapi_scope scope, int with_stack)
{
    if (!scope || !pesapi_has_caught(scope))
        return nullptr;

    ScopeData* data = reinterpret_cast<ScopeData*>(scope);
    // 转换异常为字符串（简化实现）
    static char err_buf[1024];
    PyErr_Fetch(&data->exception, nullptr, nullptr);
    snprintf(err_buf, sizeof(err_buf), "Exception: %s", PyUnicode_AsUTF8(PyObject_Str(data->exception)));
    return err_buf;
}

// 关闭作用域
void pesapi_close_scope(pesapi_scope scope)
{
    if (!scope)
        return;

    ScopeData* data = reinterpret_cast<ScopeData*>(scope);
    if (data->exception)
        Py_DECREF(data->exception);
    delete data;
}

// placement版本关闭作用域
void pesapi_close_scope_placement(pesapi_scope scope)
{
    if (!scope)
        return;

    ScopeData* data = reinterpret_cast<ScopeData*>(scope);
    if (data->exception)
        Py_DECREF(data->exception);
}

pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value value, uint32_t internal_field_count)
{
    if (!value)
        return nullptr;

    ValueRef* ref = new ValueRef{value, nullptr};

    if (internal_field_count > 0)
    {
        ref->internal_fields = new void*[internal_field_count]();
    }
    return reinterpret_cast<pesapi_value_ref>(ref);
}

pesapi_value_ref pesapi_duplicate_value_ref(pesapi_value_ref value_ref)
{
    if (!value_ref)
        return nullptr;

    ValueRef* orig = reinterpret_cast<ValueRef*>(value_ref);
    // 使用原始字段数量复制
    pesapi_value_ref new_ref = pesapi_create_value_ref(nullptr, orig->value, orig->internal_field_count);
    if (orig->internal_fields && new_ref)
    {
        ValueRef* new_ref_impl = reinterpret_cast<ValueRef*>(new_ref);
        memcpy(new_ref_impl->internal_fields, orig->internal_fields,
            orig->internal_field_count * sizeof(void*));    // 按实际数量复制
    }
    return new_ref;
}

void pesapi_release_value_ref(pesapi_value_ref value_ref)
{
    if (!value_ref)
        return;

    ValueRef* ref = reinterpret_cast<ValueRef*>(value_ref);
    if (ref->internal_fields)    // 释放内部字段数组
        delete[] ref->internal_fields;
    delete ref;    // 释放结构体本身
}

pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref value_ref)
{
    if (!value_ref)
        return nullptr;

    ValueRef* ref = reinterpret_cast<ValueRef*>(value_ref);
    return ref->value;
}

void pesapi_set_ref_weak(pesapi_env env, pesapi_value_ref value_ref)
{
    if (!value_ref)
        return;

    ValueRef* ref = reinterpret_cast<ValueRef*>(value_ref);
    PyObject* obj = pyObjectFromPesapiValue(ref->value);
    PyWeakref_NewRef(obj, nullptr);    // 创建弱引用（示例）
}

int pesapi_set_owner(pesapi_env env, pesapi_value value, pesapi_value owner)
{
    if (!value || !owner)
        return 0;

    PyObject* obj = pyObjectFromPesapiValue(value);
    PyObject* owner_obj = pyObjectFromPesapiValue(owner);
    PyObject_SetAttrString(obj, "__owner__", owner_obj);
    return 1;
}

pesapi_env_ref pesapi_get_ref_associated_env(pesapi_value_ref value_ref)
{
    if (!value_ref)
        return nullptr;

    return pesapi_create_env_ref(pesapi_get_env(nullptr));
}

void** pesapi_get_ref_internal_fields(pesapi_value_ref value_ref, uint32_t* pinternal_field_count)
{
    if (!value_ref || !pinternal_field_count)
        return nullptr;

    ValueRef* ref = reinterpret_cast<ValueRef*>(value_ref);
    *pinternal_field_count = ref->internal_field_count;    // 实际使用存储的字段数量
    return ref->internal_fields;
}

int pesapi_get_private(pesapi_env env, pesapi_value object, void** out_ptr)
{
    if (!object || !out_ptr)
        return 0;

    PyObject* obj = pyObjectFromPesapiValue(object);
    PyObject* private_attr = PyObject_GetAttrString(obj, "__private_data__");
    if (!private_attr)
    {
        PyErr_Clear();
        return 0;
    }

    *out_ptr = PyCapsule_GetPointer(private_attr, "private_data");
    Py_DECREF(private_attr);
    return *out_ptr ? 1 : 0;
}

int pesapi_set_private(pesapi_env env, pesapi_value object, void* ptr)
{
    if (!object)
        return 0;

    PyObject* obj = pyObjectFromPesapiValue(object);
    PyObject* capsule = PyCapsule_New(ptr, "private_data", nullptr);
    if (!capsule)
        return 0;

    int ret = PyObject_SetAttrString(obj, "__private_data__", capsule) == 0 ? 1 : 0;
    Py_DECREF(capsule);
    return ret;
}

pesapi_value pesapi_get_property_uint32(pesapi_env env, pesapi_value object, uint32_t key)
{
    if (!object)
        return nullptr;

    PyObject* obj = pyObjectFromPesapiValue(object);
    PyObject* key_obj = PyLong_FromUnsignedLong(key);
    PyObject* val = PyDict_GetItem(obj, key_obj);
    Py_DECREF(key_obj);

    if (!val)
        return nullptr;

    Py_INCREF(val);
    return pesapiValueFromPyObject(val);
}

void pesapi_set_property_uint32(pesapi_env env, pesapi_value object, uint32_t key, pesapi_value value)
{
    if (!object || !value)
        return;

    PyObject* obj = pyObjectFromPesapiValue(object);
    PyObject* key_obj = PyLong_FromUnsignedLong(key);
    PyObject* val_obj = pyObjectFromPesapiValue(value);
    Py_INCREF(val_obj);

    PyDict_SetItem(obj, key_obj, val_obj);
    Py_DECREF(key_obj);
    Py_DECREF(val_obj);
}

pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t code_size, const char* path)
{
    // 1. 转换并校验Python环境
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);
    if (!py_env)
    {
        return pesapi_create_null(env);    // 环境无效时返回null
    }

    Py_XDECREF(py_env->exc_type);
    Py_XDECREF(py_env->exc_value);
    Py_XDECREF(py_env->exc_traceback);
    py_env->exc_type = nullptr;
    py_env->exc_value = nullptr;
    py_env->exc_traceback = nullptr;
    // 2. 线程状态管理
    PyThreadState* old_thread_state = PyThreadState_Swap(py_env->thread_state);
    if (!old_thread_state)
    {
        // 切换失败时恢复并返回错误
        PyThreadState_Swap(nullptr);
        return pesapi_create_null(env);
    }

    // 3. 准备执行参数
    const char* filename = path ? path : "<pesapi_eval>";    // 代码来源标识（用于错误提示）
    PyObject* globals = py_env->main_namespace;              // 使用__main__模块的全局命名空间
    PyObject* locals = py_env->main_namespace;               // 局部命名空间复用全局
    PyObject* result = nullptr;
    PyObject* code_obj = nullptr;

    PyObject* code_str = PyBytes_FromStringAndSize(reinterpret_cast<const char*>(code), code_size);
    if (!code_str)
    {
        PyThreadState_Swap(old_thread_state);
        return pesapi_create_null(env);
    }

    code_obj = Py_CompileStringExFlags(PyBytes_AS_STRING(code_str),    // 从字节对象获取字符串
        filename, Py_eval_input, nullptr,
        -1    // 自动计算长度（由PyBytes保证）
    );
    Py_DECREF(code_str);

    if (code_obj)
    {
        result = PyEval_EvalCode(code_obj, globals, locals);
        Py_DECREF(code_obj);
    }

    pesapi_value ret_val = nullptr;
    if (result)
    {
        ret_val = pesapiValueFromPyObject(result);
    }
    else
    {
        if (PyErr_Occurred())
        {
            // 提取异常信息并存储到环境中
            PyErr_Fetch(&py_env->exc_type, &py_env->exc_value, &py_env->exc_traceback);
            // 增加引用计数防止被释放
            Py_XINCREF(py_env->exc_type);
            Py_XINCREF(py_env->exc_value);
            Py_XINCREF(py_env->exc_traceback);
        }
        // 返回None表示执行完成（异常通过作用域检查）
        Py_INCREF(Py_None);
        ret_val = pesapiValueFromPyObject(Py_None);
    }

    PyThreadState_Swap(old_thread_state);
    return ret_val;
}

pesapi_value pesapi_global(pesapi_env env)
{
    if (!env)
        return nullptr;
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);
    if (!py_env || !py_env->main_namespace)
    {
        return pesapi_create_null(env);
    }
    Py_INCREF(py_env->main_namespace);    // 增加引用计数
    return pesapiValueFromPyObject(py_env->main_namespace);
}

const void* pesapi_get_env_private(pesapi_env env)
{
    if (!env)
        return nullptr;
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);
    return py_env ? py_env->private_data : nullptr;
}

void pesapi_set_env_private(pesapi_env env, const void* ptr)
{
    if (!env)
        return;
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);
    if (py_env)
    {
        py_env->private_data = ptr;
    }
}

// 设置环境注册表
void pesapi_set_registry(pesapi_env env, pesapi_registry registry)
{
    if (!env)
        return;
    PythonEnv* py_env = pythonEnvFromPesapiEnv(env);
    if (py_env)
    {
        py_env->registry = registry;
    }
}

pesapi_ffi g_pesapi_ffi = {
    pesapi_create_null,                 // create_null
    pesapi_create_undefined,            // create_undefined
    pesapi_create_boolean,              // create_boolean
    pesapi_create_int32,                // create_int32
    pesapi_create_uint32,               // create_uint32
    pesapi_create_int64,                // create_int64
    pesapi_create_uint64,               // create_uint64
    pesapi_create_double,               // create_double
    pesapi_create_string_utf8,          // create_string_utf8
    pesapi_create_string_utf16,         // create_string_utf16
    pesapi_create_binary,               // create_binary
    pesapi_create_binary_by_value,      // create_binary_by_value
    pesapi_create_array,                // create_array
    pesapi_create_object,               // create_object
    pesapi_create_function,             // create_function
    pesapi_create_class,                // create_class
    pesapi_get_value_bool,              // get_value_bool
    pesapi_get_value_int32,             // get_value_int32
    pesapi_get_value_uint32,            // get_value_uint32
    pesapi_get_value_int64,             // get_value_int64
    pesapi_get_value_uint64,            // get_value_uint64
    pesapi_get_value_double,            // get_value_double
    pesapi_get_value_string_utf8,       // get_value_string_utf8
    pesapi_get_value_string_utf16,      // get_value_string_utf16
    pesapi_get_value_binary,            // get_value_binary
    pesapi_get_array_length,            // get_array_length
    pesapi_is_null,                     // is_null
    pesapi_is_undefined,                // is_undefined
    pesapi_is_boolean,                  // is_boolean
    pesapi_is_int32,                    // is_int32
    pesapi_is_uint32,                   // is_uint32
    pesapi_is_int64,                    // is_int64
    pesapi_is_uint64,                   // is_uint64
    pesapi_is_double,                   // is_double
    pesapi_is_string,                   // is_string
    pesapi_is_object,                   // is_object
    pesapi_is_function,                 // is_function
    pesapi_is_binary,                   // is_binary
    pesapi_is_array,                    // is_array
    pesapi_native_object_to_value,      // native_object_to_value
    pesapi_get_native_object_ptr,       // get_native_object_ptr
    pesapi_get_native_object_typeid,    // get_native_object_typeid
    pesapi_is_instance_of,              // is_instance_of
    pesapi_boxing,                      // boxing
    pesapi_unboxing,                    // unboxing
    pesapi_update_boxed_value,          // update_boxed_value
    pesapi_is_boxed_value,              // is_boxed_value
    pesapi_get_args_len,                // get_args_len
    pesapi_get_arg,                     // get_arg
    pesapi_get_env,                     // get_env
    pesapi_get_native_holder_ptr,       // get_native_holder_ptr
    pesapi_get_native_holder_typeid,    // get_native_holder_typeid
    pesapi_get_userdata,                // get_userdata
    pesapi_add_return,                  // add_return
    pesapi_throw_by_string,             // throw_by_string
    pesapi_create_env_ref,              // create_env_ref
    pesapi_env_ref_is_valid,            // env_ref_is_valid
    pesapi_get_env_from_ref,            // get_env_from_ref
    pesapi_duplicate_env_ref,           // duplicate_env_ref
    pesapi_release_env_ref,             // release_env_ref
    pesapi_open_scope,                  // open_scope
    pesapi_open_scope_placement,        // open_scope_placement
    pesapi_has_caught,                  // has_caught
    pesapi_get_exception_as_string,     // get_exception_as_string
    pesapi_close_scope,                 // close_scope
    pesapi_close_scope_placement,       // close_scope_placement
    pesapi_create_value_ref,            // create_value_ref
    pesapi_duplicate_value_ref,         // duplicate_value_ref
    pesapi_release_value_ref,           // release_value_ref
    pesapi_get_value_from_ref,          // get_value_from_ref
    pesapi_set_ref_weak,                // set_ref_weak
    pesapi_set_owner,                   // set_owner
    pesapi_get_ref_associated_env,      // get_ref_associated_env
    pesapi_get_ref_internal_fields,     // get_ref_internal_fields
    pesapi_get_property,                // get_property
    pesapi_set_property,                // set_property
    pesapi_get_private,                 // get_private
    pesapi_set_private,                 // set_private
    pesapi_get_property_uint32,         // get_property_uint32
    pesapi_set_property_uint32,         // set_property_uint32
    pesapi_call_function,               // call_function
    pesapi_eval,                        // eval
    pesapi_global,                      // global
    pesapi_get_env_private,             // get_env_private
    pesapi_set_env_private,             // set_env_private
    pesapi_set_registry                 // set_registry
};

    // 导出函数
PESAPI_MODULE_EXPORT int GetPythonPapiVersion()
{
    return PESAPI_VERSION;
}

PESAPI_MODULE_EXPORT pesapi_ffi* GetPythonFFIApi()
{
    return &g_pesapi_ffi;
}

PESAPI_MODULE_EXPORT pesapi_env_ref CreatePythonPapiEnvRef()
{
    return CreatePythonEnvRef();
}

PESAPI_MODULE_EXPORT void DestroyPythonPapiEnvRef(pesapi_env_ref env_ref)
{
    DestroyPythonEnvRef(env_ref);
}

PESAPI_MODULE_EXPORT void RunPythonGC(pesapi_env_ref env_ref)
{
    RunGC(env_ref);
}

}    // namespace pythonimpl
}    // namespace pesapi