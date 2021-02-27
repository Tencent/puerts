mkdir build64qjs & pushd build64qjs
cmake -DJS_ENGINE=quickjs -G "Visual Studio 16 2019" -A x64 ..
popd
cmake --build build64qjs --config Release
md ..\Assets\Plugins\x86_64
copy build64qjs\Release\puerts.dll ..\Assets\Plugins\x86_64
