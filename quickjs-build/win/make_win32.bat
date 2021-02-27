mkdir build & pushd build
cmake -S ..\CMakeLists.win.txt -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -G "Visual Studio 16 2019" -A Win32 ..
popd
cmake --build build --config Release
pause
