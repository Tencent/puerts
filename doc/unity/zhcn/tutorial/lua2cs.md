# 在Lua中调用C#

> 💡 PuerTS 3.0 同时支持 [JavaScript](./js2cs.md) 和 [Python](./python2cs.md) 调用 C#，语法各有不同，可点击链接查看对应教程。

在上一篇中，我们简单试了一下Hello World

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"print('hello world')");
    env.Dispose();
}
```

在 PuerTS 的帮助下，Lua 和 C# 的打通还可以更精彩，请往下看：

------------------
### 访问 C# 命名空间

在 Lua 中访问 C# 类型，首先需要通过 `require('csharp')` 获取 C# 命名空间入口：

```lua
local CS = require('csharp')
-- 现在可以通过 CS 访问任意 C# 类型
-- 例如：CS.UnityEngine.Debug, CS.System.Collections.Generic.List_1
```

`CS` 对象是 C# 世界的入口，通过它可以输入任意类的 FullName（包含完整命名空间的路径）来访问 C# 类型。

当然，写出完整的命名空间还是比较麻烦的，不过你也可以通过声明一个局部变量来简化：

```lua
local Vector2 = CS.UnityEngine.Vector2
print(Vector2.one)
```

------------------
### 对象创建

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local v = CS.UnityEngine.Vector3(1, 2, 3)
        print(tostring(v))
        -- (1.0, 2.0, 3.0)
    ");
    env.Dispose();
}
```

在本例中，我们直接在 Lua 中创建了一个 C# 的 Vector3！

> ⚠️ 注意：Lua 中创建 C# 对象**不使用 `new` 关键字**，直接以函数调用的方式构造即可。这和 JS 中使用 `new CS.xxx()` 不同。

------------------------------------
### 属性访问与方法调用

对象创建出来了，调用其方法、访问其属性也是非常容易的。

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        -- 静态方法调用：使用点号语法
        CS.UnityEngine.Debug.Log('Hello World')

        -- 创建对象并调用实例方法
        local rect = CS.UnityEngine.Rect(0, 0, 2, 2)
        CS.UnityEngine.Debug.Log(rect:Contains(CS.UnityEngine.Vector2.one)) -- True
        rect.width = 0.1
        CS.UnityEngine.Debug.Log(rect:Contains(CS.UnityEngine.Vector2.one)) -- False
    ");
    env.Dispose();
}
```

> ⚠️ 关键语法差异：Lua 中**实例方法使用冒号 `:` 调用**（如 `obj:Method()`），**静态方法和属性使用点号 `.` 调用**（如 `Class.Method()`）。冒号语法会自动将对象自身作为第一个参数传入。

```lua
-- 实例方法 —— 用冒号
local testHelper = CS.Puerts.UnitTest.TestHelper.GetInstance()
testHelper:NumberTestPipeLine(1, outRef, callback)

-- 静态方法 —— 用点号
CS.Puerts.UnitTest.TestHelper.AssertAndPrint('msg', 1, 1)

-- 属性读写 —— 用点号
testHelper.numberTestField = 3          -- 写入实例属性
local val = testHelper.numberTestField  -- 读取实例属性
CS.Puerts.UnitTest.TestHelper.numberTestFieldStatic = 3  -- 写入静态属性
```

---------------------
### ref/out 参数

C# 中的 `ref` 和 `out` 参数在 Lua 中通过 **table** 来模拟：

```csharp
// C# 侧
class Example {
    public static double InOutArgFunc(int a, out int b, ref int c)
    {
        Debug.Log("a=" + a + ",c=" + c);
        b = 100;
        c = c * 2;
        return a + b;
    }
}

void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        -- 创建 table 作为 out/ref 容器
        local outB = {}          -- out 参数：空 table
        local refC = {}
        refC[1] = 10             -- ref 参数：table[1] 存初始值

        local ret = CS.Example.InOutArgFunc(100, outB, refC)
        print('ret=' .. ret .. ', out=' .. outB[1] .. ', ref=' .. refC[1])
        -- ret=200, out=100, ref=20
    ");
    env.Dispose();
}
```

> 📌 规则说明：
> - `out` 参数：传入一个空 table `{}`，C# 方法执行后结果存入 `table[1]`
> - `ref` 参数：传入一个 table，`table[1]` 中存放初始值，C# 方法执行后更新 `table[1]`

----------------------------
### 泛型

C# 中的泛型类型在 Lua 中需要借助 `puerts.generic()` 来创建：

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local puerts = require('puerts')

        -- 创建 List<int> 类型
        local List = puerts.generic(CS.System.Collections.Generic.List_1, CS.System.Int32)
        local ls = List()
        ls:Add(1)
        ls:Add(2)
        ls:Add(3)
    ");
    env.Dispose();
}
```

