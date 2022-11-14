import { Option, program } from "commander";
import runPuertsMake, { platformCompileConfig } from "./make.mjs";

const nodePlatformToPuerPlatform = {
    "darwin": "osx",
    "win32": "win"
}

program
    .command("make [quickcommand]")
    .addOption(
        new Option("--platform <platform>", "the target platform")
            .default("")
            .choices(["win", "osx", "linux", "android", "ios"])
    )
    .addOption(
        new Option("--arch <arch>", "the target architecture")
            .default("auto")
            .choices(["auto", "ia32", "x64", "arm64", "armv7"])
    )
    .addOption(
        new Option("--config <ReleaseOrDebug>", "the target architecture")
            .default("Release")
            .choices(["Release", "Debug"])
    )
    .option("--backend <backend>", "the JS backend will be used", "v8")
    .action(function (quickcommand, options) {
        let backend = options.backend;
        let config = options.config;
        let platform = options.platform;
        let arch = options.arch;

        if (!quickcommand) {
            if (options.platform && options.arch == 'auto') {
                let promiseChain = Promise.resolve();
                Object.keys((platformCompileConfig as any)[options.platform]).forEach(arch => {
                    promiseChain = promiseChain.then(function () {
                        //@ts-ignore
                        options.arch = arch;
                        runPuertsMake(options)
                    })
                });
            
            } else if (!options.platform && options.arch == 'auto') {
                options.platform = (nodePlatformToPuerPlatform as any)[process.platform]
                //@ts-ignore
                options.arch = process.arch;
                runPuertsMake(options);
            
            } else {
                runPuertsMake(options);
            }

        } else {
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
            runPuertsMake({ backend, config, arch, platform });
        }
    })

program
    .option("--backend <backend>", "the JS backend will be used", "v8_9.4")
    .command("dotnet-test");

program.parse(process.argv);