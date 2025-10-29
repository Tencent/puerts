import { existsSync, readFileSync } from "fs";
import { cd, cp, exec, mkdir, mv, rm } from "@puerts/shell-util";
import { basename, join, normalize, dirname } from "path";
import * as assert from "assert";
import downloadBackend from "./backend.mjs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import * as process from "process";

const glob = createRequire(fileURLToPath(import.meta.url))('glob');

function getInstalledVSVersions() {
   try {
       const vswherePath = join(
           process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
           'Microsoft Visual Studio/Installer/vswhere.exe'
       );
      
       const output = exec(`"${vswherePath}" -format json`);
      
       return JSON.parse(output);
   } catch (error) {
       return [];
   }
}

function selectVisualStudioGenerator() {
   const installedVS = getInstalledVSVersions();
   
   if (installedVS.length > 0) {
      // 版本号排序逻辑（2019优先）
      const sortedVS = installedVS
         .map(vs => ({
             ...vs,
             majorVersion: parseInt(vs.installationVersion.split('.')[0])
         }))
         .sort((a, b) => {
            // 优先2019（版本16），然后按版本降序
            if (a.majorVersion === 16) return -1;
            if (b.majorVersion === 16) return 1;
            return b.majorVersion - a.majorVersion;
         });
      
      // 映射到CMake生成器名称
      const versionMap = {
         15: 'Visual Studio 15 2017',
         16: 'Visual Studio 16 2019',
         17: 'Visual Studio 17 2022'
      };
      
      const bestVersion = sortedVS[0].majorVersion;
      return versionMap[bestVersion] || `Visual Studio ${bestVersion}`;
   }
}

