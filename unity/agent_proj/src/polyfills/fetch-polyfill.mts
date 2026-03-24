/**
 * Fetch polyfill for PuerTS V8 environment.
 * Bridges to C# HttpBridge.SendRequestAsync for truly async HTTP requests.
 */
import { ReadableStream as PolyfillReadableStream } from 'web-streams-polyfill';

/**
 * Encode a string as UTF-8 into a Uint8Array.
 * Self-contained helper that does NOT depend on the global TextEncoder
 * (which may be unavailable in PuerTS V8).
 */
function encodeUTF8(str: string): Uint8Array {
    // Fast path: try the global TextEncoder if it exists
    if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(str);
    }
    // Fallback: manual UTF-8 encoding
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 0x80) {
            bytes.push(c);
        } else if (c < 0x800) {
            bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
        } else if (c >= 0xd800 && c < 0xdc00) {
            // Surrogate pair
            const next = str.charCodeAt(++i);
            const cp = ((c - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
            bytes.push(
                0xf0 | (cp >> 18),
                0x80 | ((cp >> 12) & 0x3f),
                0x80 | ((cp >> 6) & 0x3f),
                0x80 | (cp & 0x3f)
            );
        } else {
            bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
        }
    }
    return new Uint8Array(bytes);
}

/**
 * Minimal Headers implementation for fetch API compatibility.
 */
class FetchHeaders {
    private map: Map<string, string> = new Map();

    constructor(init?: Record<string, string> | [string, string][]) {
        if (init) {
            if (Array.isArray(init)) {
                for (const [key, value] of init) {
                    this.map.set(key.toLowerCase(), value);
                }
            } else {
                for (const key of Object.keys(init)) {
                    this.map.set(key.toLowerCase(), init[key]);
                }
            }
        }
    }

    get(name: string): string | null {
        return this.map.get(name.toLowerCase()) ?? null;
    }

    set(name: string, value: string): void {
        this.map.set(name.toLowerCase(), value);
    }

    has(name: string): boolean {
        return this.map.has(name.toLowerCase());
    }

    delete(name: string): void {
        this.map.delete(name.toLowerCase());
    }

    forEach(callback: (value: string, key: string) => void): void {
        this.map.forEach((value, key) => callback(value, key));
    }

    entries(): IterableIterator<[string, string]> {
        return this.map.entries();
    }

    keys(): IterableIterator<string> {
        return this.map.keys();
    }

    values(): IterableIterator<string> {
        return this.map.values();
    }

    [Symbol.iterator](): IterableIterator<[string, string]> {
        return this.map.entries();
    }
}

/**
 * Minimal Response implementation for fetch API compatibility.
 */
class FetchResponse {
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly headers: FetchHeaders;
    readonly url: string;
    private _bodyText: string;
    private _bodyUsed: boolean = false;
    private _body: any = null;

    constructor(
        bodyText: string,
        status: number,
        statusText: string,
        headers: FetchHeaders,
        url: string
    ) {
        this._bodyText = bodyText;
        this.status = status;
        this.statusText = statusText;
        this.headers = headers;
        this.url = url;
        this.ok = status >= 200 && status < 300;
    }

    get bodyUsed(): boolean {
        return this._bodyUsed;
    }

    /**
     * Returns a ReadableStream of the body content.
     * AI SDK uses response.body.pipeThrough() to process SSE streams.
     *
     * The stream enqueues the raw string directly (not Uint8Array) because:
     *   1. PuerTS V8 has no native TextEncoder / TextDecoder.
     *   2. Our TextDecoderStreamPolyfill transparently passes strings through,
     *      so the downstream EventSourceParserStream receives the text it expects.
     *   3. This avoids a pointless encode → decode round-trip.
     *
     * Uses a pull-based ReadableStream so that data is only delivered
     * when the consumer requests it, which avoids Promise scheduling
     * issues in web-streams-polyfill when piped through TransformStream
     * chains (TextDecoderStream → EventSourceParserStream → JSON parse).
     */
    get body(): any {
        if (this._body === null) {
            const text = this._bodyText;
            let done = false;
            this._body = new PolyfillReadableStream({
                pull(controller: any) {
                    if (!done) {
                        done = true;
                        controller.enqueue(text);
                        // Do NOT close here — return a resolved promise so that
                        // the next pull() call (if any) will close the stream,
                        // giving the pipe machinery a chance to flush.
                    } else {
                        controller.close();
                    }
                },
            });
        }
        return this._body;
    }

