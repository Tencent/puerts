using System;

namespace NUnit {
    namespace Framework {
        [System.AttributeUsage(System.AttributeTargets.Method, Inherited = false, AllowMultiple = false)]
        public sealed class TestAttribute : UnityEngine.Scripting.PreserveAttribute
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
        public sealed class TestFixtureAttribute : UnityEngine.Scripting.PreserveAttribute
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
        
        public class Assert {
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
                throw new Exception($"expect an error but tbe code did not thrown any");
            }
            public static void Contains(string a, string b)
            {
                if (!b.Contains(a)) 
                {
                    throw new Exception($"expect {b} to contain {a} but failed");
                }
            }
            // public static void Contains(object a, ICollection b)
            // {

            // }
            public static void AreEqual(object a, object b) 
            {
                Type aType = a.GetType();
                Type bType = b.GetType();
                if (
                    (aType.IsPrimitive || aType == typeof(string)) &&
                    (bType.IsPrimitive || bType == typeof(string))
                )
                {
                    if (a.ToString() != b.ToString()) 
                        throw new Exception($"expect {a} == {b} but failed");
                } 
                else if (a != b) throw new Exception($"expect {a} == {b} but failed");
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
