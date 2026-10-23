'use strict';
// UClass / UScriptStruct binding shape: what the generated js classes expose (prototype members, statics, Find / Load,
// constructor arguments, extension and interface methods, FName case fixing of member names).
// Guards M4-6 (UClass / UScriptStruct templates moved into the registry).
const { UE, test, eq, assert, note, observe, catchError, run } = require('./framework');

const sortedOwnNames = (o) => Object.getOwnPropertyNames(o).sort().join(',');

test('prototype members', () => {
    const proto = UE.PuertsTestReflectTarget.prototype;
    observe('class prototype own names', () => sortedOwnNames(proto));
    observe('struct prototype own names', () => sortedOwnNames(UE.PuertsTestStruct.prototype));
    const desc = Object.getOwnPropertyDescriptor(proto, 'Value');
    observe('property descriptor', () =>
        `get:${typeof desc.get} set:${typeof desc.set} enumerable:${desc.enumerable} configurable:${desc.configurable}`);
    const method = Object.getOwnPropertyDescriptor(proto, 'InterfacePing');
    observe('method descriptor', () =>
        `value:${typeof method.value} writable:${method.writable} enumerable:${method.enumerable} configurable:${method.configurable}`);
    const t = new UE.PuertsTestReflectTarget();
    observe('instance own keys', () => Object.keys(t).join(','));
    eq('Value' in t, true);
    // prototype members are not own properties of instances (the old named property interceptor answered true)
    observe('hasOwnProperty of prototype member', () => Object.prototype.hasOwnProperty.call(t, 'Value'));
});

test('statics', () => {
    observe('class statics', () => sortedOwnNames(UE.PuertsTestReflectTarget));
    observe('struct statics', () => sortedOwnNames(UE.PuertsTestStruct));
    eq(UE.PuertsTestObject.StaticAdd(1, 2), 3);
    observe('static inherited by subclass', () => typeof UE.PuertsTestDerived.StaticAdd);
    observe('static on instance', () => typeof new UE.PuertsTestObject().StaticAdd);
    assert(UE.PuertsTestStruct.StaticStruct() === UE.PuertsTestStruct.StaticClass(), 'StaticStruct');
    observe('struct Find', () => typeof UE.PuertsTestStruct.Find);
    observe('class name', () => UE.PuertsTestReflectTarget.name);
    observe('struct name', () => UE.PuertsTestStruct.name);
});

test('inheritance', () => {
    assert(Object.getPrototypeOf(UE.PuertsTestDerived.prototype) === UE.PuertsTestObject.prototype, 'class proto chain');
    observe('class constructor chain', () => Object.getPrototypeOf(UE.PuertsTestDerived) === UE.PuertsTestObject);
    observe('struct without super', () => Object.getPrototypeOf(UE.PuertsTestStruct.prototype) === Object.prototype);
    observe('struct root proto chain ends at Object.prototype', () =>
        Object.getPrototypeOf(Object.getPrototypeOf(UE.PuertsTestStruct.prototype)) === Object.prototype);
    observe('instanceof Object', () => new UE.PuertsTestStruct() instanceof Object && new UE.PuertsTestObject() instanceof Object);
    const t = new UE.PuertsTestReflectTarget();
    assert(t instanceof UE.Object, 'instanceof UE.Object');
    assert(t.constructor === UE.PuertsTestReflectTarget, 'constructor');
    observe('toString tag', () => Object.prototype.toString.call(t));
});

test('class constructor', () => {
    const outer = new UE.PuertsTestReflectTarget();
    const named = new UE.PuertsTestReflectTarget(outer, 'PuertsReflectNamed');
    eq(named.GetName(), 'PuertsReflectNamed');
    assert(named.GetOuter() === outer, 'outer');
    note('call without new', catchError(() => UE.PuertsTestReflectTarget()));
    note('invalid outer', catchError(() => new UE.PuertsTestReflectTarget(1)));
    note('plain object outer', catchError(() => new UE.PuertsTestReflectTarget({})));
    observe('undefined outer', () => new UE.PuertsTestReflectTarget(undefined).GetOuter().GetName());
    note('NewObject invalid outer', catchError(() => UE.NewObject(UE.PuertsTestReflectTarget.StaticClass(), 1)));
});

test('struct constructor', () => {
    const s = new UE.PuertsTestStruct(3, 'x');
    eq(s.X, 3);
    eq(s.S, 'x');
    const more = new UE.PuertsTestStruct(4, 'y', [1, 2], 'extra');
    eq(more.X, 4);
    observe('array arg', () => more.Arr.Num());
    const empty = new UE.PuertsTestStruct();
    eq(empty.X, 0);
    note('struct call without new', catchError(() => UE.PuertsTestStruct()));
    note('struct wrong arg type', catchError(() => new UE.PuertsTestStruct('a')));
});

test('Find and Load', () => {
    const outer = new UE.PuertsTestReflectTarget();
    const named = new UE.PuertsTestReflectTarget(outer, 'PuertsReflectFindMe');
    assert(UE.PuertsTestReflectTarget.Find('PuertsReflectFindMe', outer) === named, 'Find with outer');
    eq(UE.PuertsTestReflectTarget.Find('PuertsReflectNoSuchObject'), undefined);
    note('Find no args', catchError(() => UE.PuertsTestReflectTarget.Find()));
    note('Find number', catchError(() => UE.PuertsTestReflectTarget.Find(1)));
    observe('Load missing package', () => UE.PuertsTestReflectTarget.Load('/Game/NoSuchDir/NoSuchAsset.NoSuchAsset'));
    note('Load no args', catchError(() => UE.PuertsTestReflectTarget.Load()));
});

test('extension and interface methods', () => {
    const t = new UE.PuertsTestReflectTarget();
    t.Value = 5;
    eq(t.ExtTriple(), 15);
    eq(t.InterfacePing(2), 7);
    const s = new UE.PuertsTestStruct(4);
    eq(s.ExtStructDouble(), 8);
    observe('extension on unrelated class', () => typeof new UE.PuertsTestObject().ExtTriple);
});

test('FName case fixing', () => {
    const o = new UE.PuertsTestObject();
    o.IntValue = 3;
    observe('lower case get', () => o.intvalue);
    o.intvalue = 9;
    eq(o.IntValue, 9);
    observe('lower case method', () => o.add(1, 2));
    const s = new UE.PuertsTestStruct(6);
    observe('struct lower case get', () => s.x);
    observe('unknown member', () => o.NoSuchMember);
    observe('symbol member', () => o[Symbol.iterator]);
    observe('lower case cached on prototype', () =>
        Object.prototype.hasOwnProperty.call(UE.PuertsTestObject.prototype, 'intvalue'));
    observe('in after cached', () => 'intvalue' in o);
    observe('in unknown', () => 'nosuchmember' in o);
    observe('Object.prototype member', () => typeof o.hasOwnProperty);
    o.MyExpando = 7;
    observe('expando own', () => Object.prototype.hasOwnProperty.call(o, 'MyExpando') && o.MyExpando === 7);
    observe('expando not shared', () => new UE.PuertsTestObject().MyExpando);
    observe('then member', () => typeof o.then);
});

run();
