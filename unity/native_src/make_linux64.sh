mkdir -p build_linux64 && cd build_linux64
<<<<<<< HEAD
cmake ..
cd ..
cmake --build build_linux64 --config Release
mkdir -p ../Assets/Plugins/x86_64
cp build_linux64/libpuerts.so ../Assets/Plugins/x86_64
=======
cmake ../
cd ..
cmake --build build_linux64 --config Release
mkdir -p ../Assets/Plugins/x86_64/
cp build_linux64/libpuerts.so ../Assets/Plugins/x86_64/libpuerts.so 

>>>>>>> 9195866a522b97bedfae42b1c43784cd7f8acc54
