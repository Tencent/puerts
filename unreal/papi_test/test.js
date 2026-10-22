// pesapi + static binding test, ported from puerts_node/test/test.js
// run by papi_test_host: papi_test_host <addon path> test.js

const $ref = (x) => [x];
const $unref = (r) => r[0];

let passed = 0;
function assert(cond, msg) {
    if (!cond) {
        throw new Error("assert fail: " + msg);
    }
    passed++;
}
function assertEq(actual, expected, msg) {
    assert(actual === expected, msg + ", expected: " + expected + ", actual: " + actual);
}
function assertThrows(fn, msg) {
    let thrown = false;
    try {
        fn();
    } catch (e) {
        thrown = true;
        print("caught expected error (" + msg + "): " + e.message);
    }
    assert(thrown, msg + " should throw");
}

puerts.loadAddon(ADDON_PATH, "hello");
const TestClass = puerts.loadCPPType("hello.TestClass");
const BaseClass = puerts.loadCPPType("hello.BaseClass");
const AdvanceTestClass = puerts.loadCPPType("hello.AdvanceTestClass");
const LifeCycleClass = puerts.loadCPPType("hello.LifeCycleClass");
const NoDeleteClass = puerts.loadCPPType("hello.NoDeleteClass");

assertThrows(() => puerts.loadCPPType("hello.NotExist"), "load not exist type");

// static function
assertEq(TestClass.Add(12, 34), 46, "static function");

// function overload
assertEq(TestClass.Overload(), 0, "overload 0");
assertEq(TestClass.Overload(1), 1, "overload 1");
assertEq(TestClass.Overload(1, 2), 2, "overload 2");
assertEq(TestClass.Overload("hello", 2), 3, "overload 3");
assertThrows(() => TestClass.Overload("hello"), "function overload mismatch");

// constructor overload
let obj = new TestClass();
assertEq(obj.X, 0, "default ctor X");
assertEq(obj.Y, 0, "default ctor Y");
obj = new TestClass(8, 9);
assertEq(obj.X, 8, "ctor X");
assertEq(obj.Y, 9, "ctor Y");
assert(obj instanceof TestClass, "instanceof TestClass");
assert(obj instanceof BaseClass, "instanceof BaseClass");

// method overload
assertEq(obj.OverloadMethod(), 0, "method overload 0");
assertEq(obj.OverloadMethod(1024), 1, "method overload 1");
assertEq(obj.OverloadMethod(4294967295), 4294967295, "method overload 2 (uint32)");
assertEq(obj.OverloadMethod(1024n), 1024n, "method overload 3 (int64)");
assertThrows(() => obj.OverloadMethod("hello"), "method overload mismatch");

// property
obj.X = 96;
obj.Y = 97;
assertEq(obj.X, 96, "set property X");
assertEq(obj.Y, 97, "set property Y");

// base method and property
obj.Foo(888);
assertEq(obj.A, 888, "base property");

// pass object / return object
const self = obj.GetSelf();
assertEq(self, obj, "return this keeps identity");
assertEq(TestClass.PrintInfo(self), 96 + 97 + 0, "pass object");

// static variable
assertEq(TestClass.StaticInt, 0, "static variable");
TestClass.StaticInt = 789;
assertEq(TestClass.StaticInt, 789, "set static variable");
assertEq(TestClass.PrintInfo(obj), 96 + 97 + 789, "static variable seen by c++");
assertEq(TestClass.Ten, 10, "readonly static variable");

// ref & pointer
let r = $ref(999);
let ret = obj.Ref(r);
assertEq($unref(r), 1000, "ref out value");
assertEq(ret, 1001, "ref return");
assertEq(obj.ConstRef(999), 999, "const ref");

r = $ref(888);
ret = obj.Ptr(r);
assertEq($unref(r), 889, "ptr out value");
assertEq(ret, 890, "ptr return");

let sr = $ref("ts msg for ref");
obj.StrRef(sr);
assertEq($unref(sr), "ts msg for ref append by c++", "string ref");

assertEq(obj.CStr("ts str"), "hehe..", "c string");

sr = $ref("ts msg for ptr");
obj.StrPtr(sr);
assertEq($unref(sr), "ts msg for ptr append by c++", "string ptr");

// object without destructor, non-const object reference must be passed by $ref
const nd = new NoDeleteClass();
assertEq(obj.NoEmptyRef($ref(nd)), true, "object ref by $ref");
assertEq(obj.NoEmptyRef(nd), false, "object ref without $ref gets nullptr");

// js function and object
const obj2 = new AdvanceTestClass(100);
assertEq(obj2.A, 100, "single constructor");
assertEq(obj2.StdFunctionTest((x, y) => {
    print("x=" + x + ",y=" + y);
    return x + y;
}), 88 + 99, "std::function callback");
assertEq(obj2.FunctionTest((x, y) => x * 10 + y), 1001, "puerts::Function callback");
const jsobj = { x: 21 };
assertEq(obj2.ObjectTest(jsobj), 21, "puerts::Object get");
assertEq(jsobj.y, 42, "puerts::Object set");
assertThrows(() => new AdvanceTestClass(1, 2, 3), "constructor args mismatch");

// finalize
(function () {
    for (let i = 0; i < 100; i++) {
        new LifeCycleClass();
    }
})();
assertEq(LifeCycleClass.GetAliveCount() > 0, true, "objects alive before gc");
gc();
gc();
assert(LifeCycleClass.GetAliveCount() < 100, "finalize called after gc, alive: " + LifeCycleClass.GetAliveCount());

// class registry: an env bound to a new registry (create_registry + set_registry) can not see classes of the default one
assertEq(puerts.useEmptyRegistry(true), false, "TestClass not in a new registry");
assertThrows(() => puerts.loadCPPType("hello.TestClass"), "load type from an empty registry");
assertEq(puerts.useEmptyRegistry(false), true, "TestClass in the default registry");
assertEq(puerts.loadCPPType("hello.TestClass"), TestClass, "load type after switching back to the default registry");

print("all " + passed + " assertions passed");
