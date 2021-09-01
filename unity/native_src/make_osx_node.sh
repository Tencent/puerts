mkdir -p build_osx_nodejs && cd build_osx_nodejs
if [ "$1" == "-ut" ]
then
    cmake -DJS_ENGINE=nodejs -DFOR_UT=1 -GXcode ../
    cd ..
    cmake --build build_osx_nodejs --config Debug
    cp -r build_osx_nodejs/Debug/libpuerts.dylib ../general/Bin/

else
    cmake -DJS_ENGINE=nodejs -GXcode ../
    cd ..
    cmake --build build_osx_nodejs --config Release
    cmake --install build_osx_nodejs --prefix "$(pwd)/build_osx_nodejs"
    mv build_osx_nodejs/bin/libpuerts.dylib build_osx_nodejs/bin/libpuerts.bundle
    cp -r nodejs/lib/macOS/libnode.83.dylib build_osx_nodejs/bin/

    mkdir -p ../Assets/Plugins/macOS
    cp -r build_osx_nodejs/bin/* ../Assets/Plugins/macOS/
fi