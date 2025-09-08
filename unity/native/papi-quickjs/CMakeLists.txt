cmake_minimum_required(VERSION 3.9)

project(PapiQuickjs LANGUAGES C CXX)

include(CheckCCompilerFlag)
include(GNUInstallDirs)

set(CMAKE_C_VISIBILITY_PRESET hidden)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_EXTENSIONS ON)
set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 14)

if(NOT CMAKE_BUILD_TYPE)
    message(STATUS "No build type selected, default to Release")
    set(CMAKE_BUILD_TYPE "Release")
endif()

message(STATUS "Building in ${CMAKE_BUILD_TYPE} mode")
message(STATUS "Building with ${CMAKE_C_COMPILER_ID} ${CMAKE_C_COMPILER_VERSION} on ${CMAKE_SYSTEM}")

macro(xcheck_add_c_compiler_flag FLAG)
    string(REPLACE "-" "" FLAG_NO_HYPHEN ${FLAG})
    check_c_compiler_flag(${FLAG} COMPILER_SUPPORTS_${FLAG_NO_HYPHEN})
    if(COMPILER_SUPPORTS_${FLAG_NO_HYPHEN})
        add_compile_options(${FLAG})
    endif()
endmacro()

#xcheck_add_c_compiler_flag(-Wall)
#if(NOT MSVC AND NOT IOS)
#    xcheck_add_c_compiler_flag(-Werror)
#    xcheck_add_c_compiler_flag(-Wextra)
#endif()
xcheck_add_c_compiler_flag(-Wno-implicit-fallthrough)
xcheck_add_c_compiler_flag(-Wno-sign-compare)
xcheck_add_c_compiler_flag(-Wno-missing-field-initializers)
xcheck_add_c_compiler_flag(-Wno-unused-parameter)
xcheck_add_c_compiler_flag(-Wno-unused-but-set-variable)
xcheck_add_c_compiler_flag(-Wno-array-bounds)
xcheck_add_c_compiler_flag(-Wno-format-truncation)
xcheck_add_c_compiler_flag(-funsigned-char)

# ClangCL is command line compatible with MSVC, so 'MSVC' is set.
if(MSVC)
    xcheck_add_c_compiler_flag(-Wno-unsafe-buffer-usage)
    xcheck_add_c_compiler_flag(-Wno-sign-conversion)
    xcheck_add_c_compiler_flag(-Wno-nonportable-system-include-path)
    xcheck_add_c_compiler_flag(-Wno-implicit-int-conversion)
    xcheck_add_c_compiler_flag(-Wno-shorten-64-to-32)
    xcheck_add_c_compiler_flag(-Wno-reserved-macro-identifier)
    xcheck_add_c_compiler_flag(-Wno-reserved-identifier)
    xcheck_add_c_compiler_flag(-Wdeprecated-declarations)
    xcheck_add_c_compiler_flag(/experimental:c11atomics)
    xcheck_add_c_compiler_flag(/wd4018) # -Wno-sign-conversion
    xcheck_add_c_compiler_flag(/wd4061) # -Wno-implicit-fallthrough
    xcheck_add_c_compiler_flag(/wd4100) # -Wno-unused-parameter
    xcheck_add_c_compiler_flag(/wd4200) # -Wno-zero-length-array
    xcheck_add_c_compiler_flag(/wd4242) # -Wno-shorten-64-to-32
    xcheck_add_c_compiler_flag(/wd4244) # -Wno-shorten-64-to-32
    xcheck_add_c_compiler_flag(/wd4245) # -Wno-sign-compare
    xcheck_add_c_compiler_flag(/wd4267) # -Wno-shorten-64-to-32
    xcheck_add_c_compiler_flag(/wd4388) # -Wno-sign-compare
    xcheck_add_c_compiler_flag(/wd4389) # -Wno-sign-compare
    xcheck_add_c_compiler_flag(/wd4710) # Function not inlined
    xcheck_add_c_compiler_flag(/wd4711) # Function was inlined
    xcheck_add_c_compiler_flag(/wd4820) # Padding added after construct
    xcheck_add_c_compiler_flag(/wd4996) # -Wdeprecated-declarations
    xcheck_add_c_compiler_flag(/wd5045) # Compiler will insert Spectre mitigation for memory load if /Qspectre switch specified
    xcheck_add_c_compiler_flag(/wd4514)
    xcheck_add_c_compiler_flag(/wd4146)
    xcheck_add_c_compiler_flag(/wd4334)
    xcheck_add_c_compiler_flag(-fchar8_t)
    xcheck_add_c_compiler_flag(/Zc:char8_t)
endif()

xcheck_add_c_compiler_flag(-fno-strict-aliasing)

