'use strict';
// WebSocketPP (the native binding behind puerts/websocketpp.js), only available when the plugin is built with WITH_WEBSOCKET.
// There is no server in the test, so it covers construction, argument checks, polling, handler calls and the swallowing of
// handler exceptions with a refused connection. No baseline: the result depends on the build options.
const { test, step, eq, assert, catchError, run } = require('./framework');

const enabled = typeof WebSocketPP === 'function';

function pollUntil(raw, cond, timeoutMs) {
    const start = Date.now();
    while (!cond() && Date.now() - start < timeoutMs) {
        raw.poll();
    }
    return cond();
}

test('availability', () => {
    eq(typeof WebSocket, enabled ? 'function' : 'undefined', 'WebSocket is defined with WebSocketPP');
});

if (enabled) {
    test('bad uri', () => {
        const err = catchError(() => new WebSocketPP('not a uri'));
        assert(String(err).indexOf('could not create connection') >= 0, `bad uri throws: ${err}`);
    });

    test('refused connection', () => {
        const raw = new WebSocketPP('ws://127.0.0.1:1');
        const calls = [];
        raw.setHandles(
            () => calls.push('open'),
            () => calls.push('message'),
            () => calls.push('close'),
            (reason) => {
                calls.push('fail');
                assert(typeof reason === 'string' && reason.indexOf('on fail') === 0, `fail reason: ${reason}`);
                throw new Error('handler exception is swallowed');
            }
        );
        const sendErr = catchError(() => raw.send('x'));
        assert(String(sendErr).indexOf('WebSocket is not open') >= 0, `send before open throws: ${sendErr}`);
        const sendTypeErr = catchError(() => raw.send(1));
        assert(String(sendTypeErr).indexOf('WebSocket is not open') >= 0, 'send checks open first');

        const failed = pollUntil(raw, () => calls.length > 0, 10000);
        assert(failed, 'fail handler called');
        eq(calls.join(','), 'fail', 'only fail handler called');

        // polling after failure is a no-op
        raw.poll();
        eq(calls.join(','), 'fail');

        const statue = raw.statue();
        assert(Array.isArray(statue) && statue.length === 2, 'statue returns [code, message]');
        eq(typeof statue[0], 'number');
        eq(typeof statue[1], 'string');
        raw.close();
    });

    test('wrapper', () => {
        const ws = new WebSocket('ws://127.0.0.1:1');
        eq(ws.readyState, WebSocket.CONNECTING);
        const events = [];
        ws.addEventListener('error', () => events.push('error'));
        ws.send('x');
        eq(events.join(','), 'error', 'send before open dispatches error immediately');
        ws.close();
        eq(ws.readyState, WebSocket.CLOSING);
    });

    test('method on non instance', () => {
        const err = catchError(() => WebSocketPP.prototype.poll.call({}));
        assert(err !== '<no throw>', `calling a method on a non WebSocketPP object throws: ${err}`);
    });

    test('gc', () => {
        // the native objects are released by the finalizer during the gc between steps
        for (let i = 0; i < 4; i++) {
            new WebSocketPP('ws://127.0.0.1:1');
        }
    });

    step(() => {
        test('after gc', () => {
            const raw = new WebSocketPP('ws://127.0.0.1:1');
            raw.close();
        });
    });
}

run();
