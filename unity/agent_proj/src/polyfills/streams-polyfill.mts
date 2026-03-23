/**
 * Web Streams API polyfill for PuerTS V8 environment.
 * V8 does not include Web Streams (TransformStream, ReadableStream, etc.).
 * We use the web-streams-polyfill package to provide them.
 */
import {
    ReadableStream as PolyfillReadableStream,
    WritableStream as PolyfillWritableStream,
    TransformStream as PolyfillTransformStream,
    ByteLengthQueuingStrategy as PolyfillByteLengthQueuingStrategy,
    CountQueuingStrategy as PolyfillCountQueuingStrategy,
} from 'web-streams-polyfill';

/**
 * Minimal AbortController / AbortSignal polyfill.
 */
class AbortSignalPolyfill {
    aborted: boolean = false;
    reason: any = undefined;
    private _listeners: Array<() => void> = [];

    addEventListener(_event: string, listener: () => void): void {
        this._listeners.push(listener);
    }

    removeEventListener(_event: string, listener: () => void): void {
        this._listeners = this._listeners.filter(l => l !== listener);
    }

    dispatchEvent(_event: any): boolean {
        for (const listener of this._listeners) {
            try { listener(); } catch (_) { /* ignore */ }
        }
        return true;
    }

    throwIfAborted(): void {
        if (this.aborted) {
            throw this.reason;
        }
    }

    static abort(reason?: any): AbortSignalPolyfill {
        const signal = new AbortSignalPolyfill();
        signal.aborted = true;
        signal.reason = reason ?? new DOMException('The operation was aborted.', 'AbortError');
        return signal;
    }

    static timeout(ms: number): AbortSignalPolyfill {
        const signal = new AbortSignalPolyfill();
        setTimeout(() => {
            signal.aborted = true;
            signal.reason = new DOMException('The operation was aborted due to timeout.', 'TimeoutError');
            for (const listener of signal._listeners) {
                try { listener(); } catch (_) { /* ignore */ }
            }
        }, ms);
        return signal;
    }
}

class AbortControllerPolyfill {
    readonly signal: AbortSignalPolyfill = new AbortSignalPolyfill();

    abort(reason?: any): void {
        if (this.signal.aborted) return;
        this.signal.aborted = true;
        this.signal.reason = reason ?? new DOMException('The operation was aborted.', 'AbortError');
        this.signal.dispatchEvent(new Event('abort'));
    }
}

/**
 * Minimal DOMException polyfill (V8 may not have it).
 */
class DOMExceptionPolyfill extends Error {
    readonly code: number;
    constructor(message?: string, name?: string) {
        super(message);
        this.name = name || 'Error';
        this.code = 0;
    }
}

/**
 * Minimal Event polyfill.
 */
class EventPolyfill {
    readonly type: string;
    constructor(type: string) {
        this.type = type;
    }
}

/** * TextDecoderStream polyfill using TransformStream + TextDecoder.
 * If the incoming chunk is already a string (e.g. from our fetch polyfill),
 * it is passed through without decoding.
 * This avoids a hard dependency on the global TextDecoder which
 * may not exist in PuerTS V8.
 */
class TextDecoderStreamPolyfill {
    private _decoder: any; // TextDecoder | null – created lazily
    private _decoderLabel: string | undefined;
    private _decoderOptions: TextDecoderOptions | undefined;
    private _transform: InstanceType<typeof PolyfillTransformStream>;

    constructor(label?: string, options?: TextDecoderOptions) {
        this._decoderLabel = label;
        this._decoderOptions = options;
        this._decoder = null; // created on first binary chunk
        const self = this;
        this._transform = new PolyfillTransformStream({
            transform: (chunk: any, controller: any) => {
                // String input: pass through directly
                if (typeof chunk === 'string') {
                    if (chunk) controller.enqueue(chunk);
                    return;
                }
                // Binary input: decode with TextDecoder
                if (!self._decoder) {
                    self._decoder = new TextDecoder(self._decoderLabel, self._decoderOptions);
                }
                const text = self._decoder.decode(chunk, { stream: true });
                if (text) {
                    controller.enqueue(text);
                }
            },
            flush: (controller: any) => {
                if (self._decoder) {
                    const text = self._decoder.decode();
                    if (text) {
                        controller.enqueue(text);
                    }
                }
            },
        });
    }

