# Tencent is pleased to support the open source community by making xLua available.
# Copyright (C) 2016 THL A29 Limited, a Tencent company. All rights reserved.
# Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
# http://opensource.org/licenses/MIT
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)

project(PuertsPlugin)

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

set(USING_MULT_BACKEND OFF)
if("${JS_ENGINE}" MATCHES "^mult")
    set(USING_MULT_BACKEND ON)
endif()

set(BACKEND_ROOT ${PROJECT_SOURCE_DIR}/../native_src/.backends/${JS_ENGINE})

set(ThirdParty ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/ThirdParty)

string (REPLACE ";" "$<SEMICOLON>${BACKEND_ROOT}" BACKEND_INC_NAMES "${BACKEND_ROOT}${BACKEND_INC_NAMES}")
string (REPLACE ";" "$<SEMICOLON>${BACKEND_ROOT}" BACKEND_LIB_NAMES "${BACKEND_ROOT}${BACKEND_LIB_NAMES}")
string (REPLACE ";" "$<SEMICOLON>" BACKEND_DEFINITIONS "${BACKEND_DEFINITIONS}")

include_directories(
    ${PROJECT_SOURCE_DIR}
    ${ThirdParty}/Include/websocketpp
    ${ThirdParty}/Include/asio
    Inc
    ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private
    ${BACKEND_INC_NAMES}
)

set ( PUERTS_INC
    Inc/Common.h
    Inc/Log.h
    Inc/BackendEnv.h
    Inc/JSEngine.h
    Inc/V8Utils.h
    Inc/JSFunction.h
    Inc/IPuertsPlugin.h
    ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private/V8InspectorImpl.h
    ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private/PromiseRejectCallback.hpp
)


macro(source_group_by_dir proj_dir source_files)
    if(MSVC OR APPLE)
        get_filename_component(sgbd_cur_dir ${proj_dir} ABSOLUTE)
        foreach(sgbd_file ${${source_files}})
			get_filename_component(sgbd_abs_file ${sgbd_file} ABSOLUTE)
            file(RELATIVE_PATH sgbd_fpath ${sgbd_cur_dir} ${sgbd_abs_file})
            string(REGEX REPLACE "\(.*\)/.*" \\1 sgbd_group_name ${sgbd_fpath})
            string(COMPARE EQUAL ${sgbd_fpath} ${sgbd_group_name} sgbd_nogroup)
            string(REPLACE "/" "\\" sgbd_group_name ${sgbd_group_name})
            if(sgbd_nogroup)
                set(sgbd_group_name "\\")
            endif(sgbd_nogroup)
            source_group(${sgbd_group_name} FILES ${sgbd_file})
        endforeach(sgbd_file)
    endif(MSVC OR APPLE)
endmacro(source_group_by_dir)

source_group_by_dir(${CMAKE_CURRENT_SOURCE_DIR} PUERTS_INC)
source_group_by_dir(${CMAKE_CURRENT_SOURCE_DIR} PUERTS_SRC)

if( USING_MULT_BACKEND )
    message("mult backend>>>>>>>>>>>>>>>>>>>>>>>>")
    set ( PUERTS_SRC
        Src/Log.cpp
        Src/PuertsMultBackend.cpp
    )
else ()
    set ( PUERTS_SRC
        Src/Puerts.cpp
        Src/Log.cpp
        Src/BackendEnv.cpp
        Src/JSEngine.cpp
        Src/JSFunction.cpp
        ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private/V8InspectorImpl.cpp
    )
endif()

set(PUERTS_COMPILE_DEFINITIONS)
set(PUERTS_BACKEND_SRC)

if ( WITH_WEBSOCKET )
    list(APPEND PUERTS_COMPILE_DEFINITIONS WITH_WEBSOCKET)
    if (USING_MULT_BACKEND)
        list(APPEND PUERTS_BACKEND_SRC ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private/WebSocketImpl.cpp)
    else ()
        list(APPEND PUERTS_SRC ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private/WebSocketImpl.cpp)
    endif()
endif()

if(DEFINED PUERTS_EXTRA_SRC)
    list(APPEND PUERTS_SRC ${PUERTS_EXTRA_SRC})
endif()

if(DEFINED PUERTS_EXTRA_INC)
    include_directories(${PUERTS_EXTRA_INC})
endif()

