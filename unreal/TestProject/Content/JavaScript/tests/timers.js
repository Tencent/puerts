'use strict';
// setTimeout / setInterval / clearTimeout / clearInterval (puerts/timer.js, on the tick of the env). The runner waits
// a little and ticks between steps, so callbacks registered in one step fire before the next one.
const { test, step, eq, assert, note, observe, catchError, run } = require('./framework');
const state = { once: 0, interval: 0, cleared: 0, selfCleared: 0, afterThrow: 0, args: null, self: null };

test('register', () => {
    const id = setTimeout(() => {
        state.once++;
    }, 0);
    observe('timeout id type', () => typeof id);
    assert(id > 0, 'timer id is positive');
    eq(state.once, 0, 'callback is not called synchronously');

    state.intervalId = setInterval(() => {
        state.interval++;
    }, 0);
    assert(state.intervalId !== id, 'ids are unique');

    const cancelled = setTimeout(() => {
        state.cleared++;
    }, 0);
    clearTimeout(cancelled);

    const selfId = setInterval(() => {
        state.selfCleared++;
        clearInterval(selfId);
    }, 0);

    setTimeout(() => {
        throw new Error('error in timer');
    }, 0);
    setTimeout(() => {
        state.afterThrow++;
    }, 0);

    setTimeout(
        function (...args) {
            state.args = args.length;
            state.self = this === globalThis;
        },
        0,
        1,
        2
    );

    // a long delay, never fires during the test
    state.longId = setTimeout(() => {
        state.long = true;
    }, 1000000);
});

test('bad arguments', () => {
    note('setTimeout no args', catchError(() => setTimeout()));
    note('setTimeout string callback', catchError(() => setTimeout('1', 0)));
    note('setTimeout no delay', catchError(() => setTimeout(() => {})));
    note('setInterval string delay', catchError(() => setInterval(() => {}, '10')));
    note('clearTimeout undefined', catchError(() => clearTimeout(undefined)));
    note('clearTimeout null', catchError(() => clearTimeout(null)));
    note('clearTimeout unknown id', catchError(() => clearTimeout(123456789)));
    note('clearTimeout string', catchError(() => clearTimeout('1')));
});

step(() => {
    test('fired', () => {
        eq(state.once, 1, 'timeout fired once');
        assert(state.interval >= 1, 'interval fired');
        eq(state.cleared, 0, 'cleared timeout not fired');
        eq(state.selfCleared, 1, 'interval cleared in its callback');
        eq(state.afterThrow, 1, 'a throwing timer does not stop the others');
        note('extra args passed to callback', state.args);
        note('callback this is globalThis', state.self);
        eq(state.long, undefined, 'long timer not fired');
        state.intervalSnapshot = state.interval;
        clearInterval(state.intervalId);
        clearTimeout(state.longId);
    });
});

step(() => {
    test('cleared', () => {
        eq(state.once, 1, 'timeout does not repeat');
        eq(state.interval, state.intervalSnapshot, 'interval stopped after clearInterval');
        eq(state.selfCleared, 1);
    });
});

run();
