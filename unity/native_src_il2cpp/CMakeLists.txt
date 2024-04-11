# Tencent is pleased to support the open source community by making xLua available.
# Copyright (C) 2016 THL A29 Limited, a Tencent company. All rights reserved.
# Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
# http://opensource.org/licenses/MIT
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)

project(PuertsPlugin)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

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

if ( NOT DEFINED JS_ENGINE )
    set(JS_ENGINE v8)
endif()

set(BACKEND_ROOT ${PROJECT_SOURCE_DIR}/../native_src/.backends/${JS_ENGINE})

set(ThirdParty ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/ThirdParty)

string (REPLACE ";" "$<SEMICOLON>${BACKEND_ROOT}" BACKEND_INC_NAMES "${BACKEND_ROOT}${BACKEND_INC_NAMES}")
string (REPLACE ";" "$<SEMICOLON>${BACKEND_ROOT}" BACKEND_LIB_NAMES "${BACKEND_ROOT}${BACKEND_LIB_NAMES}")
string (REPLACE ";" "$<SEMICOLON>" BACKEND_DEFINITIONS "${BACKEND_DEFINITIONS}")

set(ThirdParty ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/ThirdParty)
include_directories(
    Inc
    ../Assets/core/upm/Plugins/puerts_il2cpp
    ${BACKEND_INC_NAMES}
    ${PROJECT_SOURCE_DIR}/../native_src/Inc
    ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private
    ${ThirdParty}/Include/websocketpp
    ${ThirdParty}/Include/asio
)

set ( PUERTS_INC
    ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private/V8InspectorImpl.h
    ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private/PromiseRejectCallback.hpp
)

set ( PUERTS_SRC
    Src/Puerts.cpp
    Src/PesapiV8Impl.cpp
    Src/PesapiAddonLoad.cpp
    Src/CppObjectMapper.cpp
    Src/DataTransfer.cpp
    Src/JSClassRegister.cpp
    ${PROJECT_SOURCE_DIR}/../native_src/Src/BackendEnv.cpp
    ${PROJECT_SOURCE_DIR}/../../unreal/Puerts/Source/JsEnv/Private/V8InspectorImpl.cpp
)

if(DEFINED PUERTS_EXTRA_SRC)
    list(APPEND PUERTS_SRC ${PUERTS_EXTRA_SRC})
endif()

if(DEFINED PUERTS_EXTRA_INC)
    include_directories(${PUERTS_EXTRA_INC})
endif()

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


if ( APPLE )
    if ( IOS )
        set(CMAKE_OSX_ARCHITECTURES "$(ARCHS_STANDARD)")
        add_library(puerts_il2cpp STATIC
           ${PUERTS_SRC} ${PUERTS_INC}
        )
		set_xcode_property (puerts_il2cpp IPHONEOS_DEPLOYMENT_TARGET "7.0" "all")
    else ()
        if ( NOT DEFINED FOR_SILICON )
            set(CMAKE_OSX_ARCHITECTURES x86_64)
        else ()
            set(CMAKE_OSX_ARCHITECTURES arm64)
        endif ()
        
        set(CMAKE_SKIP_RPATH FALSE)    
        add_link_options(-rpath "@loader_path/")
        add_library(puerts_il2cpp SHARED
            ${PUERTS_SRC} ${PUERTS_INC}
        )
    endif ()
elseif ( ANDROID )
    add_library(puerts_il2cpp STATIC
        ${PUERTS_SRC} ${PUERTS_INC}
    )
else ()
    add_library(puerts_il2cpp SHARED
        ${PUERTS_SRC} ${PUERTS_INC}
    )
endif ()

# target_compile_definitions (puerts_il2cpp PRIVATE THREAD_SAFE)
target_compile_definitions (puerts_il2cpp PRIVATE EXPERIMENTAL_IL2CPP_PUERTS)

if ( WIN32 AND NOT CYGWIN )
    target_compile_definitions (puerts_il2cpp PRIVATE BUILDING_V8_SHARED)
endif ()

if ( NOT CMAKE_BUILD_TYPE MATCHES "Release" )
    target_compile_definitions (puerts_il2cpp PRIVATE PUERTS_DEBUG)
endif ()

