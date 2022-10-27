import { cp, exec, mkdir, rm, setWinCMDEncodingToUTF8 } from "@puerts/shell-util";
import { existsSync, readFileSync, writeFileSync } from "fs";
import glob from "glob";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";
const dir = fileURLToPath(dirname(import.meta.url));
const workdir = join(dir, "vsauto");
setWinCMDEncodingToUTF8();

if (!existsSync(`${dir}/../node_modules`)) {
    console.log("[Puer] installing node_modules");
    require('child_process').execSync('npm i')
    exec("npm i", { cwd: join(dir, '..') });
}

rm("-rf", workdir);

mkdir("-p", workdir);
exec(`dotnet new nunit`, { cwd: workdir });
rm('-rf', join(workdir, 'UnitTest1.cs'));
rm('-rf', join(workdir, 'Usings.cs'));
exec(`dotnet add vsauto.csproj package NUnit.ConsoleRunner --version 3.15.2 --package-directory testrunner`, { cwd: workdir })
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
    ${glob.sync(join(dir, './Src/UnitTest/**/*.cs').replace(/\\/g, '/'))
        .concat([join(dir, './Src/TxtLoader.cs').replace(/\\/g, '/')])
        .map(pathname =>
            `    <Compile Include="${relative(workdir, pathname).replace(/\//, '\\')}">
        <Link>${relative(join(dir, './Src'), pathname).replace(/\//, '\\')}</Link>
    </Compile>`
        ).join('\n')
    }
</ItemGroup>
`

writeFileSync(
    join(workdir, 'vsauto.csproj'),
    readFileSync(
        join(workdir, 'vsauto.csproj'), 'utf-8'
    ).replace('</Project>', [definitions, linkUnitTests, linkPuerTS + '</Project>'].join('\n'))
);
exec(`dotnet build vsauto.csproj`, { cwd: workdir })

const backend = 'v8_9.4'
exec(`node make.js --platform ${process.platform == 'win32' ? 'win' : 'osx'} --config Debug --backend ${backend} --arch ${process.arch}`, { cwd: join(dir, "../native_src") });
if (process.platform == 'win32') {
    cp(
        join(dir, `../native_src/build_win_x64_${backend}_debug/RelWithDebInfo/puerts.dll`),
        join(workdir, './bin/Debug/')
    );
    exec(`.\\testrunner\\nunit.consolerunner\\3.15.2\\tools\\nunit3-console.exe .\\bin\\Debug\\vsauto.dll`, { cwd: workdir })
} else {
    cp(
        join(dir, `../native_src/build_osx_${process.arch}_${backend}_debug/Debug/libpuerts.dylib`),
        join(workdir, './bin/Debug/libpuerts.dylib')
    );
    exec(`dotnet run ./testrunner/nunit.consolerunner/3.15.2/tools/nunit3-console.exe ./bin/Debug/vsauto.dll`, { cwd: workdir })
}


