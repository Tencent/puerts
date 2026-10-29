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

test('file encodings', () => {
    observe('utf8 bom', () => require('./modules_data/bom_utf8').text);
    observe('utf8 bom length', () => require('./modules_data/bom_utf8').len);
    observe('utf16 bom', () => require('./modules_data/bom_utf16').text);
    observe('no bom', () => require('./modules_data/no_bom').text);
});

test('loader errors', () => {
    note('require missing', catchError(() => require('./modules_data/not_exist_xyz')));
    note('require missing bare', catchError(() => require('not_exist_module_xyz')));
});

test('loadUEType', () => {
    assert(puerts.loadUEType('PuertsTestObject') === UE.PuertsTestObject, 'class');
    assert(puerts.loadUEType('PuertsTestStruct') === UE.PuertsTestStruct, 'struct');
    observe('enum', () => typeof puerts.loadUEType('EPuertsTestEnum'));
    observe('by path', () => puerts.loadUEType('/Script/PuertsTest.PuertsTestObject') === UE.PuertsTestObject);
    note('missing type', catchError(() => puerts.loadUEType('NoSuchType_xyz')));
    note('no args', catchError(() => puerts.loadUEType()));
    note('number arg', catchError(() => puerts.loadUEType(1)));
    note('UE missing', catchError(() => UE.NoSuchType_xyz));
});

test('puerts.load errors', () => {
    // puerts.load expands the name per platform: dir\name.dll, dir/libname.dylib, dir/libname.so
    const dllName = (s) => s.replace(/([\\/])(?:lib)?(not_exist_addon_xyz)\.(?:dll|dylib|so)\b/g, '/$2<dll-ext>');
    note('number', catchError(() => puerts.load(1)));
    note('no args', catchError(() => puerts.load()));
    note('missing dll', dllName(catchError(() => puerts.load('not_exist_dir/not_exist_addon_xyz'))));
    note('missing dll again', dllName(catchError(() => puerts.load('not_exist_dir/not_exist_addon_xyz'))));
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
