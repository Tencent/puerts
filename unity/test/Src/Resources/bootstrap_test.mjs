import { createRequire } from 'puerts/module.mjs';

const require = createRequire(import.meta.url);

const lm = require('./lazymodule.cjs');

globalThis.lazyss = "boot>>";
lm.foo();
