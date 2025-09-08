# 所有C#配置标签用法

这些配置须放在Editor目录下；

- ##### Configure

  - **用途**

    配置类。

  - **用法**

    该标签只能用在类上，且须在Editor文件夹下。

  - **举例**

    ```c#
    [Configure]
    public class ExamplesCfg
    {
    }
    ```

- ##### Binding

  - **用途**

    在js/ts调用时，可以找到该类；

    - 会生成一个静态类（wrap），在js调用时，直接静态调用，加快调用速度，否则是通过反射调用。
    - 在index.d.ts中生成函数的声明，在ts调用时，import时，可以找到。

  - **用法**

    该标签只能用在属性上，须放在标记了Configure的类里。

  - **举例**

    静态列表
    
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
    
    动态列表
    
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

  - **用途**

    该标签只是针对ts调用，相比Binding，该标签仅生成ts声明（即不会生成静态类，只会在index.d.ts中生成函数的声明给ts调用）。

  - **用法**

    该标签只能用在属性上，须放在标记了Configure的类里。

  - **举例**

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

  - **用途**

    对Blittable值类型通过内存拷贝传递，可避免值类型传递产生的GC，需要开启unsafe编译选项。

  - **用法**

    该标签只能用在属性上，须放在标记了Configure的类里。

  - **举例**

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

  - **用途**

    过滤函数。

  - **用法**

    该标签只能用在函数上，须放在标记了Configure的类里。

  - **举例**

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
