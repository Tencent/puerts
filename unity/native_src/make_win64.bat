mkdir build64 & pushd build64
cmake -G "Visual Studio 15 2017 Win64" ..
popd
cmake --build build64 --config Release
copy build64\Release\puerts.dll ..\Assets\Plugins\x86_64
pause