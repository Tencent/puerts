'use strict';
const { UE, test, eq, assert, note, observe, catchError, run } = require('./framework.js');

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
    const bools = UE.NewArray(UE.BuiltinBool);
    bools.Add(true);
    bools.Add(false);
    eq([bools.Get(0), bools.Get(1)], [true, false]);
    const strs = UE.NewArray(UE.BuiltinString);
    strs.Add('aaa');
    eq(strs.Get(0), 'aaa');
    const vecs = UE.NewArray(UE.Vector);
    vecs.Add(new UE.Vector(1, 2, 3));
    eq(vecs.Get(0).Z, 3);
    const strSet = UE.NewSet(UE.BuiltinString);
    strSet.Add('John');
    eq([strSet.Contains('John'), strSet.Contains('Che')], [true, false]);
});

test('set index semantics', () => {
    const s = UE.NewSet(UE.BuiltinInt);
    [0, 1, 2].forEach((v) => s.Add(v));
    const idx = [0, 1, 2].map((v) => s.FindIndex(v));
    idx.forEach((i, v) => eq(s.Get(i), v));
    eq(s.FindIndex(-1), -1);
    const maxIndex = s.GetMaxIndex();
    // TSet.IsValidIndex returns a boolean like TArray/TMap
    observe('set IsValidIndex result', () => s.IsValidIndex(idx[0]));
    const valid = (i) => !!s.IsValidIndex(i);
    eq([valid(-1), valid(maxIndex)], [false, false]);
    s.RemoveAt(idx[1]);
    eq([s.Num(), s.GetMaxIndex(), valid(idx[1]), valid(idx[0])], [2, maxIndex, false, true], 'RemoveAt leaves a hole');
    s.RemoveAt(idx[0]);
    s.RemoveAt(idx[2]);
    eq([s.Num(), s.GetMaxIndex()], [0, maxIndex]);
    s.Empty();
    eq(s.GetMaxIndex(), 0, 'only Empty resets max index');
    observe('set Get removed index', () => s.Get(idx[0]));
});

test('map index semantics', () => {
    const m = UE.NewMap(UE.BuiltinInt, UE.BuiltinString);
    m.Add(0, 'zero');
    m.Add(5, 'five');
    m.Add(10, 'ten');
    m.Add(5, 'FIVE');
    eq([m.Num(), m.Get(5)], [3, 'FIVE'], 'Add overwrites');
    eq(m.GetMaxIndex(), 3);
    eq([m.GetKey(0), m.GetKey(1), m.GetKey(2)], [0, 5, 10]);
    m.Remove(5);
    eq([m.Num(), m.GetMaxIndex()], [2, 3]);
    eq([m.IsValidIndex(0), m.IsValidIndex(1), m.IsValidIndex(2)], [true, false, true]);
    m.Remove(0);
    m.Remove(10);
    eq([m.Num(), m.GetMaxIndex()], [0, 3]);
    m.Empty();
    eq(m.GetMaxIndex(), 0, 'only Empty resets max index');
    observe('map Remove missing key', () => m.Remove(42));
    observe('map GetKey invalid index', () => m.GetKey(0));
});

test('FString key hash is case insensitive', () => {
    const s = UE.NewSet(UE.BuiltinString);
    ['One', 'Two', 'one', 'TWO'].forEach((v) => s.Add(v));
    eq([s.Num(), s.Contains('oNe')], [2, true]);
    const m = UE.NewMap(UE.BuiltinString, UE.BuiltinString);
    m.Add('One', 'one_one');
    eq(m.Get('ONE'), 'one_one');
    m.Add('one', 'x');
    eq([m.Num(), m.Get('One')], [1, 'x']);
    observe('map key casing after re-add', () => m.GetKey(0));
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

test('new container bad types', () => {
    note('NewArray unknown builtin', catchError(() => UE.NewArray(9999)));
    note('NewSet unknown builtin', catchError(() => UE.NewSet(-1)));
    note('NewMap unknown value type', catchError(() => UE.NewMap(UE.BuiltinInt, 9999)));
    note('NewArray of non type', catchError(() => UE.NewArray({ StaticClass: () => 1 })));
    observe('NewArray of struct', () => UE.NewArray(UE.PuertsTestStruct).Num());
    observe('NewSet of object', () => UE.NewSet(UE.PuertsTestObject).Num());
});

test('blueprint.tojs', () => {
    const tojs = require('puerts').blueprint.tojs;
    assert(tojs(UE.PuertsTestObject.StaticClass()) === UE.PuertsTestObject, 'class');
    assert(tojs(UE.PuertsTestStruct.StaticClass()) === UE.PuertsTestStruct, 'struct');
    observe('enum tojs typeof', () => typeof tojs(UE.Enum.Load('/Script/PuertsTest.EPuertsTestEnum')));
    note('tojs no args', catchError(() => tojs()));
    note('tojs number', catchError(() => tojs(1)));
    note('tojs plain object', catchError(() => tojs({})));
    note('tojs non field', catchError(() => tojs(new UE.PuertsTestObject())));
});

run();
