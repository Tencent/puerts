import builtins
import sys

f = require('tests/python/framework')
UE, puerts, test, eq, assert_, note, observe, catchError = (
    f.UE, f.puerts, f.test, f.eq, f.assert_, f.note, f.observe, f.catchError)


def t_require():
    a = require('tests/python/modules_data/mod_a')
    eq(a.name, 'mod_a')
    eq(a.b.value, 2, 'nested require')
    assert_(require('tests/python/modules_data/mod_a') is a, 'cached')


test('require python module', t_require)


def t_dotted():
    note('dotted name without packages', catchError(lambda: require('tests.python.modules_data.mod_b')))
    pkg = require('tests/python/modules_data/pkg')
    eq(pkg.name, 'pkg')
    sub = require('tests/python/modules_data/pkg.sub')
    eq(sub.value, 3)
    observe('submodule is an attribute of the package', lambda: pkg.sub is sub)
    observe('relative import in the package', lambda: pkg.relative())


test('dotted name', t_dotted)


def t_extension():
    observe('require with .py', lambda: require('tests/python/modules_data/mod_b.py').value)


test('with extension', t_extension)


def t_import_statement():
    def do_import():
        mod = __import__('tests/python/modules_data/mod_b')
        return mod.value

    observe('__import__', do_import)


test('import statement', t_import_statement)


def t_module_arguments():
    args = require('tests/python/modules_data/args')
    eq(args.name, 'tests/python/modules_data/args')
    note('path', f.normalizePath(args.path))


test('module arguments', t_module_arguments)


def t_builtin_modules():
    assert_(require('puerts') is puerts, 'puerts')
    assert_(require('ue') is UE, 'ue')
    assert_(require('ue') is builtins.UE, 'builtins UE')
    puerts.registerBuildinModule('my_builtin', {'v': 1})
    eq(require('my_builtin')['v'], 1)
    observe('stdlib', lambda: require('json').dumps([1]))


test('builtin modules', t_builtin_modules)


def t_missing():
    note('missing', catchError(lambda: require('tests/python/modules_data/no_such_module')))


test('missing module', t_missing)


def t_syntax_error():
    note('syntax error', catchError(lambda: require('tests/python/modules_data/syntax_err')))


test('syntax error', t_syntax_error)


def t_throwing():
    note('throws', catchError(lambda: require('tests/python/modules_data/throws')))
    observe('not cached after throw', lambda: sys.modules.get('tests/python/modules_data/throws'))


test('throwing module', t_throwing)


def t_globals():
    observe('finder', lambda: type(sys.meta_path[-1]).__name__)
    observe('console', lambda: type(console.log).__name__)
    observe('host globals removed', lambda: [not hasattr(builtins, '__tgjsNewObject'),
                                             not hasattr(builtins, '__tgjsMixin')])
    observe('_puerts_init left in __main__', lambda: hasattr(sys.modules['__main__'], '_puerts_init'))


test('globals', t_globals)

f.run()
