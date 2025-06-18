cmake_minimum_required(VERSION 3.9)

project(Puerts LANGUAGES C CXX)

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

set(puerts_sources
    source/JSClassRegister.cpp
    source/pesapi_wrap.c
    source/PesapiRegister.cpp
    source/Puerts.cpp
    source/Log.cpp
)

add_definitions(-D_CHAR16T)
add_definitions(-D_CRT_SECURE_NO_WARNINGS)
add_definitions(-D_SCL_SECURE_NO_WARNINGS)
add_definitions(-DEASTL_OPENSOURCE=1)

include_directories(include)
include_directories(../EASTL/include)

file(GLOB eastl_sources "../EASTL/source/*.cpp")
file(GLOB_RECURSE eastl_headers "../EASTL/include/EASTL/**.h")


if ( APPLE AND IOS )
    add_library(puerts STATIC ${puerts_sources} ${eastl_sources})
else ()
    add_library(puerts SHARED ${puerts_sources} ${eastl_sources}) # if add eastl_headers will undefined symbol: __udivti3 __udivmodti4 
endif()

target_compile_definitions(puerts PUBLIC BUILDING_PUERTS_API_SHARED)

target_compile_definitions(puerts PUBLIC EA_DEPRECATIONS_FOR_2024_APRIL=EA_DISABLED)
target_compile_definitions(puerts PUBLIC EA_DEPRECATIONS_FOR_2024_SEPT=EA_DISABLED)
target_compile_definitions(puerts PUBLIC EA_DEPRECATIONS_FOR_2025_APRIL=EA_DISABLED)
#target_compile_definitions(PapiQjs PUBLIC EASTL_DLL)
target_compile_options(puerts PRIVATE
    $<$<OR:$<CXX_COMPILER_ID:GNU>,$<CXX_COMPILER_ID:Clang>>:
        -fno-exceptions
        -fno-unwind-tables
        -fno-asynchronous-unwind-tables
        -fno-rtti
    >
    $<$<CXX_COMPILER_ID:MSVC>:
        /EHa-  # 禁用异常处理
        /GR-   # 禁用RTTI
    >
)

install(TARGETS puerts DESTINATION ${PROJECT_SOURCE_DIR}/lib)
