cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)

project(PuertsPluginTest)

set(CMAKE_CXX_STANDARD 14)
set(PuertsDirectory ${PROJECT_SOURCE_DIR}/..)

add_subdirectory(${PuertsDirectory} puerts)

set(V8_ENGINE ${PuertsDirectory}/${JS_ENGINE})

if ( JS_ENGINE STREQUAL "nodejs")

    if ( APPLE )
        set(LIB_FILE_NAME libnode.83.dylib)
    endif()

    include_directories(    
        ${V8_ENGINE}/include
        ${V8_ENGINE}/deps/v8/include
        ${V8_ENGINE}/deps/uv/include
    )
endif()

if (PUERTS_UT)
    target_compile_definitions (puerts PRIVATE PUERTS_UT)
endif ()

include_directories(
    ${PuertsDirectory}
    ${V8_ENGINE}/Inc
    ${PuertsDirectory}/Inc
    ${PuertsDirectory}/../../unreal/Puerts/Source/JsEnv/Private
)


add_executable(PuertsPluginTest main.cc)

target_link_libraries(PuertsPluginTest PUBLIC puerts)