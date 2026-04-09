/**
 * C# Bridge Transport for MCP Server (V8 backend compatible)
 *
 * This transport replaces NodeStreamableHTTPServerTransport.
 * Instead of using Node.js HTTP APIs, it delegates all HTTP handling to C#
 * (McpHttpServer) and communicates via C#↔JS interop callbacks.
 *
 * The C# side handles:
 *   - HTTP listening, CORS, SSE streaming, connection management
 *
 * The JS side handles:
 *   - JSON-RPC message parsing/validation, session logic, MCP protocol
 */
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage, RequestId } from '@modelcontextprotocol/sdk/types.js';
import { JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isJSONRPCRequest(msg: JSONRPCMessage): msg is JSONRPCMessage & { method: string; id: RequestId } {
    return 'method' in msg && 'id' in msg;
}

function isInitializeRequest(msg: JSONRPCMessage): boolean {
    return isJSONRPCRequest(msg) && (msg as any).method === 'initialize';
}

function isJSONRPCResponse(msg: JSONRPCMessage): msg is JSONRPCMessage & { id: RequestId } {
    return ('result' in msg || 'error' in msg) && 'id' in msg;
}

/** Simple UUID v4 generator (no dependency on node:crypto). */
function generateUUID(): string {
    // Use Math.random-based UUID (sufficient for session IDs)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// ---------------------------------------------------------------------------
// C# interop interface
// ---------------------------------------------------------------------------

/**
 * Interface for the C# McpHttpServer methods exposed to JS.
 * These are called from JS to send HTTP responses back through C#.
 */
export interface CSharpHttpBridge {
    /** Set the MCP session ID on the C# server. */
    SetSession(sessionId: string): void;
    /** Begin SSE streaming for a POST request. */
    BeginSseStream(requestContextId: string): void;
    /** Write an SSE event to a POST response stream. */
    SendSseEvent(requestContextId: string, jsonData: string): void;
    /** Close a POST SSE stream. */
    ClosePostStream(requestContextId: string): void;
    /** Write an SSE event to the standalone GET stream. */
    SendGetSseEvent(jsonData: string): void;
    /** Send a plain JSON response and close the connection. */
    SendJsonResponse(requestContextId: string, statusCode: number, jsonBody: string): void;
    /** Send a 202 Accepted response. */
    Send202(requestContextId: string): void;
}

// ---------------------------------------------------------------------------
// Transport implementation
// ---------------------------------------------------------------------------

export class CSharpBridgeTransport implements Transport {
    // --- Transport interface fields ---
    sessionId?: string;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage, extra?: any) => void;

    private _bridge: CSharpHttpBridge;
    private _initialized = false;
    private _started = false;

    /** requestId → requestContextId so we know where to write the response. */
    private _requestToContext = new Map<string, string>();

    /** requestId → response message (buffered until all responses for a context are ready). */
    private _responseBuffer = new Map<string, JSONRPCMessage>();

    constructor(bridge: CSharpHttpBridge) {
        this._bridge = bridge;
    }

    // --- Transport interface ---

    async start(): Promise<void> {
        if (this._started) throw new Error('Transport already started');
        this._started = true;
    }

    async close(): Promise<void> {
        this._requestToContext.clear();
        this._responseBuffer.clear();
        this.onclose?.();
    }

    async send(message: JSONRPCMessage, options?: { relatedRequestId?: RequestId }): Promise<void> {
        let requestId = options?.relatedRequestId;

        // If the message itself is a response, use its id.
        if (isJSONRPCResponse(message)) {
            requestId = (message as any).id;
        }

        // Server-initiated message (no related request) → standalone GET stream
        if (requestId === undefined) {
            this._bridge.SendGetSseEvent(JSON.stringify(message));
            return;
        }

        const requestIdStr = String(requestId);

        // Response to a specific client request → POST SSE stream
        const contextId = this._requestToContext.get(requestIdStr);
        if (!contextId) {
            throw new Error(`No context for request ID: ${requestIdStr}`);
        }

        // Write the event immediately
        this._bridge.SendSseEvent(contextId, JSON.stringify(message));

        // If this is a final response, buffer it and check if all responses for this context are ready.
        if (isJSONRPCResponse(message)) {
            this._responseBuffer.set(requestIdStr, message);

            // Collect all request IDs that share this context
            const relatedIds: string[] = [];
            for (const [rid, cid] of this._requestToContext) {
                if (cid === contextId) relatedIds.push(rid);
            }

            const allDone = relatedIds.every(id => this._responseBuffer.has(id));
            if (allDone) {
                // Close the SSE stream – all responses have been sent.
                this._bridge.ClosePostStream(contextId);
                for (const id of relatedIds) {
                    this._responseBuffer.delete(id);
                    this._requestToContext.delete(id);
                }
            }
        }
    }

    // -------------------------------------------------------------------
    // Called from C# via McpHttpServer.OnHttpPost callback
    // -------------------------------------------------------------------

    /**
     * Handle an incoming HTTP POST request from C#.
     * This is the main entry point for processing MCP messages.
     *
     * @param requestContextId - Unique ID for this HTTP request (from C#)
     * @param body - Raw JSON body string
     * @param sessionIdHeader - The mcp-session-id header value (empty string if absent)
     */
    handlePost(requestContextId: string, body: string, sessionIdHeader: string): void {
        try {
            // Parse body
            let rawMessage: unknown;
            try {
                rawMessage = JSON.parse(body);
            } catch {
                this._bridge.SendJsonResponse(requestContextId, 400,
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
                this._bridge.SendJsonResponse(requestContextId, 400,
                    JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error: Invalid JSON-RPC message' }, id: null }));
                return;
            }

            const isInit = messages.some(isInitializeRequest);

            // --- Initialization ---
            if (isInit) {
                // If already initialized, reset state for the new session.
                // This handles the case where a client reconnects without sending DELETE first.
                if (this._initialized) {
                    this._requestToContext.clear();
                    this._responseBuffer.clear();
                }
                this.sessionId = generateUUID();
                this._initialized = true;
                // Tell C# about the session ID so it can add headers and validate future requests
                this._bridge.SetSession(this.sessionId);
            }

            // --- Session validation (non-init) ---
            if (!isInit) {
                if (!this._initialized) {
                    this._bridge.SendJsonResponse(requestContextId, 400,
                        JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Server not initialized' }, id: null }));
                    return;
                }
                if (!sessionIdHeader) {
                    this._bridge.SendJsonResponse(requestContextId, 400,
                        JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Mcp-Session-Id header is required' }, id: null }));
                    return;
                }
                if (sessionIdHeader !== this.sessionId) {
                    this._bridge.SendJsonResponse(requestContextId, 404,
                        JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null }));
                    return;
                }
            }

            // --- If no requests (only notifications / responses) → 202 ---
            const hasRequests = messages.some(isJSONRPCRequest);
            if (!hasRequests) {
                for (const msg of messages) {
                    this.onmessage?.(msg);
                }
                this._bridge.Send202(requestContextId);
                return;
            }

            // --- Open an SSE stream for the response ---
            this._bridge.BeginSseStream(requestContextId);

            // Register request IDs → context mapping
            for (const msg of messages) {
                if (isJSONRPCRequest(msg)) {
                    this._requestToContext.set(String((msg as any).id), requestContextId);
                }
            }

            // Dispatch messages to the MCP server
            for (const msg of messages) {
                this.onmessage?.(msg);
            }
        } catch (err: any) {
            const errMsg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
            console.error(`[CSharpBridgeTransport] handlePost error: ${errMsg}`);
            this.onerror?.(err instanceof Error ? err : new Error(String(err)));
            try {
                this._bridge.SendJsonResponse(requestContextId, 500,
                    JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Internal error' }, id: null }));
            } catch { /* ignore */ }
        }
    }

    /**
     * Handle a DELETE request — reset session state.
     */
    handleDelete(): void {
        this._initialized = false;
        this.sessionId = undefined;
        this._requestToContext.clear();
        this._responseBuffer.clear();
    }
}
