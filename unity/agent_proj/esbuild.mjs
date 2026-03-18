import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

// Banner code: polyfills that MUST be available before any module-level code executes.
// AI SDK uses `instanceof(URL)` in top-level schema definitions, so URL must exist globally
// before those lines run.
const bannerCode = `
// === Early Polyfills (injected by esbuild banner) ===
// atob / btoa — needed by AI SDK (reads them from globalThis at module-eval time)
if (typeof globalThis.btoa !== 'function') {
    var _b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var _b64lookup = new Uint8Array(256);
    for (var _i = 0; _i < _b64chars.length; _i++) _b64lookup[_b64chars.charCodeAt(_i)] = _i;
    globalThis.btoa = function btoa(s) {
        var len = s.length, r = '', i = 0;
        while (i < len) {
            var a = s.charCodeAt(i++) & 0xff;
            if (i >= len) { r += _b64chars[a>>2] + _b64chars[(a&3)<<4] + '=='; break; }
            var b = s.charCodeAt(i++) & 0xff;
            if (i >= len) { r += _b64chars[a>>2] + _b64chars[((a&3)<<4)|(b>>4)] + _b64chars[(b&0xf)<<2] + '='; break; }
            var c = s.charCodeAt(i++) & 0xff;
            r += _b64chars[a>>2] + _b64chars[((a&3)<<4)|(b>>4)] + _b64chars[((b&0xf)<<2)|(c>>6)] + _b64chars[c&0x3f];
        }
        return r;
    };
    console.log('[Polyfill:Banner] btoa installed.');
}
if (typeof globalThis.atob !== 'function') {
    var _b64chars2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var _b64lookup2 = new Uint8Array(256);
    for (var _i2 = 0; _i2 < _b64chars2.length; _i2++) _b64lookup2[_b64chars2.charCodeAt(_i2)] = _i2;
    globalThis.atob = function atob(base64) {
        var s = base64.replace(/[\s]/g, ''), len = s.length, r = '', i = 0;
        while (i < len) {
            var e1 = _b64lookup2[s.charCodeAt(i++)], e2 = _b64lookup2[s.charCodeAt(i++)];
            var c3 = s.charCodeAt(i++), c4 = s.charCodeAt(i++);
            var e3 = c3 === 61 ? 64 : _b64lookup2[c3], e4 = c4 === 61 ? 64 : _b64lookup2[c4];
            r += String.fromCharCode((e1<<2)|(e2>>4));
            if (e3 !== 64) r += String.fromCharCode(((e2&15)<<4)|(e3>>2));
            if (e4 !== 64) r += String.fromCharCode(((e3&3)<<6)|e4);
        }
        return r;
    };
    console.log('[Polyfill:Banner] atob installed.');
}
if (typeof globalThis.URL === 'undefined') {
    class URLPolyfill {
        constructor(input, base) {
            let url = String(input);
            if (base && !url.match(/^[a-zA-Z]+:\\/\\//)) {
                const b = String(base).replace(/\\/+$/, '');
                const path = url.startsWith('/') ? url : '/' + url;
                url = b + path;
            }
            this.href = url;
            this.protocol = ''; this.host = ''; this.hostname = '';
            this.port = ''; this.pathname = '/'; this.search = '';
            this.hash = ''; this.origin = ''; this.username = ''; this.password = '';
            // Check for opaque URIs first (data:, blob:, javascript: etc — no "//")
            const opaqueProtoMatch = url.match(/^([a-zA-Z][a-zA-Z0-9+\\-.]*):(?!\\/\\/)/);
            if (opaqueProtoMatch) {
                this.protocol = opaqueProtoMatch[1].toLowerCase() + ':';
                this.pathname = url.slice(opaqueProtoMatch[0].length);
                return; // opaque URI — no host/port parsing
            }
            const protoMatch = url.match(/^([a-zA-Z][a-zA-Z0-9+\\-.]*):\\/\\//);
            if (protoMatch) { this.protocol = protoMatch[1] + ':'; url = url.slice(protoMatch[0].length); }
            else if (!base) {
                // No valid protocol and no base URL — not a valid URL.
                throw new TypeError('Invalid URL: ' + String(input));
            }
            const hashIdx = url.indexOf('#');
            if (hashIdx !== -1) { this.hash = url.slice(hashIdx); url = url.slice(0, hashIdx); }
            const queryIdx = url.indexOf('?');
            if (queryIdx !== -1) { this.search = url.slice(queryIdx); url = url.slice(0, queryIdx); }
            const pathIdx = url.indexOf('/');
            if (pathIdx !== -1) { this.host = url.slice(0, pathIdx); this.pathname = url.slice(pathIdx); }
            else { this.host = url; }
            const portIdx = this.host.indexOf(':');
            if (portIdx !== -1) { this.hostname = this.host.slice(0, portIdx); this.port = this.host.slice(portIdx + 1); }
            else { this.hostname = this.host; }
            this.origin = this.protocol ? this.protocol + '//' + this.host : this.host;
        }
        toString() { return this.href; }
        toJSON() { return this.href; }
    }
    globalThis.URL = URLPolyfill;
    console.log('[Polyfill:Banner] URL installed.');
}
if (typeof globalThis.DOMException === 'undefined') {
    class DOMExceptionPolyfill extends Error {
        constructor(message, name) { super(message); this.name = name || 'Error'; this.code = 0; }
    }
    globalThis.DOMException = DOMExceptionPolyfill;
}
if (typeof globalThis.Event === 'undefined') {
    class EventPolyfill { constructor(type) { this.type = type; } }
    globalThis.Event = EventPolyfill;
}
if (typeof globalThis.structuredClone === 'undefined') {
    globalThis.structuredClone = function structuredClone(value, options) {
        if (value === undefined || value === null) return value;
        // Use JSON round-trip as a basic deep clone
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            // Fallback: return the value as-is if not serializable
            return value;
        }
    };
    console.log('[Polyfill:Banner] structuredClone installed.');
}
// === End Early Polyfills ===
`;

