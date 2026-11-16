using System;

namespace Puerts.UnitTest
{
    // Tester（Assembly-CSharp）同时引用了 Unity 6 Test Framework 的 nunit.framework，直接 typeof(NUnit.Framework.TestAttribute)
    // 会 CS0433；在本程序集内 typeof 只会解析到本地定义。这里的 typeof 引用同时让 IL2CPP 裁剪保留特性类型，
    // 特性类型没被引用时 UnityLinker 会把用例上的 [Test]/[TestFixture] 一起裁掉，反射就找不到用例。
    public static class TestFrameworkTypes
    {
        public static readonly Type TestFixture = typeof(NUnit.Framework.TestFixtureAttribute);
        public static readonly Type Test = typeof(NUnit.Framework.TestAttribute);
    }
}
