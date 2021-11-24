mkdir -p build && cd build
cmake -GXcode ../
cd ..
cmake --build build --config Release
mkdir -p ~/qjs/quickjs/Lib/macOS/