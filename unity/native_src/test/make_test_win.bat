rm -r build
mkdir build & pushd build
cmake -DJS_ENGINE=nodejs -DPUERTS_UT=ON -G "Visual Studio 16 2019" -A x64 ..
popd
cmake --build build --config Debug
copy .\build\puerts\Debug\puerts.dll .\build\Debug\
copy ..\nodejs\Lib\Win64\libnode.dll .\build\Debug\
copy ..\nodejs\Lib\Win64\libnode.pdb .\build\Debug\
.\build\Debug\PuertsPluginTest.exe