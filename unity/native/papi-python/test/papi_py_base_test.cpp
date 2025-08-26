#include <gtest/gtest.h>
#include "CppObjectMapperPython.h"
#include <Python.h>
#include "pesapi.h"
#include "TypeInfo.hpp"
#include "PString.h"

namespace pesapi
{
namespace regimpl
{
pesapi_registry pesapi_create_registry();
pesapi_type_info pesapi_alloc_type_infos(size_t count);
void pesapi_set_type_info(
    pesapi_type_info type_infos, size_t index, const char* name, int is_pointer, int is_const, int is_ref, int is_primitive);
pesapi_signature_info pesapi_create_signature_info(
    pesapi_type_info return_type, size_t parameter_count, pesapi_type_info parameter_types);
const char* str_dup(const char* str);
void pesapi_define_class(pesapi_registry registry, const void* type_id, const void* super_type_id, const char* module_name,
    const char* type_name, pesapi_constructor constructor, pesapi_finalize finalize, void* data, int copy_str);
void pesapi_set_property_info_size(
    pesapi_registry registry, const void* type_id, int method_count, int function_count, int property_count, int variable_count);
void pesapi_set_method_info(pesapi_registry registry, const void* type_id, int index, const char* name, int is_static,
    pesapi_callback method, void* data, int copy_str);
void pesapi_set_property_info(pesapi_registry registry, const void* type_id, int index, const char* name, int is_static,
    pesapi_callback getter, pesapi_callback setter, void* getter_data, void* setter_data, int copy_str);
void* pesapi_get_class_data(pesapi_registry _registry, const void* type_id, int force_load);
void pesapi_on_class_not_found(pesapi_registry registry, pesapi_class_not_found_callback callback);
void pesapi_class_type_info(pesapi_registry registry, const char* proto_magic_id, const void* type_id, const void* constructor_info,
    const void* methods_info, const void* functions_info, const void* properties_info, const void* variables_info);
const void* pesapi_find_type_id(pesapi_registry registry, const char* module_name, const char* type_name);
int pesapi_trace_native_object_lifecycle(
    pesapi_registry registry, const void* type_id, pesapi_on_native_object_enter on_enter, pesapi_on_native_object_exit on_exit);
}    // namespace regimpl
}    // namespace pesapi

namespace pesapi
{
namespace pythonimpl
{

inline pesapi_value pesapiValueFromPyObject(PyObject* v)
{
    return reinterpret_cast<pesapi_value>(v);
}

inline PyObject* pyObjectFromPesapiValue(pesapi_value v)
{
    return reinterpret_cast<PyObject*>(v);
}

struct pesapi_callback_info__
{
    PyObject* self;    // self object in Python
    PyObject* args;    // arguments passed to the callback
    int argc;          // number of arguments
    void* data;        // user data passed to the callback
    PyObject* res;     // result of the callback
    const char* ex;    // exception if any occurred during the callback
};

struct TestStructBase
{
    TestStructBase(int b)
    {
        this->b = b;
    }

    int b;
    int Foo(int a)
    {
        return a + b;
    }
};

struct TestStruct : public TestStructBase
{
    static int ctor_count;
    static int dtor_count;
    static TestStruct* lastCtorObject;
    static TestStruct* lastDtorObject;
    TestStruct(int a) : TestStructBase(a - 1)
    {
        this->a = a;
        ctor_count++;
        lastCtorObject = this;
    }

    int a;
    ~TestStruct()
    {
        dtor_count++;
        lastDtorObject = this;
    }

    int Calc(int x, int y)
    {
        return a + x + y;
    }

    void Inc(int& x)
    {
        x += a;
    }

