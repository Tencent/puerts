import { cp, exec, mkdir, rm } from "@puerts/shell-util";
import assert from "assert";
import { existsSync, readFileSync, writeFileSync } from "fs";
import glob from "glob";
import { basename, extname, join, relative } from "path";
import runPuertsMake from "./make.mjs";

////////////// dotnet-test
function collectCSFilesAndMakeCompileConfig(dir, workdir, excludeGenerator) {
    const definitions = `
    <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Debug|AnyCPU' ">
        <DefineConstants>${process.platform == 'win32' ? 'PLATFORM_WINDOWS' : 'PLATFORM_MAC'};PUER_CONSOLE_TEST;PUERTS_GENERAL;DISABLE_AUTO_REGISTER;PUERTS_REFLECT_ALL_EXTENSION;TRACE;DEBUG;NETSTANDARD;NETSTANDARD2_1;</DefineConstants>
        <AppendTargetFrameworkToOutputPath>false</AppendTargetFrameworkToOutputPath>
        <WarningLevel>0</WarningLevel>
        <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
    </PropertyGroup>
    `;
    
    const linkPuerTS = `
    <ItemGroup>
        ${glob.sync(join(dir, '../../Assets/core/upm/**/*.cs').replace(/\\/g, '/'))
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, '../../Assets/core/upm/'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')}
    </ItemGroup>
    `;
    
    const linkPuerTSCommonJS = `
    <ItemGroup>
        ${glob.sync(join(dir, '../../Assets/commonjs/upm/Runtime/**/*.cs').replace(/\\/g, '/'))
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, '../../Assets/commonjs/upm/Runtime/'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')}
    </ItemGroup>
    `;
    
    const linkUnitTests = `
    <ItemGroup>
        ${glob.sync(join(dir, '../Src/Cases/**/*.cs').replace(/\\/g, '/'))
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, '../Src/Cases'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')}
    </ItemGroup>
    `;
    
    const linkGenerators = `
    <ItemGroup>
        ${glob.sync(join(dir, './Src/**/*.cs').replace(/\\/g, '/'))
            .filter(pathname => excludeGenerator ? pathname.indexOf('WrapperGenerator') == -1 : true)
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, './Src/'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')}
    </ItemGroup>
    `;
    
    return [definitions, linkPuerTS, linkPuerTSCommonJS, linkUnitTests, linkGenerators].join('\n');
}

function compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1 = v1Parts[i] || 0;
        const v2 = v2Parts[i] || 0;

        if (v1 < v2) {
            return -1;
        }
        if (v1 > v2) {
            return 1;
        }
    }

    return 0;
}

function selectSdk(workdir) {
    const sdk_list = exec('dotnet --list-sdks');
    if (sdk_list.code == 0) {
        const sdkVersions = sdk_list.stdout
        .split('\n') // 按行分割
        .filter(line => line.trim() !== '' && /^\d+\.\d+\.\d+/.test(line))
        .map(line => line.split(' ')[0]) 
        .filter((value, index, self) => self.indexOf(value) === index);
        //console.log(sdkVersions);
        
        let selectedVersion
        
        for (var i = 0; i < sdkVersions.length; ++i) {
            if(compareVersions(sdkVersions[i], '9.0.0') < 0) {
                if(!selectedVersion || compareVersions(selectedVersion, sdkVersions[i]) < 0) {
                    selectedVersion = sdkVersions[i];
                }
            }
        }
        
        if (selectedVersion) {
            console.log(`selected sdk ${selectedVersion}`)
            
            const global_cfg = 
            
            writeFileSync(
                join(workdir, 'global.json'),
                JSON.stringify({
                  "sdk": {
                    "version": selectedVersion
                  }
                })
            );
            return;
        }
    }
    throw new Error('can not find sdk less than 9.0.0');
}

