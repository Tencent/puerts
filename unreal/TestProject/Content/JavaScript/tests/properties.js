'use strict';
const { UE, test, eq, near, assert, note, observe, run } = require('./framework');

const obj = new UE.PuertsTestObject();

test('bool', () => {
    eq(obj.BoolValue, false);
    obj.BoolValue = true;
    eq(obj.BoolValue, true);
});

test('bitfield', () => {
    obj.bBitA = true;
    eq(obj.bBitA, true);
    eq(obj.bBitB, false, 'neighbour bit untouched');
    obj.bBitB = true;
    obj.bBitA = false;
    eq(obj.bBitA, false);
    eq(obj.bBitB, true);
});

test('byte', () => {
    obj.ByteValue = 200;
    eq(obj.ByteValue, 200);
});

test('int32', () => {
    obj.IntValue = -12345;
    eq(obj.IntValue, -12345);
    obj.IntValue = 2147483647;
    eq(obj.IntValue, 2147483647);
});

test('int64', () => {
    obj.Int64Value = 9007199254740993n;
    eq(obj.Int64Value, 9007199254740993n);
    observe('int64 typeof', () => typeof obj.Int64Value);
    observe('int64 assign number', () => {
        obj.Int64Value = 5;
        return obj.Int64Value;
    });
});

test('float/double', () => {
    obj.FloatValue = 1.5;
    eq(obj.FloatValue, 1.5);
    obj.FloatValue = 0.1;
    near(obj.FloatValue, 0.1, 1e-7);
    obj.DoubleValue = 0.1;
    eq(obj.DoubleValue, 0.1);
});

test('string', () => {
    obj.StringValue = 'hello 世界 🙂';
    eq(obj.StringValue, 'hello 世界 🙂');
    obj.StringValue = '';
    eq(obj.StringValue, '');
});

test('name', () => {
    obj.NameValue = 'SomeName';
    eq(obj.NameValue, 'SomeName');
    observe('name typeof', () => typeof obj.NameValue);
});

test('text', () => {
    obj.TextValue = 'some text';
    eq(obj.TextValue, 'some text');
    observe('text typeof', () => typeof obj.TextValue);
});

test('enum', () => {
    eq(UE.EPuertsTestEnum.A, 0);
    eq(UE.EPuertsTestEnum.B, 1);
    eq(UE.EPuertsTestEnum.C, 10);
    obj.EnumValue = UE.EPuertsTestEnum.C;
    eq(obj.EnumValue, 10);
});

test('vector', () => {
    obj.VectorValue = new UE.Vector(1, 2, 3);
    const v = obj.VectorValue;
    eq(v.X, 1);
    eq(v.Y, 2);
    eq(v.Z, 3);
});

test('struct', () => {
    const s = new UE.PuertsTestStruct();
    s.X = 3;
    s.S = 'abc';
    obj.StructValue = s;
    eq(obj.StructValue.X, 3);
    eq(obj.StructValue.S, 'abc');
    s.X = 4;
    eq(obj.StructValue.X, 3, 'assignment copies');
    observe('struct property get then modify', () => {
        const ref = obj.StructValue;
        ref.X = 99;
        return obj.StructValue.X;
    });
    observe('struct property get twice identical', () => obj.StructValue === obj.StructValue);
});

test('object', () => {
    eq(obj.ObjectValue, undefined);
    const other = new UE.PuertsTestObject();
    obj.ObjectValue = other;
    assert(obj.ObjectValue === other, 'same js object');
    obj.ObjectValue = undefined;
    eq(obj.ObjectValue, undefined);
    observe('object property null assign', () => {
        obj.ObjectValue = null;
        return obj.ObjectValue;
    });
});

test('class', () => {
    obj.ClassValue = UE.PuertsTestDerived.StaticClass();
    eq(obj.ClassValue.GetName(), 'PuertsTestDerived');
});

test('weak/soft object', () => {
    const other = new UE.PuertsTestObject();
    obj.WeakObject = other;
    assert(obj.WeakObject === other, 'weak ptr returns same object');
    observe('soft object default', () => obj.SoftObject);
});

test('fixed array', () => {
    const f = obj.FixedInts;
    eq(f.Num(), 3);
    f.Set(1, 11);
    eq(obj.FixedInts.Get(1), 11);
});

test('reflection shape', () => {
    observe('typeof class', () => typeof UE.PuertsTestObject);
    observe('instanceof Object', () => obj instanceof UE.Object);
    observe('instanceof PuertsTestObject', () => obj instanceof UE.PuertsTestObject);
    observe('own keys', () => Object.keys(obj));
    observe('ctor name', () => obj.constructor.name);
    observe('derived proto chain', () => Object.getPrototypeOf(UE.PuertsTestDerived.prototype) === UE.PuertsTestObject.prototype);
    observe('has IntValue in proto', () => 'IntValue' in UE.PuertsTestObject.prototype);
    observe('IntValue enumerable on proto', () => Object.keys(UE.PuertsTestObject.prototype).includes('IntValue'));
    observe('StaticClass name', () => UE.PuertsTestObject.StaticClass().GetName());
    observe('struct instanceof', () => new UE.PuertsTestStruct() instanceof UE.PuertsTestStruct);
});

test('derived', () => {
    const d = new UE.PuertsTestDerived();
    eq(d.DerivedValue, 42);
    d.IntValue = 5;
    eq(d.IntValue, 5);
    eq(d.WhoAmI(), 'Derived');
    eq(d.Add(1, 2), 3);
    assert(d instanceof UE.PuertsTestObject, 'derived instanceof base');
});

run();