    static int Add(int x, int y)
    {
        return x + y;
    }
};

const char* baseTypeName = "TestStructBase";

const char* typeName = "TestStruct";

int TestStruct::ctor_count = 0;
int TestStruct::dtor_count = 0;
TestStruct* TestStruct::lastCtorObject = nullptr;
TestStruct* TestStruct::lastDtorObject = nullptr;

static void* TestStructCtor(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto p0 = apis->get_arg(info, 0);
    int a = apis->get_value_int32(env, p0);
    return new TestStruct(a);
}

static void TestStructFinalize(struct pesapi_ffi* apis, void* ptr, void* class_data, void* env_private)
{
    delete (TestStruct*) ptr;
}

static void BGetterWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto self = reinterpret_cast<pesapi_value>(reinterpret_cast<pesapi_callback_info__*>(info)->self);
    auto obj = (TestStructBase*) apis->get_native_object_ptr(env, self);
    apis->add_return(info, apis->create_int32(env, obj->b));
}

static void BSetterWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto self = reinterpret_cast<pesapi_value>(reinterpret_cast<pesapi_callback_info__*>(info)->self);
    auto obj = (TestStructBase*) apis->get_native_object_ptr(env, self);
    auto p0 = apis->get_arg(info, 0);
    obj->b = apis->get_value_int32(env, p0);
}

static void BaseFooWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto self = reinterpret_cast<pesapi_value>(reinterpret_cast<pesapi_callback_info__*>(info)->self);
    auto obj = (TestStructBase*) apis->get_native_object_ptr(env, self);
    auto p0 = apis->get_arg(info, 0);
    int a = apis->get_value_int32(env, p0);
    apis->add_return(info, apis->create_int32(env, obj->Foo(a)));
}

static void AddWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto p0 = apis->get_arg(info, 0);
    auto p1 = apis->get_arg(info, 1);
    int a = apis->get_value_int32(env, p0);
    int b = apis->get_value_int32(env, p1);
    apis->add_return(info, apis->create_int32(env, TestStruct::Add(a, b)));
}

static void CalcWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto self = reinterpret_cast<pesapi_value>(reinterpret_cast<pesapi_callback_info__*>(info)->self);
    auto obj = (TestStruct*) apis->get_native_object_ptr(env, self);
    auto p0 = apis->get_arg(info, 0);
    auto p1 = apis->get_arg(info, 1);
    int a = apis->get_value_int32(env, p0);
    int b = apis->get_value_int32(env, p1);
    apis->add_return(info, apis->create_int32(env, obj->Calc(a, b)));
}

static void AGetterWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto self = reinterpret_cast<pesapi_value>(reinterpret_cast<pesapi_callback_info__*>(info)->self);
    auto obj = (TestStruct*) apis->get_native_object_ptr(env, self);
    apis->add_return(info, apis->create_int32(env, obj->a));
}

static void ASetterWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto self = reinterpret_cast<pesapi_value>(reinterpret_cast<pesapi_callback_info__*>(info)->self);
    auto obj = (TestStruct*) apis->get_native_object_ptr(env, self);
    auto p0 = apis->get_arg(info, 0);
    obj->a = apis->get_value_int32(env, p0);
}

static void CtorCountGetterWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    apis->add_return(info, apis->create_int32(env, TestStruct::ctor_count));
}

static void CtorCountSetterWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto p0 = apis->get_arg(info, 0);
    TestStruct::ctor_count = apis->get_value_int32(env, p0);
}

static void GetSelfWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto self = reinterpret_cast<pesapi_value>(reinterpret_cast<pesapi_callback_info__*>(info)->self);
    auto obj = (TestStruct*) apis->get_native_object_ptr(env, self);
    apis->add_return(info, apis->native_object_to_value(env, typeName, obj, false));
}

