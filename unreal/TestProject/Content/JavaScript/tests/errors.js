'use strict';
// Error behaviour visible to scripts. Messages are recorded in the baseline rather than asserted.
const { UE, puerts, test, note, assert, catchError, run } = require('./framework');
const { $ref } = puerts;
const obj = new UE.PuertsTestObject();

test('argument errors', () => {
    note('int from string', catchError(() => obj.Add('a', 'b')));
    note('missing args', catchError(() => obj.Add()));
    note('extra args', catchError(() => obj.Add(1, 2, 3)));
    note('object from number', catchError(() => (obj.ObjectValue = 1)));
    note('object of wrong class', catchError(() => (obj.ObjectValue = UE.PuertsTestObject.StaticClass())));
    note('struct from number', catchError(() => obj.StructSum(1)));
    note('out param without ref', catchError(() => obj.OutParams(0, '', new UE.PuertsTestStruct())));
    note('ref param without ref', catchError(() => obj.IncRef(1)));
    note('enum out of range', catchError(() => (obj.EnumValue = 3)));
    note('byte overflow', catchError(() => {
        obj.ByteValue = 300;
        return obj.ByteValue;
    }));
    note('byte overflow value', String(obj.ByteValue));
});

test('this errors', () => {
    note('method on wrong this', catchError(() => obj.Add.call({}, 1, 2)));
    note('getter on prototype', catchError(() => UE.PuertsTestObject.prototype.IntValue));
    note('call method unbound', catchError(() => {
        const f = obj.Add;
        return f(1, 2);
    }));
});

test('lookup errors', () => {
    note('unknown class', catchError(() => UE.NoSuchClassXYZ.StaticClass()));
    note('unknown member', String(obj.NoSuchMember));
    note('unknown cpp class', catchError(() => require('cpp').NoSuchCppClass.Foo()));
    note('require missing module', catchError(() => require('./no_such_module')));
});

test('container errors', () => {
    note('array add wrong type', catchError(() => obj.IntArray.Add('x')));
    note('array set out of range', catchError(() => obj.IntArray.Set(100, 1)));
    note('map key wrong type', catchError(() => obj.StringIntMap.Add(1, 1)));
    note('fixed array out of range', catchError(() => obj.FixedInts.Get(5)));
});

test('delegate errors', () => {
    note('bind non function', catchError(() => obj.IntDelegate.Bind(1)));
    obj.IntDelegate.Unbind();
    const unboundErr = catchError(() => obj.IntDelegate.Execute(1));
    assert(unboundErr !== '<no throw>', 'execute on an unbound delegate must throw, not crash');
    note('execute unbound', unboundErr);
});

test('ref helpers', () => {
    note('ref shape', JSON.stringify($ref(1)));
});

run();
