# Tencent is pleased to support the open source community by making xLua available.
# Copyright (C) 2016 THL A29 Limited, a Tencent company. All rights reserved.
# Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
# http://opensource.org/licenses/MIT
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)

project(V8CC)

if("${JS_ENGINE}" MATCHES "^v8_10.6.194")
    set(CMAKE_CXX_STANDARD 17)
else ()
    set(CMAKE_CXX_STANDARD 14)
endif ()

set(BACKEND_ROOT ${PROJECT_SOURCE_DIR}/../native_src/.backends/${JS_ENGINE})


string (REPLACE ";" "$<SEMICOLON>${BACKEND_ROOT}" BACKEND_INC_NAMES "${BACKEND_ROOT}${BACKEND_INC_NAMES}")
string (REPLACE ";" "$<SEMICOLON>${BACKEND_ROOT}" BACKEND_LIB_NAMES "${BACKEND_ROOT}${BACKEND_LIB_NAMES}")
string (REPLACE ";" "$<SEMICOLON>" BACKEND_DEFINITIONS "${BACKEND_DEFINITIONS}")

include_directories(
    ${PROJECT_SOURCE_DIR}
    ${BACKEND_INC_NAMES}
)

add_executable(v8cc v8cc.cc)


set(V8CC_COMPILE_DEFINITIONS)

if ( WIN32 AND NOT CYGWIN )
    list(APPEND V8CC_COMPILE_DEFINITIONS BUILDING_V8_SHARED)
endif ()

if ( MSYS OR WIN32 )
    if ( WIN32 ) 
        target_link_libraries(v8cc
            winmm.lib
            dbghelp.lib
            shlwapi.lib
        )
    endif ()

    # definition
    list(APPEND V8CC_COMPILE_DEFINITIONS PLATFORM_WINDOWS)
elseif ( APPLE )
    #definition
    list(APPEND V8CC_COMPILE_DEFINITIONS PLATFORM_MAC)
elseif (UNIX)
    # link
    target_link_libraries(v8cc pthread)
    
    # definition
    list(APPEND V8CC_COMPILE_DEFINITIONS PLATFORM_LINUX)
endif ()

# link
target_link_libraries(v8cc ${BACKEND_LIB_NAMES} )
list(APPEND V8CC_COMPILE_DEFINITIONS ${BACKEND_DEFINITIONS})

target_compile_definitions (v8cc PUBLIC ${V8CC_COMPILE_DEFINITIONS})


if ( WIN32 AND NOT CYGWIN AND NOT ( CMAKE_SYSTEM_NAME STREQUAL "WindowsStore" ) AND NOT ANDROID AND NOT MSYS)
	set_property(TARGET v8cc PROPERTY
             MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif ()
