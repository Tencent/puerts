/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/
namespace Puerts
{
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

    public class ByteValue : Any<byte>
    {
        public ByteValue(byte i) : base(i)
        {
        }
    }

    public class SByteValue : Any<sbyte>
    {
        public SByteValue(sbyte i) : base(i)
        {
        }
    }

    public class CharValue : Any<char>
    {
        public CharValue(char i) : base(i)
        {
        }
    }

    public class Int16Value : Any<short>
    {
        public Int16Value(short i) : base(i)
        {
        }
    }

    public class UInt16Value : Any<ushort>
    {
        public UInt16Value(ushort i) : base(i)
        {
        }
    }

    public class Int32Value : Any<int>
    {
        public Int32Value(int i) : base(i)
        {
        }
    }

    public class UInt32Value : Any<uint>
    {
        public UInt32Value(uint i) : base(i)
        {
        }
    }

    public class Int64Value : Any<long>
    {
        public Int64Value(long i) : base(i)
        {
        }
    }

    public class UInt64Value : Any<ulong>
    {
        public UInt64Value(ulong i) : base(i)
        {
        }
    }

    public class FloatValue : Any<float>
    {
        public FloatValue(float i) : base(i)
        {
        }
    }
}