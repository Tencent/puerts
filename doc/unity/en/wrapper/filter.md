# 生成过滤器 - Filter

### Filter是干嘛的
在生成StaticWrappe  r时，你会发现生成列表的指定是以`类`为维度的。但实际开发中总是会遇到`某些函数不需要被生成wrapper`的需求，这时候Filter就派上了用场

你可以如下编写一个Filter
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
--------
### 经典使用场景

由于生成`StaticWrapper`的程序是运行在Editor的，因此PuerTS在执行的反射时候，会把Editor专有的接口生成到`StaticWrapper`里，并在后续游戏打包时报错。

这时候就需要用Filter对这些接口进行处理。