static void IncWrap(struct pesapi_ffi* apis, pesapi_callback_info info)
{
    auto env = apis->get_env(info);
    auto self = reinterpret_cast<pesapi_value>(reinterpret_cast<pesapi_callback_info__*>(info)->self);
    auto obj = (TestStruct*) apis->get_native_object_ptr(env, self);
    auto p0 = apis->get_arg(info, 0);
    auto unboxed = apis->unboxing(env, p0);
    int p = apis->get_value_int32(env, unboxed);
    obj->Inc(p);
    apis->update_boxed_value(env, p0, apis->create_int32(env, p));
}
int g_dummy_base_type_id = 0;
int g_dummy_type_id = 0;
class PApiBaseTest : public ::testing::Test
{
public:
    static void SetUpTestCase()
    {
        // 封装TestStructBase
        const int base_properties_count = 2;

        registry = regimpl::pesapi_create_registry();
        regimpl::pesapi_set_property_info_size(registry, &g_dummy_base_type_id, 1, 0, base_properties_count, 0);
        regimpl::pesapi_set_property_info(registry, &g_dummy_base_type_id, 0, "b", false, BGetterWrap, BSetterWrap, NULL, NULL, 1);
        regimpl::pesapi_set_method_info(registry, &g_dummy_base_type_id, 1, "Foo", false, BaseFooWrap, NULL, false);
        regimpl::pesapi_define_class(registry,&g_dummy_base_type_id, nullptr,nullptr ,baseTypeName,
            [](struct pesapi_ffi* apis, pesapi_callback_info info) -> void* { // Ctor
                auto env = apis->get_env(info);
                auto p0 = apis->get_arg(info, 0);
                int b = apis->get_value_int32(env, p0);
                return new TestStructBase(b);
        },
        [](struct pesapi_ffi* apis, void* ptr, void* class_data, void* env_private) { // Finalize
            delete static_cast<TestStructBase*>(ptr);
        },nullptr, false);

        // 封装TestStruct
        const int properties_count = 6;
        regimpl::pesapi_set_property_info_size(registry, typeName, 3, 0, properties_count, 0);
        regimpl::pesapi_set_method_info(registry, &g_dummy_type_id, 0, "Add", true, AddWrap, NULL, NULL);
        regimpl::pesapi_set_method_info(registry, &g_dummy_type_id, 1, "Calc", false, CalcWrap, NULL, NULL);
        regimpl::pesapi_set_property_info(registry, &g_dummy_type_id, 2, "a", false, AGetterWrap, ASetterWrap, NULL, NULL, NULL);
        regimpl::pesapi_set_property_info(
            registry, &g_dummy_type_id, 3, "ctor_count", true, CtorCountGetterWrap, CtorCountSetterWrap, NULL, NULL, NULL);
        regimpl::pesapi_set_method_info(registry, &g_dummy_type_id, 4, "GetSelf", false, GetSelfWrap, NULL, NULL);
        regimpl::pesapi_set_method_info(registry, &g_dummy_type_id, 5, "Inc", false, IncWrap, NULL, NULL);
        regimpl::pesapi_define_class(registry, &g_dummy_type_id, &g_dummy_base_type_id, nullptr, typeName, TestStructCtor,
            TestStructFinalize, nullptr, false);

        regimpl::pesapi_trace_native_object_lifecycle(registry, baseTypeName, OnObjEnter, OnObjExit);
        regimpl::pesapi_trace_native_object_lifecycle(registry, typeName, OnObjEnter, OnObjExit);
    }

    static void* BindData;
    static void* ObjPtr;
    static void* ClassData;
    static void* EnvPrivate;
    static pesapi_registry registry;
    static void* OnObjEnter(void* ptr, void* class_data, void* env_private)
    {
        // printf("OnObjEnter:%p, %p, %p\n", ptr, class_data, env_private);
        ObjPtr = ptr;
        ClassData = class_data;
        EnvPrivate = env_private;
        return BindData;
    }

    static void OnObjExit(void* ptr, void* class_data, void* env_private, void* userdata)
    {
        // printf("OnObjExit:%p, %p, %p, %p\n", ptr, class_data, env_private, userdata);
        BindData = userdata;
        ObjPtr = ptr;
        ClassData = class_data;
        EnvPrivate = env_private;
    }

    static void TearDownTestCase()
    {
    }

    static void Foo(struct pesapi_ffi* apis, pesapi_callback_info info)
    {
    }

