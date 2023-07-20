# the Filter of Generator
When you meet these issue in wrapper generating. You can refer to this document:
1. There will be compilation error when some member is generated, those member should be ignore.
2. Access control. Disallowing some member to be access in JS.

## What is Filter used for
PuerTS provides a series of generation control capabilities, and by configuring a Filter function to perform a small amount of customization on the StaticWrapper, the above requirements can be achieved.

Below, some example will be used to illustrate.

## Filtering interfaces that throw compile errors
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
## access control

First, If you want to disable some C# feature, disallowing to use them in Javascript, you can write filter like this:
```C#
static Puerts.BindingMode FilterMethods(System.Reflection.MemberInfo mb)
{
    if (memberInfo.DeclaringType.ToString() == "System.Threading.Tasks.Task" && memberInfo.Name == "IsCompletedSuccessfully")
    {
        return Puerts.BindingMode.DontBinding; // Do not gen StaticWrapper, and can not invoked in JS.
    }
    return Puerts.BindingMode.FastBinding; // equals to 'return false'
}
```
In the above situation, PuerTS will record information about these properties in the Wrapper, so when registering these properties, they will be prevented from being called.

However, if you want to disable most JS calls and only allow a few interfaces to be callable, it is not feasible to generate a wrapper for all properties and mark them as unavailable.

In this case, you can use this C# call to disable default JS calls:

```C#
var env = new JsEnv();
env.SetDefaultBindingMode(BindingMode.DontBinding)
```
Then return `BindingMode.FastBinding` or `BindingMode.SlowBinding` to allow them to be invoked.
```C#
static Puerts.BindingMode FilterMethods(System.Reflection.MemberInfo mb)
{
    if (memberInfo.DeclaringType == typeof(UnityEngine.Vector3)) // keep Vector3 available
    {
        return Puerts.BindingMode.FastBinding;
    }
    return Puerts.BindingMode.DontBinding;
}
```

# Filtering in xIl2cpp Mode
In xIl2cpp mode, the default cppwrapper generation is fully generation. Therefore, it will try to obtain the method body to search for types.

If you want to exclude certain types from this operation, you can use this method to filter them out.
```C#
[Filter]
static bool GetFilterClass(FilterAction filterAction, MemberInfo mbi)
{
    if (filterAction == FilterAction.MethodInInstructions) 
        return skipAssembles.Contains(mbi.DeclaringType.Assembly.GetName().Name);
    return false;
}
```
