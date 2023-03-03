# All C# Attribute Introduction
These configurations should be placed under the Editor directory;

- ##### Configure
  - **Purpose**

    Configuration class.

  - **Usage**

    This attribute can only be used on classes and must be placed under the Editor folder.

  - **Example**
```c#
    [Configure]
    public class ExamplesCfg
    {
    }
```

- ##### Binding

  - **Purpose**

    When called in js/ts, the class can be load correctly;

    - It generates a static class (wrap), which can be called statically in js to speed up the call, otherwise it is called through reflection.
    - It generates a function declaration in index.d.ts, which can be found when imported in ts.

  - **Usage**

    This tag can only be used on properties and must be placed in a class marked with Configure.

  - **Example**

    return a list
    
    ```c#
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
                    typeof(GameObject),
                    typeof(Component),
                };
            }
        }
    }
    ```
    
    return a dynamic list
    
    ```c#
    [Configure]
    public class ExamplesCfg
    {
        [Binding]
        static IEnumerable<Type> Bindings
        {
            get
            { 
                return (from type in Assembly.Load("Assembly-CSharp").GetExportedTypes()
                    where type.Namespace == "MyNamespace"
                    select type);
            }
        }
    }
    ```

- ##### Typing

  - **Purpose**

    This tag is only for ts calls. Compared with Binding, this tag only generates ts declarations (that is, it does not generate a static class, but only generates function declarations in index.d.ts for ts calls).

  - **Usage**

    This tag can only be used on properties and must be placed in a class marked with Configure.

  - **Example**

    ```c#
    [Configure]
    public class ExamplesCfg
    {
        [Typing]
        static IEnumerable<Type> Typings
        {
            get
            { 
                //静态或动态列表
            }
        }
    }
    ```

    

- ##### BlittableCopy

  - **Purpose**

    Pass Blittable value types by memory copy to avoid GC caused by value type passing. The unsafe compilation option needs to be enabled.

  - **Usage**

    This tag can only be used on properties and must be placed in a class marked with Configure.

  - **Example**

    ```c#
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
                    typeof(Vector3),
                };
            }
        }
    
        [BlittableCopy]
        static IEnumerable<Type> Blittables
        {
            get
            {
                return new List<Type>()
                {
                    //打开这个可以优化Vector3的GC，但需要开启unsafe编译
                    typeof(Vector3),
                };
            }
        }
    }
    ```

- ##### Filter

  - **Purpose**

    Filt a function.

  - **Usage**

    This tag can only be used on functions and must be placed in a class marked with Configure.

  - **Example**

    ```c#
    public class TestFilter
    {
        public void print()
        {
            Debug.Log("test Filter");
        }
        public void add(int a, int b)
        {
            Debug.Log("test add = " + (a + b));
        }
    }
    
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
                    typeof(TestFilter),
                };
            }
        }
    
        [Filter]
        static bool Filter(System.Reflection.MemberInfo memberInfo)
        {
            return memberInfo.DeclaringType.Name == "TestFilter" && memberInfo.Name == "print";
        }
    }
    ```
