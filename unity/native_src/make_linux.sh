mkdir -p build_linux && cd build_linux
cmake ..
cd ..
cmake --build build_linux --config Release
mkdir -p ../Assets/Plugins/x86_64
cp build_linux/libpuerts.so ../Assets/Plugins/x86_64