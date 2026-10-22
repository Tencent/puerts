'use strict';
// Template (static) binding, registered in PuertsTestCppBinding.cpp. Guards M1 (registry / PesapiBackend switch).
const { UE, test, step, eq, assert, note, observe, catchError, run } = require('./framework');
const cpp = require('cpp');
const C = cpp.FPuertsTestCppClass;
const state = {};

test('constructors', () => {
    const a = new C();
    eq(a.X, 0);
    const b = new C(1, 2);
    eq(b.X, 1);
    eq(b.Y, 2);
});

test('property', () => {
    const a = new C(1, 2);
    a.X = 10;
    eq(a.X, 10);
});

test('method', () => {
    const a = new C(1, 2);
    eq(a.Add(3), 6);
    eq(a.Name(), 'cpp:1');
    eq(a.Describe('p'), 'p(1,2)');
    a.Noop();
});

test('overload', () => {
    const a = new C();
    eq(a.Over(3), 3);
    eq(a.Over(3, 4), 12);
    note('overload no match', catchError(() => a.Over('x')));
});

test('static', () => {
    eq(C.StaticMul(3, 4), 12);
});

test('ue type param', () => {
    const o = new UE.PuertsTestObject();
    o.IntValue = 33;
    eq(new C().ReadObject(o), 33);
    eq(new C().ReadObject(undefined), -1);
});

test('raw pointer identity', () => {
    const p1 = C.CreateRaw(1);
    const p2 = C.CreateRaw(2);
    observe('same raw pointer same js object', () => p1 === p2);
    eq(p2.X, 2);
});

test('shape', () => {
    observe('cpp class typeof', () => typeof C);
    observe('cpp instanceof', () => new C() instanceof C);
    observe('cpp own keys', () => Object.keys(new C()));
    observe('cpp ctor name', () => new C().constructor.name);
    note('wrong ctor args', catchError(() => new C('a', 'b')));
});

// runs after a full GC so garbage from the tests above does not skew the base count
step(() => {
    test('setup gc', () => {
        state.base = C.GetInstanceCount();
        for (let i = 0; i < 20; ++i) new C(i, i);
        state.kept = new C(5, 5);
        note('instances created', C.GetInstanceCount() - state.base);
    });
});

step(() => {
    test('js owned instances finalized', () => {
        note('instances alive after gc', C.GetInstanceCount() - state.base);
        eq(state.kept.X, 5);
    });
});

run();
