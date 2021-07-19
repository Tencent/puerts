mkdir -p build_linux && cd build_linux
cmake ..
cd ..
cmake --build build_linux --config Release
mkdir -p ../Assets/Plugins/
ls -l build_linux
ls -l build_linux/Release