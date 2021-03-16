mkdir -p build_osx_qjs && cd build_osx_qjs
if [ "$1" == "-ut" ]
then
    cmake -DJS_ENGINE=quickjs -DFOR_UT=1 -GXcode ../
else
    cmake -DJS_ENGINE=quickjs -GXcode ../
fi
cd ..
cmake --build build_osx_qjs --config Release
mkdir -p ../Assets/Plugins/
cp -r build_osx_qjs/Release/puerts.bundle ../Assets/Plugins/
if [ "$1" == "-ut" ]
then
    cp -r build_osx_qjs/Release/libpuerts.dylib ../general/Bin/
fi