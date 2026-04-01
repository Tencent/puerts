/**
 * Pure Node.js Streamable HTTP Server Transport
 *
 * A lightweight implementation of the MCP Streamable HTTP transport protocol
 * using only Node.js built-in APIs (http.IncomingMessage / http.ServerResponse).
 *
 * This avoids the dependency on @hono/node-server and Web Standard APIs
 * (global.Request / global.Response) which are not available in PuerTS.
 */
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage, RequestId } from '@modelcontextprotocol/sdk/types.js';

// Re-use the SDK's Zod schema for message validation
import { JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether a parsed JSON-RPC message is a *request* (has `method` + `id`). */
function isJSONRPCRequest(msg: JSONRPCMessage): msg is JSONRPCMessage & { method: string; id: RequestId } {
    return 'method' in msg && 'id' in msg;
}

/** Check whether a parsed JSON-RPC message is an *initialize* request. */
function isInitializeRequest(msg: JSONRPCMessage): boolean {
    return isJSONRPCRequest(msg) && (msg as any).method === 'initialize';
}

/** Check whether a parsed JSON-RPC message is a response (result or error). */
function isJSONRPCResponse(msg: JSONRPCMessage): msg is JSONRPCMessage & { id: RequestId } {
    return ('result' in msg || 'error' in msg) && 'id' in msg;
}

/** Read the full body of an IncomingMessage as a string. */
function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        req.on('error', reject);
    });
}

// ---------------------------------------------------------------------------
// Transport implementation
// ---------------------------------------------------------------------------

export interface NodeStreamableHTTPTransportOptions {
    /** Supply a function that returns a unique session ID, or `undefined` for stateless mode. */
    sessionIdGenerator?: () => string;
}

/**
 * MCP Streamable HTTP transport implemented with pure Node.js APIs.
 *
 * Protocol summary (https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/#streamable-http):
 *  - POST /mcp  – client sends JSON-RPC message(s); server responds with SSE stream containing responses.
 *  - GET  /mcp  – client opens an SSE stream for server-initiated messages (notifications / requests).
 *  - DELETE /mcp – client terminates the session.
 */
