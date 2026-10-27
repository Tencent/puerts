# Tencent is pleased to support the open source community by making Puerts available.
# Copyright (C) 2020 Tencent.  All rights reserved.
# Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms.
# This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.

# the bootstrap script of the python backend (PapiPython), evaluated in __main__ by the host (FPapiBackendPython::OnEnter)
# after it bound its functions to builtins. The python counterpart of puerts/init.lua: print/console, the module finder of
# the host, puerts.argv, UE/CPP and the helpers used by the host. Everything is done inside _puerts_init (removed at the end)
# so that __main__ is left clean


def _puerts_init():
    import builtins
    import importlib
    import importlib.abc
    import importlib.util
    import sys

    puerts = builtins.puerts

    def take(name):
        # a function bound by the host to builtins, removed from there
        value = getattr(builtins, name, None)
        try:
            delattr(builtins, name)
        except AttributeError:
            pass
        return value

    def rawget(obj, name):
        # the attribute of the object itself (not inherited from a base class)
        d = getattr(obj, '__dict__', None)
        if d is None:
            return None
        return d.get(name)

    # -------------------------------------------------------------------------------------------------------------------
    # log
    # -------------------------------------------------------------------------------------------------------------------
    tgjs_log = getattr(builtins, '__tgjsLog')

    def make_log(level):
        def log(*args, sep=' ', end=None, file=None, flush=False):
            tgjs_log(level, sep.join(str(a) for a in args))
        return log

    builtins.print = make_log(0)

    class Console:
        log = staticmethod(make_log(0))
        info = staticmethod(make_log(1))
        warn = staticmethod(make_log(2))
        error = staticmethod(make_log(3))

    builtins.console = Console()

    # -------------------------------------------------------------------------------------------------------------------
    # module system: the sources are resolved and loaded by the host (the same module loader as js), the name of a module
    # is its specifier ('a/b/c', or 'a.b.c' if a and a.b are packages, a/__init__.py and a/b/__init__.py)
    # -------------------------------------------------------------------------------------------------------------------
    host_resolve = getattr(builtins, '__puer_host_resolve__')
    host_load = getattr(builtins, '__puer_host_load__')

    class PuertsLoader(importlib.abc.Loader):
        def __init__(self, url):
            self.url = url

        def create_module(self, spec):
            return None

        def exec_module(self, module):
            m = host_load(self.url, 'require')
            code = compile(m.content, m.debugPath, 'exec', dont_inherit=True)
            exec(code, module.__dict__)

    class PuertsFinder(importlib.abc.MetaPathFinder):
        def find_spec(self, fullname, path=None, target=None):
            base = fullname.replace('.', '/')
            errors = []
            for spec, is_package in ((base + '.py', False), (base + '/__init__.py', True)):
                try:
                    url = host_resolve(spec, '', 'require')
                except Exception as e:
                    errors.append(str(e))
                    continue
                module_spec = importlib.util.spec_from_loader(fullname, PuertsLoader(url), origin=url,
                                                              is_package=is_package)
                module_spec.has_location = True
                if is_package:
                    # empty: the submodules are found by this finder (the host loader), not by the path finder of python
                    # (which would read the files directly and write __pycache__)
                    module_spec.submodule_search_locations = []
                return module_spec
            raise ModuleNotFoundError('No module named %r: %s' % (fullname, errors[0] if errors else ''), name=fullname)

    sys.meta_path.append(PuertsFinder())

    def require(spec):
        if spec.endswith('.py'):
            spec = spec[:-3]
        return importlib.import_module(spec)

    builtins.require = require

    def register_buildin_module(name, value):
        sys.modules[name] = value

    puerts.registerBuildinModule = register_buildin_module
    sys.modules['puerts'] = puerts

    # -------------------------------------------------------------------------------------------------------------------
    # argv
    # -------------------------------------------------------------------------------------------------------------------
    arg_list = []
    arg_map = {}

    class Argv:
        # 0 based, as js
        @staticmethod
        def getByIndex(index):
            return arg_list[index] if 0 <= index < len(arg_list) else None

        @staticmethod
        def getByName(name):
            return arg_map.get(name)

        @staticmethod
        def add(name, value):
            arg_list.append(value)
            arg_map[name] = value

    puerts.argv = Argv()

    # -------------------------------------------------------------------------------------------------------------------
    # UE / CPP
    # -------------------------------------------------------------------------------------------------------------------
    def lazy_namespace(type_name, loader):
        def getattr_(self, name):
            if name.startswith('__'):
                raise AttributeError(name)
            value = loader(name)
            setattr(self, name, value)
            return value

        return type(type_name, (), {'__getattr__': getattr_, '__repr__': lambda self: '<' + type_name + '>'})()

    UE = lazy_namespace('UE', puerts.loadUEType)
    CPP = lazy_namespace('CPP', puerts.loadCPPType)

    sys.modules['ue'] = UE
    sys.modules['cpp'] = CPP
    builtins.UE = UE
    builtins.CPP = CPP

    UE.NewObject = take('__tgjsNewObject')
    UE.NewStruct = take('__tgjsNewStruct')
    UE.MakeWeakObjectPtr = take('__tgjsMakeWeakObjectPtr')
    UE.FNameLiteral = take('__tgjsFNameToArrayBuffer')

    # a ref is a list with the value at [0] (index 0 of js)
    puerts.ref = lambda x: [x]
    puerts.unref = lambda r: r[0]

    def setref(r, x):
        r[0] = x

    puerts.setref = setref

    puerts.merge = take('__tgjsMergeObject')
    puerts.setJsTakeRef = take('__tgjsSetJsTakeRef')
    # classes of the script can not be injected into UE in python
    take('__tgjsMakeUClass')
    take('__tgjsMixin')

    ue_class_to_js_class = take('__tgjsUEClassToJSClass')

    # blueprint
    TNAMESPACE, TENUM, TBLUEPRINT, TSTRUCT = 0, 1, 2, 3

    def node_path(node, tail):
        c = node
        while isinstance(c, BlueprintNode):
            tail = '/' + c._bp_path + tail
            c = c._bp_parent
        return tail

    def blueprint_load(cls):
        if not isinstance(cls, BlueprintNode):
            raise TypeError('argument #1 is not a unload type')
        name = cls._bp_path
        parent = cls._bp_parent
        path = node_path(parent, '.' + name)
        ufield = UE.Field.Load(path, True)
        if ufield is None:
            raise RuntimeError('load ' + path + ' fail!')
        pyclass = ue_class_to_js_class(ufield)
        setattr(pyclass, '__puerts_ufield', ufield)
        if parent is not None:
            setattr(pyclass, '_bp_parent', parent)
            setattr(pyclass, '_bp_name', name)
            setattr(parent, name, pyclass)
        return pyclass

    class BlueprintNode:
        def __init__(self, path, parent, node_type):
            self._bp_path = path
            self._bp_parent = parent
            self._bp_type = node_type

        def __repr__(self):
            return '<blueprint ' + node_path(self, '') + '>'

        def __getattr__(self, name):
            # called for the missing attributes only
            if name.startswith('__') or name.startswith('_bp_'):
                raise AttributeError(name)
            if self._bp_type == TENUM:
                res = BlueprintNode(name, self, TNAMESPACE)
                setattr(self, name, res)
                return blueprint_load(res)
            new_type = self._bp_type
            if new_type == TNAMESPACE:
                obj = UE.Object.Load(node_path(self, '/' + name + '.' + name), True)
                if obj is not None:
                    type_name = obj.GetClass().GetName()
                    if type_name == 'UserDefinedEnum':
                        new_type = TENUM
                    elif type_name == 'UserDefinedStruct':
                        new_type = TSTRUCT
                    else:
                        new_type = TBLUEPRINT
            res = BlueprintNode(name, self, new_type)
            setattr(self, name, res)
            return res

    UE.Game = BlueprintNode('Game', None, TNAMESPACE)

    bpns = {'Game'}

    class Blueprint:
        @staticmethod
        def namespace(ns):
            if ns not in bpns:
                setattr(UE, ns, BlueprintNode(ns, None, TNAMESPACE))
                bpns.add(ns)

        @staticmethod
        def unload(cls):
            if rawget(cls, '__puerts_ufield') is not None:
                delattr(cls, '__puerts_ufield')
                parent = rawget(cls, '_bp_parent')
                if parent is not None:
                    name = rawget(cls, '_bp_name')
                    setattr(parent, name, BlueprintNode(name, parent, TNAMESPACE))

        load = staticmethod(blueprint_load)
        tojs = staticmethod(ue_class_to_js_class)

    puerts.blueprint = Blueprint()

    # containers
    new_container = take('__tgjsNewContainer')

    def translate_type(t):
        if isinstance(t, int):
            return t
        ufield = rawget(t, '__puerts_ufield')
        if ufield is not None:
            return ufield
        return t.StaticClass()

    UE.BuiltinBool = 0
    UE.BuiltinByte = 1
    UE.BuiltinInt = 2
    UE.BuiltinFloat = 3
    UE.BuiltinDouble = 4
    UE.BuiltinInt64 = 5
    UE.BuiltinString = 6
    UE.BuiltinText = 7
    UE.BuiltinName = 8

    UE.NewArray = lambda t1: new_container(0, translate_type(t1))
    UE.NewSet = lambda t1: new_container(1, translate_type(t1))
    UE.NewMap = lambda t1, t2: new_container(2, translate_type(t1), translate_type(t2))

    # delegates
    puerts.toManualReleaseDelegate = lambda x: x
    puerts.toDelegate = lambda o, k: [o, k]

    # -------------------------------------------------------------------------------------------------------------------
    # the helpers used by the host
    # -------------------------------------------------------------------------------------------------------------------
    def merge_prototype(src, dst, exclude):
        items = getattr(src, '__dict__', None)
        if items is None:
            return
        for k, v in list(items.items()):
            if k.startswith('__'):
                continue
            if exclude is not None and getattr(exclude, k, None) is not None:
                continue
            setattr(dst, k, v)

    # the list of the functions bound to a multicast delegate
    def remove_list_item(lst, item):
        for i, v in enumerate(lst):
            if v == item:
                del lst[i]
                return

    def gen_list_apply(lst):
        def apply(*args):
            ret = None
            for fn in list(lst):
                ret = fn(*args)
            return ret

        return apply

    puerts.__mergePrototype = merge_prototype
    puerts.__removeListItem = remove_list_item
    puerts.__genListApply = gen_list_apply


_puerts_init()
del _puerts_init
