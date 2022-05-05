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

mkdir build32_%ENGINE% & pushd build32_%ENGINE%
cmake -DJS_ENGINE=%ENGINE% -G "Visual Studio 16 2019" -A Win32 ..
popd
cmake --build build32_%ENGINE% --config %CONFIG%
md ..\Assets\Plugins\x86
copy build32_%ENGINE%\%CONFIG%\puerts.dll ..\Assets\Plugins\x86
xcopy %ENGINE%\Lib\Win32\*.dll ..\Assets\Plugins\x86 /C