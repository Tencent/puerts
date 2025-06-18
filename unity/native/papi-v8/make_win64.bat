@echo off
setlocal enabledelayedexpansion

set CONFIG=RelWithDebInfo
if not "%1"=="" (
    set CONFIG=%1
)

mkdir build & pushd build

cmake -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -G "Visual Studio 16 2019" -A x64 -DBACKEND_DEFINITIONS="V8_94_OR_NEWER;WITH_INSPECTOR" -DBACKEND_LIB_NAMES="/Lib/Win64/wee8.lib" -DBACKEND_INC_NAMES="/Inc"  ..

popd
cmake --build build --config %CONFIG%
pause
