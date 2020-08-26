/*
* Tencent is pleased to support the open source community by making Puerts available.
* Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
* Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may be subject to their corresponding license terms. 
* This file is subject to the terms and conditions defined in file 'LICENSE', which is part of this source code package.
*/

using System.Collections.Generic;

namespace Puerts
{
    public struct PropertyRegisterInfo
    {
        public bool IsStatic;
        public V8FunctionCallback Getter;
        public V8FunctionCallback Setter;
    }

    public struct MethodKey
    {
        public string Name;
        public bool IsStatic;
    }

    public class TypeRegisterInfo
    {
        public bool BlittableCopy;

        public V8ConstructorCallback Constructor;

        public Dictionary<MethodKey, V8FunctionCallback> Methods;

        public Dictionary<string, PropertyRegisterInfo> Properties;
    }
}