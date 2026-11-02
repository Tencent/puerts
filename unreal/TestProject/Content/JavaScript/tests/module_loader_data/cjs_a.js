exports.name = 'a';
exports.b = require('./cjs_b');
exports.selfIsPartial = require('./cjs_a') === exports;
exports.filename = __filename;
exports.dirname = __dirname;
exports.thisIsExports = this === exports;
