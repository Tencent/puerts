mkdir -p build_ios && cd build_ios
cmake -DCMAKE_TOOLCHAIN_FILE=../cmake/ios.toolchain.cmake -DPLATFORM=OS64 -GXcode ../
cd ..
cmake --build build_ios --config Release
mkdir -p ~/qjs/Lib/iOS/arm64/
cp build_ios/Release-iphoneos/libquickjs.a ~/qjs/Lib/iOS/arm64/