    static void Bar(struct pesapi_ffi* apis, pesapi_callback_info info)
    {
        auto env = apis->get_env(info);
        PApiBaseTest* self = (PApiBaseTest*) apis->get_userdata(info);
        auto arg0 = apis->get_arg(info, 0);
        if (apis->is_int32(env, arg0))
        {
            self->bar_data = apis->get_value_int32(env, arg0);
        }
    }

    static void JsFuncFinalizer(struct pesapi_ffi* apis, void* data, void* env_private)
    {
        PApiBaseTest* self = (PApiBaseTest*) data;
        self->finalizer_env_private = env_private;
    }

    int bar_data = 0;

    void* finalizer_env_private = nullptr;

protected:
    void SetUp() override
    {
        // printf("SetUp\n");
        env_ref = create_py_env();
        apis = get_papi_ffi();

        scope = apis->open_scope(env_ref);
        auto env = apis->get_env_from_ref(env_ref);

        auto g = apis->global(env);
        // apis->set_property(env, g, "loadClass", apis->create_function(env, LoadClass, this, nullptr));
        apis->close_scope(scope);
        scope = apis->open_scope(env_ref);
    }

    static void LoadClass(struct pesapi_ffi* apis, pesapi_callback_info info)
    {
        auto env = apis->get_env(info);
        auto arg0 = apis->get_arg(info, 0);
        if (apis->is_string(env, arg0))
        {
            char buff[1024];
            size_t len = sizeof(buff);
            const char* className = apis->get_value_string_utf8(env, arg0, buff, &len);
            auto clsDef = (puerts::ScriptClassDefinition) regimpl::pesapi_find_type_id(registry, nullptr, className);
            if (clsDef.TypeId != nullptr)
            {
                auto ret = apis->create_class(env, clsDef.TypeId);
                apis->add_return(info, ret);
            }
            else
            {
                printf("LoadClass className: %s fail!!!\n", className);
            }
        }
    }

    void TearDown() override
    {
        if (Py_IsInitialized())
        {
            if (scope)
            {
                apis->close_scope(scope);
            }
            printf("TearDown\n");
            if (env_ref)
            {
                destroy_py_env(env_ref);
            }
        }
    }

    pesapi_env_ref env_ref;
    struct pesapi_ffi* apis;
    pesapi_scope scope;
};

TEST_F(PApiBaseTest, CreateAndDestroyMultQjsEnv)
{
    for (int i = 0; i < 5; i++)
    {
        pesapi_env_ref env_ref = create_py_env();
        destroy_py_env(env_ref);
    }
}

TEST_F(PApiBaseTest, RegApi)
{
    const void* typeId = "Test";
    int dummyTypeId = 0;
    regimpl::pesapi_set_property_info_size(registry, &dummyTypeId, 1, 0, 0, 0);
    regimpl::pesapi_set_method_info(registry, &dummyTypeId, 0, "Foo", true, nullptr, nullptr, false);
    regimpl::pesapi_define_class(registry, &dummyTypeId, nullptr, nullptr, "Test", nullptr, nullptr, nullptr, false);

    auto clsDef = (puerts::ScriptClassDefinition) regimpl::pesapi_find_type_id(registry, nullptr, "Test");
    // ASSERT_TRUE(clsDef != nullptr);

    ASSERT_TRUE(strcmp(clsDef.Functions[0].Name, "Foo") == 0);

    ASSERT_TRUE(clsDef.Functions[0].Callback == Foo);
}

TEST_F(PApiBaseTest, EvalJavaScript)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = "123+789";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.py");
    ASSERT_TRUE(ret != nullptr);
    ASSERT_TRUE(apis->is_int32(env, ret));
    ASSERT_TRUE(apis->get_value_int32(env, ret) == 912);
}

TEST_F(PApiBaseTest, EvalJavaScriptEx)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = "(lambda: (_ for _ in []).throw(Exception('abc')))()";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.py");
    ASSERT_TRUE(apis->has_caught(scope));

    EXPECT_STREQ("abc", apis->get_exception_as_string(scope, false));
    EXPECT_STREQ(
        "Traceback (most recent call last):\n  File \"<string>\", line 3, in <module>\n  File \"test.py\", line 1, in <module>\n  "
        "File \"test.py\", line 1, in <lambda>\n  File \"test.py\", line 1, in <genexpr>\nException: abc\n",
        apis->get_exception_as_string(scope, true));
}

