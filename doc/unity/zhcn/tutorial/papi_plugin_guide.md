# PuerTs 语言插件（P-API Plugin）编写指南

## 1. 概述

PuerTs 的核心设计理念是将各种脚本语言的嵌入式 API（Embedding API）封装为一套统一的脚本引擎抽象接口  **P-API**（Portable Embedded Scripting API，即 `pesapi`）。通过这套抽象层，PuerTs 可以在 Unity 中透明地支持多种脚本语言（如 JavaScript/V8、JavaScript/QuickJS、Lua、Python 等），而上层 C# 代码无需关心底层使用的具体脚本引擎。

本文基于现有的四个官方语言插件（papi-v8、papi-quickjs、papi-lua、papi-python）的实现，总结出编写新语言插件的完整指南。

## 2. 整体架构

```
+--------------------------------------------------+
|                 C# 层 (Unity)                     |
|          ScriptEnv / BackendXxx                   |
+-----+--------------------------------------------+
      |                                       |
      | P/Invoke (DllImport)                  | P/Invoke (DllImport)
      | (类注册、对象桥接等)                   | (加载插件、创建/销毁环境等)
      v                                       v
+--------------------------+   +--------------------------------------+
| PuertsCore (共享库)      |   |       语言插件 (如 PapiV8.dll)       |
| pesapi.h                 |<--| +----------------+ +---------------+ |
| ScriptClassRegistry      |链 | | PapiExport     | | PesapiXxxImpl | |
| PesapiRegister           |接 | | (导出 C 函数)  | | (实现 pesapi  | |
+--------------------------+   | +----------------+ |  _ffi 接口)   | |
                               | +---------------+ +---------------+ |
                               | | CppObjectMapper                 | |
                               | | (C#对象与脚本对象映射)         | |
                               | +---------------------------------+ |
                               | +---------------------------------+ |
                               | | BackendEnv (引擎生命周期, 可选) | |
                               | +---------------------------------+ |
                               +------------------+-------------------+
                                                  |
                                                  v
                         底层脚本引擎 (V8 / QuickJS / Lua / CPython ...)
```

**关键组件说明：**

| 组件 | 说明 |
|------|------|
| **PuertsCore** | 共享核心库，定义了 pesapi.h 抽象接口、ScriptClassRegistry 类注册系统等，被所有语言插件链接 |
| **PesapiXxxImpl** | 实现 pesapi_ffi 函数表中所有函数指针，将 pesapi 操作映射到具体脚本引擎 API |
| **CppObjectMapper** | 管理 C# 对象与脚本对象之间的映射关系，包括缓存、生命周期追踪、类型模板等。名称中的 "Cpp" 是历史原因（最初用于 C++ 支持），在 Unity 中逻辑上映射的是 C# 对象，但从 CppObjectMapper 视角看操作的确实是 C++ 指针（例如 il2cpp 下 C# 对象引用本身就是 C++ 指针） |
| **PapiExport** | 导出供 C# 层调用的 C 函数（如创建/销毁环境、获取 FFI 表等） |
| **BackendEnv** | （可选）管理脚本引擎运行时的初始化、模块加载等 |

## 3. 目录结构规范

每个语言插件应遵循以下目录布局：

`
unity/native/papi-{lang}/
 CMakeLists.txt                 # CMake 构建脚本
 include/                       # 插件头文件
    CppObjectMapper{Lang}.h    # C++ 对象映射器头文件
    ObjectCacheNode{Lang}.h    # 对象缓存节点
    PapiData.h                 # (可选) 内部数据结构定义
    BackendEnv.h               # (可选) 后端环境管理
 source/                        # 插件源文件
    Pesapi{Lang}Impl.cpp       # pesapi_ffi 接口实现（核心）
    CppObjectMapper{Lang}.cpp  # C++ 对象映射器实现
    PapiExport.cpp             # 导出的 C 函数
    BackendEnv.cpp             # (可选) 后端环境实现
 make_win64.bat                 # Windows 构建脚本
 make_linux64.sh                # Linux 构建脚本
 {engine-source}/               # (可选) 第三方脚本引擎源码
`

**命名约定：**
- 项目名：`Papi{Lang}`（如 PapiV8、PapiQuickjs、PapiLua、PapiPython）
- 命名空间：`pesapi::{lang}impl`（如 pesapi::luaimpl、pesapi::pythonimpl、pesapi::qjsimpl）
- V8 是特例，使用 v8impl 命名空间和 puerts / PUERTS_NAMESPACE 作为 CppObjectMapper 命名空间

## 4. 核心实现步骤

### 4.1 实现 pesapi_ffi 函数表（最核心）

这是插件的核心工作。你需要在 Pesapi{Lang}Impl.cpp 中实现 pesapi.h 中定义的所有函数签名，并将它们填入全局的 `pesapi_ffi g_pesapi_ffi` 结构体中。

#### 4.1.1 函数分类与详细 API 参考

pesapi_ffi 中约有 80+ 个函数指针，下面按类别逐一说明。对于用法类似的 API，选取一个典型做示范，其余注明为"类似"。

---

##### (1) 值创建函数

将 C/C++ 的原生值转换为脚本引擎中的脚本值 (`pesapi_value`)。

