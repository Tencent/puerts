using NUnit.Framework;
using System;
using System.Reflection;
using Puerts.TypeMapping;

namespace Puerts.UnitTest
{
    /*
    // xIl2cpp模式暂无法让每个JsEnv使用单独的DefaultBinding值
#if !UNITY_WEBGL && (PUERTS_DISABLE_IL2CPP_OPTIMIZATION || !ENABLE_IL2CPP)
    public class AccessControlHelperLua {
        public static string StaticField = "StaticField";
        public string InstanceField = "InstanceField";

        public static string StaticMethod() { return "StaticMethod"; }
        public string InstanceMethod() { return "InstanceMethod"; }

        public AccessControlHelperLua() 
        {
            
        }
    }
    public class AnotherAccessControlHelperLua {
        public static string StaticField = "StaticField";
        public string InstanceField = "InstanceField";

        public static string StaticMethod() { return "StaticMethod"; }
        public string InstanceMethod() { return "InstanceMethod"; }

        public AnotherAccessControlHelperLua() 
        {
            
        }
    }

    [TestFixture]
    public class AccessControlTestLua
    {

        private ScriptEnv DefaultDontBindingEnv;
        public AccessControlTestLua() 
        {
            DefaultDontBindingEnv = new ScriptEnv(new BackendLua());
            DefaultDontBindingEnv.SetDefaultBindingMode(BindingMode.DontBinding);

            // prevent strip in il2cpp
            AccessControlHelperLua.StaticMethod();
            AnotherAccessControlHelperLua.StaticMethod();
            var ach = new AccessControlHelperLua();
            var aach = new AnotherAccessControlHelperLua();
            ach.InstanceMethod();
            aach.InstanceMethod();
            System.Console.WriteLine("" + AccessControlHelperLua.StaticField + AnotherAccessControlHelperLua.StaticField + ach.InstanceField + aach.InstanceField);
        }
        
#if PUERTS_GENERAL
        [OneTimeTearDown]
        public void Cleanup()
        {
            //GC.Collect();
            //GC.WaitForPendingFinalizers();
            DefaultDontBindingEnv.Dispose();
        }
#endif

        [Test]
        public void AllMemberIsUndefinedInDefaultDontBindingEnv()
        {
            string ret = DefaultDontBindingEnv.Eval<string>(@"
                local CS = require('csharp')
                local helper = CS.Puerts.UnitTest.AccessControlHelperLua
                return tostring(helper.StaticMethod) .. tostring(helper.StaticMethodField)
            ");
            Assert.AreEqual(ret, "nilnil");
        }

        [Test]
        public void ConstructorIsInvalidInDefaultDontBindingEnv()
        {
            Assert.Catch(()=> {
                DefaultDontBindingEnv.Eval(@"
                    local CS = require('csharp')
                    CS.Puerts.UnitTest.AccessControlHelperLua()
                ");
            });
        }

        [Test]
        public void FastBindingInDontBindingEnv()
        {
            DefaultDontBindingEnv.AddRegisterInfoGetter(typeof(AnotherAccessControlHelperLua), ()=> 
            {
                return new RegisterInfo 
                {
                    BlittableCopy = false,

                    Members = new System.Collections.Generic.Dictionary<string, MemberRegisterInfo>
                    {
                        
                        { "StaticMethod_static", new MemberRegisterInfo { Name = "StaticMethod", IsStatic = true, MemberType = MemberType.Method, UseBindingMode = BindingMode.FastBinding
#if PUERTS_DISABLE_IL2CPP_OPTIMIZATION || !ENABLE_IL2CPP
                        , Method = EmptyCallbackWrap
#endif
                        } },
                    }
                };
            });
            string ret = DefaultDontBindingEnv.Eval<string>(@"
                local CS = require('csharp')
                return tostring(CS.Puerts.UnitTest.AnotherAccessControlHelperLua.StaticMethod)
            ");
            Assert.AreNotEqual(ret, "nil");
        }

        [Test]
        public void DontBindingInFastBindingEnv()
        {
            var luaEnv = new ScriptEnv(new BackendLua());
            luaEnv.AddRegisterInfoGetter(typeof(AccessControlHelperLua), ()=> 
            {
                return new RegisterInfo 
                {
                    BlittableCopy = false,

                    Members = new System.Collections.Generic.Dictionary<string, MemberRegisterInfo>
                    {
                        
                        {"StaticMethod_static", new MemberRegisterInfo { Name = "StaticMethod", IsStatic = true, MemberType = MemberType.Method, UseBindingMode = BindingMode.DontBinding
#if PUERTS_DISABLE_IL2CPP_OPTIMIZATION
                        , Method = EmptyCallbackWrap
#endif
                        }},
                    }
                };
            });
            string ret = luaEnv.Eval<string>(@"
                local CS = require('csharp')
                return tostring(CS.Puerts.UnitTest.AccessControlHelperLua.StaticMethod)
            ");
            Assert.AreEqual(ret, "nil");
            luaEnv.Dispose();
        }

        
        [MonoPInvokeCallback(typeof(V8FunctionCallback))]
        internal static void EmptyCallbackWrap(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
        }
    }
#endif
    */
}