const platformCompileConfig = {
    'android': {
        'armv7': {
            outputPluginPath: 'Android/libs/armeabi-v7a/',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = options.backend.indexOf('node') !== -1 ? 'android-24' : (options.backend.indexOf('10.6.194') !== -1 ? 'android-23' : 'android-21');
                const ABI = 'armeabi-v7a';
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-4.9';

                let cmake_gen = `cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B"${CMAKE_BUILD_PATH}" -DCMAKE_TOOLCHAIN_FILE="${NDK}/build/cmake/android.toolchain.cmake" -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`;
                if(process.platform == "win32"){
                    cmake_gen += ' -G"Unix Makefiles"';
                    cmake_gen += ` -DCMAKE_MAKE_PROGRAM="${NDK}/prebuilt/windows-x86_64/bin/make.exe"`;
                }
                assert.equal(0, exec(cmake_gen).code);
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`))
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`];
                else{
                    let libs = [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`];
                    if(options.with_symbols && existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.symbol.so~`)){
                        libs.push(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.symbol.so~`);
                    }
                    return libs;
                }
            }
        },
        'arm64': {
            outputPluginPath: 'Android/libs/arm64-v8a/',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = options.backend.indexOf('node') !== -1 ? 'android-24' : (options.backend.indexOf('10.6.194') !== -1 ? 'android-23' : 'android-21');
                const ABI = 'arm64-v8a';
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-clang';

                let cmake_gen = `cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B"${CMAKE_BUILD_PATH}" -DCMAKE_TOOLCHAIN_FILE="${NDK}/build/cmake/android.toolchain.cmake" -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`;
                if(process.platform == "win32"){
                    cmake_gen += ' -G"Unix Makefiles"';
                    cmake_gen += ` -DCMAKE_MAKE_PROGRAM="${NDK}/prebuilt/windows-x86_64/bin/make.exe"`;
                }
                assert.equal(0, exec(cmake_gen).code);
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`))
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`];
                else{
                    let libs = [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`];
                    if(options.with_symbols && existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.symbol.so~`)){
                        libs.push(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.symbol.so~`);
                    }
                    return libs;
                }
            }
        },
        'x64': {
            outputPluginPath: 'Android/libs/x86_64/',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = options.backend.indexOf('node') !== -1 ? 'android-24' : (options.backend.indexOf('10.6.194') !== -1 ? 'android-23' : 'android-21');
                const ABI = 'x86_64';
                const TOOLCHAIN_NAME = 'x86_64-4.9';

                let cmake_gen = `cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B"${CMAKE_BUILD_PATH}" -DCMAKE_TOOLCHAIN_FILE="${NDK}/build/cmake/android.toolchain.cmake" -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`;
                if(process.platform == "win32"){
                    cmake_gen += ' -G"Unix Makefiles"';
                    cmake_gen += ` -DCMAKE_MAKE_PROGRAM="${NDK}/prebuilt/windows-x86_64/bin/make.exe"`;
                }
                assert.equal(0, exec(cmake_gen).code);
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`))
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`];
                else{
                    let libs = [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`];
                    if(options.with_symbols && existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.symbol.so~`)){
                        libs.push(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.symbol.so~`);
                    }
                    return libs;
                }
            }
        }
    },
    'ohos': {
        'armv7': {
            outputPluginPath: 'OpenHarmony/libs/armeabi-v7a/',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                const NDK = process.env.OHOS_NDK || process.env.OHOS_NDK_HOME;
                if (!NDK) throw new Error("please set OHOS_NDK environment variable first!");
                const ABI = 'armeabi-v7a';
                const cmake_bin_path = `${NDK}/build-tools/cmake/bin/cmake`;
                const ninja_bin_path = `${NDK}/build-tools/cmake/bin/ninja`;
                const toolchain_file = `${NDK}/build/cmake/ohos.toolchain.cmake`;
                let CMAKE_RPATH_SETTING = '';
                if (process.platform == "win32") {
                    CMAKE_RPATH_SETTING = '-DCMAKE_BUILD_WITH_INSTALL_RPATH=ON';
                }
                assert.equal(0, exec(`"${cmake_bin_path}" ${cmakeDArgs} -GNinja ${CMAKE_RPATH_SETTING} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DOHOS_ARCH=${ABI} -H. -B"${CMAKE_BUILD_PATH}"  -DOHOS_PLATFORM=OHOS -DCMAKE_TOOLCHAIN_FILE="${toolchain_file}" -DCMAKE_MAKE_PROGRAM="${ninja_bin_path}"`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`))
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`];
                else{
                    let libs = [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`];
                    if(options.with_symbols && existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.symbol.so~`)){
                        libs.push(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.symbol.so~`);
                    }
                    return libs;
                }
            }
        },
        'arm64': {
            outputPluginPath: 'OpenHarmony/libs/arm64-v8a/',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                const NDK = process.env.OHOS_NDK || process.env.OHOS_NDK_HOME;
                if (!NDK) throw new Error("please set OHOS_NDK environment variable first!");
                const ABI = 'arm64-v8a';
                const cmake_bin_path = `${NDK}/build-tools/cmake/bin/cmake`;
                const ninja_bin_path = `${NDK}/build-tools/cmake/bin/ninja`;
                const toolchain_file = `${NDK}/build/cmake/ohos.toolchain.cmake`;
                let CMAKE_RPATH_SETTING = '';
                if (process.platform == "win32") {
                    CMAKE_RPATH_SETTING = '-DCMAKE_BUILD_WITH_INSTALL_RPATH=ON';
                }
                assert.equal(0, exec(`"${cmake_bin_path}" ${cmakeDArgs} -GNinja ${CMAKE_RPATH_SETTING} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DOHOS_ARCH=${ABI} -H. -B"${CMAKE_BUILD_PATH}"  -DOHOS_PLATFORM=OHOS -DCMAKE_TOOLCHAIN_FILE="${toolchain_file}" -DCMAKE_MAKE_PROGRAM="${ninja_bin_path}"`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                if (existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`))
                    return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`];
                else{
                    let libs = [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`];
                    if(options.with_symbols && existsSync(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.symbol.so~`)){
                        libs.push(`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.symbol.so~`);
                    }
                    return libs;
                }
            }
        }
    },
    'ios': {
        'arm64': {
            outputPluginPath: 'iOS',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DCMAKE_TOOLCHAIN_FILE=../../cmake/ios.toolchain.cmake -DPLATFORM=OS64 -GXcode ..`).code);
                cd("..");
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);

                if (options.backend == 'mult') {
                    return [`${CMAKE_BUILD_PATH}/${options.config}-iphoneos/lib${cmakeAddedLibraryName}.a`, `${CMAKE_BUILD_PATH}/${options.config}-iphoneos/libqjsbackend.a`, `${CMAKE_BUILD_PATH}/${options.config}-iphoneos/libv8backend.a`];
                } else {
                    return `${CMAKE_BUILD_PATH}/${options.config}-iphoneos/lib${cmakeAddedLibraryName}.a`;
                }
            }
        }
    },
    'osx': {
        'x64': {
            outputPluginPath: 'macOS/x86_64',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -GXcode -DCMAKE_OSX_ARCHITECTURES=x86_64 ..`).code);
                cd("..");
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);
                assert.equal(0, exec(`codesign --sign - --options linker-signed --force ${CMAKE_BUILD_PATH}/${options.config}/lib${cmakeAddedLibraryName}.dylib`).code);

                mv(`${CMAKE_BUILD_PATH}/${options.config}/lib${cmakeAddedLibraryName}.dylib`, `${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.bundle`);
                return `${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.bundle`;
            }
        },
        'arm64': {
            outputPluginPath: 'macOS/arm64',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_OSX_ARCHITECTURES=arm64 -GXcode ..`).code);
                cd("..");
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);
                assert.equal(0, exec(`codesign --sign - --options linker-signed --force ${CMAKE_BUILD_PATH}/${options.config}/lib${cmakeAddedLibraryName}.dylib`).code);

                return `${CMAKE_BUILD_PATH}/${options.config}/lib${cmakeAddedLibraryName}.dylib`;
            }
        }
    },
    'win': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                cd(CMAKE_BUILD_PATH);
                const generator = options.generator || selectVisualStudioGenerator();
                const generatorSelector = generator ? `-G "${generator}"` : ""
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} ${generatorSelector} -A x64 ..`).code);
                cd("..");
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);

                let libs = [`${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.dll`];
                if(options.with_symbols && existsSync(`${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.pdb`)){
                    libs.push(`${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.pdb`);
                }
                return libs;
            }
        },
        'ia32': {
            outputPluginPath: 'x86',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                cd(CMAKE_BUILD_PATH);
                const generator = options.generator || selectVisualStudioGenerator();
                const generatorSelector = generator ? `-G "${generator}"` : ""
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} ${generatorSelector} -A Win32 ..`).code);
                cd("..");
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);

                let libs = [`${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.dll`];
                if(options.with_symbols && existsSync(`${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.pdb`)){
                    libs.push(`${CMAKE_BUILD_PATH}/${options.config}/${cmakeAddedLibraryName}.pdb`);
                }
                return libs;
            }
        }
    },
    'linux': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DCMAKE_BUILD_TYPE=${options.config} ..`).code);
                cd("..");
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);

                return `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`;
            }
        },
        'arm64': {
            outputPluginPath: 'Linux/libs/arm64/',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DCMAKE_BUILD_TYPE=${options.config} ..`).code);
                cd("..");
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code);

                return `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.so`;
            }
        }
    },
    'wasm': {
        'wasm32': {
            outputPluginPath: 'WebGL',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                cd(CMAKE_BUILD_PATH);
                assert.equal(0, exec(`emcmake cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DCMAKE_BUILD_TYPE=${options.config} ..`).code);
                assert.equal(0, exec(`emmake make`).code);
                cd("..");

                return `${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`;
            }
        }
    },
    'ns':{
        'arm64': {
            outputPluginPath: 'ns/libs/arm64-v8a/',
            hook: function (CMAKE_BUILD_PATH, options, cmakeAddedLibraryName, cmakeDArgs) {
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-clang';
                const NINTENDO_SDK_ROOT_CMAKE=process.env.NINTENDO_SDK_ROOT.replace(/\\/g, '/');
            
                assert.equal(0, exec(`cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -H. -B${CMAKE_BUILD_PATH} -G "Unix Makefiles" -DCMAKE_SYSTEM_NAME=Switch -DSWITCH_PLATFORM=1 -DCMAKE_C_COMPILER=${NINTENDO_SDK_ROOT_CMAKE}/Compilers/NX/nx/aarch64/bin/clang.exe -DCMAKE_CXX_COMPILER=${NINTENDO_SDK_ROOT_CMAKE}/Compilers/NX/nx/aarch64/bin/clang++.exe ..`).code)
                assert.equal(0, exec(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`).code)

                return [`${CMAKE_BUILD_PATH}/lib${cmakeAddedLibraryName}.a`]
            }
        }
    }
}

