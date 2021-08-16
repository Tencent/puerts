mkdir -p build_linux64 && cd build_linux64
cmake ../
cd ..
cmake --build build_linux64 --config Release
mkdir -p ../Assets/Plugins/x86_64/
cp build_linux64/libpuerts.so ../Assets/Plugins/x86_64/libpuerts.so