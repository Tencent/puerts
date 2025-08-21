#pragma once
#include "pesapi.h"
#include <Python.h>
#include <map>
#include <string>
struct PythonEnv
{
    PyThreadState* thread_state;
    PyObject* main_module;
    PyObject* main_namespace;
    std::map<const void*, PyObject*> object_cache;
    std::map<std::string, PyObject*> modules_cache;
    // 异常存储字段
    PyObject* exc_type;         // 异常类型
    PyObject* exc_value;        // 异常值
    PyObject* exc_traceback;    // 异常堆栈

    int ref_count;               // 已在引用计数相关函数中使用
    const void* private_data;    // 环境私有数据
    const pesapi_registry_api* registry_api;
    pesapi_registry registry;    // 注册表

    PythonEnv()
        : thread_state(nullptr)
        , main_module(nullptr)
        , main_namespace(nullptr)
        , exc_type(nullptr)
        , exc_value(nullptr)
        , exc_traceback(nullptr)
    {
    }
    ~PythonEnv();
};