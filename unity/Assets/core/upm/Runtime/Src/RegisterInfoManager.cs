using System;
using System.Collections.Generic;

namespace Puerts.TypeMapping
{
    public enum BindingMode {
        FastBinding = 1024, // static wrapper
        LazyBinding = 128,  // reflect during first call
        SlowBinding = 32,   // reflection to call
        DontBinding = 2,    // not able to called in runtime. Also will not generate d.ts
    }

    public enum MemberType
    {
        Constructor = 1,

        Method = 2,
        
        Property = 3,
    }

    public class MemberRegisterInfo 
    {
        public string Name;

        public bool IsStatic;

        public MemberType MemberType; 

        public BindingMode UseBindingMode;
        
#if !EXPERIMENTAL_IL2CPP_PUERTS || !ENABLE_IL2CPP
        public V8ConstructorCallback Constructor;

        public V8FunctionCallback Method;

        public V8FunctionCallback PropertyGetter;

        public V8FunctionCallback PropertySetter;
#endif
    }

    public class RegisterInfo 
    {
        public bool BlittableCopy = false;

        public List<MemberRegisterInfo> Members;
    }

    internal class RegisterInfoManager
    {
        Dictionary<Type, Func<RegisterInfo>> RegisterInfoGetters = new Dictionary<Type, Func<RegisterInfo>>();
        
        internal void Add(Type type, Func<RegisterInfo> RegisterInfoGetter)
        {
            RegisterInfoGetters.Add(type, RegisterInfoGetter);
        }

        internal bool TryGetValue(Type key, out Func<RegisterInfo> value)
        {
            return RegisterInfoGetters.TryGetValue(key, out value);
        }

        internal bool Remove(Type type)
        {
            return RegisterInfoGetters.Remove(type);
        }
    }
}