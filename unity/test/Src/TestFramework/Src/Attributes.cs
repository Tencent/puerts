using System;

namespace NUnit {
    namespace Framework {
        // 不能继承 PreserveAttribute：UnityLinker 把 Preserve 及其子类当作仅供裁剪用的标记，输出程序集时会把它们从
        // 类型/方法上删掉，IL2CPP 包里反射就拿不到 [Test]/[TestFixture]（Unity 6000.6 Android 上一个用例都找不到）。
        // 用例类和方法的保留交给 link.xml 里对 com.tencent.puerts.unittest 的 preserve="all"；
        // RequireAttributeUsages 让被保留的类型/方法上的这个特性在高裁剪级别下也一起保留。
        [System.AttributeUsage(System.AttributeTargets.Method, Inherited = false, AllowMultiple = false)]
        [UnityEngine.Scripting.RequireAttributeUsages]
        public sealed class TestAttribute : System.Attribute
        {
            public int priority { get; private set; }

            public TestAttribute() : this(int.MaxValue)
            {
            }
            public TestAttribute(int priority)
            {
                this.priority = priority;
            }
        }

        [System.AttributeUsage(System.AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
        [UnityEngine.Scripting.RequireAttributeUsages]
        public sealed class TestFixtureAttribute : System.Attribute
        {
            public int priority { get; private set; }

            public TestFixtureAttribute() : this(int.MaxValue)
            {
            }
            public TestFixtureAttribute(int priority)
            {
                this.priority = priority;
            }
        }

        public class StringAssert
        {
            public static void Contains(string a, string b)
            {
                if (!b.Contains(a)) 
                {
                    throw new Exception($"expect {b} to contain {a} but failed");
                }
            }
        }
        
        public class Assert 
        {
            public static void Catch(Action action, string message = "") 
            {
                try 
                {
                    action();
                } 
                catch (Exception e)
                {
                    if (message.Length > 0 && !e.Message.Contains(message))
                    {
                        throw new Exception($"expect an error with {message} but got {e.Message}");
                    }
                    return;
                }
                throw new Exception($"expect an error but the code did not thrown any");
            }
            // public static void Contains(object a, ICollection b)
            // {

            // }
            public static void AreEqual(object a, object b) 
            {
                bool eq = (a == null) ? b == null : a.Equals(b);
                if (a != null && b != null) // for unity
                {
                    if (a.GetType().IsPrimitive && b.GetType().IsPrimitive || a is string && b is string)
                    {
                        eq = a.ToString() == b.ToString();
                    }
                }
                if (!eq) throw new Exception($"expect [{a}] == [{b}]");
                
            }
            public static void AreNotEqual(object a, object b) 
            {
                bool eq = (a == null) ? b == null : a.Equals(b);
                if (a != null && b != null) // for unity
                {
                    if (a.GetType().IsPrimitive && b.GetType().IsPrimitive || a is string && b is string)
                    {
                        eq = a.ToString() == b.ToString();
                    }
                }
                if (eq) throw new Exception($"expect [{a}] != [{b}]");
            }

            public static void True(bool b)
            {
                if (!b) throw new Exception("expect true but got a " + b);
            }
            public static void False(bool b) 
            {
                if (b) throw new Exception("expect false but got a " + b);
            }
        }
    }
}
