# the Filter of Generator
### What is a Filter?
When generating a StaticWrapper, you will find that the generation list is specified by **class**. However, in actual development, there is always a need to **exclude certain functions from being generated as wrappers**. This is where filters come in.

You can write a filter as follows:

```csharp
//1. The configuration class must be tagged with [Configure].
//2. It must be placed in the Editor directory.
[Configure]
public class ExamplesCfg
{
    [Filter]
    static bool FilterMethods(System.Reflection.MemberInfo mb)
    {
        // Exclude MonoBehaviour.runInEditMode, which is only available in the Editor environment and does not exist after publication.
        if (mb.DeclaringType == typeof(MonoBehaviour) && mb.Name == "runInEditMode") {
            return true;
        }
        return false;
    }
}
```
------
### Classic Use Case
Since the program that generates the `StaticWrapper` runs in the Editor, PuerTS will generate Editor-specific interfaces in the `StaticWrapper` when executing reflection, which will result in errors when the game is packaged later.

This is where filters come in to handle these interfaces.