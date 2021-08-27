mkdir -p build_osx_nodejs && cd build_osx_nodejs
if [ "$1" == "-ut" ]
then
    cmake -DJS_ENGINE=nodejs -DFOR_UT=1 -GXcode ../
    cd ..
    cmake --build build_osx_nodejs --config Debug
else
    cmake -DJS_ENGINE=nodejs -GXcode ../
    cd ..
    cmake --build build_osx_nodejs --config Release
fi
mkdir -p ../Assets/Plugins/
cp -r build_osx_nodejs/Release/puerts.bundle ../Assets/Plugins/
cp -r nodejs/lib/macOS/libnode.83.dylib ../Assets/Plugins/
if [ "$1" == "-ut" ]
then
    cp -r build_osx_nodejs/Release/libpuerts.dylib ../general/Bin/
fi
