'use strict';
exports.name = 'a';
const b = require('./cycle_b');
exports.peer = b.name;
