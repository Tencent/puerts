f = require('tests/python/framework')
UE, test, note, observe, catchError = f.UE, f.test, f.note, f.observe, f.catchError

obj = UE.PuertsTestObject()


def t_wrong_arguments():
    note('wrong arg type', catchError(lambda: obj.Add('a', 'b')))
    note('too few args', catchError(lambda: obj.Concat('a')))
    note('static with wrong args', catchError(lambda: UE.PuertsTestObject.StaticAdd('x')))


test('wrong arguments', t_wrong_arguments)


def t_wrong_property_values():
    def int_from_string():
        obj.IntValue = 'abc'

    def object_from_number():
        obj.ObjectValue = 1

    note('int from string', catchError(int_from_string))
    note('object from number', catchError(object_from_number))


test('wrong property values', t_wrong_property_values)


def t_missing_members():
    note('call missing method', catchError(lambda: obj.NoSuchMethod()))
    note('unknown class', catchError(lambda: UE.NoSuchClassAnywhere.StaticClass()))


test('missing members', t_missing_members)


def t_error_values():
    def raise_with_args():
        raise ValueError({'code': 1})

    def raise_non_exception():
        raise 1

    note('error with args', catchError(raise_with_args))
    note('raise a non exception', catchError(raise_non_exception))


test('error values', t_error_values)

f.run()
