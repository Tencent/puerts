const fs = require('fs');
const pwd = process.cwd();
const nodePlatformToPuerPlatform = {
    "darwin": "osx",
    "win32": "win"
}

//// 环境与依赖监测 environment and dependencies checking.
if (!fs.existsSync(`${pwd}/CMakeLists.txt`)) {
    console.error("[Puer] Cannot find CMakeLists.txt");
    process.exit();
}
if (!fs.existsSync(`${pwd}/node_modules`)) {
    console.log("[Puer] installing node_modules");
    require('child_process').execSync('npm i')
}

const sx = require('shelljs');
const { program, Option } = require('commander');
program.addOption(
    new Option("--platform <platform>", "the target platform")
        .default("")
        .choices(["win", "osx", "linux", "android", "ios"])
);
program.addOption(
    new Option("--arch <arch>", "the target architecture")
        .default("")
        .choices(["ia32", "x64", "arm64", "armv7"])
);
program.addOption(
    new Option("--config <ReleaseOrDebug>", "the target architecture")
    .default("Release")
    .choices(["Release", "Debug"])
);
program.option("--backend <backend>", "the JS backend will be used", "v8");

program.parse(process.argv);
const options = program.opts();

if (!fs.existsSync(`${pwd}/${options.backend}`)) {
    console.error("[Puer] Cannot find JS backend library");
    process.exit();
}
const checkCMake = sx.exec("cmake --version");
if (checkCMake.stderr && !checkCMake.stdout) {
    console.error("[Puer] CMake is not installed");
    process.exit();
}
if (options.platform == "win" && options.config != "Release") {
    options.config = "RelWithDebInfo"
}

