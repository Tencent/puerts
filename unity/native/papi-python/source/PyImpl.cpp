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
#include <algorithm>
#include <vector>
#include <cstring>
#include <cstdint>
#include <iostream>
#include <unordered_map>
#include <typeinfo>


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




namespace pyimpl
{
    inline PyObject* PyLocalValueFromPesapiValue(pesapi_value val)
    {
    // 注意引用计数
    // 传入外部变量的指针，不会被销毁
    // std::get返回常量引用!
        if (!(val->py_obj))
        {
            PyObject* ret = nullptr;
            if (std::get_if<bool>(&(val->value)))
                ret = PyBool_FromLong(std::get<bool>(val->value));
            else if (std::get_if<int32_t>(&(val->value)))
                ret = PyLong_FromLong(std::get<int32_t>(val->value));
            else if (std::get_if<uint32_t>(&(val->value)))
                ret = PyLong_FromLong(std::get<uint32_t>(val->value));
            else if (std::get_if<int64_t>(&(val->value)))
                ret = PyLong_FromLong(std::get<int64_t>(val->value));
            else if (std::get_if<uint64_t>(&(val->value)))
                ret = PyLong_FromLong(std::get<uint64_t>(val->value));
            else if (std::get_if<double>(&(val->value)))
                // 传入外部变量的指针，不会被销毁
                ret = PyFloat_FromDouble(std::get<double>(val->value));
            else if (std::get_if<const char*>(&(val->value)))
                ret = PyUnicode_FromString(std::get<const char*>(val->value));
            else if (std::get_if<std::vector<int32_t>>(&(val->value)))
            {
                std::vector<int32_t> array = std::get<std::vector<int32_t>>(val->value);
                ret = PyList_New(0);
                for (int i = 0; i < array.size(); i++)
                {
                    // REF+1
                    PyObject* item = PyLong_FromLong(array[i]);
                    // REF+1
                    PyList_Append(ret, item);
                    Py_DECREF(item);
                }
            }
            else if (std::get_if<std::vector<double>>(&(val->value)))
            {
                std::vector<double> array = std::get<std::vector<double>>(val->value);
                ret = PyList_New(0);
                for (int i = 0; i < array.size(); i++)
                {
                    // REF+1
                    PyObject* item = PyFloat_FromDouble(array[i]);
                    // REF+1
                    PyList_Append(ret, item);
                    Py_DECREF(item);
                }
            }
            else if (std::get_if<std::vector<const char*>>(&(val->value)))
            {
                std::vector<const char*> array = std::get<std::vector<const char*>>(val->value);
                if (array.size() != 2)
                {
                    std::cerr << "Wrong std::vector<const char*> type input. Length should be 2." << std::endl;
                    exit(false);
                    // return nullptr;
                }

                // 不包括用户自定义类的转换
                std::vector<const char*> types = {"int", "float", "str", "function"};
                int pos = (int) (std::find(types.begin(), types.end(), array[1]) - types.begin());
                if (pos != types.size())
                {
                    switch (pos)
                    {
                        case 0:
                            // 任意精度整数转成8字节整数
                            ret = PyLong_FromLong(atoi(array[0]));
                            break;
                        case 1:
                            ret = PyFloat_FromDouble(strtod(array[0],nullptr));
                            break;
                        case 2:
                            ret = PyUnicode_FromString(array[0]);
                            break;
                        case 3:
                            ret = PyRun_String(array[0], Py_eval_input, PyDict_New(), PyDict_New());
                            break;
                    }
                }
                else
                {
                    std::cerr << "Unsupported type cast from C++ to Python in dictionary." << std::endl;
                    exit(false);
                }
            }
            else
            {
                std::cerr << "Unsupported type cast from C++ to Python." << std::endl;
                exit(false);
            }
            val->py_obj = ret;
            return ret;
        }
        else
        {
            return val->py_obj;
        }
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

    inline pesapi_value PesapiValueFromPyLocalValue(PyObject * value)
    {
        // pesapi_value val=reinterpret_cast<pesapi_value>(value);
        pesapi_value pval=nullptr;
        if (PyLong_Check(value))
        {
            std::cout << "Int data type detected." << std::endl;
            std::cout << typeid(static_cast<int64_t>(PyLong_AsLong(value))).name() << std::endl;
            pval = new pesapi_value__(static_cast<int64_t>(PyLong_AsLong(value)));
        }
        else if (PyFloat_Check(value))
            pval = new pesapi_value__(PyFloat_AsDouble(value));
        else if (PyUnicode_Check(value))
            pval = new pesapi_value__(PyUnicode_AsUTF8(value));
        else if (PyList_Check(value))
        {
            if (PyLong_Check(PyList_GetItem(value, 0)))
            {
                std::vector<int32_t> vec = {};
                // Py_ssize_t 和 int 类似，见官方说明文档？
                for (Py_ssize_t i = 0; i < PyList_Size(value); i++)
                {
                    if (!PyLong_Check(PyList_GetItem(value, i)))
                    {
                        std::cerr << "item at index" << i << " is not a long integer, just store PyObject* directly." << std::endl;
                        pval = new pesapi_value__(value);
                        // exit(false);
                        // return nullptr;
                    }
                    PyObject* item = PyList_GetItem(value, i);
                    vec.push_back((int32_t)PyLong_AsLong(item));
                }
                pval = new pesapi_value__(vec);
            }
            else if (PyFloat_Check(PyList_GetItem(value, 0)))
            {
                std::vector<double> vec = {};
                for (Py_ssize_t i = 0; i < PyList_Size(value); i++)
                {
                    if (!PyFloat_Check(PyList_GetItem(value, i)))
                    {
                        std::cerr << "item at index" << i << " is not a double, just store PyObject* directly." << std::endl;
                        pval = new pesapi_value__(value);
                        // exit(false);
                        // return nullptr;
                    }
                    PyObject* item = PyList_GetItem(value, i);
                    vec.push_back(PyFloat_AsDouble(item));
                }
                pval = new pesapi_value__(vec);
            }
            else
            {
                std::cerr << "Unsupported Type within list, just store PyObject* directly." << std::endl;
                pval = new pesapi_value__(value);
                //exit(false);
                // return nullptr;
            }
        }

        else if (PyDict_Check(value))
        {
            std::unordered_map<const char*, std::vector<const char*>> map;
            Py_ssize_t pos = 0;
            PyObject* key;
            PyObject* kval;
            while (PyDict_Next(value, &pos, &key, &kval))
            {
                if (!PyUnicode_Check(key))
                {
                    std::cerr << "Invalid map structure encountered. Keys should be string." << std::endl;
                    exit(false);
                    // return nullptr;
                }

                const char* key2 = PyUnicode_AsUTF8(key);
                const char* kval2 = PyUnicode_AsUTF8(PyObject_Str(kval));
                // const char* --> string
                const char* type=Py_TYPE(kval)->tp_name;
                map[key2] = {kval2, type};
            }
            Py_DECREF(key);
            Py_DECREF(kval);

            pval = new pesapi_value__(map);
        }
        else
        {
            std::cerr << "Unsupported CType, just store PyObject* directly." << std::endl;
            pval = new pesapi_value__(value);
            //exit(false);
            // return nullptr;
        }

        return pval;
    }

    inline pesapi_env PesapiEnvFromPyLocalState(PyThreadState * ths)
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

        return new pesapi_env__(ths, global, local);
    }

