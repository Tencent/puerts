'use strict';
const { UE, puerts, test, eq, assert, note, observe, catchError, run } = require('./framework');

test('commonjs require', () => {
    const a = require('./modules_data/mod_a');
    eq(a.value, 1);
    eq(a.fromB, 2);
    assert(require('./modules_data/mod_a') === a, 'module cache');
    eq(a.filename.replace(/\\/g, '/').endsWith('tests/modules_data/mod_a.js'), true, '__filename');
});

test('cyclic require', () => {
    const c = require('./modules_data/cycle_a');
    eq(c.name, 'a');
    eq(c.peer, 'b');
});

test('json module', () => {
    observe('require json', () => require('./modules_data/data.json').answer);
});

test('builtin modules', () => {
    assert(require('ue') === UE, 'ue');
    assert(require('puerts') === puerts, 'puerts');
    observe('cpp module typeof', () => typeof require('cpp'));
});

test('esm', () => {
    note('require mjs', catchError(() => require('./modules_data/esm_mod.mjs')));
    observe('dynamic import type', () => {
        const p = import('./modules_data/esm_mod.mjs');
        p.catch(() => {});
        return typeof p.then;
    });
});

test('globals', () => {
    observe('setTimeout', () => typeof setTimeout);
    observe('setInterval', () => typeof setInterval);
    observe('console.log', () => typeof console.log);
    observe('puerts keys', () => Object.keys(puerts).sort());
    observe('globalThis.UE', () => globalThis.UE === UE);
    observe('TextEncoder', () => typeof TextEncoder);
    observe('Promise', () => typeof Promise);
    observe('WeakRef', () => typeof WeakRef);
    observe('FinalizationRegistry', () => typeof FinalizationRegistry);
});

run();
