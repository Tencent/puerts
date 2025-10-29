import { cp, exec, mkdir, rm } from "@puerts/shell-util";
import assert from "assert";
import { existsSync, readFileSync, writeFileSync } from "fs";
import glob from "glob";
import { basename, extname, join, relative, dirname } from "path";
import runPuertsMake from "./make.mjs";
import { execFileSync, spawnSync } from "child_process";

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
            originProjectConfig.replace('</Project>', [collectCSFilesAndMakeCompileConfig(cwd, workdir, false), '</Project>'].join('\n')).replace('<ImplicitUsings>enable</ImplicitUsings>', '<ImplicitUsings>disable</ImplicitUsings>')
        );

        assert.equal(0, exec(`dotnet build ${testProjectName}.csproj -p:StartupObject=PuerGen -v quiet`, { cwd: workdir }).code);
    
        // 运行generate
        mkdir('-p', join(cwd, "Src/StaticWrapper"));
        assert.equal(0, exec(`dotnet run --project ${testProjectName}.csproj`, { cwd: workdir }).code);
    }

    // 生成csproj
    writeFileSync(
        join(workdir, `${testProjectName}.csproj`),
        originProjectConfig.replace('</Project>', [collectCSFilesAndMakeCompileConfig(cwd, workdir, !runInReflection), '</Project>'].join('\n')).replace('<ImplicitUsings>enable</ImplicitUsings>', '<ImplicitUsings>disable</ImplicitUsings>')
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

function tryGetPythonFromPath() {
    try {
      const out = execFileSync('python', ['-c', 'import sys; print(sys.executable)'], { encoding: 'utf8' }).trim();
      if (out && existsSync(out)) return { exe: out, home: dirname(out) };
    } catch {}
    return null;
}

export async function dotnetTest(cwd, backend, filter = '', thread_safe = false) {
    // 编译binary
    let dlls = await runPuertsMake(join(cwd, '../../native/puerts'), {
        platform: getPlatform(),
        config: "Debug",
        arch: process.arch,
        thread_safe: thread_safe
    });

    const qjsdlls = await runPuertsMake(join(cwd, '../../native/papi-quickjs'), {
        platform: getPlatform(),
        config: "Debug",
        arch: process.arch,
        thread_safe: thread_safe
    });
    dlls = dlls.concat(qjsdlls);

    const v8dlls = await runPuertsMake(join(cwd, '../../native/papi-v8'), {
        platform: getPlatform(),
        config: "Debug",
        arch: process.arch,
        thread_safe: thread_safe
    });
    dlls = dlls.concat(v8dlls);
    
    const luadlls = await runPuertsMake(join(cwd, '../../native/papi-lua'), {
        platform: getPlatform(),
        config: "Debug",
        arch: process.arch,
        thread_safe: thread_safe
    });
    dlls = dlls.concat(luadlls);
    
    const nodedlls = await runPuertsMake(join(cwd, '../../native/papi-nodejs'), {
        platform: getPlatform(),
        config: "Debug",
        arch: process.arch,
        thread_safe: thread_safe
    });
    dlls = dlls.concat(nodedlls);
	
	const pyInfo = tryGetPythonFromPath();
	
	const pydlls = await runPuertsMake(join(cwd, '../../native/papi-python'), {
        platform: getPlatform(),
        config: "Debug",
        arch: process.arch,
        thread_safe: thread_safe,
		cmake_args: (pyInfo && pyInfo.exe) ? `-DPython3_EXECUTABLE="${pyInfo.exe}"` : undefined
    });
    dlls = dlls.concat(pydlls);

    const wsppaddondlls = await runPuertsMake(join(cwd, '../../native/wsppaddon'), {
        platform: getPlatform(),
        config: "Debug",
        arch: process.arch,
        websocket: 1,
        thread_safe: thread_safe
    });
    dlls = dlls.concat(wsppaddondlls);

    // await runTest(cwd, copyConfig, true, filter);
    await runTest(cwd, dlls, false, filter);
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
    
    // Helper function to check test result and log if needed
    function checkTestResult(exitCode, logFile) {
        if (exitCode !== 0) {
            try {
                const logContent = readFileSync(logFile, 'utf-8');
                console.error(logContent);
            } catch (e) {
                console.error(`Failed to read log file: ${e.message}`);
            }
        }
        return exitCode;
    }
    
    const platform = getPlatform();
    const exeSuffix = getExeSuffix();

    rm("-rf", `${cwd}/Assets/Gen`);
    rm("-rf", `${cwd}/build`);
    rm("-rf", `${cwd}/Assets/Gen.meta`);
    //rm("-rf", join(cwd, 'Assets/csc.rsp'));
    //writeFileSync(`${cwd}/Assets/csc.rsp`, `
    //    -define:PUERTS_DISABLE_IL2CPP_OPTIMIZATION
    //`);
    rm("-rf", join(cwd, '../../Assets/core/upm/Plugins/puerts_il2cpp'));
    
    /*
    console.log("[Puer] Building puerts v1");
    await runPuertsMake(join(cwd, '../../native_src'), {
        backend: 'v8_9.4.146.24',
        platform: platform,
        config: 'Debug',
        arch: 'x64',
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
    */

    //console.log("[Puer] Generating FunctionBridge");
    //rm("-rf", join(cwd, 'Assets/csc.rsp'));
    //writeFileSync(`${cwd}/Assets/csc.rsp`, `
    //    -define:PUERTS_CPP_OUTPUT_TO_UPM
    //    -define:PUERTS_IL2CPP_OPTIMIZATION
    //`);
    
    await runPuertsMake(join(cwd, '../../native/puerts'), {
        platform: platform,
        config: "Debug",
        arch: process.arch
    });

    await runPuertsMake(join(cwd, '../../native/papi-quickjs'), {
        platform: platform,
        config: "Debug",
        arch: process.arch
    });

    await runPuertsMake(join(cwd, '../../native/papi-v8'), {
        platform: platform,
        config: "Debug",
        arch: process.arch
    });
    
    await runPuertsMake(join(cwd, '../../native/papi-lua'), {
        platform: platform,
        config: "Debug",
        arch: process.arch
    });
    
    await runPuertsMake(join(cwd, '../../native/papi-nodejs'), {
        platform: platform,
        config: "Debug",
        arch: process.arch
    });

    await runPuertsMake(join(cwd, '../../native/papi-python'), {
        platform: platform,
        config: "Debug",
        websocket: 1,
        arch: process.arch
    });
	
	await runPuertsMake(join(cwd, '../../native/wsppaddon'), {
        platform: platform,
        config: "Debug",
        websocket: 1,
        arch: process.arch
    });
    
    console.log('-------------------------Without Wrapper test-------------------------');
    execUnityEditor(`-executeMethod TestBuilder.GenV2WithoutWrapper`);
    rm("-rf", `${cwd}/Library/ScriptAssemblies`);

    console.log("[Puer] Building testplayer");
    mkdir("-p", `${cwd}/build/v2`);
    execUnityEditor(`-executeMethod TestBuilder.BuildWindowsV2`);
    console.log("[Puer] Running test");
    const v2code_reflection = checkTestResult(
        exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log_reflection.txt`).code,
        `${cwd}/log_reflection.txt`
    );
    assert.equal(0, v2code_reflection);

    console.log('-------------------------Without Wrapper test(quickjs)-------------------------');
    process.env.SwitchToQJS = '1';
    console.log("[Puer] Running test");
    const v2code_qjs_reflection = checkTestResult(
        exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log_qjs_reflection.txt`).code,
        `${cwd}/log_qjs_reflection.txt`
    );
    assert.equal(0, v2code_qjs_reflection);
    
    console.log('-------------------------Without Wrapper test(nodejs)-------------------------');
    process.env.SwitchToQJS = '0';
    process.env.SwitchToNJS = '1';
    console.log("[Puer] Running test");
    const v2code_nodejs_reflection = checkTestResult(
        exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log_nodejs_reflection.txt`).code,
        `${cwd}/log_nodejs_reflection.txt`
    );
    assert.equal(0, v2code_nodejs_reflection);
    
    console.log('-------------------------Minimum bridge and Without Wrapper test-------------------------');

    process.env.SwitchToQJS = '0';
    process.env.SwitchToNJS = '0';
    
    execUnityEditor(`-executeMethod TestBuilder.GenMinimumWrappersAndBridge`);
    rm("-rf", `${cwd}/Library/ScriptAssemblies`);

    console.log("[Puer] Building testplayer");
    mkdir("-p", `${cwd}/build/v2`);
    execUnityEditor(`-executeMethod TestBuilder.BuildWindowsV2`);
    console.log("[Puer] Running test");
    const v2code_minimum_reflection = checkTestResult(
        exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log_minimum_reflection.txt`).code,
        `${cwd}/log_minimum_reflection.txt`
    );
    assert.equal(0, v2code_minimum_reflection);

    console.log('-------------------------Minimum bridge and Without Wrapper test(quickjs)-------------------------');
    process.env.SwitchToQJS = '1';
    console.log("[Puer] Running test");
    const v2code_qjs_minimum_reflection = checkTestResult(
        exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log_qjs_minimum_reflection.txt`).code,
        `${cwd}/log_qjs_minimum_reflection.txt`
    );
    assert.equal(0, v2code_qjs_minimum_reflection);
    
    console.log('-------------------------Minimum bridge and Without Wrapper test(nodejs)-------------------------');
    process.env.SwitchToQJS = '0';
    process.env.SwitchToNJS = '1';
    console.log("[Puer] Running test");
    const v2code_nodejs_minimum_reflection = checkTestResult(
        exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log_nodejs_minimum_reflection.txt`).code,
        `${cwd}/log_nodejs_minimum_reflection.txt`
    );
    assert.equal(0, v2code_nodejs_minimum_reflection);
    
    console.log('-------------------------Full Wrapper test-------------------------');
    process.env.SwitchToQJS = '0';
    process.env.SwitchToNJS = '0';
    
    execUnityEditor(`-executeMethod TestBuilder.GenV2`);
    rm("-rf", `${cwd}/Library/ScriptAssemblies`);

    console.log("[Puer] Building testplayer");
    mkdir("-p", `${cwd}/build/v2`);
    execUnityEditor(`-executeMethod TestBuilder.BuildWindowsV2`);
    console.log("[Puer] Running test");
    const v2code = checkTestResult(
        exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log_full_wrapper.txt`).code,
        `${cwd}/log_full_wrapper.txt`
    );
    assert.equal(0, v2code);
    
    console.log('-------------------------Full Wrapper test(quickjs)-------------------------');
    process.env.SwitchToQJS = '1';
    console.log("[Puer] Running test");
    const v2code_qjs = checkTestResult(
        exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log_qjs_full_wrapper.txt`).code,
        `${cwd}/log_qjs_full_wrapper.txt`
    );
    assert.equal(0, v2code_qjs);
    
    console.log('-------------------------Full Wrapper test(nodejs)-------------------------');
    process.env.SwitchToQJS = '0';
    process.env.SwitchToNJS = '1';
    console.log("[Puer] Running test");
    const v2code_nodejs = checkTestResult(
        exec(`${cwd}/build/v2/Tester${exeSuffix} -batchmode -nographics -logFile ${cwd}/log_nodejs_full_wrapper.txt`).code,
        `${cwd}/log_nodejs_full_wrapper.txt`
    );
    assert.equal(0, v2code_nodejs);
}