| API | 签名 | 说明 |
|-----|------|------|
| **create_null** | `pesapi_value (pesapi_env env)` | 创建脚本 null |
| **create_undefined** | `pesapi_value (pesapi_env env)` | 创建脚本 undefined（Lua/Python 中通常映射为 nil/None） |
| **create_boolean** | `pesapi_value (pesapi_env env, int value)` | 创建布尔值 |
| **create_int32** ★ | `pesapi_value (pesapi_env env, int32_t value)` | 创建 32 位有符号整数 |
| **create_uint32** | `pesapi_value (pesapi_env env, uint32_t value)` | 类似 create_int32，创建无符号整数 |
| **create_int64** | `pesapi_value (pesapi_env env, int64_t value)` | 类似 create_int32，创建 64 位有符号整数。注意 V8 中映射为 BigInt |
| **create_uint64** | `pesapi_value (pesapi_env env, uint64_t value)` | 类似 create_int64 |
| **create_double** | `pesapi_value (pesapi_env env, double value)` | 创建双精度浮点数。float 也使用此 API（先转为 double） |
| **create_string_utf8** ★ | `pesapi_value (pesapi_env env, const char* str, size_t length)` | 从 UTF-8 C 字符串创建脚本字符串 |
| **create_string_utf16** | `pesapi_value (pesapi_env env, const uint16_t* str, size_t length)` | 从 UTF-16 创建脚本字符串，适合直接桥接 C# 字符串 |
| **create_binary** | `pesapi_value (pesapi_env env, void* bin, size_t length)` | 创建二进制数据（如 ArrayBuffer），**引擎不拷贝数据，调用方负责生命周期** |
| **create_binary_by_value** | `pesapi_value (pesapi_env env, void* bin, size_t length)` | 创建二进制数据，**引擎拷贝一份数据**，适合传入的数据是临时的场景 |
| **create_array** | `pesapi_value (pesapi_env env)` | 创建空数组 |
| **create_object** | `pesapi_value (pesapi_env env)` | 创建空对象 |
| **create_function** | `pesapi_value (pesapi_env env, pesapi_callback impl, void* data, pesapi_function_finalize f)` | 创建脚本函数，包装一个原生回调 |
| **create_class** | `pesapi_value (pesapi_env env, const void* type_id)` | 根据 TypeId 创建脚本中的类构造器 |

**典型示例 — create_int32（数值型代表）：**

`cpp
// 创建各种数值类型的脚本值
auto env = apis->get_env_from_ref(env_ref);

// 创建 32 位整数
pesapi_value val_i32 = apis->create_int32(env, 42);

// create_uint32 用法类似，创建无符号整数
pesapi_value val_u32 = apis->create_uint32(env, 100u);

// create_int64 / create_uint64 类似，用于 64 位整数（V8 中映射为 BigInt）
pesapi_value val_i64 = apis->create_int64(env, 9999999999LL);

// float 和 double 统一使用 create_double（float 先转为 double）
float fval = 3.14f;
pesapi_value val_dbl = apis->create_double(env, (double)fval);

// 将创建的值注入到全局，供脚本使用
auto g = apis->global(env);
apis->set_property(env, g, "myInt", val_i32);
apis->set_property(env, g, "myFloat", val_dbl);
`

**典型示例 — create_string_utf8 / create_string_utf16（字符串型）：**

`cpp
auto env = apis->get_env_from_ref(env_ref);

// create_string_utf8: 从 UTF-8 C 字符串创建脚本字符串
pesapi_value str1 = apis->create_string_utf8(env, "hello", 5);

// create_string_utf16: 从 UTF-16 创建脚本字符串
// C# 字符串本身是 UTF-16 编码的，直接桥接可避免转码开销
char16_t u16str[] = u"Hello";
pesapi_value str2 = apis->create_string_utf16(env, (uint16_t*)u16str, 5);

auto g = apis->global(env);
apis->set_property(env, g, "greeting", str1);
`

**典型示例 — create_function（创建脚本函数包装原生回调）：**

`cpp
// 定义一个原生回调函数（pesapi_callback 签名）
static void MyAddFunc(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto p0 = apis->get_arg(info, 0);
    auto p1 = apis->get_arg(info, 1);
    int a = apis->get_value_int32(env, p0);
    int b = apis->get_value_int32(env, p1);
    apis->add_return(info, apis->create_int32(env, a + b));
}

// 当函数被脚本 GC 回收时的通知回调（可选）
static void MyFuncFinalizer(struct pesapi_ffi* apis, void* data, void* env_private) {
    // data 就是 create_function 时传入的 userdata
}

// 将回调包装为脚本函数并注入全局
auto env = apis->get_env_from_ref(env_ref);
auto func = apis->create_function(env, MyAddFunc, nullptr, MyFuncFinalizer);
auto g = apis->global(env);
apis->set_property(env, g, "nativeAdd", func);
// 脚本中即可调用：nativeAdd(1, 2) => 3
`

---

##### (2) 值读取函数

从脚本值读取出 C/C++ 原生值。与值创建函数一一对应。

| API | 签名 | 说明 |
|-----|------|------|
| **get_value_bool** | `int (pesapi_env env, pesapi_value value)` | 读取布尔值 |
| **get_value_int32** ★ | `int32_t (pesapi_env env, pesapi_value value)` | 读取 32 位有符号整数 |
| **get_value_uint32** | `uint32_t (pesapi_env env, pesapi_value value)` | 类似 get_value_int32 |
| **get_value_int64** | `int64_t (pesapi_env env, pesapi_value value)` | 类似 get_value_int32 |
| **get_value_uint64** | `uint64_t (pesapi_env env, pesapi_value value)` | 类似 get_value_int32 |
| **get_value_double** | `double (pesapi_env env, pesapi_value value)` | 读取浮点数 |
| **get_value_string_utf8** ★ | `const char* (pesapi_env env, pesapi_value value, char* buf, size_t* bufsize)` | 读取 UTF-8 字符串，支持两阶段调用 |
| **get_value_string_utf16** | `const uint16_t* (..., uint16_t* buf, size_t* bufsize)` | 类似 get_value_string_utf8，读取 UTF-16 |
| **get_value_binary** | `void* (pesapi_env env, pesapi_value value, size_t* bufsize)` | 读取二进制数据指针和长度 |
| **get_array_length** | `uint32_t (pesapi_env env, pesapi_value value)` | 获取数组长度 |

**典型示例 — get_value_int32 / get_value_uint32（数值型代表）：**

`cpp
auto env = apis->get_env_from_ref(env_ref);

// 执行脚本表达式获取返回值
auto code = "123 + 789";
auto ret = apis->eval(env, (const uint8_t*)code, strlen(code), "test");

// 读取整数值
int32_t intVal = apis->get_value_int32(env, ret);   // => 912

// get_value_uint32 / get_value_int64 / get_value_uint64 用法类似
// get_value_double 用于浮点数读取，float 场景需自行转换:
//   float fval = (float)apis->get_value_double(env, someVal);
`

