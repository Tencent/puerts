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
    // �쳣�洢�ֶ�
    PyObject* exc_type;         // �쳣����
    PyObject* exc_value;        // �쳣ֵ
    PyObject* exc_traceback;    // �쳣��ջ

    int ref_count;               // �������ü�����غ�����ʹ��
    const void* private_data;    // ����˽������
    const pesapi_registry_api* registry_api;
    pesapi_registry registry;    // ע���

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