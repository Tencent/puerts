# BlittableCopy Memory Optimization
PuerTS provides a way to share struct memory between C# and C++ using the `BlittableCopy` attribute, which reduces GC when passing structs from C# to JavaScript.

**Note that you need to enable the unsafe switch to use this feature.**

```csharp
//1. The configuration class must have the [Configure] tag
//2. It must be placed in the Editor directory
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
                //Enabling this will optimize the GC for Vector3, but you need to enable unsafe compilation
                //typeof(Vector3),
            };
        }
    }
}
```