async function runPuertsMake(cwd, options) {
    if (!existsSync(`${cwd}/CMakeLists.txt`)) {
        console.error("[Puer] Cannot find CMakeLists.txt");
        process.exit();
    }
    const cmakeListFile = readFileSync(`${cwd}/CMakeLists.txt`, 'utf-8');
    let cmakeAddedLibraryName;
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
        options.backend = "v8_9.4.146.24";
    }
    const bn = basename(cwd);
    if (!options.backend) {
        options.backend = bn;
    }
    if (!existsSync(join(cwd, `.backends/${options.backend}`))) {
        await downloadBackend(cwd, options.backend);
    }
    if (options.platform == "win" && options.config != "Release") {
        options.config = "RelWithDebInfo";
    }

    const BuildConfig = platformCompileConfig[options.platform][options.arch];
    const CMAKE_BUILD_PATH = cwd + `/build_${options.platform}_${options.arch}_${options.backend}${options.config != "Release" ? "_debug" : ""}`;
    const OUTPUT_PATH = join(cwd, '../../Assets/core/upm/Plugins/', BuildConfig.outputPluginPath);
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const BackendConfig = JSON.parse(readFileSync(join(__dirname, 'backends.json'), 'utf-8'))[options.backend]?.config || {};

    if (BackendConfig?.skip?.[options.platform]?.[options.arch]) {
        console.log("=== Puer ===");
        console.log(`not supported yet: ${options.backend} in ${options.platform} ${options.arch}`);
        console.log("=== Puer ===");
        return;
    }
    BackendConfig.definition = BackendConfig.definition || [];
    if (options.config == 'Debug' || options.with_inspector) {
        BackendConfig.definition.push("WITH_INSPECTOR");
    }
    if (options.thread_safe) {
        console.log('################################## thread_safe ##################################');
        BackendConfig.definition.push("THREAD_SAFE");
    }
    if (options.jitless) {
        console.log('################################## jitless ##################################');
        BackendConfig.definition.push("JITLESS");
    }
    const definitionD = (BackendConfig.definition || []).join(';');
    const linkD = (BackendConfig['link-libraries']?.[options.platform]?.[options.arch] || []).join(';');
    const incD = (BackendConfig.include || []).join(';');

    if (options.rebuild && existsSync(CMAKE_BUILD_PATH)) {
        rm('-rf', CMAKE_BUILD_PATH);
    }

    mkdir('-p', CMAKE_BUILD_PATH);
    mkdir('-p', OUTPUT_PATH);
    const DArgsName = ['-DBACKEND_DEFINITIONS=', '-DBACKEND_LIB_NAMES=', '-DBACKEND_INC_NAMES='];
    let CmakeDArgs = [definitionD, linkD, incD].map((r, index) => r ? DArgsName[index] + '"' + r + '"' : null).filter(t => t).join(' ');
    
    options.websocket = options.websocket || 0;
    CmakeDArgs += ` -DWITH_WEBSOCKET=${options.websocket}`;
    CmakeDArgs += ` -DWITH_SYMBOLS=${options.with_symbols ? 'ON' : 'OFF'}`;


    for(let opt in BackendConfig?.cmake_options){
        CmakeDArgs = CmakeDArgs.concat(` ${BackendConfig?.cmake_options[opt]}`)
    }
	
	if (options.cmake_args) {
		CmakeDArgs += ` ${options.cmake_args}`;
	}

    var outputFile = BuildConfig.hook(
        CMAKE_BUILD_PATH,
        options,
        cmakeAddedLibraryName,
        CmakeDArgs
    );
    if (isExecutable) return {};
    if (!(outputFile instanceof Array)) outputFile = [outputFile];
    const copyConfig = (BackendConfig['copy-libraries']?.[options.platform]?.[options.arch] || [])
        .map((pathToBackend) => join(cwd, '.backends', options.backend, pathToBackend))
        .concat(outputFile);

    copyConfig?.forEach((filepath) => {
        if (
            process.platform == "win32" ?
                !glob.sync(normalize(filepath).replace(/\\/g, "/")).length :
                !glob.sync(normalize(filepath)).length
        ) {
            throw new Error("copy failed:" + normalize(filepath));
        }
        cp(filepath, OUTPUT_PATH);
    });

    return copyConfig;
}

async function makeOSXUniveralBinary(cwd, copyConfig) {
    const OUTPUT_PATH = join(cwd, '../../Assets/core/upm/Plugins/macOS');
    const cmakeAddedLibraryName = readFileSync(`${cwd}/CMakeLists.txt`, 'utf-8').match(/add_library\((\w*)/)[1];

    const arm64binary = join(cwd, '../../Assets/core/upm/Plugins/', platformCompileConfig.osx.arm64.outputPluginPath, `lib${cmakeAddedLibraryName}.dylib`);
    const x64binary = join(cwd, '../../Assets/core/upm/Plugins/', platformCompileConfig.osx.x64.outputPluginPath, `${cmakeAddedLibraryName}.bundle`);
    assert.equal(0, exec(`lipo -create -output ${join(OUTPUT_PATH, cmakeAddedLibraryName + '.bundle')} ${arm64binary} ${x64binary}`).code);
    assert.equal(0, exec(`codesign --sign - --options linker-signed --force ${join(OUTPUT_PATH, cmakeAddedLibraryName + '.bundle')}`).code);

    rm('-rf', arm64binary);
    rm('-rf', x64binary);
}

export default runPuertsMake;
export { platformCompileConfig, makeOSXUniveralBinary };
