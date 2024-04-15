import { cp, exec, mkdir, rm } from "@puerts/shell-util";
import assert from "assert";
import { existsSync, readFileSync, writeFileSync } from "fs";
import glob from "glob";
import { basename, extname, join, relative } from "path";
import runPuertsMake from "./make.mjs";

////////////// dotnet-test
function collectCSFilesAndMakeCompileConfig(dir: string, workdir: string, excludeGenerator: boolean) {

    const definitions = `
    <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Debug|AnyCPU' ">
        <DefineConstants>${process.platform == 'win32' ? 'PLATFORM_WINDOWS': 'PLATFORM_MAC'};PUER_CONSOLE_TEST;PUERTS_GENERAL;DISABLE_AUTO_REGISTER;PUERTS_REFLECT_ALL_EXTENSION;TRACE;DEBUG;NETSTANDARD;NETSTANDARD2_1;</DefineConstants>
        <AppendTargetFrameworkToOutputPath>false</AppendTargetFrameworkToOutputPath>
        <WarningLevel>0</WarningLevel>
        <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
    </PropertyGroup>
    `
    const linkPuerTS = `
    <ItemGroup>
        ${glob.sync(join(dir, '../../Assets/core/upm/**/*.cs').replace(/\\/g, '/'))
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, '../../Assets/core/upm/'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')}
    </ItemGroup>
    `
    const linkPuerTSCommonJS = `
    <ItemGroup>
        ${glob.sync(join(dir, '../../Assets/commonjs/upm/Runtime/**/*.cs').replace(/\\/g, '/'))
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, '../../Assets/commonjs/upm/Runtime/'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')}
    </ItemGroup>
    `
    
    const linkUnitTests = `
    <ItemGroup>
        ${glob.sync(join(dir, '../Src/Cases/**/*.cs').replace(/\\/g, '/'))
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, '../Src/Cases'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')
        }
    </ItemGroup>
    `

    const linkGenerators = `
    <ItemGroup>
        ${glob.sync(join(dir, './Src/**/*.cs').replace(/\\/g, '/'))
            .filter(pathname => excludeGenerator ? pathname.indexOf('WrapperGenerator') == -1 : true)
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, './Src/'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')
        }
    </ItemGroup>
    `
    return [definitions, linkPuerTS, linkPuerTSCommonJS, linkUnitTests, linkGenerators].join('\n');
}

async function runTest(cwd: string, copyConfig: any, runInReflection: boolean, filter: string = '') {
    if (!existsSync(`${cwd}/Src/Helloworld.cs`)) {
        console.error("[Puer] Cannot find UnitTest Src");
        process.exit();
    }
    const testProjectName = "vsauto-" + (runInReflection ? 'reflect' : 'static');
    const workdir = join(cwd, testProjectName);

    rm("-rf", workdir);
    rm("-rf", join(cwd, 'Src/StaticWrapper'));
    
    mkdir("-p", workdir);
    exec(`dotnet new nunit`, { cwd: workdir });
    rm('-rf', join(workdir, 'UnitTest1.cs'));
    rm('-rf', join(workdir, 'Usings.cs'));
    
    const originProjectConfig = readFileSync(
        join(workdir, `${testProjectName}.csproj`), 'utf-8'
    );

    const binPath = join(workdir, './bin/Debug');
    mkdir("-p", binPath);
    copyConfig.forEach((fileToCopy: string)=> {
        const ext = extname(fileToCopy)
        cp(fileToCopy, binPath + (ext == '.bundle' ? `/lib${basename(fileToCopy, ext)}.dylib`: ''));
    })

    if (!runInReflection) {
        // 生成project 用于跑wrapper
        writeFileSync(
            join(workdir, `${testProjectName}.csproj`),
            originProjectConfig.replace('</Project>', [collectCSFilesAndMakeCompileConfig(cwd, workdir, false), '</Project>'].join('\n'))
        );

        assert.equal(0, exec(`dotnet build ${testProjectName}.csproj -p:StartupObject=PuerGen -v quiet`, { cwd: workdir }).code)
    
        // 运行generate
        mkdir('-p', join(cwd, "Src/StaticWrapper"));
        assert.equal(0, exec(`dotnet run --project ${testProjectName}.csproj`, { cwd: workdir }).code)

    }

    // 生成csproj
    writeFileSync(
        join(workdir, `${testProjectName}.csproj`),
        originProjectConfig.replace('</Project>', [collectCSFilesAndMakeCompileConfig(cwd, workdir, !runInReflection), '</Project>'].join('\n'))
    );

    // 运行测试
    assert.equal(0, exec(`dotnet build ${testProjectName}.csproj -p:StartupObject=PuertsTest -v quiet`, { cwd: workdir }).code)
    assert.equal(0, exec(`dotnet test ${testProjectName}.csproj --blame-hang-timeout 10000ms ${filter ? `--filter ${filter}` : ''}`, { cwd: workdir }).code)
}

