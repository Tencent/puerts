#include "PythonEnv.h"

// ��������ʵ��
PythonEnv::~PythonEnv()
{
    if (main_namespace)
    {
        Py_DECREF(main_namespace);
        main_namespace = nullptr;
    }
    if (main_module)
    {
        Py_DECREF(main_module);
        main_module = nullptr;
    }
    if (thread_state)
    {
        // ʵ��ʵ�֣���ȷ�����ӽ�����
        PyThreadState_Swap(thread_state);    // �л�����ǰ�߳�״̬
        Py_EndInterpreter(thread_state);     // �����ӽ�����
        thread_state = nullptr;
    }

    // �ͷ��쳣��ض���
    Py_XDECREF(exc_type);
    Py_XDECREF(exc_value);
    Py_XDECREF(exc_traceback);
    exc_type = exc_value = exc_traceback = nullptr;

    // ������Ķ����ģ��
    for (auto& entry : object_cache)
    {
        Py_DECREF(entry.second);
    }
    object_cache.clear();
    for (auto& entry : modules_cache)
    {
        Py_DECREF(entry.second);
    }
    modules_cache.clear();

    // ��������һ������������Pythonȫ��״̬
    if (Py_IsInitialized() && PyThreadState_Get() == nullptr)
    {
        Py_Finalize();
    }
}