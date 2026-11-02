'use strict';
const a = require('./cycle_a');
exports.name = 'b';
exports.peerSeenEarly = a.name;
