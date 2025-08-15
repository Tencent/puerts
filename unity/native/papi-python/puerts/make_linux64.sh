#!/bin/bash
CONFIG=${1:-Release}

mkdir -p build_linux64 && cd build_linux64
cmake -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DCMAKE_BUILD_TYPE=$CONFIG ..
cd ..
cmake --build build_linux64 --target install  --config $CONFIG