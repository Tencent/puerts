# PESAPI Python Extension

This is a Python extension for PESAPI (Portable Embedded Scripting API), allowing Python to interact with C++ code through the PESAPI interface.

## Overview

The PESAPI Python extension provides a bridge between Python and C++ code, similar to the existing Lua, QuickJS, V8, and Node.js implementations. It allows you to:

- Create and manipulate Python objects from C++
- Call Python functions from C++
- Access C++ objects and methods from Python
- Handle basic data types (numbers, strings, booleans, arrays, objects)
- Manage object lifecycles and memory

## Building

### Prerequisites

- CMake 3.16 or higher
- Python 3.x development headers
- C++17 compatible compiler
- EASTL library (included in the project)

### Build Steps

1. Navigate to the papi-python directory:
   ```bash
   cd unity/native/papi-python
   ```

2. Create a build directory:
   ```bash
   mkdir build
   cd build
   ```

3. Configure and build:
   ```bash
   cmake ..
   make
   ```

   On Windows with Visual Studio:
   ```bash
   cmake .. -G "Visual Studio 16 2019"
   cmake --build . --config Release
   ```

4. The extension library will be created as:
   - Windows: `pesapi_python.dll`
   - Linux/macOS: `libpesapi_python.so`

## Usage

### Basic Example

```python
import ctypes

# Load the extension
pesapi_lib = ctypes.CDLL('./pesapi_python.dll')  # Windows
# pesapi_lib = ctypes.CDLL('./libpesapi_python.so')  # Linux/macOS

# Create basic types
null_value = pesapi_lib.pesapi_create_null(None)
bool_value = pesapi_lib.pesapi_create_boolean(None, 1)
int_value = pesapi_lib.pesapi_create_int32(None, 42)
string_value = pesapi_lib.pesapi_create_string_utf8(None, b"Hello", 5)
```

### C++ Integration

```cpp
#include "pesapi.h"
#include "CppObjectMapperPython.h"

// Initialize Python environment
Py_Initialize();
PyObject* mainModule = PyImport_AddModule("__main__");

// Initialize PESAPI
auto mapper = new pesapi::pythonimpl::CppObjectMapper();
mapper->Initialize(mainModule);

// Create Python values
pesapi_env env = pesapiEnvFromPyObject(mainModule);
pesapi_value int_val = pesapi_create_int32(env, 42);
pesapi_value str_val = pesapi_create_string_utf8(env, "Hello", 5);

// Call Python functions
pesapi_value func = pesapi_create_function(env, my_callback, nullptr, nullptr);
pesapi_value result = pesapi_call_function(env, func, nullptr, 0, nullptr);
```

## API Reference

### Value Creation Functions

- `pesapi_create_null(env)` - Create a null value
- `pesapi_create_boolean(env, value)` - Create a boolean value
- `pesapi_create_int32(env, value)` - Create a 32-bit integer
- `pesapi_create_uint32(env, value)` - Create an unsigned 32-bit integer
- `pesapi_create_int64(env, value)` - Create a 64-bit integer
- `pesapi_create_uint64(env, value)` - Create an unsigned 64-bit integer
- `pesapi_create_double(env, value)` - Create a double value
- `pesapi_create_string_utf8(env, str, length)` - Create a UTF-8 string
- `pesapi_create_string_utf16(env, str, length)` - Create a UTF-16 string
- `pesapi_create_array(env)` - Create an empty array
- `pesapi_create_object(env)` - Create an empty object
- `pesapi_create_function(env, callback, data, finalize)` - Create a function

### Value Access Functions

- `pesapi_get_value_bool(env, value)` - Get boolean value
- `pesapi_get_value_int32(env, value)` - Get 32-bit integer value
- `pesapi_get_value_double(env, value)` - Get double value
- `pesapi_get_value_string_utf8(env, value, buf, bufsize)` - Get UTF-8 string
- `pesapi_get_array_length(env, value)` - Get array length

### Type Checking Functions

- `pesapi_is_null(env, value)` - Check if value is null
- `pesapi_is_boolean(env, value)` - Check if value is boolean
- `pesapi_is_int32(env, value)` - Check if value is integer
- `pesapi_is_double(env, value)` - Check if value is double
- `pesapi_is_string(env, value)` - Check if value is string
- `pesapi_is_array(env, value)` - Check if value is array
- `pesapi_is_object(env, value)` - Check if value is object
- `pesapi_is_function(env, value)` - Check if value is function

### Object Property Functions

- `pesapi_get_property(env, object, key)` - Get object property
- `pesapi_set_property(env, object, key, value)` - Set object property
- `pesapi_get_property_uint32(env, object, index)` - Get array element
- `pesapi_set_property_uint32(env, object, index, value)` - Set array element

### Function Call Functions

- `pesapi_call_function(env, func, this_obj, argc, argv)` - Call a function
- `pesapi_eval(env, code, code_size, path)` - Evaluate Python code

### Memory Management

- `pesapi_create_env_ref(env)` - Create environment reference
- `pesapi_release_env_ref(env_ref)` - Release environment reference
- `pesapi_create_value_ref(env, value, field_count)` - Create value reference
- `pesapi_release_value_ref(value_ref)` - Release value reference

## Architecture

The extension consists of several key components:

1. **PesapiPythonImpl.cpp** - Main PESAPI function implementations
2. **CppObjectMapperPython.h/cpp** - Object mapping and lifecycle management
3. **ObjectCacheNodePython.h** - Object caching structures

### Key Features

- **Object Mapping**: Maps C++ objects to Python objects and vice versa
- **Memory Management**: Handles reference counting and object lifecycle
- **Type Safety**: Provides type checking and conversion functions
- **Error Handling**: Integrates with Python's exception system
- **Thread Safety**: Supports multi-threaded environments

## Limitations

- Currently supports Python 3.x only
- Some advanced features like inheritance checking are not fully implemented
- Memory management requires careful attention to reference counting
- Thread safety depends on Python's GIL (Global Interpreter Lock)

## Contributing

When contributing to this extension:

1. Follow the existing code style and patterns
2. Add appropriate error handling
3. Update documentation for new features
4. Add tests for new functionality
5. Ensure compatibility with the main PESAPI interface

## License

This extension is part of the Puerts project and follows the same license terms.
