/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 Tencent.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Linq;
using System.Runtime.InteropServices;

namespace Puerts
{
    /// <summary>
    /// Marshal extensions for compatibility with older .NET versions
    /// </summary>
    internal static class MarshalExtensions
    {
        /// <summary>
        /// Compatibility method for Marshal.PtrToStringUTF8 to support Unity 2018 and older .NET versions
        /// </summary>
        public static string PtrToStringUTF8(IntPtr ptr)
        {
            if (ptr == IntPtr.Zero)
                return string.Empty;

#if NETSTANDARD2_1_OR_GREATER || NET5_0_OR_GREATER || UNITY_2021_1_OR_NEWER
            return Marshal.PtrToStringUTF8(ptr) ?? string.Empty;
#else
            // Fallback for older .NET versions (Unity 2018, etc.)
            int len = 0;
            while (Marshal.ReadByte(ptr, len) != 0)
                len++;
            
            if (len == 0)
                return string.Empty;
            
            byte[] buffer = new byte[len];
            Marshal.Copy(ptr, buffer, 0, len);
            return System.Text.Encoding.UTF8.GetString(buffer);
#endif
        }

    }
}
