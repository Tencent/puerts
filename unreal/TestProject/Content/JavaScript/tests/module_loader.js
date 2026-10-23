'use strict';
// the module loader of the backend (PapiV8ModuleLoader), driven by the temporary entry __puerModuleLoaderTest until it
// replaces modular.js
const { test, eq, assert, note, observe, catchError, run } = require('./framework');

const loader = globalThis.__puerModuleLoaderTest;
const D = 'tests/module_loader_data/';

function req(spec) {
    return loader.execute(D + spec, '', false);
}

function imp(spec) {
    return loader.execute(D + spec, '', true);
}

function slash(s) {
    return s.replace(/\\/g, '/');
}

loader.registerBuiltin('ml_builtin', { v: 7 });

test('cjs', () => {
    const a = req('cjs_a');
    eq(a.name, 'a');
    eq(a.b.name, 'b');
    eq(a.b.count, 1);
    eq(a.selfIsPartial, true, 'self require during execution');
    assert(req('cjs_a') === a, 'module cache');
    assert(req('cjs_b') === a.b, 'shared by url');
    assert(req('./cjs_b') === a.b, 'path normalized');
    eq(slash(a.filename).endsWith('tests/module_loader_data/cjs_a.js'), true, '__filename');
    eq(slash(a.dirname).endsWith('tests/module_loader_data'), true, '__dirname');
    eq(a.thisIsExports, true, 'this');
});

test('cjs cycle', () => {
    const c = req('cycle_a');
    eq(c.name, 'a');
    eq(c.peer, 'b');
    eq(c.peerSawA, 'a');
});

test('esm', () => {
    const ns = imp('esm_main.mjs');
    observe('esm result', () => ns.result);
    observe('esm namespace keys', () => Object.keys(ns));
    assert(imp('esm_main.mjs') === ns, 'module cache');
    assert(imp('esm_dep.mjs') === ns.depNs, 'shared by url');
});

test('cjs require esm', () => {
    const r = req('req_esm');
    eq(r.x, 1);
    eq(r.d, 'dep-default');
});

test('json', () => {
    const j = req('data.json');
    eq(j.answer, 42);
    assert(req('data.json') === j, 'module cache');
});

test('builtin module', () => {
    eq(loader.execute('ml_builtin', '', false).v, 7);
    eq(loader.execute('ml_builtin', '', true).v, 7);
});

test('retry after failure', () => {
    globalThis.__mlFlaky = true;
    note('flaky esm', catchError(() => imp('flaky.mjs')));
    note('flaky esm parent', catchError(() => imp('flaky_parent.mjs')));
    note('flaky cjs', catchError(() => req('flaky_cjs')));
    globalThis.__mlFlaky = false;
    eq(imp('flaky.mjs').ok, true);
    eq(imp('flaky_parent.mjs').ok, true);
    eq(req('flaky_cjs'), 'ok');
});

test('top-level await', () => {
    eq(imp('tla_ok.mjs').value, 5);
    note('tla timer', catchError(() => imp('tla_timer.mjs')));
});

test('errors', () => {
    note('require missing', catchError(() => req('not_exist_xyz')));
    note('import missing', catchError(() => imp('not_exist_xyz.mjs')));
    note('esm import missing', catchError(() => imp('esm_missing.mjs')));
    note('esm syntax error', catchError(() => imp('syntax_err.mjs')));
    note('esm syntax error again', catchError(() => imp('syntax_err.mjs')));
    note('cjs throws', catchError(() => req('throws')));
    note('bad specifier', catchError(() => loader.execute(1, '', false)));
});

test('package.json', () => {
    observe('require cjs package', () => req('pkg_cjs'));
    observe('import cjs package', () => imp('esm_pkg.mjs').result);
    observe('require esm package', () => {
        const ns = req('pkg_esm');
        return [ns.name, ns.default];
    });
    observe('import esm package', () => imp('esm_pkg_esm.mjs').result);
    note('require esm package without require entry', catchError(() => req('pkg_esm_noreq')));
});

test('forceReload', () => {
    const first = req('reload');
    assert(req('reload') === first, 'cached');
    const url = first.url;
    eq(loader.forceReload(url), true);
    const second = req('reload');
    assert(second !== first, 'reloaded');
    eq(second.n, first.n + 1);
    eq(loader.forceReload('not/loaded.js'), false);
    eq(loader.getModuleByUrl(url).exports === second, true, 'getModuleByUrl');
    eq(loader.getModuleByUrl('not/loaded.js'), undefined);
});

test('bom', () => {
    eq(req('bom'), 'bom');
});

run();
