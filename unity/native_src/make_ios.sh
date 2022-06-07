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

mkdir -p build_ios_$ENGINE && cd build_ios_$ENGINE
cmake -DJS_ENGINE=$ENGINE -DCMAKE_BUILD_TYPE=$CONFIG -DCMAKE_TOOLCHAIN_FILE=../cmake/ios.toolchain.cmake -DPLATFORM=OS64 -GXcode ../
cd ..
cmake --build build_ios_$ENGINE --config $CONFIG
mkdir -p ../Assets/Plugins/iOS/
cp build_ios_$ENGINE/$CONFIG-iphoneos/libpuerts.a ../Assets/Plugins/iOS/
cp $ENGINE/Lib/iOS/arm64/*.a ../Assets/Plugins/iOS/

