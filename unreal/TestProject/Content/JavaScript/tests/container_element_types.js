'use strict';
// value conversion of each container element type: range, overflow wraparound, string encodings, reference types
const { UE, test, eq, assert, observe, run } = require('./framework');

const t = new UE.PuertsTestContainerElements();

const INT32_MAX = 2 ** 31 - 1;
const INT32_MIN = -(2 ** 31);
const UINT32_MAX = 2 ** 32 - 1;
const INT64_MAX = BigInt('0x7FFFFFFFFFFFFFFF');
const INT64_MIN = -INT64_MAX - 1n;
const UINT64_MAX = BigInt('0xFFFFFFFFFFFFFFFF');
const MAX_FLOAT = 3.402823466e38;

function roundTrip(arr, values) {
    arr.Empty();
    for (const v of values) arr.Add(v);
    eq(arr.Num(), values.length);
    const ret = [];
    for (let i = 0; i < arr.Num(); ++i) ret.push(arr.Get(i));
    return ret;
}

test('int32', () => {
    eq(roundTrip(t.Int32Array, [INT32_MAX, INT32_MIN, INT32_MAX + 1, INT32_MIN - 1]), [INT32_MAX, INT32_MIN, INT32_MIN, INT32_MAX]);
    observe('int32 MAX_SAFE_INTEGER, MIN_SAFE_INTEGER', () => roundTrip(t.Int32Array, [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]));
});

test('uint32', () => {
    eq(roundTrip(t.UInt32Array, [UINT32_MAX, 0, UINT32_MAX + 1, -1]), [UINT32_MAX, 0, 0, UINT32_MAX]);
    observe('uint32 MAX_SAFE_INTEGER, MIN_SAFE_INTEGER', () => roundTrip(t.UInt32Array, [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]));
});

test('int64', () => {
    const values = [BigInt(Number.MAX_SAFE_INTEGER), BigInt(Number.MIN_SAFE_INTEGER), INT64_MAX, INT64_MIN];
    eq(roundTrip(t.Int64Array, values), values);
    eq(roundTrip(t.Int64Array, [INT64_MAX + 1n, INT64_MIN - 1n]), [INT64_MIN, INT64_MAX]);
    observe('int64 element from number', () => roundTrip(t.Int64Array, [1, -2]));
});

test('uint64', () => {
    eq(roundTrip(t.UInt64Array, [UINT64_MAX, 0n]), [UINT64_MAX, 0n]);
    eq(roundTrip(t.UInt64Array, [UINT64_MAX + 1n, -1n]), [0n, UINT64_MAX]);
    observe('uint64 MIN_SAFE_INTEGER', () => roundTrip(t.UInt64Array, [BigInt(Number.MIN_SAFE_INTEGER)]));
});

test('float', () => {
    const got = roundTrip(t.FloatArray, [MAX_FLOAT, -MAX_FLOAT, 0.5]);
    assert(Math.abs(got[0] - MAX_FLOAT) < 1e29, `MAX_FLOAT ~ ${got[0]}`);
    assert(Math.abs(got[1] + MAX_FLOAT) < 1e29, `-MAX_FLOAT ~ ${got[1]}`);
    eq(got[2], 0.5);
    observe('float overflow', () => roundTrip(t.FloatArray, [MAX_FLOAT + 0.0000002e38, MAX_FLOAT * 2, -MAX_FLOAT * 2, Number.MAX_VALUE]));
});

test('double', () => {
    const values = [Number.MAX_VALUE, -Number.MAX_VALUE, Number.MIN_VALUE, Infinity, -Infinity, NaN];
    eq(roundTrip(t.DoubleArray, values), values);
});

test('bool', () => {
    eq(roundTrip(t.BoolArray, [false, true]), [false, true]);
    observe('bool from non boolean', () => roundTrip(t.BoolArray, [1, 0, 'x']));
});

test('enum with int32 underlying type', () => {
    const E = UE.EPuertsTestEnumInt32;
    eq(roundTrip(t.EnumInt32Array, [E.VM1, E.V0, E.V3, 1111, -1111]), [-1, 0, 3, 1111, -1111]);
    eq(roundTrip(t.EnumInt32Array, [INT32_MAX + 1, INT32_MIN - 1]), [INT32_MIN, INT32_MAX]);
    observe('EPuertsTestEnumInt32_MAX', () => E.EPuertsTestEnumInt32_MAX);
});

test('enum with int8 underlying type', () => {
    eq(UE.EPuertsTestEnumInt8Min.VINT8_MIN, -128);
    eq(UE.EPuertsTestEnumInt8Max.VINT8_MAX, 127);
    eq(roundTrip(t.EnumInt8MinArray, [-128, -129]), [-128, 127]);
    eq(roundTrip(t.EnumInt8MaxArray, [127, 128]), [127, -128]);
});

const MULTILINGUAL = '中文 español Deutsch English देवनागरी العربية português বাংলা русский 日本語 norsk bokmål ਪੰਜਾਬੀ 한국어 தமிழ் עברית';

function stringLike(arr) {
    const who = 'Martin';
    const values = ['The First String', MULTILINGUAL, `hello ${who}`];
    eq(roundTrip(arr, values), values);
    arr.Set(0, arr.Get(0) + '!');
    eq(arr.Get(0), 'The First String!');
}

test('FString', () => {
    stringLike(t.StringArray);
    eq(roundTrip(t.StringArray, ['']), ['']);
});

test('FText', () => {
    stringLike(t.TextArray);
    eq(roundTrip(t.TextArray, ['']), ['']);
});

test('FName', () => {
    stringLike(t.NameArray);
    eq(roundTrip(t.NameArray, ['']), ['None'], 'empty FName is None');
});

test('FVector', () => {
    const a = t.VectorArray;
    a.Empty();
    a.Add(new UE.Vector(1, 2, 3));
    a.Set(0, new UE.Vector(100, 200, 300));
    eq([a.Get(0).X, a.Get(0).Y, a.Get(0).Z], [100, 200, 300]);
});

test('UObject*', () => {
    const a = t.ObjectArray;
    a.Empty();
    a.Add(t);
    eq(a.Get(0), t);
    a.Add(null);
    observe('null object element', () => a.Get(1));
});

test('UClass*', () => {
    const a = t.ClassArray;
    a.Empty();
    a.Add(UE.Actor.StaticClass());
    a.Add(UE.PuertsTestContainerElements.StaticClass());
    eq([a.Get(0).GetName(), a.Get(1).GetName()], ['Actor', 'PuertsTestContainerElements']);
});

run();
