'use strict';
// Micro benchmarks for the paths affected by the papi migration. Results in ns/op.
const { UE, puerts, reporter, test, eq, run } = require('./framework');
const Now = UE.PuertsTestReporter.NowSeconds;
const cpp = require('cpp');

const SCALE = 1;

function bench(name, n, body) {
    n = Math.max(1, Math.floor(n * SCALE));
    body(Math.max(1, n >> 4)); // warm up
    const t0 = Now();
    body(n);
    const dt = Now() - t0;
    reporter.Metric(name, (dt * 1e9) / n, 'ns/op');
}

const obj = new UE.PuertsTestObject();
obj.StringValue = 'some string value';
obj.IntArray.Add(1);
obj.IntArray.Add(2);
obj.StringIntMap.Add('k', 1);
const s = new UE.PuertsTestStruct();
s.X = 1;
const cppObj = new cpp.FPuertsTestCppClass(1, 2);
const C = cpp.FPuertsTestCppClass;

test('js -> ufunction', () => {
    bench('ufunction.noop', 1000000, (n) => {
        for (let i = 0; i < n; ++i) obj.Noop();
    });
    bench('ufunction.identity_int', 1000000, (n) => {
        for (let i = 0; i < n; ++i) obj.Identity(i);
    });
    bench('ufunction.three_args', 1000000, (n) => {
        for (let i = 0; i < n; ++i) obj.ThreeArgs(i, 1.5, 'abc');
    });
    bench('ufunction.return_string', 500000, (n) => {
        for (let i = 0; i < n; ++i) obj.ReturnString();
    });
    bench('ufunction.static_noop', 1000000, (n) => {
        for (let i = 0; i < n; ++i) UE.PuertsTestObject.StaticNoop();
    });
    bench('ufunction.struct_param', 500000, (n) => {
        for (let i = 0; i < n; ++i) obj.StructSum(s);
    });
    bench('ufunction.return_struct', 300000, (n) => {
        for (let i = 0; i < n; ++i) obj.MakeStruct(i, 'x');
    });
    bench('ufunction.return_self', 1000000, (n) => {
        for (let i = 0; i < n; ++i) obj.GetSelf();
    });
});

test('js -> property', () => {
    bench('property.get_int', 2000000, (n) => {
        let x = 0;
        for (let i = 0; i < n; ++i) x += obj.IntValue;
    });
    bench('property.set_int', 2000000, (n) => {
        for (let i = 0; i < n; ++i) obj.IntValue = i;
    });
    bench('property.get_string', 1000000, (n) => {
        for (let i = 0; i < n; ++i) obj.StringValue;
    });
    bench('property.set_string', 1000000, (n) => {
        for (let i = 0; i < n; ++i) obj.StringValue = 'abc';
    });
    bench('property.get_struct', 500000, (n) => {
        for (let i = 0; i < n; ++i) obj.StructValue;
    });
    bench('property.struct_field', 2000000, (n) => {
        for (let i = 0; i < n; ++i) s.X = i;
    });
});

test('containers', () => {
    const a = obj.IntArray;
    bench('array.get', 2000000, (n) => {
        for (let i = 0; i < n; ++i) a.Get(1);
    });
    bench('array.num', 2000000, (n) => {
        for (let i = 0; i < n; ++i) a.Num();
    });
    bench('array.property_access', 1000000, (n) => {
        for (let i = 0; i < n; ++i) obj.IntArray;
    });
    const m = obj.StringIntMap;
    bench('map.get', 1000000, (n) => {
        for (let i = 0; i < n; ++i) m.Get('k');
    });
});

test('object creation', () => {
    bench('new.uobject', 50000, (n) => {
        for (let i = 0; i < n; ++i) new UE.PuertsTestObject();
    });
    bench('new.struct', 300000, (n) => {
        for (let i = 0; i < n; ++i) new UE.PuertsTestStruct();
    });
    bench('new.cpp', 300000, (n) => {
        for (let i = 0; i < n; ++i) new C(i, i);
    });
});

test('template binding', () => {
    bench('cpp.method_noop', 2000000, (n) => {
        for (let i = 0; i < n; ++i) cppObj.Noop();
    });
    bench('cpp.method_int', 2000000, (n) => {
        for (let i = 0; i < n; ++i) cppObj.Add(i);
    });
    bench('cpp.property_get', 2000000, (n) => {
        let x = 0;
        for (let i = 0; i < n; ++i) x += cppObj.X;
    });
    bench('cpp.static', 2000000, (n) => {
        for (let i = 0; i < n; ++i) C.StaticMul(i, 2);
    });
    bench('cpp.overload', 1000000, (n) => {
        for (let i = 0; i < n; ++i) cppObj.Over(i, 2);
    });
});

test('c++ -> js', () => {
    // callbacks return 1 so the int32 accumulator on the C++ side cannot overflow
    obj.IntDelegate.Bind((v) => 1);
    bench('delegate.cpp_to_js', 500000, (n) => {
        eq(obj.LoopIntDelegate(n), n);
    });
    obj.IntDelegate.Unbind();

    class MixinImpl {
        ImplEvent(v) {
            return 1;
        }
    }
    puerts.blueprint.mixin(UE.PuertsTestMixinTarget, MixinImpl);
    const t = new UE.PuertsTestMixinTarget();
    bench('mixin.cpp_to_js', 500000, (n) => {
        eq(t.LoopImplEvent(n), n);
    });
    puerts.blueprint.unmixin(UE.PuertsTestMixinTarget);

    class MakeClassImpl extends UE.PuertsTestMakeClassTarget {
        ImplEvent(v) {
            return 1;
        }
    }
    const MadeClass = puerts.makeUClass(MakeClassImpl);
    const m = UE.NewObject(MadeClass);
    bench('makeuclass.cpp_to_js', 500000, (n) => {
        eq(m.LoopImplEvent(n), n);
    });
    bench('makeuclass.new', 50000, (n) => {
        for (let i = 0; i < n; ++i) UE.NewObject(MadeClass);
    });
});

run();
