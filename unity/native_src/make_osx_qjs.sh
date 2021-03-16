mkdir -p build_osx_qjs && cd build_osx_qjs
cmake -DJS_ENGINE=quickjs  -GXcode ../
cd ..
cmake --build build_osx_qjs --config Release
mkdir -p ../Assets/Plugins/
cp -r build_osx_qjs/Release/puerts.bundle ../Assets/Plugins/
# cp -r build_osx_qjs/Release/libpuerts.dylib ../general/Bin/