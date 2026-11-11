// Bundled Python for the Unity package (papi-python).
//
// libPapiPython is binary-bound to one Python minor version, so on desktop it is always built against
// a known Python distribution (downloaded here), and the very same distribution is staged into
// upms/python so that users only need to import the npm/upm package:
//
//   upms/python/PythonHome~/<rid>/          python home (Unity ignores folders ending with "~")
//     win-x64:   python3XY.dll, python3.dll, vcruntime*.dll, Lib/, DLLs/
//     linux-x64: libpython3.X.so.1.0, lib/python3.X/
//     osx-arm64: lib/python3.X/
//   upms/python/Plugins/macOS/arm64/libpython3.X.dylib   (install name @rpath/..., next to libPapiPython)
//
// Environment variables:
//   PUERTS_PYTHON_USE_SYSTEM=1   keep the legacy behaviour (find the system python, no bundling)
//   PUERTS_PYTHON_ROOT           use an already prepared distribution instead of downloading
//   PUERTS_PYTHON_DIST_CACHE     download cache directory (default: native/papi-python/.python-dist)

import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, copyFileSync } from "fs";
import { join, basename, sep } from "path";
import { spawnSync } from "child_process";
import * as process from "process";

const RIDS = {
    win: { x64: 'win-x64' },
    osx: { arm64: 'osx-arm64' },
    linux: { x64: 'linux-x64' },
};

// Top level stdlib entries that are never needed at runtime
const STDLIB_TOP_SKIP = new Set(['test', 'idlelib', 'tkinter', 'turtledemo', 'ensurepip', 'site-packages', '__phello__']);

function loadConfig(papiPythonDir) {
    return JSON.parse(readFileSync(join(papiPythonDir, 'bundled-python.json'), 'utf-8'));
}

export function getBundledPythonRid(platform, arch) {
    return RIDS[platform]?.[arch];
}

function tarExecutable() {
    // Windows' own bsdtar can extract zip, the tar from Git for Windows can't
    if (process.platform == 'win32') {
        const sysTar = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
        if (existsSync(sysTar)) return sysTar;
    }
    return 'tar';
}

