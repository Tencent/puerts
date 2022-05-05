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

mkdir -p build_linux64_$ENGINE && cd build_linux64_$ENGINE
cmake -DJS_ENGINE=$ENGINE -DCMAKE_BUILD_TYPE=$CONFIG ../
cd ..
cmake --build build_linux64_$ENGINE --config $CONFIG
mkdir -p ../Assets/Plugins/x86_64/
cp build_linux64_$ENGINE/libpuerts.so ../Assets/Plugins/x86_64/libpuerts.so