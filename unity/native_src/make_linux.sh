mkdir -p build_linux && cd build_linux
if [ "$1" == "-ut" ]
then
    cmake -DFOR_UT=1 ../
else
    cmake ../
fi
cd ..
cmake --build build_linux --config Release
mkdir -p ../Assets/Plugins/
cp -r build_linux/libpuerts.so ../Assets/Plugins/
if [ "$1" == "-ut" ]
then
    cp -r build_linux/libpuerts.so ../general/Bin/
fi