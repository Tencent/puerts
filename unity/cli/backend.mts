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
    mkdir("-p", join(cwd, '.backends'));
    if (existsSync(join(cwd, '.backends', name)) && statSync(join(cwd, '.backends', name)).isDirectory) {
        console.log(`[Puer] download skip: ${name} already exists `);
        return;

    } else if (url) {
        console.log(`[Puer] downloading ${name} from ${url}`);
        const down = download(url, join(cwd, '.backends'), { extract: true });
        await down;

    } else if (url = readBackendsJSON(cwd)[name].url) {
        console.log(`[Puer] downloading ${name} from ${url}`);
        const down = download(url, join(cwd, '.backends'), { extract: true });
        await down;

    } else {
        throw new Error(`invalid backend: ${name}, backend url not found`);
    }
}


function readBackendsJSON(cwd: string): {[key: string]: any} {
    const backendsJSONPath = join(cwd, 'cmake', 'backends.json');
    if (existsSync(backendsJSONPath)) {
        return JSON.parse(readFileSync(backendsJSONPath, 'utf-8'));
    } else {
        return {}
    }
}