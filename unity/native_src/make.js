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
const iconv = require('iconv-lite')
const sxExecAsync = async function (command) {
    return new Promise((resolve, reject) => {
        options.async = true;
        let child = sx.exec(command, {
            async: true,
            silent: true,
            encoding: 'binary'
        }, code => {
            code ? reject(code) : resolve(code);
        });
        child.stdout.on('data', function (data) {
            console.log(iconv.decode(data, process.platform == 'win32' ? "gb2312" : 'utf-8'));
        })
        child.stderr.on('data', function (data) {
            console.error(iconv.decode(data, process.platform == 'win32' ? "gb2312" : 'utf-8'));
        })
    })
}
const { program, Option } = require('commander');
const { join } = require('path');

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
const options = program.opts();

if (!fs.existsSync(`${pwd}/${options.backend}`)) {
    console.error("[Puer] Cannot find JS backend library");
    process.exit();
}
const checkCMake = sx.exec("cmake --version", { silent: true });
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
            hook: async function (CMAKE_BUILD_PATH, options, cmakeDArgs) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = 'android-21';
                const ABI = 'armeabi-v7a';
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-4.9';

                await sxExecAsync(`cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B${CMAKE_BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`)
                await sxExecAsync(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                return `${CMAKE_BUILD_PATH}/libpuerts.so`
            }
        },
        'arm64': {
            outputPluginPath: 'Android/libs/arm64-v8a/',
            hook: async function (CMAKE_BUILD_PATH, options, cmakeDArgs) {
                const NDK = process.env.ANDROID_NDK || process.env.ANDROID_NDK_HOME || '~/android-ndk-r21b';
                const API = 'android-21';
                const ABI = 'arm64-v8a';
                const TOOLCHAIN_NAME = 'arm-linux-androideabi-clang';

                await sxExecAsync(`cmake ${cmakeDArgs} -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DANDROID_ABI=${ABI} -H. -B${CMAKE_BUILD_PATH} -DCMAKE_TOOLCHAIN_FILE=${NDK}/build/cmake/android.toolchain.cmake -DANDROID_NATIVE_API_LEVEL=${API} -DANDROID_TOOLCHAIN=clang -DANDROID_TOOLCHAIN_NAME=${TOOLCHAIN_NAME}`)
                await sxExecAsync(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                return `${CMAKE_BUILD_PATH}/libpuerts.so`
            }
        }
    },
    'ios': {
        'arm64': {
            outputPluginPath: 'iOS',
            hook: async function (CMAKE_BUILD_PATH, options, cmakeDArgs) {
                sx.cd(CMAKE_BUILD_PATH);
                await sxExecAsync(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -DCMAKE_TOOLCHAIN_FILE=../cmake/ios.toolchain.cmake -DPLATFORM=OS64 -GXcode ..`)
                sx.cd("..")
                await sxExecAsync(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                return `${CMAKE_BUILD_PATH}/${options.config}-iphoneos/libpuerts.a`
            }
        }
    },
    'osx': {
        'x64': {
            outputPluginPath: 'macOS/x86_64',
            hook: async function (CMAKE_BUILD_PATH, options, cmakeDArgs) {
                sx.cd(CMAKE_BUILD_PATH);
                await sxExecAsync(`cmake ${cmakeDArgs} -DTHREAD_SAFE=1 -DJS_ENGINE=${options.backend} -GXcode ..`)
                sx.cd("..")
                await sxExecAsync(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                sx.mv(`${CMAKE_BUILD_PATH}/${options.config}/libpuerts.dylib`, `${CMAKE_BUILD_PATH}/${options.config}/puerts.bundle`)
                return `${CMAKE_BUILD_PATH}/${options.config}/puerts.bundle`
            }
        },
        'arm64': {
            outputPluginPath: 'macOS/arm64',
            hook: async function (CMAKE_BUILD_PATH, options, cmakeDArgs) {
                sx.cd(CMAKE_BUILD_PATH);
                await sxExecAsync(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DFOR_SILICON=ON -GXcode ..`)
                sx.cd("..")
                await sxExecAsync(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                return `${CMAKE_BUILD_PATH}/${options.config}/libpuerts.dylib`
            }
        }
    },
    'win': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: async function (CMAKE_BUILD_PATH, options, cmakeDArgs) {
                sx.cd(CMAKE_BUILD_PATH);
                await sxExecAsync(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -G "Visual Studio 16 2019" -A x64 ..`)
                sx.cd("..")
                await sxExecAsync(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                return `${CMAKE_BUILD_PATH}/${options.config}/puerts.dll`
            }
        },
        'ia32': {
            outputPluginPath: 'x86',
            hook: async function (CMAKE_BUILD_PATH, options, cmakeDArgs) {
                sx.cd(CMAKE_BUILD_PATH);
                await sxExecAsync(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} -G "Visual Studio 16 2019" -A Win32 ..`)
                sx.cd("..")
                await sxExecAsync(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                return `${CMAKE_BUILD_PATH}/${options.config}/puerts.dll`
            }
        }
    },
    'linux': {
        'x64': {
            outputPluginPath: 'x86_64',
            hook: async function (CMAKE_BUILD_PATH, options, cmakeDArgs) {
                sx.cd(CMAKE_BUILD_PATH);
                await sxExecAsync(`cmake ${cmakeDArgs} -DJS_ENGINE=${options.backend} -DCMAKE_BUILD_TYPE=${options.config} ..`)
                sx.cd("..")
                await sxExecAsync(`cmake --build ${CMAKE_BUILD_PATH} --config ${options.config}`)

                return `${CMAKE_BUILD_PATH}/libpuerts.so`;
            }
        }
    }
}


    /////////////////// make