await build({
    entryPoints: ['src/main.mts'],
    bundle: true,
    format: 'esm',
    outfile: '../upms/agent/Resources/LLMAgent/main.mjs',
    platform: 'neutral',  // Not node, not browser - neutral for V8 embedding
    target: 'esnext',
    sourcemap: false,
    minify: false,         // Keep readable for debugging
    keepNames: true,
    banner: {
        js: bannerCode,
    },
    // Define globals that PuerTS V8 environment provides
    define: {
        'process.env.NODE_ENV': '"production"',
    },
    // Alias Node.js built-in modules to empty stubs (not available in PuerTS V8)
    alias: {
        'fs': './src/stubs/empty.mts',
        'path': './src/stubs/empty.mts',
        'os': './src/stubs/empty.mts',
        'crypto': './src/stubs/empty.mts',
        'http': './src/stubs/empty.mts',
        'https': './src/stubs/empty.mts',
        'stream': './src/stubs/empty.mts',
        'url': './src/stubs/empty.mts',
        'zlib': './src/stubs/empty.mts',
        'net': './src/stubs/empty.mts',
        'tls': './src/stubs/empty.mts',
        'events': './src/stubs/empty.mts',
        'buffer': './src/stubs/empty.mts',
        'util': './src/stubs/empty.mts',
        'child_process': './src/stubs/empty.mts',
    },
});

// --- Post-build patches for third-party compatibility issues ---
const outPath = '../upms/agent/Resources/LLMAgent/main.mjs';
let code = readFileSync(outPath, 'utf-8');
const patches = [
    // @ai-sdk/openai: some providers (e.g. Claude) omit `index` in choices; make it optional
    [/index:\s*(\w+)\.number\(\)(,\s*\n\s*logprobs:)/g, 'index: $1.number().nullish()$2'],
];
// String-based patches (exact text replacement, not regex)
// Note: the image data URL roundtrip patch is no longer needed in AI SDK v6+
// because v6 keeps base64 strings as-is without Uint8Array roundtrip.
const stringPatches = [
    // web-streams-polyfill: installStreamsPolyfill() is called at the very end of
    // the bundle (in our main.mts entry), but libraries like eventsource-parser use
    // `class extends TransformStream` at module-level much earlier (line ~24050).
    // Fix: call installStreamsPolyfill() immediately after its definition so streams
    // are available globally before any downstream code tries to extend them.
    //[
    //    `__name(installStreamsPolyfill, "installStreamsPolyfill");`,
    //    `__name(installStreamsPolyfill, "installStreamsPolyfill");\ninstallStreamsPolyfill();`,
    //],
];
let patchCount = 0;
for (const [pattern, replacement] of patches) {
    const before = code;
    code = code.replace(pattern, replacement);
    if (code !== before) patchCount++;
}
for (const [search, replacement] of stringPatches) {
    if (code.includes(search)) {
        code = code.replace(search, replacement);
        patchCount++;
    }
}
if (patchCount > 0) {
    writeFileSync(outPath, code, 'utf-8');
    console.log(`[esbuild] Applied ${patchCount} post-build patch(es).`);
}
console.log('[esbuild] Bundle built successfully → ../upms/agent/Resources/LLMAgent/main.mjs');

// ==========================================================================
// Phase 2: Build builtins helper functions (separate from main bundle)
// ==========================================================================
import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const builtinSrcDir = 'src/editor-assistant/builtins';
const builtinOutDir = '../upms/agent/Resources/LLMAgent/editor-assistant/builtins';

// Find all .mts files in src/builtins/ (excluding .d.ts)
const builtinFiles = existsSync(builtinSrcDir)
    ? readdirSync(builtinSrcDir).filter(f =>
        f.endsWith('.mts') && !f.endsWith('.d.mts'))
    : [];

if (builtinFiles.length > 0) {
    // Ensure output directory exists
    if (!existsSync(builtinOutDir)) {
        mkdirSync(builtinOutDir, { recursive: true });
    }

    const builtinEntries = builtinFiles.map(f => join(builtinSrcDir, f));

    // Build each builtins module as ESM so it can be loaded via ScriptEnv.ExecuteModule().
    // ExecuteModule returns a ScriptObject whose exports (e.g. "description") can be read
    // from C#. Module top-level side effects (like globalThis assignments) also run.
    await build({
        entryPoints: builtinEntries,
        bundle: true,
        format: 'esm',
        outdir: builtinOutDir,
        outExtension: { '.js': '.mjs' },
        platform: 'neutral',
        target: 'esnext',
        sourcemap: false,
        minify: false,
        keepNames: true,
        external: [],
        define: {
            'process.env.NODE_ENV': '"production"',
        },
    });

    console.log(`[esbuild:builtins] Built ${builtinFiles.length} builtins module(s) → ${builtinOutDir}/`);
} else {
    console.log('[esbuild:builtins] No builtins modules found in src/builtins/');
}