export async function dotnetTest(cwd: string, backend: string, filter: string = '') {
    // 编译binary
    const copyConfig = await runPuertsMake(join(cwd, '../../native_src'), {
        platform: process.platform == 'win32' ? 'win' : (process.platform == 'linux' ? 'linux' : 'osx'),
        config: "Debug",
        backend: backend || 'v8_9.4',
        arch: process.arch as any
    })

    // await runTest(cwd, copyConfig, true, filter);
    await runTest(cwd, copyConfig, false, filter);
}


export async function unityTest(cwd: string, unityPath: string) {
    function execUnityEditor(args: string) {
        const unityBatchModeBase = `${unityPath} -batchMode -quit -projectPath "${cwd}" -logFile "${cwd}/log.txt"`
        const code = exec(`${unityBatchModeBase} ${args}`).code;
        if (code != 0) {
            throw new Error(`ExecUnity failed: ${readFileSync(cwd + "/log.txt", 'utf-8')}`);
        }
        return;
    }
    if (process.platform == 'win32') {
        rm("-rf", `${cwd}/Assets/Gen`);
        rm("-rf", `${cwd}/build`);
        rm("-rf", `${cwd}/Assets/Gen.meta`);
        console.log("[Puer] Building puerts v1");
        await runPuertsMake(join(cwd, '../../native_src'), {
            backend: 'nodejs_16',
            platform: 'win',
            config: 'Debug',
            arch: 'x64'
        });

        console.log("[Puer] Generating wrapper");
        execUnityEditor(`-executeMethod TestBuilder.GenV1`);
        rm("-rf", `${cwd}/Library/ScriptAssemblies`);
        
        console.log("[Puer] Building testplayer for v1");
        mkdir("-p", `${cwd}/build/v1`)
        execUnityEditor(`-executeMethod TestBuilder.BuildWindowsV1`);

        console.log("[Puer] Running test in v1");
        const v1code = exec(`${cwd}/build/v1/Tester.exe -batchmode -nographics -logFile ${cwd}/log1.txt`).code;

        console.log("[Puer] Generating FunctionBridge");
        writeFileSync(`${cwd}/Assets/csc.rsp`, `
            -define:PUERTS_CPP_OUTPUT_TO_NATIVE_SRC_UPM
            -define:EXPERIMENTAL_IL2CPP_PUERTS
        `)
        execUnityEditor(`-executeMethod TestBuilder.GenV2`);
        rm("-rf", `${cwd}/Library/ScriptAssemblies`);
    
        await runPuertsMake(join(cwd, '../../native_src_il2cpp'), {
            backend: 'nodejs_16',
            platform: 'win',
            config: 'Debug',
            arch: 'x64'
        });

        console.log("[Puer] Building testplayer for v2");
        mkdir("-p", `${cwd}/build/v2`)
        execUnityEditor(`-executeMethod TestBuilder.BuildWindowsV2`);
        console.log("[Puer] Running test in v2");
        const v2code = exec(`${cwd}/build/v2/Tester.exe -batchmode -nographics -logFile ${cwd}/log2.txt`).code;

        assert.equal(0, v1code + v2code)
    }
}