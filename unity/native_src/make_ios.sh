ENGINE=$1
if [ "$1" == "" ]
then
    ENGINE="v8"
fi

mkdir -p build_ios_$ENGINE && cd build_ios_$ENGINE
cmake -DJS_ENGINE=$ENGINE -DCMAKE_TOOLCHAIN_FILE=../cmake/ios.toolchain.cmake -DPLATFORM=OS64 -GXcode ../
cd ..
cmake --build build_ios_$ENGINE --config Release
mkdir -p ../Assets/Plugins/iOS/
cp build_ios_$ENGINE/Release-iphoneos/libpuerts.a ../Assets/Plugins/iOS/
cp $ENGINE/Lib/iOS/arm64/*.a ../Assets/Plugins/iOS/

