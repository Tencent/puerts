let Assert_AreEqual = CS.NUnit.Framework.Assert.AreEqual

// public int Boo<A>(short x) {return 4;}
// public int Foo<A>() {return 1;}
// public void Foo<A>(ref int x) { x += 2; }
// public int Foo<A, B>() {return 3;}
// public void Foo<A, B>(int x) { }
// public C Foo<A, B, C>(out int x) { x = 5; return default; }
// x.Foo<int>();
// x.Boo<int>(0);
// int z = 1;
// x.Foo<int>(ref z);
// x.Foo<int, string>();
// x.Foo<int, string>(1);
// x.Foo<int, string, int>(out var y);
let typeof_GenericMethodTest = puer.$typeof(CS.Puerts.UnitTest.GenericMethodTest)
let Foo_Int32 = puer.getGenericMethod(typeof_GenericMethodTest, "Foo", CS.System.Int32)
let Boo_Int32 = puer.getGenericMethod(typeof_GenericMethodTest, "Boo", CS.System.Int32)
let Foo_Int32_String = puer.getGenericMethod(typeof_GenericMethodTest, "Foo", CS.System.Int32, CS.System.String)
let Foo_Int32_String_Int32 = puer.getGenericMethod(typeof_GenericMethodTest, "Foo", CS.System.Int32, CS.System.String, CS.System.Int32)

let a = puer.$ref(9)
let t = new CS.Puerts.UnitTest.GenericMethodTest()
// Assert_AreEqual(Foo_Int32.call(t), 1)
Foo_Int32.call(t, a) // ref test
// Assert_AreEqual(puer.$unref(a), 11)
// Assert_AreEqual(Boo_Int32.call(t, 1), 4) // convert arg type test
// Assert_AreEqual(Foo_Int32_String.call(t), 3)
// Foo_Int32_String.call(t, 0) // override test
// Foo_Int32_String_Int32.call(t, a) // out test
// Assert_AreEqual(puer.$unref(a), 5)

// // performance test
// var PERFORMANCE_TEST_COUNT = 0
// if (PERFORMANCE_TEST_COUNT)
// {
//     var b = Date.now();
//     for (var i = 0; i < PERFORMANCE_TEST_COUNT; i++)
//         Foo_Int32.call(t)
//     var e = Date.now();
//     console.error("[generic perf] no arg elapsed:", e - b)
    
//     var b = Date.now();
//     for (var i = 0; i < PERFORMANCE_TEST_COUNT; i++)
//         Foo_Int32_String.call(t, 1)
//     var e = Date.now();
//     console.error("[generic perf] 1 arg elapsed:", e - b)
    
//     var b = Date.now();
//     for (var i = 0; i < PERFORMANCE_TEST_COUNT; i++)
//         Foo_Int32_String_Int32.call(t, a)
//     var e = Date.now();
//     console.error("[generic perf] 1 outarg elapsed:", e - b)
// }