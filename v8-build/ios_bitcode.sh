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
echo "target_os = ['ios']" >> .gclient
cd ~/v8/v8
git checkout refs/tags/$VERSION
gclient sync


echo "=====[ Patching V8 ]====="
# git apply --cached $GITHUB_WORKSPACE/v8-build/patch/builtins-puerts.patch
git apply --cached $GITHUB_WORKSPACE/v8-build/patch/bitcode.patch
git checkout -- .

echo "=====[ Building V8 ]====="
python ./tools/dev/v8gen.py arm64.release -vv -- '
v8_use_external_startup_data = true
v8_use_snapshot = true
v8_enable_i18n_support = false
is_debug = false
v8_static_library = true
ios_enable_code_signing = false
target_os = "ios"
target_cpu = "arm64"
v8_enable_pointer_compression = false
use_xcode_clang = true
enable_ios_bitcode = true
symbol_level = 0
'
ninja -C out.gn/arm64.release -t clean
ninja -C out.gn/arm64.release wee8
strip -S out.gn/arm64.release/obj/libwee8.a

node $GITHUB_WORKSPACE/v8-build/genBlobHeader.js "ios arm64(bitcode)" out.gn/arm64.release/snapshot_blob.bin

mkdir -p output/v8/Lib/iOS/bitcode
cp out.gn/arm64.release/obj/libwee8.a output/v8/Lib/iOS/bitcode/
mkdir -p output/v8/Inc/Blob/iOS/bitcode
cp SnapshotBlob.h output/v8/Inc/Blob/iOS/bitcode/
