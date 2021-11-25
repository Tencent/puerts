mkdir -p build && cd build
cmake -GXcode ../
cd ..
cmake --build build --config Debug
mkdir -p ~/qjs/quickjs/Lib/macOS/
cp build/Debug/libquickjs.a ~/qjs/quickjs/Lib/macOS/
