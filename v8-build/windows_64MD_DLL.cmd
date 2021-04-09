set VERSION=%1

cd %HOMEPATH%
echo =====[ Getting Depot Tools ]=====
powershell -command "Invoke-WebRequest https://storage.googleapis.com/chrome-infra/depot_tools.zip -O depot_tools.zip"
7z x depot_tools.zip -o*
set PATH=%CD%\depot_tools;%PATH%
set GYP_MSVS_VERSION=2019
set DEPOT_TOOLS_WIN_TOOLCHAIN=0
call gclient


mkdir v8
cd v8

echo =====[ Fetching V8 ]=====
call fetch v8
cd v8
call git checkout refs/tags/%VERSION%
cd test\test262\data
call git config --system core.longpaths true
call git restore *
cd ..\..\..\
call gclient sync

echo =====[ Make dynamic_crt ]=====
node %~dp0\rep.js  build\config\win\BUILD.gn

echo =====[ Building V8 ]=====
call gn gen out.gn\x64.release -args="target_os=""win"" target_cpu=""x64"" v8_use_external_startup_data=true v8_enable_i18n_support=false is_debug=false is_clang=false strip_debug_info=true symbol_level=0 v8_enable_pointer_compression=false is_component_build=true"

call ninja -C out.gn\x64.release -t clean
call ninja -C out.gn\x64.release v8

node %~dp0\genBlobHeader.js "window x64" out.gn\x64.release\snapshot_blob.bin

md output\v8\Lib\Win64MD
copy /Y out.gn\x64.release\v8.dll.lib output\v8\Lib\Win64MD\
copy /Y out.gn\x64.release\v8_libplatform.dll.lib output\v8\Lib\Win64MD\
copy /Y out.gn\x64.release\v8.dll output\v8\Lib\Win64MD\
copy /Y out.gn\x64.release\v8_libbase.dll output\v8\Lib\Win64MD\
copy /Y out.gn\x64.release\v8_libplatform.dll output\v8\Lib\Win64MD\
copy /Y out.gn\x64.release\zlib.dll output\v8\Lib\Win64MD\
md output\v8\Inc\Blob\Win64MD
copy SnapshotBlob.h output\v8\Inc\Blob\Win64MD\