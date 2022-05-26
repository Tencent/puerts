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

OUTPUT=build_osx_arm64_$ENGINE

mkdir -p $OUTPUT/bin && cd $OUTPUT
cmake -DJS_ENGINE=$ENGINE -DFOR_SILICON=ON -GXcode ../
cd ..
cmake --build $OUTPUT --config $CONFIG
mv $OUTPUT/$CONFIG/libpuerts.dylib $OUTPUT/bin/
cp -r $ENGINE/Lib/macOS_arm64/*.dylib $OUTPUT/bin/

mkdir -p ../Assets/Plugins/arm64
cp -r $OUTPUT/bin/* ../Assets/Plugins/arm64/