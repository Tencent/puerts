mkdir -p build_ios_qjs && cd build_ios_qjs
cmake -DJS_ENGINE=quickjs -DCMAKE_TOOLCHAIN_FILE=../cmake/ios.toolchain.cmake -DPLATFORM=OS64 -GXcode ../
cd ..
cmake --build build_ios_qjs --config Release
mkdir -p ../Assets/Plugins/iOS/
cp build_ios_qjs/Release-iphoneos/libpuerts.a ../Assets/Plugins/iOS/
cp quickjs/Lib/iOS/arm64/*.a ../Assets/Plugins/iOS/

