# StaticWrapper Generation
### What is StaticWrapper?
When calling C# from JavaScript, PuerTS uses the class name or function name on the JavaScript side to find the corresponding C# function.

This searching for `classes/functions` by string functionality is implemented using **reflection** by default.

After finding the function, the corresponding function is called through the Invoke method, which also falls within the scope of **reflection**.

Obviously, using a lot of reflection can lead to performance degradation.

Therefore, PuerTS provides the ability to generate a version of the class/function that can be called directly by V8 for those classes/functions that you want to use.

In this way, the generated function can be directly called through C++ and C# communication without going through reflection in the future, greatly improving the call performance. We call it the `StaticWrapper` function.

----------
### How to use it?
You must define the classes/functions you will use in the future in advance, so that PuerTs can generate StaticWrapper for you. You can configure it in your project like this:

```csharp
//1. Configure class must have [Configure] attribute
//2. It must be placed in the Editor directory
using System;
using System.Collections.Generic;
using Puerts;
using UnityEngine;

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
            };
        }
    }
}
```
Then use the `Tools/PuerTS/Generate Code` command in the Unity menu to generate the quick-callable versions for Debug and Vector3.

> Note: The configuration of this list is actually very flexible. You can generate your own list by dynamically analyzing it. See the StartTemplate example in the official Demo for reference.

----------
### Other reasons for generating StaticWrapper
In addition to improving performance, there are two other major benefits to generating them:

1. Preventing stripping
2. After generating the list, Puerts can generate dts declaration files for these interfaces.
In general, we recommend that you check the interfaces you use and generate `static-wrapper code` during game release or regression testing.

During the development phase or when you want your game's `code memory` to be as small as possible, you can skip the code generation step and call them via reflection.