    /**
     * Pipe the body through a TransformStream.
     */
    pipeThrough(transform: any, _options?: any): any {
        return this.body.pipeThrough(transform);
    }

    async text(): Promise<string> {
        this._bodyUsed = true;
        return this._bodyText;
    }

    async json(): Promise<any> {
        this._bodyUsed = true;
        return JSON.parse(this._bodyText);
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
        this._bodyUsed = true;
        return encodeUTF8(this._bodyText).buffer as ArrayBuffer;
    }

    async blob(): Promise<any> {
        const text = this._bodyText;
        return {
            text: async () => text,
            arrayBuffer: async () => {
                return encodeUTF8(text).buffer as ArrayBuffer;
            },
            size: this._bodyText.length,
            type: this.headers.get('content-type') || '',
        };
    }

    clone(): FetchResponse {
        return new FetchResponse(
            this._bodyText,
            this.status,
            this.statusText,
            this.headers,
            this.url
        );
    }
}

/**
 * Streaming Response implementation.
 * The body is a push-based ReadableStream: C# calls onChunk repeatedly,
 * each chunk is enqueued into the stream. When the stream completes,
 * the controller is closed.
 */
class FetchStreamResponse {
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly headers: FetchHeaders;
    readonly url: string;
    readonly body: any; // ReadableStream
    private _bodyUsed: boolean = false;
    private _controller: any = null;
    private _fullText: string = '';

    constructor(
        status: number,
        statusText: string,
        headers: FetchHeaders,
        url: string
    ) {
        this.status = status;
        this.statusText = statusText;
        this.headers = headers;
        this.url = url;
        this.ok = status >= 200 && status < 300;

        // Create a push-based ReadableStream.
        // The controller is captured so that pushChunk / closeStream can use it.
        const self = this;
        this.body = new PolyfillReadableStream({
            start(controller: any) {
                self._controller = controller;
            },
        });
    }

    get bodyUsed(): boolean {
        return this._bodyUsed;
    }

    /**
     * Push a chunk of text into the body stream.
     * Called by the fetch polyfill when C# delivers data.
     */
    pushChunk(text: string): void {
        if (this._controller && text) {
            this._fullText += text;
            this._controller.enqueue(text);
        }
    }

    /**
     * Signal that the stream is complete.
     */
    closeStream(): void {
        if (this._controller) {
            try { this._controller.close(); } catch (_) { /* already closed */ }
            this._controller = null;
        }
    }

    /**
     * Signal a stream error.
     */
    errorStream(err: any): void {
        if (this._controller) {
            try { this._controller.error(err); } catch (_) { /* already errored */ }
            this._controller = null;
        }
    }

    pipeThrough(transform: any, _options?: any): any {
        return this.body.pipeThrough(transform);
    }

    async text(): Promise<string> {
        this._bodyUsed = true;
        return this._fullText;
    }

    async json(): Promise<any> {
        this._bodyUsed = true;
        return JSON.parse(this._fullText);
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
        this._bodyUsed = true;
        return encodeUTF8(this._fullText).buffer as ArrayBuffer;
    }
}

/**
 * Check if a request body string contains "stream":true,
 * indicating the AI SDK wants a streaming response.
 */
function isStreamRequest(body: string | null): boolean {
    if (!body) return false;
    // Quick check — avoid full JSON parse
    return body.includes('"stream":true') || body.includes('"stream": true');
}

/**
 * The actual fetch implementation that calls C# HttpBridge.
 * For streaming requests (body contains "stream":true), uses
 * SendStreamRequestAsync which pushes data chunks as they arrive.
 * For non-streaming requests, uses the original SendRequestAsync.
 */