async function runTest(cwd, copyConfig, runInReflection, filter = '') {
    if (!existsSync(`${cwd}/Src/Helloworld.cs`)) {
        console.error("[Puer] Cannot find UnitTest Src");
        process.exit();
    }
    const testProjectName = "vsauto-" + (runInReflection ? 'reflect' : 'static');
    const workdir = join(cwd, testProjectName);

    rm("-rf", workdir);
    rm("-rf", join(cwd, 'Src/StaticWrapper'));
    
    mkdir("-p", workdir);
    selectSdk(workdir);
    exec(`dotnet new nunit`, { cwd: workdir });
    rm('-rf', join(workdir, 'UnitTest1.cs'));
    rm('-rf', join(workdir, 'Usings.cs'));
    
    const originProjectConfig = readFileSync(
        join(workdir, `${testProjectName}.csproj`), 'utf-8'
    );

    const binPath = join(workdir, './bin/Debug');
    mkdir("-p", binPath);
    copyConfig.forEach((fileToCopy) => {
        const ext = extname(fileToCopy);
        cp(fileToCopy, binPath + (ext == '.bundle' ? `/lib${basename(fileToCopy, ext)}.dylib` : ''));
    });
    
    mkdir("-p", join(workdir, 'Properties'));
    // 生成launchSettings.json
    writeFileSync(
        join(workdir, 'Properties', 'launchSettings.json'),
        JSON.stringify({
            "profiles": {
                "vsauto-static": {
                    "commandName": "Project",
                    "nativeDebugging": true
                }
            }
        })
    );

    if (!runInReflection) {
        // 生成project 用于跑wrapper
        writeFileSync(
            join(workdir, `${testProjectName}.csproj`),
            originProjectConfig.replace('</Project>', [collectCSFilesAndMakeCompileConfig(cwd, workdir, false), '</Project>'].join('\n'))
        );

        assert.equal(0, exec(`dotnet build ${testProjectName}.csproj -p:StartupObject=PuerGen -v quiet`, { cwd: workdir }).code);
    
        // 运行generate
        mkdir('-p', join(cwd, "Src/StaticWrapper"));
        assert.equal(0, exec(`dotnet run --project ${testProjectName}.csproj`, { cwd: workdir }).code);
    }

    // 生成csproj
    writeFileSync(
        join(workdir, `${testProjectName}.csproj`),
        originProjectConfig.replace('</Project>', [collectCSFilesAndMakeCompileConfig(cwd, workdir, !runInReflection), '</Project>'].join('\n'))
    );

    // 运行测试
    assert.equal(0, exec(`dotnet build ${testProjectName}.csproj -p:StartupObject=PuertsTest -v quiet`, { cwd: workdir }).code);
    assert.equal(0, exec(`dotnet test ${testProjectName}.csproj --blame-hang-timeout 10000ms ${filter ? `--filter ${filter}` : ''}`, { cwd: workdir }).code);
}

function getPlatform() {
    if (process.platform == 'win32') {
        return 'win';
    }
    if (process.platform == 'darwin') {
        return 'osx';
    }
    return process.platform;
}

function getExeSuffix() {
    if (process.platform == 'win32') {
        return '.exe';
    }
    if (process.platform == 'darwin') {
        return '.app/Contents/MacOS/unity';
    }
    return "";
}

export async function dotnetTest(cwd, backend, filter = '', thread_safe = false) {
    // 编译binary
    const copyConfig = await runPuertsMake(join(cwd, '../../native_src'), {
        platform: getPlatform(),
        config: "Debug",
        backend: backend || 'v8_9.4',
        arch: process.arch,
        websocket: 1,
        thread_safe: thread_safe
    });

    // await runTest(cwd, copyConfig, true, filter);
    await runTest(cwd, copyConfig, false, filter);
}

