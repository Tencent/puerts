using Puerts;
using System;
using System.Collections.Generic;

[Configure]
public class PuerCfg {
    [Binding]
    public static List<Type> binding {
        get {
            return new List<Type>{
                typeof(UnityEngine.Color),
                typeof(Dictionary<int, int>),
                typeof(Dictionary<int, int>.Enumerator),
                typeof(List<int>.Enumerator),
                typeof(Puerts.UnitTest.HelperExtension),
                typeof(Puerts.UnitTest.ExtensionTestHelper),
                typeof(Puerts.UnitTest.ExtensionTestHelperDerived),
                typeof(Puerts.UnitTest.ExtensionTestHelper1),
                typeof(Puerts.UnitTest.ExtensionTestHelperDerived1)
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
                typeof(UnityEngine.Color),
            };
        }
    }
}