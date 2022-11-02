import { existsSync, readFileSync } from "fs";
import { cd, cp, exec, mkdir, mv, setWinCMDEncodingToUTF8 } from "@puerts/shell-util"
import { Option, program } from "commander";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import assert from "assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(dirname(import.meta.url));
setWinCMDEncodingToUTF8();

const nodePlatformToPuerPlatform = {
    "darwin": "osx",
    "win32": "win"
}
interface BuildOptions {
    config: 'Debug' | 'Release' | "RelWithDebInfo",
    platform: 'osx' | 'win' | 'ios' | 'android' | 'linux',
    arch: 'x64' | 'ia32' | 'armv7' | 'arm64' | 'auto',
    backend: string
}

//// 脚本 scripts
const platformCompileConfig = {
    'android': {
        'armv7': {
            outputPluginPath: 'Android/libs/armeabi-v7a/',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeDArgs: string) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = options.backend.indexOf('node') != -1 ? 'android-24' : 'android-21';
                const ABI = 'armeabi-v7a';
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-4.9';

                assert.equal(0, exec(`cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B${CMAKE_BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/libpuerts.so`
            }
        },
        'arm64': {
            outputPluginPath: 'Android/libs/arm64-v8a/',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeDArgs: string) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = options.backend.indexOf('node') != -1 ? 'android-24' : 'android-21';
                const ABI = 'arm64-v8a';
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-clang';

                assert.equal(0, exec(`cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B${CMAKE_BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/libpuerts.so`
            }
        },
        'x64': {
            outputPluginPath: 'Android/libs/x86_64/',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeDArgs: string) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = options.backend.indexOf('node') != -1 ? 'android-24' : 'android-21';
                const ABI = 'x86_64';
                const TOOLCHAIN_NAME = 'x86_64-4.9';

                assert.equal(0, exec(`cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B${CMAKE_BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/libpuerts.so`
            }
        }
    },
    'ios': {
        'arm64': {
            outputPluginPath: 'iOS',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DCMAKE_TOOLCHAIN_FILE=../cmake/ios.toolchain.cmake -DPLATFORM=OS64 -GXcode ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/${options.config}-iphoneos/libpuerts.a`
            }
        }
    },
    'osx': {
        'x64': {
            outputPluginPath: 'macOS/x86_64',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DTHREAD_SAFE=1 -DJS_ENGINE=${options.backend} -GXcode ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                mv(`${CMAKE_BUILD_PATH}/${options.config}/libpuerts.dylib`, `${CMAKE_BUILD_PATH}/${options.config}/puerts.bundle`)
                return `${CMAKE_BUILD_PATH}/${options.config}/puerts.bundle`
            }
        },
        'arm64': {
            outputPluginPath: 'macOS/arm64',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DFOR_SILICON=ON -GXcode ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/${options.config}/libpuerts.dylib`
            }
        }
    },
    'win': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -G "Visual Studio 16 2019" -A x64 ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/${options.config}/puerts.dll`
            }
        },
        'ia32': {
            outputPluginPath: 'x86',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -G "Visual Studio 16 2019" -A Win32 ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/${options.config}/puerts.dll`
            }
        }
    },
    'linux': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/libpuerts.so`;
            }
        }
    }
}


    /////////////////// make
function runPuertsMake(options: BuildOptions) {
    //// 环境与依赖监测 environment and dependencies checking.
    if (!existsSync(`${__dirname}/CMakeLists.txt`)) {
        console.error("[Puer] Cannot find CMakeLists.txt");
        process.exit();
    }
    
    
    if (!existsSync(`${__dirname}/${options.backend}`)) {
        console.error("[Puer] Cannot find JS backend library");
        process.exit();
    }
    const checkCMake = exec("cmake --version", { silent: true });
    if (checkCMake.stderr && !checkCMake.stdout) {
        console.error("[Puer] CMake is not installed");
        process.exit();
    }
    if (options.platform == "win" && options.config != "Release") {
        options.config = "RelWithDebInfo"
    }

    const BuildConfig = (platformCompileConfig as any)[options.platform][options.arch];
    const CMAKE_BUILD_PATH = __dirname + `/build_${options.platform}_${options.arch}_${options.backend}${options.config != "Release" ? "_debug" : ""}`
    const OUTPUT_PATH = __dirname + '/../Assets/Puerts/Plugins/' + BuildConfig.outputPluginPath;
    const BackendConfig = JSON.parse(readFileSync(__dirname + `/cmake/${options.backend}/backend.json`, 'utf-8'))

    if (BackendConfig.skip?.[options.platform]?.[options.arch]) {
        console.log("=== Puer ===");
        console.log(`not supported yet: ${options.backend} in ${options.platform} ${options.arch}`);
        console.log("=== Puer ===");
        return;
    }
    const definitionD = (BackendConfig.definition || []).join(';')
    const linkD = (BackendConfig.link[options.platform]?.[options.arch] || []).join(';')
    const incD = (BackendConfig.include || []).join(';')

    mkdir('-p', CMAKE_BUILD_PATH);
    mkdir('-p', OUTPUT_PATH)
    const DArgsName = ['-DBACKEND_DEFINITIONS=', '-DBACKEND_LIB_NAMES=', '-DBACKEND_INC_NAMES=']
    var outputFile = BuildConfig.hook(
        CMAKE_BUILD_PATH,
        options,
        [definitionD, linkD, incD].map((r, index) => r ? DArgsName[index] + '"' + r + '"' : null).filter(t => t).join(' ')
    );
    const copyConfig = (BackendConfig.copy[options.platform]?.[options.arch] || [])
        .map((pathToBackend: string) => join(__dirname, options.backend, pathToBackend))
        .concat([outputFile]);

    copyConfig?.forEach((filepath: string) => {
        cp(filepath, OUTPUT_PATH)
        // if (options.config != 'Release') {
        //     if (!fs.existsSync('../general/vs2013/Bin'))
        //         sx.mkdir('-p', '../general/vs2013/Bin')
        //     if (!fs.existsSync('../general/vs2022/Bin'))
        //         sx.mkdir('-p', '../general/vs2022/Bin')
        //     sx.cp(filepath, '../general/vs2022/Bin')
        //     sx.cp(filepath, '../general/vs2013/Bin')
        // }
    })

    return copyConfig;
}

export default runPuertsMake;


if (import.meta.url.startsWith('file:') && process.argv[1] === __filename) {
    program.addOption(
        new Option("--platform <platform>", "the target platform")
            .default("")
            .choices(["win", "osx", "linux", "android", "ios"])
    );
    program.addOption(
        new Option("--arch <arch>", "the target architecture")
            .default("auto")
            .choices(["auto", "ia32", "x64", "arm64", "armv7"])
    );
    program.addOption(
        new Option("--config <ReleaseOrDebug>", "the target architecture")
            .default("Release")
            .choices(["Release", "Debug"])
    );
    program.option("--backend <backend>", "the JS backend will be used", "v8");
    
    let pargv = process.argv;
    if (process.argv[2].match(/[vnq][aiwol][3678]d?/)) {
        const command = process.argv[2];
        pargv = [pargv[0], pargv[1]];
    
        pargv.push('--backend');
        switch (command[0]) {
            case 'v':
                pargv.push('v8_9.4'); break;
            case 'n':
                pargv.push('nodejs_16'); break;
            case 'q':
                pargv.push('quickjs'); break;
    
            default:
                throw new Error(`invalid command[0] : ${command[0]}`);
        }
    
        pargv.push('--platform');
        switch (command[1]) {
            case 'a':
                pargv.push('android'); break;
            case 'i':
                pargv.push('ios'); break;
            case 'w':
                pargv.push('win'); break;
            case 'o':
                pargv.push('osx'); break;
            case 'l':
                pargv.push('linux'); break;
    
            default:
                throw new Error(`invalid command[1] : ${command[1]}`);
        }
    
        pargv.push('--arch');
        switch (command[2]) {
            case '3':
                pargv.push('ia32'); break;
            case '6':
                pargv.push('x64'); break;
            case '7':
                pargv.push('armv7'); break;
            case '8':
                pargv.push('arm64'); break;
    
            default:
                throw new Error(`invalid command[2] : ${command[2]}`);
        }
    
        pargv.push('--config');
        switch (command[3] || "") {
            case 'd':
                pargv.push('Debug'); break;
    
            default:
                pargv.push('Release'); break;
        }
    
        console.log('quick arg parse result:', pargv.join(' '));
    }
    
    program.parse(pargv);
    const options: BuildOptions = program.opts() as any;
    
    if (options.platform && options.arch == 'auto') {
        let promiseChain = Promise.resolve();
        Object.keys((platformCompileConfig as any)[options.platform]).forEach(arch => {
            promiseChain = promiseChain.then(function () {
                //@ts-ignore
                options.arch = arch;
                runPuertsMake(options)
            })
        });
    
    } else if (!options.platform && options.arch == 'auto') {
        options.platform = (nodePlatformToPuerPlatform as any)[process.platform]
        //@ts-ignore
        options.arch = process.arch;
        runPuertsMake(options);
    
    } else {
        runPuertsMake(options);
    }
    
}