    pesapi_env pesapi_create_env()
    {
        // Python实现为线程级别的实现，不同于V8的进程级别实现，设计哲学不同
        PyThreadState* subinterpreter = Py_NewInterpreter();
        if (!subinterpreter)
        {
            std::cerr << "Failed to create subinterpreter." << std::endl;
            exit(false);
            // return nullptr;
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
    pesapi_value pesapi_eval(pesapi_env env, const uint8_t* code, size_t len, const char* path)
    {
        if (!env)
        {
            std::cerr << "Null subinterpreter encountered." << std::endl;
            exit(false);
            // return NULL;
        }
        // 此处不需要初始化和回收解释器，因为env充当传入解释器
        // Py_Initialize();
        // PyObject* main = PyImport_AddModule("__main__");
        // PyObject* dict = PyModule_GetDict(main);
        // 假设env是dict类型数据，调用内联函数之一
        PyThreadState* state = pyimpl::PyLocalStateFromPesapiEnv(env);
        PyThreadState_Swap(state);
        std::cout << "Change to subinterpreter." << std::endl;
        // 多线程调用措施
        // PyGILState_STATE gstate = PyGILState_Ensure();
        // PyObject* dict = PyThreadState_GetDict();
        PyObject* gdict = env->global;
        PyObject* ldict = env->local;
        /* if (!ldict)
        {
            PyErr_Print();
            fprintf(stderr, "Failed to load local environment module.");
            exit(false);
            //return NULL;
        }*/
        // make use of path,作用据AI说应该是调试断点（默认__main__）
        // PyDict_SetItemString(dict, "__file__", PyUnicode_FromString(path ? path : ""));

        char* buf = (char*) malloc(len + 1);
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

        PyObject* result = PyRun_String(buf, Py_eval_input, gdict, ldict);

        // 异常处理(NULL是异常，None是无返回值的正常）
        if (!result)
        {
            // 1. 异常接收
            PyObject *ptype, *pvalue, *ptraceback;
            PyErr_Fetch(&ptype, &pvalue, &ptraceback);

            // 2. 转成字符串
            PyObject* str_exc = PyObject_Repr(pvalue);
            const char* exc_str = PyUnicode_AsUTF8(str_exc);
            fprintf(stderr, "Python exception: %s\n", exc_str);
            std::cout << "Loc: " << (path ? path : "") << std::endl;

            // 3. 清理 -->引用计数减少
            // Py_XDECREF(result);
            Py_XDECREF(ptype);
            Py_XDECREF(pvalue);
            Py_XDECREF(ptraceback);
            Py_XDECREF(str_exc);

            /* 4. 让解释器回到“干净”状态 */
            PyErr_Clear();
            // 异常退出处理
            exit(false);
            // return NULL;
        }

        free(buf);

        std::cout << PyLong_AsLong(result) << std::endl;
        /* 调用内联函数之一*/
        pesapi_value ret = pyimpl::PesapiValueFromPyLocalValue(result);

        Py_DECREF(result);

        // 只有单解释器多线程才需要手动管理GIL线程锁，多解释器场景通过New和End、引用计数控制多线程安全
        // PyGILState_Release(gstate);
        //  切换回主解释器
        // PyThreadState_Swap(PyInterpreterState_Main()->tstate_head);
        // Py_Finalize();

        return ret;
    }

    void pesapi_set_data(PyObject* dict, const char* name, PyObject* obj)
    {
        PyDict_SetItemString(dict, name, obj);
    }

    PyObject* pesapi_get_data(PyObject* dict, const char* name)
    {
        if (!PyDict_GetItemString(dict, name))
        {
            std::cerr << "Error: No such variable existent." << std::endl;
            exit(false);
            //return nullptr;
        }
        return PyDict_GetItemString(dict, name);
    }

    // question1:Why not using Context->Env setting?
    pesapi_value pesapi_global(pesapi_env env)
    {
        PyThreadState* state = pyimpl::PyLocalStateFromPesapiEnv(env);
        //  多线程锁机制
        // PyGILState_STATE gstate = PyGILState_Ensure();
        PyObject* dict = state->interp->modules;
        // PyGILState_Release(gstate);
        return pyimpl::PesapiValueFromPyLocalValue(dict);
    }

    
    /* 创建全局变量
    name参数和C++中参数名称最好一致*/
    pesapi_value pesapi_create_null(pesapi_env env,const char* name)
    {
        PyThreadState* state = pyimpl::PyLocalStateFromPesapiEnv(env);
        PyObject* dict = state->interp->modules;
        pesapi_value ret = new pesapi_value__(Py_None);
        pesapi_set_data(dict, name, ret->py_obj);
        return ret;
    }

    pesapi_value pesapi_create_boolean(pesapi_env env, const char* name,bool value)
    {
        PyThreadState* state = pyimpl::PyLocalStateFromPesapiEnv(env);
        PyObject* dict = state->interp->modules;
        pesapi_value ret = new pesapi_value__(value);
        pesapi_set_data(dict, name, PyBool_FromLong(std::get<bool>(ret->value)));
        return ret;
    }

    pesapi_value pesapi_create_int32(pesapi_env env, const char* name,int32_t value)
    {
        PyThreadState* state = pyimpl::PyLocalStateFromPesapiEnv(env);
        PyObject* dict = state->interp->modules;
        pesapi_value ret = new pesapi_value__(value);
        pesapi_set_data(dict, name, PyLong_FromLong(std::get<int32_t>(ret->value)));
        return ret;
    }

    pesapi_value pesapi_create_uint32(pesapi_env env, const char* name, uint32_t value)
    {
        PyThreadState* state = pyimpl::PyLocalStateFromPesapiEnv(env);
        PyObject* dict = state->interp->modules;
        pesapi_value ret = new pesapi_value__(value);
        pesapi_set_data(dict, name, PyLong_FromLong(std::get<uint32_t>(ret->value)));
        return ret;
    }

   pesapi_value pesapi_create_int64(pesapi_env env, const char* name, int64_t value)
    {
        PyThreadState* state = pyimpl::PyLocalStateFromPesapiEnv(env);
        PyObject* dict = state->interp->modules;
        pesapi_value ret = new pesapi_value__(value);
        pesapi_set_data(dict, name, PyLong_FromLong(std::get<int64_t>(ret->value)));
        return ret;
    }

   pesapi_value pesapi_create_uint64(pesapi_env env, const char* name, uint64_t value)
    {
        PyThreadState* state = pyimpl::PyLocalStateFromPesapiEnv(env);
        PyObject* dict = state->interp->modules;
        pesapi_value ret = new pesapi_value__(value);
        pesapi_set_data(dict, name, PyLong_FromLong(std::get<uint64_t>(ret->value)));
        return ret;
    }


}




