'use strict';
const { UE, test, eq, observe, run } = require('./framework');

let Cls;
let obj;

test('ts class', () => {
    Cls = UE.PuertsTestTsTarget.CreateTsClass('tests/ts_class_impl');
    observe('class type', () => Cls.GetClass().GetName());
    observe('class is a child of the parent', () => Cls.IsChildOf(UE.PuertsTestTsTarget.StaticClass()));
    observe('constructor calls after CDO', () => require('./ts_class_impl').ctorCount());
    obj = UE.NewObject(Cls);
    observe('constructor calls after new', () => require('./ts_class_impl').ctorCount());
    eq(obj.Base, 7, 'Constructor runs on the new object');
    eq(obj.jsField, 'ctor', 'js field set by Constructor');
    eq(obj.CallImplEvent(5), 17, 'BlueprintImplementableEvent overridden');
    observe('BlueprintNativeEvent via C++', () => obj.CallNativeEvent('a'));
    observe('BlueprintNativeEvent via js', () => obj.NativeEvent('a'));
    observe('ImplEvent via js', () => obj.ImplEvent(1));
    observe('non UFunction method', () => typeof obj.Helper);
    observe('call non UFunction method', () => obj.Helper());
});

test('ts class base not affected', () => {
    const base = new UE.PuertsTestTsTarget();
    observe('base impl event', () => base.CallImplEvent(5));
    eq(base.CallNativeEvent('a'), 'native:a');
});

test('ts class second object', () => {
    const o = UE.NewObject(Cls);
    eq(o.CallImplEvent(1), 9);
    observe('objects do not share js fields', () => (obj.jsField = 'changed', o.jsField));
});

test('ts class override throws', () => {
    observe('return value after throw', () => obj.CallImplEvent(-1));
    observe('object still usable', () => obj.CallImplEvent(1));
});

run();
