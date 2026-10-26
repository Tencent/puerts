'use strict';
// Promise rejection tracking: the reject events of the engine are forwarded to puerts/promises.js by the backend
// (papi_v8::SetPromiseRejectHandler), which emits 'unhandledRejection' after the microtasks. Guards M7-5b.
// The microtasks run when the call into js returns, so the events of one step are checked in the next one.
const { puerts, test, step, eq, assert, note, observe, run } = require('./framework');
const state = { got: [], warned: [], errored: [] };

function listener(reason, promise) {
    state.got.push({ reason, promise });
}

test('bootstrap', () => {
    observe('__tgjsSetPromiseRejectCallback after bootstrap', () => typeof globalThis.__tgjsSetPromiseRejectCallback);
    observe('puerts.on', () => typeof puerts.on);
});

test('reject', () => {
    puerts.on('unhandledRejection', listener);

    state.errorReason = new Error('unhandled error');
    state.errorPromise = Promise.reject(state.errorReason);

    state.stringPromise = Promise.reject('a string');
    state.undefinedPromise = Promise.reject();

    state.asyncPromise = (async () => {
        throw new TypeError('in async');
    })();

    // handled before the microtasks run: reported then cancelled
    Promise.reject(new Error('handled synchronously')).catch(() => {});

    // handled in a microtask: still before the report
    const late = Promise.reject(new Error('handled in a microtask'));
    Promise.resolve().then(() => late.catch(() => {}));

    // a then without a rejection handler: the derived promise is the unhandled one
    state.derivedPromise = Promise.reject(new Error('derived')).then(() => {});

    eq(state.got.length, 0, 'not reported synchronously');
});

test('settle twice', () => {
    // the events after a promise is settled are logged by console.error in promises.js, captured here
    const saved = console.error;
    console.error = (...args) => state.errored.push(String(args[0]));
    try {
        new Promise((resolve, reject) => {
            resolve(1);
            reject(new Error('reject after resolved'));
        });
        new Promise((resolve) => {
            resolve(1);
            resolve(2);
        });
    } finally {
        console.error = saved;
    }
    note('events of settle twice', state.errored);
});

step(() => {
    test('reported', () => {
        const reasons = state.got.map((x) => (x.reason instanceof Error ? `${x.reason.name}: ${x.reason.message}` : x.reason));
        note('reasons', reasons);
        const byPromise = new Map(state.got.map((x) => [x.promise, x.reason]));
        assert(byPromise.get(state.errorPromise) === state.errorReason, 'reason and promise of Promise.reject(error)');
        eq(byPromise.get(state.stringPromise), 'a string', 'string reason');
        assert(byPromise.has(state.undefinedPromise), 'undefined reason is reported');
        eq(byPromise.get(state.undefinedPromise), undefined, 'undefined reason');
        assert(byPromise.has(state.asyncPromise), 'async function');
        assert(byPromise.has(state.derivedPromise), 'derived promise');
        eq(state.got.length, 5, 'handled rejections are not reported');
    });

    test('handled after report', () => {
        // a handler added after the report does not report again
        state.count = state.got.length;
        state.errorPromise.catch(() => {});
        state.stringPromise.catch(() => {});
    });

    test('no listener', () => {
        puerts.off('unhandledRejection', listener);
        state.savedWarn = console.warn;
        console.warn = (...args) => state.warned.push(args.slice(0, 2).map(String));
        Promise.reject(new Error('no listener'));
        Promise.reject(42);
    });

    step(() => {
        test('after off', () => {
            console.warn = state.savedWarn;
            eq(state.got.length, state.count, 'removed listener not called');
            note('warnings without listener', state.warned);
        });

        test('listener again', () => {
            puerts.on('unhandledRejection', listener);
            state.count = state.got.length;
            state.again = Promise.reject(new Error('again'));
        });

        step(() => {
            test('reported again', () => {
                eq(state.got.length, state.count + 1);
                assert(state.got[state.got.length - 1].promise === state.again, 'the last one');
                puerts.off('unhandledRejection', listener);
            });
        });
    });
});

run();