;
(async function () {
    if (options.platform && options.arch == 'auto') {
        let promiseChain = Promise.resolve();
        Object.keys(platformCompileConfig[options.platform]).forEach(arch => {
            promiseChain = promiseChain.then(function () {
                options.arch = arch;
                return runMake()
            })
        });

    } else if (!options.platform && options.arch == 'auto') {
        options.platform = nodePlatformToPuerPlatform[process.platform]
        options.arch = process.arch;
        return runMake();

    } else {
        return runMake();
    }
})().catch(e => {
    console.error(e)
})

async function runMake() {
    const BuildConfig = platformCompileConfig[options.platform][options.arch];
    const CMAKE_BUILD_PATH = pwd + `/build_${options.platform}_${options.arch}_${options.backend}${options.config != "Release" ? "_debug" : ""}`
    const OUTPUT_PATH = pwd + '/../Assets/Puerts/Plugins/' + BuildConfig.outputPluginPath;
    const BackendConfig = JSON.parse(fs.readFileSync(pwd + `/cmake/${options.backend}/backend.json`))

    if (BackendConfig.skip?.[options.platform]?.[options.arch]) {
        console.log("=== Puer ===");
        console.log(`not supported yet: ${options.backend} in ${options.platform} ${options.arch}`);
        console.log("=== Puer ===");
        return;
    }
    const definitionD = (BackendConfig.definition || []).join(';')
    const linkD = (BackendConfig.link[options.platform]?.[options.arch] || []).join(';')
    const incD = (BackendConfig.include || []).join(';')

    sx.mkdir('-p', CMAKE_BUILD_PATH);
    sx.mkdir('-p', OUTPUT_PATH)
    const DArgsName = ['-DBACKEND_DEFINITIONS=', '-DBACKEND_LIB_NAMES=', '-DBACKEND_INC_NAMES=']
    var outputFile = await BuildConfig.hook(
        CMAKE_BUILD_PATH,
        options,
        [definitionD, linkD, incD].map((r, index) => r ? DArgsName[index] + '"' + r + '"' : null).filter(t => t).join(' ')
    );
    const copyConfig = (BackendConfig.copy[options.platform]?.[options.arch] || [])
        .map(pathToBackend => join(pwd, options.backend, pathToBackend))
        .concat([outputFile]);

    copyConfig?.forEach(filepath => {
        sx.cp(filepath, OUTPUT_PATH)
        if (options.config != 'Release') {
            if (!fs.existsSync('../general/vs2013/Bin'))
                sx.mkdir('-p', filepath, '../general/vs2013/Bin')
            if (!fs.existsSync('../general/vs2022/Bin'))
                sx.mkdir('-p', filepath, '../general/vs2022/Bin')
            sx.cp(filepath, '../general/vs2022/Bin')
            sx.cp(filepath, '../general/vs2013/Bin')
        }
    })
}