**典型示例 — get_value_string_utf8（字符串两阶段读取）：**

`cpp
auto env = apis->get_env_from_ref(env_ref);

// 先设置一个字符串到全局
auto g = apis->global(env);
apis->set_property(env, g, "myStr", apis->create_string_utf8(env, "hello", 5));
auto strVal = apis->get_property(env, g, "myStr");

// 字符串读取支持两阶段调用：
// 第 1 步：buf=nullptr，获取所需缓冲区大小
size_t bufsize = 0;
const char* str = apis->get_value_string_utf8(env, strVal, nullptr, &bufsize);
// 第 2 步：分配缓冲区后再次调用获取数据
// 如果引擎内部可直接返回指针，第 1 步就返回非 null，可跳过第 2 步
if (!str) {
    char* buf = (char*)alloca(bufsize + 1);
    str = apis->get_value_string_utf8(env, strVal, buf, &bufsize);
}
// str => "hello", bufsize => 5
`

> **get_value_string_utf16 同理**，在需要桥接 C# 字符串时倾向于使用 utf16 版本以避免编码转换：
> `cpp
> char16_t u16str[] = u"Hello";
> auto val = apis->create_string_utf16(env, (uint16_t*)u16str, 5);
> size_t len = 0;
> apis->get_value_string_utf16(env, val, nullptr, &len);  // len => 5
> char16_t buf[6] = {0};
> apis->get_value_string_utf16(env, val, (uint16_t*)buf, &len);
> // buf => u"Hello"
> `

---

##### (3) 类型检查函数

在读取值之前需要先判断值的类型。通常与值读取函数配对使用。

| API | 签名 | 说明 |
|-----|------|------|
| **is_null** | `int (pesapi_env env, pesapi_value value)` | 是否为 null |
| **is_undefined** | `int (pesapi_env env, pesapi_value value)` | 是否为 undefined |
| **is_boolean** | `int (pesapi_env env, pesapi_value value)` | 是否为布尔 |
| **is_int32** | `int (pesapi_env env, pesapi_value value)` | 是否为 int32 |
| **is_uint32** | `int (pesapi_env env, pesapi_value value)` | 类似 is_int32 |
| **is_int64** / **is_uint64** | 同上 | 类似 is_int32 |
| **is_double** | `int (pesapi_env env, pesapi_value value)` | 是否为浮点数 |
| **is_string** | `int (pesapi_env env, pesapi_value value)` | 是否为字符串 |
| **is_object** | `int (pesapi_env env, pesapi_value value)` | 是否为对象 |
| **is_function** | `int (pesapi_env env, pesapi_value value)` | 是否为函数 |
| **is_binary** | `int (pesapi_env env, pesapi_value value)` | 是否为二进制数据 |
| **is_array** | `int (pesapi_env env, pesapi_value value)` | 是否为数组 |

**配合关系 — is_xxx + get_value_xxx（类型安全读取模式）：**

在回调函数中，通常需要先用 `is_xxx` 检查参数类型，再用 `get_value_xxx` 安全地读取值：

`cpp
// 一个能接受 int 或 string 参数的回调，根据实际类型做不同处理
static void FlexibleCallback(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto arg0 = apis->get_arg(info, 0);

    if (apis->is_int32(env, arg0)) {
        int val = apis->get_value_int32(env, arg0);
        apis->add_return(info, apis->create_int32(env, val * 2));
    } else if (apis->is_string(env, arg0)) {
        char buf[256];
        size_t len = sizeof(buf);
        const char* str = apis->get_value_string_utf8(env, arg0, buf, &len);
        apis->add_return(info, apis->create_string_utf8(env, str, len));
    } else {
        apis->throw_by_string(info, "expected int or string");
    }
}
`

**配合关系 — is_xxx 用于重载解析：**

当一个方法存在多个重载时，需要根据脚本参数的实际类型选择匹配的重载：

`cpp
// 检查参数是否匹配 "Add(int, int)" 重载
static bool MatchOverload_Add_IntInt(struct pesapi_ffi* apis, pesapi_env env, pesapi_callback_info info) {
    if (apis->get_args_len(info) != 2) return false;
    auto arg0 = apis->get_arg(info, 0);
    auto arg1 = apis->get_arg(info, 1);
    return apis->is_int32(env, arg0) && apis->is_int32(env, arg1);
}

// 检查参数是否匹配 "Add(string, string)" 重载
static bool MatchOverload_Add_StrStr(struct pesapi_ffi* apis, pesapi_env env, pesapi_callback_info info) {
    if (apis->get_args_len(info) != 2) return false;
    auto arg0 = apis->get_arg(info, 0);
    auto arg1 = apis->get_arg(info, 1);
    // string 参数也接受 null/undefined
    return (apis->is_string(env, arg0) || apis->is_null(env, arg0))
        && (apis->is_string(env, arg1) || apis->is_null(env, arg1));
}
`

**配合关系 — is_xxx 用于动态类型推断：**

当目标类型不确定时（如 System.Object），根据脚本值的实际类型来推断原生类型：

`cpp
// 在回调中根据参数的实际类型分发处理
static void HandleDynamicArg(struct pesapi_ffi* apis, pesapi_env env, pesapi_value val) {
    if (apis->is_string(env, val))       { /* handle as string */ }
    else if (apis->is_double(env, val))  { /* handle as double */ }
    else if (apis->is_int32(env, val))   { /* handle as int32  */ }
    else if (apis->is_boolean(env, val)) { /* handle as bool   */ }
    else if (apis->is_null(env, val) || apis->is_undefined(env, val)) { /* handle null */ }
    else { /* handle as object */ }
}
`

---

##### (4) 原生对象桥接函数

这是实现 C# 对象与脚本对象互操作的核心 API 组。

