// using UnityEngine;
// using Puerts;
// using System;
// using System.Runtime.InteropServices;

// namespace PuertsTest
// {
//     //只是演示纯用js实现MonoBehaviour逻辑的可能，
//     //但从性能角度这并不是最佳实践，会导致过多的跨语言调用
//     public class PuertsTest : MonoBehaviour
//     {
//         void Awake()
//         {
//         }

//         void Start()
//         {
//             ByteArrayTest(new byte[3]{ 1, 2, 0 }, 3);
//             ulong l = 18446744073709551615;
//             BigintTest(l);
//             BigintTest(9223372036854775806);
//             BigintTest(9007199254740991);
//             BigintTest(2147483648);
            
//             var ptr = ByteArrayReturnTest();
            
//             byte[] arr2 = new byte[3];
//             Marshal.Copy(ptr, arr2, 0, 3);
//             UnityEngine.Debug.Log(arr2.Length);
//             foreach (byte bb in arr2) {
//                 UnityEngine.Debug.Log(bb);
//             }

//             int a = 2147483640;
//             RefTest(ref a);
//             UnityEngine.Debug.Log(a);
//         }

//         void Update()
//         {
//         }

//         [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
//         public static extern void ByteArrayTest(byte[] byteArr, int length);

//         [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
//         public static extern void BigintTest(ulong bigint);

//         [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
//         public static extern IntPtr ByteArrayReturnTest();
//         // public static extern Byte[] ByteArrayReturnTest();

//         [DllImport("__Internal", CallingConvention = CallingConvention.Cdecl)]
//         public static extern void RefTest(ref int haha);
//     }
// }