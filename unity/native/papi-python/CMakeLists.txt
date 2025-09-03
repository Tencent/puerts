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

#构建PuertsCore静态库
add_subdirectory(../puerts ${CMAKE_CURRENT_BINARY_DIR}/puerts)

set(Python3_EXECUTABLE "C:/Users/wf200/AppData/Local/Programs/Python/Python39/python.exe")
find_package(Python3 COMPONENTS Interpreter Development REQUIRED)
if (CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(Python3_LIBRARIES "C:/Users/wf200/AppData/Local/Programs/Python/Python39/libs/python39_d.lib")
else()
    set(Python3_LIBRARIES "C:/Users/wf200/AppData/Local/Programs/Python/Python39/libs/python39.lib")
endif()
message(STATUS "Found Python3: ${Python3_EXECUTABLE} (found version \"${Python3_VERSION}\")")
message(STATUS "Python3_LIBRARIES: ${Python3_LIBRARIES}")
message(STATUS "Python3_INCLUDE_DIRS: ${Python3_INCLUDE_DIRS}")

include_directories(
        ${CMAKE_SOURCE_DIR}
        ${CMAKE_CURRENT_BINARY_DIR}
        include
        ${Python3_INCLUDE_DIRS}
)

#第二个include引入头文件，PuertsCore只包含EASTL和puerts的源文件（cpp）
include_directories(../EASTL/include)
include_directories(${PROJECT_SOURCE_DIR}/../puerts/include)

add_definitions(-DEASTL_OPENSOURCE=1)

#EASTL_HEADS用不到，EASTL_SRC用不到
file(GLOB EASTL_SRC "../EASTL/source/*.cpp")
file(GLOB_RECURSE EASTL_HEADS "../EASTL/include/EASTL/**.h")

set(PAPI_SRC
        source/PapiPythonImpl.cpp
        source/CppObjectMapperPython.cpp
)

add_library(PapiPython SHARED 
	${PAPI_SRC})

target_link_libraries(PapiPython
        ${Python3_LIBRARIES}
        PuertsCore
	Ws2_32.lib
	Version.lib
	Pathcch.lib
)

target_compile_definitions(PapiPython PRIVATE EASTL_DLL USING_EASTL)
target_compile_definitions(PapiPython PRIVATE Py_NO_ENABLE_SHARED)
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
		$<$<CONFIG:DEBUG>:/MTd>
        	$<$<CONFIG:RELEASE>:/MT>
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

# 添加 post_build 脚本
# 在构建完成后自动将 PuertsCore.dll 复制到 papi_py_test.exe 所在的目录中
message(STATUS "binary dir:${CMAKE_CURRENT_BINARY_DIR}")
add_custom_command(TARGET papi_py_test POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        ${CMAKE_CURRENT_BINARY_DIR}/puerts/Debug/PuertsCore.dll
        $<TARGET_FILE_DIR:papi_py_test>
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