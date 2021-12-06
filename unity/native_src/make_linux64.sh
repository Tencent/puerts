ENGINE=$1
if [ "$1" == "" ]
then
    ENGINE="v8"
fi

mkdir -p build_linux64_$ENGINE && cd build_linux64_$ENGINE
cmake -DJS_ENGINE=$ENGINE ../
cd ..
cmake --build build_linux64_$ENGINE --config Release
mkdir -p ../Assets/Plugins/x86_64/
cp build_linux64_$ENGINE/libpuerts.so ../Assets/Plugins/x86_64/libpuerts.so