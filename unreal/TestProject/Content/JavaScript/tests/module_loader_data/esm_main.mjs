import d, { x } from './esm_dep.mjs';
import * as depNs from './esm_dep.mjs';
import cjs, { name, fn } from './cjs_c.cjs';
import data, { answer } from './data.json';
import builtin, { v } from 'ml_builtin';
export { depNs };
export const result = { x, d, cjsName: cjs.name, name, fnResult: fn(), answer, list: data.list, builtinV: builtin.v, v };
