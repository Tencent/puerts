import { rm, setWinCMDEncodingToUTF8 } from "@puerts/shell-util";
import { Option, program } from "commander";
import { join } from "path";
import downloadBackend from "./backend.mjs";
import { dotnetTest, unityTest } from "./test.mjs";
import runPuertsMake, { makeOSXUniveralBinary, platformCompileConfig } from "./make.mjs";

setWinCMDEncodingToUTF8();

const nodePlatformToPuerPlatform = {
    "darwin": "osx",
    "win32": "win"
}
const cwd = process.cwd();

program
    .command("make [quickcommand]")
    .addOption(
        new Option("--platform <platform>", "the target platform")
            .default("")
            .choices(["win", "osx", "linux", "android", "ios", "ohos", "wasm"])
    )
    .addOption(
        new Option("--arch <arch>", "the target architecture. 'auto' means build all available archs for the platform and universal binary will be created in osx.")
            .default("auto")
            .choices(["auto", "ia32", "x64", "arm64", "armv7", "wasm32"])
    )
    .addOption(
        new Option("--config <ReleaseOrDebug>", "Debug ver or Release ver. In Windows, Debug means DebugWithRelInfo")
            .default("Release")
            .choices(["Release", "Debug"])
    )
    .option("--backend <backend>", "the JS backend will be used", "v8_9.4")
    .option('-ws, --websocket', 'with websocket support')
    .action(function (quickcommand, options) {
        let backend = options.backend;
        let config = options.config;
        let platform = options.platform;
        let arch = options.arch;

        if (quickcommand) {
            switch (quickcommand[0]) {
                case 'v':
                    backend = 'v8_9.4'; break;
                case 'n':
                    backend = 'nodejs_16'; break;
                case 'q':
                    backend = 'quickjs'; break;

                default:
                    throw new Error(`invalid command[0] : ${quickcommand[0]}`);
            }

            switch (quickcommand[1]) {
                case 'a':
                    platform = 'android'; break;
                case 'i':
                    platform = 'ios'; break;
                case 'w':
                    platform = 'win'; break;
                case 'o':
                    platform = 'osx'; break;
                case 'l':
                    platform = 'linux'; break;

                default:
                    throw new Error(`invalid command[1] : ${quickcommand[1]}`);
            }

            switch (quickcommand[2]) {
                case '3':
                    arch = 'ia32'; break;
                case '6':
                    arch = 'x64'; break;
                case '7':
                    arch = 'armv7'; break;
                case '8':
                    arch = 'arm64'; break;
                case '0':
                    arch = 'auto'; break;

                default:
                    throw new Error(`invalid command[2] : ${quickcommand[2]}`);
            }

            switch (quickcommand[3] || "") {
                case 'd':
                    config = 'Debug'; break;

                default:
                    config = 'Release'; break;
            }

            console.log('quick command parse result:', { backend, config, arch, platform });
            options = { backend, config, arch, platform };

        }

        if (options.platform && options.arch == 'auto') {
            let promiseChain = Promise.resolve();
            const outputs: string[][] = []
            Object.keys((platformCompileConfig as any)[options.platform]).forEach(arch => {
                promiseChain = promiseChain.then(function () {
                    //@ts-ignore
                    options.arch = arch;
                    return runPuertsMake(cwd, options).then(res => {
                        outputs.push(res);
                    })
                })
            });
            if (options.platform == 'osx') {
                // if arch is not specified, make universal binary
                promiseChain = promiseChain.then(() => makeOSXUniveralBinary(cwd, outputs));
            }

        } else if (!options.platform && options.arch == 'auto') {
            options.platform = (nodePlatformToPuerPlatform as any)[process.platform]
            //@ts-ignore
            options.arch = process.arch;
            runPuertsMake(cwd, options);

        } else {
            runPuertsMake(cwd, options);
        }
    })

const backendProgram = program
    .command("backend");

backendProgram
    .command("download [backend] [url]").action((backend, url) => {
        downloadBackend(cwd, backend, url)
    });
backendProgram
    .command("clean").action(() => {
        rm('-rf', join(cwd, ".backends"))
    });

program
    .command("dotnet-test [backend]")
    .option("--filter <filter>", "testcase will be filtered", "")
    .option('-sq, --switch_qjs', 'switch to quickjs backend')
    .action((backend: string, options: any) => {
        if (options.switch_qjs) {
            process.env.SwitchToQJS = '1';
        }
        dotnetTest(cwd, backend || "quickjs", options.filter);
    });

program
    .command('unity-test')
    .requiredOption("--unity <pathToUnity>")
    .action((options) => {
        unityTest(cwd, options.unity);
    })

program.parse(process.argv);