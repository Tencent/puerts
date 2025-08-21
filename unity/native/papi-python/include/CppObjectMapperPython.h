#pragma once
#include "pesapi.h"
#include "TypeRegistry.h"
#include <Python.h>
#include <map>
#include <mutex>
extern pesapi_ffi g_pesapi_ffi;

struct ScopeData
{
    PyObject* exception;    // 存储作用域内的异常
};


struct NativeObject
{
    PyObject_HEAD const void* type_id;    // C++类型ID
    void* object_ptr;                     // C++对象指针
    bool call_finalize;                   // 是否需要在释放时调用C++析构逻辑
};

// 自定义类型的析构函数：释放C++对象
static void NativeObject_dealloc(NativeObject* self)
{
    if (self->call_finalize && self->object_ptr && self->type_id)
    {
        // 从全局注册表获取类型信息
        TypeInfo* type_info = g_type_registry.GetTypeInfo(self->type_id);
        if (type_info && type_info->finalizer)
        {
            // 调用注册的析构函数释放C++对象
            type_info->finalizer(&g_pesapi_ffi, self->object_ptr, type_info->class_data, nullptr);
        }
        self->object_ptr = nullptr;    // 避免重复释放
    }
    Py_TYPE(self)->tp_free((PyObject*) self);    // 释放Python对象本身
}
struct ValueRef
{
    pesapi_value value;
    void** internal_fields;
    uint32_t internal_field_count;    // 记录内部字段数量，用于复制和释放
};
struct pesapi_callback_info__
{
    PyObject* L;            // Python 当前模块命名空间（或线程状态）
    int ArgStart;           // 参数起始索引（固定为 0）
    int RetNum;             // 返回值数量（固定为 1）
    void* Data;             // 用户数据
    PyObject* args;         // Python 参数元组
    PyObject* self;         // Python 的 this（即 self）
    PyObject* result;       // 返回值
    PyObject* exception;    // 异常对象
};
// 自定义类型的类型定义
static PyTypeObject NativeObjectType = {
    PyVarObject_HEAD_INIT(nullptr, 0).tp_name = "puerts.NativeObject",
    .tp_basicsize = sizeof(NativeObject),
    .tp_dealloc = (destructor) NativeObject_dealloc,
    .tp_flags = Py_TPFLAGS_DEFAULT,
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

// 全局映射器缓存：模块 -> 映射器实例
static std::map<PyObject*, CppObjectMapper*> s_mappers;
static std::mutex s_mapper_mutex;

