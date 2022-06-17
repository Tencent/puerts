var global = global || globalThis || (function () { return this; }());

global.csharp = (typeof puertsRequire == 'undefined' ? require : puertsRequire)('csharp')
global.puerts = (typeof puertsRequire == 'undefined' ? require : puertsRequire)('puerts')