if ( APPLE )
    if ( IOS )
        set(CMAKE_OSX_ARCHITECTURES "$(ARCHS_STANDARD)")
        add_library(puerts STATIC
           ${PUERTS_SRC} ${PUERTS_INC}
        )
		set_xcode_property (puerts IPHONEOS_DEPLOYMENT_TARGET "7.0" "all")
    else ()
        if ( NOT DEFINED FOR_SILICON )
            set(CMAKE_OSX_ARCHITECTURES x86_64)
        else ()
            set(CMAKE_OSX_ARCHITECTURES arm64)
        endif ()
        
        add_library(puerts SHARED
            ${PUERTS_SRC} ${PUERTS_INC}
        )
        target_link_options(
            puerts 
            PRIVATE "-Wl,-rpath,@loader_path/${CMAKE_OSX_ARCHITECTURES}/"
            PRIVATE "-Wl,-rpath,@loader_path/"
        )
    endif ()
else ()
    if (CMAKE_SYSTEM_NAME MATCHES "Emscripten") 
        add_library(puerts STATIC
            ${PUERTS_SRC} ${PUERTS_INC}
        )
    else ()
        add_library(puerts SHARED
            ${PUERTS_SRC} ${PUERTS_INC}
        )
   endif ()
endif ()

if ( WITH_WEBSOCKET EQUAL 3 )
    set(OPENSSL_SOURCE_DIR ${CMAKE_CURRENT_BINARY_DIR}/openssl-src) # default path by CMake
    set(OPENSSL_INSTALL_DIR ${CMAKE_CURRENT_BINARY_DIR}/openssl)
    set(OPENSSL_INCLUDE_DIR ${OPENSSL_INSTALL_DIR}/include)
    set(OPENSSL_BUILD_COMMAND make)
    set(OPENSSL_LIBRARY_SUFFIX a)
    set(OPENSSL_CONFIGURE_COMMAND ${OPENSSL_SOURCE_DIR}/config)
    if(WIN32)
        if(CMAKE_SIZEOF_VOID_P EQUAL 4)
            # 32位 Windows
            set(OPENSSL_PLATFORM_CONF_ARG "VC-WIN32")
        elseif(CMAKE_SIZEOF_VOID_P EQUAL 8)
            # 64位 Windows
            set(OPENSSL_PLATFORM_CONF_ARG "VC-WIN64A")
        endif()
        set(OPENSSL_BUILD_COMMAND nmake)
        set(OPENSSL_LIBRARY_SUFFIX lib)
        set(OPENSSL_CONFIGURE_COMMAND perl ${OPENSSL_SOURCE_DIR}/Configure ${OPENSSL_PLATFORM_CONF_ARG})
    endif()

    include(ExternalProject)

    ExternalProject_Add(
      OpenSSL
      SOURCE_DIR ${OPENSSL_SOURCE_DIR}
      GIT_REPOSITORY https://github.com/openssl/openssl.git
      GIT_TAG OpenSSL_1_1_1t
      #GIT_TAG openssl-3.0.5
      USES_TERMINAL_DOWNLOAD TRUE
      CONFIGURE_COMMAND
        ${OPENSSL_CONFIGURE_COMMAND}
        --prefix=${OPENSSL_INSTALL_DIR}
        --openssldir=${OPENSSL_INSTALL_DIR}
      BUILD_COMMAND ${OPENSSL_BUILD_COMMAND}
      TEST_COMMAND ""
      INSTALL_COMMAND ${OPENSSL_BUILD_COMMAND} install
      INSTALL_DIR ${OPENSSL_INSTALL_DIR}
    )

    file(MAKE_DIRECTORY ${OPENSSL_INCLUDE_DIR})

    add_library(OpenSSL::SSL STATIC IMPORTED GLOBAL)
    set_property(TARGET OpenSSL::SSL PROPERTY IMPORTED_LOCATION ${OPENSSL_INSTALL_DIR}/lib/libssl.${OPENSSL_LIBRARY_SUFFIX})
    set_property(TARGET OpenSSL::SSL PROPERTY INTERFACE_INCLUDE_DIRECTORIES ${OPENSSL_INCLUDE_DIR})
    add_dependencies(OpenSSL::SSL OpenSSL)

    add_library(OpenSSL::Crypto STATIC IMPORTED GLOBAL)
    set_property(TARGET OpenSSL::Crypto PROPERTY IMPORTED_LOCATION ${OPENSSL_INSTALL_DIR}/lib/libcrypto.${OPENSSL_LIBRARY_SUFFIX})
    set_property(TARGET OpenSSL::Crypto PROPERTY INTERFACE_INCLUDE_DIRECTORIES ${OPENSSL_INCLUDE_DIR})
    add_dependencies(OpenSSL::Crypto OpenSSL)

    add_dependencies(puerts OpenSSL)
    target_link_libraries(puerts OpenSSL::SSL OpenSSL::Crypto)
    list(APPEND PUERTS_COMPILE_DEFINITIONS WITH_WEBSOCKET_SSL)
