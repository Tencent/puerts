# Calling C# from Python

> 💡 PuerTS 3.0 also supports [JavaScript](./js2cs.md) and [Lua](./lua2cs.md) calling C#, each with different syntax. Click the links to see the corresponding tutorials.

In the previous section, we tried a simple Hello World:

```csharp
// Hello World
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval("print('hello world')");
    env.Dispose();
}
```

In fact, `print()` here is intercepted by PuerTS and actually calls `UnityEngine.Debug.Log` to print to the Unity console.

With PuerTS, the integration between Python and C# can go much further. Keep reading:

------------------
### Accessing C# Types

There are two ways to access C# types from Python:

**Method 1: Using `import` syntax (Recommended)**

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
# directly import a class
import Puerts.UnitTest.TestHelper as TestHelper

# import from a namespace
from UnityEngine import Vector3, Debug

# import a namespace (access classes via namespace proxy)
import System.Diagnostics
System.Diagnostics.Debug.WriteLine('Test')

# import a namespace with alias
import System.Diagnostics as Diagnostics
Diagnostics.Debug.WriteLine('Test')
''')
");
    env.Dispose();
}
```

PuerTS extends Python's `import` mechanism to directly import C# namespaces and types. You can use standard Python `import` / `from ... import` / `import ... as` syntax.

> ⚠️ **Note**: Accessing a non-existent namespace or type will throw a `ModuleNotFoundError` exception.

------------------
### Creating Objects

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import UnityEngine.Vector3 as Vector3

# Python does not use 'new', just call the constructor directly
v = Vector3(1, 2, 3)
print(v)
# output: (1.0, 2.0, 3.0)
''')
");
    env.Dispose();
}
```

Unlike JavaScript, Python does **not require the `new` keyword** to create C# objects. Just call the class name like a function. This is consistent with Python's own object creation convention.

------------------------------------
### Property Access

Once an object is created, calling methods and accessing properties is straightforward. In Python, **dot syntax is used uniformly** (no distinction between instance and static methods):

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import UnityEngine.Debug as Debug
import UnityEngine.Rect as Rect
import UnityEngine.Vector2 as Vector2

# call static method
Debug.Log('Hello World')

# create object and call instance method
rect = Rect(0, 0, 2, 2)
Debug.Log(rect.Contains(Vector2.one))  # True

# set property
rect.width = 0.1
Debug.Log(rect.Contains(Vector2.one))  # False
''')
");
    env.Dispose();
}
```

As you can see, both static and instance methods use **dot syntax** in Python, which is simpler than Lua's colon/dot distinction.

---------------------
### ref and out Parameters

C# `ref` and `out` parameters are handled in Python using **list** as a container:

```csharp
class Example4 {
    public static double InOutArgFunc(int a, out int b, ref int c)
    {
        Debug.Log("a=" + a + ",c=" + c);
        b = 100;
        c = c * 2;
        return a + b;
    }
}

void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import Example4

# use list as ref/out container
# out parameter: use [None] or any initial value
outRef = [None]
# ref parameter: use [initial_value]
refRef = [10]

ret = Example4.InOutArgFunc(100, outRef, refRef)

# access result via index [0]
print('ret=' + str(ret) + ', out=' + str(outRef[0]) + ', ref=' + str(refRef[0]))
# ret=200.0, out=100, ref=20
''')
");
    env.Dispose();
}
```

| Parameter Type | Python Input | Get Result |
|---------------|-------------|------------|
| `out` | `[None]` or `[initial_value]` | `outRef[0]` |
| `ref` | `[initial_value]` | `refRef[0]` |

Unlike JS's `puer.$ref()` / `puer.$unref()` and Lua's table `{}` / `[1]`, Python uses native lists as containers, accessing results via **index `[0]`**.

----------------------------
### Generics

PuerTS supports Python-style square-bracket syntax for instantiating generic types, similar to the `list[int]` syntax in the Python standard library:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
from System.Collections.Generic import List
from System import Int32

# use square bracket syntax to create generic type: List<int>
List_Int32 = List[Int32]
ls = List_Int32()
ls.Add(1)
ls.Add(2)
ls.Add(3)

