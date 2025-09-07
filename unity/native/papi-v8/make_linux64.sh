#!/bin/bash
CONFIG=${1:-Release}

mkdir -p build_linux64 && cd build_linux64
cmake -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DCMAKE_BUILD_TYPE=$CONFIG -DBACKEND_DEFINITIONS="V8_94_OR_NEWER;WITH_INSPECTOR" -DBACKEND_LIB_NAMES="/Lib/Linux/libwee8.a" -DBACKEND_INC_NAMES="/Inc" ..
cd ..
cmake --build build_linux64 --config $CONFIG
