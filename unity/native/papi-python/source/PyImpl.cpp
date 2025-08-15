/*
项目日期：2025/08/03-
项目定位：PESAPI(PuerTs Embedded Scripting)的Python语言版本实现（100个函数左右）
项目负责：王语其
项目说明：
（1）函数接口建立在C#视角，调用python API
  (2) pesapi_value和pesapi_env分别对应pesapi_value__*和pesapi_env__*（指针）
   (2) 四个内联函数，和V8实现的几大区别：线程级子解释器ThreadState而非进程级v8::isolate；不通过context（在python里是存储子解释器状态的字典）获得ThreadState，
   而是通过ThreadState获得字典，而非v8实现中context->GetIsolate()；从PyObject到pesapi_value的强制类型转换不可行，需要设计工厂函数按类别转换
   (3）难点：引用计数怎么实现？多线程运行（以及进程锁）怎么实现？
*/



#include <string>
#include <sstream>
#include <vector>
#include <cstring>
#include <cstdint>
#include <iostream>
#include <unordered_map>

#define PY_SSIZE_T_CLEAN
#define Py_BUILD_CORE 1
#define Py_BUILD_CORE_MODULE 1
#include <Python.h>
#include <pystate.h>
#include <pyframe.h>
#include <frameobject.h>
#include <internal/pycore_interp.h>

#include "pesapi.h"
// hpp类似h
#include "TypeInfo.hpp"
#include "PString.h"
#include "PyImpl.h"


/*
struct pesapi_value__
{
    std::variant<long int, double, std::string, std::vector<int>, std::vector<double>, 
        std::unordered_map<std::string, std::string>> value;

    // 构造函数
    
    pesapi_value__(long int v) : value(v)
    {
    }
    pesapi_value__(double v) : value(v)
    {
    }
    pesapi_value__(const std::string& v) : value(v)
    {
    }
    pesapi_value__(std::vector<int>& v) : value(v)
    {
    }
    pesapi_value__(std::vector<double>& v) : value(v)
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
        Py_DECREF(global);
        Py_DECREF(local);
    }

};
*/

/*
struct Visitor
{
    int& operator()(long int& i)
    {
        std::cout << "Int: " << i << std::endl;
        return i;
    }
    double&operator()(double& d)
    {
        std::cout << "Double: " << d << std::endl;
        return d;
    }
    // 非常量引用传入参数和返回值，可以修改同时不受内存分配释放的生命周期影响
    std::string& operator()(std::string& s)
    {
        std::cout << "String: " << s << std::endl;
        return s;
    }
    std::vector<long int>& operator()(std::vector<long int>& s)
    {
        std::cout << "Vec<int>: " << std::endl;
        return s;
    }
    std::vector<double>& operator()(std::vector<double>& s)
    {
        std::cout << "Vec<double>: " << std::endl;
        return s;
    }
    std::unordered_map<std::string, std::string>& operator()(std::unordered_map<std::string, std::string>& s)
    {
        std::cout << "Map: " << std::endl;
        return s;
    }
};*/


namespace pyimpl
{
    inline PyObject* PyLocalValueFromPesapiValue(pesapi_value val)
    {
        // 传入外部变量的指针，不会被销毁
        //std::get返回常量引用!
        PyObject* ret = nullptr;
        if (std::get_if<long int>(&(val->value)))
            ret = reinterpret_cast<PyObject*>(&std::get<long int>(val->value));
        else if (std::get_if<double>(&(val->value)))
            // 传入外部变量的指针，不会被销毁
            ret = reinterpret_cast<PyObject*>(&std::get<double>(val->value));
        else if (std::get_if<std::string>(&(val->value)))
            // 传入外部变量的指针，不会被销毁
            ret = reinterpret_cast<PyObject*>(&std::get<std::string>(val->value));
        else if (std::get_if<std::vector<long int>>(&(val->value)))
            // 传入外部变量的指针，不会被销毁
            ret = reinterpret_cast<PyObject*>(&std::get<std::vector<long int>>(val->value));
        else if (std::get_if<std::vector<double>>(&(val->value)))
            // 传入外部变量的指针，不会被销毁
            ret = reinterpret_cast<PyObject*>(&std::get<std::vector<double>>(val->value));
        else if (std::get_if<std::unordered_map<std::string, std::string>>(&(val->value)))
            // 传入外部变量的指针，不会被销毁
            ret = reinterpret_cast<PyObject*>(&std::get<std::unordered_map<std::string,std::string>>(val->value));
        return ret;
    }

    
    inline PyThreadState* PyLocalStateFromPesapiEnv(pesapi_env env)
    {
        // PyThreadState* temp_py = reinterpret_cast<PyThreadState*>(env);
        if (!env)
        {
            std::cerr << "Invalid pesapi_env." << std::endl;
            return nullptr;
        }
        return env->ths;
    }


