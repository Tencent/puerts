VERSION=$1
[ -z "$GITHUB_WORKSPACE" ] && GITHUB_WORKSPACE="$( cd "$( dirname "$0" )"/.. && pwd )"

sudo apt-get install -y \
    pkg-config \
    git \
    subversion \
    curl \
    wget \
    build-essential \
    python \
    xz-utils \
    zip

cd ~
echo "=====[ Getting Depot Tools ]====="	
git clone -q https://chromium.googlesource.com/chromium/tools/depot_tools.git
export PATH=$(pwd)/depot_tools:$PATH
gclient


mkdir v8
cd v8

echo "=====[ Fetching V8 ]====="
fetch v8
echo "target_os = ['android']" >> .gclient
cd ~/v8/v8
./build/install-build-deps-android.sh
git checkout refs/tags/$VERSION
gclient sync


# echo "=====[ Patching V8 ]====="
# git apply --cached $GITHUB_WORKSPACE/v8-build/patch/builtins-puerts.patch
# git checkout -- .

echo "=====[ Building V8 ]====="
python ./tools/dev/v8gen.py arm64.release -vv -- '
target_os = "android"
target_cpu = "arm64"
is_debug = false
v8_enable_i18n_support= false
v8_target_cpu = "arm64"
use_goma = false
v8_use_snapshot = true
v8_use_external_startup_data = true
v8_static_library = true
strip_debug_info = false
symbol_level=1
use_custom_libcxx=false
use_custom_libcxx_for_host=true
v8_enable_pointer_compression=false
'
ninja -C out.gn/arm64.release -t clean
ninja -C out.gn/arm64.release wee8
third_party/android_ndk/toolchains/aarch64-linux-android-4.9/prebuilt/linux-x86_64/aarch64-linux-android/bin/strip -g -S -d --strip-debug --verbose out.gn/arm64.release/obj/libwee8.a

node $GITHUB_WORKSPACE/v8-build/genBlobHeader.js "android arm64" out.gn/arm64.release/snapshot_blob.bin

mkdir -p output/v8/Lib/Android/arm64-v8a
cp out.gn/arm64.release/obj/libwee8.a output/v8/Lib/Android/arm64-v8a/
mkdir -p output/v8/Inc/Blob/Android/arm64
cp SnapshotBlob.h output/v8/Inc/Blob/Android/arm64/
