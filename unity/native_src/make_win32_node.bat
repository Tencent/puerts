mkdir build32nodejs & pushd build32qjs
cmake -DJS_ENGINE=nodejs -G "Visual Studio 16 2019" -A Win32 ..
popd
cmake --build build32nodejs --config Release
md ..\Assets\Plugins\x86
copy build32nodejs\Release\puerts.dll ..\Assets\Plugins\x86
copy quickjs\Lib\Win32\*.dll ..\Assets\Plugins\x86
