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

project(PapiLua)

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
    #source/PapiQuickjsImpl.cpp
    #source/CppObjectMapperQuickjs.cpp
    #source/BackendEnv.cpp
    #source/PapiExport.cpp
)


file(GLOB EASTL_SRC "../EASTL/source/*.cpp")
file(GLOB_RECURSE EASTL_HEADS "../EASTL/include/EASTL/**.h")

if (APPLE)
    if (IOS)
        ADD_DEFINITIONS(-DLUA_USE_IOS) # Despite claiming to be ISO C, iOS does not implement 'system'.(iOS11)
        set(CMAKE_OSX_ARCHITECTURES "$(ARCHS_STANDARD)")
        add_library(papilua STATIC
           ${LUA_CORE}
           ${EASTL_SRC}
           ${PAPI_SRC}
        )
		set_xcode_property (papilua IPHONEOS_DEPLOYMENT_TARGET "7.0" "all")
    else ()
        ADD_DEFINITIONS(-DLUA_USE_MACOSX) #osx platform emmylua debugger must have this option or can not load cpath
        if (BUILD_SILICON)
           set(CMAKE_OSX_ARCHITECTURES arm64)

            add_library(papilua SHARED
                ${LUA_CORE}
                ${EASTL_SRC}
                ${PAPI_SRC}
            )
        else ()
            set(CMAKE_OSX_ARCHITECTURES "$(ARCHS_STANDARD_64_BIT)")
            add_library(papilua MODULE
                ${LUA_CORE}
                ${EASTL_SRC}
                ${PAPI_SRC}
            )
            set_target_properties ( papilua PROPERTIES BUNDLE TRUE )
            #set_target_properties ( papilua PROPERTIES FRAMEWORK TRUE )
            #set_target_properties ( papilua PROPERTIES MACOSX_RPATH TRUE )
        endif ()
    endif ()
elseif ("${CMAKE_SYSTEM_NAME}" STREQUAL "Switch")
    add_library(papilua STATIC
        ${LUA_CORE}
        ${EASTL_SRC}
        ${PAPI_SRC}
    )
    target_compile_options(papilua PRIVATE -m64 -mcpu=cortex-a57+fp+simd+crypto+crc -fno-common -fno-short-enums -ffunction-sections -fdata-sections -fPIC -fms-extensions)
else ( )
    add_library(papilua SHARED
        ${LUA_CORE}
        ${EASTL_SRC}
        ${PAPI_SRC}
    )
endif ( )

if ( WIN32 AND NOT CYGWIN )
    target_compile_definitions (papilua PRIVATE LUA_BUILD_AS_DLL)
    target_link_libraries(papilua
        ws2_32
        puerts
    )
else ( )
    target_link_libraries(papilua
        m
        puerts
    )
endif ( )