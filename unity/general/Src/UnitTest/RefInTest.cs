using NUnit.Framework;
using System;

namespace Puerts.UnitTest
{
    public static class RefInClass
    {
        public struct Vector3
        {
            public float x, y, z;
            public Vector3(float x, float y, float z)
            {
                this.x = x;
                this.y = y;
                this.z = z;
            }

            public void Normalize()
            {
                float len = (float)Math.Sqrt(x * x + y * y + z * z);
                if (len > 1E-05f)
                {
                    x /= len;
                    y /= len;
                    z /= len;
                }
                else
                {
                    x = y = z = 0;
                }

            }
            public override string ToString()
            {
                return string.Format("({0:F1}, {1:F1}, {2:F1})", x, y, z);
            }
        }


        public static Vector3 Divide(in this Vector3 a, Vector3 b)
        {
            return new Vector3(a.x / b.x, a.y / b.y, a.z / b.z);
        }

        public static Vector3 Multiply(in Vector3 a, in Vector3 b)
        {
            return new Vector3(a.x * b.x, a.y * b.y, a.z * b.z);
        }

        public static Vector3 Normalize(in Vector3 src)
        {
            src.Normalize();
            return src;
        }

    }

    [TestFixture]
    class TestRefIn
    {
        [Test]
        public void WrapTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            PuertsStaticWrap.AutoStaticCodeRegister.Register(jsEnv);
            bool ret = jsEnv.Eval<bool>(@"
                const CS = require('csharp');
                let a = new CS.Puerts.UnitTest.RefInClass.Vector3(1, 2, 3);
                let b = new CS.Puerts.UnitTest.RefInClass.Vector3(1, 2, 3);

                CS.Puerts.UnitTest.RefInClass.Normalize(a).ToString() == `(1.0, 2.0, 3.0)` &&
                CS.Puerts.UnitTest.RefInClass.Multiply(a, b).ToString() == `(1.0, 4.0, 9.0)` &&
                CS.Puerts.UnitTest.RefInClass.Divide(a, b).ToString() == `(1.0, 1.0, 1.0)`;
            ");
            Assert.AreEqual(true, ret);
            jsEnv.Dispose();
        }

        [Test]
        public void ReflectionTest()
        {
            var jsEnv = new JsEnv(new TxtLoader());
            bool ret = jsEnv.Eval<bool>(@"
                const CS = require('csharp');
                let a = new CS.Puerts.UnitTest.RefInClass.Vector3(1, 2, 3);
                let b = new CS.Puerts.UnitTest.RefInClass.Vector3(1, 2, 3);

                CS.Puerts.UnitTest.RefInClass.Normalize(a).ToString() == `(1.0, 2.0, 3.0)` &&
                CS.Puerts.UnitTest.RefInClass.Multiply(a, b).ToString() == `(1.0, 4.0, 9.0)` &&
                CS.Puerts.UnitTest.RefInClass.Divide(a, b).ToString() == `(1.0, 1.0, 1.0)`;
            ");
            Assert.AreEqual(true, ret);
            jsEnv.Dispose();
        }
    }



}