| API | 签名 | 说明 |
|-----|------|------|
| **native_object_to_value** ★ | `pesapi_value (pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)` | 将原生对象（C# 对象指针）包装为脚本对象 |
| **get_native_object_ptr** ★ | `void* (pesapi_env env, pesapi_value value)` | 从脚本对象中取出原生对象指针 |
| **get_native_object_typeid** | `const void* (pesapi_env env, pesapi_value value)` | 获取脚本对象关联的 TypeId |
| **is_instance_of** | `int (pesapi_env env, const void* type_id, pesapi_value value)` | 检查脚本对象是否为某 TypeId 的实例 |

**配合关系 — native_object_to_value + get_native_object_ptr + get_native_object_typeid（对象双向桥接）：**

这三个 API 构成了原生对象与脚本对象互操作的核心链路。以下示例展示一个 `GetSelf()` 方法如何返回自身对象并在脚本中验证同一性：

`cpp
int g_type_id = 0;  // 用作 TypeId 的全局变量地址

struct MyObject {
    int value;
    MyObject(int v) : value(v) {}
};

// ===== 原生 -> 脚本方向 =====
// GetSelf: 将 this 指针包装为脚本对象返回
static void GetSelfWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* self = (MyObject*)apis->get_native_holder_ptr(info);
    // call_finalize=false: 生命周期由外部管理，脚本 GC 时不会 delete
    apis->add_return(info, apis->native_object_to_value(env, &g_type_id, self, false));
}

// ===== 脚本 -> 原生方向 =====
// ProcessObject: 从脚本传入的对象中取出原生指针
static void ProcessObjectWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto arg0 = apis->get_arg(info, 0);

    // 获取原生指针
    auto* obj = (MyObject*)apis->get_native_object_ptr(env, arg0);
    // 获取 TypeId 可用于类型安全检查
    auto* typeId = apis->get_native_object_typeid(env, arg0);
    if (typeId == &g_type_id) {
        apis->add_return(info, apis->create_int32(env, obj->value));
    }
}

// 对于值类型（需要拷贝数据的场景）：
// call_finalize=true 表示脚本 GC 时会调用 Finalize 释放内存
static void CreateValueCopy(struct pesapi_ffi* apis, pesapi_env env) {
    MyObject* copy = new MyObject(42);
    apis->native_object_to_value(env, &g_type_id, copy, true);
}
`

---

##### (5) Boxing / Unboxing 函数

用于在脚本中模拟 C# 的装箱/拆箱语义，常用于 `ref` / `out` 参数传递。

| API | 签名 | 说明 |
|-----|------|------|
| **boxing** | `pesapi_value (pesapi_env env, pesapi_value value)` | 将值包装到一个可变容器中（类似 C# 装箱） |
| **unboxing** | `pesapi_value (pesapi_env env, pesapi_value value)` | 从容器中取出原始值 |
| **update_boxed_value** | `void (pesapi_env env, pesapi_value boxed, pesapi_value value)` | 更新容器中的值 |
| **is_boxed_value** | `int (pesapi_env env, pesapi_value value)` | 检查是否为 boxed 值 |

**配合关系 — boxing + unboxing + update_boxed_value（ref/out 参数传递）：**

C# 的 `ref` 和 `out` 参数需要一个可变容器来传递修改后的值。完整流程：调用前用 boxing 包装，函数内通过 unboxing 获取当前值，执行完后通过 update_boxed_value 回写。以下以一个 `Inc(ref int x)` 方法为例：

`cpp
struct MyObj {
    int a;
    void Inc(int& x) { x += a; }  // ref 参数：将 a 加到 x 上
};

// Inc 方法的回调包装
static void IncWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* self = (MyObj*)apis->get_native_holder_ptr(info);
    auto p0 = apis->get_arg(info, 0);  // p0 是一个 boxed 值

    // 1. unboxing: 从容器中取出当前值
    auto unboxed = apis->unboxing(env, p0);
    int x = apis->get_value_int32(env, unboxed);

    // 2. 执行实际的 C++ 方法
    self->Inc(x);  // x 被修改了

    // 3. update_boxed_value: 将修改后的值回写到容器
    apis->update_boxed_value(env, p0, apis->create_int32(env, x));
}

// 脚本侧调用示例（Python 风格）：
//   obj = MyObj(2)
//   obj.Inc([3])    # 传入 boxed 值 [3]
//   # 调用后 boxed 值变为 [5]，因为 3 + 2 = 5
`

---

##### (6) 回调信息（callback_info）函数

脚本调用原生函数时，回调函数通过 `pesapi_callback_info` 获取调用参数、设置返回值。

| API | 签名 | 说明 |
|-----|------|------|
| **get_args_len** | `int (pesapi_callback_info info)` | 获取参数个数 |
| **get_arg** | `pesapi_value (pesapi_callback_info info, int index)` | 获取第 index 个参数 |
| **get_env** | `pesapi_env (pesapi_callback_info info)` | 从回调信息中获取当前环境 |
| **get_native_holder_ptr** | `void* (pesapi_callback_info info)` | 获取 this 对象的原生指针（实例方法场景） |
| **get_native_holder_typeid** | `const void* (pesapi_callback_info info)` | 获取 this 对象的 TypeId |
| **get_userdata** | `void* (pesapi_callback_info info)` | 获取创建回调时绑定的用户数据 |
| **add_return** | `void (pesapi_callback_info info, pesapi_value value)` | 设置返回值 |
| **throw_by_string** | `void (pesapi_callback_info info, const char* msg)` | 向脚本抛出异常 |

**配合关系 — 完整的回调函数实现模式：**

以下展示一个完整的类注册和回调实现模式，包含构造函数、实例方法、静态方法和属性：

