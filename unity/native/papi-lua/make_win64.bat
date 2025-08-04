@echo off
setlocal enabledelayedexpansion

set CONFIG=RelWithDebInfo
if not "%1"=="" (
    set CONFIG=%1
)

mkdir build & pushd build

cmake -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -G "Visual Studio 16 2019" -A x64 ..

popd
cmake --build build --config %CONFIG%
pause
