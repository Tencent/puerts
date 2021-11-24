mkdir -p build && cd build
cmake -GXcode ../
cd ..
cmake --build build --config Debug
mkdir -p ~/qjs/quickjs/Lib/macOS/
cp build/Debug/libquickjs.a /Volumes/DISK/_CODE_/puerts@beta/puerts/unity/native_src/quickjs/Lib/macOS
