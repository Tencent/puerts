#include"CppObjectMapperPython.h"

// ��̬��������ȡģ���Ӧ��ӳ����ʵ��
CppObjectMapper* CppObjectMapper::Get(PyObject* module)
{
    std::lock_guard<std::mutex> lock(s_mapper_mutex);
    auto it = s_mappers.find(module);
    if (it != s_mappers.end())
    {
        return it->second;
    }
    CppObjectMapper* mapper = new CppObjectMapper();
    s_mappers[module] = mapper;
    Py_INCREF(module);
    return mapper;
}

// ����Python������װC++�ص�
PyObject* CppObjectMapper::CreateFunction(pesapi_callback callback, void* data, pesapi_function_finalize finalize)
{
    struct CallbackData
    {
        pesapi_callback callback;
        void* data;
        pesapi_function_finalize finalize;
    };

    CallbackData* callback_data = new CallbackData;
    callback_data->callback = callback;
    callback_data->data = data;
    callback_data->finalize = finalize;

    PyObject* capsule = PyCapsule_New(callback_data, "pesapi_callback",
        [](PyObject* capsule)
        {
            CallbackData* data = reinterpret_cast<CallbackData*>(PyCapsule_GetPointer(capsule, "pesapi_callback"));
            if (data && data->finalize)
            {
                data->finalize(&g_pesapi_ffi, data->data, nullptr);
            }
            delete data;
        });
    if (!capsule)
    {
        delete callback_data;
        return nullptr;
    }

    static PyMethodDef callback_method = {"pesapi_callback",
        [](PyObject* self, PyObject* args) -> PyObject*
        {
            CallbackData* data = reinterpret_cast<CallbackData*>(PyCapsule_GetPointer(self, "pesapi_callback"));
            if (!data || !data->callback)
            {
                PyErr_SetString(PyExc_RuntimeError, "Invalid callback data");
                return nullptr;
            }

            // ���� pesapi_callback_info__
            pesapi_callback_info__ info = {.L = PyEval_GetBuiltins(),    // �� PyImport_AddModule("__main__")
                .ArgStart = 0,
                .RetNum = 1,
                .Data = data->data,
                .args = args,
                .self = nullptr,    // �������Ҫ self�����Դ� self ����������
                .result = nullptr,
                .exception = nullptr};

            // ���� C++ �ص�
            data->callback(&g_pesapi_ffi, reinterpret_cast<pesapi_callback_info>(&info));

            // ������ֵ
            if (info.exception)
            {
                PyErr_SetString(PyExc_RuntimeError, "C++ callback threw exception");
                return nullptr;
            }

            if (info.result)
            {
                Py_INCREF(info.result);
                return info.result;
            }

            Py_RETURN_NONE;
        },
        METH_VARARGS, "Puerts C++ callback wrapper"};

    return PyCFunction_New(&callback_method, capsule);
}

// ����C++����ID���һ򴴽���Ӧ��Python��
PyObject* CppObjectMapper::FindOrCreateClassByID(const void* type_id)
{
    auto it = type_cache_.find(type_id);
    if (it != type_cache_.end())
    {
        Py_INCREF(it->second);
        return it->second;
    }

    PyObject* base_class = (PyObject*) &NativeObjectType;
    PyObject* class_dict = PyDict_New();
    PyObject* class_name = PyUnicode_FromString("CppClass");

    PyObject* args = PyTuple_Pack(3, class_name, PyTuple_Pack(1, base_class), class_dict);
    PyObject* new_class = PyObject_Call((PyObject*) &PyType_Type, args, nullptr);
    Py_DECREF(args);
    if (!new_class)
    {
        Py_DECREF(class_dict);
        Py_DECREF(class_name);
        return nullptr;
    }

    type_cache_[type_id] = new_class;
    Py_INCREF(new_class);

    Py_DECREF(class_dict);
    Py_DECREF(class_name);
    return new_class;
}

// ��C++�����װΪPython���󲢷���
PyObject* CppObjectMapper::PushNativeObject(const void* type_id, void* object_ptr, bool call_finalize)
{
    auto key = std::make_pair(type_id, object_ptr);
    auto it = object_cache_.find(key);
    if (it != object_cache_.end())
    {
        Py_INCREF(it->second);
        return it->second;
    }

    PyObject* py_class = FindOrCreateClassByID(type_id);
    if (!py_class)
    {
        return nullptr;
    }

    NativeObject* native_obj = (NativeObject*) PyType_GenericNew((PyTypeObject*) py_class, nullptr, nullptr);
    if (!native_obj)
    {
        Py_DECREF(py_class);
        return nullptr;
    }

    native_obj->type_id = type_id;
    native_obj->object_ptr = object_ptr;
    native_obj->call_finalize = call_finalize;

    object_cache_[key] = (PyObject*) native_obj;
    Py_INCREF((PyObject*) native_obj);

    Py_DECREF(py_class);
    return (PyObject*) native_obj;
}

// ��C++������Python����󶨲����뻺��
void CppObjectMapper::BindAndAddToCache(const void* type_info, const void* ptr, PyObject* value, bool call_finalize)
{
    auto key = std::make_pair(type_info, ptr);
    if (object_cache_.find(key) != object_cache_.end())
    {
        Py_DECREF(object_cache_[key]);
    }
    object_cache_[key] = value;
    Py_INCREF(value);
}

// �ӻ������Ƴ�C++�����ӳ��
void CppObjectMapper::RemoveFromCache(const void* type_info, const void* ptr)
{
    auto key = std::make_pair(type_info, ptr);
    auto it = object_cache_.find(key);
    if (it != object_cache_.end())
    {
        Py_DECREF(it->second);
        object_cache_.erase(it);
    }
}