`cpp
struct TestStruct {
    int a;
    TestStruct(int a) : a(a) {}
    ~TestStruct() {}
    int Calc(int x, int y) { return a + x + y; }
    static int Add(int x, int y) { return x + y; }
};

int g_type_id = 0;

// 构造函数回调 (pesapi_constructor 签名: 返回 void*)
static void* TestStructCtor(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto p0 = apis->get_arg(info, 0);
    int a = apis->get_value_int32(env, p0);
    return new TestStruct(a);  // 返回值即为脚本对象关联的原生指针
}

// 析构回调：脚本对象被 GC 时调用
static void TestStructFinalize(struct pesapi_ffi* apis, void* ptr, void* class_data, void* env_private) {
    delete (TestStruct*)ptr;
}

// 实例方法回调: obj.Calc(x, y)
static void CalcWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* self = (TestStruct*)apis->get_native_holder_ptr(info);  // 获取 this
    int x = apis->get_value_int32(env, apis->get_arg(info, 0));
    int y = apis->get_value_int32(env, apis->get_arg(info, 1));
    apis->add_return(info, apis->create_int32(env, self->Calc(x, y)));
}

// 静态方法回调: TestStruct.Add(x, y)
static void AddWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    int x = apis->get_value_int32(env, apis->get_arg(info, 0));
    int y = apis->get_value_int32(env, apis->get_arg(info, 1));
    apis->add_return(info, apis->create_int32(env, TestStruct::Add(x, y)));
}

// 属性 getter: obj.a
static void AGetterWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* self = (TestStruct*)apis->get_native_holder_ptr(info);
    apis->add_return(info, apis->create_int32(env, self->a));
}

// 属性 setter: obj.a = value
static void ASetterWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* self = (TestStruct*)apis->get_native_holder_ptr(info);
    self->a = apis->get_value_int32(env, apis->get_arg(info, 0));
}
`

> **要点**：`pesapi_callback` 的签名是 `void(struct pesapi_ffi* apis, pesapi_callback_info info)`，而 `pesapi_constructor` 的签名是 `void*(struct pesapi_ffi* apis, pesapi_callback_info info)`。构造函数返回的指针将成为脚本对象关联的原生指针。

---

##### (7) 环境引用（env_ref）与作用域（scope）函数

这组 API 用于在回调上下文之外（如从 C# 主动调用脚本）安全地操作脚本环境。

| API | 签名 | 说明 |
|-----|------|------|
| **create_env_ref** | `pesapi_env_ref (pesapi_env env)` | 从 env 创建持久引用 |
| **env_ref_is_valid** | `int (pesapi_env_ref ref)` | 检查引用是否仍有效 |
| **get_env_from_ref** | `pesapi_env (pesapi_env_ref ref)` | 从引用获取 env（必须在 scope 内） |
| **duplicate_env_ref** | `pesapi_env_ref (pesapi_env_ref ref)` | 拷贝一份 env_ref |
| **release_env_ref** | `void (pesapi_env_ref ref)` | 释放 env_ref |
| **open_scope** | `pesapi_scope (pesapi_env_ref ref)` | 打开作用域（堆分配） |
| **open_scope_placement** | `pesapi_scope (pesapi_env_ref ref, pesapi_scope_memory* mem)` | 打开作用域（栈分配，更高效） |
| **has_caught** | `int (pesapi_scope scope)` | 是否捕获到脚本异常 |
| **get_exception_as_string** | `const char* (pesapi_scope scope, int with_stack)` | 获取异常信息字符串 |
| **close_scope** | `void (pesapi_scope scope)` | 关闭堆分配的作用域 |
| **close_scope_placement** | `void (pesapi_scope scope)` | 关闭栈分配的作用域 |

**配合关系 — env_ref + open_scope + close_scope（在回调外部操作脚本环境的标准模式）：**

`cpp
// 简单方式：使用 open_scope / close_scope（堆分配）
{
    pesapi_scope scope = apis->open_scope(env_ref);        // 打开 scope
    auto env = apis->get_env_from_ref(env_ref);            // scope 内获取 env

    // 在 scope 内执行脚本代码
    auto code = "123 + 456";
    auto ret = apis->eval(env, (const uint8_t*)code, strlen(code), "test");

    // 检查是否有异常
    if (apis->has_caught(scope)) {
        auto msg = apis->get_exception_as_string(scope, true);  // true=含调用栈
        printf("Error: %s\n", msg);
    } else {
        int val = apis->get_value_int32(env, ret);  // => 579
    }

    apis->close_scope(scope);                              // 关闭 scope
}

// 高效方式：使用 open_scope_placement / close_scope_placement（栈分配，推荐）
{
    pesapi_scope_memory mem;
    pesapi_scope scope = apis->open_scope_placement(env_ref, &mem);
    auto env = apis->get_env_from_ref(env_ref);

    auto g = apis->global(env);
    apis->set_property(env, g, "myVar", apis->create_int32(env, 42));

    apis->close_scope_placement(scope);
}

// RAII 封装（推荐在实际项目中使用）
class AutoValueScope {
public:
    AutoValueScope(struct pesapi_ffi* apis, pesapi_env_ref envRef)
        : _apis(apis) {
        _scope = apis->open_scope_placement(envRef, &_mem);
    }
    ~AutoValueScope() {
        if (_scope) _apis->close_scope_placement(_scope);
    }
    pesapi_scope scope() { return _scope; }
private:
    struct pesapi_ffi* _apis;
    pesapi_scope_memory _mem;
    pesapi_scope _scope;
};
`

---

##### (8) 值引用（value_ref）函数

用于持久化引用脚本值（跨 scope 生存），常用于 C# 持有脚本对象引用。

| API | 签名 | 说明 |
|-----|------|------|
| **create_value_ref** | `pesapi_value_ref (pesapi_env env, pesapi_value value, uint32_t internal_field_count)` | 创建持久引用，可附带内部字段 |
| **duplicate_value_ref** | `pesapi_value_ref (pesapi_value_ref ref)` | 拷贝一份引用 |
| **release_value_ref** | `void (pesapi_value_ref ref)` | 释放引用 |
| **get_value_from_ref** | `pesapi_value (pesapi_env env, pesapi_value_ref ref)` | 从引用获取当前值 |
| **set_ref_weak** | `void (pesapi_env env, pesapi_value_ref ref)` | 将引用设为弱引用 |
| **set_owner** | `int (pesapi_env env, pesapi_value value, pesapi_value owner)` | 设置所有者关系（可选API） |
| **get_ref_associated_env** | `pesapi_env_ref (pesapi_value_ref ref)` | 获取引用关联的环境 |
| **get_ref_internal_fields** | `void** (pesapi_value_ref ref, uint32_t* count)` | 获取内部字段指针 |

