mkdir build & pushd build
cmake -DMD=ON -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -G "Visual Studio 15 2017" -A x64 ..
popd
cmake --build build --config Release
pause
