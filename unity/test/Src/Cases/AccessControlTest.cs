using NUnit.Framework;
using System;
using System.Reflection;
using Puerts.TypeMapping;

namespace Puerts.UnitTest
{
    // xIl2cpp模式暂无法让每个JsEnv使用单独的DefaultBinding值
#if !UNITY_WEBGL && !EXPERIMENTAL_IL2CPP_PUERTS
    public class AccessControlHelper {
        public static string StaticField = "StaticField";
        public string InstanceField = "InstanceField";

        public static string StaticMethod() { return "StaticMethod"; }
        public string InstanceMethod() { return "InstanceMethod"; }

        public AccessControlHelper() 
        {
            
        }
    }
    public class AnotherAccessControlHelper {
        public static string StaticField = "StaticField";
        public string InstanceField = "InstanceField";

        public static string StaticMethod() { return "StaticMethod"; }
        public string InstanceMethod() { return "InstanceMethod"; }

        public AnotherAccessControlHelper() 
        {
            
        }
    }

    [TestFixture]
    public class AccessControlTest
    {

        private JsEnv DefaultDontBindingEnv;
        public AccessControlTest() 
        {
#if PUERTS_GENERAL
            DefaultDontBindingEnv = new JsEnv(new TxtLoader());
#else
            DefaultDontBindingEnv = new JsEnv(new UnitTestLoader());
#endif
            DefaultDontBindingEnv.SetDefaultBindingMode(BindingMode.DontBinding);

            // prevent strip in il2cpp
            AccessControlHelper.StaticMethod();
            AnotherAccessControlHelper.StaticMethod();
            var ach = new AccessControlHelper();
            var aach = new AnotherAccessControlHelper();
            ach.InstanceMethod();
            aach.InstanceMethod();
            System.Console.WriteLine("" + AccessControlHelper.StaticField + AnotherAccessControlHelper.StaticField + ach.InstanceField + aach.InstanceField);
        }
        
        [OneTimeTearDown]
        public void Cleanup()
        {
            DefaultDontBindingEnv.Dispose();
        }

        [Test]
        public void AllMemberIsUndefinedInDefaultDontBindingEnv()
        {
            string ret = DefaultDontBindingEnv.Eval<string>(@"
                '' + CS.Puerts.UnitTest.AccessControlHelper.StaticMethod + CS.Puerts.UnitTest.AccessControlHelper.StaticMethodField
            ");
            Assert.AreEqual(ret, "undefinedundefined");
        }

        [Test]
        public void ConstructorIsInvalidInDefaultDontBindingEnv()
        {
            Assert.Catch(()=> {
                DefaultDontBindingEnv.Eval(@"
                    new CS.Puerts.UnitTest.AccessControlHelper()
                ");
            });
        }

        [Test]
        public void FastBindingInDontBindingEnv()
        {
            DefaultDontBindingEnv.AddRegisterInfoGetter(typeof(AnotherAccessControlHelper), ()=> 
            {
                return new RegisterInfo 
                {
                    BlittableCopy = false,

                    Members = new System.Collections.Generic.Dictionary<string, MemberRegisterInfo>
                    {
                        
                        { "StaticMethod_static", new MemberRegisterInfo { Name = "StaticMethod", IsStatic = true, MemberType = MemberType.Method, UseBindingMode = BindingMode.FastBinding
        #if !EXPERIMENTAL_IL2CPP_PUERTS
                        , Method = EmptyCallbackWrap
        #endif  
                        } },
                    }
                };
            });
            string ret = DefaultDontBindingEnv.Eval<string>(@"
                '' + CS.Puerts.UnitTest.AnotherAccessControlHelper.StaticMethod
            ");
            Assert.AreNotEqual(ret, "undefined");
        }

        [Test]
        public void DontBindingInFastBindingEnv()
        {
            var jsEnv = UnitTestEnv.GetEnv();
            jsEnv.AddRegisterInfoGetter(typeof(AccessControlHelper), ()=> 
            {
                return new RegisterInfo 
                {
                    BlittableCopy = false,

                    Members = new System.Collections.Generic.Dictionary<string, MemberRegisterInfo>
                    {
                        
                        {"StaticMethod_static", new MemberRegisterInfo { Name = "StaticMethod", IsStatic = true, MemberType = MemberType.Method, UseBindingMode = BindingMode.DontBinding
        #if !EXPERIMENTAL_IL2CPP_PUERTS
                        , Method = EmptyCallbackWrap
        #endif
                        }},
                    }
                };
            });
            string ret = jsEnv.Eval<string>(@"
                '' + CS.Puerts.UnitTest.AccessControlHelper.StaticMethod
            ");
            Assert.AreEqual(ret, "undefined");
        }

        
        [MonoPInvokeCallback(typeof(V8FunctionCallback))]
        internal static void EmptyCallbackWrap(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
        }
    }
#endif
}