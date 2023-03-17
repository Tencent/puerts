import { existsSync, readFileSync } from "fs";
import { cd, cp, exec, mkdir, mv } from "@puerts/shell-util"
import { join, normalize } from "path";
import assert from "assert";
import downloadBackend from "./backend.mjs";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const glob = createRequire(fileURLToPath(import.meta.url))('glob');

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
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = options.backend.indexOf('node') != -1 ? 'android-24' : 'android-21';
                const ABI = 'armeabi-v7a';
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-4.9';

                assert.equal(0, exec(`cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B${CMAKE_BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`)) 
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`]
                else 
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`, `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.stripped.so~`]
            }
        },
        'arm64': {
            outputPluginPath: 'Android/libs/arm64-v8a/',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = options.backend.indexOf('node') != -1 ? 'android-24' : 'android-21';
                const ABI = 'arm64-v8a';
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-clang';

                assert.equal(0, exec(`cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B${CMAKE_BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`)) 
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`]
                else 
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`, `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.stripped.so~`]
            }
        },
        'x64': {
            outputPluginPath: 'Android/libs/x86_64/',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = options.backend.indexOf('node') != -1 ? 'android-24' : 'android-21';
                const ABI = 'x86_64';
                const TOOLCHAIN_NAME = 'x86_64-4.9';

                assert.equal(0, exec(`cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B${CMAKE_BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`)) 
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`]
                else 
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`, `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.stripped.so~`]
            }
        }
    },
    'ios': {
        'arm64': {
            outputPluginPath: 'iOS',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DCMAKE_TOOLCHAIN_FILE=../cmake/ios.toolchain.cmake -DPLATFORM=OS64 -GXcode ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/${options.config}-iphoneos/lib${cmakeAddedLibraryName}.a`
            }
        }
    },
    'osx': {
        'x64': {
            outputPluginPath: 'macOS/x86_64',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -GXcode ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                mv(`${CMAKE_BUILD_PATH}/${options.config}/lib${cmakeAddedLibraryName}.dylib`, `${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.bundle`)
                return `${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.bundle`
            }
        },
        'arm64': {
            outputPluginPath: 'macOS/arm64',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DFOR_SILICON=ON -GXcode ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/${options.config}/lib${cmakeAddedLibraryName}.dylib`
            }
        }
    },
    'win': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -G "Visual Studio 16 2019" -A x64 ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.dll`
            }
        },
        'ia32': {
            outputPluginPath: 'x86',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -G "Visual Studio 16 2019" -A Win32 ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.dll`
            }
        }
    },
    'linux': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`;
            }
        }
    }
}


/////////////////// make
async function runPuertsMake(cwd: string, options: BuildOptions) {
    //// 环境与依赖监测 environment and dependencies checking.
    if (!existsSync(`${cwd}/CMakeLists.txt`)) {
        console.error("[Puer] Cannot find CMakeLists.txt");
        process.exit();
    }
    const cmakeAddedLibraryName = readFileSync(`${cwd}/CMakeLists.txt`, 'utf-8').match(/add_library\((\w*)/)[1];

    const checkCMake = exec("cmake --version", { silent: true });
    if (checkCMake.stderr && !checkCMake.stdout) {
        console.error("[Puer] CMake is not installed");
        process.exit();
    }
    if (!existsSync(`${cwd}/.backends/${options.backend}`)) {
        await downloadBackend(cwd, options.backend);
    }
    if (options.platform == "win" && options.config != "Release") {
        options.config = "RelWithDebInfo"
    }

    const BuildConfig = (platformCompileConfig as any)[options.platform][options.arch];
    const CMAKE_BUILD_PATH = cwd + `/build_${options.platform}_${options.arch}_${options.backend}${options.config != "Release" ? "_debug" : ""}`
    const OUTPUT_PATH = cmakeAddedLibraryName == "puerts_il2cpp" ?
        cwd + '/../Assets/core/upm/Plugins/' + BuildConfig.outputPluginPath :
        cwd + '/../Assets/core/upm/Plugins/' + BuildConfig.outputPluginPath;
    const BackendConfig = JSON.parse(readFileSync(cwd + `/cmake/backends.json`, 'utf-8'))[options.backend]?.config;

    if (BackendConfig?.skip?.[options.platform]?.[options.arch]) {
        console.log("=== Puer ===");
        console.log(`not supported yet: ${options.backend} in ${options.platform} ${options.arch}`);
        console.log("=== Puer ===");
        return;
    }
    const definitionD = (BackendConfig.definition || []).join(';')
    const linkD = (BackendConfig['link-libraries'][options.platform]?.[options.arch] || []).join(';')
    const incD = (BackendConfig.include || []).join(';')

    mkdir('-p', CMAKE_BUILD_PATH);
    mkdir('-p', OUTPUT_PATH)
    const DArgsName = ['-DBACKEND_DEFINITIONS=', '-DBACKEND_LIB_NAMES=', '-DBACKEND_INC_NAMES=']

    var outputFile = BuildConfig.hook(
        CMAKE_BUILD_PATH,
        options,
        cmakeAddedLibraryName,
        [definitionD, linkD, incD].map((r, index) => r ? DArgsName[index] + '"' + r + '"' : null).filter(t => t).join(' ')
    );
    if (!(outputFile instanceof Array)) outputFile = [outputFile];
    const copyConfig = (BackendConfig['copy-libraries'][options.platform]?.[options.arch] || [])
        .map((pathToBackend: string) => join(cwd, '.backends', options.backend, pathToBackend))
        .concat(outputFile);

    copyConfig?.forEach((filepath: string) => {
        if (
            process.platform == "win32" ?
                !glob.sync(normalize(filepath).replace(/\\/g, "/")).length :
                !glob.sync(normalize(filepath)).length
        ) {
            throw new Error("copy failed:" + normalize(filepath));
        }
        cp(filepath, OUTPUT_PATH)
    })

    return copyConfig;
}

export default runPuertsMake;
export { platformCompileConfig }