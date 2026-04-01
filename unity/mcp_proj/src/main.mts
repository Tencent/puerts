/**
 * MCP Server Entry Module
 *
 * This is the main entry point loaded by PuerTS (Node.js backend).
 * It creates an MCP Server using @modelcontextprotocol/sdk and exposes
 * the evalJsCode tool over HTTP using Streamable HTTP transport.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import http from 'node:http';
import crypto from 'node:crypto';
import { NodeStreamableHTTPServerTransport } from './streamable-http-transport.mjs';

import { setResourceRoot } from '../../ai_shared_src/resource-root.mjs';
import { initBuiltins, executeCode, builtinSummariesText } from '../../ai_shared_src/eval-core.mjs';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let mcpServer: InstanceType<typeof McpServer> | null = null;
let httpServer: http.Server | null = null;

// Streamable HTTP transport management: one transport per session
let activeTransport: NodeStreamableHTTPServerTransport | null = null;

// Track all open sockets so we can forcefully destroy them on shutdown
import net from 'node:net';
const trackedSockets: Set<net.Socket> = new Set();

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
        'On failure the response is `{ success: false, error: string, stack: string }`.\n\n' +
        '### Best Practices for Unity Editor Operations\n\n' +
        '**Domain Reload awareness**: Calling `CS.UnityEditor.AssetDatabase.Refresh()` or any operation that triggers C# compilation ' +
        'will cause a **Domain Reload**, which disconnects the MCP client. ' +
        'If this happens, your next call may fail with `client not initialized` — simply **retry** and it will reconnect automatically.\n\n' +
        '**Split heavy operations into separate calls**: Never combine "trigger compilation" and "wait for result" in one script. Instead:\n' +
        '1. **Call 1**: Perform the action (e.g. generate files, modify assets).\n' +
        '2. **Call 2**: `AssetDatabase.Refresh()` — this may cause a disconnect, which is expected.\n' +
        '3. **Call 3**: Wait for compilation to finish and check results (e.g. read logs for errors).\n\n' +
        'Each step should be a **separate `evalJsCode` invocation** so that a disconnect in step 2 does not lose the work done in step 1.\n\n' +
        '**Timeout handling**: Operations that trigger compilation can take a long time. ' +
        'If a call times out, it does **not** mean the operation failed — it may still be running in Unity. ' +
        'After a timeout, issue a lightweight follow-up call (e.g. check `EditorApplication.isCompiling`) to verify the current state before retrying.\n\n' +
        '**Checking compilation errors**: After compilation, use the `unity-log` builtin module to efficiently retrieve and analyze compiler errors, ' +
        'rather than reading generated files manually.' +
        builtinSummariesText,
        {
            code: z.string().describe(
                'An async function declaration named `execute`. ' +
                'Example: "async function execute() {\\n  const go = CS.UnityEngine.GameObject.Find(\'Main Camera\');\\n  return go.transform.position.toString();\\n}"'
            ),
            timeout: z.number().optional().default(30).describe(
                'Execution timeout in seconds. Default is 30s. ' +
                'If the code does not finish within this time, the tool returns a timeout error. ' +
                'You can then decide whether to retry or take a different approach.'
            ),
        },
        async ({ code, timeout }) => {
            const result = await executeCode(code, timeout ?? 30);

            if (!result.success) {
                const errorText = `Error: ${result.error}${result.stack ? '\nStack: ' + result.stack : ''}`;
                return {
                    content: [{ type: 'text' as const, text: errorText }],
                    isError: true,
                };
            }

            // Recursively collect all __image markers and strip them from the object.
            const images: Array<{ base64: string; mimeType: string }> = [];
            function collectAndStrip(obj: any, visited: Set<any>) {
                if (!obj || typeof obj !== 'object') return;
                if (visited.has(obj)) return;
                visited.add(obj);
                if (obj.__image && obj.__image.base64) {
                    images.push({
                        base64: obj.__image.base64,
                        mimeType: obj.__image.mediaType || 'image/png',
                    });
                    delete obj.__image;
                }
                for (const key of Object.keys(obj)) {
                    collectAndStrip(obj[key], visited);
                }
            }

            // Serialize the raw result to text, extracting images from objects.
            let textContent: string;
            const raw = result.result;
            if (raw === undefined) {
                textContent = '(no return value)';
            } else if (raw === null) {
                textContent = 'null';
            } else if (typeof raw === 'object') {
                collectAndStrip(raw, new Set());
                try { textContent = JSON.stringify(raw, null, 2); } catch (_) { textContent = String(raw); }
            } else {
                textContent = String(raw);
            }

            // Build content parts
            const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [];
            content.push({ type: 'text' as const, text: textContent });

            for (const img of images) {
                content.push({
                    type: 'image' as const,
                    data: img.base64,
                    mimeType: img.mimeType,
                });
            }

            return { content };
        }
    );

    return server;
}

// ---------------------------------------------------------------------------
// HTTP Server with Streamable HTTP transport
// ---------------------------------------------------------------------------

function startHttpServer(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
        mcpServer = createMcpServer();
        httpServer = http.createServer(async (req, res) => {
            const url = new URL(req.url || '/', `http://localhost:${port}`);

            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
            res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            // MCP Streamable HTTP endpoint
            if (url.pathname === '/mcp') {
                const incomingSessionId = req.headers['mcp-session-id'] as string | undefined;

                // Determine whether we need to create a fresh transport:
                // 1. No active transport at all
                // 2. No session ID header (client wants to initialize)
                // 3. Session ID doesn't match the active transport (stale session)
                const needNewTransport = !activeTransport
                    || !incomingSessionId
                    || (activeTransport.sessionId !== undefined && incomingSessionId !== activeTransport.sessionId);

                if (needNewTransport) {
                    // Tear down previous transport / server
                    if (activeTransport) {
                        try { await activeTransport.close(); } catch (_) { /* ignore */ }
                        activeTransport = null;
                    }
                    if (mcpServer) {
                        try { mcpServer.close(); } catch (_) { /* ignore */ }
                    }
                    mcpServer = createMcpServer();

                    activeTransport = new NodeStreamableHTTPServerTransport({
                        sessionIdGenerator: () => crypto.randomUUID(),
                    });

                    activeTransport.onclose = () => {
                        activeTransport = null;
                    };

                    await mcpServer.connect(activeTransport);
                }

                await activeTransport!.handleRequest(req, res);
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
            console.log(`[McpServer] Streamable HTTP endpoint: http://127.0.0.1:${port}/mcp`);
            resolve();
        });

        // Track connections for forceful shutdown
        httpServer.on('connection', (socket: net.Socket) => {
            trackedSockets.add(socket);
            socket.on('close', () => {
                trackedSockets.delete(socket);
            });
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
 * @param onReady - C# Action<bool, string> callback invoked when the server is ready.
 *                  First arg: success (true/false), second arg: error message (empty on success).
 */
export function onInitialize(root: string, port: number, onReady: CS.System.Action$2<boolean, string>): void {
    (async () => {
        try {
            setResourceRoot(root);
            await initBuiltins();
            await startHttpServer(port);
            console.log('[McpServer] MCP Server initialization complete.');
            onReady.Invoke!(true, '');
        } catch (e: any) {
            const errMsg = e.message || String(e);
            console.error(`[McpServer] Initialization error: ${errMsg}`);
            onReady.Invoke!(false, errMsg);
        }
    })();
}

/**
 * Shut down the MCP Server and close the HTTP server.
 * Called from C# McpScriptManager.Shutdown().
 *
 * This forcefully destroys all active connections so that remote clients
 * get an immediate socket close instead of hanging indefinitely.
 */
export function onShutdown(): void {
    console.log('[McpServer] Shutting down...');

    // Close the active Streamable HTTP transport
    if (activeTransport) {
        try {
            activeTransport.close?.();
        } catch (e) {
            // ignore
        }
        activeTransport = null;
    }

    // Close the MCP server
    if (mcpServer) {
        try {
            mcpServer.close();
        } catch (e) {
            // ignore
        }
        mcpServer = null;
    }

    // Close the HTTP server and forcefully destroy all open sockets
    // so that in-flight requests are terminated immediately.
    if (httpServer) {
        // Destroy all tracked connections so clients get RST immediately
        for (const socket of trackedSockets) {
            try {
                socket.destroy();
            } catch (_) {
                // ignore
            }
        }
        trackedSockets.clear();

        httpServer.close();
        httpServer = null;
    }

    console.log('[McpServer] Shut down complete.');
}
