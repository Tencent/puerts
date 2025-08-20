cmake_minimum_required(VERSION 3.16)
project(pesapi_python)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Python
find_package(Python3 COMPONENTS Development REQUIRED)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/include/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../puerts/include
    ${CMAKE_CURRENT_SOURCE_DIR}/../native_src/Inc
)

# Source files
set(SOURCES
    source/PesapiPythonImpl.cpp
    source/CppObjectMapperPython.cpp
)

# Create shared library
add_library(pesapi_python SHARED ${SOURCES})

# Link libraries
target_link_libraries(pesapi_python
    Python3::Python
)

# Set output directory
set_target_properties(pesapi_python PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
)

# Platform specific settings
if(WIN32)
    target_compile_definitions(pesapi_python PRIVATE
        WIN32_LEAN_AND_MEAN
        _WIN32_WINNT=0x0601
    )
elseif(APPLE)
    target_compile_definitions(pesapi_python PRIVATE
        _DARWIN_C_SOURCE
    )
endif()

# Compiler specific settings
if(MSVC)
    target_compile_options(pesapi_python PRIVATE /W4)
else()
    target_compile_options(pesapi_python PRIVATE -Wall -Wextra)
endif()
