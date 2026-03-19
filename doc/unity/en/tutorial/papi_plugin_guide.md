# PuerTs Language Plugin (P-API Plugin) Development Guide

## 1. Overview

The core design philosophy of PuerTs is to wrap the embedding APIs of various scripting languages into a unified scripting engine abstraction interface -- **P-API** (Portable Embedded Scripting API, i.e., `pesapi`). Through this abstraction layer, PuerTs can transparently support multiple scripting languages (such as JavaScript/V8, JavaScript/QuickJS, Lua, Python, etc.) in Unity, while the upper-layer C# code does not need to care about which specific scripting engine is used underneath.

This guide is based on the implementation of four official language plugins (papi-v8, papi-quickjs, papi-lua, papi-python), and summarizes a complete guide for writing new language plugins.

## 2. Overall Architecture

```
+--------------------------------------------------+
|                 C# Layer (Unity)                  |
|          ScriptEnv / BackendXxx                   |
+-----+--------------------------------------------+
      |                                       |
      | P/Invoke (DllImport)                  | P/Invoke (DllImport)
      | (class registration,                  | (load plugin, create/
      |  object bridging, etc.)               |  destroy env, etc.)
      v                                       v
+--------------------------+   +--------------------------------------+
| PuertsCore (Shared Lib)  |   |    Language Plugin (e.g. PapiV8.dll) |
| pesapi.h                 |<--| +----------------+ +---------------+ |
| ScriptClassRegistry      |Lin| | PapiExport     | | PesapiXxxImpl | |
| PesapiRegister           |ked| | (Export C funcs)| | (Implement    | |
+--------------------------+   | +----------------+ |  pesapi_ffi)  | |
                               | +---------------+ +---------------+ |
                               | | CppObjectMapper                 | |
                               | | (C# obj <-> script obj mapping) | |
                               | +---------------------------------+ |
                               | +---------------------------------+ |
                               | | BackendEnv (Engine lifecycle,   | |
                               | |              optional)          | |
                               | +---------------------------------+ |
                               +------------------+-------------------+
                                                  |
                                                  v
          Underlying Script Engine (V8 / QuickJS / Lua / CPython ...)
```

**Key Component Description:**

| Component | Description |
|-----------|-------------|
| **PuertsCore** | Shared core library defining the pesapi.h abstract interface, ScriptClassRegistry class registration system, etc., linked by all language plugins |
| **PesapiXxxImpl** | Implements all function pointers in the pesapi_ffi function table, mapping pesapi operations to specific script engine APIs |
| **CppObjectMapper** | Manages the mapping between C# objects and script objects, including caching, lifecycle tracking, type templates, etc. The "Cpp" in the name is historical (originally designed for C++ support). In Unity, it logically maps C# objects, but operates on C++ pointers at the implementation level (e.g., in il2cpp, C# object references are themselves C++ pointers) |
| **PapiExport** | Exports C functions for the C# layer to call (e.g., create/destroy environment, get FFI table, etc.) |
| **BackendEnv** | (Optional) Manages script engine runtime initialization, module loading, etc. |

## 3. Directory Structure Convention

Each language plugin should follow this directory layout:

`
unity/native/papi-{lang}/
+-- CMakeLists.txt                 # CMake build script
+-- include/                       # Plugin headers
|   +-- CppObjectMapper{Lang}.h    # C++ object mapper header
|   +-- ObjectCacheNode{Lang}.h    # Object cache node
|   +-- PapiData.h                 # (Optional) Internal data structures
|   +-- BackendEnv.h               # (Optional) Backend environment management
+-- source/                        # Plugin sources
|   +-- Pesapi{Lang}Impl.cpp       # pesapi_ffi interface implementation (core)
|   +-- CppObjectMapper{Lang}.cpp  # C++ object mapper implementation
|   +-- PapiExport.cpp             # Exported C functions
|   +-- BackendEnv.cpp             # (Optional) Backend environment implementation
+-- make_win64.bat                 # Windows build script
+-- make_linux64.sh                # Linux build script
+-- {engine-source}/               # (Optional) Third-party engine source
`

**Naming Conventions:**
- Project name: `Papi{Lang}` (e.g., PapiV8, PapiQuickjs, PapiLua, PapiPython)
- Namespace: `pesapi::{lang}impl` (e.g., pesapi::luaimpl, pesapi::pythonimpl, pesapi::qjsimpl)
- V8 is an exception, using v8impl namespace and puerts / PUERTS_NAMESPACE for CppObjectMapper namespace

## 4. Core Implementation Steps

### 4.1 Implement the pesapi_ffi Function Table (Core Task)

This is the core work of the plugin. You need to implement all function signatures defined in pesapi.h in `Pesapi{Lang}Impl.cpp`, and fill them into the global `pesapi_ffi g_pesapi_ffi` struct.

#### 4.1.1 Function Categories & Detailed API Reference

The pesapi_ffi contains approximately 80+ function pointers. Below is a category-by-category reference. For APIs with similar usage patterns, one representative is demonstrated in detail; the rest are noted as "similar".

---

##### (1) Value Creation Functions

Convert C/C++ native values into script engine values (`pesapi_value`).

