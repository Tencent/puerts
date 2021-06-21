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

echo =====[ Patching V8 ]=====
call git apply --cached %GITHUB_WORKSPACE%\v8-build\patch\builtins-puerts.patch
call git checkout -- .

echo =====[ Building V8 ]=====
call gn gen out.gn\x86.release -args="target_os=""win"" target_cpu=""x86"" v8_use_external_startup_data=true v8_enable_i18n_support=false is_debug=false v8_static_library=true is_clang=false strip_debug_info=true symbol_level=0 v8_enable_pointer_compression=false"

call ninja -C out.gn\x86.release -t clean
call ninja -C out.gn\x86.release wee8

node %~dp0\genBlobHeader.js "window x86" out.gn\x86.release\snapshot_blob.bin

md output\v8\Lib\Win32
copy /Y out.gn\x86.release\obj\wee8.lib output\v8\Lib\Win32\
md output\v8\Inc\Blob\Win32
copy SnapshotBlob.h output\v8\Inc\Blob\Win32\