**配合关系 — value_ref + get/set_private（持久化持有脚本对象的完整模式）：**

`cpp
// 场景：在 C++ 侧长期持有一个脚本函数引用，后续随时调用

pesapi_value_ref funcRef = nullptr;

// === 创建引用：在 scope 内将脚本值持久化 ===
{
    pesapi_scope scope = apis->open_scope(env_ref);
    auto env = apis->get_env_from_ref(env_ref);

    // 获取脚本函数
    auto code = "(lambda x, y: x + y)";
    auto func = apis->eval(env, (const uint8_t*)code, strlen(code), "test");

    // 创建持久引用（跨 scope 生存）
    funcRef = apis->create_value_ref(env, func, 0);  // 0 = 不需要 internal fields

    apis->close_scope(scope);
    // scope 关闭后，func 本身失效，但 funcRef 仍然有效
}

// === 使用引用：在另一个 scope 中从 ref 取出值并调用 ===
{
    pesapi_scope scope = apis->open_scope(env_ref);
    auto env = apis->get_env_from_ref(env_ref);

    // 从 ref 恢复值
    auto func = apis->get_value_from_ref(env, funcRef);
    pesapi_value argv[2] = { apis->create_int32(env, 10), apis->create_int32(env, 20) };
    auto ret = apis->call_function(env, func, nullptr, 2, argv);
    // ret => 30

    apis->close_scope(scope);
}

// === 释放引用 ===
apis->release_value_ref(funcRef);

// --- get/set_private 配合 value_ref：在脚本对象上关联自定义数据 ---
{
    pesapi_scope scope = apis->open_scope(env_ref);
    auto env = apis->get_env_from_ref(env_ref);
    auto obj = apis->create_object(env);

    int myData = 42;
    apis->set_private(env, obj, &myData);       // 在脚本对象上存储私有数据

    void* out = nullptr;
    apis->get_private(env, obj, &out);           // 取回私有数据
    // out == &myData

    apis->close_scope(scope);
}
`

---

##### (9) 属性操作函数

| API | 签名 | 说明 |
|-----|------|------|
| **get_property** | `pesapi_value (pesapi_env env, pesapi_value object, const char* key)` | 读取对象的字符串键属性 |
| **set_property** | `int (pesapi_env env, pesapi_value object, const char* key, pesapi_value value)` | 设置对象的字符串键属性 |
| **get_private** | `int (pesapi_env env, pesapi_value object, void** out_ptr)` | 读取对象的私有数据 |
| **set_private** | `int (pesapi_env env, pesapi_value object, void* ptr)` | 设置对象的私有数据 |
| **get_property_uint32** | `pesapi_value (pesapi_env env, pesapi_value object, uint32_t key)` | 读取数组元素 |
| **set_property_uint32** | `int (pesapi_env env, pesapi_value object, uint32_t key, pesapi_value value)` | 设置数组元素 |

**典型示例 — set_property + global + get_property（属性读写）：**

`cpp
auto env = apis->get_env_from_ref(env_ref);
auto g = apis->global(env);

// 设置字符串属性
apis->set_property(env, g, "greeting", apis->create_string_utf8(env, "hello", 5));

// 读取字符串属性
auto val = apis->get_property(env, g, "greeting");
char buf[64];
size_t len = sizeof(buf);
const char* str = apis->get_value_string_utf8(env, val, buf, &len);
// str => "hello"

// set_property_uint32 / get_property_uint32 用于数组元素访问
auto arr = apis->create_array(env);
apis->set_property_uint32(env, arr, 0, apis->create_int32(env, 10));
apis->set_property_uint32(env, arr, 1, apis->create_int32(env, 20));
auto elem = apis->get_property_uint32(env, arr, 0);
int v = apis->get_value_int32(env, elem);  // => 10
`

**配合关系 — get/set_private（在脚本对象上存取私有数据）：**

`cpp
auto env = apis->get_env_from_ref(env_ref);
auto obj = apis->create_object(env);

// set_private / get_private: 在脚本对象上关联一个 C++ 指针
int myData = 42;
apis->set_private(env, obj, &myData);

void* ptr = nullptr;
apis->get_private(env, obj, &ptr);
// ptr == &myData
`

---

##### (10) 执行与全局函数

| API | 签名 | 说明 |
|-----|------|------|
| **call_function** | `pesapi_value (pesapi_env env, pesapi_value func, pesapi_value this_object, int argc, const pesapi_value argv[])` | 调用脚本函数 |
| **eval** | `pesapi_value (pesapi_env env, const uint8_t* code, size_t code_size, const char* path)` | 执行脚本代码 |
| **global** | `pesapi_value (pesapi_env env)` | 获取全局对象 |
| **get_env_private** | `const void* (pesapi_env env)` | 获取环境私有数据 |
| **set_env_private** | `void (pesapi_env env, const void* ptr)` | 设置环境私有数据 |
| **set_registry** | `void (pesapi_env env, pesapi_registry registry)` | 设置类型注册表 |

**配合关系 — eval + has_caught + get_exception_as_string（执行脚本并处理异常的完整模式）：**

`cpp
pesapi_scope scope = apis->open_scope(env_ref);
auto env = apis->get_env_from_ref(env_ref);

// 正常执行
auto code1 = "123 + 789";
auto ret = apis->eval(env, (const uint8_t*)code1, strlen(code1), "test");
if (!apis->has_caught(scope)) {
    int val = apis->get_value_int32(env, ret);  // => 912
}

// 异常处理
auto code2 = "raise Exception('something went wrong')";
apis->eval(env, (const uint8_t*)code2, strlen(code2), "test_err");
if (apis->has_caught(scope)) {
    // with_stack=false: 仅异常消息
    auto msg = apis->get_exception_as_string(scope, false);
    // msg => "something went wrong"

    // with_stack=true: 含完整调用栈
    auto detail = apis->get_exception_as_string(scope, true);
    // detail => "Traceback ...\nException: something went wrong\n"
}

apis->close_scope(scope);
`

