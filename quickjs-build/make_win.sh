mkdir build
cd build
cmake -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DCMAKE_SYSTEM_NAME=MSYS -DWIN_DLL=1 ..
cd ..
cmake --build build --config Release