export class NodeStreamableHTTPServerTransport implements Transport {
    // --- Transport interface fields ---
    sessionId?: string;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage, extra?: any) => void;

    private _sessionIdGenerator: (() => string) | undefined;
    private _initialized = false;
    private _started = false;

    /**
     * Map from streamId → ServerResponse that is kept open as an SSE stream.
     * Each POST with request(s) gets its own stream; there is also an optional
     * standalone GET stream keyed by `_GET_stream`.
     */
    private _streams = new Map<string, ServerResponse>();

    /** requestId → streamId so we know where to write the response. */
    private _requestToStream = new Map<RequestId, string>();

    /** requestId → response message (buffered until all responses for a stream are ready). */
    private _responseBuffer = new Map<RequestId, JSONRPCMessage>();

    private static readonly _STANDALONE_STREAM = '_GET_stream';

    constructor(options: NodeStreamableHTTPTransportOptions = {}) {
        this._sessionIdGenerator = options.sessionIdGenerator;
    }

    // --- Transport interface ---

    async start(): Promise<void> {
        if (this._started) throw new Error('Transport already started');
        this._started = true;
    }

    async close(): Promise<void> {
        for (const [, res] of this._streams) {
            try { res.end(); } catch { /* ignore */ }
        }
        this._streams.clear();
        this._requestToStream.clear();
        this._responseBuffer.clear();
        this.onclose?.();
    }

    async send(message: JSONRPCMessage, options?: { relatedRequestId?: RequestId }): Promise<void> {
        let requestId = options?.relatedRequestId;

        // If the message itself is a response, use its id.
        if (isJSONRPCResponse(message)) {
            requestId = (message as any).id;
        }

        // --- Server-initiated message (no related request) → standalone GET stream ---
        if (requestId === undefined) {
            const res = this._streams.get(NodeStreamableHTTPServerTransport._STANDALONE_STREAM);
            if (res) {
                this._writeSseEvent(res, message);
            }
            return;
        }

        // --- Response to a specific client request → POST SSE stream ---
        const streamId = this._requestToStream.get(requestId);
        if (!streamId) {
            throw new Error(`No stream for request ID: ${String(requestId)}`);
        }

        const res = this._streams.get(streamId);
        if (!res) {
            throw new Error(`Stream already closed for request ID: ${String(requestId)}`);
        }

        // Write the event immediately
        this._writeSseEvent(res, message);

        // If this is a final response, buffer it and check if all responses for this stream are ready.
        if (isJSONRPCResponse(message)) {
            this._responseBuffer.set(requestId, message);

            // Collect all request IDs that share this stream
            const relatedIds: RequestId[] = [];
            for (const [rid, sid] of this._requestToStream) {
                if (sid === streamId) relatedIds.push(rid);
            }

            const allDone = relatedIds.every(id => this._responseBuffer.has(id));
            if (allDone) {
                // Close the SSE stream – all responses have been sent.
                try { res.end(); } catch { /* ignore */ }
                this._streams.delete(streamId);
                for (const id of relatedIds) {
                    this._responseBuffer.delete(id);
                    this._requestToStream.delete(id);
                }
            }
        }
    }

    // --- HTTP request handler (called from the HTTP server) ---

    async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        try {
            switch (req.method) {
                case 'POST':
                    await this._handlePost(req, res);
                    break;
                case 'GET':
                    this._handleGet(req, res);
                    break;
                case 'DELETE':
                    await this._handleDelete(req, res);
                    break;
                default:
                    res.writeHead(405, { Allow: 'GET, POST, DELETE', 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null }));
            }
        } catch (err: any) {
            this.onerror?.(err instanceof Error ? err : new Error(String(err)));
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Internal error' }, id: null }));
            }
        }
    }

    // --- POST handler ---

    private async _handlePost(req: IncomingMessage, res: ServerResponse): Promise<void> {
        // Parse body
        const bodyStr = await readBody(req);
        let rawMessage: unknown;
        try {
            rawMessage = JSON.parse(bodyStr);
        } catch {
            this._jsonError(res, 400, -32700, 'Parse error: Invalid JSON');
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
            this._jsonError(res, 400, -32700, 'Parse error: Invalid JSON-RPC message');
            return;
        }

        const isInit = messages.some(isInitializeRequest);

        // --- Initialization ---
        if (isInit) {
            if (this._initialized && this.sessionId !== undefined) {
                this._jsonError(res, 400, -32600, 'Server already initialized');
                return;
            }
            this.sessionId = this._sessionIdGenerator?.();
            this._initialized = true;
        }

        // --- Session validation (non-init) ---
        if (!isInit) {
            const err = this._validateSession(req, res);
            if (err) return; // response already sent
        }

        // --- If no requests (only notifications / responses) → 202 ---
        const hasRequests = messages.some(isJSONRPCRequest);
        if (!hasRequests) {
            for (const msg of messages) {
                this.onmessage?.(msg);
            }
            res.writeHead(202);
            res.end();
            return;
        }

        // --- Open an SSE stream for the response ---
        const streamId = randomUUID();

        const headers: Record<string, string> = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        };
        if (this.sessionId !== undefined) {
            headers['mcp-session-id'] = this.sessionId;
        }
        res.writeHead(200, headers);

        // Register stream
        this._streams.set(streamId, res);
        for (const msg of messages) {
            if (isJSONRPCRequest(msg)) {
                this._requestToStream.set((msg as any).id, streamId);
            }
        }

        res.on('close', () => {
            this._streams.delete(streamId);
        });

        // Dispatch messages to the MCP server
        for (const msg of messages) {
            this.onmessage?.(msg);
        }
    }

    // --- GET handler (standalone SSE stream) ---

    private _handleGet(req: IncomingMessage, res: ServerResponse): void {
        const err = this._validateSession(req, res);
        if (err) return;

        if (this._streams.has(NodeStreamableHTTPServerTransport._STANDALONE_STREAM)) {
            this._jsonError(res, 409, -32000, 'Only one GET SSE stream allowed per session');
            return;
        }

        const headers: Record<string, string> = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        };
        if (this.sessionId !== undefined) {
            headers['mcp-session-id'] = this.sessionId;
        }
        res.writeHead(200, headers);

        this._streams.set(NodeStreamableHTTPServerTransport._STANDALONE_STREAM, res);
        res.on('close', () => {
            this._streams.delete(NodeStreamableHTTPServerTransport._STANDALONE_STREAM);
        });
    }

    // --- DELETE handler ---

    private async _handleDelete(req: IncomingMessage, res: ServerResponse): Promise<void> {
        const err = this._validateSession(req, res);
        if (err) return;

        await this.close();
        res.writeHead(200);
        res.end();
    }

    // --- Helpers ---

    private _validateSession(req: IncomingMessage, res: ServerResponse): boolean {
        if (this._sessionIdGenerator === undefined) {
            // Stateless – no validation needed
            return false;
        }
        if (!this._initialized) {
            this._jsonError(res, 400, -32000, 'Server not initialized');
            return true;
        }
        const incoming = req.headers['mcp-session-id'] as string | undefined;
        if (!incoming) {
            this._jsonError(res, 400, -32000, 'Mcp-Session-Id header is required');
            return true;
        }
        if (incoming !== this.sessionId) {
            this._jsonError(res, 404, -32001, 'Session not found');
            return true;
        }
        return false;
    }

    private _jsonError(res: ServerResponse, status: number, code: number, message: string): void {
        if (res.headersSent) return;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }));
    }

    private _writeSseEvent(res: ServerResponse, message: JSONRPCMessage): void {
        try {
            res.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
        } catch (err: any) {
            this.onerror?.(err instanceof Error ? err : new Error(String(err)));
        }
    }
}
