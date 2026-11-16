# Tencent is pleased to support the open source community by making xLua available.
# Copyright (C) 2016 Tencent. All rights reserved.
# Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
# http://opensource.org/licenses/MIT
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)

project(PApiV8 LANGUAGES C CXX)

include(CheckCCompilerFlag)


if("${BACKEND_DEFINITIONS}" MATCHES "V8_129_OR_NEWER")
    set(CMAKE_CXX_STANDARD 20)
elseif ("${BACKEND_DEFINITIONS}" MATCHES "V8_118_OR_NEWER")
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
    ${BACKEND_INC_NAMES}
    ${PROJECT_SOURCE_DIR}/../puerts/include
)

set ( PUERTS_INC
    include/Common.h
    include/BackendEnv.h
    include/JSEngine.h
    include/V8Utils.h
    include/V8InspectorImpl.h
    include/PromiseRejectCallback.hpp
)

set ( PUERTS_SRC
    source/PapiExport.cpp
    source/BackendEnv.cpp
    source/JSEngine.cpp
    source/CppObjectMapper.cpp
    source/DataTransfer.cpp
    source/PesapiV8Impl.cpp
    source/V8InspectorImpl.cpp
)

# Build this translation unit without RTTI to match V8 builds that disable RTTI.
# This prevents emitting `typeinfo for puerts::V8InspectorClientImpl`, which would otherwise reference
# `typeinfo for v8_inspector::V8InspectorClient` and fail to link when V8 is built with -fno-rtti.
if(APPLE OR UNIX)
    set_source_files_properties(
        source/V8InspectorImpl.cpp
        PROPERTIES COMPILE_OPTIONS "-fno-rtti"
    )
endif()

set(PUERTS_COMPILE_DEFINITIONS)

list(APPEND PUERTS_COMPILE_DEFINITIONS USING_PUERTS_API_SHARED)

if ( APPLE )
    if ( IOS )
        set(CMAKE_OSX_ARCHITECTURES "$(ARCHS_STANDARD)")
        add_library(PapiV8 STATIC
           ${PUERTS_SRC} ${PUERTS_INC}
        )
        set_xcode_property (PapiV8 IPHONEOS_DEPLOYMENT_TARGET "7.0" "all")
    else ()
        add_library(PapiV8 SHARED
            ${PUERTS_SRC} ${PUERTS_INC}
        )
        target_link_options(
            PapiV8 
            PRIVATE "-Wl,-rpath,@loader_path/${CMAKE_OSX_ARCHITECTURES}/"
            PRIVATE "-Wl,-rpath,@loader_path/"
        )
    endif ()
elseif ( SWITCH_PLATFORM )
    add_library(PapiV8 STATIC
        ${PUERTS_SRC} ${PUERTS_INC}
    )
else ()
    if (CMAKE_SYSTEM_NAME MATCHES "Emscripten") 
        add_library(PapiV8 STATIC
            ${PUERTS_SRC} ${PUERTS_INC}
        )
    else ()
        add_library(PapiV8 SHARED
            ${PUERTS_SRC} ${PUERTS_INC}
        )
   endif ()
endif ()

if("${BACKEND_DEFINITIONS}" MATCHES "V8_129_OR_NEWER")
  set_target_properties(PapiV8 PROPERTIES
      CXX_STANDARD ${CMAKE_CXX_STANDARD}
      CXX_STANDARD_REQUIRED ON
      CXX_EXTENSIONS OFF
  )
endif()

if ( WIN32 AND NOT CYGWIN )
    list(APPEND PUERTS_COMPILE_DEFINITIONS BUILDING_V8_SHARED)
endif ()

if ( NOT CMAKE_BUILD_TYPE MATCHES "Release" )
    list(APPEND PUERTS_COMPILE_DEFINITIONS PUERTS_DEBUG)
endif ()