//// 脚本 scripts
const platformCompileConfig = {
    'android': {
        'armv7': {
            outputPluginPath: 'Android/libs/armeabi-v7a/',
            hook: function(CMAKE_BUILD_PATH, OUTPUT_PATH, options) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = 'android-18';
                const ABI = 'armeabi-v7a';
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-4.9';

                sx.exec(`cmake -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B${CMAKE_BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`)
                sx.exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                sx.cp(`${CMAKE_BUILD_PATH}/libpuerts.so`, OUTPUT_PATH)
            }
        },
        'arm64': {
            outputPluginPath: 'Android/libs/arm64-v8a/',
            hook: function(CMAKE_BUILD_PATH, OUTPUT_PATH, options) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = 'android-18';
                const ABI = 'arm64-v8a';
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-clang';

                sx.exec(`cmake -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B${CMAKE_BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`)
                sx.exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                sx.cp(`${CMAKE_BUILD_PATH}/libpuerts.so`, OUTPUT_PATH)
            }
        }
    },
    'ios': {
        'arm64': {
            outputPluginPath: 'iOS',
            hook: function(CMAKE_BUILD_PATH, OUTPUT_PATH, options) {
                sx.cd(CMAKE_BUILD_PATH);
                sx.exec(`cmake -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DCMAKE_TOOLCHAIN_FILE=../cmake/ios.toolchain.cmake -DPLATFORM=OS64 -GXcode ..`)
                sx.cd("..")
                sx.exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                sx.cp(`${CMAKE_BUILD_PATH}/${options.config}-iphoneos/libpuerts.a`, OUTPUT_PATH)
                sx.cp('-r', `${options.backend}/Lib/iOS/arm64/*.a`, OUTPUT_PATH)
            }
        }
    },
    'osx': {
        'x64': {
            outputPluginPath: 'macOS/x86_64',
            hook: function(CMAKE_BUILD_PATH, OUTPUT_PATH, options) {
                sx.cd(CMAKE_BUILD_PATH);
                sx.exec(`cmake -DJS_ENGINE=${options.backend} -GXcode ..`)
                sx.cd("..")
                sx.exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                if (options.config != 'Release') {
                    sx.mkdir('-p', '../general/vs2013/Bin');
                    sx.cp(`${CMAKE_BUILD_PATH}/${options.config}/libpuerts.dylib`, '../general/vs2013/Bin')
                    sx.cp('-r', `${options.backend}/Lib/macOS/*.dylib`, '../general/vs2013/Bin')
                }
                sx.mv(`${CMAKE_BUILD_PATH}/${options.config}/libpuerts.dylib`, OUTPUT_PATH + "/puerts.bundle")
                sx.cp('-r', `${options.backend}/Lib/macOS/*.dylib`, OUTPUT_PATH)
            }
        },
        'arm64': {
            outputPluginPath: 'macOS/arm64',
            hook: function(CMAKE_BUILD_PATH, OUTPUT_PATH, options) {
                sx.cd(CMAKE_BUILD_PATH);
                sx.exec(`cmake -DJS_ENGINE=${options.backend} -DFOR_SILICON=ON -GXcode ..`)
                sx.cd("..")
                sx.exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                if (options.config != 'Release') {
                    sx.mkdir('-p', '../general/vs2022/Bin');
                    sx.cp(`${CMAKE_BUILD_PATH}/${options.config}/libpuerts.dylib`, '../general/vs2022/Bin')
                    sx.cp('-r', `${options.backend}/Lib/macOS/*.dylib`, '../general/vs2022/Bin')
                }
                sx.mv(`${CMAKE_BUILD_PATH}/${options.config}/libpuerts.dylib`, OUTPUT_PATH)
                sx.cp('-r', `${options.backend}/Lib/macOS_arm64/*.dylib`, OUTPUT_PATH)
            }
        }
    },
    'win': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: function(CMAKE_BUILD_PATH, OUTPUT_PATH, options) {
                sx.cd(CMAKE_BUILD_PATH);                         
                sx.exec(`cmake -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -G "Visual Studio 16 2019" -A x64 ..`)
                sx.cd("..")
                sx.exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)
                
                if (options.config != 'Release') {
                    sx.mkdir('-p', '../general/vs2013/Bin');
                    sx.cp(`${CMAKE_BUILD_PATH}/${options.config}/puerts.dll`, '../general/vs2013/Bin')
                    sx.cp('-r', `${options.backend}/Lib/Win64/*.dll`, '../general/vs2013/Bin')
                }
                sx.cp(`${CMAKE_BUILD_PATH}/${options.config}/puerts.dll`, OUTPUT_PATH)
                sx.cp('-r', `${options.backend}/Lib/Win64/*.dll`, OUTPUT_PATH)
            }
        },
        'ia32': {
            outputPluginPath: 'x86',
            hook: function(CMAKE_BUILD_PATH, OUTPUT_PATH, options) {
                sx.cd(CMAKE_BUILD_PATH);
                sx.exec(`cmake -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -G "Visual Studio 16 2019" -A Win32 ..`)
                sx.cd("..")
                sx.exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)
                
                sx.cp(`${CMAKE_BUILD_PATH}/${options.config}/puerts.dll`, OUTPUT_PATH)
                sx.cp('-r', `${options.backend}/Lib/Win32/*.dll`, OUTPUT_PATH)
            }
        }
    },
    'linux': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: function(CMAKE_BUILD_PATH, OUTPUT_PATH, options) {
                sx.cd(CMAKE_BUILD_PATH);
                sx.exec(`cmake -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} ..`)
                sx.cd("..")
                sx.exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)
                
                sx.cp(`${CMAKE_BUILD_PATH}/libpuerts.so`, OUTPUT_PATH)
            }
        }
    }
}


/////////////////// make
if (options.platform && !options.arch) {
    Object.keys(platformCompileConfig[options.platform]).forEach(arch=> {
        options.arch = arch;
        runMake();
    });

} else if (!options.platform && !options.arch) {
    options.platform = nodePlatformToPuerPlatform[process.platform]
    options.arch = process.arch;

} else {
    runMake();
}
function runMake() {
    const BuildConfig = platformCompileConfig[options.platform][options.arch];
    const CMAKE_BUILD_PATH = pwd + `/build_${options.platform}_${options.arch}_${options.backend}${options.config != "Release" ? "_debug": ""}`
    const OUTPUT_PATH = pwd + '/../Assets/Plugins/' + BuildConfig.outputPluginPath;
    
    sx.mkdir('-p', CMAKE_BUILD_PATH);
    sx.mkdir('-p', OUTPUT_PATH)
    BuildConfig.hook(CMAKE_BUILD_PATH, OUTPUT_PATH, options);    
}