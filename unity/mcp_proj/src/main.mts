/**
 * MCP Server Entry Module
 *
 * This is the main entry point loaded by PuerTS (Node.js backend).
 * It creates an MCP Server using @modelcontextprotocol/sdk and exposes
 * the evalJsCode tool over HTTP using Streamable HTTP transport.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import http from 'node:http';

import { setResourceRoot } from '../../ai_shared_src/resource-root.mjs';
import { initBuiltins, executeCode, builtinSummariesText } from '../../ai_shared_src/eval-core.mjs';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let mcpServer: InstanceType<typeof McpServer> | null = null;
let httpServer: http.Server | null = null;

// SSE transport management: one transport per session
const transports: Map<string, SSEServerTransport> = new Map();

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

function createMcpServer(): InstanceType<typeof McpServer> {
    const server = new McpServer({
        name: 'puerts-unity-editor-assistant',
        version: '1.0.0',
    });

    // Register the evalJsCode tool
    server.tool(
        'evalJsCode',
        'Execute JavaScript code in a dedicated PuerTS runtime environment inside the Unity Editor. ' +
        'This VM is separate from the main agent VM but is **reused across calls** — ' +
        'variables, functions, and state defined in previous calls persist and can be referenced in later calls.\n\n' +
        'The code runs inside the Unity Editor via PuerTS with full access to the `CS` and `puer` globals. ' +
        'Through the `CS` namespace you can **call any C# API** to manipulate the Unity Editor — ' +
        'including `CS.UnityEditor.*` APIs (e.g. `CS.UnityEditor.AssetDatabase`, `CS.UnityEditor.Selection`, ' +
        '`CS.UnityEditor.EditorApplication`, `CS.UnityEditor.SceneManagement`, etc.) ' +
        'as well as all `CS.UnityEngine.*` runtime APIs.\n\n' +
        'Use this tool when you need to inspect or modify Unity scene objects, ' +
        'create/destroy GameObjects or Components, query hierarchies, ' +
        'manipulate assets, modify Editor settings, automate Editor workflows, ' +
        'execute Unity API calls dynamically, or test code snippets in the live Editor environment.\n\n' +
        '**Code format**: Your code MUST be an async function declaration named `execute`, for example:\n' +
        '```\nasync function execute() {\n    // your logic here\n    return someValue;\n}\n```\n' +
        'Use `return <value>` inside the function to pass a result back. ' +
        'Objects are serialized via JSON.stringify; primitives are converted to strings.\n\n' +
        'On success the response is `{ success: true, result: string }`. ' +
        'On failure the response is `{ success: false, error: string, stack: string }`.' +
        builtinSummariesText,
        {
            code: z.string().describe(
                'An async function declaration named `execute`. ' +
                'Example: "async function execute() {\\n  const go = CS.UnityEngine.GameObject.Find(\'Main Camera\');\\n  return go.transform.position.toString();\\n}"'
            ),
        },
        async ({ code }) => {
            const result = await executeCode(code);

            if (!result.success) {
                const errorText = `Error: ${result.error}${result.stack ? '\nStack: ' + result.stack : ''}`;
                return {
                    content: [{ type: 'text' as const, text: errorText }],
                    isError: true,
                };
            }

            // Build content parts
            const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [];
            content.push({ type: 'text' as const, text: result.result ?? '(no return value)' });

            // If the result includes image data, add it as an image content part
            if (result.__image) {
                content.push({
                    type: 'image' as const,
                    data: result.__image.base64,
                    mimeType: result.__image.mediaType || 'image/png',
                });
            }

            return { content };
        }
    );

    return server;
}

// ---------------------------------------------------------------------------
// HTTP Server with SSE transport
// ---------------------------------------------------------------------------

function startHttpServer(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
        mcpServer = createMcpServer();
        httpServer = http.createServer(async (req, res) => {
            const url = new URL(req.url || '/', `http://localhost:${port}`);

            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            // SSE endpoint — client connects here to get the session
            if (url.pathname === '/sse' && req.method === 'GET') {
                const transport = new SSEServerTransport('/messages', res);
                const sessionId = transport.sessionId;
                transports.set(sessionId, transport);

                // Clean up on close
                res.on('close', () => {
                    transports.delete(sessionId);
                });

                await mcpServer!.connect(transport);
                return;
            }

            // Message endpoint — client sends JSON-RPC messages here
            if (url.pathname === '/messages' && req.method === 'POST') {
                const sessionId = url.searchParams.get('sessionId');
                if (!sessionId || !transports.has(sessionId)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid or missing sessionId' }));
                    return;
                }

                const transport = transports.get(sessionId)!;
                await transport.handlePostMessage(req, res);
                return;
            }

            // Health check
            if (url.pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', server: 'unity-puerts-mcp' }));
                return;
            }

            // Not found
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not Found' }));
        });

        httpServer.listen(port, '127.0.0.1', () => {
            console.log(`[McpServer] HTTP server listening on http://127.0.0.1:${port}`);
            console.log(`[McpServer] SSE endpoint: http://127.0.0.1:${port}/sse`);
            resolve();
        });

        httpServer.on('error', (err) => {
            console.error(`[McpServer] HTTP server error: ${err.message}`);
            reject(err);
        });
    });
}

// ---------------------------------------------------------------------------
// Exports for C# interop
// ---------------------------------------------------------------------------

/**
 * Initialize resources and start the MCP HTTP Server.
 * Called from C# McpScriptManager.Initialize().
 *
 * @param root - Unity Resources path prefix, e.g. "LLMAgent/editor-assistant"
 * @param port - TCP port for the HTTP server (default 3100)
 * @param onReady - C# Action callback invoked when the server is ready
 */
export function onInitialize(root: string, port: number, onReady: CS.System.Action): void {
    (async () => {
        try {
            setResourceRoot(root);
            await initBuiltins();
            await startHttpServer(port);
            console.log('[McpServer] MCP Server initialization complete.');
        } catch (e: any) {
            console.error(`[McpServer] Initialization error: ${e.message || e}`);
        } finally {
            onReady.Invoke!();
        }
    })();
}

/**
 * Shut down the MCP Server and close the HTTP server.
 * Called from C# McpScriptManager.Shutdown().
 */
export function onShutdown(): void {
    console.log('[McpServer] Shutting down...');

    // Close all SSE transports
    for (const [id, transport] of transports) {
        try {
            transport.close?.();
        } catch (e) {
            // ignore
        }
    }
    transports.clear();

    // Close the MCP server
    if (mcpServer) {
        try {
            mcpServer.close();
        } catch (e) {
            // ignore
        }
        mcpServer = null;
    }

    // Close the HTTP server
    if (httpServer) {
        httpServer.close();
        httpServer = null;
    }

    console.log('[McpServer] Shut down complete.');
}