TEST_F(PApiBaseTest, SetToGlobal)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto g = apis->global(env);
    apis->set_property(env, g, "SetToGlobal", apis->create_int32(env, 123));

    auto code = "SetToGlobal";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    ASSERT_TRUE(ret != nullptr);
    ASSERT_TRUE(apis->is_int32(env, ret));
    EXPECT_EQ(123, apis->get_value_int32(env, ret));
}

TEST_F(PApiBaseTest, CreatePyFunction)
{
    auto scope = apis->open_scope(env_ref);    // 为了可以提前释放
    auto env = apis->get_env_from_ref(env_ref);

    auto g = apis->global(env);
    apis->set_property(env, g, "Bar__", apis->create_function(env, Bar, this, JsFuncFinalizer));
    auto code = "Bar__(3344)";
    bar_data = 100;
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));
    EXPECT_EQ(bar_data, 3344);

    code = "globalThis.Bar__ = undefined;";
    finalizer_env_private = nullptr;
    apis->set_env_private(env, &bar_data);
    ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test2.js");
    ASSERT_FALSE(apis->has_caught(scope));

    apis->close_scope(scope);

    EXPECT_EQ((void*) &bar_data, finalizer_env_private);
    EXPECT_EQ(apis->get_env_private(env), finalizer_env_private);
    apis->set_env_private(env, nullptr);
}

TEST_F(PApiBaseTest, PropertyGetSet)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto g = apis->global(env);
    apis->set_property(env, g, "PropertyGetSet", apis->create_string_utf8(env, "123", 3));

    auto str = apis->get_property(env, g, "PropertyGetSet");
    ASSERT_TRUE(apis->is_string(env, str));
    size_t len = 0;
    apis->get_value_string_utf8(env, str, nullptr, &len);
    ASSERT_EQ(len, 3);
    char buff[4] = {0};
    apis->get_value_string_utf8(env, str, buff, &len);
    buff[3] = 0;
    EXPECT_STREQ("123", buff);

    apis->set_property_uint32(env, g, 5, apis->create_string_utf8(env, "888", 3));
    str = apis->get_property_uint32(env, g, 5);
    ASSERT_TRUE(apis->is_string(env, str));
    len = 0;
    apis->get_value_string_utf8(env, str, nullptr, &len);
    ASSERT_EQ(len, 3);
    buff[3] = 0;
    apis->get_value_string_utf8(env, str, buff, &len);
    EXPECT_STREQ("888", buff);
}

TEST_F(PApiBaseTest, ClassCtorFinalize)
{
    auto env = apis->get_env_from_ref(env_ref);

    TestStruct::ctor_count = 0;
    TestStruct::dtor_count = 0;
    TestStruct::lastCtorObject = nullptr;
    TestStruct::lastDtorObject = nullptr;

    auto code = R"(
                (function() {
                    const TestStruct = loadClass('TestStruct');
                    const obj = new TestStruct(123);
                })();
              )";
    apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));

    ASSERT_EQ(TestStruct::ctor_count, 1);
    ASSERT_EQ(TestStruct::dtor_count, 1);
    ASSERT_EQ(TestStruct::lastCtorObject, TestStruct::lastDtorObject);
}

TEST_F(PApiBaseTest, StaticFunctionCall)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = R"(
                (function() {
                    const TestStruct = loadClass('TestStruct');
                    return TestStruct.Add(123, 456);
                })();
              )";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));
    ASSERT_TRUE(apis->is_int32(env, ret));
    EXPECT_EQ(579, apis->get_value_int32(env, ret));
}

TEST_F(PApiBaseTest, InstanceMethodCall)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = R"(
                (function() {
                    const TestStruct = loadClass('TestStruct');
                    const obj = new TestStruct(123);
                    return obj.Calc(123, 456);
                })();
              )";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));
    ASSERT_TRUE(apis->is_int32(env, ret));
    EXPECT_EQ(702, apis->get_value_int32(env, ret));
}

