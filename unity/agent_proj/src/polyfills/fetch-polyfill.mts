/**
 * Fetch polyfill for PuerTS V8 environment.
 * Bridges to C# HttpBridge.SendRequestAsync for truly async HTTP requests.
 */
import { ReadableStream as PolyfillReadableStream } from 'web-streams-polyfill';

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
     * AI SDK uses response.body.getReader() and response.pipeThrough().
     */
    get body(): any {
        if (this._body === null) {
            const text = this._bodyText;
            const encoder = new TextEncoder();
            const encoded = encoder.encode(text);
            this._body = new PolyfillReadableStream({
                start(controller: any) {
                    controller.enqueue(encoded);
                    controller.close();
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
        const encoder = new TextEncoder();
        return encoder.encode(this._bodyText).buffer;
    }

    async blob(): Promise<any> {
        const text = this._bodyText;
        return {
            text: async () => text,
            arrayBuffer: async () => {
                const encoder = new TextEncoder();
                return encoder.encode(text).buffer;
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
 * The actual fetch implementation that calls C# HttpBridge.SendRequestAsync.
 * Returns a genuine Promise that resolves asynchronously when C# callback fires.
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

    // Return a Promise that resolves when C# async callback fires
    return new Promise<FetchResponse>((resolve, reject) => {
        try {
            // Call C# HttpBridge.SendRequestAsync(url, method, headersJson, body, callback)
            // The callback receives the JSON response string asynchronously
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
