负责人：王语其



【项目简要说明】

采取双向零延迟的缓存设计，除了自定义类或者较为复杂的数据类型，在C-Python中都有对应转换设计，复杂的数据类型目前只支持Python转C（简单包装）；

四个内联函数，和V8实现的几大区别：线程级子解释器ThreadState而非进程级v8::isolate；

不通过context（在python里是存储子解释器状态的字典）获得ThreadState，而是通过ThreadState获得字典，而非v8实现中context->GetIsolate()；

从PyObject到pesapi\_value的强制类型转换不可行，需要设计工厂函数按类别转换，采取std::variant<T1,T2,T3>(C++17以上支持)和std::get<Type>方法存储和获取C类型数据。



【项目进度】

2025-08-15

操作流程：

本地安装cmake

创建build目录

运行cmake ..

cmake --build .

ctest



2025-08-18

注：cmake工程目录结构已调整；python解释器路径需要手动指定，不在当前cmake工程中，目前支持3.9.5版本。

添加了
void pesapi\_set\_data(PyObject\*, const char\*, PyObject\*);

PyObject\* pesapi\_get\_data(PyObject\*, const char\*);

pesapi\_value pesapi\_create\_null(pesapi\_env,const char\*);

pesapi\_value pesapi\_create\_boolean(pesapi\_env, const char\*, bool);

pesapi\_value pesapi\_create\_int32(pesapi\_env, const char\*, int32\_t);

pesapi\_value pesapi\_create\_uint32(pesapi\_env, const char\*, uint32\_t);

pesapi\_value pesapi\_create\_int64(pesapi\_env, const char\*, int64\_t);

pesapi\_value pesapi\_create\_uint64(pesapi\_env, const char\*, uint64\_t);

共8个函数，并对原有函数设计做出了优化调整。





