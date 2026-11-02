'use strict';
// FJsObject: a USTRUCT holding a js object, passed through reflection (property / param / return value) and the template
// binding, accessed from C++ with Get / Set / Func / Action. Access after the env is destroyed is covered by
// FPuertsTest_JsObject in C++ (the holder is kept in reporter.Holder).
const { UE, reporter, test, step, eq, assert, run } = require('./framework');
const cpp = require('cpp');
const C = cpp.FPuertsTestCppClass;
const state = {};

test('identity', () => {
    const h = new UE.PuertsTestJsObjectHolder();
    const o = { a: 1 };
    h.SetValue(o);
    assert(h.GetValue() === o, 'param in, return value out');
    assert(h.Value === o, 'property get');
    const o2 = function () {};
    h.Value = o2;
    assert(h.GetValue() === o2, 'property set, function is an object');
});

test('get set', () => {
    const h = new UE.PuertsTestJsObjectHolder();
    const inner = { z: 1 };
    const o = { x: 5, s: 'hi', inner };
    h.SetValue(o);
    eq(h.GetInt('x'), 5);
    eq(h.GetString('s'), 'hi');
    eq(h.GetInt('missing'), 0);
    assert(h.GetObject('inner') === inner, 'Get<FJsObject>');
    h.SetInt('y', 9);
    eq(o.y, 9);
});

test('func action', () => {
    const h = new UE.PuertsTestJsObjectHolder();
    h.SetValue((a, b) => a * 10 + b);
    eq(h.CallFunc(3, 4), 34);
    const got = [];
    h.SetValue((s) => got.push(s));
    h.CallAction('x');
    eq(got, ['x']);
});

test('errors are logged', () => {
    // each call logs an error checked by FPuertsTest_JsObject, the caller gets the default value
    const h = new UE.PuertsTestJsObjectHolder();
    h.SetValue({});
    eq(h.CallFunc(1, 2), 0, 'call a non-function object');
    h.SetValue(() => {
        throw new Error('jsobject boom');
    });
    eq(h.CallFunc(1, 2), 0, 'func throws');
    h.CallAction('x');
});

test('copy', () => {
    const h = new UE.PuertsTestJsObjectHolder();
    h.SetValue({ x: 5 });
    eq(h.CopyAndRead('x'), 10);
});

test('non object', () => {
    // a non object leaves the FJsObject empty, an empty FJsObject is undefined in js
    const h = new UE.PuertsTestJsObjectHolder();
    eq(h.GetValue(), undefined, 'default');
    h.SetValue(1);
    eq(h.GetValue(), undefined, 'number');
    h.Value = { x: 1 };
    h.Value = 'str';
    eq(h.Value.x, 1, 'property set by a non object keeps the old value');
});

test('template binding', () => {
    eq(C.ReadJsObjectX({ x: 7 }), 7);
    const o = {};
    assert(C.EchoJsObject(o) === o, 'echo');
});

test('kept by cpp', () => {
    state.holder = new UE.PuertsTestJsObjectHolder();
    state.holder.SetValue({ x: 11 });
});

step(() => {
    test('kept by cpp after gc', () => {
        eq(state.holder.GetInt('x'), 11);
        eq(state.holder.GetValue().x, 11);
        // read by FPuertsTest_JsObject after the env is destroyed
        const h = new UE.PuertsTestJsObjectHolder();
        h.SetValue({ x: 3 });
        reporter.Holder = h;
    });
});

run();
