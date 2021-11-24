rm -rf build
mkdir build
cd build
cmake -DJS_ENGINE=quickjs -DPUERTS_UT=ON ..
cd ..
cmake --build build --config Debug
./build/PuertsPluginTest