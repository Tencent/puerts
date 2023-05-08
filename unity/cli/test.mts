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
        <DefineConstants>${process.platform == 'win32' ? 'PLATFORM_WINDOWS': 'PLATFORM_MAC'};PUER_CONSOLE_TEST;PUERTS_GENERAL;DISABLE_AUTO_REGISTER;TRACE;DEBUG;NETSTANDARD;NETSTANDARD2_1;</DefineConstants>
        <AppendTargetFrameworkToOutputPath>false</AppendTargetFrameworkToOutputPath>
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
            .filter(pathname => !excludeGenerator || pathname.indexOf('WrapperGenerator') == -1)
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, './Src/'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')
        }
    </ItemGroup>
    `
    return [definitions, linkPuerTS, linkUnitTests, linkGenerators].join('\n');
}

export async function dotnetTest(cwd: string, backend: string, filter: string = '') {
    if (!existsSync(`${cwd}/Src/Helloworld.cs`)) {
        console.error("[Puer] Cannot find UnitTest Src");
        process.exit();
    }
    const workdir = join(cwd, "vsauto");

    rm("-rf", workdir);
    rm("-rf", join(cwd, 'Src/StaticWrapper'));
    
    mkdir("-p", workdir);
    exec(`dotnet new nunit`, { cwd: workdir });
    rm('-rf', join(workdir, 'UnitTest1.cs'));
    rm('-rf', join(workdir, 'Usings.cs'));
    
    const originProjectConfig = readFileSync(
        join(workdir, 'vsauto.csproj'), 'utf-8'
    );
    // 生成
    writeFileSync(
        join(workdir, 'vsauto.csproj'),
        originProjectConfig.replace('</Project>', [collectCSFilesAndMakeCompileConfig(cwd, workdir, false), '</Project>'].join('\n'))
    );
    assert.equal(0, exec(`dotnet build vsauto.csproj -p:StartupObject=PuerGen -v quiet`, { cwd: workdir }).code)
    
    const copyConfig = await runPuertsMake(join(cwd, '../../native_src'), {
        platform: process.platform == 'win32' ? 'win' : 'osx',
        config: "Debug",
        backend: backend,
        arch: process.arch as any
    })

    const binPath = join(workdir, './bin/Debug');
    copyConfig.forEach((fileToCopy: string)=> {
        const ext = extname(fileToCopy)
        cp(fileToCopy, binPath + (ext == '.bundle' ? `/lib${basename(fileToCopy, ext)}.dylib`: ''));
    })

    // 运行generate
    mkdir('-p', join(cwd, "Src/StaticWrapper"));
    assert.equal(0, exec(`dotnet run --project vsauto.csproj`, { cwd: workdir }).code)

    // 带上wrapper重新生成csproj并运行测试
    writeFileSync(
        join(workdir, 'vsauto.csproj'),
        originProjectConfig.replace('</Project>', [collectCSFilesAndMakeCompileConfig(cwd, workdir, true), '</Project>'].join('\n'))
    );
    assert.equal(0, exec(`dotnet build vsauto.csproj -p:StartupObject=PuertsTest -v quiet`, { cwd: workdir }).code)
    assert.equal(0, exec(`dotnet test vsauto.csproj --blame-hang-timeout 5000ms ${filter ? `--filter ${filter}` : ''}`, { cwd: workdir }).code)
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
            backend: 'v8_9.4',
            platform: 'win',
            config: 'Debug',
            arch: 'x64'
        });

        console.log("[Puer] Generating wrapper");
        writeFileSync(`${cwd}/Assets/csc.rsp`, '-define:PUERTS_CPP_OUTPUT_TO_NATIVE_SRC_UPM;')
        execUnityEditor(`-executeMethod TestBuilder.GenV1`);
        rm("-rf", `${cwd}/Library/ScriptAssemblies`);
        cp(`${cwd}/Assets/Gen/unityenv_for_puerts.h`, `${cwd}/../../Assets/core/upm/Plugins/puerts_il2cpp/`);
        
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
            backend: 'v8_9.4',
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