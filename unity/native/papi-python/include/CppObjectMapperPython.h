#pragma once
#include "pesapi.h"
#include "papi_python.h"
#include "PythonEnv.h"
#include <Python.h>
#include <map>
#include <mutex>
extern const pesapi_registry_api* g_pesapi_registry_api;
struct ScopeData
{
    PyObject* exception;
};


struct NativeObject
{
    PyObject_HEAD const void* type_id;
    void* object_ptr;
    bool call_finalize;
};
struct ValueRef
{
    pesapi_value value;
    void** internal_fields;
    uint32_t internal_field_count;
};
struct pesapi_callback_info__
{
    PyObject* L;
    int ArgStart;
    int RetNum;
    void* Data;
    PyObject* args;
    PyObject* self;
    PyObject* result;
    PyObject* exception;
};

struct CppObjectMapper
{
    static CppObjectMapper* Get(PyObject* module);

    PyObject* CreateFunction(pesapi_callback callback, void* data, pesapi_function_finalize finalize);
    PyObject* FindOrCreateClassByID(const void* type_id);
    PyObject* PushNativeObject(const void* type_id, void* object_ptr, bool call_finalize);

    void BindAndAddToCache(const void* type_info, const void* ptr, PyObject* value, bool call_finalize);
    void RemoveFromCache(const void* type_info, const void* ptr);

private:
    std::map<const void*, PyObject*> type_cache_;
    std::map<std::pair<const void*, const void*>, PyObject*> object_cache_;
};


static std::map<PyObject*, CppObjectMapper*> s_mappers;
static std::mutex s_mapper_mutex;


static void NativeObject_dealloc(NativeObject* self)
{
    if (self->call_finalize && self->object_ptr && self->type_id)
    {

        PyThreadState* ts = PyThreadState_Get();
        if (ts)
        {

            PythonEnv* py_env = PythonEnv::FromThreadState(ts);
            if (py_env && py_env->registry_api && py_env->registry_api->trace_native_object_lifecycle)
            {

                pesapi_on_native_object_exit on_exit = [](void* env, void* type_id, void* obj_ptr, void* data)
                {

                    pesapi_env env_var = reinterpret_cast<pesapi_env>(env);
                    // TODO:
                };

                pesapi_on_native_object_enter on_enter = nullptr;

                py_env->registry_api->trace_native_object_lifecycle(py_env->registry,
                    self->type_id, 
                    on_enter,
                    on_exit
                );
            }
        }

        PyObject* main_module = PyImport_AddModule("__main__");
        if (main_module)
        {
            CppObjectMapper* mapper = CppObjectMapper::Get(main_module);
            if (mapper)
            {
                mapper->RemoveFromCache(self->type_id, self->object_ptr);
            }
            Py_DECREF(main_module);
        }
    }

    self->object_ptr = nullptr;
    self->type_id = nullptr;

    Py_TYPE(self)->tp_free((PyObject*) self);
}
// 修改 CppObjectMapperPython.h 中的 NativeObjectType 定义
static PyTypeObject NativeObjectType = 
{
    PyVarObject_HEAD_INIT(nullptr, 0)  // 第一个成员：ob_base（PyVarObject）
    "puerts.NativeObject",              // tp_name：类型名称
    sizeof(NativeObject),               // tp_basicsize：基础大小
    0,                                  // tp_itemsize：元素大小（未使用，填0）
    (destructor)NativeObject_dealloc,   // tp_dealloc：析构函数
    0,                                  // tp_print（未使用）
    0,                                  // tp_getattr（未使用）
    0,                                  // tp_setattr（未使用）
    0,                                  // tp_reserved（保留字段）
    0,                                  // tp_repr（未使用）
    0,                                  // tp_as_number（未使用）
    0,                                  // tp_as_sequence（未使用）
    0,                                  // tp_as_mapping（未使用）
    0,                                  // tp_hash（未使用）
    0,                                  // tp_call（未使用）
    0,                                  // tp_str（未使用）
    0,                                  // tp_getattro（未使用）
    0,                                  // tp_setattro（未使用）
    0,                                  // tp_as_buffer（未使用）
    Py_TPFLAGS_DEFAULT,                 // tp_flags：默认标志
    0,                                  // tp_doc（文档字符串，未使用）
    // 后续未使用的成员可全部填0（按结构体定义顺序）
};


