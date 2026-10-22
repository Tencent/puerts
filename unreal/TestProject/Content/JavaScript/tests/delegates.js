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

run();
