'use strict';
// the module loader of the backend (PapiV8ModuleLoader), the require of every module since it replaces modular.js (M7-2)
const { test, step, eq, assert, note, observe, catchError, normalizePath, run } = require('./framework');

const D = './module_loader_data/';

function req(spec) {
    return require(D + spec);
}

// an esm evaluated synchronously (require semantics), the dynamic import is checked in the next step
function imp(spec) {
    return require(D + spec);
}

function slash(s) {
    return s.replace(/\\/g, '/');
}

puerts.registerBuildinModule('ml_builtin', { v: 7 });

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
    eq(require('ml_builtin').v, 7);
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
    note('bad specifier', catchError(() => require(1)));
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
    eq(puerts.forceReload(url), true);
    const second = req('reload');
    assert(second !== first, 'reloaded');
    eq(second.n, first.n + 1);
    eq(puerts.forceReload('not/loaded.js'), false);
    eq(puerts.getModuleByUrl(url).exports === second, true, 'getModuleByUrl');
    eq(puerts.getModuleByUrl('not/loaded.js'), undefined);
});

test('bom', () => {
    eq(req('bom'), 'bom');
});

// hot reload (puerts/hot_reload.js) goes through the in-process inspector session of the backend: started here, checked in
// the next step; quickjs has no inspector, so no hot reload there
const hotReload = { state: 'pending' };
const hasHotReload = !isQuickJS();

if (hasHotReload) test('hot reload start', () => {
    const m = req('hot_reload');
    eq(m.get(), 1);
    hotReload.module = m;
    const source = 'module.exports = { get() { return 1; }, url: __filename };\n';
    puerts.__reload('hot_reload', m.url, source.replace('return 1', 'return 2')).then(
        () => {
            hotReload.state = 'fulfilled';
        },
        (e) => {
            hotReload.state = `rejected: ${e}`;
        }
    );
});

test('dumpStatisticsLog', () => {
    dumpStatisticsLog();
});

// dynamic import: started in the first step, checked in the next one (timers fire and microtasks run in between)
const dyn = Object.create(null);

function dynImport(key, spec) {
    dyn[key] = { state: 'pending' };
    import(spec).then(
        (ns) => {
            dyn[key] = { state: 'fulfilled', ns };
        },
        (e) => {
            dyn[key] = { state: 'rejected', error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
        }
    );
}

function settled(key) {
    const r = dyn[key];
    assert(r.state === 'fulfilled', `${key}: ${r.state} ${r.error || ''}`);
    return r.ns;
}

function rejected(key) {
    const r = dyn[key];
    return r.state === 'rejected' ? normalizePath(r.error) : `<${r.state}>`;
}

test('dynamic import start', () => {
    dynImport('esm', D + 'esm_main.mjs');
    dynImport('esm again', D + 'esm_main.mjs');
    dynImport('cjs', D + 'cjs_c.cjs');
    dynImport('json', D + 'data.json');
    dynImport('builtin', 'ml_builtin');
    dynImport('tla', D + 'tla_ok.mjs');
    dynImport('tla timer', D + 'tla_timer.mjs');
    dynImport('meta', D + 'meta.mjs');
    dynImport('nested', D + 'dyn.mjs');
    dynImport('missing', D + 'not_exist_xyz.mjs');
    dynImport('dep missing', D + 'esm_missing.mjs');
    dynImport('syntax error', D + 'syntax_err.mjs');
    eq(dyn.esm.state, 'pending', 'settled asynchronously');
});

step(() => {
    test('dynamic import', () => {
        const ns = settled('esm');
        observe('dynamic esm result', () => ns.result);
        assert(settled('esm again') === ns, 'module cache');
        assert(imp('esm_main.mjs') === ns, 'shared with require');
        const cjs = settled('cjs');
        assert(cjs.default === req('cjs_c.cjs'), 'cjs default');
        eq(cjs.name, 'c');
        eq(settled('json').answer, 42);
        eq(settled('builtin').v, 7);
        eq(settled('tla').value, 5);
        eq(settled('tla timer').value, 1, 'top-level await of a timer');
        eq(settled('nested').dep.x, 1, 'dynamic import in esm');
        assert(settled('nested').dep === imp('esm_dep.mjs'), 'nested shared');
    });

    test('import.meta', () => {
        const m = settled('meta');
        eq(slash(m.url).endsWith('tests/module_loader_data/meta.mjs'), true, 'url');
        eq(slash(m.resolved).endsWith('tests/module_loader_data/esm_dep.mjs'), true, 'resolve');
        eq(m.builtin, 'ml_builtin');
        note('import.meta.resolve missing', normalizePath(m.resolveMissing));
    });

    test('dynamic import errors', () => {
        note('dynamic import missing', rejected('missing'));
        note('dynamic import dep missing', rejected('dep missing'));
        note('dynamic import syntax error', rejected('syntax error'));
    });

    if (hasHotReload) test('hot reload', () => {
        eq(hotReload.state, 'fulfilled');
        eq(hotReload.module.get(), 2, 'function replaced by Debugger.setScriptSource');
    });
});

run();
