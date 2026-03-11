# 在 Python 中调用 C#

> 💡 PuerTS 3.0 同时支持 [JavaScript](./js2cs.md) 和 [Lua](./lua2cs.md) 调用 C#，语法各有不同，可点击链接查看对应教程。

在上一篇中，我们简单试了一下 Hello World

```csharp
// Hello World
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval("print('hello world')");
    env.Dispose();
}
```

事实上，此处 `print()` 被 PuerTS 劫持了，实际会将字符串内容调用 `UnityEngine.Debug.Log` 打印。

在 PuerTS 的帮助下，Python 和 C# 的打通还可以更精彩，请往下看：

------------------
### 访问 C# 类型

Python 中有两种方式访问 C# 类型：

**方式一：使用 `import` 语法（推荐）**

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

PuerTS 为 Python 扩展了 `import` 机制，使其能够直接导入 C# 的命名空间和类型。你可以使用标准的 Python `import` / `from ... import` / `import ... as` 语法。

**方式二：使用 `puerts.load_type()` 动态加载**

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
# load a type by full name string
TestHelper = puerts.load_type('Puerts.UnitTest.TestHelper')
Vector3 = puerts.load_type('UnityEngine.Vector3')
''')
");
    env.Dispose();
}
```

`puerts.load_type()` 接受一个完整的类型名字符串，适合在需要动态加载类型或名称包含特殊字符（如嵌套类型的 `+` 号）时使用。

> ⚠️ **注意**：访问不存在的命名空间或类型会抛出 `ModuleNotFoundError` 异常。

------------------
### 对象创建

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

与 JavaScript 不同，Python 中创建 C# 对象**不需要 `new` 关键字**，直接像调用函数一样调用类名即可。这与 Python 自身的对象创建方式一致。

------------------------------------
### 属性访问

对象创建出来了，调用方法、访问属性也非常简单。Python 中**统一使用点号语法**（不区分实例方法和静态方法）：

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

可以看出，Python 侧不管是静态方法还是实例方法，都使用**点号语法**调用，比 Lua 的冒号/点号区分更简单。

---------------------
### ref 和 out 参数

C# 中常见的 `ref` 和 `out` 参数，在 Python 中使用 **list** 作为容器来传递：

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

| 参数类型 | Python 传入值 | 获取结果 |
|---------|-------------|---------|
| `out` | `[None]` 或 `[初始值]` | `outRef[0]` |
| `ref` | `[初始值]` | `refRef[0]` |

与 JS 的 `puer.$ref()` / `puer.$unref()` 和 Lua 的 table `{}` / `[1]` 不同，Python 使用原生的 list 作为容器，通过**索引 `[0]`** 访问结果。

----------------------------
### 泛型

Python 中使用 `puerts.generic()` 来创建泛型类型：

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import System
import System.Collections.Generic.List_1 as List

# create generic type: List<int>
ListInt = puerts.generic(List, System.Int32)
ls = ListInt()
ls.Add(1)
ls.Add(2)
ls.Add(3)

print(ls.Count)  # 3
''')
");
    env.Dispose();
}
```

**方式二：使用中括号语法（推荐）**

PuerTS 还支持 Python 风格的中括号语法来实例化泛型类型，类似于 Python 标准库中 `list[int]` 的写法：

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
from System.Collections.Generic import List_1
from System import Int32

# use square bracket syntax to create generic type: List<int>
List_Int32 = List_1[Int32]
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

中括号语法 `List_1[Int32]` 等价于 `puerts.generic(List_1, Int32)`，对于多个类型参数，使用逗号分隔：`Dictionary_2[String, Int32]`。

> ⚠️ **泛型类名的特殊表示**：C# 中泛型类名使用反引号表示类型参数个数（如 `` List`1 ``），而在 Python 的 `import` 语法中，反引号需要替换为 `_` 加参数个数：
> - `` List`1 `` → `List_1`
> - `` Dictionary`2 `` → `Dictionary_2`
>
> 使用 `puerts.load_type()` 时，可以直接使用反引号原始格式：
> ```python
> List = puerts.load_type('System.Collections.Generic.List`1')
> ```

----------------------------
### 嵌套类型

C# 中的嵌套类型可以通过两种方式访问：

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
from Puerts.UnitTest import TestNestedTypes
from System import Int32, String

# access nested class as attribute of outer class
InnerClassA = TestNestedTypes.InnerClassA
x = InnerClassA()
print(x.Foo)  # Hello

# access generic nested class
InnerClassB_1 = puerts.generic(TestNestedTypes.InnerClassB_1, Int32)
y = InnerClassB_1()
print(y.Bar)  # Hello

InnerClassB_2 = puerts.generic(TestNestedTypes.InnerClassB_2, Int32, String)
z = InnerClassB_2()
print(z.Bar)  # Hello
''')
");
    env.Dispose();
}

// use load_type for nested types (with '+' separator)
env.Eval(@"
exec('''
Inner = puerts.load_type('Puerts.UnitTest.CSharpModuleTestPython+Inner')
print(Inner.i)  # 3
''')
");
```