if ( MSYS OR WIN32 )
    if ( WIN32 ) 
        target_compile_options(puerts_il2cpp
            PRIVATE 
            $<$<CXX_COMPILER_ID:MSVC>:/bigobj>
        )
        target_link_libraries(puerts_il2cpp
            winmm.lib
            dbghelp.lib
            shlwapi.lib
        )
    endif ()

    # definition
    target_compile_definitions (puerts_il2cpp PRIVATE PLATFORM_WINDOWS)

elseif ( ANDROID )

    find_library(log-lib log)
    target_link_libraries(puerts_il2cpp
        ${log-lib}
    )

    if( ANDROID_ABI STREQUAL "armeabi-v7a")
        # definition
        target_compile_definitions (puerts_il2cpp PRIVATE PLATFORM_ANDROID_ARM)

    else ()
        # link
        target_link_libraries(puerts_il2cpp
            ${log-lib}
        )
        
        # definition
        target_compile_definitions (puerts_il2cpp PRIVATE PLATFORM_ANDROID_ARM64)
    endif ()

    #set_target_properties( puerts_il2cpp PROPERTIES LINK_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/android_version.script)
    #set (CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,--gc-sections -Wl,--version-script=${CMAKE_CURRENT_SOURCE_DIR}/android_version.script")
    #set (CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,--gc-sections")
    # add_custom_command(TARGET puerts_il2cpp POST_BUILD
    #         COMMAND "${ANDROID_TOOLCHAIN_PREFIX}strip" -s --verbose
    #         "${CMAKE_BINARY_DIR}/libpuerts_il2cpp.so" -o
    #         "${CMAKE_BINARY_DIR}/libpuerts_il2cpp.stripped.so~"
    #         COMMENT "Strip debug symbols done on final binary.")
    if (JS_ENGINE STREQUAL "v8_9.4" OR JS_ENGINE STREQUAL "v8")
        add_custom_command(TARGET puerts_il2cpp POST_BUILD
            COMMAND cp ARGS ${BACKEND_LIB_NAMES} ./
            COMMAND cp ARGS ${CMAKE_BINARY_DIR}/libpuerts_il2cpp.a ./libpuerts_il2cpp_tmp.a
            COMMAND ${ANDROID_TOOLCHAIN_PREFIX}ar ARGS -x libpuerts_il2cpp_tmp.a
            COMMAND ${ANDROID_TOOLCHAIN_PREFIX}ar ARGS -rs libwee8.a *.o
            COMMAND mv ARGS libwee8.a ${CMAKE_BINARY_DIR}/libpuerts_il2cpp.a
            COMMAND rm ARGS libpuerts_il2cpp_tmp.a
            COMMAND rm ARGS -f *.o
            COMMENT "combine wee8."
        )
    endif()
elseif ( APPLE )

    if ( IOS )
        #definition
        if(PLATFORM STREQUAL "SIMULATOR64")
            target_compile_definitions (puerts_il2cpp PRIVATE PLATFORM_IOS_SIMULATOR)
            message(STATUS "SIMULATOR64 BUILD...")
        else ()
            target_compile_definitions (puerts_il2cpp PRIVATE PLATFORM_IOS)
        endif ()

    else ()
    
        #definition
        if ( DEFINED FOR_SILICON )
            target_compile_definitions (puerts_il2cpp PRIVATE PLATFORM_MAC_ARM64)
        endif()
        target_compile_definitions (puerts_il2cpp PRIVATE PLATFORM_MAC)
    endif ()

elseif (UNIX)
    # link
    target_link_libraries(puerts_il2cpp pthread)
    
    # definition
    target_compile_definitions (puerts_il2cpp PRIVATE PLATFORM_LINUX)
    if (NOT ("${JS_ENGINE}" STREQUAL "nodejs_16"))
        set(CMAKE_CXX_COMPILER "clang++")
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -stdlib=libc++")
        set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -stdlib=libc++ -lc++abi")
    endif ()
endif ()

# link
target_link_libraries(puerts_il2cpp
    ${BACKEND_LIB_NAMES}
)
target_compile_definitions (puerts_il2cpp PRIVATE ${BACKEND_DEFINITIONS})

if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID AND NOT MSYS)
	set_property(TARGET puerts_il2cpp PROPERTY
             MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif ()

install(TARGETS puerts_il2cpp DESTINATION bin)