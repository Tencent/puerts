#include <gtest/gtest.h>
/*
除了 uint32_t，C++ 还定义了其他几种固定宽度的整数类型，包括：
int8_t / uint8_t：8 位有符号/无符号整数
int16_t / uint16_t：16 位有符号/无符号整数
int64_t / uint64_t：64 位有符号/无符号整数
这些类型同样定义在 <cstdint> 头文件中，确保在不同平台上的一致性。
*/
#include <cstdint>
#include <Python.h>
#include <iostream>
#include <string>
#include <typeinfo>


#include "pesapi.h"
#include "PyImpl.h"


// path参数采取编译时宏定义方法定义(cmake不需要调整，因为pesapi_eval的实现方式包括了path的传入）
#define TEST_DIR "D:/mycpp/PuerTS_Py/unity/native/papi-python/gtest.cpp"
pesapi_value pesapi_eval(pesapi_env, const uint8_t*, size_t, const char*);
pesapi_value pesapi_global(pesapi_env);

using namespace std;

TEST(Evaltest, helloworld)
{
    cout << "Test started..." << endl;
    Py_Initialize();
    if (!Py_IsInitialized())
    {
        cerr << "Python initialization failed." << endl;
        return;
    }

    pesapi_env env_test = pyimpl::pesapi_create_env();
    string code = "2*pow(3,2)";
    const uint8_t* u8code = reinterpret_cast<const uint8_t*>("2*pow(3,2)");
    // unicode-utf8 对于ASCII码，一个字符对应一个字节，sizeof统计字节数，返回int
    size_t len = (size_t) code.length();
    cout << "len: " << len << endl;
    pesapi_value__ result = pyimpl::pesapi_eval(env_test, u8code, len, TEST_DIR);
    cout << "Debugging point1..." << endl;
    cout << get<long int>(result.value) << endl;
    // cout << typeid(result->value).name() << endl;
    EXPECT_EQ(get<long int>(result.value), 18);
    pyimpl::pesapi_destroy_env(env_test);
    Py_Finalize();
    cout << "Test terminated..." << endl;
}



