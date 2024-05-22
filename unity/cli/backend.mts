import { mkdir } from "@puerts/shell-util";
import { existsSync, readFileSync, statSync } from "fs";
import { createRequire } from "module";
import { join } from "path";
import { fileURLToPath } from "url";

const download = createRequire(fileURLToPath(import.meta.url))('download');

export default async function downloadBackend(cwd: string, name: string, url: string = "") {
    if (!existsSync(join(cwd, "CMakeLists.txt")) || !existsSync(join(cwd, "cmake"))) {
        throw new Error("invalid puerts native_src directory: " + cwd);
    }
    const backendDir = join(cwd, '../native_src/.backends');
    mkdir("-p", backendDir);
    if (existsSync(join(backendDir, name)) && statSync(join(backendDir, name)).isDirectory) {
        console.log(`[Puer] download skip: ${name} already exists `);
        return;

    } else if (url) {
        console.log(`[Puer] downloading ${name} from ${url}`);
        const down = download(url, backendDir, { extract: true });
        await down;

    } else {
        const cfg = readBackendsConfig(cwd);
        if (!(name in cfg)) {
            throw new Error(`invalid backend: ${name}, available backends:${Object.keys(cfg).join(', ')}`);
        }
        if (url = cfg[name].url) {
            console.log(`[Puer] downloading ${name} from ${url}`);
            const down = download(url, backendDir, { extract: true });
            await down;

        } else {
            throw new Error(`invalid backend: ${name}, backend url not found`);
        }
    }
}


function readBackendsConfig(cwd: string): {[key: string]: any} {
    const backendsJSONPath = join(cwd, 'cmake', 'backends.json');
    if (existsSync(backendsJSONPath)) {
        return JSON.parse(readFileSync(backendsJSONPath, 'utf-8'));
    } else {
        return {}
    }
}