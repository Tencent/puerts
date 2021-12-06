ENGINE=$1
if [ "$1" == "" ]
then
    ENGINE="v8"
fi

mkdir -p build_osx_$ENGINE && cd build_osx_$ENGINE
cmake -DJS_ENGINE=$ENGINE -GXcode ../
cd ..
cmake --build build_osx_$ENGINE --config Release
cmake --install build_osx_$ENGINE --prefix "$(pwd)/build_osx_$ENGINE"
mv build_osx_$ENGINE/bin/libpuerts.dylib build_osx_$ENGINE/bin/libpuerts.bundle
cp -r $ENGINE/Lib/macOS/*.dylib build_osx_nodejs/bin/

mkdir -p ../Assets/Plugins/macOS
cp -r build_osx_$ENGINE/bin/* ../Assets/Plugins/macOS/


# mkdir -p build_osx && cd build_osx
# if [ "$1" == "-ut" ]
# then
#     cmake -DFOR_UT=ON ../
#     cd ..
#     cmake --build build_osx --config Debug
#     cp -r build_osx/libpuerts.dylib ../general/Bin/
# else
#     cmake -GXcode ../
#     cd ..
#     cmake --build build_osx --config Release
#     cmake --install build_osx --prefix "$(pwd)/build_osx"
#     mv build_osx/bin/libpuerts.dylib build_osx/bin/libpuerts.bundle
#     mkdir -p ../Assets/Plugins/macOS
#     cp -r build_osx/bin/* ../Assets/Plugins/macOS/
# fi