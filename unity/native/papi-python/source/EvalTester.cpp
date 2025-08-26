#include "papi_python.h" 
#include <iostream>
#include <cstring>
#include <cassert>
#include <cstdint>

extern void pesapi_release_value_ref(pesapi_value_ref value_ref);
extern pesapi_value_ref pesapi_create_value_ref(pesapi_env env, pesapi_value value, uint32_t internal_field_count);
extern pesapi_value pesapi_get_value_from_ref(pesapi_env env, pesapi_value_ref value_ref);

extern pesapi_value pesapi_create_string_utf8(pesapi_env env, const char* str, size_t length);
extern const char* pesapi_get_value_string_utf8(pesapi_env env, pesapi_value value, char* buf, size_t* buf_size);
extern const void* pesapi_get_value_binary(pesapi_env env, pesapi_value value, size_t* out_size);
extern uint32_t pesapi_get_array_length(pesapi_env env, pesapi_value value);

// 测试辅助宏
#define TEST_CASE(name)                           \
    std::cout << "\nTesting " << #name << "... "; \
    bool name##_passed = true

#define ASSERT_TRUE(cond, name)                                               \
    if (!(cond))                                                              \
    {                                                                         \
        std::cout << "\nAssert failed at line " << __LINE__ << ": " << #cond; \
        name##_passed = false;                                                \
    }

#define ASSERT_EQUAL(a, b, name)                                                                                       \
    if ((a) != (b))                                                                                                    \
    {                                                                                                                  \
        std::cout << "\nAssert failed at line " << __LINE__ << ": " << #a << "=" << (a) << " != " << #b << "=" << (b); \
        name##_passed = false;                                                                                         \
    }

