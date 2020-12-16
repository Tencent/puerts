if [ -n "$ANDROID_NDK" ]; then
    export NDK=${ANDROID_NDK}
elif [ -n "$ANDROID_NDK_HOME" ]; then
    export NDK=${ANDROID_NDK_HOME}
else
    export NDK=~/android-ndk-r21b
fi

if [ ! -d "$NDK" ]; then
    echo "Please set ANDROID_NDK environment to the root of NDK."
    exit 1
fi

function build() {
    API=$1
    ABI=$2
    TOOLCHAIN_ANME=$3
    BUILD_PATH=build.qjs.Android.${ABI}
    cmake -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=quickjs -DANDROID_ABI=${ABI} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -H. -B${BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_ANME}
    cmake --build ${BUILD_PATH} --config Release
    mkdir -p ../Assets/Plugins/Android/libs/${ABI}/
    cp ${BUILD_PATH}/libpuerts.so ../Assets/Plugins/Android/libs/${ABI}/libpuerts.so
}

build android-18 armeabi-v7a arm-linux-androideabi-4.9
build android-18 arm64-v8a  arm-linux-androideabi-clang
