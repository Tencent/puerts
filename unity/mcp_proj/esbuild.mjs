import { build } from 'esbuild';

await build({
    entryPoints: ['src/main.mts'],
    bundle: true,
    format: 'cjs',
    outfile: '../upms/mcp/Resources/McpServer/main.cjs',
    platform: 'node',     // Node.js backend — full Node API available
    target: 'esnext',
    sourcemap: false,
    minify: false,         // Keep readable for debugging
    keepNames: true,
    // Define globals that PuerTS environment provides
    define: {
        'process.env.NODE_ENV': '"production"',
    },
    // Node.js built-ins are available in PuerTS Node.js backend — mark as external
    external: [
        'node:http',
        'node:https',
        'node:net',
        'node:stream',
        'node:url',
        'node:util',
        'node:events',
        'node:buffer',
        'node:crypto',
        'node:zlib',
        'node:fs',
        'node:path',
        'node:os',
        'node:tls',
        'node:child_process',
        'http',
        'https',
        'net',
        'stream',
        'url',
        'util',
        'events',
        'buffer',
        'crypto',
        'zlib',
        'fs',
        'path',
        'os',
        'tls',
        'child_process',
    ],
});

console.log('[esbuild] MCP Server bundle built successfully → ../upms/mcp/Resources/McpServer/main.cjs');
