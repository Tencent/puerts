'use strict';
// FJsEnv: puerts/module_node.js (the node style resolution) and blueprint.mixin are there by default
const { puerts, test, eq, observe, run } = require('./framework.js');

const D = './module_node_data/';

test('mixin', () => {
    eq(typeof puerts.blueprint.mixin, 'function');
    eq(typeof puerts.blueprint.unmixin, 'function');
});

test('node resolution', () => {
    observe('without extension', () => require(D + 'noext', true));
    observe('json without extension', () => require(D + 'data', true).answer);
    observe('directory index', () => require(D + 'dir_index', true));
    observe('package main', () => require(D + 'pkg_cjs', true));
    observe('bare names', () => require(D + 'sub/deep.js', true));
    observe('import package', () => require(D + 'esm_pkg.mjs', true).result);
});

run();
