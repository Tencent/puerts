const a = require('./cycle_a');
exports.name = 'b';
exports.sawA = a.name;
