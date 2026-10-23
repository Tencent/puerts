'use strict';
// the js module of the ts generated class built by UPuertsTestTsTarget::CreateTsClass('tests/ts_class_impl'),
// shaped like the output of tsc for `export default class extends UE.PuertsTestTsTarget`
const UE = require('ue');

let ctorCount = 0;

class TsClassImpl extends UE.PuertsTestTsTarget {
    Constructor() {
        ++ctorCount;
        this.Base = 7;
        this.jsField = 'ctor';
    }
    ImplEvent(v) {
        if (v < 0) {
            throw new Error('tsclass boom');
        }
        return v * 2 + this.Base;
    }
    NativeEvent(s) {
        return 'ts:' + s + ':' + this.jsField;
    }
    Helper() {
        return 'helper';
    }
}

exports.default = TsClassImpl;
exports.ctorCount = () => ctorCount;
