mkdir build64nodejs & pushd build64nodejs
cmake -DJS_ENGINE=nodejs -G "Visual Studio 16 2019" -A x64 ..
popd
cmake --build build64nodejs --config Release
md ..\Assets\Plugins\x86_64
copy build64nodejs\Release\puerts.dll ..\Assets\Plugins\x86_64
copy nodejs\Lib\Win64\*.dll ..\Assets\Plugins\x86_64
