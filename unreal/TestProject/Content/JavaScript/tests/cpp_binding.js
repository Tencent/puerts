'use strict';
// Template (static) binding, registered in PuertsTestCppBinding.cpp. Guards M1 (registry / PesapiBackend switch).
const { UE, test, step, eq, near, assert, note, observe, catchError, run } = require('./framework');
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

test('std::function ref params', () => {
    const { $unref, $set } = puerts;
    const ret = C.CallRefCallback((obj, arr, i, s) => {
        eq([obj.X, obj.Y], [1, 2]);
        eq([arr.Num(), arr.Get(0)], [3, 1]);
        eq($unref(i), 5);
        eq($unref(s), 's');
        obj.X = 7;
        arr.Add(4);
        $set(i, 55);
        $set(s, 'ss');
    });
    eq(ret, 'obj=(7,2),arr=1|2|3|4,i=55,s=ss,copies=0,leaked=0');
    eq(C.CallRefFunc((i) => {
        const v = $unref(i);
        $set(i, v + 4);
        return v;
    }), 3 * 100 + 7);
});

test('builtin FVector binding', () => {
    // UE.Vector is backed by the plugin's template binding (ScriptEnv/Private/Gen/FVector_Wrap.cpp)
    const v = new UE.Vector(3, 4, 0);
    eq(v.Size(), 5);
    observe('Vector.ToString', () => v.ToString());
    v.Set(1, 2, 3);
    eq([v.X, v.Y, v.Z], [1, 2, 3]);
    const n = new UE.Vector(0, 0, 10);
    eq(n.Normalize(), true);
    near(n.Z, 1);
    const p = new UE.Vector(1, 2, 3).Projection();
    near(p.X, 1 / 3);
    near(p.Y, 2 / 3);
    eq(p.Z, 1);
    const z = UE.Vector.ZeroVector;
    eq([z.X, z.Y, z.Z], [0, 0, 0]);
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
