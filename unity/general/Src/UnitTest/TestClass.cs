/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

namespace Puerts.UnitTest
{
    public class BaseClass
    {

    }

    public class DerivedClass : BaseClass
    {
        public int Id(int x)
        {
            return x;
        }
    }

    public class ArrayBufferTest
    {
        public ArrayBuffer AB;

        public ArrayBufferTest()
        {
            AB = new ArrayBuffer(new byte[] { 1, 2, 3 });
        }

        public int Sum(ArrayBuffer ab)
        {
            int sum = 0;
            foreach(var b in ab.Bytes)
            {
                sum += b;
            }
            return sum;
        }
    }
}