| API | Signature | Description |
|-----|-----------|-------------|
| **create_null** | `pesapi_value (pesapi_env env)` | Create script null |
| **create_undefined** | `pesapi_value (pesapi_env env)` | Create script undefined (mapped to nil/None in Lua/Python) |
| **create_boolean** | `pesapi_value (pesapi_env env, int value)` | Create boolean value |
| **create_int32** ★ | `pesapi_value (pesapi_env env, int32_t value)` | Create 32-bit signed integer |
| **create_uint32** | `pesapi_value (pesapi_env env, uint32_t value)` | Similar to create_int32, for unsigned integers |
| **create_int64** | `pesapi_value (pesapi_env env, int64_t value)` | Similar to create_int32, for 64-bit signed. Note: maps to BigInt in V8 |
| **create_uint64** | `pesapi_value (pesapi_env env, uint64_t value)` | Similar to create_int64 |
| **create_double** | `pesapi_value (pesapi_env env, double value)` | Create double-precision float. float also uses this API (cast to double first) |
| **create_string_utf8** ★ | `pesapi_value (pesapi_env env, const char* str, size_t length)` | Create script string from UTF-8 C string |
| **create_string_utf16** | `pesapi_value (pesapi_env env, const uint16_t* str, size_t length)` | Create script string from UTF-16, ideal for directly bridging C# strings |
| **create_binary** | `pesapi_value (pesapi_env env, void* bin, size_t length)` | Create binary data (e.g. ArrayBuffer). **Engine does NOT copy data; caller manages lifetime** |
| **create_binary_by_value** | `pesapi_value (pesapi_env env, void* bin, size_t length)` | Create binary data, **engine copies the data**. Use when input data is temporary |
| **create_array** | `pesapi_value (pesapi_env env)` | Create empty array |
| **create_object** | `pesapi_value (pesapi_env env)` | Create empty object |
| **create_function** | `pesapi_value (pesapi_env env, pesapi_callback impl, void* data, pesapi_function_finalize f)` | Create script function wrapping a native callback |
| **create_class** | `pesapi_value (pesapi_env env, const void* type_id)` | Create script class constructor by TypeId |

**Example — create_int32 (representative for numeric types):**

`cpp
// Create various numeric script values
auto env = apis->get_env_from_ref(env_ref);

// Create a 32-bit integer
pesapi_value val_i32 = apis->create_int32(env, 42);

// create_uint32 is similar, for unsigned integers
pesapi_value val_u32 = apis->create_uint32(env, 100u);

// create_int64 / create_uint64 are similar, for 64-bit integers (maps to BigInt in V8)
pesapi_value val_i64 = apis->create_int64(env, 9999999999LL);

// float and double both use create_double (cast float to double first)
float fval = 3.14f;
pesapi_value val_dbl = apis->create_double(env, (double)fval);

// Inject created values into global for script use
auto g = apis->global(env);
apis->set_property(env, g, "myInt", val_i32);
apis->set_property(env, g, "myFloat", val_dbl);
`

**Example — create_string_utf8 / create_string_utf16 (string types):**

`cpp
auto env = apis->get_env_from_ref(env_ref);

// create_string_utf8: create script string from a UTF-8 C string
pesapi_value str1 = apis->create_string_utf8(env, "hello", 5);

// create_string_utf16: create script string from UTF-16
// C# strings are natively UTF-16, so direct bridging avoids transcoding overhead
char16_t u16str[] = u"Hello";
pesapi_value str2 = apis->create_string_utf16(env, (uint16_t*)u16str, 5);

auto g = apis->global(env);
apis->set_property(env, g, "greeting", str1);
`

**Example — create_function (wrapping native callback as script function):**

`cpp
// Define a native callback (pesapi_callback signature)
static void MyAddFunc(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto p0 = apis->get_arg(info, 0);
    auto p1 = apis->get_arg(info, 1);
    int a = apis->get_value_int32(env, p0);
    int b = apis->get_value_int32(env, p1);
    apis->add_return(info, apis->create_int32(env, a + b));
}

// Optional: called when the script function is garbage collected
static void MyFuncFinalizer(struct pesapi_ffi* apis, void* data, void* env_private) {
    // data is the userdata passed to create_function
}

// Wrap callback as script function and inject into global
auto env = apis->get_env_from_ref(env_ref);
auto func = apis->create_function(env, MyAddFunc, nullptr, MyFuncFinalizer);
auto g = apis->global(env);
apis->set_property(env, g, "nativeAdd", func);
// Script can now call: nativeAdd(1, 2) => 3
`

---

##### (2) Value Reading Functions

Read C/C++ native values from script values. These correspond one-to-one with value creation functions.

| API | Signature | Description |
|-----|-----------|-------------|
| **get_value_bool** | `int (pesapi_env env, pesapi_value value)` | Read boolean |
| **get_value_int32** ★ | `int32_t (pesapi_env env, pesapi_value value)` | Read 32-bit signed integer |
| **get_value_uint32** | `uint32_t (pesapi_env env, pesapi_value value)` | Similar to get_value_int32 |
| **get_value_int64** | `int64_t (pesapi_env env, pesapi_value value)` | Similar to get_value_int32 |
| **get_value_uint64** | `uint64_t (pesapi_env env, pesapi_value value)` | Similar to get_value_int32 |
| **get_value_double** | `double (pesapi_env env, pesapi_value value)` | Read floating point number |
| **get_value_string_utf8** ★ | `const char* (pesapi_env env, pesapi_value value, char* buf, size_t* bufsize)` | Read UTF-8 string, supports two-phase call |
| **get_value_string_utf16** | `const uint16_t* (..., uint16_t* buf, size_t* bufsize)` | Similar to get_value_string_utf8, reads UTF-16 |
| **get_value_binary** | `void* (pesapi_env env, pesapi_value value, size_t* bufsize)` | Read binary data pointer and length |
| **get_array_length** | `uint32_t (pesapi_env env, pesapi_value value)` | Get array length |

