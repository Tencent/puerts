ENGINE=$1
if [ "$1" == "" ]
then
    ENGINE="v8"
fi

CONFIG=$2
if [ "$2" == "" ]
then
    CONFIG="Release"
fi

mkdir -p build_osx_$ENGINE && cd build_osx_$ENGINE
cmake -DJS_ENGINE=$ENGINE -DCMAKE_BUILD_TYPE=$CONFIG -GXcode ../
cd ..
cmake --build build_osx_$ENGINE --config $CONFIG
cmake --install build_osx_$ENGINE --config $CONFIG --prefix "$(pwd)/build_osx_$ENGINE"
mv build_osx_$ENGINE/bin/libpuerts.dylib build_osx_$ENGINE/bin/puerts.bundle
cp -r $ENGINE/Lib/macOS/*.dylib build_osx_$ENGINE/bin/

mkdir -p ../Assets/Plugins/x86_64
cp -r build_osx_$ENGINE/bin/* ../Assets/Plugins/x86_64/
