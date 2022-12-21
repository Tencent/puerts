let Assert_AreEqual = CS.NUnit.Framework.Assert.AreEqual

let types = [
    // puer.$typeof(CS.System.Object),
    // puer.$typeof(CS.System.Boolean),
    puer.$typeof(CS.System.Char),
    puer.$typeof(CS.System.SByte),
    puer.$typeof(CS.System.Byte),
    puer.$typeof(CS.System.Int16),
    puer.$typeof(CS.System.UInt16),
    puer.$typeof(CS.System.Int32),
    puer.$typeof(CS.System.UInt32),
    puer.$typeof(CS.System.Int64),
    puer.$typeof(CS.System.UInt64),
    puer.$typeof(CS.System.Single),
    puer.$typeof(CS.System.Double),
    // puer.$typeof(CS.System.String),
    // puer.$typeof(CS.System.Array),
]

// sanity test
let TEST_VAL = 7
for (let i = 0; i < types.length; i++) {
    const type = types[i];
    let arr = CS.System.Array.CreateInstance(type, 1)
    arr.set_Item(0, TEST_VAL)
    let val = arr.get_Item(0)
    Assert_AreEqual(val, TEST_VAL)
}

{   // boolean test
    let arr = CS.System.Array.CreateInstance(puer.$typeof(CS.System.Boolean), 1)
    arr.set_Item(0, true)
    let val = arr.get_Item(0)
    Assert_AreEqual(val, true)
}

{   // exceeds sbyte test, will truncate
    let TEST_EXCEEDS_SBYTE = 0x1ff
    let arr = CS.System.Array.CreateInstance(puer.$typeof(CS.System.SByte), 1)
    arr.set_Item(0, TEST_EXCEEDS_SBYTE)
    let val = arr.get_Item(0)
    Assert_AreEqual(val, -1)
}

{   // exceeds uint64 test, will truncate
    let TEST_UVAL_BIGINT = 18446744073709551618n // 0x8000000000000001n << 1n
    let arr = CS.System.Array.CreateInstance(puer.$typeof(CS.System.Int64), 1)
    arr.set_Item(0, TEST_UVAL_BIGINT)
    let val = arr.get_Item(0)
    Assert_AreEqual(val, 2)
}

{   // int64 test
    let TEST_VAL64 = -9223372036854775807n // 0x8000000000000001n
    let arr = CS.System.Array.CreateInstance(puer.$typeof(CS.System.Int64), 1)
    arr.set_Item(0, TEST_VAL64)
    let val = arr.get_Item(0)
    Assert_AreEqual(val, TEST_VAL64)
}

{   // uint64 test
    let TEST_UVAL64 = 0x8000000000000001n
    let arr = CS.System.Array.CreateInstance(puer.$typeof(CS.System.UInt64), 1)
    arr.set_Item(0, TEST_UVAL64)
    let val = arr.get_Item(0)
    Assert_AreEqual(val, TEST_UVAL64)
}

{   // uint64 set to int64 array test
    let TEST_UVAL64 = 0x8000000000000001n
    let arr = CS.System.Array.CreateInstance(puer.$typeof(CS.System.Int64), 1)
    arr.set_Item(0, TEST_UVAL64)
    let val = arr.get_Item(0) // val === -9223372036854775807n
    Assert_AreEqual(val != TEST_UVAL64, true)
}

{   // set_ItemBigInt test
    let TEST_VAL64 = -9223372036854775807n // 0x8000000000000001n
    let arr = CS.System.Array.CreateInstance(puer.$typeof(CS.System.Int64), 1)
    arr.set_ItemBigInt(0, TEST_VAL64, CS.System.TypeCode.Int64)
    Assert_AreEqual(arr.get_Item(0), TEST_VAL64)

    // set_ItemNumber test
    let TEST_NUMBER = 0.123456789123456789123456789123456789123456789
    let arr2 = CS.System.Array.CreateInstance(puer.$typeof(CS.System.Object), 1)
    arr2.set_ItemNumber(0, TEST_NUMBER, CS.System.TypeCode.Double)
    Assert_AreEqual(arr2.get_Item(0), TEST_NUMBER)

    // set_ItemNumber test, will truncate
    let arr3 = CS.System.Array.CreateInstance(puer.$typeof(CS.System.Object), 1)
    arr3.set_ItemNumber(0, 0.123, CS.System.TypeCode.Int32)
    Assert_AreEqual(arr3.get_Item(0), 0)
    arr3.set_ItemNumber(0, 123456, CS.System.TypeCode.Byte) 
    Assert_AreEqual(arr3.get_Item(0), 64)
}