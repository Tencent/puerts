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

# Android Python configuration
if(ANDROID)
    # Determine Python package directory based on Android ABI
    if(ANDROID_ABI STREQUAL "arm64-v8a")
        set(PYTHON_ANDROID_PACKAGE "python-3.14.0-aarch64-linux-android")
    elseif(ANDROID_ABI STREQUAL "armeabi-v7a")
        set(PYTHON_ANDROID_PACKAGE "python-3.14.0-armv7a-linux-androideabi")
    elseif(ANDROID_ABI STREQUAL "x86")
        set(PYTHON_ANDROID_PACKAGE "python-3.14.0-i686-linux-android")
    else() # x86_64 or default
        set(PYTHON_ANDROID_PACKAGE "python-3.14.0-x86_64-linux-android")
    endif()
    
    # Set the path to your Android Python package
    set(PYTHON_ANDROID_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/${PYTHON_ANDROID_PACKAGE}/prefix")
    
    # Set Python include directories
    set(Python3_INCLUDE_DIRS "${PYTHON_ANDROID_ROOT}/include/python3.14")
    
    # Set Python library
    set(Python3_LIBRARIES "${PYTHON_ANDROID_ROOT}/lib/libpython3.14.so")
    
    # Verify the paths exist
    if(NOT EXISTS ${Python3_INCLUDE_DIRS})
        message(FATAL_ERROR "Python include directory not found: ${Python3_INCLUDE_DIRS}\n"
                "Please download the Python Android package for ${ANDROID_ABI} from:\n"
                "https://www.python.org/downloads/")
    endif()
    
    if(NOT EXISTS ${Python3_LIBRARIES})
        message(FATAL_ERROR "Python library not found: ${Python3_LIBRARIES}")
    endif()
    
    message(STATUS "Building for Android ABI: ${ANDROID_ABI}")
    message(STATUS "Using Android Python package: ${PYTHON_ANDROID_PACKAGE}")
    message(STATUS "Python root: ${PYTHON_ANDROID_ROOT}")
    message(STATUS "Python include dir: ${Python3_INCLUDE_DIRS}")
    message(STATUS "Python library: ${Python3_LIBRARIES}")
else()
    # For other platforms, use find_package
	if("${Python3_VERSION}" MATCHES "3.14")
	    message(STATUS "Python VERSION == ${Python3_VERSION}")
        find_package(Python3 ${Python3_VERSION} COMPONENTS Interpreter Development REQUIRED)
    else ()
	    message(STATUS "Python VERSION != 3.14")
	    find_package(Python3 COMPONENTS Interpreter Development REQUIRED)
	endif()
endif()

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
        source/PapiExport.cpp
)

add_library(PapiPython SHARED ${PAPI_SRC})

target_link_libraries(PapiPython
        ${Python3_LIBRARIES}
        PuertsCore
)

# Link Android system libraries when building for Android
if(ANDROID)
    # Ensure minimum API level for required symbols
    if(NOT ANDROID_PLATFORM)
        set(ANDROID_PLATFORM android-24)
    endif()
    
    target_link_libraries(PapiPython
            log        # For __android_log_write
            c          # For libc functions (stdin, stdout, stderr, etc.)
            dl         # For dynamic loading
    )
    
    # Set linker flags to handle versioned symbols and hash style
    target_link_options(PapiPython PRIVATE
            -Wl,--hash-style=both    # Support both sysv and gnu hash for compatibility
            -Wl,--no-undefined
            -Wl,--as-needed
    )
endif()

if(UNIX AND NOT APPLE AND NOT ANDROID)
    target_link_libraries(PapiPython dl)
endif()

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