**Example — get_value_int32 / get_value_uint32 (representative for numeric types):**

`cpp
auto env = apis->get_env_from_ref(env_ref);

// Evaluate a script expression and read the return value
auto code = "123 + 789";
auto ret = apis->eval(env, (const uint8_t*)code, strlen(code), "test");

// Read integer value
int32_t intVal = apis->get_value_int32(env, ret);   // => 912

// get_value_uint32 / get_value_int64 / get_value_uint64 are similar
// get_value_double reads floating-point numbers; cast manually for float:
//   float fval = (float)apis->get_value_double(env, someVal);
`

**Example — get_value_string_utf8 (two-phase string reading):**

`cpp
auto env = apis->get_env_from_ref(env_ref);

// Set a string on global first
auto g = apis->global(env);
apis->set_property(env, g, "myStr", apis->create_string_utf8(env, "hello", 5));
auto strVal = apis->get_property(env, g, "myStr");

// String reading supports a two-phase call pattern:
// Phase 1: buf=nullptr, get required buffer size
size_t bufsize = 0;
const char* str = apis->get_value_string_utf8(env, strVal, nullptr, &bufsize);
// Phase 2: allocate buffer and call again to get data
// If the engine can return a direct pointer, phase 1 returns non-null and phase 2 can be skipped
if (!str) {
    char* buf = (char*)alloca(bufsize + 1);
    str = apis->get_value_string_utf8(env, strVal, buf, &bufsize);
}
// str => "hello", bufsize => 5
`

> **get_value_string_utf16 works the same way.** When bridging C# strings, prefer the UTF-16 version to avoid encoding conversion:
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

##### (3) Type Checking Functions

Check value types before reading. Typically used in pairs with value reading functions.

| API | Signature | Description |
|-----|-----------|-------------|
| **is_null** | `int (pesapi_env env, pesapi_value value)` | Is null |
| **is_undefined** | `int (pesapi_env env, pesapi_value value)` | Is undefined |
| **is_boolean** | `int (pesapi_env env, pesapi_value value)` | Is boolean |
| **is_int32** | `int (pesapi_env env, pesapi_value value)` | Is int32 |
| **is_uint32** | `int (pesapi_env env, pesapi_value value)` | Similar to is_int32 |
| **is_int64** / **is_uint64** | same | Similar to is_int32 |
| **is_double** | `int (pesapi_env env, pesapi_value value)` | Is floating point |
| **is_string** | `int (pesapi_env env, pesapi_value value)` | Is string |
| **is_object** | `int (pesapi_env env, pesapi_value value)` | Is object |
| **is_function** | `int (pesapi_env env, pesapi_value value)` | Is function |
| **is_binary** | `int (pesapi_env env, pesapi_value value)` | Is binary data |
| **is_array** | `int (pesapi_env env, pesapi_value value)` | Is array |

**Cooperation Pattern — is_xxx + get_value_xxx (type-safe reading):**

In callbacks, typically check parameter type with `is_xxx` first, then safely read with `get_value_xxx`:

`cpp
// A callback that accepts either int or string, handling each differently
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

**Cooperation Pattern — is_xxx for overload resolution:**

When a method has multiple overloads, select the matching one based on script argument types:

`cpp
// Check if arguments match the "Add(int, int)" overload
static bool MatchOverload_Add_IntInt(struct pesapi_ffi* apis, pesapi_env env, pesapi_callback_info info) {
    if (apis->get_args_len(info) != 2) return false;
    auto arg0 = apis->get_arg(info, 0);
    auto arg1 = apis->get_arg(info, 1);
    return apis->is_int32(env, arg0) && apis->is_int32(env, arg1);
}

// Check if arguments match the "Add(string, string)" overload
static bool MatchOverload_Add_StrStr(struct pesapi_ffi* apis, pesapi_env env, pesapi_callback_info info) {
    if (apis->get_args_len(info) != 2) return false;
    auto arg0 = apis->get_arg(info, 0);
    auto arg1 = apis->get_arg(info, 1);
    // String parameters also accept null/undefined
    return (apis->is_string(env, arg0) || apis->is_null(env, arg0))
        && (apis->is_string(env, arg1) || apis->is_null(env, arg1));
}
`

**Cooperation Pattern — is_xxx for dynamic type inference:**

When the target type is unknown (e.g. System.Object), infer the native type from the script value:

`cpp
// Dispatch handling based on argument's actual type in a callback
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

##### (4) Native Object Bridging Functions

Core API group for C# object ↔ script object interoperation.

