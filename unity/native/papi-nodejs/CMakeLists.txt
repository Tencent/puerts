# Tencent is pleased to support the open source community by making xLua available.
# Copyright (C) 2016 Tencent. All rights reserved.
# Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
# http://opensource.org/licenses/MIT
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)

project(PApiNodejs LANGUAGES C CXX)

include(CheckCCompilerFlag)


if("${JS_ENGINE}" MATCHES "^v8_10.6.194")
    set(CMAKE_CXX_STANDARD 17)
else ()
    set(CMAKE_CXX_STANDARD 14)
endif ()

if ( IOS )
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fembed-bitcode")
        set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fembed-bitcode")
endif ()

find_path(PUERTS_PROJECT_DIR NAMES SConstruct
    PATHS 
    ${PROJECT_SOURCE_DIR}
    NO_DEFAULT_PATH
)

MARK_AS_ADVANCED(PUERTS_PROJECT_DIR)

if ( NOT DEFINED JS_ENGINE )
    set(JS_ENGINE v8)
endif()

# 添加puerts子项目并显式指定二进制目录
add_subdirectory(../puerts ${CMAKE_CURRENT_BINARY_DIR}/puerts)

set(BACKEND_ROOT ${PROJECT_SOURCE_DIR}/.backends/${JS_ENGINE})

set(ThirdParty ${PROJECT_SOURCE_DIR}/../../../unreal/Puerts/ThirdParty)

if(NOT ("${JS_ENGINE}" STREQUAL "quickjs"))
    string (REPLACE ";" "$<SEMICOLON>${BACKEND_ROOT}" BACKEND_INC_NAMES "${BACKEND_ROOT}${BACKEND_INC_NAMES}")
    string (REPLACE ";" "$<SEMICOLON>${BACKEND_ROOT}" BACKEND_LIB_NAMES "${BACKEND_ROOT}${BACKEND_LIB_NAMES}")
endif()
string (REPLACE ";" "$<SEMICOLON>" BACKEND_DEFINITIONS "${BACKEND_DEFINITIONS}")

include_directories(
    ${PROJECT_SOURCE_DIR}
    ${ThirdParty}/Include/websocketpp
    ${ThirdParty}/Include/asio
    include
    ${PROJECT_SOURCE_DIR}/../../../unreal/Puerts/Source/JsEnv/Private
    ${BACKEND_INC_NAMES}
    ${PROJECT_SOURCE_DIR}/../puerts/include
)

set ( PUERTS_INC
    include/Common.h
    include/BackendEnv.h
    include/JSEngine.h
    include/V8Utils.h
    ${PROJECT_SOURCE_DIR}/../../../unreal/Puerts/Source/JsEnv/Private/V8InspectorImpl.h
    ${PROJECT_SOURCE_DIR}/../../../unreal/Puerts/Source/JsEnv/Private/PromiseRejectCallback.hpp
)

set ( PUERTS_SRC
    source/PapiExport.cpp
    source/BackendEnv.cpp
    source/JSEngine.cpp
    source/CppObjectMapper.cpp
    source/DataTransfer.cpp
    source/PesapiV8Impl.cpp
    ${PROJECT_SOURCE_DIR}/../../../unreal/Puerts/Source/JsEnv/Private/V8InspectorImpl.cpp
)

set(PUERTS_COMPILE_DEFINITIONS)

list(APPEND PUERTS_COMPILE_DEFINITIONS USING_PUERTS_API_SHARED)


if ( APPLE )
    if ( IOS )
        set(CMAKE_OSX_ARCHITECTURES "$(ARCHS_STANDARD)")
        add_library(PapiNodejs STATIC
           ${PUERTS_SRC} ${PUERTS_INC}
        )
		set_xcode_property (PapiNodejs IPHONEOS_DEPLOYMENT_TARGET "7.0" "all")
    else ()
        add_library(PapiNodejs SHARED
            ${PUERTS_SRC} ${PUERTS_INC}
        )
        target_link_options(
            PapiNodejs 
            PRIVATE "-Wl,-rpath,@loader_path/${CMAKE_OSX_ARCHITECTURES}/"
            PRIVATE "-Wl,-rpath,@loader_path/"
        )
    endif ()
elseif ( SWITCH_PLATFORM )
    add_library(PapiNodejs STATIC
        ${PUERTS_SRC} ${PUERTS_INC}
    )