    inline pesapi_value__ PesapiValueFromPyLocalValue(PyObject* value)
    {
        // pesapi_value val=reinterpret_cast<pesapi_value>(value);
        if (PyLong_Check(value))
        {
            std::cout << "Int data type detected." << std::endl;
            return pesapi_value__(PyLong_AsLong(value));
        }
        else if (PyFloat_Check(value))
            return pesapi_value__(PyFloat_AsDouble(value));
        else if (PyUnicode_Check(value))
            return pesapi_value__(PyUnicode_AsUTF8(value));
        else if (PyList_Check(value))
        {
            
            if (PyLong_Check(PyList_GetItem(value, 0)))
            {
                std::vector<long int> vec = {};
                // Py_ssize_t 和 int 类似，见官方说明文档？
                for (Py_ssize_t i = 0; i < PyList_Size(value); i++)
                {
                    PyObject* item = PyList_GetItem(value, i);
                    vec.push_back(PyLong_AsLong(item));
                }
                return pesapi_value__(vec);
            }
            else if (PyFloat_Check(PyList_GetItem(value, 0)))
            {
                std::vector<double> vec = {};
                for (Py_ssize_t i = 0; i < PyList_Size(value); i++)
                {
                    PyObject* item = PyList_GetItem(value, i);
                    vec.push_back(PyFloat_AsDouble(item));
                }
                return pesapi_value__(vec);
            }
            else
            {
                std::cerr << "Unsupported Type within list!" << std::endl;
                exit(false);
                //return NULL;
            }

        }
        else if (PyDict_Check(value))
        {
            std::unordered_map<std::string, std::string> map;
            Py_ssize_t pos = 0;
            PyObject* key;
            PyObject* kval;
            while (PyDict_Next(value, &pos, &key, &kval))
            {
                if (!(PyUnicode_Check(key) && PyUnicode_Check(kval)))
                {
                    std::cerr<<"Invalid map structure encountered. Keys and values should be string."<<std::endl;
                    exit(false);
                    //return NULL;
                }
                std::string key2 = PyUnicode_AsUTF8(key);
                std::string kval2 = PyUnicode_AsUTF8(kval);
                map[key2] = kval2;
            }
            return pesapi_value__(map);
        }
        else
        {
            std::cerr << "Unsupported Type!" << std::endl;
            exit(false);
            //return NULL;
        }
    }

    
    inline pesapi_env__ PesapiEnvFromPyLocalState(PyThreadState* ths)
    {
        if (!ths)
        {
            std::cerr << "Empty ThreadState encountered." << std::endl;
            exit(false);
        }
        // 获取全局字典与局部字典，不会被C++函数回收
        PyObject* global = ths->interp->modules;
        PyObject* local = nullptr;
        if (ths->frame)
        {
            local = ths->frame->f_locals;
        }

        return pesapi_env__(ths,global,local);
    }


    pesapi_env pesapi_create_env()
    {
        // Python实现为线程级别的实现，不同于V8的进程级别实现，设计哲学不同
        PyThreadState* subinterpreter=Py_NewInterpreter();
        if (!subinterpreter)
        {
            std::cerr << "Failed to create subinterpreter." << std::endl;
            exit(false);
            //return nullptr;
        }
        // 获取全局字典与局部字典，不会被C++函数回收
        PyObject* global = subinterpreter->interp->modules;
        PyObject* local = nullptr;
        if (subinterpreter->frame)
        {
            local = subinterpreter->frame->f_locals;
        }

        return new pesapi_env__(subinterpreter, global, local);
    }


    // 特殊：传入结构体指针而非结构体
    void pesapi_destroy_env(pesapi_env env)
    {
        if (!env)
        {
            std::cerr << "Null env encountered." << std::endl;
            return;
        }

        // 自动先调用析构函数再释放内存
        /* PyThreadState* subinterpreter = pyimpl::PyLocalStateFromPesapiEnv(env);
        Py_EndInterpreter(subinterpreter);
        Py_DECREF(env->global);
        Py_DECREF(env->local);*/
        delete env;
        PyThreadState_Swap(PyInterpreterState_Main()->tstate_head);
        std::cout << "Env destroyed successfully." << std::endl;
    }