if ( MSYS OR WIN32 )
    if ( WIN32 ) 
        target_link_libraries(PapiV8
            winmm.lib
            dbghelp.lib
            shlwapi.lib
        )

        # MSVC keeps __cplusplus at 199711L unless /Zc:__cplusplus is enabled.
        # v8config.h checks __cplusplus directly, so we must enable this.
        target_compile_options(PapiV8 PRIVATE /Zc:__cplusplus)
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
    target_link_libraries(PapiV8
        ${log-lib}
    )

    set(BACKEND_LIB_NAMES "-Wl,--whole-archive$<SEMICOLON>${BACKEND_LIB_NAMES}$<SEMICOLON>-Wl,--no-whole-archive")
    if ( ANDROID_ABI STREQUAL "armeabi-v7a")
        # definition
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_ANDROID_ARM)

    elseif ( ANDROID_ABI STREQUAL "arm64-v8a")
        # link
        target_link_libraries(PapiV8
            ${log-lib}
        )
        
        # definition
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_ANDROID_ARM64)
    else ()

        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_ANDROID_x64)
    endif ()
    
    if ( CMAKE_BUILD_TYPE MATCHES "Release" )
        target_link_options(PapiV8 PRIVATE -s)
    endif ()
    target_link_options(PapiV8 PRIVATE -Wl,-z,max-page-size=16384 -Wl,-z,common-page-size=16384) # android 16K Pagesize

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
        
        if ("${BACKEND_DEFINITIONS}" MATCHES "V8_136_OR_NEWER")
            find_library(CORE_FOUNDATION_LIB CoreFoundation)
            if(CORE_FOUNDATION_LIB)
                target_link_libraries(PapiV8 ${CORE_FOUNDATION_LIB})
            endif()
        endif()
    endif ()

elseif (UNIX)
    # link
    target_link_libraries(PapiV8 pthread)
    
    # definition
    list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_LINUX)
    if (NOT ("${JS_ENGINE}" STREQUAL "nodejs_16") AND NOT ("${JS_ENGINE}" STREQUAL "v8_10.6.194") AND NOT (CMAKE_SYSTEM_NAME MATCHES "Emscripten") AND NOT ("${BACKEND_DEFINITIONS}" MATCHES "V8_118_OR_NEWER"))
        set(CMAKE_CXX_COMPILER "clang++")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -stdlib=libc++")
        set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -stdlib=libc++ -lc++abi")
    endif ()
    if ("${BACKEND_DEFINITIONS}" MATCHES "V8_136_OR_NEWER")
        target_link_libraries(PapiV8
              "-Wl,--no-as-needed"
              atomic
              "-Wl,--as-needed"
            )
    endif()
endif ()


# link
target_link_libraries(PapiV8
    ${BACKEND_LIB_NAMES}
    PuertsCore
)
list(APPEND PUERTS_COMPILE_DEFINITIONS ${BACKEND_DEFINITIONS})

target_compile_definitions (PapiV8 PUBLIC ${PUERTS_COMPILE_DEFINITIONS})

if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID AND NOT MSYS)
    set_property(TARGET PapiV8 PROPERTY
             MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif ()

set(EXPORTED_SYMBOLS
    GetV8PapiVersion
    GetV8PapiEnvRef
    GetV8FFIApi
    CreateV8PapiEnvRef
    DestroyV8PapiEnvRef
    GetV8Isolate
    LowMemoryNotification
    IdleNotificationDeadline
    RequestMinorGarbageCollectionForTesting
    RequestFullGarbageCollectionForTesting
    CreateInspector
    DestroyInspector
    InspectorTick
    LogicTick
    TerminateExecution
)

if(APPLE)  # macOS
    # 生成带下划线前缀的符号列表
    set(MACOS_SYMBOL_FILE "${CMAKE_CURRENT_BINARY_DIR}/symbols_macos.exports")
    file(WRITE ${MACOS_SYMBOL_FILE} "")
    foreach(symbol IN LISTS EXPORTED_SYMBOLS)
        file(APPEND ${MACOS_SYMBOL_FILE} "_${symbol}\n")
    endforeach()
    
    # 设置链接器选项
    target_link_options(PapiV8 PRIVATE 
        "-Wl,-exported_symbols_list,${MACOS_SYMBOL_FILE}"
    )

elseif(UNIX AND NOT APPLE)  # Linux 和 Android
    # 生成版本脚本文件
    set(VERSION_SCRIPT "${CMAKE_CURRENT_BINARY_DIR}/symbols.version")
    file(WRITE ${VERSION_SCRIPT} "V8PAPI_1.0 {\n    global:\n")
    foreach(symbol IN LISTS EXPORTED_SYMBOLS)
        file(APPEND ${VERSION_SCRIPT} "        ${symbol};\n")
    endforeach()
    file(APPEND ${VERSION_SCRIPT} "    local: *;\n};\n")
    
    # 设置链接器选项
    if(ANDROID)
        # Android 需要额外指定链接器类型
        target_link_options(PapiV8 PRIVATE 
            "-Wl,--version-script=${VERSION_SCRIPT}"
            "-Wl,--no-undefined"
        )
    else()
        # Linux
        target_link_options(PapiV8 PRIVATE 
            "-Wl,--version-script=${VERSION_SCRIPT}"
        )
    endif()
endif()