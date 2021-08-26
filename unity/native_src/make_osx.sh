mkdir -p build_osx && cd build_osx
if [ "$1" == "-ut" ]
then
    cmake -DFOR_UT=ON -DWITH_NODE=ON -GXcode ../
    cd ..
    cmake --build build_osx --config Debug
else
    cmake -GXcode -DWITH_NODE=ON ../
    cd ..
    cmake --build build_osx --config Release
fi
mkdir -p ../Assets/Plugins/
cp -r build_osx/Release/puerts.bundle ../Assets/Plugins/
if [ "$1" == "-ut" ]
then
    cp -r build_osx/Release/libpuerts.dylib ../general/Bin/
fi