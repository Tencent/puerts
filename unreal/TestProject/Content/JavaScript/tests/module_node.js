'use strict';
// puerts/module_node.js: the optional node style resolution (not loaded by default)
const { puerts, test, eq, assert, note, observe, catchError, run } = require('./framework.js');

const D = './module_node_data/';

test('default rule', () => {
    note('without extension before loaded', catchError(() => require(D + 'noext', true)));
});

test('load', () => {
    const node = require('../puerts/module_node.js', true);
    eq(typeof node.resolve, 'function');
    eq(typeof node.clearCache, 'function');
});

test('resolve', () => {
    observe('without extension', () => require(D + 'noext', true));
    observe('with extension', () => require(D + 'noext.js', true));
    observe('json without extension', () => require(D + 'data', true).answer);
    observe('directory index', () => require(D + 'dir_index', true));
    observe('package main', () => require(D + 'pkg_cjs', true));
    observe('package exports', () => require(D + 'exports_pkg', true));
    observe('bare names', () => require(D + 'sub/deep.js', true));
    observe('lazy', () => require(D + 'noext').length);
    assert(require('puerts') === puerts, 'builtin first');
    note('missing', catchError(() => require(D + 'not_exist_xyz', true)));
    note('missing bare', catchError(() => require('not_exist_module_xyz', true)));
});

test('import', () => {
    observe('import package', () => require(D + 'esm_pkg.mjs', true).result);
});

run();
