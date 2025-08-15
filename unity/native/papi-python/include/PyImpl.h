#ifndef PYIMPL_H
#define PYIMPL_H



#include <cstdint>
#include <string>
#include <vector>
#include <unordered_map>
#include <variant>
#include <Python.h>

#include "pesapi.h"


struct pesapi_value__
{
    std::variant<long int, double, std::string, std::vector<long int>, std::vector<double>, std::unordered_map<std::string, std::string>> value;

    // 构造函数

    pesapi_value__(long int v) : value(v)
    {
    }
    pesapi_value__(double v) : value(v)
    {
    }
    pesapi_value__(std::string v) : value(v)
    {
    }
    pesapi_value__(std::vector<long int> v) : value(v)
    {
    }
    pesapi_value__(std::vector<double> v) : value(v)
    {
    }
    pesapi_value__(std::unordered_map<std::string, std::string> v) : value(v)
    {
    }
};

struct pesapi_env__
{
    PyThreadState* ths;
    PyObject* global;
    PyObject* local;

    // 异常处理（参数是否有效）放在创建结构体的代码之前
    pesapi_env__(PyThreadState* threadstate, PyObject* g, PyObject* l) : ths(threadstate), global(g), local(l)
    {
    }

    // 确保C++回收env时，Python也回收相关变量
    ~pesapi_env__()
    {
        Py_EndInterpreter(ths);
        //Py_DECREF(global);
        //Py_DECREF(local);
    }
};

namespace pyimpl
{
inline PyObject* PyLocalValueFromPesapiValue(pesapi_value);
inline PyThreadState* PyLocalStateFromPesapiEnv(pesapi_env);
inline pesapi_value__ PesapiValueFromPyLocalValue(PyObject*);
inline pesapi_env__ PesapiEnvFromPyLocalState(PyThreadState*);
pesapi_env pesapi_create_env();
void pesapi_destroy_env(pesapi_env);
pesapi_value__ pesapi_eval(pesapi_env, const uint8_t*, size_t, const char*);
pesapi_value__ pesapi_global(pesapi_env);
}    // namespace pyimpl


#endif




