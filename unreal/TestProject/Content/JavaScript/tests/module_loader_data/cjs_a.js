exports.name = 'a';
exports.b = require('./cjs_b.js', true);
exports.selfIsPartial = require('./cjs_a.js', true) === exports;
exports.filename = __filename;
exports.dirname = __dirname;
exports.thisIsExports = this === exports;
