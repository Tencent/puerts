mkdir -p build_osx && cd build_osx
cmake -GXcode ../
cd ..
cmake --build build_osx --config Release
mkdir -p ../Assets/Plugins/
cp -r build_osx/Release/puerts.bundle ../Assets/Plugins/

