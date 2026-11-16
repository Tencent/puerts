f = require('tests/python/framework')
UE, puerts, test, step, eq, observe = f.UE, f.puerts, f.test, f.step, f.eq, f.observe

obj = UE.PuertsTestObject()


def t_single():
    eq(obj.CallIntDelegate(1), -1, 'unbound')
    obj.IntDelegate.Bind(lambda v: v * 2)
    eq(obj.IntDelegate.IsBound(), True)
    eq(obj.CallIntDelegate(21), 42)
    eq(obj.IntDelegate.Execute(5), 10, 'execute from python')
    obj.IntDelegate.Unbind()
    eq(obj.IntDelegate.IsBound(), False)
    eq(obj.CallIntDelegate(1), -1)


test('single delegate', t_single)


def t_rebind():
    obj.IntDelegate.Bind(lambda v: v + 1)
    obj.IntDelegate.Bind(lambda v: v + 2)
    eq(obj.CallIntDelegate(1), 3)
    obj.IntDelegate.Unbind()


test('rebind', t_rebind)


def t_multicast():
    got = []

    def f1(m):
        got.append('1' + m)

    def f2(m):
        got.append('2' + m)

    obj.Multicast.Add(f1)
    obj.Multicast.Add(f2)
    obj.BroadcastMulticast('a')
    obj.Multicast.Remove(f1)
    obj.BroadcastMulticast('b')
    obj.Multicast.Broadcast('c')
    obj.Multicast.Clear()
    obj.BroadcastMulticast('d')
    got.sort()
    eq(got, ['1a', '2a', '2b', '2c'])
    observe('multicast IsBound after clear', lambda: obj.Multicast.IsBound())


test('multicast', t_multicast)


def t_shape():
    observe('delegate same view', lambda: obj.IntDelegate == obj.IntDelegate)


test('delegate shape', t_shape)

# closure captured by a delegate must stay alive across GC while bound
state = {'captured': {'value': 100}}


def t_bind_closure():
    c = state['captured']
    obj.IntDelegate.Bind(lambda v: v + c['value'])
    state['captured'] = None


test('bind closure', t_bind_closure)


def step2():
    def t_survives():
        eq(obj.CallIntDelegate(1), 101)
        obj.IntDelegate.Unbind()

    test('closure survives gc', t_survives)


step(step2)

# ---------- python function passed as a delegate argument ----------
Reporter = UE.PuertsTestReporter


def t_function_argument():
    o = UE.PuertsTestObject()
    fn = puerts.toManualReleaseDelegate(lambda v: v * 3)
    o.SetIntDelegate(fn)
    eq(o.CallIntDelegate(4), 12)
    eq(o.IntDelegate.Execute(5), 15, 'execute the copied delegate from python')


test('function argument', t_function_argument)


def t_owner_function():
    owner = UE.PuertsTestObject()
    o = UE.PuertsTestObject()
    o.SetIntDelegate([owner, lambda v: v + 1000])
    eq(o.CallIntDelegate(1), 1001)
    Reporter.MarkGarbage(owner)
    state['autoRelease'] = o


test('function argument: [owner, function]', t_owner_function)


def t_object_ufunction():
    o = UE.PuertsTestObject()
    o.SetIntDelegate([o, 'Identity'])
    eq(o.CallIntDelegate(7), 7)
    observe('ufunction bound IsBound', lambda: o.IntDelegate.IsBound())


test('function argument: [object, ufunction name]', t_object_ufunction)


def t_bound_method():
    class Holder:
        def triple(self, v):
            return v * 3

    o = UE.PuertsTestObject()

    def bind_bound_method():
        o.SetIntDelegate(puerts.toManualReleaseDelegate(Holder().triple))
        return o.CallIntDelegate(2)

    observe('manual release bound method', bind_bound_method)


test('function argument: bound method', t_bound_method)


def t_copies():
    a = UE.PuertsTestObject()
    b = UE.PuertsTestObject()
    a.IntDelegate.Bind(lambda v: v - 1)
    b.SetIntDelegate(a.IntDelegate)
    eq(b.CallIntDelegate(10), 9)
    a.IntDelegate.Unbind()
    b.IntDelegate.Unbind()


test('delegate object argument copies', t_copies)


def t_void():
    o = UE.PuertsTestObject()
    got = []
    o.StepDelegate.Bind(lambda s: got.append(s))
    eq(o.CallStepDelegate(3), True)
    o.StepDelegate.Unbind()
    eq(o.CallStepDelegate(4), False)
    eq(got, [3])


test('void delegate signature', t_void)


def t_execute_unbound():
    o = UE.PuertsTestObject()
    observe('execute unbound single', lambda: o.IntDelegate.Execute(1))
    observe('broadcast empty multicast', lambda: o.Multicast.Broadcast('x'))


test('execute unbound', t_execute_unbound)


def t_multicast_edge():
    o = UE.PuertsTestObject()
    got = []

    def fn(m):
        got.append(m)

    o.Multicast.Add(fn)
    o.Multicast.Add(fn)
    o.BroadcastMulticast('twice')
    observe('same function added twice', lambda: len(got))
    o.Multicast.Remove(fn)
    o.BroadcastMulticast('after remove once')
    observe('after removing once', lambda: len(got))
    o.Multicast.Remove(fn)
    observe('multicast IsBound after removing all', lambda: o.Multicast.IsBound())
    o.Multicast.Clear()


test('multicast edge cases', t_multicast_edge)


def step3():
    def t_after_owner():
        observe('auto release call', lambda: state['autoRelease'].CallIntDelegate(1))

    test('[owner, function] after owner destroyed', t_after_owner)


step(step3)

f.run()
