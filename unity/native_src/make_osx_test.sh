ENGINE=$1
if [ "$1" == "" ]
then
    ENGINE="v8"
fi

mkdir -p build_osx_$ENGINE && cd build_osx_$ENGINE
cmake -DJS_ENGINE=$ENGINE -DFOR_UT=ON ../
cd ..
cmake --build build_osx_$ENGINE --config Debug
cp -r build_osx_$ENGINE/libpuerts.dylib ../general/Bin/