import { build } from 'esbuild';

await build({
    entryPoints: ['src/main.mts'],
    bundle: true,
    format: 'esm',
    outfile: '../upms/mcp/Resources/McpServer/main.mjs',
    platform: 'neutral',   // V8 backend — no Node.js APIs
    target: 'esnext',
    sourcemap: false,
    minify: false,         // Keep readable for debugging
    keepNames: true,
    // Neutral platform doesn't resolve "main" by default — add it explicitly
    mainFields: ['module', 'main'],
    banner: {
        js: [
            `// --- AbortController / AbortSignal polyfill for V8 backend ---`,
            `if (typeof AbortController === 'undefined') {`,
            `  class AbortSignal {`,
            `    constructor() { this.aborted = false; this.reason = undefined; this._listeners = []; }`,
            `    addEventListener(type, listener) { if (type === 'abort') this._listeners.push(listener); }`,
            `    removeEventListener(type, listener) { if (type === 'abort') this._listeners = this._listeners.filter(l => l !== listener); }`,
            `    throwIfAborted() { if (this.aborted) throw this.reason; }`,
            `  }`,
            `  class AbortController {`,
            `    constructor() { this.signal = new AbortSignal(); }`,
            `    abort(reason) {`,
            `      if (this.signal.aborted) return;`,
            `      this.signal.aborted = true;`,
            `      this.signal.reason = reason !== undefined ? reason : new DOMException('The operation was aborted.', 'AbortError');`,
            `      for (const listener of this.signal._listeners) { try { listener({ type: 'abort', target: this.signal }); } catch(e) {} }`,
            `    }`,
            `  }`,
            `  globalThis.AbortController = AbortController;`,
            `  globalThis.AbortSignal = AbortSignal;`,
            `}`,
            `if (typeof DOMException === 'undefined') {`,
            `  class DOMException extends Error { constructor(message, name) { super(message); this.name = name || 'DOMException'; } }`,
            `  globalThis.DOMException = DOMException;`,
            `}`,
        ].join('\n'),
    },
    // Define globals that PuerTS environment provides
    define: {
        'process.env.NODE_ENV': '"production"',
    },
    // No Node.js externals needed — everything is bundled
    external: [],
});

console.log('[esbuild] MCP Server bundle built successfully → ../upms/mcp/Resources/McpServer/main.mjs');