> 💡 使用 `puerts.load_type()` 访问嵌套类型时，使用 C# 反射的 `+` 分隔符格式（如 `OuterClass+InnerClass`）。

----------------------------
### 数组与索引器访问

C# 中的 `[]` 操作符（包括数组索引、List 索引、Dictionary 索引以及任何自定义索引器）在 Python 中**不能**直接使用 `[]` 语法访问，必须使用 `get_Item()` / `set_Item()` 方法：

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
import System
from System.Collections.Generic import List_1, Dictionary_2

# 创建 C# 数组
arr = System.Array.CreateInstance(puerts.typeof(System.Int32), 3)
arr.set_Item(0, 42)            # 等价于 C# 的 arr[0] = 42
val = arr.get_Item(0)          # 等价于 C# 的 val = arr[0]
print(val)                     # 42

# 同样适用于 List<T>
ListInt = puerts.generic(List_1, System.Int32)
lst = ListInt()
lst.Add(10)
first = lst.get_Item(0)       # 等价于 C# 的 lst[0]
lst.set_Item(0, 20)           # 等价于 C# 的 lst[0] = 20

# 同样适用于 Dictionary<TKey, TValue>
DictStrInt = puerts.generic(Dictionary_2, System.String, System.Int32)
d = DictStrInt()
d.set_Item('key', 100)        # 等价于 C# 的 dict['key'] = 100
v = d.get_Item('key')         # 等价于 C# 的 v = dict['key']
''')
");
    env.Dispose();
}
```

> ⚠️ **重要**：尽管 Python 原生的 `[]` 运算符用于列表和字典，但对于 C# 对象的索引访问，必须通过 `get_Item()` / `set_Item()` 方法。这一点与 JS 和 Lua 中的规则一致。

----------------------------
### typeof

C# 的 `typeof` 在 Python 中通过 `puerts.typeof()` 实现：

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

`puerts.typeof()` 返回 C# 的 `System.Type` 对象，等价于 C# 中的 `typeof(ParticleSystem)`。

----------------------------
### 枚举

Python 中访问 C# 枚举和访问普通类一样，直接通过 `import` 或 `puerts.load_type()` 即可：

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
### 运算符重载

与 JavaScript 和 Lua 类似，Python 中也通过 `op_Xxxx` 方法名来调用 C# 的运算符重载：

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
### 方法重载

C# 方法重载在 Python 中正常工作，PuerTS 会根据传入参数的类型自动选择正确的重载版本：

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
### 传递 null

在 Python 中，使用 `None` 来表示 C# 的 `null`：

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
### 只写属性

C# 中的只写属性在 Python 中可以正常赋值，但尝试读取时会抛出异常：

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
### 结构体

C# 的结构体在 Python 中和类的使用方式完全一致：

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
### 迭代器

使用 `puerts.gen_iterator()` 可以将 C# 的可迭代对象（实现了 `IEnumerable` 接口的对象）转换为 Python 迭代器，从而支持 Python 的 `for ... in` 循环：

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendPython());
    env.Eval(@"
exec('''
from System.Collections.Generic import List_1
from System import Int32

List_Int32 = List_1[Int32]
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

`puerts.gen_iterator()` 内部会调用对象的 `GetEnumerator()` 方法，并包装为支持 Python 迭代协议（`__iter__` / `__next__`）的迭代器对象。

-------------
这一部分是有关 Python 调用 C# 的。下一部分我们反过来，介绍 [C# 调用 Python](./cs2python.md)。

> 📖 其他语言调用 C# 的教程：[JS 调用 C#](./js2cs.md) | [Lua 调用 C#](./lua2cs.md) | [三语言对比速查表](./lang-comparison.md)
