# Tencent is pleased to support the open source community by making xLua available.
# Copyright (C) 2016 Tencent. All rights reserved.
# Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
# http://opensource.org/licenses/MIT
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)

project(WSPPAddon LANGUAGES C CXX)

include(CheckCCompilerFlag)

set(CMAKE_CXX_STANDARD 14)

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

set(ThirdParty ${PROJECT_SOURCE_DIR}/../../../unreal/Puerts/ThirdParty)

include_directories(
    ${ThirdParty}/Include/websocketpp
    ${ThirdParty}/Include/asio
    ${PROJECT_SOURCE_DIR}/../puerts/include
)


set ( WSPP_ADDON_SRC
    source/WSPPAddon.cpp
)

set(WSPP_ADDON_COMPILE_DEFINITIONS)

if ( APPLE )
    if ( IOS )
        set(CMAKE_OSX_ARCHITECTURES "$(ARCHS_STANDARD)")
        add_library(WSPPAddon STATIC
           ${WSPP_ADDON_SRC}
        )
		set_xcode_property (WSPPAddon IPHONEOS_DEPLOYMENT_TARGET "7.0" "all")
    else ()
        add_library(WSPPAddon SHARED
            ${WSPP_ADDON_SRC}
        )
        target_link_options(
            WSPPAddon 
            PRIVATE "-Wl,-rpath,@loader_path/${CMAKE_OSX_ARCHITECTURES}/"
            PRIVATE "-Wl,-rpath,@loader_path/"
        )
    endif ()
elseif ( SWITCH_PLATFORM )
    add_library(WSPPAddon STATIC
        ${WSPP_ADDON_SRC}
    )
else ()
    if (CMAKE_SYSTEM_NAME MATCHES "Emscripten") 
        add_library(WSPPAddon STATIC
            ${WSPP_ADDON_SRC}
        )
    else ()
        add_library(WSPPAddon SHARED
            ${WSPP_ADDON_SRC}
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

    add_dependencies(WSPPAddon OpenSSL)
    target_link_libraries(WSPPAddon OpenSSL::SSL OpenSSL::Crypto)
    list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS WITH_WEBSOCKET_SSL)
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
    
    if ( APPLE )
        if ( IOS )
            set(WOLFSSL_SYS_CA_CERTS OFF)
        endif ()
    elseif ( OHOS )
        set(WARNING_C_FLAGS "-Wall -Wextra -Wno-unused")
    endif ()

    FetchContent_MakeAvailable(wolfssl)
    
    if (CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
        target_compile_options(wolfssl PRIVATE 
            -Wno-error=stringop-overflow 
            -Wno-stringop-overflow
        )
    elseif (CMAKE_CXX_COMPILER_ID MATCHES "Clang")
        target_compile_options(wolfssl PRIVATE 
            -Wno-unknown-warning-option
        )
    endif()
    
    target_compile_definitions(wolfssl PUBLIC WOLFSSL_OPENSSLEXTRA WOLFSSL_OPENSSLALL OPENSSL_EXTRA OPENSSL_ALL HAVE_EX_DATA WOLFSSL_OPENSSH)
    
    target_link_libraries(WSPPAddon wolfssl)
    
    target_include_directories(WSPPAddon PRIVATE ${wolfssl_SOURCE_DIR}/wolfssl)

    list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS WITH_WEBSOCKET_SSL OPENSSL_EXTRA OPENSSL_ALL WOLFSSL_OPENSSH PUERTS_USE_WOLFSSL)
    
    if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID AND NOT MSYS)
	    set_property(TARGET wolfssl PROPERTY
             MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
    endif ()
endif ()


if ( WIN32 AND NOT CYGWIN )
    list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS BUILDING_V8_SHARED)
endif ()

if ( NOT CMAKE_BUILD_TYPE MATCHES "Release" )
    list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PUERTS_DEBUG)
endif ()

if ( MSYS OR WIN32 )
    if ( WIN32 ) 
        target_link_libraries(WSPPAddon
            winmm.lib
            dbghelp.lib
            shlwapi.lib
        )
    endif ()

    # definition
    list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_WINDOWS)
elseif ( OHOS )
    set(BACKEND_LIB_NAMES "-Wl,--whole-archive$<SEMICOLON>${BACKEND_LIB_NAMES}$<SEMICOLON>-Wl,--no-whole-archive")
    list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_OHOS)
    if ( OHOS_ARCH STREQUAL "armeabi-v7a")
        # definition
        list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_OHOS_ARM)

    elseif ( OHOS_ARCH STREQUAL "arm64-v8a")
        # definition
        list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_OHOS_ARM64)
    else ()
        # definition
        list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_OHOS_x64)
    endif ()
elseif ( ANDROID )

    find_library(log-lib log)
    target_link_libraries(WSPPAddon
        ${log-lib}
    )

    set(BACKEND_LIB_NAMES "-Wl,--whole-archive$<SEMICOLON>${BACKEND_LIB_NAMES}$<SEMICOLON>-Wl,--no-whole-archive")
    if ( ANDROID_ABI STREQUAL "armeabi-v7a")
        # definition
        list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_ANDROID_ARM)

    elseif ( ANDROID_ABI STREQUAL "arm64-v8a")
        # link
        target_link_libraries(WSPPAddon
            ${log-lib}
        )
        
        # definition
        list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_ANDROID_ARM64)
    else ()

        list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_ANDROID_x64)
    endif ()
    
    if ( CMAKE_BUILD_TYPE MATCHES "Release" )
        target_link_options(WSPPAddon PRIVATE -s)
    endif ()
elseif ( APPLE )

    if ( IOS )
        #definition
        if(PLATFORM STREQUAL "SIMULATOR64")
            list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_IOS_SIMULATOR)
            message(STATUS "SIMULATOR64 BUILD...")
        else ()
            list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_IOS)
        endif ()

    else ()
    
        #definition
        if ( DEFINED PLATFORM_MAC_ARM64 )
            list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_MAC_ARM64)
        endif()
        list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_MAC)
    endif ()

elseif (UNIX)
    # link
    target_link_libraries(WSPPAddon pthread)
    
    # definition
    list(APPEND WSPP_ADDON_COMPILE_DEFINITIONS PLATFORM_LINUX)
endif ()

target_compile_definitions (WSPPAddon PUBLIC ${WSPP_ADDON_COMPILE_DEFINITIONS})

if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID AND NOT MSYS)
	set_property(TARGET WSPPAddon PROPERTY
             MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif ()
