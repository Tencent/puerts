# 生成过滤器 - Filter

### Filter是干嘛的
在生成StaticWrapper时，PuerTS会默认将生成列表里的所有类的所有字段生成wrapper。但实际情况下我们往往需要一系列控制，比如：
1. 某些成员生成之后会引发编译错误，需要过滤掉不生成
2. 权限控制。希望某些成员不允许JS访问。
3. 代码包体积控制。生成出来的代码还是会占一定体积，会希望某些接口能在首次访问时才生成wrapper。

这时候Filter就派上了用场，下面将会一个一个case地演示：

### 过滤编译错误的接口
生成`StaticWrapper`的程序是运行在Editor的，因此PuerTS在执行的反射时候，会把Editor专有的接口生成到`StaticWrapper`里。但在后续游戏打包时，由于Runtime的Assembly没有这些接口，就会导致编译脚本的时候出错。

```csharp
//1、配置类必须打[Configure]标签
//2、必须放Editor目录
[Configure]
public class ExamplesCfg
{
    [Filter]
    static bool FilterMethods(System.Reflection.MemberInfo mb)
    {
        // 排除 MonoBehaviour.runInEditMode, 在 Editor 环境下可用发布后不存在
        if (mb.DeclaringType == typeof(MonoBehaviour) && mb.Name == "runInEditMode") {
            return true;
        }
        return false;
    }
}
```


### 权限控制

```C#
static Puerts.Editor.Generator.BindingMode FilterMethods(System.Reflection.MemberInfo mb)
{
    if (memberInfo.DeclaringType.ToString() == "System.Threading.Tasks.Task" && memberInfo.Name == "IsCompletedSuccessfully")
    {
        return Puerts.Editor.Generator.BindingMode.DontBinding; // 不生成StaticWrapper，且JS调用时获取对应字段会得到undefined。
    }
    return Puerts.Editor.Generator.BindingMode.FastBinding; // 等同于前面return false的情况
}
```

### 惰性生成
前面提到过，在未生成`StaticWrapper`时，一次接口调用会有两部分反射调用：1. 反射获取一个类下的成员 2. 根据MemberInfo取值。

惰性生成的意思就是在编辑器里执行第1步反射，将信息生成为代码，这样运行时就只需要进行第2步反射。在代码体积和运行速度之间取得平衡。

```C#
static Puerts.Editor.Generator.BindingMode FilterMethods(System.Reflection.MemberInfo mb)
{
    if (memberInfo.DeclaringType.ToString() == "System.Threading.Tasks.Task" && memberInfo.Name == "IsCompletedSuccessfully")
    {
        return Puerts.Editor.Generator.BindingMode.LazyBinding; // 首次调用时才执行反射
    }
    return Puerts.Editor.Generator.BindingMode.FastBinding; // 等同于前面return false的情况
}
```