TEST_F(PApiBaseTest, PropertyAccess)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = R"(
                (function() {
                    const TestStruct = loadClass('TestStruct');
                    const obj = new TestStruct(123);
                    let ret = "" + obj.a + ":";
                    obj.a = 0;
                    ret += obj.Calc(123, 456);
                    return ret;
                })();
              )";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));
    ASSERT_TRUE(apis->is_string(env, ret));
    char buff[1024];
    size_t len = sizeof(buff);
    const char* str = apis->get_value_string_utf8(env, ret, buff, &len);
    // printf("%s, %d\n", str, len);
    EXPECT_STREQ("123:579", str);
}

TEST_F(PApiBaseTest, VariableAccess)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = R"(
                (function() {
                    const TestStruct = loadClass('TestStruct');
                    const obj = new TestStruct(123);
                    const ret = TestStruct.ctor_count
                    TestStruct.ctor_count = 999;
                    return ret;
                })();
              )";
    TestStruct::ctor_count = 100;
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));
    EXPECT_EQ(999, TestStruct::ctor_count);
    ASSERT_TRUE(apis->is_int32(env, ret));
    EXPECT_EQ(101, apis->get_value_int32(env, ret));
}

TEST_F(PApiBaseTest, ReturnAObject)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = R"(
                (function() {
                    const TestStruct = loadClass('TestStruct');
                    const obj = new TestStruct(123);
                    const self = obj.GetSelf();
                    return obj == self;
                })();
              )";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));
    ASSERT_TRUE(apis->is_boolean(env, ret));
    ASSERT_TRUE(apis->get_value_bool(env, ret));
}

TEST_F(PApiBaseTest, MutiObject)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = R"(
def test_func():
    TestStruct = loadClass('TestStruct')
    for i in range(1000):
        obj = TestStruct(123)
        self_obj = obj.GetSelf()
test_func()
              )";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));
}

TEST_F(PApiBaseTest, RefArgument)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = "(lambda lst=[3]: (loadClass('TestStruct')(2).Inc(lst), lst[0])[1])()";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));
    ASSERT_TRUE(apis->is_int32(env, ret));
    EXPECT_EQ(5, apis->get_value_int32(env, ret));
}

TEST_F(PApiBaseTest, CallFunction)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = "(lambda x, y: x - y)";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.py");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));
    ASSERT_TRUE(apis->is_function(env, ret));
    pesapi_value argv[2]{apis->create_int32(env, 5), apis->create_int32(env, 3)};
    auto func_call_ret = apis->call_function(env, ret, nullptr, 2, argv);
    ASSERT_TRUE(apis->is_int32(env, func_call_ret));
    EXPECT_EQ(2, apis->get_value_int32(env, func_call_ret));
}

TEST_F(PApiBaseTest, SuperAccess)
{
    auto env = apis->get_env_from_ref(env_ref);
    auto code = R"(
                (function() {
                    const TestStruct = loadClass('TestStruct');
                    const obj = new TestStruct(123);
                    let ret = "" + obj.b + ":"; // 122
                    obj.b = 5
                    ret += obj.Foo(6); // 11
                    return ret;
                })();
              )";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    if (apis->has_caught(scope))
    {
        printf("%s\n", apis->get_exception_as_string(scope, true));
    }
    ASSERT_FALSE(apis->has_caught(scope));
    ASSERT_TRUE(apis->is_string(env, ret));
    char buff[1024];
    size_t len = sizeof(buff);
    const char* str = apis->get_value_string_utf8(env, ret, buff, &len);
    EXPECT_STREQ("122:11", str);
}

void* PApiBaseTest::BindData = nullptr;
void* PApiBaseTest::ObjPtr = nullptr;
void* PApiBaseTest::ClassData = nullptr;
void* PApiBaseTest::EnvPrivate = nullptr;
pesapi_registry PApiBaseTest::registry = nullptr;

