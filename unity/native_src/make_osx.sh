mkdir -p build_osx && cd build_osx
if [ "$1" == "-ut" ]
then
    cmake -DFOR_UT=1 -GXcode ../
else
    cmake -GXcode ../
fi
cd ..
cmake --build build_osx --config Release
mkdir -p ../Assets/Plugins/
cp -r build_osx/Release/puerts.bundle ../Assets/Plugins/
if [ "$1" == "-ut" ]
then
    cp -r build_osx_qjs/Release/libpuerts.dylib ../general/Bin/
fi