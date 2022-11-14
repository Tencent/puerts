import { cp, exec, mkdir, rm, setWinCMDEncodingToUTF8 } from "@puerts/shell-util";
import assert from "assert";
import { existsSync, readFileSync, writeFileSync } from "fs";
import glob from "glob";
import { basename, extname, join, relative } from "path";
import runPuertsMake from "./make.mjs";

setWinCMDEncodingToUTF8();

function collectCSFilesAndMakeCompileConfig(dir: string, workdir: string, excludeGenerator: boolean) {

    const definitions = `
    <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Debug|AnyCPU' ">
        <DefineConstants>PUER_CONSOLE_TEST;PUERTS_GENERAL;DISABLE_AUTO_REGISTER;TRACE;DEBUG;NETSTANDARD;NETSTANDARD2_1;</DefineConstants>
        <AppendTargetFrameworkToOutputPath>false</AppendTargetFrameworkToOutputPath>
    </PropertyGroup>
    `
    const linkPuerTS = `
    <ItemGroup>
        ${glob.sync(join(dir, '../Assets/**/*.cs').replace(/\\/g, '/'))
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, '../Assets/'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')}
    </ItemGroup>
    `
    
    const linkUnitTests = `
    <ItemGroup>
        ${glob.sync(join(dir, './Src/**/*.cs').replace(/\\/g, '/'))
            .filter(pathname => !excludeGenerator || pathname.indexOf('WrapperGenerator') == -1)
            .map(pathname =>
`    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
            <Link>${relative(join(dir, './Src'), pathname).replace(/\//, '\\')}</Link>
        </Compile>`
            ).join('\n')
        }
    </ItemGroup>
    `
    return [definitions, linkPuerTS, linkUnitTests].join('\n');
}

export default async function dotnetTest(cwd: string, backend: string) {
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
    
    const copyConfig = await runPuertsMake(join(cwd, '../native_src'), {
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
    assert.equal(0, exec(`dotnet test vsauto.csproj`, { cwd: workdir }).code)
}