    get readable() { return this._transform.readable; }
    get writable() { return this._transform.writable; }
}

/**
 * TextEncoderStream polyfill using TransformStream + TextEncoder.
 * If the incoming chunk is already a Uint8Array / ArrayBuffer, it is
 * passed through without encoding.
 * This avoids a hard dependency on the global TextEncoder.
 */
class TextEncoderStreamPolyfill {
    private _encoder: any; // TextEncoder | null – created lazily
    private _transform: InstanceType<typeof PolyfillTransformStream>;

    constructor() {
        this._encoder = null;
        const self = this;
        this._transform = new PolyfillTransformStream({
            transform: (chunk: any, controller: any) => {
                // Already binary: pass through
                if (chunk instanceof Uint8Array || chunk instanceof ArrayBuffer) {
                    controller.enqueue(chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : chunk);
                    return;
                }
                // String input: encode
                if (!self._encoder) {
                    self._encoder = new TextEncoder();
                }
                const encoded = self._encoder.encode(chunk);
                controller.enqueue(encoded);
            },
        });
    }

    get readable() { return this._transform.readable; }
    get writable() { return this._transform.writable; }
}

/**
 * Install all Web Streams API polyfills into globalThis.
 */
export function installStreamsPolyfill(): void {
    const g = globalThis as any;

    // Web Streams
    if (typeof g.ReadableStream === 'undefined') {
        g.ReadableStream = PolyfillReadableStream;
        console.log('[Polyfill] ReadableStream installed.');
    }
    if (typeof g.WritableStream === 'undefined') {
        g.WritableStream = PolyfillWritableStream;
        console.log('[Polyfill] WritableStream installed.');
    }
    if (typeof g.TransformStream === 'undefined') {
        g.TransformStream = PolyfillTransformStream;
        console.log('[Polyfill] TransformStream installed.');
    }
    if (typeof g.ByteLengthQueuingStrategy === 'undefined') {
        g.ByteLengthQueuingStrategy = PolyfillByteLengthQueuingStrategy;
    }
    if (typeof g.CountQueuingStrategy === 'undefined') {
        g.CountQueuingStrategy = PolyfillCountQueuingStrategy;
    }

    // TextDecoderStream / TextEncoderStream
    if (typeof g.TextDecoderStream === 'undefined') {
        g.TextDecoderStream = TextDecoderStreamPolyfill;
        console.log('[Polyfill] TextDecoderStream installed.');
    }
    if (typeof g.TextEncoderStream === 'undefined') {
        g.TextEncoderStream = TextEncoderStreamPolyfill;
        console.log('[Polyfill] TextEncoderStream installed.');
    }

    // AbortController / AbortSignal
    if (typeof g.AbortController === 'undefined') {
        g.AbortController = AbortControllerPolyfill;
        console.log('[Polyfill] AbortController installed.');
    }
    if (typeof g.AbortSignal === 'undefined') {
        g.AbortSignal = AbortSignalPolyfill;
        console.log('[Polyfill] AbortSignal installed.');
    }

    // DOMException
    if (typeof g.DOMException === 'undefined') {
        g.DOMException = DOMExceptionPolyfill;
        console.log('[Polyfill] DOMException installed.');
    }

    // Event
    if (typeof g.Event === 'undefined') {
        g.Event = EventPolyfill;
        console.log('[Polyfill] Event installed.');
    }

    // URL — provided by esbuild banner polyfill, no need to install here.

    // structuredClone
    if (typeof g.structuredClone === 'undefined') {
        g.structuredClone = function structuredClone(value: any, _options?: any): any {
            if (value === undefined || value === null) return value;
            try {
                return JSON.parse(JSON.stringify(value));
            } catch (_e) {
                return value;
            }
        };
        console.log('[Polyfill] structuredClone installed.');
    }
}

installStreamsPolyfill();