**配合关系 — set_env_private + get_env_private（环境私有数据）：**

`cpp
auto env = apis->get_env_from_ref(env_ref);

// 在初始化时将自定义数据关联到 env
struct MyEnvData { int refCount; void* objectPool; };
MyEnvData* data = new MyEnvData{0, nullptr};
apis->set_env_private(env, data);

// 后续在任何能获取 env 的地方都可以取出（包括回调函数内部）
static void SomeCallback(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* data = (MyEnvData*)apis->get_env_private(env);
    data->refCount++;
}
`

#### 4.1.2 初始化 g_pesapi_ffi

在实现所有函数后，在 Pesapi{Lang}Impl.cpp 末尾定义全局 FFI 表：

`cpp
namespace pesapi
{
namespace yourimpl
{
pesapi_ffi g_pesapi_ffi {
    &pesapi_create_null,
    &pesapi_create_undefined,
    &pesapi_create_boolean,
    // ... 按 pesapi_ffi 结构体字段顺序依次填入所有函数指针
};
}
}
`

> **重要：** 函数指针必须严格按照 pesapi.h 中 struct pesapi_ffi 字段的声明顺序填入。

#### 4.1.3 各语言的类型映射策略

| 概念 | V8 | QuickJS | Lua | Python |
|------|-----|---------|-----|--------|
| pesapi_env | v8::Context* | JSContext* | lua_State* | CppObjectMapper* |
| pesapi_value | v8::Value* | JSValue* | int (栈索引) | PyObject* |
| 作用域管理 | v8::HandleScope | 自定义值分配器 | lua stack top | 自定义引用计数 scope |

### 4.2 实现 CppObjectMapper

CppObjectMapper 负责将 C# 对象映射为脚本语言中的对象。每个插件都需实现自己的版本。

> **关于命名：** "CppObjectMapper" 中的 "Cpp" 是历史原因——PuerTs 最初是为 C++ 设计的。在 Unity 中，它逻辑上映射的是 C# 对象与脚本对象之间的关系。之所以从实现层面仍以 C++ 指针来操作，是因为在 il2cpp 等运行时下，C# 对象的引用本身就是 C++ 指针。

#### 核心职责：

1. **Initialize / UnInitialize（或 Cleanup）**  初始化和清理对象映射器
2. **FindOrAddCppObject**  根据 TypeId 和指针，在脚本中查找或创建对应的脚本对象（逻辑上是 C# 对象，但以 C++ 指针形式传入）
3. **BindCppObject / UnBindCppObject**  将 C# 对象（以 C++ 指针表示）绑定到/解绑自脚本对象
4. **GetPrivateData / SetPrivateData**  在脚本对象上存取私有数据指针
5. **LoadTypeById**  根据 TypeId 加载类的脚本表示
6. **CreateFunction**  创建脚本函数包装原生回调
7. **生命周期追踪**  通过 `GetEnvLifeCycleTracker()` 返回的 weak_ptr 来追踪环境是否仍然存活

#### 关键数据结构：

```cpp
// 对象缓存：C# 对象指针（以 C++ 指针形式表示）-> 脚本对象的映射
eastl::unordered_map<void*, FObjectCacheNode, ...> CDataCache;

// 类型映射：TypeId -> 脚本中的类模板/元表/类型对象
eastl::unordered_map<const void*, ScriptType, ...> TypeIdToXxxMap;

// 生命周期追踪
eastl::shared_ptr<int> ref;
```

#### 各语言实现差异：

- **V8**：使用 v8::FunctionTemplate 和 v8::ObjectTemplate 来定义类
- **QuickJS**：使用 JSClassDef 和 JS_NewClassID 注册自定义类
- **Lua**：使用 metatable 和 userdata 来模拟类
- **Python**：使用 PyType_Spec 和 PyType_FromSpec 动态创建 Python 类型

### 4.3 实现 PapiExport.cpp（导出 C 函数）

每个插件需要导出一组标准的 C 函数供 C# 层调用。函数命名规则为 `Get{Lang}PapiVersion`、`Get{Lang}FFIApi`、`Create{Lang}PapiEnvRef`、`Destroy{Lang}PapiEnvRef`。

以下是各插件导出函数对照：

| 函数 | V8 | QuickJS | Lua | Python |
|------|-----|---------|-----|--------|
| 获取版本 | GetV8PapiVersion | GetQjsPapiVersion | GetLuaPapiVersion | GetPythonPapiVersion |
| 获取FFI表 | GetV8FFIApi | GetQjsFFIApi | GetLuaFFIApi | GetPythonFFIApi |
| 创建环境 | CreateV8PapiEnvRef | CreateQjsPapiEnvRef | CreateLuaPapiEnvRef | CreatePythonPapiEnvRef |
| 销毁环境 | DestroyV8PapiEnvRef | DestroyQjsPapiEnvRef | DestroyLuaPapiEnvRef | DestroyPythonPapiEnvRef |
| 额外功能 | Inspector/GC/Tick | RunGC | - | RunGC/InitPythonByHome |

各插件可根据需要导出额外函数（如 V8 的 CreateInspector、LowMemoryNotification，Python 的 InitPythonByHome 等）。

### 4.4 定义内部数据结构

每个插件需要定义以下关键内部数据结构：

#### pesapi_env_ref__

用于持久化引用脚本环境（跨 scope 生存），包含引用计数和环境生命周期追踪。

#### pesapi_value_ref__

用于持久化引用脚本值（通常继承自 pesapi_env_ref__），包含持久化的值句柄和可选的内部字段。

#### pesapi_scope__

作用域管理，是各语言差异最大的部分：
- **V8**：封装 v8::HandleScope + v8::TryCatch
- **QuickJS**：管理分配的 JSValue 数组，scope 结束时释放
- **Lua**：记录栈顶位置，scope 结束时恢复
- **Python**：管理引用计数，切换线程状态（PyThreadState_Swap）