#define TEST_RESULT(name)      \
    if (name##_passed)         \
    {                          \
        std::cout << "Passed"; \
        passed_count++;        \
    }                          \
    else                       \
    {                          \
        std::cout << "Failed"; \
    }                          \
    total_count++

int main()
{
    int passed_count = 0;
    int total_count = 0;

    // 初始化环境
    pesapi_env_ref env_ref = pesapi::pythonimpl::CreatePythonEnvRef();
    if (!env_ref)
    {
        std::cerr << "Failed to create environment" << std::endl;
        return 1;
    }
    pesapi_ffi* ffi = pesapi::pythonimpl::GetPythonFFIApi();    // 获取ffi指针
    pesapi_env env = ffi->get_env_from_ref(env_ref);

    // 测试1: 基本数值运算与值引用
    TEST_CASE(BasicArithmeticWithRef);
    {
        const char* code = R"(1 + 2 * 3)";
        pesapi_value ret = ffi->eval(env, (const uint8_t*) code, strlen(code), "<test>");
        ASSERT_TRUE(ret != nullptr, BasicArithmeticWithRef);

        // 通过ffi指针调用：创建值引用
        pesapi_value_ref val_ref = ffi->create_value_ref(env, ret, 0);
        ASSERT_TRUE(val_ref != nullptr, BasicArithmeticWithRef);

        // 通过ffi指针调用：从引用获取值并验证
        pesapi_value ref_val = ffi->get_value_from_ref(env, val_ref);
        ASSERT_TRUE(ffi->is_int32(env, ref_val) == 1, BasicArithmeticWithRef);
        ASSERT_EQUAL(ffi->get_value_int32(env, ref_val), 7, BasicArithmeticWithRef);

        // 通过ffi指针调用：释放值引用
        ffi->release_value_ref(val_ref);
    }
    TEST_RESULT(BasicArithmeticWithRef);

    // 测试2: 字符串操作与值引用
    TEST_CASE(StringOperationsWithRef);
    {
        const char* test_str = "hello world";
        pesapi_value str_val = ffi->create_string_utf8(env, test_str, strlen(test_str));
        ASSERT_TRUE(str_val != nullptr, StringOperationsWithRef);

        // 通过ffi指针调用：创建值引用
        pesapi_value_ref str_ref = ffi->create_value_ref(env, str_val, 0);
        ASSERT_TRUE(str_ref != nullptr, StringOperationsWithRef);

        // 通过ffi指针调用：从引用获取值并验证
        pesapi_value ref_str_val = ffi->get_value_from_ref(env, str_ref);
        char buf[256] = {0};
        size_t buf_size = sizeof(buf);
        const char* result_str = ffi->get_value_string_utf8(env, ref_str_val, buf, &buf_size);
        ASSERT_TRUE(strcmp(result_str, test_str) == 0, StringOperationsWithRef);

        // 通过ffi指针调用：释放值引用
        ffi->release_value_ref(str_ref);
    }
    TEST_RESULT(StringOperationsWithRef);

    // 测试3: 二进制数据与值引用
    TEST_CASE(BinaryOperationsWithRef);
    {
        const uint8_t test_bin[] = {0x10, 0x20, 0x30, 0x40};
        pesapi_value bin_val = ffi->create_binary_by_value(env, (void*) test_bin, sizeof(test_bin));
        ASSERT_TRUE(bin_val != nullptr, BinaryOperationsWithRef);

        // 通过ffi指针调用：创建值引用
        pesapi_value_ref bin_ref = ffi->create_value_ref(env, bin_val, 0);
        ASSERT_TRUE(bin_ref != nullptr, BinaryOperationsWithRef);

        // 通过ffi指针调用：从引用获取值并验证
        pesapi_value ref_bin_val = ffi->get_value_from_ref(env, bin_ref);
        size_t bin_size;
        const void* bin_data = ffi->get_value_binary(env, ref_bin_val, &bin_size);
        ASSERT_EQUAL(bin_size, sizeof(test_bin), BinaryOperationsWithRef);

        // 通过ffi指针调用：释放值引用
        ffi->release_value_ref(bin_ref);
    }
    TEST_RESULT(BinaryOperationsWithRef);

    TEST_CASE(ScopeAndExceptionHandling);
    {
        // 测试正常执行时的作用域
        pesapi_scope normal_scope = ffi->open_scope(env_ref);
        ASSERT_TRUE(normal_scope != nullptr, ScopeAndExceptionHandling);

        const char* normal_code = R"(100 / 2)";
        pesapi_value normal_ret = ffi->eval(env, (const uint8_t*) normal_code, strlen(normal_code), "<normal>");
        ASSERT_TRUE(normal_ret != nullptr, ScopeAndExceptionHandling);
        ASSERT_EQUAL(ffi->get_value_int32(env, normal_ret), 50, ScopeAndExceptionHandling);
        ASSERT_EQUAL(ffi->has_caught(normal_scope), 0, ScopeAndExceptionHandling);    // 未捕获异常

        ffi->close_scope(normal_scope);

        // 测试异常场景下的作用域
        pesapi_scope exception_scope = ffi->open_scope(env_ref);
        ASSERT_TRUE(exception_scope != nullptr, ScopeAndExceptionHandling);

        const char* error_code = R"(1 / 0)";    // 会触发除零异常
        pesapi_value error_ret = ffi->eval(env, (const uint8_t*) error_code, strlen(error_code), "<error>");
        ASSERT_TRUE(error_ret != nullptr, ScopeAndExceptionHandling);
        ASSERT_EQUAL(ffi->has_caught(exception_scope), 1, ScopeAndExceptionHandling);    // 已捕获异常

        // 测试异常信息提取
        const char* err_str = ffi->get_exception_as_string(exception_scope, 0);
        ASSERT_TRUE(err_str != nullptr && strlen(err_str) > 0, ScopeAndExceptionHandling);

        ffi->close_scope(exception_scope);

        // 测试placement版本的作用域（预分配内存）
        pesapi_scope_memory scope_mem;
        pesapi_scope placement_scope = ffi->open_scope_placement(env_ref, &scope_mem);
        ASSERT_TRUE(placement_scope != nullptr, ScopeAndExceptionHandling);

        const char* type_error_code = R"(int("not_a_number"))";    // 会触发类型转换异常
        ffi->eval(env, (const uint8_t*) type_error_code, strlen(type_error_code), "<type_error>");
        ASSERT_EQUAL(ffi->has_caught(placement_scope), 1, ScopeAndExceptionHandling);

        ffi->close_scope_placement(placement_scope);    // 使用placement版本关闭
    }
    TEST_RESULT(ScopeAndExceptionHandling);

    // 测试总结
    std::cout << "\n\nTest Summary: " << passed_count << "/" << total_count << " passed" << std::endl;

    // 清理环境
    pesapi::pythonimpl::DestroyPythonEnvRef(env_ref);

    std::cout << "\nPress Enter to exit...";
    std::cin.get();

    return (passed_count == total_count) ? 0 : 1;
}
