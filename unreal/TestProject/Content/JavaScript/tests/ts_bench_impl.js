'use strict';
// the js module of the ts generated class used by tests/bench.js
const UE = require('ue');

class TsBenchImpl extends UE.PuertsTestTsTarget {
    Constructor() {}
    ImplEvent(v) {
        return 1;
    }
    NativeEvent(s) {
        return s;
    }
}

exports.default = TsBenchImpl;
