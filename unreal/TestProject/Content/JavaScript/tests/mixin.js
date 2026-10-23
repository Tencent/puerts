'use strict';
const { UE, puerts, reporter, test, step, eq, observe, run } = require('./framework');
const { blueprint } = puerts;

class MixinImpl {
    ImplEvent(v) {
        return v + this.Base;
    }
    NativeEvent(s) {
        return 'js:' + s;
    }
    Extra() {
        return 'extra';
    }
}

let Mixed;

test('mixin', () => {
    Mixed = blueprint.mixin(UE.PuertsTestMixinTarget, MixinImpl);
    const o = new UE.PuertsTestMixinTarget();
    eq(o.CallImplEvent(5), 105, 'BlueprintImplementableEvent overridden');
    // Current behaviour: mixin on a native class does not redirect C++ calls of a BlueprintNativeEvent.
    observe('BlueprintNativeEvent via C++ after mixin', () => o.CallNativeEvent('a'));
    observe('BlueprintNativeEvent via js after mixin', () => o.NativeEvent('a'));
    eq(o.ImplEvent(1), 101, 'call override from js');
    observe('mixin extra method on base instance', () => typeof o.Extra);
    observe('mixin returned class', () => Mixed === UE.PuertsTestMixinTarget);
});

test('mixin loop', () => {
    const o = new UE.PuertsTestMixinTarget();
    o.Base = 0;
    eq(o.LoopImplEvent(10), 45);
});

test('mixin twice', () => {
    observe('mixin twice', () => {
        blueprint.mixin(UE.PuertsTestMixinTarget, MixinImpl);
        return 'ok';
    });
});

test('unmixin', () => {
    blueprint.unmixin(UE.PuertsTestMixinTarget);
    const o = new UE.PuertsTestMixinTarget();
    eq(o.CallNativeEvent('a'), 'native:a');
    observe('impl event after unmixin', () => o.CallImplEvent(1));
});

test('makeUClass presence', () => {
    observe('makeUClass type', () => typeof puerts.makeUClass);
});

test('mixin bad arguments', () => {
    observe('mixin to a non class', () => blueprint.mixin({ StaticClass: () => new UE.PuertsTestObject() }, MixinImpl));
    observe('mixin to a number', () => blueprint.mixin({ StaticClass: () => 1 }, MixinImpl));
    observe('mixin unknown method only', () => {
        class OnlyUnknown {
            NotAUFunction() {
                return 1;
            }
        }
        const cls = blueprint.mixin(UE.PuertsTestMixinTarget, OnlyUnknown);
        const o = new UE.PuertsTestMixinTarget();
        const r = [o.CallImplEvent(1), typeof o.NotAUFunction];
        blueprint.unmixin(UE.PuertsTestMixinTarget);
        return r.concat(cls === UE.PuertsTestMixinTarget);
    });
});

test('mixin inherit', () => {
    const config = { inherit: true };
    const Cls = blueprint.mixin(UE.PuertsTestMixinTarget, MixinImpl, config);
    observe('inherit generatedClass is a new class', () => config.generatedClass !== UE.PuertsTestMixinTarget.StaticClass());
    observe('inherit returned class is the base', () => Cls === UE.PuertsTestMixinTarget);
    const o = UE.NewObject(config.generatedClass);
    eq(o.CallImplEvent(5), 105, 'override on the generated class');
    const base = new UE.PuertsTestMixinTarget();
    observe('base class is not affected', () => base.CallImplEvent(5));
});

class TakeRefImpl {
    ImplEvent(v) {
        this.counter = (this.counter || 0) + v;
        return this.counter;
    }
}

const takeRefState = {};

test('mixin objectTakeByNative', () => {
    const config = { inherit: true, objectTakeByNative: true };
    blueprint.mixin(UE.PuertsTestMixinTarget, TakeRefImpl, config);
    const o = UE.NewObject(config.generatedClass);
    eq(o.CallImplEvent(2), 2);
    eq(o.CallImplEvent(3), 5, 'js state on the object');
    o.expando = 'kept';
    // only the native side keeps the UObject
    reporter.Holder = o;
    takeRefState.ref = new WeakRef(o);
});

step(() => {
    test('mixin objectTakeByNative keeps js state', () => {
        const o = reporter.Holder;
        observe('same js object after gc', () => o === takeRefState.ref.deref());
        observe('expando after gc', () => o.expando);
        observe('js state after gc', () => o.CallImplEvent(1));
        reporter.Holder = undefined;
    });
});

run();