TEST_F(PApiBaseTest, LifecycleTrace)
{
    auto scopeInner = apis->open_scope(env_ref);
    auto env = apis->get_env_from_ref(env_ref);

    ObjPtr = nullptr;
    ClassData = nullptr;
    EnvPrivate = nullptr;

    int p;
    apis->set_env_private(env, &p);
    int p2;
    BindData = &p2;

    auto code = R"(
                    const TestStruct = loadClass('TestStruct');
                    obj = new TestStruct(123);
              )";

    apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    ASSERT_FALSE(apis->has_caught(scopeInner));
    EXPECT_EQ(&p, EnvPrivate);
    EXPECT_EQ((void*) typeName, ClassData);
    EXPECT_NE(nullptr, ObjPtr);

    void* OrgObjPtr = ObjPtr;

    ObjPtr = nullptr;
    ClassData = nullptr;
    EnvPrivate = nullptr;
    BindData = nullptr;

    code = R"(
                    obj = undefined;
              )";

    apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");

    ASSERT_FALSE(apis->has_caught(scopeInner));

    apis->close_scope(scopeInner);    // 还存放引用在scope里，通过close_scope释放

    EXPECT_EQ(&p, EnvPrivate);
    EXPECT_EQ((void*) typeName, ClassData);
    EXPECT_EQ(OrgObjPtr, ObjPtr);
    EXPECT_EQ(&p2, BindData);
}

TEST_F(PApiBaseTest, ObjectPrivate)
{
    auto env = apis->get_env_from_ref(env_ref);
    auto obj = apis->create_object(env);
    void* p = obj;
    EXPECT_EQ(false, apis->get_private(env, obj, &p));
    EXPECT_EQ(nullptr, p);

    int t = 0;
    EXPECT_EQ(true, apis->set_private(env, obj, &t));
    EXPECT_EQ(true, apis->get_private(env, obj, &p));
    EXPECT_EQ(&t, p);
    // pycode
    auto code = R"(lambda: print("Hello from func"))";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "test.js");
    ASSERT_FALSE(apis->has_caught(scope));
    ASSERT_TRUE(apis->is_function(env, ret));
    // EXPECT_EQ(true, apis->set_private(env, ret, &t));
    // EXPECT_EQ(true, apis->get_private(env, ret, &p));
    EXPECT_EQ(&t, p);
}

/*TEST_F(PApiBaseTest, EvalStrlenPlusOne)
{
    auto env = apis->get_env_from_ref(env_ref);

    auto code = "\n                    var obj = {}; obj.func();\n                ";
    // strlen + 1，会导致语法错误
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code) + 1, "chunk");
    ASSERT_TRUE(apis->has_caught(scope));
    /*ASSERT_EQ(0, strncmp("SyntaxError: unexpected token in expression", apis->get_exception_as_string(scope, true),
                     strlen("SyntaxError: unexpected token in expression")));#1#
}*/

/*TEST_F(PApiBaseTest, PendingJobs)
{
    apis->close_scope(scope);
    scope = apis->open_scope(env_ref);
    auto env = apis->get_env_from_ref(env_ref);

    auto code = R"(
                (function() {
                    new Promise(()=>{
                        throw new Error('unhandled rejection');
                    }).catch(error => {
                        globalThis.g_f = 1;
                    });
                })();
              )";
    apis->eval(env, (const uint8_t*) (code), strlen(code), "chunk");
    ASSERT_FALSE(apis->has_caught(scope));
    apis->close_scope(scope);

    scope = apis->open_scope(env_ref);
    code = "globalThis.g_f";
    auto ret = apis->eval(env, (const uint8_t*) (code), strlen(code), "chunk");
    ASSERT_FALSE(apis->has_caught(scope));
    ASSERT_TRUE(apis->is_int32(env, ret));
    ASSERT_EQ(1, apis->get_value_int32(env, ret));
}*/

}    // namespace pythonimpl
}    // namespace pesapi

int main(int argc, char** argv)
{
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}