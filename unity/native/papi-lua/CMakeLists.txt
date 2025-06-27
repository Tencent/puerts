# Tencent is pleased to support the open source community by making xLua available.
# Copyright (C) 2016 THL A29 Limited, a Tencent company. All rights reserved.
# Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
# http://opensource.org/licenses/MIT
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

cmake_minimum_required(VERSION 2.8)

if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID)
	set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} /MT" CACHE STRING "")
	set(CMAKE_C_FLAGS_DEBUG "${CMAKE_C_FLAGS_DEBUG} /MTd" CACHE STRING "")
	set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /MT" CACHE STRING "")
	set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} /MTd" CACHE STRING "")
endif ()

project(PapiLua LANGUAGES C CXX)

if ( IOS )
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fembed-bitcode")
        set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fembed-bitcode")
endif ()

find_path(PAPILUA_PROJECT_DIR NAMES SConstruct
    PATHS 
    ${CMAKE_SOURCE_DIR}
    NO_DEFAULT_PATH
    )

MARK_AS_ADVANCED(PAPILUA_PROJECT_DIR)

if (NOT LUA_VERSION)
    set(LUA_VERSION "5.4.8")
endif()

add_subdirectory(../puerts ${CMAKE_CURRENT_BINARY_DIR}/puerts)

set(LUA_SRC_PATH lua-${LUA_VERSION}/src)

set ( LUA_IDSIZE 120 CACHE STRING "gives the maximum size for the description of the source." )

configure_file ( ${LUA_SRC_PATH}/luaconf.h.in ${CMAKE_CURRENT_BINARY_DIR}/luaconf.h )

include_directories(
    ${CMAKE_SOURCE_DIR}
    ${LUA_SRC_PATH}
    ${CMAKE_CURRENT_BINARY_DIR}
    include
)
include_directories(../EASTL/include)
include_directories(${PROJECT_SOURCE_DIR}/../puerts/include)

add_definitions(-DEASTL_OPENSOURCE=1)

aux_source_directory(${LUA_SRC_PATH} LUA_CORE)
list(REMOVE_ITEM LUA_CORE ${LUA_SRC_PATH}/lua.c ${LUA_SRC_PATH}/luac.c)

set(PAPI_SRC
    source/PesapiLuaImpl.cpp
    source/CppObjectMapperLua.cpp
    source/PapiExport.cpp
)


file(GLOB EASTL_SRC "../EASTL/source/*.cpp")
file(GLOB_RECURSE EASTL_HEADS "../EASTL/include/EASTL/**.h")

if (APPLE)
    if (IOS)
        ADD_DEFINITIONS(-DLUA_USE_IOS) # Despite claiming to be ISO C, iOS does not implement 'system'.(iOS11)
        set(CMAKE_OSX_ARCHITECTURES "$(ARCHS_STANDARD)")
        add_library(PapiLua STATIC
           ${LUA_CORE}
           ${PAPI_SRC}
        )
		set_xcode_property (PapiLua IPHONEOS_DEPLOYMENT_TARGET "7.0" "all")
    else ()
        ADD_DEFINITIONS(-DLUA_USE_MACOSX) #osx platform emmylua debugger must have this option or can not load cpath
        add_library(PapiLua SHARED
            ${LUA_CORE}
            ${PAPI_SRC}
        )
    endif ()
elseif ("${CMAKE_SYSTEM_NAME}" STREQUAL "Switch")
    add_library(PapiLua STATIC
        ${LUA_CORE}
        ${PAPI_SRC}
    )
    target_compile_options(PapiLua PRIVATE -m64 -mcpu=cortex-a57+fp+simd+crypto+crc -fno-common -fno-short-enums -ffunction-sections -fdata-sections -fPIC -fms-extensions)
else ( )
    add_library(PapiLua SHARED
        ${LUA_CORE}
        ${PAPI_SRC}
    )
endif ( )

if ( WIN32 AND NOT CYGWIN )
    target_link_libraries(PapiLua
        ws2_32
        PuertsCore
    )
else ( )
    target_link_libraries(PapiLua
        m
        PuertsCore
    )
endif ( )

target_compile_definitions(PapiLua PRIVATE EASTL_DLL USING_EASTL)
target_compile_definitions(PapiLua PRIVATE EASTL_DLL CHAR8_T_DEFINED)
target_compile_definitions(PapiLua PUBLIC EA_DEPRECATIONS_FOR_2024_APRIL=EA_DISABLED)
target_compile_definitions(PapiLua PUBLIC EA_DEPRECATIONS_FOR_2024_SEPT=EA_DISABLED)
target_compile_definitions(PapiLua PUBLIC EA_DEPRECATIONS_FOR_2025_APRIL=EA_DISABLED)

target_compile_options(PapiLua PRIVATE
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
