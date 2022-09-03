# BlittableCopy 内存优化
PuerTS提供一种 C# 和 C++ 共享结构体内存的方式，让你从 C# 往 Javascript 传递结构体时能减少GC，它就是`BlittableCopy`标签。

**注意你需要打开unsafe开关才能用这个功能。**
```csharp
//1、配置类必须打[Configure]标签
//2、必须放Editor目录
[Configure]
public class ExamplesCfg
{
    [BlittableCopy]
    static IEnumerable<Type> Blittables
    {
        get
        {
            return new List<Type>()
            {
                //打开这个可以优化Vector3的GC，但需要开启unsafe编译
                //typeof(Vector3),
            };
        }
    }
}
```