if ( APPLE )
    xcheck_add_c_compiler_flag(-Wno-shorten-64-to-32)
endif()

xcheck_add_c_compiler_flag(-Wno-unused-variable)

# MacOS and GCC 11 or later need -Wno-maybe-uninitialized
# https://github.com/quickjs-ng/quickjs/issues/453
if(APPLE AND CMAKE_C_COMPILER_ID STREQUAL "GNU" AND CMAKE_C_COMPILER_VERSION VERSION_GREATER_EQUAL 11)
    xcheck_add_c_compiler_flag(-Wno-maybe-uninitialized)
endif()

if(CMAKE_SYSTEM_NAME STREQUAL "WASI")
    add_compile_definitions(
        _WASI_EMULATED_PROCESS_CLOCKS
        _WASI_EMULATED_SIGNAL
    )
    add_link_options(
        -lwasi-emulated-process-clocks
        -lwasi-emulated-signal
    )
endif()

if(CMAKE_BUILD_TYPE MATCHES "Debug")
    add_compile_options(-O0)
    xcheck_add_c_compiler_flag(-ggdb)
    xcheck_add_c_compiler_flag(-fno-omit-frame-pointer)
endif()

add_subdirectory(../puerts ${CMAKE_CURRENT_BINARY_DIR}/puerts)

set(qjs_sources
    quickjs/cutils.c
    quickjs/libbf.c
    quickjs/libregexp.c
    quickjs/libunicode.c
    quickjs/quickjs.c
)

set(papi_sources
    source/PapiQuickjsImpl.cpp
    source/CppObjectMapperQuickjs.cpp
    source/BackendEnv.cpp
    source/PapiExport.cpp
)

add_definitions(-D_CHAR16T)
add_definitions(-D_CRT_SECURE_NO_WARNINGS)
add_definitions(-D_SCL_SECURE_NO_WARNINGS)
add_definitions(-DEASTL_OPENSOURCE=1)

include_directories(include quickjs )
include_directories(../EASTL/include)
include_directories(${PROJECT_SOURCE_DIR}/../puerts/include)

file(GLOB eastl_sources "../EASTL/source/*.cpp")
file(GLOB_RECURSE eastl_headers "../EASTL/include/EASTL/**.h")

list(APPEND qjs_defines _GNU_SOURCE)
if(WIN32)
    list(APPEND qjs_defines WIN32_LEAN_AND_MEAN _WIN32_WINNT=0x0602)
endif()
list(APPEND qjs_libs ${CMAKE_DL_LIBS})
find_package(Threads)
if(NOT CMAKE_SYSTEM_NAME STREQUAL "WASI")
    list(APPEND qjs_libs ${CMAKE_THREAD_LIBS_INIT})
endif()
if(NOT MSVC)
    list(APPEND qjs_libs m)
endif()

if ( (APPLE AND IOS) OR SWITCH_PLATFORM OR (CMAKE_SYSTEM_NAME MATCHES "Emscripten") )
    add_library(PapiQuickjs STATIC ${qjs_sources} ${papi_sources})
else ()
    add_library(PapiQuickjs SHARED ${qjs_sources} ${papi_sources}) # if add eastl_headers will undefined symbol: __udivti3 __udivmodti4 
endif()
target_compile_definitions(PapiQuickjs PRIVATE ${qjs_defines})
target_include_directories(PapiQuickjs PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>
    $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
)
target_link_libraries(PapiQuickjs PUBLIC ${qjs_libs} PuertsCore)
#set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -nostdlib")

target_compile_definitions(PapiQuickjs PUBLIC EA_DEPRECATIONS_FOR_2024_APRIL=EA_DISABLED)
target_compile_definitions(PapiQuickjs PUBLIC EA_DEPRECATIONS_FOR_2024_SEPT=EA_DISABLED)
target_compile_definitions(PapiQuickjs PUBLIC EA_DEPRECATIONS_FOR_2025_APRIL=EA_DISABLED)
target_compile_definitions(PapiQuickjs PRIVATE EASTL_DLL USING_EASTL)
target_compile_definitions(PapiQuickjs PUBLIC USING_REGISTER_API_SHARED)
target_compile_options(PapiQuickjs PRIVATE
    $<$<AND:$<COMPILE_LANGUAGE:CXX>,$<OR:$<CXX_COMPILER_ID:GNU>,$<CXX_COMPILER_ID:Clang>>>:
        -fno-exceptions
        -fno-unwind-tables
        -fno-asynchronous-unwind-tables
        -fno-rtti
    >
    $<$<AND:$<COMPILE_LANGUAGE:CXX>,$<CXX_COMPILER_ID:MSVC>>:
        /EHa-  # 禁用异常处理
        /GR-   # 禁用RTTI
    >
)