> ⚠️ 注意泛型类名的写法：C# 中的反引号（如 `` List`1 ``）在 Lua 中表示为**下划线**（如 `List_1`）。常见对照：
> - `List<T>` → `List_1`
> - `Dictionary<TKey, TValue>` → `Dictionary_2`
> - `Action<T>` → `Action_1`

#### 泛型方法

调用泛型方法需要使用 `puerts.genericMethod()`：

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local puerts = require('puerts')

        -- 调用静态泛型方法 GenericTestClass.StaticGenericMethod<int>()
        local func = puerts.genericMethod(
            CS.Puerts.UnitTest.GenericTestClass,  -- 类型
            'StaticGenericMethod',                 -- 方法名
            CS.System.Int32                        -- 泛型类型参数
        )
        print(func())  -- 'Int32'

        -- 调用实例泛型方法
        local testobj = CS.Puerts.UnitTest.GenericTestClass()
        testobj.stringProp = 'world'
        local instanceFunc = puerts.genericMethod(
            CS.Puerts.UnitTest.GenericTestClass,
            'InstanceGenericMethod',
            CS.System.Int32
        )
        print(instanceFunc(testobj))  -- 'world_Int32'
    ");
    env.Dispose();
}
```

> 📌 `puerts.genericMethod()` 的参数：第一个是类型，第二个是方法名字符串，后续是泛型类型参数。调用实例泛型方法时，需要将对象实例作为第一个参数传入。

#### 访问泛型类的静态成员和嵌套类型

```lua
local CS = require('csharp')
local puerts = require('puerts')

-- 创建泛型类 GenericTestClass<string>
local GenericTestClass = puerts.generic(CS.Puerts.UnitTest.GenericTestClass_1, CS.System.String)
GenericTestClass.v = '6'

-- 访问嵌套类型
GenericTestClass.Inner()
print(GenericTestClass.Inner.stringProp) -- 'hello'
```

----------------------------
### typeof

因为 C# 的 `typeof` 无法通过命名空间的方式访问，PuerTS 提供了内置方法 `puerts.typeof()`：

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local typeof = require('puerts').typeof

        local go = CS.UnityEngine.GameObject('testObject')
        go:AddComponent(typeof(CS.UnityEngine.ParticleSystem))

        -- 类型比较
        local helper = CS.Puerts.UnitTest.CrossLangTestHelper()
        local val = helper:GetDateTime()
        print(val:GetType() == typeof(CS.System.DateTime))  -- true
    ");
    env.Dispose();
}
```

----------------------------
### 枚举

C# 枚举值可以直接通过命名空间路径访问：

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local helper = CS.Puerts.UnitTest.CrossLangTestHelper()

        -- 读取枚举值
        local enumVal = helper.EnumField
        print(tostring(enumVal))  -- '213'

        -- 设置枚举值
        helper.EnumField = CS.Puerts.UnitTest.TestEnum.A
        print(tostring(helper.EnumField))  -- '1'
    ");
    env.Dispose();
}
```

----------------------------
### 运算符重载

由于 Lua 的元表运算符重载机制与 C# 不同，在 Lua 中需要使用 `op_Xxxx` 方式调用 C# 的运算符重载方法：

```csharp
void Start() {
    var env = new Puerts.ScriptEnv(new Puerts.BackendLua());
    env.Eval(@"
        local CS = require('csharp')
        local Vector3 = CS.UnityEngine.Vector3

        -- C# 中的 Vector3.up * 1600
        local ret = Vector3.op_Multiply(Vector3.up, 1600)
        print(tostring(ret))  -- (0.0, 1600.0, 0.0)
    ");
    env.Dispose();
}
```

> 📌 常见运算符对照：
> - `+` → `op_Addition`
> - `-` → `op_Subtraction`
> - `*` → `op_Multiply`
> - `/` → `op_Division`
> - `==` → `op_Equality`

----------------------------
### 传递 null

在 Lua 中使用 `nil` 来表示 C# 的 `null`：

```lua
local CS = require('csharp')
local testHelper = CS.Puerts.UnitTest.TestHelper.GetInstance()
testHelper:PassStr(nil)   -- 传递 null 字符串
testHelper:PassObj(nil)   -- 传递 null 对象
```

对于可空结构体（`Nullable<T>`），同样使用 `nil`：

```lua
local outRef = {}
outRef[1] = nil
testHelper:NullableNativeStructTestPipeLine(nil, outRef, function(obj)
    print(obj == nil)  -- true
    return nil
end)
```

-------------
这一部分是有关 Lua 调用 C# 的。下一部分我们反过来，介绍 [C# 调用 Lua](./cs2lua.md)。

> 📖 其他语言调用 C# 的教程：[JS 调用 C#](./js2cs.md) | [Python 调用 C#](./python2cs.md) | [三语言对比速查表](./lang-comparison.md)
