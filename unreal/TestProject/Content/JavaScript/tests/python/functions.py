f = require('tests/python/framework')
UE, puerts, test, eq, assert_, observe = f.UE, f.puerts, f.test, f.eq, f.assert_, f.observe
ref, unref = puerts.ref, puerts.unref

obj = UE.PuertsTestObject()


def t_member_call():
    eq(obj.Add(1, 2), 3)
    eq(obj.Concat('a', 'b'), 'ab')


test('member call', t_member_call)


def t_static_call():
    eq(UE.PuertsTestObject.StaticAdd(4, 5), 9)
    observe('static via instance', lambda: obj.StaticAdd(4, 5))


test('static call', t_static_call)


def t_return_struct():
    s = obj.MakeStruct(3, 'x')
    eq(s.X, 3)
    eq(s.S, 'x')
    eq(s.Arr.Num(), 3)
    eq(s.Arr.Get(2), 5)


test('return struct', t_return_struct)


def t_struct_param():
    s = UE.PuertsTestStruct()
    s.X = 1
    s.Arr.Add(2)
    s.Arr.Add(3)
    eq(obj.StructSum(s), 6)


test('struct param', t_struct_param)


def t_out_params():
    i = ref(0)
    s = ref('')
    st = ref(UE.PuertsTestStruct())
    obj.OutParams(i, s, st)
    eq(unref(i), 7)
    eq(unref(s), 'out')
    eq(unref(st).X, 9)
    eq(unref(st).S, 'outstruct')

    def out_none():
        u = ref(None)
        obj.OutParams(ref(0), ref(''), u)
        v = unref(u)
        return v.X if v is not None else None

    observe('out struct ref None', out_none)


test('out params', t_out_params)


def t_ref_param():
    v = ref(41)
    obj.IncRef(v)
    eq(unref(v), 42)
    w = ref(1)
    puerts.setref(w, 9)
    obj.IncRef(w)
    eq(unref(w), 10)


test('ref param', t_ref_param)


def t_default_param():
    eq(obj.DefaultParam(3, 4), 304)
    observe('default param omitted', lambda: obj.DefaultParam(3))


test('default param', t_default_param)


def t_identity():
    assert_(obj.GetSelf() is obj, 'GetSelf returns same python object')
    c = obj.CreateChild()
    assert_(c is not obj.CreateChild(), 'distinct children')
    eq(c.GetOuter() is obj, True, 'outer')


test('object return identity', t_identity)


def t_array_param():
    a = UE.NewArray(UE.BuiltinInt)
    a.Add(1)
    a.Add(2)
    a.Add(3)
    eq(obj.SumArray(a), 6)
    out = ref(UE.NewArray(UE.BuiltinInt))
    obj.FillArray(out, 4)
    filled = unref(out)
    eq(filled.Num(), 4)
    eq(filled.Get(3), 3)


test('array param', t_array_param)


def t_map_return():
    m = obj.MakeMap(3)
    eq(m.Num(), 3)
    eq(m.Get('k2'), 2)


test('map return', t_map_return)


def t_enum():
    eq(obj.NextEnum(UE.EPuertsTestEnum.A), UE.EPuertsTestEnum.B)
    eq(obj.NextEnum(UE.EPuertsTestEnum.B), UE.EPuertsTestEnum.C)


test('enum param/return', t_enum)


def t_text():
    eq(obj.MakeText('t'), 't')


test('text return', t_text)


def t_native_event():
    eq(obj.CallNativeEvent('a'), 'native:a')
    observe('impl event without override', lambda: obj.CallImplEvent(1))


test('native event default', t_native_event)


def t_shape():
    observe('method type', lambda: type(obj.Add).__name__)
    observe('method called on the class', lambda: UE.PuertsTestObject.Add(obj, 1, 2))
    observe('method called on the class without instance', lambda: UE.PuertsTestObject.Add())
    observe('static function type', lambda: type(UE.PuertsTestObject.StaticAdd).__name__)
    observe('keyword arguments', lambda: obj.Add(1, B=2))


test('function shape', t_shape)


def t_ue_builtin():
    eq(UE.KismetMathLibrary.Add_IntInt(2, 3), 5)
    observe('GameplayStatics available', lambda: UE.GameplayStatics is not None)


test('UE builtin', t_ue_builtin)

f.run()
