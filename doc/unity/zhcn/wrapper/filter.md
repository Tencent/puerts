# 生成控制 (Filter)

当你生成wrapper时遇到以下问题时，就可以参考这段文档：
1. 某些成员生成之后会引发编译错误，需要过滤掉不生成
2. 权限控制。希望某些成员不允许JS访问。

## Filter是干嘛的
PuerTS提供一系列的生成控制能力，通过配置一个Filter函数对StaticWrapper进行少量的自定义，实现上述需求。

下面会以案例进行说明

## 过滤编译错误的接口
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

## 权限控制

首先，如果你想禁用某个类的某一些接口，不允许它在JS侧被调用，可以如下编写Filter
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

上述情况，PuerTS会在Wrapper里记录这几个属性的信息，这样在注册这几个属性的时候，就会禁止它们被调用。

但如果是反过来，你希望禁用大部分的JS调用，只允许少部分接口可调的时候，就不太可能为所有的属性生成wrapper并标记为不可用。

这时候你可以通过这样的C#调用来禁止默认JS调用：

```C#
var env = new JsEnv();
env.SetDefaultBindingMode(BindingMode.DontBinding)
```
再为需要通过的属性在Filter里返回可用即可：
```C#
static Puerts.Editor.Generator.BindingMode FilterMethods(System.Reflection.MemberInfo mb)
{
    if (memberInfo.DeclaringType == typeof(UnityEngine.Vector3)) // 使vector3可用
    {
        return Puerts.Editor.Generator.BindingMode.FastBinding;
    }
    return Puerts.Editor.Generator.BindingMode.DontBinding;
}
```

## xIl2cpp模式遍历过滤
xIl2cpp模式下，默认的自带的cppwrapper生成是全量类型的生成。因此会尝试获取methodbody来搜索类型。

这个行为可能会不太稳定，如果想让某些类型不进行这个操作，可以通过这种方式过滤
```C#
[Filter]
static bool GetFilterClass(FilterAction filterAction, MemberInfo mbi)
{
    if (filterAction == FilterAction.MethodInInstructions) 
        return skipAssembles.Contains(mbi.DeclaringType.Assembly.GetName().Name);
    return false;
}
```