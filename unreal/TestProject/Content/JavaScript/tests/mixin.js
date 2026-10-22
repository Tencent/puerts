'use strict';
const { UE, puerts, test, eq, observe, run } = require('./framework');
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

run();
