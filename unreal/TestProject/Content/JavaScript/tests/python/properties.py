f = require('tests/python/framework')
UE, test, eq, near, assert_, observe = f.UE, f.test, f.eq, f.near, f.assert_, f.observe

obj = UE.PuertsTestObject()


def t_bool():
    eq(obj.BoolValue, False)
    obj.BoolValue = True
    eq(obj.BoolValue, True)


test('bool', t_bool)


def t_bitfield():
    obj.bBitA = True
    eq(obj.bBitA, True)
    eq(obj.bBitB, False, 'neighbour bit untouched')
    obj.bBitB = True
    obj.bBitA = False
    eq(obj.bBitA, False)
    eq(obj.bBitB, True)


test('bitfield', t_bitfield)


def t_byte():
    obj.ByteValue = 200
    eq(obj.ByteValue, 200)


test('byte', t_byte)


def t_int32():
    obj.IntValue = -12345
    eq(obj.IntValue, -12345)
    obj.IntValue = 2147483647
    eq(obj.IntValue, 2147483647)


test('int32', t_int32)


def t_int64():
    obj.Int64Value = 9007199254740993
    eq(obj.Int64Value, 9007199254740993)
    observe('int64 type', lambda: type(obj.Int64Value).__name__)


test('int64', t_int64)


def t_float():
    obj.FloatValue = 1.5
    eq(obj.FloatValue, 1.5)
    obj.FloatValue = 0.1
    near(obj.FloatValue, 0.1, 1e-7)
    obj.DoubleValue = 0.1
    eq(obj.DoubleValue, 0.1)

    def int_to_double():
        obj.DoubleValue = 3
        return obj.DoubleValue

    observe('int to double property', int_to_double)


test('float/double', t_float)


def t_string():
    obj.StringValue = 'hello \u4e16\u754c \U0001f642'
    eq(obj.StringValue, 'hello \u4e16\u754c \U0001f642')
    obj.StringValue = ''
    eq(obj.StringValue, '')


test('string', t_string)


def t_name():
    obj.NameValue = 'SomeName'
    eq(obj.NameValue, 'SomeName')
    observe('name type', lambda: type(obj.NameValue).__name__)


test('name', t_name)


def t_text():
    obj.TextValue = 'some text'
    eq(obj.TextValue, 'some text')
    observe('text type', lambda: type(obj.TextValue).__name__)


test('text', t_text)


def t_enum():
    eq(UE.EPuertsTestEnum.A, 0)
    eq(UE.EPuertsTestEnum.B, 1)
    eq(UE.EPuertsTestEnum.C, 10)
    obj.EnumValue = UE.EPuertsTestEnum.C
    eq(obj.EnumValue, 10)


test('enum', t_enum)


def t_vector():
    obj.VectorValue = UE.Vector(1, 2, 3)
    v = obj.VectorValue
    eq(v.X, 1)
    eq(v.Y, 2)
    eq(v.Z, 3)


test('vector', t_vector)


def t_struct():
    s = UE.PuertsTestStruct()
    s.X = 3
    s.S = 'abc'
    obj.StructValue = s
    eq(obj.StructValue.X, 3)
    eq(obj.StructValue.S, 'abc')
    s.X = 4
    eq(obj.StructValue.X, 3, 'assignment copies')

    def get_then_modify():
        ref = obj.StructValue
        ref.X = 99
        return obj.StructValue.X

    observe('struct property get then modify', get_then_modify)
    observe('struct property get twice identical', lambda: obj.StructValue == obj.StructValue)


test('struct', t_struct)


def t_object():
    eq(obj.ObjectValue, None)
    other = UE.PuertsTestObject()
    obj.ObjectValue = other
    assert_(obj.ObjectValue is other, 'same python object')
    obj.ObjectValue = None
    eq(obj.ObjectValue, None)


test('object', t_object)


def t_class():
    obj.ClassValue = UE.PuertsTestDerived.StaticClass()
    eq(obj.ClassValue.GetName(), 'PuertsTestDerived')


test('class', t_class)


def t_weak_soft():
    other = UE.PuertsTestObject()
    obj.WeakObject = other
    assert_(obj.WeakObject is other, 'weak ptr returns same object')
    soft = obj.SoftObject
    eq(soft.Get(), None)
    eq(soft.LoadSynchronous(), None)

    def assign_soft():
        obj.SoftObject = other

    observe('assign uobject to soft object', assign_soft)


test('weak/soft object', t_weak_soft)


def t_fixed_array():
    a = obj.FixedInts
    eq(a.Num(), 3)
    a.Set(1, 11)
    eq(obj.FixedInts.Get(1), 11)


test('fixed array', t_fixed_array)


def t_shape():
    observe('type of class', lambda: type(UE.PuertsTestObject).__name__)
    observe('type of object', lambda: type(obj).__name__)
    observe('str class', lambda: str(UE.PuertsTestObject))
    observe('mro', lambda: [c.__name__ for c in UE.PuertsTestObject.__mro__])
    observe('StaticClass name', lambda: UE.PuertsTestObject.StaticClass().GetName())
    observe('unknown property', lambda: obj.NoSuchProperty)

    def expando():
        obj.PyField = 5
        return obj.PyField

    observe('expando field', expando)
    observe('isinstance', lambda: isinstance(UE.PuertsTestDerived(), UE.PuertsTestObject))


test('reflection shape', t_shape)


def t_derived():
    d = UE.PuertsTestDerived()
    eq(d.DerivedValue, 42)
    d.IntValue = 5
    eq(d.IntValue, 5)
    eq(d.WhoAmI(), 'Derived')
    eq(d.Add(1, 2), 3)


test('derived', t_derived)


def t_merge():
    puerts = f.puerts
    o = UE.PuertsTestObject()
    puerts.merge(o, {'IntValue': 5, 'StringValue': 'merged', 'NoSuchField': 1})
    eq(o.IntValue, 5)
    eq(o.StringValue, 'merged')

    s = UE.PuertsTestStruct()
    puerts.merge(s, {'X': 9, 'S': 'st'})
    eq(s.X, 9)
    eq(s.S, 'st')

    # a nested dict is merged into the struct property
    puerts.merge(o, {'StructValue': {'X': 4}})
    eq(o.StructValue.X, 4)

    # the keys which are not str are not merged
    puerts.merge(o, {1: 2, ('IntValue',): 100})
    eq(o.IntValue, 5)

    def merge_empty():
        puerts.merge(o, {})
        return o.IntValue

    observe('merge empty dict', merge_empty)

    def merge_number():
        puerts.merge(o, 1)
        return o.IntValue

    observe('merge number src', merge_number)

    class Plain:
        def __init__(self):
            self.IntValue = 100

    def merge_plain_object():
        puerts.merge(o, Plain())
        return o.IntValue

    observe('merge plain object src', merge_plain_object)


test('merge', t_merge)


def t_dict_to_struct():
    o = UE.PuertsTestObject()
    o.StructValue = {'X': 6, 'S': 'dct'}
    eq(o.StructValue.X, 6)
    eq(o.StructValue.S, 'dct')
    arr = o.StructArray
    arr.Add({'X': 7, 'S': 'a'})
    eq(arr.Num(), 1)
    eq(arr.Get(0).X, 7)
    eq(arr.Get(0).S, 'a')
    observe('struct parameter from dict', lambda: o.StructSum({'X': 8, 'S': 'e'}))


test('dict to struct', t_dict_to_struct)

f.run()
