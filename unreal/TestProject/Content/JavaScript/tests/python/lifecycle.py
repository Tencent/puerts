import weakref

f = require('tests/python/framework')
UE, test, step, eq, assert_, observe = f.UE, f.test, f.step, f.eq, f.assert_, f.observe

Obj = UE.PuertsTestObject
Reporter = UE.PuertsTestReporter
state = {}


# objects created by python and dropped are released (reference counting) and then collected by the UE GC
def t_create_and_drop():
    state['before'] = Obj.GetLiveCount()
    for _ in range(10):
        o = Obj()
        o.IntValue = 1
    assert_(Obj.GetLiveCount() >= state['before'] + 10, 'created')


test('create and drop', t_create_and_drop)


# an object referenced by python stays alive
def t_kept():
    state['kept'] = Obj()
    state['kept'].IntValue = 77
    state['keptLive'] = Obj.GetLiveCount()


test('kept by python', t_kept)


# the python object of an UObject is cached (the same object) while it is referenced
def t_identity():
    o = Obj()
    assert_(o.GetSelf() is o, 'same object')
    state['weak'] = weakref.ref(o.GetSelf())


test('identity cache', t_identity)


# structs are owned by python
def t_struct_lifetime():
    state['countedBefore'] = Obj.GetCountedLiveCount()
    holder = Obj()
    for i in range(1, 6):
        holder.MakeCounted(i)
    state['keptStruct'] = holder.MakeCounted(42)


test('struct lifetime', t_struct_lifetime)


# an object destroyed by UE (MarkGarbage + GC) while python references it
def t_destroyed():
    state['dead'] = Obj()
    Reporter.MarkGarbage(state['dead'])


test('destroyed by UE', t_destroyed)


def step2():
    def t_collected():
        observe('live count back to before', lambda: Obj.GetLiveCount() <= state['before'] + 3)

    test('dropped objects collected', t_collected)

    def t_kept_alive():
        eq(state['kept'].IntValue, 77)
        eq(Reporter.IsAlive(state['kept']), True)

    test('kept object alive', t_kept_alive)

    def t_weak():
        observe('weak entry after gc', lambda: state['weak']())

    test('weak cache cleared', t_weak)

    def t_structs():
        eq(state['keptStruct'].V, 42)
        observe('counted structs alive', lambda: Obj.GetCountedLiveCount() - state['countedBefore'])
        state['keptStruct'] = None

    test('structs collected', t_structs)

    def t_access_destroyed():
        observe('IsAlive', lambda: Reporter.IsAlive(state['dead']))
        observe('read property of destroyed', lambda: state['dead'].IntValue)
        observe('call method of destroyed', lambda: state['dead'].Add(1, 2))
        state['dead'] = None

    test('access destroyed object', t_access_destroyed)


step(step2)


def step3():
    def t_released():
        observe('counted structs alive after release', lambda: Obj.GetCountedLiveCount() - state['countedBefore'])

    test('struct released', t_released)


step(step3)

f.run()
