'use strict';
const { UE, puerts, test, step, eq, observe, run } = require('./framework');

const obj = new UE.PuertsTestObject();

test('single delegate', () => {
    eq(obj.CallIntDelegate(1), -1, 'unbound');
    obj.IntDelegate.Bind((v) => v * 2);
    eq(obj.IntDelegate.IsBound(), true);
    eq(obj.CallIntDelegate(21), 42);
    eq(obj.IntDelegate.Execute(5), 10, 'execute from js');
    obj.IntDelegate.Unbind();
    eq(obj.IntDelegate.IsBound(), false);
    eq(obj.CallIntDelegate(1), -1);
});

test('rebind', () => {
    obj.IntDelegate.Bind((v) => v + 1);
    obj.IntDelegate.Bind((v) => v + 2);
    eq(obj.CallIntDelegate(1), 3);
    obj.IntDelegate.Unbind();
});

test('multicast', () => {
    const got = [];
    const f1 = (m) => got.push('1' + m);
    const f2 = (m) => got.push('2' + m);
    obj.Multicast.Add(f1);
    obj.Multicast.Add(f2);
    obj.BroadcastMulticast('a');
    obj.Multicast.Remove(f1);
    obj.BroadcastMulticast('b');
    obj.Multicast.Broadcast('c');
    obj.Multicast.Clear();
    obj.BroadcastMulticast('d');
    eq(got.slice().sort(), ['1a', '2a', '2b', '2c']);
    observe('multicast IsBound after clear', () => obj.Multicast.IsBound());
});

test('delegate shape', () => {
    observe('delegate ctor', () => obj.IntDelegate.constructor.name);
    observe('delegate same view', () => obj.IntDelegate === obj.IntDelegate);
});

// closure captured by a delegate must stay alive across GC while bound
let captured = { value: 100 };
test('bind closure', () => {
    const c = captured;
    obj.IntDelegate.Bind((v) => v + c.value);
    captured = undefined;
});

step(() => {
    test('closure survives gc', () => {
        eq(obj.CallIntDelegate(1), 101);
        obj.IntDelegate.Unbind();
    });

    test('toManualReleaseDelegate', () => {
        observe('toManualReleaseDelegate type', () => typeof puerts.toManualReleaseDelegate);
    });
});

// ---------- js function passed as a delegate argument (NewDelegate) ----------
const Reporter = UE.PuertsTestReporter;
const state = {};

test('function argument: manual release proxy', () => {
    const o = new UE.PuertsTestObject();
    const f = puerts.toManualReleaseDelegate((v) => v * 3);
    o.SetIntDelegate(f);
    eq(o.CallIntDelegate(4), 12);
    eq(o.IntDelegate.Execute(5), 15, 'execute the copied delegate from js');
    // the same function reuses its proxy
    const o2 = new UE.PuertsTestObject();
    o2.SetIntDelegate(f);
    eq(o2.CallIntDelegate(2), 6);
    puerts.releaseManualReleaseDelegate(f);
    // released twice is a no-op
    puerts.releaseManualReleaseDelegate(f);
    state.manual = o;
    state.manual2 = o2;
});

test('releaseManualReleaseDelegate args', () => {
    observe('releaseManualReleaseDelegate(1)', () => puerts.releaseManualReleaseDelegate(1));
    observe('releaseManualReleaseDelegate(unknown fn)', () => puerts.releaseManualReleaseDelegate(() => 0));
});

test('function argument: [owner, function]', () => {
    const owner = new UE.PuertsTestObject();
    const o = new UE.PuertsTestObject();
    o.SetIntDelegate([owner, (v) => v + 1000]);
    eq(o.CallIntDelegate(1), 1001);
    Reporter.MarkGarbage(owner);
    state.autoRelease = o;
});

test('function argument: [object, ufunction name]', () => {
    const o = new UE.PuertsTestObject();
    o.SetIntDelegate([o, 'Identity']);
    eq(o.CallIntDelegate(7), 7);
    observe('ufunction bound IsBound', () => o.IntDelegate.IsBound());
});

test('delegate object argument copies', () => {
    const a = new UE.PuertsTestObject();
    const b = new UE.PuertsTestObject();
    a.IntDelegate.Bind((v) => v - 1);
    b.SetIntDelegate(a.IntDelegate);
    eq(b.CallIntDelegate(10), 9);
    a.IntDelegate.Unbind();
    // the copy still points at the proxy whose js function was just reset; calling it would hit an ensure
    observe('copy IsBound after source unbind', () => b.IntDelegate.IsBound());
    b.IntDelegate.Unbind();
});

test('delegate returned by value', () => {
    const o = new UE.PuertsTestObject();
    o.IntDelegate.Bind((v) => v * 10);
    const copy = o.GetIntDelegate();
    observe('returned delegate is the property view', () => copy === o.IntDelegate);
    eq(copy.Execute(3), 30);
    o.IntDelegate.Unbind();
    observe('unbound GetIntDelegate', () => o.GetIntDelegate());
});

test('void delegate signature', () => {
    const o = new UE.PuertsTestObject();
    const got = [];
    o.StepDelegate.Bind((s) => got.push(s));
    eq(o.CallStepDelegate(3), true);
    o.StepDelegate.Unbind();
    eq(o.CallStepDelegate(4), false);
    eq(got, [3]);
});

test('execute unbound', () => {
    const o = new UE.PuertsTestObject();
    observe('execute unbound single', () => o.IntDelegate.Execute(1));
    observe('broadcast empty multicast', () => o.Multicast.Broadcast('x'));
});

test('multicast edge cases', () => {
    const o = new UE.PuertsTestObject();
    const got = [];
    const f = (m) => got.push(m);
    o.Multicast.Add(f);
    o.Multicast.Add(f);
    o.BroadcastMulticast('twice');
    observe('same function added twice', () => got.slice());
    o.Multicast.Remove(() => 0);
    o.BroadcastMulticast('after remove unknown');
    observe('after removing an unknown function', () => got.length);
    o.Multicast.Remove(f);
    o.BroadcastMulticast('after remove once');
    observe('after removing once', () => got.length);
    o.Multicast.Remove(f);
    o.BroadcastMulticast('after remove twice');
    observe('after removing twice', () => got.length);
    observe('multicast IsBound after removing all', () => o.Multicast.IsBound());
    // add after remove reuses the delegate view
    o.Multicast.Add(f);
    o.BroadcastMulticast('re-add');
    observe('after re-add', () => got[got.length - 1]);
    o.Multicast.Clear();
});

test('delegate of a destroyed owner', () => {
    const o = new UE.PuertsTestObject();
    state.deadDelegate = o.IntDelegate;
    state.deadMulticast = o.Multicast;
    Reporter.MarkGarbage(o);
});

step(() => {
    test('manual release proxy after release and gc', () => {
        observe('manual released call', () => state.manual.CallIntDelegate(4));
        observe('manual released call (2nd user)', () => state.manual2.CallIntDelegate(4));
    });

    test('[owner, function] after owner destroyed', () => {
        observe('auto release call', () => state.autoRelease.CallIntDelegate(1));
    });

    test('destroyed owner delegate', () => {
        observe('bind on destroyed owner', () => state.deadDelegate.Bind((v) => v));
        observe('add on destroyed owner', () => state.deadMulticast.Add(() => 0));
    });
});

run();
