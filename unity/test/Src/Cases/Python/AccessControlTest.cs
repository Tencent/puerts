#if !UNITY_WEBGL && !UNITY_IOS && !UNITY_ANDROID
using NUnit.Framework;
using System;
using System.Reflection;
using Puerts.TypeMapping;

namespace Puerts.UnitTest
{
    /*
    // xIl2cpp模式暂无法让每个JsEnv使用单独的DefaultBinding值
#if !UNITY_WEBGL && (PUERTS_DISABLE_IL2CPP_OPTIMIZATION || !ENABLE_IL2CPP)
    public class AccessControlHelperPython {
        public static string StaticField = "StaticField";
        public string InstanceField = "InstanceField";

        public static string StaticMethod() { return "StaticMethod"; }
        public string InstanceMethod() { return "InstanceMethod"; }

        public AccessControlHelperPython() 
        {
            
        }
    }
    public class AnotherAccessControlHelperPython {
        public static string StaticField = "StaticField";
        public string InstanceField = "InstanceField";

        public static string StaticMethod() { return "StaticMethod"; }
        public string InstanceMethod() { return "InstanceMethod"; }

        public AnotherAccessControlHelperPython() 
        {
            
        }
    }

    [TestFixture]
    public class AccessControlTestPython
    {

        private ScriptEnv DefaultDontBindingEnv;
        public AccessControlTestPython() 
        {
            DefaultDontBindingEnv = new ScriptEnv(new BackendPython());
            DefaultDontBindingEnv.SetDefaultBindingMode(BindingMode.DontBinding);

            // prevent strip in il2cpp
            AccessControlHelperPython.StaticMethod();
            AnotherAccessControlHelperPython.StaticMethod();
            var ach = new AccessControlHelperPython();
            var aach = new AnotherAccessControlHelperPython();
            ach.InstanceMethod();
            aach.InstanceMethod();
            System.Console.WriteLine("" + AccessControlHelperPython.StaticField + AnotherAccessControlHelperPython.StaticField + ach.InstanceField + aach.InstanceField);
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
exec('''
helper = puerts.load_type('Puerts.UnitTest.AccessControlHelperPython')
result = str(getattr(helper, 'StaticMethod', None)) + str(getattr(helper, 'StaticMethodField', None))
''')
result
");
            Assert.AreEqual(ret, "NoneNone");
        }

        [Test]
        public void ConstructorIsInvalidInDefaultDontBindingEnv()
        {
            Assert.Catch(()=> {
                DefaultDontBindingEnv.Eval(@"
exec('''
puerts.load_type('Puerts.UnitTest.AccessControlHelperPython')()
''')
");
            });
        }

        [Test]
        public void FastBindingInDontBindingEnv()
        {
            DefaultDontBindingEnv.AddRegisterInfoGetter(typeof(AnotherAccessControlHelperPython), ()=> 
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
exec('''
result = str(getattr(puerts.load_type('Puerts.UnitTest.AnotherAccessControlHelperPython'), 'StaticMethod', None))
''')
result
");
            Assert.AreNotEqual(ret, "None");
        }

        [Test]
        public void DontBindingInFastBindingEnv()
        {
            var pythonEnv = new ScriptEnv(new BackendPython());
            pythonEnv.AddRegisterInfoGetter(typeof(AccessControlHelperPython), ()=> 
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
            string ret = pythonEnv.Eval<string>(@"
exec('''
result = str(getattr(puerts.load_type('Puerts.UnitTest.AccessControlHelperPython'), 'StaticMethod', None))
''')
result
");
            Assert.AreEqual(ret, "None");
            pythonEnv.Dispose();
        }

        
        [MonoPInvokeCallback(typeof(V8FunctionCallback))]
        internal static void EmptyCallbackWrap(IntPtr isolate, IntPtr info, IntPtr self, int paramLen, long data)
        {
        }
    }
#endif
    */
}

#endif