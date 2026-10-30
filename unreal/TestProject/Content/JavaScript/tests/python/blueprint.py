# The python counterpart of tests/blueprint.js: blueprint classes and user defined structs changed and recompiled
# (editor only) while the script holds their classes. A struct instance does not live across a layout change.
f = require('tests/python/framework')
UE, test, step, eq, assert_, note, observe, catchError = f.UE, f.test, f.step, f.eq, f.assert_, f.note, f.observe, f.catchError
puerts = f.puerts

BP = UE.PuertsTestBlueprintUtils
Reporter = UE.PuertsTestReporter
tojs = puerts.blueprint.tojs
state = {}


def must(v, what):
    assert_(v, what + ' failed (needs the editor)')
    return v


# ---------------- blueprint class ----------------

def t_class_create():
    cls = must(BP.CreateBlueprintClass(UE.PuertsTestObject.StaticClass()), 'CreateBlueprintClass')
    with_score = must(BP.AddClassVariable(cls, 'Score', 'int'), 'AddClassVariable')
    observe('class: add variable keeps the UClass', lambda: with_score is cls)
    state['cls'] = cls
    state['Cls'] = tojs(cls)
    observe('class: tojs is cached', lambda: tojs(cls) is state['Cls'])
    observe('class: StaticClass', lambda: state['Cls'].StaticClass() is cls)
    observe('class: subclass of parent', lambda: issubclass(state['Cls'], UE.PuertsTestObject))
    a = state['Cls']()
    a.Score = 3
    a.IntValue = 5
    eq(a.Score, 3)
    eq(a.IntValue, 5)
    eq(a.Add(1, 2), 3)
    observe('class: isinstance', lambda: isinstance(a, state['Cls']) and isinstance(a, UE.PuertsTestObject))
    observe('class: instance GetClass', lambda: a.GetClass() is cls)
    note('class: merge', catchError(lambda: puerts.merge(a, {'Score': 10, 'IntValue': 11})))
    observe('class: merged', lambda: [a.Score, a.IntValue])
    state['a0'] = a


test('class: create', t_class_create)


def t_class_derived():
    child = must(BP.CreateBlueprintClass(state['cls']), 'CreateBlueprintClass(derived)')
    state['child'] = child
    state['Child'] = tojs(child)
    c = state['Child']()
    c.Score = 4
    eq(c.Score, 4)
    observe('derived: subclass of base blueprint', lambda: issubclass(state['Child'], state['Cls']))
    state['c0'] = c


test('class: create derived', t_class_derived)


def step_recompile():
    def t_recompile():
        cls = must(BP.RecompileClass(state['cls']), 'RecompileClass')
        observe('recompile: same UClass', lambda: cls is state['cls'])
        observe('recompile: same python class', lambda: tojs(cls) is state['Cls'])
        observe('recompile: old instance alive', lambda: Reporter.IsAlive(state['a0']))
        observe('recompile: old instance Score', lambda: state['a0'].Score)
        a = state['Cls']()
        a.Score = 6
        eq(a.Score, 6)

    test('class: recompile unchanged', t_recompile)

    def t_add():
        cls = must(BP.AddClassVariable(state['cls'], 'Label', 'string'), 'AddClassVariable')
        observe('add: same python class', lambda: tojs(cls) is state['Cls'])
        observe('add: has Label', lambda: BP.HasOwnProperty(cls, 'Label'))
        observe('add: Label on python class', lambda: hasattr(state['Cls'], 'Label'))
        a = state['Cls']()
        a.Score = 7
        observe('add: new instance Score', lambda: a.Score)
        observe('add: new instance Label', lambda: getattr(a, 'Label', '<missing>'))

        def write():
            a.Label = 'hello'

        note('add: write Label', catchError(write))
        observe('add: read Label after write', lambda: a.Label)
        state['a1'] = a
        m = state['Cls']()
        note('add: merge after recompile', catchError(lambda: puerts.merge(m, {'Score': 12, 'IntValue': 13, 'Label': 'm'})))
        observe('add: merged', lambda: [m.Score, m.IntValue])
        c = state['Child']()
        c.Score = 8
        observe('add: derived new instance Score', lambda: c.Score)

    test('class: add variable', t_add)


step(step_recompile)


def step_remove():
    def t_after_gc():
        observe('gc: first instance Score', lambda: state['a0'].Score)
        observe('gc: second instance Score', lambda: state['a1'].Score)
        observe('gc: derived instance alive', lambda: Reporter.IsAlive(state['c0']))

    test('class: instances after reinstancing and gc', t_after_gc)

    def t_remove():
        cls = must(BP.RemoveClassVariable(state['cls'], 'Score'), 'RemoveClassVariable')
        observe('remove: same python class', lambda: tojs(cls) is state['Cls'])
        a = state['Cls']()
        observe('remove: new instance read Score', lambda: a.Score)

        def write():
            a.Score = 1

        note('remove: new instance write Score', catchError(write))
        observe('remove: kept instance read Score', lambda: state['a1'].Score)
        m = state['Cls']()
        note('remove: merge', catchError(lambda: puerts.merge(m, {'Score': 1, 'IntValue': 2})))
        observe('remove: merged IntValue', lambda: m.IntValue)

    test('class: remove variable', t_remove)


step(step_remove)


