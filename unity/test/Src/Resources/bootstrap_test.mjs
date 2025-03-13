import { createRequire } from 'puerts/module.mjs';

const require = createRequire('');

const lm = require('./lazymodule.cjs');

globalThis.lazyss = "boot>>";
lm.foo();
