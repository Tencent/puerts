set ENGINE=%1
if "%ENGINE%"=="" (
  set ENGINE=v8
)
set CONFIG=%2
if "%CONFIG%"=="" (
  set CONFIG=Release
)
if "%CONFIG%"=="Debug" (
  set CONFIG=RelWithDebInfo
)

mkdir build64_%ENGINE% & pushd build64_%ENGINE%
cmake -DJS_ENGINE=%ENGINE% -DCMAKE_BUILD_TYPE=%CONFIG% -G "Visual Studio 16 2019" -A x64 ..
popd
cmake --build build64_%ENGINE% --config %CONFIG%
md ..\Assets\Plugins\x86_64
copy build64_%ENGINE%\%CONFIG%\puerts.dll ..\Assets\Plugins\x86_64
xcopy %ENGINE%\Lib\Win64\*.dll ..\Assets\Plugins\x86_64 /C