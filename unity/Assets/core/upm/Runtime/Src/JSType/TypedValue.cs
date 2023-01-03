/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System;
using System.Collections.Generic;

namespace Puerts
{
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public interface TypedValue
    {
        object Target { get; }
    }


    public class Any<T> : TypedValue
    {
        T mTarget;

        public Any(T i)
        {
            mTarget = i;
        }

        public object Target
        {
            get
            {
                return mTarget;
            }
        }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class ByteValue : Any<byte>
    {
        public ByteValue(byte i) : base(i) { }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class SByteValue : Any<sbyte>
    {
        public SByteValue(sbyte i) : base(i) { }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class CharValue : Any<char>
    {
        public CharValue(char i) : base(i) { }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class Int16Value : Any<short>
    {
        public Int16Value(short i) : base(i) { }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class UInt16Value : Any<ushort>
    {
        public UInt16Value(ushort i) : base(i) { }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class Int32Value : Any<int>
    {
        public Int32Value(int i) : base(i) { }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class UInt32Value : Any<uint>
    {
        public UInt32Value(uint i) : base(i) { }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class Int64Value : Any<long>
    {
        public Int64Value(long i) : base(i) { }

        public Int64Value(string str) : base(long.Parse(str)) { }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class UInt64Value : Any<ulong>
    {
        public UInt64Value(ulong i) : base(i) { }

        public UInt64Value(string str) : base(ulong.Parse(str)) { }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class FloatValue : Any<float>
    {
        public FloatValue(float i) : base(i) { }
    }
    
#if ENABLE_IL2CPP
    [UnityEngine.Scripting.Preserve]
#endif
    public class DoubleValue : Any<double>
    {
        public DoubleValue(double i) : base(i) { }
    }
}
