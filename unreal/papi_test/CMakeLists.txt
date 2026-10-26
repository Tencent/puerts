cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)

project(papi_test LANGUAGES C CXX)

# pesapi (papi) + static binding test for unreal plugin:
#   hello        : pesapi addon built with BUILDING_PES_EXTENSION, using Binding.hpp static binding (PesapiBackend.hpp)
#   papi_test_host : minimal v8 host built from unreal JsEnv sources (PesapiV8Impl.cpp, PesapiRegister.cpp, ...)
#                    without unreal engine, loads the addon and runs test.js
#   papi_test_host_v8 / papi_test_host_static : the same host with the addon sources linked in, built with the v8_impl
#                    (V8Backend.hpp) / pesapi_impl (PesapiBackend.hpp) binding, runs the same test.js

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(PUERTS_ROOT ${CMAKE_CURRENT_SOURCE_DIR}/../Puerts)
set(JSENV_DIR ${PUERTS_ROOT}/Source/JsEnv)

if(NOT DEFINED V8_ROOT)
    set(V8_ROOT ${PUERTS_ROOT}/ThirdParty/v8_9.4.146.24)
endif()

if(NOT EXISTS ${V8_ROOT}/Inc/v8.h)
    message(FATAL_ERROR "v8 not found in ${V8_ROOT}, download v8_bin_9.4.146.24.tgz and extract it to unreal/Puerts/ThirdParty")
endif()

if(WIN32)
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreadedDLL")
    set(V8_LIB ${V8_ROOT}/Lib/Win64MD/wee8.lib)
elseif(APPLE)
    if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm64|aarch64")
        set(V8_LIB ${V8_ROOT}/Lib/macOS_arm64/libwee8.a)
    else()
        set(V8_LIB ${V8_ROOT}/Lib/macOS/libwee8.a)
    endif()
else()
    if(CMAKE_SYSTEM_PROCESSOR MATCHES "arm64|aarch64")
        set(V8_LIB ${V8_ROOT}/Lib/Linux_arm64/libwee8.a)
    else()
        set(V8_LIB ${V8_ROOT}/Lib/Linux/libwee8.a)
    endif()
endif()

if(MSVC)
    add_compile_options(/Zc:__cplusplus /utf-8)
endif()

# the linux libwee8.a shipped with the unreal plugin is built against libc++ (std::__1), so libc++ must be used too
if(UNIX AND NOT APPLE)
    option(PAPI_TEST_USE_LIBCXX "build with -stdlib=libc++ to match the abi of libwee8.a" ON)
    if(PAPI_TEST_USE_LIBCXX)
        add_compile_options($<$<COMPILE_LANGUAGE:CXX>:-stdlib=libc++>)
        add_link_options(-stdlib=libc++)
        link_libraries(c++abi)
    endif()
endif()

# ---------------------------------------------------------------- addon
add_library(hello SHARED
    addon/hello.cc
    addon/TestClass.cc
    addon/AdvanceTestClass.cc
)
target_include_directories(hello PRIVATE ${JSENV_DIR}/Public addon)
target_compile_definitions(hello PRIVATE BUILDING_PES_EXTENSION)
# load by explicit path, keep the same file name on all platforms: hello.dll / hello.so / hello.dylib
set_target_properties(hello PROPERTIES PREFIX "")
if(APPLE)
    set_target_properties(hello PROPERTIES SUFFIX ".dylib")
endif()
if(NOT WIN32)
    target_compile_options(hello PRIVATE -fvisibility=hidden)
endif()

# ---------------------------------------------------------------- host
set(HOST_SOURCES
    host/main.cpp
    ${JSENV_DIR}/Private/PesapiV8Impl.cpp
    ${JSENV_DIR}/Private/PesapiRegister.cpp
    ${JSENV_DIR}/Private/CppObjectMapper.cpp
    ${JSENV_DIR}/Private/JSClassRegister.cpp
    ${JSENV_DIR}/Private/ScriptClassRegistry.cpp
    ${JSENV_DIR}/Private/DataTransfer.cpp
)

# the addon sources (hello.cc uses PUERTS_PESAPI_MODULE) are the same for all hosts, only the build options differ:
# papi_test_host        : loads them as a pesapi addon (BUILDING_PES_EXTENSION, PesapiBackend.hpp)
# papi_test_host_static : links them into the host with the default pesapi_impl binding (PesapiBackend.hpp)
# papi_test_host_v8     : links them into the host with PUERTS_BINDING_IMPL=v8_impl (V8Backend.hpp)
set(MODULE_SOURCES
    addon/hello.cc
    addon/TestClass.cc
    addon/AdvanceTestClass.cc
)
add_executable(papi_test_host ${HOST_SOURCES})
target_compile_definitions(papi_test_host PRIVATE "PAPI_TEST_NAME=\"pesapi addon\"")
add_executable(papi_test_host_static ${HOST_SOURCES} ${MODULE_SOURCES})
target_compile_definitions(papi_test_host_static PRIVATE PAPI_TEST_LINKED_MODULE
    "PAPI_TEST_NAME=\"linked into the host, pesapi_impl\"")
add_executable(papi_test_host_v8 ${HOST_SOURCES} ${MODULE_SOURCES})
target_compile_definitions(papi_test_host_v8 PRIVATE PAPI_TEST_LINKED_MODULE PUERTS_BINDING_IMPL=v8_impl
    "PAPI_TEST_NAME=\"linked into the host, v8_impl\"")

foreach(HOST papi_test_host papi_test_host_static papi_test_host_v8)
    target_include_directories(${HOST} PRIVATE ${JSENV_DIR}/Public ${JSENV_DIR}/Private ${V8_ROOT}/Inc addon)
    target_link_libraries(${HOST} PRIVATE ${V8_LIB})

    if(WIN32)
        target_link_libraries(${HOST} PRIVATE winmm.lib dbghelp.lib shlwapi.lib)
        target_compile_definitions(${HOST} PRIVATE PLATFORM_WINDOWS NOMINMAX WIN32_LEAN_AND_MEAN)
    elseif(APPLE)
        target_compile_definitions(${HOST} PRIVATE PLATFORM_MAC)
    else()
        target_link_libraries(${HOST} PRIVATE pthread dl)
        target_compile_definitions(${HOST} PRIVATE PLATFORM_LINUX)
    endif()
endforeach()

add_dependencies(papi_test_host hello)

enable_testing()
add_test(NAME papi_test
    COMMAND papi_test_host $<TARGET_FILE:hello> ${CMAKE_CURRENT_SOURCE_DIR}/test.js
)
add_test(NAME papi_test_static
    COMMAND papi_test_host_static linked ${CMAKE_CURRENT_SOURCE_DIR}/test.js
)
add_test(NAME papi_test_v8
    COMMAND papi_test_host_v8 linked ${CMAKE_CURRENT_SOURCE_DIR}/test.js
)
