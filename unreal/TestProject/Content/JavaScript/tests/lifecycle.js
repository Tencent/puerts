'use strict';
// Object identity and lifetime. These cases guard the M2 change (object mapping + UObject handle scheme).
const { UE, reporter, test, step, eq, assert, note, observe, catchError, run } = require('./framework');
const Reporter = UE.PuertsTestReporter;
const Live = () => UE.PuertsTestObject.GetLiveCount();
const Counted = () => UE.PuertsTestObject.GetCountedLiveCount();

const state = {};

test('identity', () => {
    const a = new UE.PuertsTestObject();
    assert(a.GetSelf() === a, 'same UObject -> same js object');
    a.ObjectValue = a;
    assert(a.ObjectValue === a, 'via property');
    const arr = UE.NewArray(UE.PuertsTestObject);
    arr.Add(a);
    assert(arr.Get(0) === a, 'via container');
});

test('struct and container identity', () => {
    const o = new UE.PuertsTestObject();
    observe('struct property identity', () => o.StructValue === o.StructValue);
    const s = o.StructValue;
    s.X = 6;
    observe('struct property is a reference', () => o.StructValue.X);
    o.StructArray.Add(new UE.PuertsTestStruct());
    observe('struct element identity', () => o.StructArray.Get(0) === o.StructArray.Get(0));
    observe('array property identity', () => o.IntArray === o.IntArray);
    observe('set property identity', () => o.StringSet === o.StringSet);
    observe('map property identity', () => o.StringIntMap === o.StringIntMap);
    const v = o.MakeStruct(1, 'v');
    observe('returned struct is a new object', () => v !== o.MakeStruct(1, 'v'));
    observe('struct instanceof', () => v instanceof UE.PuertsTestStruct);
});

test('setup: counted structs', () => {
    state.countedBase = Counted();
    state.keptCounted = new UE.PuertsTestCountedStruct();
    state.keptCounted.V = 1;
    for (let i = 0; i < 10; ++i) {
        new UE.PuertsTestCountedStruct().V = i;
    }
    const p = new UE.PuertsTestObject();
    for (let i = 0; i < 5; ++i) {
        p.MakeCounted(i).V;
    }
    const arr = UE.NewArray(UE.PuertsTestCountedStruct);
    for (let i = 0; i < 5; ++i) {
        arr.Add(new UE.PuertsTestCountedStruct());
    }
    state.keptCountedArray = UE.NewArray(UE.PuertsTestCountedStruct);
    state.keptCountedArray.Add(state.keptCounted);
    note('counted live before gc', Counted() - state.countedBase);
});

test('setup: js-owned objects', () => {
    state.baseLive = Live();
    state.kept = new UE.PuertsTestObject();
    state.kept.IntValue = 5;
    for (let i = 0; i < 10; ++i) {
        new UE.PuertsTestObject().IntValue = i;
    }
    eq(Live(), state.baseLive + 11);
});

test('setup: native-owned object reached from js', () => {
    const holder = new UE.PuertsTestObject();
    reporter.Holder = holder;
    holder.CreateChild().IntValue = 77; // child outer = holder, not referenced by any UPROPERTY
    state.holderRef = new WeakRef(holder);
});

test('setup: explicitly destroyed object', () => {
    state.doomed = new UE.PuertsTestObject();
    state.doomed.IntValue = 9;
    Reporter.MarkGarbage(state.doomed);
    observe('marked garbage IsAlive', () => Reporter.IsAlive(state.doomed));
    observe('marked garbage read before gc', () => state.doomed.IntValue);
});

test('setup: struct and child', () => {
    state.struct = new UE.PuertsTestStruct();
    state.struct.X = 3;
    const p = new UE.PuertsTestObject();
    state.fromStruct = p.MakeStruct(8, 'm');
});

step(() => {
    test('kept object alive', () => {
        eq(state.kept.IntValue, 5);
    });

    test('unreferenced js-created objects collected', () => {
        // kept + (doomed may or may not be counted) + objects created in other setup cases
        note('live delta after gc', Live() - state.baseLive);
    });

    test('destroyed object access', () => {
        observe('destroyed IsAlive', () => Reporter.IsAlive(state.doomed));
        note('destroyed read', catchError(() => state.doomed.IntValue));
        note('destroyed call', catchError(() => state.doomed.Add(1, 2)));
        note('destroyed write', catchError(() => {
            state.doomed.IntValue = 1;
        }));
    });

    test('address reuse does not alias destroyed object', () => {
        let aliased = 0;
        const fresh = [];
        for (let i = 0; i < 200; ++i) {
            const o = new UE.PuertsTestObject();
            if (o === state.doomed) ++aliased;
            fresh.push(o);
        }
        note('aliased fresh objects', aliased);
        state.fresh = fresh;
    });

    test('struct survives gc', () => {
        eq(state.struct.X, 3);
        eq(state.fromStruct.S, 'm');
        eq(state.fromStruct.Arr.Get(1), 9);
    });

    test('unreferenced structs freed', () => {
        // the kept struct + its copy in the kept array
        note('counted live after gc', Counted() - state.countedBase);
        eq(state.keptCounted.V, 1);
        eq(state.keptCountedArray.Get(0).V, 1);
        state.keptCounted = undefined;
        state.keptCountedArray = undefined;
    });

    test('native holder still reachable', () => {
        assert(reporter.Holder !== undefined, 'holder');
        observe('holder identity after gc', () => reporter.Holder === state.holderRef.deref());
        reporter.Holder = undefined;
    });

    test('release kept', () => {
        state.liveBeforeRelease = Live();
        state.kept = undefined;
        state.fresh = undefined;
    });
});

step(() => {
    test('released objects collected', () => {
        note('collected after release', state.liveBeforeRelease - Live());
        note('counted live after release', Counted() - state.countedBase);
    });
});

run();