def step_change():
    def t_change_type():
        cls = must(BP.ChangeClassVariableType(state['cls'], 'Label', 'int'), 'ChangeClassVariableType')
        observe('change type: property type', lambda: BP.PropertyTypeOf(cls, 'Label'))
        a = state['Cls']()

        def write():
            a.Label = 12

        note('change type: write int', catchError(write))
        observe('change type: read', lambda: a.Label)

    test('class: change variable type', t_change_type)

    def t_add_back():
        cls = must(BP.AddClassVariable(state['cls'], 'Score', 'float'), 'AddClassVariable')
        observe('add back: property type', lambda: BP.PropertyTypeOf(cls, 'Score'))
        a = state['Cls']()

        def write():
            a.Score = 1.5

        note('add back: write', catchError(write))
        observe('add back: read', lambda: a.Score)

    test('class: add the removed variable back with another type', t_add_back)


step(step_change)


def step_end():
    def t_end():
        observe('end: tojs', lambda: tojs(state['cls']) is state['Cls'])
        observe('end: derived tojs', lambda: tojs(state['child']) is state['Child'])
        c = state['Child']()
        observe('end: derived GetClass', lambda: c.GetClass() is state['child'])
        c.IntValue = 9
        eq(c.IntValue, 9)
        state['a0'] = state['a1'] = state['c0'] = None

    test('class: identity at the end', t_end)


step(step_end)


# ---------------- user defined struct ----------------

def t_struct_create():
    s = must(BP.CreateUserStruct('Value', 'int'), 'CreateUserStruct')
    state['S'] = s
    state['St'] = tojs(s)
    observe('struct: tojs is cached', lambda: tojs(s) is state['St'])
    v = state['St']()
    observe('struct: default Value', lambda: v.Value)
    v.Value = 7
    eq(v.Value, 7)
    arr = UE.NewArray(state['St'])
    arr.Add(v)
    observe('struct: copied into array', lambda: arr.Get(0).Value)
    note('struct: dict into array', catchError(lambda: arr.Add({'Value': 3})))
    observe('struct: dict element', lambda: arr.Get(1).Value)
    note('struct: merge', catchError(lambda: puerts.merge(v, {'Value': 21})))
    observe('struct: merged', lambda: v.Value)


test('struct: create', t_struct_create)


def step_struct_add():
    def t_add():
        must(BP.AddUserStructVariable(state['S'], 'Extra', 'string'), 'AddUserStructVariable')
        observe('struct add: same python class', lambda: tojs(state['S']) is state['St'])
        v = state['St']()
        v.Value = 2
        observe('struct add: Value', lambda: v.Value)
        observe('struct add: Extra', lambda: getattr(v, 'Extra', '<missing>'))
        arr = UE.NewArray(state['St'])
        note('struct add: dict into array', catchError(lambda: arr.Add({'Value': 4, 'Extra': 'x'})))
        observe('struct add: element Value', lambda: arr.Get(0).Value)
        # containers made after the layout change must use the new element size, or the elements overlap and the strings of
        # Extra are corrupted (crash at the destruction by Empty)
        many = UE.NewArray(state['St'])
        for i in range(1, 9):
            many.Add({'Value': i, 'Extra': 'a string long enough to be allocated %d' % i})

        def values(a):
            return ','.join(str(a.Get(i).Value) for i in range(a.Num()))

        observe('struct add: many elements', lambda: values(many))
        many.RemoveAt(0)
        many.Add({'Value': 9, 'Extra': 'last'})
        observe('struct add: many elements after remove', lambda: values(many))
        many.Empty()
        observe('struct add: emptied', lambda: many.Num())
        m = UE.NewMap(UE.BuiltinString, state['St'])
        for i in range(1, 5):
            m.Add('k%d' % i, {'Value': i * 10, 'Extra': 'map value string %d' % i})
        observe('struct add: map values', lambda: ','.join(str(m.Get('k%d' % i).Value) for i in range(1, 5)))
        m.Empty()

    test('struct: add variable', t_add)


step(step_struct_add)


def step_struct_rename():
    def t_rename():
        must(BP.RenameUserStructVariable(state['S'], 'Value', 'Amount'), 'RenameUserStructVariable')
        v = state['St']()
        observe('struct rename: Value', lambda: v.Value)
        observe('struct rename: Amount', lambda: getattr(v, 'Amount', '<missing>'))
        note('struct rename: merge', catchError(lambda: puerts.merge(v, {'Value': 1, 'Amount': 2})))

    test('struct: rename variable', t_rename)


step(step_struct_rename)


def step_struct_remove():
    def t_remove():
        must(BP.ChangeUserStructVariableType(state['S'], 'Extra', 'int'), 'ChangeUserStructVariableType')
        must(BP.RemoveUserStructVariable(state['S'], 'Extra'), 'RemoveUserStructVariable')
        observe('struct remove: has Extra', lambda: BP.HasOwnProperty(state['S'], 'Extra'))
        v = state['St']()
        observe('struct remove: Value', lambda: v.Value)
        arr = UE.NewArray(state['St'])
        note('struct remove: dict into array', catchError(lambda: arr.Add({'Extra': 1})))
        observe('struct remove: array length', lambda: arr.Num())

    test('struct: change type and remove', t_remove)


step(step_struct_remove)

f.run()
