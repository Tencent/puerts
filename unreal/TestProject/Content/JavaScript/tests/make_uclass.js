'use strict';
const { UE, puerts, test, eq, observe, run } = require('./framework');

class Gen extends UE.PuertsTestMakeClassTarget {
    Constructor() {
        this.Base = 7;
        this.jsField = 'ctor';
    }
    ImplEvent(v) {
        return v * 2 + this.Base;
    }
    NativeEvent(s) {
        return 'js:' + s + ':' + this.jsField;
    }
    Helper() {
        return 'helper';
    }
}

let GenClass;

test('makeUClass', () => {
    GenClass = puerts.makeUClass(Gen);
    observe('generated class name prefix', () => GenClass.GetName().startsWith('Gen_C'));
    observe('generated class is a child of the parent', () =>
        GenClass.IsChildOf(UE.PuertsTestMakeClassTarget.StaticClass()));
    const o = UE.NewObject(GenClass);
    eq(o.Base, 7, 'Constructor runs on the new object');
    eq(o.jsField, 'ctor', 'js field set by Constructor');
    eq(o.CallImplEvent(5), 17, 'BlueprintImplementableEvent overridden');
    observe('BlueprintNativeEvent via C++', () => o.CallNativeEvent('a'));
    observe('BlueprintNativeEvent via js', () => o.NativeEvent('a'));
    observe('non UFunction method', () => typeof o.Helper);
    observe('call non UFunction method', () => o.Helper());
});

test('makeUClass base not affected', () => {
    const base = new UE.PuertsTestMakeClassTarget();
    observe('base impl event', () => base.CallImplEvent(5));
    eq(base.CallNativeEvent('a'), 'native:a');
});

test('makeUClass twice', () => {
    const C2 = puerts.makeUClass(Gen);
    observe('second class differs', () => C2 !== GenClass);
    const o = UE.NewObject(C2);
    eq(o.CallImplEvent(1), 9);
});

test('makeUClass override throws', () => {
    class Thrower extends UE.PuertsTestMakeClassTarget {
        ImplEvent(v) {
            throw new Error('makeuclass boom');
        }
    }
    const C = puerts.makeUClass(Thrower);
    const o = UE.NewObject(C);
    observe('return value after throw', () => o.CallImplEvent(3));
});

test('makeUClass constructor throws', () => {
    class BadCtor extends UE.PuertsTestMakeClassTarget {
        Constructor() {
            throw new Error('makeuclass ctor boom');
        }
        ImplEvent(v) {
            return v + 1;
        }
    }
    const C = puerts.makeUClass(BadCtor);
    const o = UE.NewObject(C);
    observe('object still usable', () => o.CallImplEvent(1));
});

test('makeUClass invalid', () => {
    observe('plain object', () => puerts.makeUClass({}));
    observe('class without StaticClass', () => puerts.makeUClass(class Foo {}));
});

run();