async function download(url, file) {
    console.log(`[Puer] downloading ${url}`);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`[Puer] download failed (${res.status}): ${url}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

async function ensureDownloaded(papiPythonDir, rid) {
    const config = loadConfig(papiPythonDir);
    const dist = config.dists[rid];
    if (!dist) throw new Error(`[Puer] no bundled python for ${rid}`);

    const cacheRoot = process.env.PUERTS_PYTHON_DIST_CACHE || join(papiPythonDir, '.python-dist');
    const distDir = join(cacheRoot, `${rid}-${config.version}`);
    const root = join(distDir, dist.root);
    const marker = join(distDir, '.complete');
    if (existsSync(marker) && readFileSync(marker, 'utf-8').trim() == dist.url) {
        return { root, minor: config.minor, version: config.version };
    }

    rmSync(distDir, { recursive: true, force: true });
    mkdirSync(distDir, { recursive: true });
    const archive = join(cacheRoot, `${rid}-${config.version}.${dist.format}`);
    await download(dist.url, archive);
    const tarArgs = dist.format == 'zip' ? ['-xf', archive, '-C', distDir] : ['-xzf', archive, '-C', distDir];
    const r = spawnSync(tarExecutable(), tarArgs, { stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`[Puer] extract failed: ${archive}`);
    rmSync(archive, { force: true });
    if (!existsSync(root)) throw new Error(`[Puer] unexpected python dist layout, missing ${root}`);
    writeFileSync(marker, dist.url);
    return { root, minor: config.minor, version: config.version };
}

// Decide which Python papi-python is built against. Returns null to use the legacy system python.
// When non-null, PUERTS_PYTHON_ROOT / PUERTS_PYTHON_VERSION are set for CMake.
export async function prepareBundledPython(papiPythonDir, platform, arch) {
    if (process.env.PUERTS_PYTHON_USE_SYSTEM) {
        console.log('[Puer] PUERTS_PYTHON_USE_SYSTEM is set, building papi-python against the system python');
        return null;
    }
    const rid = getBundledPythonRid(platform, arch);
    if (!rid) {
        console.log(`[Puer] no bundled python for ${platform}-${arch}, building papi-python against the system python`);
        return null;
    }
    const config = loadConfig(papiPythonDir);
    let info;
    if (process.env.PUERTS_PYTHON_ROOT) {
        info = {
            root: process.env.PUERTS_PYTHON_ROOT,
            minor: process.env.PUERTS_PYTHON_VERSION || config.minor,
            version: process.env.PUERTS_PYTHON_VERSION || config.version,
        };
        console.log(`[Puer] using PUERTS_PYTHON_ROOT=${info.root}`);
    } else {
        info = await ensureDownloaded(papiPythonDir, rid);
        process.env.PUERTS_PYTHON_ROOT = info.root.split(sep).join('/');
        process.env.PUERTS_PYTHON_VERSION = info.minor;
        console.log(`[Puer] using bundled python ${info.version} at ${info.root}`);
    }
    return { rid, ...info };
}

function stdlibFilter(stdlibRoot) {
    return (src) => {
        const rel = src.slice(stdlibRoot.length).replace(/\\/g, '/').replace(/^\//, '');
        if (!rel) return true;
        const segs = rel.split('/');
        const name = segs[segs.length - 1];
        if (STDLIB_TOP_SKIP.has(segs[0])) return false;
        if (segs[0].startsWith('config-')) return false; // static libpython + Makefile, build only
        if (segs.includes('__pycache__')) return false;
        if (name.endsWith('.pyc') || name.endsWith('.pdb')) return false;
        return true;
    };
}

function nativeModuleFilter(dir) {
    return (src) => {
        if (src == dir) return true;
        const name = basename(src).toLowerCase();
        if (name.startsWith('_test') || name.startsWith('xxlimited') || name.startsWith('_xxtestfuzz')) return false;
        if (name.startsWith('_tkinter') || /^(tcl|tk)\d+t?\.dll$/.test(name)) return false;
        if (name.endsWith('.pdb') || name.endsWith('.lib')) return false;
        return true;
    };
}

function copyStdlib(src, dst) {
    const filter = stdlibFilter(src);
    const dynload = join(src, 'lib-dynload');
    const nativeFilter = nativeModuleFilter(dynload);
    cpSync(src, dst, {
        recursive: true,
        dereference: true,
        filter: (p) => filter(p) && (!p.startsWith(dynload) || nativeFilter(p)),
    });
}

// Copy the runtime part of the bundled python into the upm package.
// pluginOutputPath: upms/python/Plugins/<platform dir>, cmakeBuildPath: papi-python build directory
export function stageBundledPythonForUnity(info, upmDir, pluginOutputPath, cmakeBuildPath) {
    const { rid, root, minor, version } = info;
    const home = join(upmDir, 'PythonHome~', rid);
    rmSync(home, { recursive: true, force: true });
    mkdirSync(home, { recursive: true });

    let landmark;
    if (rid.startsWith('win-')) {
        const nodot = minor.replace('.', '');
        for (const f of [`python${nodot}.dll`, 'python3.dll', 'vcruntime140.dll', 'vcruntime140_1.dll', 'LICENSE.txt']) {
            if (existsSync(join(root, f))) copyFileSync(join(root, f), join(home, f));
        }
        if (!existsSync(join(home, `python${nodot}.dll`))) throw new Error(`[Puer] missing python${nodot}.dll in ${root}`);
        copyStdlib(join(root, 'Lib'), join(home, 'Lib'));
        cpSync(join(root, 'DLLs'), join(home, 'DLLs'), { recursive: true, filter: nativeModuleFilter(join(root, 'DLLs')) });
        landmark = join(home, 'Lib', 'os.py');
    } else {
        copyStdlib(join(root, 'lib', `python${minor}`), join(home, 'lib', `python${minor}`));
        landmark = join(home, 'lib', `python${minor}`, 'os.py');
        if (rid.startsWith('linux-')) {
            // libPapiPython.so needs the soname file; it is preloaded (RTLD_GLOBAL) by BackendPython
            copyFileSync(join(root, 'lib', `libpython${minor}.so.1.0`), join(home, `libpython${minor}.so.1.0`));
        } else if (rid.startsWith('osx-')) {
            // The copy whose install name was rewritten to @rpath by CMakeLists.txt
            const patched = join(cmakeBuildPath, 'bundled_python', `libpython${minor}.dylib`);
            if (!existsSync(patched)) throw new Error(`[Puer] missing ${patched}`);
            mkdirSync(pluginOutputPath, { recursive: true });
            copyFileSync(patched, join(pluginOutputPath, `libpython${minor}.dylib`));
        }
    }
    if (!existsSync(landmark)) throw new Error(`[Puer] bundled stdlib is broken, missing ${landmark}`);
    writeFileSync(join(home, 'BUNDLED_PYTHON_VERSION'), `${version}\n`);
    console.log(`[Puer] staged bundled python ${version} into ${home}`);
}
