set ENGINE=%1
if "%ENGINE%"=="" (
  set ENGINE=v8
)

mkdir build64_%ENGINE%_test & pushd build64_%ENGINE%_test
cmake -DJS_ENGINE=%ENGINE% -G "Visual Studio 16 2019" -A x64 ..
popd
cmake --build build64_%ENGINE%_test --config RelWithDebInfo
md ..\Assets\Plugins\x86_64
copy build64_%ENGINE%_test\RelWithDebInfo\puerts.dll ..\general\Bin\
xcopy %ENGINE%\Lib\Win64\*.dll ..\general\vs2013\Bin\