export async function unityTest(cwd, unityPath) {
    function execUnityEditor(args) {
        const unityBatchModeBase = `"${unityPath}" -batchmode -nographics -quit -projectPath "${cwd}" -logFile "${cwd}/log.txt"`;
        const code = exec(`${unityBatchModeBase} ${args}`).code;
        if (code != 0) {
            throw new Error(`ExecUnity failed: ${readFileSync(cwd + "/log.txt", 'utf-8')}`);
        }
        return;
    }
    
    const platform = getPlatform();
    const exeSuffix = getExeSuffix();

    rm("-rf", `${cwd}/Assets/Gen`);
    rm("-rf", `${cwd}/build`);
    rm("-rf", `${cwd}/Assets/Gen.meta`);
    rm("-rf", join(cwd, 'Assets/csc.rsp'));
    writeFileSync(`${cwd}/Assets/csc.rsp`, `
        -define:PUERTS_DISABLE_IL2CPP_OPTIMIZATION
    `);
    rm("-rf", join(cwd, '../../Assets/core/upm/Plugins/puerts_il2cpp'));
    console.log("[Puer] Building puerts v1");
    await runPuertsMake(join(cwd, '../../native_src'), {
        backend: 'v8_9.4.146.24',
        platform: platform,
        config: 'Debug',
        arch: process.arch,
        websocket: 1
    });

    console.log("[Puer] Generating wrapper");
    execUnityEditor(`-executeMethod TestBuilder.GenV1`);
    rm("-rf", `${cwd}/Library/ScriptAssemblies`);
    
    console.log("[Puer] Building testplayer for v1");
    mkdir("-p", `${cwd}/build/v1`);
    execUnityEditor(`-executeMethod TestBuilder.BuildWindowsV1`);

    console.log("[Puer] Running test in v1");
    const v1code = exec(`${cwd}/build/v1/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log1.txt`).code;
    assert.equal(0, v1code);

    console.log("[Puer] Generating FunctionBridge");
    rm("-rf", join(cwd, 'Assets/csc.rsp'));
    writeFileSync(`${cwd}/Assets/csc.rsp`, `
        -define:PUERTS_CPP_OUTPUT_TO_UPM
        -define:PUERTS_IL2CPP_OPTIMIZATION
    `);
    
    console.log('-------------------------Without Wrapper test-------------------------');
    execUnityEditor(`-executeMethod TestBuilder.GenV2WithoutWrapper`);
    rm("-rf", `${cwd}/Library/ScriptAssemblies`);

    console.log("[Puer] Building testplayer for v2");
    mkdir("-p", `${cwd}/build/v2`);
    execUnityEditor(`-executeMethod TestBuilder.BuildWindowsV2`);
    console.log("[Puer] Running test in v2");
    const v2code_reflection = exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log2.txt`).code;

    assert.equal(0, v2code_reflection);
    
    console.log('-------------------------With Full Wrapper test-------------------------');
    execUnityEditor(`-executeMethod TestBuilder.GenV2`);
    rm("-rf", `${cwd}/Library/ScriptAssemblies`);

    console.log("[Puer] Building testplayer for v2");
    mkdir("-p", `${cwd}/build/v2`);
    execUnityEditor(`-executeMethod TestBuilder.BuildWindowsV2`);
    console.log("[Puer] Running test in v2");
    const v2code = exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log3.txt`).code;

    assert.equal(0, v2code);
    
    console.log('-------------------------With Full Wrapper test(quickjs)-------------------------');
    await runPuertsMake(join(cwd, '../../native_src'), {
        backend: 'quickjs',
        platform: platform,
        config: 'Debug',
        arch: process.arch,
        websocket: 1
    });

    rm("-rf", `${cwd}/Library/ScriptAssemblies`);

    console.log("[Puer] Building testplayer for v2");
    mkdir("-p", `${cwd}/build/v2`);
    execUnityEditor(`-executeMethod TestBuilder.BuildWindowsV2`);
    console.log("[Puer] Running test in v2");
    const v2code_qjs = exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log4.txt`).code;
    
    console.log('-------------------------With Full Wrapper test(mult)-------------------------');
    await runPuertsMake(join(cwd, '../../native_src'), {
        backend: 'mult',
        platform: platform,
        config: 'Debug',
        arch: process.arch,
        websocket: 1
    });

    rm("-rf", `${cwd}/Library/ScriptAssemblies`);

    console.log("[Puer] Building testplayer for v2");
    mkdir("-p", `${cwd}/build/v2`);
    execUnityEditor(`-executeMethod TestBuilder.BuildWindowsV2`);
    console.log("[Puer] Running test in v2");
    const v2code_mult = exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log5.txt`).code;

    assert.equal(0, v2code_mult);
}
