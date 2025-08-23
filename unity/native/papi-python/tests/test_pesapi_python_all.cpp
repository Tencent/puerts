#include "PesapiPythonImpl.h"
#include <Python.h>
#include <iostream>
#include <cstring>

int main()
{
    Py_Initialize();

    if (!Py_IsInitialized())
    {
        std::cerr << "Failed to initialize Python interpreter." << std::endl;
        return 1;
    }

    pesapi_env env = nullptr;

    pesapi_value intValue = pesapi::pythonimpl::pesapi_create_int32(env, 42);
    PyObject* pyInt = reinterpret_cast<PyObject*>(intValue);
    std::cout << "pesapi_create_int32: " << PyLong_AsLong(pyInt) << std::endl;

    pesapi_value boolValue = pesapi::pythonimpl::pesapi_create_boolean(env, 1);
    PyObject* pyBool = reinterpret_cast<PyObject*>(boolValue);
    std::cout << "pesapi_create_boolean: " << (PyObject_IsTrue(pyBool) ? "True" : "False") << std::endl;

    const char* testStr = "Hello, PuerTS!";
    pesapi_value strValue = pesapi::pythonimpl::pesapi_create_string_utf8(env, testStr, strlen(testStr));
    PyObject* pyStr = reinterpret_cast<PyObject*>(strValue);
    std::cout << "pesapi_create_string_utf8: " << PyUnicode_AsUTF8(pyStr) << std::endl;

    const char binaryData[] = { 0x05, 0x06, 0x07, 0x08 };
    pesapi_value binaryByValue = pesapi::pythonimpl::pesapi_create_binary_by_value(env, (void*)binaryData, sizeof(binaryData));
    PyObject* pyBinaryByValue = reinterpret_cast<PyObject*>(binaryByValue);
    std::cout << "pesapi_create_binary_by_value: size = " << PyBytes_Size(pyBinaryByValue) << std::endl;

    pesapi_value arrayValue = pesapi::pythonimpl::pesapi_create_array(env);
    PyObject* pyArray = reinterpret_cast<PyObject*>(arrayValue);
    std::cout << "pesapi_create_array: size = " << PyList_Size(pyArray) << std::endl;

    pesapi_value objectValue = pesapi::pythonimpl::pesapi_create_object(env);
    PyObject* pyObject = reinterpret_cast<PyObject*>(objectValue);
    std::cout << "pesapi_create_object: is dict = " << PyDict_Check(pyObject) << std::endl;

    pesapi_value nullValue = pesapi::pythonimpl::pesapi_create_null(env);
    PyObject* pyNull = reinterpret_cast<PyObject*>(nullValue);
    std::cout << "pesapi_create_null: is None = " << (pyNull == Py_None) << std::endl;

    pesapi_value undefinedValue = pesapi::pythonimpl::pesapi_create_undefined(env);
    PyObject* pyUndefined = reinterpret_cast<PyObject*>(undefinedValue);
    std::cout << "pesapi_create_undefined: is None = " << (pyUndefined == Py_None) << std::endl;

    pesapi_value doubleValue = pesapi::pythonimpl::pesapi_create_double(env, 3.14);
    double retrievedDouble = pesapi::pythonimpl::pesapi_get_value_double(env, doubleValue);
    std::cout << "pesapi_get_value_double: value = " << retrievedDouble << std::endl;

    pesapi_value uint32Value = pesapi::pythonimpl::pesapi_create_uint32(env, 123);
    PyObject* pyUint32 = reinterpret_cast<PyObject*>(uint32Value);
    std::cout << "pesapi_create_uint32: " << PyLong_AsUnsignedLong(pyUint32) << std::endl;

    pesapi_value int64Value = pesapi::pythonimpl::pesapi_create_int64(env, -9223372036854775807LL);
    PyObject* pyInt64 = reinterpret_cast<PyObject*>(int64Value);
    std::cout << "pesapi_create_int64: " << PyLong_AsLongLong(pyInt64) << std::endl;

    pesapi_value uint64Value = pesapi::pythonimpl::pesapi_create_uint64(env, 18446744073709551615ULL);
    PyObject* pyUint64 = reinterpret_cast<PyObject*>(uint64Value);
    std::cout << "pesapi_create_uint64: " << PyLong_AsUnsignedLongLong(pyUint64) << std::endl;

    const uint16_t utf16Str[] = { 'H', 'e', 'l', 'l', 'o', 0 };
    pesapi_value utf16Value = pesapi::pythonimpl::pesapi_create_string_utf16(env, utf16Str, 5);
    std::cout << "pesapi_create_string_utf16: success" << std::endl;

    const char binaryData1[] = { 0x01, 0x02, 0x03 };
    pesapi_value binaryValue = pesapi::pythonimpl::pesapi_create_binary(env, (void*)binaryData1, sizeof(binaryData1));
    std::cout << "pesapi_create_binary: success" << std::endl;

    int isUndefined = pesapi::pythonimpl::pesapi_is_undefined(env, undefinedValue);
    std::cout << "pesapi_is_undefined: " << isUndefined << std::endl;

    int isString = pesapi::pythonimpl::pesapi_is_string(env, strValue);
    std::cout << "pesapi_is_string: " << isString << std::endl;

    int isObject = pesapi::pythonimpl::pesapi_is_object(env, objectValue);
    std::cout << "pesapi_is_object: " << isObject << std::endl;

    int isArray = pesapi::pythonimpl::pesapi_is_array(env, arrayValue);
    std::cout << "pesapi_is_array: " << isArray << std::endl;

    pesapi_value functionValue = pesapi::pythonimpl::pesapi_create_function(env, nullptr, nullptr, nullptr);
    std::cout << "pesapi_create_function: success" << std::endl;

    pesapi_value classValue = pesapi::pythonimpl::pesapi_create_class(env, nullptr);
    std::cout << "pesapi_create_class: success" << std::endl;

    int boolResult = pesapi::pythonimpl::pesapi_get_value_bool(env, boolValue);
    std::cout << "pesapi_get_value_bool: " << boolResult << std::endl;

    int32_t int32Result = pesapi::pythonimpl::pesapi_get_value_int32(env, intValue);
    std::cout << "pesapi_get_value_int32: " << int32Result << std::endl;

    uint32_t uint32Result = pesapi::pythonimpl::pesapi_get_value_uint32(env, uint32Value);
    std::cout << "pesapi_get_value_uint32: " << uint32Result << std::endl;

    int64_t int64Result = pesapi::pythonimpl::pesapi_get_value_int64(env, int64Value);
    std::cout << "pesapi_get_value_int64: " << int64Result << std::endl;

    uint64_t uint64Result = pesapi::pythonimpl::pesapi_get_value_uint64(env, uint64Value);
    std::cout << "pesapi_get_value_uint64: " << uint64Result << std::endl;

    int isFunction = pesapi::pythonimpl::pesapi_is_function(env, functionValue);
    std::cout << "pesapi_is_function: " << isFunction << std::endl;

    int isBinary = pesapi::pythonimpl::pesapi_is_binary(env, binaryValue);
    std::cout << "pesapi_is_binary: " << isBinary << std::endl;

    pesapi_value nativeObjectValue = pesapi::pythonimpl::pesapi_native_object_to_value(env, nullptr, nullptr, 0);
    std::cout << "pesapi_native_object_to_value: success" << std::endl;

    void* nativeObjectPtr = pesapi::pythonimpl::pesapi_get_native_object_ptr(env, nativeObjectValue);
    std::cout << "pesapi_get_native_object_ptr: success" << std::endl;

    const void* nativeObjectTypeId = pesapi::pythonimpl::pesapi_get_native_object_typeid(env, nativeObjectValue);
    std::cout << "pesapi_get_native_object_typeid: success" << std::endl;

    int isInstanceOf = pesapi::pythonimpl::pesapi_is_instance_of(env, nullptr, nativeObjectValue);
    std::cout << "pesapi_is_instance_of: " << isInstanceOf << std::endl;

    pesapi_value boxedValue = pesapi::pythonimpl::pesapi_boxing(env, intValue);
    std::cout << "pesapi_boxing: success" << std::endl;

    Py_Finalize();

    return 0;
}
