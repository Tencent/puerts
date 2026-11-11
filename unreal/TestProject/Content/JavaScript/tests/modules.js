'use strict';
const { UE, puerts, test, step, eq, assert, note, observe, catchError, run } = require('./framework.js');

test('commonjs require', () => {
    const a = require('./modules_data/mod_a.js', true);
    eq(a.value, 1);
    eq(a.fromB, 2);
    assert(require('./modules_data/mod_a.js', true) === a, 'module cache');
    eq(a.filename.replace(/\\/g, '/').endsWith('tests/modules_data/mod_a.js'), true, '__filename');
});

test('lazy require', () => {
    globalThis.__lazyLoaded = 0;
    const lazy = require('./modules_data/lazy.js');
    eq(globalThis.__lazyLoaded, 0, 'not loaded before used');
    eq(lazy.__esModule, true, '__esModule before loaded');
    eq(lazy.value, 3);
    eq(globalThis.__lazyLoaded, 1, 'loaded on the first use');
    eq(lazy.value, 3);
    eq(require('./modules_data/lazy.js').value, 3);
    eq(globalThis.__lazyLoaded, 1, 'loaded once');
    note('set a lazy module', catchError(() => {
        require('./modules_data/mod_b.js').value = 1;
    }));
    note('lazy missing', catchError(() => require('./modules_data/not_exist_xyz.js')));
    note('lazy missing used', catchError(() => require('./modules_data/not_exist_xyz.js').value));
});

test('cyclic require', () => {
    const c = require('./modules_data/cycle_a.js', true);
    eq(c.name, 'a');
    eq(c.peer, 'b');
});

test('json module', () => {
    observe('require json', () => require('./modules_data/data.json').answer);
});

test('builtin modules', () => {
    assert(require('ue') === UE, 'ue');
    assert(require('puerts') === puerts, 'puerts');
    assert(require('ue', true) === UE, 'ue immediate');
    observe('cpp module typeof', () => typeof require('cpp'));
});

test('esm', () => {
    observe('require mjs', () => require('./modules_data/esm_mod.mjs', true).value);
    observe('require mjs default', () => require('./modules_data/esm_mod.mjs').default());
    observe('dynamic import type', () => {
        const p = import('./modules_data/esm_mod.mjs');
        p.catch(() => {});
        return typeof p.then;
    });
});

test('file encodings', () => {
    observe('utf8 bom', () => require('./modules_data/bom_utf8.js').text);
    observe('utf8 bom length', () => require('./modules_data/bom_utf8.js').len);
    observe('utf16 bom', () => require('./modules_data/bom_utf16.js').text);
    observe('no bom', () => require('./modules_data/no_bom.js').text);
});

test('loader errors', () => {
    note('require missing', catchError(() => require('./modules_data/not_exist_xyz.js', true)));
    note('require missing bare', catchError(() => require('not_exist_module_xyz', true)));
    // the extension must be written
    note('require without extension', catchError(() => require('./modules_data/mod_b', true)));
    note('bad specifier', catchError(() => require(1)));
});

test('module cache', () => {
    const M = puerts.module;
    const b = require('./modules_data/mod_b.js', true);
    eq(M.hasModuleCache('tests/modules_data/mod_b.js'), true, 'cached by path');
    eq(M.deleteModuleCache('tests/modules_data/mod_b.js'), true, 'deleted');
    eq(M.hasModuleCache('tests/modules_data/mod_b.js'), false, 'not cached');
    assert(require('./modules_data/mod_b.js', true) !== b, 'loaded again');
    eq(require('./modules_data/strong.js', true).value, 'strong');
    // the modules are cached weakly by default (strongly on quickjs), they are released if no one refers to them (checked
    // after a full gc)
    eq(require('./modules_data/weak.js', true).value, 'weak');
    eq(M.hasModuleCache('tests/modules_data/weak.js'), true, 'weak cached');
    const genRequire = puerts.genRequire('tests/modules_data');
    eq(genRequire('mod_b.js', true).value, 2, 'genRequire');
    eq(M.createRequire('tests/modules_data/mod_a.js')('./mod_b.js', true).value, 2, 'createRequire');
    observe('module api', () => Object.keys(M).sort());
});

step(() => {
    test('module gc', () => {
        const M = puerts.module;
        M.gcModuleCache();
        observe('weak cached after gc', () => M.hasModuleCache('tests/modules_data/weak.js'));
        observe('strong cached after gc', () => M.hasModuleCache('tests/modules_data/strong.js'));
    });
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

test('scriptEnv', () => {
    // the methods of the env, puerts.xxx are bound to them
    assert(scriptEnv.loadUEType('PuertsTestObject') === UE.PuertsTestObject, 'loadUEType');
    assert(scriptEnv.loadCPPType('FPuertsTestCppClass') === require('cpp').FPuertsTestCppClass, 'loadCPPType');
    observe('isQuickJS', () => typeof scriptEnv.isQuickJS());
    observe('dumpStatisticsLog', () => scriptEnv.dumpStatisticsLog());
    note('no args', catchError(() => scriptEnv.loadUEType()));
    note('wrong receiver', catchError(() => scriptEnv.loadUEType.call({}, 'PuertsTestObject')));
    observe('host globals removed', () => ['__tgjsLog', '__tgjsNewObject', '__tgjsMixin', '__tgjsRegisterTickHandler',
        'dumpStatisticsLog', 'isQuickJS'].filter(k => k in globalThis));
});

test('host functions', () => {
    observe('getFNameString', () => puerts.getFNameString('none'));
    observe('host function globals', () => ['__tgjsNewStruct', '__tgjsMakeWeakObjectPtr', '__tgjsFNameToArrayBuffer',
        '__tgjsNewContainer'].map(k => typeof globalThis[k]));
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
    observe('Promise', () => typeof Promise);
    observe('WeakRef', () => typeof WeakRef);
    observe('FinalizationRegistry', () => typeof FinalizationRegistry);
});

run();