endif ()

if ( WITH_WEBSOCKET EQUAL 2 )
    include(FetchContent)

    FetchContent_Declare(
        wolfssl
        GIT_REPOSITORY https://github.com/wolfSSL/wolfssl.git
        GIT_TAG        v5.7.2-stable 
    )
    set(WOLFSSL_EXAMPLES  OFF)
    set(WOLFSSL_CRYPT_TESTS OFF)
    set(BUILD_SHARED_LIBS OFF)
    set(CMAKE_POSITION_INDEPENDENT_CODE ON)

    FetchContent_MakeAvailable(wolfssl)
    
    target_compile_definitions(wolfssl PUBLIC WOLFSSL_OPENSSLEXTRA WOLFSSL_OPENSSLALL OPENSSL_EXTRA OPENSSL_ALL HAVE_EX_DATA WOLFSSL_OPENSSH)
    
    target_link_libraries(puerts wolfssl)
    
    target_include_directories(puerts PRIVATE ${wolfssl_SOURCE_DIR}/wolfssl)

    list(APPEND PUERTS_COMPILE_DEFINITIONS WITH_WEBSOCKET_SSL OPENSSL_EXTRA OPENSSL_ALL WOLFSSL_OPENSSH PUERTS_USE_WOLFSSL)
    
    if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID AND NOT MSYS)
	    set_property(TARGET wolfssl PROPERTY
             MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
    endif ()
endif ()

option ( USING_V8 "using v8" ON )
option ( USING_QJS "using quickjs" ON )
option ( USING_QJS_SUFFIX "add _qjs to namespace of simule v8 api " ON )

if ( USING_MULT_BACKEND )
    # -------------------begin v8 backend-------------------------
    if ( USING_V8)
        add_library(v8backend STATIC
            Src/BackendEnv.cpp
            Src/JSEngine.cpp
            Src/JSFunction.cpp
            ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private/V8InspectorImpl.cpp
            Src/PluginImpl.cpp
            ${PUERTS_BACKEND_SRC}
        )
        target_include_directories (v8backend PRIVATE "${BACKEND_ROOT}/Inc/v8")
        target_compile_definitions (v8backend PRIVATE PUERTS_NAMESPACE=puerts_v8)
        target_compile_definitions (v8backend PRIVATE MULT_BACKENDS)
        target_compile_definitions (v8backend PRIVATE V8_BACKEND)
        set_target_properties(v8backend PROPERTIES POSITION_INDEPENDENT_CODE ON)
        target_link_libraries(puerts v8backend )
        target_compile_definitions (puerts PRIVATE V8_BACKEND)
    endif ()
    # -------------------end v8 backend-------------------------
    
    # -------------------begin qjs backend-------------------------
    if ( USING_QJS)
        add_library(qjsbackend STATIC
            Src/BackendEnv.cpp
            Src/JSEngine.cpp
            Src/JSFunction.cpp
            ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private/V8InspectorImpl.cpp
            Src/PluginImpl.cpp
            ${PUERTS_BACKEND_SRC}
        )
        target_include_directories (qjsbackend PRIVATE "${BACKEND_ROOT}/Inc/quickjs")
        target_compile_definitions (qjsbackend PRIVATE PUERTS_NAMESPACE=puerts_qjs)
        target_compile_definitions (qjsbackend PRIVATE MULT_BACKENDS)
        target_compile_definitions (qjsbackend PRIVATE QJS_BACKEND)
        target_compile_definitions (qjsbackend PRIVATE WITH_QUICKJS)
        target_compile_definitions (qjsbackend PRIVATE WITHOUT_INSPECTOR)
        if (USING_QJS_SUFFIX)
            target_compile_definitions (qjsbackend PRIVATE USING_QJS_SUFFIX)
            target_compile_definitions (qjsbackend PRIVATE CUSTOMV8NAMESPACE=v8_qjs)
        endif ()
        set_target_properties(qjsbackend PROPERTIES POSITION_INDEPENDENT_CODE ON)
        target_link_libraries(puerts qjsbackend )
        target_compile_definitions (puerts PRIVATE QJS_BACKEND)
    endif ()
    # -------------------end qjs backend-------------------------
endif ()

# list(APPEND PUERTS_COMPILE_DEFINITIONS THREAD_SAFE)

if ( WIN32 AND NOT CYGWIN )
    list(APPEND PUERTS_COMPILE_DEFINITIONS BUILDING_V8_SHARED)
endif ()

if ( NOT CMAKE_BUILD_TYPE MATCHES "Release" )
    list(APPEND PUERTS_COMPILE_DEFINITIONS PUERTS_DEBUG)
endif ()

if ( MSYS OR WIN32 )
    if ( WIN32 ) 
        target_link_libraries(puerts
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
    target_link_libraries(puerts
        ${log-lib}
    )

    set(BACKEND_LIB_NAMES "-Wl,--whole-archive$<SEMICOLON>${BACKEND_LIB_NAMES}$<SEMICOLON>-Wl,--no-whole-archive")
    if ( ANDROID_ABI STREQUAL "armeabi-v7a")
        # definition
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_ANDROID_ARM)

    elseif ( ANDROID_ABI STREQUAL "arm64-v8a")
        # link
        target_link_libraries(puerts
            ${log-lib}
        )
        
        # definition
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_ANDROID_ARM64)
    else ()

        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_ANDROID_x64)
    endif ()

    #set_target_properties( puerts PROPERTIES LINK_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/android_version.script)
    #set (CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,--gc-sections -Wl,--version-script=${CMAKE_CURRENT_SOURCE_DIR}/android_version.script")
    #set (CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,--gc-sections")
    add_custom_command(TARGET puerts POST_BUILD
            COMMAND "${ANDROID_TOOLCHAIN_PREFIX}strip" -g -S -d --strip-debug --verbose
            "${CMAKE_BINARY_DIR}/libpuerts.so" -o
            "${CMAKE_BINARY_DIR}/libpuerts.stripped.so~"
            COMMENT "Strip debug symbols done on final binary.")

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
        if ( DEFINED FOR_SILICON )
            list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_MAC_ARM64)
        endif()
        list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_MAC)
    endif ()

