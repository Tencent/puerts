'use strict';
const { UE, puerts, test, eq, assert, observe, run } = require('./framework');
const { $ref, $unref } = puerts;

const obj = new UE.PuertsTestObject();

test('member call', () => {
    eq(obj.Add(1, 2), 3);
    eq(obj.Concat('a', 'b'), 'ab');
});

test('static call', () => {
    eq(UE.PuertsTestObject.StaticAdd(4, 5), 9);
    observe('static via instance', () => typeof obj.StaticAdd);
});

test('return struct', () => {
    const s = obj.MakeStruct(3, 'x');
    eq(s.X, 3);
    eq(s.S, 'x');
    eq(s.Arr.Num(), 3);
    eq(s.Arr.Get(2), 5);
});

test('struct param', () => {
    const s = new UE.PuertsTestStruct();
    s.X = 1;
    s.Arr.Add(2);
    s.Arr.Add(3);
    eq(obj.StructSum(s), 6);
    observe('struct param from plain object', () => obj.StructSum({ X: 10, S: '', Arr: undefined }));
});

test('out params', () => {
    const i = $ref(0);
    const s = $ref('');
    const st = $ref(new UE.PuertsTestStruct());
    obj.OutParams(i, s, st);
    eq($unref(i), 7);
    eq($unref(s), 'out');
    eq($unref(st).X, 9);
    eq($unref(st).S, 'outstruct');
    observe('out struct ref undefined', () => {
        const u = $ref(undefined);
        obj.OutParams($ref(0), $ref(''), u);
        return $unref(u) && $unref(u).X;
    });
});

test('ref param', () => {
    const v = $ref(41);
    obj.IncRef(v);
    eq($unref(v), 42);
});

test('default param', () => {
    eq(obj.DefaultParam(3, 4), 304);
    observe('default param omitted', () => obj.DefaultParam(3));
});

test('object return identity', () => {
    assert(obj.GetSelf() === obj, 'GetSelf returns same js object');
    const c = obj.CreateChild();
    assert(c instanceof UE.PuertsTestObject, 'child type');
    assert(c !== obj.CreateChild(), 'distinct children');
    eq(c.GetOuter() === obj, true, 'outer');
});

test('array param', () => {
    const a = UE.NewArray(UE.BuiltinInt);
    a.Add(1);
    a.Add(2);
    a.Add(3);
    eq(obj.SumArray(a), 6);
    const direct = UE.NewArray(UE.BuiltinInt);
    obj.FillArray(direct, 4);
    observe('non-const ref array passed directly, Num after', () => direct.Num());
    const out = $ref(UE.NewArray(UE.BuiltinInt));
    obj.FillArray(out, 4);
    const filled = $unref(out);
    eq(filled.Num(), 4);
    eq(filled.Get(3), 3);
});

test('map return', () => {
    const m = obj.MakeMap(3);
    eq(m.Num(), 3);
    eq(m.Get('k2'), 2);
});

test('enum param/return', () => {
    eq(obj.NextEnum(UE.EPuertsTestEnum.A), UE.EPuertsTestEnum.B);
    eq(obj.NextEnum(UE.EPuertsTestEnum.B), UE.EPuertsTestEnum.C);
});

test('text return', () => {
    eq(obj.MakeText('t'), 't');
});

test('native event default', () => {
    eq(obj.CallNativeEvent('a'), 'native:a');
    observe('impl event without override', () => obj.CallImplEvent(1));
});

test('function shape', () => {
    observe('method typeof', () => typeof obj.Add);
    observe('method length', () => obj.Add.length);
    observe('method name', () => obj.Add.name);
    observe('method own property', () => Object.prototype.hasOwnProperty.call(obj, 'Add'));
});

test('UE builtin', () => {
    const kismet = UE.KismetMathLibrary;
    eq(kismet.Add_IntInt(2, 3), 5);
    const pkg = UE.GameplayStatics !== undefined;
    observe('GameplayStatics available', () => pkg);
});

run();