async function fetchImpl(
    input: string | URL | { url: string; method?: string; headers?: any; body?: any },
    init?: {
        method?: string;
        headers?: Record<string, string> | [string, string][];
        body?: string | ArrayBuffer | null;
        signal?: any;
    }
): Promise<FetchResponse> {
    // Parse input
    let url: string;
    let method = 'GET';
    let headers: Record<string, string> = {};
    let body: string | null = null;

    if (typeof input === 'string') {
        url = input;
    } else if (input instanceof URL) {
        url = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
        url = input.url;
        if (input.method) method = input.method;
        if (input.headers) {
            if (typeof input.headers.forEach === 'function') {
                input.headers.forEach((value: string, key: string) => {
                    headers[key] = value;
                });
            } else {
                headers = { ...input.headers };
            }
        }
        if (input.body) {
            body = typeof input.body === 'string' ? input.body : null;
        }
    } else {
        url = String(input);
    }

    // Apply init overrides
    if (init) {
        if (init.method) method = init.method;
        if (init.headers) {
            if (Array.isArray(init.headers)) {
                for (const [key, value] of init.headers) {
                    headers[key] = value;
                }
            } else {
                Object.assign(headers, init.headers);
            }
        }
        if (init.body !== undefined) {
            body = init.body ? String(init.body) : null;
        }
    }

    // Check for abort signal
    if (init?.signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
    }

    // Serialize headers to JSON string for C# bridge
    const headersJson = JSON.stringify(headers);

    const streaming = isStreamRequest(body);

    if (streaming) {
        // ---- Streaming path: resolve as soon as headers arrive ----
        return new Promise<any>((resolve, reject) => {
            try {
                console.log(`[Polyfill][Stream] request: ${body}`);
                let streamResponse: FetchStreamResponse | null = null;

                CS.LLMAgent.HttpBridge.SendStreamRequestAsync(
                    url,
                    method,
                    headersJson,
                    body || '',
                    // onHeader: called once with status/headers JSON
                    (headerJson: string) => {
                        try {
                            console.log(`[Polyfill][Stream] headers arrived: ${headerJson}`);
                            const hdr = JSON.parse(headerJson);
                            const responseHeaders = new FetchHeaders(hdr.headers || {});
                            streamResponse = new FetchStreamResponse(
                                hdr.status || 200,
                                hdr.statusText || 'OK',
                                responseHeaders,
                                url
                            );
                            resolve(streamResponse);
                        } catch (e: any) {
                            reject(new TypeError(`Failed to parse stream headers: ${e.message || e}`));
                        }
                    },
                    // onChunk: called for each data chunk
                    (chunk: string) => {
                        if (streamResponse && chunk) {
                            streamResponse.pushChunk(chunk);
                        }
                    },
                    // onComplete: called when stream ends
                    (completionJson: string) => {
                        if (completionJson && completionJson.includes('"error"')) {
                            // Error case
                            console.log(`[Polyfill][Stream] error: ${completionJson}`);
                            if (streamResponse) {
                                streamResponse.errorStream(new Error(completionJson));
                            } else {
                                reject(new TypeError(`Stream request failed: ${completionJson}`));
                            }
                        } else {
                            // Normal completion
                            console.log(`[Polyfill][Stream] complete`);
                            if (streamResponse) {
                                streamResponse.closeStream();
                            }
                        }
                    }
                );
            } catch (error: any) {
                reject(new TypeError(`Network request failed: ${error.message || error}`));
            }
        });
    }

    // ---- Non-streaming path: original logic ----
    return new Promise<FetchResponse>((resolve, reject) => {
        try {
            console.log(`[Polyfill] request: ${body}`);

            CS.LLMAgent.HttpBridge.SendRequestAsync(
                url,
                method,
                headersJson,
                body || '',
                (responseJson: string) => {
                    try {
                        const responseData = JSON.parse(responseJson);
                        console.log(`[Polyfill] response: ${responseData.body}`);

                        const responseHeaders = new FetchHeaders(responseData.headers || {});

                        resolve(new FetchResponse(
                            responseData.body || '',
                            responseData.status || 0,
                            responseData.statusText || '',
                            responseHeaders,
                            url
                        ));
                    } catch (parseError: any) {
                        reject(new TypeError(`Failed to parse response: ${parseError.message || parseError}`));
                    }
                }
            );
        } catch (error: any) {
            reject(new TypeError(`Network request failed: ${error.message || error}`));
        }
    });
}

/**
 * Install the fetch polyfill into globalThis.
 */
export function installFetchPolyfill(): void {
    if (typeof globalThis.fetch === 'undefined') {
        (globalThis as any).fetch = fetchImpl;
        (globalThis as any).Headers = FetchHeaders;
        (globalThis as any).Response = FetchResponse;
        console.log('[Polyfill] fetch polyfill installed.');
    } else {
        console.log('[Polyfill] fetch already available, skipping polyfill.');
    }
}

installFetchPolyfill();