elseif (UNIX)
    # link
    target_link_libraries(puerts pthread)
    
    # definition
    list(APPEND PUERTS_COMPILE_DEFINITIONS PLATFORM_LINUX)
    if (NOT ("${JS_ENGINE}" STREQUAL "nodejs_16") AND NOT ("${JS_ENGINE}" STREQUAL "v8_10.6.194") AND NOT (CMAKE_SYSTEM_NAME MATCHES "Emscripten"))
        set(CMAKE_CXX_COMPILER "clang++")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -stdlib=libc++")
        set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -stdlib=libc++ -lc++abi")
    endif ()
endif ()

# link
target_link_libraries(puerts
    ${BACKEND_LIB_NAMES}
)
list(APPEND PUERTS_COMPILE_DEFINITIONS ${BACKEND_DEFINITIONS})

target_compile_definitions (puerts PUBLIC ${PUERTS_COMPILE_DEFINITIONS})
if( USING_MULT_BACKEND )
    if ( USING_V8)
        target_compile_definitions (v8backend PUBLIC ${PUERTS_COMPILE_DEFINITIONS})
        if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID AND NOT MSYS)
            set_property(TARGET v8backend PROPERTY
                     MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
        endif ()
    endif ()
    
    if ( USING_QJS)
        target_compile_definitions (qjsbackend PUBLIC ${PUERTS_COMPILE_DEFINITIONS})
        if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID AND NOT MSYS)
            set_property(TARGET qjsbackend PROPERTY
                     MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
        endif ()
    endif ()
endif ()

if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID AND NOT MSYS)
	set_property(TARGET puerts PROPERTY
             MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif ()

install(TARGETS puerts DESTINATION bin)