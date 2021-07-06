mkdir -p build_ios_simulator && cd build_ios_simulator
cmake -DCMAKE_TOOLCHAIN_FILE=../cmake/ios.toolchain.cmake -DPLATFORM=SIMULATOR64 -GXcode ../
cd ..
cmake --build build_ios_simulator --config Release

