mkdir -p build_osx_qjs && cd build_osx_qjs
if [ "$1" == "-ut" ]
then
    cmake -DJS_ENGINE=quickjs -DFOR_UT=1 -GXcode ../
    cd ..
    cmake --build build_osx_qjs --config Debug
    cp -r build_osx_qjs/Debug/libpuerts.dylib ../general/Bin/
else
    cmake -DJS_ENGINE=quickjs -GXcode ../
    cd ..
    cmake --build build_osx_qjs --config Release
    cmake --install build_osx_qjs --prefix "$(pwd)/build_osx_qjs"
    mv build_osx_qjs/bin/libpuerts.dylib build_osx_qjs/bin/libpuerts.bundle
    mkdir -p ../Assets/Plugins/macOS
    cp -r build_osx_qjs/bin/* ../Assets/Plugins/macOS/
fi