else ()
    if (CMAKE_SYSTEM_NAME MATCHES "Emscripten") 
        add_library(PapiNodejs STATIC
            ${PUERTS_SRC} ${PUERTS_INC}
        )
    else ()
        add_library(PapiNodejs SHARED
            ${PUERTS_SRC} ${PUERTS_INC}
        )
   endif ()
endif ()

if ( WIN32 AND NOT CYGWIN )
    list(APPEND PUERTS_COMPILE_DEFINITIONS BUILDING_V8_SHARED)
endif ()

if ( NOT CMAKE_BUILD_TYPE MATCHES "Release" )
    list(APPEND PUERTS_COMPILE_DEFINITIONS PUERTS_DEBUG)
endif ()

if ( MSYS OR WIN32 )
    if ( WIN32 ) 
        target_link_libraries(PapiNodejs
            winmm.lib
            dbghelp.lib
            shlwapi.lib
        )
    endif ()

    # definition
    list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_WINDOWS)
elseif ( OHOS )
    set(BACKEND_LIB_NAMES "-Wl,--whole-archive$<SEMICOLON>${BACKEND_LIB_NAMES}$<SEMICOLON>-Wl,--no-whole-archive")
    list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_OHOS)
    if ( OHOS_ARCH STREQUAL "armeabi-v7a")
        # definition
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_OHOS_ARM)

    elseif ( OHOS_ARCH STREQUAL "arm64-v8a")
        # definition
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_OHOS_ARM64)
    else ()
        # definition
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_OHOS_x64)
    endif ()
elseif ( ANDROID )

    find_library(log-lib log)
    target_link_libraries(PapiNodejs
        ${log-lib}
    )

    set(BACKEND_LIB_NAMES "-Wl,--whole-archive$<SEMICOLON>${BACKEND_LIB_NAMES}$<SEMICOLON>-Wl,--no-whole-archive")
    if ( ANDROID_ABI STREQUAL "armeabi-v7a")
        # definition
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_ANDROID_ARM)

    elseif ( ANDROID_ABI STREQUAL "arm64-v8a")
        # link
        target_link_libraries(PapiNodejs
            ${log-lib}
        )
        
        # definition
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_ANDROID_ARM64)
    else ()

        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_ANDROID_x64)
    endif ()
    
    target_link_options(PapiNodejs PRIVATE -s)

    #set_target_properties( puerts PROPERTIES LINK_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/android_version.script)
    #set (CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,--gc-sections -Wl,--version-script=${CMAKE_CURRENT_SOURCE_DIR}/android_version.script")
    #set (CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,--gc-sections")
    #add_custom_command(TARGET puerts POST_BUILD
    #        COMMAND "${ANDROID_TOOLCHAIN_PREFIX}strip" -g -S -d --strip-debug --verbose
    #        "${CMAKE_BINARY_DIR}/libpuerts.so"
    #        COMMENT "Strip debug symbols done on final binary.")

elseif ( APPLE )

    if ( IOS )
        #definition
        if(PLATFORM STREQUAL "SIMULATOR64")
            list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_IOS_SIMULATOR)
            message(STATUS "SIMULATOR64 BUILD...")
        else ()
            list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_IOS)
        endif ()

    else ()
    
        #definition
        if ( DEFINED PLATFORM_MAC_ARM64 )
            list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_MAC_ARM64)
        endif()
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_MAC)
    endif ()

elseif (UNIX)
    # link
    target_link_libraries(PapiNodejs pthread)
    
    # definition
    list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_LINUX)
    if (NOT ("${JS_ENGINE}" STREQUAL "papi-nodejs") AND NOT (CMAKE_SYSTEM_NAME MATCHES "Emscripten"))
        set(CMAKE_CXX_COMPILER "clang++")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -stdlib=libc++")
        set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -stdlib=libc++ -lc++abi")
    endif ()
endif ()


# link
target_link_libraries(PapiNodejs
    ${BACKEND_LIB_NAMES}
    PuertsCore
)
list(APPEND PUERTS_COMPILE_DEFINITIONS ${BACKEND_DEFINITIONS})

target_compile_definitions (PapiNodejs PUBLIC ${PUERTS_COMPILE_DEFINITIONS})

if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID AND NOT MSYS)
	set_property(TARGET PapiNodejs PROPERTY
             MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif ()
