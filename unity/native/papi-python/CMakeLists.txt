cmake_minimum_required(VERSION 3.10)

project(PesapiPythonImpl)

# Find Python
find_package(Python3 COMPONENTS Interpreter Development REQUIRED)

# Include directories
include_directories(${Python3_INCLUDE_DIRS})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/../include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/../../puerts/include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/../puerts/include)

# Source files
set(SOURCE_FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/source/PesapiPythonImpl.cpp
)

# Create library
add_library(PesapiPythonImpl SHARED ${SOURCE_FILES})

# Link libraries
target_link_libraries(PesapiPythonImpl ${Python3_LIBRARIES})

# Set output directory
set_target_properties(PesapiPythonImpl PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/../../../../build
)

# Add executable for testing
add_executable(test_pesapi_python_all tests/test_pesapi_python_all.cpp)
target_link_libraries(test_pesapi_python_all PesapiPythonImpl ${Python3_LIBRARIES})
