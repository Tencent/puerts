mkdir build64 & pushd build64
cmake -G "Visual Studio 16 2019" -A x64 ..
popd
cmake --build build64 --config Release
md ..\Assets\Plugins\x86_64
copy build64\Release\puerts.dll ..\Assets\Plugins\x86_64
