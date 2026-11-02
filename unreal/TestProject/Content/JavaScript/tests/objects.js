'use strict';
// UE.NewObject / UE.NewStruct / puerts.merge / UE.MakeWeakObjectPtr / puerts.setJsTakeRef.
// Guards M5 (object creation global functions on papi).
const { UE, test, step, eq, assert, note, observe, catchError, run } = require('./framework');
const puerts = require('puerts');
const Reporter = UE.PuertsTestReporter;

const state = {};

test('NewObject', () => {
    const cls = UE.PuertsTestObject.StaticClass();
    const o = UE.NewObject(cls);
    assert(o instanceof UE.PuertsTestObject, 'instance of the class');
    o.IntValue = 3;
    eq(o.IntValue, 3);
    assert(o.GetSelf() === o, 'identity');

    const derived = UE.NewObject(UE.PuertsTestDerived.StaticClass());
    observe('derived WhoAmI', () => derived.WhoAmI());
    eq(derived.DerivedValue, 42);

    const named = UE.NewObject(cls, o, 'PuertsNewObjectNamed');
    observe('named GetName', () => named.GetName());

    const nullOuter = UE.NewObject(cls, null, undefined, undefined);
    assert(nullOuter instanceof UE.PuertsTestObject, 'null / undefined optional args are skipped');

    const flagged = UE.NewObject(cls, undefined, undefined, 0);
    assert(flagged instanceof UE.PuertsTestObject, 'flags');

    state.notTaken = UE.NewObject(cls, undefined, undefined, undefined, false);
    assert(state.notTaken instanceof UE.PuertsTestObject, 'without js take ref');
});

test('NewObject bad arguments', () => {
    note('NewObject no args', catchError(() => UE.NewObject()));
    note('NewObject number', catchError(() => UE.NewObject(1)));
    note('NewObject plain object', catchError(() => UE.NewObject({})));
    note('NewObject not a class', catchError(() => UE.NewObject(new UE.PuertsTestObject())));
    note('NewObject struct type', catchError(() => UE.NewObject(UE.PuertsTestStruct.StaticClass())));
    const doomed = new UE.PuertsTestObject();
    state.doomedOuter = doomed;
    Reporter.MarkGarbage(doomed);
});

test('NewStruct', () => {
    const s = UE.NewStruct(UE.PuertsTestStruct.StaticClass());
    assert(s instanceof UE.PuertsTestStruct, 'instance of the struct');
    eq(s.X, 0);
    s.X = 7;
    s.S = 'abc';
    eq(s.X, 7);
    eq(s.S, 'abc');
    const o = new UE.PuertsTestObject();
    o.StructValue = s;
    eq(o.StructValue.X, 7);
    state.newStruct = s;
});

test('NewStruct bad arguments', () => {
    note('NewStruct no args', catchError(() => UE.NewStruct()));
    note('NewStruct number', catchError(() => UE.NewStruct(1)));
    note('NewStruct class type', catchError(() => UE.NewStruct(UE.PuertsTestObject.StaticClass())));
});

test('merge', () => {
    const o = new UE.PuertsTestObject();
    puerts.merge(o, { IntValue: 5, StringValue: 'merged', NoSuchField: 1 });
    eq(o.IntValue, 5);
    eq(o.StringValue, 'merged');

    const s = new UE.PuertsTestStruct();
    puerts.merge(s, { X: 9, S: 'st' });
    eq(s.X, 9);
    eq(s.S, 'st');

    puerts.merge(o, { StructValue: { X: 4 } });
    eq(o.StructValue.X, 4);

    // only own enumerable properties are merged, undefined values are skipped
    const src = Object.create({ IntValue: 100 });
    Object.defineProperty(src, 'StringValue', { value: 'hidden', enumerable: false });
    src.X = undefined;
    puerts.merge(o, src);
    eq(o.IntValue, 5);
    eq(o.StringValue, 'merged');
    puerts.merge(s, { X: undefined, S: 'st2' });
    eq(s.X, 9);
    eq(s.S, 'st2');
});

test('merge bad arguments', () => {
    note('merge no args', catchError(() => puerts.merge()));
    note('merge number des', catchError(() => puerts.merge(1, {})));
    note('merge number src', catchError(() => puerts.merge(new UE.PuertsTestObject(), 1)));
    note('merge plain des', catchError(() => puerts.merge({}, {})));
});

test('MakeWeakObjectPtr', () => {
    const o = new UE.PuertsTestObject();
    const w = UE.MakeWeakObjectPtr(o);
    observe('weak typeof', () => typeof w);
    eq(w.IsValid(), true);
    assert(w.Get() === o, 'Get returns the same js object');

    const empty = UE.MakeWeakObjectPtr(undefined);
    eq(empty.IsValid(), false);
    eq(empty.Get(), undefined);
    observe('weak of plain object IsValid', () => UE.MakeWeakObjectPtr({}).IsValid());

    state.weakTarget = new UE.PuertsTestObject();
    state.weak = UE.MakeWeakObjectPtr(state.weakTarget);
    Reporter.MarkGarbage(state.weakTarget);
});

test('setJsTakeRef', () => {
    const o = UE.NewObject(UE.PuertsTestObject.StaticClass(), undefined, undefined, undefined, false);
    note('setJsTakeRef', catchError(() => puerts.setJsTakeRef(o)));
    note('setJsTakeRef no args', catchError(() => puerts.setJsTakeRef()));
    note('setJsTakeRef plain object', catchError(() => puerts.setJsTakeRef({})));
    note('setJsTakeRef struct', catchError(() => puerts.setJsTakeRef(new UE.PuertsTestStruct())));
});

step(() => {
    test('after gc', () => {
        eq(state.newStruct.X, 7);
        observe('weak of destroyed object IsValid', () => state.weak.IsValid());
        observe('weak of destroyed object Get', () => state.weak.Get());
        note('NewObject with destroyed outer', catchError(() => UE.NewObject(UE.PuertsTestObject.StaticClass(), state.doomedOuter)));
        note('merge into destroyed', catchError(() => puerts.merge(state.doomedOuter, { IntValue: 1 })));
        note('object without js take ref after gc', catchError(() => state.notTaken.IntValue));
    });
});

run();
