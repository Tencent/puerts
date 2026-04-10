/**
 * MCP Server Entry Module (V8 backend) — Multi-session support
 *
 * This is the main entry point loaded by PuerTS (V8 backend).
 * It creates MCP Server instances per session using @modelcontextprotocol/sdk
 * and bridges HTTP handling to C# McpHttpServer via CSharpBridgeTransport.
 *
 * Multiple clients can connect simultaneously; each gets its own session,
 * transport, and MCP server instance.
 *
 * No Node.js APIs are used — all HTTP/network operations are handled by C#.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CSharpBridgeTransport, generateUUID, isInitializeRequest } from './csharp-bridge-transport.mjs';
import type { CSharpHttpBridge } from './csharp-bridge-transport.mjs';
import { JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

import { setResourceRoot } from '../../ai_shared_src/resource-root.mjs';
import { initBuiltins, executeCode, builtinSummariesText } from '../../ai_shared_src/eval-core.mjs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionEntry {
    server: InstanceType<typeof McpServer>;
    transport: CSharpBridgeTransport;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** All active sessions, keyed by session ID. */
const sessions = new Map<string, SessionEntry>();

/** The C# bridge (set once during initialization). */
let activeBridge: CSharpHttpBridge | null = null;

/** Whether the server has been initialized (builtins loaded, bridge set). */
let serverReady = false;

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
// Session management
// ---------------------------------------------------------------------------

/**
 * Create a new session: generate a session ID, create a transport + MCP server,
 * connect them, and register with C#.
 */
async function createSession(bridge: CSharpHttpBridge): Promise<SessionEntry> {
    const sessionId = generateUUID();
    const server = createMcpServer();
    const transport = new CSharpBridgeTransport(bridge, sessionId);

    transport.onclose = () => {
        sessions.delete(sessionId);
        bridge.RemoveSession(sessionId);
        console.log(`[McpServer] Session ${sessionId} closed. Active sessions: ${sessions.size}`);
    };

    await server.connect(transport);

    // Register with C# so it can add session headers and validate GET/DELETE
    bridge.AddSession(sessionId);

    const entry: SessionEntry = { server, transport };
    sessions.set(sessionId, entry);

    console.log(`[McpServer] New session ${sessionId} created. Active sessions: ${sessions.size}`);
    return entry;
}

/**
 * Destroy a specific session by ID.
 */
function destroySession(sessionId: string): void {
    const entry = sessions.get(sessionId);
    if (!entry) return;

    sessions.delete(sessionId);

    // Detach onclose to prevent double-cleanup
    entry.transport.onclose = undefined;
    entry.transport.handleDelete();
    try { entry.transport.close?.(); } catch { /* ignore */ }

    try { entry.server.close(); } catch { /* ignore */ }

    activeBridge?.RemoveSession(sessionId);

    console.log(`[McpServer] Session ${sessionId} destroyed. Active sessions: ${sessions.size}`);
}

/**
 * Destroy all sessions (used during shutdown).
 */
function destroyAllSessions(): void {
    for (const [sessionId, entry] of sessions) {
        entry.transport.onclose = undefined;
        entry.transport.handleDelete();
        try { entry.transport.close?.(); } catch { /* ignore */ }
        try { entry.server.close(); } catch { /* ignore */ }
        activeBridge?.RemoveSession(sessionId);
    }
    sessions.clear();
    console.log('[McpServer] All sessions destroyed.');
}

// ---------------------------------------------------------------------------
// Exports for C# interop
// ---------------------------------------------------------------------------

/**
 * Initialize resources and prepare the server for accepting sessions.
 * Called from C# McpScriptManager.Initialize().
 *
 * @param root - Unity Resources path prefix, e.g. "LLMAgent/editor-assistant"
 * @param bridge - C# McpHttpServer instance (implements CSharpHttpBridge interface)
 * @param onReady - C# Action<bool, string> callback invoked when the server is ready.
 */
export function onInitialize(root: string, bridge: CSharpHttpBridge, onReady: CS.System.Action$2<boolean, string>): void {
    (async () => {
        try {
            setResourceRoot(root);
            await initBuiltins();
            activeBridge = bridge;
            serverReady = true;
            console.log('[McpServer] MCP Server initialization complete. Ready for sessions.');
            onReady.Invoke!(true, '');
        } catch (e: any) {
            const errMsg = e.message || String(e);
            console.error(`[McpServer] Initialization error: ${errMsg}`);
            onReady.Invoke!(false, errMsg);
        }
    })();
}

/**
 * Handle an incoming HTTP POST from C#.
 * Routes to the correct session, or creates a new session for initialize requests.
 */
export function handleHttpPost(requestContextId: string, method: string, body: string, sessionIdHeader: string): void {
    if (!serverReady || !activeBridge) {
        console.error('[McpServer] handleHttpPost called but server not ready');
        try {
            activeBridge?.SendJsonResponse(requestContextId, 503,
                JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Server is starting, please retry' }, id: null }));
        } catch { /* ignore */ }
        return;
    }

    try {
        // Parse body
        let rawMessage: unknown;
        try {
            rawMessage = JSON.parse(body);
        } catch {
            activeBridge.SendJsonResponse(requestContextId, 400,
                JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error: Invalid JSON' }, id: null }));
            return;
        }

        // Validate JSON-RPC
        let messages: JSONRPCMessage[];
        try {
            if (Array.isArray(rawMessage)) {
                messages = rawMessage.map(m => JSONRPCMessageSchema.parse(m));
            } else {
                messages = [JSONRPCMessageSchema.parse(rawMessage)];
            }
        } catch {
            activeBridge.SendJsonResponse(requestContextId, 400,
                JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error: Invalid JSON-RPC message' }, id: null }));
            return;
        }

        const isInit = messages.some(isInitializeRequest);

        if (isInit) {
            // Create a new session for this client
            createSession(activeBridge).then((entry) => {
                // Tell C# to add the session header for this response
                activeBridge!.AddSessionHeaderForContext(requestContextId, entry.transport.sessionId);
                entry.transport.handlePost(requestContextId, messages);
            }).catch((err: any) => {
                console.error(`[McpServer] Failed to create session: ${err.message || err}`);
                activeBridge!.SendJsonResponse(requestContextId, 500,
                    JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Failed to create session' }, id: null }));
            });
            return;
        }

        // Non-init request: route to existing session
        if (!sessionIdHeader) {
            activeBridge.SendJsonResponse(requestContextId, 400,
                JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Mcp-Session-Id header is required' }, id: null }));
            return;
        }

        const entry = sessions.get(sessionIdHeader);
        if (!entry) {
            activeBridge.SendJsonResponse(requestContextId, 404,
                JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null }));
            return;
        }

        entry.transport.handlePost(requestContextId, messages);
    } catch (err: any) {
        const errMsg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
        console.error(`[McpServer] handleHttpPost error: ${errMsg}`);
        try {
            activeBridge.SendJsonResponse(requestContextId, 500,
                JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Internal error' }, id: null }));
        } catch { /* ignore */ }
    }
}

/**
 * Handle a DELETE request from C# for a specific session.
 * Destroys only the targeted session.
 */
export function handleHttpDelete(sessionId: string): void {
    if (sessionId) {
        destroySession(sessionId);
    }
}

/**
 * Shut down the MCP Server.
 * Called from C# McpScriptManager.Shutdown().
 */
export function onShutdown(): void {
    console.log('[McpServer] Shutting down...');

    destroyAllSessions();
    activeBridge = null;
    serverReady = false;

    console.log('[McpServer] Shut down complete.');
}
