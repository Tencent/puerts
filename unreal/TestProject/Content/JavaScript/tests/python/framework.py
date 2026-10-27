# Minimal test framework shared by tests/python/*.py (the python counterpart of tests/lua/framework.lua).
# - test(name, fn): register a case in the current step
# - step(fn): cases registered inside fn run in the next step; C++ runs a python full GC + UE GC between steps
# - note(key, value): record an observed behaviour; notes are compared with Baseline/Python/<Test>.txt

import math
import re
import traceback

puerts = require('puerts')
UE = require('ue')
reporter = puerts.argv.getByName('Reporter')

_steps = [[]]
_registering = [0]


def test(name, fn):
    _steps[_registering[0]].append((name, fn))


def step(fn):
    saved = _registering[0]
    _steps.append([])
    _registering[0] = len(_steps) - 1
    fn()
    _registering[0] = saved


_PATH_RE = re.compile(r'[^\s\'"]*JavaScript[\\/]')


# the absolute paths of the scripts are replaced by <js-root>
def normalizePath(s):
    return _PATH_RE.sub('<js-root>/', s).replace('\\', '/')


def fmt(v):
    if v is None:
        return 'None'
    if isinstance(v, bool):
        return repr(v)
    if isinstance(v, float) and math.isnan(v):
        return 'nan'
    if isinstance(v, (int, float, str)):
        return repr(v)
    if isinstance(v, type):
        return '<class ' + v.__name__ + '>'
    if type(v).__module__ == 'puerts':
        return '<' + type(v).__name__ + '>'
    if isinstance(v, (list, tuple)):
        return '[' + ', '.join(fmt(x) for x in v) + ']'
    if isinstance(v, dict):
        return '{' + ', '.join(str(k) + ': ' + fmt(v[k]) for k in sorted(v, key=str)) + '}'
    if callable(v):
        return 'function'
    return '<' + type(v).__name__ + '>'


def _same(a, b):
    if a is b or a == b:
        return True
    if isinstance(a, float) and isinstance(b, float) and math.isnan(a) and math.isnan(b):
        return True
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(_same(x, y) for x, y in zip(a, b))
    return False


def eq(actual, expected, msg=None):
    if not _same(actual, expected):
        raise AssertionError((msg + ': ' if msg else '') + 'expected ' + fmt(expected) + ', got ' + fmt(actual))


def near(actual, expected, eps=1e-6, msg=None):
    if not isinstance(actual, (int, float)) or abs(actual - expected) > eps:
        raise AssertionError((msg + ': ' if msg else '') + 'expected ~' + str(expected) + ', got ' + fmt(actual))


def assert_(cond, msg=None):
    if not cond:
        raise AssertionError(msg or 'assertion failed')


def errorText(e):
    # a baseline line per note
    text = type(e).__name__ + ': ' + str(e)
    return re.sub(r'\s*\n\s*', ' | ', normalizePath(text))


# returns the message of the error fn raises, or "<no throw>"
def catchError(fn):
    try:
        fn()
    except Exception as e:
        return errorText(e)
    return '<no throw>'


def note(key, value):
    reporter.Note(key + ': ' + (value if isinstance(value, str) else fmt(value)))


# note the result of fn(), or the error it raises
def observe(key, fn):
    try:
        text = fmt(fn())
    except Exception as e:
        text = 'throws ' + errorText(e)
    reporter.Note(key + ': ' + text)


def _run_step(index):
    for name, fn in _steps[index]:
        try:
            fn()
        except Exception:
            reporter.Fail(name, normalizePath(traceback.format_exc()))
        else:
            reporter.Pass(name)
    reporter.FinishedSteps = index + 1


def run():
    reporter.StepCount = len(_steps)
    if len(_steps) > 1:
        reporter.OnStep.Bind(lambda i: _run_step(i))
    _run_step(0)
