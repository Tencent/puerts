#include "PythonEnv.h"

std::map<PyThreadState*, PythonEnv*> PythonEnv::thread_state_map;
// 环境管理实现
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
        // 实际实现：正确销毁子解释器
        PyThreadState_Swap(thread_state);    // 切换到当前线程状态
        Py_EndInterpreter(thread_state);     // 结束子解释器
        thread_state = nullptr;
    }
    thread_state_map.erase(thread_state);
    // 释放异常相关对象
    Py_XDECREF(exc_type);
    Py_XDECREF(exc_value);
    Py_XDECREF(exc_traceback);
    exc_type = exc_value = exc_traceback = nullptr;

    // 清理缓存的对象和模块
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

    // 如果是最后一个环境，清理Python全局状态
    if (Py_IsInitialized() && PyThreadState_Get() == nullptr)
    {
        Py_Finalize();
    }
}