# 生成StaticWrapper

### 何为StaticWrapper？
Javascript 调用 C# 时，PuerTS 会通过 Javascript 侧的类名/函数名，找到你要调用的对应C#函数。

这个`通过字符串查找类/函数`的职能，在默认情况下是由**反射**实现的。

其次，在查找到后，也要通过 Invoke 方法调用对应函数，这个也属于**反射**的范畴。

显而易见的是，大量的使用反射会导致效率的低下。

因此，PuerTS 提供了一个能力，对于那些要使用的类/函数，你可以提前为其生成一个能被v8直接调用的版本。

这样，这个生成出来的函数，后续就可以直接通过C++和C#的通信直接调用而不需要走反射。大大提高了调用性能。我们将它称为`StaticWrapper`函数。

------------
### 如何使用？

你必须提前定义好你未来要用到的类/函数，这样PuerTs才能为你生成`StaticWrapper`，你可以在你的项目中如下配置：
```csharp
//1、配置类必须打[Configure]标签
//2、必须放Editor目录
[Configure]
public class ExamplesCfg
{
    [Binding]
    static IEnumerable<Type> Bindings
    {
        get
        {
            return new List<Type>()
            {
                typeof(UnityEngine.Debug),
                typeof(UnityEngine.Vector3),
            }
        }
    }
}
```
然后使用unity菜单中的`Generate Code`，即可为`Debug`和`Vector3`生成可快速调用的版本。
> 提示：这个列表的配置写法其实很灵活，你可以通过动态分析的方式产生自己的生成列表，参见官方 Demo 中的 StartTemplate 例子
----------
### 生成StaticWrapper的其他必要性

生成它们除了提高性能之外，还有两个大好处：
1. 防止裁剪 
2. 有了生成列表后，Puerts可以为这些接口生成dts声明文件。

一般情况下，我们建议你在游戏发布或者回归测试的时候，对你用到的接口进行排查，并生成`static-wrapper`代码。

在开发阶段，或者你希望你的游戏的`代码内存`能尽可能小的时候，则可以略过生成代码这一步，直接经由反射调用。
