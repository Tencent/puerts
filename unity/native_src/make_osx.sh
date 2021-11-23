mkdir -p build_osx && cd build_osx
if [ "$1" == "-ut" ]
then
    cmake -DFOR_UT=ON ../
    cd ..
    cmake --build build_osx --config Debug
    cp -r build_osx/Debug/libpuerts.dylib ../general/Bin/
else
    cmake -GXcode ../
    cd ..
    cmake --build build_osx --config Release
    cmake --install build_osx --prefix "$(pwd)/build_osx"
    mv build_osx/bin/libpuerts.dylib build_osx/bin/libpuerts.bundle
    mkdir -p ../Assets/Plugins/macOS
    cp -r build_osx/bin/* ../Assets/Plugins/macOS/
fi