cmake_minimum_required(VERSION 3.10)

option ( MD "MD" OFF )

if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID)
    if (MD)
        set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} /MD" CACHE STRING "")
        set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} /MDd" CACHE STRING "")
        set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /MD" CACHE STRING "")
        set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} /MDd" CACHE STRING "")
    else ()
        set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} /MT" CACHE STRING "")
        set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} /MTd" CACHE STRING "")
        set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /MT" CACHE STRING "")
        set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} /MTd" CACHE STRING "")
    endif ()
endif ()

project(v8qjs)

if (APPLE AND NOT IOS)
   set(CMAKE_OSX_DEPLOYMENT_TARGET "10.9" CACHE STRING "Minimum OS X deployment version")
endif()

set(qjs_cflags -Wall)

set (CMAKE_CXX_STANDARD 14)

include_directories(
    ../include
    ../quickjs
)

add_library(v8qjs STATIC
        ../src/v8-impl.cc
        )

target_compile_options(v8qjs PRIVATE ${qjs_cflags})
target_compile_definitions(v8qjs PRIVATE
        _GNU_SOURCE
        CONFIG_BIGNUM
        )



