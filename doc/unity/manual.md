# Puerts-Unity使用手册

#### 1. [安装PuerTS](./install.md)


#### 2.c#标签介绍

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


#### 3.ts调用c#函数

- ##### 委托、事件，和c#的写法有区别，因为typescript不支持操作符重载

    ```c#
    namespace PuertsTest
    {
        public delegate void MyCallback(string msg);
    
        public class DerivedClass
        {
            public MyCallback MyCallback;
            public event MyCallback MyEvent;
            public static event MyCallback MyStaticEvent;
        }
    }
    ```

  - **委托**

    如果后续不需要-=，那么可以直接传函数当delegate。

    ```typescript
    import { PuertsTest, System } from 'csharp'
    let obj = new PuertsTest.DerivedClass();
    obj.MyCallback = msg => console.log("do not need remove, msg=" + msg);
    ```

    但是如果后续需要用到-=，则要通过new构建的delegate，后续可以拿这个引用去-=；

    由于ts不支持操作符重载，Delegate.Combine相当于C#里头的obj.myCallback += delegate；

    Delegate.Remove相当于C#里头的obj.myCallback -= delegate；	

    ```typescript
    let delegate = new PuertsTest.MyCallback(msg => console.log('can be removed, msg=' + msg));
    obj.MyCallback = System.Delegate.Combine(obj.MyCallback, delegate) as PuertsTest.MyCallback;
    obj.MyCallback = System.Delegate.Remove(obj.MyCallback, delegate) as PuertsTest.MyCallback;
    ```

  - **事件**

    同理，如果后续用到-=的话，就先new一个delegate，后续都用这个引用；但是事件的+=是add_____[name]，-=是 remove_[name]

    ```typescript
    obj.add_MyEvent(delegate);
    obj.remove_MyEvent(delegate);
    //静态事件
    PuertsTest.DerivedClass.add_MyStaticEvent(delegate);
    PuertsTest.DerivedClass.remove_MyStaticEvent(delegate);
    ```

  

- ##### $ref() 和 $unref()，用来表示c#参数，ref 和 out

  ```c#
  namespace PuertsTest
  {
      public class DerivedClass
      {
          public double InOutArgFunc(int a, out int b, ref int c)
          {
              Debug.Log("a=" + a + ",c=" + c);
              b = 100;
              c = c * 2;
              return a + b;
          }
      }
  }
  ```

  ```typescript
  import {PuertsTest} from 'csharp'
  import {$ref, $unref} from 'puerts'
  let obj = new PuertsTest.DerivedClass();
  let p1 = $ref();
  let p2 = $ref(10);
  let ret = obj.InOutArgFunc(100, p1, p2);
  console.log('ret=' + ret + ', out=' + $unref(p1) + ', ref='+ $unref(p2));//200 100 20
  ```

  

- ##### $generic()泛型，< T >

  - List < T >，Dictionary< T1,List< T >>先通过$generic实例化泛型参数

    ```c#
    namespace PuertsTest
    {
        public class DerivedClass
        {
             public void PrintList(List<int> lst)
            {
                Debug.Log("lst.Count=" + lst.Count);
                for (int i = 0; i < lst.Count; i++)
                {
                    Debug.Log(string.Format("lst[{0}]={1}", i, lst[i]));
                }
            }
        }
    }
    ```

    ```typescript
    import {PuertsTest,System} from 'csharp'
    import {$generic} from 'puerts'
    //$generic调用性能不会太好，同样泛型参数建议整个工程，至少一个文件内只做一次
    let List = $generic(System.Collections.Generic.List$1, System.Int32);
    let Dictionary = $generic(System.Collections.Generic.Dictionary$2, System.String, List);
    let lst = new List<number>();
    lst.Add(1);
    lst.Add(0);
    lst.Add(2);
    lst.Add(4);
    obj.PrintList(lst);
    let dic = new Dictionary<string, System.Collections.Generic.List$1<number>>();
    dic.Add("aaa", lst)
    obj.PrintList(dic.get_Item("aaa"));
    ```
  
  

