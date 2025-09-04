cmake_minimum_required(VERSION 3.11)

project(PapiPython LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)

if (NOT CMAKE_BUILD_TYPE)
    message(STATUS "No build type selected, default to Release")
    set(CMAKE_BUILD_TYPE "Release")
endif ()

message(STATUS "Building in ${CMAKE_BUILD_TYPE} mode")
message(STATUS "Building with ${CMAKE_C_COMPILER_ID} ${CMAKE_C_COMPILER_VERSION} on ${CMAKE_SYSTEM}")

if (IOS)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fembed-bitcode")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fembed-bitcode")
endif ()

add_subdirectory(../puerts ${CMAKE_CURRENT_BINARY_DIR}/puerts)

find_package(Python3 COMPONENTS Interpreter Development REQUIRED)

include_directories(
        ${CMAKE_SOURCE_DIR}
        ${CMAKE_CURRENT_BINARY_DIR}
        include
        ${Python3_INCLUDE_DIRS}
)

include_directories(../EASTL/include)
include_directories(${PROJECT_SOURCE_DIR}/../puerts/include)

add_definitions(-DEASTL_OPENSOURCE=1)

file(GLOB EASTL_SRC "../EASTL/source/*.cpp")
file(GLOB_RECURSE EASTL_HEADS "../EASTL/include/EASTL/**.h")

set(PAPI_SRC
        source/PapiPythonImpl.cpp
        source/CppObjectMapperPython.cpp
)

add_library(PapiPython SHARED ${PAPI_SRC})

target_link_libraries(PapiPython
        ${Python3_LIBRARIES}
        PuertsCore
)

target_compile_definitions(PapiPython PRIVATE EASTL_DLL USING_EASTL)
target_compile_definitions(PapiPython PUBLIC EA_DEPRECATIONS_FOR_2024_APRIL=EA_DISABLED)
target_compile_definitions(PapiPython PUBLIC EA_DEPRECATIONS_FOR_2024_SEPT=EA_DISABLED)
target_compile_definitions(PapiPython PUBLIC EA_DEPRECATIONS_FOR_2025_APRIL=EA_DISABLED)

target_compile_options(PapiPython PRIVATE
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

set(BUILD_GMOCK OFF CACHE BOOL "" FORCE)
set(BUILD_GTEST ON CACHE BOOL "" FORCE)
set(INSTALL_GTEST OFF CACHE BOOL "" FORCE)
include(FetchContent)
FetchContent_Declare(
        googletest
        URL https://github.com/google/googletest/archive/03597a01ee50ed33e9dfd640b249b4be3799d395.zip
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

enable_testing()

add_executable(papi_py_test
        test/papi_py_base_test.cpp
        ../puerts/source/ScriptClassRegistry.cpp
        ../puerts/source/PesapiRegister.cpp
)

target_link_libraries(papi_py_test
        PuertsCore
        PapiPython
        GTest::gtest_main
)

add_custom_command(TARGET papi_py_test POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        $<TARGET_FILE:PuertsCore>
        $<TARGET_FILE_DIR:${PROJECT_NAME}>
        COMMENT "Copying PuertsCore.dll to output directory"
)

target_include_directories(papi_py_test PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
        ${CMAKE_CURRENT_SOURCE_DIR}/source
        ${CMAKE_CURRENT_SOURCE_DIR}/../papi-python/include
        ${CMAKE_CURRENT_SOURCE_DIR}/../puerts/include
        ${CMAKE_CURRENT_SOURCE_DIR}/${Python3_INCLUDE_DIRS}
        ${googletest_SOURCE_DIR}/googletest/include
)
include(GoogleTest)

if (CMAKE_VERSION VERSION_GREATER_EQUAL "3.17")
  gtest_discover_tests(papi_py_test DISCOVERY_MODE PRE_TEST)
else()
  gtest_add_tests(TARGET papi_py_test)
endif()