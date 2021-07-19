mkdir -p build_linux32 && cd build_linux32
cmake -DCMAKE_C_FLAGS=-m32 -DCMAKE_CXX_FLAGS=-m32 -DCMAKE_SHARED_LINKER_FLAGS=-m32 ..
cd ..
cmake --build build_linux32 --config Release
mkdir -p ../Assets/Plugins/x86
cp build_linux32/libpuerts.so ../Assets/Plugins/x86