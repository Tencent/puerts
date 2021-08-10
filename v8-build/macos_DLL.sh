VERSION=$1
[ -z "$GITHUB_WORKSPACE" ] && GITHUB_WORKSPACE="$( cd "$( dirname "$0" )"/.. && pwd )"

cd ~
echo "=====[ Getting Depot Tools ]====="	
git clone -q https://chromium.googlesource.com/chromium/tools/depot_tools.git
export PATH=$(pwd)/depot_tools:$PATH
gclient


mkdir v8
cd v8

echo "=====[ Fetching V8 ]====="
fetch v8
echo "target_os = ['mac']" >> .gclient
cd ~/v8/v8
git checkout refs/tags/$VERSION
gclient sync

echo "=====[ Patching V8 ]====="
git apply --cached $GITHUB_WORKSPACE/v8-build/patch/builtins-puerts.patch
git checkout -- .

echo "=====[ Building V8 ]====="
python ./tools/dev/v8gen.py x64.release -vv -- '
is_debug = false
v8_enable_i18n_support= false
v8_use_snapshot = true
v8_use_external_startup_data = true
is_component_build = true
strip_debug_info = true
symbol_level=0
libcxx_abi_unstable = false
v8_enable_pointer_compression=false
'
ninja -C out.gn/x64.release -t clean
ninja -C out.gn/x64.release v8

mkdir -p output/v8/Lib/macOSdylib
cp out.gn/x64.release/libv8.dylib output/v8/Lib/macOSdylib/
cp out.gn/x64.release/libv8_libplatform.dylib output/v8/Lib/macOSdylib/
cp out.gn/x64.release/libv8_libbase.dylib output/v8/Lib/macOSdylib/
cp out.gn/x64.release/libchrome_zlib.dylib output/v8/Lib/macOSdylib/
