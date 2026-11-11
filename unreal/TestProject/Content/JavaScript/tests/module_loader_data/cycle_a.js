exports.name = 'a';
const b = require('./cycle_b.js');
exports.peer = b.name;
exports.peerSawA = b.sawA;
