'use strict';
const b = require('./mod_b.js');
exports.value = 1;
exports.fromB = b.value;
exports.filename = __filename;
