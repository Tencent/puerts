#ifndef PYIMPL_H
#define PYIMPL_H



#include <cstdint>
#include <string>
#include <vector>
#include <unordered_map>
#include <variant>
#include <Python.h>

#include "pesapi.h"

enum class CacheType
{
    C_BOOL=0,C_INT32,C_UINT32,C_INT64,C_UINT64,C_DOUBLE,C_STRING,C_VECI,C_VECD,C_DICT,C_VALUE,PY_OBJ
};

struct pesapi_value__
{
    std::variant<bool,int32_t,uint32_t,int64_t, uint64_t,double, const char*, std::vector<int32_t>, std::vector<double>, std::unordered_map<const char*, std::vector<const char*>>,std::vector<const char*>> value;
    CacheType ctype;
    PyObject* py_obj=nullptr;

    // 构造函数
    pesapi_value__(bool v) : value(v), ctype(CacheType::C_BOOL)
    {
    }
    pesapi_value__(int32_t v) : value(v), ctype(CacheType::C_INT32)
    {
    }
    pesapi_value__(uint32_t v) : value(v), ctype(CacheType::C_UINT32)
    {
    }
    pesapi_value__(int64_t v) : value(v), ctype(CacheType::C_INT64)
    {
    }
    pesapi_value__(uint64_t v) : value(v), ctype(CacheType::C_UINT64)
    {
    }
    pesapi_value__(double v) : value(v), ctype(CacheType::C_DOUBLE)
    {
    }
    pesapi_value__(const char* v) : value(v), ctype(CacheType::C_STRING)
    {
    }
    pesapi_value__(std::vector<int32_t> v) : value(v), ctype(CacheType::C_VECI)
    {
    }
    pesapi_value__(std::vector<double> v) : value(v), ctype(CacheType::C_VECD)
    {
    }
    // 一般只用作全局字典或者局部字典的值数据类型信息存储，长度为2的字符串向量，内联函数不参与转换
    pesapi_value__(std::unordered_map<const char*, std::vector<const char*>> v) : value(v), ctype(CacheType::C_DICT)
    {
    }
    //用于键值对获取值的时候临时返回，内联函数参与转换，但长期存储均为上面的字符串-字典形式
    pesapi_value__(std::vector<const char*> v) : value(v), ctype(CacheType::C_VALUE)
    {
    }
    pesapi_value__(PyObject* v) : value(false), ctype(CacheType::PY_OBJ), py_obj(v)
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
    }
};

namespace pyimpl
{
inline PyObject* PyLocalValueFromPesapiValue(pesapi_value);
inline PyThreadState* PyLocalStateFromPesapiEnv(pesapi_env);
inline pesapi_value PesapiValueFromPyLocalValue(PyObject*);
inline pesapi_env PesapiEnvFromPyLocalState(PyThreadState*);
pesapi_env pesapi_create_env();
void pesapi_destroy_env(pesapi_env);
pesapi_value pesapi_eval(pesapi_env, const uint8_t*, size_t, const char*);
void pesapi_set_data(PyObject*, const char*, PyObject*);
PyObject* pesapi_get_data(PyObject*, const char*);

pesapi_value pesapi_global(pesapi_env);
pesapi_value pesapi_create_null(pesapi_env,const char*);
pesapi_value pesapi_create_boolean(pesapi_env, const char*, bool);
pesapi_value pesapi_create_int32(pesapi_env, const char*, int32_t);
pesapi_value pesapi_create_uint32(pesapi_env, const char*, uint32_t);
pesapi_value pesapi_create_int64(pesapi_env, const char*, int64_t);
pesapi_value pesapi_create_uint64(pesapi_env, const char*, uint64_t);
}    // namespace pyimpl


#endif




