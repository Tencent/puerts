const a = require('./cycle_a.js');
exports.name = 'b';
exports.sawA = a.name;
