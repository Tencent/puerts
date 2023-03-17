/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Puerts
{
    public class ArrayBuffer
    {
        public byte[] Bytes;
        public int Count;

        public ArrayBuffer(byte[] bytes)
        {
            Bytes = bytes;
            if (Bytes != null)
            {
                Count = Bytes.Length;
            }
        }

        public ArrayBuffer(byte[] bytes, int count)
        {
            Bytes = bytes;
            if (Bytes != null)
            {
                if (count > 0 && count < Bytes.Length)
                {
                    Count = count;
                }
                else
                {
                    Count = Bytes.Length;
                }
            }
        }

#if ENABLE_IL2CPP
        [UnityEngine.Scripting.Preserve]
#endif
        public ArrayBuffer(IntPtr ptr, int length)
        {
            if (ptr != IntPtr.Zero)
            {
                Bytes = new byte[length];
                Count = length;
                System.Runtime.InteropServices.Marshal.Copy(ptr, Bytes, 0, length);
            }
        }
        
#if ENABLE_IL2CPP
        [UnityEngine.Scripting.Preserve]
#endif
        public ArrayBuffer(IntPtr ptr, int length, int notuse) : this(ptr, length) // call by il2cpp
        {
        }
    }

}