print(ls.Count)  # 3
''')
");
    env.Dispose();
}
```

The following import syntaxes are equivalent:

```python
import System.Collections.Generic.List as List
from System.Collections.Generic import List
```

You can also directly use syntax like `List[System.String]` to create a generic type.

For multiple type arguments, separate them with commas: `Dictionary[String, Int32]`.

----------------------------
### Nested Types

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
from Puerts.UnitTest import TestNestedTypes
from System import Int32, String

# access nested class as an attribute of the outer class
InnerClassA = TestNestedTypes.InnerClassA
x = InnerClassA()
print(x.Foo)  # Hello

# access generic nested class
InnerClassB = TestNestedTypes.InnerClassB[Int32]
y = InnerClassB()
print(y.Bar)  # Hello

InnerClassB = TestNestedTypes.InnerClassB[Int32, String]
z = InnerClassB()
print(z.Bar)  # Hello
''')
");
    env.Dispose();
}
```

----------------------------
### Array and Indexer Access

C# `[]` operators (including array indexing, `List` indexing, `Dictionary` indexing, and any custom indexer) **cannot** be accessed directly with Python `[]` syntax for C# objects. You must use `get_Item()` / `set_Item()`:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import System
from System.Collections.Generic import List, Dictionary

# create C# array
arr = System.Array.CreateInstance(puerts.typeof(System.Int32), 3)
arr.set_Item(0, 42)            # equivalent to C#: arr[0] = 42
val = arr.get_Item(0)          # equivalent to C#: val = arr[0]
print(val)                     # 42

# also applies to List<T>
ListInt = List[System.Int32]
lst = ListInt()
lst.Add(10)
first = lst.get_Item(0)       # equivalent to C#: lst[0]
lst.set_Item(0, 20)           # equivalent to C#: lst[0] = 20

# also applies to Dictionary<TKey, TValue>
DictStrInt = Dictionary[System.String, System.Int32]
d = DictStrInt()
d.set_Item('key', 100)        # equivalent to C#: dict['key'] = 100
v = d.get_Item('key')         # equivalent to C#: v = dict['key']
''')
");
    env.Dispose();
}
```

> ⚠️ **Important**: Although Python native `[]` is used for Python lists/dicts, index access on C# objects must use `get_Item()` / `set_Item()`. This is consistent with JS and Lua rules.

----------------------------
### typeof

C#'s `typeof` is implemented in Python via `puerts.typeof()`:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import UnityEngine.GameObject as GameObject
import UnityEngine.ParticleSystem as ParticleSystem

go = GameObject('testObject')
go.AddComponent(puerts.typeof(ParticleSystem))
''')
");
    env.Dispose();
}
```

`puerts.typeof()` returns a C# `System.Type` object, equivalent to `typeof(ParticleSystem)` in C#.

----------------------------
### Enums

Accessing C# enums in Python works the same as accessing regular classes — just use `import` or `puerts.load_type()`:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import Puerts.UnitTest.CrossLangTestHelper as CrossLangTestHelper
import Puerts.UnitTest.TestEnum as TestEnum

helper = CrossLangTestHelper()

# read enum field
fstart = helper.EnumField

# set enum field
helper.EnumField = TestEnum.A

fend = helper.EnumField
print(fstart, fend)
''')
");
    env.Dispose();
}
```

----------------------------
### Operator Overloading

Similar to JavaScript and Lua, Python uses `op_Xxxx` method names to call C# operator overloads:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import UnityEngine.Vector3 as Vector3

ret = Vector3.op_Multiply(Vector3.up, 1600)
print(ret)  # (0.0, 1600.0, 0.0)
''')
");
    env.Dispose();
}
```

----------------------------
### Method Overloading

C# method overloading works normally in Python. PuerTS automatically selects the correct overload based on the argument types:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import Puerts.UnitTest.OverloadTestObject as OverloadTestObject

o = OverloadTestObject()
o.WithObjectParam('tt')   # calls string overload
o.WithObjectParam(888)    # calls int overload
''')
");
    env.Dispose();
}
```

----------------------------
### Passing null

In Python, use `None` to represent C#'s `null`:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import Puerts.UnitTest.TestHelper as TestHelper

testHelper = TestHelper.GetInstance()
testHelper.PassStr(None)   # pass null for string parameter
testHelper.PassObj(None)   # pass null for object parameter
''')
");
    env.Dispose();
}
```

----------------------------
### Write-Only Properties

C# write-only properties can be set normally in Python, but attempting to read them will throw an exception:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import Puerts.UnitTest.TestObject as TestObject

o = TestObject(1)
o.WriteOnly = 2           # OK: set write-only property
TestObject.StaticWriteOnly = 3  # OK: set static write-only property
# o.WriteOnly              # Error: cannot read write-only property
''')
");
    env.Dispose();
}
```

----------------------------
### Structs

C# structs are used in Python exactly the same way as classes:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    var ret = env.Eval<string>(
        @"puerts.load_type('Puerts.UnitTest.TestStruct2')(5345, 3214, 'fqpziq').ToString()"
    );
    // ret = "5345:3214:fqpziq"
    env.Dispose();
}
```

----------------------------
### Iterators

Use `puerts.gen_iterator()` to convert C# iterable objects (objects implementing `IEnumerable`) into Python iterators, so you can use Python `for ... in` loops:

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
from System.Collections.Generic import List
from System import Int32

List_Int32 = List[Int32]
myList = List_Int32()
myList.Add(1)
myList.Add(2)
myList.Add(3)

# convert C# IEnumerable to Python iterator
iter = puerts.gen_iterator(myList)
result = []
for i in iter:
    result.append(i)

print(result)  # [1, 2, 3]
''')
");
    env.Dispose();
}
```

`puerts.gen_iterator()` internally calls the object's `GetEnumerator()` method and wraps it as an iterator object that supports Python iteration protocol (`__iter__` / `__next__`).

-------------
This section covers calling C# from Python. In the next section, we'll go the other direction: [Invoking Python from C#](./cs2python.md).

> 📖 Other language tutorials for calling C#: [JS to C#](./js2cs.md) | [Lua to C#](./lua2cs.md) | [Multi-Language Comparison Cheat Sheet](./lang-comparison.md)
