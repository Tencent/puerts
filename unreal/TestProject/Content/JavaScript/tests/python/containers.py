f = require('tests/python/framework')
UE, test, eq, assert_, note, observe, catchError = f.UE, f.test, f.eq, f.assert_, f.note, f.observe, f.catchError

obj = UE.PuertsTestObject()


def t_array_property():
    a = obj.IntArray
    eq(a.Num(), 0)
    a.Add(1)
    a.Add(2)
    a.Add(3)
    eq(obj.IntArray.Num(), 3, 'property returns a view, not a copy')
    eq(a.Get(1), 2)
    a.Set(1, 20)
    eq(obj.IntArray.Get(1), 20)
    eq(a.Contains(20), True)
    eq(a.FindIndex(3), 2)
    a.RemoveAt(0)
    eq(a.Num(), 2)
    eq(a.IsValidIndex(5), False)
    a.Empty()
    eq(a.Num(), 0)


test('array property', t_array_property)


def t_array_of_string():
    a = obj.StringArray
    a.Add('x')
    a.Add('y')
    eq(a.Get(1), 'y')


test('array of string', t_array_of_string)


def t_array_of_struct():
    a = obj.StructArray
    s = UE.PuertsTestStruct()
    s.X = 5
    a.Add(s)
    eq(a.Get(0).X, 5)

    def modify():
        a.Get(0).X = 6
        return a.Get(0).X

    observe('array struct element modify', modify)


test('array of struct', t_array_of_struct)


def t_out_of_range():
    observe('array get out of range', lambda: obj.IntArray.Get(100))


test('array out of range', t_out_of_range)


def t_array_assign():
    b = UE.NewArray(UE.BuiltinInt)
    b.Add(7)
    obj.IntArray = b
    eq(obj.IntArray.Num(), 1)
    b.Add(8)
    eq(obj.IntArray.Num(), 1, 'assignment copies')


test('array assign', t_array_assign)


def t_set():
    s = obj.StringSet
    s.Add('a')
    s.Add('b')
    s.Add('a')
    eq(s.Num(), 2)
    eq(s.Contains('b'), True)
    s.RemoveAt(s.FindIndex('b'))
    eq(s.Contains('b'), False)
    observe('set Get', lambda: s.Get(s.FindIndex('a')))


test('set', t_set)


def t_map():
    m = obj.StringIntMap
    m.Add('one', 1)
    m.Add('two', 2)
    eq(m.Num(), 2)
    eq(m.Get('two'), 2)
    m.Set('two', 22)
    eq(m.Get('two'), 22)
    observe('map get missing', lambda: m.Get('missing'))
    m.Remove('one')
    eq(m.Num(), 1)
    keys = []
    for i in range(m.GetMaxIndex() - 1, -1, -1):
        if m.IsValidIndex(i):
            keys.append(m.GetKey(i))
    eq(keys, ['two'])


test('map', t_map)


def t_new_containers():
    m = UE.NewMap(UE.BuiltinString, UE.PuertsTestStruct)
    s = UE.PuertsTestStruct()
    s.X = 1
    m.Add('a', s)
    eq(m.Get('a').X, 1)
    st = UE.NewSet(UE.BuiltinInt)
    st.Add(3)
    eq(st.Num(), 1)
    objs = UE.NewArray(UE.PuertsTestObject)
    objs.Add(obj)
    assert_(objs.Get(0) is obj, 'object element identity')


test('new containers', t_new_containers)


def t_shape():
    observe('array type', lambda: type(obj.IntArray).__name__)
    observe('array index', lambda: obj.IntArray[0])
    observe('array len', lambda: len(obj.IntArray))
    observe('array iterate', lambda: list(obj.IntArray))


test('container shape', t_shape)


def t_bad_types():
    note('NewArray unknown builtin', catchError(lambda: UE.NewArray(9999)))
    note('NewMap unknown value type', catchError(lambda: UE.NewMap(UE.BuiltinInt, 9999)))
    observe('NewArray of struct', lambda: UE.NewArray(UE.PuertsTestStruct).Num())
    observe('NewSet of object', lambda: UE.NewSet(UE.PuertsTestObject).Num())


test('new container bad types', t_bad_types)


def t_tojs():
    tojs = require('puerts').blueprint.tojs
    assert_(tojs(UE.PuertsTestObject.StaticClass()) is UE.PuertsTestObject, 'class')
    assert_(tojs(UE.PuertsTestStruct.StaticClass()) is UE.PuertsTestStruct, 'struct')
    observe('enum tojs type', lambda: type(tojs(UE.Enum.Load('/Script/PuertsTest.EPuertsTestEnum'))).__name__)
    note('tojs number', catchError(lambda: tojs(1)))


test('blueprint.tojs', t_tojs)

f.run()
