# Tencent is pleased to support the open source community by making xLua available.
# Copyright (C) 2016 Tencent. All rights reserved.
# Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
# http://opensource.org/licenses/MIT
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

cmake_minimum_required(VERSION 3.15)
project(PApiPython LANGUAGES C CXX)

# 设置 C++ 标准为 C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)  # 确保编译器支持 C++17

# 1. 下载 GoogleTest
include(FetchContent)
FetchContent_Declare(
  googletest
  # GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_REPOSITORY git@github.com:google/googletest.git
  GIT_TAG        v1.15.0   # 2025-05 最新 tag
)
set(gtest_force_shared_crt ON CACHE BOOL "")
FetchContent_MakeAvailable(googletest)


# 2.  创建库(含被测代码与其所需外部静态编译库）
# 收集 extra/src 下的所有 .cpp
file(GLOB EXTRA_SRC "puerts/source/*.cpp")

add_library(mylib STATIC
    source/PyImpl.cpp
    ${EXTRA_SRC}
)

# 3. Python-C接口配置（手动定义）
# 这个命令会设置以下变量?实际不可行！
# PYTHON_INCLUDE_DIRS：包含 Python 头文件的路径。
# PYTHON_LIBRARIES：Python 库的路径。
# find_package(PythonLibs 3.9 REQUIRED)
set(PYTHON_INCLUDE_DIRS "D:/software/program files/python-3.9.5/include")
set(PYTHON_LIBRARIES "D:/software/program files/python-3.9.5/libs/python39_d.lib")

# 把头文件目录挂到库上
# 编译器会在给定路径下自动递归查找.h文件（可多级嵌套）
target_include_directories(mylib PUBLIC
    include
    puerts/include
    EASTL/include
    ${PYTHON_INCLUDE_DIRS}
)

# 4. 测试可执行文件
add_executable(unit_tests gtest.cpp)
target_link_libraries(unit_tests PRIVATE
                      mylib
                      ${PYTHON_LIBRARIES}
                      gtest_main)   # 自带 main


# 5. 自动发现测试(ctest命令运行测试)
enable_testing()
include(GoogleTest)
gtest_discover_tests(unit_tests)

