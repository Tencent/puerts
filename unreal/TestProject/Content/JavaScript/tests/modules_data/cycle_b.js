'use strict';
const a = require('./cycle_a.js');
exports.name = 'b';
exports.peerSeenEarly = a.name;
