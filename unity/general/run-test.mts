import { cp, exec, mkdir, rm, setWinCMDEncodingToUTF8 } from "@puerts/shell-util";
import { program } from "commander";
import { readFileSync, writeFileSync } from "fs";
import glob from "glob";
import { basename, dirname, extname, join, relative } from "path";
import { fileURLToPath } from "url";
import runPuertsMake from "../native_src/make.mjs";

const dir = fileURLToPath(dirname(import.meta.url));
const workdir = join(dir, "vsauto");
setWinCMDEncodingToUTF8();

rm("-rf", workdir);

mkdir("-p", workdir);
exec(`dotnet new nunit`, { cwd: workdir });
rm('-rf', join(workdir, 'UnitTest1.cs'));
rm('-rf', join(workdir, 'Usings.cs'));

const originProjectConfig = readFileSync(
    join(workdir, 'vsauto.csproj'), 'utf-8'
);

// 运行generate
writeFileSync(
    join(workdir, 'vsauto.csproj'),
    originProjectConfig.replace('</Project>', [collectCSFilesAndMakeCompileConfig(), '</Project>'].join('\n'))
);
exec(`dotnet build vsauto.csproj -p:StartupObject=PuerGen -v quiet`, { cwd: workdir })
exec(`dotnet run --project vsauto.csproj`, { cwd: workdir })

program.option("--backend <backend>", "the JS backend will be used", "v8_9.4");
program.parse(process.argv);
const options = program.opts();

const backend = options.backend;
const copyConfig = runPuertsMake({
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

// 带上wrapper重新写一次
writeFileSync(
    join(workdir, 'vsauto.csproj'),
    originProjectConfig.replace('</Project>', [collectCSFilesAndMakeCompileConfig(), '</Project>'].join('\n'))
);
process.exit(exec(`dotnet test vsauto.csproj`, { cwd: workdir }).code)

function collectCSFilesAndMakeCompileConfig() {

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