**重要约束：** `sizeof(pesapi_scope__) <= sizeof(pesapi_scope_memory)`，因为 scope 可能通过 placement new 分配在调用方的栈上。

#### pesapi_callback_info__

传递给回调函数的参数封装，包括 self 对象、参数列表、返回值槽和异常信息。

## 5. CMake 构建配置

### 5.1 关键要点

1. **必须链接 PuertsCore**  通过 `add_subdirectory(../puerts ...)` 引入并 `target_link_libraries` 链接
2. **禁用异常和 RTTI**  保持与 PuertsCore 以及各引擎后端的 ABI 兼容
3. **平台特殊处理**：
   - iOS / WebAssembly / Switch：生成静态库
   - 其他平台：生成动态库（.dll / .so / .dylib）
4. **外部引擎依赖**：
   - 内嵌源码（QuickJS、Lua）：直接编译引擎源码
   - 预编译库（V8）：通过 BACKEND_LIB_NAMES 和 BACKEND_INC_NAMES 指定
   - 系统库（Python）：使用 find_package(Python3) 或手动指定路径

### 5.2 构建脚本

可以通过 PuerTs 的 CLI 工具进行统一构建：

`ash
node ../../cli make --platform {platform} --arch {arch}
`

或编写平台构建脚本（如 make_win64.bat、make_linux64.sh）。

## 6. 各语言插件实现对比

| 特性 | V8 | QuickJS | Lua | Python |
|------|-----|---------|-----|--------|
| 引擎源码方式 | 预编译库 | 内嵌源码 | 内嵌源码 | 系统安装/预编译 |
| pesapi_env | v8::Context* | JSContext* | lua_State* | CppObjectMapper* |
| pesapi_value | v8::Value* | JSValue* | int (栈索引) | PyObject* |
| 值管理方式 | v8 Handle 系统 | 手动分配+scope释放 | Lua 栈 | Python 引用计数 |
| 类型系统 | FunctionTemplate | JSClassDef | Metatable | PyType_Spec |
| GC 机制 | V8 自带 | JS_RunGC | Lua GC | Python GC |
| 线程安全 | Locker/IsolateScope | 无 | 无 | PyThreadState_Swap |
| C++ 标准 | C++14/17/20 | C++14 | C++14 | C++20 |
| 导出库名 | PapiV8 | PapiQuickjs | PapiLua | PapiPython |

## 7. 实现要点与注意事项

### 7.1 pesapi_env 的选择

选择什么作为 pesapi_env 是设计的第一个关键决策：
- 必须能从 pesapi_env 高效获取到脚本引擎上下文和 CppObjectMapper
- V8 / QuickJS / Lua 选择引擎上下文指针，然后通过引擎提供的 "extra data" 机制获取 mapper
- Python 直接使用 CppObjectMapper 指针，因为 Python 没有类似的 "extra data" 机制

### 7.2 作用域管理

每个语言插件都必须实现 scope 机制来管理临时脚本值的生命周期。open_scope_placement / close_scope_placement 使用调用者提供的栈内存来放置 scope 对象（避免堆分配），因此 pesapi_scope__ 的大小不能超过 pesapi_scope_memory。

### 7.3 异常处理

- scope 中需要捕获脚本异常
- 通过 pesapi_has_caught(scope) 判断是否有异常
- 通过 pesapi_get_exception_as_string(scope, with_stack) 获取异常信息
- 回调函数中通过 pesapi_throw_by_string(info, msg) 抛出异常

### 7.4 内存管理与依赖控制

- **核心原则：尽量不要引入额外的运行时依赖。** 具体策略取决于底层引擎本身的依赖情况：
  - **V8 插件**：V8 本身依赖 libc++，因此直接使用 STL 即可，无需额外考虑
  - **Lua / QuickJS 等纯 C 引擎插件**：底层引擎是纯 C 实现的，如果插件也能用纯 C 实现最好；其次可以用 EASTL（配合禁用异常和 RTTI），避免动态库依赖 libc++。当然，如果你确实想用 STL 也不是不行，只是会引入额外的运行时依赖
- 避免在 pesapi 实现中使用 C++ 异常（尤其是纯 C 引擎的插件）
- 注意各引擎的 GC 机制，确保被 C++ 持有的脚本对象不会被 GC 回收

### 7.5 符号导出

- 使用 PESAPI_MODULE_EXPORT 宏导出 C 函数
- V8 插件额外使用版本脚本（Linux/Android）或导出符号列表（macOS）来控制可见符号

## 8. 开发清单 (Checklist)

在开发一个新的语言插件时，请确保完成以下所有步骤：

- [ ] 在 unity/native/papi-{lang}/ 下创建目录结构
- [ ] 实现 Pesapi{Lang}Impl.cpp，覆盖 pesapi_ffi 中所有 ~80 个函数
- [ ] 定义 pesapi_env_ref__、pesapi_value_ref__、pesapi_scope__、pesapi_callback_info__ 结构体
- [ ] 初始化全局 g_pesapi_ffi 变量
- [ ] 实现 CppObjectMapper{Lang}，包括对象缓存、类型注册、生命周期管理
- [ ] 实现 PapiExport.cpp，导出 Get{Lang}PapiVersion、Get{Lang}FFIApi、Create{Lang}PapiEnvRef、Destroy{Lang}PapiEnvRef
- [ ] 编写 CMakeLists.txt，链接 PuertsCore
- [ ] 编写平台构建脚本
- [ ] 验证所有平台（Windows、Linux、macOS、Android、iOS 等）的构建
- [ ] 编写单元测试验证基本功能

## 9. 参考资料

- `unity/native/puerts/include/pesapi.h`  P-API 核心头文件，是所有插件必须实现的接口定义
- `unity/native/puerts/`  PuertsCore 共享核心库
- `unity/native/papi-v8/`  V8 语言插件参考实现（功能最完整）
- `unity/native/papi-quickjs/`  QuickJS 语言插件参考实现
- `unity/native/papi-lua/`  Lua 语言插件参考实现
- `unity/native/papi-python/`  Python 语言插件参考实现
