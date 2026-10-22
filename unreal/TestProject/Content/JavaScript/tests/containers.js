'use strict';
const { UE, test, eq, assert, observe, run } = require('./framework');

const obj = new UE.PuertsTestObject();

test('array property', () => {
    const a = obj.IntArray;
    eq(a.Num(), 0);
    a.Add(1);
    a.Add(2);
    a.Add(3);
    eq(obj.IntArray.Num(), 3, 'property returns a view, not a copy');
    eq(a.Get(1), 2);
    a.Set(1, 20);
    eq(obj.IntArray.Get(1), 20);
    eq(a.Contains(20), true);
    eq(a.FindIndex(3), 2);
    a.RemoveAt(0);
    eq(a.Num(), 2);
    eq(a.IsValidIndex(5), false);
    a.Empty();
    eq(a.Num(), 0);
});

test('array of string', () => {
    const a = obj.StringArray;
    a.Add('x');
    a.Add('y');
    eq(a.Get(1), 'y');
});

test('array of struct', () => {
    const a = obj.StructArray;
    const s = new UE.PuertsTestStruct();
    s.X = 5;
    a.Add(s);
    eq(a.Get(0).X, 5);
    observe('array struct element modify', () => {
        a.Get(0).X = 6;
        return a.Get(0).X;
    });
});

test('array out of range', () => {
    observe('array get out of range', () => obj.IntArray.Get(100));
});

test('array assign', () => {
    const b = UE.NewArray(UE.BuiltinInt);
    b.Add(7);
    obj.IntArray = b;
    eq(obj.IntArray.Num(), 1);
    b.Add(8);
    eq(obj.IntArray.Num(), 1, 'assignment copies');
});

test('set', () => {
    const s = obj.StringSet;
    s.Add('a');
    s.Add('b');
    s.Add('a');
    eq(s.Num(), 2);
    eq(s.Contains('b'), true);
    observe('set has Remove', () => typeof s.Remove);
    s.RemoveAt(s.FindIndex('b'));
    eq(s.Contains('b'), false);
    observe('set Get(0)', () => s.Get(s.FindIndex('a')));
});

test('map', () => {
    const m = obj.StringIntMap;
    m.Add('one', 1);
    m.Add('two', 2);
    eq(m.Num(), 2);
    eq(m.Get('two'), 2);
    m.Set('two', 22);
    eq(m.Get('two'), 22);
    observe('map get missing', () => m.Get('missing'));
    m.Remove('one');
    eq(m.Num(), 1);
    const keys = [];
    for (let i = m.GetMaxIndex() - 1; i >= 0; --i) {
        if (m.IsValidIndex(i)) keys.push(m.GetKey(i));
    }
    eq(keys, ['two']);
});

test('new containers', () => {
    const m = UE.NewMap(UE.BuiltinString, UE.PuertsTestStruct);
    const s = new UE.PuertsTestStruct();
    s.X = 1;
    m.Add('a', s);
    eq(m.Get('a').X, 1);
    const set = UE.NewSet(UE.BuiltinInt);
    set.Add(3);
    eq(set.Num(), 1);
    const objs = UE.NewArray(UE.PuertsTestObject);
    objs.Add(obj);
    assert(objs.Get(0) === obj, 'object element identity');
});

test('iteration', () => {
    const a = UE.NewArray(UE.BuiltinInt);
    a.Add(1);
    a.Add(2);
    observe('array iterable', () => {
        const r = [];
        for (const v of a) r.push(v);
        return r;
    });
    const m = UE.NewMap(UE.BuiltinString, UE.BuiltinInt);
    m.Add('k', 1);
    observe('map iterable', () => {
        const r = [];
        for (const kv of m) r.push(kv);
        return r;
    });
});

test('container shape', () => {
    observe('array ctor', () => obj.IntArray.constructor.name);
    observe('array keys', () => Object.keys(obj.IntArray));
    observe('array typeof index', () => obj.IntArray[0]);
});

run();