- ##### $typeof()，获取类型

  - c#的函数需要一个数组作为参数，js创建一个数组；

    ```c#
    namespace PuertsTest
    {
        public class DerivedClass
        {
             public void testArr(int[] arr)
            {
                int sum = 0;
                for(int i = 0;i < arr.Length; i++)
                {
                    sum += arr[i];
                }
                Debug.Log(" c# sum = " + sum);//66
            }
        }
    }
    ```

    ```typescript
    import {PuertsTest,System} from 'csharp'
    import {$typeof} from 'puerts'
    let arr = System.Array.CreateInstance($typeof(System.Int32),3) as System.Array$1<number>;
    arr.set_Item(0, 11);
    arr.set_Item(1, 22);
    arr.set_Item(2, 33);
    let obj = new PuertsTest.DerivedClass();
    obj.testArr(arr);
    ```

    

- ##### $extension()，扩展函数

  ```c#
  namespace PuertsTest
  {
      public class BaseClass
      {
      }
      public static class BaseClassExtension
      {
          public static T Extension1<T>(this T a) where T : BaseClass
          {
              Debug.Log(string.Format("Extension1<{0}>", typeof(T)));
              return a;
          }
      }
  }
  ```

  ```typescript
  import {PuertsTest} from 'csharp'
  import {$extension} from 'puerts'
  $extension(PuertsTest.BaseClass, PuertsTest.BaseClassExtension);
  let obj = new PuertsTest.BaseClass();
  obj.Extension1();	
  ```

  

- ##### $promise()，异步，TypeScript的async方法可以await C#的async方法

  typescript和c#的async，await联动，c#**7.3**以上版本才可以

  ```c#
  namespace PuertsTest
  {
      public class DerivedClass
      {
          public async Task<int> GetFileLength(string path)
          {
              Debug.Log("start read " + path);
              using (StreamReader reader = new StreamReader(path))
              {
                  string s = await reader.ReadToEndAsync();
                  Debug.Log("read " + path + " completed");
                  return s.Length;
              }
          }
      }
  }
  ```

  ```typescript
  import {PuertsTest} from 'csharp'
  import {$promise} from 'puerts'
  async function asyncCall() {
      let obj = new PuertsTest.DerivedClass();
      let task = obj.GetFileLength("Assets/Examples/05_Typescript/TsQuickStart.cs");
      let result = await $promise(task);
      console.log('file length is ' + result);
  }
  asyncCall();
  ```

  

- ##### $set()，给引用变量赋值

  - 还是InOutArgFunc()这个函数，但是现在我想给一个引用参数改值，不能直接改，要通过$set()

    ```c#
    namespace PuertsTest
    {
        public class DerivedClass
        {
            public double InOutArgFunc(int a, out int b, ref int c)
            {
                Debug.Log("a=" + a + ",c=" + c);
                b = 100;
                c = c * 2;
                return a + b;
            }
        }
    }
    ```

    ```typescript
    import {PuertsTest} from 'csharp'
    import {$set} from 'puerts'
    let a = 10;
    let b = $ref(10);
    //b = 20; 如果这样赋值的话，最后运行结果 b = undefined 
    $set(b, 20);
    let c = $ref();
    let obj = new PuertsTest.DerivedClass();
    obj.InOutArgFunc(a, b, c);
    console.log("a = " + a + " b = " + $unref(b) + " c = " + $unref(c));
    ```


- ##### op_Addition，c#类中的operator+

    ```c#
    namespace PuertsTest
    {
        public class BaseClass
        {
        	public int baseIntField = 10;
        	public static BaseClass operator +(BaseClass b1,BaseClass b2)
            {
                BaseClass b3 = new BaseClass();
                b3.baseIntField = b1.baseIntField + b2.baseIntField;
                return b3;
            }
        }
    }
    ```
    
    ```typescript
    import {PuertsTest} from 'csharp'
    let obj1 = new PuertsTest.BaseClass();
    let obj2 = new PuertsTest.BaseClass();
    obj1.baseIntField = 11;
    obj2.baseIntField = 22;
    let obj3 = PuertsTest.BaseClass.op_Addition(obj1, obj2);
    ```

  

  
