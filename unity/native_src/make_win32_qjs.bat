mkdir build32qjs & pushd build32qjs
cmake -DJS_ENGINE=quickjs -G "Visual Studio 16 2019" -A Win32 ..
popd
cmake --build build32qjs --config Release
pause
