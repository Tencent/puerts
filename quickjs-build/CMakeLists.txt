cmake_minimum_required(VERSION 3.10)

project(quickjs)

if (APPLE AND NOT IOS)
   set(CMAKE_OSX_DEPLOYMENT_TARGET "10.9" CACHE STRING "Minimum OS X deployment version")
endif()

set(qjs_cflags -Wall)
if(CMAKE_C_COMPILER_ID MATCHES "AppleClang|Clang")
    list(APPEND qjs_cflags
            -Wextra
            -Wno-sign-compare
            -Wno-missing-field-initializers
            -Wno-unused-parameter
            -Wno-unused-variable
            -funsigned-char)
else()
    list(APPEND qjs_cflags
            -Wno-array-bounds
            -Wno-unused-variable
            -Wno-unused-but-set-variable)
endif()

set(SRC_FILES
        quickjs/cutils.c
        quickjs/libbf.c
        quickjs/libregexp.c
        quickjs/libunicode.c
        quickjs/quickjs.c
        )
if ( ANDROID OR APPLE OR (MSYS AND NOT WIN_DLL) )
    list(APPEND SRC_FILES src/v8-impl.cc)
endif()

file(STRINGS "quickjs/VERSION" QJS_VERSION_STR)

set (CMAKE_CXX_STANDARD 14)

include_directories(
    include
    quickjs
)

if ( MSYS )
    if ( WIN_DLL )
        add_library(quickjs SHARED ${SRC_FILES})
    else ()
        add_library(quickjs STATIC ${SRC_FILES})
    endif()
    target_compile_definitions(quickjs PRIVATE
        _GNU_SOURCE
        CONFIG_BIGNUM
        CONFIG_VERSION="\\\"${QJS_VERSION_STR}\\\""
        )
else()
    add_library(quickjs STATIC ${SRC_FILES})
    target_compile_definitions(quickjs PRIVATE
        _GNU_SOURCE
        CONFIG_BIGNUM
        CONFIG_VERSION="${QJS_VERSION_STR}"
        )
endif()

#set_target_properties(quickjs PROPERTIES
#        C_STANDARD 99
#        C_STANDARD_REQUIRED ON
#        )
target_compile_options(quickjs PRIVATE ${qjs_cflags})
if (CMAKE_BUILD_TYPE MATCHES Debug)
    target_compile_definitions(quickjs PRIVATE
            DUMP_LEAKS
            )
endif()

target_include_directories(quickjs PUBLIC ${CMAKE_SOURCE_DIR})
if ("${CMAKE_CXX_COMPILER_ID}" STREQUAL "GNU")
    target_link_libraries(quickjs atomic)
endif()