    // question1:为什么需要传入len这个变量，可否在函数内部使用sizeof(code)赋值给局部变量len？
    // question2:参数1和参数4为什么不可以合并为参数4（见文档）？Kimi给出的答案，考虑到多沙箱（V8，isolate）或者多字典、多子解释器（Python等），同样的path可以有不同的env环境对象并存
    // 目前的异常处理包括对象读取失败、PyRun_String函数调用失败
    pesapi_value__ pesapi_eval(pesapi_env env, const uint8_t* code, size_t len, const char* path)
    {
        if (!env)
        {
            std::cerr << "Null subinterpreter encountered." << std::endl;
            exit(false);
            //return NULL;
        }
        // 此处不需要初始化和回收解释器，因为env充当传入解释器
        // Py_Initialize();
        //PyObject* main = PyImport_AddModule("__main__");
        //PyObject* dict = PyModule_GetDict(main);
        //假设env是dict类型数据，调用内联函数之一
        PyThreadState* state = pyimpl::PyLocalStateFromPesapiEnv(env);
        PyThreadState_Swap(state);
        std::cout << "Change to subinterpreter." << std::endl;
        // 多线程调用措施
        //PyGILState_STATE gstate = PyGILState_Ensure();
        PyObject* dict = PyThreadState_GetDict();

        if (!dict) {
            PyErr_Print();
            fprintf(stderr, "Failed to load environment module.");
            exit(false);
            //return NULL;
        }
        //make use of path,作用据AI说应该是调试断点（默认__main__）
        PyDict_SetItemString(dict, "__file__", PyUnicode_FromString(path ? path : ""));


        char* buf = (char*)malloc(len + 1);
        memcpy(buf, code, len);
        buf[len] = '\0';
        std::cout << buf << std::endl;

        /* enum _Py_parser_input {
            Py_file_input = 257,
            Py_eval_input = 258,
            Py_single_input = 259
        };*/
        /*参数	含义
        str	要执行的源代码字符串（UTF-8）。
        start	告诉解析器 从语法层面把这段文本当成什么 来解析：
        globals	全局命名空间字典；代码里出现的全局变量都查这个 dict。通常传 PyModule_GetDict(module) 或自建 PyDict_New()。
        locals	局部命名空间字典；如果与 globals 相同，则代码在模块级作用域执行；若想模拟函数局部作用域，可传另一 dict。*/

        PyObject* result = PyRun_String(buf, Py_eval_input, dict, dict);

        //异常处理(NULL是异常，None是无返回值的正常）
        if (!result)
        {
            // 1. 异常接收
            PyObject *ptype, *pvalue, *ptraceback;
            PyErr_Fetch(&ptype, &pvalue, &ptraceback);

            // 2. 转成字符串
            PyObject* str_exc = PyObject_Repr(pvalue);
            const char* exc_str = PyUnicode_AsUTF8(str_exc);
            fprintf(stderr, "Python exception: %s\n", exc_str);

            // 3. 清理 -->引用计数减少
            //Py_XDECREF(result);
            Py_XDECREF(ptype);
            Py_XDECREF(pvalue);
            Py_XDECREF(ptraceback);
            Py_XDECREF(str_exc);

            /* 4. 让解释器回到“干净”状态 */
            PyErr_Clear();
            // 异常退出处理
            exit(false);
            //return NULL;
        }

        free(buf);

        std::cout << PyLong_AsLong(result) << std::endl;
        /* 调用内联函数之一*/
        pesapi_value__ ret = pyimpl::PesapiValueFromPyLocalValue(result);

        Py_DECREF(result);

        //PyGILState_Release(gstate);
        // 切换回主解释器
        //PyThreadState_Swap(PyInterpreterState_Main()->tstate_head);
        // Py_Finalize();

        return ret;
    }


    // 说明：可能用不到env，但是形式要统一
    // 不能进行异常处理（见文档）
    // question1:Why not using Context->Env setting?
    pesapi_value__ pesapi_global(pesapi_env env)
    {
        // PyObject* context = PyImport_AddModule("__main__");
        PyThreadState* state = pyimpl::PyLocalStateFromPesapiEnv(env);
        //PyThreadState_Swap(state);
        // 多线程锁机制
        //PyGILState_STATE gstate = PyGILState_Ensure();
        PyObject* dict = state->interp->modules;
        //PyGILState_Release(gstate);
        //PyThreadState_Swap(NULL);
        return pyimpl::PesapiValueFromPyLocalValue(dict);
    }


}





