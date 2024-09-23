import { existsSync, readFileSync } from "fs";
import { cd, cp, exec, mkdir, mv, rm } from "@puerts/shell-util"
import { basename, join, normalize, dirname } from "path";
import assert from "assert";
import downloadBackend from "./backend.mjs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import * as process from "process";

const glob = createRequire(fileURLToPath(import.meta.url))('glob');

interface BuildOptions {
    config: 'Debug' | 'Release' | "RelWithDebInfo",
    platform: 'osx' | 'win' | 'ios' | 'android' | 'linux' | 'ohos' | 'wasm',
    arch: 'x64' | 'ia32' | 'armv7' | 'arm64' | 'wasm32' | 'auto',
    backend: string,
    websocket?: number,
    generator?: string
}

//// 脚本 scripts
const platformCompileConfig = {
    'android': {
        'armv7': {
            outputPluginPath: 'Android/libs/armeabi-v7a/',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = options.backend.indexOf('node') != -1 ? 'android-24' : (options.backend.indexOf('10.6.194') != -1 ? 'android-23' : 'android-21');
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
                const API = options.backend.indexOf('node') != -1 ? 'android-24' : (options.backend.indexOf('10.6.194') != -1 ? 'android-23' : 'android-21');
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
                const API = options.backend.indexOf('node') != -1 ? 'android-24' : (options.backend.indexOf('10.6.194') != -1 ? 'android-23' : 'android-21');
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
    'ohos': {
        'armv7': {
            outputPluginPath: 'OpenHarmony/libs/armeabi-v7a/',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                const NDK = process.env.OHOS_NDK || process.env.OHOS_NDK_HOME;
                if (!NDK) throw new Error("pleace set OHOS_NDK environment variable first!")
                const ABI = 'armeabi-v7a';
                const cmake_bin_path = `${NDK}/build-tools/cmake/bin/cmake`

                assert.equal(0, exec(`${cmake_bin_path} ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DOHOS_ARCH=${ABI} -H. -B${CMAKE_BUILD_PATH}  -DOHOS_PLATFORM=OHOS -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/ohos.toolchain.cmake`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`))
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`]
                else
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`]
            }
        },
        'arm64': {
            outputPluginPath: 'OpenHarmony/libs/arm64-v8a/',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                const NDK = process.env.OHOS_NDK || process.env.OHOS_NDK_HOME;
                if (!NDK) throw new Error("pleace set OHOS_NDK environment variable first!")
                const ABI = 'arm64-v8a';
                const cmake_bin_path = `${NDK}/build-tools/cmake/bin/cmake`

                assert.equal(0, exec(`${cmake_bin_path} ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DOHOS_ARCH=${ABI} -H. -B${CMAKE_BUILD_PATH}  -DOHOS_PLATFORM=OHOS -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/ohos.toolchain.cmake`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`))
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`]
                else
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`]
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
                assert.equal(0, exec(`codesign --sign - --options linker-signed --force ${CMAKE_BUILD_PATH}/${options.config}/lib${cmakeAddedLibraryName}.dylib`).code)

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
                assert.equal(0, exec(`codesign --sign - --options linker-signed --force ${CMAKE_BUILD_PATH}/${options.config}/lib${cmakeAddedLibraryName}.dylib`).code)

                return `${CMAKE_BUILD_PATH}/${options.config}/lib${cmakeAddedLibraryName}.dylib`
            }
        }
    },
    'win': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                const generator = options.generator || 'Visual Studio 16 2019';
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -G "${generator}" -A x64 ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.dll`
            }
        },
        'ia32': {
            outputPluginPath: 'x86',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                const generator = options.generator || 'Visual Studio 16 2019';
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -G "${generator}" -A Win32 ..`).code)
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
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DCMAKE_BUILD_TYPE=${options.config} ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`;
            }
        },
        'arm64': {
            outputPluginPath: 'Linux/libs/arm64/',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DCMAKE_BUILD_TYPE=${options.config} ..`).code)
                cd("..")
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`;
            }
        }
    },
    'wasm': {
        'wasm32': {
            outputPluginPath: 'WebGL',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`emcmake cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DCMAKE_BUILD_TYPE=${options.config} ..`).code)
                assert.equal(0, exec(`emmake make`).code)
                cd("..")

                return `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`;
            }
        }
    },
    'ns':{
        'arm64': {
            outputPluginPath: 'ns/libs/arm64-v8a/',
            hook: function (CMAKE_BUILD_PATH: string, options: BuildOptions, cmakeAddedLibraryName: string, cmakeDArgs: string) {
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-clang';
                const NINTENDO_SDK_ROOT_CMAKE=process.env.NINTENDO_SDK_ROOT.replace(/\\/g, '/');
            
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -H. -B${CMAKE_BUILD_PATH} -G "Unix Makefiles" -DCMAKE_SYSTEM_NAME=Switch -DSWITCH_PLATFORM=1 -DCMAKE_C_COMPILER=${NINTENDO_SDK_ROOT_CMAKE}/Compilers/NX/nx/aarch64/bin/clang.exe -DCMAKE_CXX_COMPILER=${NINTENDO_SDK_ROOT_CMAKE}/Compilers/NX/nx/aarch64/bin/clang++.exe ..`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`))
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`]
                else
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`, `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.stripped.so~`]
            }
        },
    }
}


/////////////////// make
async function runPuertsMake(cwd: string, options: BuildOptions) {
    //// 环境与依赖监测 environment and dependencies checking.
    if (!existsSync(`${cwd}/CMakeLists.txt`)) {
        console.error("[Puer] Cannot find CMakeLists.txt");
        process.exit();
    }
    const cmakeListFile = readFileSync(`${cwd}/CMakeLists.txt`, 'utf-8');
    let cmakeAddedLibraryName: string;
    let match = cmakeListFile.match(/add_library\((\w*)/);
    let isExecutable = false;
    if (match) {
        cmakeAddedLibraryName = match[1];
    } else {
        cmakeAddedLibraryName = cmakeListFile.match(/add_executable\((\w*)/)[1];
        isExecutable = true;
    }

    const checkCMake = exec("cmake --version", { silent: true });
    if (checkCMake.stderr && !checkCMake.stdout) {
        console.error("[Puer] CMake is not installed");
        process.exit();
    }
    if (options.backend == "v8_9.4") {
        options.backend = "v8_9.4.146.24"
    }
    if (!existsSync(`${cwd}/../native_src/.backends/${options.backend}`)) {
        await downloadBackend(cwd, options.backend);
    }
    if (options.platform == "win" && options.config != "Release") {
        options.config = "RelWithDebInfo"
    }

    const BuildConfig = (platformCompileConfig as any)[options.platform][options.arch];
    const CMAKE_BUILD_PATH = cwd + `/build_${options.platform}_${options.arch}_${options.backend}${options.config != "Release" ? "_debug" : ""}`
    const OUTPUT_PATH = cwd + '/../Assets/core/upm/Plugins/' + BuildConfig.outputPluginPath;
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const BackendConfig = JSON.parse(readFileSync(join(__dirname, 'backends.json'), 'utf-8'))[options.backend]?.config;

    if (BackendConfig?.skip?.[options.platform]?.[options.arch]) {
        console.log("=== Puer ===");
        console.log(`not supported yet: ${options.backend} in ${options.platform} ${options.arch}`);
        console.log("=== Puer ===");
        return;
    }
    if (options.config == 'Debug') {
        BackendConfig.definition = BackendConfig.definition || [];
        BackendConfig.definition.push("WITH_INSPECTOR");
    }
    const definitionD = (BackendConfig.definition || []).join(';')
    const linkD = (BackendConfig['link-libraries'][options.platform]?.[options.arch] || []).join(';')
    const incD = (BackendConfig.include || []).join(';')
    
    if ('native_src_il2cpp' == basename(cwd)) {
         if (!existsSync(join(cwd, 'Src/FunctionBridge.Gen.h'))) {
             console.warn(`${cwd}/Src/FunctionBridge.Gen.h not existed! using default one`);
             cp(join(cwd, '../cli/FunctionBridge.Gen.h'), join(cwd, 'Src/FunctionBridge.Gen.h'));
         }
         if (!existsSync(join(cwd, '../Assets/core/upm/Plugins/puerts_il2cpp/unityenv_for_puerts.h'))) {
             console.warn(`${join(cwd, '../Assets/core/upm/Plugins/puerts_il2cpp/unityenv_for_puerts.h')} not existed! using default one`);
             cp(join(cwd, '../cli/unityenv_for_puerts.h'), join(cwd, 'Inc/unityenv_for_puerts.h'));
         }
         if (!existsSync(join(cwd, '../Assets/core/upm/Plugins/puerts_il2cpp/UnityExports4Puerts.h'))) {
             console.warn(`${join(cwd, '../Assets/core/upm/Plugins/puerts_il2cpp/UnityExports4Puerts.h')} not existed! using default one`);
             cp(join(cwd, '../cli/UnityExports4Puerts.h'), join(cwd, 'Inc/UnityExports4Puerts.h'));
         }
    }

    mkdir('-p', CMAKE_BUILD_PATH);
    mkdir('-p', OUTPUT_PATH)
    const DArgsName = ['-DBACKEND_DEFINITIONS=', '-DBACKEND_LIB_NAMES=', '-DBACKEND_INC_NAMES=']
    let CmakeDArgs = [definitionD, linkD, incD].map((r, index) => r ? DArgsName[index] + '"' + r + '"' : null).filter(t => t).join(' ');
    
    options.websocket = options.websocket || 0
    CmakeDArgs += ` -DWITH_WEBSOCKET=${options.websocket}`;

    var outputFile = BuildConfig.hook(
        CMAKE_BUILD_PATH,
        options,
        cmakeAddedLibraryName,
        CmakeDArgs
    );
    if (isExecutable) return {};
    if (!(outputFile instanceof Array)) outputFile = [outputFile];
    const copyConfig = (BackendConfig['copy-libraries'][options.platform]?.[options.arch] || [])
        .map((pathToBackend: string) => join(cwd, '../native_src/.backends', options.backend, pathToBackend))
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

async function makeOSXUniveralBinary(cwd: string, copyConfig: string[][]): Promise<void> {
    const OUTPUT_PATH = cwd + '/../Assets/core/upm/Plugins/macOS';
    const cmakeAddedLibraryName = readFileSync(`${cwd}/CMakeLists.txt`, 'utf-8').match(/add_library\((\w*)/)[1];

    const arm64binary = cwd + '/../Assets/core/upm/Plugins/' + platformCompileConfig.osx.arm64.outputPluginPath + `/lib${cmakeAddedLibraryName}.dylib`;
    const x64binary = cwd + '/../Assets/core/upm/Plugins/' + platformCompileConfig.osx.x64.outputPluginPath + `/${cmakeAddedLibraryName}.bundle`;
    assert.equal(0, exec(`lipo -create -output ${join(OUTPUT_PATH, cmakeAddedLibraryName + '.bundle')} ${arm64binary} ${x64binary}`).code)

    rm('-rf', arm64binary);
    rm('-rf', x64binary);
}

export default runPuertsMake;
export { platformCompileConfig, makeOSXUniveralBinary }
