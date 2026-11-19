'use strict';
const { UE, puerts, reporter, test, step, eq, assert, observe, run } = require('./framework.js');
const { blueprint } = puerts;
const BP = UE.PuertsTestBlueprintUtils;
const tojs = puerts.blueprint.tojs;

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
    // The generated C++ thunk of a BlueprintNativeEvent: UE5 calls the _Implementation directly when the function belongs to a
    // native class, UE4 always goes through ProcessEvent, so mixin on a native class redirects the C++ call on UE4 only.
    const redirected = UE.KismetSystemLibrary.GetEngineVersion().startsWith('4.');
    eq(o.CallNativeEvent('a'), redirected ? 'js:a' : 'native:a', 'BlueprintNativeEvent via C++ after mixin');
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
    takeRefState.cls = config.generatedClass;
});

test('setup: mixin objectTakeByNative destroyed', () => {
    const o = UE.NewObject(takeRefState.cls);
    o.expando = 'doomed';
    o.CallImplEvent(4);
    takeRefState.doomed = o;
    UE.PuertsTestReporter.MarkGarbage(o);
});

test('setup: mixin objectTakeByNative setJsTakeRef', () => {
    // the wrapper is held by native until js takes the ref, then the wrapper holds the UObject (its reserved slot is filled)
    const o = UE.NewObject(takeRefState.cls);
    o.expando = 'js';
    eq(o.CallImplEvent(7), 7);
    puerts.setJsTakeRef(o);
    takeRefState.jsHeld = o;
    takeRefState.jsHeldWeak = UE.MakeWeakObjectPtr(o);
});

step(() => {
    test('mixin objectTakeByNative setJsTakeRef keeps the UObject', () => {
        const o = takeRefState.jsHeld;
        eq(takeRefState.jsHeldWeak.IsValid(), true, 'UObject held by the js object');
        eq(o.expando, 'js');
        eq(o.CallImplEvent(1), 8, 'js state kept');
        takeRefState.jsHeld = undefined;
    });

    test('mixin objectTakeByNative keeps js state', () => {
        const o = reporter.Holder;
        observe('same js object after gc', () => o === takeRefState.ref.deref());
        observe('expando after gc', () => o.expando);
        observe('js state after gc', () => o.CallImplEvent(1));
        reporter.Holder = undefined;
    });

    test('mixin objectTakeByNative destroyed access', () => {
        observe('destroyed objectTakeByNative call', () => takeRefState.doomed.CallImplEvent(1));
        observe('destroyed objectTakeByNative expando', () => takeRefState.doomed.expando);
        takeRefState.doomed = undefined;
    });
});

step(() => {
    test('mixin objectTakeByNative released with the UObject', () => {
        // the UObject is collected once native drops it, then the js object is no longer held
        observe('js object released after the UObject is collected', () => takeRefState.ref.deref() === undefined);
    });

    test('mixin objectTakeByNative setJsTakeRef released with the js object', () => {
        observe('UObject valid after js drops the taken ref', () => takeRefState.jsHeldWeak.IsValid());
        takeRefState.jsHeldWeak = undefined;
    });
});

// Tencent/puerts#2362: a TS class chain mixin'd onto a blueprint chain (blueprint B derived from blueprint A, both
// derived from the native mixin target). B must get its own mixin instead of reusing the mixed function of A: the
// duplicate of a mixed function carries the js generated function magic of the parent, so the mixin of B rebinds the
// js function of A, and the objects of both classes then dispatch to the methods of the wrong TS class (the shared
// function also breaks the restore of B once the js function of A is orphaned)
test('mixin blueprint inheritance chain', () => {
    const BP_A = BP.CreateBlueprintClass(UE.PuertsTestMixinTarget.StaticClass());
    const BP_B = BP.CreateBlueprintClass(BP_A);
    assert(BP_A && BP_B, 'blueprint chain created (needs the editor)');
    const JsA = tojs(BP_A);
    const JsB = tojs(BP_B);

    class C {
        ImplEvent(v) {
            return v + 1;
        }
    }
    class D extends C {
        ImplEvent(v) {
            return super.ImplEvent(v) * 10;
        }
    }
    blueprint.mixin(JsA, C);
    blueprint.mixin(JsB, D);

    const info = BP.DescribeFunction(BP_B, 'ImplEvent');
    const a = new JsA();
    // the rebind of the shared generated function of A must not have overwritten the binding of A (got 20 = D's method)
    eq(a.CallImplEvent(1), 2, `A instance dispatches to C [B::ImplEvent: ${info}]`);
    const b = new JsB();
    eq(b.CallImplEvent(1), 20, 'B instance dispatches to D');
    blueprint.unmixin(JsA);
    blueprint.unmixin(JsB);
});

run();
