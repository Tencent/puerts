'use strict';
// Object identity and lifetime. These cases guard the M2 change (object mapping + UObject handle scheme).
const { UE, reporter, test, step, eq, assert, note, observe, catchError, run } = require('./framework');
const Reporter = UE.PuertsTestReporter;
const Live = () => UE.PuertsTestObject.GetLiveCount();

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
    });
});

run();