| API | Signature | Description |
|-----|-----------|-------------|
| **native_object_to_value** ★ | `pesapi_value (pesapi_env env, const void* type_id, void* object_ptr, int call_finalize)` | Wrap native object (C# object pointer) as script object |
| **get_native_object_ptr** ★ | `void* (pesapi_env env, pesapi_value value)` | Extract native object pointer from script object |
| **get_native_object_typeid** | `const void* (pesapi_env env, pesapi_value value)` | Get the TypeId associated with a script object |
| **is_instance_of** | `int (pesapi_env env, const void* type_id, pesapi_value value)` | Check if script object is instance of a TypeId |

**Cooperation Pattern — native_object_to_value + get_native_object_ptr + get_native_object_typeid (bidirectional object bridging):**

These three APIs form the core link for native ↔ script object interoperation. The following example shows a `GetSelf()` method returning itself, and verifying identity in script:

`cpp
int g_type_id = 0;  // Global variable address used as TypeId

struct MyObject {
    int value;
    MyObject(int v) : value(v) {}
};

// ===== Native -> Script direction =====
// GetSelf: wrap this pointer as script object and return it
static void GetSelfWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* self = (MyObject*)apis->get_native_holder_ptr(info);
    // call_finalize=false: lifecycle managed externally, script GC won't delete
    apis->add_return(info, apis->native_object_to_value(env, &g_type_id, self, false));
}

// ===== Script -> Native direction =====
// ProcessObject: extract native pointer from a script-passed object
static void ProcessObjectWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto arg0 = apis->get_arg(info, 0);

    // Get native pointer
    auto* obj = (MyObject*)apis->get_native_object_ptr(env, arg0);
    // Get TypeId for type safety check
    auto* typeId = apis->get_native_object_typeid(env, arg0);
    if (typeId == &g_type_id) {
        apis->add_return(info, apis->create_int32(env, obj->value));
    }
}

// For value types (data needs to be copied):
// call_finalize=true means script GC will call Finalize to free memory
static void CreateValueCopy(struct pesapi_ffi* apis, pesapi_env env) {
    MyObject* copy = new MyObject(42);
    apis->native_object_to_value(env, &g_type_id, copy, true);
}
`

---

##### (5) Boxing / Unboxing Functions

Used to simulate C# boxing/unboxing semantics in script, commonly for `ref` / `out` parameter passing.

| API | Signature | Description |
|-----|-----------|-------------|
| **boxing** | `pesapi_value (pesapi_env env, pesapi_value value)` | Wrap value in a mutable container (like C# boxing) |
| **unboxing** | `pesapi_value (pesapi_env env, pesapi_value value)` | Extract original value from container |
| **update_boxed_value** | `void (pesapi_env env, pesapi_value boxed, pesapi_value value)` | Update the value in the container |
| **is_boxed_value** | `int (pesapi_env env, pesapi_value value)` | Check if value is boxed |

**Cooperation Pattern — boxing + unboxing + update_boxed_value (ref/out parameter passing):**

C# `ref` and `out` parameters need a mutable container. Before the call, wrap with boxing; inside the function, retrieve via unboxing; after execution, write back via update_boxed_value. Here’s an example with `Inc(ref int x)`:

`cpp
struct MyObj {
    int a;
    void Inc(int& x) { x += a; }  // ref parameter: adds a to x
};

// Callback wrapper for the Inc method
static void IncWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* self = (MyObj*)apis->get_native_holder_ptr(info);
    auto p0 = apis->get_arg(info, 0);  // p0 is a boxed value

    // 1. unboxing: extract current value from the container
    auto unboxed = apis->unboxing(env, p0);
    int x = apis->get_value_int32(env, unboxed);

    // 2. Execute the actual C++ method
    self->Inc(x);  // x is modified

    // 3. update_boxed_value: write modified value back to the container
    apis->update_boxed_value(env, p0, apis->create_int32(env, x));
}

// Script-side call example (Python style):
//   obj = MyObj(2)
//   obj.Inc([3])    # pass boxed value [3]
//   # after call, boxed value becomes [5], because 3 + 2 = 5
`

---

##### (6) Callback Info Functions

When script calls a native function, the callback accesses call arguments and sets return values through `pesapi_callback_info`.

| API | Signature | Description |
|-----|-----------|-------------|
| **get_args_len** | `int (pesapi_callback_info info)` | Get argument count |
| **get_arg** | `pesapi_value (pesapi_callback_info info, int index)` | Get argument at index |
| **get_env** | `pesapi_env (pesapi_callback_info info)` | Get current environment from callback info |
| **get_native_holder_ptr** | `void* (pesapi_callback_info info)` | Get this object's native pointer (for instance methods) |
| **get_native_holder_typeid** | `const void* (pesapi_callback_info info)` | Get this object's TypeId |
| **get_userdata** | `void* (pesapi_callback_info info)` | Get userdata bound when creating the callback |
| **add_return** | `void (pesapi_callback_info info, pesapi_value value)` | Set return value |
| **throw_by_string** | `void (pesapi_callback_info info, const char* msg)` | Throw exception to script |

**Cooperation Pattern — Complete callback function implementation:**

The following shows a complete class registration and callback implementation pattern, including constructor, instance method, static method, and property:

`cpp
struct TestStruct {
    int a;
    TestStruct(int a) : a(a) {}
    ~TestStruct() {}
    int Calc(int x, int y) { return a + x + y; }
    static int Add(int x, int y) { return x + y; }
};

int g_type_id = 0;

// Constructor callback (pesapi_constructor signature: returns void*)
static void* TestStructCtor(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto p0 = apis->get_arg(info, 0);
    int a = apis->get_value_int32(env, p0);
    return new TestStruct(a);  // returned pointer becomes native pointer of the script object
}

// Destructor callback: called when script object is GC'd
static void TestStructFinalize(struct pesapi_ffi* apis, void* ptr, void* class_data, void* env_private) {
    delete (TestStruct*)ptr;
}

// Instance method callback: obj.Calc(x, y)
static void CalcWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* self = (TestStruct*)apis->get_native_holder_ptr(info);  // get this
    int x = apis->get_value_int32(env, apis->get_arg(info, 0));
    int y = apis->get_value_int32(env, apis->get_arg(info, 1));
    apis->add_return(info, apis->create_int32(env, self->Calc(x, y)));
}

// Static method callback: TestStruct.Add(x, y)
static void AddWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    int x = apis->get_value_int32(env, apis->get_arg(info, 0));
    int y = apis->get_value_int32(env, apis->get_arg(info, 1));
    apis->add_return(info, apis->create_int32(env, TestStruct::Add(x, y)));
}

// Property getter: obj.a
static void AGetterWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* self = (TestStruct*)apis->get_native_holder_ptr(info);
    apis->add_return(info, apis->create_int32(env, self->a));
}

// Property setter: obj.a = value
static void ASetterWrap(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* self = (TestStruct*)apis->get_native_holder_ptr(info);
    self->a = apis->get_value_int32(env, apis->get_arg(info, 0));
}
`

> **Note**: `pesapi_callback` has signature `void(struct pesapi_ffi* apis, pesapi_callback_info info)`, while `pesapi_constructor` has signature `void*(struct pesapi_ffi* apis, pesapi_callback_info info)`. The constructor's returned pointer becomes the native pointer associated with the script object.

---

##### (7) Environment Reference (env_ref) and Scope Functions

This group of APIs is used for safely operating the script environment outside of callback contexts (e.g., calling script from C# side).

| API | Signature | Description |
|-----|-----------|-------------|
| **create_env_ref** | `pesapi_env_ref (pesapi_env env)` | Create persistent reference from env |
| **env_ref_is_valid** | `int (pesapi_env_ref ref)` | Check if reference is still valid |
| **get_env_from_ref** | `pesapi_env (pesapi_env_ref ref)` | Get env from reference (must be inside scope) |
| **duplicate_env_ref** | `pesapi_env_ref (pesapi_env_ref ref)` | Duplicate an env_ref |
| **release_env_ref** | `void (pesapi_env_ref ref)` | Release env_ref |
| **open_scope** | `pesapi_scope (pesapi_env_ref ref)` | Open scope (heap-allocated) |
| **open_scope_placement** | `pesapi_scope (pesapi_env_ref ref, pesapi_scope_memory* mem)` | Open scope (stack-allocated, more efficient) |
| **has_caught** | `int (pesapi_scope scope)` | Whether a script exception was caught |
| **get_exception_as_string** | `const char* (pesapi_scope scope, int with_stack)` | Get exception message string |
| **close_scope** | `void (pesapi_scope scope)` | Close heap-allocated scope |
| **close_scope_placement** | `void (pesapi_scope scope)` | Close stack-allocated scope |

**Cooperation Pattern — env_ref + open_scope + close_scope (standard pattern for operating script environment outside callbacks):**

`cpp
// Simple way: use open_scope / close_scope (heap-allocated)
{
    pesapi_scope scope = apis->open_scope(env_ref);        // open scope
    auto env = apis->get_env_from_ref(env_ref);            // get env inside scope

    // Execute script code within the scope
    auto code = "123 + 456";
    auto ret = apis->eval(env, (const uint8_t*)code, strlen(code), "test");

    // Check for exceptions
    if (apis->has_caught(scope)) {
        auto msg = apis->get_exception_as_string(scope, true);  // true = include stack trace
        printf("Error: %s\n", msg);
    } else {
        int val = apis->get_value_int32(env, ret);  // => 579
    }

    apis->close_scope(scope);                              // close scope
}

// Efficient way: use open_scope_placement / close_scope_placement (stack-allocated, recommended)
{
    pesapi_scope_memory mem;
    pesapi_scope scope = apis->open_scope_placement(env_ref, &mem);
    auto env = apis->get_env_from_ref(env_ref);

    auto g = apis->global(env);
    apis->set_property(env, g, "myVar", apis->create_int32(env, 42));

    apis->close_scope_placement(scope);
}

// RAII wrapper (recommended for production code)
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

##### (8) Value Reference (value_ref) Functions

For persistent references to script values (surviving across scopes), commonly used when C# holds a reference to a script object.

| API | Signature | Description |
|-----|-----------|-------------|
| **create_value_ref** | `pesapi_value_ref (pesapi_env env, pesapi_value value, uint32_t internal_field_count)` | Create persistent reference with internal fields |
| **duplicate_value_ref** | `pesapi_value_ref (pesapi_value_ref ref)` | Duplicate a reference |
| **release_value_ref** | `void (pesapi_value_ref ref)` | Release reference |
| **get_value_from_ref** | `pesapi_value (pesapi_env env, pesapi_value_ref ref)` | Get current value from reference |
| **set_ref_weak** | `void (pesapi_env env, pesapi_value_ref ref)` | Make reference weak |
| **set_owner** | `int (pesapi_env env, pesapi_value value, pesapi_value owner)` | Set ownership relationship (optional API) |
| **get_ref_associated_env** | `pesapi_env_ref (pesapi_value_ref ref)` | Get the env_ref associated with the reference |
| **get_ref_internal_fields** | `void** (pesapi_value_ref ref, uint32_t* count)` | Get internal fields pointer |

**Cooperation Pattern — value_ref + get/set_private (complete pattern for persistently holding script objects):**

`cpp
// Scenario: hold a script function reference on the C++ side, call it later

pesapi_value_ref funcRef = nullptr;

// === Create reference: persist a script value inside a scope ===
{
    pesapi_scope scope = apis->open_scope(env_ref);
    auto env = apis->get_env_from_ref(env_ref);

    // Get a script function
    auto code = "(lambda x, y: x + y)";
    auto func = apis->eval(env, (const uint8_t*)code, strlen(code), "test");

    // Create persistent reference (survives across scopes)
    funcRef = apis->create_value_ref(env, func, 0);  // 0 = no internal fields needed

    apis->close_scope(scope);
    // After scope closes, func itself is invalid, but funcRef is still valid
}

// === Use reference: retrieve value from ref in another scope and call it ===
{
    pesapi_scope scope = apis->open_scope(env_ref);
    auto env = apis->get_env_from_ref(env_ref);

    // Recover value from ref
    auto func = apis->get_value_from_ref(env, funcRef);
    pesapi_value argv[2] = { apis->create_int32(env, 10), apis->create_int32(env, 20) };
    auto ret = apis->call_function(env, func, nullptr, 2, argv);
    // ret => 30

    apis->close_scope(scope);
}

// === Release reference ===
apis->release_value_ref(funcRef);

// --- get/set_private with value_ref: associate custom data on script objects ---
{
    pesapi_scope scope = apis->open_scope(env_ref);
    auto env = apis->get_env_from_ref(env_ref);
    auto obj = apis->create_object(env);

    int myData = 42;
    apis->set_private(env, obj, &myData);       // store private data on script object

    void* out = nullptr;
    apis->get_private(env, obj, &out);           // retrieve private data
    // out == &myData

    apis->close_scope(scope);
}
`

---

##### (9) Property Operation Functions

| API | Signature | Description |
|-----|-----------|-------------|
| **get_property** | `pesapi_value (pesapi_env env, pesapi_value object, const char* key)` | Read string-keyed property |
| **set_property** | `int (pesapi_env env, pesapi_value object, const char* key, pesapi_value value)` | Set string-keyed property |
| **get_private** | `int (pesapi_env env, pesapi_value object, void** out_ptr)` | Read private data from object |
| **set_private** | `int (pesapi_env env, pesapi_value object, void* ptr)` | Set private data on object |
| **get_property_uint32** | `pesapi_value (pesapi_env env, pesapi_value object, uint32_t key)` | Read array element |
| **set_property_uint32** | `int (pesapi_env env, pesapi_value object, uint32_t key, pesapi_value value)` | Set array element |

**Example — set_property + global + get_property (property read/write):**

`cpp
auto env = apis->get_env_from_ref(env_ref);
auto g = apis->global(env);

// Set a string property
apis->set_property(env, g, "greeting", apis->create_string_utf8(env, "hello", 5));

// Read back the string property
auto val = apis->get_property(env, g, "greeting");
char buf[64];
size_t len = sizeof(buf);
const char* str = apis->get_value_string_utf8(env, val, buf, &len);
// str => "hello"

// set_property_uint32 / get_property_uint32 for array element access
auto arr = apis->create_array(env);
apis->set_property_uint32(env, arr, 0, apis->create_int32(env, 10));
apis->set_property_uint32(env, arr, 1, apis->create_int32(env, 20));
auto elem = apis->get_property_uint32(env, arr, 0);
int v = apis->get_value_int32(env, elem);  // => 10
`

**Cooperation Pattern — get/set_private (associating private data on script objects):**

`cpp
auto env = apis->get_env_from_ref(env_ref);
auto obj = apis->create_object(env);

// set_private / get_private: associate a C++ pointer with a script object
int myData = 42;
apis->set_private(env, obj, &myData);

void* ptr = nullptr;
apis->get_private(env, obj, &ptr);
// ptr == &myData
`

---

##### (10) Execution and Global Functions

| API | Signature | Description |
|-----|-----------|-------------|
| **call_function** | `pesapi_value (pesapi_env env, pesapi_value func, pesapi_value this_object, int argc, const pesapi_value argv[])` | Call script function |
| **eval** | `pesapi_value (pesapi_env env, const uint8_t* code, size_t code_size, const char* path)` | Execute script code |
| **global** | `pesapi_value (pesapi_env env)` | Get global object |
| **get_env_private** | `const void* (pesapi_env env)` | Get environment private data |
| **set_env_private** | `void (pesapi_env env, const void* ptr)` | Set environment private data |
| **set_registry** | `void (pesapi_env env, pesapi_registry registry)` | Set type registry |

**Cooperation Pattern — eval + has_caught + get_exception_as_string (execute script with exception handling):**

`cpp
pesapi_scope scope = apis->open_scope(env_ref);
auto env = apis->get_env_from_ref(env_ref);

// Normal execution
auto code1 = "123 + 789";
auto ret = apis->eval(env, (const uint8_t*)code1, strlen(code1), "test");
if (!apis->has_caught(scope)) {
    int val = apis->get_value_int32(env, ret);  // => 912
}

// Exception handling
auto code2 = "raise Exception('something went wrong')";
apis->eval(env, (const uint8_t*)code2, strlen(code2), "test_err");
if (apis->has_caught(scope)) {
    // with_stack=false: exception message only
    auto msg = apis->get_exception_as_string(scope, false);
    // msg => "something went wrong"

    // with_stack=true: full stack trace
    auto detail = apis->get_exception_as_string(scope, true);
    // detail => "Traceback ...\nException: something went wrong\n"
}

apis->close_scope(scope);
`

**Cooperation Pattern — set_env_private + get_env_private (environment private data):**

`cpp
auto env = apis->get_env_from_ref(env_ref);

// Associate custom data with env during initialization
struct MyEnvData { int refCount; void* objectPool; };
MyEnvData* data = new MyEnvData{0, nullptr};
apis->set_env_private(env, data);

// Later, retrieve it anywhere you have access to env (including inside callbacks)
static void SomeCallback(struct pesapi_ffi* apis, pesapi_callback_info info) {
    auto env = apis->get_env(info);
    auto* data = (MyEnvData*)apis->get_env_private(env);
    data->refCount++;
}
`

#### 4.1.2 Initializing g_pesapi_ffi

After implementing all functions, define the global FFI table at the end of Pesapi{Lang}Impl.cpp:

`cpp
namespace pesapi
{
namespace yourimpl
{
pesapi_ffi g_pesapi_ffi {
    &pesapi_create_null,
    &pesapi_create_undefined,
    &pesapi_create_boolean,
    // ... fill in all function pointers in the order of pesapi_ffi struct fields
};
}
}
`

> **Important:** Function pointers must be filled in strictly following the declaration order of fields in `struct pesapi_ffi` in pesapi.h.

#### 4.1.3 Type Mapping Strategies for Each Language

| Concept | V8 | QuickJS | Lua | Python |
|---------|-----|---------|-----|--------|
| pesapi_env | v8::Context* | JSContext* | lua_State* | CppObjectMapper* |
| pesapi_value | v8::Value* | JSValue* | int (stack index) | PyObject* |
| Scope management | v8::HandleScope | Custom value allocator | lua stack top | Custom refcount scope |

### 4.2 Implement CppObjectMapper

CppObjectMapper is responsible for mapping C# objects to script language objects. Each plugin needs to implement its own version.

> **About the naming:** The "Cpp" in "CppObjectMapper" is historical -- PuerTs was originally designed for C++. In Unity, it logically maps the relationship between C# objects and script objects. The reason it still operates on C++ pointers at the implementation level is that under runtimes like il2cpp, C# object references are themselves C++ pointers.

#### Core Responsibilities:

1. **Initialize / UnInitialize (or Cleanup)** -- Initialize and clean up the object mapper
2. **FindOrAddCppObject** -- Find or create a script object for a given TypeId and pointer (logically a C# object, passed as a C++ pointer)
3. **BindCppObject / UnBindCppObject** -- Bind/unbind C# objects (represented as C++ pointers) to/from script objects
4. **GetPrivateData / SetPrivateData** -- Get/set private data pointer on script objects
5. **LoadTypeById** -- Load script representation of a class by TypeId
6. **CreateFunction** -- Create script function wrapping a native callback
7. **Lifecycle Tracking** -- Track whether the environment is still alive via weak_ptr returned by `GetEnvLifeCycleTracker()`

#### Key Data Structures:

```cpp
// Object cache: C# object pointer (as C++ pointer) -> script object mapping
eastl::unordered_map<void*, FObjectCacheNode, ...> CDataCache;

// Type mapping: TypeId -> script class template/metatable/type object
eastl::unordered_map<const void*, ScriptType, ...> TypeIdToXxxMap;

// Lifecycle tracking
eastl::shared_ptr<int> ref;
```

#### Language-Specific Implementation Differences:

- **V8**: Uses v8::FunctionTemplate and v8::ObjectTemplate to define classes
- **QuickJS**: Uses JSClassDef and JS_NewClassID to register custom classes
- **Lua**: Uses metatable and userdata to simulate classes
- **Python**: Uses PyType_Spec and PyType_FromSpec to dynamically create Python types

### 4.3 Implement PapiExport.cpp (Exported C Functions)

Each plugin needs to export a set of standard C functions for the C# layer. Function naming follows the pattern `Get{Lang}PapiVersion`, `Get{Lang}FFIApi`, `Create{Lang}PapiEnvRef`, `Destroy{Lang}PapiEnvRef`.

Comparison of exported functions across plugins:

| Function | V8 | QuickJS | Lua | Python |
|----------|-----|---------|-----|--------|
| Get Version | GetV8PapiVersion | GetQjsPapiVersion | GetLuaPapiVersion | GetPythonPapiVersion |
| Get FFI Table | GetV8FFIApi | GetQjsFFIApi | GetLuaFFIApi | GetPythonFFIApi |
| Create Env | CreateV8PapiEnvRef | CreateQjsPapiEnvRef | CreateLuaPapiEnvRef | CreatePythonPapiEnvRef |
| Destroy Env | DestroyV8PapiEnvRef | DestroyQjsPapiEnvRef | DestroyLuaPapiEnvRef | DestroyPythonPapiEnvRef |
| Extras | Inspector/GC/Tick | RunGC | - | RunGC/InitPythonByHome |

Plugins may export additional functions as needed (e.g., V8's CreateInspector and LowMemoryNotification, Python's InitPythonByHome, etc.).

### 4.4 Define Internal Data Structures

Each plugin needs to define the following key internal data structures:

#### pesapi_env_ref__

Used for persistent references to the script environment (surviving across scopes), containing reference count and environment lifecycle tracking.

#### pesapi_value_ref__

Used for persistent references to script values (typically inherits from pesapi_env_ref__), containing a persistent value handle and optional internal fields.

#### pesapi_scope__

Scope management, which is the most divergent part across languages:
- **V8**: Wraps v8::HandleScope + v8::TryCatch
- **QuickJS**: Manages allocated JSValue arrays, freed when scope ends
- **Lua**: Records stack top position, restores when scope ends
- **Python**: Manages reference counting, switches thread state (PyThreadState_Swap)

**Important constraint:** `sizeof(pesapi_scope__) <= sizeof(pesapi_scope_memory)` because scope may be allocated on the caller's stack via placement new.

#### pesapi_callback_info__

Parameter wrapper passed to callback functions, including self object, argument list, return value slot, and exception info.

## 5. CMake Build Configuration

### 5.1 Key Points

1. **Must link PuertsCore** -- Include via `add_subdirectory(../puerts ...)` and link via `target_link_libraries`
2. **Disable exceptions and RTTI** -- Maintain ABI compatibility with PuertsCore and engine backends
3. **Platform-specific handling**:
   - iOS / WebAssembly / Switch: Generate static libraries
   - Other platforms: Generate shared libraries (.dll / .so / .dylib)
4. **External engine dependencies**:
   - Embedded source (QuickJS, Lua): Compile engine source directly
   - Precompiled libraries (V8): Specify via BACKEND_LIB_NAMES and BACKEND_INC_NAMES
   - System libraries (Python): Use find_package(Python3) or specify paths manually

### 5.2 Build Scripts

You can use PuerTs CLI tools for unified building:

`ash
node ../../cli make --platform {platform} --arch {arch}
`

Or write platform-specific build scripts (e.g., make_win64.bat, make_linux64.sh).

## 6. Plugin Implementation Comparison

| Feature | V8 | QuickJS | Lua | Python |
|---------|-----|---------|-----|--------|
| Engine source | Precompiled lib | Embedded source | Embedded source | System/precompiled |
| pesapi_env | v8::Context* | JSContext* | lua_State* | CppObjectMapper* |
| pesapi_value | v8::Value* | JSValue* | int (stack index) | PyObject* |
| Value management | v8 Handle system | Manual alloc + scope free | Lua stack | Python refcount |
| Type system | FunctionTemplate | JSClassDef | Metatable | PyType_Spec |
| GC mechanism | V8 built-in | JS_RunGC | Lua GC | Python GC |
| Thread safety | Locker/IsolateScope | None | None | PyThreadState_Swap |
| C++ standard | C++14/17/20 | C++14 | C++14 | C++20 |
| Output library | PapiV8 | PapiQuickjs | PapiLua | PapiPython |

## 7. Implementation Notes and Best Practices

### 7.1 Choosing pesapi_env

Deciding what to use as pesapi_env is the first key design decision:
- Must be able to efficiently obtain both the script engine context and CppObjectMapper from pesapi_env
- V8 / QuickJS / Lua use engine context pointers, then obtain mapper via the engine's "extra data" mechanism
- Python directly uses the CppObjectMapper pointer since Python lacks a similar "extra data" mechanism

### 7.2 Scope Management

Every language plugin must implement a scope mechanism to manage the lifecycle of temporary script values. open_scope_placement / close_scope_placement versions use caller-provided stack memory for the scope object (avoiding heap allocation), so pesapi_scope__ size must not exceed pesapi_scope_memory.

### 7.3 Exception Handling

- Scopes need to catch script exceptions
- Use pesapi_has_caught(scope) to check for exceptions
- Use pesapi_get_exception_as_string(scope, with_stack) to get exception info
- Use pesapi_throw_by_string(info, msg) to throw exceptions in callbacks

### 7.4 Memory Management & Dependency Control

- **Core principle: avoid introducing extra runtime dependencies.** The specific strategy depends on the underlying engine's own dependencies:
  - **V8 plugin**: V8 itself depends on libc++, so using STL directly is perfectly fine
  - **Lua / QuickJS and other pure-C engine plugins**: the underlying engine is a pure C implementation — if the plugin can also be implemented in pure C, that's ideal; alternatively, use EASTL (with exceptions and RTTI disabled) to avoid the dynamic library depending on libc++. Of course, using STL is not strictly forbidden, it just introduces an extra runtime dependency
- Avoid C++ exceptions in pesapi implementation (especially for pure-C engine plugins)
- Mind each engine's GC mechanism, ensure script objects held by C++ are not garbage collected

### 7.5 Symbol Export

- Use PESAPI_MODULE_EXPORT macro to export C functions
- V8 plugin additionally uses version scripts (Linux/Android) or exported symbol lists (macOS) for visibility control

## 8. Development Checklist

When developing a new language plugin, ensure all the following steps are completed:

- [ ] Create directory structure under unity/native/papi-{lang}/
- [ ] Implement Pesapi{Lang}Impl.cpp, covering all ~80 functions in pesapi_ffi
- [ ] Define pesapi_env_ref__, pesapi_value_ref__, pesapi_scope__, pesapi_callback_info__ structs
- [ ] Initialize global g_pesapi_ffi variable
- [ ] Implement CppObjectMapper{Lang} including object cache, type registration, lifecycle management
- [ ] Implement PapiExport.cpp exporting Get{Lang}PapiVersion, Get{Lang}FFIApi, Create{Lang}PapiEnvRef, Destroy{Lang}PapiEnvRef
- [ ] Write CMakeLists.txt linking PuertsCore
- [ ] Write platform build scripts
- [ ] Verify builds on all platforms (Windows, Linux, macOS, Android, iOS, etc.)
- [ ] Write unit tests to validate basic functionality

## 9. References

- `unity/native/puerts/include/pesapi.h` -- P-API core header file, defines the interface all plugins must implement
- `unity/native/puerts/` -- PuertsCore shared core library
- `unity/native/papi-v8/` -- V8 language plugin reference implementation (most feature-complete)
- `unity/native/papi-quickjs/` -- QuickJS language plugin reference implementation
- `unity/native/papi-lua/` -- Lua language plugin reference implementation
- `unity/native/papi-python/` -- Python language plugin reference implementation