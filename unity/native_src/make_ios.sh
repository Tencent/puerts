mkdir -p build_ios && cd build_ios
cmake -DCMAKE_TOOLCHAIN_FILE=../cmake/ios.toolchain.cmake -DPLATFORM=OS64 -GXcode ../
cd ..
cmake --build build_ios --config Release
mkdir -p ../Assets/Plugins/iOS/
cp build_ios/Release-iphoneos/libpuerts.a ../Assets/Plugins/iOS/
cp v8/Lib/iOS/arm64/*.a ../Assets/Plugins/iOS/

